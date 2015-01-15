/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, console: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 options
 math/math
 math/geometry
 math/numerics
 base/coords
 base/constants
 base/element
 parser/geonext
 utils/type
  elements:
   transform
 */

/**
 * @fileoverview The geometry object Point is defined in this file. Point stores all
 * style and functional properties that are required to draw and move a point on
 * a board.
 */

define([
    'jxg', 'options', 'math/math', 'math/geometry', 'math/numerics', 'base/coords', 'base/constants', 'base/element',
    'parser/geonext', 'utils/type', 'base/transformation', 'base/coordselement'
], function (JXG, Options, Mat, Geometry, Numerics, Coords, Const, GeometryElement, GeonextParser, Type, Transform, CoordsElement) {

    "use strict";

    /**
     * A point is the basic geometric element. Based on points lines and circles can be constructed which can be intersected
     * which in turn are points again which can be used to construct new lines, circles, polygons, etc. This class holds methods for
     * all kind of points like free points, gliders, and intersection points.
     * @class Creates a new point object. Do not use this constructor to create a point. Use {@link JXG.Board#create} with
     * type {@link Point}, {@link Glider}, or {@link Intersection} instead.
     * @augments JXG.GeometryElement
     * @augments JXG.CoordsElement
     * @param {string|JXG.Board} board The board the new point is drawn on.
     * @param {Array} coordinates An array with the user coordinates of the point.
     * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point} and
     * {@link JXG.Options#elements}, and optional a name and an id.
     * @see JXG.Board#generateName
     */
    JXG.Point = function (board, coordinates, attributes) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_POINT, Const.OBJECT_CLASS_POINT);
        this.element = this.board.select(attributes.anchor);
        this.coordsConstructor(coordinates);

        this.elType = 'point';

        /* Register point at board. */
        this.id = this.board.setId(this, 'P');
        this.board.renderer.drawPoint(this);
        this.board.finalizeAdding(this);

        this.createLabel();
    };

    /**
     * Inherits here from {@link JXG.GeometryElement}.
     */
    JXG.Point.prototype = new GeometryElement();
    Type.copyPrototypeMethods(JXG.Point, CoordsElement, 'coordsConstructor');

    JXG.extend(JXG.Point.prototype, /** @lends JXG.Point.prototype */ {
        /**
         * Checks whether (x,y) is near the point.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the point, False otherwise.
         * @private
         */
        hasPoint: function (x, y) {
            var coordsScr = this.coords.scrCoords, r;
            r = parseFloat(this.visProp.size) + parseFloat(this.visProp.strokewidth) * 0.5;
            if (r < this.board.options.precision.hasPoint) {
                r = this.board.options.precision.hasPoint;
            }

            return ((Math.abs(coordsScr[1] - x) < r + 2) && (Math.abs(coordsScr[2] - y) < r + 2));
        },

        /**
         * Updates the position of the point.
         */
        update: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }

            this.updateCoords(fromParent);

            if (this.visProp.trace) {
                this.cloneToBackground(true);
            }

            return this;
        },

        /**
         * Applies the transformations of the element to {@link JXG.Point#baseElement}.
         * Point transformations are relative to a base element.
         * @returns {JXG.CoordsElement} Reference to this object.
         */
        updateTransform: function () {
            var c, i;

            if (this.transformations.length === 0 || this.baseElement === null) {
                return this;
            }

            // case of bindTo
            if (this === this.baseElement) {
                c = this.transformations[0].apply(this.baseElement, 'self');
            // case of board.create('point',[baseElement,transform]);
            } else {
                c = this.transformations[0].apply(this.baseElement);
            }

            this.coords.setCoordinates(Const.COORDS_BY_USER, c);

            for (i = 1; i < this.transformations.length; i++) {
                this.coords.setCoordinates(Const.COORDS_BY_USER, this.transformations[i].apply(this));
            }
            return this;
        },

        /**
         * Calls the renderer to update the drawing.
         * @private
         */
        updateRenderer: function () {
            if (this.visProp.size > 0) {
                this.updateRendererGeneric('updatePoint');
            }
            return this;
        },

        // documented in JXG.GeometryElement
        bounds: function () {
            return this.coords.usrCoords.slice(1).concat(this.coords.usrCoords.slice(1));
        },

        /**
         * Convert the point to intersection point and update the construction.
         * To move the point visual onto the intersection, a call of board update is necessary.
         * TODO docu.
         * @param {String|Object} el1, el2, i, j The intersecting objects and the numbers.
         **/
        makeIntersection: function (el1, el2, i, j) {
            var func;

            el1 = this.board.select(el1);
            el2 = this.board.select(el2);

            func = Geometry.intersectionFunction(this.board, el1, el2, i, j, this.visProp.alwaysintersect);
            this.addConstraint([func]);

            try {
                el1.addChild(this);
                el2.addChild(this);
            } catch (e) {
                throw new Error("JSXGraph: Can't create 'intersection' with parent types '" +
                    (typeof el1) + "' and '" + (typeof el2) + "'.");
            }

            this.type = Const.OBJECT_TYPE_INTERSECTION;
            this.elType = 'intersection';
            this.parents = [el1.id, el2.id, i, j];

            this.generatePolynomial = function () {
                var poly1 = el1.generatePolynomial(this),
                    poly2 = el2.generatePolynomial(this);

                if ((poly1.length === 0) || (poly2.length === 0)) {
                    return [];
                }

                return [poly1[0], poly2[0]];
            };

            this.prepareUpdate().update();
        },

        /**
         * Set the style of a point. 
         * Used for GEONExT import and should not be used to set the point's face and size.
         * @param {Number} i Integer to determine the style.
         * @private
         */
        setStyle: function (i) {
            var facemap = [
                // 0-2
                'cross', 'cross', 'cross',
                // 3-6
                'circle', 'circle', 'circle', 'circle',
                // 7-9
                'square', 'square', 'square',
                // 10-12
                'plus', 'plus', 'plus'
            ], sizemap = [
                // 0-2
                2, 3, 4,
                // 3-6
                1, 2, 3, 4,
                // 7-9
                2, 3, 4,
                // 10-12
                2, 3, 4
            ];

            this.visProp.face = facemap[i];
            this.visProp.size = sizemap[i];

            this.board.renderer.changePointStyle(this);
            return this;
        },

        /**
         * @deprecated Use JXG#normalizePointFace instead
         * @param s
         * @return {*}
         */
        normalizeFace: function (s) {
            return Options.normalizePointFace(s);
        },

        /**
         * Set the face of a point element.
         * @param {String} f String which determines the face of the point. See {@link JXG.GeometryElement#face} for a list of available faces.
         * @see JXG.GeometryElement#face
         * @deprecated Use setAttribute()
         */
        face: function (f) {
            this.setAttribute({face: f});
        },

        /**
         * Set the size of a point element
         * @param {Number} s Integer which determines the size of the point.
         * @see JXG.GeometryElement#size
         * @deprecated Use setAttribute()
         */
        size: function (s) {
            this.setAttribute({size: s});
        },

        // already documented in GeometryElement
        cloneToBackground: function () {
            var copy = {};

            copy.id = this.id + 'T' + this.numTraces;
            this.numTraces += 1;

            copy.coords = this.coords;
            copy.visProp = Type.deepCopy(this.visProp, this.visProp.traceattributes, true);
            copy.visProp.layer = this.board.options.layer.trace;
            copy.elementClass = Const.OBJECT_CLASS_POINT;
            copy.board = this.board;
            Type.clearVisPropOld(copy);

            this.board.renderer.drawPoint(copy);
            this.traces[copy.id] = copy.rendNode;

            return this;
        }

    });


    /**
     * @class This element is used to provide a constructor for a general point. A free point is created if the given parent elements are all numbers
     * and the property fixed is not set or set to false. If one or more parent elements is not a number but a string containing a GEONE<sub>x</sub>T
     * constraint or a function the point will be considered as constrained). That means that the user won't be able to change the point's
     * position directly.
     * @pseudo
     * @description
     * @name Point
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Number,string,function_Number,string,function_Number,string,function} z_,x,y Parent elements can be two or three elements of type number, a string containing a GEONE<sub>x</sub>T
     * constraint, or a function which takes no parameter and returns a number. Every parent element determines one coordinate. If a coordinate is
     * given by a number, the number determines the initial position of a free point. If given by a string or a function that coordinate will be constrained
     * that means the user won't be able to change the point's position directly by mouse because it will be calculated automatically depending on the string
     * or the function's return value. If two parent elements are given the coordinates will be interpreted as 2D affine Euclidean coordinates, if three such
     * parent elements are given they will be interpreted as homogeneous coordinates.
     * @param {JXG.Point_JXG.Transformation} Point,Transformation A point can also be created providing a transformation. The resulting point is a clone of the base
     * point transformed by the given Transformation. {@see JXG.Transformation}.
     * @example
     * // Create a free point using affine euclidean coordinates
     * var p1 = board.create('point', [3.5, 2.0]);
     * </pre><div id="672f1764-7dfa-4abc-a2c6-81fbbf83e44b" style="width: 200px; height: 200px;"></div>
     * <script type="text/javascript">
     *   var board = JXG.JSXGraph.initBoard('672f1764-7dfa-4abc-a2c6-81fbbf83e44b', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [3.5, 2.0]);
     * </script><pre>
     * @example
     * // Create a constrained point using anonymous function
     * var p2 = board.create('point', [3.5, function () { return p1.X(); }]);
     * </pre><div id="4fd4410c-3383-4e80-b1bb-961f5eeef224" style="width: 200px; height: 200px;"></div>
     * <script type="text/javascript">
     *   var fpex1_board = JXG.JSXGraph.initBoard('4fd4410c-3383-4e80-b1bb-961f5eeef224', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var fpex1_p1 = fpex1_board.create('point', [3.5, 2.0]);
     *   var fpex1_p2 = fpex1_board.create('point', [3.5, function () { return fpex1_p1.X(); }]);
     * </script><pre>
     * @example
     * // Create a point using transformations
     * var trans = board.create('transform', [2, 0.5], {type:'scale'});
     * var p3 = board.create('point', [p2, trans]);
     * </pre><div id="630afdf3-0a64-46e0-8a44-f51bd197bb8d" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var fpex2_board = JXG.JSXGraph.initBoard('630afdf3-0a64-46e0-8a44-f51bd197bb8d', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var fpex2_trans = fpex2_board.create('transform', [2, 0.5], {type:'scale'});
     *   var fpex2_p2 = fpex2_board.create('point', [3.5, 2.0]);
     *   var fpex2_p3 = fpex2_board.create('point', [fpex2_p2, fpex2_trans]);
     * </script><pre>
     */
    JXG.createPoint = function (board, parents, attributes) {
        var el, attr;

        attr = Type.copyAttributes(attributes, board.options, 'point');
        el = CoordsElement.create(JXG.Point, board, parents, attr);
        if (!el) {
            throw new Error("JSXGraph: Can't create point with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [x,y], [z,x,y], [element,transformation]");
        }

        return el;
    };

    /**
     * @class This element is used to provide a constructor for a glider point.
     * @pseudo
     * @description A glider is a point which lives on another geometric element like a line, circle, curve, turtle.
     * @name Glider
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Number_Number_Number_JXG.GeometryElement} z_,x_,y_,GlideObject Parent elements can be two or three elements of type number and the object the glider lives on.
     * The coordinates are completely optional. If not given the origin is used. If you provide two numbers for coordinates they will be interpreted as affine euclidean
     * coordinates, otherwise they will be interpreted as homogeneous coordinates. In any case the point will be projected on the glide object.
     * @example
     * // Create a glider with user defined coordinates. If the coordinates are not on
     * // the circle (like in this case) the point will be projected onto the circle.
     * var p1 = board.create('point', [2.0, 2.0]);
     * var c1 = board.create('circle', [p1, 2.0]);
     * var p2 = board.create('glider', [2.0, 1.5, c1]);
     * </pre><div id="4f65f32f-e50a-4b50-9b7c-f6ec41652930" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var gpex1_board = JXG.JSXGraph.initBoard('4f65f32f-e50a-4b50-9b7c-f6ec41652930', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var gpex1_p1 = gpex1_board.create('point', [2.0, 2.0]);
     *   var gpex1_c1 = gpex1_board.create('circle', [gpex1_p1, 2.0]);
     *   var gpex1_p2 = gpex1_board.create('glider', [2.0, 1.5, gpex1_c1]);
     * </script><pre>
     * @example
     * // Create a glider with default coordinates (1,0,0). Same premises as above.
     * var p1 = board.create('point', [2.0, 2.0]);
     * var c1 = board.create('circle', [p1, 2.0]);
     * var p2 = board.create('glider', [c1]);
     * </pre><div id="4de7f181-631a-44b1-a12f-bc4d995609e8" style="width: 200px; height: 200px;"></div>
     * <script type="text/javascript">
     *   var gpex2_board = JXG.JSXGraph.initBoard('4de7f181-631a-44b1-a12f-bc4d995609e8', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var gpex2_p1 = gpex2_board.create('point', [2.0, 2.0]);
     *   var gpex2_c1 = gpex2_board.create('circle', [gpex2_p1, 2.0]);
     *   var gpex2_p2 = gpex2_board.create('glider', [gpex2_c1]);
     * </script><pre>
     */
    JXG.createGlider = function (board, parents, attributes) {
        var el, coords,
            attr = Type.copyAttributes(attributes, board.options, 'glider');

        if (parents.length === 1) {
            coords = [0, 0];
        } else {
            coords = parents.slice(0, 2);
        }
        el = board.create('point', coords, attr);

        // eltype is set in here
        el.makeGlider(parents[parents.length - 1]);

        return el;
    };


    /**
     * @class This element is used to provide a constructor for an intersection point.
     * @pseudo
     * @description An intersection point is a point which lives on two Lines or Circles or one Line and one Circle at the same time, i.e.
     * an intersection point of the two elements.
     * @name Intersection
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_Number} el1,el2,i The result will be a intersection point on el1 and el2. i determines the
     * intersection point if two points are available: <ul>
     *   <li>i==0: use the positive square root,</li>
     *   <li>i==1: use the negative square root.</li></ul>
     * @example
     * // Create an intersection point of circle and line
     * var p1 = board.create('point', [2.0, 2.0]);
     * var c1 = board.create('circle', [p1, 2.0]);
     *
     * var p2 = board.create('point', [2.0, 2.0]);
     * var p3 = board.create('point', [2.0, 2.0]);
     * var l1 = board.create('line', [p2, p3]);
     *
     * var i = board.create('intersection', [c1, l1, 0]);
     * </pre><div id="e5b0e190-5200-4bc3-b995-b6cc53dc5dc0" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var ipex1_board = JXG.JSXGraph.initBoard('e5b0e190-5200-4bc3-b995-b6cc53dc5dc0', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ipex1_p1 = ipex1_board.create('point', [4.0, 4.0]);
     *   var ipex1_c1 = ipex1_board.create('circle', [ipex1_p1, 2.0]);
     *   var ipex1_p2 = ipex1_board.create('point', [1.0, 1.0]);
     *   var ipex1_p3 = ipex1_board.create('point', [5.0, 3.0]);
     *   var ipex1_l1 = ipex1_board.create('line', [ipex1_p2, ipex1_p3]);
     *   var ipex1_i = ipex1_board.create('intersection', [ipex1_c1, ipex1_l1, 0]);
     * </script><pre>
     */
    JXG.createIntersectionPoint = function (board, parents, attributes) {
        var el, el1, el2, func, i, j,
            attr = Type.copyAttributes(attributes, board.options, 'intersection');

        // make sure we definitely have the indices
        parents.push(0, 0);

        el1 = board.select(parents[0]);
        el2 = board.select(parents[1]);

        i = parents[2] || 0;
        j = parents[3] || 0;

        el = board.create('point', [0, 0, 0], attr);

        func = Geometry.intersectionFunction(board, el1, el2, i, j, el.visProp.alwaysintersect);
        el.addConstraint([func]);

        try {
            el1.addChild(el);
            el2.addChild(el);
        } catch (e) {
            throw new Error("JSXGraph: Can't create 'intersection' with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
        }

        el.type = Const.OBJECT_TYPE_INTERSECTION;
        el.elType = 'intersection';
        el.parents = [el1.id, el2.id, i, j];

        el.generatePolynomial = function () {
            var poly1 = el1.generatePolynomial(el),
                poly2 = el2.generatePolynomial(el);

            if ((poly1.length === 0) || (poly2.length === 0)) {
                return [];
            }

            return [poly1[0], poly2[0]];
        };

        return el;
    };

    /**
     * @class This element is used to provide a constructor for the "other" intersection point.
     * @pseudo
     * @description An intersection point is a point which lives on two Lines or Circles or one Line and one Circle at the same time, i.e.
     * an intersection point of the two elements. Additionally, one intersection point is provided. The function returns the other intersection point.
     * @name OtherIntersection
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_JXG.Point} el1,el2,p The result will be a intersection point on el1 and el2. i determines the
     * intersection point different from p:
     * @example
     * // Create an intersection point of circle and line
     * var p1 = board.create('point', [2.0, 2.0]);
     * var c1 = board.create('circle', [p1, 2.0]);
     *
     * var p2 = board.create('point', [2.0, 2.0]);
     * var p3 = board.create('point', [2.0, 2.0]);
     * var l1 = board.create('line', [p2, p3]);
     *
     * var i = board.create('intersection', [c1, l1, 0]);
     * var j = board.create('otherintersection', [c1, l1, i]);
     * </pre><div id="45e25f12-a1de-4257-a466-27a2ae73614c" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var ipex2_board = JXG.JSXGraph.initBoard('45e25f12-a1de-4257-a466-27a2ae73614c', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ipex2_p1 = ipex2_board.create('point', [4.0, 4.0]);
     *   var ipex2_c1 = ipex2_board.create('circle', [ipex2_p1, 2.0]);
     *   var ipex2_p2 = ipex2_board.create('point', [1.0, 1.0]);
     *   var ipex2_p3 = ipex2_board.create('point', [5.0, 3.0]);
     *   var ipex2_l1 = ipex2_board.create('line', [ipex2_p2, ipex2_p3]);
     *   var ipex2_i = ipex2_board.create('intersection', [ipex2_c1, ipex2_l1, 0], {name:'D'});
     *   var ipex2_j = ipex2_board.create('otherintersection', [ipex2_c1, ipex2_l1, ipex2_i], {name:'E'});
     * </script><pre>
     */
    JXG.createOtherIntersectionPoint = function (board, parents, attributes) {
        var el, el1, el2, other;

        if (parents.length !== 3 ||
                !Type.isPoint(parents[2]) ||
                (parents[0].elementClass !== Const.OBJECT_CLASS_LINE && parents[0].elementClass !== Const.OBJECT_CLASS_CIRCLE) ||
                (parents[1].elementClass !== Const.OBJECT_CLASS_LINE && parents[1].elementClass !== Const.OBJECT_CLASS_CIRCLE)) {
            // Failure
            throw new Error("JSXGraph: Can't create 'other intersection point' with parent types '" +
                (typeof parents[0]) + "',  '" + (typeof parents[1]) + "'and  '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [circle|line,circle|line,point]");
        }

        el1 = board.select(parents[0]);
        el2 = board.select(parents[1]);
        other = board.select(parents[2]);

        el = board.create('point', [function () {
            var c = Geometry.meet(el1.stdform, el2.stdform, 0, el1.board);

            if (Math.abs(other.X() - c.usrCoords[1]) > Mat.eps ||
                    Math.abs(other.Y() - c.usrCoords[2]) > Mat.eps ||
                    Math.abs(other.Z() - c.usrCoords[0]) > Mat.eps) {
                return c;
            }

            return Geometry.meet(el1.stdform, el2.stdform, 1, el1.board);
        }], attributes);

        el.type = Const.OBJECT_TYPE_INTERSECTION;
        el.elType = 'otherintersection';
        el.parents = [el1.id, el2.id, other];

        el1.addChild(el);
        el2.addChild(el);

        el.generatePolynomial = function () {
            var poly1 = el1.generatePolynomial(el),
                poly2 = el2.generatePolynomial(el);

            if ((poly1.length === 0) || (poly2.length === 0)) {
                return [];
            }

            return [poly1[0], poly2[0]];
        };

        return el;
    };

    /**
     * @class This element is used to provide a constructor for the pole point of a line with respect to a conic or a circle.
     * @pseudo
     * @description The pole point is the unique reciprocal relationship of a line with respect to a conic.
     * The lines tangent to the intersections of a conic and a line intersect at the pole point of that line with respect to that conic.
     * A line tangent to a conic has the pole point of that line with respect to that conic as the tangent point.
     * See {@link http://en.wikipedia.org/wiki/Pole_and_polar} for more information on pole and polar.
     * @name PolePoint
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Conic,JXG.Circle_JXG.Point} el1,el2 or
     * @param {JXG.Point_JXG.Conic,JXG.Circle} el1,el2 The result will be the pole point of the line with respect to the conic or the circle.
     * @example
     * // Create the pole point of a line with respect to a conic
     * var p1 = board.create('point', [-1, 2]);
     * var p2 = board.create('point', [ 1, 4]);
     * var p3 = board.create('point', [-1,-2]);
     * var p4 = board.create('point', [ 0, 0]);
     * var p5 = board.create('point', [ 4,-2]);
     * var c1 = board.create('conic',[p1,p2,p3,p4,p5]);
     * var p6 = board.create('point', [-1, 4]);
     * var p7 = board.create('point', [2, -2]);
     * var l1 = board.create('line', [p6, p7]);
     * var p8 = board.create('polepoint', [c1, l1]);
     * </pre><div id='7b7233a0-f363-47dd-9df5-8018d0d17a98' class='jxgbox' style='width:400px; height:400px;'></div>
     * <script type='text/javascript'>
     * var ppex1_board = JXG.JSXGraph.initBoard('7b7233a0-f363-47dd-9df5-8018d0d17a98', {boundingbox: [-3, 5, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     * var ppex1_p1 = ppex1_board.create('point', [-1, 2]);
     * var ppex1_p2 = ppex1_board.create('point', [ 1, 4]);
     * var ppex1_p3 = ppex1_board.create('point', [-1,-2]);
     * var ppex1_p4 = ppex1_board.create('point', [ 0, 0]);
     * var ppex1_p5 = ppex1_board.create('point', [ 4,-2]);
     * var ppex1_c1 = ppex1_board.create('conic',[ppex1_p1,ppex1_p2,ppex1_p3,ppex1_p4,ppex1_p5]);
     * var ppex1_p6 = ppex1_board.create('point', [-1, 4]);
     * var ppex1_p7 = ppex1_board.create('point', [2, -2]);
     * var ppex1_l1 = ppex1_board.create('line', [ppex1_p6, ppex1_p7]);
     * var ppex1_p8 = ppex1_board.create('polepoint', [ppex1_c1, ppex1_l1]);
     * </script><pre>
     * @example
     * // Create the pole point of a line with respect to a circle
     * var p1 = board.create('point', [1, 1]);
     * var p2 = board.create('point', [2, 3]);
     * var c1 = board.create('circle',[p1,p2]);
     * var p3 = board.create('point', [-1, 4]);
     * var p4 = board.create('point', [4, -1]);
     * var l1 = board.create('line', [p3, p4]);
     * var p5 = board.create('polepoint', [c1, l1]);
     * </pre><div id='7b7233a0-f363-47dd-9df5-9018d0d17a98' class='jxgbox' style='width:400px; height:400px;'></div>
     * <script type='text/javascript'>
     * var ppex2_board = JXG.JSXGraph.initBoard('7b7233a0-f363-47dd-9df5-9018d0d17a98', {boundingbox: [-3, 7, 7, -3], axis: true, showcopyright: false, shownavigation: false});
     * var ppex2_p1 = ppex2_board.create('point', [1, 1]);
     * var ppex2_p2 = ppex2_board.create('point', [2, 3]);
     * var ppex2_c1 = ppex2_board.create('circle',[ppex2_p1,ppex2_p2]);
     * var ppex2_p3 = ppex2_board.create('point', [-1, 4]);
     * var ppex2_p4 = ppex2_board.create('point', [4, -1]);
     * var ppex2_l1 = ppex2_board.create('line', [ppex2_p3, ppex2_p4]);
     * var ppex2_p5 = ppex2_board.create('polepoint', [ppex2_c1, ppex2_l1]);
     * </script><pre>
     */
    JXG.createPolePoint = function (board, parents, attributes) {
        var el, el1, el2,
            firstParentIsConic, secondParentIsConic,
            firstParentIsLine, secondParentIsLine;

        if (parents.length > 1) {
            firstParentIsConic = (parents[0].type === Const.OBJECT_TYPE_CONIC ||
                parents[0].elementClass === Const.OBJECT_CLASS_CIRCLE);
            secondParentIsConic = (parents[1].type === Const.OBJECT_TYPE_CONIC ||
                parents[1].elementClass === Const.OBJECT_CLASS_CIRCLE);

            firstParentIsLine = (parents[0].elementClass === Const.OBJECT_CLASS_LINE);
            secondParentIsLine = (parents[1].elementClass === Const.OBJECT_CLASS_LINE);
        }

/*        if (parents.length !== 2 || !((
                parents[0].type === Const.OBJECT_TYPE_CONIC ||
                parents[0].elementClass === Const.OBJECT_CLASS_CIRCLE) &&
                parents[1].elementClass === Const.OBJECT_CLASS_LINE ||
                parents[0].elementClass === Const.OBJECT_CLASS_LINE && (
                parents[1].type === Const.OBJECT_TYPE_CONIC ||
                parents[1].elementClass === Const.OBJECT_CLASS_CIRCLE))) {*/
        if (parents.length !== 2 ||
                !((firstParentIsConic && secondParentIsLine) ||
                    (firstParentIsLine && secondParentIsConic))) {
            // Failure
            throw new Error("JSXGraph: Can't create 'pole point' with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent type: [conic|circle,line], [line,conic|circle]");
        }

        if (secondParentIsLine) {
            el1 = board.select(parents[0]);
            el2 = board.select(parents[1]);
        } else {
            el1 = board.select(parents[1]);
            el2 = board.select(parents[0]);
        }

        el = board.create('point',
            [function () {
                var q = el1.quadraticform,
                    s = el2.stdform.slice(0, 3);

                return [JXG.Math.Numerics.det([s, q[1], q[2]]),
                        JXG.Math.Numerics.det([q[0], s, q[2]]),
                        JXG.Math.Numerics.det([q[0], q[1], s])];
            }], attributes);

        el.elType = 'polepoint';
        el.parents = [el1.id, el2.id];

        el1.addChild(el);
        el2.addChild(el);

        return el;
    };

    JXG.registerElement('point', JXG.createPoint);
    JXG.registerElement('glider', JXG.createGlider);
    JXG.registerElement('intersection', JXG.createIntersectionPoint);
    JXG.registerElement('otherintersection', JXG.createOtherIntersectionPoint);
    JXG.registerElement('polepoint', JXG.createPolePoint);

    return {
        Point: JXG.Point,
        createPoint: JXG.createPoint,
        createGlider: JXG.createGlider,
        createIntersection: JXG.createIntersectionPoint,
        createOtherIntersection: JXG.createOtherIntersectionPoint,
        createPolePoint: JXG.createPolePoint
    };
});
