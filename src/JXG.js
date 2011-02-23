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

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 * @version 0.83
 */

/**
 * Detect browser support for VML.
 * The code in comments is from google maps.
 * But it does not work in JSXGraph because in the moment 
 * of calling supportsVML() document.body is still undefined.
 * Therefore, the more vulnerable test of
 *   navigator.appVersion 
 * is used.
 * Update: In stackoverflow the test 
 *  !!document.namespaces
 * has been suggested.
 * @returns {Boolean} 
 */
JXG.supportsVML = function() {
    /*
    var a, b, isSupported = false;
    a = document.body.appendChild(document.createElement('div'));
    a.innerHTML = '<v:shape id="vml_flag1" adj="1" />';
    b = a.firstChild;
    b.style.behavior = "url(#default#VML)";
    isSupported = b ? typeof b.adj == "object": true;
    a.parentNode.removeChild(a);
    return isSupported; 
    */
    //var ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
    //if (ie && parseFloat(ie[1]) < 9.0 ) {
    if (!!document.namespaces) {
        return true;
    } else {
        return false;
    }
};

/**
 * Detect browser support for SVG.
 * @returns {Boolean} 
 */
JXG.supportsSVG = function() {
    return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
};
 
/**
 * s may be a string containing the name or id of an element or even a reference
 * to the element itself. This function returns a reference to the element. Search order: id, name.
 * @param {JXG.Board} board Reference to the board the element belongs to.
 * @param {String} s String or reference to a JSXGraph element.
 * @returns {Object} Reference to the object given in parameter object
 */
JXG.getReference = function(board, s) {
    if(typeof(s) == 'string') {
        if(board.objects[s] != null) { // Search by ID
            s = board.objects[s];
        } else if (board.elementsByName[s] != null) { // Search by name
            s = board.elementsByName[s];
        }
    }

    return s;
};

/**
 * This is just a shortcut to {@link JXG.getReference}.
 */
JXG.getRef = JXG.getReference;

/**
 * Checks if the value of a given variable is of type string.
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is of type string.
 */
JXG.isString = function(v) {
    return typeof v == "string";
};

/**
 * Checks if the value of a given variable is of type number.
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is of type number.
 */
JXG.isNumber = function(v) {
    return typeof v == "number";
};

/**
 * Checks if a given variable references a function.
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is a function.
 */
JXG.isFunction = function(v) {
    return typeof v == "function";
};

/**
 * Checks if a given variable references an array.
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is of type array.
 */
JXG.isArray = function(v) {
    // Borrowed from prototype.js
    return v != null && typeof v == "object" && 'splice' in v && 'join' in v;
};

/**
 * Checks if a given variable is a reference of a JSXGraph Point element.
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is of type JXG.Point.
 */
JXG.isPoint = function(v) {
    if(typeof v == 'object') {
        return (v.elementClass == JXG.OBJECT_CLASS_POINT);
    }

    return false;
};

/**
 * Checks if a given variable is neither undefined nor null. You should not use this together with global
 * variables!
 * @param v A variable of any type.
 * @returns {Boolean} True, if v is neither undefined nor null.
 */
JXG.exists = (function(undefined) {
    return function(v) {
        return !(v === undefined || v === null);
    }
})();

/**
 * Converts a string containing either <strong>true</strong> or <strong>false</strong> into a boolean value.
 * @param {String} s String containing either <strong>true</strong> or <strong>false</strong>.
 * @returns {Boolean} String typed boolean value converted to boolean.
 */
JXG.str2Bool = function(s) {
    if (!JXG.exists(s)) {
        return true;
    }
    if (typeof s == 'boolean') { 
        return s;
    }
    return (s.toLowerCase()=='true');
};

/**
 * Shortcut for {@link JXG.JSXGraph.initBoard}.
 */
JXG._board = function(box, attributes) {
	return JXG.JSXGraph.initBoard(box, attributes);
};

