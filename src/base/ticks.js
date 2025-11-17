/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the geometry object Ticks is defined. Ticks provides
 * methods for creation and management of ticks on an axis.
 * @author graphjs
 * @version 0.1
 */

import JXG from "../jxg.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Numerics from "../math/numerics.js";
import Const from "./constants.js";
import GeometryElement from "./element.js";
import Coords from "./coords.js";
import Type from "../utils/type.js";

/**
 * Creates ticks for an axis.
 * @class Ticks provides methods for creation and management
 * of ticks on an axis.
 * @param {JXG.Line} line Reference to the axis the ticks are drawn on.
 * @param {Number|Array} ticks Number defining the distance between two major ticks or an array defining static ticks.
 * @param {Object} attributes Properties
 * @see JXG.Line#addTicks
 * @constructor
 * @augments JXG.GeometryElement
 */
JXG.Ticks = function (line, ticks, attributes) {
    this.constructor(line.board, attributes, Const.OBJECT_TYPE_TICKS, Const.OBJECT_CLASS_OTHER);

    /**
     * The line the ticks belong to.
     * @type JXG.Line
     * @private
     */
    this.line = line;

    /**
     * The board the ticks line is drawn on.
     * @type JXG.Board
     * @private
     */
    this.board = this.line.board;

    // /**
    //  * A function calculating ticks delta depending on the ticks number.
    //  * @type Function
    //  */
    // // this.ticksFunction = null;

    /**
     * Array of fixed ticks.
     * @type Array
     * @private
     */
    this.fixedTicks = null;

    /**
     * Flag if the ticks are equidistant. If true, their distance is defined by ticksFunction.
     * @type Boolean
     * @private
     */
    this.equidistant = false;

    /**
     * A list of labels which have to be displayed in updateRenderer.
     * @type Array
     * @private
     */
    this.labelsData = [];

    if (Type.isFunction(ticks)) {
        this.ticksFunction = ticks;
        throw new Error("Function arguments are no longer supported.");
    }

    if (Type.isArray(ticks)) {
        this.fixedTicks = ticks;
    } else {
        // Obsolete:
        // if (Math.abs(ticks) < Mat.eps || ticks < 0) {
        //     ticks = attributes.defaultdistance;
        // }
        this.equidistant = true;
    }

    // /**
    //  * Least distance between two ticks, measured in pixels.
    //  * @type int
    //  */
    // // this.minTicksDistance = attributes.minticksdistance;

    /**
     * Stores the ticks coordinates
     * @type Array
     * @private
     */
    this.ticks = [];

    // /**
    //  * Distance between two major ticks in user coordinates
    //  * @type Number
    //  */
    // this.ticksDelta = 1;

    /**
     * Array where the labels are saved. There is an array element for every tick,
     * even for minor ticks which don't have labels. In this case the array element
     * contains just <tt>null</tt>.
     * @type Array
     * @private
     */
    this.labels = [];

    /**
     * Used to ensure the uniqueness of label ids this counter is used.
     * @type number
     * @private
     */
    this.labelCounter = 0;

    this.id = this.line.addTicks(this);
    this.elType = 'ticks';
    this.inherits.push(this.labels);
    this.board.setId(this, 'Ti');
};

JXG.Ticks.prototype = new GeometryElement();

