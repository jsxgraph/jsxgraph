/*
    Copyright 2008-2024
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

    this.board.finalizeAdding(this);

    /**
     * 3D point which - together with a direction - defines the line.
     * @type JXG.Point3D
     *
     * @see JXG.Line3D#direction
     */
    this.point = point;

    /**
     * Direction which - together with a point - defines the line. Array of numbers or functions (of length 3) or function
     * returning array of length 3.
     *
     * @type Array|Function
     * @see JXG.Line3D#point
     */
    this.direction = direction;

    /**
     * Range [r1, r2] of the line. r1, r2 can be numbers or functions.
     * The 3D line goes from (point + r1 * direction) to (point + r2 * direction)
     * @type Array
     */
    this.range = range || [-Infinity, Infinity];

    /**
     * Starting point of the 3D line
     * @type JXG.Point3D
     * @private
     */
    this.point1 = null;

    /**
     * End point of the 3D line
     * @type JXG.Point3D
     * @private
     */
    this.point2 = null;

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
         * Determine one end point of a 3D line from point, direction and range.
         *
         * @param {Number|function} r
         * @private
         * @returns Array
         */
        getPointCoords: function (r) {
            var p = [],
                d = [],
                i,
                r0;

            p = [this.point.X(), this.point.Y(), this.point.Z()];

            if (Type.isFunction(this.direction)) {
                d = this.direction();
            } else {
                for (i = 1; i < 4; i++) {
                    d.push(Type.evaluate(this.direction[i]));
                }
            }

            // Intersect the ray - if necessary - with the cube,
            // i.e. clamp the line.
            r0 = Type.evaluate(r);
            r = this.view.intersectionLineCube(p, d, r0);

            return [p[0] + d[0] * r, p[1] + d[1] * r, p[2] + d[2] * r];
        },

        update: function () {
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        projectCoords: function (p) {
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
                t_clamped = Math.min(Math.max(t, this.range[0]), this.range[1]),
                c3d;

            c3d = this.getPointCoords(t_clamped).slice();
            c3d.unshift(1);
            return c3d;
        },

        projectScreenCoords: function (pScr) {
            var end0 = this.getPointCoords(0),
                end1 = this.getPointCoords(1);

            return this.view.projectScreenToSegment(pScr, end0, end1);
        }
    }
);

/**
 * @class This element is used to provide a constructor for a 3D line.
 * @pseudo
 * @description There are two possibilities to create a Line3D object.
 * <p>
 * First: the line in 3D is defined by two points in 3D (Point3D).
 * The points can be either existing points or coordinate arrays of
 * the form [x, y, z].
 * <p>Second: the line in 3D is defined by a point (or coordinate array [x, y, z])
 * a direction given as array [x, y, z] and an optional range
 * given as array [s, e]. The default value for the range is [-Infinity, Infinity].
 * <p>
 * All numbers can also be provided as functions returning a number.
 *
 * @name Line3D
 * @augments JXG.GeometryElement3D
 * @constructor
 * @type JXG.Line3D
 * @throws {Exception} If the element cannot be constructed with the given parent
 * objects an exception is thrown.
 * @param {JXG.Point3D,array,function_JXG.Point3D,array,function} point1,point2 First and second defining point.
 * @param {JXG.Point3D,array,function_array,function_array,function} point,direction,range Alternatively, point, direction and range can be supplied.
 * <ul>
 * <li> point: Point3D or array of length 3
 * <li> direction: array of length 3 or function returning an array of numbers or function returning an array
 * <li> range: array of length 2, elements can also be functions.
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
 */
