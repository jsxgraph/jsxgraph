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
JXG.createPolytope3D = function (board, parents, attributes) {
    var view = parents[0],
        i, le,
        face,
        c, el,
        attr, attr_polytope,
        faceList = [],
        surface = {
            points: parents[1],
            coords: [],
            faces: parents[2]
        };

    attr_polytope = JXG.copyAttributes(attributes, board.options, "polytope3d");
    le = surface.faces.length;

    for (i = 0; i < le; i++) {
        attr = JXG.copyAttributes(attributes, board.options, "curve3d");
        attr.fillcolor = attr_polytope.fillcolorarray[i % attr_polytope.fillcolorarray.length];
        // attr.fillopacity = attr_polytope.fillopacityarray[i % attr_polytope.fillopacityarray.length];

        face = view.create('curve3d', [[], [], []], attr);
        face.elType = 'face3d';

        face.updateDataArray = (function (ii) {
            return function () {
                var j, le,
                    x, y, z,
                    face = surface.faces[ii];

                if (ii === 0) {
                    // Evaluate each point only once.
                    // For this, face[0] has to be accessed first.
                    // During updates this should be the case automatically.
                    le = surface.points.length;
                    for (j = 0; j < le; j++) {
                        surface.coords[j] = JXG.evaluate(surface.points[j]);
                    }
                }

                x = [];
                y = [];
                z = [];
                for (j = 0; j < face.length; j++) {
                    c = surface.coords[face[j]];
                    x.push(c[0]);
                    y.push(c[1]);
                    z.push(c[2]);
                }
                // Close the loop
                x.push(x[0]);
                y.push(y[0]);
                z.push(z[0]);

                this.dataX = x;
                this.dataY = y;
                this.dataZ = z;
            };
        })(i);

        face.getCentroid = function() {
            var i,
                s_x = 0,
                s_y = 0,
                s_z = 0,
                le = this.dataX.length - 1;

            if (le === 0) {
                return [NaN, NaN, NaN];
            }

            for (i = 0; i < le; i++) {
                s_x += this.dataX[i];
                s_y += this.dataY[i];
                s_z += this.dataZ[i];
            }

            return [s_x / le, s_y / le, s_z / le];
        };

        faceList.push(face);
    }
    el = new JXG.Composition(faceList);
    el.numberFaces = le;
    el.surface = surface;

    return el;
};

JXG.registerElement("polytope3d", JXG.createPolytope3D);
