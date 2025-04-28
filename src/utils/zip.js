/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph and JSXCompressor.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    JSXCompressor is free software dual licensed under the GNU LGPL or Apache License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
      OR
      * Apache License Version 2.0

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License, Apache
    License, and the MIT License along with JSXGraph. If not, see
    <https://www.gnu.org/licenses/>, <https://www.apache.org/licenses/LICENSE-2.0.html>,
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true, bitwise: true*/

/**
 * @fileoverview Utilities for uncompressing and base64 decoding
 */

import JXG from "../jxg.js";

// Zip routine constants

var bitReverse = [
        0x00, 0x80, 0x40, 0xc0, 0x20, 0xa0, 0x60, 0xe0, 0x10, 0x90, 0x50, 0xd0, 0x30, 0xb0,
        0x70, 0xf0, 0x08, 0x88, 0x48, 0xc8, 0x28, 0xa8, 0x68, 0xe8, 0x18, 0x98, 0x58, 0xd8,
        0x38, 0xb8, 0x78, 0xf8, 0x04, 0x84, 0x44, 0xc4, 0x24, 0xa4, 0x64, 0xe4, 0x14, 0x94,
        0x54, 0xd4, 0x34, 0xb4, 0x74, 0xf4, 0x0c, 0x8c, 0x4c, 0xcc, 0x2c, 0xac, 0x6c, 0xec,
        0x1c, 0x9c, 0x5c, 0xdc, 0x3c, 0xbc, 0x7c, 0xfc, 0x02, 0x82, 0x42, 0xc2, 0x22, 0xa2,
        0x62, 0xe2, 0x12, 0x92, 0x52, 0xd2, 0x32, 0xb2, 0x72, 0xf2, 0x0a, 0x8a, 0x4a, 0xca,
        0x2a, 0xaa, 0x6a, 0xea, 0x1a, 0x9a, 0x5a, 0xda, 0x3a, 0xba, 0x7a, 0xfa, 0x06, 0x86,
        0x46, 0xc6, 0x26, 0xa6, 0x66, 0xe6, 0x16, 0x96, 0x56, 0xd6, 0x36, 0xb6, 0x76, 0xf6,
        0x0e, 0x8e, 0x4e, 0xce, 0x2e, 0xae, 0x6e, 0xee, 0x1e, 0x9e, 0x5e, 0xde, 0x3e, 0xbe,
        0x7e, 0xfe, 0x01, 0x81, 0x41, 0xc1, 0x21, 0xa1, 0x61, 0xe1, 0x11, 0x91, 0x51, 0xd1,
        0x31, 0xb1, 0x71, 0xf1, 0x09, 0x89, 0x49, 0xc9, 0x29, 0xa9, 0x69, 0xe9, 0x19, 0x99,
        0x59, 0xd9, 0x39, 0xb9, 0x79, 0xf9, 0x05, 0x85, 0x45, 0xc5, 0x25, 0xa5, 0x65, 0xe5,
        0x15, 0x95, 0x55, 0xd5, 0x35, 0xb5, 0x75, 0xf5, 0x0d, 0x8d, 0x4d, 0xcd, 0x2d, 0xad,
        0x6d, 0xed, 0x1d, 0x9d, 0x5d, 0xdd, 0x3d, 0xbd, 0x7d, 0xfd, 0x03, 0x83, 0x43, 0xc3,
        0x23, 0xa3, 0x63, 0xe3, 0x13, 0x93, 0x53, 0xd3, 0x33, 0xb3, 0x73, 0xf3, 0x0b, 0x8b,
        0x4b, 0xcb, 0x2b, 0xab, 0x6b, 0xeb, 0x1b, 0x9b, 0x5b, 0xdb, 0x3b, 0xbb, 0x7b, 0xfb,
        0x07, 0x87, 0x47, 0xc7, 0x27, 0xa7, 0x67, 0xe7, 0x17, 0x97, 0x57, 0xd7, 0x37, 0xb7,
        0x77, 0xf7, 0x0f, 0x8f, 0x4f, 0xcf, 0x2f, 0xaf, 0x6f, 0xef, 0x1f, 0x9f, 0x5f, 0xdf,
        0x3f, 0xbf, 0x7f, 0xff
    ],
    cplens = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99,
        115, 131, 163, 195, 227, 258, 0, 0
    ],
    cplext = [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
        99, 99
    ] /* 99==invalid */,
    cpdist = [
        0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d, 0x0011, 0x0019, 0x0021,
        0x0031, 0x0041, 0x0061, 0x0081, 0x00c1, 0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601,
        0x0801, 0x0c01, 0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001
    ],
    cpdext = [
        0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12,
        12, 13, 13
    ],
    border = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
    NAMEMAX = 256;

