/*
    Copyright 2008-2018
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


/*global JXG: true, document:true, jQuery:true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 utils/env
 utils/type
 base/board
 reader/file
 options
 renderer/svg
 renderer/vml
 renderer/canvas
 renderer/no
 */

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 * @version 0.99
 */

define([
    'jxg', 'utils/env', 'utils/type', 'base/board', 'reader/file', 'options',
    'renderer/svg', 'renderer/vml', 'renderer/canvas', 'renderer/no'
], function (JXG, Env, Type, Board, FileReader, Options, SVGRenderer, VMLRenderer, CanvasRenderer, NoRenderer) {

    "use strict";

    /**
     * Constructs a new JSXGraph singleton object.
     * @class The JXG.JSXGraph singleton stores all properties required
     * to load, save, create and free a board.
     */
    JXG.JSXGraph = {
        /**
         * Stores the renderer that is used to draw the boards.
         * @type String
         */
        rendererType: (function () {
            Options.board.renderer = 'no';

            if (Env.supportsVML()) {
                Options.board.renderer = 'vml';
                // Ok, this is some real magic going on here. IE/VML always was so
                // terribly slow, except in one place: Examples placed in a moodle course
                // was almost as fast as in other browsers. So i grabbed all the css and
                // lib scripts from our moodle, added them to a jsxgraph example and it
                // worked. next step was to strip all the css/lib code which didn't affect
                // the VML update speed. The following five lines are what was left after
                // the last step and yes - it basically does nothing but reads two
                // properties of document.body on every mouse move. why? we don't know. if
                // you know, please let us know.
                //
                // If we want to use the strict mode we have to refactor this a little bit. Let's
                // hope the magic isn't gone now. Anywho... it's only useful in old versions of IE
                // which should not be used anymore.
                document.onmousemove = function () {
                    var t;

                    if (document.body) {
                        t = document.body.scrollLeft;
                        t += document.body.scrollTop;
                    }

                    return t;
                };
            }

            if (Env.supportsCanvas()) {
                Options.board.renderer = 'canvas';
            }

            if (Env.supportsSVG()) {
                Options.board.renderer = 'svg';
            }

            // we are inside node
            if (Env.isNode() && Env.supportsCanvas()) {
                Options.board.renderer = 'canvas';
            }

            if (Env.isNode() || Options.renderer === 'no') {
                Options.text.display = 'internal';
                Options.infobox.display = 'internal';
            }

            return Options.board.renderer;
        }()),

        initRenderer: function (box, dim, doc, attrRenderer) {
            var boxid, renderer;

            // Former version:
            // doc = doc || document
            if ((!Type.exists(doc) || doc === false) && typeof document === 'object') {
                doc = document;
            }

            if (typeof doc === 'object' && box !== null) {
                boxid = doc.getElementById(box);

                // Remove everything from the container before initializing the renderer and the board
                while (boxid.firstChild) {
                    boxid.removeChild(boxid.firstChild);
                }
            } else {
                boxid = box;
            }

            // If attrRenderer is not supplied take the first available renderer
            if (attrRenderer === undefined || attrRenderer === 'auto') {
                attrRenderer = this.rendererType;
            }
            // create the renderer
            if (attrRenderer === 'svg') {
                renderer = new SVGRenderer(boxid, dim);
            } else if (attrRenderer === 'vml') {
                renderer = new VMLRenderer(boxid);
            } else if (attrRenderer === 'canvas') {
                renderer = new CanvasRenderer(boxid, dim);
            } else {
                renderer = new NoRenderer();
            }

            return renderer;
        },

        /**
         * Initialise a new board.
         * @param {String} box Html-ID to the Html-element in which the board is painted.
         * @param {Object} attributes An object that sets some of the board properties. Most of these properties can be set via JXG.Options.
         * @param {Array} [attributes.boundingbox=[-5, 5, 5, -5]] An array containing four numbers describing the left, top, right and bottom boundary of the board in user coordinates
         * @param {Boolean} [attributes.keepaspectratio=false] If <tt>true</tt>, the bounding box is adjusted to the same aspect ratio as the aspect ratio of the div containing the board.
         * @param {Boolean} [attributes.showCopyright=false] Show the copyright string in the top left corner.
         * @param {Boolean} [attributes.showNavigation=false] Show the navigation buttons in the bottom right corner.
         * @param {Object} [attributes.zoom] Allow the user to zoom with the mouse wheel or the two-fingers-zoom gesture.
         * @param {Object} [attributes.pan] Allow the user to pan with shift+drag mouse or two-fingers-pan gesture.
         * @param {Boolean} [attributes.axis=false] If set to true, show the axis. Can also be set to an object that is given to both axes as an attribute object.
         * @param {Boolean|Object} [attributes.grid] If set to true, shows the grid. Can also bet set to an object that is given to the grid as its attribute object.
         * @param {Boolean} [attributes.registerEvents=true] Register mouse / touch events.
         * @returns {JXG.Board} Reference to the created board.
         */
        initBoard: function (box, attributes) {
            var originX, originY, unitX, unitY,
                renderer,
                w, h, dimensions,
                bbox, attr, axattr, axattr_x, axattr_y,
                board;

            attributes = attributes || {};

            // merge attributes
            attr = Type.copyAttributes(attributes, Options, 'board');
            attr.zoom = Type.copyAttributes(attr, Options, 'board', 'zoom');
            attr.pan = Type.copyAttributes(attr, Options, 'board', 'pan');
            attr.selection = Type.copyAttributes(attr, Options, 'board', 'selection');
            attr.navbar = Type.copyAttributes(attr.navbar, Options, 'navbar');

            dimensions = Env.getDimensions(box, attr.document);

            if (attr.unitx || attr.unity) {
                originX = Type.def(attr.originx, 150);
                originY = Type.def(attr.originy, 150);
                unitX = Type.def(attr.unitx, 50);
                unitY = Type.def(attr.unity, 50);
            } else {
                bbox = attr.boundingbox;
                w = parseInt(dimensions.width, 10);
                h = parseInt(dimensions.height, 10);

                if (Type.exists(bbox) && attr.keepaspectratio) {
                    /*
                     * If the boundingbox attribute is given and the ratio of height and width of the
                     * sides defined by the bounding box and the ratio of the dimensions of the div tag
                     * which contains the board do not coincide, then the smaller side is chosen.
                     */
                    unitX = w / (bbox[2] - bbox[0]);
                    unitY = h / (bbox[1] - bbox[3]);

                    if (Math.abs(unitX) < Math.abs(unitY)) {
                        unitY = Math.abs(unitX) * unitY / Math.abs(unitY);
                    } else {
                        unitX = Math.abs(unitY) * unitX / Math.abs(unitX);
                    }
                } else {
                    unitX = w / (bbox[2] - bbox[0]);
                    unitY = h / (bbox[1] - bbox[3]);
                }
                originX = -unitX * bbox[0];
                originY = unitY * bbox[1];
            }

            renderer = this.initRenderer(box, dimensions, attr.document, attr.renderer);

            // create the board
            board = new Board(box, renderer, attr.id, [originX, originY],
                        attr.zoomfactor * attr.zoomx,
                        attr.zoomfactor * attr.zoomy,
                        unitX, unitY,
                        dimensions.width, dimensions.height,
                        attr);

            JXG.boards[board.id] = board;

            board.keepaspectratio = attr.keepaspectratio;
            board.resizeContainer(dimensions.width, dimensions.height, true, true);

            // create elements like axes, grid, navigation, ...
            board.suspendUpdate();
            board.initInfobox();

            if (attr.axis) {
                axattr = typeof attr.axis === 'object' ? attr.axis : {};

                // The defaultAxes attributes are overwritten by user supplied axis object.
                axattr_x = Type.deepCopy(Options.board.defaultAxes.x, axattr);
                axattr_y = Type.deepCopy(Options.board.defaultAxes.y, axattr);
                // The user supplied defaultAxes attributes are merged in.
                if (attr.defaultaxes.x) {
                    axattr_x = Type.deepCopy(axattr_x, attr.defaultaxes.x);
                }
                if (attr.defaultaxes.y) {
                    axattr_y = Type.deepCopy(axattr_y, attr.defaultaxes.y);
                }

                board.defaultAxes = {};
                board.defaultAxes.x = board.create('axis', [[0, 0], [1, 0]], axattr_x);
                board.defaultAxes.y = board.create('axis', [[0, 0], [0, 1]], axattr_y);
            }

            if (attr.grid) {
                board.create('grid', [], (typeof attr.grid === 'object' ? attr.grid : {}));
            }

            board._createSelectionPolygon(attr);
            /*
            selectionattr = Type.copyAttributes(attr, Options, 'board', 'selection');
            if (selectionattr.enabled === true) {
                board.selectionPolygon = board.create('polygon', [[0, 0], [0, 0], [0, 0], [0, 0]], selectionattr);
            }
            */

            board.renderer.drawZoomBar(board, attr.navbar);
            board.unsuspendUpdate();

            return board;
        },

        /**
         * Load a board from a file containing a construction made with either GEONExT,
         * Intergeo, Geogebra, or Cinderella.
         * @param {String} box HTML-ID to the HTML-element in which the board is painted.
         * @param {String} file base64 encoded string.
         * @param {String} format containing the file format: 'Geonext' or 'Intergeo'.
         * @param {Object} [attributes]
         * @returns {JXG.Board} Reference to the created board.
         * @see JXG.FileReader
         * @see JXG.GeonextReader
         * @see JXG.GeogebraReader
         * @see JXG.IntergeoReader
         * @see JXG.CinderellaReader
         */
        loadBoardFromFile: function (box, file, format, attributes, callback) {
            var attr, renderer, board, dimensions,
                selectionattr;

            attributes = attributes || {};

            // merge attributes
            attr = Type.copyAttributes(attributes, Options, 'board');
            attr.zoom = Type.copyAttributes(attributes, Options, 'board', 'zoom');
            attr.pan = Type.copyAttributes(attributes, Options, 'board', 'pan');
            attr.selection = Type.copyAttributes(attr, Options, 'board', 'selection');
            attr.navbar = Type.copyAttributes(attr.navbar, Options, 'navbar');

            dimensions = Env.getDimensions(box, attr.document);
            renderer = this.initRenderer(box, dimensions, attr.document, attr.renderer);

            /* User default parameters, in parse* the values in the gxt files are submitted to board */
            board = new Board(box, renderer, '', [150, 150], 1, 1, 50, 50, dimensions.width, dimensions.height, attr);
            board.initInfobox();
            board.resizeContainer(dimensions.width, dimensions.height, true, true);

            FileReader.parseFileContent(file, board, format, true, callback);

            selectionattr = Type.copyAttributes(attr, Options, 'board', 'selection');
	        board.selectionPolygon = board.create('polygon', [[0, 0], [0, 0], [0, 0], [0, 0]], selectionattr);

            board.renderer.drawZoomBar(board, attr.navbar);
            JXG.boards[board.id] = board;

            return board;
        },

        /**
         * Load a board from a base64 encoded string containing a construction made with either GEONExT,
         * Intergeo, Geogebra, or Cinderella.
         * @param {String} box HTML-ID to the HTML-element in which the board is painted.
         * @param {String} string base64 encoded string.
         * @param {String} format containing the file format: 'Geonext' or 'Intergeo'.
         * @param {Object} [attributes]
         * @returns {JXG.Board} Reference to the created board.
         * @see JXG.FileReader
         * @see JXG.GeonextReader
         * @see JXG.GeogebraReader
         * @see JXG.IntergeoReader
         * @see JXG.CinderellaReader
         */
        loadBoardFromString: function (box, string, format, attributes, callback) {
            var attr, renderer, dimensions, board,
                selectionattr;

            attributes = attributes || {};

            // merge attributes
            attr = Type.copyAttributes(attributes, Options, 'board');
            attr.zoom = Type.copyAttributes(attributes, Options, 'board', 'zoom');
            attr.pan = Type.copyAttributes(attributes, Options, 'board', 'pan');
            attr.selection = Type.copyAttributes(attr, Options, 'board', 'selection');
            attr.navbar = Type.copyAttributes(attr.navbar, Options, 'navbar');

            dimensions = Env.getDimensions(box, attr.document);
            renderer = this.initRenderer(box, dimensions, attr.document);

            /* User default parameters, in parse* the values in the gxt files are submitted to board */
            board = new Board(box, renderer, '', [150, 150], 1.0, 1.0, 50, 50, dimensions.width, dimensions.height, attr);
            board.initInfobox();
            board.resizeContainer(dimensions.width, dimensions.height, true, true);

            FileReader.parseString(string, board, format, true, callback);

            selectionattr = Type.copyAttributes(attr, Options, 'board', 'selection');
	        board.selectionPolygon = board.create('polygon', [[0, 0], [0, 0], [0, 0], [0, 0]], selectionattr);

            board.renderer.drawZoomBar(board, attr.navbar);
            JXG.boards[board.id] = board;

            return board;
        },

        /**
         * Delete a board and all its contents.
         * @param {JXG.Board,String} board HTML-ID to the DOM-element in which the board is drawn.
         */
        freeBoard: function (board) {
            var el;

            if (typeof board === 'string') {
                board = JXG.boards[board];
            }

            board.removeEventHandlers();
            board.suspendUpdate();

            // Remove all objects from the board.
            for (el in board.objects) {
                if (board.objects.hasOwnProperty(el)) {
                    board.objects[el].remove();
                }
            }

            // Remove all the other things, left on the board, XHTML save
            while (board.containerObj.firstChild) {
                board.containerObj.removeChild(board.containerObj.firstChild);
            }

            // Tell the browser the objects aren't needed anymore
            for (el in board.objects) {
                if (board.objects.hasOwnProperty(el)) {
                    delete board.objects[el];
                }
            }

            // Free the renderer and the algebra object
            delete board.renderer;

            // clear the creator cache
            board.jc.creator.clearCache();
            delete board.jc;

            // Finally remove the board itself from the boards array
            delete JXG.boards[board.id];
        },

        /**
         * @deprecated Use JXG#registerElement
         * @param element
         * @param creator
         */
        registerElement: function (element, creator) {
            JXG.deprecated('JXG.JSXGraph.registerElement()', 'JXG.registerElement()');
            JXG.registerElement(element, creator);
        }
    };

    // JessieScript/JessieCode startup: Search for script tags of type text/jessiescript and interprete them.
    if (Env.isBrowser && typeof window === 'object' && typeof document === 'object') {
        Env.addEvent(window, 'load', function () {
            var type, i, j, div, id, board, width, height, bbox, axis, grid, code,
                scripts = document.getElementsByTagName('script'),
                init = function (code, type, bbox) {
                    var board = JXG.JSXGraph.initBoard(id, {boundingbox: bbox, keepaspectratio: true, grid: grid, axis: axis, showReload: true});

                    if (type.toLowerCase().indexOf('script') > -1) {
                        board.construct(code);
                    } else {
                        try {
                            board.jc.parse(code);
                        } catch (e2) {
                            JXG.debug(e2);
                        }
                    }

                    return board;
                },
                makeReload = function (board, code, type, bbox) {
                    return function () {
                        var newBoard;

                        JXG.JSXGraph.freeBoard(board);
                        newBoard = init(code, type, bbox);
                        newBoard.reload = makeReload(newBoard, code, type, bbox);
                    };
                };

            for (i = 0; i < scripts.length; i++) {
                type = scripts[i].getAttribute('type', false);

                if (Type.exists(type) &&
                    (type.toLowerCase() === 'text/jessiescript' || type.toLowerCase() === 'jessiescript' ||
                     type.toLowerCase() === 'text/jessiecode' || type.toLowerCase() === 'jessiecode')) {
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
                    axis = Type.str2Bool(scripts[i].getAttribute('axis', false) || 'false');
                    grid = Type.str2Bool(scripts[i].getAttribute('grid', false) || 'false');

                    if (!Type.exists(id)) {
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
                        code = scripts[i].innerHTML;
                        code = code.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
                        scripts[i].innerHTML = code;

                        board = init(code, type, bbox);
                        board.reload = makeReload(board, code, type, bbox);
                    } else {
                        JXG.debug('JSXGraph: Apparently the div injection failed. Can\'t create a board, sorry.');
                    }
                }
            }
        }, window);
    }

    return JXG.JSXGraph;
});