JXG.extend(
    JXG.Ticks.prototype,
    /** @lends JXG.Ticks.prototype */ {
        // /**
        //  * Ticks function:
        //  * determines the distance (in user units) of two major ticks.
        //  * See above in constructor and in @see JXG.GeometryElement#setAttribute
        //  *
        //  * @private
        //  * @param {Number} ticks Distance between two major ticks
        //  * @returns {Function} returns method ticksFunction
        //  */
        // // makeTicksFunction: function (ticks) {
        //     // return function () {
        //         ticksFunction: function () {
        //                     var delta, b, dist,
        //                     number_major_tick_intervals = 5;

        //                 if (this.evalVisProp('insertticks')) {
        //                     b = this.getLowerAndUpperBounds(this.getZeroCoordinates(), 'ticksdistance');
        //                     dist = b.upper - b.lower;

        //                     // delta: Proposed distance in user units between two major ticks
        //                     delta = Math.pow(10, Math.floor(Math.log(dist / number_major_tick_intervals) / Math.LN10));
        // console.log("delta", delta,  b.upper, b.lower, dist, dist / number_major_tick_intervals * 1.1)
        //                     if (5 * delta < dist / number_major_tick_intervals * 1.1) {
        //                         return 5 * delta;
        //                     }
        //                     if (2 * delta < dist / number_major_tick_intervals * 1.1) {
        //                         return 2 * delta;
        //                     }

        //                     // < v1.6.0:
        //                     // delta = Math.pow(10, Math.floor(Math.log(0.6 * dist) / Math.LN10));
        //                     if (false && dist <= 6 * delta) {
        //                         delta *= 0.5;
        //                     }
        //                     return delta;
        //                 }

        //                 // In case of insertTicks==false
        //                 return this.evalVisProp('ticksdistance');
        //                 // return ticks;
        //             // };
        //         },

        /**
         * Checks whether (x,y) is near the line.
         * Only available for line elements,  not for ticks on curves.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the line, False otherwise.
         */
        hasPoint: function (x, y) {
            var i, t, r, type,
                len = (this.ticks && this.ticks.length) || 0;

            if (
                !this.line.evalVisProp('scalable') ||
                this.line.elementClass === Const.OBJECT_CLASS_CURVE
            ) {
                return false;
            }

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                r = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                r = this.board.options.precision.hasPoint;
            }
            r += this.evalVisProp('strokewidth') * 0.5;

            // Ignore non-axes and axes that are not horizontal or vertical
            if (
                this.line.stdform[1] !== 0 &&
                this.line.stdform[2] !== 0 &&
                this.line.type !== Const.OBJECT_TYPE_AXIS
            ) {
                return false;
            }

            for (i = 0; i < len; i++) {
                t = this.ticks[i];

                // Skip minor ticks
                if (t[2]) {
                    // Ignore ticks at zero
                    if (
                        !(
                            (this.line.stdform[1] === 0 &&
                                Math.abs(t[0][0] - this.line.point1.coords.scrCoords[1]) <
                                Mat.eps) ||
                            (this.line.stdform[2] === 0 &&
                                Math.abs(t[1][0] - this.line.point1.coords.scrCoords[2]) <
                                Mat.eps)
                        )
                    ) {
                        // tick length is not zero, ie. at least one pixel
                        if (
                            Math.abs(t[0][0] - t[0][1]) >= 1 ||
                            Math.abs(t[1][0] - t[1][1]) >= 1
                        ) {
                            // Allow dragging near axes only.
                            if (this.line.stdform[1] === 0) {
                                if (
                                    Math.abs(y - this.line.point1.coords.scrCoords[2]) < 2 * r &&
                                    t[0][0] - r < x && x < t[0][1] + r
                                ) {
                                    return true;
                                }
                            } else if (this.line.stdform[2] === 0) {
                                if (
                                    Math.abs(x - this.line.point1.coords.scrCoords[1]) < 2 * r &&
                                    t[1][0] - r < y && y < t[1][1] + r
                                ) {
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

            if (
                this.line.type !== Const.OBJECT_TYPE_AXIS ||
                !this.line.evalVisProp('scalable')
            ) {
                return this;
            }

            if (
                Math.abs(this.line.stdform[1]) < Mat.eps &&
                Math.abs(c.usrCoords[1] * oldc.usrCoords[1]) > Mat.eps
            ) {
                // Horizontal line
                dx = oldc.usrCoords[1] / c.usrCoords[1];
                bb[0] *= dx;
                bb[2] *= dx;
                this.board.setBoundingBox(bb, this.board.keepaspectratio, 'update');
            } else if (
                Math.abs(this.line.stdform[2]) < Mat.eps &&
                Math.abs(c.usrCoords[2] * oldc.usrCoords[2]) > Mat.eps
            ) {
                // Vertical line
                dy = oldc.usrCoords[2] / c.usrCoords[2];
                bb[3] *= dy;
                bb[1] *= dy;
                this.board.setBoundingBox(bb, this.board.keepaspectratio, 'update');
            }

            return this;
        },

        /**
         * (Re-)calculates the ticks coordinates.
         * @private
         */
        calculateTicksCoordinates: function () {
            var coordsZero, b, r_max, bb;

            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                // Calculate Ticks width and height in Screen and User Coordinates
                this.setTicksSizeVariables();

                // If the parent line is not finite, we can stop here.
                if (Math.abs(this.dx) < Mat.eps && Math.abs(this.dy) < Mat.eps) {
                    return;
                }
            }

            // Get Zero (coords element for lines, number for curves)
            coordsZero = this.getZeroCoordinates();

            // Calculate lower bound and upper bound limits based on distance
            // between p1 and center and p2 and center
            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                b = this.getLowerAndUpperBounds(coordsZero, 'ticksdistance');
            } else {
                b = {
                    lower: this.line.minX(),
                    upper: this.line.maxX(),
                    a1: 0,
                    a2: 0,
                    m1: 0,
                    m2: 0
                };
            }

            if (this.evalVisProp('type') === 'polar') {
                bb = this.board.getBoundingBox();
                r_max = Math.max(
                    Mat.hypot(bb[0], bb[1]),
                    Mat.hypot(bb[2], bb[3])
                );
                b.upper = r_max;
            }

            // Clean up
            this.ticks = [];
            this.labelsData = [];
            // Create Ticks Coordinates and Labels
            if (this.equidistant) {
                this.generateEquidistantTicks(coordsZero, b);
            } else {
                this.generateFixedTicks(coordsZero, b);
            }

            return this;
        },

        /**
         * Sets the variables used to set the height and slope of each tick.
         *
         * @private
         */
        setTicksSizeVariables: function (pos) {
            var d,
                mi,
                ma,
                len,
                distMaj = this.evalVisProp('majorheight') * 0.5,
                distMin = this.evalVisProp('minorheight') * 0.5;

            // For curves:
            if (Type.exists(pos)) {
                mi = this.line.minX();
                ma = this.line.maxX();
                len = this.line.points.length;
                if (len < 2) {
                    this.dxMaj = 0;
                    this.dyMaj = 0;
                } else if (Mat.relDif(pos, mi) < Mat.eps) {
                    this.dxMaj =
                        this.line.points[0].usrCoords[2] - this.line.points[1].usrCoords[2];
                    this.dyMaj =
                        this.line.points[1].usrCoords[1] - this.line.points[0].usrCoords[1];
                } else if (Mat.relDif(pos, ma) < Mat.eps) {
                    this.dxMaj =
                        this.line.points[len - 2].usrCoords[2] -
                        this.line.points[len - 1].usrCoords[2];
                    this.dyMaj =
                        this.line.points[len - 1].usrCoords[1] -
                        this.line.points[len - 2].usrCoords[1];
                } else {
                    this.dxMaj = -Numerics.D(this.line.Y)(pos);
                    this.dyMaj = Numerics.D(this.line.X)(pos);
                }
            } else {
                // ticks width and height in screen units
                this.dxMaj = this.line.stdform[1];
                this.dyMaj = this.line.stdform[2];
            }
            this.dxMin = this.dxMaj;
            this.dyMin = this.dyMaj;

            // ticks width and height in user units
            this.dx = this.dxMaj;
            this.dy = this.dyMaj;

            // After this, the length of the vector (dxMaj, dyMaj) in screen coordinates is equal to distMaj pixel.
            d = Mat.hypot(this.dxMaj * this.board.unitX, this.dyMaj * this.board.unitY);
            this.dxMaj *= (distMaj / d) * this.board.unitX;
            this.dyMaj *= (distMaj / d) * this.board.unitY;
            this.dxMin *= (distMin / d) * this.board.unitX;
            this.dyMin *= (distMin / d) * this.board.unitY;

            // Grid-like ticks?
            this.minStyle = this.evalVisProp('minorheight') < 0 ? "infinite" : 'finite';
            this.majStyle = this.evalVisProp('majorheight') < 0 ? "infinite" : 'finite';
        },

        /**
         * Returns the coordinates of the point zero of the line.
         *
         * If the line is an {@link Axis}, the coordinates of the projection of the board's zero point is returned
         *
         * Otherwise, the coordinates of the point that acts as zero are
         * established depending on the value of {@link JXG.Ticks#anchor}
         *
         * @returns {JXG.Coords} Coords object for the zero point on the line
         * @private
         */
        getZeroCoordinates: function () {
            var c1x, c1y, c1z, c2x, c2y, c2z,
                t, mi, ma,
                ev_a = this.evalVisProp('anchor');

            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                if (this.line.type === Const.OBJECT_TYPE_AXIS) {
                    return Geometry.projectPointToLine(
                        {
                            coords: {
                                usrCoords: [1, 0, 0]
                            }
                        },
                        this.line,
                        this.board
                    );
                }
                c1z = this.line.point1.coords.usrCoords[0];
                c1x = this.line.point1.coords.usrCoords[1];
                c1y = this.line.point1.coords.usrCoords[2];
                c2z = this.line.point2.coords.usrCoords[0];
                c2x = this.line.point2.coords.usrCoords[1];
                c2y = this.line.point2.coords.usrCoords[2];

                if (ev_a === 'right') {
                    return this.line.point2.coords;
                }
                if (ev_a === 'middle') {
                    return new Coords(
                        Const.COORDS_BY_USER,
                        [(c1z + c2z) * 0.5, (c1x + c2x) * 0.5, (c1y + c2y) * 0.5],
                        this.board
                    );
                }
                if (Type.isNumber(ev_a)) {
                    return new Coords(
                        Const.COORDS_BY_USER,
                        [
                            c1z + (c2z - c1z) * ev_a,
                            c1x + (c2x - c1x) * ev_a,
                            c1y + (c2y - c1y) * ev_a
                        ],
                        this.board
                    );
                }
                return this.line.point1.coords;
            }
            mi = this.line.minX();
            ma = this.line.maxX();
            if (ev_a === 'right') {
                t = ma;
            } else if (ev_a === 'middle') {
                t = (mi + ma) * 0.5;
            } else if (Type.isNumber(ev_a)) {
                t = mi * (1 - ev_a) + ma * ev_a;
                // t = ev_a;
            } else {
                t = mi;
            }
            return t;
        },

        /**
         * Calculate the lower and upper bounds for tick rendering.
         * If {@link JXG.Ticks#includeBoundaries} is false, the boundaries will exclude point1 and point2.
         *
         * @param  {JXG.Coords} coordsZero
         * @returns {String} [type] If type=='ticksdistance', the bounds are
         *                         the intersection of the line with the bounding box of the board, respecting
         *                         the value of the line attribute 'margin' and the width of arrow heads.
         *                         Otherwise, it is the projection of the corners of the bounding box
         *                         to the line - without the attribute 'margin' and width of arrow heads.
         *  <br>
         *                         The first case is needed to determine which ticks are displayed, i.e. where to stop.
         *                         The second case is to determine the distance between ticks in case of 'insertTicks:true'.
         * @returns {Object}     {lower: Number, upper: Number } containing the lower and upper bounds in user units.
         *
         * @private
         */
        getLowerAndUpperBounds: function (coordsZero, type) {
            var lowerBound, upperBound,
                fA, lA,
                point1, point2,
                isPoint1inBoard, isPoint2inBoard,
                // We use the distance from zero to P1 and P2 to establish lower and higher points
                dZeroPoint1, dZeroPoint2,
                arrowData,
                // angle,
                a1, a2, m1, m2,
                eps = Mat.eps * 10,
                ev_sf = this.line.evalVisProp('straightfirst'),
                ev_sl = this.line.evalVisProp('straightlast'),
                ev_i = this.evalVisProp('includeboundaries');

            // The line's defining points that will be adjusted to be within the board limits
            if (this.line.elementClass === Const.OBJECT_CLASS_CURVE) {
                return {
                    lower: this.line.minX(),
                    upper: this.line.maxX()
                };
            }

            point1 = new Coords(Const.COORDS_BY_USER, this.line.point1.coords.usrCoords, this.board);
            point2 = new Coords(Const.COORDS_BY_USER, this.line.point2.coords.usrCoords, this.board);

            // Are the original defining points within the board?
            isPoint1inBoard =
                Math.abs(point1.usrCoords[0]) >= Mat.eps &&
                point1.scrCoords[1] >= 0.0 &&
                point1.scrCoords[1] <= this.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 &&
                point1.scrCoords[2] <= this.board.canvasHeight;
            isPoint2inBoard =
                Math.abs(point2.usrCoords[0]) >= Mat.eps &&
                point2.scrCoords[1] >= 0.0 &&
                point2.scrCoords[1] <= this.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 &&
                point2.scrCoords[2] <= this.board.canvasHeight;

            // Adjust line limit points to be within the board
            if (Type.exists(type) && type === 'ticksdistance') {
                // The good old calcStraight is needed for determining the distance between major ticks.
                // Here, only the visual area is of importance
                Geometry.calcStraight(this.line, point1, point2, 0);
                m1 = this.getDistanceFromZero(coordsZero, point1);
                m2 = this.getDistanceFromZero(coordsZero, point2);
                Geometry.calcStraight(this.line, point1, point2, this.line.evalVisProp('margin'));
                m1 = this.getDistanceFromZero(coordsZero, point1) - m1;
                m2 = this.getDistanceFromZero(coordsZero, point2).m2;
            } else {
                // This function projects the corners of the board to the line.
                // This is important for diagonal lines with infinite tick lines.
                Geometry.calcLineDelimitingPoints(this.line, point1, point2);
            }

            // Shorten ticks bounds such that ticks are not through arrow heads
            fA = this.line.evalVisProp('firstarrow');
            lA = this.line.evalVisProp('lastarrow');

            a1 = this.getDistanceFromZero(coordsZero, point1);
            a2 = this.getDistanceFromZero(coordsZero, point2);
            if (fA || lA) {
                // Do not display ticks at through arrow heads.
                // In arrowData we ignore the highlighting status.
                // Ticks would appear to be too nervous.
                arrowData = this.board.renderer.getArrowHeadData(
                    this.line,
                    this.line.evalVisProp('strokewidth'),
                    ''
                );

                this.board.renderer.getPositionArrowHead(
                    this.line,
                    point1,
                    point2,
                    arrowData
                );
            }
            // Calculate (signed) distance from Zero to P1 and to P2
            dZeroPoint1 = this.getDistanceFromZero(coordsZero, point1);
            dZeroPoint2 = this.getDistanceFromZero(coordsZero, point2);

            // Recompute lengths of arrow heads
            a1 = dZeroPoint1 - a1;
            a2 = dZeroPoint1 - a2;

            // We have to establish if the direction is P1->P2 or P2->P1 to set the lower and upper
            // bounds appropriately. As the distances contain also a sign to indicate direction,
            // we can compare dZeroPoint1 and dZeroPoint2 to establish the line direction
            if (dZeroPoint1 < dZeroPoint2) {
                // Line goes P1->P2
                lowerBound = dZeroPoint1;
                upperBound = dZeroPoint2;

                if (!ev_sf && isPoint1inBoard && !ev_i) {
                    lowerBound += eps;
                }
                if (!ev_sl && isPoint2inBoard && !ev_i) {
                    upperBound -= eps;
                }
            } else if (dZeroPoint2 < dZeroPoint1) {
                // Line goes P2->P1
                // Does this happen at all?
                lowerBound = dZeroPoint2;
                upperBound = dZeroPoint1;

                if (!ev_sl && isPoint2inBoard && !ev_i) {
                    lowerBound += eps;
                }
                if (!ev_sf && isPoint1inBoard && !ev_i) {
                    upperBound -= eps;
                }
            } else {
                // P1 = P2 = Zero, we can't do a thing
                lowerBound = 0;
                upperBound = 0;
            }

            return {
                lower: lowerBound,
                upper: upperBound,
                a1: a1,
                a2: a2,
                m1: m1,
                m2: m2
            };
        },

        /**
         * Calculates the signed distance in user coordinates from zero to a given point.
         * Sign is positive, if the direction from zero to point is the same as the direction
         * zero to point2 of the line.
         *
         * @param  {JXG.Coords} zero  coordinates of the point considered zero
         * @param  {JXG.Coords} point coordinates of the point to find out the distance
         * @returns {Number}           distance between zero and point, including its sign
         * @private
         */
        getDistanceFromZero: function (zero, point) {
            var p1, p2, dirLine, dirPoint, distance;

            p1 = this.line.point1.coords;
            p2 = this.line.point2.coords;
            distance = zero.distance(Const.COORDS_BY_USER, point);

            // Establish sign
            dirLine = [
                p2.usrCoords[0] - p1.usrCoords[0],
                p2.usrCoords[1] - p1.usrCoords[1],
                p2.usrCoords[2] - p1.usrCoords[2]
            ];
            dirPoint = [
                point.usrCoords[0] - zero.usrCoords[0],
                point.usrCoords[1] - zero.usrCoords[1],
                point.usrCoords[2] - zero.usrCoords[2]
            ];
            if (Mat.innerProduct(dirLine, dirPoint, 3) < 0) {
                distance *= -1;
            }

            return distance;
        },

        /**
         * Creates ticks coordinates and labels automatically.
         * The frequency of ticks is affected by the values of {@link JXG.Ticks#insertTicks}, {@link JXG.Ticks#minTicksDistance},
         * and {@link JXG.Ticks#ticksDistance}
         *
         * @param  {JXG.Coords} coordsZero coordinates of the point considered zero
         * @param  {Object}     bounds     contains the lower and upper bounds for ticks placement
         * @private
         */
        generateEquidistantTicks: function (coordsZero, bounds) {
            var tickPosition,
                eps = Mat.eps,
                deltas, ticksDelta,
                // ev_mia = this.evalVisProp('minorticksinarrow'),
                // ev_maa = this.evalVisProp('minorticksinarrow'),
                // ev_mla = this.evalVisProp('minorticksinarrow'),
                ev_mt = this.evalVisProp('minorticks');

            // Determine a proposed distance between major ticks in user units
            ticksDelta = this.getDistanceMajorTicks();

            // Obsolete, since this.equidistant is always true at this point
            // ticksDelta = this.equidistant ? this.ticksFunction(1) : this.ticksDelta;

            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                // Calculate x and y distances between two points on the line which are 1 unit apart
                // In essence, these are cosine and sine.
                deltas = this.getXandYdeltas();
            }

            ticksDelta *= this.evalVisProp('scale');

            // In case of insertTicks, adjust ticks distance to satisfy the minTicksDistance restriction.
            // if (ev_it) { // } && this.minTicksDistance > Mat.eps) {
            //     ticksDelta = this.adjustTickDistance(ticksDelta, coordsZero, deltas);
            // }

            // Convert ticksdelta to the distance between two minor ticks
            ticksDelta /= (ev_mt + 1);
            this.ticksDelta = ticksDelta;

            if (ticksDelta < Mat.eps) {
                return;
            }
            if (Math.abs(bounds.upper - bounds.lower) > ticksDelta * 2048) {
                JXG.warn("JSXGraph ticks: too many ticks (>2048). Please increase ticksDistance.");
                return;
            }

            // Position ticks from zero to the positive side while not reaching the upper boundary
            tickPosition = 0;
            if (!this.evalVisProp('drawzero')) {
                tickPosition = ticksDelta;
            }
            if (tickPosition < bounds.lower) {
                // Jump from 0 to bounds.lower
                tickPosition = Math.floor((bounds.lower - eps) / ticksDelta) * ticksDelta;
            }
            while (tickPosition <= bounds.upper + eps) {
                // Only draw ticks when we are within bounds, ignore case where tickPosition < lower < upper
                if (tickPosition >= bounds.lower - eps) {
                    this.processTickPosition(coordsZero, tickPosition, ticksDelta, deltas);
                }
                tickPosition += ticksDelta;

                // Emergency out (probably obsolete)
                if (bounds.upper - tickPosition > ticksDelta * 10000) {
                    break;
                }
            }

            // Position ticks from zero (not inclusive) to the negative side while not reaching the lower boundary
            tickPosition = -ticksDelta;
            if (tickPosition > bounds.upper) {
                // Jump from -ticksDelta to bounds.upper
                tickPosition = Math.ceil((bounds.upper + eps) / (-ticksDelta)) * (-ticksDelta);
            }
            while (tickPosition >= bounds.lower - eps) {
                // Only draw ticks when we are within bounds, ignore case where lower < upper < tickPosition
                if (tickPosition <= bounds.upper + eps) {
                    this.processTickPosition(coordsZero, tickPosition, ticksDelta, deltas);
                }
                tickPosition -= ticksDelta;

                // Emergency out (probably obsolete)
                if (tickPosition - bounds.lower > ticksDelta * 10000) {
                    break;
                }
            }
        },

        /**
         * Calculates the distance between two major ticks in user units.
         * <ul>
         * <li> If the attribute "insertTicks" is false, the value of the attribute
         * "ticksDistance" is returned. The attribute "minTicksDistance" is ignored in this case.
         * <li> If the attribute "insertTicks" is true, the attribute "ticksDistance" is ignored.
         * The distance between two major ticks is computed
         * as <i>a 10<sup>i</sup></i>, where <i>a</i> is one of <i>{1, 2, 5}</i> and
         * the number <i>a 10<sup>i</sup></i> is maximized such that there are approximately
         * 6 major ticks and there are at least "minTicksDistance" pixel between minor ticks.
         * The latter restriction has priority over the number of major ticks.
         * </ul>
         * @returns Number
         * @private
         */
        getDistanceMajorTicks: function () {
            var delta, delta2,
                b, d, dist,
                scale,
                numberMajorTicks = 5,
                maxDist, minDist, ev_mt;

            if (this.evalVisProp('insertticks')) {
                // Case of insertTicks==true:
                // Here, we ignore the attribute 'margin'
                b = this.getLowerAndUpperBounds(this.getZeroCoordinates(), '');

                dist = (b.upper - b.lower);
                scale = this.evalVisProp('scale');

                maxDist = dist / (numberMajorTicks + 1) / scale;
                minDist = this.evalVisProp('minticksdistance') / scale;
                ev_mt = this.evalVisProp('minorticks');

                d = this.getXandYdeltas();
                d.x *= this.board.unitX;
                d.y *= this.board.unitY;
                minDist /= Mat.hypot(d.x, d.y);
                minDist *= (ev_mt + 1);

                // Determine minimal delta to fulfill the minTicksDistance constraint
                delta = Math.pow(10, Math.floor(Math.log(minDist) / Math.LN10));
                if (2 * delta >= minDist) {
                    delta *= 2;
                } else if (5 * delta >= minDist) {
                    delta *= 5;
                }

                // Determine maximal delta to fulfill the constraint to have approx. "numberMajorTicks" majorTicks
                delta2 = Math.pow(10, Math.floor(Math.log(maxDist) / Math.LN10));
                if (5 * delta2 < maxDist) {
                    delta2 *= 5;
                } else if (2 * delta2 < maxDist) {
                    delta2 *= 2;
                }

                // Take the larger value of the two delta's, that is
                // minTicksDistance has priority over numberMajorTicks
                delta = Math.max(delta, delta2);

                // < v1.6.0:
                // delta = Math.pow(10, Math.floor(Math.log(0.6 * dist) / Math.LN10));
                // if (false && dist <= 6 * delta) {
                //     delta *= 0.5;
                // }
                return delta;
            }

            // Case of insertTicks==false
            return this.evalVisProp('ticksdistance');
        },

        //         /**
        //          * Auxiliary method used by {@link JXG.Ticks#generateEquidistantTicks} to adjust the
        //          * distance between two ticks depending on {@link JXG.Ticks#minTicksDistance} value
        //          *
        //          * @param  {Number}     ticksDelta  distance between two major ticks in user coordinates
        //          * @param  {JXG.Coords} coordsZero  coordinates of the point considered zero
        //          * @param  {Object}     deltas      x and y distance in pixel between two user units
        //          * @param  {Object}     bounds      upper and lower bound of the tick positions in user units.
        //          * @private
        //          */
        //         adjustTickDistance: function (ticksDelta, coordsZero, deltas) {
        //             var nx,
        //                 ny,
        //                 // bounds,
        //                 distScr,
        //                 sgn = 1,
        //                 ev_mintd = this.evalVisProp('minticksdistance'),
        //                 ev_minti = this.evalVisProp('minorticks');

        //             if (this.line.elementClass === Const.OBJECT_CLASS_CURVE) {
        //                 return ticksDelta;
        //             }
        //             // Seems to be ignored:
        //             // bounds = this.getLowerAndUpperBounds(coordsZero, 'ticksdistance');

        //             // distScr is the distance between two major Ticks in pixel
        //             nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta;
        //             ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta;
        //             distScr = coordsZero.distance(
        //                 Const.COORDS_BY_SCREEN,
        //                 new Coords(Const.COORDS_BY_USER, [nx, ny], this.board)
        //             );
        // // console.log(deltas, distScr, this.board.unitX, this.board.unitY, "ticksDelta:", ticksDelta);

        //             if (ticksDelta === 0.0) {
        //                 return 0.0;
        //             }

        // // console.log(":", distScr, ev_minti + 1, distScr / (ev_minti + 1), ev_mintd)
        //             while (false && distScr / (ev_minti + 1) < ev_mintd) {
        //                 if (sgn === 1) {
        //                     ticksDelta *= 2;
        //                 } else {
        //                     ticksDelta *= 5;
        //                 }
        //                 sgn *= -1;

        //                 nx = coordsZero.usrCoords[1] + deltas.x * ticksDelta;
        //                 ny = coordsZero.usrCoords[2] + deltas.y * ticksDelta;
        //                 distScr = coordsZero.distance(
        //                     Const.COORDS_BY_SCREEN,
        //                     new Coords(Const.COORDS_BY_USER, [nx, ny], this.board)
        //                 );
        //             }

        //             return ticksDelta;
        //         },

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
            var x,
                y,
                tickCoords,
                ti,
                ev_mt,
                isLabelPosition,
                ticksPerLabel = this.evalVisProp('ticksperlabel'),
                labelVal = null;

            // Calculates tick coordinates
            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                x = coordsZero.usrCoords[1] + tickPosition * deltas.x;
                y = coordsZero.usrCoords[2] + tickPosition * deltas.y;
            } else {
                x = this.line.X(coordsZero + tickPosition);
                y = this.line.Y(coordsZero + tickPosition);
            }
            tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);
            if (this.line.elementClass === Const.OBJECT_CLASS_CURVE) {
                labelVal = coordsZero + tickPosition;
                this.setTicksSizeVariables(labelVal);
            }

            ev_mt = this.evalVisProp('minorticks');
            // Test if tick is a major tick.
            // This is the case if tickPosition/ticksDelta is
            // a multiple of the number of minorticks+1
            tickCoords.major =
                Math.round(tickPosition / ticksDelta) % (ev_mt + 1) === 0;

            if (!ticksPerLabel) {
                // In case of null, 0 or false, majorTicks are labelled
                ticksPerLabel = ev_mt + 1;
            }
            isLabelPosition = Math.round(tickPosition / ticksDelta) % ticksPerLabel === 0;

            // Compute the start position and the end position of a tick.
            // If both positions are out of the canvas, ti is empty.
            ti = this.createTickPath(tickCoords, tickCoords.major);
            if (ti.length === 3) {
                this.ticks.push(ti);
                if (isLabelPosition && this.evalVisProp('drawlabels')) {
                    // Create a label at this position
                    this.labelsData.push(
                        this.generateLabelData(
                            this.generateLabelText(tickCoords, coordsZero, labelVal),
                            tickCoords,
                            this.ticks.length
                        )
                    );
                } else {
                    // minor ticks have no labels
                    this.labelsData.push(null);
                }
            }
        },

        /**
         * Creates ticks coordinates and labels based on {@link JXG.Ticks#fixedTicks} and {@link JXG.Ticks#labels}.
         *
         * @param  {JXG.Coords} coordsZero Coordinates of the point considered zero
         * @param  {Object}     bounds     contains the lower and upper bounds for ticks placement
         * @private
         */
        generateFixedTicks: function (coordsZero, bounds) {
            var tickCoords,
                labelText,
                i,
                ti,
                x,
                y,
                eps2 = Mat.eps,
                fixedTick,
                hasLabelOverrides = Type.isArray(this.visProp.labels),
                deltas,
                ev_dl = this.evalVisProp('drawlabels');

            if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                // Calculate x and y distances between two points on the line which are 1 unit apart
                // In essence, these are cosine and sine.
                deltas = this.getXandYdeltas();
            }
            for (i = 0; i < this.fixedTicks.length; i++) {
                if (this.line.elementClass === Const.OBJECT_CLASS_LINE) {
                    fixedTick = this.fixedTicks[i];
                    x = coordsZero.usrCoords[1] + fixedTick * deltas.x;
                    y = coordsZero.usrCoords[2] + fixedTick * deltas.y;
                } else {
                    fixedTick = coordsZero + this.fixedTicks[i];
                    x = this.line.X(fixedTick);
                    y = this.line.Y(fixedTick);
                }
                tickCoords = new Coords(Const.COORDS_BY_USER, [x, y], this.board);

                if (this.line.elementClass === Const.OBJECT_CLASS_CURVE) {
                    this.setTicksSizeVariables(fixedTick);
                }

                // Compute the start position and the end position of a tick.
                // If tick is out of the canvas, ti is empty.
                ti = this.createTickPath(tickCoords, true);
                if (
                    ti.length === 3 &&
                    fixedTick >= bounds.lower - eps2 &&
                    fixedTick <= bounds.upper + eps2
                ) {
                    this.ticks.push(ti);

                    if (ev_dl && (hasLabelOverrides || Type.exists(this.visProp.labels[i]))) {
                        labelText = hasLabelOverrides
                            ? this.evalVisProp('labels.' + i)
                            : fixedTick;
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
         * Calculates the x and y distances in user coordinates between two units in user space.
         * In essence, these are cosine and sine. The only work to be done is to determine
         * the direction of the line.
         *
         * @returns {Object}
         * @private
         */
        getXandYdeltas: function () {
            var // Auxiliary points to store the start and end of the line according to its direction
                point1UsrCoords,
                point2UsrCoords,
                distP1P2 = this.line.point1.Dist(this.line.point2);

            // if (this.line.type === Const.OBJECT_TYPE_AXIS) {
            //     // When line is an Axis, direction depends on board coordinates system
            //     // Assume line.point1 and line.point2 are in correct order
            //     point1UsrCoords = this.line.point1.coords.usrCoords;
            //     point2UsrCoords = this.line.point2.coords.usrCoords;
            //     // Check if direction is incorrect, then swap
            //     if (
            //         point1UsrCoords[1] > point2UsrCoords[1] ||
            //         (Math.abs(point1UsrCoords[1] - point2UsrCoords[1]) < Mat.eps &&
            //             point1UsrCoords[2] > point2UsrCoords[2])
            //     ) {
            //         point1UsrCoords = this.line.point2.coords.usrCoords;
            //         point2UsrCoords = this.line.point1.coords.usrCoords;
            //     }
            // } /* if (this.line.elementClass === Const.OBJECT_CLASS_LINE)*/ else {
                // Line direction is always from P1 to P2 for non axis types
                point1UsrCoords = this.line.point1.coords.usrCoords;
                point2UsrCoords = this.line.point2.coords.usrCoords;
            // }
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
        _isInsideCanvas: function (x, y, m) {
            var cw = this.board.canvasWidth,
                ch = this.board.canvasHeight;

            if (m === undefined) {
                m = 0;
            }
            return (
                (x[0] >= m && x[0] <= cw - m && y[0] >= m && y[0] <= ch - m) ||
                (x[1] >= m && x[1] <= cw - m && y[1] >= m && y[1] <= ch - m)
            );
        },

        /**
         * @param {JXG.Coords} coords Coordinates of the tick on the line.
         * @param {Boolean} major True if tick is major tick.
         * @returns {Array} Array of length 3 containing path coordinates in screen coordinates
         *                 of the tick (arrays of length 2). 3rd entry is true if major tick otherwise false.
         *                 If the tick is outside of the canvas, the return array is empty.
         * @private
         */
        createTickPath: function (coords, major) {
            var c,
                lineStdForm,
                intersection,
                dxs,
                dys,
                dxr,
                dyr,
                alpha,
                style,
                x = [-2000000, -2000000],
                y = [-2000000, -2000000],
                i, r, r_max, bb, full, delta,
                // Used for infinite ticks
                te0, te1, // Tick ending visProps
                dists; // 'signed' distances of intersections to the parent line

            c = coords.scrCoords;
            if (major) {
                dxs = this.dxMaj;
                dys = this.dyMaj;
                style = this.majStyle;
                te0 = this.evalVisProp('majortickendings.0') > 0;
                te1 = this.evalVisProp('majortickendings.1') > 0;
            } else {
                dxs = this.dxMin;
                dys = this.dyMin;
                style = this.minStyle;
                te0 = this.evalVisProp('tickendings.0') > 0;
                te1 = this.evalVisProp('tickendings.1') > 0;
            }
            lineStdForm = [-dys * c[1] - dxs * c[2], dys, dxs];

            // For all ticks regardless if of finite or infinite
            // tick length the intersection with the canvas border is
            // computed.
            if (major && this.evalVisProp('type') === 'polar') {
                // polar style
                bb = this.board.getBoundingBox();
                full = 2.0 * Math.PI;
                delta = full / 180;
                //ratio = this.board.unitY / this.board.X;

                // usrCoords: Test if 'circle' is inside of the canvas
                c = coords.usrCoords;
                r = Mat.hypot(c[1], c[2]);
                r_max = Math.max(
                    Mat.hypot(bb[0], bb[1]),
                    Mat.hypot(bb[2], bb[3])
                );

                if (r < r_max) {
                    // Now, switch to screen coords
                    x = [];
                    y = [];
                    for (i = 0; i <= full; i += delta) {
                        x.push(
                            this.board.origin.scrCoords[1] + r * Math.cos(i) * this.board.unitX
                        );
                        y.push(
                            this.board.origin.scrCoords[2] + r * Math.sin(i) * this.board.unitY
                        );
                    }
                    return [x, y, major];
                }
            } else {
                // line style
                if (style === 'infinite') {
                    // Problematic are infinite ticks which have set tickendings:[0,1].
                    // For example, this is the default setting for minor ticks
                    if (this.evalVisProp('ignoreinfinitetickendings')) {
                        te0 = te1 = true;
                    }
                    intersection = Geometry.meetLineBoard(lineStdForm, this.board);

                    if (te0 && te1) {
                        x[0] = intersection[0].scrCoords[1];
                        x[1] = intersection[1].scrCoords[1];
                        y[0] = intersection[0].scrCoords[2];
                        y[1] = intersection[1].scrCoords[2];
                    } else {
                        // Assuming the usrCoords of both intersections are normalized, a 'signed distance'
                        // with respect to the parent line is computed for the intersections. The sign is
                        // used to conclude whether the point is either at the left or right side of the
                        // line. The magnitude can be used to compare the points and determine which point
                        // is closest to the line.
                        dists = [
                            Mat.innerProduct(
                                intersection[0].usrCoords.slice(1, 3),
                                this.line.stdform.slice(1, 3)
                            ) + this.line.stdform[0],
                            Mat.innerProduct(
                                intersection[1].usrCoords.slice(1, 3),
                                this.line.stdform.slice(1, 3)
                            ) + this.line.stdform[0]
                        ];

                        // Reverse intersection array order if first intersection is not the leftmost one.
                        if (dists[0] < dists[1]) {
                            intersection.reverse();
                            dists.reverse();
                        }

                        if (te0) { // Left-infinite tick
                            if (dists[0] < 0) { // intersections at the wrong side of line
                                return [];
                            } else if (dists[1] < 0) { // 'default' case, tick drawn from line to board bounds
                                x[0] = intersection[0].scrCoords[1];
                                y[0] = intersection[0].scrCoords[2];
                                x[1] = c[1];
                                y[1] = c[2];
                            } else { // tick visible, but coords of tick on line are outside the visible area
                                x[0] = intersection[0].scrCoords[1];
                                y[0] = intersection[0].scrCoords[2];
                                x[1] = intersection[1].scrCoords[1];
                                y[1] = intersection[1].scrCoords[2];
                            }
                        } else if (te1) { // Right-infinite tick
                            if (dists[1] > 0) { // intersections at the wrong side of line
                                return [];
                            } else if (dists[0] > 0) { // 'default' case, tick drawn from line to board bounds
                                x[0] = c[1];
                                y[0] = c[2];
                                x[1] = intersection[1].scrCoords[1];
                                y[1] = intersection[1].scrCoords[2];
                            } else { // tick visible, but coords of tick on line are outside the visible area
                                x[0] = intersection[0].scrCoords[1];
                                y[0] = intersection[0].scrCoords[2];
                                x[1] = intersection[1].scrCoords[1];
                                y[1] = intersection[1].scrCoords[2];
                            }
                        }
                    }
                } else {
                    if (this.evalVisProp('face') === ">") {
                        alpha = Math.PI / 4;
                    } else if (this.evalVisProp('face') === "<") {
                        alpha = -Math.PI / 4;
                    } else {
                        alpha = 0;
                    }
                    dxr = Math.cos(alpha) * dxs - Math.sin(alpha) * dys;
                    dyr = Math.sin(alpha) * dxs + Math.cos(alpha) * dys;

                    x[0] = c[1] + dxr * te0;
                    y[0] = c[2] - dyr * te0;
                    x[1] = c[1];
                    y[1] = c[2];

                    alpha = -alpha;
                    dxr = Math.cos(alpha) * dxs - Math.sin(alpha) * dys;
                    dyr = Math.sin(alpha) * dxs + Math.cos(alpha) * dys;

                    x[2] = c[1] - dxr * te1;
                    y[2] = c[2] + dyr * te1;
                }

                // Check if (parts of) the tick is inside the canvas.
                if (this._isInsideCanvas(x, y)) {
                    return [x, y, major];
                }
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
        formatLabelText: function (value) {
            var labelText,
                digits,
                ev_um = this.evalVisProp('label.usemathjax'),
                ev_uk = this.evalVisProp('label.usekatex'),
                ev_s = this.evalVisProp('scalesymbol');

            if (Type.isNumber(value)) {
                if (this.evalVisProp('label.tofraction')) {
                    if (ev_um) {
                        labelText = '\\(' + Type.toFraction(value, true) + '\\)';
                    } else {
                        labelText = Type.toFraction(value, ev_uk);
                    }
                } else {
                    digits = this.evalVisProp('digits');
                    if (this.useLocale()) {
                        labelText = this.formatNumberLocale(value, digits);
                    } else {
                        labelText = (Math.round(value * 1e11) / 1e11).toString();

                        if (
                            labelText.length > this.evalVisProp('maxlabellength') ||
                            labelText.indexOf('e') !== -1
                        ) {
                            if (this.evalVisProp('precision') !== 3 && digits === 3) {
                                // Use the deprecated attribute "precision"
                                digits = this.evalVisProp('precision');
                            }

                            //labelText = value.toPrecision(digits).toString();
                            labelText = value.toExponential(digits).toString();
                        }
                    }
                }

                if (this.evalVisProp('beautifulscientificticklabels')) {
                    labelText = this.beautifyScientificNotationLabel(labelText);
                }

                if (labelText.indexOf('.') > -1 && labelText.indexOf('e') === -1) {
                    // trim trailing zeros
                    labelText = labelText.replace(/0+$/, "");
                    // trim trailing .
                    labelText = labelText.replace(/\.$/, "");
                }
            } else {
                labelText = value.toString();
            }

            if (ev_s.length > 0) {
                if (labelText === '1') {
                    labelText = ev_s;
                } else if (labelText === "-1") {
                    labelText = "-" + ev_s;
                } else if (labelText !== '0') {
                    labelText = labelText + ev_s;
                }
            }

            if (this.evalVisProp('useunicodeminus')) {
                labelText = labelText.replace(/-/g, "\u2212");
            }
            return labelText;
        },

        /**
         * Formats label texts to make labels displayed in scientific notation look beautiful.
         * For example, label 5.00e+6 will become 5•10⁶, label -1.00e-7 will become into -1•10⁻⁷
         * @param {String} labelText - The label that we want to convert
         * @returns {String} If labelText was not in scientific notation, return labelText without modifications.
         * Otherwise returns beautified labelText with proper superscript notation.
         */
        beautifyScientificNotationLabel: function (labelText) {
            var returnString;

            if (labelText.indexOf('e') === -1) {
                return labelText;
            }

            // Clean up trailing 0's, so numbers like 5.00e+6.0 for example become into 5e+6
            returnString =
                parseFloat(labelText.substring(0, labelText.indexOf('e'))) +
                labelText.substring(labelText.indexOf('e'));

            // Replace symbols like -,0,1,2,3,4,5,6,7,8,9 with their superscript version.
            // Gets rid of + symbol since there is no need for it anymore.
            returnString = returnString.replace(/e(.*)$/g, function (match, $1) {
                var temp = "\u2022" + '10';
                // Note: Since board ticks do not support HTTP elements like <sub>, we need to replace
                // all the numbers with superscript Unicode characters.
                temp += $1
                    .replace(/-/g, "\u207B")
                    .replace(/\+/g, "")
                    .replace(/0/g, "\u2070")
                    .replace(/1/g, "\u00B9")
                    .replace(/2/g, "\u00B2")
                    .replace(/3/g, "\u00B3")
                    .replace(/4/g, "\u2074")
                    .replace(/5/g, "\u2075")
                    .replace(/6/g, "\u2076")
                    .replace(/7/g, "\u2077")
                    .replace(/8/g, "\u2078")
                    .replace(/9/g, "\u2079");

                return temp;
            });

            return returnString;
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
            var labelText, distance;

            // No value provided, equidistant, so assign distance as value
            if (!Type.exists(value)) {
                // could be null or undefined
                distance = this.getDistanceFromZero(zero, tick);
                if (Math.abs(distance) < Mat.eps) {
                    // Point is zero
                    return '0';
                }
                value = distance / this.evalVisProp('scale');
            }
            labelText = this.formatLabelText(value);

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
            fs = this.evalVisProp('label.fontsize');
            xa = [tick.scrCoords[1], tick.scrCoords[1]];
            ya = [tick.scrCoords[2], tick.scrCoords[2]];
            m = fs === undefined ? 12 : fs;
            m *= 0.5;
            if (!this._isInsideCanvas(xa, ya, m)) {
                return null;
            }

            xa = this.evalVisProp('label.offset')[0];
            ya = this.evalVisProp('label.offset')[1];

            return {
                x: tick.usrCoords[1] + xa / this.board.unitX,
                y: tick.usrCoords[2] + ya / this.board.unitY,
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
                //this.visPropCalc.visible = this.evalVisProp('visible');
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
        updateRendererLabels: function () {
            var i, j, lenData, lenLabels, attr, label, ld, visible;

            // The number of labels needed
            lenData = this.labelsData.length;
            // The number of labels which already exist
            // The existing labels are stored in this.labels[]
            // The new label positions and label values are stored in this.labelsData[]
            lenLabels = this.labels.length;

            for (i = 0, j = 0; i < lenData; i++) {
                if (this.labelsData[i] === null) {
                    // This is a tick without label
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

                    attr = Type.deepCopy(this.visProp.label);
                    attr.isLabel = true;
                    attr.priv = this.visProp.priv;
                    attr.id = this.id + ld.i + "Label" + this.labelCounter;

                    label = JXG.createText(this.board, [ld.x, ld.y, ld.t], attr);
                    this.addChild(label);
                    label.setParents(this);
                    label.isDraggable = false;
                    label.dump = false;
                    this.labels.push(label);
                }

                // Look-ahead if the label inherits visibility.
                // If yes, update label.
                visible = this.evalVisProp('label.visible');
                if (visible === 'inherit') {
                    visible = this.visPropCalc.visible;
                }

                label.prepareUpdate().updateVisibility(visible).updateRenderer();

                label.distanceX = this.evalVisProp('label.offset')[0];
                label.distanceY = this.evalVisProp('label.offset')[1];
            }

            // Hide unused labels
            lenData = j;
            for (j = lenData; j < lenLabels; j++) {
                this.board.renderer.display(this.labels[j], false);
                // Tick labels have the attribute "visible: 'inherit'"
                // This must explicitly set to false, otherwise
                // this labels would be set to visible in the upcoming
                // update of the labels.
                this.labels[j].visProp.visible = this.labels[j].visPropCalc.visible = false;
            }

            return this;
        },

        hideElement: function () {
            var i;

            JXG.deprecated("Element.hideElement()", "Element.setDisplayRendNode()");

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

            JXG.deprecated("Element.showElement()", "Element.setDisplayRendNode()");

            this.visPropCalc.visible = true;
            this.board.renderer.display(this, false);

            for (i = 0; i < this.labels.length; i++) {
                if (Type.exists(this.labels[i])) {
                    this.labels[i].showElement();
                }
            }

            return this;
        }
    }
);

/**
 * @class Ticks are used as distance markers on a line or curve.
 * They are mainly used for axis elements and slider elements. Ticks may stretch infinitely
 * or finitely, which can be set with {@link Ticks#majorHeight} and {@link Ticks#minorHeight}.
 * <p>
 * There are the following ways to position the tick lines:
 * <ol>
 *  <li> If an array is given as optional second parameter for the constructor
 * like e.g. <tt>board.create('ticks', [line, [1, 4, 5]])</tt>, then there will be (fixed) ticks at position
 * 1, 4 and 5 of the line.
 *  <li> If there is only one parameter given, like e.g. <tt>board.create('ticks', [line])</tt>, the ticks will be set
 * equidistant across the line element. There are two variants:
 *    <ol type="i">
 *      <li> Setting the attribute <tt>insertTicks:false</tt>: in this case the distance between two major ticks
 *          is determined by the attribute <tt>ticksDistance</tt>. This distance is given in user units.
 *      <li> Setting the attribute <tt>insertTicks:true</tt>: in this case the distance between two major ticks
 *          is set automatically, depending on
 *          <ul>
 *              <li> the size of the board,
 *              <li> the attribute <tt>minTicksDistance</tt>,  which is the minimum distance between two consecutive minor ticks (in pixel).
 *          </ul>
 * The distance between two major ticks is a value of the form
 * <i>a 10<sup>i</sup></i>, where <i>a</i> is one of <i>{1, 2, 5}</i> and
 * the number <i>a 10<sup>i</sup></i> is maximized such that there are approximately
 * 6 major ticks and there are at least "minTicksDistance" pixel between minor ticks.
 * </ol>
 * <p>
 * For arbitrary lines (and not axes) a "zero coordinate" is determined
 * which defines where the first tick is positioned. This zero coordinate
 * can be altered with the attribute <tt>anchor</tt>. Possible values are "left", "middle", "right" or a number.
 * The default value is "left".
 *
 * @pseudo
 * @name Ticks
 * @augments JXG.Ticks
 * @constructor
 * @type JXG.Ticks
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line|JXG.Curve} line The parents consist of the line or curve the ticks are going to be attached to.
 * @param {Array} [ticks] Optional array of numbers. If given, a fixed number of static ticks is created
 * at these user-supplied positions.
 * <p>
 * Deprecated: Alternatively, a number defining the distance between two major ticks
 * can be specified. However, this is meanwhile ignored. Use attribute <tt>ticksDistance</tt> instead.
 *
 * @example
 * // Add ticks to line 'l1' through 'p1' and 'p2'. The major ticks are
 * // two units apart and 40 px long.
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('ticks', [l1], {
 *      ticksDistance: 2,
 *      majorHeight: 40
 *   });
 * </pre><div class="jxgbox" id="JXGee7f2d68-75fc-4ec0-9931-c76918427e63" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGee7f2d68-75fc-4ec0-9931-c76918427e63', {
 *   boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: true});
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('ticks', [l1, 2], {ticksDistance: 2, majorHeight: 40});
 * })();
 * </script><pre>
 * @example
 *  // Create ticks labels as fractions
 * board.create('axis', [[0,1], [1,1]], {
 *     ticks: {
 *         label: {
 *             toFraction: true,
 *             useMathjax: true,
 *             display: 'html',
 *             anchorX: 'middle',
 *             offset: [0, -10]
 *         }
 *     }
 * });
 *
 * </pre><div id="JXG4455acb2-6bf3-4801-8887-d7fcc1e4e1da" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG4455acb2-6bf3-4801-8887-d7fcc1e4e1da',
 *             {boundingbox: [-1.2, 2.3, 1.2, -2.3], axis: true, showcopyright: false, shownavigation: false});
 *             board.create('axis', [[0,1], [1,1]], {
 *                 ticks: {
 *                     label: {
 *                         toFraction: true,
 *             useMathjax: true,
 *             display: 'html',
 *             anchorX: 'middle',
 *             offset: [0, -10]
 *                     }
 *                 }
 *             });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // TODO
 * 
 */
JXG.createTicks = function (board, parents, attributes) {
    var el,
        dist,
        attr = Type.copyAttributes(attributes, board.options, 'ticks');

    if (parents.length < 2) {
        dist = attr.ticksdistance; // Will be ignored anyhow and attr.ticksDistance will be used instead
    } else {
        dist = parents[1];
    }

    if (
        parents[0].elementClass === Const.OBJECT_CLASS_LINE ||
        parents[0].elementClass === Const.OBJECT_CLASS_CURVE
    ) {
        el = new JXG.Ticks(parents[0], dist, attr);
    } else {
        throw new Error(
            "JSXGraph: Can't create Ticks with parent types '" + typeof parents[0] + "'."
        );
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
 * @class Hatches are collections of short line segments used to mark congruent lines or curves.
 * @pseudo
 * @name Hatch
 * @augments JXG.Ticks
 * @constructor
 * @type JXG.Ticks
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line|JXG.curve} line The line or curve the hatch marks are going to be attached to.
 * @param {Number} numberofhashes Number of dashes. The distance of the hashes can be controlled with the attribute ticksDistance.
 * @example
 * // Create an axis providing two coords pairs.
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('hatch', [l1, 3]);
 * </pre><div class="jxgbox" id="JXG4a20af06-4395-451c-b7d1-002757cf01be" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG4a20af06-4395-451c-b7d1-002757cf01be', {boundingbox: [-1, 7, 7, -1], showcopyright: false, shownavigation: false});
 *   var p1 = board.create('point', [0, 3]);
 *   var p2 = board.create('point', [1, 3]);
 *   var l1 = board.create('line', [p1, p2]);
 *   var t = board.create('hatch', [l1, 3]);
 * })();
 * </script><pre>
 *
 * @example
 * // Alter the position of the hatch
 *
 * var p = board.create('point', [-5, 0]);
 * var q = board.create('point', [5, 0]);
 * var li = board.create('line', [p, q]);
 * var h = board.create('hatch', [li, 2], {anchor: 0.2, ticksDistance:0.4});
 *
 * </pre><div id="JXG05d720ee-99c9-11e6-a9c7-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG05d720ee-99c9-11e6-a9c7-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *
 *     var p = board.create('point', [-5, 0]);
 *     var q = board.create('point', [5, 0]);
 *     var li = board.create('line', [p, q]);
 *     var h = board.create('hatch', [li, 2], {anchor: 0.2, ticksDistance:0.4});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Alternative hatch faces
 *
 * var li = board.create('line', [[-6,0], [6,3]]);
 * var h1 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'|'});
 * var h2 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'>', anchor: 0.3});
 * var h3 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'<', anchor: 0.7});
 *
 * </pre><div id="JXG974f7e89-eac8-4187-9aa3-fb8068e8384b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG974f7e89-eac8-4187-9aa3-fb8068e8384b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Alternative hatch faces
 *
 *     var li = board.create('line', [[-6,0], [6,3]]);
 *     var h1 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'|'});
 *     var h2 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'>', anchor: 0.3});
 *     var h3 = board.create('hatch', [li, 2], {tickEndings: [1,1], face:'<', anchor: 0.7});
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

    if (
        (parents[0].elementClass !== Const.OBJECT_CLASS_LINE &&
            parents[0].elementClass !== Const.OBJECT_CLASS_CURVE) ||
        typeof parents[1] !== "number"
    ) {
        throw new Error(
            "JSXGraph: Can't create Hatch mark with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            " and ''" +
            typeof parents[2] +
            "'."
        );
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
    parents[0].inherits.push(el);

    return el;
};

JXG.registerElement("ticks", JXG.createTicks);
JXG.registerElement("hash", JXG.createHatchmark);
JXG.registerElement("hatch", JXG.createHatchmark);

export default JXG.Ticks;
// export default {
//     Ticks: JXG.Ticks,
//     createTicks: JXG.createTicks,
//     createHashmark: JXG.createHatchmark,
//     createHatchmark: JXG.createHatchmark
// };
