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
 * Math.Numerics namespace holds numerical algorithms, constants, and variables.
 * @namespace
 */
JXG.Math.Numerics = {}; 

/**
 * A constant representing the trapez rule for numerical integration. Is used in conjunction with {@link JXG.Math.Numerics.integration_type}
 * and {@link JXG.Math.Numerics.NewtonCotes}.
 * @type number
 * @constant
 */
JXG.Math.Numerics.INT_TRAPEZ  = 0x00001;

/**
 * A constant representing the simpson rule for numerical integration. Is used in conjunction with {@link JXG.Math.Numerics.integration_type}
 * and {@link JXG.Math.Numerics.NewtonCotes}.
 * @type number
 * @constant
 */
JXG.Math.Numerics.INT_SIMPSON = 0x00002;

/**
 * A constant representing the milne rule for numerical integration. Is used in conjunction with {@link JXG.Math.Numerics.integration_type}
 * and {@link JXG.Math.Numerics.NewtonCotes}.
 * @type number
 * @constant
 */
JXG.Math.Numerics.INT_MILNE   = 0x00003;
  
/**
 * Number of nodes for evaluation, used for integration algorithms.
 * @type number
 */
JXG.Math.Numerics.number_of_nodes = 28;

/**
 * Type of integration algorithm, possible values are:
 * <ul>
 *   <li>{@link JXG.Math.Numerics.INT_TRAPEZ}</li>
 *   <li>{@link JXG.Math.Numerics.INT_SIMPSON}</li>
 *   <li>{@link JXG.Math.Numerics.INT_MILNE}</li>
 * </ul>
 * @type number
 */
JXG.Math.Numerics.integration_type = JXG.INT_MILNE;

/**
 * Solves a system of linear equations given by the right triangular matrix R and vector b.
 * @param R Right triangular matrix. All entries a_(i,j) with i < j are ignored.
 * @param b Right hand side of the linear equation system.
 * @return A vector that solves the system of linear equations.
 * @private
 */ 
JXG.Math.Numerics.backwardSolve = function(/** JXG.Math.Matrix */ R, /** JXG.Math.Vector */ b) /** JXG.Math.Vector */ {
    var x = b,
        m, n,
        i, j;

    // m: number of rows of R
    // n: number of columns of R
    // Relaxation: R may be of type JXG.Math.Matrix or Array
    //             b may be of type JXG.Math.Vector or Array
    if (R.m) { // R is of type JXG.Math.Matrix
        m = R.m();
        n = R.n();
    } else {   // R is of type array
        m = R.length;
        n = (R.length>0)?R[0].length:0;
    }
    for (i = m-1; i >= 0; i--) {
        for (j = n-1; j > i; j--) {
            x[i] -= R[i][j] * x[j];
        }
        x[i] /= R[i][i];
    }
   
    return x;
};

/**
 * Solves a system of linear equations given by A and b using the Gauss-Jordan-elimination.
 * The algorithm runs in-place. I.e. the entries of A and b are changed.
 * @param A Square matrix containing the coefficients of the lineare equation system.
 * @param b A vector containing the linear equation system's right hand side. 
 * @throws {JXG.DimensionMismatchException} If a non-square-matrix is given or the b has not the right length.
 * @throws {JXG.SingularMatrixException} If A's rank is not full.
 * @return A vector that solves the linear equation system.
 */
JXG.Math.Numerics.Gauss = function(/** JXG.Math.Matrix */ A, /** JXG.Math.Vector */ b) /** JXG.Math.Vector */ {
    var eps = JXG.Math.eps,
        n,                 
        i, j, k, P,
        x, y;
    
    // n: number of columns of A
    // Relaxation: A may be of type JXG.Math.Matrix or Array
    //             b may be of type JXG.Math.Vector or Array
    if (A.n) { // A is of type JXG.Math.Matrix
        n = A.n();
    } else {   // A is of type array
        n = (A.length>0)?A[0].length:0;
    }
    
    /* vector to keep track of permutations caused by pivotion */
    P = new JXG.Math.Vector();
    for (i = 0; i < n; i++) {
        P.push(i);
    }
    
   /* Gauss-Jordan-elimination */
    for (j=0; j < n; j++)
    {
        for (i = n-1; i > j; i--) {
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
                    for (k = j + 1; k < n; k ++) {
                        A[i][k] -= A[i][j] * A[j][k];
                    }
                }
            }
            if (Math.abs(A[j][j]) < JXG.Math.eps) { // The absolute values of all coefficients below the j-th row in the j-th column are smaller than JXG.Math.eps.
                throw new SingularMatrixException();
            }
        }
    }
   
    return JXG.Math.Numerics.backwardSolve(A, b); // return Array
    /* 
    y = JXG.Math.Numerics.backwardSolve(A, b);
    x = new JXG.Math.Vector();
    for (i = 0; i < n ; i++) { // y.n()
        x.push(y[P[i]]);
    }
   
    return x; // return JXG.Math.Vector
    */
};

