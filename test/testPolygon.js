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
describe("Test polygons", function () {
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
        boundingbox: [-10, 10, 10, -10],
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

    it("polygon insertPoints", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.insertPoints(2, [0, 7]);
        expect(po.vertices[3].coords.usrCoords).toEqual([1, 0, 7]);
    });

    it("polygon insertPoints front", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.insertPoints(-1, [0, 7]);
        expect(po.vertices[0].coords.usrCoords).toEqual([1, 0, 7]);
    });

    it("polygon removePoints", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(1);
        expect(po.vertices[1].coords.usrCoords).toEqual([1, 1, 6]);
    });

    it("polygon removePoints last", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(2);
        expect(po.vertices[1].coords.usrCoords).toEqual([1, 4, 2]);
    });

    it("polygon multiple removePoints", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6],
            [2, 7],
            [3, 7],
            [4, 1],
            [3, 1]
        ]);
        po.removePoints(1, 2, 3);
        expect(po.vertices[3].coords.usrCoords).toEqual([1, 3, 1]);
    });

    it("polygonalchain insertPoints", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.insertPoints(2, [0, 7]);
        expect(po.vertices[3].coords.usrCoords).toEqual([1, 0, 7]);
    });

    it("polygonalchain insertPoints front", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.insertPoints(-1, [0, 7]);
        expect(po.vertices[0].coords.usrCoords).toEqual([1, 0, 7]);
    });

    it("polygonalchain removePoints", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(1);
        expect(po.vertices[1].coords.usrCoords).toEqual([1, 1, 6]);
    });

    it("polygonalchain removePoints last", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(2);
        expect(po.vertices[1].coords.usrCoords).toEqual([1, 4, 2]);
    });

    it("polygonalchain multiple removePoints", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6],
            [2, 7],
            [3, 7],
            [4, 1],
            [3, 1]
        ]);
        po.removePoints(1, 2, 3);
        expect(po.vertices[3].coords.usrCoords).toEqual([1, 3, 1]);
    });

    it("polygon removePoints 2", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(0, 1);
        expect(po.vertices.length).toEqual(1);
        expect(po.borders.length).toEqual(0);
    });

    it("polygonalchain removePoints 2", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(0, 1);
        expect(po.vertices.length).toEqual(1);
        expect(po.borders.length).toEqual(0);
    });

    it("polygon removePoints 3", function () {
        var po = board.create("polygon", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(0, 1, 2);
        expect(po.vertices.length).toEqual(0);
        expect(po.borders.length).toEqual(0);
    });

    it("polygonalchain removePoints 3", function () {
        var po = board.create("polygonalchain", [
            [-1, 2],
            [4, 2],
            [1, 6]
        ]);
        po.removePoints(0, 1, 2);
        expect(po.vertices.length).toEqual(0);
        expect(po.borders.length).toEqual(0);
    });

    it("remove slopetriangle", function () {
        var f = board.jc.snippet('sin(x)', true, 'x');
        var graph = board.create('functiongraph', [f]);

        // Glider on curve
        var p = board.create('glider', [1, 0, graph]);
        // Tangent in P
        var t = board.create('tangent', [p]);
        // Slope triangle in P
        var st = board.create('slopetriangle', [t]);

        JXG.JSXGraph.freeBoard(board);
        board = JXG.JSXGraph.initBoard("jxgbox", {
            renderer: "svg",
            axis: false,
            grid: false,
            boundingbox: [-10, 10, 10, -10],
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
    });
});
