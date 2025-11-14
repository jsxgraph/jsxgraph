/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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

/*jslint nomen: true, plusplus: true*/

/**
 * Functions for color conversions. This was originally based on a class to parse color values by
 * Stoyan Stefanov <sstoo@gmail.com> (see https://www.phpied.com/rgb-color-parser-in-javascript/)
 */

import JXG from "../jxg.js";
import Type from "./type.js";
import Mat from "../math/math.js";

// private constants and helper functions

// simple colors contains string color constants that can be used in various browser
// in javascript
var simpleColors = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "00ffff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000000",
        blanchedalmond: "ffebcd",
        blue: "0000ff",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "00ffff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dodgerblue: "1e90ff",
        feldspar: "d19275",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "ff00ff",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgrey: "d3d3d3",
        lightgreen: "90ee90",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslateblue: "8470ff",
        lightslategray: "778899",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "00ff00",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "ff00ff",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370d8",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "d87093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        red: "ff0000",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        venetianred: "ae181e",
        violet: "ee82ee",
        violetred: "d02090",
        wheat: "f5deb3",
        white: "ffffff",
        whitesmoke: "f5f5f5",
        yellow: "ffff00",
        yellowgreen: "9acd32"
    },
    // array of color definition objects
    colorDefs = [
        {
            re: /^\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]{1,3})\s*\)\s*$/,
            example: ["rgba(123, 234, 45, 0.5)", "rgba(255,234,245,1.0)"],
            process: function (bits) {
                return [parseInt(bits[1], 10), parseInt(bits[2], 10), parseInt(bits[3], 10)];
            }
        },
        {
            re: /^\s*rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*$/,
            example: ["rgb(123, 234, 45)", "rgb(255,234,245)"],
            process: function (bits) {
                return [parseInt(bits[1], 10), parseInt(bits[2], 10), parseInt(bits[3], 10)];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ["#00ff00", "336699"],
            process: function (bits) {
                return [parseInt(bits[1], 16), parseInt(bits[2], 16), parseInt(bits[3], 16)];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ["#fb0", "f0f"],
            process: function (bits) {
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

/**
 * Converts a valid HTML/CSS color string into a rgb value array. This is the base
 * function for the following wrapper functions which only adjust the output to
 * different flavors like an object, string or hex values.
 * @param {String|Array|Number} color A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values. In case this is a number this method
 * expects the parameters ag and ab.
 * @param {Number} ag
 * @param {Number} ab
 * @returns {Array} RGB color values as an array [r, g, b] with values ranging from 0 to 255.
 */
JXG.rgbParser = function (color, ag, ab) {
    var color_string,
        channels,
        re,
        processor,
        bits,
        i,
        r,
        g,
        b,
        values = color,
        testFloat;

    if (!Type.exists(color)) {
        return [];
    }

    if (Type.exists(ag) && Type.exists(ab)) {
        values = [color, ag, ab];
    }

    color_string = values;

    testFloat = false;
    if (Type.isArray(color_string)) {
        for (i = 0; i < 3; i++) {
            testFloat = testFloat || /\./.test(values[i].toString());
        }

        for (i = 0; i < 3; i++) {
            testFloat = testFloat && values[i] >= 0.0 && values[i] <= 1.0;
        }

        if (testFloat) {
            return [
                Math.ceil(values[0] * 255),
                Math.ceil(values[1] * 255),
                Math.ceil(values[2] * 255)
            ];
        }

        return values;
    }

    if (typeof values === 'string') {
        color_string = values;
    }

    // strip any leading #
    if (color_string.charAt(0) === "#") {
        // remove # if any
        color_string = color_string.slice(1, 7);
    }

    color_string = color_string.replace(/ /g, "").toLowerCase();

    // before getting into regexps, try simple matches
    // and overwrite the input
    color_string = simpleColors[color_string] || color_string;

    // search through the colorDefs definitions to find a match
    for (i = 0; i < colorDefs.length; i++) {
        re = colorDefs[i].re;
        processor = colorDefs[i].process;
        bits = re.exec(color_string);

        if (bits) {
            channels = processor(bits);
            r = channels[0];
            g = channels[1];
            b = channels[2];
        }
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return [];
    }

    // validate/cleanup values
    r = r < 0 || isNaN(r) ? 0 : r > 255 ? 255 : r;
    g = g < 0 || isNaN(g) ? 0 : g > 255 ? 255 : g;
    b = b < 0 || isNaN(b) ? 0 : b > 255 ? 255 : b;

    return [r, g, b];
};

JXG.isColor = function (strColor) {
    var s = new Option().style;
    s.color = strColor;
    return s.color !== '';
};

/**
 * Converts a valid HTML/CSS color string into a string of the 'rgb(r, g, b)' format.
 * @param {String|Array|Number} color A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values. In case this is a number this method
 * expects the parameters ag and ab.
 * @param {Number} ag
 * @param {Number} ab
 * @returns {String} A 'rgb(r, g, b)' formatted string
 */
JXG.rgb2css = function (color, ag, ab) {
    var r;

    r = JXG.rgbParser(color, ag, ab);

    return "rgb(" + r[0] + ", " + r[1] + ", " + r[2] + ")";
};

/**
 * Converts a valid HTML/CSS color string into a HTML rgb string.
 * @param {String|Array|Number} color A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values. In case this is a number this method
 * expects the parameters ag and ab.
 * @param {Number} ag
 * @param {Number} ab
 * @returns {String} A '#rrggbb' formatted string
 */
JXG.rgb2hex = function (color, ag, ab) {
    var r, g, b;

    r = JXG.rgbParser(color, ag, ab);
    g = r[1];
    b = r[2];
    r = r[0];
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length === 1) {
        r = "0" + r;
    }

    if (g.length === 1) {
        g = "0" + g;
    }

    if (b.length === 1) {
        b = "0" + b;
    }

    return "#" + r + g + b;
};

/**
 * Converts a valid HTML/CSS color string from the '#rrggbb' format into the 'rgb(r, g, b)' format.
 * @param {String} hex A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', or 'black'
 * @deprecated Use {@link JXG#rgb2css} instead.
 * @returns {String} A 'rgb(r, g, b)' formatted string
 */
JXG.hex2rgb = function (hex) {
    JXG.deprecated("JXG.hex2rgb()", "JXG.rgb2css()");
    return JXG.rgb2css(hex);
};

/**
 * Converts HSV color to RGB color.
 * Based on C Code in "Computer Graphics -- Principles and Practice,"
 * Foley et al, 1996, p. 593.
 * See also https://www.had2know.org/technology/hsv-rgb-conversion-formula-calculator.html
 * @param {Number} H value between 0 and 360
 * @param {Number} S value between 0.0 (shade of gray) to 1.0 (pure color)
 * @param {Number} V value between 0.0 (black) to 1.0 (white)
 * @returns {String} RGB color string
 */
JXG.hsv2rgb = function (H, S, V) {
    var R, G, B, f, i, hTemp, p, q, t;

    H = ((H % 360.0) + 360.0) % 360;

    if (S === 0) {
        if (isNaN(H) || H < Mat.eps) {
            R = V;
            G = V;
            B = V;
        } else {
            return "#ffffff";
        }
    } else {
        if (H >= 360) {
            hTemp = 0.0;
        } else {
            hTemp = H;
        }

        // h is now IN [0,6)
        hTemp = hTemp / 60;
        // largest integer <= h
        i = Math.floor(hTemp);
        // fractional part of h
        f = hTemp - i;
        p = V * (1.0 - S);
        q = V * (1.0 - S * f);
        t = V * (1.0 - S * (1.0 - f));

        switch (i) {
            case 0:
                R = V;
                G = t;
                B = p;
                break;
            case 1:
                R = q;
                G = V;
                B = p;
                break;
            case 2:
                R = p;
                G = V;
                B = t;
                break;
            case 3:
                R = p;
                G = q;
                B = V;
                break;
            case 4:
                R = t;
                G = p;
                B = V;
                break;
            case 5:
                R = V;
                G = p;
                B = q;
                break;
        }
    }

    R = Math.round(R * 255).toString(16);
    R = R.length === 2 ? R : R.length === 1 ? "0" + R : '00';
    G = Math.round(G * 255).toString(16);
    G = G.length === 2 ? G : G.length === 1 ? "0" + G : '00';
    B = Math.round(B * 255).toString(16);
    B = B.length === 2 ? B : B.length === 1 ? "0" + B : '00';

    return ["#", R, G, B].join("");
};

/**
 * Converts a color from the RGB color space into the HSV space. Input can be any valid HTML/CSS color definition.
 * @param {String|Array|Number} color A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values. In case this is a number this method
 * expects the parameters ag and ab. See <a href="https://www.had2know.org/technology/hsv-rgb-conversion-formula-calculator.html">https://www.had2know.org/technology/hsv-rgb-conversion-formula-calculator.html</a>.
 * @param {Number} ag
 * @param {Number} ab
 * @returns {Array} Contains the h, s, and v value in this order.
 *
 */
JXG.rgb2hsv = function (color, ag, ab) {
    var r, g, b, fr, fg, fb, fmax, fmin, h, s, v, max, min;

    r = JXG.rgbParser(color, ag, ab);

    g = r[1];
    b = r[2];
    r = r[0];
    fr = r / 255.0;
    fg = g / 255.0;
    fb = b / 255.0;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    fmax = max / 255.0;
    fmin = min / 255.0;

    v = fmax;
    s = 0.0;

    if (v > 0) {
        s = (v - fmin) / v;
    }

    h = 1.0 / (fmax - fmin);

    if (s > 0) {
        if (max === r) {
            h = (fg - fb) * h;
        } else if (max === g) {
            h = 2 + (fb - fr) * h;
        } else {
            h = 4 + (fr - fg) * h;
        }
    }

    h *= 60;

    if (h < 0) {
        h += 360;
    }

    if (max === min) {
        h = 0.0;
    }

    return [h, s, v];
};

/**
 * Converts a color from the RGB color space into the LMS space. Input can be any valid HTML/CSS color definition.
 * @param {String|Array|Number} color A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values. In case this is a number this method
 * expects the parameters ag and ab.
 * @param {Number} ag
 * @param {Number} ab
 * @returns {Array} Contains the l, m, and s value in this order.
 */
JXG.rgb2LMS = function (color, ag, ab) {
    var r,
        g,
        b,
        l,
        m,
        s,
        ret,
        // constants
        matrix = [
            [0.05059983, 0.08585369, 0.0095242],
            [0.01893033, 0.08925308, 0.01370054],
            [0.00292202, 0.00975732, 0.07145979]
        ];

    r = JXG.rgbParser(color, ag, ab);
    g = r[1];
    b = r[2];
    r = r[0];

    // de-gamma
    // Maybe this can be made faster by using a cache
    r = Math.pow(r, 0.476190476);
    g = Math.pow(g, 0.476190476);
    b = Math.pow(b, 0.476190476);

    l = r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2];
    m = r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2];
    s = r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2];

    ret = [l, m, s];
    ret.l = l;
    ret.m = m;
    ret.s = s;

    return ret;
};