/**
 * NEEDS IMPLEMENTATION. TODO Decomposites the matrix A in an orthogonal matrix Q and a right triangular matrix R. 
 * @param {JXG.Math.Matrix} A A matrix.
 * @type Object
 * @throws {Exception} If A's rank is not full.
 * @return The matrices Q and R.
 * @private
 */
JXG.Math.Numerics.QR = function(A, b) {
    // TODO needs implementation
};

/**
 * Calculates the integral of function f over interval using Newton-Cotes-algorithm.
 * @param interval The integration interval, e.g. [0, 3]. 
 * @param f A function which takes one argument of type number and returns a number.
 * @return Integral value of f over interval interval
 * @throws {Exception} If {@link JXG.Math.Numerics.number_of_nodes} doesn't match
 * {@link JXG.Math.Numerics.integration_type} an exception is thrown. If you want to use
 * simpson rule respectively milne rule {@link JXG.Math.Numerics.number_of_nodes} must be dividable by
 * 2 respectively 4.
 * @example
 * function f(x) {
 *   return x*x;
 * }
 * 
 * // calculates integral of <tt>f</tt> from 0 to 2.
 * var area1 = JXG.Math.Numerics.NewtonCotes([0, 2], f);
 * 
 * // the same with anonymous function
 * var area2 = JXG.Math.Numerics.NewtonCotes([0, 2], function (x) { return x*x; });
 */
JXG.Math.Numerics.NewtonCotes = function(/** array */ interval, /** function */ f) /** float */ {
    var integral_value = 0.0,
        step_size = (interval[1] - interval[0]) / this.number_of_nodes,
        evaluation_point, i, number_of_intervals;

    switch(this.integration_type) {
        case JXG.INT_TRAPEZ:
            integral_value = (f(interval[0]) + f(interval[1])) * 0.5;
    
            evaluation_point = interval[0];
            for (i = 0; i < this.number_of_nodes - 1; i++)
            {
                evaluation_point += step_size;
                integral_value   += f(evaluation_point);
            }
            integral_value *= step_size;

            break;
        case JXG.INT_SIMPSON:
            if (this.number_of_nodes%2 > 0) {
                throw new Error("JSXGraph:  INT_SIMPSON requires JXG.Math.Numerics.number_of_nodes dividable by 2.");
            }
            number_of_intervals = this.number_of_nodes / 2.0;
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
                throw new Error("JSXGraph: Error in INT_MILNE: JXG.Math.Numerics.number_of_nodes must be a multiple of 4");
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
            integral_value *= 2.0 * step_size / 45.0; /* todo */
    }
    return integral_value;
};

/**
 * Calculates second derivatives at the knots.
 * @param x x values of knots
 * @param y y values of knots
 * @return Second derivatives of interpolated function at the knots.
 */
JXG.Math.Numerics.splineDef = function(/** JXG.Math.Vector */ x, /** JXG.Math.Vector */ y) /** JXG.Math.Vector */ {
    var n = x.length,
        pair, i, diag, z, l,
        data = new Array(),
        dx = [], 
        delta = [],
        F;
        
    if (x.length != y.length)
        throw new Error("JSXGraph: Error in JXG.Math.Numerics.splineDef: Input vector dimensions do not match.");
    
    for (i=0; i<n; i++) {
        pair = {X: x[i], Y: y[i]};
        data.push(pair);
    }
    data.sort(function (a,b) { return a.X - b.X; });
    for (i=0; i<n; i++) {
        x[i] = data[i].X;
        y[i] = data[i].Y;
    }
    
    for (i=0; i<n-1; i++) {
        dx.push(x[i+1] - x[i]);
    }
    for (i=0; i<n-2; i++) {
        delta.push(6 * (y[i+2] - y[i+1])/(dx[i+1]) - 6 * (y[i+1] - y[i])/(dx[i]));
    }

    // ForwardSolve
    diag = new Array();
    z = new Array();
    diag.push(2*(dx[0] + dx[1]));
    z.push(delta[0]);

    for (i=0; i<n-3; i++) {
        l = dx[i+1]/diag[i];
        diag.push(2 * (dx[i+1] + dx[i+2]) - l*dx[i+1]);
        z.push(delta[i+1] - l*z[i]);
    }

    // BackwardSolve
    F = new Array();
    F[n-3] = z[n-3]/diag[n-3];
    for(i=n-4; i>=0; i--) {
        F[i] = (z[i] - (dx[i+1]*F[i+1]))/diag[i];
    }
    
    // Generate f''-Vector
    for(i=n-3; i>=0; i--)
        F[i+1] = F[i];
    
    // natural cubic spline
    F[0] = 0;
    F[n-1] = 0;
    return F;
    //return new JXG.Math.Vector(F);
};

