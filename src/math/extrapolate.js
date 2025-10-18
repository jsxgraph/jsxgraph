/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

import Mat from "./math.js";

/**
 * Functions for extrapolation of sequences. Used for finding limits of sequences which is used for curve plotting.
 * @name JXG.Math.Extrapolate
 * @exports Mat.Extrapolate as JXG.Math.Extrapolate
 * @namespace
 */
Mat.Extrapolate = {
    upper: 15,
    infty: 1e4,

    /**
     * Wynn's epsilon algorithm. Ported from the FORTRAN version in
     * Ernst Joachim Weniger, "Nonlinear sequence transformations for the acceleration of convergence
     * and the summation of divergent series", Computer Physics Reports Vol. 10, 189-371 (1989).
     *
     * @param {Number} s_n next value of sequence, i.e. n-th element of sequence
     * @param {Number} n index of s_n in the sequence
     * @param {Array} e One-dimensional array containing the extrapolation data. Has to be supplied by the calling routine.
     * @returns {Number} New estimate of the limit of the sequence.
     *
     * @memberof JXG.Math.Extrapolate
     */
    wynnEps: function (s_n, n, e) {
        var HUGE = 1e20,
            TINY = 1e-15,
            f0 = 1, // f0 may be changed to other values, see vanden Broeck, Schwartz (1979)
            f,
            j,
            aux1,
            aux2,
            diff,
            estlim;

        e[n] = s_n;
        if (n === 0) {
            estlim = s_n;
        } else {
            aux2 = 0.0;
            for (j = n; j > 0; j--) {
                aux1 = aux2;
                aux2 = e[j - 1];
                diff = e[j] - aux2;
                if (Math.abs(diff) <= TINY) {
                    e[j - 1] = HUGE;
                } else {
                    f = (n - j + 1) % 2 === 1 ? f0 : 1;
                    e[j - 1] = aux1 * f + 1 / diff;
                }
            }
            estlim = e[n % 2];
        }

        return estlim;
    },

    // wynnRho: function(s_n, n, e) {
    //     var HUGE = 1.e+20,
    //         TINY = 1.e-15,
    //         j, f,
    //         aux1, aux2, diff, estlim;

    //     e[n] = s_n;
    //     if (n === 0) {
    //         estlim = s_n;
    //     } else {
    //         aux2 = 0.0;
    //         for (j = n; j >= 1; j--) {
    //             aux1 = aux2;
    //             aux2 = e[j - 1];
    //             diff = e[j] - aux2;
    //             if (Math.abs(diff) <= TINY) {
    //                 e[j - 1] = HUGE;
    //             } else {
    //                 f = ((n - j + 1) % 2 === 1) ? n - j + 1  : 1;
    //                 e[j - 1] = aux1 + f / diff;
    //             }
    //         }
    //         estlim = e[n % 2];
    //     }

    //     return estlim;
    // },

    /**
     * Aitken transformation. Ported from the FORTRAN version in
     * Ernst Joachim Weniger, "Nonlinear sequence transformations for the acceleration of convergence
     * and the summation of divergent series", Computer Physics Reports Vol. 10, 189-371 (1989).
     *
     * @param {Number} s_n next value of sequence, i.e. n-th element of sequence
     * @param {Number} n index of s_n in the sequence
     * @param {Array} a One-dimensional array containing the extrapolation data. Has to be supplied by the calling routine.
     * @returns {Number} New estimate of the limit of the sequence.
     *
     * @memberof JXG.Math.Extrapolate
     */
    aitken: function (s_n, n, a) {
        var estlim,
            HUGE = 1e20,
            TINY = 1e-15,
            denom,
            v,
            lowmax,
            j,
            m;

        a[n] = s_n;
        if (n < 2) {
            estlim = s_n;
        } else {
            lowmax = n / 2;
            for (j = 1; j <= lowmax; j++) {
                m = n - 2 * j;
                denom = a[m + 2] - 2 * a[m + 1] + a[m];
                if (Math.abs(denom) < TINY) {
                    a[m] = HUGE;
                } else {
                    v = a[m] - a[m + 1];
                    a[m] -= (v * v) / denom;
                }
            }
            estlim = a[n % 2];
        }
        return estlim;
    },

    /**
     * Iterated Brezinski transformation. Ported from the FORTRAN version in
     * Ernst Joachim Weniger, "Nonlinear sequence transformations for the acceleration of convergence
     * and the summation of divergent series", Computer Physics Reports Vol. 10, 189-371 (1989).
     *
     * @param {Number} s_n next value of sequence, i.e. n-th element of sequence
     * @param {Number} n index of s_n in the sequence
     * @param {Array} a One-dimensional array containing the extrapolation data. Has to be supplied by the calling routine.
     * @returns {Number} New estimate of the limit of the sequence.
     *
     * @memberof JXG.Math.Extrapolate
     */
    brezinski: function (s_n, n, a) {
        var estlim,
            HUGE = 1e20,
            TINY = 1e-15,
            denom,
            d0,
            d1,
            d2,
            lowmax,
            j,
            m;

        a[n] = s_n;
        if (n < 3) {
            estlim = s_n;
        } else {
            lowmax = n / 3;
            m = n;
            for (j = 1; j <= lowmax; j++) {
                m -= 3;
                d0 = a[m + 1] - a[m];
                d1 = a[m + 2] - a[m + 1];
                d2 = a[m + 3] - a[m + 2];
                denom = d2 * (d1 - d0) - d0 * (d2 - d1);
                if (Math.abs(denom) < TINY) {
                    a[m] = HUGE;
                } else {
                    a[m] = a[m + 1] - (d0 * d1 * (d2 - d1)) / denom;
                }
            }
            estlim = a[n % 3];
        }
        return estlim;
    },

    /**
     * Extrapolated iteration to approximate the value f(x_0).
     *
     * @param {Number} x0 Value for which the limit of f is to be determined. f(x0) may or may not exist.
     * @param {Number} h0 Initial (signed) distance from x0.
     * @param {Function} f Function for which the limit at x0 is to be determined
     * @param {String} method String to choose the method. Available values: "wynnEps", "aitken", "brezinski"
     * @param {Number} step_type Approximation method. step_type = 0 uses the sequence x0 + h0/n; step_type = 1 uses the sequence x0 + h0 * 2^(-n)
     *
     * @returns {Array} Array of length 3. Position 0: estimated value for f(x0), position 1: 'finite', 'infinite', or 'NaN'.
     * Position 2: value between 0 and 1 judging the reliability of the result (1: high, 0: not successful).
     *
     * @memberof JXG.Math.Extrapolate
     * @see JXG.Math.Extrapolate.limit
     * @see JXG.Math.Extrapolate.wynnEps
     * @see JXG.Math.Extrapolate.aitken
     * @see JXG.Math.Extrapolate.brezinski
     */
    iteration: function (x0, h0, f, method, step_type) {
        var n,
            v,
            w,
            estlim = NaN,
            diff,
            r = 0.5,
            E = [],
            result = "finite",
            h = h0;

        step_type = step_type || 0;

        for (n = 1; n <= this.upper; n++) {
            h = step_type === 0 ? h0 / (n + 1) : h * r;
            v = f(x0 + h, true);

            w = this[method](v, n - 1, E);
            //console.log(n, x0 + h, v, w);
            if (isNaN(w)) {
                result = 'NaN';
                break;
            }
            if (v !== 0 && w / v > this.infty) {
                estlim = w;
                result = 'infinite';
                break;
            }
            diff = w - estlim;
            if (Math.abs(diff) < 1e-7) {
                break;
            }
            estlim = w;
        }
        return [estlim, result, 1 - (n - 1) / this.upper];
    },

    /**
     * Levin transformation. See Numerical Recipes, ed. 3.
     * Not yet ready for use.
     *
     * @param {Number} s_n next value of sequence, i.e. n-th element of sequence
     * @param {Number} n index of s_n in the sequence
     * @param {Array} numer One-dimensional array containing the extrapolation data for the numerator. Has to be supplied by the calling routine.
     * @param {Array} denom One-dimensional array containing the extrapolation data for the denominator. Has to be supplied by the calling routine.
     *
     * @memberof JXG.Math.Extrapolate
     */
    levin: function (s_n, n, omega, beta, numer, denom) {
        var HUGE = 1e20,
            TINY = 1e-15,
            j,
            fact,
            ratio,
            term,
            estlim;

        term = 1.0 / (beta + n);
        numer[n] = s_n / omega;
        denom[n] = 1 / omega;
        if (n > 0) {
            numer[n - 1] = numer[n] - numer[n - 1];
            denom[n - 1] = denom[n] - denom[n - 1];
            if (n > 1) {
                ratio = (beta + n - 1) * term;
                for (j = 2; j <= n; j++) {
                    fact = (beta + n - j) * Math.pow(ratio, j - 2) * term;
                    numer[n - j] = numer[n - j + 1] - fact * numer[n - j];
                    denom[n - j] = denom[n - j + 1] - fact * denom[n - j];
                    term *= ratio;
                }
            }
        }
        if (Math.abs(denom[0]) < TINY) {
            estlim = HUGE;
        } else {
            estlim = numer[0] / denom[0];
        }
        return estlim;
    },

    iteration_levin: function (x0, h0, f, step_type) {
        var n,
            v,
            w,
            estlim = NaN,
            v_prev,
            delta,
            diff,
            omega,
            beta = 1,
            r = 0.5,
            numer = [],
            denom = [],
            result = "finite",
            h = h0,
            transform = 'u';

        step_type = step_type || 0;

        v_prev = f(x0 + h0, true);
        for (n = 1; n <= this.upper; n++) {
            h = step_type === 0 ? h0 / (n + 1) : h * r;
            v = f(x0 + h, true);
            delta = v - v_prev;
            if (Math.abs(delta) < 1) {
                transform = 'u';
            } else {
                transform = 't';
            }
            if (transform === 'u') {
                omega = (beta + n) * delta; // u transformation
            } else {
                omega = delta; // t transformation
            }

            v_prev = v;
            w = this.levin(v, n - 1, omega, beta, numer, denom);
            diff = w - estlim;
            // console.log(n, delta, transform, x0 + h, v, w, diff);

            if (isNaN(w)) {
                result = 'NaN';
                break;
            }
            if (v !== 0 && w / v > this.infty) {
                estlim = w;
                result = 'infinite';
                break;
            }
            if (Math.abs(diff) < 1e-7) {
                break;
            }
            estlim = w;
        }
        return [estlim, result, 1 - (n - 1) / this.upper];
    },

    /**
     *
     * @param {Number} x0 Value for which the limit of f is to be determined. f(x0) may or may not exist.
     * @param {Number} h0 Initial (signed) distance from x0.
     * @param {Function} f Function for which the limit at x0 is to be determined
     *
     * @returns {Array} Array of length 3. Position 0: estimated value for f(x0), position 1: 'finite', 'infinite', or 'NaN'.
     * Position 2: value between 0 and 1 judging the reliability of the result (1: high, 0: not successful).
     * In case that the extrapolation fails, position 1 and 2 contain 'direct' and 0.
     *
     * @example
     * var f1 = (x) => Math.log(x),
     *     f2 = (x) => Math.tan(x - Math.PI * 0.5),
     *     f3 = (x) => 4 / x;
     *
     * var x0 = 0.0000001;
     * var h = 0.1;
     * for (let f of [f1, f2, f3]) {
     *     console.log("x0=", x0, f.toString());
     *     console.log(JXG.Math.Extrapolate.limit(x0, h, f));
     *  }
     *
     * </pre><div id="JXG5e8c6a7e-eeae-43fb-a669-26b5c9e40cab" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG5e8c6a7e-eeae-43fb-a669-26b5c9e40cab',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var f1 = (x) => Math.log(x),
     *         f2 = (x) => Math.tan(x - Math.PI * 0.5),
     *         f3 = (x) => 4 / x;
     *
     *     var x0 = 0.0000001;
     *     var h = 0.1;
     *     for (let f of [f1, f2, f3]) {
     *         console.log("x0=", x0, f.toString());
     *         console.log(JXG.Math.Extrapolate.limit(x0, h, f));
     *      }
     *
     *     })();
     *
     * </script><pre>
     *
     *
     * @see JXG.Math.Extrapolate.iteration
     * @memberof JXG.Math.Extrapolate
     */
    limit: function (x0, h0, f) {
        return this.iteration_levin(x0, h0, f, 0);
        //return this.iteration(x0, h0, f, 'wynnEps', 1);

        // var algs = ['wynnEps', 'levin'], //, 'wynnEps', 'levin', 'aitken', 'brezinski'],
        //     le = algs.length,
        //     i, t, res;
        // for (i = 0; i < le; i++) {
        //     for (t = 0; t < 1; t++) {
        //         if (algs[i] === 'levin') {
        //             res = this.iteration_levin(x0, h0, f, t);
        //         } else {
        //             res = this.iteration(x0, h0, f, algs[i], t);
        //         }
        //         if (res[2] > 0.6) {
        //             return res;
        //         }
        //         console.log(algs[i], t, res)
        //     }
        // }
        // return [f(x0 + Math.sign(h0) * Math.sqrt(Mat.eps)), 'direct', 0];
    }
};

export default Mat.Extrapolate;
