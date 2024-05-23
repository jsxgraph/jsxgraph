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
/*
    Some functionalities in this file were developed as part of a software project
    with students. We would like to thank all contributors for their help:

    Winter semester 2023/2024:
        Lars Hofmann
        Leonhard Iser
        Vincent Kulicke
        Laura Rinas
 */

/*global JXG:true, define: true*/

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Coords from "../base/coords.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Env from "../utils/env.js";
import GeometryElement from "../base/element.js";
import Composition from "../base/composition.js";

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
     * The 4x4 matrix that maps world-space vectors to zero-focus view-space
     * vectors---that is, view space vectors for a camera sitting on the screen.
     * The camera is actually set back from the screen by the focal distance. To
     * get actual view space vectors, with the focal distance accounted for, use
     * the `worldToView` method.
     *
     * This transformation is exposed to help 3D elements manage their 2D
     * representations in central projection mode.
     * @type {Array}
     */
    this.cameraTransform = [];

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
     * The distance from the camera to the origin. In other words, the
     * radius of the sphere where the camera sits.
     * @type Number
     */
    this.r = -1;

    /**
     * The distance from the camera to the screen. Computed automatically from
     * the `fov` property.
     * @type Number
     */
    this.focalDist = -1;

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
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ];

            // mat projects homogeneous 3D coords in View3D
            // to homogeneous 2D coordinates in the board
            e = this.el_slide.Value();
            r = this.r;
            a = this.az_slide.Value();
            f = r * Math.sin(e);

            mat[1][1] = r * Math.cos(a);
            mat[1][2] = -r * Math.sin(a);
            mat[1][3] = 0;

            mat[2][1] = f * Math.sin(a);
            mat[2][2] = f * Math.cos(a);
            mat[2][3] = Math.cos(e);

            mat[3][1] = r * Math.cos(e) * Math.sin(a);
            mat[3][2] = r * Math.cos(e) * Math.cos(a);
            mat[3][3] = -Math.sin(e);

            return mat;
        },

        /**
         * Project 2D point (x,y) to the virtual trackpad sphere,
         * see Bell's virtual trackpad, and return z-component of the
         * number.
         *
         * @param {Number} r
         * @param {Number} x
         * @param {Number} y
         * @returns Number
         * @private
         */
        _projectToSphere: function(r, x, y) {
            var d = Mat.hypot(x, y),
                t, z;

            if (d < r * 0.7071067811865475) { // Inside sphere
                z = -Math.sqrt(r * r - d * d);
            } else {                          // On hyperbola
                t = r / 1.414213562373095;
                z = -t * t / d;
            }
            return z;
        },

        /**
         * Determine 4x4 rotation matrix with Bell's virtual trackball.
         *
         * @returns {Array} 4x4 rotation matrix
         * @private
         */
        updateProjectionTrackball: function (Pref) {
            var R = 100,
                dx, dy, dr2,
                p1, p2, x, y, theta, t, d,
                c, s, n,
                mat = [
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ];

            if (!Type.exists(this._trackball)) {
                return this.matrix3DRot;
            }

            dx = this._trackball.dx;
            dy = -this._trackball.dy;
            dr2 = dx * dx + dy * dy;
            if (dr2 > Mat.eps) {
                // // Method by Hanson, "The rolling ball", Graphics Gems III, p.51
                // // Rotation axis:
                // //     n = (-dy/dr, dx/dr, 0)
                // // Rotation angle around n:
                // //     theta = atan(dr / R) approx dr / R
                // dr = Math.sqrt(dr2);
                // c = R / Math.hypot(R, dr);  // cos(theta)
                // t = 1 - c;                  // 1 - cos(theta)
                // s = dr / Math.hypot(R, dr); // sin(theta)
                // n = [-dy / dr, dx / dr, 0];

                // Bell virtual trackpad, see
                // https://opensource.apple.com/source/X11libs/X11libs-60/mesa/Mesa-7.8.2/progs/util/trackball.c.auto.html
                // http://scv.bu.edu/documentation/presentations/visualizationworkshop08/materials/opengl/trackball.c.
                // See also Henriksen, Sporring, Hornaek, "Virtual Trackballs revisited".
                //
                R = (this.size[0] * this.board.unitX + this.size[1] * this.board.unitY) * 0.25;
                x = this._trackball.x;
                y = -this._trackball.y;

                p2 = [x, y, this._projectToSphere(R, x, y)];
                // [UNUSED] p2 = [this._projectToSphere(R, x, y), x, y];
                x -= dx;
                y -= dy;
                p1 = [x, y, this._projectToSphere(R, x, y)];
                // [UNUSED] p1 = [this._projectToSphere(R, x, y), x, y];

                n = Mat.crossProduct(p1, p2);
                d = Mat.hypot(n[0], n[1], n[2]);
                n[0] /= d;
                n[1] /= d;
                n[2] /= d;

                t = Geometry.distance(p2, p1, 3) / (2 * R);
                t = (t > 1.0) ? 1.0 : t;
                t = (t < -1.0) ? -1.0 : t;
                theta = 2.0 * Math.asin(t);
                c = Math.cos(theta);
                t = 1 - c;
                s = Math.sin(theta);

                // [DEBUG] log cursor motion and rotation axis
                console.log([dx, dy], n);

                // Rotation by theta about the axis n. See equation 9.63 of
                //
                //   Ian Richard Cole. "Modeling CPV" (thesis). Loughborough
                //   University. https://hdl.handle.net/2134/18050
                //
                mat[3][3] = c + n[2] * n[2] * t;
                mat[1][3] = n[0] * n[2] * t + n[1] * s;
                mat[2][3] = n[1] * n[2] * t - n[0] * s;

                mat[3][1] = n[2] * n[0] * t - n[1] * s;
                mat[1][1] = c + n[0] * n[0] * t;
                mat[2][1] = n[1] * n[0] * t + n[2] * s;

                mat[3][2] = n[2] * n[1] * t + n[0] * s;
                mat[1][2] = n[0] * n[1] * t - n[2] * s;
                mat[2][2] = c + n[1] * n[1] * t;

                if (Pref !== null) {
                    // For central projection we have to rotate around Pref.
                    // Parallel projection: Pref === null
                    mat[1][0] = Pref[0] - mat[1][1] * Pref[0] - mat[1][2] * Pref[0] - mat[1][3] * Pref[0];
                    mat[2][0] = Pref[1] - mat[2][1] * Pref[1] - mat[2][2] * Pref[1] - mat[2][3] * Pref[1];
                    mat[3][0] = Pref[2] - mat[3][1] * Pref[2] - mat[3][2] * Pref[2] - mat[3][3] * Pref[2];
                }
            }

            mat = Mat.matMatMult(mat, this.matrix3DRot);
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
                eye, d,
                zf = 20, // near clip plane
                zn = 8, // far clip plane
                Pref = [
                    0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]),
                    0.5 * (this.bbox3D[1][0] + this.bbox3D[1][1]),
                    0.5 * (this.bbox3D[2][0] + this.bbox3D[2][1])
                ],
                A,
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
            e = this.el_slide.Value();

            r = Type.evaluate(this.visProp.r);
            if (r === 'auto') {
                r = Mat.hypot(
                    this.bbox3D[0][0] - this.bbox3D[0][1],
                    this.bbox3D[1][0] - this.bbox3D[1][1],
                    this.bbox3D[2][0] - this.bbox3D[2][1]
                ) * 1.01;
                console.log(r);
            }

            // create an up vector and an eye vector which are 90 degrees out of phase
            up = func_sphere(a, e + Math.PI / 2, 1);
            eye = func_sphere(a, e, r);
            d = [eye[0], eye[1], eye[2]];

            eye[0] += Pref[0];
            eye[1] += Pref[1];
            eye[2] += Pref[2];

            // d = [eye[0] - Pref[0], eye[1] - Pref[1], eye[2] - Pref[2]];
            nrm = Mat.norm(d, 3);
            az = [d[0] / nrm, d[1] / nrm, d[2] / nrm];

            nrm = Mat.norm(up, 3);
            v = [up[0] / nrm, up[1] / nrm, up[2] / nrm];

            ax = Mat.crossProduct(v, az);
            ay = Mat.crossProduct(az, ax);

            // compute camera transformation
            v = Mat.matVecMult([ax, ay, az], eye);
            this.cameraTransform = [
                [1, 0, 0, 0],
                [-v[0], ax[0], ax[1], ax[2]],
                [-v[1], ay[0], ay[1], ay[2]],
                [-v[2], az[0], az[1], az[2]]
            ];

            // compute focal distance and clip space transformation
            this.focalDist = 1 / Math.tan(0.5 * Type.evaluate(this.visProp.fov));
            A = [
                [0, 0, 0, -1],
                [0, this.focalDist, 0, 0],
                [0, 0, this.focalDist, 0],
                [2 * zf * zn / (zn - zf), 0, 0, (zf + zn) / (zn - zf)]
            ];

            return Mat.matMatMult(A, this.cameraTransform);
        },

        // Update 3D-to-2D transformation matrix with the actual azimuth and elevation angles.
        update: function () {
            var mat2D, shift, size,
                dx, dy,
                Pref = null,
                useTrackball = false;

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

            if (Type.evaluate(this.visProp.trackball.enabled) && Type.exists(this.matrix3DRot)) {
                // If trackball is enabled and this.matrix3DRot has been initialized,
                // do trackball navigation
                if (this._hasMoveTrackball) {
                    // If this._hasMoveTrackball is false, the drag event has been
                    // caught by e.g. point dragging

                    if (this.projectionType === 'central') {
                        // Get center of the trackball.
                        // In case of parallel projection, this is not necessary,
                        // since we translate the whole scene with "shift".
                        Pref = [
                            0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]),
                            0.5 * (this.bbox3D[1][0] + this.bbox3D[1][1]),
                            0.5 * (this.bbox3D[2][0] + this.bbox3D[2][1])
                        ];
                    }
                    this.matrix3DRot = this.updateProjectionTrackball(Pref);
                }
                useTrackball = true;
            }

            switch (this.projectionType) {
                case 'central': // Central projection

                    // Add a final transformation to scale and shift the projection
                    // on the board, usually called viewport.
                    size = 2 * 0.4;
                    mat2D[1][1] = this.size[0] / size; // w / d_x
                    mat2D[2][2] = this.size[1] / size; // h / d_y
                    mat2D[1][0] = this.llftCorner[0] + mat2D[1][1] * 0.5 * size; // llft_x
                    mat2D[2][0] = this.llftCorner[1] + mat2D[2][2] * 0.5 * size; // llft_y
                    // The transformations this.matrix3D and mat2D can not be combined at this point,
                    // since the projected vectors have to be normalized in between in project3DTo2D
                    this.viewPortTransform = mat2D;

                    if (!useTrackball) {
                        // Do elevation / azimuth navigation or at least initialize matrix
                        // this.matrix3DRot
                        this.matrix3DRot = this._updateCentralProjection();
                    }
                    // this.matrix3D is a 4x4 matrix
                    this.matrix3D = this.matrix3DRot.slice();
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

                    // Add a final transformation to scale and shift the projection
                    // on the board, usually called viewport.
                    dx = this.bbox3D[0][1] - this.bbox3D[0][0];
                    dy = this.bbox3D[1][1] - this.bbox3D[1][0];
                    mat2D[1][1] = this.size[0] / dx; // w / d_x
                    mat2D[2][2] = this.size[1] / dy; // h / d_y
                    mat2D[1][0] = this.llftCorner[0] + mat2D[1][1] * 0.5 * dx; // llft_x
                    mat2D[2][0] = this.llftCorner[1] + mat2D[2][2] * 0.5 * dy; // llft_y

                    if (!useTrackball) {
                        // Do elevation / azimuth navigation or at least initialize matrix this.matrix3DRot
                        this.matrix3DRot = this.updateParallelProjection();
                    }
                    // Combine all transformations, this.matrix3D is a 3x4 matrix
                    this.matrix3D = Mat.matMatMult(mat2D, Mat.matMatMult(this.matrix3DRot, shift).slice(0, 3));
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
         * Map world coordinates to view coordinates.
         *
         * @param {Array} pWorld A world space point, in homogeneous coordinates.
         * @param {Boolean} [homog=true] Whether to return homogeneous coordinates.
         * If false, projects down to ordinary coordinates.
         */
        worldToView: function (pWorld, homog=true) {
            var pView = Mat.matVecMult(this.cameraTransform, pWorld);
            pView[3] -= pView[0] * this.focalDist;
            if (homog) {
                return pView;
            } else {
                for (let k = 1; k < 4; k++) {
                    pView[k] /= pView[0];
                }
                return pView.slice(1, 4);
            }
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
                    // vec = [1].concat(x);
                    vec = x.slice();
                    vec.unshift(1);
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
         * We know that v2d * w0 = mat * (1, x, y, d)^T where v2d = (1, b, c, h)^T with unknowns w0, h, x, y.
         * Setting R = mat^(-1) gives
         *   1/ w0 * (1, x, y, d)^T = R * v2d.
         * The first and the last row of this equation allows to determine 1/w0 and h.
         *
         * @param {Array} mat
         * @param {Array} v2d
         * @param {Number} d
         * @returns Array
         * @private
         */
        _getW0: function(mat, v2d, d) {
            var R = Mat.inverse(mat),
                R1 = R[0][0] + v2d[1] * R[0][1] + v2d[2] * R[0][2],
                R2 = R[3][0] + v2d[1] * R[3][1] + v2d[2] * R[3][2],
                w, h, det;

            det = d * R[0][3] - R[3][3];
            w = (R2 * R[0][3] - R1 * R[3][3]) / det;
            h = (R2 - R1 * d) / det;
            return [1 / w, h];
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
            var mat, rhs, d, le, sol,
                n = normal.slice(1),
                v2d, w0, res;

            foot = foot || [1, 0, 0, 0];
            le = Mat.norm(n, 3);
            d = Mat.innerProduct(foot.slice(1), n, 3) / le;

            if (this.projectionType === 'parallel') {
                mat = this.matrix3D.slice(0, 3); // True copy
                mat.push([0, n[0], n[1], n[2]]);

                // 2D coordinates of point:
                rhs = point2d.coords.usrCoords.slice();
                rhs.push(d);
                try {
                    // Prevent singularity in case elevation angle is zero
                    if (mat[2][3] === 1.0) {
                        mat[2][1] = mat[2][2] = Mat.eps * 0.001;
                    }
                    sol = Mat.Numerics.Gauss(mat, rhs);
                } catch (err) {
                    sol = [0, NaN, NaN, NaN];
                }
            } else {
                mat = this.matrix3DRot; // True copy

                // 2D coordinates of point:
                rhs = point2d.coords.usrCoords.slice();

                v2d = Mat.Numerics.Gauss(this.viewPortTransform, rhs);
                res = this._getW0(mat, v2d, d);
                w0 = res[0];
                rhs = [
                    v2d[0] * w0,
                    v2d[1] * w0,
                    v2d[2] * w0,
                    res[1] * w0
                ];
                try {
                    // Prevent singularity in case elevation angle is zero
                    if (mat[2][3] === 1.0) {
                        mat[2][1] = mat[2][2] = Mat.eps * 0.001;
                    }

                    sol = Mat.Numerics.Gauss(mat, rhs);
                    sol[1] /= sol[0];
                    sol[2] /= sol[0];
                    sol[3] /= sol[0];
                    // sol[3] = d;
                    sol[0] /= sol[0];
                } catch (err) {
                    sol = [0, NaN, NaN, NaN];
                }
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
         * @param {event} evt either the keydown or the pointer event
         * @returns view
         */
        _azEventHandler: function (evt) {
            var smax = this.az_slide._smax,
                smin = this.az_slide._smin,
                speed = (smax - smin) / this.board.canvasWidth * (Type.evaluate(this.visProp.az.pointer.speed)),
                delta = evt.movementX,
                az = this.az_slide.Value(),
                el = this.el_slide.Value();

            // Doesn't allow navigation if another moving event is triggered
            if (this.board.mode === this.board.BOARD_MODE_DRAG) {
                return this;
            }

            // Calculate new az value if keyboard events are triggered
            // Plus if right-button, minus if left-button
            if (Type.evaluate(this.visProp.az.keyboard.enabled)) {
                if (evt.key === 'ArrowRight') {
                    az = az + Type.evaluate(this.visProp.az.keyboard.step) * Math.PI / 180;
                } else if (evt.key === 'ArrowLeft') {
                    az = az - Type.evaluate(this.visProp.az.keyboard.step) * Math.PI / 180;
                }
            }

            if (Type.evaluate(this.visProp.az.pointer.enabled) && (delta !== 0) && evt.key == null) {
                az += delta * speed;
            }

            // Project the calculated az value to a usable value in the interval [smin,smax]
            // Use modulo if continuous is true
            if (Type.evaluate(this.visProp.az.continuous)) {
                az = (az + smax) % smax;
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
         * @param {event} evt either the keydown or the pointer event
         * @returns view
         */
        _elEventHandler: function (evt) {
            var smax = this.el_slide._smax,
                smin = this.el_slide._smin,
                speed = (smax - smin) / this.board.canvasHeight * Type.evaluate(this.visProp.el.pointer.speed),
                delta = evt.movementY,
                az = this.az_slide.Value(),
                el = this.el_slide.Value();

            // Doesn't allow navigation if another moving event is triggered
            if (this.board.mode === this.board.BOARD_MODE_DRAG) {
                return this;
            }

            // Calculate new az value if keyboard events are triggered
            // Plus if down-button, minus if up-button
            if (Type.evaluate(this.visProp.el.keyboard.enabled)) {
                if (evt.key === 'ArrowUp') {
                    el = el - Type.evaluate(this.visProp.el.keyboard.step) * Math.PI / 180;
                } else if (evt.key === 'ArrowDown') {
                    el = el + Type.evaluate(this.visProp.el.keyboard.step) * Math.PI / 180;
                }
            }

            if (Type.evaluate(this.visProp.el.pointer.enabled) && (delta !== 0) && evt.key == null) {
                el += delta * speed;
            }

            // Project the calculated el value to a usable value in the interval [smin,smax]
            // Use modulo if continuous is true
            if (Type.evaluate(this.visProp.el.continuous)) {
                el = (el + smax) % smax;
            } else {
                if (el > 0) {
                    el = Math.min(smax, el);
                } else if (el < 0) {
                    el = Math.max(smin, el);
                }
            }

            this.setView(az, el);
            return this;
        },

        _trackballHandler: function(evt) {
            var pos = this.board.getMousePosition(evt),
                x, y, center;

            center = new Coords(Const.COORDS_BY_USER, [this.llftCorner[0] + this.size[0] * 0.5, this.llftCorner[1] + this.size[1] * 0.5], this.board);
            x = pos[0] - center.scrCoords[1];
            y = pos[1] - center.scrCoords[2];
            this._trackball = {
                dx: evt.movementX,
                dy: evt.movementY,
                x: x,
                y: y
            };
            this.board.update();
            return this;
        },

        pointerDownHandler: function (evt) {
            var neededButton, neededKey, target;

            this._hasMoveAz = false;
            this._hasMoveEl = false;
            this._hasMoveTrackball = false;

            if (this.board.mode !== this.board.BOARD_MODE_NONE) {
                return;
            }

            if (Type.evaluate(this.visProp.trackball.enabled)) {
                neededButton = Type.evaluate(this.visProp.trackball.button);
                neededKey = Type.evaluate(this.visProp.trackball.key);

                // Move events for virtual trackball
                if (
                    (neededButton === -1 || neededButton === evt.button) &&
                    (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                ) {
                    // If outside is true then the event listener is bound to the document, otherwise to the div
                    target = (Type.evaluate(this.visProp.trackball.outside)) ? document : this.board.containerObj;
                    Env.addEvent(target, 'pointermove', this._trackballHandler, this);
                    this._hasMoveTrackball = true;
                }
            } else {
                if (Type.evaluate(this.visProp.az.pointer.enabled)) {
                    neededButton = Type.evaluate(this.visProp.az.pointer.button);
                    neededKey = Type.evaluate(this.visProp.az.pointer.key);

                    // Move events for azimuth
                    if (
                        (neededButton === -1 || neededButton === evt.button) &&
                        (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                    ) {
                        // If outside is true then the event listener is bound to the document, otherwise to the div
                        target = (Type.evaluate(this.visProp.az.pointer.outside)) ? document : this.board.containerObj;
                        Env.addEvent(target, 'pointermove', this._azEventHandler, this);
                        this._hasMoveAz = true;
                    }
                }

                if (Type.evaluate(this.visProp.el.pointer.enabled)) {
                    neededButton = Type.evaluate(this.visProp.el.pointer.button);
                    neededKey = Type.evaluate(this.visProp.el.pointer.key);

                    // Events for elevation
                    if (
                        (neededButton === -1 || neededButton === evt.button) &&
                        (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                    ) {
                        // If outside is true then the event listener is bound to the document, otherwise to the div
                        target = (Type.evaluate(this.visProp.el.pointer.outside)) ? document : this.board.containerObj;
                        Env.addEvent(target, 'pointermove', this._elEventHandler, this);
                        this._hasMoveEl = true;
                    }
                }
            }
            Env.addEvent(document, 'pointerup', this.pointerUpHandler, this);
        },

        pointerUpHandler: function(evt) {
            var target;
            if (this._hasMoveAz) {
                target = (Type.evaluate(this.visProp.az.pointer.outside)) ? document : this.board.containerObj;
                Env.removeEvent(target, 'pointermove', this._azEventHandler, this);
                this._hasMoveAz = false;
            }
            if (this._hasMoveEl) {
                target = (Type.evaluate(this.visProp.el.pointer.outside)) ? document : this.board.containerObj;
                Env.removeEvent(target, 'pointermove', this._elEventHandler, this);
                this._hasMoveEl = false;
            }
            if (this._hasMoveTrackball) {
                target = (Type.evaluate(this.visProp.az.pointer.outside)) ? document : this.board.containerObj;
                Env.removeEvent(target, 'pointermove', this._trackballHandler, this);
                this._hasMoveTrackball = false;
            }
            Env.removeEvent(document, 'pointerup', this.pointerUpHandler, this);
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
            view._w0 = Mat.innerProduct(view.matrix3D[0], foot, 4);

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
    Env.addEvent(board.containerObj, 'pointerdown', view.pointerDownHandler, view);

    view.board.update();

    return view;
};

JXG.registerElement("view3d", JXG.createView3D);

export default JXG.View3D;