/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
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

import JXG from "../jxg.js";
import Mat from "./math.js";
import Type from "../utils/type.js";

JXG.Math.DoubleBits = function () {
    var DOUBLE_VIEW = new Float64Array(1),
        UINT_VIEW = new Uint32Array(DOUBLE_VIEW.buffer),
        doubleBitsLE,
        toDoubleLE,
        lowUintLE,
        highUintLE,
        // doubleBits,
        // toDouble,
        // lowUint,
        // highUint,
        // hasTypedArrays = false,
        doubleBitsBE,
        toDoubleBE,
        lowUintBE,
        highUintBE;

    if (Float64Array !== undefined) {
        DOUBLE_VIEW[0] = 1.0;
        // hasTypedArrays = true;
        if (UINT_VIEW[1] === 0x3ff00000) {
            // Use little endian
            doubleBitsLE = function (n) {
                DOUBLE_VIEW[0] = n;
                return [UINT_VIEW[0], UINT_VIEW[1]];
            };
            toDoubleLE = function (lo, hi) {
                UINT_VIEW[0] = lo;
                UINT_VIEW[1] = hi;
                return DOUBLE_VIEW[0];
            };

            lowUintLE = function (n) {
                DOUBLE_VIEW[0] = n;
                return UINT_VIEW[0];
            };

            highUintLE = function (n) {
                DOUBLE_VIEW[0] = n;
                return UINT_VIEW[1];
            };

            this.doubleBits = doubleBitsLE;
            this.pack = toDoubleLE;
            this.lo = lowUintLE;
            this.hi = highUintLE;
        } else if (UINT_VIEW[0] === 0x3ff00000) {
            // Use big endian
            doubleBitsBE = function (n) {
                DOUBLE_VIEW[0] = n;
                return [UINT_VIEW[1], UINT_VIEW[0]];
            };

            toDoubleBE = function (lo, hi) {
                UINT_VIEW[1] = lo;
                UINT_VIEW[0] = hi;
                return DOUBLE_VIEW[0];
            };

            lowUintBE = function (n) {
                DOUBLE_VIEW[0] = n;
                return UINT_VIEW[1];
            };

            highUintBE = function (n) {
                DOUBLE_VIEW[0] = n;
                return UINT_VIEW[0];
            };

            this.doubleBits = doubleBitsBE;
            this.pack = toDoubleBE;
            this.lo = lowUintBE;
            this.hi = highUintBE;
            // } else {
            //     hasTypedArrays = false;
        }
    }

    // if (!hasTypedArrays) {
    //     var buffer = new Buffer(8)
    //     doubleBits = function(n) {
    //         buffer.writeDoubleLE(n, 0, true);
    //         return [buffer.readUInt32LE(0, true), buffer.readUInt32LE(4, true)];
    //     };

    //     toDouble = function(lo, hi) {
    //         buffer.writeUInt32LE(lo, 0, true);
    //         buffer.writeUInt32LE(hi, 4, true);
    //         return buffer.readDoubleLE(0, true);
    //     };
    //     lowUint = function(n) {
    //         buffer.writeDoubleLE(n, 0, true);
    //         return buffer.readUInt32LE(0, true);
    //     };

    //     highUint = function(n) {
    //         buffer.writeDoubleLE(n, 0, true);
    //         return buffer.readUInt32LE(4, true);
    //     };

    //     this.doubleBits = doubleBits;
    //     this.pack = toDouble;
    //     this.lo = lowUint;
    //     this.hi = highUint;
    // }
};

JXG.extend(
    JXG.Math.DoubleBits.prototype,
    /** @lends JXG.Math.DoubleBits.prototype */ {
        sign: function (n) {
            return this.hi(n) >>> 31;
        },

        exponent: function (n) {
            var b = this.hi(n);
            return ((b << 1) >>> 21) - 1023;
        },

        fraction: function (n) {
            var lo = this.lo(n),
                hi = this.hi(n),
                b = hi & ((1 << 20) - 1);

            if (hi & 0x7ff00000) {
                b += 1 << 20;
            }
            return [lo, b];
        },

        denormalized: function (n) {
            var hi = this.hi(n);
            return !(hi & 0x7ff00000);
        }
    }
);

