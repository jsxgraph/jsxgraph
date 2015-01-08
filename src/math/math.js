/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, Float32Array: true */
/*jslint nomen: true, plusplus: true, bitwise: true*/

/* depends:
 jxg
 */

/**
 * @fileoverview In this file the namespace JXG.Math is defined, which is the base namespace
 * for namespaces like Math.Numerics, Math.Algebra, Math.Statistics etc.
 */

define(['jxg', 'utils/type'], function (JXG, Type) {

    "use strict";

    var undef,

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
        memoizer = function (f) {
            var cache, join;

            if (f.memo) {
                return f.memo;
            }

            cache = {};
            join = Array.prototype.join;

            f.memo = function () {
                var key = join.call(arguments);

                // Seems to be a bit faster than "if (a in b)"
                return (cache[key] !== undef) ?
                        cache[key] :
                        cache[key] = f.apply(this, arguments);
            };

            return f.memo;
        };

    /**
     * Math namespace.
     * @namespace
     */
    JXG.Math = {
        /**
         * eps defines the closeness to zero. If the absolute value of a given number is smaller
         * than eps, it is considered to be equal to zero.
         * @type number
         */
        eps: 0.000001,

        /**
         * The JavaScript implementation of the % operator returns the symmetric modulo.
         * They are both identical if a >= 0 and m >= 0 but the results differ if a or m < 0.
         * @param {Number} a
         * @param {Number} m
         * @returns {Number} Mathematical modulo <tt>a mod m</tt>
         */
        mod: function (a, m) {
            return a - Math.floor(a / m) * m;
        },

        /**
         * Initializes a vector as an array with the coefficients set to the given value resp. zero.
         * @param {Number} n Length of the vector
         * @param {Number} [init=0] Initial value for each coefficient
         * @returns {Array} A <tt>n</tt> times <tt>m</tt>-matrix represented by a
         * two-dimensional array. The inner arrays hold the columns, the outer array holds the rows.
         */
        vector: function (n, init) {
            var r, i;

            init = init || 0;
            r = [];

            for (i = 0; i < n; i++) {
                r[i] = init;
            }

            return r;
        },

        /**
         * Initializes a matrix as an array of rows with the given value.
         * @param {Number} n Number of rows
         * @param {Number} [m=n] Number of columns
         * @param {Number} [init=0] Initial value for each coefficient
         * @returns {Array} A <tt>n</tt> times <tt>m</tt>-matrix represented by a
         * two-dimensional array. The inner arrays hold the columns, the outer array holds the rows.
         */
        matrix: function (n, m, init) {
            var r, i, j;

            init = init || 0;
            m = m || n;
            r = [];

            for (i = 0; i < n; i++) {
                r[i] = [];

                for (j = 0; j < m; j++) {
                    r[i][j] = init;
                }
            }

            return r;
        },

        /**
         * Generates an identity matrix. If n is a number and m is undefined or not a number, a square matrix is generated,
         * if n and m are both numbers, an nxm matrix is generated.
         * @param {Number} n Number of rows
         * @param {Number} [m=n] Number of columns
         * @returns {Array} A square matrix of length <tt>n</tt> with all coefficients equal to 0 except a_(i,i), i out of (1, ..., n), if <tt>m</tt> is undefined or not a number
         * or a <tt>n</tt> times <tt>m</tt>-matrix with a_(i,j) = 0 and a_(i,i) = 1 if m is a number.
         */
        identity: function (n, m) {
            var r, i;

            if ((m === undef) && (typeof m !== 'number')) {
                m = n;
            }

            r = this.matrix(n, m);

            for (i = 0; i < Math.min(n, m); i++) {
                r[i][i] = 1;
            }

            return r;
        },

        /**
         * Generates a 4x4 matrix for 3D to 2D projections.
         * @param {Number} l Left
         * @param {Number} r Right
         * @param {Number} t Top
         * @param {Number} b Bottom
         * @param {Number} n Near
         * @param {Number} f Far
         * @returns {Array} 4x4 Matrix
         */
        frustum: function (l, r, b, t, n, f) {
            var ret = this.matrix(4, 4);

            ret[0][0] = (n * 2) / (r - l);
            ret[0][1] = 0;
            ret[0][2] = (r + l) / (r - l);
            ret[0][3] = 0;

            ret[1][0] = 0;
            ret[1][1] = (n * 2) / (t - b);
            ret[1][2] = (t + b) / (t - b);
            ret[1][3] = 0;

            ret[2][0] = 0;
            ret[2][1] = 0;
            ret[2][2] = -(f + n) / (f - n);
            ret[2][3] = -(f * n * 2) / (f - n);

            ret[3][0] = 0;
            ret[3][1] = 0;
            ret[3][2] = -1;
            ret[3][3] = 0;

            return ret;
        },

        /**
         * Generates a 4x4 matrix for 3D to 2D projections.
         * @param {Number} fov Field of view in vertical direction, given in rad.
         * @param {Number} ratio Aspect ratio of the projection plane.
         * @param {Number} n Near
         * @param {Number} f Far
         * @returns {Array} 4x4 Projection Matrix
         */
        projection: function (fov, ratio, n, f) {
            var t = n * Math.tan(fov / 2),
                r = t * ratio;

            return this.frustum(-r, r, -t, t, n, f);
        },

        /**
         * Multiplies a vector vec to a matrix mat: mat * vec. The matrix is interpreted by this function as an array of rows. Please note: This
         * function does not check if the dimensions match.
         * @param {Array} mat Two dimensional array of numbers. The inner arrays describe the columns, the outer ones the matrix' rows.
         * @param {Array} vec Array of numbers
         * @returns {Array} Array of numbers containing the result
         * @example
         * var A = [[2, 1],
         *          [1, 3]],
         *     b = [4, 5],
         *     c;
         * c = JXG.Math.matVecMult(A, b)
         * // c === [13, 19];
         */
        matVecMult: function (mat, vec) {
            var i, s, k,
                m = mat.length,
                n = vec.length,
                res = [];

            if (n === 3) {
                for (i = 0; i < m; i++) {
                    res[i] = mat[i][0] * vec[0] + mat[i][1] * vec[1] + mat[i][2] * vec[2];
                }
            } else {
                for (i = 0; i < m; i++) {
                    s = 0;
                    for (k = 0; k < n; k++) {
                        s += mat[i][k] * vec[k];
                    }
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
        matMatMult: function (mat1, mat2) {
            var i, j, s, k,
                m = mat1.length,
                n = m > 0 ? mat2[0].length : 0,
                m2 = mat2.length,
                res = this.matrix(m, n);

            for (i = 0; i < m; i++) {
                for (j = 0; j < n; j++) {
                    s = 0;
                    for (k = 0; k < m2; k++) {
                        s += mat1[i][k] * mat2[k][j];
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
        transpose: function (M) {
            var MT, i, j,
                m, n;

            // number of rows of M
            m = M.length;
            // number of columns of M
            n = M.length > 0 ? M[0].length : 0;
            MT = this.matrix(n, m);

            for (i = 0; i < n; i++) {
                for (j = 0; j < m; j++) {
                    MT[i][j] = M[j][i];
                }
            }

            return MT;
        },

        /**
         * Compute the inverse of an nxn matrix with Gauss elimination.
         * @param {Array} Ain
         * @returns {Array} Inverse matrix of Ain
         */
        inverse: function (Ain) {
            var i, j, k, s, ma, r, swp,
                n = Ain.length,
                A = [],
                p = [],
                hv = [];

            for (i = 0; i < n; i++) {
                A[i] = [];
                for (j = 0; j < n; j++) {
                    A[i][j] = Ain[i][j];
                }
                p[i] = i;
            }

            for (j = 0; j < n; j++) {
                // pivot search:
                ma = Math.abs(A[j][j]);
                r = j;

                for (i = j + 1; i < n; i++) {
                    if (Math.abs(A[i][j]) > ma) {
                        ma = Math.abs(A[i][j]);
                        r = i;
                    }
                }

                // Singular matrix
                if (ma <= this.eps) {
                    return [];
                }

                // swap rows:
                if (r > j) {
                    for (k = 0; k < n; k++) {
                        swp = A[j][k];
                        A[j][k] = A[r][k];
                        A[r][k] = swp;
                    }

                    swp = p[j];
                    p[j] = p[r];
                    p[r] = swp;
                }

                // transformation:
                s = 1.0 / A[j][j];
                for (i = 0; i < n; i++) {
                    A[i][j] *= s;
                }
                A[j][j] = s;

                for (k = 0; k < n; k++) {
                    if (k !== j) {
                        for (i = 0; i < n; i++) {
                            if (i !== j) {
                                A[i][k] -= A[i][j] * A[j][k];
                            }
                        }
                        A[j][k] = -s * A[j][k];
                    }
                }
            }

            // swap columns:
            for (i = 0; i < n; i++) {
                for (k = 0; k < n; k++) {
                    hv[p[k]] = A[i][k];
                }
                for (k = 0; k < n; k++) {
                    A[i][k] = hv[k];
                }
            }

            return A;
        },

        /**
         * Inner product of two vectors a and b. n is the length of the vectors.
         * @param {Array} a Vector
         * @param {Array} b Vector
         * @param {Number} [n] Length of the Vectors. If not given the length of the first vector is taken.
         * @returns {Number} The inner product of a and b.
         */
        innerProduct: function (a, b, n) {
            var i,
                s = 0;

            if ((n === undef) || (typeof n !== 'number')) {
                n = a.length;
            }

            for (i = 0; i < n; i++) {
                s += a[i] * b[i];
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
        crossProduct: function (c1, c2) {
            return [c1[1] * c2[2] - c1[2] * c2[1],
                c1[2] * c2[0] - c1[0] * c2[2],
                c1[0] * c2[1] - c1[1] * c2[0]];
        },

        /**
         * Compute the factorial of a positive integer. If a non-integer value
         * is given, the fraction will be ignored.
         * @function
         * @param {Number} n
         * @returns {Number} n! = n*(n-1)*...*2*1
         */
        factorial: memoizer(function (n) {
            if (n < 0) {
                return NaN;
            }

            n = Math.floor(n);

            if (n === 0 || n === 1) {
                return 1;
            }

            return n * this.factorial(n - 1);
        }),

        /**
         * Computes the binomial coefficient n over k.
         * @function
         * @param {Number} n Fraction will be ignored
         * @param {Number} k Fraction will be ignored
         * @returns {Number} The binomial coefficient n over k
         */
        binomial: memoizer(function (n, k) {
            var b, i;

            if (k > n || k < 0) {
                return NaN;
            }

            k = Math.round(k);
            n = Math.round(n);

            if (k === 0 || k === n) {
                return 1;
            }

            b = 1;

            for (i = 0; i < k; i++) {
                b *= (n - i);
                b /= (i + 1);
            }

            return b;
        }),

        /**
         * Calculates the cosine hyperbolicus of x.
         * @param {Number} x The number the cosine hyperbolicus will be calculated of.
         * @returns {Number} Cosine hyperbolicus of the given value.
         */
        cosh: function (x) {
            return (Math.exp(x) + Math.exp(-x)) * 0.5;
        },

        /**
         * Sine hyperbolicus of x.
         * @param {Number} x The number the sine hyperbolicus will be calculated of.
         * @returns {Number} Sine hyperbolicus of the given value.
         */
        sinh: function (x) {
            return (Math.exp(x) - Math.exp(-x)) * 0.5;
        },

        /**
         * Compute base to the power of exponent.
         * @param {Number} base
         * @param {Number} exponent
         * @returns {Number} base to the power of exponent.
         */
        pow: function (base, exponent) {
            if (base === 0) {
                if (exponent === 0) {
                    return 1;
                }

                return 0;
            }

            if (Math.floor(exponent) === exponent) {
                // a is an integer
                return Math.pow(base, exponent);
            }

            // a is not an integer
            if (base > 0) {
                return Math.exp(exponent * Math.log(Math.abs(base)));
            }

            return NaN;
        },

        /**
         * Logarithm to base 10.
         * @param {Number} x
         * @returns {Number} log10(x) Logarithm of x to base 10.
         */
        log10: function (x) {
            return Math.log(x) / Math.log(10.0);
        },

        /**
         * Logarithm to base 2.
         * @param {Number} x
         * @returns {Number} log2(x) Logarithm of x to base 2.
         */
        log2: function (x) {
            return Math.log(x) / Math.log(2.0);
        },

        /**
         * Logarithm to arbitrary base b. If b is not given, natural log is taken, i.e. b = e.
         * @param {Number} x
         * @param {Number} b base
         * @returns {Number} log(x, b) Logarithm of x to base b, that is log(x)/log(b).
         */
        log: function (x, b) {
            if (typeof b !== 'undefined' && Type.isNumber(b)) {
                return Math.log(x) / Math.log(b);
            } else {
                return Math.log(x);
            }
        },

        /**
         * A square & multiply algorithm to compute base to the power of exponent.
         * Implementated by Wolfgang Riedl.
         * @param {Number} base
         * @param {Number} exponent
         * @returns {Number} Base to the power of exponent
         */
        squampow: function (base, exponent) {
            var result;

            if (Math.floor(exponent) === exponent) {
                // exponent is integer (could be zero)
                result = 1;

                if (exponent < 0) {
                    // invert: base
                    base = 1.0 / base;
                    exponent *= -1;
                }

                while (exponent !== 0) {
                    if (exponent & 1) {
                        result *= base;
                    }

                    exponent >>= 1;
                    base *= base;
                }
                return result;
            }

            return this.pow(base, exponent);
        },

        /**
         * Normalize the standard form [c, b0, b1, a, k, r, q0, q1].
         * @private
         * @param {Array} stdform The standard form to be normalized.
         * @returns {Array} The normalized standard form.
         */
        normalize: function (stdform) {
            var n, signr,
                a2 = 2 * stdform[3],
                r = stdform[4] / a2;

            stdform[5] = r;
            stdform[6] = -stdform[1] / a2;
            stdform[7] = -stdform[2] / a2;

            if (!isFinite(r)) {
                n = Math.sqrt(stdform[1] * stdform[1] + stdform[2] * stdform[2]);

                stdform[0] /= n;
                stdform[1] /= n;
                stdform[2] /= n;
                stdform[3] = 0;
                stdform[4] = 1;
            } else if (Math.abs(r) >= 1) {
                stdform[0] = (stdform[6] * stdform[6] + stdform[7] * stdform[7] - r * r) / (2 * r);
                stdform[1] = -stdform[6] / r;
                stdform[2] = -stdform[7] / r;
                stdform[3] = 1 / (2 * r);
                stdform[4] = 1;
            } else {
                signr = (r <= 0 ? -1 : 1);
                stdform[0] = signr * (stdform[6] * stdform[6] + stdform[7] * stdform[7] - r * r) * 0.5;
                stdform[1] = -signr * stdform[6];
                stdform[2] = -signr * stdform[7];
                stdform[3] = signr / 2;
                stdform[4] = signr * r;
            }

            return stdform;
        },

        /**
         * Converts a two dimensional array to a one dimensional Float32Array that can be processed by WebGL.
         * @param {Array} m A matrix in a two dimensional array.
         * @returns {Float32Array} A one dimensional array containing the matrix in column wise notation. Provides a fall
         * back to the default JavaScript Array if Float32Array is not available.
         */
        toGL: function (m) {
            var v, i, j;

            if (typeof Float32Array === 'function') {
                v = new Float32Array(16);
            } else {
                v = new Array(16);
            }

            if (m.length !== 4 && m[0].length !== 4) {
                return v;
            }

            for (i = 0; i < 4; i++) {
                for (j = 0; j < 4; j++) {
                    v[i + 4 * j] = m[i][j];
                }
            }

            return v;
        }
    };

    return JXG.Math;
});
