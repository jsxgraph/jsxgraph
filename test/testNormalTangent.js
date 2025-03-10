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
describe("Test normals and tangents", function () {
    var board,
        target,
        pointerId = 0;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 1000px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-2, 7, 14, -1],
        resize: { enabled: false },
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

    it("Test tangent functiongraph", function () {
        var f, A, li;
        f = board.create("functiongraph", ["3*x^2"]);

        A = board.create("glider", [-1, 3, f]);
        li = board.create('tangent', [A]);

        expect(li.stdform[0]).toBeCloseTo(0.4931969619151345, 12);
        expect(li.stdform[1]).toBeCloseTo(0.9863939238320943, 12);
        expect(li.stdform[2]).toBeCloseTo(0.16439898730565353, 12);
    });

    it("Test tangent transformed functiongraph", function () {
        var f, A, li;
        f = board.create("functiongraph", ["3*x^2"]);

        t = board.create('transform', [2, 0], { type: 'translate' });
        f_t = board.create("curve", [f, t], { id: 'f_t', strokeColor: 'red' });
        A = board.create("glider", [3, 3, f_t]);
        li = board.create('tangent', [A]);

        expect(li.stdform[0]).toBeCloseTo(2.465984809579323, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.9863939238320947, 12);
        expect(li.stdform[2]).toBeCloseTo(0.1643989873056509, 12);
    });

    it("Test tangent 2-fold transformed functiongraph", function () {
        var g, f, A, li;
        g = board.create("line", [[5, 0], [5, 4]]);
        f = board.create("functiongraph", ["3*x^2"]);

        t = board.create('transform', [2, 0], { type: 'translate' });
        f_t = board.create("curve", [f, t], { id: 'f_t', strokeColor: 'red' });

        f_re = board.create("reflection", [f_t, g]);
        A = board.create("glider", [7, 3, f_re]);
        li = board.create('tangent', [A]);
        // console.log(li.stdform)
        expect(li.stdform[0]).toBeCloseTo(-7.397954428741626, 12);
        expect(li.stdform[1]).toBeCloseTo(0.9863939238320936, 12);
        expect(li.stdform[2]).toBeCloseTo(0.1643989873056587, 12);
    });

    it("Test normal functiongraph", function () {
        var f, A, li;
        f = board.create("functiongraph", ["3*x^2"]);

        A = board.create("glider", [-1, 3, f]);
        li = board.create('normal', [A]);

        expect(li.stdform[0]).toBeCloseTo(-3.1235807588019355, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.1643989873056508, 12);
        expect(li.stdform[2]).toBeCloseTo(0.9863939238320949, 12);
    });

    it("Test normal transformed functiongraph", function () {
        var f, A, li;
        f = board.create("functiongraph", ["3*x^2"]);

        t = board.create('transform', [2, 0], { type: 'translate' });
        f_t = board.create("curve", [f, t], { id: 'f_t', strokeColor: 'red' });
        A = board.create("glider", [3, 3, f_t]);
        li = board.create('normal', [A]);

        expect(li.stdform[0]).toBeCloseTo(3.452378733413243, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.16439898730565353, 12);
        expect(li.stdform[2]).toBeCloseTo(-0.9863939238320943, 12);
    });

    it("Test normal 2-fold transformed functiongraph", function () {
        var g, f, A, li;
        g = board.create("line", [[5, 0], [5, 4]]);
        f = board.create("functiongraph", ["3*x^2"]);

        t = board.create('transform', [2, 0], { type: 'translate' });
        f_t = board.create("curve", [f, t], { id: 'f_t', strokeColor: 'red' });

        f_re = board.create("reflection", [f_t, g]);
        A = board.create("glider", [7, 3, f_re]);
        li = board.create('normal', [A]);

        expect(li.stdform[0]).toBeCloseTo(1.8083888603567095, 12);
        expect(li.stdform[1]).toBeCloseTo(0.1643989873056522, 12);
        expect(li.stdform[2]).toBeCloseTo(-0.9863939238320946, 12);
    });

    it("Test tangent plot", function () {
        var plot, A, li;
        plot = board.create('curve', [[4, 6, 8, 10], [5, 1, 4, 1]]);

        A = board.create("glider", [5, 3, plot]);
        li = board.create('tangent', [A]);

        expect(li.stdform[0]).toBeCloseTo(-5.813776741499448, 12);
        expect(li.stdform[1]).toBeCloseTo(0.8944271909999167, 12);
        expect(li.stdform[2]).toBeCloseTo(0.4472135954999564, 12);
    });

    it("Test tangent transformed plot", function () {
        var plot, A, t, f_t, li;
        plot = board.create('curve', [[4, 6, 8, 10], [5, 1, 4, 1]]);

        t = board.create('transform', [0, 2], { type: 'translate' });
        f_t = board.create("curve", [plot, t]);

        A = board.create("glider", [5, 5, f_t]);
        li = board.create('tangent', [A]);

        expect(li.stdform[0]).toBeCloseTo(-6.708203932504331, 12);
        expect(li.stdform[1]).toBeCloseTo(0.8944271909989229, 12);
        expect(li.stdform[2]).toBeCloseTo(0.447213595501944, 12);
    });

    it("Test normal plot", function () {
        var plot, A, li;
        plot = board.create('curve', [[4, 6, 8, 10], [5, 1, 4, 1]]);
        A = board.create("glider", [5, 3, plot]);
        li = board.create('normal', [A]);

        expect(li.stdform[0]).toBeCloseTo(-0.447213595499958, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.447213595499958, 12);
        expect(li.stdform[2]).toBeCloseTo(0.894427190999916, 12);
    });

    it("Test normal transformed plot", function () {
        var plot, A, t, f_t, li;
        plot = board.create('curve', [[4, 6, 8, 10], [5, 1, 4, 1]]);
        t = board.create('transform', [0, 2], { type: 'translate' });
        f_t = board.create("curve", [plot, t]);
        A = board.create("glider", [5, 5, f_t]);
        li = board.create('normal', [A]);

        expect(li.stdform[0]).toBeCloseTo(-2.2360679774848955, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.4472135955019436, 12);
        expect(li.stdform[2]).toBeCloseTo(0.8944271909989231, 12);
    });

    it("Test tangent on arc", function () {
        var sec, A, li;
        sec = board.create('arc', [[0, 0], [2, 0], [-2, 0]]);
        A = board.create("glider", [1, 1.8, sec]);
        li = board.create('tangent', [A, sec]);

        expect(li.stdform[0]).toBeCloseTo(1.999999532565313, 12);
        expect(li.stdform[1]).toBeCloseTo(-0.4850451634143187, 12);
        expect(li.stdform[2]).toBeCloseTo(-0.8744891019608976, 12);
    });

    it("Test normal on arc", function () {
        var sec, A, li;
        sec = board.create('arc', [[0, 0], [2, 0], [-2, 0]]);
        A = board.create("glider", [1, 1.8, sec]);
        li = board.create('normal', [A, sec]);

        expect(li.stdform[0]).toBeCloseTo(-0.001367383827745705, 12);
        expect(li.stdform[1]).toBeCloseTo(0.8744891019608976, 12);
        expect(li.stdform[2]).toBeCloseTo(-0.4850451634143187, 12);
    });

});
