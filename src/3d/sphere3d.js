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
import Mat from "../math/math";
import Type from "../utils/type";

/**
 * A sphere consists of all points with a given distance from a given point.
 * The given point is called the center, and the given distance is called the radius.
 * A sphere can be constructed by providing a center and a point on the sphere or a center and a radius (given as a number or function).
 * @class Creates a new 3D sphere object. Do not use this constructor to create a 3D sphere. Use {@link JXG.View3D#create} with
 * type {@link Sphere3D} instead.
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {JXG.View3D} view The 3D view the sphere is drawn on.
 * @param {String} method Can be
 * <ul><li> <b>'twoPoints'</b> which means the sphere is defined by its center and a point on the sphere.</li></ul>
 * The parameters p1, p2 and radius must be set according to this method parameter.
 * @param {JXG.Point3D} par1 center of the sphere.
 * @param {JXG.Point3D} par2 Can be
 * <ul><li>a point on the circle if method is 'twoPoints'</li>
 * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point3d} and
 * {@link JXG.Options#elements}, and optional a name and an id.
 * @see JXG.Board#generateName
 */
JXG.Sphere3D = function (view, method, par1, par2, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_SPHERE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "sphere3d");

    this.board.finalizeAdding(this);

    /**
     * Stores the given method.
     * Can be
     * <ul><li><b>'twoPoints'</b> which means the sphere is defined by its center and a point on the sphere.</li></ul>
     * @type String
     * @see #center
     * @see #point2
     */
    this.method = method;

    /**
     * The sphere's center. Do not set this parameter directly as it will break JSXGraph's update system.
     * @type JXG.Point
     */
    this.center = this.board.select(par1);

    /** Point on the sphere only set if method equals 'twoPoints'. Do not set this parameter directly as it will break JSXGraph's update system.
     * @type JXG.Point
     * @see #method
     */
    this.point2 = null;

    this.points = [];

    if (method === "twoPoints") {
        this.point2 = board.select(par2);
        this.radius = this.Radius();
    } else if (method === "pointRadius") {
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

    if (method === "twoPoints") {
        if (Type.exists(this.point2._is_new)) {
            this.addChild(this.point2);
            delete this.point2._is_new;
        } else {
            this.point2.addChild(this);
        }
    }

    this.methodMap = Type.deepCopy(this.methodMap, {
        center: "center",
        point2: "point2"
    });
};
JXG.Sphere3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Sphere3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Sphere3D.prototype,
    /** @lends JXG.Sphere3D.prototype */ {
        update: function () {
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

            if (this.method === "twoPoints") {
                if (this.center.isIllDefined() || this.point2.isIllDefined()) {
                    return NaN;
                }

                return this.center.distance(this.point2);
            }

            if (this.method === "pointRadius") {
                return Math.abs(this.updateRadius());
            }

            return NaN;
        }
    }
);

/**
 * @class This element is used to provide a constructor for a sphere.
 * @pseudo
 * @description A sphere consists of all points with a given distance from a given point.
 * The given point is called the center, and the given distance is called the radius.
 * A sphere can be constructed by providing a center and a point on the sphere or a center and a radius (given as a number or function).
 * If the radius is a negative value, its absolute value is taken.
 * @name Sphere3D
 * @augments JXG.Sphere3D
 * @constructor
 * @type JXG.Sphere3D
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_number,JXG.Point} center,radius The center must be given as a {@link JXG.Point3D} (see {@link JXG.providePoints3D}),
 * but the radius can be given as a number (which will create a sphere with a fixed radius) or another {@link JXG.Point3D}.
 * <p>
 * If the radius is supplied as number or the output of a function, its absolute value is taken.
 */
JXG.createSphere3D = function (board, parents, attributes) {
    //   parents[0]: view
    //   parents[1]: point,
    //   parents[2]: point or radius

    let view = parents[0],
        attr, p, center2d, radius2d, el;

    attr = Type.copyAttributes(attributes, board.options, 'sphere3d');

    p = [];
    for (let i = 1; i < parents.length; i++) {
        if (Type.isPointType3D(board, parents[i])) {
            let point_style;
            if (p.length === 0) {
                point_style = 'center';
            } else {
                point_style = 'point';
            }
            let provided = Type.providePoints3D(view, [parents[i]], attributes, 'sphere3d', [point_style])[0];
            if (provided === false) {
                throw new Error(
                    "JSXGraph: Can't create sphere3d from this type. Please provide a point type."
                );
            }
            p = p.concat(provided);
        } else {
            p.push(parents[i]);
        }
    }

    if (Type.isPoint3D(p[0]) && Type.isPoint3D(p[1])) {
        // Point/Point
        el = new JXG.Sphere3D(view, "twoPoints", p[0], p[1], attr);
    } else if (
        (Type.isNumber(p[0]) || Type.isFunction(p[0]) || Type.isString(p[0])) &&
        Type.isPoint3D(p[1])
    ) {
        // Number/Point
        el = new JXG.Sphere3D(view, "pointRadius", p[1], p[0], attr);
    } else if (
        (Type.isNumber(p[1]) || Type.isFunction(p[1]) || Type.isString(p[1])) &&
        Type.isPoint3D(p[0])
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

    // The center and radius functions of the parallel projection circle
    center2d = function () {
        return view.project3DTo2D([1, el.center.X(), el.center.Y(), el.center.Z()]);
    };
    radius2d = function () {
        let scale2d = view.size[0] / (view.bbox3D[0][1] - view.bbox3D[0][0]);
        return scale2d * el.Radius();
    };

    attr = el.setAttr2D(attr);
    el.element2D = view.create('circle', [center2d, radius2d], attr);
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    el.element2D.prepareUpdate().update().updateRenderer();
    return el;
};

JXG.registerElement("sphere3d", JXG.createSphere3D);
