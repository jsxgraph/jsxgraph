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

/**
 * @fileoverview A class for complex arithmetics JXG.Complex is defined in this
 * file. Also a namespace JXG.C is included to provide instance-independent
 * arithmetic functions.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * Creates a new complex number. See also {@link JXG.C}.
 * @class This class is for calculating with complex numbers, see also {@link JXG.C} for more methods.
 * @constructor
 * @param {Number} [x=0] Real part.
 * @param {Number} [y=0] Imaginary part.
 * @see JXG.C
 */
JXG.Complex = function (x, y) {
    /**
     * This property is only to signalize that this object is of type JXG.Complex. Only
     * used internally to distinguish between normal JavaScript numbers and JXG.Complex numbers.
     * @type Boolean
     * @default true
     * @private
     */
    this.isComplex = true;

    /* is the first argument a complex number? if it is,
     * extract real and imaginary part. */
    if (x && x.isComplex) {
        y = x.imaginary;
        x = x.real;
    }

    /**
     * Real part of the complex number.
     * @type Number
     * @default 0
     */
    this.real = x || 0;

    /**
     * Imaginary part of the complex number.
     * @type Number
     * @default 0
     */
    this.imaginary = y || 0;

    // /**
    //  * Absolute value in the polar form of the complex number. Currently unused.
    //  * @type Number
    //  */
    // this.absval = 0;

    // /**
    //  * Angle value in the polar form of the complex number. Currently unused.
    //  * @type Number
    //  */
    // this.angle = 0;
};

JXG.extend(
    JXG.Complex.prototype,
    /** @lends JXG.Complex.prototype */ {
        /**
         * Converts a complex number into a string.
         * @returns {String} Formatted string containing the complex number in human readable form (algebraic form).
         */
        toString: function () {
            return this.real + " + " + this.imaginary + 'i';
        },

        /**
         * Add another complex number to this complex number.
         * @param {JXG.Complex|Number} c A JavaScript number or a JXG.Complex object to be added to the current object.
         * @returns {JXG.Complex} Reference to this complex number
         */
        add: function (c) {
            if (Type.isNumber(c)) {
                this.real += c;
            } else {
                this.real += c.real;
                this.imaginary += c.imaginary;
            }

            return this;
        },

        /**
         * Subtract another complex number from this complex number.
         * @param {JXG.Complex|Number} c A JavaScript number or a JXG.Complex object to subtract from the current object.
         * @returns {JXG.Complex} Reference to this complex number
         */
        sub: function (c) {
            if (Type.isNumber(c)) {
                this.real -= c;
            } else {
                this.real -= c.real;
                this.imaginary -= c.imaginary;
            }

            return this;
        },

        /**
         * Multiply another complex number to this complex number.
         * @param {JXG.Complex|Number} c A JavaScript number or a JXG.Complex object to
         * multiply with the current object.
         * @returns {JXG.Complex} Reference to this complex number
         */
        mult: function (c) {
            var re, im;

            if (Type.isNumber(c)) {
                this.real *= c;
                this.imaginary *= c;
            } else {
                re = this.real;
                im = this.imaginary;

                //  (a+ib)(x+iy) = ax-by + i(xb+ay)
                this.real = re * c.real - im * c.imaginary;
                this.imaginary = re * c.imaginary + im * c.real;
            }

            return this;
        },

        /**
         * Divide this complex number by the given complex number.
         * @param {JXG.Complex|Number} c A JavaScript number or a JXG.Complex object to
         * divide the current object by.
         * @returns {JXG.Complex} Reference to this complex number
         */
        div: function (c) {
            var denom, im, re;

            if (Type.isNumber(c)) {
                if (Math.abs(c) < Math.eps) {
                    this.real = Infinity;
                    this.imaginary = Infinity;

                    return this;
                }

                this.real /= c;
                this.imaginary /= c;
            } else {
                //  (a+ib)(x+iy) = ax-by + i(xb+ay)
                if (Math.abs(c.real) < Math.eps && Math.abs(c.imaginary) < Math.eps) {
                    this.real = Infinity;
                    this.imaginary = Infinity;

                    return this;
                }

                denom = c.real * c.real + c.imaginary * c.imaginary;

                re = this.real;
                im = this.imaginary;
                this.real = (re * c.real + im * c.imaginary) / denom;
                this.imaginary = (im * c.real - re * c.imaginary) / denom;
            }

            return this;
        },

        /**
         * Conjugate a complex number in place.
         * @returns {JXG.Complex} Reference to this complex number
         */
        conj: function () {
            this.imaginary *= -1;

            return this;
        },

        /**
         * Absolute value in the polar form, i.e. |z| of the complex number z.
         * @returns Number
         */
        abs: function() {
            var x = this.real,
                y = this.imaginary;
            return Math.sqrt(x * x + y * y);
        },

        /**
         * Angle value in the polar form of the complex number (in radians).
         * @returns Number
         */
        angle: function() {
            return Math.atan2(this.imaginary, this.real);
        }

    }
);

