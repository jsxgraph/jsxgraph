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

import JXG from "../jxg.js";
import Geometry from "../math/geometry.js";
import Mat from "../math/math.js";
import Statistics from "../math/statistics.js";
import Coords from "../base/coords.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";

/**
 * @class A circular sector is a subarea of the area enclosed by a circle. It is enclosed by two radii and an arc.
 * <p>
 * The sector as curve consists of two legs and an arc. The curve length is 6. That means, a point with coordinates
 * [sector.X(t), sector.Y(t)] is on
 * <ul>
 * <li> leg 1 if t is between 0 and 1,
 * <li> the arc if t is between 1 and 5,
 * <li> leg 2 if t is between 5 and 6.
 * </ul>
 * @pseudo
 * @name Sector
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 *
 * First possibility of input parameters are:
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 A sector is defined by three points: The sector's center <tt>p1</tt>,
 * a second point <tt>p2</tt> defining the radius and a third point <tt>p3</tt> defining the angle of the sector. The
 * Sector is always drawn counter clockwise from <tt>p2</tt> to <tt>p3</tt>.
 * <p>
 * In this case, the sector will have an arc as sub-object.
 * <p>
 * Second possibility of input parameters are:
 * @param {JXG.Line_JXG.Line_array,number_array,number_number,function} line, line2, coords1 or direction1, coords2 or direction2, radius The sector is defined by two lines.
 * The two legs which define the sector are given by two coordinates arrays which are projected initially to the two lines or by
 * two directions (+/- 1). If the two lines are parallel, two of the defining points on different lines have to coincide.
 * This will be the center of the sector.
 * The last parameter is the radius of the sector.
 * <p>In this case, the sector will <b>not</b> have an arc as sub-object.
 *
 * @example
 * // Create a sector out of three free points
 * var p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('sector', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXG49f59123-f013-4681-bfd9-338b89893156" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG49f59123-f013-4681-bfd9-338b89893156', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('sector', [p1, p2, p3]);
 * })();
 * </script><pre>
 *
 * @example
 * // Create a sector out of two lines, two directions and a radius
 * var p1 = board.create('point', [-1, 4]),
 *  p2 = board.create('point', [4, 1]),
 *  q1 = board.create('point', [-2, -3]),
 *  q2 = board.create('point', [4,3]),
 *
 *  li1 = board.create('line', [p1,p2], {strokeColor:'black', lastArrow:true}),
 *  li2 = board.create('line', [q1,q2], {lastArrow:true}),
 *
 *  sec1 = board.create('sector', [li1, li2, [5.5, 0], [4, 3], 3]),
 *  sec2 = board.create('sector', [li1, li2, 1, -1, 4]);
 *
 * </pre><div class="jxgbox" id="JXGbb9e2809-9895-4ff1-adfa-c9c71d50aa53" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGbb9e2809-9895-4ff1-adfa-c9c71d50aa53', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [-1, 4]),
 *     p2 = board.create('point', [4, 1]),
 *     q1 = board.create('point', [-2, -3]),
 *     q2 = board.create('point', [4,3]),
 *
 *     li1 = board.create('line', [p1,p2], {strokeColor:'black', lastArrow:true}),
 *     li2 = board.create('line', [q1,q2], {lastArrow:true}),
 *
 *     sec1 = board.create('sector', [li1, li2, [5.5, 0], [4, 3], 3]),
 *     sec2 = board.create('sector', [li1, li2, 1, -1, 4]);
 * })();
 * </script><pre>
 *
 * @example
 * var t = board.create('transform', [2, 1.5], {type: 'scale'});
 * var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                 anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                 fillColor: 'yellow', strokeColor: 'black'});
 * var s2 = board.create('curve', [s1, t], {fillColor: 'yellow', strokeColor: 'black'});
 *
 * </pre><div id="JXG2e70ee14-6339-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG2e70ee14-6339-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var t = board.create('transform', [2, 1.5], {type: 'scale'});
 *     var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                     anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                     fillColor: 'yellow', strokeColor: 'black'});
 *     var s2 = board.create('curve', [s1, t], {fillColor: 'yellow', strokeColor: 'black'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var A = board.create('point', [3, -2]),
 *     B = board.create('point', [-2, -2]),
 *     C = board.create('point', [0, 4]);
 *
 * var angle = board.create('sector', [B, A, C], {
 *         strokeWidth: 0,
 *         arc: {
 *         	visible: true,
 *         	strokeWidth: 3,
 *           lastArrow: {size: 4},
 *           firstArrow: {size: 4}
 *         }
 *       });
 * //angle.arc.setAttribute({firstArrow: false});
 * angle.arc.setAttribute({lastArrow: false});
 *
 * </pre><div id="JXGca37b99e-1510-49fa-ac9e-efd60e956104" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGca37b99e-1510-49fa-ac9e-efd60e956104',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var A = board.create('point', [3, -2]),
 *         B = board.create('point', [-2, -2]),
 *         C = board.create('point', [0, 4]);
 *
 *     var angle = board.create('sector', [B, A, C], {
 *             strokeWidth: 0,
 *             arc: {
 *             	visible: true,
 *             	strokeWidth: 3,
 *               lastArrow: {size: 4},
 *               firstArrow: {size: 4}
 *             }
 *           });
 *     //angle.arc.setAttribute({firstArrow: false});
 *     angle.arc.setAttribute({lastArrow: false});
 *
 *     })();
 *
 * </script><pre>
 *
 *
 */
