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

describe("Test JXG.Math.Clip", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-50, 50, 50, -50],
        showCopyright: false,
        showNavigation: false
    });

    check_points = function (curve, correct) {
        var i,
            j,
            len = curve.numberPoints,
            errmsg;

        errmsg = "";
        // console.log("path", curve.points.map(function(p) { return p.usrCoords.slice(1); }));
        // console.log("corr", correct);
        for (i = 0; i < len; i++) {
            for (j = 1; j < 2; j++) {
                if (isNaN(correct[i][j - 1])) {
                    expect(curve.points[i].usrCoords[j]).withContext(errmsg).toBeNaN(errmsg);
                } else {
                    expect(curve.points[i].usrCoords[j])
                        .withContext(errmsg)
                        .toBeCloseTo(correct[i][j - 1], 5);
                }
            }
        }
    };

    it("MetaPost fig 3", function () {
        var z0 = [0, 0],
            z1 = [60, 40],
            z2 = [40, 90],
            z3 = [10, 70],
            z4 = [30, 50];

        var controls = {
            0: { curl: 0 },
            4: { curl: 1 },
            isClosed: false
        };
        var cu = board.create('metapostspline', [[z0, z1, z2, z3, z4], controls]);
        expect(cu.X(0)).toBeCloseTo(0, 6);
        expect(cu.Y(0)).toBeCloseTo(0, 6);
        expect(cu.X(0.5)).toBeCloseTo(35.49349933499389, 6);
        expect(cu.Y(0.5)).toBeCloseTo(14.030403897836758, 6);
        expect(cu.X(1)).toBeCloseTo(60, 6);
        expect(cu.Y(1)).toBeCloseTo(40, 6);
        expect(cu.X(1.5)).toBeCloseTo(60.707894933300366, 6);
        expect(cu.Y(1.5)).toBeCloseTo(70.31715338465179, 6);
        expect(cu.X(2)).toBeCloseTo(40, 6);
        expect(cu.Y(2)).toBeCloseTo(90, 6);
        expect(cu.X(2.5)).toBeCloseTo(18.514892171497053, 6);
        expect(cu.Y(2.5)).toBeCloseTo(87.23600948851976, 6);
        expect(cu.X(3)).toBeCloseTo(10, 6);
        expect(cu.Y(3)).toBeCloseTo(70, 6);
        expect(cu.X(3.5)).toBeCloseTo(16.941099672663785, 6);
        expect(cu.Y(3.5)).toBeCloseTo(57.9183876213924, 6);
        expect(cu.X(4)).toBeCloseTo(30, 6);
        expect(cu.Y(4)).toBeCloseTo(50, 6);

    });

    it("MetaPost fig 4a", function () {
        var z0 = [0, 0],
            z1 = [60, 40],
            z2 = [40, 90],
            z3 = [10, 70],
            z4 = [30, 50];

        var controls = {
            isClosed: true
        };
        var cu = board.create('metapostspline', [[z0, z1, z2, z3, z4], controls]);

        expect(cu.X(0)).toBeCloseTo(0, 6);
        expect(cu.Y(0)).toBeCloseTo(0, 6);
        expect(cu.X(0.5)).toBeCloseTo(32.08061179355003, 6);
        expect(cu.Y(0.5)).toBeCloseTo(-11.963372199274865, 6);
        expect(cu.X(1)).toBeCloseTo(60, 6);
        expect(cu.Y(1)).toBeCloseTo(40, 6);
        expect(cu.X(1.5)).toBeCloseTo(56.45603925155585, 6);
        expect(cu.Y(1.5)).toBeCloseTo(69.32414033699762, 6);
        expect(cu.X(2)).toBeCloseTo(40, 6);
        expect(cu.Y(2)).toBeCloseTo(90, 6);
        expect(cu.X(2.5)).toBeCloseTo(16.421461277943354, 6);
        expect(cu.Y(2.5)).toBeCloseTo(88.60533655073813, 6);
        expect(cu.X(3)).toBeCloseTo(10, 6);
        expect(cu.Y(3)).toBeCloseTo(70, 6);
        expect(cu.X(3.5)).toBeCloseTo(19.90335489514253, 6);
        expect(cu.Y(3.5)).toBeCloseTo(59.944357283774025, 6);
        expect(cu.X(4)).toBeCloseTo(30, 6);
        expect(cu.Y(4)).toBeCloseTo(50, 6);

    });

    it("MetaPost fig 4b", function () {
        var z0 = [0, 0],
            z1 = [60, 40],
            z2 = [40, 90],
            z3 = [10, 70],
            z4 = [30, 50];

        var controls = {
            isClosed: true
        };
        var controls = {
            0: {
                type: 'curl',
                tension: [1000, 1],
                curl: 1
            },
            3: {
                type: 'curl',
                tension: [1, 1000],
                curl: 1
            },
            4: {
                tension: [1000, 1000]
            },
            isClosed: true
        };

        var cu = board.create('metapostspline', [[z0, z1, z2, z3, z4], controls]);
        expect(cu.X(0)).toBeCloseTo(0, 6);
        expect(cu.Y(0)).toBeCloseTo(0, 6);
        expect(cu.X(0.5)).toBeCloseTo(36.63393130135642, 6);
        expect(cu.Y(0.5)).toBeCloseTo(10.049103047965366, 6);
        expect(cu.X(1)).toBeCloseTo(60, 6);
        expect(cu.Y(1)).toBeCloseTo(40, 6);
        expect(cu.X(1.5)).toBeCloseTo(60.37976789800056, 6);
        expect(cu.Y(1.5)).toBeCloseTo(71.30363118878446, 6);
        expect(cu.X(2)).toBeCloseTo(40, 6);
        expect(cu.Y(2)).toBeCloseTo(90, 6);
        expect(cu.X(2.5)).toBeCloseTo(20.706155093390336, 6);
        expect(cu.Y(2.5)).toBeCloseTo(86.4407673599145, 6);
        expect(cu.X(3)).toBeCloseTo(10, 6);
        expect(cu.Y(3)).toBeCloseTo(70, 6);
        expect(cu.X(3.5)).toBeCloseTo(20.00220144108784, 6);
        expect(cu.Y(3.5)).toBeCloseTo(60.00220144108784, 6);
        expect(cu.X(4)).toBeCloseTo(30, 6);
        expect(cu.Y(4)).toBeCloseTo(50, 6);

        // for (t = 0; t <= 4; t += 0.5) {
        //     console.log(`expect(cu.X(${t})).toBeCloseTo(${cu.X(t)}, 6);`);
        //     console.log(`expect(cu.Y(${t})).toBeCloseTo(${cu.Y(t)}, 6);`);
        // }
    });

    it("MetaPost fig 10a", function () {
        var z0 = [0, 0],
            z1 = [20, 5],
            z2 = [40, 0];

        var dir_up = 90,
            dir_down = 270,
            dir_left = 180,
            dir_right = 0;

        var controls = {
            0: { direction: dir_up },
            1: { direction: dir_right },
            2: { direction: dir_down }
        };
        var cu = board.create('metapostspline', [[z0, z1, z2], controls]);

        expect(cu.X(0)).toBeCloseTo(0, 6);
        expect(cu.Y(0)).toBeCloseTo(0, 6);
        expect(cu.X(0.5)).toBeCloseTo(6.682166534049175, 6);
        expect(cu.Y(0.5)).toBeCloseTo(5.586740446211073, 6);
        expect(cu.X(1)).toBeCloseTo(20, 6);
        expect(cu.Y(1)).toBeCloseTo(5, 6);
        expect(cu.X(1.5)).toBeCloseTo(33.31783346595083, 6);
        expect(cu.Y(1.5)).toBeCloseTo(5.586740446211073, 6);
        expect(cu.X(2)).toBeCloseTo(40, 6);
        expect(cu.Y(2)).toBeCloseTo(0, 6);

        // for (t = 0; t <= 2; t += 0.5) {
        //     console.log(`expect(cu.X(${t})).toBeCloseTo(${cu.X(t)}, 6);`);
        //     console.log(`expect(cu.Y(${t})).toBeCloseTo(${cu.Y(t)}, 6);`);
        // }
    });

    it("MetaPost fig 11b", function () {
        var z0 = [0, 0],
            z1 = [10, 10],
            z2 = [30, 10],
            z3 = [40, 0];

        var controls = {
            1: { tension: [1, 1.3] },
            2: { tension: [1.3, 1] }
        };
        var cu = board.create('metapostspline', [[z0, z1, z2, z3], controls]);

        expect(cu.X(0)).toBeCloseTo(0, 6);
        expect(cu.Y(0)).toBeCloseTo(0, 6);
        expect(cu.X(0.5)).toBeCloseTo(4.28623269746538, 6);
        expect(cu.Y(0.5)).toBeCloseTo(5.879813776632417, 6);
        expect(cu.X(1)).toBeCloseTo(10, 6);
        expect(cu.Y(1)).toBeCloseTo(10, 6);
        expect(cu.X(1.5)).toBeCloseTo(20, 6);
        expect(cu.Y(1.5)).toBeCloseTo(11.41119741302082, 6);
        expect(cu.X(2)).toBeCloseTo(30, 6);
        expect(cu.Y(2)).toBeCloseTo(10, 6);
        expect(cu.X(2.5)).toBeCloseTo(35.71376730253462, 6);
        expect(cu.Y(2.5)).toBeCloseTo(5.879813776632417, 6);
        expect(cu.X(3)).toBeCloseTo(40, 6);
        expect(cu.Y(3)).toBeCloseTo(0, 6);

        // for (t = 0; t <= 3; t += 0.5) {
        //     console.log(`expect(cu.X(${t})).toBeCloseTo(${cu.X(t)}, 6);`);
        //     console.log(`expect(cu.Y(${t})).toBeCloseTo(${cu.Y(t)}, 6);`);
        // }
    });

});
