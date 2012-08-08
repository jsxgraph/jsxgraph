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
        var i, t,
            len = this.ticks.length,
            r = this.board.options.precision.hasPoint;
            
        for (i=0; i<len; i++) {
            t = this.ticks[i];
            if (Math.abs(t[0][0]-t[0][1])>=1 || Math.abs(t[1][0]-t[1][1])>=1) { // not a zero length tick
                if (t[0][0]-r<x && x < t[0][1]+r && t[1][0]-r<y && y < t[1][1]+r) {
                    return true;
                }
            }
        }
        
       return false;
    },

    /**
     * (Re-)calculates the ticks coordinates.
     */
    calculateTicksCoordinates: function() {
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
            symbTicksDelta, f,
            // This factor is for enlarging ticksDelta and it switches between 5 and 2
            // Hence, if two major ticks are too close together they'll be expanded to a distance of 5
            // if they're still too close together, they'll be expanded to a distance of 10 etc
            factor = 5,
            // Coordinates of the current tick
            tickCoords,
            // Coordinates of the first drawn tick
            startTick,
            symbStartTick,
            // two counters
            i, j,
            // the distance of the tick to p1. Is displayed on the board using a label
            // for majorTicks
            tickPosition,
            symbTickPosition,
            // infinite or finite tick length
            style,
            // new position
            nx = 0,
            ny = 0,
            ti,
			dirs = 2, dir = -1, 
			center, d, bb, perp,
            
            // the following variables are used to define ticks height and slope
            eps = JXG.Math.eps, pos, lb, ub,
            distMaj = this.visProp.majorheight * 0.5,
            distMin = this.visProp.minorheight * 0.5,
            // ticks width and height in screen units
            dxMaj, dyMaj,
            dxMin, dyMin,
            // ticks width and height in user units
            dx, dy;
        // END OF variable declaration

        // This will trap this update routine in an endless loop. Besides, there's not much we can show
        // on such a tiny board, so we just get out of here immediately.
        if (this.board.canvasWidth === 0 || this.board.canvasHeight === 0) {
            return;
        }

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

        // Set lower and upper bound for the tick distance.
        // This is necessary for segments.
        if (this.line.visProp.straightfirst) {
            lb = Number.NEGATIVE_INFINITY;
        } else {
            lb = 0 + eps;
        }

        if (this.line.visProp.straightlast) {
            ub = Number.POSITIVE_INFINITY;
        } else {
            ub = distP1P2 - eps;
        }

        // This piece of code used to be in AbstractRenderer.updateAxisTicksInnerLoop
        // and has been moved in here to clean up the renderers code.
        //
        // The code above only calculates the position of the ticks. The following code parts
        // calculate the dx and dy values which make ticks out of this positions, i.e. from the
        // position (p_x, p_y) calculated above we have to draw a line from
        // (p_x - dx, py - dy) to (p_x + dx, p_y + dy) to get a tick.
        dxMaj = this.line.stdform[1];
        dyMaj = this.line.stdform[2];
        dxMin = dxMaj;
        dyMin = dyMaj;
        dx = dxMaj;
        dy = dyMaj;
        
        // After this, the length of the vector (dxMaj, dyMaj) in screen coordinates is equal to distMaj pixel.
        d = Math.sqrt(dxMaj*dxMaj*this.board.unitX*this.board.unitX + dyMaj*dyMaj*this.board.unitY*this.board.unitY);
        dxMaj *= distMaj/d*this.board.unitX;
        dyMaj *= distMaj/d*this.board.unitY;
        dxMin *= distMin/d*this.board.unitX;
        dyMin *= distMin/d*this.board.unitY;

        // Begin cleanup
        this.removeTickLabels();
        
        // If the parent line is not finite, we can stop here.
        if (Math.abs(dx)<JXG.Math.eps && Math.abs(dy)<JXG.Math.eps) {
            return;
        }

        // initialize storage arrays
        // ticks stores the ticks coordinates
        this.ticks = [];
        
        // labels stores the text to display beside the ticks
        this.labels = [];
        // END cleanup
        
        // we have an array of fixed ticks we have to draw
        if (!this.equidistant) {
            for (i = 0; i < this.fixedTicks.length; i++) {
                nx = p1.coords.usrCoords[1] + this.fixedTicks[i]*deltaX;
                ny = p1.coords.usrCoords[2] + this.fixedTicks[i]*deltaY;
                tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);
                
                ti = this._tickEndings(tickCoords, dx, dy, dxMaj, dyMaj, dxMin, dyMin, /*major:*/ true);
				// Compute the start position and the end position of a tick.
				// If both positions are out of the canvas, ti is empty.
                if (ti.length==2 && this.fixedTicks[i]>=lb && this.fixedTicks[i]<ub) {
                    this.ticks.push(ti);
                }
                this.labels.push(this._makeLabel(this.visProp.labels[i] || this.fixedTicks[i], tickCoords, this.board, this.visProp.drawlabels, this.id, i));
                // visibility test missing
            }
            return;
        }

        symbTicksDelta = ticksDelta;
        ticksDelta *= this.visProp.scale;

        // ok, we have equidistant ticks and not special ticks, so we continue here with generating them:
        // adjust distances
        if (this.visProp.insertticks && this.minTicksDistance > JXG.Math.eps) {
            f = this._adjustTickDistance(ticksDelta, distScr, factor, p1.coords, deltaX, deltaY);
            ticksDelta *= f;
            symbTicksDelta *= f;
        }

        if (!this.visProp.insertticks) {
            ticksDelta /= this.visProp.minorticks+1;
            symbTicksDelta /= this.visProp.minorticks+1;
        }

        this.ticksDelta = ticksDelta;
        this.symbTicksDelta = symbTicksDelta;


		// We shoot into the middle of the canvas
		// to the tick position which is closest to the center
		// of the canvas. We do this by an orthogonal projection
		// of the canvas center to the line and by rounding of the
		// distance of the projected point to point1 of the line.
		// This position is saved in
		// center and startTick.
        bb = this.board.getBoundingBox();
        nx = (bb[0]+bb[2])*0.5;
        ny = (bb[1]+bb[3])*0.5;
		
		// Project the center of the canvas to the line.
		perp = [nx*this.line.stdform[2]-ny*this.line.stdform[1], 
				-this.line.stdform[2], 
				 this.line.stdform[1]];
		center = JXG.Math.crossProduct(this.line.stdform, perp);
		center[1] /= center[0];
		center[2] /= center[0];
		center[0] = 1;
		// Round the distance of center to point1
        tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, center.slice(1), this.board);
        d = p1.coords.distance(JXG.COORDS_BY_USER, tickCoords);
        if ((p2.X()-p1.X())*(center[1]-p1.X())<0 || (p2.Y()-p1.Y())*(center[2]-p1.Y())<0) {
            d *= -1;
        }
        tickPosition = Math.round(d/ticksDelta)*ticksDelta;

		// Find the correct direction of center from point1
        if (Math.abs(tickPosition)>JXG.Math.eps) {
            dir = Math.abs(tickPosition)/tickPosition;
        }
		// From now on, we jump around center
        center[1] = p1.coords.usrCoords[1] + deltaX*tickPosition;
        center[2] = p1.coords.usrCoords[2] + deltaY*tickPosition;
        startTick = tickPosition;
        tickPosition = 0;

        symbTickPosition = 0;
        // this could be done more elaborate to prevent rounding errors
        symbStartTick = startTick/this.visProp.scale;

        nx = center[1];
        ny = center[2];
        i = 0;          // counter for label ids
        j = 0;
		// Now, we jump around center
		// until we are outside of the canvas.
		// If this is the case we proceed in the other
		// direction until we are out of the canvas in this direction, too.
		// Then we are done.
        do {
            tickCoords = new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board);

			// Test if tick is a major tick.
            // This is the case if (dir*tickPosition+startTick)/ticksDelta is
            // a multiple of the number of minorticks+1
            tickCoords.major = Math.round((dir * tickPosition + startTick) / ticksDelta) % (this.visProp.minorticks + 1) === 0;
            
			// Compute the start position and the end position of a tick.
			// If both positions are out of the canvas, ti is empty.
            ti = this._tickEndings(tickCoords, dx, dy, dxMaj, dyMaj, dxMin, dyMin, tickCoords.major);
            if (ti.length==2) {  // The tick has an overlap with the board
                pos = dir*symbTickPosition+symbStartTick;
                if ( (Math.abs(pos)<=eps && this.visProp.drawzero)
                     || (pos>lb && pos<ub)
                    ) {
                    this.ticks.push(ti);
                    if (tickCoords.major) {
                        this.labels.push(this._makeLabel(pos, tickCoords, this.board, this.visProp.drawlabels, this.id, i));
                    } else {
                        this.labels.push(null);
                    }
                    i++;
                }
                
                // Toggle direction
                if (dirs==2) {
                    dir *= (-1);
                }
				// Increase distance from center
                if (j % 2 === 0 || dirs === 1) {
                    tickPosition += ticksDelta;
                    symbTickPosition += symbTicksDelta;
                }
            } else {
                dir *= (-1);
                dirs--;
            }

            j++;
            
            nx = center[1] + dir*deltaX*tickPosition;
            ny = center[2] + dir*deltaY*tickPosition;
        } while (dirs>0);

        this.needsUpdate = true;
        this.updateRenderer();
    },
    
    _adjustTickDistance: function(ticksDelta, distScr, factor, p1c, deltaX, deltaY) {
        var nx, ny, f = 1;
        
        while (distScr > 4*this.minTicksDistance) {
            f /= 10;
            nx = p1c.usrCoords[1] + deltaX*ticksDelta*f;
            ny = p1c.usrCoords[2] + deltaY*ticksDelta*f;
            distScr = p1c.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board));
        }

        // If necessary, enlarge ticksDelta
        while (distScr < this.minTicksDistance) {
            f *= factor;
            factor = (factor == 5 ? 2 : 5);
            nx = p1c.usrCoords[1] + deltaX*ticksDelta*f;
            ny = p1c.usrCoords[2] + deltaY*ticksDelta*f;
            distScr = p1c.distance(JXG.COORDS_BY_SCREEN, new JXG.Coords(JXG.COORDS_BY_USER, [nx, ny], this.board));
        }
        return f;
    },
    
    _tickEndings: function(coords, dx, dy, dxMaj, dyMaj, dxMin, dyMin, major) {
        var i, c, 
            cw = this.board.canvasWidth,
            ch = this.board.canvasHeight,
            x = [-1000*cw, -1000*ch],
            y = [-1000*cw, -1000*ch], 
            dxs, dys,
            s, style,
            count = 0,
            isInsideCanvas = false;

		c = coords.scrCoords;
		if (major) {
			dxs = dxMaj;
			dys = dyMaj;
			style = this.majStyle;
		} else {
			dxs = dxMin;
			dys = dyMin;
			style = this.minStyle;
		}
        
		// This is necessary to compute the correct direction of infinite grid lines
		// if unitX!=unitY.
		//dxs = dx; //*this.board.unitX;
		//dys = dy; //*this.board.unitY;

		// For all ticks regardless if of finite or infinite
		// tick length the intersection with the canvas border is 
		// computed. 
		
		// horizontal line and vertical tick 
		if (Math.abs(dx)<JXG.Math.eps) {
			x[0] = c[1];
			x[1] = c[1];
			y[0] = 0;
			y[1] = ch;
		// vertical line and horizontal tick
		} else if (Math.abs(dy)<JXG.Math.eps) {
			x[0] = 0;
			x[1] = cw;
			y[0] = c[2];
			y[1] = c[2];
        // other
		} else {
			count = 0;
			s = JXG.Math.crossProduct([0,0,1], [-dys*c[1]-dxs*c[2], dys, dxs]); // intersect with top
			s[1] /= s[0];
			if (s[1]>=0 && s[1]<=cw) {  
				x[count] = s[1];
				y[count] = 0;
				count++;
			}
			s = JXG.Math.crossProduct([0,1,0], [-dys*c[1]-dxs*c[2], dys, dxs]); // intersect with left
			s[2] /= s[0];
			if (s[2]>=0 && s[2]<=ch) {  
				x[count] = 0;
				y[count] = s[2];
				count++;
			}
			if (count<2) {
				s = JXG.Math.crossProduct([ch*ch,0,-ch], [-dys*c[1]-dxs*c[2], dys, dxs]); // intersect with bottom
				s[1] /= s[0];
				if (s[1]>=0 && s[1]<=cw) {  
					x[count] = s[1];
					y[count] = ch;
					count++;
				}
			}
			if (count<2) {
				s = JXG.Math.crossProduct([cw*cw, -cw, 0], [-dys*c[1]-dxs*c[2], dys, dxs]); // intersect with right
				s[2] /= s[0];
				if (s[2]>=0 && s[2]<=ch) {  
					x[count] = cw;
					y[count] = s[2];
				}
			}
		}
		if ((x[0]>=0 && x[0]<=cw && y[0]>=0 && y[0]<=ch ) 
			|| 
			(x[1]>=0 && x[1]<=cw && y[1]>=0 && y[1]<=ch)
		   ) {
			isInsideCanvas = true;
		} else { 
			isInsideCanvas = false;
		}
		// finite tick length
		if (style=='finite') {
			x[0] = c[1] + dxs;
			y[0] = c[2] - dys;
			x[1] = c[1] - dxs;
			y[1] = c[2] + dys;
		}
        if (isInsideCanvas) {
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
        var labelText, label, attr, num = typeof pos === 'number';

        if (!drawLabels) {
            return null;
        }

        labelText = pos.toString();
        if (Math.abs(pos) < JXG.Math.eps) {
            labelText = '0';
        }

        if(num && (labelText.length > 5 || labelText.indexOf('e') != -1)) {
            labelText = pos.toPrecision(3).toString();
        }
        if (num && labelText.indexOf('.') > -1) {
            // trim trailing zeros
            labelText = labelText.replace(/0+$/, '');
            // trim trailing .
            labelText = labelText.replace(/\.$/, '');
        }

        if (this.visProp.scalesymbol.length > 0 && labelText === '1') {
            labelText = this.visProp.scalesymbol;
        } else if (this.visProp.scalesymbol.length > 0 && labelText === '0') {
            labelText = '0';
        } else {
            labelText = labelText + this.visProp.scalesymbol;
        }

        attr = {
            id: id + i + 'Label',
            isLabel: true,
            layer: board.options.layer.line,
            highlightStrokeColor: board.options.text.strokeColor,
            highlightStrokeWidth: board.options.text.strokeWidth,
            highlightStrokeOpacity: board.options.text.strokeOpacity,
            visible: this.visProp.visible,
            priv: this.visProp.priv
        };
        attr = JXG.deepCopy(attr, this.visProp.label);
        label = JXG.createText(board, [newTick.usrCoords[1], newTick.usrCoords[2], labelText], attr);
        label.isDraggable = false;
        label.dump = false;

        /*
         * Ticks have their own label handling which is done below and not
         * in Text.update().
         * The reason is that there is no parent element for the labels
         * which can determine the label position.
         */
        //label.distanceX = 4;
        //label.distanceY = -parseInt(label.visProp.fontsize)+3; //-9;
        label.distanceX = this.visProp.label.offset[0];
        label.distanceY = this.visProp.label.offset[1];
        label.setCoords(newTick.usrCoords[1] + label.distanceX / (board.unitX),
            newTick.usrCoords[2] + label.distanceY / (board.unitY));

        label.visProp.visible = drawLabels;
        //label.prepareUpdate().update().updateRenderer();
        return label;
    },

    /**
     * Removes the HTML divs of the tick labels
     * before repositioning
     */
    removeTickLabels: function () {
        var j;

        // remove existing tick labels
        if(this.labels != null) {
            if ((this.board.needsFullUpdate||this.needsRegularUpdate) &&
                !(this.board.options.renderer=='canvas'&&this.board.options.text.display=='internal')
               ) {
                for(j=0; j<this.labels.length; j++) {
                    if(this.labels[j] != null) {
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

        for (i = 0; i < this.labels.length; i++) {
            if (JXG.exists(this.labels[i]))
                this.labels[i].hideElement();
        }

        return this;
    },

    showElement: function () {
        var i;

        this.visProp.visible = true;
        this.board.renderer.show(this);

        for (i = 0; i < this.labels.length; i++) {
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
