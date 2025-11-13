/*
    Copyright 2008-2025
        Matthias Ehmann,
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

"use strict";

import Type from "../utils/type.js";
import Mat from "./math.js";
import Geometry from "./geometry.js";
import Numerics from "./numerics.js";
import Quadtree from "./bqdt.js";

/**
 * Plotting of curves which are given implicitly as the set of points solving an equation
 * <i>f(x,y) = 0</i>.
 * <p>
 * The main class initializes a new implicit plot instance.
 * <p>
 * The algorithm should be able to plot most implicit curves as long as the equations
 * are not too complex. We are aware of the paper by Oliver Labs,
 * <a href="https://link.springer.com/chapter/10.1007/978-1-4419-0999-2_6">A List of Challenges for Real Algebraic Plane Curve Visualization Software</a>
 * which contains many equations where this algorithm may fail.
 * For example,  at the time being there is no attempt to detect <i>solitary points</i>.
 * Also, it is always a trade off to find all components of the curve and
 * keep the construction responsive.
 *
 * @name JXG.Math.ImplicitPlot
 * @exports Mat.ImplicitPlot as JXG.Math.ImplicitPlot
 * @param {Array} bbox Bounding box of the area in which solutions of the equation
 * are determined.
 * @param {Object} config Configuration object. Default:
 * <pre>
 *  {
 *      resolution_out: 5,    // Horizontal resolution: distance between vertical lines to search for components
 *      resolution_in: 5,     // Vertical resolution to search for components
 *      max_steps: 1024,      // Max number of points in one call of tracing
 *      alpha_0: 0.05,        // Angle between two successive tangents: smoothness of curve
 *
 *      tol_u0: Mat.eps,      // Tolerance to find starting points for tracing.
 *      tol_newton: 1.0e-7,   // Tolerance for Newton steps.
 *      tol_cusp: 0.05,       // Tolerance for cusp / bifurcation detection
 *      tol_progress: 0.0001, // If two points are closer than this value, we bail out
 *      qdt_box: 0.2,         // half of box size to search in qdt
 *      kappa_0: 0.2,         // Inverse of planned number of Newton steps
 *      delta_0: 0.05,        // Distance of predictor point to curve
 *
 *      h_initial: 0.1,       // Initial stepwidth
 *      h_critical: 0.001,    // If h is below this threshold we bail out
 *      h_max: 1,             // Maximal value of h (user units)
 *      loop_dist: 0.09,      // Allowed distance (multiplied by actual stepwidth) to detect loop
 *      loop_dir: 0.99,       // Should be > 0.95
 *      loop_detection: true, // Use Gosper's loop detector
 *      unitX: 10,            // unitX of board
 *      unitY: 10             // unitX of board
 *   };
 * </pre>
 * @param {function} f function from <b>R</b><sup>2</sup> to <b>R</b>
 * @param {function} [dfx] Optional partial derivative of <i>f</i> with regard to <i>x</i>
 * @param {function} [dfy] Optional partial derivative of <i>f</i> with regard to <i>y</i>
 *
 * @constructor
 * @example
 *     var f = (x, y) => x**3 - 2 * x * y + y**3;
 *     var c = board.create('curve', [[], []], {
 *             strokeWidth: 3,
 *             strokeColor: JXG.palette.red
 *         });
 *
 *     c.updateDataArray = function () {
 *         var bbox = this.board.getBoundingBox(),
 *             ip, cfg,
 *             ret = [],
 *             mgn = 1;
 *
 *         bbox[0] -= mgn;
 *         bbox[1] += mgn;
 *         bbox[2] += mgn;
 *         bbox[3] -= mgn;
 *
 *         cfg = {
 *             resolution_out: 5,
 *             resolution_in: 5,
 *             unitX: this.board.unitX,
 *             unitY: this.board.unitX
 *         };
 *
 *         this.dataX = [];
 *         this.dataY = [];
 *         ip = new JXG.Math.ImplicitPlot(bbox, cfg, f, null, null);
 *         ret = ip.plot();
 *         this.dataX = ret[0];
 *         this.dataY = ret[1];
 *     };
 *     board.update();
 * </pre><div id="JXGf3e8cd82-2b67-4efb-900a-471eb92b3b96" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGf3e8cd82-2b67-4efb-900a-471eb92b3b96',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var f = (x, y) => x**3 - 2 * x * y + y**3;
 *             var c = board.create('curve', [[], []], {
 *                     strokeWidth: 3,
 *                     strokeColor: JXG.palette.red
 *                 });
 *
 *             c.updateDataArray = function () {
 *                 var bbox = this.board.getBoundingBox(),
 *                     ip, cfg,
 *                     ret = [],
 *                     mgn = 1;
 *
 *                 bbox[0] -= mgn;
 *                 bbox[1] += mgn;
 *                 bbox[2] += mgn;
 *                 bbox[3] -= mgn;
 *
 *                 cfg = {
 *                     resolution_out: 5,
 *                     resolution_in: 5,
 *                     unitX: this.board.unitX,
 *                     unitY: this.board.unitX
 *                 };
 *
 *                 this.dataX = [];
 *                 this.dataY = [];
 *
 *                 ip = new JXG.Math.ImplicitPlot(bbox, cfg, f, null, null);
 *                 ret = ip.plot();
 *
 *                 this.dataX = ret[0];
 *                 this.dataY = ret[1];
 *             };
 *             board.update();
 *
 *     })();
 *
 * </script><pre>
 *
 */
