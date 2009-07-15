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
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/


/**
 * @fileoverview A class for complex arithmetics JXG.Complex is defined in this
 * file. Also a namespace JXG.C is included to provide instance-independent
 * arithmetic functions.
 * @author graphjs
 */

/**
 * Creates a new complex number.
 * @class This class is for calculating with complex numbers.
 */
JXG.Complex = function(x, y) {
    this.isComplex = true;

    if (typeof x == 'undefined') {
        x = 0;
    }
    if (typeof y == 'undefined') {
        y = 0;
    }

    /* is the first argument a complex number? if it is,
     * extract real and imaginary part. */
    if (x.isComplex) {
        y = x.imaginary;
        x = x.real;
    }

    /**
     * Real part of the complex number.
     * @type number
     */
    this.real = x;

    /**
     * Imaginary part of the complex number.
     * @type number
     */
    this.imaginary = y;

    /**
     * Absolute value in the polar form of the complex number. Currently unused.
     * @type number
     */
    this.absval = 0;

    /**
     * Angle value in the polar form of the complex number. Currently unused.
     * @type number
     */
    this.angle = 0;
};

/**
 * Converts a complex number into a string.
 * @type string
 * @return Formatted string containing the complex number in human readable form (algebraic form).
 */
JXG.Complex.prototype.toString = function() {
    return '' + this.real + ' + ' + this.imaginary + 'i';
};

/**
 * Add another complex number to this complex number.
 * @param {JXG.Complex/number} c A JavaScript number or a JXG.Complex object to
 * add to the current object.
 * @type undefined
 */
JXG.Complex.prototype.add = function(c) {
    if(typeof c == 'number') {
        this.real += c;
    } else {
        this.real += c.real;
        this.imaginary += c.imaginary;
    }
};

/**
 * Subtract another complex number from this complex number.
 * @param {JXG.Complex/number} c A JavaScript number or a JXG.Complex object to
 * subtract from the current object.
 * @type undefined
 */
JXG.Complex.prototype.sub = function(c) {
    if(typeof c == 'number') {
        this.real -= c;
    } else {
        this.real -= c.real;
        this.imaginary -= c.imaginary;
    }
};

/**
 * Multiply another complex number to this complex number.
 * @param {JXG.Complex/number} c A JavaScript number or a JXG.Complex object to
 * multiply with the current object.
 * @type undefined
 */
JXG.Complex.prototype.mult = function(c) {
    if(typeof c == 'number') {
        this.real *= c;
        this.imaginary *= c;
    } else {
        //  (a+ib)(x+iy) = ax-by + i(xb+ay)
        this.real = this.real*c.real - this.imaginary*c.imaginary;
        this.imaginary = this.real*c.imaginary + this.imaginary*c.real;
    }
};


/**
 * Divide this complex number by the given complex number.
 * @param {JXG.Complex/number} c A JavaScript number or a JXG.Complex object to
 * divide the current object by.
 * @type undefined
 */
JXG.Complex.prototype.div = function(c) {
    var denom;

    if(typeof c == 'number') {
        if(Math.abs(c) < Math.eps) {
            this.real = Infinity;
            this.imaginary = Infinity;
            
            return;
        }
        this.real /= c;
        this.imaginary /= c;
    } else {
        //  (a+ib)(x+iy) = ax-by + i(xb+ay)
        if( (Math.abs(c.real) < Math.eps) && (Math.abs(c.imaginary) < Math.eps) ){
            this.real = Infinity;
            this.imaginary = Infinity;

            return;
        }

        denom = c.real*c.real + c.imaginary*c.imaginary;

        this.real = (this.real*c.real + this.imaginary*c.imaginary)/denom;
        this.imaginary = (this.imaginary*c.real - this.real*c.imaginary)/denom;
    }
};


/**
 * JXG.C is the complex number (name)space. It provides functions to calculate with
 * complex numbers (defined above). With this namespace you don't have to modify
 * your existing complex numbers, e.g. to add two complex numbers:
 *
 *    var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    z = JXG.C.add(z1, z1);
 *
 * z1 and z2 here remain unmodified. With the object oriented approach above this
 * section the code would look like:
 *
 *    var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    var z = new JXG.Complex(z1);
 *    z.add(z2);
 */

/**
 * @class Namespace for the complex number arithmetic functions.
 */
JXG.C = {};

/**
 * Add two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex/number} z1 Summand
 * @param {JXG.Complex/number} z2 Summand
 * @type {JXG.Complex}
 * @return A complex number equal to the sum of the given parameters.
 */
JXG.C.add = function(z1, z2) {
    var z = new JXG.Complex(z1);
    z.add(z2);
    return z;
};

/**
 * Subtract two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex/number} z1 Minuend
 * @param {JXG.Complex/number} z2 Subtrahend
 * @type {JXG.Complex}
 * @return A complex number equal to the difference of the given parameters.
 */
JXG.C.sub = function(z1, z2) {
    var z = new JXG.Complex(z1);
    z.sub(z2);
    return z;
};

/**
 * Multiply two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex/number} z1 Factor
 * @param {JXG.Complex/number} z2 Factor
 * @type {JXG.Complex}
 * @return A complex number equal to the product of the given parameters.
 */
JXG.C.mult = function(z1, z2) {
    var z = new JXG.Complex(z1);
    z.mult(z2);
    return z;
};

/**
 * Divide two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param {JXG.Complex/number} z1 Dividend
 * @param {JXG.Complex/number} z2 Divisor
 * @type {JXG.Complex}
 * @return A complex number equal to the quotient of the given parameters.
 */
JXG.C.div = function(z1, z2) {
    var z = new JXG.Complex(z1);
    z.div(z2);
    return z;
};
