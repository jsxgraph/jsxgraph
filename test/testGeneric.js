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
 *  Js-Test-Driver Test Suite for Generic JavaScript language tests
 *  http://code.google.com/p/js-test-driver
 */

TestCase("Generic", {
    setUp: function () {
        abcdefg = 0
    },

    tearDown: function () {
        abcdefg = 0;
    },

    testModulo: function () {
        var i, max = 5,
            empty = [],
            notempty = [1, 2, 3];

        expectAsserts(2*max);

        for (i = 0; i < max; i++) {
            assertUndefined(empty[i % empty.length]);
            assertNumber(notempty[i % notempty.length]);
        }
    },

    testEval: function () {
        expectAsserts(2);

        var f = (function () {
            var foo = 'bar';

            return eval('var abcdefg = function () { return foo; }; abcdefg;');
        })();

        assertEquals('return value is ok', 'bar', f());
        assertEquals('global variables are not introduced', 0, abcdefg);
    }
});