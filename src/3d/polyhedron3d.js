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

/**
 * Create axes and rear and front walls of the
 * view3d bounding box bbox3D.
 */
import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * @class This element creates 3D ticks.
 * @pseudo
 * @description Create a 3D ticks.
 * <p>
 * At the time being, the ticks are not connected to the line or axis. The connecting element is simply the
 * parameter point.
 *
 * @name Ticks3D
 * @augments Curve
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array_Number_Array} point,direction1,length,direction2 point is an array of length 3
 * determining the starting point of the grid. direction1 and direction2 are arrays of length 3. Here, direction1 is the direction
 * of the 3D line, direction2 is the direction of the ticks.
 * "length" is the length of the line.
 * All parameters can be supplied as functions returning an appropriate data type.
 * <p>
 * The step width of the ticks is determined by the attribute "ticksDistance".
 *
 */
JXG.createpolyhedron3D = function (board, parents, attributes) {
    var view = parents[0],
        i, le,
        face,
        el,
        attr, attr_polyhedron,
        faceList = [],
        polyhedron = {
            view: view,
            vertices: {},
            coords: {},
            // edges: [],
            faces: parents[2],
            updateCoords: function() {
                var i, p;
                for (i in this.vertices) {
                    if (this.vertices.hasOwnProperty(i)) {
                        p = this.view.select(this.vertices[i]);
                        if (Type.isPoint3D(p)) {
                            this.coords[i] = p.coords.slice(1);
                        } else {
                            this.coords[i] = JXG.evaluate(this.vertices[i]);
                        }
                    }
                }
            }
        };


    // Copy vertices into a dict
    if (Type.isArray(parents[1])) {
        le = parents[1].length;
        for (i = 0; i < le; i++) {
            polyhedron.vertices[i] = parents[1][i];
        }
    } else if (Type.isObject(parents[1])) {
        for (i in parents[1]) {
            if (parents[1].hasOwnProperty(i)) {
                polyhedron.vertices[i] = parents[1][i];
            }
        }
    }

    attr_polyhedron = JXG.copyAttributes(attributes, board.options, "polyhedron3d");

    // Create edge elements
    // if (parents[3]) {
    //     polyhedron.faces = parents[3].slice();
    // }

    // Create face3d elements
    le = polyhedron.faces.length;
    for (i = 0; i < le; i++) {
        attr = JXG.copyAttributes(attributes, board.options, "curve3d");
        attr.fillcolor = attr_polyhedron.fillcolorarray[i % attr_polyhedron.fillcolorarray.length];

        // attr.fillopacity = attr_polyhedron.fillopacityarray[i % attr_polyhedron.fillopacityarray.length];

        face = view.create('face3d', [polyhedron, i], attr);
        faceList.push(face);
    }
    el = new JXG.Composition(faceList);
    el.numberFaces = le;
    el.polyhedron = polyhedron;

    return el;
};

JXG.registerElement("polyhedron3d", JXG.createpolyhedron3D);
