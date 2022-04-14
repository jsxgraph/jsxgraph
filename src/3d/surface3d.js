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

define(['jxg', 'utils/type', '3d/view3d'
], function (JXG, Type, ThreeD) {
    "use strict";
    ThreeD.createParametricSurface = function (board, parents, attributes) {
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
                res = view.getMesh(this.D3.X, this.D3.Y, this.D3.Z,
                    this.D3.range_u.concat([steps_u]),
                    this.D3.range_v.concat([steps_v]));
            this.dataX = res[0];
            this.dataY = res[1];
        };
        el.D3 = D3;

        return el;
    };
    JXG.registerElement('parametricsurface3d', ThreeD.createParametricSurface);

    ThreeD.createFunctiongraph = function (board, parents, attributes) {
        var view = parents[0],
            X = (u, v) => u,
            Y = (u, v) => v,
            Z = parents[1],
            range_u = parents[2],
            range_v = parents[3];

        return view.create('parametricsurface3d', [X, Y, Z, range_u, range_v], attributes);
    };
    JXG.registerElement('functiongraph3d', ThreeD.createFunctiongraph);

});