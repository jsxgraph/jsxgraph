/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, document:true, jQuery:true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 *
 */

import JXG from "./jxg.js";
import Env from "./utils/env.js";
import Type from "./utils/type.js";
// import Mat from "./math/math.js";
import Board from "./base/board.js";
import FileReader from "./reader/file.js";
import Options from "./options.js";
import SVGRenderer from "./renderer/svg.js";
import VMLRenderer from "./renderer/vml.js";
import CanvasRenderer from "./renderer/canvas.js";
import NoRenderer from "./renderer/no.js";

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
    })(),

    /**
     * Initialize the rendering engine
     *
     * @param  {String} box        id of or reference to the div element which hosts the JSXGraph construction
     * @param  {Object} dim        The dimensions of the board
     * @param  {Object} doc        Usually, this is document object of the browser window.  If false or null, this defaults
     * to the document object of the browser.
     * @param  {Object} attrRenderer Attribute 'renderer', specifies the rendering engine. Possible values are 'auto', 'svg',
     *  'canvas', 'no', and 'vml'.
     * @returns {Object}           Reference to the rendering engine object.
     * @private
     */
    initRenderer: function (box, dim, doc, attrRenderer) {
        var boxid, renderer;

        // Former version:
        // doc = doc || document
        if ((!Type.exists(doc) || doc === false) && typeof document === 'object') {
            doc = document;
        }

        if (typeof doc === "object" && box !== null) {
            boxid = (Type.isString(box)) ? doc.getElementById(box) : box;

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
     * Merge the user supplied attributes with the attributes in options.js
     *
     * @param {Object} attributes User supplied attributes
     * @returns {Object} Merged attributes for the board
     *
     * @private
     */
    _setAttributes: function (attributes, options) {
        // merge attributes
        var attr = Type.copyAttributes(attributes, options, 'board'),

            // These attributes - which are objects - have to be copied separately.
            list = [
                'drag', 'fullscreen',
                'intl',
                'keyboard', 'logging',
                'pan', 'resize',
                'screenshot', 'selection',
                'zoom'
            ],
            len = list.length, i, key;

        for (i = 0; i < len; i++) {
            key = list[i];
            attr[key] = Type.copyAttributes(attr, options, 'board', key);
        }
        attr.navbar = Type.copyAttributes(attr.navbar, options, 'navbar');

        // Treat moveTarget separately, because deepCopy will not work here.
        // Reason: moveTarget will be an HTML node and it is prevented that Type.deepCopy will copy it.
        attr.movetarget =
            attributes.moveTarget || attributes.movetarget || options.board.moveTarget;

        return attr;
    },

    /**
     * Further initialization of the board. Set some properties from attribute values.
     *
     * @param {JXG.Board} board
     * @param {Object} attr attributes object
     * @param {Object} dimensions Object containing dimensions of the canvas
     *
     * @private
     */
    _fillBoard: function (board, attr, dimensions) {
        board.initInfobox(attr.infobox);
        board.maxboundingbox = attr.maxboundingbox;
        board.resizeContainer(dimensions.width, dimensions.height, true, true);
        board._createSelectionPolygon(attr);
        board.renderer.drawNavigationBar(board, attr.navbar);
        JXG.boards[board.id] = board;
    },

    /**
     *
     * @param {String|Object} container id of or reference to the HTML element in which the board is painted.
     * @param {Object} attr An object that sets some of the board properties.
     *
     * @private
     */
    _setARIA: function (container, attr) {
        var doc = attr.document,
            node_jsx;
            // Unused variables, made obsolete in db3e50f4dfa8b86b1ff619b578e243a97b41151c
            // doc_glob,
            // newNode,
            // parent,
            // id_label,
            // id_description;

            if (typeof doc !== 'object') {
                if (!Env.isBrowser) {
                    return;
                }
                doc = document;
            }

        node_jsx = (Type.isString(container)) ? doc.getElementById(container) : container;
        node_jsx.setAttribute("role", 'region');
        node_jsx.setAttribute("aria-label", attr.title);              // set by initBoard( {title:})

        // doc_glob = node_jsx.ownerDocument; // This is the window.document element, needed below.
        // parent = node_jsx.parentNode;

    },

    /**
     * Remove the two corresponding ARIA divs when freeing a board
     *
     * @param {JXG.Board} board
     *
     * @private
     */
    _removeARIANodes: function (board) {
        var node, id, doc;

        doc = board.document || document;
        if (typeof doc !== 'object') {
            return;
        }

        id = board.containerObj.getAttribute("aria-labelledby");
        node = doc.getElementById(id);
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
        id = board.containerObj.getAttribute("aria-describedby");
        node = doc.getElementById(id);
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    },

    /**
     * Initialize a new board.
     *
     * @param {String|Object} box id of or reference to the HTML element in which the board is painted.
     * @param {Object} attributes An object that sets some of the board properties.
     * See {@link JXG.Board} for a list of available attributes of the board.
     * Most of these attributes can also be set via {@link JXG.Options},
     *
     * @returns {JXG.Board} Reference to the created board.
     *
     * @see JXG.AbstractRenderer#drawNavigationBar
     * @example
     * var board = JXG.JSXGraph.initBoard('jxgbox', {
     *     boundingbox: [-10, 5, 10, -5],
     *     keepaspectratio: false,
     *     axis: true
     * });
     *
     * </pre><div id="JXGc0f76e98-20bc-4224-9016-7ffa10770dff" class="jxgbox" style="width: 600px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGc0f76e98-20bc-4224-9016-7ffa10770dff', {
     *         boundingbox: [-10, 5, 10, -5],
     *         keepaspectratio: false,
     *         axis: true
     *     });
     *
     *     })();
     *
     * </script><pre>
     *
     *
     * @example
     * const board = JXG.JSXGraph.initBoard('jxgbox', {
     *   boundingbox: [-10, 10, 10, -10],
     *   axis: true,
     *   showCopyright: true,
     *   showFullscreen: true,
     *   showScreenshot: false,
     *   showClearTraces: false,
     *   showInfobox: false,
     *   showNavigation: true,
     *   grid: false,
     *   defaultAxes: {
     *     x: {
     *       withLabel: true,
     *       label: {
     *         position: '95% left',
     *         offset: [-10, 10]
     *       },
     *       lastArrow: {
     *         type: 4,
     *         size: 10
     *       }
     *     },
     *     y: {
     *       withLabel: true,
     *       label: {
     *         position: '0.90fr right',
     *         offset: [6, -6]
     *       },
     *       lastArrow: {
     *         type: 4,
     *         size: 10
     *       }
     *     }
     *   }
     * });
     *
     * </pre><div id="JXG4ced167d-3235-48bc-84e9-1a28fce00f6a" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG4ced167d-3235-48bc-84e9-1a28fce00f6a', {
     *       boundingbox: [-10, 10, 10, -10],
     *       axis: true,
     *       showCopyright: true,
     *       showFullscreen: true,
     *       showScreenshot: false,
     *       showClearTraces: false,
     *       showInfobox: false,
     *       showNavigation: true,
     *       grid: false,
     *       defaultAxes: {
     *         x: {
     *           withLabel: true,
     *           label: {
     *             position: '95% left',
     *             offset: [0, 0]
     *           },
     *           lastArrow: {
     *             type: 4,
     *             size: 10
     *           }
     *         },
     *         y: {
     *           withLabel: true,
     *           label: {
     *             position: '0.90fr right',
     *             offset: [0, 0]
     *           },
     *           lastArrow: {
     *             type: 4,
     *             size: 10
     *           }
     *         }
     *       }
     *     });
     *
     *     })();
     *
     * </script><pre>
     * @example
     * const board = JXG.JSXGraph.initBoard('jxgbox', {
     *     boundingbox: [-5, 5, 5, -5],
     *     intl: {
     *         enabled: false,
     *         locale: 'en-EN'
     *     },
     *     keepaspectratio: true,
     *     axis: true,
     *     defaultAxes: {
     *         x: {
     *             ticks: {
     *                 intl: {
     *                         enabled: true,
     *                         options: {
     *                             style: 'unit',
     *                             unit: 'kilometer-per-hour',
     *                             unitDisplay: 'narrow'
     *                         }
     *                 }
     *             }
     *         },
     *         y: {
     *             ticks: {
     *             }
     *         }
     *     },
     *     infobox: {
     *         fontSize: 20,
     *         intl: {
     *             enabled: true,
     *             options: {
     *                 minimumFractionDigits: 4,
     *                 maximumFractionDigits: 5
     *             }
     *         }
     *     }
     * });
     *
     * </pre><div id="JXGdac54e59-f1e8-4fa6-bbcc-7486f7f6f960" class="jxgbox" style="width: 600px; height: 600px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXGdac54e59-f1e8-4fa6-bbcc-7486f7f6f960', {
     *         boundingbox: [-5, 5, 5, -5],
     *         intl: {
     *             enabled: false,
     *             locale: 'en-EN'
     *         },
     *         keepaspectratio: true,
     *         axis: true,
     *         defaultAxes: {
     *             x: {
     *                 ticks: {
     *                     intl: {
     *                             enabled: true,
     *                             options: {
     *                                 style: 'unit',
     *                                 unit: 'kilometer-per-hour',
     *                                 unitDisplay: 'narrow'
     *                             }
     *                     }
     *                 }
     *             },
     *             y: {
     *                 ticks: {
     *                 }
     *             }
     *         },
     *         infobox: {
     *             fontSize: 20,
     *             intl: {
     *                 enabled: true,
     *                 options: {
     *                     minimumFractionDigits: 4,
     *                     maximumFractionDigits: 5
     *                 }
     *             }
     *         }
     *     });
     *
     *     })();
     *
     * </script><pre>
     *
     *
     */
    //  *
    //  * @param {Array} [attributes.boundingbox=[-5, 5, 5, -5]] An array containing four numbers describing the left, top, right and bottom boundary of the board in user coordinates
    //  * @param {Boolean} [attributes.keepaspectratio=false] If <tt>true</tt>, the bounding box is adjusted to the same aspect ratio as the aspect ratio of the div containing the board.
    //  * @param {Boolean} [attributes.showCopyright=false] Show the copyright string in the top left corner.
    //  * @param {Boolean} [attributes.showNavigation=false] Show the navigation buttons in the bottom right corner.
    //  * @param {Object} [attributes.zoom] Allow the user to zoom with the mouse wheel or the two-fingers-zoom gesture.
    //  * @param {Object} [attributes.pan] Allow the user to pan with shift+drag mouse or two-fingers-pan gesture.
    //  * @param {Object} [attributes.drag] Allow the user to drag objects with a pointer device.
    //  * @param {Object} [attributes.keyboard] Allow the user to drag objects with arrow keys on keyboard.
    //  * @param {Boolean} [attributes.axis=false] If set to true, show the axis. Can also be set to an object that is given to both axes as an attribute object.
    //  * @param {Boolean|Object} [attributes.grid] If set to true, shows the grid. Can also be set to an object that is given to the grid as its attribute object.
    //  * @param {Boolean} [attributes.registerEvents=true] Register mouse / touch events.
    initBoard: function (box, attributes) {
        var originX, originY, unitX, unitY, w, h,
            offX = 0, offY = 0,
            renderer, dimensions, bbox,
            attr, axattr, axattr_x, axattr_y,
            options,
            theme = {},
            board;

        attributes = attributes || {};
        // Merge a possible theme
        if (attributes.theme !== 'default' && Type.exists(JXG.themes[attributes.theme])) {
            theme = JXG.themes[attributes.theme];
        }
        options = Type.deepCopy(Options, theme, true);
        attr = this._setAttributes(attributes, options);

        dimensions = Env.getDimensions(box, attr.document);

        if (attr.unitx || attr.unity) {
            originX = Type.def(attr.originx, 150);
            originY = Type.def(attr.originy, 150);
            unitX = Type.def(attr.unitx, 50);
            unitY = Type.def(attr.unity, 50);
        } else {
            bbox = attr.boundingbox;
            if (bbox[0] < attr.maxboundingbox[0]) {
                bbox[0] = attr.maxboundingbox[0];
            }
            if (bbox[1] > attr.maxboundingbox[1]) {
                bbox[1] = attr.maxboundingbox[1];
            }
            if (bbox[2] > attr.maxboundingbox[2]) {
                bbox[2] = attr.maxboundingbox[2];
            }
            if (bbox[3] < attr.maxboundingbox[3]) {
                bbox[3] = attr.maxboundingbox[3];
            }

            // Size of HTML div.
            // If zero, the size is set to a small value to avoid
            // division by zero.
            // w = Math.max(parseInt(dimensions.width, 10), Mat.eps);
            // h = Math.max(parseInt(dimensions.height, 10), Mat.eps);
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
                    unitY = (Math.abs(unitX) * unitY) / Math.abs(unitY);
                    // Add the additional units in equal portions above and below
                    offY = (h / unitY - (bbox[1] - bbox[3])) * 0.5;
                } else {
                    unitX = (Math.abs(unitY) * unitX) / Math.abs(unitX);
                    // Add the additional units in equal portions left and right
                    offX = (w / unitX - (bbox[2] - bbox[0])) * 0.5;
                }
            } else {
                unitX = w / (bbox[2] - bbox[0]);
                unitY = h / (bbox[1] - bbox[3]);
            }
            originX = -unitX * (bbox[0] - offX);
            originY = unitY * (bbox[1] + offY);
        }

        renderer = this.initRenderer(box, dimensions, attr.document, attr.renderer);
        this._setARIA(box, attr);

        // Create the board.
        // board.options will contain the user supplied board attributes
        board = new Board(
            box,
            renderer,
            attr.id,
            [originX, originY],
            /*attr.zoomfactor * */ attr.zoomx,
            /*attr.zoomfactor * */ attr.zoomy,
            unitX,
            unitY,
            dimensions.width,
            dimensions.height,
            attr
        );

        board.keepaspectratio = attr.keepaspectratio;

        this._fillBoard(board, attr, dimensions);

        // Create elements like axes, grid, navigation, ...
        board.suspendUpdate();
        attr = board.attr;
        if (attr.axis) {
            axattr = typeof attr.axis === "object" ? attr.axis : {};

            // The defaultAxes attributes are overwritten by user supplied axis object.
            axattr_x = Type.deepCopy(options.board.defaultaxes.x, axattr);
            axattr_y = Type.deepCopy(options.board.defaultaxes.y, axattr);

            // The user supplied defaultAxes attributes are merged in.
            if (attr.defaultaxes.x) {
                axattr_x = Type.deepCopy(axattr_x, attr.defaultaxes.x);
            }
            if (attr.defaultaxes.y) {
                axattr_y = Type.deepCopy(axattr_y, attr.defaultaxes.y);
            }

            board.defaultAxes = {};
            board.defaultAxes.x = board.create("axis", [[0, 0], [1, 0]], axattr_x);
            board.defaultAxes.y = board.create("axis", [[0, 0], [0, 1]], axattr_y);
        }
        if (attr.grid) {
            board.create("grid", [], typeof attr.grid === "object" ? attr.grid : {});
        }
        board.unsuspendUpdate();

        return board;
    },

    /**
     * Load a board from a file containing a construction made with either GEONExT,
     * Intergeo, Geogebra, or Cinderella.
     * @param {String|Object} box id of or reference to the HTML element in which the board is painted.
     * @param {String} file base64 encoded string.
     * @param {String} format containing the file format: 'Geonext' or 'Intergeo'.
     * @param {Object} attributes Attributes for the board and 'encoding'.
     *  Compressed files need encoding 'iso-8859-1'. Otherwise it probably is 'utf-8'.
     * @param {Function} callback
     * @returns {JXG.Board} Reference to the created board.
     * @see JXG.FileReader
     * @see JXG.GeonextReader
     * @see JXG.GeogebraReader
     * @see JXG.IntergeoReader
     * @see JXG.CinderellaReader
     *
     * @example
     * // Uncompressed file
     * var board = JXG.JSXGraph.loadBoardFromFile('jxgbox', 'filename', 'geonext',
     *      {encoding: 'utf-8'},
     *      function (board) { console.log("Done loading"); }
     * );
     * // Compressed file
     * var board = JXG.JSXGraph.loadBoardFromFile('jxgbox', 'filename', 'geonext',
     *      {encoding: 'iso-8859-1'},
     *      function (board) { console.log("Done loading"); }
     * );
     *
     * @example
     * // From <input type="file" id="localfile" />
     * var file = document.getElementById('localfile').files[0];
     * JXG.JSXGraph.loadBoardFromFile('jxgbox', file, 'geonext',
     *      {encoding: 'utf-8'},
     *      function (board) { console.log("Done loading"); }
     * );
     */
    loadBoardFromFile: function (box, file, format, attributes, callback) {
        var attr, renderer, board, dimensions, encoding;

        attributes = attributes || {};
        attr = this._setAttributes(attributes);

        dimensions = Env.getDimensions(box, attr.document);
        renderer = this.initRenderer(box, dimensions, attr.document, attr.renderer);
        this._setARIA(box, attr);

        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        board = new Board(
            box,
            renderer,
            "",
            [150, 150],
            1,
            1,
            50,
            50,
            dimensions.width,
            dimensions.height,
            attr
        );
        this._fillBoard(board, attr, dimensions);
        encoding = attr.encoding || "iso-8859-1";
        FileReader.parseFileContent(file, board, format, true, encoding, callback);

        return board;
    },

    /**
     * Load a board from a base64 encoded string containing a construction made with either GEONExT,
     * Intergeo, Geogebra, or Cinderella.
     * @param {String|Object} box id of or reference to the HTML element in which the board is painted.
     * @param {String} string base64 encoded string.
     * @param {String} format containing the file format: 'Geonext', 'Intergeo', 'Geogebra'.
     * @param {Object} attributes Attributes for the board and 'encoding'.
     *  Compressed files need encoding 'iso-8859-1'. Otherwise it probably is 'utf-8'.
     * @param {Function} callback
     * @returns {JXG.Board} Reference to the created board.
     * @see JXG.FileReader
     * @see JXG.GeonextReader
     * @see JXG.GeogebraReader
     * @see JXG.IntergeoReader
     * @see JXG.CinderellaReader
     */
    loadBoardFromString: function (box, string, format, attributes, callback) {
        var attr, renderer, board, dimensions;

        attributes = attributes || {};
        attr = this._setAttributes(attributes);

        dimensions = Env.getDimensions(box, attr.document);
        renderer = this.initRenderer(box, dimensions, attr.document, attr.renderer);
        this._setARIA(box, attr);

        /* User default parameters, in parse* the values in the gxt files are submitted to board */
        board = new Board(
            box,
            renderer,
            "",
            [150, 150],
            1.0,
            1.0,
            50,
            50,
            dimensions.width,
            dimensions.height,
            attr
        );
        this._fillBoard(board, attr, dimensions);
        FileReader.parseString(string, board, format, true, callback);

        return board;
    },

    /**
     * Delete a board and all its contents.
     * @param {JXG.Board|String} board id of or reference to the DOM element in which the board is drawn.
     *
     */
    freeBoard: function (board) {
        var el;

        if (typeof board === 'string') {
            board = JXG.boards[board];
        }

        this._removeARIANodes(board);
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
        JXG.deprecated("JXG.JSXGraph.registerElement()", "JXG.registerElement()");
        JXG.registerElement(element, creator);
    }
};

