import registerSuite from "intern!object";
import assert from "intern/chai!assert";
import UUID from "utils/uuid";
registerSuite({
  genUUID_NoInput_ReturnsString: function () {
    var result;

    result = UUID.genUUID();

    assert.isString(result);
  },

  genUUID_NoInput_ReturnsOnlyAlphaNumericAndDash: function () {
    var result;

    result = UUID.genUUID();

    assert(/^[a-zA-Z0-9\-]+$/.test(result));
  },

  genUUID_NoInput_ResultIs36CharsLong: function () {
    var expectedLength = 36,
      result;

    result = UUID.genUUID();

    assert.equal(result.length, expectedLength);
  },

  genUUID_TwoCalls_DifferentResults: function () {
    var result1, result2;

    result1 = UUID.genUUID();
    result2 = UUID.genUUID();

    assert.notEqual(result1, result2);
  },
});
