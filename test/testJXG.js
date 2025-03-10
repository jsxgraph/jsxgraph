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

describe("Test JXG util functions", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "no",
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        resize: {enabled: false},
        showCopyright: false,
        showNavigation: false
    });

    it("Extend", function () {
        var e = {
                foo: 1,
                bar: "string",
                dr: {
                    foo: 3
                }
            },
            o = {
                old: 3,
                bar: "nostring"
            };

        JXG.extend(o, e);
        expect(o.old).toEqual(3);
        expect(o.bar).toEqual("string");
        expect(o.foo).toEqual(1);
        o.dr.foo = 4;
        expect(e.dr.foo).toEqual(4);
    });

    it("Shortcut", function () {
        var o = {
            justAFunction: function () {
                o.justAFunction.called = true;
                return arguments;
            }
        };

        o.shortcut = JXG.shortcut(o, "justAFunction");
        expect(o.shortcut).toBeInstanceOf(Function);

        o.shortcut();
        expect(o.justAFunction.called).toBeTrue();
        // o.shortcut(10);
        expect(o.shortcut(10).length).toEqual(1);
        expect(o.shortcut(10)[0]).toEqual(10);
    });

    it("isString", function () {
        expect(JXG.isString("string")).toBeTrue();
        expect(JXG.isString(3)).toBeFalse();
        expect(JXG.isString({ f: 1 })).toBeFalse();
        expect(JXG.isString(new String())).toBeFalse();
        expect(JXG.isString(function () {})).toBeFalse();
    });

    it("isNumber", function () {
        expect(JXG.isNumber(4.5)).toBeTrue();
        expect(JXG.isNumber(4)).toBeTrue();
        expect(JXG.isNumber("string")).toBeFalse();
        expect(JXG.isString({ f: 1 })).toBeFalse();
        expect(JXG.isString(new Number())).toBeFalse();
        expect(JXG.isString(function () {})).toBeFalse();
    });

    it("isFunction", function () {
        expect(JXG.isFunction(function () {})).toBeTrue();
        expect(JXG.isFunction(new Function())).toBeTrue();
        expect(JXG.isFunction("string")).toBeFalse();
        expect(JXG.isFunction(3)).toBeFalse();
        expect(JXG.isFunction({ f: 1 })).toBeFalse();
    });

    it("isArray", function () {
        expect(JXG.isArray([1])).toBeTrue();
        expect(JXG.isArray(new Array())).toBeTrue();
        expect(JXG.isArray("string")).toBeFalse();
        expect(JXG.isArray(3)).toBeFalse();
        expect(JXG.isArray({ f: 1 })).toBeFalse();
    });

    it("exists", function () {
        var o,
            b = "1",
            x = { a: 1 };
        expect(JXG.exists(b)).toBeTrue();
        expect(JXG.exists(o)).toBeFalse();
        expect(JXG.exists(x.a)).toBeTrue();
        expect(JXG.exists(x.b)).toBeFalse();
    });

    it("str2Bool", function () {
        expect(JXG.str2Bool("true")).toBeTrue();
        expect(JXG.str2Bool("false")).toBeFalse();
        expect(JXG.str2Bool(true)).toBeTrue();
        expect(JXG.str2Bool(false)).toBeFalse();
    });

    it("deepCopy", function () {
        var o = {
                str: "string",
                num: 123,
                arr: [1, "str", ["inner array"]],
                obj: {
                    subprop: 2
                },
                funCalled: 0,
                fun: function () {
                    this.funCalled += 1;
                },
                name: "test"
            },
            copy;

        copy = JXG.deepCopy(o);

        expect(copy.str).toEqual("string");
        expect(copy.num).toEqual(123);
        expect(copy.arr).toEqual([1, "str", ["inner array"]]);
        expect(copy.obj.subprop).toEqual(2);
        expect(copy.fun).toBeInstanceOf(Function);
        expect(copy.name).toEqual("test");

        copy.fun();
        expect(copy.funCalled).toEqual(1);
    });

    it("deepCopyMerge", function () {
        var o1 = {
                color: "abc",
                arr: [1, 2, 3],
                num: 10,
                subo: {
                    foo: 42
                }
            },
            o2 = {
                color: "def",
                arr: [4, 5, 6],
                o: {
                    subprop: 12
                },
                name: "test",
                subo: {}
            },
            copy;

        copy = JXG.deepCopy(o1, o2);
        expect(copy.color).toEqual("def");
        expect(copy.arr).toEqual([4, 5, 6]);
        expect(copy.o.subprop).toEqual(12);
        expect(copy.num).toEqual(10);
        expect(copy.subo.foo).toEqual(42);
        expect(copy.name).toEqual("test");
    });

    it("copyAttributes", function () {
        var s = board.create('slider', [[-1, -3], [1, -3], [0, 1,1]], {label: {strokeColor: 'red'}});
        expect(s.label.visProp.strokecolor).toEqual('red');
    });

});

/*
TestCase("JXG", {
    div: null,

    setUp: function () {
        document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
        this.div = document.getElementById('jxgbox');
    },

    testAddEvent: function() {
        expectAsserts(1);

        var mousedown = sinon.stub();

        JXG.addEvent(this.div, 'mousedown', mousedown, this);
        fire.event(this.div, 'mousedown');

        assertTrue(mousedown.calledOnce);
    },

    testRemoveEvent: function () {
        expectAsserts(3);

        var mousedown1 = sinon.stub(),
            mousedown2 = sinon.stub(),
            mousedown3 = sinon.stub();

        JXG.addEvent(this.div, 'mousedown', mousedown1, this);
        JXG.addEvent(this.div, 'mousedown', mousedown2, this);
        JXG.addEvent(this.div, 'mousedown', mousedown3, this);

        JXG.removeEvent(this.div, 'mousedown', mousedown2, this);

        fire.event(this.div, 'mousedown');

        assertTrue(mousedown1.calledOnce);
        assertFalse(mousedown2.calledOnce);
        assertTrue(mousedown3.calledOnce);
    },

    testRemoveAllEvents: function () {
        expectAsserts(3);

        var mousedown1 = sinon.stub(),
            mousedown2 = sinon.stub(),
            mousedown3 = sinon.stub();

        JXG.addEvent(this.div, 'mousedown', mousedown1, this);
        JXG.addEvent(this.div, 'mousedown', mousedown2, this);

        JXG.removeAllEvents(this.div, 'mousedown', this);

        JXG.addEvent(this.div, 'mousedown', mousedown3, this);

        fire.event(this.div, 'mousedown');

        assertFalse(mousedown1.calledOnce);
        assertFalse(mousedown2.calledOnce);
        assertTrue(mousedown3.calledOnce);    }
});
*/