// JessieScript/JessieCode startup:
// Search for script tags of type text/jessiecode and execute them.
if (Env.isBrowser && typeof window === 'object' && typeof document === 'object') {
    Env.addEvent(window, 'load',
        function () {
            var type, i, j, div, id,
                board, txt, width, height, maxWidth, aspectRatio,
                cssClasses, bbox, axis, grid, code, src, request,
                postpone = false,

                scripts = document.getElementsByTagName('script'),
                init = function (code, type, bbox) {
                    var board = JXG.JSXGraph.initBoard(id, {
                        boundingbox: bbox,
                        keepaspectratio: true,
                        grid: grid,
                        axis: axis,
                        showReload: true
                    });

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
                type = scripts[i].getAttribute("type", false);

                if (
                    Type.exists(type) &&
                    (type.toLowerCase() === "text/jessiescript" ||
                        type.toLowerCase() === "jessiescript" ||
                        type.toLowerCase() === "text/jessiecode" ||
                        type.toLowerCase() === 'jessiecode')
                ) {
                    cssClasses = scripts[i].getAttribute("class", false) || "";
                    width = scripts[i].getAttribute("width", false) || "";
                    height = scripts[i].getAttribute("height", false) || "";
                    maxWidth = scripts[i].getAttribute("maxwidth", false) || "100%";
                    aspectRatio = scripts[i].getAttribute("aspectratio", false) || "1/1";
                    bbox = scripts[i].getAttribute("boundingbox", false) || "-5, 5, 5, -5";
                    id = scripts[i].getAttribute("container", false);
                    src = scripts[i].getAttribute("src", false);

                    bbox = bbox.split(",");
                    if (bbox.length !== 4) {
                        bbox = [-5, 5, 5, -5];
                    } else {
                        for (j = 0; j < bbox.length; j++) {
                            bbox[j] = parseFloat(bbox[j]);
                        }
                    }
                    axis = Type.str2Bool(scripts[i].getAttribute("axis", false) || 'false');
                    grid = Type.str2Bool(scripts[i].getAttribute("grid", false) || 'false');

                    if (!Type.exists(id)) {
                        id = "jessiescript_autgen_jxg_" + i;
                        div = document.createElement('div');
                        div.setAttribute("id", id);

                        txt = width !== "" ? "width:" + width + ";" : "";
                        txt += height !== "" ? "height:" + height + ";" : "";
                        txt += maxWidth !== "" ? "max-width:" + maxWidth + ";" : "";
                        txt += aspectRatio !== "" ? "aspect-ratio:" + aspectRatio + ";" : "";

                        div.setAttribute("style", txt);
                        div.setAttribute("class", "jxgbox " + cssClasses);
                        try {
                            document.body.insertBefore(div, scripts[i]);
                        } catch (e) {
                            // there's probably jquery involved...
                            if (Type.exists(jQuery) && typeof jQuery === 'object') {
                                jQuery(div).insertBefore(scripts[i]);
                            }
                        }
                    } else {
                        div = document.getElementById(id);
                    }

                    code = "";

                    if (Type.exists(src)) {
                        postpone = true;
                        request = new XMLHttpRequest();
                        request.open("GET", src);
                        request.overrideMimeType("text/plain; charset=x-user-defined");
                        /* jshint ignore:start */
                        request.addEventListener("load", function () {
                            if (this.status < 400) {
                                code = this.responseText + "\n" + code;
                                board = init(code, type, bbox);
                                board.reload = makeReload(board, code, type, bbox);
                            } else {
                                throw new Error(
                                    "\nJSXGraph: failed to load file",
                                    src,
                                    ":",
                                    this.responseText
                                );
                            }
                        });
                        request.addEventListener("error", function (e) {
                            throw new Error("\nJSXGraph: failed to load file", src, ":", e);
                        });
                        /* jshint ignore:end */
                        request.send();
                    } else {
                        postpone = false;
                    }

                    if (document.getElementById(id)) {
                        code = scripts[i].innerHTML;
                        code = code.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "");
                        scripts[i].innerHTML = code;

                        if (!postpone) {
                            // Do no wait for data from "src" attribute
                            board = init(code, type, bbox);
                            board.reload = makeReload(board, code, type, bbox);
                        }
                    } else {
                        JXG.debug(
                            "JSXGraph: Apparently the div injection failed. Can't create a board, sorry."
                        );
                    }
                }
            }
        },
        window
    );
}

export default JXG.JSXGraph;