JXG.createSector = function (board, parents, attributes) {
    var el,
        attr,
        i,
        eps = 1.0e-14,
        type = "invalid",
        s, v,
        attrPoints = ["center", "radiusPoint", "anglePoint"],
        points;

    // Three points?
    if (
        parents[0].elementClass === Const.OBJECT_CLASS_LINE &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE &&
        (Type.isArray(parents[2]) || Type.isNumber(parents[2])) &&
        (Type.isArray(parents[3]) || Type.isNumber(parents[3])) &&
        (Type.isNumber(parents[4]) || Type.isFunction(parents[4]) || Type.isString(parents[4]))
    ) {
        type = '2lines';
    } else {
        points = Type.providePoints(board, parents, attributes, "sector", attrPoints);
        if (points === false) {
            throw new Error(
                "JSXGraph: Can't create Sector with parent types '" +
                    typeof parents[0] +
                    "' and '" +
                    typeof parents[1] +
                    "' and '" +
                    typeof parents[2] +
                    "'."
            );
        }
        type = '3points';
    }

    attr = Type.copyAttributes(attributes, board.options, 'sector');
    // The curve length is 6: 0-1: leg 1, 1-5: arc, 5-6: leg 2
    el = board.create("curve", [[0], [0], 0, 6], attr);
    el.type = Const.OBJECT_TYPE_SECTOR;
    el.elType = 'sector';

    /**
     * Sets radius if the attribute `radius` has value 'auto'.
     * Sets a radius between 20 and 50 points, depending on the distance
     * between the center and the radius point.
     * This function is used in {@link Angle}.
     *
     * @name autoRadius
     * @memberof Sector.prototype
     * @function
     * @returns {Number} returns a radius value in user coordinates.
     * @private
     */
    el.autoRadius = function () {
        var r1 = 20 / el.board.unitX, // 20px
            r2 = Infinity,
            r3 = 50 / el.board.unitX; // 50px

        if (Type.isPoint(el.center)) {
            // This does not work for 2-lines sectors / angles
            r2 = el.center.Dist(el.point2) * 0.3333;
        }

        return Math.max(r1, Math.min(r2, r3));
    };

    if (type === '2lines') {
        /**
         * @ignore
         */
        el.Radius = function () {
            var r = Type.evaluate(parents[4]);
            if (r === 'auto') {
                return this.autoRadius();
            }
            return r;
        };

        el.line1 = board.select(parents[0]);
        el.line2 = board.select(parents[1]);

        el.line1.addChild(el);
        el.line2.addChild(el);
        el.setParents(parents);

        el.point1 = { visProp: {} };
        el.point2 = { visProp: {} };
        el.point3 = { visProp: {} };

        // Intersection point, just used locally for direction1 and  direction2
        s = Geometry.meetLineLine(el.line1.stdform, el.line2.stdform, 0, board);
        if (Geometry.distance(s.usrCoords, [0, 0, 0], 3) < eps) {
            // Parallel lines
            if (
                el.line1.point1.Dist(el.line2.point1) < eps ||
                el.line1.point1.Dist(el.line2.point2) < eps
            ) {
                s = el.line1.point1.coords;
            } else if (
                el.line1.point2.Dist(el.line2.point1) < eps ||
                el.line1.point2.Dist(el.line2.point1) < eps
            ) {
                s = el.line1.point2.coords;
            } else {
                console.log(
                    "JSXGraph warning: Can't create Sector from parallel lines with no common defining point."
                );
            }
        }

        if (Type.isArray(parents[2])) {
            /* project p1 to l1 */
            if (parents[2].length === 2) {
                parents[2] = [1].concat(parents[2]);
            }
            /*
                v = [0, el.line1.stdform[1], el.line1.stdform[2]];
                v = Mat.crossProduct(v, parents[2]);
                v = Geometry.meetLineLine(v, el.line1.stdform, 0, board);
                */
            v = Geometry.projectPointToLine(
                { coords: { usrCoords: parents[2] } },
                el.line1,
                board
            );
            v = Statistics.subtract(v.usrCoords, s.usrCoords);
            el.direction1 =
                Mat.innerProduct(v, [0, el.line1.stdform[2], -el.line1.stdform[1]], 3) >= 0
                    ? +1
                    : -1;
        } else {
            el.direction1 = parents[2] >= 0 ? 1 : -1;
        }

        if (Type.isArray(parents[3])) {
            /* project p2 to l2 */
            if (parents[3].length === 2) {
                parents[3] = [1].concat(parents[3]);
            }
            /*
                v = [0, el.line2.stdform[1], el.line2.stdform[2]];
                v = Mat.crossProduct(v, parents[3]);
                v = Geometry.meetLineLine(v, el.line2.stdform, 0, board);
                */
            v = Geometry.projectPointToLine(
                { coords: { usrCoords: parents[3] } },
                el.line2,
                board
            );
            v = Statistics.subtract(v.usrCoords, s.usrCoords);
            el.direction2 =
                Mat.innerProduct(v, [0, el.line2.stdform[2], -el.line2.stdform[1]], 3) >= 0
                    ? +1
                    : -1;
        } else {
            el.direction2 = parents[3] >= 0 ? 1 : -1;
        }

        el.methodMap = JXG.deepCopy(el.methodMap, {
            arc: "arc",
            center: "center",
            line1: "line1",
            line2: "line2"
        });

        /**
         * @class
         * @ignore
         */
        el.updateDataArray = function () {
            var r,
                l1, l2,
                eps = 1.0e-14,
                A = [0, 0, 0],
                B = [0, 0, 0],
                C = [0, 0, 0],
                ar;

            l1 = this.line1;
            l2 = this.line2;

            // Intersection point of the lines
            B = Mat.crossProduct(l1.stdform, l2.stdform);
            if (Geometry.distance(B, [0, 0, 0], 3) < eps) {
                // Parallel lines
                if (
                    l1.point1.Dist(l2.point1) < eps ||
                    l1.point1.Dist(l2.point2) < eps
                ) {
                    B = l1.point1.coords.usrCoords;
                } else if (
                    l1.point2.Dist(l2.point1) < eps ||
                    l1.point2.Dist(l2.point1) < eps
                ) {
                    B = l1.point2.coords.usrCoords;
                } else {
                }
            }

            if (Math.abs(B[0]) > eps) {
                B[1] /= B[0];
                B[2] /= B[0];
                B[0] /= B[0];
            }
            // First point
            r = this.direction1 * this.Radius();
            A = Statistics.add(B, [0, r * l1.stdform[2], -r * l1.stdform[1]]);

            // Second point
            r = this.direction2 * this.Radius();
            C = Statistics.add(B, [0, r * l2.stdform[2], -r * l2.stdform[1]]);

            this.point2.coords = new Coords(Const.COORDS_BY_USER, A, el.board);
            this.point1.coords = new Coords(Const.COORDS_BY_USER, B, el.board);
            this.point3.coords = new Coords(Const.COORDS_BY_USER, C, el.board);

            if (
                Math.abs(A[0]) < Mat.eps ||
                Math.abs(B[0]) < Mat.eps ||
                Math.abs(C[0]) < Mat.eps
            ) {
                this.dataX = [NaN];
                this.dataY = [NaN];
                return;
            }

            ar = Geometry.bezierArc(A, B, C, true, 1);

            this.dataX = ar[0];
            this.dataY = ar[1];

            this.bezierDegree = 3;
        };

        // Arc does not work yet, since point1, point2 and point3 are
        // virtual points.
        //
        // attr = Type.copyAttributes(attributes, board.options, 'arc');
        // attr = Type.copyAttributes(attr, board.options, "sector", 'arc');
        // attr.withlabel = false;
        // attr.name += "_arc";
        // // el.arc = board.create("arc", [el.point1, el.point2, el.point3], attr);
        // // The arc's radius is always the radius of sector.
        // // This is important for angles.
        // el.updateDataArray();
        // el.arc = board.create("arc", [
        //     function() {
        //         return el.point1.coords.usrCoords;
        //     }, // Center
        //     function() {
        //         var d = el.point2.coords.distance(Const.COORDS_BY_USER, el.point1.coords);
        //         if (d === 0) {
        //             return [el.point1.coords.usrCoords[1], el.point1.coords.usrCoords[2]];
        //         }
        //         return [
        //             el.point1.coords.usrCoords[1] + el.Radius() * (el.point2.coords.usrCoords[1] - el.point1.coords.usrCoords[1]) / d,
        //             el.point1.coords.usrCoords[2] + el.Radius() * (el.point2.coords.usrCoords[2] - el.point1.coords.usrCoords[2]) / d
        //         ];
        //     },
        //     function() {
        //         return el.point3.coords.usrCoords;
        //     }, // Center
        // ], attr);
        // el.addChild(el.arc);

        // end '2lines'
    } else if (type === '3points') {
        /**
         * Midpoint of the sector.
         * @memberOf Sector.prototype
         * @name point1
         * @type JXG.Point
         */
        el.point1 = points[0];

        /**
         * This point together with {@link Sector#point1} defines the radius.
         * @memberOf Sector.prototype
         * @name point2
         * @type JXG.Point
         */
        el.point2 = points[1];

        /**
         * Defines the sector's angle.
         * @memberOf Sector.prototype
         * @name point3
         * @type JXG.Point
         */
        el.point3 = points[2];

        /* Add arc as child to defining points */
        for (i = 0; i < 3; i++) {
            if (Type.exists(points[i]._is_new)) {
                el.addChild(points[i]);
                delete points[i]._is_new;
            } else {
                points[i].addChild(el);
            }
        }

        // useDirection is necessary for circumCircleSectors
        el.useDirection = attributes.usedirection; // this makes the attribute immutable
        el.setParents(points);

        /**
         * Defines the sectors orientation in case of circumCircleSectors.
         * @memberOf Sector.prototype
         * @name point4
         * @type JXG.Point
         */
        if (Type.exists(points[3])) {
            el.point4 = points[3];
            el.point4.addChild(el);
        }

        el.methodMap = JXG.deepCopy(el.methodMap, {
            arc: "arc",
            center: "center",
            radiuspoint: "radiuspoint",
            anglepoint: "anglepoint"
        });

        /**
         * @class
         * @ignore
         */
        el.updateDataArray = function () {
            var ar, det,
                p0c, p1c, p2c,
                A = this.point2,
                B = this.point1,
                C = this.point3,
                phi,
                sgn = 1,
                vp_s = this.evalVisProp('selection');

            if (!A.isReal || !B.isReal || !C.isReal) {
                this.dataX = [NaN];
                this.dataY = [NaN];
                return;
            }

            phi = Geometry.rad(A, B, C);
            if ((vp_s === "minor" && phi > Math.PI) || (vp_s === "major" && phi < Math.PI)) {
                sgn = -1;
            }

            // This is true for circumCircleSectors. In that case there is
            // a fourth parent element: [midpoint, point1, point3, point2]
            if (this.useDirection && Type.exists(this.point4)) {
                p0c = this.point2.coords.usrCoords;
                p1c = this.point4.coords.usrCoords;
                p2c = this.point3.coords.usrCoords;
                det =
                    (p0c[1] - p2c[1]) * (p0c[2] - p1c[2]) -
                    (p0c[2] - p2c[2]) * (p0c[1] - p1c[1]);

                if (det >= 0.0) {
                    C = this.point2;
                    A = this.point3;
                }
            }

            A = A.coords.usrCoords;
            B = B.coords.usrCoords;
            C = C.coords.usrCoords;

            ar = Geometry.bezierArc(A, B, C, true, sgn);

            this.dataX = ar[0];
            this.dataY = ar[1];
            this.bezierDegree = 3;
        };

        /**
         * Returns the radius of the sector.
         * @memberOf Sector.prototype
         * @name Radius
         * @function
         * @returns {Number} The distance between {@link Sector#point1} and {@link Sector#point2}.
         */
        el.Radius = function () {
            return this.point2.Dist(this.point1);
        };
    } // end '3points'

    el.center = el.point1;
    el.radiuspoint = el.point2;
    el.anglepoint = el.point3;

    attr = Type.copyAttributes(attributes, board.options, 'arc');
    attr = Type.copyAttributes(attr, board.options, "sector", 'arc');
    attr.withlabel = false;
    // Minor or major arc:
    attr.selection = el.visProp.selection;
    attr.name += "_arc";

    if (type === '2lines') {
        el.updateDataArray();
        el.arc = board.create("arc", [
            function() {
                return el.point1.coords.usrCoords;
            }, // Center
            function() {
                var d = el.point2.coords.distance(Const.COORDS_BY_USER, el.point1.coords);
                if (d === 0) {
                    return [el.point1.coords.usrCoords[1], el.point1.coords.usrCoords[2]];
                }
                return [
                    el.point1.coords.usrCoords[1] + el.Radius() * (el.point2.coords.usrCoords[1] - el.point1.coords.usrCoords[1]) / d,
                    el.point1.coords.usrCoords[2] + el.Radius() * (el.point2.coords.usrCoords[2] - el.point1.coords.usrCoords[2]) / d
                ];
            },
            function() {
                return el.point3.coords.usrCoords;
            } // Center
        ], attr);
    } else {
        // The arc's radius is always the radius of sector.
        // This is important for angles.
        el.arc = board.create("arc", [
            el.point1, // Center
            function() {
                var d = el.point2.Dist(el.point1);
                if (d === 0) {
                    return [el.point1.X(), el.point1.Y()];
                }
                return [
                    el.point1.X() + el.Radius() * (el.point2.X() - el.point1.X()) / d,
                    el.point1.Y() + el.Radius() * (el.point2.Y() - el.point1.Y()) / d
                ];
            },
            el.point3
        ], attr);
    }
    el.addChild(el.arc);

    // Default hasPoint method. Documented in geometry element
    el.hasPointCurve = function (x, y) {
        var angle,
            alpha,
            beta,
            prec,
            type,
            checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
            r = this.Radius(),
            dist = this.center.coords.distance(Const.COORDS_BY_USER, checkPoint),
            has,
            vp_s = this.evalVisProp('selection');

        if (Type.isObject(this.evalVisProp('precision'))) {
            type = this.board._inputDevice;
            prec = this.evalVisProp('precision.' + type);
        } else {
            // 'inherit'
            prec = this.board.options.precision.hasPoint;
        }
        prec /= Math.min(Math.abs(this.board.unitX), Math.abs(this.board.unitY));
        has = Math.abs(dist - r) < prec;
        if (has) {
            angle = Geometry.rad(this.point2, this.center, checkPoint.usrCoords.slice(1));
            alpha = 0;
            beta = Geometry.rad(this.point2, this.center, this.point3);

            if ((vp_s === "minor" && beta > Math.PI) || (vp_s === "major" && beta < Math.PI)) {
                alpha = beta;
                beta = 2 * Math.PI;
            }

            if (angle < alpha || angle > beta) {
                has = false;
            }
        }

        return has;
    };

    /**
     * Checks whether (x,y) is within the area defined by the sector.
     * @memberOf Sector.prototype
     * @name hasPointSector
     * @function
     * @param {Number} x Coordinate in x direction, screen coordinates.
     * @param {Number} y Coordinate in y direction, screen coordinates.
     * @returns {Boolean} True if (x,y) is within the sector defined by the arc, False otherwise.
     */
    el.hasPointSector = function (x, y) {
        var angle,
            checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
            r = this.Radius(),
            dist = this.point1.coords.distance(Const.COORDS_BY_USER, checkPoint),
            alpha,
            beta,
            has = dist < r,
            vp_s = this.evalVisProp('selection');

        if (has) {
            angle = Geometry.rad(this.radiuspoint, this.center, checkPoint.usrCoords.slice(1));
            alpha = 0.0;
            beta = Geometry.rad(this.radiuspoint, this.center, this.anglepoint);

            if ((vp_s === "minor" && beta > Math.PI) || (vp_s === "major" && beta < Math.PI)) {
                alpha = beta;
                beta = 2 * Math.PI;
            }
            //if (angle > Geometry.rad(this.point2, this.point1, this.point3)) {
            if (angle < alpha || angle > beta) {
                has = false;
            }
        }
        return has;
    };

    el.hasPoint = function (x, y) {
        if (
            this.evalVisProp('highlightonsector') ||
            this.evalVisProp('hasinnerpoints')
        ) {
            return this.hasPointSector(x, y);
        }

        return this.hasPointCurve(x, y);
    };

    // documented in GeometryElement
    el.getTextAnchor = function () {
        return this.point1.coords;
    };

    // documented in GeometryElement
    // this method is very similar to arc.getLabelAnchor()
    // there are some additions in the arc version though, mainly concerning
    // "major" and "minor" arcs. but maybe these methods can be merged.
    /**
     * @class
     * @ignore
     */
    el.getLabelAnchor = function () {
        var coords,
            vec, vecx, vecy,
            len,
            pos = this.label.evalVisProp('position'),
            angle = Geometry.rad(this.point2, this.point1, this.point3),
            dx = 13 / this.board.unitX,
            dy = 13 / this.board.unitY,
            p2c = this.point2.coords.usrCoords,
            pmc = this.point1.coords.usrCoords,
            bxminusax = p2c[1] - pmc[1],
            byminusay = p2c[2] - pmc[2],
            vp_s = this.evalVisProp('selection'),
            l_vp = this.label ? this.label.visProp : this.visProp.label;

        // If this is uncommented, the angle label can not be dragged
        //if (Type.exists(this.label)) {
        //    this.label.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
        //}

        if (
            !Type.isString(pos) ||
            (pos.indexOf('right') < 0 && pos.indexOf('left') < 0)
        ) {

            if ((vp_s === "minor" && angle > Math.PI) || (vp_s === "major" && angle < Math.PI)) {
                angle = -(2 * Math.PI - angle);
            }

            coords = new Coords(
                Const.COORDS_BY_USER,
                [
                    pmc[1] + Math.cos(angle * 0.5) * bxminusax - Math.sin(angle * 0.5) * byminusay,
                    pmc[2] + Math.sin(angle * 0.5) * bxminusax + Math.cos(angle * 0.5) * byminusay
                ],
                this.board
            );

            vecx = coords.usrCoords[1] - pmc[1];
            vecy = coords.usrCoords[2] - pmc[2];

            len = Mat.hypot(vecx, vecy);
            vecx = (vecx * (len + dx)) / len;
            vecy = (vecy * (len + dy)) / len;
            vec = [pmc[1] + vecx, pmc[2] + vecy];

            l_vp.position = Geometry.calcLabelQuadrant(Geometry.rad([1, 0], [0, 0], vec));

            return new Coords(Const.COORDS_BY_USER, vec, this.board);
        } else {
            return this.getLabelPosition(pos, this.label.evalVisProp('distance'));
        }
    };

    /**
     * Overwrite the Radius method of the sector.
     * Used in {@link GeometryElement#setAttribute}.
     * @memberOf Sector.prototype
     * @name setRadius
     * @param {Number|Function} value New radius.
     * @function
     */
    el.setRadius = function (val) {
        var res,
            e = Type.evaluate(val);

        if (val === 'auto' || e === 'auto') {
            res = 'auto';
        } else if (Type.isNumber(val)) {
            res = 'number';
        } else if (Type.isFunction(val) && !Type.isString(e)) {
            res = 'function';
        } else {
            res = 'undefined';
        }
        if (res !== 'undefined') {
            this.visProp.radius = val;
        }

        /**
         * @ignore
         */
        el.Radius = function () {
            var r = Type.evaluate(val);
            if (r === 'auto') {
                return this.autoRadius();
            }
            return r;
        };
    };

    /**
     * @deprecated
     * @ignore
     */
    el.getRadius = function () {
        JXG.deprecated("Sector.getRadius()", "Sector.Radius()");
        return this.Radius();
    };

    /**
     * Length of the sector's arc or the angle in various units, see {@link Arc#Value}.
     * @memberOf Sector.prototype
     * @name Value
     * @function
     * @param {String} unit
     * @returns {Number} The arc length or the angle value in various units.
     * @see Arc#Value
     */
    el.Value = function(unit) {
        return this.arc.Value(unit);
    };

    /**
     * Arc length.
     * @memberOf Sector.prototype
     * @name L
     * @returns {Number} Length of the sector's arc.
     * @function
     * @see Arc#L
     */
    el.L = function() {
        return this.arc.L();
    };

    /**
     * Area of the sector.
     * @memberOf Sector.prototype
     * @name Area
     * @function
     * @returns {Number} The area of the sector.
     */
    el.Area = function () {
        var r = this.Radius();

        return 0.5 * r * r * this.Value('radians');
    };

    /**
     * Sector perimeter, i.e. arc length plus 2 * radius.
     * @memberOf Sector.prototype
     * @name Perimeter
     * @function
     * @returns {Number} Perimeter of sector.
     */
    el.Perimeter = function () {
        return this.L() + 2 * this.Radius();
    };

    if (type === '3points') {
        /**
         * Moves the sector by the difference of two coordinates.
         * @memberOf Sector.prototype
         * @name setPositionDirectly
         * @function
         * @param {Number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} oldcoords previous coordinates in screen/user units
         * @returns {JXG.Curve} this element
         * @private
         */
        el.setPositionDirectly = function (method, coords, oldcoords) {
            var dc, t,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board);

            if (!el.point1.draggable() || !el.point2.draggable() || !el.point3.draggable()) {
                return this;
            }

            dc = Statistics.subtract(c.usrCoords, oldc.usrCoords);
            t = this.board.create("transform", dc.slice(1), { type: "translate" });
            t.applyOnce([el.point1, el.point2, el.point3]);

            return this;
        };
    }

    el.methodMap = JXG.deepCopy(el.methodMap, {
        radius: "Radius",
        Radius: "Radius",
        getRadius: "Radius",
        setRadius: "setRadius",
        Value: "Value",
        L: "L",
        Area: "Area",
        Perimeter: "Perimeter"
    });

    return el;
};

