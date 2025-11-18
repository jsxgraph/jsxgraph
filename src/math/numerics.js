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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/
/*eslint no-loss-of-precision: off */

/**
 * @fileoverview In this file the namespace Math.Numerics is defined, which holds numerical
 * algorithms for solving linear equations etc.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";
import Env from "../utils/env.js";
import Mat from "./math.js";

// Predefined butcher tableaus for the common Runge-Kutta method (fourth order), Heun method (second order), and Euler method (first order).
var predefinedButcher = {
    rk4: {
        s: 4,
        A: [
            [0, 0, 0, 0],
            [0.5, 0, 0, 0],
            [0, 0.5, 0, 0],
            [0, 0, 1, 0]
        ],
        b: [1.0 / 6.0, 1.0 / 3.0, 1.0 / 3.0, 1.0 / 6.0],
        c: [0, 0.5, 0.5, 1]
    },
    heun: {
        s: 2,
        A: [
            [0, 0],
            [1, 0]
        ],
        b: [0.5, 0.5],
        c: [0, 1]
    },
    euler: {
        s: 1,
        A: [[0]],
        b: [1],
        c: [0]
    }
};

/**
 * The JXG.Math.Numerics namespace holds numerical algorithms, constants, and variables.
 * @name JXG.Math.Numerics
 * @exports Mat.Numerics as JXG.Math.Numerics
 * @namespace
 */
