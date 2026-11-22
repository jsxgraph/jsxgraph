/*
    Copyright 2005-2026
        Matthias Ehmann,
        Carsten Miller,
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
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/
/*eslint no-loss-of-precision: off */

/**
 * @fileoverview In this file the namespace JXG.Math.FFT is defined, which holds numerical
 * algorithms for discrete fast Fourier transform..
 */
import Mat from "./math.js";

/**
 * The JXG.Math.FFT namespace. Contains the discrete fast Fourier transformation and some helper routines.
 * @name JXG.Math.FFT
 * @exports Mat.FFT as JXG.Math.FFT
 * @namespace
 */
Mat.FFT = {

    /**
     * Danielson-Lanczos algorithm for fast Fourier transform, transcribed from Numerical Recipes in C (3rd ed, 2007).
     * The algorithm performs the FFT inplace of the input array.
     *
     * @param {Float64Array} data Data array of length 2 * 2**n containing subsequently real and imaginary
     * parts of the input array.
     * @param {number} [isign=1] If -1, the inverse FFT is performed
     * @memberof JXG.Math.FFT
     * @see JXG.Math.FFT.fft
     */
    fft_flat: function (data, isign) {
        var i, j, istep,
            nn = data.length,
            n, mmax, m,
            tmp, tmpr, tmpi,
            theta, wtemp, wpr, wpi, wr, wi;

        isign = isign || 1;

        if (n < 2 || n & (n - 1)) {
            JXG.warn("fft: n must be power of two.");
            return false;
        }

        n = nn >> 1; // nn = 2 * n

        j = 1;
        // Bit reversal
        for (i = 1; i < nn; i += 2) {
            // console.log(i, j, m)
            if (j > i) {
                // console.log("swap", i, rev)
                tmp = data[j - 1]; data[j - 1] = data[i - 1]; data[i - 1] = tmp;
                tmp = data[j]; data[j] = data[i]; data[i] = tmp;
            }
            m = n;
            while (m >= 2 && j > m) {
                j -= m;
                m >>= 1;
            }
            j += m;
        }

        mmax = 2;
        while (nn > mmax) {
            istep = mmax << 1;
            theta = isign * (6.28318530717959 / mmax);
            wtemp = Math.sin(0.5 * theta);
            wpr = -2.0 * wtemp * wtemp;
            wpi = Math.sin(theta);
            wr = 1.0;
            wi = 0.0;

            for (m = 1; m < mmax; m += 2) {
                for (i = m; i <= nn; i += istep) {
                    j = i + mmax;
                    // console.log('i,j', i, j)
                    tmpr = wr * data[j - 1] - wi * data[j];
                    tmpi = wr * data[j] + wi * data[j - 1];

                    data[j - 1] = data[i - 1] - tmpr;
                    data[j] = data[i] - tmpi;

                    data[i - 1] += tmpr;
                    data[i] += tmpi;
                }
                wr = (wtemp = wr) * wpr - wi * wpi + wr;
                wi = wi * wpr + wtemp * wpi + wi;
            }
            mmax = istep;
        }
    },

    /**
     * Wrapper function for {@link JXG.Math.FFT.fft_flat}. Length of input data for `fft_flat` must be a power of two
     * (larger than 1).
     * Prepares input data array as flat `Float64Array` for {@link JXG.Math.FFT.fft_flat}.
     *
     * The inverse FFT can be computed with `JXG.FFT.fft(data, -1)`.
     *
     * @param {Array} signal Input data array. Length must be power of two (larger than 1). May contain floating point numbers or entries of type {@link JXG.Complex}.
     * @param {number} [isign=1] If -1 the inverse FFT is performed
     * @returns {Array} array with entries of type {@link JXG.Complex}
     * @memberof JXG.Math.FFT
     * @see JXG.Math.FFT.fft_flat
     *
     * @example
     *         var s1 = board.create('htmlslider', [[50, -4], [0, 8, 32]], {
     *             name: 'threshold',
     *             withLabel: true
     *         });
     *         var s2 = board.create('htmlslider', [[50, -3], [0, 0.2, 2]], {
     *             name: 'noise',
     *             withLabel: true
     *         });
     *
     *         s1.setMax(40);
     *         s1.setValue(10);
     *
     *         var i, len,
     *             w = [],
     *             x = [],
     *             t = [],
     *             z = [],
     *             y;
     *
     *         // ------------------------------------------------------------------------
     *         // Signal data
     *
     *         len = 128;
     *         // Time
     *         for (i = 0; i < len; i++) {
     *             t.push(i);
     *         }
     *
     *         const c1 = board.create('curve', [t, x]);
     *         c1.updateDataArray = function () {
     *             var i;
     *
     *             x = []; // Fill the global array x with noisy data
     *
     *             for (i = 0; i < len; i++) {
     *                 x.push(
     *                     Math.cos(3 * Math.PI * i / len)
     *                     + 0.2 * Math.sin(15 * Math.PI * i / len + Math.PI * 0.5)
     *                     + (Math.random() - 0.5) * s2.Value()
     *                     + 0
     *                 );
     *             }
     *             this.dataY = x.slice();
     *         };
     *         board.update();
     *
     *         // ------------------------------------------------------------------------
     *         // DFT
     *
     *         const factor = 10;
     *         const c2 = board.create('curve', [t, z], { strokeColor: 'red', strokeWidth: 3 });
     *         c2.updateDataArray = function () {
     *             var i, len;
     *
     *             y = JXG.Math.FFT.fft(x);
     *
     *             len = y.length;
     *             z = [];
     *             for (i = 0; i < len; i++) {
     *                 z.push(factor * y[i].abs() / len);
     *             }
     *             // console.log(z)
     *             this.dataY = z.slice();
     *         };
     *
     *         // ------------------------------------------------------------------------
     *         // Filtered signal data
     *
     *         const c3 = board.create('curve', [t, w], { strokeColor: 'black', strokeWidth: 2 });
     *         c3.updateDataArray = function () {
     *             var i, len;
     *
     *             // Apply filter
     *             len = y.length;
     *             for (i = 0; i < len; i++) {
     *                 if (y[i].abs() < s1.Value()) {
     *                     y[i].real = 0.0;
     *                     y[i].imaginary = 0;
     *                 } else {
     *                     y[i].real /= len;
     *                     y[i].imaginary /= len;
     *                 }
     *             }
     *
     *             // Inverse FFT
     *             w = JXG.Math.FFT.fft(y, -1);
     *             for (i = 0; i < len; i++) {
     *                 w[i] = w[i].real - 0.75;
     *             }
     *             this.dataY = w.slice();
     *         }
     *
     * </pre><div id="JXGdda98a93-ec39-498b-bec2-c03ca02c18ba" class="jxgbox" style="width: 500px; height: 500px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGdda98a93-ec39-498b-bec2-c03ca02c18ba',
     *             {boundingbox: [-15, 5, 180, -5], axis: true, showcopyright: false, shownavigation: false});
     *             var s1 = board.create('htmlslider', [[50, -4], [0, 8, 32]], {
     *                 name: 'threshold',
     *                 withLabel: true
     *             });
     *             var s2 = board.create('htmlslider', [[50, -3], [0, 0.2, 2]], {
     *                 name: 'noise',
     *                 withLabel: true
     *             });
     *
     *             s1.setMax(40);
     *             s1.setValue(10);
     *
     *             var i, len,
     *                 w = [],
     *                 x = [],
     *                 t = [],
     *                 z = [],
     *                 y;
     *
     *             // ------------------------------------------------------------------------
     *             // Signal data
     *
     *             len = 128;
     *             // Time
     *             for (i = 0; i < len; i++) {
     *                 t.push(i);
     *             }
     *
     *             const c1 = board.create('curve', [t, x]);
     *             c1.updateDataArray = function () {
     *                 var i;
     *
     *                 x = []; // Fill the global array x with noisy data
     *
     *                 for (i = 0; i < len; i++) {
     *                     x.push(
     *                         Math.cos(3 * Math.PI * i / len)
     *                         + 0.2 * Math.sin(15 * Math.PI * i / len + Math.PI * 0.5)
     *                         + (Math.random() - 0.5) * s2.Value()
     *                         + 0
     *                     );
     *                 }
     *                 this.dataY = x.slice();
     *             };
     *             board.update();
     *
     *             // ------------------------------------------------------------------------
     *             // DFT
     *
     *             const factor = 10;
     *             const c2 = board.create('curve', [t, z], { strokeColor: 'red', strokeWidth: 3 });
     *             c2.updateDataArray = function () {
     *                 var i, len;
     *
     *                 y = JXG.Math.FFT.fft(x);
     *                 len = y.length;
     *
     *                 z = [];
     *                 for (i = 0; i < len; i++) {
     *                     z.push(factor * y[i].abs() / len);
     *                 }
     *                 // console.log(z)
     *                 this.dataY = z.slice();
     *             };
     *
     *             // ------------------------------------------------------------------------
     *             // Filtered signal data
     *
     *             const c3 = board.create('curve', [t, w], { strokeColor: 'black', strokeWidth: 2 });
     *             c3.updateDataArray = function () {
     *                 var i, len;
     *
     *                 // Apply filter
     *                 len = y.length;
     *                 for (i = 0; i < len; i++) {
     *                     if (y[i].abs() < s1.Value()) {
     *                         y[i].real = 0.0;
     *                         y[i].imaginary = 0;
     *                     } else {
     *                         y[i].real /= len;
     *                         y[i].imaginary /= len;
     *                     }
     *                 }
     *
     *                 // Inverse FFT
     *                 w = JXG.Math.FFT.fft(y, -1);
     *                 for (i = 0; i < len; i++) {
     *                     w[i] = w[i].real - 0.75;
     *                 }
     *                 this.dataY = w.slice();
     *             }
     *     })();
     *
     * </script><pre>
     *
     */
    fft: function (signal, isign) {
        var i, len, len2,
            signal_c,
            signal_res;

        isign = isign || 1;

        len = signal.length;
        if (len === 1) {
            return signal;
        }

        len2 = len << 1;
        signal_c = new Float64Array(len2);
        for (i = 0; i < len; i++) {
            if (signal[i] instanceof JXG.Complex) {
                signal_c[2 * i] = signal[i].real;
                signal_c[2 * i + 1] = signal[i].imaginary;
            } else {
                // signal_c[i] = new JXG.Complex(signal[i], 0);
                signal_c[2 * i] = signal[i];
                signal_c[2 * i + 1] = 0;
            }
        }

        // console.time('fft')
        this.fft_flat(signal_c, isign);
        // console.timeEnd('fft')

        signal_res = new Array(len);
        for (i = 0; i < len; i++) {
            signal_res[i] = new JXG.Complex(signal_c[2 * i], signal_c[2 * i + 1]);
        }
        return signal_res;
    }
};

export default Mat.FFT;
