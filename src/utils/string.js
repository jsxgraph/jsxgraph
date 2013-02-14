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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 */

/**
 * @fileoverview String manipulation routines.
 */

define([], function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Replaces all occurences of &amp; by &amp;amp;, &gt; by &amp;gt;, and &lt; by &amp;lt;.
         * @param {String} str
         * @returns {String}
         */
        escapeHTML: function (str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        /**
         * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
         * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
         * @param {String} str
         * @returns {String}
         */
        unescapeHTML: function (str) {
            // this regex is NOT insecure. We are replacing everything found with ''
            /*jslint regexp:true*/
            return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        },

        /**
         * Makes a string lower case except for the first character which will be upper case.
         * @param {String} str Arbitrary string
         * @returns {String} The capitalized string.
         */
        capitalize: function (str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        },

        /**
         * Make numbers given as strings nicer by removing all unnecessary leading and trailing zeroes.
         * @param {String} str
         * @returns {String}
         */
        trimNumber: function (str) {
            str = str.replace(/^0+/, '');
            str = str.replace(/0+$/, '');

            if (str[str.length - 1] === '.' || str[str.length - 1] === ',') {
                str = str.slice(0, -1);
            }

            if (str[0] === '.' || str[0] === ',') {
                str = "0" + str;
            }

            return str;
        },

        /**
         * Remove all leading and trailing whitespaces from a given string.
         * @param {String} str
         * @returns {String}
         */
        trim: function (str) {
            str = str.replace(/^\s+/, '');
            str = str.replace(/\s+$/, '');

            return str;
        }
    });

    return JXG;
});