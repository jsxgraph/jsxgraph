/*
    Copyright 2008-2025
        Matthias Ehmann,
        Aaron Fenyes,
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

/**
 * Create linear spaces of dimension at least one,
 * i.e. lines and planes.
 */
import JXG from '../jxg.js';
import Const from '../base/constants.js';
import Type from '../utils/type.js';
import Mat from '../math/math.js';
import Geometry from '../math/geometry.js';

// -----------------------
//  Lines
// -----------------------

/**
 * Constructor for 3D lines.
 * @class Creates a new 3D line object. Do not use this constructor to create a 3D line. Use {@link JXG.View3D#create} with type {@link Line3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Point3D|Array} point
 * @param {Array} direction
 * @param {Array} range
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Line3D = function (view, point, direction, range, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_LINE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'line3d');

    /**
     * 3D point which - together with a direction - defines the line.
     * @name point
     * @memberOf Line3D
     * @type Point3D
     *
     * @see Line3D#direction
     */
    this.point = point;

    /**
     * Direction which - together with a point - defines the line. Array of numbers or functions (of length 3) or function
     * returning array of length 3.
     *
     * @name Line3D#direction
     * @type Array|Function
     * @see Line3D.point
     */
    this.direction = direction;

    /**
     * Spanning vector of the 3D line. Contains the evaluated coordinates from {@link direction}
     * and {@link range}.
     * The array has length 4, the first entry being 0.
     *
     * @name Line3D#vec
     * @type {Array}
     */
    this.vec = [0, 0, 0, 0];

    /**
     * Range [r1, r2] of the line. r1, r2 can be numbers or functions.
     * The 3D line goes from (point + r1 * direction) to (point + r2 * direction)
     * @name Line3D#range
     * @type Array
     * @default [-Infinity, Infinity]
     */
    this.range = range || [-Infinity, Infinity];

    /**
     * Starting point of the 3D line
     * @name Line3D#point1
     * @type JXG.Point3D
     * @private
     */
    this.point1 = null;

    /**
     * End point of the 3D line
     * @name Line3D#point2
     * @type JXG.Point3D
     * @private
     */
    this.point2 = null;

    this.board.finalizeAdding(this);

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Line3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Line3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Line3D.prototype,
    /** @lends JXG.Line3D.prototype */ {

        /**
         * Update the array {@link Line3D#vec} containing the homogeneous coords of the spanning vector.
         *
         * @name Line3D#updateCoords
         * @function
         * @returns {Object} Reference to Line3D object
         * @private
         */
        updateCoords: function() {
            var i,
                s = 0;

            if ((Type.exists(this.direction.view) && this.direction.type === Const.OBJECT_TYPE_LINE3D)) {
                // direction is another line3D object
                this.vec = this.direction.vec.slice();
            } else if (Type.isFunction(this.direction)) {
                this.vec = Type.evaluate(this.direction);
                if (this.vec.length === 3) {
                    this.vec.unshift(0);
                }
            } else {
                if (this.direction.length === 3) {
                    this.vec[0] = 0;
                    s = 1;
                }
                for (i = 0; i < this.direction.length; i++) {
                    this.vec[s + i] = Type.evaluate(this.direction[i]);
                }
            }

            return this;
        },

        /**
         * Determine one end point of a 3D line from point, direction and range).
         *
         * @name Line3D#getPointCoords
         * @param {Number|function} r Usually, one of the range borders.
         * @private
         * @returns {Array} Coordinates of length 4.
         */
        getPointCoords: function (r) {
            var p = [],
                d = [],
                r0;

            p = this.point.coords;
            d = this.vec;

            // Intersect the ray - if necessary - with the cube,
            // i.e. clamp the line.
            r0 = Type.evaluate(r);
            r = this.view.intersectionLineCube(p, d, r0);

            // Check if r is infinite. This happens
            // if this.vec is the zero vector.
            if (Math.abs(r) === Infinity) {
                r = 0;
            }
            return [
                p[0] + d[0] * r,
                p[1] + d[1] * r,
                p[2] + d[2] * r,
                p[3] + d[3] * r
            ];
        },

        addTransform: function (el, transform) {
            this.point.addTransform(el.point, transform);
            this.addTransformGeneric(el, transform);

            return this;
        },

        updateTransform: function () {
            var c, i;

            if (this.transformations.length === 0 || this.baseElement === null) {
                return this;
            }

            if (this === this.baseElement) {
                c = this.vec;
            } else {
                c = this.baseElement.vec;
            }
            for (i = 0; i < this.transformations.length; i++) {
                this.transformations[i].update();
                c = Mat.matVecMult(this.transformations[i].matrix, c);
            }
            this.vec = c;

            return this;
        },

        // Already documented in JXG.GeometryElement
        update: function () {
            if (this.needsUpdate) {
                this.updateCoords()
                    .updateTransform();
            }
            return this;
        },

        /**
         * Set the 2D position of the defining points.
         *
         * @name Line3D#setPosition2D
         * @function
         * @param {JXG.Transformation} t projective 2D transformation
         * @private
         */
        setPosition2D: function (t) {
            var j, el;

            for (j = 0; j < this.parents.length; j++) {
                // Run through defining 3D points
                el = this.view.select(this.parents[j]);
                if (el.elType === 'point3d' && el.element2D.draggable()) {
                    t.applyOnce(el.element2D);
                }
            }
            this.endpoints[0].update();
            this.endpoints[1].update();
        },

        // Already documented in JXG.GeometryElement
        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        // Already documented in element3d.js
        projectCoords: function (p, params) {
            var p0_coords = this.getPointCoords(0),
                p1_coords = this.getPointCoords(1),
                dir = [
                    p1_coords[0] - p0_coords[0],
                    p1_coords[1] - p0_coords[1],
                    p1_coords[2] - p0_coords[2]
                ],
                diff = [
                    p[0] - p0_coords[0],
                    p[1] - p0_coords[1],
                    p[2] - p0_coords[2]
                ],
                t = Mat.innerProduct(diff, dir) / Mat.innerProduct(dir, dir),
                t_clamped = Math.min(Math.max(t, Type.evaluate(this.range[0])), Type.evaluate(this.range[1])),
                c3d;

            c3d = this.getPointCoords(t_clamped).slice();
            params[0] = t_clamped;

            return c3d;
        },

        // projectScreenCoords: function (pScr) {
        //     var end0 = this.getPointCoords(0),
        //         end1 = this.getPointCoords(1);

        //     return this.view.projectScreenToSegment(pScr, end0, end1);
        // },

        /**
         * Update the z-index of the line, i.e. the z-index of its midpoint.
         * @name Line3D#updateZIndex
         * @function
         * @returns {Object} Reference to Line3D object
         */
        updateZIndex: function() {
            var p1 = this.endpoints[0],
                p2 = this.endpoints[1],
                c3d = [1, p1.X() + p2.X(), p1.Y() + p2.Y(), p1.Z() + p2.Z()];

            c3d[1] *= 0.5;
            c3d[2] *= 0.5;
            c3d[3] *= 0.5;
            // this.zIndex = Mat.matVecMult(this.view.matrix3DRotShift, c3d)[3];
            this.zIndex = Mat.innerProduct(this.view.matrix3DRotShift[3], c3d);

            return this;
        }
    }
);

