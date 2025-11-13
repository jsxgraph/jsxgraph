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

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";
import Mat from '../math/math.js';
import Geometry from '../math/geometry.js';

/**
 * In 3D space, a circle consists of all points on a given plane with a given distance from a given point. The given point is called the center, and the given distance is called the radius.
 * A circle can be constructed by providing a center, a normal vector, and a radius (given as a number or function).
 * @class Creates a new 3D circle object. Do not use this constructor to create a 3D circle. Use {@link JXG.View3D#create} with
 * type {@link Circle3D} instead.
 * @constructor
 * @augments JXG.Curve3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the circle is drawn on.
 * @param {JXG.Point} center The center of the circle.
 * @param {Array} normal A normal vector of the plane the circle lies in. Must be either an array of three numbers or an array of three functions returning numbers.
 * @param {Number|Function} radius The radius of the circle.
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Circle3D = function (view, center, normal, radius, attributes) {
    var altFrame1, that;

    this.constructor(view.board, attributes, Const.OBJECT_TYPE_CIRCLE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'circle3d');

    /**
     * The circle's center. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type JXG.Point3D
     */
    this.center = this.board.select(center);

    this.normalFunc = normal;

    /**
     * A normal vector of the plane the circle lies in. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type Array
     * @private
     *
     * @see updateNormal
     */
    this.normal = [0, 0, 0, 0];

    /**
     * The circle's underlying Curve3D.
     */
    this.curve;

    /**
     * The first vector in an orthonormal frame for the plane the circle lies in.
     * Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type Array
     * @private
     *
     * @see updateFrame
     */
    this.frame1;

    /**
     * The second vector in an orthonormal frame for the plane the circle lies in.
     * Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type Array
     * @private
     *
     * @see updateFrame
     */
    this.frame2;

    // place the circle or its center---whichever is newer---in the scene tree
    if (Type.exists(this.center._is_new)) {
        this.addChild(this.center);
        delete this.center._is_new;
    } else {
        this.center.addChild(this);
    }

    // Converts JessieCode syntax into JavaScript syntax and generally ensures that the radius is a function
    this.updateRadius = Type.createFunction(radius, this.board);
    this.addParentsFromJCFunctions([this.updateRadius]);

    // initialize normal
    this.updateNormal();

    // initialize the first frame vector by taking the cross product with
    // [1, 0, 0] or [-0.5, sqrt(3)/2, 0]---whichever is further away on the unit
    // sphere. every vector is at least 60 degrees from one of these, which
    // should be good enough to make the frame vector numerically accurate
    this.frame1 = Mat.crossProduct(this.normal.slice(1), [1, 0, 0]);
    this.frame1.unshift(0);
    altFrame1 = Mat.crossProduct(this.normal.slice(1), [-0.5, 0.8660254037844386, 0]); // [1/2, sqrt(3)/2, 0]
    altFrame1.unshift(0);
    if (Mat.norm(altFrame1) > Mat.norm(this.frame1)) {
        this.frame1 = altFrame1;
    }

    // initialize the second frame vector
    this.frame2 = Mat.crossProduct(this.normal.slice(1), this.frame1.slice(1));
    this.frame2.unshift(0);

    // scale both frame vectors to unit length
    this.normalizeFrame();

    // create the underlying curve
    that = this;
    this.curve = view.create(
        'curve3d',
        [
            function(t) {
                var r = that.Radius(),
                    s = Math.sin(t),
                    c = Math.cos(t);

                return [
                    that.center.coords[1] + r * (c * that.frame1[1] + s * that.frame2[1]),
                    that.center.coords[2] + r * (c * that.frame1[2] + s * that.frame2[2]),
                    that.center.coords[3] + r * (c * that.frame1[3] + s * that.frame2[3])
                ];
            },
            [0, 2 * Math.PI] // parameter range
        ],
        attributes
    );
};
JXG.Circle3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Circle3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Circle3D.prototype,
    /** @lends JXG.Circle3D.prototype */ {

        // Already documented in element3d.js
        update: function () {
            if (this.needsUpdate) {
                this.updateNormal()
                    .updateFrame();

                this.curve.visProp.visible = !isNaN(this.Radius()); // TODO
            }
            return this;
        },

        // Already documented in element3d.js
        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Set a new radius, then update the board.
         * @param {String|Number|function} r A string, function or number describing the new radius
         * @returns {JXG.Circle3D} Reference to this sphere
         */
        setRadius: function (r) {
            this.updateRadius = Type.createFunction(r, this.board);
            this.addParentsFromJCFunctions([this.updateRadius]);
            this.board.update();

            return this;
        },

        /**
         * Calculates the radius of the circle.
         * @param {String|Number|function} [value] Set new radius
         * @returns {Number} The radius of the circle
         */
        Radius: function (value) {
            if (Type.exists(value)) {
                this.setRadius(value);
                return this.Radius();
            }

            return Math.abs(this.updateRadius());
        },

        normalizeFrame: function () {
            // normalize frame
            var len1 = Mat.norm(this.frame1),
                len2 = Mat.norm(this.frame2),
                i;

            for (i = 0; i < 4; i++) {
                this.frame1[i] /= len1;
                this.frame2[i] /= len2;
            }

            return this;
        },

        updateNormal: function () {
            // evaluate normal direction
            var i, len,
                eps = 1.e-12;

            this.normal = Type.evaluate(this.normalFunc);

            // scale normal to unit length
            len = Mat.norm(this.normal);
            if (Math.abs(len) > eps) {
                for (i = 0; i < 4; i++) {
                    this.normal[i] /= len;
                }
            }

            return this;
        },

        updateFrame: function () {
            this.frame1 = Mat.crossProduct(this.frame2.slice(1), this.normal.slice(1));
            this.frame1.unshift(0);
            this.frame2 = Mat.crossProduct(this.normal.slice(1), this.frame1.slice(1));
            this.frame2.unshift(0);
            this.normalizeFrame();

            return this;
        },

        // Already documented in element3d.js
        projectCoords: function (p, params) {
            // we have to call `this.curve.projectCoords`, i.e. the curve's projectCoords rather
            // than the circle's, to make `this` refer to the curve within the
            // call.
            return this.curve.projectCoords(p, params);
        }

        // projectScreenCoords: function (pScr, params) {
        //     // we have to call `this.curve.projectScreenCoords` from the curve,
        //     // rather than the circle, to make `this` refer to the curve within
        //     // the call
        //     return this.curve.projectScreenCoords(pScr, params);
        // }
    }
);