/**
 * Convert color information from LMS to RGB color space.
 * @param {Number} l
 * @param {Number} m
 * @param {Number} s
 * @returns {Array} Contains the r, g, and b value in this order.
 */
JXG.LMS2rgb = function (l, m, s) {
    var r,
        g,
        b,
        ret,
        // constants
        matrix = [
            [30.830854, -29.832659, 1.610474],
            [-6.481468, 17.715578, -2.532642],
            [-0.37569, -1.199062, 14.273846]
        ],
        // re-gamma, inspired by GIMP modules/display-filter-color-blind.c:
        // Copyright (C) 2002-2003 Michael Natterer <mitch@gimp.org>,
        //                         Sven Neumann <sven@gimp.org>,
        //                         Robert Dougherty <bob@vischeck.com> and
        //                         Alex Wade <alex@vischeck.com>
        // This code is an implementation of an algorithm described by Hans Brettel,
        // Francoise Vienot and John Mollon in the Journal of the Optical Society of
        // America V14(10), pg 2647. (See http://vischeck.com/ for more info.)
        lut_lookup = function (value) {
            var offset = 127,
                step = 64;

            while (step > 0) {
                if (Math.pow(offset, 0.476190476) > value) {
                    offset -= step;
                } else {
                    if (Math.pow(offset + 1, 0.476190476) > value) {
                        return offset;
                    }

                    offset += step;
                }

                step /= 2;
            }

            /*  the algorithm above can't reach 255  */
            if (offset === 254 && 13.994955247 < value) {
                return 255;
            }

            return offset;
        };

    // transform back to rgb
    r = l * matrix[0][0] + m * matrix[0][1] + s * matrix[0][2];
    g = l * matrix[1][0] + m * matrix[1][1] + s * matrix[1][2];
    b = l * matrix[2][0] + m * matrix[2][1] + s * matrix[2][2];

    r = lut_lookup(r);
    g = lut_lookup(g);
    b = lut_lookup(b);

    ret = [r, g, b];
    ret.r = r;
    ret.g = g;
    ret.b = b;

    return ret;
};

