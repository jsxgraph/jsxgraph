define([
    'intern!object',
    'intern/chai!assert',
    'utils/encoding'
], function (registerSuite, assert, Encoding) {
    registerSuite({
        encode_ascii_identicalToInput: function () {
            var actual,
                input = 'JSXGraph';

            actual = Encoding.encode(input);
            assert.strictEqual(actual, input);
        },

        encode_enforceInternal_encodesCorrectly: function () {
            var actual,
                unescapeBackup = unescape,
                input = String.fromCharCode(53, 1056, 2055),
                expected = '\x35\xd0\xa0\xe0\xa0\x87';

            unescape = '';
            actual = Encoding.encode(input);
            assert.strictEqual(actual, expected);
            unescape = unescapeBackup;
        },

        encode_stringWithAsciiAndUTF8_encodes: function () {
            var actual,
                input = 'JSX\u3053',
                expected = 'JSX\xe3\x81\x93';

            actual = Encoding.encode(input);
            assert.strictEqual(actual, expected);
        },

        decode_ascii_identicalToInput: function () {
            var actual,
                input = 'JSXGraph';

            actual = Encoding.decode(input);
            assert.strictEqual(actual, input);
        },

        decode_stringWithAsciiAndUTF8_decodes: function () {
            var actual,
                input = 'JSX\xe3\x81\x93',
                expected = 'JSX\u3053';

            actual = Encoding.decode(input);
            assert.strictEqual(actual, expected);
        },

        // this method is one ugly beast...
        // just make sure stays where it is
        asciiCharCodeAt_allPossibleCharacters_decodesProperly: function () {
            var i,
                actual = [],
                expected = [],
                input = String.fromCharCode(8364, 8218, 402, 8222,
                    8230, 8224, 8225, 710, 8240,352, 8249, 338,
                    381, 8216, 8217, 8220, 8221, 8226, 8211, 8212,
                    732, 8482, 353, 8250, 339, 382, 376),
                omit = [129, 141, 143, 144, 157];

            for (i = 128; i < 160; ++i) {
                if (omit.indexOf(i) == -1) {
                    expected.push(i);
                }
            }

            for (i = 0; i < input.length; ++i) {
                actual.push(Encoding.asciiCharCodeAt(input, i));
            }
            assert.deepEqual(actual, expected);
        }
    });
});
