/*
    Copyright 2008-2010
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
 * @author graphjs
 * @version 0.82
 */

/**
 * Constructs a new JSXGraph singleton object.
 * @class The JXG.JSXGraph singleton stores all properties required
 * to load, save, create and free a board.
 */
JXG.JSXGraph = {

    /**
     * The small gray version indicator in the top left corner of every JSXGraph board (if
     * showCopyright is not set to false on board creation).
     * @type String
     */
    licenseText: 'JSXGraph v0.82rc14 Copyright (C) see http://jsxgraph.org',

    /**
     * Associative array that keeps references to all boards.
     * @type Object
     */
    boards: {},

    /**
     * Associative array that keeps track of all constructable elements registered
     * via {@link JXG.JSXGraph.registerElement}.
     * @type Object
     */
    elements: {},

    /**
     * Stores the renderer that is used to draw the boards.
     * @type String
     */
    rendererType: (function() {
        var ie, opera, i, arr;

        /* Determine the users browser */
        ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
        opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);

        // set the rendererType according to the browser
        if ((!ie) || (opera) || (ie && parseFloat(ie[1]) >= 9.0)) {
            // we're NOT in IE
            if (navigator.appVersion.match(/Android.*AppleWebKit/)) {
                // we're using canvas on android and iphone/pod/pad
                JXG.Options.renderer = 'canvas';
            } else {
                // let's hope the user's browser supports svg...
                JXG.Options.renderer = 'svg';
            }
        } else {
            // IE
            JXG.Options.renderer = 'vml';

            // Ok, this is some real magic going on here. IE/VML always was so
            // terribly slow, except in one place: Examples placed in a moodle course
            // was almost as fast as in other browsers. So i grabbed all the css and
            // js scripts from our moodle, added them to a jsxgraph example and it
            // worked. next step was to strip all the css/js code which didn't affect
            // the VML update speed. The following five lines are what was left after
            // the last step and yes - it basically does nothing but reads two
            // properties of document.body on every mouse move. why? we don't know. if
            // you know, please let us know.
            function MouseMove() {
                document.body.scrollLeft;
                document.body.scrollTop;
            }

            document.onmousemove = MouseMove;
        }

        // Load the source files for the renderer
        arr = JXG.rendererFiles[JXG.Options.renderer].split(',');
        for (i = 0; i < arr.length; i++) ( function(include) {
            JXG.require(JXG.requirePath + include + '.js');
        } )(arr[i]);

        return JXG.Options.renderer;
    })(),

    /**
     * Initialise a new board.
     * @param {String} box Html-ID to the Html-element in which the board is painted.
     * @returns {JXG.Board} Reference to the created board.
     */
    initBoard: function (box, attributes) {
        var renderer,
            originX, originY, unitX, unitY,
            w, h, dimensions,
            bbox,
            zoomfactor, zoomX, zoomY,
            showCopyright, showNavi,
            board;

        dimensions = JXG.getDimensions(box);

        // parse attributes
        if (typeof attributes == 'undefined') {
            attributes = {};
        }

        if (typeof attributes["boundingbox"] != 'undefined') {
            bbox = attributes["boundingbox"];
            w = parseInt(dimensions.width);
            h = parseInt(dimensions.height);

            if (attributes["keepaspectratio"]) {
                /*
                 * If the boundingbox attribute is given and the ratio of height and width of the sides defined by the bounding box and
                 * the ratio of the dimensions of the div tag which contains the board do not coincide,
                 * then the smaller side is chosen.
                 */
                unitX = w/(bbox[2]-bbox[0]);
                unitY = h/(-bbox[3]+bbox[1]);
                if (unitX<unitY) {
                    unitY = unitX;
                } else {
                    unitX = unitY;
                }
            } else {
                unitX = w/(bbox[2]-bbox[0]);
                unitY = h/(-bbox[3]+bbox[1]);
            }
            originX = -unitX*bbox[0];
            originY = unitY*bbox[1];
        } else {
            originX = ( (typeof attributes["originX"]) == 'undefined' ? 150 : attributes["originX"]);
            originY = ( (typeof attributes["originY"]) == 'undefined' ? 150 : attributes["originY"]);
            unitX = ( (typeof attributes["unitX"]) == 'undefined' ? 50 : attributes["unitX"]);
            unitY = ( (typeof attributes["unitY"]) == 'undefined' ? 50 : attributes["unitY"]);
        }
        zoomfactor = ( (typeof attributes["zoom"]) == 'undefined' ? 1.0 : attributes["zoom"]);
        zoomX = zoomfactor*( (typeof attributes["zoomX"]) == 'undefined' ? 1.0 : attributes["zoomX"]);
        zoomY = zoomfactor*( (typeof attributes["zoomY"]) == 'undefined' ? 1.0 : attributes["zoomY"]);

        showCopyright = ( (typeof attributes["showCopyright"]) == 'undefined' ? JXG.Options.showCopyright : attributes["showCopyright"]);

        // create the renderer
        if(JXG.Options.renderer == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'vml') {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'silverlight') {
            renderer = new JXG.SilverlightRenderer(document.getElementById(box), dimensions.width, dimensions.height);
        } else {
            renderer = new JXG.CanvasRenderer(document.getElementById(box));
        }

        // create the board
        board = new JXG.Board(box, renderer, '', [originX, originY], 1.0, 1.0, unitX, unitY, dimensions.width, dimensions.height,showCopyright);
        this.boards[board.id] = board;

        // create elements like axes, grid, navigation, ...
        board.suspendUpdate();

        board.initInfobox();
        
        if(attributes["axis"]) {
        	board.defaultAxes = {};
            board.defaultAxes.x = board.create('axis', [[0,0], [1,0]], {});
            board.defaultAxes.y = board.create('axis', [[0,0], [0,1]], {});
        }

        if(attributes["grid"]) {
            board.renderer.drawGrid(board);
        }

        if (typeof attributes["shownavigation"] != 'undefined') attributes["showNavigation"] = attributes["shownavigation"];
        showNavi = ( (typeof attributes["showNavigation"]) == 'undefined' ? board.options.showNavigation : attributes["showNavigation"]);
        if (showNavi) {
            board.renderer.drawZoomBar(board);
        }

        board.unsuspendUpdate();

        return board;
    },

    /**
     * Load a board from a file containing a construction made with either GEONExT,
     * Intergeo, Geogebra, or Cinderella.
     * @param {String} box HTML-ID to the HTML-element in which the board is painted.
     * @param {String} file base64 encoded string.
     * @param {String} format containing the file format: 'Geonext' or 'Intergeo'.
     * @returns {JXG.Board} Reference to the created board.
     *
     * @see JXG.FileReader
     * @see JXG.GeonextReader
     * @see JXG.GeogebraReader
     * @see JXG.IntergeoReader
     * @see JXG.CinderellaReader
     */
    loadBoardFromFile: function (box, file, format) {
        var renderer, board, dimensions;

        if(JXG.Options.renderer == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'vml') {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'silverlight') {
            renderer = new JXG.SilverlightRenderer(document.getElementById(box), dimensions.width, dimensions.height);
        } else {
            renderer = new JXG.CanvasRenderer(document.getElementById(box));
        }
        
        //var dimensions = document.getElementById(box).getDimensions();
        dimensions = JXG.getDimensions(box);

        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        board = new JXG.Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height);
        board.initInfobox();
        board.beforeLoad();
        JXG.FileReader.parseFileContent(file, board, format);
        if(board.options.showNavigation) {
            board.renderer.drawZoomBar(board);
        }
        this.boards[board.id] = board;
        return board;
    },

    /**
     * Load a board from a base64 encoded string containing a construction made with either GEONExT,
     * Intergeo, Geogebra, or Cinderella.
     * @param {String} box HTML-ID to the HTML-element in which the board is painted.
     * @param {String} string base64 encoded string.
     * @param {String} format containing the file format: 'Geonext' or 'Intergeo'.
     * @returns {JXG.Board} Reference to the created board.
     *
     * @see JXG.FileReader
     * @see JXG.GeonextReader
     * @see JXG.GeogebraReader
     * @see JXG.IntergeoReader
     * @see JXG.CinderellaReader
     */
    loadBoardFromString: function(box, string, format) {
        var renderer, dimensions, board;

        if(JXG.Options.renderer == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'vml') {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
        } else if(JXG.Options.renderer == 'silverlight') {
            renderer = new JXG.SilverlightRenderer(document.getElementById(box), dimensions.width, dimensions.height);
        } else {
            renderer = new JXG.CanvasRenderer(document.getElementById(box));
        }
        //var dimensions = document.getElementById(box).getDimensions();
        dimensions = JXG.getDimensions(box);

        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        board = new JXG.Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height);
        board.initInfobox();
        board.beforeLoad();

        JXG.FileReader.parseString(string, board, format, true);
        if (board.options.showNavigation) {
            board.renderer.drawZoomBar(board);
        }

        this.boards[board.id] = board;
        return board;
    },

    /**
     * Delete a board and all its contents.
     * @param {String} board HTML-ID to the DOM-element in which the board is drawn.
     */
    freeBoard: function (board) {
        var el;

        if(typeof(board) == 'string') {
            board = this.boards[board];
        }

        // Remove the event listeners
        JXG.removeEvent(document, 'mousedown', board.mouseDownListener, board);
        JXG.removeEvent(document, 'mouseup', board.mouseUpListener,board);
        JXG.removeEvent(board.containerObj, 'mousemove', board.mouseMoveListener, board);

        // Remove all objects from the board.
        for(el in board.objects) {
            board.removeObject(board.objects[el]);
        }

        // Remove all the other things, left on the board
        board.containerObj.innerHTML = '';

        // Tell the browser the objects aren't needed anymore
        for(el in board.objects) {
            delete(board.objects[el]);
        }

        // Free the renderer and the algebra object
        delete(board.renderer);
        delete(board.algebra);

        // Finally remove the board itself from the boards array
        delete(this.boards[board.id]);
    },

    /**
     * This registers a new construction element to JSXGraph for the construction via the {@link JXG.Board.create}
     * interface.
     * @param {String} element The elements name. This is case-insensitive, existing elements with the same name
     * will be overwritten.
     * @param {function} creator A reference to a function taking three parameters: First the board, the element is
     * to be created on, a parent element array, and an attributes object. See {@link JXG.createPoint} or any other
     * <tt>JXG.create...</tt> function for an example.
     */
    registerElement: function (element, creator) {
        element = element.toLowerCase();
        this.elements[element] = creator;

        if(JXG.Board.prototype['_' + element])
        	throw new Error("JSXGraph: Can't create wrapper method in JXG.Board because member '_" + element + "' already exists'");
        JXG.Board.prototype['_' + element] = function (parents, attributes) {
        	return this.create(element, parents, attributes);
        };

    },

    /**
     * The opposite of {@link JXG.JSXGraph.registerElement}, it removes a given element from
     * the element list. You probably don't need this.
     * @param {String} element The name of the element which is to be removed from the element list.
     */
    unregisterElement: function (element) {
        delete (this.elements[element.toLowerCase()]);
        delete (JXG.Board.prototype['_' + element.toLowerCase()]);
    }
};