var doubleBits = new JXG.Math.DoubleBits(),
    /**
     * Interval for interval arithmetics. Consists of the properties
     * <ul>
     *  <li>lo
     *  <li>hi
     * </ul>
     * @name JXG.Math.Interval
     * @type Object
     */
    MatInterval = function (lo, hi) {
        if (lo !== undefined && hi !== undefined) {
            // possible cases:
            // - Interval(1, 2)
            // - Interval(Interval(1, 1), Interval(2, 2))     // singletons are required
            if (Mat.IntervalArithmetic.isInterval(lo)) {
                if (!Mat.IntervalArithmetic.isSingleton(lo)) {
                    throw new TypeError(
                        "JXG.Math.IntervalArithmetic: interval `lo` must be a singleton"
                    );
                }
                this.lo = lo.lo;
            } else {
                this.lo = lo;
            }
            if (Mat.IntervalArithmetic.isInterval(hi)) {
                if (!Mat.IntervalArithmetic.isSingleton(hi)) {
                    throw new TypeError(
                        "JXG.Math.IntervalArithmetic: interval `hi` must be a singleton"
                    );
                }
                this.hi = hi.hi;
            } else {
                this.hi = hi;
            }
        } else if (lo !== undefined) {
            // possible cases:
            // - Interval([1, 2])
            // - Interval([Interval(1, 1), Interval(2, 2)])
            if (Array.isArray(lo)) {
                return new MatInterval(lo[0], lo[1]);
            }
            // - Interval(1)
            return new MatInterval(lo, lo);
        } else {
            // This else is necessary even if jslint declares it as redundant
            // possible cases:
            // - Interval()
            this.lo = this.hi = 0;
        }
    };

