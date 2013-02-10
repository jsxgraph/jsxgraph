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
/*jslint nomen: true, plusplus: true, bitwise:true*/

/* depends:
 jxg
 utils/type
 */

/**
 * @fileoverview A collection of helper functions that deal with numbers.
 */

(function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Truncate a number <tt>n</tt> after <tt>p</tt> decimals.
         * @param {Number} n
         * @param {Number} p
         * @returns {Number}
         */
        trunc: function (n, p) {
            p = JXG.def(p, 0);

            if (p === 0) {
                n = ~n;
                n = ~n;
            } else {
                n = n.toFixed(p);
            }

            return n;
        },

        /**
         * Truncate a number <tt>val</tt> automatically.
         * @param val
         * @returns {Number}
         */
        autoDigits: function (val) {
            var x = Math.abs(val);

            if (x > 0.1) {
                x = val.toFixed(2);
            } else if (x >= 0.01) {
                x = val.toFixed(4);
            } else if (x >= 0.0001) {
                x = val.toFixed(6);
            } else {
                x = val;
            }
            return x;
        }
    });
}());