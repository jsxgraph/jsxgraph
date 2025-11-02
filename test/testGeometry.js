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
describe("Test geometry functions", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-8, 8, 8, -8],
        resize: {enabled: false},
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

    it("intersectingFunctiongraphs", function () {
        var f1 = board.create("functiongraph", ["(x-1)**2", -10, 10]); // The exponent 2 fails
        var f2 = board.create("functiongraph", ["0", -10, 10]);
        var inter = board.create("intersection", [f1, f2]);
        // var c = JXG.Math.Geometry.meetCurveCurve(f1, f2, 0, 0, board).usrCoords;
        console.log('intersection', inter.X())
        expect(inter.X()).toBeCloseTo(1, 2);
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

    it("Circle radius by slider", function () {
        var d, slider, circle;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]], { name: 'a'});
        circle = board.create('circle', [[-1, 0], 1], {});
        circle.setRadius('a');

        d = circle.Radius();
        expect(d).toEqual(1.0);
    });

    it("Circle radius by slider, nonnegative", function () {
        var d, slider, circle;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]], { name: 'a'});
        circle = board.create('circle', [[-1, 0], 1], {
            nonnegativeOnly: true
        });
        circle.setRadius('a');

        d = circle.Radius();
        expect(d).toEqual(0.0);
    });

    it("Segment radius by slider", function () {
        var d, slider, seg;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]]);
        var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
            point1: {visible: true},
            point2: {visible: true}
        });

        d = seg.L();
        expect(d).toEqual(1.0);
    });

    it("Segment radius by slider, nonnegative", function () {
        var d, slider, seg;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]]);
        var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
            point1: {visible: true},
            point2: {visible: true},
            nonnegativeOnly: true
        });

        d = seg.L();
        expect(d).toEqual(0.0);
    });

    it("Glider on arc", function () {
        var sector, glider;
        sector = board.create('arc', [[-1, -1], [3, 0], [-4, 0]]);
        glider = board.create('glider', [-2, 3, sector]);

        expect(glider.position).toBeCloseTo(0.6100503447261109, 10);
    });

    it("TangentTo", function () {
        var c, p, t0;
        c = board.create('circle', [[3, 0], [3, 4]]);
        p = board.create('point', [0, 6]);
        t0 = board.create('tangentto', [c, p, 0]);

        expect(t0.stdform[0]).toBeCloseTo(1.0459340771461982, 10);
        expect(t0.stdform[1]).toBeCloseTo(0.9846886409512672, 10);
        expect(t0.stdform[2]).toBeCloseTo(-0.1743223461910328, 10);
    });


});
