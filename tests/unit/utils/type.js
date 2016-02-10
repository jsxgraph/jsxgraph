define([
    'intern!object',
    'intern/chai!assert',
    'node/sinon/lib/sinon',
    'utils/type',
    'base/constants'
], function (registerSuite, assert, sinon, Type, Const) {
    registerSuite({
        isId_stringThatAppearsInBoardObjects_returnsTrue: function () {
            var query = "element1",
                mockBoard = {objects: {}},
                expectedResult = true,
                result;

            mockBoard.objects[query] = true;

            result = Type.isId(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isId_stringThatDoesNotAppearInBoardObjects_returnsFalse: function () {
            var query = "element1",
                mockBoard = {objects: {}},
                expectedResult = false,
                result;

            result = Type.isId(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isId_number_returnsFalse: function () {
            var query = 3,
                mockBoard = {objects: {}},
                expectedResult = false,
                result;

            result = Type.isId(mockBoard, query);
            assert.strictEqual(expectedResult, result);
        },

        isId_boardWithoutObjectsProperty_throwsException: function () {
            var query = "element",
                mockBoard = {},
                isId = function () {
                    Type.isId(mockBoard, query);
                };

            assert.throws(isId, Error, /.*?Cannot read property.*?of undefined.*/);
        },

        isName_stringThatAppearsInBoardElementList_returnsTrue: function () {
            var query = "element1",
                mockBoard = {elementsByName: {}},
                expectedResult = true,
                result;

            mockBoard.elementsByName[query] = true;

            result = Type.isName(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isName_stringThatDoesNotAppearInElementList_returnsFalse: function () {
            var query = "element1",
                mockBoard = {elementsByName: {}},
                expectedResult = false,
                result;

            result = Type.isName(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isName_number_returnsFalse: function () {
            var query = 3,
                mockBoard = {elementsByName: {}},
                expectedResult = false,
                result;

            result = Type.isName(mockBoard, query);
            assert.strictEqual(expectedResult, result);
        },

        isName_boardWithoutElementsByNAmeProperty_throwsException: function () {
            var query = "element",
                mockBoard = {},
                isName = function () {
                    Type.isName(mockBoard, query);
                };

            assert.throws(isName, Error, /.*?Cannot read property.*?of undefined.*/);
        },

        isGroup_stringThatAppearsInGroups_returnsTrue: function () {
            var query = "group",
                mockBoard = {groups: {}},
                expectedResult = true,
                result;

            mockBoard.groups[query] = true;

            result = Type.isGroup(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isGroup_stringThatDoesNotAppearInGroups_returnsFalse: function () {
            var query = "group",
                mockBoard = {groups: {}},
                expectedResult = false,
                result;

            result = Type.isGroup(mockBoard, query);

            assert.strictEqual(expectedResult, result);
        },

        isGroup_number_returnsFalse: function () {
            var query = 3,
                mockBoard = {groups: {}},
                expectedResult = false,
                result;

            result = Type.isGroup(mockBoard, query);
            assert.strictEqual(expectedResult, result);
        },

        isGroup_boardWithoutGroupsProperty_throwsException: function () {
            var query = "group",
                mockBoard = {},
                isGroup = function () {
                    Type.isGroup(mockBoard, query);
                };

            assert.throws(isGroup, Error, /.*?Cannot read property.*?of undefined.*/);
        },

        isString_string_returnsTrue: function () {
            var value = "a string",
                expectedResult = true,
                result;

            result = Type.isString(value);
            assert.strictEqual(expectedResult, result);
        },

        isString_stringObject_returnsFalse: function () {
            var value = new String("a string"),
                expectedResult = false,
                result;

            result = Type.isString(value);
            assert.strictEqual(expectedResult, result);
        },

        isNumber_number_returnsTrue: function () {
            var value = 12,
                expectedResult = true,
                result;

            result = Type.isNumber(value);
            assert.strictEqual(expectedResult, result);
        },

        isNumber_numberObject_returnsFalse: function () {
            var value = new Number(12),
                expectedResult = false,
                result;

            result = Type.isNumber(value);
            assert.strictEqual(expectedResult, result);
        },

        isFunction_function_returnsTrue: function () {
            var value = function () {},
                expectedResult = true,
                result;

            result = Type.isFunction(value);
            assert.strictEqual(expectedResult, result);
        },

        isFunction_functionObject_returnsTrue: function () {
            var value = new Function(),
                expectedResult = true,
                result;

            result = Type.isFunction(value);
            assert.strictEqual(expectedResult, result);
        },

        isArray_array_returnsTrue: function () {
            var value = [],
                expectedResult = true,
                result;

            result = Type.isArray(value);
            assert.strictEqual(expectedResult, result);
        },

        isArray_arrayObject_returnsTrue: function () {
            var value = new Array(),
                expectedResult = true,
                result;

            result = Type.isArray(value);
            assert.strictEqual(expectedResult, result);
        },

        isObject_object_returnsTrue: function () {
            var value = {},
                expectedResult = true,
                result;

            result = Type.isObject(value);
            assert.strictEqual(expectedResult, result);
        },

        isObject_array_returnsFalse: function () {
            var value = [],
                expectedResult = false,
                result;

            result = Type.isObject(value);
            assert.strictEqual(expectedResult, result);
        },

        isPoint_objectWithElementClassPropertySetToOBJECT_CLASS_POINT_returnsTrue: function () {
            var mockPoint = {elementClass: Const.OBJECT_CLASS_POINT},
                expectedResult = true,
                result;

            result = Type.isPoint(mockPoint);
            assert.strictEqual(expectedResult, result);
        },

        isPoint_null_returnsFalse: function () {
            var point = null,
                expectedResult = false,
                result;

            result = Type.isPoint(point);
            assert.strictEqual(expectedResult, result);
        },

        isPointType_jxgPoint_returnsTrue: function () {
            var mockBoard = {select: function (v) { return v;}},
                point = {elementClass: Const.OBJECT_CLASS_POINT},
                expectedResult = true,
                result;

            result = Type.isPointType(mockBoard, point);
            assert.strictEqual(expectedResult, result);
        },

        isPointType_emptyArray_returnsTrue: function () {
            var mockBoard = {},
                point = [],
                expectedResult = true,
                result;

            result = Type.isPointType(mockBoard, point);
            assert.strictEqual(expectedResult, result);
        },

        isPointType_functionReturningEmptyArray_returnsFalse: function () {
            var mockBoard = {select: sinon.spy()},
                point = sinon.stub().returns([]),
                expectedResult = false,
                result;

            result = Type.isPointType(mockBoard, point);
            assert.strictEqual(expectedResult, result);
            assert(point.calledOnce);
            assert(mockBoard.select.calledOnce);
        },

        isPointType_functionReturningArrayWithTwoElements_returnsTrue: function () {
            var mockBoard = {},
                point = sinon.stub().returns([1, 2]),
                expectedResult = true,
                result;

            result = Type.isPointType(mockBoard, point);
            assert.strictEqual(expectedResult, result);
            assert(point.calledOnce);
        },

        exists_null_returnsFalse: function () {
            var value = null,
                expectedResult = false,
                result;

            result = Type.exists(value);
            assert.strictEqual(expectedResult, result);
        },

        exists_undefined_returnsFalse: function () {
            var value,
                expectedResult = false,
                result;

            result = Type.exists(value);
            assert.strictEqual(expectedResult, result);
        },

        def_nullAsValueAndANumberAsDefault_returnsNumber: function () {
            var value = null,
                def = 3,
                result;

            result = Type.def(value, def);
            assert.strictEqual(result, def);
        },

        def_undefinedAsValueAndANumberAsDefault_returnsNumber: function () {
            var value,
                def = 13,
                result;

            result = Type.def(value, def);
            assert.strictEqual(result, def);
        },

        def_stringAsValueAndANumberAsDefault_returnsString: function () {
            var value = "value",
                def = 3,
                result;

            result = Type.def(value, def);
            assert.strictEqual(result, value);
        },

        str2Bool_null_returnsTrue: function () {
            var value = null,
                expectedResult = true,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        str2Bool_undefined_returnsTrue: function () {
            var value,
                expectedResult = true,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        str2Bool_stringContainingValuetrue_returnsTrue: function () {
            var value = "true",
                expectedResult = true,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        str2Bool_stringContainingValueTrUe_returnsTrue: function () {
            var value = "TrUe",
                expectedResult = true,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        str2Bool_number_returnsFalse: function () {
            var value = 3,
                expectedResult = false,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        str2Bool_false_returnsFalse: function () {
            var value = false,
                expectedResult = false,
                result;

            result = Type.str2Bool(value);
            assert.strictEqual(expectedResult, result);
        },

        createEvalFunction_mockBoardAndSingleParam_returnsStubFunction: function () {
            var evalFunctionResult = 4,
                mockBoard = {
                    jc: {
                        snippet: sinon.stub().returns(
                            function () {
                                return evalFunctionResult;
                            })
                    }
                },
                params = ["1"],
                result;

            result = Type.createEvalFunction(mockBoard, params, params.length);
            assert(mockBoard.jc.snippet.calledWith(params[0], true, '', true));
            assert.strictEqual(result(0), evalFunctionResult);
        },

        createFunction_mockBoardAndStringEvaluatedByJC_returnsStubFunction: function () {
            var term = 'some jessiecode/geonext term',
                mockBoard = {
                    jc: {
                        snippet: sinon.stub().returns(
                            function () {
                                return term;
                            })
                    }
                },
                paramName = '',
                evalGeonext = true,
                result;

            result = Type.createFunction(term, mockBoard, paramName, evalGeonext);
            assert(mockBoard.jc.snippet.calledWith(term, true, paramName, true));
            assert.strictEqual(result(), term);
            assert.strictEqual(result.origin, term);
        },

        createFunction_mockBoardAndStubFunction_returnsStubFunction: function () {
            var stubFunctionResult = 4,
                stubFunction = sinon.stub().returns(stubFunctionResult),
                mockBoard = {},
                param = '',
                evalGeonext = false,
                result;

            result = Type.createFunction(stubFunction, mockBoard, param, evalGeonext);
            assert.strictEqual(stubFunction.callCount, 0);
            assert.strictEqual(result(), stubFunctionResult);
            assert(stubFunction.calledOnce);
            assert.strictEqual(result.origin, stubFunction);
        },

        createFunction_mockBoardAndNumber_returnsFunctionThatReturnsNumber: function () {
            var functionResult = 4,
                mockBoard = {},
                param = '',
                evalGeonext = false,
                result;

            result = Type.createFunction(functionResult, mockBoard, param, evalGeonext);
            assert.strictEqual(result(), functionResult);
            assert.strictEqual(result.origin, functionResult);
        },

        createFunction_mockBoardAndString_returnsFunctionThatReturnsString: function () {
            var functionResult = "a string",
                mockBoard = {},
                param = '',
                evalGeonext = false,
                result;

            result = Type.createFunction(functionResult, mockBoard, param, evalGeonext);
            assert.strictEqual(result(), functionResult);
            assert.strictEqual(result.origin, functionResult);
        }
    });
});
