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

JXG.createTicks3D = function (board, parents, attributes) {
    var view = parents[0],
        point = parents[1],
        dir1 = parents[2],
        range1 = parents[3],
        dir2 = parents[4],
        el, attr;

    attr = Type.copyAttributes(attributes, board.options, 'ticks3d');
    el = view.create("curve", [[], []], attr);

    el.drawLabels = function(attr) {
        var s1 = range1[0],
            e1 = range1[1],
            step = Type.evaluate(this.visProp.ticksdistance),
            range2 = Type.evaluate(this.visProp.tickendings),
            mh =  Type.evaluate(this.visProp.majorheight),
            e2,
            l1, l2,
            i,
            u, val, p,
            v1 = [0, 0, 0],
            v2 = [0, 0, 0],
            q = [0, 0, 0],
            labels = [];

        mh /= Math.sqrt(board.unitX * board.unitY); // Very crude estimation of tick length
        e2 = mh * range2[1] * 2;

        this.dataX = [];
        this.dataY = [];

        if (Type.isFunction(point)) {
            q = point().slice(1);
        } else {
            for (i = 0; i < 3; i++) {
                q[i] = Type.evaluate(point[i]);
            }
        }
        for (i = 0; i < 3; i++) {
            v1[i] = Type.evaluate(dir1[i]);
            v2[i] = Type.evaluate(dir2[i]);
        }

        l1 = JXG.Math.norm(v1, 3);
        l2 = JXG.Math.norm(v2, 3);
        for (i = 0; i < 3; i++) {
            v1[i] /= l1;
            v2[i] /= l2;
        }

        if (Math.abs(step) < Mat.eps) {
            return;
        }
        for (u = s1; u <= e1; u += step) {
            // Label
            p = [
                q[0] + u * v1[0] + e2 * v2[0],
                q[1] + u * v1[1] + e2 * v2[1],
                q[2] + u * v1[2] + e2 * v2[2]
            ];
            for (i = 0; i < 3; i++) {
                if (v1[i] !== 0) {
                    val = q[i] + u * v1[i];
                }
            }
            labels.push(view.create('text3d', [p, val], attr));
        }
        return labels;
    };

    if (Type.evaluate(el.visProp.drawlabels)) {
        el.labels = el.drawLabels(attr.label);
    }

    /**
     * @ignore
     */
    el.updateDataArray = function () {
        var s1 = range1[0],
            e1 = range1[1],
            step = Type.evaluate(this.visProp.ticksdistance),
            range2 = Type.evaluate(this.visProp.tickendings),
            mh =  Type.evaluate(this.visProp.majorheight),
            s2, e2,
            l1, l2,
            i,
            u, c2d, p,
            v1 = [0, 0, 0],
            v2 = [0, 0, 0],
            q = [0, 0, 0];

        mh /= Math.sqrt(board.unitX * board.unitY); // Very crude estimation of tick length
        s2 = mh * (-range2[0]);
        e2 = mh * range2[1];

        this.dataX = [];
        this.dataY = [];

        if (Type.isFunction(point)) {
            q = point().slice(1);
        } else {
            for (i = 0; i < 3; i++) {
                q[i] = Type.evaluate(point[i]);
            }
        }
        for (i = 0; i < 3; i++) {
            v1[i] = Type.evaluate(dir1[i]);
            v2[i] = Type.evaluate(dir2[i]);
        }

        l1 = JXG.Math.norm(v1, 3);
        l2 = JXG.Math.norm(v2, 3);
        for (i = 0; i < 3; i++) {
            v1[i] /= l1;
            v2[i] /= l2;
        }

        if (Math.abs(step) < Mat.eps) {
            return;
        }
        for (u = s1; u <= e1; u += step) {
            p = [
                q[0] + u * v1[0] + s2 * v2[0],
                q[1] + u * v1[1] + s2 * v2[1],
                q[2] + u * v1[2] + s2 * v2[2]
            ];
            c2d = view.project3DTo2D(p);
            this.dataX.push(c2d[1]);
            this.dataY.push(c2d[2]);
            p = [
                q[0] + u * v1[0] + e2 * v2[0],
                q[1] + u * v1[1] + e2 * v2[1],
                q[2] + u * v1[2] + e2 * v2[2]
            ];
            c2d = view.project3DTo2D(p);
            this.dataX.push(c2d[1]);
            this.dataY.push(c2d[2]);
            this.dataX.push(NaN);
            this.dataY.push(NaN);
        }
    };

    return el;
};

JXG.registerElement("ticks3d", JXG.createTicks3D);
