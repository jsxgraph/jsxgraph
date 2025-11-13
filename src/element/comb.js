/*
    Copyright 2018-2025
        Alfred Wassermann,
        Tigran Saluev

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

/**
 * @fileoverview In this file the Comb element is defined.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * @class A marker to display domains of inequalities.
 * The comb element is defined by two points.
 * @pseudo
 * @name Comb
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent
 *  objects an exception is thrown.
 * Parameter options:
 * @param {JXG.Point,array,function_JXG.Point,array,function} point1,point2 Parent elements
 * can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point
 * will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point,
 * instead of providing an array or a point.
 * @example
 * // Create a simple horizontal comb with invisible endpoints
 * var c = board.create('comb', [[1, 0], [3, 0]]);
 *
 * </pre><div class="jxgbox" id="JXG951ccb6a-52bc-4dc2-80e9-43db064f0f1b" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG951ccb6a-52bc-4dc2-80e9-43db064f0f1b', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false}),
 *     c = board.create('comb', [[1, 0], [3, 0]]);
 * })();
 * </script><pre>
 *
 * @example
 * var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
 * var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
 * var c1 = board.create('comb', [p1, p2], {width: 0.2, frequency: 0.1, angle: Math.PI / 4});
 *
 * </pre><div id="JXG04186fd2-6340-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG04186fd2-6340-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
 *     var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
 *     var c1 = board.create('comb', [p1, p2], {width: 0.2, frequency: 0.1, angle: Math.PI / 4});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var s = board.create('slider', [[1,3], [4,3], [0.1, 0.3, 0.8]]);
 * var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
 * var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
 * var c1 = board.create('comb', [p1, p2], {
 *     width: function(){ return 4*s.Value(); },
 *     reverse: function(){ return (s.Value()<0.5) ? false : true; },
 *     frequency: function(){ return s.Value(); },
 *     angle: function(){ return s.Value() * Math.PI / 2; },
 *     curve: {
 *         strokeColor: 'red'
 *     }
 * });
 *
 * </pre><div id="JXG6eb1bcd1-407e-4f13-8f0c-45ef39a0cfb3" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6eb1bcd1-407e-4f13-8f0c-45ef39a0cfb3',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1,3], [4,3], [0.1, 0.3, 0.8]]);
 *     var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
 *     var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
 *     var c1 = board.create('comb', [p1, p2], {
 *         width: function(){ return 4*s.Value(); },
 *         reverse: function(){ return (s.Value()<0.5) ? false : true; },
 *         frequency: function(){ return s.Value(); },
 *         angle: function(){ return s.Value() * Math.PI / 2; },
 *         curve: {
 *             strokeColor: 'red'
 *         }
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createComb = function (board, parents, attributes) {
    var p1, p2, c, attr, parent_types;
    //ds, angle, width, p;

    if (parents.length === 2) {
        // point 1 given by coordinates
        if (Type.isArray(parents[0]) && parents[0].length > 1) {
            attr = Type.copyAttributes(attributes, board.options, "comb", 'point1');
            p1 = board.create("point", parents[0], attr);
        } else if (Type.isString(parents[0]) || Type.isPoint(parents[0])) {
            p1 = board.select(parents[0]);
        } else if (Type.isFunction(parents[0]) && Type.isPoint(parents[0]())) {
            p1 = parents[0]();
        } else if (
            Type.isFunction(parents[0]) &&
            parents[0]().length &&
            parents[0]().length >= 2
        ) {
            attr = Type.copyAttributes(attributes, board.options, "comb", 'point1');
            p1 = JXG.createPoint(board, parents[0](), attr);
        } else {
            throw new Error(
                "JSXGraph: Can't create comb with parent types '" +
                    typeof parents[0] +
                    "' and '" +
                    typeof parents[1] +
                    "'." +
                    "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]"
            );
        }

        // point 2 given by coordinates
        if (Type.isArray(parents[1]) && parents[1].length > 1) {
            attr = Type.copyAttributes(attributes, board.options, "comb", 'point2');
            p2 = board.create("point", parents[1], attr);
        } else if (Type.isString(parents[1]) || Type.isPoint(parents[1])) {
            p2 = board.select(parents[1]);
        } else if (Type.isFunction(parents[1]) && Type.isPoint(parents[1]())) {
            p2 = parents[1]();
        } else if (
            Type.isFunction(parents[1]) &&
            parents[1]().length &&
            parents[1]().length >= 2
        ) {
            attr = Type.copyAttributes(attributes, board.options, "comb", 'point2');
            p2 = JXG.createPoint(board, parents[1](), attr);
        } else {
            throw new Error(
                "JSXGraph: Can't create comb with parent types '" +
                    typeof parents[0] +
                    "' and '" +
                    typeof parents[1] +
                    "'." +
                    "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]"
            );
        }
    } else {
        parent_types = parents.map(function (parent) {
            return "'" + typeof parent + "'";
        });
        throw new Error(
            "JSXGraph: Can't create comb with parent types " +
                parent_types.join(", ") +
                "." +
                "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'comb');
    // Type.merge(attr, Type.copyAttributes(attributes, board.options, 'comb', 'curve'));
     c = board.create('curve', [[0], [0]], attr);

    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var s = 0,
            max_s = p1.Dist(p2),
            cs, sn, dx, dy, x, y, f,
            p1_inner = p1,
            p2_inner = p2,
            ds, angle, width;

        ds = c.evalVisProp('frequency');
        angle = -c.evalVisProp('angle');
        width = c.evalVisProp('width');
        if (c.evalVisProp('reverse')) {
            p1_inner = p2;
            p2_inner = p1;
            angle = -angle;
        }
        cs = Math.cos(angle);
        sn = Math.sin(angle);
        dx = (p2_inner.X() - p1_inner.X()) / max_s;
        dy = (p2_inner.Y() - p1_inner.Y()) / max_s;

        // But instead of lifting by sin(angle), we want lifting by width.
        cs *= width / Math.abs(sn);
        sn *= width / Math.abs(sn);

        this.dataX = [];
        this.dataY = [];
        // TODO Handle infinite bounds?
        while (s < max_s) {
            x = p1_inner.X() + dx * s;
            y = p1_inner.Y() + dy * s;

            // We may need to cut the last piece of a comb.
            f = Math.min(cs, max_s - s) / Math.abs(cs);
            sn *= f;
            cs *= f;

            this.dataX.push(x);
            this.dataY.push(y);

            this.dataX.push(x + dx * cs + dy * sn);
            this.dataY.push(y - dx * sn + dy * cs);

            this.dataX.push(NaN); // Force a jump
            this.dataY.push(NaN);
            s += ds;
        }
    };

    return c;
};

JXG.registerElement("comb", JXG.createComb);

// export default {
//     createComb: JXG.createComb
// };