/**
 * Parameter magic: object may be a string containing the name or id of the object or
 * even the object itself, this function gets a returns to the object. Order: id/object, name.
 * @param {JXG.Board} board Reference to the board the object belongs to.
 * @param {String,Object} object String or reference to the object the reference is needed.
 * @returns {Object} Reference to the object given in parameter object
 */
JXG.getReference = function(board, object) {
    if(typeof(object) == 'string') {
        if(board.objects[object] != null) { // Search by ID
            object = board.objects[object];
        } else if (board.elementsByName[object] != null) { // Search by name
            object = board.elementsByName[object];
        }
    }

    return object;
};

/**
 * This is just a shortcut to {@link JXG.getReference}.
 */
JXG.getRef = JXG.getReference;

/**
 * Checks if the value of a given variable is of type string.
 * @param v
 * @returns {Boolean} True, if obj is of type string.
 */
JXG.isString = function(v) {
    return typeof v == "string";
};

/**
 * Checks if the value of a given variable is of type number.
 * @param v
 * @returns {Boolean} True, if obj is of type number.
 */
JXG.isNumber = function(v) {
    return typeof v == "number";
};

/**
 * Checks if a given variable references a function.
 * @param v
 * @returns {Boolean} True, if obj is a function.
 */
JXG.isFunction = function(v) {
    return typeof v == "function";
};