/**
 * Evaluate points on spline.
 * @param {float,Array} x0 A single float value or an array of values to evaluate
 * @param {JXG.Math.Vector} x x values of knots
 * @param {JXG.Math.Vector} y y values of knots
 * @param {JXG.Math.Vector} F Second derivatives at knots, calculated by #splineDef
 * @see splineDef
 * @type float,Array
 * @return A single value
 */
JXG.Math.Numerics.splineEval = function(x0, x, y, F) {
    var n = x.length,
        l = 1,
        asArray = false,
        y0, i, j, a, b, c, d, x_;

    if (n != y.length)
        throw new Error("JSXGraph: Error in JXG.Math.Numerics.splineEval: Defining vector dimensions do not match.");
    
    // number of points to be evaluated
    if(JXG.isArray(x0)) {
        l = x0.length;
        asArray = true;
    } else
        x0 = [x0];
    
    y0 = new Array();
    
    for (i=0; i<l; i++) {
        // is x0 in defining interval?
        if( (x0[i] < x[0]) || (x[i] > x[n-1]))
            return 'NaN';
//            throw new Error("JSXGraph: Error in JXG.Math.Numerics.splineEval: Evaluation point outside spline interval.");
        
        // determine part of spline in which x0 lies
        j;
        for (j=1; j<n; j++) {
            if (x0[i] <= x[j])
                break;
        }
        j--;
        
        // we're now in the j-th partial interval, i.e. x[j] < x0[i] <= x[j+1];
        // determine the coefficients of the polynomial in this interval
        a = y[j];
        b = (y[j+1]-y[j])/(x[j+1]-x[j]) - (x[j+1]-x[j])/6 * (F[j+1]+2*F[j]);
        c = F[j]/2;
        d = (F[j+1]-F[j])/(6*(x[j+1]-x[j]));
        // evaluate x0[i]
        x_ = x0[i]-x[j];
        //y0.push(a + b*x_ + c*x_*x_ + d*x_*x_*x_);
        y0.push(a + (b + (c+ d*x_)*x_)*x_);
    }

    if (asArray)
        return y0;
    else
        return y0[0];
};

/**
  * Generate a string containing the function term of a polynomial.
  * @param {Array} coeffs Coefficients of the polynomial. The position i belongs to x^i.
  * @param {int} deg Degree of the polynomial
  * @param {String} varname Name of the variable (usually 'x')
  * @param {int} prec Precision
  * @return {String} String containg the function term of the polynomial.
  */
JXG.Math.Numerics.generatePolynomialTerm = function(coeffs,deg,varname,prec) {
    var t = '', i;
    for (i=deg;i>=0;i--) {
        t += '('+coeffs[i].toPrecision(prec)+')';
        if (i>1) { t+='*'+varname+'<sup>'+i+'</sup> + '; }
        else if (i==1) { t+='*'+varname+' + '; }
    }
    return t;
}
/**
 * Computes the polynomial through a given set of coordinates in Lagrange form.
 * Returns the Lagrange polynomials, see
 * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
 * SIAM Review, Vol 46, No 3, (2004) 501-517.
 * @param {array} p Array of JXG.Points
 * @type {function}
 * @return {function} A function of one parameter which returns the value of the polynomial,
 * whose graph runs through the given points.
 */
JXG.Math.Numerics.lagrangePolynomial = function(p) {  
    var w = [];
    var term = '';
    var fct = function(x,suspendedUpdate)  {
        var i, k, len, xi, s,
            num = 0, denom = 0;
        
        len = p.length;
        if (!suspendedUpdate) {
            for (i=0;i<len;i++) {
                w[i] = 1.0;
                xi = p[i].X();
                for (k=0;k<len;k++) if (k!=i) {
                    w[i] *= (xi-p[k].X());
                }
                w[i] = 1/w[i];
             }

            M = [];
            for (j=0;j<len;j++) {
                M.push([1]);
            }
                /* // Function term not yet
                for (i=1;i<len;i++) {
                    for (j=0;j<len;j++) {
                        M[j][i] = M[j][i-1]*datax[j];      // input data
                    }
                }
                y = curve.dataY;                           // input data
                MT = JXG.Math.Matrix.transpose(M);

                B = JXG.Math.matMatMult(MT,M);
                c = JXG.Math.matVecMult(MT,y);
                container = JXG.Math.Numerics.Gauss(B, c);
                
                for (i=degree, term='';i>=0;i--) {
                    term += '('+container[i].toPrecision(3)+')';
                    if (i>1) { term+='*x<sup>'+i+'</sup> + '; }
                    else if (i==1) { term+='*x + '; }
                }
                */
        }
        
        for (i=0;i<len;i++) {
            xi = p[i].X();
            if (x==xi) { 
                return p[i].Y(); 
            } else {
                s = w[i]/(x-xi)
                denom += s;
                num += s*p[i].Y();
            }
        }
        return num/denom;
    }
    fct.getTerm = function() {
        return term;
    };
    
    return fct;

/*
    return function(x) {
        var i,k,t,
            len = p.length,
            y = 0.0,
            xc = [];
        
        for (i=0;i<len;i++) {
            xc[i] = p[i].X();
        }
        for (i=0;i<len;i++) {
            t = p[i].Y();
            for (k=0;k<len;k++) if (k!=i) {
                t *= (x-xc[k])/(xc[i]-xc[k]);
            }
            y += t;
        }
        return y;
    };
*/    
};

