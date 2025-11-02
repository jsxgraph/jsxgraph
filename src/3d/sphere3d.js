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
import Mat from "../math/math.js";
import Stat from "../math/statistics.js";
import Geometry from "../math/geometry.js";

/**
 * A sphere consists of all points with a given distance from a given point.
 * The given point is called the center, and the given distance is called the radius.
 * A sphere can be constructed by providing a center and a point on the sphere or a center and a radius (given as a number or function).
 * @class Creates a new 3D sphere object. Do not use this constructor to create a 3D sphere. Use {@link JXG.View3D#create} with
 * type {@link Sphere3D} instead.
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the sphere is drawn on.
 * @param {String} method Can be:
 * <ul><li> <b><code>'twoPoints'</code></b> &ndash; The sphere is defined by its center and a point on the sphere.</li>
 * <li><b><code>'pointRadius'</code></b> &ndash; The sphere is defined by its center and its radius in user units.</li></ul>
 * The parameters <code>p1</code>, <code>p2</code> and <code>radius</code> must be set according to this method parameter.
 * @param {JXG.Point3D} par1 The center of the sphere.
 * @param {JXG.Point3D} par2 Can be:
 * <ul><li>A point on the sphere (if the construction method is <code>'twoPoints'</code>)</li>
 * <ul><li>A number or function (if the construction method is <code>'pointRadius'</code>)</li>
 * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point3d} and
 * {@link JXG.Options#elements}, and optional a name and an id.
 * @see JXG.Board#generateName
 */
