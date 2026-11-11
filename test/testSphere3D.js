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

describe("Test parallel sphere silhouette", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 640px; height: 640px;"></div>';

    beforeEach(function () {
        board = JXG.JSXGraph.initBoard("jxgbox", {
            renderer: "svg",
            axis: false,
            grid: false,
            boundingbox: [-8, 8, 8, -8],
            keepAspectRatio: true,
            showCopyright: false,
            showNavigation: false
        });
    });

    afterEach(function () {
        JXG.JSXGraph.freeBoard(board);
    });

    function ellipseRadius(sphere) {
        var a = sphere.aux2D[0].coords.usrCoords,
            b = sphere.aux2D[2].coords.usrCoords;

        return Math.hypot(a[1] - b[1], a[2] - b[2]);
    }

    // Furthest projected sample on the sphere, over the drawn radius.
    function silhouetteRatio(view, sphere) {
        var c = sphere.center,
            R = sphere.Radius(),
            o = view.project3DTo2D([c.X(), c.Y(), c.Z()]),
            max = 0,
            i,
            j,
            theta,
            phi,
            p,
            d;

        board.fullUpdate();
        for (i = 0; i <= 12; i++) {
            theta = Math.PI * (i / 12);
            for (j = 0; j < 24; j++) {
                phi = (2 * Math.PI * j) / 24;
                p = view.project3DTo2D([
                    c.X() + R * Math.sin(theta) * Math.cos(phi),
                    c.Y() + R * Math.sin(theta) * Math.sin(phi),
                    c.Z() + R * Math.cos(theta)
                ]);
                d = Math.hypot(p[1] - o[1], p[2] - o[2]);
                if (d > max) {
                    max = d;
                }
            }
        }
        return ellipseRadius(sphere) / max;
    }

    it("matches the point projection at home and after a fitted camera", function () {
        var view = board.create("view3d", [
                [-8, -8],
                [16, 16],
                [[-5, 5], [-5, 5], [-5, 5]]
            ], {
                projection: "parallel",
                trackball: { enabled: false }
            }),
            center = view.create("point3d", [1, 1, 1], { visible: false, withLabel: false }),
            sphere = view.create("sphere3d", [center, Math.sqrt(3)]),
            home,
            fitted;

        view.freeR();
        view.setView(1, 0.3);
        home = silhouetteRatio(view, sphere);
        expect(Math.abs(home - 1)).toBeLessThan(0.02);

        view.setView(1, 0.3, 1 / 1.701);
        expect(view.getCameraDistance()).toBeGreaterThan(1.5);
        fitted = silhouetteRatio(view, sphere);
        expect(Math.abs(fitted - 1)).toBeLessThan(0.02);
    });
});