Mat.Numerics = {
    //JXG.extend(Mat.Numerics, /** @lends JXG.Math.Numerics */ {
    /**
     * Solves a system of linear equations given by A and b using the Gauss-Jordan-elimination.
     * The algorithm runs in-place. I.e. the entries of A and b are changed.
     * @param {Array} A Square matrix represented by an array of rows, containing the coefficients of the lineare equation system.
     * @param {Array} b A vector containing the linear equation system's right hand side.
     * @throws {Error} If a non-square-matrix is given or if b has not the right length or A's rank is not full.
     * @returns {Array} A vector that solves the linear equation system.
     * @memberof JXG.Math.Numerics
     */
    Gauss: function (A, b) {
        var i,
            j,
            k,
            // copy the matrix to prevent changes in the original
            Acopy,
            // solution vector, to prevent changing b
            x,
            eps = Mat.eps,
            // number of columns of A
            n = A.length > 0 ? A[0].length : 0;

        if (n !== b.length || n !== A.length) {
            throw new Error(
                "JXG.Math.Numerics.Gauss: Dimensions don't match. A must be a square matrix and b must be of the same length as A."
            );
        }

        // initialize solution vector
        Acopy = [];
        x = b.slice(0, n);

        for (i = 0; i < n; i++) {
            Acopy[i] = A[i].slice(0, n);
        }

        // Gauss-Jordan-elimination
        for (j = 0; j < n; j++) {
            for (i = n - 1; i > j; i--) {
                // Is the element which is to eliminate greater than zero?
                if (Math.abs(Acopy[i][j]) > eps) {
                    // Equals pivot element zero?
                    if (Math.abs(Acopy[j][j]) < eps) {
                        // At least numerically, so we have to exchange the rows
                        Type.swap(Acopy, i, j);
                        Type.swap(x, i, j);
                    } else {
                        // Saves the L matrix of the LR-decomposition. unnecessary.
                        Acopy[i][j] /= Acopy[j][j];
                        // Transform right-hand-side b
                        x[i] -= Acopy[i][j] * x[j];

                        // subtract the multiple of A[i][j] / A[j][j] of the j-th row from the i-th.
                        for (k = j + 1; k < n; k++) {
                            Acopy[i][k] -= Acopy[i][j] * Acopy[j][k];
                        }
                    }
                }
            }

            // The absolute values of all coefficients below the j-th row in the j-th column are smaller than JXG.Math.eps.
            if (Math.abs(Acopy[j][j]) < eps) {
                throw new Error(
                    "JXG.Math.Numerics.Gauss(): The given matrix seems to be singular."
                );
            }
        }

        this.backwardSolve(Acopy, x, true);

        return x;
    },

    /**
     * Solves a system of linear equations given by the right triangular matrix R and vector b.
     * @param {Array} R Right triangular matrix represented by an array of rows. All entries a_(i,j) with i &lt; j are ignored.
     * @param {Array} b Right hand side of the linear equation system.
     * @param {Boolean} [canModify=false] If true, the right hand side vector is allowed to be changed by this method.
     * @returns {Array} An array representing a vector that solves the system of linear equations.
     * @memberof JXG.Math.Numerics
     */
    backwardSolve: function (R, b, canModify) {
        var x, m, n, i, j;

        if (canModify) {
            x = b;
        } else {
            x = b.slice(0, b.length);
        }

        // m: number of rows of R
        // n: number of columns of R
        m = R.length;
        n = R.length > 0 ? R[0].length : 0;

        for (i = m - 1; i >= 0; i--) {
            for (j = n - 1; j > i; j--) {
                x[i] -= R[i][j] * x[j];
            }
            x[i] /= R[i][i];
        }

        return x;
    },

    /**
     *  Gauss-Bareiss algorithm to compute the
     *  determinant of matrix without fractions.
     *  See Henri Cohen, "A Course in Computational
     *  Algebraic Number Theory (Graduate texts
     *  in mathematics; 138)", Springer-Verlag,
     *  ISBN 3-540-55640-0 / 0-387-55640-0
     *  Third, Corrected Printing 1996
     *  "Algorithm 2.2.6", pg. 52-53
     *
     * @param {Array} mat Matrix
     * @returns Number
     * @private
     * @memberof JXG.Math.Numerics
     */
    gaussBareiss: function (mat) {
        var k, c, s,
            i, j, p,
            n, M, t,
            eps = Mat.eps;

        n = mat.length;

        if (n <= 0) {
            return 0;
        }

        if (mat[0].length < n) {
            n = mat[0].length;
        }

        // Copy the input matrix to M
        M = [];

        for (i = 0; i < n; i++) {
            M[i] = mat[i].slice(0, n);
        }

        c = 1;
        s = 1;

        for (k = 0; k < n - 1; k++) {
            p = M[k][k];

            // Pivot step
            if (Math.abs(p) < eps) {
                for (i = k + 1; i < n; i++) {
                    if (Math.abs(M[i][k]) >= eps) {
                        break;
                    }
                }

                // No nonzero entry found in column k -> det(M) = 0
                if (i === n) {
                    return 0.0;
                }

                // swap row i and k partially
                for (j = k; j < n; j++) {
                    t = M[i][j];
                    M[i][j] = M[k][j];
                    M[k][j] = t;
                }
                s = -s;
                p = M[k][k];
            }

            // Main step
            for (i = k + 1; i < n; i++) {
                for (j = k + 1; j < n; j++) {
                    t = p * M[i][j] - M[i][k] * M[k][j];
                    M[i][j] = t / c;
                }
            }

            c = p;
        }

        return s * M[n - 1][n - 1];
    },

    /**
     * Computes the determinant of a square nxn matrix with the
     * Gauss-Bareiss algorithm.
     * @param {Array} mat Matrix.
     * @returns {Number} The determinant pf the matrix mat.
     *                   The empty matrix returns 0.
     * @memberof JXG.Math.Numerics
     */
    det: function (mat) {
        var n = mat.length;

        if (n === 2 && mat[0].length === 2) {
            return mat[0][0] * mat[1][1] - mat[1][0] * mat[0][1];
        }

        return this.gaussBareiss(mat);
    },

    /**
     * Compute the Eigenvalues and Eigenvectors of a symmetric 3x3 matrix with the Jacobi method
     * Adaption of a FORTRAN program by Ed Wilson, Dec. 25, 1990
     * @param {Array} Ain A symmetric 3x3 matrix.
     * @returns {Array} [A,V] the matrices A and V. The diagonal of A contains the Eigenvalues, V contains the Eigenvectors.
     * @memberof JXG.Math.Numerics
     */
    Jacobi: function (Ain) {
        var i,
            j,
            k,
            aa,
            si,
            co,
            tt,
            ssum,
            amax,
            eps = Mat.eps * Mat.eps,
            sum = 0.0,
            n = Ain.length,
            V = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            A = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            nloops = 0;

        // Initialization. Set initial Eigenvectors.
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                V[i][j] = 0.0;
                A[i][j] = Ain[i][j];
                sum += Math.abs(A[i][j]);
            }
            V[i][i] = 1.0;
        }

        // Trivial problems
        if (n === 1) {
            return [A, V];
        }

        if (sum <= 0.0) {
            return [A, V];
        }

        sum /= n * n;

        // Reduce matrix to diagonal
        do {
            ssum = 0.0;
            amax = 0.0;
            for (j = 1; j < n; j++) {
                for (i = 0; i < j; i++) {
                    // Check if A[i][j] is to be reduced
                    aa = Math.abs(A[i][j]);

                    if (aa > amax) {
                        amax = aa;
                    }

                    ssum += aa;

                    if (aa >= eps) {
                        // calculate rotation angle
                        aa = Math.atan2(2.0 * A[i][j], A[i][i] - A[j][j]) * 0.5;
                        si = Math.sin(aa);
                        co = Math.cos(aa);

                        // Modify 'i' and 'j' columns
                        for (k = 0; k < n; k++) {
                            tt = A[k][i];
                            A[k][i] = co * tt + si * A[k][j];
                            A[k][j] = -si * tt + co * A[k][j];
                            tt = V[k][i];
                            V[k][i] = co * tt + si * V[k][j];
                            V[k][j] = -si * tt + co * V[k][j];
                        }

                        // Modify diagonal terms
                        A[i][i] = co * A[i][i] + si * A[j][i];
                        A[j][j] = -si * A[i][j] + co * A[j][j];
                        A[i][j] = 0.0;

                        // Make 'A' matrix symmetrical
                        for (k = 0; k < n; k++) {
                            A[i][k] = A[k][i];
                            A[j][k] = A[k][j];
                        }
                        // A[i][j] made zero by rotation
                    }
                }
            }
            nloops += 1;
        } while (Math.abs(ssum) / sum > eps && nloops < 2000);

        return [A, V];
    },

    /**
     * Calculates the integral of function f over interval using Newton-Cotes-algorithm.
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} [config] The algorithm setup. Accepted properties are number_of_nodes of type number and integration_type
     * with value being either 'trapez', 'simpson', or 'milne'.
     * @param {Number} [config.number_of_nodes=28]
     * @param {String} [config.integration_type='milne'] Possible values are 'milne', 'simpson', 'trapez'
     * @returns {Number} Integral value of f over interval
     * @throws {Error} If config.number_of_nodes doesn't match config.integration_type an exception is thrown. If you want to use
     * simpson rule respectively milne rule config.number_of_nodes must be dividable by 2 respectively 4.
     * @example
     * function f(x) {
     *   return x*x;
     * }
     *
     * // calculates integral of <tt>f</tt> from 0 to 2.
     * var area1 = JXG.Math.Numerics.NewtonCotes([0, 2], f);
     *
     * // the same with an anonymous function
     * var area2 = JXG.Math.Numerics.NewtonCotes([0, 2], function (x) { return x*x; });
     *
     * // use trapez rule with 16 nodes
     * var area3 = JXG.Math.Numerics.NewtonCotes([0, 2], f,
     *                                   {number_of_nodes: 16, integration_type: 'trapez'});
     * @memberof JXG.Math.Numerics
     */
    NewtonCotes: function (interval, f, config) {
        var evaluation_point,
            i,
            number_of_intervals,
            integral_value = 0.0,
            number_of_nodes =
                config && Type.isNumber(config.number_of_nodes) ? config.number_of_nodes : 28,
            available_types = { trapez: true, simpson: true, milne: true },
            integration_type =
                config &&
                    config.integration_type &&
                    available_types.hasOwnProperty(config.integration_type) &&
                    available_types[config.integration_type]
                    ? config.integration_type
                    : "milne",
            step_size = (interval[1] - interval[0]) / number_of_nodes;

        switch (integration_type) {
            case "trapez":
                integral_value = (f(interval[0]) + f(interval[1])) * 0.5;
                evaluation_point = interval[0];

                for (i = 0; i < number_of_nodes - 1; i++) {
                    evaluation_point += step_size;
                    integral_value += f(evaluation_point);
                }

                integral_value *= step_size;
                break;
            case "simpson":
                if (number_of_nodes % 2 > 0) {
                    throw new Error(
                        "JSXGraph:  INT_SIMPSON requires config.number_of_nodes dividable by 2."
                    );
                }

                number_of_intervals = number_of_nodes / 2.0;
                integral_value = f(interval[0]) + f(interval[1]);
                evaluation_point = interval[0];

                for (i = 0; i < number_of_intervals - 1; i++) {
                    evaluation_point += 2.0 * step_size;
                    integral_value += 2.0 * f(evaluation_point);
                }

                evaluation_point = interval[0] - step_size;

                for (i = 0; i < number_of_intervals; i++) {
                    evaluation_point += 2.0 * step_size;
                    integral_value += 4.0 * f(evaluation_point);
                }

                integral_value *= step_size / 3.0;
                break;
            default:
                if (number_of_nodes % 4 > 0) {
                    throw new Error(
                        "JSXGraph: Error in INT_MILNE: config.number_of_nodes must be a multiple of 4"
                    );
                }

                number_of_intervals = number_of_nodes * 0.25;
                integral_value = 7.0 * (f(interval[0]) + f(interval[1]));
                evaluation_point = interval[0];

                for (i = 0; i < number_of_intervals - 1; i++) {
                    evaluation_point += 4.0 * step_size;
                    integral_value += 14.0 * f(evaluation_point);
                }

                evaluation_point = interval[0] - 3.0 * step_size;

                for (i = 0; i < number_of_intervals; i++) {
                    evaluation_point += 4.0 * step_size;
                    integral_value +=
                        32.0 * (f(evaluation_point) + f(evaluation_point + 2 * step_size));
                }

                evaluation_point = interval[0] - 2.0 * step_size;

                for (i = 0; i < number_of_intervals; i++) {
                    evaluation_point += 4.0 * step_size;
                    integral_value += 12.0 * f(evaluation_point);
                }

                integral_value *= (2.0 * step_size) / 45.0;
        }
        return integral_value;
    },

    /**
     * Calculates the integral of function f over interval using Romberg iteration.
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} [config] The algorithm setup. Accepted properties are max_iterations of type number and precision eps.
     * @param {Number} [config.max_iterations=20]
     * @param {Number} [config.eps=0.0000001]
     * @returns {Number} Integral value of f over interval
     * @example
     * function f(x) {
     *   return x*x;
     * }
     *
     * // calculates integral of <tt>f</tt> from 0 to 2.
     * var area1 = JXG.Math.Numerics.Romberg([0, 2], f);
     *
     * // the same with an anonymous function
     * var area2 = JXG.Math.Numerics.Romberg([0, 2], function (x) { return x*x; });
     *
     * // use trapez rule with maximum of 16 iterations or stop if the precision 0.0001 has been reached.
     * var area3 = JXG.Math.Numerics.Romberg([0, 2], f,
     *                                   {max_iterations: 16, eps: 0.0001});
     * @memberof JXG.Math.Numerics
     */
    Romberg: function (interval, f, config) {
        var a,
            b,
            h,
            s,
            n,
            k,
            i,
            q,
            p = [],
            integral = 0.0,
            last = Infinity,
            m = config && Type.isNumber(config.max_iterations) ? config.max_iterations : 20,
            eps = config && Type.isNumber(config.eps) ? config.eps : config.eps || 0.0000001;

        a = interval[0];
        b = interval[1];
        h = b - a;
        n = 1;

        p[0] = 0.5 * h * (f(a) + f(b));

        for (k = 0; k < m; ++k) {
            s = 0;
            h *= 0.5;
            n *= 2;
            q = 1;

            for (i = 1; i < n; i += 2) {
                s += f(a + i * h);
            }

            p[k + 1] = 0.5 * p[k] + s * h;

            integral = p[k + 1];
            for (i = k - 1; i >= 0; --i) {
                q *= 4;
                p[i] = p[i + 1] + (p[i + 1] - p[i]) / (q - 1.0);
                integral = p[i];
            }

            if (Math.abs(integral - last) < eps * Math.abs(integral)) {
                break;
            }
            last = integral;
        }

        return integral;
    },

    /**
     * Calculates the integral of function f over interval using Gauss-Legendre quadrature.
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} [config] The algorithm setup. Accepted property is the order n of type number. n is allowed to take
     * values between 2 and 18, default value is 12.
     * @param {Number} [config.n=16]
     * @returns {Number} Integral value of f over interval
     * @example
     * function f(x) {
     *   return x*x;
     * }
     *
     * // calculates integral of <tt>f</tt> from 0 to 2.
     * var area1 = JXG.Math.Numerics.GaussLegendre([0, 2], f);
     *
     * // the same with an anonymous function
     * var area2 = JXG.Math.Numerics.GaussLegendre([0, 2], function (x) { return x*x; });
     *
     * // use 16 point Gauss-Legendre rule.
     * var area3 = JXG.Math.Numerics.GaussLegendre([0, 2], f,
     *                                   {n: 16});
     * @memberof JXG.Math.Numerics
     */
    GaussLegendre: function (interval, f, config) {
        var a,
            b,
            i,
            m,
            xp,
            xm,
            result = 0.0,
            table_xi = [],
            table_w = [],
            xi,
            w,
            n = config && Type.isNumber(config.n) ? config.n : 12;

        if (n > 18) {
            n = 18;
        }

        /* n = 2 */
        table_xi[2] = [0.5773502691896257645091488];
        table_w[2] = [1.0];

        /* n = 4 */
        table_xi[4] = [0.3399810435848562648026658, 0.8611363115940525752239465];
        table_w[4] = [0.6521451548625461426269361, 0.3478548451374538573730639];

        /* n = 6 */
        table_xi[6] = [
            0.2386191860831969086305017, 0.6612093864662645136613996,
            0.9324695142031520278123016
        ];
        table_w[6] = [
            0.4679139345726910473898703, 0.3607615730481386075698335,
            0.1713244923791703450402961
        ];

        /* n = 8 */
        table_xi[8] = [
            0.1834346424956498049394761, 0.525532409916328985817739,
            0.7966664774136267395915539, 0.9602898564975362316835609
        ];
        table_w[8] = [
            0.3626837833783619829651504, 0.3137066458778872873379622,
            0.222381034453374470544356, 0.1012285362903762591525314
        ];

        /* n = 10 */
        table_xi[10] = [
            0.148874338981631210884826, 0.4333953941292471907992659,
            0.6794095682990244062343274, 0.8650633666889845107320967, 0.973906528517171720077964
        ];
        table_w[10] = [
            0.295524224714752870173893, 0.2692667193099963550912269,
            0.2190863625159820439955349, 0.1494513491505805931457763,
            0.0666713443086881375935688
        ];

        /* n = 12 */
        table_xi[12] = [
            0.1252334085114689154724414, 0.3678314989981801937526915,
            0.5873179542866174472967024, 0.7699026741943046870368938,
            0.9041172563704748566784659, 0.9815606342467192506905491
        ];
        table_w[12] = [
            0.2491470458134027850005624, 0.2334925365383548087608499,
            0.2031674267230659217490645, 0.1600783285433462263346525,
            0.1069393259953184309602547, 0.047175336386511827194616
        ];

        /* n = 14 */
        table_xi[14] = [
            0.1080549487073436620662447, 0.3191123689278897604356718,
            0.5152486363581540919652907, 0.6872929048116854701480198,
            0.8272013150697649931897947, 0.9284348836635735173363911,
            0.9862838086968123388415973
        ];
        table_w[14] = [
            0.2152638534631577901958764, 0.2051984637212956039659241,
            0.1855383974779378137417166, 0.1572031671581935345696019,
            0.1215185706879031846894148, 0.0801580871597602098056333,
            0.0351194603317518630318329
        ];

        /* n = 16 */
        table_xi[16] = [
            0.0950125098376374401853193, 0.2816035507792589132304605,
            0.4580167776572273863424194, 0.6178762444026437484466718,
            0.7554044083550030338951012, 0.8656312023878317438804679,
            0.9445750230732325760779884, 0.9894009349916499325961542
        ];
        table_w[16] = [
            0.1894506104550684962853967, 0.1826034150449235888667637,
            0.1691565193950025381893121, 0.1495959888165767320815017,
            0.1246289712555338720524763, 0.0951585116824927848099251,
            0.0622535239386478928628438, 0.0271524594117540948517806
        ];

        /* n = 18 */
        table_xi[18] = [
            0.0847750130417353012422619, 0.2518862256915055095889729,
            0.4117511614628426460359318, 0.5597708310739475346078715,
            0.6916870430603532078748911, 0.8037049589725231156824175,
            0.8926024664975557392060606, 0.9558239495713977551811959, 0.991565168420930946730016
        ];
        table_w[18] = [
            0.1691423829631435918406565, 0.1642764837458327229860538,
            0.154684675126265244925418, 0.1406429146706506512047313,
            0.1225552067114784601845191, 0.100942044106287165562814,
            0.0764257302548890565291297, 0.0497145488949697964533349,
            0.0216160135264833103133427
        ];

        /* n = 3 */
        table_xi[3] = [0.0, 0.7745966692414833770358531];
        table_w[3] = [0.8888888888888888888888889, 0.5555555555555555555555556];

        /* n = 5 */
        table_xi[5] = [0.0, 0.5384693101056830910363144, 0.9061798459386639927976269];
        table_w[5] = [
            0.5688888888888888888888889, 0.4786286704993664680412915, 0.236926885056189087514264
        ];

        /* n = 7 */
        table_xi[7] = [
            0.0, 0.4058451513773971669066064, 0.7415311855993944398638648,
            0.9491079123427585245261897
        ];
        table_w[7] = [
            0.417959183673469387755102, 0.3818300505051189449503698,
            0.2797053914892766679014678, 0.1294849661688696932706114
        ];

        /* n = 9 */
        table_xi[9] = [
            0.0, 0.324253423403808929038538, 0.613371432700590397308702,
            0.8360311073266357942994298, 0.9681602395076260898355762
        ];
        table_w[9] = [
            0.3302393550012597631645251, 0.3123470770400028400686304,
            0.2606106964029354623187429, 0.180648160694857404058472, 0.0812743883615744119718922
        ];

        /* n = 11 */
        table_xi[11] = [
            0.0, 0.269543155952344972331532, 0.5190961292068118159257257,
            0.7301520055740493240934163, 0.8870625997680952990751578, 0.978228658146056992803938
        ];
        table_w[11] = [
            0.2729250867779006307144835, 0.2628045445102466621806889,
            0.2331937645919904799185237, 0.1862902109277342514260976,
            0.1255803694649046246346943, 0.0556685671161736664827537
        ];

        /* n = 13 */
        table_xi[13] = [
            0.0, 0.2304583159551347940655281, 0.4484927510364468528779129,
            0.6423493394403402206439846, 0.8015780907333099127942065,
            0.9175983992229779652065478, 0.9841830547185881494728294
        ];
        table_w[13] = [
            0.2325515532308739101945895, 0.2262831802628972384120902,
            0.2078160475368885023125232, 0.1781459807619457382800467,
            0.1388735102197872384636018, 0.0921214998377284479144218,
            0.0404840047653158795200216
        ];

        /* n = 15 */
        table_xi[15] = [
            0.0, 0.2011940939974345223006283, 0.3941513470775633698972074,
            0.5709721726085388475372267, 0.7244177313601700474161861,
            0.8482065834104272162006483, 0.9372733924007059043077589,
            0.9879925180204854284895657
        ];
        table_w[15] = [
            0.2025782419255612728806202, 0.1984314853271115764561183,
            0.1861610000155622110268006, 0.1662692058169939335532009,
            0.1395706779261543144478048, 0.1071592204671719350118695,
            0.0703660474881081247092674, 0.0307532419961172683546284
        ];

        /* n = 17 */
        table_xi[17] = [
            0.0, 0.1784841814958478558506775, 0.3512317634538763152971855,
            0.5126905370864769678862466, 0.6576711592166907658503022,
            0.7815140038968014069252301, 0.8802391537269859021229557,
            0.950675521768767761222717, 0.990575475314417335675434
        ];
        table_w[17] = [
            0.1794464703562065254582656, 0.176562705366992646325271,
            0.1680041021564500445099707, 0.1540457610768102880814316, 0.13513636846852547328632,
            0.1118838471934039710947884, 0.0850361483171791808835354,
            0.0554595293739872011294402, 0.02414830286854793196011
        ];

        a = interval[0];
        b = interval[1];

        //m = Math.ceil(n * 0.5);
        m = (n + 1) >> 1;

        xi = table_xi[n];
        w = table_w[n];

        xm = 0.5 * (b - a);
        xp = 0.5 * (b + a);

        if (n & (1 === 1)) {
            // n odd
            result = w[0] * f(xp);
            for (i = 1; i < m; ++i) {
                result += w[i] * (f(xp + xm * xi[i]) + f(xp - xm * xi[i]));
            }
        } else {
            // n even
            result = 0.0;
            for (i = 0; i < m; ++i) {
                result += w[i] * (f(xp + xm * xi[i]) + f(xp - xm * xi[i]));
            }
        }

        return xm * result;
    },

    /**
     * Scale error in Gauss Kronrod quadrature.
     * Internal method used in {@link JXG.Math.Numerics._gaussKronrod}.
     * @private
     */
    _rescale_error: function (err, result_abs, result_asc) {
        var scale,
            min_err,
            DBL_MIN = 2.2250738585072014e-308,
            DBL_EPS = 2.2204460492503131e-16;

        err = Math.abs(err);
        if (result_asc !== 0 && err !== 0) {
            scale = Math.pow((200 * err) / result_asc, 1.5);

            if (scale < 1.0) {
                err = result_asc * scale;
            } else {
                err = result_asc;
            }
        }
        if (result_abs > DBL_MIN / (50 * DBL_EPS)) {
            min_err = 50 * DBL_EPS * result_abs;

            if (min_err > err) {
                err = min_err;
            }
        }

        return err;
    },

    /**
     * Generic Gauss-Kronrod quadrature algorithm.
     * Internal method used in {@link JXG.Math.Numerics.GaussKronrod15},
     * {@link JXG.Math.Numerics.GaussKronrod21},
     * {@link JXG.Math.Numerics.GaussKronrod31}.
     * Taken from QUADPACK.
     *
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Number} n order of approximation. Actually, n is the length of the array xgk. For example, for the 15-point Kronrod rule, n is equal to 8.
     * @param {Array} xgk Kronrod quadrature abscissae
     * @param {Array} wg Weights of the Gauss rule
     * @param {Array} wgk Weights of the Kronrod rule
     * @param {Object} resultObj Object returning resultObj.abserr, resultObj.resabs, resultObj.resasc.
     * See the library QUADPACK for an explanation.
     *
     * @returns {Number} Integral value of f over interval
     *
     * @private
     */
    _gaussKronrod: function (interval, f, n, xgk, wg, wgk, resultObj) {
        var a = interval[0],
            b = interval[1],
            up,
            result,
            center = 0.5 * (a + b),
            half_length = 0.5 * (b - a),
            abs_half_length = Math.abs(half_length),
            f_center = f(center),
            result_gauss = 0.0,
            result_kronrod = f_center * wgk[n - 1],
            result_abs = Math.abs(result_kronrod),
            result_asc = 0.0,
            mean = 0.0,
            err = 0.0,
            j, jtw, jtwm1,
            abscissa,
            fval1, fval2, fsum,
            fv1 = [],
            fv2 = [];

        if (n % 2 === 0) {
            result_gauss = f_center * wg[n / 2 - 1];
        }

        up = Math.floor((n - 1) / 2);
        for (j = 0; j < up; j++) {
            jtw = j * 2 + 1; // in original fortran j=1,2,3 jtw=2,4,6
            abscissa = half_length * xgk[jtw];
            fval1 = f(center - abscissa);
            fval2 = f(center + abscissa);
            fsum = fval1 + fval2;
            fv1[jtw] = fval1;
            fv2[jtw] = fval2;
            result_gauss += wg[j] * fsum;
            result_kronrod += wgk[jtw] * fsum;
            result_abs += wgk[jtw] * (Math.abs(fval1) + Math.abs(fval2));
        }

        up = Math.floor(n / 2);
        for (j = 0; j < up; j++) {
            jtwm1 = j * 2;
            abscissa = half_length * xgk[jtwm1];
            fval1 = f(center - abscissa);
            fval2 = f(center + abscissa);
            fv1[jtwm1] = fval1;
            fv2[jtwm1] = fval2;
            result_kronrod += wgk[jtwm1] * (fval1 + fval2);
            result_abs += wgk[jtwm1] * (Math.abs(fval1) + Math.abs(fval2));
        }

        mean = result_kronrod * 0.5;
        result_asc = wgk[n - 1] * Math.abs(f_center - mean);

        for (j = 0; j < n - 1; j++) {
            result_asc += wgk[j] * (Math.abs(fv1[j] - mean) + Math.abs(fv2[j] - mean));
        }

        // scale by the width of the integration region
        err = (result_kronrod - result_gauss) * half_length;

        result_kronrod *= half_length;
        result_abs *= abs_half_length;
        result_asc *= abs_half_length;
        result = result_kronrod;

        resultObj.abserr = this._rescale_error(err, result_abs, result_asc);
        resultObj.resabs = result_abs;
        resultObj.resasc = result_asc;

        return result;
    },

    /**
     * 15-point Gauss-Kronrod quadrature algorithm, see the library QUADPACK
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} resultObj Object returning resultObj.abserr, resultObj.resabs, resultObj.resasc. See the library
     *  QUADPACK for an explanation.
     *
     * @returns {Number} Integral value of f over interval
     *
     * @memberof JXG.Math.Numerics
     */
    GaussKronrod15: function (interval, f, resultObj) {
        /* Gauss quadrature weights and kronrod quadrature abscissae and
                weights as evaluated with 80 decimal digit arithmetic by
                L. W. Fullerton, Bell Labs, Nov. 1981. */

        var xgk =
            /* abscissae of the 15-point kronrod rule */
            [
                0.991455371120812639206854697526329, 0.949107912342758524526189684047851,
                0.864864423359769072789712788640926, 0.741531185599394439863864773280788,
                0.58608723546769113029414483825873, 0.405845151377397166906606412076961,
                0.207784955007898467600689403773245, 0.0
            ],
            /* xgk[1], xgk[3], ... abscissae of the 7-point gauss rule.
                xgk[0], xgk[2], ... abscissae to optimally extend the 7-point gauss rule */

            wg =
                /* weights of the 7-point gauss rule */
                [
                    0.129484966168869693270611432679082, 0.27970539148927666790146777142378,
                    0.381830050505118944950369775488975, 0.417959183673469387755102040816327
                ],
            wgk =
                /* weights of the 15-point kronrod rule */
                [
                    0.02293532201052922496373200805897, 0.063092092629978553290700663189204,
                    0.104790010322250183839876322541518, 0.140653259715525918745189590510238,
                    0.16900472663926790282658342659855, 0.190350578064785409913256402421014,
                    0.204432940075298892414161999234649, 0.209482141084727828012999174891714
                ];

        return this._gaussKronrod(interval, f, 8, xgk, wg, wgk, resultObj);
    },

    /**
     * 21 point Gauss-Kronrod quadrature algorithm, see the library QUADPACK
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} resultObj Object returning resultObj.abserr, resultObj.resabs, resultObj.resasc. See the library
     *  QUADPACK for an explanation.
     *
     * @returns {Number} Integral value of f over interval
     *
     * @memberof JXG.Math.Numerics
     */
    GaussKronrod21: function (interval, f, resultObj) {
        /* Gauss quadrature weights and kronrod quadrature abscissae and
                weights as evaluated with 80 decimal digit arithmetic by
                L. W. Fullerton, Bell Labs, Nov. 1981. */

        var xgk =
            /* abscissae of the 21-point kronrod rule */
            [
                0.995657163025808080735527280689003, 0.973906528517171720077964012084452,
                0.930157491355708226001207180059508, 0.865063366688984510732096688423493,
                0.780817726586416897063717578345042, 0.679409568299024406234327365114874,
                0.562757134668604683339000099272694, 0.433395394129247190799265943165784,
                0.294392862701460198131126603103866, 0.14887433898163121088482600112972, 0.0
            ],
            /* xgk[1], xgk[3], ... abscissae of the 10-point gauss rule.
                xgk[0], xgk[2], ... abscissae to optimally extend the 10-point gauss rule */
            wg =
                /* weights of the 10-point gauss rule */
                [
                    0.066671344308688137593568809893332, 0.149451349150580593145776339657697,
                    0.219086362515982043995534934228163, 0.269266719309996355091226921569469,
                    0.295524224714752870173892994651338
                ],
            wgk =
                /* weights of the 21-point kronrod rule */
                [
                    0.011694638867371874278064396062192, 0.03255816230796472747881897245939,
                    0.05475589657435199603138130024458, 0.07503967481091995276704314091619,
                    0.093125454583697605535065465083366, 0.109387158802297641899210590325805,
                    0.123491976262065851077958109831074, 0.134709217311473325928054001771707,
                    0.142775938577060080797094273138717, 0.147739104901338491374841515972068,
                    0.149445554002916905664936468389821
                ];

        return this._gaussKronrod(interval, f, 11, xgk, wg, wgk, resultObj);
    },

    /**
     * 31 point Gauss-Kronrod quadrature algorithm, see the library QUADPACK
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} resultObj Object returning resultObj.abserr, resultObj.resabs, resultObj.resasc. See the library
     *  QUADPACK for an explanation.
     *
     * @returns {Number} Integral value of f over interval
     *
     * @memberof JXG.Math.Numerics
     */
    GaussKronrod31: function (interval, f, resultObj) {
        /* Gauss quadrature weights and kronrod quadrature abscissae and
                weights as evaluated with 80 decimal digit arithmetic by
                L. W. Fullerton, Bell Labs, Nov. 1981. */

        var xgk =
            /* abscissae of the 21-point kronrod rule */
            [
                0.998002298693397060285172840152271, 0.987992518020485428489565718586613,
                0.967739075679139134257347978784337, 0.937273392400705904307758947710209,
                0.897264532344081900882509656454496, 0.848206583410427216200648320774217,
                0.790418501442465932967649294817947, 0.724417731360170047416186054613938,
                0.650996741297416970533735895313275, 0.570972172608538847537226737253911,
                0.485081863640239680693655740232351, 0.394151347077563369897207370981045,
                0.299180007153168812166780024266389, 0.201194093997434522300628303394596,
                0.101142066918717499027074231447392, 0.0
            ],
            /* xgk[1], xgk[3], ... abscissae of the 10-point gauss rule.
                xgk[0], xgk[2], ... abscissae to optimally extend the 10-point gauss rule */
            wg =
                /* weights of the 10-point gauss rule */
                [
                    0.030753241996117268354628393577204, 0.070366047488108124709267416450667,
                    0.107159220467171935011869546685869, 0.139570677926154314447804794511028,
                    0.166269205816993933553200860481209, 0.186161000015562211026800561866423,
                    0.198431485327111576456118326443839, 0.202578241925561272880620199967519
                ],
            wgk =
                /* weights of the 21-point kronrod rule */
                [
                    0.005377479872923348987792051430128, 0.015007947329316122538374763075807,
                    0.025460847326715320186874001019653, 0.03534636079137584622203794847836,
                    0.04458975132476487660822729937328, 0.05348152469092808726534314723943,
                    0.062009567800670640285139230960803, 0.069854121318728258709520077099147,
                    0.076849680757720378894432777482659, 0.083080502823133021038289247286104,
                    0.088564443056211770647275443693774, 0.093126598170825321225486872747346,
                    0.096642726983623678505179907627589, 0.099173598721791959332393173484603,
                    0.10076984552387559504494666261757, 0.101330007014791549017374792767493
                ];

        return this._gaussKronrod(interval, f, 16, xgk, wg, wgk, resultObj);
    },

    /**
     * Generate workspace object for {@link JXG.Math.Numerics.Qag}.
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {Number} n Max. limit
     * @returns {Object} Workspace object
     *
     * @private
     * @memberof JXG.Math.Numerics
     */
    _workspace: function (interval, n) {
        return {
            limit: n,
            size: 0,
            nrmax: 0,
            i: 0,
            alist: [interval[0]],
            blist: [interval[1]],
            rlist: [0.0],
            elist: [0.0],
            order: [0],
            level: [0],

            qpsrt: function () {
                var last = this.size - 1,
                    limit = this.limit,
                    errmax,
                    errmin,
                    i,
                    k,
                    top,
                    i_nrmax = this.nrmax,
                    i_maxerr = this.order[i_nrmax];

                /* Check whether the list contains more than two error estimates */
                if (last < 2) {
                    this.order[0] = 0;
                    this.order[1] = 1;
                    this.i = i_maxerr;
                    return;
                }

                errmax = this.elist[i_maxerr];

                /* This part of the routine is only executed if, due to a difficult
                        integrand, subdivision increased the error estimate. In the normal
                        case the insert procedure should start after the nrmax-th largest
                        error estimate. */
                while (i_nrmax > 0 && errmax > this.elist[this.order[i_nrmax - 1]]) {
                    this.order[i_nrmax] = this.order[i_nrmax - 1];
                    i_nrmax--;
                }

                /* Compute the number of elements in the list to be maintained in
                        descending order. This number depends on the number of
                        subdivisions still allowed. */
                if (last < limit / 2 + 2) {
                    top = last;
                } else {
                    top = limit - last + 1;
                }

                /* Insert errmax by traversing the list top-down, starting
                        comparison from the element elist(order(i_nrmax+1)). */
                i = i_nrmax + 1;

                /* The order of the tests in the following line is important to
                        prevent a segmentation fault */
                while (i < top && errmax < this.elist[this.order[i]]) {
                    this.order[i - 1] = this.order[i];
                    i++;
                }

                this.order[i - 1] = i_maxerr;

                /* Insert errmin by traversing the list bottom-up */
                errmin = this.elist[last];
                k = top - 1;

                while (k > i - 2 && errmin >= this.elist[this.order[k]]) {
                    this.order[k + 1] = this.order[k];
                    k--;
                }

                this.order[k + 1] = last;

                /* Set i_max and e_max */
                i_maxerr = this.order[i_nrmax];
                this.i = i_maxerr;
                this.nrmax = i_nrmax;
            },

            set_initial_result: function (result, error) {
                this.size = 1;
                this.rlist[0] = result;
                this.elist[0] = error;
            },

            update: function (a1, b1, area1, error1, a2, b2, area2, error2) {
                var i_max = this.i,
                    i_new = this.size,
                    new_level = this.level[this.i] + 1;

                /* append the newly-created intervals to the list */

                if (error2 > error1) {
                    this.alist[i_max] = a2; /* blist[maxerr] is already == b2 */
                    this.rlist[i_max] = area2;
                    this.elist[i_max] = error2;
                    this.level[i_max] = new_level;

                    this.alist[i_new] = a1;
                    this.blist[i_new] = b1;
                    this.rlist[i_new] = area1;
                    this.elist[i_new] = error1;
                    this.level[i_new] = new_level;
                } else {
                    this.blist[i_max] = b1; /* alist[maxerr] is already == a1 */
                    this.rlist[i_max] = area1;
                    this.elist[i_max] = error1;
                    this.level[i_max] = new_level;

                    this.alist[i_new] = a2;
                    this.blist[i_new] = b2;
                    this.rlist[i_new] = area2;
                    this.elist[i_new] = error2;
                    this.level[i_new] = new_level;
                }

                this.size++;

                if (new_level > this.maximum_level) {
                    this.maximum_level = new_level;
                }

                this.qpsrt();
            },

            retrieve: function () {
                var i = this.i;
                return {
                    a: this.alist[i],
                    b: this.blist[i],
                    r: this.rlist[i],
                    e: this.elist[i]
                };
            },

            sum_results: function () {
                var nn = this.size,
                    k,
                    result_sum = 0.0;

                for (k = 0; k < nn; k++) {
                    result_sum += this.rlist[k];
                }

                return result_sum;
            },

            subinterval_too_small: function (a1, a2, b2) {
                var e = 2.2204460492503131e-16,
                    u = 2.2250738585072014e-308,
                    tmp = (1 + 100 * e) * (Math.abs(a2) + 1000 * u);

                return Math.abs(a1) <= tmp && Math.abs(b2) <= tmp;
            }
        };
    },

    /**
     * Quadrature algorithm qag from QUADPACK.
     * Internal method used in {@link JXG.Math.Numerics.GaussKronrod15},
     * {@link JXG.Math.Numerics.GaussKronrod21},
     * {@link JXG.Math.Numerics.GaussKronrod31}.
     *
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @param {Object} [config] The algorithm setup. Accepted propert are max. recursion limit of type number,
     * and epsrel and epsabs, the relative and absolute required precision of type number. Further,
     * q the internal quadrature sub-algorithm of type function.
     * @param {Number} [config.limit=15]
     * @param {Number} [config.epsrel=0.0000001]
     * @param {Number} [config.epsabs=0.0000001]
     * @param {Number} [config.q=JXG.Math.Numerics.GaussKronrod15]
     * @returns {Number} Integral value of f over interval
     *
     * @example
     * function f(x) {
     *   return x*x;
     * }
     *
     * // calculates integral of <tt>f</tt> from 0 to 2.
     * var area1 = JXG.Math.Numerics.Qag([0, 2], f);
     *
     * // the same with an anonymous function
     * var area2 = JXG.Math.Numerics.Qag([0, 2], function (x) { return x*x; });
     *
     * // use JXG.Math.Numerics.GaussKronrod31 rule as sub-algorithm.
     * var area3 = JXG.Math.Numerics.Quag([0, 2], f,
     *                                   {q: JXG.Math.Numerics.GaussKronrod31});
     * @memberof JXG.Math.Numerics
     */
    Qag: function (interval, f, config) {
        var DBL_EPS = 2.2204460492503131e-16,
            ws = this._workspace(interval, 1000),
            limit = config && Type.isNumber(config.limit) ? config.limit : 15,
            epsrel = config && Type.isNumber(config.epsrel) ? config.epsrel : 0.0000001,
            epsabs = config && Type.isNumber(config.epsabs) ? config.epsabs : 0.0000001,
            q = config && Type.isFunction(config.q) ? config.q : this.GaussKronrod15,
            resultObj = {},
            area,
            errsum,
            result0,
            abserr0,
            resabs0,
            resasc0,
            result,
            tolerance,
            iteration = 0,
            roundoff_type1 = 0,
            roundoff_type2 = 0,
            error_type = 0,
            round_off,
            a1,
            b1,
            a2,
            b2,
            a_i,
            b_i,
            r_i,
            e_i,
            area1 = 0,
            area2 = 0,
            area12 = 0,
            error1 = 0,
            error2 = 0,
            error12 = 0,
            resasc1,
            resasc2,
            // resabs1, resabs2,
            wsObj,
            delta;

        if (limit > ws.limit) {
            JXG.warn("iteration limit exceeds available workspace");
        }
        if (epsabs <= 0 && (epsrel < 50 * Mat.eps || epsrel < 0.5e-28)) {
            JXG.warn("tolerance cannot be acheived with given epsabs and epsrel");
        }

        result0 = q.apply(this, [interval, f, resultObj]);
        abserr0 = resultObj.abserr;
        resabs0 = resultObj.resabs;
        resasc0 = resultObj.resasc;

        ws.set_initial_result(result0, abserr0);
        tolerance = Math.max(epsabs, epsrel * Math.abs(result0));
        round_off = 50 * DBL_EPS * resabs0;

        if (abserr0 <= round_off && abserr0 > tolerance) {
            result = result0;
            // abserr = abserr0;

            JXG.warn("cannot reach tolerance because of roundoff error on first attempt");
            return -Infinity;
        }

        if ((abserr0 <= tolerance && abserr0 !== resasc0) || abserr0 === 0.0) {
            result = result0;
            // abserr = abserr0;

            return result;
        }

        if (limit === 1) {
            result = result0;
            // abserr = abserr0;

            JXG.warn("a maximum of one iteration was insufficient");
            return -Infinity;
        }

        area = result0;
        errsum = abserr0;
        iteration = 1;

        do {
            area1 = 0;
            area2 = 0;
            area12 = 0;
            error1 = 0;
            error2 = 0;
            error12 = 0;

            /* Bisect the subinterval with the largest error estimate */
            wsObj = ws.retrieve();
            a_i = wsObj.a;
            b_i = wsObj.b;
            r_i = wsObj.r;
            e_i = wsObj.e;

            a1 = a_i;
            b1 = 0.5 * (a_i + b_i);
            a2 = b1;
            b2 = b_i;

            area1 = q.apply(this, [[a1, b1], f, resultObj]);
            error1 = resultObj.abserr;
            // resabs1 = resultObj.resabs;
            resasc1 = resultObj.resasc;

            area2 = q.apply(this, [[a2, b2], f, resultObj]);
            error2 = resultObj.abserr;
            // resabs2 = resultObj.resabs;
            resasc2 = resultObj.resasc;

            area12 = area1 + area2;
            error12 = error1 + error2;

            errsum += error12 - e_i;
            area += area12 - r_i;

            if (resasc1 !== error1 && resasc2 !== error2) {
                delta = r_i - area12;
                if (Math.abs(delta) <= 1.0e-5 * Math.abs(area12) && error12 >= 0.99 * e_i) {
                    roundoff_type1++;
                }
                if (iteration >= 10 && error12 > e_i) {
                    roundoff_type2++;
                }
            }

            tolerance = Math.max(epsabs, epsrel * Math.abs(area));

            if (errsum > tolerance) {
                if (roundoff_type1 >= 6 || roundoff_type2 >= 20) {
                    error_type = 2; /* round off error */
                }

                /* set error flag in the case of bad integrand behaviour at
                    a point of the integration range */

                if (ws.subinterval_too_small(a1, a2, b2)) {
                    error_type = 3;
                }
            }

            ws.update(a1, b1, area1, error1, a2, b2, area2, error2);
            wsObj = ws.retrieve();
            a_i = wsObj.a_i;
            b_i = wsObj.b_i;
            r_i = wsObj.r_i;
            e_i = wsObj.e_i;

            iteration++;
        } while (iteration < limit && !error_type && errsum > tolerance);

        result = ws.sum_results();
        // abserr = errsum;
        /*
  if (errsum <= tolerance)
    {
      return GSL_SUCCESS;
    }
  else if (error_type == 2)
    {
      GSL_ERROR ("roundoff error prevents tolerance from being achieved",
                 GSL_EROUND);
    }
  else if (error_type == 3)
    {
      GSL_ERROR ("bad integrand behavior found in the integration interval",
                 GSL_ESING);
    }
  else if (iteration == limit)
    {
      GSL_ERROR ("maximum number of subdivisions reached", GSL_EMAXITER);
    }
  else
    {
      GSL_ERROR ("could not integrate function", GSL_EFAILED);
    }
*/

        return result;
    },

    /**
     * Integral of function f over interval.
     * @param {Array} interval The integration interval, e.g. [0, 3].
     * @param {function} f A function which takes one argument of type number and returns a number.
     * @returns {Number} The value of the integral of f over interval
     * @see JXG.Math.Numerics.NewtonCotes
     * @see JXG.Math.Numerics.Romberg
     * @see JXG.Math.Numerics.Qag
     * @memberof JXG.Math.Numerics
     */
    I: function (interval, f) {
        // return this.NewtonCotes(interval, f, {number_of_nodes: 16, integration_type: 'milne'});
        // return this.Romberg(interval, f, {max_iterations: 20, eps: 0.0000001});
        return this.Qag(interval, f, {
            q: this.GaussKronrod15,
            limit: 15,
            epsrel: 0.0000001,
            epsabs: 0.0000001
        });
    },

    /**
     * Newton's method to find roots of a funtion in one variable.
     * @param {function} f We search for a solution of f(x)=0.
     * @param {Number} x initial guess for the root, i.e. start value.
     * @param {Object} context optional object that is treated as "this" in the function body. This is useful if
     * the function is a method of an object and contains a reference to its parent object via "this".
     * @returns {Number} A root of the function f.
     * @memberof JXG.Math.Numerics
     */
    Newton: function (f, x, context) {
        var df,
            i = 0,
            h = Mat.eps,
            newf = f.apply(context, [x]);
        // nfev = 1;

        // For compatibility
        if (Type.isArray(x)) {
            x = x[0];
        }

        while (i < 50 && Math.abs(newf) > h) {
            df = this.D(f, context)(x);
            // nfev += 2;

            if (Math.abs(df) > h) {
                x -= newf / df;
            } else {
                x += Math.random() * 0.2 - 1.0;
            }

            newf = f.apply(context, [x]);
            // nfev += 1;
            i += 1;
        }

        return x;
    },

    /**
     * Abstract method to find roots of univariate functions, which - for the time being -
     * is an alias for {@link JXG.Math.Numerics.chandrupatla}.
     * @param {function} f We search for a solution of f(x)=0.
     * @param {Number|Array} x initial guess for the root, i.e. starting value, or start interval enclosing the root.
     * If x is an interval [a,b], it is required that f(a)f(b) <= 0, otherwise the minimum of f in [a, b] will be returned.
     * If x is a number, the algorithms tries to enclose the root by an interval [a, b] containing x and the root and
     * f(a)f(b) <= 0. If this fails, the algorithm falls back to Newton's method.
     *
     * @param {Object} context optional object that is treated as "this" in the function body. This is useful if
     * the function is a method of an object and contains a reference to its parent object via "this".
     * @returns {Number} A root of the function f.
     *
     * @see JXG.Math.Numerics.chandrupatla
     * @see JXG.Math.Numerics.fzero
     * @see JXG.Math.Numerics.polzeros
     * @see JXG.Math.Numerics.Newton
     * @memberof JXG.Math.Numerics
     */
    root: function (f, x, context) {
        //return this.fzero(f, x, context);
        return this.chandrupatla(f, x, context);
    },

    /**
     * Compute an intersection of the curves c1 and c2
     * with a generalized Newton method (Newton-Raphson).
     * We want to find values t1, t2 such that
     * c1(t1) = c2(t2), i.e.
     * <br>
     * (c1_x(t1) - c2_x(t2), c1_y(t1) - c2_y(t2)) = (0, 0).
     * <p>
     * We set
     * (e, f) := (c1_x(t1) - c2_x(t2), c1_y(t1) - c2_y(t2))
     * <p>
     * The Jacobian J is defined by
     * <pre>
     * J = (a, b)
     *     (c, d)
     * </pre>
     * where
     * <ul>
     * <li> a = c1_x'(t1)
     * <li> b = -c2_x'(t2)
     * <li> c = c1_y'(t1)
     * <li> d = -c2_y'(t2)
     * </ul>
     * The inverse J^(-1) of J is equal to
     * <pre>
     *  (d, -b) / (ad - bc)
     *  (-c, a) / (ad - bc)
     * </pre>
     *
     * Then, (t1new, t2new) := (t1,t2) - J^(-1)*(e,f).
     * <p>
     *
     * @param {JXG.Curve} c1 Curve, Line or Circle
     * @param {JXG.Curve} c2 Curve, Line or Circle
     * @param {Number} t1ini start value for t1
     * @param {Number} t2ini start value for t2
     * @returns {JXG.Coords} intersection point
     * @memberof JXG.Math.Numerics
     */
    generalizedNewton: function (c1, c2, t1ini, t2ini) {
        var t1, t2,
            a, b, c, d, e, f,
            disc,
            F,
            D00, D01, D10, D11,
            count = 0;

        // if (this.generalizedNewton.t1memo) {
        //     t1 = this.generalizedNewton.t1memo;
        //     t2 = this.generalizedNewton.t2memo;
        // } else {
        t1 = t1ini;
        t2 = t2ini;
        // }

        e = c1.X(t1) - c2.X(t2);
        f = c1.Y(t1) - c2.Y(t2);
        F = e * e + f * f;

        D00 = this.D(c1.X, c1);
        D01 = this.D(c2.X, c2);
        D10 = this.D(c1.Y, c1);
        D11 = this.D(c2.Y, c2);

        while (F > Mat.eps && count < 10) {
            a = D00(t1);
            b = -D01(t2);
            c = D10(t1);
            d = -D11(t2);
            disc = a * d - b * c;
            t1 -= (d * e - b * f) / disc;
            t2 -= (a * f - c * e) / disc;
            e = c1.X(t1) - c2.X(t2);
            f = c1.Y(t1) - c2.Y(t2);
            F = e * e + f * f;
            count += 1;
        }

        // this.generalizedNewton.t1memo = t1;
        // this.generalizedNewton.t2memo = t2;

        if (Math.abs(t1) < Math.abs(t2)) {
            return [c1.X(t1), c1.Y(t1)];
        }

        return [c2.X(t2), c2.Y(t2)];
    },

    /**
     * Apply damped Newton-Raphson algorithm to determine the intersection
     * between the curve elements c1 and c2. Transformations of the curves
     * are already taken into regard.
     * <p>
     * We use a very high accuracy: Mat.eps**3
     *
     * @deprecated
     * @param {JXG.Curve} c1 Curve, Line or Circle
     * @param {JXG.Curve} c2 Curve, Line or Circle
     * @param {Number} t1ini Start value for curve c1
     * @param {Number} t2ini Start value for curve c2
     * @param {Number} gamma Damping factor, should be in the open interval (0, 1)
     * @param {Number} eps Stop if function value is smaller than eps
     * @returns {Array} [t1, t2, F2], where t1 and t2 are the parameters of the intersection for both curves, F2 is ||c1[t1]-c2[t2]||**2.
     */
    generalizedDampedNewtonCurves: function (c1, c2, t1ini, t2ini, gamma, eps) {
        var t1, t2,
            a, b, c, d, e, f,
            disc,
            F2,
            f1, f2,
            D, Dt,
            max_it = 40,
            count = 0;

        t1 = t1ini;
        t2 = t2ini;

        f1 = c1.Ft(t1);
        f2 = c2.Ft(t2);
        e = f1[1] - f2[1];
        f = f1[2] - f2[2];
        F2 = e * e + f * f;

        D = function(t1, t2) {
            var h = Mat.eps,
                f1_1 = c1.Ft(t1 - h),
                f1_2 = c1.Ft(t1 + h),
                f2_1 = c2.Ft(t2 - h),
                f2_2 = c2.Ft(t2 + h);
            return [
                [ (f1_2[1] - f1_1[1]) / (2 * h),
                 -(f2_2[1] - f2_1[1]) / (2 * h)],
                [ (f1_2[2] - f1_1[2]) / (2 * h),
                 -(f2_2[2] - f2_1[2]) / (2 * h)]
            ];
        };

        while (F2 > eps && count < max_it) {
            Dt = D(t1, t2);
            a = Dt[0][0];
            b = Dt[0][1];
            c = Dt[1][0];
            d = Dt[1][1];

            disc = a * d - b * c;
            t1 -= gamma * (d * e - b * f) / disc;
            t2 -= gamma * (a * f - c * e) / disc;
            f1 = c1.Ft(t1);
            f2 = c2.Ft(t2);

            e = f1[1] - f2[1];
            f = f1[2] - f2[2];
            F2 = e * e + f * f;
            count += 1;
        }

        return [t1, t2, F2];
    },

    /**
     * Apply the damped Newton-Raphson algorithm to determine to find a root of a
     * function F: R^n to R^n.
     *
     * @param {Function} F Function with n parameters, returns a vactor of length n.
     * @param {Function} D Function returning the Jacobian matrix (n \times n) of F
     * @param {Number} n
     * @param {Array} t_ini Array of length n, containing start values
     * @param {Number} gamma Damping factor should be between 0 and 1. If equal to 1,
     * the algorithm is Newton-Raphson.
     * @param {Number} eps The algorithm stops if the square norm of the root is less than this eps
     * or if the maximum number of steps is reached.
     * @param {Number} [max_steps=40] maximum number of steps
     * @returns {Array} [t, F2] array of length, containing t, the approximation of the root (array of length n),
     * and the square norm of F(t).
     */
    generalizedDampedNewton: function (F, D, n, t_ini, gamma, eps, max_steps) {
        var i,
            t = [],
            a, b, c, d, e, f,
            disc,
            Ft, Dt,
            F2, vec,
            count = 0;

        max_steps = max_steps || 40;

        t = t_ini.slice(0, n);
        Ft = F(t, n);

        if (n === 2) {
            // Special case n = 2
            Ft = F(t, n);
            e = Ft[0];
            f = Ft[1];
            F2 = e * e + f * f;

            while (F2 > eps && count < max_steps) {
                Dt = D(t, n);

                a = Dt[0][0];
                b = Dt[0][1];
                c = Dt[1][0];
                d = Dt[1][1];

                disc = a * d - b * c;
                t[0] -= gamma * (d * e - b * f) / disc;
                t[1] -= gamma * (a * f - c * e) / disc;

                Ft = F(t, n);
                e = Ft[0];
                f = Ft[1];
                F2 = e * e + f * f;

                count += 1;
            }

            return [t, F2];
        } else {
            // General case, arbitrary n
            Ft = F(t, n);
            F2 = Mat.innerProduct(Ft, Ft, n);

            while (F2 > eps && count < max_steps) {
                Dt = Mat.inverse(D(t, n));

                vec = Mat.matVecMult(Dt, Ft);
                for (i = 0; i < n; i++) {
                    t[i] -= gamma * vec[i];
                }

                Ft = F(t, n);
                F2 = Mat.innerProduct(Ft, Ft, n);

                count += 1;
            }

            return [t, F2];
        }
    },

    /**
     * Returns the Lagrange polynomials for curves with equidistant nodes, see
     * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
     * SIAM Review, Vol 46, No 3, (2004) 501-517.
     * The graph of the parametric curve [x(t),y(t)] runs through the given points.
     * @param {Array} p Array of JXG.Points
     * @returns {Array} An array consisting of two functions x(t), y(t) which define a parametric curve
     * f(t) = (x(t), y(t)), a number x1 (which equals 0) and a function x2 defining the curve's domain.
     * That means the curve is defined between x1 and x2(). x2 returns the (length of array p minus one).
     * @memberof JXG.Math.Numerics
     *
     * @example
     * var p = [];
     *
     * p[0] = board.create('point', [0, -2], {size:2, name: 'C(a)'});
     * p[1] = board.create('point', [-1.5, 5], {size:2, name: ''});
     * p[2] = board.create('point', [1, 4], {size:2, name: ''});
     * p[3] = board.create('point', [3, 3], {size:2, name: 'C(b)'});
     *
     * // Curve
     * var fg = JXG.Math.Numerics.Neville(p);
     * var graph = board.create('curve', fg, {strokeWidth:3, strokeOpacity:0.5});
     *
     * </pre><div id="JXG88a8b3a8-6561-44f5-a678-76bca13fd484" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG88a8b3a8-6561-44f5-a678-76bca13fd484',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var p = [];
     *
     *     p[0] = board.create('point', [0, -2], {size:2, name: 'C(a)'});
     *     p[1] = board.create('point', [-1.5, 5], {size:2, name: ''});
     *     p[2] = board.create('point', [1, 4], {size:2, name: ''});
     *     p[3] = board.create('point', [3, 3], {size:2, name: 'C(b)'});
     *
     *     // Curve
     *     var fg = JXG.Math.Numerics.Neville(p);
     *     var graph = board.create('curve', fg, {strokeWidth:3, strokeOpacity:0.5});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    Neville: function (p) {
        var w = [],
            /** @ignore */
            makeFct = function (fun) {
                return function (t, suspendedUpdate) {
                    var i,
                        d,
                        s,
                        bin = Mat.binomial,
                        len = p.length,
                        len1 = len - 1,
                        num = 0.0,
                        denom = 0.0;

                    if (!suspendedUpdate) {
                        s = 1;
                        for (i = 0; i < len; i++) {
                            w[i] = bin(len1, i) * s;
                            s *= -1;
                        }
                    }

                    d = t;

                    for (i = 0; i < len; i++) {
                        if (d === 0) {
                            return p[i][fun]();
                        }
                        s = w[i] / d;
                        d -= 1;
                        num += p[i][fun]() * s;
                        denom += s;
                    }
                    return num / denom;
                };
            },
            xfct = makeFct('X'),
            yfct = makeFct('Y');

        return [
            xfct,
            yfct,
            0,
            function () {
                return p.length - 1;
            }
        ];
    },

    /**
     * Calculates second derivatives at the given knots.
     * @param {Array} x x values of knots
     * @param {Array} y y values of knots
     * @returns {Array} Second derivatives of the interpolated function at the knots.
     * @see JXG.Math.Numerics.splineEval
     * @memberof JXG.Math.Numerics
     */
    splineDef: function (x, y) {
        var pair,
            i,
            l,
            n = Math.min(x.length, y.length),
            diag = [],
            z = [],
            data = [],
            dx = [],
            delta = [],
            F = [];

        if (n === 2) {
            return [0, 0];
        }

        for (i = 0; i < n; i++) {
            pair = { X: x[i], Y: y[i] };
            data.push(pair);
        }
        data.sort(function (a, b) {
            return a.X - b.X;
        });
        for (i = 0; i < n; i++) {
            x[i] = data[i].X;
            y[i] = data[i].Y;
        }

        for (i = 0; i < n - 1; i++) {
            dx.push(x[i + 1] - x[i]);
        }
        for (i = 0; i < n - 2; i++) {
            delta.push(
                (6 * (y[i + 2] - y[i + 1])) / dx[i + 1] - (6 * (y[i + 1] - y[i])) / dx[i]
            );
        }

        // ForwardSolve
        diag.push(2 * (dx[0] + dx[1]));
        z.push(delta[0]);

        for (i = 0; i < n - 3; i++) {
            l = dx[i + 1] / diag[i];
            diag.push(2 * (dx[i + 1] + dx[i + 2]) - l * dx[i + 1]);
            z.push(delta[i + 1] - l * z[i]);
        }

        // BackwardSolve
        F[n - 3] = z[n - 3] / diag[n - 3];
        for (i = n - 4; i >= 0; i--) {
            F[i] = (z[i] - dx[i + 1] * F[i + 1]) / diag[i];
        }

        // Generate f''-Vector
        for (i = n - 3; i >= 0; i--) {
            F[i + 1] = F[i];
        }

        // natural cubic spline
        F[0] = 0;
        F[n - 1] = 0;

        return F;
    },

    /**
     * Evaluate points on spline.
     * @param {Number|Array} x0 A single float value or an array of values to evaluate
     * @param {Array} x x values of knots
     * @param {Array} y y values of knots
     * @param {Array} F Second derivatives at knots, calculated by {@link JXG.Math.Numerics.splineDef}
     * @see JXG.Math.Numerics.splineDef
     * @returns {Number|Array} A single value or an array, depending on what is given as x0.
     * @memberof JXG.Math.Numerics
     */
    splineEval: function (x0, x, y, F) {
        var i,
            j,
            a,
            b,
            c,
            d,
            x_,
            n = Math.min(x.length, y.length),
            l = 1,
            asArray = false,
            y0 = [];

        // number of points to be evaluated
        if (Type.isArray(x0)) {
            l = x0.length;
            asArray = true;
        } else {
            x0 = [x0];
        }

        for (i = 0; i < l; i++) {
            // is x0 in defining interval?
            if (x0[i] < x[0] || x[i] > x[n - 1]) {
                return NaN;
            }

            // determine part of spline in which x0 lies
            for (j = 1; j < n; j++) {
                if (x0[i] <= x[j]) {
                    break;
                }
            }

            j -= 1;

            // we're now in the j-th partial interval, i.e. x[j] < x0[i] <= x[j+1];
            // determine the coefficients of the polynomial in this interval
            a = y[j];
            b =
                (y[j + 1] - y[j]) / (x[j + 1] - x[j]) -
                ((x[j + 1] - x[j]) / 6) * (F[j + 1] + 2 * F[j]);
            c = F[j] / 2;
            d = (F[j + 1] - F[j]) / (6 * (x[j + 1] - x[j]));
            // evaluate x0[i]
            x_ = x0[i] - x[j];
            //y0.push(a + b*x_ + c*x_*x_ + d*x_*x_*x_);
            y0.push(a + (b + (c + d * x_) * x_) * x_);
        }

        if (asArray) {
            return y0;
        }

        return y0[0];
    },

    /**
     * Generate a string containing the function term of a polynomial.
     * @param {Array} coeffs Coefficients of the polynomial. The position i belongs to x^i.
     * @param {Number} deg Degree of the polynomial
     * @param {String} varname Name of the variable (usually 'x')
     * @param {Number} prec Precision
     * @returns {String} A string containing the function term of the polynomial.
     * @memberof JXG.Math.Numerics
     */
    generatePolynomialTerm: function (coeffs, deg, varname, prec) {
        var i,
            t = [];

        for (i = deg; i >= 0; i--) {
            Type.concat(t, ["(", coeffs[i].toPrecision(prec), ")"]);

            if (i > 1) {
                Type.concat(t, ["*", varname, "<sup>", i, "<", "/sup> + "]);
            } else if (i === 1) {
                Type.concat(t, ["*", varname, " + "]);
            }
        }

        return t.join("");
    },

    /**
     * Computes the polynomial through a given set of coordinates in Lagrange form.
     * Returns the Lagrange polynomials, see
     * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
     * SIAM Review, Vol 46, No 3, (2004) 501-517.
     * <p>
     * It possesses the method getTerm() which returns the string containing the function term of the polynomial and
     * the method getCoefficients() which returns an array containing the coefficients of the polynomial.
     * @param {Array} p Array of JXG.Points
     * @returns {function} A function of one parameter which returns the value of the polynomial, whose graph runs through the given points.
     * @memberof JXG.Math.Numerics
     *
     * @example
     * var p = [];
     * p[0] = board.create('point', [-1,2], {size:4});
     * p[1] = board.create('point', [0,3], {size:4});
     * p[2] = board.create('point', [1,1], {size:4});
     * p[3] = board.create('point', [3,-1], {size:4});
     * var f = JXG.Math.Numerics.lagrangePolynomial(p);
     * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     * </pre><div id="JXGc058aa6b-74d4-41e1-af94-df06169a2d89" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGc058aa6b-74d4-41e1-af94-df06169a2d89',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var p = [];
     *     p[0] = board.create('point', [-1,2], {size:4});
     *     p[1] = board.create('point', [0,3], {size:4});
     *     p[2] = board.create('point', [1,1], {size:4});
     *     p[3] = board.create('point', [3,-1], {size:4});
     *     var f = JXG.Math.Numerics.lagrangePolynomial(p);
     *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     *     })();
     *
     * </script><pre>
     *
     * @example
     * var points = [];
     * points[0] = board.create('point', [-1,2], {size:4});
     * points[1] = board.create('point', [0, 0], {size:4});
     * points[2] = board.create('point', [2, 1], {size:4});
     *
     * var f = JXG.Math.Numerics.lagrangePolynomial(points);
     * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     * var txt = board.create('text', [-3, -4,  () => f.getTerm(2, 't', ' * ')], {fontSize: 16});
     * var txt2 = board.create('text', [-3, -6,  () => f.getCoefficients()], {fontSize: 12});
     *
     * </pre><div id="JXG73fdaf12-e257-4374-b488-ae063e4eecbb" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG73fdaf12-e257-4374-b488-ae063e4eecbb',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var points = [];
     *     points[0] = board.create('point', [-1,2], {size:4});
     *     points[1] = board.create('point', [0, 0], {size:4});
     *     points[2] = board.create('point', [2, 1], {size:4});
     *
     *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
     *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *     var txt = board.create('text', [-3, -4,  () => f.getTerm(2, 't', ' * ')], {fontSize: 16});
     *     var txt2 = board.create('text', [-3, -6,  () => f.getCoefficients()], {fontSize: 12});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    lagrangePolynomial: function (p) {
        var w = [],
            that = this,
            /** @ignore */
            fct = function (x, suspendedUpdate) {
                var i, // j,
                    k,
                    xi,
                    s, //M,
                    len = p.length,
                    num = 0,
                    denom = 0;

                if (!suspendedUpdate) {
                    for (i = 0; i < len; i++) {
                        w[i] = 1.0;
                        xi = p[i].X();

                        for (k = 0; k < len; k++) {
                            if (k !== i) {
                                w[i] *= xi - p[k].X();
                            }
                        }

                        w[i] = 1 / w[i];
                    }

                    // M = [];
                    // for (k = 0; k < len; k++) {
                    //     M.push([1]);
                    // }
                }

                for (i = 0; i < len; i++) {
                    xi = p[i].X();

                    if (x === xi) {
                        return p[i].Y();
                    }

                    s = w[i] / (x - xi);
                    denom += s;
                    num += s * p[i].Y();
                }

                return num / denom;
            };

        /**
         * Get the term of the Lagrange polynomial as string.
         * Calls {@link JXG.Math.Numerics#lagrangePolynomialTerm}.
         *
         * @name JXG.Math.Numerics.lagrangePolynomial#getTerm
         * @param {Number} digits Number of digits of the coefficients
         * @param {String} param Variable name
         * @param {String} dot Dot symbol
         * @returns {String} containing the term of Lagrange polynomial as string.
         * @see JXG.Math.Numerics.lagrangePolynomialTerm
         * @example
         * var points = [];
         * points[0] = board.create('point', [-1,2], {size:4});
         * points[1] = board.create('point', [0, 0], {size:4});
         * points[2] = board.create('point', [2, 1], {size:4});
         *
         * var f = JXG.Math.Numerics.lagrangePolynomial(points);
         * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
         * var txt = board.create('text', [-3, -4,  () => f.getTerm(2, 't', ' * ')], {fontSize: 16});
         *
         * </pre><div id="JXG73fdaf12-e257-4374-b488-ae063e4eeccf" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG73fdaf12-e257-4374-b488-ae063e4eeccf',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var points = [];
         *     points[0] = board.create('point', [-1,2], {size:4});
         *     points[1] = board.create('point', [0, 0], {size:4});
         *     points[2] = board.create('point', [2, 1], {size:4});
         *
         *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
         *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
         *     var txt = board.create('text', [-3, -4,  () => f.getTerm(2, 't', ' * ')], {fontSize: 16});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        fct.getTerm = function (digits, param, dot) {
            return that.lagrangePolynomialTerm(p, digits, param, dot)();
        };

        /**
         * Get the coefficients of the Lagrange polynomial as array. The leading
         * coefficient is at position 0.
         * Calls {@link JXG.Math.Numerics#lagrangePolynomialCoefficients}.
         *
         * @name JXG.Math.Numerics.lagrangePolynomial#getCoefficients
         * @returns {Array} containing the coefficients of the Lagrange polynomial.
         * @see JXG.Math.Numerics.lagrangePolynomial.getTerm
         * @see JXG.Math.Numerics.lagrangePolynomialTerm
         * @see JXG.Math.Numerics.lagrangePolynomialCoefficients
         * @example
         * var points = [];
         * points[0] = board.create('point', [-1,2], {size:4});
         * points[1] = board.create('point', [0, 0], {size:4});
         * points[2] = board.create('point', [2, 1], {size:4});
         *
         * var f = JXG.Math.Numerics.lagrangePolynomial(points);
         * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
         * var txt = board.create('text', [1, -4,  () => f.getCoefficients()], {fontSize: 10});
         *
         * </pre><div id="JXG52a883a5-2e0c-4caf-8f84-8650c173c365" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG52a883a5-2e0c-4caf-8f84-8650c173c365',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var points = [];
         *     points[0] = board.create('point', [-1,2], {size:4});
         *     points[1] = board.create('point', [0, 0], {size:4});
         *     points[2] = board.create('point', [2, 1], {size:4});
         *
         *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
         *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
         *     var txt = board.create('text', [1, -4,  () => f.getCoefficients()], {fontSize: 10});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        fct.getCoefficients = function () {
            return that.lagrangePolynomialCoefficients(p)();
        };

        return fct;
    },

    /**
     * Determine the Lagrange polynomial through an array of points and
     * return the term of the polynomial as string.
     *
     * @param {Array} points Array of JXG.Points
     * @param {Number} digits Number of decimal digits of the coefficients
     * @param {String} param Name of the parameter. Default: 'x'.
     * @param {String} dot Multiplication symbol. Default: ' * '.
     * @returns {Function} returning the Lagrange polynomial term through
     *    the supplied points as string
     * @memberof JXG.Math.Numerics
     *
     * @example
     * var points = [];
     * points[0] = board.create('point', [-1,2], {size:4});
     * points[1] = board.create('point', [0, 0], {size:4});
     * points[2] = board.create('point', [2, 1], {size:4});
     *
     * var f = JXG.Math.Numerics.lagrangePolynomial(points);
     * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     * var f_txt = JXG.Math.Numerics.lagrangePolynomialTerm(points, 2, 't', ' * ');
     * var txt = board.create('text', [-3, -4, f_txt], {fontSize: 16});
     *
     * </pre><div id="JXGd45e9e96-7526-486d-aa43-e1178d5f2baa" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGd45e9e96-7526-486d-aa43-e1178d5f2baa',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var points = [];
     *     points[0] = board.create('point', [-1,2], {size:4});
     *     points[1] = board.create('point', [0, 0], {size:4});
     *     points[2] = board.create('point', [2, 1], {size:4});
     *
     *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
     *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     *     var f_txt = JXG.Math.Numerics.lagrangePolynomialTerm(points, 2, 't', ' * ');
     *     var txt = board.create('text', [-3, -4, f_txt], {fontSize: 16});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    lagrangePolynomialTerm: function (points, digits, param, dot) {
        var that = this;

        return function () {
            var len = points.length,
                coeffs = [],
                isLeading = true,
                n, t, j, c;

            param = param || 'x';
            if (dot === undefined) {
                dot = " * ";
            }

            n = len - 1; // (Max) degree of the polynomial
            coeffs = that.lagrangePolynomialCoefficients(points)();

            t = "";
            for (j = 0; j < coeffs.length; j++) {
                c = coeffs[j];
                if (Math.abs(c) < Mat.eps) {
                    continue;
                }
                if (JXG.exists(digits)) {
                    c = Env._round10(c, -digits);
                }
                if (isLeading) {
                    t += c > 0 ? c : "-" + -c;
                    isLeading = false;
                } else {
                    t += c > 0 ? " + " + c : " - " + -c;
                }

                if (n - j > 1) {
                    t += dot + param + "^" + (n - j);
                } else if (n - j === 1) {
                    t += dot + param;
                }
            }
            return t; // board.jc.manipulate('f = map(x) -> ' + t + ';');
        };
    },

    /**
     * Determine the Lagrange polynomial through an array of points and
     * return the coefficients of the polynomial as array.
     * The leading coefficient is at position 0.
     *
     * @param {Array} points Array of JXG.Points
     * @returns {Function} returning the coefficients of the Lagrange polynomial through
     *    the supplied points.
     * @memberof JXG.Math.Numerics
     *
     * @example
     * var points = [];
     * points[0] = board.create('point', [-1,2], {size:4});
     * points[1] = board.create('point', [0, 0], {size:4});
     * points[2] = board.create('point', [2, 1], {size:4});
     *
     * var f = JXG.Math.Numerics.lagrangePolynomial(points);
     * var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     * var f_arr = JXG.Math.Numerics.lagrangePolynomialCoefficients(points);
     * var txt = board.create('text', [1, -4, f_arr], {fontSize: 10});
     *
     * </pre><div id="JXG1778f0d1-a420-473f-99e8-1755ef4be97e" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG1778f0d1-a420-473f-99e8-1755ef4be97e',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var points = [];
     *     points[0] = board.create('point', [-1,2], {size:4});
     *     points[1] = board.create('point', [0, 0], {size:4});
     *     points[2] = board.create('point', [2, 1], {size:4});
     *
     *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
     *     var graph = board.create('functiongraph', [f,-10, 10], {strokeWidth:3});
     *
     *     var f_arr = JXG.Math.Numerics.lagrangePolynomialCoefficients(points);
     *     var txt = board.create('text', [1, -4, f_arr], {fontSize: 10});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    lagrangePolynomialCoefficients: function (points) {
        return function () {
            var len = points.length,
                zeroes = [],
                coeffs = [],
                coeffs_sum = [],
                i, j, c, p;

            // n = len - 1; // (Max) degree of the polynomial
            for (j = 0; j < len; j++) {
                coeffs_sum[j] = 0;
            }

            for (i = 0; i < len; i++) {
                c = points[i].Y();
                p = points[i].X();
                zeroes = [];
                for (j = 0; j < len; j++) {
                    if (j !== i) {
                        c /= p - points[j].X();
                        zeroes.push(points[j].X());
                    }
                }
                coeffs = [1].concat(Mat.Vieta(zeroes));
                for (j = 0; j < coeffs.length; j++) {
                    coeffs_sum[j] += (j % 2 === 1 ? -1 : 1) * coeffs[j] * c;
                }
            }

            return coeffs_sum;
        };
    },

    /**
     * Determine the coefficients of a cardinal spline polynom, See
     * https://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections
     * @param  {Number} x1 point 1
     * @param  {Number} x2 point 2
     * @param  {Number} t1 tangent slope 1
     * @param  {Number} t2 tangent slope 2
     * @return {Array}    coefficents array c for the polynomial t maps to
     * c[0] + c[1]*t + c[2]*t*t + c[3]*t*t*t
     */
    _initCubicPoly: function (x1, x2, t1, t2) {
        return [x1, t1, -3 * x1 + 3 * x2 - 2 * t1 - t2, 2 * x1 - 2 * x2 + t1 + t2];
    },

    /**
     * Computes the cubic cardinal spline curve through a given set of points. The curve
     * is uniformly parametrized.
     * Two artificial control points at the beginning and the end are added.
     *
     * The implementation (especially the centripetal parametrization) is from
     * https://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections .
     * @param {Array} points Array consisting of JXG.Points.
     * @param {Number|Function} tau The tension parameter, either a constant number or a function returning a number. This number is between 0 and 1.
     * tau=1/2 give Catmull-Rom splines.
     * @param {String} type (Optional) parameter which allows to choose between "uniform" (default) and
     * "centripetal" parameterization. Thus the two possible values are "uniform" or "centripetal".
     * @returns {Array} An Array consisting of four components: Two functions each of one parameter t
     * which return the x resp. y coordinates of the Catmull-Rom-spline curve in t, a zero value,
     * and a function simply returning the length of the points array
     * minus three.
     * @memberof JXG.Math.Numerics
     */
    CardinalSpline: function (points, tau_param, type) {
        var p,
            coeffs = [],
            makeFct,
            tau, _tau,
            that = this;

        if (Type.isFunction(tau_param)) {
            _tau = tau_param;
        } else {
            _tau = function () {
                return tau_param;
            };
        }

        if (type === undefined) {
            type = 'uniform';
        }

        /** @ignore */
        makeFct = function (which) {
            return function (t, suspendedUpdate) {
                var s,
                    c,
                    // control point at the beginning and at the end
                    first,
                    last,
                    t1,
                    t2,
                    dt0,
                    dt1,
                    dt2,
                    // dx, dy,
                    len;

                if (points.length < 2) {
                    return NaN;
                }

                if (!suspendedUpdate) {
                    tau = _tau();

                    // New point list p: [first, points ..., last]
                    first = {
                        X: function () {
                            return 2 * points[0].X() - points[1].X();
                        },
                        Y: function () {
                            return 2 * points[0].Y() - points[1].Y();
                        },
                        Dist: function (p) {
                            var dx = this.X() - p.X(),
                                dy = this.Y() - p.Y();
                            return Mat.hypot(dx, dy);
                        }
                    };

                    last = {
                        X: function () {
                            return (
                                2 * points[points.length - 1].X() -
                                points[points.length - 2].X()
                            );
                        },
                        Y: function () {
                            return (
                                2 * points[points.length - 1].Y() -
                                points[points.length - 2].Y()
                            );
                        },
                        Dist: function (p) {
                            var dx = this.X() - p.X(),
                                dy = this.Y() - p.Y();
                            return Mat.hypot(dx, dy);
                        }
                    };

                    p = [first].concat(points, [last]);
                    len = p.length;

                    coeffs[which] = [];

                    for (s = 0; s < len - 3; s++) {
                        if (type === 'centripetal') {
                            // The order is important, since p[0].coords === undefined
                            dt0 = p[s].Dist(p[s + 1]);
                            dt1 = p[s + 2].Dist(p[s + 1]);
                            dt2 = p[s + 3].Dist(p[s + 2]);

                            dt0 = Math.sqrt(dt0);
                            dt1 = Math.sqrt(dt1);
                            dt2 = Math.sqrt(dt2);

                            if (dt1 < Mat.eps) {
                                dt1 = 1.0;
                            }
                            if (dt0 < Mat.eps) {
                                dt0 = dt1;
                            }
                            if (dt2 < Mat.eps) {
                                dt2 = dt1;
                            }

                            t1 =
                                (p[s + 1][which]() - p[s][which]()) / dt0 -
                                (p[s + 2][which]() - p[s][which]()) / (dt1 + dt0) +
                                (p[s + 2][which]() - p[s + 1][which]()) / dt1;

                            t2 =
                                (p[s + 2][which]() - p[s + 1][which]()) / dt1 -
                                (p[s + 3][which]() - p[s + 1][which]()) / (dt2 + dt1) +
                                (p[s + 3][which]() - p[s + 2][which]()) / dt2;

                            t1 *= dt1;
                            t2 *= dt1;

                            coeffs[which][s] = that._initCubicPoly(
                                p[s + 1][which](),
                                p[s + 2][which](),
                                tau * t1,
                                tau * t2
                            );
                        } else {
                            coeffs[which][s] = that._initCubicPoly(
                                p[s + 1][which](),
                                p[s + 2][which](),
                                tau * (p[s + 2][which]() - p[s][which]()),
                                tau * (p[s + 3][which]() - p[s + 1][which]())
                            );
                        }
                    }
                }

                if (isNaN(t)) {
                    return NaN;
                }

                len = points.length;
                // This is necessary for our advanced plotting algorithm:
                if (t <= 0.0) {
                    return points[0][which]();
                }
                if (t >= len) {
                    return points[len - 1][which]();
                }

                s = Math.floor(t);
                if (s === t) {
                    return points[s][which]();
                }

                t -= s;
                c = coeffs[which][s];
                if (c === undefined) {
                    return NaN;
                }

                return ((c[3] * t + c[2]) * t + c[1]) * t + c[0];
            };
        };

        return [
            makeFct('X'),
            makeFct('Y'),
            0,
            function () {
                return points.length - 1;
            }
        ];
    },

    /**
     * Computes the cubic Catmull-Rom spline curve through a given set of points. The curve
     * is uniformly parametrized. The curve is the cardinal spline curve for tau=0.5.
     * Two artificial control points at the beginning and the end are added.
     * @param {Array} points Array consisting of JXG.Points.
     * @param {String} type (Optional) parameter which allows to choose between "uniform" (default) and
     * "centripetal" parameterization. Thus the two possible values are "uniform" or "centripetal".
     * @returns {Array} An Array consisting of four components: Two functions each of one parameter t
     * which return the x resp. y coordinates of the Catmull-Rom-spline curve in t, a zero value, and a function simply
     * returning the length of the points array minus three.
     * @memberof JXG.Math.Numerics
     */
    CatmullRomSpline: function (points, type) {
        return this.CardinalSpline(points, 0.5, type);
    },

    /**
     * Computes the regression polynomial of a given degree through a given set of coordinates.
     * Returns the regression polynomial function.
     * @param {Number|function|Slider} degree number, function or slider.
     * Either
     * @param {Array} dataX Array containing either the x-coordinates of the data set or both coordinates in
     * an array of {@link JXG.Point}s or {@link JXG.Coords}.
     * In the latter case, the <tt>dataY</tt> parameter will be ignored.
     * @param {Array} dataY Array containing the y-coordinates of the data set,
     * @returns {function} A function of one parameter which returns the value of the regression polynomial of the given degree.
     * It possesses the method getTerm() which returns the string containing the function term of the polynomial.
     * The function returned will throw an exception, if the data set is malformed.
     * @memberof JXG.Math.Numerics
     */
    regressionPolynomial: function (degree, dataX, dataY) {
        var coeffs, deg, dX, dY, inputType, fct,
            term = "";

        // Slider
        if (Type.isPoint(degree) && Type.isFunction(degree.Value)) {
            /** @ignore */
            deg = function () {
                return degree.Value();
            };
            // function
        } else if (Type.isFunction(degree)) {
            deg = degree;
            // number
        } else if (Type.isNumber(degree)) {
            /** @ignore */
            deg = function () {
                return degree;
            };
        } else {
            throw new Error(
                "JSXGraph: Can't create regressionPolynomial from degree of type'" +
                typeof degree +
                "'."
            );
        }

        // Parameters degree, dataX, dataY
        if (arguments.length === 3 && Type.isArray(dataX) && Type.isArray(dataY)) {
            inputType = 0;
            // Parameters degree, point array
        } else if (
            arguments.length === 2 &&
            Type.isArray(dataX) &&
            dataX.length > 0 &&
            Type.isPoint(dataX[0])
        ) {
            inputType = 1;
        } else if (
            arguments.length === 2 &&
            Type.isArray(dataX) &&
            dataX.length > 0 &&
            dataX[0].usrCoords &&
            dataX[0].scrCoords
        ) {
            inputType = 2;
        } else {
            throw new Error("JSXGraph: Can't create regressionPolynomial. Wrong parameters.");
        }

        /** @ignore */
        fct = function (x, suspendedUpdate) {
            var i, j,
                M, MT, y, B, c, s, d,
                // input data
                len = dataX.length;

            d = Math.floor(deg());

            if (!suspendedUpdate) {
                // point list as input
                if (inputType === 1) {
                    dX = [];
                    dY = [];

                    for (i = 0; i < len; i++) {
                        dX[i] = dataX[i].X();
                        dY[i] = dataX[i].Y();
                    }
                }

                if (inputType === 2) {
                    dX = [];
                    dY = [];

                    for (i = 0; i < len; i++) {
                        dX[i] = dataX[i].usrCoords[1];
                        dY[i] = dataX[i].usrCoords[2];
                    }
                }

                // check for functions
                if (inputType === 0) {
                    dX = [];
                    dY = [];

                    for (i = 0; i < len; i++) {
                        if (Type.isFunction(dataX[i])) {
                            dX.push(dataX[i]());
                        } else {
                            dX.push(dataX[i]);
                        }

                        if (Type.isFunction(dataY[i])) {
                            dY.push(dataY[i]());
                        } else {
                            dY.push(dataY[i]);
                        }
                    }
                }

                M = [];
                for (j = 0; j < len; j++) {
                    M.push([1]);
                }
                for (i = 1; i <= d; i++) {
                    for (j = 0; j < len; j++) {
                        M[j][i] = M[j][i - 1] * dX[j];
                    }
                }

                y = dY;
                MT = Mat.transpose(M);
                B = Mat.matMatMult(MT, M);
                c = Mat.matVecMult(MT, y);
                coeffs = Mat.Numerics.Gauss(B, c);
                term = Mat.Numerics.generatePolynomialTerm(coeffs, d, "x", 3);
            }

            // Horner's scheme to evaluate polynomial
            s = coeffs[d];
            for (i = d - 1; i >= 0; i--) {
                s = s * x + coeffs[i];
            }

            return s;
        };

        /** @ignore */
        fct.getTerm = function () {
            return term;
        };

        return fct;
    },

    /**
     * Computes the cubic Bezier curve through a given set of points.
     * @param {Array} points Array consisting of 3*k+1 {@link JXG.Points}.
     * The points at position k with k mod 3 = 0 are the data points,
     * points at position k with k mod 3 = 1 or 2 are the control points.
     * @returns {Array} An array consisting of two functions of one parameter t which return the
     * x resp. y coordinates of the Bezier curve in t, one zero value, and a third function accepting
     * no parameters and returning one third of the length of the points.
     * @memberof JXG.Math.Numerics
     */
    bezier: function (points) {
        var len,
            flen,
            /** @ignore */
            makeFct = function (which) {
                return function (t, suspendedUpdate) {
                    var z = Math.floor(t) * 3,
                        t0 = t % 1,
                        t1 = 1 - t0;

                    if (!suspendedUpdate) {
                        flen = 3 * Math.floor((points.length - 1) / 3);
                        len = Math.floor(flen / 3);
                    }

                    if (t < 0) {
                        return points[0][which]();
                    }

                    if (t >= len) {
                        return points[flen][which]();
                    }

                    if (isNaN(t)) {
                        return NaN;
                    }

                    return (
                        t1 * t1 * (t1 * points[z][which]() + 3 * t0 * points[z + 1][which]()) +
                        (3 * t1 * points[z + 2][which]() + t0 * points[z + 3][which]()) *
                        t0 *
                        t0
                    );
                };
            };

        return [
            makeFct('X'),
            makeFct('Y'),
            0,
            function () {
                return Math.floor(points.length / 3);
            }
        ];
    },

    /**
     * Computes the B-spline curve of order k (order = degree+1) through a given set of points.
     * @param {Array} points Array consisting of JXG.Points.
     * @param {Number} order Order of the B-spline curve.
     * @returns {Array} An Array consisting of four components: Two functions each of one parameter t
     * which return the x resp. y coordinates of the B-spline curve in t, a zero value, and a function simply
     * returning the length of the points array minus one.
     * @memberof JXG.Math.Numerics
     */
    bspline: function (points, order) {
        var knots,
            _knotVector = function (n, k) {
                var j,
                    kn = [];

                for (j = 0; j < n + k + 1; j++) {
                    if (j < k) {
                        kn[j] = 0.0;
                    } else if (j <= n) {
                        kn[j] = j - k + 1;
                    } else {
                        kn[j] = n - k + 2;
                    }
                }

                return kn;
            },
            _evalBasisFuncs = function (t, kn, k, s) {
                var i,
                    j,
                    a,
                    b,
                    den,
                    N = [];

                if (kn[s] <= t && t < kn[s + 1]) {
                    N[s] = 1;
                } else {
                    N[s] = 0;
                }

                for (i = 2; i <= k; i++) {
                    for (j = s - i + 1; j <= s; j++) {
                        if (j <= s - i + 1 || j < 0) {
                            a = 0.0;
                        } else {
                            a = N[j];
                        }

                        if (j >= s) {
                            b = 0.0;
                        } else {
                            b = N[j + 1];
                        }

                        den = kn[j + i - 1] - kn[j];

                        if (den === 0) {
                            N[j] = 0;
                        } else {
                            N[j] = ((t - kn[j]) / den) * a;
                        }

                        den = kn[j + i] - kn[j + 1];

                        if (den !== 0) {
                            N[j] += ((kn[j + i] - t) / den) * b;
                        }
                    }
                }
                return N;
            },
            /** @ignore */
            makeFct = function (which) {
                return function (t, suspendedUpdate) {
                    var y,
                        j,
                        s,
                        N = [],
                        len = points.length,
                        n = len - 1,
                        k = order;

                    if (n <= 0) {
                        return NaN;
                    }

                    if (n + 2 <= k) {
                        k = n + 1;
                    }

                    if (t <= 0) {
                        return points[0][which]();
                    }

                    if (t >= n - k + 2) {
                        return points[n][which]();
                    }

                    s = Math.floor(t) + k - 1;
                    knots = _knotVector(n, k);
                    N = _evalBasisFuncs(t, knots, k, s);

                    y = 0.0;
                    for (j = s - k + 1; j <= s; j++) {
                        if (j < len && j >= 0) {
                            y += points[j][which]() * N[j];
                        }
                    }

                    return y;
                };
            };

        return [
            makeFct('X'),
            makeFct('Y'),
            0,
            function () {
                return points.length - 1;
            }
        ];
    },

    /**
     * Numerical (symmetric) approximation of derivative. suspendUpdate is piped through,
     * see {@link JXG.Curve#updateCurve}
     * and {@link JXG.Curve#hasPoint}.
     * @param {function} f Function in one variable to be differentiated.
     * @param {object} [obj] Optional object that is treated as "this" in the function body. This is useful, if the function is a
     * method of an object and contains a reference to its parent object via "this".
     * @returns {function} Derivative function of a given function f.
     * @memberof JXG.Math.Numerics
     */
    D: function (f, obj) {
        if (!Type.exists(obj)) {
            return function (x, suspendedUpdate) {
                var h = 0.00001,
                    h2 = h * 2.0;

                // Experiments with Richardsons rule
                /*
                    var phi = (f(x + h, suspendedUpdate) - f(x - h, suspendedUpdate)) / h2;
                    var phi2;
                    h *= 0.5;
                    h2 *= 0.5;
                    phi2 = (f(x + h, suspendedUpdate) - f(x - h, suspendedUpdate)) / h2;

                    return phi2 + (phi2 - phi) / 3.0;
                    */
                return (f(x + h, suspendedUpdate) - f(x - h, suspendedUpdate)) / h2;
            };
        }

        return function (x, suspendedUpdate) {
            var h = 0.00001,
                h2 = h * 2.0;

            return (
                (f.apply(obj, [x + h, suspendedUpdate]) -
                    f.apply(obj, [x - h, suspendedUpdate])) /
                h2
            );
        };
    },

    /**
     * Evaluate the function term for {@link JXG.Math.Numerics.riemann}.
     * @private
     * @param {Number} x function argument
     * @param {function} f JavaScript function returning a number
     * @param {String} type Name of the Riemann sum type, e.g. 'lower'.
     * @param {Number} delta Width of the bars in user coordinates
     * @returns {Number} Upper (delta > 0) or lower (delta < 0) value of the bar containing x of the Riemann sum.
     * @see JXG.Math.Numerics.riemann
     * @private
     * @memberof JXG.Math.Numerics
     */
    _riemannValue: function (x, f, type, delta) {
        var y, y1, x1, delta1;

        if (delta < 0) {
            // delta is negative if the lower function term is evaluated
            if (type !== 'trapezoidal') {
                x = x + delta;
            }
            delta *= -1;
            if (type === 'lower') {
                type = 'upper';
            } else if (type === 'upper') {
                type = 'lower';
            }
        }

        delta1 = delta * 0.01; // for 'lower' and 'upper'

        if (type === 'right') {
            y = f(x + delta);
        } else if (type === 'middle') {
            y = f(x + delta * 0.5);
        } else if (type === "left" || type === 'trapezoidal') {
            y = f(x);
        } else if (type === 'lower') {
            y = f(x);

            for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                y1 = f(x1);

                if (y1 < y) {
                    y = y1;
                }
            }

            y1 = f(x + delta);
            if (y1 < y) {
                y = y1;
            }
        } else if (type === 'upper') {
            y = f(x);

            for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                y1 = f(x1);
                if (y1 > y) {
                    y = y1;
                }
            }

            y1 = f(x + delta);
            if (y1 > y) {
                y = y1;
            }
        } else if (type === 'random') {
            y = f(x + delta * Math.random());
        } else if (type === 'simpson') {
            y = (f(x) + 4 * f(x + delta * 0.5) + f(x + delta)) / 6.0;
        } else {
            y = f(x); // default is lower
        }

        return y;
    },

    /**
     * Helper function to create curve which displays Riemann sums.
     * Compute coordinates for the rectangles showing the Riemann sum.
     * <p>
     * In case of type "simpson" and "trapezoidal", the horizontal line approximating the function value
     * is replaced by a parabola or a secant. IN case of "simpson",
     * the parabola is approximated visually by a polygonal chain of fixed step width.
     *
     * @param {Function|Array} f Function or array of two functions.
     * If f is a function the integral of this function is approximated by the Riemann sum.
     * If f is an array consisting of two functions the area between the two functions is filled
     * by the Riemann sum bars.
     * @param {Number} n number of rectangles.
     * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', 'random', 'simpson', or 'trapezoidal'.
     * "simpson" is Simpson's 1/3 rule.
     * @param {Number} start Left border of the approximation interval
     * @param {Number} end Right border of the approximation interval
     * @returns {Array} An array of two arrays containing the x and y coordinates for the rectangles showing the Riemann sum. This
     * array may be used as parent array of a {@link JXG.Curve}. The third parameteris the riemann sum, i.e. the sum of the volumes of all
     * rectangles.
     * @memberof JXG.Math.Numerics
     */
    riemann: function (gf, n, type, start, end) {
        var i, delta,
            k, a, b, c, f0, f1, f2, xx, h,
            steps = 30, // Fixed step width for Simpson's rule
            xarr = [],
            yarr = [],
            x = start,
            sum = 0,
            y, f, g;

        if (Type.isArray(gf)) {
            g = gf[0];
            f = gf[1];
        } else {
            f = gf;
        }

        n = Math.floor(n);

        if (n <= 0) {
            return [xarr, yarr, sum];
        }

        delta = (end - start) / n;

        // "Upper" horizontal line defined by function
        for (i = 0; i < n; i++) {
            if (type === 'simpson') {
                sum += this._riemannValue(x, f, type, delta) * delta;

                h = delta * 0.5;
                f0 = f(x);
                f1 = f(x + h);
                f2 = f(x + 2 * h);

                a = (f2 + f0 - 2 * f1) / (h * h) * 0.5;
                b = (f2 - f0) / (2 * h);
                c = f1;
                for (k = 0; k < steps; k++) {
                    xx = k * delta / steps - h;
                    xarr.push(x + xx + h);
                    yarr.push(a * xx * xx + b * xx + c);
                }
                x += delta;
                y = f2;
            } else {
                y = this._riemannValue(x, f, type, delta);
                xarr.push(x);
                yarr.push(y);

                x += delta;
                if (type === 'trapezoidal') {
                    f2 = f(x);
                    sum += (y + f2) * 0.5 * delta;
                    y = f2;
                } else {
                    sum += y * delta;
                }

                xarr.push(x);
                yarr.push(y);
            }
            xarr.push(x);
            yarr.push(y);
        }

        // "Lower" horizontal line
        // Go backwards
        for (i = 0; i < n; i++) {
            if (type === "simpson" && g) {
                sum -= this._riemannValue(x, g, type, -delta) * delta;

                h = delta * 0.5;
                f0 = g(x);
                f1 = g(x - h);
                f2 = g(x - 2 * h);

                a = (f2 + f0 - 2 * f1) / (h * h) * 0.5;
                b = (f2 - f0) / (2 * h);
                c = f1;
                for (k = 0; k < steps; k++) {
                    xx = k * delta / steps - h;
                    xarr.push(x - xx - h);
                    yarr.push(a * xx * xx + b * xx + c);
                }
                x -= delta;
                y = f2;
            } else {
                if (g) {
                    y = this._riemannValue(x, g, type, -delta);
                } else {
                    y = 0.0;
                }
                xarr.push(x);
                yarr.push(y);

                x -= delta;
                if (g) {
                    if (type === 'trapezoidal') {
                        f2 = g(x);
                        sum -= (y + f2) * 0.5 * delta;
                        y = f2;
                    } else {
                        sum -= y * delta;
                    }
                }
            }
            xarr.push(x);
            yarr.push(y);

            // Draw the vertical lines
            xarr.push(x);
            yarr.push(f(x));
        }

        return [xarr, yarr, sum];
    },

    /**
     * Approximate the integral by Riemann sums.
     * Compute the area described by the riemann sum rectangles.
     *
     * If there is an element of type {@link Riemannsum}, then it is more efficient
     * to use the method JXG.Curve.Value() of this element instead.
     *
     * @param {Function_Array} f Function or array of two functions.
     * If f is a function the integral of this function is approximated by the Riemann sum.
     * If f is an array consisting of two functions the area between the two functions is approximated
     * by the Riemann sum.
     * @param {Number} n number of rectangles.
     * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', 'random', 'simpson' or 'trapezoidal'.
     *
     * @param {Number} start Left border of the approximation interval
     * @param {Number} end Right border of the approximation interval
     * @returns {Number} The sum of the areas of the rectangles.
     * @memberof JXG.Math.Numerics
     */
    riemannsum: function (f, n, type, start, end) {
        JXG.deprecated("Numerics.riemannsum()", "Numerics.riemann()[2]");
        return this.riemann(f, n, type, start, end)[2];
    },

    /**
     * Solve initial value problems numerically using <i>explicit</i> Runge-Kutta methods.
     * See {@link https://en.wikipedia.org/wiki/Runge-Kutta_methods} for more information on the algorithm.
     * @param {object|String} butcher Butcher tableau describing the Runge-Kutta method to use. This can be either a string describing
     * a Runge-Kutta method with a Butcher tableau predefined in JSXGraph like 'euler', 'heun', 'rk4' or an object providing the structure
     * <pre>
     * {
     *     s: &lt;Number&gt;,
     *     A: &lt;matrix&gt;,
     *     b: &lt;Array&gt;,
     *     c: &lt;Array&gt;
     * }
     * </pre>
     * which corresponds to the Butcher tableau structure
     * shown here: https://en.wikipedia.org/w/index.php?title=List_of_Runge%E2%80%93Kutta_methods&oldid=357796696 .
     * <i>Default</i> is 'euler'.
     * @param {Array} x0 Initial value vector. Even if the problem is one-dimensional, the initial value has to be given in an array.
     * @param {Array} I Interval on which to integrate.
     * @param {Number} N Number of integration intervals, i.e. there are <i>N+1</i> evaluation points.
     * @param {function} f Function describing the right hand side of the first order ordinary differential equation, i.e. if the ode
     * is given by the equation <pre>dx/dt = f(t, x(t))</pre>. So, f has to take two parameters, a number <tt>t</tt> and a
     * vector <tt>x</tt>, and has to return a vector of the same length as <tt>x</tt> has.
     * @returns {Array} An array of vectors describing the solution of the ode on the given interval I.
     * @example
     * // A very simple autonomous system dx(t)/dt = x(t);
     * var f = function(t, x) {
     *     return [x[0]];
     * }
     *
     * // Solve it with initial value x(0) = 1 on the interval [0, 2]
     * // with 20 evaluation points.
     * var data = JXG.Math.Numerics.rungeKutta('heun', [1], [0, 2], 20, f);
     *
     * // Prepare data for plotting the solution of the ode using a curve.
     * var dataX = [];
     * var dataY = [];
     * var h = 0.1;        // (I[1] - I[0])/N  = (2-0)/20
     * var i;
     * for(i=0; i&lt;data.length; i++) {
     *     dataX[i] = i*h;
     *     dataY[i] = data[i][0];
     * }
     * var g = board.create('curve', [dataX, dataY], {strokeWidth:'2px'});
     * </pre><div class="jxgbox" id="JXGd2432d04-4ef7-4159-a90b-a2eb8d38c4f6" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * var board = JXG.JSXGraph.initBoard('JXGd2432d04-4ef7-4159-a90b-a2eb8d38c4f6', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     * var f = function(t, x) {
     *     // we have to copy the value.
     *     // return x; would just return the reference.
     *     return [x[0]];
     * }
     * var data = JXG.Math.Numerics.rungeKutta('heun', [1], [0, 2], 20, f);
     * var dataX = [];
     * var dataY = [];
     * var h = 0.1;
     * for(var i=0; i<data.length; i++) {
     *     dataX[i] = i*h;
     *     dataY[i] = data[i][0];
     * }
     * var g = board.create('curve', [dataX, dataY], {strokeColor:'red', strokeWidth:'2px'});
     * </script><pre>
     * @memberof JXG.Math.Numerics
     */
    rungeKutta: function (butcher, x0, I, N, f) {
        var e,
            i, j, k, l, s,
            x = [],
            y = [],
            h = (I[1] - I[0]) / N,
            t = I[0],
            dim = x0.length,
            result = [],
            r = 0;

        if (Type.isString(butcher)) {
            butcher = predefinedButcher[butcher] || predefinedButcher.euler;
        }
        s = butcher.s;

        // Don't change x0, so copy it
        x = x0.slice();

        for (i = 0; i <= N; i++) {
            result[r] = x.slice();

            r++;
            k = [];

            for (j = 0; j < s; j++) {
                // Init y = 0
                for (e = 0; e < dim; e++) {
                    y[e] = 0.0;
                }

                // Calculate linear combination of former k's and save it in y
                for (l = 0; l < j; l++) {
                    for (e = 0; e < dim; e++) {
                        y[e] += butcher.A[j][l] * h * k[l][e];
                    }
                }

                // Add x(t) to y
                for (e = 0; e < dim; e++) {
                    y[e] += x[e];
                }

                // Calculate new k and add it to the k matrix
                k.push(f(t + butcher.c[j] * h, y));
            }

            // Init y = 0
            for (e = 0; e < dim; e++) {
                y[e] = 0.0;
            }

            for (l = 0; l < s; l++) {
                for (e = 0; e < dim; e++) {
                    y[e] += butcher.b[l] * k[l][e];
                }
            }

            for (e = 0; e < dim; e++) {
                x[e] = x[e] + h * y[e];
            }

            t += h;
        }

        return result;
    },

    /**
     * Maximum number of iterations in {@link JXG.Math.Numerics.fzero} and
     * {@link JXG.Math.Numerics.chandrupatla}
     * @type Number
     * @default 80
     * @memberof JXG.Math.Numerics
     */
    maxIterationsRoot: 80,

    /**
     * Maximum number of iterations in {@link JXG.Math.Numerics.fminbr}
     * @type Number
     * @default 500
     * @memberof JXG.Math.Numerics
     */
    maxIterationsMinimize: 500,

    /**
     * Given a number x_0, this function tries to find a second number x_1 such that
     * the function f has opposite signs at x_0 and x_1.
     * The return values have to be tested if the method succeeded.
     *
     * @param {Function} f Function, whose root is to be found
     * @param {Number} x0 Start value
     * @param {Object} [context] Parent object in case f is method of it
     * @returns {Array} [x_0, f(x_0), x_1, f(x_1)] in case that x_0 <= x_1
     *   or [x_1, f(x_1), x_0, f(x_0)] in case that x_1 < x_0.
     *
     * @see JXG.Math.Numerics.fzero
     * @see JXG.Math.Numerics.chandrupatla
     *
     * @memberof JXG.Math.Numerics
     */
    findBracket: function (f, x0, context) {
        var a, aa, fa, blist, b, fb, u, fu, i, len;

        if (Type.isArray(x0)) {
            return x0;
        }

        a = x0;
        fa = f.call(context, a);
        // nfev += 1;

        // Try to get b, by trying several values related to a
        aa = a === 0 ? 1 : a;
        blist = [
            a - 0.1 * aa,
            a + 0.1 * aa,
            a - 1,
            a + 1,
            a - 0.5 * aa,
            a + 0.5 * aa,
            a - 0.6 * aa,
            a + 0.6 * aa,
            a - 1 * aa,
            a + 1 * aa,
            a - 2 * aa,
            a + 2 * aa,
            a - 5 * aa,
            a + 5 * aa,
            a - 10 * aa,
            a + 10 * aa,
            a - 50 * aa,
            a + 50 * aa,
            a - 100 * aa,
            a + 100 * aa
        ];
        len = blist.length;

        for (i = 0; i < len; i++) {
            b = blist[i];
            fb = f.call(context, b);
            // nfev += 1;

            if (fa * fb <= 0) {
                break;
            }
        }
        if (b < a) {
            u = a;
            a = b;
            b = u;

            fu = fa;
            fa = fb;
            fb = fu;
        }
        return [a, fa, b, fb];
    },

    /**
     *
     * Find zero of an univariate function f.
     * @param {function} f Function, whose root is to be found
     * @param {Array|Number} x0  Start value or start interval enclosing the root.
     * If x0 is an interval [a,b], it is required that f(a)f(b) <= 0, otherwise the minimum of f in [a, b] will be returned.
     * If x0 is a number, the algorithms tries to enclose the root by an interval [a, b] containing x0 and the root and
     * f(a)f(b) <= 0. If this fails, the algorithm falls back to Newton's method.
     * @param {Object} [context] Parent object in case f is method of it
     * @returns {Number} the approximation of the root
     * Algorithm:
     *  Brent's root finder from
     *  G.Forsythe, M.Malcolm, C.Moler, Computer methods for mathematical
     *  computations. M., Mir, 1980, p.180 of the Russian edition
     *  https://www.netlib.org/c/brent.shar
     *
     * If x0 is an array containing lower and upper bound for the zero
     * algorithm 748 is applied. Otherwise, if x0 is a number,
     * the algorithm tries to bracket a zero of f starting from x0.
     * If this fails, we fall back to Newton's method.
     *
     * @see JXG.Math.Numerics.chandrupatla
     * @see JXG.Math.Numerics.root
     * @see JXG.Math.Numerics.findBracket
     * @see JXG.Math.Numerics.Newton
     * @see JXG.Math.Numerics.fminbr
     * @memberof JXG.Math.Numerics
     */
    fzero: function (f, x0, context) {
        var a, b, c,
            fa, fb, fc,
            res, x00,
            prev_step,
            t1, t2,
            cb,
            tol_act,   // Actual tolerance
            p,         // Interpolation step is calculated in the form p/q; division
            q,         // operations is delayed until the last moment
            new_step,  // Step at this iteration
            eps = Mat.eps,
            maxiter = this.maxIterationsRoot,
            niter = 0;
        // nfev = 0;

        if (Type.isArray(x0)) {
            if (x0.length < 2) {
                throw new Error(
                    "JXG.Math.Numerics.fzero: length of array x0 has to be at least two."
                );
            }

            x00 = this.findDomain(f, x0, context);
            a = x00[0];
            b = x00[1];
            // a = x0[0];
            // b = x0[1];

            fa = f.call(context, a);
            // nfev += 1;
            fb = f.call(context, b);
            // nfev += 1;
        } else {
            res = this.findBracket(f, x0, context);
            a = res[0];
            fa = res[1];
            b = res[2];
            fb = res[3];
        }

        if (Math.abs(fa) <= eps) {
            return a;
        }
        if (Math.abs(fb) <= eps) {
            return b;
        }

        if (fa * fb > 0) {
            // Bracketing not successful, fall back to Newton's method or to fminbr
            if (Type.isArray(x0)) {
                return this.fminbr(f, [a, b], context);
            }

            return this.Newton(f, a, context);
        }

        // OK, we have enclosed a zero of f.
        // Now we can start Brent's method
        c = a;
        fc = fa;

        // Main iteration loop
        while (niter < maxiter) {
            // Distance from the last but one to the last approximation
            prev_step = b - a;

            // Swap data for b to be the best approximation
            if (Math.abs(fc) < Math.abs(fb)) {
                a = b;
                b = c;
                c = a;

                fa = fb;
                fb = fc;
                fc = fa;
            }
            tol_act = 2 * eps * Math.abs(b) + eps * 0.5;
            new_step = (c - b) * 0.5;

            if (Math.abs(new_step) <= tol_act || Math.abs(fb) <= eps) {
                //  Acceptable approx. is found
                return b;
            }

            // Decide if the interpolation can be tried
            // If prev_step was large enough and was in true direction Interpolatiom may be tried
            if (Math.abs(prev_step) >= tol_act && Math.abs(fa) > Math.abs(fb)) {
                cb = c - b;

                // If we have only two distinct points linear interpolation can only be applied
                if (a === c) {
                    t1 = fb / fa;
                    p = cb * t1;
                    q = 1.0 - t1;
                    // Quadric inverse interpolation
                } else {
                    q = fa / fc;
                    t1 = fb / fc;
                    t2 = fb / fa;

                    p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1.0));
                    q = (q - 1.0) * (t1 - 1.0) * (t2 - 1.0);
                }

                // p was calculated with the opposite sign; make p positive
                if (p > 0) {
                    q = -q;
                    // and assign possible minus to q
                } else {
                    p = -p;
                }

                // If b+p/q falls in [b,c] and isn't too large it is accepted
                // If p/q is too large then the bissection procedure can reduce [b,c] range to more extent
                if (
                    p < 0.75 * cb * q - Math.abs(tol_act * q) * 0.5 &&
                    p < Math.abs(prev_step * q * 0.5)
                ) {
                    new_step = p / q;
                }
            }

            // Adjust the step to be not less than tolerance
            if (Math.abs(new_step) < tol_act) {
                new_step = new_step > 0 ? tol_act : -tol_act;
            }

            // Save the previous approx.
            a = b;
            fa = fb;
            b += new_step;
            fb = f.call(context, b);
            // Do step to a new approxim.
            // nfev += 1;

            // Adjust c for it to have a sign opposite to that of b
            if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
                c = a;
                fc = fa;
            }
            niter++;
        } // End while

        return b;
    },

    /**
     * Find zero of an univariate function f.
     * @param {function} f Function, whose root is to be found
     * @param {Array|Number} x0  Start value or start interval enclosing the root.
     * If x0 is an interval [a,b], it is required that f(a)f(b) <= 0, otherwise the minimum of f in [a, b] will be returned.
     * If x0 is a number, the algorithms tries to enclose the root by an interval [a, b] containing x0 and the root and
     * f(a)f(b) <= 0. If this fails, the algorithm falls back to Newton's method.
     * @param {Object} [context] Parent object in case f is method of it
     * @returns {Number} the approximation of the root
     * Algorithm:
     * Chandrupatla's method, see
     * Tirupathi R. Chandrupatla,
     * "A new hybrid quadratic/bisection algorithm for finding the zero of a nonlinear function without using derivatives",
     * Advances in Engineering Software, Volume 28, Issue 3, April 1997, Pages 145-149.
     *
     * If x0 is an array containing lower and upper bound for the zero
     * algorithm 748 is applied. Otherwise, if x0 is a number,
     * the algorithm tries to bracket a zero of f starting from x0.
     * If this fails, we fall back to Newton's method.
     *
     * @see JXG.Math.Numerics.root
     * @see JXG.Math.Numerics.fzero
     * @see JXG.Math.Numerics.findBracket
     * @see JXG.Math.Numerics.Newton
     * @see JXG.Math.Numerics.fminbr
     * @memberof JXG.Math.Numerics
     */
    chandrupatla: function (f, x0, context) {
        var a, b, fa, fb,
            res,
            niter = 0,
            maxiter = this.maxIterationsRoot,
            rand = 1 + Math.random() * 0.001,
            t = 0.5 * rand,
            eps = Mat.eps, // 1.e-10,
            dlt = 0.00001,
            x1, x2, x3, x,
            f1, f2, f3, y,
            xm, fm,
            tol, tl,
            xi, ph, fl, fh,
            AL, A, B, C, D;

        if (Type.isArray(x0)) {
            if (x0.length < 2) {
                throw new Error(
                    "JXG.Math.Numerics.fzero: length of array x0 has to be at least two."
                );
            }

            a = x0[0];
            fa = f.call(context, a);
            // nfev += 1;
            b = x0[1];
            fb = f.call(context, b);
            // nfev += 1;
        } else {
            res = this.findBracket(f, x0, context);
            a = res[0];
            fa = res[1];
            b = res[2];
            fb = res[3];
        }

        if (fa * fb > 0) {
            // Bracketing not successful, fall back to Newton's method or to fminbr
            if (Type.isArray(x0)) {
                return this.fminbr(f, [a, b], context);
            }

            return this.Newton(f, a, context);
        }

        x1 = a;
        x2 = b;
        f1 = fa;
        f2 = fb;
        do {
            x = x1 + t * (x2 - x1);
            y = f.call(context, x);

            // Arrange 2-1-3: 2-1 interval, 1 middle, 3 discarded point
            if (Math.sign(y) === Math.sign(f1)) {
                x3 = x1;
                x1 = x;
                f3 = f1;
                f1 = y;
            } else {
                x3 = x2;
                x2 = x1;
                f3 = f2;
                f2 = f1;
            }
            x1 = x;
            f1 = y;

            xm = x1;
            fm = f1;
            if (Math.abs(f2) < Math.abs(f1)) {
                xm = x2;
                fm = f2;
            }
            tol = 2 * eps * Math.abs(xm) + 0.5 * dlt;
            tl = tol / Math.abs(x2 - x1);
            if (tl > 0.5 || fm === 0) {
                break;
            }
            // If inverse quadratic interpolation holds, use it
            xi = (x1 - x2) / (x3 - x2);
            ph = (f1 - f2) / (f3 - f2);
            fl = 1 - Math.sqrt(1 - xi);
            fh = Math.sqrt(xi);
            if (fl < ph && ph < fh) {
                AL = (x3 - x1) / (x2 - x1);
                A = f1 / (f2 - f1);
                B = f3 / (f2 - f3);
                C = f1 / (f3 - f1);
                D = f2 / (f3 - f2);
                t = A * B + C * D * AL;
            } else {
                t = 0.5 * rand;
            }
            // Adjust t away from the interval boundary
            if (t < tl) {
                t = tl;
            }
            if (t > 1 - tl) {
                t = 1 - tl;
            }
            niter++;
        } while (niter <= maxiter);
        // console.log(niter);

        return xm;
    },

    /**
     * Find a small enclosing interval of the domain of a function by
     * tightening the input interval x0.
     * <p>
     * This is a helper function which is used in {@link JXG.Math.Numerics.fminbr},
     * {@link JXG.Math.Numerics.fzero}, and  {@link JXG.Curve.getLabelPosition}
     * to avoid search in an interval where the function is mostly undefined.
     *
     * @param {function} f
     * @param {Array} x0 Start interval
     * @param {Object} context Parent object in case f is method of it
     * @param {Boolean} [outer=true] if true take a proper enclosing array. If false return the domain such that the function is defined
     * at its  borders.
     * @returns Array
     *
     * @example
     * var f = (x) => Math.sqrt(x);
     * console.log(JXG.Math.Numerics.findDomain(f, [-5, 5]));
     *
     * // Output: [ -0.00020428174445492973, 5 ]
     *
     * @example
     * var f = (x) => Math.sqrt(x);
     * console.log(JXG.Math.Numerics.findDomain(f, [-5, 5], null, false));
     *
     * // Output: [ 0.00020428174562965915, 5 ]
     */
    findDomain: function (f, x0, context, outer) {
        var a, b, c, fc,
            x,
            gr = 1 - 1 / 1.61803398875,
            eps = 0.001,
            cnt,
            max_cnt = 20;

        if (outer === undefined) {
            outer = true;
        }

        if (!Type.isArray(x0) || x0.length < 2) {
            throw new Error(
                "JXG.Math.Numerics.findDomain: length of array x0 has to be at least two."
            );
        }

        x = x0.slice();
        a = x[0];
        b = x[1];
        fc = f.call(context, a);
        if (isNaN(fc)) {
            // Divide the interval with the golden ratio
            // and keep a such that f(a) = NaN
            cnt = 0;
            while (b - a > eps && cnt < max_cnt) {
                c = (b - a) * gr + a;
                fc = f.call(context, c);
                if (isNaN(fc)) {
                    a = c;
                } else {
                    b = c;
                }
                cnt++;
            }
            if (outer) {
                x[0] = a;
            } else {
                x[0] = b;
            }
            // x[0] = a;
        }

        a = x[0];
        b = x[1];
        fc = f.call(context, b);
        if (isNaN(fc)) {
            // Divide the interval with the golden ratio
            // and keep b such that f(b) = NaN
            cnt = 0;
            while (b - a > eps && cnt < max_cnt) {
                c = b - (b - a) * gr;
                fc = f.call(context, c);
                if (isNaN(fc)) {
                    b = c;
                } else {
                    a = c;
                }
                cnt++;
            }
            if (outer) {
                x[1] = b;
            } else {
                x[1] = a;
            }
            // x[1] = b;
        }

        return x;
    },

    /**
     *
     * Find minimum of an univariate function f.
     * <p>
     * Algorithm:
     *  G.Forsythe, M.Malcolm, C.Moler, Computer methods for mathematical
     *  computations. M., Mir, 1980, p.180 of the Russian edition
     *
     * @param {function} f Function, whose minimum is to be found
     * @param {Array} x0  Start interval enclosing the minimum
     * @param {Object} [context] Parent object in case f is method of it
     * @returns {Number} the approximation of the minimum value position
     * @memberof JXG.Math.Numerics
     **/
    fminbr: function (f, x0, context) {
        var a, b, x, v, w,
            fx, fv, fw,
            x00,
            range, middle_range, tol_act, new_step,
            p, q, t, ft,
            r = (3.0 - Math.sqrt(5.0)) * 0.5,      // Golden section ratio
            tol = Mat.eps,
            sqrteps = Mat.eps, // Math.sqrt(Mat.eps),
            maxiter = this.maxIterationsMinimize,
            niter = 0;
        // nfev = 0;

        if (!Type.isArray(x0) || x0.length < 2) {
            throw new Error(
                "JXG.Math.Numerics.fminbr: length of array x0 has to be at least two."
            );
        }

        x00 = this.findDomain(f, x0, context);
        a = x00[0];
        b = x00[1];
        v = a + r * (b - a);
        fv = f.call(context, v);

        // First step - always gold section
        // nfev += 1;
        x = v;
        w = v;
        fx = fv;
        fw = fv;

        while (niter < maxiter) {
            // Range over the interval in which we are looking for the minimum
            range = b - a;
            middle_range = (a + b) * 0.5;

            // Actual tolerance
            tol_act = sqrteps * Math.abs(x) + tol / 3.0;

            if (Math.abs(x - middle_range) + range * 0.5 <= 2.0 * tol_act) {
                // Acceptable approx. is found
                return x;
            }

            // Obtain the golden section step
            new_step = r * (x < middle_range ? b - x : a - x);

            // Decide if the interpolation can be tried. If x and w are distinct, interpolatiom may be tried
            if (Math.abs(x - w) >= tol_act) {
                // Interpolation step is calculated as p/q;
                // division operation is delayed until last moment
                t = (x - w) * (fx - fv);
                q = (x - v) * (fx - fw);
                p = (x - v) * q - (x - w) * t;
                q = 2 * (q - t);

                if (q > 0) {
                    p = -p; // q was calculated with the opposite sign; make q positive
                } else {
                    q = -q; // // and assign possible minus to p
                }
                if (
                    Math.abs(p) < Math.abs(new_step * q) && // If x+p/q falls in [a,b]
                    p > q * (a - x + 2 * tol_act) &&        //  not too close to a and
                    p < q * (b - x - 2 * tol_act)
                ) {
                    // b, and isn't too large
                    new_step = p / q; // it is accepted
                }
                // If p / q is too large then the
                // golden section procedure can
                // reduce [a,b] range to more
                // extent
            }

            // Adjust the step to be not less than tolerance
            if (Math.abs(new_step) < tol_act) {
                if (new_step > 0) {
                    new_step = tol_act;
                } else {
                    new_step = -tol_act;
                }
            }

            // Obtain the next approximation to min
            // and reduce the enveloping range

            // Tentative point for the min
            t = x + new_step;
            ft = f.call(context, t);
            // nfev += 1;

            // t is a better approximation
            if (ft <= fx) {
                // Reduce the range so that t would fall within it
                if (t < x) {
                    b = x;
                } else {
                    a = x;
                }

                // Assign the best approx to x
                v = w;
                w = x;
                x = t;

                fv = fw;
                fw = fx;
                fx = ft;
                // x remains the better approx
            } else {
                // Reduce the range enclosing x
                if (t < x) {
                    a = t;
                } else {
                    b = t;
                }

                if (ft <= fw || w === x) {
                    v = w;
                    w = t;
                    fv = fw;
                    fw = ft;
                } else if (ft <= fv || v === x || v === w) {
                    v = t;
                    fv = ft;
                }
            }
            niter += 1;
        }

        return x;
    },

    /**
     * GLOMIN seeks a global minimum of a function F(X) in an interval [A,B]
     * and is the adaption of the algorithm GLOMIN by Richard Brent.
     *
     * Here is the original documentation:
     * <pre>
     *
     * Discussion:
     *
     * This function assumes that F(X) is twice continuously differentiable over [A,B]
     * and that |F''(X)| <= M for all X in [A,B].
     *
     * Licensing:
     *   This code is distributed under the GNU LGPL license.
     *
     * Modified:
     *
     *   17 April 2008
     *
     * Author:
     *
     *   Original FORTRAN77 version by Richard Brent.
     *   C version by John Burkardt.
     *   https://people.math.sc.edu/Burkardt/c_src/brent/brent.c
     *
     * Reference:
     *
     *   Richard Brent,
     *  Algorithms for Minimization Without Derivatives,
     *   Dover, 2002,
     *  ISBN: 0-486-41998-3,
     *   LC: QA402.5.B74.
     *
     * Parameters:
     *
     *   Input, double A, B, the endpoints of the interval.
     *  It must be the case that A < B.
     *
     *   Input, double C, an initial guess for the global
     *  minimizer.  If no good guess is known, C = A or B is acceptable.
     *
     *  Input, double M, the bound on the second derivative.
     *
     *   Input, double MACHEP, an estimate for the relative machine
     *  precision.
     *
     *   Input, double E, a positive tolerance, a bound for the
     *  absolute error in the evaluation of F(X) for any X in [A,B].
     *
     *   Input, double T, a positive error tolerance.
     *
     *    Input, double F (double x ), a user-supplied
     *  function whose global minimum is being sought.
     *
     *   Output, double *X, the estimated value of the abscissa
     *  for which F attains its global minimum value in [A,B].
     *
     *   Output, double GLOMIN, the value F(X).
     * </pre>
     *
     * In JSXGraph, some parameters of the original algorithm are set to fixed values:
     * <ul>
     *  <li> M = 10000000.0
     *  <li> C = A or B, depending if f(A) <= f(B)
     *  <li> T = JXG.Math.eps
     *  <li> E = JXG.Math.eps * JXG.Math.eps
     *  <li> MACHEP = JXG.Math.eps * JXG.Math.eps * JXG.Math.eps
     * </ul>
     * @param {function} f Function, whose global minimum is to be found
     * @param {Array} x0 Array of length 2 determining the interval [A, B] for which the global minimum is to be found
     * @returns {Array} [x, y] x is the position of the global minimum and y = f(x).
     */
    glomin: function (f, x0) {
        var a0, a2, a3, d0, d1, d2, h,
            k, m2,
            p, q, qs,
            r, s, sc,
            y, y0, y1, y2, y3, yb,
            z0, z1, z2,
            a, b, c, x,
            m = 10000000.0,
            t = Mat.eps, // * Mat.eps,
            e = Mat.eps * Mat.eps,
            machep = Mat.eps * Mat.eps * Mat.eps;

        a = x0[0];
        b = x0[1];
        c = (f(a) < f(b)) ? a : b;

        a0 = b;
        x = a0;
        a2 = a;
        y0 = f(b);
        yb = y0;
        y2 = f(a);
        y = y2;

        if (y0 < y) {
            y = y0;
        } else {
            x = a;
        }

        if (m <= 0.0 || b <= a) {
            return y;
        }

        m2 = 0.5 * (1.0 + 16.0 * machep) * m;

        if (c <= a || b <= c) {
            sc = 0.5 * (a + b);
        } else {
            sc = c;
        }

        y1 = f(sc);
        k = 3;
        d0 = a2 - sc;
        h = 9.0 / 11.0;

        if (y1 < y) {
            x = sc;
            y = y1;
        }

        for (; ;) {
            d1 = a2 - a0;
            d2 = sc - a0;
            z2 = b - a2;
            z0 = y2 - y1;
            z1 = y2 - y0;
            r = d1 * d1 * z0 - d0 * d0 * z1;
            p = r;
            qs = 2.0 * (d0 * z1 - d1 * z0);
            q = qs;

            if (k < 1000000 || y2 <= y) {
                for (; ;) {
                    if (q * (r * (yb - y2) + z2 * q * ((y2 - y) + t)) <
                        z2 * m2 * r * (z2 * q - r)) {

                        a3 = a2 + r / q;
                        y3 = f(a3);

                        if (y3 < y) {
                            x = a3;
                            y = y3;
                        }
                    }
                    k = ((1611 * k) % 1048576);
                    q = 1.0;
                    r = (b - a) * 0.00001 * k;

                    if (z2 <= r) {
                        break;
                    }
                }
            } else {
                k = ((1611 * k) % 1048576);
                q = 1.0;
                r = (b - a) * 0.00001 * k;

                while (r < z2) {
                    if (q * (r * (yb - y2) + z2 * q * ((y2 - y) + t)) <
                        z2 * m2 * r * (z2 * q - r)) {

                        a3 = a2 + r / q;
                        y3 = f(a3);

                        if (y3 < y) {
                            x = a3;
                            y = y3;
                        }
                    }
                    k = ((1611 * k) % 1048576);
                    q = 1.0;
                    r = (b - a) * 0.00001 * k;
                }
            }

            r = m2 * d0 * d1 * d2;
            s = Math.sqrt(((y2 - y) + t) / m2);
            h = 0.5 * (1.0 + h);
            p = h * (p + 2.0 * r * s);
            q = q + 0.5 * qs;
            r = - 0.5 * (d0 + (z0 + 2.01 * e) / (d0 * m2));

            if (r < s || d0 < 0.0) {
                r = a2 + s;
            } else {
                r = a2 + r;
            }

            if (0.0 < p * q) {
                a3 = a2 + p / q;
            } else {
                a3 = r;
            }

            for (; ;) {
                a3 = Math.max(a3, r);

                if (b <= a3) {
                    a3 = b;
                    y3 = yb;
                } else {
                    y3 = f(a3);
                }

                if (y3 < y) {
                    x = a3;
                    y = y3;
                }

                d0 = a3 - a2;

                if (a3 <= r) {
                    break;
                }

                p = 2.0 * (y2 - y3) / (m * d0);

                if ((1.0 + 9.0 * machep) * d0 <= Math.abs(p)) {
                    break;
                }

                if (0.5 * m2 * (d0 * d0 + p * p) <= (y2 - y) + (y3 - y) + 2.0 * t) {
                    break;
                }
                a3 = 0.5 * (a2 + a3);
                h = 0.9 * h;
            }

            if (b <= a3) {
                break;
            }

            a0 = sc;
            sc = a2;
            a2 = a3;
            y0 = y1;
            y1 = y2;
            y2 = y3;
        }

        return [x, y];
    },

    /**
     * Determine all roots of a polynomial with real or complex coefficients by using the
     * iterative method attributed to Weierstrass, Durand, Kerner, Aberth, and Ehrlich. In particular,
     * the iteration method with cubic convergence is used that is usually attributed to Ehrlich-Aberth.
     * <p>
     * The returned roots are sorted with respect to their real values.
     * <p> This method makes use of the JSXGraph classes {@link JXG.Complex} and {@link JXG.C} to handle
     * complex numbers.
     *
     * @param {Array} a Array of coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
     * The coefficients are of type Number or JXG.Complex.
     * @param {Number} [deg] Optional degree of the polynomial. Otherwise all entries are taken, with
     * leading zeros removed.
     * @param {Number} [tol=Number.EPSILON] Approximation tolerance
     * @param {Number} [max_it=30] Maximum number of iterations
     * @param {Array} [initial_values=null] Array of initial values for the roots. If not given,
     * starting values are determined by the method of Ozawa.
     * @returns {Array} Array of complex numbers (of JXG.Complex) approximating the roots of the polynomial.
     * @memberof JXG.Math.Numerics
     * @see JXG.Complex
     * @see JXG.C
     *
     * @example
     * // Polynomial p(z) = -1 + 1z^2
     * var i, roots,
     *     p = [-1, 0, 1];
     *
     * roots = JXG.Math.Numerics.polzeros(p);
     * for (i = 0; i < roots.length; i++) {
     *     console.log(i, roots[i].toString());
     * }
     * // Output:
     *   0 -1 + -3.308722450212111e-24i
     *   1 1 + 0i
     *
     * @example
     * // Polynomial p(z) = -1 + 3z - 9z^2 + z^3 - 8z^6 + 9z^7 - 9z^8 + z^9
     * var i, roots,
     *     p = [-1, 3, -9, 1, 0, 0, -8, 9, -9, 1];
     *
     * roots = JXG.Math.Numerics.polzeros(p);
     * for (i = 0; i < roots.length; i++) {
     *     console.log(i, roots[i].toString());
     * }
     * // Output:
     * 0 -0.7424155888401961 + 0.4950476539211721i
     * 1 -0.7424155888401961 + -0.4950476539211721i
     * 2 0.16674869833354108 + 0.2980502714610669i
     * 3 0.16674869833354108 + -0.29805027146106694i
     * 4 0.21429002063640837 + 1.0682775088132996i
     * 5 0.21429002063640842 + -1.0682775088132999i
     * 6 0.861375497926218 + -0.6259177003583295i
     * 7 0.8613754979262181 + 0.6259177003583295i
     * 8 8.000002743888055 + -1.8367099231598242e-40i
     *
     */
    polzeros: function (coeffs, deg, tol, max_it, initial_values) {
        var i, le, off, it,
            debug = false,
            cc = [],
            obvious = [],
            roots = [],

            /**
             * Horner method to evaluate polynomial or the derivative thereof for complex numbers,
             * i.e. coefficients and variable are complex.
             * @function
             * @param {Array} a Array of complex coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
             * @param {JXG.Complex} z Value for which the polynomial will be evaluated.
             * @param {Boolean} [derivative=false] If true the derivative will be evaluated.
             * @ignore
             */
            hornerComplex = function (a, z, derivative) {
                var i, s,
                    n = a.length - 1;

                derivative = derivative || false;
                if (derivative) {
                    // s = n * a_n
                    s = JXG.C.mult(n, a[n]);
                    for (i = n - 1; i > 0; i--) {
                        // s = s * z + i * a_i
                        s.mult(z);
                        s.add(JXG.C.mult(a[i], i));
                    }
                } else {
                    // s = a_n
                    s = JXG.C.copy(a[n]);
                    for (i = n - 1; i >= 0; i--) {
                        // s = s * z + a_i
                        s.mult(z);
                        s.add(a[i]);
                    }
                }
                return s;
            },

            /**
             * Horner method to evaluate reciprocal polynomial or the derivative thereof for complex numbers,
             * i.e. coefficients and variable are complex.
             * @function
             * @param {Array} a Array of complex coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
             * @param {JXG.Complex} z Value for which the reciprocal polynomial will be evaluated.
             * @param {Boolean} [derivative=false] If true the derivative will be evaluated.
             * @ignore
             */
            hornerRec = function (a, x, derivative) {
                var i, s,
                    n = a.length - 1;

                derivative = derivative || false;
                if (derivative) {
                    // s = n * a_0
                    s = JXG.C.mult(n, a[0]);
                    for (i = n - 1; i > 0; i--) {
                        // s = s * x + i * a_{n-i}
                        s.mult(x);
                        s.add(JXG.C.mult(a[n - i], i));
                    }
                } else {
                    // s = a_0
                    s = JXG.C.copy(a[0]);
                    for (i = n - 1; i >= 0; i--) {
                        // s = s * x + a_{n-i}
                        s.mult(x);
                        s.add(a[n - i]);
                    }
                }
                return s;
            },

            /**
             * Horner method to evaluate real polynomial at a real value.
             * @function
             * @param {Array} a Array of real coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
             * @param {Number} z Value for which the polynomial will be evaluated.
             * @ignore
             */
            horner = function (a, x) {
                var i, s,
                    n = a.length - 1;

                s = a[n];
                for (i = n - 1; i >= 0; i--) {
                    s = s * x + a[i];
                }
                return s;
            },

            /**
             * Determine start values for the Aberth iteration, see
             * Ozawa, "An experimental study of the starting values
             * of the Durand-Kerner-Aberth iteration" (1995).
             *
             * @function
             * @param {Array} a Array of complex coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
             * @returns {Array} Array Initial values for the roots.
             * @ignore
             */
            initial_guess = function (a) {
                var i, r,
                    n = a.length - 1, // degree
                    alpha1 = Math.PI * 2 / n,
                    alpha0 = Math.PI / n * 0.5,
                    b, z,
                    init = [];


                // From Ozawa, "An experimental study of the starting values
                // of the Durand-Kerner-Aberth iteration" (1995)

                // b is the arithmetic mean of the roots.
                // With is Vieta's formula <https://en.wikipedia.org/wiki/Vieta%27s_formulas>
                //   b = -a_{n-1} / (n * a_n)
                b = JXG.C.mult(-1, a[n - 1]);
                b.div(JXG.C.mult(n, a[n]));

                // r is the geometric mean of the deviations |b - root_i|.
                // Using
                //   p(z) = a_n prod(z - root_i)
                // and therefore
                //   |p(b)| = |a_n| prod(|b - root_i|)
                // we arrive at:
                //   r = |p(b)/a_n|^(1/n)
                z = JXG.C.div(hornerComplex(a, b), a[n]);
                r = Math.pow(JXG.C.abs(z), 1 / n);
                if (r === 0) { r = 1; }

                for (i = 0; i < n; i++) {
                    a = new JXG.Complex(r * Math.cos(alpha1 * i + alpha0), r * Math.sin(alpha1 * i + alpha0));
                    init[i] = JXG.C.add(b, a);
                }

                return init;
            },

            /**
             * Ehrlich-Aberth iteration. The stopping criterion is from
             * D.A. Bini, "Numerical computation of polynomial zeros
             * by means of Aberths's method", Numerical Algorithms (1996).
             *
             * @function
             * @param {Array} a Array of complex coefficients of the polynomial a[0] + a[1]*x+ a[2]*x**2...
             * @param {Number} mu Machine precision
             * @param {Number} max_it Maximum number of iterations
             * @param {Array} z Initial guess for the roots. Will be changed in place.
             * @returns {Number} Number of iterations
             * @ignore
             */
            aberthIteration = function (cc, mu, max_it, z) {
                var k, i, j,
                    done = [],
                    cr = [],
                    gamma, x,
                    done_sum = 0,
                    num, denom, s, pp,
                    n = z.length;

                for (i = 0; i < n; i++) {
                    done.push(false);
                }
                for (i = 0; i < cc.length; i++) {
                    cr.push(JXG.C.abs(cc[i]) * (4 * i + 1));
                }
                for (k = 0; k < max_it && done_sum < n; k++) {
                    for (i = 0; i < n; i++) {
                        if (done[i]) {
                            continue;
                        }
                        num = hornerComplex(cc, z[i]);
                        x = JXG.C.abs(z[i]);

                        // Stopping criterion by D.A. Bini
                        // "Numerical computation of polynomial zeros
                        // by means of Aberths's method", Numerical Algorithms (1996).
                        //
                        if (JXG.C.abs(num) < mu * horner(cr, x)) {
                            done[i] = true;
                            done_sum++;
                            if (done_sum === n) {
                                break;
                            }
                            continue;
                        }

                        // num = P(z_i) / P'(z_i)
                        if (x > 1) {
                            gamma = JXG.C.div(1, z[i]);
                            pp = hornerRec(cc, gamma, true);
                            pp.div(hornerRec(cc, gamma));
                            pp.mult(gamma);
                            num = JXG.C.sub(n, pp);
                            num = JXG.C.div(z[i], num);
                        } else {
                            num.div(hornerComplex(cc, z[i], true));
                        }

                        // denom = sum_{i\neq j} 1 / (z_i  - z_j)
                        denom = new JXG.Complex(0);
                        for (j = 0; j < n; j++) {
                            if (j === i) {
                                continue;
                            }
                            s = JXG.C.sub(z[i], z[j]);
                            s = JXG.C.div(1, s);
                            denom.add(s);
                        }

                        // num = num / 1 - num * sum_{i\neq j} 1 / (z_i - z_j)
                        denom.mult(num);
                        denom = JXG.C.sub(1, denom);
                        num.div(denom);
                        // z_i = z_i - num
                        z[i].sub(num);
                    }
                }

                return k;
            };


        tol = tol || Number.EPSILON;
        max_it = max_it || 30;

        le = coeffs.length;
        if (JXG.isNumber(deg) && deg >= 0 && deg < le - 1) {
            le = deg + 1;
        }

        // Convert coefficient array to complex numbers
        for (i = 0; i < le; i++) {
            cc.push(new JXG.Complex(coeffs[i]));
        }

        // Search for (multiple) roots at x=0
        for (i = 0; i < le; i++) {
            if (cc[i].real !== 0 || cc[i].imaginary !== 0) {
                off = i;
                break;
            }
        }

        // Deflate root x=0, store roots at x=0 in obvious
        for (i = 0; i < off; i++) {
            obvious.push(new JXG.Complex(0));
        }
        cc = cc.slice(off);
        le = cc.length;

        // Remove leading zeros from the coefficient array
        for (i = le - 1; i >= 0; i--) {
            if (cc[i].real !== 0 || cc[i].imaginary !== 0) {
                break;
            }
            cc.pop();
        }
        le = cc.length;
        if (le === 0) {
            return [];
        }

        // From now on we can assume that the
        // constant coefficient and the leading coefficient
        // are not zero.
        if (initial_values) {
            for (i = 0; i < le - 1; i++) {
                roots.push(new JXG.Complex(initial_values[i]));
            }
        } else {
            roots = initial_guess(cc);
        }
        it = aberthIteration(cc, tol, max_it, roots);

        // Append the roots at x=0
        roots = obvious.concat(roots);

        if (debug) {
            console.log("Iterations:", it);
            console.log('Roots:');
            for (i = 0; i < roots.length; i++) {
                console.log(i, roots[i].toString(), JXG.C.abs(hornerComplex(cc, roots[i])));
            }
        }

        // Sort roots according to their real part
        roots.sort(function (a, b) {
            if (a.real < b.real) {
                return -1;
            }
            if (a.real > b.real) {
                return 1;
            }
            return 0;
        });

        return roots;
    },

    /**
     * Implements the Ramer-Douglas-Peucker algorithm.
     * It discards points which are not necessary from the polygonal line defined by the point array
     * pts. The computation is done in screen coordinates.
     * Average runtime is O(nlog(n)), worst case runtime is O(n^2), where n is the number of points.
     * @param {Array} pts Array of {@link JXG.Coords}
     * @param {Number} eps If the absolute value of a given number <tt>x</tt> is smaller than <tt>eps</tt> it is considered to be equal <tt>0</tt>.
     * @returns {Array} An array containing points which represent an apparently identical curve as the points of pts do, but contains fewer points.
     * @memberof JXG.Math.Numerics
     */
    RamerDouglasPeucker: function (pts, eps) {
        var allPts = [],
            newPts = [],
            i, k, len,
            endless = true,

            /**
             * findSplit() is a subroutine of {@link JXG.Math.Numerics.RamerDouglasPeucker}.
             * It searches for the point between index i and j which
             * has the largest distance from the line between the points i and j.
             * @param {Array} pts Array of {@link JXG.Coords}
             * @param {Number} i Index of a point in pts
             * @param {Number} j Index of a point in pts
             * @ignore
             * @private
             */
            findSplit = function (pts, i, j) {
                var d, k, ci, cj, ck,
                    x0, y0, x1, y1,
                    den, lbda,
                    eps = Mat.eps * Mat.eps,
                    huge = 10000,
                    dist = 0,
                    f = i;

                if (j - i < 2) {
                    return [-1.0, 0];
                }

                ci = pts[i].scrCoords;
                cj = pts[j].scrCoords;

                if (isNaN(ci[1]) || isNaN(ci[2])) {
                    return [NaN, i];
                }
                if (isNaN(cj[1]) || isNaN(cj[2])) {
                    return [NaN, j];
                }

                for (k = i + 1; k < j; k++) {
                    ck = pts[k].scrCoords;
                    if (isNaN(ck[1]) || isNaN(ck[2])) {
                        return [NaN, k];
                    }

                    x0 = ck[1] - ci[1];
                    y0 = ck[2] - ci[2];
                    x1 = cj[1] - ci[1];
                    y1 = cj[2] - ci[2];
                    x0 = x0 === Infinity ? huge : x0;
                    y0 = y0 === Infinity ? huge : y0;
                    x1 = x1 === Infinity ? huge : x1;
                    y1 = y1 === Infinity ? huge : y1;
                    x0 = x0 === -Infinity ? -huge : x0;
                    y0 = y0 === -Infinity ? -huge : y0;
                    x1 = x1 === -Infinity ? -huge : x1;
                    y1 = y1 === -Infinity ? -huge : y1;
                    den = x1 * x1 + y1 * y1;

                    if (den > eps) {
                        lbda = (x0 * x1 + y0 * y1) / den;

                        if (lbda < 0.0) {
                            lbda = 0.0;
                        } else if (lbda > 1.0) {
                            lbda = 1.0;
                        }

                        x0 = x0 - lbda * x1;
                        y0 = y0 - lbda * y1;
                        d = x0 * x0 + y0 * y0;
                    } else {
                        lbda = 0.0;
                        d = x0 * x0 + y0 * y0;
                    }

                    if (d > dist) {
                        dist = d;
                        f = k;
                    }
                }
                return [Math.sqrt(dist), f];
            },
            /**
             * RDP() is a private subroutine of {@link JXG.Math.Numerics.RamerDouglasPeucker}.
             * It runs recursively through the point set and searches the
             * point which has the largest distance from the line between the first point and
             * the last point. If the distance from the line is greater than eps, this point is
             * included in our new point set otherwise it is discarded.
             * If it is taken, we recursively apply the subroutine to the point set before
             * and after the chosen point.
             * @param {Array} pts Array of {@link JXG.Coords}
             * @param {Number} i Index of an element of pts
             * @param {Number} j Index of an element of pts
             * @param {Number} eps If the absolute value of a given number <tt>x</tt> is smaller than <tt>eps</tt> it is considered to be equal <tt>0</tt>.
             * @param {Array} newPts Array of {@link JXG.Coords}
             * @ignore
             * @private
             */
            RDP = function (pts, i, j, eps, newPts) {
                var result = findSplit(pts, i, j),
                    k = result[1];

                if (isNaN(result[0])) {
                    RDP(pts, i, k - 1, eps, newPts);
                    newPts.push(pts[k]);
                    do {
                        ++k;
                    } while (k <= j && isNaN(pts[k].scrCoords[1] + pts[k].scrCoords[2]));
                    if (k <= j) {
                        newPts.push(pts[k]);
                    }
                    RDP(pts, k + 1, j, eps, newPts);
                } else if (result[0] > eps) {
                    RDP(pts, i, k, eps, newPts);
                    RDP(pts, k, j, eps, newPts);
                } else {
                    newPts.push(pts[j]);
                }
            };

        len = pts.length;

        i = 0;
        while (endless) {
            // Search for the next point without NaN coordinates
            while (i < len && isNaN(pts[i].scrCoords[1] + pts[i].scrCoords[2])) {
                i += 1;
            }
            // Search for the next position of a NaN point
            k = i + 1;
            while (k < len && !isNaN(pts[k].scrCoords[1] + pts[k].scrCoords[2])) {
                k += 1;
            }
            k--;

            // Only proceed if something is left
            if (i < len && k > i) {
                newPts = [];
                newPts[0] = pts[i];
                RDP(pts, i, k, eps, newPts);
                allPts = allPts.concat(newPts);
            }
            if (i >= len) {
                break;
            }
            // Push the NaN point
            if (k < len - 1) {
                allPts.push(pts[k + 1]);
            }
            i = k + 1;
        }

        return allPts;
    },

    /**
     * Old name for the implementation of the Ramer-Douglas-Peucker algorithm.
     * @deprecated Use {@link JXG.Math.Numerics.RamerDouglasPeucker}
     * @memberof JXG.Math.Numerics
     */
    RamerDouglasPeuker: function (pts, eps) {
        JXG.deprecated("Numerics.RamerDouglasPeuker()", "Numerics.RamerDouglasPeucker()");
        return this.RamerDouglasPeucker(pts, eps);
    },

    /**
     * Implements the Visvalingam-Whyatt algorithm.
     * See M. Visvalingam, J. D. Whyatt:
     * "Line generalisation by repeated elimination of the smallest area", C.I.S.R.G Discussion paper 10, July 1992
     *
     * The algorithm discards points which are not necessary from the polygonal line defined by the point array
     * pts (consisting of type JXG.Coords).
     * @param {Array} pts Array of {@link JXG.Coords}
     * @param {Number} numPoints Number of remaining intermediate points. The first and the last point of the original points will
     *    be taken in any case.
     * @returns {Array} An array containing points which approximates the curve defined by pts.
     * @memberof JXG.Math.Numerics
     *
     * @example
     *     var i, p = [];
     *     for (i = 0; i < 5; ++i) {
     *         p.push(board.create('point', [Math.random() * 12 - 6, Math.random() * 12 - 6]));
     *     }
     *
     *     // Plot a cardinal spline curve
     *     var splineArr = JXG.Math.Numerics.CardinalSpline(p, 0.5);
     *     var cu1 = board.create('curve', splineArr, {strokeColor: 'green'});
     *
     *     var c = board.create('curve', [[0],[0]], {strokeWidth: 2, strokeColor: 'black'});
     *     c.updateDataArray = function() {
     *         var i, len, points;
     *
     *         // Reduce number of intermediate points with Visvakingam-Whyatt to 6
     *         points = JXG.Math.Numerics.Visvalingam(cu1.points, 6);
     *         // Plot the remaining points
     *         len = points.length;
     *         this.dataX = [];
     *         this.dataY = [];
     *         for (i = 0; i < len; i++) {
     *             this.dataX.push(points[i].usrCoords[1]);
     *             this.dataY.push(points[i].usrCoords[2]);
     *         }
     *     };
     *     board.update();
     *
     * </pre><div id="JXGce0cc55c-b592-11e6-8270-104a7d3be7eb" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGce0cc55c-b592-11e6-8270-104a7d3be7eb',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *
     *         var i, p = [];
     *         for (i = 0; i < 5; ++i) {
     *             p.push(board.create('point', [Math.random() * 12 - 6, Math.random() * 12 - 6]));
     *         }
     *
     *         // Plot a cardinal spline curve
     *         var splineArr = JXG.Math.Numerics.CardinalSpline(p, 0.5);
     *         var cu1 = board.create('curve', splineArr, {strokeColor: 'green'});
     *
     *         var c = board.create('curve', [[0],[0]], {strokeWidth: 2, strokeColor: 'black'});
     *         c.updateDataArray = function() {
     *             var i, len, points;
     *
     *             // Reduce number of intermediate points with Visvakingam-Whyatt to 6
     *             points = JXG.Math.Numerics.Visvalingam(cu1.points, 6);
     *             // Plot the remaining points
     *             len = points.length;
     *             this.dataX = [];
     *             this.dataY = [];
     *             for (i = 0; i < len; i++) {
     *                 this.dataX.push(points[i].usrCoords[1]);
     *                 this.dataY.push(points[i].usrCoords[2]);
     *             }
     *         };
     *         board.update();
     *
     *     })();
     *
     * </script><pre>
     *
     */
    Visvalingam: function (pts, numPoints) {
        var i,
            len,
            vol,
            lastVol,
            linkedList = [],
            heap = [],
            points = [],
            lft,
            rt,
            lft2,
            rt2,
            obj;

        len = pts.length;

        // At least one intermediate point is needed
        if (len <= 2) {
            return pts;
        }

        // Fill the linked list
        // Add first point to the linked list
        linkedList[0] = {
            used: true,
            lft: null,
            node: null
        };

        // Add all intermediate points to the linked list,
        // whose triangle area is nonzero.
        lft = 0;
        for (i = 1; i < len - 1; i++) {
            vol = Math.abs(
                JXG.Math.Numerics.det([
                    pts[i - 1].usrCoords,
                    pts[i].usrCoords,
                    pts[i + 1].usrCoords
                ])
            );
            if (!isNaN(vol)) {
                obj = {
                    v: vol,
                    idx: i
                };
                heap.push(obj);
                linkedList[i] = {
                    used: true,
                    lft: lft,
                    node: obj
                };
                linkedList[lft].rt = i;
                lft = i;
            }
        }

        // Add last point to the linked list
        linkedList[len - 1] = {
            used: true,
            rt: null,
            lft: lft,
            node: null
        };
        linkedList[lft].rt = len - 1;

        // Remove points until only numPoints intermediate points remain
        lastVol = -Infinity;
        while (heap.length > numPoints) {
            // Sort the heap with the updated volume values
            heap.sort(function (a, b) {
                // descending sort
                return b.v - a.v;
            });

            // Remove the point with the smallest triangle
            i = heap.pop().idx;
            linkedList[i].used = false;
            lastVol = linkedList[i].node.v;

            // Update the pointers of the linked list
            lft = linkedList[i].lft;
            rt = linkedList[i].rt;
            linkedList[lft].rt = rt;
            linkedList[rt].lft = lft;

            // Update the values for the volumes in the linked list
            lft2 = linkedList[lft].lft;
            if (lft2 !== null) {
                vol = Math.abs(
                    JXG.Math.Numerics.det([
                        pts[lft2].usrCoords,
                        pts[lft].usrCoords,
                        pts[rt].usrCoords
                    ])
                );

                linkedList[lft].node.v = vol >= lastVol ? vol : lastVol;
            }
            rt2 = linkedList[rt].rt;
            if (rt2 !== null) {
                vol = Math.abs(
                    JXG.Math.Numerics.det([
                        pts[lft].usrCoords,
                        pts[rt].usrCoords,
                        pts[rt2].usrCoords
                    ])
                );

                linkedList[rt].node.v = vol >= lastVol ? vol : lastVol;
            }
        }

        // Return an array with the remaining points
        i = 0;
        points = [pts[i]];
        do {
            i = linkedList[i].rt;
            points.push(pts[i]);
        } while (linkedList[i].rt !== null);

        return points;
    }
};

export default Mat.Numerics;
