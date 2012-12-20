/*
 Copyright 2008-2011
 Matthias Ehmann,
 Michael Gerhaeuser,
 Carsten Miller,
 Bianca Valentin,
 Alfred Wassermann,
 Peter Wilfahrt

 This file is part of JSXGraph.

 JSXGraph is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 JSXGraph is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global JXG: true */

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 * @version 0.83
 */


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
};

/**
 * Creates a shortcut to a method, e.g. {@link JXG.Board#create} is a shortcut to {@link JXG.Board#createElement}.
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
     * Determines the property that stores the relevant information in the event object.
     * @type {String}
     * @default 'touches'
     */
    touchProperty: 'touches',


    /**
     * Represents the currently used JSXGraph version.
     * @type {String}
     */
    version: '0.97.1',

    /**
     * A document/window environment is available.
     * @type Boolean
     * @default false
     */
    isBrowser: typeof window === 'object' && typeof document === 'object',

    /**
     * Detect browser support for VML.
     * @returns {Boolean} True, if the browser supports VML.
     */
    supportsVML: function () {
        // From stackoverflow.com
        return this.isBrowser && !!document.namespaces;
    },

    /**
     * Detect browser support for SVG.
     * @returns {Boolean} True, if the browser supports SVG.
     */
    supportsSVG: function () {
        return this.isBrowser && document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
    },

    /**
     * Detect browser support for Canvas.
     * @returns {Boolean} True, if the browser supports HTML canvas.
     */
    supportsCanvas: function () {
        return this.isBrowser && !!document.createElement('canvas').getContext;
    },

    isNode: function () {
        // this is not a 100% sure but should be valid in most cases
        return !this.isBrowser && typeof module === 'object' && module.exports;
    },

    /**
     * Determine if the current browser supports touch events
     * @returns {Boolean} True, if the browser supports touch events.
     */
    isTouchDevice: function () {
        return this.isBrowser && document.documentElement.hasOwnProperty('ontouchstart');
    },

    /**
     * Detects if the user is using an Android powered device.
     * @returns {Boolean}
     */
    isAndroid: function () {
        return JXG.exists(navigator) && navigator.userAgent.toLowerCase().search("android") > -1;
    },

    /**
     * Detects if the user is using the default Webkit browser on an Android powered device.
     * @returns {Boolean}
     */
    isWebkitAndroid: function () {
        return this.isAndroid() && navigator.userAgent.search(" AppleWebKit/") > -1;
    },

    /**
     * Detects if the user is using a Apple iPad / iPhone.
     * @returns {Boolean}
     */
    isApple: function () {
        return JXG.exists(navigator) && (navigator.userAgent.search(/iPad/) != -1 || navigator.userAgent.search(/iPhone/) != -1);
    },

    /**
     * Detects if the user is using Safari on an Apple device.
     * @returns {Boolean}
     */
    isWebkitApple: function () {
        return this.isApple() && (navigator.userAgent.search(/Mobile *.*Safari/) > -1);
    },

    /**
     * Returns true if the run inside a Windows 8 "Metro" App.
     * @return {Boolean}
     */
    isMetroApp: function () {
        return typeof window === 'object' && window.clientInformation && window.clientInformation.appName && window.clientInformation.appName.indexOf('MSAppHost') > -1;
    },

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
            fontsize: -1
        };
    },

    /**
     * Internet Explorer version. Works only for IE > 4.
     * @type Number
     */
    ieVersion: (function() {
        var undef;

        if (typeof document !== 'object') {
            return undef;
        }

        var v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');

        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i><' + '/i><![endif]-->',
                all[0]
            );

        return v > 4 ? v : undef;

    }()),

    /**
     * s may be a string containing the name or id of an element or even a reference
     * to the element itself. This function returns a reference to the element. Search order: id, name.
     * @param {JXG.Board} board Reference to the board the element belongs to.
     * @param {String} s String or reference to a JSXGraph element.
     * @returns {Object} Reference to the object given in parameter object
     */
    getReference: function (board, s) {
        if (typeof(s) == 'string') {
            if (JXG.exists(board.objects[s])) { // Search by ID
                s = board.objects[s];
            } else if (JXG.exists(board.elementsByName[s])) { // Search by name
                s = board.elementsByName[s];
            } else if (JXG.exists(board.groups[s])) { // Search by group ID 
                s = board.groups[s];
            }
        }

        return s;
    },

    /**
     * This is just a shortcut to {@link JXG.getReference}.
     */
    getRef: JXG.shortcut(JXG, 'getReference'),

    /**
     * Checks if the given string is an id within the given board.
     * @param {JXG.Board} board
     * @param {String} s
     * @returns {Boolean}
     */
    isId: function (board, s) {
        return typeof(s) == 'string' && !!board.objects[s];
    },

    /**
     * Checks if the given string is a name within the given board.
     * @param {JXG.Board} board
     * @param {String} s
     * @returns {Boolean}
     */
    isName: function (board, s) {
        return typeof(s) == 'string' && !!board.elementsByName[s];
    },

    /**
     * Checks if the given string is a group id within the given board.
     * @param {JXG.Board} board
     * @param {String} s
     * @returns {Boolean}
     */
    isGroup: function (board, s) {
        return typeof(s) == 'string' && !!board.groups[s];
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
     * Checks if a given variable is a reference of a JSXGraph Point element.
     * @param v A variable of any type.
     * @returns {Boolean} True, if v is of type JXG.Point.
     */
    isPoint: function (v) {
        if (typeof v == 'object') {
            return (v.elementClass == JXG.OBJECT_CLASS_POINT);
        }

        return false;
    },

    /**
     * Checks if a given variable is neither undefined nor null. You should not use this together with global
     * variables!
     * @param v A variable of any type.
     * @returns {Boolean} True, if v is neither undefined nor null.
     */
    exists: (function (undefined) {
        return function (v) {
            return !(v === undefined || v === null);
        }
    })(),

    /**
     * Handle default parameters.
     * @param {} v Given value
     * @param {} d Default value
     * @returns {} <tt>d</tt>, if <tt>v</tt> is undefined or null.
     */
    def: function (v, d) {
        if (JXG.exists(v)) {
            return v;
        } else {
            return d;
        }
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
        if (typeof s == 'boolean') {
            return s;
        }
        //return (s.toLowerCase()=='true');

        if (JXG.isString(s)) {
            return (s.toLowerCase()=='true');
        } else {
            return false;
        }

    },

    /**
     * Shortcut for {@link JXG.JSXGraph.initBoard}.
     */
    _board: function (box, attributes) {
        return JXG.JSXGraph.initBoard(box, attributes);
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
        // convert GEONExT syntax into function
        var f = [], i, str;

        for (i=0;i<n;i++) {
            if (typeof param[i] == 'string') {
                str = JXG.GeonextParser.geonext2JS(param[i],board);
                str = str.replace(/this\.board\./g,'board.');
                f[i] = new Function('','return ' + (str) + ';');
            }
        }

        return function (k) {
            var a = param[k];
            if (typeof a == 'string') {
                return f[k]();
            } else if (typeof a=='function') {
                return a();
            } else if (typeof a=='number') {
                return a;
            }
            return 0;
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
            f = board.jc.snippet(term, true, variableName, true);
        } else if (JXG.isFunction(term)) {
            f = term;
        } else if (JXG.isNumber(term)) {
            f = function () { return term; };
        } else if (JXG.isString(term)) {        // In case of string function like fontsize
            f = function () { return term; };
        }

        if (f !== null) {
            f.origin = term;
        }

        return f;
    },

    /**
     * Checks given parents array against several expectations.
     * @param {String} element The name of the element to be created
     * @param {Array} parents A parents array
     * @param {Array} expects Each possible parents array types combination is given as
     * an array of element type constants containing the types or names of elements that are
     * accepted and in what order they are accepted. Strings can be given for basic data types
     * are <em>number, string, array, function, object</em>. We accept non element JSXGraph
     * types like <em>coords</em>, too.
     * @returns {Array} A new parents array prepared for the use within a create* method
     */
    checkParents: function (element, parents, expects) {
        // some running variables
        var i, j, k, len,

        // collects the parent elements that already got verified
            new_parents = [],

        // in case of multiple parent array type combinations we may have to start over again
        // so hold the parents array in an temporary array in case we need the original one back
            tmp_parents = parents.slice(0),

        // test the given parent element against what we expect
            is = function (expect, parent) {
                // we basically got three cases:
                // expect is of type
                // number => test for parent.elementClass and parent.type
                //     lucky us elementClass and type constants don't overlap \o/
                // string => here we have two sub cases depending on the value of expect
                //   string, object, function, number => make a simple typeof
                //   array => check via isArray

                var type_expect = (typeof expect).toLowerCase();

                if (type_expect === 'number') {
                    return parent && ((parent.type && parent.type === expect) || (parent.elementClass && parent.elementClass === expect))
                } else {
                    switch(expect.toLowerCase()) {
                        case 'string':
                        case 'object':
                        case 'function':
                        case 'number':
                            return (typeof parent).toLowerCase() === expect.toLowerCase();
                            break;
                        case 'array':
                            return JXG.isArray(parent);
                            break;
                    }
                }


                return false;
            };


        for(i = 0; i < expects.length; i++) {
            // enter the next loop only if parents has enough elements
            for(j = 0; j < expects[i].length && parents.length >= expects[i].length; j++) {
                k = 0;
                while (k < tmp_parents.length && !is(expects[i][j], tmp_parents[k]))
                    k++;

                if (k<tmp_parents.length) {
                    new_parents.push(tmp_parents.splice(len-k-1, 1)[0]);
                }
            }

            // if there are still elements left in the parents array we need to
            // rebuild the original parents array and start with the next expect array
            if (tmp_parents.length) {
                tmp_parents = parents.slice(0);
                new_parents = [];
            } else // yay, we found something \o/
                return new_parents;
        }
    },

    /**
     * Reads the configuration parameter of an attribute of an element from a {@link JXG.Options} object
     * @param {JXG.Options} options Reference to an instance of JXG.Options. You usually want to use the
     * options property of your board.
     * @param {String} element The name of the element which options you wish to read, e.g. 'point' or
     * 'elements' for general attributes.
     * @param {String} key The name of the attribute to read, e.g. 'strokeColor' or 'withLabel'
     * @returns The value of the selected configuration parameter.
     * @see JXG.Options
     */
    readOption: function (options, element, key) {
        var val = options.elements[key];

        if (JXG.exists(options[element][key]))
            val = options[element][key];

        return val;
    },

    /**
     * Checks an attributes object and fills it with default values if there are properties missing.
     * @param {Object} attributes
     * @param {Object} defaults
     * @returns {Object} The given attributes object with missing properties added via the defaults object.
     * @deprecated replaced by JXG#copyAttributes
     */
    checkAttributes: function (attributes, defaults) {
        var key;

        // Make sure attributes is an object.
        if (!JXG.exists(attributes)) {
            attributes = {};
        }

        // Go through all keys of defaults and check for their existence
        // in attributes. If one doesn't exist, it is created with the
        // same value as in defaults.
        for (key in defaults) {
            if (!JXG.exists(attributes[key])) {
                attributes[key] = defaults[key];
            }
        }

        return attributes;
    },

    /**
     * Generates an attributes object that is filled with default values from the Options object
     * and overwritten by the user speciified attributes.
     * @param {Object} attributes user specified attributes
     * @param {Object} options defaults options
     * @param {String} % variable number of strings, e.g. 'slider', subtype 'point1'.
     * @returns {Object} The resulting attributes object
     */
    copyAttributes: function (attributes, options) {
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
        if (len < 3 || primitives[arguments[2]]) {
            a = this.deepCopy(options.elements, null, true);       // default options from Options.elements
        } else {
            a = {};
        }

        // Only the layer of the main element is set.
        if (len < 4 && this.exists(arguments[2]) && this.exists(options.layer[arguments[2]])) {
            a.layer = options.layer[arguments[2]];
        }

        o = options;                                                // default options from specific elements
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

        o = attributes;                                             // options from attributes
        isAvail = true;
        for (i=3;i<len;i++) {
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

        /**
         * Special treatment of labels
         */
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

        if (typeof document == 'undefined' || elementId == null) {
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
        if (display != 'none' && display != null) {// Safari bug
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
        owner['x_internal'+type] = owner['x_internal'+type] || [];
        owner['x_internal'+type].push(el);

        if (JXG.exists(obj) && JXG.exists(obj.addEventListener)) { // Non-IE browser
            obj.addEventListener(type, el, false);
        } else {  // IE
            obj.attachEvent('on'+type, el);
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

        } catch(e) {
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
    removeAllEvents: function(obj, type, owner) {
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
     * Generates a function which calls the function fn in the scope of owner.
     * @param {Function} fn Function to call.
     * @param {Object} owner Scope in which fn is executed.
     * @returns {Function} A function with the same signature as fn.
     */
    bind: function (fn, owner) {
        return function () {
            return fn.apply(owner,arguments);
        };
    },

    /**
     * Removes an element from the given array
     * @param {Array} ar
     * @param {%} el
     * @returns {Array}
     */
    removeElementFromArray: function(ar, el) {
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
     * Cross browser mouse / touch coordinates retrieval relative to the board's top left corner.
     * @param {Object} [e] The browsers event object. If omitted, <tt>window.event</tt> will be used.
     * @param {Number} [index] If <tt>e</tt> is a touch event, this provides the index of the touch coordinates, i.e. it determines which finger.
     * @returns {Array} Contains the position as x,y-coordinates in the first resp. second component.
     */
    getPosition: function (e, index) {
        var i, len, posx = 0, posy = 0,
            evtTouches;

        if (!e) {
            e = window.event;
        }
        evtTouches = e[JXG.touchProperty];

        if (JXG.exists(index)) {

            if (index == -1) {

                len = evtTouches.length;
                for (i=0; i<len; i++) {
                    if (evtTouches[i]) {
                        e = evtTouches[i];
                        break;
                    }
                }

            } else
                e = evtTouches[index];
        }

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY)    {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
    
        return [posx,posy];
    },

    /**
     * Calculates recursively the offset of the DOM element in which the board is stored.
     * @param {Object} obj A DOM element
     * @returns {Array} An array with the elements left and top offset.
     */
    getOffset: function (obj) {
        var o = obj,
            o2 = obj,
            l = o.offsetLeft - o.scrollLeft,
            t = o.offsetTop - o.scrollTop,
            cPos;

        cPos = this.getCSSTransform([l,t],o);
        l = cPos[0];
        t = cPos[1];

        /*
         * In Mozilla and Webkit: offsetParent seems to jump at least to the next iframe,
         * if not to the body. In IE and if we are in an position:absolute environment 
         * offsetParent walks up the DOM hierarchy.
         * In order to walk up the DOM hierarchy also in Mozilla and Webkit
         * we need the parentNode steps.
         */
        while (o=o.offsetParent) {
            l+=o.offsetLeft;
            t+=o.offsetTop;
            if (o.offsetParent) {
                l+=o.clientLeft - o.scrollLeft;
                t+=o.clientTop - o.scrollTop;
            }
            
            cPos = this.getCSSTransform([l,t],o);
            l = cPos[0];
            t = cPos[1];
            
            o2 = o2.parentNode;
            while (o2!=o) {
                l += o2.clientLeft - o2.scrollLeft;
                t += o2.clientTop - o2.scrollTop;
                
                cPos = this.getCSSTransform([l,t],o2);
                l = cPos[0];
                t = cPos[1];

                o2 = o2.parentNode;
            }

        }
        return [l,t];
    },

    /**
     * Access CSS style sheets.
     * @param {Object} obj A DOM element
     * @param {String} stylename The CSS property to read.
     * @returns The value of the CSS property and <tt>undefined</tt> if it is not set.
     */
    getStyle: function (obj, stylename) {
        var r;

        if (window.getComputedStyle) {
            // Non-IE
            r = document.defaultView.getComputedStyle(obj, null).getPropertyValue(stylename);
        } else if (obj.currentStyle && JXG.ieVersion >= 9) {
            // IE
            r = obj.currentStyle[stylename];
        } else {
            if (obj.style) {
                // make stylename lower camelcase
                stylename = stylename.replace(/-([a-z]|[0-9])/ig, function (all, letter) {
                    return ( letter + "" ).toUpperCase();
                });
                r = obj.style[stylename]
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
    getCSSTransform: function(cPos, obj) {
        var t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'],
            i, j, str, arrStr, 
            start, len, len2,
            arr; // mat;
            
        // Take the first transformation matrix
        len = t.length;
        for (i=0, str=''; i<len; i++) {
            if (JXG.exists(obj.style[t[i]])) {
                str = obj.style[t[i]];
                break;
            }
        }

        /**
        * Extract the coordinates and apply the transformation
        * to cPos
        */
        if (str!='') {
            start = str.indexOf('(');
            if (start>0) {
                len = str.length;
                arrStr = str.substring(start+1,len-1);
                arr = arrStr.split(',');
                for (j=0, len2=arr.length; j<len2; j++) {
                    arr[j] = parseFloat(arr[j]);
                }

                if (0==str.indexOf('matrix')) {    
                    /*
                    mat = [[arr[0], arr[1]],
                           [arr[2], arr[3]]];
                    */
                    //cPos = JXG.Math.matVecMult(mat, cPos);
                    cPos[0] += arr[4];
                    cPos[1] += arr[5];
                } else if (0==str.indexOf('translateX')) {    
                    cPos[0] += arr[0];
                } else if (0==str.indexOf('translateY')) {    
                    cPos[1] += arr[0];
                } else if (0==str.indexOf('translate')) {    
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
    getCSSTransformMatrix: function(obj) {
        var t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'],
            i, j, str, arrStr, 
            start, len, len2,
            arr, mat;

        mat = [[1, 0, 0],
               [0, 1, 0],
               [0, 0, 1]];
               
       // Take the first transformation matrix
        len = t.length;
        for (i=0, str=''; i<len; i++) {
            if (JXG.exists(obj.style[t[i]])) {
                str = obj.style[t[i]];
                break;
            }
        }
        
        if (str!='') {
            start = str.indexOf('(');
            if (start>0) {
                len = str.length;
                arrstr = str.substring(start+1,len-1);
                arr = arrstr.split(',');
                for (j=0, len2=arr.length; j<len2; j++) {
                    arr[j] = parseFloat(arr[j]);
                }
            
                if (0==str.indexOf('matrix')) {  
                    mat = [[1, 0, 0],
                           [0, arr[0], arr[1]],
                           [0, arr[2], arr[3]]];
                // Missing are rotate, skew, skewX, skewY
                } else if (0==str.indexOf('scaleX')) { 
                    mat[1][1] = arr[0];
                } else if (0==str.indexOf('scaleY')) {    
                    mat[2][2] = arr[0];
                } else if (0==str.indexOf('scale')) {    
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

        for (property in object) {
            if (onlyOwn) {
                if (object.hasOwnProperty(property)) {
                    keys.push(property);
                }
            } else {
                keys.push(property);
            }
        }
        return keys;
    },

    /**
     * Search an array for a given value.
     * @param {Array} array
     * @param {%} value
     * @param {String} sub Use this property if the elements of the array are objects.
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
     * Replaces all occurences of &amp; by &amp;amp;, &gt; by &amp;gt;, and &lt; by &amp;lt;.
     * @param str
     */
    escapeHTML: function (str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },

    /**
     * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
     * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
     * @param str
     */
    unescapeHTML: function (str) {
        return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
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
        var cObj = function(){}, r;
        cObj.prototype = obj;
        //cObj = obj;
        for(r in obj2)
            cObj[r] = obj2[r];

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

        if (typeof obj !== 'object' || obj == null) {
            return obj;
        }

        if (this.isArray(obj)) {
            c = [];
            for (i = 0; i < obj.length; i++) {
                prop = obj[i];
                if (typeof prop == 'object') {
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
                if (typeof prop == 'object') {
                    c[i2] = this.deepCopy(prop);
                } else {
                    c[i2] = prop;
                }
            }

            for (i in obj2) {
                i2 = toLower ? i.toLowerCase() : i;

                prop = obj2[i];
                if (typeof prop == 'object') {
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
        return c;
    },

    /**
     * Converts a JavaScript object into a JSON string.
     * @param {Object} obj A JavaScript object, functions will be ignored.
     * @param {Boolean} [noquote=false] No quotes around the name of a property.
     * @returns {String} The given object stored in a JSON string.
     */
    toJSON: function (obj, noquote) {
        var s, val;

        noquote = JXG.def(noquote, false);

        // check for native JSON support:
        if (window.JSON && window.JSON.stringify && !noquote) {
            try {
                s = JSON.stringify(obj);
                return s;
            } catch(e) {
                // if something goes wrong, e.g. if obj contains functions we won't return
                // and use our own implementation as a fallback
            }
        }

        switch (typeof obj) {
            case 'object':
                if (obj) {
                    var list = [];
                    if (obj instanceof Array) {
                        for (var i=0;i < obj.length;i++) {
                            list.push(JXG.toJSON(obj[i], noquote));
                        }
                        return '[' + list.join(',') + ']';
                    } else {
                        for (var prop in obj) {

                            try {
                                val = JXG.toJSON(obj[prop], noquote);
                            } catch (e) {
                                val = '';
                            }

                            if (noquote) {
                                list.push(prop + ':' + val);
                            } else {
                                list.push('"' + prop + '":' + val);
                            }
                        }
                        return '{' + list.join(',') + '} ';
                    }
                } else {
                    return 'null';
                }
            case 'string':
                return '\'' + obj.replace(/(["'])/g, '\\$1') + '\'';
            case 'number':
            case 'boolean':
                return new String(obj);
        }
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
        var todo = items.concat();   //create a clone of the original
        setTimeout(function (){
            var start = +new Date();
            do {
                process.call(context, todo.shift());
            } while (todo.length > 0 && (+new Date() - start < 300));
            if (todo.length > 0){
                setTimeout(arguments.callee, 1);
            } else {
                callback(items);
            }
        }, 1);
    },

    /**
     * Make numbers given as strings nicer by removing all unnecessary leading and trailing zeroes.
     * @param {String} str
     * @returns {String}
     */
    trimNumber: function (str) {
        str = str.replace(/^0+/, "");
        str = str.replace(/0+$/, "");
        if (str[str.length-1] == '.' || str[str.length-1] == ',') {
            str = str.slice(0, -1);
        }
        if (str[0] == '.' || str[0] == ',') {
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
        str = str.replace(/^\s+/, "");
        str = str.replace(/\s+$/, "");

        return str;
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
        } else {
            return val;
        }
    },

    /**
     * Eliminates duplicate entries in an array.
     * @param {Array} a An array
     * @returns {Array} The array with duplicate entries eliminated.
     */
    eliminateDuplicates: function (a) {
        var i, len = a.length,
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
            if ((typeof a1[i] !== typeof a2[i]) || (a1[i] !== a2[i])) {
                return false;
            }
        }

        return true;
    },

    /**
     * Truncate a number <tt>n</tt> after <tt>p</tt> decimals.
     * @param n
     * @param p
     * @returns {Number}
     */
    trunc: function (n, p) {
        p = JXG.def(p, 0);

        if (p == 0) {
            n = ~~n;
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
    autoDigits: function(val) {
        var x = Math.abs(val);
        if (x>0.1) {
            x = val.toFixed(2);
        } else if (x>=0.01) {
            x = val.toFixed(4);
        } else if (x>=0.0001) {
            x = val.toFixed(6);
        } else {
            x = val;
        }
        return x;
    },

    /**
     * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
     * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
     * @param {%} An arbitrary number of parameters.
     */
    debug: function (s) {
        var i;

        for(i = 0; i < arguments.length; i++) {
            s = arguments[i];
            if (window.console && console.log) {
                //if (typeof s === 'string') s = s.replace(/<\S[^><]*>/g, "");
                console.log(s);
            } else if (document.getElementById('debug')) {
                document.getElementById('debug').innerHTML += s + "<br/>";
            }
            // else: do nothing
        }
    },

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
     * Generates a deep copy of an array and removes the duplicate entries.
     * @param {Array} arr
     * @returns {Array}
     */
    uniqueArray: function(arr) {
        var i, j, isArray, ret = [];

        if (arr.length === 0) {
            return [];
        }

        isArray = JXG.isArray(arr[0]);

        for (i=0; i<arr.length; i++) {
            for (j=i+1; j<arr.length; j++) {
                if (isArray && JXG.cmpArrays(arr[i], arr[j])) {
                    arr[i] = [];
                } else if (!isArray && arr[i] === arr[j]) {
                    arr[i] = '';
                }
            }
        }

        j = 0;

        for (i=0; i<arr.length; i++) {
            if (!isArray && arr[i] !== "") {
                ret[j] = arr[i];
                j++;
            } else if (isArray && arr[i].length !== 0) {
                ret[j] = (arr[i].slice(0));
                j++;
            }
        }

        return ret;
    },

    /**
     * Checks if an array contains an element equal to <tt>val</tt> but does not check the type!
     * @param {Array} arr
     * @param {%} val
     * @returns {Boolean}
     */
    isInArray: function(arr, val) {
        var i;

        for (i=0; i<arr.length; i++) {
            if (arr[i] == val) {
                return true;
            }
        }

        return false;
    },

    /**
     * Tests if the input variable is an Array
     * @param input
     */
    isArray2: function(input) {
        return typeof(input) == 'object' && (input instanceof Array);
    },

    /**
     * Tests if the input variable is an Object
     * @param input
     */
    isObject: function(input) {
        return typeof(input) == 'object' && (input instanceof Object) && !(input instanceof Array);
    },

    /**
     * Checks if an object contains a key, whose value equals to val
     */
    isInObject: function(lit, val) {

        for (var el in lit)
            if (lit.hasOwnProperty(el))
                if (lit[el] == val)
                    return true;

        return false;
    },

    collectionContains: function(arr, val) {

        if (JXG.isArray2(arr))
            return JXG.isInArray(arr, val);
        else if (JXG.isObject(arr))
            return JXG.isInObject(arr, val);
        else
            return arr == val;
    }
});

// JessieScript startup: Search for script tags of type text/jessiescript and interpret them.
if (typeof window === 'object' && typeof document === 'object') {
    JXG.addEvent(window, 'load', function () {
        var scripts = document.getElementsByTagName('script'), type,
            i, j, div, board, width, height, bbox, axis, grid, code;

        for(i=0;i<scripts.length;i++) {
            type = scripts[i].getAttribute('type', false);
            if (!JXG.exists(type)) continue;
            if (type.toLowerCase() === 'text/jessiescript' || type.toLowerCase() === 'jessiescript' || type.toLowerCase() === 'text/jessiecode' || type.toLowerCase() === 'jessiecode') {
                width = scripts[i].getAttribute('width', false) || '500px';
                height = scripts[i].getAttribute('height', false) || '500px';
                bbox = scripts[i].getAttribute('boundingbox', false) || '-5, 5, 5, -5';
                bbox = bbox.split(',');
                if (bbox.length!==4) {
                    bbox = [-5, 5, 5, -5];
                } else {
                    for(j=0;j<bbox.length;j++) {
                        bbox[j] = parseFloat(bbox[j]);
                    }
                }
                axis = JXG.str2Bool(scripts[i].getAttribute('axis', false) || 'false');
                grid = JXG.str2Bool(scripts[i].getAttribute('grid', false) || 'false');

                div = document.createElement('div');
                div.setAttribute('id', 'jessiescript_autgen_jxg_'+i);
                div.setAttribute('style', 'width:'+width+'; height:'+height+'; float:left');
                div.setAttribute('class', 'jxgbox');
                try {
                    document.body.insertBefore(div, scripts[i]);
                } catch (e) {
                    // there's probably jquery involved...
                    if (typeof jQuery !== 'undefined') {
                        jQuery(div).insertBefore(scripts[i]);
                    }
                }

                if (document.getElementById('jessiescript_autgen_jxg_' + i)) {
                    board = JXG.JSXGraph.initBoard('jessiescript_autgen_jxg_' + i, {boundingbox: bbox, keepaspectratio:true, grid: grid, axis: axis});

                    code = scripts[i].innerHTML;
                    code = code.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
                    scripts[i].innerHTML = code;
                    if (type.toLowerCase().indexOf('script') > -1) {
                        board.construct(code);
                    } else {
                        try {
                            board.jc.parse(code);
                        } catch (e) {
                            JXG.debug(e);
                        }
                    }
                } else {
                    JXG.debug('JSXGraph: Apparently the div injection failed. Can\'t create a board, sorry.');
                }
            }
        }
    }, window);
}
