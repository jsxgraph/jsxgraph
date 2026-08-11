/*
    Copyright 2005-2026
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/
/*eslint no-loss-of-precision: off */

/**
 * @fileoverview In this file the namespace JXG.Math.Tiling is defined, which holds numerical
 * algorithms for creating meshes for surface3d elements.
 */
import Mat from "./math.js";

/**
 * The JXG.Math.Tiling namespace.
 * @name JXG.Math.Tiling
 * @exports Mat.Numerics as JXG.Math.Tiling
 * @namespace
 */
Mat.Tiling = {
    /**
     * Triangulate (partition it into triangles) a given two dimensional domain.
     * The number of triangles the original rectangle is divided into depends on the parameters stepsU and stepsV.
     * Input are the ranges of u and v, as well as stepsU and stepsV which are static.
     * If the optional parameter stepsV is not given or is equal to 0, the rectangle is partitioned into
     * nearly equilateral triangles.
     * Otherwise, the shape of the triangles depends on the ratio of stepsU / stepsV.
     * @name triangulation
     * @param {JXG.ParametricSurface3D|JXG.Plane3D} el element which is displayed using a polyhedron3d.
     * From this element its function F is used.
     * @param {Array} rg_u Begin and end of first direction (numbers or functions)
     * @param {Array} rg_v Begin and end of second direction (numbers or functions)
     * @param {Number} stepsU Immutable
     * @param {Number} [stepsV=0] Immutable
     * @returns [coords,faces]
     * @memberof JXG.Math.Tiling
     *
     * @example
     * var i,
     *     surface = JXG.Math.Tiling.triangulation([0,0], [0,4], [2,4], [2,0], 6);
     * for (i = 0; i < surface[1].length; i++) {
     *     board.create('polygon',[
     *         surface[0][surface[1][i][0]],
     *         surface[0][surface[1][i][1]],
     *         surface[0][surface[1][i][2]]
     *     ]);
     * }
     *
     * </pre><div id="JXG948307f3-fc6b-4dc6-92d6-40eaa7918ee0" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG948307f3-fc6b-4dc6-92d6-40eaa7918ee0',
     *             {boundingbox: [-1, 5, 3,-1], axis: true, showcopyright: false, shownavigation: false});
     *     var i,
     *         surface = JXG.Math.Tiling.triangulation([0,0],[0,4],[2,4],[2,0], 6);
     *     for (i = 0; i < surface[1].length; i++) {
     *         board.create('polygon',[
     *             surface[0][surface[1][i][0]],
     *             surface[0][surface[1][i][1]],
     *             surface[0][surface[1][i][2]]
     *         ]);
     *     }
     *     })();
     *
     * </script><pre>
     *
     * @example
     * var i,
     *     surface = JXG.Math.Tiling.triangulation([0,0], [0,4], [2,4], [2,0], 7, 3);
     * for (i = 0; i < surface[1].length; i++) {
     *     board.create('polygon',[
     *         surface[0][surface[1][i][0]],
     *         surface[0][surface[1][i][1]],
     *         surface[0][surface[1][i][2]]
     *     ]);
     * }
     *
     *
     * </pre><div id="JXGee3b922e-0dcb-47f2-9ef8-c79cb13dd733" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGee3b922e-0dcb-47f2-9ef8-c79cb13dd733',
     *             {boundingbox: [-1, 5, 3,-1], axis: true, showcopyright: false, shownavigation: false});
     *     var i,
     *         surface = JXG.Math.Tiling.triangulation([0,0],[0,4],[2,4],[2,0], 7, 3);
     *     for (i = 0; i < surface[1].length; i++) {
     *         board.create('polygon',[
     *             surface[0][surface[1][i][0]],
     *             surface[0][surface[1][i][1]],
     *             surface[0][surface[1][i][2]]
     *         ]);
     *     }
     *     })();
     *
     * </script><pre>
     *
     *
     */
    triangulation: function (el, rg_u, rg_v, stepsU, stepsV) {
        var i, j, le,
            up,
            ru, rv, du, dv,
            vertices = [],
            faces = [];

        if (stepsV === undefined || stepsV === 0) {
            // Approximate equilateral triangles
            ru = JXG.evaluate(rg_u);
            rv = JXG.evaluate(rg_v);
            du = (ru[1] - ru[0]) / stepsU;
            dv = du * Math.sqrt(3) / 2;
            stepsV = Math.round(Math.abs(rv[1] - rv[0]) / dv);
        }
        for (j = 0; j <= stepsV; j++) {
            up = (j % 2 === 0) ? stepsU : stepsU + 1;
            for (i = 0; i <= up; i++) {
                // Generate vertices
                vertices.push(
                    (function (ii, jj, up) {
                        var s = ii;
                        if (jj % 2 === 1) {
                            s = (ii === up) ? (ii - 1) : ((ii > 0) ? (ii - 0.5) : s);
                        }

                        return function () {
                            var ru = JXG.evaluate(rg_u),
                                rv = JXG.evaluate(rg_v),
                                u = ru[0] + s * (ru[1] - ru[0]) / stepsU,
                                v = rv[0] + jj * (rv[1] - rv[0]) / stepsV,
                                val = el.F(u, v);
                            // return [u, v, val];
                            return (val.length === 4) ? val.slice(1) : val;
                        };
                    })(i, j, up)
                );

                // Generate faces
                if (j > 0) {
                    le = vertices.length - 1;
                    if (j % 2 === 1) {
                        if (i > 0) {
                            faces.push([le - 1, le, le - 2 - stepsU]);
                            if (i < up) {
                                faces.push([le, le - 1 - stepsU, le - 2 - stepsU]);
                            } else {
                                faces.push([le - 1, le, le - 2 - stepsU]);
                            }
                        }
                    } else {
                        if (i > 0) {
                            faces.push([le, le - 2 - stepsU, le - 1]);
                        }
                        faces.push([le, le - 1 - stepsU, le - 2 - stepsU]);
                    }
                }
            }
        }
        return [vertices, faces];
    },

    /**
     * Rectangulate (partition it into rectangles) a given two dimensional domain.
     * The number of rectangles the original rectangle is divided into depends on the parameters stepsU and stepsV.
     * Input are the ranges of u and v, as well as stepsU and stepsV which are static.
     * @name rectangulation
     * @param {JXG.ParametricSurface3D|JXG.Plane3D} el element which is displayed using a polyhedron3d.
     * From this element its function F is used.
     * @param {Array} rg_u Begin and end of first direction (numbers or functions)
     * @param {Array} rg_v Begin and end of second direction (numbers or functions)
     * @param {Number} stepsU Immutable
     * @param {Number} stepsV Immutable
     * @returns [coords,faces]
     * @memberof JXG.Math.Tiling
     *
     * @example
     * var i,
     *     surface = JXG.Math.Tiling.rectangulation([0,0], [0,5], [2,5], [2,0], 6, 6);
     * for (i = 0; i < surface[1].length; i++) {
     *     board.create('polygon',[
     *         surface[0][surface[1][i][0]],
     *         surface[0][surface[1][i][1]],
     *         surface[0][surface[1][i][2]],
     *         surface[0][surface[1][i][3]]
     *     ]);
     * }
     *
     * </pre><div id="JXG05cfba29-be76-482f-9d49-8ee4c36033e4" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG05cfba29-be76-482f-9d49-8ee4c36033e4',
     *             {boundingbox: [-1, 6, 6,-1], axis: true, showcopyright: false, shownavigation: false});
     *     var i,
     *         surface = JXG.Math.Tiling.rectangulation([0,0],[0,5],[2,5],[2,0],6,6);
     *     for (i=0; i<surface[1].length; i++) {
     *         board.create('polygon',[
     *            surface[0][surface[1][i][0]],
     *            surface[0][surface[1][i][1]],
     *            surface[0][surface[1][i][2]],
     *            surface[0][surface[1][i][3]]
     *         ]);
     *     }
     *
     *     })();
     *
     * </script><pre>
     *
     *
     */
    rectangulation: function (el, rg_u, rg_v, stepsU, stepsV) {
        var vertices = [],
            faces = [],
            i, j, le;

        for (j = 0; j <= stepsV; j++) {
            for (i = 0; i <= stepsU; i++) {
                vertices.push(
                    (function (ii, jj) {
                        return function () {
                            var ru = JXG.evaluate(rg_u),
                                rv = JXG.evaluate(rg_v),
                                u = ru[0] + ii * (ru[1] - ru[0]) / stepsU,
                                v = rv[0] + jj * (rv[1] - rv[0]) / stepsV,
                                val = el.F(u, v);
                            return (val.length === 4) ? val.slice(1) : val;
                        };
                    })(i, j)
                );
                if (i > 0 && j > 0) {
                    le = vertices.length - 1;
                    faces.push(
                        // [le - 1 - stepsU - 1, le - 1 - stepsU, le, le - 1]
                        [le - 1, le, le - 1 - stepsU, le - 1 - stepsU - 1]
                    );
                }
            }
        }
        return [vertices, faces];
    }

    // triangulation_old: function (p1, p2, p3, p4, stepsU, stepsV) {
    //     // Vectors used for checking if the given coordinates create a rectangle
    //     var vec1 = [p2[0] - p1[0], p2[1] - p1[1]],
    //         vec2 = [p3[0] - p2[0], p3[1] - p2[1]],
    //         vec3 = [p4[0] - p3[0], p4[1] - p3[1]],
    //         vec4 = [p1[0] - p4[0], p1[1] - p4[1]],

    //         coords = [],
    //         faces = [],
    //         width, height,
    //         wSide, hSide,
    //         triangleWidth, triangleHeight,
    //         s1, s2,
    //         i, j,
    //         numRows,
    //         widthX, widthY, heightX, heightY,
    //         oddPoints,
    //         evenPoints;

    //     // Check if the given coordinates create a rectangle, otherwise an exception is thrown
    //     if (
    //         vec1[0] * vec4[0] + vec1[1] * vec4[1] !== 0 ||
    //         vec2[0] * vec1[0] + vec2[1] * vec1[1] !== 0 ||
    //         vec3[0] * vec2[0] + vec3[1] * vec2[1] !== 0 ||
    //         vec4[0] * vec3[0] + vec4[1] * vec3[1] !== 0
    //     ) {
    //         throw new Error(" the board created is not rectangle  ");
    //     }

    //     // Set initial values for wSide, hSide
    //     wSide = [0, 0];
    //     hSide = [0, 0];

    //     // Check for longer side of rectangle:
    //     // longer side is appointed height, shorter side is appointed width
    //     s1 = Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]));
    //     s2 = Math.sqrt((p3[0] - p2[0]) * (p3[0] - p2[0]) + (p3[1] - p2[1]) * (p3[1] - p2[1]));
    //     if (s1 <= s2) {
    //         width = s1;
    //         height = s2;
    //         // Determine start and end points of the width-side and height-side
    //         wSide = [p1, p2];
    //         hSide = [p2, p3];
    //     } else {
    //         width = s2;
    //         height = s1;
    //         // Determine start and end points of the width-side and height-side
    //         wSide = [p2, p3];
    //         hSide = [p1, p2];
    //     }
    //     // Calculate height and width of the triangles and number of rows
    //     triangleWidth = width / stepsU;

    //     if (stepsV === undefined || stepsV === 0) {
    //         // Equilateral triangles, depending on parameter "stepsU"
    //         triangleHeight = (triangleWidth * Math.sqrt(3)) / 2;
    //         numRows = Math.round(height / triangleHeight);
    //     } else {
    //         // Two parameters stepsU, stepsV
    //         numRows = stepsV;
    //         triangleHeight = height / numRows;
    //     }

    //     // Calculate values of "shifting vectors"
    //     widthX = (wSide[1][0] - wSide[0][0]) / stepsU;
    //     widthY = (wSide[1][1] - wSide[0][1]) / stepsU;
    //     heightX = (hSide[1][0] - hSide[0][0]) / numRows;
    //     heightY = (hSide[1][1] - hSide[0][1]) / numRows;

    //     oddPoints = [];
    //     evenPoints = [];

    //     // Push coordinates of the base point (p1)
    //     coords.push([p1[0], p1[1]]);
    //     evenPoints.push(coords.length - 1);

    //     // Calculate point coordinates of layer 0 and store indices in evenPoints
    //     for (i = 1; i <= stepsU; i++) {
    //         coords.push([p1[0] + i * widthX, p1[1] + i * widthY]); // Points first line
    //         evenPoints.push(coords.length - 1);
    //     }

    //     for (i = 1; i <= numRows; i++) {
    //         if (i % 2 === 0) {
    //             // Points and faces of layers with an even index

    //             evenPoints = [];
    //             // Calculate first point coordinates within the layer
    //             coords.push([
    //                 p1[0] + i * heightX,
    //                 p1[1] + i * heightY
    //             ]);
    //             // evenPoints stores index of the first point of the layer
    //             evenPoints.push(coords.length - 1);
    //             // Calculate all other point coordinates within the layer
    //             for (j = 1; j <= stepsU; j++) {
    //                 coords.push([
    //                     coords[evenPoints[0]][0] + j * widthX,
    //                     coords[evenPoints[0]][1] + j * widthY
    //                 ]);
    //                 //evenPoints stores index of the most recently calculated point of the layer
    //                 evenPoints.push(coords.length - 1);
    //             }
    //             // Connect the faces of the row by grouping indices of points
    //             faces.push([evenPoints[0], oddPoints[0], oddPoints[1]]);
    //             for (j = 1; j <= stepsU; j++) {
    //                 faces.push([evenPoints[j - 1], oddPoints[j], evenPoints[j]]);
    //                 faces.push([evenPoints[j], oddPoints[j], oddPoints[j + 1]]);
    //             }
    //         } else {
    //             // Points and faces of layers with an odd index

    //             oddPoints = [];
    //             // Calculate first point coordinates within the layer
    //             coords.push([
    //                 p1[0] + i * heightX,
    //                 p1[1] + i * heightY
    //             ]);
    //             // oddPoints stores index of the first point of the layer
    //             oddPoints.push(coords.length - 1);
    //             // Calculate all other point coordinates within the layer except for the last point
    //             for (j = 1; j <= stepsU; j++) {
    //                 coords.push([
    //                     coords[oddPoints[0]][0] + j * widthX - widthX / 2,
    //                     coords[oddPoints[0]][1] + j * widthY - widthY / 2
    //                 ]);
    //                 // oddPoints stores index of the most recently calculated point of the layer
    //                 oddPoints.push(coords.length - 1);
    //             }
    //             // Calculate last point coordinates within the layer
    //             coords.push([
    //                 coords[oddPoints[0]][0] + stepsU * widthX,
    //                 coords[oddPoints[0]][1] + stepsU * widthY
    //             ]);
    //             // oddPoints stores index of last point within the layer
    //             oddPoints.push(coords.length - 1);
    //             // Connect the faces of the row by grouping indices of points
    //             faces.push([oddPoints[0], evenPoints[0], oddPoints[1]]);
    //             for (j = 1; j <= stepsU; j++) {
    //                 faces.push([oddPoints[j], evenPoints[j - 1], evenPoints[j]]);
    //                 faces.push([oddPoints[j], evenPoints[j], oddPoints[j + 1]]);
    //             }
    //         }
    //     }

    //     return [coords, faces];
    // },

    // rectangulation_old: function (p1, p2, p3, p4, stepsU, stepsV) {
    //     // Vectors used for checking if the given coordinates create a rectangle
    //     var vec1 = [p2[0] - p1[0], p2[1] - p1[1]],
    //         vec2 = [p3[0] - p2[0], p3[1] - p2[1]],
    //         vec3 = [p4[0] - p3[0], p4[1] - p3[1]],
    //         vec4 = [p1[0] - p4[0], p1[1] - p4[1]],

    //         coords = [],
    //         faces = [],
    //         wSide, hSide,
    //         s1, s2,
    //         i, j,
    //         widthX, widthY,
    //         heightX, heightY,
    //         startPointLayer;

    //     // Check if the given coordinates create a rectangle, otherwise an exception is thrown
    //     if (
    //         vec1[0] * vec4[0] + vec1[1] * vec4[1] !== 0 ||
    //         vec2[0] * vec1[0] + vec2[1] * vec1[1] !== 0 ||
    //         vec3[0] * vec2[0] + vec3[1] * vec2[1] !== 0 ||
    //         vec4[0] * vec3[0] + vec4[1] * vec3[1] !== 0
    //     ) {
    //         throw new Error("rectangulation_old: area is not rectangle  ");
    //         // console.log("rectangulation_old: area is not rectangle  ");
    //     }

    //     // Set initial values for wSide, hSide
    //     wSide = [0, 0];
    //     hSide = [0, 0];

    //     // Check for longer side of rectangle:
    //     // longer side is appointed height, shorter side is appointed width
    //     // s1 = Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]));
    //     // s2 = Math.sqrt((p3[0] - p2[0]) * (p3[0] - p2[0]) + (p3[1] - p2[1]) * (p3[1] - p2[1]));
    //     s1 = Mat.hypot(vec1[0], vec1[1]);
    //     s2 = Mat.hypot(vec2[0], vec2[1]);

    //     if (s1 <= s2) {
    //         // Determine start and end points of the width-side and height-side
    //         wSide = [p1, p2];
    //         hSide = [p2, p3];
    //     } else {
    //         // Determine start and end points of the width-side and height-side
    //         wSide = [p2, p3];
    //         hSide = [p1, p2];
    //     }

    //     // Calculate values of "shifting vectors"
    //     widthX = (wSide[1][0] - wSide[0][0]) / stepsV;
    //     widthY = (wSide[1][1] - wSide[0][1]) / stepsV;
    //     heightX = (hSide[1][0] - hSide[0][0]) / stepsU;
    //     heightY = (hSide[1][1] - hSide[0][1]) / stepsU;

    //     // Initialize startPointLayer that stores coordinates of the first point of the current layer
    //     startPointLayer = [];

    //     // Push coordinates of base point (p1)
    //     coords.push([p1[0], p1[1]]);
    //     startPointLayer = coords[0];

    //     // Calculate point coordinates of layer 0
    //     for (j = 1; j <= stepsV; j++) {
    //         coords.push([startPointLayer[0] + j * widthX, startPointLayer[1] + j * widthY]);
    //     }

    //     for (i = 1; i <= stepsU; i++) {
    //         startPointLayer = [];

    //         // Calculate point coordinates of first point of layer
    //         coords.push([
    //             p1[0] + i * heightX,
    //             p1[1] + i * heightY
    //         ]);
    //         startPointLayer = coords[coords.length - 1];

    //         // Calculating remaining point coordinates of layer
    //         for (j = 1; j <= stepsV; j++) {
    //             coords.push([
    //                 startPointLayer[0] + j * widthX,
    //                 startPointLayer[1] + j * widthY
    //             ]);
    //         }

    //         // Connect rectangles by grouping indices of points
    //         for (
    //             j = coords.length - stepsV - 1;
    //             j < coords.length - 1;
    //             j++
    //         ) {
    //             faces.push([j, j - stepsV - 1, j - stepsV, j + 1]);
    //         }
    //     }

    //     return [coords, faces];
    // },

    // /**
    //  * This function creates an array of dynamic 3-dimensional points
    //  * based on an array of pairs of two coordinates.
    //  * It uses a mathematical function to assign a third coordinate (the z-coordinate)
    //  * to each pair of two coordinates.
    //  * The 3-dimensional points are not stored directly.
    //  * Instead the array stores JavaScript functions that utilize the mentioned mathematical function
    //  * to return an array of three coordinates.
    //  * This allows the recognition and proper visualization of changes to the underlying
    //  * mathematical function.
    //  * @name mapMeshTo3D
    //  * @param {Array} surface
    //  * @param {Parametricsurface3d} el
    //  * @returns {Array} dynamicPoints array of [x, y, z] coordinates
    //  *
    //  * @private
    //  * @memberof JXG.Math.Tiling
    //  */
    // mapMeshTo3D: function (surface, el) {
    //     var dynamicPoints = [], i;

    //     for (i = 0; i < surface[0].length; i++) {
    //         dynamicPoints.push(
    //             (function (u, v) {
    //                 return function(x, y) { return el.F(u, v); };
    //             })(surface[0][i][0], surface[0][i][1])
    //         ); // Capture values explicitly
    //         // dynamicPoints.push(
    //         //     (function (u, v) {
    //         //         return function(x, y) { return el.F(Type.evaluate(u), Type.evaluate(v)); };
    //         //     })(surface[0][i][0], surface[0][i][1])
    //         // ); // Capture values explicitly
    //     }

    //     return dynamicPoints;
    // }
};

export default Mat.Tiling;