JXG.Sphere3D = function (view, method, par1, par2, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_SPHERE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'sphere3d');

    this.board.finalizeAdding(this);

    /**
     * The construction method.
     * Can be:
     * <ul><li><b><code>'twoPoints'</code></b> &ndash; The sphere is defined by its center and a point on the sphere.</li>
     * <li><b><code>'pointRadius'</code></b> &ndash; The sphere is defined by its center and its radius in user units.</li></ul>
     * @type String
     * @see JXG.Sphere3D#center
     * @see JXG.Sphere3D#point2
     */
    this.method = method;

    /**
     * The sphere's center. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type JXG.Point3D
     */
    this.center = this.board.select(par1);

    /**
     * A point on the sphere; only set if the construction method is 'twoPoints'. Do not set this parameter directly, as that will break JSXGraph's update system.
     * @type JXG.Point3D
     * @see JXG.Sphere3D#method
     */
    this.point2 = null;

    this.points = [];

    /**
     * The 2D representation of the element.
     * @type GeometryElement
     */
    this.element2D = null;

    /**
     * Elements supporting the 2D representation.
     * @type Array
     * @private
     */
    this.aux2D = [];

    /**
     * The type of projection (<code>'parallel'</code> or <code>'central'</code>) that the sphere is currently drawn in.
     * @type String
     */
    this.projectionType = view.projectionType;

    if (method === 'twoPoints') {
        this.point2 = this.board.select(par2);
        this.radius = this.Radius();
    } else if (method === 'pointRadius') {
        // Converts JessieCode syntax into JavaScript syntax and generally ensures that the radius is a function
        this.updateRadius = Type.createFunction(par2, this.board);
        // First evaluation of the radius function
        this.updateRadius();
        this.addParentsFromJCFunctions([this.updateRadius]);
    }

    if (Type.exists(this.center._is_new)) {
        this.addChild(this.center);
        delete this.center._is_new;
    } else {
        this.center.addChild(this);
    }

    if (method === 'twoPoints') {
        if (Type.exists(this.point2._is_new)) {
            this.addChild(this.point2);
            delete this.point2._is_new;
        } else {
            this.point2.addChild(this);
        }
    }

    this.methodMap = Type.deepCopy(this.methodMap, {
        center: "center",
        point2: "point2",
        Radius: "Radius"
    });
};
JXG.Sphere3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Sphere3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Sphere3D.prototype,
    /** @lends JXG.Sphere3D.prototype */ {

        X: function(u, v) {
            var r = this.Radius();
            return r * Math.sin(u) * Math.cos(v);
        },

        Y: function(u, v) {
            var r = this.Radius();
            return r * Math.sin(u) * Math.sin(v);
        },

        Z: function(u, v) {
            var r = this.Radius();
            return r * Math.cos(u);
        },

        range_u: [0, 2 * Math.PI],
        range_v: [0, Math.PI],

        update: function () {
            if (this.projectionType !== this.view.projectionType) {
                this.rebuildProjection();
            }
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        /**
         * Set a new radius, then update the board.
         * @param {String|Number|function} r A string, function or number describing the new radius
         * @returns {JXG.Sphere3D} Reference to this sphere
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

            if (this.method === 'twoPoints') {
                if (!this.center.testIfFinite() || !this.point2.testIfFinite()) {
                    return NaN;
                }

                return this.center.distance(this.point2);
            }

            if (this.method === 'pointRadius') {
                return Math.abs(this.updateRadius());
            }

            return NaN;
        },

        // The central projection of a sphere is an ellipse. The front and back
        // points of the sphere---that is, the points closest to and furthest
        // from the screen---project to the foci of the ellipse.
        //
        // To see this, look at the cone tangent to the sphere whose tip is at
        // the camera. The image of the sphere is the ellipse where this cone
        // intersects the screen. By acting on the sphere with scalings centered
        // on the camera, you can send it to either of the Dandelin spheres that
        // touch the screen at the foci of the image ellipse.
        //
        // This factory method produces two functions, `focusFn(-1)` and
        // `focusFn(1)`, that evaluate to the projections of the front and back
        // points of the sphere, respectively.
        focusFn: function (sgn) {
            var that = this;

            return function () {
                var camDir = that.view.boxToCam[3],
                    r = that.Radius();

                return that.view.project3DTo2D([
                    that.center.X() + sgn * r * camDir[1],
                    that.center.Y() + sgn * r * camDir[2],
                    that.center.Z() + sgn * r * camDir[3]
                ]).slice(1, 3);
            };
        },

        innerVertexFn: function () {
            var that = this;

            return function () {
                var view = that.view,
                    p = view.worldToFocal(that.center.coords, false),
                    distOffAxis = Mat.hypot(p[0], p[1]),
                    cam = view.boxToCam,
                    r = that.Radius(),
                    angleOffAxis = Math.atan(-distOffAxis / p[2]),
                    steepness = Math.acos(r / Mat.norm(p)),
                    lean = angleOffAxis + steepness,
                    cos_lean = Math.cos(lean),
                    sin_lean = Math.sin(lean),
                    inward;

                if (distOffAxis > 1e-8) {
                    // if the center of the sphere isn't too close to the camera
                    // axis, find the direction in plane of the screen that
                    // points from the center of the sphere toward the camera
                    // axis
                    inward = [
                        -(p[0] * cam[1][1] + p[1] * cam[2][1]) / distOffAxis,
                        -(p[0] * cam[1][2] + p[1] * cam[2][2]) / distOffAxis,
                        -(p[0] * cam[1][3] + p[1] * cam[2][3]) / distOffAxis
                    ];
                } else {
                    // if the center of the sphere is very close to the camera
                    // axis, choose an arbitrary unit vector in the plane of the
                    // screen
                    inward = [cam[1][1], cam[1][2], cam[1][3]];
                }
                return view.project3DTo2D([
                    that.center.X() + r * (sin_lean * inward[0] + cos_lean * cam[3][1]),
                    that.center.Y() + r * (sin_lean * inward[1] + cos_lean * cam[3][2]),
                    that.center.Z() + r * (sin_lean * inward[2] + cos_lean * cam[3][3])
                ]);
            };
        },

        buildCentralProjection: function (attr) {
            var view = this.view,
                auxStyle = { visible: false, withLabel: false },
                frontFocus = view.create('point', this.focusFn(-1), auxStyle),
                backFocus = view.create('point', this.focusFn(1), auxStyle),
                innerVertex = view.create('point', this.innerVertexFn(view), auxStyle);

            this.aux2D = [frontFocus, backFocus, innerVertex];
            this.element2D = view.create('ellipse', this.aux2D, attr === undefined ? this.visProp : attr);
        },

        buildParallelProjection: function (attr) {
            // The parallel projection of a sphere is a circle
            var that = this,
                // center2d = function () {
                //     var c3d = [1, that.center.X(), that.center.Y(), that.center.Z()];
                //     return that.view.project3DTo2D(c3d);
                // },
                radius2d = function () {
                    var boxSize = that.view.bbox3D[0][1] - that.view.bbox3D[0][0];
                    return that.Radius() * that.view.size[0] / boxSize;
                };

            this.aux2D = [];
            this.element2D = this.view.create(
                'circle',
                // [center2d, radius2d],
                [that.center.element2D, radius2d],
                attr === undefined ? this.visProp : attr
            );
        },

        // replace our 2D representation with a new one that's consistent with
        // the view's current projection type
        rebuildProjection: function (attr) {
            var i;

            // remove the old 2D representation from the scene tree
            if (this.element2D) {
                this.view.board.removeObject(this.element2D);
                for (i in this.aux2D) {
                    if (this.aux2D.hasOwnProperty(i)) {
                        this.view.board.removeObject(this.aux2D[i]);
                    }
                }
            }

            // build a new 2D representation. the representation is stored in
            // `this.element2D`, and any auxiliary elements are stored in
            // `this.aux2D`
            this.projectionType = this.view.projectionType;
            if (this.projectionType === 'central') {
                this.buildCentralProjection(attr);
            } else {
                this.buildParallelProjection(attr);
            }

            // attach the new 2D representation to the scene tree
            this.addChild(this.element2D);
            this.inherits.push(this.element2D);
            this.element2D.view = this.view;
        },

        // Already documented in element3d.js
        projectCoords: function(p, params) {
            var r = this.Radius(),
                pp = [1].concat(p),
                c = this.center.coords,
                d = Geometry.distance(c, pp, 4),
                v = Stat.subtract(pp, c);

            if (d === 0) {
                // p is at the center, take an arbitrary point on sphere
                params[0] = 0;
                params[1] = 0;
                return [1, r, 0, 0];
            }
            if (r === 0) {
                params[0] = 0;
                params[1] = 0;
                return this.center.coords;
            }

            d = r / d;
            v[0] = 1;
            v[1] *= d;
            v[2] *= d;
            v[3] *= d;

            // Preimage of the new position
            params[1] = Math.atan2(v[2], v[1]);
            params[1] += (params[1] < 0) ? Math.PI : 0;
            if (params[1] !== 0) {
                params[0] = Math.atan2(v[2], v[3] * Math.sin(params[1]));
            } else {
                params[0] = Math.atan2(v[1], v[3] * Math.cos(params[1]));
            }
            params[0] += (params[0] < 0) ? 2 * Math.PI : 0;

            return v;
        }

        // projectScreenCoords: function (pScr, params) {
        //     if (params.length === 0) {
        //         params.unshift(
        //             0.5 * (this.range_u[0] + this.range_u[1]),
        //             0.5 * (this.range_v[0] + this.range_v[1])
        //         );
        //     }
        //     return Geometry.projectScreenCoordsToParametric(pScr, this, params);
        // }
    }
);

/**
 * @class A sphere in a 3D view.
 * A sphere consists of all points with a given distance from a given point.
 * The given point is called the center, and the given distance is called the radius.
 * A sphere can be constructed by providing a center and a point on the sphere or a center and a radius (given as a number or function).
 * If the radius is a negative value, its absolute value is taken.
 *
 * @pseudo
 * @name Sphere3D
 * @augments JXG.Sphere3D
 * @constructor
 * @type JXG.Sphere3D
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point3D_number,JXG.Point3D} center,radius The center must be given as a {@link JXG.Point3D} (see {@link JXG.providePoints3D}),
 * but the radius can be given as a number (which will create a sphere with a fixed radius) or another {@link JXG.Point3D}.
 * <p>
 * If the radius is supplied as number or the output of a function, its absolute value is taken.
 *
 * @example
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
 *
 * // Two points
 * var center = view.create(
 *     'point3d',
 *     [1.5, 1.5, 1.5],
 *     {
 *         withLabel: false,
 *         size: 5,
 *    }
 * );
 * var point = view.create(
 *     'point3d',
 *     [2, 1.5, 1.5],
 *     {
 *         withLabel: false,
 *         size: 5
 *    }
 * );
 *
 * // Sphere
 * var sphere = view.create(
 *     'sphere3d',
 *     [center, point],
 *     {}
 * );
 *
 * </pre><div id="JXG5969b83c-db67-4e62-9702-d0440e5fe2c1" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG5969b83c-db67-4e62-9702-d0440e5fe2c1',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
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
 *
 *         // Two points
 *         var center = view.create(
 *             'point3d',
 *             [1.5, 1.5, 1.5],
 *             {
 *                 withLabel: false,
 *                 size: 5,
 *            }
 *         );
 *         var point = view.create(
 *             'point3d',
 *             [2, 1.5, 1.5],
 *             {
 *                 withLabel: false,
 *                 size: 5
 *            }
 *         );
 *
 *         // Sphere
 *         var sphere = view.create(
 *             'sphere3d',
 *             [center, point],
 *             {}
 *         );
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     // Glider on sphere
 *     var view = board.create(
 *         'view3d',
 *         [[-6, -3], [8, 8],
 *         [[-3, 3], [-3, 3], [-3, 3]]],
 *         {
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             projection: 'central',
 *             xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *             yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *             zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *         }
 *     );
 *
 *     // Two points
 *     var center = view.create('point3d', [0, 0, 0], {withLabel: false, size: 2});
 *     var point = view.create('point3d', [2, 0, 0], {withLabel: false, size: 2});
 *
 *     // Sphere
 *     var sphere = view.create('sphere3d', [center, point], {fillOpacity: 0.8});
 *
 *     // Glider on sphere
 *     var glide = view.create('point3d', [2, 2, 0, sphere], {withLabel: false, color: 'red', size: 4});
 *     var l1 = view.create('line3d', [glide, center], { strokeWidth: 2, dash: 2 });
 *
 * </pre><div id="JXG672fe3c7-e6fd-48e0-9a24-22f51f2dfa71" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG672fe3c7-e6fd-48e0-9a24-22f51f2dfa71',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *         var view = board.create(
 *             'view3d',
 *             [[-6, -3], [8, 8],
 *             [[-3, 3], [-3, 3], [-3, 3]]],
 *             {
 *                 depthOrder: {
 *                     enabled: true
 *                 },
 *                 projection: 'central',
 *                 xPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 yPlaneRear: {fillOpacity: 0.2, gradient: null},
 *                 zPlaneRear: {fillOpacity: 0.2, gradient: null}
 *             }
 *         );
 *
 *         // Two points
 *         var center = view.create('point3d', [0, 0, 0], {withLabel: false, size: 2});
 *         var point = view.create('point3d', [2, 0, 0], {withLabel: false, size: 2});
 *
 *         // Sphere
 *         var sphere = view.create('sphere3d', [center, point], {fillOpacity: 0.8});
 *
 *         // Glider on sphere
 *         var glide = view.create('point3d', [2, 2, 0, sphere], {withLabel: false, color: 'red', size: 4});
 *         var l1 = view.create('line3d', [glide, center], { strokeWidth: 2, dash: 2 });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createSphere3D = function (board, parents, attributes) {
    //   parents[0]: view
    //   parents[1]: point,
    //   parents[2]: point or radius

    var view = parents[0],
        attr, p, point_style, provided,
        el, i;

    attr = Type.copyAttributes(attributes, board.options, 'sphere3d');
    p = [];
    for (i = 1; i < parents.length; i++) {
        if (Type.isPointType3D(board, parents[i])) {
            if (p.length === 0) {
                point_style = 'center';
            } else {
                point_style = 'point';
            }
            provided = Type.providePoints3D(view, [parents[i]], attributes, 'sphere3d', [point_style])[0];
            if (provided === false) {
                throw new Error(
                    "JSXGraph: Can't create sphere3d from this type. Please provide a point type."
                );
            }
            p.push(provided);
        } else {
            p.push(parents[i]);
        }
    }

    if (Type.isPoint3D(p[0]) && Type.isPoint3D(p[1])) {
        // Point/Point
        el = new JXG.Sphere3D(view, "twoPoints", p[0], p[1], attr);

        /////////////// nothing in docs suggest you can use [number, pointType]
        // } else if (
        //     (Type.isNumber(p[0]) || Type.isFunction(p[0]) || Type.isString(p[0])) &&
        //     Type.isPoint3D(p[1])
        // ) {
        //     // Number/Point
        //     el = new JXG.Sphere3D(view, "pointRadius", p[1], p[0], attr);

    } else if (
        Type.isPoint3D(p[0]) &&
        (Type.isNumber(p[1]) || Type.isFunction(p[1]) || Type.isString(p[1]))
    ) {
        // Point/Number
        el = new JXG.Sphere3D(view, "pointRadius", p[0], p[1], attr);
    } else {
        throw new Error(
            "JSXGraph: Can't create sphere3d with parent types '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'." +
            "\nPossible parent types: [point,point], [point,number], [point,function]"
        );
    }

    // Build a 2D representation, and attach it to the scene tree, and update it
    // to the correct initial state
    // Here, element2D is created.
    attr = el.setAttr2D(attr);
    el.rebuildProjection(attr);

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement("sphere3d", JXG.createSphere3D);
