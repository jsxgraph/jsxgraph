/*
    Copyright 2008-2023
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
import Mat from "./math.js";
import Type from "../utils/type.js";

/**
 * Functions for mathematical statistics. Most functions are like in the statistics package R.
 * @name JXG.Math.Statistics
 * @exports Mat.Statistics as JXG.Math.Statistics
 * @namespace
 */
Mat.Statistics = {
    /**
     * Sums up all elements of the given array.
     * @param {Array} arr An array of numbers.
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    sum: function (arr) {
        var i,
            len = arr.length,
            res = 0;

        for (i = 0; i < len; i++) {
            res += arr[i];
        }
        return res;
    },

    /**
     * Multiplies all elements of the given array.
     * @param {Array} arr An array of numbers.
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    prod: function (arr) {
        var i,
            len = arr.length,
            res = 1;

        for (i = 0; i < len; i++) {
            res *= arr[i];
        }
        return res;
    },

    /**
     * Determines the mean value of the values given in an array.
     * @param {Array} arr
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    mean: function (arr) {
        if (arr.length > 0) {
            return this.sum(arr) / arr.length;
        }

        return 0.0;
    },

    /**
     * The median of a finite set of values is the value that divides the set
     * into two equal sized subsets.
     * @param {Array} arr The set of values.
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    median: function (arr) {
        var tmp, len;

        if (arr.length > 0) {
            if (ArrayBuffer.isView(arr)) {
                tmp = new Float64Array(arr);
                tmp.sort();
            } else {
                tmp = arr.slice(0);
                tmp.sort(function (a, b) {
                    return a - b;
                });
            }
            len = tmp.length;

            if (len & 1) {
                // odd
                return tmp[parseInt(len * 0.5, 10)];
            }

            return (tmp[len * 0.5 - 1] + tmp[len * 0.5]) * 0.5;
        }

        return 0.0;
    },

    /**
     * The P-th percentile ( 0 < P ≤ 100 ) of a list of N ordered values (sorted from least to greatest)
     * is the smallest value in the list such that no more than P percent of the data is strictly less
     * than the value and at least P percent of the data is less than or equal to that value. See {@link https://en.wikipedia.org/wiki/Percentile}.
     *
     * Here, the <i>linear interpolation between closest ranks</i> method is used.
     * @param {Array} arr The set of values, need not be ordered.
     * @param {Number|Array} percentile One or several percentiles
     * @returns {Number|Array} Depending if a number or an array is the input for percentile, a number or an array containing the percentils
     * is returned.
     */
    percentile: function (arr, percentile) {
        var tmp,
            len,
            i,
            p,
            res = [],
            per;

        if (arr.length > 0) {
            if (ArrayBuffer.isView(arr)) {
                tmp = new Float64Array(arr);
                tmp.sort();
            } else {
                tmp = arr.slice(0);
                tmp.sort(function (a, b) {
                    return a - b;
                });
            }
            len = tmp.length;

            if (Type.isArray(percentile)) {
                p = percentile;
            } else {
                p = [percentile];
            }

            for (i = 0; i < p.length; i++) {
                per = len * p[i] * 0.01;
                if (parseInt(per, 10) === per) {
                    res.push((tmp[per - 1] + tmp[per]) * 0.5);
                } else {
                    res.push(tmp[parseInt(per, 10)]);
                }
            }

            if (Type.isArray(percentile)) {
                return res;
            } else {
                return res[0];
            }
        }

        return 0.0;
    },

    /**
     * Bias-corrected sample variance. A variance is a measure of how far a
     * set of numbers are spread out from each other.
     * @param {Array} arr
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    variance: function (arr) {
        var m,
            res,
            i,
            len = arr.length;

        if (len > 1) {
            m = this.mean(arr);
            res = 0;
            for (i = 0; i < len; i++) {
                res += (arr[i] - m) * (arr[i] - m);
            }
            return res / (arr.length - 1);
        }

        return 0.0;
    },

    /**
     * Determines the <strong>s</strong>tandard <strong>d</strong>eviation which shows how much
     * variation there is from the average value of a set of numbers.
     * @param {Array} arr
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    sd: function (arr) {
        return Math.sqrt(this.variance(arr));
    },

    /**
     * Weighted mean value is basically the same as {@link JXG.Math.Statistics.mean} but here the values
     * are weighted, i.e. multiplied with another value called <em>weight</em>. The weight values are given
     * as a second array with the same length as the value array..
     * @throws {Error} If the dimensions of the arrays don't match.
     * @param {Array} arr Set of alues.
     * @param {Array} w Weight values.
     * @returns {Number}
     * @memberof JXG.Math.Statistics
     */
    weightedMean: function (arr, w) {
        if (arr.length !== w.length) {
            throw new Error(
                "JSXGraph error (Math.Statistics.weightedMean): Array dimension mismatch."
            );
        }

        if (arr.length > 0) {
            return this.mean(this.multiply(arr, w));
        }

        return 0.0;
    },

    /**
     * Extracts the maximum value from the array.
     * @param {Array} arr
     * @returns {Number} The highest number from the array. It returns <tt>NaN</tt> if not every element could be
     * interpreted as a number and <tt>-Infinity</tt> if an empty array is given or no element could be interpreted
     * as a number.
     * @memberof JXG.Math.Statistics
     */
    max: function (arr) {
        return Math.max.apply(this, arr);
    },

    /**
     * Extracts the minimum value from the array.
     * @param {Array} arr
     * @returns {Number} The lowest number from the array. It returns <tt>NaN</tt> if not every element could be
     * interpreted as a number and <tt>Infinity</tt> if an empty array is given or no element could be interpreted
     * as a number.
     * @memberof JXG.Math.Statistics
     */
    min: function (arr) {
        return Math.min.apply(this, arr);
    },

    /**
     * Determines the lowest and the highest value from the given array.
     * @param {Array} arr
     * @returns {Array} The minimum value as the first and the maximum value as the second value.
     * @memberof JXG.Math.Statistics
     */
    range: function (arr) {
        return [this.min(arr), this.max(arr)];
    },

    /**
     * Determines the absolute value of every given value.
     * @param {Array|Number} arr
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    abs: function (arr) {
        var i, len, res;

        if (Type.isArray(arr)) {
            if (arr.map) {
                res = arr.map(Math.abs);
            } else {
                len = arr.length;
                res = [];

                for (i = 0; i < len; i++) {
                    res[i] = Math.abs(arr[i]);
                }
            }
        } else if (ArrayBuffer.isView(arr)) {
            res = arr.map(Math.abs);
        } else {
            res = Math.abs(arr);
        }
        return res;
    },

    /**
     * Adds up two (sequences of) values. If one value is an array and the other one is a number the number
     * is added to every element of the array. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @param {Array|Number} arr1
     * @param {Array|Number} arr2
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    add: function (arr1, arr2) {
        var i,
            len,
            res = [];

        arr1 = Type.evalSlider(arr1);
        arr2 = Type.evalSlider(arr2);

        if (Type.isArray(arr1) && Type.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] + arr2;
            }
        } else if (Type.isNumber(arr1) && Type.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 + arr2[i];
            }
        } else if (Type.isArray(arr1) && Type.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] + arr2[i];
            }
        } else {
            res = arr1 + arr2;
        }

        return res;
    },

    /**
     * Divides two (sequences of) values. If two arrays are given and the lengths don't match the shortest length
     * is taken.
     * @param {Array|Number} arr1 Dividend
     * @param {Array|Number} arr2 Divisor
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    div: function (arr1, arr2) {
        var i,
            len,
            res = [];

        arr1 = Type.evalSlider(arr1);
        arr2 = Type.evalSlider(arr2);

        if (Type.isArray(arr1) && Type.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] / arr2;
            }
        } else if (Type.isNumber(arr1) && Type.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 / arr2[i];
            }
        } else if (Type.isArray(arr1) && Type.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] / arr2[i];
            }
        } else {
            res = arr1 / arr2;
        }

        return res;
    },

    /**
     * @function
     * @deprecated Use {@link JXG.Math.Statistics.div} instead.
     * @memberof JXG.Math.Statistics
     */
    divide: function () {
        JXG.deprecated("Statistics.divide()", "Statistics.div()");
        Mat.Statistics.div.apply(Mat.Statistics, arguments);
    },

    /**
     * Divides two (sequences of) values and returns the remainder. If two arrays are given and the lengths don't
     * match the shortest length is taken.
     * @param {Array|Number} arr1 Dividend
     * @param {Array|Number} arr2 Divisor
     * @param {Boolean} [math=false] Mathematical mod or symmetric mod? Default is symmetric, the JavaScript <tt>%</tt> operator.
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    mod: function (arr1, arr2, math) {
        var i,
            len,
            res = [],
            mod = function (a, m) {
                return a % m;
            };

        math = Type.def(math, false);

        if (math) {
            mod = Mat.mod;
        }

        arr1 = Type.evalSlider(arr1);
        arr2 = Type.evalSlider(arr2);

        if (Type.isArray(arr1) && Type.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = mod(arr1[i], arr2);
            }
        } else if (Type.isNumber(arr1) && Type.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = mod(arr1, arr2[i]);
            }
        } else if (Type.isArray(arr1) && Type.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = mod(arr1[i], arr2[i]);
            }
        } else {
            res = mod(arr1, arr2);
        }

        return res;
    },

    /**
     * Multiplies two (sequences of) values. If one value is an array and the other one is a number the number
     * is multiplied to every element of the array. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @param {Array|Number} arr1
     * @param {Array|Number} arr2
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    multiply: function (arr1, arr2) {
        var i,
            len,
            res = [];

        arr1 = Type.evalSlider(arr1);
        arr2 = Type.evalSlider(arr2);

        if (Type.isArray(arr1) && Type.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] * arr2;
            }
        } else if (Type.isNumber(arr1) && Type.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 * arr2[i];
            }
        } else if (Type.isArray(arr1) && Type.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] * arr2[i];
            }
        } else {
            res = arr1 * arr2;
        }

        return res;
    },

    /**
     * Subtracts two (sequences of) values. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @param {Array|Number} arr1 Minuend
     * @param {Array|Number} arr2 Subtrahend
     * @returns {Array|Number}
     * @memberof JXG.Math.Statistics
     */
    subtract: function (arr1, arr2) {
        var i,
            len,
            res = [];

        arr1 = Type.evalSlider(arr1);
        arr2 = Type.evalSlider(arr2);

        if (Type.isArray(arr1) && Type.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] - arr2;
            }
        } else if (Type.isNumber(arr1) && Type.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 - arr2[i];
            }
        } else if (Type.isArray(arr1) && Type.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] - arr2[i];
            }
        } else {
            res = arr1 - arr2;
        }

        return res;
    },

    /**
     * The Theil-Sen estimator can be used to determine a more robust linear regression of a set of sample
     * points than least squares regression in {@link JXG.Math.Numerics.regressionPolynomial}.
     *
     * If the function should be applied to an array a of points, a the coords array can be generated with
     * JavaScript array.map:
     *
     * <pre>
     * JXG.Math.Statistics.TheilSenRegression(a.map(el => el.coords));
     * </pre>
     *
     * @param {Array} coords Array of {@link JXG.Coords}.
     * @returns {Array} A stdform array of the regression line.
     * @memberof JXG.Math.Statistics
     *
     * @example
     * var board = JXG.JSXGraph.initBoard('jxgbox', { boundingbox: [-6,6,6,-6], axis : true });
     * var a=[];
     * a[0]=board.create('point', [0,0]);
     * a[1]=board.create('point', [3,0]);
     * a[2]=board.create('point', [0,3]);
     *
     * board.create('line', [
     *     () => JXG.Math.Statistics.TheilSenRegression(a.map(el => el.coords))
     *   ],
     *   {strokeWidth:1, strokeColor:'black'});
     *
     * </pre><div id="JXG0a28be85-91c5-44d3-aae6-114e81217cf0" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG0a28be85-91c5-44d3-aae6-114e81217cf0',
     *             {boundingbox: [-6,6,6,-6], axis: true, showcopyright: false, shownavigation: false});
     *     var a=[];
     *     a[0]=board.create('point', [0,0]);
     *     a[1]=board.create('point', [3,0]);
     *     a[2]=board.create('point', [0,3]);
     *
     *     board.create('line', [
     *         () => JXG.Math.Statistics.TheilSenRegression(a.map(el => el.coords))
     *       ],
     *       {strokeWidth:1, strokeColor:'black'});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    TheilSenRegression: function (coords) {
        var i,
            j,
            slopes = [],
            tmpslopes = [],
            yintercepts = [];

        for (i = 0; i < coords.length; i++) {
            tmpslopes.length = 0;

            for (j = 0; j < coords.length; j++) {
                if (Math.abs(coords[j].usrCoords[1] - coords[i].usrCoords[1]) > Mat.eps) {
                    tmpslopes[j] =
                        (coords[j].usrCoords[2] - coords[i].usrCoords[2]) /
                        (coords[j].usrCoords[1] - coords[i].usrCoords[1]);
                }
            }

            slopes[i] = this.median(tmpslopes);
            yintercepts.push(coords[i].usrCoords[2] - slopes[i] * coords[i].usrCoords[1]);
        }

        return [this.median(yintercepts), this.median(slopes), -1];
    },

    /**
     * Generate values of a standard normal random variable with the Marsaglia polar method, see
     * {@link https://en.wikipedia.org/wiki/Marsaglia_polar_method}.
     * See also D. E. Knuth, The art of computer programming, vol 2, p. 117.
     *
     * @param {Number} mean mean value of the normal distribution
     * @param {Number} stdDev standard deviation of the normal distribution
     * @returns {Number} value of a standard normal random variable
     * @memberof JXG.Math.Statistics
     */
    generateGaussian: function (mean, stdDev) {
        var u, v, s;

        if (this.hasSpare) {
            this.hasSpare = false;
            return this.spare * stdDev + mean;
        }

        do {
            u = Math.random() * 2 - 1;
            v = Math.random() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);

        s = Math.sqrt((-2.0 * Math.log(s)) / s);

        this.spare = v * s;
        this.hasSpare = true;
        return mean + stdDev * u * s;
    },

    /**
     * Generate value of a standard normal random variable with given mean and standard deviation.
     * Alias for {@link JXG.Math.Statistics#generateGaussian}
     *
     * @param {Number} mean
     * @param {Number} stdDev
     * @returns Number
     * @memberof JXG.Math.Statistics
     * @see JXG.Math.Statistics#generateGaussian
     */
    randomNormal: function (mean, stdDev) {
        return this.generateGaussian(mean, stdDev);
    },

    /**
     * Generate value of a uniform distributed random variable in the interval [a, b].
     * @param {Number} a
     * @param {Number} b
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomUniform: function (a, b) {
        return Math.random() * (b - a) + a;
    },

    /**
     * Generate value of a random variable with exponential distribution, i.e.
     * <i>f(x; lambda) = lambda * e^(-lambda x)</i> if <i>x >= 0</i> and <i>f(x; lambda) = 0</i> if <i>x < 0</i>.
     * See {@link https://en.wikipedia.org/wiki/Exponential_distribution}.
     * Algorithm: D.E. Knuth, TAOCP 2, p. 128.
     *
     * @param {Number} lambda <i>&gt; 0</i>
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomExponential: function (lbda) {
        var u;

        // Knuth, TAOCP 2, p 128
        // See https://en.wikipedia.org/wiki/Exponential_distribution
        if (lbda <= 0) {
            return NaN;
        }

        do {
            u = Math.random();
        } while (u === 0);

        return -Math.log(u) / lbda;
    },

    /**
     * Generate value of a random variable with gamma distribution of order alpha.
     * See {@link https://en.wikipedia.org/wiki/Gamma_distribution}.
     * Algorithm: D.E. Knuth, TAOCP 2, p. 129.

     * @param {Number} a shape, <i> &gt; 0</i>
     * @param {Number} [b=1] scale, <i> &gt; 0</i>
     * @param {Number} [t=0] threshold
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomGamma: function (a, b, t) {
        var u, v, x, y,
            p, q;

        if (a <= 0) {
            return NaN;
        }

        b = b || 1;
        t = t || 0;

        if (a === 1) {
            return b * this.randomExponential(1) + t;
        }

        if (a < 1) {
            // Method by Ahrens
            // Knuth, TAOCP 2, Ex. 16, p 551
            p = Math.E / (a + Math.E);

            do {
                u = Math.random();
                do {
                    v = Math.random();
                } while (v === 0);
                if (u < p) {
                    x = Math.pow(v, 1 / a);
                    q = Math.exp(-x);
                } else {
                    x = 1 - Math.log(v);
                    q = Math.pow(x, a - 1);
                }
                u = Math.random();
            } while (u >= q);
            return b * x + t;
        }

        // a > 1
        // Knuth, TAOCP 2, p 129
        do {
            y = Math.tan(Math.PI * Math.random());
            x = Math.sqrt(2 * a - 1) * y + a - 1;
            if (x > 0) {
                v = Math.random();
            } else {
                continue;
            }
        } while (x <= 0.0 || v > (1 + y * y) * Math.exp( (a - 1) * Math.log(x / (a-1)) - Math.sqrt(2 * a - 1) * y));

        return b * x + t;
    },

    /**
     * Generate value of a random variable with beta distribution with shape parameters alpha and beta.
     * See {@link https://en.wikipedia.org/wiki/Beta_distribution}.
     *
     * @param {Number} alpha <i>&gt; 0</i>
     * @param {Number} beta <i>&gt; 0</i>
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomBeta: function (a, b) {
        // Knuth, TAOCP 2, p 129
        var x1, x2, x;

        if (a <= 0 || b <= 0) {
            return NaN;
        }

        x1 = this.randomGamma(a);
        x2 = this.randomGamma(b);
        x = x1 / (x1 + x2);
        return x;
    },

    /**
     * Generate value of a random variable with chi-square distribution with k degrees of freedom.
     * See {@link https://en.wikipedia.org/wiki/Chi-squared_distribution}.
     *
     * @param {Number} k <i>&gt; 0</i>
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomChisquare: function (nu) {
        // Knuth, TAOCP 2, p 130

        if (nu <= 0) {
            return NaN;
        }

        return 2 * this.randomGamma(nu * 0.5);
    },

    /**
     * Generate value of a random variable with F-distribution with d<sub>1</sub> and d<sub>2</sub> degrees of freedom.
     * See {@link https://en.wikipedia.org/wiki/F-distribution}.
     * @param {Number} d1 <i>&gt; 0</i>
     * @param {Number} d2 <i>&gt; 0</i>
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomF: function (nu1, nu2) {
        // Knuth, TAOCP 2, p 130
        var y1, y2;

        if (nu1 <= 0 || nu2 <= 0) {
            return NaN;
        }

        y1 = this.randomChisquare(nu1);
        y2 = this.randomChisquare(nu2);

        return (y1 * nu2) / (y2 * nu1);
    },

    /**
     * Generate value of a random variable with Students-t-distribution with &nu; degrees of freedom.
     * See {@link https://en.wikipedia.org/wiki/Student%27s_t-distribution}.
     * @param {Number} nu <i>&gt; 0</i>
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomT: function (nu) {
        // Knuth, TAOCP 2, p 130
        var y1, y2;

        if (nu <= 0) {
            return NaN;
        }

        y1 = this.randomNormal(0, 1);
        y2 = this.randomChisquare(nu);

        return y1 / Math.sqrt(y2 / nu);
    },

    /**
     * Generate values for a random variable in binomial distribution with parameters <i>n</i> and <i>p</i>.
     * See {@link https://en.wikipedia.org/wiki/Binomial_distribution}.
     * It uses algorithm BG from {@link https://dl.acm.org/doi/pdf/10.1145/42372.42381}.
     *
     * @param {Number} n Number of trials (n >= 0)
     * @param {Number} p Propability (0 <= p <= 1)
     * @returns Number Integer value of a random variable in binomial distribution
     * @memberof JXG.Math.Statistics
     *
     * @example
     * console.log(JXG.Mat.Statistics.generateBinomial(100,0.1));
     * // Possible output: 18
     *
     */
    randomBinomial: function (n, p) {
        var x, y, c,
            a, b, N1;

        if (p < 0 || p > 1 || n < 0) {
            return NaN;
        }

        // Edge cases
        if (p === 0) {
            return 0;
        }
        if (p === 1) {
            return n;
        }

        // Now, we can assume 0 < p < 1.

        // Fast path for common cases
        if (n === 0) {
            return 0;
        }
        if (n === 1) {
            return ((Math.random() < p) ? 1 : 0);
        }

        // Exploit symmetry
        if (p > 0.5) {
            return n - this.randomBinomial(n, 1 - p);
        }

        // General case: n > 1, p <= 0.5
        if (n < 100) {
            // n small:
            // Algorithm BG (Devroye) from:
            // https://dl.acm.org/doi/pdf/10.1145/42372.42381
            // Time O(np) so suitable for np small only.
            x = -1;
            y = 0;

            c = Math.log(1 - p);
            if (c === 0) {
                return 0;
            }

            do {
                x += 1;
                y += Math.floor(Math.log(Math.random()) / c) + 1;
            } while (y < n);
        } else {
            // n large:
            // Knuth, TAOCP 2, p 131
            a = 1 + Math.floor(n * 0.5);
            b = n - a + 1;
            x = this.randomBeta(a, b);
            if (x >= p) {
                N1 = this.randomBinomial(a - 1, p / x);
                x = N1;
            } else {
                N1 = this.randomBinomial(b - 1, (p - x) / (1 - x));
                x = a + N1;
            }
        }
        return x;
    },

    /**
     * Generate values for a random variable in geometric distribution with propability <i>p</i>.
     * See {@link https://en.wikipedia.org/wiki/Geometric_distribution}.
     *
     * @param {Number} p (0 <= p <= 1)
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomGeometric: function(p) {
        var u;

        if (p < 0 || p > 1) {
            return NaN;
        }
        // Knuth, TAOCP 2, p 131
        u = Math.random();

        return Math.ceil(Math.log(u) / Math.log(1 - p));
    },

    /**
     * Generate values for a random variable in Poisson distribution with mean <i>mu</i>.
     * See {@link https://en.wikipedia.org/wiki/Poisson_distribution}.
     *
     * @param {Number} mu (0 < mu)
     * @returns Number
     * @memberof JXG.Math.Statistics
     */
    randomPoisson: function (mu) {
        var e = Math.exp(-mu),
            N,
            m = 0,
            u = 1,
            x,
            alpha = 7 / 8;

        if (mu <= 0) {
            return NaN;
        }

        // Knuth, TAOCP 2, p 132
        if (mu < 10) {
            do {
                u *= Math.random();
                m += 1;
            } while (u > e);
            N = m - 1;
        } else {
            m = Math.floor(alpha * mu);
            x = this.randomGamma(m);
            if (x < mu) {
                N = m + this.randomPoisson(mu - x);
            } else {
                N = this.randomBinomial(m - 1, mu / x);
            }
        }
        return N;
    },

    /**
     * Generate values for a random variable in hypergeometric distribution.
     * Samples are drawn from a hypergeometric distribution with specified parameters, <i>good</i> (ways to make a good selection),
     * <i>bad</i> (ways to make a bad selection), and <i>samples</i> (number of items sampled, which is less than or equal to <i>good + bad</i>).
     * <p>
     * Naive implementation with runtime <i>O(samples)</i>.
     *
     * @param {Number} good ways to make a good selection
     * @param {Number} bad ways to make a bad selection
     * @param {Number} samples number of items sampled
     * @returns
     * @memberof JXG.Math.Statistics
     */
    randomHypergeometric: function(good, bad, k) {
        var i, u,
            x = 0,
            n = good + bad;

        if (good < 0 || bad < 0 || k > good + bad) {
            return NaN;
        }

        // Naive method
        for (i = 0; i < k; i ++) {
            u = Math.random();
            if (n * u <= good) {
                x += 1;
                if (x === good) {
                    return x;
                }
                good -= 1;
            }
            n -= 1;
        }
        return x;
    },

    /**
     * Compute the histogram of a dataset.
     * Optional parameters can be supplied through a JavaScript object
     * with the following default values:
     * <pre>
     * {
     *   bins: 10,          // Number of bins
     *   range: false,      // false or array. The lower and upper range of the bins.
     *                      // If not provided, range is simply [min(x), max(x)].
     *                      // Values outside the range are ignored.
     *   density: false,    // If true, normalize the counts by dividing by sum(counts)
     *   cumulative: false
     * }
     * </pre>
     * The function returns an array containing two arrays. The first array is of length bins+1
     * containing the start values of the bins. The last entry contains the end values of the last bin.
     * <p>
     * The second array contains the counts of each bin.
     * @param {Array} x
     * @param {Object} opt Optional parameters
     * @returns Array [bin, counts] Array bins contains start values of bins, array counts contains
     * the number of entries of x which are contained in each bin.
     * @memberof JXG.Math.Statistics
     *
     * @example
     *     var curve = board.create('curve', [[], []]);
     *     curve.updateDataArray = function () {
     *       var i, res, x = [];
     *
     *       for (i = 0; i < 5000; i++) {
     *         x.push(JXG.Math.Statistics.randomGamma(2));
     *       }
     *       res = JXG.Math.Statistics.histogram(x, { bins: 50, density: true, cumulative: false, range: [-5, 5] });
     *       this.dataX = res[1];
     *       this.dataY = res[0];
     *     };
     *     board.update();
     *
     * </pre><div id="JXGda56df4d-a5a5-4c87-9ffc-9bbc1b512302" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGda56df4d-a5a5-4c87-9ffc-9bbc1b512302',
     *             {boundingbox: [-1, 3, 6, -1], axis: true, showcopyright: false, shownavigation: false});
     *         var curve = board.create('curve', [[], []]);
     *         curve.updateDataArray = function () {
     *           var i, res, x = [];
     *
     *           for (i = 0; i < 5000; i++) {
     *             x.push(JXG.Math.Statistics.randomGamma(2));
     *           }
     *           res = JXG.Math.Statistics.histogram(x, { bins: 50, density: true, cumulative: false, range: [-5, 5] });
     *           this.dataX = res[1];
     *           this.dataY = res[0];
     *         };
     *         board.update();
     *     })();
     *
     * </script><pre>
     *
     */
    histogram: function (x, opt) {
        var i, le, k,
            mi, ma, num_bins, delta,
            range,
            s,
            counts = [],
            bins = [];

        // Evaluate number of bins
        num_bins = opt.bins || 10;

        // Evaluate range
        range = opt.range || false;
        if (range === false) {
            mi = Math.min.apply(null, x);
            ma = Math.max.apply(null, x);
        } else {
            mi = range[0];
            ma = range[1];
        }

        // Set uniform delta
        if (num_bins > 0) {
            delta = (ma - mi) / (num_bins - 1);
        } else {
            delta = 0;
        }

        // Set the bins and init the counts array
        for (i = 0; i < num_bins; i++) {
            counts.push(0);
            bins.push(mi + i * delta);
        }
        // bins.push(ma);

        // Determine the counts
        le = x.length;
        for (i = 0; i < le; i++) {
            k = Math.floor((x[i] - mi) / delta);
            if (k >= 0 && k < num_bins) {
                counts[k] += 1;
            }
        }

        // Normalize if density===true
        if (opt.density) {
            s = JXG.Math.Statistics.sum(counts);
            for (i = 0; i < num_bins; i++) {
                // counts[i] /= (s * delta);
                counts[i] /= s;
            }
        }

        // Cumulative counts
        if (opt.cumulative) {
            for (i = 1; i < num_bins; i++) {
                counts[i] += counts[i - 1];
            }
        }

        return [counts, bins];
    }
};

export default Mat.Statistics;
