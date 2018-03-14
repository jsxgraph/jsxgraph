/*
    Copyright 2008-2018
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
 */

define([
    'jxg', 'base/constants', 'math/math', 'utils/type'
], function (JXG, Const, Mat, Type) {

    "use strict";

    /**
     * A transformation consists of a 3x3 matrix, i.e. it is a projective transformation.
     * @class Creates a new transformation object. Do not use this constructor to create a transformation. Use {@link JXG.Board#create} with
     * type {@link Transformation} instead.
     * @constructor
     * @param {JXG.Board} board The board the new circle is drawn on.
     * @param {String} type Can be
     * <ul><li> 'translate'
     * <li> 'scale'
     * <li> 'reflect'
     * <li> 'rotate'
     * <li> 'shear'
     * <li> 'generic'
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
    JXG.Transformation = function (board, type, params) {
        this.elementClass = Const.OBJECT_CLASS_OTHER;
        this.type = Const.OBJECT_TYPE_TRANSFORMATION;
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
        /**
         * @private
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
         * <p>These are
         * @param {Array} x,y Shift vector (number or function) in case of 'translate'.
         * @param {Array} scale_x,scale_y Scale vector (number or function) in case of 'scale'.
         * @param {Array} line|point_pair|"four coordinates" In case of 'reflect' the parameters could
         *                be a line, a pair of points or four number (or functions) p_x, p_y, q_x, q_y,
         *                determining a line through points (p_x, p_y) and (q_x, q_y).
         * @param {Array} angle,x,y|angle,[x,y] In case of 'rotate' the parameters are an angle or angle function,
         *                returning the angle in Radians and - optionally - a coordinate pair or a point defining the
         *                returning the angle in Radians and - optionally - a coordinate pair defining the
         *                rotation center. If the rotation center is not given, the transformation rotates around (0,0).
         * @param {Array} shear_x,shear_y Shear vector (number or function) in case of 'shear'.
         * @param {Array} a,b,c,d,e,f,g,h,i Nine matrix entries (numbers or functions) for a generic
         *                projective transformation  in case of 'generic'.
         *
         * <p>A transformation with a generic matrix looks like:
         * <pre>
         * ( a  b  c )   ( z )
         * ( d  e  f ) * ( x )
         * ( g  h  i )   ( y )
         * </pre>
         *
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

                    if (params.length === 2 && !Type.isArray(params[1])) {
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
            }
        },

        /**
         * Transform a GeometryElement:
         * First, the transformation matrix is updated, then do the matrix-vector-multiplication.
         * @param {JXG.GeometryElement} p element which is transformed
         * @param {String} 'self' Apply the transformation to the initialCoords instead of the coords if this is set.
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
         * Applies a transformation once to a GeometryElement or an array of elements.
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
         * Binds a transformation to a GeometryElement or an array of elements. In every update of the
         * GeometryElement(s), the transformation is executed. That means, in order to immediately
         * apply the transformation, a call of board.update() has to follow.
         * @param  {Array,JXG.Object} p JXG.Object or array of JXG.Object to
         *                            which the transformation is bound to.
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
         * Unused
         * @deprecated Use setAttribute
         * @param term
         */
        setProperty: function (term) {
            JXG.deprecated('Transformation.setProperty()', 'Transformation.setAttribute()');
        },

        /**
         * Empty method. Unused.
         * @param {Object} term Key-value pairs of the attributes.
         */
        setAttribute: function (term) { },

        /**
         * Combine two transformations to one transformation. This only works if
         * both of the transformation matrices consist solely of numbers, and do not
         * contain functions.
         *
         * Multiplies the transformation with a transformation t from the left.
         * i.e. (this) = (t) join (this)
         * @param  {JXG.Transform} t Transformation which is the left multiplicand
         * @returns {JXG.Transform} the transformation object.
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
        },

        // documented in element.js
        // Not yet, since transformations are not listed in board.objects.
        getParents: function () {
            var p = [[].concat.apply([], this.matrix)];

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        }

    });

    /**
     * @class This element is used to provide projective transformations.
     * @pseudo
     * @description A transformation consists of a 3x3 matrix, i.e. it is a projective transformation.
     * @name Transformation
     * @augments JXG.Transformation
     * @constructor
     * @type JXG.Transformation
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {number,function} The parameters depend on the transformation type, supplied as attribute 'type'.
     * Possible transformation types are
     * <ul><li> 'translate'
     * <li> 'scale'
     * <li> 'reflect'
     * <li> 'rotate'
     * <li> 'shear'
     * <li> 'generic'
     * </ul>
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
     * <p>Generic transformation:
     * <pre>
     * ( a  b  c )   ( z )
     * ( d  e  f ) * ( x )
     * ( g  h  i )   ( y )
     * </pre>
     *
     * @example
     * // The point B is determined by taking twice the vector A from the origin
     *
     * var p0 = board.create('point', [0, 3], {name: 'A'}),
     *     t = board.create('transform', [function(){ return p0.X(); }, "Y(A)"], {type: 'translate'}),
     *     p1 = board.create('point', [p0, t], {color: 'blue'});
     *
     * </pre><div class="jxgbox" id="14167b0c-2ad3-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('14167b0c-2ad3-11e5-8dd9-901b0e1b8723',
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
     * </pre><div class="jxgbox" id="a6827a72-2ad3-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('a6827a72-2ad3-11e5-8dd9-901b0e1b8723',
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
     * </pre><div class="jxgbox" id="747cf11e-2ad4-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('747cf11e-2ad4-11e5-8dd9-901b0e1b8723',
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
     * </pre><div class="jxgbox" id="f516d3de-2ad5-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('f516d3de-2ad5-11e5-8dd9-901b0e1b8723',
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
     * </pre><div class="jxgbox" id="6f374a04-2ad6-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('6f374a04-2ad6-11e5-8dd9-901b0e1b8723',
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
     * // One time application of a transform to points A, B
     * var p1 = board.create('point', [1, 1]),
     *     p2 = board.create('point', [1, 1]),
     *     t = board.create('transform', [3, 2], {type: 'shear'});
     * t.applyOnce([p1, p2]);
     *
     * </pre><div class="jxgbox" id="b6cee1c4-2ad6-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('b6cee1c4-2ad6-11e5-8dd9-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
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
     *     // Rotate the square around point sq[0] by dragging A
     *     rot = board.create('transform', ['Y(angle)', sq[0]], {type: 'rotate'});
     *
     *     // Apply the rotation to all but the first point of the square
     *     rot.bindTo(sq.slice(1));
     *
     * </pre><div class="jxgbox" id="c7f9097e-2ad7-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('c7f9097e-2ad7-11e5-8dd9-901b0e1b8723',
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
     *     // Rotate the square around point sq[0] by dragging A
     *     rot = board.create('transform', ['Y(angle)', sq[0]], {type: 'rotate'});
     *
     *     // Apply the rotation to all but the first point of the square
     *     rot.bindTo(sq.slice(1));
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

    return {
        Transformation: JXG.Transformation,
        createTransform: JXG.createTransform
    };
});
