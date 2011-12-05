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
    licenseText: 'JSXGraph v0.92 Copyright (C) see http://jsxgraph.org',

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
        var i, arr;

        if (JXG.supportsSVG()) {
            JXG.Options.renderer = 'svg';
        } else if (JXG.supportsVML()) {
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
        } else {
            JXG.Options.renderer = 'canvas';
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
            board,
            wheelzoom, shiftpan;

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
                 * If the boundingbox attribute is given and the ratio of height and width of the
                 * sides defined by the bounding box and the ratio of the dimensions of the div tag
                 * which contains the board do not coincide, then the smaller side is chosen.
                 */
                unitX = w/(bbox[2]-bbox[0]);
                unitY = h/(-bbox[3]+bbox[1]);
                if (Math.abs(unitX)<Math.abs(unitY)) {
                    unitY = Math.abs(unitX)*unitY/Math.abs(unitY);
                } else {
                    unitX = Math.abs(unitY)*unitX/Math.abs(unitX);
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

        wheelzoom = ( (typeof attributes["zoom"]) == 'undefined' ? JXG.Options.zoom.wheel : attributes["zoom"]);
        shiftpan = ( (typeof attributes["pan"]) == 'undefined' ? JXG.Options.pan : attributes["pan"]);

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
        board = new JXG.Board(box, renderer, '', [originX, originY], zoomX, zoomY, unitX, unitY, dimensions.width, dimensions.height, showCopyright);
        this.boards[board.id] = board;

        board.keepaspectratio = attributes.keepaspectratio;
        board.options.zoom.wheel = wheelzoom;
        board.options.pan = shiftpan;


        // create elements like axes, grid, navigation, ...
        board.suspendUpdate();
        board.initInfobox();
        
        if(attributes["axis"]) {
        	board.defaultAxes = {};
            board.defaultAxes.x = board.create('axis', [[0,0], [1,0]], {ticks:{drawZero:true}});
            board.defaultAxes.y = board.create('axis', [[0,0], [0,1]], {ticks:{drawZero:false}});
        }

        if(attributes["grid"]) {
            board.create('grid', []);
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
        var el, i;

        if (typeof(board) == 'string') {
            board = this.boards[board];
        }

        board.removeEventHandlers();

        // Remove all objects from the board.
        for(el in board.objects) {
            board.removeObject(board.objects[el]);
        }

        // Remove all the other things, left on the board, XHTML save
        while (board.containerObj.firstChild) {
            board.containerObj.removeChild(board.containerObj.firstChild);
        }
        // board.containerObj.innerHTML = '';

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
     * @param {Function} creator A reference to a function taking three parameters: First the board, the element is
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
