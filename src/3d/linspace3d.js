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
define(['jxg', 'utils/type', 'math/math', 'math/geometry', '3d/view3d'
], function (JXG, Type, Mat, Geometry, ThreeD) {
    "use strict";

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
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Exception} If the element cannot be constructed with the given parent
     * objects an exception is thrown.
     * @param {JXG.Point_number,JXG.Point,JXG.Line,JXG.Circle} center,radius The center must be given as a {@link JXG.Point}, see {@link JXG.providePoints}, but the radius can be given
     * as a number (which will create a circle with a fixed radius), another {@link JXG.Point}, a {@link JXG.Line} (the distance of start and end point of the
     * line will determine the radius), or another {@link JXG.Circle}.
     *
     */
    ThreeD.createLine = function (board, parents, attributes) {
        var view = parents[0],
            attr, D3, point, point1, point2,
            el;

        // Range
        D3 = {
            elType: 'line3d',
            range: parents[3] || [-Infinity, Infinity]
        };

        // Point
        if (Type.isPoint(parents[1])) {
            point = parents[1];
        } else {
            point = view.create('point3d', parents[1], { visible: false, name: '', withLabel: false });
        }
        D3.point = point;

        // Direction
        if (Type.isPoint(parents[2]) && Type.exists(parents[2].D3)) {
            // Line defined by two points

            point1 = point;
            point2 = parents[2];
            D3.direction = function () {
                return [
                    point2.D3.X() - point.D3.X(),
                    point2.D3.Y() - point.D3.Y(),
                    point2.D3.Z() - point.D3.Z()
                ];
            };
            D3.range = [0, 1];
        } else {
            // Line defined by point, direction and range

            // Directions are handled as arrays of length 4,
            // i.e. with homogeneous coordinates.
            if (Type.isFunction(parents[2])) {
                D3.direction = parents[2];
            } else if (parents[2].length === 3) {
                D3.direction = [1].concat(parents[2]);
            } else if (parents[2].length === 4) {
                D3.direction = parents[2];
            } else {
                // Throw error
            }

            // Direction given as array
            D3.getPointCoords = function (r) {
                var p = [],
                    d = [],
                    i;

                p.push(point.D3.X());
                p.push(point.D3.Y());
                p.push(point.D3.Z());

                if (Type.isFunction(D3.direction)) {
                    d = D3.direction();
                } else {
                    for (i = 1; i < 4; i++) {
                        d.push(Type.evaluate(D3.direction[i]));
                    }
                }
                if (Math.abs(r) === Infinity) {
                    r = view.intersectionLineCube(p, d, r);
                }
                return [
                    p[0] + d[0] * r,
                    p[1] + d[1] * r,
                    p[2] + d[2] * r
                ];

            };

            attr = Type.copyAttributes(attributes, board.options, 'line3d', 'point1');
            point1 = view.create('point3d', [
                function () {
                    return D3.getPointCoords(Type.evaluate(D3.range[0]));
                }
            ], attr);
            attr = Type.copyAttributes(attributes, board.options, 'line3d', 'point2');
            point2 = view.create('point3d', [
                function () {
                    return D3.getPointCoords(Type.evaluate(D3.range[1]));
                }
            ], attr);
        }

        attr = Type.copyAttributes(attributes, board.options, 'line3d');
        el = view.create('segment', [point1, point2], attr);
        el.point1 = point1;
        el.point2 = point2;
        point1.addChild(el);
        point2.addChild(el);
        el.D3 = D3;

        return el;
    };
    JXG.registerElement('line3d', ThreeD.createLine);

    ThreeD.createPlane = function (board, parents, attributes) {
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
            D3.d = Mat.innerProduct(D3.point.D3.coords.slice(1), D3.normal, 3);
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

                q = this.D3.point.D3.coords.slice(1);

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
            grid = view.create('mesh3d', [point.D3.coords.slice(1), vec1, D3.range1, vec2, D3.range2], attr);
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
    JXG.registerElement('plane3d', ThreeD.createPlane);

});