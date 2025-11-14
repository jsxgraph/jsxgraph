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
 * @fileoverview This file contains code for transformations of geometrical objects.
 */

import JXG from "../jxg.js";
import Const from "./constants.js";
import Mat from "../math/math.js";
import Type from "../utils/type.js";

/**
 * A transformation consists of a 3x3 matrix, i.e. it is a projective transformation.
 * @class Creates a new transformation object. Do not use this constructor to create a transformation.
 * Use {@link JXG.Board#create} with
 * type {@link Transformation} instead.
 * @constructor
 * @param {JXG.Board} board The board the transformation is part of.
 * @param {String} type Can be
 * <ul><li> 'translate'
 * <li> 'scale'
 * <li> 'reflect'
 * <li> 'rotate'
 * <li> 'shear'
 * <li> 'generic'
 * <li> 'matrix'
 * </ul>
 * @param {Object} params The parameters depend on the transformation type
 *
 * <p>
 * Translation matrix:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( a  1  0) * ( x )
 * ( b  0  1)   ( y )
 * </pre>
 *
 * <p>
 * Scale matrix:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( 0  a  0) * ( x )
 * ( 0  0  b)   ( y )
 * </pre>
 *
 * <p>
 * A rotation matrix with angle a (in Radians)
 * <pre>
 * ( 1    0        0      )   ( z )
 * ( 0    cos(a)   -sin(a)) * ( x )
 * ( 0    sin(a)   cos(a) )   ( y )
 * </pre>
 *
 * <p>
 * Shear matrix:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( 0  1  a) * ( x )
 * ( 0  b  1)   ( y )
 * </pre>
 *
 * <p>Generic transformation:
 * <pre>
 * ( a  b  c )   ( z )
 * ( d  e  f ) * ( x )
 * ( g  h  i )   ( y )
 * </pre>
 *
 */
