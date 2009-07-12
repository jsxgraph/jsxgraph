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
 * Math.Numerics
 */
JXG.Math.Numerics = {}; 

/**
 * Namespace constants 
 * Constants used for integration with Newton-Cotes-algorithm 
 */
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
   var x = b,
        i, j;

   for (i = R.m()-1; i >= 0; i--) {
      for (j = R.n()-1; j > i; j--) {
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
    var eps = 1.e-12,
        i, j, k, P,
        x, y;
    
    /* vector to keep track of permutations caused by pivotion */
    P = new JXG.Math.Vector();
    for (i = 0; i < A.n(); i++) {
        P.push(i);
    }
    
   /* Gauss-Jordan-elimination */
    for (j=0; j < A.n(); j++)
    {
        for (i = A.n()-1; i > j; i--) {
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
                    for (k = j + 1; k < A.n(); k ++) {
                        A[i][k] -= A[i][j] * A[j][k];
                    }
                }
            }
            if (Math.abs(A[j][j]) < JXG.Math.eps) { // The absolute values of all coefficients below the j-th row in the j-th column are smaller than JXG.Math.eps.
                throw new SingularMatrixException();
            }
        }
    }
   
    y = JXG.Math.Numerics.backwardSolve(A, b);
    x = new JXG.Math.Vector();
    for (i = 0; i < y.n(); i++) {
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
    // TODO needs implementation
};

/**
 * Calculates the integral of function f over interval using Newton-Cotes-algorithm.
 * @param {Array} interval e.g. [a, b] 
 * @param {function} f
 * @type float
 * @return Integral value of f over interval interval
 */
JXG.Math.Numerics.NewtonCotes = function(interval, f) {
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
                throw "Error: INT_SIMPSONS requires Algebra.number_of_nodes dividable by 2.";
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
            integral_value *= 2.0 * step_size / 45.0; /* todo */
    }
    return integral_value;
};

/**
 * Calculates second derivatives at the knots.
 * @param {JXG.Math.Vector} x x values of knots
 * @param {JXG.Math.Vector} y y values of knots
 * @type JXG.Math.Vector
 * @return Second derivatives of interpolated function at the knots.
 */