/**
 * Checks if a given variable references an array.
 * @param v
 * @returns {Boolean} True, if obj is of type array.
 */
JXG.isArray = function(v) {
    // Borrowed from prototype.js
    return v != null && typeof v == "object" && 'splice' in v && 'join' in v;
};

/**
 * Checks if a given variable is a reference of a JSXGraph Point element.
 * @param v
 * @returns {Boolean} True, if obj is of type JXG.Point.
 */
JXG.isPoint = function(v) {
    if(typeof v == 'object') {
        return (v.elementClass == JXG.OBJECT_CLASS_POINT);
    }

    return false;
};

/**
 * Converts a string containing either <strong>true</strong> or <strong>false</strong> into a boolean value.
 * @param {String} s String containing either <strong>true</strong> or <strong>false</strong>.
 * @returns {Boolean} String typed boolean value converted to boolean.
 */
JXG.str2Bool = function(s) {
    if (s==undefined || s==null) {
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
 * TODO: Documentation
 * Convert String, number or function to function.
 * This method is used in Transformation.js
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
  * Convert String, number or function to function.
  **/
JXG.createFunction = function(term,board,variableName,evalGeonext) {
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
 * Checks given parents array against expectations.
 * @param {Array} parents A user given parents array
 * @param {Array} expects TODO: describe this
 * @returns {Array} A new parents array prepared for the use within a create* method
 */
JXG.checkParents = function(parents, expects) {
    /*
        structure of expects, e.g. for midpoint:

        idea 1:
        [
            [
                JXG.OBJECT_CLASS_POINT,
                JXG.OBJECT_CLASS_POINT
            ],
            [
                JXG.OBJECT_CLASS_LINE
            ]
        ]

        this is good for describing what is expected, but this way the parent elements
        can't be sorted. how is this method supposed to know, that in case of a line it
        has to return the line's defining points?
     */
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

JXG.readOption = function(options, eltype, key) {
    var val = options.elements[key];
    if (typeof options[eltype][key]!='undefined') val = options[eltype][key];
    return val;
};

JXG.checkAttributes = function(atts, keyvaluepairs) {
    var key;
    if (atts==null) { atts = {}; }
    for (key in keyvaluepairs) {
        if(atts[key] == null || typeof atts[key] == 'undefined') {
            atts[key] = keyvaluepairs[key];
        }
    }
    return atts;
};

JXG.getDimensions = function(elementId) {
    var element, display, els, originalVisibility, originalPosition,
        originalDisplay, originalWidth, originalHeight;

    // Borrowed from prototype.js
    element = document.getElementById(elementId);
    if (element==null) {
        throw new Error("\nJSXGraph: HTML container element '" + (elementId) + "' not found.");
    }

    display = element.style['display'];
    if (display != 'none' && display != null) {// Safari bug
        return {width: element.offsetWidth, height: element.offsetHeight};
    }

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    els = element.style;
    originalVisibility = els.visibility;
    originalPosition = els.position;
    originalDisplay = els.display;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = 'block';

    originalWidth = element.clientWidth;
    originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
};

/**
  * addEvent.
  */
JXG.addEvent = function( obj, type, fn, owner ) {
    owner['x_internal'+type] = function() {return fn.apply(owner,arguments);};
    if (typeof obj.addEventListener!='undefined') { // Non-IE browser
        obj.addEventListener(type, owner['x_internal'+type], false);
    } else {  // IE
        obj.attachEvent('on'+type, owner['x_internal'+type]);
    }
};

/**
  * removeEvent.
  */
JXG.removeEvent = function( obj, type, fn, owner ) {
    try {
        if (typeof obj.addEventListener!='undefined') { // Non-IE browser
            obj.removeEventListener(type, owner['x_internal'+type], false);
        } else {  // IE
            obj.detachEvent('on'+type, owner['x_internal'+type]);
        }
    } catch(e) {
        //document.getElementById('debug').innerHTML += 'on'+type+': ' + owner['x_internal'+type]+'<br>\n';
    }
};

JXG.bind = function(fn, owner ) {
    return function() {
        return fn.apply(owner,arguments);
    };
};

/**
  * getPosition: independent from prototype and jQuery
  */
JXG.getPosition = function (e) {
    var posx = 0,
        posy = 0;

    if (!e) {
        e = window.event;
    }

    if (e.pageX || e.pageY)     {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY)    {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return [posx,posy];
};

/**
  * getOffset: Abstraction layer for Prototype.js and jQuery
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
  * getStyle: Abstraction layer for Prototype.js and jQuery
  * Now independent from Prototype  and jQuery
  */
JXG.getStyle = function (obj, stylename) {
    return obj.style[stylename];
};

/**
 * Extracts the keys of a given object.
 * @param object The object the keys are to be extracted
 * @param onlyOwn If true, additionally check hasOwnProperty()
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
 * Outputs a deep copy of an existing object and not only a flat copy.
 * @param {Object} obj Object to be copied.
 * @returns {Object} Deep copy of given object.
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

JXG.toJSON = function(obj) {
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

JXG.capitalize = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
};

/**
 * Copyright 2009 Nicholas C. Zakas. All rights reserved.
 * MIT Licensed
 * @param {Array} items to do
 * @param {function} process Function that is applied for every array item
 * @param {Object} context Meaning of this in function process
 * @param {function} callback Function called after the last array element has been processed.
**/
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

JXG.trim = function(str) {
	str = str.replace(/^w+/, "");
	str = str.replace(/w+$/, "");
	
	return str;
};


JXG.debug = function(s) {
    if (console && console.log) {
        if (typeof s === 'string') s = s.replace(/<\S[^><]*>/g, "")
        console.log(s);
    } else if (document.getElementById('debug')) {
        document.getElementById('debug').innerHTML += s + "<br/>";
    }
    // else: do nothing
};


/*
 * JessieScript startup
 */
JXG.addEvent(window, 'load', function () {
    var scripts = document.getElementsByTagName('script'),
        i, div, board;
    
    for(i=0;i<scripts.length;i++) {
        if(scripts[i].getAttribute('type', 'none') == 'text/jessiescript') {
            div = document.createElement('div');
            div.setAttribute('id', 'jessiescript_autgen_jxg_'+i);
            div.setAttribute('style', 'width:500px; height:500px; float:left');
            div.setAttribute('class', 'jxgbox');
            document.body.insertBefore(div, scripts[i]);

            board = JXG.JSXGraph.initBoard('jessiescript_autgen_jxg_'+i, {boundingbox: [-5, 5, 5, -5], keepaspectratio:true});
            board.construct(scripts[i].innerHTML);
        }
    }
}, window);

(function(undefined) {
    JXG.undefined = undefined;
})();
