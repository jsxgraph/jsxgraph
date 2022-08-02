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

/**
 * Create linear spaces of dimension at least one,
 * i.e. lines and planes.
 */
define(['jxg', 'base/constants', 'utils/type', 'math/math', 'math/geometry'
], function (JXG, Const, Type, Mat, Geometry) {
    "use strict";

    /**
     * Constructor for 3D lines.
     * @class Creates a new 3D line object. Do not use this constructor to create a 3D line. Use {@link JXG.Board#create} with type {@link Point3D} instead.
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
        this.constructor(view.board, attributes, Const.OBJECT_TYPE_POINT, Const.OBJECT_CLASS_POINT);
        this.constructor3D(view, 'line3d');

        this.id = this.view.board.setId(this, 'L3D');
        this.board.finalizeAdding(this);

        /**
         * 3D point which - together with a direction - defines the line.
         * @type {Point3D}
         *
         * @see JXG.Line3D#direction
         */
        this.point = point;

        /**
         * Direction which - together with a point - defines the line. Array of numbers or functions (of length 3) or function
         * returning array of length 3.
         *
         * @type {Array,Function}
         * @see JXG.Line3D#point
         */
        this.direction = direction;

        /**
         * Range [r1, r2] of the line. The 3D line goes from (point + r1 * direction) to (point + r2 * direction)
         * @type {Array}
         */
        this.range = range || [-Infinity, Infinity];

        /**
         * Starting point of the 3D line
         * @type {Point3D}
         */
        this.point1 = null;

        /**
         * End point of the 3D line
         * @type {Point3D}
         */
         this.point2 = null;

        this.methodMap = Type.deepCopy(this.methodMap, {
            // TODO
        });
    };
    JXG.Line3D.prototype = new JXG.GeometryElement();
    Type.copyPrototypeMethods(JXG.Line3D, JXG.GeometryElement3D, 'constructor3D');

    JXG.extend(JXG.Line3D.prototype, /** @lends JXG.Line3D.prototype */ {

        /**
         * Determining one end point of a 3D line.
         * @param {Number|function} r
         * @private
         * @returns Array
         */
        getPointCoords: function (r) {
            var p = [],
                d = [],
                i, r0;

            p = [this.point.X(), this.point.Y(), this.point.Z()];

            if (Type.isFunction(this.direction)) {
                d = this.direction();
            } else {
                for (i = 1; i < 4; i++) {
                    d.push(Type.evaluate(this.direction[i]));
                }
            }

            r0 = Type.evaluate(r);
            // TODO: test also in the finite case
            if (Math.abs(r0) === Infinity) {
                r = this.view.intersectionLineCube(p, d, r0);
            }

            return [
                p[0] + d[0] * r0,
                p[1] + d[1] * r0,
                p[2] + d[2] * r0
            ];
        },

        update: function() { return this; },

        updateRenderer: function() {
            this.needsUpdate = false;
            return this;
        }

    });

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
     * @param {JXG.Point3D,array_JXG.Point3D,array} point1,point2 First and second defining point. Alternatively, point, direction and rang can be supplied.
     * <ul>
     * <li> point: Point3D or array of length 3
     * <li> direction: array of length 3
     * <li> range: array of length 2.
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
     * </pre><div id="JXG05f9baa4-6059-4502-8911-6a934f823b3d" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
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
            point1, point2,
            el;

        attr = Type.copyAttributes(attributes, board.options, 'line3d');

        // In any case, parents[1] contains a point or point coordinates
        point = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point1'])[0];

        if (Type.isPoint3D(parents[2]) || (Type.isArray(parents[2]) && parents.length === 3)) {
            // Line defined by two points

            point1 = point;
            point2 = Type.providePoints3D(view, [parents[2]],  attributes, 'line3d', ['point2'])[0];
            direction = function () {
                return [
                    point2.X() - point.X(),
                    point2.Y() - point.Y(),
                    point2.Z() - point.Z()
                ];
            };
            range = [0, 1];
            el = new JXG.Line3D(view, point, direction, range, attr);
        } else {
            // Line defined by point, direction and range

            // Directions are handled as arrays of length 4,
            // i.e. with homogeneous coordinates.
            if (Type.isFunction(parents[2])) {
                direction = parents[2];
            } else if (parents[2].length === 3) {
                direction = [1].concat(parents[2]);
            } else if (parents[2].length === 4) {
                direction = parents[2];
            } else {
                // Throw error
            }
            range = parents[3];

            points = Type.providePoints3D(view, [[0, 0, 0], [0, 0, 0]],  attributes, 'line3d', ['point1', 'point2']);

            // Create a line3d with two dummy points
            el = new JXG.Line3D(view, point, direction, range, attr);

            // Now set the real points which define the line
            points[0].F = function() {
                return el.getPointCoords(Type.evaluate(el.range[0]));
            };
            points[0].prepareUpdate().update();
            point1 = points[0];

            points[1].F = function() {
                return el.getPointCoords(Type.evaluate(el.range[1]));
            };
            points[1].prepareUpdate().update();
            point2 = points[1];
        }

        // el.prepareUpdate().update();

        el.element2D = view.create('segment', [point1.element2D, point2.element2D], attr);
        el.addChild(el.element2D);
        el.inherits.push(el.element2D);

        point1.addChild(el);
        point2.addChild(el);
        el.point1 = point1;
        el.point2 = point2;

        return el;
    };
    JXG.registerElement('line3d', JXG.createLine3D);

    JXG.createPlane3D = function (board, parents, attributes) {
        var view = parents[0],
            attr, D3,
            point,
            vec1 = parents[2],
            vec2 = parents[3],
            el, grid, update;

        // D3: {
        //    point,
        //    vec1,
        //    vec2,
        //    poin1,
        //    point2,
        //    normal array of len 3
        //    d
        // }
        D3 = {
            elType: 'plane3d',
            dir1: [],
            dir2: [],
            range1: parents[4],
            range2: parents[5],
            vec1: vec1,
            vec2: vec2
        };

        if (Type.isPoint(parents[1])) {
            point = parents[1];
        } else {
            point = view.create('point3d', parents[1], { visible: false, name: '', withLabel: false });
        }
        D3.point = point;

        D3.updateNormal = function () {
            var i;
            for (i = 0; i < 3; i++) {
                D3.dir1[i] = Type.evaluate(D3.vec1[i]);
                D3.dir2[i] = Type.evaluate(D3.vec2[i]);
            }
            D3.normal = Mat.crossProduct(D3.dir1, D3.dir2);
            // D3.d = Mat.innerProduct(D3.point.D3.coords.slice(1), D3.normal, 3);
            D3.d = Mat.innerProduct(D3.point.coords.slice(1), D3.normal, 3);
        };
        D3.updateNormal();

        attr = Type.copyAttributes(attributes, board.options, 'plane3d');
        el = board.create('curve', [[], []], attr);
        el.D3 = D3;

        el.updateDataArray = function () {
            var s1, e1, s2, e2,
                c2d, l1, l2,
                planes = ['xPlaneRear', 'yPlaneRear', 'zPlaneRear'],
                points = [],
                v1 = [0, 0, 0],
                v2 = [0, 0, 0],
                q = [0, 0, 0],
                p = [0, 0, 0], d, i, j, a, b, first, pos, pos_akt;

            this.dataX = [];
            this.dataY = [];

            this.D3.updateNormal();

            // Infinite plane
            if (this.D3.elType !== 'axisplane3d' && view.defaultAxes &&
                (!D3.range1 || !D3.range2)
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
                            if ((Geometry.distance(p[0], points[i][0], 3) < Mat.eps && Geometry.distance(p[1], points[i][1], 3) < Mat.eps) ||
                                (Geometry.distance(p[0], points[i][1], 3) < Mat.eps && Geometry.distance(p[1], points[i][0], 3) < Mat.eps)) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }

                    // Point on the front plane of the bbox3d
                    p = [0, 0, 0];
                    p[j] = view.D3.bbox3d[j][1];

                    // d is the rhs of the Hesse normal form of the front plane.
                    d = Mat.innerProduct(p, view.defaultAxes[planes[j]].D3.normal, 3);
                    p = view.intersectionPlanePlane(this, view.defaultAxes[planes[j]], d);

                    if (p[0].length === 3 && p[1].length === 3) {
                        // Do the same test as above
                        for (i = 0; i < points.length; i++) {
                            if ((Geometry.distance(p[0], points[i][0], 3) < Mat.eps && Geometry.distance(p[1], points[i][1], 3) < Mat.eps) ||
                                (Geometry.distance(p[0], points[i][1], 3) < Mat.eps && Geometry.distance(p[1], points[i][0], 3) < Mat.eps)) {
                                break;
                            }
                        }
                        if (i === points.length) {
                            points.push(p.slice());
                        }
                    }
                }

                // Concatenate the intersection points to a polygon.
                // If all wents well, each intersection should appear
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
                        console.log("Error: update plane3d: did not find next", pos);
                        break;
                    }
                } while (pos !== first);
                c2d = view.project3DTo2D(points[first][0]);
                this.dataX.push(c2d[1]);
                this.dataY.push(c2d[2]);

            } else {
                // 3D bounded flat
                s1 = Type.evaluate(this.D3.range1[0]);
                e1 = Type.evaluate(this.D3.range1[1]);
                s2 = Type.evaluate(this.D3.range2[0]);
                e2 = Type.evaluate(this.D3.range2[1]);

                // q = this.D3.point.D3.coords.slice(1);
                q = this.D3.point.coords.slice(1);

                v1 = this.D3.dir1.slice();
                v2 = this.D3.dir2.slice();
                l1 = Mat.norm(v1, 3);
                l2 = Mat.norm(v2, 3);
                for (i = 0; i < 3; i++) {
                    v1[i] /= l1;
                    v2[i] /= l2;
                }

                for (j = 0; j < 4; j++) {
                    switch (j) {
                        case 0: a = s1; b = s2; break;
                        case 1: a = e1; b = s2; break;
                        case 2: a = e1; b = e2; break;
                        case 3: a = s1; b = e2;
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
        };

        attr = Type.copyAttributes(attributes.mesh3d, board.options, 'mesh3d');

        if (D3.range1 && D3.range2) {
            // grid = view.create('mesh3d', [point.D3.coords.slice(1), vec1, D3.range1, vec2, D3.range2], attr);
            grid = view.create('mesh3d', [point.coords.slice(1), vec1, D3.range1, vec2, D3.range2], attr);
            el.grid = grid;
            el.inherits.push(grid);
        }

        // update = el.update;
        // el.update = function () {
        //     if (el.needsUpdate) {
        //         update.apply(el);
        //     }
        //     return this;
        // };

        return el;
    };
    JXG.registerElement('plane3d', JXG.createPlane3D);

});