JXG.registerElement("sector", JXG.createSector);

/**
 * @class A sector whose arc is a circum circle arc through three points.
 * A circumcircle sector is different from a {@link Sector} mostly in the way the parent elements are interpreted.
 * At first, the circum center is determined from the three given points.
 * Then the sector is drawn from <tt>p1</tt> through
 * <tt>p2</tt> to <tt>p3</tt>.
 * @pseudo
 * @name CircumcircleSector
 * @augments Sector
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 A circumcircle sector is defined by the circumcircle which is determined
 * by these three given points. The circumcircle sector is always drawn from <tt>p1</tt> through <tt>p2</tt> to <tt>p3</tt>.
 * @example
 * // Create an arc out of three free points
 * var p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('circumcirclesector', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXG695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('circumcirclesector', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createCircumcircleSector = function (board, parents, attributes) {
    var el, mp, attr, points;

    points = Type.providePoints(board, parents, attributes, 'point');
    if (points === false) {
        throw new Error(
            "JSXGraph: Can't create circumcircle sector with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'."
        );
    }

    mp = board.create("circumcenter", points.slice(0, 3), attr);
    mp.dump = false;

    attr = Type.copyAttributes(attributes, board.options, 'circumcirclesector');
    el = board.create("sector", [mp, points[0], points[2], points[1]], attr);

    el.elType = 'circumcirclesector';
    el.setParents(points);

    /**
     * Center of the circumcirclesector
     * @memberOf CircumcircleSector.prototype
     * @name center
     * @type Circumcenter
     */
    el.center = mp;
    el.subs = {
        center: mp
    };

    return el;
};

