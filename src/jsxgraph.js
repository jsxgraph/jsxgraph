/*
    Copyright 2008,2009
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
 * @fileoverview Class Geonext is defined in this file. Geonext controls all boards.
 * It has methods to create, save, load and free boards.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Geonext singleton object.
 * @class This is the Geonext class. It stores all properties required
 * to load, save, create and free a board.
 * @constructor
 * @param {String} forceRenderer If a specific renderer should be chosen. Possible values are 'vml', 'svg', 'silverlight'
 */
JXG.JSXGraph = new function (forceRenderer) {
    var ie, opera, i, arr;
    this.licenseText = 'JSXGraph v0.78.2 Copyright (C) see http://jsxgraph.org';

    /**
            * Stores the renderer that is used to draw the board.
            * @type String
            */
    this.rendererType = '';
    
    /**
            * Associative array that keeps all boards.
            * @type Object
            */
    this.boards = {};

    /**
            * Associative array that keeps all registered geometry elements
            * @type Object
            */
    this.elements = {};

    if( (forceRenderer == 'undefined') || (forceRenderer == null) || (forceRenderer == '') ) {
        /* Determine the users browser */
        ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
        opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);

        /* and set the rendererType according to the browser */
        if ((!ie) || (opera)) {
            this.rendererType = 'svg';
        }
        else {
            //if(Silverlight.available)
            //    this.rendererType = 'silverlight';
            //else
                this.rendererType = 'vml';
                function MouseMove(e) { //Magic!
                  document.body.scrollLeft;
                  document.body.scrollTop;
                }
                document.onmousemove = MouseMove;
        }
    } else {
        /* the user has chosen a specific renderer */
        this.rendererType = forceRenderer;
    }

    /* Load the source files for the renderer */
    //JXG.rendererFiles[this.rendererType].split(',').each( function(include) { JXG.require(JXG.requirePath+include+'.js'); } );
    arr = JXG.rendererFiles[this.rendererType].split(',');
    for (i=0;i<arr.length;i++) ( function(include) { JXG.require(JXG.requirePath+include+'.js'); } )(arr[i]);


    /**
            * Initialise a new board.
            * @param {String} box Html-ID to the Html-element in which the board is painted.
            * @return {JXG.Board} Reference to the created board.
            */
    this.initBoard = function (box, attributes) {
        // Create a new renderer
        var renderer,
            originX, originY, unitX, unitY,
            w, h, dimensions,
            bbox,
            zoomfactor, zoomX, zoomY,
            showCopyright, showNavi,
            board;

        dimensions = JXG.getDimensions(box);
        if (typeof attributes == 'undefined') {
            attributes = {};
        }
        if (typeof attributes["boundingbox"] != 'undefined') {
            bbox = attributes["boundingbox"];
            w = parseInt(dimensions.width);
            h = parseInt(dimensions.height);
            if (attributes["keepaspectratio"]) {
            /**
                                * If the boundingbox attribute is given and the ratio of height and width of the sides defined by the bounding box and 
                                * the ratio of the dimensions of the div tag which contains the board do not coincide, 
                                * then the smaller side is chosen.
                                */
                unitX = w/(bbox[2]-bbox[0]);
                unitY = h/(-bbox[3]+bbox[1]);
                if (unitX>unitY) {
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
        
        if (typeof attributes["showcopyright"] != 'undefined') attributes["showCopyright"] = attributes["showcopyright"];
        showCopyright = ( (typeof attributes["showCopyright"]) == 'undefined' ? true : attributes["showCopyright"]);

        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else if(this.rendererType == 'vml') {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
        } else {
            renderer = new JXG.SilverlightRenderer(document.getElementById(box), dimensions.width, dimensions.height);
        }

        board = new JXG.Board(box, renderer, '', [originX, originY], 1.0, 1.0, unitX, unitY, dimensions.width, dimensions.height,showCopyright);
        this.boards[board.id] = board;
        // board.initGeonextBoard();  // Contsruct "Ursprung" and other elements.
        board.initInfobox();

        if((typeof attributes["axis"] != 'undefined') && attributes["axis"]) {
        	board.defaultAxes = {};
            board.defaultAxes.x = board.createElement('axis', [[0,0], [1,0]], {});
            board.defaultAxes.y = board.createElement('axis', [[0,0], [0,1]], {});
        }

        if ((typeof attributes["grid"] != 'undefined') && attributes["grid"]) {
            board.renderer.drawGrid(board);
        }

        if (typeof attributes["shownavigation"] != 'undefined') attributes["showNavigation"] = attributes["shownavigation"];
        showNavi = ( (typeof attributes["showNavigation"]) == 'undefined' ? board.options.showNavigation : attributes["showNavigation"]);
        if (showNavi) {
            board.renderer.drawZoomBar(board);
        }

        return board;
    };

    /**
     * Load a board from a file of format GEONExT or Intergeo.
     * @param {String} box Html-ID to the Html-element in which the board is painted.
     * @param {String} file Url to the geonext-file. 
     * @param {String} string containing the file format: 'Geonext' or 'Intergeo'. 
     * @return {JXG.Board} Reference to the created board.
     * @see JXG.GeonextReader
     */
    this.loadBoardFromFile = function (box, file, format) {
        var renderer, board, dimensions;
        
        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
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
    };

    /**
     * Load a board from a base64 encoded string containing a GEONExT or Intergeo construction.
     * @param {String} box Html-ID to the Html-element in which the board is painted.
     * @param {String} string base64 encoded string.
     * @param {String} string containing the file format: 'Geonext' or 'Intergeo'. 
     * @return {JXG.Board} Reference to the created board.
     * @see JXG.GeonextReader
     */
    this.loadBoardFromString = function(box, string, format) {
        var renderer, dimensions, board;
        
        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer(document.getElementById(box));
        } else {
            renderer = new JXG.VMLRenderer(document.getElementById(box));
        }
        //var dimensions = document.getElementById(box).getDimensions();
        dimensions = JXG.getDimensions(box);

        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        board = new JXG.Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height);
        board.initInfobox();
        board.beforeLoad();

        JXG.FileReader.parseString(string, board, format);
        if (board.options.showNavigation) {
            board.renderer.drawZoomBar(board);
        }

        this.boards[board.id] = board;
        return board;
    };

    /**
     * Free a board.
     * @param {String} box Html-ID to the Html-element in which the board was painted.
     */
    this.freeBoard = function (board) {
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
    };

    this.registerElement = function (element, creator) {
        element = element.toLowerCase();
        this.elements[element] = creator;

        if(JXG.Board.prototype['_' + element])
        	throw new Error("JSXGraph: Can't create wrapper method in JXG.Board because member '_" + element + "' already exists'");
        JXG.Board.prototype['_' + element] = function (parents, attributes) {
        	return this.createElement(element, parents, attributes);
        };
        
    };

    this.unregisterElement = function (element) {
        delete (this.elements[element.toLowerCase()]);
        delete (JXG.Board.prototype['_' + element.toLowerCase()]);
    };
};

