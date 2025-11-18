/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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
 * @fileoverview This file contains the Math.Geometry namespace for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Coords from "../base/coords.js";
import Mat from "./math.js";
import Stat from "../math/statistics.js";
import Numerics from "./numerics.js";
import Type from "../utils/type.js";
import Expect from "../utils/expect.js";

/**
 * Math.Geometry namespace definition. This namespace holds geometrical algorithms,
 * especially intersection algorithms.
 * @name JXG.Math.Geometry
 * @exports Mat.Geometry as JXG.Math.Geometry
 * @namespace
 */
Mat.Geometry = {};

// the splitting is necessary due to the shortcut for the circumcircleMidpoint method to circumcenter.

JXG.extend(
    Mat.Geometry,
    /** @lends JXG.Math.Geometry */ {
        /* ***************************************/
        /* *** GENERAL GEOMETRIC CALCULATIONS ****/
        /* ***************************************/

        /**
         * Calculates the angle defined by the points A, B, C.
         * @param {JXG.Point|Array} A A point  or [x,y] array.
         * @param {JXG.Point|Array} B Another point or [x,y] array.
         * @param {JXG.Point|Array} C A circle - no, of course the third point or [x,y] array.
         * @deprecated Use {@link JXG.Math.Geometry.rad} instead.
         * @see JXG.Math.Geometry.rad
         * @see JXG.Math.Geometry.trueAngle
         * @returns {Number} The angle in radian measure.
         */
        angle: function (A, B, C) {
            var u,
                v,
                s,
                t,
                a = [],
                b = [],
                c = [];

            JXG.deprecated("Geometry.angle()", "Geometry.rad()");
            if (A.coords) {
                a[0] = A.coords.usrCoords[1];
                a[1] = A.coords.usrCoords[2];
            } else {
                a[0] = A[0];
                a[1] = A[1];
            }

            if (B.coords) {
                b[0] = B.coords.usrCoords[1];
                b[1] = B.coords.usrCoords[2];
            } else {
                b[0] = B[0];
                b[1] = B[1];
            }

            if (C.coords) {
                c[0] = C.coords.usrCoords[1];
                c[1] = C.coords.usrCoords[2];
            } else {
                c[0] = C[0];
                c[1] = C[1];
            }

            u = a[0] - b[0];
            v = a[1] - b[1];
            s = c[0] - b[0];
            t = c[1] - b[1];

            return Math.atan2(u * t - v * s, u * s + v * t);
        },

        /**
         * Calculates the angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
         * @param {JXG.Point|Array} A Point or [x,y] array
         * @param {JXG.Point|Array} B Point or [x,y] array
         * @param {JXG.Point|Array} C Point or [x,y] array
         * @see JXG.Math.Geometry.rad
         * @returns {Number} The angle in degrees.
         */
        trueAngle: function (A, B, C) {
            return this.rad(A, B, C) * 57.295779513082323; // *180.0/Math.PI;
        },

        /**
         * Calculates the internal angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
         * @param {JXG.Point|Array} A Point or [x,y] array
         * @param {JXG.Point|Array} B Point or [x,y] array
         * @param {JXG.Point|Array} C Point or [x,y] array
         * @see JXG.Math.Geometry.trueAngle
         * @returns {Number} Angle in radians.
         */
        rad: function (A, B, C) {
            var ax, ay, bx, by, cx, cy, phi;

            if (A.coords) {
                ax = A.coords.usrCoords[1];
                ay = A.coords.usrCoords[2];
            } else {
                ax = A[0];
                ay = A[1];
            }

            if (B.coords) {
                bx = B.coords.usrCoords[1];
                by = B.coords.usrCoords[2];
            } else {
                bx = B[0];
                by = B[1];
            }

            if (C.coords) {
                cx = C.coords.usrCoords[1];
                cy = C.coords.usrCoords[2];
            } else {
                cx = C[0];
                cy = C[1];
            }

            phi = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);

            if (phi < 0) {
                phi += 6.2831853071795862;
            }

            return phi;
        },

        /**
         * Calculates a point on the bisection line between the three points A, B, C.
         * As a result, the bisection line is defined by two points:
         * Parameter B and the point with the coordinates calculated in this function.
         * Does not work for ideal points.
         * @param {JXG.Point} A Point
         * @param {JXG.Point} B Point
         * @param {JXG.Point} C Point
         * @param [board=A.board] Reference to the board
         * @returns {JXG.Coords} Coordinates of the second point defining the bisection.
         */
        angleBisector: function (A, B, C, board) {
            var phiA,
                phiC,
                phi,
                Ac = A.coords.usrCoords,
                Bc = B.coords.usrCoords,
                Cc = C.coords.usrCoords,
                x,
                y;

            if (!Type.exists(board)) {
                board = A.board;
            }

            // Parallel lines
            if (Bc[0] === 0) {
                return new Coords(
                    Const.COORDS_BY_USER,
                    [1, (Ac[1] + Cc[1]) * 0.5, (Ac[2] + Cc[2]) * 0.5],
                    board
                );
            }

            // Non-parallel lines
            x = Ac[1] - Bc[1];
            y = Ac[2] - Bc[2];
            phiA = Math.atan2(y, x);

            x = Cc[1] - Bc[1];
            y = Cc[2] - Bc[2];
            phiC = Math.atan2(y, x);

            phi = (phiA + phiC) * 0.5;

            if (phiA > phiC) {
                phi += Math.PI;
            }

            x = Math.cos(phi) + Bc[1];
            y = Math.sin(phi) + Bc[2];

            return new Coords(Const.COORDS_BY_USER, [1, x, y], board);
        },

        // /**
        //  * Calculates a point on the m-section line between the three points A, B, C.
        //  * As a result, the m-section line is defined by two points:
        //  * Parameter B and the point with the coordinates calculated in this function.
        //  * The m-section generalizes the bisector to any real number.
        //  * For example, the trisectors of an angle are simply the 1/3-sector and the 2/3-sector.
        //  * Does not work for ideal points.
        //  * @param {JXG.Point} A Point
        //  * @param {JXG.Point} B Point
        //  * @param {JXG.Point} C Point
        //  * @param {Number} m Number
        //  * @param [board=A.board] Reference to the board
        //  * @returns {JXG.Coords} Coordinates of the second point defining the bisection.
        //  */
        // angleMsector: function (A, B, C, m, board) {
        //     var phiA, phiC, phi,
        //         Ac = A.coords.usrCoords,
        //         Bc = B.coords.usrCoords,
        //         Cc = C.coords.usrCoords,
        //         x, y;

        //     if (!Type.exists(board)) {
        //         board = A.board;
        //     }

        //     // Parallel lines
        //     if (Bc[0] === 0) {
        //         return new Coords(Const.COORDS_BY_USER,
        //             [1, (Ac[1] + Cc[1]) * m, (Ac[2] + Cc[2]) * m], board);
        //     }

        //     // Non-parallel lines
        //     x = Ac[1] - Bc[1];
        //     y = Ac[2] - Bc[2];
        //     phiA =  Math.atan2(y, x);

        //     x = Cc[1] - Bc[1];
        //     y = Cc[2] - Bc[2];
        //     phiC =  Math.atan2(y, x);

        //     phi = phiA + ((phiC - phiA) * m);

        //     if (phiA - phiC > Math.PI) {
        //         phi += 2*m*Math.PI;
        //     }

        //     x = Math.cos(phi) + Bc[1];
        //     y = Math.sin(phi) + Bc[2];

        //     return new Coords(Const.COORDS_BY_USER, [1, x, y], board);
        // },

        /**
         * Reflects the point along the line.
         * @param {JXG.Line} line Axis of reflection.
         * @param {JXG.Point} point Point to reflect.
         * @param [board=point.board] Reference to the board
         * @returns {JXG.Coords} Coordinates of the reflected point.
         */
        reflection: function (line, point, board) {
            // (v,w) defines the slope of the line
            var x0,
                y0,
                x1,
                y1,
                v,
                w,
                mu,
                pc = point.coords.usrCoords,
                p1c = line.point1.coords.usrCoords,
                p2c = line.point2.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point.board;
            }

            v = p2c[1] - p1c[1];
            w = p2c[2] - p1c[2];

            x0 = pc[1] - p1c[1];
            y0 = pc[2] - p1c[2];

            mu = (v * y0 - w * x0) / (v * v + w * w);

            // point + mu*(-y,x) is the perpendicular foot
            x1 = pc[1] + 2 * mu * w;
            y1 = pc[2] - 2 * mu * v;

            return new Coords(Const.COORDS_BY_USER, [x1, y1], board);
        },

        /**
         * Computes the new position of a point which is rotated
         * around a second point (called rotpoint) by the angle phi.
         * @param {JXG.Point} rotpoint Center of the rotation
         * @param {JXG.Point} point point to be rotated
         * @param {Number} phi rotation angle in arc length
         * @param {JXG.Board} [board=point.board] Reference to the board
         * @returns {JXG.Coords} Coordinates of the new position.
         */
        rotation: function (rotpoint, point, phi, board) {
            var x0,
                y0,
                c,
                s,
                x1,
                y1,
                pc = point.coords.usrCoords,
                rotpc = rotpoint.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point.board;
            }

            x0 = pc[1] - rotpc[1];
            y0 = pc[2] - rotpc[2];

            c = Math.cos(phi);
            s = Math.sin(phi);

            x1 = x0 * c - y0 * s + rotpc[1];
            y1 = x0 * s + y0 * c + rotpc[2];

            return new Coords(Const.COORDS_BY_USER, [x1, y1], board);
        },

        /**
         * Calculates the coordinates of a point on the perpendicular to the given line through
         * the given point.
         * @param {JXG.Line} line A line.
         * @param {JXG.Point} point Point which is projected to the line.
         * @param {JXG.Board} [board=point.board] Reference to the board
         * @returns {Array} Array of length two containing coordinates of a point on the perpendicular to the given line
         *                  through the given point and boolean flag "change".
         */
        perpendicular: function (line, point, board) {
            var x,
                y,
                change,
                c,
                z,
                A = line.point1.coords.usrCoords,
                B = line.point2.coords.usrCoords,
                C = point.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point.board;
            }

            // special case: point is the first point of the line
            if (point === line.point1) {
                x = A[1] + B[2] - A[2];
                y = A[2] - B[1] + A[1];
                z = A[0] * B[0];

                if (Math.abs(z) < Mat.eps) {
                    x = B[2];
                    y = -B[1];
                }
                c = [z, x, y];
                change = true;

                // special case: point is the second point of the line
            } else if (point === line.point2) {
                x = B[1] + A[2] - B[2];
                y = B[2] - A[1] + B[1];
                z = A[0] * B[0];

                if (Math.abs(z) < Mat.eps) {
                    x = A[2];
                    y = -A[1];
                }
                c = [z, x, y];
                change = false;

                // special case: point lies somewhere else on the line
            } else if (Math.abs(Mat.innerProduct(C, line.stdform, 3)) < Mat.eps) {
                x = C[1] + B[2] - C[2];
                y = C[2] - B[1] + C[1];
                z = B[0];

                if (Math.abs(z) < Mat.eps) {
                    x = B[2];
                    y = -B[1];
                }

                change = true;
                if (
                    Math.abs(z) > Mat.eps &&
                    Math.abs(x - C[1]) < Mat.eps &&
                    Math.abs(y - C[2]) < Mat.eps
                ) {
                    x = C[1] + A[2] - C[2];
                    y = C[2] - A[1] + C[1];
                    change = false;
                }
                c = [z, x, y];

                // general case: point does not lie on the line
                // -> calculate the foot of the dropped perpendicular
            } else {
                c = [0, line.stdform[1], line.stdform[2]];
                c = Mat.crossProduct(c, C); // perpendicuar to line
                c = Mat.crossProduct(c, line.stdform); // intersection of line and perpendicular
                change = true;
            }

            return [new Coords(Const.COORDS_BY_USER, c, board), change];
        },

        /**
         * @deprecated Please use {@link JXG.Math.Geometry.circumcenter} instead.
         */
        circumcenterMidpoint: function () {
            JXG.deprecated("Geometry.circumcenterMidpoint()", "Geometry.circumcenter()");
            this.circumcenter.apply(this, arguments);
        },

        /**
         * Calculates the center of the circumcircle of the three given points.
         * @param {JXG.Point} point1 Point
         * @param {JXG.Point} point2 Point
         * @param {JXG.Point} point3 Point
         * @param {JXG.Board} [board=point1.board] Reference to the board
         * @returns {JXG.Coords} Coordinates of the center of the circumcircle of the given points.
         */
        circumcenter: function (point1, point2, point3, board) {
            var u,
                v,
                m1,
                m2,
                A = point1.coords.usrCoords,
                B = point2.coords.usrCoords,
                C = point3.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point1.board;
            }

            u = [B[0] - A[0], -B[2] + A[2], B[1] - A[1]];
            v = [(A[0] + B[0]) * 0.5, (A[1] + B[1]) * 0.5, (A[2] + B[2]) * 0.5];
            m1 = Mat.crossProduct(u, v);

            u = [C[0] - B[0], -C[2] + B[2], C[1] - B[1]];
            v = [(B[0] + C[0]) * 0.5, (B[1] + C[1]) * 0.5, (B[2] + C[2]) * 0.5];
            m2 = Mat.crossProduct(u, v);

            return new Coords(Const.COORDS_BY_USER, Mat.crossProduct(m1, m2), board);
        },

        /**
         * Calculates the Euclidean distance for two given arrays of the same length.
         * @param {Array} array1 Array of Number
         * @param {Array} array2 Array of Number
         * @param {Number} [n] Length of the arrays. Default is the minimum length of the given arrays.
         * @returns {Number} Euclidean distance of the given vectors.
         */
        distance: function (array1, array2, n) {
            var i,
                sum = 0;

            if (!n) {
                n = Math.min(array1.length, array2.length);
            }

            for (i = 0; i < n; i++) {
                sum += (array1[i] - array2[i]) * (array1[i] - array2[i]);
            }

            return Math.sqrt(sum);
        },

        /**
         * Calculates Euclidean distance for two given arrays of the same length.
         * If one of the arrays contains a zero in the first coordinate, and the Euclidean distance
         * is different from zero it is a point at infinity and we return Infinity.
         * @param {Array} array1 Array containing elements of type number.
         * @param {Array} array2 Array containing elements of type number.
         * @param {Number} [n] Length of the arrays. Default is the minimum length of the given arrays.
         * @returns {Number} Euclidean (affine) distance of the given vectors.
         */
        affineDistance: function (array1, array2, n) {
            var d;

            d = this.distance(array1, array2, n);

            if (
                d > Mat.eps &&
                (Math.abs(array1[0]) < Mat.eps || Math.abs(array2[0]) < Mat.eps)
            ) {
                return Infinity;
            }

            return d;
        },

        /**
         * Affine ratio of three collinear points a, b, c: (c - a) / (b - a).
         * If r > 1 or r < 0 then c is outside of the segment ab.
         *
         * @param {Array|JXG.Coords} a
         * @param {Array|JXG.Coords} b
         * @param {Array|JXG.Coords} c
         * @returns {Number} affine ratio (c - a) / (b - a)
         */
        affineRatio: function (a, b, c) {
            var r = 0.0,
                dx;

            if (Type.exists(a.usrCoords)) {
                a = a.usrCoords;
            }
            if (Type.exists(b.usrCoords)) {
                b = b.usrCoords;
            }
            if (Type.exists(c.usrCoords)) {
                c = c.usrCoords;
            }

            dx = b[1] - a[1];

            if (Math.abs(dx) > Mat.eps) {
                r = (c[1] - a[1]) / dx;
            } else {
                r = (c[2] - a[2]) / (b[2] - a[2]);
            }
            return r;
        },

        /**
         * Sort vertices counter clockwise starting with the first point.
         * Used in Polygon.sutherlandHodgman, Geometry.signedPolygon.
         *
         * @param {Array} p An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         *
         * @returns {Array}
         */
        sortVertices: function (p) {
            var ll,
                ps = Expect.each(p, Expect.coordsArray),
                N = ps.length,
                lastPoint = null;

            // If the last point equals the first point, we take the last point out of the array.
            // It may be that the several points at the end of the array are equal to the first point.
            // The polygonal chain is been closed by JSXGraph, but this may also have been done by the user.
            // Therefore, we use a while loop to pop the last points.
            while (
                ps[0][0] === ps[N - 1][0] &&
                ps[0][1] === ps[N - 1][1] &&
                ps[0][2] === ps[N - 1][2]
            ) {
                lastPoint = ps.pop();
                N--;
            }

            ll = ps[0];
            // Sort ps in increasing order of the angle between a point and the first point ll.
            // If a point is equal to the first point ll, the angle is defined to be -Infinity.
            // Otherwise, atan2 would return zero, which is a value which also attained by points
            // on the same horizontal line.
            ps.sort(function (a, b) {
                var rad1 =
                        (a[2] === ll[2] && a[1] === ll[1])
                            ? -Infinity
                            : Math.atan2(a[2] - ll[2], a[1] - ll[1]),
                    rad2 =
                        (b[2] === ll[2] && b[1] === ll[1])
                            ? -Infinity
                            : Math.atan2(b[2] - ll[2], b[1] - ll[1]);
                return rad1 - rad2;
            });

            // If the last point has been taken out of the array, we put it in again.
            if (lastPoint !== null) {
                ps.push(lastPoint);
            }

            return ps;
        },

        /**
         * Signed triangle area of the three points given. It can also be used
         * to test the orientation of the triangle.
         * <ul>
         * <li> If the return value is < 0, then the point p2 is left of the line [p1, p3] (i.e p3 is right from [p1, p2]).
         * <li> If the return value is > 0, then the point p2 is right of the line [p1, p3] (i.e p3 is left from [p1, p2]).
         * <li> If the return value is = 0, then the points p1, p2, p3 are collinear.
         * </ul>
         *
         * @param {JXG.Point|JXG.Coords|Array} p1
         * @param {JXG.Point|JXG.Coords|Array} p2
         * @param {JXG.Point|JXG.Coords|Array} p3
         *
         * @returns {Number}
         */
        signedTriangle: function (p1, p2, p3) {
            var A = Expect.coordsArray(p1),
                B = Expect.coordsArray(p2),
                C = Expect.coordsArray(p3);
            return 0.5 * ((B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]));
        },

        /**
         * Determine the signed area of a non-self-intersecting polygon.
         * Surveyor's Formula
         *
         * @param {Array} p An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         * @param {Boolean} [sort=true]
         *
         * @returns {Number}
         */
        signedPolygon: function (p, sort) {
            var i,
                N,
                A = 0,
                ps = Expect.each(p, Expect.coordsArray);

            if (sort === undefined) {
                sort = true;
            }

            if (!sort) {
                ps = this.sortVertices(ps);
            } else {
                // Make sure the polygon is closed. If it is already closed this won't change the sum because the last
                // summand will be 0.
                ps.unshift(ps[ps.length - 1]);
            }

            N = ps.length;

            for (i = 1; i < N; i++) {
                A += ps[i - 1][1] * ps[i][2] - ps[i][1] * ps[i - 1][2];
            }

            return 0.5 * A;
        },

        /**
         * Calculate the complex hull of a point cloud by the Graham scan algorithm.
         *
         * @param {Array} points An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         *
         * @returns {Array} List of objects <pre>{i: index, c: coords}</pre> containing the convex hull points
         *  in form of the index in the original input array and a coords array.
         *
         * @example
         *     // Static example
         *
         *     var i, hull,
         *       p = [],
         *       q = [];
         *
         *     p.push( board.create('point', [4, 0], {withLabel:false }) );
         *     p.push( board.create('point', [0, 4], {withLabel:false }) );
         *     p.push( board.create('point', [0, 0], {withLabel:false }) );
         *     p.push([-1, 0]);
         *     p.push([-3, -3]);
         *
         *     hull = JXG.Math.Geometry.GrahamScan(p);
         *     for (i = 0; i < hull.length; i++) {
         *       console.log(hull[i]);
         *       q.push(hull[i].c);
         *     }
         *     board.create('polygon', q);
         *     // Output:
         *     // { i: 4, c: [1, -3, 3]}
         *     // { i: 0, c: [1, 4, 0]}
         *     // { i: 1, c: [1, 0, 4]}
         *
         * </pre><div id="JXGb310b874-595e-4020-b0c2-566482797836" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb310b874-595e-4020-b0c2-566482797836',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var i, hull,
         *           p = [],
         *           q = [];
         *
         *         p.push( board.create('point', [4, 0], {withLabel:false }) );
         *         p.push( board.create('point', [0, 4], {withLabel:false }) );
         *         p.push( board.create('point', [0, 0], {withLabel:false }) );
         *         p.push([-1, 0]);
         *         p.push([-3, -3]);
         *
         *         hull = JXG.Math.Geometry.GrahamScan(p);
         *         for (i = 0; i < hull.length; i++) {
         *           console.log(hull[i]);
         *           q.push(hull[i].c);
         *         }
         *         board.create('polygon', q);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        GrahamScan: function (points) {
            var i, M, o,
                mi_idx,
                mi_x, mi_y, ma_x, ma_y,
                mi_xpy, mi_xmy, ma_xpy, ma_xmy,
                mi_x_i, ma_x_i, mi_y_i, ma_y_i,
                mi_xpy_i, mi_xmy_i, ma_xpy_i, ma_xmy_i,
                v, c,
                eps = Mat.eps * Mat.eps,
                that = this,
                ps_idx = [],
                stack = [],
                ps = Expect.each(points, Expect.coordsArray), // New array object, i.e. a copy of the input array.
                N,
                AklToussaint = 1024;  // This is a rough threshold where the heuristic pays off.

            N = ps.length;
            if (N === 0) {
                return [];
            }

            if (N > AklToussaint) {
                //
                // Akl-Toussaint heuristic
                // Determine an irregular convex octagon whose inside can be discarded.
                //
                mi_x = ps[0][1];
                ma_x = mi_x;
                mi_y = ps[0][2];
                ma_y = mi_y;

                mi_xmy = ps[0][1] - ps[0][2];
                ma_xmy = mi_xmy;
                mi_xpy = ps[0][1] + ps[0][2];
                ma_xpy = mi_xpy;

                mi_x_i = 0;
                ma_x_i = 0;
                mi_y_i = 0;
                ma_y_i = 0;

                mi_xmy_i = 0;
                ma_xmy_i = 0;
                mi_xpy_i = 0;
                ma_xpy_i = 0;
                for (i = 1; i < N; i++) {
                    v = ps[i][1];
                    if (v < mi_x) {
                        mi_x = v;
                        mi_x_i = i;
                    } else if (v > ma_x) {
                        ma_x = v;
                        ma_x_i = i;
                    }

                    v = ps[i][2];
                    if (v < mi_y) {
                        mi_y = v;
                        mi_y_i = i;
                    } else if (v > ma_y) {
                        ma_y = v;
                        ma_y_i = i;
                    }

                    v = ps[i][1] - ps[i][2];
                    if (v < mi_xmy) {
                        mi_xmy = v;
                        mi_xmy_i = i;
                    } else if (v > ma_xmy) {
                        ma_xmy = v;
                        ma_xmy_i = i;
                    }

                    v = ps[i][1] + ps[i][2];
                    if (v < mi_xpy) {
                        mi_xpy = v;
                        mi_xpy_i = i;
                    } else if (v > ma_xpy) {
                        ma_xpy = v;
                        ma_xpy_i = i;
                    }
                }
            }

            // Keep track of the indices of the input points.
            for (i = 0; i < N; i++) {
                c = ps[i];
                if (N <= AklToussaint ||
                    // Discard inside of the octagon according to the Akl-Toussaint heuristic
                    i in [mi_x_i, ma_x_i, mi_y_i, ma_y_i, mi_xpy_i, mi_xmy_i, ma_xpy_i, ma_xmy_i] ||
                    (mi_x_i !== mi_xmy_i && this.signedTriangle(ps[mi_x_i], ps[mi_xmy_i], c) >= -eps) ||
                    (mi_xmy_i !== ma_y_i && this.signedTriangle(ps[mi_xmy_i], ps[ma_y_i], c) >= -eps) ||
                    (ma_y_i !== ma_xpy_i && this.signedTriangle(ps[ma_y_i], ps[ma_xpy_i], c) >= -eps) ||
                    (ma_xpy_i !== ma_x_i && this.signedTriangle(ps[ma_xpy_i], ps[ma_x_i], c) >= -eps) ||
                    (ma_x_i !== ma_xmy_i && this.signedTriangle(ps[ma_x_i], ps[ma_xmy_i], c) >= -eps) ||
                    (ma_xmy_i !== mi_y_i && this.signedTriangle(ps[ma_xmy_i], ps[mi_y_i], c) >= -eps) ||
                    (mi_y_i !== mi_xpy_i && this.signedTriangle(ps[mi_y_i], ps[mi_xpy_i], c) >= -eps) ||
                    (mi_xpy_i !== mi_x_i && this.signedTriangle(ps[mi_xpy_i], ps[mi_x_i], c) >= -eps)
                ) {
                    ps_idx.push({
                        i: i,
                        c: c
                    });
                }
            }
            N = ps_idx.length;

            // Find the point with the lowest y value
            mi_idx = 0;
            mi_x = ps_idx[0].c[1];
            mi_y = ps_idx[0].c[2];
            for (i = 1; i < N; i++) {
                if ((ps_idx[i].c[2] < mi_y) || (ps_idx[i].c[2] === mi_y && ps_idx[i].c[1] < mi_x)) {
                    mi_x = ps_idx[i].c[1];
                    mi_y = ps_idx[i].c[2];
                    mi_idx = i;
                }
            }
            ps_idx = Type.swap(ps_idx, mi_idx, 0);

            // Our origin o, i.e. the first point.
            o = ps_idx[0].c;

            // Sort according to the angle around o.
            ps_idx.sort(function(a_obj, b_obj) {
                var a = a_obj.c,
                    b = b_obj.c,
                    v = that.signedTriangle(o, a, b);

                if (v === 0) {
                    // if o, a, b are collinear, the point which is further away
                    // from o is considered greater.
                    return Mat.hypot(a[1] - o[1], a[2] - o[2]) - Mat.hypot(b[1] - o[1], b[2] - o[2]);
                }

                // if v < 0, a is to the left of [o, b], i.e. angle(a) > angle(b)
                return -v;
            });

            // Do the Graham scan.
            M = 0;
            for (i = 0; i < N; i++) {
                while (M > 1 && this.signedTriangle(stack[M - 2].c, stack[M - 1].c, ps_idx[i].c) <= 0) {
                    // stack[M - 1] is to the left of stack[M - 1], ps[i]: discard it
                    stack.pop();
                    M--;
                }
                stack.push(ps_idx[i]);
                M++;
            }

            return stack;
        },

        // Original method
        // GrahamScan: function (points, indices) {
        //     var i,
        //         M = 1,
        //         ps = Expect.each(points, Expect.coordsArray),
        //         N = ps.length;
        //     ps = this.sortVertices(ps);
        //     N = ps.length;
        //     for (i = 2; i < N; i++) {
        //         while (this.signedTriangle(ps[M - 1], ps[M], ps[i]) <= 0) {
        //             if (M > 1) {
        //                 M -= 1;
        //             } else if (i === N - 1) {
        //                 break;
        //             }
        //             i += 1;
        //         }
        //         M += 1;
        //         ps = Type.swap(ps, M, i);
        //         indices = Type.swap(indices, M, i);
        //     }
        //     return ps.slice(0, M);
        // },

        /**
         * Calculate the complex hull of a point cloud by the Graham scan algorithm.
         *
         * @param {Array} points An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         * @param {Boolean} [returnCoords=false] If true, return an array of coords. Otherwise return a list of pointers
         * to the input list elements. That is, if the input is a list of {@link JXG.Point} elements, the returned list
         * will contain the points that form the convex hull.
         * @returns {Array} List containing the convex hull. Format depends on returnCoords.
         * @see JXG.Math.Geometry.GrahamScan
         *
         * @example
         *     // Static example
         *     var i, hull,
         *         p = [];
         *
         *     p.push( board.create('point', [4, 0], {withLabel:false }) );
         *     p.push( board.create('point', [0, 4], {withLabel:false }) );
         *     p.push( board.create('point', [0, 0], {withLabel:false }) );
         *     p.push( board.create('point', [1, 1], {withLabel:false }) );
         *     hull = JXG.Math.Geometry.convexHull(p);
         *     for (i = 0; i < hull.length; i++) {
         *       hull[i].setAttribute({color: 'blue'});
         *     }
         *
         * </pre><div id="JXGdfc76123-81b8-4250-96f9-419253bd95dd" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGdfc76123-81b8-4250-96f9-419253bd95dd',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var i, hull,
         *             p = [];
         *
         *         p.push( board.create('point', [4, 0], {withLabel:false }) );
         *         p.push( board.create('point', [0, 4], {withLabel:false }) );
         *         p.push( board.create('point', [0, 0], {withLabel:false }) );
         *         p.push( board.create('point', [1, 1], {withLabel:false }) );
         *         hull = JXG.Math.Geometry.convexHull(p);
         *         for (i = 0; i < hull.length; i++) {
         *           hull[i].setAttribute({color: 'blue'});
         *         }
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *     // Dynamic version using returnCoords==true: drag the points
         *     var p = [];
         *
         *     p.push( board.create('point', [4, 0], {withLabel:false }) );
         *     p.push( board.create('point', [0, 4], {withLabel:false }) );
         *     p.push( board.create('point', [0, 0], {withLabel:false }) );
         *     p.push( board.create('point', [1, 1], {withLabel:false }) );
         *
         *     var c = board.create('curve', [[], []], {fillColor: 'yellow', fillOpacity: 0.3});
         *     c.updateDataArray = function() {
         *       var i,
         *         hull = JXG.Math.Geometry.convexHull(p, true);
         *
         *       this.dataX = [];
         *       this.dataY = [];
         *
         *       for (i = 0; i < hull.length; i ++) {
         *         this.dataX.push(hull[i][1]);
         *         this.dataY.push(hull[i][2]);
         *       }
         *       this.dataX.push(hull[0][1]);
         *       this.dataY.push(hull[0][2]);
         *     };
         *     board.update();
         *
         * </pre><div id="JXG61e51909-da0b-432f-9aa7-9fb0c8bb01c9" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG61e51909-da0b-432f-9aa7-9fb0c8bb01c9',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var p = [];
         *
         *         p.push( board.create('point', [4, 0], {withLabel:false }) );
         *         p.push( board.create('point', [0, 4], {withLabel:false }) );
         *         p.push( board.create('point', [0, 0], {withLabel:false }) );
         *         p.push( board.create('point', [1, 1], {withLabel:false }) );
         *
         *         var c = board.create('curve', [[], []], {fillColor: 'yellow', fillOpacity: 0.3});
         *         c.updateDataArray = function() {
         *           var i,
         *             hull = JXG.Math.Geometry.convexHull(p, true);
         *
         *           this.dataX = [];
         *           this.dataY = [];
         *
         *           for (i = 0; i < hull.length; i ++) {
         *             this.dataX.push(hull[i][1]);
         *             this.dataY.push(hull[i][2]);
         *           }
         *           this.dataX.push(hull[0][1]);
         *           this.dataY.push(hull[0][2]);
         *         };
         *         board.update();
         *
         *
         *     })();
         *
         * </script><pre>
         *
         */
        convexHull: function(points, returnCoords) {
            var i, hull,
                res = [];

            hull = this.GrahamScan(points);
            for (i = 0; i < hull.length; i++) {
                if (returnCoords) {
                    res.push(hull[i].c);
                } else {
                    res.push(points[hull[i].i]);
                }
            }
            return res;
        },

        // /**
        //  * Determine if a polygon or a path element is convex, non-convex or complex which are defined like this:
        //  * <ul>
        //  * <li> A polygon is convex if for every pair of points, the line segment connecting them does not intersect
        //  * an edge of the polygon in one point.
        //  * A single line segment or a a single point is considered as convex. A necessary condition for a polygon
        //  * to be convex that the angle sum of its interior angles equals &plusmn; 2 &pi;.
        //  * <li> A polygon is non-convex, if it does not self-intersect, but is not convex.
        //  * <li> A polygon is complex if its the angle sum is not equal to &plusmn; 2 &pi;.
        //  * That is, there must be self-intersection (contiguous coincident points in the path are not treated as self-intersection).
        //  * </ul>
        //  * A path  element might be specified as an array of coordinate arrays or {@link JXG.Coords}.
        //  *
        //  * @param {Array|Polygon|PolygonalChain} points Polygon or list of coordinates
        //  * @returns {Number} -1: if complex, 0: if non-convex, 1: if convex
        //  */
        /**
         * Determine if a polygon or a path element is convex:
         * <p>
         * A polygon is convex if for every pair of points, the line segment connecting them does not intersect
         * an edge of the polygon in one point.
         * A single line segment, a single point, or the empty set is considered as convex. A necessary condition for a polygon
         * to be convex that the angle sum of its interior angles equals &plusmn; 2 &pi;.
         * <p>
         * A path  element might be specified as an array of coordinate arrays or {@link JXG.Coords}.
         * See the discussion at <a href="https://stackoverflow.com/questions/471962/how-do-i-efficiently-determine-if-a-polygon-is-convex-non-convex-or-complex">stackoverflow</a>.
         *
         * @param {Array|Polygon|PolygonalChain} points Polygon or list of coordinates
         * @returns {Boolean} true if convex
         *
         * @example
         * var pol = board.create('polygon', [
         *     [-1, -1],
         *     [3, -1],
         *     [4, 2],
         *     [3, 3],
         *     [0, 4],
         *     [-3, 1]
         * ], {
         *     vertices: {
         *         color: 'blue',
         *         snapToGrid: true
         *     }
         * });
         *
         * console.log(JXG.Math.Geometry.isConvex(pol));
         * // > true
         *
         *
         *
         * </pre><div id="JXG9b43cc53-15b4-49be-92cc-2a1dfc06665b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9b43cc53-15b4-49be-92cc-2a1dfc06665b',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var pol = board.create('polygon', [
         *         [-1, -1],
         *         [3, -1],
         *         [4, 2],
         *         [3, 3],
         *         [0, 4],
         *         [-3, 1]
         *     ], {
         *         vertices: {
         *             color: 'blue',
         *             snapToGrid: true
         *         }
         *     });
         *
         *     console.log(JXG.Math.Geometry.isConvex(pol));
         *
         *
         *
         *     })();
         *
         * </script><pre>
         *
         */
        isConvex: function(points) {
            var ps, le, i,
                eps = Mat.eps * Mat.eps,
                old_x, old_y, old_dir,
                new_x, new_y, new_dir,
                angle,
                orient,
                angle_sum = 0.0;

            if (Type.isArray(points)) {
                ps = Expect.each(points, Expect.coordsArray);
            } else if (Type.exists(points.type) && points.type === Const.OBJECT_TYPE_POLYGON) {
                ps = Expect.each(points.vertices, Expect.coordsArray);
            }
            le = ps.length;
            if (le === 0) {
                // Empty set is convex
                return true;
            }
            if (le < 3) {
                // Segments and points are convex
                return true;
            }

            orient = null;
            old_x = ps[le - 2][1];
            old_y = ps[le - 2][2];
            new_x = ps[le - 1][1];
            new_y = ps[le - 1][2];
            new_dir = Math.atan2(new_y - old_y, new_x - old_x);
            for (i = 0; i < le; i++) {
                old_x = new_x;
                old_y = new_y;
                old_dir = new_dir;
                new_x = ps[i][1];
                new_y = ps[i][2];
                if (old_x === new_x && old_y === new_y) {
                    // Repeated consecutive points are ignored
                    continue;
                }
                new_dir = Math.atan2(new_y - old_y, new_x - old_x);
                angle = new_dir - old_dir;
                if (angle <= -Math.PI) {
                    angle += 2 * Math.PI;
                } else if (angle > Math.PI) {
                    angle -= 2 * Math.PI;
                }
                if (orient === null) {
                    if (angle === 0.0) {
                        continue;
                    }
                    orient = (angle > 0) ? 1 : -1;
                } else {
                    if (orient * angle < -eps) {
                        return false;
                    }
                }
                angle_sum += angle;
            }

            if ((Math.abs(angle_sum / (2 * Math.PI)) - 1) < eps) {
                return true;
            }
            return false;
        },

        /**
         * A line can be a segment, a straight, or a ray. So it is not always delimited by point1 and point2
         * calcStraight determines the visual start point and end point of the line. A segment is only drawn
         * from start to end point, a straight line is drawn until it meets the boards boundaries.
         * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
         * @param {JXG.Coords} point1 Coordinates of the point where line drawing begins. This value is calculated and
         * set by this method.
         * @param {JXG.Coords} point2 Coordinates of the point where line drawing ends. This value is calculated and set
         * by this method.
         * @param {Number} margin Optional margin, to avoid the display of the small sides of lines.
         * @returns null
         * @see Line
         * @see JXG.Line
         */
        calcStraight: function (el, point1, point2, margin) {
            var takePoint1,
                takePoint2,
                intersection,
                intersect1,
                intersect2,
                straightFirst,
                straightLast,
                c, p1, p2;

            if (!Type.exists(margin)) {
                // Enlarge the drawable region slightly. This hides the small sides
                // of thick lines in most cases.
                margin = 10;
            }

            straightFirst = el.evalVisProp('straightfirst');
            straightLast = el.evalVisProp('straightlast');

            // If one of the point is an ideal point in homogeneous coordinates
            // drawing of line segments or rays are not possible.
            if (Math.abs(point1.scrCoords[0]) < Mat.eps) {
                straightFirst = true;
            }
            if (Math.abs(point2.scrCoords[0]) < Mat.eps) {
                straightLast = true;
            }

            // Do nothing in case of line segments (inside or outside of the board)
            if (!straightFirst && !straightLast) {
                return;
            }

            // Compute the stdform of the line in screen coordinates.
            c = [];
            c[0] =
                el.stdform[0] -
                (el.stdform[1] * el.board.origin.scrCoords[1]) / el.board.unitX +
                (el.stdform[2] * el.board.origin.scrCoords[2]) / el.board.unitY;
            c[1] = el.stdform[1] / el.board.unitX;
            c[2] = -el.stdform[2] / el.board.unitY;

            // If p1=p2
            if (isNaN(c[0] + c[1] + c[2])) {
                return;
            }

            takePoint1 = false;
            takePoint2 = false;

            // Line starts at point1 and point1 is inside the board
            takePoint1 =
                !straightFirst &&
                Math.abs(point1.usrCoords[0]) >= Mat.eps &&
                point1.scrCoords[1] >= 0.0 &&
                point1.scrCoords[1] <= el.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 &&
                point1.scrCoords[2] <= el.board.canvasHeight;

            // Line ends at point2 and point2 is inside the board
            takePoint2 =
                !straightLast &&
                Math.abs(point2.usrCoords[0]) >= Mat.eps &&
                point2.scrCoords[1] >= 0.0 &&
                point2.scrCoords[1] <= el.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 &&
                point2.scrCoords[2] <= el.board.canvasHeight;

            // Intersect the line with the four borders of the board.
            intersection = this.meetLineBoard(c, el.board, margin);
            intersect1 = intersection[0];
            intersect2 = intersection[1];

            /**
             * At this point we have four points:
             * point1 and point2 are the first and the second defining point on the line,
             * intersect1, intersect2 are the intersections of the line with border around the board.
             */

            /*
             * Here we handle rays where both defining points are outside of the board.
             */
            // If both points are outside and the complete ray is outside we do nothing
            if (!takePoint1 && !takePoint2) {
                // Ray starting at point 1
                if (
                    !straightFirst &&
                    straightLast &&
                    !this.isSameDirection(point1, point2, intersect1) &&
                    !this.isSameDirection(point1, point2, intersect2)
                ) {
                    return;
                }

                // Ray starting at point 2
                if (
                    straightFirst &&
                    !straightLast &&
                    !this.isSameDirection(point2, point1, intersect1) &&
                    !this.isSameDirection(point2, point1, intersect2)
                ) {
                    return;
                }
            }

            /*
             * If at least one of the defining points is outside of the board
             * we take intersect1 or intersect2 as one of the end points
             * The order is also important for arrows of axes
             */
            if (!takePoint1) {
                if (!takePoint2) {
                    // Two border intersection points are used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p1 = intersect1;
                        p2 = intersect2;
                    } else {
                        p2 = intersect1;
                        p1 = intersect2;
                    }
                } else {
                    // One border intersection points is used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p1 = intersect1;
                    } else {
                        p1 = intersect2;
                    }
                }
            } else {
                if (!takePoint2) {
                    // One border intersection points is used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p2 = intersect2;
                    } else {
                        p2 = intersect1;
                    }
                }
            }

            if (p1) {
                //point1.setCoordinates(Const.COORDS_BY_USER, p1.usrCoords.slice(1));
                point1.setCoordinates(Const.COORDS_BY_USER, p1.usrCoords);
            }

            if (p2) {
                //point2.setCoordinates(Const.COORDS_BY_USER, p2.usrCoords.slice(1));
                point2.setCoordinates(Const.COORDS_BY_USER, p2.usrCoords);
            }
        },

        /**
         * A line can be a segment, a straight, or a ray. so it is not always delimited by point1 and point2.
         *
         * This method adjusts the line's delimiting points taking into account its nature, the viewport defined
         * by the board.
         *
         * A segment is delimited by start and end point, a straight line or ray is delimited until it meets the
         * boards boundaries. However, if the line has infinite ticks, it will be delimited by the projection of
         * the boards vertices onto itself.
         *
         * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
         * @param {JXG.Coords} point1 Coordinates of the point where line drawing begins. This value is calculated and
         * set by this method.
         * @param {JXG.Coords} point2 Coordinates of the point where line drawing ends. This value is calculated and set
         * by this method.
         * @see Line
         * @see JXG.Line
         */
        calcLineDelimitingPoints: function (el, point1, point2) {
            var distP1P2,
                boundingBox,
                lineSlope,
                intersect1,
                intersect2,
                straightFirst,
                straightLast,
                c,
                p1,
                p2,
                takePoint1 = false,
                takePoint2 = false;

            straightFirst = el.evalVisProp('straightfirst');
            straightLast = el.evalVisProp('straightlast');

            // If one of the point is an ideal point in homogeneous coordinates
            // drawing of line segments or rays are not possible.
            if (Math.abs(point1.scrCoords[0]) < Mat.eps) {
                straightFirst = true;
            }
            if (Math.abs(point2.scrCoords[0]) < Mat.eps) {
                straightLast = true;
            }

            // Compute the stdform of the line in screen coordinates.
            c = [];
            c[0] =
                el.stdform[0] -
                (el.stdform[1] * el.board.origin.scrCoords[1]) / el.board.unitX +
                (el.stdform[2] * el.board.origin.scrCoords[2]) / el.board.unitY;
            c[1] = el.stdform[1] / el.board.unitX;
            c[2] = -el.stdform[2] / el.board.unitY;

            // p1=p2
            if (isNaN(c[0] + c[1] + c[2])) {
                return;
            }

            takePoint1 = !straightFirst;
            takePoint2 = !straightLast;
            // Intersect the board vertices on the line to establish the available visual space for the infinite ticks
            // Based on the slope of the line we can optimise and only project the two outer vertices

            // boundingBox = [x1, y1, x2, y2] upper left, lower right vertices
            boundingBox = el.board.getBoundingBox();
            lineSlope = el.getSlope();
            if (lineSlope >= 0) {
                // project vertices (x2,y1) (x1, y2)
                intersect1 = this.projectPointToLine(
                    { coords: { usrCoords: [1, boundingBox[2], boundingBox[1]] } },
                    el,
                    el.board
                );
                intersect2 = this.projectPointToLine(
                    { coords: { usrCoords: [1, boundingBox[0], boundingBox[3]] } },
                    el,
                    el.board
                );
            } else {
                // project vertices (x1, y1) (x2, y2)
                intersect1 = this.projectPointToLine(
                    { coords: { usrCoords: [1, boundingBox[0], boundingBox[1]] } },
                    el,
                    el.board
                );
                intersect2 = this.projectPointToLine(
                    { coords: { usrCoords: [1, boundingBox[2], boundingBox[3]] } },
                    el,
                    el.board
                );
            }

            /**
             * we have four points:
             * point1 and point2 are the first and the second defining point on the line,
             * intersect1, intersect2 are the intersections of the line with border around the board.
             */

            /*
             * Here we handle rays/segments where both defining points are outside of the board.
             */
            if (!takePoint1 && !takePoint2) {
                // Segment, if segment does not cross the board, do nothing
                if (!straightFirst && !straightLast) {
                    distP1P2 = point1.distance(Const.COORDS_BY_USER, point2);
                    // if  intersect1 not between point1 and point2
                    if (
                        Math.abs(
                            point1.distance(Const.COORDS_BY_USER, intersect1) +
                            intersect1.distance(Const.COORDS_BY_USER, point2) -
                            distP1P2
                        ) > Mat.eps
                    ) {
                        return;
                    }
                    // if insersect2 not between point1 and point2
                    if (
                        Math.abs(
                            point1.distance(Const.COORDS_BY_USER, intersect2) +
                            intersect2.distance(Const.COORDS_BY_USER, point2) -
                            distP1P2
                        ) > Mat.eps
                    ) {
                        return;
                    }
                }

                // If both points are outside and the complete ray is outside we do nothing
                // Ray starting at point 1
                if (
                    !straightFirst &&
                    straightLast &&
                    !this.isSameDirection(point1, point2, intersect1) &&
                    !this.isSameDirection(point1, point2, intersect2)
                ) {
                    return;
                }

                // Ray starting at point 2
                if (
                    straightFirst &&
                    !straightLast &&
                    !this.isSameDirection(point2, point1, intersect1) &&
                    !this.isSameDirection(point2, point1, intersect2)
                ) {
                    return;
                }
            }

            /*
             * If at least one of the defining points is outside of the board
             * we take intersect1 or intersect2 as one of the end points
             * The order is also important for arrows of axes
             */
            if (!takePoint1) {
                if (!takePoint2) {
                    // Two border intersection points are used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p1 = intersect1;
                        p2 = intersect2;
                    } else {
                        p2 = intersect1;
                        p1 = intersect2;
                    }
                } else {
                    // One border intersection points is used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p1 = intersect1;
                    } else {
                        p1 = intersect2;
                    }
                }
            } else {
                if (!takePoint2) {
                    // One border intersection points is used
                    if (this.isSameDir(point1, point2, intersect1, intersect2)) {
                        p2 = intersect2;
                    } else {
                        p2 = intersect1;
                    }
                }
            }

            if (p1) {
                //point1.setCoordinates(Const.COORDS_BY_USER, p1.usrCoords.slice(1));
                point1.setCoordinates(Const.COORDS_BY_USER, p1.usrCoords);
            }

            if (p2) {
                //point2.setCoordinates(Const.COORDS_BY_USER, p2.usrCoords.slice(1));
                point2.setCoordinates(Const.COORDS_BY_USER, p2.usrCoords);
            }
        },

        /**
         * Calculates the visProp.position corresponding to a given angle.
         * @param {number} angle angle in radians. Must be in range (-2pi,2pi).
         */
        calcLabelQuadrant: function (angle) {
            var q;
            if (angle < 0) {
                angle += 2 * Math.PI;
            }
            q = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;
            return ["rt", "urt", "top", "ulft", "lft", "llft", "lrt"][q];
        },

        /**
         * The vectors <tt>p2-p1</tt> and <tt>i2-i1</tt> are supposed to be collinear. If their cosine is positive
         * they point into the same direction otherwise they point in opposite direction.
         * @param {JXG.Coords} p1
         * @param {JXG.Coords} p2
         * @param {JXG.Coords} i1
         * @param {JXG.Coords} i2
         * @returns {Boolean} True, if <tt>p2-p1</tt> and <tt>i2-i1</tt> point into the same direction
         */
        isSameDir: function (p1, p2, i1, i2) {
            var dpx = p2.usrCoords[1] - p1.usrCoords[1],
                dpy = p2.usrCoords[2] - p1.usrCoords[2],
                dix = i2.usrCoords[1] - i1.usrCoords[1],
                diy = i2.usrCoords[2] - i1.usrCoords[2];

            if (Math.abs(p2.usrCoords[0]) < Mat.eps) {
                dpx = p2.usrCoords[1];
                dpy = p2.usrCoords[2];
            }

            if (Math.abs(p1.usrCoords[0]) < Mat.eps) {
                dpx = -p1.usrCoords[1];
                dpy = -p1.usrCoords[2];
            }

            return dpx * dix + dpy * diy >= 0;
        },

        /**
         * If you're looking from point "start" towards point "s" and you can see the point "p", return true.
         * Otherwise return false.
         * @param {JXG.Coords} start The point you're standing on.
         * @param {JXG.Coords} p The point in which direction you're looking.
         * @param {JXG.Coords} s The point that should be visible.
         * @returns {Boolean} True, if from start the point p is in the same direction as s is, that means s-start = k*(p-start) with k>=0.
         */
        isSameDirection: function (start, p, s) {
            var dx,
                dy,
                sx,
                sy,
                r = false;

            dx = p.usrCoords[1] - start.usrCoords[1];
            dy = p.usrCoords[2] - start.usrCoords[2];

            sx = s.usrCoords[1] - start.usrCoords[1];
            sy = s.usrCoords[2] - start.usrCoords[2];

            if (Math.abs(dx) < Mat.eps) {
                dx = 0;
            }

            if (Math.abs(dy) < Mat.eps) {
                dy = 0;
            }

            if (Math.abs(sx) < Mat.eps) {
                sx = 0;
            }

            if (Math.abs(sy) < Mat.eps) {
                sy = 0;
            }

            if (dx >= 0 && sx >= 0) {
                r = (dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0);
            } else if (dx <= 0 && sx <= 0) {
                r = (dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0);
            }

            return r;
        },

        /**
         * Determinant of three points in the Euclidean plane.
         * Zero, if the points are collinear. Used to determine of a point q is left or
         * right to a segment defined by points p1 and p2.
         * <p>
         * Non-homogeneous version.
         *
         * @param  {Array|JXG.Point} p1 First point or its coordinates of the segment. Point object or array of length 3. First (homogeneous) coordinate is equal to 1.
         * @param  {Array|JXG.Point} p2 Second point or its coordinates of the segment. Point object or array of length 3. First (homogeneous) coordinate is equal to 1.
         * @param  {Array|JXG.Point} q Point or its coordinates. Point object or array of length 3. First (homogeneous) coordinate is equal to 1.
         * @return {Number} Signed area of the triangle formed by these three points.
         *
         * @see JXG.Math.Geometry.windingNumber
         */
        det3p: function (p1, p2, q) {
            var pp1, pp2, qq;

            if (Type.isPoint(p1)) {
                pp1 = p1.Coords(true);
            } else {
                pp1 = p1;
            }
            if (Type.isPoint(p2)) {
                pp2 = p2.Coords(true);
            } else {
                pp2 = p2;
            }
            if (Type.isPoint(q)) {
                qq = q.Coords(true);
            } else {
                qq = q;
            }

            return (pp1[1] - qq[1]) * (pp2[2] - qq[2]) - (pp2[1] - qq[1]) * (pp1[2] - qq[2]);
        },

        /**
         * Winding number of a point in respect to a polygon path.
         *
         * The point is regarded outside if the winding number is zero,
         * inside otherwise. The algorithm tries to find degenerate cases, i.e.
         * if the point is on the path. This is regarded as "outside".
         * If the point is a vertex of the path, it is regarded as "inside".
         *
         * Implementation of algorithm 7 from "The point in polygon problem for
         * arbitrary polygons" by Kai Hormann and Alexander Agathos, Computational Geometry,
         * Volume 20, Issue 3, November 2001, Pages 131-144.
         *
         * @param  {Array} usrCoords Homogenous coordinates of the point
         * @param  {Array} path      Array of points / coords determining a path, i.e. the vertices of the polygon / path. The array elements
         * do not have to be full points, but have to have a subobject "coords" or should be of type JXG.Coords.
         * @param  {Boolean} [doNotClosePath=false] If true the last point of the path is not connected to the first point.
         * This is necessary if the path consists of two or more closed subpaths, e.g. if the figure has a hole.
         *
         * @return {Number}          Winding number of the point. The point is
         *                           regarded outside if the winding number is zero,
         *                           inside otherwise.
         */
        windingNumber: function (usrCoords, path, doNotClosePath) {
            var wn = 0,
                le = path.length,
                x = usrCoords[1],
                y = usrCoords[2],
                p0,
                p1,
                p2,
                d,
                sign,
                i,
                off = 0;

            if (le === 0) {
                return 0;
            }

            doNotClosePath = doNotClosePath || false;
            if (doNotClosePath) {
                off = 1;
            }

            // Infinite points are declared outside
            if (isNaN(x) || isNaN(y)) {
                return 1;
            }

            if (Type.exists(path[0].coords)) {
                p0 = path[0].coords;
                p1 = path[le - 1].coords;
            } else {
                p0 = path[0];
                p1 = path[le - 1];
            }
            // Handle the case if the point is the first vertex of the path, i.e. inside.
            if (p0.usrCoords[1] === x && p0.usrCoords[2] === y) {
                return 1;
            }

            for (i = 0; i < le - off; i++) {
                // Consider the edge from p1 = path[i] to p2 = path[i+1]isClosedPath
                if (Type.exists(path[i].coords)) {
                    p1 = path[i].coords.usrCoords;
                    p2 = path[(i + 1) % le].coords.usrCoords;
                } else {
                    p1 = path[i].usrCoords;
                    p2 = path[(i + 1) % le].usrCoords;
                }

                // If one of the two points p1, p2 is undefined or infinite,
                // move on.
                if (
                    p1[0] === 0 ||
                    p2[0] === 0 ||
                    isNaN(p1[1]) ||
                    isNaN(p2[1]) ||
                    isNaN(p1[2]) ||
                    isNaN(p2[2])
                ) {
                    continue;
                }

                if (p2[2] === y) {
                    if (p2[1] === x) {
                        return 1;
                    }
                    if (p1[2] === y && p2[1] > x === p1[1] < x) {
                        return 0;
                    }
                }

                if (p1[2] < y !== p2[2] < y) {
                    // Crossing
                    sign = 2 * (p2[2] > p1[2] ? 1 : 0) - 1;
                    if (p1[1] >= x) {
                        if (p2[1] > x) {
                            wn += sign;
                        } else {
                            d = this.det3p(p1, p2, usrCoords);
                            if (d === 0) {
                                // Point is on line, i.e. outside
                                return 0;
                            }
                            if (d > 0 + Mat.eps === p2[2] > p1[2]) {
                                // Right crossing
                                wn += sign;
                            }
                        }
                    } else {
                        if (p2[1] > x) {
                            d = this.det3p(p1, p2, usrCoords);
                            if (d > 0 + Mat.eps === p2[2] > p1[2]) {
                                // Right crossing
                                wn += sign;
                            }
                        }
                    }
                }
            }

            return wn;
        },

        /**
         * Decides if a point (x,y) is inside of a path / polygon.
         * Does not work correct if the path has hole. In this case, windingNumber is the preferred method.
         * Implements W. Randolf Franklin's pnpoly method.
         *
         * See <a href="https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html">https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html</a>.
         *
         * @param {Number} x_in x-coordinate (screen or user coordinates)
         * @param {Number} y_in y-coordinate (screen or user coordinates)
         * @param  {Array} path  Array of points / coords determining a path, i.e. the vertices of the polygon / path. The array elements
         * do not have to be full points, but have to have a subobject "coords" or should be of type JXG.Coords.
         * @param {Number} [coord_type=JXG.COORDS_BY_SCREEN] Type of coordinates used here.
         *   Possible values are <b>JXG.COORDS_BY_USER</b> and <b>JXG.COORDS_BY_SCREEN</b>.
         *   Default value is JXG.COORDS_BY_SCREEN.
         * @param {JXG.Board} board Board object
         *
         * @returns {Boolean} if (x_in, y_in) is inside of the polygon.
         * @see JXG.Polygon#hasPoint
         * @see JXG.Polygon#pnpoly
         * @see JXG.Math.Geometry.windingNumber
         *
         * @example
         * var pol = board.create('polygon', [[-1,2], [2,2], [-1,4]]);
         * var p = board.create('point', [4, 3]);
         * var txt = board.create('text', [-1, 0.5, function() {
         *   return 'Point A is inside of the polygon = ' +
         *     JXG.Math.Geometry.pnpoly(p.X(), p.Y(), pol.vertices, JXG.COORDS_BY_USER, board);
         * }]);
         *
         * </pre><div id="JXG4656ed42-f965-4e35-bb66-c334a4529683" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG4656ed42-f965-4e35-bb66-c334a4529683',
         *             {boundingbox: [-2, 5, 5,-2], axis: true, showcopyright: false, shownavigation: false});
         *     var pol = board.create('polygon', [[-1,2], [2,2], [-1,4]]);
         *     var p = board.create('point', [4, 3]);
         *     var txt = board.create('text', [-1, 0.5, function() {
         *     		return 'Point A is inside of the polygon = ' + JXG.Math.Geometry.pnpoly(p.X(), p.Y(), pol.vertices, JXG.COORDS_BY_USER, board);
         *     }]);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        pnpoly: function (x_in, y_in, path, coord_type, board) {
            var i, j, vi, vj, len,
                x, y, crds,
                v = path,
                isIn = false;

            if (coord_type === Const.COORDS_BY_USER) {
                crds = new Coords(Const.COORDS_BY_USER, [x_in, y_in], board);
                x = crds.scrCoords[1];
                y = crds.scrCoords[2];
            } else {
                x = x_in;
                y = y_in;
            }

            len = path.length;
            for (i = 0, j = len - 2; i < len - 1; j = i++) {
                vi = Type.exists(v[i].coords) ? v[i].coords : v[i];
                vj = Type.exists(v[j].coords) ? v[j].coords : v[j];

                if (
                    vi.scrCoords[2] > y !== vj.scrCoords[2] > y &&
                    x <
                    ((vj.scrCoords[1] - vi.scrCoords[1]) * (y - vi.scrCoords[2])) /
                    (vj.scrCoords[2] - vi.scrCoords[2]) +
                    vi.scrCoords[1]
                ) {
                    isIn = !isIn;
                }
            }

            return isIn;
        },

        /****************************************/
        /****          INTERSECTIONS         ****/
        /****************************************/

        /**
         * Generate the function which computes the coordinates of the intersection point.
         * Primarily used in {@link JXG.Point.createIntersectionPoint}.
         * @param {JXG.Board} board object
         * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_Number|Function} el1,el2,i The result will be a intersection point on el1 and el2.
         * i determines the intersection point if two points are available: <ul>
         *   <li>i==0: use the positive square root,</li>
         *   <li>i==1: use the negative square root.</li></ul>
         * @param {Boolean} alwaysintersect. Flag that determines if segments and arc can have an outer intersection point
         * on their defining line or circle.
         * @returns {Function} Function returning a {@link JXG.Coords} object that determines
         * the intersection point.
         *
         * @see JXG.Point.createIntersectionPoint
         */
        intersectionFunction: function (board, el1, el2, i, j, alwaysintersect) {
            var func,
                that = this,
                el1_isArcType = false,
                el2_isArcType = false;

            el1_isArcType =
                el1.elementClass === Const.OBJECT_CLASS_CURVE &&
                    (el1.type === Const.OBJECT_TYPE_ARC || el1.type === Const.OBJECT_TYPE_SECTOR)
                    ? true
                    : false;
            el2_isArcType =
                el2.elementClass === Const.OBJECT_CLASS_CURVE &&
                    (el2.type === Const.OBJECT_TYPE_ARC || el2.type === Const.OBJECT_TYPE_SECTOR)
                    ? true
                    : false;

            if (
                (el1.elementClass === Const.OBJECT_CLASS_CURVE ||
                    el2.elementClass === Const.OBJECT_CLASS_CURVE) &&
                (el1.elementClass === Const.OBJECT_CLASS_CURVE ||
                    el1.elementClass === Const.OBJECT_CLASS_CIRCLE) &&
                (el2.elementClass === Const.OBJECT_CLASS_CURVE ||
                    el2.elementClass === Const.OBJECT_CLASS_CIRCLE) /*&&
                !(el1_isArcType && el2_isArcType)*/
            ) {
                // curve - curve
                // with the exception that both elements are arc types
                /** @ignore */
                func = function () {
                    return that.meetCurveCurve(el1, el2, i, j, el1.board);
                };
            } else if (
                (el1.elementClass === Const.OBJECT_CLASS_CURVE &&
                    !el1_isArcType &&
                    el2.elementClass === Const.OBJECT_CLASS_LINE) ||
                (el2.elementClass === Const.OBJECT_CLASS_CURVE &&
                    !el2_isArcType &&
                    el1.elementClass === Const.OBJECT_CLASS_LINE)
            ) {
                // curve - line (this includes intersections between conic sections and lines)
                // with the exception that the curve is of arc type
                /** @ignore */
                func = function () {
                    return that.meetCurveLine(el1, el2, i, el1.board, Type.evaluate(alwaysintersect));
                };
            } else if (
                el1.type === Const.OBJECT_TYPE_POLYGON ||
                el2.type === Const.OBJECT_TYPE_POLYGON
            ) {
                // polygon - other
                // Uses the Greiner-Hormann clipping algorithm
                // Not implemented: polygon - point

                if (el1.elementClass === Const.OBJECT_CLASS_LINE) {
                    // line - path
                    /** @ignore */
                    func = function () {
                        var first1 = el1.evalVisProp('straightfirst'),
                            last1 = el1.evalVisProp('straightlast'),
                            first2 = el2.evalVisProp('straightfirst'),
                            last2 = el2.evalVisProp('straightlast'),
                            a_not;

                        a_not = (!Type.evaluate(alwaysintersect) && (!first1 || !last1 || !first2 || !last2));
                        return that.meetPolygonLine(el2, el1, i, el1.board, a_not);
                    };
                } else if (el2.elementClass === Const.OBJECT_CLASS_LINE) {
                    // path - line
                    /** @ignore */
                    func = function () {
                        var first1 = el1.evalVisProp('straightfirst'),
                            last1 = el1.evalVisProp('straightlast'),
                            first2 = el2.evalVisProp('straightfirst'),
                            last2 = el2.evalVisProp('straightlast'),
                            a_not;

                        a_not = (!Type.evaluate(alwaysintersect) && (!first1 || !last1 || !first2 || !last2));
                        return that.meetPolygonLine(el1, el2, i, el1.board, a_not);
                    };
                } else {
                    // path - path
                    /** @ignore */
                    func = function () {
                        return that.meetPathPath(el1, el2, i, el1.board);
                    };
                }
            } else if (
                el1.elementClass === Const.OBJECT_CLASS_LINE &&
                el2.elementClass === Const.OBJECT_CLASS_LINE
            ) {
                // line - line, lines may also be segments.
                /** @ignore */
                func = function () {
                    var res,
                        c,
                        first1 = el1.evalVisProp('straightfirst'),
                        last1 = el1.evalVisProp('straightlast'),
                        first2 = el2.evalVisProp('straightfirst'),
                        last2 = el2.evalVisProp('straightlast');

                    /**
                     * If one of the lines is a segment or ray and
                     * the intersection point should disappear if outside
                     * of the segment or ray we call
                     * meetSegmentSegment
                     */
                    if (
                        !Type.evaluate(alwaysintersect) &&
                        (!first1 || !last1 || !first2 || !last2)
                    ) {
                        res = that.meetSegmentSegment(
                            el1.point1.coords.usrCoords,
                            el1.point2.coords.usrCoords,
                            el2.point1.coords.usrCoords,
                            el2.point2.coords.usrCoords
                        );

                        if (
                            (!first1 && res[1] < 0) ||
                            (!last1 && res[1] > 1) ||
                            (!first2 && res[2] < 0) ||
                            (!last2 && res[2] > 1)
                        ) {
                            // Non-existent
                            c = [0, NaN, NaN];
                        } else {
                            c = res[0];
                        }

                        return new Coords(Const.COORDS_BY_USER, c, el1.board);
                    }

                    return that.meet(el1.stdform, el2.stdform, i, el1.board);
                };
            } else {
                // All other combinations of circles and lines,
                // Arc types are treated as circles.
                /** @ignore */
                func = function () {
                    var res = that.meet(el1.stdform, el2.stdform, i, el1.board),
                        has = true,
                        first,
                        last,
                        r;

                    if (Type.evaluate(alwaysintersect)) {
                        return res;
                    }
                    if (el1.elementClass === Const.OBJECT_CLASS_LINE) {
                        first = el1.evalVisProp('straightfirst');
                        last = el1.evalVisProp('straightlast');
                        if (!first || !last) {
                            r = that.affineRatio(el1.point1.coords, el1.point2.coords, res);
                            if ((!last && r > 1 + Mat.eps) || (!first && r < 0 - Mat.eps)) {
                                return new Coords(JXG.COORDS_BY_USER, [0, NaN, NaN], el1.board);
                            }
                        }
                    }
                    if (el2.elementClass === Const.OBJECT_CLASS_LINE) {
                        first = el2.evalVisProp('straightfirst');
                        last = el2.evalVisProp('straightlast');
                        if (!first || !last) {
                            r = that.affineRatio(el2.point1.coords, el2.point2.coords, res);
                            if ((!last && r > 1 + Mat.eps) || (!first && r < 0 - Mat.eps)) {
                                return new Coords(JXG.COORDS_BY_USER, [0, NaN, NaN], el1.board);
                            }
                        }
                    }
                    if (el1_isArcType) {
                        has = that.coordsOnArc(el1, res);
                        if (has && el2_isArcType) {
                            has = that.coordsOnArc(el2, res);
                        }
                        if (!has) {
                            return new Coords(JXG.COORDS_BY_USER, [0, NaN, NaN], el1.board);
                        }
                    }
                    return res;
                };
            }

            return func;
        },

        otherIntersectionFunction: function (input, others, alwaysintersect, precision) {
            var func, board,
                el1, el2,
                that = this;

            el1 = input[0];
            el2 = input[1];
            board = el1.board;
            /** @ignore */
            func = function () {
                var i, k, c, d,
                    isClose,
                    le = others.length,
                    eps = Type.evaluate(precision);

                for (i = le; i >= 0; i--) {
                    if (el1.elementClass === Const.OBJECT_CLASS_CIRCLE &&
                        [Const.OBJECT_CLASS_CIRCLE, Const.OBJECT_CLASS_LINE].indexOf(el2.elementClass) >= 0) {
                        // circle, circle|line
                        c = that.meet(el1.stdform, el2.stdform, i, board);
                    } else if (el1.elementClass === Const.OBJECT_CLASS_CURVE &&
                        [Const.OBJECT_CLASS_CURVE, Const.OBJECT_CLASS_CIRCLE].indexOf(el2.elementClass) >= 0) {
                        // curve, circle|curve
                        c = that.meetCurveCurve(el1, el2, i, 0, board);
                    } else if (el1.elementClass === Const.OBJECT_CLASS_CURVE && el2.elementClass === Const.OBJECT_CLASS_LINE) {
                        // curve, line
                        if (Type.exists(el1.dataX)) {
                            c = JXG.Math.Geometry.meetCurveLine(el1, el2, i, el1.board, Type.evaluate(alwaysintersect));
                        } else {
                            c = JXG.Math.Geometry.meetCurveLineContinuous(el1, el2, i, el1.board);
                        }
                    }

                    if (c === undefined) {
                        // Intersection point does not exist
                        continue;
                    }

                    // If the intersection is close to one of the points in other
                    // we have to search for another intersection point.
                    isClose = false;
                    for (k = 0; !isClose && k < le; k++) {
                        if (Type.exists(c) && Type.exists(c.distance)) {
                            d = c.distance(JXG.COORDS_BY_USER, others[k].coords);
                            if (d < eps) {
                                isClose = true;
                            }
                        }
                    }
                    if (!isClose) {
                        // We are done, the intersection is away from any other
                        // intersection point.
                        return c;
                    }
                }
                // Otherwise we return the last intersection point
                return c;
            };
            return func;
        },

        /**
         * Returns true if the coordinates are on the arc element,
         * false otherwise. Usually, coords is an intersection
         * on the circle line. Now it is decided if coords are on the
         * circle restricted to the arc line.
         * @param  {Arc} arc arc or sector element
         * @param  {JXG.Coords} coords Coords object of an intersection
         * @returns {Boolean}
         * @private
         */
        coordsOnArc: function (arc, coords) {
            var angle = this.rad(arc.radiuspoint, arc.center, coords.usrCoords.slice(1)),
                alpha = 0.0,
                beta = this.rad(arc.radiuspoint, arc.center, arc.anglepoint),
                ev_s = arc.evalVisProp('selection');

            if ((ev_s === "minor" && beta > Math.PI) || (ev_s === "major" && beta < Math.PI)) {
                alpha = beta;
                beta = 2 * Math.PI;
            }
            if (angle < alpha || angle > beta) {
                return false;
            }
            return true;
        },

        /**
         * Computes the intersection of a pair of lines, circles or both.
         * It uses the internal data array stdform of these elements.
         * @param {Array} el1 stdform of the first element (line or circle)
         * @param {Array} el2 stdform of the second element (line or circle)
         * @param {Number|Function} i Index of the intersection point that should be returned.
         * @param board Reference to the board.
         * @returns {JXG.Coords} Coordinates of one of the possible two or more intersection points.
         * Which point will be returned is determined by i.
         */
        meet: function (el1, el2, i, board) {
            var result,
                eps = Mat.eps;

            if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) < eps) {
                // line line
                result = this.meetLineLine(el1, el2, i, board);
            } else if (Math.abs(el1[3]) >= eps && Math.abs(el2[3]) < eps) {
                // circle line
                result = this.meetLineCircle(el2, el1, i, board);
            } else if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) >= eps) {
                // line circle
                result = this.meetLineCircle(el1, el2, i, board);
            } else {
                // circle circle
                result = this.meetCircleCircle(el1, el2, i, board);
            }

            return result;
        },

        /**
         * Intersection of the line with the board
         * @param  {Array}     line   stdform of the line in screen coordinates
         * @param  {JXG.Board} board  reference to a board.
         * @param  {Number}    margin optional margin, to avoid the display of the small sides of lines.
         * @returns {Array}            [intersection coords 1, intersection coords 2]
         */
        meetLineBoard: function (line, board, margin) {
            // Intersect the line with the four borders of the board.
            var s = [],
                intersect1,
                intersect2,
                i, j;

            if (!Type.exists(margin)) {
                margin = 0;
            }

            // top
            s[0] = Mat.crossProduct(line, [margin, 0, 1]);
            // left
            s[1] = Mat.crossProduct(line, [margin, 1, 0]);
            // bottom
            s[2] = Mat.crossProduct(line, [-margin - board.canvasHeight, 0, 1]);
            // right
            s[3] = Mat.crossProduct(line, [-margin - board.canvasWidth, 1, 0]);

            // Normalize the intersections
            for (i = 0; i < 4; i++) {
                if (Math.abs(s[i][0]) > Mat.eps) {
                    for (j = 2; j > 0; j--) {
                        s[i][j] /= s[i][0];
                    }
                    s[i][0] = 1.0;
                }
            }

            // line is parallel to "left", take "top" and "bottom"
            if (Math.abs(s[1][0]) < Mat.eps) {
                intersect1 = s[0]; // top
                intersect2 = s[2]; // bottom
                // line is parallel to "top", take "left" and "right"
            } else if (Math.abs(s[0][0]) < Mat.eps) {
                intersect1 = s[1]; // left
                intersect2 = s[3]; // right
                // left intersection out of board (above)
            } else if (s[1][2] < 0) {
                intersect1 = s[0]; // top

                // right intersection out of board (below)
                if (s[3][2] > board.canvasHeight) {
                    intersect2 = s[2]; // bottom
                } else {
                    intersect2 = s[3]; // right
                }
                // left intersection out of board (below)
            } else if (s[1][2] > board.canvasHeight) {
                intersect1 = s[2]; // bottom

                // right intersection out of board (above)
                if (s[3][2] < 0) {
                    intersect2 = s[0]; // top
                } else {
                    intersect2 = s[3]; // right
                }
            } else {
                intersect1 = s[1]; // left

                // right intersection out of board (above)
                if (s[3][2] < 0) {
                    intersect2 = s[0]; // top
                    // right intersection out of board (below)
                } else if (s[3][2] > board.canvasHeight) {
                    intersect2 = s[2]; // bottom
                } else {
                    intersect2 = s[3]; // right
                }
            }

            return [
                new Coords(Const.COORDS_BY_SCREEN, intersect1.slice(1), board),
                new Coords(Const.COORDS_BY_SCREEN, intersect2.slice(1), board)
            ];
        },

        /**
         * Intersection of two lines.
         * @param {Array} l1 stdform of the first line
         * @param {Array} l2 stdform of the second line
         * @param {number} i unused
         * @param {JXG.Board} board Reference to the board.
         * @returns {JXG.Coords} Coordinates of the intersection point.
         */
        meetLineLine: function (l1, l2, i, board) {
            var s = isNaN(l1[5] + l2[5]) ? [0, 0, 0] : Mat.crossProduct(l1, l2);

            // Make intersection of parallel lines more robust:
            if (Math.abs(s[0]) < 1.0e-14) {
                s[0] = 0;
            }
            return new Coords(Const.COORDS_BY_USER, s, board);
        },

        /**
         * Intersection of line and circle.
         * @param {Array} lin stdform of the line
         * @param {Array} circ stdform of the circle
         * @param {number|function} i number of the returned intersection point.
         *   i==0: use the positive square root,
         *   i==1: use the negative square root.
         * @param {JXG.Board} board Reference to a board.
         * @returns {JXG.Coords} Coordinates of the intersection point
         */
        meetLineCircle: function (lin, circ, i, board) {
            var a, b, c, d, n, A, B, C, k, t;

            // Radius is zero, return center of circle
            if (circ[4] < Mat.eps) {
                if (Math.abs(Mat.innerProduct([1, circ[6], circ[7]], lin, 3)) < Mat.eps) {
                    return new Coords(Const.COORDS_BY_USER, circ.slice(6, 8), board);
                }

                return new Coords(Const.COORDS_BY_USER, [NaN, NaN], board);
            }
            c = circ[0];
            b = circ.slice(1, 3);
            a = circ[3];
            d = lin[0];
            n = lin.slice(1, 3);

            // Line is assumed to be normalized. Therefore, nn==1 and we can skip some operations:
            /*
             var nn = n[0]*n[0]+n[1]*n[1];
             A = a*nn;
             B = (b[0]*n[1]-b[1]*n[0])*nn;
             C = a*d*d - (b[0]*n[0]+b[1]*n[1])*d + c*nn;
             */
            A = a;
            B = b[0] * n[1] - b[1] * n[0];
            C = a * d * d - (b[0] * n[0] + b[1] * n[1]) * d + c;

            k = B * B - 4 * A * C;
            if (k > -Mat.eps * Mat.eps) {
                k = Math.sqrt(Math.abs(k));
                t = [(-B + k) / (2 * A), (-B - k) / (2 * A)];

                return Type.evaluate(i) === 0
                    ? new Coords(
                        Const.COORDS_BY_USER,
                        [-t[0] * -n[1] - d * n[0], -t[0] * n[0] - d * n[1]],
                        board
                    )
                    : new Coords(
                        Const.COORDS_BY_USER,
                        [-t[1] * -n[1] - d * n[0], -t[1] * n[0] - d * n[1]],
                        board
                    );
            }

            return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
        },

        /**
         * Intersection of two circles.
         * @param {Array} circ1 stdform of the first circle
         * @param {Array} circ2 stdform of the second circle
         * @param {number|function} i number of the returned intersection point.
         *   i==0: use the positive square root,
         *   i==1: use the negative square root.
         * @param {JXG.Board} board Reference to the board.
         * @returns {JXG.Coords} Coordinates of the intersection point
         */
        meetCircleCircle: function (circ1, circ2, i, board) {
            var radicalAxis;

            // Radius is zero, return center of circle, if on other circle
            if (circ1[4] < Mat.eps) {
                if (
                    Math.abs(this.distance(circ1.slice(6, 2), circ2.slice(6, 8)) - circ2[4]) <
                    Mat.eps
                ) {
                    return new Coords(Const.COORDS_BY_USER, circ1.slice(6, 8), board);
                }

                return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
            }

            // Radius is zero, return center of circle, if on other circle
            if (circ2[4] < Mat.eps) {
                if (
                    Math.abs(this.distance(circ2.slice(6, 2), circ1.slice(6, 8)) - circ1[4]) <
                    Mat.eps
                ) {
                    return new Coords(Const.COORDS_BY_USER, circ2.slice(6, 8), board);
                }

                return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
            }

            radicalAxis = [
                circ2[3] * circ1[0] - circ1[3] * circ2[0],
                circ2[3] * circ1[1] - circ1[3] * circ2[1],
                circ2[3] * circ1[2] - circ1[3] * circ2[2],
                0,
                1,
                Infinity,
                Infinity,
                Infinity
            ];
            radicalAxis = Mat.normalize(radicalAxis);

            return this.meetLineCircle(radicalAxis, circ1, i, board);
        },

        /**
         * Segment-wise search for the nr-th intersection of two curves.
         * testSegment is always assumed to be true.
         *
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Number} nr the nr-th intersection point will be returned
         * @param {JXG.Board} [board=c1.board] Reference to a board object
         * @returns {JXG.Coords} intersection as Coords object
         *
         * @private
         * @see JXG.Math.Geometry.meetCurveCurve
         */
        meetCurveCurveDiscrete: function (c1, c2, nr, board) {
            var co,
                i = Type.evaluate(nr);

            if (c1.bezierDegree === 3 || c2.bezierDegree === 3) {
                co = this.meetBezierCurveRedBlueSegments(c1, c2, i);
            } else {
                co = this.meetCurveRedBlueSegments(c1, c2, i);
            }
            return new Coords(Const.COORDS_BY_USER, co, board);
        },

        /**
         * Apply Newton-Raphson to search for an intersection of two curves
         * in a given range of the first curve.
         *
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Array} range Domain for the search of an intersection. The start value
         * for the search is chosen to be inside of that range.
         * @param {Boolean} testSegment If true require that t1 and t2 are inside of the allowed bounds.
         * @returns {Array} [[z, x, y], t1, t2, t, ||c1[t1]-c2[t2]||**2]. The last entry is set to
         * 10000 if the intersection is outside of the given domain (range) for the first curve.
         * @private
         * @see JXG.Math.Geometry._meetCurveCurveRecursive
         * @see JXG.Math.Geometry._meetCurveCurveIterative
         * @see JXG.Math.Numerics.generalizedDampedNewton
         * @see JXG.Math.Geometry.meetCurveCurveCobyla
         */
        meetCurveCurveNewton: function (c1, c2, range1, range2, testSegment) {
            var t1, t2,
                co, r,
                inphi = (Math.sqrt(5) - 1) * 0.5,
                damp = 0.85, // (
                eps3 = Mat.eps * Mat.eps * Mat.eps,
                eps2 = Mat.eps * Mat.eps,

                ma1 = c1.maxX(),
                mi1 = c1.minX(),
                ma2 = c2.maxX(),
                mi2 = c2.minX(),

                F = function(t, n) {
                    var f1 = c1.Ft(t[0]),
                        f2 = c2.Ft(t[1]),
                        e = f1[1] - f2[1],
                        f = f1[2] - f2[2];

                    return [e, f];
                },
                D = function(t, n) {
                    var h = Mat.eps,
                        h2 = 2 * h,
                        f1_1 = c1.Ft(t[0] - h),
                        f1_2 = c1.Ft(t[0] + h),
                        f2_1 = c2.Ft(t[1] - h),
                        f2_2 = c2.Ft(t[1] + h);
                    return [
                        [ (f1_2[1] - f1_1[1]) / h2,
                         -(f2_2[1] - f2_1[1]) / h2],
                        [ (f1_2[2] - f1_1[2]) / h2,
                         -(f2_2[2] - f2_1[2]) / h2]
                    ];
                };

            t1 = range1[0] + (range1[1] - range1[0]) * (1 - inphi);
            t2 = range2[0] + (range2[1] - range2[0]) * (1 - inphi);

            // Use damped Newton
            // r = Numerics.generalizedDampedNewtonCurves(c1, c2, t1, t2, damp, eps3);
            r = Numerics.generalizedDampedNewton(F, D, 2, [t1, t2], damp, eps3, 40);
            // r: [t1, t2, F2]

            t1 = r[0][0];
            t2 = r[0][1];
            co = c1.Ft(t1);

            if (
                t1 < range1[0] - Mat.eps || t1 > range1[1] + Mat.eps ||
                t2 < range2[0] - Mat.eps || t2 > range2[1] + Mat.eps ||
                (testSegment &&
                    (t1 < mi1 - eps2 || t1 > ma1 + eps2 ||
                     t2 < mi2 - eps2 || t2 > ma2 + eps2)
                )
            ) {
                // Damped-Newton found solution outside of range
                return [co, t1, t2, 10000];
            }
// console.log(t1, r[3])

            return [co, t1, t2, r[1]];
        },

        /**
         * Return a list of the (at most) first i intersection points of two curves.
         * Computed iteratively.
         *
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Number} low Lower bound of the search domain (between [0, 1])
         * @param {Number} up Upper bound of the search domain (between [0, 1])
         * @param {Number} i Return a list of the first i intersection points
         * @param {Boolean} testSegment If true require that t1 and t2 are inside of the allowed bounds.
         * @returns {Array} List of the first i intersection points, given by the parameter t.
         * @private
         * @see JXG.Math.Geometry.meetCurveCurveNewton
         * @see JXG.Math.Geometry.meetCurveCurve
         */
        _meetCurveCurveIterative: function(c1, c2, range1, range2, i, testSegment) {
            var ret,
                t1,// t2,
                low1, low2, up1, up2,
                eps = Mat.eps * 100, // Minimum difference between zeros
                j1, j2,
                steps = 20,
                d1, d2,
                zeros = [];

            low1 = range1[0];
            up1 = range1[1];
            low2 = range2[0];
            up2 = range2[1];
            if (up1 < low1 || up2 < low2) {
                return [];
            }

            // console.log('DO iterative', [low1, up1], [low2, up2])

            d1 = (up1 - low1) / steps;
            d2 = (up2 - low2) / steps;
            for (j1 = 0; j1 < steps; j1++) {
                for (j2 = 0; j2 < steps; j2++) {

                    ret = this.meetCurveCurveNewton(c1, c2,
                        [low1 + j1 * d1, low1 + (j1 + 1) * d1],
                        [low2 + j2 * d2, low2 + (j2 + 1) * d2],
                        testSegment);

                    if (ret[3] < Mat.eps) {
                        t1 = ret[1];
                        // t2 = ret[2];
                        // console.log("\tFOUND", t1, t2, c1.Ft(t1)[2])
                        zeros = zeros.concat([t1]);
                        zeros = Type.toUniqueArrayFloat(zeros, eps);
                        // console.log(zeros, i)
                        if (zeros.length > i) {
                            return zeros;
                        }
                    }
                }
            }

            return zeros;
        },

        /**
         * Compute an intersection of the curves c1 and c2.
         * We want to find values t1, t2 such that
         * c1(t1) = c2(t2), i.e. (c1_x(t1) - c2_x(t2), c1_y(t1) - c2_y(t2)) = (0, 0).
         *
         * Available methods:
         * <ul>
         *  <li> discrete, segment-wise intersections
         *  <li> generalized damped Newton-Raphson
         * </ul>
         *
         * Segment-wise intersection is more stable, but has problems with tangent points.
         * Damped Newton-Raphson converges very rapidly but sometimes behaves chaotic.
         *
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Number|Function} nr the nr-th intersection point will be returned. For backwards compatibility:
         * if method='newton' and nr is not an integer, {@link JXG.Math.Numerics.generalizedNewton} is called
         * directly with nr as start value (not recommended).
         * @param {Number} t2ini not longer used. Must be supplied and is ignored.
         * @param {JXG.Board} [board=c1.board] Reference to a board object.
         * @param {String} [method] Intersection method, possible values are 'newton' and 'segment'.
         * If both curves are given by functions (assumed to be continuous), 'newton' is the default, otherwise
         * 'segment' is the default.
         * @returns {JXG.Coords} intersection point
         *
         * @see JXG.Math.Geometry.meetCurveCurveDiscrete
         * @see JXG.Math.Geometry._meetCurveCurveRecursive
         * @see JXG.Math.Geometry.meetCurveCurveIterative
         */
        meetCurveCurve: function (c1, c2, nr, t2ini, board, method, testSegment) {
            var co,
                zeros,
                mi1, ma1, mi2, ma2,
                i = Type.evaluate(nr);

            board = board || c1.board;
            if (method === 'segment' || Type.exists(c1.dataX) || Type.exists(c2.dataX)) {
                // Discrete data points, i.e. x-coordinates of c1 or c2 are given in an array)
                return this.meetCurveCurveDiscrete(c1, c2, i, board);
            }

            // Outdated:
            // Backwards compatibility if nr is not a positive integer then
            // generalizedNewton is still used.
            if (Type.exists(method) && method === 'newton' && i < 0 || parseInt(i) !== i) {
                co = Numerics.generalizedNewton(c1, c2, i, t2ini);
                return new Coords(Const.COORDS_BY_USER, co, board);
            }

            // Method 'newton'
            mi1 = c1.minX();
            ma1 = c1.maxX();
            mi2 = c2.minX();
            ma2 = c2.maxX();

            // console.time('curvecurve')
            zeros = this._meetCurveCurveIterative(c1, c2, [mi1, ma1], [mi2, ma2], i, testSegment);
            // console.timeEnd('curvecurve')

            if (zeros.length > i) {
                co = c1.Ft(zeros[i]);
            } else {
                return [0, NaN, NaN];
            }

            return new Coords(Const.COORDS_BY_USER, co, board);
        },

        /**
         * Intersection of curve with line,
         * Order of input does not matter for el1 and el2.
         * From version 0.99.7 on this method calls
         * {@link JXG.Math.Geometry.meetCurveLineDiscrete}.
         * If higher precision is needed, {@link JXG.Math.Geometry.meetCurveLineContinuous}
         * has to be used.
         *
         * @param {JXG.Curve|JXG.Line} el1 Curve or Line
         * @param {JXG.Curve|JXG.Line} el2 Curve or Line
         * @param {Number|Function} nr the nr-th intersection point will be returned.
         * @param {JXG.Board} [board=el1.board] Reference to a board object.
         * @param {Boolean} alwaysIntersect If false just the segment between the two defining points are tested for intersection
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,1,0] is returned.
         */
        meetCurveLine: function (el1, el2, nr, board, alwaysIntersect) {
            var v = [0, NaN, NaN],
                cu,
                li;

            if (!Type.exists(board)) {
                board = el1.board;
            }

            if (el1.elementClass === Const.OBJECT_CLASS_CURVE) {
                cu = el1;
                li = el2;
            } else {
                cu = el2;
                li = el1;
            }

            if (Type.exists(cu.dataX)) {
                // We use the discrete version if
                //   the curve is not a parametric curve, e.g. implicit plots
                v = this.meetCurveLineDiscrete(cu, li, nr, board, !alwaysIntersect);
            } else {
                v = this.meetCurveCurve(cu, li, nr, 0, board, 'newton', !alwaysIntersect);
            }

            return v;
        },

        /**
         * Intersection of line and curve, continuous case.
         * Finds the nr-th intersection point
         * Uses {@link JXG.Math.Geometry.meetCurveLineDiscrete} as a first approximation.
         * A more exact solution is then found with {@link JXG.Math.Numerics.root}.
         *
         * @param {JXG.Curve} cu Curve
         * @param {JXG.Line} li Line
         * @param {NumberFunction} nr Will return the nr-th intersection point.
         * @param {JXG.Board} board
         * @param {Boolean} testSegment Test if intersection has to be inside of the segment or somewhere on the
         * line defined by the segment
         * @returns {JXG.Coords} Coords object containing the intersection.
         */
        meetCurveLineContinuous: function (cu, li, nr, board, testSegment) {
            var func0, func1,
                t, v, x, y, z,
                eps = Mat.eps,
                epsLow = Mat.eps,
                steps,
                delta,
                tnew, tmin, fmin,
                i, ft;

            v = this.meetCurveLineDiscrete(cu, li, nr, board, testSegment);
            x = v.usrCoords[1];
            y = v.usrCoords[2];

            func0 = function (t) {
                var c1, c2;

                if (t > cu.maxX() || t < cu.minX()) {
                    return Infinity;
                }
                c1 = cu.X(t) - x;
                c2 = cu.Y(t) - y;
                return c1 * c1 + c2 * c2;
                // return c1 * (cu.X(t + h) - cu.X(t - h)) + c2 * (cu.Y(t + h) - cu.Y(t - h)) / h;
            };

            func1 = function (t) {
                var v = li.stdform[0] + li.stdform[1] * cu.X(t) + li.stdform[2] * cu.Y(t);
                return v * v;
            };

            // Find t
            steps = 50;
            delta = (cu.maxX() - cu.minX()) / steps;
            tnew = cu.minX();
            fmin = 0.0001; //eps;
            tmin = NaN;
            for (i = 0; i < steps; i++) {
                t = Numerics.root(func0, [
                    Math.max(tnew, cu.minX()),
                    Math.min(tnew + delta, cu.maxX())
                ]);
                ft = Math.abs(func0(t));
                if (ft <= fmin) {
                    fmin = ft;
                    tmin = t;
                    if (fmin < eps) {
                        break;
                    }
                }

                tnew += delta;
            }
            t = tmin;
            // Compute "exact" t
            t = Numerics.root(func1, [
                Math.max(t - delta, cu.minX()),
                Math.min(t + delta, cu.maxX())
            ]);

            ft = func1(t);
            // Is the point on the line?
            if (isNaN(ft) || Math.abs(ft) > epsLow) {
                z = 0.0; //NaN;
            } else {
                z = 1.0;
            }

            return new Coords(Const.COORDS_BY_USER, [z, cu.X(t), cu.Y(t)], board);
        },

        /**
         * Intersection of line and curve, discrete case.
         * Segments are treated as lines.
         * Finding the nr-th intersection point should work for all nr.
         * @param {JXG.Curve} cu
         * @param {JXG.Line} li
         * @param {Number|Function} nr
         * @param {JXG.Board} board
         * @param {Boolean} testSegment Test if intersection has to be inside of the segment or somewhere on the
         * line defined by the segment
         *
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,1,0] is returned.
         */
        meetCurveLineDiscrete: function (cu, li, nr, board, testSegment) {
            var i, j,
                n = Type.evaluate(nr),
                p1, p2,
                p, q,
                lip1 = li.point1.coords.usrCoords,
                lip2 = li.point2.coords.usrCoords,
                d, res,
                cnt = 0,
                len = cu.numberPoints,
                ev_sf = li.evalVisProp('straightfirst'),
                ev_sl = li.evalVisProp('straightlast');

            // In case, no intersection will be found we will take this
            q = new Coords(Const.COORDS_BY_USER, [0, NaN, NaN], board);

            if (lip1[0] === 0.0) {
                lip1 = [1, lip2[1] + li.stdform[2], lip2[2] - li.stdform[1]];
            } else if (lip2[0] === 0.0) {
                lip2 = [1, lip1[1] + li.stdform[2], lip1[2] - li.stdform[1]];
            }

            p2 = cu.points[0].usrCoords;
            for (i = 1; i < len; i += cu.bezierDegree) {
                p1 = p2.slice(0);
                p2 = cu.points[i].usrCoords;
                d = this.distance(p1, p2);

                // The defining points are not identical
                if (d > Mat.eps) {
                    if (cu.bezierDegree === 3) {
                        res = this.meetBeziersegmentBeziersegment(
                            [
                                cu.points[i - 1].usrCoords.slice(1),
                                cu.points[i].usrCoords.slice(1),
                                cu.points[i + 1].usrCoords.slice(1),
                                cu.points[i + 2].usrCoords.slice(1)
                            ],
                            [lip1.slice(1), lip2.slice(1)],
                            testSegment
                        );
                    } else {
                        res = [this.meetSegmentSegment(p1, p2, lip1, lip2)];
                    }

                    for (j = 0; j < res.length; j++) {
                        p = res[j];
                        if (0 <= p[1] && p[1] <= 1) {
                            if (cnt === n) {
                                /**
                                 * If the intersection point is not part of the segment,
                                 * this intersection point is set to non-existent.
                                 * This prevents jumping behavior of the intersection points.
                                 * But it may be discussed if it is the desired behavior.
                                 */
                                if (
                                    testSegment &&
                                    ((!ev_sf && p[2] < 0) || (!ev_sl && p[2] > 1))
                                ) {
                                    return q; // break;
                                }

                                q = new Coords(Const.COORDS_BY_USER, p[0], board);
                                return q; // break;
                            }
                            cnt += 1;
                        }
                    }
                }
            }

            return q;
        },

        /**
         * Find the n-th intersection point of two curves named red (first parameter) and blue (second parameter).
         * We go through each segment of the red curve and search if there is an intersection with a segment of the blue curve.
         * This double loop, i.e. the outer loop runs along the red curve and the inner loop runs along the blue curve, defines
         * the n-th intersection point. The segments are either line segments or Bezier curves of degree 3. This depends on
         * the property bezierDegree of the curves.
         * <p>
         * This method works also for transformed curves, since only the already
         * transformed points are used.
         *
         * @param {JXG.Curve} red
         * @param {JXG.Curve} blue
         * @param {Number|Function} nr
         */
        meetCurveRedBlueSegments: function (red, blue, nr) {
            var i,
                j,
                n = Type.evaluate(nr),
                red1,
                red2,
                blue1,
                blue2,
                m,
                minX,
                maxX,
                iFound = 0,
                lenBlue = blue.numberPoints,
                lenRed = red.numberPoints;

            if (lenBlue <= 1 || lenRed <= 1) {
                return [0, NaN, NaN];
            }

            for (i = 1; i < lenRed; i++) {
                red1 = red.points[i - 1].usrCoords;
                red2 = red.points[i].usrCoords;
                minX = Math.min(red1[1], red2[1]);
                maxX = Math.max(red1[1], red2[1]);

                blue2 = blue.points[0].usrCoords;
                for (j = 1; j < lenBlue; j++) {
                    blue1 = blue2;
                    blue2 = blue.points[j].usrCoords;
                    if (
                        Math.min(blue1[1], blue2[1]) < maxX &&
                        Math.max(blue1[1], blue2[1]) > minX
                    ) {
                        m = this.meetSegmentSegment(red1, red2, blue1, blue2);
                        if (
                            m[1] >= 0.0 && m[2] >= 0.0 &&
                            // The two segments meet in the interior or at the start points
                            ((m[1] < 1.0 && m[2] < 1.0) ||
                              // One of the curve is intersected in the very last point
                                (i === lenRed - 1 && m[1] === 1.0) ||
                                (j === lenBlue - 1 && m[2] === 1.0))
                        ) {
                            if (iFound === n) {
                                return m[0];
                            }

                            iFound++;
                        }
                    }
                }
            }

            return [0, NaN, NaN];
        },

        /**
         * (Virtual) Intersection of two segments.
         * @param {Array} p1 First point of segment 1 using normalized homogeneous coordinates [1,x,y]
         * @param {Array} p2 Second point or direction of segment 1 using normalized homogeneous coordinates [1,x,y] or point at infinity [0,x,y], respectively
         * @param {Array} q1 First point of segment 2 using normalized homogeneous coordinates [1,x,y]
         * @param {Array} q2 Second point or direction of segment 2 using normalized homogeneous coordinates [1,x,y] or point at infinity [0,x,y], respectively
         * @returns {Array} [Intersection point, t, u] The first entry contains the homogeneous coordinates
         * of the intersection point. The second and third entry give the position of the intersection with respect
         * to the definiting parameters. For example, the second entry t is defined by: intersection point = p1 + t * deltaP, where
         * deltaP = (p2 - p1) when both parameters are coordinates, and deltaP = p2 if p2 is a point at infinity.
         * If the two segments are collinear, [[0,0,0], Infinity, Infinity] is returned.
         **/
        meetSegmentSegment: function (p1, p2, q1, q2) {
            var t,
                u,
                i,
                d,
                li1 = Mat.crossProduct(p1, p2),
                li2 = Mat.crossProduct(q1, q2),
                c = Mat.crossProduct(li1, li2);

            if (Math.abs(c[0]) < Mat.eps) {
                return [c, Infinity, Infinity];
            }

            // Normalize the intersection coordinates
            c[1] /= c[0];
            c[2] /= c[0];
            c[0] /= c[0];

            // Now compute in principle:
            //    t = dist(c - p1) / dist(p2 - p1) and
            //    u = dist(c - q1) / dist(q2 - q1)
            // However: the points q1, q2, p1, p2 might be ideal points - or in general - the
            // coordinates might be not normalized.
            // Note that the z-coordinates of p2 and q2 are used to determine whether it should be interpreted
            // as a segment coordinate or a direction.
            i = Math.abs(p2[1] - p2[0] * p1[1]) < Mat.eps ? 2 : 1;
            d = p1[i] / p1[0];
            t = (c[i] - d) / (p2[0] !== 0 ? p2[i] / p2[0] - d : p2[i]);

            i = Math.abs(q2[1] - q2[0] * q1[1]) < Mat.eps ? 2 : 1;
            d = q1[i] / q1[0];
            u = (c[i] - d) / (q2[0] !== 0 ? q2[i] / q2[0] - d : q2[i]);

            return [c, t, u];
        },

        /**
         * Find the n-th intersection point of two pathes, usually given by polygons. Uses parts of the
         * Greiner-Hormann algorithm in JXG.Math.Clip.
         *
         * @param {JXG.Circle|JXG.Curve|JXG.Polygon} path1
         * @param {JXG.Circle|JXG.Curve|JXG.Polygon} path2
         * @param {Number|Function} n
         * @param {JXG.Board} board
         *
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,0,0] is returned.
         *
         */
        meetPathPath: function (path1, path2, nr, board) {
            var S, C, len, intersections,
                n = Type.evaluate(nr);

            S = JXG.Math.Clip._getPath(path1, board);
            len = S.length;
            if (
                len > 0 &&
                this.distance(S[0].coords.usrCoords, S[len - 1].coords.usrCoords, 3) < Mat.eps
            ) {
                S.pop();
            }

            C = JXG.Math.Clip._getPath(path2, board);
            len = C.length;
            if (
                len > 0 &&
                this.distance(C[0].coords.usrCoords, C[len - 1].coords.usrCoords, 3) <
                Mat.eps * Mat.eps
            ) {
                C.pop();
            }

            // Handle cases where at least one of the paths is empty
            if (nr < 0 || JXG.Math.Clip.isEmptyCase(S, C, 'intersection')) {
                return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
            }

            JXG.Math.Clip.makeDoublyLinkedList(S);
            JXG.Math.Clip.makeDoublyLinkedList(C);

            intersections = JXG.Math.Clip.findIntersections(S, C, board)[0];
            if (n < intersections.length) {
                return intersections[n].coords;
            }
            return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
        },

        /**
         * Find the n-th intersection point between a polygon and a line.
         * @param {JXG.Polygon} path
         * @param {JXG.Line} line
         * @param {Number|Function} nr
         * @param {JXG.Board} board
         * @param {Boolean} alwaysIntersect If false just the segment between the two defining points of the line are tested for intersection.
         *
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,0,0] is returned.
         */
        meetPolygonLine: function (path, line, nr, board, alwaysIntersect) {
            var i,
                n = Type.evaluate(nr),
                res,
                border,
                crds = [0, 0, 0],
                len = path.borders.length,
                intersections = [];

            for (i = 0; i < len; i++) {
                border = path.borders[i];
                res = this.meetSegmentSegment(
                    border.point1.coords.usrCoords,
                    border.point2.coords.usrCoords,
                    line.point1.coords.usrCoords,
                    line.point2.coords.usrCoords
                );

                if (
                    (!alwaysIntersect || (res[2] >= 0 && res[2] < 1)) &&
                    res[1] >= 0 &&
                    res[1] < 1
                ) {
                    intersections.push(res[0]);
                }
            }

            if (n >= 0 && n < intersections.length) {
                crds = intersections[n];
            }
            return new Coords(Const.COORDS_BY_USER, crds, board);
        },

        /****************************************/
        /****   BEZIER CURVE ALGORITHMS      ****/
        /****************************************/

        /**
         * Splits a Bezier curve segment defined by four points into
         * two Bezier curve segments. Dissection point is t=1/2.
         * @param {Array} curve Array of four coordinate arrays of length 2 defining a
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @returns {Array} Array consisting of two coordinate arrays for Bezier curves.
         */
        _bezierSplit: function (curve) {
            var p0, p1, p2, p00, p22, p000;

            p0 = [(curve[0][0] + curve[1][0]) * 0.5, (curve[0][1] + curve[1][1]) * 0.5];
            p1 = [(curve[1][0] + curve[2][0]) * 0.5, (curve[1][1] + curve[2][1]) * 0.5];
            p2 = [(curve[2][0] + curve[3][0]) * 0.5, (curve[2][1] + curve[3][1]) * 0.5];

            p00 = [(p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5];
            p22 = [(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5];

            p000 = [(p00[0] + p22[0]) * 0.5, (p00[1] + p22[1]) * 0.5];

            return [
                [curve[0], p0, p00, p000],
                [p000, p22, p2, curve[3]]
            ];
        },

        /**
         * Computes the bounding box [minX, maxY, maxX, minY] of a Bezier curve segment
         * from its control points.
         * @param {Array} curve Array of four coordinate arrays of length 2 defining a
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @returns {Array} Bounding box [minX, maxY, maxX, minY]
         */
        _bezierBbox: function (curve) {
            var bb = [];

            if (curve.length === 4) {
                // bezierDegree == 3
                bb[0] = Math.min(curve[0][0], curve[1][0], curve[2][0], curve[3][0]); // minX
                bb[1] = Math.max(curve[0][1], curve[1][1], curve[2][1], curve[3][1]); // maxY
                bb[2] = Math.max(curve[0][0], curve[1][0], curve[2][0], curve[3][0]); // maxX
                bb[3] = Math.min(curve[0][1], curve[1][1], curve[2][1], curve[3][1]); // minY
            } else {
                // bezierDegree == 1
                bb[0] = Math.min(curve[0][0], curve[1][0]); // minX
                bb[1] = Math.max(curve[0][1], curve[1][1]); // maxY
                bb[2] = Math.max(curve[0][0], curve[1][0]); // maxX
                bb[3] = Math.min(curve[0][1], curve[1][1]); // minY
            }

            return bb;
        },

        /**
         * Decide if two Bezier curve segments overlap by comparing their bounding boxes.
         * @param {Array} bb1 Bounding box of the first Bezier curve segment
         * @param {Array} bb2 Bounding box of the second Bezier curve segment
         * @returns {Boolean} true if the bounding boxes overlap, false otherwise.
         */
        _bezierOverlap: function (bb1, bb2) {
            return bb1[2] >= bb2[0] && bb1[0] <= bb2[2] && bb1[1] >= bb2[3] && bb1[3] <= bb2[1];
        },

        /**
         * Append list of intersection points to a list.
         * @private
         */
        _bezierListConcat: function (L, Lnew, t1, t2) {
            var i,
                t2exists = Type.exists(t2),
                start = 0,
                len = Lnew.length,
                le = L.length;

            if (
                le > 0 &&
                len > 0 &&
                ((L[le - 1][1] === 1 && Lnew[0][1] === 0) ||
                    (t2exists && L[le - 1][2] === 1 && Lnew[0][2] === 0))
            ) {
                start = 1;
            }

            for (i = start; i < len; i++) {
                if (t2exists) {
                    Lnew[i][2] *= 0.5;
                    Lnew[i][2] += t2;
                }

                Lnew[i][1] *= 0.5;
                Lnew[i][1] += t1;

                L.push(Lnew[i]);
            }
        },

        /**
         * Find intersections of two Bezier curve segments by recursive subdivision.
         * Below maxlevel determine intersections by intersection line segments.
         * @param {Array} red Array of four coordinate arrays of length 2 defining the first
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @param {Array} blue Array of four coordinate arrays of length 2 defining the second
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @param {Number} level Recursion level
         * @returns {Array} List of intersection points (up to nine). Each intersection point is an
         * array of length three (homogeneous coordinates) plus preimages.
         */
        _bezierMeetSubdivision: function (red, blue, level) {
            var bbb,
                bbr,
                ar,
                b0,
                b1,
                r0,
                r1,
                m,
                p0,
                p1,
                q0,
                q1,
                L = [],
                maxLev = 5; // Maximum recursion level

            bbr = this._bezierBbox(blue);
            bbb = this._bezierBbox(red);

            if (!this._bezierOverlap(bbr, bbb)) {
                return [];
            }

            if (level < maxLev) {
                ar = this._bezierSplit(red);
                r0 = ar[0];
                r1 = ar[1];

                ar = this._bezierSplit(blue);
                b0 = ar[0];
                b1 = ar[1];

                this._bezierListConcat(
                    L,
                    this._bezierMeetSubdivision(r0, b0, level + 1),
                    0.0,
                    0.0
                );
                this._bezierListConcat(
                    L,
                    this._bezierMeetSubdivision(r0, b1, level + 1),
                    0,
                    0.5
                );
                this._bezierListConcat(
                    L,
                    this._bezierMeetSubdivision(r1, b0, level + 1),
                    0.5,
                    0.0
                );
                this._bezierListConcat(
                    L,
                    this._bezierMeetSubdivision(r1, b1, level + 1),
                    0.5,
                    0.5
                );

                return L;
            }

            // Make homogeneous coordinates
            q0 = [1].concat(red[0]);
            q1 = [1].concat(red[3]);
            p0 = [1].concat(blue[0]);
            p1 = [1].concat(blue[3]);

            m = this.meetSegmentSegment(q0, q1, p0, p1);

            if (m[1] >= 0.0 && m[2] >= 0.0 && m[1] <= 1.0 && m[2] <= 1.0) {
                return [m];
            }

            return [];
        },

        /**
         * @param {Boolean} testSegment Test if intersection has to be inside of the segment or somewhere on the line defined by the segment
         */
        _bezierLineMeetSubdivision: function (red, blue, level, testSegment) {
            var bbb, bbr, ar,
                r0, r1,
                m,
                p0, p1, q0, q1,
                L = [],
                maxLev = 5; // Maximum recursion level

            bbb = this._bezierBbox(blue);
            bbr = this._bezierBbox(red);

            if (testSegment && !this._bezierOverlap(bbr, bbb)) {
                return [];
            }

            if (level < maxLev) {
                ar = this._bezierSplit(red);
                r0 = ar[0];
                r1 = ar[1];

                this._bezierListConcat(
                    L,
                    this._bezierLineMeetSubdivision(r0, blue, level + 1),
                    0.0
                );
                this._bezierListConcat(
                    L,
                    this._bezierLineMeetSubdivision(r1, blue, level + 1),
                    0.5
                );

                return L;
            }

            // Make homogeneous coordinates
            q0 = [1].concat(red[0]);
            q1 = [1].concat(red[3]);
            p0 = [1].concat(blue[0]);
            p1 = [1].concat(blue[1]);

            m = this.meetSegmentSegment(q0, q1, p0, p1);

            if (m[1] >= 0.0 && m[1] <= 1.0) {
                if (!testSegment || (m[2] >= 0.0 && m[2] <= 1.0)) {
                    return [m];
                }
            }

            return [];
        },

        /**
         * Find the nr-th intersection point of two Bezier curve segments.
         * @param {Array} red Array of four coordinate arrays of length 2 defining the first
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @param {Array} blue Array of four coordinate arrays of length 2 defining the second
         * Bezier curve segment, i.e. [[x0,y0], [x1,y1], [x2,y2], [x3,y3]].
         * @param {Boolean} testSegment Test if intersection has to be inside of the segment or somewhere on the line defined by the segment
         * @returns {Array} Array containing the list of all intersection points as homogeneous coordinate arrays plus
         * preimages [x,y], t_1, t_2] of the two Bezier curve segments.
         *
         */
        meetBeziersegmentBeziersegment: function (red, blue, testSegment) {
            var L, L2, i;

            if (red.length === 4 && blue.length === 4) {
                L = this._bezierMeetSubdivision(red, blue, 0);
            } else {
                L = this._bezierLineMeetSubdivision(red, blue, 0, testSegment);
            }

            L.sort(function (a, b) {
                return (a[1] - b[1]) * 10000000.0 + (a[2] - b[2]);
            });

            L2 = [];
            for (i = 0; i < L.length; i++) {
                // Only push entries different from their predecessor
                if (i === 0 || L[i][1] !== L[i - 1][1] || L[i][2] !== L[i - 1][2]) {
                    L2.push(L[i]);
                }
            }
            return L2;
        },

        /**
         * Find the nr-th intersection point of two Bezier curves, i.e. curves with bezierDegree == 3.
         * @param {JXG.Curve} red Curve with bezierDegree == 3
         * @param {JXG.Curve} blue Curve with bezierDegree == 3
         * @param {Number|Function} nr The number of the intersection point which should be returned.
         * @returns {Array} The homogeneous coordinates of the nr-th intersection point.
         */
        meetBezierCurveRedBlueSegments: function (red, blue, nr) {
            var p, i, j, k,
                n = Type.evaluate(nr),
                po, tmp,
                redArr,
                blueArr,
                bbr,
                bbb,
                intersections,
                startRed = 0,
                startBlue = 0,
                lenBlue, lenRed,
                L = [];

            if (blue.numberPoints < blue.bezierDegree + 1 || red.numberPoints < red.bezierDegree + 1) {
                return [0, NaN, NaN];
            }
            if (red.bezierDegree === 1 && blue.bezierDegree === 3) {
                tmp = red;
                red = blue;
                blue = tmp;
            }

            lenBlue = blue.numberPoints - blue.bezierDegree;
            lenRed = red.numberPoints - red.bezierDegree;

            // For sectors, we ignore the "legs"
            if (red.type === Const.OBJECT_TYPE_SECTOR) {
                startRed = 3;
                lenRed -= 3;
            }
            if (blue.type === Const.OBJECT_TYPE_SECTOR) {
                startBlue = 3;
                lenBlue -= 3;
            }

            for (i = startRed; i < lenRed; i += red.bezierDegree) {
                p = red.points;
                redArr = [p[i].usrCoords.slice(1), p[i + 1].usrCoords.slice(1)];
                if (red.bezierDegree === 3) {
                    redArr[2] = p[i + 2].usrCoords.slice(1);
                    redArr[3] = p[i + 3].usrCoords.slice(1);
                }

                bbr = this._bezierBbox(redArr);

                for (j = startBlue; j < lenBlue; j += blue.bezierDegree) {
                    p = blue.points;
                    blueArr = [p[j].usrCoords.slice(1), p[j + 1].usrCoords.slice(1)];
                    if (blue.bezierDegree === 3) {
                        blueArr[2] = p[j + 2].usrCoords.slice(1);
                        blueArr[3] = p[j + 3].usrCoords.slice(1);
                    }

                    bbb = this._bezierBbox(blueArr);
                    if (this._bezierOverlap(bbr, bbb)) {
                        intersections = this.meetBeziersegmentBeziersegment(redArr, blueArr);
                        if (intersections.length === 0) {
                            continue;
                        }
                        for (k = 0; k < intersections.length; k++) {
                            po = intersections[k];
                            if (
                                po[1] < -Mat.eps ||
                                po[1] > 1 + Mat.eps ||
                                po[2] < -Mat.eps ||
                                po[2] > 1 + Mat.eps
                            ) {
                                continue;
                            }
                            L.push(po);
                        }
                        if (L.length > n) {
                            return L[n][0];
                        }
                    }
                }
            }
            if (L.length > n) {
                return L[n][0];
            }

            return [0, NaN, NaN];
        },

        bezierSegmentEval: function (t, curve) {
            var f,
                x,
                y,
                t1 = 1.0 - t;

            x = 0;
            y = 0;

            f = t1 * t1 * t1;
            x += f * curve[0][0];
            y += f * curve[0][1];

            f = 3.0 * t * t1 * t1;
            x += f * curve[1][0];
            y += f * curve[1][1];

            f = 3.0 * t * t * t1;
            x += f * curve[2][0];
            y += f * curve[2][1];

            f = t * t * t;
            x += f * curve[3][0];
            y += f * curve[3][1];

            return [1.0, x, y];
        },

        /**
         * Generate the defining points of a 3rd degree bezier curve that approximates
         * a circle sector defined by three coordinate points A, B, C, each defined by an array of length three.
         * The coordinate arrays are given in homogeneous coordinates.
         * @param {Array} A First point
         * @param {Array} B Second point (intersection point)
         * @param {Array} C Third point
         * @param {Boolean} withLegs Flag. If true the legs to the intersection point are part of the curve.
         * @param {Number} sgn Wither 1 or -1. Needed for minor and major arcs. In case of doubt, use 1.
         */
        bezierArc: function (A, B, C, withLegs, sgn) {
            var p1, p2, p3, p4,
                r,
                phi, beta, delta,
                // PI2 = Math.PI * 0.5,
                x = B[1],
                y = B[2],
                z = B[0],
                dataX = [],
                dataY = [],
                co, si,
                ax, ay,
                bx, by,
                k, v, d,
                matrix;

            r = this.distance(B, A);

            // x,y, z is intersection point. Normalize it.
            x /= z;
            y /= z;

            phi = this.rad(A.slice(1), B.slice(1), C.slice(1));
            if (sgn === -1) {
                phi = 2 * Math.PI - phi;
            }

            // Always divide the arc into four Bezier arcs.
            // Otherwise, the position of gliders on this arc
            // will be wrong.
            delta = phi / 4;


            p1 = A;
            p1[1] /= p1[0];
            p1[2] /= p1[0];
            p1[0] /= p1[0];

            p4 = p1.slice(0);

            if (withLegs) {
                dataX = [x, x + 0.333 * (p1[1] - x), x + 0.666 * (p1[1] - x), p1[1]];
                dataY = [y, y + 0.333 * (p1[2] - y), y + 0.666 * (p1[2] - y), p1[2]];
            } else {
                dataX = [p1[1]];
                dataY = [p1[2]];
            }

            while (phi > Mat.eps) {
                // if (phi > PI2) {
                //     beta = PI2;
                //     phi -= PI2;
                // } else {
                //     beta = phi;
                //     phi = 0;
                // }
                if (phi > delta) {
                    beta = delta;
                    phi -= delta;
                } else {
                    beta = phi;
                    phi = 0;
                }

                co = Math.cos(sgn * beta);
                si = Math.sin(sgn * beta);

                matrix = [
                    [1, 0, 0],
                    [x * (1 - co) + y * si, co, -si],
                    [y * (1 - co) - x * si, si, co]
                ];
                v = Mat.matVecMult(matrix, p1);
                p4 = [v[0] / v[0], v[1] / v[0], v[2] / v[0]];

                ax = p1[1] - x;
                ay = p1[2] - y;
                bx = p4[1] - x;
                by = p4[2] - y;
                d = Mat.hypot(ax + bx, ay + by);

                if (Math.abs(by - ay) > Mat.eps) {
                    k = ((((ax + bx) * (r / d - 0.5)) / (by - ay)) * 8) / 3;
                } else {
                    k = ((((ay + by) * (r / d - 0.5)) / (ax - bx)) * 8) / 3;
                }

                p2 = [1, p1[1] - k * ay, p1[2] + k * ax];
                p3 = [1, p4[1] + k * by, p4[2] - k * bx];

                Type.concat(dataX, [p2[1], p3[1], p4[1]]);
                Type.concat(dataY, [p2[2], p3[2], p4[2]]);
                p1 = p4.slice(0);
            }

            if (withLegs) {
                Type.concat(dataX, [
                    p4[1] + 0.333 * (x - p4[1]),
                    p4[1] + 0.666 * (x - p4[1]),
                    x
                ]);
                Type.concat(dataY, [
                    p4[2] + 0.333 * (y - p4[2]),
                    p4[2] + 0.666 * (y - p4[2]),
                    y
                ]);
            }

            return [dataX, dataY];
        },

        /****************************************/
        /****           PROJECTIONS          ****/
        /****************************************/

        /**
         * Calculates the coordinates of the projection of a given point on a given circle. I.o.w. the
         * nearest one of the two intersection points of the line through the given point and the circles
         * center.
         * @param {JXG.Point|JXG.Coords} point Point to project or coords object to project.
         * @param {JXG.Circle} circle Circle on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to the board
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given circle.
         */
        projectPointToCircle: function (point, circle, board) {
            var dist,
                P,
                x,
                y,
                factor,
                M = circle.center.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point.board;
            }

            // gave us a point
            if (Type.isPoint(point)) {
                dist = point.coords.distance(Const.COORDS_BY_USER, circle.center.coords);
                P = point.coords.usrCoords;
                // gave us coords
            } else {
                dist = point.distance(Const.COORDS_BY_USER, circle.center.coords);
                P = point.usrCoords;
            }

            if (Math.abs(dist) < Mat.eps) {
                dist = Mat.eps;
            }

            factor = circle.Radius() / dist;
            x = M[1] + factor * (P[1] - M[1]);
            y = M[2] + factor * (P[2] - M[2]);

            return new Coords(Const.COORDS_BY_USER, [x, y], board);
        },

        /**
         * Calculates the coordinates of the orthogonal projection of a given point on a given line. I.o.w. the
         * intersection point of the given line and its perpendicular through the given point.
         * @param {JXG.Point|JXG.Coords} point Point to project.
         * @param {JXG.Line} line Line on that the point is projected.
         * @param {JXG.Board} [board=point.board|board=line.board] Reference to a board.
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given line.
         */
        projectPointToLine: function (point, line, board) {
            var v = [0, line.stdform[1], line.stdform[2]],
                coords;

            if (!Type.exists(board)) {
                if (Type.exists(point.coords)) {
                    board = point.board;
                } else {
                    board = line.board;
                }
            }

            if (Type.exists(point.coords)) {
                coords = point.coords.usrCoords;
            } else {
                coords = point.usrCoords;
            }

            v = Mat.crossProduct(v, coords);
            return new Coords(Const.COORDS_BY_USER, Mat.crossProduct(v, line.stdform), board);
        },

        /**
         * Calculates the coordinates of the orthogonal projection of a given coordinate array on a given line
         * segment defined by two coordinate arrays.
         * @param {Array} p Point to project.
         * @param {Array} q1 Start point of the line segment on that the point is projected.
         * @param {Array} q2 End point of the line segment on that the point is projected.
         * @returns {Array} The coordinates of the projection of the given point on the given segment
         * and the factor that determines the projected point as a convex combination of the
         * two endpoints q1 and q2 of the segment.
         */
        projectCoordsToSegment: function (p, q1, q2) {
            var t,
                denom,
                s = [q2[1] - q1[1], q2[2] - q1[2]],
                v = [p[1] - q1[1], p[2] - q1[2]];

            /**
             * If the segment has length 0, i.e. is a point,
             * the projection is equal to that point.
             */
            if (Math.abs(s[0]) < Mat.eps && Math.abs(s[1]) < Mat.eps) {
                return [q1, 0];
            }

            t = Mat.innerProduct(v, s);
            denom = Mat.innerProduct(s, s);
            t /= denom;

            return [[1, t * s[0] + q1[1], t * s[1] + q1[2]], t];
        },

        /**
         * Finds the coordinates of the closest point on a Bezier segment of a
         * {@link JXG.Curve} to a given coordinate array.
         * @param {Array} pos Point to project in homogeneous coordinates.
         * @param {JXG.Curve} curve Curve of type "plot" having Bezier degree 3.
         * @param {Number} start Number of the Bezier segment of the curve.
         * @returns {Array} The coordinates of the projection of the given point
         * on the given Bezier segment and the preimage of the curve which
         * determines the closest point.
         */
        projectCoordsToBeziersegment: function (pos, curve, start) {
            var t0,
                /** @ignore */
                minfunc = function (t) {
                    var z = [1, curve.X(start + t), curve.Y(start + t)];

                    z[1] -= pos[1];
                    z[2] -= pos[2];

                    return z[1] * z[1] + z[2] * z[2];
                };

            t0 = JXG.Math.Numerics.fminbr(minfunc, [0.0, 1.0]);

            return [[1, curve.X(t0 + start), curve.Y(t0 + start)], t0];
        },

        /**
         * Calculates the coordinates of the projection of a given point on a given curve.
         * Uses {@link JXG.Math.Geometry.projectCoordsToCurve}.
         *
         * @param {JXG.Point} point Point to project.
         * @param {JXG.Curve} curve Curve on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to a board.
         * @see JXG.Math.Geometry.projectCoordsToCurve
         * @returns {Array} [JXG.Coords, position] The coordinates of the projection of the given
         * point on the given graph and the relative position on the curve (real number).
         */
        projectPointToCurve: function (point, curve, board) {
            if (!Type.exists(board)) {
                board = point.board;
            }

            var x = point.X(),
                y = point.Y(),
                t = point.position,
                result;

            if (!Type.exists(t)) {
                t = curve.evalVisProp('curvetype') === 'functiongraph' ? x : 0.0;
            }
            result = this.projectCoordsToCurve(x, y, t, curve, board);
            // point.position = result[1];

            return result;
        },

        /**
         * Calculates the coordinates of the projection of a coordinates pair on a given curve. In case of
         * function graphs this is the
         * intersection point of the curve and the parallel to y-axis through the given point.
         * @param {Number} x coordinate to project.
         * @param {Number} y coordinate to project.
         * @param {Number} t start value for newtons method
         * @param {JXG.Curve} curve Curve on that the point is projected.
         * @param {JXG.Board} [board=curve.board] Reference to a board.
         * @see JXG.Math.Geometry.projectPointToCurve
         * @returns {JXG.Coords} Array containing the coordinates of the projection of the given point on the given curve and
         * the position on the curve.
         */
        projectCoordsToCurve: function (x, y, t, curve, board) {
            var newCoords, newCoordsObj,
                i, j, mindist, dist, lbda,
                v, coords, d, p1, p2, res, minfunc,
                t_new, f_new, f_old, dy,
                delta, delta1, delta2, steps,
                minX, maxX, minX_glob, maxX_glob,
                infty = Number.POSITIVE_INFINITY;

            if (!Type.exists(board)) {
                board = curve.board;
            }

            if (curve.evalVisProp('curvetype') === 'plot') {
                t = 0;
                mindist = infty;
                if (curve.numberPoints === 0) {
                    newCoords = [0, 1, 1];
                } else {
                    newCoords = [curve.Z(0), curve.X(0), curve.Y(0)];
                }

                if (curve.numberPoints > 1) {
                    v = [1, x, y];
                    if (curve.bezierDegree === 3) {
                        j = 0;
                    } else {
                        p1 = [curve.Z(0), curve.X(0), curve.Y(0)];
                    }
                    for (i = 0; i < curve.numberPoints - 1; i++) {
                        if (curve.bezierDegree === 3) {
                            res = this.projectCoordsToBeziersegment(v, curve, j);
                        } else {
                            p2 = [curve.Z(i + 1), curve.X(i + 1), curve.Y(i + 1)];
                            res = this.projectCoordsToSegment(v, p1, p2);
                        }
                        lbda = res[1];
                        coords = res[0];

                        if (0.0 <= lbda && lbda <= 1.0) {
                            dist = this.distance(coords, v);
                            d = i + lbda;
                        } else if (lbda < 0.0) {
                            coords = p1;
                            dist = this.distance(p1, v);
                            d = i;
                        } else if (lbda > 1.0 && i === curve.numberPoints - 2) {
                            coords = p2;
                            dist = this.distance(coords, v);
                            d = curve.numberPoints - 1;
                        }

                        if (dist < mindist) {
                            mindist = dist;
                            t = d;
                            newCoords = coords;
                        }

                        if (curve.bezierDegree === 3) {
                            j++;
                            i += 2;
                        } else {
                            p1 = p2;
                        }
                    }
                }

                newCoordsObj = new Coords(Const.COORDS_BY_USER, newCoords, board);
            } else {
                // 'parameter', 'polar', 'functiongraph'

                minX_glob = curve.minX();
                maxX_glob = curve.maxX();
                minX = minX_glob;
                maxX = maxX_glob;

                if (curve.evalVisProp('curvetype') === 'functiongraph') {
                    // Restrict the possible position of t
                    // to the projection of a circle to the x-axis (= t-axis)
                    dy = Math.abs(y - curve.Y(x));
                    if (!isNaN(dy)) {
                        minX = x - dy;
                        maxX = x + dy;
                    }
                }

                /**
                 * @ignore
                 * Find t such that the Euclidean distance between
                 * [x, y] and [curve.X(t), curve.Y(t)]
                 * is minimized.
                 */
                minfunc = function (t) {
                    var dx, dy;

                    if (t < minX_glob || t > curve.maxX_glob) {
                        return Infinity;
                    }
                    dx = x - curve.X(t);
                    dy = y - curve.Y(t);
                    return dx * dx + dy * dy;
                };

                // Search t which minimizes minfunc(t)
                // in discrete steps
                f_old = minfunc(t);
                steps = 50;
                delta = (maxX - minX) / steps;
                t_new = minX;
                for (i = 0; i < steps; i++) {
                    f_new = minfunc(t_new);

                    if (f_new < f_old || f_old === Infinity || isNaN(f_old)) {
                        t = t_new;
                        f_old = f_new;
                    }

                    t_new += delta;
                }

                // t = Numerics.root(Numerics.D(minfunc), t);

                // Ensure that minfunc is defined on the
                // enclosing interval [t-delta1, t+delta2]
                delta1 = delta;
                for (i = 0; i < 20 && isNaN(minfunc(t - delta1)); i++, delta1 *= 0.5);
                if (isNaN(minfunc(t - delta1))) {
                    delta1 = 0.0;
                }
                delta2 = delta;
                for (i = 0; i < 20 && isNaN(minfunc(t + delta2)); i++, delta2 *= 0.5);
                if (isNaN(minfunc(t + delta2))) {
                    delta2 = 0.0;
                }

                // Finally, apply mathemetical optimization in the determined interval
                t = Numerics.fminbr(minfunc, [
                    Math.max(t - delta1, minX),
                    Math.min(t + delta2, maxX)
                ]);

                // Distinction between closed and open curves is not necessary.
                // If closed, the cyclic projection shift will work anyhow
                // if (Math.abs(curve.X(minX) - curve.X(maxX)) < Mat.eps &&
                //     Math.abs(curve.Y(minX) - curve.Y(maxX)) < Mat.eps) {
                //     // Cyclically
                //     if (t < minX) {console.log(t)
                //         t = maxX + t - minX;
                //     }
                //     if (t > maxX) {
                //         t = minX + t - maxX;
                //     }
                // } else {

                t = t < minX_glob ? minX_glob : t;
                t = t > maxX_glob ? maxX_glob : t;
                // }

                newCoordsObj = new Coords(
                    Const.COORDS_BY_USER,
                    [curve.X(t), curve.Y(t)],
                    board
                );
            }

            return [curve.updateTransform(newCoordsObj), t];
        },

        /**
         * Calculates the coordinates of the closest orthogonal projection of a given coordinate array onto the
         * border of a polygon.
         * @param {Array} p Point to project.
         * @param {JXG.Polygon} pol Polygon element
         * @returns {Array} The coordinates of the closest projection of the given point to the border of the polygon.
         */
        projectCoordsToPolygon: function (p, pol) {
            var i,
                len = pol.vertices.length,
                d_best = Infinity,
                d,
                projection,
                proj,
                bestprojection;

            for (i = 0; i < len - 1; i++) {
                projection = JXG.Math.Geometry.projectCoordsToSegment(
                    p,
                    pol.vertices[i].coords.usrCoords,
                    pol.vertices[i + 1].coords.usrCoords
                );

                if (0 <= projection[1] && projection[1] <= 1) {
                    d = JXG.Math.Geometry.distance(projection[0], p, 3);
                    proj = projection[0];
                } else if (projection[1] < 0) {
                    d = JXG.Math.Geometry.distance(pol.vertices[i].coords.usrCoords, p, 3);
                    proj = pol.vertices[i].coords.usrCoords;
                } else {
                    d = JXG.Math.Geometry.distance(pol.vertices[i + 1].coords.usrCoords, p, 3);
                    proj = pol.vertices[i + 1].coords.usrCoords;
                }
                if (d < d_best) {
                    bestprojection = proj.slice(0);
                    d_best = d;
                }
            }
            return bestprojection;
        },

        /**
         * Calculates the coordinates of the projection of a given point on a given turtle. A turtle consists of
         * one or more curves of curveType 'plot'. Uses {@link JXG.Math.Geometry.projectPointToCurve}.
         * @param {JXG.Point} point Point to project.
         * @param {JXG.Turtle} turtle on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to a board.
         * @returns {Array} [JXG.Coords, position] Array containing the coordinates of the projection of the given point on the turtle and
         * the position on the turtle.
         */
        projectPointToTurtle: function (point, turtle, board) {
            var newCoords,
                t,
                x,
                y,
                i,
                dist,
                el,
                minEl,
                res,
                newPos,
                np = 0,
                npmin = 0,
                mindist = Number.POSITIVE_INFINITY,
                len = turtle.objects.length;

            if (!Type.exists(board)) {
                board = point.board;
            }

            // run through all curves of this turtle
            for (i = 0; i < len; i++) {
                el = turtle.objects[i];

                if (el.elementClass === Const.OBJECT_CLASS_CURVE) {
                    res = this.projectPointToCurve(point, el);
                    newCoords = res[0];
                    newPos = res[1];
                    dist = this.distance(newCoords.usrCoords, point.coords.usrCoords);

                    if (dist < mindist) {
                        x = newCoords.usrCoords[1];
                        y = newCoords.usrCoords[2];
                        t = newPos;
                        mindist = dist;
                        minEl = el;
                        npmin = np;
                    }
                    np += el.numberPoints;
                }
            }

            newCoords = new Coords(Const.COORDS_BY_USER, [x, y], board);
            // point.position = t + npmin;
            // return minEl.updateTransform(newCoords);
            return [minEl.updateTransform(newCoords), t + npmin];
        },

        /**
         * Trivial projection of a point to another point.
         * @param {JXG.Point} point Point to project (not used).
         * @param {JXG.Point} dest Point on that the point is projected.
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given circle.
         */
        projectPointToPoint: function (point, dest) {
            return dest.coords;
        },

        /**
         *
         * @param {JXG.Point|JXG.Coords} point
         * @param {JXG.Board} [board]
         */
        projectPointToBoard: function (point, board) {
            var i,
                l,
                c,
                brd = board || point.board,
                // comparison factor, point coord idx, bbox idx, 1st bbox corner x & y idx, 2nd bbox corner x & y idx
                config = [
                    // left
                    [1, 1, 0, 0, 3, 0, 1],
                    // top
                    [-1, 2, 1, 0, 1, 2, 1],
                    // right
                    [-1, 1, 2, 2, 1, 2, 3],
                    // bottom
                    [1, 2, 3, 0, 3, 2, 3]
                ],
                coords = point.coords || point,
                bbox = brd.getBoundingBox();

            for (i = 0; i < 4; i++) {
                c = config[i];
                if (c[0] * coords.usrCoords[c[1]] < c[0] * bbox[c[2]]) {
                    // define border
                    l = Mat.crossProduct(
                        [1, bbox[c[3]], bbox[c[4]]],
                        [1, bbox[c[5]], bbox[c[6]]]
                    );
                    l[3] = 0;
                    l = Mat.normalize(l);

                    // project point
                    coords = this.projectPointToLine({ coords: coords }, { stdform: l }, brd);
                }
            }

            return coords;
        },

        /**
         * Calculates the distance of a point to a line. The point and the line are given by homogeneous
         * coordinates. For lines this can be line.stdform.
         * @param {Array} point Homogeneous coordinates of a point.
         * @param {Array} line Homogeneous coordinates of a line ([C,A,B] where A*x+B*y+C*z=0).
         * @returns {Number} Distance of the point to the line.
         */
        distPointLine: function (point, line) {
            var a = line[1],
                b = line[2],
                c = line[0],
                nom;

            if (Math.abs(a) + Math.abs(b) < Mat.eps) {
                return Number.POSITIVE_INFINITY;
            }

            nom = a * point[1] + b * point[2] + c;
            a *= a;
            b *= b;

            return Math.abs(nom) / Math.sqrt(a + b);
        },

        /**
         * Determine the (Euclidean) distance between a point q and a line segment
         * defined by two points p1 and p2. In case p1 equals p2, the distance to this
         * point is returned.
         *
         * @param {Array} q Homogeneous coordinates of q
         * @param {Array} p1 Homogeneous coordinates of p1
         * @param {Array} p2 Homogeneous coordinates of p2
         * @returns {Number} Distance of q to line segment [p1, p2]
         */
        distPointSegment: function (q, p1, p2) {
            var x, y, dx, dy,
                den, lbda,
                eps = Mat.eps * Mat.eps,
                huge = 1000000;

            // Difference q - p1
            x = q[1] - p1[1];
            y = q[2] - p1[2];
            x = (x === Infinity) ? huge : (x === -Infinity) ? -huge : x;
            y = (y === Infinity) ? huge : (y === -Infinity) ? -huge : y;

            // Difference p2 - p1
            dx = p2[1] - p1[1];
            dy = p2[2] - p1[2];
            dx = (dx === Infinity) ? huge : (dx === -Infinity) ? -huge : dx;
            dy = (dy === Infinity) ? huge : (dy === -Infinity) ? -huge : dy;

            // If den==0 then p1 and p2 are identical
            // In this case the distance to p1 is returned
            den = dx * dx + dy * dy;
            if (den > eps) {
                lbda = (x * dx + y * dy) / den;
                if (lbda < 0.0) {
                    lbda = 0.0;
                } else if (lbda > 1.0) {
                    lbda = 1.0;
                }
                x -= lbda * dx;
                y -= lbda * dy;
            }

            return Mat.hypot(x, y);
        },

        /* ***************************************/
        /* *** 3D CALCULATIONS ****/
        /* ***************************************/

        /**
         * Generate the function which computes the data of the intersection between
         * <ul>
         * <li> plane3d, plane3d,
         * <li> plane3d, sphere3d,
         * <li> sphere3d, plane3d,
         * <li> sphere3d, sphere3d
         * </ul>
         *
         * @param {JXG.GeometryElement3D} el1 Plane or sphere element
         * @param {JXG.GeometryElement3D} el2 Plane or sphere element
         * @returns {Array} of functions needed as input to create the intersecting line or circle.
         *
         */
        intersectionFunction3D: function (view, el1, el2) {
            var func,
                that = this;

            if (el1.type === Const.OBJECT_TYPE_PLANE3D) {
                if (el2.type === Const.OBJECT_TYPE_PLANE3D) {
                    // func = () => view.intersectionPlanePlane(el1, el2)[i];
                    func = view.intersectionPlanePlane(el1, el2);
                } else if (el2.type === Const.OBJECT_TYPE_SPHERE3D) {
                    func = that.meetPlaneSphere(el1, el2);
                }
            } else if (el1.type === Const.OBJECT_TYPE_SPHERE3D) {
                if (el2.type === Const.OBJECT_TYPE_PLANE3D) {
                    func = that.meetPlaneSphere(el2, el1);
                } else if (el2.type === Const.OBJECT_TYPE_SPHERE3D) {
                    func = that.meetSphereSphere(el1, el2);
                }
            }

            return func;
        },

        /**
         * Intersecting point of three planes in 3D. The planes
         * are given in Hesse normal form.
         *
         * @param {Array} n1 Hesse normal form vector of plane 1
         * @param {Number} d1 Hesse normal form right hand side of plane 1
         * @param {Array} n2 Hesse normal form vector of plane 2
         * @param {Number} d2 Hesse normal form right hand side of plane 2
         * @param {Array} n3 Hesse normal form vector of plane 1
         * @param {Number} d3 Hesse normal form right hand side of plane 3
         * @returns {Array} Coordinates array of length 4 of the intersecting point
         */
        meet3Planes: function (n1, d1, n2, d2, n3, d3) {
            var p = [1, 0, 0, 0],
                n31, n12, n23,
                denom,
                i;

            n31 = Mat.crossProduct(n3.slice(1), n1.slice(1));
            n12 = Mat.crossProduct(n1.slice(1), n2.slice(1));
            n23 = Mat.crossProduct(n2.slice(1), n3.slice(1));

            denom = Mat.innerProduct(n1.slice(1), n23, 3);
            for (i = 0; i < 3; i++) {
                p[i + 1] = (d1 * n23[i] + d2 * n31[i] + d3 * n12[i]) / denom;
            }

            return p;
        },

        /**
         * Direction of intersecting line of two planes in 3D.
         *
         * @param {Array} v11 First vector spanning plane 1 (homogeneous coordinates)
         * @param {Array} v12 Second vector spanning plane 1 (homogeneous coordinates)
         * @param {Array} v21 First vector spanning plane 2 (homogeneous coordinates)
         * @param {Array} v22 Second vector spanning plane 2 (homogeneous coordinates)
         * @returns {Array} Coordinates array of length 4 of the direction  (homogeneous coordinates)
         */
        meetPlanePlane: function (v11, v12, v21, v22) {
            var no1,
                no2,
                v, w;

            v = v11.slice(1);
            w = v12.slice(1);
            no1 = Mat.crossProduct(v, w);

            v = v21.slice(1);
            w = v22.slice(1);
            no2 = Mat.crossProduct(v, w);

            w = Mat.crossProduct(no1, no2);
            w.unshift(0);
            return w;
        },

        meetPlaneSphere: function (el1, el2) {
            var dis = function () {
                    return Mat.innerProduct(el1.normal, el2.center.coords, 4) - el1.d;
                };

            return [
                // Center
                function() {
                    return Mat.axpy(-dis(), el1.normal, el2.center.coords);
                },
                // Normal
                el1.normal,
                // Radius
                function () {
                    // Radius (returns NaN if spheres don't touch)
                    var r = el2.Radius(),
                        s = dis();
                    return Math.sqrt(r * r - s * s);
                }
            ];
        },

        meetSphereSphere: function (el1, el2) {
            var skew = function () {
                    var dist = el1.center.distance(el2.center),
                        r1 = el1.Radius(),
                        r2 = el2.Radius();
                    return (r1 - r2) * (r1 + r2) / (dist * dist);
                };
            return [
                // Center
                function () {
                    var s = skew();
                    return [
                        1,
                        0.5 * ((1 - s) * el1.center.coords[1] + (1 + s) * el2.center.coords[1]),
                        0.5 * ((1 - s) * el1.center.coords[2] + (1 + s) * el2.center.coords[2]),
                        0.5 * ((1 - s) * el1.center.coords[3] + (1 + s) * el2.center.coords[3])
                    ];
                },
                // Normal
                function() {
                    return Stat.subtract(el2.center.coords, el1.center.coords);
                },
                // Radius
                function () {
                    // Radius (returns NaN if spheres don't touch)
                    var dist = el1.center.distance(el2.center),
                        r1 = el1.Radius(),
                        r2 = el2.Radius(),
                        s = skew(),
                        rIxnSq = 0.5 * (r1 * r1 + r2 * r2 - 0.5 * dist * dist * (1 + s * s));
                    return Math.sqrt(rIxnSq);
                }
            ];
        },

        /**
         * Test if parameters are inside of allowed ranges
         *
         * @param {Array} params Array of length 1 or 2
         * @param {Array} r_u First range
         * @param {Array} [r_v] Second range
         * @returns Boolean
         * @private
         */
        _paramsOutOfRange: function(params, r_u, r_v) {
            return params[0] < r_u[0] || params[0] > r_u[1] ||
                (params.length > 1 && (params[1] < r_v[0] || params[1] > r_v[1]));
        },

        /**
         * Given the 2D screen coordinates of a point, finds the nearest point on the given
         * parametric curve or surface, and returns its view-space coordinates.
         * @param {Array} p 3D coordinates for which the closest point on the curve point is searched.
         * @param {JXG.Curve3D|JXG.Surface3D} target Parametric curve or surface to project to.
         * @param {Array} params New position of point on the target (i.e. it is a return value),
         * modified in place during the search, ending up at the nearest point.
         * Usually, point.position is supplied for params.
         *
         * @returns {Array} Array of length 4 containing the coordinates of the nearest point on the curve or surface.
         */
        projectCoordsToParametric: function (p, target, n, params) {
            // The variables and parameters for the Cobyla constrained
            // minimization algorithm are explained in the Cobyla.js comments
            var rhobeg,                // initial size of simplex (Cobyla)
                rhoend,                // finial size of simplex (Cobyla)
                iprint = 0,            // no console output (Cobyla)
                maxfun = 200,          // call objective function at most 200 times (Cobyla)
                _minFunc,              // Objective function for Cobyla
                f = Math.random() * 0.01 + 0.5,
                r_u, r_v,
                m = 2 * n;

            // adapt simplex size to parameter range
            if (n === 1) {
                r_u = [Type.evaluate(target.range[0]), Type.evaluate(target.range[1])];

                rhobeg = 0.1 * (r_u[1] - r_u[0]);
            } else if (n === 2) {
                r_u = [Type.evaluate(target.range_u[0]), Type.evaluate(target.range_u[1])];
                r_v = [Type.evaluate(target.range_v[0]), Type.evaluate(target.range_v[1])];

                rhobeg = 0.1 * Math.min(
                    r_u[1] - r_u[0],
                    r_v[1] - r_v[0]
                );
            }
            rhoend = rhobeg / 5e6;

            // Minimize distance of the new position to the original position
            _minFunc = function (n, m, w, con) {
                var p_new = [
                        target.X.apply(target, w),
                        target.Y.apply(target, w),
                        target.Z.apply(target, w)
                    ],
                    xDiff = p[0] - p_new[0],
                    yDiff = p[1] - p_new[1],
                    zDiff = p[2] - p_new[2];

                if (m >= 2) {
                    con[0] =  w[0] - r_u[0];
                    con[1] = -w[0] + r_u[1];
                }
                if (m >= 4) {
                    con[2] =  w[1] - r_v[0];
                    con[3] = -w[1] + r_v[1];
                }

                return xDiff * xDiff + yDiff * yDiff + zDiff * zDiff;
            };

            // First optimization without range constraints to give a smooth draag experience on
            // cyclic structures.

            // Set the start values
            if (params.length === 0) {
                // If length > 0: take the previous position as start values for the optimization
                params[0] = f * (r_u[0] + r_u[1]);
                if (n === 2) { params[1] = f * (r_v[0] + r_v[1]); }
            }
            Mat.Nlp.FindMinimum(_minFunc, n, 0, params, rhobeg, rhoend, iprint, maxfun);
            // Update p which is used subsequently in _minFunc
            p = [target.X.apply(target, params),
                target.Y.apply(target, params),
                target.Z.apply(target, params)
            ];

            // If the optimal params are outside of the rang
            // Second optimization to obey the range constraints

            if (this._paramsOutOfRange(params, r_u, r_v)) {
                // Set the start values again
                params[0] = f * (r_u[0] + r_u[1]);
                if (n === 2) { params[1] = f * (r_v[0] + r_v[1]); }

                Mat.Nlp.FindMinimum(_minFunc, n, m, params, rhobeg, rhoend, iprint, maxfun);
            }

            return [1,
                target.X.apply(target, params),
                target.Y.apply(target, params),
                target.Z.apply(target, params)
            ];
        },

        // /**
        //  * Given a the screen coordinates of a point, finds the point on the
        //  * given parametric curve or surface which is nearest in screen space,
        //  * and returns its view-space coordinates.
        //  * @param {Array} pScr Screen coordinates to project.
        //  * @param {JXG.Curve3D|JXG.Surface3D} target Parametric curve or surface to project to.
        //  * @param {Array} params Parameters of point on the target, initially specifying the starting point of
        //  * the search. The parameters are modified in place during the search, ending up at the nearest point.
        //  * @returns {Array} Array of length 4 containing the coordinates of the nearest point on the curve or surface.
        //  */
        // projectScreenCoordsToParametric: function (pScr, target, params) {
        //     // The variables and parameters for the Cobyla constrained
        //     // minimization algorithm are explained in the Cobyla.js comments
        //     var rhobeg, // initial size of simplex (Cobyla)
        //         rhoend, // finial size of simplex (Cobyla)
        //         iprint = 0, // no console output (Cobyla)
        //         maxfun = 200, // call objective function at most 200 times (Cobyla)
        //         dim = params.length,
        //         _minFunc; // objective function (Cobyla)

        //     // adapt simplex size to parameter range
        //     if (dim === 1) {
        //         rhobeg = 0.1 * (target.range[1] - target.range[0]);
        //     } else if (dim === 2) {
        //         rhobeg = 0.1 * Math.min(
        //             target.range_u[1] - target.range_u[0],
        //             target.range_v[1] - target.range_v[0]
        //         );
        //     }
        //     rhoend = rhobeg / 5e6;

        //     // minimize screen distance to cursor
        //     _minFunc = function (n, m, w, con) {
        //         var c3d = [
        //             1,
        //             target.X.apply(target, w),
        //             target.Y.apply(target, w),
        //             target.Z.apply(target, w)
        //         ],
        //         c2d = target.view.project3DTo2D(c3d),
        //         xDiff = pScr[0] - c2d[1],
        //         yDiff = pScr[1] - c2d[2];

        //         if (n === 1) {
        //             con[0] = w[0] - target.range[0];
        //             con[1] = -w[0] + target.range[1];
        //         } else if (n === 2) {
        //             con[0] = w[0] - target.range_u[0];
        //             con[1] = -w[0] + target.range_u[1];
        //             con[2] = w[1] - target.range_v[0];
        //             con[3] = -w[1] + target.range_v[1];
        //         }

        //         return xDiff * xDiff + yDiff * yDiff;
        //     };

        //     Mat.Nlp.FindMinimum(_minFunc, dim, 2 * dim, params, rhobeg, rhoend, iprint, maxfun);

        //     return [1, target.X.apply(target, params), target.Y.apply(target, params), target.Z.apply(target, params)];
        // },

        project3DTo3DPlane: function (point, normal, foot) {
            // TODO: homogeneous 3D coordinates
            var sol = [0, 0, 0],
                le,
                d1,
                d2,
                lbda;

            foot = foot || [0, 0, 0];

            le = Mat.norm(normal);
            d1 = Mat.innerProduct(point, normal, 3);
            d2 = Mat.innerProduct(foot, normal, 3);
            // (point - lbda * normal / le) * normal / le == foot * normal / le
            // => (point * normal - foot * normal) ==  lbda * le
            lbda = (d1 - d2) / le;
            sol = Mat.axpy(-lbda, normal, point);

            return sol;
        },

        getPlaneBounds: function (v1, v2, q, s, e) {
            var s1, s2, e1, e2, mat, rhs, sol;

            if (v1[2] + v2[0] !== 0) {
                mat = [
                    [v1[0], v2[0]],
                    [v1[1], v2[1]]
                ];
                rhs = [s - q[0], s - q[1]];

                sol = Numerics.Gauss(mat, rhs);
                s1 = sol[0];
                s2 = sol[1];

                rhs = [e - q[0], e - q[1]];
                sol = Numerics.Gauss(mat, rhs);
                e1 = sol[0];
                e2 = sol[1];
                return [s1, e1, s2, e2];
            }
            return null;
        },

        /* ***************************************/
        /* *** Various ****/
        /* ***************************************/

        /**
         * Helper function to create curve which displays a Reuleaux polygons.
         * @param {Array} points Array of points which should be the vertices of the Reuleaux polygon. Typically,
         * these point list is the array vertices of a regular polygon.
         * @param {Number} nr Number of vertices
         * @returns {Array} An array containing the two functions defining the Reuleaux polygon and the two values
         * for the start and the end of the paramtric curve. array may be used as parent array of a
         * {@link JXG.Curve}.
         *
         * @example
         * var A = brd.create('point',[-2,-2]);
         * var B = brd.create('point',[0,1]);
         * var pol = brd.create('regularpolygon',[A,B,3], {withLines:false, fillColor:'none', highlightFillColor:'none', fillOpacity:0.0});
         * var reuleauxTriangle = brd.create('curve', JXG.Math.Geometry.reuleauxPolygon(pol.vertices, 3),
         *                          {strokeWidth:6, strokeColor:'#d66d55', fillColor:'#ad5544', highlightFillColor:'#ad5544'});
         *
         * </pre><div class="jxgbox" id="JXG2543a843-46a9-4372-abc1-94d9ad2db7ac" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * var brd = JXG.JSXGraph.initBoard('JXG2543a843-46a9-4372-abc1-94d9ad2db7ac', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright:false, shownavigation: false});
         * var A = brd.create('point',[-2,-2]);
         * var B = brd.create('point',[0,1]);
         * var pol = brd.create('regularpolygon',[A,B,3], {withLines:false, fillColor:'none', highlightFillColor:'none', fillOpacity:0.0});
         * var reuleauxTriangle = brd.create('curve', JXG.Math.Geometry.reuleauxPolygon(pol.vertices, 3),
         *                          {strokeWidth:6, strokeColor:'#d66d55', fillColor:'#ad5544', highlightFillColor:'#ad5544'});
         * </script><pre>
         */
        reuleauxPolygon: function (points, nr) {
            var beta,
                pi2 = Math.PI * 2,
                pi2_n = pi2 / nr,
                diag = (nr - 1) / 2,
                d = 0,
                makeFct = function (which, trig) {
                    return function (t, suspendUpdate) {
                        var t1 = ((t % pi2) + pi2) % pi2,
                            j = Math.floor(t1 / pi2_n) % nr;

                        if (!suspendUpdate) {
                            d = points[0].Dist(points[diag]);
                            beta = Mat.Geometry.rad(
                                [points[0].X() + 1, points[0].Y()],
                                points[0],
                                points[diag % nr]
                            );
                        }

                        if (isNaN(j)) {
                            return j;
                        }

                        t1 = t1 * 0.5 + j * pi2_n * 0.5 + beta;

                        return points[j][which]() + d * Math[trig](t1);
                    };
                };

            return [makeFct("X", 'cos'), makeFct("Y", 'sin'), 0, pi2];
        }

    }
);

export default Mat.Geometry;
