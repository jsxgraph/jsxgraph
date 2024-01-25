/*
    Copyright 2008-2023
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
describe("Test geometry functions", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-8, 8, 8, -8],
        showCopyright: false,
        showNavigation: false
    });

    it("affineRatio Coords", function () {
        var a = new JXG.Coords(JXG.COORDS_BY_USER, [1, 0, 0], board),
            b = new JXG.Coords(JXG.COORDS_BY_USER, [1, 1, 0], board),
            c = new JXG.Coords(JXG.COORDS_BY_USER, [1, 3, 0], board);

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("affineRatio Array", function () {
        var a = [1, 0, 0],
            b = [1, 1, 0],
            c = [1, 3, 0];

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("meetSegmentSegment", function () {
        var res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, 2],
            [1, -1, 2]
        );

        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [2, 2, 4],
            [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, 2],
            [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);
    });

    it("meetPathPath", function () {
        var pol1, pol2, p;

        pol1 = board.create("polygon", [
            [1, 1],
            [2, 0],
            [1, 2],
            [-1, 1]
        ]);
        pol2 = board.create("polygon", [
            [1, 1.5],
            [2, 2],
            [0, 3],
            [0, 0.5]
        ]);
        p = board.create("intersection", [pol1, pol2, 3]);
        expect([p.X(), p.Y()]).toEqual([0.5, 1]);
    });

    it("meetPolygonLine", function () {
        var pol1, li, p;

        pol1 = board.create("polygon", [
            [1, 1],
            [2, 0],
            [1, 2],
            [-1, 1]
        ]);
        li = board.create("line", [
            [-2, 2],
            [4, -2]
        ]);
        p = board.create("intersection", [pol1, li, 0]);

        expect(p.X()).toBeCloseTo(-0.7142857142857143, 7);
        expect(p.Y()).toBeCloseTo(1.1428571428571428, 7);
    });

    it("bisectorParallels", function () {
        var li1, li2,

        li1 = board.create('line', [[0, -5], [-4, 2]]);
        li2 = board.create('parallel', [[2, 1], li1]);

        // First bisector
        g1 =  board.create('glider', [-156972, 19333, li1]);
        g2 =  board.create('glider', [-156972, 19333, li2]);
        i1 = board.create('intersection', [li1, li2]);
        a1 = board.create('bisector', [g1, i1, g2]);

        // Second bisector
        g3 =  board.create('glider', [-186972, 19333, li1]);
        g4 =  board.create('glider', [-186972, 19333, a1]);
        i2 = board.create('intersection', [li1, a1]);
        // a2 = board.create('bisector', [g3, i2, g4]);

        expect(i2.Z()).toEqual(0);
        expect(i2.X()).toBeCloseTo(-1.169230769228601, 10);
        expect(i2.Y()).toBeCloseTo(2.046153846150052, 10);
    });

    it("distPointSegment", function () {
        var d;

        d = JXG.Math.Geometry.distPointSegment([1, 2, 1], [1, -1, 0], [1,  1, 0]);
        expect(d).toBeCloseTo(1.4142135623730951, 10);

        d = JXG.Math.Geometry.distPointSegment([1, 1, 1], [1, 1, 0], [1,  1, 0]);
        expect(d).toBeCloseTo(1.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, 0, 1], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(1.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, -1, 0], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(0.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, -1, 1], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(1.0, 10);

    });


});