// Util namespace
JXG.Util = JXG.Util || {};

/**
 * @class Unzip class
 * Class for gunzipping, unzipping and base64 decoding of files.
 * It is used for reading GEONExT, Geogebra and Intergeo files.
 *
 * Only Huffman codes are decoded in gunzip.
 * The code is based on the source code for gunzip.c by Pasi Ojala
 * @see http://www.cs.tut.fi/~albert/Dev/gunzip/gunzip.c
 * @see http://www.cs.tut.fi/~albert
 */
JXG.Util.Unzip = function (barray) {
    var gpflags,
        // SIZE,
        fileout,
        flens,
        fmax,
        outputArr = [],
        files = 0,
        unzipped = [],
        buf32k = new Array(32768),
        bIdx = 0,
        modeZIP = false,
        barraylen = barray.length,
        bytepos = 0,
        bb = 1,
        // bits = 0,
        literalTree = new Array(288),
        distanceTree = new Array(32),
        treepos = 0,
        Places = null,
        // crc,
        // output = "",
        // debug = false,
        // bitpos = 0,
        // Places2 = null,
        // impDistanceTree = new Array(64),
        // impLengthTree = new Array(64),
        len = 0,
        fpos = new Array(17),
        nameBuf = [];

    fpos[0] = 0;

    function readByte() {
        // bits += 8;

        if (bytepos < barraylen) {
            return barray[bytepos++];
        }

        return -1;
    }

    function byteAlign() {
        bb = 1;
    }

    function readBit() {
        var carry;

        // Prevent problems on iOS7 with >>
        try {
            // bits++;
            carry = bb & 1;
            bb >>= 1;

            if (bb === 0) {
                bb = readByte();
                carry = bb & 1;
                bb = (bb >> 1) | 0x80;
            }
        } catch (e) {
            console.log("Probably problems on iOS7 with >>");
            throw e;
        }

        return carry;
    }

    function readBits(a) {
        var res = 0,
            i = a;

        // Prevent problems on iOS7 with >>
        try {
            while (i--) {
                res = (res << 1) | readBit();
            }

            if (a) {
                res = bitReverse[res] >> (8 - a);
            }
        } catch (e) {
            console.log("Probably problems on iOS7 with >>");
            throw e;
        }
        return res;
    }

    function flushBuffer() {
        bIdx = 0;
    }

    function addBuffer(a) {
        // SIZE++;
        buf32k[bIdx++] = a;
        outputArr.push(String.fromCharCode(a));

        if (bIdx === 0x8000) {
            bIdx = 0;
        }
    }

    function HufNode() {
        this.b0 = 0;
        this.b1 = 0;
        this.jump = null;
        this.jumppos = -1;
    }

    function isPat() {
        var endless = true;
        while (endless) {
            if (fpos[len] >= fmax) {
                return -1;
            }

            if (flens[fpos[len]] === len) {
                return fpos[len]++;
            }

            fpos[len]++;
        }
    }

    function rec() {
        var curplace = Places[treepos],
            tmp;

        if (len === 17) {
            return -1;
        }
        treepos++;
        len++;

        tmp = isPat();

        if (tmp >= 0) {
            /* leaf cell for 0-bit */
            curplace.b0 = tmp;
        } else {
            /* Not a Leaf cell */
            curplace.b0 = 0x8000;

            if (rec()) {
                return -1;
            }
        }

        tmp = isPat();

        if (tmp >= 0) {
            /* leaf cell for 1-bit */
            curplace.b1 = tmp;
            /* Just for the display routine */
            curplace.jump = null;
        } else {
            /* Not a Leaf cell */
            curplace.b1 = 0x8000;
            curplace.jump = Places[treepos];
            curplace.jumppos = treepos;
            if (rec()) {
                return -1;
            }
        }
        len--;

        return 0;
    }

    function createTree(currentTree, numval, lengths, show) {
        var i;

        Places = currentTree;
        treepos = 0;
        flens = lengths;
        fmax = numval;

        for (i = 0; i < 17; i++) {
            fpos[i] = 0;
        }
        len = 0;

        if (rec()) {
            return -1;
        }

        return 0;
    }

    function decodeValue(currentTree) {
        var len,
            i, b,
            endless = true,
            xtreepos = 0,
            X = currentTree[xtreepos];

        /* decode one symbol of the data */
        while (endless) {
            b = readBit();

            if (b) {
                if (!(X.b1 & 0x8000)) {
                    /* If leaf node, return data */
                    return X.b1;
                }

                X = X.jump;
                len = currentTree.length;

                for (i = 0; i < len; i++) {
                    if (currentTree[i] === X) {
                        xtreepos = i;
                        break;
                    }
                }
            } else {
                if (!(X.b0 & 0x8000)) {
                    /* If leaf node, return data */
                    return X.b0;
                }
                xtreepos++;
                X = currentTree[xtreepos];
            }
        }
    }

    function deflateLoop() {
        var last, c, type, i, j, l, ll, ll2,
            len, blockLen, dist, cSum, n,// z,
            literalCodes, distCodes, lenCodes,
            endless = true;

        do {
            last = readBit();
            type = readBits(2);

            if (type === 0) {
                // Stored
                byteAlign();
                blockLen = readByte();
                blockLen |= readByte() << 8;

                cSum = readByte();
                cSum |= readByte() << 8;

                if ((blockLen ^ ~cSum) & 0xffff) {
                    JXG.debug("BlockLen checksum mismatch\n");
                }

                while (blockLen--) {
                    c = readByte();
                    addBuffer(c);
                }
            } else if (type === 1) {
                /* Fixed Huffman tables -- fixed decode routine */
                while (endless) {
                    /*
                         256    0000000        0
                         :   :     :
                         279    0010111        23
                         0   00110000    48
                         :    :      :
                         143    10111111    191
                         280 11000000    192
                         :    :      :
                         287 11000111    199
                         144    110010000    400
                         :    :       :
                         255    111111111    511

                         Note the bit order!
                         */

                    j = bitReverse[readBits(7)] >> 1;

                    if (j > 23) {
                        j = (j << 1) | readBit(); /* 48..255 */

                        if (j > 199) {
                            /* 200..255 */
                            j -= 128; /*  72..127 */
                            j = (j << 1) | readBit(); /* 144..255 << */
                        } else {
                            /*  48..199 */
                            j -= 48; /*   0..151 */
                            if (j > 143) {
                                j = j + 136; /* 280..287 << */
                                /*   0..143 << */
                            }
                        }
                    } else {
                        /*   0..23 */
                        j += 256; /* 256..279 << */
                    }

                    if (j < 256) {
                        addBuffer(j);
                    } else if (j === 256) {
                        /* EOF */
                        break;
                    } else {
                        j -= 256 + 1; /* bytes + EOF */
                        len = readBits(cplext[j]) + cplens[j];
                        j = bitReverse[readBits(5)] >> 3;

                        if (cpdext[j] > 8) {
                            dist = readBits(8);
                            dist |= readBits(cpdext[j] - 8) << 8;
                        } else {
                            dist = readBits(cpdext[j]);
                        }

                        dist += cpdist[j];

                        for (j = 0; j < len; j++) {
                            c = buf32k[(bIdx - dist) & 0x7fff];
                            addBuffer(c);
                        }
                    }
                } // while
            } else if (type === 2) {
                // "static" just to preserve stack
                ll = new Array(288 + 32);

                // Dynamic Huffman tables
                literalCodes = 257 + readBits(5);
                distCodes = 1 + readBits(5);
                lenCodes = 4 + readBits(4);

                for (j = 0; j < 19; j++) {
                    ll[j] = 0;
                }

                // Get the decode tree code lengths

                for (j = 0; j < lenCodes; j++) {
                    ll[border[j]] = readBits(3);
                }
                len = distanceTree.length;

                for (i = 0; i < len; i++) {
                    distanceTree[i] = new HufNode();
                }

                if (createTree(distanceTree, 19, ll, 0)) {
                    flushBuffer();
                    return 1;
                }

                //read in literal and distance code lengths
                n = literalCodes + distCodes;
                i = 0;
                // z = -1;

                while (i < n) {
                    // z++;
                    j = decodeValue(distanceTree);

                    // length of code in bits (0..15)
                    if (j < 16) {
                        ll[i++] = j;
                        // repeat last length 3 to 6 times
                    } else if (j === 16) {
                        j = 3 + readBits(2);

                        if (i + j > n) {
                            flushBuffer();
                            return 1;
                        }
                        l = i ? ll[i - 1] : 0;

                        while (j--) {
                            ll[i++] = l;
                        }
                    } else {
                        // 3 to 10 zero length codes
                        if (j === 17) {
                            j = 3 + readBits(3);
                            // j == 18: 11 to 138 zero length codes
                        } else {
                            j = 11 + readBits(7);
                        }

                        if (i + j > n) {
                            flushBuffer();
                            return 1;
                        }

                        while (j--) {
                            ll[i++] = 0;
                        }
                    }
                }

                // Can overwrite tree decode tree as it is not used anymore
                len = literalTree.length;
                for (i = 0; i < len; i++) {
                    literalTree[i] = new HufNode();
                }

                if (createTree(literalTree, literalCodes, ll, 0)) {
                    flushBuffer();
                    return 1;
                }

                len = literalTree.length;

                for (i = 0; i < len; i++) {
                    distanceTree[i] = new HufNode();
                }

                ll2 = [];

                for (i = literalCodes; i < ll.length; i++) {
                    ll2[i - literalCodes] = ll[i];
                }

                if (createTree(distanceTree, distCodes, ll2, 0)) {
                    flushBuffer();
                    return 1;
                }

                while (endless) {
                    j = decodeValue(literalTree);

                    // In C64: if carry set
                    if (j >= 256) {
                        j -= 256;
                        if (j === 0) {
                            // EOF
                            break;
                        }

                        j -= 1;
                        len = readBits(cplext[j]) + cplens[j];
                        j = decodeValue(distanceTree);

                        if (cpdext[j] > 8) {
                            dist = readBits(8);
                            dist |= readBits(cpdext[j] - 8) << 8;
                        } else {
                            dist = readBits(cpdext[j]);
                        }

                        dist += cpdist[j];

                        while (len--) {
                            c = buf32k[(bIdx - dist) & 0x7fff];
                            addBuffer(c);
                        }
                    } else {
                        addBuffer(j);
                    }
                }
            }
        } while (!last);

        flushBuffer();
        byteAlign();

        return 0;
    }

    /**
     * nextFile:
     * Extract the next file from the compressed archive.
     * Calls skipdir() to proceed recursively.
     *
     * @return {Boolean}  false if the end of files' data section has baseElement
     * reached. Then, then all recursive functions are stopped immediately.
     *
     */
    function nextFile() {
        /* eslint-disable no-unused-vars */
        var i,
            c,
            extralen,
            filelen,
            size,
            compSize,
            crc,
            method,
            tmp = [];

        // Prevent problems on iOS7 with >>
        try {
            outputArr = [];
            modeZIP = false;
            tmp[0] = readByte();
            tmp[1] = readByte();

            //GZIP
            if (tmp[0] === 0x78 && tmp[1] === 0xda) {
                deflateLoop();
                unzipped[files] = [outputArr.join(""), "geonext.gxt"];
                files++;
            }

            //GZIP
            if (tmp[0] === 0x1f && tmp[1] === 0x8b) {
                skipdir();
                unzipped[files] = [outputArr.join(""), "file"];
                files++;
            }

            //ZIP
            if (tmp[0] === 0x50 && tmp[1] === 0x4b) {
                modeZIP = true;
                tmp[2] = readByte();
                tmp[3] = readByte();

                if (tmp[2] === 0x03 && tmp[3] === 0x04) {
                    //MODE_ZIP
                    tmp[0] = readByte();
                    tmp[1] = readByte();

                    gpflags = readByte();
                    gpflags |= readByte() << 8;

                    method = readByte();
                    method |= readByte() << 8;

                    readByte();
                    readByte();
                    readByte();
                    readByte();

                    crc = readByte();
                    crc |= readByte() << 8;
                    crc |= readByte() << 16;
                    crc |= readByte() << 24;

                    compSize = readByte();
                    compSize |= readByte() << 8;
                    compSize |= readByte() << 16;
                    compSize |= readByte() << 24;

                    size = readByte();
                    size |= readByte() << 8;
                    size |= readByte() << 16;
                    size |= readByte() << 24;

                    filelen = readByte();
                    filelen |= readByte() << 8;

                    extralen = readByte();
                    extralen |= readByte() << 8;

                    i = 0;
                    nameBuf = [];

                    while (filelen--) {
                        c = readByte();
                        if ((c === "/") | (c === ":")) {
                            i = 0;
                        } else if (i < NAMEMAX - 1) {
                            nameBuf[i++] = String.fromCharCode(c);
                        }
                    }

                    if (!fileout) {
                        fileout = nameBuf;
                    }

                    i = 0;
                    while (i < extralen) {
                        c = readByte();
                        i++;
                    }

                    // SIZE = 0;
                    if (method === 8) {
                        deflateLoop();
                        unzipped[files] = new Array(2);
                        unzipped[files][0] = outputArr.join("");
                        unzipped[files][1] = nameBuf.join("");
                        files++;
                    }

                    if (skipdir()) {
                        // We are beyond the files' data in the zip archive.
                        // Let's get out immediately...
                        return false;
                    }
                }
                return true;
            }
        } catch (e) {
            console.log("Probably problems on iOS7 with >>");
            throw e;
        }
        return false;
        /* eslint-enable no-unused-vars */
    }

    /**
     * Test if the end of the files' data part of the archive has baseElement
     * reached. If not, uncompressing is resumed.
     *
     * @return {Boolean}  true if the end of the files' data sections have
     * been reached.
     *
     * @private
     */
    function skipdir() {
        /* eslint-disable no-unused-vars */
        var crc, compSize, size, os, i, c,
            tmp = [];

        if (gpflags & 8) {
            tmp[0] = readByte();
            tmp[1] = readByte();
            tmp[2] = readByte();
            tmp[3] = readByte();

            // signature for data descriptor record: 0x08074b50
            // 12 bytes:
            //  crc 4 bytes
            //  compressed size 4 bytes
            // uncompressed size 4 bytes
            if (tmp[0] === 0x50 && tmp[1] === 0x4b && tmp[2] === 0x07 && tmp[3] === 0x08) {
                crc = readByte();
                crc |= readByte() << 8;
                crc |= readByte() << 16;
                crc |= readByte() << 24;
            } else {
                crc = tmp[0] | (tmp[1] << 8) | (tmp[2] << 16) | (tmp[3] << 24);
            }

            compSize = readByte();
            compSize |= readByte() << 8;
            compSize |= readByte() << 16;
            compSize |= readByte() << 24;

            size = readByte();
            size |= readByte() << 8;
            size |= readByte() << 16;
            size |= readByte() << 24;
        }

        if (modeZIP) {
            if (nextFile()) {
                // A file has been decompressed, we have to proceed
                return false;
            }
        }

        tmp[0] = readByte();
        if (tmp[0] !== 8) {
            // It seems, we are beyond the files' data in the zip archive.
            // We'll skip the rest..
            return true;
        }

        // There is another file in the zip file. We proceed...
        gpflags = readByte();

        readByte();
        readByte();
        readByte();
        readByte();

        readByte();
        os = readByte();

        if (gpflags & 4) {
            tmp[0] = readByte();
            tmp[2] = readByte();
            len = tmp[0] + 256 * tmp[1];
            for (i = 0; i < len; i++) {
                readByte();
            }
        }

        if (gpflags & 8) {
            i = 0;
            nameBuf = [];

            c = readByte();
            while (c) {
                if (c === "7" || c === ":") {
                    i = 0;
                }

                if (i < NAMEMAX - 1) {
                    nameBuf[i++] = c;
                }

                c = readByte();
            }
        }

        if (gpflags & 16) {
            c = readByte();
            while (c) {
                c = readByte();
            }
        }

        if (gpflags & 2) {
            readByte();
            readByte();
        }

        deflateLoop();

        crc = readByte();
        crc |= readByte() << 8;
        crc |= readByte() << 16;
        crc |= readByte() << 24;

        size = readByte();
        size |= readByte() << 8;
        size |= readByte() << 16;
        size |= readByte() << 24;

        if (modeZIP) {
            if (nextFile()) {
                // A file has been decompressed, we have to proceed
                return false;
            }
        }

        // We are here in non-ZIP-files only,
        // In that case the eturn value doesn't matter
        return false;
        /* eslint-enable no-unused-vars */

    }

    JXG.Util.Unzip.prototype.unzipFile = function (name) {
        var i;

        this.unzip();

        for (i = 0; i < unzipped.length; i++) {
            if (unzipped[i][1] === name) {
                return unzipped[i][0];
            }
        }

        return "";
    };

    JXG.Util.Unzip.prototype.unzip = function () {
        nextFile();
        return unzipped;
    };
};

export default JXG.Util;
