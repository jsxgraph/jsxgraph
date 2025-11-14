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

/*global JXG: true, define: true, Float32Array: true */
/*jslint nomen: true, plusplus: true, bitwise: true*/

/**
 * @fileoverview In this file the namespace JXG.Math is defined, which is the base namespace
 * for namespaces like JXG.Math.Numerics, JXG.Math.Plot, JXG.Math.Statistics, JXG.Math.Clip etc.
 */
import JXG from "../jxg.js";
import Type from "../utils/type.js";

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
            return cache[key] !== undef ? cache[key] : (cache[key] = f.apply(this, arguments));
        };

        return f.memo;
    };

/**
 * Math namespace. Contains mathematics related methods which are
 * specific to JSXGraph or which extend the JavaScript Math class.
 * @namespace
 */
JXG.Math = {
    /**
     * eps defines the closeness to zero. If the absolute value of a given number is smaller
     * than eps, it is considered to be equal to zero.
     * @type Number
     */
    eps: 0.000001,

    /**
     * Determine the relative difference between two numbers.
     * @param  {Number} a First number
     * @param  {Number} b Second number
     * @returns {Number}  Relative difference between a and b: |a-b| / max(|a|, |b|)
     */
    relDif: function (a, b) {
        var c = Math.abs(a),
            d = Math.abs(b);

        d = Math.max(c, d);

        return d === 0.0 ? 0.0 : Math.abs(a - b) / d;
    },

    /**
     * The JavaScript implementation of the % operator returns the symmetric modulo.
     * mod and "%" are both identical if a >= 0 and m >= 0 but the results differ if a or m < 0.
     * @param {Number} a
     * @param {Number} m
     * @returns {Number} Mathematical modulo <tt>a mod m</tt>
     */
    mod: function (a, m) {
        return a - Math.floor(a / m) * m;
    },

    /**
     * Translate <code>x</code> into the interval <code>[a, b)</code> by adding
     * a multiple of <code>b - a</code>.
     * @param {Number} x
     * @param {Number} a
     * @param {Number} b
     */
    wrap: function (x, a, b) {
        return a + this.mod(x - a, b - a);
    },

    /**
     * Clamp <code>x</code> within the interval <code>[a, b]</code>. If
     * <code>x</code> is below <code>a</code>, increase it to <code>a</code>. If
     * it's above <code>b</code>, decrease it to <code>b</code>.
     */
    clamp: function (x, a, b) {
        return Math.min(Math.max(x, a), b);
    },

    /**
     * A way of clamping a periodic variable. If <code>x</code> is congruent mod
     * <code>period</code> to a point in <code>[a, b]</code>, return that point.
     * Otherwise, wrap it into <code>[mid - period/2, mid + period/2]</code>,
     * where <code>mid</code> is the mean of <code>a</code> and <code>b</code>,
     * and then clamp it to <code>[a, b]</code> from there.
     */
    wrapAndClamp: function (x, a, b, period) {
        var mid = 0.5 * (a + b),
            half_period = 0.5 * period;

        return this.clamp(
            this.wrap(
                x,
                mid - half_period,
                mid + half_period
            ),
            a,
            b
        );
    },

    /**
     * Initializes a vector of size <tt>n</tt> wih coefficients set to the init value (default 0)
     * @param {Number} n Length of the vector
     * @param {Number} [init=0] Initial value for each coefficient
     * @returns {Array} An array of length <tt>n</tt>
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

        if (m === undef && typeof m !== 'number') {
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
     * Multiplies a vector vec to a matrix mat: mat * vec. The matrix is interpreted by this function as an array of rows.
     * Please note: This
     * function does not check if the dimensions match.
     * @param {Array} mat Two-dimensional array of numbers. The inner arrays describe the columns, the outer ones the matrix' rows.
     * @param {Array} vec Array of numbers
     * @returns {Array} Array of numbers containing the result
     * @example
     * var A = [[2, 1],
     *          [2, 3]],
     *     b = [4, 5],
     *     c;
     * c = JXG.Math.matVecMult(A, b);
     * // c === [13, 23];
     */
    matVecMult: function (mat, vec) {
        var i, k, s,
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
     * Multiplies a vector vec to a matrix mat from the left: vec * mat.
     * The matrix is interpreted by this function as an array of rows.
     * Please note: This function does not check if the dimensions match.
     * @param {Array} vec Array of numbers
     * @param {Array} mat Two-dimensional array of numbers. The inner arrays describe the columns,
     *  the outer ones the matrix' rows.
     * @returns {Array} Array of numbers containing the result
     * @example
     * var A = [[2, 1],
     *          [2, 3]],
     *     b = [4, 5],
     *     c;
     * c = JXG.Math.vecMatMult(b, A);
     * // c === [18, 16];
     */
    vecMatMult: function (vec, mat) {
        var i, k, s,
            m = mat.length,
            n = vec.length,
            res = [];

        if (n === 3) {
            for (i = 0; i < m; i++) {
                res[i] = vec[0] * mat[0][i] + vec[1] * mat[1][i] + vec[2] * mat[2][i];
            }
        } else {
            for (i = 0; i < n; i++) {
                s = 0;
                for (k = 0; k < m; k++) {
                    s += vec[k] * mat[k][i];
                }
                res[i] = s;
            }
        }
        return res;
    },

    /**
     * Computes the product of the two matrices: mat1 * mat2.
     * Returns a new matrix array.
     *
     * @param {Array} mat1 Two-dimensional array of numbers
     * @param {Array} mat2 Two-dimensional array of numbers
     * @returns {Array} Two-dimensional Array of numbers containing result
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
     * Multiply a matrix mat by a scalar alpha: mat * scalar
     *
     * @param {Array} mat Two-dimensional array of numbers
     * @param {Number} alpha Scalar
     * @returns {Array} Two-dimensional Array of numbers containing result
     */
    matNumberMult: function (mat, alpha) {
        var i, j,
            m = mat.length,
            n = m > 0 ? mat[0].length : 0,
            res = this.matrix(m, n);

        for (i = 0; i < m; i++) {
            for (j = 0; j < n; j++) {
                res[i][j] = mat[i][j] * alpha;
            }
        }
        return res;
    },

    /**
     * Compute the sum of two matrices: mat1 + mat2.
     * Returns a new matrix object.
     *
     * @param {Array} mat1 Two-dimensional array of numbers
     * @param {Array} mat2 Two-dimensional array of numbers
     * @returns {Array} Two-dimensional Array of numbers containing result
     */
    matMatAdd: function (mat1, mat2) {
        var i, j,
            m = mat1.length,
            n = m > 0 ? mat1[0].length : 0,
            res = this.matrix(m, n);

        for (i = 0; i < m; i++) {
            for (j = 0; j < n; j++) {
                res[i][j] = mat1[i][j] + mat2[i][j];
            }
        }
        return res;
    },

    /**
     * Transposes a matrix given as a two-dimensional array.
     * @param {Array} M The matrix to be transposed
     * @returns {Array} The transpose of M
     */
    transpose: function (M) {
        var MT, i, j, m, n;

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
     * Compute the inverse of an <i>(n x n)</i>-matrix by Gauss elimination.
     *
     * @param {Array} A matrix
     * @returns {Array} Inverse matrix of A or empty array (i.e. []) in case A is singular.
     */
    inverse: function (Ain) {
        var i, j, k, r, s,
            eps = this.eps * this.eps,
            ma, swp,
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
            // Pivot search
            ma = Math.abs(A[j][j]);
            r = j;

            for (i = j + 1; i < n; i++) {
                if (Math.abs(A[i][j]) > ma) {
                    ma = Math.abs(A[i][j]);
                    r = i;
                }
            }

            // Singular matrix
            if (ma <= eps) {
                JXG.warn('JXG.Math.inverse: singular matrix');
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
     * Trace of a square matrix, given as a two-dimensional array.
     * @param {Array} M Square matrix
     * @returns {Number} The trace of M, NaN if M is not square.
     */
    trace: function (M) {
        var i, m, n,
            t = 0.0;

        // number of rows of M
        m = M.length;
        // number of columns of M
        n = M.length > 0 ? M[0].length : 0;
        if (m !== n) {
            return NaN;
        }
        for (i = 0; i < n; i++) {
            t += M[i][i];
        }

        return t;
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

        if (n === undef || !Type.isNumber(n)) {
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
        return [
            c1[1] * c2[2] - c1[2] * c2[1],
            c1[2] * c2[0] - c1[0] * c2[2],
            c1[0] * c2[1] - c1[1] * c2[0]
        ];
    },

    /**
     * Euclidean norm of a vector.
     *
     * @param {Array} a Array containing a vector.
     * @param {Number} n (Optional) length of the array.
     * @returns {Number} Euclidean norm of the vector.
     */
    norm: function (a, n) {
        var i,
            sum = 0.0;

        if (n === undef || !Type.isNumber(n)) {
            n = a.length;
        }

        for (i = 0; i < n; i++) {
            sum += a[i] * a[i];
        }

        return Math.sqrt(sum);
    },

    /**
     * Compute a * x + y for a scalar a and vectors x and y.
     *
     * @param {Number} a
     * @param {Array} x
     * @param {Array} y
     * @returns {Array}
     */
    axpy: function (a, x, y) {
        var i,
            le = x.length,
            p = [];
        for (i = 0; i < le; i++) {
            p[i] = a * x[i] + y[i];
        }
        return p;
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
            b *= n - i;
            b /= i + 1;
        }

        return b;
    }),

    /**
     * Calculates the cosine hyperbolicus of x.
     * @function
     * @param {Number} x The number the cosine hyperbolicus will be calculated of.
     * @returns {Number} Cosine hyperbolicus of the given value.
     */
    cosh:
        Math.cosh ||
        function (x) {
            return (Math.exp(x) + Math.exp(-x)) * 0.5;
        },

    /**
     * Sine hyperbolicus of x.
     * @function
     * @param {Number} x The number the sine hyperbolicus will be calculated of.
     * @returns {Number} Sine hyperbolicus of the given value.
     */
    sinh:
        Math.sinh ||
        function (x) {
            return (Math.exp(x) - Math.exp(-x)) * 0.5;
        },

    /**
     * Hyperbolic arc-cosine of a number.
     * @function
     * @param {Number} x
     * @returns {Number}
     */
    acosh:
        Math.acosh ||
        function (x) {
            return Math.log(x + Math.sqrt(x * x - 1));
        },

    /**
     * Hyperbolic arcsine of a number
     * @function
     * @param {Number} x
     * @returns {Number}
     */
    asinh:
        Math.asinh ||
        function (x) {
            if (x === -Infinity) {
                return x;
            }
            return Math.log(x + Math.sqrt(x * x + 1));
        },

    /**
     * Computes the cotangent of x.
     * @function
     * @param {Number} x The number the cotangent will be calculated of.
     * @returns {Number} Cotangent of the given value.
     */
    cot: function (x) {
        return 1 / Math.tan(x);
    },

    /**
     * Computes the inverse cotangent of x.
     * @param {Number} x The number the inverse cotangent will be calculated of.
     * @returns {Number} Inverse cotangent of the given value.
     */
    acot: function (x) {
        return (x >= 0 ? 0.5 : -0.5) * Math.PI - Math.atan(x);
    },

    /**
     * Compute n-th real root of a real number. n must be strictly positive integer.
     * If n is odd, the real n-th root exists and is negative.
     * For n even, for negative valuees of x NaN is returned
     * @param  {Number} x radicand. Must be non-negative, if n even.
     * @param  {Number} n index of the root. must be strictly positive integer.
     * @returns {Number} returns real root or NaN
     *
     * @example
     * nthroot(16, 4): 2
     * nthroot(-27, 3): -3
     * nthroot(-4, 2): NaN
     */
    nthroot: function (x, n) {
        var inv = 1 / n;

        if (n <= 0 || Math.floor(n) !== n) {
            return NaN;
        }

        if (x === 0.0) {
            return 0.0;
        }

        if (x > 0) {
            return Math.exp(inv * Math.log(x));
        }

        // From here on, x is negative
        if (n % 2 === 1) {
            return -Math.exp(inv * Math.log(-x));
        }

        // x negative, even root
        return NaN;
    },

    /**
     * Computes cube root of real number
     * Polyfill for Math.cbrt().
     *
     * @function
     * @param  {Number} x Radicand
     * @returns {Number} Cube root of x.
     */
    cbrt:
        Math.cbrt ||
        function (x) {
            return this.nthroot(x, 3);
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

        // exponent is an integer
        if (Math.floor(exponent) === exponent) {
            return Math.pow(base, exponent);
        }

        // exponent is not an integer
        if (base > 0) {
            return Math.exp(exponent * Math.log(base));
        }

        return NaN;
    },

    /**
     * Compute base to the power of the rational exponent m / n.
     * This function first reduces the fraction m/n and then computes
     * JXG.Math.pow(base, m/n).
     *
     * This function is necessary to have the same results for e.g.
     * (-8)^(1/3) = (-8)^(2/6) = -2
     * @param {Number} base
     * @param {Number} m numerator of exponent
     * @param {Number} n denominator of exponent
     * @returns {Number} base to the power of exponent.
     */
    ratpow: function (base, m, n) {
        var g;
        if (m === 0) {
            return 1;
        }
        if (n === 0) {
            return NaN;
        }

        g = this.gcd(m, n);
        return this.nthroot(this.pow(base, m / g), n / g);
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
        if (b !== undefined && Type.isNumber(b)) {
            return Math.log(x) / Math.log(b);
        }

        return Math.log(x);
    },

    /**
     * The sign() function returns the sign of a number, indicating whether the number is positive, negative or zero.
     *
     * @function
     * @param  {Number} x A Number
     * @returns {Number}  This function has 5 kinds of return values,
     *    1, -1, 0, -0, NaN, which represent "positive number", "negative number", "positive zero", "negative zero"
     *    and NaN respectively.
     */
    sign:
        Math.sign ||
        function (x) {
            x = +x; // convert to a number
            if (x === 0 || isNaN(x)) {
                return x;
            }
            return x > 0 ? 1 : -1;
        },

    /**
     * A square & multiply algorithm to compute base to the power of exponent.
     * Implementated by Wolfgang Riedl.
     *
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
     * Greatest common divisor (gcd) of two numbers.
     * See {@link <a href="https://rosettacode.org/wiki/Greatest_common_divisor#JavaScript">rosettacode.org</a>}.
     *
     * @param  {Number} a First number
     * @param  {Number} b Second number
     * @returns {Number}   gcd(a, b) if a and b are numbers, NaN else.
     */
    gcd: function (a, b) {
        var tmp,
            endless = true;

        a = Math.abs(a);
        b = Math.abs(b);

        if (!(Type.isNumber(a) && Type.isNumber(b))) {
            return NaN;
        }
        if (b > a) {
            tmp = a;
            a = b;
            b = tmp;
        }

        while (endless) {
            a %= b;
            if (a === 0) {
                return b;
            }
            b %= a;
            if (b === 0) {
                return a;
            }
        }
    },

    /**
     * Least common multiple (lcm) of two numbers.
     *
     * @param  {Number} a First number
     * @param  {Number} b Second number
     * @returns {Number}   lcm(a, b) if a and b are numbers, NaN else.
     */
    lcm: function (a, b) {
        var ret;

        if (!(Type.isNumber(a) && Type.isNumber(b))) {
            return NaN;
        }

        ret = a * b;
        if (ret !== 0) {
            return ret / this.gcd(a, b);
        }

        return 0;
    },

    /**
     * Special use of Math.round function to round not only to integers but also to chosen decimal values.
     *
     * @param {Number} value Value to be rounded.
     * @param {Number} step Distance between the values to be rounded to. (default: 1.0)
     * @param {Number} [min] If set, it will be returned the maximum of value and min.
     * @param {Number} [max] If set, it will be returned the minimum of value and max.
     * @returns {Number} Fitted value.
     */
    roundToStep: function (value, step, min, max) {
        var n = value,
            tmp, minOr0;

        // for performance
        if (!Type.exists(step) && !Type.exists(min) && !Type.exists(max)) {
            return n;
        }

        if (JXG.exists(max)) {
            n = Math.min(n, max);
        }
        if (JXG.exists(min)) {
            n = Math.max(n, min);
        }

        minOr0 = min || 0;

        if (JXG.exists(step)) {
            tmp = (n - minOr0) / step;
            if (Number.isInteger(tmp)) {
                return n;
            }

            tmp = Math.round(tmp);
            n = minOr0 + tmp * step;
        }

        if (JXG.exists(max)) {
            n = Math.min(n, max);
        }
        if (JXG.exists(min)) {
            n = Math.max(n, min);
        }

        return n;
    },

    /**
     *  Error function, see {@link https://en.wikipedia.org/wiki/Error_function}.
     *
     * @see JXG.Math.ProbFuncs.erf
     * @param  {Number} x
     * @returns {Number}
     */
    erf: function (x) {
        return this.ProbFuncs.erf(x);
    },

    /**
     * Complementary error function, i.e. 1 - erf(x).
     *
     * @see JXG.Math.erf
     * @see JXG.Math.ProbFuncs.erfc
     * @param  {Number} x
     * @returns {Number}
     */
    erfc: function (x) {
        return this.ProbFuncs.erfc(x);
    },

    /**
     * Inverse of error function
     *
     * @see JXG.Math.erf
     * @see JXG.Math.ProbFuncs.erfi
     * @param  {Number} x
     * @returns {Number}
     */
    erfi: function (x) {
        return this.ProbFuncs.erfi(x);
    },

    /**
     * Normal distribution function
     *
     * @see JXG.Math.ProbFuncs.ndtr
     * @param  {Number} x
     * @returns {Number}
     */
    ndtr: function (x) {
        return this.ProbFuncs.ndtr(x);
    },

    /**
     * Inverse of normal distribution function
     *
     * @see JXG.Math.ndtr
     * @see JXG.Math.ProbFuncs.ndtri
     * @param  {Number} x
     * @returns {Number}
     */
    ndtri: function (x) {
        return this.ProbFuncs.ndtri(x);
    },

    /**
     * Returns sqrt(a * a + b * b) for a variable number of arguments.
     * This is a naive implementation which might be faster than Math.hypot.
     * The latter is numerically more stable.
     *
     * @param {Number} a Variable number of arguments.
     * @returns Number
     */
    hypot: function () {
        var i, le, a, sum;

        le = arguments.length;
        for (i = 0, sum = 0.0; i < le; i++) {
            a = arguments[i];
            sum += a * a;
        }
        return Math.sqrt(sum);
    },

    /**
     * Heaviside unit step function. Returns 0 for x &lt;, 1 for x &gt; 0, and 0.5 for x == 0.
     *
     * @param {Number} x
     * @returns Number
     */
    hstep: function (x) {
        return (x > 0.0) ? 1 :
            ((x < 0.0) ? 0.0 : 0.5);
    },

    /**
     * Gamma function for real parameters by Lanczos approximation.
     * Implementation straight from {@link https://en.wikipedia.org/wiki/Lanczos_approximation}.
     *
     * @param {Number} z
     * @returns Number
     */
    gamma: function (z) {
        var x, y, t, i, le,
            g = 7,
            // n = 9,
            p = [
                1.0,
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];

        if (z < 0.5) {
            y = Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));  // Reflection formula
        } else {
            z -= 1;
            x = p[0];
            le = p.length;
            for (i = 1; i < le; i++) {
                x += p[i] / (z + i);
            }
            t = z + g + 0.5;
            y = Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
        }
        return y;
    },

    /* ********************  Comparisons and logical operators ************** */

    /**
     * Logical test: a < b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    lt: function (a, b) {
        return a < b;
    },

    /**
     * Logical test: a <= b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    leq: function (a, b) {
        return a <= b;
    },

    /**
     * Logical test: a > b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    gt: function (a, b) {
        return a > b;
    },

    /**
     * Logical test: a >= b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    geq: function (a, b) {
        return a >= b;
    },

    /**
     * Logical test: a === b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    eq: function (a, b) {
        return a === b;
    },

    /**
     * Logical test: a !== b?
     *
     * @param {Number} a
     * @param {Number} b
     * @returns {Boolean}
     */
    neq: function (a, b) {
        return a !== b;
    },

    /**
     * Logical operator: a && b?
     *
     * @param {Boolean} a
     * @param {Boolean} b
     * @returns {Boolean}
     */
    and: function (a, b) {
        return a && b;
    },

    /**
     * Logical operator: !a?
     *
     * @param {Boolean} a
     * @returns {Boolean}
     */
    not: function (a) {
        return !a;
    },

    /**
     * Logical operator: a || b?
     *
     * @param {Boolean} a
     * @param {Boolean} b
     * @returns {Boolean}
     */
    or: function (a, b) {
        return a || b;
    },

    /**
     * Logical operator: either a or b?
     *
     * @param {Boolean} a
     * @param {Boolean} b
     * @returns {Boolean}
     */
    xor: function (a, b) {
        return (a || b) && !(a && b);
    },

    /**
     *
     * Convert a floating point number to sign + integer + fraction.
     * fraction is given as nominator and denominator.
     * <p>
     * Algorithm: approximate the floating point number
     * by a continued fraction and simultaneously keep track
     * of its convergents.
     * Inspired by {@link https://kevinboone.me/rationalize.html}.
     *
     * @param {Number} x Number which is to be converted
     * @param {Number} [order=0.001] Small number determining the approximation precision.
     * @returns {Array} [sign, leading, nominator, denominator] where sign is 1 or -1.
     * @see JXG.toFraction
     *
     * @example
     * JXG.Math.decToFraction(0.33333333);
     * // Result: [ 1, 0, 1, 3 ]
     *
     * JXG.Math.decToFraction(0);
     * // Result: [ 1, 0, 0, 1 ]
     *
     * JXG.Math.decToFraction(-10.66666666666667);
     * // Result: [-1, 10, 2, 3 ]
    */
    decToFraction: function (x, order) {
        var lead, sign, a,
            n, n1, n2,
            d, d1, d2,
            it = 0,
            maxit = 20;

        order = Type.def(order, 0.001);

        // Round the number.
        // Otherwise, 0.999999999 would result in [0, 1, 1].
        x = Math.round(x * 1.e12) * 1.e-12;

        // Negative numbers:
        // The minus sign is handled in sign.
        sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);

        // From now on we consider x to be nonnegative.
        lead = Math.floor(x);
        x -= Math.floor(x);
        a = 0.0;
        n2 = 1.0;
        n = n1 = a;
        d2 = 0.0;
        d = d1 = 1.0;

        while (x - Math.floor(x) > order && it < maxit) {
            x = 1 / (x - a);
            a = Math.floor(x);
            n = n2 + a * n1;
            d = d2 + a * d1;
            n2 = n1;
            d2 = d1;
            n1 = n;
            d1 = d;
            it++;
        }
        return [sign, lead, n, d];
    },

    /* *************************** Normalize *************************** */

    /**
     * Normalize the standard form [c, b0, b1, a, k, r, q0, q1].
     * @private
     * @param {Array} stdform The standard form to be normalized.
     * @returns {Array} The normalized standard form.
     */
    normalize: function (stdform) {
        var n,
            signr,
            a2 = 2 * stdform[3],
            r = stdform[4] / a2;

        stdform[5] = r;
        stdform[6] = -stdform[1] / a2;
        stdform[7] = -stdform[2] / a2;

        if (!isFinite(r)) {
            n = this.hypot(stdform[1], stdform[2]);

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
            signr = r <= 0 ? -1 : 1;
            stdform[0] =
                signr * (stdform[6] * stdform[6] + stdform[7] * stdform[7] - r * r) * 0.5;
            stdform[1] = -signr * stdform[6];
            stdform[2] = -signr * stdform[7];
            stdform[3] = signr / 2;
            stdform[4] = signr * r;
        }

        return stdform;
    },

    /**
     * Converts a two-dimensional array to a one-dimensional Float32Array that can be processed by WebGL.
     * @param {Array} m A matrix in a two-dimensional array.
     * @returns {Float32Array} A one-dimensional array containing the matrix in column wise notation. Provides a fall
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
    },

    /**
     * Theorem of Vieta: Given a set of simple zeroes x_0, ..., x_n
     * of a polynomial f, compute the coefficients s_k, (k=0,...,n-1)
     * of the polynomial of the form. See {@link https://de.wikipedia.org/wiki/Elementarsymmetrisches_Polynom}.
     * <p>
     *  f(x) = (x-x_0)*...*(x-x_n) =
     *  x^n + sum_{k=1}^{n} (-1)^(k) s_{k-1} x^(n-k)
     * </p>
     * @param {Array} x Simple zeroes of the polynomial.
     * @returns {Array} Coefficients of the polynomial.
     *
     */
    Vieta: function (x) {
        var n = x.length,
            s = [],
            m,
            k,
            y;

        s = x.slice();
        for (m = 1; m < n; ++m) {
            y = s[m];
            s[m] *= s[m - 1];
            for (k = m - 1; k >= 1; --k) {
                s[k] += s[k - 1] * y;
            }
            s[0] += y;
        }
        return s;
    }
};

export default JXG.Math;