/**
 * Returns the Lagrange polynomials for curves with equidistant nodes, see
 * Jean-Paul Berrut, Lloyd N. Trefethen: Barycentric Lagrange Interpolation,
 * SIAM Review, Vol 46, No 3, (2004) 501-517.
 * The graph of the parametric curve [f(t),g(t)] runs through the given points.
 * @param {Array} p Artray of JXG.Points
 * @type {Array function, function value, value]}
 * @return {array} [f(t),g(t),0,p.length-1],
 */
JXG.Math.Numerics.neville = function(p) {
    var w = [];
    
    var xfct = function(t, suspendedUpdate) {
        var i, d, L, s, 
            bin = JXG.Math.binomial,
            len = p.length,
            len1 = len - 1,
            num = 0.0, 
            denom = 0.0;
            
        if (!suspendedUpdate) {
            s = 1;
            for (i=0;i<len;i++) {
                w[i] = bin(len1,i)*s;
                s *= (-1);
            }
        }

        d = t;
        for (i=0;i<len;i++) {
            if (d==0) {
                return p[i].X();
            } else {
                s = w[i]/d;
                d--;
                num   += p[i].X()*s;
                denom += s;
            }
        }
        return num/denom;
    }
    var yfct = function(t, suspendedUpdate) {
        var i, d, L, s, 
            bin = JXG.Math.binomial,
            len = p.length,
            len1 = len - 1,
            num = 0.0, 
            denom = 0.0;
            
        if (!suspendedUpdate) {
            //L = JXG.Math.binomial(len-1,i)*((i%2==0)?1:(-1))/d;
            s = 1;
            for (i=0;i<len;i++) {
                w[i] = bin(len1,i)*s;
                s *= (-1);
            }
        }

        d = t;
        for (i=0;i<len;i++) {
            if (d==0) {
                return p[i].Y();
            } else {
                s = w[i]/d;
                d--;
                num   += p[i].Y()*s;
                denom += s;
            }
        }
        return num/denom;
    }
    return [xfct, yfct, 0, function(){ return p.length-1;}];
/*
    return [function(t) {
                var i, d, L, s, 
                    bin = JXG.Math.binomial,
                    len = p.length,
                    len1 = len - 1,
                    num = 0.0, 
                    denom = 0.0;
                d = t;
                s = 1;
                for (i=0;i<len;i++) {
                    if (d==0) {
                        return p[i].X();
                    } else {
                        //L = JXG.Math.binomial(len-1,i)*((i%2==0)?1:(-1))/d;
                        L = bin(len1,i)*s/d;
                        s *= (-1);
                        d -= 1;
                    }
                    num   += p[i].X()*L;
                    denom += L;
                }
                return num/denom;
            },
            function(t) {
                var i, d, L, s, 
                    bin = JXG.Math.binomial,
                    len = p.length,
                    len1 = len - 1,
                    num = 0.0, 
                    denom = 0.0;
                d = t;
                s = 1;
                for (i=0;i<len;i++) {
                    if (d==0) {
                        return p[i].Y();
                    } else {
                        //L = JXG.Math.binomial(len-1,i)*((i%2==0)?1:(-1))/d;
                        L = bin(len1,i)*s/d;
                        s *= (-1);
                        d -= 1;
                    }
                    num   += p[i].Y()*L;
                    denom += L;
                }
                return num/denom;
            },
            0, function(){ return p.length-1;}
        ];
*/        
};