/**
 * @class A line in 3D is given by two points, or one point and a direction vector.
 *
 * @description
 * A line in 3D is given by two points, or one point and a direction vector.
 * That is, there are the following two possibilities to create a Line3D object:
 * <ol>
 * <li> The 3D line is defined by two 3D points (Point3D):
 * The points can be either existing points or coordinate arrays of
 * the form [x, y, z].
 * <p> The 3D line is defined by a point (or coordinate array [x, y, z])
 * a direction given as array [x, y, z] and an optional range
 * given as array [s, e]. The default value for the range is [-Infinity, Infinity].
 * </ol>
 * All numbers can also be provided as functions returning a number.
 * The case [point, array] is ambiguous, it is not clear if 'array' contains the coordinates of a point
 * or of a direction. In that case, 'array' is interpreted as the coordinate array of a point,
 * i.e. the line is defined by two points.
 *
 * @pseudo
 * @name Line3D
 * @augments JXG.GeometryElement3D
 * @constructor
 * @type JXG.Line3D
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 * @param {JXG.Point3D,array,function_JXG.Point3D,array,function} point1,point2 First and second defining point of the line.
 * The attributes {@link Line3D#straightFirst} and {@link Line3D#straightLast} control if the line is displayed as
 * segment, ray or infinite line.
 * @param {JXG.Point3D,array,function_JXG.Line3D,array,function_array,function} point,direction,range The line is defined by point, direction and range.
 * <ul>
 * <li> point: Point3D or array of length 3
 * <li> direction: array of length 3 or function returning an array of numbers or function returning an array
 * <li> range: array of length 2, elements can also be functions. Use [-Infinity, Infinity] for infinite lines.
 * </ul>
 *
 * @example
 *     var bound = [-5, 5];
 *     var view = board.create('view3d',
 *         [[-6, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {});
 *     var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *     // Lines through 2 points
 *     var l1 = view.create('line3d', [[1, 3, 3], [-3, -3, -3]], {point1: {visible: true}, point2: {visible: true} });
 *     var l2 = view.create('line3d', [p, l1.point1]);
 *
 *     // Line by point, direction, range
 *     var l3 = view.create('line3d', [p, [0, 0, 1], [-2, 4]]);
 *
 * </pre><div id='JXG05f9baa4-6059-4502-8911-6a934f823b3d' class='jxgbox' style='width: 300px; height: 300px;'></div>
 * <script type='text/javascript'>
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG05f9baa4-6059-4502-8911-6a934f823b3d',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *         var bound = [-5, 5];
 *         var view = board.create('view3d',
 *             [[-6, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {});
 *         var p = view.create('point3d', [1, 2, 2], { name:'A', size: 5 });
 *         // Lines through 2 points
 *         var l1 = view.create('line3d', [[1, 3, 3], [-3, -3, -3]], {name: 'll1', point1: {visible: true}, point2: {visible: true} });
 *         var l2 = view.create('line3d', [p, l1.point1]);
 *         // Line by point, direction, range
 *         var l3 = view.create('line3d', [p, [0, 0, 1], [-2, 4]]);
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2},
 *             yPlaneRear: {fillOpacity: 0.2},
 *             zPlaneRear: {fillOpacity: 0.2}
 *         }
 *     );
 *
 *     var A = view.create('point3d', [0, 0, 0], {size: 2});
 *     var B = view.create('point3d', [2, 1, 1], {size: 2});
 *     var C = view.create('point3d', [-2.5, 2.5, 1.5], {size: 2});
 *
 *     // Draggable line by two points
 *     var line1 = view.create('line3d', [A, B], {
 *         fixed: false,
 *         straightFirst: true,
 *         straightLast: true,
 *         dash: 2
 *     });
 *
 *     // Line by point, direction, and range
 *     var line2 = view.create('line3d', [C, [1, 0, 0], [-1, Infinity]], {
 *         strokeColor: 'blue'
 *     });
 *
 *     // Line by point and array
 *     var line3 = view.create('line3d', [C, [-2.5, -1, 1.5]], {
 *         point2: { visible: true},
 *         strokeColor: 'red'
 *     });
 *
 * </pre><div id="JXGc42dda18-0a72-45f2-8add-3b2ad7e10853" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc42dda18-0a72-45f2-8add-3b2ad7e10853',
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
 *                 xPlaneRear: {fillOpacity: 0.2},
 *                 yPlaneRear: {fillOpacity: 0.2},
 *                 zPlaneRear: {fillOpacity: 0.2}
 *             }
 *         );
 *
 *         var A = view.create('point3d', [0, 0, 0], {size: 2});
 *         var B = view.create('point3d', [2, 1, 1], {size: 2});
 *         var C = view.create('point3d', [-2.5, 2.5, 1.5], {size: 2});
 *
 *         // Draggable line by two points
 *         var line1 = view.create('line3d', [A, B], {
 *             fixed: false,
 *             straightFirst: true,
 *             straightLast: true,
 *             dash: 2
 *         });
 *
 *         // Line by point, direction, and range
 *         var line2 = view.create('line3d', [C, [1, 0, 0], [-1, Infinity]], {
 *             strokeColor: 'blue'
 *         });
 *
 *         // Line by point and array
 *         var line3 = view.create('line3d', [C, [-2.5, -1, 1.5]], {
 *             point2: { visible: true},
 *             strokeColor: 'red'
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *  var view = board.create(
 *      'view3d',
 *      [[-6, -3], [8, 8],
 *      [[-3, 3], [-3, 3], [-3, 3]]],
 *      {
 *          depthOrder: {
 *              enabled: true
 *          },
 *          projection: 'parallel',
 *          xPlaneRear: { fillOpacity: 0.2 },
 *          yPlaneRear: { fillOpacity: 0.2 },
 *          zPlaneRear: { fillOpacity: 0.2 }
 *      }
 *  );
 *
 *
 * var A = view.create('point3d', [-2, 0, 1], { size: 2 });
 * var B = view.create('point3d', [-2, 0, 2], { size: 2 });
 * var line1 = view.create('line3d', [A, B], {
 *     fixed: false,
 *     strokeColor: 'blue',
 *     straightFirst: true,
 *     straightLast: true
 * });
 *
 * var C = view.create('point3d', [2, 0, 1], { size: 2 });
 * var line2 = view.create('line3d', [C, line1, [-Infinity, Infinity]], { strokeColor: 'red' });
 *
 * </pre><div id="JXGc9234445-de9b-4543-aae7-0ef2d0b540e6" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc9234445-de9b-4543-aae7-0ef2d0b540e6',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *                 var view = board.create(
 *                     'view3d',
 *                     [[-6, -3], [8, 8],
 *                     [[-3, 3], [-3, 3], [-3, 3]]],
 *                     {
 *                         depthOrder: {
 *                             enabled: true
 *                         },
 *                         projection: 'parallel',
 *                         xPlaneRear: { fillOpacity: 0.2 },
 *                         yPlaneRear: { fillOpacity: 0.2 },
 *                         zPlaneRear: { fillOpacity: 0.2 }
 *                     }
 *                 );
 *
 *
 *                 var A = view.create('point3d', [-2, 0, 1], { size: 2 });
 *                 var B = view.create('point3d', [-2, 0, 2], { size: 2 });
 *                 var line1 = view.create('line3d', [A, B], {
 *                     fixed: false,
 *                     strokeColor: 'blue',
 *                     straightFirst: true,
 *                     straightLast: true
 *                 });
 *
 *                 var C = view.create('point3d', [2, 0, 1], { size: 2 });
 *                 var line2 = view.create('line3d', [C, line1, [-Infinity, Infinity]], { strokeColor: 'red' });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createLine3D = function (board, parents, attributes) {
    var view = parents[0],
        attr, points,
        point, direction, range,
        point1, point2, endpoints,
        el,
        base = null,
        transform = null;

    attr = Type.copyAttributes(attributes, board.options, 'line3d');

    // In any case, parents[1] contains a point or point coordinates

    if (parents[1].type === Const.OBJECT_TYPE_LINE3D &&
        Type.isTransformationOrArray(parents[2])
    ) {
        base = parents[1];
        transform = parents[2];

        points = Type.providePoints3D(
            view,
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            attributes,
            'line3d',
            ['point1', 'point2']
        );
    }

    if (base === null &&   // No transformation
        (Type.isPoint3D(parents[2]) ||
            ( parents.length === 3 && (Type.isArray(parents[2]) || Type.isFunction(parents[2])) )
        )
    ) {
        // Line defined by two points; [view, point1, point2]
        point1 = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point1'])[0];
        point2 = Type.providePoints3D(view, [parents[2]], attributes, 'line3d', ['point2'])[0];
        direction = function () {
            return [0, point2.X() - point1.X(), point2.Y() - point1.Y(), point2.Z() - point1.Z()];
        };
        range = [0, 1]; // Segment by default
        el = new JXG.Line3D(view, point1, direction, range, attr);
        el.prepareUpdate().update();

        // Create two shadow points that are the end points of the visible line.
        // This is of relevance if the line has straightFirst or straightLast set to true, then
        // endpoints differ from point1, point2.
        // In such a case, the endpoints are the intersection of the line with the cube.
        endpoints = Type.providePoints3D(
            view,
            [
                [1, 0, 0, 0],
                [1, 0, 0, 0]
            ],
            { visible: true },
            'line3d',
            ['point1', 'point2']
        );

        /**
         * @class
         * @ignore
         */
        endpoints[0].F = function () {
            var r = 0;
            if (el.evalVisProp('straightfirst')) {
                r = -Infinity;
            }
            return el.getPointCoords(r);
        };

        /**
         * @class
         * @ignore
         */
        endpoints[1].F = function () {
            var r = 1;
            if (el.evalVisProp('straightlast')) {
                r = Infinity;
            }
            return el.getPointCoords(r);
        };
        endpoints[0].prepareUpdate().update();
        endpoints[1].prepareUpdate().update();

        // The 2D line is always a segment.
        attr = el.setAttr2D(attr);
        attr.straightfirst = false;
        attr.straightlast = false;
        el.element2D = view.create('segment', [endpoints[0].element2D, endpoints[1].element2D], attr);
        el.element2D.view = view;

        /**
         * Shadow points that determine the visible line.
         * This is of relevance if the line is defined by two points and has straightFirst or straightLast set to true.
         * In such a case, the shadow points are the intersection of the line with the cube.
         *
         * @name JXG.Point3D.endpoints
         * @type Array
         * @private
         */
        el.endpoints = endpoints;
        el.addChild(endpoints[0]);
        el.addChild(endpoints[1]);
        // el.setParents(endpoints);
        el.addParents([point1, point2]);

    } else {
        // Line defined by point, direction and range

        // Directions are handled as arrays of length 4, i.e. with homogeneous coordinates.
        if (base !== null) {
            point = Type.providePoints3D(view, [[0, 0, 0]], attributes, 'line3d', ['point'])[0];
            direction = [0, 0, 0, 0.0001];
            range = parents[3] || [-Infinity, Infinity];
        } else if (
            (Type.exists(parents[2].view) && parents[2].type === Const.OBJECT_TYPE_LINE3D) || // direction given by another line
            Type.isFunction(parents[2]) || (parents[2].length === 3) || (parents[2].length === 4) // direction given as function or array
        ) {
            point = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point'])[0];
            direction = parents[2];
            range = parents[3];
        } else {
            throw new Error(
                "JSXGraph: Can't create line3d with parents of type '" +
                    typeof parents[1] + ", "  +
                    typeof parents[2] + ", "  +
                    typeof parents[3] + "'."
            );
        }

        points = Type.providePoints3D(
            view,
            [
                [1, 0, 0, 0],
                [1, 0, 0, 0]
            ],
            attributes,
            'line3d',
            ['point1', 'point2']
        );

        // Create a line3d with two dummy points
        el = new JXG.Line3D(view, point, direction, range, attr);
        el.prepareUpdate().update();

        // Now set the real points which define the line
        /**
         * @class
         * @ignore
         */
        points[0].F = function () {
            return el.getPointCoords(Type.evaluate(el.range[0]));
        };
        points[0].prepareUpdate().update();
        point1 = points[0];

        /**
         * @class
         * @ignore
         */
        points[1].F = function () {
            return el.getPointCoords(Type.evaluate(el.range[1]));
        };
        points[1].prepareUpdate().update();
        point2 = points[1];

        attr = el.setAttr2D(attr);
        attr.straightfirst = false;
        attr.straightlast = false;
        el.element2D = view.create('segment', [point1.element2D, point2.element2D], attr);
        el.element2D.view = view;

        /**
         * Array of length 2 containing the endings of the Line3D element. These are the defining points,
         * the intersections of the line with the bounding box, or the endings defined by the range.
         * @name Line3D#endpoints
         * @type {Array}
         */
        el.endpoints = points;

        el.addParents(point);

        if (base !== null && transform !== null) {
            el.addTransform(base, transform);
            el.addParents(base);
        }
    }

    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.addParents(el);

    el.point1 = point1;
    el.point2 = point2;
    if (el.point1._is_new) {
        el.addChild(el.point1);
        delete el.point1._is_new;
    } else {
        el.point1.addChild(el);
    }
    if (el.point2._is_new) {
        el.addChild(el.point2);
        delete el.point2._is_new;
    } else {
        el.point2.addChild(el);
    }
    if (Type.exists(point)) {
        if (point._is_new) {
            el.addChild(point);
            delete point._is_new;
        } else {
            point.addChild(el);
        }
    }

    el.update();
    el.element2D.prepareUpdate().update().updateRenderer();
    return el;
};

