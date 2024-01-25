/*
    Copyright 2008-2023
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */
/*global JXG:true, define: true*/

import JXG from "../jxg";
import Const from "../base/constants";
import Type from "../utils/type";
import Mat from "../math/math";

/**
 * Constructor for 3D curves.
 * @class Creates a new 3D curve object. Do not use this constructor to create a 3D curve. Use {@link JXG.View3D#create} with type {@link Curve3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Function} F
 * @param {Function} X
 * @param {Function} Y
 * @param {Function} Z
 * @param {Array} range
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Curve3D = function (view, F, X, Y, Z, range, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_CURVE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "curve3d");

    this.board.finalizeAdding(this);

    /**
     * @function
     * @ignore
     */
    this.F = F;

    /**
     * Function which maps u to x; i.e. it defines the x-coordinate of the curve
     * @function
     * @returns Number
     */
    this.X = X;

    /**
     * Function which maps u to y; i.e. it defines the y-coordinate of the curve
     * @function
     * @returns Number
     */
    this.Y = Y;

    /**
     * Function which maps u to z; i.e. it defines the x-coordinate of the curve
     * @function
     * @returns Number
     */
    this.Z = Z;

    this.dataX = null;
    this.dataY = null;
    this.dataZ = null;

    if (this.F !== null) {
        this.X = function (u) {
            return this.F(u)[0];
        };
        this.Y = function (u) {
            return this.F(u)[1];
        };
        this.Z = function (u) {
            return this.F(u)[2];
        };
    }

    this.range = range;

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Curve3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Curve3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Curve3D.prototype,
    /** @lends JXG.Curve3D.prototype */ {
        updateDataArray2D: function () {
            var steps = Type.evaluate(this.visProp.numberpointshigh),
                r, s, e, delta, c2d, u, dataX, dataY,
                i,
                p = [0, 0, 0];

            dataX = [];
            dataY = [];
            if (Type.exists(this.dataX)) {
                steps = this.dataX.length;
                for (u = 0; u < steps; u++) {
                    p = [this.dataX[u], this.dataY[u], this.dataZ[u]];
                    c2d = this.view.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
            } else if (Type.isArray(this.X)) {
                steps = this.X.length;
                for (u = 0; u < steps; u++) {
                    p = [this.X[u], this.Y[u], this.Z[u]];
                    c2d = this.view.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
            } else {
                r = Type.evaluate(this.range);
                s = Type.evaluate(r[0]);
                e = Type.evaluate(r[1]);
                delta = (e - s) / (steps - 1);
                for (i = 0, u = s; i < steps && u <= e; i++, u += delta) {
                    if (this.F !== null) {
                        p = this.F(u);
                    } else {
                        p = [this.X(u), this.Y(u), this.Z(u)];
                    }
                    c2d = this.view.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
            }
            return { X: dataX, Y: dataY };
        },

        updateDataArray: function() {
        },

        update: function () {
            // if (this.needsUpdate) {
                this.updateDataArray();
            // }
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        }
    }
);

/**
 * @class This element creates a 3D parametric curves.
 * @pseudo
 * @description A 3D parametric curve is defined by a function
 *    <i>F: R<sup>1</sup> &rarr; R<sup>3</sup></i>.
 *
 * @name Curve3D
 * @augments Curve
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Function_Function_Function_Array,Function} F<sub>X</sub>,F<sub>Y</sub>,F<sub>Z</sub>,range
 * F<sub>X</sub>(u), F<sub>Y</sub>(u), F<sub>Z</sub>(u) are functions returning a number, range is the array containing
 * lower and upper bound for the range of the parameter u. range may also be a function returning an array of length two.
 * @param {Function_Array,Function} F,range Alternatively: F<sub>[X,Y,Z]</sub>(u) a function returning an array [x,y,z] of
 * numbers, range as above.
 * @param {Array_Array_Array} X,Y,Z Three arrays containing the coordinate points which define the curve.
 */
JXG.createCurve3D = function (board, parents, attributes) {
    var view = parents[0],
        F, X, Y, Z, range, attr, el;

    if (parents.length === 3) {
        F = parents[1];
        range = parents[2];
        X = null;
        Y = null;
        Z = null;
    } else {
        X = parents[1];
        Y = parents[2];
        Z = parents[3];
        range = parents[4];
        F = null;
    }
    // TODO Throw error

    attr = Type.copyAttributes(attributes, board.options, "curve3d");
    el = new JXG.Curve3D(view, F, X, Y, Z, range, attr);

    attr = el.setAttr2D(attr);
    el.element2D = view.create("curve", [[], []], attr);
    /**
     * @class
     * @ignore
     */
    el.element2D.updateDataArray = function () {
        var ret = el.updateDataArray2D();
        this.dataX = ret.X;
        this.dataY = ret.Y;
    };
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement("curve3d", JXG.createCurve3D);

/**
 * @class 3D vector field.
 * <p>
 * Plot a vector field either given by three functions
 * f1(x, y, z), f2(x, y, z), and f3(x, y, z) or by a function f(x, y, z)
 * returning an array of size 3.
 *
 * @pseudo
 * @name Vectorfield3D
 * @augments JXG.Curve3D
 * @constructor
 * @type JXG.Curve3D
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * Parameter options:
 * @param {Array|Function|String} F Either an array containing three functions f1(x, y, z), f2(x, y, z),
 * and f3(x, y) or function f(x, y, z) returning an array of length 3.
 * @param {Array} xData Array of length 3 containing start value for x, number of steps,
 * end value of x. The vector field will contain (number of steps) + 1 vectors in direction of x.
 * @param {Array} yData Array of length 3 containing start value for y, number of steps,
 * end value of y. The vector field will contain (number of steps) + 1 vectors in direction of y.
 * @param {Array} zData Array of length 3 containing start value for z, number of steps,
 * end value of z. The vector field will contain (number of steps) + 1 vectors in direction of z.
 */
JXG.createVectorfield3D = function (board, parents, attributes) {
    var view = parents[0],
        el, attr;

    if (!(parents.length >= 5 &&
        (Type.isArray(parents[1]) || Type.isFunction(parents[0]) || Type.isString(parents[0])) &&
        (Type.isArray(parents[2]) && parents[1].length === 3) &&
        (Type.isArray(parents[3]) && parents[2].length === 3) &&
        (Type.isArray(parents[4]) && parents[3].length === 3)
    )) {
        throw new Error(
            "JSXGraph: Can't create vector field 3D with parent types " +
            "'" + typeof parents[0] + "', " +
            "'" + typeof parents[1] + "', " +
            "'" + typeof parents[2] + "'."  +
            "'" + typeof parents[1] + "', "
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'vectorfield3d');
    el = view.create('curve3d', [[], [], []], attr);

    /**
     * Set the defining functions of 3D vector field.
     * @memberOf Vectorfield3D
     * @name setF
     * @function
     * @param {Array|Function} func Either an array containing three functions f1(x, y, z),
     * f2(x, y, z), and f3(x, y, z) or function f(x, y, z) returning an array of length 3.
     * @returns {Object} Reference to the 3D vector field object.
     *
     * @example
     * field.setF([(x, y, z) => Math.sin(y), (x, y, z) => Math.cos(x), (x, y, z) => z]);
     * board.update();
     *
     */
    el.setF = function (func, varnames) {
        var f0, f1, f2;
        if (Type.isArray(func)) {
            f0 = Type.createFunction(func[0], this.board, varnames);
            f1 = Type.createFunction(func[1], this.board, varnames);
            f2 = Type.createFunction(func[2], this.board, varnames);
            /**
             * @ignore
             */
            this.F = function (x, y, z) {
                return [f0(x, y, z), f1(x, y, z), f2(x, y, z)];
            };
        } else {
            this.F = Type.createFunction(func, el.board, varnames);
        }
        return this;
    };

    el.setF(parents[1], 'x, y, z');
    el.xData = parents[2];
    el.yData = parents[3];
    el.zData = parents[4];

    el.updateDataArray = function () {
        var k, i, j,
            v, nrm,
            x, y, z,
            scale = Type.evaluate(this.visProp.scale),
            start = [
                Type.evaluate(this.xData[0]),
                Type.evaluate(this.yData[0]),
                Type.evaluate(this.zData[0])
            ],
            steps = [
                Type.evaluate(this.xData[1]),
                Type.evaluate(this.yData[1]),
                Type.evaluate(this.zData[1])
            ],
            end = [
                Type.evaluate(this.xData[2]),
                Type.evaluate(this.yData[2]),
                Type.evaluate(this.zData[2])
            ],
            delta = [
                (end[0] - start[0]) / steps[0],
                (end[1] - start[1]) / steps[1],
                (end[2] - start[2]) / steps[2]
            ],
            phi, theta1, theta2, theta,
            showArrow = Type.evaluate(this.visProp.arrowhead.enabled),
            leg, leg_x, leg_y, leg_z, alpha;

        if (showArrow) {
            // Arrow head style
            // leg = 8;
            // alpha = Math.PI * 0.125;
            leg = Type.evaluate(this.visProp.arrowhead.size);
            alpha = Type.evaluate(this.visProp.arrowhead.angle);
            leg_x = leg / board.unitX;
            leg_y = leg / board.unitY;
            leg_z = leg / Math.sqrt(board.unitX * board.unitY);
        }

        this.dataX = [];
        this.dataY = [];
        this.dataZ = [];
        for (i = 0, x = start[0]; i <= steps[0]; x += delta[0], i++) {
            for (j = 0, y = start[1]; j <= steps[1]; y += delta[1], j++) {
                for (k = 0, z = start[2]; k <= steps[2]; z += delta[2], k++) {
                    v = this.F(x, y, z);
                    nrm = Mat.norm(v);
                    if (nrm < Number.EPSILON) {
                        continue;
                    }

                    v[0] *= scale;
                    v[1] *= scale;
                    v[2] *= scale;
                    this.dataX = this.dataX.concat([x, x + v[0], NaN]);
                    this.dataY = this.dataY.concat([y, y + v[1], NaN]);
                    this.dataZ = this.dataZ.concat([z, z + v[2], NaN]);

                    if (showArrow) {
                        // Arrow head
                        nrm *= scale;
                        phi = Math.atan2(v[1], v[0]);
                        theta = Math.asin(v[2] / nrm);
                        theta1 = theta - alpha;
                        theta2 = theta + alpha;
                        this.dataX = this.dataX.concat([
                            x + v[0] - leg_x * Math.cos(phi) * Math.cos(theta1),
                            x + v[0],
                            x + v[0] - leg_x * Math.cos(phi) * Math.cos(theta2),
                            NaN]);
                        this.dataY = this.dataY.concat([
                            y + v[1] - leg_y * Math.sin(phi) * Math.cos(theta1),
                            y + v[1],
                            y + v[1] - leg_y * Math.sin(phi) * Math.cos(theta2),
                            NaN]);
                        this.dataZ = this.dataZ.concat([
                            z + v[2] - leg_z * Math.sin(theta2),
                            z + v[2],
                            z + v[2] - leg_z * Math.sin(theta1),
                            NaN]);
                    }
                }
            }
        }
    };

    el.methodMap = Type.deepCopy(el.methodMap, {
        setF: "setF"
    });

    return el;
};

JXG.registerElement("vectorfield3D", JXG.createVectorfield3D);