/**
 * @namespace Namespace for the complex number arithmetic functions, see also {@link JXG.Complex}.
 * @description
 * JXG.C is the complex number (name)space. It provides functions to calculate with
 * complex numbers (defined in {@link JXG.Complex}). With this namespace you don't have to modify
 * your existing complex numbers, e.g. to add two complex numbers:
 * <pre class="code">   var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    z = JXG.C.add(z1, z1);</pre>
 * z1 and z2 here remain unmodified. With the object oriented approach above this
 * section the code would look like:
 * <pre class="code">
 *    var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    var z = new JXG.Complex(z1);
 *    z.add(z2);</pre>
 * @see JXG.Complex
 */
JXG.C = {};

/**
 * Add two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex|Number} z1 Summand
 * @param {JXG.Complex|Number} z2 Summand
 * @returns {JXG.Complex} A complex number equal to the sum of the given parameters.
 */
JXG.C.add = function (z1, z2) {
    var z = new JXG.Complex(z1);
    z.add(z2);
    return z;
};

/**
 * Subtract two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex|Number} z1 Minuend
 * @param {JXG.Complex|Number} z2 Subtrahend
 * @returns {JXG.Complex} A complex number equal to the difference of the given parameters.
 */
JXG.C.sub = function (z1, z2) {
    var z = new JXG.Complex(z1);
    z.sub(z2);
    return z;
};

/**
 * Multiply two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex|Number} z1 Factor
 * @param {JXG.Complex|Number} z2 Factor
 * @returns {JXG.Complex} A complex number equal to the product of the given parameters.
 */
JXG.C.mult = function (z1, z2) {
    var z = new JXG.Complex(z1);
    z.mult(z2);
    return z;
};

/**
 * Divide two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex|Number} z1 Dividend
 * @param {JXG.Complex|Number} z2 Divisor
 * @returns {JXG.Complex} A complex number equal to the quotient of the given parameters.
 */
JXG.C.div = function (z1, z2) {
    var z = new JXG.Complex(z1);
    z.div(z2);
    return z;
};

/**
 * Conjugate a complex number and return the result.
 * @param {JXG.Complex|Number} z1 Complex number
 * @returns {JXG.Complex} A complex number equal to the conjugate of the given parameter.
 */
JXG.C.conj = function (z1) {
    var z = new JXG.Complex(z1);
    z.conj();
    return z;
};

/**
 * Absolute value of a complex number.
 * @param {JXG.Complex|Number} z1 Complex number
 * @returns {Number} real number equal to the absolute value of the given parameter.
 */
JXG.C.abs = function (z1) {
    var z = new JXG.Complex(z1);
    // z.conj();
    // z.mult(z1);
    // return Math.sqrt(z.real);
    return z.abs();
};

/**
 * Angle of a complex number (in radians).
 * @param {JXG.Complex|Number} z1 Complex number
 * @returns {Number} real number equal to the angle value of the given parameter.
 */
JXG.C.angle = function (z1) {
    var z = new JXG.Complex(z1);
    return z.angle();
};

/**
 * Create copy of complex number.
 *
 * @param {JXG.Complex|Number} z
 * @returns {JXG.Complex}
 */
JXG.C.copy = function(z) {
    return new JXG.Complex(z);
};

JXG.Complex.C = JXG.C;

export default JXG.Complex;
