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
import GeometryElement from "../base/element";
import Composition from "../base/composition";

/**
 * 3D view inside of a JXGraph board.
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
     * 3D-to-2D transformation matrix
     * @type  {Array} 3 x 4 matrix
     * @private
     */
    this.matrix3D = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0]
    ];

    /**
     * Lower left corner [x, y] of the 3D view if elevation and azimuth are set to 0.
     * @type array
     * @private
     */
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

    this.timeoutAzimuth = null;

    this.id = this.board.setId(this, "V");
    this.board.finalizeAdding(this);
    this.elType = "view3d";

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
            // is3D = false,
            el;

        if (elementType.indexOf("3d") > 0) {
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
        if (Type.isString(s) && s !== "") {
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

    update: function () {
        // Update 3D-to-2D transformation matrix with the actual
        // elevation and azimuth angles.

        var e, r, a, f, mat;

        if (
            !Type.exists(this.el_slide) ||
            !Type.exists(this.az_slide) ||
            !this.needsUpdate
        ) {
            return this;
        }

        e = this.el_slide.Value();
        r = this.r;
        a = this.az_slide.Value();
        f = r * Math.sin(e);
        mat = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];

        this.matrix3D = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0]
        ];

        this.matrix3D[1][1] = r * Math.cos(a);
        this.matrix3D[1][2] = -r * Math.sin(a);
        this.matrix3D[2][1] = f * Math.sin(a);
        this.matrix3D[2][2] = f * Math.cos(a);
        this.matrix3D[2][3] = Math.cos(e);

        mat[1][1] = this.size[0] / (this.bbox3D[0][1] - this.bbox3D[0][0]); // w / d_x
        mat[2][2] = this.size[1] / (this.bbox3D[1][1] - this.bbox3D[1][0]); // h / d_y
        mat[1][0] = this.llftCorner[0] - mat[1][1] * this.bbox3D[0][0]; // llft_x
        mat[2][0] = this.llftCorner[1] - mat[2][2] * this.bbox3D[1][0]; // llft_y
        this.matrix3D = Mat.matMatMult(mat, this.matrix3D);

        return this;
    },

    updateRenderer: function () {
        this.needsUpdate = false;
        return this;
    },

    removeObject: function(object, saveMethod) {
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
            JXG.debug("View3D " + object.id + ": Could not be removed: " + e);
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
        return Mat.matVecMult(this.matrix3D, vec);
    },

    /**
     * Project a 2D coordinate to the plane defined by the point foot
     * and the normal vector `normal`.
     *
     * @param  {JXG.Point} point2d
     * @param  {Array} normal
     * @param  {Array} foot
     * @returns {Array} of length 4 containing the projected
     * point in homogeneous coordinates.
     */
    project2DTo3DPlane: function (point2d, normal, foot) {
        var mat,
            rhs,
            d,
            le,
            n = normal.slice(1),
            sol = [1, 0, 0, 0];

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

        rhs -= m3D[0] * m3D[0] + m3D[1] * coords3D[1] + m3D[2] * coords3D[2];
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
     * @param {Array,Function} func
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

        this.timeoutAzimuth = setTimeout(
            function () {
                this.animateAzimuth();
            }.bind(this),
            200
        );
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
    var view,
        attr,
        x,
        y,
        w,
        h,
        coords = parents[0], // llft corner
        size = parents[1]; // [w, h]

    attr = Type.copyAttributes(attributes, board.options, "view3d");
    view = new JXG.View3D(board, parents, attr);
    view.defaultAxes = view.create("axes3d", parents, attributes);

    x = coords[0];
    y = coords[1];
    w = size[0];
    h = size[1];

    /**
     * Slider to adapt azimuth angle
     * @name JXG.View3D#az_slide
     * @type {Slider}
     */
    view.az_slide = board.create(
        "slider",
        [
            [x - 1, y - 2],
            [x + w + 1, y - 2],
            [0, 1.0, 2 * Math.PI]
        ],
        {
            style: 6,
            name: "az",
            point1: { frozen: true },
            point2: { frozen: true }
        }
    );

    /**
     * Slider to adapt elevation angle
     *
     * @name JXG.View3D#el_slide
     * @type {Slider}
     */
    view.el_slide = board.create(
        "slider",
        [
            [x - 1, y],
            [x - 1, y + h],
            [0, 0.3, Math.PI / 2]
        ],
        {
            style: 6,
            name: "el",
            point1: { frozen: true },
            point2: { frozen: true }
        }
    );

    view.board.highlightInfobox = function (x, y, el) {
        var d, i, c3d, foot,
            pre = '<span style="color:black; font-size:200%">\u21C4 &nbsp;</span>',
            brd = el.board,
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
                view.board.highlightCustomInfobox("", p);
                return;
            }
            d = Type.evaluate(p.visProp.infoboxdigits);
            if (d === "auto") {
                view.board.highlightCustomInfobox(
                    pre +
                    "(" +
                    Type.autoDigits(p.X()) +
                    " | " +
                    Type.autoDigits(p.Y()) +
                    " | " +
                    Type.autoDigits(p.Z()) +
                    ")",
                    p
                );
            } else {
                view.board.highlightCustomInfobox(
                    pre +
                    "(" +
                    Type.toFixed(p.X(), d) +
                    " | " +
                    Type.toFixed(p.Y(), d) +
                    " | " +
                    Type.toFixed(p.Z(), d) +
                    ")",
                    p
                );
            }
        } else {
            view.board.highlightCustomInfobox("(" + x + ", " + y + ")", el);
        }
    };

    view.board.update();

    return view;
};

JXG.registerElement("view3d", JXG.createView3D);

export default JXG.View3D;
