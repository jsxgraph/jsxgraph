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
describe("Test angles", function () {
    var board,
        target,
        pointerId = 0;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        resize: {enabled: false},
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

    it("Test bidirectional setAngle", function () {
        var A, B, C, angle, phi, evt;

        phi = Math.PI / 2;
        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        angle = board.create("angle", [A, B, C], { radius: "auto" });
        angle.setAngle(phi);
        expect(C.X()).toBeCloseTo(0, 12);
        expect(C.Y()).toBeCloseTo(3, 12);

        // Move A
        evt = new PointerEvent("pointerdown", {
            pointerId: pointerId,
            clientX: 400,
            clientY: 250
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent("pointermove", {
            pointerId: pointerId,
            clientX: 250,
            clientY: 100
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(C.X()).toBeCloseTo(-3, 12);
        expect(C.Y()).toBeCloseTo(0, 12);

        // Move C
        pointerId++;
        evt = new PointerEvent("pointerdown", {
            pointerId: pointerId,
            clientX: 100,
            clientY: 250
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent("pointermove", {
            pointerId: pointerId,
            clientX: 250,
            clientY: 100
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(A.X()).toBeCloseTo(3, 12);
        expect(A.Y()).toBeCloseTo(0, 12);
    });

    it("Test arc.Value()", function () {
        var A, B, C, arc;

        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        arc = board.create("arc", [B, A, C], {});
        expect(arc.Value()).toBeCloseTo(3 * Math.PI * 0.25, 12);
        expect(arc.Value('length')).toBeCloseTo(3 * Math.PI * 0.25, 12);
        expect(arc.Value('radians')).toBeCloseTo(Math.PI * 0.25, 12);
        expect(arc.Value('degree')).toBeCloseTo(45, 12);
        expect(arc.Value('semicircle')).toBeCloseTo(0.25, 12);
        expect(arc.Value('circle')).toBeCloseTo(0.125, 12);
        expect(arc.L()).toBeCloseTo(3 * Math.PI * 0.25, 12);
    });

    it("Test sector.Value()", function () {
        var A, B, C, sec;

        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        sec = board.create("sector", [B, A, C], {});
        expect(sec.Value()).toBeCloseTo(3 * Math.PI * 0.25, 12);
        expect(sec.Value('length')).toBeCloseTo(3 * Math.PI * 0.25, 12);
        expect(sec.Value('radians')).toBeCloseTo(Math.PI * 0.25, 12);
        expect(sec.Value('degree')).toBeCloseTo(45, 12);
        expect(sec.Value('semicircle')).toBeCloseTo(0.25, 12);
        expect(sec.Value('circle')).toBeCloseTo(0.125, 12);
        expect(sec.L()).toBeCloseTo(3 * Math.PI * 0.25, 12);
    });

    it("Test angle.Value()", function () {
        var A, B, C, ang,
            r = 0.5;

        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        ang = board.create("angle", [A, B, C], {radius: r});
        expect(ang.Value()).toBeCloseTo(Math.PI * 0.25, 12);
        expect(ang.Value('length')).toBeCloseTo(r * Math.PI * 0.25, 12);
        expect(ang.L()).toBeCloseTo(r * Math.PI * 0.25, 12);
        expect(ang.Value('radians')).toBeCloseTo(Math.PI * 0.25, 12);
        expect(ang.Value('degree')).toBeCloseTo(45, 12);
        expect(ang.Value('semicircle')).toBeCloseTo(0.25, 12);
        expect(ang.Value('circle')).toBeCloseTo(0.125, 12);
    });

    it("Test reflex angle", function () {
        var A, B, C, ang,
            r = 0.5;

        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        ang = board.create("reflexangle", [A, B, C], {radius: r});
        expect(ang.Value()).toBeCloseTo(Math.PI * (2 - 0.25), 12);
    });

    it("Test nonreflex angle", function () {
        var A, B, C, ang,
            r = 0.5;

        A = board.create("point", [3, 0]);
        B = board.create("point", [0, 0]);
        C = board.create("point", [2, 2]);

        ang = board.create("nonreflexangle", [A, B, C], {radius: r});
        expect(ang.Value()).toBeCloseTo(Math.PI * 0.25, 12);
    });
    
});
