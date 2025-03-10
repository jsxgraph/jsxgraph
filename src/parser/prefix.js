/*
    Copyright 2008-2025
        Matthias Ehmann,
        Carsten Miller,
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

/**
 * @fileoverview Simple prefix parser for measurements and expressions of measurements.
 * An expression is given as
 * <ul>
 * <li> array starting with an operator as first element, followed
 * by one or more operands,
 * <li> number.
 * </ul>
 * <p>
 * Possible operands are:
 * <ul>
 * <li> '+', '-', '*', '/'
 * </ul>
 *
 * @example
 *
 */
import JXG from "../jxg.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";
import Const from "../base/constants.js";

/**
 * Prefix expression parser, i.e. a poor man's parser.
 * This is a simple prefix parser for measurements and expressions of measurements,
 * see {@link Measurement}.
 * An expression is given as
 * <ul>
 * <li> array starting with an operator as first element, followed
 * by one or more operands,
 * <li> number.
 * </ul>
 * <p>
 * Possible operators are:
 * <ul>
 * <li> '+', '-', '*', '/': binary operators
 * <li> 'Area', 'Radius', 'Value', 'V', 'L': arbitrary methods of JSXGraph elements, supplied as strings.
 * <li> 'exec': call a function
 * </ul>
 * <p>
 * Possible operands are:
 * <ul>
 * <li> numbers
 * <li> strings
 * <li> JSXGraph elements in case the operator is a method. Example: ['Area', circle] calls
 * the method circle.Area().
 * <li> prefix expressions (for binary operators)
 * <li> 'exec': call functions. Example: ['exec', 'sin', ['V', slider]] computes 'Math.sin(slider.Value())'.
 * As functions only functions in Math or JXG.Math are allowed.
 * </ul>
 * @namespace
 *
 * @example
 *   ['+', 100, 200]
 * @example
 * var p1 = board.create('point', [1, 1]);
 * var p2 = board.create('point', [1, 3]);
 * var seg = board.create('segment', [[-2,-3], [-2, 3]]);
 *
 * // Valid prefix expression: ['L', seg]
 *
 * @example
 * var p1 = board.create('point', [1, 1]);
 * var p2 = board.create('point', [1, 3]);
 * var seg = board.create('segment', [[-2,-3], [-2, 3]]);
 * var ci = board.create('circle', [p1, 7]);
 *
 * // Valid prefix expression:  ['+', ['Radius', ci], ['L', seg]]
 *
 * @example
 * var ang = board.create('angle', [[4, 0], [0, 0], [2, 2]]);
 * // Valid prefix expression:  ['V', ang, 'degrees']);
 */
