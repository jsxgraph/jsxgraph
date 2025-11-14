/*
    Copyright 2008-2025
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
import Type from "../utils/type.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";

/**
 * A 3D point is the basic geometric element.
 * @class Creates a new 3D point object. Do not use this constructor to create a 3D point. Use {@link JXG.View3D#create} with
 * type {@link Point3D} instead.
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the point is drawn on.
 * @param {Function|Array} F Array of numbers, array of functions or function returning an array with defines the user coordinates of the point.
 * @param {JXG.GeometryElement3D} slide Object the 3D point should be bound to. If null, the point is a free point.
 * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point3d} and
 * {@link JXG.Options#elements}, and optional a name and an id.
 * @see JXG.Board#generateName
 */
JXG.Point3D = function (view, F, slide, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_POINT3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'point3d');

    this.board.finalizeAdding(this);

    // add the new point to its view's point list
    // if (view.visProp.depthorderpoints) {
    //     view.points.push(this);
    // }

    /**
     * Homogeneous coordinates of a Point3D, i.e. array of length 4 containing numbers: [w, x, y, z].
     * Usually, w=1 for finite points and w=0 for points which are infinitely far.
     * If coordinates of the point are supplied as functions, they are resolved in {@link Point3D#updateCoords} into numbers.
     *
     * @example
     *   p.coords;
     *
     * @name Point3D#coords
     * @type Array
     * @private
     */
    this.coords = [0, 0, 0, 0];
    this.initialCoords = [0, 0, 0, 0];

    /**
     * Function or array of functions or array of numbers defining the coordinates of the point, used in {@link updateCoords}.
     *
     * @name Point3D#F
     * @function
     * @private
     *
     * @see updateCoords
     */
    this.F = F;

    /**
     * Optional slide element, i.e. element the Point3D lives on.
     *
     * @example
     *   p.slide;
     *
     * @name Point3D#slide
     * @type JXG.GeometryElement3D
     * @default null
     * @private
     *
     */
    this.slide = slide;

    /**
     * In case, the point is a glider, store the preimage of the coordinates in terms of the parametric definition of the host element.
     * That is, if the host element `slide` is a curve, and the coordinates of the point are equal to `p` and `u = this.position[0]`, then
     * `p = [slide.X(u), slide.Y(u), slide.Z(u)]`.
     *
     * @type Array
     * @private
     */
    this.position = [];

    /**
     * An array of coordinates for moveTo().  An in-progress move can be updated or cancelled by updating or clearing this array.  Use moveTo() instead of
     * accessing this array directly.
     * @type Array
     * @private
     */
    this.movePath = [];
    this.moveCallback = null;
    this.moveInterval = null;


    this._c2d = null;

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};

