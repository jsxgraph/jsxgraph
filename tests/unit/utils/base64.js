define([
    'intern!object',
    'intern/chai!assert',
    'utils/base64'
], function (registerSuite, assert, Base64) {
    registerSuite({
        encode_asciiWithoutPadding_encodedString: function () {
            var actual,
                input = 'JXG',
                expected = 'SlhH';

            actual = Base64.encode(input);
            assert.strictEqual(actual, expected);
        },

        encode_asciiWith1BytePadding_encodedString: function () {
            var actual,
                input = 'JSXGraph',
                expected = 'SlNYR3JhcGg=';

            actual = Base64.encode(input);
            assert.strictEqual(actual, expected);
        },

        encode_asciiWith2BytePadding_encodedString: function () {
            var actual,
                input = 'J',
                expected = 'Sg==';

            actual = Base64.encode(input);
            assert.strictEqual(actual, expected);
        },

        encode_utf8_encodedString: function () {
            var actual,
                input = '\u3053\u3093\u306B\u3061\u306F',
                expected = '44GT44KT44Gr44Gh44Gv';

            actual = Base64.encode(input);
            assert.strictEqual(actual, expected);
        },

        decode_asciiWithoutPadding_decodedString: function () {
            var actual,
                input = 'SlhH',
                expected = 'JXG';

            actual = Base64.decode(input);
            assert.strictEqual(actual, expected);
        },

        decode_asciiWith1BytePadding_decodedString: function () {
            var actual,
                input = 'SlNYR3JhcGg=',
                expected = 'JSXGraph';

            actual = Base64.decode(input);
            assert.strictEqual(actual, expected);
        },

        decode_asciiWith2BytePadding_decodedString: function () {
            var actual,
                input = 'Sg==',
                expected = 'J';

            actual = Base64.decode(input);
            assert.strictEqual(actual, expected);
        },

        decode_asciiWithoutPaddingUseUTF8_decodedString: function () {
            var actual,
                input = 'SlhH',
                expected = 'JXG';

            actual = Base64.decode(input, true);
            assert.strictEqual(actual, expected);
        },

        decode_utf8_decodedString: function () {
            var actual,
                input = '44GT44KT44Gr44Gh44Gv',
                expected = '\u3053\u3093\u306B\u3061\u306F';

            actual = Base64.decode(input, true);
            assert.strictEqual(actual, expected);
        },

        decode_asciiWith1BytePaddingMissing_throwsError: function () {
            var actual,
                input = 'SlNYR3JhcGg',
                decode = function () {
                    Base64.decode(input);
                };

            assert.throws(decode, Error, /.*?invalid input length.*/);
        },

        decode_withInvalidCharacters_stillWorks: function () {
            var actual,
                input = 'S~g!!=()=',
                expected = 'J';

            actual = Base64.decode(input);
            assert.strictEqual(actual, expected);
        },

        decodeAsArray_ascii_returnsArray: function () {
            var actual,
                input = 'SlhH',
                expected = [74, 88, 71];

            actual = Base64.decodeAsArray(input);
            assert.deepEqual(actual, expected);
        }
    });
});