JXG.registerElement("circumcirclesector", JXG.createCircumcircleSector);

/**
 * @class A minor sector is a sector of a circle having measure at most
 * 180 degrees (pi radians). It is defined by a center, one point that
 * defines the radius, and a third point that defines the angle of the sector.
 * @pseudo
 * @name MinorSector
 * @augments Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Minor sector is a sector of a circle around p1 having measure less than or equal to
 * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
 * @example
 * // Create sector out of three free points
 * var p1 = board.create('point', [2.0, 2.0]);
 * var p2 = board.create('point', [1.0, 0.5]);
 * var p3 = board.create('point', [3.5, 1.0]);
 *
 * var a = board.create('minorsector', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXGaf27ddcc-265f-428f-90dd-d31ace945800" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGaf27ddcc-265f-428f-90dd-d31ace945800', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [2.0, 2.0]),
 *       p2 = board.create('point', [1.0, 0.5]),
 *       p3 = board.create('point', [3.5, 1.0]),
 *
 *       a = board.create('minorsector', [p1, p2, p3]);
 * })();
 * </script><pre>
 *
 * @example
 * var A = board.create('point', [3, -2]),
 *     B = board.create('point', [-2, -2]),
 *     C = board.create('point', [0, 4]);
 *
 * var angle = board.create('minorsector', [B, A, C], {
 *         strokeWidth: 0,
 *         arc: {
 *         	visible: true,
 *         	strokeWidth: 3,
 *           lastArrow: {size: 4},
 *           firstArrow: {size: 4}
 *         }
 *       });
 * //angle.arc.setAttribute({firstArrow: false});
 * angle.arc.setAttribute({lastArrow: false});
 *
 *
 * </pre><div id="JXGdddf3c8f-4b0c-4268-8171-8fcd30e71f60" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGdddf3c8f-4b0c-4268-8171-8fcd30e71f60',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var A = board.create('point', [3, -2]),
 *         B = board.create('point', [-2, -2]),
 *         C = board.create('point', [0, 4]);
 *
 *     var angle = board.create('minorsector', [B, A, C], {
 *             strokeWidth: 0,
 *             arc: {
 *             	visible: true,
 *             	strokeWidth: 3,
 *               lastArrow: {size: 4},
 *               firstArrow: {size: 4}
 *             }
 *           });
 *     //angle.arc.setAttribute({firstArrow: false});
 *     angle.arc.setAttribute({lastArrow: false});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createMinorSector = function (board, parents, attributes) {
    attributes.selection = 'minor';
    return JXG.createSector(board, parents, attributes);
};

JXG.registerElement("minorsector", JXG.createMinorSector);

/**
 * @class A major sector is a sector of a circle having measure at least
 * 180 degrees (pi radians). It is defined by a center, one point that
 * defines the radius, and a third point that defines the angle of the sector.
 * @pseudo
 * @name MajorSector
 * @augments Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Major sector is a sector of a circle around p1 having measure greater than or equal to
 * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
 * @example
 * // Create an arc out of three free points
 * var p1 = board.create('point', [2.0, 2.0]);
 * var p2 = board.create('point', [1.0, 0.5]);
 * var p3 = board.create('point', [3.5, 1.0]);
 *
 * var a = board.create('majorsector', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXG83c6561f-7561-4047-b98d-036248a00932" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG83c6561f-7561-4047-b98d-036248a00932', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [2.0, 2.0]),
 *       p2 = board.create('point', [1.0, 0.5]),
 *       p3 = board.create('point', [3.5, 1.0]),
 *
 *       a = board.create('majorsector', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createMajorSector = function (board, parents, attributes) {
    attributes.selection = 'major';
    return JXG.createSector(board, parents, attributes);
};

JXG.registerElement("majorsector", JXG.createMajorSector);

/**
 * @class Angle sector defined by three points or two lines.
 * Visually it is just a {@link Sector}
 * element with a radius not defined by the parent elements but by an attribute <tt>radius</tt>. As opposed to the sector,
 * an angle has two angle points and no radius point.
 * Sector is displayed if type=="sector".
 * If type=="square", instead of a sector a parallelogram is displayed.
 * In case of type=="auto", a square is displayed if the angle is near orthogonal. The precision
 * to decide if an angle is orthogonal is determined by the attribute
 * {@link Angle#orthoSensitivity}.
 * <p>
 * If no name is provided the angle label is automatically set to a lower greek letter. If no label should be displayed use
 * the attribute <tt>withLabel:false</tt> or set the name attribute to the empty string.
 *
 * @pseudo
 * @name Angle
 * @augments Sector
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * First possibility of input parameters are:
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 An angle is always drawn counterclockwise from <tt>p1</tt> to
 * <tt>p3</tt> around <tt>p2</tt>.
 *
 * Second possibility of input parameters are:
 * @param {JXG.Line_JXG.Line_array|number_array|number} line, line2, coords1 or direction1, coords2 or direction2, radius The angle is defined by two lines.
 * The two legs which define the angle are given by two coordinate arrays.
 * The points given by these coordinate arrays are projected initially (i.e. only once) onto the two lines.
 * The other possibility is to supply directions (+/- 1).
 *
 * @example
 * // Create an angle out of three free points
 * var p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('angle', [p1, p2, p3]),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * </pre><div class="jxgbox" id="JXGa34151f9-bb26-480a-8d6e-9b8cbf789ae5" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGa34151f9-bb26-480a-8d6e-9b8cbf789ae5', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('angle', [p1, p2, p3]),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * })();
 * </script><pre>
 *
 * @example
 * // Create an angle out of two lines and two directions
 * var p1 = board.create('point', [-1, 4]),
 *  p2 = board.create('point', [4, 1]),
 *  q1 = board.create('point', [-2, -3]),
 *  q2 = board.create('point', [4,3]),
 *
 *  li1 = board.create('line', [p1,p2], {strokeColor:'black', lastArrow:true}),
 *  li2 = board.create('line', [q1,q2], {lastArrow:true}),
 *
 *  a1 = board.create('angle', [li1, li2, [5.5, 0], [4, 3]], { radius:1 }),
 *  a2 = board.create('angle', [li1, li2, 1, -1], { radius:2 });
 *
 *
 * </pre><div class="jxgbox" id="JXG3a667ddd-63dc-4594-b5f1-afac969b371f" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG3a667ddd-63dc-4594-b5f1-afac969b371f', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [-1, 4]),
 *     p2 = board.create('point', [4, 1]),
 *     q1 = board.create('point', [-2, -3]),
 *     q2 = board.create('point', [4,3]),
 *
 *     li1 = board.create('line', [p1,p2], {strokeColor:'black', lastArrow:true}),
 *     li2 = board.create('line', [q1,q2], {lastArrow:true}),
 *
 *     a1 = board.create('angle', [li1, li2, [5.5, 0], [4, 3]], { radius:1 }),
 *     a2 = board.create('angle', [li1, li2, 1, -1], { radius:2 });
 * })();
 * </script><pre>
 *
 *
 * @example
 * // Display the angle value instead of the name
 * var p1 = board.create('point', [0,2]);
 * var p2 = board.create('point', [0,0]);
 * var p3 = board.create('point', [-2,0.2]);
 *
 * var a = board.create('angle', [p1, p2, p3], {
 * 	 radius: 1,
 *   name: function() {
 *   	return JXG.Math.Geometry.trueAngle(p1, p2, p3).toFixed(1) + '°';
 *   }});
 *
 * </pre><div id="JXGc813f601-8dd3-4030-9892-25c6d8671512" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc813f601-8dd3-4030-9892-25c6d8671512',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *
 *     var p1 = board.create('point', [0,2]);
 *     var p2 = board.create('point', [0,0]);
 *     var p3 = board.create('point', [-2,0.2]);
 *
 *     var a = board.create('angle', [p1, p2, p3], {
 *     	radius: 1,
 *       name: function() {
 *       	return JXG.Math.Geometry.trueAngle(p1, p2, p3).toFixed(1) + '°';
 *       }});
 *
 *     })();
 *
 * </script><pre>
 *
 *
 * @example
 * // Apply a transformation to an angle.
 * var t = board.create('transform', [2, 1.5], {type: 'scale'});
 * var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 * var an2 = board.create('curve', [an1, t]);
 *
 * </pre><div id="JXG4c8d9ed8-6339-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG4c8d9ed8-6339-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var t = board.create('transform', [2, 1.5], {type: 'scale'});
 *     var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 *     var an2 = board.create('curve', [an1, t]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createAngle = function (board, parents, attributes) {
    var el,
        radius, attr, attrsub,
        i, points,
        type = 'invalid';

    // Two lines or three points?
    if (
        parents[0].elementClass === Const.OBJECT_CLASS_LINE &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE &&
        (Type.isArray(parents[2]) || Type.isNumber(parents[2])) &&
        (Type.isArray(parents[3]) || Type.isNumber(parents[3]))
    ) {
        type = '2lines';
    } else {
        attr = {
            name: ''
        };
        points = Type.providePoints(board, parents, attr, 'point');
        if (points === false) {
            throw new Error(
                "JSXGraph: Can't create angle with parent types '" +
                    typeof parents[0] +
                    "' and '" +
                    typeof parents[1] +
                    "' and '" +
                    typeof parents[2] +
                    "'."
            );
        }
        type = '3points';
    }

    attr = Type.copyAttributes(attributes, board.options, 'angle');

    //  If empty, create a new name
    if (!Type.exists(attr.name) /*|| attr.name === ""*/) {
        attr.name = board.generateName({ type: Const.OBJECT_TYPE_ANGLE });
    }

    if (Type.exists(attr.radius)) {
        radius = attr.radius;
    } else {
        radius = 0;
    }

    board.suspendUpdate(); // Necessary for immediate availability of radius.
    if (type === '2lines') {
        // Angle defined by two lines
        parents.push(radius);
        el = board.create("sector", parents, attr);
        /**
         * @class
         * @ignore
         */
        el.updateDataArraySector = el.updateDataArray;

        // TODO
        /**
         * @class
         * @ignore
         */
        el.setAngle = function (val) {};
        /**
         * @class
         * @ignore
         */
        el.free = function (val) {};
    } else {
        // Angle defined by three points
        el = board.create("sector", [points[1], points[0], points[2]], attr);
        el.arc.visProp.priv = true;

        /**
         * The point defining the radius of the angle element.
         * Alias for {@link Sector#radiuspoint}.
         * @type JXG.Point
         * @name point
         * @memberOf Angle.prototype
         *
         */
        el.point = el.point2 = el.radiuspoint = points[0];

        /**
         * Helper point for angles of type 'square'.
         * @type JXG.Point
         * @name pointsquare
         * @memberOf Angle.prototype
         */
        el.pointsquare = el.point3 = el.anglepoint = points[2];

        /**
         * @ignore
         */
        el.Radius = function () {
            // Set the angle radius, also @see @link Sector#autoRadius
            var r = Type.evaluate(radius);
            if (r === 'auto') {
                return el.autoRadius();
            }
            return r;
        };

        /**
         * @class
         * @ignore
         */
        el.updateDataArraySector = function () {
            var A = this.point2,
                B = this.point1,
                C = this.point3,
                r = this.Radius(),
                d = B.Dist(A),
                ar,
                phi,
                sgn = 1,
                vp_s = this.evalVisProp('selection');

            phi = Geometry.rad(A, B, C);
            if ((vp_s === "minor" && phi > Math.PI) || (vp_s === "major" && phi < Math.PI)) {
                sgn = -1;
            }

            A = A.coords.usrCoords;
            B = B.coords.usrCoords;
            C = C.coords.usrCoords;

            A = [1, B[1] + ((A[1] - B[1]) * r) / d, B[2] + ((A[2] - B[2]) * r) / d];
            C = [1, B[1] + ((C[1] - B[1]) * r) / d, B[2] + ((C[2] - B[2]) * r) / d];

            ar = Geometry.bezierArc(A, B, C, true, sgn);

            this.dataX = ar[0];
            this.dataY = ar[1];
            this.bezierDegree = 3;
        };

        /**
         * Set an angle to a prescribed value given in radians.
         * This is only possible if the third point of the angle, i.e.
         * the anglepoint is a free point.
         * Removing the constraint again is done by calling "angle.free()".
         *
         * Changing the angle requires to call the method "free()":
         *
         * <pre>
         * angle.setAngle(Math.PI / 6);
         * // ...
         * angle.free().setAngle(Math.PI / 4);
         * </pre>
         *
         * @name setAngle
         * @memberof Angle.prototype
         * @function
         * @param {Number|Function} val Number or Function which returns the size of the angle in Radians
         * @returns {Object} Pointer to the angle element..
         * @see Angle#free
         *
         * @example
         * var p1, p2, p3, c, a, s;
         *
         * p1 = board.create('point',[0,0]);
         * p2 = board.create('point',[5,0]);
         * p3 = board.create('point',[0,5]);
         *
         * c1 = board.create('circle',[p1, p2]);
         *
         * a = board.create('angle',[p2, p1, p3], {radius:3});
         *
         * a.setAngle(function() {
         *     return Math.PI / 3;
         * });
         * board.update();
         *
         * </pre><div id="JXG987c-394f-11e6-af4a-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG987c-394f-11e6-af4a-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p1, p2, p3, c, a, s;
         *
         *     p1 = board.create('point',[0,0]);
         *     p2 = board.create('point',[5,0]);
         *     p3 = board.create('point',[0,5]);
         *
         *     c1 = board.create('circle',[p1, p2]);
         *
         *     a = board.create('angle',[p2, p1, p3], {radius: 3});
         *
         *     a.setAngle(function() {
         *         return Math.PI / 3;
         *     });
         *     board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var p1, p2, p3, c, a, s;
         *
         * p1 = board.create('point',[0,0]);
         * p2 = board.create('point',[5,0]);
         * p3 = board.create('point',[0,5]);
         *
         * c1 = board.create('circle',[p1, p2]);
         *
         * a = board.create('angle',[p2, p1, p3], {radius:3});
         * s = board.create('slider',[[-2,1], [2,1], [0, Math.PI*0.5, 2*Math.PI]]);
         *
         * a.setAngle(function() {
         *     return s.Value();
         * });
         * board.update();
         *
         * </pre><div id="JXG99957b1c-394f-11e6-af4a-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG99957b1c-394f-11e6-af4a-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p1, p2, p3, c, a, s;
         *
         *     p1 = board.create('point',[0,0]);
         *     p2 = board.create('point',[5,0]);
         *     p3 = board.create('point',[0,5]);
         *
         *     c1 = board.create('circle',[p1, p2]);
         *
         *     a = board.create('angle',[p2, p1, p3], {radius: 3});
         *     s = board.create('slider',[[-2,1], [2,1], [0, Math.PI*0.5, 2*Math.PI]]);
         *
         *     a.setAngle(function() {
         *         return s.Value();
         *     });
         *     board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         */
        el.setAngle = function (val) {
            var t1, t2,
                val2,
                p = this.anglepoint,
                q = this.radiuspoint;

            if (p.draggable()) {
                t1 = this.board.create("transform", [val, this.center], {
                    type: "rotate"
                });
                p.addTransform(q, t1);
                // Immediately apply the transformation.
                // This prevents that jumping elements can be watched.
                t1.update();
                p.moveTo(Mat.matVecMult(t1.matrix, q.coords.usrCoords));

                if (Type.isFunction(val)) {
                    /**
                     * @ignore
                     */
                    val2 = function () {
                        return Math.PI * 2 - val();
                    };
                } else {
                    /**
                     * @ignore
                     */
                    val2 = function () {
                        return Math.PI * 2 - val;
                    };
                }
                t2 = this.board.create("transform", [val2, this.center], {
                    type: "rotate"
                });
                p.coords.on("update", function () {
                    t2.update();
                    // q.moveTo(Mat.matVecMult(t2.matrix, p.coords.usrCoords));
                    q.setPositionDirectly(Const.COORDS_BY_USER, Mat.matVecMult(t2.matrix, p.coords.usrCoords));
                });

                p.setParents(q);

                this.hasFixedAngle = true;
            }
            return this;
        };

        /**
         * Frees an angle from a prescribed value. This is only relevant if the angle size has been set by
         * "setAngle()" previously. The anglepoint is set to a free point.
         * @name free
         * @function
         * @memberof Angle.prototype
         * @returns {Object} Pointer to the angle element..
         * @see Angle#setAngle
         */
        el.free = function () {
            var p = this.anglepoint;

            if (p.transformations.length > 0) {
                p.transformations.pop();
                p.isDraggable = true;
                p.parents = [];

                p.coords.off('update');
            }

            this.hasFixedAngle = false;

            return this;
        };

        el.setParents(points); // Important: This overwrites the parents order in underlying sector
    } // end '3points'

    // GEONExT compatible labels.
    if (Type.exists(el.visProp.text)) {
        el.label.setText(el.evalVisProp('text'));
    }

    el.elType = 'angle';
    el.type = Const.OBJECT_TYPE_ANGLE;
    el.subs = {};

    /**
     * @class
     * @ignore
     */
    el.updateDataArraySquare = function () {
        var A, B, C,
            d1, d2, v, l1, l2,
            r = this.Radius();

        if (type === '2lines') {
            // This is necessary to update this.point1, this.point2, this.point3.
            this.updateDataArraySector();
        }

        A = this.point2;
        B = this.point1;
        C = this.point3;

        A = A.coords.usrCoords;
        B = B.coords.usrCoords;
        C = C.coords.usrCoords;

        d1 = Geometry.distance(A, B, 3);
        d2 = Geometry.distance(C, B, 3);

        // In case of type=='2lines' this is redundant, because r == d1 == d2
        A = [1, B[1] + ((A[1] - B[1]) * r) / d1, B[2] + ((A[2] - B[2]) * r) / d1];
        C = [1, B[1] + ((C[1] - B[1]) * r) / d2, B[2] + ((C[2] - B[2]) * r) / d2];

        v = Mat.crossProduct(C, B);
        l1 = [-A[1] * v[1] - A[2] * v[2], A[0] * v[1], A[0] * v[2]];
        v = Mat.crossProduct(A, B);
        l2 = [-C[1] * v[1] - C[2] * v[2], C[0] * v[1], C[0] * v[2]];

        v = Mat.crossProduct(l1, l2);
        v[1] /= v[0];
        v[2] /= v[0];

        this.dataX = [B[1], A[1], v[1], C[1], B[1]];
        this.dataY = [B[2], A[2], v[2], C[2], B[2]];

        this.bezierDegree = 1;
    };

    /**
     * @class
     * @ignore
     */
    el.updateDataArrayNone = function () {
        this.dataX = [NaN];
        this.dataY = [NaN];
        this.bezierDegree = 1;
    };

    /**
     * @class
     * @ignore
     */
    el.updateDataArray = function () {
        var type = this.evalVisProp('type'),
            deg = Geometry.trueAngle(this.point2, this.point1, this.point3),
            vp_s = this.evalVisProp('selection');

        if ((vp_s === "minor" && deg > 180.0) || (vp_s === "major" && deg < 180.0)) {
            deg = 360.0 - deg;
        }

        if (Math.abs(deg - 90.0) < this.evalVisProp('orthosensitivity') + Mat.eps) {
            type = this.evalVisProp('orthotype');
        }

        if (type === 'none') {
            this.updateDataArrayNone();
            this.maxX = function() { return 0; };
        } else if (type === 'square') {
            this.updateDataArraySquare();
            this.maxX = function() { return 4; };
        } else if (type === 'sector') {
            this.updateDataArraySector();
            this.maxX = function() { return 6; };
        } else if (type === 'sectordot') {
            this.updateDataArraySector();
            this.maxX = function() { return 6; };
            if (!this.dot.visProp.visible) {
                this.dot.setAttribute({ visible: true });
            }
        }

        if (!this.visProp.visible || (type !== "sectordot" && this.dot.visProp.visible)) {
            this.dot.setAttribute({ visible: false });
        }
    };

    attrsub = Type.copyAttributes(attributes, board.options, "angle", 'dot');
    /**
     * Indicates a right angle. Invisible by default, use <tt>dot.visible: true</tt> to show.
     * Though this dot indicates a right angle, it can be visible even if the angle is not a right
     * one.
     * @type JXG.Point
     * @name dot
     * @memberOf Angle.prototype
     */
    el.dot = board.create(
        "point",
        [
            function () {
                var A, B, r, d, a2, co, si, mat, vp_s;

                if (Type.exists(el.dot) && !el.dot.visProp.visible) {
                    return [0, 0];
                }

                A = el.point2.coords.usrCoords;
                B = el.point1.coords.usrCoords;
                r = el.Radius();
                d = Geometry.distance(A, B, 3);
                a2 = Geometry.rad(el.point2, el.point1, el.point3);

                vp_s = el.evalVisProp('selection');
                if ((vp_s === "minor" && a2 > Math.PI) || (vp_s === "major" && a2 < Math.PI)) {
                    a2 = -(2 * Math.PI - a2);
                }
                a2 *= 0.5;

                co = Math.cos(a2);
                si = Math.sin(a2);

                A = [1, B[1] + ((A[1] - B[1]) * r) / d, B[2] + ((A[2] - B[2]) * r) / d];

                mat = [
                    [1, 0, 0],
                    [B[1] - 0.5 * B[1] * co + 0.5 * B[2] * si, co * 0.5, -si * 0.5],
                    [B[2] - 0.5 * B[1] * si - 0.5 * B[2] * co, si * 0.5, co * 0.5]
                ];
                return Mat.matVecMult(mat, A);
            }
        ],
        attrsub
    );

    el.dot.dump = false;
    el.subs.dot = el.dot;

    if (type === '2lines') {
        for (i = 0; i < 2; i++) {
            board.select(parents[i]).addChild(el.dot);
        }
    } else {
        for (i = 0; i < 3; i++) {
            board.select(points[i]).addChild(el.dot);
        }
    }
    board.unsuspendUpdate();

    /**
     * Returns the value of the angle.
     * @memberOf Angle.prototype
     * @name Value
     * @function
     * @param {String} [unit='length'] Unit of the returned values. Possible units are
     * <ul>
     * <li> 'radians' (default): angle value in radians
     * <li> 'degrees': angle value in degrees
     * <li> 'semicircle': angle value in radians as a multiple of &pi;, e.g. if the angle is 1.5&pi;, 1.5 will be returned.
     * <li> 'circle': angle value in radians as a multiple of 2&pi;
     * <li> 'length': length of the arc line of the angle
     * </ul>
     * It is sufficient to supply the first three characters of the unit, e.g. 'len'.
     * @returns {Number} angle value in various units.
     * @see Sector#L
     * @see Arc#Value
     * @example
     * var A, B, C, ang,
     *     r = 0.5;
     * A = board.create("point", [3, 0]);
     * B = board.create("point", [0, 0]);
     * C = board.create("point", [2, 2]);
     * ang = board.create("angle", [A, B, C], {radius: r});
     *
     * console.log(ang.Value());
     * // Output Math.PI * 0.25
     *
     * console.log(ang.Value('radian'));
     * // Output Math.PI * 0.25
     *
     * console.log(ang.Value('degree');
     * // Output 45
     *
     * console.log(ang.Value('semicircle'));
     * // Output 0.25
     *
     * console.log(ang.Value('circle'));
     * // Output 0.125
     *
     * console.log(ang.Value('length'));
     * // Output r * Math.PI * 0.25
     *
     * console.log(ang.L());
     * // Output r * Math.PI * 0.25
     *
     */
    el.Value = function(unit) {
        unit = unit || 'radians';
        if (unit === '') {
            unit = 'radians';
        }
        return el.arc.Value(unit);
    };


    // documented in GeometryElement
    /**
     * @class
     * @ignore
     */
    el.getLabelAnchor = function () {
        var vec,
            dx = 12,
            A, B, r, d, a2, co, si, mat,
            vp_s = el.evalVisProp('selection'),
            l_vp = this.label ? this.label.visProp : this.visProp.label,
            pos = (this.label) ?
                    this.label.evalVisProp('position') : this.evalVisProp('label.position');

        // If this is uncommented, the angle label can not be dragged
        //if (Type.exists(this.label)) {
        //    this.label.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
        //}

        if (
            !Type.isString(pos) ||
            (pos.indexOf('right') < 0 && pos.indexOf('left') < 0)
        ) {

            if (Type.exists(this.label) && Type.exists(this.label.visProp.fontsize)) {
                dx = this.label.evalVisProp('fontsize');
            }
            dx /= this.board.unitX;

            A = el.point2.coords.usrCoords;
            B = el.point1.coords.usrCoords;
            r = el.Radius();
            d = Geometry.distance(A, B, 3);
            a2 = Geometry.rad(el.point2, el.point1, el.point3);
            if ((vp_s === "minor" && a2 > Math.PI) || (vp_s === "major" && a2 < Math.PI)) {
                a2 = -(2 * Math.PI - a2);
            }
            a2 *= 0.5;
            co = Math.cos(a2);
            si = Math.sin(a2);

            A = [1, B[1] + ((A[1] - B[1]) * r) / d, B[2] + ((A[2] - B[2]) * r) / d];

            mat = [
                [1, 0, 0],
                [B[1] - 0.5 * B[1] * co + 0.5 * B[2] * si, co * 0.5, -si * 0.5],
                [B[2] - 0.5 * B[1] * si - 0.5 * B[2] * co, si * 0.5, co * 0.5]
            ];
            vec = Mat.matVecMult(mat, A);
            vec[1] /= vec[0];
            vec[2] /= vec[0];
            vec[0] /= vec[0];

            d = Geometry.distance(vec, B, 3);
            vec = [
                vec[0],
                B[1] + ((vec[1] - B[1]) * (r + dx)) / d,
                B[2] + ((vec[2] - B[2]) * (r + dx)) / d
            ];

            l_vp.position = Geometry.calcLabelQuadrant(Geometry.rad([1, 0], [0, 0], vec));

            return new Coords(Const.COORDS_BY_USER, vec, this.board);
        } else {
            return this.getLabelPosition(pos, this.label.evalVisProp('distance'));
        }
    };

    el.methodMap = Type.deepCopy(el.methodMap, {
        setAngle: "setAngle",
        Value: "Value",
        free: "free"
    });

    return el;
};

