/*
    Copyright 2008-2023
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

import JXG from "../jxg";
import Const from "../base/constants";
import Type from "../utils/type";
import Mat from "../math/math";
import Env from "../utils/env";
import GeometryElement from "../base/element";
import Composition from "../base/composition";

/**
 * 3D view inside a JXGraph board.
 *
 * @class Creates a new 3D view. Do not use this constructor to create a 3D view. Use {@link JXG.Board#create} with
 * type {@link View3D} instead.
 *
 * @augments JXG.GeometryElement
 * @param {Array} parents Array consisting of lower left corner [x, y] of the view inside the board, [width, height] of the view
 * and box size [[x1, x2], [y1,y2], [z1,z2]]. If the view's azimuth=0 and elevation=0, the 3D view will cover a rectangle with lower left corner
 * [x,y] and side lengths [w, h] of the board.
 */
JXG.View3D = function (board, parents, attributes) {
    this.constructor(board, attributes, Const.OBJECT_TYPE_VIEW3D, Const.OBJECT_CLASS_3D);

    /**
     * An associative array containing all geometric objects belonging to the view.
     * Key is the id of the object and value is a reference to the object.
     * @type Object
     * @private
     */
    this.objects = {};

    /**
     * An array containing all geometric objects in this view in the order of construction.
     * @type Array
     * @private
     */
    // this.objectsList = [];

    /**
     * An associative array / dictionary to store the objects of the board by name. The name of the object is the key and value is a reference to the object.
     * @type Object
     * @private
     */
    this.elementsByName = {};

    /**
     * Default axes of the 3D view, contains the axes of the view or null.
     *
     * @type {Object}
     * @default null
     */
    this.defaultAxes = null;

    /**
     * @type  {Array}
     * @private
     */
    // 3D-to-2D transformation matrix
    this.matrix3D = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0]
    ];

    /**
     * @type array
     * @private
     */
    // Lower left corner [x, y] of the 3D view if elevation and azimuth are set to 0.
    this.llftCorner = parents[0];

    /**
     * Width and height [w, h] of the 3D view if elevation and azimuth are set to 0.
     * @type array
     * @private
     */
    this.size = parents[1];

    /**
     * Bounding box (cube) [[x1, x2], [y1,y2], [z1,z2]] of the 3D view
     * @type array
     */
    this.bbox3D = parents[2];

    /**
     * Distance of the view to the origin. In other words, its
     * the radius of the sphere where the camera sits.view.board.update
     * @type Number
     */
    this.r = -1;

    /**
     * Type of projection.
     * @type String
     */
    // Will be set in update().
    this.projectionType = 'parallel';

    this.timeoutAzimuth = null;

    this.id = this.board.setId(this, 'V');
    this.board.finalizeAdding(this);
    this.elType = 'view3d';

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.View3D.prototype = new GeometryElement();

