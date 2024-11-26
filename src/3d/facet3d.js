/*
    Copyright 2008-2024
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

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Geometry from "../math/geometry.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";

/**
 * Constructor for 3D curves.
 * @class Creates a new 3D curve object. Do not use this constructor to create a 3D curve. Use {@link JXG.View3D#create} with type {@link Curve3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Function} F
 * @param {Function} X
 * @param {Function} Y
 * @param {Function} Z
 * @param {Array} range
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Facet3D = function (view, F, X, Y, Z, range, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_CURVE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "curve3d");

    this.board.finalizeAdding(this);


    /**
     * Function which maps u to x; i.e. it defines the x-coordinate of the curve
     * @function
     * @returns Number
     */
    this.X = X;

    /**
     * Function which maps u to y; i.e. it defines the y-coordinate of the curve
     * @function
     * @returns Number
     */
    this.Y = Y;

    /**
     * Function which maps u to z; i.e. it defines the x-coordinate of the curve
     * @function
     * @returns Number
     */
    this.Z = Z;

    this.dataX = null;
    this.dataY = null;
    this.dataZ = null;

    if (this.F !== null) {
        this.X = function (u) {
            return this.F(u)[0];
        };
        this.Y = function (u) {
            return this.F(u)[1];
        };
        this.Z = function (u) {
            return this.F(u)[2];
        };
    }

    this.range = range;

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Facet3D.prototype = new JXG.Curve3D();

JXG.extend(
    JXG.Curve3D.prototype,
    /** @lends JXG.Curve3D.prototype */ {
);

JXG.createFacet3D = function (board, parents, attributes) {
    var view = parents[0],
        F, X, Y, Z, range, attr, el;

    if (parents.length === 3) {
        F = parents[1];
        range = parents[2];
        X = null;
        Y = null;
        Z = null;
    } else {
        X = parents[1];
        Y = parents[2];
        Z = parents[3];
        range = parents[4];
        F = null;
    }
    // TODO Throw error

    attr = Type.copyAttributes(attributes, board.options, "curve3d");
    el = new JXG.Curve3D(view, F, X, Y, Z, range, attr);

    attr = el.setAttr2D(attr);
    el.element2D = view.create("curve", [[], []], attr);
    el.element2D.view = view;

    /**
     * @class
     * @ignore
     */
    el.element2D.updateDataArray = function () {
        var ret = el.updateDataArray2D();
        this.dataX = ret.X;
        this.dataY = ret.Y;
    };
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement("facet3d", JXG.createCurve3D);