JXG.registerElement("angle", JXG.createAngle);

/**
 * @class A non-reflex angle is the instance of an angle that is at most 180°.
 * It is defined by a center, one point that
 * defines the radius, and a third point that defines the angle of the sector.
 * @pseudo
 * @name NonReflexAngle
 * @augments Angle
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Minor sector is a sector of a circle around p1 having measure less than or equal to
 * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
 * @example
 * // Create a non-reflex angle out of three free points
 * var p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('nonreflexangle', [p1, p2, p3], {radius: 2}),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * </pre><div class="jxgbox" id="JXGd0ab6d6b-63a7-48b2-8749-b02bb5e744f9" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGd0ab6d6b-63a7-48b2-8749-b02bb5e744f9', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('nonreflexangle', [p1, p2, p3], {radius: 2}),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * })();
 * </script><pre>
 */
JXG.createNonreflexAngle = function (board, parents, attributes) {
    var el;

    attributes.selection = 'minor';
    attributes = Type.copyAttributes(attributes, board.options, 'nonreflexangle');
    el = JXG.createAngle(board, parents, attributes);

    // Documented in createAngle
    el.Value = function (unit) {
        var rad = Geometry.rad(this.point2, this.point1, this.point3);
        unit = unit || 'radians';
        if (unit === '') {
            unit = 'radians';
        }
        rad = (rad < Math.PI) ? rad : 2.0 * Math.PI - rad;

        return this.arc.Value(unit, rad);
    };
    return el;
};