JXG.Point3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Point3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Point3D.prototype,
    /** @lends JXG.Point3D.prototype */ {

        /**
         * Get x-coordinate of a 3D point.
         *
         * @name X
         * @memberOf Point3D
         * @function
         * @returns {Number}
         *
         * @example
         *   p.X();
         */
        X: function () {
            return this.coords[1];
        },

        /**
         * Get y-coordinate of a 3D point.
         *
         * @name Y
         * @memberOf Point3D
         * @function
         * @returns Number
         *
         * @example
         *   p.Y();
         */
        Y: function () {
            return this.coords[2];
        },

        /**
         * Get z-coordinate of a 3D point.
         *
         * @name Z
         * @memberOf Point3D
         * @function
         * @returns Number
         *
         * @example
         *   p.Z();
         */
        Z: function () {
            return this.coords[3];
        },

        /**
         * Get w-coordinate of a 3D point.
         *
         * @name W
         * @memberOf Point3D
         * @function
         * @returns Number
         *
         * @example
         *   p.W();
         */
        W: function () {
            return this.coords[0];
        },

        /**
         * Update the array {@link JXG.Point3D#coords} containing the homogeneous coords.
         *
         * @name updateCoords
         * @memberOf Point3D
         * @function
         * @returns {Object} Reference to the Point3D object
         * @private
         * @see GeometryElement3D#update()
         * @example
         *    p.updateCoords();
         */
        updateCoords: function () {
            var i,
                s = 0;

            if (Type.isFunction(this.F)) {
                this.coords = Type.evaluate(this.F);
                if (this.coords.length === 3) {
                    this.coords.unshift(1);
                }
            } else {
                if (this.F.length === 3) {
                    this.coords[0] = 1;
                    s = 1;
                }
                for (i = 0; i < this.F.length; i++) {
                    // Attention: if F is array of numbers, coords may not be updated.
                    // Otherwise, dragging will not work anymore.
                    if (Type.isFunction(this.F[i])) {
                        this.coords[s + i] = Type.evaluate(this.F[i]);
                    }
                }
            }

            return this;
        },

        /**
         * Initialize the coords array.
         *
         * @private
         * @returns {Object} Reference to the Point3D object
         */
        initCoords: function () {
            var i,
                s = 0;


            if (Type.isFunction(this.F)) {
                this.coords = Type.evaluate(this.F);
                if (this.coords.length === 3) {
                    this.coords.unshift(1);
                }
            } else {
                if (this.F.length === 3) {
                    this.coords[0] = 1;
                    s = 1;
                }
                for (i = 0; i < this.F.length; i++) {
                    this.coords[s + i] = Type.evaluate(this.F[i]);
                }
            }
            this.initialCoords = this.coords.slice();

            return this;
        },

        /**
         * Normalize homogeneous coordinates such the the first coordinate (the w-coordinate is equal to 1 or 0)-
         *
         * @name normalizeCoords
         * @memberOf Point3D
         * @function
         * @returns {Object} Reference to the Point3D object
         * @private
         * @example
         *    p.normalizeCoords();
         */
        normalizeCoords: function () {
            if (Math.abs(this.coords[0]) > 1.e-14) {
                this.coords[1] /= this.coords[0];
                this.coords[2] /= this.coords[0];
                this.coords[3] /= this.coords[0];
                this.coords[0] = 1.0;
            }
            return this;
        },

        /**
         * Set the position of a 3D point.
         *
         * @name setPosition
         * @memberOf Point3D
         * @function
         * @param {Array} coords 3D coordinates. Either of the form [x,y,z] (Euclidean) or [w,x,y,z] (homogeneous).
         * @param {Boolean} [noevent] If true, no events are triggered (TODO)
         * @returns {Object} Reference to the Point3D object
         *
         * @example
         *    p.setPosition([1, 3, 4]);
         */
        setPosition: function (coords, noevent) {
            var c = this.coords;
            // oc = this.coords.slice(); // Copy of original values

            if (coords.length === 3) {
                // Euclidean coordinates
                c[0] = 1.0;
                c[1] = coords[0];
                c[2] = coords[1];
                c[3] = coords[2];
            } else {
                // Homogeneous coordinates (normalized)
                c[0] = coords[0];
                c[1] = coords[1];
                c[2] = coords[2];
                c[3] = coords[2];
                this.normalizeCoords();
            }

            // console.log(el.emitter, !noevent, oc[0] !== c[0] || oc[1] !== c[1] || oc[2] !== c[2] || oc[3] !== c[3]);
            // Not yet working TODO
            // if (el.emitter && !noevent &&
            //     (oc[0] !== c[0] || oc[1] !== c[1] || oc[2] !== c[2] || oc[3] !== c[3])) {
            //     this.triggerEventHandlers(['update3D'], [oc]);
            // }
            return this;
        },

        // /**
        //  * Add transformations to this element.
        //  * @param {JXG.GeometryElement} el
        //  * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation}
        //  * or an array of {@link JXG.Transformation}s.
        //  * @returns {JXG.CoordsElement} Reference to itself.
        //  */
        addTransform: function (el, transform) {
            this.addTransformGeneric(el, transform);
            return this;
        },

        updateTransform: function () {
            var c, i;

            if (this.transformations.length === 0 || this.baseElement === null) {
                return this;
            }

            if (this === this.baseElement) {
                c = this.initialCoords;
            } else {
                c = this.baseElement.coords;
            }
            for (i = 0; i < this.transformations.length; i++) {
                this.transformations[i].update();
                c = Mat.matVecMult(this.transformations[i].matrix, c);
            }
            this.coords = c;

            return this;
        },

        // Already documented in JXG.GeometryElement
        update: function (drag) {
            var c3d,         // Homogeneous 3D coordinates
                foot, res;

            if (
                this.element2D.draggable() &&
                Geometry.distance(this._c2d, this.element2D.coords.usrCoords) !== 0
            ) {
                // Update is called from board.updateElements, e.g. after manipulating a
                // a slider or dragging a point.
                // Usually this followed by an update call using the other branch below.
                if (this.view.isVerticalDrag()) {
                    // Drag the point in its vertical to the xy plane
                    // If the point is outside of bbox3d,
                    // c3d is already corrected.
                    c3d = this.view.project2DTo3DVertical(this.element2D, this.coords);
                } else {
                    // Drag the point in its xy plane
                    foot = [1, 0, 0, this.coords[3]];
                    c3d = this.view.project2DTo3DPlane(this.element2D, [1, 0, 0, 1], foot);
                }

                if (c3d[0] !== 0) {
                    // Check if c3d is inside of view.bbox3d
                    // Otherwise, the coords are now corrected.
                    res = this.view.project3DToCube(c3d);
                    this.coords = res[0];

                    if (res[1]) {
                        // The 3D coordinates have been corrected, now
                        // also correct the 2D element.
                        this.element2D.coords.setCoordinates(
                            Const.COORDS_BY_USER,
                            this.view.project3DTo2D(this.coords)
                        );
                    }
                    if (this.slide) {
                        this.coords = this.slide.projectCoords([1, this.X(), this.Y(), this.Z()], this.position);
                        this.element2D.coords.setCoordinates(
                            Const.COORDS_BY_USER,
                            this.view.project3DTo2D(this.coords)
                        );
                    }
                }

            } else {
                // Update 2D point from its 3D view, e.g. when rotating the view
                this.updateCoords()
                    .updateTransform();

                if (this.slide) {
                    this.coords = this.slide.projectCoords([1, this.X(), this.Y(), this.Z()], this.position);
                }
                c3d = this.coords;
                this.element2D.coords.setCoordinates(
                    Const.COORDS_BY_USER,
                    this.view.project3DTo2D(c3d)
                );
                // this.zIndex = Mat.matVecMult(this.view.matrix3DRotShift, c3d)[3];
                this.zIndex = Mat.innerProduct(this.view.matrix3DRotShift[3], c3d);
            }
            this._c2d = this.element2D.coords.usrCoords.slice();

            return this;
        },

        // Already documented in JXG.GeometryElement
        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Check whether a point's position is finite, i.e. the first entry is not zero.
         * @returns {Boolean} True if the first entry of the coordinate vector is not zero; false otherwise.
         */
        testIfFinite: function () {
            return Math.abs(this.coords[0]) > 1.e-12 ? true : false;
            // return Type.cmpArrays(this.coords, [0, 0, 0, 0]);
        },

        /**
         * Calculate the distance from one point to another. If one of the points is on the plane at infinity, return positive infinity.
         * @param {JXG.Point3D} pt The point to which the distance is calculated.
         * @returns {Number} The distance
         */
        distance: function (pt) {
            var eps_sq = 1e-12,
                c_this = this.coords,
                c_pt = pt.coords;

            if (c_this[0] * c_this[0] > eps_sq && c_pt[0] * c_pt[0] > eps_sq) {
                return Mat.hypot(
                    c_pt[1] - c_this[1],
                    c_pt[2] - c_this[2],
                    c_pt[3] - c_this[3]
                );
            } else {
                return Number.POSITIVE_INFINITY;
            }
        },



        /**
        * Starts an animated point movement towards the given coordinates <tt>where</tt>.
        * The animation is done after <tt>time</tt> milliseconds.
        * If the second parameter is not given or is equal to 0, coordinates are changed without animation.
        * @param {Array} where Array containing the target coordinate in cartesian or homogenous form.
        * @param {Number} [time] Number of milliseconds the animation should last.
        * @param {Object} [options] Optional settings for the animation
        * @param {function} [options.callback] A function that is called as soon as the animation is finished.
        * @param {String} [options.effect='<>'|'>'|'<'] animation effects like speed fade in and out. possible values are
        * '<>' for speed increase on start and slow down at the end (default), '<' for speed up, '>' for slow down, and '--' for constant speed during
        * the whole animation.
        * @see JXG.Point3D#moveAlong
        * @see JXG.Point#moveTo
        * @example
        * // visit a coordinate, then use callback to visit a second coordinate.
        * const board = JXG.JSXGraph.initBoard('jxgbox')
        * var view = board.create(
        *     'view3d',
        *     [[-6, -3], [8, 8],
        *     [[-3, 3], [-3, 3], [-3, 3]]]);
        *
        *  let A = view.create('point3d', [0, 0, 0]);
        *
        *  // move A with callbacks
        *  board.create('button', [-4, 4.3, 'callbacks', () => {
        *    A.moveTo([3, 3, 3], 3000,
        *       {
        *          callback: () => A.moveTo([-3, -3, -3], 3000, {
        *              callback: () => A.moveTo([0, 0, 0],1000), effect: '<'
        *          }),
        *          effect: '>'
        *       })
        *     }])
        *
        *   // move A with async/await
        *   board.create('button', [-3, 4.3, 'async/await', async () => {
        *       await A.moveTo([3, 3, 3], 3000, { effect: '>' });
        *       await A.moveTo([-3, -3, -3], 3000, { effect: '<' });
        *       A.moveTo([0, 0, 0],1000)
        *   }])
        *  </pre><div id="JXG0f35a50e-e99d-11e8-a1ca-cba3b0c2aad4" class="jxgbox" style="width: 300px; height: 300px;"></div>
        * <script type="text/javascript">
        * {
        * const board = JXG.JSXGraph.initBoard('JXG0f35a50e-e99d-11e8-a1ca-cba3b0c2aad4')
        * var view = board.create(
        *     'view3d',
        *     [[-6, -3], [8, 8],
        *     [[-3, 3], [-3, 3], [-3, 3]]]);
        *
        * let A = view.create('point3d', [0, 0, 0]);
        *  // move A with callbacks
        *  board.create('button', [-4, 4.3, 'callbacks', () => {
        *    A.moveTo([3, 3, 3], 3000,
        *       {
        *          callback: () => A.moveTo([-3, -3, -3], 3000, {
        *              callback: () => A.moveTo([0, 0, 0],1000), effect: '<'
        *          }),
        *          effect: '>'
        *       })
        *     }])
        *
        *   // move A with async/await
        *   board.create('button', [-1, 4.3, 'async/await', async () => {
        *       await A.moveTo([3, 3, 3], 3000, { effect: '>' });
        *       await A.moveTo([-3, -3, -3], 3000, { effect: '<' });
        *       A.moveTo([0, 0, 0],1000)
        *   }])
        * }
        * </script><pre>
        */
        moveTo: function (where, time, options) {
            options = options || {};

            var i,
                steps = Math.ceil(time / this.board.attr.animationdelay),
                X = where[0],
                Y = where[1],
                Z = where[2],
                dX = this.coords[1] - X,
                dY = this.coords[2] - Y,
                dZ = this.coords[3] - Z,
                doneCallback = () => { },
                stepFun;

            if (options.callback)
                doneCallback = options.callback;  // unload


            /** @ignore */
            stepFun = function (i) {
                var x = i / steps;  // absolute progress of the animatin

                if (options.effect) {
                    if (options.effect === "<>") {
                        return Math.pow(Math.sin((x * Math.PI) / 2), 2);
                    }
                    if (options.effect === "<") {   // cubic ease in
                        return x * x * x;
                    }
                    if (options.effect === ">") {   // cubic ease out
                        return 1 - Math.pow(1 - x, 3);
                    }
                    if (options.effect === "==") {
                        return i / steps;       // linear
                    }
                    throw new Error("valid effects are '==', '<>', '>', and '<'.");
                }
                return i / steps;  // default
            };

            // immediate move, no time
            if (
                !Type.exists(time) ||
                time === 0
                // check for tiny move, is this necessary?
                // Math.abs(where.usrCoords[0] - this.coords.usrCoords[0]) > Mat.eps
            ) {
                this.setPosition([X, Y, Z], true);  // no event here
                return this.board.update(this);
            }

            // In case there is no callback and we are already at the endpoint we can stop here
            if (
                !Type.exists(options.callback) &&
                Math.abs(dX) < Mat.eps &&
                Math.abs(dY) < Mat.eps &&
                Math.abs(dZ) < Mat.eps
            ) {
                return this;
            }

            this.animationPath = [];
            for (i = steps; i >= 0; i--) {
                this.animationPath[steps - i] = [
                    X + dX * stepFun(i),
                    Y + dY * stepFun(i),
                    Z + dZ * stepFun(i)
                ];
            }

            return this.moveAlong(this.animationPath, time,
                { callback: doneCallback });

        },

        /**
         * Move along a path defined by an array of coordinates
         * @param {number[][]} [traversePath] Array of path coordinates (either cartesian or homogenous).
         * @param {number} [time] Number of milliseconds the animation should last.
         * @param {Object} [options] 'callback' and 'interpolate'.  see {@link JXG.CoordsElement#moveAlong},
         * @example
         *const board = JXG.JSXGraph.initBoard('jxgbox')
         *var view = board.create(
         *    'view3d',
         *    [[-6, -3], [8, 8],
         *    [[-3, 3], [-3, 3], [-3, 3]]]);
         *
         * board.create('button', [-4, 4.5, 'start', () => {
         *      let A = view.create('point3d', [0, 0, 0]);
         *      A.moveAlong([[3, 3, 3], [-2, -1, -2], [-1, -1, -1], [-1, -2, 1]], 3000,
         *         { callback: () => board.create('text', [-4, 4, 'done!']) })
         *}])
         *
         * </pre><div id="JXGa45032e5-a517-4f1d-868a-abc698d344cf" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         * const board = JXG.JSXGraph.initBoard("JXGa45032e5-a517-4f1d-868a-abc698d344cf")
         * var view = board.create(
         *     'view3d',
         *     [[-6, -3], [8, 8],
         *     [[-3, 3], [-3, 3], [-3, 3]]]);
         *
         * board.create('button', [-4, 4.5, 'start', () => {
         *      let A = view.create('point3d', [0, 0, 0]);
         *      A.moveAlong([[3, 3, 3], [-2, -1, -2], [-1, -1, -1], [-1, -2, 1]], 3000,
         *       { callback: () => board.create('text', [-4, 4, 'done!']) })
         * }])
         *
         * })();
         *
         * </script><pre>
         *
         */
        moveAlong: function (traversePath, time, options) {
            let stepTime = time/traversePath.length;   // will be same as this.board.attr.animationdelay if called by MoveTo


            // unload the options
            if (Type.isObject(options)) {
                if ('callback' in options)
                    this.moveCallback = options.callback;
                // TODO:add interpolation using Neville.  How?  easiest is add interpolation to path before start
                // if ('interpolate' in options) interpolate = options.interpolate;
            }


            if (this.movePath.length > 0) {         // existing move in progress
                this.movePath = traversePath;       // set the new path and return ??
                return;                             // promise is still outstanding
            }

            // no move currently in progress
            this.movePath = traversePath;           // set the new path and return a promise
            return new Promise((resolve, reject) => {
                this.moveInterval = setInterval(() => {
                    if (this.movePath.length > 0) {
                        let coord = this.movePath.shift();
                        this.setPosition(coord, true);  // no events during transit
                        this.board.update(this);
                    }
                    if (this.movePath.length === 0) {   // now shorter than previous test
                        clearInterval(this.moveInterval);
                        resolve();
                        if (Type.isFunction(this.moveCallback)) {
                            this.moveCallback(); // invoke the callback
                        }
                    }
                }, stepTime);
            });
        },




        // Not yet working
        __evt__update3D: function (oc) { }
    }
);

