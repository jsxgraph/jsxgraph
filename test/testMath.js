/*
    Copyright 2008-2013
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*
 *  Js-Test-Driver Test Suite for JXG.Math
 */

TestCase("Math", {

    setUp: function () {
    },

    tearDown: function () {
    },

    testMatVecMult: function () {
        expectAsserts(2);

        var A = [[2, 1],
                 [1, 3]],
            b = [4, 5];

        assertEquals("JXG.Math.matVecMult: Incorrect result", [13, 19], JXG.Math.matVecMult(A ,b));

        try {
            assertNaN("JXG.Math.matVecMult should not fail on mismatching dimension", JXG.Math.matVecMult([[1, 1], [1]], [2, 2])[1]);
        } catch(e) {
            fail("JXG.Math.matVecMult should not fail on mismatching dimension");
        }
    },

    testVector: function () {
        expectAsserts(2);

        assertEquals("JXG.Math.vector doesn't generate a zero vector by default", [0,0,0], JXG.Math.vector(3));
        assertEquals("JXG.Math.vector ignores initial value", [1,1], JXG.Math.vector(2,1));
    },

    testMatrix: function () {
        expectAsserts(3);

        assertEquals("JXG.Math.matrix doesn't generate a square matrix if only one parameter is given", [[0,0],[0,0]], JXG.Math.matrix(2));
        assertEquals("JXG.Math.matrix doesn't generate a zero matrix", [[0,0,0],[0,0,0],[0,0,0]], JXG.Math.matrix(3,3));
        assertEquals("JXG.Math.matrix ignores initial value", [[1,1,1],[1,1,1]], JXG.Math.matrix(2,3,1));
    },

    testIdentity: function () {
        expectAsserts(2);

        assertEquals("JXG.Math.identity, square matrix case", [[1,0,0],[0,1,0],[0,0,1]], JXG.Math.identity(3));
        assertEquals("JXG.Math.identity, non-square matrix case", [[1,0,0],[0,1,0]], JXG.Math.identity(2,3));
    },

    testMatMatMult: function () {
        expectAsserts(1);

        var A = [[1,2,3],
            [4,5,6],
            [7,8,9]];

        assertEquals("JXG.Math.matMatMult, incorrect result", [[30,36,42],[66,81,96],[102,126,150]], JXG.Math.matMatMult(A, A));
        try {
            JXG.Math.matMatMult(A, [[30,36,42],[66,81,96]]);
        } catch(e) {
            fail("JXG.Math.matMatMult should not throw an exception on mismatching dimensions");
        }
    },

    testTranspose: function () {
        expectAsserts(2);

        var A = [[1,2,3],
                 [4,5,6],
                 [7,8,9]];

        assertEquals("JXG.Math.transpose, incorrect result square matrix", A, JXG.Math.transpose(JXG.Math.transpose(A)));

        A.splice(2,1);
        assertEquals("JXG.Math.transpose, incorrect result non-square matrix", A, JXG.Math.transpose(JXG.Math.transpose(A)));
    },

    testInnerProduct: function () {
        expectAsserts(2);

        var b = [2, 1, 1],
            c = [1, 2, 1];

        assertEquals("JXG.Math.innerProduct, incorrect result", 5, JXG.Math.innerProduct(b, c));
        assertEquals("JXG.Math.innerProduct ignores length parameter n", 4, JXG.Math.innerProduct(b, c, 2));
    },

    testCrossProduct: function () {
        expectAsserts(1);

        var b = [2, 1, 1],
            c = [1, 2, 1];

        assertEquals("JXG.Math.crossProduct, incorrect result", [-1,-1,3], JXG.Math.crossProduct(b, c));
    },

    testFactorial: function () {
        expectAsserts(4);

        assertEquals("JXG.Math.factorial, incorrect result", 24, JXG.Math.factorial(4));
        assertEquals("JXG.Math.factorial doesn't ignore fractions", 24, JXG.Math.factorial(4.312));
        assertEquals("JXG.Math.factorial doesn't ignore fractions", 120, JXG.Math.factorial(5));
        assertNaN("JXG.Math.factorial doesn't ignore negative values", JXG.Math.factorial(-2));
    },

    testBinomial: function () {
        expectAsserts(3);

        assertEquals("JXG.Math.binomial, incorrect result", 10, JXG.Math.binomial(5,3));
        assertEquals("JXG.Math.binomial doesn't ignore fractions", 10, JXG.Math.binomial(5.1,3.14152));
        assertNaN("JXG.Math.binomial doesn't ignore negative values", JXG.Math.binomial(2, -2));
    },

    testPow: function () {
        expectAsserts(2);

        assertEquals("JXG.Math.pow, incorrect result", 32, JXG.Math.pow(4, 2.5));
        assertEquals("JXG.Math.pow, incorrect result", 16, JXG.Math.pow(4, 2));
    },

    testNormalize: function () {
        expectAsserts(1);

        assertEquals("JXG.Math.normalize, incorrect result", [0,0.5,0,0.5,0.5,0.5,-0.5,0], JXG.Math.normalize([1, 1, 0, 1, 1, 0, 1, 1]));
    },

    testInverse: function () {
        expectAsserts(1);

        var A = [[2, 0, 0],[0,4,0],[0,0,8]];
        assertEquals("JXG.Math.inverse, incorrect result", [[0.5,0,0],[0,0.25,0],[0,0,0.125]], JXG.Math.inverse(A));
    }
});