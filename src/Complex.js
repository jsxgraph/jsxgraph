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
 * @param [x=0] Real part of the resulting complex number.
 * @param [y=0] Imaginary part of the resulting complex number.
 * @returns An object representing the complex number <tt>x + iy</tt>.
 */
JXG.Complex = function(/** number */ x, /** number */ y) {
	/**
	 * This property is only to signalize that this object is of type JXG.Complex. Only
	 * used internally to distinguish between normal JavaScript numbers and JXG.Complex numbers.
	 * @type boolean
	 * @default true
	 * @private
	 */
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
     * @default 0
     */
    this.real = x;

    /**
     * Imaginary part of the complex number.
     * @type number
     * @default 0
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
 * @return Formatted string containing the complex number in human readable form (algebraic form).
 */
JXG.Complex.prototype.toString = function() /** string */{
    return '' + this.real + ' + ' + this.imaginary + 'i';
};

/**
 * Add another complex number to this complex number.
 * @param c A JavaScript number or a JXG.Complex object to be added to the current object.
 */
JXG.Complex.prototype.add = function(/** JXG.Complex,number */ c) /** undefined */ {
    if(typeof c == 'number') {
        this.real += c;
    } else {
        this.real += c.real;
        this.imaginary += c.imaginary;
    }
};

/**
 * Subtract another complex number from this complex number.
 * @param c A JavaScript number or a JXG.Complex object to subtract from the current object.
 */
JXG.Complex.prototype.sub = function(/** JXG.Complex,number */ c) /** undefined */{
    if(typeof c == 'number') {
        this.real -= c;
    } else {
        this.real -= c.real;
        this.imaginary -= c.imaginary;
    }
};

/**
 * Multiply another complex number to this complex number.
 * @param c A JavaScript number or a JXG.Complex object to
 * multiply with the current object.
 */
JXG.Complex.prototype.mult = function(/** JXG.Complex,number */ c) /** undefined */{
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
 * @param c A JavaScript number or a JXG.Complex object to
 * divide the current object by.
 */
JXG.Complex.prototype.div = function(/** JXG.Complex,number */ c) /** undefined */{
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
 * @description
 * JXG.C is the complex number (name)space. It provides functions to calculate with
 * complex numbers (defined in {@link JXG.Complex}). With this namespace you don't have to modify
 * your existing complex numbers, e.g. to add two complex numbers:
 * <pre class="code">   var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    z = JXG.C.add(z1, z1);</pre>
 * z1 and z2 here remain unmodified. With the object oriented approach above this
 * section the code would look like:
 * <pre class="code">   var z1 = new JXG.Complex(1, 0);
 *    var z2 = new JXG.Complex(0, 1);
 *    var z = new JXG.Complex(z1);
 *    z.add(z2);</pre>
 * @namespace Namespace for the complex number arithmetic functions.
 */
JXG.C = {};

/**
 * Add two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param z1 Summand
 * @param z2 Summand
 * @return A complex number equal to the sum of the given parameters.
 */
JXG.C.add = function(/** JXG.Complex,number */ z1, /** JXG.Complex,number */ z2) /** JXG.Complex */{
    var z = new JXG.Complex(z1);
    z.add(z2);
    return z;
};

/**
 * Subtract two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param z1 Minuend
 * @param z2 Subtrahend
 * @return A complex number equal to the difference of the given parameters.
 */
JXG.C.sub = function(/** JXG.Complex,number */ z1, /** JXG.Complex,number */ z2) /** JXG.Complex */{
    var z = new JXG.Complex(z1);
    z.sub(z2);
    return z;
};

/**
 * Multiply two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param z1 Factor
 * @param z2 Factor
 * @return A complex number equal to the product of the given parameters.
 */
JXG.C.mult = function(/** JXG.Complex,number */ z1, /** JXG.Complex,number */ z2) /** JXG.Complex */{
    var z = new JXG.Complex(z1);
    z.mult(z2);
    return z;
};

/**
 * Divide two (complex) numbers z1 and z2 and return the result as a (complex) number.
 * @param z1 Dividend
 * @param z2 Divisor
 * @return A complex number equal to the quotient of the given parameters.
 */
JXG.C.div = function(/** JXG.Complex,number */ z1, /** JXG.Complex,number */ z2) /** JXG.Complex */{
    var z = new JXG.Complex(z1);
    z.div(z2);
    return z;
};
