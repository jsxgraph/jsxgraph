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
 base/constants
 base/coords
 math/math
 math/numerics
 utils/type
 */

/**
 * @fileoverview This file contains the Math.Geometry namespace for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */

define([
    'jxg', 'base/constants', 'base/coords', 'math/math', 'math/numerics', 'utils/type', 'utils/expect'
], function (JXG, Const, Coords, Mat, Numerics, Type, Expect) {

    "use strict";

    /**
     * Math.Geometry namespace definition
     * @name JXG.Math.Geometry
     * @namespace
     */
    Mat.Geometry = {};

// the splitting is necessary due to the shortcut for the circumcircleMidpoint method to circumcenter.

    JXG.extend(Mat.Geometry, /** @lends JXG.Math.Geometry */ {
        /* ***************************************/
        /* *** GENERAL GEOMETRIC CALCULATIONS ****/
        /* ***************************************/

        /**
         * Calculates the angle defined by the points A, B, C.
         * @param {JXG.Point,Array} A A point  or [x,y] array.
         * @param {JXG.Point,Array} B Another point or [x,y] array.
         * @param {JXG.Point,Array} C A circle - no, of course the third point or [x,y] array.
         * @deprecated Use {@link JXG.Math.Geometry.rad} instead.
         * @see #rad
         * @see #trueAngle
         * @returns {Number} The angle in radian measure.
         */
        angle: function (A, B, C) {
            var u, v, s, t,
                a = [],
                b = [],
                c = [];

            JXG.deprecated('Geometry.angle()', 'Geometry.rad()');
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
         * @param {JXG.Point,Array} A Point or [x,y] array
         * @param {JXG.Point,Array} B Point or [x,y] array
         * @param {JXG.Point,Array} C Point or [x,y] array
         * @see #rad
         * @returns {Number} The angle in degrees.
         */
        trueAngle: function (A, B, C) {
            return this.rad(A, B, C) * 57.295779513082323; // *180.0/Math.PI;
        },

        /**
         * Calculates the internal angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
         * @param {JXG.Point,Array} A Point or [x,y] array
         * @param {JXG.Point,Array} B Point or [x,y] array
         * @param {JXG.Point,Array} C Point or [x,y] array
         * @see #trueAngle
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
            var phiA, phiC, phi,
                Ac = A.coords.usrCoords,
                Bc = B.coords.usrCoords,
                Cc = C.coords.usrCoords,
                x, y;

            if (!Type.exists(board)) {
                board = A.board;
            }

            // Parallel lines
            if (Bc[0] === 0) {
                return new Coords(Const.COORDS_BY_USER,
                    [1, (Ac[1] + Cc[1]) * 0.5, (Ac[2] + Cc[2]) * 0.5], board);
            }

            // Non-parallel lines
            x = Ac[1] - Bc[1];
            y = Ac[2] - Bc[2];
            phiA =  Math.atan2(y, x);

            x = Cc[1] - Bc[1];
            y = Cc[2] - Bc[2];
            phiC =  Math.atan2(y, x);

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
            var x0, y0, x1, y1, v, w, mu,
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
            var x0, y0, c, s, x1, y1,
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
            var x, y, change,
                c, z,
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
                    x =  B[2];
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
                    x =  A[2];
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
                    x =  B[2];
                    y = -B[1];
                }
                change = true;

                if (Math.abs(z) > Mat.eps && Math.abs(x - C[1]) < Mat.eps && Math.abs(y - C[2]) < Mat.eps) {
                    x = C[1] + A[2] - C[2];
                    y = C[2] - A[1] + C[1];
                    change = false;
                }
                c = [z, x, y];

            // general case: point does not lie on the line
            // -> calculate the foot of the dropped perpendicular
            } else {
                c = [0, line.stdform[1], line.stdform[2]];
                c = Mat.crossProduct(c, C);                  // perpendicuar to line
                c = Mat.crossProduct(c, line.stdform);       // intersection of line and perpendicular
                change = true;
            }

            return [new Coords(Const.COORDS_BY_USER, c, board), change];
        },

        /**
         * @deprecated Please use {@link JXG.Math.Geometry.circumcenter} instead.
         */
        circumcenterMidpoint: function () {
            JXG.deprecated('Geometry.circumcenterMidpoint()', 'Geometry.circumcenter()');
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
            var u, v, m1, m2,
                A = point1.coords.usrCoords,
                B = point2.coords.usrCoords,
                C = point3.coords.usrCoords;

            if (!Type.exists(board)) {
                board = point1.board;
            }

            u = [B[0] - A[0], -B[2] + A[2], B[1] - A[1]];
            v = [(A[0] + B[0])  * 0.5, (A[1] + B[1]) * 0.5, (A[2] + B[2]) * 0.5];
            m1 = Mat.crossProduct(u, v);

            u = [C[0] - B[0], -C[2] + B[2], C[1] - B[1]];
            v = [(B[0] + C[0]) * 0.5, (B[1] + C[1]) * 0.5, (B[2] + C[2]) * 0.5];
            m2 = Mat.crossProduct(u, v);

            return new Coords(Const.COORDS_BY_USER, Mat.crossProduct(m1, m2), board);
        },

        /**
         * Calculates the euclidean norm for two given arrays of the same length.
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
         * Calculates euclidean distance for two given arrays of the same length.
         * If one of the arrays contains a zero in the first coordinate, and the euclidean distance
         * is different from zero it is a point at infinity and we return Infinity.
         * @param {Array} array1 Array containing elements of type number.
         * @param {Array} array2 Array containing elements of type number.
         * @param {Number} [n] Length of the arrays. Default is the minimum length of the given arrays.
         * @returns {Number} Euclidean (affine) distance of the given vectors.
         */
        affineDistance: function (array1, array2, n) {
            var d;

            d = this.distance(array1, array2, n);

            if (d > Mat.eps && (Math.abs(array1[0]) < Mat.eps || Math.abs(array2[0]) < Mat.eps)) {
                return Infinity;
            }

            return d;
        },

        /**
         * Sort vertices counter clockwise starting with the point with the lowest y coordinate.
         *
         * @param {Array} p An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         *
         * @returns {Array}
         */
        sortVertices: function (p) {
            var i, ll,
                ps = Expect.each(p, Expect.coordsArray),
                N = ps.length;

            // find the point with the lowest y value
            for (i = 1; i < N; i++) {
                if ((ps[i][2] < ps[0][2]) ||
                        // if the current and the lowest point have the same y value, pick the one with
                        // the lowest x value.
                        (Math.abs(ps[i][2] - ps[0][2]) < Mat.eps && ps[i][1] < ps[0][1])) {
                    ps = Type.swap(ps, i, 0);
                }
            }

            // sort ps in increasing order of the angle the points and the ll make with the x-axis
            ll = ps.shift();
            ps.sort(function (a, b) {
                // atan is monotonically increasing, as we are only interested in the sign of the difference
                // evaluating atan is not necessary
                var rad1 = Math.atan2(a[2] - ll[2], a[1] - ll[1]),
                    rad2 = Math.atan2(b[2] - ll[2], b[1] - ll[1]);

                return rad1 - rad2;
            });

            // put ll back into the array
            ps.unshift(ll);

            // put the last element also in the beginning
            ps.unshift(ps[ps.length - 1]);

            return ps;
        },

        /**
         * Signed triangle area of the three points given.
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
         * Determine the signed area of a non-intersecting polygon.
         * Surveyor's Formula
         *
         * @param {Array} p An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         * @param {Boolean} [sort=true]
         *
         * @returns {Number}
         */
        signedPolygon: function (p, sort) {
            var i, N,
                A = 0,
                ps = Expect.each(p, Expect.coordsArray);

            if (sort === undefined) {
                sort = true;
            }

            if (!sort) {
                ps = this.sortVertices(ps);
            } else {
                // make sure the polygon is closed. If it is already closed this won't change the sum because the last
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
         * Calculate the complex hull of a point cloud.
         *
         * @param {Array} points An array containing {@link JXG.Point}, {@link JXG.Coords}, and/or arrays.
         *
         * @returns {Array}
         */
        GrahamScan: function (points) {
            var i,
                M = 1,
                ps = Expect.each(points, Expect.coordsArray),
                N = ps.length;

            ps = this.sortVertices(ps);
            N = ps.length;

            for (i = 2; i < N; i++) {
                while (this.signedTriangle(ps[M - 1], ps[M], ps[i]) <= 0) {
                    if (M > 1) {
                        M -= 1;
                    } else if (i === N - 1) {
                        break;
                    } else {
                        i += 1;
                    }
                }

                M += 1;
                ps = Type.swap(ps, M, i);
            }

            return ps.slice(0, M);
        },

        /**
         * A line can be a segment, a straight, or a ray. so it is not always delimited by point1 and point2
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
            var takePoint1, takePoint2, intersection, intersect1, intersect2, straightFirst, straightLast,
                c, p1, p2;

            if (!Type.exists(margin)) {
                // Enlarge the drawable region slightly. This hides the small sides
                // of thick lines in most cases.
                margin = 10;
            }

            straightFirst = Type.evaluate(el.visProp.straightfirst);
            straightLast = Type.evaluate(el.visProp.straightlast);

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
            c[0] = el.stdform[0] -
                el.stdform[1] * el.board.origin.scrCoords[1] / el.board.unitX +
                el.stdform[2] * el.board.origin.scrCoords[2] / el.board.unitY;
            c[1] =  el.stdform[1] / el.board.unitX;
            c[2] = -el.stdform[2] / el.board.unitY;

            // p1=p2
            if (isNaN(c[0] + c[1] + c[2])) {
                return;
            }

            takePoint1 = false;
            takePoint2 = false;

            // Line starts at point1 and point1 is inside the board
            takePoint1 = !straightFirst &&
                Math.abs(point1.usrCoords[0]) >= Mat.eps &&
                point1.scrCoords[1] >= 0.0 && point1.scrCoords[1] <= el.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 && point1.scrCoords[2] <= el.board.canvasHeight;

            // Line ends at point2 and point2 is inside the board
            takePoint2 = !straightLast &&
                Math.abs(point2.usrCoords[0]) >= Mat.eps &&
                point2.scrCoords[1] >= 0.0 && point2.scrCoords[1] <= el.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 && point2.scrCoords[2] <= el.board.canvasHeight;

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
                if (!straightFirst && straightLast &&
                        !this.isSameDirection(point1, point2, intersect1) && !this.isSameDirection(point1, point2, intersect2)) {
                    return;
                }

                // Ray starting at point 2
                if (straightFirst && !straightLast &&
                        !this.isSameDirection(point2, point1, intersect1) && !this.isSameDirection(point2, point1, intersect2)) {
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
            var distP1P2, boundingBox, lineSlope,
                intersect1, intersect2, straightFirst, straightLast,
                c, p1, p2,
                takePoint1 = false,
                takePoint2 = false;

            straightFirst = Type.evaluate(el.visProp.straightfirst);
            straightLast = Type.evaluate(el.visProp.straightlast);

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
            c[0] = el.stdform[0] -
                el.stdform[1] * el.board.origin.scrCoords[1] / el.board.unitX +
                el.stdform[2] * el.board.origin.scrCoords[2] / el.board.unitY;
            c[1] =  el.stdform[1] / el.board.unitX;
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
                intersect1 = this.projectPointToLine({ coords: { usrCoords: [1, boundingBox[2], boundingBox[1]] } }, el, el.board);
                intersect2 = this.projectPointToLine({ coords: { usrCoords: [1, boundingBox[0], boundingBox[3]] } }, el, el.board);
            } else {
                // project vertices (x1, y1) (x2, y2)
                intersect1 = this.projectPointToLine({ coords: { usrCoords: [1, boundingBox[0], boundingBox[1]] } }, el, el.board);
                intersect2 = this.projectPointToLine({ coords: { usrCoords: [1, boundingBox[2], boundingBox[3]] } }, el, el.board);
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
                    if (Math.abs(point1.distance(Const.COORDS_BY_USER, intersect1) +
                            intersect1.distance(Const.COORDS_BY_USER, point2) - distP1P2) > Mat.eps) {
                        return;
                    }
                    // if insersect2 not between point1 and point2
                    if (Math.abs(point1.distance(Const.COORDS_BY_USER, intersect2) +
                            intersect2.distance(Const.COORDS_BY_USER, point2) - distP1P2) > Mat.eps) {
                        return;
                    }
                }

                // If both points are outside and the complete ray is outside we do nothing
                // Ray starting at point 1
                if (!straightFirst && straightLast &&
                        !this.isSameDirection(point1, point2, intersect1) && !this.isSameDirection(point1, point2, intersect2)) {
                    return;
                }

                // Ray starting at point 2
                if (straightFirst && !straightLast &&
                        !this.isSameDirection(point2, point1, intersect1) && !this.isSameDirection(point2, point1, intersect2)) {
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
        calcLabelQuadrant: function(angle) {
            var q;
            if (angle < 0) {
                angle += 2*Math.PI;
            }
            q = Math.floor((angle+Math.PI/8)/(Math.PI/4))%8;
            return ['rt','urt','top','ulft','lft','llft','lrt'][q];
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
         * If you're looking from point "start" towards point "s" and can see the point "p", true is returned. Otherwise false.
         * @param {JXG.Coords} start The point you're standing on.
         * @param {JXG.Coords} p The point in which direction you're looking.
         * @param {JXG.Coords} s The point that should be visible.
         * @returns {Boolean} True, if from start the point p is in the same direction as s is, that means s-start = k*(p-start) with k>=0.
         */
        isSameDirection: function (start, p, s) {
            var dx, dy, sx, sy, r = false;

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

        /****************************************/
        /****          INTERSECTIONS         ****/
        /****************************************/

        /**
         * Generate the function which computes the coordinates of the intersection point.
         * Primarily used in {@link JXG.Point#createIntersectionPoint}.
         * @param {JXG.Board} board object
         * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_Number} el1,el2,i The result will be a intersection point on el1 and el2.
         * i determines the intersection point if two points are available: <ul>
         *   <li>i==0: use the positive square root,</li>
         *   <li>i==1: use the negative square root.</li></ul>
         * See further {@link JXG.Point#createIntersectionPoint}.
         * @param {Boolean} alwaysintersect. Flag that determines if segements and arc can have an outer intersection point
         * on their defining line or circle.
         * @returns {Function} Function returning a {@link JXG.Coords} object that determines
         * the intersection point.
         */
        intersectionFunction: function (board, el1, el2, i, j, alwaysintersect) {
            var func, that = this;

            if (el1.elementClass === Const.OBJECT_CLASS_CURVE &&
                    el2.elementClass === Const.OBJECT_CLASS_CURVE) {
                // curve - curve
                /** @ignore */
                func = function () {
                    return that.meetCurveCurve(el1, el2, i, j, el1.board);
                };

            } else if ((el1.elementClass === Const.OBJECT_CLASS_CURVE && el2.elementClass === Const.OBJECT_CLASS_LINE) ||
                    (el2.elementClass === Const.OBJECT_CLASS_CURVE && el1.elementClass === Const.OBJECT_CLASS_LINE)) {
                // curve - line (this includes intersections between conic sections and lines
                /** @ignore */
                func = function () {
                    return that.meetCurveLine(el1, el2, i, el1.board, alwaysintersect);
                };

            } else if (el1.elementClass === Const.OBJECT_CLASS_LINE && el2.elementClass === Const.OBJECT_CLASS_LINE) {
                // line - line, lines may also be segments.
                /** @ignore */
                func = function () {
                    var res, c,
                        first1, first2, last1, last2;

                    first1 = first2 = Type.evaluate(el1.visProp.straightfirst);
                    last1 = last2 = Type.evaluate(el1.visProp.straightlast);

                    /**
                     * If one of the lines is a segment or ray and
                     * the the intersection point shpould disappear if outside
                     * of the segment or ray we call
                     * meetSegmentSegment
                     */
                    if (!Type.evaluate(alwaysintersect) && (!first1 || !last1 || !first2 || !last2)) {
                        res = that.meetSegmentSegment(
                            el1.point1.coords.usrCoords,
                            el1.point2.coords.usrCoords,
                            el2.point1.coords.usrCoords,
                            el2.point2.coords.usrCoords,
                            el1.board
                        );

                        if ((!first1 && res[1] < 0) || (!last1 && res[1] > 1) ||
                                (!first2 && res[2] < 0) || (!last2 && res[2] > 1)) {
                            // Non-existent
                            c = [0, NaN, NaN];
                        } else {
                            c = res[0];
                        }

                        return (new Coords(Const.COORDS_BY_USER, c, el1.board));
                    }

                    return that.meet(el1.stdform, el2.stdform, i, el1.board);
                };
            } else {
                // All other combinations of circles and lines
                /** @ignore */
                func = function () {
                    return that.meet(el1.stdform, el2.stdform, i, el1.board);
                };
            }

            return func;
        },

        /**
         * Computes the intersection of a pair of lines, circles or both.
         * It uses the internal data array stdform of these elements.
         * @param {Array} el1 stdform of the first element (line or circle)
         * @param {Array} el2 stdform of the second element (line or circle)
         * @param {Number} i Index of the intersection point that should be returned.
         * @param board Reference to the board.
         * @returns {JXG.Coords} Coordinates of one of the possible two or more intersection points.
         * Which point will be returned is determined by i.
         */
        meet: function (el1, el2, i, board) {
            var result,
                eps = Mat.eps;

            // line line
            if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) < eps) {
                result = this.meetLineLine(el1, el2, i, board);
            // circle line
            } else if (Math.abs(el1[3]) >= eps && Math.abs(el2[3]) < eps) {
                result = this.meetLineCircle(el2, el1, i, board);
            // line circle
            } else if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) >= eps) {
                result = this.meetLineCircle(el1, el2, i, board);
            // circle circle
            } else {
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
            var s = [], intersect1, intersect2, i, j;

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
                intersect1 = s[0];                          // top
                intersect2 = s[2];                          // bottom
            // line is parallel to "top", take "left" and "right"
            } else if (Math.abs(s[0][0]) < Mat.eps) {
                intersect1 = s[1];                          // left
                intersect2 = s[3];                          // right
            // left intersection out of board (above)
            } else if (s[1][2] < 0) {
                intersect1 = s[0];                          // top

                // right intersection out of board (below)
                if (s[3][2] > board.canvasHeight) {
                    intersect2 = s[2];                      // bottom
                } else {
                    intersect2 = s[3];                      // right
                }
            // left intersection out of board (below)
            } else if (s[1][2] > board.canvasHeight) {
                intersect1 = s[2];                          // bottom

                // right intersection out of board (above)
                if (s[3][2] < 0) {
                    intersect2 = s[0];                      // top
                } else {
                    intersect2 = s[3];                      // right
                }
            } else {
                intersect1 = s[1];                          // left

                // right intersection out of board (above)
                if (s[3][2] < 0) {
                    intersect2 = s[0];                      // top
                // right intersection out of board (below)
                } else if (s[3][2] > board.canvasHeight) {
                    intersect2 = s[2];                      // bottom
                } else {
                    intersect2 = s[3];                      // right
                }
            }

            intersect1 = new Coords(Const.COORDS_BY_SCREEN, intersect1.slice(1), board);
            intersect2 = new Coords(Const.COORDS_BY_SCREEN, intersect2.slice(1), board);
            return [intersect1, intersect2];
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
            /*
            var s = Mat.crossProduct(l1, l2);

            if (Math.abs(s[0]) > Mat.eps) {
                s[1] /= s[0];
                s[2] /= s[0];
                s[0] = 1.0;
            }
            */
            var s = isNaN(l1[5] + l2[5]) ? [0, 0, 0] : Mat.crossProduct(l1, l2);
            return new Coords(Const.COORDS_BY_USER, s, board);
        },

        /**
         * Intersection of line and circle.
         * @param {Array} lin stdform of the line
         * @param {Array} circ stdform of the circle
         * @param {number} i number of the returned intersection point.
         *   i==0: use the positive square root,
         *   i==1: use the negative square root.
         * @param {JXG.Board} board Reference to a board.
         * @returns {JXG.Coords} Coordinates of the intersection point
         */
        meetLineCircle: function (lin, circ, i, board) {
            var a, b, c, d, n,
                A, B, C, k, t;

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
            B = (b[0] * n[1] - b[1] * n[0]);
            C = a * d * d - (b[0] * n[0] + b[1] * n[1]) * d + c;

            k = B * B - 4 * A * C;
            if (k > -Mat.eps * Mat.eps) {
                k = Math.sqrt(Math.abs(k));
                t = [(-B + k) / (2 * A), (-B - k) / (2 * A)];

                return ((i === 0) ?
                        new Coords(Const.COORDS_BY_USER, [-t[0] * (-n[1]) - d * n[0], -t[0] * n[0] - d * n[1]], board) :
                        new Coords(Const.COORDS_BY_USER, [-t[1] * (-n[1]) - d * n[0], -t[1] * n[0] - d * n[1]], board)
                    );
            }

            return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
        },

        /**
         * Intersection of two circles.
         * @param {Array} circ1 stdform of the first circle
         * @param {Array} circ2 stdform of the second circle
         * @param {number} i number of the returned intersection point.
         *   i==0: use the positive square root,
         *   i==1: use the negative square root.
         * @param {JXG.Board} board Reference to the board.
         * @returns {JXG.Coords} Coordinates of the intersection point
         */
        meetCircleCircle: function (circ1, circ2, i, board) {
            var radicalAxis;

            // Radius is zero, return center of circle, if on other circle
            if (circ1[4] < Mat.eps) {
                if (Math.abs(this.distance(circ1.slice(6, 2), circ2.slice(6, 8)) - circ2[4]) < Mat.eps) {
                    return new Coords(Const.COORDS_BY_USER, circ1.slice(6, 8), board);
                }

                return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
            }

            // Radius is zero, return center of circle, if on other circle
            if (circ2[4] < Mat.eps) {
                if (Math.abs(this.distance(circ2.slice(6, 2), circ1.slice(6, 8)) - circ1[4]) < Mat.eps) {
                    return new Coords(Const.COORDS_BY_USER, circ2.slice(6, 8), board);
                }

                return new Coords(Const.COORDS_BY_USER, [0, 0, 0], board);
            }

            radicalAxis = [circ2[3] * circ1[0] - circ1[3] * circ2[0],
                circ2[3] * circ1[1] - circ1[3] * circ2[1],
                circ2[3] * circ1[2] - circ1[3] * circ2[2],
                0, 1, Infinity, Infinity, Infinity];
            radicalAxis = Mat.normalize(radicalAxis);

            return this.meetLineCircle(radicalAxis, circ1, i, board);
        },

        /**
         * Compute an intersection of the curves c1 and c2.
         * We want to find values t1, t2 such that
         * c1(t1) = c2(t2), i.e. (c1_x(t1)-c2_x(t2),c1_y(t1)-c2_y(t2)) = (0,0).
         *
         * Methods: segment-wise intersections (default) or generalized Newton method.
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Number} nr the nr-th intersection point will be returned.
         * @param {Number} t2ini not longer used.
         * @param {JXG.Board} [board=c1.board] Reference to a board object.
         * @param {String} [method='segment'] Intersection method, possible values are 'newton' and 'segment'.
         * @returns {JXG.Coords} intersection point
         */
        meetCurveCurve: function (c1, c2, nr, t2ini, board, method) {
            var co;

            if (Type.exists(method) && method === 'newton') {
                co = Numerics.generalizedNewton(c1, c2, nr, t2ini);
            } else {
                if (c1.bezierDegree === 3 && c2.bezierDegree === 3) {
                    co = this.meetBezierCurveRedBlueSegments(c1, c2, nr);
                } else {
                    co = this.meetCurveRedBlueSegments(c1, c2, nr);
                }
            }

            return (new Coords(Const.COORDS_BY_USER, co, board));
        },

        /**
         * Intersection of curve with line,
         * Order of input does not matter for el1 and el2.
         * From version 0.99.7 on this method calls
         * {@link JXG.Math.Geometry.meetCurveLineDiscrete}.
         * If higher precision is needed, {@link JXG.Math.Geometry.meetCurveLineContinuous}
         * has to be used.
         *
         * @param {JXG.Curve,JXG.Line} el1 Curve or Line
         * @param {JXG.Curve,JXG.Line} el2 Curve or Line
         * @param {Number} nr the nr-th intersection point will be returned.
         * @param {JXG.Board} [board=el1.board] Reference to a board object.
         * @param {Boolean} alwaysIntersect If false just the segment between the two defining points are tested for intersection
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,1,0] is returned.
         */
        meetCurveLine: function (el1, el2, nr, board, alwaysIntersect) {
            var v = [0, NaN, NaN], cu, li;

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

            // if (Type.evaluate(cu.visProp.curvetype) === 'plot') {
                v = this.meetCurveLineDiscrete(cu, li, nr, board, !alwaysIntersect);
            // } else {
            //     v = this.meetCurveLineContinuous(cu, li, nr, board);
            // }

            return v;
        },

        /**
         * Intersection of line and curve, continuous case.
         * Finds the nr-the intersection point
         * Uses {@link JXG.Math.Geometry.meetCurveLineDiscrete} as a first approximation.
         * A more exact solution is then found with {@link JXG.Math.Numerics.root}.
         *
         * @param {JXG.Curve} cu Curve
         * @param {JXG.Line} li Line
         * @param {Number} nr Will return the nr-th intersection point.
         * @param {JXG.Board} board
         *
         */
        meetCurveLineContinuous: function (cu, li, nr, board, testSegment) {
            var t, func0, func1, func0a, v, x, y, z,
                eps = Mat.eps,
                epsLow = Mat.eps,
                steps, delta, tnew, i,
                tmin, fmin, ft;

            v = this.meetCurveLineDiscrete(cu, li, nr, board, testSegment);
            x = v.usrCoords[1];
            y = v.usrCoords[2];

            func0 = function (t) {
                var c1, c2;

                if (t > cu.maxX() || t < cu.minX()) {
                    return Infinity;
                }
                c1 = x - cu.X(t);
                c2 = y - cu.Y(t);
                return c1 * c1 + c2 * c2;
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
                t = Numerics.root(func0, [Math.max(tnew, cu.minX()), Math.min(tnew + delta, cu.maxX())]);
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
            t = Numerics.root(func1, [Math.max(t - delta, cu.minX()), Math.min(t + delta, cu.maxX())]);

            ft = func1(t);
            // Is the point on the line?
            if (isNaN(ft) || Math.abs(ft) > epsLow) {
                z = 0.0; //NaN;
            } else {
                z = 1.0;
            }

            return (new Coords(Const.COORDS_BY_USER, [z, cu.X(t), cu.Y(t)], board));
        },

        /**
         * Intersection of line and curve, continuous case.
         * Segments are treated as lines. Finding the nr-the intersection point
         * works for nr=0,1 only.
         *
         * @private
         * @deprecated
         * @param {JXG.Curve} cu Curve
         * @param {JXG.Line} li Line
         * @param {Number} nr Will return the nr-th intersection point.
         * @param {JXG.Board} board
         *
         * BUG: does not respect cu.minX() and cu.maxX()
         */
        meetCurveLineContinuousOld: function (cu, li, nr, board) {
            var t, t2, i, func, z,
                tnew, steps, delta, tstart, tend, cux, cuy,
                eps = Mat.eps * 10;

            JXG.deprecated('Geometry.meetCurveLineContinuousOld()', 'Geometry.meetCurveLineContinuous()');
            func = function (t) {
                var v = li.stdform[0] + li.stdform[1] * cu.X(t) + li.stdform[2] * cu.Y(t);
                return v * v;
            };

            // Find some intersection point
            if (this.meetCurveLineContinuous.t1memo) {
                tstart = this.meetCurveLineContinuous.t1memo;
                t = Numerics.root(func, tstart);
            } else {
                tstart = cu.minX();
                tend = cu.maxX();
                t = Numerics.root(func, [tstart, tend]);
            }

            this.meetCurveLineContinuous.t1memo = t;
            cux = cu.X(t);
            cuy = cu.Y(t);

            // Find second intersection point
            if (nr === 1) {
                if (this.meetCurveLineContinuous.t2memo) {
                    tstart = this.meetCurveLineContinuous.t2memo;
                }
                t2 = Numerics.root(func, tstart);

                if (!(Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1)) {
                    steps = 20;
                    delta = (cu.maxX() - cu.minX()) / steps;
                    tnew = cu.minX();

                    for (i = 0; i < steps; i++) {
                        t2 = Numerics.root(func, [tnew, tnew + delta]);

                        if (Math.abs(func(t2)) <= eps && Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1) {
                            break;
                        }

                        tnew += delta;
                    }
                }
                t = t2;
                this.meetCurveLineContinuous.t2memo = t;
            }

            // Is the point on the line?
            if (Math.abs(func(t)) > eps) {
                z = NaN;
            } else {
                z = 1.0;
            }

            return (new Coords(Const.COORDS_BY_USER, [z, cu.X(t), cu.Y(t)], board));
        },

        /**
         * Intersection of line and curve, discrete case.
         * Segments are treated as lines.
         * Finding the nr-th intersection point should work for all nr.
         * @param {JXG.Curve} cu
         * @param {JXG.Line} li
         * @param {Number} nr
         * @param {JXG.Board} board
         * @param {Boolean} testSegment Test if intersection has to be inside of the segment or somewhere on the
         * line defined by the segment
         *
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,1,0] is returned.
         */
        meetCurveLineDiscrete: function (cu, li, nr, board, testSegment) {
            var i, j,
                p1, p2, p, q,
                lip1 = li.point1.coords.usrCoords,
                lip2 = li.point2.coords.usrCoords,
                d, res,
                cnt = 0,
                len = cu.numberPoints,
                ev_sf = Type.evaluate(li.visProp.straightfirst),
                ev_sl = Type.evaluate(li.visProp.straightlast);

            // In case, no intersection will be found we will take this
            q = new Coords(Const.COORDS_BY_USER, [0, NaN, NaN], board);

            if (lip1[0] === 0.0) {
                lip1 = [1, lip2[1] + li.stdform[2], lip2[2] - li.stdform[1]];
            } else if (lip2[0] === 0.0) {
                lip2 = [1, lip1[1] + li.stdform[2], lip1[2] - li.stdform[1]];
            }

            p2 = cu.points[0].usrCoords;
            for (i = 1; i < len; i++) {
                p1 = p2.slice(0);
                p2 = cu.points[i].usrCoords;
                d = this.distance(p1, p2);

                // The defining points are not identical
                if (d > Mat.eps) {
                    if (cu.bezierDegree === 3) {
                        res = this.meetBeziersegmentBeziersegment([
                            cu.points[i - 1].usrCoords.slice(1),
                            cu.points[i].usrCoords.slice(1),
                            cu.points[i + 1].usrCoords.slice(1),
                            cu.points[i + 2].usrCoords.slice(1)
                        ], [
                            lip1.slice(1),
                            lip2.slice(1)
                        ], testSegment);

                        i += 2;
                    } else {
                        res = [this.meetSegmentSegment(p1, p2, lip1, lip2)];
                    }

                    for (j = 0; j < res.length; j++) {
                        p = res[j];
                        if (0 <= p[1] && p[1] <= 1) {
                            if (cnt === nr) {
                                /**
                                * If the intersection point is not part of the segment,
                                * this intersection point is set to non-existent.
                                * This prevents jumping of the intersection points.
                                * But it may be discussed if it is the desired behavior.
                                */
                                if (testSegment &&
                                        ((!ev_sf && p[2] < 0) || (!ev_sl && p[2] > 1))) {
                                    return q;  // break;
                                }

                                q = new Coords(Const.COORDS_BY_USER, p[0], board);
                                return q;      // break;
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
         * We go through each segment of the red curve and search if there is an intersection with a segemnt of the blue curve.
         * This double loop, i.e. the outer loop runs along the red curve and the inner loop runs along the blue curve, defines
         * the n-th intersection point. The segments are either line segments or Bezier curves of degree 3. This depends on
         * the property bezierDegree of the curves.
         * <p>
         * This method works also for transformed curves, since only the already
         * transformed points are used.
         *
         * @param {JXG.Curve} red
         * @param {JXG.Curve} blue
         * @param {Number} nr
         */
        meetCurveRedBlueSegments: function (red, blue, nr) {
            var i, j,
                red1, red2, blue1, blue2, m,
                minX, maxX,
                iFound = 0,
                lenBlue = blue.numberPoints, //points.length,
                lenRed = red.numberPoints; //points.length;

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

                    if (Math.min(blue1[1], blue2[1]) < maxX && Math.max(blue1[1], blue2[1]) > minX) {
                        m = this.meetSegmentSegment(red1, red2, blue1, blue2);
                        if (m[1] >= 0.0 && m[2] >= 0.0 &&
                                // The two segments meet in the interior or at the start points
                                ((m[1] < 1.0 && m[2] < 1.0) ||
                                // One of the curve is intersected in the very last point
                                (i === lenRed - 1 && m[1] === 1.0) ||
                                (j === lenBlue - 1 && m[2] === 1.0))) {
                            if (iFound === nr) {
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
         * Intersection of two segments.
         * @param {Array} p1 First point of segment 1 using homogeneous coordinates [z,x,y]
         * @param {Array} p2 Second point of segment 1 using homogeneous coordinates [z,x,y]
         * @param {Array} q1 First point of segment 2 using homogeneous coordinates [z,x,y]
         * @param {Array} q2 Second point of segment 2 using homogeneous coordinates [z,x,y]
         * @returns {Array} [Intersection point, t, u] The first entry contains the homogeneous coordinates
         * of the intersection point. The second and third entry gives the position of the intersection between the
         * two defining points. For example, the second entry t is defined by: intersection point = t*p1 + (1-t)*p2.
         **/
        meetSegmentSegment: function (p1, p2, q1, q2) {
            var t, u, diff,
                li1 = Mat.crossProduct(p1, p2),
                li2 = Mat.crossProduct(q1, q2),
                c = Mat.crossProduct(li1, li2),
                denom = c[0];

            if (Math.abs(denom) < Mat.eps) {
                return [c, Infinity, Infinity];
            }

            diff = [q1[1] - p1[1], q1[2] - p1[2]];

            // Because of speed issues, evalute the determinants directly
            t = (diff[0] * (q2[2] - q1[2]) - diff[1] * (q2[1] - q1[1])) / denom;
            u = (diff[0] * (p2[2] - p1[2]) - diff[1] * (p2[1] - p1[1])) / denom;

            return [c, t, u];
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

            return [[curve[0], p0, p00, p000], [p000, p22, p2, curve[3]]];
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

            if (curve.length === 4) {   // bezierDegree == 3
                bb[0] = Math.min(curve[0][0], curve[1][0], curve[2][0], curve[3][0]); // minX
                bb[1] = Math.max(curve[0][1], curve[1][1], curve[2][1], curve[3][1]); // maxY
                bb[2] = Math.max(curve[0][0], curve[1][0], curve[2][0], curve[3][0]); // maxX
                bb[3] = Math.min(curve[0][1], curve[1][1], curve[2][1], curve[3][1]); // minY
            } else {                   // bezierDegree == 1
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

            if (le > 0 && len > 0 &&
                    ((L[le - 1][1] === 1 && Lnew[0][1] === 0) ||
                    (t2exists && L[le - 1][2] === 1 && Lnew[0][2] === 0))) {
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
            var bbb, bbr,
                ar, b0, b1, r0, r1, m,
                p0, p1, q0, q1,
                L = [],
                maxLev = 5;      // Maximum recursion level

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

                this._bezierListConcat(L, this._bezierMeetSubdivision(r0, b0, level + 1), 0.0, 0.0);
                this._bezierListConcat(L, this._bezierMeetSubdivision(r0, b1, level + 1), 0, 0.5);
                this._bezierListConcat(L, this._bezierMeetSubdivision(r1, b0, level + 1), 0.5, 0.0);
                this._bezierListConcat(L, this._bezierMeetSubdivision(r1, b1, level + 1), 0.5, 0.5);

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
            var bbb, bbr,
                ar, r0, r1, m,
                p0, p1, q0, q1,
                L = [],
                maxLev = 5;      // Maximum recursion level

            bbb = this._bezierBbox(blue);
            bbr = this._bezierBbox(red);

            if (testSegment && !this._bezierOverlap(bbr, bbb)) {
                return [];
            }

            if (level < maxLev) {
                ar = this._bezierSplit(red);
                r0 = ar[0];
                r1 = ar[1];

                this._bezierListConcat(L, this._bezierLineMeetSubdivision(r0, blue, level + 1), 0.0);
                this._bezierListConcat(L, this._bezierLineMeetSubdivision(r1, blue, level + 1), 0.5);

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
                if (i === 0 || (L[i][1] !== L[i - 1][1] || L[i][2] !== L[i - 1][2])) {
                    L2.push(L[i]);
                }
            }
            return L2;
        },

        /**
         * Find the nr-th intersection point of two Bezier curves, i.e. curves with bezierDegree == 3.
         * @param {JXG.Curve} red Curve with bezierDegree == 3
         * @param {JXG.Curve} blue Curve with bezierDegree == 3
         * @param {Number} nr The number of the intersection point which should be returned.
         * @returns {Array} The homogeneous coordinates of the nr-th intersection point.
         */
        meetBezierCurveRedBlueSegments: function (red, blue, nr) {
            var p, i, j,
                redArr, blueArr,
                bbr, bbb,
                lenBlue = blue.numberPoints, //points.length,
                lenRed = red.numberPoints, // points.length,
                L = [];

            if (lenBlue < 4 || lenRed < 4) {
                return [0, NaN, NaN];
            }

            for (i = 0; i < lenRed - 3; i += 3) {
                p = red.points;
                redArr = [
                    [p[i].usrCoords[1], p[i].usrCoords[2]],
                    [p[i + 1].usrCoords[1], p[i + 1].usrCoords[2]],
                    [p[i + 2].usrCoords[1], p[i + 2].usrCoords[2]],
                    [p[i + 3].usrCoords[1], p[i + 3].usrCoords[2]]
                ];

                bbr = this._bezierBbox(redArr);

                for (j = 0; j < lenBlue - 3; j += 3) {
                    p = blue.points;
                    blueArr = [
                        [p[j].usrCoords[1], p[j].usrCoords[2]],
                        [p[j + 1].usrCoords[1], p[j + 1].usrCoords[2]],
                        [p[j + 2].usrCoords[1], p[j + 2].usrCoords[2]],
                        [p[j + 3].usrCoords[1], p[j + 3].usrCoords[2]]
                    ];

                    bbb = this._bezierBbox(blueArr);
                    if (this._bezierOverlap(bbr, bbb)) {
                        L = L.concat(this.meetBeziersegmentBeziersegment(redArr, blueArr));
                        if (L.length > nr) {
                            return L[nr][0];
                        }
                    }
                }
            }
            if (L.length > nr) {
                return L[nr][0];
            }

            return [0, NaN, NaN];
        },

        bezierSegmentEval: function (t, curve) {
            var f, x, y,
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
         * a circle sector defined by three arrays A, B,C, each of length three.
         * The coordinate arrays are given in homogeneous coordinates.
         * @param {Array} A First point
         * @param {Array} B Second point (intersection point)
         * @param {Array} C Third point
         * @param {Boolean} withLegs Flag. If true the legs to the intersection point are part of the curve.
         * @param {Number} sgn Wither 1 or -1. Needed for minor and major arcs. In case of doubt, use 1.
         */
        bezierArc: function (A, B, C, withLegs, sgn) {
            var p1, p2, p3, p4,
                r, phi, beta,
                PI2 = Math.PI * 0.5,
                x = B[1],
                y = B[2],
                z = B[0],
                dataX = [], dataY = [],
                co, si, ax, ay, bx, by, k, v, d, matrix;

            r = this.distance(B, A);

            // x,y, z is intersection point. Normalize it.
            x /= z;
            y /= z;

            phi = this.rad(A.slice(1), B.slice(1), C.slice(1));
            if (sgn === -1) {
                phi = 2 * Math.PI - phi;
            }

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
                if (phi > PI2) {
                    beta = PI2;
                    phi -= PI2;
                } else {
                    beta = phi;
                    phi = 0;
                }

                co = Math.cos(sgn * beta);
                si = Math.sin(sgn * beta);

                matrix = [
                    [1, 0, 0],
                    [x * (1 - co) + y * si, co, -si],
                    [y * (1 - co) - x * si, si,  co]
                ];
                v = Mat.matVecMult(matrix, p1);
                p4 = [v[0] / v[0], v[1] / v[0], v[2] / v[0]];

                ax = p1[1] - x;
                ay = p1[2] - y;
                bx = p4[1] - x;
                by = p4[2] - y;

                d = Math.sqrt((ax + bx) * (ax + bx) + (ay + by) * (ay + by));

                if (Math.abs(by - ay) > Mat.eps) {
                    k = (ax + bx) * (r / d - 0.5) / (by - ay) * 8 / 3;
                } else {
                    k = (ay + by) * (r / d - 0.5) / (ax - bx) * 8 / 3;
                }

                p2 = [1, p1[1] - k * ay, p1[2] + k * ax];
                p3 = [1, p4[1] + k * by, p4[2] - k * bx];

                dataX = dataX.concat([p2[1], p3[1], p4[1]]);
                dataY = dataY.concat([p2[2], p3[2], p4[2]]);
                p1 = p4.slice(0);
            }

            if (withLegs) {
                dataX = dataX.concat([ p4[1] + 0.333 * (x - p4[1]), p4[1] + 0.666 * (x - p4[1]), x]);
                dataY = dataY.concat([ p4[2] + 0.333 * (y - p4[2]), p4[2] + 0.666 * (y - p4[2]), y]);
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
         * @param {JXG.Point,JXG.Coords} point Point to project or coords object to project.
         * @param {JXG.Circle} circle Circle on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to the board
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given circle.
         */
        projectPointToCircle: function (point, circle, board) {
            var dist, P, x, y, factor,
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
         * @param {JXG.Point} point Point to project.
         * @param {JXG.Line} line Line on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to a board.
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given line.
         */
        projectPointToLine: function (point, line, board) {
            // Homogeneous version
            var v = [0, line.stdform[1], line.stdform[2]];

            if (!Type.exists(board)) {
                board = point.board;
            }

            v = Mat.crossProduct(v, point.coords.usrCoords);
            //return this.meetLineLine(v, line.stdform, 0, board);
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
            var t, denom,
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

            return [ [1, t * s[0] + q1[1], t * s[1] + q1[2]], t];
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
         * @see #projectCoordsToCurve
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given graph.
         */
        projectPointToCurve: function (point, curve, board) {
            if (!Type.exists(board)) {
                board = point.board;
            }

            var x = point.X(),
                y = point.Y(),
                t = point.position || 0.0,
                result = this.projectCoordsToCurve(x, y, t, curve, board);

            point.position = result[1];

            return result[0];
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
         * @see #projectPointToCurve
         * @returns {JXG.Coords} Array containing the coordinates of the projection of the given point on the given graph and
         * the position on the curve.
         */
        projectCoordsToCurve: function (x, y, t, curve, board) {
            var newCoords, newCoordsObj, i, j,
                mindist, dist, lbda, v, coords, d,
                p1, p2, res,
                minfunc, tnew, fnew, fold, delta, steps,
                minX, maxX,
                infty = Number.POSITIVE_INFINITY;

            if (!Type.exists(board)) {
                board = curve.board;
            }

            if (Type.evaluate(curve.visProp.curvetype) === 'plot') {
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
            } else {   // 'parameter', 'polar', 'functiongraph'
                /** @ignore */
                minfunc = function (t) {
                    var dx, dy;
                    if (t < curve.minX() || t > curve.maxX()) {
                        return NaN;
                    }
                    dx = x - curve.X(t);
                    dy = y - curve.Y(t);
                    return dx * dx + dy * dy;
                };

                fold = minfunc(t);
                steps = 50;
                delta = (curve.maxX() - curve.minX()) / steps;
                tnew = curve.minX();

                for (i = 0; i < steps; i++) {
                    fnew = minfunc(tnew);

                    if (fnew < fold || isNaN(fold)) {
                        t = tnew;
                        fold = fnew;
                    }

                    tnew += delta;
                }

                //t = Numerics.root(Numerics.D(minfunc), t);
                t = Numerics.fminbr(minfunc, [t - delta, t + delta]);


                minX = curve.minX();
                maxX = curve.maxX();
                // Distinction between closed and open curves is not necessary.
                // If closed, the cyclic projection shift will work anyhow
                // if (Math.abs(curve.X(minX) - curve.X(maxX)) < Mat.eps &&
                //     Math.abs(curve.Y(minX) - curve.Y(maxX)) < Mat.eps) {
                //     // Cyclically
                //     if (t < minX) {
                //         t = maxX + t - minX;
                //     }
                //     if (t > maxX) {
                //         t = minX + t - maxX;
                //     }
                // } else {
                    t = (t < minX) ? minX : t;
                    t = (t > maxX) ? maxX : t;
                // }

                newCoordsObj = new Coords(Const.COORDS_BY_USER, [curve.X(t), curve.Y(t)], board);
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
                bestprojection;

            for (i = 0; i < len; i++) {
                projection = JXG.Math.Geometry.projectCoordsToSegment(
                    p,
                    pol.vertices[i].coords.usrCoords,
                    pol.vertices[(i + 1) % len].coords.usrCoords
                );

                d = JXG.Math.Geometry.distance(projection[0], p, 3);
                if (0 <= projection[1] && projection[1] <= 1 && d < d_best) {
                    bestprojection = projection[0].slice(0);
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
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given turtle.
         */
        projectPointToTurtle: function (point, turtle, board) {
            var newCoords, t, x, y, i, dist, el, minEl,
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
                    newCoords = this.projectPointToCurve(point, el);
                    dist = this.distance(newCoords.usrCoords, point.coords.usrCoords);

                    if (dist < mindist) {
                        x = newCoords.usrCoords[1];
                        y = newCoords.usrCoords[2];
                        t = point.position;
                        mindist = dist;
                        minEl = el;
                        npmin = np;
                    }
                    np += el.numberPoints;
                }
            }

            newCoords = new Coords(Const.COORDS_BY_USER, [x, y], board);
            point.position = t + npmin;

            return minEl.updateTransform(newCoords);
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
            var i, l, c,
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
                    l = Mat.crossProduct([1, bbox[c[3]], bbox[c[4]]], [1, bbox[c[5]], bbox[c[6]]]);
                    l[3] = 0;
                    l = Mat.normalize(l);

                    // project point
                    coords = this.projectPointToLine({coords: coords}, {stdform: l}, brd);
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
         * </pre><div class="jxgbox" id="2543a843-46a9-4372-abc1-94d9ad2db7ac" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * var brd = JXG.JSXGraph.initBoard('2543a843-46a9-4372-abc1-94d9ad2db7ac', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright:false, shownavigation: false});
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
                        var t1 = (t % pi2 + pi2) % pi2,
                            j = Math.floor(t1 / pi2_n) % nr;

                        if (!suspendUpdate) {
                            d = points[0].Dist(points[diag]);
                            beta = Mat.Geometry.rad([points[0].X() + 1, points[0].Y()], points[0], points[diag % nr]);
                        }

                        if (isNaN(j)) {
                            return j;
                        }

                        t1 = t1 * 0.5 + j * pi2_n * 0.5 + beta;

                        return points[j][which]() + d * Math[trig](t1);
                    };
                };

            return [makeFct('X', 'cos'), makeFct('Y', 'sin'), 0, pi2];
        }
    });

    return Mat.Geometry;
});
