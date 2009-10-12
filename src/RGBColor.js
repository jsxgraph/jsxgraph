/**
 * Functions for color conversions. Based on a class to parse color values by Stoyan Stefanov <sstoo@gmail.com>
 * @see http://www.phpied.com/rgb-color-parser-in-javascript/
 */

/**
 * Converts a valid HTML/CSS color string into a rgb value array. This is the base
 * function for the following wrapper functions which only adjust the output to
 * different flavors like an object, string or hex values.
 * @parameter {string} color_string A valid HTML or CSS styled color value, e.g. #12ab21, #abc, black, or rgb(12, 132, 233) <strong>or</string>
 * @parameter {array} color_array Array containing three color values either from 0.0 to 1.0 or from 0 to 255. They will be interpreted as red, green, and blue values <strong>OR</strong>
 * @parameter {number} r,g,b Three color values r, g, and b like those in the array variant.
 * @type array
 * @return RGB color values as an array [r, g, b] which component's are between 0 and 255.
 */
JXG.rgbParser = function() {

    if(arguments.length == 0)
        return;

    if(arguments.length >= 3) {
        arguments[0] = [arguments[0], arguments[1], arguments[2]];
        arguments.length = 1;
    }

    var color_string = arguments[0];
    if(JXG.isArray(color_string)) {
        var testFloat = false, i;
        for(i=0; i<3; i++)
            testFloat |= /\./.test(arguments[0][i].toString());
        for(i=0; i<3; i++)
            testFloat &= (arguments[0][i] >= 0.0) & (arguments[0][i] <= 1.0);

        if(testFloat)
            return [Math.ceil(arguments[0][0] * 255), Math.ceil(arguments[0][1] * 255), Math.ceil(arguments[0][2] * 255)];
        else {
            arguments[0].length = 3;
            return arguments[0];
        }
    } else if(typeof arguments[0] == 'string') {
        color_string = arguments[0];
    }

    var r, g, b;

    // strip any leading #
    if (color_string.charAt(0) == '#') { // remove # if any
        color_string = color_string.substr(1,6);
    }

    color_string = color_string.replace(/ /g,'');
    color_string = color_string.toLowerCase();

    // before getting into regexps, try simple matches
    // and overwrite the input
    var simple_colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred : 'cd5c5c',
        indigo : '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
    };
    for (var key in simple_colors) {
        if (color_string == key) {
            color_string = simple_colors[key];
        }
    }
    // end of simple type-in colors

    // array of color definition objects
    var color_defs = [
        {
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
            process: function (bits){
                return [
                    parseInt(bits[1]),
                    parseInt(bits[2]),
                    parseInt(bits[3])
                ];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ['#00ff00', '336699'],
            process: function (bits){
                return [
                    parseInt(bits[1], 16),
                    parseInt(bits[2], 16),
                    parseInt(bits[3], 16)
                ];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ['#fb0', 'f0f'],
            process: function (bits){
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

    // search through the definitions to find a match
    for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);
        if (bits) {
            channels = processor(bits);
            r = channels[0];
            g = channels[1];
            b = channels[2];
        }

    }

    // validate/cleanup values
    r = (r < 0 || isNaN(r)) ? 0 : ((r > 255) ? 255 : r);
    g = (g < 0 || isNaN(g)) ? 0 : ((g > 255) ? 255 : g);
    b = (b < 0 || isNaN(b)) ? 0 : ((b > 255) ? 255 : b);

    return [r, g, b];
};

/**
 * Returns output of JXG.rgbParser as a CSS styled rgb() string.
 */
JXG.rgb2css = function () {
    var r, g, b;
    r = JXG.rgbParser.apply(JXG.rgbParser, arguments);
    g = r[1];
    b = r[2];
    r = r[0];
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};

/**
 * Returns array returned by JXG.rgbParser as a HTML rgb string.
 */
JXG.rgb2hex = function () {
    var r, g, b;
    r = JXG.rgbParser.apply(JXG.rgbParser, arguments);
    g = r[1];
    b = r[2];
    r = r[0];
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    if (r.length == 1) r = '0' + r;
    if (g.length == 1) g = '0' + g;
    if (b.length == 1) b = '0' + b;
    return '#' + r + g + b;
};

/**
* Converts HSV color to RGB color.
* Based on C Code in "Computer Graphics -- Principles and Practice,"
* Foley et al, 1996, p. 593.
* See also http://www.efg2.com/Lab/Graphics/Colors/HSV.htm  
* @param {float} H value between 0 and 360
* @param {float} S value between 0.0 (shade of gray) to 1.0 (pure color)
* @param {float} V value between 0.0 (black) to 1.0 (white)
* @return {string} RGB color string
*/
JXG.hsv2rgb = function(H,S,V) {
    var R,G,B, f,i,hTemp, p,q,t;
    H = ((H%360.0)+360.0)%360;
    if (S==0) {
        if (isNaN(H) || H < JXG.Math.eps) {
            R = V;
            G = V;
            B = V;
        } else {
            return '#ffffff';
        }
    } else {
        if (H>=360) {
            hTemp = 0.0;
        } else {
            hTemp = H;
        }
        hTemp = hTemp / 60;     // h is now IN [0,6)
        i = Math.floor(hTemp);        // largest integer <= h
        f = hTemp - i;                  // fractional part of h
        p = V * (1.0 - S);
        q = V * (1.0 - (S * f));
        t = V * (1.0 - (S * (1.0 - f)));
        switch (i) {
            case 0: R = V; G = t;  B = p; break;
            case 1: R = q; G = V;  B = p; break;
            case 2: R = p; G = V;  B = t; break;
            case 3: R = p; G = q;  B = V; break;
            case 4: R = t; G = p;  B = V; break;
            case 5: R = V; G = p;  B = q; break;
        }
    }
    R = Math.round(R*255).toString(16); R = (R.length==2)?R:((R.length==1)?'0'+R:'00');
    G = Math.round(G*255).toString(16); G = (G.length==2)?G:((G.length==1)?'0'+G:'00');
    B = Math.round(B*255).toString(16); B = (B.length==2)?B:((B.length==1)?'0'+B:'00');
    return ['#',R,G,B].join(''); 
};

/**
 * Converts r, g, b color to h, s, v.
 * See http://zach.in.tu-clausthal.de/teaching/cg1_0708/folien/13_color_3_4up.pdf for more information.
 * @param {number} r Amount of red in color. Number between 0 and 255.
 * @param {number} g Amount of green. Number between 0 and 255.
 * @param {number} b Amount of blue. Number between 0 and 255.
 * @type Object
 * @return Hashmap containing h,s, and v field.
 */
JXG.rgb2hsv = function() {
    var r, g, b;
    r = JXG.rgbParser.apply(JXG.rgbParser, arguments);
    g = r[1];
    b = r[2];
    r = r[0];
    var h, s, v, max, min, stx=new JXG.MathStatistics();
    fr = r/255.;
    fg = g/255.;
    fb = b/255.;
    max = stx.max([r, g, b]);
    min = stx.min([r, g, b]);
    fmax = max/255.;
    fmin = min/255.;

    v = fmax;

    s = 0.;
    if(v>0) {
        s = (v-fmin)/(v*1.);
    }

    h = 1./(fmax-fmin);
    if(s > 0) {
        if(max==r)
            h = (fg-fb)*h;
        else if(max==g)
            h = 2 + (fb-fr)*h;
        else
            h = 4 + (fr-fg)*h;
    }

    h *= 60;
    if(h < 0)
        h += 360;

    if(max==min)
        h = 0.;

    return [h, s, v];
};