/**
 * Splits a RGBA color value like #112233AA into it's RGB and opacity parts.
 * @param {String} rgba A RGBA color value
 * @returns {Array} An array containing the rgb color value in the first and the opacity in the second field.
 */
JXG.rgba2rgbo = function (rgba) {
    var opacity;

    if (rgba.length === 9 && rgba.charAt(0) === "#") {
        opacity = parseInt(rgba.slice(7, 9).toUpperCase(), 16) / 255;
        rgba = rgba.slice(0, 7);
    } else {
        opacity = 1;
    }

    return [rgba, opacity];
};

/**
 * Generates a RGBA color value like #112233AA from it's RGB and opacity parts.
 * @param {String|Array} rgb A valid HTML or CSS styled color value, e.g. '#12ab21', '#abc', 'black'
 * or 'rgb(12, 132, 233)'. This can also be an array containing three color values either from 0.0 to 1.0 or
 * from 0 to 255. They will be interpreted as red, green, and blue values.
 * @param {Number} o The desired opacity >=0, <=1.
 * @returns {String} The RGBA color value.
 */
JXG.rgbo2rgba = function (rgb, o) {
    var rgba;

    if (rgb === "none" || rgb === 'transparent') {
        return rgb;
    }

    rgba = Math.round(o * 255).toString(16);
    if (rgba.length === 1) {
        rgba = "0" + rgba;
    }

    return JXG.rgb2hex(rgb) + rgba;
};