/**
 * Computes the regression polynomial of a given degree through a given set of coordinates.
 * Returns the regression polynomial function.
 * @param degree number, function or slider.
 * Either
 * @param dataX array containing the x-coordinates of the data set
 * @param dataY array containing the y-coordinates of the data set, 
 * or
 * @param data array consisting of JXG.Points.
 * @type {function}
 * @return {function} A function of one parameter which returns the value of the regression polynomial of the given degree.
 * It possesses the method getTerm() which returns the string containing the function term of the polynomial.
 */
JXG.Math.Numerics.regressionPolynomial = function(degree, dataX, dataY) { 
    var coeffs = [],
        dbg_count = 0,
        deg, dX, dY,
        inputType,
        term = '';
    
    if (JXG.isPoint(degree) && typeof degree.Value == 'function') {  // Slider
        deg = function(){return degree.Value();};
    } else if (JXG.isFunction(degree)) {
        deg = degree;
    } else if (JXG.isNumber(degree)) {
        deg = function(){return degree;};
    } else {
        throw new Error("JSXGraph: Can't create regressionPolynomial from degree of type'" + (typeof degree) + "'.");
    }
    
    if (arguments.length==3 && JXG.isArray(dataX) && JXG.isArray(dataY)) {              // Parameters degree, dataX, dataY
//        dX = dataX;
//        dY = dataY;
// is done later
        inputType = 0;
    } else if ( arguments.length==2 && JXG.isArray(dataX) && JXG.isPoint(dataX[0]) ) {  // Parameters degree, point array
        inputType = 1;
    } else {
        throw new Error("JSXGraph: Can't create regressionPolynomial. Wrong parameters.");
    }
    
    var fct = function(x,suspendedUpdate){
            var i, j, M, MT, y, B, c, s,
                d,
                len = dataX.length;                        // input data
                
            d = Math.floor(deg());                      // input data
            if (!suspendedUpdate) {
                if (inputType==1) {  // point list as input 
                    dX = [];
                    dY = [];
                    for (i=0;i<len;i++) {
                        dX[i] = dataX[i].X();
                        dY[i] = dataX[i].Y();
                    }
                }
                
                if (inputType==0) {  // check for functions
                    dX = [];
                    dY = [];
                    for(i=0;i<len;i++) {
                        if(JXG.isFunction(dataX[i]))
                            dX.push(dataX[i]());
                        else
                            dX.push(dataX[i]);
                        if(JXG.isFunction(dataY[i]))
                            dY.push(dataY[i]());
                        else
                            dY.push(dataY[i]);
                    }
                }

                M = [];
                for (j=0;j<len;j++) {
                    M.push([1]);
                }
                for (i=1;i<=d;i++) {
                    for (j=0;j<len;j++) {
                        M[j][i] = M[j][i-1]*dX[j];      // input data
                    }
                }
                
                y = dY;                                 // input data
                MT = JXG.Math.Matrix.transpose(M);
                B = JXG.Math.matMatMult(MT,M);
                c = JXG.Math.matVecMult(MT,y);
                coeffs = JXG.Math.Numerics.Gauss(B, c);

                term = JXG.Math.Numerics.generatePolynomialTerm(coeffs,d,'x',3);         
            }
            
            // Horner's scheme to evaluate polynomial
            s = coeffs[d];
            for (i=d-1;i>=0;i--) {
                s = (s*x+coeffs[i]);
            }
            return s;
    };
    fct.getTerm = function() {
        return term;
    };
    return fct;
}
    
/**
 * Computes the cubic Bezier curve through a given set of points..
 * @param data array consisting of 3*k+1 JXG.Points.
 * The points at position k with k mod 3 = 0 are the data points,
 * points at position k with k mod 3 = 1 or 2 are the control points.
 * @type {function}
 * @return {function} A function of one parameter which returns the value of the cubic Bezier curve.
 */
JXG.Math.Numerics.bezier = function(points) {
    var len = 0; 

    return [function(t,suspendedUpdate) {
                var z = Math.floor(t)*3,
                    t0 = t % 1,
                    t1 = 1-t0;
                        
                if (!suspendedUpdate) {
                    len = Math.floor(points.length/3);
                }
                        
                if (t<0) { return points[0].X(); }
                if (t>=len) { return points[points.length-1].X(); }
                if (isNaN(t)) { return NaN; }
                return t1*t1*(t1*points[z].X()+3*t0*points[z+1].X())+(3*t1*points[z+2].X()+t0*points[z+3].X())*t0*t0;
            },
            function(t,suspendedUpdate) {
                var z = Math.floor(t)*3,
                    t0 = t % 1,
                    t1 = 1-t0;
                        
                if (!suspendedUpdate) {
                    len = Math.floor(points.length/3);
                }
                        
                if (t<0) { return points[0].Y(); }
                if (t>=len) { return points[points.length-1].Y(); }
                if (isNaN(t)) { return NaN; }
                return t1*t1*(t1*points[z].Y()+3*t0*points[z+1].Y())+(3*t1*points[z+2].Y()+t0*points[z+3].Y())*t0*t0;
            }, 
            0, function() {return Math.floor(points.length/3);}];
};

