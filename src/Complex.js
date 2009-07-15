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
     * Absolute value in the polar form of the complex number.
     * @type number
     */
    this.absval = 0;

    /**
     * Angle value in the polar form of the complex number.
     * @type number
     */
    this.angle = 0;
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

