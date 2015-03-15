define([
    'intern!object',
    'intern/chai!assert',
    'utils/base64'
], function (registerSuite, assert, Base64) {
    registerSuite({
        encode_inputString_encodedString: function () {
            var actual,
                input = 'JSXGraph',
                expected = 'SlNYR3JhcGg=';
            
            actual = Base64.encode(input);

            assert.strictEqual(actual, expected, 'Base64 encode return value does not match expected value');
        }
    });
});
