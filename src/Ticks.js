/*
    Copyright 2008,2009
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview In this file the geometry object Ticks is defined. Ticks provides
 * methods for creation and management of ticks on an axis.
 * @author graphjs
 * @version 0.1
 */

/**
 * Creates ticks for an axis.
 * @class Ticks provides methods for creation and management
 * of ticks on an axis.
 * @param {JXG.Line} line Reference to the axis the ticks are drawn on.
 * @param {Number|Array} ticks Number defining the distance between two major ticks or an array defining static ticks.
 * @param {Object} attributes Properties
 * @see JXG.Line#addTicks
 * @constructor
 * @extends JXG.GeometryElement
 */
JXG.Ticks = function (line, ticks, attributes) {
    this.constructor(line.board, attributes, JXG.OBJECT_TYPE_TICKS, JXG.OBJECT_CLASS_OTHER);

    /**
     * The line the ticks belong to.
     * @type JXG.Line
     */
    this.line = line;

    /**
     * The board the ticks line is drawn on.
     * @type JXG.Board
     */
    this.board = this.line.board;

    /**
     * A function calculating ticks delta depending on the ticks number.
     * @type Function
     */
    this.ticksFunction = null;

    /**
     * Array of fixed ticks.
     * @type Array
     */
    this.fixedTicks = null;

    /**
     * Equidistant ticks. Distance is defined by ticksFunction
     * @type Boolean
     */
    this.equidistant = false;

    if(JXG.isFunction(ticks)) {
        this.ticksFunction = ticks;
        throw new Error("Function arguments are no longer supported.");
    } else if(JXG.isArray(ticks)) {
        this.fixedTicks = ticks;
    } else {
        if(Math.abs(ticks) < JXG.Math.eps)
            ticks = attributes.defaultdistance;
        this.ticksFunction = function (i) { return ticks; };
        this.equidistant = true;
    }

    /**
     * Least distance between two ticks, measured in pixels.
     * @type int
     */
    this.minTicksDistance = attributes.minticksdistance;

    /**
     * Maximum distance between two ticks, measured in pixels. Is used only when insertTicks
     * is set to true.
     * @type int
     * @see #insertTicks
     * @deprecated This value will be ignored.
     */
    this.maxTicksDistance = attributes.maxticksdistance;

    /**
     * Array where the labels are saved. There is an array element for every tick,
     * even for minor ticks which don't have labels. In this case the array element
     * contains just <tt>null</tt>.
     * @type Array
     */
    this.labels = [];

    this.id = this.line.addTicks(this);
    this.board.setId(this,'Ti');
};

JXG.Ticks.prototype = new JXG.GeometryElement();