Mat.ImplicitPlot = function (bbox, config, f, dfx, dfy) {

    // Default values
    var cfg_default = {
        resolution_out: 5,    // Distance between vertical lines to search for components
        resolution_in: 5,     // Distance between vertical lines to search for components
        max_steps: 1024,      // Max number of points in one call of tracing
        alpha_0: 0.05,        // Angle between two successive tangents: smoothness of curve

        tol_u0: Mat.eps,      // Tolerance to find starting points for tracing.
        tol_newton: 1.0e-7,   // Tolerance for Newton steps.
        tol_cusp: 0.05,       // Tolerance for cusp / bifurcation detection
        tol_progress: 0.0001, // If two points are closer than this value, we bail out
        qdt_box: 0.2,         // half of box size to search in qdt
        kappa_0: 0.2,         // Inverse of planned number of Newton steps
        delta_0: 0.05,        // Distance of predictor point to curve

        h_initial: 0.1,       // Initial step width
        h_critical: 0.001,    // If h is below this threshold we bail out
        h_max: 1,             // Maximum value of h (user units)
        loop_dist: 0.09,      // Allowed distance (multiplied by actual step width) to detect loop
        loop_dir: 0.99,       // Should be > 0.95
        loop_detection: true, // Use Gosper's loop detector
        unitX: 10,            // unitX of board
        unitY: 10             // unitX of board
    };

    this.config = Type.merge(cfg_default, config);

    this.f = f;

    this.dfx = null;
    this.dfy = null;

    if (Type.isFunction(dfx)) {
        this.dfx = dfx;
    } else {
        this.dfx = function (x, y) {
            var h = Mat.eps * Mat.eps;
            return (this.f(x + h, y) - this.f(x - h, y)) * 0.5 / h;
        };
    }

    if (Type.isFunction(dfy)) {
        this.dfy = dfy;
    } else {
        this.dfy = function (x, y) {
            var h = Mat.eps * Mat.eps;
            return (this.f(x, y + h) - this.f(x, y - h)) * 0.5 / h;
        };
    }

    this.bbox = bbox;
    this.qdt = new Quadtree(20, 5, bbox);

    this.components = [];
};

