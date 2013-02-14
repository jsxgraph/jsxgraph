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
 utils/type
 */

/**
 * @fileoverview A collection of helper functions that deal with objects, e.g. extending and copying them as well as
 * extracting information from them.
 */

(function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
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
            if (isAvail) {
                a.label =  JXG.deepCopy(o.label, a.label);
            }
            a.label = JXG.deepCopy(options.label, a.label);

            return a;
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
            if (typeof JSON === 'object' && JSON.stringify && !noquote) {
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
                right: 100000,
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
        }
    });
}());