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

JXG.prefixParser = {
    parse: function (term, action) {
        var method, i, le, res, fun, v;

        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('prefixParser.parse: term is not an array');
        }

        method = term[0];
        le = term.length;

        if (action === 'execute') {
            if (Type.isInArray(['+', '-', '*', '/'], method)) {

                res = this.parse(term[1], action);
                for (i = 2; i < le; i++) {
                    v = this.parse(term[i], action);
                    switch (method) {
                        case '+':
                            res += v;
                            break;
                        case '-':
                            res -= v;
                            break;
                        case '*':
                            res *= v;
                            break;
                        case '/':
                            res /= v;
                            break;
                        default:
                    }
                }

            } else {
                // Allow shortcut 'V' for 'Value'
                fun = term[0];
                if (fun === 'V') {
                    fun = 'Value';
                }

                if (!Type.exists(term[1][fun])) {
                    throw new Error("prefixParser.parse: " + fun + " is not a method of " + term[1]);
                }
                res = term[1][fun]();
            }
        }

        return res;
    },

    dimension: function (term) {
        var method, i, le, res, fun, d, v;

        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('prefixParser.dimension: term is not an array');
        }

        method = term[0];
        le = term.length;

        if (Type.isInArray(['+', '-', '*', '/'], method)) {

            res = this.dimension(term[1]);
            for (i = 2; i < le; i++) {
                v = this.dimension(term[i]);
                switch (method) {
                    case '+':
                        if (v !== res) {
                            res = NaN;
                        }
                        break;
                    case '-':
                        if (v !== res) {
                            res = NaN;
                        }
                        break;
                    case '*':
                        res += v;
                        break;
                    case '/':
                        res -= v;
                        break;
                    default:
                }
            }

        } else {
            // Allow shortcut 'V' for 'Value'
            fun = term[0];

            switch (fun) {
                case 'L':
                case 'Length':
                case 'Perimeter':
                case 'Radius':
                case 'R':
                    res = 1;
                    break;
                case 'Area':
                case 'A':
                    res = 2;
                    break;
                default: // 'V', 'Value'
                    if (term[1].elType === 'measurement') {
                        res = term[1].Dimension();
                        // If attribute "dim" is set, this overrules anything else.
                        if (Type.exists(term[1].visProp.dim)) {
                            d = Type.evaluate(term[1].visProp.dim);
                            if (d > 0) {
                                res = d;
                            }
                        }
                    } else {
                        res = 0;
                    }
            }
        }

        return res;
    },

    // toInfix: function(term, type) {
    //     var method, i, le, res, fun, v;

    //     if (!Type.isArray(term) || term.length < 2) {
    //         throw new Error('prefixParser.toInfix: term is not an array');
    //     }

    //     method = term[0];
    //     le = term.length;

    //     if (Type.isInArray(['+', '-', '*', '/'], method)) {

    //         res = this.toInfix(term[1], type);
    //         for (i = 2; i < le; i++) {
    //             v = this.toInfix(term[i], type);
    //             switch (method) {
    //                 case '+':
    //                     res += ' + ' + v;
    //                     break;
    //                 case '-':
    //                     res += ' - ' + v;
    //                     break;
    //                 case '*':
    //                     res += ' * ' + v;
    //                     break;
    //                 case '/':
    //                     res += ' / ' + v;
    //                     break;
    //                 default:
    //             }
    //         }

    //     } else {
    //         // Allow shortcut 'V' for 'Value'
    //         fun = term[0];

    //         if (type === 'name') {
    //             v = term[1].name;
    //         } else {
    //             v = term[1].id;
    //         }

    //         switch (fun) {
    //             case 'L':
    //             case 'Length':
    //             case 'Perimeter':
    //             case 'Radius':
    //             case 'R':
    //             case 'Area':
    //             case 'A':
    //                 res = fun + '(' + v + ')';
    //                 break;
    //             default: // 'V', 'Value'
    //                 if (term[1].elType === 'measurement') {
    //                     res = fun + '(' + term[1].toInfix(type) + ')';
    //                 } else {
    //                     res = fun + '(' + v + ')';
    //                 }
    //         }
    //     }

    //     return res;
    // },

    toPrefix: function(term) {
        var method, i, le, res;

        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('prefixParser.toPrefix: term is not an array');
        }

        method = term[0];
        le = term.length;
        res = [method];

        for (i = 1; i < le; i++) {
            if (Type.isInArray(['+', '-', '*', '/'], method)) {
                res.push(this.toPrefix(term[i]));
            } else {
                if (method === 'V' && term[i].elType === 'measurement') {
                    res = term[i].toPrefix();
                } else {
                    res = [method, term[i].id];
                }
            }
        }

        return res;
    },

    getParents: function(term) {
        var method, i, le, res;

        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('prefixParser.getParents: term is not an array');
        }

        method = term[0];
        le = term.length;
        res = [];

        for (i = 1; i < le; i++) {
            if (Type.isInArray(['+', '-', '*', '/'], method)) {
                res = res.concat(this.getParents(term[i]));
            } else {
                if (method === 'V' && term[i].elType === 'measurement') {
                    res = res.concat(term[i].getParents());
                } else {
                    res.push(term[i]);
                }
            }
        }

        return res;
    }
};

JXG.createMeasurement = function (board, parents, attributes) {
    var el, attr,
        x, y, term,
        value, i,
        dim,

    attr = Type.copyAttributes(attributes, board.options, "measurement");

    x = parents[0];
    y = parents[1];
    term = parents[2];

    value = function () {
        return JXG.prefixParser.parse(term, 'execute');
    }
    dim = function () {
        return JXG.prefixParser.dimension(term);
    }

    el = board.create("text", [x, y, ''], attr);
    el.elType = 'measurement';
    el.Value = value;
    el.Dimension = dim;
    el.toInfix = function (type) {
        return JXG.prefixParser.toInfix(term, type);
    };
    el.toPrefix = function () {
        return JXG.prefixParser.toPrefix(term);
    };
    el.getParents = function () {
        return JXG.prefixParser.getParents(term);
    };
    el.addParents(el.getParents());
    for (i = 0; i < el.parents.length; i++) {
        board.select(el.parents[i]).addChild(el);
    }

    el.setText(function () {
        var d = el.Dimension(),
            b = Type.evaluate(el.visProp.baseunit),
            v = el.Value().toFixed(Type.evaluate(el.visProp.digits));

        if (d === 0 || b === '') {
            return v;
        }
        if (isNaN(d)) {
            return 'NaN';
        }
        if (d === 1) {
            return v + ' ' + b;
        }

        return v + ' ' + b + '^{' + d + '}';
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

// export default {
//     createTapemeasure: JXG.createTapemeasure
// };
