/*
    Copyright 2008-2026
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
describe("Test ticks", function () {
    var board,
        target,
        pointerId = 0;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        boundingbox: [-4, 4, 4, -4],
        axis: true,
        resize: {enabled: false},
        defaultAxes: {
            x: {
                ticks: {
                    minorTicks: 7,
                    ticksPerLabel: 4,
                    minorHeight: 20
                }
            },
            y: {
                ticks: {
                    minorTicks: 3,
                    ticksPerLabel: 2,
                    minorHeight: 20
                }
            }
        }
    });

    it("Test ticksPerLabel", function () {
        expect(board.defaultAxes.x.ticks[0].labels[0].plaintext).toEqual("0.5");
        expect(board.defaultAxes.x.ticks[0].labels[1].plaintext).toEqual("1");
    });

    it("Test minTicksDistance when the minimal distance is a power of ten", function () {
        var brd, ticks, delta, div;

        div = document.createElement("div");
        div.id = "jxgbox_ticks_pow10";
        div.style.width = "500px";
        div.style.height = "500px";
        document.body.appendChild(div);

        // 0.25 px per unit, minTicksDistance 50 px and 4 minor ticks:
        // the major tick distance has to be at least 50 / 0.25 * 5 = 1000 units.
        brd = JXG.JSXGraph.initBoard("jxgbox_ticks_pow10", {
            boundingbox: [-1000, 1000, 1000, -1000],
            axis: true,
            resize: {enabled: false},
            defaultAxes: {
                x: {ticks: {minTicksDistance: 50, minorTicks: 4}}
            }
        });
        ticks = brd.defaultAxes.x.ticks[0];
        delta = ticks.getDistanceMajorTicks();
        expect(delta).toBeGreaterThanOrEqual(1000);
        expect(delta * brd.unitX / (ticks.evalVisProp('minorticks') + 1)).toBeGreaterThanOrEqual(50);
        JXG.JSXGraph.freeBoard(brd);
        document.body.removeChild(div);
    });

    it("showElement shows ticks hidden by hideElement", function () {
        var brd, ticks, div;

        div = document.createElement("div");
        div.id = "jxgbox_ticks_show";
        div.style.width = "500px";
        div.style.height = "500px";
        document.body.appendChild(div);

        brd = JXG.JSXGraph.initBoard("jxgbox_ticks_show", {
            boundingbox: [-4, 4, 4, -4],
            axis: true,
            resize: {enabled: false},
            defaultAxes: {
                x: {ticks: {drawLabels: false}}
            }
        });
        ticks = brd.defaultAxes.x.ticks[0];

        ticks.hideElement();
        expect(ticks.rendNode.getAttribute("display")).toEqual("none");

        ticks.showElement();
        expect(ticks.visPropCalc.visible).toBe(true);
        expect(ticks.rendNode.getAttribute("display")).toEqual("inline");
        expect(ticks.rendNode.style.visibility).toEqual("inherit");
        JXG.JSXGraph.freeBoard(brd);
        document.body.removeChild(div);
    });
});
