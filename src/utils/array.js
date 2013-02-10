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

/* depends:
 jxg
 utils/type
 */

/**
 * @fileoverview array.js contains multiple helper functions to simplify the handling of arrays. These functions will, for
 * now, be attached directly to the JXG namespace.
 */

(function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Search an array for a given value.
         * @param {Array} array
         * @param value
         * @param {String} [sub] Use this property if the elements of the array are objects.
         * @returns {Number} The index of the first appearance of the given value, or
         * <tt>-1</tt> if the value was not found.
         */
        indexOf: function (array, value, sub) {
            var i, s = JXG.exists(sub);

            if (Array.indexOf && !s) {
                return array.indexOf(value);
            }

            for (i = 0; i < array.length; i++) {
                if ((s && array[i][sub] === value) || (!s && array[i] === value)) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Eliminates duplicate entries in an array.
         * @param {Array} a An array
         * @returns {Array} The array with duplicate entries eliminated.
         */
        eliminateDuplicates: function (a) {
            var i,
                len = a.length,
                result = [],
                obj = {};

            for (i = 0; i < len; i++) {
                obj[a[i]] = 0;
            }

            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    result.push(i);
                }
            }

            return result;
        },

        /**
         * Swaps to array elements.
         * @param {Array} arr
         * @param {Number} i
         * @param {Number} j
         * @returns {Array} Reference to the given array.
         */
        swap: function (arr, i, j) {
            var tmp;

            tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;

            return arr;
        },

        /**
         * Generates a copy of an array and removes the duplicate entries. The original
         * Array will be altered.
         * @param {Array} arr
         * @returns {Array}
         */
        uniqueArray: function (arr) {
            var i, j, isArray,
                ret = [];

            if (arr.length === 0) {
                return [];
            }

            isArray = JXG.isArray(arr[0]);

            for (i = 0; i < arr.length; i++) {
                for (j = i + 1; j < arr.length; j++) {
                    if (isArray && JXG.cmpArrays(arr[i], arr[j])) {
                        arr[i] = [];
                    } else if (!isArray && arr[i] === arr[j]) {
                        arr[i] = '';
                    }
                }
            }

            j = 0;

            for (i = 0; i < arr.length; i++) {
                if (!isArray && arr[i] !== '') {
                    ret[j] = arr[i];
                    j += 1;
                } else if (isArray && arr[i].length !== 0) {
                    ret[j] = (arr[i].slice(0));
                    j += 1;
                }
            }

            return ret;
        },

        /**
         * Checks if an array contains an element equal to <tt>val</tt> but does not check the type!
         * @param {Array} arr
         * @param val
         * @returns {Boolean}
         */
        isInArray: function (arr, val) {
            return JXG.indexOf(arr, val) > -1;
        },

        /**
         * Compare two arrays.
         * @param {Array} a1
         * @param {Array} a2
         * @returns {Boolean} <tt>true</tt>, if the arrays coefficients are of same type and value.
         */
        cmpArrays: function (a1, a2) {
            var i;

            // trivial cases
            if (a1 === a2) {
                return true;
            }

            if (a1.length !== a2.length) {
                return false;
            }

            for (i = 0; i < a1.length; i++) {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Removes an element from the given array
         * @param {Array} ar
         * @param el
         * @returns {Array}
         */
        removeElementFromArray: function (ar, el) {
            var i;

            for (i = 0; i < ar.length; i++) {
                if (ar[i] === el) {
                    ar.splice(i, 1);
                    return ar;
                }
            }

            return ar;
        }
    });
}());