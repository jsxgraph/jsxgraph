/*
    Copyright 2008-2022
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */
/*global JXG:true, define: true*/

define(['jxg', 'utils/type'], function (JXG, Type) {
    "use strict";

    /**
     * @class This element creates a 3D parametric surface.
     * @pseudo
     * @description A 3D parametric surface is defined by a function
     *    <i>F: R<sup>2</sup> &rarr; R<sup>3</sup></i>.
     *
     * @name ParametricSurface3D
     * @augments Curve
     * @constructor
     * @type Object
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Function_Function_Function_Array_Array} F<sub>X</sub>,F<sub>Y</sub>,F<sub>Z</sub>,rangeX,rangeY
     * F<sub>X</sub>(u,v), F<sub>Y</sub>(u,v), F<sub>Z</sub>(u,v) are functions returning a number, rangeU is the array containing
     * lower and upper bound for the range of parameter u, rangeV is the array containing
     * lower and upper bound for the range of parameter v. rangeU and rangeV may also be functions returning an array of length two.
     * @example
     * var view = board.create('view3d',
     * 		        [[-6, -3], [8, 8],
     * 		        [[-5, 5], [-5, 5], [-5, 5]]]);
     *
     * // Sphere
     * var c = view.create('parametricsurface3d', [
     *     (u, v) => 2 * Math.sin(u) * Math.cos(v),
     *     (u, v) => 2 * Math.sin(u) * Math.sin(v),
     *     (u, v) => 2 * Math.cos(u),
     *     [0, 2 * Math.PI],
     *     [0, Math.PI]
     * ], {
     *     strokeColor: '#ff0000',
     *     stepsU: 30,
     *     stepsV: 30
     * });
     *
     * </pre><div id="JXG52da0ecc-1ba9-4d41-850c-36e5120025a5" class="jxgbox" style="width: 500px; height: 500px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG52da0ecc-1ba9-4d41-850c-36e5120025a5',
     *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
     *     var view = board.create('view3d',
     *     		        [[-6, -3], [8, 8],
     *     		        [[-5, 5], [-5, 5], [-5, 5]]]);
     *
     *     // Sphere
     *     var c = view.create('parametricsurface3d', [
     *         (u, v) => 2 * Math.sin(u) * Math.cos(v),
     *         (u, v) => 2 * Math.sin(u) * Math.sin(v),
     *         (u, v) => 2 * Math.cos(u),
     *         [0, 2 * Math.PI],
     *         [0, Math.PI]
     *     ], {
     *         strokeColor: '#ff0000',
     *         stepsU: 20,
     *         stepsV: 20
     *     });
     *
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createParametricSurface3D = function (board, parents, attributes) {
        var view = parents[0],
            attr,
            X = parents[1],
            Y = parents[2],
            Z = parents[3],
            range_u = parents[4],
            range_v = parents[5],
            D3, el;

        D3 = {
            elType: 'surface3d',
            X: X,
            Y: Y,
            Z: Z,
            range_u: range_u,
            range_v: range_v
        };
        attr = Type.copyAttributes(attributes, board.options, 'surface3d');
        el = board.create('curve', [[], []], attr);
        el.updateDataArray = function () {
            var steps_u = Type.evaluate(this.visProp.stepsu),
                steps_v = Type.evaluate(this.visProp.stepsv),
                r_u = Type.evaluate(this.D3.range_u), // Type.evaluate(range_u),
                r_v = Type.evaluate(this.D3.range_v), // Type.evaluate(range_v),
                res = view.getMesh(this.D3.X, this.D3.Y, this.D3.Z,
                    r_u.concat([steps_u]),
                    r_v.concat([steps_v]));
            this.dataX = res[0];
            this.dataY = res[1];
        };
        el.D3 = D3;

        return el;
    };
    JXG.registerElement('parametricsurface3d', JXG.createParametricSurface3D);

    /**
     * @class This element creates a 3D function graph.
     * @pseudo
     * @description A 3D function graph is defined by a function
     *    <i>F: R<sup>2</sup> &rarr; R</i>.
     *
     * @name Functiongraph3D
     * @augments ParametricSurface3D
     * @constructor
     * @type Object
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Function_Array_Array} F,rangeX,rangeY  F(x,y) is a function returning a number, rangeX is the array containing
     * lower and upper bound for the range of x, rangeY is the array containing
     * lower and upper bound for the range of y.
     * @example
     * var box = [-5, 5];
     * var view = board.create('view3d',
     *     [
     *         [-6, -3], [8, 8],
     *         [box, box, box]
     *     ],
     *     {
     *         xPlaneRear: {visible: false},
     *         yPlaneRear: {visible: false},
     *     });
     *
     * // Function F to be plotted
     * var F = (x, y) => Math.sin(x * y / 4);
     *
     * // 3D surface
     * var c = view.create('functiongraph3d', [
     *     F,
     *     box, // () => [-s.Value()*5, s.Value() * 5],
     *     box, // () => [-s.Value()*5, s.Value() * 5],
     * ], {
     *     strokeWidth: 0.5,
     *     stepsU: 70,
     *     stepsV: 70
     * });
     *
     * </pre><div id="JXG87646dd4-9fe5-4c21-8734-089abc612515" class="jxgbox" style="width: 500px; height: 500px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG87646dd4-9fe5-4c21-8734-089abc612515',
     *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
     *     var box = [-5, 5];
     *     var view = board.create('view3d',
     *         [
     *             [-6, -3], [8, 8],
     *             [box, box, box]
     *         ],
     *         {
     *             xPlaneRear: {visible: false},
     *             yPlaneRear: {visible: false},
     *         });
     *
     *     // Function F to be plotted
     *     var F = (x, y) => Math.sin(x * y / 4);
     *
     *     // 3D surface
     *     var c = view.create('functiongraph3d', [
     *         F,
     *         box, // () => [-s.Value()*5, s.Value() * 5],
     *         box, // () => [-s.Value()*5, s.Value() * 5],
     *     ], {
     *         strokeWidth: 0.5,
     *         stepsU: 70,
     *         stepsV: 70
     *     });
     *
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createFunctiongraph3D = function (board, parents, attributes) {
        var view = parents[0],
            X = function(u, v) { return u; },
            Y = function(u, v) { return v; },
            Z = parents[1],
            range_u = parents[2],
            range_v = parents[3];

        return view.create('parametricsurface3d', [X, Y, Z, range_u, range_v], attributes);
    };
    JXG.registerElement('functiongraph3d', JXG.createFunctiongraph3D);

});
