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

define(['jxg', 'math/math', 'utils/type'], function (JXG, Mat, Type) {

    "use strict";

    /**
     * Functions for extrapolation of sequences. Used for finding limits of sequences which is used in functiuon plots.
     * @name JXG.Math.Extrapolate
     * @exports Mat.Extrapolate as JXG.Math.Extrapolate
     * @namespace
     */
    Mat.Extrapolate = {
        /**
         *
         * @param {*} s_n
         * @param {*} n 
         * @param {*} e 
         */
        wynnEps: function(s_n, n, e) {
            var HUGE = 1.e+20,
                TINY = 1.e-15,
                f0 = 1,
                f,
                j,
                aux1, aux2, diff, estlim;

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
                        f = ((n - j + 1) % 2 === 1) ? f0 : 1;
                        e[j - 1] = aux1 * f + 1 / diff;
                    }
                }
// console.log(n % 2, e[0], e[1], e[n%2]);
                estlim = e[n % 2];
            }

            // if (Math.abs(estlim) > 0.01 * HUGE) {
            //     estlim = lastval;
            // }
            // lasteps = Math.abs(estlim - lastval);
            return estlim;
        },

        levin: function(s_n, n, numer, denom) {
            var term, fact, j,
                beta = 1,
                omega = (beta + n) * s_n;

            term = 1.0 / (beta + n);

            denom[n] = term / omega;
            numer[n] = s_n * denom[n];
            if (n > 0) {
                ratio = (beta + n -1) * term;
                for (j = 1; j <= n; j++) {
                    fact = (n - j + beta) * term;
                    numer[n - j] = numer[n - j + 1] - fact * numer[n - j];
                    denom[n - j] = denom[n - j + 1] - fact * denom[n - j];
                    term *= ratio;
                }
            }
            return numer[0] / denom[0];
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

        aitken: function(s_n, n, a) {
            var estlim,
                HUGE = 1.e+20,
                TINY = 1.e-20,
                denom, v,
                lowmax, j, m;

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
                        a[m] -= v * v / denom;
                    }
                }
                estlim = a[n % 2];
            }
            return estlim;
        },

        brezinski: function(s_n, n, a) {
            var estlim,
                HUGE = 1.e+20,
                TINY = 1.e-20,
                denom,
                d0, d1, d2,
                lowmax, j, m;

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
                        a[m] = a[m + 1] - d0 * d1 * (d2 - d1) / denom;
                    }
                }
                estlim = a[n % 3];
            }
            return estlim;
        },

        _limit_iterate: function(x0, h0, f, method, step_type) {
            var n, v, w,
                estlim = NaN,
                delta,
                up = 20,
                r = 0.5,
                E = [],
                infty = 1.e+4,
                result = 'finite',
                h = h0;

            step_type = step_type || 0;

            for (n = 1; n <= up; n++) {
                h = (step_type === 0) ?  h0 / n : h * r;
                v = f(x0 + h, true);

                w = this[method](v, n - 1, E);

//console.log(n, h, v, w, w / v);
                if (isNaN(w)) {
                    result = 'NaN';
//console.log("nan");
                    break;
                } else if (v !== 0 && Math.abs(w / v) > infty) {
                    estlim = Math.abs(w) * Math.sign(v);
                    result = 'infinite';
//console.log("inf", v, w);
                    break;
                } else {
                    delta = w - estlim;
                    if (Math.abs(delta) < 1.e-12) {
                        break;
                    }
                    estlim = w;
                }

            }
            return [estlim, result, 1 - (n - 1) / up];
        },

        limit: function(x0, h0, f) {
            var algs = ['wynnEps'], //, 'aitken', 'brezinski'],
                le = algs.length,
                i, t, res;

            for (i = 0; i < le; i++) {
                for (t = 0; t < 2; t++) {
//console.log(">", algs[i], t)
                    res = this._limit_iterate(x0, h0, f, algs[i], t);
//console.log("<", algs[i], res)
                    if (res[2] > 0.6) {
                        return res;
                    }
                }
            }
            return [f(x0 + Math.sign(h0) * Math.sqrt(Mat.eps)), 'finitex', 0];
        }



    };

    return Mat.Extrapolate;
});
