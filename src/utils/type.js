/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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

/*global JXG: true, define: true, html_sanitize: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview type.js contains several functions to help deal with javascript's weak types.
 * This file mainly consists of detector functions which verify if a variable is or is not of
 * a specific type and converter functions that convert variables to another type or normalize
 * the type of a variable.
 */

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Mat from "../math/math.js";

JXG.extend(
    JXG,
    /** @lends JXG */ {
        /**
         * Checks if the given object is an JSXGraph board.
         * @param {Object} v
         * @returns {Boolean}
         */
        isBoard: function (v) {
            return v !== null &&
                typeof v === "object" &&
                this.isNumber(v.BOARD_MODE_NONE) &&
                this.isObject(v.objects) &&
                this.isObject(v.jc) &&
                this.isFunction(v.update) &&
                !!v.containerObj &&
                this.isString(v.id);
        },

        /**
         * Checks if the given string is an id within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isId: function (board, s) {
            return typeof s === "string" && !!board.objects[s];
        },

        /**
         * Checks if the given string is a name within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isName: function (board, s) {
            return typeof s === "string" && !!board.elementsByName[s];
        },

        /**
         * Checks if the given string is a group id within the given board.
         * @param {JXG.Board} board
         * @param {String} s
         * @returns {Boolean}
         */
        isGroup: function (board, s) {
            return typeof s === "string" && !!board.groups[s];
        },

        /**
         * Checks if the value of a given variable is of type string.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type string.
         */
        isString: function (v) {
            return typeof v === 'string';
        },

        /**
         * Checks if the value of a given variable is of type number.
         * @param v A variable of any type.
         * @param {Boolean} [acceptStringNumber=false] If set to true, the function returns true for e.g. v='3.1415'.
         * @param {Boolean} [acceptNaN=true] If set to false, the function returns false for v=NaN.
         * @returns {Boolean} True, if v is of type number.
         */
        isNumber: function (v, acceptStringNumber, acceptNaN) {
            var result = (
                typeof v === 'number' || Object.prototype.toString.call(v) === '[Object Number]'
            );
            acceptStringNumber = acceptStringNumber || false;
            acceptNaN = acceptNaN === undefined ? true : acceptNaN;

            if (acceptStringNumber) {
                result = result || ('' + parseFloat(v)) === v;
            }
            if (!acceptNaN) {
                result = result && !isNaN(v);
            }
            return result;
        },

        /**
         * Checks if a given variable references a function.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is a function.
         */
        isFunction: function (v) {
            return typeof v === 'function';
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
                r =
                    v !== null &&
                    typeof v === "object" &&
                    typeof v.splice === "function" &&
                    typeof v.join === 'function';
            }

            return r;
        },

        /**
         * Tests if the input variable is an Object
         * @param v
         */
        isObject: function (v) {
            return typeof v === "object" && !this.isArray(v);
        },

        /**
         * Tests if the input variable is a DOM Document or DocumentFragment node
         * @param v A variable of any type
         */
        isDocumentOrFragment: function (v) {
            return this.isObject(v) && (
                v.nodeType === 9 || // Node.DOCUMENT_NODE
                v.nodeType === 11   // Node.DOCUMENT_FRAGMENT_NODE
            );
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point element.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point.
         */
        isPoint: function (v) {
            if (v !== null && typeof v === "object" && this.exists(v.elementClass)) {
                return v.elementClass === Const.OBJECT_CLASS_POINT;
            }

            return false;
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point3D element.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point3D.
         */
        isPoint3D: function (v) {
            if (v !== null && typeof v === "object" && this.exists(v.type)) {
                return v.type === Const.OBJECT_TYPE_POINT3D;
            }

            return false;
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point element or an array of length at least two or
         * a function returning an array of length two or three.
         * @param {JXG.Board} board
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point.
         */
        isPointType: function (board, v) {
            var val, p;

            if (this.isArray(v)) {
                return true;
            }
            if (this.isFunction(v)) {
                val = v();
                if (this.isArray(val) && val.length > 1) {
                    return true;
                }
            }
            p = board.select(v);
            return this.isPoint(p);
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point3D element or an array of length three
         * or a function returning an array of length three.
         * @param {JXG.Board} board
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point3D or an array of length at least 3, or a function returning
         * such an array.
         */
        isPointType3D: function (board, v) {
            var val, p;

            if (this.isArray(v) && v.length >= 3) {
                return true;
            }
            if (this.isFunction(v)) {
                val = v();
                if (this.isArray(val) && val.length >= 3) {
                    return true;
                }
            }
            p = board.select(v);
            return this.isPoint3D(p);
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph transformation element or an array
         * of JSXGraph transformation elements.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Transformation.
         */
        isTransformationOrArray: function (v) {
            if (v !== null) {
                if (this.isArray(v) && v.length > 0) {
                    return this.isTransformationOrArray(v[0]);
                }
                if (typeof v === 'object') {
                    return v.type === Const.OBJECT_TYPE_TRANSFORMATION;
                }
            }
            return false;
        },

        /**
         * Checks if v is an empty object or empty.
         * @param v {Object|Array}
         * @returns {boolean} True, if v is an empty object or array.
         */
        isEmpty: function (v) {
            return Object.keys(v).length === 0;
        },

        /**
         * Checks if a given variable is neither undefined nor null. You should not use this together with global
         * variables!
         * @param v A variable of any type.
         * @param {Boolean} [checkEmptyString=false] If set to true, it is also checked whether v is not equal to ''.
         * @returns {Boolean} True, if v is neither undefined nor null.
         */
        exists: function (v, checkEmptyString) {
            /* eslint-disable eqeqeq */
            var result = !(v == undefined || v === null);
            /* eslint-enable eqeqeq */
            checkEmptyString = checkEmptyString || false;

            if (checkEmptyString) {
                return result && v !== "";
            }
            return result;
        },
        // exists: (function (undef) {
        //     return function (v, checkEmptyString) {
        //         var result = !(v === undef || v === null);

        //         checkEmptyString = checkEmptyString || false;

        //         if (checkEmptyString) {
        //             return result && v !== '';
        //         }
        //         return result;
        //     };
        // }()),

        /**
         * Handle default parameters.
         * @param v Given value
         * @param d Default value
         * @returns <tt>d</tt>, if <tt>v</tt> is undefined or null.
         */
        def: function (v, d) {
            if (this.exists(v)) {
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
            if (!this.exists(s)) {
                return true;
            }

            if (typeof s === 'boolean') {
                return s;
            }

            if (this.isString(s)) {
                return s.toLowerCase() === 'true';
            }

            return false;
        },

        /**
         * Converts a given CSS style string into a JavaScript object.
         * @param {String} styles String containing CSS styles.
         * @returns {Object} Object containing CSS styles.
         */
        cssParse: function (styles) {
            var str = styles;
            if (!this.isString(str)) return {};

            str = str.replace(/\s*;\s*$/g, '');
            str = str.replace(/\s*;\s*/g, '","');
            str = str.replace(/\s*:\s*/g, '":"');
            str = str.trim();
            str = '{"' + str + '"}';

            return JSON.parse(str);
        },

        /**
         * Converts a given object into a CSS style string.
         * @param {Object} styles Object containing CSS styles.
         * @returns {String} String containing CSS styles.
         */
        cssStringify: function (styles) {
            var str = '',
                attr, val;
            if (!this.isObject(styles)) return '';

            for (attr in styles) {
                if (!styles.hasOwnProperty(attr)) continue;
                val = styles[attr];
                if (!this.isString(val) && !this.isNumber(val)) continue;

                str += attr + ':' + val + '; ';
            }
            str = str.trim();

            return str;
        },

        /**
         * Convert a String, a number or a function into a function. This method is used in Transformation.js
         * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
         * by a JessieCode string, thus it must be a valid reference only in case one of the param
         * values is of type string.
         * @param {Array} param An array containing strings, numbers, or functions.
         * @param {Number} n Length of <tt>param</tt>.
         * @returns {Function} A function taking one parameter k which specifies the index of the param element
         * to evaluate.
         */
        createEvalFunction: function (board, param, n) {
            var f = [], func, i, e,
                deps = {};

            for (i = 0; i < n; i++) {
                f[i] = this.createFunction(param[i], board);
                for (e in f[i].deps) {
                    deps[e] = f[i].deps;
                }
            }

            func = function (k) {
                return f[k]();
            };
            func.deps = deps;

            return func;
        },

        /**
         * Convert a String, number or function into a function.
         * @param {String|Number|Function} term A variable of type string, function or number.
         * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
         * by a JessieCode/GEONE<sub>X</sub>T string, thus it must be a valid reference only in case one of the param
         * values is of type string.
         * @param {String} variableName Only required if function is supplied as JessieCode string or evalGeonext is set to true.
         * Describes the variable name of the variable in a JessieCode/GEONE<sub>X</sub>T string given as term.
         * @param {Boolean} [evalGeonext=false] Obsolete and ignored! Set this true
         * if term should be treated as a GEONE<sub>X</sub>T string.
         * @returns {Function} A function evaluating the value given by term or null if term is not of type string,
         * function or number.
         */
        createFunction: function (term, board, variableName, evalGeonext) {
            var f = null;

            // if ((!this.exists(evalGeonext) || evalGeonext) && this.isString(term)) {
            if (this.isString(term)) {
                // Convert GEONExT syntax into  JavaScript syntax
                //newTerm = JXG.GeonextParser.geonext2JS(term, board);
                //return new Function(variableName,'return ' + newTerm + ';');
                //term = JXG.GeonextParser.replaceNameById(term, board);
                //term = JXG.GeonextParser.geonext2JS(term, board);

                f = board.jc.snippet(term, true, variableName, false);
            } else if (this.isFunction(term)) {
                f = term;
                f.deps = (this.isObject(term.deps)) ? term.deps : {};
            } else if (this.isNumber(term) || this.isArray(term)) {
                /** @ignore */
                f = function () { return term; };
                f.deps = {};
                // } else if (this.isString(term)) {
                //     // In case of string function like fontsize
                //     /** @ignore */
                //     f = function () { return term; };
                //     f.deps = {};
            }

            if (f !== null) {
                f.origin = term;
            }

            return f;
        },

        /**
         *  Test if the parents array contains existing points. If instead parents contains coordinate arrays or
         *  function returning coordinate arrays
         *  free points with these coordinates are created.
         *
         * @param {JXG.Board} board Board object
         * @param {Array} parents Array containing parent elements for a new object. This array may contain
         *    <ul>
         *      <li> {@link JXG.Point} objects
         *      <li> {@link JXG.GeometryElement#name} of {@link JXG.Point} objects
         *      <li> {@link JXG.GeometryElement#id} of {@link JXG.Point} objects
         *      <li> Coordinates of points given as array of numbers of length two or three, e.g. [2, 3].
         *      <li> Coordinates of points given as array of functions of length two or three. Each function returns one coordinate, e.g.
         *           [function(){ return 2; }, function(){ return 3; }]
         *      <li> Function returning coordinates, e.g. function() { return [2, 3]; }
         *    </ul>
         *  In the last three cases a new point will be created.
         * @param {String} attrClass Main attribute class of newly created points, see {@link JXG#copyAttributes}
         * @param {Array} attrArray List of subtype attributes for the newly created points. The list of subtypes is mapped to the list of new points.
         * @returns {Array} List of newly created {@link JXG.Point} elements or false if not all returned elements are points.
         */
        providePoints: function (board, parents, attributes, attrClass, attrArray) {
            var i,
                j,
                len,
                lenAttr = 0,
                points = [],
                attr,
                val;

            if (!this.isArray(parents)) {
                parents = [parents];
            }
            len = parents.length;
            if (this.exists(attrArray)) {
                lenAttr = attrArray.length;
            }
            if (lenAttr === 0) {
                attr = this.copyAttributes(attributes, board.options, attrClass);
            }

            for (i = 0; i < len; ++i) {
                if (lenAttr > 0) {
                    j = Math.min(i, lenAttr - 1);
                    attr = this.copyAttributes(
                        attributes,
                        board.options,
                        attrClass,
                        attrArray[j].toLowerCase()
                    );
                }
                if (this.isArray(parents[i]) && parents[i].length > 1) {
                    points.push(board.create("point", parents[i], attr));
                    points[points.length - 1]._is_new = true;
                } else if (this.isFunction(parents[i])) {
                    val = parents[i]();
                    if (this.isArray(val) && val.length > 1) {
                        points.push(board.create("point", [parents[i]], attr));
                        points[points.length - 1]._is_new = true;
                    }
                } else {
                    points.push(board.select(parents[i]));
                }

                if (!this.isPoint(points[i])) {
                    return false;
                }
            }

            return points;
        },

        /**
         *  Test if the parents array contains existing points. If instead parents contains coordinate arrays or
         *  function returning coordinate arrays
         *  free points with these coordinates are created.
         *
         * @param {JXG.View3D} view View3D object
         * @param {Array} parents Array containing parent elements for a new object. This array may contain
         *    <ul>
         *      <li> {@link JXG.Point3D} objects
         *      <li> {@link JXG.GeometryElement#name} of {@link JXG.Point3D} objects
         *      <li> {@link JXG.GeometryElement#id} of {@link JXG.Point3D} objects
         *      <li> Coordinates of 3D points given as array of numbers of length three, e.g. [2, 3, 1].
         *      <li> Coordinates of 3D points given as array of functions of length three. Each function returns one coordinate, e.g.
         *           [function(){ return 2; }, function(){ return 3; }, function(){ return 1; }]
         *      <li> Function returning coordinates, e.g. function() { return [2, 3, 1]; }
         *    </ul>
         *  In the last three cases a new 3D point will be created.
         * @param {String} attrClass Main attribute class of newly created 3D points, see {@link JXG#copyAttributes}
         * @param {Array} attrArray List of subtype attributes for the newly created 3D points. The list of subtypes is mapped to the list of new 3D points.
         * @returns {Array} List of newly created {@link JXG.Point3D} elements or false if not all returned elements are 3D points.
         */
        providePoints3D: function (view, parents, attributes, attrClass, attrArray) {
            var i,
                j,
                len,
                lenAttr = 0,
                points = [],
                attr,
                val;

            if (!this.isArray(parents)) {
                parents = [parents];
            }
            len = parents.length;
            if (this.exists(attrArray)) {
                lenAttr = attrArray.length;
            }
            if (lenAttr === 0) {
                attr = this.copyAttributes(attributes, view.board.options, attrClass);
            }

            for (i = 0; i < len; ++i) {
                if (lenAttr > 0) {
                    j = Math.min(i, lenAttr - 1);
                    attr = this.copyAttributes(
                        attributes,
                        view.board.options,
                        attrClass,
                        attrArray[j]
                    );
                }

                if (this.isArray(parents[i]) && parents[i].length > 0 && parents[i].every((x)=>this.isArray(x) && this.isNumber(x[0]))) {
                    // Testing for array-of-arrays-of-numbers, like [[1,2,3],[2,3,4]]
                    for (j = 0; j < parents[i].length; j++) {
                        points.push(view.create("point3d", parents[i][j], attr));;
                        points[points.length - 1]._is_new = true;
                    }
                } else if (this.isArray(parents[i]) &&  parents[i].every((x)=> this.isNumber(x) || this.isFunction(x))) {
                    // Single array [1,2,3]
                    points.push(view.create("point3d", parents[i], attr));
                    points[points.length - 1]._is_new = true;

                } else if (this.isPoint3D(parents[i])) {
                    points.push(parents[i]);
                } else if (this.isFunction(parents[i])) {
                    val = parents[i]();
                    if (this.isArray(val) && val.length > 1) {
                        points.push(view.create("point3d", [parents[i]], attr));
                        points[points.length - 1]._is_new = true;
                    }
                } else {
                    points.push(view.select(parents[i]));
                }

                if (!this.isPoint3D(points[i])) {
                    return false;
                }
            }

            return points;
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
            if (this.isFunction(val)) {
                return val();
            }

            return val;
        },

        /**
         * Search an array for a given value.
         * @param {Array} array
         * @param value
         * @param {String} [sub] Use this property if the elements of the array are objects.
         * @returns {Number} The index of the first appearance of the given value, or
         * <tt>-1</tt> if the value was not found.
         */
        indexOf: function (array, value, sub) {
            var i,
                s = this.exists(sub);

            if (Array.indexOf && !s) {
                return array.indexOf(value);
            }

            for (i = 0; i < array.length; i++) {
                if ((s && array[i][sub] === value) || (!s && array[i] === value)) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Eliminates duplicate entries in an array consisting of numbers and strings.
         * @param {Array} a An array of numbers and/or strings.
         * @returns {Array} The array with duplicate entries eliminated.
         */
        eliminateDuplicates: function (a) {
            var i,
                len = a.length,
                result = [],
                obj = {};

            for (i = 0; i < len; i++) {
                obj[a[i]] = 0;
            }

            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    result.push(i);
                }
            }

            return result;
        },

        /**
         * Swaps to array elements.
         * @param {Array} arr
         * @param {Number} i
         * @param {Number} j
         * @returns {Array} Reference to the given array.
         */
        swap: function (arr, i, j) {
            var tmp;

            tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;

            return arr;
        },

        /**
         * Generates a copy of an array and removes the duplicate entries.
         * The original array will be altered.
         * @param {Array} arr
         * @returns {Array}
         *
         * @see JXG.toUniqueArrayFloat
         */
        uniqueArray: function (arr) {
            var i,
                j,
                isArray,
                ret = [];

            if (arr.length === 0) {
                return [];
            }

            for (i = 0; i < arr.length; i++) {
                isArray = this.isArray(arr[i]);

                if (!this.exists(arr[i])) {
                    arr[i] = "";
                    continue;
                }
                for (j = i + 1; j < arr.length; j++) {
                    if (isArray && JXG.cmpArrays(arr[i], arr[j])) {
                        arr[i] = [];
                    } else if (!isArray && arr[i] === arr[j]) {
                        arr[i] = "";
                    }
                }
            }

            j = 0;

            for (i = 0; i < arr.length; i++) {
                isArray = this.isArray(arr[i]);

                if (!isArray && arr[i] !== "") {
                    ret[j] = arr[i];
                    j++;
                } else if (isArray && arr[i].length !== 0) {
                    ret[j] = arr[i].slice(0);
                    j++;
                }
            }

            arr = ret;
            return ret;
        },

        /**
         * Generates a sorted copy of an array containing numbers and removes the duplicate entries up to a supplied precision eps.
         * An array element arr[i] will be removed if abs(arr[i] - arr[i-1]) is less than eps.
         *
         * The original array will stay unaltered.
         * @param {Array} arr
         * @returns {Array}
         *
         * @param {Array} arr Array of numbers
         * @param {Number} eps Precision
         * @returns {Array}
         *
         * @example
         * var arr = [2.3, 4, Math.PI, 2.300001, Math.PI+0.000000001];
         * console.log(JXG.toUniqueArrayFloat(arr, 0.00001));
         * // Output: Array(3) [ 2.3, 3.141592653589793, 4 ]
         *
         * @see JXG.uniqueArray
         */
        toUniqueArrayFloat: function (arr, eps) {
            var a,
                i, le;

            // if (false && Type.exists(arr.toSorted)) {
            //     a = arr.toSorted(function(a, b) { return a - b; });
            // } else {
            // }
            // Backwards compatibility to avoid toSorted
            a = arr.slice();
            a.sort(function (a, b) { return a - b; });
            le = a.length;
            for (i = le - 1; i > 0; i--) {
                if (Math.abs(a[i] - a[i - 1]) < eps) {
                    a.splice(i, 1);
                }
            }
            return a;
        },


        /**
         * Checks if an array contains an element equal to <tt>val</tt> but does not check the type!
         * @param {Array} arr
         * @param val
         * @returns {Boolean}
         */
        isInArray: function (arr, val) {
            return JXG.indexOf(arr, val) > -1;
        },

        /**
         * Converts an array of {@link JXG.Coords} objects into a coordinate matrix.
         * @param {Array} coords
         * @param {Boolean} split
         * @returns {Array}
         */
        coordsArrayToMatrix: function (coords, split) {
            var i,
                x = [],
                m = [];

            for (i = 0; i < coords.length; i++) {
                if (split) {
                    x.push(coords[i].usrCoords[1]);
                    m.push(coords[i].usrCoords[2]);
                } else {
                    m.push([coords[i].usrCoords[1], coords[i].usrCoords[2]]);
                }
            }

            if (split) {
                m = [x, m];
            }

            return m;
        },

        /**
         * Compare two arrays.
         * @param {Array} a1
         * @param {Array} a2
         * @returns {Boolean} <tt>true</tt>, if the arrays coefficients are of same type and value.
         */
        cmpArrays: function (a1, a2) {
            var i;

            // trivial cases
            if (a1 === a2) {
                return true;
            }

            if (a1.length !== a2.length) {
                return false;
            }

            for (i = 0; i < a1.length; i++) {
                if (this.isArray(a1[i]) && this.isArray(a2[i])) {
                    if (!this.cmpArrays(a1[i], a2[i])) {
                        return false;
                    }
                } else if (a1[i] !== a2[i]) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Removes an element from the given array
         * @param {Array} ar
         * @param el
         * @returns {Array}
         */
        removeElementFromArray: function (ar, el) {
            var i;

            for (i = 0; i < ar.length; i++) {
                if (ar[i] === el) {
                    ar.splice(i, 1);
                    return ar;
                }
            }

            return ar;
        },

        /**
         * Truncate a number <tt>n</tt> after <tt>p</tt> decimals.
         * @param {Number} n
         * @param {Number} p
         * @returns {Number}
         */
        trunc: function (n, p) {
            p = JXG.def(p, 0);

            return this.toFixed(n, p);
        },

        /**
         * Decimal adjustment of a number.
         * From https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/round
         *
         * @param    {String}    type    The type of adjustment.
         * @param    {Number}    value    The number.
         * @param    {Number}    exp        The exponent (the 10 logarithm of the adjustment base).
         * @returns    {Number}            The adjusted value.
         *
         * @private
         */
        _decimalAdjust: function (type, value, exp) {
            // If the exp is undefined or zero...
            if (exp === undefined || +exp === 0) {
                return Math[type](value);
            }

            value = +value;
            exp = +exp;
            // If the value is not a number or the exp is not an integer...
            if (isNaN(value) || !(typeof exp === "number" && exp % 1 === 0)) {
                return NaN;
            }

            // Shift
            value = value.toString().split('e');
            value = Math[type](+(value[0] + "e" + (value[1] ? +value[1] - exp : -exp)));

            // Shift back
            value = value.toString().split('e');
            return +(value[0] + "e" + (value[1] ? +value[1] + exp : exp));
        },

        /**
         * Round a number to given number of decimal digits.
         *
         * Example: JXG._toFixed(3.14159, -2) gives 3.14
         * @param  {Number} value Number to be rounded
         * @param  {Number} exp   Number of decimal digits given as negative exponent
         * @return {Number}       Rounded number.
         *
         * @private
         */
        _round10: function (value, exp) {
            return this._decimalAdjust("round", value, exp);
        },

        /**
         * "Floor" a number to given number of decimal digits.
         *
         * Example: JXG._toFixed(3.14159, -2) gives 3.14
         * @param  {Number} value Number to be floored
         * @param  {Number} exp   Number of decimal digits given as negative exponent
         * @return {Number}       "Floored" number.
         *
         * @private
         */
        _floor10: function (value, exp) {
            return this._decimalAdjust("floor", value, exp);
        },

        /**
         * "Ceil" a number to given number of decimal digits.
         *
         * Example: JXG._toFixed(3.14159, -2) gives 3.15
         * @param  {Number} value Number to be ceiled
         * @param  {Number} exp   Number of decimal digits given as negative exponent
         * @return {Number}       "Ceiled" number.
         *
         * @private
         */
        _ceil10: function (value, exp) {
            return this._decimalAdjust("ceil", value, exp);
        },

        /**
         * Replacement of the default toFixed() method.
         * It does a correct rounding (independent of the browser) and
         * returns "0.00" for toFixed(-0.000001, 2) instead of "-0.00" which
         * is returned by JavaScript's toFixed()
         *
         * @memberOf JXG
         * @param  {Number} num    Number tp be rounded
         * @param  {Number} digits Decimal digits
         * @return {String}        Rounded number is returned as string
         */
        toFixed: function (num, digits) {
            return this._round10(num, -digits).toFixed(digits);
        },

        /**
         * Truncate a number <tt>val</tt> automatically.
         * @memberOf JXG
         * @param val
         * @returns {Number}
         */
        autoDigits: function (val) {
            var x = Math.abs(val),
                str;

            if (x >= 0.1) {
                str = this.toFixed(val, 2);
            } else if (x >= 0.01) {
                str = this.toFixed(val, 4);
            } else if (x >= 0.0001) {
                str = this.toFixed(val, 6);
            } else {
                str = val;
            }
            return str;
        },

        /**
         * Convert value v. If v has the form
         * <ul>
         * <li> 'x%': return floating point number x * percentOfWhat * 0.01
         * <li> 'xfr': return floating point number x * percentOfWhat
         * <li> 'xpx': return x * convertPx or convertPx(x) or x
         * <li> x or 'x': return floating point number x
         * </ul>
         * @param {String|Number} v
         * @param {Number} percentOfWhat
         * @param {Function|Number|*} convertPx
         * @returns {String|Number}
         */
        parseNumber: function(v, percentOfWhat, convertPx) {
            var str;

            if (this.isString(v) && v.indexOf('%') > -1) {
                str = v.replace(/\s+%\s+/, '');
                return parseFloat(str) * percentOfWhat * 0.01;
            }
            if (this.isString(v) && v.indexOf('fr') > -1) {
                str = v.replace(/\s+fr\s+/, '');
                return parseFloat(str) * percentOfWhat;
            }
            if (this.isString(v) && v.indexOf('px') > -1) {
                str = v.replace(/\s+px\s+/, '');
                str = parseFloat(str);
                if(this.isFunction(convertPx)) {
                    return convertPx(str);
                } else if(this.isNumber(convertPx)) {
                    return str * convertPx;
                } else {
                    return str;
                }
            }
            // Number or String containing no unit
            return parseFloat(v);
        },

        /**
         * Parse a string for label positioning of the form 'left pos' or 'pos right'
         * and return e.g.
         * <tt>{ side: 'left', pos: 'pos' }</tt>.
         * @param {String} str
         * @returns {Obj}  <tt>{ side, pos }</tt>
         */
        parsePosition: function(str) {
            var a, i,
                side = '',
                pos = '';

            str = str.trim();
            if (str !== '') {
                a = str.split(/[ ,]+/);
                for (i = 0; i < a.length; i++) {
                    if (a[i] === 'left' || a[i] === 'right') {
                        side = a[i];
                    } else {
                        pos = a[i];
                    }
                }
            }

            return {
                side: side,
                pos: pos
            };
        },

        /**
         * Extracts the keys of a given object.
         * @param object The object the keys are to be extracted
         * @param onlyOwn If true, hasOwnProperty() is used to verify that only keys are collected
         * the object owns itself and not some other object in the prototype chain.
         * @returns {Array} All keys of the given object.
         */
        keys: function (object, onlyOwn) {
            var keys = [],
                property;

            // the caller decides if we use hasOwnProperty
            /*jslint forin:true*/
            for (property in object) {
                if (onlyOwn) {
                    if (object.hasOwnProperty(property)) {
                        keys.push(property);
                    }
                } else {
                    keys.push(property);
                }
            }
            /*jslint forin:false*/

            return keys;
        },

        /**
         * This outputs an object with a base class reference to the given object. This is useful if
         * you need a copy of an e.g. attributes object and want to overwrite some of the attributes
         * without changing the original object.
         * @param {Object} obj Object to be embedded.
         * @returns {Object} An object with a base class reference to <tt>obj</tt>.
         */
        clone: function (obj) {
            var cObj = {};

            cObj.prototype = obj;

            return cObj;
        },

        /**
         * Embeds an existing object into another one just like {@link #clone} and copies the contents of the second object
         * to the new one. Warning: The copied properties of obj2 are just flat copies.
         * @param {Object} obj Object to be copied.
         * @param {Object} obj2 Object with data that is to be copied to the new one as well.
         * @returns {Object} Copy of given object including some new/overwritten data from obj2.
         */
        cloneAndCopy: function (obj, obj2) {
            var r,
                cObj = function () {
                    return undefined;
                };

            cObj.prototype = obj;

            // no hasOwnProperty on purpose
            /*jslint forin:true*/
            /*jshint forin:true*/

            for (r in obj2) {
                cObj[r] = obj2[r];
            }

            /*jslint forin:false*/
            /*jshint forin:false*/

            return cObj;
        },

        /**
         * Recursively merges obj2 into obj1 in-place. Contrary to {@link JXG#deepCopy} this won't create a new object
         * but instead will overwrite obj1.
         * <p>
         * In contrast to method JXG.mergeAttr, merge recurses into any kind of object, e.g. DOM object and JSXGraph objects.
         * So, please be careful.
         * @param {Object} obj1
         * @param {Object} obj2
         * @returns {Object}
         * @see JXG.mergeAttr
         *
         * @example
         * JXG.Options = JXG.merge(JXG.Options, {
         *     board: {
         *         showNavigation: false,
         *         showInfobox: true
         *     },
         *     point: {
         *         face: 'o',
         *         size: 4,
         *         fillColor: '#eeeeee',
         *         highlightFillColor: '#eeeeee',
         *         strokeColor: 'white',
         *         highlightStrokeColor: 'white',
         *         showInfobox: 'inherit'
         *     }
         * });
         *
         * </pre><div id="JXGc5bf0f2a-bd5a-4612-97c2-09f17b1bbc6b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGc5bf0f2a-bd5a-4612-97c2-09f17b1bbc6b',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     JXG.Options = JXG.merge(JXG.Options, {
         *         board: {
         *             showNavigation: false,
         *             showInfobox: true
         *         },
         *         point: {
         *             face: 'o',
         *             size: 4,
         *             fillColor: '#eeeeee',
         *             highlightFillColor: '#eeeeee',
         *             strokeColor: 'white',
         *             highlightStrokeColor: 'white',
         *             showInfobox: 'inherit'
         *         }
         *     });
         *
         *
         *     })();
         *
         * </script><pre>
         */
        merge: function (obj1, obj2) {
            var i, j, o, oo;

            for (i in obj2) {
                if (obj2.hasOwnProperty(i)) {
                    o = obj2[i];
                    if (this.isArray(o)) {
                        if (!obj1[i]) {
                            obj1[i] = [];
                        }

                        for (j = 0; j < o.length; j++) {
                            oo = obj2[i][j];
                            if (typeof obj2[i][j] === 'object') {
                                obj1[i][j] = this.merge(obj1[i][j], oo);
                            } else {
                                obj1[i][j] = obj2[i][j];
                            }
                        }
                    } else if (typeof o === 'object') {
                        if (!obj1[i]) {
                            obj1[i] = {};
                        }

                        obj1[i] = this.merge(obj1[i], o);
                    } else {
                        if (typeof obj1 === 'boolean') {
                            // This is necessary in the following scenario:
                            //   lastArrow == false
                            // and call of
                            //   setAttribute({lastArrow: {type: 7}})
                            obj1 = {};
                        }
                        obj1[i] = o;
                    }
                }
            }

            return obj1;
        },

        /**
         * Creates a deep copy of an existing object, i.e. arrays or sub-objects are copied component resp.
         * element-wise instead of just copying the reference. If a second object is supplied, the two objects
         * are merged into one object. The properties of the second object have priority.
         * @param {Object} obj This object will be copied.
         * @param {Object} obj2 This object will merged into the newly created object
         * @param {Boolean} [toLower=false] If true the keys are convert to lower case. This is needed for visProp, see JXG#copyAttributes
         * @returns {Object} copy of obj or merge of obj and obj2.
         */
        deepCopy: function (obj, obj2, toLower) {
            var c, i, prop, i2;

            toLower = toLower || false;
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            // Missing hasOwnProperty is on purpose in this function
            if (this.isArray(obj)) {
                c = [];
                for (i = 0; i < obj.length; i++) {
                    prop = obj[i];
                    // Attention: typeof null === 'object'
                    if (prop !== null && typeof prop === 'object') {
                        // We certainly do not want to recurse into a JSXGraph object.
                        // This would for sure result in an infinite recursion.
                        // As alternative we copy the id of the object.
                        if (this.exists(prop.board)) {
                            c[i] = prop.id;
                        } else {
                            c[i] = this.deepCopy(prop, {}, toLower);
                        }
                    } else {
                        c[i] = prop;
                    }
                }
            } else {
                c = {};
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        i2 = toLower ? i.toLowerCase() : i;
                        prop = obj[i];
                        if (prop !== null && typeof prop === 'object') {
                            if (this.exists(prop.board)) {
                                c[i2] = prop.id;
                            } else {
                                c[i2] = this.deepCopy(prop, {}, toLower);
                            }
                        } else {
                            c[i2] = prop;
                        }
                    }
                }

                for (i in obj2) {
                    if (obj2.hasOwnProperty(i)) {
                        i2 = toLower ? i.toLowerCase() : i;

                        prop = obj2[i];
                        if (prop !== null && typeof prop === 'object') {
                            if (this.isArray(prop) || !this.exists(c[i2])) {
                                c[i2] = this.deepCopy(prop, {}, toLower);
                            } else {
                                c[i2] = this.deepCopy(c[i2], prop, toLower);
                            }
                        } else {
                            c[i2] = prop;
                        }
                    }
                }
            }

            return c;
        },

        /**
         * In-place (deep) merging of attributes. Allows attributes like `{shadow: {enabled: true...}}`
         * <p>
         * In contrast to method JXG.merge, mergeAttr does not recurse into DOM objects and JSXGraph objects. Instead
         * handles (pointers) to these objects are used.
         *
         * @param {Object} attr Object with attributes - usually containing default options - that will be changed in-place.
         * @param {Object} special Special option values which overwrite (recursively) the default options
         * @param {Boolean} [toLower=true] If true the keys are converted to lower case.
         * @param {Boolean} [ignoreUndefinedSpecials=false] If true the values in special that are undefined are not used.
         *
         * @see JXG.merge
         *
         */
        mergeAttr: function (attr, special, toLower, ignoreUndefinedSpecials) {
            var e, e2, o;

            toLower = toLower || true;
            ignoreUndefinedSpecials = ignoreUndefinedSpecials || false;

            for (e in special) {
                if (special.hasOwnProperty(e)) {
                    e2 = (toLower) ? e.toLowerCase(): e;
                    // Key already exists, but not in lower case
                    if (e2 !== e && attr.hasOwnProperty(e)) {
                        if (attr.hasOwnProperty(e2)) {
                            // Lower case key already exists - this should not happen
                            // We have to unify the two key-value pairs
                            // It is not clear which has precedence.
                            this.mergeAttr(attr[e2], attr[e], toLower);
                        } else {
                            attr[e2] = attr[e];
                        }
                        delete attr[e];
                    }

                    o = special[e];
                    if (this.isObject(o) && o !== null &&
                        // Do not recurse into a document object or a JSXGraph object
                        !this.isDocumentOrFragment(o) && !this.exists(o.board) &&
                        // Do not recurse if a string is provided as "new String(...)"
                        typeof o.valueOf() !== 'string') {
                        if (attr[e2] === undefined || attr[e2] === null || !this.isObject(attr[e2])) {
                            // The last test handles the case:
                            //   attr.draft = false;
                            //   special.draft = { strokewidth: 4}
                            attr[e2] = {};
                        }
                        this.mergeAttr(attr[e2], o, toLower);
                    } else if(!ignoreUndefinedSpecials || this.exists(o)) {
                        // Flat copy
                        // This is also used in the cases
                        //   attr.shadow = { enabled: true ...}
                        //   special.shadow = false;
                        // and
                        //   special.anchor is a JSXGraph element
                        attr[e2] = o;
                    }
                }
            }
        },

        /**
         * Convert an object to a new object containing only
         * lower case properties.
         *
         * @param {Object} obj
         * @returns Object
         * @example
         * var attr = JXG.keysToLowerCase({radiusPoint: {visible: false}});
         *
         * // return {radiuspoint: {visible: false}}
         */
        keysToLowerCase: function (obj) {
            var key, val,
                keys = Object.keys(obj),
                n = keys.length,
                newObj = {};

            if (typeof obj !== 'object') {
                return obj;
            }

            while (n--) {
                key = keys[n];
                if (obj.hasOwnProperty(key)) {
                    // We recurse into an object only if it is
                    // neither a DOM node nor an JSXGraph object
                    val = obj[key];
                    if (typeof val === 'object' && val !== null &&
                        !this.isArray(val) &&
                        !this.exists(val.nodeType) &&
                        !this.exists(val.board)) {
                        newObj[key.toLowerCase()] = this.keysToLowerCase(val);
                    } else {
                        newObj[key.toLowerCase()] = val;
                    }
                }
            }
            return newObj;
        },

        /**
         * Generates an attributes object that is filled with default values from the Options object
         * and overwritten by the user specified attributes.
         * @param {Object} attributes user specified attributes
         * @param {Object} options defaults options
         * @param {String} s variable number of strings, e.g. 'slider', subtype 'point1'. Must be provided in lower case!
         * @returns {Object} The resulting attributes object
         */
        copyAttributes: function (attributes, options, s) {
            var a, arg, i, len, o, isAvail,
                primitives = {
                    circle: 1,
                    curve: 1,
                    foreignobject: 1,
                    image: 1,
                    line: 1,
                    point: 1,
                    polygon: 1,
                    text: 1,
                    ticks: 1,
                    integral: 1
                };

            len = arguments.length;
            if (len < 3 || primitives[s]) {
                // Default options from Options.elements
                a = JXG.deepCopy(options.elements, null, true);
            } else {
                a = {};
            }

            // Only the layer of the main element is set.
            if (len < 4 && this.exists(s) && this.exists(options.layer[s])) {
                a.layer = options.layer[s];
            }

            // Default options from the specific element like 'line' in
            //     copyAttribute(attributes, board.options, 'line')
            // but also like in
            //     Type.copyAttributes(attributes, board.options, 'view3d', 'az', 'slider');
            o = options;
            isAvail = true;
            for (i = 2; i < len; i++) {
                arg = arguments[i];
                if (this.exists(o[arg])) {
                    o = o[arg];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail) {
                a = JXG.deepCopy(a, o, true);
            }

            // Merge the specific options given in the parameter 'attributes'
            // into the default options.
            // Additionally, we step into a sub-element of attribute like line.point1 -
            // in case it is supplied as in
            //     copyAttribute(attributes, board.options, 'line', 'point1')
            // In this case we would merge attributes.point1 into the global line.point1 attributes.
            o = (typeof attributes === 'object') ? this.keysToLowerCase(attributes) : {};
            isAvail = true;
            for (i = 3; i < len; i++) {
                arg = arguments[i].toLowerCase();
                if (this.exists(o[arg])) {
                    o = o[arg];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail) {
                this.mergeAttr(a, o, true);
            }

            if (arguments[2] === 'board') {
                // For board attributes we are done now.
                return a;
            }

            // Special treatment of labels
            o = options;
            isAvail = true;
            for (i = 2; i < len; i++) {
                arg = arguments[i];
                if (this.exists(o[arg])) {
                    o = o[arg];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail && this.exists(o.label)) {
                a.label = JXG.deepCopy(o.label, a.label, true);
            }
            a.label = JXG.deepCopy(options.label, a.label, true);

            return a;
        },

        /**
         * Copy all prototype methods from object "superObject" to object
         * "subObject". The constructor of superObject will be available
         * in subObject as subObject.constructor[constructorName].
         * @param {Object} subObj A JavaScript object which receives new methods.
         * @param {Object} superObj A JavaScript object which lends its prototype methods to subObject
         * @returns {String} constructorName Under this name the constructor of superObj will be available
         * in subObject.
         * @private
         */
        copyPrototypeMethods: function (subObject, superObject, constructorName) {
            var key;

            subObject.prototype[constructorName] = superObject.prototype.constructor;
            for (key in superObject.prototype) {
                if (superObject.prototype.hasOwnProperty(key)) {
                    subObject.prototype[key] = superObject.prototype[key];
                }
            }
        },

        /**
         * Create a stripped down version of a JSXGraph element for cloning to the background.
         * Used in {JXG.GeometryElement#cloneToBackground} for creating traces.
         *
         * @param {JXG.GeometryElement} el Element to be cloned
         * @returns Object Cloned element
         * @private
         */
        getCloneObject: function(el) {
            var obj, key,
                copy = {};

            copy.id = el.id + "T" + el.numTraces;
            el.numTraces += 1;

            copy.coords = el.coords;
            obj = this.deepCopy(el.visProp, el.visProp.traceattributes, true);
            copy.visProp = {};
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (
                        key.indexOf('aria') !== 0 &&
                        key.indexOf('highlight') !== 0 &&
                        key.indexOf('attractor') !== 0 &&
                        key !== 'label' &&
                        key !== 'needsregularupdate' &&
                        key !== 'infoboxdigits'
                    ) {
                        copy.visProp[key] = el.eval(obj[key]);
                    }
                }
            }
            copy.evalVisProp = function(val) {
                return copy.visProp[val];
            };
            copy.eval = function(val) {
                return val;
            };

            copy.visProp.layer = el.board.options.layer.trace;
            copy.visProp.tabindex = null;
            copy.visProp.highlight = false;
            copy.board = el.board;
            copy.elementClass = el.elementClass;

            this.clearVisPropOld(copy);
            copy.visPropCalc = {
                visible: el.evalVisProp('visible')
            };

            return copy;
        },

        /**
         * Converts a JavaScript object into a JSON string.
         * @param {Object} obj A JavaScript object, functions will be ignored.
         * @param {Boolean} [noquote=false] No quotes around the name of a property.
         * @returns {String} The given object stored in a JSON string.
         * @deprecated
         */
        toJSON: function (obj, noquote) {
            var list, prop, i, s, val;

            noquote = JXG.def(noquote, false);

            // check for native JSON support:
            if (JSON !== undefined && JSON.stringify && !noquote) {
                try {
                    s = JSON.stringify(obj);
                    return s;
                } catch (e) {
                    // if something goes wrong, e.g. if obj contains functions we won't return
                    // and use our own implementation as a fallback
                }
            }

            switch (typeof obj) {
                case "object":
                    if (obj) {
                        list = [];

                        if (this.isArray(obj)) {
                            for (i = 0; i < obj.length; i++) {
                                list.push(JXG.toJSON(obj[i], noquote));
                            }

                            return "[" + list.join(",") + "]";
                        }

                        for (prop in obj) {
                            if (obj.hasOwnProperty(prop)) {
                                try {
                                    val = JXG.toJSON(obj[prop], noquote);
                                } catch (e2) {
                                    val = "";
                                }

                                if (noquote) {
                                    list.push(prop + ":" + val);
                                } else {
                                    list.push('"' + prop + '":' + val);
                                }
                            }
                        }

                        return "{" + list.join(",") + "} ";
                    }
                    return 'null';
                case "string":
                    return "'" + obj.replace(/(["'])/g, "\\$1") + "'";
                case "number":
                case "boolean":
                    return obj.toString();
            }

            return '0';
        },

        /**
         * Resets visPropOld.
         * @param {JXG.GeometryElement} el
         * @returns {GeometryElement}
         */
        clearVisPropOld: function (el) {
            el.visPropOld = {
                cssclass: "",
                cssdefaultstyle: "",
                cssstyle: "",
                fillcolor: "",
                fillopacity: "",
                firstarrow: false,
                fontsize: -1,
                lastarrow: false,
                left: -100000,
                linecap: "",
                shadow: false,
                strokecolor: "",
                strokeopacity: "",
                strokewidth: "",
                tabindex: -100000,
                transitionduration: 0,
                top: -100000,
                visible: null
            };

            return el;
        },

        /**
         * Checks if an object contains a key, whose value equals to val.
         * @param {Object} obj
         * @param val
         * @returns {Boolean}
         */
        isInObject: function (obj, val) {
            var el;

            for (el in obj) {
                if (obj.hasOwnProperty(el)) {
                    if (obj[el] === val) {
                        return true;
                    }
                }
            }

            return false;
        },

        /**
         * Replaces all occurences of &amp; by &amp;amp;, &gt; by &amp;gt;, and &lt; by &amp;lt;.
         * @param {String} str
         * @returns {String}
         */
        escapeHTML: function (str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },

        /**
         * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
         * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
         * @param {String} str
         * @returns {String}
         */
        unescapeHTML: function (str) {
            // This regex is NOT insecure. We are replacing everything found with ''
            /*jslint regexp:true*/
            return str
                .replace(/<\/?[^>]+>/gi, "")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");
        },

        /**
         * Makes a string lower case except for the first character which will be upper case.
         * @param {String} str Arbitrary string
         * @returns {String} The capitalized string.
         */
        capitalize: function (str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        },

        /**
         * Make numbers given as strings nicer by removing all unnecessary leading and trailing zeroes.
         * @param {String} str
         * @returns {String}
         */
        trimNumber: function (str) {
            str = str.replace(/^0+/, "");
            str = str.replace(/0+$/, "");

            if (str[str.length - 1] === "." || str[str.length - 1] === ",") {
                str = str.slice(0, -1);
            }

            if (str[0] === "." || str[0] === ",") {
                str = "0" + str;
            }

            return str;
        },

        /**
         * Filter an array of elements.
         * @param {Array} list
         * @param {Object|function} filter
         * @returns {Array}
         */
        filterElements: function (list, filter) {
            var i,
                f,
                item,
                flower,
                value,
                visPropValue,
                pass,
                l = list.length,
                result = [];

            if (this.exists(filter) && typeof filter !== "function" && typeof filter !== 'object') {
                return result;
            }

            for (i = 0; i < l; i++) {
                pass = true;
                item = list[i];

                if (typeof filter === 'object') {
                    for (f in filter) {
                        if (filter.hasOwnProperty(f)) {
                            flower = f.toLowerCase();

                            if (typeof item[f] === 'function') {
                                value = item[f]();
                            } else {
                                value = item[f];
                            }

                            if (item.visProp && typeof item.visProp[flower] === 'function') {
                                visPropValue = item.visProp[flower]();
                            } else {
                                visPropValue = item.visProp && item.visProp[flower];
                            }

                            if (typeof filter[f] === 'function') {
                                pass = filter[f](value) || filter[f](visPropValue);
                            } else {
                                pass = value === filter[f] || visPropValue === filter[f];
                            }

                            if (!pass) {
                                break;
                            }
                        }
                    }
                } else if (typeof filter === 'function') {
                    pass = filter(item);
                }

                if (pass) {
                    result.push(item);
                }
            }

            return result;
        },

        /**
         * Remove all leading and trailing whitespaces from a given string.
         * @param {String} str
         * @returns {String}
         */
        trim: function (str) {
            // str = str.replace(/^\s+/, '');
            // str = str.replace(/\s+$/, '');
            //
            // return str;
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        },

        /**
         * Convert a floating point number to a string integer + fraction.
         * Returns either a string of the form '3 1/3' (in case of useTeX=false)
         * or '3 \\frac{1}{3}' (in case of useTeX=true).
         *
         * @param {Number} x
         * @param {Boolean} [useTeX=false]
         * @param {Number} [order=0.001]
         * @returns {String}
         * @see JXG.Math.decToFraction
         */
        toFraction: function (x, useTeX, order) {
            var arr = Mat.decToFraction(x, order),
                str = '';

            if (arr[1] === 0 && arr[2] === 0) {
                // 0
                str += '0';
            } else {
                // Sign
                if (arr[0] < 0) {
                    str += '-';
                }
                if (arr[2] === 0) {
                    // Integer
                    str += arr[1];
                } else if (!(arr[2] === 1 && arr[3] === 1)) {
                    // Proper fraction
                    if (arr[1] !== 0) {
                        // Absolute value larger than 1
                        str += arr[1] + ' ';
                    }
                    // Add fractional part
                    if (useTeX === true) {
                        str += '\\frac{' + arr[2] + '}{' + arr[3] + '}';
                    } else {
                        str += arr[2] + '/' + arr[3];
                    }
                }
            }
            return str;
        },

        /**
         * Concat array src to array dest.
         * Uses push instead of JavaScript concat, which is much
         * faster.
         * The array dest is changed in place.
         * <p><b>Attention:</b> if "dest" is an anonymous array, the correct result is returned from the function.
         *
         * @param {Array} dest
         * @param {Array} src
         * @returns Array
         */
        concat: function(dest, src) {
            var i,
                le = src.length;
            for (i = 0; i < le; i++) {
                dest.push(src[i]);
            }
            return dest;
        },

        /**
         * Convert HTML tags to entities or use html_sanitize if the google caja html sanitizer is available.
         * @param {String} str
         * @param {Boolean} caja
         * @returns {String} Sanitized string
         */
        sanitizeHTML: function (str, caja) {
            if (typeof html_sanitize === "function" && caja) {
                return html_sanitize(
                    str,
                    function () {
                        return undefined;
                    },
                    function (id) {
                        return id;
                    }
                );
            }

            if (str && typeof str === 'string') {
                str = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }

            return str;
        },

        /**
         * If <tt>s</tt> is a slider, it returns the sliders value, otherwise it just returns the given value.
         * @param {*} s
         * @returns {*} s.Value() if s is an element of type slider, s otherwise
         */
        evalSlider: function (s) {
            if (s && s.type === Const.OBJECT_TYPE_GLIDER && typeof s.Value === 'function') {
                return s.Value();
            }

            return s;
        },

        /**
         * Convert a string containing a MAXIMA /STACK expression into a JSXGraph / JessieCode string
         * or an array of JSXGraph / JessieCode strings.
         * <p>
         * This function is meanwhile superseded by stack_jxg.stack2jsxgraph.
         *
         * @deprecated
         *
         * @example
         * console.log( JXG.stack2jsxgraph("%e**x") );
         * // Output:
         * //    "EULER**x"
         *
         * @example
         * console.log( JXG.stack2jsxgraph("[%pi*(x**2 - 1), %phi*(x - 1), %gamma*(x+1)]") );
         * // Output:
         * //    [ "PI*(x**2 - 1)", "1.618033988749895*(x - 1)", "0.5772156649015329*(x+1)" ]
         *
         * @param {String} str
         * @returns String
         */
        stack2jsxgraph: function(str) {
            var t;

            t = str.
                replace(/%pi/g, 'PI').
                replace(/%e/g, 'EULER').
                replace(/%phi/g, '1.618033988749895').
                replace(/%gamma/g, '0.5772156649015329').
                trim();

            // String containing array -> array containing strings
            if (t[0] === '[' && t[t.length - 1] === ']') {
                t = t.slice(1, -1).split(/\s*,\s*/);
            }

            return t;
        }
    }
);

export default JXG;
