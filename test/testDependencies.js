/*
    Copyright 2008-2025
        Matthias Ehmann,
        Carsten Miller,
        Andreas Walter,
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
describe("Test dependencies", function () {
    var board,
        target,
        pointerId = 0;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-10, 10, 10, -10],
        resize: {enabled: false},
        keyboard: {
            enabled: true,
            dy: 20,
            dx: 20,
            panShift: true,
            panCtrl: false
        },
        showCopyright: false,
        showNavigation: false
    });

    it("point depends on X(A)", function () {
        var p1 = board.create("point", [0, 0], { face: "+", name: "A" });
        var p2 = board.create("point", ['X(A)', 2], { face: "o", name: "B" });
        board.removeObject(p1);
    });

    it("circle depends on X(A)", function () {
        var p1 = board.create("point", [0, 0], { name: "A" });
        var c = board.create("circle", [[0, 2], 'X(A)'], { name: "B" });
        board.removeObject(p1);
    });

    it("curve depends on X(A)", function () {
        var p1 = board.create("point", [0, 0], { name: "A" });
        var e = board.create("functiongraph", ['X(A)*sin(x)'], {});
        board.removeObject(p1);
    });

});
