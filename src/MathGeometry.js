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
    along with JSXGraph. If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview This file contains the Math.Geometry namespace for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */


/**
 * Math.Geometry namespace definition
 * @namespace
 */
JXG.Math.Geometry = {

    /****************************************/
    /**** GENERAL GEOMETRIC CALCULATIONS ****/
    /****************************************/

    /**
     * Calculates the angle defined by the points A, B, C.
     * @param {JXG.Point} A A point  or [x,y] array.
     * @param {JXG.Point} B Another point or [x,y] array.
     * @param {JXG.Point} C A circle - no, of course the third point or [x,y] array.
     * @deprecated Use {@link JXG.Math.Geometry#rad} instead.
     * @see #rad
     * @see #trueAngle
     * @returns {Number} The angle in radian measure.
     */
    angle: function(A, B, C) {
        var a = [],
            b = [],
            c = [],
            u, v, s, t;

        if (A.coords == null) {
            a[0] = A[0];
            a[1] = A[1];
        } else {
            a[0] = A.coords.usrCoords[1];
            a[1] = A.coords.usrCoords[2];
        }
        if (B.coords == null) {
            b[0] = B[0];
            b[1] = B[1];
        } else {
            b[0] = B.coords.usrCoords[1];
            b[1] = B.coords.usrCoords[2];
        }
        if (C.coords == null) {
            c[0] = C[0];
            c[1] = C[1];
        } else {
            c[0] = C.coords.usrCoords[1];
            c[1] = C.coords.usrCoords[2];
        }
        u = a[0] - b[0];
        v = a[1] - b[1];
        s = c[0] - b[0];
        t = c[1] - b[1];
        return Math.atan2(u * t - v * s, u * s + v * t);
    },

    /**
     * Calculates the angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
     * @param {JXG.Point} A Point or [x,y] array
     * @param {JXG.Point} B Point or [x,y] array
     * @param {JXG.Point} C Point or [x,y] array
     * @see #rad
     * @returns {Number} The angle in degrees.
     */
    trueAngle: function(A, B, C) {
        return this.rad(A, B, C) * 57.295779513082323; // *180.0/Math.PI;
    },

    /**
     * Calculates the internal angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
     * @param {JXG.Point} A Point or [x,y] array
     * @param {JXG.Point} B Point or [x,y] array
     * @param {JXG.Point} C Point or [x,y] array
     * @see #trueAngle
     * @returns {Number} Angle in radians.
     */
    rad: function(A, B, C) {
        var ax, ay, bx, by, cx, cy,
            phi;

        if (A.coords == null) {
            ax = A[0];
            ay = A[1];
        } else {
            ax = A.coords.usrCoords[1];
            ay = A.coords.usrCoords[2];
        }
        if (B.coords == null) {
            bx = B[0];
            by = B[1];
        } else {
            bx = B.coords.usrCoords[1];
            by = B.coords.usrCoords[2];
        }
        if (C.coords == null) {
            cx = C[0];
            cy = C[1];
        } else {
            cx = C.coords.usrCoords[1];
            cy = C.coords.usrCoords[2];
        }

        phi = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);
        if (phi < 0) phi += 6.2831853071795862;
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
    angleBisector: function(A, B, C, board) {
        /* First point */
        var Ac = A.coords.usrCoords,
            Bc = B.coords.usrCoords,
            Cc = C.coords.usrCoords,
            x = Ac[1] - Bc[1],
            y = Ac[2] - Bc[2],
            d = Math.sqrt(x * x + y * y),
            phiA, phiC, phi;

        if (!JXG.exists(board))
            board = A.board;

        x /= d;
        y /= d;

        phiA = Math.acos(x);
        if (y < 0) {
            phiA *= -1;
        }
        if (phiA < 0) {
            phiA += 2 * Math.PI;
        }

        /* Second point */
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

        return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
    },

    /**
     * Reflects the point along the line.
     * @param {JXG.Line} line Axis of reflection.
     * @param {JXG.Point} point Point to reflect.
     * @param [board=point.board] Reference to the board
     * @returns {JXG.Coords} Coordinates of the reflected point.
     */
    reflection: function(line, point, board) {
        /* (v,w) defines the slope of the line */
        var pc = point.coords.usrCoords,
            p1c = line.point1.coords.usrCoords,
            p2c = line.point2.coords.usrCoords,
            x0, y0, x1, y1, v, w, mu;

        if (!JXG.exists(board))
            board = point.board;

        v = p2c[1] - p1c[1];
        w = p2c[2] - p1c[2];

        x0 = pc[1] - p1c[1];
        y0 = pc[2] - p1c[2];

        mu = (v * y0 - w * x0) / (v * v + w * w);

        /* point + mu*(-y,x) waere Lotpunkt */
        x1 = pc[1] + 2 * mu * w;
        y1 = pc[2] - 2 * mu * v;

        return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], board);
    },

    /**
     * Computes the new position of a point which is rotated
     * around a second point (called rotpoint) by the angle phi.
     * @param {JXG.Point} rotpoint Center of the rotation
     * @param {JXG.Point} point point to be rotated
     * @param {number} phi rotation angle in arc length
     * @param {JXG.Board} [board=point.board] Reference to the board
     * @returns {JXG.Coords} Coordinates of the new position.
     */
    rotation: function(rotpoint, point, phi, board) {
        var pc = point.coords.usrCoords,
            rotpc = rotpoint.coords.usrCoords,
            x0, y0, c, s, x1, y1;

        if (!JXG.exists(board))
            board = point.board;

        x0 = pc[1] - rotpc[1];
        y0 = pc[2] - rotpc[2];

        c = Math.cos(phi);
        s = Math.sin(phi);

        x1 = x0 * c - y0 * s + rotpc[1];
        y1 = x0 * s + y0 * c + rotpc[2];

        return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], board);
    },

    /**
     * Calculates the coordinates of a point on the perpendicular to the given line through
     * the given point.
     * @param {JXG.Line} line A line.
     * @param {JXG.Point} point Intersection point of line to perpendicular.
     * @param {JXG.Board} [board=point.board] Reference to the board
     * @returns {JXG.Coords} Coordinates of a point on the perpendicular to the given line through the given point.
     */
    perpendicular: function(line, point, board) {
        var A = line.point1.coords.usrCoords,
            B = line.point2.coords.usrCoords,
            C = point.coords.usrCoords,
            x, y, change,
            fmd, emc, d0, d1, den;

        if (!JXG.exists(board))
            board = point.board;

        if (point == line.point1) { // Punkt ist erster Punkt der Linie
            x = A[1] + B[2] - A[2];
            y = A[2] - B[1] + A[1];
            change = true;
        } else if (point == line.point2) {  // Punkt ist zweiter Punkt der Linie
            x = B[1] + A[2] - B[2];
            y = B[2] - A[1] + B[1];
            change = false;
        } else if (((Math.abs(A[1] - B[1]) > JXG.Math.eps) &&
            (Math.abs(C[2] - (A[2] - B[2]) * (C[1] - A[1]) / (A[1] - B[1]) - A[2]) < JXG.Math.eps)) ||
            ((Math.abs(A[1] - B[1]) <= JXG.Math.eps) && (Math.abs(A[1] - C[1]) < JXG.Math.eps))) { // Punkt liegt auf der Linie
            x = C[1] + B[2] - C[2];
            y = C[2] - B[1] + C[1];
            change = true;
            if (Math.abs(x - C[1]) < JXG.Math.eps && Math.abs(y - C[2]) < JXG.Math.eps) {
                x = C[1] + A[2] - C[2];
                y = C[2] - A[1] + C[1];
                change = false;
            }
        } else { // Punkt liegt nicht auf der Linie -> als zweiter Punkt wird der Lotfusspunkt gewaehlt
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
        return [new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board),change];
    },

    /**
     * Calculates the midpoint of the circumcircle of the three given points.
     * @param {JXG.Point} point1 Point
     * @param {JXG.Point} point2 Point
     * @param {JXG.Point} point3 Point
     * @param {JXG.Board} [board=point1.board] Reference to the board
     * @returns {JXG.Coords} Coordinates of the midpoint of the circumcircle of the given points.
     */
    circumcenterMidpoint: function(point1, point2, point3, board) {
        var A = point1.coords.usrCoords,
            B = point2.coords.usrCoords,
            C = point3.coords.usrCoords,
            u, v, den, x, y;

        if (!JXG.exists(board))
            board = point1.board;

        u = ((A[1] - B[1]) * (A[1] + B[1]) + (A[2] - B[2]) * (A[2] + B[2])) * 0.5;
        v = ((B[1] - C[1]) * (B[1] + C[1]) + (B[2] - C[2]) * (B[2] + C[2])) * 0.5;
        den = (A[1] - B[1]) * (B[2] - C[2]) - (B[1] - C[1]) * (A[2] - B[2]);

        if (Math.abs(den) < JXG.Math.eps) {
            den = JXG.Math.eps;
        }

        x = (u * (B[2] - C[2]) - v * (A[2] - B[2])) / den;
        y = (v * (A[1] - B[1]) - u * (B[1] - C[1])) / den;

        return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
    },

    /**
     * Calculates euclidean norm for two given arrays of the same length.
     * @param {Array} array1 Array of float or integer.
     * @param {Array} array2 Array of float or integer.
     * @returns {Number} Euclidean distance of the given vectors.
     */
    distance: function(array1, array2) {
        var sum = 0,
            i, len;

        if (array1.length != array2.length) {
            return NaN;
        }
        len = array1.length;
        for (i = 0; i < len; i++) {
            sum += (array1[i] - array2[i]) * (array1[i] - array2[i]);
        }
        return Math.sqrt(sum);
    },

    /**
     * Calculates euclidean distance for two given arrays of the same length.
     * If one of the arrays contains a zero in the first coordinate, and the euclidean distance
     * is different from zero it is a point at infinity and we return Infinity.
     * @param {Array} array1 Array containing elements of number.
     * @param {Array} array2 Array containing elements of type number.
     * @returns {Number} Euclidean (affine) distance of the given vectors.
     */
    affineDistance: function(array1, array2) {
        var d;
        if (array1.length != array2.length) {
            return NaN;
        }
        d = this.distance(array1, array2);
        if (d > JXG.Math.eps && (Math.abs(array1[0]) < JXG.Math.eps || Math.abs(array2[0]) < JXG.Math.eps)) {
            return Infinity;
        } else {
            return d;
        }
    },

    /**
     * A line can be a segment, a straight, or a ray. so it is not always delimited by point1 and point2
     * calcStraight determines the visual start point and end point of the line. A segment is only drawn
     * from start to end point, a straight line is drawn until it meets the boards boundaries.
     * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
     * @param {JXG.Coords} point1 Coordinates of the point where line drawing begins. This value is calculated and set by this method.
     * @param {JXG.Coords} point2 Coordinates of the point where line drawing ends. This value is calculated and set by this method.
     * @see Line
     * @see JXG.Line
     */
    calcStraight: function(el, point1, point2) {
        var takePoint1, takePoint2, intersect1, intersect2, straightFirst, straightLast,
            c, s, i, j, p1, p2;

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

        if (!straightFirst && !straightLast) {  // Do nothing in case of line segments (inside or outside of the board)
            return;
        }

        // Compute the stdform of the line in screen coordinates.
        c = [];
        c[0] = el.stdform[0] -
                el.stdform[1] * el.board.origin.scrCoords[1] / el.board.unitX +
                el.stdform[2] * el.board.origin.scrCoords[2] / el.board.unitY;
        c[1] = el.stdform[1] / el.board.unitX;
        c[2] = el.stdform[2] / (-el.board.unitY);

        if (isNaN(c[0] + c[1] + c[2])) return; // p1=p2

        // Intersect the line with the four borders of the board.
        s = [];
        s[0] = JXG.Math.crossProduct(c, [0,0,1]);  // top
        s[1] = JXG.Math.crossProduct(c, [0,1,0]);  // left
        s[2] = JXG.Math.crossProduct(c, [-el.board.canvasHeight,0,1]);  // bottom
        s[3] = JXG.Math.crossProduct(c, [-el.board.canvasWidth,1,0]);   // right

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
        if (!straightFirst && // Line starts at point1 and point2 is inside the board
                point1.scrCoords[1] >= 0.0 && point1.scrCoords[1] <= el.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 && point1.scrCoords[2] <= el.board.canvasHeight) {
            takePoint1 = true;
        }
        if (!straightLast && // Line ends at point2 and point2 is inside the board
                point2.scrCoords[1] >= 0.0 && point2.scrCoords[1] <= el.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 && point2.scrCoords[2] <= el.board.canvasHeight) {
            takePoint2 = true;
        }

        if (Math.abs(s[1][0]) < JXG.Math.eps) {           // line is parallel to "left", take "top" and "bottom"
            intersect1 = s[0];                          // top
            intersect2 = s[2];                          // bottom
        } else if (Math.abs(s[0][0]) < JXG.Math.eps) {           // line is parallel to "top", take "left" and "right"
            intersect1 = s[1];                          // left
            intersect2 = s[3];                          // right
        } else if (s[1][2] < 0) {                         // left intersection out of board (above)
            intersect1 = s[0];                          // top
            if (s[3][2] > el.board.canvasHeight) {        // right intersection out of board (below)
                intersect2 = s[2];                      // bottom
            } else {
                intersect2 = s[3];                      // right
            }
        } else if (s[1][2] > el.board.canvasHeight) {     // left intersection out of board (below)
            intersect1 = s[2];                          // bottom
            if (s[3][2] < 0) {                            // right intersection out of board (above)
                intersect2 = s[0];                      // top
            } else {
                intersect2 = s[3];                      // right
            }
        } else {
            intersect1 = s[1];                          // left
            if (s[3][2] < 0) {                            // right intersection out of board (above)
                intersect2 = s[0];                      // top
            } else if (s[3][2] > el.board.canvasHeight) { // right intersection out of board (below)
                intersect2 = s[2];                      // bottom
            } else {
                intersect2 = s[3];                      // right
            }
        }

        intersect1 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect1.slice(1), el.board);
        intersect2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect2.slice(1), el.board);

        if (!takePoint1 && !takePoint2) {              // If both points are outside and the complete ray is outside we do nothing
            if (!straightFirst && straightLast && // Ray starting at point 1
                    !this.isSameDirection(point1, point2, intersect1) && !this.isSameDirection(point1, point2, intersect2)) {
                return;
            } else if (straightFirst && !straightLast && // Ray starting at point 2
                    !this.isSameDirection(point2, point1, intersect1) && !this.isSameDirection(point2, point1, intersect2)) {
                return;
            }
        }

        if (!takePoint1) {
            if (!takePoint2) {                // Two border intersection points are used
                if (this.isSameDirection(point1, point2, intersect1)) {
                    if (!this.isSameDirection(point1, point2, intersect2)) {
                        p2 = intersect1;
                        p1 = intersect2;
                    } else {
                        if (JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect1.usrCoords) < JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect2.usrCoords)) {
                            p1 = intersect1;
                            p2 = intersect2;
                        } else {
                            p2 = intersect1;
                            p1 = intersect2;
                        }
                    }
                } else {
                    if (this.isSameDirection(point1, point2, intersect2)) {
                        p1 = intersect1;
                        p2 = intersect2;
                    } else {
                        if (JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect1.usrCoords) < JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect2.usrCoords)) {
                            p2 = intersect1;
                            p1 = intersect2;
                        } else {
                            p1 = intersect1;
                            p2 = intersect2;
                        }
                    }
                }
            } else {                          // Instead of point1 the border intersection is taken
                if (this.isSameDirection(point2, point1, intersect1)) {
                    p1 = intersect1;
                } else {
                    p1 = intersect2;
                }
            }
        } else {
            if (!takePoint2) {                // Instead of point2 the border intersection is taken
                if (this.isSameDirection(point1, point2, intersect1)) {
                    p2 = intersect1;
                } else {
                    p2 = intersect2;
                }
            }
        }

        if (p1) point1.setCoordinates(JXG.COORDS_BY_USER, p1.usrCoords.slice(1));
        if (p2) point2.setCoordinates(JXG.COORDS_BY_USER, p2.usrCoords.slice(1));
    },

    /**
     * If you're looking from point "start" towards point "s" and can see the point "p", true is returned. Otherwise false.
     * @param {JXG.Coords} start The point you're standing on.
     * @param {JXG.Coords} p The point in which direction you're looking.
     * @param {JXG.Coords} s The point that should be visible.
     * @returns {Boolean} True, if from start the point p is in the same direction as s is, that means s-start = k*(p-start) with k>=0.
     */
    isSameDirection: function(start, p, s) {
        var dx, dy, sx, sy, r = false;

        dx = p.usrCoords[1] - start.usrCoords[1];
        dy = p.usrCoords[2] - start.usrCoords[2];

        sx = s.usrCoords[1] - start.usrCoords[1];
        sy = s.usrCoords[2] - start.usrCoords[2];

        if (Math.abs(dx) < JXG.Math.eps) dx = 0;
        if (Math.abs(dy) < JXG.Math.eps) dy = 0;
        if (Math.abs(sx) < JXG.Math.eps) sx = 0;
        if (Math.abs(sy) < JXG.Math.eps) sy = 0;

        if (dx >= 0 && sx >= 0) {
            if ((dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0)) {
                r = true;
            }
        } else if (dx <= 0 && sx <= 0) {
            if ((dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0)) {
                r = true;
            }
        }

        return r;
    },

    /****************************************/
    /****          INTERSECTIONS         ****/
    /****************************************/

    /**
     * Calculates the coordinates of the intersection of the given lines.
     * @param {JXG.Line} line1 Line.
     * @param {JXG.Line} line2 Line.
     * @param {JXG.Board} [board=line1.board] Reference to the board
     * @returns {JXG.Coords} Coordinates of the intersection point of the given lines.
     */
    intersectLineLine: function(line1, line2, board) {
        var A = line1.point1.coords.usrCoords,
            B = line1.point2.coords.usrCoords,
            C = line2.point1.coords.usrCoords,
            D = line2.point2.coords.usrCoords,
            d0, d1, den, x, y;

        if (!JXG.exists(board))
            board = line1.board;

        d0 = A[1] * B[2] - A[2] * B[1];
        d1 = C[1] * D[2] - C[2] * D[1];
        den = (B[2] - A[2]) * (C[1] - D[1]) - (A[1] - B[1]) * (D[2] - C[2]);

        if (Math.abs(den) < JXG.Math.eps) {
            den = JXG.Math.eps;
        }
        x = (d0 * (C[1] - D[1]) - d1 * (A[1] - B[1])) / den;
        y = (d1 * (B[2] - A[2]) - d0 * (D[2] - C[2])) / den;

        return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
    },

    /**
     * Calculates the coordinates of the intersection of the given line and circle.
     * @param {JXG.Circle} circle Circle.
     * @param {JXG.Line} line Line.
     * @param {JXG.Board} [board=line.board] Reference to the board
     * @returns {Array} The coordinates of the intersection points of the given circle with the given line and
     * the amount of intersection points in the first component of the array.
     */
    intersectCircleLine: function(circle, line, board) {
        var eA = line.point1.coords.usrCoords,
            eB = line.point2.coords.usrCoords,
            fM = circle.midpoint.coords.usrCoords,
            s, d0, d1, b, w, h, r, n1, dx, dy, firstPointX, firstPointY, l, x, y, n1s, firstPoint, secondPoint, d;

        if (!JXG.exists(board))
            board = line.board;

        s = line.point1.Dist(line.point2);
        if (s > 0) {
            d0 = circle.midpoint.Dist(line.point1);
            d1 = circle.midpoint.Dist(line.point2);
            b = ((d0 * d0) + (s * s) - (d1 * d1)) / (2 * s);
            w = (d0 * d0) - (b * b);
            w = (w < 0) ? 0 : w;
            h = Math.sqrt(w);

            r = circle.Radius();
            n1 = Math.sqrt((r * r) - h * h);
            dx = eB[1] - eA[1];
            dy = eB[2] - eA[2];
            firstPointX = fM[1] + (h / s) * dy;
            firstPointY = fM[2] - (h / s) * dx;
            d0 = (eB[1] * dy) - (eB[2] * dx);
            d1 = (firstPointX * dx) + (firstPointY * dy);
            l = (dy * dy) + (dx * dx);
            if (Math.abs(l) < JXG.Math.eps) {
                l = JXG.Math.eps;
            }
            x = ((d0 * dy) + (d1 * dx)) / l;
            y = ((d1 * dy) - (d0 * dx)) / l;
            n1s = n1 / s;
            firstPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x + n1s * dx, y + n1s * dy], board);
            secondPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x - n1s * dx, y - n1s * dy], board);
            d = circle.midpoint.coords.distance(JXG.COORDS_BY_USER, firstPoint);

            if ((r < (d - 1)) || isNaN(d)) {
                return [0];
            } else {
                return [2,firstPoint,secondPoint];
            }
        }
        return [0];
    },

    /**
     * Calculates the coordinates of the intersection of the given circles.
     * @param {JXG.Circle} circle1 Circle.
     * @param {JXG.Circle} circle2 Circle.
     * @param {JXG.Board} [board=circle1.board] Reference to the board
     * @returns {Array} Coordinates of the intersection points of the given circles and the
     * amount of intersection points in the first component of the array.
     */
    intersectCircleCircle: function(circle1, circle2, board) {
        var intersection = {},
            r1 = circle1.Radius(),
            r2 = circle2.Radius(),
            M1 = circle1.midpoint.coords.usrCoords,
            M2 = circle2.midpoint.coords.usrCoords,
            rSum, rDiff, s,
            dx, dy, a, h;

        if (!JXG.exists(board))
            board = circle1.board;

        rSum = r1 + r2;
        rDiff = Math.abs(r1 - r2);
        // Abstand der Mittelpunkte der beiden Kreise
        s = circle1.midpoint.coords.distance(JXG.COORDS_BY_USER, circle2.midpoint.coords);
        if (s > rSum) {
            return [0]; // Kreise schneiden sich nicht, liegen nebeneinander
        } else if (s < rDiff) {
            return [0]; // Kreise schneiden sich nicht, liegen ineinander
        } else {
            if (s != 0) {
                intersection[0] = 1; // es gibt einen Schnitt
                dx = M2[1] - M1[1];
                dy = M2[2] - M1[2];
                a = (s * s - r2 * r2 + r1 * r1) / (2 * s);
                h = Math.sqrt(r1 * r1 - a * a);
                intersection[1] = new JXG.Coords(JXG.COORDS_BY_USER,
                    [M1[1] + (a / s) * dx + (h / s) * dy,
                        M1[2] + (a / s) * dy - (h / s) * dx],
                    board);
                intersection[2] = new JXG.Coords(JXG.COORDS_BY_USER,
                    [M1[1] + (a / s) * dx - (h / s) * dy,
                        M1[2] + (a / s) * dy + (h / s) * dx],
                    board);
            } else {
                return [0]; // vorsichtshalber...
            }
            return intersection;
        }
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
    meet: function(el1, el2, i, board) {
        var eps = JXG.Math.eps; //    var eps = 0.000001;
        if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) < eps) { // line line
            return this.meetLineLine(el1, el2, i, board);
        } else if (Math.abs(el1[3]) >= eps && Math.abs(el2[3]) < eps) { // circle line
            return this.meetLineCircle(el2, el1, i, board);
        } else if (Math.abs(el1[3]) < eps && Math.abs(el2[3]) >= eps) { // line circle
            return this.meetLineCircle(el1, el2, i, board);
        } else {  // circle circle
            return this.meetCircleCircle(el1, el2, i, board);
        }
    },

    /**
     * Intersection of two lines using the stdform.
     * @param {Array} l1 stdform of the first line
     * @param {Array} l2 stdform of the second line
     * @param {number} i unused
     * @param {JXG.Board} board Reference to the board.
     * @returns {JXG.Coords} Coordinates of the intersection point.
     */
    meetLineLine: function(l1, l2, i, board) {
        var s = JXG.Math.crossProduct(l1, l2);
        if (Math.abs(s[0]) > JXG.Math.eps) {
            s[1] /= s[0];
            s[2] /= s[0];
            s[0] = 1.0;
        }
        return new JXG.Coords(JXG.COORDS_BY_USER, s, board);
    },

    /**
     * Intersection of line and circle using the stdform.
     * @param {Array} lin stdform of the line
     * @param {Array} circ stdform of the circle
     * @param {number} i number of the returned intersection point.
     *   i==0: use the positive square root,
     *   i==1: use the negative square root.
     * @param {JXG.Board} board Reference to a board.
     * @returns {JXG.Coords} Coordinates of the intersection point
     */
    meetLineCircle: function(lin, circ, i, board) {
        var a,b,c,d,n, A,B,C, k,t;
        if (circ[4] < JXG.Math.eps) { // Radius is zero, return center of circle
            return new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(6, 8), board);
        }
        c = circ[0];
        b = circ.slice(1, 3);
        a = circ[3];
        d = lin[0];
        n = lin.slice(1, 3);

        // Line is normalized, therefore nn==1 and we can skip some operations:
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
            t = [(-B + k) / (2 * A),(-B - k) / (2 * A)];
            return ((i == 0)
                ? new JXG.Coords(JXG.COORDS_BY_USER, [-t[0] * (-n[1]) - d * n[0],-t[0] * n[0] - d * n[1]], board)
                : new JXG.Coords(JXG.COORDS_BY_USER, [-t[1] * (-n[1]) - d * n[0],-t[1] * n[0] - d * n[1]], board)
                );
            /*
             new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0]/nn,-t[0]*n[0]-d*n[1]/nn], this.board),
             new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0]/nn,-t[1]*n[0]-d*n[1]/nn], this.board)
             */
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [0,0,0], board);
        }
        // Returns do not work with homogeneous coordinates, yet
    },

    /**
     * Intersection of two circles using the stdform.
     * @param {Array} circ1 stdform of the first circle
     * @param {Array} circ2 stdform of the second circle
     * @param {number} i number of the returned intersection point.
     *   i==0: use the positive square root,
     *   i==1: use the negative square root.
     * @param {JXG.Board} board Reference to the board.
     * @returns {JXG.Coords} Coordinates of the intersection point
     */
    meetCircleCircle: function(circ1, circ2, i, board) {
        var radicalAxis;
        if (circ1[4] < JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
            if (Math.abs(this.distance(circ1.slice(6, 2), circ2.slice(6, 8)) - circ2[4]) < JXG.Math.eps) {
                return new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(6, 8), board);
            } else {
                return new JXG.Coords(JXG.COORDS_BY_USER, [0,0,0], board);
            }
        }
        if (circ2[4] < JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
            if (Math.abs(this.distance(circ2.slice(6, 2), circ1.slice(6, 8)) - circ1[4]) < JXG.Math.eps) {
                return new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(6, 8), board);
            } else {
                return new JXG.Coords(JXG.COORDS_BY_USER, [0,0,0], board);
            }
        }
        radicalAxis = [circ2[3] * circ1[0] - circ1[3] * circ2[0],
            circ2[3] * circ1[1] - circ1[3] * circ2[1],
            circ2[3] * circ1[2] - circ1[3] * circ2[2],
            0,1,Infinity, Infinity, Infinity];
        radicalAxis = JXG.Math.normalize(radicalAxis);
        return this.meetLineCircle(radicalAxis, circ1, i, board);
        // Returns do not work with homogeneous coordinates, yet
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
    meetCurveCurve: function(c1, c2, t1ini, t2ini, board) {
        var count = 0,
            t1, t2,
            a, b, c, d, disc,
            e, f, F,
            D00, D01,
            D10, D11;

        if (!JXG.exists(board))
            board = c1.board;

        if (arguments.callee.t1memo) {
            t1 = arguments.callee.t1memo;
            t2 = arguments.callee.t2memo;
        } else {
            t1 = t1ini;
            t2 = t2ini;
        }
        /*
         if (t1>c1.maxX()) { t1 = c1.maxX(); }
         if (t1<c1.minX()) { t1 = c1.minX(); }
         if (t2>c2.maxX()) { t2 = c2.maxX(); }
         if (t2<c2.minX()) { t2 = c2.minX(); }
         */
        e = c1.X(t1) - c2.X(t2);
        f = c1.Y(t1) - c2.Y(t2);
        F = e * e + f * f;

        D00 = c1.board.D(c1.X, c1);
        D01 = c2.board.D(c2.X, c2);
        D10 = c1.board.D(c1.Y, c1);
        D11 = c2.board.D(c2.Y, c2);

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
            count++;
        }
        //console.log(t1+' '+t2);

        arguments.callee.t1memo = t1;
        arguments.callee.t2memo = t2;

        //return (new JXG.Coords(JXG.COORDS_BY_USER, [2,2], this.board));
        if (Math.abs(t1) < Math.abs(t2)) {
            return (new JXG.Coords(JXG.COORDS_BY_USER, [c1.X(t1),c1.Y(t1)], board));
        } else {
            return (new JXG.Coords(JXG.COORDS_BY_USER, [c2.X(t2),c2.Y(t2)], board));
        }
    },

    /**
     * order of input does not matter for el1 and el2.
     * @param {JXG.Curve,JXG.Line} el1 Curve or Line
     * @param {JXG.Curve,JXG.Line} el2 Curve or Line
     * @param {?} nr
     * @param {JXG.Board} [board=el1.board] Reference to a board object.
     * @returns {JXG.Coords} Intersection point
     */
    meetCurveLine: function(el1, el2, nr, board) {
        var t, t2, i, cu, li, func, z,
            tnew, steps, delta, tstart, tend, cux, cuy;

        if (!JXG.exists(board))
            board = el1.board;

        //for (i=0;i<arguments.length-1;i++) {
        for (i = 0; i <= 1; i++) {
            if (arguments[i].elementClass == JXG.OBJECT_CLASS_CURVE) {
                cu = arguments[i];
            } else if (arguments[i].elementClass == JXG.OBJECT_CLASS_LINE) {
                li = arguments[i];
            } else
                throw new Error("JSXGraph: Can't call meetCurveLine with parent class " + (arguments[i].elementClass) + ".");
        }

        func = function(t) {
            return li.stdform[0] + li.stdform[1] * cu.X(t) + li.stdform[2] * cu.Y(t);
        };

        if (arguments.callee.t1memo) {
            tstart = arguments.callee.t1memo;
            t = JXG.Math.Numerics.root(func, tstart);
        } else {
            tstart = cu.minX();
            tend = cu.maxX();
            t = JXG.Math.Numerics.root(func, [tstart,tend]);
        }
        arguments.callee.t1memo = t;
        cux = cu.X(t);
        cuy = cu.Y(t);

        if (nr == 1) {
            if (arguments.callee.t2memo) {
                tstart = arguments.callee.t2memo;
                t2 = JXG.Math.Numerics.root(func, tstart);
            }
            if (!(Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1)) {
                steps = 20;
                delta = (cu.maxX() - cu.minX()) / steps;
                tnew = cu.minX();
                for (i = 0; i < steps; i++) {
                    t2 = JXG.Math.Numerics.root(func, [tnew,tnew + delta]);
                    if (Math.abs(t2 - t) > 0.1 && Math.abs(cux - cu.X(t2)) > 0.1 && Math.abs(cuy - cu.Y(t2)) > 0.1) {
                        break;
                    }
                    tnew += delta;
                }
            }
            t = t2;
            arguments.callee.t2memo = t;
        }

        if (Math.abs(func(t)) > JXG.Math.eps) {
            z = 0.0;
        } else {
            z = 1.0;
        }

        return (new JXG.Coords(JXG.COORDS_BY_USER, [z, cu.X(t),cu.Y(t)], board));
    },



    /****************************************/
    /****           PROJECTIONS          ****/
    /****************************************/

    /**
     * Calculates the coordinates of the projection of a given point on a given circle. I.o.w. the
     * nearest one of the two intersection points of the line through the given point and the circles
     * midpoint.
     * @param {JXG.Point} point Point to project.
     * @param {JXG.Circle} circle Circle on that the point is projected.
     * @param {JXG.Board} [board=point.board] Reference to the board
     * @returns {JXG.Coords} The coordinates of the projection of the given point on the given circle.
     */
    projectPointToCircle: function(point, circle, board) {
        var dist = point.coords.distance(JXG.COORDS_BY_USER, circle.midpoint.coords),
            P = point.coords.usrCoords,
            M = circle.midpoint.coords.usrCoords,
            x, y, factor;

        if (!JXG.exists(board))
            board = point.board;

        if (Math.abs(dist) < JXG.Math.eps) {
            dist = JXG.Math.eps;
        }
        factor = circle.Radius() / dist;
        x = M[1] + factor * (P[1] - M[1]);
        y = M[2] + factor * (P[2] - M[2]);

        return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
    },

    /**
     * Calculates the coordinates of the projection of a given point on a given line. I.o.w. the
     * intersection point of the given line and its perpendicular through the given point.
     * @param {JXG.Point} point Point to project.
     * @param {JXG.Line} line Line on that the point is projected.
     * @param {JXG.Board} [board=point.board] Reference to a board.
     * @returns {JXG.Coords} The coordinates of the projection of the given point on the given line.
     */
    projectPointToLine: function(point, line, board) {
        // Homogeneous version
        var v = [0,line.stdform[1],line.stdform[2]];

        if (!JXG.exists(board))
            board = point.board;

        v = JXG.Math.crossProduct(v, point.coords.usrCoords);

        return this.meetLineLine(v, line.stdform, 0, board);
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
    projectPointToCurve: function(point, curve, board) {
        if (!JXG.exists(board))
            board = point.board;

        var x = point.X(),
            y = point.Y(),
            t = point.position || 0.0, //(curve.minX()+curve.maxX())*0.5,
            result = this.projectCoordsToCurve(x, y, t, curve, board);

        point.position = result[1];      // side effect !
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
    projectCoordsToCurve: function(x, y, t, curve, board) {
        var newCoords, x0, y0, x1, y1, den, i, mindist, dist, lbda, j,
            infty = 1000000.0, minfunc, tnew, fnew, fold, delta, steps;

        if (!JXG.exists(board))
            board = curve.board;

        if (curve.visProp.curvetype == 'parameter' || curve.visProp.curvetype == 'polar') {
            // Function to minimize
            minfunc = function(t) {
                var dx = x - curve.X(t),
                    dy = y - curve.Y(t);
                return dx * dx + dy * dy;
            };

            fold = minfunc(t);
            steps = 20;
            delta = (curve.maxX() - curve.minX()) / steps;
            tnew = curve.minX();
            for (j = 0; j < steps; j++) {
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
            } // Cyclically
            if (t > curve.maxX()) {
                t = curve.minX() + t - curve.maxX();
            }
            newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [curve.X(t),curve.Y(t)], board);
        } else if (curve.visProp.curvetype == 'plot') {
            mindist = infty;
            for (i = 0; i < curve.numberPoints; i++) {
                x0 = x - curve.X(i);
                y0 = y - curve.Y(i);
                dist = Math.sqrt(x0 * x0 + y0 * y0);
                if (dist < mindist) {
                    mindist = dist;
                    t = i;
                }
                if (i == curve.numberPoints - 1) {
                    continue;
                }

                x1 = curve.X(i + 1) - curve.X(i);
                y1 = curve.Y(i + 1) - curve.Y(i);
                den = x1 * x1 + y1 * y1;
                if (den >= JXG.Math.eps) {
                    lbda = (x0 * x1 + y0 * y1) / den;
                    dist = Math.sqrt(x0 * x0 + y0 * y0 - lbda * (x0 * x1 + y0 * y1));
                } else {
                    lbda = 0.0;
                    dist = Math.sqrt(x0 * x0 + y0 * y0);
                }
                if (lbda >= 0.0 && lbda <= 1.0 && dist < mindist) {
                    t = i + lbda;
                    mindist = dist;
                }
            }
            i = Math.floor(t);
            lbda = t - i;
            if (i < curve.numberPoints - 1) {
                x = lbda * curve.X(i + 1) + (1.0 - lbda) * curve.X(i);
                y = lbda * curve.Y(i + 1) + (1.0 - lbda) * curve.Y(i);
            } else {
                x = curve.X(i);
                y = curve.Y(i);
            }
            newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
        } else {             // functiongraph
            t = x;
            x = t; //curve.X(t);
            y = curve.Y(t);
            newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
        }
        return [curve.updateTransform(newCoords),t];
    },

    /**
     * Calculates the coordinates of the projection of a given point on a given turtle. A turtle consists of
     * one or more curves of curveType 'plot'. Uses {@link #projectPointToCurve}.
     * @param {JXG.Point} point Point to project.
     * @param {JXG.Turtle} turtle on that the point is projected.
     * @param {JXG.Board} [board=point.board] Reference to a board.
     * @returns {JXG.Coords} The coordinates of the projection of the given point on the given turtle.
     */
    projectPointToTurtle: function(point, turtle, board) {
        var newCoords, t, x, y, i,
            np = 0,
            npmin = 0,
            mindist = 1000000.0,
            dist, el, minEl,
            len = turtle.objects.length;

        if (!JXG.exists(board))
            board = point.board;

        for (i = 0; i < len; i++) {  // run through all curves of this turtle
            el = turtle.objects[i];
            if (el.elementClass == JXG.OBJECT_CLASS_CURVE) {
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
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
        point.position = t + npmin;
        return minEl.updateTransform(newCoords);
    }
};