/**
 * Convert a String, a number or a function into a function. This method is used in Transformation.js
 * @param {JXG.Board} board Reference to a JSXGraph board. It is required to resolve dependencies given
 * by a GEONE<sub>X</sub>T string, thus it must be a valid reference only in case one of the param
 * values is of type string.
 * @param {Array} param An array containing strings, numbers, or functions.
 * @returns {Function} A function taking one parameter k which specifies the index of the param element
 * to evaluate. 
 */
JXG.createEvalFunction = function(board, param, n) {
    // convert GEONExT syntax into function
    var f = [], i, str;

    for (i=0;i<n;i++) {
        if (typeof param[i] == 'string') {
            str = JXG.GeonextParser.geonext2JS(param[i],board);
            str = str.replace(/this\.board\./g,'board.');
            f[i] = new Function('','return ' + (str) + ';');
        }
    }

    return function(k) {
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
};

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
JXG.createFunction = function(term, board, variableName, evalGeonext) {
    var newTerm;

    if ((evalGeonext==null || evalGeonext) && JXG.isString(term)) {
        // Convert GEONExT syntax into  JavaScript syntax
        newTerm = JXG.GeonextParser.geonext2JS(term, board);
        return new Function(variableName,'return ' + newTerm + ';');
    } else if (JXG.isFunction(term)) {
        return term;
    } else if (JXG.isNumber(term)) {
        return function() { return term; };
    } else if (JXG.isString(term)) {        // In case of string function like fontsize
        return function() { return term; };
    }
    return null;
};

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
JXG.checkParents = function(element, parents, expects) {
        // some running variables
    var i, j, k, len,
    
        // collects the parent elements that already got verified
        new_parents = [],

        // in case of multiple parent array type combinations we may have to start over again
        // so hold the parents array in an temporary array in case we need the original one back
        tmp_parents = parents.slice(0),

        // test the given parent element against what we expect
        is = function(expect, parent) {
            // we basically got three cases:
            // expect is of type
            // number => test for parent.elementClass and parent.type
            //     lucky us elementClass and type constants don't overlap \o/
            // string => here we have two sub cases depending on the value of expect
            //   string, object, function, number => make a simple typeof
            //   array => check via isArray

            var type_expect = (typeof expect).toLowerCase();

            if(type_expect === 'number') {
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
            while(k < tmp_parents.length && !is(expects[i][j], tmp_parents[k]))
                k++;

            if(k<tmp_parents.length) {
                new_parents.push(tmp_parents.splice(len-k-1, 1)[0]);
            }
        }

        // if there are still elements left in the parents array we need to
        // rebuild the original parents array and start with the next expect array
        if(tmp_parents.length) {
            tmp_parents = parents.slice(0);
            new_parents = [];
        } else // yay, we found something \o/
            return new_parents;
    }
};

/*
JXG.checkParameter = function(board, parameter, input, output) {
    var r;
    if (input=='point') {
        if (JXG.isPoint(input) && output=='point') { return parameter; }
        if (JXG.isString(input) && output=='point') {
            r = JXG.getReference(board,parameter);
            if (JXG.isString(r)) { return false; } else { return r; }
        }
    } else if (input=='array') {
        if (JXG.isArray(input) && output=='point') {
            return = board.create('point', parameter, {visible:false,fixed:true});
        }
    } else if (input=='line') {
...
    }
}

JXG.readParameter = function(board, parameter, input, output) {
    var i, j, lenOut = output.length,
        len, result;

    if (lenOut==1) {
        len = input.length;
        for (j=0;j<len;j++) {
            result = JXG.checkParameter(board, parameter, input[j], output[0]);
            if (result!=false) return result;
        }
    } else {
        for (i=0;i<lenOut;i++) {
            len = input[i].length;
            for (j=0;j<len;j++) {
                result = JXG.checkParameter(board, parameter, input[i][j], output[i]);
                if (result!=false) return result;
            }
        }
    }
    return false;
};
*/

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
JXG.readOption = function(options, element, key) {
    var val = options.elements[key];

    if (JXG.exists(options[element][key]))
        val = options[element][key];

    return val;
};

/**
 * Checks an attributes object and fills it with default values if there are properties missing.
 * @param {Object} attributes 
 * @param {Object} defaults
 * @returns {Object} The given attributes object with missing properties added via the defaults object.
 */
JXG.checkAttributes = function(attributes, defaults) {
    var key;

    // Make sure attributes is an object.
    if (!JXG.exists(attributes)) {
        attributes = {};
    }

    // Go through all keys of defaults and check for their existence
    // in attributes. If one doesn't exist, it is created with the
    // same value as in defaults.
    for (key in defaults) {
        if(!JXG.exists(attributes[key])) {
            attributes[key] = defaults[key];
        }
    }

    return attributes;
};

/**
 * Reads the width and height of an HTML element.
 * @param {String} elementId The HTML id of an HTML DOM node.
 * @returns {Object} An object with the two properties width and height.
 */
JXG.getDimensions = function(elementId) {
    var element, display, els, originalVisibility, originalPosition,
        originalDisplay, originalWidth, originalHeight;

    // Borrowed from prototype.js
    element = document.getElementById(elementId);
    if (!JXG.exists(element)) {
        throw new Error("\nJSXGraph: HTML container element '" + (elementId) + "' not found.");
    }

    display = element.style['display'];
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
};

/**
 * Adds an event listener to a DOM element.
 * @param {Object} obj Reference to a DOM node.
 * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
 * @param {Function} fn The function to call when the event is triggered.
 * @param {Object} owner The scope in which the event trigger is called.
 */
JXG.addEvent = function( obj, type, fn, owner ) {
    owner['x_internal'+type] = function() {return fn.apply(owner,arguments);};

    if (JXG.exists(obj.addEventListener)) { // Non-IE browser
        obj.addEventListener(type, owner['x_internal'+type], false);
    } else {  // IE
        obj.attachEvent('on'+type, owner['x_internal'+type]);
    }
};

/**
 * Removes an event listener from a DOM element.
 * @param {Object} obj Reference to a DOM node.
 * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
 * @param {Function} fn The function to call when the event is triggered.
 * @param {Object} owner The scope in which the event trigger is called.
 */
JXG.removeEvent = function( obj, type, fn, owner ) {
    try {
        if (JXG.exists(obj.addEventListener)) { // Non-IE browser
            obj.removeEventListener(type, owner['x_internal'+type], false);
        } else {  // IE
            obj.detachEvent('on'+type, owner['x_internal'+type]);
        }
    } catch(e) {
        JXG.debug('JSXGraph: Can\'t remove event listener on' + type + ': ' + owner['x_internal' + type]);
    }
};

/**
 * Generates a function which calls the function fn in the scope of owner.
 * @param {Function} fn Function to call.
 * @param {Object} owner Scope in which fn is executed.
 * @returns {Function} A function with the same signature as fn.
 */
JXG.bind = function(fn, owner) {
    return function() {
        return fn.apply(owner,arguments);
    };
};

/**
 * Cross browser mouse coordinates retrieval relative to the board's top left corner.
 * @param {Object} [e] The browsers event object. If omitted, <tt>window.event</tt> will be used.
 * @returns {Array} Contains the position as x,y-coordinates in the first resp. second component.
 */
JXG.getPosition = function (e) {
    var posx = 0,
        posy = 0;

    if (!e) {
        e = window.event;
    }

    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY)    {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    return [posx,posy];
};

/**
 * Calculates recursively the offset of the DOM element in which the board is stored.
 * @param {Object} obj A DOM element
 * @returns {Array} An array with the elements left and top offset.
 */
JXG.getOffset = function (obj) {
    var o=obj,
        l=o.offsetLeft,
        t=o.offsetTop;

    while(o=o.offsetParent) {
        l+=o.offsetLeft;
        t+=o.offsetTop;
        if(o.offsetParent) {
            l+=o.clientLeft;
            t+=o.clientTop;
        }
    }
    return [l,t];
};

/**
 * Access CSS style sheets.
 * @param {Object} obj A DOM element
 * @param {String} stylename The CSS property to read.
 * @returns The value of the CSS property and <tt>undefined</tt> if it is not set.
 */
JXG.getStyle = function (obj, stylename) {
    return obj.style[stylename];
};

/**
 * Extracts the keys of a given object.
 * @param object The object the keys are to be extracted
 * @param onlyOwn If true, hasOwnProperty() is used to verify that only keys are collected
 * the object owns itself and not some other object in the prototype chain.
 * @returns {Array} All keys of the given object.
 */
JXG.keys = function(object, onlyOwn) {
    var keys = [], property;

    for (property in object) {
        if(onlyOwn) {
            if(object.hasOwnProperty(property)) {
                keys.push(property);
            }
        } else {
            keys.push(property);
        }
    }
    return keys;
};

/**
 * Replaces all occurences of &amp; by &amp;amp;, &gt; by &amp;gt;, and &lt; by &amp;lt;.
 * @param str
 */
JXG.escapeHTML = function(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

/**
 * Eliminates all substrings enclosed by &lt; and &gt; and replaces all occurences of
 * &amp;amp; by &amp;, &amp;gt; by &gt;, and &amp;lt; by &lt;.
 * @param str
 */
JXG.unescapeHTML = function(str) {
    return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
};

JXG.extend = function(o, extension) {
    var e;
    for(e in extension) {
        o.prototype[e] = extension[e];
    }
};

/**
 * This outputs an object with a base class reference to the given object. This is useful if
 * you need a copy of an e.g. attributes object and want to overwrite some of the attributes
 * without changing the original object.
 * @param {Object} obj Object to be embedded.
 * @returns {Object} An object with a base class reference to <tt>obj</tt>.
 */
JXG.clone = function(obj) {
    var cObj = {};
    cObj.prototype = obj;
    return cObj;
};

/**
 * Embeds an existing object into another one just like {@link #clone} and copies the contents of the second object
 * to the new one. Warning: The copied properties of obj2 are just flat copies.
 * @param {Object} obj Object to be copied.
 * @param {Object} obj2 Object with data that is to be copied to the new one as well.
 * @returns {Object} Copy of given object including some new/overwritten data from obj2.
 */
JXG.cloneAndCopy = function(obj, obj2) {
    var cObj = {}, r;
    cObj.prototype = obj;
    for(r in obj2)
        cObj[r] = obj2[r];

    return cObj;
};

/**
 * Creates a deep copy of an existing object, i.e. arrays or sub-objects are copied component resp.
 * element-wise instead of just copying the reference.
 * @param {Object} obj This object will be copied.
 * @returns {Object} Ccopy of obj.
 */
JXG.deepCopy = function(obj) {
    var c, i, prop, j;

    if (typeof obj !== 'object' || obj == null) {
        return obj;
    }
    if (this.isArray(obj)) {
        c = [];
        for (i=0; i<obj.length; i++) {
            prop = obj[i];
            if (typeof prop == 'object') {
                if (this.isArray(prop)) {
                    c[i] = [];
                    for (j = 0; j < prop.length; j++) {
                        if (typeof prop[j] != 'object') {
                            c[i].push(prop[j]);
                        } else {
                            c[i].push(this.deepCopy(prop[j]));
                        }
                    }
                } else {
                    c[i] = this.deepCopy(prop);
                }
            } else {
                c[i] = prop;
            }
        }
    } else {
        c = {};
        for (i in obj) {
            prop = obj[i];
            if (typeof prop == 'object') {
                if (this.isArray(prop)) {
                    c[i] = [];
                    for (j = 0; j < prop.length; j++) {
                        if (typeof prop[j] != 'object') {
                            c[i].push(prop[j]);
                        } else {
                            c[i].push(this.deepCopy(prop[j]));
                        }
                    }
                } else {
                    c[i] = this.deepCopy(prop);
                }
            } else {
                c[i] = prop;
            }
        }
    }
    return c;
};

/**
 * Converts a JavaScript object into a JSON string.
 * @param {Object} obj A JavaScript object, functions will be ignored.
 * @returns {String} The given object stored in a JSON string.
 */
JXG.toJSON = function(obj) {
    var s;

    // check for native JSON support:
    if(window.JSON && window.JSON.stringify) {
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
                        list.push(JXG.toJSON(obj[i]));
                    }
                    return '[' + list.join(',') + ']';
                } else {
                    for (var prop in obj) {
                        list.push('"' + prop + '":' + JXG.toJSON(obj[prop]));
                    }
                    return '{' + list.join(',') + '}';
                }
            } else {
                return 'null';
            }
        case 'string':
            return '"' + obj.replace(/(["'])/g, '\\$1') + '"';
        case 'number':
        case 'boolean':
            return new String(obj);
    }
};

/**
 * Makes a string lower case except for the first character which will be upper case.
 * @param {String} str Arbitrary string
 * @returns {String} The capitalized string.
 */
JXG.capitalize = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
};

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
JXG.timedChunk = function(items, process, context, callback) {
    var todo = items.concat();   //create a clone of the original
    setTimeout(function(){
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
};

/**
 * Make numbers given as strings nicer by removing all unnecessary leading and trailing zeroes.
 * @param {String} str
 * @returns {String}
 */
JXG.trimNumber = function(str) {
	str = str.replace(/^0+/, "");
	str = str.replace(/0+$/, "");
	if(str[str.length-1] == '.' || str[str.length-1] == ',') {
		str = str.slice(0, -1);
	}
    if(str[0] == '.' || str[0] == ',') {
        str = "0" + str;
    }
	
	return str;
};

/**
 * Remove all leading and trailing whitespaces from a given string.
 * @param {String} str
 * @returns {String}
 */
JXG.trim = function(str) {
	str = str.replace(/^w+/, "");
	str = str.replace(/w+$/, "");
	
	return str;
};

/**
 * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
 * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
 * @param {String} s A debug message.
 */
JXG.debug = function(s) {
    if (console && console.log) {
        if (typeof s === 'string') s = s.replace(/<\S[^><]*>/g, "")
        console.log(s);
    } else if (document.getElementById('debug')) {
        document.getElementById('debug').innerHTML += s + "<br/>";
    }
    // else: do nothing
};


// JessieScript startup: Search for script tags of type text/jessiescript and interpret them.
JXG.addEvent(window, 'load', function () {
    var scripts = document.getElementsByTagName('script'), type,
        i, j, div, board, width, height, bbox, axis, grid;
    
    for(i=0;i<scripts.length;i++) {
        type = scripts[i].getAttribute('type', false);
		if (!JXG.exists(type)) continue;
        if(type.toLowerCase() === 'text/jessiescript' || type.toLowerCase === 'jessiescript') {
            width = scripts[i].getAttribute('width', false) || '500px';
            height = scripts[i].getAttribute('height', false) || '500px';
            bbox = scripts[i].getAttribute('boundingbox', false) || '-5, 5, 5, -5';
            bbox = bbox.split(',');
            if(bbox.length!==4) {
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
            document.body.insertBefore(div, scripts[i]);

            board = JXG.JSXGraph.initBoard('jessiescript_autgen_jxg_'+i, {boundingbox: bbox, keepaspectratio:true, grid: grid, axis: axis});
            board.construct(scripts[i].innerHTML);
        }
    }
}, window);