/**
 * Numerical (symmetric) approximation of derivative.
 * @param {function} f Function in one variable to be differentiated.
 * @param {object} obj Optional object that is treated as "this" in the function body. This is useful, if the function is a 
 *                 method of an object and contains a reference to its parent object via "this".
 * suspendUpdate is piped through, {@link JXG.Curve#updateCurve} and {@link JXG.Curve#hasPoint}.
 * @type {function}
 * @return {function} Derivative function of a given function f.
 */
JXG.Math.Numerics.D = function(/** function */ f, /** object */ obj) /* function */ {
    var h = 0.00001,
        h2 = 1.0/(h*2.0);
    
    if (arguments.length==1 || (arguments.length>1 && typeof arguments[1]=='undefined') ){ 
        return function(x,suspendUpdate){ return (f(x+h,suspendUpdate)-f(x-h,suspendUpdate))*h2; };
    } else {                   // set "this" to "obj" in f 
        return function(x,suspendUpdate){ return (f.apply(obj,[x+h,suspendUpdate])-f.apply(obj,[x-h,suspendUpdate]))*h2; };
    }
};

/**
 * Integral of function f over interval.
 * @deprecated Use {@link JXG.Math.Numerics.NewtonCotes} instead.
 * @see JXG.Math.Numerics.NewtonCotes
 */
JXG.Math.Numerics.I = function(/** array */ interval, /** function */ f) {
    return JXG.Math.Numerics.NewtonCotes(interval, f);
};

/**
 * Newton's method to find roots of a funtion in one variable.
 * @param {function} f We search for a solution of f(x)=0.
 * @param {float} x initial guess for the root, i.e. staring value.
 * @param {object} obj optional object that is treated as "this" in the function body. This is useful, if the function is a 
 *                 method of an object and contains a reference to its parent object via "this".
 * @return {float} root of the function f.
 */
JXG.Math.Numerics.newton = function(/** function */ f, /** number */ x, /** object */ obj) /** number */ {
    var i = 0,
        h = 0.000001,
        newf = f.apply(obj,[x]), // set "this" to "obj" in f 
        df;
        
    while (i<50 && Math.abs(newf)>h) {
        df = this.D(f,obj)(x);
        if (Math.abs(df)>h) {
            x -= newf/df;
        } else {
            x += (Math.random()*0.2-1.0);
        }
        newf = f.apply(obj,[x]);
        i++;
    }
    return x;
};

/**
 * Abstract method to find roots of univariate functions.
 * @param {function} f We search for a solution of f(x)=0.
 * @param {float} x initial guess for the root, i.e. staring value.
 * @param {object} obj optional object that is treated as "this" in the function body. This is useful, if the function is a 
 *                 method of an object and contains a reference to its parent object via "this".
 * @return {float} root of the function f.
 */
JXG.Math.Numerics.root = function(/** function */ f, /** number */ x, /** object */ obj) /** number */ {
    return this.newton(f,x,obj);
};

/**
 * Cosine hyperbolicus of x.
 * @param {float} x The number the cosine hyperbolicus will be calculated of.
 * @return {float} Cosine hyperbolicus of the given value.
 */
JXG.Math.Numerics.cosh = function(/** number */ x) /** number */ {
    return (Math.exp(x)+Math.exp(-x))*0.5;
};

/**
 * Sine hyperbolicus of x.
 * @param {number} x The number the sine hyperbolicus will be calculated of.
 * @return {number} Sine hyperbolicus of the given value.
 */
JXG.Math.Numerics.sinh = function(/** number */ x) /** number */ {
    return (Math.exp(x)-Math.exp(-x))*0.5;
};


/**
 * Hlper function to create curve which displays Riemann sums.
 * Compute coordinates for the rectangles showing the Riemann sum.
 * @param {function} f Function f, whose integral is approximated by the Riemann sum.
 * @param {int} n number of rectangles.
 * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'.
 * @param {float} start Left border of the approximation interval
 * @param {float} end Right border of the approximation interval
 * @return {array} An array of two arrays containing the x and y coordinates for the rectangles showing the Riemann sum. This array may be used as
 *                 parent array of a JXG.Curve.
 */
