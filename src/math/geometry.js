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


/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/*depends:
 JXG
 base/coords
 math/math
 math/numerics
 */

/**
 * @fileoverview This file contains the Math.Geometry namespace for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */

(function () {

    "use strict";

    /**
     * Math.Geometry namespace definition
     * @namespace
     */
    JXG.Math.Geometry = {};

// the splitting is necessary due to the shortcut for the circumcircleMidpoint method to circumcenter.

    JXG.extend(JXG.Math.Geometry, /** @lends JXG.Math.Geometry */ {

        /****************************************/
        /**** GENERAL GEOMETRIC CALCULATIONS ****/
        /****************************************/

        /**
         * Calculates the angle defined by the points A, B, C.
         * @param {JXG.Point,Array} A A point  or [x,y] array.
         * @param {JXG.Point,Array} B Another point or [x,y] array.
         * @param {JXG.Point,Array} C A circle - no, of course the third point or [x,y] array.
         * @deprecated Use {@link JXG.Math.Geometry#rad} instead.
         * @see #rad
         * @see #trueAngle
         * @returns {Number} The angle in radian measure.
         */
        angle: function (A, B, C) {
            var u, v, s, t,
                a = [],
                b = [],
                c = [];

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
         * Calculates the bisection between the three points A, B, C. The bisection is defined by two points:
         * Parameter B and a point with the coordinates calculated in this function.
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
                x = Ac[1] - Bc[1],
                y = Ac[2] - Bc[2],
                d = Math.sqrt(x * x + y * y);

            if (!JXG.exists(board)) {
                board = A.board;
            }

            x /= d;
            y /= d;
            phiA = Math.acos(x);

            if (y < 0) {
                phiA *= -1;
            }

            if (phiA < 0) {
                phiA += 2 * Math.PI;
            }

            x = Cc[1] - Bc[1];
            y = Cc[2] - Bc[2];
            d = Math.sqrt(x * x + y * y);
            x /= d;
            y /= d;
            phiC = Math.acos(x);

            if (y < 0) {
                phiC *= -1;
            }

            if (phiC < 0) {
                phiC += 2 * Math.PI;
            }

            phi = (phiA + phiC) * 0.5;

            if (phiA > phiC) {
                phi += Math.PI;
            }

            x = Math.cos(phi) + Bc[1];
            y = Math.sin(phi) + Bc[2];

            return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
        },

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

            if (!JXG.exists(board)) {
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

            return new JXG.Coords(JXG.COORDS_BY_USER, [x1, y1], board);
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

            if (!JXG.exists(board)) {
                board = point.board;
            }

            x0 = pc[1] - rotpc[1];
            y0 = pc[2] - rotpc[2];

            c = Math.cos(phi);
            s = Math.sin(phi);

            x1 = x0 * c - y0 * s + rotpc[1];
            y1 = x0 * s + y0 * c + rotpc[2];

            return new JXG.Coords(JXG.COORDS_BY_USER, [x1, y1], board);
        },

        /**
         * Calculates the coordinates of a point on the perpendicular to the given line through
         * the given point.
         * @param {JXG.Line} line A line.
         * @param {JXG.Point} point Intersection point of line to perpendicular.
         * @param {JXG.Board} [board=point.board] Reference to the board
         * @returns {JXG.Coords} Coordinates of a point on the perpendicular to the given line through the given point.
         */
        perpendicular: function (line, point, board) {
            var x, y, change,
                fmd, emc, d0, d1, den,
                A = line.point1.coords.usrCoords,
                B = line.point2.coords.usrCoords,
                C = point.coords.usrCoords;

            if (!JXG.exists(board)) {
                board = point.board;
            }

            // special case: point is the first point of the line
            if (point === line.point1) {
                x = A[1] + B[2] - A[2];
                y = A[2] - B[1] + A[1];
                change = true;
            // special case: point is the second point of the line
            } else if (point === line.point2) {
                x = B[1] + A[2] - B[2];
                y = B[2] - A[1] + B[1];
                change = false;
            // special case: point lies somewhere else on the line
            } else if (((Math.abs(A[1] - B[1]) > JXG.Math.eps) &&
                    (Math.abs(C[2] - (A[2] - B[2]) * (C[1] - A[1]) / (A[1] - B[1]) - A[2]) < JXG.Math.eps)) ||
                    ((Math.abs(A[1] - B[1]) <= JXG.Math.eps) && (Math.abs(A[1] - C[1]) < JXG.Math.eps))) {
                x = C[1] + B[2] - C[2];
                y = C[2] - B[1] + C[1];
                change = true;

                if (Math.abs(x - C[1]) < JXG.Math.eps && Math.abs(y - C[2]) < JXG.Math.eps) {
                    x = C[1] + A[2] - C[2];
                    y = C[2] - A[1] + C[1];
                    change = false;
                }
            // general case: point does not lie on the line
            // -> calculate the foot of the dropped perpendicular
            } else {
                fmd = A[2] - B[2];
                emc = A[1] - B[1];
                d0 = B[1] * fmd - B[2] * emc;
                d1 = C[1] * emc + C[2] * fmd;
                den = fmd * fmd + emc * emc;

                if (Math.abs(den) < JXG.Math.eps) {
                    den = JXG.Math.eps;
                }

                x = (d0 * fmd + d1 * emc) / den;
                y = (d1 * fmd - d0 * emc) / den;
                change = true;
            }

            return [new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board), change];
        },

        /**
         * @deprecated Please use {@link JXG.Math.Geometry#circumcenter} instead.
         */
        circumcenterMidpoint: JXG.shortcut(JXG.Math.Geometry, 'circumcenter'),

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

            if (!JXG.exists(board)) {
                board = point1.board;
            }

            u = [B[0] - A[0], -B[2] + A[2], B[1] - A[1]];
            v = [(A[0] + B[0])  * 0.5, (A[1] + B[1]) * 0.5, (A[2] + B[2]) * 0.5];
            m1 = JXG.Math.crossProduct(u, v);

            u = [C[0] - B[0], -C[2] + B[2], C[1] - B[1]];
            v = [(B[0] + C[0]) * 0.5, (B[1] + C[1]) * 0.5, (B[2] + C[2]) * 0.5];
            m2 = JXG.Math.crossProduct(u, v);

            return new JXG.Coords(JXG.COORDS_BY_USER, JXG.Math.crossProduct(m1, m2), board);
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

            if (d > JXG.Math.eps && (Math.abs(array1[0]) < JXG.Math.eps || Math.abs(array2[0]) < JXG.Math.eps)) {
                return Infinity;
            }

            return d;
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
         * @see Line
         * @see JXG.Line
         */
        calcStraight: function (el, point1, point2, margin) {
            var takePoint1, takePoint2, intersect1, intersect2, straightFirst, straightLast,
                c, s, i, j, p1, p2;

            if (!JXG.exists(margin)) {
                // Enlarge the drawable region slightly. This hides the small sides
                // of thick lines in most cases.
                margin = 10;
            }

            straightFirst = el.visProp.straightfirst;
            straightLast = el.visProp.straightlast;

            // If one of the point is an ideal point in homogeneous coordinates
            // drawing of line segments or rays are not possible.
            if (Math.abs(point1.scrCoords[0]) < JXG.Math.eps) {
                straightFirst = true;
            }
            if (Math.abs(point2.scrCoords[0]) < JXG.Math.eps) {
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

            // Intersect the line with the four borders of the board.
            s = [];

            // top
            s[0] = JXG.Math.crossProduct(c, [margin, 0, 1]);
            // left
            s[1] = JXG.Math.crossProduct(c, [margin, 1, 0]);
            // bottom
            s[2] = JXG.Math.crossProduct(c, [-margin - el.board.canvasHeight, 0, 1]);
            // right
            s[3] = JXG.Math.crossProduct(c, [-margin - el.board.canvasWidth, 1, 0]);

            // Normalize the intersections
            for (i = 0; i < 4; i++) {
                if (Math.abs(s[i][0]) > JXG.Math.eps) {
                    for (j = 2; j > 0; j--) {
                        s[i][j] /= s[i][0];
                    }
                    s[i][0] = 1.0;
                }
            }

            takePoint1 = false;
            takePoint2 = false;

            // Line starts at point1 and point1 is inside the board
            takePoint1 = !straightFirst &&
                Math.abs(point1.usrCoords[0]) >= JXG.Math.eps &&
                point1.scrCoords[1] >= 0.0 && point1.scrCoords[1] <= el.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 && point1.scrCoords[2] <= el.board.canvasHeight;

            // Line ends at point2 and point2 is inside the board
            takePoint2 = !straightLast &&
                Math.abs(point2.usrCoords[0]) >= JXG.Math.eps &&
                point2.scrCoords[1] >= 0.0 && point2.scrCoords[1] <= el.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 && point2.scrCoords[2] <= el.board.canvasHeight;

            // line is parallel to "left", take "top" and "bottom"
            if (Math.abs(s[1][0]) < JXG.Math.eps) {
                intersect1 = s[0];                          // top
                intersect2 = s[2];                          // bottom
            // line is parallel to "top", take "left" and "right"
            } else if (Math.abs(s[0][0]) < JXG.Math.eps) {
                intersect1 = s[1];                          // left
                intersect2 = s[3];                          // right
            // left intersection out of board (above)
            } else if (s[1][2] < 0) {
                intersect1 = s[0];                          // top

                // right intersection out of board (below)
                if (s[3][2] > el.board.canvasHeight) {
                    intersect2 = s[2];                      // bottom
                } else {
                    intersect2 = s[3];                      // right
                }
            // left intersection out of board (below)
            } else if (s[1][2] > el.board.canvasHeight) {
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
                } else if (s[3][2] > el.board.canvasHeight) {
                    intersect2 = s[2];                      // bottom
                } else {
                    intersect2 = s[3];                      // right
                }
            }

            intersect1 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect1.slice(1), el.board);
            intersect2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect2.slice(1), el.board);

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
                point1.setCoordinates(JXG.COORDS_BY_USER, p1.usrCoords.slice(1));
            }

            if (p2) {
                point2.setCoordinates(JXG.COORDS_BY_USER, p2.usrCoords.slice(1));
            }
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

            if (Math.abs(p2.usrCoords[0]) < JXG.Math.eps) {
                dpx = p2.usrCoords[1];
                dpy = p2.usrCoords[2];
            }

            if (Math.abs(p1.usrCoords[0]) < JXG.Math.eps) {
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

            if (Math.abs(dx) < JXG.Math.eps) {
                dx = 0;
            }

            if (Math.abs(dy) < JXG.Math.eps) {
                dy = 0;
            }

            if (Math.abs(sx) < JXG.Math.eps) {
                sx = 0;
            }

            if (Math.abs(sy) < JXG.Math.eps) {
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
                eps = JXG.Math.eps;

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
         * Intersection of two lines.
         * @param {Array} l1 stdform of the first line
         * @param {Array} l2 stdform of the second line
         * @param {number} i unused
         * @param {JXG.Board} board Reference to the board.
         * @returns {JXG.Coords} Coordinates of the intersection point.
         */
        meetLineLine: function (l1, l2, i, board) {
            var s = JXG.Math.crossProduct(l1, l2);

            if (Math.abs(s[0]) > JXG.Math.eps) {
                s[1] /= s[0];
                s[2] /= s[0];
                s[0] = 1.0;
            }
            return new JXG.Coords(JXG.COORDS_BY_USER, s, board);
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
            if (circ[4] < JXG.Math.eps) {
                if (Math.abs(JXG.Math.innerProduct([1, circ[6], circ[7]], lin, 3)) < JXG.Math.eps) {
                    return new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(6, 8), board);
                }

                return new JXG.Coords(JXG.COORDS_BY_USER, [NaN, NaN], board);
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
            if (k >= 0) {
                k = Math.sqrt(k);
                t = [(-B + k) / (2 * A), (-B - k) / (2 * A)];

                return ((i === 0) ?
                        new JXG.Coords(JXG.COORDS_BY_USER, [-t[0] * (-n[1]) - d * n[0], -t[0] * n[0] - d * n[1]], board) :
                        new JXG.Coords(JXG.COORDS_BY_USER, [-t[1] * (-n[1]) - d * n[0], -t[1] * n[0] - d * n[1]], board)
                    );
            }

            return new JXG.Coords(JXG.COORDS_BY_USER, [0, 0, 0], board);
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

            // Radius are zero, return center of circle, if on other circle
            if (circ1[4] < JXG.Math.eps) {
                if (Math.abs(this.distance(circ1.slice(6, 2), circ2.slice(6, 8)) - circ2[4]) < JXG.Math.eps) {
                    return new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(6, 8), board);
                }

                return new JXG.Coords(JXG.COORDS_BY_USER, [0, 0, 0], board);
            }

            // Radius are zero, return center of circle, if on other circle
            if (circ2[4] < JXG.Math.eps) {
                if (Math.abs(this.distance(circ2.slice(6, 2), circ1.slice(6, 8)) - circ1[4]) < JXG.Math.eps) {
                    return new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(6, 8), board);
                }

                return new JXG.Coords(JXG.COORDS_BY_USER, [0, 0, 0], board);
            }

            radicalAxis = [circ2[3] * circ1[0] - circ1[3] * circ2[0],
                circ2[3] * circ1[1] - circ1[3] * circ2[1],
                circ2[3] * circ1[2] - circ1[3] * circ2[2],
                0, 1, Infinity, Infinity, Infinity];
            radicalAxis = JXG.Math.normalize(radicalAxis);

            return this.meetLineCircle(radicalAxis, circ1, i, board);
        },

        /**
         * Compute an intersection of the curves c1 and c2
         * with a generalized Newton method.
         * We want to find values t1, t2 such that
         * c1(t1) = c2(t2), i.e.
         * (c1_x(t1)-c2_x(t2),c1_y(t1)-c2_y(t2)) = (0,0).
         * We set
         * (e,f) := (c1_x(t1)-c2_x(t2),c1_y(t1)-c2_y(t2))
         *
         * The Jacobian J is defined by
         * J = (a, b)
         *     (c, d)
         * where
         * a = c1_x'(t1)
         * b = -c2_x'(t2)
         * c = c1_y'(t1)
         * d = -c2_y'(t2)
         *
         * The inverse J^(-1) of J is equal to
         *  (d, -b)/
         *  (-c, a) / (ad-bc)
         *
         * Then, (t1new, t2new) := (t1,t2) - J^(-1)*(e,f).
         * If the function meetCurveCurve possesses the properties
         * t1memo and t2memo then these are taken as start values
         * for the Newton algorithm.
         * After stopping of the Newton algorithm the values of t1 and t2 are stored in
         * t1memo and t2memo.
         *
         * @param {JXG.Curve} c1 Curve, Line or Circle
         * @param {JXG.Curve} c2 Curve, Line or Circle
         * @param {Number} t1ini start value for t1
         * @param {Number} t2ini start value for t2
         * @param {JXG.Board} [board=c1.board] Reference to a board object.
         * @returns {JXG.Coords} intersection point
         */
        meetCurveCurve: function (c1, c2, t1ini, t2ini, board) {
            var t1, t2,
                a, b, c, d, disc,
                e, f, F,
                D00, D01,
                D10, D11,
                count = 0;

            if (!JXG.exists(board)) {
                board = c1.board;
            }

            if (this.meetCurveCurve.t1memo) {
                t1 = this.meetCurveCurve.t1memo;
                t2 = this.meetCurveCurve.t2memo;
            } else {
                t1 = t1ini;
                t2 = t2ini;
            }

            e = c1.X(t1) - c2.X(t2);
            f = c1.Y(t1) - c2.Y(t2);
            F = e * e + f * f;

            D00 = JXG.Math.Numerics.D(c1.X, c1);
            D01 = JXG.Math.Numerics.D(c2.X, c2);
            D10 = JXG.Math.Numerics.D(c1.Y, c1);
            D11 = JXG.Math.Numerics.D(c2.Y, c2);

            while (F > JXG.Math.eps && count < 10) {
                a = D00(t1);
                b = -D01(t2);
                c = D10(t1);
                d = -D11(t2);
                disc = a * d - b * c;
                t1 -= (d * e - b * f) / disc;
                t2 -= (a * f - c * e) / disc;
                e = c1.X(t1) - c2.X(t2);
                f = c1.Y(t1) - c2.Y(t2);
                F = e * e + f * f;
                count += 1;
            }

            this.meetCurveCurve.t1memo = t1;
            this.meetCurveCurve.t2memo = t2;

            if (Math.abs(t1) < Math.abs(t2)) {
                return (new JXG.Coords(JXG.COORDS_BY_USER, [c1.X(t1), c1.Y(t1)], board));
            }

            return (new JXG.Coords(JXG.COORDS_BY_USER, [c2.X(t2), c2.Y(t2)], board));
        },

        /**
         * Intersection of curve with line,
         * Order of input does not matter for el1 and el2.
         * @param {JXG.Curve,JXG.Line} el1 Curve or Line
         * @param {JXG.Curve,JXG.Line} el2 Curve or Line
         * @param {Number} nr the nr-th intersection point will be returned.
         * @param {JXG.Board} [board=el1.board] Reference to a board object.
         * @param {Object} pointObj
         * @param {JXG.Point} pointObj.point
         * @returns {JXG.Coords} Intersection point. In case no intersection point is detected,
         * the ideal point [0,1,0] is returned.
         */
        meetCurveLine: function (el1, el2, nr, board, pointObj) {
            var v = [0, NaN, NaN], i, cu, li;

            if (!JXG.exists(board)) {
                board = el1.board;
            }

            if (el1.elementClass === JXG.OBJECT_CLASS_CURVE) {
                cu = el1;
                li = el2;
            } else {
                cu = el2;
                li = el1;
            }

            if (cu.visProp.curvetype === 'plot') {
                v = this.meetCurveLineDiscrete(cu, li, nr, board, pointObj);
            } else {
                v = this.meetCurveLineContinuous(cu, li, nr, board);
            }

            return v;
        },

        /**
         * Intersection of line and curve, continuous case.
         * Segments are treated as lines. Finding the nr-the intersection point
         * works for nr=0,1 only.
         * @param {JXG.Curve} cu Curve
         * @param {JXG.Line} li Line
         * @param {Number} nr Will return the nr-th intersection point.
         * @param {JXG.Board} board
         *
         * BUG: does not respect cu.minX() and cu.maxX()
         */
        meetCurveLineContinuous: function (cu, li, nr, board) {
            var t, t2, i, func, z,
                tnew, steps, delta, tstart, tend, cux, cuy;

            func = function (t) {
                return li.stdform[0] + li.stdform[1] * cu.X(t) + li.stdform[2] * cu.Y(t);
            };

            // Find some intersection point
            if (this.meetCurveLineContinuous.t1memo) {
                tstart = this.meetCurveLineContinuous.t1memo;
                t = JXG.Math.Numerics.root(func, tstart);
            } else {
                tstart = cu.minX();
                tend = cu.maxX();
                t = JXG.Math.Numerics.root(func, [tstart, tend]);
            }

            this.meetCurveLineContinuous.t1memo = t;
            cux = cu.X(t);
            cuy = cu.Y(t);

            // Find second intersection point
            if (nr === 1) {
                if (this.meetCurveLineContinuous.t2memo) {
                    tstart = this.meetCurveLineContinuous.t2memo;
                    t2 = JXG.Math.Numerics.root(func, tstart);
                }

                if (!(Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1)) {
                    steps = 20;
                    delta = (cu.maxX() - cu.minX()) / steps;
                    tnew = cu.minX();

                    for (i = 0; i < steps; i++) {
                        t2 = JXG.Math.Numerics.root(func, [tnew, tnew + delta]);

                        if (Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1) {
                            break;
                        }

                        tnew += delta;
                    }
                }
                t = t2;
                this.meetCurveLineContinuous.t2memo = t;
            }

            if (Math.abs(func(t)) > JXG.Math.eps) {
                z = NaN;
            } else {
                z = 1.0;
            }

            return (new JXG.Coords(JXG.COORDS_BY_USER, [z, cu.X(t), cu.Y(t)], board));
        },

        /**
         * Intersection of line and curve, continuous case.
         * Segments are treated as lines.
         * Finding the nr-the intersection point should work for all nr.
         * @param {JXG.Curve} cu
         * @param {JXG.Line} li
         * @param {Number} nr
         * @param {JXG.Board} board
         * @param {Object} pointObj
         * @param {JXG.Point} pointObj.point
         */
        meetCurveLineDiscrete: function (cu, li, nr, board, pointObj) {
            var i, p1, p2, q,
                d, cnt = 0, res,
                p,
                len = cu.numberPoints,
                testSegment = false;

            if (JXG.exists(pointObj)) {
                p = pointObj.point;

                if (JXG.exists(p) && !p.visProp.alwaysintersect) {
                    testSegment = true;
                }
            }

            // In case, no intersection will be found we will take this
            q = new JXG.Coords(JXG.COORDS_BY_USER, [0, NaN, NaN], board);

            p2 = [1, cu.X(0), cu.Y(0)];
            for (i = 1; i < len; i++) {
                p1 = p2.slice(0);
                p2 = [1, cu.X(i), cu.Y(i)];
                d = this.distance(p1, p2);

                // The defining points are identical
                if (d > JXG.Math.eps) {
                    res = this.meetSegmentSegment(p1, p2, li.point1.coords.usrCoords, li.point2.coords.usrCoords, board);
                    if (0 <= res[1] && res[1] <= 1) {
                        if (cnt === nr) {
                            /**
                             * If the intersection point is not part of the segment,
                             * this intersection point is set to non-existent.
                             * This prevents jumping of the intersection points.
                             * But it may be discussed if it is the desired behavior.
                             */
                            if (testSegment && ((!li.visProp.straightfirst && res[2] < 0) ||
                                    (!li.visProp.straightlast && res[2] > 1))) {
                                break;
                            }

                            q = new JXG.Coords(JXG.COORDS_BY_USER, res[0], board);
                            break;
                        }
                        cnt += 1;
                    }
                }
            }

            return q;
        },

        /**
         * Intersection of two segments.
         * @param {Array} p1 First point of segment 1 using homogeneous coordinates [z,x,y]
         * @param {Array} p2 Second point of segment 1 using homogeneous coordinates [z,x,y]
         * @param {Array} q1 First point of segment 2 using homogeneous coordinates [z,x,y]
         * @param {Array} q2 Second point of segment 2 using homogeneous coordinates [z,x,y]
         * @returns {Array} [Intersection point, t, u] The first entry contains the homogeneous coordinates
         * of the intersection point. The second and third entry gives the position of the intersection between the
         * two defining points. For example, the second entry t is defined by: interestion point = t*p1 + (1-t)*p2.
         **/
        meetSegmentSegment: function (p1, p2, q1, q2) {
            var t, u, diff,
                li1 = JXG.Math.crossProduct(p1, p2),
                li2 = JXG.Math.crossProduct(q1, q2),
                c = JXG.Math.crossProduct(li1, li2),
                denom = c[0];

            if (Math.abs(denom) < JXG.Math.eps) {
                return [c, Infinity, Infinity];
            }

            diff = [q1[1] - p1[1], q1[2] - p1[2]];

            // Because of speed issues, evalute the determinants directly
            t = (diff[0] * (q2[2] - q1[2]) - diff[1] * (q2[1] - q1[1])) / denom;
            u = (diff[0] * (p2[2] - p1[2]) - diff[1] * (p2[1] - p1[1])) / denom;

            return [c, t, u];
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

            if (!JXG.exists(board)) {
                board = point.board;
            }

            // gave us a point
            if (JXG.isPoint(point)) {
                dist = point.coords.distance(JXG.COORDS_BY_USER, circle.center.coords);
                P = point.coords.usrCoords;
            // gave us coords
            } else {
                dist = point.distance(JXG.COORDS_BY_USER, circle.center.coords);
                P = point.usrCoords;
            }

            if (Math.abs(dist) < JXG.Math.eps) {
                dist = JXG.Math.eps;
            }

            factor = circle.Radius() / dist;
            x = M[1] + factor * (P[1] - M[1]);
            y = M[2] + factor * (P[2] - M[2]);

            return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
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

            if (!JXG.exists(board)) {
                board = point.board;
            }

            v = JXG.Math.crossProduct(v, point.coords.usrCoords);

            return this.meetLineLine(v, line.stdform, 0, board);
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
            var t, denom, c,
                s = [q2[1] - q1[1], q2[2] - q1[2]],
                v = [p[1] - q1[1], p[2] - q1[2]];

            /**
             * If the segment has length 0, i.e. is a point,
             * the projection is equal to that point.
             */
            if (Math.abs(s[0]) < JXG.Math.eps && Math.abs(s[1]) < JXG.Math.eps) {
                return q1;
            }

            t = JXG.Math.innerProduct(v, s);
            denom = JXG.Math.innerProduct(s, s);
            t /= denom;

            return [ [1, t * s[0] + q1[1], t * s[1] + q1[2]], t];
        },

        /**
         * Calculates the coordinates of the projection of a given point on a given curve.
         * Uses {@link #projectCoordsToCurve}.
         * @param {JXG.Point} point Point to project.
         * @param {JXG.Curve} curve Curve on that the point is projected.
         * @param {JXG.Board} [board=point.board] Reference to a board.
         * @see #projectCoordsToCurve
         * @returns {JXG.Coords} The coordinates of the projection of the given point on the given graph.
         */
        projectPointToCurve: function (point, curve, board) {
            if (!JXG.exists(board)) {
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
            var newCoords, i,
                x0, y0, x1, y1, mindist, dist, lbda, li, v, coords, d,
                p1, p2, q1, q2, res,
                minfunc, tnew, fnew, fold, delta, steps,
                infty = Number.POSITIVE_INFINITY;

            if (!JXG.exists(board)) {
                board = curve.board;
            }

            if (curve.visProp.curvetype === 'parameter' || curve.visProp.curvetype === 'polar') {
                // Function to minimize
                minfunc = function (t) {
                    var dx = x - curve.X(t),
                        dy = y - curve.Y(t);
                    return dx * dx + dy * dy;
                };

                fold = minfunc(t);
                steps = 20;
                delta = (curve.maxX() - curve.minX()) / steps;
                tnew = curve.minX();

                for (i = 0; i < steps; i++) {
                    fnew = minfunc(tnew);

                    if (fnew < fold) {
                        t = tnew;
                        fold = fnew;
                    }

                    tnew += delta;
                }

                t = JXG.Math.Numerics.root(JXG.Math.Numerics.D(minfunc), t);

                if (t < curve.minX()) {
                    t = curve.maxX() + t - curve.minX();
                }

                // Cyclically
                if (t > curve.maxX()) {
                    t = curve.minX() + t - curve.maxX();
                }

                newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [curve.X(t), curve.Y(t)], board);
            } else if (curve.visProp.curvetype === 'plot') {
                t = 0;
                mindist = infty;

                if (curve.numberPoints === 0) {
                    newCoords = [0, 1, 1];
                } else {
                    newCoords = [curve.Z(0), curve.X(0), curve.Y(0)];
                }

                if (curve.numberPoints > 1) {
                    p1 = [curve.Z(0), curve.X(0), curve.Y(0)];

                    for (i = 0; i < curve.numberPoints - 1; i++) {
                        p2 = [curve.Z(i + 1), curve.X(i + 1), curve.Y(i + 1)];
                        v = [1, x, y];
                        res = this.projectCoordsToSegment(v, p1, p2);
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

                        p1 = p2;
                    }
                }

                newCoords = new JXG.Coords(JXG.COORDS_BY_USER, newCoords, board);
            // functiongraph
            } else {
                t = x;
                x = t;
                y = curve.Y(t);
                newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
            }

            return [curve.updateTransform(newCoords), t];
        },

        /**
         * Calculates the coordinates of the projection of a given point on a given turtle. A turtle consists of
         * one or more curves of curveType 'plot'. Uses {@link #projectPointToCurve}.
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

            if (!JXG.exists(board)) {
                board = point.board;
            }

            // run through all curves of this turtle
            for (i = 0; i < len; i++) {
                el = turtle.objects[i];

                if (el.elementClass === JXG.OBJECT_CLASS_CURVE) {
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

            newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
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

            if (Math.abs(a) + Math.abs(b) < JXG.Math.eps) {
                return Number.POSITIVE_INFINITY;
            }

            nom = a * point[1] + b * point[2] + c;
            a *= a;
            b *= b;

            return Math.abs(nom) / Math.sqrt(a + b);
        }

    });
}());
