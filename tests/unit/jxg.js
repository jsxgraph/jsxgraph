define([
    'intern!object',
    'intern/chai!assert',
    'node/sinon/lib/sinon',
    'jxg'
], function (registerSuite, assert, sinon, JXG) {
    registerSuite({
        _properties_initalValues: function () {
            assert.isDefined(JXG.boards, 'boards property is undefined');
            assert.isDefined(JXG.readers, 'readers property is undefined');
            assert.isDefined(JXG.elements, 'elements property is undefined');
        },

        extend_addNumberToEmptyObjectAndWithToLowerFalse_works: function () {
            var obj = {},
                extension = {
                    foo: 3.14
                },
                onlyOwn = true,
                toLower = false,
                expected = extension;

            JXG.extend(obj, extension, onlyOwn, toLower);
            assert.deepEqual(obj, expected);
        },

        extend_addStringToEmptyObjectAndWithToLowerTrue_works: function () {
            var obj = {},
                extension = {
                    FoO: '3.14'
                },
                onlyOwn = true,
                toLower = true,
                expected = {foo: '3.14'};

            JXG.extend(obj, extension, onlyOwn, toLower);
            assert.deepEqual(obj, expected);
        },

        extend_addNestedObject_addsShallowCopy: function () {
            var obj = {},
                extension = {
                    foo: {
                        bar: 3.14
                    }
                },
                onlyOwn = true,
                toLower = false,
                expected = extension;

            JXG.extend(obj, extension, onlyOwn, toLower);
            assert.deepEqual(obj, expected);

            extension.foo.bar = 5;
            assert.strictEqual(obj.foo.bar, 5);
        },

        registerElement_dummyElement_addsElementToElementList: function () {
            var elementName = 'FoO',
                addedElementName = 'foo',
                elementCreator = function () {};

            JXG.registerElement(elementName, elementCreator);
            assert.strictEqual(JXG.elements[addedElementName], elementCreator, 'Element creator not registered');
            assert.isUndefined(JXG.elements[elementName], 'Non-lowercase element is registered');
        },

        registerReader_dummyReader_addsReaderToList: function () {
            var reader = {},
                extensions = ['txt', 'DOC'];

            JXG.registerReader(reader, extensions);
            assert.strictEqual(JXG.readers['txt'], reader);
            assert.strictEqual(JXG.readers['doc'], reader);
            assert.isUndefined(JXG.readers['foo']);
            assert.isUndefined(JXG.readers['DOC']);
        },

        shortcut_spyMethod_redirectsCallToGivenMethod: function () {
            var shortcut,
                obj = {
                    foo: sinon.spy()
                };

            shortcut = JXG.shortcut(obj, 'foo');
            shortcut('some parameter', 3.14);
            assert(obj.foo.calledWith('some parameter', 3.14));
        },

        getRef_boardMock_callsBoardSelect: function () {
            var mockBoard = {
                    select: sinon.spy()
                },
                parameter = 'foo';

            JXG.getRef(mockBoard, parameter);
            assert(mockBoard.select.calledWith(parameter));
        },

        getReference_boardMock_callsBoardSelect: function () {
            var mockBoard = {
                    select: sinon.spy()
                },
                parameter = 'foo';

            JXG.getRef(mockBoard, parameter);
            assert(mockBoard.select.calledWith(parameter));
        }
    });
});