JXG.extend(JXG.Ticks.prototype, /** @lends JXG.Ticks.prototype */ {
    // documented in JXG.GeometryElement
    hasPoint: function (x, y) {
       return false;
    },

    /**
     * (Re-)calculates the ticks coordinates.
     */
    calculateTicksCoordinates: function() {
        
        /*
         * Known bugs:
         *   * Special ticks behave oddly. See example ticked_lines.html and drag P2 around P1.
         */
        
            // Point 1 of the line
        var p1 = this.line.point1,
            // Point 2 of the line
            p2 = this.line.point2,
            // Distance between the two points from above
            distP1P2 = p1.Dist(p2),
            // Distance of X coordinates of two major ticks
            // Initialized with the distance of Point 1 to a point between Point 1 and Point 2 on the line and with distance 1
            // this equals always 1 for lines parallel to x = 0 or y = 0. It's only important for lines other than that.
            deltaX = (p2.coords.usrCoords[1] - p1.coords.usrCoords[1])/distP1P2,
            // The same thing for Y coordinates
            deltaY = (p2.coords.usrCoords[2] - p1.coords.usrCoords[2])/distP1P2,
            // Distance of p1 to the unit point in screen coordinates
            distScr = p1.coords.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + deltaX, p1.coords.usrCoords[2] + deltaY], this.board)),
            // Distance between two major ticks in user coordinates
            ticksDelta = (this.equidistant ? this.ticksFunction(1) : 1),
            // This factor is for enlarging ticksDelta and it switches between 5 and 2
            // Hence, if two major ticks are too close together they'll be expanded to a distance of 5
            // if they're still too close together, they'll be expanded to a distance of 10 etc
            factor = 5,
            // Edge points: This is where the display of the line starts and ends, e.g. the intersection points
            // of the line with the edges of the viewing area if the line is a straight.
            e1, e2,
            // what's the first/last tick to draw?
            begin, end,
            // Coordinates of the current tick
            tickCoords,
            // Coordinates of the first drawn tick
            startTick,
            // a counter
            i,
            // the distance of the tick to p1. Is displayed on the board using a label
            // for majorTicks
            tickPosition,
            // infinite or finite tick length
            style,
            // new position 
            nx = 0,
            ny = 0,
            ti,
            respDelta = function(val) {
                return Math.ceil(val/ticksDelta)*ticksDelta;
            },
            
            // the following variables are used to define ticks height and slope
            eps = JXG.Math.eps,
            dn,
            slope = -this.line.getSlope(),
            distMaj = this.visProp.majorheight/2,
            distMin = this.visProp.minorheight/2,
            dxMaj = 0, dyMaj = 0,
            dxMin = 0, dyMin = 0;
        // END OF variable declaration

           
        // Grid-like ticks
        if (this.visProp.minorheight < 0)  {
            this.minStyle = 'infinite';
        } else {
            this.minStyle = 'finite';
        }
            

        if(this.visProp.majorheight < 0) {
            this.majStyle = 'infinite';
        } else {
            this.majStyle = 'finite';
        }

        // this piece of code used to be in AbstractRenderer.updateAxisTicksInnerLoop
        // and has been moved in here to clean up the renderers code.
        //
        // The code above only calculates the position of the ticks. The following code parts
        // calculate the dx and dy values which make ticks out of this positions, i.e. from the
        // position (p_x, p_y) calculated above we have to draw a line from
        // (p_x - dx, py - dy) to (p_x + dx, p_y + dy) to get a tick.
        /*
        if(Math.abs(slope) < eps) {
            // if the slope of the line is (almost) 0, we can set dx and dy directly
            dxMaj = 0;
            dyMaj = distMaj;
            dxMin = 0;
            dyMin = distMin;
        } else if((Math.abs(slope) > 1/eps) || (isNaN(slope))) {
            // if the slope of the line is (theoretically) infinite, we can set dx and dy directly
            dxMaj = distMaj;
            dyMaj = 0;
            dxMin = distMin;
            dyMin = 0;
        } else {
            // here we have to calculate dx and dy depending on the slope and the length of the tick (dist)
            // if slope is the line's slope, the tick's slope is given by
            //
            //            1          dy
            //     -   -------  =   ----                 (I)
            //          slope        dx
            //
            // when dist is the length of the tick, using the pythagorean theorem we get
            //
            //     dx*dx + dy*dy = dist*dist             (II)
            //
            // dissolving (I) by dy and applying that to equation (II) we get the following formulas for dx and dy
            dxMaj = -distMaj/Math.sqrt(1/(slope*slope) + 1);
            dyMaj = dxMaj/slope;
            dxMin = -distMin/Math.sqrt(1/(slope*slope) + 1);
            dyMin = dxMin/slope;
        }
        */
        dxMaj = this.line.stdform[1];
        dyMaj = this.line.stdform[2];
        dxMin = dxMaj;
        dyMin = dyMaj;
        dn = Math.sqrt(dxMaj*dxMaj + dyMaj*dyMaj);
        dxMaj *= distMaj/dn;
        dyMaj *= distMaj/dn;
        dxMin *= distMin/dn;
        dyMin *= distMin/dn;

        // Begin cleanup
        this.removeTickLabels();

        // initialize storage arrays
        // ticks stores the ticks coordinates
        this.ticks = [];
        
        // labels stores the text to display beside the ticks
        this.labels = [];
        // END cleanup
        
        // calculate start (e1) and end (e2) points
        // for that first copy existing lines point coordinates...
        e1 = new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1], p1.coords.usrCoords[2]], this.board);
        e2 = new JXG.Coords(JXG.COORDS_BY_USER, [p2.coords.usrCoords[1], p2.coords.usrCoords[2]], this.board);
            
        // ... and calculate the drawn start and end point
        JXG.Math.Geometry.calcStraight(this.line, e1, e2);
            
        // we have an array of fixed ticks we have to draw
        if(!this.equidistant) {
            for (i = 0; i < this.fixedTicks.length; i++) {
                nx = p1.coords.usrCoords[1] + this.fixedTicks[i]*deltaX;
                ny = p1.coords.usrCoords[2] + this.fixedTicks[i]*deltaY;
                tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
                
                ti = this._tickEndings(tickCoords, dxMaj, dyMaj, dxMin, dyMin, /*major:*/ true);
                if (ti.length==2) {
                    this.ticks.push(ti);
                }
                this.labels.push(this._makeLabel(this.fixedTicks[i], tickCoords, this.board, this.visProp.drawlabels, this.id, i));
                // visibility test missing
            }
            return;
        } 
        
        // ok, we have equidistant ticks and not special ticks, so we continue here with generating them:
        // adjust distances
        if (this.visProp.insertticks && this.minTicksDistance > JXG.Math.eps) {
            ticksDelta = this._adjustTickDistance(ticksDelta, distScr, factor, p1.coords, deltaX, deltaY);
        }

        /*
         * In the following code comments are sometimes talking about "respect ticksDelta". this could be done
         * by calculating the modulus of the distance wrt to ticksDelta and add resp. subtract a ticksDelta from that.
         */
        // p1 is outside the visible area or the line is a segment
        /*
        if(JXG.Math.Geometry.isSameDirection(p1.coords, e1, e2)) {
            // calculate start and end points
            begin = p1.coords.distance(JXG.COORDS_BY_USER, e1);
            end = p1.coords.distance(JXG.COORDS_BY_USER, e2);

            if(JXG.Math.Geometry.isSameDirection(p1.coords, p2.coords, e1)) {
                if(this.line.visProp.straightfirst) {
                    begin -=  2*ticksDelta;
                }
            } else {
                end = -1*end;
                begin = -1*begin;
                if (this.line.visProp.straightfirst) {
                    begin -= 2*ticksDelta
                }
            }

            if (begin > end) {
                i = begin;
                begin = end;
                end = i;
            }

            begin = respDelta(begin);
            if (this.line.visProp.straightlast) {
                end += 2*ticksDelta;
            }
            // TODO: We should check here if the line is visible at all. If it's not visible but
            // close to the viewport there may be drawn some ticks without a line visible.
            
        } else {
            // p1 is inside the visible area and direction is PLUS
            // now we have to calculate the index of the first tick
            if(!this.line.visProp.straightfirst) {
                begin = 0; 
            } else {
                begin = -respDelta(p1.coords.distance(JXG.COORDS_BY_USER, e1));
            }
            
            if(!this.line.visProp.straightlast) {
                end = distP1P2;
            } else {
                end = p1.coords.distance(JXG.COORDS_BY_USER, e2);
            }
        }

        nx = p1.coords.usrCoords[1] + begin*deltaX;
        ny = p1.coords.usrCoords[2] + begin*deltaY;
        startTick = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
        tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
        
        deltaX /= this.visProp.minorticks+1;
        deltaY /= this.visProp.minorticks+1;
        
        // After all the precalculations from above here finally comes the tick-production:
        i = 0;
        tickPosition = begin;
        while(startTick.distance(JXG.COORDS_BY_USER, tickCoords) < Math.abs(end - begin) + JXG.Math.eps) {
            if(i % (this.visProp.minorticks+1) === 0) {
                tickCoords.major = true;
            } else {
                tickCoords.major = false;
                this.labels.push(null);
            }
            i++;

            ti = this._tickEndings(tickCoords, dxMaj, dyMaj, dxMin, dyMin, tickCoords.major);
            if (ti.length==2) {
                this.ticks.push(ti);
                if (tickCoords.major) {
                this.labels.push(this._makeLabel(tickPosition, tickCoords, this.board, this.visProp.drawlabels, this.id, i));
                tickPosition += ticksDelta;
            }
            }

            // Compute next position
            nx = tickCoords.usrCoords[1] + deltaX*ticksDelta;
            ny = tickCoords.usrCoords[2] + deltaY*ticksDelta
            tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
            
            // Handle the tick at zero.
            if(!this.visProp.drawzero && tickCoords.distance(JXG.COORDS_BY_USER, p1.coords) <= JXG.Math.eps) {
                // zero point is always a major tick. hence, we have to set i = 0;
                i++;
                tickPosition += ticksDelta;
                tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
            }
        }
        */
        var dirs = 2, dir = -1, centerX, centerY, d;
        
        nx = (e1.usrCoords[1]+e2.usrCoords[1])*0.5;
        ny = (e1.usrCoords[2]+e2.usrCoords[2])*0.5;
        tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
        d = p1.coords.distance(JXG.COORDS_BY_USER, tickCoords);
        if ((p2.X()-p1.X())*(nx-p1.X())<0 || (p2.Y()-p1.Y())*(ny-p1.Y())<0) {
            d *= -1;
        }
        tickPosition = Math.round(d/(this.visProp.minorticks+1))*(this.visProp.minorticks+1);
        if (Math.abs(tickPosition)>JXG.Math.eps) {
            dir = Math.abs(tickPosition)/tickPosition;
        }

        centerX = p1.coords.usrCoords[1] + deltaX*tickPosition;
        centerY = p1.coords.usrCoords[2] + deltaY*tickPosition;
        startTick = tickPosition;
        tickPosition = 0;
        
        nx = centerX;
        ny = centerY;
        i = 0;          // counter for label ids
        do {
            tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
            if (Math.round((tickPosition+startTick)) % (this.visProp.minorticks+1) === 0) {
                tickCoords.major = true;
            } else {
                tickCoords.major = false;
            }
            
            ti = this._tickEndings(tickCoords, dxMaj, dyMaj, dxMin, dyMin, tickCoords.major);
            if (ti.length==2) {
                if (this.visProp.drawzero || dir*tickPosition+startTick!=0) {
                    this.ticks.push(ti);
                    if (tickCoords.major) {
                        this.labels.push(this._makeLabel(dir*tickPosition+startTick, tickCoords, this.board, this.visProp.drawlabels, this.id, i));
                    } else {
                        this.labels.push(null);
                    }
                    i++;
                }
                
                if (dirs==2) {
                    dir *= (-1);
                        
                } 
                if (dir==1 || dirs==1) {
                    tickPosition += ticksDelta;
                }
            } else {
                dir *= (-1);
                dirs--;
            }
            
            nx = centerX + dir*deltaX*tickPosition;
            ny = centerY + dir*deltaY*tickPosition;
        } while (dirs>0);
        
    },
    
    _adjustTickDistance: function(ticksDelta, distScr, factor, p1c, deltaX, deltaY) {
        var nx, ny;
        
        while (distScr > 4*this.minTicksDistance) {
            ticksDelta /= 10;
            nx = p1c.usrCoords[1] + deltaX*ticksDelta;
            ny = p1c.usrCoords[2] + deltaY*ticksDelta;
            distScr = p1c.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board));
        }

        // If necessary, enlarge ticksDelta
        while (distScr < this.minTicksDistance) {
            ticksDelta *= factor;
            factor = (factor == 5 ? 2 : 5);
            nx = p1c.usrCoords[1] + deltaX*ticksDelta;
            ny = p1c.usrCoords[2] + deltaY*ticksDelta;
            distScr = p1c.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board));
        }
        return ticksDelta;
    },
    
    _tickEndings: function(coords, dxMaj, dyMaj, dxMin, dyMin, major) {
        var i, c, 
            x = [-1, -1],
            y = [-1, -1], 
            dx, dy,
            s, style, 
            count = 0, 
            cw = this.board.canvasWidth,
            ch = this.board.canvasHeight;

            c = coords.scrCoords;
            if (major) {
                dx = dxMaj;
                dy = dyMaj;
                style = this.majStyle;
            } else {
                dx = dxMin;
                dy = dyMin;
                style = this.minStyle;
            }
            
            // finite tick length
            if (style=='finite') {
                x[0] = c[1] + dx;
                y[0] = c[2] - dy;
                x[1] = c[1] - dx;
                y[1] = c[2] + dy;
            // infinite tick length, grid-like
            } else {
                // vertical 
                if (Math.abs(dx)<JXG.Math.eps) {
                    x[0] = c[1];
                    x[1] = c[1];
                    y[0] = 0;
                    y[1] = ch;
                // horizontal
                } else if (Math.abs(dy)<JXG.Math.eps) {
                    x[0] = 0;
                    x[1] = cw;
                    y[0] = c[2];
                    y[1] = c[2];
                // other
                } else {
                    j = 0;
                    s = JXG.Math.crossProduct([0,0,1], [-dy*c[1]-dx*c[2], dy, dx]); // intersect with top
                    s[1] /= s[0];
                    if (s[1]>=0 && s[1]<=cw) {  
                        x[j] = s[1];
                        y[j] = 0;
                        j++;
                    }
                    s = JXG.Math.crossProduct([0,1,0], [-dy*c[1]-dx*c[2], dy, dx]); // intersect with left
                    s[2] /= s[0];
                    if (s[2]>=0 && s[2]<=ch) {  
                        x[j] = 0;
                        y[j] = s[2];
                        j++;
                    }
                    if (j<2) {
                        s = JXG.Math.crossProduct([ch*ch,0,-ch], [-dy*c[1]-dx*c[2], dy, dx]); // intersect with bottom
                        s[1] /= s[0];
                        if (s[1]>=0 && s[1]<=cw) {  
                            x[j] = s[1];
                            y[j] = ch;
                            j++;
                        }
                    }
                    if (j<2) {
                        s = JXG.Math.crossProduct([cw*cw, -cw, 0], [-dy*c[1]-dx*c[2], dy, dx]); // intersect with right
                        s[2] /= s[0];
                        if (s[2]>=0 && s[2]<=ch) {  
                            x[j] = cw;
                            y[j] = s[2];
                        }
                    }
                }
            }
            // We allow ticks to be outside of the visible region.
            // This prents that small minor ticks outside of the canvas
            // prevent the display of major ticks that intersect the canvas.
            if ((x[0]>=-0.5*cw && x[0]<=1.5*cw && y[0]>=-0.5*ch && y[0]<=1.5*ch ) 
                || 
                (x[1]>=-0.5*cw && x[1]<=1.5*cw && y[1]>=-0.5*ch && y[1]<=1.5*ch)
               ) {
                return [x,y];
            } else { 
                return [];
            }
    },

    /** 
     * Create a tick label 
     * @private
     **/
    _makeLabel: function(pos, newTick, board, drawLabels, id, i) {
                var labelText, label;

                if (!drawLabels) {
                    return null;
                }
                
                labelText = pos.toString();
                if (Math.abs(pos) < JXG.Math.eps) {
                    labelText = '0';
                }

                if(labelText.length > 5 || labelText.indexOf('e') != -1) {
                    labelText = pos.toPrecision(3).toString();
                }
                if (labelText.indexOf('.') > -1) {
                    // trim trailing zeros
                    labelText = labelText.replace(/0+$/, '');
                    // trim trailing .
                    labelText = labelText.replace(/\.$/, '');
                }
                
                label = JXG.createText(board, [newTick.usrCoords[1], newTick.usrCoords[2], labelText], {
                    id: id + i + 'Label',
                    isLabel: true,
                    layer: board.options.layer.line,
                    highlightStrokeColor: board.options.text.strokeColor,
                    highlightStrokeWidth: board.options.text.strokeWidth,
                    highlightStrokeOpacity: board.options.text.strokeOpacity
                });
                label.isDraggable = false;
                label.dump = false;
                label.distanceX = 4;
                label.distanceY = -parseInt(label.visProp.fontsize)+3; //-9;
                label.setCoords(newTick.usrCoords[1] + label.distanceX / (board.unitX),
                                newTick.usrCoords[2] + label.distanceY / (board.unitY));
                
                label.visProp.visible = drawLabels;
                label.prepareUpdate().update().updateRenderer();
                return label;
     },

    /**
     * Removes the HTML divs of the tick labels
     * before repositioning
     */
    removeTickLabels: function () {
        var j;

        // remove existing tick labels
        if(this.ticks != null) {
            if ((this.board.needsFullUpdate||this.needsRegularUpdate) &&
                !(this.board.options.renderer=='canvas'&&this.board.options.text.display=='internal')
               ) {
                for(j=0; j<this.ticks.length; j++) {
                    if(this.labels[j]!=null && this.labels[j].visProp.visible) {
//                        this.board.renderer.remove(this.labels[j].rendNode);
                        this.board.removeObject(this.labels[j]);
                    }
                }
            }
        }
    },

    /**
     * Recalculate the tick positions and the labels.
     */
    update: function () {
        if (this.needsUpdate) {
            this.calculateTicksCoordinates();
        }
        return this;
    },

    /**
     * Uses the boards renderer to update the arc.
     */
    updateRenderer: function () {
        if (this.needsUpdate) {
            if (this.ticks) {
                this.board.renderer.updateTicks(this, this.dxMaj, this.dyMaj, this.dxMin, this.dyMin, this.minStyle, this.majStyle);
            }
            this.needsUpdate = false;
        }
        return this;
    },

    hideElement: function () {
        var i;

        this.visProp.visible = false;
        this.board.renderer.hide(this);

        for (i=0; i<this.labels.length; i++) {
            if (JXG.exists(this.labels[i]))
                this.labels[i].hideElement();
        }

        return this;
    },

    showElement: function () {
        var i;

        this.visProp.visible = true;
        this.board.renderer.show(this);

        for (i=0; i<this.labels.length; i++) {
            if (JXG.exists(this.labels[i]))
                this.labels[i].showElement();
        }

        return this;
    }
});

