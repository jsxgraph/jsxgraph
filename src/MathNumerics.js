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
 * @fileoverview In this file the namespace Math.Numerics is defined, which holds numerical
 * algorithms for solving linear equations etc.
 * @author graphjs
 */


/**
 * The JXG.Math.Numerics namespace holds numerical algorithms, constants, and variables.
 * @namespace
 */
JXG.Math.Numerics = (function(JXG, Math) {

    // Predefined butcher tableaus for the common Runge-Kutta method (fourth order), Heun method (second order), and Euler method (first order).
    var predefinedButcher = {
        rk4: {
            s: 4,
            A: [
                [ 0,  0,  0, 0],
                [0.5, 0,  0, 0],
                [ 0, 0.5, 0, 0],
                [ 0,  0,  1, 0]
            ],
            b: [1. / 6., 1. / 3., 1. / 3., 1. / 6.],
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
            A: [
                [0]
            ],
            b: [1],
            c: [0]
        }
    };


    /** @lends JXG.Math.Numerics */
    return {

        /**
         * Solves a system of linear equations given by A and b using the Gauss-Jordan-elimination.
         * The algorithm runs in-place. I.e. the entries of A and b are changed.
         * @param {Array} A Square matrix represented by an array of rows, containing the coefficients of the lineare equation system.
         * @param {Array} b A vector containing the linear equation system's right hand side.
         * @throws {Error} If a non-square-matrix is given or if b has not the right length or A's rank is not full.
         * @returns {Array} A vector that solves the linear equation system.
         */
        Gauss: function(A, b) {
            var eps = JXG.Math.eps,
                // number of columns of A
                n = A.length > 0 ? A[0].length : 0,
                // copy the matrix to prevent changes in the original
                Acopy,
                // solution vector, to prevent changing b
                x,
                i, j, k,
                // little helper to swap array elements
                swap = function(i, j) {
                    var temp = this[i];

                    this[i] = this[j];
                    this[j] = temp;
                };

            if ((n !== b.length) || (n !== A.length))
                throw new Error("JXG.Math.Numerics.Gauss: Dimensions don't match. A must be a square matrix and b must be of the same length as A.");

            // initialize solution vector
            Acopy = new Array(n);
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
                            swap.apply(Acopy, [i, j]);
                            swap.apply(x, [i, j]);
                        } else {
                            // Saves the L matrix of the LR-decomposition. unnecessary.
                            Acopy[i][j] /= Acopy[j][j];
                            // Transform right-hand-side b
                            x[i] -= Acopy[i][j] * x[j];
                            // subtract the multiple of A[i][j] / A[j][j] of the j-th row from the i-th.
                            for (k = j + 1; k < n; k ++) {
                                Acopy[i][k] -= Acopy[i][j] * Acopy[j][k];
                            }
                        }
                    }
                }
                if (Math.abs(Acopy[j][j]) < eps) { // The absolute values of all coefficients below the j-th row in the j-th column are smaller than JXG.Math.eps.
                    throw new Error("JXG.Math.Numerics.Gauss(): The given matrix seems to be singular.");
                }
            }
            this.backwardSolve(Acopy, x, true); // return Array

            return x;
        },

        /**
         * Solves a system of linear equations given by the right triangular matrix R and vector b.
         * @param {Array} R Right triangular matrix represented by an array of rows. All entries a_(i,j) with i &lt; j are ignored.
         * @param {Array} b Right hand side of the linear equation system.
         * @param {Boolean} [canModify=false] If true, the right hand side vector is allowed to be changed by this method.
         * @returns {Array} An array representing a vector that solves the system of linear equations.
         */
        backwardSolve: function(R, b, canModify) {
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
         * @private
         * Gauss-Bareiss algorithm to compute the 
         * determinant of matrix without fractions.
         * See H. Cohen, "A course in computational
         * algebraic number thoery".
         */
        gaussBareiss: function(mat) {
            var k, c, s, i, j, p, n, M, t, 
                eps = JXG.Math.eps;
            
            n = mat.length;
            if (n<=0) { return 0; }
            if (mat[0].length<n) { n = mat[0].length; }
            
            // Copy the input matrix to M
            M = new Array(n);
            for (i = 0; i < n; i++) {
                M[i] = mat[i].slice(0, n);
            }
            
            c = 1;
            s = 1;
            for (k=0;k<n-1;k++) {
                p = M[k][k];
                if (Math.abs(p)<eps) {    // Pivot step
                    for (i=0;i<n;i++) {
                        if (Math.abs(M[i][k])>=eps) break
                    }
                    if (i==n) {      // No nonzero entry found in column k -> det(M) = 0
                        return 0.0;
                    } 
                    for (j=k;j<n;j++) {   // swap row i and k partially
                        t = M[i][j]; M[i][j] = M[k][j];  M[k][j] = t;
                    }
                    s = -s;
                    p = M[k][k];
                }
                
                // Main step
                for (i=k+1;i<n;i++) {
                    for (j=k+1;j<n;j++) {
                        t = p*M[i][j] - M[i][k]*M[k][j];
                        M[i][j] = t/c;
                    }
                }
                c = p;
            }
            return s*M[n-1][n-1];
        
        },

        /** 
         * Computes the determinant of a square nxn matrix with the
         * Gauss-Bareiss algorithm.
         * @param {Array} mat Matrix. 
         * @returns {Number} The determinant pf the matrix mat. 
                             The empty matrix returns 0.
         */ 
        det: function(mat) {
            return this.gaussBareiss(mat);
        },
        
        /**
         * Compute the Eigenvalues and Eigenvectors of a symmetric 3x3 matrix with the Jacobi method
         * Adaption of a FORTRAN program by Ed Wilson, Dec. 25, 1990
         * @param {Array} Ain A symmetric 3x3 matrix.
         * @returns {Array} [A,V] the matrices A and V. The diagonal of A contains the Eigenvalues, V contains the Eigenvectors.
         */
        Jacobi: function(Ain) {
            var i,j,k,aa,si,co,tt,eps = JXG.Math.eps,
                sum = 0.0,
                ssum, amax,
                n = Ain.length,
                V = [
                    [0,0,0],
                    [0,0,0],
                    [0,0,0]
                ],
                A = [
                    [0,0,0],
                    [0,0,0],
                    [0,0,0]
                ], nloops=0;

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
            if (n == 1) {
                return [A,V];
            }
            if (sum <= 0.0) {
                return [A,V];
            }

            sum /= (n * n);

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
                nloops++;
            } while (Math.abs(ssum) / sum > eps && nloops<2000);
            return [A,V];
        },

        /**
         * Calculates the integral of function f over interval using Newton-Cotes-algorithm.
         * @param {Array} interval The integration interval, e.g. [0, 3].
         * @param {function} f A function which takes one argument of type number and returns a number.
         * @param {object} [config={number_of_nodes:28,integration_type:'milne'}] The algorithm setup. Accepted properties are number_of_nodes of type number and integration_type
         * with value being either 'trapez', 'simpson', or 'milne'.
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
         *                                   {number_of_nodes: 16, intergration_type: 'trapez'});
         */
        NewtonCotes: function(interval, f, config) {
            var integral_value = 0.0,
                number_of_nodes = config && typeof config.number_of_nodes === 'number' ? config.number_of_nodes : 28,
                available_types = {trapez: true, simpson: true, milne: true},
                integration_type = config && config.integration_type && available_types.hasOwnProperty(config.integration_type) && available_types[config.integration_type] ? config.integration_type : 'milne',
                step_size = (interval[1] - interval[0]) / number_of_nodes,
                evaluation_point, i, number_of_intervals;

            switch (integration_type) {
                case 'trapez':
                    integral_value = (f(interval[0]) + f(interval[1])) * 0.5;

                    evaluation_point = interval[0];
                    for (i = 0; i < number_of_nodes - 1; i++) {
                        evaluation_point += step_size;
                        integral_value += f(evaluation_point);
                    }
                    integral_value *= step_size;

                    break;
                case 'simpson':
                    if (number_of_nodes % 2 > 0) {
                        throw new Error("JSXGraph:  INT_SIMPSON requires config.number_of_nodes dividable by 2.");
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
                        throw new Error("JSXGraph: Error in INT_MILNE: config.number_of_nodes must be a multiple of 4");
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
                        integral_value += 32.0 * (f(evaluation_point) + f(evaluation_point + 2 * step_size));
                    }
                    evaluation_point = interval[0] - 2.0 * step_size;
                    for (i = 0; i < number_of_intervals; i++) {
                        evaluation_point += 4.0 * step_size;
                        integral_value += 12.0 * f(evaluation_point);
                    }
                    integral_value *= 2.0 * step_size / 45.0;
            }
            return integral_value;
        },

        /**
         * Integral of function f over interval.
         * @param {Array} interval The integration interval, e.g. [0, 3].
         * @param {function} f A function which takes one argument of type number and returns a number.
         * @returns {Number} The value of the integral of f over interval
         * @see JXG.Math.Numerics.NewtonCotes
         */
        I: function(interval, f) {
            return this.NewtonCotes(interval, f, {number_of_nodes: 16, integration_type: 'milne'});
        },

        /**
         * Newton's method to find roots of a funtion in one variable.
         * @param {function} f We search for a solution of f(x)=0.
         * @param {Number} x initial guess for the root, i.e. start value.
         * @param {object} object optional object that is treated as "this" in the function body. This is useful, if the function is a
         *                 method of an object and contains a reference to its parent object via "this".
         * @returns {Number} A root of the function f.
         */
        Newton: function(f, x, object) {
            var i = 0,
                h = JXG.Math.eps,
                newf = f.apply(object, [x]), // set "this" to "object" in f
                nfev = 1, 
                df;
            if (JXG.isArray(x)) {  // For compatibility
                x = x[0];
            }
            while (i < 50 && Math.abs(newf) > h) {
                df = this.D(f, object)(x);  nfev += 2;
                if (Math.abs(df) > h) {
                    x -= newf / df;
                } else {
                    x += (Math.random() * 0.2 - 1.0);
                }
                newf = f.apply(object, [x]); nfev++;
                i++;
            }
            //JXG.debug("N nfev="+nfev);
            return x;
        },

        /**
         * Abstract method to find roots of univariate functions.
         * @param {function} f We search for a solution of f(x)=0.
         * @param {Number} x initial guess for the root, i.e. staring value.
         * @param {object} object optional object that is treated as "this" in the function body. This is useful, if the function is a
         *                 method of an object and contains a reference to its parent object via "this".
         * @returns {Number} A root of the function f.
         */
        root: function(f, x, object) {
            //return this.Newton(f, x, object);
            return this.fzero(f, x, object);
        },

        /**
         * Returns the Lagrange polynomials for curves with equidistant nodes, see
         * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
         * SIAM Review, Vol 46, No 3, (2004) 501-517.
         * The graph of the parametric curve [x(t),y(t)] runs through the given points.
         * @param {Array} p Array of JXG.Points
         * @returns {Array} An array consisting of two functions x(t), y(t) which define a parametric curve
         * f(t) = (x(t), y(t)) and two numbers x1 and x2 defining the curve's domain. x1 always equals zero.
         */
        Neville: function(p) {
            var w = [],
                makeFct = function(fun) {
                    return function(t, suspendedUpdate) {
                        var i, d, s,
                            bin = JXG.Math.binomial,
                            len = p.length,
                            len1 = len - 1,
                            num = 0.0,
                            denom = 0.0;

                        if (!suspendedUpdate) {
                            s = 1;
                            for (i = 0; i < len; i++) {
                                w[i] = bin(len1, i) * s;
                                s *= (-1);
                            }
                        }

                        d = t;
                        for (i = 0; i < len; i++) {
                            if (d === 0) {
                                return p[i][fun]();
                            } else {
                                s = w[i] / d;
                                d--;
                                num += p[i][fun]() * s;
                                denom += s;
                            }
                        }
                        return num / denom;
                    };
                },

                xfct = makeFct('X'),
                yfct = makeFct('Y');

            return [xfct, yfct, 0, function() {
                return p.length - 1;
            }];
        },

        /**
         * Calculates second derivatives at the given knots.
         * @param {Array} x x values of knots
         * @param {Array} y y values of knots
         * @returns {Array} Second derivatives of the interpolated function at the knots.
         * @see #splineEval
         */
        splineDef: function(x, y) {
            var n = Math.min(x.length, y.length),
                pair, i, l,
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
                pair = {X: x[i], Y: y[i]};
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
                delta.push(6 * (y[i + 2] - y[i + 1]) / (dx[i + 1]) - 6 * (y[i + 1] - y[i]) / (dx[i]));
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
                F[i] = (z[i] - (dx[i + 1] * F[i + 1])) / diag[i];
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
         * @param {Number,Array} x0 A single float value or an array of values to evaluate
         * @param {Array} x x values of knots
         * @param {Array} y y values of knots
         * @param {Array} F Second derivatives at knots, calculated by {@link #splineDef}
         * @see #splineDef
         * @returns {Number,Array} A single value or an array, depending on what is given as x0.
         */
        splineEval: function(x0, x, y, F) {
            var n = Math.min(x.length, y.length),
                l = 1,
                asArray = false,
                y0 = [],
                i, j, a, b, c, d, x_;

            // number of points to be evaluated
            if (JXG.isArray(x0)) {
                l = x0.length;
                asArray = true;
            } else
                x0 = [x0];

            for (i = 0; i < l; i++) {
                // is x0 in defining interval?
                if ((x0[i] < x[0]) || (x[i] > x[n - 1]))
                    return NaN;

                // determine part of spline in which x0 lies
                for (j = 1; j < n; j++) {
                    if (x0[i] <= x[j])
                        break;
                }
                j--;

                // we're now in the j-th partial interval, i.e. x[j] < x0[i] <= x[j+1];
                // determine the coefficients of the polynomial in this interval
                a = y[j];
                b = (y[j + 1] - y[j]) / (x[j + 1] - x[j]) - (x[j + 1] - x[j]) / 6 * (F[j + 1] + 2 * F[j]);
                c = F[j] / 2;
                d = (F[j + 1] - F[j]) / (6 * (x[j + 1] - x[j]));
                // evaluate x0[i]
                x_ = x0[i] - x[j];
                //y0.push(a + b*x_ + c*x_*x_ + d*x_*x_*x_);
                y0.push(a + (b + (c + d * x_) * x_) * x_);
            }

            if (asArray)
                return y0;
            else
                return y0[0];
        },

        /**
         * Generate a string containing the function term of a polynomial.
         * @param {Array} coeffs Coefficients of the polynomial. The position i belongs to x^i.
         * @param {Number} deg Degree of the polynomial
         * @param {String} varname Name of the variable (usually 'x')
         * @param {Number} prec Precision
         * @returns {String} A string containg the function term of the polynomial.
         */
        generatePolynomialTerm: function(coeffs, deg, varname, prec) {
            var t = [], i;
            for (i = deg; i >= 0; i--) {
                t = t.concat(['(', coeffs[i].toPrecision(prec), ')']);
                if (i > 1) {
                    t = t.concat(['*', varname, '<sup>', i, '<', '/sup> + ']);
                } else if (i === 1) {
                    t = t.concat(['*', varname, ' + ']);
                }
            }
            return t.join('');
        },

        /**
         * Computes the polynomial through a given set of coordinates in Lagrange form.
         * Returns the Lagrange polynomials, see
         * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
         * SIAM Review, Vol 46, No 3, (2004) 501-517.
         * @param {Array} p Array of JXG.Points
         * @returns {function} A function of one parameter which returns the value of the polynomial, whose graph runs through the given points.
         */
        lagrangePolynomial: function(p) {
            var w = [],
                fct = function(x, suspendedUpdate) {
                    var i, k, len, xi, s,
                        num = 0, denom = 0,
                        M, j;

                    len = p.length;
                    if (!suspendedUpdate) {
                        for (i = 0; i < len; i++) {
                            w[i] = 1.0;
                            xi = p[i].X();
                            for (k = 0; k < len; k++) if (k != i) {
                                w[i] *= (xi - p[k].X());
                            }
                            w[i] = 1 / w[i];
                        }

                        M = [];
                        for (j = 0; j < len; j++) {
                            M.push([1]);
                        }
                    }

                    for (i = 0; i < len; i++) {
                        xi = p[i].X();
                        if (x === xi) {
                            return p[i].Y();
                        } else {
                            s = w[i] / (x - xi);
                            denom += s;
                            num += s * p[i].Y();
                        }
                    }
                    return num / denom;
                };

            fct.getTerm = function() {
                return '';
            };

            return fct;
        },

        /**
         * Computes the regression polynomial of a given degree through a given set of coordinates.
         * Returns the regression polynomial function.
         * @param {Number} degree number, function or slider.
         * Either
         * @param {Array} dataX array containing the x-coordinates of the data set
         * @param {Array} dataY array containing the y-coordinates of the data set,
         * or
         * @param {Array} dataX Array consisting of JXG.Points.
         * @param {} dataY Ignored
         * @returns {function} A function of one parameter which returns the value of the regression polynomial of the given degree.
         * It possesses the method getTerm() which returns the string containing the function term of the polynomial.
         */
        regressionPolynomial: function(degree, dataX, dataY) {
            var coeffs,
                deg, dX, dY,
                inputType,
                fct,
                term = '';

            if (JXG.isPoint(degree) && typeof degree.Value == 'function') {  // Slider
                deg = function() {return degree.Value();};
            } else if (JXG.isFunction(degree)) {
                deg = degree;
            } else if (JXG.isNumber(degree)) {
                deg = function() {return degree;};
            } else {
                throw new Error("JSXGraph: Can't create regressionPolynomial from degree of type'" + (typeof degree) + "'.");
            }

            if (arguments.length == 3 && JXG.isArray(dataX) && JXG.isArray(dataY)) {              // Parameters degree, dataX, dataY
                inputType = 0;
            } else if (arguments.length == 2 && JXG.isArray(dataX) && dataX.length > 0 && JXG.isPoint(dataX[0])) {  // Parameters degree, point array
                inputType = 1;
            } else {
                throw new Error("JSXGraph: Can't create regressionPolynomial. Wrong parameters.");
            }

            fct = function(x, suspendedUpdate) {
                var i, j, M, MT, y, B, c, s,
                    d, len = dataX.length;                        // input data

                d = Math.floor(deg());                      // input data
                if (!suspendedUpdate) {
                    if (inputType === 1) {  // point list as input
                        dX = [];
                        dY = [];
                        for (i = 0; i < len; i++) {
                            dX[i] = dataX[i].X();
                            dY[i] = dataX[i].Y();
                        }
                    }

                    if (inputType === 0) {  // check for functions
                        dX = [];
                        dY = [];
                        for (i = 0; i < len; i++) {
                            if (JXG.isFunction(dataX[i]))
                                dX.push(dataX[i]());
                            else
                                dX.push(dataX[i]);
                            if (JXG.isFunction(dataY[i]))
                                dY.push(dataY[i]());
                            else
                                dY.push(dataY[i]);
                        }
                    }

                    M = [];
                    for (j = 0; j < len; j++) {
                        M.push([1]);
                    }
                    for (i = 1; i <= d; i++) {
                        for (j = 0; j < len; j++) {
                            M[j][i] = M[j][i - 1] * dX[j];      // input data
                        }
                    }

                    y = dY;                                 // input data
                    MT = JXG.Math.transpose(M);
                    B = JXG.Math.matMatMult(MT, M);
                    c = JXG.Math.matVecMult(MT, y);
                    coeffs = JXG.Math.Numerics.Gauss(B, c);
                    term = JXG.Math.Numerics.generatePolynomialTerm(coeffs, d, 'x', 3);
                }

                // Horner's scheme to evaluate polynomial
                s = coeffs[d];
                for (i = d - 1; i >= 0; i--) {
                    s = (s * x + coeffs[i]);
                }
                return s;
            };

            fct.getTerm = function() {
                return term;
            };

            return fct;
        },

        /**
         * Computes the cubic Bezier curve through a given set of points.
         * @param {Array} points Array consisting of 3*k+1 JXG.Points.
         * The points at position k with k mod 3 = 0 are the data points,
         * points at position k with k mod 3 = 1 or 2 are the control points.
         * @returns {Array} An array consisting of two functions of one parameter t which return the
         * x resp. y coordinates of the Bezier curve in t, one zero value, and a third function accepting
         * no parameters and returning one third of the length of the points. 
         */
        bezier: function(points) {
            var len,
                makeFct = function(which) {
                    return function(t, suspendedUpdate) {
                        var z = Math.floor(t) * 3,
                            t0 = t % 1,
                            t1 = 1 - t0;

                        if (!suspendedUpdate) {
                            len = Math.floor(points.length / 3);
                        }

                        if (t < 0) {
                            return points[0][which]();
                        }
                        if (t >= len) {
                            return points[points.length - 1][which]();
                        }
                        if (isNaN(t)) {
                            return NaN;
                        }
                        return t1 * t1 * (t1 * points[z][which]() + 3 * t0 * points[z + 1][which]()) + (3 * t1 * points[z + 2][which]() + t0 * points[z + 3][which]()) * t0 * t0;
                    };
                };

            return [
                makeFct('X'),
                makeFct('Y'),
                0,
                function() {
                    return Math.floor(points.length / 3);
                }];
        },

        /**
         * Computes the B-spline curve of order k (order = degree+1) through a given set of points.
         * @param {Array} points Array consisting of JXG.Points.
         * @param {Number} order Order of the B-spline curve.
         * @todo closed B-spline curves
         * @returns {Array} An Array consisting of four components: Two functions each of one parameter t
         * which return the x resp. y coordinates of the B-spline curve in t, a zero value, and a function simply
         * returning the length of the points array minus one.
         */
        bspline: function(points, order) {
            var knots, N = [],
                _knotVector = function(n, k) {
                    var j, kn = [];
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

                _evalBasisFuncs = function(t, kn, n, k, s) {
                    var i,j,a,b,den,
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
                            if (den == 0) {
                                N[j] = 0;
                            } else {
                                N[j] = (t - kn[j]) / den * a;
                            }
                            den = kn[j + i] - kn[j + 1];
                            if (den != 0) {
                                N[j] += (kn[j + i] - t) / den * b;
                            }
                        }
                    }
                    return N;
                },
                makeFct = function(which) {
                    return function(t, suspendedUpdate) {
                        var len = points.length,
                            y, j, s,
                            n = len - 1,
                            k = order;

                        if (n <= 0) return NaN;
                        if (n + 2 <= k) k = n + 1;
                        if (t <= 0) return points[0][which]();
                        if (t >= n - k + 2) return points[n][which]();

                        knots = _knotVector(n, k);
                        s = Math.floor(t) + k - 1;
                        N = _evalBasisFuncs(t, knots, n, k, s);

                        y = 0.0;
                        for (j = s - k + 1; j <= s; j++) {
                            if (j < len && j >= 0) y += points[j][which]() * N[j];
                        }
                        return y;
                    };
                };

            return [makeFct('X'),
                makeFct('Y'),
                0,
                function() {
                    return points.length - 1;
                }
            ];
        },

        /**
         * Numerical (symmetric) approximation of derivative. suspendUpdate is piped through, see {@link JXG.Curve#updateCurve}
         * and {@link JXG.Curve#hasPoint}.
         * @param {function} f Function in one variable to be differentiated.
         * @param {object} [obj] Optional object that is treated as "this" in the function body. This is useful, if the function is a
         * method of an object and contains a reference to its parent object via "this".
         * @returns {function} Derivative function of a given function f.
         */
        D: function(f, obj) {
            var h = 0.00001,
                h2 = 1.0 / (h * 2.0);

            if (arguments.length == 1 || (arguments.length > 1 && !JXG.exists(arguments[1]))) {
                return function(x, suspendUpdate) {
                    return (f(x + h, suspendUpdate) - f(x - h, suspendUpdate)) * h2;
                };
            } else { // set "this" to "obj" in f
                return function(x, suspendUpdate) {
                    return (f.apply(obj, [x + h,suspendUpdate]) - f.apply(obj, [x - h,suspendUpdate])) * h2;
                };
            }
        },

        /**
         * Helper function to create curve which displays Riemann sums.
         * Compute coordinates for the rectangles showing the Riemann sum.
         * @param {function} f Function, whose integral is approximated by the Riemann sum.
         * @param {Number} n number of rectangles.
         * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'.
         * @param {Number} start Left border of the approximation interval
         * @param {Number} end Right border of the approximation interval
         * @returns {Array} An array of two arrays containing the x and y coordinates for the rectangles showing the Riemann sum. This
         * array may be used as parent array of a {@link JXG.Curve}.
         */
        riemann: function(f, n, type, start, end) {
            var xarr = [],
                yarr = [],
                i, j = 0,
                delta,
                x = start, y,
                x1, y1, delta1;

            n = Math.floor(n);
            xarr[j] = x;
            yarr[j] = 0.0;

            if (n > 0) {
                delta = (end - start) / n;
                delta1 = delta * 0.01; // for 'lower' and 'upper'

                for (i = 0; i < n; i++) {
                    if (type === 'right') {
                        y = f(x + delta);
                    } else if (type === 'middle') {
                        y = f(x + delta * 0.5);
                    } else if ((type === 'left') || (type === 'trapezodial')) {
                        y = f(x);
                    } else if (type === 'lower') {
                        y = f(x);
                        for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                            y1 = f(x1);
                            if (y1 < y) {
                                y = y1;
                            }
                        }
                    } else { // (type=='upper')
                        y = f(x);
                        for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                            y1 = f(x1);
                            if (y1 > y) {
                                y = y1;
                            }
                        }
                    }

                    j++;
                    xarr[j] = x;
                    yarr[j] = y;
                    j++;
                    x += delta;
                    if (type === 'trapezodial') {
                        y = f(x);
                    }
                    xarr[j] = x;
                    yarr[j] = y;
                    j++;
                    xarr[j] = x;
                    yarr[j] = 0.0;
                }
            }
            return [xarr,yarr];
        },

        /**
         * Approximate the integral by Riemann sums.
         * Compute the area described by the riemann sum rectangles.
         * @param {function} f Function, whose integral is approximated by the Riemann sum.
         * @param {Number} n number of rectangles.
         * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'.
         * @param {Number} start Left border of the approximation interval
         * @param {Number} end Right border of the approximation interval
         * @returns {Number} The sum of the areas of the rectangles.
         */
        riemannsum: function(f, n, type, start, end) {
            var sum = .0,
                i, delta,
                x = start, y,
                x1, y1, delta1;

            n = Math.floor(n);
            if (n > 0) {
                delta = (end - start) / n;
                delta1 = delta * 0.01; // for 'lower' and 'upper'
                for (i = 0; i < n; i++) {
                    if (type === 'right') {
                        y = f(x + delta);
                    } else if (type === 'middle') {
                        y = f(x + delta * 0.5);
                    } else if (type === 'trapezodial') {
                        y = 0.5 * (f(x + delta) + f(x));
                    } else if (type === 'left') {
                        y = f(x);
                    } else if (type === 'lower') {
                        y = f(x);
                        for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                            y1 = f(x1);
                            if (y1 < y) {
                                y = y1;
                            }
                        }
                    } else { // (type=='upper')
                        y = f(x);
                        for (x1 = x + delta1; x1 <= x + delta; x1 += delta1) {
                            y1 = f(x1);
                            if (y1 > y) {
                                y = y1;
                            }
                        }
                    }
                    sum += delta * y;
                    x += delta;
                }
            }
            return sum;
        },

        /**
         * Solve initial value problems numerically using Runge-Kutta-methods.
         * See {@link http://en.wikipedia.org/wiki/Runge-Kutta_methods} for more information on the algorithm.
         * @param {object,String} butcher Butcher tableau describing the Runge-Kutta method to use. This can be either a string describing
         * a Runge-Kutta method with a Butcher tableau predefined in JSXGraph like 'euler', 'heun', 'rk4' or an object providing the structure
         * <pre>
         * {
         *     s: &lt;Number&gt;,
         *     A: &lt;matrix&gt;,
         *     b: &lt;Array&gt;,
         *     c: &lt;Array&gt;
         * }
         * </pre>
         * which corresponds to the Butcher tableau structure shown here: http://en.wikipedia.org/w/index.php?title=List_of_Runge%E2%80%93Kutta_methods&oldid=357796696
         * @param {Array} x0 Initial value vector. If the problem is of one-dimensional, the initial value also has to be given in an array.
         * @param {Array} I Interval on which to integrate.
         * @param {Number} N Number of evaluation points.
         * @param {function} f Function describing the right hand side of the first order ordinary differential equation, i.e. if the ode
         * is given by the equation <pre>dx/dt = f(t, x(t)).</pre> So f has to take two parameters, a number <tt>t</tt> and a
         * vector <tt>x</tt>, and has to return a vector of the same dimension as <tt>x</tt> has.
         * @returns {Array} An array of vectors describing the solution of the ode on the given interval I.
         * @example
         * // A very simple autonomous system dx(t)/dt = x(t);
         * function f(t, x) {
         *     return x;
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
         * for(var i=0; i&lt;data.length; i++) {
         *     dataX[i] = i*h;
         *     dataY[i] = data[i][0];
         * }
         * var g = board.create('curve', [dataX, dataY], {strokeWidth:'2px'});
         * </pre><div id="d2432d04-4ef7-4159-a90b-a2eb8d38c4f6" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * var board = JXG.JSXGraph.initBoard('d2432d04-4ef7-4159-a90b-a2eb8d38c4f6', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
         * function f(t, x) {
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
         */
        rungeKutta: function(butcher, x0, I, N, f) {
            var x = [],
                y = [],
                h = (I[1] - I[0]) / N,
                t = I[0],
                e, i, j,
                k, l,
                dim = x0.length,
                s,
                result = [],
                r = 0;

            if (JXG.isString(butcher)) {
                butcher = predefinedButcher[butcher] || predefinedButcher.euler;
            }
            s = butcher.s;

            // don't change x0, so copy it
            for (e = 0; e < dim; e++)
                x[e] = x0[e];

            for (i = 0; i < N; i++) {
                // Optimization doesn't work for ODEs plotted using time
                //        if((i % quotient == 0) || (i == N-1)) {
                result[r] = [];
                for (e = 0; e < dim; e++)
                    result[r][e] = x[e];
                r++;
                //        }
                // init k
                k = [];
                for (j = 0; j < s; j++) {
                    // init y = 0
                    for (e = 0; e < dim; e++)
                        y[e] = 0.;

                    // Calculate linear combination of former k's and save it in y
                    for (l = 0; l < j; l++) {
                        for (e = 0; e < dim; e++) {
                            y[e] += (butcher.A[j][l]) * h * k[l][e];
                        }
                    }

                    // add x(t) to y
                    for (e = 0; e < dim; e++) {
                        y[e] += x[e];
                    }

                    // calculate new k and add it to the k matrix
                    k.push(f(t + butcher.c[j] * h, y));
                }

                // init y = 0
                for (e = 0; e < dim; e++)
                    y[e] = 0.;

                for (l = 0; l < s; l++) {
                    for (e = 0; e < dim; e++)
                        y[e] += butcher.b[l] * k[l][e];
                }

                for (e = 0; e < dim; e++) {
                    x[e] = x[e] + h * y[e];
                }

                t += h;
            }

            return result;
        },


        /**
         *
         * Find zero of an univariate function f.
         * @param {function} f Function, whose root is to be found
         * @param {array or number} x0  Start value or start interval enclosing the root
         * @param {object} object Parent object in case f is method of it
         * @return {number} the approximation of the root
         * Algorithm:
         *  G.Forsythe, M.Malcolm, C.Moler, Computer methods for mathematical
         *  computations. M., Mir, 1980, p.180 of the Russian edition
         * 
         * if x0 is an array containing lower and upper bound for the zero
         * algorithm 748 is applied. Otherwise, if x0 is a number,
         * the algorithm tries to bracket a zero of f starting from x0.
         * If this fails, we fall back to Newton's method.
         *
         **/
        fzero: function(f, x0, object) {
            var tol = JXG.Math.eps,
                maxiter = 50, niter = 0,
                nfev = 0,
                eps = tol,
                a,b,c, 
                fa, fb, fc,
                aa, blist, i, len, u, fu, 
                prev_step,
                tol_act,         // Actual tolerance
                p,               // Interpolation step is calcu-
                q,               // lated in the form p/q; divi- 
                                 // sion operations is delayed  
                                 // until the last moment   
                new_step,        // Step at this iteration
                t1, cb, t2;

            if (JXG.isArray(x0)) {
                if (x0.length<2) 
                    throw new Error("JXG.Math.Numerics.fzero: length of array x0 has to be at least two.");
                a = x0[0]; fa = f.apply(object,[a]); nfev++;
                b = x0[1]; fb = f.apply(object,[b]); nfev++;
            } else {
                a = x0; fa = f.apply(object,[a]); nfev++;
                // Try to get b.
                if (a == 0) {
                    aa = 1;
                } else {
                    aa = a;
                }
                blist = [0.9*aa, 1.1*aa, aa-1, aa+1, 0.5*aa, 1.5*aa, -aa, 2*aa, -10*aa, 10*aa];
                len = blist.length;
                for (i=0;i<len;i++) {
                    b = blist[i];
                    fb = f.apply(object,[b]); nfev++;
                    if (fa*fb<=0) {
                        break;
                    }
                }
                if (b < a) {
                    u = a; a = b; b = u;
                    fu = fa; fa = fb; fb = fu;
                }
            }

            if (fa*fb > 0) {
                // Bracketing not successful, fall back to Newton's method or to fminbr
                if (JXG.isArray(x0)) {
                    //JXG.debug("fzero falls back to fminbr");
                    return this.fminbr(f, [a,b], object);
                } else {
                    //JXG.debug("fzero falls back to Newton");
                    return this.Newton(f, a, object);
                }
            }

            // OK, we have enclosed a zero of f.
            // Now we can start Brent's method

            c = a;   
            fc = fa;
            while (niter<maxiter) {   // Main iteration loop
                prev_step = b-a;      // Distance from the last but one
                                      // to the last approximation 

                if ( Math.abs(fc) < Math.abs(fb) ) {
                                                // Swap data for b to be the  
                    a = b;  b = c;  c = a;      // best approximation   
                    fa=fb;  fb=fc;  fc=fa;
                }
                tol_act = 2*eps*Math.abs(b) + tol*0.5;
                new_step = (c-b)*0.5;

                if ( Math.abs(new_step) <= tol_act || Math.abs(fb) <= eps ) {
                    //JXG.debug("nfev="+nfev);
                    return b;                           //  Acceptable approx. is found 
                }
                    
                // Decide if the interpolation can be tried 
                if ( Math.abs(prev_step) >= tol_act     // If prev_step was large enough
                    && Math.abs(fa) > Math.abs(fb) ) {  // and was in true direction,  
                                                        // Interpolatiom may be tried  
                    cb = c-b;
                    if ( a==c ) {                       // If we have only two distinct 
                                                        // points linear interpolation 
                        t1 = fb/fa;                     // can only be applied    
                        p = cb*t1;
                        q = 1.0 - t1;
                    } else {                            // Quadric inverse interpolation
                        q = fa/fc;  t1 = fb/fc;  t2 = fb/fa;
                        p = t2 * ( cb*q*(q-t1) - (b-a)*(t1-1.0) );
                        q = (q-1.0) * (t1-1.0) * (t2-1.0);
                    }
                    if ( p>0 ) {                        // p was calculated with the op-
                        q = -q;                         // posite sign; make p positive 
                    } else {                            // and assign possible minus to
                        p = -p;                         // q 
                    }
                    
                    if( p < (0.75*cb*q-Math.abs(tol_act*q)*0.5)     // If b+p/q falls in [b,c]
                        && p < Math.abs(prev_step*q*0.5) ) {        // and isn't too large 
                        new_step = p/q;                 // it is accepted   
                    }                                   // If p/q is too large then the 
                                                        // bissection procedure can
                                                        // reduce [b,c] range to more
                                                        // extent
                }

                if ( Math.abs(new_step) < tol_act ) {   // Adjust the step to be not less
                    if ( new_step > 0 ) {               // than tolerance
                        new_step = tol_act;
                    } else {
                        new_step = -tol_act;
                    }
                }

                a = b;  fa = fb;                        // Save the previous approx.
                b += new_step;  
                fb = f.apply(object,[b]); nfev++;       // Do step to a new approxim.
                if ( (fb>0 && fc>0) || (fb<0 && fc<0) ) {
                                                        // Adjust c for it to have a sign
                    c = a;  fc = fa;                    // opposite to that of b 
                }
                niter++;
            }                                           // End while
            
            JXG.debug("fzero: maxiter="+maxiter+" reached.");
            return b;
        },

        /**
         *
         * Find minimum of an univariate function f.
         * @param {function} f Function, whose minimum is to be found
         * @param {array} x0  Start interval enclosing the minimum
         * @param {object} object Parent object in case f is method of it
         * @return {number} the approximation of the minimum
         * Algorithm:
         *  G.Forsythe, M.Malcolm, C.Moler, Computer methods for mathematical
         *  computations. M., Mir, 1980, p.180 of the Russian edition
         * x0 
         **/

        fminbr: function(f, x0, object) {              // An estimate to the min location
            var a, b, x, v, w,
                fx, fv, fw,
                r = (3.-Math.sqrt(5.0))*0.5,            // Golden section ratio   
                tol = JXG.Math.eps,
                sqrteps = Math.sqrt(JXG.Math.eps),
                maxiter = 50, niter = 0,
                range, middle_range, tol_act, new_step,
                p, q, t, ft,
                nfev = 0;

            if (!JXG.isArray(x0) || x0.length<2) {
                throw new Error("JXG.Math.Numerics.fminbr: length of array x0 has to be at least two.");
            }
            
            a = x0[0];
            b = x0[1];
            v = a + r*(b-a);  
            fv = f.apply(object,[v]); nfev++;           // First step - always gold section
            x = v;  w = v;
            fx=fv;  fw=fv;

            while (niter<maxiter) {
                range = b-a;                            // Range over which the minimum 
                                                        // is seeked for
                middle_range = (a+b)*0.5;
                tol_act = sqrteps*Math.abs(x) + tol/3;  // Actual tolerance  
                if( Math.abs(x-middle_range) + range*0.5 <= 2*tol_act ) {
                    //JXG.debug(nfev);
                    return x;                           // Acceptable approx. is found
                }
                                                        // Obtain the golden section step 
                new_step = r * ( x<middle_range ? b-x : a-x );
                                                        // Decide if the interpolation can be tried 
                if ( Math.abs(x-w) >= tol_act  ) {      // If x and w are distinct     
                                                        // interpolatiom may be tried 
                    // Interpolation step is calculated as p/q; 
                    // division operation is delayed until last moment 
                    t = (x-w) * (fx-fv);
                    q = (x-v) * (fx-fw);
                    p = (x-v)*q - (x-w)*t;
                    q = 2*(q-t);

                    if ( q>0 ) {                        // q was calculated with the op-
                        p = -p;                         // posite sign; make q positive 
                    } else {                            // and assign possible minus to
                        q = -q;                         // p
                    }
                    if ( Math.abs(p) < Math.abs(new_step*q) &&      // If x+p/q falls in [a,b]
                         p > q*(a-x+2*tol_act) &&                   //  not too close to a and
                         p < q*(b-x-2*tol_act)  ) {                 // b, and isn't too large */
                         new_step = p/q;                            // it is accepted        
                    }
                    // If p/q is too large then the 
                    // golden section procedure can   
                    // reduce [a,b] range to more   
                    // extent           
                }

                if ( Math.abs(new_step) < tol_act ) {    // Adjust the step to be not less
                    if( new_step > 0 ) {                 // than tolerance     
                        new_step = tol_act;
                    } else {
                        new_step = -tol_act;
                    }
                }
                
                // Obtain the next approximation to min 
                // and reduce the enveloping range
                t = x + new_step;                       // Tentative point for the min
                ft = f.apply(object,[t]); nfev++;
                if ( ft <= fx ) {                       // t is a better approximation 
                    if ( t < x ) {                      // Reduce the range so that
                        b = x;                          // t would fall within it 
                    } else {
                        a = x;
                    }
                    v = w;  w = x;  x = t;              // Assign the best approx to x 
                    fv=fw;  fw=fx;  fx=ft;
                } else {                                // x remains the better approx
                    if ( t < x ) {                      // Reduce the range enclosing x 
                        a = t;                   
                    } else {
                        b = t;
                    }
                    if ( ft <= fw || w==x ) {
                        v = w;  w = t;
                        fv=fw;  fw=ft;
                    } else if ( ft<=fv || v==x || v==w ) {
                        v = t;
                        fv=ft;
                    }
                }
                niter++;
            } 
            JXG.debug("fminbr: maxiter="+maxiter+" reached.");
            return x;
        },

        /**
         * Helper function to create curve which displays Reuleaux polygons.
         * @param {array} points Array of points which should be the vertices of the Reuleaux polygon. Typically,
         *                       these point list is the array vrtices of a regular polygon.
         * @param {number} nr Number of vertices
         * @returns {array} An array containing the two functions defining the Reuleaux polygon and the two values
         * for the start and the end of the paramtric curve.
         * array may be used as parent array of a {@link JXG.Curve}.
         *
         * @example
         * var A = brd.create('point',[-2,-2]);
         * var B = brd.create('point',[0,1]);
         * var pol = brd.create('regularpolygon',[A,B,3], {withLines:false, fillColor:'none', highlightFillColor:'none', fillOpacity:0.0}); 
         * var reuleauxTriangle = brd.create('curve', JXG.Math.Numerics.reuleauxPolygon(pol.vertices, 3), 
         *                          {strokeWidth:6, strokeColor:'#d66d55', fillColor:'#ad5544', highlightFillColor:'#ad5544'});
         *
         * </pre><div id="2543a843-46a9-4372-abc1-94d9ad2db7ac" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * var brd = JXG.JSXGraph.initBoard('2543a843-46a9-4372-abc1-94d9ad2db7ac', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright:false, shownavigation: false});
         * var A = brd.create('point',[-2,-2]);
         * var B = brd.create('point',[0,1]);
         * var pol = brd.create('regularpolygon',[A,B,3], {withLines:false, fillColor:'none', highlightFillColor:'none', fillOpacity:0.0}); 
         * var reuleauxTriangle = brd.create('curve', JXG.Math.Numerics.reuleauxPolygon(pol.vertices, 3), 
         *                          {strokeWidth:6, strokeColor:'#d66d55', fillColor:'#ad5544', highlightFillColor:'#ad5544'});
         * </script><pre>
         */
        reuleauxPolygon: function(points, nr) {
            var pi2 = Math.PI*2,
                pi2_n = pi2/nr,
                diag = (nr-1)/2,
                beta, d = 0,
                makeFct = function(which, trig) {
                    return function(t, suspendUpdate) {
                        if (!suspendUpdate) {
                            d = points[0].Dist(points[diag]);
                            beta = JXG.Math.Geometry.rad([points[0].X()+1,points[0].Y()],points[0],points[(diag)%nr]);
                        }
                        var t1 = (t%pi2 + pi2) % pi2;
                        var j = Math.floor(t1 / pi2_n)%nr;
                        if (isNaN(j)) return j;
                        //t1 = (t1-j*pi2_n)*0.5 + beta+j*pi2_n;
                        t1 = t1*0.5+j*pi2_n*0.5 + beta;
                        return points[j][which]()+d*Math[trig](t1);
                    };
                };
            return [
                makeFct('X','cos'),
                makeFct('Y','sin'),
                0,
                Math.PI*2
            ];
        },

        /**
         * Implements the Ramen-Douglas-Peuker algorithm.
         * It discards points which are not necessary from the polygonal line defined by the point array
         * pts. The computation is done in screen coordinates.
         * Average runtime is O(nlog(n)), worst case runtime is O(n^2), where n is the number of points.
         * @param {Array} pts Array of {@link JXG.Coords}
         * @param {Number} eps If the absolute value of a given number <tt>x</tt> is smaller than <tt>eps</tt> it is considered to be equal <tt>0</tt>.
         * @returns {Array} An array containing points which represent an apparently identical curve as the points of pts do, but contains fewer points.
         */
        RamenDouglasPeuker: function(pts, eps) {
            var newPts = [], i, k, len,
                /**
                 * RDP() is a private subroutine of {@link JXG.Math.Numerics#RamenDouglasPeuker}.
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
                 * @private
                 */
                RDP = function(pts, i, j, eps, newPts) {
                    var result = findSplit(pts, i, j);

                    if (result[0] > eps) {
                        RDP(pts, i, result[1], eps, newPts);
                        RDP(pts, result[1], j, eps, newPts);
                    } else {
                        newPts.push(pts[j]);
                    }
                },
                /**
                 * findSplit() is a subroutine of {@link JXG.Math.Numerics#RamenDouglasPeuker}.
                 * It searches for the point between index i and j which
                 * has the largest distance from the line between the points i and j.
                 * @param {Array} pts Array of {@link JXG.Coords}
                 * @param {Number} i Index of a point in pts
                 * @param {Number} j Index of a point in pts
                 **/
                findSplit = function(pts, i, j) {
                    var dist = 0,
                        f = i,
                        d, k, ci, cj, ck,
                        x0, y0, x1, y1,
                        den, lbda;

                    if (j - i < 2) return [-1.0,0];

                    ci = pts[i].scrCoords;
                    cj = pts[j].scrCoords;
                    if (isNaN(ci[1] + ci[2] + cj[1] + cj[2])) return [NaN,j];

                    for (k = i + 1; k < j; k++) {
                        ck = pts[k].scrCoords;
                        x0 = ck[1] - ci[1];
                        y0 = ck[2] - ci[2];
                        x1 = cj[1] - ci[1];
                        y1 = cj[2] - ci[2];
                        den = x1 * x1 + y1 * y1;
                        if (den >= JXG.Math.eps) {
                            lbda = (x0 * x1 + y0 * y1) / den;
                            d = x0 * x0 + y0 * y0 - lbda * (x0 * x1 + y0 * y1);
                        } else {
                            lbda = 0.0;
                            d = x0 * x0 + y0 * y0;
                        }
                        if (lbda < 0.0) {
                            d = x0 * x0 + y0 * y0;
                        } else if (lbda > 1.0) {
                            x0 = ck[1] - cj[1];
                            y0 = ck[2] - cj[2];
                            d = x0 * x0 + y0 * y0;
                        }
                        if (d > dist) {
                            dist = d;
                            f = k;
                        }
                    }
                    return [Math.sqrt(dist),f];
                };

            len = pts.length;

            // Search for the left most point woithout NaN coordinates
            i = 0;
            while (i < len && isNaN(pts[i].scrCoords[1] + pts[i].scrCoords[2])) {
                i++;
            }
            // Search for the right most point woithout NaN coordinates
            k = len - 1;
            while (k > i && isNaN(pts[k].scrCoords[1] + pts[k].scrCoords[2])) {
                k--;
            }

            // Only proceed if something is left
            if (!(i > k || i == len)) {
                newPts[0] = pts[i];
                RDP(pts, i, k, eps, newPts);
            }

            return newPts;
        }

    }
})(JXG, Math);

