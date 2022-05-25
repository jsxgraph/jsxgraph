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

define(['jxg', 'options', 'base/constants', 'utils/type', 'math/math', 'base/element', '3d/threed',
], function (JXG, Options, Const, Type, Mat, GeometryElement, ThreeD) {
    "use strict";

    ThreeD.View3D = function (board, parents, attributes) {
        var bbox3d, coords, size;
        this.constructor(board, attributes, Const.OBJECT_TYPE_VIEW3D, Const.OBJECT_CLASS_CURVE);

        bbox3d = parents[2];  // [[x1, x2], [y1,y2], [z1,z2]]
        coords = parents[0]; // llft corner
        size = parents[1];   // [w, h]

        /**
         * "Namespace" for all 3D handling
         */
        this.D3 = {};

        /**
         * An associative array containing all geometric objects belonging to the view.
         * Key is the id of the object and value is a reference to the object.
         * @type Object
         */
        this.D3.objects = {};

        /**
         * An array containing all geometric objects in this view in the order of construction.
         * @type Array
         */
        this.D3.objectsList = [];

        /**
         * @type {Object} contains the axes of the view or null
         * @default null
         */
        this.D3.defaultAxes = null;

        /**
         * 3D-to-2D transformation matrix
         * @type  {Array} 3 x 4 mattrix
         */
        this.D3.matrix = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0]
        ];

        // Bounding box (cube) [[x1, x2], [y1,y2], [z1,z2]]:
        this.D3.bbox3d = bbox3d;
        this.D3.coords = coords;
        this.D3.size = size;

        /**
         * Distance of the view to the origin. In other words, its
         * the radius of the sphere where the camera sits.
         */
        this.D3.r = -1;

        this.timeoutAzimuth = null;

        this.id = this.board.setId(this, 'V');
        this.board.finalizeAdding(this);
        this.elType = 'view3d';
        this.methodMap = Type.deepCopy(this.methodMap, {
        });
    };
    ThreeD.View3D.prototype = new GeometryElement();

    JXG.extend(ThreeD.View3D.prototype, /** @lends ThreeD.View3D.prototype */ {
        create: function (elementType, parents, attributes) {
            var prefix = [],
                is3D = false,
                el;

            if (elementType.indexOf('3d') > 0) {
                is3D = true;
                prefix.push(this);
            }
            el = this.board.create(elementType, prefix.concat(parents), attributes);
            if (true || is3D) {
                this.add(el);
            }
            return el;
        },

        add: function (el) {
            this.D3.objects[el.id] = el;
            this.D3.objectsList.push(el);
        },

        /**
         * Update 3D-to-2D transformation matrix with the actual
         * elevation and azimuth angles.
         *
         * @private
         */
        update: function () {
            var D3 = this.D3,
                e, r, a, f, mat;

            if (!Type.exists(D3.el_slide) ||
                !Type.exists(D3.az_slide) ||
                !this.needsUpdate) {
                return this;
            }

            e = D3.el_slide.Value();
            r = D3.r;
            a = D3.az_slide.Value();
            f = r * Math.sin(e);
            mat = [[1, 0, 0,], [0, 1, 0], [0, 0, 1]];

            D3.matrix = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0]
            ];

            D3.matrix[1][1] = r * Math.cos(a);
            D3.matrix[1][2] = -r * Math.sin(a);
            D3.matrix[2][1] = f * Math.sin(a);
            D3.matrix[2][2] = f * Math.cos(a);
            D3.matrix[2][3] = Math.cos(e);

            if (true) {
                mat[1][1] = D3.size[0] / (D3.bbox3d[0][1] - D3.bbox3d[0][0]); // w / d_x
                mat[2][2] = D3.size[1] / (D3.bbox3d[1][1] - D3.bbox3d[1][0]); // h / d_y
                mat[1][0] = D3.coords[0] - mat[1][1] * D3.bbox3d[0][0];     // llft_x
                mat[2][0] = D3.coords[1] - mat[2][2] * D3.bbox3d[1][0];     // llft_y

                D3.matrix = Mat.matMatMult(mat, D3.matrix);
            }

            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Project 3D coordinates to 2D board coordinates
         * The 3D coordinates are provides as three numbers x, y, z or one array of length 3.
         *
         * @param  {Number|Array} x
         * @param  {[Number]} y
         * @param  {[Number]} z
         * @returns {Array} Array of length 3 containing the projection on to the board
         * in homogeneous user coordinates.
         */
        project3DTo2D: function (x, y, z) {
            var vec;
            if (arguments.length === 3) {
                vec = [1, x, y, z];
            } else {
                // Argument is an array
                if (x.length === 3) {
                    vec = [1].concat(x);
                } else {
                    vec = x;
                }
            }
            return Mat.matVecMult(this.D3.matrix, vec);
        },

        /**
         * Project a 2D coordinate to the plane through the origin
         * defined by its normal vector `normal`.
         *
         * @param  {JXG.Point} point
         * @param  {Array} normal
         * @returns Array of length 4 containing the projected
         * point in homogeneous coordinates.
         */
        project2DTo3DPlane: function (point, normal, foot) {
            var mat, rhs, d, le,
                n = normal.slice(1),
                sol = [1, 0, 0, 0];

            foot = foot || [1, 0, 0, 0];
            le = Mat.norm(n, 3);
            d = Mat.innerProduct(foot.slice(1), n, 3) / le;

            mat = this.D3.matrix.slice(0, 3); // True copy
            mat.push([0].concat(n));

            // 2D coordinates of point:
            rhs = point.coords.usrCoords.concat([d]);
            try {
                // Prevent singularity in case elevation angle is zero
                if (mat[2][3] === 1.0) {
                    mat[2][1] = mat[2][2] = Mat.eps * 0.001;
                }
                sol = Mat.Numerics.Gauss(mat, rhs);
            } catch (err) {
                sol = [0, NaN, NaN, NaN];
            }

            return sol;
        },

        project3DToCube: function (c3d) {
            var cube = this.D3.bbox3d;
            if (c3d[1] < cube[0][0]) { c3d[1] = cube[0][0]; }
            if (c3d[1] > cube[0][1]) { c3d[1] = cube[0][1]; }
            if (c3d[2] < cube[1][0]) { c3d[2] = cube[1][0]; }
            if (c3d[2] > cube[1][1]) { c3d[2] = cube[1][1]; }
            if (c3d[3] < cube[2][0]) { c3d[3] = cube[2][0]; }
            if (c3d[3] > cube[2][1]) { c3d[3] = cube[2][1]; }

            return c3d;
        },

        intersectionLineCube: function (p, d, r) {
            var rnew, i, r0, r1;

            rnew = r;
            for (i = 0; i < 3; i++) {
                if (d[i] !== 0) {
                    r0 = (this.D3.bbox3d[i][0] - p[i]) / d[i];
                    r1 = (this.D3.bbox3d[i][1] - p[i]) / d[i];
                    if (r < 0) {
                        rnew = Math.max(rnew, Math.min(r0, r1));
                    } else {
                        rnew = Math.min(rnew, Math.max(r0, r1));
                    }
                }
            }
            return rnew;
        },

        isInCube: function (q) {
            return q[0] > this.D3.bbox3d[0][0] - Mat.eps && q[0] < this.D3.bbox3d[0][1] + Mat.eps &&
                q[1] > this.D3.bbox3d[1][0] - Mat.eps && q[1] < this.D3.bbox3d[1][1] + Mat.eps &&
                q[2] > this.D3.bbox3d[2][0] - Mat.eps && q[2] < this.D3.bbox3d[2][1] + Mat.eps;
        },

        /**
         *
         * @param {*} plane1
         * @param {*} plane2
         * @param {*} d
         * @returns Array of length 2 containing the coordinates of the defining points of
         * of the intersection segment.
         */
        intersectionPlanePlane: function(plane1, plane2, d) {
            var ret = [[], []],
                p, dir, r, q;

            d = d || plane2.D3.d;

            p = Mat.Geometry.meet3Planes(plane1.D3.normal, plane1.D3.d, plane2.D3.normal, d,
                     Mat.crossProduct(plane1.D3.normal, plane2.D3.normal), 0);
            dir = Mat.Geometry.meetPlanePlane(plane1.D3.dir1, plane1.D3.dir2, plane2.D3.dir1, plane2.D3.dir2);
            r = this.intersectionLineCube(p, dir, Infinity);
            q = Mat.axpy(r, dir, p);
            if (this.isInCube(q)) {
                ret[0] = q;
            }
            r = this.intersectionLineCube(p, dir, -Infinity);
            q = Mat.axpy(r, dir, p);
            if (this.isInCube(q) ) {
                ret[1] = q;
            }
            return ret;
        },

        getMesh: function (X, Y, Z, interval_u, interval_v) {
            var i_u, i_v, u, v, c2d,
                delta_u, delta_v,
                p = [0, 0, 0],
                steps_u = interval_u[2],
                steps_v = interval_v[2],

                dataX = [],
                dataY = [];

            delta_u = (Type.evaluate(interval_u[1]) - Type.evaluate(interval_u[0])) / (steps_u);
            delta_v = (Type.evaluate(interval_v[1]) - Type.evaluate(interval_v[0])) / (steps_v);

            for (i_u = 0; i_u <= steps_u; i_u++) {
                u = interval_u[0] + delta_u * i_u;
                for (i_v = 0; i_v <= steps_v; i_v++) {
                    v = interval_v[0] + delta_v * i_v;
                    p[0] = X(u, v);
                    p[1] = Y(u, v);
                    p[2] = Z(u, v);
                    c2d = this.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
                dataX.push(NaN);
                dataY.push(NaN);
            }

            for (i_v = 0; i_v <= steps_v; i_v++) {
                v = interval_v[0] + delta_v * i_v;
                for (i_u = 0; i_u <= steps_u; i_u++) {
                    u = interval_u[0] + delta_u * i_u;
                    p[0] = X(u, v);
                    p[1] = Y(u, v);
                    p[2] = Z(u, v);
                    c2d = this.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
                dataX.push(NaN);
                dataY.push(NaN);
            }

            return [dataX, dataY];
        },

        animateAzimuth: function () {
            var s = this.D3.az_slide._smin,
                e = this.D3.az_slide._smax,
                sdiff = e - s,
                newVal = this.D3.az_slide.Value() + 0.1;

            this.D3.az_slide.position = ((newVal - s) / sdiff);
            if (this.D3.az_slide.position > 1) {
                this.D3.az_slide.position = 0.0;
            }
            this.board.update();

            this.timeoutAzimuth = setTimeout(function () { this.animateAzimuth(); }.bind(this), 200);
        },

        stopAzimuth: function () {
            clearTimeout(this.timeoutAzimuth);
            this.timeoutAzimuth = null;
        }
    });

    /**
     * @class This element creates a 3D view.
     * @pseudo
     * @description  A View3D element provides the container and the methods to create and display 3D elements.
     * It is contained in a JSXGraph board.
     * @name View3D
     * @augments JXG.View3D
     * @constructor
     * @type Object
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Array_Array_Array} lower,dim,cube  Here, lower is an array of the form [x, y] and
     * dim is an array of the form [w, h].
     * The arrays [x, y] and [w, h] define the 2D frame into which the 3D cube is
     * (roughly) projected.
     * cube is an array of the form [[x1, x2], [y1, y2], [z1, z2]]
     * which determines the coordinate ranges of the 3D cube.
     *
     * @example
     *  var bound = [-5, 5];
     *  var view = board.create('view3d',
     *      [[-6, -3],
     *       [8, 8],
     *       [bound, bound, bound]],
     *      {
     *          // Main axes
     *          axesPosition: 'center',
     *          xAxis: { strokeColor: 'blue', strokeWidth: 3},
     *
     *          // Planes
     *          xPlaneRear: { fillColor: 'yellow',  mesh3d: {visible: false}},
     *          yPlaneFront: { visible: true, fillColor: 'blue'},
     *
     *          // Axes on planes
     *          xPlaneRearYAxis: {strokeColor: 'red'},
     *          xPlaneRearZAxis: {strokeColor: 'red'},
     *
     *          yPlaneFrontXAxis: {strokeColor: 'blue'},
     *          yPlaneFrontZAxis: {strokeColor: 'blue'},
     *
     *          zPlaneFrontXAxis: {visible: false},
     *          zPlaneFrontYAxis: {visible: false}
     *      });
     *
     * </pre><div id="JXGdd06d90e-be5d-4531-8f0b-65fc30b1a7c7" class="jxgbox" style="width: 500px; height: 500px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGdd06d90e-be5d-4531-8f0b-65fc30b1a7c7',
     *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
     *                             var bound = [-5, 5];
     *                             var view = board.create('view3d',
     *                                 [[-6, -3], [8, 8],
     *                                 [bound, bound, bound]],
     *                                 {
     *                                     // Main axes
     *                                     axesPosition: 'center',
     *                                     xAxis: { strokeColor: 'blue', strokeWidth: 3},
     *
     *                                     // Planes
     *                                     xPlaneRear: { fillColor: 'yellow',  mesh3d: {visible: false}},
     *                                     yPlaneFront: { visible: true, fillColor: 'blue'},
     *
     *                                     // Axes on planes
     *                                     xPlaneRearYAxis: {strokeColor: 'red'},
     *                                     xPlaneRearZAxis: {strokeColor: 'red'},
     *
     *                                     yPlaneFrontXAxis: {strokeColor: 'blue'},
     *                                     yPlaneFrontZAxis: {strokeColor: 'blue'},
     *
     *                                     zPlaneFrontXAxis: {visible: false},
     *                                     zPlaneFrontYAxis: {visible: false}
     *                                 });
     *
     *     })();
     *
     * </script><pre>
     *
     */
    ThreeD.createView3D = function (board, parents, attributes) {
        var view, frame, attr,
            x, y, w, h,
            coords = parents[0], // llft corner
            size = parents[1];   // [w, h]

        attr = Type.copyAttributes(attributes, board.options, 'view3d');
        view = new ThreeD.View3D(board, parents, attr);
        view.defaultAxes = view.create('axes3d', parents, attributes);

        x = coords[0];
        y = coords[1];
        w = size[0];
        h = size[1];

        /**
         * Frame around the view object
         */
        if (false) {
            frame = board.create('polygon', [
                [coords[0], coords[1] + size[1]],           // ulft
                [coords[0], coords[1]],                     // llft
                [coords[0] + size[0], coords[1]],           // lrt
                [coords[0] + size[0], coords[1] + size[1]], // urt
            ], {
                fillColor: 'none',
                highlightFillColor: 'none',
                highlight: false,
                vertices: {
                    fixed: true,
                    visible: false
                },
                borders: {
                    strokeColor: 'black',
                    highlight: false,
                    strokeWidth: 0.5,
                    dash: 4
                }
            });
            //view.add(frame);
        }

        /**
         * Slider to adapt azimuth angle
         */
        view.D3.az_slide = board.create('slider', [[x - 1, y - 2], [x + w + 1, y - 2], [0, 1.0, 2 * Math.PI]], {
            style: 6, name: 'az',
            point1: { frozen: true },
            point2: { frozen: true }
        });

        /**
         * Slider to adapt elevation angle
         */
        view.D3.el_slide = board.create('slider', [[x - 1, y], [x - 1, y + h], [0, 0.30, Math.PI / 2]], {
            style: 6, name: 'el',
            point1: { frozen: true },
            point2: { frozen: true }
        });

        view.board.highlightInfobox = function (x, y, el) {
            var d;

            if (Type.exists(el.D3)) {
                d = Type.evaluate(el.visProp.infoboxdigits);
                if (d === 'auto') {
                    view.board.highlightCustomInfobox('(' +
                        Type.autoDigits(el.D3.X()) + ' | ' +
                        Type.autoDigits(el.D3.Y()) + ' | ' +
                        Type.autoDigits(el.D3.Z()) + ')', el);
                } else {
                    view.board.highlightCustomInfobox('(' +
                        Type.toFixed(el.D3.X(), d) + ' | ' +
                        Type.toFixed(el.D3.Y(), d) + ' | ' +
                        Type.toFixed(el.D3.Z(), d) + ')', el);
                }
            } else {
                view.board.highlightCustomInfobox('(' + x + ', ' + y + ')', el);
            }
        };

        return view;
    };
    JXG.registerElement('view3d', ThreeD.createView3D);

    return ThreeD.View3D;
});

