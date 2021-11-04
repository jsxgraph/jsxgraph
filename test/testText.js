/*
    Copyright 2008-2021
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

describe("Test text handling", function() {
    var board;

    jasmine.clock().install();

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        showCopyright: false,
        showNavigation: false
    });

    it("setup", function() {
        var el = board.create('text', [0, 10, 'test']);
        expect(el.rendNode).not.toBeNull();
        expect(el.rendNode.innerHTML).toEqual('test');
    });

    it("Update text", function() {
        var el = board.create('text', [0, 10, 'test']);
        el.setText('text 2')
        expect(el.rendNode.innerHTML).toEqual('text 2');

    });

    it("size", function() {
        var el = board.create('text', [0, 10, 'test']);
        jasmine.clock().tick(100);

        expect(el.size).toEqual([19, 14]);
    });

    it("setText", function() {
        var txt = 'test <span>SPAN</span>',
            txt2 = "hello <button onClick=\"alert(1)\">Click</button>",
            el = board.create('text', [0, 10, txt]),
            el2;

        // JSXGraph texts allo arbitrary HTML
        expect(el.plaintext).toEqual(txt);

        // JessieCode texts are sanitized
        el2 = board.jc.parse("t = text(1, 1, '" + txt2 + "');");
        expect(el2.plaintext).toEqual("hello &lt;button onClick='alert(1)'&gt;Click&lt;/button&gt;");

    });

});

