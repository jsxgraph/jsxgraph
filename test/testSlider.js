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

describe("Test slider", function () {
    var board, slider;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "no",
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        resize: {enabled: false},
        showCopyright: false,
        showNavigation: false
    });
    slider = board.create(
        "slider",
        [
            [0, 0],
            [1, 0],
            [0, 5, 10]
        ],
        {
            id: "_glider",
            withLabel: true,
            name: "S",
            point1: {
                id: "_point1"
            },
            point2: {
                id: "_point2"
            },
            baseline: {
                id: "_baseline"
            },
            highline: {
                id: "_highline"
            },
            label: {
                id: "_label"
            }
        }
    );

    it("Create slider", function () {
        expect(slider.type).toEqual(JXG.OBJECT_TYPE_GLIDER);
        expect(slider).toBeInstanceOf(JXG.Point);
        expect(slider.elementClass).toEqual(JXG.OBJECT_CLASS_POINT);
    });

    it("Slider value", function () {
        expect(slider.Value()).toEqual(5);
    });

    it("Snapped value stays inside the range when snapWidth does not divide it", function () {
        var s = board.create(
            "slider",
            [
                [0, 1],
                [1, 1],
                [0, 0.5, 1]
            ],
            { snapWidth: 0.4 }
        );

        // the end of the slider: 1 / 0.4 = 2.5 rounds up to 3 steps, which would be 1.2
        s.setValue(1);
        expect(s.Value()).toBeCloseTo(0.8, 12);
        s.setValue(0.95);
        expect(s.Value()).toBeCloseTo(0.8, 12);
        s.setValue(0.5);
        expect(s.Value()).toBeCloseTo(0.4, 12);

        // a snapWidth that divides the range still reaches the end
        s.setAttribute({ snapWidth: 0.1 });
        s.setValue(1);
        expect(s.Value()).toBeCloseTo(1, 12);

        board.removeObject(s);
    });

    it("Slider ids", function () {
        expect(slider.id).toEqual("_glider");
        expect(slider.point1.id).toEqual("_point1");
        expect(slider.point2.id).toEqual("_point2");
        expect(slider.baseline.id).toEqual("_baseline");
        expect(slider.highline.id).toEqual("_highline");
        expect(slider.label.id).toEqual("_label");
    });
});