JXG.Math.Numerics.splineDef = function(x, y) {
    var n = x.length,
        pair, i, diag, z, l,
        data = new Array(),
        dx = [], 
        delta = [],
        F;
        
    if (x.length != y.length)
        throw "Error in JXG.Math.Numerics.splineDef: Input vector dimensions do not match.";
    
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
        throw "Error in JXG.Math.Numerics.splineEval: Defining vector dimensions do not match.";
    
    // number of points to be evaluated
    if(JXG.IsArray(x0)) {
        l = x0.length;
        asArray = true;
    } else
        x0 = [x0];
    
    y0 = new Array();
    
    for (i=0; i<l; i++) {
        // is x0 in defining interval?
        if( (x0[i] < x[0]) || (x[i] > x[n-1]))
            return 'NaN';
//            throw "Error in JXG.Math.Numerics.splineEval: Evaluation point outside spline interval.";
        
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
 * Computes the polynomial through a given set of coordinates in Lagrange form.
 * @param {Array of JXG.Points} 
 * @type function
 * @return A function of one parameter which returns the value of the polynomial,
 * whose graph runs through the given points.
 */
JXG.Math.Numerics.lagrangePolynomial = function(p) {  
    return function(x) {
        var i,k,t,
            y = 0.0,
            xc = [],
            nom = 1.0;
            
        for (i=0;i<p.length;i++) {
            xc[i] = p[i].X();
            nom *= (x-xc[i]);
        }
        
        for (i=0;i<p.length;i++) {
            t = p[i].Y()*nom/(x-xc[i]);
            for (k=0;k<p.length;k++) if (k!=i) {
                t /= (xc[i]-xc[k]);
            }
            y += t;
        }
        return y;
    };
}

/**
 * Computes the Lagrange polynomial for curves with Neville's algorithm.
 * @param {Array of JXG.Points} 
 * @type {Array function, function vaue, value]}
 * @return [f(t),g(t),0,p.length-1],
 * The graph of the parametric curve [f(t),g(t)] runs through the given points.
 */
JXG.Math.Numerics.neville = function(p) {
    return [function(t) {
                var i,k,L,
                    val = 0.0,
                    nom = 1.0;
                
                for (i=0;i<p.length;i++) {
                    nom *= (t-i);
                }
                
                for (i=0;i<p.length;i++) {
                    L = p[i].X()*nom/(t-i);
                    for (k=0;k<p.length;k++) if (k!=i) {
                        L /= (i-k);
                    }
                    val += L;
                }
                return val;
            },
            function(t) {
                var i,k,L,
                    val = 0.0,
                    nom = 1.0;
                
                for (i=0;i<p.length;i++) {
                    nom *= (t-i);
                }
                for (i=0;i<p.length;i++) {
                    L = p[i].Y()*nom/(t-i);
                    for (k=0;k<p.length;k++) if (k!=i) {
                        L /= (i-k);
                    }
                    val += L;
                }
                return val;
            }, 
            0, function(){ return p.length-1;}
        ];
}

/**
 * Calculation of derivative.
 * @param {Function} 
 * @type {Function}
 * @return Derivative of given f.
 */
JXG.Math.Numerics.D = function(f,obj) {
    var h = 0.00001,
        h2 = h*2.0;
        
    if (arguments.length==1){ 
        return function(x){ return (f(x+h)-f(x-h))/h2; };
    } else { // set "this" to "obj" in f 
        return function(x){ return (f.apply(obj,[x+h])-f.apply(obj,[x-h]))/h2; };
    }
};

/**
 * Integral of function f over interval. Warning: Just for backward compatibility, may be removed in futures releases.
 * @param {Array} interval e.g. [a, b] 
 * @param {function} f 
 */
JXG.Math.Numerics.I = function(interval, f) {
    return JXG.Math.Numerics.NewtonCotes(interval, f);
};

/**
 * Newton method to find roots
 * @param {function} 
 * @param {Number}  
 */
JXG.Math.Numerics.newton = function(f,x,obj) {
    var i = 0,
        h = 0.0000001,
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
 * Abstract method to find roots
 * @param {function} 
 * @param {variable}  
 */
JXG.Math.Numerics.root = function(f,x,obj) {
    return this.newton(f,x,obj);
};

/**
 * Cosine hyperbolicus
 * @param {number} 
 */
JXG.Math.Numerics.cosh = function(x) {
    return (Math.exp(x)+Math.exp(-x))*0.5;
};

/**
 * Sine hyperbolicus
 * @param {number} 
 */
JXG.Math.Numerics.sinh = function(x) {
    return (Math.exp(x)-Math.exp(-x))*0.5;
};


/**
 * Riemann sum.
 * Compute coordinates for the rectangles showing the Riemann sum.
 * @param {f} 
 * @param {n} 
 * @param {type} 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'
 * @param {start} 
 * @param {end} 
 */
JXG.Math.Numerics.riemann = function(f, n, type, start, end) {
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
                    if (y1<y) { y = y1 };
                }
            } else { // (type=='upper')
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1>y) { y = y1 };
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
 * Computation of the Riemann sum.
 * @param {f} 
 * @param {n} 
 * @param {type} 'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'
 * @param {start} 
 * @param {end} 
 */
JXG.Math.Numerics.riemannsum = function(f, n, type, start, end) {
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
                    if (y1<y) { y = y1 };
                }
            } else { // (type=='upper')
                y = f(x);
                for (x1=x+delta1;x1<=x+delta;x1+=delta1) {
                    y1 = f(x1);
                    if (y1>y) { y = y1 };
                }
            }
            sum += delta*y;
            x += delta;
         }
    }
    return sum;
};

/**
 * Class for storing butcher arrays for Runge-Kutta-methods
 * @see JXG.Math.Numerics.rungeKutta
 */
JXG.Math.Numerics.Butcher = function () {
    /**
     * Order of Runge-Kutta-method
     * @type int
     */
    this.s = 0;

    /**
     * See http://en.wikipedia.org/wiki/Runge-Kutta_methods
     */
    this.A = [];

    /**
     * See http://en.wikipedia.org/wiki/Runge-Kutta_methods
     */
    this.b = [];

    /**
     * See http://en.wikipedia.org/wiki/Runge-Kutta_methods
     */
    this.c = [];
};

/**
 * Predefined butcher arrays
 */
JXG.Math.Numerics.predefinedButcher = {};

JXG.Math.Numerics.predefinedButcher.RK4 = {
    s: 4,
    A: [[ 0,  0,  0, 0],
        [0.5, 0,  0, 0],
        [ 0, 0.5, 0, 0],
        [ 0,  0,  1, 0]],
    b: [1./6., 1./3., 1./3., 1./6.],
    c: [0, 0.5, 0.5, 1]
};

JXG.Math.Numerics.predefinedButcher.Heun = {
    s: 2,
    A: [[0, 0], [1, 0]],
    b: [0.5, 0.5],
    c: [0, 1]
};

JXG.Math.Numerics.predefinedButcher.Euler = {
    s: 1,
    A: [[0]],
    b: [1],
    c: [0]
};

/**
 * Solve ordinary differential equations numerically using Runge-Kutta-methods
 * http://en.wikipedia.org/wiki/Runge-Kutta_methods
 */
/* TODO description*/
JXG.Math.Numerics.rungeKutta = function(butcher, x0, I, N, f) {
    // TODO error/parameter check:
    // N not too big (warn or give up?) OR implement step size control

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
    for (e=0; e<x0.length; e++)
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