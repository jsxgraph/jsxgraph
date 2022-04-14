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