JXG.extend(MatInterval.prototype, {
    print: function () {
        console.log("[", this.lo, this.hi, "]");
    },

    set: function (lo, hi) {
        this.lo = lo;
        this.hi = hi;
        return this;
    },

    bounded: function (lo, hi) {
        return this.set(Mat.IntervalArithmetic.prev(lo), Mat.IntervalArithmetic.next(hi));
    },

    boundedSingleton: function (v) {
        return this.bounded(v, v);
    },

    assign: function (lo, hi) {
        if (typeof lo !== "number" || typeof hi !== 'number') {
            throw new TypeError("JXG.Math.Interval#assign: arguments must be numbers");
        }
        if (isNaN(lo) || isNaN(hi) || lo > hi) {
            return this.setEmpty();
        }
        return this.set(lo, hi);
    },

    setEmpty: function () {
        return this.set(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
    },

    setWhole: function () {
        return this.set(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    },

    open: function (lo, hi) {
        return this.assign(Mat.IntervalArithmetic.next(lo), Mat.IntervalArithmetic.prev(hi));
    },

    halfOpenLeft: function (lo, hi) {
        return this.assign(Mat.IntervalArithmetic.next(lo), hi);
    },

    halfOpenRight: function (lo, hi) {
        return this.assign(lo, Mat.IntervalArithmetic.prev(hi));
    },

    toArray: function () {
        return [this.lo, this.hi];
    },

    clone: function () {
        return new MatInterval().set(this.lo, this.hi);
    }
});

/**
 * Object for interval arithmetics.
 * @name JXG.Math.IntervalArithmetic
 * @namespace
 * @exports Mat.IntervalArithmetic as JXG.Math.IntervalArithmetic
 *
 * @description
 * Interval arithmetic is a technique used to mitigate rounding and measurement errors in mathematical computation
 * by computing function bounds. Instead of representing a value as a single number, interval arithmetic represents each value as a range.
 * <br><br>
 *
 * For example, we wish to calculate the area of a rectangle from direct measurements using a standard meter stick with an uncertainty
 * of 0.0005 m (half the “least count measurement” of 1 mm). We measure one side nominally as L=1,
 * so 0.9995 ≤ L ≤ 1.0005, the other nominally as W=2 so the interval is [1.9995, 2.0005].
 *
 * <pre>
 * let L = JXG.Math.IntervalArithmetic.Interval(0.9995, 1.0005)
 * let W = JXG.Math.IntervalArithmetic.Interval(1.9995, 2.0005)
 *
 * let A = JXG.Math.IntervalArithmetic.mul(L, W)
 *
 * console.log('area:', A) // {hi: 2.0015002500000003, lo: 1.99850025}
 * </pre>
 *
 */
JXG.Math.IntervalArithmetic = {
    Interval: function (lo, hi) {
        return new MatInterval(lo, hi);
    },

    isInterval: function (i) {
        return (
            i !== null &&
            typeof i === "object" &&
            typeof i.lo === "number" &&
            typeof i.hi === "number"
        );
    },

    isSingleton: function (i) {
        return i.lo === i.hi;
    },

    /*
     * Arithmetics
     */

    /**
     * Addition
     *
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} y
     * @returns JXG.Math.Interval
     */
    add: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        return new MatInterval(this.addLo(x.lo, y.lo), this.addHi(x.hi, y.hi));
    },

    /**
     * Subtraction
     *
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} y
     * @returns JXG.Math.Interval
     */
    sub: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        return new MatInterval(this.subLo(x.lo, y.hi), this.subHi(x.hi, y.lo));
    },

    /**
     * Multiplication
     *
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} y
     * @returns JXG.Math.Interval
     */
    mul: function (x, y) {
        var xl, xh, yl, yh, out;

        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }

        if (this.isEmpty(x) || this.isEmpty(y)) {
            return this.EMPTY.clone();
        }
        xl = x.lo;
        xh = x.hi;
        yl = y.lo;
        yh = y.hi;
        out = new MatInterval();

        if (xl < 0) {
            if (xh > 0) {
                if (yl < 0) {
                    if (yh > 0) {
                        // mixed * mixed
                        out.lo = Math.min(this.mulLo(xl, yh), this.mulLo(xh, yl));
                        out.hi = Math.max(this.mulHi(xl, yl), this.mulHi(xh, yh));
                    } else {
                        // mixed * negative
                        out.lo = this.mulLo(xh, yl);
                        out.hi = this.mulHi(xl, yl);
                    }
                } else {
                    if (yh > 0) {
                        // mixed * positive
                        out.lo = this.mulLo(xl, yh);
                        out.hi = this.mulHi(xh, yh);
                    } else {
                        // mixed * zero
                        out.lo = 0;
                        out.hi = 0;
                    }
                }
            } else {
                if (yl < 0) {
                    if (yh > 0) {
                        // negative * mixed
                        out.lo = this.mulLo(xl, yh);
                        out.hi = this.mulHi(xl, yl);
                    } else {
                        // negative * negative
                        out.lo = this.mulLo(xh, yh);
                        out.hi = this.mulHi(xl, yl);
                    }
                } else {
                    if (yh > 0) {
                        // negative * positive
                        out.lo = this.mulLo(xl, yh);
                        out.hi = this.mulHi(xh, yl);
                    } else {
                        // negative * zero
                        out.lo = 0;
                        out.hi = 0;
                    }
                }
            }
        } else {
            if (xh > 0) {
                if (yl < 0) {
                    if (yh > 0) {
                        // positive * mixed
                        out.lo = this.mulLo(xh, yl);
                        out.hi = this.mulHi(xh, yh);
                    } else {
                        // positive * negative
                        out.lo = this.mulLo(xh, yl);
                        out.hi = this.mulHi(xl, yh);
                    }
                } else {
                    if (yh > 0) {
                        // positive * positive
                        out.lo = this.mulLo(xl, yl);
                        out.hi = this.mulHi(xh, yh);
                    } else {
                        // positive * zero
                        out.lo = 0;
                        out.hi = 0;
                    }
                }
            } else {
                // zero * any other value
                out.lo = 0;
                out.hi = 0;
            }
        }
        return out;
    },

    /**
     * Division
     *
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} y
     * @returns JXG.Math.Interval
     */
    div: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }

        if (this.isEmpty(x) || this.isEmpty(y)) {
            return this.EMPTY.clone();
        }
        if (this.zeroIn(y)) {
            if (y.lo !== 0) {
                if (y.hi !== 0) {
                    return this.divZero(x);
                }
                return this.divNegative(x, y.lo);
            }
            if (y.hi !== 0) {
                return this.divPositive(x, y.hi);
            }
            return this.EMPTY.clone();
        }
        return this.divNonZero(x, y);
    },

    /**
     * Return +x (i.e. identity)
     *
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    positive: function (x) {
        return new MatInterval(x.lo, x.hi);
    },

    /**
     * Return -x
     *
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    negative: function (x) {
        if (Type.isNumber(x)) {
            return new MatInterval(-x);
        }
        return new MatInterval(-x.hi, -x.lo);
    },

    /*
     * Utils
     */

    /**
     * Test if interval is empty set.
     * @param {JXG.Math.Interval} i
     * @returns Boolean
     */
    isEmpty: function (i) {
        return i.lo > i.hi;
    },

    /**
     * Test if interval is (-Infinity, Infinity).
     * @param {JXG.Math.Interval} i
     * @returns Boolean
     */
    isWhole: function (i) {
        return i.lo === -Infinity && i.hi === Infinity;
    },

    /**
     * Test if interval contains 0.
     * @param {JXG.Math.Interval} i
     * @returns Boolean
     */
    zeroIn: function (i) {
        return this.hasValue(i, 0);
    },

    /**
     * Test if interval contains a specific value.
     * @param {JXG.Math.Interval} i
     * @param {Number} value
     * @returns Boolean
     */
    hasValue: function (i, value) {
        if (this.isEmpty(i)) {
            return false;
        }
        return i.lo <= value && value <= i.hi;
    },

    /**
     * Test if interval x contains interval y.
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    hasInterval: function (x, y) {
        if (this.isEmpty(x)) {
            return true;
        }
        return !this.isEmpty(y) && y.lo <= x.lo && x.hi <= y.hi;
    },

    /**
     * Test if intervals x and y have non-zero intersection.
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    intervalsOverlap: function (x, y) {
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return false;
        }
        return (x.lo <= y.lo && y.lo <= x.hi) || (y.lo <= x.lo && x.lo <= y.hi);
    },

    /*
     * Division
     */
    /**
     * @private
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    divNonZero: function (x, y) {
        var xl = x.lo,
            xh = x.hi,
            yl = y.lo,
            yh = y.hi,
            out = new MatInterval();

        if (xh < 0) {
            if (yh < 0) {
                out.lo = this.divLo(xh, yl);
                out.hi = this.divHi(xl, yh);
            } else {
                out.lo = this.divLo(xl, yl);
                out.hi = this.divHi(xh, yh);
            }
        } else if (xl < 0) {
            if (yh < 0) {
                out.lo = this.divLo(xh, yh);
                out.hi = this.divHi(xl, yh);
            } else {
                out.lo = this.divLo(xl, yl);
                out.hi = this.divHi(xh, yl);
            }
        } else {
            if (yh < 0) {
                out.lo = this.divLo(xh, yh);
                out.hi = this.divHi(xl, yl);
            } else {
                out.lo = this.divLo(xl, yh);
                out.hi = this.divHi(xh, yl);
            }
        }
        return out;
    },

    /**
     * @private
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    divPositive: function (x, v) {
        if (x.lo === 0 && x.hi === 0) {
            return x;
        }

        if (this.zeroIn(x)) {
            // mixed considering zero in both ends
            return this.WHOLE;
        }

        if (x.hi < 0) {
            // negative / v
            return new MatInterval(Number.NEGATIVE_INFINITY, this.divHi(x.hi, v));
        }
        // positive / v
        return new MatInterval(this.divLo(x.lo, v), Number.POSITIVE_INFINITY);
    },

    /**
     * @private
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    divNegative: function (x, v) {
        if (x.lo === 0 && x.hi === 0) {
            return x;
        }

        if (this.zeroIn(x)) {
            // mixed considering zero in both ends
            return this.WHOLE;
        }

        if (x.hi < 0) {
            // negative / v
            return new MatInterval(this.divLo(x.hi, v), Number.POSITIVE_INFINITY);
        }
        // positive / v
        return new MatInterval(Number.NEGATIVE_INFINITY, this.divHi(x.lo, v));
    },

    /**
     * @private
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    divZero: function (x) {
        if (x.lo === 0 && x.hi === 0) {
            return x;
        }
        return this.WHOLE;
    },

    /*
     * Algebra
     */
    /**
     * x mod y:  x - n * y
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} y
     * @returns JXG.Math.Interval
     */
    fmod: function (x, y) {
        var yb, n;
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return this.EMPTY.clone();
        }
        yb = x.lo < 0 ? y.lo : y.hi;
        n = x.lo / yb;
        if (n < 0) {
            n = Math.ceil(n);
        } else {
            n = Math.floor(n);
        }
        // x mod y = x - n * y
        return this.sub(x, this.mul(y, new MatInterval(n)));
    },

    /**
     * 1 / x
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    multiplicativeInverse: function (x) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        if (this.zeroIn(x)) {
            if (x.lo !== 0) {
                if (x.hi !== 0) {
                    // [negative, positive]
                    return this.WHOLE;
                }
                // [negative, zero]
                return new MatInterval(Number.NEGATIVE_INFINITY, this.divHi(1, x.lo));
            }
            if (x.hi !== 0) {
                // [zero, positive]
                return new MatInterval(this.divLo(1, x.hi), Number.POSITIVE_INFINITY);
            }
            // [zero, zero]
            return this.EMPTY.clone();
        }
        // [positive, positive]
        return new MatInterval(this.divLo(1, x.hi), this.divHi(1, x.lo));
    },

    /**
     * x<sup>power</sup>
     * @param {JXG.Math.Interval|Number} x
     * @param {JXG.Math.Interval|Number} power
     * @returns JXG.Math.Interval
     */
    pow: function (x, power) {
        var yl, yh;

        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        if (this.isInterval(power)) {
            if (!this.isSingleton(power)) {
                return this.EMPTY.clone();
            }
            power = power.lo;
        }

        if (power === 0) {
            if (x.lo === 0 && x.hi === 0) {
                // 0^0
                return this.EMPTY.clone();
            }
            // x^0
            return this.ONE.clone();
        }
        if (power < 0) {
            // compute [1 / x]^-power if power is negative
            return this.pow(this.multiplicativeInverse(x), -power);
        }

        // power > 0
        if (power % 1 === 0) {
            // isSafeInteger(power) as boolean) {
            // power is integer
            if (x.hi < 0) {
                // [negative, negative]
                // assume that power is even so the operation will yield a positive interval
                // if not then just switch the sign and order of the interval bounds
                yl = this.powLo(-x.hi, power);
                yh = this.powHi(-x.lo, power);
                if ((power & 1) === 1) {
                    // odd power
                    return new MatInterval(-yh, -yl);
                }
                // even power
                return new MatInterval(yl, yh);
            }
            if (x.lo < 0) {
                // [negative, positive]
                if ((power & 1) === 1) {
                    return new MatInterval(-this.powLo(-x.lo, power), this.powHi(x.hi, power));
                }
                // even power means that any negative number will be zero (min value = 0)
                // and the max value will be the max of x.lo^power, x.hi^power
                return new MatInterval(0, this.powHi(Math.max(-x.lo, x.hi), power));
            }
            // [positive, positive]
            return new MatInterval(this.powLo(x.lo, power), this.powHi(x.hi, power));
        }
        console.warn(
            "power is not an integer, you should use nth-root instead, returning an empty interval"
        );
        return this.EMPTY.clone();
    },

    /**
     * sqrt(x)
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    sqrt: function (x) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        return this.nthRoot(x, 2);
    },

    /**
     * x<sup>1/n</sup>
     * @param {JXG.Math.Interval|Number} x
     * @param {Number} n
     * @returns JXG.Math.Interval
     */
    nthRoot: function (x, n) {
        var power, yl, yh, yp, yn;

        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x) || n < 0) {
            // compute 1 / x^-power if power is negative
            return this.EMPTY.clone();
        }

        // singleton interval check
        if (this.isInterval(n)) {
            if (!this.isSingleton(n)) {
                return this.EMPTY.clone();
            }
            n = n.lo;
        }

        power = 1 / n;
        if (x.hi < 0) {
            // [negative, negative]
            //if ((isSafeInteger(n) as boolean) && (n & 1) === 1) {
            if (n % 1 === 0 && (n & 1) === 1) {
                // when n is odd we can always take the nth root
                yl = this.powHi(-x.lo, power);
                yh = this.powLo(-x.hi, power);
                return new MatInterval(-yl, -yh);
            }

            // n is not odd therefore there's no nth root
            return this.EMPTY.clone();
        }
        if (x.lo < 0) {
            // [negative, positive]
            yp = this.powHi(x.hi, power);
            // if ((isSafeInteger(n) as boolean) && (n & 1) === 1) {
            if (n % 1 === 0 && (n & 1) === 1) {
                // nth root of x.lo is possible (n is odd)
                yn = -this.powHi(-x.lo, power);
                return new MatInterval(yn, yp);
            }
            return new MatInterval(0, yp);
        }
        // [positive, positive]
        return new MatInterval(this.powLo(x.lo, power), this.powHi(x.hi, power));
    },

    /*
     * Misc
     */
    /**
     *
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    exp: function (x) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return new MatInterval(this.expLo(x.lo), this.expHi(x.hi));
    },

    /**
     * Natural log
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    log: function (x) {
        var l;
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        l = x.lo <= 0 ? Number.NEGATIVE_INFINITY : this.logLo(x.lo);
        return new MatInterval(l, this.logHi(x.hi));
    },

    /**
     * Natural log, alias for {@link JXG.Math.IntervalArithmetic#log}.
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    ln: function (x) {
        return this.log(x);
    },

    // export const LOG_EXP_10 = this.log(new MatInterval(10, 10))
    // export const LOG_EXP_2 = log(new MatInterval(2, 2))
    /**
     * Logarithm to base 10.
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    log10: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return this.div(this.log(x), this.log(new MatInterval(10, 10)));
    },

    /**
     * Logarithm to base 2.
     * @param {JXG.Math.Interval|Number} x
     * @returns JXG.Math.Interval
     */
    log2: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return this.div(this.log(x), this.log(new MatInterval(2, 2)));
    },

    /**
     * Hull of intervals x and y
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    hull: function (x, y) {
        var badX = this.isEmpty(x),
            badY = this.isEmpty(y);
        if (badX && badY) {
            return this.EMPTY.clone();
        }
        if (badX) {
            return y.clone();
        }
        if (badY) {
            return x.clone();
        }
        return new MatInterval(Math.min(x.lo, y.lo), Math.max(x.hi, y.hi));
    },

    /**
     * Intersection of intervals x and y
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    intersection: function (x, y) {
        var lo, hi;
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return this.EMPTY.clone();
        }
        lo = Math.max(x.lo, y.lo);
        hi = Math.min(x.hi, y.hi);
        if (lo <= hi) {
            return new MatInterval(lo, hi);
        }
        return this.EMPTY.clone();
    },

    /**
     * Union of overlapping intervals x and y
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    union: function (x, y) {
        if (!this.intervalsOverlap(x, y)) {
            throw new Error("Interval#unions do not overlap");
        }
        return new MatInterval(Math.min(x.lo, y.lo), Math.max(x.hi, y.hi));
    },

    /**
     * Difference of overlapping intervals x and y
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    difference: function (x, y) {
        if (this.isEmpty(x) || this.isWhole(y)) {
            return this.EMPTY.clone();
        }
        if (this.intervalsOverlap(x, y)) {
            if (x.lo < y.lo && y.hi < x.hi) {
                // difference creates multiple subsets
                throw new Error("Interval.difference: difference creates multiple intervals");
            }

            // handle corner cases first
            if ((y.lo <= x.lo && y.hi === Infinity) || (y.hi >= x.hi && y.lo === -Infinity)) {
                return this.EMPTY.clone();
            }

            // NOTE: empty interval is handled automatically
            // e.g.
            //
            //    n = difference([0,1], [0,1]) // n = Interval(next(1), 1) = EMPTY
            //    isEmpty(n) === true
            //
            if (y.lo <= x.lo) {
                return new MatInterval().halfOpenLeft(y.hi, x.hi);
            }

            // y.hi >= x.hi
            return new MatInterval().halfOpenRight(x.lo, y.lo);
        }
        return x.clone();
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    width: function (x) {
        if (this.isEmpty(x)) {
            return 0;
        }
        return this.subHi(x.hi, x.lo);
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    abs: function (x) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        if (x.lo >= 0) {
            return x.clone();
        }
        if (x.hi <= 0) {
            return this.negative(x);
        }
        return new MatInterval(0, Math.max(-x.lo, x.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    max: function (x, y) {
        var badX = this.isEmpty(x),
            badY = this.isEmpty(y);
        if (badX && badY) {
            return this.EMPTY.clone();
        }
        if (badX) {
            return y.clone();
        }
        if (badY) {
            return x.clone();
        }
        return new MatInterval(Math.max(x.lo, y.lo), Math.max(x.hi, y.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns JXG.Math.Interval
     */
    min: function (x, y) {
        var badX = this.isEmpty(x),
            badY = this.isEmpty(y);
        if (badX && badY) {
            return this.EMPTY.clone();
        }
        if (badX) {
            return y.clone();
        }
        if (badY) {
            return x.clone();
        }
        return new MatInterval(Math.min(x.lo, y.lo), Math.min(x.hi, y.hi));
    },

    /*
     * Trigonometric
     */
    onlyInfinity: function (x) {
        return !isFinite(x.lo) && x.lo === x.hi;
    },

    _handleNegative: function (interval) {
        var n;
        if (interval.lo < 0) {
            if (interval.lo === -Infinity) {
                interval.lo = 0;
                interval.hi = Infinity;
            } else {
                n = Math.ceil(-interval.lo / this.piTwiceLow);
                interval.lo += this.piTwiceLow * n;
                interval.hi += this.piTwiceLow * n;
            }
        }
        return interval;
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    cos: function (x) {
        var cache, pi2, t, cosv, lo, hi, rlo, rhi;

        if (this.isEmpty(x) || this.onlyInfinity(x)) {
            return this.EMPTY.clone();
        }

        // create a clone of `x` because the clone is going to be modified
        cache = new MatInterval().set(x.lo, x.hi);
        this._handleNegative(cache);

        pi2 = this.PI_TWICE;
        t = this.fmod(cache, pi2);
        if (this.width(t) >= pi2.lo) {
            return new MatInterval(-1, 1);
        }

        // when t.lo > pi it's the same as
        // -cos(t - pi)
        if (t.lo >= this.piHigh) {
            cosv = this.cos(this.sub(t, this.PI));
            return this.negative(cosv);
        }

        lo = t.lo;
        hi = t.hi;
        rlo = this.cosLo(hi);
        rhi = this.cosHi(lo);
        // it's ensured that t.lo < pi and that t.lo >= 0
        if (hi <= this.piLow) {
            // when t.hi < pi
            // [cos(t.lo), cos(t.hi)]
            return new MatInterval(rlo, rhi);
        }
        if (hi <= pi2.lo) {
            // when t.hi < 2pi
            // [-1, max(cos(t.lo), cos(t.hi))]
            return new MatInterval(-1, Math.max(rlo, rhi));
        }
        // t.lo < pi and t.hi > 2pi
        return new MatInterval(-1, 1);
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    sin: function (x) {
        if (this.isEmpty(x) || this.onlyInfinity(x)) {
            return this.EMPTY.clone();
        }
        return this.cos(this.sub(x, this.PI_HALF));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    tan: function (x) {
        var cache, t, pi;
        if (this.isEmpty(x) || this.onlyInfinity(x)) {
            return this.EMPTY.clone();
        }

        // create a clone of `x` because the clone is going to be modified
        cache = new MatInterval().set(x.lo, x.hi);
        this._handleNegative(cache);

        pi = this.PI;
        t = this.fmod(cache, pi);
        if (t.lo >= this.piHalfLow) {
            t = this.sub(t, pi);
        }
        if (t.lo <= -this.piHalfLow || t.hi >= this.piHalfLow) {
            return this.WHOLE.clone();
        }
        return new MatInterval(this.tanLo(t.lo), this.tanHi(t.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    asin: function (x) {
        var lo, hi;
        if (this.isEmpty(x) || x.hi < -1 || x.lo > 1) {
            return this.EMPTY.clone();
        }
        lo = x.lo <= -1 ? -this.piHalfHigh : this.asinLo(x.lo);
        hi = x.hi >= 1 ? this.piHalfHigh : this.asinHi(x.hi);
        return new MatInterval(lo, hi);
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    acos: function (x) {
        var lo, hi;
        if (this.isEmpty(x) || x.hi < -1 || x.lo > 1) {
            return this.EMPTY.clone();
        }
        lo = x.hi >= 1 ? 0 : this.acosLo(x.hi);
        hi = x.lo <= -1 ? this.piHigh : this.acosHi(x.lo);
        return new MatInterval(lo, hi);
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    acot: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return new MatInterval(this.acotLo(x.lo), this.acotHi(x.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    atan: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return new MatInterval(this.atanLo(x.lo), this.atanHi(x.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    sinh: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return new MatInterval(this.sinhLo(x.lo), this.sinhHi(x.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    cosh: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        if (x.hi < 0) {
            return new MatInterval(this.coshLo(x.hi), this.coshHi(x.lo));
        }
        if (x.lo >= 0) {
            return new MatInterval(this.coshLo(x.lo), this.coshHi(x.hi));
        }
        return new MatInterval(1, this.coshHi(-x.lo > x.hi ? x.lo : x.hi));
    },

    /**
     * @param {JXG.Math.Interval} x
     * @returns JXG.Math.Interval
     */
    tanh: function (x) {
        if (this.isEmpty(x)) {
            return this.EMPTY.clone();
        }
        return new MatInterval(this.tanhLo(x.lo), this.tanhHi(x.hi));
    },

    /*
     * Relational
     */

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    equal: function (x, y) {
        if (this.isEmpty(x)) {
            return this.isEmpty(y);
        }
        return !this.isEmpty(y) && x.lo === y.lo && x.hi === y.hi;
    },

    // almostEqual: function(x, y): void {
    //     x = Array.isArray(x) ? x : x.toArray();
    //     y = Array.isArray(y) ? y : y.toArray();
    //     assertEps(x[0], y[0])
    //     assertEps(x[1], y[1])
    // },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    notEqual: function (x, y) {
        if (this.isEmpty(x)) {
            return !this.isEmpty(y);
        }
        return this.isEmpty(y) || x.hi < y.lo || x.lo > y.hi;
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    lt: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return false;
        }
        return x.hi < y.lo;
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    gt: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return false;
        }
        return x.lo > y.hi;
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    leq: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return false;
        }
        return x.hi <= y.lo;
    },

    /**
     * @param {JXG.Math.Interval} x
     * @param {JXG.Math.Interval} y
     * @returns Boolean
     */
    geq: function (x, y) {
        if (Type.isNumber(x)) {
            x = this.Interval(x);
        }
        if (Type.isNumber(y)) {
            y = this.Interval(y);
        }
        if (this.isEmpty(x) || this.isEmpty(y)) {
            return false;
        }
        return x.lo >= y.hi;
    },

    /*
     * Constants
     */
    piLow: (3373259426.0 + 273688.0 / (1 << 21)) / (1 << 30),
    piHigh: (3373259426.0 + 273689.0 / (1 << 21)) / (1 << 30),
    piHalfLow: ((3373259426.0 + 273688.0 / (1 << 21)) / (1 << 30)) * 0.5,
    piHalfHigh: ((3373259426.0 + 273689.0 / (1 << 21)) / (1 << 30)) * 0.5,
    piTwiceLow: ((3373259426.0 + 273688.0 / (1 << 21)) / (1 << 30)) * 2,
    piTwiceHigh: ((3373259426.0 + 273689.0 / (1 << 21)) / (1 << 30)) * 2,

    /*
     * Round
     * Rounding functions for numbers
     */
    identity: function (v) {
        return v;
    },

    _prev: function (v) {
        if (v === Infinity) {
            return v;
        }
        return this.nextafter(v, -Infinity);
    },

    _next: function (v) {
        if (v === -Infinity) {
            return v;
        }
        return this.nextafter(v, Infinity);
    },

    prev: function (v) {
        return this._prev(v);
    },

    next: function (v) {
        return this._next(v);
    },

    toInteger: function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    },

    addLo: function (x, y) {
        return this.prev(x + y);
    },
    addHi: function (x, y) {
        return this.next(x + y);
    },
    subLo: function (x, y) {
        return this.prev(x - y);
    },
    subHi: function (x, y) {
        return this.next(x - y);
    },
    mulLo: function (x, y) {
        return this.prev(x * y);
    },
    mulHi: function (x, y) {
        return this.next(x * y);
    },
    divLo: function (x, y) {
        return this.prev(x / y);
    },
    divHi: function (x, y) {
        return this.next(x / y);
    },
    intLo: function (x) {
        return this.toInteger(this.prev(x));
    },
    intHi: function (x) {
        return this.toInteger(this.next(x));
    },
    logLo: function (x) {
        return this.prev(Math.log(x));
    },
    logHi: function (x) {
        return this.next(Math.log(x));
    },
    expLo: function (x) {
        return this.prev(Math.exp(x));
    },
    expHi: function (x) {
        return this.next(Math.exp(x));
    },
    sinLo: function (x) {
        return this.prev(Math.sin(x));
    },
    sinHi: function (x) {
        return this.next(Math.sin(x));
    },
    cosLo: function (x) {
        return this.prev(Math.cos(x));
    },
    cosHi: function (x) {
        return this.next(Math.cos(x));
    },
    tanLo: function (x) {
        return this.prev(Math.tan(x));
    },
    tanHi: function (x) {
        return this.next(Math.tan(x));
    },
    asinLo: function (x) {
        return this.prev(Math.asin(x));
    },
    asinHi: function (x) {
        return this.next(Math.asin(x));
    },
    acosLo: function (x) {
        return this.prev(Math.acos(x));
    },
    acosHi: function (x) {
        return this.next(Math.acos(x));
    },
    acotLo: function (x) {
        return this.prev(Mat.acot(x));
    },
    acotHi: function (x) {
        return this.next(Mat.acot(x));
    },
    atanLo: function (x) {
        return this.prev(Math.atan(x));
    },
    atanHi: function (x) {
        return this.next(Math.atan(x));
    },
    sinhLo: function (x) {
        return this.prev(Mat.sinh(x));
    },
    sinhHi: function (x) {
        return this.next(Mat.sinh(x));
    },
    coshLo: function (x) {
        return this.prev(Mat.cosh(x));
    },
    coshHi: function (x) {
        return this.next(Mat.cosh(x));
    },
    tanhLo: function (x) {
        return this.prev(Mat.tanh(x));
    },
    tanhHi: function (x) {
        return this.next(Mat.tanh(x));
    },
    sqrtLo: function (x) {
        return this.prev(Math.sqrt(x));
    },
    sqrtHi: function (x) {
        return this.next(Math.sqrt(x));
    },

    powLo: function (x, power) {
        var y;
        if (power % 1 !== 0) {
            // power has decimals
            return this.prev(Math.pow(x, power));
        }

        y = (power & 1) === 1 ? x : 1;
        power >>= 1;
        while (power > 0) {
            x = this.mulLo(x, x);
            if ((power & 1) === 1) {
                y = this.mulLo(x, y);
            }
            power >>= 1;
        }
        return y;
    },

    powHi: function (x, power) {
        var y;
        if (power % 1 !== 0) {
            // power has decimals
            return this.next(Math.pow(x, power));
        }

        y = (power & 1) === 1 ? x : 1;
        power >>= 1;
        while (power > 0) {
            x = this.mulHi(x, x);
            if ((power & 1) === 1) {
                y = this.mulHi(x, y);
            }
            power >>= 1;
        }
        return y;
    },

    /**
     * @ignore
     * @private
     */
    disable: function () {
        this.next = this.prev = this.identity;
    },

    /**
     * @ignore
     * @private
     */
    enable: function () {
        this.prev = function (v) {
            return this._prev(v);
        };

        this.next = function (v) {
            return this._next(v);
        };
    },

    /*
     * nextafter
     */
    SMALLEST_DENORM: Math.pow(2, -1074),
    UINT_MAX: -1 >>> 0,

    nextafter: function (x, y) {
        var lo, hi;

        if (isNaN(x) || isNaN(y)) {
            return NaN;
        }
        if (x === y) {
            return x;
        }
        if (x === 0) {
            if (y < 0) {
                return -this.SMALLEST_DENORM;
            }
            return this.SMALLEST_DENORM;
        }
        hi = doubleBits.hi(x);
        lo = doubleBits.lo(x);
        if (y > x === x > 0) {
            if (lo === this.UINT_MAX) {
                hi += 1;
                lo = 0;
            } else {
                lo += 1;
            }
        } else {
            if (lo === 0) {
                lo = this.UINT_MAX;
                hi -= 1;
            } else {
                lo -= 1;
            }
        }
        return doubleBits.pack(lo, hi);
    }
};

JXG.Math.IntervalArithmetic.PI = new MatInterval(
    Mat.IntervalArithmetic.piLow,
    Mat.IntervalArithmetic.piHigh
);
JXG.Math.IntervalArithmetic.PI_HALF = new MatInterval(
    Mat.IntervalArithmetic.piHalfLow,
    Mat.IntervalArithmetic.piHalfHigh
);
JXG.Math.IntervalArithmetic.PI_TWICE = new MatInterval(
    Mat.IntervalArithmetic.piTwiceLow,
    Mat.IntervalArithmetic.piTwiceHigh
);
JXG.Math.IntervalArithmetic.ZERO = new MatInterval(0);
JXG.Math.IntervalArithmetic.ONE = new MatInterval(1);
JXG.Math.IntervalArithmetic.WHOLE = new MatInterval().setWhole();
JXG.Math.IntervalArithmetic.EMPTY = new MatInterval().setEmpty();

export default JXG.Math.IntervalArithmetic;
