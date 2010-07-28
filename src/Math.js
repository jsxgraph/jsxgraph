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
JXG.Math = (function() {

    /*
     * Dynamic programming approach for recursive functions.
     * From "Speed up your JavaScript, Part 3" by Nicholas C. Zakas.
     * @see JXG.Math.factorial
     * @see JXG.Math.binomial
     * http://blog.thejit.org/2008/09/05/memoization-in-javascript/
     *
     * This method is hidden, because it is only used in JXG.Math. If someone wants
     * to use it in JSXGraph outside of JXG.Math, it should be moved to jsxgraph.js
     */
    var memoizer = function (f) {
        var cache, join;

        if (f.memo) {
            return f.memo;
        }
        cache = {};
        join = Array.prototype.join;

        return (f.memo = function() {
            var key = join.call(arguments);

            return (cache[key] !== JXG.undefined) // Seems to be a bit faster than "if (a in b)"
                    ? cache[key]
                    : cache[key] = f.apply(this, arguments);
        });
    };

    /** @lends JXG.Math */
    return {
        /**
         * eps defines the closeness to zero. If the absolute value of a given number is smaller
         * than eps, it is considered to be equal to zero.
         * @type number
         */
        eps: 0.000001,

        /**
         * Initializes a matrix as an array of rows with the given value.
         * @param {Number} n Number of rows
         * @param {Number} m Number of columns
         * @param {Number} [init=0] Initial value for each coefficient
         * @returns {Array} A <tt>n</tt> times <tt>m</tt>-matrix represented by a
         * two-dimensional array. The inner arrays hold the columns, the outer array holds the rows.
         */
        matrix: function(n, m, init) {
            var r, i, j;

            init = init || 0;

            r = new Array(Math.ceil(n));
            for(i=0; i<n; i++) {
                r[i] = new Array(Math.ceil(m));
                for(j=0; j<m; j++) {
                    r[i][j] = init;
                }
            }

            return r;
        },

        /**
         * Generates an identity vector or an identity matrix, based on what is given. If n is a number and m is undefined or not a number, a vector is generated,
         * if n and m are both numbers, an identity matrix is generated.
         * @param {Number} n Size of the resulting vector or the number of rows
         * @param {Number} [m] Number of columns
         * @returns {Array} A vector of length <tt>n</tt> with all coefficients equal to 1, if <tt>m</tt> is undefined or not a number
         * or a <tt>n</tt> times <tt>m</tt>-matrix with a_(i,j) = 0 and a_(i,i) = 1 if m is a number.
         */
        identity: function(n, m) {
            var r, i;

            if((m === JXG.undefined) && (typeof m !== 'number')) {
                r = new Array(Math.ceil(n));
                for(i=0; i<n; i++) { r[i] = 1; }
                return r;
            }

            r = JXG.Math.matrix(n, m);
            for(i=0; i<Math.min(n, m); i++) {
                r[i][i] = 1;
            }

            return r;
        },

        /**
         * Multiplies a vector vec to a matrix mat: mat * vec. The matrix is interpreted by this function as an array of rows. Please note: This
         * function does not check if the dimensions match.
         * @param {Array} mat Two dimensional array of numbers. The inner arrays describe the columns, the outer ones the matrix' rows.
         * @param {Array} vec Array of numbers
         * @returns {Array} Array of numbers containing the result
         * @example
         * var A = [[2, 1],
         *              [1, 3]],
         *     b = [4, 5],
         *     c;
         * c = JXG.Math.matVecMult(A, b)
         * // c === [13, 19];
         */
        matVecMult: function(mat, vec) {
            var m = mat.length,
                    n = vec.length,
                    res = [],
                    i, s, k;

            if (n===3) {
                for (i=0;i<m;i++) {
                    res[i] = mat[i][0]*vec[0] + mat[i][1]*vec[1] + mat[i][2]*vec[2];
                }
            } else {
                for (i=0;i<m;i++) {
                    s = 0;
                    for (k=0;k<n;k++) { s += mat[i][k]*vec[k]; }
                    res[i] = s;
                }
            }
            return res;
        },

        /**
         * Computes the product of the two matrices mat1*mat2.
         * @param {Array} mat1 Two dimensional array of numbers
         * @param {Array} mat2 Two dimensional array of numbers
         * @returns {Array} Two dimensional Array of numbers containing result
         */
        matMatMult: function(mat1, mat2) {
            var m = mat1.length,
                    n = m>0 ? mat2[0].length : 0,
                    m2 = mat2.length,
                    res = JXG.Math.matrix(m,n),
                    i, j, s, k;

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
        },

        /**
         * Transposes a matrix given as a two dimensional array.
         * @param {Array} M The matrix to be transposed
         * @returns {Array} The transpose of M
         */
        matTranspose: function(M) {
            var MT, i, j,
                    m, n;

            m = M.length;                     // number of rows of M
            n = M.length>0 ? M[0].length : 0; // number of columns of M
            MT = JXG.Math.matrix(n,m);

            for (i=0; i<n; i++) {
                for (j=0;j<m;j++) {
                    MT[i][j] = M[j][i];
                }
            }
            return MT;
        },

        /**
         * Inner product of two vectors a and b. n is the length of the vectors.
         * @param {Array} a Vector
         * @param {Array} b Vector
         * @param {Number} [n] Length of the Vectors. If not given the length of the first vector is taken.
         * @return The inner product of a and b.
         */
        innerProduct: function(a, b, n) {
            var i, s = 0;

            if((n === JXG.undefined) || (typeof n !== 'number')) {
                n = a.length;
            }

            for (i=0; i<n; i++) {
                s += a[i]*b[i];
            }
            
            return s;
        },

        /**
         * Calculates the cross product of two vectors both of length three.
         * In case of homogeneous coordinates this is either
         * <ul>
         * <li>the intersection of two lines</li>
         * <li>the line through two points</li>
         * </ul>
         * @param {Array} c1 Homogeneous coordinates of line or point 1
         * @param {Array} c2 Homogeneous coordinates of line or point 2
         * @returns {Array} vector of length 3: homogeneous coordinates of the resulting point / line.
         */
        crossProduct: function(c1,c2) {
            return [c1[1]*c2[2]-c1[2]*c2[1],
                c1[2]*c2[0]-c1[0]*c2[2],
                c1[0]*c2[1]-c1[1]*c2[0]];
        },

        /**
         * Compute the factorial of a positive integer. If a non-integer value
         * is given, the fraction will be ignored.
         * @function
         * @param {Number} n
         * @returns {Number} n! = n*(n-1)*...*2*1
         */
        factorial: memoizer(function (n) {
            if (n<0) return NaN;
            n = Math.floor(n);
            if (n===0 || n===1) return 1;
            return n*arguments.callee(n-1);
        }),

        /**
         * Computes the binomial coefficient n over k.
         * @function
         * @param {Number} n Fraction will be ignored
         * @param {Number} k Fraction will be ignored
         * @returns {Number} The binomial coefficient n over k
         */
        binomial: memoizer(function(n,k) {
            var b, i;

            if (k>n || k<0) return NaN;

            k = Math.floor(k);
            n = Math.floor(n);

            if (k===0 || k===n) return 1;

            b = 1;
            for (i=0; i<k; i++) {
                b *= (n-i);
                b /= (i+1);
            }
            return b;
        }),

        /**
         * Calculates the cosine hyperbolicus of x.
         * @param {Number} x The number the cosine hyperbolicus will be calculated of.
         * @returns {Number} Cosine hyperbolicus of the given value.
         */
        cosh: function(x) {
            return (Math.exp(x)+Math.exp(-x))*0.5;
        },

        /**
         * Sine hyperbolicus of x.
         * @param {Number} x The number the sine hyperbolicus will be calculated of.
         * @returns {Number} Sine hyperbolicus of the given value.
         */
        sinh: function(x) {
            return (Math.exp(x)-Math.exp(-x))*0.5;
        },

        /**
         * Compute x to the power of a.
         * @param {Number} x Base
         * @param {Number} a Exponent
         * @returns {Number} x to the power of a.
         */
        pow: function(x, a) {
            if (x===0) {
                if (a===0) {
                    return 1;
                } else {
                    return 0;
                }
            }

            if (Math.floor(a)===a) {// a is an integer
                return Math.pow(x,a);
            } else { // a is not an integer
                if (x>0) {
                    return Math.exp(a*Math.log(Math.abs(x)));
                } else {
                    return NaN;
                }
            }
        },

        /**
         * Normalize the standard form [c, b0, b1, a, k, r, q0, q1].
         * @private
         * @param {Array} stdform The standard form to be normalized.
         * @returns {Array} The normalized standard form.
         */
        normalize: function(stdform) {
            var a2 = 2*stdform[3],
                    r = stdform[4]/(a2),  // k/(2a)
                    n, signr;
            stdform[5] = r;
            stdform[6] = -stdform[1]/a2;
            stdform[7] = -stdform[2]/a2;
            if (r===Infinity || isNaN(r)) {
                n = Math.sqrt(stdform[1]*stdform[1]+stdform[2]*stdform[2]);
                stdform[0] /= n;
                stdform[1] /= n;
                stdform[2] /= n;
                stdform[3] = 0;
                stdform[4] = 1;
            } else if (Math.abs(r)>=1) {
                stdform[0] = (stdform[6]*stdform[6]+stdform[7]*stdform[7]-r*r)/(2*r);
                stdform[1] = -stdform[6]/r;
                stdform[2] = -stdform[7]/r;
                stdform[3] = 1/(2*r);
                stdform[4] = 1;
            } else {
                signr = (r<=0)?(-1):(1/*(r==0)?0:1*/);
                stdform[0] = signr*(stdform[6]*stdform[6]+stdform[7]*stdform[7]-r*r)*0.5;
                stdform[1] = -signr*stdform[6];
                stdform[2] = -signr*stdform[7];
                stdform[3] = signr/2;
                stdform[4] = signr*r;
            }
            return stdform;
        }
    }; // JXG.Math
})();