/**
 * Decolorizes the given color.
 * @param {String} color HTML string containing the HTML color code.
 * @returns {String} Returns a HTML color string
 */
JXG.rgb2bw = function (color) {
    var x,
        tmp,
        arr,
        HexChars = '0123456789ABCDEF';

    if (color === 'none') {
        return color;
    }

    arr = JXG.rgbParser(color);
    x = Math.floor(0.3 * arr[0] + 0.59 * arr[1] + 0.11 * arr[2]);

    // rgbParser and Math.floor ensure that x is 0 <= x <= 255.
    // Bitwise operators can be used.
    /*jslint bitwise: true*/
    tmp = HexChars.charAt((x >> 4) & 0xf) + HexChars.charAt(x & 0xf);

    color = "#" + tmp + tmp + tmp;

    return color;
};

/**
 * Converts a color into how a colorblind human approximately would see it.
 * @param {String} color HTML string containing the HTML color code.
 * @param {String} deficiency The type of color blindness. Possible
 * options are <i>protanopia</i>, <i>deuteranopia</i>, and <i>tritanopia</i>.
 * @returns {String} Returns a HTML color string
 */
JXG.rgb2cb = function (color, deficiency) {
    var rgb,
        l,
        m,
        s,
        lms,
        tmp,
        a1,
        b1,
        c1,
        a2,
        b2,
        c2,
        inflection,
        HexChars = '0123456789ABCDEF';

    if (color === 'none') {
        return color;
    }

    lms = JXG.rgb2LMS(color);
    l = lms[0];
    m = lms[1];
    s = lms[2];

    deficiency = deficiency.toLowerCase();

    switch (deficiency) {
        case "protanopia":
            a1 = -0.06150039994295001;
            b1 = 0.08277001656812001;
            c1 = -0.013200141220000003;
            a2 = 0.05858939668799999;
            b2 = -0.07934519995360001;
            c2 = 0.013289415272000003;
            inflection = 0.6903216543277437;

            tmp = s / m;

            if (tmp < inflection) {
                l = -(b1 * m + c1 * s) / a1;
            } else {
                l = -(b2 * m + c2 * s) / a2;
            }
            break;
        case "tritanopia":
            a1 = -0.00058973116217;
            b1 = 0.007690316482;
            c1 = -0.01011703519052;
            a2 = 0.025495080838999994;
            b2 = -0.0422740347;
            c2 = 0.017005316784;
            inflection = 0.8349489908460004;

            tmp = m / l;

            if (tmp < inflection) {
                s = -(a1 * l + b1 * m) / c1;
            } else {
                s = -(a2 * l + b2 * m) / c2;
            }
            break;
        default:
            a1 = -0.06150039994295001;
            b1 = 0.08277001656812001;
            c1 = -0.013200141220000003;
            a2 = 0.05858939668799999;
            b2 = -0.07934519995360001;
            c2 = 0.013289415272000003;
            inflection = 0.5763833686400911;

            tmp = s / l;

            if (tmp < inflection) {
                m = -(a1 * l + c1 * s) / b1;
            } else {
                m = -(a2 * l + c2 * s) / b2;
            }
            break;
    }

    rgb = JXG.LMS2rgb(l, m, s);

    // LMS2rgb returns an array of values ranging from 0 to 255 (both included)
    // bitwise operators are safe to use.
    /*jslint bitwise: true*/
    tmp = HexChars.charAt((rgb[0] >> 4) & 0xf) + HexChars.charAt(rgb[0] & 0xf);
    color = "#" + tmp;
    tmp = HexChars.charAt((rgb[1] >> 4) & 0xf) + HexChars.charAt(rgb[1] & 0xf);
    color += tmp;
    tmp = HexChars.charAt((rgb[2] >> 4) & 0xf) + HexChars.charAt(rgb[2] & 0xf);
    color += tmp;

    return color;
};

