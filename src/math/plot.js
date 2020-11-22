/*
    Copyright 2008-2020
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Alfred Wassermann

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
 utils/type
 */

define(['jxg', 'base/constants', 'base/coords', 'math/math', 'math/extrapolate', 'math/numerics',
        'math/statistics', 'math/geometry', 'math/ia', 'utils/type'],
        function (JXG, Const, Coords, Mat, Extrapolate, Numerics, Statistics, Geometry, IntervalArithmetic, Type) {

    "use strict";

    /**
     * Functions for plotting of curves.
     * @name JXG.Math.Plot
     * @exports Mat.Plot as JXG.Math.Plot
     * @namespace
     */
    Mat.Plot = {

        /**
         * Check if at least one point on the curve is finite and real.
         **/
        checkReal: function (points) {
            var b = false,
                i, p,
                len = points.length;

            for (i = 0; i < len; i++) {
                p = points[i].usrCoords;
                if (!isNaN(p[1]) && !isNaN(p[2]) && Math.abs(p[0]) > Mat.eps) {
                    b = true;
                    break;
                }
            }
            return b;
        },

        //----------------------------------------------------------------------
        // Plot algorithm v0
        //----------------------------------------------------------------------
        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>false</tt>.
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @param {Number} len Number of data points
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurveNaive: function (curve, mi, ma, len) {
            var i, t,
                suspendUpdate = false,
                stepSize = (ma - mi) / len;

            for (i = 0; i < len; i++) {
                t = mi + i * stepSize;
                // The last parameter prevents rounding in usr2screen().
                curve.points[i].setCoordinates(Const.COORDS_BY_USER, [curve.X(t, suspendUpdate), curve.Y(t, suspendUpdate)], false);
                curve.points[i]._t = t;
                suspendUpdate = true;
            }
            return curve;
        },

        //----------------------------------------------------------------------
        // Plot algorithm v1
        //----------------------------------------------------------------------
        /**
         * Crude and cheap test if the segment defined by the two points <tt>(x0, y0)</tt> and <tt>(x1, y1)</tt> is
         * outside the viewport of the board. All parameters have to be given in screen coordinates.
         *
         * @private
         * @deprecated
         * @param {Number} x0
         * @param {Number} y0
         * @param {Number} x1
         * @param {Number} y1
         * @param {JXG.Board} board
         * @returns {Boolean} <tt>true</tt> if the given segment is outside the visible area.
         */
        isSegmentOutside: function (x0, y0, x1, y1, board) {
            return (y0 < 0 && y1 < 0) || (y0 > board.canvasHeight && y1 > board.canvasHeight) ||
                (x0 < 0 && x1 < 0) || (x0 > board.canvasWidth && x1 > board.canvasWidth);
        },

        /**
         * Compares the absolute value of <tt>dx</tt> with <tt>MAXX</tt> and the absolute value of <tt>dy</tt>
         * with <tt>MAXY</tt>.
         *
         * @private
         * @deprecated
         * @param {Number} dx
         * @param {Number} dy
         * @param {Number} MAXX
         * @param {Number} MAXY
         * @returns {Boolean} <tt>true</tt>, if <tt>|dx| &lt; MAXX</tt> and <tt>|dy| &lt; MAXY</tt>.
         */
        isDistOK: function (dx, dy, MAXX, MAXY) {
            return (Math.abs(dx) < MAXX && Math.abs(dy) < MAXY) && !isNaN(dx + dy);
        },

         /**
         * @private
         * @deprecated
         */
        isSegmentDefined: function (x0, y0, x1, y1) {
            return !(isNaN(x0 + y0) && isNaN(x1 + y1));
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>true</tt>.
         * Since 0.99 this algorithm is deprecated. It still can be used if {@link JXG.Curve#doadvancedplotold} is <tt>true</tt>.
         *
         * @deprecated
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurveOld: function (curve, mi, ma) {
            var i, t, d,
                x, y, t0, x0, y0, top, depth,
                MAX_DEPTH, MAX_XDIST, MAX_YDIST,
                suspendUpdate = false,
                po = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                dyadicStack = [],
                depthStack = [],
                pointStack = [],
                divisors = [],
                distOK = false,
                j = 0,
                distFromLine = function (p1, p2, p0) {
                    var lbda, d,
                        x0 = p0[1] - p1[1],
                        y0 = p0[2] - p1[2],
                        x1 = p2[0] - p1[1],
                        y1 = p2[1] - p1[2],
                        den = x1 * x1 + y1 * y1;

                    if (den >= Mat.eps) {
                        lbda = (x0 * x1 + y0 * y1) / den;
                        if (lbda > 0) {
                            if (lbda <= 1) {
                                x0 -= lbda * x1;
                                y0 -= lbda * y1;
                            // lbda = 1.0;
                            } else {
                                x0 -= x1;
                                y0 -= y1;
                            }
                        }
                    }
                    d = x0 * x0 + y0 * y0;
                    return Math.sqrt(d);
                };

            JXG.deprecated('Curve.updateParametricCurveOld()');

            if (curve.board.updateQuality === curve.board.BOARD_QUALITY_LOW) {
                MAX_DEPTH = 15;
                MAX_XDIST = 10; // 10
                MAX_YDIST = 10; // 10
            } else {
                MAX_DEPTH = 21;
                MAX_XDIST = 0.7; // 0.7
                MAX_YDIST = 0.7; // 0.7
            }

            divisors[0] = ma - mi;
            for (i = 1; i < MAX_DEPTH; i++) {
                divisors[i] = divisors[i - 1] * 0.5;
            }

            i = 1;
            dyadicStack[0] = 1;
            depthStack[0] = 0;

            t = mi;
            po.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, suspendUpdate), curve.Y(t, suspendUpdate)], false);

            // Now, there was a first call to the functions defining the curve.
            // Defining elements like sliders have been evaluated.
            // Therefore, we can set suspendUpdate to false, so that these defining elements
            // need not be evaluated anymore for the rest of the plotting.
            suspendUpdate = true;
            x0 = po.scrCoords[1];
            y0 = po.scrCoords[2];
            t0 = t;

            t = ma;
            po.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, suspendUpdate), curve.Y(t, suspendUpdate)], false);
            x = po.scrCoords[1];
            y = po.scrCoords[2];

            pointStack[0] = [x, y];

            top = 1;
            depth = 0;

            curve.points = [];
            curve.points[j++] = new Coords(Const.COORDS_BY_SCREEN, [x0, y0], curve.board, false);

            do {
                distOK = this.isDistOK(x - x0, y - y0, MAX_XDIST, MAX_YDIST) || this.isSegmentOutside(x0, y0, x, y, curve.board);
                while (depth < MAX_DEPTH && (!distOK || depth < 6) && (depth <= 7 || this.isSegmentDefined(x0, y0, x, y))) {
                    // We jump out of the loop if
                    // * depth>=MAX_DEPTH or
                    // * (depth>=6 and distOK) or
                    // * (depth>7 and segment is not defined)

                    dyadicStack[top] = i;
                    depthStack[top] = depth;
                    pointStack[top] = [x, y];
                    top += 1;

                    i = 2 * i - 1;
                    // Here, depth is increased and may reach MAX_DEPTH
                    depth++;
                    // In that case, t is undefined and we will see a jump in the curve.
                    t = mi + i * divisors[depth];

                    po.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, suspendUpdate), curve.Y(t, suspendUpdate)], false, true);
                    x = po.scrCoords[1];
                    y = po.scrCoords[2];
                    distOK = this.isDistOK(x - x0, y - y0, MAX_XDIST, MAX_YDIST) || this.isSegmentOutside(x0, y0, x, y, curve.board);
                }

                if (j > 1) {
                    d = distFromLine(curve.points[j - 2].scrCoords, [x, y], curve.points[j - 1].scrCoords);
                    if (d < 0.015) {
                        j -= 1;
                    }
                }

                curve.points[j] = new Coords(Const.COORDS_BY_SCREEN, [x, y], curve.board, false);
                curve.points[j]._t = t;
                j += 1;

                x0 = x;
                y0 = y;
                t0 = t;

                top -= 1;
                x = pointStack[top][0];
                y = pointStack[top][1];
                depth = depthStack[top] + 1;
                i = dyadicStack[top] * 2;

            } while (top > 0 && j < 500000);

            curve.numberPoints = curve.points.length;

            return curve;
        },

        //----------------------------------------------------------------------
        // Plot algorithm v2
        //----------------------------------------------------------------------

        /**
         * Add a point to the curve plot. If the new point is too close to the previously inserted point,
         * it is skipped.
         * Used in {@link JXG.Curve._plotRecursive}.
         *
         * @private
         * @param {JXG.Coords} pnt Coords to add to the list of points
         */
        _insertPoint_v2: function (curve, pnt, t) {
            var lastReal = !isNaN(this._lastCrds[1] + this._lastCrds[2]),     // The last point was real
                newReal = !isNaN(pnt.scrCoords[1] + pnt.scrCoords[2]),        // New point is real point
                cw = curve.board.canvasWidth,
                ch = curve.board.canvasHeight,
                off = 500;

            newReal = newReal &&
                        (pnt.scrCoords[1] > -off && pnt.scrCoords[2] > -off &&
                         pnt.scrCoords[1] < cw + off && pnt.scrCoords[2] < ch + off);

            /*
             * Prevents two consecutive NaNs or points wich are too close
             */
            if ((!newReal && lastReal) ||
                    (newReal && (!lastReal ||
                        Math.abs(pnt.scrCoords[1] - this._lastCrds[1]) > 0.7 ||
                        Math.abs(pnt.scrCoords[2] - this._lastCrds[2]) > 0.7))) {
                pnt._t = t;
                curve.points.push(pnt);
                this._lastCrds = pnt.copy('scrCoords');
            }
        },


        /**
         * Investigate a function term at the bounds of intervals where
         * the function is not defined, e.g. log(x) at x = 0.
         *
         * c is inbetween a and b
         * @private
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Array} c Screen coordinates of the bisection point at (ta + tb) / 2
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} tc (ta + tb) / 2 = tc. Parameter which evaluates to b, i.e. [1, X(tc), Y(tc)] = c in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @returns {JXG.Boolean} true if the point is inserted and the recursion should stop, false otherwise.
         */
        _borderCase: function (curve, a, b, c, ta, tb, tc, depth) {
            var t, pnt, p,
                p_good = null,
                j,
                max_it = 30,
                is_undef = false,
                t_nan, t_real, t_real2,
                vx, vy, vx2, vy2, dx, dy;
                // asymptote;

            if (depth <= 1) {
               pnt = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false);
               j = 0;
               // Bisect a, b and c until the point t_real is inside of the definition interval
               // and as close as possible at the boundary.
               // t_real2 is the second closest point.
               do {
                   // There are four cases:
                   //  a  |  c  |  b
                   // ---------------
                   // inf | R   | R
                   // R   | R   | inf
                   // inf | inf | R
                   // R   | inf | inf
                   //
                   if (isNaN(a[1] + a[2]) && !isNaN(c[1] + c[2])) {
                       t_nan = ta;
                       t_real = tc;
                       t_real2 = tb;
                   } else if (isNaN(b[1] + b[2]) && !isNaN(c[1] + c[2])) {
                       t_nan = tb;
                       t_real = tc;
                       t_real2 = ta;
                   } else if (isNaN(c[1] + c[2]) && !isNaN(b[1] + b[2])) {
                       t_nan = tc;
                       t_real = tb;
                       t_real2 = tb + (tb - tc);
                   } else if (isNaN(c[1] + c[2]) && !isNaN(a[1] + a[2])) {
                       t_nan = tc;
                       t_real = ta;
                       t_real2 = ta - (tc - ta);
                   } else {
                       return false;
                   }
                   t = 0.5 * (t_nan + t_real);
                   pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, true), curve.Y(t, true)], false);
                   p = pnt.usrCoords;

                   is_undef = isNaN(p[1] + p[2]);
                   if (is_undef) {
                       t_nan = t;
                   } else {
                       t_real2 = t_real;
                       t_real = t;
                   }
                   ++j;
               } while (is_undef && j < max_it);

               // If bisection was successful, take this point.
               // Usefule only for general curves, for function graph
               // the code below overwrite p_good from here.
               if (j < max_it) {
                   p_good = p.slice();
                   c = p.slice();
                   t_real = t;
               }

               // OK, bisection has been done now.
               // t_real contains the closest inner point to the border of the interval we could find.
               // t_real2 is the second nearest point to this boundary.
               // Now we approximate the derivative by computing the slope of the line through these two points
               // and test if it is "infinite", i.e larger than 400 in absolute values.
               //
               vx = curve.X(t_real, true) ;
               vx2 = curve.X(t_real2, true) ;
               dx = (vx - vx2) / (t_real - t_real2);
               vy = curve.Y(t_real, true) ;
               vy2 = curve.Y(t_real2, true) ;
               dy = (vy - vy2) / (t_real - t_real2);

               if (p_good !== null) {
                   this._insertPoint_v2(curve, new Coords(Const.COORDS_BY_USER, p_good, curve.board, false));
                   return true;
               }
           }
           return false;
       },

        /**
         * Recursive interval bisection algorithm for curve plotting.
         * Used in {@link JXG.Curve.updateParametricCurve}.
         * @private
         * @deprecated
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @param {Number} delta If the distance of the bisection point at (ta + tb) / 2 from the point (a + b) / 2 is less then delta,
         *                 the segment [a,b] is regarded as straight line.
         * @returns {JXG.Curve} Reference to the curve object.
         */
        _plotRecursive_v2: function (curve, a, ta, b, tb, depth, delta) {
            var tc, c,
                ds, mindepth = 0,
                isSmooth, isJump, isCusp,
                cusp_threshold = 0.5,
                jump_threshold = 0.99,
                pnt = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false);

            if (curve.numberPoints > 65536) {
                return;
            }

            // Test if the function is undefined in an interval
            if (depth < this.nanLevel && this._isUndefined(curve, a, ta, b, tb)) {
                return this;
            }

            if (depth < this.nanLevel && this._isOutside(a, ta, b, tb, curve.board)) {
                return this;
            }

            tc = (ta  + tb) * 0.5;
            pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(tc, true), curve.Y(tc, true)], false);
            c = pnt.scrCoords;

            if (this._borderCase(curve, a, b, c, ta, tb, tc, depth)) {
                return this;
            }

            ds = this._triangleDists(a, b, c);           // returns [d_ab, d_ac, d_cb, d_cd]

            isSmooth = (depth < this.smoothLevel) && (ds[3] < delta);

            isJump = (depth < this.jumpLevel) &&
                        ((ds[2] > jump_threshold * ds[0]) ||
                         (ds[1] > jump_threshold * ds[0]) ||
                        ds[0] === Infinity || ds[1] === Infinity || ds[2] === Infinity);

            isCusp = (depth < this.smoothLevel + 2) && (ds[0] < cusp_threshold * (ds[1] + ds[2]));

            if (isCusp) {
                mindepth = 0;
                isSmooth = false;
            }

            --depth;

            if (isJump) {
                this._insertPoint_v2(curve, new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], curve.board, false), tc);
            } else if (depth <= mindepth || isSmooth) {
                this._insertPoint_v2(curve, pnt, tc);
                //if (this._borderCase(a, b, c, ta, tb, tc, depth)) {}
            } else {
                this._plotRecursive_v2(curve, a, ta, c, tc, depth, delta);
                this._insertPoint_v2(curve, pnt, tc);
                this._plotRecursive_v2(curve, c, tc, b, tb, depth, delta);
            }

            return this;
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>true</tt>.
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurve_v2: function (curve, mi, ma) {
            var ta, tb, a, b,
                suspendUpdate = false,
                pa = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                pb = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                depth, delta,
                w2, h2, bbox,
                ret_arr;

            //console.time("plot");
            if (curve.board.updateQuality === curve.board.BOARD_QUALITY_LOW) {
                depth = Type.evaluate(curve.visProp.recursiondepthlow) || 13;
                delta = 2;
                // this.smoothLevel = 5; //depth - 7;
                this.smoothLevel = depth - 6;
                this.jumpLevel = 3;
            } else {
                depth = Type.evaluate(curve.visProp.recursiondepthhigh) || 17;
                delta = 2;
                // smoothLevel has to be small for graphs in a huge interval.
                // this.smoothLevel = 3; //depth - 7; // 9
                this.smoothLevel = depth - 9; // 9
                this.jumpLevel = 2;
            }
            this.nanLevel = depth - 4;

            curve.points = [];

            if (this.xterm === 'x') {
                // For function graphs we can restrict the plot interval
                // to the visible area +plus margin
                bbox = curve.board.getBoundingBox();
                w2 = (bbox[2] - bbox[0]) * 0.3;
                h2 = (bbox[1] - bbox[3]) * 0.3;
                ta = Math.max(mi, bbox[0] - w2);
                tb = Math.min(ma, bbox[2] + w2);
            } else {
                ta = mi;
                tb = ma;
            }
            pa.setCoordinates(Const.COORDS_BY_USER, [curve.X(ta, suspendUpdate), curve.Y(ta, suspendUpdate)], false);

            // The first function calls of X() and Y() are done. We can now
            // switch `suspendUpdate` on. If supported by the functions, this
            // avoids for the rest of the plotting algorithm, evaluation of any
            // parent elements.
            suspendUpdate = true;

            pb.setCoordinates(Const.COORDS_BY_USER, [curve.X(tb, suspendUpdate), curve.Y(tb, suspendUpdate)], false);

            // Find start and end points of the visible area (plus a certain margin)
            ret_arr = this._findStartPoint(curve, pa.scrCoords, ta, pb.scrCoords, tb);
            pa.setCoordinates(Const.COORDS_BY_SCREEN, ret_arr[0], false);
            ta = ret_arr[1];
            ret_arr = this._findStartPoint(curve, pb.scrCoords, tb, pa.scrCoords, ta);
            pb.setCoordinates(Const.COORDS_BY_SCREEN, ret_arr[0], false);
            tb = ret_arr[1];

            // Save the visible area.
            // This can be used in Curve.hasPoint().
            this._visibleArea = [ta, tb];

            // Start recursive plotting algorithm
            a = pa.copy('scrCoords');
            b = pb.copy('scrCoords');
            pa._t = ta;
            curve.points.push(pa);
            this._lastCrds = pa.copy('scrCoords');   // Used in _insertPoint
            this._plotRecursive_v2(curve, a, ta, b, tb, depth, delta);
            pb._t = tb;
            curve.points.push(pb);

            curve.numberPoints = curve.points.length;
            //console.timeEnd("plot");

            return curve;
        },

        //----------------------------------------------------------------------
        // Plot algorithm v3
        //----------------------------------------------------------------------
        /**
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {*} pnt
         * @param {*} t
         * @param {*} depth
         * @param {*} limes
         * @private
         */
        _insertLimesPoint: function(curve, pnt, t, depth, limes) {
            var p0, p1, p2;

            // Ignore jump point if it follows limes
            if ((Math.abs(this._lastUsrCrds[1]) === Infinity && Math.abs(limes.left_x) === Infinity) ||
                (Math.abs(this._lastUsrCrds[2]) === Infinity && Math.abs(limes.left_y) === Infinity)) {
                // console.log("SKIP:", pnt.usrCoords, this._lastUsrCrds, limes);
                return;
            }

            // // Ignore jump left from limes
            // if (Math.abs(limes.left_x) > 100 * Math.abs(this._lastUsrCrds[1])) {
            //     x = Math.sign(limes.left_x) * Infinity;
            // } else {
            //     x = limes.left_x;
            // }
            // if (Math.abs(limes.left_y) > 100 * Math.abs(this._lastUsrCrds[2])) {
            //     y = Math.sign(limes.left_y) * Infinity;
            // } else {
            //     y = limes.left_y;
            // }
            // //pnt.setCoordinates(Const.COORDS_BY_USER, [x, y], false);

            // Add points at a jump. pnt contains [NaN, NaN]
            //console.log("Add", t, pnt.usrCoords, limes, depth)
            p0 = new Coords(Const.COORDS_BY_USER, [limes.left_x, limes.left_y], curve.board);
            p0._t = t;
            curve.points.push(p0);

            if (!isNaN(limes.left_x) && !isNaN(limes.left_y) && !isNaN(limes.right_x) && !isNaN(limes.right_y) &&
                (Math.abs(limes.left_x - limes.right_x) > Mat.eps || Math.abs(limes.left_y - limes.right_y) > Mat.eps)) {
                p1 = new Coords(Const.COORDS_BY_SCREEN, pnt, curve.board);
                p1._t = t;
                curve.points.push(p1);
            }

            p2 = new Coords(Const.COORDS_BY_USER, [limes.right_x, limes.right_y], curve.board);
            p2._t = t;
            curve.points.push(p2);
            this._lastScrCrds = p2.copy('scrCoords');
            this._lastUsrCrds = p2.copy('usrCoords');

        },

        /**
         * Add a point to the curve plot. If the new point is too close to the previously inserted point,
         * it is skipped.
         * Used in {@link JXG.Curve._plotRecursive}.
         *
         * @private
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {JXG.Coords} pnt Coords to add to the list of points
         */
        _insertPoint: function (curve, pnt, t, depth, limes) {
            var last_is_real = !isNaN(this._lastScrCrds[1] + this._lastScrCrds[2]),     // The last point was real
                point_is_real  = !isNaN(pnt[1] + pnt[2]),                               // New point is real point
                cw = curve.board.canvasWidth,
                ch = curve.board.canvasHeight,
                p,
                near = 0.8,
                off = 500;

            if (Type.exists(limes)) {
                this._insertLimesPoint(curve, pnt, t, depth, limes);
                return;
            }

            // Check if point has real coordinates and
            // coordinates are not too far away from canvas.
            point_is_real = point_is_real &&
                        (pnt[1] > -off     && pnt[2] > -off &&
                         pnt[1] < cw + off && pnt[2] < ch + off);

            // Prevent two consecutive NaNs
            if (!last_is_real && !point_is_real) {
                return;
            }

            // Prevent two consecutive points which are too close
            if (point_is_real && last_is_real &&
                Math.abs(pnt[1] - this._lastScrCrds[1]) < near &&
                Math.abs(pnt[2] - this._lastScrCrds[2]) < near) {
                return;
            }

            // Prevent two consecutive points at infinity (either direction)
            if ((Math.abs(pnt[1]) === Infinity &&
                 Math.abs(this._lastUsrCrds[1]) === Infinity) ||
                (Math.abs(pnt[2]) === Infinity &&
                 Math.abs(this._lastUsrCrds[2]) === Infinity)) {
                return;
            }

            //console.log("add", t, pnt.usrCoords, depth)
            // Add regular point
            p = new Coords(Const.COORDS_BY_SCREEN, pnt, curve.board);
            p._t = t;
            curve.points.push(p);
            this._lastScrCrds = p.copy('scrCoords');
            this._lastUsrCrds = p.copy('usrCoords');
        },

        /**
         * Compute distances in screen coordinates between the points ab,
         * ac, cb, and cd, where d = (a + b)/2.
         * cd is used for the smoothness test, ab, ac, cb are used to detect jumps, cusps and poles.
         *
         * @private
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Array} c Screen coordinates of the bisection point at (ta + tb) / 2
         * @returns {Array} array of distances in screen coordinates between: ab, ac, cb, and cd.
         */
        _triangleDists: function (a, b, c) {
            var d, d_ab, d_ac, d_cb, d_cd;

            d = [a[0] * b[0], (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5];

            d_ab = Geometry.distance(a, b, 3);
            d_ac = Geometry.distance(a, c, 3);
            d_cb = Geometry.distance(c, b, 3);
            d_cd = Geometry.distance(c, d, 3);

            return [d_ab, d_ac, d_cb, d_cd];
        },

        /**
         * Test if the function is undefined on an interval:
         * If the interval borders a and b are undefined, 20 random values
         * are tested if they are undefined, too.
         * Only if all values are undefined, we declare the function to be undefined in this interval.
         *
         * @private
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         */
        _isUndefined: function (curve, a, ta, b, tb) {
            var t, i, pnt;

            if (!isNaN(a[1] + a[2]) || !isNaN(b[1] + b[2])) {
                return false;
            }

            pnt = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false);

            for (i = 0; i < 20; ++i) {
                t = ta + Math.random() * (tb - ta);
                pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, true), curve.Y(t, true)], false);
                if (!isNaN(pnt.scrCoords[0] + pnt.scrCoords[1] + pnt.scrCoords[2])) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Decide if a path segment is too far from the canvas that we do not need to draw it.
         * @private
         * @param  {Array}  a  Screen coordinates of the start point of the segment
         * @param  {Array}  ta Curve parameter of a  (unused).
         * @param  {Array}  b  Screen coordinates of the end point of the segment
         * @param  {Array}  tb Curve parameter of b (unused).
         * @param  {JXG.Board} board
         * @returns {Boolean}   True if the segment is too far away from the canvas, false otherwise.
         */
        _isOutside: function (a, ta, b, tb, board) {
            var off = 500,
                cw = board.canvasWidth,
                ch = board.canvasHeight;

            return !!((a[1] < -off && b[1] < -off) ||
                (a[2] < -off && b[2] < -off) ||
                (a[1] > cw + off && b[1] > cw + off) ||
                (a[2] > ch + off && b[2] > ch + off));
        },

        /**
         * Decide if a point of a curve is too far from the canvas that we do not need to draw it.
         * @private
         * @param {Array}  a  Screen coordinates of the point
         * @param {JXG.Board} board
         * @returns {Boolean}  True if the point is too far away from the canvas, false otherwise.
         */
        _isOutsidePoint: function (a, board) {
            var off = 500,
                cw = board.canvasWidth,
                ch = board.canvasHeight;

            return !!(a[1] < -off ||
                      a[2] < -off ||
                      a[1] > cw + off ||
                      a[2] > ch + off);
        },

        /**
         * For a curve c(t) defined on the interval [ta, tb] find the first point
         * which is in the visible area of the board (plus some outside margin).
         * <p>
         * This method is necessary to restrict the recursive plotting algorithm
         * {@link JXG.Curve._plotRecursive} to the visible area and not waste
         * recursion to areas far outside of the visible area.
         * <p>
         * This method can also be used to find the last visible point
         * by reversing the input parameters.
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param  {Array}  ta Curve parameter of a.
         * @param  {Array}  b  Screen coordinates of the end point of the segment (unused)
         * @param  {Array}  tb Curve parameter of b
         * @return {Array}  Array of length two containing the screen ccordinates of
         * the starting point and the curve parameter at this point.
         * @private
         */
        _findStartPoint: function (curve, a, ta, b, tb) {
            var i, delta, tc,
                td, z, isFound,
                w2, h2,
                pnt =  new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                steps = 40,
                eps = 0.01,
                fnX1, fnX2, fnY1, fnY2,
                bbox = curve.board.getBoundingBox();

            if (!this._isOutsidePoint(a, curve.board)) {
                return [a, ta];
            }

            w2 = (bbox[2] - bbox[0]) * 0.3;
            h2 = (bbox[1] - bbox[3]) * 0.3;
            bbox[0] -= w2;
            bbox[1] += h2;
            bbox[2] += w2;
            bbox[3] -= h2;

            delta = (tb - ta) / steps;
            tc = ta + delta;
            isFound = false;

            fnX1 = function(t) { return curve.X(t, true) - bbox[0]; };
            fnY1 = function(t) { return curve.Y(t, true) - bbox[1]; };
            fnX2 = function(t) { return curve.X(t, true) - bbox[2]; };
            fnY2 = function(t) { return curve.Y(t, true) - bbox[3]; };
            for (i = 0; i < steps; ++i) {
                // Left border
                z = bbox[0];
                td = Numerics.root(fnX1, [tc - delta, tc], curve);
                // td = Numerics.fzero(fnX1, [tc - delta, tc], this);
                // console.log("A", tc - delta, tc, td, Math.abs(this.X(td, true) - z));
                if (Math.abs(curve.X(td, true) - z) < eps) { //} * Math.abs(z)) {
                    isFound = true;
                    break;
                }
                // Top border
                z = bbox[1];
                td = Numerics.root(fnY1, [tc - delta, tc], curve);
                // td = Numerics.fzero(fnY1, [tc - delta, tc], this);
                // console.log("B", tc - delta, tc, td, Math.abs(this.Y(td, true) - z));
                if (Math.abs(curve.Y(td, true) - z) < eps) { // * Math.abs(z)) {
                    isFound = true;
                    break;
                }
                // Right border
                z = bbox[2];
                td = Numerics.root(fnX2, [tc - delta, tc], curve);
                // td = Numerics.fzero(fnX2, [tc - delta, tc], this);
                // console.log("C", tc - delta, tc, td, Math.abs(this.X(td, true) - z));
                if (Math.abs(curve.X(td, true) - z) < eps) { // * Math.abs(z)) {
                    isFound = true;
                    break;
                }
                // Bottom border
                z = bbox[3];
                td = Numerics.root(fnY2, [tc - delta, tc], curve);
                // td = Numerics.fzero(fnY2, [tc - delta, tc], this);
                // console.log("D", tc - delta, tc, td, Math.abs(this.Y(td, true) - z));
                if (Math.abs(curve.Y(td, true) - z) < eps) { // * Math.abs(z)) {
                    isFound = true;
                    break;
                }
                tc += delta;
            }
            if (isFound) {
                pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(td, true), curve.Y(td, true)], false);
                return [pnt.scrCoords, td];
            } else {
                console.log("TODO _findStartPoint", this.Y.toString(), tc);
                pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(ta, true), curve.Y(ta, true)], false);
                return [pnt.scrCoords, ta];
            }
        },

        /**
         * Investigate a function term at the bounds of intervals where
         * the function is not defined, e.g. log(x) at x = 0.
         *
         * c is inbetween a and b
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Array} c Screen coordinates of the bisection point at (ta + tb) / 2
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} tc (ta + tb) / 2 = tc. Parameter which evaluates to b, i.e. [1, X(tc), Y(tc)] = c in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @returns {JXG.Boolean} true if the point is inserted and the recursion should stop, false otherwise.
         *
         * @private
         */
        _getBorderPos: function(curve, ta, a, tc, c, tb, b) {
            var t, pnt, p,
                j,
                max_it = 30,
                is_undef = false,
                t_real2,
                t_good, t_bad;

            pnt = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false);
            j = 0;
            // Bisect a, b and c until the point t_real is inside of the definition interval
            // and as close as possible at the boundary.
            // t_real2 is the second closest point.
            // There are four cases:
            //  a  |  c  |  b
            // ---------------
            // inf | R   | R
            // R   | R   | inf
            // inf | inf | R
            // R   | inf | inf
            //
            if (isNaN(a[1] + a[2]) && !isNaN(c[1] + c[2])) {
                t_bad = ta;
                t_good = tc;
                t_real2 = tb;
            } else if (isNaN(b[1] + b[2]) && !isNaN(c[1] + c[2])) {
                t_bad = tb;
                t_good = tc;
                t_real2 = ta;
            } else if (isNaN(c[1] + c[2]) && !isNaN(b[1] + b[2])) {
                t_bad = tc;
                t_good = tb;
                t_real2 = tb + (tb - tc);
            } else if (isNaN(c[1] + c[2]) && !isNaN(a[1] + a[2])) {
                t_bad = tc;
                t_good = ta;
                t_real2 = ta - (tc - ta);
            } else {
                return false;
            }
            do {
                t = 0.5 * (t_good + t_bad);
                pnt.setCoordinates(Const.COORDS_BY_USER, [curve.X(t, true), curve.Y(t, true)], false);
                p = pnt.usrCoords;
                is_undef = isNaN(p[1] + p[2]);
                if (is_undef) {
                    t_bad = t;
                } else {
                    t_real2 = t_good;
                    t_good = t;
                }
                ++j;
            } while (j < max_it && Math.abs(t_good - t_bad) > Mat.eps);
            return t;
        },

        /**
         * 
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} ta
         * @param {Number} tb
         */
        _getCuspPos: function(curve, ta, tb) {
            var a = [curve.X(ta, true), curve.Y(ta, true)],
                b = [curve.X(tb, true), curve.Y(tb, true)],
                max_func = function(t) {
                    var c = [curve.X(t, true), curve.Y(t, true)];
                    return -(Math.sqrt((a[0] - c[0]) * (a[0] - c[0]) + (a[1] - c[1]) * (a[1] - c[1])) +
                            Math.sqrt((b[0] - c[0]) * (b[0] - c[0]) + (b[1] - c[1]) * (b[1] - c[1])));
                };

            return Numerics.fminbr(max_func, [ta, tb], curve);
        },

        /**
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} ta
         * @param {Number} tb
         */
        _getJumpPos: function(curve, ta, tb) {
            var max_func = function(t) {
                    var e = Mat.eps * Mat.eps,
                        c1 = [curve.X(t, true), curve.Y(t, true)],
                        c2 = [curve.X(t + e, true), curve.Y(t + e, true)];
                    return -Math.abs( (c2[1] - c1[1]) / (c2[0] - c1[0]) );
                };

            return Numerics.fminbr(max_func, [ta, tb], curve);
        },

        /**
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} t
         * @private
         */
        _getLimits: function(curve, t) {
            var res,
                step = 2 / (curve.maxX() - curve.minX()),
                x_l, x_r, y_l, y_r;

            // From left
            res = Extrapolate.limit(t, -step, curve.X);
            x_l = res[0];
            if (res[1] === 'infinite') {
                x_l = Math.sign(x_l) * Infinity;
            }

            res = Extrapolate.limit(t, -step, curve.Y);
            y_l = res[0];
            if (res[1] === 'infinite') {
                y_l = Math.sign(y_l) * Infinity;
            }

            // From right
            res = Extrapolate.limit(t, step, curve.X);
            x_r = res[0];
            if (res[1] === 'infinite') {
                x_r = Math.sign(x_r) * Infinity;
            }

            res = Extrapolate.limit(t, step, curve.Y);
            y_r = res[0];
            if (res[1] === 'infinite') {
                y_r = Math.sign(y_r) * Infinity;
            }

            return {
                    left_x: x_l,
                    left_y: y_l,
                    right_x: x_r,
                    right_y: y_r,
                    t: t
                };
        },

        /**
         *
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a
         * @param {Number} tc
         * @param {Array} c
         * @param {Number} tb
         * @param {Array} b
         * @param {String} may_be_special
         * @param {Number} depth
         * @private
         */
        _getLimes: function(curve, ta, a, tc, c, tb, b, may_be_special, depth) {
            var t;

            if (may_be_special === 'border') {
                t = this._getBorderPos(curve, ta, a, tc, c, tb, b);
            } else if (may_be_special === 'cusp') {
                t = this._getCuspPos(curve, ta, tb);
            } else if (may_be_special === 'jump') {
                t = this._getJumpPos(curve, ta, tb);
            }
            return this._getLimits(curve, t);
        },

        /**
         * Recursive interval bisection algorithm for curve plotting.
         * Used in {@link JXG.Curve.updateParametricCurve}.
         * @private
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @param {Number} delta If the distance of the bisection point at (ta + tb) / 2 from the point (a + b) / 2 is less then delta,
         *                 the segment [a,b] is regarded as straight line.
         * @returns {JXG.Curve} Reference to the curve object.
         */
        _plotNonRecursive: function (curve, a, ta, b, tb, d) {
            var tc, c, ds,
                mindepth = 0,
                limes = null,
                a_nan, b_nan,
                isSmooth = false,
                may_be_special = '',
                x, y, oc, depth, ds0,
                stack = [],
                stack_length = 0,
                item;

            oc = curve.board.origin.scrCoords;
            stack[stack_length++] = [a, ta, b, tb, d, Infinity];
            while (stack_length > 0) {
                // item = stack.pop();
                item = stack[--stack_length];
                a = item[0];
                ta = item[1];
                b = item[2];
                tb = item[3];
                depth = item[4];
                ds0 = item[5];

                isSmooth = false;
                may_be_special = '';
                limes = null;
                //console.log(stack.length, item)

                if (curve.points.length > 65536) {
                    return;
                }

                if (depth < this.nanLevel) {
                    // Test if the function is undefined in the whole interval [ta, tb]
                    if (this._isUndefined(curve, a, ta, b, tb)) {
                        continue;
                    }
                    // Test if the graph is far outside the visible are for the interval [ta, tb]
                    if (this._isOutside(a, ta, b, tb, curve.board)) {
                        continue;
                    }
                }

                tc = (ta  + tb) * 0.5;

                // Screen coordinates of point at tc
                x = curve.X(tc, true);
                y = curve.Y(tc, true);
                c = [1, oc[1] + x * curve.board.unitX, oc[2] - y * curve.board.unitY];
                ds = this._triangleDists(a, b, c);           // returns [d_ab, d_ac, d_cb, d_cd]

                a_nan = isNaN(a[1] + a[2]);
                b_nan = isNaN(b[1] + b[2]);
                if ((a_nan && !b_nan) || (!a_nan && b_nan)) {
                    may_be_special = 'border';
                } else if (ds[0] > 0.66 * ds0 ||
                            ds[0] < this.cusp_threshold * (ds[1] + ds[2]) ||
                            ds[1] > 5 * ds[2] ||
                            ds[2] > 5 * ds[1]) {
                    may_be_special = 'cusp';
                } else if ((ds[2] > this.jump_threshold * ds[0]) ||
                           (ds[1] > this.jump_threshold * ds[0]) ||
                            ds[0] === Infinity || ds[1] === Infinity || ds[2] === Infinity) {
                    may_be_special = 'jump';
                }
                isSmooth = (may_be_special === '' && depth < this.smoothLevel && ds[3] < this.smooth_threshold);

                if (depth < this.testLevel && !isSmooth) {
                    if (may_be_special === '') {
                        isSmooth = true;
                    } else {
                        limes = this._getLimes(curve, ta, a, tc, c, tb, b, may_be_special, depth);
                    }
                }

                if (limes !== null) {
                    c = [1, NaN, NaN];
                    this._insertPoint(curve, c, tc, depth, limes);
                } else if (depth <= mindepth || isSmooth) {
                    this._insertPoint(curve, c, tc, depth, null);
                } else {
                    stack[stack_length++] = [c, tc, b, tb, depth - 1, ds[0]];
                    stack[stack_length++] = [a, ta, c, tc, depth - 1, ds[0]];
                }
            }

            return this;
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>true</tt>.
         * @param {JXG.Curve} curve JSXGraph curve element
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurve: function (curve, mi, ma) {
            var ta, tb, a, b,
                suspendUpdate = false,
                pa = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                pb = new Coords(Const.COORDS_BY_USER, [0, 0], curve.board, false),
                depth,
                w2, h2, bbox,
                ret_arr;

            // console.log("-----------------------------------------------------------");
            // console.time("plot");
            if (curve.board.updateQuality === curve.board.BOARD_QUALITY_LOW) {
                depth = Type.evaluate(curve.visProp.recursiondepthlow) || 14;
            } else {
                depth = Type.evaluate(curve.visProp.recursiondepthhigh) || 17;
            }

            // smoothLevel has to be small for graphs in a huge interval.
            this.smoothLevel = 7; //depth - 10;
            this.nanLevel = depth - 4;
            this.testLevel = 4;
            this.cusp_threshold = 0.5;
            this.jump_threshold = 0.99;
            this.smooth_threshold = 2;

            curve.points = [];

            if (curve.xterm === 'x') {
                // For function graphs we can restrict the plot interval
                // to the visible area +plus margin
                bbox = curve.board.getBoundingBox();
                w2 = (bbox[2] - bbox[0]) * 0.3;
                h2 = (bbox[1] - bbox[3]) * 0.3;
                ta = Math.max(mi, bbox[0] - w2);
                tb = Math.min(ma, bbox[2] + w2);
            } else {
                ta = mi;
                tb = ma;
            }
            pa.setCoordinates(Const.COORDS_BY_USER, [curve.X(ta, suspendUpdate), curve.Y(ta, suspendUpdate)], false);

            // The first function calls of X() and Y() are done. We can now
            // switch `suspendUpdate` on. If supported by the functions, this
            // avoids for the rest of the plotting algorithm, evaluation of any
            // parent elements.
            suspendUpdate = true;

            pb.setCoordinates(Const.COORDS_BY_USER, [curve.X(tb, suspendUpdate), curve.Y(tb, suspendUpdate)], false);

            // Find start and end points of the visible area (plus a certain margin)
            ret_arr = this._findStartPoint(curve, pa.scrCoords, ta, pb.scrCoords, tb);
            pa.setCoordinates(Const.COORDS_BY_SCREEN, ret_arr[0], false);
            ta = ret_arr[1];
            ret_arr = this._findStartPoint(curve, pb.scrCoords, tb, pa.scrCoords, ta);
            pb.setCoordinates(Const.COORDS_BY_SCREEN, ret_arr[0], false);
            tb = ret_arr[1];

            // Save the visible area.
            // This can be used in Curve.hasPoint().
            this._visibleArea = [ta, tb];

            // Start recursive plotting algorithm
            a = pa.copy('scrCoords');
            b = pb.copy('scrCoords');
            pa._t = ta;
            curve.points.push(pa);
            this._lastScrCrds = pa.copy('scrCoords');   // Used in _insertPoint
            this._lastUsrCrds = pa.copy('usrCoords');   // Used in _insertPoint

            this._plotNonRecursive(curve, a, ta, b, tb, depth);

            pb._t = tb;
            curve.points.push(pb);

            curve.numberPoints = curve.points.length;
            // console.timeEnd("plot");
            // console.log("number of points:", this.numberPoints);

            return curve;
        },

        //----------------------------------------------------------------------
        // Plot algorithm v4
        //----------------------------------------------------------------------

        _criticalPoints: function(vec, le, level) {
            var i, med,
                isGroup   = false,
                abs_vec,
                very_small = false,
                group     = 0,
                groups    = [],
                positions = [];

            abs_vec = Statistics.abs(vec);
            med = Statistics.median(abs_vec);
            if (med < 1.0e-12) {
                med = 1.0e-8;
                very_small = true;
            } else {
                med *= this.criticalThreshold;
            }
            // console.log("Median", med);
            for (i = 0; i < le; i++) {
                if (abs_vec[i] > med)  {
                    positions.push({i: i, v: vec[i], group: group});
                    if (!isGroup) {
                        isGroup = true;
                    }
                } else {
                    if (isGroup) {
                        groups.push(positions.slice(0));
                        positions = [];
                        isGroup = false;
                        group++;
                    }
                }
            }
            if (isGroup) {
                groups.push(positions.slice(0));
                positions = [];
            }

            if (very_small && groups.length === 0) {
                return false;
            }
            return groups;
        },

        Component: function() {
            this.left_isNaN =  false;
            this.right_isNaN = false;
            this.left_t = null;
            this.right_t = null;
            this.t_values = [];
            this.x_values = [];
            this.y_values = [];
            this.len = 0;
        },

        findComponents: function(curve, mi, ma, steps) {
            var i, t, le, h, x, y,
                components = [],
                comp,
                comp_nr = 0,
                cnt = 0,
                comp_started = false,
                suspended = false;

            h = (ma - mi) / steps;
            components[comp_nr] = new this.Component();
            comp = components[comp_nr];
            for (i = 0, t = mi; i <= steps; i++, t += h) {
                x = curve.X(t, suspended);
                y = curve.Y(t, suspended);

                if (isNaN(y) || isNaN(y)) {
                    if (comp_started) {
                        // Finalize a component
                        comp.right_isNaN = true;
                        comp.right_t = t;
                        comp.len = cnt;

                        // Prepare a new component
                        comp_started = false;
                        comp_nr++;
                        components[comp_nr] =  new this.Component();
                        comp = components[comp_nr];
                    } else {
                        // Wait for the component to have non-NaN entries
                        comp.left_isNaN = true;
                        comp.left_t = t;
                    }
                } else {
                    // Now there ia non-NaN entry.
                    if (!comp_started) {
                        // Start the component
                        comp_started = true;
                        cnt = 0;
                    }
                    // Add the value to the component
                    comp.t_values[cnt] = t;
                    comp.x_values[cnt] = x;
                    comp.y_values[cnt] = y;
                    cnt++;
                }
                if (i === 0) {
                    suspended = true;
                }
            }
            if (comp_started) {
                comp.len = cnt;
            } else {
                components.pop();
            }

            return components;
        },

        getPointType: function(curve, pos, t_values, x_values, y_values, x_slopes, y_slopes, len) {
            var h, delta,
                a, b,
                // d0, d1, dd,
                h0, ta, tb, tc,
                pos2m, pos1m, pos1p,
                result = {
                    idx: pos,
                    t: t_values[pos],
                    x: x_values[pos],
                    y: y_values[pos]
                };

            pos2m = pos - 2;
            pos1m = pos - 1;
            pos1p = pos + 1;

            if (pos1m < 0) {
                result.type = 'borderleft';
                console.log('Border left', result.t);
                return result;
            }
            if (pos1p >= len) {
                result.type = 'borderright';
                console.log('Border right', result.t);
                return result;
            }
            if (pos2m < 0) {
                result.type = 'borderleft';
                result.idx = pos1m;
                result.t = t_values[pos1m];
                result.x = x_values[pos1m];
                result.y = y_values[pos1m];
                console.log('Border left', result.t);
                return result;
            }

            // console.log("Left", pos2m, t_values[pos2m], y_values[pos2m], y_slopes[pos2m])
            // console.log("Left", pos1m, t_values[pos1m], y_values[pos1m], y_slopes[pos1m])
            // console.log("Center", pos, t_values[pos], y_values[pos], y_slopes[pos])
            // console.log("Right", pos1p, t_values[pos1p], y_values[pos1p], y_slopes[pos1p])

            h = t_values[pos] - t_values[pos1m];
            if (y_slopes[pos2m] * y_slopes[pos1p] > 0.0) {
                // Same slope on both sides
                // console.log("Same slopes", t_values[pos]);

                // Now, we test if the slope changes direction inbetween.
                // This is a hint for a jump.
                result.type = 'jump';
                if (y_slopes[pos2m] * y_slopes[pos1m] < 0) {
                    // console.log("Jump 1");
                    ta = t_values[pos2m];
                    tc = t_values[pos];
                    tb = t_values[pos1p];
                } else if (y_slopes[pos1m] * y_slopes[pos] < 0) {
                    // console.log("Jump 2");
                    ta = t_values[pos1m];
                    tc = t_values[pos];
                    tb = t_values[pos1p];

                    // d0 = y_slopes[pos1m] - y_slopes[pos2m];
                    // d1 = y_slopes[pos] - y_slopes[pos1m];
                    // dd = d1 - d0;
                    // a = dd / (h * h * h);
                    // b = d1 / (h * h) - a * t_values[pos1m];
                    // console.log(b);
                    // b = d0 / (4 * h * h) - a * t_values[pos2m];
                    // console.log(b);
                    // console.log(-b / a);
                } else if (Math.abs(y_slopes[pos]) > 10 * Math.abs(y_slopes[pos1m]) &&
                            Math.abs(y_slopes[pos]) > 10 * Math.abs(y_slopes[pos1p])) {
                    result.type = 'jump';
                } else {
                    // console.log("cusp");
                    result.type = 'cusp';
                }
            } else {
                // console.log("Opposite slopes: cusp", t_values[pos]);
                // Opposite slopes
                // This may be a cusp.
                //console.log(y_slopes[pos1m], y_slopes[pos], y_slopes[pos1p])
                if (/*Math.abs(y_slopes[pos]) > 10 * Math.abs(y_slopes[pos1m]) &&
                    Math.abs(y_slopes[pos]) > 10 * Math.abs(y_slopes[pos1p])*/
                    Math.abs(x_values[pos1p] - x_values[pos]) > 0.01 ||
                    Math.abs(x_values[pos] - x_values[pos1p]) > 0.01 ||
                    Math.abs(y_values[pos1p] - y_values[pos]) > 0.01 ||
                    Math.abs(y_values[pos] - y_values[pos1p]) > 0.01
                    ) {
                    result.type = 'jump';
                } else {
                    result.type = 'cusp';
                }
            }
            if (result.type === 'cusp') {
                /*
                // Find a better approximation of the cusp
                delta = y_slopes[pos] - y_slopes[pos1m];
                a = 0.5 * delta / (h * h);
                b = (y_slopes[pos] - a * (2 * t_values[pos] + h) * h) / h;
                h0 = -(2 * t_values[pos] * a) / (2 * a + b);
                // console.log("Minimum at", t_values[pos] + h0);
                tc = t_values[pos] + h0;
                result.t = tc;
                result.x = curve.X(tc, true);
                result.y = curve.Y(tc, true);
                */
            }
            return result;
        },

        thiele: function(t, recip, t_values, idx, degree) {
            var i, v = 0.0;
            for (i = degree; i > 1; i--) {
                v = (t - t_values[idx + i]) / (recip[i][idx + 1] - recip[i - 2][idx + 1] + v);
            }
            return recip[0][idx + 1] + (t - t_values[idx + 1]) / (recip[1][idx + 1] + v);
        },

        differenceMethodExperiments: function(component, curve) {
            var i, level, le, up,
                t_values = component.t_values,
                x_values = component.x_values,
                y_values = component.y_values,
                x_diffs = [],
                y_diffs = [],
                x_slopes = [],
                y_slopes = [],
                x_table = [],
                y_table = [],
                x_recip = [],
                y_recip = [],
                h, numerator,
                // x_med, y_med,
                foundCriticalPoint = 0,
                pos, ma, j, v,
                groups,
                criticalPoints = [];

            h = t_values[1] - t_values[0];
            x_table.push([]);
            y_table.push([]);
            x_recip.push([]);
            y_recip.push([]);
            le = y_values.length;
            for (i = 0; i < le; i++) {
                x_table[0][i] = x_values[i];
                y_table[0][i] = y_values[i];
                x_recip[0][i] = x_values[i];
                y_recip[0][i] = y_values[i];
            }

            x_table.push([]);
            y_table.push([]);
            x_recip.push([]);
            y_recip.push([]);
            numerator = h;
            le = y_values.length - 1;
            for (i = 0; i < le; i++) {
                x_diffs[i] = x_values[i + 1] - x_values[i];
                y_diffs[i] = y_values[i + 1] - y_values[i];
                x_slopes[i] = x_diffs[i];
                y_slopes[i] = y_diffs[i];
                x_table[1][i] = x_diffs[i];
                y_table[1][i] = y_diffs[i];
                x_recip[1][i] = numerator / x_diffs[i];
                y_recip[1][i] = numerator / y_diffs[i];
            }
            le--;

            up = Math.min(8, y_values.length - 1);
            for (level = 1; level < up; level++) {
                x_table.push([]);
                y_table.push([]);
                x_recip.push([]);
                y_recip.push([]);
                numerator *= h;
                for (i = 0; i < le; i++) {
                    x_diffs[i] = x_diffs[i + 1] - x_diffs[i];
                    y_diffs[i] = y_diffs[i + 1] - y_diffs[i];
                    x_table[level + 1][i] = x_diffs[i];
                    y_table[level + 1][i] = y_diffs[i];
                    x_recip[level + 1][i] = numerator / (x_recip[level][i + 1] - x_recip[level][i]) + x_recip[level - 1][i + 1];
                    y_recip[level + 1][i] = numerator / (y_recip[level][i + 1] - y_recip[level][i]) + y_recip[level - 1][i + 1];
                }

                // if (level == 1) {
                //     console.log("bends level=", level, y_diffs.toString());
                // }

                // Store point location which may be centered around
                // critical points.
                // If the lebvel is suitable, step out of the loop.
                groups = this._criticalPoints(y_diffs, le, level);
                if (groups === false) {
                    // Its seems, the degree of the polynomial is equal to level
console.log("Polynomial of degree", level);
                    groups = [];
                    break;
                }
                if (groups.length > 0) {
                    foundCriticalPoint++;
                    if (foundCriticalPoint > 1 && level % 2 === 0) {
                        break;
                    }
                }
                le--;
            }

            // console.log("Last diffs", y_diffs, "level", level);

            // Analyze the groups which have been found.
            for (i = 0; i < groups.length; i++) {
                // console.log("Group", i, groups[i])
                // Identify the maximum difference, i.e. the center of the "problem"
                ma = -Infinity;
                for (j = 0; j < groups[i].length; j++) {
                    v = Math.abs(groups[i][j].v);
                    if (v > ma) {
                        ma = v;
                        pos = j;
                    }
                }
                pos = Math.floor(groups[i][pos].i + level / 2);
                // Analyze the critical point
                criticalPoints.push(this.getPointType(curve, pos, t_values, x_values, y_values, x_slopes, y_slopes, le + 1));
            }

            return [criticalPoints, x_table, y_table, x_recip, y_recip];

        },

        differenceMethod: function(component, curve) {
            var i, level, le, up,
                t_values = component.t_values,
                x_values = component.x_values,
                y_values = component.y_values,
                x_table = [],
                y_table = [],
                foundCriticalPoint = 0,
                pos, ma, j, v,
                groups,
                criticalPoints = [];

            x_table.push([]);
            y_table.push([]);
            le = y_values.length;
            for (i = 0; i < le; i++) {
                x_table[0][i] = x_values[i];
                y_table[0][i] = y_values[i];
            }

            x_table.push([]);
            y_table.push([]);
            le = y_values.length - 1;
            for (i = 0; i < le; i++) {
                x_table[1][i] = x_values[i + 1] - x_values[i];
                y_table[1][i] = y_values[i + 1] - y_values[i];
            }
            le--;

            up = Math.min(8, y_values.length - 1);
            for (level = 1; level < up; level++) {
                x_table.push([]);
                y_table.push([]);
                for (i = 0; i < le; i++) {
                    x_table[level + 1][i] = x_table[level][i + 1] - x_table[level][i];
                    y_table[level + 1][i] = y_table[level][i + 1] - y_table[level][i];
                }

                // Store point location which may be centered around
                // critical points.
                // If the lebvel is suitable, step out of the loop.
                groups = this._criticalPoints(y_table[level + 1], le, level);
                if (groups === false) {
                    // Its seems, the degree of the polynomial is equal to level
    console.log("Polynomial of degree", level);
                    groups = [];
                    break;
                }
                if (groups.length > 0) {
                    foundCriticalPoint++;
                    if (foundCriticalPoint > 1 && level % 2 === 0) {
                        break;
                    }
                }
                le--;
            }

            // console.log("Last diffs", y_diffs, "level", level);

            // Analyze the groups which have been found.
            for (i = 0; i < groups.length; i++) {
                // console.log("Group", i, groups[i])
                // Identify the maximum difference, i.e. the center of the "problem"
                ma = -Infinity;
                for (j = 0; j < groups[i].length; j++) {
                    v = Math.abs(groups[i][j].v);
                    if (v > ma) {
                        ma = v;
                        pos = j;
                    }
                }
                pos = Math.floor(groups[i][pos].i + level / 2);
                // Analyze the critical point
                criticalPoints.push(this.getPointType(curve, pos, t_values, x_values, y_values, x_table[1], y_table[0], le + 1));
            }

            return [criticalPoints, x_table, y_table];

        },

        _insertPoint_v4: function (curve, crds, t) {
            var p,
                prev = null,
                near = 0.8;

            if (curve.points.length > 0) {
                prev = curve.points[curve.points.length - 1].scrCoords;
            }

            // Add regular point
            p = new Coords(Const.COORDS_BY_USER, crds, curve.board);

            if (prev !== null &&
                Math.abs(p.scrCoords[1] - prev[1]) < near &&
                Math.abs(p.scrCoords[1] - prev[2]) < near) {
                return;
                }

            p._t = t;
            curve.points.push(p);
        },

        getInterval: function(curve, ta, tb) {
            var t_int, x_int, y_int;

            console.log('critical point', ta, tb);
            t_int = IntervalArithmetic.Interval(ta, tb);
            curve.board.mathLib = IntervalArithmetic;
            curve.board.mathLibJXG = IntervalArithmetic;
            x_int = curve.X(t_int, true);
            y_int = curve.Y(t_int, true);
            curve.board.mathLib = Math;
            curve.board.mathLibJXG = JXG.Math;
            console.log(x_int, y_int);
            return y_int;
        },

        steps: 768,
        criticalThreshold: 100,

        plot_v4: function(curve, ta, tb, steps) {
            var i, le, components, idx, comp,
                groups, g, start, ta1, tb1,
                ret, x_table, y_table,
                x, y, t, t1, t2, j,
                h  = (tb - ta) / steps,
                h2 = h * 0.5;

            components = this.findComponents(curve, ta, tb, steps);
            console.log("::::::::::::::::::::::::");
            // console.log("plot", ta, tb);
            // console.log(components);

            for (idx = 0; idx < components.length; idx++) {
                comp = components[idx];
                ret = this.differenceMethod(comp, curve);
                groups = ret[0];
                x_table = ret[1];
                y_table = ret[2];
                // console.log("Groups", groups);

                start = 0;
                for (g = 0; g <= groups.length; g++) {
                    console.log(":::");
                    if (g === groups.length) {
                        le = comp.len;
                    } else {
                        le = groups[g].idx - 1;
                    }

                    var good=0, bad=0;
                    // Insert all uncritical points until next critical point
                    for (i = start; i < le; i++) {
                        this._insertPoint_v4(curve, [1, comp.x_values[i], comp.y_values[i]], comp.t_values[i]);
                        /*
                        t = comp.t_values[i] + 0.1 * h;
                        j = Math.min(ret[4].length - 1, 6);
                        y = this.thiele(t, ret[4], comp.t_values, i, j);
                        this._insertPoint_v4(curve, [1, comp.x_values[i], y], t);
                        console.log(ret[4].length, Math.sin(t) - y);
                        */
                        // x = x_table[0][i] + x_table[1][i] * h2 + x_table[2][i] * h2 * (h2 - h) / 2 + x_table[3][i] * h2 * (h2 - h) / 2 * (h2 - 2*h) / 3;
                        // y = y_table[0][i] + y_table[1][i] * h2 + y_table[2][i] * h2 * (h2 - h) / 2 + y_table[3][i] * h2 * (h2 - h) / 2 * (h2 - 2*h) / 3;
                        // this._insertPoint_v4(curve, [1, x, y], comp.t_values[i] + h2);
                        //console.log(h, h2, comp.t_values[i], x, comp.y_values[i], y)
                        //console.log(y_table[0][i], y_table[2][i], y_table[3][i],  y_table[4][i])
                        if (y_table.length > 4 && Math.abs(y_table[4][i]) > 0.01 * Math.abs(y_table[0][i])) {
                            t = comp.t_values[i];
                            t1 = Numerics.fminbr(curve.Y, [t, t + h]);
                            t2 = Numerics.fminbr(x => (-curve.Y(x)), [t, t + h]);
                            if (t1 < t2) {
                                this._insertPoint_v4(curve, [1, t1, curve.Y(t1)], t1);
                                this._insertPoint_v4(curve, [1, t2, curve.Y(t2)], t2);
                            } else {
                                this._insertPoint_v4(curve, [1, t2, curve.Y(t2)], t2);
                                this._insertPoint_v4(curve, [1, t1, curve.Y(t1)], t1);
                            }
                            bad++;
                            //console.log([t, t+h, comp.t_values[i+1]], curve.Y(t1), curve.Y(t2))
                            /*
                            for (j = 1; j < 3; j++) {
                                t = comp.t_values[i] + j * h / 5;
                                x = curve.X(t, true);
                                y = curve.Y(t, true);
                                this._insertPoint_v4(curve, [1, x, y], t);
                            }
                            */
                        } else {
                            good++;
                        }
                    }
                    console.log("GOOD", good, "BAD", bad);

                    // Handle next critical point
                    if (g < groups.length) {
                        // console.log("critical point", groups[g]);

                        // ta1 = comp.t_values[groups[g].idx - 1];
                        // tb1 = comp.t_values[groups[g].idx + 1];
                        // ta1 = ta1 + (tb1 - ta1) * 0.1;
                        // tb1 = tb1 - (tb1 - ta1) * 0.1;
                        // console.log('interval size', (tb1 - ta1) * curve.board.unitX);

                        if (false && (tb1 - ta1) * curve.board.unitX > 1.5) {
                            console.log("Recurse plot_v4")
                            this.plot_v4(curve, ta1, tb1, 32);
                        } else {
                            i = groups[g].idx;
                            this._insertPoint_v4(curve, [1, comp.x_values[i - 1], comp.y_values[i - 1]], comp.t_values[i - 1]);

                            console.log(groups[g].t, groups[g].type);
                            var y_int;

                            if (groups[g].type === 'borderleft') {
                                y_int = this.getInterval(curve, groups[g].t - h, groups[g].t);
                                this._insertPoint_v4(curve,
                                    [1, groups[g].t, (y_table[1][i] > 0) ? y_int.lo : y_int.hi],
                                        groups[g].t);
                            } else if (groups[g].type === 'borderright') {
                                y_int = this.getInterval(curve, groups[g].t, groups[g].t + h);
                                this._insertPoint_v4(curve,
                                    [1, groups[g].t, (y_table[1][i] > 0) ? y_int.hi : y_int.lo],
                                        groups[g].t);
                            } else if (groups[g].type === 'cusp') {
                                y_int = this.getInterval(curve, groups[g].t - h2, groups[g].t + h2);
                                this._insertPoint_v4(curve, [1, groups[g].x, groups[g].y], groups[g].t);
                            } else {
                                this._insertPoint_v4(curve, [1, NaN, NaN], groups[g].t);
                            }

                            this._insertPoint_v4(curve, [1, comp.x_values[i+1], comp.y_values[i+1]], comp.t_values[i+1]);
                        }

                        start = groups[g].idx + 1;
                    }
                }

                le = comp.len;
                if (idx < components.length - 1) {
                    this._insertPoint_v4(curve, [1, NaN, NaN], comp.right_t);
                }
            }


        },

        updateParametricCurve_v4: function (curve, mi, ma) {
            var ta, tb, w2, bbox;

            if (curve.xterm === 'x') {
                // For function graphs we can restrict the plot interval
                // to the visible area +plus margin
                bbox = curve.board.getBoundingBox();
                w2 = (bbox[2] - bbox[0]) * 0.3;
                // h2 = (bbox[1] - bbox[3]) * 0.3;
                ta = Math.max(mi, bbox[0] - w2);
                tb = Math.min(ma, bbox[2] + w2);
            } else {
                ta = mi;
                tb = ma;
            }

            curve.points = [];

            console.log("--------------------");
            this.plot_v4(curve, ta, tb, this.steps);

            curve.numberPoints = curve.points.length;
            //console.log(curve.numberPoints);
        }
    };


    return Mat.Plot;
});
