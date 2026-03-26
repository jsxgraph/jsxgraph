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

describe("Test JXG.Complex", function () {
    beforeEach(function () {
        jasmine.addCustomEqualityTester(function floatEquality(a, b) {
            if (a === +a && b === +b && (a !== (a | 0) || b !== (b | 0))) {
                // if float
                return Math.abs(a - b) < 5e-10;
            }
        });
    });

    // ---------------------------------------------------------------
    // 1. Constructor
    // ---------------------------------------------------------------
    it("Constructor: default (no arguments)", function () {
        var z = new JXG.Complex();
        expect(z.real).toEqual(0);
        expect(z.imaginary).toEqual(0);
        expect(z.isComplex).toEqual(true);
    });

    it("Constructor: two arguments", function () {
        var z = new JXG.Complex(3, 4);
        expect(z.real).toEqual(3);
        expect(z.imaginary).toEqual(4);
    });

    it("Constructor: single real argument", function () {
        var z = new JXG.Complex(5);
        expect(z.real).toEqual(5);
        expect(z.imaginary).toEqual(0);
    });

    it("Constructor: copy from existing complex number", function () {
        var z1 = new JXG.Complex(7, -3),
            z2 = new JXG.Complex(z1);
        expect(z2.real).toEqual(7);
        expect(z2.imaginary).toEqual(-3);
        // Ensure it is an independent copy
        z1.real = 99;
        expect(z2.real).toEqual(7);
    });

    // ---------------------------------------------------------------
    // 2. toString()
    // ---------------------------------------------------------------
    it("toString", function () {
        expect(new JXG.Complex(3, 4).toString()).toEqual("3 + 4i");
        expect(new JXG.Complex(0, 0).toString()).toEqual("0 + 0i");
        // Negative imaginary: always uses " + " separator
        expect(new JXG.Complex(3, -4).toString()).toEqual("3 + -4i");
    });

    // ---------------------------------------------------------------
    // 3. add(c)
    // ---------------------------------------------------------------
    it("add: real number", function () {
        var z = new JXG.Complex(1, 2);
        z.add(3);
        expect(z.real).toEqual(4);
        expect(z.imaginary).toEqual(2);
    });

    it("add: complex number", function () {
        var z = new JXG.Complex(1, 2);
        z.add(new JXG.Complex(3, 4));
        expect(z.real).toEqual(4);
        expect(z.imaginary).toEqual(6);
    });

    it("add: negative inputs", function () {
        var z = new JXG.Complex(-1, 2);
        z.add(new JXG.Complex(-3, -4));
        expect(z.real).toEqual(-4);
        expect(z.imaginary).toEqual(-2);
    });

    it("add: returns this (chaining)", function () {
        var z = new JXG.Complex(1, 2),
            ret = z.add(1);
        expect(ret).toBe(z);
    });

    // ---------------------------------------------------------------
    // 4. sub(c)
    // ---------------------------------------------------------------
    it("sub: real number", function () {
        var z = new JXG.Complex(5, 3);
        z.sub(2);
        expect(z.real).toEqual(3);
        expect(z.imaginary).toEqual(3);
    });

    it("sub: complex number", function () {
        var z = new JXG.Complex(5, 3);
        z.sub(new JXG.Complex(1, 4));
        expect(z.real).toEqual(4);
        expect(z.imaginary).toEqual(-1);
    });

    it("sub: returns this (chaining)", function () {
        var z = new JXG.Complex(1, 2),
            ret = z.sub(1);
        expect(ret).toBe(z);
    });

    // ---------------------------------------------------------------
    // 5. mult(c)
    // ---------------------------------------------------------------
    it("mult: real number", function () {
        var z = new JXG.Complex(2, 3);
        z.mult(2);
        expect(z.real).toEqual(4);
        expect(z.imaginary).toEqual(6);
    });

    it("mult: complex number", function () {
        // (1+2i)*(3+4i) = (3-8) + (4+6)i = -5+10i
        var z = new JXG.Complex(1, 2);
        z.mult(new JXG.Complex(3, 4));
        expect(z.real).toEqual(-5);
        expect(z.imaginary).toEqual(10);
    });

    it("mult: returns this (chaining)", function () {
        var z = new JXG.Complex(1, 2),
            ret = z.mult(2);
        expect(ret).toBe(z);
    });

    // ---------------------------------------------------------------
    // 6. div(c)
    // ---------------------------------------------------------------
    it("div: real number", function () {
        var z = new JXG.Complex(4, 6);
        z.div(2);
        expect(z.real).toEqual(2);
        expect(z.imaginary).toEqual(3);
    });

    it("div: complex number", function () {
        // (1+2i)/(3+4i) = (1*3+2*4)/(9+16) + (2*3-1*4)/(9+16) i
        //               = 11/25 + 2/25 i
        var z = new JXG.Complex(1, 2);
        z.div(new JXG.Complex(3, 4));
        expect(z.real).toBeCloseTo(11 / 25, 15);
        expect(z.imaginary).toBeCloseTo(2 / 25, 15);
    });

    it("div: by zero (real)", function () {
        var z = new JXG.Complex(1, 2);
        z.div(0);
        // Use toBe to bypass the custom floatEquality tester
        expect(z.real).toBe(Infinity);
        expect(z.imaginary).toBe(Infinity);
    });

    it("div: by zero (complex 0+0i)", function () {
        var z = new JXG.Complex(1, 2);
        z.div(new JXG.Complex(0, 0));
        expect(z.real).toBe(Infinity);
        expect(z.imaginary).toBe(Infinity);
    });

    it("div: returns this (chaining)", function () {
        var z = new JXG.Complex(4, 6),
            ret = z.div(2);
        expect(ret).toBe(z);
    });

    // ---------------------------------------------------------------
    // 7. conj()
    // ---------------------------------------------------------------
    it("conj: positive imaginary", function () {
        var z = new JXG.Complex(3, 4);
        z.conj();
        expect(z.real).toEqual(3);
        expect(z.imaginary).toEqual(-4);
    });

    it("conj: negative imaginary", function () {
        var z = new JXG.Complex(3, -4);
        z.conj();
        expect(z.real).toEqual(3);
        expect(z.imaginary).toEqual(4);
    });

    it("conj: returns this (chaining)", function () {
        var z = new JXG.Complex(1, 2),
            ret = z.conj();
        expect(ret).toBe(z);
    });

    // ---------------------------------------------------------------
    // 8. abs()
    // ---------------------------------------------------------------
    it("abs: 3+4i", function () {
        expect(new JXG.Complex(3, 4).abs()).toEqual(5);
    });

    it("abs: 0+0i", function () {
        expect(new JXG.Complex(0, 0).abs()).toEqual(0);
    });

    it("abs: negative components", function () {
        expect(new JXG.Complex(-3, -4).abs()).toEqual(5);
    });

    // ---------------------------------------------------------------
    // 9. angle()
    // ---------------------------------------------------------------
    it("angle: 1+0i", function () {
        expect(new JXG.Complex(1, 0).angle()).toEqual(0);
    });

    it("angle: 0+1i", function () {
        expect(new JXG.Complex(0, 1).angle()).toBeCloseTo(Math.PI / 2, 15);
    });

    it("angle: -1+0i", function () {
        expect(new JXG.Complex(-1, 0).angle()).toBeCloseTo(Math.PI, 15);
    });

    it("angle: 0-1i (fourth quadrant)", function () {
        expect(new JXG.Complex(0, -1).angle()).toBeCloseTo(-Math.PI / 2, 15);
    });

    // ---------------------------------------------------------------
    // 10. Namespace JXG.C (immutable versions)
    // ---------------------------------------------------------------
    it("JXG.C.add: returns new complex, originals unmodified", function () {
        var z1 = new JXG.Complex(1, 2),
            z2 = new JXG.Complex(3, 4),
            result = JXG.C.add(z1, z2);
        expect(result.real).toEqual(4);
        expect(result.imaginary).toEqual(6);
        // originals unmodified
        expect(z1.real).toEqual(1);
        expect(z1.imaginary).toEqual(2);
    });

    it("JXG.C.sub: returns new complex, originals unmodified", function () {
        var z1 = new JXG.Complex(5, 3),
            z2 = new JXG.Complex(1, 4),
            result = JXG.C.sub(z1, z2);
        expect(result.real).toEqual(4);
        expect(result.imaginary).toEqual(-1);
        expect(z1.real).toEqual(5);
        expect(z1.imaginary).toEqual(3);
    });

    it("JXG.C.mult: returns new complex, originals unmodified", function () {
        var z1 = new JXG.Complex(1, 2),
            z2 = new JXG.Complex(3, 4),
            result = JXG.C.mult(z1, z2);
        expect(result.real).toEqual(-5);
        expect(result.imaginary).toEqual(10);
        expect(z1.real).toEqual(1);
        expect(z1.imaginary).toEqual(2);
    });

    it("JXG.C.div: returns new complex, originals unmodified", function () {
        var z1 = new JXG.Complex(1, 2),
            z2 = new JXG.Complex(3, 4),
            result = JXG.C.div(z1, z2);
        expect(result.real).toBeCloseTo(11 / 25, 15);
        expect(result.imaginary).toBeCloseTo(2 / 25, 15);
        expect(z1.real).toEqual(1);
        expect(z1.imaginary).toEqual(2);
    });

    it("JXG.C.conj: returns new complex, original unmodified", function () {
        var z1 = new JXG.Complex(3, 4),
            result = JXG.C.conj(z1);
        expect(result.real).toEqual(3);
        expect(result.imaginary).toEqual(-4);
        expect(z1.imaginary).toEqual(4);
    });

    it("JXG.C.abs: returns number", function () {
        expect(JXG.C.abs(new JXG.Complex(3, 4))).toEqual(5);
    });

    it("JXG.C.angle: returns number", function () {
        expect(JXG.C.angle(new JXG.Complex(0, 1))).toBeCloseTo(Math.PI / 2, 15);
    });

    it("JXG.C.add: with plain number argument", function () {
        var z1 = new JXG.Complex(1, 2),
            result = JXG.C.add(z1, 3);
        expect(result.real).toEqual(4);
        expect(result.imaginary).toEqual(2);
        expect(z1.real).toEqual(1);
    });

    it("JXG.C.copy: from plain number", function () {
        var z = JXG.C.copy(5);
        expect(z.real).toEqual(5);
        expect(z.imaginary).toEqual(0);
        expect(z.isComplex).toEqual(true);
    });

    it("JXG.C.copy: returns independent copy", function () {
        var z1 = new JXG.Complex(7, -3),
            z2 = JXG.C.copy(z1);
        expect(z2.real).toEqual(7);
        expect(z2.imaginary).toEqual(-3);
        expect(z2.isComplex).toEqual(true);
        // Mutating original does not affect copy
        z1.real = 99;
        expect(z2.real).toEqual(7);
    });
});
