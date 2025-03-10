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

describe("Test text handling", function () {
    var board;

    // jasmine.clock().install();
    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        showCopyright: false,
        showNavigation: false
    });

    it("setup", function () {
        var el = board.create("text", [0, 10, "test"]);
        expect(el.rendNode).not.toBeNull();
        expect(el.rendNode.innerHTML).toEqual("test");
    });

    it("Update text", function () {
        var el = board.create("text", [0, 10, "test"]);
        el.setText("text 2");
        expect(el.rendNode.innerHTML).toEqual("text 2");
    });

    it("setText", function () {
        var txt = "test <span>SPAN</span>",
            txt2 = 'hello <button onClick="alert(1)">Click</button>',
            el = board.create("text", [0, 10, txt]),
            el2;

        // JSXGraph texts allow arbitrary HTML
        expect(el.plaintext).toEqual(txt);

        // JessieCode texts are sanitized
        el2 = board.jc.parse("t = text(1, 1, '" + txt2 + "');");
        expect(el2.plaintext).toEqual(
            'hello &lt;button onClick="alert(1)"&gt;Click&lt;/button&gt;'
        );
    });

    it("parse", function () {
        var el = board.create("text", [0, 10, 'Hello <span class="my">world</span>'], {
            parse: true
        });
        //console.log(el.rendNode.innerHTML);
        expect(el.rendNode.innerHTML).toEqual('Hello <span class="my">world</span>');
    });

    it("parse + MathJax", function () {
        var A = board.create("point", [2, 4]),
            el = board.create("text", [0, 10, "\\[2X(A)+\\pi=<value>2X(A) + PI</value>\\]"], {
                parse: true,
                useMathJax: true
            });
        expect(el.rendNode.innerHTML).toEqual("\\[2X(A)+\\pi=7.14\\]");
    });

    it("text function + MathJax", function () {
        var A = board.create("point", [2, 4]),
            el = board.create("text", [0, 10, () => "\\[" + A.X().toFixed(3) + "+ \\pi\\]"], {
                useMathJax: true
            });
        expect(el.rendNode.innerHTML).toEqual("\\[2.000+ \\pi\\]");
    });

    it("button + function", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "button",
                [-3, 3, () => "Press " + A.X().toFixed(3), function () {}],
                {}
            );
        expect(el.rendNodeButton.innerHTML).toEqual("Press 2.000");
    });

    it("button + MathJax + function", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "button",
                [-3, 3, "\\(\\int\\) <value>X(A)</value>", function () {}],
                { useMathJax: true }
            );
        expect(el.rendNodeButton.innerHTML).toEqual("\\(\\int\\) 2.00");
    });

    it("input + MathJax + function", function () {
        var A = board.create("point", [2, 4]),
            el = board.create("input", [-3, 1, "test", "\\(\\int\\) <value>X(A)</value>: "], {
                parse: true,
                useMathJax: true
            });
        expect(el.rendNodeLabel.innerHTML).toEqual("\\(\\int\\) 2.00: ");
    });

    it("checkbox + MathJax + function", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "checkbox",
                [-3, 0.5, () => "Change \\(\\int" + A.X().toFixed(4) + "\\)"],
                { useMathJax: true }
            );
        expect(el.rendNodeLabel.innerHTML).toEqual("Change \\(\\int2.0000\\)");
    });

    it("text + default parse + value", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "text",
                [-2, -1, "val_x X(A)+1+&pi;=<value>X(A) + 1 + PI</value>"],
                {}
            );
        expect(el.rendNode.innerHTML).toEqual("val<sub>x</sub> X(A)+1+π=6.14");
    });

    it("text + default parse + value + MathJax", function () {
        var A = board.create("point", [2, 4]),
            el = board.create("text", [-2, -1, "\\[2X(A)+\\pi=<value>2X(A) + PI</value>\\]"], {
                useMathJax: true
            });
        expect(el.rendNode.innerHTML).toEqual("\\[2X(A)+\\pi=7.14\\]");
    });

    it("text + parse=false + value", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "text",
                [-2, -1, "<sqrt>val_x 1</sqrt>+1+&pi;=<value>1 + 1 + PI</value>"],
                { parse: false }
            );
        expect(el.rendNode.innerHTML).toEqual(
            "<sqrt>val_x 1</sqrt>+1+π=<value>1 + 1 + PI</value>"
        );
    });

    it("text + parse=true + value", function () {
        var A = board.create("point", [2, 4]),
            el = board.create(
                "text",
                [-2, -1, "<sqrt>val_x 1</sqrt>+1+&pi;=<value>1 + 1 + PI</value>"],
                { parse: true }
            );
        expect(el.rendNode.innerHTML).toEqual("√val<sub>x</sub> 1+1+π=5.14");
    });

    it("button", function () {
        var txt = board.create('button', [0, 0, 'test', ()=>{}], {visible: false});
        expect(JXG.exists(txt.rendNodeButton)).toBeTrue();
    });

});