JXG.PrefixParser = {
    /**
     * Parse a prefix expression and apply an action.
     * @param {array|number} term Expression
     * @param {String} action Determines what to do. So far, the only
     * action available is 'execute', which evaluates the expression.
     * @returns {Number} What ever the action does.
     */
    parse: function (term, action) {
        var method, i, le, res, fun, v;

        if (Type.isNumber(term) || Type.isString(term)) {
            return term;
        }
        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('prefixParser.parse: term is not an array, number or string');
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
            } else if (method === 'exec') {
                fun = term[1];
                v = [];
                for (i = 2; i < le; i++) {
                    v.push(this.parse(term[i], action));
                }
                if (Type.exists(Math[fun])) {
                    res = Math[fun].apply(this, v);
                } else if (Type.exists(Mat[fun])) {
                    res = Mat[fun].apply(this, v);
                } else {
                    throw new Error("PrefixParser.parse: " + fun + " is not allowed");
                }
            } else {
                fun = term[0];

                // Allow shortcut 'V' for 'Value'
                if (fun === 'V') {
                    fun = 'Value';
                }

                // get coords always with z
                // (its visibility is controlled by the attribute function formatCoords)
                if (fun === 'Coords') {
                    term[2] = 'true';
                }

                if (!Type.exists(term[1][fun])) {
                    throw new Error("PrefixParser.parse: " + fun + " is not a method of " + term[1]);
                }
                v = [];
                for (i = 2; i < le; i++) {
                    v.push(this.parse(term[i], action));
                }
                res = term[1][fun].apply(term[1], v);
            }
        }

        return res;
    },

    /**
     * Determine the dimension of the resulting value, i.e. ['L', obj] as well as
     * ['+', ['L', obj1], ['L', obj2]] have dimension 1.
     * <p>
     * ['+', ['Area', obj1], ['L', obj2]] will retrun NaN, because the two
     * operands have conflicting dimensions.
     * <p>
     * If an element is a measurement element, then it's dimension can be set as attribute.
     * This overrules the computed dimension.
     *
     * @param {Array|Number} term Prefix expression
     * @returns Number
     */
    dimension: function (term) {
        var method, i, le, res, fun, d, v, unit;

        if (Type.isNumber(term)) {
            return 0;
        }
        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('PrefixParser.dimension: term is not an array');
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

        } else if (method === 'exec') {
            if (term[2].type === Type.OBJECT_TYPE_MEASUREMENT) {
                res = term[2].Dimension();
                // If attribute "dim" is set, this overrules anything else.
                if (Type.exists(term[2].visProp.dim)) {
                    d = term[2].evalVisProp('dim');
                    if (d !== null) {
                        res = d;
                    }
                }
            } else {
                res = 0;
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
                    if (term[1].type === Type.OBJECT_TYPE_MEASUREMENT) {
                        res = term[1].Dimension();
                        // If attribute "dim" is set, this overrules anything else.
                        if (Type.exists(term[1].visProp.dim)) {
                            d = term[1].evalVisProp('dim');
                            if (d !== null) {
                                res = d;
                            }
                        }
                    } else {
                        res = 0;

                        if (fun === 'Value' || fun === 'V') {
                            // The Value method of sector, angle and arc does not have the same dimension
                            // for all units.
                            if ([Const.OBJECT_TYPE_ARC, Const.OBJECT_TYPE_SECTOR, Const.OBJECT_TYPE_ANGLE].indexOf(term[1].type) >= 0) {
                                unit = '';
                                if (term.length === 3 && Type.isString(term[2])) {
                                    unit = term[2].toLowerCase();
                                }
                                if (unit === '') {
                                    // Default values:
                                    if (term[1].type === Const.OBJECT_TYPE_ANGLE) {
                                        // Default for angle.Value() is radians, i.e. dim 0
                                        res = 0;
                                    } else {
                                        // Default for sector|arc.Value() is length, i.e. dim 1
                                        res = 1;
                                    }
                                } else if (unit.indexOf('len') === 0) {
                                    // Length has dim 1
                                    res = 1;
                                } else {
                                    // Angles in various units has dimension 0
                                    res = 0;
                                }
                            }
                        }
                    }
            }
        }

        return res;
    },

    /**
     * Convert a prefix expression into a new prefix expression in which
     * JSXGraph elements have been replaced by their ids.
     *
     * @param {Array|Number} term
     * @returns {Array|Number}
     */
    toPrefix: function (term) {
        var method, i, le, res;

        if (Type.isNumber(term)) {
            return term;
        }
        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('PrefixParser.toPrefix: term is not an array');
        }

        method = term[0];
        le = term.length;
        res = [method];

        for (i = 1; i < le; i++) {
            if (Type.isInArray(['+', '-', '*', '/'], method)) {
                res.push(this.toPrefix(term[i]));
            } else {
                if (method === 'V' && term[i].type === Type.OBJECT_TYPE_MEASUREMENT) {
                    res = term[i].toPrefix();
                } else if (method === 'exec') {
                    if (i === 1) {
                        res.push(term[i]);
                    } else {
                        res.push(this.toPrefix(term[i]));
                    }
                } else {
                    res = [method, term[i].id];
                }
            }
        }

        return res;
    },

    /**
     * Determine parent elements of a prefix expression.
     * @param {Array|Number} term prefix expression
     * @returns Array
     * @private
     */
    getParents: function (term) {
        var method, i, le, res;

        if (Type.isNumber(term)) {
            return [];
        }
        if (!Type.isArray(term) || term.length < 2) {
            throw new Error('PrefixParser.getParents: term is not an array');
        }

        method = term[0];
        le = term.length;
        res = [];

        for (i = 1; i < le; i++) {
            if (Type.isInArray(['+', '-', '*', '/'], method)) {
                Type.concat(res, this.getParents(term[i]));
            } else {
                if (method === 'V' && term[i].type === Type.OBJECT_TYPE_MEASUREMENT) {
                    Type.concat(res, term[i].getParents());
                } else if (method === 'exec') {
                    if (i > 1) {
                        Type.concat(res, this.getParents(term[i]));
                    }
                } else {
                    res.push(term[i]);
                }
            }
        }

        return res;
    }
};

export default JXG.PrefixParser;