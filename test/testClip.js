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
        boundingbox: [-5, 5, 5, -5],
        resize: {enabled: false},
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

    // ---------------
    // INTERSECTION
    // ---------------

    it("intersection 1", function () {
        var clip_type = "intersection",
            correct = [
                [-1, 3],
                [1, 3],
                [1.5, 1.5],
                [1, 1],
                [-1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-1, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 2", function () {
        var clip_type = "intersection",
            correct = [
                [1, 3],
                [2, 3],
                [2, 2],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 3", function () {
        var clip_type = "intersection",
            correct = [
                [1.5, 1.5],
                [0.6666666666666666, 0.6666666666666666],
                [-2, 2],
                [-2, 3],
                [1, 3],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 4", function () {
        var clip_type = "intersection",
            correct = [
                [1.5, 1.5],
                [1, 1],
                [-2, 3],
                [1, 3],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [1, 1],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 5", function () {
        var clip_type = "intersection",
            correct = [
                [-1.75, 3],
                [-1, 3],
                [1, 3],
                [1.5, 1.5],
                [0.8888888888888888, 0.8888888888888888],
                [-1.75, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-3, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 6", function () {
        var clip_type = "intersection",
            correct = [
                [0.5, 3],
                [1, 3],
                [1.5, 1.5],
                [1.3333333333333333, 1.3333333333333333],
                [0.5, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 7", function () {
        var clip_type = "intersection",
            correct = [
                [1, 3],
                [2, 3],
                [2, 2],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 8", function () {
        var clip_type = "intersection",
            correct = [
                [1.5, 1.5],
                [0.6666666666666666, 0.6666666666666666],
                [-2, 2],
                [-1, 3],
                [1, 3],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 9", function () {
        var clip_type = "intersection",
            correct = [
                [0, 3],
                [1, 3],
                [1.5, 1.5],
                [1.2, 1.2],
                [0, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 3],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 10", function () {
        var clip_type = "intersection",
            correct = [
                [1, -1],
                [2, 0],
                [0, 0],
                [0.6, -0.2],
                [1, -1]
            ],
            i1 = board.create("curve", [
                [0, 0.6, 1.5, 2],
                [0, -0.2, -2, 0]
            ]),
            i2 = board.create(
                "curve",
                [
                    [0, 0, 2, 2],
                    [0, -2, 0, 0]
                ],
                { fillColor: JXG.palette.red, fillOpacity: 0.3 }
            ),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(i2, i1, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("intersection 11", function () {
        var clip_type = "intersection",
            correct = [
                [20.85, 6],
                [0.85, 17.45],
                [0.85, 0.9219544457292883],
                [4, 2],
                [9, 3],
                [16, 4],
                [20.85, 4.5661800227323495],
                [20.85, 6]
            ],
            clip = board.create("curve", [
                [0.85, 4, 9, 16, 20.85, 20.85, 0.85, 0.85],
                [
                    0.9219544457292883, 2, 3, 4, 4.5661800227323495, 1000000, 1000000,
                    0.9219544457292883
                ]
            ]),
            subject = board.create("polygon", [
                [0.85, -22.55],
                [20.85, -22.55],
                [20.85, 6],
                [0.85, 17.45]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(subject, clip, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    // ---------------
    // UNION
    // ---------------

    it("union 1", function () {
        var clip_type = "union",
            correct = [
                [-1, 3],
                [-2.000001059859342, 3.00000179590484],
                [-3, 3],
                [0, 0],
                [1, 1],
                [2, 0],
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-2.000001059859342, 3.00000179590484]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-1, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 2", function () {
        var clip_type = "union",
            correct = [
                [1, 3],
                [-2.000001187834938, 3.0000018845666823],
                [-3, 3],
                [0, 0],
                [1.5, 1.5],
                [2, 0],
                [2, 2],
                [3, 3],
                [2, 3],
                [-2.000001187834938, 3.0000018845666823]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 3", function () {
        var clip_type = "union",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-2, 3],
                [-3, 3],
                [-2, 2],
                [0, 0],
                [0.6666666666666666, 0.6666666666666666],
                [2, 0],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 4", function () {
        var clip_type = "union",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-2, 3],
                [-3, 3],
                [0, 0],
                [1, 1],
                [2, 0],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [1, 1],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 5", function () {
        var clip_type = "union",
            correct = [
                [-1.75, 3],
                [-3, 3],
                [0, 0],
                [0.8888888888888888, 0.8888888888888888],
                [2, 0],
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-1, 3],
                [-3, 4],
                [-1.75, 3],
                [NaN, NaN],
                [-1, 3],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-3, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 6", function () {
        var clip_type = "union",
            correct = [
                [0.5, 3],
                [-1, 3],
                [-3, 3],
                [0, 0],
                [1.3333333333333333, 1.3333333333333333],
                [2, 0],
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-1, 3],
                [0, 4],
                [0.5, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 7", function () {
        var clip_type = "union",
            correct = [
                [1, 3],
                [-1, 3],
                [-3, 3],
                [0, 0],
                [1.5, 1.5],
                [2, 0],
                [2, 2],
                [3, 3],
                [2, 3],
                [2, 4],
                [-1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 8", function () {
        var clip_type = "union",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-1, 3],
                [-3, 3],
                [-2, 2],
                [0, 0],
                [0.6666666666666666, 0.6666666666666666],
                [2, 0],
                [1.5, 1.5]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("union 9", function () {
        var clip_type = "union",
            correct = [
                [0, 3],
                [-1.0000000247270524, 3.000001794710883],
                [-3, 3],
                [0, 0],
                [1.2, 1.2],
                [2, 0],
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [-1.0000000247270524, 3.000001794710883]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 3],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    // ---------------
    // DIFFERENCE
    // ---------------

    it("difference 1", function () {
        var clip_type = "difference",
            correct = [
                [-1, 3],
                [-2.0000013239561505, 3.000001608661756],
                [-3, 3],
                [0, 0],
                [1, 1],
                [-1, 3],
                [NaN, NaN],
                [1, 3],
                [3, 3],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-1, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 2", function () {
        var clip_type = "difference",
            correct = [
                [1, 3],
                [-2.0000006252977034, 3.0000012500137476],
                [-3, 3],
                [0, 0],
                [1.5, 1.5],
                [1, 3],
                [NaN, NaN],
                [2, 3],
                [3, 3],
                [2, 2],
                [2, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 3],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 3", function () {
        var clip_type = "difference",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [1.5, 1.5],
                [NaN, NaN],
                [0.6666666666666666, 0.6666666666666666],
                [0, 0],
                [-2, 2],
                [-3, 3],
                [-2, 3],
                [-2, 2],
                [0.6666666666666666, 0.6666666666666666]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 4", function () {
        var clip_type = "difference",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [1.5, 1.5],
                [NaN, NaN],
                [1, 1],
                [0, 0],
                [-3, 3],
                [-2, 3],
                [1, 1]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [1, 1],
                [2, 0],
                [1, 3],
                [-2, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 5", function () {
        var clip_type = "difference",
            correct = [
                [-1.75, 3],
                [-3, 3],
                [0, 0],
                [0.8888888888888888, 0.8888888888888888],
                [-1.75, 3],
                [NaN, NaN],
                [-1, 3],
                [1, 3],
                [3, 3],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-3, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 6", function () {
        var clip_type = "difference",
            correct = [
                [0.5, 3],
                [-1, 3],
                [-3, 3],
                [0, 0],
                [1.3333333333333333, 1.3333333333333333],
                [0.5, 3],
                [NaN, NaN],
                [1, 3],
                [3, 3],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 7", function () {
        var clip_type = "difference",
            correct = [
                [1, 3],
                [-1, 3],
                [-3, 3],
                [0, 0],
                [1.5, 1.5],
                [1, 3],
                [NaN, NaN],
                [2, 3],
                [3, 3],
                [2, 2],
                [2, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [2, 4],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 8", function () {
        var clip_type = "difference",
            correct = [
                [1.5, 1.5],
                [3, 3],
                [1, 3],
                [1.5, 1.5],
                [NaN, NaN],
                [0.6666666666666666, 0.6666666666666666],
                [0, 0],
                [-2, 2],
                [-3, 3],
                [-1, 3],
                [-2, 2],
                [0.6666666666666666, 0.6666666666666666]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [-2, 2],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 9", function () {
        var clip_type = "difference",
            correct = [
                [0, 3],
                [-1.0000004220676957, 3.0000022397579995],
                [-3, 3],
                [0, 0],
                [1.2, 1.2],
                [0, 3],
                [NaN, NaN],
                [1, 3],
                [3, 3],
                [1.5, 1.5],
                [1, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create("polygon", [
                [0, 3],
                [2, 0],
                [1, 3],
                [-1, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 10 (empty path)", function () {
        var clip_type = "difference",
            correct = [
                [-3, 3],
                [3, 3],
                [0, 0],
                [-3, 3]
            ],
            curve1 = board.create("curve", [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, [], clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });

    it("difference 11", function () {
        var clip_type = "difference",
            correct = [
                [-4, 4],
                [4, 4],
                [0, -1],
                [-4, 4],
                [NaN, NaN],
                [-1, 1],
                [1, 1],
                [0, 3],
                [-1, 1]
            ],
            curve1 = board.create("curve", [
                [-4, 4, 0, -4],
                [4, 4, -1, 4]
            ]),
            curve2 = board.create("curve", [
                [-1, 1, 0, -1],
                [1, 1, 3, 1]
            ]),
            clip_path = board.create("curve", [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });
});
