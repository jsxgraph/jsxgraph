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
    this.licenseText = 'JSXGraph v0.70 Copyright (C) see http://jsxgraph.org';

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

    var ie;
    var opera;
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
                function MouseMove(e) {
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
    JXG.rendererFiles[this.rendererType].split(',').each( function(include) { JXG.require(JXG.requirePath+include+'.js'); } );
    

    /**
     * Initialise a new board.
     * @param {String} box Html-ID to the Html-element in which the board is painted.
     * @return {Board} Reference to the created board.
     */
    this.initBoard = function (box, atts) {
        // Create a new renderer
        var renderer;
        
        if(typeof atts == 'undefined')
            atts = {};
            
        var originX = ( (typeof atts["originX"]) == 'undefined' ? 150 : atts["originX"]);
        var originY = ( (typeof atts["originY"]) == 'undefined' ? 150 : atts["originY"]);
        var zoomX = ( (typeof atts["zoomX"]) == 'undefined' ? 1.0 : atts["zoomX"]);
        var zoomY = ( (typeof atts["zoomY"]) == 'undefined' ? 1.0 : atts["zoomY"]);
        var unitX = ( (typeof atts["unitX"]) == 'undefined' ? 50 : atts["unitX"]);
        var unitY = ( (typeof atts["unitY"]) == 'undefined' ? 50 : atts["unitY"]);
    
        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer($(box));
        } else if(this.rendererType == 'vml') {
            renderer = new JXG.VMLRenderer($(box));
        } else {
            renderer = new JXG.SilverlightRenderer($(box));
        }
    
        var dimensions = $(box).getDimensions();
        var board = new JXG.Board(box, renderer, '', [originX, originY], 1.0, 1.0, unitX, unitY, dimensions.width, dimensions.height);
        this.boards[board.id] = board;
        board.initGeonextBoard();
    
        return board;
    }

    /**
     * Load a board from an uncompressed geonext file.
     * @param {String} box Html-ID to the Html-element in which the board is painted.
     * @param {String} file Url to the geonext-file. Must be uncompressed (.nc.gxt).
     * @return {Board} Reference to the created board.
     * @see GeonextReader
     */
    this.loadBoardFromFile = function (box, file, format) {
        var renderer;
        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer($(box));
        } else {
            renderer = new JXG.VMLRenderer($(box));
        }
        var dimensions = $(box).getDimensions();
    
        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        var board = new JXG.Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height);

        board.beforeLoad();

        JXG.FileReader.parseFileContent(file, board, format);

        this.boards[board.id] = board;
        return board;
    }

    this.loadBoardFromString = function(box, string, format) {
        var renderer;
        if(this.rendererType == 'svg') {
            renderer = new JXG.SVGRenderer($(box));
        } else {
            renderer = new JXG.VMLRenderer($(box));
        }
        var dimensions = $(box).getDimensions();
    
        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        var board = new JXG.Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height);

        board.beforeLoad();

        JXG.FileReader.parseString(string, board, format);
    
        this.boards[board.id] = board;
        return board;
    }

    /**
     * Free a board.
     * @param {String} box Html-ID to the Html-element in which the board was painted.
     */
    this.freeBoard = function (board) {
        if(typeof(board) == 'string') {
            board = this.boards[board];
        }
    
        // Remove the event listeners
        Event.stopObserving(board.container, 'mousedown', board.onMouseDownListener);
        Event.stopObserving(board.container, 'mouseup', board.onMouseUpListener);
        Event.stopObserving(board.container, 'mousemove', board.onMouseMoveListener);
    
        // Remove all objects from the board.
        for(var el in board.objects) {
            board.removeObject(board.objects[el]);
        }
        
        // Remove all the other things, left on the board
        $(board.container).innerHTML = '';
        
        // Tell the browser the objects aren't needed anymore
        for(var el in board.objects) {
            delete(board.objects[el]);
        }
        
        // Free the renderer and the algebra object
        delete(board.renderer);
        delete(board.algebra);
        
        // Finally remove the board itself from the boards array    
        delete(this.boards[board.id]);
    }
    
    this.registerElement = function (element, creator) {
        element = element.toLowerCase();
        this.elements[element] = creator;
    }

    this.unregisterElement = function (element) {
        delete (this.elements[element]);
    }
};

/**
 * Parameter magic: object may be a string containing the name or id of the object or
 * even the object itself, this function gets a returns to the object. Order: id/object, name.
 * @param {String/Object} object String or reference to the object the reference is needed.
 * @param {Board} board Reference to the board the object belongs to.
 * @return {Object} Reference to the object given in parameter object
 */
JXG.GetReferenceFromParameter = function(board, object) {
    if(typeof(object) == 'string') {
        if(board.objects[object] != null) { // Search by ID
            object = board.objects[object];
        } else if (board.elementsByName[object] != null) { // Search by name
            object = board.elementsByName[object];
        }
    }
    
    return object;
};

JXG.IsString = function(s) {
    return Object.isString(s); // From the prototype lib
/*
    if(typeof s == 'string')
        return true;
        
    if(typeof s == 'object') {
        var regex = s.constructor.toString().match(/string/i);
        return (regex != null);
    }

    return false;        
*/
};

JXG.IsNumber = function(n) {
    if(typeof n == 'number')
        return true;
/*        
    if(typeof n == 'object') {
        var regex = n.constructor.toString().match(/number/i);
        return (regex != null);
    }
*/
    return false;        
};

JXG.IsFunction = function(f) {
    return Object.isFunction(f); // From the prototype lib
/*    
    if(typeof f == 'function')
        return true;
        
    if(typeof f == 'object') {
        var regex = f.constructor.toString().match(/function/i);
 
        return (regex != null);
    }
    return false;        
 */
};

JXG.IsArray = function(a) {
    return Object.isArray(a); // From the prototype lib
/*    
    if(typeof a == 'object') {
        var regex = a.constructor.toString().match(/array/i);
        
        var ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
        if(!ie) {
            return (regex != null);
        }
        else {
            return a && (a instanceof Array || typeof a == "array"); 
        }
    }

    return false;        
 */
};

JXG.IsPoint = function(p) {
    if(typeof p == 'object') {
        return (p.elementClass == JXG.OBJECT_CLASS_POINT);
    }

    return false;        
};

JXG.createEvalFunction = function(board,param,n) {
    // convert GEONExT syntax into function
    var f = [];
    for (var i=0;i<n;i++) {
        if (typeof param[i] == 'string') {
            var str = board.algebra.geonext2JS(param[i]);
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
    }
}
