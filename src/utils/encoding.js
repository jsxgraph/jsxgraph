/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true, bitwise: true*/

/* depends:
 jxg
 */

define([], function () {

    "use strict";

    // Util namespace
    JXG.Util = JXG.Util || {};

    JXG.Util.UTF8 = {
        /**
         * Encode a string to utf-8.
         * @param {String} string
         * @return {String} utf8 encoded string
         */
        encode : function (string) {
            var n, c,
                utftext = '',
                len = string.length;

            string = string.replace(/\r\n/g, '\n');

            for (n = 0; n < len; n++) {
                c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
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
         * @return {String} utf8 decoded string
         */
        decode : function (utftext) {
            var string = [],
                i = 0,
                c = 0,
                c2 = 0,
                c3 = 0,
                len = utftext.length;

            while (i < len) {
                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string.push(String.fromCharCode(c));
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string.push(String.fromCharCode(((c & 31) << 6) | (c2 & 63)));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string.push(String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)));
                    i += 3;
                }
            }
            return string.join('');
        },

        /**
         * Extends the standard charCodeAt() method of the String class to find the ASCII char code of
         * a character at a given position in a UTF8 encoded string.
         * @param {String} str
         * @param {Number} i position of the character
         * @return {Number}
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

    return JXG.Util.UTF8;
});