JXG.createLine3D = function (board, parents, attributes) {
    var view = parents[0],
        attr, points,
        point, direction, range,
        point1, point2, endpoints,
        el;

    attr = Type.copyAttributes(attributes, board.options, 'line3d');

    // In any case, parents[1] contains a point or point coordinates

    if (
        Type.isPoint3D(parents[2]) ||
        (parents.length === 3 && (Type.isArray(parents[2]) || Type.isFunction(parents[2])))
    ) {
        // Line defined by two points; [view, point1, point2]

        point1 = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point1'])[0];
        point2 = Type.providePoints3D(view, [parents[2]], attributes, 'line3d', ['point2'])[0];
        direction = function () {
            return [point2.X() - point1.X(), point2.Y() - point1.Y(), point2.Z() - point1.Z()];
        };
        range = [0, 1]; // Segment by default
        el = new JXG.Line3D(view, point1, direction, range, attr);

        // Create two shadow points that are the end points of the visible line.
        // This is of relevance if the line has straightFirst or straightLast set to true, then
        // endpoints differ from point1, point2.
        // In such a case, the endpoints are the intersection of the line with the cube.
        endpoints = Type.providePoints3D(
            view,
            [
                [0, 0, 0],
                [0, 0, 0]
            ],
            { visible: false },
            'line3d',
            ['point1', 'point2']
        );

        endpoints[0].F = function () {
            var r = 0;
            if (Type.evaluate(el.visProp.straightfirst)) {
                r = -Infinity;
            }
            return el.getPointCoords(r);
        };
        endpoints[1].F = function () {
            var r = 1;
            if (Type.evaluate(el.visProp.straightlast)) {
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
        el.setParents(endpoints);

    } else {
        // Line defined by point, direction and range

        point = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point'])[0];

        // Directions are handled as arrays of length 4,
        // i.e. with homogeneous coordinates.
        if (Type.isFunction(parents[2])) {
            direction = parents[2];
        } else if (parents[2].length === 3) {
            direction = [1].concat(parents[2]);
        } else if (parents[2].length === 4) {
            direction = parents[2];
        } else {
            // TODO Throw error
        }
        range = parents[3];

        points = Type.providePoints3D(
            view,
            [
                [0, 0, 0],
                [0, 0, 0]
            ],
            attributes,
            'line3d',
            ['point1', 'point2']
        );

        // Create a line3d with two dummy points
        el = new JXG.Line3D(view, point, direction, range, attr);

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

        el.endpoints = points;
    }
    // TODO Throw error

    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);
    // el.setParents([point1.id, point2.id]);

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
 * @param {Array} range1
 * @param {Array} direction2
 * @param {Array} range2
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Plane3D = function (view, point, dir1, range1, dir2, range2, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_PLANE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'plane3d');

    this.board.finalizeAdding(this);

    /**
     * 3D point which - together with two direction vectors - defines the plane.
     *
     * @type JXG.Point3D
     *
     * @see JXG.3D#direction1
     * @see JXG.3D#direction2
     */
    this.point = point;

    /**
     * Two linearly independent vectors - together with a point - define the plane. Each of these direction vectors is an
     * array of numbers or functions (of length 3) or function returning array of length 3.
     *
     * @type Array|Function
     *
     * @see JXG.Plane3D#point
     * @see JXG.Plane3D#direction2
     */
    this.direction1 = dir1;

    /**
     * Two linearly independent vectors - together with a point - define the plane. Each of these direction vectors is an
     * array of numbers or functions (of length 3) or function returning array of length 3.
     *
     * @type Array|Function
     * @see JXG.Plane3D#point
     * @see JXG.Plane3D#direction1
     */
    this.direction2 = dir2;

    /**
     * Range [r1, r2] of {@link direction1}. The 3D line goes from (point + r1 * direction1) to (point + r2 * direction1)
     * @type {Array}
     */
    this.range1 = range1 || [-Infinity, Infinity];

    /**
     * Range [r1, r2] of {@link direction2}. The 3D line goes from (point + r1 * direction2) to (point + r2 * direction2)
     * @type {Array}
     */
    this.range2 = range2 || [-Infinity, Infinity];

    /**
     * Direction vector 1 of the 3D plane. Contains the evaluated coordinates from {@link direction1} and {@link range1}.
     * @type Array
     * @private
     *
     * @see updateNormal
     */
    this.vec1 = [0, 0, 0];

    /**
     * Direction vector 2 of the 3D plane. Contains the evaluated coordinates from {@link direction2} and {@link range2}.
     *
     * @type Array
     * @private
     *
     * @see updateNormal
     */
    this.vec2 = [0, 0, 0];

    this.grid = null;

    /**
         * Normal vector of the plane. Left hand side of the Hesse normal form.

        * @type Array
         * @private
         *
         * @see updateNormal
         *
         */
    this.normal = [0, 0, 0];

    /**
         * Right hand side of the Hesse normal form.

        * @type Array
         * @private
         *
         * @see updateNormal
         *
         */
    this.d = 0;

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
         * Update the Hesse normal form of the plane, i.e. update normal vector and right hand side.
         * Updates also {@link vec1} and {@link vec2}.
         *
         * @name JXG.Plane3D#updateNormal
         * @function
         * @returns {Object} Reference to the Plane3D object
         * @private
         * @example
         *    plane.updateNormal();
         *
         */
        updateNormal: function () {
            var i, len;
            for (i = 0; i < 3; i++) {
                this.vec1[i] = Type.evaluate(this.direction1[i]);
                this.vec2[i] = Type.evaluate(this.direction2[i]);
            }

            this.normal = Mat.crossProduct(this.vec1, this.vec2);

            len = Mat.norm(this.normal);
            if (Math.abs(len) > Mat.eps) {
                for (i = 0; i < 3; i++) {
                    this.normal[i] /= len;
                }
            }
            this.d = Mat.innerProduct(this.point.coords.slice(1), this.normal, 3);

            return this;
        },

        updateDataArray: function () {
            var s1, e1, s2, e2, c2d, l1, l2,
                planes = ['xPlaneRear', 'yPlaneRear', 'zPlaneRear'],
                points = [],
                v1 = [0, 0, 0],
                v2 = [0, 0, 0],
                q = [0, 0, 0],
                p = [0, 0, 0],
                d, i, j, a, b, first, pos, pos_akt,
                view = this.view;

            this.dataX = [];
            this.dataY = [];

            this.updateNormal();

            // Infinite plane
            if (
                this.elType !== 'axisplane3d' &&
                view.defaultAxes &&
                Type.evaluate(this.range1[0]) === -Infinity &&
                Type.evaluate(this.range1[1]) === Infinity &&
                Type.evaluate(this.range2[0]) === -Infinity &&
                Type.evaluate(this.range2[1]) === Infinity
            ) {
                // Start with the rear plane.
                // Determine the intersections with the view bbox3d
                // For each face of the bbox3d we determine two points
                // which are the ends of the intersection line.
                // We start with the three rear planes.
                for (j = 0; j < planes.length; j++) {
                    p = view.intersectionPlanePlane(this, view.defaultAxes[planes[j]]);

                    if (p[0].length === 3 && p[1].length === 3) {
                        // This test is necessary to filter out intersection lines which are
                        // identical to intersections of axis planes (they would occur twice).
                        for (i = 0; i < points.length; i++) {
                            if (
                                (Geometry.distance(p[0], points[i][0], 3) < Mat.eps &&
                                    Geometry.distance(p[1], points[i][1], 3) < Mat.eps) ||
                                (Geometry.distance(p[0], points[i][1], 3) < Mat.eps &&
                                    Geometry.distance(p[1], points[i][0], 3) < Mat.eps)
                            ) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }

                    // Point on the front plane of the bbox3d
                    p = [0, 0, 0];
                    p[j] = view.bbox3D[j][1];

                    // d is the rhs of the Hesse normal form of the front plane.
                    d = Mat.innerProduct(p, view.defaultAxes[planes[j]].normal, 3);
                    p = view.intersectionPlanePlane(this, view.defaultAxes[planes[j]], d);

                    if (p[0].length === 3 && p[1].length === 3) {
                        // Do the same test as above
                        for (i = 0; i < points.length; i++) {
                            if (
                                (Geometry.distance(p[0], points[i][0], 3) < Mat.eps &&
                                    Geometry.distance(p[1], points[i][1], 3) < Mat.eps) ||
                                (Geometry.distance(p[0], points[i][1], 3) < Mat.eps &&
                                    Geometry.distance(p[1], points[i][0], 3) < Mat.eps)
                            ) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }
                }

                // Concatenate the intersection points to a polygon.
                // If all went well, each intersection should appear
                // twice in the list.
                first = 0;
                pos = first;
                i = 0;
                do {
                    p = points[pos][i];
                    if (p.length === 3) {
                        c2d = view.project3DTo2D(p);
                        this.dataX.push(c2d[1]);
                        this.dataY.push(c2d[2]);
                    }
                    i = (i + 1) % 2;
                    p = points[pos][i];

                    pos_akt = pos;
                    for (j = 0; j < points.length; j++) {
                        if (j !== pos && Geometry.distance(p, points[j][0]) < Mat.eps) {
                            pos = j;
                            i = 0;
                            break;
                        }
                        if (j !== pos && Geometry.distance(p, points[j][1]) < Mat.eps) {
                            pos = j;
                            i = 1;
                            break;
                        }
                    }
                    if (pos === pos_akt) {
                        console.log('Error: update plane3d: did not find next', pos);
                        break;
                    }
                } while (pos !== first);

                c2d = view.project3DTo2D(points[first][0]);
                this.dataX.push(c2d[1]);
                this.dataY.push(c2d[2]);
            } else {
                // 3D bounded flat
                s1 = Type.evaluate(this.range1[0]);
                e1 = Type.evaluate(this.range1[1]);
                s2 = Type.evaluate(this.range2[0]);
                e2 = Type.evaluate(this.range2[1]);

                q = this.point.coords.slice(1);

                v1 = this.vec1.slice();
                v2 = this.vec2.slice();
                l1 = Mat.norm(v1, 3);
                l2 = Mat.norm(v2, 3);
                for (i = 0; i < 3; i++) {
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
                    for (i = 0; i < 3; i++) {
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

        update: function () {
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        }
    }
);

// TODO docs
JXG.createPlane3D = function (board, parents, attributes) {
    var view = parents[0],
        attr,
        point,
        dir1 = parents[2],
        dir2 = parents[3],
        range1 = parents[4] || [-Infinity, Infinity],
        range2 = parents[5] || [-Infinity, Infinity],
        el,
        grid;

    point = Type.providePoints3D(view, [parents[1]], attributes, 'plane3d', ['point'])[0];
    if (point === false) {
        // TODO Throw error
    }

    attr = Type.copyAttributes(attributes, board.options, 'plane3d');
    el = new JXG.Plane3D(view, point, dir1, range1, dir2, range2, attr);
    point.addChild(el);

    attr = el.setAttr2D(attr);
    el.element2D = view.create('curve', [[], []], attr);
    el.element2D.view = view;

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

    attr = Type.copyAttributes(attributes.mesh3d, board.options, 'mesh3d');
    if (
        Math.abs(el.range1[0]) !== Infinity &&
        Math.abs(el.range1[1]) !== Infinity &&
        Math.abs(el.range2[0]) !== Infinity &&
        Math.abs(el.range2[1]) !== Infinity
    ) {
        grid = view.create('mesh3d', [
            function () {
                return point.coords;
            },
            dir1, range1, dir2, range2
        ], attr
        );
        el.grid = grid;
        el.addChild(grid);
        el.inherits.push(grid);
        grid.setParents(el);
        el.grid.view = view;

    }

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement('plane3d', JXG.createPlane3D);

/**
 * @class An intersection line is a line which lives on two JSXGraph elements.
 * The following element types can be (mutually) intersected: plane.
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
 *     [[0, 3], [0, 3], [0, 3]]],
 *     {
 *         xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *         yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *         zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *     }
 * );
 * var a = view.create('point3d', [0, 0, 0]);
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
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *         var view = board.create(
 *             'view3d',
 *             [[-6, -3], [8, 8],
 *             [[0, 3], [0, 3], [0, 3]]],
 *             {
 *                 xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *             }
 *         );
 *     var a = view.create('point3d', [0, 0, 0]);
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
        attr = Type.copyAttributes(attributes, board.options, "intersectionline3d"),
        pts = [];

    for (i = 0; i < 2; i++) {
        func = Geometry.intersectionFunction3D(view, el1, el2, i);
        pts[i] = view.create('point3d', func, attr['point' + (i + 1)]);
    }
    ixnLine = view.create('line3d', pts, attr);

    try {
        el1.addChild(ixnLine);
        el2.addChild(ixnLine);
    } catch (_e) {
        throw new Error(
            "JSXGraph: Can't create 'intersection' with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'."
        );
    }

    ixnLine.type = Const.OBJECT_TYPE_INTERSECTION_LINE3D;
    ixnLine.elType = 'intersectionline3d';
    ixnLine.setParents([el1.id, el2.id]);

    return ixnLine;
};

JXG.registerElement('intersectionline3d', JXG.createIntersectionLine3D);
