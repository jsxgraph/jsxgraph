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
describe("Test otherintersection functions", function () {
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

    it("Other intersection circle-circle", function () {

        var c1 = board.create('circle', [[0, 0], 3]);
        var c2 = board.create('circle', [[2, 2], 3]);

        var p1 = board.create('intersection', [c1, c2, 0]);
        var p2 = board.create('otherintersection', [c1, c2, p1]);

        expect(p2.X()).toBeCloseTo(-0.8708286933869704, 3);
        expect(p2.Y()).toBeCloseTo(2.870828693386971, 3);
    });

    it("Other intersection circle-line", function () {

        var c1 = board.create('circle', [[0, 0], 3]);
        var l1 = board.create('line', [[-4, -4], [4, 4]], { point1: { visible: true }, point2: { visible: true } });

        var p1 = board.create('intersection', [c1, l1, 0]);
        var p2 = board.create('otherintersection', [l1, c1, p1]);

        expect(p2.X()).toBeCloseTo(-2.1213203435596424, 3);
        expect(p2.Y()).toBeCloseTo(-2.1213203435596424, 3);
    });


    it("Other intersection conic-line", function () {

        var f1 = board.create('point', [1, 0], { name: 'f_1' });
        var f2 = board.create('point', [-1, 0], { name: 'f_2' });
        var A = board.create('point', [0, 1], { name: 'A' });

        var P = board.create('point', [0, 5], { name: 'P', color: 'blue', size: 7 });
        var outer = board.create('ellipse', [[-3, -3], [3, 3], P], { id: 'conic' });

        var c1 = board.create('circle', [f1, () => (f1.Dist(A) + f2.Dist(A))], { strokeColor: '#bbb', dash: 2 });
        var c2 = board.create('circle', [P, f2], { strokeColor: '#bbb', dash: 2 });

        var M1 = board.create('intersection', [c1, c2], { name: 'M1', size: 2 });
        var l1 = board.create('line', [f2, M1], { strokeWidth: 1, dash: 3, visible: false });
        var a1 = board.create('midpoint', [f2, M1], { size: 2, name: '' });
        var t1 = board.create('perpendicular', [l1, a1], { id: 'line' });

        var p2 = board.create('otherintersection', [outer, t1, P], { name: 'Q_1', color: 'black', size: 7 });

        expect(p2.X()).toBeCloseTo(2.4855495822974785, 4);
        expect(p2.Y()).toBeCloseTo(-3.61018408524214, 4);
    });

    it("Other intersection curve-line", function () {

        var curve = board.create('implicitcurve', ['-(y**2) + x**3 - 2 * x + 1'], { strokeWidth: 2 });
        var A = board.create('glider', [-1.5, 1, curve]);
        // var A = board.create('glider', [0.37396780454687994, 0.5499649305598868, curve]);
        var B = board.create('glider', [0.4367895281858512, 0.4571951924120887, curve]);
        var line = board.create('line', [A, B], { color: 'black', strokeWidth: 1 });
        var C = board.create('otherintersection', [curve, line, [A, B]], { precision: 0.01 });

        expect(C.X()).toBeCloseTo(1.0674492869432997, 3);
        expect(C.Y()).toBeCloseTo(0.2845868237650837, 3);
    });

    it("Other intersection curve-curve", function () {

        var c1 = board.create('functiongraph', ['x**2 - 3'], { strokeWidth: 2 });
        var A = board.create('point', [0, 2]);
        var c2 = board.create('functiongraph', [(x) => -(x ** 2) + 2 * A.X() * x + A.Y() - A.X() ** 2], { strokeWidth: 2 });
        var p1 = board.create('intersection', [c1, c2]);
        var p2 = board.create('otherintersection', [c1, c2, [p1]]);

        expect(p2.X()).toBeCloseTo(1.581128231095678, 4);
        expect(p2.Y()).toBeCloseTo(-0.5, 4);
    });

});
