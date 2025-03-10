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
describe("Test board events", function () {
    var board,
        target,
        pointerId = 0;

    // 1 user unit = 100px
    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById("jxgbox");

    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: false,
        grid: false,
        boundingbox: [0, 5, 5, 0],
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

    it("Test custom event", function () {
        var spy, event;
        spy = jasmine.createSpy("xyzevent");

        document.addEventListener("xyzevent", function () {
            spy();
        });
        event = new CustomEvent("xyzevent", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.dispatchEvent(event);

        expect(spy).toHaveBeenCalled();
    });

    it("Test board position", function () {
        var board_pos = board.getCoordsTopLeftCorner();
        expect(board_pos).toEqual([0, 0]);
    });

    it("Test pointer handlers", function () {
        expect(JXG.supportsPointerEvents()).toBeTrue();
        expect(board.hasPointerHandlers).toBeTrue();
    });

    it("Test dragging by pointer handlers", function () {
        var p, evt;

        pointerId++;

        p = board.create("point", [0, 0]);

        evt = new PointerEvent("pointerdown", {
            pointerId: pointerId,
            clientX: 1,
            clientY: 495
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent("pointermove", {
            pointerId: pointerId,
            clientX: 201,
            clientY: 495
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);

        expect([p.X(), p.Y()]).toEqual([2, 0]);
    });

    it("Test snapToGrid", function () {
        var p, evt;

        pointerId++;
        p = board.create("point", [0, 0], { snapToGrid: true });

        evt = new PointerEvent("pointerdown", {
            pointerId: pointerId,
            clientX: 1,
            clientY: 499
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent("pointermove", {
            pointerId: pointerId,
            clientX: 131,
            clientY: 280
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);

        expect([p.X(), p.Y()]).toEqual([1, 2]);
    });

    // if (evt.keyCode === 38) {           // up
    // } else if (evt.keyCode === 40) {    // down
    // } else if (evt.keyCode === 37) {    // left
    // } else if (evt.keyCode === 39) {    // right
    // // } else if (evt.keyCode === 9) {  // tab
    // } else if (doZoom && evt.key === '+') {   // +
    // } else if (doZoom && evt.key === '-') {   // -
    // } else if (doZoom && evt.key === 'o') {    // o
    // }
    it("Test keyboard events", function () {
        var p, evt;

        expect(board.hasKeyboardHandlers).toBeTrue();

        p = board.create("point", [0, 0], { id: "p1" });
        evt = {
            target: {
                id: p.rendNode.id
            },
            keyCode: 38,
            key: ""
        };
        board.keyDownListener(evt);
        board.keyDownListener(evt);
        expect(p.Y()).toBeCloseTo(0.4, 15);

        p.setAttribute({ snapToGrid: true });
        board.keyDownListener(evt);
        expect(p.Y()).toBeCloseTo(1, 15);
    });

    it("Test keyboard / snapToGrid", function () {
        var p, evt;

        expect(board.hasKeyboardHandlers).toBeTrue();

        p = board.create("point", [0, 0], { id: "p1" });
        evt = {
            target: {
                id: p.rendNode.id
            },
            keyCode: 38,
            key: ""
        };

        board.keyDownListener(evt);
        board.keyDownListener(evt);
        expect(p.Y()).toBeCloseTo(0.4, 15);

        p.setAttribute({ snapToGrid: true, snapSizeX: 1, snapSizeX: 1 });
        board.keyDownListener(evt);
        expect(p.Y()).toBeCloseTo(1, 15);

        p.setAttribute({
            snapToGrid: false,
            attractToGrid: true,
            attractorDistance: 0.27,
            attractorunit: "user"
        });
        board.keyDownListener(evt);
        board.keyDownListener(evt);
        board.keyDownListener(evt);

        expect(p.Y()).toBeCloseTo(2, 15);
    });
});
