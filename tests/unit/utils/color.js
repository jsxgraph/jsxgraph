define([
    'intern!object',
    'intern/chai!assert',
    'utils/color'
], function (registerSuite, assert, Color) {
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

        rgbParser_cssRGBANotation_validResult: function () {
            var input = 'rgba(34, 191, 32, 0.5)',
                actual = Color.rgbParser(input),
                expected = [34, 191, 32];

            assert.deepEqual(actual, expected);
        }
    });
});
