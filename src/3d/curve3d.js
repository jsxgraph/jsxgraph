/*global JXG:true, define: true*/

define(['jxg', 'utils/type', '3d/view3d'
], function (JXG, Type, ThreeD) {
    "use strict";

    ThreeD.createCurve = function (board, parents, attr) {
        var view = parents[0],
            D3, el;

        D3 = {
            elType: 'curve3D',
            X: parents[1],
            Y: parents[2],
            Z: parents[3],
        };
        D3.F = [D3.X, D3.Y, D3.Z];

        el = board.create('curve', [[], []], attr);
        el.D3 = D3;

        if (Type.isFunction(el.D3.X)) {
            // 3D curve given as t -> [X(t), Y(t), Z(t)]

            el.D3.range = parents[4];
            el.updateDataArray = function () {
                var steps = Type.evaluate(this.visProp.numberpointshigh),
                    s = Type.evaluate(this.D3.range[0]),
                    e = Type.evaluate(this.D3.range[1]),
                    delta = (e - s) / (steps - 1),
                    c2d, t, i,
                    p = [0, 0, 0];

                this.dataX = [];
                this.dataY = [];

                for (t = s; t <= e; t += delta) {
                    for (i = 0; i < 3; i++) {
                        p[i] = this.D3.F[i](t);
                    }
                    c2d = view.project3DTo2D(p);
                    this.dataX.push(c2d[1]);
                    this.dataY.push(c2d[2]);
                }
            };
        } else if (Type.isArray(el.D3.X)) {
            // 3D curve given as array of 3D points

            el.updateDataArray = function () {
                var i,
                    le = this.D3.X.length,
                    c2d;

                this.dataX = [];
                this.dataY = [];

                for (i = 0; i < le; i++) {
                    c2d = view.project3DTo2D([this.D3.X[i], this.D3.Y[i], this.D3.Z[i]]);
                    this.dataX.push(c2d[1]);
                    this.dataY.push(c2d[2]);
                }
            };
        }

        return el;
    };
    JXG.registerElement('curve3d', ThreeD.createCurve);

});