JXG.extend(
    JXG.View3D.prototype, /** @lends JXG.View3D.prototype */ {

        /**
         * Creates a new 3D element of type elementType.
         * @param {String} elementType Type of the element to be constructed given as a string e.g. 'point3d' or 'surface3d'.
         * @param {Array} parents Array of parent elements needed to construct the element e.g. coordinates for a 3D point or two
         * 3D points to construct a line. This highly depends on the elementType that is constructed. See the corresponding JXG.create*
         * methods for a list of possible parameters.
         * @param {Object} [attributes] An object containing the attributes to be set. This also depends on the elementType.
         * Common attributes are name, visible, strokeColor.
         * @returns {Object} Reference to the created element. This is usually a GeometryElement3D, but can be an array containing
         * two or more elements.
         */
        create: function (elementType, parents, attributes) {
            var prefix = [],
                el;

            if (elementType.indexOf('3d') > 0) {
                // is3D = true;
                prefix.push(this);
            }
            el = this.board.create(elementType, prefix.concat(parents), attributes);

            return el;
        },

        /**
         * Select a single or multiple elements at once.
         * @param {String|Object|function} str The name, id or a reference to a JSXGraph 3D element in the 3D view. An object will
         * be used as a filter to return multiple elements at once filtered by the properties of the object.
         * @param {Boolean} onlyByIdOrName If true (default:false) elements are only filtered by their id, name or groupId.
         * The advanced filters consisting of objects or functions are ignored.
         * @returns {JXG.GeometryElement3D|JXG.Composition}
         * @example
         * // select the element with name A
         * view.select('A');
         *
         * // select all elements with strokecolor set to 'red' (but not '#ff0000')
         * view.select({
         *   strokeColor: 'red'
         * });
         *
         * // select all points on or below the x/y plane and make them black.
         * view.select({
         *   elType: 'point3d',
         *   Z: function (v) {
         *     return v <= 0;
         *   }
         * }).setAttribute({color: 'black'});
         *
         * // select all elements
         * view.select(function (el) {
         *   return true;
         * });
         */
        select: function (str, onlyByIdOrName) {
            var flist,
                olist,
                i,
                l,
                s = str;

            if (s === null) {
                return s;
            }

            // It's a string, most likely an id or a name.
            if (Type.isString(s) && s !== '') {
                // Search by ID
                if (Type.exists(this.objects[s])) {
                    s = this.objects[s];
                    // Search by name
                } else if (Type.exists(this.elementsByName[s])) {
                    s = this.elementsByName[s];
                    // // Search by group ID
                    // } else if (Type.exists(this.groups[s])) {
                    //     s = this.groups[s];
                }

                // It's a function or an object, but not an element
            } else if (
                !onlyByIdOrName &&
                (Type.isFunction(s) || (Type.isObject(s) && !Type.isFunction(s.setAttribute)))
            ) {
                flist = Type.filterElements(this.objectsList, s);

                olist = {};
                l = flist.length;
                for (i = 0; i < l; i++) {
                    olist[flist[i].id] = flist[i];
                }
                s = new Composition(olist);

                // It's an element which has been deleted (and still hangs around, e.g. in an attractor list
            } else if (
                Type.isObject(s) &&
                Type.exists(s.id) &&
                !Type.exists(this.objects[s.id])
            ) {
                s = null;
            }

            return s;
        },

        updateParallelProjection: function () {
            var r, a, e, f,
                mat = [
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0]
                ];

            // mat projects homogeneous 3D coords in View3D
            // to homogeneous 2D coordinates in the board
            e = this.el_slide.Value();
            r = this.r;
            a = this.az_slide.Value();
            f = r * Math.sin(e);

            mat[1][1] = r * Math.cos(a);
            mat[1][2] = -r * Math.sin(a);
            mat[2][1] = f * Math.sin(a);
            mat[2][2] = f * Math.cos(a);
            mat[2][3] = Math.cos(e);

            return mat;
        },

        /**
         * @private
         * @returns {Array}
         */
        _updateCentralProjection: function () {
            var r, e, a, up,
                az, ax, ay, v, nrm,
                // See https://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/graphics_6_1_eng_web.html
                // bbox3D is always at the world origin, i.e. T_obj is the unit matrix.
                // All vectors contain affine coordinates and have length 3
                // The matrices are of size 4x4.
                Tcam1, // The inverse camera transformation
                eye, d,
                foc = 1 / Math.tan(0.5 * Type.evaluate(this.visProp.fov)),
                zf = 20,
                zn = 8,
                Pref = [
                    0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]),
                    0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]),
                    0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1])
                ],

                A = [
                    [0, 0, 0, -1],
                    [0, foc, 0, 0],
                    [0, 0, foc, 0],
                    [2 * zf * zn / (zn - zf), 0, 0, (zf + zn) / (zn - zf)]
                ],

                func_sphere;

            /**
             * Calculates a spherical parametric surface, which depends on az, el and r.
             * @param {Number} a
             * @param {Number} e
             * @param {Number} r
             * @returns {Array} 3-dimensional vector in cartesian coordinates
             */
            func_sphere = function (az, el, r) {
                return [
                    r * Math.cos(az) * Math.cos(el),
                    -r * Math.sin(az) * Math.cos(el),
                    r * Math.sin(el)
                ];
            };

            a = this.az_slide.Value() + (3 * Math.PI * 0.5); // Sphere
            e = this.el_slide.Value() * 2;

            r = Type.evaluate(this.visProp.r);
            if (r === 'auto') {
                r = Math.sqrt(
                    Math.pow(this.bbox3D[0][0] - this.bbox3D[0][1], 2) +
                    Math.pow(this.bbox3D[1][0] - this.bbox3D[1][1], 2) +
                    Math.pow(this.bbox3D[2][0] - this.bbox3D[2][1], 2)
                ) * 1.01;
            }

            // create an up vector and an eye vector which are 90 degrees out of phase
            up = func_sphere(a, e + Math.PI / 2, 1);
            eye = func_sphere(a, e, r);

            d = [eye[0] - Pref[0], eye[1] - Pref[1], eye[2] - Pref[2]];
            nrm = Mat.norm(d, 3);
            az = [d[0] / nrm, d[1] / nrm, d[2] / nrm];

            nrm = Mat.norm(up, 3);
            v = [up[0] / nrm, up[1] / nrm, up[2] / nrm];

            ax = Mat.crossProduct(v, az);
            ay = Mat.crossProduct(az, ax);

            v = Mat.matVecMult([ax, ay, az], eye);
            Tcam1 = [
                [1, 0, 0, 0],
                [-v[0], ax[0], ax[1], ax[2]],
                [-v[1], ay[0], ay[1], ay[2]],
                [-v[2], az[0], az[1], az[2]]
            ];
            A = Mat.matMatMult(A, Tcam1);

            return A;
        },

        // Update 3D-to-2D transformation matrix with the actual azimuth and elevation angles.
        update: function () {
            var mat2D, shift, size;

            if (
                !Type.exists(this.el_slide) ||
                !Type.exists(this.az_slide) ||
                !this.needsUpdate
            ) {
                return this;
            }

            mat2D = [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ];

            this.projectionType = Type.evaluate(this.visProp.projection).toLowerCase();

            switch (this.projectionType) {
                case 'central': // Central projection

                    this.matrix3D = this._updateCentralProjection();
                    // this.matrix3D is a 4x4 matrix

                    size = 0.4;
                    mat2D[1][1] = this.size[0] / (2 * size); // w / d_x
                    mat2D[2][2] = this.size[1] / (2 * size); // h / d_y
                    mat2D[1][0] = this.llftCorner[0] + mat2D[1][1] * 0.5 * (2 * size); // llft_x
                    mat2D[2][0] = this.llftCorner[1] + mat2D[2][2] * 0.5 * (2 * size); // llft_y

                    // The transformations this.matrix3D and mat2D can not be combined yet, since
                    // the projected vector has to be normalized in between in
                    // project3DTo2D
                    this.viewPortTransform = mat2D;
                    break;

                case 'parallel': // Parallel projection
                default:
                    // Rotate the scenery around the center of the box, not around the origin
                    shift = [
                        [1, 0, 0, 0],
                        [-0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]), 1, 0, 0],
                        [-0.5 * (this.bbox3D[1][0] + this.bbox3D[1][1]), 0, 1, 0],
                        [-0.5 * (this.bbox3D[2][0] + this.bbox3D[2][1]), 0, 0, 1]
                    ];

                    // Add a second transformation to scale and shift the projection
                    // on the board, usually called viewport.
                    mat2D[1][1] = this.size[0] / (this.bbox3D[0][1] - this.bbox3D[0][0]); // w / d_x
                    mat2D[2][2] = this.size[1] / (this.bbox3D[1][1] - this.bbox3D[1][0]); // h / d_y
                    mat2D[1][0] = this.llftCorner[0] + mat2D[1][1] * 0.5 * (this.bbox3D[0][1] - this.bbox3D[0][0]); // llft_x
                    mat2D[2][0] = this.llftCorner[1] + mat2D[2][2] * 0.5 * (this.bbox3D[1][1] - this.bbox3D[1][0]); // llft_y

                    // this.matrix3D is a 3x4 matrix
                    this.matrix3D = this.updateParallelProjection();
                    // Combine the projections
                    this.matrix3D = Mat.matMatMult(mat2D, Mat.matMatMult(this.matrix3D, shift));
            }

            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        removeObject: function (object, saveMethod) {
            var i;

            // this.board.removeObject(object, saveMethod);
            if (Type.isArray(object)) {
                for (i = 0; i < object.length; i++) {
                    this.removeObject(object[i]);
                }
                return this;
            }

            object = this.select(object);

            // // If the object which is about to be removed unknown or a string, do nothing.
            // // it is a string if a string was given and could not be resolved to an element.
            if (!Type.exists(object) || Type.isString(object)) {
                return this;
            }

            try {
                //     // remove all children.
                //     for (el in object.childElements) {
                //         if (object.childElements.hasOwnProperty(el)) {
                //             object.childElements[el].board.removeObject(object.childElements[el]);
                //         }
                //     }

                delete this.objects[object.id];
            } catch (e) {
                JXG.debug('View3D ' + object.id + ': Could not be removed: ' + e);
            }

            // this.update();

            this.board.removeObject(object, saveMethod);

            return this;
        },

        /**
         * Project 3D coordinates to 2D board coordinates
         * The 3D coordinates are provides as three numbers x, y, z or one array of length 3.
         *
         * @param  {Number|Array} x
         * @param  {Number[]} y
         * @param  {Number[]} z
         * @returns {Array} Array of length 3 containing the projection on to the board
         * in homogeneous user coordinates.
         */
        project3DTo2D: function (x, y, z) {
            var vec, w;
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

            w = Mat.matVecMult(this.matrix3D, vec);

            switch (this.projectionType) {
                case 'central':
                    w[1] /= w[0];
                    w[2] /= w[0];
                    w[3] /= w[0];
                    w[0] /= w[0];
                    return Mat.matVecMult(this.viewPortTransform, w.slice(0, 3));

                case 'parallel':
                default:
                    return w;
            }
        },

        /**
         * Project a 2D coordinate to the plane defined by point "foot"
         * and the normal vector `normal`.
         *
         * @param  {JXG.Point} point2d
         * @param  {Array} normal
         * @param  {Array} foot
         * @returns {Array} of length 4 containing the projected
         * point in homogeneous coordinates.
         */
        project2DTo3DPlane: function (point2d, normal, foot) {
            var mat, rhs, d, le,
                n = normal.slice(1),
                sol;

            foot = foot || [1, 0, 0, 0];
            le = Mat.norm(n, 3);
            d = Mat.innerProduct(foot.slice(1), n, 3) / le;

            mat = this.matrix3D.slice(0, 3); // True copy
            mat.push([0].concat(n));

            // 2D coordinates of point:
            rhs = point2d.coords.usrCoords.concat([d]);
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

        /**
         * Project a 2D coordinate to a new 3D position by keeping
         * the 3D x, y coordinates and changing only the z coordinate.
         * All horizontal moves of the 2D point are ignored.
         *
         * @param {JXG.Point} point2d
         * @param {Array} coords3D
         * @returns {Array} of length 4 containing the projected
         * point in homogeneous coordinates.
         */
        project2DTo3DVertical: function (point2d, coords3D) {
            var m3D = this.matrix3D[2],
                b = m3D[3],
                rhs = point2d.coords.usrCoords[2]; // y in 2D

            rhs -= m3D[0] * coords3D[0] + m3D[1] * coords3D[1] + m3D[2] * coords3D[2];
            if (Math.abs(b) < Mat.eps) {
                return coords3D; // No changes
            } else {
                return coords3D.slice(0, 3).concat([rhs / b]);
            }
        },

        /**
         * Limit 3D coordinates to the bounding cube.
         *
         * @param {Array} c3d 3D coordinates [x,y,z]
         * @returns Array with updated 3D coordinates.
         */
        project3DToCube: function (c3d) {
            var cube = this.bbox3D;
            if (c3d[1] < cube[0][0]) {
                c3d[1] = cube[0][0];
            }
            if (c3d[1] > cube[0][1]) {
                c3d[1] = cube[0][1];
            }
            if (c3d[2] < cube[1][0]) {
                c3d[2] = cube[1][0];
            }
            if (c3d[2] > cube[1][1]) {
                c3d[2] = cube[1][1];
            }
            if (c3d[3] < cube[2][0]) {
                c3d[3] = cube[2][0];
            }
            if (c3d[3] > cube[2][1]) {
                c3d[3] = cube[2][1];
            }

            return c3d;
        },

        /**
         * Intersect a ray with the bounding cube of the 3D view.
         * @param {Array} p 3D coordinates [x,y,z]
         * @param {Array} d 3D direction vector of the line (array of length 3)
         * @param {Number} r direction of the ray (positive if r > 0, negative if r < 0).
         * @returns Affine ratio of the intersection of the line with the cube.
         */
        intersectionLineCube: function (p, d, r) {
            var rnew, i, r0, r1;

            rnew = r;
            for (i = 0; i < 3; i++) {
                if (d[i] !== 0) {
                    r0 = (this.bbox3D[i][0] - p[i]) / d[i];
                    r1 = (this.bbox3D[i][1] - p[i]) / d[i];
                    if (r < 0) {
                        rnew = Math.max(rnew, Math.min(r0, r1));
                    } else {
                        rnew = Math.min(rnew, Math.max(r0, r1));
                    }
                }
            }
            return rnew;
        },

        /**
         * Test if coordinates are inside of the bounding cube.
         * @param {array} q 3D coordinates [x,y,z] of a point.
         * @returns Boolean
         */
        isInCube: function (q) {
            return (
                q[0] > this.bbox3D[0][0] - Mat.eps &&
                q[0] < this.bbox3D[0][1] + Mat.eps &&
                q[1] > this.bbox3D[1][0] - Mat.eps &&
                q[1] < this.bbox3D[1][1] + Mat.eps &&
                q[2] > this.bbox3D[2][0] - Mat.eps &&
                q[2] < this.bbox3D[2][1] + Mat.eps
            );
        },

        /**
         *
         * @param {JXG.Plane3D} plane1
         * @param {JXG.Plane3D} plane2
         * @param {JXG.Plane3D} d
         * @returns {Array} of length 2 containing the coordinates of the defining points of
         * of the intersection segment.
         */
        intersectionPlanePlane: function (plane1, plane2, d) {
            var ret = [[], []],
                p,
                dir,
                r,
                q;

            d = d || plane2.d;

            p = Mat.Geometry.meet3Planes(
                plane1.normal,
                plane1.d,
                plane2.normal,
                d,
                Mat.crossProduct(plane1.normal, plane2.normal),
                0
            );
            dir = Mat.Geometry.meetPlanePlane(
                plane1.vec1,
                plane1.vec2,
                plane2.vec1,
                plane2.vec2
            );
            r = this.intersectionLineCube(p, dir, Infinity);
            q = Mat.axpy(r, dir, p);
            if (this.isInCube(q)) {
                ret[0] = q;
            }
            r = this.intersectionLineCube(p, dir, -Infinity);
            q = Mat.axpy(r, dir, p);
            if (this.isInCube(q)) {
                ret[1] = q;
            }
            return ret;
        },

        /**
         * Generate mesh for a surface / plane.
         * Returns array [dataX, dataY] for a JSXGraph curve's updateDataArray function.
         * @param {Array|Function} func
         * @param {Array} interval_u
         * @param {Array} interval_v
         * @returns Array
         * @private
         *
         * @example
         *  var el = view.create('curve', [[], []]);
         *  el.updateDataArray = function () {
         *      var steps_u = Type.evaluate(this.visProp.stepsu),
         *           steps_v = Type.evaluate(this.visProp.stepsv),
         *           r_u = Type.evaluate(this.range_u),
         *           r_v = Type.evaluate(this.range_v),
         *           func, ret;
         *
         *      if (this.F !== null) {
         *          func = this.F;
         *      } else {
         *          func = [this.X, this.Y, this.Z];
         *      }
         *      ret = this.view.getMesh(func,
         *          r_u.concat([steps_u]),
         *          r_v.concat([steps_v]));
         *
         *      this.dataX = ret[0];
         *      this.dataY = ret[1];
         *  };
         *
         */
        getMesh: function (func, interval_u, interval_v) {
            var i_u, i_v, u, v,
                c2d, delta_u, delta_v,
                p = [0, 0, 0],
                steps_u = interval_u[2],
                steps_v = interval_v[2],
                dataX = [],
                dataY = [];

            delta_u = (Type.evaluate(interval_u[1]) - Type.evaluate(interval_u[0])) / steps_u;
            delta_v = (Type.evaluate(interval_v[1]) - Type.evaluate(interval_v[0])) / steps_v;

            for (i_u = 0; i_u <= steps_u; i_u++) {
                u = interval_u[0] + delta_u * i_u;
                for (i_v = 0; i_v <= steps_v; i_v++) {
                    v = interval_v[0] + delta_v * i_v;
                    if (Type.isFunction(func)) {
                        p = func(u, v);
                    } else {
                        p = [func[0](u, v), func[1](u, v), func[2](u, v)];
                    }
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
                    if (Type.isFunction(func)) {
                        p = func(u, v);
                    } else {
                        p = [func[0](u, v), func[1](u, v), func[2](u, v)];
                    }
                    c2d = this.project3DTo2D(p);
                    dataX.push(c2d[1]);
                    dataY.push(c2d[2]);
                }
                dataX.push(NaN);
                dataY.push(NaN);
            }

            return [dataX, dataY];
        },

        /**
         *
         */
        animateAzimuth: function () {
            var s = this.az_slide._smin,
                e = this.az_slide._smax,
                sdiff = e - s,
                newVal = this.az_slide.Value() + 0.1;

            this.az_slide.position = (newVal - s) / sdiff;
            if (this.az_slide.position > 1) {
                this.az_slide.position = 0.0;
            }
            this.board.update();

            this.timeoutAzimuth = setTimeout(function () {
                this.animateAzimuth();
            }.bind(this), 200);
        },

        /**
         *
         */
        stopAzimuth: function () {
            clearTimeout(this.timeoutAzimuth);
            this.timeoutAzimuth = null;
        },

        /**
         * Check if vertical dragging is enabled and which action is needed.
         * Default is shiftKey.
         *
         * @returns Boolean
         * @private
         */
        isVerticalDrag: function () {
            var b = this.board,
                key;
            if (!Type.evaluate(this.visProp.verticaldrag.enabled)) {
                return false;
            }
            key = '_' + Type.evaluate(this.visProp.verticaldrag.key) + 'Key';
            return b[key];
        },

        /**
         * Sets camera view to the given values.
         *
         * @param {Number} az Value of azimuth.
         * @param {Number} el Value of elevation.
         * @param {Number} [r] Value of radius.
         *
         * @returns {Object} Reference to the view.
         */
        setView: function (az, el, r) {
            r = r || this.r;

            this.az_slide.setValue(az);
            this.el_slide.setValue(el);
            this.r = r;
            this.board.update();

            return this;
        },

        /**
         * Changes view to the next view stored in the attribute `values`.
         *
         * @see View3D#values
         *
         * @returns {Object} Reference to the view.
         */
        nextView: function () {
            var views = Type.evaluate(this.visProp.values),
                n = this.visProp._currentview;

            n = (n + 1) % views.length;
            this.setCurrentView(n);

            return this;
        },

        /**
         * Changes view to the previous view stored in the attribute `values`.
         *
         * @see View3D#values
         *
         * @returns {Object} Reference to the view.
         */
        previousView: function () {
            var views = Type.evaluate(this.visProp.values),
                n = this.visProp._currentview;

            n = (n + views.length - 1) % views.length;
            this.setCurrentView(n);

            return this;
        },

        /**
         * Changes view to the determined view stored in the attribute `values`.
         *
         * @see View3D#values
         *
         * @param {Number} n Index of view in attribute `values`.
         * @returns {Object} Reference to the view.
         */
        setCurrentView: function (n) {
            var views = Type.evaluate(this.visProp.values);

            if (n < 0 || n >= views.length) {
                n = ((n % views.length) + views.length) % views.length;
            }

            this.setView(views[n][0], views[n][1], views[n][2]);
            this.visProp._currentview = n;

            return this;
        },

        /**
         * Controls the navigation in az direction using either the keyboard or a pointer.
         *
         * @private
         *
         * @param {event} event either the keydown or the pointer event
         * @returns view
         */
        _azEventHandler: function (event) {
            var smax = this.az_slide._smax,
                smin = this.az_slide._smin,
                speed = (smax - smin) / this.board.canvasWidth * (Type.evaluate(this.visProp.az.pointer.speed)),
                delta = event.movementX,
                az = this.az_slide.Value(),
                el = this.el_slide.Value();

            // Doesn't allow navigation if another moving event is triggered
            if (this.board.mode === this.board.BOARD_MODE_DRAG) {
                return this;
            }

            // Calculate new az value if keyboard events are triggered
            // Plus if right-button, minus if left-button
            if (Type.evaluate(this.visProp.az.keyboard.enabled)) {
                if (event.key === 'ArrowRight') {
                    az = az + Type.evaluate(this.visProp.az.keyboard.step) * Math.PI / 180;
                } else if (event.key === 'ArrowLeft') {
                    az = az - Type.evaluate(this.visProp.az.keyboard.step) * Math.PI / 180;
                }
            }

            if (Type.evaluate(this.visProp.az.pointer.enabled) && (delta !== 0) && event.key == null) {
                az += delta * speed;
            }

            // Project the calculated az value to a usable value in the interval [smin,smax]
            // Use modulo if continuous is true
            if (Type.evaluate(this.visProp.az.continuous)) {
                az = (((az % smax) + smax) % smax);
            } else {
                if (az > 0) {
                    az = Math.min(smax, az);
                } else if (az < 0) {
                    az = Math.max(smin, az);
                }
            }

            this.setView(az, el);
            return this;
        },

        /**
         * Controls the navigation in el direction using either the keyboard or a pointer.
         *
         * @private
         *
         * @param {event} event either the keydown or the pointer event
         * @returns view
         */
        _elEventHandler: function (event) {
            var smax = this.el_slide._smax,
                smin = this.el_slide._smin,
                speed = (smax - smin) / this.board.canvasHeight * Type.evaluate(this.visProp.el.pointer.speed),
                delta = event.movementY,
                az = this.az_slide.Value(),
                el = this.el_slide.Value();

            // Doesn't allow navigation if another moving event is triggered
            if (this.board.mode === this.board.BOARD_MODE_DRAG) {
                return this;
            }

            // Calculate new az value if keyboard events are triggered
            // Plus if right-button, minus if left-button
            if (Type.evaluate(this.visProp.el.keyboard.enabled)) {
                if (event.key === 'ArrowUp') {
                    el = el - Type.evaluate(this.visProp.el.keyboard.step) * Math.PI / 180;
                } else if (event.key === 'ArrowDown') {
                    el = el + Type.evaluate(this.visProp.el.keyboard.step) * Math.PI / 180;
                }
            }

            // Calculate new az value if keyboard events are triggered
            // Plus if right-button, minus if left-button
            if (Type.evaluate(this.visProp.el.pointer.enabled) && (delta !== 0) && event.key == null) {
                el += delta * speed;
            }

            // Project the calculated az value to a usable value in the interval [smin,smax]
            // Use modulo if continuous is true
            if (Type.evaluate(this.visProp.el.continuous)) {
                el = (((el % smax) + smax) % smax);
            } else {
                if (el > 0) {
                    el = Math.min(smax, el);
                } else if (el < 0) {
                    el = Math.max(smin, el);
                }
            }

            this.setView(az, el);
            return this;
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
 * (roughly) projected. If the view's azimuth=0 and elevation=0, the 3D view will cover a rectangle with lower left corner
 * [x,y] and side lengths [w, h] of the board.
 * The array 'cube' is of the form [[x1, x2], [y1, y2], [z1, z2]]
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
 *         var bound = [-5, 5];
 *         var view = board.create('view3d',
 *             [[-6, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 // Main axes
 *                 axesPosition: 'center',
 *                 xAxis: { strokeColor: 'blue', strokeWidth: 3},
 *                 // Planes
 *                 xPlaneRear: { fillColor: 'yellow',  mesh3d: {visible: false}},
 *                 yPlaneFront: { visible: true, fillColor: 'blue'},
 *                 // Axes on planes
 *                 xPlaneRearYAxis: {strokeColor: 'red'},
 *                 xPlaneRearZAxis: {strokeColor: 'red'},
 *                 yPlaneFrontXAxis: {strokeColor: 'blue'},
 *                 yPlaneFrontZAxis: {strokeColor: 'blue'},
 *                 zPlaneFrontXAxis: {visible: false},
 *                 zPlaneFrontYAxis: {visible: false}
 *             });
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createView3D = function (board, parents, attributes) {
    var view, attr, attr_az, attr_el,
        x, y, w, h,
        coords = parents[0], // llft corner
        size = parents[1]; // [w, h]

    attr = Type.copyAttributes(attributes, board.options, 'view3d');
    view = new JXG.View3D(board, parents, attr);
    view.defaultAxes = view.create('axes3d', parents, attributes);

    x = coords[0];
    y = coords[1];
    w = size[0];
    h = size[1];

    attr_az = Type.copyAttributes(attributes, board.options, 'view3d', 'az', 'slider');
    attr_az.name = 'az';

    attr_el = Type.copyAttributes(attributes, board.options, 'view3d', 'el', 'slider');
    attr_el.name = 'el';

    /**
     * Slider to adapt azimuth angle
     * @name JXG.View3D#az_slide
     * @type {Slider}
     */
    view.az_slide = board.create(
        'slider',
        [
            [x - 1, y - 2],
            [x + w + 1, y - 2],
            [
                Type.evaluate(attr_az.min),
                Type.evaluate(attr_az.start),
                Type.evaluate(attr_az.max)
            ]
        ],
        attr_az
    );

    /**
     * Slider to adapt elevation angle
     *
     * @name JXG.View3D#el_slide
     * @type {Slider}
     */
    view.el_slide = board.create(
        'slider',
        [
            [x - 1, y],
            [x - 1, y + h],
            [
                Type.evaluate(attr_el.min),
                Type.evaluate(attr_el.start),
                Type.evaluate(attr_el.max)]
        ],
        attr_el
    );

    view.board.highlightInfobox = function (x, y, el) {
        var d, i, c3d, foot,
            pre = '<span style="color:black; font-size:200%">\u21C4 &nbsp;</span>',
            brd = el.board,
            arr, infobox,
            p = null;

        if (view.isVerticalDrag()) {
            pre = '<span style="color:black; font-size:200%">\u21C5 &nbsp;</span>';
        }
        // Search 3D parent
        for (i = 0; i < el.parents.length; i++) {
            p = brd.objects[el.parents[i]];
            if (p.is3D) {
                break;
            }
        }
        if (p) {
            foot = [1, 0, 0, p.coords[3]];
            c3d = view.project2DTo3DPlane(p.element2D, [1, 0, 0, 1], foot);
            if (!view.isInCube(c3d)) {
                view.board.highlightCustomInfobox('', p);
                return;
            }
            d = Type.evaluate(p.visProp.infoboxdigits);
            infobox = view.board.infobox;
            if (d === 'auto') {
                if (infobox.useLocale()) {
                    arr = [pre, '(', infobox.formatNumberLocale(p.X()), ' | ', infobox.formatNumberLocale(p.Y()), ' | ', infobox.formatNumberLocale(p.Z()), ')'];
                } else {
                    arr = [pre, '(', Type.autoDigits(p.X()), ' | ', Type.autoDigits(p.Y()), ' | ', Type.autoDigits(p.Z()), ')'];
                }

            } else {
                if (infobox.useLocale()) {
                    arr = [pre, '(', infobox.formatNumberLocale(p.X(), d), ' | ', infobox.formatNumberLocale(p.Y(), d), ' | ', infobox.formatNumberLocale(p.Z(), d), ')'];
                } else {
                    arr = [pre, '(', Type.toFixed(p.X(), d), ' | ', Type.toFixed(p.Y(), d), ' | ', Type.toFixed(p.Z(), d), ')'];
                }
            }
            view.board.highlightCustomInfobox(arr.join(''), p);
        } else {
            view.board.highlightCustomInfobox('(' + x + ', ' + y + ')', el);
        }
    };

    // Hack needed to enable addEvent for view3D:
    view.BOARD_MODE_NONE = 0x0000;

    // Add events for the keyboard navigation
    Env.addEvent(board.containerObj, 'keydown', function (event) {
        var neededKey;

        if (Type.evaluate(view.visProp.el.keyboard.enabled) && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            neededKey = Type.evaluate(view.visProp.el.keyboard.key);
            if (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && event.shiftKey) || (neededKey.indexOf('ctrl') > -1 && event.ctrlKey)) {
                view._elEventHandler(event);
            }

        }
        if (Type.evaluate(view.visProp.el.keyboard.enabled) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            neededKey = Type.evaluate(view.visProp.az.keyboard.key);
            if (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && event.shiftKey) || (neededKey.indexOf('ctrl') > -1 && event.ctrlKey)) {
                view._azEventHandler(event);
            }
        }
        if (event.key === 'PageUp') {
            view.nextView();
        } else if (event.key === 'PageDown') {
            view.previousView();
        }

        event.preventDefault();
    }, view);

    // Add events for the pointer navigation
    board.containerObj.addEventListener('pointerdown', function (event) {
        var neededButton, neededKey,
            target;

        if (Type.evaluate(view.visProp.az.pointer.enabled)) {
            neededButton = Type.evaluate(view.visProp.az.pointer.button);
            neededKey = Type.evaluate(view.visProp.az.pointer.key);

            // Events for azimuth
            if (
                (neededButton === -1 || neededButton === event.button) &&
                (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && event.shiftKey) || (neededKey.indexOf('ctrl') > -1 && event.ctrlKey))
            ) {
                // If outside is true then the event listener is bound to the document, otherwise to the div
                if (Type.evaluate(view.visProp.az.pointer.outside)) {
                    target = document;
                } else {
                    target = board.containerObj;
                }
                Env.addEvent(target, 'pointermove', view._azEventHandler, view);
                view._hasMoveAz = true;
            }
        }

        if (Type.evaluate(view.visProp.el.pointer.enabled)) {
            neededButton = Type.evaluate(view.visProp.el.pointer.button);
            neededKey = Type.evaluate(view.visProp.el.pointer.key);

            // Events for elevation
            if (
                (neededButton === -1 || neededButton === event.button) &&
                (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && event.shiftKey) || (neededKey.indexOf('ctrl') > -1 && event.ctrlKey))
            ) {
                // If outside is true then the event listener is bound to the document, otherwise to the div
                if (Type.evaluate(view.visProp.el.pointer.outside)) {
                    target = document;
                } else {
                    target = board.containerObj;
                }
                Env.addEvent(target, 'pointermove', view._elEventHandler, view);
                view._hasMoveEl = true;
            }
        }

        // Remove pointerMove and pointerUp event listener as soon as pointer up is triggered
        function handlePointerUp() {
            var target;
            if (view._hasMoveAz) {
                if (Type.evaluate(view.visProp.az.pointer.outside)) {
                    target = document;
                } else {
                    target = view.board.containerObj;
                }
                Env.removeEvent(target, 'pointermove', view._azEventHandler, view);
                view._hasMoveAz = false;
            }
            if (view._hasMoveEl) {
                if (Type.evaluate(view.visProp.el.pointer.outside)) {
                    target = document;
                } else {
                    target = view.board.containerObj;
                }
                Env.removeEvent(target, 'pointermove', view._elEventHandler, view);
                view._hasMoveEl = false;
            }
            Env.removeEvent(document, 'pointerup', handlePointerUp, view);
        }

        Env.addEvent(document, 'pointerup', handlePointerUp, view);
    });

    view.board.update();

    return view;
};

JXG.registerElement("view3d", JXG.createView3D);

export default JXG.View3D;