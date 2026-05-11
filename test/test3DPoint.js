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
describe("Test 3D points", function () {
    var board,
        target;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-8, 8, 8, -8],
        showCopyright: false,
        showNavigation: false
    });

    var bound = [-5, 5];
    var view = board.create('view3d',
        [[-6, -3], [8, 8],
        [bound, bound, bound]],
        {
            projection: 'parallel',
            depthOrder: {
                enabled: true
            }
        });

    it("setPosition with homogeneous coordinates", function () {
        var p = view.create('point3d', [1, 2, 3]);

        // Set position using homogeneous coords [w, x, y, z]
        p.setPosition([1, 4, 5, 6]);
        expect(p.coords[0]).toEqual(1);
        expect(p.coords[1]).toEqual(4);
        expect(p.coords[2]).toEqual(5);
        expect(p.coords[3]).toEqual(6);
    });
});
