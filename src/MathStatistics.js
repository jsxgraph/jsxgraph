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
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Functions for mathematical statistics. Most functions are like in the statistics package R.
 * @namespace
 */
JXG.Math.Statistics = {

    /**
     * Sums up all elements of the given array.
     * @param {Array} arr An array of numbers.
     * @returns {Number}
     */
    sum: function (arr) {
        var i, len = arr.length, res = 0;

        for (i = 0; i<len; i++) {
            res += arr[i];
        }
        return res;
    },

    /**
     * Multiplies all elements of the given array.
     * @param {Array} arr An array of numbers.
     * @returns {Number}
     */
    prod: function (arr) {
        var i, len = arr.length, res = 1;

        for (i = 0; i < len; i++) {
            res *= arr[i];
        }
        return res;
    },

    /**
     * Determines the mean value of the values given in an array.
     * @param {Array} arr
     * @returns {Number}
     */
    mean: function (arr) {
        if (arr.length > 0) {
            return this.sum(arr)/arr.length;
        } else {
            return 0.0;
        }
    },

    /**
     * The median of a finite set of values is the value that divides the set
     * into two equal sized subsets.
     * @param {Array} arr The set of values.
     * @returns {Number}
     */
    median: function (arr) {
        var tmp, len;

        if (arr.length > 0) {
            tmp = arr.slice(0);
            tmp.sort(function(a, b) {
                return a - b;
            });
            len = tmp.length;
            if (len % 2 == 1) {
                return tmp[parseInt(len*0.5)];
            } else{
                return (tmp[len*0.5-1]+tmp[len*0.5])*0.5;
            }
        } else {
            return 0.0;
        }
    },

    /**
     * Bias-corrected sample variance. A variance is a measure of how far a
     * set of numbers are spread out from each other.
     * @param {Array} arr
     * @returns {Number}
     */
    variance: function (arr) {
        var m, res, i, len = arr.length;

        if (len > 1) {
            m = this.mean(arr);
            res = 0;
            for(i = 0; i < len; i++) {
                res += (arr[i] - m) * (arr[i] - m);
            }
            return res/(arr.length - 1);
        } else {
            return 0.0;
        }
    },

    /**
     * Determines the <strong>s</strong>tandard <strong>d</strong>eviation which shows how much
     * variation there is from the average value of a set of numbers.
     * @param {Array} arr
     * @returns {Number}
     */
    sd: function (arr) {
        return Math.sqrt(this.variance(arr));
    },

    /**
     * Weighted mean value is basically the same as {@link JXG.Math.Statistics#mean} but here the values
     * are weighted, i.e. multiplied with another value called <em>weight</em>. The weight values are given
     * as a second array with the same length as the value array..
     * @throws {Error} If the dimensions of the arrays don't match.
     * @param {Array} arr Set of alues.
     * @param {Array} w Weight values.
     * @returns {Number}
     */
    weightedMean: function (arr, w) {
        if (arr.length != w.length) {
            throw new Error('JSXGraph error (Math.Statistics.weightedMean): Array dimension mismatch.');
        }

        if (arr.length > 0) {
            return this.mean(this.multiply(arr, w));
        } else {
            return 0.0;
        }
    },

    /**
     * Extracts the maximum value from the array.
     * @param {Array} arr
     * @returns {Number} The highest number from the array. It returns <tt>NaN</tt> if not every element could be
     * interpreted as a number and <tt>-Infinity</tt> if an empty array is given or no element could be interpreted
     * as a number.
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
     */
    min: function (arr) {
        return Math.min.apply(this, arr);
    },

    /**
     * Determines the lowest and the highest value from the given array.
     * @param {Array} arr
     * @returns {Array} The minimum value as the first and the maximum value as the second value.
     */
    range: function (arr) {
        return [this.min(arr), this.max(arr)];
    },

    /**
     * Determines the absolute value of every given value.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr
     * @returns {Array|Number}
     */
    abs: function (arr) {
        var i, len, res;

        if (JXG.isArray(arr)) {
            len = arr.length;
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = Math.abs(arr[i]);
            }
        } else if (JXG.isNumber(arr)) {
            res = Math.abs(arr);
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.abs): Invalid input.');
        }

        return res;
    },

    /**
     * Adds up two (sequences of) values. If one value is an array and the other one is a number the number
     * is added to every element of the array. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr1
     * @param {Array|Number} arr2
     * @returns {Array|Number}
     */
    add: function (arr1, arr2) {
        var i, len, res = [];

        if (JXG.isArray(arr1) && JXG.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] + arr2;
            }
        } else if (JXG.isNumber(arr1) && JXG.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 + arr2[i];
            }
        } else if (JXG.isArray(arr1) && JXG.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] + arr2[i];
            }
        } else if (JXG.isNumber(arr1) && JXG.isNumber(arr2)) {
            res = arr1 + arr2;
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.add): Invalid input.');
        }
        
        return res;
    },

    /**
     * Divides two (sequences of) values. If two arrays are given and the lengths don't match the shortest length
     * is taken.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr1 Dividend
     * @param {Array|Number} arr2 Divisor
     * @returns {Array|Number}
     */
    div: function (arr1, arr2) {
        var i, len, res = [];

        if (JXG.isArray(arr1) && JXG.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] / arr2;
            }
        } else if (JXG.isNumber(arr1) && JXG.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 / arr2[i];
            }
        } else if (JXG.isArray(arr1) && JXG.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] / arr2[i];
            }
        } else if (JXG.isNumber(arr1) && JXG.isNumber(arr2)) {
            res = arr1 / arr2;
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.div): Invalid input.');
        }
        
        return res;
    },

    /**
     * @function
     * @deprecated Use {@link JXG.Math.Statistics#div} instead.
     */
    divide: JXG.shortcut(JXG.Math.Statistics, 'div'),

    /**
     * Divides two (sequences of) values and returns the remainder. If two arrays are given and the lengths don't
     * match the shortest length is taken.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr1 Dividend
     * @param {Array|Number} arr2 Divisor
     * @returns {Array|Number}
     */
    mod: function (arr1,arr2) {
        var i, len, res = [];

        if (JXG.isArray(arr1) && JXG.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] % arr2;
            }
        } else if (JXG.isNumber(arr1) && JXG.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 % arr2[i];
            }
        } else if (JXG.isArray(arr1) && JXG.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] % arr2[i];
            }
        } else if (JXG.isNumber(arr1) && JXG.isNumber(arr2)) {
            res = arr1 % arr2;
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.mod): Invalid input.');
        }

        return res;
    },

    /**
     * Multiplies two (sequences of) values. If one value is an array and the other one is a number the number
     * is multiplied to every element of the array. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr1
     * @param {Array|Number} arr2
     * @returns {Array|Number}
     */
    multiply: function (arr1, arr2) {
        var i, len, res = [];

        if (JXG.isArray(arr1) && JXG.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] * arr2;
            }
        } else if (JXG.isNumber(arr1) && JXG.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 * arr2[i];
            }
        } else if (JXG.isArray(arr1) && JXG.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] * arr2[i];
            }
        } else if (JXG.isNumber(arr1) && JXG.isNumber(arr2)) {
            res = arr1 * arr2;
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.mod): Invalid input.');
        }

        return res;
    },

    /**
     * Subtracts two (sequences of) values. If two arrays are given and the lengths don't match the shortest
     * length is taken.
     * @throws {Error} If the input is neither an array nor a number an exception is thrown.
     * @param {Array|Number} arr1 Minuend
     * @param {Array|Number} arr2 Subtrahend
     * @returns {Array|Number}
     */
    subtract: function (arr1, arr2) {
        var i, len, res = [];

        if (JXG.isArray(arr1) && JXG.isNumber(arr2)) {
            len = arr1.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] - arr2;
            }
        } else if (JXG.isNumber(arr1) && JXG.isArray(arr2)) {
            len = arr2.length;

            for (i = 0; i < len; i++) {
                res[i] = arr1 - arr2[i];
            }
        } else if (JXG.isArray(arr1) && JXG.isArray(arr2)) {
            len = Math.min(arr1.length, arr2.length);

            for (i = 0; i < len; i++) {
                res[i] = arr1[i] - arr2[i];
            }
        } else if (JXG.isNumber(arr1) && JXG.isNumber(arr2)) {
            res = arr1 - arr2;
        } else {
            throw new Error('JSXGraph Error (Math.Statistics.mod): Invalid input.');
        }

        return res;
    }
};