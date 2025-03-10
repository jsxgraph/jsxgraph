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
describe("Test 3D transforms", function () {
    var board,
        target;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 1000px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-2, 7, 14, -1],
        showCopyright: false,
        showNavigation: false
    });

    var bound = [-5, 5];
    var view = board.create('view3d',
        [[-6, -2], [8, 8],
        [bound, bound, bound]],
        {
            projection: 'parallel',
            depthOrder: {
                enabled: true
            },
            az: {
                keyboard: {
                    enabled: true
                }
            },
            xPlaneRear: { visible: false },
            yPlaneRear: { visible: false }
        });

    it("Test point3d apply transformation", function () {
            var A = view.create('point3d', [-1, 2, 0]);
            var t1 = view.create('transform3d', [0, 0, 1], { type: 'translate' });
            var B = view.create('point3d', function () {
                return t1.apply(A);
            }, {});
            expect(B.coords[0]).toEqual(1);
            expect(B.coords[1]).toEqual(-1);
            expect(B.coords[2]).toEqual(2);
            expect(B.coords[3]).toEqual(1);
    });

    it("Test point3d addTransform", function () {
        var A = view.create('point3d', [-1, 2, 0]);
        var t1 = view.create('transform3d', [0, 0, 1], { type: 'translate' });
        var B = view.create('point3d', [-1, 2, 0], {});
        B.addTransform(A, [t1]);
        board.update();

        expect(B.coords[0]).toEqual(1);
        expect(B.coords[1]).toEqual(-1);
        expect(B.coords[2]).toEqual(2);
        expect(B.coords[3]).toEqual(1);
    });

    it("Test point3d transform 1", function () {
        var A = view.create('point3d', [-1, 2, 0]);
        var t1 = view.create('transform3d', [0, 0, 4], { type: 'translate' });
        var B = view.create('point3d', [-1, 2, 0], {});
        B.addTransform(A, [t1]);
        board.update();

        expect(B.X()).toEqual(-1);
        expect(B.Y()).toEqual(2);
        expect(B.Z()).toEqual(4);
    });


});