/**
 * Lightens (percent > 0) or darkens (percent < 0) the color by the specified factor.
 * @param {String} color
 * @param {Number} percent
 * @returns {String}
 */
JXG.shadeColor = function (color, percent) {
    var arr = JXG.rgbParser(color),
        r = arr[0],
        g = arr[1],
        b = arr[2];

    r = parseInt(r + 255 * percent);
    g = parseInt(g + 255 * percent);
    b = parseInt(b + 255 * percent);

    r = (r > 0) ? r : 0;
    g = (g > 0) ? g : 0;
    b = (b > 0) ? b : 0;

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);

    return JXG.rgb2hex([r, g, b]);
};

/**
 * Lightens the color by the specified factor.
 * @param {String} color
 * @param {Number} percent
 * @returns {String}
 *
 * @see JXG.shadeColor
 */
JXG.lightenColor = function (color, percent) {
    return JXG.shadeColor(color, percent);
};

/**
 * Darkens the color by the specified factor.
 * @param {String} color
 * @param {Number} percent
 * @returns {String}
 *
 * @see JXG.shadeColor
 */
JXG.darkenColor = function (color, percent) {
    return JXG.shadeColor(color, -1 * percent);
};

/**
 * Determines highlight color to a given color. Done by reducing (or increasing) the opacity.
 * @param {String} color HTML RGBA string containing the HTML color code.
 * @returns {String} Returns a HTML RGBA color string
 */
