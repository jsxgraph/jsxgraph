/*
    Copyright 2008-2023
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview Geometry objects for measurements are defined in this file. This file stores all
 * style and functional properties that are required to use a tape measure on
 * a board.
 */

import JXG from "../jxg";
import Type from "../utils/type";
import GeometryElement from "../base/element";
import Prefix from "../parser/prefix";

/**
 * @class A tape measure can be used to measure distances between points.
 * @pseudo
 * @name Tapemeasure
 * @augments Segment
 * @constructor
 * @type JXG.Segment
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array} start,end, The two arrays give the initial position where the tape measure
 * is drawn on the board.
 * @example
 * // Create a tape measure
 * var p1 = board.create('point', [0,0]);
 * var p2 = board.create('point', [1,1]);
 * var p3 = board.create('point', [3,1]);
 * var tape = board.create('tapemeasure', [[1, 2], [4, 2]], {name:'dist'});
 * </pre><div class="jxgbox" id="JXG6d9a2cda-22fe-4cd1-9d94-34283b1bdc01" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('JXG6d9a2cda-22fe-4cd1-9d94-34283b1bdc01', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [0,0]);
 *     var p2 = board.create('point', [1,1]);
 *     var p3 = board.create('point', [3,1]);
 *     var tape = board.create('tapemeasure', [[1, 2], [4, 2]], {name:'dist'} );
 *   })();
 * </script><pre>
 */
JXG.createTapemeasure = function (board, parents, attributes) {
    var pos0, pos1, attr, withTicks, withText, digits, li, p1, p2, n, ti;

    pos0 = parents[0];
    pos1 = parents[1];

    // start point
    attr = Type.copyAttributes(attributes, board.options, "tapemeasure", "point1");
    p1 = board.create("point", pos0, attr);

    // end point
    attr = Type.copyAttributes(attributes, board.options, "tapemeasure", "point2");
    p2 = board.create("point", pos1, attr);

    p1.setAttribute({ ignoredSnapToPoints: [p2] });
    p2.setAttribute({ ignoredSnapToPoints: [p1] });

    // tape measure line
    attr = Type.copyAttributes(attributes, board.options, "tapemeasure");
    withTicks = attr.withticks;
    withText = attr.withlabel;
    digits = attr.digits;

    if (digits === 2 && attr.precision !== 2) {
        // Backward compatibility
        digits = attr.precision;
    }

    // Below, we will replace the label by the measurement function.
    if (withText) {
        attr.withlabel = true;
    }
    li = board.create("segment", [p1, p2], attr);
    // p1, p2 are already added to li.inherits

    if (withText) {
        if (attributes.name && attributes.name !== "") {
            n = attributes.name + " = ";
        } else {
            n = "";
        }
        li.label.setText(function () {
            var digits = Type.evaluate(li.label.visProp.digits);

            if (li.label.useLocale()) {
                return n + li.label.formatNumberLocale(p1.Dist(p2), digits);
            }
            return n + Type.toFixed(p1.Dist(p2), digits);
        });
    }

    if (withTicks) {
        attr = Type.copyAttributes(attributes, board.options, "tapemeasure", "ticks");
        //ticks  = 2;
        ti = board.create("ticks", [li, 0.1], attr);
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

    /**
     * Returns the length of the tape measure.
     * @name Value
     * @memberOf Tapemeasure.prototype
     * @function
     * @returns {Number} length of tape measure.
     */
    li.Value = function () {
        return p1.Dist(p2);
    };

    p1.dump = false;
    p2.dump = false;

    li.elType = "tapemeasure";
    li.getParents = function () {
        return [
            [p1.X(), p1.Y()],
            [p2.X(), p2.Y()]
        ];
    };

    li.subs = {
        point1: p1,
        point2: p2
    };

    if (withTicks) {
        ti.dump = false;
    }

    li.methodMap = JXG.deepCopy(li.methodMap, {
        Value: "Value"
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

JXG.registerElement("tapemeasure", JXG.createTapemeasure);

JXG.createMeasurement = function (board, parents, attributes) {
    var el, attr,
        x, y, term,
        valueFunc, i,
        dimFunc;

    attr = Type.copyAttributes(attributes, board.options, "measurement");

    x = parents[0];
    y = parents[1];
    term = parents[2];

    valueFunc = function () {
        return Prefix.parse(term, 'execute');
    }
    dimFunc = function () {
        return Prefix.dimension(term);
    }

    el = board.create("text", [x, y, ''], attr);
    el.type = Type.OBJECT_TYPE_MEASUREMENT;
    el.elType = 'measurement';
    el.Value = valueFunc;
    el.Dimension = dimFunc;
    el.toInfix = function (type) {
        return Prefix.toInfix(term, type);
    };
    el.toPrefix = function () {
        return Prefix.toPrefix(term);
    };
    el.getParents = function () {
        return Prefix.getParents(term);
    };
    el.addParents(el.getParents());
    for (i = 0; i < el.parents.length; i++) {
        board.select(el.parents[i]).addChild(el);
    }

    el.setText(function () {
        var prefix = '',
            suffix = '',
            d = el.Dimension(),
            b = Type.evaluate(el.visProp.baseunit),
            v = el.Value().toFixed(Type.evaluate(el.visProp.digits));

        if (Type.evaluate(el.visProp.showprefix)) {
            prefix = Type.evaluate(el.visProp.prefix)
        }
        if (Type.evaluate(el.visProp.showsuffix)) {
            suffix = Type.evaluate(el.visProp.suffix)
        }

        if (d === 0 || b === '') {
            return prefix + v + suffix;
        }
        if (isNaN(d)) {
            return 'NaN';
        }
        if (d === 1) {
            return prefix + v + ' ' + b + suffix;
        }

        return prefix + v + ' ' + b + '^{' + d + '}' + suffix;
    });

    el.methodMap = Type.deepCopy(el.methodMap, {
        Value: "Value",
        Dimension: "Dimension",
        toPrefix: "toPrefix",
        getParents: "getParents"
    });

    return el;
};

JXG.registerElement("measurement", JXG.createMeasurement);
