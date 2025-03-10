/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Alfred Wassermann

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

describe("Test JXG.Dump", function () {
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

    it("toJessie", function () {
        var s, p, txt,
        id, re;

        p = board.create("point", [2, 1]);
        s = board.create("line", [2, 1, 2]);
        s = board.create("text", [3, 2, "test"]);
        s = board.create("circle", [p, 5]);
        s = board.create("circle", [[1, 1], 5]);
        txt = JXG.Dump.toJessie(board);

        expect(txt.indexOf("point(2, 1) <<")).toBeGreaterThan(-1);
        expect(txt.indexOf('text(1, 3, 2, "test") <<')).not.toBeNull();

        expect(txt.match(/line\("jxgBoard\d+P3", "jxgBoard\d+P4"\) <</).length).toBeGreaterThan(0);
        expect(txt.match(/circle\("jxgBoard\d+P1", 5\) <</).length).not.toBeNull();
        expect(txt.match(/circle\("jxgBoard\d+P8", 5\) <</)).not.toBeNull();

        // id = board.id;
        // re = new RegExp(String.raw`line\("${id}P3", "${id}P4"\) <<`, "g");
        // expect(txt.match(re)).not.toBeNull();
        // re = new RegExp(String.raw`circle\("${id}P1", 5\) <<`, "g");
        // expect(txt.match(re)).not.toBeNull();
        // re = new RegExp(String.raw`circle\("${id}P8", 5\) <<`, "g");
        // expect(txt.match(re)).not.toBeNull();
    });
});
