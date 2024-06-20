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
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the circle is drawn on.
 * @param {JXG.Point} center The center of the circle.
 * @param {Array} normal A normal vector of the plane the circle lies in. Must be either an array of three numbers or an array of three functions returning numbers.
 * @param {Number|Function} radius The radius of the circle.
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Circle3D = function (view, center, normal, radius, attributes) {
    var altFrame1;

    this.constructor(view.board, attributes, Const.OBJECT_TYPE_CIRCLE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "circle3d");

    /**
     * The circle's center. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type JXG.Point3D
     */
    this.center = this.board.select(center);

    /**
     * A normal vector of the plane the circle lies in. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type Array
     * @private
     *
     * @see updateNormal
     */
    this.normal = [0, 0, 0];

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

    this.updateNormal = function () {
        // evaluate normal direction
        var i, len;
        for (i = 0; i < 3; i++) {
            this.normal[i] = Type.evaluate(normal[i]);
        }

        // scale normal to unit length
        len = Mat.norm(this.normal);
        if (Math.abs(len) > Mat.eps) {
            for (i = 0; i < 3; i++) {
                this.normal[i] /= len;
            }
        }
    };

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
    this.frame1 = Mat.crossProduct(this.normal, [1, 0, 0]);
    altFrame1 = Mat.crossProduct(this.normal, [-0.5, 0.8660254037844386, 0]); // [1/2, sqrt(3)/2, 0]
    if (Mat.norm(altFrame1) > Mat.norm(this.frame1)) {
        this.frame1 = altFrame1;
    }

    // initialize the second frame vector
    this.frame2 = Mat.crossProduct(this.normal, this.frame1);

    // scale both frame vectors to unit length
    this.normalizeFrame();

    // create the underlying curve
    this.curve = view.create(
        'curve3d',
        [
            (t) => this.center.X() + this.Radius() * (Math.cos(t) * this.frame1[0] + Math.sin(t) * this.frame2[0]),
            (t) => this.center.Y() + this.Radius() * (Math.cos(t) * this.frame1[1] + Math.sin(t) * this.frame2[1]),
            (t) => this.center.Z() + this.Radius() * (Math.cos(t) * this.frame1[2] + Math.sin(t) * this.frame2[2]),
            [0, 2 * Math.PI] // parameter range
        ],
        attributes
    );
};
JXG.Circle3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Circle3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Circle3D.prototype,
    /** @lends JXG.Circle3D.prototype */ {
        update: function () {
            this.updateNormal();
            this.updateFrame();
            this.curve.visProp.visible = !isNaN(this.Radius());
            return this;
        },

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
            for (i = 0; i < 3; i++) {
                this.frame1[i] /= len1;
                this.frame2[i] /= len2;
            }
        },

        updateFrame: function () {
            this.frame1 = Mat.crossProduct(this.frame2, this.normal);
            this.frame2 = Mat.crossProduct(this.normal, this.frame1);
            this.normalizeFrame();
        },

        projectCoords: function (p, params) {
            // we have to call `this.curve.projectCoords` from the curve, rather
            // than the circle, to make `this` refer to the curve within the
            // call
            return this.curve.projectCoords(p, params);
        },

        projectScreenCoords: function (pScr, params) {
            // we have to call `this.curve.projectScreenCoords` from the curve,
            // rather than the circle, to make `this` refer to the curve within
            // the call
            return this.curve.projectScreenCoords(pScr, params);
        }
    }
);

/**
 * @class This element is used to provide a constructor for a circle.
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
 * @param {JXG.Point_Array_number} center,normal,radius The center must be given as a {@link JXG.Point} (see {@link JXG.providePoints}).
 * The normal vector can be given as an array of three numbers or an array of three functions returning numbers,
 * and the radius can be given as a number (which will create a circle with a fixed radius) or a function.
 * <p>
 * If the radius is supplied as a number or the output of a function, its absolute value is taken. When the radius evaluates to NaN, the circle does not display.
 */
JXG.createCircle3D = function (board, parents, attributes) {
    var view = parents[0],
        attr = Type.copyAttributes(attributes, board.options, 'circle3d'),
        center = Type.providePoints3D(view, [parents[1]], attributes, 'line3d', ['point'])[0],
        normal = parents[2],
        radius = parents[3],
        el;

    // create element
    el = new JXG.Circle3D(view, center, normal, radius, attr);

    // update scene tree
    el.center.addChild(el);
    el.addChild(el.curve);

    el.update();
    return el;
};

JXG.registerElement("circle3d", JXG.createCircle3D);

/**
 * @class An intersection circle is a circle which lives on two JSXGraph elements.
 * The following element types can be (mutually) intersected: sphere, plane.
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
 * </pre><div id="JXGdb931076-b29a-4eff-b97e-4251aaf24943" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
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
        attr = Type.copyAttributes(attributes, board.options, "intersectioncircle3d");

    func = Geometry.intersectionFunction3D(view, el1, el2);
    center = view.create('point3d', func[0], { visible: false });
    ixnCircle = view.create('circle3d', [center, func[1], func[2]], attr);

    try {
        el1.addChild(ixnCircle);
        el2.addChild(ixnCircle);
    } catch (e) {
        throw new Error(
            "JSXGraph: Can't create 'intersection' with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'."
        );
    }

    ixnCircle.type = Const.OBJECT_TYPE_INTERSECTION_CIRCLE3D;
    ixnCircle.elType = 'intersectioncircle3d';
    ixnCircle.setParents([el1.id, el2.id]);

    return ixnCircle;
};

JXG.registerElement('intersectioncircle3d', JXG.createIntersectionCircle3D);
