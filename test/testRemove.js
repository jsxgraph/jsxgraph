/*
    Copyright 2008-2026
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

describe("Test element removal", function () {
    var board;

    function consistent(b) {
        var i;
        for (i = 0; i < b.objectsList.length; i++) {
            if (b.objectsList[i]._pos !== i) {
                return false;
            }
        }
        return true;
    }

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 400px; height: 400px;"></div>';

    beforeEach(function () {
        board = JXG.JSXGraph.initBoard("jxgbox", {
            renderer: "svg",
            axis: false,
            grid: false,
            boundingbox: [-8, 8, 8, -8],
            showCopyright: false,
            showNavigation: false
        });
    });

    afterEach(function () {
        JXG.JSXGraph.freeBoard(board);
    });

    it("removing an element twice keeps other elements", function () {
        var p = board.create("point", [0, 0]),
            q = board.create("point", [1, 1]),
            r = board.create("point", [2, 2]);

        board.removeObject(p);
        expect(p._pos).toEqual(-1);
        board.removeObject(p);

        expect(board.objectsList).toContain(q);
        expect(board.objectsList).toContain(r);
        expect(consistent(board)).toBeTrue();
    });

    it("removing a parent after its child keeps later elements", function () {
        var a = board.create("point", [0, 0]),
            b = board.create("point", [1, 0]),
            s = board.create("segment", [a, b]),
            late = board.create("point", [3, 3]);

        board.removeObject(s);
        board.removeObject(b);
        board.removeObject(a);

        expect(board.objectsList).toContain(late);
        expect(consistent(board)).toBeTrue();
    });

    it("removing a polyhedron keeps the view and later elements", function () {
        var view = board.create("view3d", [[-6, -3], [8, 8], [[-5, 5], [-5, 5], [-5, 5]]]),
            sliders = board.objectsList.filter(function (o) {
                return o.elType === "slider";
            }),
            cube = view.create("polyhedron3d", [
                [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
                [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
            ]),
            late = view.create("point3d", [2, 2, 2]);

        view.removeObject(cube);

        expect(board.objectsList).toContain(view);
        expect(board.objectsList).toContain(late);
        expect(board.objectsList).toContain(late.element2D);
        sliders.forEach(function (s) {
            expect(board.objectsList).toContain(s);
        });
        expect(consistent(board)).toBeTrue();
    });
});
