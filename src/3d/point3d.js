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
//, GeometryElement3D) {

/**
 * A 3D point is the basic geometric element.
 * @class Creates a new 3D point object. Do not use this constructor to create a 3D point. Use {@link JXG.View3D#create} with
 * type {@link Point3D} instead.
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the point is drawn on.
 * @param {Function|Array} F Array of numbers, array of functions or function returning an array with defines the user coordinates of the point.
 * @parame {JXG.GeometryElement3D} slide Object the 3D point should be bound to. If null, the point is a free point.
 * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point3d} and
 * {@link JXG.Options#elements}, and optional a name and an id.
 * @see JXG.Board#generateName
 */
JXG.Point3D = function (view, F, slide, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_POINT3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "point3d");

    this.board.finalizeAdding(this);

    // add the new point to its view's point list
    if (view.visProp.depthorderpoints) {
        view.points.push(this);
    }

    /**
     * Homogeneous coordinates of a Point3D, i.e. array of length 4: [w, x, y, z]. Usually, w=1 for finite points and w=0 for points
     * which are infinitely far.
     *
     * @example
     *   p.coords;
     *
     * @name Point3D#coords
     * @type Array
     * @private
     */
    this.coords = [0, 0, 0, 0];

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
    this.X = function () {
        return this.coords[1];
    };

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
    this.Y = function () {
        return this.coords[2];
    };

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
    this.Z = function () {
        return this.coords[3];
    };

    /**
     * Store the last position of the 2D point for the optimizer.
     *
     * @type Array
     * @private
     */
    this._params = [];

    this._c2d = null;

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Point3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Point3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Point3D.prototype,
    /** @lends JXG.Point3D.prototype */ {
        /**
         * Update the homogeneous coords array.
         *
         * @name updateCoords
         * @memberOf Point3D
         * @function
         * @returns {Object} Reference to the Point3D object
         * @private
         * @example
         *    p.updateCoords();
         */
        updateCoords: function () {
            var i;

            if (Type.isFunction(this.F)) {
                // this.coords = [1].concat(Type.evaluate(this.F));
                this.coords = Type.evaluate(this.F);
                this.coords.unshift(1);
            } else {
                this.coords[0] = 1;
                for (i = 0; i < 3; i++) {
                    // Attention: if F is array of numbers, coords are not updated.
                    // Otherwise, dragging will not work anymore.
                    if (Type.isFunction(this.F[i])) {
                        this.coords[i + 1] = Type.evaluate(this.F[i]);
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
            var i;

            if (Type.isFunction(this.F)) {
                // this.coords = [1].concat(Type.evaluate(this.F));
                this.coords = Type.evaluate(this.F);
                this.coords.unshift(1);
            } else {
                this.coords[0] = 1;
                for (i = 0; i < 3; i++) {
                    this.coords[i + 1] = Type.evaluate(this.F[i]);
                }
            }
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
            if (Math.abs(this.coords[0]) > Mat.eps) {
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
         * @param {Boolean} [noevent] If true, no events are triggered.
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

        update: function (drag) {
            var c3d, foot;

            // Update is called from two methods:
            // Once in setToPosition and
            // once in the subsequent board.update
            if (
                this.element2D.draggable() &&
                Geometry.distance(this._c2d, this.element2D.coords.usrCoords) !== 0
            ) {
                if (this.slide) {
                    this.coords = this.slide.projectScreenCoords(
                        [this.element2D.X(), this.element2D.Y()],
                        this._params
                    );
                    this.element2D.coords.setCoordinates(
                        Const.COORDS_BY_USER,
                        this.view.project3DTo2D(this.coords)
                    );
                } else {
                    if (this.view.isVerticalDrag()) {
                        // Drag the point in its vertical to the xy plane
                        c3d = this.view.project2DTo3DVertical(this.element2D, this.coords);
                    } else {
                        // Drag the point in its xy plane
                        foot = [1, 0, 0, this.coords[3]];
                        c3d = this.view.project2DTo3DPlane(this.element2D, [1, 0, 0, 1], foot);
                    }
                    if (c3d[0] !== 0) {
                        this.coords = this.view.project3DToCube(c3d);
                    }
                }
            } else {
                this.updateCoords();
                if (this.slide) {
                    this.coords = this.slide.projectCoords(
                        [this.X(), this.Y(), this.Z()],
                        this._params
                    );
                }
                // Update 2D point from its 3D view
                this.element2D.coords.setCoordinates(
                    Const.COORDS_BY_USER,
                    this.view.project3DTo2D([1, this.X(), this.Y(), this.Z()])
                );
            }
            this._c2d = this.element2D.coords.usrCoords.slice();

            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Check whether a point's homogeneous coordinate vector is zero.
         * @returns {Boolean} True if the coordinate vector is zero; false otherwise.
         */
        isIllDefined: function () {
            return Type.cmpArrays(this.coords, [0, 0, 0, 0]);
        },

        /**
         * Calculate the distance from one point to another. If one of the points is on the plane at infinity, return positive infinity.
         * @param {JXG.Point3D} pt The point to which the distance is calculated.
         * @returns {Number} The distance
         */
        distance: function (pt) {
            var eps_sq = Mat.eps * Mat.eps,
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

        // Not yet working
        __evt__update3D: function (oc) {}
    }
);

/**
 * @class This element is used to provide a constructor for a 3D Point.
 * @pseudo
 * @description A Point3D object is defined by 3 coordinates [x,y,z].
 * <p>
 * All numbers can also be provided as functions returning a number.
 *
 * @name Point3D
 * @augments JXG.Point3D
 * @constructor
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 * @param {number,function_number,function_number,function} x,y,z The coordinates are given as x, y, z consisting of numbers of functions.
 * @param {array,function} F Alternatively, the coordinates can be supplied as
 *  <ul>
 *   <li>array arr=[x,y,z] of length 3 consisting of numbers or
 *   <li>function returning an array [x,y,z] of length 3 of numbers.
 * </ul>
 *
 * @example
 *    var bound = [-5, 5];
 *    var view = board.create('view3d',
 *        [[-6, -3], [8, 8],
 *        [bound, bound, bound]],
 *        {});
 *    var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *    var q = view.create('point3d', function() { return [p.X(), p.Y(), p.Z() - 3]; }, { name:'B', size: 5, fixed: true });
 *
 * </pre><div id="JXGb9ee8f9f-3d2b-4f73-8221-4f82c09933f1" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb9ee8f9f-3d2b-4f73-8221-4f82c09933f1',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *         var bound = [-5, 5];
 *         var view = board.create('view3d',
 *             [[-6, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {});
 *         var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *         var q = view.create('point3d', function() { return [p.X(), p.Y(), p.Z() - 3]; }, { name:'B', size: 5 });
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
        attr, F, slide, c2d, el;

    // If the last element of parents is a 3D object,
    // the point is a glider on that element.
    if (parents.length > 2 && Type.exists(parents[parents.length - 1].is3D)) {
        slide = parents.pop();
    } else {
        slide = null;
    }

    if (parents.length === 2) {
        // [view, array|fun] (Array [x, y, z] | function) returning [x, y, z]
        F = parents[1];
    } else if (parents.length === 4) {
        // [view, x, y, z], (3 numbers | functions)
        F = parents.slice(1);
    } else {
        throw new Error(
            "JSXGraph: Can't create point3d with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [[x,y,z]], [x,y,z]"
        );
        //  "\nPossible parent types: [[x,y,z]], [x,y,z], [element,transformation]"); // TODO
    }

    attr = Type.copyAttributes(attributes, board.options, 'point3d');
    el = new JXG.Point3D(view, F, slide, attr);
    el.initCoords();

    c2d = view.project3DTo2D(el.coords);

    attr = el.setAttr2D(attr);
    el.element2D = view.create('point', c2d, attr);
    el.element2D.view = view;
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    // if this point is a glider, record that in the update tree
    if (el.slide) {
        el.slide.addChild(el);
        el.setParents(el.slide);
    }

    el._c2d = el.element2D.coords.usrCoords.slice(); // Store a copy of the coordinates to detect dragging

    return el;
};

JXG.registerElement("point3d", JXG.createPoint3D);
