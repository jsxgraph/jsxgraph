/*
    Copyright 2008-2013
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/*depends:
 jxg
 base/constants
 math/math
 utils/type
 */

/**
 * @fileoverview This file contains code for transformations of geometrical objects. 
 * @author graphjs
 * @version 0.1
 */

define([
    'jxg', 'base/constants', 'math/math', 'utils/type'
], function (JXG, Const, Mat, Type) {

    "use strict";

    /**
     * Possible types:
     * - translate
     * - scale
     * - reflect
     * - rotate
     * - shear
     * - generic
     *
     * Rotation matrix:
     * ( 1    0           0   )
     * ( 0    cos(a)   -sin(a))
     * ( 0    sin(a)   cos(a) )
     *
     * Translation matrix:
     * ( 1  0  0)
     * ( a  1  0)
     * ( b  0  1)
     */
    JXG.Transformation = function (board, type, params) {
        this.elementClass = Const.OBJECT_CLASS_OTHER;
        this.matrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        this.board = board;
        this.isNumericMatrix = false;
        this.setMatrix(board, type, params);

        this.methodMap = {
            apply: 'apply',
            applyOnce: 'applyOnce',
            bindTo: 'bindTo',
            bind: 'bind',
            melt: 'melt'
        };
    };

    JXG.Transformation.prototype = {};

    JXG.extend(JXG.Transformation.prototype, /** @lends JXG.Transformation.prototype */ {
        update: function () {
            return this;
        },

        /**
         * Set the transformation matrix for different
         * types of standard transforms
         */
        setMatrix: function (board, type, params) {
            var i;

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
                    var x, y, z, xoff, yoff, d,
                        v, p;
                    // Determine homogeneous coordinates of reflections axis
                    // line
                    if (params.length === 1) {
                        v = params[0].stdform;
                    // two points
                    } else if (params.length === 2) {
                        v = Mat.crossProduct(params[1].coords.usrCoords, params[0].coords.usrCoords);
                    // two points coordinates [px,py,qx,qy]
                    } else if (params.length === 4) {
                        v = Mat.crossProduct(
                            [1, this.evalParam(2), this.evalParam(3)],
                            [1, this.evalParam(0), this.evalParam(1)]
                        );
                    }

                    // Project origin to the line.  This gives a finite point p
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
                    y =  v[1];

                    this.matrix[1][1] = (x * x - y * y) / d;
                    this.matrix[1][2] = 2 * x * y / d;
                    this.matrix[2][1] = this.matrix[1][2];
                    this.matrix[2][2] = -this.matrix[1][1];
                    this.matrix[1][0] = xoff * (1 - this.matrix[1][1]) - yoff * this.matrix[1][2];
                    this.matrix[2][0] = yoff * (1 - this.matrix[2][2]) - xoff * this.matrix[2][1];
                };
            } else if (type === 'rotate') {
                // angle, x, y
                if (params.length === 3) {
                    this.evalParam = Type.createEvalFunction(board, params, 3);
                // angle, p or angle
                } else if (params.length > 0 && params.length <= 2) {
                    this.evalParam = Type.createEvalFunction(board, params, 1);

                    if (params.length === 2) {
                        params[1] = board.select(params[1]);
                    }
                }

                this.update = function () {
                    var x, y,
                        beta = this.evalParam(0),
                        co = Math.cos(beta),
                        si = Math.sin(beta);

                    this.matrix[1][1] =  co;
                    this.matrix[1][2] = -si;
                    this.matrix[2][1] =  si;
                    this.matrix[2][2] =  co;

                    // rotate around [x,y] otherwise rotate around [0,0]
                    if (params.length > 1) {
                        if (params.length === 3) {
                            x = this.evalParam(1);
                            y = this.evalParam(2);
                        } else {
                            x = params[1].X();
                            y = params[1].Y();
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
            }
        },

        /**
         * Transform a GeometryElement:
         * Update the matrix first, then do the matrix-vector-multiplication
         * @param {JXG.GeometryElement} p element which is transformed
         * @param {String} self Apply the transformation to the initialCoords instead of the coords if this is set.
         * @returns {Array}
         */
        apply: function (p, self) {
            this.update();

            if (Type.exists(self)) {
                return Mat.matVecMult(this.matrix, p.initialCoords.usrCoords);
            }
            return Mat.matVecMult(this.matrix, p.coords.usrCoords);
        },

        /**
         * Apply a transformation once to a GeometryElement.
         * If it is a free point, then it can be dragged around later
         * and will overwrite the transformed coordinates.
         * @param {JXG.Point,Array} p
         */
        applyOnce: function (p) {
            var c, len, i;

            if (!Type.isArray(p)) {
                p = [p];
            }

            len = p.length;

            for (i = 0; i < len; i++) {
                this.update();
                c = Mat.matVecMult(this.matrix, p[i].coords.usrCoords);
                p[i].coords.setCoordinates(Const.COORDS_BY_USER, c);
            }
        },

        /**
         * Bind a transformation to a GeometryElement
         */
        bindTo: function (p) {
            var i, len;
            if (Type.isArray(p)) {
                len = p.length;

                for (i = 0; i < len; i++) {
                    p[i].transformations.push(this);
                }
            } else {
                p.transformations.push(this);
            }
        },

        /**
         * @deprecated Use setAttribute
         * @param term
         */
        setProperty: function (term) { },

        setAttribute: function (term) { },

        /**
         * Multiplication of a transformation t from the right.
         * this = t join this
         */
        melt: function (t) {
            var res = [], i, len, len0, k, s, j;

            len = t.matrix.length;
            len0 = this.matrix[0].length;

            for (i = 0; i < len; i++) {
                res[i] = [];
            }

            this.update();
            t.update();

            for (i = 0; i < len; i++) {
                for (j = 0; j < len0; j++) {
                    s = 0;
                    for (k = 0; k < len; k++) {
                        s += t.matrix[i][k] * this.matrix[k][j];
                    }
                    res[i][j] = s;
                }
            }

            this.update = function () {
                var len = this.matrix.length,
                    len0 = this.matrix[0].length;

                for (i = 0; i < len; i++) {
                    for (j = 0; j < len0; j++) {
                        this.matrix[i][j] = res[i][j];
                    }
                }
            };
            return this;
        }
    });

    JXG.createTransform = function (board, parents, attributes) {
        return new JXG.Transformation(board, attributes.type, parents);
    };

    JXG.registerElement('transform', JXG.createTransform);

    return {
        Transformation: JXG.Transformation,
        createTransform: JXG.createTransform
    };
});
