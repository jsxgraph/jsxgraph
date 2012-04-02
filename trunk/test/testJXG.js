/*
    Copyright 2011
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.

*/

/*
 *  Js-Test-Driver Test Suite for JXG.AbstractRenderer
 *  http://code.google.com/p/js-test-driver
 */

TestCase("JXG", {

    testExtend: function () {
        expectAsserts(4);

        var e = {
                foo: 1,
                bar: 'string',
                dr: {
                    foo: 3
                }
            },
            o = {
                old: 3,
                bar: 'nostring'
            };

        JXG.extend(o, e);
        assertEquals('test old property still exists', 3, o.old);
        assertEquals('test override property', 'string', o.bar);
        assertEquals('test new property is copied', 1, o.foo);

        o.dr.foo = 4;
        assertEquals('test flat copy object', 4, e.dr.foo);
    },

    testShortcut: function () {
        expectAsserts(4);

        var o = {
                justAFunction: sinon.stub()
            };

        o.shortcut = JXG.shortcut(o, 'justAFunction');

        assertFunction('test shortcut is a function', o.shortcut);
        
        o.shortcut();
        assertTrue('test shortcut calls original method', o.justAFunction.called);

        o.shortcut(10);
        assertEquals('test shortcut passes parameters', 1, o.justAFunction.getCall(1).args.length);
        assertEquals('test shortcut passes parameters with correct value', 10, o.justAFunction.getCall(1).args[0]);
    },

    testGetReference: function () {
        expectAsserts(6);

        var board = {
                objects: {
                    point: 1,
                    line: 1
                },
                elementsByName: {
                    line: 2,
                    circle: 2
                },
                groups: {
                    group: 3
                }
            };

        sinon.spy(JXG, 'getReference');
        assertEquals('test search board.objects', 1, JXG.getReference(board, 'point'));
        assertEquals('test search board.elementsByName', 2, JXG.getReference(board, 'circle'));
        assertEquals('test search board.groups', 3, JXG.getReference(board, 'group'));
        assertEquals('test objects has an higher order of precedence  than elementsByName', 1, JXG.getRef(board, 'line'));
        assertEquals('test non existing keys are simply returned', 'arc', JXG.getRef(board, 'arc'));

        assertEquals('test getRef amd getReferemce are actually the same', 5, JXG.getReference.callCount);
        JXG.getReference.restore();
    },

    testIsString: function () {
        expectAsserts(5);

        assertTrue('test string recognized', JXG.isString('string'));
        assertFalse('test number', JXG.isString(3));
        assertFalse('test object', JXG.isString({f: 1}));
        assertFalse('test String() class instance', JXG.isString(new String()));
        assertFalse('test function', JXG.isString(function () {}));
    },

    testIsNumber: function () {
        expectAsserts(6);

        assertTrue('test float recognized', JXG.isNumber(4.5));
        assertTrue('test int recognized', JXG.isNumber(4));
        assertFalse('test string', JXG.isNumber('string'));
        assertFalse('test object', JXG.isString({f: 1}));
        assertFalse('test Number() class instance', JXG.isString(new Number()));
        assertFalse('test function', JXG.isString(function () {}));
    },

    testIsFunction: function () {
        expectAsserts(5);

        assertTrue('test function recognized', JXG.isFunction(function () {}));
        assertTrue('test Function() class instance recognized', JXG.isFunction(new Function()));
        assertFalse('test string', JXG.isFunction('string'));
        assertFalse('test number', JXG.isFunction(3));
        assertFalse('test object', JXG.isFunction({f: 1}));
    },

    testIsArray: function () {
        expectAsserts(5);

        assertTrue('test array string literal recognized', JXG.isArray([1]));
        assertTrue('test Array() class instance recognized', JXG.isArray(new Array()));
        assertFalse('test string', JXG.isArray('string'));
        assertFalse('test number', JXG.isArray(3));
        assertFalse('test object', JXG.isArray({f: 1}));
    },

    testExists: function () {
        expectAsserts(2);

        var o, b = '1';
        
        assertTrue('a variable with a string value exists', JXG.exists(b));
        assertFalse('a variable without a value does not exist', JXG.exists(o));
    },

    testStr2bool: function () {
        expectAsserts(4);

        assertTrue('string true', JXG.str2Bool('true'));
        assertFalse('string false', JXG.str2Bool('false'));
        assertTrue('literal true', JXG.str2Bool(true));
        assertFalse('literal false', JXG.str2Bool(false));
    },

    test_board: function () {
        expectAsserts(1);

        var bkp = JXG.JSXGraph.initBoard;

        JXG.JSXGraph.initBoard = sinon.stub();

        JXG._board('ain\'t', {it: 'funny'});
        assertTrue('_board calls JSXGraph.initBoard', JXG.JSXGraph.initBoard.calledOnce);

        JXG.JSXGraph.initBoard = bkp;
    },

    testDeepCopy: function () {
        expectAsserts(7);

        var o = {
                str: 'string',
                num: 123,
                arr: [1, 'str', ['inner array']],
                obj: {
                    subprop: 2
                },
                fun: sinon.stub(),
                name: 'test'
            },
            copy;

        copy = JXG.deepCopy(o);

        assertEquals('test compare string content', 'string', copy.str);
        assertEquals('test compare number content', 123, copy.num);
        assertEquals('test array content', [1, 'str', ['inner array']], copy.arr);
        assertEquals('test sub object content', 2, copy.obj.subprop);
        assertFunction('test function type', copy.fun);
        assertEquals('test name content', 'test', copy.name);

        copy.fun();
        assertTrue(o.fun.calledOnce);
    },

    testDeepCopyMerge: function () {
        expectAsserts(6);

        var o1 = {
                color: 'abc',
                arr: [1, 2, 3],
                num: 10,
                subo: {
                    foo: 42
                }
            },
            o2 = {
                color: 'def',
                arr: [4, 5, 6],
                o: {
                    subprop: 12
                },
                name: 'test',
                subo: {
                    
                }
            },
            copy;

        copy = JXG.deepCopy(o1, o2);

        assertEquals('test string override content', 'def', copy.color);
        assertEquals('test array override content', [4, 5, 6], copy.arr);
        assertEquals('test subprop new content', 12, copy.o.subprop);
        assertEquals('test number original content', 10, copy.num);
        assertEquals('test subobject original content', 42, copy.subo.foo);
        assertEquals('test name content', 'test', copy.name);
    }
});
