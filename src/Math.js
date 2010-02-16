/*
    Copyright 2008,2009
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
 
 /**
  * Math namespace.
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
    var i;
    this.length = 0;
    
    if((typeof elements != undefined) && (elements != null)) {
        for(i=0; i<elements.length; i++) {
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
    var oldLength = 0,
        testLength = false,
        i, j, len, leni;
    
    this.length = 0;
    
    if ((typeof elements != undefined) && (elements != null)) {
        len = elements.length;
        for (i=0; i<len; i++) {
            leni = elements[i].length;
            this.push(new Array());
          
            if (testLength) {
                if (oldLength != leni) {
                    this.length = 0;
                    throw new JXG.DimensionMismatchException("Your array contains arrays with different lengths.");
                }
            }
                
            for (j=0; j<leni; j++) {
                this[i].push(elements[i][j]);
            }
          
            oldLength = leni;
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
    if ((typeof message != undefined) && (message != null))
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
   
    if (this.message != null)
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
    if ((typeof message != undefined) && (message != null))
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
   
    if (this.message != null)
        return default_msg + ": " + this.message + ".";
    else
        return default_msg + ".";
};


/**
 * Matrix-vector multiplication.
 * @param {Array} mat1 Two dimensional array of numbers
 * @param {Array} vec Array of numbers
 * @return {Array} Array of numbers containing result
 */
JXG.Math.matVecMult = function(/** array */ mat1, /** array */ vec) /** array */ {
    var m = mat1.length,
        n = vec.length,
        res = [],
        i, s, k;
    if (n==3) {
        for (i=0;i<m;i++) {
            res[i] = mat1[i][0]*vec[0] + mat1[i][1]*vec[1] + mat1[i][2]*vec[2];
        }
    } else {
        for (i=0;i<m;i++) {
            s = 0;
            for (k=0;k<n;k++) { s += mat1[i][k]*vec[k]; }
            res[i] = s;
        }
    }
    return res;
};

/**
 * Matrix-matrix multiplication.
 * @param {Array} mat1 Two dimensional array of numbers
 * @param {Array} mat2 Two dimensional array of numbers
 * @return {Array} Two dimensional Array of numbers containing result
 */
JXG.Math.matMatMult = function(/** array */ mat1, /** array */ mat2) /** array */ {
    var m = mat1.length,
        n = mat2[0].length,
        m2 = mat2.length,
        res = [], 
        i, j, s, k;
        
    for (i=0;i<m;i++) {
        res[i] = [];
    }

    for (i=0;i<m;i++) {
        for (j=0;j<n;j++) {
            s = 0;
            for (k=0;k<m2;k++) {
                s += mat1[i][k]*mat2[k][j];
            }
            res[i][j] = s;
        }
    }
    return res;
};

/**
 * Transpose a matrix which is of type array of arrays.
 * @param {Array} M 
 * @return {Array} transpose of M
 */
JXG.Math.Matrix.transpose = function(/** Array */ M) /** Array*/  {
    var MT = [], i, j, 
        m, n;
    
    m = M.length;                   // number of rows of M
    n = (M.length>0)?M[0].length:0; // number of columns of M

    for (i=0;i<n;i++) {
        MT.push([]);
        for (j=0;j<m;j++) {
            MT[i].push(M[j][i]);
        }
    }
    return MT;
}

/**
  * Calculates the crossproducts of two vectors
  * of length three.
  * In case of homogeneous coordinates this is either
  * - the intersection of two lines
  * - the line through two points.
  * @param {Array} c1 homogeneous coordinates of line (point) 1
  * @param {Array} c2 homogeneous coordinates of line (point) 2
  * @type Array
  * @return vector of length 3:  homogeneous coordinates
  *   of the resulting line / point.
  */
JXG.Math.crossProduct = function(c1,c2) {
    return [c1[1]*c2[2]-c1[2]*c2[1],
            c1[2]*c2[0]-c1[0]*c2[2],
            c1[0]*c2[1]-c1[1]*c2[0]];
};

/**
 * Inner product of two vectors a, b. n is the length of the vectors.
 * @param a Vector
 * @param b Vector
 * @param [n] Length of the Vectors. If not given the length of the first vector is taken.
 * @return The inner product of a and b.
 */
JXG.Math.innerProduct = function(a, b, n) {    
    var i, s = 0;
    
    if(typeof n == 'undefined')
        n = a.length;
    
    for (i=0;i<n;i++) {
        s += a[i]*b[i];
    }
    return s;
};



/**
* Dynamic programming approach for recursive functions.
* From "Speed up your JavaScript, Part 3" by Nicholas C. Zakas.
* @see JXG.Math.factorial
* http://blog.thejit.org/2008/09/05/memoization-in-javascript/
*/
JXG.memoizer = function (f) {
    var cache, join;
    
    if (f.memo) {
        return f.memo;
    }
    cache = {};
    join = Array.prototype.join;

    return (f.memo = function() {
        var key = join.call(arguments);
        //return (key in cache)
        return (typeof cache[key]!='undefined') // Seems to be a bit faster than "if (a in b)"
            ? cache[key]
            : cache[key] = f.apply(this, arguments);
    });
};

/**
* Compute the factorial of a positive integer.
* @param {integer n}
* @return {return n*(n-1)...2*1}
*/
JXG.Math.factorial = JXG.memoizer(function (n) {
        if (n<0) return NaN; 
        if (n==0 || n==1) return 1;
        return n*arguments.callee(n-1);
});

/**
* Comupte the binomial coefficient.
* @param {integer n}
* @param {integer k}
* 
* @return {n\choose k}
*/
JXG.Math.binomial = JXG.memoizer(function(n,k) {
    var b, i;
    
    if (k>n || k<0) return 0;
    if (k==0 || k==n) return 1;
    
    b = 1;
    for (i=0;i<k;i++) {
        b *= (n-i);
        b /= (i+1);
    }
    return b;
    //return arguments.callee(n-1,k-1)+arguments.callee(n-1,k);
});

/*
    // Just for test purposes;
    
JXG.Math.Numerics.prototype.fibonacci = JXG.memoizer(function (n) {
        if(n < 2) return 1; else return arguments.callee(n-2) + arguments.callee(n-1);  
    });
*/    

/**
* Round a decimal number to n decimal places
* @deprecated Use (number).toFixed(n) instead.
* @param {float num} Number to round
* @param {integer n} number of digits after the point to leave
* 
* @return {rounded num}
*/
JXG.Math.round = function(num, n) {
    var z, s;
    //return Math.round(num*Math.pow(10,n))/Math.pow(10,n);
    //var z = num.toFixed(n);
    
    z = num - Math.ceil(num);
    s = z.toString();
    if (z < 0) {
        s = s.substr(0,n+3);
    }
    else {
        s = s.substr(0,n+2);
    }
    z = parseFloat(s);
    t = parseInt(num.toString());
    return t+z;
};

/**
 * Cosine hyperbolicus of x.
 * @param {float} x The number the cosine hyperbolicus will be calculated of.
 * @return {float} Cosine hyperbolicus of the given value.
 */
JXG.Math.cosh = function(/** number */ x) /** number */ {
    return (Math.exp(x)+Math.exp(-x))*0.5;
};

/**
 * Sine hyperbolicus of x.
 * @param {number} x The number the sine hyperbolicus will be calculated of.
 * @return {number} Sine hyperbolicus of the given value.
 */
JXG.Math.sinh = function(/** number */ x) /** number */ {
    return (Math.exp(x)-Math.exp(-x))*0.5;
};

