/*
    Copyright 2008-2025
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

/*global JXG: true, define: true, Float32Array: true */
/*jslint nomen: true, plusplus: true, bitwise: true*/

/**
 * @fileoverview In this file the namespace JXG.Parse3D is defined.
 */
import JXG from "../jxg.js";
// import Type from "../utils/type.js";

/**
 * Namespace Parse3D. Contains parsers for 3D models like STL.
 * @namespace
 */
JXG.Parse3D = {

    /**
     * Parser for the ASCII STL format, see https://en.wikipedia.org/wiki/STL_(file_format).
     * STL stands for stereo-lithography.
     *
     * @param {String} str String containing STL file format
     * @returns {Array} [[vertices, faces], ...] as list of polyhedra. Each entry is the input for a polyhedron3d.
     * @example
     *         const board = JXG.JSXGraph.initBoard(
     *             'jxgbox',
     *             {
     *                 boundingbox: [-8, 8, 8, -8],
     *                 minimizeReflow: 'svg',
     *                 axis: false,
     *                 showNavigation: false,
     *                 zoom: {
     *                     enabled: false
     *                 },
     *                 pan: {
     *                     enabled: false
     *                 }
     *             }
     *         );
     *
     *         var bound = [-1, 2];
     *         var view = board.create(
     *             'view3d',
     *             [[-5, -3], [8, 8],
     *             [bound, bound, bound]],
     *             {
     * 	            axesPosition: 'none',
     *                 projection: 'central',
     *                 trackball: { enabled: true },
     *                 depthOrder: { enabled: true },
     *                 xPlaneRear: { visible: false },
     *                 yPlaneRear: { visible: false },
     *                 zPlaneRear: { fillOpacity: 0.2, visible: true },
     *                 az: {
     *                     slider: {
     *                         visible: true,
     *                         start: 1.54
     *                     }
     *                 }
     *
     *             }
     *         );
     *
     *  // Tetrahedron
     *  var model = `solid m
     *  facet normal 0 0 0
     *    outer loop
     *      vertex 0 0 0
     *      vertex 1 0 0
     *      vertex 1 1 0
     *    endloop
     *   endfacet
     *  facet normal 0 0 0
     *    outer loop
     *      vertex 0 0 0
     *      vertex 1 0 0
     *      vertex 0.5 0.5 1
     *    endloop
     *   endfacet
     *  facet normal 0 0 0
     *    outer loop
     *      vertex 0 0 0
     *      vertex 1 1 0
     *      vertex 0.5 0.5 1
     *    endloop
     *   endfacet
     *  facet normal 0 0 0
     *    outer loop
     *      vertex 1 0 0
     *      vertex 1 1 0
     *      vertex 0.5 0.5 1
     *    endloop
     *   endfacet
     * endsolid m`;
     *
     * var m = JXG.Parse3D.STL(model);
     *
     *  for (let i = 0; i < m.length; i++) {
     *      view.create('polyhedron3d', m[i], {
     *           fillColorArray: [], // ['yellow', 'red', 'green', 'blue'],
     *           layer: 12,
     *           strokeWidth: 0,
     *           shader: {
     *               enabled: true,
     *               type: 'angle',
     *               hue: 0 + 60 * i,
     *               saturation: 90,
     *               minlightness: 60,
     *               maxLightness: 80
     *           },
     *           fillOpacity: 0.8
     *       });
     *   }
     *
     * </pre><div id="JXG8fa8ce22-3613-452f-9775-69588a1c1e34" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG8fa8ce22-3613-452f-9775-69588a1c1e34', {
     *                     showcopyright: false, shownavigation: false,
     *                     boundingbox: [-8, 8, 8, -8],
     *                     minimizeReflow: 'svg',
     *                     axis: false,
     *                     showNavigation: false,
     *                     zoom: {
     *                         enabled: false
     *                     },
     *                     pan: {
     *                         enabled: false
     *                     }
     *                 }
     *             );
     *
     *             var bound = [-1, 2]; // Tetrahedron
     *             var view = board.create(
     *                 'view3d',
     *                 [[-5, -3], [8, 8],
     *                 [bound, bound, bound]],
     *                 {
     *     	               axesPosition: 'none',
     *                     projection: 'central',
     *                     trackball: { enabled: true },
     *                     depthOrder: { enabled: true },
     *                     xPlaneRear: { visible: false },
     *                     yPlaneRear: { visible: false },
     *                     zPlaneRear: { fillOpacity: 0.2, visible: true },
     *                     az: {
     *                         slider: {
     *                             visible: true,
     *                             start: 1.54
     *                         }
     *                     }
     *
     *                 }
     *             );
     *
     *   // Tetrahedron
     *   var model = `solid m
     *      facet normal 0 0 0
     *        outer loop
     *          vertex 0 0 0
     *          vertex 1 0 0
     *          vertex 1 1 0
     *        endloop
     *       endfacet
     *      facet normal 0 0 0
     *        outer loop
     *          vertex 0 0 0
     *          vertex 1 0 0
     *          vertex 0.5 0.5 1
     *        endloop
     *       endfacet
     *      facet normal 0 0 0
     *        outer loop
     *          vertex 0 0 0
     *          vertex 1 1 0
     *          vertex 0.5 0.5 1
     *        endloop
     *       endfacet
     *      facet normal 0 0 0
     *        outer loop
     *          vertex 1 0 0
     *          vertex 1 1 0
     *          vertex 0.5 0.5 1
     *        endloop
     *       endfacet
     *     endsolid m`;
     *
     *             var m = JXG.Parse3D.STL(model);
     *
     *  for (let i = 0; i < m.length; i++) {
     *      view.create('polyhedron3d', m[i], {
     *           fillColorArray: [], // ['yellow', 'red', 'green', 'blue'],
     *           layer: 12,
     *           strokeWidth: 0,
     *           shader: {
     *               enabled: true,
     *               type: 'angle',
     *               hue: 0 + 60 * i,
     *               saturation: 90,
     *               minlightness: 60,
     *               maxLightness: 80
     *           },
     *           fillOpacity: 0.8
     *       });
     *   }
     *     })();
     *
     * </script><pre>
     *
     */
    STL: function (str) {
        var i, j, pos, le,
            li,
            lines,
            coords,
            face_num, found,
            polyhedra = [],
            vertices = [],
            faces = [];

        lines = str.split('\n');

        le = lines.length;
        for (i = 0; i < le; i++) {
            li = lines[i].trim();

            if (li.indexOf('solid') === 0) {
                // New model
                face_num = -1;
                vertices = [];
                faces = [];
            } else if (li.indexOf('endsolid') === 0) {
                polyhedra.push([vertices.slice(), faces.slice()]);
                // break;
            } else if (li.indexOf('facet') === 0) {
                face_num++;
                faces.push([]);
            } else if (li.indexOf('outer loop') === 0 || li.indexOf('endloop') === 0) {
                continue;
            } else if (li.indexOf('vertex') === 0) {
                coords = li.split(' ').slice(1).map((x) => parseFloat(x));
                found = false;
                for (j = 0; j < vertices.length; j++) {
                    if (JXG.Math.Geometry.distance(vertices[j], coords, 3) < JXG.Math.eps) {
                        // Debug:
                        // console.log("Point already defined")
                        found = true;
                        pos = j;
                        break;
                    }
                }
                if (found === false) {
                    pos = vertices.length;
                    vertices.push(coords);
                }
                faces[face_num].push(pos);
            }
        }
        // console.log('v:', vertices.length, 'f:', faces.length)

        // return [vertices, faces];
        return polyhedra;
    }

};


export default JXG.Parse3D;
