/*
    Copyright 2018
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 see define call
 */

/**
 * @fileoverview In this file the Comb element is defined.
 */

define([
    'jxg', 'options', 'utils/type', 'base/constants', 'base/line', 'base/polygon', 'base/point'
], function (JXG, Options, Type, Const, Line, Polygon, Point) {

    "use strict";

    /**
     * @class A comb to display domains of inequalities.
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
     * </pre><div class="jxgbox" id="951ccb6a-52bc-4dc2-80e9-43db064f0f1b" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('951ccb6a-52bc-4dc2-80e9-43db064f0f1b', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false}),
     *     c = board.create('comb', [[1, 0], [3, 0]]);
     * })();
     * </script><pre>
     *
     * @example
     * var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
     * var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
     * var c1 = board.create('comb', [p1, p2], {width: 0.2, frequency: 0.1, angle: Math.PI / 4});
     *
     * </pre><div id="04186fd2-6340-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('04186fd2-6340-11e8-9fb9-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var p1 = board.create('glider', [-3, 0, board.defaultAxes.x]);
     *     var p2 = board.create('glider', [-1, 0, board.defaultAxes.x]);
     *     var c1 = board.create('comb', [p1, p2], {width: 0.2, frequency: 0.1, angle: Math.PI / 4});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createComb = function(board, parents, attributes) {
        var p1, p2, c, attr, parent_types,
            ds, angle, width, p;

        if (parents.length === 2) {
            // point 1 given by coordinates
            if (Type.isArray(parents[0]) && parents[0].length > 1) {
                attr = Type.copyAttributes(attributes, board.options, 'comb', 'point1');
                p1 = board.create('point', parents[0], attr);
            } else if (Type.isString(parents[0]) || Type.isPoint(parents[0])) {
                p1 =  board.select(parents[0]);
            } else if (Type.isFunction(parents[0]) && Type.isPoint(parents[0]())) {
                p1 = parents[0]();
            } else if (Type.isFunction(parents[0]) && parents[0]().length && parents[0]().length >= 2) {
                attr = Type.copyAttributes(attributes, board.options, 'comb', 'point1');
                p1 = Point.createPoint(board, parents[0](), attr);
            } else {
                throw new Error("JSXGraph: Can't create comb with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]");
            }

            // point 2 given by coordinates
            if (Type.isArray(parents[1]) && parents[1].length > 1) {
                attr = Type.copyAttributes(attributes, board.options, 'comb', 'point2');
                p2 = board.create('point', parents[1], attr);
            } else if (Type.isString(parents[1]) || Type.isPoint(parents[1])) {
                p2 =  board.select(parents[1]);
            } else if (Type.isFunction(parents[1]) &&  Type.isPoint(parents[1]()) ) {
                p2 = parents[1]();
            } else if (Type.isFunction(parents[1]) && parents[1]().length && parents[1]().length >= 2) {
                attr = Type.copyAttributes(attributes, board.options, 'comb', 'point2');
                p2 = Point.createPoint(board, parents[1](), attr);
            } else {
                throw new Error("JSXGraph: Can't create comb with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]");
            }
        } else {
            parent_types = parents.map(function(parent) { return "'" + (typeof parent) + "'"; });
            throw new Error("JSXGraph: Can't create comb with parent types " +
                parent_types.join(", ") + "." +
                "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'comb', 'curve');
        c = board.create('curve', [[0], [0]], attr);

        attr = Type.copyAttributes(attributes, board.options, 'comb');
        ds = attr.frequency;
        angle = -attr.angle;
        width = attr.width;
        if (attr.reverse) {
            p = p1;
            p1 = p2;
            p2 = p;
            angle = -angle;
        }

        c.updateDataArray = function() {
            var s = 0,
                max_s = p1.Dist(p2),
                cs = Math.cos(angle),
                sn = Math.sin(angle),
                dx = (p2.X() - p1.X()) / max_s,
                dy = (p2.Y() - p1.Y()) / max_s,
                x, y, f;

            // But instead of lifting by sin(angle), we want lifting by width.
            cs *= width / Math.abs(sn);
            sn *= width / Math.abs(sn);

            this.dataX = [];
            this.dataY = [];
            // TODO Handle infinite boundaries?
            while (s < max_s) {
                x = p1.X() + dx * s;
                y = p1.Y() + dy * s;

                // We may need to cut the last piece of a comb.
                f = Math.min(cs, max_s - s) / Math.abs(cs);
                sn *= f;
                cs *= f;

                this.dataX.push(x);
                this.dataY.push(y);

                this.dataX.push(x + dx * cs + dy * sn);
                this.dataY.push(y - dx * sn + dy * cs);

                this.dataX.push(NaN);  // Force a jump
                this.dataY.push(NaN);
                s += ds;
            }
        };

        return c;
    };

    JXG.registerElement('comb', JXG.createComb);

    return {
        createComb: JXG.createComb
    };

});
