/*
    Copyright 2008-2025
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

import JXG from "../jxg.js";
import Type from "../utils/type.js";
import GeometryElement from "../base/element.js";
import Prefix from "../parser/prefix.js";

/**
 * @class A tape measure can be used to measure distances between points.
 * <p>
 * The two defining points of the tape measure (which is a segment) do not inherit by default the attribute "visible" from
 * the segment. Otherwise the tape meassure would be inaccessible if the two points coincide and the segment is hidden.
 *
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
    attr = Type.copyAttributes(attributes, board.options, "tapemeasure", 'point1');
    p1 = board.create("point", pos0, attr);

    // end point
    attr = Type.copyAttributes(attributes, board.options, "tapemeasure", 'point2');
    p2 = board.create("point", pos1, attr);

    p1.setAttribute({ignoredSnapToPoints: [p2.id]});
    p2.setAttribute({ignoredSnapToPoints: [p1.id]});

    // tape measure line
    attr = Type.copyAttributes(attributes, board.options, 'tapemeasure');
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
            var digits = li.label.evalVisProp('digits');

            if (li.label.useLocale()) {
                return n + li.label.formatNumberLocale(p1.Dist(p2), digits);
            }
            return n + Type.toFixed(p1.Dist(p2), digits);
        });
    }

    if (withTicks) {
        attr = Type.copyAttributes(attributes, board.options, "tapemeasure", 'ticks');
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

    li.elType = 'tapemeasure';
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

/**
 * @class Display measurements of geometric elements and the arithmetic operations of measurements.
 * Under the hood this is a text element which has a method Value. The text to be displayed
 * is the result of the evaluation of a prefix expression, see {@link JXG.PrefixParser}.
 * <p>
 * The purpose of this element is to display values of measurements of geometric objects, like the radius of a circle,
 * as well as expressions consisting of measurements.
 *
 * @pseudo
 * @name Measurement
 * @augments Text
 * @constructor
 * @type JXG.Text
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Point|Array_Point|Array_Array} x,y,expression
 * Here, expression is a prefix expression, see {@link JXG.PrefixParser}.
 * @example
 * var p1 = board.create('point', [1, 1]);
 * var p2 = board.create('point', [1, 3]);
 * var ci1 = board.create('circle', [p1, p2]);
 *
 * var m1 = board.create('measurement', [1, -2, ['Area', ci1]], {
 *     visible: true,
 *     prefix: 'area: ',
 *     baseUnit: 'cm'
 * });
 *
 * var m2 = board.create('measurement', [1, -4, ['Radius', ci1]], {
 *     prefix: 'radius: ',
 *     baseUnit: 'cm'
 * });
 *
 * </pre><div id="JXG6359237a-79bc-4689-92fc-38d3ebeb769d" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6359237a-79bc-4689-92fc-38d3ebeb769d',
 *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]);
 *     var p2 = board.create('point', [1, 3]);
 *     var ci1 = board.create('circle', [p1, p2]);
 *
 *     var m1 = board.create('measurement', [1, -2, ['Area', ci1]], {
 *         visible: true,
 *         prefix: 'area: ',
 *         baseUnit: 'cm'
 *     });
 *
 *     var m2 = board.create('measurement', [1, -4, ['Radius', ci1]], {
 *         prefix: 'radius: ',
 *         baseUnit: 'cm'
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var p1 = board.create('point', [1, 1]);
 * var p2 = board.create('point', [1, 3]);
 * var ci1 = board.create('circle', [p1, p2]);
 * var seg = board.create('segment', [[-2,-3], [-2, 3]], { firstArrow: true, lastArrow: true});
 * var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {name:'a'});
 *
 * var m1 = board.create('measurement', [-6, -2, ['Radius', ci1]], {
 *     prefix: 'm1: ',
 *     baseUnit: 'cm'
 * });
 *
 * var m2 = board.create('measurement', [-6, -4, ['L', seg]], {
 *     prefix: 'm2: ',
 *     baseUnit: 'cm'
 * });
 *
 * var m3 = board.create('measurement', [-6, -6, ['V', sli]], {
 *     prefix: 'm3: ',
 *     baseUnit: 'cm',
 *     dim: 1
 * });
 *
 * var m4 = board.create('measurement', [2, -6,
 *         ['+', ['V', m1], ['V', m2], ['V', m3]]
 *     ], {
 *     prefix: 'm4: ',
 *     baseUnit: 'cm'
 * });
 *
 * </pre><div id="JXG49903663-6450-401e-b0d9-f025a6677d4a" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG49903663-6450-401e-b0d9-f025a6677d4a',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [1, 1]);
 *     var p2 = board.create('point', [1, 3]);
 *     var ci1 = board.create('circle', [p1, p2]);
 *     var seg = board.create('segment', [[-2,-3], [-2, 3]], { firstArrow: true, lastArrow: true});
 *     var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {name:'a'});
 *
 * var m1 = board.create('measurement', [-6, -2, ['Radius', ci1]], {
 *     prefix: 'm1: ',
 *     baseUnit: 'cm'
 * });
 *
 * var m2 = board.create('measurement', [-6, -4, ['L', seg]], {
 *     prefix: 'm2: ',
 *     baseUnit: 'cm'
 * });
 *
 * var m3 = board.create('measurement', [-6, -6, ['V', sli]], {
 *     prefix: 'm3: ',
 *     baseUnit: 'cm',
 *     dim: 1
 * });
 *
 * var m4 = board.create('measurement', [2, -6,
 *         ['+', ['V', m1], ['V', m2], ['V', m3]]
 *     ], {
 *     prefix: 'm4: ',
 *     baseUnit: 'cm'
 * });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createMeasurement = function (board, parents, attributes) {
    var el, attr,
        x, y, term,
        i;

    attr = Type.copyAttributes(attributes, board.options, 'measurement');

    x = parents[0];
    y = parents[1];
    term = parents[2];

    el = board.create("text", [x, y, ''], attr);
    el.type = Type.OBJECT_TYPE_MEASUREMENT;
    el.elType = 'measurement';

    el.Value = function () {
        return Prefix.parse(term, 'execute');
    };

    el.Dimension = function () {
        var d = el.evalVisProp('dim');

        if (d !== null) {
            return d;
        }
        return Prefix.dimension(term);
    };

    el.Unit = function (dimension) {
        var unit = '',
            units = el.evalVisProp('units'),
            dim = dimension,
            dims = {}, i;

        if (!Type.exists(dim)) {
            dim = el.Dimension();
        }

        if (Type.isArray(dimension)) {
            for (i = 0; i < dimension.length; i++) {
                dims['dim' + dimension[i]] = el.Unit(dimension[i]);
            }
            return dims;
        }

        if (Type.isObject(units) && Type.exists(units[dim]) && units[dim] !== false) {
            unit = el.eval(units[dim]);
        } else if (Type.isObject(units) && Type.exists(units['dim' + dim]) && units['dim' + dim] !== false) {
            // In some cases, object keys must not be numbers. This allows key 'dim1' instead of '1'.
            unit = el.eval(units['dim' + dim]);
        } else {
            unit = el.evalVisProp('baseunit');

            if (dim === 0) {
                unit = '';
            } else if (dim > 1 && unit !== '') {
                unit = unit + '^{' + dim + '}';
            }
        }

        return unit;
    };

    el.getTerm = function () {
        return term;
    };

    el.getMethod = function () {
        var method = term[0];
        if (method === 'V') {
            method = 'Value';
        }
        return method;
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

    /**
     * @class
     * @ignore
     */
    el.setText(function () {
        var prefix = '',
            suffix = '',
            dim = el.Dimension(),
            digits = el.evalVisProp('digits'),
            unit = el.Unit(),
            val = el.Value(),
            i;

        if (el.evalVisProp('showprefix')) {
            prefix = el.evalVisProp('prefix');
        }
        if (el.evalVisProp('showsuffix')) {
            suffix = el.evalVisProp('suffix');
        }

        if (Type.isNumber(val)) {
            if (digits === 'none') {
                // do nothing
            } else if (digits === 'auto') {
                if (el.useLocale()) {
                    val = el.formatNumberLocale(val);
                } else {
                    val = Type.autoDigits(val);
                }
            } else {
                if (el.useLocale()) {
                    val = el.formatNumberLocale(val, digits);
                } else {
                    val = Type.toFixed(val, digits);
                }
            }
        } else if (Type.isArray(val)) {
            for (i = 0; i < val.length; i++) {
                if (!Type.isNumber(val[i])) {
                    continue;
                }
                if (digits === 'none') {
                    // do nothing
                } else if (digits === 'auto') {
                    if (el.useLocale()) {
                        val[i] = el.formatNumberLocale(val[i]);
                    } else {
                        val[i] = Type.autoDigits(val[i]);
                    }
                } else {
                    if (el.useLocale()) {
                        val[i] = el.formatNumberLocale(val[i], digits);
                    } else {
                        val[i] = Type.toFixed(val[i], digits);
                    }
                }
            }
        }

        if (dim === 'coords' && Type.isArray(val)) {
            if (val.length === 2) {
                val.unshift(undefined);
            }
            val = el.visProp.formatcoords(el, val[1], val[2], val[0]);
        }

        if (dim === 'direction' && Type.isArray(val)) {
            val = el.visProp.formatdirection(el, val[0], val[1]);
        }

        if (Type.isString(dim)) {
            return prefix + val + suffix;
        }

        if (isNaN(dim)) {
            return prefix + 'NaN' + suffix;
        }

        return prefix + val + unit + suffix;
    });

    el.methodMap = Type.deepCopy(el.methodMap, {
        Value: "Value",
        Dimension: "Dimension",
        Unit: "Unit",
        getTerm: "getTerm",
        Term: "getTerm",
        getMethod: "getMethod",
        Method: "getMethod",
        getParents: "getParents",
        Parents: "getParents"
    });

    return el;
};

JXG.registerElement("measurement", JXG.createMeasurement);
