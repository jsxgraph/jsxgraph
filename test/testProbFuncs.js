/*
    Copyright 2008-2025
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

describe("Test JXG.Math.ProbFuncs", function () {

    // --- erf (error function) ---

    it("erf(0) = 0", function () {
        expect(JXG.Math.ProbFuncs.erf(0)).toBeCloseTo(0, 12);
    });

    it("erf(0.5)", function () {
        expect(JXG.Math.ProbFuncs.erf(0.5)).toBeCloseTo(0.520499877813047, 12);
    });

    it("erf(1)", function () {
        expect(JXG.Math.ProbFuncs.erf(1)).toBeCloseTo(0.842700792949715, 12);
    });

    it("erf(2)", function () {
        expect(JXG.Math.ProbFuncs.erf(2)).toBeCloseTo(0.995322265018953, 12);
    });

    it("erf continuity across branch boundary at |x|=1", function () {
        // erf uses polynomial for |x| <= 1, delegates to erfc for |x| > 1
        var below = JXG.Math.ProbFuncs.erf(0.9999);
        var at = JXG.Math.ProbFuncs.erf(1.0);
        var above = JXG.Math.ProbFuncs.erf(1.0001);
        expect(at).toBeCloseTo((below + above) / 2, 7);
    });

    it("erf odd symmetry: erf(-x) = -erf(x)", function () {
        expect(JXG.Math.ProbFuncs.erf(-1)).toBeCloseTo(-JXG.Math.ProbFuncs.erf(1), 12);
    });

    it("erf(6) is close to 1", function () {
        expect(JXG.Math.ProbFuncs.erf(6)).toBeCloseTo(1, 12);
    });

    // --- erfc (complementary error function) ---

    it("erfc(0) = 1", function () {
        expect(JXG.Math.ProbFuncs.erfc(0)).toBeCloseTo(1, 12);
    });

    it("erfc(1)", function () {
        expect(JXG.Math.ProbFuncs.erfc(1)).toBeCloseTo(0.157299207050285, 12);
    });

    it("erfc(-1)", function () {
        expect(JXG.Math.ProbFuncs.erfc(-1)).toBeCloseTo(1.842700792949715, 12);
    });

    it("erfc(x) + erf(x) = 1", function () {
        // At x=1.0 both erf and erfc use independent polynomials
        var values = [0.5, 1.0, 2.0, 3.0];
        values.forEach(function (x) {
            expect(JXG.Math.ProbFuncs.erfc(x) + JXG.Math.ProbFuncs.erf(x)).toBeCloseTo(1, 12);
        });
    });

    it("erfc monotonically decreasing across polynomial switch at x=8", function () {
        // erfc uses P/Q coefficients for 1 <= x < 8, R/S for x >= 8
        var v7 = JXG.Math.ProbFuncs.erfc(7);
        var v8 = JXG.Math.ProbFuncs.erfc(8);
        var v9 = JXG.Math.ProbFuncs.erfc(9);
        expect(v7).toBeGreaterThan(v8);
        expect(v8).toBeGreaterThan(v9);
        expect(v9).toBeGreaterThan(0);
    });

    it("erfc(6) is close to 0", function () {
        expect(JXG.Math.ProbFuncs.erfc(6)).toBeCloseTo(0, 12);
    });

    it("erfc underflow for large arguments does not log to console", function () {
        var originalLog = console.log;
        var logged = false;
        console.log = function () { logged = true; };
        try {
            // |a| > ~26.6 triggers the underflow path
            expect(JXG.Math.ProbFuncs.erfc(30)).toBe(0.0);
            expect(JXG.Math.ProbFuncs.erfc(-30)).toBe(2.0);
            expect(logged).toBe(false);
        } finally {
            console.log = originalLog;
        }
    });

    // --- erfi (inverse error function) ---

    it("erfi(0) = 0", function () {
        expect(JXG.Math.ProbFuncs.erfi(0)).toBeCloseTo(0, 12);
    });

    it("erfi round-trip: erfi(erf(0.5)) = 0.5", function () {
        expect(JXG.Math.ProbFuncs.erfi(JXG.Math.ProbFuncs.erf(0.5))).toBeCloseTo(0.5, 12);
    });

    it("erfi round-trip: erfi(erf(-0.3)) = -0.3", function () {
        expect(JXG.Math.ProbFuncs.erfi(JXG.Math.ProbFuncs.erf(-0.3))).toBeCloseTo(-0.3, 12);
    });

    it("erfi odd symmetry: erfi(-x) = -erfi(x)", function () {
        var x = 0.4;
        expect(JXG.Math.ProbFuncs.erfi(-x)).toBeCloseTo(-JXG.Math.ProbFuncs.erfi(x), 12);
    });

    it("erfi domain boundaries: erfi(±1) = ±Infinity", function () {
        expect(JXG.Math.ProbFuncs.erfi(1)).toBe(Infinity);
        expect(JXG.Math.ProbFuncs.erfi(-1)).toBe(-Infinity);
    });

    // --- ndtr (normal distribution CDF) ---

    it("ndtr(0) = 0.5", function () {
        expect(JXG.Math.ProbFuncs.ndtr(0)).toBeCloseTo(0.5, 12);
    });

    it("ndtr(1)", function () {
        expect(JXG.Math.ProbFuncs.ndtr(1)).toBeCloseTo(0.841344746068543, 12);
    });

    it("ndtr(1.96) is close to 0.975 (95% CI boundary)", function () {
        expect(JXG.Math.ProbFuncs.ndtr(1.96)).toBeCloseTo(0.9750021048517795, 12);
    });

    it("ndtr continuity across erf/erfce branch at |a|=sqrt(2)", function () {
        // ndtr uses erf path for |a*SQRTH| < 1, erfce path for |a*SQRTH| >= 1
        // Branch point is |a| = 1/SQRTH = sqrt(2)
        var s2 = Math.sqrt(2);
        var below = JXG.Math.ProbFuncs.ndtr(s2 - 0.0001);
        var at = JXG.Math.ProbFuncs.ndtr(s2);
        var above = JXG.Math.ProbFuncs.ndtr(s2 + 0.0001);
        expect(at).toBeCloseTo((below + above) / 2, 7);
    });

    it("ndtr symmetry: ndtr(x) + ndtr(-x) = 1", function () {
        // Includes values near the erf/erfce branch at |a|=sqrt(2)
        var values = [0.5, 1.0, 1.41, 1.42, 2.0, 3.0];
        values.forEach(function (x) {
            expect(JXG.Math.ProbFuncs.ndtr(x) + JXG.Math.ProbFuncs.ndtr(-x)).toBeCloseTo(1, 12);
        });
    });

    it("ndtr(8) is close to 1", function () {
        expect(JXG.Math.ProbFuncs.ndtr(8)).toBeCloseTo(1, 12);
    });

    it("ndtr(-8) is close to 0", function () {
        expect(JXG.Math.ProbFuncs.ndtr(-8)).toBeCloseTo(0, 12);
    });

    // --- ndtri (inverse normal CDF) ---

    it("ndtri(0.5) = 0", function () {
        expect(JXG.Math.ProbFuncs.ndtri(0.5)).toBeCloseTo(0, 12);
    });

    it("ndtri(0.975)", function () {
        expect(JXG.Math.ProbFuncs.ndtri(0.975)).toBeCloseTo(1.959963984540054, 12);
    });

    it("ndtri symmetry: ndtri(p) = -ndtri(1-p)", function () {
        var values = [0.1, 0.25, 0.75, 0.9];
        values.forEach(function (p) {
            expect(JXG.Math.ProbFuncs.ndtri(p)).toBeCloseTo(-JXG.Math.ProbFuncs.ndtri(1 - p), 12);
        });
    });

    it("ndtri/ndtr round-trip: ndtr(ndtri(p)) = p", function () {
        expect(JXG.Math.ProbFuncs.ndtr(JXG.Math.ProbFuncs.ndtri(0.9))).toBeCloseTo(0.9, 12);
    });

    it("ndtri domain boundaries: ndtri(0) = -Infinity, ndtri(1) = Infinity", function () {
        expect(JXG.Math.ProbFuncs.ndtri(0)).toBe(-Infinity);
        expect(JXG.Math.ProbFuncs.ndtri(1)).toBe(Infinity);
    });
});
