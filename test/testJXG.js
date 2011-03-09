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
    testDeepCopy: function () {
        expectAsserts(6);

        var o = {
                str: 'string',
                num: 123,
                arr: [1, 'str', ['inner array']],
                obj: {
                    subprop: 2
                },
                fun: sinon.stub()
            },
            copy;

        copy = JXG.deepCopy(o);

        assertEquals('test compare string content', 'string', copy.str);
        assertEquals('test compare number content', 123, copy.num);
        assertEquals('test array content', [1, 'str', ['inner array']], copy.arr);
        assertEquals('test sub object content', 2, copy.obj.subprop);
        assertFunction('test function type', copy.fun);

        copy.fun();
        assertTrue(copy.fun.calledOnce);
    },

    testDeepCopyMerge: function () {
        expectAsserts(4);

        var o1 = {
                color: 'abc',
                arr: [1, 2, 3],
                num: 10
            },
            o2 = {
                color: 'def',
                arr: [4, 5, 6],
                o: {
                    subprop: 12
                }
            },
            copy;

        copy = JXG.deepCopy(o1, o2);

        assertEquals('test string override content', 'def', copy.color);
        assertEquals('test array override content', [4, 5, 6], copy.arr);
        assertEquals('test subprop new content', 12, copy.o.subprop);
        assertEquals('test number original content', 10, copy.num);
    }
});