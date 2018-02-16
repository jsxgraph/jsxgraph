/*
    Copyright 2008-2018
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 math/math
 math/geometry
 base/constants
 base/element
 base/coords
 utils/type
  elements:
   text
 */

/**
 * @fileoverview In this file the geometry object Ticks is defined. Ticks provides
 * methods for creation and management of ticks on an axis.
 * @author graphjs
 * @version 0.1
 */

define([
    'jxg', 'math/math', 'math/geometry', 'base/constants', 'base/element', 'base/coords', 'utils/type', 'base/text'
], function (JXG, Mat, Geometry, Const, GeometryElement, Coords, Type, Text) {

    "use strict";

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
        this.constructor(line.board, attributes, Const.OBJECT_TYPE_TICKS, Const.OBJECT_CLASS_OTHER);

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

        this.labelsData = [];

        if (Type.isFunction(ticks)) {
            this.ticksFunction = ticks;
            throw new Error("Function arguments are no longer supported.");
        }

        if (Type.isArray(ticks)) {
            this.fixedTicks = ticks;
        } else {
            if (Math.abs(ticks) < Mat.eps || ticks < 0) {
                ticks = attributes.defaultdistance;
            }

            /*
             * Ticks function:
             * determines the distance (in user units) of two major ticks
             */
            this.ticksFunction = this.makeTicksFunction(ticks);

            this.equidistant = true;
        }

        /**
         * Least distance between two ticks, measured in pixels.
         * @type int
         */
        this.minTicksDistance = attributes.minticksdistance;

        /**
         * Stores the ticks coordinates
         * @type {Array}
         */
        this.ticks = [];

        /**
         * Distance between two major ticks in user coordinates
         * @type {Number}
         */
        this.ticksDelta = 1;

        /**
         * Array where the labels are saved. There is an array element for every tick,
         * even for minor ticks which don't have labels. In this case the array element
         * contains just <tt>null</tt>.
         * @type Array
         */
        this.labels = [];

        /**
         * A list of labels which have to be displayed in updateRenderer.
         * @type {Array}
         */
        this.labelData = [];

        /**
         * To ensure the uniqueness of label ids this counter is used.
         * @type {number}
         */
        this.labelCounter = 0;

        this.id = this.line.addTicks(this);
        this.elType = 'ticks';
        this.inherits.push(this.labels);
        this.board.setId(this, 'Ti');
    };

    JXG.Ticks.prototype = new GeometryElement();

    JXG.extend(JXG.Ticks.prototype, /** @lends JXG.Ticks.prototype */ {

        /**
         * Ticks function:
         * determines the distance (in user units) of two major ticks.
         * See above in constructor and in @see JXG.GeometryElement#setAttribute
         *
         * @private
         * @param {Number} ticks Distance between two major ticks
         * @returns {Function} returns method ticksFunction
         */
        makeTicksFunction: function (ticks) {
            return function () {
                var delta, b, dist;

                if (Type.evaluate(this.visProp.insertticks)) {
                    b = this.getLowerAndUpperBounds(this.getZeroCoordinates(), 'ticksdistance');
                    dist = b.upper - b.lower;
                    delta = Math.pow(10, Math.floor(Math.log(0.6 * dist) / Math.LN10));
                    if (dist <= 6 * delta) {
                        delta *= 0.5;
                    }
                    return delta;
                }

                // upto 0.99.1:
                return ticks;
            };
        },

        /**
         * Checks whether (x,y) is near the line.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the line, False otherwise.
         */
        hasPoint: function (x, y) {
            var i, t,
                len = (this.ticks && this.ticks.length) || 0,
                r = this.board.options.precision.hasPoint +
                        Type.evaluate(this.visProp.strokewidth) * 0.5;

            if (!Type.evaluate(this.line.visProp.scalable)) {
                return false;
            }

            // Ignore non-axes and axes that are not horizontal or vertical
            if (this.line.stdform[1] !== 0 && this.line.stdform[2] !== 0 && this.line.type !== Const.OBJECT_TYPE_AXIS) {
                return false;
            }

            for (i = 0; i < len; i++) {
                t = this.ticks[i];

                // Skip minor ticks
                if (t[2]) {
                    // Ignore ticks at zero
                    if (!((this.line.stdform[1] === 0 && Math.abs(t[0][0] - this.line.point1.coords.scrCoords[1]) < Mat.eps) ||
                            (this.line.stdform[2] === 0 && Math.abs(t[1][0] - this.line.point1.coords.scrCoords[2]) < Mat.eps))) {
                        // tick length is not zero, ie. at least one pixel
                        if (Math.abs(t[0][0] - t[0][1]) >= 1 || Math.abs(t[1][0] - t[1][1]) >= 1) {
                            if (this.line.stdform[1] === 0) {
                                // Allow dragging near axes only.
                                if (Math.abs(y - (t[1][0] + t[1][1]) * 0.5) < 2 * r && t[0][0] - r < x && x < t[0][1] + r) {
                                    return true;
                                }
                            } else if (this.line.stdform[2] === 0) {
                                if (Math.abs(x - (t[0][0] + t[0][1]) * 0.5) < 2 * r && t[1][0] - r < y && y < t[1][1] + r) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            return false;
        },

        /**
         * Sets x and y coordinate of the tick.
         * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} oldcoords previous coordinates in screen/user units
         * @returns {JXG.Ticks} this element
         */
        setPositionDirectly: function (method, coords, oldcoords) {
            var dx, dy,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board),
                bb = this.board.getBoundingBox();

            if (!Type.evaluate(this.line.visProp.scalable)) {
                return this;
            }

            // horizontal line
            if (Math.abs(this.line.stdform[1]) < Mat.eps && Math.abs(c.usrCoords[1] * oldc.usrCoords[1]) > Mat.eps) {
                dx = oldc.usrCoords[1] / c.usrCoords[1];
                bb[0] *= dx;
                bb[2] *= dx;
                this.board.setBoundingBox(bb, false);
            // vertical line
            } else if (Math.abs(this.line.stdform[2]) < Mat.eps && Math.abs(c.usrCoords[2] * oldc.usrCoords[2]) > Mat.eps) {
                dy = oldc.usrCoords[2] / c.usrCoords[2];
                bb[3] *= dy;
                bb[1] *= dy;
                this.board.setBoundingBox(bb, false);
            }

            return this;
        },

        /**
         * (Re-)calculates the ticks coordinates.
         * @private
         */
        calculateTicksCoordinates: function () {
            var coordsZero, bounds;

            // Calculate Ticks width and height in Screen and User Coordinates
            this.setTicksSizeVariables();
            // If the parent line is not finite, we can stop here.
            if (Math.abs(this.dx) < Mat.eps &&
                Math.abs(this.dy) < Mat.eps) {
                return;
            }

            // Get Zero
            coordsZero = this.getZeroCoordinates();

            // Calculate lower bound and upper bound limits based on distance between p1 and centre and p2 and centre
            bounds = this.getLowerAndUpperBounds(coordsZero);

            // Clean up
            this.ticks = [];
            this.labelsData = [];
            // Create Ticks Coordinates and Labels
            if (this.equidistant) {
                this.generateEquidistantTicks(coordsZero, bounds);
            } else {
                this.generateFixedTicks(coordsZero, bounds);
            }

            return this;
        },

        /**
         * Sets the variables used to set the height and slope of each tick.
         *
         * @private
         */
        setTicksSizeVariables: function () {
            var d,
                distMaj = Type.evaluate(this.visProp.majorheight) * 0.5,
                distMin = Type.evaluate(this.visProp.minorheight) * 0.5;

            // ticks width and height in screen units
            this.dxMaj = this.line.stdform[1];
            this.dyMaj = this.line.stdform[2];
            this.dxMin = this.dxMaj;
            this.dyMin = this.dyMaj;

            // ticks width and height in user units
            this.dx = this.dxMaj;
            this.dy = this.dyMaj;

            // After this, the length of the vector (dxMaj, dyMaj) in screen coordinates is equal to distMaj pixel.
            d = Math.sqrt(
                this.dxMaj * this.dxMaj * this.board.unitX * this.board.unitX +
                    this.dyMaj * this.dyMaj * this.board.unitY * this.board.unitY
            );
            this.dxMaj *= distMaj / d * this.board.unitX;
            this.dyMaj *= distMaj / d * this.board.unitY;
            this.dxMin *= distMin / d * this.board.unitX;
            this.dyMin *= distMin / d * this.board.unitY;

            // Grid-like ticks?
            this.minStyle= (Type.evaluate(this.visProp.minorheight) < 0) ? 'infinite' : 'finite';
            this.majStyle= (Type.evaluate(this.visProp.majorheight) < 0) ? 'infinite' : 'finite';
        },

        /**
         * Returns the coordinates of the point zero of the line.
         *
         * If the line is an {@link Axis}, the coordinates of the projection of the board's zero point is returned
         *
         * Otherwise, the coordinates of the point that acts as zero are established depending on the value of {@link JXG.Ticks#anchor}
         *
         * @returns {JXG.Coords} Coords object for the Zero point on the line
         * @private
         */
        getZeroCoordinates: function () {
            var c1x, c1y, c1z, c2x, c2y, c2z,
                ev_a = Type.evaluate(this.visProp.anchor);

            if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                return Geometry.projectPointToLine({
                    coords: {
                        usrCoords: [1, 0, 0]
                    }
                }, this.line, this.board);
            }

            c1z = this.line.point1.coords.usrCoords[0];
            c1x = this.line.point1.coords.usrCoords[1];
            c1y = this.line.point1.coords.usrCoords[2];
            c2z = this.line.point2.coords.usrCoords[0];
            c2x = this.line.point2.coords.usrCoords[1];
            c2y = this.line.point2.coords.usrCoords[2];

            if (ev_a === 'right') {
                return this.line.point2.coords;
            } else if (ev_a === 'middle') {
                return new Coords(Const.COORDS_BY_USER, [
                    (c1z + c2z) * 0.5,
                    (c1x + c2x) * 0.5,
                    (c1y + c2y) * 0.5
                ], this.board);
            } else if (Type.isNumber(ev_a)) {
                return new Coords(Const.COORDS_BY_USER, [
                    c1z + (c2z - c1z) * ev_a,
                    c1x + (c2x - c1x) * ev_a,
                    c1y + (c2y - c1y) * ev_a
                ], this.board);
            }

            return this.line.point1.coords;
        },

        /**
         * Calculate the lower and upper bounds for tick rendering
         * If {@link JXG.Ticks#includeBoundaries} is false, the boundaries will exclude point1 and point2
         *
         * @param  {JXG.Coords} coordsZero
         * @returns {String} type  (Optional) If type=='ticksdistance' the bounds are
         *                         the intersection of the line with the bounding box of the board.
         *                         Otherwise it is the projection of the corners of the bounding box
         *                         to the line. The first case i s needed to automatically
         *                         generate ticks. The second case is for drawing of the ticks.
         * @returns {Object}     contains the lower and upper bounds
         *
         * @private
         */
        getLowerAndUpperBounds: function (coordsZero, type) {
            var lowerBound, upperBound,
                // The line's defining points that will be adjusted to be within the board limits
                point1 = new Coords(Const.COORDS_BY_USER, this.line.point1.coords.usrCoords, this.board),
                point2 = new Coords(Const.COORDS_BY_USER, this.line.point2.coords.usrCoords, this.board),
                // Are the original defining points within the board?
                isPoint1inBoard = (Math.abs(point1.usrCoords[0]) >= Mat.eps &&
                    point1.scrCoords[1] >= 0.0 && point1.scrCoords[1] <= this.board.canvasWidth &&
                    point1.scrCoords[2] >= 0.0 && point1.scrCoords[2] <= this.board.canvasHeight),
                isPoint2inBoard = (Math.abs(point2.usrCoords[0]) >= Mat.eps &&
                    point2.scrCoords[1] >= 0.0 && point2.scrCoords[1] <= this.board.canvasWidth &&
                    point2.scrCoords[2] >= 0.0 && point2.scrCoords[2] <= this.board.canvasHeight),
                // We use the distance from zero to P1 and P2 to establish lower and higher points
                dZeroPoint1, dZeroPoint2,
                ev_sf = Type.evaluate(this.line.visProp.straightfirst),
                ev_sl = Type.evaluate(this.line.visProp.straightlast),
                ev_i = Type.evaluate(this.visProp.includeboundaries),
                obj;

            // Adjust line limit points to be within the board
            if (Type.exists(type) || type === 'tickdistance') {
                // The good old calcStraight is needed for determining the distance between major ticks.
                // Here, only the visual area is of importance
                Geometry.calcStraight(this.line, point1, point2, Type.evaluate(this.line.visProp.margin));
            } else {
                // This function projects the corners of the board to the line.
                // This is important for diagonal lines with infinite tick lines.
                Geometry.calcLineDelimitingPoints(this.line, point1, point2);
            }
            // Shorten ticks bounds such that ticks are not through arrow heads
            obj = this.board.renderer.getPositionArrowHead(this.line, point1, point2,
                        Type.evaluate(this.line.visProp.strokewidth));
            point1.setCoordinates(Const.COORDS_BY_SCREEN, [
                    point1.scrCoords[1] - obj.d1x,
                    point1.scrCoords[2] - obj.d1y
                ]);
            point2.setCoordinates(Const.COORDS_BY_SCREEN, [
                    point2.scrCoords[1] - obj.d2x,
                    point2.scrCoords[2] - obj.d2y
                ]);

            // Calculate distance from Zero to P1 and to P2
            dZeroPoint1 = this.getDistanceFromZero(coordsZero, point1);
            dZeroPoint2 = this.getDistanceFromZero(coordsZero, point2);

            // We have to establish if the direction is P1->P2 or P2->P1 to set the lower and upper
            // boundaries appropriately. As the distances contain also a sign to indicate direction,
            // we can compare dZeroPoint1 and dZeroPoint2 to establish the line direction
            if (dZeroPoint1 < dZeroPoint2) { // Line goes P1->P2
                lowerBound = dZeroPoint1;
                if (!ev_sf && isPoint1inBoard && !ev_i) {
                    lowerBound += Mat.eps;
                }
                upperBound = dZeroPoint2;
                if (!ev_sl && isPoint2inBoard && !ev_i) {
                    upperBound -= Mat.eps;
                }
            } else if (dZeroPoint2 < dZeroPoint1) { // Line goes P2->P1
                lowerBound = dZeroPoint2;
                if (!ev_sl && isPoint2inBoard && !ev_i) {
                    lowerBound += Mat.eps;
                }
                upperBound = dZeroPoint1;
                if (!ev_sf && isPoint1inBoard && !ev_i) {
                    upperBound -= Mat.eps;
                }
            } else { // P1 = P2 = Zero, we can't do a thing
                lowerBound = 0;
                upperBound = 0;
            }

            return {
                lower: lowerBound,
                upper: upperBound
            };
        },

        /**
         * Calculates the distance in user coordinates from zero to a given point including its sign
         *
         * @param  {JXG.Coords} zero  coordinates of the point considered zero
         * @param  {JXG.Coords} point coordinates of the point to find out the distance
         * @returns {Number}           distance between zero and point, including its sign
         * @private
         */
        getDistanceFromZero: function (zero, point) {
            var eps = Mat.eps,
                distance = zero.distance(Const.COORDS_BY_USER, point);

            // Establish sign
            if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                if ((Mat.relDif(zero.usrCoords[1], point.usrCoords[1]) > eps &&
                        zero.usrCoords[1] - point.usrCoords[1] > eps) ||
                    (Mat.relDif(zero.usrCoords[2], point.usrCoords[2]) > eps &&
                        zero.usrCoords[2] - point.usrCoords[2] > eps)) {

                    distance *= -1;
                }
            } else if (Type.evaluate(this.visProp.anchor) === 'right') {
                if (Geometry.isSameDirection(zero, this.line.point1.coords, point)) {
                    distance *= -1;
                }
            } else {
                if (!Geometry.isSameDirection(zero, this.line.point2.coords, point)) {
                    distance *= -1;
                }
            }
            return distance;
        },

        /**
         * Creates ticks coordinates and labels automatically.
         * The frequency of ticks is affected by the values of {@link JXG.Ticks#insertTicks} and {@link JXG.Ticks#ticksDistance}
         *
         * @param  {JXG.Coords} coordsZero coordinates of the point considered zero
         * @param  {Object}     bounds     contains the lower and upper boundaries for ticks placement
         * @private
         */
        generateEquidistantTicks: function (coordsZero, bounds) {
            var tickPosition,
                // Calculate X and Y distance between two major ticks
                deltas = this.getXandYdeltas(),
                // Distance between two major ticks in user coordinates
                ticksDelta = (this.equidistant ? this.ticksFunction(1) : this.ticksDelta),
                ev_it = Type.evaluate(this.visProp.insertticks),
                ev_mt = Type.evaluate(this.visProp.minorticks);

            // adjust ticks distance
            ticksDelta *= Type.evaluate(this.visProp.scale);
            if (ev_it && this.minTicksDistance > Mat.eps) {
                ticksDelta = this.adjustTickDistance(ticksDelta, coordsZero, deltas);
                ticksDelta /= (ev_mt + 1);
            } else if (!ev_it) {
                ticksDelta /= (ev_mt + 1);
            }
            this.ticksDelta = ticksDelta;

            if (ticksDelta < Mat.eps) {
                return;
            }

            // Position ticks from zero to the positive side while not reaching the upper boundary
            tickPosition = 0;
            if (!Type.evaluate(this.visProp.drawzero)) {
                tickPosition = ticksDelta;
            }
            while (tickPosition <= bounds.upper) {
                // Only draw ticks when we are within bounds, ignore case where  tickPosition < lower < upper
                if (tickPosition >= bounds.lower) {
                    this.processTickPosition(coordsZero, tickPosition, ticksDelta, deltas);
                }
                tickPosition += ticksDelta;
            }

            // Position ticks from zero (not inclusive) to the negative side while not reaching the lower boundary
            tickPosition = -ticksDelta;
            while (tickPosition >= bounds.lower) {
                // Only draw ticks when we are within bounds, ignore case where lower < upper < tickPosition
                if (tickPosition <= bounds.upper) {
                    this.processTickPosition(coordsZero, tickPosition, ticksDelta, deltas);
                }
                tickPosition -= ticksDelta;
            }
        },

        /**
         * Auxiliary method used by {@link JXG.Ticks#generateEquidistantTicks} to adjust the
         * distance between two ticks depending on {@link JXG.Ticks#minTicksDistance} value
         *
         * @param  {Number}     ticksDelta  distance between two major ticks in user coordinates
         * @param  {JXG.Coords} coordsZero  coordinates of the point considered zero
         * @param  {Object}     deltas      x and y distance in pixel between two user units
         * @param  {Object}     bounds      upper and lower bound of the tick positions in user units.
         * @private
         */
        adjustTickDistance: function (ticksDelta, coordsZero, deltas) {
            var nx, ny, bounds,
                distScr,
                sgn = 1,
                ev_minti = Type.evaluate(this.visProp.minorticks);

            bounds = this.getLowerAndUpperBounds(coordsZero, 'ticksdistance');
            nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta;
            ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta;
            distScr = coordsZero.distance(Const.COORDS_BY_SCREEN, new Coords(Const.COORDS_BY_USER, [nx, ny], this.board));
            while (distScr / (ev_minti + 1) < this.minTicksDistance) {
                if (sgn === 1) {
                    ticksDelta *= 2;
                } else {
                    ticksDelta *= 5;
                }
                sgn *= -1;

                nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta;
                ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta;
                distScr = coordsZero.distance(Const.COORDS_BY_SCREEN, new Coords(Const.COORDS_BY_USER, [nx, ny], this.board));
            }
            return ticksDelta;
        },

        /**
         * Auxiliary method used by {@link JXG.Ticks#generateEquidistantTicks} to create a tick
         * in the line at the given tickPosition.
         *
         * @param  {JXG.Coords} coordsZero    coordinates of the point considered zero
         * @param  {Number}     tickPosition  current tick position relative to zero
         * @param  {Number}     ticksDelta    distance between two major ticks in user coordinates
         * @param  {Object}     deltas      x and y distance between two major ticks
         * @private
         */
        processTickPosition: function (coordsZero, tickPosition, ticksDelta, deltas) {
            var x, y, tickCoords, ti;

            // Calculates tick coordinates
            x = coordsZero.usrCoords[1] + tickPosition * deltas.x;
            y = coordsZero.usrCoords[2] + tickPosition * deltas.y;
            tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);

            // Test if tick is a major tick.
            // This is the case if tickPosition/ticksDelta is
            // a multiple of the number of minorticks+1
            tickCoords.major = Math.round(tickPosition / ticksDelta) % (Type.evaluate(this.visProp.minorticks) + 1) === 0;

            // Compute the start position and the end position of a tick.
            // If both positions are out of the canvas, ti is empty.
            ti = this.tickEndings(tickCoords, tickCoords.major);
            if (ti.length === 3) {
                this.ticks.push(ti);
                if (tickCoords.major && Type.evaluate(this.visProp.drawlabels)) {
                    this.labelsData.push(
                        this.generateLabelData(
                            this.generateLabelText(tickCoords, coordsZero),
                            tickCoords,
                            this.ticks.length
                        )
                    );
                } else {
                    this.labelsData.push(null);
                }
            }
        },

        /**
         * Creates ticks coordinates and labels based on {@link JXG.Ticks#fixedTicks} and {@link JXG.Ticks#labels}.
         *
         * @param  {JXG.Coords} coordsZero Coordinates of the point considered zero
         * @param  {Object}     bounds     contains the lower and upper boundaries for ticks placement
         * @private
         */
        generateFixedTicks: function (coordsZero, bounds) {
            var tickCoords, labelText, i, ti,
                x, y,
                hasLabelOverrides = Type.isArray(this.visProp.labels),
                // Calculate X and Y distance between two major points in the line
                deltas = this.getXandYdeltas(),
                ev_dl = Type.evaluate(this.visProp.drawlabels);

            for (i = 0; i < this.fixedTicks.length; i++) {
                x = coordsZero.usrCoords[1] + this.fixedTicks[i] * deltas.x;
                y = coordsZero.usrCoords[2] + this.fixedTicks[i] * deltas.y;
                tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);

                // Compute the start position and the end position of a tick.
                // If tick is out of the canvas, ti is empty.
                ti = this.tickEndings(tickCoords, true);
                if (ti.length === 3 && this.fixedTicks[i] >= bounds.lower &&
                    this.fixedTicks[i] <= bounds.upper) {
                    this.ticks.push(ti);

                    if (ev_dl &&
                            (hasLabelOverrides || Type.exists(this.visProp.labels[i]))) {
                        labelText = hasLabelOverrides ?
                                        Type.evaluate(this.visProp.labels[i]) : this.fixedTicks[i];
                        this.labelsData.push(
                            this.generateLabelData(
                                this.generateLabelText(tickCoords, coordsZero, labelText),
                                tickCoords,
                                i
                            )
                        );
                    } else {
                        this.labelsData.push(null);
                    }
                }
            }
        },

        /**
         * Calculates the x and y distance in pixel between two units in user space.
         *
         * @returns {Object}
         * @private
         */
        getXandYdeltas: function () {
            var
                // Auxiliary points to store the start and end of the line according to its direction
                point1UsrCoords, point2UsrCoords,
                distP1P2 = this.line.point1.Dist(this.line.point2);

            if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                // When line is an Axis, direction depends on Board Coordinates system

                // assume line.point1 and line.point2 are in correct order
                point1UsrCoords = this.line.point1.coords.usrCoords;
                point2UsrCoords = this.line.point2.coords.usrCoords;

                // Check if direction is incorrect, then swap
                if (point1UsrCoords[1] > point2UsrCoords[1] ||
                        (Math.abs(point1UsrCoords[1] - point2UsrCoords[1]) < Mat.eps &&
                        point1UsrCoords[2] > point2UsrCoords[2])) {
                    point1UsrCoords = this.line.point2.coords.usrCoords;
                    point2UsrCoords = this.line.point1.coords.usrCoords;
                }
            } else {
                // line direction is always from P1 to P2 for non Axis types
                point1UsrCoords = this.line.point1.coords.usrCoords;
                point2UsrCoords = this.line.point2.coords.usrCoords;
            }
            return {
                x: (point2UsrCoords[1] - point1UsrCoords[1]) / distP1P2,
                y: (point2UsrCoords[2] - point1UsrCoords[2]) / distP1P2
            };
        },

        /**
         * Check if (parts of) the tick is inside the canvas. The tick intersects the boundary
         * at two positions: [x[0], y[0]] and [x[1], y[1]] in screen coordinates.
         * @param  {Array}  x Array of length two
         * @param  {Array}  y Array of length two
         * @return {Boolean}   true if parts of the tick are inside of the canvas or on the boundary.
         */
        _isInsideCanvas: function(x, y, m) {
            var cw = this.board.canvasWidth,
                ch = this.board.canvasHeight;

            if (m === undefined) {
                m = 0;
            }
            return (x[0] >= m && x[0] <= cw - m && y[0] >= m && y[0] <= ch - m) ||
                    (x[1] >= m && x[1] <= cw - m && y[1] >= m && y[1] <= ch - m);
        },

        /**
         * @param {JXG.Coords} coords Coordinates of the tick on the line.
         * @param {Boolean} major True if tick is major tick.
         * @returns {Array} Array of length 3 containing start and end coordinates in screen coordinates
         *                 of the tick (arrays of length 2). 3rd entry is true if major tick otherwise false.
         *                 If the tick is outside of the canvas, the return array is empty.
         * @private
         */
        tickEndings: function (coords, major) {
            var c, lineStdForm, intersection,
                dxs, dys,
                style,
                x = [-2000000, -2000000],
                y = [-2000000, -2000000];

            c = coords.scrCoords;
            if (major) {
                dxs = this.dxMaj;
                dys = this.dyMaj;
                style = this.majStyle;
            } else {
                dxs = this.dxMin;
                dys = this.dyMin;
                style = this.minStyle;
            }
            lineStdForm = [-dys * c[1] - dxs * c[2], dys, dxs];

            // For all ticks regardless if of finite or infinite
            // tick length the intersection with the canvas border is
            // computed.
            if (style === 'infinite') {
                intersection = Geometry.meetLineBoard(lineStdForm, this.board);
                x[0] = intersection[0].scrCoords[1];
                x[1] = intersection[1].scrCoords[1];
                y[0] = intersection[0].scrCoords[2];
                y[1] = intersection[1].scrCoords[2];
            } else {
                x[0] = c[1] + dxs * Type.evaluate(this.visProp.tickendings[0]);
                y[0] = c[2] - dys * Type.evaluate(this.visProp.tickendings[0]);
                x[1] = c[1] - dxs * Type.evaluate(this.visProp.tickendings[1]);
                y[1] = c[2] + dys * Type.evaluate(this.visProp.tickendings[1]);
            }

            // Check if (parts of) the tick is inside the canvas.
            if (this._isInsideCanvas(x, y)) {
                return [x, y, major];
            }

            return [];
        },

        /**
         * Format label texts. Show the desired number of digits
         * and use utf-8 minus sign.
         * @param  {Number} value Number to be displayed
         * @return {String}       The value converted into a string.
         * @private
         */
        formatLabelText: function(value) {
            var labelText = value.toString(),
                ev_s = Type.evaluate(this.visProp.scalesymbol);

            // if value is Number
            if (Type.isNumber(value)) {
                if (labelText.length > Type.evaluate(this.visProp.maxlabellength) ||
                        labelText.indexOf('e') !== -1) {
                    labelText = value.toPrecision(Type.evaluate(this.visProp.precision)).toString();
                }
                if (labelText.indexOf('.') > -1 && labelText.indexOf('e') === -1) {
                    // trim trailing zeros
                    labelText = labelText.replace(/0+$/, '');
                    // trim trailing .
                    labelText = labelText.replace(/\.$/, '');
                }
            }

            if (ev_s.length > 0) {
                if (labelText === '1') {
                    labelText = ev_s;
                } else if (labelText === '-1') {
                    labelText = '-' + ev_s;
                } else if (labelText !== '0') {
                    labelText = labelText + ev_s;
                }
            }

            if (Type.evaluate(this.visProp.useunicodeminus)) {
                labelText = labelText.replace(/-/g, '\u2212');
            }
            return labelText;
        },

        /**
         * Creates the label text for a given tick. A value for the text can be provided as a number or string
         *
         * @param  {JXG.Coords}    tick  The Coords-object of the tick to create a label for
         * @param  {JXG.Coords}    zero  The Coords-object of line's zero
         * @param  {Number|String} value A predefined value for this tick
         * @returns {String}
         * @private
         */
        generateLabelText: function (tick, zero, value) {
            var labelText,
                distance = this.getDistanceFromZero(zero, tick);

            if (Math.abs(distance) < Mat.eps) { // Point is zero
                labelText = '0';
            } else {
                // No value provided, equidistant, so assign distance as value
                if (!Type.exists(value)) { // could be null or undefined
                    value = distance / Type.evaluate(this.visProp.scale);
                }

                labelText = this.formatLabelText(value);
            }

            return labelText;
        },

        /**
         * Create a tick label data, i.e. text and coordinates
         * @param  {String}     labelText
         * @param  {JXG.Coords} tick
         * @param  {Number}     tickNumber
         * @returns {Object} with properties 'x', 'y', 't' (text), 'i' (tick number) or null in case of o label
         * @private
         */
        generateLabelData: function (labelText, tick, tickNumber) {
             var xa, ya, m, fs;

             // Test if large portions of the label are inside of the canvas
             // This is the last chance to abandon the creation of the label if it is mostly
             // outside of the canvas.
             fs = Type.evaluate(this.visProp.label.fontsize);
             xa = [tick.scrCoords[1], tick.scrCoords[1]];
             ya = [tick.scrCoords[2], tick.scrCoords[2]];
             m = (fs === undefined) ? 12 : fs;
             m *= 1.5;
             if (!this._isInsideCanvas(xa, ya, m)) {
                 return null;
             }

             xa = Type.evaluate(this.visProp.label.offset[0]);
             ya = Type.evaluate(this.visProp.label.offset[1]);

             return {
                 x: tick.usrCoords[1] + xa / (this.board.unitX),
                 y: tick.usrCoords[2] + ya / (this.board.unitY),
                 t: labelText,
                 i: tickNumber
             };
         },

        /**
         * Recalculate the tick positions and the labels.
         * @returns {JXG.Ticks}
         */
        update: function () {
            if (this.needsUpdate) {
                //this.visPropCalc.visible = Type.evaluate(this.visProp.visible);
                // A canvas with no width or height will create an endless loop, so ignore it
                if (this.board.canvasWidth !== 0 && this.board.canvasHeight !== 0) {
                    this.calculateTicksCoordinates();
                }
                // this.updateVisibility(this.line.visPropCalc.visible);
                //
                // for (var i = 0; i < this.labels.length; i++) {
                //     if (this.labels[i] !== null) {
                //         this.labels[i].prepareUpdate()
                //             .updateVisibility(this.line.visPropCalc.visible)
                //             .updateRenderer();
                //     }
                // }
            }

            return this;
        },

        /**
         * Uses the boards renderer to update the arc.
         * @returns {JXG.Ticks} Reference to the object.
         */
        updateRenderer: function () {
            if (!this.needsUpdate) {
                return this;
            }

            if (this.visPropCalc.visible) {
                this.board.renderer.updateTicks(this);
            }
            this.updateRendererLabels();

            this.setDisplayRendNode();
            // if (this.visPropCalc.visible != this.visPropOld.visible) {
            //     this.board.renderer.display(this, this.visPropCalc.visible);
            //     this.visPropOld.visible = this.visPropCalc.visible;
            // }

            this.needsUpdate = false;
            return this;
        },

        /**
         * Updates the label elements of the major ticks.
         *
         * @private
         * @returns {JXG.Ticks} Reference to the object.
         */
        updateRendererLabels: function() {
            var i, j,
                lenData, lenLabels,
                attr,
                label, ld,
                visible;

            // The number of labels needed
            lenData = this.labelsData.length;
            // The number of labels which already exist
            lenLabels = this.labels.length;

            for (i = 0, j = 0; i < lenData; i++) {
                if (this.labelsData[i] === null) {
                    continue;
                }

                ld = this.labelsData[i];
                if (j < lenLabels) {
                    // Take an already existing text element
                    label = this.labels[j];
                    label.setText(ld.t);
                    label.setCoords(ld.x, ld.y);
                    j++;
                } else {
                    // A new text element is needed
                    this.labelCounter += 1;

                    attr = {
                        isLabel: true,
                        layer: this.board.options.layer.line,
                        highlightStrokeColor: this.board.options.text.strokeColor,
                        highlightStrokeWidth: this.board.options.text.strokeWidth,
                        highlightStrokeOpacity: this.board.options.text.strokeOpacity,
                        priv: this.visProp.priv
                    };
                    attr = Type.deepCopy(attr, this.visProp.label);
                    attr.id = this.id + ld.i + 'Label' + this.labelCounter;

                    label = Text.createText(this.board, [ld.x, ld.y, ld.t], attr);
                    label.isDraggable = false;
                    label.dump = false;
                    this.labels.push(label);
                }

                visible = Type.evaluate(this.visProp.label.visible);
                if (visible === 'inherit') {
                    visible = this.visPropCalc.visible;
                }
                label.prepareUpdate()
                    .updateVisibility(visible)
                    .updateRenderer();
                //this.board.renderer.display(label, visible);

                label.distanceX = Type.evaluate(this.visProp.label.offset[0]);
                label.distanceY = Type.evaluate(this.visProp.label.offset[1]);
            }

            // Hide unused labels
            lenData = j;
            for (j = lenData; j < lenLabels; j++) {
                this.board.renderer.display(this.labels[j], false);
                // Tick labels have the attribute "visible: 'inherit'"
                // This must explicitely set to false, otherwise
                // this labels would be set to visible in the upcoming
                // update of the labels.
                this.labels[j].visProp.visible = false;
            }

            return this;
        },

        hideElement: function () {
            var i;

            JXG.deprecated('Element.hideElement()', 'Element.setDisplayRendNode()');

            this.visPropCalc.visible = false;
            this.board.renderer.display(this, false);
            for (i = 0; i < this.labels.length; i++) {
                if (Type.exists(this.labels[i])) {
                    this.labels[i].hideElement();
                }
            }

            return this;
        },

        showElement: function () {
            var i;

            JXG.deprecated('Element.showElement()', 'Element.setDisplayRendNode()');

            this.visPropCalc.visible = true;
            this.board.renderer.display(this, false);

            for (i = 0; i < this.labels.length; i++) {
                if (Type.exists(this.labels[i])) {
                    this.labels[i].showElement();
                }
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
     * @param {JXG.Line} line The parents consist of the line the ticks are going to be attached to.
     * @param {Number} distance Number defining the distance between two major ticks or an
     * array defining static ticks. Alternatively, the distance can be specified with the attribute
     * "ticksDistance". For arbitrary lines (and not axes) a "zero coordinate" is determined
     * which defines where the first tick is positioned. This zero coordinate
     * can be altered with the attribute "anchor". Possible values are "left", "middle", "right" or a number.
     * The default value is "middle".
     *
     * @example
     * // Create an axis providing two coord pairs.
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('ticks', [l1], {ticksDistance: 2});
     * </pre><div class="jxgbox" id="ee7f2d68-75fc-4ec0-9931-c76918427e63" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('ee7f2d68-75fc-4ec0-9931-c76918427e63', {boundingbox: [-1, 7, 7, -1], showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('ticks', [l1, 2], {ticksDistance: 2});
     * })();
     * </script><pre>
     */
    JXG.createTicks = function (board, parents, attributes) {
        var el, dist,
            attr = Type.copyAttributes(attributes, board.options, 'ticks');

        if (parents.length < 2) {
            dist = attr.ticksdistance;
        } else {
            dist = parents[1];
        }

        if (parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            el = new JXG.Ticks(parents[0], dist, attr);
        } else {
            throw new Error("JSXGraph: Can't create Ticks with parent types '" + (typeof parents[0]) + "'.");
        }

        // deprecated
        if (Type.isFunction(attr.generatelabelvalue)) {
            el.generateLabelText = attr.generatelabelvalue;
        }
        if (Type.isFunction(attr.generatelabeltext)) {
            el.generateLabelText = attr.generatelabeltext;
        }

        el.setParents(parents[0]);
        el.isDraggable = true;
        el.fullUpdate(parents[0].visPropCalc.visible);

        return el;
    };

    /**
     * @class Hatches can be used to mark congruent lines.
     * @pseudo
     * @description
     * @name Hatch
     * @augments JXG.Ticks
     * @constructor
     * @type JXG.Ticks
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line} line The line the hatch marks are going to be attached to.
     * @param {Number} numberofhashes Number of dashes.
     * @example
     * // Create an axis providing two coord pairs.
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('hatch', [l1, 3]);
     * </pre><div class="jxgbox" id="4a20af06-4395-451c-b7d1-002757cf01be" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('4a20af06-4395-451c-b7d1-002757cf01be', {boundingbox: [-1, 7, 7, -1], showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('hatch', [l1, 3]);
     * })();
     * </script><pre>
     *
     * @example
     * // Alter the position of the hatch
     * var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-10, 10, 10, -5], keepaspectratio:true});
     *
     * var p = board.create('point', [-5, 0]);
     * var q = board.create('point', [5, 0]);
     * var li = board.create('line', [p, q]);
     * var h = board.create('hatch', [li, 2], {anchor: 0.2});
     *
     * </pre><div id="05d720ee-99c9-11e6-a9c7-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('05d720ee-99c9-11e6-a9c7-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-10, 10, 10, -5], keepaspectratio:true});
     *
     *     var p = board.create('point', [-5, 0]);
     *     var q = board.create('point', [5, 0]);
     *     var li = board.create('line', [p, q]);
     *     var h = board.create('hatch', [li, 2], {anchor: 0.2});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createHatchmark = function (board, parents, attributes) {
        var num, i, base, width, totalwidth, el,
            pos = [],
            attr = Type.copyAttributes(attributes, board.options, 'hatch');

        if (parents[0].elementClass !== Const.OBJECT_CLASS_LINE || typeof parents[1] !== 'number') {
            throw new Error("JSXGraph: Can't create Hatch mark with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + " and ''" + (typeof parents[2]) + "'.");
        }

        num = parents[1];
        width = attr.ticksdistance;
        totalwidth = (num - 1) * width;
        base = -totalwidth * 0.5;

        for (i = 0; i < num; i++) {
            pos[i] = base + i * width;
        }

        el = board.create('ticks', [parents[0], pos], attr);
        el.elType = 'hatch';

        return el;
    };

    JXG.registerElement('ticks', JXG.createTicks);
    JXG.registerElement('hash', JXG.createHatchmark);
    JXG.registerElement('hatch', JXG.createHatchmark);

    return {
        Ticks: JXG.Ticks,
        createTicks: JXG.createTicks,
        createHashmark: JXG.createHatchmark,
        createHatchmark: JXG.createHatchmark
    };
});
