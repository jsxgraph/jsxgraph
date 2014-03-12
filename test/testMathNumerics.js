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
 *  Js-Test-Driver Test Suite for JXG.MathNumerics
 */

TestCase("MathNumerics", {

    setUp: function () {
    },

    tearDown: function () {
    },

    // Helper function. Used in testNeville and testLagrangePolynomial
    makeFakeFunction: function (P, i, j) {
        return function() {
            return P[i][j];
        };
    },


    testGauss: function () {
        expectAsserts(4);

        var A = [[1, 1, 1], [0,-2,-3], [0,-6,-8]],
            Atest = [[1, 1, 1], [0,-2,-3], [0,-6,-8]],
            Apivot = [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
            Asing = [[0, 0, 0], [0, 1, 0], [0, 0, 1]],
            b = [0, 1, 3],
            excep;

        assertEquals("JXG.Math.Numerics.Gauss without pivoting", [0.5, -0.5, 0], JXG.Math.Numerics.Gauss(A, b));
        assertEquals("JXG.Math.Numerics.Gauss is not allowed to change the given Matrix", Atest, A);
        assertEquals("JXG.Math.Numerics.Gauss is not allowed to change the given right hand side vector", [0, 1, 3], b);
        assertEquals("JXG.Math.Numerics.Gauss with pivoting", [1, 0, 3], JXG.Math.Numerics.Gauss(Apivot, b));

        try {
            JXG.Math.Numerics.Gauss(Asing, b);
            fail("JXG.Math.Numerics.Gauss with a singular matrix should throw an Error() exception");
        } catch (e) {}

        try {
            JXG.Math.Numerics.Gauss(A, [1, 0]);
            fail("JXG.Math.Numerics.Gauss should throw an exception if dimensions of the matrix and right hand side differ");
        } catch (e) {}
    },

    testBackwardSolve: function () {
        expectAsserts(3);

        var A = JXG.Math.identity(3,3),
            b = [4, 3, 2];

        A[0][0] = 2;
        A[0][2] = 1;
        assertEquals("JXG.Math.Numerics.backwardSolve, incorrect result, no input change", [1, 3, 2], JXG.Math.Numerics.backwardSolve(A, b));
        assertEquals("JXG.Math.Numerics.backwardSolve changed input but it wasn't allowed to", [4,3,2], b);

        assertEquals("JXG.Math.Numerics.backwardSolve, incorrect result, input change allowed", [1, 3, 2], JXG.Math.Numerics.backwardSolve(A, b, true));
    },

    testGaussBareiss: function () {
        expectAsserts(6);

        var A1 = JXG.Math.identity(1,1),
            A2 = JXG.Math.identity(2,2),
            A3 = JXG.Math.identity(3,3),
            A4 = JXG.Math.identity(4,4);

        A1[0][0] = 5;
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 5, JXG.Math.Numerics.gaussBareiss(A1));
        A2[0][1] = 2;
        A2[1][0] = -2;
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 5, JXG.Math.Numerics.gaussBareiss(A2));
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 1, JXG.Math.Numerics.gaussBareiss(A3));
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 1, JXG.Math.Numerics.gaussBareiss(A4));

        A3 = [[0,0,1],[14,2,999],[-32,1,999]];
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 78, JXG.Math.Numerics.gaussBareiss(A3));        
        A3 = [[0,14,-32],[0,2,1],[1,999,999]];
        assertEquals("JXG.Math.Numerics.gaussBareiss, incorrect result", 78, JXG.Math.Numerics.gaussBareiss(A3));        
    },

    testJacobi: function () {
        expectAsserts(1);

        var A = [[2,0,0],[0,4,0],[0,0,8]];
        assertEquals("JXG.Math.Numerics.Jacobi, incorrect result", [A, JXG.Math.identity(3)], JXG.Math.Numerics.Jacobi(A));
    },

    testNewtonCotes: function () {
        expectAsserts(1);

        var f = function(x) { return Math.sin(x); },
            interval = [0, 2*Math.PI];

        assertTrue("JXG.Math.Numerics.NewtonCotes, incorrect result", Math.abs(0 - JXG.Math.Numerics.NewtonCotes(interval, f)) <= JXG.Math.eps);
    },

    testNewton: function () {
        expectAsserts(1);

        var f = function(x) { return x-2; };
        assertTrue("JXG.Math.Numerics.Newton, incorrect result", Math.abs(2 - JXG.Math.Numerics.Newton(f, 0)) < JXG.Math.eps);
    },

    testSplineDef: function () {
        expectAsserts(1);

        var x = [1, 2, 3],
            y = [1, 2, 3];

        assertEquals("JXG.Math.Numerics.splineDef, incorrect result", [0, 0, 0], JXG.Math.Numerics.splineDef(x, y));
    },

    testSplineEval: function () {
        expectAsserts(3);

        var x = [1, 2, 3],
            y = [1, 2, 3],
            F = JXG.Math.Numerics.splineDef(x, y);

        assertEquals("JXG.Math.Numerics.splineEval, incorrect result (Given Number)", 1.5, JXG.Math.Numerics.splineEval(1.5, x, y,F));
        assertNaN("JXG.Math.Numerics.splineEval outside the evaluation area should return NaN", JXG.Math.Numerics.splineEval(0.5, x, y,F));
        assertEquals("JXG.Math.Numerics.splineEval, incorrect result (Given Array)", [1.5, 2.5], JXG.Math.Numerics.splineEval([1.5, 2.5], x, y,F));
    },

    testGeneratePolynomialTerm: function () {
        expectAsserts(1);

        var coeff = [5.12345, 4.12345, 3, 2, 1],
            deg = 4,
            varname = 'x',
            prec = 3;

            assertEquals("JXG.Math.Numerics.generatePolynomialTerm, incorrect result", '(1.00)*x<sup>4</sup> + (2.00)*x<sup>3</sup> + (3.00)*x<sup>2</sup> + (4.12)*x + (5.12)', JXG.Math.Numerics.generatePolynomialTerm(coeff, deg, varname, prec));
    },

    testLagrangePolynomial: function () {
        expectAsserts(2);

        // This will look a little bit strange. We need points, but all we need in lagrangePolynomial() from those points
        // is the X() and Y() method. Hence, we're faking some points.
        var p = [], P = [[1,1],[2,3],[3,2]], i, lagrange;

        for(i=0; i<P.length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: this.makeFakeFunction(P, i, 0),
                Y: this.makeFakeFunction(P, i, 1)
            };
        }

        lagrange = JXG.Math.Numerics.lagrangePolynomial(p);
        assertEquals("JXG.Math.Numerics.lagrangePolynomial, incorrect result", 2.375, lagrange(1.5));
        assertEquals("JXG.Math.Numerics.lagrangePolynomial, incorrect result", 2.375, lagrange(1.5, false));
    },

    testNeville: function () {
        expectAsserts(3);

        var p = [], P = [[1,1],[2,3],[3,2]], i, neville;

        for(i=0; i<P.length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: this.makeFakeFunction(P, i, 0),
                Y: this.makeFakeFunction(P, i, 1)
            };
        }

        neville = JXG.Math.Numerics.Neville(p);
        assertEquals("JXG.Math.Numerics.Neville, incorrect result from xfct", 1, neville[0](0, true));
        assertEquals("JXG.Math.Numerics.Neville, incorrect result from xfct", 1, neville[0](0, false));
        assertEquals("JXG.Math.Numerics.Neville, incorrect result from yfct", 1, neville[1](0, true));
    },

    testRegressionPolynomial: function () {
        expectAsserts(2);

        var p = [], P = [[1,2,3], [1,3,2]], i,
            regressionPoints, regressionArrays,
            fakeSlider = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                Value: function() {
                    return 2;
                }
            };

        for(i=0; i<P[0].length; i++) {
            p[i] = {
                elementClass: JXG.OBJECT_CLASS_POINT,
                X: this.makeFakeFunction(P, 0, i),
                Y: this.makeFakeFunction(P, 1, i)
            };
        }

        regressionPoints = JXG.Math.Numerics.regressionPolynomial(2, p);
        regressionArrays = JXG.Math.Numerics.regressionPolynomial(fakeSlider, P[0], P[1]);

        assertTrue("JXG.Math.Numerics.regressionPolynomial, Array of Points, Degree number, incorrect result", Math.abs(2.375 - regressionPoints(1.5)) <= JXG.Math.eps);
        assertTrue("JXG.Math.Numerics.regressionPolynomial, Two Arrays, Degree slider, incorrect result", Math.abs(2.375 - regressionArrays(1.5)) <= JXG.Math.eps);
    },

    testD: function () {
        expectAsserts(1);

        var f = function(x) {
            return x*x;
        },
        df = JXG.Math.Numerics.D(f);

        assertTrue("JXG.Math.Numerics.D, incorrect result", Math.abs(2 - df(1)) < JXG.Math.eps);
    },

    testRiemann: function () {

    },

    testRiemannSum: function () {

    },

    testRungeKutta: function () {

    },

    testBezier: function () {

    },

    testFzero: function () {
        expectAsserts(3);

        var f = function(x) { return x-2; },
            f2 = function(x) { return (x-1)*(x-1)*(x-1); },
            f3 = function(x) { return (x-5)*(x-5); };

        assertTrue("JXG.Math.Numerics.fzero, incorrect result", Math.abs(2 - JXG.Math.Numerics.fzero(f, 0)) < JXG.Math.eps);
		assertTrue("JXG.Math.Numerics.root, incorrect result f2", Math.abs(0.0 - f2(JXG.Math.Numerics.root(f2, 0))) < JXG.Math.eps);
        assertTrue("JXG.Math.Numerics.root, incorrect result f3", Math.abs(0.0 - f3(JXG.Math.Numerics.root(f3, 0))) < JXG.Math.eps);
    }

});