Type.extend(
    Mat.ImplicitPlot.prototype,
    /** @lends JXG.Math.ImplicitPlot.prototype */ {

        /**
         * Implicit plotting method.
         *
         * @returns {Array} consisting of [dataX, dataY, number_of_components]
         */
        plot: function () {
            var // components = [],
                doVerticalSearch = true,
                doHorizontalSearch = true,
                x, y,
                mi_x, ma_x, mi_y, ma_y,
                dataX = [],
                dataY = [],
                ret = [],
                num_components = 0,

                delta,
                that = this,

                fmi_x = function (t) {
                    return that.f(x, t);
                },
                fma_x = function (t) {
                    return -that.f(x, t);
                },
                fmi_y = function (t) {
                    return that.f(t, y);
                },
                fma_y = function (t) {
                    return -that.f(t, y);
                };

            // Vertical lines or circular search:
            mi_x = Math.min(this.bbox[0], this.bbox[2]) - Mat.eps;
            ma_x = Math.max(this.bbox[0], this.bbox[2]);
            mi_y = Math.min(this.bbox[1], this.bbox[3]) + Mat.eps;
            ma_y = Math.max(this.bbox[1], this.bbox[3]);

            if (doVerticalSearch) {
                delta = this.config.resolution_out / this.config.unitX;
                delta *= (1 + Mat.eps);
                // console.log("Outer delta x", delta)

                for (x = mi_x; x < ma_x; x += delta) {
                    ret = this.searchLine(
                        fmi_x, fma_x, x,
                        [mi_y, ma_y], 'vertical',
                        num_components, dataX, dataY, 20);

                    if (ret !== false) {
                        dataX = ret[0];
                        dataY = ret[1];
                        num_components = ret[2];
                    }

                }
            }
            if (doHorizontalSearch) {
                delta = this.config.resolution_out / this.config.unitY;
                delta *= (1 + Mat.eps);
                // console.log("Outer delta y", delta)

                for (y = mi_y; y < ma_y; y += delta) {
                    ret = this.searchLine(
                        fmi_y, fma_y, y,
                        [mi_x, ma_x], 'horizontal',
                        num_components, dataX, dataY, 20);

                    if (ret !== false) {
                        dataX = ret[0];
                        dataY = ret[1];
                        num_components = ret[2];
                    }
                }
            }

            return [dataX, dataY, num_components];
        },

        /**
         * Recursively search a horizontal or vertical line for points on the
         * fulfilling the given equation.
         *
         * @param {Function} fmi Minimization function
         * @param {Function} fma Maximization function
         * @param {Number} fix Value of the fixed variable
         * @param {Array} interval Search interval of the free variable
         * @param {String} dir 'vertical' or 'horizontal'
         * @param {Number} num_components Number of components before search
         * @param {Array} dataX x-coordinates of points so far
         * @param {Array} dataY y-coordinates of points so far
         * @param {Number} level Recursion level
         * @returns {Array} consisting of [dataX, dataY, number_of_components]-
         * @private
         */
        searchLine: function (fmi, fma, fix, interval, dir,
            num_components, dataX, dataY, level) {
            var t_mi, t_ma, t,
                ft,
                mi, ma, tmp, m,
                is_in,
                u0, i, le,
                ret,
                offset,
                delta,
                eps = this.config.tol_u0,
                DEBUG = false,
                b = interval[0],
                e = interval[1];

            t_mi = Numerics.fminbr(fmi, [b, e]);
            mi = fmi(t_mi);
            t_ma = Numerics.fminbr(fma, [b, e]);
            ma = fmi(t_ma);

            if (mi < eps && ma > -eps) {
                tmp = t_mi;
                t_mi = Math.min(tmp, t_ma);
                t_ma = Math.max(tmp, t_ma);

                t = Numerics.fzero(fmi, [t_mi, t_ma]);
                // t = Numerics.chandrupatla(fmi, [t_mi, t_ma]);

                ft = fmi(t);
                if (Math.abs(ft) > Math.max((ma - mi) * Mat.eps, 0.001)) {
                    //console.log("searchLine:",  dir, fix, t, "no root " + ft);
                    return false;
                    // throw new Error("searchLine: no root " + ft);
                }
                if (dir === 'vertical') {
                    u0 = [1, fix, t];
                    delta = this.config.resolution_in / this.config.unitY;
                    // console.log("Inner delta x", delta)
                } else {
                    u0 = [1, t, fix];
                    delta = this.config.resolution_in / this.config.unitX;
                    // console.log("Inner delta y", delta)
                }
                delta *= (1 + Mat.eps);

                is_in = this.curveContainsPoint(u0, dataX, dataY,
                    delta * 2,           // Allowed dist from segment
                    this.config.qdt_box  // 0.5 of box size to search in qdt
                );

                if (is_in) {
                    if (DEBUG) {
                        console.log("Found in quadtree", u0);
                    }
                } else {
                    if (DEBUG) {
                        console.log("Not in quadtree", u0, dataX.length);
                    }
                    ret = this.traceComponent(u0, 1);
                    if (ret[0].length > 0) {
                        // Add jump in curve
                        if (num_components > 0) {
                            dataX.push(NaN);
                            dataY.push(NaN);
                        }

                        offset = dataX.length;
                        le = ret[0].length;
                        for (i = 1; i < le; i++) {
                            this.qdt.insertItem({
                                xlb: Math.min(ret[0][i - 1], ret[0][i]),
                                xub: Math.max(ret[0][i - 1], ret[0][i]),
                                ylb: Math.min(ret[1][i - 1], ret[1][i]),
                                yub: Math.max(ret[1][i - 1], ret[1][i]),
                                idx1: offset + i - 1,
                                idx2: offset + i,
                                comp: num_components
                            });
                        }

                        num_components++;
                        Type.concat(dataX, ret[0]);
                        Type.concat(dataY, ret[1]);
                    }
                }

                m = t - delta * 0.01;
                if (m - b > delta && level > 0) {
                    ret = this.searchLine(
                        fmi, fma, fix, [b, m], dir,
                        num_components, dataX, dataY, level - 1);
                    if (ret !== false) {
                        dataX = ret[0];
                        dataY = ret[1];
                        num_components = ret[2];
                    }
                }
                m = t + delta * 0.01;
                if (e - m > delta  && level > 0) {
                    ret = this.searchLine(
                        fmi, fma, fix, [m, e], dir,
                        num_components, dataX, dataY, level - 1);
                    if (ret !== false) {
                        dataX = ret[0];
                        dataY = ret[1];
                        num_components = ret[2];
                    }
                }

                return [dataX, dataY, num_components];
            }

            return false;
        },

        /**
         * Test if the data points contain a given coordinate, i.e. if the
         * given coordinate is close enough to the polygonal chain
         * through the data points.
         *
         * @param {Array} p Homogenous coordinates [1, x, y] of the coordinate point
         * @param {Array} dataX x-coordinates of points so far
         * @param {Array} dataY y-coordinates of points so far
         * @param {Number} tol Maximal distance of p from the polygonal chain through the data points
         * @param {Number} eps Helper tolerance used for the quadtree
         * @returns Boolean
         */
        curveContainsPoint: function (p, dataX, dataY, tol, eps) {
            var i, le, hits, d,
                x = p[1],
                y = p[2];

            hits = this.qdt.find([x - eps, y + eps, x + eps, y - eps]);

            le = hits.length;
            for (i = 0; i < le; i++) {
                d = Geometry.distPointSegment(
                    p,
                    [1, dataX[hits[i].idx1], dataY[hits[i].idx1]],
                    [1, dataX[hits[i].idx2], dataY[hits[i].idx2]]
                );
                if (d < tol) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Starting at an initial point the curve is traced with a Euler-Newton method.
         * After tracing in one direction the algorithm stops if the component is a closed loop.
         * Otherwise, the curved is traced in the opposite direction, starting from
         * the same initial point. Finally, the two components are glued together.
         *
         * @param {Array} u0 Initial point in homogenous coordinates [1, x, y].
         * @returns Array [dataX, dataY] containing a new component.
         * @private
         */
        traceComponent: function (u0) {
            var dataX = [],
                dataY = [],
                arr = [];

            // Trace in first direction
            // console.log("---- Start tracing forward ---------")
            arr = this.tracing(u0, 1);

            if (arr.length === 0) {
                // console.log("Could not start tracing due to singularity")
            } else {
                // console.log("Trace from", [arr[0][0], arr[1][0]], "to", [arr[0][arr[0].length - 1], arr[1][arr[1].length - 1]],
                //    "num points:", arr[0].length);
                dataX = arr[0];
                dataY = arr[1];
            }

            // Trace in the other direction
            if (!arr[2]) {
                // No loop in the first tracing step,
                // now explore the other direction.

                // console.log("---- Start tracing backward ---------")
                arr = this.tracing(u0, -1);

                if (arr.length === 0) {
                    // console.log("Could not start backward tracing due to singularity")
                } else {
                    // console.log("Trace backwards from", [arr[0][0], arr[1][0]], "to",
                    //     [arr[0][arr[0].length - 1], arr[1][arr[1].length - 1]], "num points:", arr[0].length);
                    dataX = arr[0].reverse().concat(dataX.slice(1));
                    dataY = arr[1].reverse().concat(dataY.slice(1));
                }
            }

            if (dataX.length > 0 && dataX.length < 6) {
                // Solitary point
                dataX.push(dataX[dataX.length - 1]);
                dataY.push(dataY[dataY.length - 1]);
            }

            return [dataX, dataY];
        },

        /**
         * Starting at a point <i>u0</i>, this routine traces the curve <i>f(u)=0</i> until
         * a loop is detected, a critical point is reached, the curve leaves the bounding box,
         * or the maximum number of points is reached.
         * <p>
         * The method is a predictor / corrector method consisting of Euler and Newton steps
         * together with step width adaption.
         * <p>
         * The algorithm is an adaption of the algorithm in
         * Eugene L. Allgower, Kurt Georg: <i>Introduction to Numerical Continuation methods.</i>
         *
         * @param {Array} u0 Starting point in homogenous coordinates  [1, x, y].
         * @param {Number} direction 1 or -1
         * @returns Array [pathX, pathY, loop_closed] or []
         * @private
         */
        tracing: function (u0, direction) {
            var u = [],
                ulast = [],
                len,
                v = [],
                v_start = [],
                w = [],
                t_u, t_v, t_u_0, tloc,
                A,
                grad,
                nrm,
                dir,
                steps = 0,
                k = 0,
                loop_closed = false,
                k0, k1, denom, dist, progress,
                kappa, delta, alpha,
                factor,
                point_added = false,

                quasi = false,
                cusp_or_bifurc = false,
                kappa_0 = this.config.kappa_0,  // Inverse of planned number of Newton steps
                delta_0 = this.config.delta_0,  // Distance of predictor point to curve
                alpha_0 = this.config.alpha_0,  // Angle between two successive tangents
                h = this.config.h_initial,
                max_steps = this.config.max_steps,

                omega = direction,
                pathX = [],
                pathY = [],

                T = [],            // Gosper's loop detector table
                n, m, i, e;

            u = u0.slice(1);
            pathX.push(u[0]);
            pathY.push(u[1]);

            t_u = this.tangent(u);
            if (t_u === false) {
                // We don't want to start at a singularity.
                // Get out of here and search for another starting point.
                return [];
            }
            A = [this.dfx(u[0], u[1]), this.dfy(u[0], u[1])];

            do {

                if (quasi) {
                    t_u = this.tangent_A(A);
                } else {
                    t_u = this.tangent(u);
                }
                if (t_u === false) {
                    u = v.slice();
                    pathX.push(u[0]);
                    pathY.push(u[1]);
                    // console.log("-> Bail out: t_u undefined.");
                    break;
                }

                if (pathX.length === 1) {
                    // Store first point
                    t_u_0 = t_u.slice();
                } else if (pathX.length === 2) {
                    T.push(pathX.length - 1);       // Put first point into Gosper table T

                } else if (point_added && pathX.length > 2 && !cusp_or_bifurc) {

                    // Detect if loop has been closed
                    dist = Geometry.distPointSegment(
                        [1, u[0], u[1]],
                        [1, pathX[0], pathY[0]],
                        [1, pathX[1], pathY[1]]
                    );

                    if (dist < this.config.loop_dist * h &&
                        Mat.innerProduct(t_u, t_u_0, 2) > this.config.loop_dir
                    ) {

                        // console.log("Loop detected after", steps, 'steps');
                        // console.log("\t", "v", v, "u0:", u0)
                        // console.log("\t", "Dist(v, path0)", dist, config.loop_dist * h)
                        // console.log("\t", "t_u", t_u);
                        // console.log("\t", "inner:", Mat.innerProduct(t_u, t_u_0, 2));
                        // console.log("\t", "h", h);

                        u = u0.slice(1);
                        pathX.push(u[0]);
                        pathY.push(u[1]);

                        loop_closed = true;
                        break;
                    }

                    // Gosper's loop detector
                    if (this.config.loop_detection) {
                        n = pathX.length - 1;
                        // console.log("Check Gosper", n);
                        m = Math.floor(Mat.log2(n));

                        for (i = 0; i <= m; i++) {
                            dist = Geometry.distPointSegment(
                                [1, u[0], u[1]],
                                [1, pathX[T[i] - 1], pathY[T[i] - 1]],
                                [1, pathX[T[i]], pathY[T[i]]]
                            );

                            if (dist < this.config.loop_dist * h) {
                                // console.log("!!!!!!!!!!!!!!! GOSPER LOOP CLOSED !!!!", i, n + 1,
                                //     this.config.loop_dist * h
                                // );

                                t_v = this.tangent([pathX[T[i]], pathY[T[i]]]);
                                if (Mat.innerProduct(t_u, t_v, 2) > this.config.loop_dir) {
                                    // console.log("!!!!!!!!!!!!!!! angle is good enough");
                                    break;
                                }
                            }
                        }
                        if (i <= m) {
                            loop_closed = true;
                            break;
                        }

                        m = 1;
                        e = 0;
                        for (i = 0; i < 100; i++) {
                            if ((n + 1) % m !== 0) {
                                break;
                            }
                            m *= 2;
                            e++;
                        }
                        // console.log("Add at e", e);
                        T[e] = n;
                    }

                }

                // Predictor step
                // if (true /*h < 2 * this.config.h_initial*/) {
                // Euler
                // console.log('euler')
                v[0] = u[0] + h * omega * t_u[0];
                v[1] = u[1] + h * omega * t_u[1];
                // } else {
                //     // Heun
                //     // console.log('heun')
                //     v[0] = u[0] + h * omega * t_u[0];
                //     v[1] = u[1] + h * omega * t_u[1];

                //     t_v = this.tangent(v);
                //     v[0] = 0.5 * u[0] + 0.5 * (v[0] + h * omega * t_v[0]);
                //     v[1] = 0.5 * u[1] + 0.5 * (v[1] + h * omega * t_v[1]);
                // }
                if (quasi) {
                    A = this.updateA(A, u, v);
                    v_start = v.slice();
                }

                // Corrector step: Newton
                k = 0;
                do {
                    if (quasi) {
                        grad = A;
                    } else {
                        grad = [this.dfx(v[0], v[1]), this.dfy(v[0], v[1])];
                    }

                    // Compute w = v - A(v) * f(v),
                    // grad: row vector and A(v) is the Moore-Penrose inverse:
                    // grad^T * (grad * grad^T)^(-1)
                    denom = grad[0] * grad[0] + grad[1] * grad[1];
                    nrm = this.f(v[0], v[1]) / denom;

                    w[0] = v[0] - grad[0] * nrm;
                    w[1] = v[1] - grad[1] * nrm;
                    if (k === 0) {
                        k0 = Math.abs(nrm) * Math.sqrt(denom);
                    } else if (k === 1) {
                        k1 = Math.abs(nrm) * Math.sqrt(denom);
                    }

                    v[0] = w[0];
                    v[1] = w[1];
                    k++;
                } while (k < 20 &&
                    Math.abs(this.f(v[0], v[1])) > this.config.tol_newton
                );

                delta = k0;
                if (k > 1) {
                    kappa = k1 / k0;
                } else {
                    kappa = 0.0;
                }

                if (quasi) {
                    A = this.updateA(A, v_start, v);
                    t_v = this.tangent_A(A);
                } else {
                    t_v = this.tangent(v);
                }

                dir = Mat.innerProduct(t_u, t_v, 2);
                dir = Math.max(-1, Math.min(1, dir));
                alpha = Math.acos(dir);

                // Look for simple bifurcation points and cusps
                cusp_or_bifurc = false;
                progress = Geometry.distance(u, v, 2);
                if (progress < this.config.tol_progress) {
                    u = v.slice();
                    pathX.push(u[0]);
                    pathY.push(u[1]);
                    // console.log("-> Bail out, no progress", progress, steps);
                    break;

                } else if (dir < 0.0) {
                    if (h > this.config.h_critical) {
                        // console.log("Critical point at [", u[0].toFixed(4), u[1].toFixed(4), "], v: [", v[0].toFixed(4), v[1].toFixed(4), "], but large  h:", h);

                    } else {

                        cusp_or_bifurc = true;
                        if (this.isBifurcation(u, this.config.tol_cusp)) {
                            // console.log(steps, "bifurcation point between", u, "and", v, ":", dir, "h", h, "alpha", alpha);
                            // A = [dfx(v[0], v[1]), dfy(v[0], v[1])];
                            omega *= (-1);
                            // If there is a bifurcation point, we
                            // ignore the angle alpha for subsequent step length
                            // adaption. Because then we might be able to
                            // "jump over the critical point"
                            alpha = 0;
                        } else {
                            // Cusp or something more weird
                            u = v.slice();
                            pathX.push(u[0]);
                            pathY.push(u[1]);
                            // console.log("-> Bail out, cusp")
                            break;
                        }
                    }
                }

                // Adapt stepwidth
                if (!cusp_or_bifurc) {
                    factor = Math.max(
                        Math.sqrt(kappa / kappa_0),
                        Math.sqrt(delta / delta_0),
                        alpha / alpha_0
                    );
                    if (isNaN(factor)) {
                        factor = 1;
                    }
                    factor = Math.max(Math.min(factor, 2), 0.5);
                    h /= factor;
                    h = Math.min(this.config.h_max, h);

                    if (factor >= 2) {
                        steps++;
                        if (steps >= 3 * max_steps) {
                            break;
                        }

                        point_added = false;
                        continue;
                    }
                }

                u = v.slice();
                pathX.push(u[0]);
                pathY.push(u[1]);
                point_added = true;

                steps++;
            } while (
                steps < max_steps &&
                u[0] >= this.bbox[0] &&
                u[1] <= this.bbox[1] &&
                u[0] <= this.bbox[2] &&
                u[1] >= this.bbox[3]
            );

            // Clipping to bounding box, last may be outside, interpolate between second last und last point
            len = pathX.length;
            ulast = [pathX[len - 2], pathY[len - 2]];

            // If u[0] is outside x-interval in bounding box, interpolate to the box.
            if (u[0] < this.bbox[0]) {
                if (u[0] !== ulast[0]) {
                    tloc = (this.bbox[0] - ulast[0]) / (u[0] - ulast[0]);
                    if (u[1] !== ulast[1]) {
                        u[1] = ulast[1] + tloc * (u[1] - ulast[1]);
                    }
                }
                u[0] = this.bbox[0];
            }
            if (u[0] > this.bbox[2]) {
                if (u[0] !== ulast[0]) {
                    tloc = (this.bbox[2] - ulast[0]) / (u[0] - ulast[0]);
                    if (u[1] !== ulast[1]) {
                        u[1] = ulast[1] + tloc * (u[1] - ulast[1]);
                    }
                }
                u[0] = this.bbox[2];
            }

            // If u[1] is outside y-interval in bounding box, interpolate to the box.
            if (u[1] < this.bbox[3]) {
                if (u[1] !== ulast[1]) {
                    tloc = (this.bbox[3] - ulast[1]) / (u[1] - ulast[1]);
                    if (u[0] !== ulast[0]) {
                        u[0] = ulast[0] + tloc * (u[0] - ulast[0]);
                    }
                }
                u[1] = this.bbox[3];
            }
            if (u[1] > this.bbox[1]) {
                if (u[1] !== ulast[1]) {
                    tloc = (this.bbox[1] - ulast[1]) / (u[1] - ulast[1]);
                    if (u[0] !== ulast[0]) {
                        u[0] = ulast[0] + tloc * (u[0] - ulast[0]);
                    }
                }
                u[1] = this.bbox[1];
            }

            // Update last point
            pathX[len - 1] = u[0];
            pathY[len - 1] = u[1];

            // if (!loop_closed) {
            //     console.log("No loop", steps);
            // } else {
            //     console.log("Loop", steps);
            // }

            return [pathX, pathY, loop_closed];
        },

        /**
         * If both eigenvalues of the Hessian are different from zero, the critical point at u
         * is a simple bifurcation point.
         *
         * @param {Array} u Critical point [x, y]
         * @param {Number} tol Tolerance of the eigenvalues to be zero.
         * @returns Boolean True if the point is a simple bifurcation point.
         * @private
         */
        isBifurcation: function (u, tol) {
            // Former experiments:
            // If the Hessian has exactly one zero eigenvalue,
            // we claim that there is a cusp.
            // Otherwise, we decide that there is a bifurcation point.
            // In the latter case, if both eigenvalues are zero
            // this is a somewhat crude decision.
            //
            var h = Mat.eps * Mat.eps * 100,
                x, y, a, b, c, d, ad,
                lbda1, lbda2,
                dis;

            x = u[0];
            y = u[1];
            a = 0.5 * (this.dfx(x + h, y) - this.dfx(x - h, y)) / h;
            b = 0.5 * (this.dfx(x, y + h) - this.dfx(x, y - h)) / h;
            c = 0.5 * (this.dfy(x + h, y) - this.dfy(x - h, y)) / h;
            d = 0.5 * (this.dfy(x, y + h) - this.dfy(x, y - h)) / h;

            // c = b
            ad = a + d;
            dis = ad * ad - 4 * (a * d - b * c);
            lbda1 = 0.5 * (ad + Math.sqrt(dis));
            lbda2 = 0.5 * (ad - Math.sqrt(dis));

            // console.log(a, b, c, d)
            // console.log("Eigenvals u:", lbda1, lbda2, tol);

            if (Math.abs(lbda1) > tol && Math.abs(lbda2) > tol) {
                // if (lbda1 * lbda2 > 0) {
                //     console.log("Seems to be isolated singularity at", u);
                // }
                return true;
            }

            return false;
        },

        /**
         * Search in an arc around a critical point for a further point on the curve.
         * Unused for the moment.
         *
         * @param {Array} u Critical point [x, y]
         * @param {Array} t_u Tangent at u
         * @param {Number} r Radius
         * @param {Number} omega angle
         * @returns {Array} Coordinates [x, y] of a new point.
         * @private
         */
        handleCriticalPoint: function (u, t_u, r, omega) {
            var a = Math.atan2(omega * t_u[1], omega * t_u[0]),
                // s = a - 0.75 * Math.PI,
                // e = a + 0.75 * Math.PI,
                f_circ = function (t) {
                    var x = u[0] + r * Math.cos(t),
                        y = u[1] + r * Math.sin(t);
                    return this.f(x, y);
                },
                x, y, t0;

            // t0 = Numerics.fzero(f_circ, [s, e]);
            t0 = Numerics.root(f_circ, a);

            x = u[0] + r * Math.cos(t0);
            y = u[1] + r * Math.sin(t0);
            // console.log("\t", "result", x, y, "f", f(x, y));

            return [x, y];
        },

        /**
         * Quasi-Newton update of the Moore-Penrose inverse.
         * See (7.2.3) in Allgower, Georg.
         *
         * @param {Array} A
         * @param {Array} u0
         * @param {Array} u1
         * @returns Array
         * @private
         */
        updateA: function (A, u0, u1) {
            var s = [u1[0] - u0[0], u1[1] - u0[1]],
                y = this.f(u1[0], u1[1]) - this.f(u0[0], u0[1]),
                nom, denom;

            denom = s[0] * s[0] + s[1] * s[1];
            nom = y - (A[0] * s[0] + A[1] * s[1]);
            nom /= denom;
            A[0] += nom * s[0];
            A[1] += nom * s[1];

            return A;
        },

        /**
         * Approximate tangent (of norm 1) with Quasi-Newton method
         * @param {Array} A
         * @returns Array
         * @private
         */
        tangent_A: function (A) {
            var t = [-A[1], A[0]],
                nrm = Mat.norm(t, 2);

            if (nrm < Mat.eps) {
                // console.log("Approx. Singularity", t, "is zero", nrm);
            }
            return [t[0] / nrm, t[1] / nrm];
        },

        /**
         * Tangent of norm 1 at point u.
         * @param {Array} u Point [x, y]
         * @returns Array
         * @private
         */
        tangent: function (u) {
            var t = [-this.dfy(u[0], u[1]), this.dfx(u[0], u[1])],
                nrm = Mat.norm(t, 2);

            if (nrm < Mat.eps * Mat.eps) {
                // console.log("Singularity", t, "is zero", "at", u, ":", nrm);
                return false;
            }
            return [t[0] / nrm, t[1] / nrm];
        }
    }

);

export default Mat.ImplicitPlot;

