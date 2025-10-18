/*
 Copyright 2008-2025
 Matthias Ehmann,
 Carsten Miller,
 Reinhard Oldenburg,
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
 the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
 and <https://opensource.org/licenses/MIT/>.

 This is a port of jcobyla

 - to JavaScript by Reihard Oldenburg and
 - to JSXGraph by Alfred Wassermann
 - optimized by Andreas Walter
 */
/*
 * jcobyla
 *
 * The MIT License
 *
 * Copyright (c) 2012 Anders Gustafsson, Cureos AB.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
 * (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Remarks:
 *
 * The original Fortran 77 version of this code was by Michael Powell (M.J.D.Powell @ damtp.cam.ac.uk)
 * The Fortran 90 version was by Alan Miller (Alan.Miller @ vic.cmis.csiro.au). Latest revision - 30 October 1998
 */

/**
 * Constrained Optimization BY Linear Approximation in Java.
 *
 * COBYLA2 is an implementation of Powell's nonlinear derivative free constrained optimization that uses
 * a linear approximation approach. The algorithm is a sequential trust region algorithm that employs linear
 * approximations to the objective and constraint functions, where the approximations are formed by linear
 * interpolation at n + 1 points in the space of the variables and tries to maintain a regular shaped simplex
 * over iterations.
 *
 * It solves nonsmooth NLP with a moderate number of variables (about 100). Inequality constraints only.
 *
 * The initial point X is taken as one vertex of the initial simplex with zero being another, so, X should
 * not be entered as the zero vector.
 *
 * @author Anders Gustafsson, Cureos AB. Translation to Javascript by Reinhard Oldenburg, Goethe-University
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true, continue: true*/

import JXG from "../jxg.js";
import Mat from "./math.js";
// import Type from "../utils/type.js";

/**
 * The JXG.Math.Nlp namespace holds numerical algorithms for non-linear optimization.
 * @name JXG.Math.Nlp
 * @namespace
 *
 */
