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
}

/**
 * Solves a system of linear equations given by A and b using the Gauss-Jordan-elimination.
 * @param {JXG.Math.Matrix} A Square matrix containing the coefficients of the lineare equation system.
 * @param {JXG.Math.Vector} b A vector containing the linear equation system's right hand side. 
 * @type JXG.Math.Vector
 * @throws {DimensionMismatchException} If a non-square-matrix is given or the b has not the right length.
 * @throws {SingularMatrixException} If A's rank is not full.
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
         if (Math.abs(A[i][j]) > eps) {
            /* Equals pivot element zero? */
            if (Math.abs(A[j][j]) < eps) {
               /* Yeah, so we have to exchange the rows */
               A.exchangeRows(i, j);
               b.exchange(i, j);
               P.exchange(i, j);
//            exchange_rows(A, n, b, P, j, i);
            }
            else {
               /* Speicherung der Eintraege der unteren Dreiecksmatrix L in die zu Null gemachten Stellen von A  */
               A[i][j] /= A[j][j];
               /* Mittransformierung des Ergebnisvektors b */
               b[i] -= A[i][j] * b[j];
               /* subtrahiere das A[i][j] / A[j][j]-fache der j-ten Zeile von der i-ten */
               for (var k = j + 1; k < A.n(); k ++) {
                  A[i][k] -= A[i][j] * A[j][k];
               }
            }
         }
         if (Math.abs(A[j][j]) < eps) { // Alle Elemente unterhalb der j-ten Zeile in der j-ten Spalte sind kleiner gleich eps.
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
}

/**
 * Decomposites the matrix A in an orthogonal matrix Q and a right triangular matrix R. 
 * @param {JXG.Math.Matrix} A A matrix.
 * @type Object
 * @throws {SingularMatrixException} If A's rank is not full.
 * @return The matrices Q and R.
 */
JXG.Math.Numerics.QR = function(A, b) {
    
}