/**
 * @class A circle in 3D can be defined by various combinations of points and numbers.
 * @pseudo
 * @description In 3D space, a circle consists of all points on a given plane with a given distance from a given point. The given point is called the center, and the given distance is called the radius.
 * A circle can be constructed by providing a center, a normal vector, and a radius (given as a number or function).
 * <p>
 * If the radius has a negative value, its absolute value is taken. If the radius evaluates to NaN,
 * the circle is not displayed. This is convenient for constructing an intersection circle, which is empty when its parents do not intersect.
 * @name Circle3D
 * @augments JXG.Circle3D
 * @constructor
 * @type JXG.Circle3D
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,Array,Function_Array,Function_Number,Function} center,normal,radius The center must be given as a {@link JXG.Point}, array or function (see {@link JXG.providePoints}).
 * The normal vector can be given as an array of four numbers (i.e. homogeneous coordinates [0, x, y, z]) or a function returning an array of length 4
 * and the radius can be given as a number (which will create a circle with a fixed radius) or a function.
 * <p>
 * If the radius is supplied as a number or the output of a function, its absolute value is taken. When the radius evaluates to NaN, the circle does not display.
 */
JXG.createCircle3D = function (board, parents, attributes) {
    var view = parents[0],
        attr = Type.copyAttributes(attributes, board.options, 'circle3d'),
        center = Type.providePoints3D(view, [parents[1]], attributes, 'circle3d', ['point'])[0],
        normal = parents[2],
        radius = parents[3],
        el;

    // Create element
    el = new JXG.Circle3D(view, center, normal, radius, attr);

    // Update scene tree
    el.curve.addParents([el]);
    el.addChild(el.curve);

    el.update();
    return el;
};

JXG.registerElement("circle3d", JXG.createCircle3D);

/**
 * @class The circle that is the intersection of two elements (plane3d or sphere3d) in 3D.
 *
 * @pseudo
 * @name IntersectionCircle3D
 * @augments JXG.Circle3D
 * @constructor
 * @type JXG.Circle3D
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Sphere3D_JXG.Sphere3D|JXG.Plane3D} el1,el2 The result will be the intersection of el1 and el2.
 * @example
 * // Create the intersection circle of two spheres
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
 * var a1 = view.create('point3d', [-1, 0, 0]);
 * var a2 = view.create('point3d', [1, 0, 0]);
 *
 * var s1 = view.create(
 *    'sphere3d',
 *     [a1, 2],
 *     {fillColor: '#00ff80'}
 * );
 * var s2 = view.create(
 *    'sphere3d',
 *     [a2, 2],
 *     {fillColor: '#ff0000'}
 * );
 *
 * var i = view.create('intersectioncircle3d', [s1, s2]);
 *
 * </pre><div id="JXG64ede949-8dd6-44d0-b2a9-248a479d3a5d" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG64ede949-8dd6-44d0-b2a9-248a479d3a5d',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
 *         var view = board.create(
 *            'view3d',
 *            [[-6, -3], [8, 8],
 *            [[0, 3], [0, 3], [0, 3]]],
 *            {
 *                xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *            }
 *        );
 *        var a1 = view.create('point3d', [-1, 0, 0]);
 *        var a2 = view.create('point3d', [1, 0, 0]);
 *
 *        var s1 = view.create(
 *           'sphere3d',
 *            [a1, 2],
 *            {fillColor: '#00ff80'}
 *        );
 *        var p2 = view.create(
 *           'sphere3d',
 *            [a2, 2],
 *            {fillColor: '#ff0000'}
 *        );
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createIntersectionCircle3D = function (board, parents, attributes) {
    var view = parents[0],
        el1 = parents[1],
        el2 = parents[2],
        ixnCircle, center, func,
        attr = Type.copyAttributes(attributes, board.options, 'intersectioncircle3d');

    func = Geometry.intersectionFunction3D(view, el1, el2);
    center = view.create('point3d', func[0], { visible: false });
    ixnCircle = view.create('circle3d', [center, func[1], func[2]], attr);

    try {
        el1.addChild(ixnCircle);
        el2.addChild(ixnCircle);
    } catch (e) {
        throw new Error(
            "JSXGraph: Can't create 'intersection' with parent types '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'."
        );
    }

    ixnCircle.type = Const.OBJECT_TYPE_INTERSECTION_CIRCLE3D;
    ixnCircle.elType = 'intersectioncircle3d';
    ixnCircle.setParents([el1.id, el2.id]);

    return ixnCircle;
};

JXG.registerElement('intersectioncircle3d', JXG.createIntersectionCircle3D);
