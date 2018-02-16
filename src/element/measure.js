/*
    Copyright 2008-2018
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

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
 jxg
 utils/type
 base/element
  elements:
   point
   segment
   ticks
 */

/**
 * @fileoverview Geometry objects for measurements are defined in this file. This file stores all
 * style and functional properties that are required to use a tape measure on
 * a board.
 */

define([
    'jxg', 'utils/type', 'base/element', 'base/point', 'base/line', 'base/ticks'
], function (JXG, Type, GeometryElement, Point, Line, Ticks) {

    "use strict";

    /**
     * @class A tape measure can be used to measure distances between points.
     * @pseudo
     * @description
     * @name Tapemeasure
     * @augments Segment
     * @constructor
     * @type JXG.Segment
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Array_Array} start,end, The two arrays give the initial position where the tape measure
     * is drawn on the board.
     * @example
     * // Create atape measure
     * var p1 = board.create('point', [0,0]);
     * var p2 = board.create('point', [1,1]);
     * var p3 = board.create('point', [3,1]);
     * var tape = board.create('tapemeasure', [[1, 2], [4, 2]], {name:'dist'});
     * </pre><div class="jxgbox" id="6d9a2cda-22fe-4cd1-9d94-34283b1bdc01" style="width: 200px; height: 200px;"></div>
     * <script type="text/javascript">
     *   (function () {
     *     var board = JXG.JSXGraph.initBoard('6d9a2cda-22fe-4cd1-9d94-34283b1bdc01', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
     *     var p1 = board.create('point', [0,0]);
     *     var p2 = board.create('point', [1,1]);
     *     var p3 = board.create('point', [3,1]);
     *     var tape = board.create('tapemeasure', [[1, 2], [4, 2]], {name:'dist'} );
     *   })();
     * </script><pre>
     */
    JXG.createTapemeasure = function (board, parents, attributes) {
        var pos0, pos1,
            attr, withTicks, withText, precision,
            li, p1, p2, n, ti;

        pos0 = parents[0];
        pos1 = parents[1];

        // start point
        attr = Type.copyAttributes(attributes, board.options, 'tapemeasure', 'point1');
        p1 = board.create('point', pos0,  attr);

        // end point
        attr = Type.copyAttributes(attributes, board.options, 'tapemeasure', 'point2');
        p2 = board.create('point', pos1,  attr);

        p1.setAttribute({ignoredSnapToPoints: [p2]});
        p2.setAttribute({ignoredSnapToPoints: [p1]});

        // tape measure line
        attr = Type.copyAttributes(attributes, board.options, 'tapemeasure');
        withTicks = attr.withticks;
        withText = attr.withlabel;
        precision = attr.precision;

        // Below, we will replace the label by the measurement function.
        if (withText) {
            attr.withlabel = true;
        }
        li = board.create('segment', [p1, p2], attr);
        // p1, p2 are already added to li.inherits

        if (withText) {
            if (attributes.name && attributes.name !== '') {
                n = attributes.name + ' = ';
            } else {
                n = '';
            }
            li.label.setText(function () {
                return n + Type.toFixed(p1.Dist(p2), precision);
            });
        }

        if (withTicks) {
            attr = Type.copyAttributes(attributes, board.options, 'tapemeasure', 'ticks');
            //ticks  = 2;
            ti = board.create('ticks', [li, 0.1], attr);
            li.inherits.push(ti);
        }

        // override the segments's remove method to ensure the removal of all elements
        /** @ignore */
        li.remove = function () {
            if (withTicks) {
                li.removeTicks(ti);
            }

            board.removeObject(p2);
            board.removeObject(p1);

            GeometryElement.prototype.remove.call(this);
        };

        /** @ignore */
        li.Value = function () {
            return p1.Dist(p2);
        };

        p1.dump = false;
        p2.dump = false;

        li.elType = 'tapemeasure';
        li.getParents = function() {
            return [[p1.X(), p1.Y()], [p2.X(), p2.Y()]];
        };

        li.subs = {
            point1: p1,
            point2: p2
        };

        if (withTicks) {
            ti.dump = false;
        }

        li.methodMap = JXG.deepCopy(li.methodMap, {
            Value: 'Value'
        });

        li.prepareUpdate().update();
        if (!board.isSuspendedUpdate) {
            li.updateVisibility().updateRenderer();
            // The point updates are necessary in case of snapToGrid==true
            li.point1.updateVisibility().updateRenderer();
            li.point2.updateVisibility().updateRenderer();
        }

        return li;
    };

    JXG.registerElement('tapemeasure', JXG.createTapemeasure);

    return {
        createTapemeasure: JXG.createTapemeasure
    };
});