JXG.Transformation = function (board, type, params, is3D) {
    this.elementClass = Const.OBJECT_CLASS_OTHER;
    this.type = Const.OBJECT_TYPE_TRANSFORMATION;

    if (is3D) {
        this.is3D = true;
        this.matrix = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    } else {
        this.is3D = false;
        this.matrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    this.board = board;
    this.isNumericMatrix = false;
    if (this.is3D) {
        this.setMatrix3D(params[0] /* view3d */, type, params.slice(1));
    } else {
        this.setMatrix(board, type, params);
    }

    this.methodMap = {
        apply: "apply",
        applyOnce: "applyOnce",
        bindTo: "bindTo",
        bind: "bindTo",
        melt: "melt",
        meltTo: "meltTo"
    };
};

JXG.Transformation.prototype = {};

JXG.extend(
    JXG.Transformation.prototype,
    /** @lends JXG.Transformation.prototype */ {
        /**
         * Updates the numerical data for the transformation, i.e. the entry of the subobject matrix.
         * @returns {JXG.Transform} returns pointer to itself
         */
        update: function () {
            return this;
        },

        /**
         * Set the transformation matrix for different types of standard transforms.
         * @param {JXG.Board} board
         * @param {String} type   Transformation type, possible values are
         *                        'translate', 'scale', 'reflect', 'rotate',
         *                        'shear', 'generic'.
         * @param {Array} params Parameters for the various transformation types.
         *
         * <p>A transformation with a generic matrix looks like:
         * <pre>
         * ( a  b  c )   ( z )
         * ( d  e  f ) * ( x )
         * ( g  h  i )   ( y )
         * </pre>
         *
         * The transformation matrix then looks like:
         * <p>
         * Translation matrix:
         * <pre>
         * ( 1  0  0)   ( z )
         * ( a  1  0) * ( x )
         * ( b  0  1)   ( y )
         * </pre>
         *
         * <p>
         * Scale matrix:
         * <pre>
         * ( 1  0  0)   ( z )
         * ( 0  a  0) * ( x )
         * ( 0  0  b)   ( y )
         * </pre>
         *
         * <p>
         * A rotation matrix with angle a (in Radians)
         * <pre>
         * ( 1    0        0      )   ( z )
         * ( 0    cos(a)   -sin(a)) * ( x )
         * ( 0    sin(a)   cos(a) )   ( y )
         * </pre>
         *
         * <p>
         * Shear matrix:
         * <pre>
         * ( 1  0  0)   ( z )
         * ( 0  1  a) * ( x )
         * ( 0  b  1)   ( y )
         * </pre>
         *
         * <p>Generic transformation (9 parameters):
         * <pre>
         * ( a  b  c )   ( z )
         * ( d  e  f ) * ( x )
         * ( g  h  i )   ( y )
         * </pre>
         *
         * <p>Matrix:
         * <pre>
         * (         )   ( z )
         * (    M    ) * ( x )
         * (         )   ( y )
         * </pre>
         */
        setMatrix: function (board, type, params) {
            var i;
                // e, obj; // Handle dependencies

            this.isNumericMatrix = true;
            for (i = 0; i < params.length; i++) {
                if (typeof params[i] !== 'number') {
                    this.isNumericMatrix = false;
                    break;
                }
            }

            if (type === 'translate') {
                if (params.length !== 2) {
                    throw new Error("JSXGraph: translate transformation needs 2 parameters.");
                }
                this.evalParam = Type.createEvalFunction(board, params, 2);
                this.update = function () {
                    this.matrix[1][0] = this.evalParam(0);
                    this.matrix[2][0] = this.evalParam(1);
                };
            } else if (type === 'scale') {
                if (params.length !== 2) {
                    throw new Error("JSXGraph: scale transformation needs 2 parameters.");
                }
                this.evalParam = Type.createEvalFunction(board, params, 2);
                this.update = function () {
                    this.matrix[1][1] = this.evalParam(0); // x
                    this.matrix[2][2] = this.evalParam(1); // y
                };
                // Input: line or two points
            } else if (type === 'reflect') {
                // line or two points
                if (params.length < 4) {
                    params[0] = board.select(params[0]);
                }

                // two points
                if (params.length === 2) {
                    params[1] = board.select(params[1]);
                }

                // 4 coordinates [px,py,qx,qy]
                if (params.length === 4) {
                    this.evalParam = Type.createEvalFunction(board, params, 4);
                }

                this.update = function () {
                    var x, y, z, xoff, yoff, d, v, p;
                    // Determine homogeneous coordinates of reflections axis
                    // line
                    if (params.length === 1) {
                        v = params[0].stdform;
                    } else if (params.length === 2) {
                        // two points
                        v = Mat.crossProduct(
                            params[1].coords.usrCoords,
                            params[0].coords.usrCoords
                        );
                    } else if (params.length === 4) {
                        // two points coordinates [px,py,qx,qy]
                        v = Mat.crossProduct(
                            [1, this.evalParam(2), this.evalParam(3)],
                            [1, this.evalParam(0), this.evalParam(1)]
                        );
                    }

                    // Project origin to the line. This gives a finite point p
                    x = v[1];
                    y = v[2];
                    z = v[0];
                    p = [-z * x, -z * y, x * x + y * y];
                    d = p[2];

                    // Normalize p
                    xoff = p[0] / p[2];
                    yoff = p[1] / p[2];

                    // x, y is the direction of the line
                    x = -v[2];
                    y = v[1];

                    this.matrix[1][1] = (x * x - y * y) / d;
                    this.matrix[1][2] = (2 * x * y) / d;
                    this.matrix[2][1] = this.matrix[1][2];
                    this.matrix[2][2] = -this.matrix[1][1];
                    this.matrix[1][0] =
                        xoff * (1 - this.matrix[1][1]) - yoff * this.matrix[1][2];
                    this.matrix[2][0] =
                        yoff * (1 - this.matrix[2][2]) - xoff * this.matrix[2][1];
                };
            } else if (type === 'rotate') {
                if (params.length === 3) {
                    // angle, x, y
                    this.evalParam = Type.createEvalFunction(board, params, 3);
                } else if (params.length > 0 && params.length <= 2) {
                    // angle, p or angle
                    this.evalParam = Type.createEvalFunction(board, params, 1);

                    if (params.length === 2 && !Type.isArray(params[1])) {
                        params[1] = board.select(params[1]);
                    }
                }

                this.update = function () {
                    var x,
                        y,
                        beta = this.evalParam(0),
                        co = Math.cos(beta),
                        si = Math.sin(beta);

                    this.matrix[1][1] = co;
                    this.matrix[1][2] = -si;
                    this.matrix[2][1] = si;
                    this.matrix[2][2] = co;

                    // rotate around [x,y] otherwise rotate around [0,0]
                    if (params.length > 1) {
                        if (params.length === 3) {
                            x = this.evalParam(1);
                            y = this.evalParam(2);
                        } else {
                            if (Type.isArray(params[1])) {
                                x = params[1][0];
                                y = params[1][1];
                            } else {
                                x = params[1].X();
                                y = params[1].Y();
                            }
                        }
                        this.matrix[1][0] = x * (1 - co) + y * si;
                        this.matrix[2][0] = y * (1 - co) - x * si;
                    }
                };
            } else if (type === 'shear') {
                if (params.length !== 2) {
                    throw new Error("JSXGraph: shear transformation needs 2 parameters.");
                }

                this.evalParam = Type.createEvalFunction(board, params, 2);
                this.update = function () {
                    this.matrix[1][2] = this.evalParam(0);
                    this.matrix[2][1] = this.evalParam(1);
                };
            } else if (type === 'generic') {
                if (params.length !== 9) {
                    throw new Error("JSXGraph: generic transformation needs 9 parameters.");
                }

                this.evalParam = Type.createEvalFunction(board, params, 9);

                this.update = function () {
                    this.matrix[0][0] = this.evalParam(0);
                    this.matrix[0][1] = this.evalParam(1);
                    this.matrix[0][2] = this.evalParam(2);
                    this.matrix[1][0] = this.evalParam(3);
                    this.matrix[1][1] = this.evalParam(4);
                    this.matrix[1][2] = this.evalParam(5);
                    this.matrix[2][0] = this.evalParam(6);
                    this.matrix[2][1] = this.evalParam(7);
                    this.matrix[2][2] = this.evalParam(8);
                };
            } else if (type === 'matrix') {
                if (params.length !== 1) {
                    throw new Error("JSXGraph: transformation of type 'matrix' needs 1 parameter.");
                }

                this.evalParam = params[0].slice();
                this.update = function () {
                    var i, j;
                    for (i = 0; i < 3; i++) {
                        for (j = 0; j < 3; j++) {
                            this.matrix[i][j] = Type.evaluate(this.evalParam[i][j]);
                        }
                    }
                };
            }

            // Handle dependencies
            // NO: transformations do not have method addParents
            // if (Type.exists(this.evalParam)) {
            //     for (e in this.evalParam.deps) {
            //         obj = this.evalParam.deps[e];
            //         this.addParents(obj);
            //         obj.addChild(this);
            //     }
            // }
        },

        /**
         * Set the 3D transformation matrix for different types of standard transforms.
         * @param {JXG.Board} board
         * @param {String} type   Transformation type, possible values are
         *                        'translate', 'scale', 'rotate',
         *                        'rotateX', 'rotateY', 'rotateZ',
         *                        'shear', 'generic'.
         * @param {Array} params Parameters for the various transformation types.
         *
         * <p>A transformation with a generic matrix looks like:
         * <pre>
         * ( a  b  c  d)   ( w )
         * ( e  f  g  h) * ( x )
         * ( i  j  k  l)   ( y )
         * ( m  n  o  p)   ( z )
         * </pre>
         *
         * The transformation matrix then looks like:
         * <p>
         * Translation matrix:
         * <pre>
         * ( 1  0  0  0)   ( w )
         * ( a  1  0  0) * ( x )
         * ( b  0  1  0)   ( y )
         * ( c  0  0  1)   ( z )
         * </pre>
         *
         * <p>
         * Scale matrix:
         * <pre>
         * ( 1  0  0  0)   ( w )
         * ( 0  a  0  0) * ( x )
         * ( 0  0  b  0)   ( y )
         * ( 0  0  0  c)   ( z )
         * </pre>
         *
         * <p>
         * rotateX: a rotation matrix with angle a (in Radians)
         * <pre>
         * ( 1    0        0             )   ( z )
         * ( 0    1        0         0   ) * ( x )
         * ( 0    0      cos(a)   -sin(a)) * ( x )
         * ( 0    0      sin(a)   cos(a) )   ( y )
         * </pre>
         *
         * <p>
         * rotateY: a rotation matrix with angle a (in Radians)
         * <pre>
         * ( 1      0       0           )   ( z )
         * ( 0    cos(a)    0    -sin(a)) * ( x )
         * ( 0      0       1       0   ) * ( x )
         * ( 0    sin(a)    0    cos(a) )   ( y )
         * </pre>
         *
         * <p>
         * rotateZ: a rotation matrix with angle a (in Radians)
         * <pre>
         * ( 1      0                0  )   ( z )
         * ( 0    cos(a)   -sin(a)   0  ) * ( x )
         * ( 0    sin(a)   cos(a)    0  )   ( y )
         * ( 0      0         0      1  ) * ( x )
         * </pre>
         *
         * <p>
         * rotate: a rotation matrix with angle a (in Radians)
         * and normal <i>n</i>.
         *
         */
        setMatrix3D: function(view, type, params) {
            var i,
                board = view.board;

            this.isNumericMatrix = true;
            for (i = 0; i < params.length; i++) {
                if (typeof params[i] !== 'number') {
                    this.isNumericMatrix = false;
                    break;
                }
            }

            if (type === 'translate') {
                if (params.length !== 3) {
                    throw new Error("JSXGraph: 3D translate transformation needs 3 parameters.");
                }
                this.evalParam = Type.createEvalFunction(board, params, 3);
                this.update = function () {
                    this.matrix[1][0] = this.evalParam(0);
                    this.matrix[2][0] = this.evalParam(1);
                    this.matrix[3][0] = this.evalParam(2);
                };
            } else if (type === 'scale') {
                if (params.length !== 3 && params.length !== 4) {
                    throw new Error("JSXGraph: 3D scale transformation needs either 3 or 4 parameters.");
                }
                this.evalParam = Type.createEvalFunction(board, params, 3);
                this.update = function () {
                    var x = this.evalParam(0),
                        y = this.evalParam(1),
                        z = this.evalParam(2);

                    this.matrix[1][1] = x;
                    this.matrix[2][2] = y;
                    this.matrix[3][3] = z;
                };
            } else if (type === 'rotateX') {
                params.splice(1, 0, [1, 0, 0]);
                this.setMatrix3D(view, 'rotate', params);
            } else if (type === 'rotateY') {
                params.splice(1, 0, [0, 1, 0]);
                this.setMatrix3D(view, 'rotate', params);
            } else if (type === 'rotateZ') {
                params.splice(1, 0, [0, 0, 1]);
                this.setMatrix3D(view, 'rotate', params);
            } else if (type === 'rotate') {
                if (params.length < 2) {
                    throw new Error("JSXGraph: 3D rotate transformation needs 2 or 3 parameters.");
                }
                if (params.length === 3 && !Type.isFunction(params[2]) && !Type.isArray(params[2])) {
                    this.evalParam = Type.createEvalFunction(board, params, 2);
                    params[2] = view.select(params[2]);
                } else {
                    this.evalParam = Type.createEvalFunction(board, params, params.length);
                }
                this.update = function () {
                    var a = this.evalParam(0), // angle
                        n = this.evalParam(1), // normal
                        p = [1, 0, 0, 0],
                        co = Math.cos(a),
                        si = Math.sin(a),
                        n1, n2, n3,
                        m1 = [
                            [1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]
                        ],
                        m2 = [
                            [1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]
                        ],
                        nrm = Mat.norm(n);

                    if (n.length === 3) {
                        n1 = n[0] / nrm;
                        n2 = n[1] / nrm;
                        n3 = n[2] / nrm;
                    } else {
                        n1 = n[1] / nrm;
                        n2 = n[2] / nrm;
                        n3 = n[3] / nrm;
                    }
                    if (params.length === 3) {
                        if (params.length === 3 && Type.exists(params[2].is3D)) {
                            p = params[2].coords.slice();
                        } else {
                            p = this.evalParam(2);
                        }
                        if (p.length === 3) {
                            p.unshift(1);
                        }
                        m1[1][0] = -p[1];
                        m1[2][0] = -p[2];
                        m1[3][0] = -p[3];

                        m2[1][0] = p[1];
                        m2[2][0] = p[2];
                        m2[3][0] = p[3];
                    }

                    this.matrix = [
                        [1, 0, 0, 0],
                        [0, n1 * n1 * (1 - co) +      co, n1 * n2 * (1 - co) - n3 * si, n1 * n3 * (1 - co) + n2 * si],
                        [0, n2 * n1 * (1 - co) + n3 * si, n2 * n2 * (1 - co) +      co, n2 * n3 * (1 - co) - n1 * si],
                        [0, n3 * n1 * (1 - co) - n2 * si, n3 * n2 * (1 - co) + n1 * si, n3 * n3 * (1 - co) +      co]
                    ];
                    this.matrix = Mat.matMatMult(this.matrix, m1);
                    this.matrix = Mat.matMatMult(m2, this.matrix);
                };
            }
        },

        /**
         * Transform a point element, that are: {@link Point}, {@link Text}, {@link Image}, {@link Point3D}.
         * First, the transformation matrix is updated, then do the matrix-vector-multiplication.
         * <p>
         * Restricted to 2D transformations.
         *
         * @private
         * @param {JXG.GeometryElement} p element which is transformed
         * @param {String} 'self' Apply the transformation to the initialCoords instead of the coords if this is set.
         * @returns {Array}
         */
        apply: function (p, self) {
            var c;

            this.update();
            if (this.is3D) {
                c = p.coords;
            } else if (Type.exists(self)) {
                c = p.initialCoords.usrCoords;
            } else {
                c = p.coords.usrCoords;
            }

            return Mat.matVecMult(this.matrix, c);
        },

        /**
         * Applies a transformation once to a point element, that are: {@link Point}, {@link Text}, {@link Image}, {@link Point3D} or to an array of such elements.
         * If it is a free 2D point, then it can be dragged around later
         * and will overwrite the transformed coordinates.
         * @param {JXG.Point|Array} p
         */
        applyOnce: function (p) {
            var c, len, i;

            if (!Type.isArray(p)) {
                p = [p];
            }

            len = p.length;
            for (i = 0; i < len; i++) {
                this.update();
                if (this.is3D) {
                    p[i].coords = Mat.matVecMult(this.matrix, p[i].coords);
                } else {
                    c = Mat.matVecMult(this.matrix, p[i].coords.usrCoords);
                    p[i].coords.setCoordinates(Const.COORDS_BY_USER, c);
                }
            }
        },

        /**
         * Binds a transformation to a GeometryElement or an array of elements. In every update of the
         * GeometryElement(s), the transformation is executed. That means, in order to immediately
         * apply the transformation after calling bindTo, a call of board.update() has to follow.
         * <p>
         * The transformation is simply appended to the existing list of transformations of the object.
         * It is not fused (melt) with an existing transformation.
         *
         * @param  {Array|JXG.Object} el JXG.Object or array of JXG.Object to
         *                            which the transformation is bound to.
         * @see JXG.Transformation.meltTo
         */
        bindTo: function (el) {
            var i, len;
            if (Type.isArray(el)) {
                len = el.length;

                for (i = 0; i < len; i++) {
                    el[i].transformations.push(this);
                }
            } else {
                el.transformations.push(this);
            }
        },

        /**
         * Binds a transformation to a GeometryElement or an array of elements. In every update of the
         * GeometryElement(s), the transformation is executed. That means, in order to immediately
         * apply the transformation after calling meltTo, a call of board.update() has to follow.
         * <p>
         * In case the last transformation of the element and this transformation are static,
         * i.e. the transformation matrices do not depend on other elements,
         * the transformation will be fused into (multiplied with) the last transformation of
         * the element. Thus, the list of transformations is kept small.
         * If the transformation will be the first transformation ot the element, it will be cloned
         * to prevent side effects.
         *
         * @param  {Array|JXG.Object} el JXG.Object or array of JXG.Objects to
         *                            which the transformation is bound to.
         *
         * @see JXG.Transformation#bindTo
         */
        meltTo: function (el) {
            var i, elt, t;

            if (Type.isArray(el)) {
                for (i = 0; i < el.length; i++) {
                    this.meltTo(el[i]);
                }
            } else {
                elt = el.transformations;
                if (elt.length > 0 &&
                    elt[elt.length - 1].isNumericMatrix &&
                    this.isNumericMatrix
                ) {
                    elt[elt.length - 1].melt(this);
                } else {
                    // Use a clone of the transformation.
                    // Otherwise, if the transformation is meltTo twice
                    // the transformation will be changed.
                    t = this.clone();
                    elt.push(t);
                }
            }
        },

        /**
         * Create a copy of the transformation in case it is static, i.e.
         * if the transformation matrix does not depend on other elements.
         * <p>
         * If the transformation matrix is not static, null will be returned.
         *
         * @returns {JXG.Transformation}
         */
        clone: function() {
            var t = null;

            if (this.isNumericMatrix) {
                t = new JXG.Transformation(this.board, 'none', []);
                t.matrix = this.matrix.slice();
            }

            return t;
        },

        /**
         * Unused
         * @deprecated Use setAttribute
         * @param term
         */
        setProperty: function (term) {
            JXG.deprecated("Transformation.setProperty()", "Transformation.setAttribute()");
        },

        /**
         * Empty method. Unused.
         * @param {Object} term Key-value pairs of the attributes.
         */
        setAttribute: function (term) {},

        /**
         * Combine two transformations to one transformation. This only works if
         * both of transformation matrices consist of numbers solely, and do not
         * contain functions.
         *
         * Multiplies the transformation with a transformation t from the left.
         * i.e. (this) = (t) join (this)
         * @param  {JXG.Transform} t Transformation which is the left multiplicand
         * @returns {JXG.Transform} the transformation object.
         */
        melt: function (t) {
            var res = [];

            this.update();
            t.update();

            res = Mat.matMatMult(t.matrix, this.matrix);

            this.update = function () {
                this.matrix = res;
            };

            return this;
        },

        // Documented in element.js
        // Not yet, since transformations are not listed in board.objects.
        getParents: function () {
            var p = [[].concat.apply([], this.matrix)];

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        }
    }
);

/**
 * @class Define projective 2D transformations like translation, rotation, reflection.
 * @pseudo
 * @description A transformation consists of a 3x3 matrix, i.e. it is a projective transformation.
 * <p>
 * Internally, a transformation is applied to an element by multiplying the 3x3 matrix from the left to
 * the homogeneous coordinates of the element. JSXGraph represents homogeneous coordinates in the order
 * (z, x, y). The matrix has the form
 * <pre>
 * ( a  b  c )   ( z )
 * ( d  e  f ) * ( x )
 * ( g  h  i )   ( y )
 * </pre>
 * where in general a=1. If b = c = 0, the transformation is called <i>affine</i>.
 * In this case, finite points will stay finite. This is not the case for general projective coordinates.
 * <p>
 * Transformations acting on texts and images are considered to be affine, i.e. b and c are ignored.
 *
 * @name Transformation
 * @augments JXG.Transformation
 * @constructor
 * @type JXG.Transformation
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {number|function|JXG.GeometryElement} parameters The parameters depend on the transformation type, supplied as attribute 'type'.
 * Possible transformation types are
 * <ul>
 * <li> 'translate'
 * <li> 'scale'
 * <li> 'reflect'
 * <li> 'rotate'
 * <li> 'shear'
 * <li> 'generic'
 * <li> 'matrix'
 * </ul>
 * <p>Valid parameters for these types are:
 * <dl>
 * <dt><b><tt>type:"translate"</tt></b></dt><dd><b>x, y</b> Translation vector (two numbers or functions).
 * The transformation matrix for x = a and y = b has the form:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( a  1  0) * ( x )
 * ( b  0  1)   ( y )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"scale"</tt></b></dt><dd><b>scale_x, scale_y</b> Scale vector (two numbers or functions).
 * The transformation matrix for scale_x = a and scale_y = b has the form:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( 0  a  0) * ( x )
 * ( 0  0  b)   ( y )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"rotate"</tt></b></dt><dd> <b>alpha, [point | x, y]</b> The parameters are the angle value in Radians
 *     (a number or function), and optionally a coordinate pair (two numbers or functions) or a point element defining the
 *                rotation center. If the rotation center is not given, the transformation rotates around (0,0).
 * The transformation matrix for angle a and rotating around (0, 0) has the form:
 * <pre>
 * ( 1    0        0      )   ( z )
 * ( 0    cos(a)   -sin(a)) * ( x )
 * ( 0    sin(a)   cos(a) )   ( y )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"shear"</tt></b></dt><dd><b>shear_x, shear_y</b> Shear vector (two numbers or functions).
 * The transformation matrix for shear_x = a and shear_y = b has the form:
 * <pre>
 * ( 1  0  0)   ( z )
 * ( 0  1  a) * ( x )
 * ( 0  b  1)   ( y )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"reflect"</tt></b></dt><dd>The parameters can either be:
 *    <ul>
 *      <li> <b>line</b> a line element,
 *      <li> <b>p, q</b> two point elements,
 *      <li> <b>p_x, p_y, q_x, q_y</b> four numbers or functions  determining a line through points (p_x, p_y) and (q_x, q_y).
 *    </ul>
 * </dd>
 * <dt><b><tt>type:"generic"</tt></b></dt><dd><b>a, b, c, d, e, f, g, h, i</b> Nine matrix entries (numbers or functions)
 *  for a generic projective transformation.
 * The matrix has the form
 * <pre>
 * ( a  b  c )   ( z )
 * ( d  e  f ) * ( x )
 * ( g  h  i )   ( y )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"matrix"</tt></b></dt><dd><b>M</b> 3x3 transformation matrix containing numbers or functions</dd>
 * </dl>
 *
 *
 * @see JXG.Transformation#setMatrix
 *
 * @example
 * // The point B is determined by taking twice the vector A from the origin
 *
 * var p0 = board.create('point', [0, 3], {name: 'A'}),
 *     t = board.create('transform', [function(){ return p0.X(); }, "Y(A)"], {type: 'translate'}),
 *     p1 = board.create('point', [p0, t], {color: 'blue'});
 *
 * </pre><div class="jxgbox" id="JXG14167b0c-2ad3-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG14167b0c-2ad3-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p0 = board.create('point', [0, 3], {name: 'A'}),
 *         t = board.create('transform', [function(){ return p0.X(); }, "Y(A)"], {type:'translate'}),
 *         p1 = board.create('point', [p0, t], {color: 'blue'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // The point B is the result of scaling the point A with factor 2 in horizontal direction
 * // and with factor 0.5 in vertical direction.
 *
 * var p1 = board.create('point', [1, 1]),
 *     t = board.create('transform', [2, 0.5], {type: 'scale'}),
 *     p2 = board.create('point', [p1, t], {color: 'blue'});
 *
 * </pre><div class="jxgbox" id="JXGa6827a72-2ad3-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGa6827a72-2ad3-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]),
 *         t = board.create('transform', [2, 0.5], {type: 'scale'}),
 *         p2 = board.create('point', [p1, t], {color: 'blue'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // The point B is rotated around C which gives point D. The angle is determined
 * // by the vertical height of point A.
 *
 * var p0 = board.create('point', [0, 3], {name: 'A'}),
 *     p1 = board.create('point', [1, 1]),
 *     p2 = board.create('point', [2, 1], {name:'C', fixed: true}),
 *
 *     // angle, rotation center:
 *     t = board.create('transform', ['Y(A)', p2], {type: 'rotate'}),
 *     p3 = board.create('point', [p1, t], {color: 'blue'});
 *
 * </pre><div class="jxgbox" id="JXG747cf11e-2ad4-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG747cf11e-2ad4-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p0 = board.create('point', [0, 3], {name: 'A'}),
 *         p1 = board.create('point', [1, 1]),
 *         p2 = board.create('point', [2, 1], {name:'C', fixed: true}),
 *
 *         // angle, rotation center:
 *         t = board.create('transform', ['Y(A)', p2], {type: 'rotate'}),
 *         p3 = board.create('point', [p1, t], {color: 'blue'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // A concatenation of several transformations.
 * var p1 = board.create('point', [1, 1]),
 *     t1 = board.create('transform', [-2, -1], {type: 'translate'}),
 *     t2 = board.create('transform', [Math.PI/4], {type: 'rotate'}),
 *     t3 = board.create('transform', [2, 1], {type: 'translate'}),
 *     p2 = board.create('point', [p1, [t1, t2, t3]], {color: 'blue'});
 *
 * </pre><div class="jxgbox" id="JXGf516d3de-2ad5-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGf516d3de-2ad5-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]),
 *         t1 = board.create('transform', [-2, -1], {type:'translate'}),
 *         t2 = board.create('transform', [Math.PI/4], {type:'rotate'}),
 *         t3 = board.create('transform', [2, 1], {type:'translate'}),
 *         p2 = board.create('point', [p1, [t1, t2, t3]], {color: 'blue'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Reflection of point A
 * var p1 = board.create('point', [1, 1]),
 *     p2 = board.create('point', [1, 3]),
 *     p3 = board.create('point', [-2, 0]),
 *     l = board.create('line', [p2, p3]),
 *     t = board.create('transform', [l], {type: 'reflect'}),  // Possible are l, l.id, l.name
 *     p4 = board.create('point', [p1, t], {color: 'blue'});
 *
 * </pre><div class="jxgbox" id="JXG6f374a04-2ad6-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6f374a04-2ad6-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]),
 *         p2 = board.create('point', [1, 3]),
 *         p3 = board.create('point', [-2, 0]),
 *         l = board.create('line', [p2, p3]),
 *         t = board.create('transform', [l], {type:'reflect'}),  // Possible are l, l.id, l.name
 *         p4 = board.create('point', [p1, t], {color: 'blue'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Type: 'matrix'
 *         var y = board.create('slider', [[-3, 1], [-3, 4], [0, 1, 6]]);
 *         var t1 = board.create('transform', [
 *             [
 *                 [1, 0, 0],
 *                 [0, 1, 0],
 *                 [() => y.Value(), 0, 1]
 *             ]
 *         ], {type: 'matrix'});
 *
 *         var A = board.create('point', [2, -3]);
 *         var B = board.create('point', [A, t1]);
 *
 * </pre><div id="JXGd2bfd46c-3c0c-45c5-a92b-583fad0eb3ec" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGd2bfd46c-3c0c-45c5-a92b-583fad0eb3ec',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var y = board.create('slider', [[-3, 1], [-3, 4], [0, 1, 6]]);
 *             var t1 = board.create('transform', [
 *                 [
 *                     [1, 0, 0],
 *                     [0, 1, 0],
 *                     [() => y.Value(), 0, 1]
 *                 ]
 *             ], {type: 'matrix'});
 *
 *             var A = board.create('point', [2, -3]);
 *             var B = board.create('point', [A, t1]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // One time application of a transform to points A, B
 * var p1 = board.create('point', [1, 1]),
 *     p2 = board.create('point', [-1, -2]),
 *     t = board.create('transform', [3, 2], {type: 'shear'});
 * t.applyOnce([p1, p2]);
 *
 * </pre><div class="jxgbox" id="JXGb6cee1c4-2ad6-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb6cee1c4-2ad6-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8, -8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]),
 *         p2 = board.create('point', [-1, -2]),
 *         t = board.create('transform', [3, 2], {type: 'shear'});
 *     t.applyOnce([p1, p2]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Construct a square of side length 2 with the
 * // help of transformations
 *     var sq = [],
 *         right = board.create('transform', [2, 0], {type: 'translate'}),
 *         up = board.create('transform', [0, 2], {type: 'translate'}),
 *         pol, rot, p0;
 *
 *     // The first point is free
 *     sq[0] = board.create('point', [0, 0], {name: 'Drag me'}),
 *
 *     // Construct the other free points by transformations
 *     sq[1] = board.create('point', [sq[0], right]),
 *     sq[2] = board.create('point', [sq[0], [right, up]]),
 *     sq[3] = board.create('point', [sq[0], up]),
 *
 *     // Polygon through these four points
 *     pol = board.create('polygon', sq, {
 *             fillColor:'blue',
 *             gradient:'radial',
 *             gradientsecondcolor:'white',
 *             gradientSecondOpacity:'0'
 *     }),
 *
 *     p0 = board.create('point', [0, 3], {name: 'angle'}),
 *     // Rotate the square around point sq[0] by dragging A vertically.
 *     rot = board.create('transform', ['Y(angle)', sq[0]], {type: 'rotate'});
 *
 *     // Apply the rotation to all but the first point of the square
 *     rot.bindTo(sq.slice(1));
 *
 * </pre><div class="jxgbox" id="JXGc7f9097e-2ad7-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc7f9097e-2ad7-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Construct a square of side length 2 with the
 *     // help of transformations
 *     var sq = [],
 *         right = board.create('transform', [2, 0], {type: 'translate'}),
 *         up = board.create('transform', [0, 2], {type: 'translate'}),
 *         pol, rot, p0;
 *
 *     // The first point is free
 *     sq[0] = board.create('point', [0, 0], {name: 'Drag me'}),
 *
 *     // Construct the other free points by transformations
 *     sq[1] = board.create('point', [sq[0], right]),
 *     sq[2] = board.create('point', [sq[0], [right, up]]),
 *     sq[3] = board.create('point', [sq[0], up]),
 *
 *     // Polygon through these four points
 *     pol = board.create('polygon', sq, {
 *             fillColor:'blue',
 *             gradient:'radial',
 *             gradientsecondcolor:'white',
 *             gradientSecondOpacity:'0'
 *     }),
 *
 *     p0 = board.create('point', [0, 3], {name: 'angle'}),
 *     // Rotate the square around point sq[0] by dragging A vertically.
 *     rot = board.create('transform', ['Y(angle)', sq[0]], {type: 'rotate'});
 *
 *     // Apply the rotation to all but the first point of the square
 *     rot.bindTo(sq.slice(1));
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Text transformation
 * var p0 = board.create('point', [0, 0], {name: 'p_0'});
 * var p1 = board.create('point', [3, 0], {name: 'p_1'});
 * var txt = board.create('text',[0.5, 0, 'Hello World'], {display:'html'});
 *
 * // If p_0 is dragged, translate p_1 and text accordingly
 * var tOff = board.create('transform', [() => p0.X(), () => p0.Y()], {type:'translate'});
 * tOff.bindTo(txt);
 * tOff.bindTo(p1);
 *
 * // Rotate text around p_0 by dragging point p_1
 * var tRot = board.create('transform', [
 *     () => Math.atan2(p1.Y() - p0.Y(), p1.X() - p0.X()), p0], {type:'rotate'});
 * tRot.bindTo(txt);
 *
 * // Scale text by dragging point "p_1"
 * // We do this by
 * // - moving text by -p_0 (inverse of transformation tOff),
 * // - scale the text (because scaling is relative to (0,0))
 * // - move the text back by +p_0
 * var tOffInv = board.create('transform', [
 *         () => -p0.X(),
 *         () => -p0.Y()
 * ], {type:'translate'});
 * var tScale = board.create('transform', [
 *         // Some scaling factor
 *         () => p1.Dist(p0) / 3,
 *         () => p1.Dist(p0) / 3
 * ], {type:'scale'});
 * tOffInv.bindTo(txt); tScale.bindTo(txt); tOff.bindTo(txt);
 *
 * </pre><div id="JXG50d6d546-3b91-41dd-8c0f-3eaa6cff7e66" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG50d6d546-3b91-41dd-8c0f-3eaa6cff7e66',
 *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
 *     var p0 = board.create('point', [0, 0], {name: 'p_0'});
 *     var p1 = board.create('point', [3, 0], {name: 'p_1'});
 *     var txt = board.create('text',[0.5, 0, 'Hello World'], {display:'html'});
 *
 *     // If p_0 is dragged, translate p_1 and text accordingly
 *     var tOff = board.create('transform', [() => p0.X(), () => p0.Y()], {type:'translate'});
 *     tOff.bindTo(txt);
 *     tOff.bindTo(p1);
 *
 *     // Rotate text around p_0 by dragging point p_1
 *     var tRot = board.create('transform', [
 *         () => Math.atan2(p1.Y() - p0.Y(), p1.X() - p0.X()), p0], {type:'rotate'});
 *     tRot.bindTo(txt);
 *
 *     // Scale text by dragging point "p_1"
 *     // We do this by
 *     // - moving text by -p_0 (inverse of transformation tOff),
 *     // - scale the text (because scaling is relative to (0,0))
 *     // - move the text back by +p_0
 *     var tOffInv = board.create('transform', [
 *             () => -p0.X(),
 *             () => -p0.Y()
 *     ], {type:'translate'});
 *     var tScale = board.create('transform', [
 *             // Some scaling factor
 *             () => p1.Dist(p0) / 3,
 *             () => p1.Dist(p0) / 3
 *     ], {type:'scale'});
 *     tOffInv.bindTo(txt); tScale.bindTo(txt); tOff.bindTo(txt);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createTransform = function (board, parents, attributes) {
    return new JXG.Transformation(board, attributes.type, parents);
};

JXG.registerElement('transform', JXG.createTransform);

/**
 * @class Define projective 3D transformations like translation, rotation, reflection.
 * @pseudo
 * @description A transformation consists of a 4x4 matrix, i.e. it is a projective transformation.
 * <p>
 * Internally, a transformation is applied to an element by multiplying the 4x4 matrix from the left to
 * the homogeneous coordinates of the element. JSXGraph represents homogeneous coordinates in the order
 * (w, x, y, z). If the coordinate is a finite point, w=1. The matrix has the form
 * <pre>
 * ( a b c d)   ( w )
 * ( e f g h) * ( x )
 * ( i j k l)   ( y )
 * ( m n o p)   ( z )
 * </pre>
 * where in general a=1. If b = c = d = 0, the transformation is called <i>affine</i>.
 * In this case, finite points will stay finite. This is not the case for general projective coordinates.
 * <p>
 *
 * @name Transformation3D
 * @augments JXG.Transformation
 * @constructor
 * @type JXG.Transformation
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {number|function|JXG.GeometryElement3D} parameters The parameters depend on the transformation type, supplied as attribute 'type'.
 *  Possible transformation types are
 * <ul>
 * <li> 'translate'
 * <li> 'scale'
 * <li> 'rotate'
 * <li> 'rotateX'
 * <li> 'rotateY'
 * <li> 'rotateZ'
 * </ul>
 * <p>Valid parameters for these types are:
 * <dl>
 * <dt><b><tt>type:"translate"</tt></b></dt><dd><b>x, y, z</b> Translation vector (three numbers or functions).
 * The transformation matrix for x = a, y = b, and z = c has the form:
 * <pre>
 * ( 1  0  0  0)   ( w )
 * ( a  1  0  0) * ( x )
 * ( b  0  1  0)   ( y )
 * ( c  0  0  c)   ( z )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"scale"</tt></b></dt><dd><b>scale_x, scale_y, scale_z</b> Scale vector (three numbers or functions).
 * The transformation matrix for scale_x = a, scale_y = b, scale_z = c has the form:
 * <pre>
 * ( 1  0  0  0)   ( w )
 * ( 0  a  0  0) * ( x )
 * ( 0  0  b  0)   ( y )
 * ( 0  0  0  c)   ( z )
 * </pre>
 * </dd>
 * <dt><b><tt>type:"rotate"</tt></b></dt><dd><b>a, n, [p=[0,0,0]]</b> angle (in radians), normal, [point].
 * Rotate with angle a around the normal vector n through the point p.
 * </dd>
 * <dt><b><tt>type:"rotateX"</tt></b></dt><dd><b>a, [p=[0,0,0]]</b> angle (in radians), [point].
 * Rotate with angle a around the normal vector (1, 0, 0) through the point p.
 * </dd>
 * <dt><b><tt>type:"rotateY"</tt></b></dt><dd><b>a, [p=[0,0,0]]</b> angle (in radians), [point].
 * Rotate with angle a around the normal vector (0, 1, 0) through the point p.
 * </dd>
 * <dt><b><tt>type:"rotateZ"</tt></b></dt><dd><b>a, [p=[0,0,0]]</b> angle (in radians), [point].
 * Rotate with angle a around the normal vector (0, 0, 1) through the point p.
 * </dd>
 * </dl>
 *
 * @example
 * var bound = [-5, 5];
 * var view = board.create('view3d',
 *     [
 *         [-5, -5], [8, 8],
 *         [bound, bound, bound]
 *     ], {
 *         projection: "central",
 *         depthOrder: { enabled: true },
 *         axesPosition: 'border' // 'center', 'none'
 *     }
 * );
 *
 * var slider = board.create('slider', [[-4, 6], [0, 6], [0, 0, 5]]);
 *
 * var p1 = view.create('point3d', [1, 2, 2], { name: 'drag me', size: 5 });
 *
 * // Translate from p1 by fixed amount
 * var t1 = view.create('transform3d', [2, 3, 2], { type: 'translate' });
 * // Translate from p1 by dynamic amount
 * var t2 = view.create('transform3d', [() => slider.Value() + 3, 0, 0], { type: 'translate' });
 *
 * view.create('point3d', [p1, t1], { name: 'translate fixed', size: 5 });
 * view.create('point3d', [p1, t2], { name: 'translate by func', size: 5 });
 *
 * </pre><div id="JXG2409bb0a-90d7-4c1e-ae9f-85e8a776acec" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG2409bb0a-90d7-4c1e-ae9f-85e8a776acec',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var bound = [-5, 5];
 *     var view = board.create('view3d',
 *         [
 *             [-5, -5], [8, 8],
 *             [bound, bound, bound]
 *         ], {
 *             projection: "central",
 *             depthOrder: { enabled: true },
 *             axesPosition: 'border' // 'center', 'none'
 *         }
 *     );
 *
 *     var slider = board.create('slider', [[-4, 6], [0, 6], [0, 0, 5]]);
 *
 *     var p1 = view.create('point3d', [1, 2, 2], { name: 'drag me', size: 5 });
 *
 *     // Translate from p1 by fixed amount
 *     var t1 = view.create('transform3d', [2, 3, 2], { type: 'translate' });
 *     // Translate from p1 by dynamic amount
 *     var t2 = view.create('transform3d', [() => slider.Value() + 3, 0, 0], { type: 'translate' });
 *
 *     view.create('point3d', [p1, t1], { name: 'translate fixed', size: 5 });
 *     view.create('point3d', [p1, t2], { name: 'translate by func', size: 5 });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createTransform3D = function (board, parents, attributes) {
    return new JXG.Transformation(board, attributes.type, parents, true);
};

JXG.registerElement('transform3d', JXG.createTransform3D);

export default JXG.Transformation;

