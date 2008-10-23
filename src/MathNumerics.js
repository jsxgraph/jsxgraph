/*
    Copyright 2008, 
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph. If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview In this file the namespace Math.Numerics is defined, which holds numerical
 * algorithms for solving linear equations etc.
 * @author graphjs
 */
 
JXG.Math.Numerics = new Object();

 
/* Namespace constants */
  /* Constants used for integration with Newton-Cotes-algorithm */
  JXG.Math.Numerics.INT_TRAPEZ  = 0x00001;
  JXG.Math.Numerics.INT_SIMPSON = 0x00002;
  JXG.Math.Numerics.INT_MILNE   = 0x00003;
  
/**
 * Number of nodes for evaluation, used for integration
 * @type int
 */
JXG.Math.Numerics.number_of_nodes = 28;

/**
 * Type of integration algorithm, possible values are: <ul><li>JXG.INT_TRAPEZ</li><li>JXG.INT_SIMPSON</li><li>JXG.INT_MILNE</li></ul>
 * @type int
 */
JXG.Math.Numerics.integration_type = JXG.INT_MILNE;

/**
 * Solves a system of lineare equations given by the right triangular matrix R and vector b.
 * @param {JXG.Math.Matrix} R Right triangular matrix. All entries a_(i,j) with i < j are ignored.
 * @param {JXG.Math.Vector} b Right hand side of the linear equation system.
 * @type JXG.Math.Vector
 * @return A vector that solves the system of linear equations.
 * @private
 */ 
JXG.Math.Numerics.backwardSolve = function(R, b) {
   var x = b;

   for(var i = R.m()-1; i >= 0; i--) {
      for(var j = R.n()-1; j > i; j--) {
         x[i] -= R[i][j] * x[j];
      }
      x[i] /= R[i][i];
   }
   
   return x;
};

/**
 * Solves a system of linear equations given by A and b using the Gauss-Jordan-elimination.
 * @param {JXG.Math.Matrix} A Square matrix containing the coefficients of the lineare equation system.
 * @param {JXG.Math.Vector} b A vector containing the linear equation system's right hand side. 
 * @type JXG.Math.Vector
 * @throws {JXG.DimensionMismatchException} If a non-square-matrix is given or the b has not the right length.
 * @throws {JXG.SingularMatrixException} If A's rank is not full.
 * @return A vector that solves the linear equation system.
 */
JXG.Math.Numerics.Gauss = function(A, b) {
   var eps = 1.e-12;
	
   /* vector to keep track of permutations caused by pivotion */
   var P = new JXG.Math.Vector();
   for (var i = 0; i < A.n(); i++) {
      P.push(i);
   }
	
   /* Gauss-Jordan-elimination */
   for (var j = 0; j < A.n(); j++)
   {
      for (var i = A.n()-1; i > j; i--) {
         /* Is the element which is to eliminate greater than zero? */
         if (Math.abs(A[i][j]) > JXG.Math.eps) {
            /* Equals pivot element zero? */
            if (Math.abs(A[j][j]) < JXG.Math.eps) {
               /* Yeah, so we have to exchange the rows */
               A.exchangeRows(i, j);
               b.exchange(i, j);
               P.exchange(i, j);
            }
            else {
               /* Saves the L matrix of the LR-decomposition. unneeded. */
               A[i][j] /= A[j][j];
               /* Transform right-hand-side b */
               b[i] -= A[i][j] * b[j];
               /* subtract the multiple of A[i][j] / A[j][j] of the j-th row from the i-th. */
               for (var k = j + 1; k < A.n(); k ++) {
                  A[i][k] -= A[i][j] * A[j][k];
               }
            }
         }
         if (Math.abs(A[j][j]) < JXG.Math.eps) { // The absolute values of all coefficients below the j-th row in the j-th column are smaller than JXG.Math.eps.
            throw new SingularMatrixException();
         }
      }
   }
   
   var y = JXG.Math.Numerics.backwardSolve(A, b);
   var x = new JXG.Math.Vector();
   for(var i = 0; i < y.n(); i++) {
      x.push(y[P[i]]);
   }
   
   return x;
};

/**
 * Decomposites the matrix A in an orthogonal matrix Q and a right triangular matrix R. 
 * @param {JXG.Math.Matrix} A A matrix.
 * @type Object
 * @throws {JXG.SingularMatrixException} If A's rank is not full.
 * @return The matrices Q and R.
 */
JXG.Math.Numerics.QR = function(A, b) {
    
};

/**
 * Calculates the integral of function f over interval using Newton-Cotes-algorithm.
 * @param {Array} interval e.g. [a, b] 
 * @param {function} f 
 */
JXG.Math.Numerics.NewtonCotes = function(interval, f) {
    var integral_value = 0.0;

    var step_size = (interval[1] - interval[0]) / this.number_of_nodes;
    switch(this.integration_type) {
        case JXG.INT_TRAPEZ:
            integral_value = (f(interval[0]) + f(interval[1])) * 0.5;
    
            var evaluation_point = interval[0];
            for (i = 0; i < this.number_of_nodes - 1; i++)
            {
                evaluation_point += step_size;
                integral_value   += f(evaluation_point);
            }
            integral_value *= step_size;

            break;
        case JXG.INT_SIMPSON:
            if (this.number_of_nodes%2 > 0) {
                throw "Error: INT_SIMPSONS requires Algebra.number_of_nodes dividable by 2.";
            }
            var number_of_intervals = this.number_of_nodes / 2.0;
    
            integral_value = f(interval[0]) + f(interval[1]);
    
            evaluation_point = interval[0];
            for (i = 0; i < number_of_intervals - 1; i++)
            {
                evaluation_point += 2.0 * step_size;
                integral_value   += 2.0 * f(evaluation_point);
            }
            evaluation_point = interval[0] - step_size;
            for (i = 0; i < number_of_intervals; i++)
            {
                evaluation_point += 2.0 * step_size;
                integral_value   += 4.0 * f(evaluation_point);
            }
            integral_value *= step_size / 3.0;
            break;
        default:
            if (this.number_of_nodes%4 > 0) {
                throw "Error in INT_MILNE: Algebra.number_of_nodes must be a multiple of 4";
            }
            number_of_intervals = this.number_of_nodes * 0.25;
    
            integral_value = 7.0 * (f(interval[0]) + f(interval[1]));
    
            evaluation_point = interval[0];
            for (i = 0; i < number_of_intervals - 1; i++)
            {
                evaluation_point += 4.0 * step_size;
                integral_value   += 14.0 * f(evaluation_point);
            }
            evaluation_point = interval[0] - 3.0 * step_size;
            for (i = 0; i < number_of_intervals; i++)
            {
                evaluation_point += 4.0 * step_size;
                integral_value   += 32.0 * (f(evaluation_point) + f(evaluation_point + 2 * step_size));
            }
            evaluation_point = interval[0] - 2.0 * step_size;
            for (i = 0; i < number_of_intervals; i++)
            {
                evaluation_point += 4.0 * step_size;
                integral_value   += 12.0 * f(evaluation_point);
            }
            integral_value *= 2.0 * step_size / 45.0;
    }
    return integral_value;
};