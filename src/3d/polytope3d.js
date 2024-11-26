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
import Mat from "../math/math.js";

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
        i, j, le,
        face,
        c,
        el,
        attr,
        faceList = [],
        surface = {
            points: parents[1],
            coords: [],
            facets: parents[2]
        };

    attr = JXG.copyAttributes(attributes, board.options, "polytope3d");
    le = surface.facets.length;

    for (i = 0; i < le; i++) {
        face = view.create('curve3d', [[], [], []], {
            fillColor: attr.fillcolorarray[i % attr.fillcolorarray.length],
            fillOpacity: 0.6
        });
        face.elType = 'facet3d';
        face.updateDataArray = (function (ii) {
            return function () {
                var j, le,
                    x, y, z,
                    facet = surface.facets[ii];

                if (ii === 0) {
                    // Evaluate each point only once.
                    // For this, facet[0] has to be accessed first.
                    // During updates this should be the case automatically. 
                    le = surface.points.length;
                    for (j = 0; j < le; j++) {
                        surface.coords[j] = JXG.evaluate(surface.points[j]);
                    }
                }

                x = [];
                y = [];
                z = [];
                for (j = 0; j < facet.length; j++) {
                    c = surface.coords[facet[j]];
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
        faceList.push(face);
    }
    el = new JXG.Composition(faceList);
    el.numberFacets = le;
    el.surface = surface;

    return el;
};

JXG.registerElement("polytope3d", JXG.createPolytope3D);
