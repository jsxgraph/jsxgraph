/*
    Copyright 2008-2013
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

        if (Type.isFunction(ticks)) {
            this.ticksFunction = ticks;
            throw new Error("Function arguments are no longer supported.");
        } else if (Type.isArray(ticks)) {
            this.fixedTicks = ticks;
        } else {
            if (Math.abs(ticks) < Mat.eps || ticks < 0) {
                ticks = attributes.defaultdistance;
            }

            this.ticksFunction = function () {
                return ticks;
            };
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
         * A list of labels that are currently unused and ready for reassignment.
         * @type {Array}
         */
        this.labelsRepo = [];

        /**
         * To ensure the uniqueness of label ids this counter is used.
         * @type {number}
         */
        this.labelCounter = 0;

        this.id = this.line.addTicks(this);
        this.board.setId(this, 'Ti');
    };

    JXG.Ticks.prototype = new GeometryElement();

    JXG.extend(JXG.Ticks.prototype, /** @lends JXG.Ticks.prototype */ {
        /**
         * Checks whether (x,y) is near the line.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @return {Boolean} True if (x,y) is near the line, False otherwise.
         */
        hasPoint: function (x, y) {
            var i, t,
                len = (this.ticks && this.ticks.length) || 0,
                r = this.board.options.precision.hasPoint;

            if (!this.line.visProp.scalable) {
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
            var dx, dy, i,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board),
                bb = this.board.getBoundingBox();

            if (!this.line.visProp.scalable) {
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
            var coordsZero, bounds, i,
                oldRepoLength = this.labelsRepo.length;

            // Calculate Ticks width and height in Screen and User Coordinates
            this.setTicksSizeVariables();
            // If the parent line is not finite, we can stop here.
            if (Math.abs(this.dx) < Mat.eps && Math.abs(this.dy) < Mat.eps) {
                return;
            }

            // Get Zero
            coordsZero = this.getZeroCoordinates();

            // Calculate lower bound and upper bound limits based on distance between p1 and centre and p2 and centre
            bounds = this.getLowerAndUpperBounds(coordsZero);

            // Clean up
            this.removeTickLabels();
            this.ticks = [];
            this.labels = [];

            // Create Ticks Coordinates and Labels
            if (this.equidistant) {
                this.generateEquidistantTicks(coordsZero, bounds);
            } else {
                this.generateFixedTicks(coordsZero, bounds);
            }

            // Hide unused labels in labelsRepo
            for (i = oldRepoLength; i < this.labelsRepo.length; i++) {
                this.labelsRepo[i].setAttribute({visible: false});
            }
        },

        /**
         * Sets the variables used to set the height and slope of each tick.
         *
         * @private
         */
        setTicksSizeVariables: function () {
            var d,
                distMaj = this.visProp.majorheight * 0.5,
                distMin = this.visProp.minorheight * 0.5;

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
            this.minStyle = 'finite';
            if (this.visProp.minorheight < 0) {
                this.minStyle = 'infinite';
            }

            this.majStyle = 'finite';
            if (this.visProp.majorheight < 0) {
                this.majStyle = 'infinite';
            }
        },

        /**
         * Returns the coordinates of the point zero of the line.
         *
         * If the line is an {@link Axis}, the coordinates of the projection of the board's zero point is returned
         *
         * Otherwise, the coordinates of the point that acts as zero are established depending on the value of {@link JXG.Ticks#anchor}
         *
         * @return {JXG.Coords} Coords object for the Zero point on the line
         * @private
         */
        getZeroCoordinates: function () {
            if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                return Geometry.projectPointToLine({
                    coords: {
                        usrCoords: [1, 0, 0]
                    }
                }, this.line, this.board);
            }

            if (this.visProp.anchor === 'right') {
                return this.line.point2.coords;
            }

            if (this.visProp.anchor === 'middle') {
                return new Coords(Const.COORDS_BY_USER, [
                    (this.line.point1.coords.usrCoords[1] + this.line.point2.coords.usrCoords[1]) / 2,
                    (this.line.point1.coords.usrCoords[2] + this.line.point2.coords.usrCoords[2]) / 2
                ], this.board);
            }

            return this.line.point1.coords;
        },

        /**
         * Calculate the lower and upper bounds for tick rendering
         * If {@link JXG.Ticks#includeBoundaries} is false, the boundaries will exclude point1 and point2
         *
         * @param  {JXG.Coords} coordsZero
         * @return {Object}                contains the lower and upper bounds
         * @private
         */
        getLowerAndUpperBounds: function (coordsZero) {
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
                dZeroPoint1, dZeroPoint2;

            // Adjust line limit points to be within the board
            Geometry.calcLineDelimitingPoints(this.line, point1, point2);

            // Calculate distance from Zero to P1 and to P2
            dZeroPoint1 = this.getDistanceFromZero(coordsZero, point1);
            dZeroPoint2 = this.getDistanceFromZero(coordsZero, point2);

            // We have to establish if the direction is P1->P2 or P2->P1 to set the lower and upper
            // boundaries appropriately. As the distances contain also a sign to indicate direction,
            // we can compare dZeroPoint1 and dZeroPoint2 to establish the line direction
            if (dZeroPoint1 < dZeroPoint2) { // Line goes P1->P2
                lowerBound = dZeroPoint1;
                if (!this.line.visProp.straightfirst && isPoint1inBoard && !this.visProp.includeboundaries) {
                    lowerBound += Mat.eps;
                }
                upperBound = dZeroPoint2;
                if (!this.line.visProp.straightlast && isPoint2inBoard && !this.visProp.includeboundaries) {
                    upperBound -= Mat.eps;
                }
            } else if (dZeroPoint2 < dZeroPoint1) { // Line goes P2->P1
                lowerBound = dZeroPoint2;
                if (!this.line.visProp.straightlast && isPoint2inBoard && !this.visProp.includeboundaries) {
                    lowerBound += Mat.eps;
                }
                upperBound = dZeroPoint1;
                if (!this.line.visProp.straightfirst && isPoint1inBoard && !this.visProp.includeboundaries) {
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
         * @return {Number}           distance between zero and point, including its sign
         * @private
         */
        getDistanceFromZero: function (zero, point) {
            var distance = zero.distance(Const.COORDS_BY_USER, point);

            // Establish sign
            if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                if (zero.usrCoords[1] > point.usrCoords[1] ||
                        (Math.abs(zero.usrCoords[1] - point.usrCoords[1]) < Mat.eps &&
                        zero.usrCoords[2] > point.usrCoords[2])) {
                    distance *= -1;
                }
            } else if (this.visProp.anchor === 'right') {
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
                // Point 1 of the line
                p1 = this.line.point1,
                // Point 2 of the line
                p2 = this.line.point2,
                // Calculate X and Y distance between two major ticks
                deltas = this.getXandYdeltas(),
                // Distance between two major ticks in screen coordinates
                distScr = p1.coords.distance(
                    Const.COORDS_BY_SCREEN,
                    new Coords(Const.COORDS_BY_USER, [p1.coords.usrCoords[1] + deltas.x, p1.coords.usrCoords[2] + deltas.y], this.board)
                ),
                // Distance between two major ticks in user coordinates
                ticksDelta = (this.equidistant ? this.ticksFunction(1) : this.ticksDelta);

            // adjust ticks distance
            ticksDelta *= this.visProp.scale;
            if (this.visProp.insertticks && this.minTicksDistance > Mat.eps) {
                ticksDelta *= this.adjustTickDistance(ticksDelta, distScr, coordsZero, deltas);
            } else if (!this.visProp.insertticks) {
                ticksDelta /= this.visProp.minorticks + 1;
            }
            this.ticksDelta = ticksDelta;

            // Position ticks from zero to the positive side while not reaching the upper boundary
            tickPosition = 0;
            if (!this.visProp.drawzero) {
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
         * @param  {Number}     distScr     distance between two major ticks in screen coordinates
         * @param  {JXG.Coords} coordsZero  coordinates of the point considered zero
         * @param  {Object}     deltas      x and y distance between two major ticks
         * @private
         */
        adjustTickDistance: function (ticksDelta, distScr, coordsZero, deltas) {
            var nx, ny, f = 1,
                // This factor is for enlarging ticksDelta and it switches between 5 and 2
                // Hence, if two major ticks are too close together they'll be expanded to a distance of 5
                // if they're still too close together, they'll be expanded to a distance of 10 etc
                factor = 5;

            while (distScr > 4 * this.minTicksDistance) {
                f /= 10;
                nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta * f;
                ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta * f;
                distScr = coordsZero.distance(Const.COORDS_BY_SCREEN, new Coords(Const.COORDS_BY_USER, [nx, ny], this.board));
            }

            // If necessary, enlarge ticksDelta
            while (distScr <= this.minTicksDistance) {
                f *= factor;
                factor = (factor === 5 ? 2 : 5);
                nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta * f;
                ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta * f;
                distScr = coordsZero.distance(Const.COORDS_BY_SCREEN, new Coords(Const.COORDS_BY_USER, [nx, ny], this.board));
            }

            return f;
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
            var x, y, tickCoords, ti, labelText;
            // Calculates tick coordinates
            x = coordsZero.usrCoords[1] + tickPosition * deltas.x;
            y = coordsZero.usrCoords[2] + tickPosition * deltas.y;
            tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);

            // Test if tick is a major tick.
            // This is the case if tickPosition/ticksDelta is
            // a multiple of the number of minorticks+1
            tickCoords.major = Math.round(tickPosition / ticksDelta) % (this.visProp.minorticks + 1) === 0;

            // Compute the start position and the end position of a tick.
            // If both positions are out of the canvas, ti is empty.
            ti = this.tickEndings(tickCoords, tickCoords.major);
            if (ti.length === 3) {
                this.ticks.push(ti);

                if (tickCoords.major && this.visProp.drawlabels) {
                    labelText = this.generateLabelText(tickCoords, coordsZero);
                    this.labels.push(this.generateLabel(labelText, tickCoords, this.ticks.length));
                } else {
                    this.labels.push(null);
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
                deltas = this.getXandYdeltas();

            for (i = 0; i < this.fixedTicks.length; i++) {
                x = coordsZero.usrCoords[1] + this.fixedTicks[i] * deltas.x;
                y = coordsZero.usrCoords[2] + this.fixedTicks[i] * deltas.y;
                tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);

                // Compute the start position and the end position of a tick.
                // If tick is out of the canvas, ti is empty.
                ti = this.tickEndings(tickCoords, true);
                if (ti.length === 3 && this.fixedTicks[i] >= bounds.lower && this.fixedTicks[i] <= bounds.upper) {
                    this.ticks.push(ti);

                    if (this.visProp.drawlabels && (!hasLabelOverrides || Type.exists(this.visProp.labels[i]))) {
                        labelText = hasLabelOverrides ? this.visProp.labels[i] : this.fixedTicks[i];
                        this.labels.push(
                            this.generateLabel(
                                this.generateLabelText(tickCoords, coordsZero, labelText), tickCoords, i
                            )
                        );
                    } else {
                        this.labels.push(null);
                    }
                }
            }
        },

        /**
         * Calculates the x and y distance between two major ticks
         *
         * @return {Object}
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
         * @param {JXG.Coords} coords Coordinates of the tick on the line.
         * @param {Boolean} major True if tick is major tick.
         * @return {Array} Array of length 3 containing start and end coordinates in screen coordinates
         *                 of the tick (arrays of length 2). 3rd entry is true if major tick otherwise false.
         *                 If the tick is outside of the canvas, the return array is empty.
         * @private
         */
        tickEndings: function (coords, major) {
            var i, c, lineStdForm, intersection,
                dxs, dys,
                s, style,
                cw = this.board.canvasWidth,
                ch = this.board.canvasHeight,
                x = [-1000 * cw, -1000 * ch],
                y = [-1000 * cw, -1000 * ch],
                count = 0,
                isInsideCanvas = false;

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
                x[0] = c[1] + dxs * this.visProp.tickendings[0];
                y[0] = c[2] - dys * this.visProp.tickendings[0];
                x[1] = c[1] - dxs * this.visProp.tickendings[1];
                y[1] = c[2] + dys * this.visProp.tickendings[1];
            }

            // check if (parts of) the tick is inside the canvas.
            isInsideCanvas = (x[0] >= 0 && x[0] <= cw && y[0] >= 0 && y[0] <= ch) ||
                (x[1] >= 0 && x[1] <= cw && y[1] >= 0 && y[1] <= ch);

            if (isInsideCanvas) {
                return [x, y, major];
            }

            return [];
        },

        /**
         * Creates the label text for a given tick. A value for the text can be provided as a number or string
         *
         * @param  {JXG.Coords}    tick  The Coords of the tick to create a label for
         * @param  {JXG.Coords}    zero  The Coords of line's zero
         * @param  {Number|String} value A predefined value for this tick
         * @return {String}
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
                    value = distance / this.visProp.scale;
                }

                labelText = value.toString();

                // if value is Number
                if (Type.isNumber(value)) {
                    if (labelText.length > this.visProp.maxlabellength || labelText.indexOf('e') !== -1) {
                        labelText = value.toPrecision(this.visProp.precision).toString();
                    }
                    if (labelText.indexOf('.') > -1 && labelText.indexOf('e') === -1) {
                        // trim trailing zeros
                        labelText = labelText.replace(/0+$/, '');
                        // trim trailing .
                        labelText = labelText.replace(/\.$/, '');
                    }
                }

                if (this.visProp.scalesymbol.length > 0) {
                    if (labelText === '1') {
                        labelText = this.visProp.scalesymbol;
                    } else if (labelText === '-1') {
                        labelText = '-' + this.visProp.scalesymbol;
                    } else if (labelText !== '0') {
                        labelText = labelText + this.visProp.scalesymbol;
                    }
                }
            }

            return labelText;
        },

        /**
         * Create a tick label
         * @param  {String}     labelText
         * @param  {JXG.Coords} tick
         * @param  {Number}     tickNumber
         * @return {JXG.Text}
         * @private
         */
        generateLabel: function (labelText, tick, tickNumber) {
            var label,
                attr = {
                    isLabel: true,
                    layer: this.board.options.layer.line,
                    highlightStrokeColor: this.board.options.text.strokeColor,
                    highlightStrokeWidth: this.board.options.text.strokeWidth,
                    highlightStrokeOpacity: this.board.options.text.strokeOpacity,
                    visible: this.visProp.visible,
                    priv: this.visProp.priv
                };

            attr = Type.deepCopy(attr, this.visProp.label);

            if (this.labelsRepo.length > 0) {
                label = this.labelsRepo.pop();
                label.setText(labelText);
                label.setAttribute(attr);
            } else {
                this.labelCounter += 1;
                attr.id = this.id + tickNumber + 'Label' + this.labelCounter;
                label = Text.createText(this.board, [tick.usrCoords[1], tick.usrCoords[2], labelText], attr);
            }

            label.isDraggable = false;
            label.dump = false;

            label.distanceX = this.visProp.label.offset[0];
            label.distanceY = this.visProp.label.offset[1];
            label.setCoords(
                tick.usrCoords[1] + label.distanceX / (this.board.unitX),
                tick.usrCoords[2] + label.distanceY / (this.board.unitY)
            );

            return label;
        },

        /**
         * Removes the HTML divs of the tick labels
         * before repositioning
         * @private
         */
        removeTickLabels: function () {
            var j;

            // remove existing tick labels
            if (Type.exists(this.labels)) {
                if ((this.board.needsFullUpdate || this.needsRegularUpdate || this.needsUpdate) &&
                        !(this.board.renderer.type === 'canvas' && this.board.options.text.display === 'internal')) {
                    for (j = 0; j < this.labels.length; j++) {
                        if (Type.exists(this.labels[j])) {
                            this.labelsRepo.push(this.labels[j]);
                        }
                    }
                }
            }
        },

        /**
         * Recalculate the tick positions and the labels.
         * @returns {JXG.Ticks}
         */
        update: function () {
            if (this.needsUpdate) {
                // A canvas with no width or height will create an endless loop, so ignore it
                if (this.board.canvasWidth !== 0 && this.board.canvasHeight !== 0) {
                    this.calculateTicksCoordinates();
                }
            }

            return this;
        },

        /**
         * Uses the boards renderer to update the arc.
         * @returns {JXG.Ticks}
         */
        updateRenderer: function () {
            if (this.needsUpdate) {
                this.board.renderer.updateTicks(this);
                this.needsUpdate = false;
            }

            return this;
        },

        hideElement: function () {
            var i;

            this.visProp.visible = false;
            this.board.renderer.hide(this);

            for (i = 0; i < this.labels.length; i++) {
                if (Type.exists(this.labels[i])) {
                    this.labels[i].hideElement();
                }
            }

            return this;
        },

        showElement: function () {
            var i;

            this.visProp.visible = true;
            this.board.renderer.show(this);

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
     * @param {JXG.Line,Number,Function} line,_distance,_generateLabelFunc The parents consist of the line the ticks are going to be attached to and the
     * distance between two major ticks.
     * The third parameter (optional) is a function which determines the tick label. It has as parameter a coords object containing the coordinates of the new tick.
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

        if (typeof attr.generatelabelvalue === 'function') {
            el.generateLabelValue = attr.generatelabelvalue;
        }

        el.isDraggable = true;

        return el;
    };

    /**
     * @class Hashes can be used to mark congruent lines.
     * @pseudo
     * @description
     * @name Hatch
     * @augments JXG.Ticks
     * @constructor
     * @type JXG.Ticks
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line,Number} line,numberofhashes The parents consist of the line the hatch marks are going to be attached to and the
     * number of dashes.
     * @example
     * // Create an axis providing two coord pairs.
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('hatch', [l1, 3]);
     * </pre><div id="4a20af06-4395-451c-b7d1-002757cf01be" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('4a20af06-4395-451c-b7d1-002757cf01be', {boundingbox: [-1, 7, 7, -1], showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [0, 3]);
     *   var p2 = board.create('point', [1, 3]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var t = board.create('hatch', [l1, 3]);
     * })();
     * </script><pre>
     */
    JXG.createHatchmark = function (board, parents, attributes) {
        var num, i, base, width, totalwidth, el,
            pos = [],
            attr = Type.copyAttributes(attributes, board.options, 'hatch');

        if (parents[0].elementClass !== Const.OBJECT_CLASS_LINE || typeof parents[1] !== 'number') {
            throw new Error("JSXGraph: Can't create Hatch mark with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
        }

        num = parents[1];
        width = attr.ticksdistance;
        totalwidth = (num - 1) * width;
        base = -totalwidth / 2;

        for (i = 0; i < num; i++) {
            pos[i] = base + i * width;
        }

        el = board.create('ticks', [parents[0], pos], attr);
        el.elType = 'hatch';
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
