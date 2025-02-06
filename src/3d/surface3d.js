/*
    Copyright 2008-2024
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

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Type from "../utils/type.js";

/**
 * Constructor for 3D surfaces.
 * @class Creates a new 3D surface object. Do not use this constructor to create a 3D surface. Use {@link JXG.View3D#create} with type {@link Surface3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Function} F
 * @param {Function} X
 * @param {Function} Y
 * @param {Function} Z
 * @param {Array} range_u
 * @param {Array} range_v
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Surface3D = function (view, F, X, Y, Z, range_u, range_v, attributes) {
    this.constructor(
        view.board,
        attributes,
        Const.OBJECT_TYPE_SURFACE3D,
        Const.OBJECT_CLASS_3D
    );
    this.constructor3D(view, "surface3d");

    this.board.finalizeAdding(this);

    /**
     * Internal function defining the surface
     * without applying any transformations.
     *
     * @function
     * @param {Number} u
     * @param {Number} v
     * @returns Array [x, y, z] of length 3
     * @private
     */
    this._F = F;

    /**
     * Internal function which maps (u, v) to x; i.e. it defines the x-coordinate of the surface
     * without applying any transformations.
     * @function
     * @param {Number} u
     * @param {Number} v
     * @returns Number
     * @private
     */
    this._X = X;

    /**
     * Internal function which maps (u, v) to y; i.e. it defines the y-coordinate of the surface
     * without applying any transformations.
     * @function
     * @param {Number} u
     * @param {Number} v
     * @returns Number
     * @private
     */
    this._Y = Y;

    /**
     * Internal function which maps (u, v) to z; i.e. it defines the z-coordinate of the surface
     * without applying any transformations.
     * @function
     * @param {Number} u
     * @param {Number} v
     * @returns Number
     * @private
     */
    this._Z = Z;

    if (this._F !== null) {
        this.X = function (u, v) {
            return this._F(u, v)[0];
        };
        this.Y = function (u, v) {
            return this._F(u, v)[1];
        };
        this.Z = function (u, v) {
            return this._F(u, v)[2];
        };
    } else {
        this._F = function(u, v) {
            return [this._X(u, v), this._Y(u, v), this._Z(u, v)];
        };
    }

    this.range_u = range_u;
    this.range_v = range_v;

    this.dataX = null;
    this.dataY = null;
    this.dataZ = null;
    this.points = [];

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Surface3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Surface3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Surface3D.prototype,
    /** @lends JXG.Surface3D.prototype */ {

        // updateCoords: function() {
        //     var steps,
        //         steps_u, steps_v,
        //         i_u, i_v,
        //         r_u, r_v,
        //         s_u, s_v,
        //         e_u, e_v,
        //         delta_u, delta_v,
        //         u, v,
        //         c3d = [1, 0, 0, 0];

        //     this.points = [];

        //     if (Type.exists(this.dataX)) {
        //         steps = this.dataX.length;
        //         for (u = 0; u < steps; u++) {
        //             this.points.push([1, this.dataX[u], this.dataY[u], this.dataZ[u]]);
        //         }
        //     } else if (Type.isArray(this.X)) {
        //         steps = this.X.length;
        //         for (u = 0; u < steps; u++) {
        //             this.points.push([1, this.X[u], this.Y[u], this.Z[u]]);
        //         }
        //     } else {
        //         steps_u = this.evalVisProp('stepsu');
        //         steps_v = this.evalVisProp('stepsv');
        //         r_u = Type.evaluate(this.range_u);
        //         r_v = Type.evaluate(this.range_v);
        //         s_u = Type.evaluate(r_u[0]);
        //         s_v = Type.evaluate(r_v[0]);
        //         e_u = Type.evaluate(r_u[1]);
        //         e_v = Type.evaluate(r_v[1]);
        //         delta_u = (e_u - s_u) / (steps_u - 1);
        //         delta_v = (e_v - s_v) / (steps_v - 1);

        //         for (i_u = 0, u = s_u; i_u < steps_u && u <= e_u; i_u++, u += delta_u) {
        //             for (i_v = 0, v = s_v; i_v < steps_v && v <= e_v; i_v++, v += delta_v) {
        //                 if (this.F !== null) {
        //                     c3d = this.F(u, v);
        //                 } else {
        //                     c3d = [this.X(u, v), this.Y(u, v), this.Z(u, v)];
        //                 }
        //                 c3d.unshift(1);
        //                 this.points.push(c3d);
        //             }
        //         }
        //     }
        //     this.numberPoints = this.points.length;

        //     return this;
        // },

        /**
         * Generic function which evaluates the function term of the surface
         * and applies its transformations.
         * @param {Number} u
         * @param {Number} v
         * @returns
         */
        evalF: function(u, v) {
            var t, i,
                c3d = [0, 0, 0, 0];


            if (this.transformations.length === 0 || this.baseElement === null) {
                c3d = this._F(u, v);
                return c3d;
            }

            t = this.transformations;
            for (i = 0; i < t.length; i++) {
                t[i].update();
            }
            if (c3d.length === 3) {
                c3d.unshift(1);
            }

            if (this === this.baseElement) {
                c3d = this._F(u, v);
            } else {
                c3d = this.baseElement.evalF(u, v);
            }
            c3d.unshift(1);
            c3d = Mat.matVecMult(t[0].matrix, c3d);
            for (i = 1; i < t.length; i++) {
                c3d = Mat.matVecMult(t[i].matrix, c3d);
            }

            return c3d.slice(1);
        },

        /**
         * Function defining the surface plus applying transformations.
         * @param {Number} u
         * @param {Number} v
        * @returns Array [x, y, z] of length 3
         */
        F: function(u, v) {
            return this.evalF(u, v);
        },

        /**
        * Function which maps (u, v) to z; i.e. it defines the x-coordinate of the surface
        * plus applying transformations.
        * @param {Number} u
        * @param {Number} v
        * @returns Number
        */
        X: function(u, v) {
            return this.evalF(u, v)[0];
        },

        /**
        * Function which maps (u, v) to y; i.e. it defines the y-coordinate of the surface
        * plus applying transformations.
        * @param {Number} u
        * @param {Number} v
        * @returns Number
        */
        Y: function(u, v) {
            return this.evalF(u, v)[1];
        },

        /**
        * Function which maps (u, v) to z; i.e. it defines the z-coordinate of the surface
        * plus applying transformations.
        * @param {Number} u
        * @param {Number} v
        * @returns Number
        */
        Z: function(u, v) {
            return this.evalF(u, v)[2];
        },

        /**
         * @class
         * @ignore
         */
        updateDataArray2D: function () {
            var steps_u = this.evalVisProp('stepsu'),
                steps_v = this.evalVisProp('stepsv'),
                r_u = Type.evaluate(this.range_u),
                r_v = Type.evaluate(this.range_v),
                func,
                res;

            // func = this.evalFunc();
            func = this.evalF.bind(this);
            r_u.push(steps_u);
            r_v.push(steps_v);
            // res = this.view.getMesh(this.evalF, r_u, r_v);
            res = this.view.getMesh(func, r_u, r_v);

            return { X: res[0], Y: res[1] };
        },

        addTransform: function (el, transform) {
            this.addTransformGeneric(el, transform);
            return this;
        },

        updateDataArray: function() { /* stub */ },

        update: function () {
            if (this.needsUpdate) {
                this.updateDataArray();
            }
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        projectCoords: function (p, params) {
            return Geometry.projectCoordsToParametric(p, this, 2, params);
        }

        // projectScreenCoords: function (pScr, params) {
        //     this.initParamsIfNeeded(params);
        //     return Geometry.projectScreenCoordsToParametric(pScr, this, params);
        // }
    }
);

