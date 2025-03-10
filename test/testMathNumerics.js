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

describe("Test JXG.Math.Numerics", function () {
    it("Gauss", function () {
        var A = [
                [1, 1, 1],
                [0, -2, -3],
                [0, -6, -8]
            ],
            Atest = [
                [1, 1, 1],
                [0, -2, -3],
                [0, -6, -8]
            ],
            Apivot = [
                [0, 1, 0],
                [1, 0, 0],
                [0, 0, 1]
            ],
            Asing = [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ],
            b = [0, 1, 3],
            excep;

        expect(JXG.Math.Numerics.Gauss(A, b)).toEqual([0.5, -0.5, 0]);
        expect(JXG.Math.Numerics.Gauss(Apivot, b)).toEqual([1, 0, 3]);
        expect(A).toEqual(Atest);
        expect(b).toEqual([0, 1, 3]);
        // expect(JXG.Math.Numerics.Gauss(Asing, b)).toThrowError);
        // expect(JXG.Math.Numerics.Gauss(A, [1, 0])).toThrowError();
    });

    it("Backward solve", function () {
        var A = JXG.Math.identity(3, 3),
            b = [4, 3, 2];

        A[0][0] = 2;
        A[0][2] = 1;
        expect(JXG.Math.Numerics.backwardSolve(A, b)).toEqual([1, 3, 2]);
        expect(b).toEqual([4, 3, 2]);

        // Input change allowed:
        expect(JXG.Math.Numerics.backwardSolve(A, b, true)).toEqual([1, 3, 2]);
    });

    it("GaussBareiss", function () {
        var A1 = JXG.Math.identity(1, 1),
            A2 = JXG.Math.identity(2, 2),
            A3 = JXG.Math.identity(3, 3),
            A4 = JXG.Math.identity(4, 4);

        A1[0][0] = 5;
        expect(JXG.Math.Numerics.gaussBareiss(A1)).toEqual(5);
        A2[0][1] = 2;
        A2[1][0] = -2;
        expect(JXG.Math.Numerics.gaussBareiss(A2)).toEqual(5);
        expect(JXG.Math.Numerics.gaussBareiss(A3)).toEqual(1);
        expect(JXG.Math.Numerics.gaussBareiss(A4)).toEqual(1);
        A3 = [
            [0, 0, 1],
            [14, 2, 999],
            [-32, 1, 999]
        ];
        expect(JXG.Math.Numerics.gaussBareiss(A3)).toEqual(78);
        A3 = [
            [0, 14, -32],
            [0, 2, 1],
            [1, 999, 999]
        ];
        expect(JXG.Math.Numerics.gaussBareiss(A3)).toEqual(78);
    });

    it("Jacobi", function () {
        var A = [
            [2, 0, 0],
            [0, 4, 0],
            [0, 0, 8]
        ];
        expect(JXG.Math.Numerics.Jacobi(A)).toEqual([A, JXG.Math.identity(3)]);
    });

    it("Newton-Cotes", function () {
        var f = function (x) {
                return Math.sin(x);
            },
            interval = [0, 2 * Math.PI];

        expect(JXG.Math.Numerics.NewtonCotes(interval, f)).toBeCloseTo(0, 15);
    });

    it("Newton", function () {
        var f = function (x) {
            return x - 2;
        };
        expect(JXG.Math.Numerics.Newton(f, 0)).toBeCloseTo(2, 8);
    });

    it("Spline definition", function () {
        var x = [1, 2, 3],
            y = [1, 2, 3];
        expect(JXG.Math.Numerics.splineDef(x, y)).toEqual([0, 0, 0]);
    });

    it("Spline evaluation", function () {
        var x = [1, 2, 3],
            y = [1, 2, 3],
            F = JXG.Math.Numerics.splineDef(x, y);

        expect(JXG.Math.Numerics.splineEval(1.5, x, y, F)).toEqual(1.5);
        expect(JXG.Math.Numerics.splineEval(0.5, x, y, F)).toBeNaN();
        expect(JXG.Math.Numerics.splineEval([1.5, 2.5], x, y, F)).toEqual([1.5, 2.5]);
    });

    it("General polynomial term", function () {
        var coeff = [5.12345, 4.12345, 3, 2, 1],
            deg = 4,
            varname = "x",
            prec = 3;

        expect(JXG.Math.Numerics.generatePolynomialTerm(coeff, deg, varname, prec)).toEqual(
            "(1.00)*x<sup>4</sup> + (2.00)*x<sup>3</sup> + (3.00)*x<sup>2</sup> + (4.12)*x + (5.12)"
        );
    });

    it("Lagrange polynomial", function () {
        // This will look a little bit strange. We need points, but all we need in lagrangePolynomial() from those points
        // is the X() and Y() method. Hence, we're faking some points.
        var p = [],
            P = [
                [1, 1],
                [2, 3],
                [3, 2]
            ],
            i,
            lagrange,
            makeFakeFunction = function (P, i, j) {
                return function () {
                    return P[i][j];
                };
            };

        for (i = 0; i < P.length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: makeFakeFunction(P, i, 0),
                Y: makeFakeFunction(P, i, 1)
            };
        }

        lagrange = JXG.Math.Numerics.lagrangePolynomial(p);
        expect(lagrange(1.5)).toEqual(2.375);
        expect(lagrange(1.5, false)).toEqual(2.375);
    });

    it("Neville", function () {
        var p = [],
            P = [
                [1, 1],
                [2, 3],
                [3, 2]
            ],
            i,
            neville,
            makeFakeFunction = function (P, i, j) {
                return function () {
                    return P[i][j];
                };
            };

        for (i = 0; i < P.length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: makeFakeFunction(P, i, 0),
                Y: makeFakeFunction(P, i, 1)
            };
        }

        neville = JXG.Math.Numerics.Neville(p);
        expect(neville[0](0, true)).toEqual(1);
        expect(neville[0](0, false)).toEqual(1);
        expect(neville[1](0, true)).toEqual(1);
    });

    it("Regression polynomial", function () {
        var p = [],
            P = [
                [1, 2, 3],
                [1, 3, 2]
            ],
            i,
            regressionPoints,
            regressionArrays,
            fakeSlider = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                Value: function () {
                    return 2;
                }
            },
            makeFakeFunction = function (P, i, j) {
                return function () {
                    return P[i][j];
                };
            };
        for (i = 0; i < P[0].length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: makeFakeFunction(P, 0, i),
                Y: makeFakeFunction(P, 1, i)
            };
        }

        regressionPoints = JXG.Math.Numerics.regressionPolynomial(2, p);
        regressionArrays = JXG.Math.Numerics.regressionPolynomial(fakeSlider, P[0], P[1]);

        expect(regressionPoints(1.5)).toBeCloseTo(2.375, 13);
        expect(regressionArrays(1.5)).toBeCloseTo(2.375, 13);
    });

    it("Numerical derivative", function () {
        var f = function (x) {
                return x * x;
            },
            df = JXG.Math.Numerics.D(f);
        expect(df(1)).toBeCloseTo(2, 10);
    });

    it("Fzero", function () {
        var f = function (x) {
                return x - 2;
            },
            f2 = function (x) {
                return (x - 1) * (x - 1) * (x - 1);
            },
            f3 = function (x) {
                return (x - 5) * (x - 5);
            };

        expect(JXG.Math.Numerics.fzero(f, 0)).toBeCloseTo(2.0, 25);
        expect(f2(JXG.Math.Numerics.root(f2, 0))).toBeCloseTo(0.0, 25);
        expect(f3(JXG.Math.Numerics.root(f3, 0))).toBeCloseTo(0.0, 25);
    });
});
/*
TestCase("MathNumerics", {
    testRiemann: function () {
    },

    testRiemannSum: function () {
    },

    testRungeKutta: function () {
    },

    testBezier: function () {
    },
});
*/
