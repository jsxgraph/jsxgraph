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
 * @fileoverview In this file the namespace JXG.Math is defined, which is the base namespace
 * for namespaces like Math.Numerics, Math.Algebra, Math.Statistics etc.
 * @author graphjs
 */
 
JXG.Math = new Object();

/* Math constants */
JXG.Math.eps = 0.000001;

/**
 * Represents a vector.
 * @constructor
 * @param {Array} elements An array of numerical values containing the coefficients to be put into the vector.
 * @return JXG.Math.Vector
 */
JXG.Math.Vector = function(elements) {
   this.length = 0;
    
   if((typeof elements != undefined) && (elements != null)) {
      for(var i=0; i<elements.length; i++) {
          this.push(elements[i]);
      }
   }
};

/*
 * The base class for Vector is just an array.
 */
JXG.Math.Vector.prototype = new Array();

/**
 * Returns the dimension of the vector.
 * @type int
 */
JXG.Math.Vector.prototype.n = function() {
   return this.length;
};

/**
 * Exchanges two elements of the vector.
 * @param {int} i The first element that is to be exchanged.
 * @param {int} j The second element that is to be exchanged.
 */
JXG.Math.Vector.prototype.exchange = function(i, j) {
   var temp = this[i];
    
   this[i] = this[j];
   this[j] = temp; 
};

/**
 * Represents a matrix.
 * @constructor
 * @param {Array} elements An 2-dimensional array of numerical values containing the coefficients to be put into the vector.
 * @throws {JXG.DimensionMismatchException} If the rows of the matrix don't have all the same length.
 * @return JXG.Math.Vector
 */
JXG.Math.Matrix = function(elements) {
   this.length = 0;
   var oldLength = 0;
   var testLength = false;
    
   if((typeof elements != undefined) && (elements != null)) {
      
      for(var i=0; i<elements.length; i++) {
          this.push(new Array());
          
          if(testLength) {
             if(oldLength != elements[i].length) {
                this.length = 0;
                throw new JXG.DimensionMismatchException("Your array contains arrays with different lengths.");
             }
          }
                
          for(var j=0; j<elements[i].length; j++) {
             this[i].push(elements[i][j]);
          }
          
          oldLength = elements[i].length;
          testLength = true;
      }
   }
};

/*
 * The base class for Matrix is also just an array.
 */
JXG.Math.Matrix.prototype = new Array();

/**
 * Returns the amount of rows of the matrix.
 * @type int
 */
JXG.Math.Matrix.prototype.m = function() {
    return this.length;
};

/**
 * Returns the amount of columns of the matrix.
 * @type int
 */
JXG.Math.Matrix.prototype.n = function() {
    if(this.length > 0)
        return this[0].length;
    else
        return 0;
};

/**
 * Exchanges two rows of the matrix.
 * @param {int} i The first row that is to be exchanged.
 * @param {int} j The second row that is to be exchanged.
 */
JXG.Math.Matrix.prototype.exchangeRows = function(i, j) {
   var temp = this[i];
    
   this[i] = this[j];
   this[j] = temp; 
};

/**
 * Exception signaling inconsistent dimension conditions.
 * @constructor
 * @param {string} message A message which explains what went wrong-
 */
JXG.DimensionMismatchException = function(message) {
   if((typeof message != undefined) && (message != null))
      this.message = message;
   else
      this.message = null;
};

/**
 * Returns a string explaining, what exactly went wrong.
 * @type string
 * @return A string explaining why this exception was raised.
 */
JXG.DimensionMismatchException.prototype.what = function() {
   var default_msg = "Matrix has incorrect dimensions";
   
   if(this.message != null)
      return default_msg + ": " + this.message + ".";
   else
      return default_msg + ".";
};

/**
 * Exception signaling an singular matrix.
 * @constructor
 * @param {string} message A message which explains what exactly went wrong-
 */
JXG.SingularMatrixException = function(message) {
   if((typeof message != undefined) && (message != null))
      this.message = message;
   else
      this.message = null;
};

/**
 * Returns a string explaining, what exactly went wrong.
 * @type string
 * @return A string explaining why this exception was raised.
 */
JXG.SingularMatrixException.prototype.what = function() {
   var default_msg = "Matrix is singular";
   
   if(this.message != null)
      return default_msg + ": " + this.message + ".";
   else
      return default_msg + ".";
};