/**
 * @class A Point3D object is defined by three coordinates [x,y,z], or a function returning an array with three numbers.
 * Alternatively, all numbers can also be provided as functions returning a number.
 *
 * @pseudo
 * @name Point3D
 * @augments JXG.Point3D
 * @constructor
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 * @param {number,function_number,function_number,function_JXG.GeometryElement3D} x,y,z,[slide=undefined] The coordinates are given as x, y, z consisting of numbers or functions.
 * If an optional 3D element "slide" is supplied, the point is a glider on that element. At the time of version v1.11, only elements of type line3d are supperted as glider hosts.
 * @param {array,function_JXG.GeometryElement3D} F,[slide=null] Alternatively, the coordinates can be supplied as
 *  <ul>
 *   <li>function returning an array [x,y,z] of length 3 of numbers or
 *   <li>array arr=[x,y,z] of length 3 consisting of numbers
 * </ul>
 * If an optional 3D element "slide" is supplied, the point is a glider on that element.
 *
 * @example
 *    var bound = [-5, 5];
 *    var view = board.create('view3d',
 *        [[-6, -3], [8, 8],
 *        [bound, bound, bound]],
 *        {});
 *    var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *    var q = view.create('point3d', function() { return [p.X(), p.Y(), p.Z() - 3]; }, { name:'B', size: 3, fixed: true });
 *    var w = view.create('point3d', [ () => p.X() + 3, () => p.Y(), () => p.Z() - 2], { name:'C', size: 3, fixed: true });
 *
 * </pre><div id="JXGb9ee8f9f-3d2b-4f73-8221-4f82c09933f1" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb9ee8f9f-3d2b-4f73-8221-4f82c09933f1',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-5, 5];
 *         var view = board.create('view3d',
 *             [[-6, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {});
 *         var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *         var q = view.create('point3d', function() { return [p.X(), p.Y(), p.Z() - 3]; }, { name:'B', size: 3 });
 *         var w = view.create('point3d', [ () => p.X() + 3, () => p.Y(), () => p.Z() - 2], { name:'C', size: 3, fixed: true });
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     // Glider on sphere
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *             yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *             zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *         }
 *     );
 *
 *     // Two points
 *     var center = view.create('point3d', [0, 0, 0], {withLabel: false, size: 2});
 *     var point = view.create('point3d', [2, 0, 0], {withLabel: false, size: 2});
 *
 *     // Sphere
 *     var sphere = view.create('sphere3d', [center, point], {fillOpacity: 0.8});
 *
 *     // Glider on sphere
 *     var glide = view.create('point3d', [2, 2, 0, sphere], {withLabel: false, color: 'red', size: 4});
 *     var l1 = view.create('line3d', [glide, center], { strokeWidth: 2, dash: 2 });
 *
 * </pre><div id="JXG672fe3c7-e6fd-48e0-9a24-22f51f2dfa71" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG672fe3c7-e6fd-48e0-9a24-22f51f2dfa71',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *         var view = board.create(
 *             'view3d',
 *             [[-6, -3], [8, 8],
 *             [[-3, 3], [-3, 3], [-3, 3]]],
 *             {
 *                 depthOrder: {
 *                     enabled: true
 *                 },
 *                 projection: 'central',
 *                 xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *             }
 *         );
 *
 *         // Two points
 *         var center = view.create('point3d', [0, 0, 0], {withLabel: false, size: 2});
 *         var point = view.create('point3d', [2, 0, 0], {withLabel: false, size: 2});
 *
 *         // Sphere
 *         var sphere = view.create('sphere3d', [center, point], {fillOpacity: 0.8});
 *
 *         // Glider on sphere
 *         var glide = view.create('point3d', [2, 2, 0, sphere], {withLabel: false, color: 'red', size: 4});
 *         var l1 = view.create('line3d', [glide, center], { strokeWidth: 2, dash: 2 });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createPoint3D = function (board, parents, attributes) {
    //   parents[0]: view
    // followed by
    //   parents[1]: function or array
    // or
    //   parents[1..3]: coordinates

    var view = parents[0],
        attr, F, slide, c2d, el,
        base = null,
        transform = null;

    // If the last element of `parents` is a 3D object,
    // the point is a glider on that element.
    if (parents.length > 2 &&
        Type.exists(parents[parents.length - 1].is3D) &&
        !Type.isTransformationOrArray(parents[parents.length - 1])
    ) {
        slide = parents.pop();
    } else {
        slide = null;
    }

    if (parents.length === 2) {
        // [view, array|fun] (Array [x, y, z] | function) returning [x, y, z]
        F = parents[1];
    } else if (parents.length === 3 &&
        Type.isPoint3D(parents[1]) &&
        Type.isTransformationOrArray(parents[2])
    ) {
        F = [0, 0, 0];
        base = parents[1];
        transform = parents[2];
    } else if (parents.length === 4) {
        // [view, x, y, z], (3 numbers | functions)
        F = parents.slice(1);
    } else if (parents.length === 5) {
        // [view, w, x, y, z], (4 numbers | functions)
        F = parents.slice(1);
    } else {
        throw new Error(
            "JSXGraph: Can't create point3d with parent types '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'." +
            "\nPossible parent types: [[x,y,z]], [x,y,z], or [[x,y,z], slide], () => [x, y, z], or [point, transformation(s)]"
        );
        //  "\nPossible parent types: [[x,y,z]], [x,y,z], [element,transformation]"); // TODO
    }

    attr = Type.copyAttributes(attributes, board.options, 'point3d');
    el = new JXG.Point3D(view, F, slide, attr);
    el.initCoords();
    if (base !== null && transform !== null) {
        el.addTransform(base, transform);
    }

    c2d = view.project3DTo2D(el.coords);

    attr = el.setAttr2D(attr);
    el.element2D = view.create('point', c2d, attr);
    el.element2D.view = view;
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    // If this point is a glider, record that in the update tree
    if (el.slide) {
        el.slide.addChild(el);
        el.setParents(el.slide);
    }
    if (base) {
        el.setParents(base);
    }

    el._c2d = el.element2D.coords.usrCoords.slice(); // Store a copy of the coordinates to detect dragging

    return el;
};

JXG.registerElement("point3d", JXG.createPoint3D);

