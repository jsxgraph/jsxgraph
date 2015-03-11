/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, html_sanitize: true*/
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

define([
    'jxg', 'base/constants'
], function (JXG, Const) {

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
            return typeof v === "number" || Object.prototype.toString.call(v) === '[Object Number]';
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
                r = (v !== null && typeof v === "object" && typeof v.splice === 'function' && typeof v.join === 'function');
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
                return (v.elementClass === Const.OBJECT_CLASS_POINT);
            }

            return false;
        },

        /**
         * Checks if a given variable is a reference of a JSXGraph Point element or an array of length at least two or
         * a function returning an array of length two or three.
         * @param v A variable of any type.
         * @returns {Boolean} True, if v is of type JXG.Point.
         */
        isPointType: function (v, board) {
            var val;

            v = board.select(v);
            if (this.isArray(v)) {
                return true;
            }
            if (this.isFunction(v)) {
                val = v();
                if (this.isArray(val) && val.length > 1) {
                    return true;
                }
            }
            return this.isPoint(v);
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
         * @param {String|Number|Function} term A variable of type string, function or number.
         * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
         * by a GEONE<sub>X</sub>T string, thus it must be a valid reference only in case one of the param
         * values is of type string.
         * @param {String} variableName Only required if evalGeonext is set to true. Describes the variable name
         * of the variable in a GEONE<sub>X</sub>T string given as term.
         * @param {Boolean} [evalGeonext=true] Set this true, if term should be treated as a GEONE<sub>X</sub>T string.
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
                /** @ignore */
                f = function () {
                    return term;
                };
            } else if (JXG.isString(term)) {
                // In case of string function like fontsize
                /** @ignore */
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
         *  Test if the parents array contains existing points. If instead parents contains coordinate arrays or function returning coordinate arrays
         *  free points with these coordinates are created. 
         * 
         * @param {JXG.Board} board Board object
         * @param {Array} parents Array containing parent elements for a new object. This array may contain
         *    <ul>
         *      <li> {@link JXG.Point} objects
         *      <li> {@link JXG.Element#name} of {@link JXG.Point} objects
         *      <li> {@link JXG.Element#id} of {@link JXG.Point} objects
         *      <li> Coordinates of points given as array of numbers of length two or three, e.g. [2, 3].
         *      <li> Coordinates of points given as array of functions of length two or three. Each function returns one coordinate, e.g.
         *           [function(){ return 2; }, function(){ return 3; }]
         *      <li> Function returning coordinates, e.g. function() { return [2, 3]; }
         *    </ul>  
         *  In the last three cases a new point will be created.
         * @param {String} attrClass Main attribute class of newly created points, see {@link JXG@copyAttributes}
         * @param {Array} attrArray List of subtype attributes for the newly created points. The list of subtypes is mapped to the list of new points.
         * @returns {Array} List of newly created {@link JXG.Point} elements or false if not all returned elements are points.
         */
        providePoints: function (board, parents, attributes, attrClass, attrArray) {
            var i, j,
                len,
                lenAttr = 0,
                points = [], attr, p, val;

            if (!this.isArray(parents)) {
                parents = [parents];
            }
            len = parents.length;
            if (JXG.exists(attrArray)) {
                lenAttr = attrArray.length;
            }
            if (lenAttr === 0) {
                attr = this.copyAttributes(attributes, board.options, attrClass);
            }

            for (i = 0; i < len; ++i) {
                if (lenAttr > 0) {
                    j = Math.min(i, lenAttr - 1);
                    attr = this.copyAttributes(attributes, board.options, attrClass, attrArray[j]);
                }
                if (this.isArray(parents[i]) && parents[i].length > 1) {
                    points.push(board.create('point', parents[i], attr));
                } else if (this.isFunction(parents[i])) {
                    val = parents[i]();
                    if (this.isArray(val) && (val.length > 1)) {
                        points.push(board.create('point', [parents[i]], attr));
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
            var i, s = JXG.exists(sub);

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
         * Generates a copy of an array and removes the duplicate entries. The original
         * Array will be altered.
         * @param {Array} arr
         * @returns {Array}
         */
        uniqueArray: function (arr) {
            var i, j, isArray, ret = [];

            if (arr.length === 0) {
                return [];
            }

            for (i = 0; i < arr.length; i++) {
                isArray = JXG.isArray(arr[i]);

                for (j = i + 1; j < arr.length; j++) {
                    if (isArray && JXG.cmpArrays(arr[i], arr[j])) {
                        arr[i] = [];
                    } else if (!isArray && arr[i] === arr[j]) {
                        arr[i] = '';
                    }
                }
            }

            j = 0;

            for (i = 0; i < arr.length; i++) {
                isArray = JXG.isArray(arr[i]);

                if (!isArray && arr[i] !== '') {
                    ret[j] = arr[i];
                    j += 1;
                } else if (isArray && arr[i].length !== 0) {
                    ret[j] = (arr[i].slice(0));
                    j += 1;
                }
            }

            arr = ret;
            return ret;
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
                if (a1[i] !== a2[i]) {
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

            /*jslint bitwise: true*/

            /* 
             * The performance gain of this bitwise trick is marginal and the behavior 
             * is different from toFixed: toFixed rounds, the bitweise operation truncateds
             */
            //if (p === 0) {
            //    n = ~n;
            //    n = ~n;
            //} else {
            n = n.toFixed(p);
            //}

            return n;
        },

        /**
         * Truncate a number <tt>val</tt> automatically.
         * @param val
         * @returns {Number}
         */
        autoDigits: function (val) {
            var x = Math.abs(val);

            if (x > 0.1) {
                x = val.toFixed(2);
            } else if (x >= 0.01) {
                x = val.toFixed(4);
            } else if (x >= 0.0001) {
                x = val.toFixed(6);
            } else {
                x = val;
            }
            return x;
        },

        /**
         * Extracts the keys of a given object.
         * @param object The object the keys are to be extracted
         * @param onlyOwn If true, hasOwnProperty() is used to verify that only keys are collected
         * the object owns itself and not some other object in the prototype chain.
         * @returns {Array} All keys of the given object.
         */
        keys: function (object, onlyOwn) {
            var keys = [], property;

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
                cObj = function () {};

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
         * Recursively merges obj2 into obj1. Contrary to {@link JXG#deepCopy} this won't create a new object
         * but instead will
         * @param {Object} obj1
         * @param {Object} obj2
         * @returns {Object}
         */
        merge: function (obj1, obj2) {
            var i, j;

            for (i in obj2) {
                if (obj2.hasOwnProperty(i)) {
                    if (this.isArray(obj2[i])) {
                        if (!obj1[i]) {
                            obj1[i] = [];
                        }

                        for (j = 0; j < obj2[i].length; j++) {
                            if (typeof obj2[i][j] === 'object') {
                                obj1[i][j] = this.merge(obj1[i][j], obj2[i][j]);
                            } else {
                                obj1[i][j] = obj2[i][j];
                            }
                        }
                    } else if (typeof obj2[i] === 'object') {
                        if (!obj1[i]) {
                            obj1[i] = {};
                        }

                        obj1[i] = this.merge(obj1[i], obj2[i]);
                    } else {
                        obj1[i] = obj2[i];
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
            var c, i, prop, j, i2;

            toLower = toLower || false;

            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            // missing hasOwnProperty is on purpose in this function
            /*jslint forin:true*/
            /*jshint forin:false*/

            if (this.isArray(obj)) {
                c = [];
                for (i = 0; i < obj.length; i++) {
                    prop = obj[i];
                    if (typeof prop === 'object') {
                        c[i] = this.deepCopy(prop);
                    } else {
                        c[i] = prop;
                    }
                }
            } else {
                c = {};
                for (i in obj) {
                    i2 = toLower ? i.toLowerCase() : i;

                    prop = obj[i];
                    if (typeof prop === 'object') {
                        c[i2] = this.deepCopy(prop);
                    } else {
                        c[i2] = prop;
                    }
                }

                for (i in obj2) {
                    i2 = toLower ? i.toLowerCase() : i;

                    prop = obj2[i];
                    if (typeof prop === 'object') {
                        if (JXG.isArray(prop) || !JXG.exists(c[i2])) {
                            c[i2] = this.deepCopy(prop);
                        } else {
                            c[i2] = this.deepCopy(c[i2], prop, toLower);
                        }
                    } else {
                        c[i2] = prop;
                    }
                }
            }

            /*jslint forin:false*/
            /*jshint forin:true*/

            return c;
        },

        /**
         * Generates an attributes object that is filled with default values from the Options object
         * and overwritten by the user speciified attributes.
         * @param {Object} attributes user specified attributes
         * @param {Object} options defaults options
         * @param {String} s variable number of strings, e.g. 'slider', subtype 'point1'.
         * @returns {Object} The resulting attributes object
         */
        copyAttributes: function (attributes, options, s) {
            var a, i, len, o, isAvail,
                primitives = {
                    'circle': 1,
                    'curve': 1,
                    'image': 1,
                    'line': 1,
                    'point': 1,
                    'polygon': 1,
                    'text': 1,
                    'ticks': 1,
                    'integral': 1
                };


            len = arguments.length;
            if (len < 3 || primitives[s]) {
                // default options from Options.elements
                a = JXG.deepCopy(options.elements, null, true);
            } else {
                a = {};
            }

            // Only the layer of the main element is set.
            if (len < 4 && this.exists(s) && this.exists(options.layer[s])) {
                a.layer = options.layer[s];
            }

            // default options from specific elements
            o = options;
            isAvail = true;
            for (i = 2; i < len; i++) {
                if (JXG.exists(o[arguments[i]])) {
                    o = o[arguments[i]];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail) {
                a = JXG.deepCopy(a, o, true);
            }

            // options from attributes
            o = attributes;
            isAvail = true;
            for (i = 3; i < len; i++) {
                if (JXG.exists(o[arguments[i]])) {
                    o = o[arguments[i]];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail) {
                this.extend(a, o, null, true);
            }

            // Special treatment of labels
            o = options;
            isAvail = true;
            for (i = 2; i < len; i++) {
                if (JXG.exists(o[arguments[i]])) {
                    o = o[arguments[i]];
                } else {
                    isAvail = false;
                    break;
                }
            }
            if (isAvail && JXG.exists(o.label)) {
                a.label =  JXG.deepCopy(o.label, a.label);
            }
            a.label = JXG.deepCopy(options.label, a.label);

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
            for (key in superObject.prototype)  {
                subObject.prototype[key] = superObject.prototype[key];
            }
        },

        /**
         * Converts a JavaScript object into a JSON string.
         * @param {Object} obj A JavaScript object, functions will be ignored.
         * @param {Boolean} [noquote=false] No quotes around the name of a property.
         * @returns {String} The given object stored in a JSON string.
         */
        toJSON: function (obj, noquote) {
            var list, prop, i, s, val;

            noquote = JXG.def(noquote, false);

            // check for native JSON support:
            if (typeof JSON && JSON.stringify && !noquote) {
                try {
                    s = JSON.stringify(obj);
                    return s;
                } catch (e) {
                    // if something goes wrong, e.g. if obj contains functions we won't return
                    // and use our own implementation as a fallback
                }
            }

            switch (typeof obj) {
            case 'object':
                if (obj) {
                    list = [];

                    if (JXG.isArray(obj)) {
                        for (i = 0; i < obj.length; i++) {
                            list.push(JXG.toJSON(obj[i], noquote));
                        }

                        return '[' + list.join(',') + ']';
                    }

                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            try {
                                val = JXG.toJSON(obj[prop], noquote);
                            } catch (e2) {
                                val = '';
                            }

                            if (noquote) {
                                list.push(prop + ':' + val);
                            } else {
                                list.push('"' + prop + '":' + val);
                            }
                        }
                    }

                    return '{' + list.join(',') + '} ';
                }
                return 'null';
            case 'string':
                return '\'' + obj.replace(/(["'])/g, '\\$1') + '\'';
            case 'number':
            case 'boolean':
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
                strokecolor: '',
                strokeopacity: '',
                strokewidth: '',
                fillcolor: '',
                fillopacity: '',
                shadow: false,
                firstarrow: false,
                lastarrow: false,
                cssclass: '',
                fontsize: -1,
                left: -100000,
                top: -100000
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
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        /**
         * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
         * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
         * @param {String} str
         * @returns {String}
         */
        unescapeHTML: function (str) {
            // this regex is NOT insecure. We are replacing everything found with ''
            /*jslint regexp:true*/
            return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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
            str = str.replace(/^0+/, '');
            str = str.replace(/0+$/, '');

            if (str[str.length - 1] === '.' || str[str.length - 1] === ',') {
                str = str.slice(0, -1);
            }

            if (str[0] === '.' || str[0] === ',') {
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
            var i, f, item, flower, value, visPropValue, pass,
                l = list.length,
                result = [];

            if (typeof filter !== 'function' && typeof filter !== 'object') {
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
                                pass = (value === filter[f] || visPropValue === filter[f]);
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
            str = str.replace(/^\s+/, '');
            str = str.replace(/\s+$/, '');

            return str;
        },

        /**
         * Convert HTML tags to entities or use html_sanitize if the google caja html sanitizer is available.
         * @param {String} str
         * @param {Boolean} caja
         * @returns {String} Sanitized string
         */
        sanitizeHTML: function (str, caja) {
            if (typeof html_sanitize === 'function' && caja) {
                return html_sanitize(str, function () { return; }, function (id) { return id; });
            }

            if (str) {
                str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
                s = s.Value();
            }

            return s;
        }
    });

    return JXG;
});
