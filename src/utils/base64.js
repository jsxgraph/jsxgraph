/**
 *  Base64 encoding / decoding
 *  @see http://www.webtoolkit.info/
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true, bitwise: true*/

/* depends:
 jxg
 utils/encoding
 */

define(['jxg', 'utils/encoding'], function (JXG, Encoding) {

    "use strict";

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    // Util namespace
    JXG.Util = JXG.Util || {};

    /**
     * Base64 routines
     * @namespace
     */
    JXG.Util.Base64 = {
        encode : function (input) {
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4,
                output = [],
                i = 0;

            input = Encoding.encode(input);

            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output.push([keyStr.charAt(enc1),
                    keyStr.charAt(enc2),
                    keyStr.charAt(enc3),
                    keyStr.charAt(enc4)].join(''));
            }

            return output.join('');
        },

        // public method for decoding
        decode : function (input, utf8) {
            var chr1, chr2, chr3,
                enc1, enc2, enc3, enc4,
                output = [],
                i = 0,
                len = input.length;

            // deactivate regexp linting. Our regex is secure, because we're replacing everything with ''
            /*jslint regexp:true*/
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
            /*jslint regexp:false*/

            while (i < len) {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output.push(String.fromCharCode(chr1));

                if (enc3 !== 64) {
                    output.push(String.fromCharCode(chr2));
                }

                if (enc4 !== 64) {
                    output.push(String.fromCharCode(chr3));
                }
            }

            output = output.join('');

            if (utf8) {
                output = Encoding.decode(output);
            }

            return output;

        },

        /**
         * Disas
         * @param {string} input
         * @return {Array}
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

    return JXG.Util.Base64;
});