JXG.autoHighlight = function (colstr) {
    var col = JXG.rgba2rgbo(colstr),
        c = col[0],
        opa = col[1];

    if (colstr.charAt(0) === "#") {
        if (opa < 0.3) {
            opa *= 1.8;
        } else {
            opa *= 0.4;
        }

        return JXG.rgbo2rgba(c, opa);
    }

    return colstr;
};

/**
 * Calculate whether a light or a dark color is needed as a contrast.
 * Especially useful to determine whether white or black font goes
 * better with a given background color.
 * @param {String} hexColor HEX value of color.
 * @param {String} [darkColor="#000000"] HEX string for a dark color.
 * @param {String} [lightColor="#ffffff"] HEX string for a light color.
 * @param {Number} [threshold=8]
 * @returns {String} Returns darkColor or lightColor.
 */
JXG.contrast = function (hexColor, darkColor, lightColor, threshold) {
    var rgb,
        black = "#000000",
        rgbBlack,
        l1,
        l2,
        contrastRatio;

    darkColor = darkColor || "#000000";
    lightColor = lightColor || "#ffffff";
    threshold = threshold || 7;

    // hexColor RGB
    rgb = JXG.rgbParser(hexColor);

    // Black RGB
    rgbBlack = JXG.rgbParser(black);

    // Calc contrast ratio
    l1 =
        0.2126 * Math.pow(rgb[0] / 255, 2.2) +
        0.7152 * Math.pow(rgb[1] / 255, 2.2) +
        0.0722 * Math.pow(rgb[2] / 255, 2.2);

    l2 =
        0.2126 * Math.pow(rgbBlack[0] / 255, 2.2) +
        0.7152 * Math.pow(rgbBlack[1] / 255, 2.2) +
        0.0722 * Math.pow(rgbBlack[2] / 255, 2.2);

    if (l1 > l2) {
        contrastRatio = Math.floor((l1 + 0.05) / (l2 + 0.05));
    } else {
        contrastRatio = Math.floor((l2 + 0.05) / (l1 + 0.05));
    }
    contrastRatio = contrastRatio - 1;

    // If contrast is more than threshold, return darkColor
    if (contrastRatio > threshold) {
        return darkColor;
    }
    // if not, return lightColor.
    return lightColor;
};

/**
 * Use the color scheme of JSXGraph up to version 1.3.2.
 * This method has to be called before JXG.JSXGraph.initBoard();
 *
 * @see JXG.palette
 * @see JXG.paletteWong
 *
 * @example
 *
 * JXG.setClassicColors();
 * var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-5, 5, 5,-5]});
 *
 */
