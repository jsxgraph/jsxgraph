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
 * The JXG.Math.Tiling namespace. Used to prepare tilings used to plot {@link Surface3D} with {@link Polyhedron3D}.
 * @name JXG.Math.Tiling
 * @exports Mat.Tiling as JXG.Math.Tiling
 * @namespace
 */
Mat.Tiling = {
    /**
     * Triangulate (partition it into triangles) a given two dimensional domain.
     * The number of triangles the original rectangle is divided into depends on the parameters` `stepsU` and `stepsV`.
     * Input are the ranges of \\(u\\) and \\(v\\), as well as `stepsU` and `stepsV` which are static.
     * If the optional parameter `stepsV` is not given or is equal to 0, the rectangle is partitioned into
     * nearly equilateral triangles.
     * Otherwise, the shape of the triangles depends on the ratio of `stepsU / stepsV`.
     *
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
     * var rg = board.create('slider', [[-7, -7], [3, -7], [1, 4, 5]], { name: 'rg' }); // range
     *
     * var box = [-5, 5];
     * var view = board.create('view3d',
     *     [[-5, -3], [8, 8],
     *     [box, box, box]],
     *     {
     *         projection: 'central',
     *         xPlaneRear: { visible: false },
     *         yPlaneRear: { visible: false },
     *         zPlaneRear: { visible: false }
     *     });
     *
     * var range = [() => -rg.Value(), () => rg.Value()],
     *     stepsU = 25,
     *     // stepsV = 25,
     *     F = (x, y) => [x, y, 3 * Math.sin(Math.sqrt(x ** 2 + y ** 2))];
     *
     * view.setView(0, Math.PI / 2); // Set view from above
     *
     * var el = { F: F }; // Fake surface3d element
     *
     * // stepsV not supplied -> approx. equilater triangles
     * var surface = JXG.Math.Tiling.triangulation(el, range, range, stepsU);
     * var pol = view.create('polyhedron3d', surface, {
     *     shader: {
     *         enabled: true,
     *         light: {
     *             dir: 0
     *         }
     *     },
     *     fillColorArray: ['white'],
     *     fillOpacity: 0.9,
     *     strokeWidth: 0.2
     * });
     *
     * </pre><div id="JXG37cb3ef3-a818-4114-97b6-954d0189e0fb" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG37cb3ef3-a818-4114-97b6-954d0189e0fb',
     *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: { enabled: false }, showcopyright: false, shownavigation: false});
     *     var rg = board.create('slider', [[-7, -7], [3, -7], [1, 4, 5]], { name: 'rg' });
     *
     *     var box = [-5, 5];
     *     var view = board.create('view3d',
     *         [[-5, -3], [8, 8],
     *         [box, box, box]],
     *         {
     *             projection: 'central',
     *             xPlaneRear: { visible: false },
     *             yPlaneRear: { visible: false },
     *             zPlaneRear: { visible: false }
     *         });
     *
     *     var range = [() => -rg.Value(), () => rg.Value()],
     *         stepsU = 25,
     *         stepsV = 25,
     *         F = (x, y) => [x, y, 3 * Math.sin(Math.sqrt(x ** 2 + y ** 2))];
     *     view.setView(0, Math.PI / 2);
     *
     *     var el = { F: F }; // Fake surface3d element
     *
     *     var surface = JXG.Math.Tiling.triangulation(el, range, range, stepsU);
     *     var pol = view.create('polyhedron3d', surface, {
     *         shader: {
     *             enabled: true,
     *             light: {
     *                 dir: 0
     *             }
     *         },
     *         fillColorArray: ['white'],
     *         fillOpacity: 0.9,
     *         strokeWidth: 0.2
     *     });
     *
     *     })();
     *
     * </script><pre>
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
     * The number of rectangles the original rectangle is divided into depends on the parameters `stepsU` and `stepsV`.
     * Input are the ranges of \\(u\\) and \\(v\\), as well as `stepsU` and `stepsV` which are static.
     *
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
     * var rg = board.create('slider', [[-7, -7], [3, -7], [1, 4, 5]], { name: 'rg' });
     *
     * var box = [-5, 5];
     * var view = board.create('view3d',
     *     [[-5, -3], [8, 8],
     *     [box, box, box]],
     *     {
     *         projection: 'central',
     *         // axesPosition: 'center',
     *         xPlaneRear: { visible: false },
     *         yPlaneRear: { visible: false },
     *         zPlaneRear: { visible: false }
     *     });
     *
     * var range = [() => -rg.Value(), () => rg.Value()],
     *     stepsU = 15,
     *     stepsV = 5,
     *     F = (x, y) => [x, y, 3 * Math.sin(Math.sqrt(x ** 2 + y ** 2))];
     *
     * view.setView(0, Math.PI / 2);  // Set view from above
     *
     * var el = { F: F }; // Fake surface3d element
     *
     * var surface = JXG.Math.Tiling.rectangulation(el, range, range, stepsU, stepsV);
     * var pol = view.create('polyhedron3d', surface, {
     *     shader: {
     *         enabled: true,
     *         light: {
     *             dir: 0
     *         }
     *     },
     *     fillColorArray: ['white'],
     *     fillOpacity: 0.9,
     *     strokeWidth: 0.2
     * });
     *
     * </pre><div id="JXG8c99ffea-7edc-494a-b416-34d9c154d310" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG8c99ffea-7edc-494a-b416-34d9c154d310',
     *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: { enabled: false }, showcopyright: false, shownavigation: false});
     *     var rg = board.create('slider', [[-7, -7], [3, -7], [1, 4, 5]], { name: 'rg' });
     *
     *     var box = [-5, 5];
     *     var view = board.create('view3d',
     *         [[-5, -3], [8, 8],
     *         [box, box, box]],
     *         {
     *             projection: 'central',
     *             // axesPosition: 'center',
     *             xPlaneRear: { visible: false },
     *             yPlaneRear: { visible: false },
     *             zPlaneRear: { visible: false }
     *         });
     *
     *     var range = [() => -rg.Value(), () => rg.Value()],
     *         stepsU = 15,
     *         stepsV = 5,
     *         F = (x, y) => [x, y, 3 * Math.sin(Math.sqrt(x ** 2 + y ** 2))];
     *
     *     view.setView(0, Math.PI / 2);
     *
     *     var el = { F: F }; // Fake surface3d element
     *
     *     var surface = JXG.Math.Tiling.rectangulation(el, range, range, stepsU, stepsV);
     *     var pol = view.create('polyhedron3d', surface, {
     *         shader: {
     *             enabled: true,
     *             light: {
     *                 dir: 0
     *             }
     *         },
     *         fillColorArray: ['white'],
     *         fillOpacity: 0.9,
     *         strokeWidth: 0.2
     *     });
     *
     *     })();
     *
     * </script><pre>
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
};

export default Mat.Tiling;
