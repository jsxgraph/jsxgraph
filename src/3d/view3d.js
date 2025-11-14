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
import Numerics from "../math/numerics.js";
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
     * An array containing all the elements in the view that are sorted due to their depth order.
     * @Type Object
     * @private
     */
    this.depthOrdered = {};

    /**
     * TODO: why deleted?
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
     * The Tait-Bryan angles specifying the view box orientation
     */
    this.angles = {
        az: null,
        el: null,
        bank: null
    };

    /**
     * @type {Array}
     * The view box orientation matrix
     */
    this.matrix3DRot = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    // Used for z-index computation
    this.matrix3DRotShift = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

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
     * The 4×4 matrix that maps box coordinates to camera coordinates. These
     * coordinate systems fit into the View3D coordinate atlas as follows.
     * <ul>
     * <li><b>World coordinates.</b> The coordinates used to specify object
     * positions in a JSXGraph scene.</li>
     * <li><b>Box coordinates.</b> The world coordinates translated to put the
     * center of the view box at the origin.
     * <li><b>Camera coordinates.</b> The coordinate system where the
     * <code>x</code>, <code>y</code> plane is the screen, the origin is the
     * center of the screen, and the <code>z</code> axis points out of the
     * screen, toward the viewer.
     * <li><b>Focal coordinates.</b> The camera coordinates translated to put
     * the origin at the focal point, which is set back from the screen by the
     * focal distance.</li>
     * </ul>
     * The <code>boxToCam</code> transformation is exposed to help 3D elements
     * manage their 2D representations in central projection mode. To map world
     * coordinates to focal coordinates, use the
     * {@link JXG.View3D#worldToFocal} method.
     * @type {Array}
     */
    this.boxToCam = [];

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

    /**
     * Whether trackball navigation is currently enabled.
     * @type String
     */
    this.trackballEnabled = false;

    this.timeoutAzimuth = null;

    this.zIndexMin = Infinity;
    this.zIndexMax = -Infinity;

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

        if (Type.isString(s) && s !== '') {
            // It's a string, most likely an id or a name.
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

        } else if (
            !onlyByIdOrName &&
            (Type.isFunction(s) || (Type.isObject(s) && !Type.isFunction(s.setAttribute)))
        ) {
            // It's a function or an object, but not an element
            flist = Type.filterElements(this.objectsList, s);

            olist = {};
            l = flist.length;
            for (i = 0; i < l; i++) {
                olist[flist[i].id] = flist[i];
            }
            s = new Composition(olist);

        } else if (
            Type.isObject(s) &&
            Type.exists(s.id) &&
            !Type.exists(this.objects[s.id])
        ) {
            // It's an element which has been deleted (and still hangs around, e.g. in an attractor list)
            s = null;
        }

        return s;
    },

    // set the Tait-Bryan angles to specify the current view rotation matrix
    setAnglesFromRotation: function () {
        var rem = this.matrix3DRot, // rotation remaining after angle extraction
            rBank, cosBank, sinBank,
            cosEl, sinEl,
            cosAz, sinAz;

        // extract bank by rotating the view box z axis onto the camera yz plane
        rBank = Math.sqrt(rem[1][3] * rem[1][3] + rem[2][3] * rem[2][3]);
        if (rBank > Mat.eps) {
            cosBank = rem[2][3] / rBank;
            sinBank = rem[1][3] / rBank;
        } else {
            // if the z axis is pointed almost exactly at the screen, we
            // keep the current bank value
            cosBank = Math.cos(this.angles.bank);
            sinBank = Math.sin(this.angles.bank);
        }
        rem = Mat.matMatMult([
            [1, 0, 0, 0],
            [0, cosBank, -sinBank, 0],
            [0, sinBank, cosBank, 0],
            [0, 0, 0, 1]
        ], rem);
        this.angles.bank = Math.atan2(sinBank, cosBank);

        // extract elevation by rotating the view box z axis onto the camera
        // y axis
        cosEl = rem[2][3];
        sinEl = rem[3][3];
        rem = Mat.matMatMult([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, cosEl, sinEl],
            [0, 0, -sinEl, cosEl]
        ], rem);
        this.angles.el = Math.atan2(sinEl, cosEl);

        // extract azimuth
        cosAz = -rem[1][1];
        sinAz = rem[3][1];
        this.angles.az = Math.atan2(sinAz, cosAz);
        if (this.angles.az < 0) this.angles.az += 2 * Math.PI;

        this.setSlidersFromAngles();
    },

    anglesHaveMoved: function () {
        return (
            this._hasMoveAz || this._hasMoveEl ||
            Math.abs(this.angles.az - this.az_slide.Value()) > Mat.eps ||
            Math.abs(this.angles.el - this.el_slide.Value()) > Mat.eps ||
            Math.abs(this.angles.bank - this.bank_slide.Value()) > Mat.eps
        );
    },

    getAnglesFromSliders: function () {
        this.angles.az = this.az_slide.Value();
        this.angles.el = this.el_slide.Value();
        this.angles.bank = this.bank_slide.Value();
    },

    setSlidersFromAngles: function () {
        this.az_slide.setValue(this.angles.az);
        this.el_slide.setValue(this.angles.el);
        this.bank_slide.setValue(this.angles.bank);
    },

    // return the rotation matrix specified by the current Tait-Bryan angles
    getRotationFromAngles: function () {
        var a, e, b, f,
            cosBank, sinBank,
            mat = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];

        // mat projects homogeneous 3D coords in View3D
        // to homogeneous 2D coordinates in the board
        a = this.angles.az;
        e = this.angles.el;
        b = this.angles.bank;
        f = -Math.sin(e);

        mat[1][1] = -Math.cos(a);
        mat[1][2] = Math.sin(a);
        mat[1][3] = 0;

        mat[2][1] = f * Math.sin(a);
        mat[2][2] = f * Math.cos(a);
        mat[2][3] = Math.cos(e);

        mat[3][1] = Math.cos(e) * Math.sin(a);
        mat[3][2] = Math.cos(e) * Math.cos(a);
        mat[3][3] = Math.sin(e);

        cosBank = Math.cos(b);
        sinBank = Math.sin(b);
        mat = Mat.matMatMult([
            [1, 0, 0, 0],
            [0, cosBank, sinBank, 0],
            [0, -sinBank, cosBank, 0],
            [0, 0, 0, 1]
        ], mat);

        return mat;

        /* this code, originally from `_updateCentralProjection`, is an
         * alternate implementation of the azimuth-elevation matrix
         * computation above. using this implementation instead of the
         * current one might lead to simpler code in a future refactoring
        var a, e, up,
            ax, ay, az, v, nrm,
            eye, d,
            func_sphere;

        // finds the point on the unit sphere with the given azimuth and
        // elevation, and returns its affine coordinates
        func_sphere = function (az, el) {
            return [
                Math.cos(az) * Math.cos(el),
                -Math.sin(az) * Math.cos(el),
                Math.sin(el)
            ];
        };

        a = this.az_slide.Value() + (3 * Math.PI * 0.5); // Sphere
        e = this.el_slide.Value();

        // create an up vector and an eye vector which are 90 degrees out of phase
        up = func_sphere(a, e + Math.PI / 2);
        eye = func_sphere(a, e);
        d = [eye[0], eye[1], eye[2]];

        nrm = Mat.norm(d, 3);
        az = [d[0] / nrm, d[1] / nrm, d[2] / nrm];

        nrm = Mat.norm(up, 3);
        v = [up[0] / nrm, up[1] / nrm, up[2] / nrm];

        ax = Mat.crossProduct(v, az);
        ay = Mat.crossProduct(az, ax);

        this.matrix3DRot[1] = [0, ax[0], ax[1], ax[2]];
        this.matrix3DRot[2] = [0, ay[0], ay[1], ay[2]];
        this.matrix3DRot[3] = [0, az[0], az[1], az[2]];
         */
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
    _projectToSphere: function (r, x, y) {
        var d = Mat.hypot(x, y),
            t, z;

        if (d < r * 0.7071067811865475) { // Inside sphere
            z = Math.sqrt(r * r - d * d);
        } else {                          // On hyperbola
            t = r / 1.414213562373095;
            z = t * t / d;
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
        dy = this._trackball.dy;
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
            y = this._trackball.y;

            p2 = [x, y, this._projectToSphere(R, x, y)];
            x -= dx;
            y -= dy;
            p1 = [x, y, this._projectToSphere(R, x, y)];

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

            // Rotation by theta about the axis n. See equation 9.63 of
            //
            //   Ian Richard Cole. "Modeling CPV" (thesis). Loughborough
            //   University. https://hdl.handle.net/2134/18050
            //
            mat[1][1] = c + n[0] * n[0] * t;
            mat[2][1] = n[1] * n[0] * t + n[2] * s;
            mat[3][1] = n[2] * n[0] * t - n[1] * s;

            mat[1][2] = n[0] * n[1] * t - n[2] * s;
            mat[2][2] = c + n[1] * n[1] * t;
            mat[3][2] = n[2] * n[1] * t + n[0] * s;

            mat[1][3] = n[0] * n[2] * t + n[1] * s;
            mat[2][3] = n[1] * n[2] * t - n[0] * s;
            mat[3][3] = c + n[2] * n[2] * t;
        }

        mat = Mat.matMatMult(mat, this.matrix3DRot);
        return mat;
    },

    updateAngleSliderBounds: function () {
        var az_smax, az_smin,
            el_smax, el_smin, el_cover,
            el_smid, el_equiv, el_flip_equiv,
            el_equiv_loss, el_flip_equiv_loss, el_interval_loss,
            bank_smax, bank_smin;

        // update stored trackball toggle
        this.trackballEnabled = this.evalVisProp('trackball.enabled');

        // set slider bounds
        if (this.trackballEnabled) {
            this.az_slide.setMin(0);
            this.az_slide.setMax(2 * Math.PI);
            this.el_slide.setMin(-0.5 * Math.PI);
            this.el_slide.setMax(0.5 * Math.PI);
            this.bank_slide.setMin(-Math.PI);
            this.bank_slide.setMax(Math.PI);
        } else {
            this.az_slide.setMin(this.visProp.az.slider.min);
            this.az_slide.setMax(this.visProp.az.slider.max);
            this.el_slide.setMin(this.visProp.el.slider.min);
            this.el_slide.setMax(this.visProp.el.slider.max);
            this.bank_slide.setMin(this.visProp.bank.slider.min);
            this.bank_slide.setMax(this.visProp.bank.slider.max);
        }

        // get new slider bounds
        az_smax = this.az_slide._smax;
        az_smin = this.az_slide._smin;
        el_smax = this.el_slide._smax;
        el_smin = this.el_slide._smin;
        bank_smax = this.bank_slide._smax;
        bank_smin = this.bank_slide._smin;

        // wrap and restore angle values
        if (this.trackballEnabled) {
            // if we're upside-down, flip the bank angle to reach the same
            // orientation with an elevation between -pi/2 and pi/2
            el_cover = Mat.mod(this.angles.el, 2 * Math.PI);
            if (0.5 * Math.PI < el_cover && el_cover < 1.5 * Math.PI) {
                this.angles.el = Math.PI - el_cover;
                this.angles.az = Mat.wrap(this.angles.az + Math.PI, az_smin, az_smax);
                this.angles.bank = Mat.wrap(this.angles.bank + Math.PI, bank_smin, bank_smax);
            }

            // wrap the azimuth and bank angle
            this.angles.az = Mat.wrap(this.angles.az, az_smin, az_smax);
            this.angles.el = Mat.wrap(this.angles.el, el_smin, el_smax);
            this.angles.bank = Mat.wrap(this.angles.bank, bank_smin, bank_smax);
        } else {
            // wrap and clamp the elevation into the slider range. if
            // flipping the elevation gets us closer to the slider interval,
            // do that, inverting the azimuth and bank angle to compensate
            el_interval_loss = function (t) {
                if (t < el_smin) {
                    return el_smin - t;
                } else if (el_smax < t) {
                    return t - el_smax;
                } else {
                    return 0;
                }
            };
            el_smid = 0.5 * (el_smin + el_smax);
            el_equiv = Mat.wrap(
                this.angles.el,
                el_smid - Math.PI,
                el_smid + Math.PI
            );
            el_flip_equiv = Mat.wrap(
                Math.PI - this.angles.el,
                el_smid - Math.PI,
                el_smid + Math.PI
            );
            el_equiv_loss = el_interval_loss(el_equiv);
            el_flip_equiv_loss = el_interval_loss(el_flip_equiv);
            if (el_equiv_loss <= el_flip_equiv_loss) {
                this.angles.el = Mat.clamp(el_equiv, el_smin, el_smax);
            } else {
                this.angles.el = Mat.clamp(el_flip_equiv, el_smin, el_smax);
                this.angles.az = Mat.wrap(this.angles.az + Math.PI, az_smin, az_smax);
                this.angles.bank = Mat.wrap(this.angles.bank + Math.PI, bank_smin, bank_smax);
            }

            // wrap and clamp the azimuth and bank angle into the slider range
            this.angles.az = Mat.wrapAndClamp(this.angles.az, az_smin, az_smax, 2 * Math.PI);
            this.angles.bank = Mat.wrapAndClamp(this.angles.bank, bank_smin, bank_smax, 2 * Math.PI);

            // since we're using `clamp`, angles may have changed
            this.matrix3DRot = this.getRotationFromAngles();
        }

        // restore slider positions
        this.setSlidersFromAngles();
    },

    /**
     * @private
     * @returns {Array}
     */
    _updateCentralProjection: function () {
        var zf = 20, // near clip plane
            zn = 8, // far clip plane

            // See https://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/graphics_6_1_eng_web.html
            // bbox3D is always at the world origin, i.e. T_obj is the unit matrix.
            // All vectors contain affine coordinates and have length 3
            // The matrices are of size 4x4.
            r, A;

        // set distance from view box center to camera
        r = this.evalVisProp('r');
        if (r === 'auto') {
            r = Mat.hypot(
                this.bbox3D[0][0] - this.bbox3D[0][1],
                this.bbox3D[1][0] - this.bbox3D[1][1],
                this.bbox3D[2][0] - this.bbox3D[2][1]
            ) * 1.01;
        }

        // compute camera transformation
        // this.boxToCam = this.matrix3DRot.map((row) => row.slice());
        this.boxToCam = this.matrix3DRot.map(function (row) { return row.slice(); });
        this.boxToCam[3][0] = -r;

        // compute focal distance and clip space transformation
        this.focalDist = 1 / Math.tan(0.5 * this.evalVisProp('fov'));
        A = [
            [0, 0, 0, -1],
            [0, this.focalDist, 0, 0],
            [0, 0, this.focalDist, 0],
            [2 * zf * zn / (zn - zf), 0, 0, (zf + zn) / (zn - zf)]
        ];

        return Mat.matMatMult(A, this.boxToCam);
    },

    // Update 3D-to-2D transformation matrix with the actual azimuth and elevation angles.
    update: function () {
        var r = this.r,
            stretch = [
                [1, 0, 0, 0],
                [0, -r, 0, 0],
                [0, 0, -r, 0],
                [0, 0, 0, 1]
            ],
            mat2D, objectToClip, size,
            dx, dy;
            // objectsList;

        if (
            !Type.exists(this.el_slide) ||
            !Type.exists(this.az_slide) ||
            !Type.exists(this.bank_slide) ||
            !this.needsUpdate
        ) {
            this.needsUpdate = false;
            return this;
        }

        mat2D = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];

        this.projectionType = this.evalVisProp('projection').toLowerCase();

        // override angle slider bounds when trackball navigation is enabled
        if (this.trackballEnabled !== this.evalVisProp('trackball.enabled')) {
            this.updateAngleSliderBounds();
        }

        if (this._hasMoveTrackball) {
            // The trackball has been moved since the last update, so we do
            // trackball navigation. When the trackball is enabled, a drag
            // event is interpreted as a trackball movement unless it's
            // caught by something else, like point dragging. When the
            // trackball is disabled, the trackball movement flag should
            // never be set
            this.matrix3DRot = this.updateProjectionTrackball();
            this.setAnglesFromRotation();
        } else if (this.anglesHaveMoved()) {
            // The trackball hasn't been moved since the last up date, but
            // the Tait-Bryan angles have been, so we do angle navigation
            this.getAnglesFromSliders();
            this.matrix3DRot = this.getRotationFromAngles();
        }

        /**
         * The translation that moves the center of the view box to the origin.
         */
        this.shift = [
            [1, 0, 0, 0],
            [-0.5 * (this.bbox3D[0][0] + this.bbox3D[0][1]), 1, 0, 0],
            [-0.5 * (this.bbox3D[1][0] + this.bbox3D[1][1]), 0, 1, 0],
            [-0.5 * (this.bbox3D[2][0] + this.bbox3D[2][1]), 0, 0, 1]
        ];

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
                objectToClip = this._updateCentralProjection();
                // this.matrix3D is a 4x4 matrix
                this.matrix3D = Mat.matMatMult(objectToClip, this.shift);
                break;

            case 'parallel': // Parallel projection
            default:
                // Add a final transformation to scale and shift the projection
                // on the board, usually called viewport.
                dx = this.bbox3D[0][1] - this.bbox3D[0][0];
                dy = this.bbox3D[1][1] - this.bbox3D[1][0];
                mat2D[1][1] = this.size[0] / dx; // w / d_x
                mat2D[2][2] = this.size[1] / dy; // h / d_y
                mat2D[1][0] = this.llftCorner[0] + mat2D[1][1] * 0.5 * dx; // llft_x
                mat2D[2][0] = this.llftCorner[1] + mat2D[2][2] * 0.5 * dy; // llft_y

                // Combine all transformations, this.matrix3D is a 3x4 matrix
                this.matrix3D = Mat.matMatMult(
                    mat2D,
                    Mat.matMatMult(Mat.matMatMult(this.matrix3DRot, stretch), this.shift).slice(0, 3)
                );
        }

        // Used for zIndex in dept ordering in subsequent update methods of the
        // 3D elements and in view3d.updateRenderer
        this.matrix3DRotShift = Mat.matMatMult(this.matrix3DRot, this.shift);

        return this;
    },

    /**
     * Compares 3D elements according to their z-Index.
     * @param {JXG.GeometryElement3D} a
     * @param {JXG.GeometryElement3D} b
     * @returns Number
     */
    compareDepth: function (a, b) {
        // return a.zIndex - b.zIndex;
        // if (a.type !== Const.OBJECT_TYPE_PLANE3D && b.type !== Const.OBJECT_TYPE_PLANE3D) {
        //     return a.zIndex - b.zIndex;
        // } else if (a.type === Const.OBJECT_TYPE_PLANE3D) {
        //     let bHesse = Mat.innerProduct(a.point.coords, a.normal, 4);
        //     let po = Mat.innerProduct(b.coords, a.normal, 4);
        //     let pos = Mat.innerProduct(this.boxToCam[3], a.normal, 4);
        // console.log(this.boxToCam[3])
        //     return pos - po;
        // } else if (b.type === Const.OBJECT_TYPE_PLANE3D) {
        //     let bHesse = Mat.innerProduct(b.point.coords, b.normal, 4);
        //     let po = Mat.innerProduct(a.coords, a.normal, 4);
        //     let pos = Mat.innerProduct(this.boxToCam[3], b.normal, 4);
        //     console.log('b', pos, po, bHesse)
        //     return -pos;
        // }
        return a.zIndex - b.zIndex;
    },

    updateZIndices: function() {
        var id, el;
        for (id in this.objects) {
            if (this.objects.hasOwnProperty(id)) {
                el = this.objects[id];
                // Update zIndex of less frequent objects line3d and polygon3d
                // The other elements (point3d, face3d) do this in their update method.
                if ((el.type === Const.OBJECT_TYPE_LINE3D ||
                    el.type === Const.OBJECT_TYPE_POLYGON3D
                    ) &&
                    Type.exists(el.element2D) &&
                    el.element2D.evalVisProp('visible')
                ) {
                    el.updateZIndex();
                }
            }
        }
    },

    updateShaders: function() {
        var id, el, v;
        for (id in this.objects) {
            if (this.objects.hasOwnProperty(id)) {
                el = this.objects[id];
                if (Type.exists(el.shader)) {
                    v = el.shader();
                    if (v < this.zIndexMin) {
                        this.zIndexMin = v;
                    } else if (v > this.zIndexMax) {
                        this.zIndexMax = v;
                    }
                }
            }
        }
    },

    updateDepthOrdering: function () {
        var id, el,
            i, j, l, layers, lay;

        // Collect elements for depth ordering layer-wise
        layers = this.evalVisProp('depthorder.layers');
        for (i = 0; i < layers.length; i++) {
            this.depthOrdered[layers[i]] = [];
        }

        for (id in this.objects) {
            if (this.objects.hasOwnProperty(id)) {
                el = this.objects[id];
                if ((el.type === Const.OBJECT_TYPE_FACE3D ||
                    el.type === Const.OBJECT_TYPE_LINE3D ||
                    // el.type === Const.OBJECT_TYPE_PLANE3D ||
                    el.type === Const.OBJECT_TYPE_POINT3D ||
                    el.type === Const.OBJECT_TYPE_POLYGON3D
                    ) &&
                    Type.exists(el.element2D) &&
                    el.element2D.evalVisProp('visible')
                ) {
                    lay = el.element2D.evalVisProp('layer');
                    if (layers.indexOf(lay) >= 0) {
                        this.depthOrdered[lay].push(el);
                    }
                }
            }
        }

        if (this.board.renderer && this.board.renderer.type === 'svg') {
            for (i = 0; i < layers.length; i++) {
                lay = layers[i];
                this.depthOrdered[lay].sort(this.compareDepth.bind(this));
                // DEBUG
                // if (this.depthOrdered[lay].length > 0) {
                //     for (let k = 0; k < this.depthOrdered[lay].length; k++) {
                //         let o = this.depthOrdered[lay][k]
                //         console.log(o.visProp.fillcolor, o.zIndex)
                //     }
                // }
                l = this.depthOrdered[lay];
                for (j = 0; j < l.length; j++) {
                    this.board.renderer.setLayer(l[j].element2D, lay);
                }
                // this.depthOrdered[lay].forEach((el) => this.board.renderer.setLayer(el.element2D, lay));
                // Attention: forEach prevents deleting an element
            }
        }

        return this;
    },

    updateRenderer: function () {
        if (!this.needsUpdate) {
            return this;
        }

        // console.time('update')
        // Handle depth ordering
        this.depthOrdered = {};

        if (this.shift !== undefined && this.evalVisProp('depthorder.enabled')) {
            // Update the zIndices of certain element types.
            // We do it here in updateRenderer, because the elements' positions
            // are meanwhile updated.
            this.updateZIndices();

            this.updateShaders();

            if (this.board.renderer && this.board.renderer.type === 'svg') {
                // For SVG we update the DOM order
                // In canvas we sort the elements in board.updateRendererCanvas
                this.updateDepthOrdering();
            }
        }
        // console.timeEnd('update')

        this.needsUpdate = false;
        return this;
    },

    removeObject: function (object, saveMethod) {
        var i, el;

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
            // Remove all children.
            for (el in object.childElements) {
                if (object.childElements.hasOwnProperty(el)) {
                    this.removeObject(object.childElements[el]);
                }
            }

            delete this.objects[object.id];
        } catch (e) {
            JXG.debug('View3D ' + object.id + ': Could not be removed: ' + e);
        }

        // this.update();

        this.board.removeObject(object, saveMethod);

        return this;
    },

    /**
     * Map world coordinates to focal coordinates. These coordinate systems
     * are explained in the {@link JXG.View3D#boxToCam} matrix
     * documentation.
     *
     * @param {Array} pWorld A world space point, in homogeneous coordinates.
     * @param {Boolean} [homog=true] Whether to return homogeneous coordinates.
     * If false, projects down to ordinary coordinates.
     */
    worldToFocal: function (pWorld, homog = true) {
        var k,
            pView = Mat.matVecMult(this.boxToCam, Mat.matVecMult(this.shift, pWorld));
        pView[3] -= pView[0] * this.focalDist;
        if (homog) {
            return pView;
        } else {
            for (k = 1; k < 4; k++) {
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
    _getW0: function (mat, v2d, d) {
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
     * @param  {Array} normal Normal of plane
     * @param  {Array} foot Foot point of plane
     * @returns {Array} of length 4 containing the projected
     * point in homogeneous coordinates.
     */
    project2DTo3DPlane: function (point2d, normal, foot) {
        var mat, rhs, d, le, sol,
            f = foot.slice(1) || [0, 0, 0],
            n = normal.slice(1),
            v2d, w0, res;

        le = Mat.norm(n, 3);
        d = Mat.innerProduct(f, n, 3) / le;

        if (this.projectionType === 'parallel') {
            mat = this.matrix3D.slice(0, 3);     // Copy each row by reference
            mat.push([0, n[0], n[1], n[2]]);

            // 2D coordinates of point
            rhs = point2d.coords.usrCoords.slice();
            rhs.push(d);
            try {
                // Prevent singularity in case elevation angle is zero
                if (mat[2][3] === 1.0) {
                    mat[2][1] = mat[2][2] = Mat.eps * 0.001;
                }
                sol = Mat.Numerics.Gauss(mat, rhs);
            } catch (e) {
                sol = [0, NaN, NaN, NaN];
            }
        } else {
            mat = this.matrix3D;

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
     * Project a point on the screen to the nearest point, in screen
     * distance, on a line segment in 3d space. The inputs must be in
     * ordinary coordinates, but the output is in homogeneous coordinates.
     *
     * @param {Array} pScr The screen coordinates of the point to project.
     * @param {Array} end0 The world space coordinates of one end of the
     * line segment.
     * @param {Array} end1 The world space coordinates of the other end of
     * the line segment.
     *
     * @returns Homogeneous coordinates of the projection
     */
    projectScreenToSegment: function (pScr, end0, end1) {
        var end0_2d = this.project3DTo2D(end0).slice(1, 3),
            end1_2d = this.project3DTo2D(end1).slice(1, 3),
            dir_2d = [
                end1_2d[0] - end0_2d[0],
                end1_2d[1] - end0_2d[1]
            ],
            dir_2d_norm_sq = Mat.innerProduct(dir_2d, dir_2d),
            diff = [
                pScr[0] - end0_2d[0],
                pScr[1] - end0_2d[1]
            ],
            s = Mat.innerProduct(diff, dir_2d) / dir_2d_norm_sq, // screen-space affine parameter
            mid, mid_2d, mid_diff, m,

            t, // view-space affine parameter
            t_clamped, // affine parameter clamped to range
            t_clamped_co;

        if (this.projectionType === 'central') {
            mid = [
                0.5 * (end0[0] + end1[0]),
                0.5 * (end0[1] + end1[1]),
                0.5 * (end0[2] + end1[2])
            ];
            mid_2d = this.project3DTo2D(mid).slice(1, 3);
            mid_diff = [
                mid_2d[0] - end0_2d[0],
                mid_2d[1] - end0_2d[1]
            ];
            m = Mat.innerProduct(mid_diff, dir_2d) / dir_2d_norm_sq;

            // the view-space affine parameter s is related to the
            // screen-space affine parameter t by a Möbius transformation,
            // which is determined by the following relations:
            //
            // s | t
            // -----
            // 0 | 0
            // m | 1/2
            // 1 | 1
            //
            t = (1 - m) * s / ((1 - 2 * m) * s + m);
        } else {
            t = s;
        }

        t_clamped = Math.min(Math.max(t, 0), 1);
        t_clamped_co = 1 - t_clamped;
        return [
            1,
            t_clamped_co * end0[0] + t_clamped * end1[0],
            t_clamped_co * end0[1] + t_clamped * end1[1],
            t_clamped_co * end0[2] + t_clamped * end1[2]
        ];
    },

    /**
     * Project a 2D coordinate to a new 3D position by keeping
     * the 3D x, y coordinates and changing only the z coordinate.
     * All horizontal moves of the 2D point are ignored.
     *
     * @param {JXG.Point} point2d
     * @param {Array} base_c3d
     * @returns {Array} of length 4 containing the projected
     * point in homogeneous coordinates.
     */
    project2DTo3DVertical: function (point2d, base_c3d) {
        var pScr = point2d.coords.usrCoords.slice(1, 3),
            end0 = [base_c3d[1], base_c3d[2], this.bbox3D[2][0]],
            end1 = [base_c3d[1], base_c3d[2], this.bbox3D[2][1]];

        return this.projectScreenToSegment(pScr, end0, end1);
    },

    /**
     * Limit 3D coordinates to the bounding cube.
     *
     * @param {Array} c3d 3D coordinates [x,y,z]
     * @returns Array [Array, Boolean] containing [coords, corrected]. coords contains the updated 3D coordinates,
     * correct is true if the coords have been changed.
     */
    project3DToCube: function (c3d) {
        var cube = this.bbox3D,
            isOut = false;

        if (c3d[1] < cube[0][0]) {
            c3d[1] = cube[0][0];
            isOut = true;
        }
        if (c3d[1] > cube[0][1]) {
            c3d[1] = cube[0][1];
            isOut = true;
        }
        if (c3d[2] < cube[1][0]) {
            c3d[2] = cube[1][0];
            isOut = true;
        }
        if (c3d[2] > cube[1][1]) {
            c3d[2] = cube[1][1];
            isOut = true;
        }
        if (c3d[3] <= cube[2][0]) {
            c3d[3] = cube[2][0];
            isOut = true;
        }
        if (c3d[3] >= cube[2][1]) {
            c3d[3] = cube[2][1];
            isOut = true;
        }

        return [c3d, isOut];
    },

    /**
     * Intersect a ray with the bounding cube of the 3D view.
     * @param {Array} p 3D coordinates [w,x,y,z]
     * @param {Array} dir 3D direction vector of the line (array of length 3 or 4)
     * @param {Number} r direction of the ray (positive if r > 0, negative if r < 0).
     * @returns Affine ratio of the intersection of the line with the cube.
     */
    intersectionLineCube: function (p, dir, r) {
        var r_n, i, r0, r1, d;

        d = (dir.length === 3) ? dir : dir.slice(1);

        r_n = r;
        for (i = 0; i < 3; i++) {
            if (d[i] !== 0) {
                r0 = (this.bbox3D[i][0] - p[i + 1]) / d[i];
                r1 = (this.bbox3D[i][1] - p[i + 1]) / d[i];
                if (r < 0) {
                    r_n = Math.max(r_n, Math.min(r0, r1));
                } else {
                    r_n = Math.min(r_n, Math.max(r0, r1));
                }
            }
        }
        return r_n;
    },

    /**
     * Test if coordinates are inside of the bounding cube.
     * @param {array} p 3D coordinates [[w],x,y,z] of a point.
     * @returns Boolean
     */
    isInCube: function (p, polyhedron) {
        var q;
        if (p.length === 4) {
            if (p[0] === 0) {
                return false;
            }
            q = p.slice(1);
        }
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
     * @param {Number} d Right hand side of Hesse normal for plane2 (it can be adjusted)
     * @returns {Array} of length 2 containing the coordinates of the defining points of
     * of the intersection segment, or false if there is no intersection
     */
    intersectionPlanePlane: function (plane1, plane2, d) {
        var ret = [false, false],
            p, q, r, w,
            dir;

        d = d || plane2.d;

        // Get one point of the intersection of the two planes
        w = Mat.crossProduct(plane1.normal.slice(1), plane2.normal.slice(1));
        w.unshift(0);

        p = Mat.Geometry.meet3Planes(
            plane1.normal,
            plane1.d,
            plane2.normal,
            d,
            w,
            0
        );

        // Get the direction of the intersecting line of the two planes
        dir = Mat.Geometry.meetPlanePlane(
            plane1.vec1,
            plane1.vec2,
            plane2.vec1,
            plane2.vec2
        );

        // Get the bounding points of the intersecting segment
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

    intersectionPlaneFace: function (plane, face) {
        var ret = [],
            j, t,
            p, crds,
            p1, p2, c,
            f, le, x1, y1, x2, y2,
            dir, vec, w,
            mat = [], b = [], sol;

        w = Mat.crossProduct(plane.normal.slice(1), face.normal.slice(1));
        w.unshift(0);

        // Get one point of the intersection of the two planes
        p = Geometry.meet3Planes(
            plane.normal,
            plane.d,
            face.normal,
            face.d,
            w,
            0
        );

        // Get the direction the intersecting line of the two planes
        dir = Geometry.meetPlanePlane(
            plane.vec1,
            plane.vec2,
            face.vec1,
            face.vec2
        );

        f = face.polyhedron.faces[face.faceNumber];
        crds = face.polyhedron.coords;
        le = f.length;
        for (j = 1; j <= le; j++) {
            p1 = crds[f[j - 1]];
            p2 = crds[f[j % le]];
            vec = [0, p2[1] - p1[1], p2[2] - p1[2], p2[3] - p1[3]];

            x1 = Math.random();
            y1 = Math.random();
            x2 = Math.random();
            y2 = Math.random();
            mat = [
                [x1 * dir[1] + y1 * dir[3], x1 * (-vec[1]) + y1 * (-vec[3])],
                [x2 * dir[2] + y2 * dir[3], x2 * (-vec[2]) + y2 * (-vec[3])]
            ];
            b = [
                x1 * (p1[1] - p[1]) + y1 * (p1[3] - p[3]),
                x2 * (p1[2] - p[2]) + y2 * (p1[3] - p[3])
            ];

            sol = Numerics.Gauss(mat, b);
            t = sol[1];
            if (t > -Mat.eps && t < 1 + Mat.eps) {
                c = [1, p1[1] + t * vec[1], p1[2] + t * vec[2], p1[3] + t * vec[3]];
                ret.push(c);
            }
        }

        return ret;
    },

    // TODO:
    // - handle non-closed polyhedra
    // - handle intersections in vertex, edge, plane
    intersectionPlanePolyhedron: function(plane, phdr) {
        var i, j, seg,
            p, first, pos, pos_akt,
            eps = 1e-12,
            points = [],
            x = [],
            y = [],
            z = [];

        for (i = 0; i < phdr.numberFaces; i++) {
            if (phdr.def.faces[i].length < 3) {
                // We skip intersection with points or lines
                continue;
            }

            // seg will be an array consisting of two points
            // that span the intersecting segment of the plane
            // and the face.
            seg = this.intersectionPlaneFace(plane, phdr.faces[i]);

            // Plane intersects the face in less than 2 points
            if (seg.length < 2) {
                continue;
            }

            if (seg[0].length === 4 && seg[1].length === 4) {
                // This test is necessary to filter out intersection lines which are
                // identical to intersections of axis planes (they would occur twice),
                // i.e. edges of bbox3d.
                for (j = 0; j < points.length; j++) {
                    if (
                        (Geometry.distance(seg[0], points[j][0], 4) < eps &&
                            Geometry.distance(seg[1], points[j][1], 4) < eps) ||
                        (Geometry.distance(seg[0], points[j][1], 4) < eps &&
                            Geometry.distance(seg[1], points[j][0], 4) < eps)
                    ) {
                        break;
                    }
                }
                if (j === points.length) {
                    points.push(seg.slice());
                }
            }
        }

        // Handle the case that the intersection is the empty set.
        if (points.length === 0) {
            return { X: x, Y: y, Z: z };
        }

        // Concatenate the intersection points to a polygon.
        // If all went well, each intersection should appear
        // twice in the list.
        // __Attention:__ each face has to be planar!!!
        // Otherwise the algorithm will fail.
        first = 0;
        pos = first;
        i = 0;
        do {
            p = points[pos][i];
            if (p.length === 4) {
                x.push(p[1]);
                y.push(p[2]);
                z.push(p[3]);
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
                console.log('Error face3d intersection update: did not find next', pos, i);
                break;
            }
        } while (pos !== first);
        x.push(x[0]);
        y.push(y[0]);
        z.push(z[0]);

        return { X: x, Y: y, Z: z };
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
     *      var steps_u = this.evalVisProp('stepsu'),
     *           steps_v = this.evalVisProp('stepsv'),
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
            steps_u = Type.evaluate(interval_u[2]),
            steps_v = Type.evaluate(interval_v[2]),
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
        this.board._change3DView = true;
        this.board.update();
        this.board._change3DView = false;

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
        if (!this.evalVisProp('verticaldrag.enabled')) {
            return false;
        }
        key = '_' + this.evalVisProp('verticaldrag.key') + 'Key';
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
        var views = this.evalVisProp('values'),
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
        var views = this.evalVisProp('values'),
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
        var views = this.evalVisProp('values');

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
            speed = (smax - smin) / this.board.canvasWidth * (this.evalVisProp('az.pointer.speed')),
            delta = evt.movementX,
            az = this.az_slide.Value(),
            el = this.el_slide.Value();

        // Doesn't allow navigation if another moving event is triggered
        if (this.board.mode === this.board.BOARD_MODE_DRAG) {
            return this;
        }

        // Calculate new az value if keyboard events are triggered
        // Plus if right-button, minus if left-button
        if (this.evalVisProp('az.keyboard.enabled')) {
            if (evt.key === 'ArrowRight') {
                az = az + this.evalVisProp('az.keyboard.step') * Math.PI / 180;
            } else if (evt.key === 'ArrowLeft') {
                az = az - this.evalVisProp('az.keyboard.step') * Math.PI / 180;
            }
        }

        if (this.evalVisProp('az.pointer.enabled') && (delta !== 0) && evt.key == null) {
            az += delta * speed;
        }

        // Project the calculated az value to a usable value in the interval [smin,smax]
        // Use modulo if continuous is true
        if (this.evalVisProp('az.continuous')) {
            az = Mat.wrap(az, smin, smax);
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
            speed = (smax - smin) / this.board.canvasHeight * this.evalVisProp('el.pointer.speed'),
            delta = evt.movementY,
            az = this.az_slide.Value(),
            el = this.el_slide.Value();

        // Doesn't allow navigation if another moving event is triggered
        if (this.board.mode === this.board.BOARD_MODE_DRAG) {
            return this;
        }

        // Calculate new az value if keyboard events are triggered
        // Plus if down-button, minus if up-button
        if (this.evalVisProp('el.keyboard.enabled')) {
            if (evt.key === 'ArrowUp') {
                el = el - this.evalVisProp('el.keyboard.step') * Math.PI / 180;
            } else if (evt.key === 'ArrowDown') {
                el = el + this.evalVisProp('el.keyboard.step') * Math.PI / 180;
            }
        }

        if (this.evalVisProp('el.pointer.enabled') && (delta !== 0) && evt.key == null) {
            el += delta * speed;
        }

        // Project the calculated el value to a usable value in the interval [smin,smax]
        // Use modulo if continuous is true and the trackball is disabled
        if (this.evalVisProp('el.continuous') && !this.trackballEnabled) {
            el = Mat.wrap(el, smin, smax);
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

    /**
     * Controls the navigation in bank direction using either the keyboard or a pointer.
     *
     * @private
     *
     * @param {event} evt either the keydown or the pointer event
     * @returns view
     */
    _bankEventHandler: function (evt) {
        var smax = this.bank_slide._smax,
            smin = this.bank_slide._smin,
            step, speed,
            delta = evt.deltaY,
            bank = this.bank_slide.Value();

        // Doesn't allow navigation if another moving event is triggered
        if (this.board.mode === this.board.BOARD_MODE_DRAG) {
            return this;
        }

        // Calculate new bank value if keyboard events are triggered
        // Plus if down-button, minus if up-button
        if (this.evalVisProp('bank.keyboard.enabled')) {
            step = this.evalVisProp('bank.keyboard.step') * Math.PI / 180;
            if (evt.key === '.' || evt.key === '<') {
                bank -= step;
            } else if (evt.key === ',' || evt.key === '>') {
                bank += step;
            }
        }

        if (this.evalVisProp('bank.pointer.enabled') && (delta !== 0) && evt.key == null) {
            speed = (smax - smin) / this.board.canvasHeight * this.evalVisProp('bank.pointer.speed');
            bank += delta * speed;

            // prevent the pointer wheel from scrolling the page
            evt.preventDefault();
        }

        // Project the calculated bank value to a usable value in the interval [smin,smax]
        if (this.evalVisProp('bank.continuous')) {
            // in continuous mode, wrap value around slider range
            bank = Mat.wrap(bank, smin, smax);
        } else {
            // in non-continuous mode, clamp value to slider range
            bank = Mat.clamp(bank, smin, smax);
        }

        this.bank_slide.setValue(bank);
        this.board.update();
        return this;
    },

    /**
     * Controls the navigation using either virtual trackball.
     *
     * @private
     *
     * @param {event} evt either the keydown or the pointer event
     * @returns view
     */
    _trackballHandler: function (evt) {
        var pos = this.board.getMousePosition(evt),
            x, y, center;

        center = new Coords(Const.COORDS_BY_USER, [this.llftCorner[0] + this.size[0] * 0.5, this.llftCorner[1] + this.size[1] * 0.5], this.board);
        x = pos[0] - center.scrCoords[1];
        y = pos[1] - center.scrCoords[2];
        this._trackball = {
            dx: evt.movementX,
            dy: -evt.movementY,
            x: x,
            y: -y
        };
        this.board.update();
        return this;
    },

    /**
     * Event handler for pointer down event. Triggers handling of all 3D navigation.
     *
     * @private
     * @param {event} evt
     * @returns view
     */
    pointerDownHandler: function (evt) {
        var neededButton, neededKey, target;

        this._hasMoveAz = false;
        this._hasMoveEl = false;
        this._hasMoveBank = false;
        this._hasMoveTrackball = false;

        if (this.board.mode !== this.board.BOARD_MODE_NONE) {
            return;
        }

        this.board._change3DView = true;

        if (this.evalVisProp('trackball.enabled')) {
            neededButton = this.evalVisProp('trackball.button');
            neededKey = this.evalVisProp('trackball.key');

            // Move events for virtual trackball
            if (
                (neededButton === -1 || neededButton === evt.button) &&
                (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
            ) {
                // If outside is true then the event listener is bound to the document, otherwise to the div
                target = (this.evalVisProp('trackball.outside')) ? document : this.board.containerObj;
                Env.addEvent(target, 'pointermove', this._trackballHandler, this);
                this._hasMoveTrackball = true;
            }
        } else {
            if (this.evalVisProp('az.pointer.enabled')) {
                neededButton = this.evalVisProp('az.pointer.button');
                neededKey = this.evalVisProp('az.pointer.key');

                // Move events for azimuth
                if (
                    (neededButton === -1 || neededButton === evt.button) &&
                    (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                ) {
                    // If outside is true then the event listener is bound to the document, otherwise to the div
                    target = (this.evalVisProp('az.pointer.outside')) ? document : this.board.containerObj;
                    Env.addEvent(target, 'pointermove', this._azEventHandler, this);
                    this._hasMoveAz = true;
                }
            }

            if (this.evalVisProp('el.pointer.enabled')) {
                neededButton = this.evalVisProp('el.pointer.button');
                neededKey = this.evalVisProp('el.pointer.key');

                // Events for elevation
                if (
                    (neededButton === -1 || neededButton === evt.button) &&
                    (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                ) {
                    // If outside is true then the event listener is bound to the document, otherwise to the div
                    target = (this.evalVisProp('el.pointer.outside')) ? document : this.board.containerObj;
                    Env.addEvent(target, 'pointermove', this._elEventHandler, this);
                    this._hasMoveEl = true;
                }
            }

            if (this.evalVisProp('bank.pointer.enabled')) {
                neededButton = this.evalVisProp('bank.pointer.button');
                neededKey = this.evalVisProp('bank.pointer.key');

                // Events for bank
                if (
                    (neededButton === -1 || neededButton === evt.button) &&
                    (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && evt.shiftKey) || (neededKey.indexOf('ctrl') > -1 && evt.ctrlKey))
                ) {
                    // If `outside` is true, we bind the event listener to
                    // the document. otherwise, we bind it to the div. we
                    // register the event listener as active so it can
                    // prevent the pointer wheel from scrolling the page
                    target = (this.evalVisProp('bank.pointer.outside')) ? document : this.board.containerObj;
                    Env.addEvent(target, 'wheel', this._bankEventHandler, this, { passive: false });
                    this._hasMoveBank = true;
                }
            }
        }
        Env.addEvent(document, 'pointerup', this.pointerUpHandler, this);
    },

    /**
     * Event handler for pointer up event. Triggers handling of all 3D navigation.
     *
     * @private
     * @param {event} evt
     * @returns view
     */
    pointerUpHandler: function (evt) {
        var target;

        if (this._hasMoveAz) {
            target = (this.evalVisProp('az.pointer.outside')) ? document : this.board.containerObj;
            Env.removeEvent(target, 'pointermove', this._azEventHandler, this);
            this._hasMoveAz = false;
        }
        if (this._hasMoveEl) {
            target = (this.evalVisProp('el.pointer.outside')) ? document : this.board.containerObj;
            Env.removeEvent(target, 'pointermove', this._elEventHandler, this);
            this._hasMoveEl = false;
        }
        if (this._hasMoveBank) {
            target = (this.evalVisProp('bank.pointer.outside')) ? document : this.board.containerObj;
            Env.removeEvent(target, 'wheel', this._bankEventHandler, this);
            this._hasMoveBank = false;
        }
        if (this._hasMoveTrackball) {
            target = (this.evalVisProp('trackball.outside')) ? document : this.board.containerObj;
            Env.removeEvent(target, 'pointermove', this._trackballHandler, this);
            this._hasMoveTrackball = false;
        }
        Env.removeEvent(document, 'pointerup', this.pointerUpHandler, this);
        this.board._change3DView = false;

    }
});

/**
 * @class A View3D element provides the container and the methods to create and display 3D elements.
 * @pseudo
 * @description  A View3D element provides the container and the methods to create and display 3D elements.
 * It is contained in a JSXGraph board.
 * <p>
 * It is advisable to disable panning of the board by setting the board attribute "pan":
 * <pre>
 *   pan: {enabled: false}
 * </pre>
 * Otherwise users will not be able to rotate the scene with their fingers on a touch device.
 * <p>
 * The start position of the camera can be adjusted by the attributes {@link View3D#az}, {@link View3D#el}, and {@link View3D#bank}.
 *
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
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'parallel',
 *             trackball: {enabled:true},
 *         });
 *
 *     var curve = view.create('curve3d', [
 *         (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *         (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *         (t) => Math.sin(3 * t),
 *         [-Math.PI, Math.PI]
 *     ], { strokeWidth: 4 });
 *
 * </pre><div id="JXG9b327a6c-1bd6-4e40-a502-59d024dbfd1b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG9b327a6c-1bd6-4e40-a502-59d024dbfd1b',
 *             {boundingbox: [-8, 8, 8,-8], pan: {enabled: false}, axis: false, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'parallel',
 *                 trackball: {enabled:true},
 *             });
 *
 *         var curve = view.create('curve3d', [
 *             (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *             (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *             (t) => Math.sin(3 * t),
 *             [-Math.PI, Math.PI]
 *         ], { strokeWidth: 4 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central',
 *             trackball: {enabled:true},
 *
 *             xPlaneRear: { visible: false },
 *             yPlaneRear: { visible: false }
 *
 *         });
 *
 *     var curve = view.create('curve3d', [
 *         (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *         (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *         (t) => Math.sin(3 * t),
 *         [-Math.PI, Math.PI]
 *     ], { strokeWidth: 4 });
 *
 * </pre><div id="JXG0dc2493d-fb2f-40d5-bdb8-762ba0ad2007" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG0dc2493d-fb2f-40d5-bdb8-762ba0ad2007',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'central',
 *                 trackball: {enabled:true},
 *
 *                 xPlaneRear: { visible: false },
 *                 yPlaneRear: { visible: false }
 *
 *             });
 *
 *         var curve = view.create('curve3d', [
 *             (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *             (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *             (t) => Math.sin(3 * t),
 *             [-Math.PI, Math.PI]
 *         ], { strokeWidth: 4 });
 *
 *     })();
 *
 * </script><pre>
 *
* @example
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central',
 *             trackball: {enabled:true},
 *
 *             // Main axes
 *             axesPosition: 'border',
 *
 *             // Axes at the border
 *             xAxisBorder: { ticks3d: { ticksDistance: 2} },
 *             yAxisBorder: { ticks3d: { ticksDistance: 2} },
 *             zAxisBorder: { ticks3d: { ticksDistance: 2} },
 *
 *             // No axes on planes
 *             xPlaneRearYAxis: {visible: false},
 *             xPlaneRearZAxis: {visible: false},
 *             yPlaneRearXAxis: {visible: false},
 *             yPlaneRearZAxis: {visible: false},
 *             zPlaneRearXAxis: {visible: false},
 *             zPlaneRearYAxis: {visible: false}
 *         });
 *
 *     var curve = view.create('curve3d', [
 *         (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *         (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *         (t) => Math.sin(3 * t),
 *         [-Math.PI, Math.PI]
 *     ], { strokeWidth: 4 });
 *
 * </pre><div id="JXG586f3551-335c-47e9-8d72-835409f6a103" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG586f3551-335c-47e9-8d72-835409f6a103',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'central',
 *                 trackball: {enabled:true},
 *
 *                 // Main axes
 *                 axesPosition: 'border',
 *
 *                 // Axes at the border
 *                 xAxisBorder: { ticks3d: { ticksDistance: 2} },
 *                 yAxisBorder: { ticks3d: { ticksDistance: 2} },
 *                 zAxisBorder: { ticks3d: { ticksDistance: 2} },
 *
 *                 // No axes on planes
 *                 xPlaneRearYAxis: {visible: false},
 *                 xPlaneRearZAxis: {visible: false},
 *                 yPlaneRearXAxis: {visible: false},
 *                 yPlaneRearZAxis: {visible: false},
 *                 zPlaneRearXAxis: {visible: false},
 *                 zPlaneRearYAxis: {visible: false}
 *             });
 *
 *         var curve = view.create('curve3d', [
 *             (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *             (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *             (t) => Math.sin(3 * t),
 *             [-Math.PI, Math.PI]
 *         ], { strokeWidth: 4 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central',
 *             trackball: {enabled:true},
 *
 *             axesPosition: 'none'
 *         });
 *
 *     var curve = view.create('curve3d', [
 *         (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *         (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *         (t) => Math.sin(3 * t),
 *         [-Math.PI, Math.PI]
 *     ], { strokeWidth: 4 });
 *
 * </pre><div id="JXG9a9467e1-f189-4c8c-adb2-d4f49bc7fa26" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG9a9467e1-f189-4c8c-adb2-d4f49bc7fa26',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'central',
 *                 trackball: {enabled:true},
 *
 *                 axesPosition: 'none'
 *             });
 *
 *         var curve = view.create('curve3d', [
 *             (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *             (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *             (t) => Math.sin(3 * t),
 *             [-Math.PI, Math.PI]
 *         ], { strokeWidth: 4 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     var bound = [-4, 6];
 *     var view = board.create('view3d',
 *         [[-4, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central',
 *             trackball: {enabled:true},
 *
 *             // Main axes
 *             axesPosition: 'border',
 *
 *             // Axes at the border
 *             xAxisBorder: { ticks3d: { ticksDistance: 2} },
 *             yAxisBorder: { ticks3d: { ticksDistance: 2} },
 *             zAxisBorder: { ticks3d: { ticksDistance: 2} },
 *
 *             xPlaneRear: {
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *             yPlaneRear: {
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *             zPlaneRear: {
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *             xPlaneFront: {
 *                 visible: true,
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *             yPlaneFront: {
 *                 visible: true,
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *             zPlaneFront: {
 *                 visible: true,
 *                 fillColor: '#fff',
 *                 mesh3d: {visible: false}
 *             },
 *
 *             // No axes on planes
 *             xPlaneRearYAxis: {visible: false},
 *             xPlaneRearZAxis: {visible: false},
 *             yPlaneRearXAxis: {visible: false},
 *             yPlaneRearZAxis: {visible: false},
 *             zPlaneRearXAxis: {visible: false},
 *             zPlaneRearYAxis: {visible: false},
 *             xPlaneFrontYAxis: {visible: false},
 *             xPlaneFrontZAxis: {visible: false},
 *             yPlaneFrontXAxis: {visible: false},
 *             yPlaneFrontZAxis: {visible: false},
 *             zPlaneFrontXAxis: {visible: false},
 *             zPlaneFrontYAxis: {visible: false}
 *
 *         });
 *
 *     var curve = view.create('curve3d', [
 *         (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *         (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *         (t) => Math.sin(3 * t),
 *         [-Math.PI, Math.PI]
 *     ], { strokeWidth: 4 });
 *
 * </pre><div id="JXGbd41a4e3-1bf7-4764-b675-98b01667103b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGbd41a4e3-1bf7-4764-b675-98b01667103b',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var bound = [-4, 6];
 *         var view = board.create('view3d',
 *             [[-4, -3], [8, 8],
 *             [bound, bound, bound]],
 *             {
 *                 projection: 'central',
 *                 trackball: {enabled:true},
 *
 *                 // Main axes
 *                 axesPosition: 'border',
 *
 *                 // Axes at the border
 *                 xAxisBorder: { ticks3d: { ticksDistance: 2} },
 *                 yAxisBorder: { ticks3d: { ticksDistance: 2} },
 *                 zAxisBorder: { ticks3d: { ticksDistance: 2} },
 *
 *                 xPlaneRear: {
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *                 yPlaneRear: {
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *                 zPlaneRear: {
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *                 xPlaneFront: {
 *                     visible: true,
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *                 yPlaneFront: {
 *                     visible: true,
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *                 zPlaneFront: {
 *                     visible: true,
 *                     fillColor: '#fff',
 *                     mesh3d: {visible: false}
 *                 },
 *
 *                 // No axes on planes
 *                 xPlaneRearYAxis: {visible: false},
 *                 xPlaneRearZAxis: {visible: false},
 *                 yPlaneRearXAxis: {visible: false},
 *                 yPlaneRearZAxis: {visible: false},
 *                 zPlaneRearXAxis: {visible: false},
 *                 zPlaneRearYAxis: {visible: false},
 *                 xPlaneFrontYAxis: {visible: false},
 *                 xPlaneFrontZAxis: {visible: false},
 *                 yPlaneFrontXAxis: {visible: false},
 *                 yPlaneFrontZAxis: {visible: false},
 *                 zPlaneFrontXAxis: {visible: false},
 *                 zPlaneFrontYAxis: {visible: false}
 *
 *             });
 *
 *         var curve = view.create('curve3d', [
 *             (t) => (2 + Math.cos(3 * t)) * Math.cos(2 * t),
 *             (t) => (2 + Math.cos(3 * t)) * Math.sin(2 * t),
 *             (t) => Math.sin(3 * t),
 *             [-Math.PI, Math.PI]
 *         ], { strokeWidth: 4 });
 *     })();
 *
 * </script><pre>
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
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
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
 * @example
 * var bound = [-5, 5];
 * var view = board.create('view3d',
 *     [[-6, -3], [8, 8],
 *     [bound, bound, bound]],
 *     {
 *         projection: 'central',
 *         az: {
 *             slider: {
 *                 visible: true,
 *                 point1: {
 *                     pos: [5, -4]
 *                 },
 *                 point2: {
 *                     pos: [5, 4]
 *                 },
 *                 label: {anchorX: 'middle'}
 *             }
 *         },
 *         el: {
 *             slider: {
 *                 visible: true,
 *                 point1: {
 *                     pos: [6, -5]
 *                 },
 *                 point2: {
 *                     pos: [6, 3]
 *                 },
 *                 label: {anchorX: 'middle'}
 *             }
 *         },
 *         bank: {
 *             slider: {
 *                 visible: true,
 *                 point1: {
 *                     pos: [7, -6]
 *                 },
 *                 point2: {
 *                     pos: [7, 2]
 *                 },
 *                 label: {anchorX: 'middle'}
 *             }
 *         }
 *     });
 *
 *
 * </pre><div id="JXGe181cc55-271b-419b-84fd-622326fd1d1a" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGe181cc55-271b-419b-84fd-622326fd1d1a',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var bound = [-5, 5];
 *     var view = board.create('view3d',
 *         [[-6, -3], [8, 8],
 *         [bound, bound, bound]],
 *         {
 *             projection: 'central',
 *             az: {
 *                 slider: {
 *                     visible: true,
 *                     point1: {
 *                         pos: [5, -4]
 *                     },
 *                     point2: {
 *                         pos: [5, 4]
 *                     },
 *                     label: {anchorX: 'middle'}
 *                 }
 *             },
 *             el: {
 *                 slider: {
 *                     visible: true,
 *                     point1: {
 *                         pos: [6, -5]
 *                     },
 *                     point2: {
 *                         pos: [6, 3]
 *                     },
 *                     label: {anchorX: 'middle'}
 *                 }
 *             },
 *             bank: {
 *                 slider: {
 *                     visible: true,
 *                     point1: {
 *                         pos: [7, -6]
 *                     },
 *                     point2: {
 *                         pos: [7, 2]
 *                     },
 *                     label: {anchorX: 'middle'}
 *                 }
 *             }
 *         });
 *
 *
 *     })();
 *
 * </script><pre>
 *
 *
 */
JXG.createView3D = function (board, parents, attributes) {
    var view, attr, attr_az, attr_el, attr_bank,
        x, y, w, h,
        p1, p2, v,
        coords = parents[0], // llft corner
        size = parents[1]; // [w, h]

    attr = Type.copyAttributes(attributes, board.options, 'view3d');
    view = new JXG.View3D(board, parents, attr);
    view.defaultAxes = view.create('axes3d', [], attr);

    x = coords[0];
    y = coords[1];
    w = size[0];
    h = size[1];

    attr_az = Type.copyAttributes(attr, board.options, 'view3d', 'az', 'slider');
    attr_az.name = 'az';

    attr_el = Type.copyAttributes(attr, board.options, 'view3d', 'el', 'slider');
    attr_el.name = 'el';

    attr_bank = Type.copyAttributes(attr, board.options, 'view3d', 'bank', 'slider');
    attr_bank.name = 'bank';

    v = Type.evaluate(attr_az.point1.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p1 = [x - 1, y - 2];
    } else {
        p1 = v;
    }
    v = Type.evaluate(attr_az.point2.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p2 = [x + w + 1, y - 2];
    } else {
        p2 = v;
    }

    /**
     * Slider to adapt azimuth angle
     * @name JXG.View3D#az_slide
     * @type {Slider}
     */
    view.az_slide = board.create(
        'slider',
        [
            p1, p2,
            [
                Type.evaluate(attr_az.min),
                Type.evaluate(attr_az.start),
                Type.evaluate(attr_az.max)
            ]
        ],
        attr_az
    );
    view.inherits.push(view.az_slide);
    view.az_slide.elType = 'view3d_slider'; // Used in board.prepareUpdate()

    v = Type.evaluate(attr_el.point1.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p1 = [x - 1, y];
    } else {
        p1 = v;
    }
    v = Type.evaluate(attr_el.point2.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p2 = [x - 1, y + h];
    } else {
        p2 = v;
    }

    /**
     * Slider to adapt elevation angle
     *
     * @name JXG.View3D#el_slide
     * @type {Slider}
     */
    view.el_slide = board.create(
        'slider',
        [
            p1, p2,
            [
                Type.evaluate(attr_el.min),
                Type.evaluate(attr_el.start),
                Type.evaluate(attr_el.max)]
        ],
        attr_el
    );
    view.inherits.push(view.el_slide);
    view.el_slide.elType = 'view3d_slider'; // Used in board.prepareUpdate()

    v = Type.evaluate(attr_bank.point1.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p1 = [x - 1, y + h + 2];
    } else {
        p1 = v;
    }
    v = Type.evaluate(attr_bank.point2.pos);
    if (!Type.isArray(v)) {
        // 'auto'
        p2 = [x + w + 1, y + h + 2];
    } else {
        p2 = v;
    }

    /**
     * Slider to adjust bank angle
     *
     * @name JXG.View3D#bank_slide
     * @type {Slider}
     */
    view.bank_slide = board.create(
        'slider',
        [
            p1, p2,
            [
                Type.evaluate(attr_bank.min),
                Type.evaluate(attr_bank.start),
                Type.evaluate(attr_bank.max)
            ]
        ],
        attr_bank
    );
    view.inherits.push(view.bank_slide);
    view.bank_slide.elType = 'view3d_slider'; // Used in board.prepareUpdate()

    // Set special infobox attributes of view3d.infobox
    // Using setAttribute() is not possible here, since we have to
    // avoid a call of board.update().
    // The drawback is that we can not use shortcuts
    view.board.infobox.visProp = Type.merge(view.board.infobox.visProp, attr.infobox);

    // 3d infobox: drag direction and coordinates
    view.board.highlightInfobox = function (x, y, el) {
        var d, i, c3d, foot,
            pre = '',
            brd = el.board,
            arr, infobox,
            p = null;

        if (this.mode === this.BOARD_MODE_DRAG) {
            // Drag direction is only shown during dragging
            if (view.isVerticalDrag()) {
                pre = '<span style="color:black; font-size:200%">\u21C5 &nbsp;</span>';
            } else {
                pre = '<span style="color:black; font-size:200%">\u21C4 &nbsp;</span>';
            }
        }

        // Search 3D parent
        for (i = 0; i < el.parents.length; i++) {
            p = brd.objects[el.parents[i]];
            if (p.is3D) {
                break;
            }
        }

        if (p && Type.exists(p.element2D)) {
            foot = [1, 0, 0, p.coords[3]];
            view._w0 = Mat.innerProduct(view.matrix3D[0], foot, 4);

            c3d = view.project2DTo3DPlane(p.element2D, [1, 0, 0, 1], foot);
            if (!view.isInCube(c3d)) {
                view.board.highlightCustomInfobox('', p);
                return;
            }
            d = p.evalVisProp('infoboxdigits');
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
        var neededKey,
            catchEvt = false;

        // this.board._change3DView = true;
        if (view.evalVisProp('el.keyboard.enabled') &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
        ) {
            neededKey = view.evalVisProp('el.keyboard.key');
            if (neededKey === 'none' ||
                (neededKey.indexOf('shift') > -1 && event.shiftKey) ||
                (neededKey.indexOf('ctrl') > -1 && event.ctrlKey)) {
                view._elEventHandler(event);
                catchEvt = true;
            }

        }

        if (view.evalVisProp('az.keyboard.enabled') &&
            (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        ) {
            neededKey = view.evalVisProp('az.keyboard.key');
            if (neededKey === 'none' ||
                (neededKey.indexOf('shift') > -1 && event.shiftKey) ||
                (neededKey.indexOf('ctrl') > -1 && event.ctrlKey)
            ) {
                view._azEventHandler(event);
                catchEvt = true;
            }
        }

        if (view.evalVisProp('bank.keyboard.enabled') && (event.key === ',' || event.key === '<' || event.key === '.' || event.key === '>')) {
            neededKey = view.evalVisProp('bank.keyboard.key');
            if (neededKey === 'none' || (neededKey.indexOf('shift') > -1 && event.shiftKey) || (neededKey.indexOf('ctrl') > -1 && event.ctrlKey)) {
                view._bankEventHandler(event);
                catchEvt = true;
            }
        }

        if (event.key === 'PageUp') {
            view.nextView();
            catchEvt = true;
        } else if (event.key === 'PageDown') {
            view.previousView();
            catchEvt = true;
        }

        if (catchEvt) {
            // We stop event handling only in the case if the keypress could be
            // used for the 3D view. If this is not done, input fields et al
            // can not be used any more.
            event.preventDefault();
        }
        this.board._change3DView = false;

    }, view);

    // Add events for the pointer navigation
    Env.addEvent(board.containerObj, 'pointerdown', view.pointerDownHandler, view);

    // Initialize view rotation matrix
    view.getAnglesFromSliders();
    view.matrix3DRot = view.getRotationFromAngles();

    // override angle slider bounds when trackball navigation is enabled
    view.updateAngleSliderBounds();

    view.board.update();

    return view;
};

JXG.registerElement("view3d", JXG.createView3D);

export default JXG.View3D;
