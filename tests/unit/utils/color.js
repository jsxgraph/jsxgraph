define([
    'intern!object',
    'intern/chai!assert',
    'utils/color'
], function (registerSuite, assert, Color) {

    // rgb2LMS has this weird return value where
    // the array contents are also available as properties
    // This function helps to deal with this
    function storeArrayContentAsProperties(array, names) {
        var i;

        for (i = 0; i < array.length; ++i) {
            array[names[i]] = array[i];
        }

        return array;
    }

    registerSuite({
        rgbParser_undefined_emptyArray: function () {
            var actual = Color.rgbParser(),
                expected = [];

            assert.isArray(actual);
            assert.deepEqual(actual, expected);
        },

        rgbParser_threeFloatNumbersBetween0And1_threeNumbersBetween0And255: function () {
            var actual = Color.rgbParser(0.5, 0.8, 1.0),
                expected = [128, 204, 255];

            assert.deepEqual(actual, expected);
        },

        rgbParser_threeFloatsOutsideRange_inputAsArray: function() {
            var input = [0.5, 0.8, 2.0],
                actual = Color.rgbParser.apply(Color, input);

            assert.deepEqual(actual, input);
        },

        rgbParser_threeIntNumbers_inputAsArray: function () {
            var input = [24, 153, 243],
                actual = Color.rgbParser.apply(Color, input);

            assert.deepEqual(actual, input);
        },

        rgbParser_threeDefinedThings_inputAsArray: function () {
            var input = [111, 'a string', {an: 'object'}],
                actual = Color.rgbParser.apply(Color, input);

            assert.deepEqual(actual, input);
        },

        rgbParser_css3DigitHexColor_colorAsNumberArray: function () {
            var input = '#a93',
                actual = Color.rgbParser(input),
                expected = [170, 153, 51];

            assert.deepEqual(actual, expected);
        },

        rgbParser_css6DigitHexColor_colorAsNumberArray: function () {
            var input = '#f0ab00',
                actual = Color.rgbParser(input),
                expected = [240, 171, 0];

            assert.deepEqual(actual, expected);
        },

        rgbParser_css6DigitHexColorWithSpacesInBetween_fails: function () {
            var input = '#f 0 a  b0  0',
                actual = Color.rgbParser(input),
                expected = [240, 171, 0];

            assert.notDeepEqual(actual, expected);
        },

        rgbParser_css6DigitHexColorWithSpacesAtTheEnd_ignoresSpaces: function () {
            var input = '#f0ab00      ',
                actual = Color.rgbParser(input),
                expected = [240, 171, 0];

            assert.deepEqual(actual, expected);
        },

        rgbParser_css3DigitHexColorWithMax3SpacesInbetween_ignoresSpaces: function () {
            var input = '#a 9  3',
                actual = Color.rgbParser(input),
                expected = [170, 153, 51];

            assert.deepEqual(actual, expected);
        },

        rgbParser_css6DigitHexColorUpperCase_ignoresUpperCase: function () {
            var input = '#F0Ab00',
                actual = Color.rgbParser(input),
                expected = [240, 171, 0];

            assert.deepEqual(actual, expected);
        },

        rgbParser_stringConstant_works: function () {
            var i, actual,
                inputs = ['lemonchiffon', 'purple', 'skyblue'],
                expected = [[255, 250, 205], [128, 0, 128], [135, 206, 235]];

            for (i = 0; i < inputs.length; ++i) {
                actual = Color.rgbParser(inputs[i]);
                assert.deepEqual(actual, expected[i]);
            }
        },

        rgbParser_css6DigitHexColorWithInvalidHex_emptyArray: function () {
            var input = '#1234XZ',
                actual = Color.rgbParser(input),
                expected = [];

            assert.deepEqual(actual, expected);
        },

        rgbParser_cssRGBNotation_validResult: function () {
            var input = 'rgb(34, 191, 32)',
                actual = Color.rgbParser(input),
                expected = [34, 191, 32];

            assert.deepEqual(actual, expected);
        },

        rgbParser_cssRGBNotationNumberTooBig_numberIsClamped: function () {
            var input = 'rgb(34, 191, 320)',
                actual = Color.rgbParser(input),
                expected = [34, 191, 255];

            assert.deepEqual(actual, expected);
        },

        rgbParser_cssRGBANotation_validResult: function () {
            var input = 'rgba(34, 191, 32, 0.5)',
                actual = Color.rgbParser(input),
                expected = [34, 191, 32];

            assert.deepEqual(actual, expected);
        },

        rgb2hex_css6DigitHexColor_resultEqualsInput: function () {
            var input = '#010203',
                actual = Color.rgb2hex(input);

            assert.equal(actual, input);
        },

        rgb2css_cssRGBNotation_resultEqualsInput: function () {
            var input = 'rgb(34, 191, 25)',
                actual = Color.rgb2css(input);

            assert.equal(actual, input);
        },

        hex2rgb_cssRGBNotation_resultEqualsInput: function () {
            var input = 'rgb(34, 191, 25)',
                actual = Color.rgb2css(input);

            assert.equal(actual, input);
        },

        hsv2rgb_validHSV_validCSS6DigitHexString: function () {
            var actual = Color.hsv2rgb(180, 0.5, 0.5),
                expected = '#408080';

            assert.equal(actual, expected);
        },

        hsv2rgb_saturationAndHueAreZero_returnsGrey: function () {
            var actual = Color.hsv2rgb(0, 0, 0.5),
                expected = '#808080';

            assert.equal(actual, expected);
        },

        hsv2rgb_saturationIsZeroAndHueIsNot_returnsWhite: function () {
            var actual = Color.hsv2rgb(180, 0, 0.5),
                expected = '#ffffff';

            assert.equal(actual, expected);
        },

        rgb2hsv_red_returnsHSV: function () {
            var actual = Color.rgb2hsv('#f00'),
                expected = [0, 1, 1];

            assert.deepEqual(actual, expected);
        },

        rgb2hsv_blue_returnsHSV: function () {
            var actual = Color.rgb2hsv('#00f'),
                expected = [240, 1, 1];

            assert.deepEqual(actual, expected);
        },

        rgb2hsv_grey_returnsHSV: function () {
            var actual = Color.rgb2hsv('#808080'),
                expected = [0, 0, 0.5];

            assert.equal(actual[0], expected[0]);
            assert.equal(actual[1], expected[1]);
            assert.equal(actual[2].toFixed(2), expected[2].toFixed(2));
        },

        rgb2LMS_red_returnsLMS: function () {
            var actual = Color.rgb2LMS('#f00'),
                expected = [0.7081423563792175, 0.2649291211696994, 0.040893539132190786];

            storeArrayContentAsProperties(expected, 'lms');
            assert.deepEqual(actual, expected);
        },

        rgb2LMS_green_returnsLMS: function () {
            var actual = Color.rgb2LMS('#0f0'),
                expected = [1.2015185493795306, 1.2490928602982028, 0.13655325673517216];

            storeArrayContentAsProperties(expected, 'lms');
            assert.deepEqual(actual, expected);
        },

        LMS2rgb_red_returnsRGBArray: function () {
            var actual = Color.LMS2rgb(0.7081423563792175, 0.2649291211696994, 0.040893539132190786),
                expected = [254, 0, -0.5];

            storeArrayContentAsProperties(expected, 'rgb');
            assert.deepEqual(actual, expected);
        },

        LMS2rgb_green_returnsRGBArrayAlmostDescribingGreen: function () {
            var actual = Color.LMS2rgb(1.2015185493795306, 1.2490928602982028, 0.13655325673517216),
                expected = [-0.5, 254.5, 0];

            storeArrayContentAsProperties(expected, 'rgb');
            assert.deepEqual(actual, expected);
        },

        rgba2rgbo_lightRed_returnsRedAndCorrectOpacity: function () {
            var actual = Color.rgba2rgbo('#ff000080'),
                expected = ['#ff0000', 0.5019607843137255];

            assert.deepEqual(actual, expected);
        },

        rgba2rgbo_lightRedInShortNotation_returnsInputAndOpacityOf1: function () {
            var actual = Color.rgba2rgbo('#f008'),
                expected = ['#f008', 1];

            assert.deepEqual(actual, expected);
        }
    });
});