JXG.Math.Nlp = {
    arr: function (n) {
        // Is 0 initialized
        return new Float64Array(n);
    },

    arr2: function (n, m) {
        var i = 0,
            a = new Array(n);

        while (i < n) {
            a[i] = this.arr(m);
            i++;
        }
        return a;
    },

    arraycopy: function (x, a, iox, b, n) {
        var i = 0;
        while (i < n) {
            iox[i + b] = x[i + a];
            i++;
        }
    },

    lastNumberOfEvaluations: 0,
    GetLastNumberOfEvaluations: function () {
        return this.lastNumberOfEvaluations;
    },
    // status Variables
    Normal: 0,
    MaxIterationsReached: 1,
    DivergingRoundingErrors: 2,

    /**
     * Minimizes the objective function F with respect to a set of inequality constraints CON,
     * and returns the optimal variable array. F and CON may be non-linear, and should preferably be smooth.
     * Calls {@link JXG.Math.Nlp#cobylb}.
     *
     * @param calcfc Interface implementation for calculating objective function and constraints.
     * @param n Number of variables.
     * @param m Number of constraints.
     * @param x On input initial values of the variables (zero-based array). On output
     * optimal values of the variables obtained in the COBYLA minimization.
     * @param rhobeg Initial size of the simplex.
     * @param rhoend Final value of the simplex.
     * @param iprint Print level, 0 <= iprint <= 3, where 0 provides no output and
     * 3 provides full output to the console.
     * @param maxfun Maximum number of function evaluations before terminating.
     * @param [testForRoundingErrors=false]
     * @returns {Number} Exit status of the COBYLA2 optimization.
     */
    FindMinimum: function (calcfc, n, m, x, rhobeg, rhoend, iprint, maxfun, testForRoundingErrors) {
        // CobylaExitStatus FindMinimum(final Calcfc calcfc, int n, int m, double[] x, double rhobeg, double rhoend, int iprint, int maxfun)
        //     This subroutine minimizes an objective function F(X) subject to M
        //     inequality constraints on X, where X is a vector of variables that has
        //     N components.  The algorithm employs linear approximations to the
        //     objective and constraint functions, the approximations being formed by
        //     linear interpolation at N+1 points in the space of the variables.
        //     We regard these interpolation points as vertices of a simplex.  The
        //     parameter RHO controls the size of the simplex and it is reduced
        //     automatically from RHOBEG to RHOEND.  For each RHO the subroutine tries
        //     to achieve a good vector of variables for the current size, and then
        //     RHO is reduced until the value RHOEND is reached.  Therefore RHOBEG and
        //     RHOEND should be set to reasonable initial changes to and the required
        //     accuracy in the variables respectively, but this accuracy should be
        //     viewed as a subject for experimentation because it is not guaranteed.
        //     The subroutine has an advantage over many of its competitors, however,
        //     which is that it treats each constraint individually when calculating
        //     a change to the variables, instead of lumping the constraints together
        //     into a single penalty function.  The name of the subroutine is derived
        //     from the phrase Constrained Optimization BY Linear Approximations.

        //     The user must set the values of N, M, RHOBEG and RHOEND, and must
        //     provide an initial vector of variables in X.  Further, the value of
        //     IPRINT should be set to 0, 1, 2 or 3, which controls the amount of
        //     printing during the calculation. Specifically, there is no output if
        //     IPRINT=0 and there is output only at the end of the calculation if
        //     IPRINT=1.  Otherwise each new value of RHO and SIGMA is printed.
        //     Further, the vector of variables and some function information are
        //     given either when RHO is reduced or when each new value of F(X) is
        //     computed in the cases IPRINT=2 or IPRINT=3 respectively. Here SIGMA
        //     is a penalty parameter, it being assumed that a change to X is an
        //     improvement if it reduces the merit function
        //                F(X)+SIGMA*MAX(0.0, - C1(X), - C2(X),..., - CM(X)),
        //     where C1,C2,...,CM denote the constraint functions that should become
        //     nonnegative eventually, at least to the precision of RHOEND. In the
        //     printed output the displayed term that is multiplied by SIGMA is
        //     called MAXCV, which stands for 'MAXimum Constraint Violation'.  The
        //     argument ITERS is an integer variable that must be set by the user to a
        //     limit on the number of calls of CALCFC, the purpose of this routine being
        //     given below.  The value of ITERS will be altered to the number of calls
        //     of CALCFC that are made.
        //     In order to define the objective and constraint functions, we require
        //     a subroutine that has the name and arguments
        //                SUBROUTINE CALCFC (N,M,X,F,CON)
        //                DIMENSION X(:),CON(:)  .
        //     The values of N and M are fixed and have been defined already, while
        //     X is now the current vector of variables. The subroutine should return
        //     the objective and constraint functions at X in F and CON(1),CON(2),
        //     ...,CON(M).  Note that we are trying to adjust X so that F(X) is as
        //     small as possible subject to the constraint functions being nonnegative.

        // Local variables
        var mpp = m + 2,
            status,
            // Internal base-1 X array
            iox = this.arr(n + 1),
            that = this,
            fcalcfc;

        this.lastNumberOfEvaluations = 0;

        if (testForRoundingErrors) {
            console.log("Experimental feature 'testForRoundingErrors' is activated.");
        }

        iox[0] = 0.0;
        this.arraycopy(x, 0, iox, 1, n);

        // Internal representation of the objective and constraints calculation method,
        // accounting for that X and CON arrays in the cobylb method are base-1 arrays.
        fcalcfc = function (n, m, thisx, con) {
            // int n, int m, double[] x, double[] con
            var ix = that.arr(n),
                ocon, f;

            that.lastNumberOfEvaluations = that.lastNumberOfEvaluations + 1;
            that.arraycopy(thisx, 1, ix, 0, n);
            ocon = that.arr(m);
            f = calcfc(n, m, ix, ocon);
            that.arraycopy(ocon, 0, con, 1, m);
            return f;
        };

        status = this.cobylb(fcalcfc, n, m, mpp, iox, rhobeg, rhoend, iprint, maxfun, testForRoundingErrors);
        this.arraycopy(iox, 1, x, 0, n);

        return status;
    },

    //    private static CobylaExitStatus cobylb(Calcfc calcfc, int n, int m, int mpp, double[] x,
    //      double rhobeg, double rhoend, int iprint, int maxfun)
    /**
     * JavaScript implementation of the non-linear optimization method COBYLA.
     * @param {Function} calcfc
     * @param {Number} n
     * @param {Number} m
     * @param {Number} mpp
     * @param {Number} x
     * @param {Number} rhobeg
     * @param {Number} rhoend
     * @param {Number} iprint
     * @param {Number} maxfun
     * @param {Boolean} [testForRoundingErrors=false]
     * @returns {Number} Exit status of the COBYLA2 optimization
     */
    cobylb: function (calcfc, n, m, mpp, x, rhobeg, rhoend, iprint, maxfun, testForRoundingErrors) {
        // calcf ist funktion die aufgerufen wird wie calcfc(n, m, ix, ocon)
        // N.B. Arguments CON, SIM, SIMI, DATMAT, A, VSIG, VETA, SIGBAR, DX, W & IACT
        //      have been removed.

        //     Set the initial values of some parameters. The last column of SIM holds
        //     the optimal vertex of the current simplex, and the preceding N columns
        //     hold the displacements from the optimal vertex to the other vertices.
        //     Further, SIMI holds the inverse of the matrix that is contained in the
        //     first N columns of SIM.

        // Local variables
        var status = -1,
            alpha = 0.25,
            beta = 2.1,
            gamma = 0.5,
            delta = 1.1,
            f = 0.0,
            resmax = 0.0,
            total,
            np = n + 1,
            mp = m + 1,
            rho = rhobeg,
            parmu = 0.0,
            iflag = false,
            ifull = false,
            parsig = 0.0,
            prerec = 0.0,
            prerem = 0.0,
            con = this.arr(1 + mpp),
            sim = this.arr2(1 + n, 1 + np),
            simi = this.arr2(1 + n, 1 + n),
            datmat = this.arr2(1 + mpp, 1 + np),
            a = this.arr2(1 + n, 1 + mp),
            vsig = this.arr(1 + n),
            veta = this.arr(1 + n),
            sigbar = this.arr(1 + n),
            dx = this.arr(1 + n),
            w = this.arr(1 + n),
            i, j, k, l,
            temp, tempa,
            nfvals, jdrop, ibrnch, skipVertexIdent,
            phimin, nbest, error, pareta, wsig, weta,
            cvmaxp, cvmaxm, dxsign, resnew, barmu,
            phi, vmold, vmnew, trured, ratio, edgmax,
            cmin, cmax, denom,
            endless = true;

        if (iprint >= 2) {
            console.log("The initial value of RHO is " + rho + " and PARMU is set to zero.");
        }

        nfvals = 0;
        temp = 1.0 / rho;

        for (i = 1; i <= n; ++i) {
            sim[i][np] = x[i];
            sim[i][i] = rho;
            simi[i][i] = temp;
        }

        jdrop = np;
        ibrnch = false;

        //     Make the next call of the user-supplied subroutine CALCFC. These
        //     instructions are also used for calling CALCFC during the iterations of
        //     the algorithm.
        //alert("Iteration "+nfvals+" x="+x);
        L_40: do {
            if (nfvals >= maxfun && nfvals > 0) {
                status = this.MaxIterationsReached;
                break L_40;
            }

            ++nfvals;
            f = calcfc(n, m, x, con);
            resmax = 0.0;
            for (k = 1; k <= m; ++k) {
                resmax = Math.max(resmax, -con[k]);
            }
            //alert(    "   f="+f+"  resmax="+resmax);

            if (nfvals === iprint - 1 || iprint === 3) {
                this.PrintIterationResult(nfvals, f, resmax, x, n, iprint);
            }

            con[mp] = f;
            con[mpp] = resmax;

            //     Set the recently calculated function values in a column of DATMAT. This
            //     array has a column for each vertex of the current simplex, the entries of
            //     each column being the values of the constraint functions (if any)
            //     followed by the objective function and the greatest constraint violation
            //     at the vertex.
            skipVertexIdent = true;
            if (!ibrnch) {
                skipVertexIdent = false;

                for (i = 1; i <= mpp; ++i) {
                    datmat[i][jdrop] = con[i];
                }

                if (nfvals <= np) {
                    //     Exchange the new vertex of the initial simplex with the optimal vertex if
                    //     necessary. Then, if the initial simplex is not complete, pick its next
                    //     vertex and calculate the function values there.

                    if (jdrop <= n) {
                        if (datmat[mp][np] <= f) {
                            x[jdrop] = sim[jdrop][np];
                        } else {
                            sim[jdrop][np] = x[jdrop];
                            for (k = 1; k <= mpp; ++k) {
                                datmat[k][jdrop] = datmat[k][np];
                                datmat[k][np] = con[k];
                            }
                            for (k = 1; k <= jdrop; ++k) {
                                sim[jdrop][k] = -rho;
                                temp = 0.0;
                                for (i = k; i <= jdrop; ++i) {
                                    temp -= simi[i][k];
                                }
                                simi[jdrop][k] = temp;
                            }
                        }
                    }
                    if (nfvals <= n) {
                        jdrop = nfvals;
                        x[jdrop] += rho;
                        continue L_40;
                    }
                }
                ibrnch = true;
            }

            L_140: do {
                L_550: do {
                    if (!skipVertexIdent) {
                        //     Identify the optimal vertex of the current simplex.
                        phimin = datmat[mp][np] + parmu * datmat[mpp][np];
                        nbest = np;

                        for (j = 1; j <= n; ++j) {
                            temp = datmat[mp][j] + parmu * datmat[mpp][j];
                            if (temp < phimin) {
                                nbest = j;
                                phimin = temp;
                            } else if (
                                temp === phimin &&
                                parmu === 0.0 &&
                                datmat[mpp][j] < datmat[mpp][nbest]
                            ) {
                                nbest = j;
                            }
                        }

                        //     Switch the best vertex into pole position if it is not there already,
                        //     and also update SIM, SIMI and DATMAT.
                        if (nbest <= n) {
                            for (i = 1; i <= mpp; ++i) {
                                temp = datmat[i][np];
                                datmat[i][np] = datmat[i][nbest];
                                datmat[i][nbest] = temp;
                            }
                            for (i = 1; i <= n; ++i) {
                                temp = sim[i][nbest];
                                sim[i][nbest] = 0.0;
                                sim[i][np] += temp;

                                tempa = 0.0;
                                for (k = 1; k <= n; ++k) {
                                    sim[i][k] -= temp;
                                    tempa -= simi[k][i];
                                }
                                simi[nbest][i] = tempa;
                            }
                        }

                        //     Make an error return if SIGI is a poor approximation to the inverse of
                        //     the leading N by N submatrix of SIG.
                        error = 0.0;
                        if (testForRoundingErrors) {
                            for (i = 1; i <= n; ++i) {
                                for (j = 1; j <= n; ++j) {
                                    temp =
                                        this.DOT_PRODUCT_ROW_COL(simi, i, sim, j, 1, n) -
                                        (i === j ? 1.0 : 0.0);
                                    // temp = this.DOT_PRODUCT(
                                    //     this.PART(this.ROW(simi, i), 1, n),
                                    //     this.PART(this.COL(sim, j), 1, n)
                                    // ) - (i === j ? 1.0 : 0.0);

                                    error = Math.max(error, Math.abs(temp));
                                }
                            }
                        }
                        if (error > 0.1) {
                            status = this.DivergingRoundingErrors;
                            break L_40;
                        }

                        //     Calculate the coefficients of the linear approximations to the objective
                        //     and constraint functions, placing minus the objective function gradient
                        //     after the constraint gradients in the array A. The vector W is used for
                        //     working space.
                        for (k = 1; k <= mp; ++k) {
                            con[k] = -datmat[k][np];
                            for (j = 1; j <= n; ++j) {
                                w[j] = datmat[k][j] + con[k];
                            }

                            for (i = 1; i <= n; ++i) {
                                a[i][k] =
                                    (k === mp ? -1.0 : 1.0) *
                                    this.DOT_PRODUCT_ROW_COL(w, -1, simi, i, 1, n);
                                // this.DOT_PRODUCT(this.PART(w, 1, n), this.PART(this.COL(simi, i), 1, n));
                            }
                        }

                        //     Calculate the values of sigma and eta, and set IFLAG = 0 if the current
                        //     simplex is not acceptable.
                        iflag = true;
                        parsig = alpha * rho;
                        pareta = beta * rho;

                        for (j = 1; j <= n; ++j) {
                            wsig = 0.0;
                            weta = 0.0;
                            for (k = 1; k <= n; ++k) {
                                wsig += simi[j][k] * simi[j][k];
                                weta += sim[k][j] * sim[k][j];
                            }
                            vsig[j] = 1.0 / Math.sqrt(wsig);
                            veta[j] = Math.sqrt(weta);
                            if (vsig[j] < parsig || veta[j] > pareta) {
                                iflag = false;
                            }
                        }

                        //     If a new vertex is needed to improve acceptability, then decide which
                        //     vertex to drop from the simplex.
                        if (!ibrnch && !iflag) {
                            jdrop = 0;
                            temp = pareta;
                            for (j = 1; j <= n; ++j) {
                                if (veta[j] > temp) {
                                    jdrop = j;
                                    temp = veta[j];
                                }
                            }
                            if (jdrop === 0) {
                                for (j = 1; j <= n; ++j) {
                                    if (vsig[j] < temp) {
                                        jdrop = j;
                                        temp = vsig[j];
                                    }
                                }
                            }

                            //     Calculate the step to the new vertex and its sign.
                            temp = gamma * rho * vsig[jdrop];
                            for (k = 1; k <= n; ++k) {
                                dx[k] = temp * simi[jdrop][k];
                            }
                            cvmaxp = 0.0;
                            cvmaxm = 0.0;
                            total = 0.0;
                            for (k = 1; k <= mp; ++k) {
                                // total = this.DOT_PRODUCT(this.PART(this.COL(a, k), 1, n), this.PART(dx, 1, n));
                                total = this.DOT_PRODUCT_ROW_COL(dx, -1, a, k, 1, n);
                                if (k < mp) {
                                    temp = datmat[k][np];
                                    cvmaxp = Math.max(cvmaxp, -total - temp);
                                    cvmaxm = Math.max(cvmaxm, total - temp);
                                }
                            }
                            dxsign = parmu * (cvmaxp - cvmaxm) > 2.0 * total ? -1.0 : 1.0;

                            //     Update the elements of SIM and SIMI, and set the next X.
                            temp = 0.0;
                            for (i = 1; i <= n; ++i) {
                                dx[i] = dxsign * dx[i];
                                sim[i][jdrop] = dx[i];
                                temp += simi[jdrop][i] * dx[i];
                            }
                            for (k = 1; k <= n; ++k) {
                                simi[jdrop][k] /= temp;
                            }

                            for (j = 1; j <= n; ++j) {
                                if (j !== jdrop) {
                                    // temp = this.DOT_PRODUCT(this.PART(this.ROW(simi, j), 1, n), this.PART(dx, 1, n));
                                    temp = this.DOT_PRODUCT_ROW_COL(simi, j, dx, -1, 1, n);
                                    for (k = 1; k <= n; ++k) {
                                        simi[j][k] -= temp * simi[jdrop][k];
                                    }
                                }
                                x[j] = sim[j][np] + dx[j];
                            }
                            continue L_40;
                        }

                        //     Calculate DX = x(*)-x(0).
                        //     Branch if the length of DX is less than 0.5*RHO.
                        ifull = this.trstlp(n, m, a, con, rho, dx);
                        if (!ifull) {
                            temp = 0.0;
                            for (k = 1; k <= n; ++k) {
                                temp += dx[k] * dx[k];
                            }
                            if (temp < 0.25 * rho * rho) {
                                ibrnch = true;
                                break L_550;
                            }
                        }

                        //     Predict the change to F and the new maximum constraint violation if the
                        //     variables are altered from x(0) to x(0) + DX.
                        total = 0.0;
                        resnew = 0.0;
                        con[mp] = 0.0;
                        for (k = 1; k <= mp; ++k) {
                            //total = con[k] - this.DOT_PRODUCT(this.PART(this.COL(a, k), 1, n), this.PART(dx, 1, n));
                            total = con[k] - this.DOT_PRODUCT_ROW_COL(dx, -1, a, k, 1, n);
                            if (k < mp) {
                                resnew = Math.max(resnew, total);
                            }
                        }

                        //     Increase PARMU if necessary and branch back if this change alters the
                        //     optimal vertex. Otherwise PREREM and PREREC will be set to the predicted
                        //     reductions in the merit function and the maximum constraint violation
                        //     respectively.
                        prerec = datmat[mpp][np] - resnew;
                        barmu = prerec > 0.0 ? total / prerec : 0.0;
                        if (parmu < 1.5 * barmu) {
                            parmu = 2.0 * barmu;
                            if (iprint >= 2) {
                                console.log("Increase in PARMU to " + parmu);
                            }
                            phi = datmat[mp][np] + parmu * datmat[mpp][np];
                            for (j = 1; j <= n; ++j) {
                                temp = datmat[mp][j] + parmu * datmat[mpp][j];
                                if (
                                    temp < phi ||
                                    (temp === phi &&
                                        parmu === 0.0 &&
                                        datmat[mpp][j] < datmat[mpp][np])
                                ) {
                                    continue L_140;
                                }
                            }
                        }
                        prerem = parmu * prerec - total;

                        //     Calculate the constraint and objective functions at x(*).
                        //     Then find the actual reduction in the merit function.
                        for (k = 1; k <= n; ++k) {
                            x[k] = sim[k][np] + dx[k];
                        }
                        ibrnch = true;
                        continue L_40;
                    }

                    skipVertexIdent = false;
                    vmold = datmat[mp][np] + parmu * datmat[mpp][np];
                    vmnew = f + parmu * resmax;
                    trured = vmold - vmnew;
                    if (parmu === 0.0 && f === datmat[mp][np]) {
                        prerem = prerec;
                        trured = datmat[mpp][np] - resmax;
                    }

                    //     Begin the operations that decide whether x(*) should replace one of the
                    //     vertices of the current simplex, the change being mandatory if TRURED is
                    //     positive. Firstly, JDROP is set to the index of the vertex that is to be
                    //     replaced.
                    ratio = trured <= 0.0 ? 1.0 : 0.0;
                    jdrop = 0;
                    for (j = 1; j <= n; ++j) {
                        // temp = Math.abs(this.DOT_PRODUCT(this.PART(this.ROW(simi, j), 1, n), this.PART(dx, 1, n)));
                        temp = Math.abs(this.DOT_PRODUCT_ROW_COL(simi, j, dx, -1, 1, n));
                        if (temp > ratio) {
                            jdrop = j;
                            ratio = temp;
                        }
                        sigbar[j] = temp * vsig[j];
                    }

                    //     Calculate the value of ell.
                    edgmax = delta * rho;
                    l = 0;
                    for (j = 1; j <= n; ++j) {
                        if (sigbar[j] >= parsig || sigbar[j] >= vsig[j]) {
                            temp = veta[j];
                            if (trured > 0.0) {
                                temp = 0.0;
                                for (k = 1; k <= n; ++k) {
                                    temp += Math.pow(dx[k] - sim[k][j], 2.0);
                                }
                                temp = Math.sqrt(temp);
                            }
                            if (temp > edgmax) {
                                l = j;
                                edgmax = temp;
                            }
                        }
                    }
                    if (l > 0) {
                        jdrop = l;
                    }

                    if (jdrop !== 0) {
                        //     Revise the simplex by updating the elements of SIM, SIMI and DATMAT.
                        temp = 0.0;
                        for (i = 1; i <= n; ++i) {
                            sim[i][jdrop] = dx[i];
                            temp += simi[jdrop][i] * dx[i];
                        }
                        for (k = 1; k <= n; ++k) {
                            simi[jdrop][k] /= temp;
                        }
                        for (j = 1; j <= n; ++j) {
                            if (j !== jdrop) {
                                // temp = this.DOT_PRODUCT(this.PART(this.ROW(simi, j), 1, n), this.PART(dx, 1, n));
                                temp = this.DOT_PRODUCT_ROW_COL(simi, j, dx, -1, 1, n);
                                for (k = 1; k <= n; ++k) {
                                    simi[j][k] -= temp * simi[jdrop][k];
                                }
                            }
                        }
                        for (k = 1; k <= mpp; ++k) {
                            datmat[k][jdrop] = con[k];
                        }

                        //     Branch back for further iterations with the current RHO.
                        if (trured > 0.0 && trured >= 0.1 * prerem) {
                            continue L_140;
                        }
                    }
                    // If we end up here, we drop out.
                } while (!endless);

                if (!iflag) {
                    ibrnch = false;
                    continue L_140;
                }

                if (rho <= rhoend) {
                    status = this.Normal;
                    break L_40;
                }

                //     Otherwise reduce RHO if it is not at its least value and reset PARMU.
                cmin = 0.0;
                cmax = 0.0;
                rho *= 0.5;
                if (rho <= 1.5 * rhoend) {
                    rho = rhoend;
                }
                if (parmu > 0.0) {
                    denom = 0.0;
                    for (k = 1; k <= mp; ++k) {
                        cmin = datmat[k][np];
                        cmax = cmin;
                        for (i = 1; i <= n; ++i) {
                            cmin = Math.min(cmin, datmat[k][i]);
                            cmax = Math.max(cmax, datmat[k][i]);
                        }
                        if (k <= m && cmin < 0.5 * cmax) {
                            temp = Math.max(cmax, 0.0) - cmin;
                            denom = denom <= 0.0 ? temp : Math.min(denom, temp);
                        }
                    }
                    if (denom === 0.0) {
                        parmu = 0.0;
                    } else if (cmax - cmin < parmu * denom) {
                        parmu = (cmax - cmin) / denom;
                    }
                }
                if (iprint >= 2) {
                    console.log("Reduction in RHO to " + rho + "  and PARMU = " + parmu);
                }
                if (iprint === 2) {
                    this.PrintIterationResult(
                        nfvals,
                        datmat[mp][np],
                        datmat[mpp][np],
                        this.COL(sim, np),
                        n,
                        iprint
                    );
                }
            } while (endless);
        } while (endless);

        switch (status) {
            case this.Normal:
                if (iprint >= 1) {
                    console.log("%nNormal return from subroutine COBYLA%n");
                }
                if (ifull) {
                    if (iprint >= 1) {
                        this.PrintIterationResult(nfvals, f, resmax, x, n, iprint);
                    }
                    return status;
                }
                break;
            case this.MaxIterationsReached:
                if (iprint >= 1) {
                    console.log(
                        "%nReturn from subroutine COBYLA because the MAXFUN limit has been reached.%n"
                    );
                }
                break;
            case this.DivergingRoundingErrors:
                if (iprint >= 1) {
                    console.log(
                        "%nReturn from subroutine COBYLA because rounding errors are becoming damaging.%n"
                    );
                }
                break;
        }

        for (k = 1; k <= n; ++k) {
            x[k] = sim[k][np];
        }
        f = datmat[mp][np];
        resmax = datmat[mpp][np];
        if (iprint >= 1) {
            this.PrintIterationResult(nfvals, f, resmax, x, n, iprint);
        }

        return status;
    },

    trstlp: function (n, m, a, b, rho, dx) {
        //(int n, int m, double[][] a, double[] b, double rho, double[] dx)
        // N.B. Arguments Z, ZDOTA, VMULTC, SDIRN, DXNEW, VMULTD & IACT have been removed.

        //     This subroutine calculates an N-component vector DX by applying the
        //     following two stages. In the first stage, DX is set to the shortest
        //     vector that minimizes the greatest violation of the constraints
        //       A(1,K)*DX(1)+A(2,K)*DX(2)+...+A(N,K)*DX(N) .GE. B(K), K = 2,3,...,M,
        //     subject to the Euclidean length of DX being at most RHO. If its length is
        //     strictly less than RHO, then we use the resultant freedom in DX to
        //     minimize the objective function
        //              -A(1,M+1)*DX(1) - A(2,M+1)*DX(2) - ... - A(N,M+1)*DX(N)
        //     subject to no increase in any greatest constraint violation. This
        //     notation allows the gradient of the objective function to be regarded as
        //     the gradient of a constraint. Therefore the two stages are distinguished
        //     by MCON .EQ. M and MCON .GT. M respectively. It is possible that a
        //     degeneracy may prevent DX from attaining the target length RHO. Then the
        //     value IFULL = 0 would be set, but usually IFULL = 1 on return.
        //
        //     In general NACT is the number of constraints in the active set and
        //     IACT(1),...,IACT(NACT) are their indices, while the remainder of IACT
        //     contains a permutation of the remaining constraint indices.  Further, Z
        //     is an orthogonal matrix whose first NACT columns can be regarded as the
        //     result of Gram-Schmidt applied to the active constraint gradients.  For
        //     J = 1,2,...,NACT, the number ZDOTA(J) is the scalar product of the J-th
        //     column of Z with the gradient of the J-th active constraint.  DX is the
        //     current vector of variables and here the residuals of the active
        //     constraints should be zero. Further, the active constraints have
        //     nonnegative Lagrange multipliers that are held at the beginning of
        //     VMULTC. The remainder of this vector holds the residuals of the inactive
        //     constraints at DX, the ordering of the components of VMULTC being in
        //     agreement with the permutation of the indices of the constraints that is
        //     in IACT. All these residuals are nonnegative, which is achieved by the
        //     shift RESMAX that makes the least residual zero.

        //     Initialize Z and some other variables. The value of RESMAX will be
        //     appropriate to DX = 0, while ICON will be the index of a most violated
        //     constraint if RESMAX is positive. Usually during the first stage the
        //     vector SDIRN gives a search direction that reduces all the active
        //     constraint violations by one simultaneously.

        // Local variables

        var temp = 0,
            nactx = 0,
            resold = 0.0,
            z = this.arr2(1 + n, 1 + n),
            zdota = this.arr(2 + m),
            vmultc = this.arr(2 + m),
            sdirn = this.arr(1 + n),
            dxnew = this.arr(1 + n),
            vmultd = this.arr(2 + m),
            iact = this.arr(2 + m),
            mcon = m,
            nact = 0,
            icon, resmax,
            i, k, first, optold, icount,
            step, stpful, optnew, ratio,
            isave, vsave, total,
            kp, kk, sp, alpha, beta, tot, spabs,
            acca, accb, zdotv, zdvabs, kw,
            dd, ss, sd,
            zdotw, zdwabs, kl, sumabs, tempa,
            endless = true;

        for (i = 1; i <= n; ++i) {
            z[i][i] = 1.0;
            dx[i] = 0.0;
        }

        icon = 0;
        resmax = 0.0;
        if (m >= 1) {
            for (k = 1; k <= m; ++k) {
                if (b[k] > resmax) {
                    resmax = b[k];
                    icon = k;
                }
            }
            for (k = 1; k <= m; ++k) {
                iact[k] = k;
                vmultc[k] = resmax - b[k];
            }
        }

        //     End the current stage of the calculation if 3 consecutive iterations
        //     have either failed to reduce the best calculated value of the objective
        //     function or to increase the number of active constraints since the best
        //     value was calculated. This strategy prevents cycling, but there is a
        //     remote possibility that it will cause premature termination.

        first = true;
        do {
            L_60: do {
                if (!first || (first && resmax === 0.0)) {
                    mcon = m + 1;
                    icon = mcon;
                    iact[mcon] = mcon;
                    vmultc[mcon] = 0.0;
                }
                first = false;

                optold = 0.0;
                icount = 0;
                step = 0;
                stpful = 0;

                L_70: do {
                    // optnew = (mcon === m) ? resmax : -this.DOT_PRODUCT(this.PART(dx, 1, n), this.PART(this.COL(a, mcon), 1, n));
                    optnew =
                        mcon === m ? resmax : -this.DOT_PRODUCT_ROW_COL(dx, -1, a, mcon, 1, n);

                    if (icount === 0 || optnew < optold) {
                        optold = optnew;
                        nactx = nact;
                        icount = 3;
                    } else if (nact > nactx) {
                        nactx = nact;
                        icount = 3;
                    } else {
                        --icount;
                    }
                    if (icount === 0) {
                        break L_60;
                    }

                    //     If ICON exceeds NACT, then we add the constraint with index IACT(ICON) to
                    //     the active set. Apply Givens rotations so that the last N-NACT-1 columns
                    //     of Z are orthogonal to the gradient of the new constraint, a scalar
                    //     product being set to zero if its nonzero value could be due to computer
                    //     rounding errors. The array DXNEW is used for working space.
                    ratio = 0;
                    if (icon <= nact) {
                        if (icon < nact) {
                            //     Delete the constraint that has the index IACT(ICON) from the active set.

                            isave = iact[icon];
                            vsave = vmultc[icon];
                            k = icon;
                            do {
                                kp = k + 1;
                                kk = iact[kp];
                                sp = this.DOT_PRODUCT(
                                    this.PART(this.COL(z, k), 1, n),
                                    this.PART(this.COL(a, kk), 1, n)
                                );
                                temp = Mat.hypot(sp, zdota[kp]);
                                alpha = zdota[kp] / temp;
                                beta = sp / temp;
                                zdota[kp] = alpha * zdota[k];
                                zdota[k] = temp;
                                for (i = 1; i <= n; ++i) {
                                    temp = alpha * z[i][kp] + beta * z[i][k];
                                    z[i][kp] = alpha * z[i][k] - beta * z[i][kp];
                                    z[i][k] = temp;
                                }
                                iact[k] = kk;
                                vmultc[k] = vmultc[kp];
                                k = kp;
                            } while (k < nact);

                            iact[k] = isave;
                            vmultc[k] = vsave;
                        }
                        --nact;

                        //     If stage one is in progress, then set SDIRN to the direction of the next
                        //     change to the current vector of variables.
                        if (mcon > m) {
                            //     Pick the next search direction of stage two.
                            temp = 1.0 / zdota[nact];
                            for (k = 1; k <= n; ++k) {
                                sdirn[k] = temp * z[k][nact];
                            }
                        } else {
                            // temp = this.DOT_PRODUCT(this.PART(sdirn, 1, n), this.PART(this.COL(z, nact + 1), 1, n));
                            temp = this.DOT_PRODUCT_ROW_COL(sdirn, -1, z, nact + 1, 1, n);
                            for (k = 1; k <= n; ++k) {
                                sdirn[k] -= temp * z[k][nact + 1];
                            }
                        }
                    } else {
                        kk = iact[icon];
                        for (k = 1; k <= n; ++k) {
                            dxnew[k] = a[k][kk];
                        }
                        tot = 0.0;

                        // {
                        k = n;
                        while (k > nact) {
                            sp = 0.0;
                            spabs = 0.0;
                            for (i = 1; i <= n; ++i) {
                                temp = z[i][k] * dxnew[i];
                                sp += temp;
                                spabs += Math.abs(temp);
                            }
                            acca = spabs + 0.1 * Math.abs(sp);
                            accb = spabs + 0.2 * Math.abs(sp);
                            if (spabs >= acca || acca >= accb) {
                                sp = 0.0;
                            }
                            if (tot === 0.0) {
                                tot = sp;
                            } else {
                                kp = k + 1;
                                temp = Mat.hypot(sp, tot);
                                alpha = sp / temp;
                                beta = tot / temp;
                                tot = temp;
                                for (i = 1; i <= n; ++i) {
                                    temp = alpha * z[i][k] + beta * z[i][kp];
                                    z[i][kp] = alpha * z[i][kp] - beta * z[i][k];
                                    z[i][k] = temp;
                                }
                            }
                            --k;
                        }
                        // }

                        if (tot === 0.0) {
                            //     The next instruction is reached if a deletion has to be made from the
                            //     active set in order to make room for the new active constraint, because
                            //     the new constraint gradient is a linear combination of the gradients of
                            //     the old active constraints.  Set the elements of VMULTD to the multipliers
                            //     of the linear combination.  Further, set IOUT to the index of the
                            //     constraint to be deleted, but branch if no suitable index can be found.

                            ratio = -1.0;
                            //{
                            k = nact;
                            do {
                                zdotv = 0.0;
                                zdvabs = 0.0;

                                for (i = 1; i <= n; ++i) {
                                    temp = z[i][k] * dxnew[i];
                                    zdotv += temp;
                                    zdvabs += Math.abs(temp);
                                }
                                acca = zdvabs + 0.1 * Math.abs(zdotv);
                                accb = zdvabs + 0.2 * Math.abs(zdotv);
                                if (zdvabs < acca && acca < accb) {
                                    temp = zdotv / zdota[k];
                                    if (temp > 0.0 && iact[k] <= m) {
                                        tempa = vmultc[k] / temp;
                                        if (ratio < 0.0 || tempa < ratio) {
                                            ratio = tempa;
                                        }
                                    }

                                    if (k >= 2) {
                                        kw = iact[k];
                                        for (i = 1; i <= n; ++i) {
                                            dxnew[i] -= temp * a[i][kw];
                                        }
                                    }
                                    vmultd[k] = temp;
                                } else {
                                    vmultd[k] = 0.0;
                                }
                            } while (--k > 0);
                            //}
                            if (ratio < 0.0) {
                                break L_60;
                            }

                            //     Revise the Lagrange multipliers and reorder the active constraints so
                            //     that the one to be replaced is at the end of the list. Also calculate the
                            //     new value of ZDOTA(NACT) and branch if it is not acceptable.

                            for (k = 1; k <= nact; ++k) {
                                vmultc[k] = Math.max(0.0, vmultc[k] - ratio * vmultd[k]);
                            }
                            if (icon < nact) {
                                isave = iact[icon];
                                vsave = vmultc[icon];
                                k = icon;
                                do {
                                    kp = k + 1;
                                    kw = iact[kp];
                                    sp = this.DOT_PRODUCT(
                                        this.PART(this.COL(z, k), 1, n),
                                        this.PART(this.COL(a, kw), 1, n)
                                    );
                                    temp = Mat.hypot(sp, zdota[kp]);
                                    alpha = zdota[kp] / temp;
                                    beta = sp / temp;
                                    zdota[kp] = alpha * zdota[k];
                                    zdota[k] = temp;
                                    for (i = 1; i <= n; ++i) {
                                        temp = alpha * z[i][kp] + beta * z[i][k];
                                        z[i][kp] = alpha * z[i][k] - beta * z[i][kp];
                                        z[i][k] = temp;
                                    }
                                    iact[k] = kw;
                                    vmultc[k] = vmultc[kp];
                                    k = kp;
                                } while (k < nact);
                                iact[k] = isave;
                                vmultc[k] = vsave;
                            }
                            temp = this.DOT_PRODUCT(
                                this.PART(this.COL(z, nact), 1, n),
                                this.PART(this.COL(a, kk), 1, n)
                            );
                            if (temp === 0.0) {
                                break L_60;
                            }
                            zdota[nact] = temp;
                            vmultc[icon] = 0.0;
                            vmultc[nact] = ratio;
                        } else {
                            //     Add the new constraint if this can be done without a deletion from the
                            //     active set.

                            ++nact;
                            zdota[nact] = tot;
                            vmultc[icon] = vmultc[nact];
                            vmultc[nact] = 0.0;
                        }

                        //     Update IACT and ensure that the objective function continues to be
                        //     treated as the last active constraint when MCON>M.

                        iact[icon] = iact[nact];
                        iact[nact] = kk;
                        if (mcon > m && kk !== mcon) {
                            k = nact - 1;
                            sp = this.DOT_PRODUCT(
                                this.PART(this.COL(z, k), 1, n),
                                this.PART(this.COL(a, kk), 1, n)
                            );
                            temp = Mat.hypot(sp, zdota[nact]);
                            alpha = zdota[nact] / temp;
                            beta = sp / temp;
                            zdota[nact] = alpha * zdota[k];
                            zdota[k] = temp;
                            for (i = 1; i <= n; ++i) {
                                temp = alpha * z[i][nact] + beta * z[i][k];
                                z[i][nact] = alpha * z[i][k] - beta * z[i][nact];
                                z[i][k] = temp;
                            }
                            iact[nact] = iact[k];
                            iact[k] = kk;
                            temp = vmultc[k];
                            vmultc[k] = vmultc[nact];
                            vmultc[nact] = temp;
                        }

                        //     If stage one is in progress, then set SDIRN to the direction of the next
                        //     change to the current vector of variables.
                        if (mcon > m) {
                            //     Pick the next search direction of stage two.
                            temp = 1.0 / zdota[nact];
                            for (k = 1; k <= n; ++k) {
                                sdirn[k] = temp * z[k][nact];
                            }
                        } else {
                            kk = iact[nact];
                            // temp = (this.DOT_PRODUCT(this.PART(sdirn, 1, n),this.PART(this.COL(a, kk), 1, n)) - 1.0) / zdota[nact];
                            temp =
                                (this.DOT_PRODUCT_ROW_COL(sdirn, -1, a, kk, 1, n) - 1.0) /
                                zdota[nact];
                            for (k = 1; k <= n; ++k) {
                                sdirn[k] -= temp * z[k][nact];
                            }
                        }
                    }

                    //     Calculate the step to the boundary of the trust region or take the step
                    //     that reduces RESMAX to zero. The two statements below that include the
                    //     factor 1.0E-6 prevent some harmless underflows that occurred in a test
                    //     calculation. Further, we skip the step if it could be zero within a
                    //     reasonable tolerance for computer rounding errors.
                    dd = rho * rho;
                    sd = 0.0;
                    ss = 0.0;
                    for (i = 1; i <= n; ++i) {
                        if (Math.abs(dx[i]) >= 1.0e-6 * rho) {
                            dd -= dx[i] * dx[i];
                        }
                        sd += dx[i] * sdirn[i];
                        ss += sdirn[i] * sdirn[i];
                    }
                    if (dd <= 0.0) {
                        break L_60;
                    }
                    temp = Math.sqrt(ss * dd);
                    if (Math.abs(sd) >= 1.0e-6 * temp) {
                        temp = Math.sqrt(ss * dd + sd * sd);
                    }
                    stpful = dd / (temp + sd);
                    step = stpful;
                    if (mcon === m) {
                        acca = step + 0.1 * resmax;
                        accb = step + 0.2 * resmax;
                        if (step >= acca || acca >= accb) {
                            break L_70;
                        }
                        step = Math.min(step, resmax);
                    }

                    //     Set DXNEW to the new variables if STEP is the steplength, and reduce
                    //     RESMAX to the corresponding maximum residual if stage one is being done.
                    //     Because DXNEW will be changed during the calculation of some Lagrange
                    //     multipliers, it will be restored to the following value later.
                    for (k = 1; k <= n; ++k) {
                        dxnew[k] = dx[k] + step * sdirn[k];
                    }
                    if (mcon === m) {
                        resold = resmax;
                        resmax = 0.0;
                        for (k = 1; k <= nact; ++k) {
                            kk = iact[k];
                            // temp = b[kk] - this.DOT_PRODUCT(this.PART(this.COL(a, kk), 1, n), this.PART(dxnew, 1, n));
                            temp = b[kk] - this.DOT_PRODUCT_ROW_COL(dxnew, -1, a, kk, 1, n);
                            resmax = Math.max(resmax, temp);
                        }
                    }

                    //     Set VMULTD to the VMULTC vector that would occur if DX became DXNEW. A
                    //     device is included to force VMULTD(K) = 0.0 if deviations from this value
                    //     can be attributed to computer rounding errors. First calculate the new
                    //     Lagrange multipliers.
                    //{
                    k = nact;
                    do {
                        zdotw = 0.0;
                        zdwabs = 0.0;
                        for (i = 1; i <= n; ++i) {
                            temp = z[i][k] * dxnew[i];
                            zdotw += temp;
                            zdwabs += Math.abs(temp);
                        }
                        acca = zdwabs + 0.1 * Math.abs(zdotw);
                        accb = zdwabs + 0.2 * Math.abs(zdotw);
                        if (zdwabs >= acca || acca >= accb) {
                            zdotw = 0.0;
                        }
                        vmultd[k] = zdotw / zdota[k];
                        if (k >= 2) {
                            kk = iact[k];
                            for (i = 1; i <= n; ++i) {
                                dxnew[i] -= vmultd[k] * a[i][kk];
                            }
                        }
                    } while (k-- >= 2);
                    if (mcon > m) {
                        vmultd[nact] = Math.max(0.0, vmultd[nact]);
                    }
                    //}

                    //     Complete VMULTC by finding the new constraint residuals.

                    for (k = 1; k <= n; ++k) {
                        dxnew[k] = dx[k] + step * sdirn[k];
                    }
                    if (mcon > nact) {
                        kl = nact + 1;
                        for (k = kl; k <= mcon; ++k) {
                            kk = iact[k];
                            total = resmax - b[kk];
                            sumabs = resmax + Math.abs(b[kk]);
                            for (i = 1; i <= n; ++i) {
                                temp = a[i][kk] * dxnew[i];
                                total += temp;
                                sumabs += Math.abs(temp);
                            }
                            acca = sumabs + 0.1 * Math.abs(total);
                            accb = sumabs + 0.2 * Math.abs(total);
                            if (sumabs >= acca || acca >= accb) {
                                total = 0.0;
                            }
                            vmultd[k] = total;
                        }
                    }

                    //     Calculate the fraction of the step from DX to DXNEW that will be taken.

                    ratio = 1.0;
                    icon = 0;
                    for (k = 1; k <= mcon; ++k) {
                        if (vmultd[k] < 0.0) {
                            temp = vmultc[k] / (vmultc[k] - vmultd[k]);
                            if (temp < ratio) {
                                ratio = temp;
                                icon = k;
                            }
                        }
                    }

                    //     Update DX, VMULTC and RESMAX.

                    temp = 1.0 - ratio;
                    for (k = 1; k <= n; ++k) {
                        dx[k] = temp * dx[k] + ratio * dxnew[k];
                    }
                    for (k = 1; k <= mcon; ++k) {
                        vmultc[k] = Math.max(0.0, temp * vmultc[k] + ratio * vmultd[k]);
                    }
                    if (mcon === m) {
                        resmax = resold + ratio * (resmax - resold);
                    }

                    //     If the full step is not acceptable then begin another iteration.
                    //     Otherwise switch to stage two or end the calculation.
                } while (icon > 0);

                if (step === stpful) {
                    return true;
                }
            } while (endless);

            //     We employ any freedom that may be available to reduce the objective
            //     function before returning a DX whose length is less than RHO.
        } while (mcon === m);

        return false;
    },

    PrintIterationResult: function (nfvals, f, resmax, x, n, iprint) {
        if (iprint > 1) {
            console.log("NFVALS = " + nfvals + "  F = " + f + "  MAXCV = " + resmax);
        }
        if (iprint > 1) {
            console.log("X = " + this.PART(x, 1, n));
        }
    },

    ROW: function (src, rowidx) {
        return src[rowidx].slice();
        // var col,
        //     cols = src[0].length,
        //     dest = this.arr(cols);

        // for (col = 0; col < cols; ++col) {
        //     dest[col] = src[rowidx][col];
        // }
        // return dest;
    },

    COL: function (src, colidx) {
        var row,
            rows = src.length,
            dest = []; // this.arr(rows);

        for (row = 0; row < rows; ++row) {
            dest[row] = src[row][colidx];
        }
        return dest;
    },

    PART: function (src, from, to) {
        return src.slice(from, to + 1);
        // var srcidx,
        //     dest = this.arr(to - from + 1),
        //     destidx = 0;
        // for (srcidx = from; srcidx <= to; ++srcidx, ++destidx) {
        //     dest[destidx] = src[srcidx];
        // }
        // return dest;
    },

    FORMAT: function (x) {
        return x.join(",");
        // var i, fmt = "";
        // for (i = 0; i < x.length; ++i) {
        //     fmt += ", " + x[i];
        // }
        // return fmt;
    },

    DOT_PRODUCT: function (lhs, rhs) {
        var i,
            sum = 0.0,
            len = lhs.length;
        for (i = 0; i < len; ++i) {
            sum += lhs[i] * rhs[i];
        }
        return sum;
    },

    DOT_PRODUCT_ROW_COL: function (lhs, row, rhs, col, start, end) {
        var i,
            sum = 0.0;

        if (row === -1) {
            // lhs is vector
            for (i = start; i <= end; ++i) {
                sum += lhs[i] * rhs[i][col];
            }
        } else {
            // lhs is row of matrix
            if (col === -1) {
                // rhs is vector
                for (i = start; i <= end; ++i) {
                    sum += lhs[row][i] * rhs[i];
                }
            } else {
                // rhs is column of matrix
                for (i = start; i <= end; ++i) {
                    sum += lhs[row][i] * rhs[i][col];
                }
            }
        }

        return sum;
    }
};

export default JXG.Math.Nlp;
