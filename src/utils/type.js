/*
    Copyright 2008-2013
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


/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 */

/**
 * @fileoverview type.js contains several functions to help deal with javascript's weak types. This file mainly consists
 * of detector functions which verify if a variable is or is not of a specific type and converter functions that convert
 * variables to another type or normalize the type of a variable.
 */

(function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Checks if the given string is an id within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isId: function (board, s) {
            return typeof s === 'string' && !!board.objects[s];
        },

        /**
         * Checks if the given string is a name within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isName: function (board, s) {
            return typeof s === 'string' && !!board.elementsByName[s];
        },

        /**
         * Checks if the given string is a group id within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isGroup: function (board, s) {
            return typeof s === 'string' && !!board.groups[s];
        },

        /**
         * Checks if the value of a given variable is of type string.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type string.
         */
        isString: function (v) {
            return typeof v === "string";
        },

        /**
         * Checks if the value of a given variable is of type number.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type number.
         */
        isNumber: function (v) {
            return typeof v === "number";
        },

        /**
         * Checks if a given variable references a function.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is a function.
         */
        isFunction: function (v) {
            return typeof v === "function";
        },

        /**
         * Checks if a given variable references an array.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type array.
         */
        isArray: function (v) {
            var r;

            // use the ES5 isArray() method and if that doesn't exist use a fallback.
            if (Array.isArray) {
                r = Array.isArray(v);
            } else {
                r = (v !== null && typeof v === "object" && 'splice' in v && 'join' in v);
            }

            return r;
        },

        /**
         * Tests if the input variable is an Object
         * @param v
         */
        isObject: function (v) {
            return typeof v === 'object' && !JXG.isArray(v);
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point element.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point.
         */
        isPoint: function (v) {
            if (typeof v === 'object') {
                return (v.elementClass === JXG.OBJECT_CLASS_POINT);
            }

            return false;
        },

        /**
         * Checks if a given variable is neither undefined nor null. You should not use this together with global
         * variables!
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is neither undefined nor null.
         */
        exists: (function (undef) {
            return function (v) {
                return !(v === undef || v === null);
            };
        }()),

        /**
         * Handle default parameters.
         * @param v Given value
         * @param d Default value
         * @returns <tt>d</tt>, if <tt>v</tt> is undefined or null.
         */
        def: function (v, d) {
            if (JXG.exists(v)) {
                return v;
            }

            return d;
        },

        /**
         * Converts a string containing either <strong>true</strong> or <strong>false</strong> into a boolean value.
         * @param {String} s String containing either <strong>true</strong> or <strong>false</strong>.
         * @returns {Boolean} String typed boolean value converted to boolean.
         */
        str2Bool: function (s) {
            if (!JXG.exists(s)) {
                return true;
            }

            if (typeof s === 'boolean') {
                return s;
            }

            if (JXG.isString(s)) {
                return (s.toLowerCase() === 'true');
            }

            return false;
        },

        /**
         * Convert a String, a number or a function into a function. This method is used in Transformation.js
         * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
         * by a GEONE<sub>X</sub>T string, thus it must be a valid reference only in case one of the param
         * values is of type string.
         * @param {Array} param An array containing strings, numbers, or functions.
         * @param {Number} n Length of <tt>param</tt>.
         * @returns {Function} A function taking one parameter k which specifies the index of the param element
         * to evaluate.
         */
        createEvalFunction: function (board, param, n) {
            var f = [], i, str;

            for (i = 0; i < n; i++) {
                f[i] = JXG.createFunction(param[i], board, '', true);
            }

            return function (k) {
                return f[k]();
            };
        },

        /**
         * Convert a String, number or function into a function.
         * @param term A variable of type string, function or number.
         * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
         * by a GEONE<sub>X</sub>T string, thus it must be a valid reference only in case one of the param
         * values is of type string.
         * @param {String} variableName Only required if evalGeonext is set to true. Describes the variable name
         * of the variable in a GEONE<sub>X</sub>T string given as term.
         * @param {Boolean} evalGeonext Set this true, if term should be treated as a GEONE<sub>X</sub>T string.
         * @returns {Function} A function evaluation the value given by term or null if term is not of type string,
         * function or number.
         */
        createFunction: function (term, board, variableName, evalGeonext) {
            var f = null;

            if ((!JXG.exists(evalGeonext) || evalGeonext) && JXG.isString(term)) {
                // Convert GEONExT syntax into  JavaScript syntax
                //newTerm = JXG.GeonextParser.geonext2JS(term, board);
                //return new Function(variableName,'return ' + newTerm + ';');

                //term = JXG.GeonextParser.replaceNameById(term, board);
                //term = JXG.GeonextParser.geonext2JS(term, board);
                f = board.jc.snippet(term, true, variableName, true);
            } else if (JXG.isFunction(term)) {
                f = term;
            } else if (JXG.isNumber(term)) {
                f = function () {
                    return term;
                };
            } else if (JXG.isString(term)) {
                // In case of string function like fontsize
                f = function () {
                    return term;
                };
            }

            if (f !== null) {
                f.origin = term;
            }

            return f;
        },

        /**
         * Generates a function which calls the function fn in the scope of owner.
         * @param {Function} fn Function to call.
         * @param {Object} owner Scope in which fn is executed.
         * @returns {Function} A function with the same signature as fn.
         */
        bind: function (fn, owner) {
            return function () {
                return fn.apply(owner, arguments);
            };
        },

        /**
         * If <tt>val</tt> is a function, it will be evaluated without giving any parameters, else the input value
         * is just returned.
         * @param val Could be anything. Preferably a number or a function.
         * @returns If <tt>val</tt> is a function, it is evaluated and the result is returned. Otherwise <tt>val</tt> is returned.
         */
        evaluate: function (val) {
            if (JXG.isFunction(val)) {
                return val();
            }

            return val;
        }

    });
}());