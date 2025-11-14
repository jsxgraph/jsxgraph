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
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Type from "../utils/type.js";
//, GeometryElement3D) {

/**
 * A 3D text is a basic geometric element.
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
JXG.Text3D = function (view, F, text, slide, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_TEXT3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'text3d');

    this.board.finalizeAdding(this);

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
    this.position = [];

    this._c2d = null;

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Text3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Text3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Text3D.prototype,
    /** @lends JXG.Text3D.prototype */ {
        /**
         * Update the homogeneous coords array.
         *
         * @name updateCoords
         * @memberOf Text3D
         * @function
         * @returns {Object} Reference to the Text3D object
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
         * @returns {Object} Reference to the Text3D object
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
         * @memberOf Text3D
         * @function
         * @returns {Object} Reference to the Text3D object
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
         * @memberOf Text3D
         * @function
         * @param {Array} coords 3D coordinates. Either of the form [x,y,z] (Euclidean) or [w,x,y,z] (homogeneous).
         * @param {Boolean} [noevent] If true, no events are triggered.
         * @returns {Object} Reference to the Text3D object
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
            var c3d, foot, res;

            // Update is called from board.updateElements.
            // See Point3D.update() for the logic.
            if (
                this.element2D.draggable() &&
                Geometry.distance(this._c2d, this.element2D.coords.usrCoords) !== 0
            ) {
                if (this.view.isVerticalDrag()) {
                    // Drag the text in its vertical to the xy plane
                    // If the text is outside of bbox3d,
                    // c3d is already corrected.
                    c3d = this.view.project2DTo3DVertical(this.element2D, this.coords);
                } else {
                    // Drag the text in its xy plane
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
                        this.coords = this.slide.projectCoords([this.X(), this.Y(), this.Z()], this.position);
                        this.element2D.coords.setCoordinates(
                            Const.COORDS_BY_USER,
                            this.view.project3DTo2D(this.coords)
                        );
                    }
                }
            } else {
                this.updateCoords();
                if (this.slide) {
                    this.coords = this.slide.projectCoords([this.X(), this.Y(), this.Z()], this.position);
                }
                // Update 2D text from its 3D view
                c3d = this.coords;
                this.element2D.coords.setCoordinates(
                    Const.COORDS_BY_USER,
                    this.view.project3DTo2D(c3d)
                );
                // this.zIndex = Mat.matVecMult(this.view.matrix3DRotShift, c3d)[3];
                this.zIndex = Mat.innerProduct(this.view.matrix3DRotShift[3], c3d);
                this.element2D.prepareUpdate().update();
            }
            this._c2d = this.element2D.coords.usrCoords.slice();

            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Check whether a text's position is finite, i.e. the first entry is not zero.
         * @returns {Boolean} True if the first entry of the coordinate vector is not zero; false otherwise.
         */
        testIfFinite: function () {
            return Math.abs(this.coords[0]) > Mat.eps ? true : false;
            // return Type.cmpArrays(this.coords, [0, 0, 0, 0]);
        },

        // Not yet working
        __evt__update3D: function (oc) {}
    }
);

/**
 * @class Construct a text element in a 3D view.
 * @pseudo
 * @description A Text3D object is defined by 3 coordinates [x, y, z, text] or an array / function for the position of the text
 * and a string or function defining the text.
 * <p>
 * That is, all numbers can also be provided as functions returning a number.
 * <p>
 * At the time being, text display is independent from the camera view.
 *
 * @name Text3D
 * @augments JXG.Text3D
 * @augments Text
 * @constructor
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 * @param {number,function_number,function_number,function_String,function_JXG.GeometryElement3D} x,y,z,txt,[slide=undefined]
 * The coordinates are given as x, y, z consisting of numbers of functions and the text.
 * If an optional 3D element "slide" is supplied, the point is a glider on that element.
 * @param {array,function_string_JXG.GeometryElement3D}} F,txt,[slide=undefined] Alternatively, the coordinates can be supplied as array or function returning an array.
 * If an optional 3D element "slide" is supplied, the point is a glider on that element.
 *
 * @example
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central'
 *         });
 *
 *     var txt1 = view.create('text3d', [[1, 2, 1], 'hello'], {
 *         fontSize: 20,
 *     });
 *
 * </pre><div id="JXGb61d7c50-617a-4bed-9a45-13c949f90e94" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb61d7c50-617a-4bed-9a45-13c949f90e94',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'central'
 *             });
 *
 *         var txt1 = view.create('text3d', [[1, 2, 1], 'hello'], {
 *             fontSize: 20,
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createText3D = function (board, parents, attributes) {
    var view = parents[0],
        attr, F, slide,
        text,
        c2d, el;

    // If the last element of parents is a 3D object,
    // the point is a glider on that element.
    if (parents.length > 2 && Type.exists(parents[parents.length - 1].is3D)) {
        slide = parents.pop();
    } else {
        slide = null;
    }

    if (parents.length === 3) {
        // [view, array|fun, text] (Array [x, y, z] | function) returning [x, y, z] and string | function
        F = parents[1];
        text = parents[2];
    } else if (parents.length === 5) {
        // [view, x, y, z, text], (3 numbers | functions) sand string | function
        F = parents.slice(1, 4);
        text = parents[4];
    } else {
        throw new Error(
            "JSXGraph: Can't create text3d with parent types '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [[x,y,z], text], [x,y,z, text]"
        );
        //  "\nPossible parent types: [[x,y,z]], [x,y,z], [element,transformation]"); // TODO
    }

    attr = Type.copyAttributes(attributes, board.options, 'text3d');
    el = new JXG.Text3D(view, F, text, slide, attr);
    el.initCoords();

    c2d = view.project3DTo2D(el.coords);

    attr = el.setAttr2D(attr);
    el.element2D = view.create('text', [c2d[1], c2d[2], text], attr);

    el.element2D.view = view;
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    // If this point is a glider, record that in the update tree
    if (el.slide) {
        el.slide.addChild(el);
        el.setParents(el.slide);
    }

    el._c2d = el.element2D.coords.usrCoords.slice(); // Store a copy of the coordinates to detect dragging

    return el;
};

JXG.registerElement("text3d", JXG.createText3D);
