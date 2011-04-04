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
            ticks = this.board.options.line.ticks.defaultDistance;
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
        if(this.visProp.minorheight < 0) {
            this.visProp.minorheight = 2*(this.board.canvasWidth+this.board.canvasHeight);
        }

        if(this.visProp.majorheight < 0) {
            this.visProp.majorheight = 2*(this.board.canvasWidth+this.board.canvasHeight);
        }

            // Point 1 of the line
        var p1 = this.line.point1,
            // Point 2 of the line
            p2 = this.line.point2,
            // Distance between the two points from above
            distP1P2 = p1.coords.distance(JXG.COORDS_BY_USER, p2.coords),
            // Distance of X coordinates of two major ticks
            // Initialized with the distance of Point 1 to a point between Point 1 and Point 2 on the line and with distance 1
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
            // creates a label
            makeLabel = function(pos, newTick, board, drawLabels, id) {
                var labelText, label;

                if (!drawLabels) {
                    return null;
                }
                
                labelText = pos.toString();
                if(labelText.length > 5)
                    labelText = pos.toPrecision(3).toString();
                label = JXG.createText(board, [newTick.usrCoords[1], newTick.usrCoords[2], labelText], {
                    id: id + i + 'Label',
                    isLabel: true,
                    layer: board.options.layer.line
                });
                label.distanceX = 4;
                label.distanceY = -parseInt(label.visProp.fontsize)+3; //-9;
                label.setCoords(newTick.usrCoords[1] + label.distanceX / (board.stretchX),
                                newTick.usrCoords[2] + label.distanceY / (board.stretchY));
                
                label.visProp.visible = drawLabels;
                return label;
            },
            
            respDelta = function(val) {
                return Math.floor(val) - (Math.floor(val) % ticksDelta);
            },
            
            // the following variables are used to define ticks height and slope
            eps = JXG.Math.eps,
            slope = -this.line.getSlope(),
            distMaj = this.visProp.majorheight/2,
            distMin = this.visProp.minorheight/2,
            dxMaj = 0, dyMaj = 0,
            dxMin = 0, dyMin = 0;
            
        // END OF variable declaration
            

        // this piece of code used to be in AbstractRenderer.updateAxisTicksInnerLoop
        // and has been moved in here to clean up the renderers code.
        //
        // The code above only calculates the position of the ticks. The following code parts
        // calculate the dx and dy values which make ticks out of this positions, i.e. from the
        // position (p_x, p_y) calculated above we have to draw a line from
        // (p_x - dx, py - dy) to (p_x + dx, p_y + dy) to get a tick.

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

        // Begin cleanup
        this.removeTickLabels();

        // initialize storage arrays
        // ticks stores the ticks coordinates
        this.ticks = new Array();
        
        // labels stores the text to display beside the ticks
        this.labels = new Array();
        // END cleanup
        
        // calculate start (e1) and end (e2) points
        // for that first copy existing lines point coordinates...
        e1 = new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1], p1.coords.usrCoords[2]], this.board);
        e2 = new JXG.Coords(JXG.COORDS_BY_USER, [p2.coords.usrCoords[1], p2.coords.usrCoords[2]], this.board);
            
        // ... and calculate the drawn start and end point
        JXG.Math.Geometry.calcStraight(this.line, e1, e2);
            
        if(!this.equidistant) {
            // we have an array of fixed ticks we have to draw
            var dx_minus = p1.coords.usrCoords[1]-e1.usrCoords[1];
            var dy_minus = p1.coords.usrCoords[2]-e1.usrCoords[2];
            var length_minus = Math.sqrt(dx_minus*dx_minus + dy_minus*dy_minus);

            var dx_plus = p1.coords.usrCoords[1]-e2.usrCoords[1];
            var dy_plus = p1.coords.usrCoords[2]-e2.usrCoords[2];
            var length_plus = Math.sqrt(dx_plus*dx_plus + dy_plus*dy_plus);

            // new ticks coordinates
            var nx = 0;
            var ny = 0;

            for(i=0; i<this.fixedTicks.length; i++) {
                // is this tick visible?
                if((-length_minus <= this.fixedTicks[i]) && (this.fixedTicks[i] <= length_plus)) {
                    if(this.fixedTicks[i] < 0) {
                        nx = Math.abs(dx_minus) * this.fixedTicks[i]/length_minus;
                        ny = Math.abs(dy_minus) * this.fixedTicks[i]/length_minus;
                    } else {
                        nx = Math.abs(dx_plus) * this.fixedTicks[i]/length_plus;
                        ny = Math.abs(dy_plus) * this.fixedTicks[i]/length_plus;
                    }

                    tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + nx, p1.coords.usrCoords[2] + ny], this.board);
                    this.ticks.push(tickCoords);
                    this.ticks[this.ticks.length-1].major = true;
                    
                    this.labels.push(makeLabel(this.fixedTicks[i], tickCoords, this.board, this.visProp.drawlabels, this.id));
                }
            }
            this.dxMaj = dxMaj;
            this.dyMaj = dyMaj;
            this.dxMin = dxMin;
            this.dyMin = dyMin;
            //this.board.renderer.updateTicks(this, dxMaj, dyMaj, dxMin, dyMin);
            return;
        } // ok, we have equidistant ticks and not special ticks, so we continue here with generating them:
        
        // adjust distances
        while(this.visProp.insertticks && distScr > 4*this.minTicksDistance) {
            ticksDelta /= 10;
            deltaX /= 10;
            deltaY /= 10;

            distScr = p1.coords.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + deltaX, p1.coords.usrCoords[2] + deltaY], this.board));
        }

        // If necessary, enlarge ticksDelta
        while(this.visProp.insertticks && distScr < this.minTicksDistance) {
            ticksDelta *= factor;
            deltaX *= factor;
            deltaY *= factor;

            factor = (factor == 5 ? 2 : 5);
            distScr = p1.coords.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + deltaX, p1.coords.usrCoords[2] + deltaY], this.board));
        }

        /*
         * In the following code comments are sometimes talking about "respect ticksDelta". this could be done
         * by calculating the modulus of the distance wrt to ticksDelta and add resp. subtract a ticksDelta from that.
         */

        // p1 is outside the visible area or the line is a segment
        if(JXG.Math.Geometry.isSameDirection(p1.coords, e1, e2)) {
            // calculate start and end points
            begin = respDelta(p1.coords.distance(JXG.COORDS_BY_USER, e1));
            end = p1.coords.distance(JXG.COORDS_BY_USER, e2);
            
            if(JXG.Math.Geometry.isSameDirection(p1.coords, p2.coords, e1)) {
                if(this.line.visProp.straightfirst)
                    begin -=  2*ticksDelta;
            } else {
                end = -1*end;
                begin = -1*begin;
                if(this.line.visProp.straightfirst)
                    begin -= 2*ticksDelta
            }
            
            // TODO: We should check here if the line is visible at all. If it's not visible but
            // close to the viewport there may be drawn some ticks without a line visible.
            
        } else {
            // p1 is inside the visible area and direction is PLUS

            // now we have to calculate the index of the first tick
            if(!this.line.visProp.straightfirst) {
                begin = 0; 
            } else {
                begin = -respDelta(p1.coords.distance(JXG.COORDS_BY_USER, e1)) - 2*ticksDelta;
            }
            
            if(!this.line.visProp.straightlast) {
                end = distP1P2;
            } else {
                end = p1.coords.distance(JXG.COORDS_BY_USER, e2);
            }
        }

        startTick = new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + begin*deltaX/ticksDelta, p1.coords.usrCoords[2] + begin*deltaY/ticksDelta], this.board);
        tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [p1.coords.usrCoords[1] + begin*deltaX/ticksDelta, p1.coords.usrCoords[2] + begin*deltaY/ticksDelta], this.board);
        
        deltaX /= this.visProp.minorticks+1;
        deltaY /= this.visProp.minorticks+1;
        
        // After all the precalculations from above here finally comes the tick-production:
        i = 0;
        tickPosition = begin;
        while(startTick.distance(JXG.COORDS_BY_USER, tickCoords) < Math.abs(end - begin) + JXG.Math.eps) {
            if(i % (this.visProp.minorticks+1) == 0) {
                tickCoords.major = true;
                this.labels.push(makeLabel(tickPosition, tickCoords, this.board, this.visProp.drawlabels, this.id));
                tickPosition += ticksDelta;
            } else {
                tickCoords.major = false;
                this.labels.push(null);
            }
            i++;

            this.ticks.push(tickCoords);
            tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [tickCoords.usrCoords[1] + deltaX, tickCoords.usrCoords[2] + deltaY], this.board);
            if(!this.visProp.drawzero && tickCoords.distance(JXG.COORDS_BY_USER, p1.coords) <= JXG.Math.eps) {
                // zero point is always a major tick. hence, we have to set i = 0;
                i++;
                tickPosition += ticksDelta;
                tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [tickCoords.usrCoords[1] + deltaX, tickCoords.usrCoords[2] + deltaY], this.board);
            }
        }

        this.dxMaj = dxMaj;
        this.dyMaj = dyMaj;
        this.dxMin = dxMin;
        this.dyMin = dyMin;
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
                        this.board.renderer.remove(this.labels[j].rendNode);
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
                this.board.renderer.updateTicks(this, this.dxMaj, this.dyMaj, this.dxMin, this.dyMin);
            }
            this.needsUpdate = false;
        }
        return this;
    }
});

/**
 * Creates new ticks.
 * @param {JXG.Board} board The board the ticks are put on.
 * @param {Array} parents Array containing a line and an array of positions, where ticks should be put on that line or
 *   a function that calculates the distance based on the ticks number that is given as a parameter. E.g.:<br />
 *   <tt>var ticksFunc = function(i) {</tt><br />
 *   <tt>    return 2;</tt><br />
 *   <tt>}</tt><br />
 *   for ticks with distance 2 between each tick.
 * @param {Object} attributes Object containing properties for the element such as stroke-color and visibility. See @see JXG.GeometryElement#setProperty
 * @type JXG.Ticks
 * @return Reference to the created ticks object.
 */
JXG.createTicks = function(board, parents, attributes) {
    var el,
        attr = JXG.copyAttributes(attributes, board.options, 'ticks');

    if ( (parents[0].elementClass == JXG.OBJECT_CLASS_LINE) && (JXG.isFunction(parents[1]) || JXG.isArray(parents[1]) || JXG.isNumber(parents[1]))) {
        el = new JXG.Ticks(parents[0], parents[1], attr);
    } else
        throw new Error("JSXGraph: Can't create Ticks with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");

    return el;
};

JXG.JSXGraph.registerElement('ticks', JXG.createTicks);