/**
 * @class A 3D parametric surface visualizes a map (u, v) &rarr; [X(u, v), Y(u, v), Z(u, v)].
 * @pseudo
 * @description A 3D parametric surface is defined by a function
 *    <i>F: R<sup>2</sup> &rarr; R<sup>3</sup></i>.
 *
 * @name ParametricSurface3D
 * @augments Curve
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 *
 * @param {Function_Function_Function_Array,Function_Array,Function} F<sub>X</sub>,F<sub>Y</sub>,F<sub>Z</sub>,rangeU,rangeV F<sub>X</sub>(u,v), F<sub>Y</sub>(u,v), F<sub>Z</sub>(u,v)
 * are functions returning a number, rangeU is the array containing lower and upper bound for the range of parameter u, rangeV is the array containing lower and
 * upper bound for the range of parameter v. rangeU and rangeV may also be functions returning an array of length two.
 * @param {Function_Array,Function_Array,Function} F,rangeU,rangeV Alternatively: F<sub>[X,Y,Z]</sub>(u,v)
 * a function returning an array [x,y,z] of numbers, rangeU and rangeV as above.
 *
 * @example
 * var view = board.create('view3d',
 * 		        [[-6, -3], [8, 8],
 * 		        [[-5, 5], [-5, 5], [-5, 5]]]);
 *
 * // Sphere
 * var c = view.create('parametricsurface3d', [
 *     (u, v) => 2 * Math.sin(u) * Math.cos(v),
 *     (u, v) => 2 * Math.sin(u) * Math.sin(v),
 *     (u, v) => 2 * Math.cos(u),
 *     [0, 2 * Math.PI],
 *     [0, Math.PI]
 * ], {
 *     strokeColor: '#ff0000',
 *     stepsU: 30,
 *     stepsV: 30
 * });
 *
 * </pre><div id="JXG52da0ecc-1ba9-4d41-850c-36e5120025a5" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG52da0ecc-1ba9-4d41-850c-36e5120025a5',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *     var view = board.create('view3d',
 *            [[-6, -3], [8, 8],
 *            [[-5, 5], [-5, 5], [-5, 5]]]);
 *
 *     // Sphere
 *     var c = view.create('parametricsurface3d', [
 *         (u, v) => 2 * Math.sin(u) * Math.cos(v),
 *         (u, v) => 2 * Math.sin(u) * Math.sin(v),
 *         (u, v) => 2 * Math.cos(u),
 *         [0, 2 * Math.PI],
 *         [0, Math.PI]
 *     ], {
 *         strokeColor: '#ff0000',
 *         stepsU: 20,
 *         stepsV: 20
 *     });
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createParametricSurface3D = function (board, parents, attributes) {
    var view = parents[0],
        F, X, Y, Z,
        range_u, range_v, attr, el;

    if (parents.length === 4) {
        F = parents[1];
        range_u = parents[2];
        range_v = parents[3];
        X = null;
        Y = null;
        Z = null;
    } else {
        X = parents[1];
        Y = parents[2];
        Z = parents[3];
        range_u = parents[4];
        range_v = parents[5];
        F = null;
    }

    attr = Type.copyAttributes(attributes, board.options, "surface3d");
    el = new JXG.Surface3D(view, F, X, Y, Z, range_u, range_v, attr);

    attr = el.setAttr2D(attr);
    el.element2D = view.create("curve", [[], []], attr);
    el.element2D.view = view;

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
JXG.registerElement("parametricsurface3d", JXG.createParametricSurface3D);

/**
 * @class A 3D functiongraph  visualizes a map (x, y) &rarr; f(x, y).
 * The graph is a {@link Curve3D} element.
 * @pseudo
 * @description A 3D function graph is defined by a function
 *    <i>F: R<sup>2</sup> &rarr; R</i>.
 *
 * @name Functiongraph3D
 * @augments ParametricSurface3D
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Function,String_Array_Array} F,rangeX,rangeY  F(x,y) is a function returning a number (or a JessieCode string), rangeX is the array containing
 * lower and upper bound for the range of x, rangeY is the array containing
 * lower and upper bound for the range of y.
 * @example
 * var box = [-5, 5];
 * var view = board.create('view3d',
 *     [
 *         [-6, -3], [8, 8],
 *         [box, box, box]
 *     ],
 *     {
 *         xPlaneRear: {visible: false},
 *         yPlaneRear: {visible: false},
 *     });
 *
 * // Function F to be plotted
 * var F = (x, y) => Math.sin(x * y / 4);
 *
 * // 3D surface
 * var c = view.create('functiongraph3d', [
 *     F,
 *     box, // () => [-s.Value()*5, s.Value() * 5],
 *     box, // () => [-s.Value()*5, s.Value() * 5],
 * ], {
 *     strokeWidth: 0.5,
 *     stepsU: 70,
 *     stepsV: 70
 * });
 *
 * </pre><div id="JXG87646dd4-9fe5-4c21-8734-089abc612515" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG87646dd4-9fe5-4c21-8734-089abc612515',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *     var box = [-5, 5];
 *     var view = board.create('view3d',
 *         [
 *             [-6, -3], [8, 8],
 *             [box, box, box]
 *         ],
 *         {
 *             xPlaneRear: {visible: false},
 *             yPlaneRear: {visible: false},
 *         });
 *
 *     // Function F to be plotted
 *     var F = (x, y) => Math.sin(x * y / 4);
 *
 *     // 3D surface
 *     var c = view.create('functiongraph3d', [
 *         F,
 *         box, // () => [-s.Value()*5, s.Value() * 5],
 *         box, // () => [-s.Value()*5, s.Value() * 5],
 *     ], {
 *         strokeWidth: 0.5,
 *         stepsU: 70,
 *         stepsV: 70
 *     });
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createFunctiongraph3D = function (board, parents, attributes) {
    var view = parents[0],
        X = function (u, v) {
            return u;
        },
        Y = function (u, v) {
            return v;
        },
        Z = Type.createFunction(parents[1], board, 'x, y'),
        range_u = parents[2],
        range_v = parents[3];

    return view.create("parametricsurface3d", [X, Y, Z, range_u, range_v], attributes);
};
JXG.registerElement("functiongraph3d", JXG.createFunctiongraph3D);
