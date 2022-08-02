/*
    Copyright 2008-2022
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */
/*global JXG:true, define: true*/

define(['jxg', 'base/constants', 'math/math', 'math/geometry', 'utils/type' //, '3d/element3d'
], function (JXG, Const, Mat, Geometry, Type) { //, GeometryElement3D) {
    "use strict";

    /**
     * A 3D point is the basic geometric element. Based on points lines and circles can be constructed which can be intersected
     * which in turn are points again which can be used to construct new lines, circles, polygons, etc. This class holds methods for
     * all kind of points like free points, gliders, and intersection points.
     * @class Creates a new 3D point object. Do not use this constructor to create a 3D point. Use {@link JXG.Board#create} with
     * type {@link Point3D} instead.
     * @augments JXG.GeometryElement3D
     * @augments JXG.GeometryElement
     * @param {JXG.View3D} view The 3D view the point is drawn on.
     * @param {Array} coordinates An array with the user coordinates of the point.
     * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point3d} and
     * {@link JXG.Options#elements}, and optional a name and an id.
     * @see JXG.Board#generateName
     */
    JXG.Point3D = function (view, coordinates, attributes) {
        this.constructor(view.board, attributes, Const.OBJECT_TYPE_POINT, Const.OBJECT_CLASS_POINT);
        this.constructor3D(view, 'point3d');

        this.id = this.view.board.setId(this, 'P3D');
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
        this.coords = [1, 0, 0, 0];

        /**
         * Optional slide element, i.e. element the Point3D lives on.
         *
         * @example
         *   p.slide;
         *
         * @name Point3D#slide
         * @type {JXG.GeometryElement}
         * @default null
         * @private
         *
         */
        this.slide = null;

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
        this.X = function () { return this.coords[1]; };

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
        this.Y = function () { return this.coords[2]; };

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
        this.Z = function () { return this.coords[3]; };

        /**
         * Store the last position of the 2D point for the optimizer.
         *
         * @type array
         * @private
         */
        this._params = null;
    };
    JXG.Point3D.prototype = new JXG.GeometryElement();
    Type.copyPrototypeMethods(JXG.Point3D, JXG.GeometryElement3D, 'constructor3D');

    JXG.extend(JXG.Point3D.prototype, /** @lends JXG.Point3D.prototype */ {
        /**
         * Update the the homogeneous coords array.
         *
         * @name updateCoords
         * @memberOf Point3D
         * @function
         * @returns {Object} Reference to the D3 subobject
         * @private
         * @example
         *    p.updateCoords();
         */
        updateCoords: function () {
            var res, i;

            if (Type.isFunction(this.F)) {
                res = Type.evaluate(this.F);
                this.coords = [1, res[0], res[1], res[2]];
            } else {
                this.coords[0] = 1;
                for (i = 0; i < 3; i++) {
                    if (Type.isFunction(this.F[i])) {
                        this.coords[i + 1] = Type.evaluate(this.F[i]);
                    }
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
         * @returns {Object} Reference to the D3 subobject
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
         * @returns {Object} Reference to the D3 subobject
         *
         * @example
         *    p.setPosition([1, 3, 4]);
         */
        setPosition: function (coords, noevent) {
            var c = this.coords,
                oc = this.coords.slice(); // Copy of original values

            if (coords.length === 3) { // Euclidean coordinates
                c[0] = 1.0;
                c[1] = coords[0];
                c[2] = coords[1];
                c[3] = coords[2];
            } else { // Homogeneous coordinates (normalized)
                c[0] = coords[0];
                c[1] = coords[1];
                c[2] = coords[2];
                c[3] = coords[2];
                this.normalizeCoords();
            }

            // console.log(el.emitter, !noevent, oc[0] !== c[0] || oc[1] !== c[1] || oc[2] !== c[2] || oc[3] !== c[3]);
            // Not yet working
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
            if (this.element2D.draggable() &&
                Geometry.distance(this._c2d, this.element2D.coords.usrCoords) !== 0) {

                if (this.slide) {
                    this.projectCoords2Surface();
                } else {
                    // Drag the point in its xy plane
                    foot = [1, 0, 0, this.coords[3]];
                    c3d = this.view.project2DTo3DPlane(this.element2D, [1, 0, 0, 1], foot);
                    if (c3d[0] !== 0) {
                        this.coords = this.view.project3DToCube(c3d);
                    }
                }
            } else {
                this.updateCoords();
                // Update 2D point from its 3D view
                this.element2D.coords.setCoordinates(Const.COORDS_BY_USER,
                    this.view.project3DTo2D([1, this.X(), this.Y(), this.Z()])
                );
            }
            this._c2d = this.element2D.coords.usrCoords.slice();

            return this;
        },

        updateRenderer: function() {
            this.needsUpdate = false;
            return this;
        },

        // Not yet working
        __evt__update3D: function (oc) { }


    });

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
     * @param {number,function_number,function_number,function} x,y,z The coordinates are given as x, y, z consisting of numbers of functions. Alternatively,
     * the coordinates can be supplied as
     *  <ul>
     *   <li>array [x,y,z] of length 3 consisting of numbers or
     *   <li>function returning an array [x,y,z] of length 3 of numbers.
     * </ul>
     *
     * @example
     *    var board = JXG.JSXGraph.initBoard('jxgbox1', {
     *        boundingbox: [-8, 8, 8, -8],
     *        keepaspectratio: false,
     *        axis: false
     *    });
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
     *         board.update();
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
            attr,
            i, c2d,
            el;

        attr = Type.copyAttributes(attributes, board.options, 'point3d');
        el = new JXG.Point3D(view, parents, attr);

        // If the last element of parents is a 3D object, 
        // the point is a glider on that element.
        if (parents.length > 2 && Type.exists(parents[parents.length - 1].is3D)) {
            el.slide = parents.pop();
        } else {
            el.slide = null;
        }

        if (parents.length === 2) {        // [view, array|fun] (Array [x, y, z] | function) returning [x, y, z]
            el.F = parents[1];
            el.coords = [1].concat(Type.evaluate(el.F));

        } else if (parents.length === 4) { // [view, x, y, z], (3 numbers | functions)
            el.F = parents.slice(1);
            for (i = 0; i < 3; i++) {
                el.coords[i + 1] = Type.evaluate(el.F[i]);
            }
        } else {
            // Throw error
            throw new Error("JSXGraph: Can't create point3d with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [[x,y,z]], [x,y,z]");
                    //  "\nPossible parent types: [[x,y,z]], [x,y,z], [element,transformation]"); // TODO
        }
        el.updateCoords();
        c2d = view.project3DTo2D(el.coords);

        attr.name = el.name;
        el.element2D = board.create('point', c2d, attr);
        el.addChild(el.element2D);
        el.inherits.push(el.element2D);

        el._c2d = el.element2D.coords.usrCoords.slice(); // Store a copy of the coordinates to detect dragging

        if (el.slide) {
            el._minFunc = function (n, m, x, con) {
                var surface = el.slide.D3,
                    c3d = [1, surface.X(x[0], x[1]), surface.Y(x[0], x[1]), surface.Z(x[0], x[1])],
                    c2d = view.project3DTo2D(c3d);

                con[0] = el.element2D.X() - c2d[1];
                con[1] = el.element2D.Y() - c2d[2];

                return con[0] * con[0] + con[1] * con[1];
            };

            el.projectCoords2Surface = function () {
                var n = 2,		// # of variables
                    m = 2, 		// number of constraints
                    x = [0, 0],
                    // Various Cobyla constants, see Cobyla docs in Cobyja.js
                    rhobeg = 5.0,
                    rhoend = 1.0e-6,
                    iprint = 0,
                    maxfun = 200,
                    surface = this.slide.D3,
                    r, c3d, c2d;

                if (Type.exists(this._params)) {
                    x = this._params.slice();
                }
                r = Mat.Nlp.FindMinimum(this._minFunc, n, m, x, rhobeg, rhoend, iprint, maxfun);

                c3d = [1, surface.X(x[0], x[1]), surface.Y(x[0], x[1]), surface.Z(x[0], x[1])];
                c2d = view.project3DTo2D(c3d);
                this._params = x;
                this.coords = c3d;
                this.element2D.coords.setCoordinates(Const.COORDS_BY_USER, c2d);
                this._c2d = c2d;
            };
        }

        return el;
    };

    JXG.registerElement('point3d', JXG.createPoint3D);

});