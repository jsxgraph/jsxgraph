/*
    Copyright 2008-2021
        Matthias Ehmann,
        Carsten Miller,
        Andreas Walter,
        Alfred Wassermann

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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 math/math
 utils/type
 */

define(['jxg', 'math/math', 'utils/type'], function (JXG, Mat, Type) {

    "use strict";

    /**
     * Probability functions, e.g. error function,
     * see: https://en.wikipedia.org/wiki/Error_function
     * Ported from
     * by https://github.com/jeremybarnes/cephes/blob/master/cprob/ndtr.c,
     *
     * Cephes Math Library Release 2.9:  November, 2000
     * Copyright 1984, 1987, 1988, 1992, 2000 by Stephen L. Moshier
     *
     * @name JXG.Math.ProbFuncs
     * @exports Mat.ProbFuncs as JXG.Math.ProbFuncs
     * @namespace
     */
    Mat.ProbFuncs = {
        MAXNUM: 1.701411834604692317316873e38,  // 2**127
        SQRTH:  7.07106781186547524401E-1,      // sqrt(2)/2
        SQRT2:  1.41421356237309504880,         // sqrt(2)
        MAXLOG: 7.08396418532264106224E2,       // log 2**1022

        P: [
            2.46196981473530512524E-10,
            5.64189564831068821977E-1,
            7.46321056442269912687E0,
            4.86371970985681366614E1,
            1.96520832956077098242E2,
            5.26445194995477358631E2,
            9.34528527171957607540E2,
            1.02755188689515710272E3,
            5.57535335369399327526E2
        ],

        Q: [
            1.32281951154744992508E1,
            8.67072140885989742329E1,
            3.54937778887819891062E2,
            9.75708501743205489753E2,
            1.82390916687909736289E3,
            2.24633760818710981792E3,
            1.65666309194161350182E3,
            5.57535340817727675546E2
        ],

        R: [
            5.64189583547755073984E-1,
            1.27536670759978104416E0,
            5.01905042251180477414E0,
            6.16021097993053585195E0,
            7.40974269950448939160E0,
            2.97886665372100240670E0
        ],

        S: [
            2.26052863220117276590E0,
            9.39603524938001434673E0,
            1.20489539808096656605E1,
            1.70814450747565897222E1,
            9.60896809063285878198E0,
            3.36907645100081516050E0
        ],

        T: [
            9.60497373987051638749E0,
            9.00260197203842689217E1,
            2.23200534594684319226E3,
            7.00332514112805075473E3,
            5.55923013010394962768E4
        ],

        U: [
            3.35617141647503099647E1,
            5.21357949780152679795E2,
            4.59432382970980127987E3,
            2.26290000613890934246E4,
            4.92673942608635921086E4
        ],

        // UTHRESH: 37.519379347,
        M: 128.0,
        MINV: 0.0078125,

        /**
         *
         *	Exponential of squared argument
         *
         * SYNOPSIS:
         *
         * double x, y, expx2();
         * int sign;
         *
         * y = expx2( x, sign );
         *
         *
         *
         * DESCRIPTION:
         *
         * Computes y = exp(x*x) while suppressing error amplification
         * that would ordinarily arise from the inexactness of the
         * exponential argument x*x.
         *
         * If sign < 0, the result is inverted; i.e., y = exp(-x*x) .
         *
         *
         * ACCURACY:
         *
         *                      Relative error:
         * arithmetic    domain     # trials      peak         rms
         *   IEEE      -26.6, 26.6    10^7       3.9e-16     8.9e-17
         *
         * @private
         * @param  {Number} x
         * @param  {Number} sign (int)
         * @returns {Number}
         */
        expx2: function(x, sign) {
            // double x;
            // int sign;
            var u, u1, m, f;

            x = Math.abs(x);
            if (sign < 0) {
                x = -x;
            }

            // Represent x as an exact multiple of M plus a residual.
            //    M is a power of 2 chosen so that exp(m * m) does not overflow
            //    or underflow and so that |x - m| is small.
            m = this.MINV * Math.floor(this.M * x + 0.5);
            f = x - m;

            // x^2 = m^2 + 2mf + f^2
            u = m * m;
            u1 = 2 * m * f  +  f * f;

            if (sign < 0) {
                u = -u;
                u1 = -u1;
            }

            if ( u + u1 > this.MAXLOG) {
                return Number.INFINITY;
            }

            // u is exact, u1 is small.
            u = Math.exp(u) * Math.exp(u1);
            return(u);
        },

        /**
         *
         *	Evaluate polynomial
         *
         * SYNOPSIS:
         *
         * int N;
         * double x, y, coef[N+1], polevl[];
         *
         * y = polevl( x, coef, N );
         *
         * DESCRIPTION:
         *
         * Evaluates polynomial of degree N:
         *
         *                     2          N
         * y  =  C  + C x + C x  +...+ C x
         *        0    1     2          N
         *
         * Coefficients are stored in reverse order:
         *
         * coef[0] = C  , ..., coef[N] = C  .
         *            N                   0
         *
         *  The function p1evl() assumes that coef[N] = 1.0 and is
         * omitted from the array.  Its calling arguments are
         * otherwise the same as polevl().
         *
         *
         * SPEED:
         *
         * In the interest of speed, there are no checks for out
         * of bounds arithmetic.  This routine is used by most of
         * the functions in the library.  Depending on available
         * equipment features, the user may wish to rewrite the
         * program in microcode or assembly language.
         *
         * @private
         * @param  {Number} x
         * @param  {Number} coef
         * @param  {Number} N
         * @returns {Number}
         */
        polevl: function(x, coef, N) {
            var ans, i;

            if (Type.exists(coef.reduce)) {
                return coef.reduce((r, c) => r * x + c, 0);
            }

            for (i = 0, ans = 0; i <= N; i++) {
                ans = ans * x + coef[i];
            }

            return ans;

        },

        /**
         * Evaluate polynomial when coefficient of x is 1.0.
         * Otherwise same as polevl.
         *
         * @private
         * @param  {Number} x
         * @param  {Number} coef
         * @param  {Number} N
         * @returns {Number}
         */
        p1evl: function(x, coef, N) {
            var ans, i;

            if (Type.exists(coef.reduce)) {
                return coef.reduce((r, c) => r * x + c, 1);
            }

            for (i = 0, ans = 1; i < N; i++) {
                ans = ans * x + coef[i];
            }

            return ans;
        },

        /**
         *
         *	Normal distribution function
         *
         * SYNOPSIS:
         *
         * y = ndtr( x );
         *
         * DESCRIPTION:
         *
         * Returns the area under the Gaussian probability density
         * function, integrated from minus infinity to x:
         *
         *                            x
         *                             -
         *                   1        | |          2
         *    ndtr(x)  = ---------    |    exp( - t /2 ) dt
         *               sqrt(2pi)  | |
         *                           -
         *                          -inf.
         *
         *             =  ( 1 + erf(z) ) / 2
         *             =  erfc(z) / 2
         *
         * where z = x/sqrt(2). Computation is via the functions
         * erf and erfc with care to avoid error amplification in computing exp(-x^2).
         *
         *
         * ACCURACY:
         *
         *                      Relative error:
         * arithmetic   domain     # trials      peak         rms
         *    IEEE     -13,0        30000       1.3e-15     2.2e-16
         *
         *
         * ERROR MESSAGES:
         *
         *   message         condition         value returned
         * erfc underflow    x > 37.519379347       0.0
         *
         * @param  {Number} a
         * @returns {Number}
         */
        ndtr: function(a) {
            // a: double, return double
            var x, y, z;

            x = a * this.SQRTH;
            z = Math.abs(x);

            if (z < 1.0) {
                y = 0.5 + 0.5 * this.erf(x);
            } else {
                y = 0.5 * this.erfce(z);
                /* Multiply by exp(-x^2 / 2)  */
                z = this.expx2(a, -1);
                y = y * Math.sqrt(z);
                if (x > 0) {
                    y = 1.0 - y;
                }
            }
            return y;
        },

        /**
         * @private
         * @param  {Number} a
         * @returns {Number}
         */
        _underflow: function(a) {
            console.log('erfc', 'UNDERFLOW');
            if (a < 0) {
                return 2.0;
            } else {
                return 0.0;
            }
        },

        /**
         *
         *	Complementary error function
         *
         * SYNOPSIS:
         *
         * double x, y, erfc();
         *
         * y = erfc( x );
         *
         *
         *
         * DESCRIPTION:
         *
         *
         *  1 - erf(x) =
         *
         *                           inf.
         *                             -
         *                  2         | |          2
         *   erfc(x)  =  --------     |    exp( - t  ) dt
         *               sqrt(pi)   | |
         *                           -
         *                            x
         *
         *
         * For small x, erfc(x) = 1 - erf(x); otherwise rational
         * approximations are computed.
         *
         * A special function expx2.c is used to suppress error amplification
         * in computing exp(-x^2).
         *
         *
         * ACCURACY:
         *
         *                      Relative error:
         * arithmetic   domain     # trials      peak         rms
         *    IEEE      0,26.6417   30000       1.3e-15     2.2e-16
         *
         *
         * ERROR MESSAGES:
         *
         *   message         condition              value returned
         * erfc underflow    x > 9.231948545 (DEC)       0.0
         *
         * @param  {Number} a
         * @returns {Number}
         */
        erfc: function(a) {
            var p, q, x, y, z;

            if (a < 0.0) {
                x = -a;
            } else {
                x = a;
            }
            if (x < 1.0) {
                return 1.0 - this.erf(a);
            }

            z = -a * a;
            if (z < -this.MAXLOG) {
                return this._underflow(a);
            }

            z = this.expx2(a, -1);  // Compute z = exp(z).

            if (x < 8.0) {
                p = this.polevl(x, this.P, 8);
                q = this.p1evl(x, this.Q, 8);
            } else {
                p = this.polevl(x, this.R, 5);
                q = this.p1evl(x, this.S, 6);
            }

            y = (z * p) / q;

            if (a < 0) {
                y = 2.0 - y;
            }

            if (y == 0.0) {
                return this._underflow(a);
            }

            return y;
        },

        /**
         * Exponentially scaled erfc function
         *   exp(x^2) erfc(x)
         *   valid for x > 1.
         *   Use with ndtr and expx2.
         *
         * @private
         * @param {Number} x
         * @returns {Number}
         */
        erfce: function(x) {
            var p, q;

            if (x < 8.0) {
                p = this.polevl(x, P, 8);
                q = this.p1evl(x, Q, 8);
            } else {
                p = this.polevl( x, R, 5 );
                q = this.p1evl( x, S, 6 );
            }
            return p / q;
        },

        /**
         *	Error function
         *
         * SYNOPSIS:
         *
         * double x, y, erf();
         *
         * y = erf( x );
         *
         *
         *
         * DESCRIPTION:
         *
         * The integral is
         *
         *                           x
         *                            -
         *                 2         | |          2
         *   erf(x)  =  --------     |    exp( - t  ) dt.
         *              sqrt(pi)   | |
         *                          -
         *                           0
         *
         * For 0 <= |x| < 1, erf(x) = x * P4(x**2)/Q5(x**2); otherwise
         * erf(x) = 1 - erfc(x).
         *
         *
         * ACCURACY:
         *
         *                      Relative error:
         * arithmetic   domain     # trials      peak         rms
         *    DEC       0,1         14000       4.7e-17     1.5e-17
         *    IEEE      0,1         30000       3.7e-16     1.0e-16
         *
         * @param  {Number} x
         * @returns {Number}
         */
        erf: function(x) {
            var y, z;

            if (Math.abs(x) > 1.0) {
                return 1.0 - this.erfc(x);
            }
            z = x * x;
            y = x * this.polevl(z, this.T, 4) / this.p1evl(z, this.U, 5);
            return y;
        },

        s2pi: 2.50662827463100050242E0, // sqrt(2pi)

        // approximation for 0 <= |y - 0.5| <= 3/8 */
        P0: [
            -5.99633501014107895267E1,
             9.80010754185999661536E1,
            -5.66762857469070293439E1,
             1.39312609387279679503E1,
            -1.23916583867381258016E0
        ],

        Q0: [
             1.95448858338141759834E0,
             4.67627912898881538453E0,
             8.63602421390890590575E1,
            -2.25462687854119370527E2,
             2.00260212380060660359E2,
            -8.20372256168333339912E1,
             1.59056225126211695515E1,
            -1.18331621121330003142E0,
        ],

        //  Approximation for interval z = sqrt(-2 log y ) between 2 and 8
        //  i.e., y between exp(-2) = .135 and exp(-32) = 1.27e-14.
        P1: [
            4.05544892305962419923E0,
            3.15251094599893866154E1,
            5.71628192246421288162E1,
            4.40805073893200834700E1,
            1.46849561928858024014E1,
            2.18663306850790267539E0,
           -1.40256079171354495875E-1,
           -3.50424626827848203418E-2,
           -8.57456785154685413611E-4
        ],

        Q1: [
            1.57799883256466749731E1,
            4.53907635128879210584E1,
            4.13172038254672030440E1,
            1.50425385692907503408E1,
            2.50464946208309415979E0,
           -1.42182922854787788574E-1,
           -3.80806407691578277194E-2,
           -9.33259480895457427372E-4
        ],

        // Approximation for interval z = sqrt(-2 log y ) between 8 and 64
        // i.e., y between exp(-32) = 1.27e-14 and exp(-2048) = 3.67e-890.
        P2: [
            3.23774891776946035970E0,
            6.91522889068984211695E0,
            3.93881025292474443415E0,
            1.33303460815807542389E0,
            2.01485389549179081538E-1,
            1.23716634817820021358E-2,
            3.01581553508235416007E-4,
            2.65806974686737550832E-6,
            6.23974539184983293730E-9
        ],

        Q2: [
            6.02427039364742014255E0,
            3.67983563856160859403E0,
            1.37702099489081330271E0,
            2.16236993594496635890E-1,
            1.34204006088543189037E-2,
            3.28014464682127739104E-4,
            2.89247864745380683936E-6,
            6.79019408009981274425E-9
        ],

        /**
         *
         *	Inverse of Normal distribution function
         *
         * SYNOPSIS:
         *
         * double x, y, ndtri();
         *
         * x = ndtri( y );
         *
         * DESCRIPTION:
         *
         * Returns the argument, x, for which the area under the
         * Gaussian probability density function (integrated from
         * minus infinity to x) is equal to y.
         *
         *
         * For small arguments 0 < y < exp(-2), the program computes
         * z = sqrt( -2.0 * log(y) );  then the approximation is
         * x = z - log(z)/z  - (1/z) P(1/z) / Q(1/z).
         * There are two rational functions P/Q, one for 0 < y < exp(-32)
         * and the other for y up to exp(-2).  For larger arguments,
         * w = y - 0.5, and  x/sqrt(2pi) = w + w**3 R(w**2)/S(w**2)).
         *
         *
         * ACCURACY:
         *
         *                      Relative error:
         * arithmetic   domain        # trials      peak         rms
         *    DEC      0.125, 1         5500       9.5e-17     2.1e-17
         *    DEC      6e-39, 0.135     3500       5.7e-17     1.3e-17
         *    IEEE     0.125, 1        20000       7.2e-16     1.3e-16
         *    IEEE     3e-308, 0.135   50000       4.6e-16     9.8e-17
         *
         *
         * ERROR MESSAGES:
         *
         *   message         condition    value returned
         * ndtri domain       x <= 0        -MAXNUM
         * ndtri domain       x >= 1         MAXNUM
         *
         * @param  {Number} y0
         * @returns {Number}
         */
        ndtri: function(y0) {
            var x, y, z, y2, x0, x1, code;

            if (y0 <= 0.0) {
                console.log("ndtri", "DOMAIN ");
                return -this.MAXNUM;
            }
            if (y0 >= 1.0) {
                console.log("ndtri", "DOMAIN");
                return this.MAXNUM;
            }

            code = 1;
            y = y0;
            if (y > (1.0 - 0.13533528323661269189))  {  // 0.135... = exp(-2)
                y = 1.0 - y;
                code = 0;
            }

            if (y > 0.13533528323661269189) {
                y = y - 0.5;
                y2 = y * y;
                x = y + y * (y2 * this.polevl(y2, this.P0, 4) / this.p1evl(y2, this.Q0, 8));
                x = x * this.s2pi;
                return x;
            }

            x = Math.sqrt( -2.0 * Math.log(y) );
            x0 = x - Math.log(x) / x;

            z = 1.0 / x;
            if (x < 8.0) {           // y > exp(-32) = 1.2664165549e-14
                x1 = z * this.polevl(z, this.P1, 8 ) / this.p1evl(z, this.Q1, 8);
            } else {
                x1 = z * this.polevl(z, P2, 8) / this.p1evl(z, Q2, 8);
            }
            x = x0 - x1;
            if (code != 0) {
                x = -x;
            }
            return x;
        },

        /**
         * Inverse of error function erf.
         * 
         * @param  {Number} x
         * @returns {Number}
         */
        erfi: function(x) {
            return this.ndtri((x + 1) * 0.5) * this.SQRTH;
        }
    };

    return Mat.ProbFuncs;
});