JXG.Math.Numerics.riemann = function(/** function */ f, /** type */ n,  /** type */ type,  /** type */ start,  /** type */ end)  /** array */ {
    var xarr,yarr,i,delta,j,x,y,x1,delta1,y1;
    
    xarr = [];
    yarr = [];
    j = 0;
    x = start;
    n = Math.floor(n);
    xarr[j] = x; yarr[j] = 0.0;
    
    if (n>0) {
        delta = (end-start)/n;
        delta1 = delta*0.01; // for 'lower' and 'upper'
        
        for (i=0;i<n;i++) {
            if (type=='right') {
                y = f(x+delta);
            } else if (type=='middle') {
                y = f(x+delta*0.5);
            } else if ((type=='left') || (type=='trapezodial')) {
                y = f(x);
            } else if (type=='lower') {
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1<y) { y = y1; };
                }
            } else { // (type=='upper')
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1>y) { y = y1; };
                }
            }
            
            j++;
            xarr[j] = x; yarr[j] = y;
            j++; x+=delta;
            if (type=='trapezodial') {
                y = f(x);
            }
            xarr[j] = x; yarr[j] = y;
            j++;
            xarr[j] = x; yarr[j] = 0.0;
         }
    }
    return [xarr,yarr];
};

/**
 * Approximate the integral by Riemann sums.
 * Compute the area described by the riemann sum rectangles.
 * @param {function} f Function f, whose integral is approximated by the Riemann sum.
 * @param {int} n number of rectangles.
 * @param {String} type Type of approximation. Possible values are: 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'.
 * @param {float} start Left border of the approximation interval
 * @param {float} end Right border of the approximation interval
 * @return {float} The sum of the areas of the rectangles.
 */
JXG.Math.Numerics.riemannsum = function(/** function */ f, /** type */ n,  /** type */ type,  /** type */ start,  /** type */ end)  /** number */ {
    var sum,i,delta,x,y,x1,delta1,y1;
    
    sum = 0.0;
    x = start;
    n = Math.floor(n);
    if (n>0) {
        delta = (end-start)/n;
        delta1 = delta*0.01; // for 'lower' and 'upper'
        for (i=0;i<n;i++) {
            if (type=='right') {
                y = f(x+delta);
            } else if (type=='middle') {
                y = f(x+delta*0.5);
            } else if (type=='trapezodial') {
                y = 0.5*(f(x+delta)+f(x));
            } else if (type=='left') { 
                y = f(x);
            } else if (type=='lower') {
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1<y) { y = y1; };
                }
            } else { // (type=='upper')
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1>y) { y = y1; };
                }
            }
            sum += delta*y;
            x += delta;
         }
    }
    return sum;
};

/**
 * Object for storing butcher tableaus for Runge-Kutta-methods.
 * @class
 * @description
 * @see JXG.Math.Numerics.rungeKutta
 */
JXG.Math.Numerics.Butcher = function () {
    /**
     * Order of Runge-Kutta-method.
     * @type number
     */
    this.s = 0;

    /**
     * 2-dimensional array containing the butcher tableau matrix.
     * See <a href="http://en.wikipedia.org/wiki/Runge-Kutta_methods">http://en.wikipedia.org/wiki/Runge-Kutta_methods</a>.
     * @type array
     */
    this.A = [];

    /**
     * Array containing the coefficients below the butcher tableau matrix.
     * See <a href="http://en.wikipedia.org/wiki/Runge-Kutta_methods">http://en.wikipedia.org/wiki/Runge-Kutta_methods</a>.
     * @type array
     */
    this.b = [];

    /**
     * Array containing the coefficients to the left of the butcher tableau matrix.
     * See <a href="http://en.wikipedia.org/wiki/Runge-Kutta_methods">http://en.wikipedia.org/wiki/Runge-Kutta_methods</a>.
     * @type array
     */
    this.c = [];
};

/**
 * Predefined butcher tableaus for the common Runge-Kutta method (fourth order), Heun method (second order), and Euler method (first order).
 * @namespace
 */
JXG.Math.Numerics.predefinedButcher = {};

/**
 * Butcher tableau for common fourth order Runge-Kutta method.
 * @type JXG.Math.Numerics.Butcher
 */
JXG.Math.Numerics.predefinedButcher.RK4 = {
    s: 4,
    A: [[ 0,  0,  0, 0],
        [0.5, 0,  0, 0],
        [ 0, 0.5, 0, 0],
        [ 0,  0,  1, 0]],
    b: [1./6., 1./3., 1./3., 1./6.],
    c: [0, 0.5, 0.5, 1]
};

/**
 * Butcher tableau for heun method.
 * @type JXG.Math.Numerics.Butcher
 */
JXG.Math.Numerics.predefinedButcher.Heun = {
    s: 2,
    A: [[0, 0], [1, 0]],
    b: [0.5, 0.5],
    c: [0, 1]
};

/**
 * Butcher tableau for euler method.
 * @type JXG.Math.Numerics.Butcher
 */
