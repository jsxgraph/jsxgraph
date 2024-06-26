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

import JXG from '../jxg.js';
import Const from '../base/constants.js';
import Type from '../utils/type.js';

// -----------------------
//  Lines
// -----------------------

/**
 * Constructor for 3D polygons.
 * @class Creates a new 3D polygon object. Do not use this constructor to create a 3D polygon. Use {@link JXG.View3D#create} with type {@link Polygon3D} instead.
 *
 * @augments JXG.GeometryElement3D
 * @augments JXG.GeometryElement
 * @param {View3D} view
 * @param {Point3D|Array} point
 * @param {Array} direction
 * @param {Array} range
 * @param {Object} attributes
 * @see JXG.Board#generateName
 */
JXG.Polygon3D = function (view, vertices, attributes) {
    var i;

    this.constructor(view.board, attributes, Const.OBJECT_TYPE_POLYGON3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, 'polygon3d');

    this.board.finalizeAdding(this);

    /**
     * References to the points defining the polygon. The last vertex is the same as the first vertex.
     * @type Array
     */
    this.vertices = [];
    for (i = 0; i < vertices.length; i++) {
        this.vertices[i] = this.board.select(vertices[i]);

        // The _is_new flag is replaced by _is_new_pol.
        // Otherwise, the polygon would disappear if the last border element
        // is removed (and the point has been provided by coordinates)
        if (this.vertices[i]._is_new) {
            delete this.vertices[i]._is_new;
            this.vertices[i]._is_new_pol = true;
        }
    }
};
JXG.Polygon3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Polygon3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Polygon3D.prototype,
    /** @lends JXG.Polygon3D.prototype */ {
        update: function () {
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        }
    }
);

/**
 * @class A polygon is a sequence of points connected by lines, with the last point
 * connecting back to the first one. The points are given by:
 * <ul>
 *    <li> a list of Point3D objects,
 *    <li> a list of coordinate arrays, or
 *    <li> a function returning a list of coordinate arrays.
 * </ul>
 * Each two consecutive points of the list define a line.
 * @pseudo
 * @constructor
 * @name Polygon
 * @type JXG.Polygon
 * @augments JXG.Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array} vertices The polygon's vertices. If the first and the last vertex don't match the first one will be
 * added to the array by the creator. Here, two points match if they have the same 'id' attribute.
 */
JXG.createPolygon3D = function (board, parents, attributes) {
    var view = parents[0],
        el, i, le, obj,
        points = [],
        points2d = [],
        attr,
        attr_points,
        is_transform = false;

    attr = Type.copyAttributes(attributes, board.options, 'polygon3d');
    obj = board.select(parents[1]);
    if (obj === null) {
        // This is necessary if the original polygon is defined in another board.
        obj = parents[1];
    }
    if (
        Type.isObject(obj) &&
        obj.type === Const.OBJECT_TYPE_POLYGON3D &&
        Type.isTransformationOrArray(parents[2])
    ) {
        is_transform = true;
        le = obj.vertices.length - 1;
        attr_points = Type.copyAttributes(attributes, board.options, 'polygon3d', 'vertices');
        for (i = 0; i < le; i++) {
            if (attr_points.withlabel) {
                attr_points.name =
                    obj.vertices[i].name === '' ? '' : obj.vertices[i].name + "'";
            }
            points.push(board.create('point3d', [obj.vertices[i], parents[2]], attr_points));
        }
    } else {
        points = Type.providePoints3D(view, parents.slice(1), attributes, 'polygon3d', ['vertices']);
        if (points === false) {
            throw new Error(
                "JSXGraph: Can't create polygon3d with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates. Alternatively, a polygon3d and a transformation can be supplied"
            );
        }
    }

    el = new JXG.Polygon3D(view, points, attr);
    el.isDraggable = true;

    attr = el.setAttr2D(attr);
    for (i = 0; i < points.length; i++) {
        points2d.push(points[i].element2D);
    }
    el.element2D = board.create('polygon', points2d, attr);
    el.element2D.view = view;
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    // Put the points in their positions
    if (is_transform) {
      el.prepareUpdate().update().updateVisibility().updateRenderer();
      le = obj.vertices.length - 1;
      for (i = 0; i < le; i++) {
          points[i].prepareUpdate().update().updateVisibility().updateRenderer();
      }
    }

    return el;
};
JXG.registerElement('polygon3d', JXG.createPolygon3D);