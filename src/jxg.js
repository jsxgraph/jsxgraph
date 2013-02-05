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


/*global JXG: true, jQuery: true, window: true, document: true, navigator: true, require: true, module: true, console: true */
/*jslint nomen: true, plusplus: true*/

/* depends:
 utils/env (getPosition, getDimensions, getStyle)
 utils/array (removeEvent, collectionContains)
 utils/type (removeEvent, deepCopy, toJSON, trunc, iife below)
 utils/type (jxg.exists)
 jsxgraph, to create and initialize a board. this occurs twice.
           the first occurence is a shortcut to initBoard - it should be removed
           the second occurence is the IIFE below the JXG definition and should be moved
           to another file
 */

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 * @version 0.83
 */

(function () {

    "use strict";

    // We need the following two methods "extend" and "shortcut" to create the JXG object via JXG.extend.

    /**
     * Copy all properties of the <tt>extension</tt> object to <tt>object</tt>.
     * @param {Object} object
     * @param {Object} extension
     * @param {Boolean} [onlyOwn=false] Only consider properties that belong to extension itself, not any inherited properties.
     * @param {Boolean} [toLower=false] If true the keys are convert to lower case. This is needed for visProp, see JXG#copyAttributes
     */
    JXG.extend = function (object, extension, onlyOwn, toLower) {
        var e, e2;

        onlyOwn = onlyOwn || false;
        toLower = toLower || false;

        // the purpose of this for...in loop is indeed to use hasOwnProperty only if the caller
        // explicitly wishes so.
        /*jslint forin:true*/
        /*jshint forin:true*/
        for (e in extension) {
            if (!onlyOwn || (onlyOwn && extension.hasOwnProperty(e))) {
                if (toLower) {
                    e2 = e.toLowerCase();
                } else {
                    e2 = e;
                }

                object[e2] = extension[e];
            }
        }
        /*jslint forin:false*/
        /*jshint forin:false*/
    };

    /**
     * Creates a shortcut to a method, e.g. {@link JXG.Board#createElement} is a shortcut to {@link JXG.Board#create}.
     * Sometimes the target is undefined by the time you want to define the shortcut so we need this little helper.
     * @param {Object} object The object the method we want to create a shortcut for belongs to.
     * @param {Function} fun The method we want to create a shortcut for.
     * @returns {Function} A function that calls the given method.
     */
    JXG.shortcut = function (object, fun) {
        return function () {
            return object[fun].apply(this, arguments);
        };
    };


    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Resets visPropOld of <tt>el</tt>
         * @param {JXG.GeometryElement} el
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
        },

        /**
         * s may be a string containing the name or id of an element or even a reference
         * to the element itself. This function returns a reference to the element. Search order: id, name.
         * @param {JXG.Board} board Reference to the board the element belongs to.
         * @param {String} s String or reference to a JSXGraph element.
         * @returns {Object} Reference to the object given in parameter object
         */
        getRef: function (board, s) {
            if (typeof s === 'string') {
                // Search by ID
                if (JXG.exists(board.objects[s])) {
                    s = board.objects[s];
                // Search by name
                } else if (JXG.exists(board.elementsByName[s])) {
                    s = board.elementsByName[s];
                // Search by group ID
                } else if (JXG.exists(board.groups[s])) {
                    s = board.groups[s];
                }
            }

            return s;
        },

        /**
         * This is just a shortcut to {@link JXG.getRef}.
         */
        getReference: JXG.shortcut(JXG, 'getRef'),

        /**
         * @deprecated
         */
        _board: function (box, attributes) {
            return JXG.JSXGraph.initBoard(box, attributes);
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
                a = this.deepCopy(options.elements, null, true);
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
                a = this.deepCopy(a, o, true);
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
         * Reads the width and height of an HTML element.
         * @param {String} elementId The HTML id of an HTML DOM node.
         * @returns {Object} An object with the two properties width and height.
         */
        getDimensions: function (elementId) {
            var element, display, els, originalVisibility, originalPosition,
                originalDisplay, originalWidth, originalHeight;

            if (!JXG.isBrowser || elementId === null) {
                return {
                    width: 500,
                    height: 500
                };
            }

            // Borrowed from prototype.js
            element = document.getElementById(elementId);
            if (!JXG.exists(element)) {
                throw new Error("\nJSXGraph: HTML container element '" + (elementId) + "' not found.");
            }

            display = element.style.display;

            // Work around a bug in Safari
            if (display !== 'none' && display !== null) {
                return {width: element.offsetWidth, height: element.offsetHeight};
            }

            // All *Width and *Height properties give 0 on elements with display set to none,
            // hence we show the element temporarily
            els = element.style;

            // save style
            originalVisibility = els.visibility;
            originalPosition = els.position;
            originalDisplay = els.display;

            // show element
            els.visibility = 'hidden';
            els.position = 'absolute';
            els.display = 'block';

            // read the dimension
            originalWidth = element.clientWidth;
            originalHeight = element.clientHeight;

            // restore original css values
            els.display = originalDisplay;
            els.position = originalPosition;
            els.visibility = originalVisibility;

            return {
                width: originalWidth,
                height: originalHeight
            };
        },

        /**
         * Adds an event listener to a DOM element.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Function} fn The function to call when the event is triggered.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        addEvent: function (obj, type, fn, owner) {
            var el = function () {
                return fn.apply(owner, arguments);
            };

            el.origin = fn;
            owner['x_internal' + type] = owner['x_internal' + type] || [];
            owner['x_internal' + type].push(el);

            // Non-IE browser
            if (JXG.exists(obj) && JXG.exists(obj.addEventListener)) {
                obj.addEventListener(type, el, false);
            } else {  // IE
                obj.attachEvent('on' + type, el);
            }
        },

        /**
         * Removes an event listener from a DOM element.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Function} fn The function to call when the event is triggered.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        removeEvent: function (obj, type, fn, owner) {
            var i;

            if (!JXG.exists(owner)) {
                JXG.debug('no such owner');
                return;
            }

            if (!JXG.exists(owner['x_internal' + type])) {
                JXG.debug('no such type: ' + type);
                return;
            }

            if (!JXG.isArray(owner['x_internal' + type])) {
                JXG.debug('owner[x_internal + ' + type + '] is not an array');
                return;
            }

            i = JXG.indexOf(owner['x_internal' + type], fn, 'origin');

            if (i === -1) {
                JXG.debug('no such event function in internal list: ' + fn);
                return;
            }

            try {
                if (JXG.exists(obj.addEventListener)) { // Non-IE browser
                    obj.removeEventListener(type, owner['x_internal' + type][i], false);
                } else {  // IE
                    obj.detachEvent('on' + type, owner['x_internal' + type][i]);
                }

            } catch (e) {
                JXG.debug('event not registered in browser: (' + type + ' -- ' + fn + ')');
            }

            owner['x_internal' + type].splice(i, 1);
        },

        /**
         * Removes all events of the given type from a given DOM node; Use with caution and do not use it on a container div
         * of a {@link JXG.Board} because this might corrupt the event handling system.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        removeAllEvents: function (obj, type, owner) {
            var i, len;
            if (owner['x_internal' + type]) {
                len = owner['x_internal' + type].length;

                for (i = len - 1; i >= 0; i--) {
                    JXG.removeEvent(obj, type, owner['x_internal' + type][i].origin, owner);
                }

                if (owner['x_internal' + type].length > 0) {
                    JXG.debug('removeAllEvents: Not all events could be removed.');
                }
            }
        },

        /**
         * Cross browser mouse / touch coordinates retrieval relative to the board's top left corner.
         * @param {Object} [e] The browsers event object. If omitted, <tt>window.event</tt> will be used.
         * @param {Number} [index] If <tt>e</tt> is a touch event, this provides the index of the touch coordinates, i.e. it determines which finger.
         * @returns {Array} Contains the position as x,y-coordinates in the first resp. second component.
         */
        getPosition: function (e, index) {
            var i, len, evtTouches,
                posx = 0,
                posy = 0;

            if (!e) {
                e = window.event;
            }

            evtTouches = e[JXG.touchProperty];

            if (JXG.exists(index)) {
                if (index === -1) {
                    len = evtTouches.length;

                    for (i = 0; i < len; i++) {
                        if (evtTouches[i]) {
                            e = evtTouches[i];
                            break;
                        }
                    }
                } else {
                    e = evtTouches[index];
                }
            }

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            return [posx, posy];
        },

        /**
         * Calculates recursively the offset of the DOM element in which the board is stored.
         * @param {Object} obj A DOM element
         * @returns {Array} An array with the elements left and top offset.
         */
        getOffset: function (obj) {
            var cPos,
                o = obj,
                o2 = obj,
                l = o.offsetLeft - o.scrollLeft,
                t = o.offsetTop - o.scrollTop;

            cPos = this.getCSSTransform([l, t], o);
            l = cPos[0];
            t = cPos[1];

            /*
             * In Mozilla and Webkit: offsetParent seems to jump at least to the next iframe,
             * if not to the body. In IE and if we are in an position:absolute environment
             * offsetParent walks up the DOM hierarchy.
             * In order to walk up the DOM hierarchy also in Mozilla and Webkit
             * we need the parentNode steps.
             */
            o = o.offsetParent;
            while (o) {
                l += o.offsetLeft;
                t += o.offsetTop;

                if (o.offsetParent) {
                    l += o.clientLeft - o.scrollLeft;
                    t += o.clientTop - o.scrollTop;
                }

                cPos = this.getCSSTransform([l, t], o);
                l = cPos[0];
                t = cPos[1];

                o2 = o2.parentNode;

                while (o2 !== o) {
                    l += o2.clientLeft - o2.scrollLeft;
                    t += o2.clientTop - o2.scrollTop;

                    cPos = this.getCSSTransform([l, t], o2);
                    l = cPos[0];
                    t = cPos[1];

                    o2 = o2.parentNode;
                }
                o = o.offsetParent;
            }
            return [l, t];
        },

        /**
         * Access CSS style sheets.
         * @param {Object} obj A DOM element
         * @param {String} stylename The CSS property to read.
         * @returns The value of the CSS property and <tt>undefined</tt> if it is not set.
         */
        getStyle: function (obj, stylename) {
            var r;

            // Non-IE
            if (window.getComputedStyle) {
                r = document.defaultView.getComputedStyle(obj, null).getPropertyValue(stylename);
            // IE
            } else if (obj.currentStyle && JXG.ieVersion >= 9) {
                r = obj.currentStyle[stylename];
            } else {
                if (obj.style) {
                    // make stylename lower camelcase
                    stylename = stylename.replace(/-([a-z]|[0-9])/ig, function (all, letter) {
                        return letter.toUpperCase();
                    });
                    r = obj.style[stylename];
                }
            }

            return r;
        },

        /**
         * Correct position of upper left corner in case of
         * a CSS transformation. Here, only translations are
         * extracted. All scaling transformations are corrected
         * in {@link JXG.Board#getMousePosition}.
         * @param {Array} cPos Previously determined position
         * @param {Object} obj A DOM element
         * @returns {Array} The corrected position.
         */
        getCSSTransform: function (cPos, obj) {
            var i, j, str, arrStr, start, len, len2, arr,
                t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'];

            // Take the first transformation matrix
            len = t.length;

            for (i = 0, str = ''; i < len; i++) {
                if (JXG.exists(obj.style[t[i]])) {
                    str = obj.style[t[i]];
                    break;
                }
            }

            /**
             * Extract the coordinates and apply the transformation
             * to cPos
             */
            if (str !== '') {
                start = str.indexOf('(');

                if (start > 0) {
                    len = str.length;
                    arrStr = str.substring(start + 1, len - 1);
                    arr = arrStr.split(',');

                    for (j = 0, len2 = arr.length; j < len2; j++) {
                        arr[j] = parseFloat(arr[j]);
                    }

                    if (str.indexOf('matrix') === 0) {
                        cPos[0] += arr[4];
                        cPos[1] += arr[5];
                    } else if (str.indexOf('translateX') === 0) {
                        cPos[0] += arr[0];
                    } else if (str.indexOf('translateY') === 0) {
                        cPos[1] += arr[0];
                    } else if (str.indexOf('translate') === 0) {
                        cPos[0] += arr[0];
                        cPos[1] += arr[1];
                    }
                }
            }
            return cPos;
        },

        /**
         * Scaling CSS transformations applied to the div element containing the JSXGraph constructions
         * are determined. Not implemented are 'rotate', 'skew', 'skewX', 'skewY'.
         * @returns {Array} 3x3 transformation matrix. See {@link JXG.Board#updateCSSTransforms}.
         */
        getCSSTransformMatrix: function (obj) {
            var i, j, str, arrstr, start, len, len2, arr,
                t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'],
                mat = [[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]];

            // Take the first transformation matrix
            len = t.length;
            for (i = 0, str = ''; i < len; i++) {
                if (JXG.exists(obj.style[t[i]])) {
                    str = obj.style[t[i]];
                    break;
                }
            }

            if (str !== '') {
                start = str.indexOf('(');

                if (start > 0) {
                    len = str.length;
                    arrstr = str.substring(start + 1, len - 1);
                    arr = arrstr.split(',');

                    for (j = 0, len2 = arr.length; j < len2; j++) {
                        arr[j] = parseFloat(arr[j]);
                    }

                    if (str.indexOf('matrix') === 0) {
                        mat = [[1, 0, 0],
                            [0, arr[0], arr[1]],
                            [0, arr[2], arr[3]]];
                    // Missing are rotate, skew, skewX, skewY
                    } else if (str.indexOf('scaleX') === 0) {
                        mat[1][1] = arr[0];
                    } else if (str.indexOf('scaleY') === 0) {
                        mat[2][2] = arr[0];
                    } else if (str.indexOf('scale') === 0) {
                        mat[1][1] = arr[0];
                        mat[2][2] = arr[1];
                    }
                }
            }
            return mat;
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
         * Replaces all occurences of &amp; by &amp;amp;, &gt; by &amp;gt;, and &lt; by &amp;lt;.
         * @param str
         */
        escapeHTML: function (str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        /**
         * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
         * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
         * @param str
         */
        unescapeHTML: function (str) {
            // this regex is NOT insecure. We are replacing everything found with ''
            /*jslint regexp:true*/
            return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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
         * Converts a JavaScript object into a JSON string.
         * @param {Object} obj A JavaScript object, functions will be ignored.
         * @param {Boolean} [noquote=false] No quotes around the name of a property.
         * @returns {String} The given object stored in a JSON string.
         */
        toJSON: function (obj, noquote) {
            var list, prop, i, s, val;

            noquote = JXG.def(noquote, false);

            // check for native JSON support:
            if (window.JSON && window.JSON.stringify && !noquote) {
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
         * Makes a string lower case except for the first character which will be upper case.
         * @param {String} str Arbitrary string
         * @returns {String} The capitalized string.
         */
        capitalize: function (str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        },

        /**
         * Process data in timed chunks. Data which takes long to process, either because it is such
         * a huge amount of data or the processing takes some time, causes warnings in browsers about
         * irresponsive scripts. To prevent these warnings, the processing is split into smaller pieces
         * called chunks which will be processed in serial order.
         * Copyright 2009 Nicholas C. Zakas. All rights reserved. MIT Licensed
         * @param {Array} items to do
         * @param {Function} process Function that is applied for every array item
         * @param {Object} context The scope of function process
         * @param {Function} callback This function is called after the last array element has been processed.
         */
        timedChunk: function (items, process, context, callback) {
            //create a clone of the original
            var todo = items.concat(),
                timerFun = function () {
                    var start = +new Date();

                    do {
                        process.call(context, todo.shift());
                    } while (todo.length > 0 && (+new Date() - start < 300));

                    if (todo.length > 0) {
                        window.setTimeout(timerFun, 1);
                    } else {
                        callback(items);
                    }
                };

            window.setTimeout(timerFun, 1);
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
         * Truncate a number <tt>n</tt> after <tt>p</tt> decimals.
         * @param {Number} n
         * @param {Number} p
         * @returns {Number}
         */
        trunc: function (n, p) {
            p = JXG.def(p, 0);

            /*jslint bitwise:true*/

            if (p === 0) {
                n = ~n;
                n = ~n;
            } else {
                n = n.toFixed(p);
            }

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
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * @param s An arbitrary number of parameters.
         * @see JXG#debugWST
         */
        debug: function (s) {
            var i, p;

            for (i = 0; i < arguments.length; i++) {
                p = arguments[i];
                if (window.console && console.log) {
                    console.log(p);
                } else if (document.getElementById('debug')) {
                    document.getElementById('debug').innerHTML += p + "<br/>";
                }
            }
        },

        /**
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * This method adds a stack trace (if available).
         * @param s An arbitrary number of parameters.
         * @see JXG#debug
         */
        debugWST: function (s) {
            var e;
            JXG.debug(s);

            if (window.console && console.log) {
                e = new Error();

                if (e && e.stack) {
                    console.log('stacktrace');
                    console.log(e.stack.split('\n').slice(1).join('\n'));
                }
            }
        },

        /**
         * Checks if an object contains a key, whose value equals to val
         */
        isInObject: function (lit, val) {
            var el;

            for (el in lit) {
                if (lit.hasOwnProperty(el)) {
                    if (lit[el] === val) {
                        return true;
                    }
                }
            }

            return false;
        },

        collectionContains: function (arr, val) {
            if (JXG.isArray(arr)) {
                return JXG.isInArray(arr, val);
            }

            if (JXG.isObject(arr)) {
                return JXG.isInObject(arr, val);
            }

            return arr === val;
        }
    });

    return;

    // JessieScript/JessieCode startup: Search for script tags of type text/jessiescript and interpret them.
    if (typeof window === 'object' && typeof document === 'object') {
        JXG.addEvent(window, 'load', function () {
            var scripts = document.getElementsByTagName('script'), type,
                i, j, div, id, board, width, height, bbox, axis, grid, code;

            for (i = 0; i < scripts.length; i++) {
                type = scripts[i].getAttribute('type', false);

                if (JXG.exists(type) && (type.toLowerCase() === 'text/jessiescript' || type.toLowerCase() === 'jessiescript' || type.toLowerCase() === 'text/jessiecode' || type.toLowerCase() === 'jessiecode')) {
                    width = scripts[i].getAttribute('width', false) || '500px';
                    height = scripts[i].getAttribute('height', false) || '500px';
                    bbox = scripts[i].getAttribute('boundingbox', false) || '-5, 5, 5, -5';
                    id = scripts[i].getAttribute('container', false);

                    bbox = bbox.split(',');
                    if (bbox.length !== 4) {
                        bbox = [-5, 5, 5, -5];
                    } else {
                        for (j = 0; j < bbox.length; j++) {
                            bbox[j] = parseFloat(bbox[j]);
                        }
                    }
                    axis = JXG.str2Bool(scripts[i].getAttribute('axis', false) || 'false');
                    grid = JXG.str2Bool(scripts[i].getAttribute('grid', false) || 'false');

                    if (!JXG.exists(id)) {
                        id = 'jessiescript_autgen_jxg_' + i;
                        div = document.createElement('div');
                        div.setAttribute('id', id);
                        div.setAttribute('style', 'width:' + width + '; height:' + height + '; float:left');
                        div.setAttribute('class', 'jxgbox');
                        try {
                            document.body.insertBefore(div, scripts[i]);
                        } catch (e) {
                            // there's probably jquery involved...
                            if (typeof jQuery === 'object') {
                                jQuery(div).insertBefore(scripts[i]);
                            }
                        }
                    } else {
                        div = document.getElementById(id);
                    }

                    if (document.getElementById(id)) {
                        board = JXG.JSXGraph.initBoard(id, {boundingbox: bbox, keepaspectratio: true, grid: grid, axis: axis});

                        code = scripts[i].innerHTML;
                        code = code.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
                        scripts[i].innerHTML = code;
                        if (type.toLowerCase().indexOf('script') > -1) {
                            board.construct(code);
                        } else {
                            try {
                                board.jc.parse(code);
                            } catch (e2) {
                                JXG.debug(e2);
                            }
                        }
                    } else {
                        JXG.debug('JSXGraph: Apparently the div injection failed. Can\'t create a board, sorry.');
                    }
                }
            }
        }, window);
    }
}());