JXG.Math.Numerics.predefinedButcher.Euler = {
    s: 1,
    A: [[0]],
    b: [1],
    c: [0]
};

/**
 * Solve initial value problems numerically using Runge-Kutta-methods.
 * See {@link http://en.wikipedia.org/wiki/Runge-Kutta_methods} for more information on the algorithm.
 * @param butcher Butcher tableau describing the Runge-Kutta method to use.
 * @param x0 Initial value vector. If the problem is of one-dimensional, the initial value also has to be given in an array.
 * @param I Interval on which to integrate.
 * @param N Number of evaluation points.
 * @param f Function describing the right hand side of the first order ordinary differential equation, i.e. if the ode
 * is given by the equation <pre>dx/dt = f(t, x(t)).</pre> So f has to take two parameters, a number <tt>t</tt> and a
 * vector <tt>x</tt>, and has to return a vector of the same dimension as <tt>x</tt> has.
 * @return An array of vectors describing the solution of the ode on the given interval I.
 * @example
 * // A very simple autonomous system dx(t)/dt = x(t);
 * function f(t, x) {
 *     return x;
 * }
 * 
 * // We want to use the method of heun.
 * var method = JXG.Math.Numerics.predefinedButcher.Heun;
 * // Solve it with initial value x(0) = 1 on the interval [0, 2]
 * // with 20 evaluation points.
 * var data = JXG.Math.Numerics.rungeKutta(method, [1], [0, 2], 20, f);
 * 
 * // Prepare data for plotting the solution of the ode using a curve. 
 * var dataX = [];
 * var dataY = [];
 * var h = 0.1;        // (I[1] - I[0])/N  = (2-0)/20
 * for(var i=0; i&lt;data.length; i++) {
 *     dataX[i] = i*h;
 *     dataY[i] = data[i][0];
 * }
 * var g = board.createElement('curve', [dataX, dataY], {strokeWidth:'2px'});
 * </pre><div id="d2432d04-4ef7-4159-a90b-a2eb8d38c4f6" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * var board = JXG.JSXGraph.initBoard('d2432d04-4ef7-4159-a90b-a2eb8d38c4f6', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 * function f(t, x) {
 *     // we have to copy the value.
 *     // return x; would just return the reference.
 *     return [x[0]];
 * }
 * var data = JXG.Math.Numerics.rungeKutta(JXG.Math.Numerics.predefinedButcher.Heun, [1], [0, 2], 20, f);
 * var dataX = [];
 * var dataY = [];
 * var h = 0.1;
 * for(var i=0; i<data.length; i++) {
 *     dataX[i] = i*h;
 *     dataY[i] = data[i][0];
 * }
 * var g = board.createElement('curve', [dataX, dataY], {strokeColor:'red', strokeWidth:'2px'});
 * </script><pre>
 */
JXG.Math.Numerics.rungeKutta = function(/** JXG.Math.Numerics.Butcher */ butcher, /** array */ x0,
										/** array */ I, /** number */ N, /** function */ f) /** array */ {

	// TODO error/parameter check:
    // N not too big (warn or give up?) OR adaptive stepsize.

    var x = [],
        y = [],
        h = (I[1]-I[0])/N,
        t = I[0],
        e, i, j, 
        k, l,
        dim = x0.length,
        s = butcher.s,
        numberOfResultPoints = 1000,
        quotient = N/numberOfResultPoints,
        result = [],
        r = 0;
        
    // don't change x0, so copy it
    for (e=0; e<dim; e++)
        x[e] = x0[e];
    for (i=0; i<N; i++) {
        // Optimization doesn't work for ODEs plotted using time
//        if((i % quotient == 0) || (i == N-1)) {
            result[r] = [];
            for (e=0; e<dim; e++)
                result[r][e] = x[e];
            r++;
//        }
        // init k
        k = [];
        for(j=0; j<s; j++) {
            // init y = 0
            for (e=0; e<dim; e++)
                y[e] = 0.;

            // Calculate linear combination of former k's and save it in y
            for (l=0; l<j; l++) {
                for (e=0; e<dim; e++) {
                    y[e] += (butcher.A[j][l])*h*k[l][e];
                }
            }

            // add x(t) to y
            for(e=0; e<dim; e++) {
                y[e] += x[e];
            }

            // calculate new k and add it to the k matrix
            k.push(f(t+butcher.c[j]*h, y));
        }

        // init y = 0
        for (e=0; e<dim; e++)
            y[e] = 0.;

        for (l=0; l<s; l++) {
            for (e=0; e<dim; e++)
                y[e] += butcher.b[l]*k[l][e];
        }

        for (e=0; e<dim; e++) {
            x[e] = x[e] + h*y[e];
        }

        t += h;
    }

    return result;
};
