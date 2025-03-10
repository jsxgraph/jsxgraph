/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*
 *  Js-Test-Driver Test Suite for Generic JavaScript language tests
 *  http://code.google.com/p/js-test-driver
 */

TestCase("Generic", {
    setUp: function () {
        abcdefg = 0;
    },

    tearDown: function () {
        abcdefg = 0;
    },

    testModulo: function () {
        var i,
            max = 5,
            empty = [],
            notempty = [1, 2, 3];

        expectAsserts(2 * max);

        for (i = 0; i < max; i++) {
            assertUndefined(empty[i % empty.length]);
            assertNumber(notempty[i % notempty.length]);
        }
    },

    testEval: function () {
        expectAsserts(2);

        var f = (function () {
            var foo = "bar";

            return eval("var abcdefg = function () { return foo; }; abcdefg;");
        })();

        assertEquals("return value is ok", "bar", f());
        assertEquals("global variables are not introduced", 0, abcdefg);
    },

    testConcat: function () {
        expectAsserts(1);

        var f = (function (a, b, c) {
            var x = Array.prototype.slice.call(arguments, 0);
            return ["a", "b"].concat(x).length;
        })(1, 2, 3);

        assertEquals("length is ok", 5, f);
    },

    testInheritance: function () {
        expectAsserts(2);

        var successSuper = false,
            successBase = false,
            woopSuper = function () {
                successSuper = true;
            },
            Super = function () {},
            Class = function () {},
            o;

        JXG.extend(Super.prototype, {
            woop: woopSuper
        });
        Class.prototype = new Super();

        JXG.extend(Class.prototype, {
            woop: function () {
                Super.prototype.woop.call(this);
                successBase = true;
            }
        });

        o = new Class();
        o.woop();

        assertTrue("super called", successSuper);
        assertTrue("base called", successBase);
    },

    testHiddenProperty: function () {
        expectAsserts(3);

        var inst,
            Base = function (prop) {
                this.property = prop || "Default";
            },
            Sub = function () {
                // nothing
            };

        Base.prototype.foo = function () {
            return this.property;
        };

        Sub.prototype = new Base();

        inst = new Sub();

        assertEquals("Property value is Default", "Default", inst.foo());

        inst.property = "bar";

        assertEquals("Property value is bar", "bar", inst.foo());

        delete inst.property;

        assertEquals("Property value is now Default again", "Default", inst.foo());
    }
});
