/**
 * Generate a random uuid.
 * Written by https://www.broofa.com (robert@broofa.com)
 *
 * Copyright (c) 2010 Robert Kieffer
 * Dual licensed under the MIT and GPL licenses.
 * @returns {String}
 * @example
 *   var uuid = JXG.Util.genUUID();
 *   > uuid = '92329D39-6F5C-4520-ABFC-AAB64544E172'
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true, bitwise: true*/

import JXG from "../jxg.js";

// constants
var uuidCharsStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    uuidChars = uuidCharsStr.split("");

/**
 * General utility routines
 * @namespace
 */
JXG.Util = JXG.Util || {};

JXG.Util.genUUID = function (prefix) {
    var r,
        i,
        uuid = [],
        rnd = 0;

    prefix = prefix || "";

    if (prefix !== "" && prefix.slice(prefix.length - 1) !== "-") {
        prefix = prefix + "-";
    }

    for (i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            uuid[i] = "-";
        } else if (i === 14) {
            uuid[i] = '4';
        } else {
            if (rnd <= 0x02) {
                rnd = (0x2000000 + Math.random() * 0x1000000) | 0;
            }

            r = rnd & 0xf;
            rnd = rnd >> 4;
            uuid[i] = uuidChars[i === 19 ? (r & 0x3) | 0x8 : r];
        }
    }

    return prefix + uuid.join("");
};

export default JXG.Util;