JXG.setClassicColors = function () {
    JXG.Options.elements.strokeColor = 'blue';
    JXG.Options.elements.fillColor = 'red';
    JXG.Options.hatch.strokeColor = 'blue';
    JXG.Options.angle.fillColor = "#ff7f00";
    JXG.Options.angle.highlightFillColor = "#ff7f00";
    JXG.Options.angle.strokeColor = "#ff7f00";
    JXG.Options.angle.label.strokeColor = 'blue';
    JXG.Options.arc.strokeColor = 'blue';
    JXG.Options.circle.center.fillColor = 'red';
    JXG.Options.circle.center.strokeColor = 'blue';
    JXG.Options.circumcircle.strokeColor = 'blue';
    JXG.Options.circumcircle.center.fillColor = 'red';
    JXG.Options.circumcircle.center.strokeColor = 'blue';
    JXG.Options.circumcirclearc.strokeColor = 'blue';
    JXG.Options.circumcirclesector.strokeColor = 'blue';
    JXG.Options.circumcirclesector.fillColor = 'green';
    JXG.Options.circumcirclesector.highlightFillColor = 'green';
    JXG.Options.conic.strokeColor = 'blue';
    JXG.Options.curve.strokeColor = 'blue';
    JXG.Options.incircle.strokeColor = 'blue';
    JXG.Options.incircle.center.fillColor = 'red';
    JXG.Options.incircle.center.strokeColor = 'blue';
    JXG.Options.inequality.fillColor = 'red';
    JXG.Options.integral.fillColor = 'red';
    JXG.Options.integral.curveLeft.color = 'red';
    JXG.Options.integral.curveRight.color = 'red';
    JXG.Options.line.strokeColor = 'blue';
    JXG.Options.point.fillColor = 'red';
    JXG.Options.point.strokeColor = 'red';
    JXG.Options.polygon.fillColor = 'green';
    JXG.Options.polygon.highlightFillColor = 'green';
    JXG.Options.polygon.vertices.strokeColor = 'red';
    JXG.Options.polygon.vertices.fillColor = 'red';
    JXG.Options.regularpolygon.fillColor = 'green';
    JXG.Options.regularpolygon.highlightFillColor = 'green';
    JXG.Options.regularpolygon.vertices.strokeColor = 'red';
    JXG.Options.regularpolygon.vertices.fillColor = 'red';
    JXG.Options.riemannsum.fillColor = 'yellow';
    JXG.Options.sector.fillColor = 'green';
    JXG.Options.sector.highlightFillColor = 'green';
    JXG.Options.semicircle.center.fillColor = 'red';
    JXG.Options.semicircle.center.strokeColor = 'blue';
    JXG.Options.slopetriangle.fillColor = 'red';
    JXG.Options.slopetriangle.highlightFillColor = 'red';
    JXG.Options.turtle.arrow.strokeColor = 'blue';
};

JXG.extend(
    JXG,
    /** @lends JXG */ {
        /**
         * Bang Wong color palette,
         * optimized for various type
         * of color blindness.
         * It contains values for
         * <ul>
         * <li> 'black'
         * <li> 'orange'
         * <li> 'skyblue'
         * <li> 'bluishgreen'
         * <li> 'yellow'
         * <li> 'darkblue'
         * <li> 'vermillion'
         * <li> 'reddishpurple'
         * </ul>
         *
         * As substitutes for standard colors, it contains the following aliases:
         *
         * <ul>
         * <li> black (= #000000)
         * <li> blue (= darkblue)
         * <li> green (= bluishgreen)
         * <li> purple (= reddishpurple)
         * <li> red (= vermillion)
         * <li> white (= #ffffff)
         * </ul>
         *
         * See <a href="https://www.nature.com/articles/nmeth.1618">Bang Wong: "Points of view: Color blindness"</a>
         * and
         * <a href="https://davidmathlogic.com/colorblind/">https://davidmathlogic.com/colorblind/</a>.
         *
         * @name JXG.paletteWong
         * @type Object
         * @see JXG.palette
         * @example
         * var p = board.create('line', [[-1, 1], [2, -3]], {strokeColor: JXG.paletteWong.yellow});
         */
        paletteWong: {
            black: "#000000",
            orange: "#E69F00",
            skyblue: "#56B4E9",
            bluishgreen: "#009E73",
            yellow: "#F0E442",
            darkblue: "#0072B2",
            vermillion: "#D55E00",
            reddishpurple: "#CC79A7",

            blue: "#0072B2",
            red: "#D55E00", // vermillion
            green: "#009E73", // bluishgreen
            purple: "#CC79A7", // reddishpurple
            white: "#ffffff"
        }
    }
);

/**
 * Default color palette.
 * Contains at least color values for
 * <ul>
 * <li> black
 * <li> blue
 * <li> green
 * <li> purple
 * <li> red
 * <li> white
 * <li> yellow
 * </ul>
 *
 * @name JXG.palette
 * @type Object
 * @default JXG.paletteWong
 * @see JXG.paletteWong
 *
 * @example
 *
 * var p = board.create('line', [[-1, 1], [2, -3]], {strokeColor: JXG.palette.yellow});
 *
 */
JXG.palette = JXG.paletteWong;

export default JXG;
