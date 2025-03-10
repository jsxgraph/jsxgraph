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

describe("Test JXG.Math", function () {
    it("Matrices, vectors", function () {
        var A = [
                [2, 1],
                [1, 3]
            ],
            b = [4, 5];

        expect(JXG.Math.matVecMult(A, b)).toEqual([13, 19]);
        expect(JXG.Math.vector(3)).toEqual([0, 0, 0]);
        expect(JXG.Math.vector(2, 1)).toEqual([1, 1]);
        expect(JXG.Math.matrix(2)).toEqual([
            [0, 0],
            [0, 0]
        ]);
        expect(JXG.Math.matrix(3, 3)).toEqual([
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ]);
        expect(JXG.Math.matrix(2, 3, 1)).toEqual([
            [1, 1, 1],
            [1, 1, 1]
        ]);

        // JXG.Math.identity, square matrix case
        expect(JXG.Math.identity(3)).toEqual([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]);
        // JXG.Math.identity, non-square matrix case
        expect(JXG.Math.identity(2, 3)).toEqual([
            [1, 0, 0],
            [0, 1, 0]
        ]);
    });

    it("MatMatMult", function () {
        var A = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];

        expect(JXG.Math.matMatMult(A, A)).toEqual([
            [30, 36, 42],
            [66, 81, 96],
            [102, 126, 150]
        ]);
    });

    it("Transpose", function () {
        var A = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];

        expect(JXG.Math.transpose(JXG.Math.transpose(A))).toEqual(A);
        // JXG.Math.transpose, non-square matrix
        A.splice(2, 1);
        expect(JXG.Math.transpose(JXG.Math.transpose(A))).toEqual(A);
    });

    it("Inner product", function () {
        var b = [2, 1, 1],
            c = [1, 2, 1];

        expect(JXG.Math.innerProduct(b, c)).toEqual(5);
        // JXG.Math.innerProduct length parameter n",
        expect(JXG.Math.innerProduct(b, c, 2)).toEqual(4);
    });

    it("Cross product", function () {
        var b = [2, 1, 1],
            c = [1, 2, 1];

        expect(JXG.Math.crossProduct(b, c)).toEqual([-1, -1, 3]);
    });

    it("Factorial", function () {
        expect(JXG.Math.factorial(4)).toEqual(24);
        expect(JXG.Math.factorial(4.312)).toEqual(24);
        expect(JXG.Math.factorial(5)).toEqual(120);
        expect(JXG.Math.factorial(-2)).toBeNaN();
    });

    it("Binomial", function () {
        expect(JXG.Math.binomial(5, 3)).toEqual(10);
        expect(JXG.Math.binomial(5.1, 3.14152)).toEqual(10);
        expect(JXG.Math.binomial(2, -2)).toBeNaN();
    });

    it("Pow", function () {
        expect(JXG.Math.pow(4, 2.5)).toEqual(32);
        expect(JXG.Math.pow(4, 2)).toEqual(16);
    });

    beforeEach(function () {
        jasmine.addCustomEqualityTester(function floatEquality(a, b) {
            if (a === +a && b === +b && (a !== (a | 0) || b !== (b | 0))) {
                // if float
                return Math.abs(a - b) < 5e-10;
            }
        });
    });

    it("Normalize", function () {
        var i,
            res = [0, 0.5, 0, 0.5, 0.5, 0.5, -0.5, 0];
        for (i = 0; i < res.length; i++) {
            expect(JXG.Math.normalize([1, 1, 0, 1, 1, 0, 1, 1])[i]).toBeCloseTo(res[i], 15);
        }
    });

    it("Matrix inverse", function () {
        var A = [
                [2, 0, 0],
                [0, 4, 0],
                [0, 0, 8]
            ],
            i,
            j;

        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                expect(JXG.Math.inverse(A)[i][j]).toBeCloseTo(
                    [
                        [0.5, 0, 0],
                        [0, 0.25, 0],
                        [0, 0, 0.125]
                    ][i][j],
                    15
                );
            }
        }
    });
});

// TestCase("Math", {
//     testMatMatMult: function () {
//         expectAsserts(1);

//         var A = [[1, 2, 3],
//         [4, 5, 6],
//         [7, 8, 9]];

//         try {
//             JXG.Math.matMatMult(A, [[30, 36, 42], [66, 81, 96]]);
//         } catch (e) {
//             fail("JXG.Math.matMatMult should not throw an exception on mismatching dimensions");
//         }
//     },

// });