/**
 * @class Ticks are used as distance markers on a line.
 * @pseudo
 * @description
 * @name Ticks
 * @augments JXG.Ticks
 * @constructor
 * @type JXG.Ticks
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line,Number} line,_distance The parents consist of the line the ticks are going to be attached to and optional the
 * distance between two major ticks. If no distance is given the attribute {@link JXG.Ticks#ticksDistance} is used.
 * @example
 * // Create an axis providing two coord pairs.
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('ticks', [l1], {ticksDistance: 2});
 * </pre><div id="ee7f2d68-75fc-4ec0-9931-c76918427e63" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('ee7f2d68-75fc-4ec0-9931-c76918427e63', {boundingbox: [-1, 7, 7, -1], showcopyright: false, shownavigation: false});
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('ticks', [l1], {ticksDistance: 2});
 * })();
 * </script><pre>
 */
JXG.createTicks = function(board, parents, attributes) {
    var el, dist,
        attr = JXG.copyAttributes(attributes, board.options, 'ticks');

    if (parents.length < 2) {
        dist = attributes.ticksDistance;
    } else {
        dist = parents[1];
    }

    if ( (parents[0].elementClass == JXG.OBJECT_CLASS_LINE) && (JXG.isFunction(parents[1]) || JXG.isArray(parents[1]) || JXG.isNumber(parents[1]))) {
        el = new JXG.Ticks(parents[0], dist, attr);
    } else
        throw new Error("JSXGraph: Can't create Ticks with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");

    return el;
};

JXG.JSXGraph.registerElement('ticks', JXG.createTicks);