JXG.registerElement('line3d', JXG.createLine3D);

// -----------------------
//  Planes
// -----------------------

/**
 * Constructor for 3D planes.
 * @class Creates a new 3D plane object. Do not use this constructor to create a 3D plane. Use {@link JXG.Board#create} with type {@link Plane3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Point3D|Array} point
 * @param {Array} direction1
 * @param {Array} range_u
 * @param {Array} direction2
 * @param {Array} range_v
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Plane3D = function (view, point, dir1, range_u, dir2, range_v, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_PLANE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'plane3d');

    this.board.finalizeAdding(this);

    /**
     * 3D point which - together with two direction vectors - defines the plane.
     *
     * @name point
     * @memberOf Plane3D
     * @type JXG.Point3D
     *
     * @see Plane3D#direction1
     * @see Plane3D#direction2
     */
    this.point = point;

    /**
     * Two linearly independent vectors - together with a point - define the plane. Each of these direction vectors is an
     * array of numbers or functions (either of length 3 or 4) or function returning array of length 3 or 4.
     * Homogeneous coordinates of directions have the form [0, x, y, z].
     *
     * @name Plane3D#direction1
     * @type Array|Function
     *
     * @see Plane3D.point
     * @see Plane3D#direction2
     */
    this.direction1 = dir1;

    /**
     * Two linearly independent vectors - together with a point - define the plane. Each of these direction vectors is an
     * array of numbers or functions (either of length 3 or 4) or function returning array of length 3 or 4.
     * Homogeneous coordinates of directions have the form [0, x, y, z].
     *
     * @type Array|Function
     * @name Plane3D#direction2
     * @see Plane3D.point
     * @see Plane3D#direction1
     */
    this.direction2 = dir2;

    /**
     * Range [r1, r2] of {@link direction1}. The 3D line goes from (point + r1 * direction1) to (point + r2 * direction1)
     * @name Plane3D#range_u
     * @type {Array}
     * @default [-Infinity, Infinity]
     * @default
     */
    this.range_u = range_u || [-Infinity, Infinity];

    /**
     * Range [r1, r2] of {@link direction2}. The 3D line goes from (point + r1 * direction2) to (point + r2 * direction2)
     * @name Plane3D#range_v
     * @type {Array}
     * @type {Array}
     * @default [-Infinity, Infinity]
     */
    this.range_v = range_v || [-Infinity, Infinity];

    /**
     * Spanning vector 1 of the 3D plane. Contains the evaluated coordinates from {@link direction1} and {@link range1}.
     * and is of length 4, the first entry being 0, i.e. homogenous coordinates.
     *
     * @name Plane3D#vec1
     * @type Array
     * @private
     *
     * @see Plane3D#updateCoords
     */
    this.vec1 = [0, 0, 0, 0];

    /**
     * Spanning vector 2 of the 3D plane. Contains the evaluated coordinates from {@link Plane3D#direction2} and {@link Plane3D#range2}
     * and is of length 4, the first entry being 0, i.e. homogenous coordinates.
     *
     * @name Plane3D#vec2
     * @type Array
     * @private
     *
     * @see Plane3D#updateCoords
     */
    this.vec2 = [0, 0, 0, 0];

    /**
     * Mesh (grid) element of the plane.
     *
     * @name Plane3D#mesh3d
     * @type Mesh3D
     * @private
     */
    this.mesh3d = null;

    /**
     * Normal vector of the plane. Left hand side of the Hesse normal form.
     * @name Plane3D#normal
     * @type Array
     * @private
     *
     * @see Plane3D.updateNormal
     *
     */
    this.normal = [0, 0, 0, 0];

    /**
     * Right hand side of the Hesse normal form.
     * @name Plane3D#d
     * @type Array
     * @private
     *
     * @see Plane3D.updateNormal
     *
     */
    this.d = 0;

    this.updateCoords();
    this.updateNormal();

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Plane3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Plane3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Plane3D.prototype,
    /** @lends JXG.Plane3D.prototype */ {

        /**
         * Get coordinate array [x, y, z] of a point on the plane for parameters (u, v).
         *
         * @name Plane3D#F
         * @function
         * @param {Number} u
         * @param {Number} v
         * @returns Array of length 3.
         */
        F: function (u, v) {
            var i, v1, v2, l1, l2;

            v1 = this.vec1.slice();
            v2 = this.vec2.slice();
            l1 = Mat.norm(v1, 3);
            l2 = Mat.norm(v2, 3);
            for (i = 0; i < 3; i++) {
                v1[i] /= l1;
                v2[i] /= l2;
            }

            return [
                this.point.X() + u * v1[0] + v * v2[0],
                this.point.Y() + u * v1[1] + v * v2[1],
                this.point.Z() + u * v1[2] + v * v2[2]
            ];
        },

        /**
         * Get x-coordinate of a point on the plane for parameters (u, v).
         *
         * @name Plane3D#X
         * @function
         * @param {Number} u
         * @param {Number} v
         * @returns Number
         */
        X: function(u, v) {
            return this.F(u, v)[0];
        },

        /**
         * Get y-coordinate of a point on the plane for parameters (u, v).
         *
         * @name Plane3D#Y
         * @function
         * @param {Number} u
         * @param {Number} v
         * @returns Number
         */
        Y: function(u, v) {
            return this.F(u, v)[1];
        },

        /**
         * Get z-coordinate of a point on the plane for parameters (u, v).
         *
         * @name Plane3D#Z
         * @function
         * @param {Number} u
         * @param {Number} v
         * @returns Number
         */
        Z: function(u, v) {
            return this.F(u, v)[2];
        },

        /**
         * Update the arrays {@link JXG.Plane3D#vec1} and {@link JXG.Plane3D#vec1} containing the homogeneous coords of the spanning vectors.
         *
         * @name Plane3D#updateCoords
         * @function
         * @returns {Object} Reference to Plane3D object
         * @private
         */
        updateCoords: function() {
            var i, s;

            if (Type.exists(this.direction1.view) && this.direction1.type === Const.OBJECT_TYPE_LINE3D) {
                this.vec1 = this.direction1.vec.slice();
            } else if (Type.isFunction(this.direction1)) {
                this.vec1 = Type.evaluate(this.direction1);
                if (this.vec1.length === 3) {
                    this.vec1.unshift(0);
                }
            } else {
                s = 0;
                if (this.direction1.length === 3) {
                    this.vec1[0] = 0;
                    s = 1;
                }
                for (i = 0; i < this.direction1.length; i++) {
                    this.vec1[s + i] = Type.evaluate(this.direction1[i]);
                }
            }

            if (Type.exists(this.direction2.view) && this.direction2.type === Const.OBJECT_TYPE_LINE3D) {
                this.vec2 = this.direction2.vec.slice();
            } else if (Type.isFunction(this.direction2)) {
                this.vec2 = Type.evaluate(this.direction2);
                if (this.vec2.length === 3) {
                    this.vec2.unshift(0);
                }
            } else {
                s = 0;
                if (this.direction2.length === 3) {
                    this.vec2[0] = 0;
                    s = 1;
                }
                for (i = 0; i < this.direction2.length; i++) {
                    this.vec2[s + i] = Type.evaluate(this.direction2[i]);
                }
            }

            return this;
        },

        /**
         * Update the Hesse normal form of the plane, i.e. update normal vector and right hand side.
         * Updates also {@link vec1} and {@link vec2}.
         *
         * @name Plane3D#updateNormal
         * @function
         * @returns {Object} Reference to the Plane3D object
         * @private
         * @example
         *    plane.updateNormal();
         *
         */
        updateNormal: function () {
            var i, len;

            if (!this.needsUpdate) {
                // Extraordinary update, conflicts with rotating of box and plane transformations
                // this.updateCoords();
            }

            this.normal = Mat.crossProduct(this.vec1.slice(1), this.vec2.slice(1));

            len = Mat.norm(this.normal);
            if (Math.abs(len) > Mat.eps * Mat.eps) {
                for (i = 0; i < 3; i++) {
                    this.normal[i] /= len;
                }
            }
            this.normal.unshift(0);
            this.d = Mat.innerProduct(this.point.coords, this.normal, 4);

            return this;
        },

        // Already documented in element3d.js
        updateDataArray: function () {
            var s1, e1, s2, e2, c2d, l1, l2,
                planes = ['xPlaneRear', 'yPlaneRear', 'zPlaneRear'], // Must be ordered x, y, z
                points = [],
                v1 = [0, 0, 0],
                v2 = [0, 0, 0],
                q = [0, 0, 0],
                p = [0, 0, 0],
                eps = 1.e-12,
                d, i, j, a, b, first, pos, pos_akt,
                view = this.view;

            this.dataX = [];
            this.dataY = [];

            this.updateNormal();

            // Infinite plane
            if (
                this.elType !== 'axisplane3d' &&
                view.defaultAxes &&
                Type.evaluate(this.range_u[0]) === -Infinity &&
                Type.evaluate(this.range_u[1]) === Infinity &&
                Type.evaluate(this.range_v[0]) === -Infinity &&
                Type.evaluate(this.range_v[1]) === Infinity
            ) {
                // Determine the intersections of the new plane with
                // the view bbox3d.
                //
                // Start with the rear plane.
                // For each face of the bbox3d we determine two points
                // which are the end points of the intersecting line
                // between the plane and a face of bbox3d.
                // We start with the three rear planes (set in planes[] above)
                for (j = 0; j < planes.length; j++) {
                    p = view.intersectionPlanePlane(this, view.defaultAxes[planes[j]]);
                    if (p[0] !== false && p[1] !== false) {
                        // This test is necessary to filter out intersection lines which are
                        // identical to intersections of axis planes (they would occur twice),
                        // i.e. edges of bbox3d.
                        for (i = 0; i < points.length; i++) {
                            if (
                                (Geometry.distance(p[0], points[i][0], 4) < eps &&
                                    Geometry.distance(p[1], points[i][1], 4) < eps) ||
                                (Geometry.distance(p[0], points[i][1], 4) < eps &&
                                    Geometry.distance(p[1], points[i][0], 4) < eps)
                            ) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }

                    // Take a point on the corresponding front plane of bbox3d.
                    p = [1, 0, 0, 0];
                    p[j + 1] = view.bbox3D[j][1];

                    // Use the Hesse normal form of front plane to intersect it with the plane
                    // d is the rhs of the Hesse normal form of the front plane.
                    d = Mat.innerProduct(p, view.defaultAxes[planes[j]].normal, 4);
                    p = view.intersectionPlanePlane(this, view.defaultAxes[planes[j]], d);

                    if (p[0] !== false && p[1] !== false) {
                        // Do the same test as above
                        for (i = 0; i < points.length; i++) {
                            // Same test for edges of bbox3d as above
                            if (
                                (Geometry.distance(p[0], points[i][0], 4) < eps &&
                                    Geometry.distance(p[1], points[i][1], 4) < eps) ||
                                (Geometry.distance(p[0], points[i][1], 4) < eps &&
                                    Geometry.distance(p[1], points[i][0], 4) < eps)
                            ) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }
                }

                // Handle the case that the plane does not intersect bbox3d at all.
                if (points.length === 0) {
                    return { X: this.dataX, Y: this.dataY };
                }

                // Concatenate the intersection points to a polygon.
                // If all went well, each intersection should appear
                // twice in the list.
                first = 0;
                pos = first;
                i = 0;
                do {
                    p = points[pos][i];
                    if (p.length === 4) {
                        c2d = view.project3DTo2D(p);
                        this.dataX.push(c2d[1]);
                        this.dataY.push(c2d[2]);
                    }
                    i = (i + 1) % 2;
                    p = points[pos][i];

                    pos_akt = pos;
                    for (j = 0; j < points.length; j++) {
                        if (j !== pos && Geometry.distance(p, points[j][0]) < eps) {
                            pos = j;
                            i = 0;
                            break;
                        }
                        if (j !== pos && Geometry.distance(p, points[j][1]) < eps) {
                            pos = j;
                            i = 1;
                            break;
                        }
                    }
                    if (pos === pos_akt) {
                        console.log('Error plane3d update: did not find next', pos);
                        break;
                    }
                } while (pos !== first);

                c2d = view.project3DTo2D(points[first][0]);
                this.dataX.push(c2d[1]);
                this.dataY.push(c2d[2]);
            } else {
                // 3D bounded flat
                s1 = Type.evaluate(this.range_u[0]);
                e1 = Type.evaluate(this.range_u[1]);
                s2 = Type.evaluate(this.range_v[0]);
                e2 = Type.evaluate(this.range_v[1]);

                q = this.point.coords;
                v1 = this.vec1.slice();
                v2 = this.vec2.slice();
                l1 = Mat.norm(v1, 4);
                l2 = Mat.norm(v2, 4);
                for (i = 1; i < 4; i++) {
                    v1[i] /= l1;
                    v2[i] /= l2;
                }

                for (j = 0; j < 4; j++) {
                    switch (j) {
                        case 0:
                            a = s1;
                            b = s2;
                            break;
                        case 1:
                            a = e1;
                            b = s2;
                            break;
                        case 2:
                            a = e1;
                            b = e2;
                            break;
                        case 3:
                            a = s1;
                            b = e2;
                    }
                    for (i = 0; i < 4; i++) {
                        p[i] = q[i] + a * v1[i] + b * v2[i];
                    }
                    c2d = view.project3DTo2D(p);
                    this.dataX.push(c2d[1]);
                    this.dataY.push(c2d[2]);
                }
                // Close the curve
                this.dataX.push(this.dataX[0]);
                this.dataY.push(this.dataY[0]);
            }
            return { X: this.dataX, Y: this.dataY };
        },

        // Already documented in element3d.js
        addTransform: function (el, transform) {
            this.addTransformGeneric(el, transform);
            this.point.addTransform(el.point, transform);
            return this;
        },

        // Already documented in element3d.js
        updateTransform: function () {
            var c1, c2, i;

            if (this.transformations.length === 0 || this.baseElement === null) {
                return this;
            }

            if (this === this.baseElement) {
                c1 = this.vec1;
                c2 = this.vec2;
            } else {
                c1 = this.baseElement.vec1;
                c2 = this.baseElement.vec2;
            }

            for (i = 0; i < this.transformations.length; i++) {
                this.transformations[i].update();
                c1 = Mat.matVecMult(this.transformations[i].matrix, c1);
                c2 = Mat.matVecMult(this.transformations[i].matrix, c2);
            }
            this.vec1 = c1;
            this.vec2 = c2;

            return this;
        },

        // Already documented in element3d.js
        update: function () {
            if (this.needsUpdate) {
                this.updateCoords()
                    .updateTransform();
            }
            return this;
        },

        // Already documented in element3d.js
        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        // Already documented in element3d.js
        projectCoords: function (p, params) {
            return Geometry.projectCoordsToParametric(p, this, 2, params);
        }
    }
);

/**
 * @class A 3D plane is defined either by a point and two linearly independent vectors, or by three points.
 *
 * @description
 * A 3D plane is defined either by a point and two linearly independent vectors, or by three points.
 * In the first case, the parameters are a 3D point (or a coordinate array) and two vectors (arrays).
 * In the second case, the parameters consist of three 3D points (given as points or coordinate arrays).
 * In order to distinguish the two cases, in the latter case (three points), the additional attribute {@link Plane3D#threePoints}
 * has to be supplied if both, the second point and the third point, are given as arrays or functions. Otherwise, it would not be
 * clear if the input arrays have to be interpreted as points or directions.
 * <p>
 * All coordinate arrays can be supplied as functions returning a coordinate array.
 *
 * @pseudo
 * @name  Plane3D
 * @augments JXG.GeometryElement3D
 * @constructor
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 *
 * @param {JXG.Point3D,array,function_JXG.Line3D,array,function_JXG.Line3D,array,function_array,function_array,function} point,direction1,direction2,[range1],[range2] The plane is defined by point, direction1, direction2, range1, and range2.
 * <ul>
 * <li> point: Point3D or array of length 3
 * <li> direction1: line3d element or array of length 3 or function returning an array of numbers or function returning an array
 * <li> direction2: line3d element or array of length 3 or function returning an array of numbers or function returning an array
 * <li> range1: array of length 2, elements can also be functions. Use [-Infinity, Infinity] for infinite lines.
 * <li> range2: array of length 2, elements can also be functions. Use [-Infinity, Infinity] for infinite lines.
 * </ul>
 * @param {JXG.Point3D,array,function_JXG.Point3D,array,function_JXG.Point3D,array,function} point1,point2,point3 The plane is defined by three points.
 * @type JXG.Plane3D
 *
 * @example
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2},
 *             yPlaneRear: {fillOpacity: 0.2},
 *             zPlaneRear: {fillOpacity: 0.2}
 *         }
 *     );
 *
 *     var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *     // Infinite Plane by point and two directions
 *     var plane = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0], [-Infinity, Infinity], [-Infinity, Infinity]]);
 *
 * </pre><div id="JXG69f491ef-d7c7-4105-a962-86a588fbd23b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG69f491ef-d7c7-4105-a962-86a588fbd23b',
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
 *                 xPlaneRear: {fillOpacity: 0.2},
 *                 yPlaneRear: {fillOpacity: 0.2},
 *                 zPlaneRear: {fillOpacity: 0.2}
 *             }
 *         );
 *
 *         var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *         // Infinite Plane by point and two directions
 *         var plane = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0], [-Infinity, Infinity], [-Infinity, Infinity]]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2},
 *             yPlaneRear: {fillOpacity: 0.2},
 *             zPlaneRear: {fillOpacity: 0.2}
 *         }
 *     );
 *
 *     var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *     // Finite Plane by point and two directions
 *     var plane1 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0], [-2, 2], [-2, 2]]);
 *     var plane2 = view.create('plane3d', [[0, 0, -1], [1, 0, 0], [0, 1, 0], [-2, 2], [-2, 2]], {
 *         mesh3d: { visible: true },
 *         point: {visible: true, name: "B", fixed: false}
 *     });
 *
 * </pre><div id="JXGea9dda1b-748b-4ed3-b4b3-57e310bd8141" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGea9dda1b-748b-4ed3-b4b3-57e310bd8141',
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
 *                 xPlaneRear: {fillOpacity: 0.2},
 *                 yPlaneRear: {fillOpacity: 0.2},
 *                 zPlaneRear: {fillOpacity: 0.2}
 *             }
 *         );
 *
 *         var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *         // Finite Plane by point and two directions
 *         var plane1 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0], [-2, 2], [-2, 2]]);
 *         var plane2 = view.create('plane3d', [[0, 0, -1], [1, 0, 0], [0, 1, 0], [-2, 2], [-2, 2]], {
 *             mesh3d: { visible: true },
 *             point: {visible: true, name: "B", fixed: false}
 *         });
 *
 *     })();
 *
 * </script><pre>
 * @example
 *             var view = board.create(
 *                 'view3d',
 *                 [[-6, -3], [8, 8],
 *                 [[-3, 3], [-3, 3], [-3, 3]]],
 *                 {
 *                     depthOrder: {
 *                         enabled: true
 *                     },
 *                     projection: 'central',
 *                     xPlaneRear: { visible: false, fillOpacity: 0.2 },
 *                     yPlaneRear: { visible: false, fillOpacity: 0.2 },
 *                     zPlaneRear: { fillOpacity: 0.2 }
 *                 }
 *             );
 *
 *             var A = view.create('point3d', [-2, 0, 1], { size: 2 });
 *
 *             var line1 = view.create('line3d', [A, [0, 0, 1], [-Infinity, Infinity]], { strokeColor: 'blue' });
 *             var line2 = view.create('line3d', [A, [1, 1, 0], [-Infinity, Infinity]], { strokeColor: 'blue' });
 *
 *             // Plane by point and two lines
 *             var plane2 = view.create('plane3d', [A, line1, line2], {
 *                 fillColor: 'blue'
 *             });
 *
 * </pre><div id="JXG8bc6e266-e27c-4ffa-86a2-8076f4069573" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG8bc6e266-e27c-4ffa-86a2-8076f4069573',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *                 var view = board.create(
 *                     'view3d',
 *                     [[-6, -3], [8, 8],
 *                     [[-3, 3], [-3, 3], [-3, 3]]],
 *                     {
 *                         depthOrder: {
 *                             enabled: true
 *                         },
 *                         projection: 'central',
 *                         xPlaneRear: { visible: false, fillOpacity: 0.2 },
 *                         yPlaneRear: { visible: false, fillOpacity: 0.2 },
 *                         zPlaneRear: { fillOpacity: 0.2 }
 *                     }
 *                 );
 *
 *                 var A = view.create('point3d', [-2, 0, 1], { size: 2 });
 *
 *                 var line1 = view.create('line3d', [A, [0, 0, 1], [-Infinity, Infinity]], { strokeColor: 'blue' });
 *                 var line2 = view.create('line3d', [A, [1, 1, 0], [-Infinity, Infinity]], { strokeColor: 'blue' });
 *
 *                 // Plane by point and two lines
 *                 var plane2 = view.create('plane3d', [A, line1, line2], {
 *                     fillColor: 'blue'
 *                 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2},
 *             yPlaneRear: {fillOpacity: 0.2},
 *             zPlaneRear: {fillOpacity: 0.2}
 *         }
 *     );
 *
 *     var A = view.create('point3d', [0, 0, 1], {size: 2});
 *     var B = view.create('point3d', [2, 2, 1], {size: 2});
 *     var C = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *     // Plane by three points
 *     var plane = view.create('plane3d', [A, B, C], {
 *         fillColor: 'blue'
 *     });
 *
 * </pre><div id="JXG139100df-3ece-4cd1-b34f-28b5b3105106" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG139100df-3ece-4cd1-b34f-28b5b3105106',
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
 *                 xPlaneRear: {fillOpacity: 0.2},
 *                 yPlaneRear: {fillOpacity: 0.2},
 *                 zPlaneRear: {fillOpacity: 0.2}
 *             }
 *         );
 *
 *         var A = view.create('point3d', [0, 0, 1], {size: 2});
 *         var B = view.create('point3d', [2, 2, 1], {size: 2});
 *         var C = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *         // Plane by three points
 *         var plane = view.create('plane3d', [A, B, C], {
 *             fillColor: 'blue'
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2},
 *             yPlaneRear: {fillOpacity: 0.2},
 *             zPlaneRear: {fillOpacity: 0.2}
 *         }
 *     );
 *
 *     var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *     // Infinite Plane by two directions,
 *     // range1 = range2 = [-Infinity, Infinity]
 *     var plane1 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0]], {
 *         fillColor: 'blue',
 *     });
 *
 *     // Infinite Plane by three points,
 *     var plane2 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0]], {
 *         threePoints: true,
 *         fillColor: 'red',
 *         point2: {visible: true},
 *         point3: {visible: true}
 *     });
 *
 * </pre><div id="JXGf31b9666-0c2e-45e7-a186-ae2c07b6bdb8" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGf31b9666-0c2e-45e7-a186-ae2c07b6bdb8',
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
 *                 xPlaneRear: {fillOpacity: 0.2},
 *                 yPlaneRear: {fillOpacity: 0.2},
 *                 zPlaneRear: {fillOpacity: 0.2}
 *             }
 *         );
 *
 *         var A = view.create('point3d', [-2, 0, 1], {size: 2});
 *
 *         // Infinite Plane by two directions,
 *         // range1 = range2 = [-Infinity, Infinity]
 *         var plane1 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0]], {
 *             fillColor: 'blue',
 *         });
 *
 *         // Infinite Plane by three points,
 *         var plane2 = view.create('plane3d', [A, [1, 0, 0], [0, 1, 0]], {
 *             threePoints: true,
 *             fillColor: 'red',
 *             point2: {visible: true},
 *             point3: {visible: true}
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createPlane3D = function (board, parents, attributes) {
    var view = parents[0],
        attr,
        point, point2, point3,
        dir1, dir2, range_u, range_v,
        el, mesh3d,
        base = null,
        transform = null;

    attr = Type.copyAttributes(attributes, board.options, 'plane3d');
    if (//parents.length === 4 &&
        // ()
        attr.threepoints || Type.isPoint3D(parents[2]) || Type.isPoint3D(parents[3])
    ) {
        // Three points
        point = Type.providePoints3D(view, [parents[1]], attributes, 'plane3d', ['point1'])[0];
        point2 = Type.providePoints3D(view, [parents[2]], attributes, 'plane3d', ['point2'])[0];
        point3 = Type.providePoints3D(view, [parents[3]], attributes, 'plane3d', ['point3'])[0];
        dir1 = function() {
            return [point2.X() - point.X(), point2.Y() - point.Y(), point2.Z() - point.Z()];
        };
        dir2 = function() {
            return [point3.X() - point.X(), point3.Y() - point.Y(), point3.Z() - point.Z()];
        };
        range_u = parents[4] || [-Infinity, Infinity];
        range_v = parents[5] || [-Infinity, Infinity];
    } else {
        if (parents[1].type === Const.OBJECT_TYPE_PLANE3D &&
            Type.isTransformationOrArray(parents[2])
        ) {
            // Plane + transformation
            base = parents[1];
            transform = parents[2];

            point = Type.providePoints3D(view, [[0, 0, 0, 0]],  attributes,  'plane3d', ['point'])[0];
            dir1 = [0, 0.0001, 0, 0];
            dir2 = [0, 0, 0.0001, 0];
            range_u = parents[3] || [-Infinity, Infinity];
            range_v = parents[4] || [-Infinity, Infinity];
        } else {
            // Point, direction and ranges
            point = Type.providePoints3D(view, [parents[1]], attributes, 'plane3d', ['point'])[0];
            dir1 = parents[2];
            dir2 = parents[3];
            range_u = parents[4] || [-Infinity, Infinity];
            range_v = parents[5] || [-Infinity, Infinity];
        }
        if (point === false) {
            throw new Error(
                "JSXGraph: Can't create plane3d with first parent of type '" + typeof parents[1] +
                    "'." +
                    "\nPossible first parent types are: point3d, array of length 3, function returning an array of length 3."
            );
        }
        if ((base !== null && parents < 3) || (base === null && parents.length < 4)) {
            throw new Error(
                "JSXGraph: Can't create plane3d with parents of type '" +
                    typeof parents[1] + ", "  +
                    typeof parents[2] + ", "  +
                    typeof parents[3] + ", "  +
                    typeof parents[4] + ", "  +
                    typeof parents[5] + "'."
            );
        }
    }

    el = new JXG.Plane3D(view, point, dir1, range_u, dir2, range_v, attr);
    point.addChild(el);

    attr = el.setAttr2D(attr);
    el.element2D = view.create('curve', [[], []], attr);
    el.element2D.view = view;

    if (base !== null && transform !== null) {
        el.addTransform(base, transform);
        el.addParents(base);
    }

    /**
     * @class
     * @ignore
     */
    el.element2D.updateDataArray = function () {
        var ret = el.updateDataArray();
        this.dataX = ret.X;
        this.dataY = ret.Y;
    };
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    if (
        Math.abs(el.range_u[0]) !== Infinity &&
        Math.abs(el.range_u[1]) !== Infinity &&
        Math.abs(el.range_v[0]) !== Infinity &&
        Math.abs(el.range_v[1]) !== Infinity
    ) {
        attr = Type.copyAttributes(attr.mesh3d, board.options, 'mesh3d');
        mesh3d = view.create('mesh3d', [
            function () {
                return point.coords;
            },
            // dir1, dir2, range_u, range_v
            function() { return el.vec1; },
            function() { return el.vec2; },
            el.range_u,
            el.range_v
        ], attr);
        el.mesh3d = mesh3d;
        el.addChild(mesh3d);
        el.inherits.push(mesh3d);           // TODO Does not work
        el.element2D.inherits.push(mesh3d); // Does work - instead
        mesh3d.setParents(el);
        el.mesh3d.view = view;
    }

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement('plane3d', JXG.createPlane3D);

/**
 * @class The line that is the intersection of two (infinite) plane elements in 3D.
 *
 * @pseudo
 * @name IntersectionLine3D
 * @augments JXG.Line3D
 * @constructor
 * @type JXG.Line3D
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Plane3D_JXG.Plane3D} el1,el2 The result will be the intersection of el1 and el2.
 * @example
 * // Create the intersection line of two planes
 * var view = board.create(
 *     'view3d',
 *     [[-6, -3], [8, 8],
 *     [[-1, 3], [-1, 3], [-1, 3]]],
 *     {
 *         xPlaneRear: {visible:false},
 *         yPlaneRear: {visible:false},
 *         zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *     }
 * );
 * var a = view.create('point3d', [2, 2, 0]);
 *
 * var p1 = view.create(
 *    'plane3d',
 *     [a, [1, 0, 0], [0, 1, 0]],
 *     {fillColor: '#00ff80'}
 * );
 * var p2 = view.create(
 *    'plane3d',
 *     [a, [-2, 1, 1], [1, -2, 1]],
 *     {fillColor: '#ff0000'}
 * );
 *
 * var i = view.create('intersectionline3d', [p1, p2]);
 *
 * </pre><div id="JXGdb931076-b29a-4eff-b97e-4251aaf24943" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGdb931076-b29a-4eff-b97e-4251aaf24943',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var view = board.create(
 *             'view3d',
 *             [[-6, -3], [8, 8],
 *             [[-1, 3], [-1, 3], [-1, 3]]],
 *             {
 *                 xPlaneRear: {visible:false},
 *                 yPlaneRear: {visible:false},
 *                 zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *             }
 *         );
 *     var a = view.create('point3d', [2, 2, 0]);
 *
 *     var p1 = view.create(
 *        'plane3d',
 *         [a, [1, 0, 0], [0, 1, 0]],
 *         {fillColor: '#00ff80'}
 *     );
 *     var p2 = view.create(
 *        'plane3d',
 *         [a, [-2, 1, 1], [1, -2, 1]],
 *         {fillColor: '#ff0000'}
 *     );
 *
 *     var i = view.create('intersectionline3d', [p1, p2]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createIntersectionLine3D = function (board, parents, attributes) {
    var view = parents[0],
        el1 = parents[1],
        el2 = parents[2],
        ixnLine, i, func,
        attr = Type.copyAttributes(attributes, board.options, 'intersectionline3d'),
        pts = [];

    func = Geometry.intersectionFunction3D(view, el1, el2);
    for (i = 0; i < 2; i++) {
        pts[i] = view.create('point3d', func[i], attr['point' + (i + 1)]);
    }
    ixnLine = view.create('line3d', pts, attr);

    try {
        el1.addChild(ixnLine);
        el2.addChild(ixnLine);
    } catch (_e) {
        throw new Error(
            "JSXGraph: Can't create 'intersection' with parent types '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'."
        );
    }

    ixnLine.type = Const.OBJECT_TYPE_INTERSECTION_LINE3D;
    ixnLine.elType = 'intersectionline3d';
    ixnLine.setParents([el1.id, el2.id]);

    return ixnLine;
};

JXG.registerElement('intersectionline3d', JXG.createIntersectionLine3D);
