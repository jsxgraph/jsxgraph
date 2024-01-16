/*
    Copyright 2008-2023
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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview Geometry objects for measurements are defined in this file. This file stores all
 * style and functional properties that are required to use a tape measure on
 * a board.
 */

import JXG from "../jxg";
import Type from "../utils/type";
import Mat from "../math/math";

JXG.PrefixParser = {
    parse: function (term, action) {
        var method, i, le, res, fun, v;

        if (Type.isNumber(term)) {
            return term;
        }
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
                // Allow shortcut 'V' for 'Value'
                fun = term[0];
                if (fun === 'V') {
                    fun = 'Value';
                }

                if (!Type.exists(term[1][fun])) {
                    throw new Error("PrefixParser.parse: " + fun + " is not a method of " + term[1]);
                }
                res = term[1][fun]();
            }
        }

        return res;
    },

    dimension: function (term) {
        var method, i, le, res, fun, d, v;

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
                    d = Type.evaluate(term[2].visProp.dim);
                    if (d > 0) {
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
                        res.push(term[i])
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
                res = res.concat(this.getParents(term[i]));
            } else {
                if (method === 'V' && term[i].type === Type.OBJECT_TYPE_MEASUREMENT) {
                    res = res.concat(term[i].getParents());
                } else if (method === 'exec') {
                    if (i > 1) {
                        res = res.concat(this.getParents(term[i]));
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