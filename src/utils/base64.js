/*
    Copyright 2008-2025
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
/*jslint nomen: true, plusplus: true, bitwise: true*/

import JXG from "../jxg.js";
import Encoding from "./encoding.js";

var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    pad = "=";

// Util namespace
JXG.Util = JXG.Util || {};

/**
 * Base64 routines
 * @namespace
 */
JXG.Util.Base64 = {
    // Local helper functions
    /**
     * Extracts one byte from a string and ensures the result is less than or equal to 255.
     * @param {String} s
     * @param {Number} i
     * @returns {Number} <= 255
     * @private
     */
    _getByte: function(s, i) {
        return s.charCodeAt(i) & 0xff;
    },

    /**
     * Determines the index of a base64 character in the base64 alphabet.
     * @param {String} s
     * @param {Number} i
     * @returns {Number}
     * @throws {Error} If the character can not be found in the alphabet.
     * @private
     */
    _getIndex: function(s, i) {
        return alphabet.indexOf(s.charAt(i));
    },

    /**
     * Encode the given string.
     * @param {String} input
     * @returns {string} base64 encoded version of the input string.
     */
    encode: function (input) {
        var i,
            bin,
            len,
            padLen,
            encInput,
            buffer = [];

        encInput = Encoding.encode(input);
        len = encInput.length;
        padLen = len % 3;

        for (i = 0; i < len - padLen; i += 3) {
            bin =
                (this._getByte(encInput, i) << 16) |
                (this._getByte(encInput, i + 1) << 8) |
                this._getByte(encInput, i + 2);
            buffer.push(
                alphabet.charAt(bin >> 18),
                alphabet.charAt((bin >> 12) & 63),
                alphabet.charAt((bin >> 6) & 63),
                alphabet.charAt(bin & 63)
            );
        }

        switch (padLen) {
            case 1:
                bin = this._getByte(encInput, len - 1);
                buffer.push(
                    alphabet.charAt(bin >> 2),
                    alphabet.charAt((bin << 4) & 63),
                    pad,
                    pad
                );
                break;
            case 2:
                bin = (this._getByte(encInput, len - 2) << 8) | this._getByte(encInput, len - 1);
                buffer.push(
                    alphabet.charAt(bin >> 10),
                    alphabet.charAt((bin >> 4) & 63),
                    alphabet.charAt((bin << 2) & 63),
                    pad
                );
                break;
        }

        return buffer.join("");
    },

    /**
     * Decode from Base64
     * @param {String} input Base64 encoded data
     * @param {Boolean} utf8 In case this parameter is true {@link JXG.Util.UTF8.decode} will be applied to
     * the result of the base64 decoder.
     * @throws {Error} If the string has the wrong length.
     * @returns {String}
     */
    decode: function (input, utf8) {
        var encInput,
            i,
            len,
            padLen,
            bin,
            output,
            result = [],
            buffer = [];

        // deactivate regexp linting. Our regex is secure, because we replace everything with ''
        /*jslint regexp:true*/
        encInput = input.replace(/[^A-Za-z0-9+/=]/g, "");
        /*jslint regexp:false*/

        len = encInput.length;

        if (len % 4 !== 0) {
            throw new Error(
                "JSXGraph/utils/base64: Can't decode string (invalid input length)."
            );
        }

        if (encInput.charAt(len - 1) === pad) {
            padLen = 1;

            if (encInput.charAt(len - 2) === pad) {
                padLen = 2;
            }

            // omit the last four bytes (taken care of after the for loop)
            len -= 4;
        }

        for (i = 0; i < len; i += 4) {
            bin =
                (this._getIndex(encInput, i) << 18) |
                (this._getIndex(encInput, i + 1) << 12) |
                (this._getIndex(encInput, i + 2) << 6) |
                this._getIndex(encInput, i + 3);
            buffer.push(bin >> 16, (bin >> 8) & 255, bin & 255);

            // flush the buffer, if it gets too big fromCharCode will crash
            if (i % 10000 === 0) {
                result.push(String.fromCharCode.apply(null, buffer));
                buffer = [];
            }
        }

        switch (padLen) {
            case 1:
                bin =
                    (this._getIndex(encInput, len) << 12) |
                    (this._getIndex(encInput, len + 1) << 6) |
                    this._getIndex(encInput, len + 2);
                buffer.push(bin >> 10, (bin >> 2) & 255);
                break;

            case 2:
                bin = (this._getIndex(encInput, i) << 6) | this._getIndex(encInput, i + 1);
                buffer.push(bin >> 4);
                break;
        }

        result.push(String.fromCharCode.apply(null, buffer));
        output = result.join("");

        if (utf8) {
            output = Encoding.decode(output);
        }

        return output;
    },

    /**
     * Decode the base64 input data as an array
     * @param {string} input
     * @returns {Array}
     */
    decodeAsArray: function (input) {
        var i,
            dec = this.decode(input),
            ar = [],
            len = dec.length;

        for (i = 0; i < len; i++) {
            ar[i] = dec.charCodeAt(i);
        }

        return ar;
    }
};

export default JXG.Util.Base64;