/**
 * Parameter magic: object may be a string containing the name or id of the object or
 * even the object itself, this function gets a returns to the object. Order: id/object, name.
 * @param {JXG.Board} board Reference to the board the object belongs to.
 * @param {String,Object} object String or reference to the object the reference is needed.
 * @return {Object} Reference to the object given in parameter object
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

JXG.isString = function(obj) {
    return typeof obj == "string";
};

JXG.isNumber = function(obj) {
    return typeof obj == "number";
};

JXG.isFunction = function(obj) {
    return typeof obj == "function";
};

JXG.isArray = function(obj) {
    // Borrowed from prototype.js
    return obj != null && typeof obj == "object" && 'splice' in obj && 'join' in obj;
};

JXG.isPoint = function(p) {
    if(typeof p == 'object') {
        return (p.elementClass == JXG.OBJECT_CLASS_POINT);
    }

    return false;
};

JXG._board = function(box, attributes) {
	return JXG.JSXGraph.initBoard(box, attributes);
};

/**
  * Convert String, number or function to function.
  * This method is used in Transformation.js
  */
JXG.createEvalFunction = function(board,param,n) {
    // convert GEONExT syntax into function
    var f = [], i, str;
    
    for (i=0;i<n;i++) {
        if (typeof param[i] == 'string') {
            str = board.algebra.geonext2JS(param[i]);
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
    
    if ((evalGeonext==null || evalGeonext==true) && JXG.isString(term)) {
        // Convert GEONExT syntax into  JavaScript syntax
        newTerm = board.algebra.geonext2JS(term);
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
JXG.getPosition = function (Evt) {
    var posx = 0,
        posy = 0,
        Evt;
        
    if (!Evt) {
        Evt = window.event;
    }
    
    if (Evt.pageX || Evt.pageY)     {
        posx = Evt.pageX;
        posy = Evt.pageY;
    }
    else if (Evt.clientX || Evt.clientY)    {
        posx = Evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = Evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
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

/*
JXG.getOffset = function (obj) {
    var o;
    
    if (typeof Prototype!='undefined' && typeof Prototype.Browser!='undefined') { // Prototype lib
        return Element.cumulativeOffset(obj);
    } else {                         // jQuery
        o = $(obj).offset();
        return [o.left,o.top];
    }
};
*/

/**
  * getStyle: Abstraction layer for Prototype.js and jQuery
  * Now independent from Prototype  and jQuery
  */
JXG.getStyle = function (obj, stylename) {
    return obj.style[stylename];
/*
    if (typeof Prototype!='undefined' && typeof Prototype.Browser!='undefined') { // Prototype lib
        return $(obj).getStyle(stylename);
    } else {
        if (typeof $(obj).attr(stylename)!='undefined') {
            return $(obj).attr(stylename);
        } else {
            return $(obj).css(stylename);
        }
    }
*/    
};

JXG.keys = function(object) {
    var keys = [], property;
    
    for (property in object) {
        keys.push(property);
    }
    return keys;
};

JXG.escapeHTML = function(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

JXG.unescapeHTML = function(str) {
    return str.replace(/<\/?[^>]+>/gi, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
};

/**
 * Outputs a copy of an existing object and not only a flat copy.
 * @param {Object} obj Object to be copied.
 * @type Object
 * @return Copy of given object.
 */
JXG.clone = function(obj) {
    var cObj = {};
    cObj.prototype = obj;
    return cObj;
};

/**
 * Outputs a deep copy of an existing object and not only a flat copy.
 * @param {Object} obj Object to be copied.
 * @type Object
 * @return Deep copy of given object.
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
 * Outputs a copy of an existing object just like {@link #clone} and copies the contents of the second object to the new one.
 * @param {Object} obj Object to be copied.
 * @param {Object} obj2 Object with data that is to be copied to the new one as well.
 * @type Object
 * @return Copy of given object including some new/overwritten data from obj2.
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

/*
JXG.isSilverlightInstalled = function() {
    var isInstalled = false,
        activeX, tryOtherBrowsers, slPlugin;

    try
    {
        activeX = null;
        tryOtherBrowsers = false;

        if (window.ActiveXObject)
        {
            try
            {
                activeX = new ActiveXObject('AgControl.AgControl');
                isInstalled = true;
                activeX = null;
            }
            catch (e)
            {
                tryOtherBrowsers = true;
            }
        }
        else
        {
            tryOtherBrowsers = true;
        }
        if (tryOtherBrowsers)
        {
            slPlugin = navigator.plugins["Silverlight Plug-In"];
            if (slPlugin)
            {
                    isInstalled = true;
            }
        }
    }
    catch (e)
    {
        isInstalled = false;
    }

    return isInstalled;
};
*/