JXG.registerElement("nonreflexangle", JXG.createNonreflexAngle);

/**
 * @class A reflex angle is the instance of an angle that is larger than 180°.
 * It is defined by a center, one point that
 * defines the radius, and a third point that defines the angle of the sector.
 * @pseudo
 * @name ReflexAngle
 * @augments Angle
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Minor sector is a sector of a circle around p1 having measure less than or equal to
 * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
 * @example
 * // Create a non-reflex angle out of three free points
 * var p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('reflexangle', [p1, p2, p3], {radius: 2}),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * </pre><div class="jxgbox" id="JXGf2a577f2-553d-4f9f-a895-2d6d4b8c60e8" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 * var board = JXG.JSXGraph.initBoard('JXGf2a577f2-553d-4f9f-a895-2d6d4b8c60e8', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('reflexangle', [p1, p2, p3], {radius: 2}),
 *     t = board.create('text', [4, 4, function() { return JXG.toFixed(a.Value(), 2); }]);
 * })();
 * </script><pre>
 */
JXG.createReflexAngle = function (board, parents, attributes) {
    var el;

    attributes.selection = 'major';
    attributes = Type.copyAttributes(attributes, board.options, 'reflexangle');
    el = JXG.createAngle(board, parents, attributes);

    // Documented in createAngle
    el.Value = function (unit) {
        var rad = Geometry.rad(this.point2, this.point1, this.point3);
        unit = unit || 'radians';
        if (unit === '') {
            unit = 'radians';
        }
        rad = (rad >= Math.PI) ? rad : 2.0 * Math.PI - rad;

        return this.arc.Value(unit, rad);
    };

    return el;
};

JXG.registerElement("reflexangle", JXG.createReflexAngle);
