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
describe("Test geometry functions", function () {
    var board;

    document.getElementsByTagName("body")[0].innerHTML =
        '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard("jxgbox", {
        renderer: "svg",
        axis: true,
        grid: false,
        // boundingbox: [-8, 8, 8, -8],
        boundingbox: [-10, 10, 10, -10],
        resize: {enabled: false},
        showCopyright: false,
        showNavigation: false
    });

    it("affineRatio Coords", function () {
        var a = new JXG.Coords(JXG.COORDS_BY_USER, [1, 0, 0], board),
            b = new JXG.Coords(JXG.COORDS_BY_USER, [1, 1, 0], board),
            c = new JXG.Coords(JXG.COORDS_BY_USER, [1, 3, 0], board);

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("affineRatio Array", function () {
        var a = [1, 0, 0],
            b = [1, 1, 0],
            c = [1, 3, 0];

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("intersectingFunctiongraphs", function () {
        var f1 = board.create("functiongraph", ["(x-1)**2", -10, 10]); // The exponent 2 fails
        var f2 = board.create("functiongraph", ["0", -10, 10]);
        var inter = board.create("intersection", [f1, f2]);
        // var c = JXG.Math.Geometry.meetCurveCurve(f1, f2, 0, 0, board).usrCoords;
        // console.log('intersection', inter.X())
        expect(inter.X()).toBeCloseTo(1, 2);
    });

    it("intersectingCurveCurve", function () {
      const f1 = board.create("functiongraph", ["sin(x)", -10, 10], { fixed: false });
      const f2 = board.create("functiongraph", ["0", -10, 10], {});

      const inter = board.create("intersection", [f1, f2, 5]);
      expect(inter.X()).toBeCloseTo(Math.PI * 2, 4);
    });

    it("intersectingCurveCurve 2", function () {
        const f1 = board.create("functiongraph", ["sin(x)"], { fixed: false }); // ["sin(x)", -10, 10] fails
        const f2 = board.create("functiongraph", ["0"], {});

        const inter = board.create("intersection", [f1, f2, 6]);
        expect(inter.X()).toBeCloseTo(Math.PI * 3, 4); // 9.42477796076938
    });

    it("intersectingCurveLine", function () {
        const f1 = board.create("functiongraph", ["(x + 1)**2 * (x - 1)**2", -10, 10], {});
        // const f2 = board.create("functiongraph", ["0", -10, 10], {});
        const f2 = board.defaultAxes.x;

        const inter1 = board.create("point", [
            () => JXG.Math.Geometry.meetCurveCurve(f1, f2, -1.5, 0, f1.board, 'newton')
        ], { name: 'A' });

        const inter2 = board.create("point", [
            () => JXG.Math.Geometry.meetCurveCurve(f1, f2, 1.5, 1, f1.board, 'newton')
        ], { name: 'B' });

        expect(inter1.X()).toBeCloseTo(-1.0116589163799947, 4);
        expect(inter2.X()).toBeCloseTo(1.0116589163799947, 4);
    });

    it("meetSegmentSegment", function () {
        var res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, 2],
            [1, -1, 2]
        );

        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [2, 2, 4],
            [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, 2],
            [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);
    });

    it("meetPathPath", function () {
        var pol1, pol2, p;

        pol1 = board.create("polygon", [
            [1, 1],
            [2, 0],
            [1, 2],
            [-1, 1]
        ]);
        pol2 = board.create("polygon", [
            [1, 1.5],
            [2, 2],
            [0, 3],
            [0, 0.5]
        ]);
        p = board.create("intersection", [pol1, pol2, 3]);
        expect([p.X(), p.Y()]).toEqual([0.5, 1]);
    });

    it("meetPolygonLine", function () {
        var pol1, li, p;

        pol1 = board.create("polygon", [
            [1, 1],
            [2, 0],
            [1, 2],
            [-1, 1]
        ]);
        li = board.create("line", [
            [-2, 2],
            [4, -2]
        ]);
        p = board.create("intersection", [pol1, li, 0]);

        expect(p.X()).toBeCloseTo(-0.7142857142857143, 7);
        expect(p.Y()).toBeCloseTo(1.1428571428571428, 7);
    });

    it("meetCircleCircle: zero-radius circle on other circle", function () {
        var c1 = board.create('circle', [[3, 0], 5]),
            c2 = board.create('circle', [[3, 5], 0]),
            res = JXG.Math.Geometry.meetCircleCircle(c1.stdform, c2.stdform, 0, board);

        // c2 has radius 0 and its center (3,5) lies on c1 (center (3,0), radius 5)
        expect(res.usrCoords[0]).toBeCloseTo(1, 10);
        expect(res.usrCoords[1]).toBeCloseTo(3, 10);
        expect(res.usrCoords[2]).toBeCloseTo(5, 10);
    });

    it("meetCircleCircle: zero-radius circle as first argument", function () {
        var c1 = board.create('circle', [[3, 5], 0]),
            c2 = board.create('circle', [[3, 0], 5]),
            res = JXG.Math.Geometry.meetCircleCircle(c1.stdform, c2.stdform, 0, board);

        // c1 has radius 0 and its center (3,5) lies on c2
        expect(res.usrCoords[0]).toBeCloseTo(1, 10);
        expect(res.usrCoords[1]).toBeCloseTo(3, 10);
        expect(res.usrCoords[2]).toBeCloseTo(5, 10);
    });

    it("meetCircleCircle: zero-radius circle NOT on other circle", function () {
        var c1 = board.create('circle', [[0, 0], 1]),
            c2 = board.create('circle', [[5, 5], 0]),
            res = JXG.Math.Geometry.meetCircleCircle(c1.stdform, c2.stdform, 0, board);

        // c2 center (5,5) is not on c1 → should return [0,0,0]
        expect(res.usrCoords[0]).toBeCloseTo(0, 10);
        expect(res.usrCoords[1]).toBeCloseTo(0, 10);
        expect(res.usrCoords[2]).toBeCloseTo(0, 10);
    });

    it("bisectorParallels", function () {
        var li1, li2,

        li1 = board.create('line', [[0, -5], [-4, 2]]);
        li2 = board.create('parallel', [[2, 1], li1]);

        // First bisector
        g1 =  board.create('glider', [-156972, 19333, li1]);
        g2 =  board.create('glider', [-156972, 19333, li2]);
        i1 = board.create('intersection', [li1, li2]);
        a1 = board.create('bisector', [g1, i1, g2]);

        // Second bisector
        g3 =  board.create('glider', [-186972, 19333, li1]);
        g4 =  board.create('glider', [-186972, 19333, a1]);
        i2 = board.create('intersection', [li1, a1]);
        // a2 = board.create('bisector', [g3, i2, g4]);

        expect(i2.Z()).toEqual(0);
        expect(i2.X()).toBeCloseTo(-1.169230769228601, 10);
        expect(i2.Y()).toBeCloseTo(2.046153846150052, 10);
    });

    it("distPointSegment", function () {
        var d;

        d = JXG.Math.Geometry.distPointSegment([1, 2, 1], [1, -1, 0], [1,  1, 0]);
        expect(d).toBeCloseTo(1.4142135623730951, 10);

        d = JXG.Math.Geometry.distPointSegment([1, 1, 1], [1, 1, 0], [1,  1, 0]);
        expect(d).toBeCloseTo(1.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, 0, 1], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(1.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, -1, 0], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(0.0, 10);

        d = JXG.Math.Geometry.distPointSegment([1, -1, 1], [1, -1, 0], [1,  2, 0]);
        expect(d).toBeCloseTo(1.0, 10);

    });

    it("Circle radius by slider", function () {
        var d, slider, circle;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]], { name: 'a'});
        circle = board.create('circle', [[-1, 0], 1], {});
        circle.setRadius('a');

        d = circle.Radius();
        expect(d).toEqual(1.0);
    });

    it("Circle radius by slider, nonnegative", function () {
        var d, slider, circle;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]], { name: 'a'});
        circle = board.create('circle', [[-1, 0], 1], {
            nonnegativeOnly: true
        });
        circle.setRadius('a');

        d = circle.Radius();
        expect(d).toEqual(0.0);
    });

    it("Segment radius by slider", function () {
        var d, slider, seg;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]]);
        var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
            point1: {visible: true},
            point2: {visible: true}
        });

        d = seg.L();
        expect(d).toEqual(1.0);
    });

    it("Segment radius by slider, nonnegative", function () {
        var d, slider, seg;

        slider = board.create('slider', [[4, -3], [4, 3], [-4, -1, 4]]);
        var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
            point1: {visible: true},
            point2: {visible: true},
            nonnegativeOnly: true
        });

        d = seg.L();
        expect(d).toEqual(0.0);
    });

    it("Glider on arc", function () {
        var sector, glider;
        sector = board.create('arc', [[-1, -1], [3, 0], [-4, 0]]);
        glider = board.create('glider', [-2, 3, sector]);

        expect(glider.position).toBeCloseTo(0.6100503447261109, 10);
    });

    it("TangentTo", function () {
        var c, p, t0;
        c = board.create('circle', [[3, 0], [3, 4]]);
        p = board.create('point', [0, 6]);
        t0 = board.create('tangentto', [c, p, 0]);

        expect(t0.stdform[0]).toBeCloseTo(1.0459340771461982, 10);
        expect(t0.stdform[1]).toBeCloseTo(0.9846886409512672, 10);
        expect(t0.stdform[2]).toBeCloseTo(-0.1743223461910328, 10);
    });

    // ---------------------------------------------------------------
    // Pure-math tests (no board required)
    // ---------------------------------------------------------------

    // --- Distance functions ---

    it("distance: 3-4-5 triangle", function () {
        expect(JXG.Math.Geometry.distance([1, 0], [4, 4], 2)).toEqual(5);
    });

    it("distance: 3D diagonal", function () {
        expect(JXG.Math.Geometry.distance([0, 0, 0], [1, 1, 1])).toBeCloseTo(Math.sqrt(3), 10);
    });

    it("distance: same point → 0", function () {
        expect(JXG.Math.Geometry.distance([3, 7], [3, 7])).toEqual(0);
    });

    it("affineDistance: normal case matches distance", function () {
        expect(JXG.Math.Geometry.affineDistance([1, 3, 0], [1, 0, 4])).toEqual(5);
    });

    it("affineDistance: ideal point returns Infinity", function () {
        expect(JXG.Math.Geometry.affineDistance([0, 1, 0], [1, 0, 0])).toEqual(Infinity);
    });

    it("affineDistance: both ideal points returns Infinity", function () {
        expect(JXG.Math.Geometry.affineDistance([0, 1, 0], [0, 0, 1])).toEqual(Infinity);
    });

    it("distPointLine: point above x-axis", function () {
        // Line y=0 in homogeneous form [C, A, B] where Ax+By+C=0 → [0, 0, 1]
        expect(JXG.Math.Geometry.distPointLine([1, 3, 5], [0, 0, 1])).toBeCloseTo(5, 10);
    });

    it("distPointLine: point on line → 0", function () {
        expect(JXG.Math.Geometry.distPointLine([1, 3, 0], [0, 0, 1])).toEqual(0);
    });

    it("distPointLine: oblique line 3x+4y-10=0", function () {
        // Line [C,A,B] = [-10, 3, 4], point (0,0) → |3*0+4*0-10|/sqrt(9+16) = 10/5 = 2
        expect(JXG.Math.Geometry.distPointLine([1, 0, 0], [-10, 3, 4])).toBeCloseTo(2, 10);
    });

    it("distPointLine: degenerate line → Infinity", function () {
        expect(JXG.Math.Geometry.distPointLine([1, 0, 0], [1, 0, 0])).toEqual(Infinity);
    });

    // --- Angle functions ---

    it("rad: right angle", function () {
        expect(JXG.Math.Geometry.rad([1, 0], [0, 0], [0, 1])).toBeCloseTo(Math.PI / 2, 10);
    });

    it("rad: straight line", function () {
        expect(JXG.Math.Geometry.rad([1, 0], [0, 0], [-1, 0])).toBeCloseTo(Math.PI, 10);
    });

    it("rad: clockwise → reflex angle near 3π/2", function () {
        // Going from (0,1) to (1,0) around origin clockwise = 3π/2 CCW
        expect(JXG.Math.Geometry.rad([0, 1], [0, 0], [1, 0])).toBeCloseTo(3 * Math.PI / 2, 10);
    });

    it("rad: result always in [0, 2π)", function () {
        var angles = [
            JXG.Math.Geometry.rad([1, 0], [0, 0], [0, 1]),
            JXG.Math.Geometry.rad([0, 1], [0, 0], [1, 0]),
            JXG.Math.Geometry.rad([1, 0], [0, 0], [-1, 0]),
            JXG.Math.Geometry.rad([-1, 0], [0, 0], [1, 0])
        ];

        for (var i = 0; i < angles.length; i++) {
            expect(angles[i]).toBeGreaterThanOrEqual(0);
            expect(angles[i]).toBeLessThan(2 * Math.PI);
        }
    });

    it("trueAngle: right angle in degrees", function () {
        expect(JXG.Math.Geometry.trueAngle([1, 0], [0, 0], [0, 1])).toBeCloseTo(90, 8);
    });

    it("trueAngle: straight line in degrees", function () {
        expect(JXG.Math.Geometry.trueAngle([1, 0], [0, 0], [-1, 0])).toBeCloseTo(180, 8);
    });

    it("calcLabelQuadrant: standard angles", function () {
        expect(JXG.Math.Geometry.calcLabelQuadrant(0)).toEqual("rt");
        expect(JXG.Math.Geometry.calcLabelQuadrant(Math.PI / 2)).toEqual("top");
        expect(JXG.Math.Geometry.calcLabelQuadrant(Math.PI)).toEqual("lft");
    });

    it("calcLabelQuadrant: negative angle", function () {
        // -π/2 → +3π/2 internally → "bot"
        expect(JXG.Math.Geometry.calcLabelQuadrant(-Math.PI / 2)).toEqual("bot");
    });

    it("calcLabelQuadrant: bottom and lower-right quadrants", function () {
        // 3π/2 (270°) → "bot", 5π/3 (300°) → "lrt"
        expect(JXG.Math.Geometry.calcLabelQuadrant(3 * Math.PI / 2)).toEqual("bot");
        expect(JXG.Math.Geometry.calcLabelQuadrant(5 * Math.PI / 3)).toEqual("lrt");
    });

    // --- Triangle / polygon orientation ---

    it("signedTriangle: CCW positive, CW negative, collinear zero", function () {
        // CCW
        expect(JXG.Math.Geometry.signedTriangle([1, 0, 0], [1, 1, 0], [1, 0, 1])).toBeCloseTo(0.5, 10);
        // CW
        expect(JXG.Math.Geometry.signedTriangle([1, 0, 1], [1, 1, 0], [1, 0, 0])).toBeCloseTo(-0.5, 10);
        // Collinear
        expect(JXG.Math.Geometry.signedTriangle([1, 0, 0], [1, 1, 1], [1, 2, 2])).toEqual(0);
    });

    it("det3p: equals 2 × signedTriangle", function () {
        var p1 = [1, 0, 0],
            p2 = [1, 1, 0],
            q = [1, 0, 1];

        expect(JXG.Math.Geometry.det3p(p1, p2, q)).toBeCloseTo(
            2 * JXG.Math.Geometry.signedTriangle(p1, p2, q), 10
        );
    });

    it("signedPolygon: unit square area ±1 by winding", function () {
        // CCW winding → positive area
        var ccw = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]];
        expect(JXG.Math.Geometry.signedPolygon(ccw, true)).toBeCloseTo(1, 10);

        // CW winding → negative area
        var cw = [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]];
        expect(JXG.Math.Geometry.signedPolygon(cw, true)).toBeCloseTo(-1, 10);
    });

    it("signedPolygon: triangle area", function () {
        // Triangle (0,0),(2,0),(0,2) → area = 2
        var tri = [[1, 0, 0], [1, 2, 0], [1, 0, 2]];
        expect(JXG.Math.Geometry.signedPolygon(tri, true)).toBeCloseTo(2, 10);
    });

    // --- Convex hull / polygon utilities ---

    it("sortVertices: sorts by angle from first point", function () {
        var input = [[1, 0, 0], [1, 1, 1], [1, 1, 0], [1, 0, 1]],
            sorted = JXG.Math.Geometry.sortVertices(input);

        // First point stays first
        expect(sorted[0]).toEqual([1, 0, 0]);
        // Then sorted by angle: (1,0) at 0°, (1,1) at 45°, (0,1) at 90°
        expect(sorted[1]).toEqual([1, 1, 0]);
        expect(sorted[2]).toEqual([1, 1, 1]);
        expect(sorted[3]).toEqual([1, 0, 1]);
    });

    it("GrahamScan: square + interior point → 4 hull points", function () {
        var pts = [[1, 0, 0], [1, 2, 0], [1, 2, 2], [1, 0, 2], [1, 1, 1]],
            hull = JXG.Math.Geometry.GrahamScan(pts);

        expect(hull.length).toEqual(4);
    });

    it("GrahamScan: triangle stays triangle", function () {
        var pts = [[1, 0, 0], [1, 3, 0], [1, 0, 4]],
            hull = JXG.Math.Geometry.GrahamScan(pts);

        expect(hull.length).toEqual(3);
    });

    it("GrahamScan: empty input → empty output", function () {
        expect(JXG.Math.Geometry.GrahamScan([]).length).toEqual(0);
    });

    it("GrahamScan: single point → 1 hull point", function () {
        var hull = JXG.Math.Geometry.GrahamScan([[1, 5, 5]]);
        expect(hull.length).toEqual(1);
    });

    it("GrahamScan: collinear points → 2 endpoints", function () {
        var hull = JXG.Math.Geometry.GrahamScan([[1, 0, 0], [1, 1, 0], [1, 2, 0]]);
        expect(hull.length).toEqual(2);
    });

    it("isConvex: convex square → true", function () {
        var sq = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]];
        expect(JXG.Math.Geometry.isConvex(sq)).toEqual(true);
    });

    it("isConvex: concave L-shape → false", function () {
        var L = [[1, 0, 0], [1, 2, 0], [1, 2, 2], [1, 1, 2], [1, 1, 1], [1, 0, 1]];
        expect(JXG.Math.Geometry.isConvex(L)).toEqual(false);
    });

    it("isConvex: triangle → true", function () {
        var tri = [[1, 0, 0], [1, 1, 0], [1, 0, 1]];
        expect(JXG.Math.Geometry.isConvex(tri)).toEqual(true);
    });

    it("isConvex: fewer than 3 points → true", function () {
        expect(JXG.Math.Geometry.isConvex([[1, 0, 0], [1, 1, 1]])).toEqual(true);
        expect(JXG.Math.Geometry.isConvex([])).toEqual(true);
    });

    // --- Projection ---

    it("projectCoordsToSegment: perpendicular foot", function () {
        var res = JXG.Math.Geometry.projectCoordsToSegment([1, 1, 1], [1, 0, 0], [1, 2, 0]);

        expect(res[0]).toEqual([1, 1, 0]);
        expect(res[1]).toBeCloseTo(0.5, 10);
    });

    it("projectCoordsToSegment: beyond endpoint (t > 1)", function () {
        var res = JXG.Math.Geometry.projectCoordsToSegment([1, 3, 0], [1, 0, 0], [1, 2, 0]);
        expect(res[1]).toBeCloseTo(1.5, 10);
    });

    it("projectCoordsToSegment: before start (t < 0)", function () {
        var res = JXG.Math.Geometry.projectCoordsToSegment([1, -1, 0], [1, 0, 0], [1, 2, 0]);
        expect(res[1]).toBeCloseTo(-0.5, 10);
    });

    it("projectCoordsToSegment: zero-length segment", function () {
        var res = JXG.Math.Geometry.projectCoordsToSegment([1, 5, 5], [1, 1, 1], [1, 1, 1]);

        expect(res[0]).toEqual([1, 1, 1]);
        expect(res[1]).toEqual(0);
    });

    it("projectCoordsToCurve: result stays within curve domain", function () {
        // functiongraph defined on [-2, 2]; project a point beyond the right boundary
        var fg = board.create('functiongraph', [function (t) { return t * t; }, -2, 2]),
            res = JXG.Math.Geometry.projectCoordsToCurve(5, 4, 2, fg, board),
            t = res[1];

        expect(t).toBeLessThanOrEqual(2);
        expect(t).toBeGreaterThanOrEqual(-2);
    });

    // --- Bezier ---

    it("bezierSegmentEval: t=0 → first control point", function () {
        var curve = [[0, 0], [1, 2], [3, 4], [5, 6]];
        var res = JXG.Math.Geometry.bezierSegmentEval(0, curve);

        expect(res[0]).toEqual(1.0);
        expect(res[1]).toBeCloseTo(0, 10);
        expect(res[2]).toBeCloseTo(0, 10);
    });

    it("bezierSegmentEval: t=1 → last control point", function () {
        var curve = [[0, 0], [1, 2], [3, 4], [5, 6]];
        var res = JXG.Math.Geometry.bezierSegmentEval(1, curve);

        expect(res[0]).toEqual(1.0);
        expect(res[1]).toBeCloseTo(5, 10);
        expect(res[2]).toBeCloseTo(6, 10);
    });

    it("bezierSegmentEval: t=0.5 on collinear points → midpoint", function () {
        var curve = [[0, 0], [1, 0], [2, 0], [3, 0]];
        var res = JXG.Math.Geometry.bezierSegmentEval(0.5, curve);

        expect(res[0]).toEqual(1.0);
        expect(res[1]).toBeCloseTo(1.5, 10);
        expect(res[2]).toBeCloseTo(0, 10);
    });

    // --- 3D plane intersection ---

    it("meet3Planes: three coordinate planes meet at origin", function () {
        var res = JXG.Math.Geometry.meet3Planes(
            [0, 0, 0, 1], 0,  // xy-plane (z=0)
            [0, 0, 1, 0], 0,  // xz-plane (y=0)
            [0, 1, 0, 0], 0   // yz-plane (x=0)
        );

        expect(res[0]).toEqual(1);
        expect(res[1]).toBeCloseTo(0, 10);
        expect(res[2]).toBeCloseTo(0, 10);
        expect(res[3]).toBeCloseTo(0, 10);
    });

    it("meet3Planes: shifted planes meet at (1,2,3)", function () {
        var res = JXG.Math.Geometry.meet3Planes(
            [0, 0, 0, 1], 3,  // z=3
            [0, 0, 1, 0], 2,  // y=2
            [0, 1, 0, 0], 1   // x=1
        );

        expect(res[0]).toEqual(1);
        expect(res[1]).toBeCloseTo(1, 10);
        expect(res[2]).toBeCloseTo(2, 10);
        expect(res[3]).toBeCloseTo(3, 10);
    });

    it("meetPlanePlane: xy- and xz-plane intersect along x-axis", function () {
        var res = JXG.Math.Geometry.meetPlanePlane(
            [0, 1, 0, 0], [0, 0, 1, 0],  // xy-plane spanned by x and y
            [0, 1, 0, 0], [0, 0, 0, 1]   // xz-plane spanned by x and z
        );

        // Direction should be along x-axis: [0, ±k, 0, 0]
        expect(res[0]).toEqual(0);
        expect(res[2]).toBeCloseTo(0, 10);
        expect(res[3]).toBeCloseTo(0, 10);
        expect(Math.abs(res[1])).toBeGreaterThan(0);
    });

});
