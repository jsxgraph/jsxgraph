/*global JXG: true, define: true, escape: true, unescape: true*/
/*jslint nomen: true, plusplus: true, bitwise: true*/

import JXG from "../jxg.js";

// constants
var UTF8_ACCEPT = 0,
    // UTF8_REJECT = 12,
    UTF8D = [
        // The first part of the table maps bytes to character classes that
        // to reduce the size of the transition table and create bitmasks.
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
        9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 10, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 4, 3, 3, 11, 6, 6, 6, 5, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,

        // The second part is a transition table that maps a combination
        // of a state of the automaton and a character class to a state.
        0, 12, 24, 36, 60, 96, 84, 12, 12, 12, 48, 72, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
        12, 12, 12, 0, 12, 12, 12, 12, 12, 0, 12, 0, 12, 12, 12, 24, 12, 12, 12, 12, 12, 24, 12,
        24, 12, 12, 12, 12, 12, 12, 12, 12, 12, 24, 12, 12, 12, 12, 12, 24, 12, 12, 12, 12, 12,
        12, 12, 24, 12, 12, 12, 12, 12, 12, 12, 12, 12, 36, 12, 36, 12, 12, 12, 36, 12, 12, 12,
        12, 12, 36, 12, 36, 12, 12, 12, 36, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12
    ];

// Util namespace
JXG.Util = JXG.Util || {};

/**
 * UTF8 encoding routines
 * @namespace
 */
JXG.Util.UTF8 = {
    /**
     * Encode a string to utf-8.
     * @param {String} string
     * @returns {String} utf8 encoded string
     */
    encode: function (string) {
        var n,
            c,
            utftext = "",
            len = string.length;

        string = string.replace(/\r\n/g, "\n");

        // See
        // http://ecmanaut.blogspot.ca/2006/07/encoding-decoding-utf8-in-javascript.html
        if (typeof unescape === "function" && typeof encodeURIComponent === 'function') {
            return unescape(encodeURIComponent(string));
        }

        for (n = 0; n < len; n++) {
            c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    },

    /**
     * Decode a string from utf-8.
     * @param {String} utftext to decode
     * @returns {String} utf8 decoded string
     */
    decode: function (utftext) {
        /*
                 The following code is a translation from C99 to JavaScript.

                 The original C99 code can be found at
                    https://bjoern.hoehrmann.de/utf-8/decoder/dfa/

                 Original copyright note:

                 Copyright (c) 2008-2009 Bjoern Hoehrmann <bjoern@hoehrmann.de>

                 License: MIT License (see LICENSE.MIT)
            */

        var i,
            charCode,
            type,
            j = 0,
            codepoint = 0,
            state = UTF8_ACCEPT,
            chars = [],
            len = utftext.length,
            results = [];

        for (i = 0; i < len; i++) {
            charCode = utftext.charCodeAt(i);
            type = UTF8D[charCode];

            if (state !== UTF8_ACCEPT) {
                codepoint = (charCode & 0x3f) | (codepoint << 6);
            } else {
                codepoint = (0xff >> type) & charCode;
            }

            state = UTF8D[256 + state + type];

            if (state === UTF8_ACCEPT) {
                if (codepoint > 0xffff) {
                    chars.push(0xd7c0 + (codepoint >> 10), 0xdc00 + (codepoint & 0x3ff));
                } else {
                    chars.push(codepoint);
                }

                j++;

                if (j % 10000 === 0) {
                    results.push(String.fromCharCode.apply(null, chars));
                    chars = [];
                }
            }
        }
        results.push(String.fromCharCode.apply(null, chars));
        return results.join("");
    },

    /**
     * Extends the standard charCodeAt() method of the String class to find the ASCII char code of
     * a character at a given position in a UTF8 encoded string.
     * @param {String} str
     * @param {Number} i position of the character
     * @returns {Number}
     */
    asciiCharCodeAt: function (str, i) {
        var c = str.charCodeAt(i);

        if (c > 255) {
            switch (c) {
                case 8364:
                    c = 128;
                    break;
                case 8218:
                    c = 130;
                    break;
                case 402:
                    c = 131;
                    break;
                case 8222:
                    c = 132;
                    break;
                case 8230:
                    c = 133;
                    break;
                case 8224:
                    c = 134;
                    break;
                case 8225:
                    c = 135;
                    break;
                case 710:
                    c = 136;
                    break;
                case 8240:
                    c = 137;
                    break;
                case 352:
                    c = 138;
                    break;
                case 8249:
                    c = 139;
                    break;
                case 338:
                    c = 140;
                    break;
                case 381:
                    c = 142;
                    break;
                case 8216:
                    c = 145;
                    break;
                case 8217:
                    c = 146;
                    break;
                case 8220:
                    c = 147;
                    break;
                case 8221:
                    c = 148;
                    break;
                case 8226:
                    c = 149;
                    break;
                case 8211:
                    c = 150;
                    break;
                case 8212:
                    c = 151;
                    break;
                case 732:
                    c = 152;
                    break;
                case 8482:
                    c = 153;
                    break;
                case 353:
                    c = 154;
                    break;
                case 8250:
                    c = 155;
                    break;
                case 339:
                    c = 156;
                    break;
                case 382:
                    c = 158;
                    break;
                case 376:
                    c = 159;
                    break;
                default:
                    break;
            }
        }
        return c;
    }
};

export default JXG.Util.UTF8;
