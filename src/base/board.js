/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, window: true, document: true, init: true, translateASCIIMath: true, google: true*/

/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 options
 math/numerics
 math/math
 math/geometry
 math/complex
 parser/jessiecode
 parser/geonext
 utils/color
 utils/type
 utils/event
 utils/env
  elements:
   transform
   point
   line
   text
   grid
 */

/**
 * @fileoverview The JXG.Board class is defined in this file. JXG.Board controls all properties and methods
 * used to manage a geonext board like managing geometric elements, managing mouse and touch events, etc.
 */

define([
    'jxg', 'base/constants', 'base/coords', 'options', 'math/numerics', 'math/math', 'math/geometry', 'math/complex',
    'parser/jessiecode', 'parser/geonext', 'utils/color', 'utils/type', 'utils/event', 'utils/env', 'base/transformation',
    'base/point', 'base/line', 'base/text', 'element/composition', 'base/composition'
], function (JXG, Const, Coords, Options, Numerics, Mat, Geometry, Complex, JessieCode, GeonextParser, Color, Type,
                EventEmitter, Env, Transform, Point, Line, Text, Composition, EComposition) {

    'use strict';

    /**
     * Constructs a new Board object.
     * @class JXG.Board controls all properties and methods used to manage a geonext board like managing geometric
     * elements, managing mouse and touch events, etc. You probably don't want to use this constructor directly.
     * Please use {@link JXG.JSXGraph#initBoard} to initialize a board.
     * @constructor
     * @param {String} container The id or reference of the HTML DOM element the board is drawn in. This is usually a HTML div.
     * @param {JXG.AbstractRenderer} renderer The reference of a renderer.
     * @param {String} id Unique identifier for the board, may be an empty string or null or even undefined.
     * @param {JXG.Coords} origin The coordinates where the origin is placed, in user coordinates.
     * @param {Number} zoomX Zoom factor in x-axis direction
     * @param {Number} zoomY Zoom factor in y-axis direction
     * @param {Number} unitX Units in x-axis direction
     * @param {Number} unitY Units in y-axis direction
     * @param {Number} canvasWidth  The width of canvas
     * @param {Number} canvasHeight The height of canvas
     * @param {Object} attributes The attributes object given to {@link JXG.JSXGraph#initBoard}
     * @borrows JXG.EventEmitter#on as this.on
     * @borrows JXG.EventEmitter#off as this.off
     * @borrows JXG.EventEmitter#triggerEventHandlers as this.triggerEventHandlers
     * @borrows JXG.EventEmitter#eventHandlers as this.eventHandlers
     */
    JXG.Board = function (container, renderer, id, origin, zoomX, zoomY, unitX, unitY, canvasWidth, canvasHeight, attributes) {
        /**
         * Board is in no special mode, objects are highlighted on mouse over and objects may be
         * clicked to start drag&drop.
         * @type Number
         * @constant
         */
        this.BOARD_MODE_NONE = 0x0000;

        /**
         * Board is in drag mode, objects aren't highlighted on mouse over and the object referenced in
         * {JXG.Board#mouse} is updated on mouse movement.
         * @type Number
         * @constant
         * @see JXG.Board#drag_obj
         */
        this.BOARD_MODE_DRAG = 0x0001;

        /**
         * In this mode a mouse move changes the origin's screen coordinates.
         * @type Number
         * @constant
         */
        this.BOARD_MODE_MOVE_ORIGIN = 0x0002;

        /**
         * Update is made with low quality, e.g. graphs are evaluated at a lesser amount of points.
         * @type Number
         * @constant
         * @see JXG.Board#updateQuality
         */
        this.BOARD_QUALITY_LOW = 0x1;

        /**
         * Update is made with high quality, e.g. graphs are evaluated at much more points.
         * @type Number
         * @constant
         * @see JXG.Board#updateQuality
         */
        this.BOARD_QUALITY_HIGH = 0x2;

        /**
         * Update is made with high quality, e.g. graphs are evaluated at much more points.
         * @type Number
         * @constant
         * @see JXG.Board#updateQuality
         */
        this.BOARD_MODE_ZOOM = 0x0011;

        /**
         * Pointer to the document element containing the board.
         * @type Object
         */
        // Former version:
        // this.document = attributes.document || document;
        if (Type.exists(attributes.document) && attributes.document !== false) {
            this.document = attributes.document;
        } else if (typeof document === 'object') {
            this.document = document;
        }

        /**
         * The html-id of the html element containing the board.
         * @type String
         */
        this.container = container;

        /**
         * Pointer to the html element containing the board.
         * @type Object
         */
        this.containerObj = (Env.isBrowser ? this.document.getElementById(this.container) : null);

        if (Env.isBrowser && this.containerObj === null) {
            throw new Error("\nJSXGraph: HTML container element '" + container + "' not found.");
        }

        /**
         * A reference to this boards renderer.
         * @type JXG.AbstractRenderer
         */
        this.renderer = renderer;

        /**
         * Grids keeps track of all grids attached to this board.
         */
        this.grids = [];

        /**
         * Some standard options
         * @type JXG.Options
         */
        this.options = Type.deepCopy(Options);
        this.attr = attributes;

        /**
         * Dimension of the board.
         * @default 2
         * @type Number
         */
        this.dimension = 2;

        this.jc = new JessieCode();
        this.jc.use(this);

        /**
         * Coordinates of the boards origin. This a object with the two properties
         * usrCoords and scrCoords. usrCoords always equals [1, 0, 0] and scrCoords
         * stores the boards origin in homogeneous screen coordinates.
         * @type Object
         */
        this.origin = {};
        this.origin.usrCoords = [1, 0, 0];
        this.origin.scrCoords = [1, origin[0], origin[1]];

        /**
         * Zoom factor in X direction. It only stores the zoom factor to be able
         * to get back to 100% in zoom100().
         * @type Number
         */
        this.zoomX = zoomX;

        /**
         * Zoom factor in Y direction. It only stores the zoom factor to be able
         * to get back to 100% in zoom100().
         * @type Number
         */
        this.zoomY = zoomY;

        /**
         * The number of pixels which represent one unit in user-coordinates in x direction.
         * @type Number
         */
        this.unitX = unitX * this.zoomX;

        /**
         * The number of pixels which represent one unit in user-coordinates in y direction.
         * @type Number
         */
        this.unitY = unitY * this.zoomY;

        /**
         * Keep aspect ratio if bounding box is set and the width/height ratio differs from the 
         * width/height ratio of the canvas.
         */
        this.keepaspectratio = false;

        /**
         * Canvas width.
         * @type Number
         */
        this.canvasWidth = canvasWidth;

        /**
         * Canvas Height
         * @type Number
         */
        this.canvasHeight = canvasHeight;

        // If the given id is not valid, generate an unique id
        if (Type.exists(id) && id !== '' && Env.isBrowser && !Type.exists(this.document.getElementById(id))) {
            this.id = id;
        } else {
            this.id = this.generateId();
        }

        EventEmitter.eventify(this);

        this.hooks = [];

        /**
         * An array containing all other boards that are updated after this board has been updated.
         * @type Array
         * @see JXG.Board#addChild
         * @see JXG.Board#removeChild
         */
        this.dependentBoards = [];

        /**
         * During the update process this is set to false to prevent an endless loop.
         * @default false
         * @type Boolean
         */
        this.inUpdate = false;

        /**
         * An associative array containing all geometric objects belonging to the board. Key is the id of the object and value is a reference to the object.
         * @type Object
         */
        this.objects = {};

        /**
         * An array containing all geometric objects on the board in the order of construction.
         * @type {Array}
         */
        this.objectsList = [];

        /**
         * An associative array containing all groups belonging to the board. Key is the id of the group and value is a reference to the object.
         * @type Object
         */
        this.groups = {};

        /**
         * Stores all the objects that are currently running an animation.
         * @type Object
         */
        this.animationObjects = {};

        /**
         * An associative array containing all highlighted elements belonging to the board.
         * @type Object
         */
        this.highlightedObjects = {};

        /**
         * Number of objects ever created on this board. This includes every object, even invisible and deleted ones.
         * @type Number
         */
        this.numObjects = 0;

        /**
         * An associative array to store the objects of the board by name. the name of the object is the key and value is a reference to the object.
         * @type Object
         */
        this.elementsByName = {};

        /**
         * The board mode the board is currently in. Possible values are
         * <ul>
         * <li>JXG.Board.BOARD_MODE_NONE</li>
         * <li>JXG.Board.BOARD_MODE_DRAG</li>
         * <li>JXG.Board.BOARD_MODE_MOVE_ORIGIN</li>
         * </ul>
         * @type Number
         */
        this.mode = this.BOARD_MODE_NONE;

        /**
         * The update quality of the board. In most cases this is set to {@link JXG.Board#BOARD_QUALITY_HIGH}.
         * If {@link JXG.Board#mode} equals {@link JXG.Board#BOARD_MODE_DRAG} this is set to
         * {@link JXG.Board#BOARD_QUALITY_LOW} to speed up the update process by e.g. reducing the number of
         * evaluation points when plotting functions. Possible values are
         * <ul>
         * <li>BOARD_QUALITY_LOW</li>
         * <li>BOARD_QUALITY_HIGH</li>
         * </ul>
         * @type Number
         * @see JXG.Board#mode
         */
        this.updateQuality = this.BOARD_QUALITY_HIGH;

        /**
         * If true updates are skipped.
         * @type Boolean
         */
        this.isSuspendedRedraw = false;

        this.calculateSnapSizes();

        /**
         * The distance from the mouse to the dragged object in x direction when the user clicked the mouse button.
         * @type Number
         * @see JXG.Board#drag_dy
         * @see JXG.Board#drag_obj
         */
        this.drag_dx = 0;

        /**
         * The distance from the mouse to the dragged object in y direction when the user clicked the mouse button.
         * @type Number
         * @see JXG.Board#drag_dx
         * @see JXG.Board#drag_obj
         */
        this.drag_dy = 0;

        /**
         * The last position where a drag event has been fired.
         * @type Array
         * @see JXG.Board#moveObject
         */
        this.drag_position = [0, 0];

        /**
         * References to the object that is dragged with the mouse on the board.
         * @type {@link JXG.GeometryElement}.
         * @see {JXG.Board#touches}
         */
        this.mouse = {};

        /**
         * Keeps track on touched elements, like {@link JXG.Board#mouse} does for mouse events.
         * @type Array
         * @see {JXG.Board#mouse}
         */
        this.touches = [];

        /**
         * A string containing the XML text of the construction. This is set in {@link JXG.FileReader#parseString}.
         * Only useful if a construction is read from a GEONExT-, Intergeo-, Geogebra-, or Cinderella-File.
         * @type String
         */
        this.xmlString = '';

        /**
         * Cached result of getCoordsTopLeftCorner for touch/mouseMove-Events to save some DOM operations.
         * @type Array
         */
        this.cPos = [];

        /**
         * Contains the last time (epoch, msec) since the last touchMove event which was not thrown away or since
         * touchStart because Android's Webkit browser fires too much of them.
         * @type Number
         */
        this.touchMoveLast = 0;

        /**
         * Contains the last time (epoch, msec) since the last getCoordsTopLeftCorner call which was not thrown away.
         * @type Number
         */
        this.positionAccessLast = 0;

        /**
         * Collects all elements that triggered a mouse down event.
         * @type Array
         */
        this.downObjects = [];

        if (this.attr.showcopyright) {
            this.renderer.displayCopyright(Const.licenseText, parseInt(this.options.text.fontSize, 10));
        }

        /**
         * Full updates are needed after zoom and axis translates. This saves some time during an update.
         * @default false
         * @type Boolean
         */
        this.needsFullUpdate = false;

        /**
         * If reducedUpdate is set to true then only the dragged element and few (e.g. 2) following
         * elements are updated during mouse move. On mouse up the whole construction is
         * updated. This enables us to be fast even on very slow devices.
         * @type Boolean
         * @default false
         */
        this.reducedUpdate = false;

        /**
         * The current color blindness deficiency is stored in this property. If color blindness is not emulated
         * at the moment, it's value is 'none'.
         */
        this.currentCBDef = 'none';

        /**
         * If GEONExT constructions are displayed, then this property should be set to true.
         * At the moment there should be no difference. But this may change.
         * This is set in {@link JXG.GeonextReader#readGeonext}.
         * @type Boolean
         * @default false
         * @see JXG.GeonextReader#readGeonext
         */
        this.geonextCompatibilityMode = false;

        if (this.options.text.useASCIIMathML && translateASCIIMath) {
            init();
        } else {
            this.options.text.useASCIIMathML = false;
        }

        /**
         * A flag which tells if the board registers mouse events.
         * @type Boolean
         * @default false
         */
        this.hasMouseHandlers = false;

        /**
         * A flag which tells if the board registers touch events.
         * @type Boolean
         * @default false
         */
        this.hasTouchHandlers = false;

        /**
         * A flag which stores if the board registered pointer events.
         * @type {Boolean}
         * @default false
         */
        this.hasPointerHandlers = false;

        /**
         * This bool flag stores the current state of the mobile Safari specific gesture event handlers.
         * @type {boolean}
         * @default false
         */
        this.hasGestureHandlers = false;

        /**
         * A flag which tells if the board the JXG.Board#mouseUpListener is currently registered.
         * @type Boolean
         * @default false
         */
        this.hasMouseUp = false;

        /**
         * A flag which tells if the board the JXG.Board#touchEndListener is currently registered.
         * @type Boolean
         * @default false
         */
        this.hasTouchEnd = false;

        /**
         * A flag which tells us if the board has a pointerUp event registered at the moment.
         * @type {Boolean}
         * @default false
         */
        this.hasPointerUp = false;

        if (this.attr.registerevents) {
            this.addEventHandlers();
        }

        this.methodMap = {
            update: 'update',
            fullUpdate: 'fullUpdate',
            on: 'on',
            off: 'off',
            trigger: 'trigger',
            setView: 'setBoundingBox',
            setBoundingBox: 'setBoundingBox',
            migratePoint: 'migratePoint',
            colorblind: 'emulateColorblindness',
            suspendUpdate: 'suspendUpdate',
            unsuspendUpdate: 'unsuspendUpdate',
            clearTraces: 'clearTraces',
            left: 'clickLeftArrow',
            right: 'clickRightArrow',
            up: 'clickUpArrow',
            down: 'clickDownArrow',
            zoomIn: 'zoomIn',
            zoomOut: 'zoomOut',
            zoom100: 'zoom100',
            zoomElements: 'zoomElements',
            remove: 'removeObject',
            removeObject: 'removeObject'
        };
    };

    JXG.extend(JXG.Board.prototype, /** @lends JXG.Board.prototype */ {

        /**
         * Generates an unique name for the given object. The result depends on the objects type, if the
         * object is a {@link JXG.Point}, capital characters are used, if it is of type {@link JXG.Line}
         * only lower case characters are used. If object is of type {@link JXG.Polygon}, a bunch of lower
         * case characters prefixed with P_ are used. If object is of type {@link JXG.Circle} the name is
         * generated using lower case characters. prefixed with k_ is used. In any other case, lower case
         * chars prefixed with s_ is used.
         * @param {Object} object Reference of an JXG.GeometryElement that is to be named.
         * @returns {String} Unique name for the object.
         */
        generateName: function (object) {
            var possibleNames, i, j,
                maxNameLength = 2,
                pre = '',
                post = '',
                indices = [],
                name = '';

            if (object.type === Const.OBJECT_TYPE_TICKS) {
                return '';
            }

            if (Type.isPoint(object)) {
                // points have capital letters
                possibleNames = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            } else if (object.type === Const.OBJECT_TYPE_ANGLE) {
                possibleNames = ['', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;',
                    '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;',
                    '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;'];
            } else {
                // all other elements get lowercase labels
                possibleNames = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
            }

            if (!Type.isPoint(object) &&
                    object.elementClass !== Const.OBJECT_CLASS_LINE &&
                    object.type !== Const.OBJECT_TYPE_ANGLE) {
                if (object.type === Const.OBJECT_TYPE_POLYGON) {
                    pre = 'P_{';
                } else if (object.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                    pre = 'k_{';
                } else if (object.elementClass === Const.OBJECT_CLASS_TEXT) {
                    pre = 't_{';
                } else {
                    pre = 's_{';
                }
                post = '}';
            }

            for (i = 0; i < maxNameLength; i++) {
                indices[i] = 0;
            }

            while (indices[maxNameLength - 1] < possibleNames.length) {
                for (indices[0] = 1; indices[0] < possibleNames.length; indices[0]++) {
                    name = pre;

                    for (i = maxNameLength; i > 0; i--) {
                        name += possibleNames[indices[i - 1]];
                    }

                    if (!Type.exists(this.elementsByName[name + post])) {
                        return name + post;
                    }

                }
                indices[0] = possibleNames.length;

                for (i = 1; i < maxNameLength; i++) {
                    if (indices[i - 1] === possibleNames.length) {
                        indices[i - 1] = 1;
                        indices[i] += 1;
                    }
                }
            }

            return '';
        },

        /**
         * Generates unique id for a board. The result is randomly generated and prefixed with 'jxgBoard'.
         * @returns {String} Unique id for a board.
         */
        generateId: function () {
            var r = 1;

            // as long as we don't have a unique id generate a new one
            while (Type.exists(JXG.boards['jxgBoard' + r])) {
                r = Math.round(Math.random() * 65535);
            }

            return ('jxgBoard' + r);
        },

        /**
         * Composes an id for an element. If the ID is empty ('' or null) a new ID is generated, depending on the
         * object type. Additionally, the id of the label is set. As a side effect {@link JXG.Board#numObjects}
         * is updated.
         * @param {Object} obj Reference of an geometry object that needs an id.
         * @param {Number} type Type of the object.
         * @returns {String} Unique id for an element.
         */
        setId: function (obj, type) {
            var num = this.numObjects,
                elId = obj.id;

            this.numObjects += 1;

            // Falls Id nicht vorgegeben, eine Neue generieren:
            if (elId === '' || !Type.exists(elId)) {
                elId = this.id + type + num;
            }

            obj.id = elId;
            this.objects[elId] = obj;
            obj._pos = this.objectsList.length;
            this.objectsList[this.objectsList.length] = obj;

            return elId;
        },

        /**
         * After construction of the object the visibility is set
         * and the label is constructed if necessary.
         * @param {Object} obj The object to add.
         */
        finalizeAdding: function (obj) {
            if (!obj.visProp.visible) {
                this.renderer.hide(obj);
            }
        },

        finalizeLabel: function (obj) {
            if (obj.hasLabel && !obj.label.visProp.islabel && !obj.label.visProp.visible) {
                this.renderer.hide(obj.label);
            }
        },

        /**********************************************************
         *
         * Event Handler helpers
         *
         **********************************************************/

        /**
         * Calculates mouse coordinates relative to the boards container.
         * @returns {Array} Array of coordinates relative the boards container top left corner.
         */
        getCoordsTopLeftCorner: function () {
            var cPos, doc, crect, scrollLeft, scrollTop,
                docElement = this.document.documentElement || this.document.body.parentNode,
                docBody = this.document.body,
                container = this.containerObj;

            /**
             * During drags and origin moves the container element is usually not changed.
             * Check the position of the upper left corner at most every 500 msecs
             */
            if (this.cPos.length > 0 &&
                    (this.mode === this.BOARD_MODE_DRAG || this.mode === this.BOARD_MODE_MOVE_ORIGIN ||
                    (new Date()).getTime() - this.positionAccessLast < 1000)) {
                return this.cPos;
            }

            this.positionAccessLast = (new Date()).getTime();

            // Check if getBoundingClientRect exists. If so, use this as this covers *everything*
            // even CSS3D transformations etc.
            if (container.getBoundingClientRect) {
                if (typeof window.pageXOffset === 'number') {
                    scrollLeft = window.pageXOffset;
                } else {
                    if (docElement.ScrollLeft === 'number') {
                        scrollLeft = docElement.ScrollLeft;
                    } else {
                        scrollLeft = this.document.body.scrollLeft;
                    }
                }

                if (typeof window.pageYOffset === 'number') {
                    scrollTop = window.pageYOffset;
                } else {
                    if (docElement.ScrollTop === 'number') {
                        scrollTop = docElement.ScrollTop;
                    } else {
                        scrollTop = this.document.body.scrollTop;
                    }
                }

                crect = container.getBoundingClientRect();
                cPos = [crect.left + scrollLeft, crect.top + scrollTop];

                // add border width
                cPos[0] += Env.getProp(container, 'border-left-width');
                cPos[1] += Env.getProp(container, 'border-top-width');

                // vml seems to ignore paddings
                if (this.renderer.type !== 'vml') {
                    // add padding
                    cPos[0] += Env.getProp(container, 'padding-left');
                    cPos[1] += Env.getProp(container, 'padding-top');
                }

                this.cPos = cPos.slice();
                return this.cPos;
            }

            cPos = Env.getOffset(container);
            doc = this.document.documentElement.ownerDocument;

            if (!this.containerObj.currentStyle && doc.defaultView) {     // Non IE
                // this is for hacks like this one used in wordpress for the admin bar:
                // html { margin-top: 28px }
                // seems like it doesn't work in IE

                cPos[0] += Env.getProp(docElement, 'margin-left');
                cPos[1] += Env.getProp(docElement, 'margin-top');

                cPos[0] += Env.getProp(docElement, 'border-left-width');
                cPos[1] += Env.getProp(docElement, 'border-top-width');

                cPos[0] += Env.getProp(docElement, 'padding-left');
                cPos[1] += Env.getProp(docElement, 'padding-top');
            }

            if (docBody) {
                cPos[0] += Env.getProp(docBody, 'left');
                cPos[1] += Env.getProp(docBody, 'top');
            }

            // Google Translate offers widgets for web authors. These widgets apparently tamper with the clientX
            // and clientY coordinates of the mouse events. The minified sources seem to be the only publicly
            // available version so we're doing it the hacky way: Add a fixed offset.
            // see https://groups.google.com/d/msg/google-translate-general/H2zj0TNjjpY/jw6irtPlCw8J
            if (typeof google === 'object' && google.translate) {
                cPos[0] += 10;
                cPos[1] += 25;
            }

            // add border width
            cPos[0] += Env.getProp(container, 'border-left-width');
            cPos[1] += Env.getProp(container, 'border-top-width');

            // vml seems to ignore paddings
            if (this.renderer.type !== 'vml') {
                // add padding
                cPos[0] += Env.getProp(container, 'padding-left');
                cPos[1] += Env.getProp(container, 'padding-top');
            }

            cPos[0] += this.attr.offsetx;
            cPos[1] += this.attr.offsety;

            this.cPos = cPos.slice();
            return this.Pos;
        },

        /**
         * Get the position of the mouse in screen coordinates, relative to the upper left corner
         * of the host tag.
         * @param {Event} e Event object given by the browser.
         * @param {Number} [i] Only use in case of touch events. This determines which finger to use and should not be set
         * for mouseevents.
         * @returns {Array} Contains the mouse coordinates in user coordinates, ready  for {@link JXG.Coords}
         */
        getMousePosition: function (e, i) {
            var cPos = this.getCoordsTopLeftCorner(),
                absPos,
                v;

            // This fixes the object-drag bug on zoomed webpages on Android powered devices with the default WebKit browser
            // Seems to be obsolete now
            //if (Env.isWebkitAndroid()) {
            //    cPos[0] -= document.body.scrollLeft;
            //    cPos[1] -= document.body.scrollTop;
            //}

            // position of mouse cursor relative to containers position of container
            absPos = Env.getPosition(e, i, this.document);

            /**
             * In case there has been no down event before.
             */
            if (!Type.exists(this.cssTransMat)) {
                this.updateCSSTransforms();
            }
            v = [1, absPos[0] - cPos[0], absPos[1] - cPos[1]];
            v = Mat.matVecMult(this.cssTransMat, v);
            v[1] /= v[0];
            v[2] /= v[0];
            return [v[1], v[2]];

            // Method without CSS transformation
            /*
             return [absPos[0] - cPos[0], absPos[1] - cPos[1]];
             */
        },

        /**
         * Initiate moving the origin. This is used in mouseDown and touchStart listeners.
         * @param {Number} x Current mouse/touch coordinates
         * @param {Number} y Current mouse/touch coordinates
         */
        initMoveOrigin: function (x, y) {
            this.drag_dx = x - this.origin.scrCoords[1];
            this.drag_dy = y - this.origin.scrCoords[2];

            this.mode = this.BOARD_MODE_MOVE_ORIGIN;
            this.updateQuality = this.BOARD_QUALITY_LOW;
        },

        /**
         * Collects all elements below the current mouse pointer and fulfilling the following constraints:
         * <ul><li>isDraggable</li><li>visible</li><li>not fixed</li><li>not frozen</li></ul>
         * @param {Number} x Current mouse/touch coordinates
         * @param {Number} y current mouse/touch coordinates
         * @param {Object} evt An event object
         * @param {String} type What type of event? 'touch' or 'mouse'.
         * @returns {Array} A list of geometric elements.
         */
        initMoveObject: function (x, y, evt, type) {
            var pEl, el, collect = [], haspoint, len = this.objectsList.length,
                dragEl = {visProp: {layer: -10000}};

            //for (el in this.objects) {
            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                haspoint = pEl.hasPoint && pEl.hasPoint(x, y);

                if (pEl.visProp.visible && haspoint) {
                    pEl.triggerEventHandlers([type + 'down', 'down'], [evt]);
                    this.downObjects.push(pEl);
                }

                if (((this.geonextCompatibilityMode &&
                        (Type.isPoint(pEl) ||
                          pEl.elementClass === Const.OBJECT_CLASS_TEXT)) ||
                        !this.geonextCompatibilityMode) &&
                        pEl.isDraggable &&
                        pEl.visProp.visible &&
                        (!pEl.visProp.fixed) && (!pEl.visProp.frozen) &&
                        haspoint) {
                    // Elements in the highest layer get priority.
                    if (pEl.visProp.layer > dragEl.visProp.layer ||
                            (pEl.visProp.layer === dragEl.visProp.layer && pEl.lastDragTime.getTime() >= dragEl.lastDragTime.getTime())) {
                        // If an element and its label have the focus
                        // simultaneously, the element is taken.
                        // This only works if we assume that every browser runs
                        // through this.objects in the right order, i.e. an element A
                        // added before element B turns up here before B does.
                        if (!this.attr.ignorelabels || (!Type.exists(dragEl.label) || pEl !== dragEl.label)) {
                            dragEl = pEl;
                            collect[0] = dragEl;

                            // we can't drop out of this loop because of the event handling system
                            //if (this.attr.takefirst) {
                            //    return collect;
                            //}
                        }
                    }
                }
            }

            if (collect.length > 0) {
                this.mode = this.BOARD_MODE_DRAG;
            }

            if (this.attr.takefirst) {
                collect.length = 1;
            }

            return collect;
        },

        /**
         * Moves an object.
         * @param {Number} x Coordinate
         * @param {Number} y Coordinate
         * @param {Object} o The touch object that is dragged: {JXG.Board#mouse} or {JXG.Board#touches}.
         * @param {Object} evt The event object.
         * @param {String} type Mouse or touch event?
         */
        moveObject: function (x, y, o, evt, type) {
            var newPos = new Coords(Const.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(x, y), this),
                drag = o.obj,
                oldCoords;

            if (!drag) {
                return;
            }

            /*
             * Save the position.
             */
            //this.drag_position = newPos.scrCoords.slice(1);
            this.drag_position = [newPos.scrCoords[1], newPos.scrCoords[2]];

            if (drag.type !== Const.OBJECT_TYPE_GLIDER) {
                if (!isNaN(o.targets[0].Xprev + o.targets[0].Yprev)) {
                    drag.setPositionDirectly(Const.COORDS_BY_SCREEN,
                        [newPos.scrCoords[1], newPos.scrCoords[2]],
                        [o.targets[0].Xprev, o.targets[0].Yprev]
                        );
                }
                // Remember the actual position for the next move event. Then we are able to
                // compute the difference vector.
                o.targets[0].Xprev = newPos.scrCoords[1];
                o.targets[0].Yprev = newPos.scrCoords[2];
                //this.update(drag);
                drag.prepareUpdate().update(false).updateRenderer();
            } else if (drag.type === Const.OBJECT_TYPE_GLIDER) {
                oldCoords = drag.coords;  // Used in group mode

                // First the new position of the glider is set to the new mouse position
                drag.setPositionDirectly(Const.COORDS_BY_USER, newPos.usrCoords.slice(1));

                // Now, we have to adjust the other group elements again.
                if (drag.group.length !== 0) {
                    // Then, from this position we compute the projection to the object the glider on which the glider lives.
                    // Do we really need this?
                    if (drag.slideObject.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                        drag.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToCircle(drag, drag.slideObject, this).usrCoords, false);
                    } else if (drag.slideObject.elementClass === Const.OBJECT_CLASS_LINE) {
                        drag.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToLine(drag, drag.slideObject, this).usrCoords, false);
                    }

                    drag.group[drag.group.length - 1].dX = drag.coords.scrCoords[1] - oldCoords.scrCoords[1];
                    drag.group[drag.group.length - 1].dY = drag.coords.scrCoords[2] - oldCoords.scrCoords[2];
                    drag.group[drag.group.length - 1].update(this);
                } else {
                    // This update triggers Point.updateGlider() instead of Point.updateGliderFromParent():
                    //
                    //this.update(drag);
                    drag.prepareUpdate().update(false).updateRenderer();
                }
            }

            drag.triggerEventHandlers([type + 'drag', 'drag'], [evt]);

            this.updateInfobox(drag);
            this.update();
            drag.highlight(true);

            drag.lastDragTime = new Date();
        },

        /**
         * Moves elements in multitouch mode.
         * @param {Array} p1 x,y coordinates of first touch
         * @param {Array} p2 x,y coordinates of second touch
         * @param {Object} o The touch object that is dragged: {JXG.Board#touches}.
         * @param {Object} evt The event object that lead to this movement.
         */
        twoFingerMove: function (p1, p2, o, evt) {
            var np1c, np2c, drag;

            if (Type.exists(o) && Type.exists(o.obj)) {
                drag = o.obj;
            } else {
                return;
            }

            // New finger position
            np1c = new Coords(Const.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(p1[0], p1[1]), this);
            np2c = new Coords(Const.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(p2[0], p2[1]), this);

            if (drag.elementClass === Const.OBJECT_CLASS_LINE ||
                    drag.type === Const.OBJECT_TYPE_POLYGON) {
                this.twoFingerTouchObject(np1c, np2c, o, drag);
            } else if (drag.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                this.twoFingerTouchCircle(np1c, np2c, o, drag);
            }
            drag.triggerEventHandlers(['touchdrag', 'drag'], [evt]);

            o.targets[0].Xprev = np1c.scrCoords[1];
            o.targets[0].Yprev = np1c.scrCoords[2];
            o.targets[1].Xprev = np2c.scrCoords[1];
            o.targets[1].Yprev = np2c.scrCoords[2];
        },

        /**
         * Moves a line or polygon with two fingers
         * @param {JXG.Coords} np1c x,y coordinates of first touch
         * @param {JXG.Coords} np2c x,y coordinates of second touch
         * @param {object} o The touch object that is dragged: {JXG.Board#touches}.
         * @param {object} drag The object that is dragged:
         */
        twoFingerTouchObject: function (np1c, np2c, o, drag) {
            var np1, np2, op1, op2,
                nmid, omid, nd, od,
                d,
                S, alpha, t1, t2, t3, t4, t5;

            if (Type.exists(o.targets[0]) &&
                    Type.exists(o.targets[1]) &&
                    !isNaN(o.targets[0].Xprev + o.targets[0].Yprev + o.targets[1].Xprev + o.targets[1].Yprev)) {
                np1 = np1c.usrCoords;
                np2 = np2c.usrCoords;
                // Previous finger position
                op1 = (new Coords(Const.COORDS_BY_SCREEN, [o.targets[0].Xprev, o.targets[0].Yprev], this)).usrCoords;
                op2 = (new Coords(Const.COORDS_BY_SCREEN, [o.targets[1].Xprev, o.targets[1].Yprev], this)).usrCoords;

                // Affine mid points of the old and new positions
                omid = [1, (op1[1] + op2[1]) * 0.5, (op1[2] + op2[2]) * 0.5];
                nmid = [1, (np1[1] + np2[1]) * 0.5, (np1[2] + np2[2]) * 0.5];

                // Old and new directions
                od = Mat.crossProduct(op1, op2);
                nd = Mat.crossProduct(np1, np2);
                S = Mat.crossProduct(od, nd);

                // If parallel, translate otherwise rotate
                if (Math.abs(S[0]) < Mat.eps) {
                    return;
                }

                S[1] /= S[0];
                S[2] /= S[0];
                alpha = Geometry.rad(omid.slice(1), S.slice(1), nmid.slice(1));
                t1 = this.create('transform', [alpha, S[1], S[2]], {type: 'rotate'});

                // Old midpoint of fingers after first transformation:
                t1.update();
                omid = Mat.matVecMult(t1.matrix, omid);
                omid[1] /= omid[0];
                omid[2] /= omid[0];

                // Shift to the new mid point
                t2 = this.create('transform', [nmid[1] - omid[1], nmid[2] - omid[2]], {type: 'translate'});
                t2.update();
                //omid = Mat.matVecMult(t2.matrix, omid);

                t1.melt(t2);
                if (drag.visProp.scalable) {
                    // Scale
                    d = Geometry.distance(np1, np2) / Geometry.distance(op1, op2);
                    t3 = this.create('transform', [-nmid[1], -nmid[2]], {type: 'translate'});
                    t4 = this.create('transform', [d, d], {type: 'scale'});
                    t5 = this.create('transform', [nmid[1], nmid[2]], {type: 'translate'});
                    t1.melt(t3).melt(t4).melt(t5);
                }

                if (drag.elementClass === Const.OBJECT_CLASS_LINE) {
                    t1.applyOnce([drag.point1, drag.point2]);
                } else if (drag.type === Const.OBJECT_TYPE_POLYGON) {
                    t1.applyOnce(drag.vertices.slice(0, -1));
                }

                this.update();
                drag.highlight(true);
            }
        },

        /*
         * Moves a circle with two fingers
         * @param {JXG.Coords} np1c x,y coordinates of first touch
         * @param {JXG.Coords} np2c x,y coordinates of second touch
         * @param {object} o The touch object that is dragged: {JXG.Board#touches}.
         * @param {object} drag The object that is dragged:
         */
        twoFingerTouchCircle: function (np1c, np2c, o, drag) {
            var np1, np2, op1, op2,
                d, alpha, t1, t2, t3, t4, t5;

            if (drag.method === 'pointCircle' ||
                    drag.method === 'pointLine') {
                return;
            }

            if (Type.exists(o.targets[0]) &&
                    Type.exists(o.targets[1]) &&
                    !isNaN(o.targets[0].Xprev + o.targets[0].Yprev + o.targets[1].Xprev + o.targets[1].Yprev)) {

                np1 = np1c.usrCoords;
                np2 = np2c.usrCoords;
                // Previous finger position
                op1 = (new Coords(Const.COORDS_BY_SCREEN, [o.targets[0].Xprev, o.targets[0].Yprev], this)).usrCoords;
                op2 = (new Coords(Const.COORDS_BY_SCREEN, [o.targets[1].Xprev, o.targets[1].Yprev], this)).usrCoords;

                // Shift by the movement of the first finger
                t1 = this.create('transform', [np1[1] - op1[1], np1[2] - op1[2]], {type: 'translate'});
                alpha = Geometry.rad(op2.slice(1), np1.slice(1), np2.slice(1));

                // Rotate and scale by the movement of the second finger
                t2 = this.create('transform', [-np1[1], -np1[2]], {type: 'translate'});
                t3 = this.create('transform', [alpha], {type: 'rotate'});
                t1.melt(t2).melt(t3);

                if (drag.visProp.scalable) {
                    d = Geometry.distance(np1, np2) / Geometry.distance(op1, op2);
                    t4 = this.create('transform', [d, d], {type: 'scale'});
                    t1.melt(t4);
                }
                t5 = this.create('transform', [ np1[1], np1[2]], {type: 'translate'});
                t1.melt(t5);

                t1.applyOnce([drag.center]);

                if (drag.method === 'twoPoints') {
                    t1.applyOnce([drag.point2]);
                } else if (drag.method === 'pointRadius') {
                    if (Type.isNumber(drag.updateRadius.origin)) {
                        drag.setRadius(drag.radius * d);
                    }
                }
                this.update(drag.center);
                drag.highlight(true);
            }
        },

        highlightElements: function (x, y, evt, target) {
            var el, pEl, pId,
                overObjects = {},
                len = this.objectsList.length;

            // Elements  below the mouse pointer which are not highlighted yet will be highlighted.
            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                pId = pEl.id;
                if (Type.exists(pEl.hasPoint) && pEl.visProp.visible && pEl.hasPoint(x, y)) {
                    // this is required in any case because otherwise the box won't be shown until the point is dragged
                    this.updateInfobox(pEl);

                    if (!Type.exists(this.highlightedObjects[pId])) { // highlight only if not highlighted
                        overObjects[pId] = pEl;
                        pEl.highlight();
                        this.triggerEventHandlers(['mousehit', 'hit'], [evt, pEl, target]);
                    }

                    if (pEl.mouseover) {
                        pEl.triggerEventHandlers(['mousemove', 'move'], [evt]);
                    } else {
                        pEl.triggerEventHandlers(['mouseover', 'over'], [evt]);
                        pEl.mouseover = true;
                    }
                }
            }

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                pId = pEl.id;
                if (pEl.mouseover) {
                    if (!overObjects[pId]) {
                        pEl.triggerEventHandlers(['mouseout', 'out'], [evt]);
                        pEl.mouseover = false;
                    }
                }
            }
        },

        /**
         * Helper function which returns a reasonable starting point for the object being dragged.
         * Formerly known as initXYstart().
         * @private
         * @param {JXG.GeometryElement} obj The object to be dragged
         * @param {Array} targets Array of targets. It is changed by this function.
         */
        saveStartPos: function (obj, targets) {
            var xy = [], i, len;

            if (obj.type === Const.OBJECT_TYPE_TICKS) {
                xy.push([1, NaN, NaN]);
            } else if (obj.elementClass === Const.OBJECT_CLASS_LINE) {
                xy.push(obj.point1.coords.usrCoords);
                xy.push(obj.point2.coords.usrCoords);
            } else if (obj.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                xy.push(obj.center.coords.usrCoords);
                if (obj.method === "twoPoints") {
                    xy.push(obj.point2.coords.usrCoords);
                }
            } else if (obj.type === Const.OBJECT_TYPE_POLYGON) {
                len = obj.vertices.length - 1;
                for (i = 0; i < len; i++) {
                    xy.push(obj.vertices[i].coords.usrCoords);
                }
            } else if (obj.type === Const.OBJECT_TYPE_SECTOR) {
                xy.push(obj.point1.coords.usrCoords);
                xy.push(obj.point2.coords.usrCoords);
                xy.push(obj.point3.coords.usrCoords);
            } else if (Type.isPoint(obj) || obj.type === Const.OBJECT_TYPE_GLIDER) {
                xy.push(obj.coords.usrCoords);
            } else if (obj.elementClass === Const.OBJECT_CLASS_CURVE) {
                if (JXG.exists(obj.parents)) {
                    len = obj.parents.length;
                    for (i = 0; i < len; i++) {
                        xy.push(this.select(obj.parents[i]).coords.usrCoords);
                    }
                }
            } else {
                try {
                    xy.push(obj.coords.usrCoords);
                } catch (e) {
                    JXG.debug('JSXGraph+ saveStartPos: obj.coords.usrCoords not available: ' + e);
                }
            }

            len = xy.length;
            for (i = 0; i < len; i++) {
                targets.Zstart.push(xy[i][0]);
                targets.Xstart.push(xy[i][1]);
                targets.Ystart.push(xy[i][2]);
            }
        },

        mouseOriginMoveStart: function (evt) {
            var r = this.attr.pan.enabled && (!this.attr.pan.needshift || evt.shiftKey),
                pos;

            if (r) {
                pos = this.getMousePosition(evt);
                this.initMoveOrigin(pos[0], pos[1]);
            }

            return r;
        },

        mouseOriginMove: function (evt) {
            var r = (this.mode === this.BOARD_MODE_MOVE_ORIGIN),
                pos;

            if (r) {
                pos = this.getMousePosition(evt);
                this.moveOrigin(pos[0], pos[1], true);
            }

            return r;
        },

        touchOriginMoveStart: function (evt) {
            var touches = evt[JXG.touchProperty],
                twoFingersCondition = (touches.length === 2 && Geometry.distance([touches[0].screenX, touches[0].screenY], [touches[1].screenX, touches[1].screenY]) < 80),
                r = this.attr.pan.enabled && (!this.attr.pan.needtwofingers || twoFingersCondition),
                pos;

            if (r) {
                pos = this.getMousePosition(evt, 0);
                this.initMoveOrigin(pos[0], pos[1]);
            }

            return r;
        },

        touchOriginMove: function (evt) {
            var r = (this.mode === this.BOARD_MODE_MOVE_ORIGIN),
                pos;

            if (r) {
                pos = this.getMousePosition(evt, 0);
                this.moveOrigin(pos[0], pos[1], true);
            }

            return r;
        },

        originMoveEnd: function () {
            this.updateQuality = this.BOARD_QUALITY_HIGH;
            this.mode = this.BOARD_MODE_NONE;
        },

        /**********************************************************
         *
         * Event Handler
         *
         **********************************************************/

        /**
         *  Add all possible event handlers to the board object
         */
        addEventHandlers: function () {
            if (Env.supportsPointerEvents()) {
                this.addPointerEventHandlers();
            } else {
                this.addMouseEventHandlers();
                this.addTouchEventHandlers();
            }
        },

        /**
         * Registers the MSPointer* event handlers.
         */
        addPointerEventHandlers: function () {
            if (!this.hasPointerHandlers && Env.isBrowser) {
                if (window.navigator.pointerEnabled) {  // IE11+
                    Env.addEvent(this.containerObj, 'pointerdown', this.pointerDownListener, this);
                    Env.addEvent(this.containerObj, 'pointermove', this.pointerMoveListener, this);
                } else {
                    Env.addEvent(this.containerObj, 'MSPointerDown', this.pointerDownListener, this);
                    Env.addEvent(this.containerObj, 'MSPointerMove', this.pointerMoveListener, this);
                }
                this.hasPointerHandlers = true;
            }
        },

        /**
         * Registers mouse move, down and wheel event handlers.
         */
        addMouseEventHandlers: function () {
            if (!this.hasMouseHandlers && Env.isBrowser) {
                Env.addEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
                Env.addEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);

                Env.addEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
                Env.addEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);

                this.hasMouseHandlers = true;

                // This one produces errors on IE
                //   Env.addEvent(this.containerObj, 'contextmenu', function (e) { e.preventDefault(); return false;}, this);

                // This one works on IE, Firefox and Chromium with default configurations. On some Safari
                // or Opera versions the user must explicitly allow the deactivation of the context menu.
                this.containerObj.oncontextmenu = function (e) {
                    if (Type.exists(e)) {
                        e.preventDefault();
                    }

                    return false;
                };
            }
        },

        /**
         * Register touch start and move and gesture start and change event handlers.
         * @param {Boolean} appleGestures If set to false the gesturestart and gesturechange event handlers
         * will not be registered.
         */
        addTouchEventHandlers: function (appleGestures) {
            if (!this.hasTouchHandlers && Env.isBrowser) {
                Env.addEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
                Env.addEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);

                if (!Type.exists(appleGestures) || appleGestures) {
                    Env.addEvent(this.containerObj, 'gesturestart', this.gestureStartListener, this);
                    Env.addEvent(this.containerObj, 'gesturechange', this.gestureChangeListener, this);
                    this.hasGestureHandlers = true;
                }

                this.hasTouchHandlers = true;
            }
        },

        /**
         * Remove MSPointer* Event handlers.
         */
        removePointerEventHandlers: function () {
            if (this.hasPointerHandlers && Env.isBrowser) {
                if (window.navigator.pointerEnabled) {  // IE11+
                    Env.removeEvent(this.containerObj, 'pointerdown', this.pointerDownListener, this);
                    Env.removeEvent(this.containerObj, 'pointermove', this.pointerMoveListener, this);
                } else {
                    Env.removeEvent(this.containerObj, 'MSPointerDown', this.pointerDownListener, this);
                    Env.removeEvent(this.containerObj, 'MSPointerMove', this.pointerMoveListener, this);
                }

                if (this.hasPointerUp) {
                    if (window.navigator.pointerEnabled) {  // IE11+
                        Env.removeEvent(this.document, 'pointerup', this.pointerUpListener, this);
                    } else {
                        Env.removeEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                    }
                    this.hasPointerUp = false;
                }

                this.hasPointerHandlers = false;
            }
        },

        /**
         * De-register mouse event handlers.
         */
        removeMouseEventHandlers: function () {
            if (this.hasMouseHandlers && Env.isBrowser) {
                Env.removeEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
                Env.removeEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);

                if (this.hasMouseUp) {
                    Env.removeEvent(this.document, 'mouseup', this.mouseUpListener, this);
                    this.hasMouseUp = false;
                }

                Env.removeEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
                Env.removeEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);

                this.hasMouseHandlers = false;
            }
        },

        /**
         * Remove all registered touch event handlers.
         */
        removeTouchEventHandlers: function () {
            if (this.hasTouchHandlers && Env.isBrowser) {
                Env.removeEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
                Env.removeEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);

                if (this.hasTouchEnd) {
                    Env.removeEvent(this.document, 'touchend', this.touchEndListener, this);
                    this.hasTouchEnd = false;
                }

                if (this.hasGestureHandlers) {
                    Env.removeEvent(this.containerObj, 'gesturestart', this.gestureStartListener, this);
                    Env.removeEvent(this.containerObj, 'gesturechange', this.gestureChangeListener, this);
                    this.hasGestureHandlers = false;
                }

                this.hasTouchHandlers = false;
            }
        },

        /**
         * Remove all event handlers from the board object
         */
        removeEventHandlers: function () {
            this.removeMouseEventHandlers();
            this.removeTouchEventHandlers();
            this.removePointerEventHandlers();
        },

        /**
         * Handler for click on left arrow in the navigation bar
         */
        clickLeftArrow: function () {
            this.moveOrigin(this.origin.scrCoords[1] + this.canvasWidth * 0.1, this.origin.scrCoords[2]);
            return false;
        },

        /**
         * Handler for click on right arrow in the navigation bar
         */
        clickRightArrow: function () {
            this.moveOrigin(this.origin.scrCoords[1] - this.canvasWidth * 0.1, this.origin.scrCoords[2]);
            return false;
        },

        /**
         * Handler for click on up arrow in the navigation bar
         */
        clickUpArrow: function () {
            this.moveOrigin(this.origin.scrCoords[1], this.origin.scrCoords[2] - this.canvasHeight * 0.1);
            return false;
        },

        /**
         * Handler for click on down arrow in the navigation bar
         */
        clickDownArrow: function () {
            this.moveOrigin(this.origin.scrCoords[1], this.origin.scrCoords[2] + this.canvasHeight * 0.1);
            return false;
        },

        /**
         * Triggered on iOS/Safari while the user inputs a gesture (e.g. pinch) and is used to zoom into the board. Only works on iOS/Safari.
         * @param {Event} evt Browser event object
         * @return {Boolean}
         */
        gestureChangeListener: function (evt) {
            var c,
                zx = this.attr.zoom.factorx,
                zy = this.attr.zoom.factory;

            if (!this.attr.zoom.wheel) {
                return true;
            }

            evt.preventDefault();

            if (this.mode === this.BOARD_MODE_ZOOM) {
                c = new Coords(Const.COORDS_BY_SCREEN, this.getMousePosition(evt), this);

                this.attr.zoom.factorx = evt.scale / this.prevScale;
                this.attr.zoom.factory = evt.scale / this.prevScale;

                this.zoomIn(c.usrCoords[1], c.usrCoords[2]);
                this.prevScale = evt.scale;

                this.attr.zoom.factorx = zx;
                this.attr.zoom.factory = zy;
            }

            return false;
        },

        /**
         * Called by iOS/Safari as soon as the user starts a gesture (only works on iOS/Safari).
         * @param {Event} evt
         * @return {Boolean}
         */
        gestureStartListener: function (evt) {

            if (!this.attr.zoom.wheel) {
                return true;
            }

            evt.preventDefault();
            this.prevScale = 1;

            if (this.mode === this.BOARD_MODE_NONE) {
                this.mode = this.BOARD_MODE_ZOOM;
            }

            return false;
        },

        /**
         * pointer-Events
         */

        /**
         * This method is called by the browser when a pointing device is pressed on the screen.
         * @param {Event} evt The browsers event object.
         * @param {Object} object If the object to be dragged is already known, it can be submitted via this parameter
         * @returns {Boolean} ...
         */
        pointerDownListener: function (evt, object) {
            var i, j, k, pos, elements,
                eps = this.options.precision.touch,
                found, target, result;

            if (!this.hasPointerUp) {
                if (window.navigator.pointerEnabled) {  // IE11+
                    Env.addEvent(this.document, 'pointerup', this.pointerUpListener, this);
                } else {
                    Env.addEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                }
                this.hasPointerUp = true;
            }

            if (this.hasMouseHandlers) {
                this.removeMouseEventHandlers();
            }

            if (this.hasTouchHandlers) {
                this.removeTouchEventHandlers();
            }

            // prevent accidental selection of text
            if (this.document.selection && typeof this.document.selection.empty === 'function') {
                this.document.selection.empty();
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            // Touch or pen device
            if (JXG.isBrowser && (window.navigator.msMaxTouchPoints && window.navigator.msMaxTouchPoints > 1)) {
                this.options.precision.hasPoint = eps;
            }

            // This should be easier than the touch events. Every pointer device gets its own pointerId, e.g. the mouse
            // always has id 1, fingers and pens get unique ids every time a pointerDown event is fired and they will
            // keep this id until a pointerUp event is fired. What we have to do here is:
            //  1. collect all elements under the current pointer
            //  2. run through the touches control structure
            //    a. look for the object collected in step 1.
            //    b. if an object is found, check the number of pointers. if appropriate, add the pointer.

            pos = this.getMousePosition(evt);

            if (object) {
                elements = [ object ];
                this.mode = this.BOARD_MODE_DRAG;
            } else {
                elements = this.initMoveObject(pos[0], pos[1], evt, 'mouse');
            }

            // if no draggable object can be found, get out here immediately
            if (elements.length > 0) {
                // check touches structure
                target = elements[elements.length - 1];
                found = false;

                for (i = 0; i < this.touches.length; i++) {
                    // the target is already in our touches array, try to add the pointer to the existing touch
                    if (this.touches[i].obj === target) {
                        j = i;
                        k = this.touches[i].targets.push({
                            num: evt.pointerId,
                            X: pos[0],
                            Y: pos[1],
                            Xprev: NaN,
                            Yprev: NaN,
                            Xstart: [],
                            Ystart: [],
                            Zstart: []
                        }) - 1;

                        found = true;
                        break;
                    }
                }

                if (!found) {
                    k = 0;
                    j = this.touches.push({
                        obj: target,
                        targets: [{
                            num: evt.pointerId,
                            X: pos[0],
                            Y: pos[1],
                            Xprev: NaN,
                            Yprev: NaN,
                            Xstart: [],
                            Ystart: [],
                            Zstart: []
                        }]
                    }) - 1;
                }

                this.dehighlightAll();
                target.highlight(true);

                this.saveStartPos(target, this.touches[j].targets[k]);

                // prevent accidental text selection
                // this could get us new trouble: input fields, links and drop down boxes placed as text
                // on the board don't work anymore.
                if (evt && evt.preventDefault) {
                    evt.preventDefault();
                } else if (window.event) {
                    window.event.returnValue = false;
                }
            }

            if (this.touches.length > 0) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            // move origin - but only if we're not in drag mode
            if (this.mode === this.BOARD_MODE_NONE && this.mouseOriginMoveStart(evt)) {
                this.triggerEventHandlers(['touchstart', 'down', 'pointerdown', 'MSPointerDown'], [evt]);
                return false;
            }

            this.options.precision.hasPoint = this.options.precision.mouse;
            this.triggerEventHandlers(['touchstart', 'down', 'pointerdown', 'MSPointerDown'], [evt]);

            return result;
        },

        /**
         * Called periodically by the browser while the user moves a pointing device across the screen.
         * @param {Event} evt
         * @return {Boolean}
         */
        pointerMoveListener: function (evt) {
            var i, j, pos, time,
                evtTouches = evt[JXG.touchProperty];

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.dehighlightAll();
                this.renderer.hide(this.infobox);
            }

            if (this.mode !== this.BOARD_MODE_NONE) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            // Touch or pen device
            if (JXG.isBrowser && (window.navigator.msMaxTouchPoints && window.navigator.msMaxTouchPoints > 1)) {
                this.options.precision.hasPoint = this.options.precision.touch;
            }
            this.updateQuality = this.BOARD_QUALITY_LOW;

            // try with mouseOriginMove because the evt objects are quite similar
            if (!this.mouseOriginMove(evt)) {
                if (this.mode === this.BOARD_MODE_DRAG) {
                    // Runs through all elements which are touched by at least one finger.
                    for (i = 0; i < this.touches.length; i++) {
                        for (j = 0; j < this.touches[i].targets.length; j++) {
                            if (this.touches[i].targets[j].num === evt.pointerId) {
                                // Touch by one finger:  this is possible for all elements that can be dragged
                                if (this.touches[i].targets.length === 1) {
                                    this.touches[i].targets[j].X = evt.pageX;
                                    this.touches[i].targets[j].Y = evt.pageY;
                                    pos = this.getMousePosition(evt);
                                    this.moveObject(pos[0], pos[1], this.touches[i], evt, 'touch');
                                // Touch by two fingers: moving lines
                                } else if (this.touches[i].targets.length === 2 &&
                                        this.touches[i].targets[0].num > -1 && this.touches[i].targets[1].num > -1) {

                                    this.touches[i].targets[j].X = evt.pageX;
                                    this.touches[i].targets[j].Y = evt.pageY;

                                    this.twoFingerMove(
                                        this.getMousePosition({
                                            pageX: this.touches[i].targets[0].X,
                                            pageY: this.touches[i].targets[0].Y
                                        }),
                                        this.getMousePosition({
                                            pageX: this.touches[i].targets[1].X,
                                            pageY: this.touches[i].targets[1].Y
                                        }),
                                        this.touches[i],
                                        evt
                                    );
                                }

                                // there is only one pointer in the evt object, there's no point in looking further
                                break;
                            }
                        }

                    }
                } else {
                    pos = this.getMousePosition(evt);
                    this.highlightElements(pos[0], pos[1], evt, -1);
                }
            }

            // Hiding the infobox is commentet out, since it prevents showing the infobox
            // on IE 11+ on 'over'
            //if (this.mode !== this.BOARD_MODE_DRAG) {
                //this.renderer.hide(this.infobox);
            //}

            this.options.precision.hasPoint = this.options.precision.mouse;
            this.triggerEventHandlers(['touchmove', 'move', 'pointermove', 'MSPointerMove'], [evt, this.mode]);

            return this.mode === this.BOARD_MODE_NONE;
        },

        /**
         * Triggered as soon as the user stops touching the device with at least one finger.
         * @param {Event} evt
         * @return {Boolean}
         */
        pointerUpListener: function (evt) {
            var i, j, k, found, foundNumber,
                tmpTouches = [],
                eps = this.options.precision.touch;

            this.triggerEventHandlers(['touchend', 'up', 'pointerup', 'MSPointerUp'], [evt]);
            this.renderer.hide(this.infobox);

            if (evt) {
                for (i = 0; i < this.touches.length; i++) {
                    for (j = 0; j < this.touches[i].targets.length; j++) {
                        if (this.touches[i].targets[j].num === evt.pointerId) {
                            this.touches[i].targets.splice(j, 1);

                            if (this.touches[i].targets.length === 0) {
                                this.touches.splice(i, 1);
                            }

                            break;
                        }
                    }
                }
            }

            for (i = this.downObjects.length - 1; i > -1; i--) {
                found = false;
                for (j = 0; j < this.touches.length; j++) {
                    if (this.touches[j].obj.id === this.downObjects[i].id) {
                        found = true;
                    }
                }
                if (!found) {
                    this.downObjects[i].triggerEventHandlers(['touchend', 'up', 'pointerup', 'MSPointerUp'], [evt]);
                    this.downObjects[i].snapToGrid();
                    this.downObjects[i].snapToPoints();
                    this.downObjects.splice(i, 1);
                }
            }

            if (this.touches.length === 0) {
                if (this.hasPointerUp) {
                    if (window.navigator.pointerEnabled) {  // IE11+
                        Env.removeEvent(this.document, 'pointerup', this.pointerUpListener, this);
                    } else {
                        Env.removeEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                    }
                    this.hasPointerUp = false;
                }

                this.dehighlightAll();
                this.updateQuality = this.BOARD_QUALITY_HIGH;

                this.originMoveEnd();
                this.update();
            }

            return true;
        },

        /**
         * Touch-Events
         */

        /**
         * This method is called by the browser when a finger touches the surface of the touch-device.
         * @param {Event} evt The browsers event object.
         * @returns {Boolean} ...
         */
        touchStartListener: function (evt) {
            var i, pos, elements, j, k, time,
                eps = this.options.precision.touch,
                obj, found, targets,
                evtTouches = evt[JXG.touchProperty],
                target;

            if (!this.hasTouchEnd) {
                Env.addEvent(this.document, 'touchend', this.touchEndListener, this);
                this.hasTouchEnd = true;
            }

            if (this.hasMouseHandlers) {
                this.removeMouseEventHandlers();
            }

            // prevent accidental selection of text
            if (this.document.selection && typeof this.document.selection.empty === 'function') {
                this.document.selection.empty();
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            // multitouch
            this.options.precision.hasPoint = this.options.precision.touch;

            // this is the most critical part. first we should run through the existing touches and collect all targettouches that don't belong to our
            // previous touches. once this is done we run through the existing touches again and watch out for free touches that can be attached to our existing
            // touches, e.g. we translate (parallel translation) a line with one finger, now a second finger is over this line. this should change the operation to
            // a rotational translation. or one finger moves a circle, a second finger can be attached to the circle: this now changes the operation from translation to
            // stretching. as a last step we're going through the rest of the targettouches and initiate new move operations:
            //  * points have higher priority over other elements.
            //  * if we find a targettouch over an element that could be transformed with more than one finger, we search the rest of the targettouches, if they are over
            //    this element and add them.
            // ADDENDUM 11/10/11:
            //  (1) run through the touches control object,
            //  (2) try to find the targetTouches for every touch. on touchstart only new touches are added, hence we can find a targettouch
            //      for every target in our touches objects
            //  (3) if one of the targettouches was bound to a touches targets array, mark it
            //  (4) run through the targettouches. if the targettouch is marked, continue. otherwise check for elements below the targettouch:
            //      (a) if no element could be found: mark the target touches and continue
            //      --- in the following cases, "init" means:
            //           (i) check if the element is already used in another touches element, if so, mark the targettouch and continue
            //          (ii) if not, init a new touches element, add the targettouch to the touches property and mark it
            //      (b) if the element is a point, init
            //      (c) if the element is a line, init and try to find a second targettouch on that line. if a second one is found, add and mark it
            //      (d) if the element is a circle, init and try to find TWO other targettouches on that circle. if only one is found, mark it and continue. otherwise
            //          add both to the touches array and mark them.
            for (i = 0; i < evtTouches.length; i++) {
                evtTouches[i].jxg_isused = false;
            }

            for (i = 0; i < this.touches.length; i++) {
                for (j = 0; j < this.touches[i].targets.length; j++) {
                    this.touches[i].targets[j].num = -1;
                    eps = this.options.precision.touch;

                    do {
                        for (k = 0; k < evtTouches.length; k++) {
                            // find the new targettouches
                            if (Math.abs(Math.pow(evtTouches[k].screenX - this.touches[i].targets[j].X, 2) +
                                    Math.pow(evtTouches[k].screenY - this.touches[i].targets[j].Y, 2)) < eps * eps) {
                                this.touches[i].targets[j].num = k;

                                this.touches[i].targets[j].X = evtTouches[k].screenX;
                                this.touches[i].targets[j].Y = evtTouches[k].screenY;
                                evtTouches[k].jxg_isused = true;
                                break;
                            }
                        }

                        eps *= 2;

                    } while (this.touches[i].targets[j].num === -1 && eps < this.options.precision.touchMax);

                    if (this.touches[i].targets[j].num === -1) {
                        JXG.debug('i couldn\'t find a targettouches for target no ' + j + ' on ' + this.touches[i].obj.name + ' (' + this.touches[i].obj.id + '). Removed the target.');
                        JXG.debug('eps = ' + eps + ', touchMax = ' + Options.precision.touchMax);
                        this.touches[i].targets.splice(i, 1);
                    }

                }
            }

            // we just re-mapped the targettouches to our existing touches list. now we have to initialize some touches from additional targettouches
            for (i = 0; i < evtTouches.length; i++) {
                if (!evtTouches[i].jxg_isused) {
                    pos = this.getMousePosition(evt, i);
                    elements = this.initMoveObject(pos[0], pos[1], evt, 'touch');

                    if (elements.length !== 0) {
                        obj = elements[elements.length - 1];

                        if (Type.isPoint(obj) ||
                                obj.elementClass === Const.OBJECT_CLASS_TEXT ||
                                obj.type === Const.OBJECT_TYPE_TICKS ||
                                obj.type === Const.OBJECT_TYPE_IMAGE) {
                            // it's a point, so it's single touch, so we just push it to our touches
                            targets = [{ num: i, X: evtTouches[i].screenX, Y: evtTouches[i].screenY, Xprev: NaN, Yprev: NaN, Xstart: [], Ystart: [], Zstart: [] }];

                            // For the UNDO/REDO of object moves
                            this.saveStartPos(obj, targets[0]);

                            this.touches.push({ obj: obj, targets: targets });
                            obj.highlight(true);

                        } else if (obj.elementClass === Const.OBJECT_CLASS_LINE ||
                                obj.elementClass === Const.OBJECT_CLASS_CIRCLE ||
                                obj.type === Const.OBJECT_TYPE_POLYGON) {
                            found = false;

                            // first check if this geometric object is already capture in this.touches
                            for (j = 0; j < this.touches.length; j++) {
                                if (obj.id === this.touches[j].obj.id) {
                                    found = true;
                                    // only add it, if we don't have two targets in there already
                                    if (this.touches[j].targets.length === 1) {
                                        target = { num: i, X: evtTouches[i].screenX, Y: evtTouches[i].screenY, Xprev: NaN, Yprev: NaN, Xstart: [], Ystart: [], Zstart: [] };

                                        // For the UNDO/REDO of object moves
                                        this.saveStartPos(obj, target);
                                        this.touches[j].targets.push(target);
                                    }

                                    evtTouches[i].jxg_isused = true;
                                }
                            }

                            // we couldn't find it in touches, so we just init a new touches
                            // IF there is a second touch targetting this line, we will find it later on, and then add it to
                            // the touches control object.
                            if (!found) {
                                targets = [{ num: i, X: evtTouches[i].screenX, Y: evtTouches[i].screenY, Xprev: NaN, Yprev: NaN, Xstart: [], Ystart: [], Zstart: [] }];

                                // For the UNDO/REDO of object moves
                                this.saveStartPos(obj, targets[0]);
                                this.touches.push({ obj: obj, targets: targets });
                                obj.highlight(true);
                            }
                        }
                    }

                    evtTouches[i].jxg_isused = true;
                }
            }

            if (this.touches.length > 0) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            // move origin - but only if we're not in drag mode
            if (this.mode === this.BOARD_MODE_NONE && this.touchOriginMoveStart(evt)) {
                this.triggerEventHandlers(['touchstart', 'down'], [evt]);
                return false;
            }

            if (Env.isWebkitAndroid()) {
                time = new Date();
                this.touchMoveLast = time.getTime() - 200;
            }

            this.options.precision.hasPoint = this.options.precision.mouse;

            this.triggerEventHandlers(['touchstart', 'down'], [evt]);

            return this.touches.length > 0;
        },

        /**
         * Called periodically by the browser while the user moves his fingers across the device.
         * @param {Event} evt
         * @return {Boolean}
         */
        touchMoveListener: function (evt) {
            var i, pos1, pos2, time,
                evtTouches = evt[JXG.touchProperty];

            if (this.mode !== this.BOARD_MODE_NONE) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            // Reduce update frequency for Android devices
            if (Env.isWebkitAndroid()) {
                time = new Date();
                time = time.getTime();

                if (time - this.touchMoveLast < 80) {
                    this.updateQuality = this.BOARD_QUALITY_HIGH;
                    this.triggerEventHandlers(['touchmove', 'move'], [evt, this.mode]);

                    return false;
                }

                this.touchMoveLast = time;
            }

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.renderer.hide(this.infobox);
            }

            this.options.precision.hasPoint = this.options.precision.touch;
            this.updateQuality = this.BOARD_QUALITY_LOW;

            if (!this.touchOriginMove(evt)) {
                if (this.mode === this.BOARD_MODE_DRAG) {
                    // Runs over through all elements which are touched
                    // by at least one finger.
                    for (i = 0; i < this.touches.length; i++) {
                        // Touch by one finger:  this is possible for all elements that can be dragged
                        if (this.touches[i].targets.length === 1) {
                            if (evtTouches[this.touches[i].targets[0].num]) {
                                pos1 = this.getMousePosition(evt, this.touches[i].targets[0].num);
                                if (pos1[0] < 0 || pos1[0] > this.canvasWidth ||  pos1[1] < 0 || pos1[1] > this.canvasHeight) {
                                    return;
                                }
                                this.touches[i].targets[0].X = evtTouches[this.touches[i].targets[0].num].screenX;
                                this.touches[i].targets[0].Y = evtTouches[this.touches[i].targets[0].num].screenY;
                                this.moveObject(pos1[0], pos1[1], this.touches[i], evt, 'touch');
                            }
                            // Touch by two fingers: moving lines
                        } else if (this.touches[i].targets.length === 2 && this.touches[i].targets[0].num > -1 && this.touches[i].targets[1].num > -1) {
                            if (evtTouches[this.touches[i].targets[0].num] && evtTouches[this.touches[i].targets[1].num]) {
                                pos1 = this.getMousePosition(evt, this.touches[i].targets[0].num);
                                pos2 = this.getMousePosition(evt, this.touches[i].targets[1].num);
                                if (pos1[0] < 0 || pos1[0] > this.canvasWidth ||  pos1[1] < 0 || pos1[1] > this.canvasHeight ||
                                        pos2[0] < 0 || pos2[0] > this.canvasWidth ||  pos2[1] < 0 || pos2[1] > this.canvasHeight) {
                                    return;
                                }
                                this.touches[i].targets[0].X = evtTouches[this.touches[i].targets[0].num].screenX;
                                this.touches[i].targets[0].Y = evtTouches[this.touches[i].targets[0].num].screenY;
                                this.touches[i].targets[1].X = evtTouches[this.touches[i].targets[1].num].screenX;
                                this.touches[i].targets[1].Y = evtTouches[this.touches[i].targets[1].num].screenY;
                                this.twoFingerMove(pos1, pos2, this.touches[i], evt);
                            }
                        }
                    }
                }
            }

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.renderer.hide(this.infobox);
            }

            /*
              this.updateQuality = this.BOARD_QUALITY_HIGH; is set in touchEnd
            */
            this.options.precision.hasPoint = this.options.precision.mouse;
            this.triggerEventHandlers(['touchmove', 'move'], [evt, this.mode]);

            return this.mode === this.BOARD_MODE_NONE;
        },

        /**
         * Triggered as soon as the user stops touching the device with at least one finger.
         * @param {Event} evt
         * @return {Boolean}
         */
        touchEndListener: function (evt) {
            var i, j, k,
                eps = this.options.precision.touch,
                tmpTouches = [], found, foundNumber,
                evtTouches = evt && evt[JXG.touchProperty];

            this.triggerEventHandlers(['touchend', 'up'], [evt]);
            this.renderer.hide(this.infobox);

            if (evtTouches && evtTouches.length > 0) {
                for (i = 0; i < this.touches.length; i++) {
                    tmpTouches[i] = this.touches[i];
                }
                this.touches.length = 0;

                // try to convert the operation, e.g. if a lines is rotated and translated with two fingers and one finger is lifted,
                // convert the operation to a simple one-finger-translation.
                // ADDENDUM 11/10/11:
                // see addendum to touchStartListener from 11/10/11
                // (1) run through the tmptouches
                // (2) check the touches.obj, if it is a
                //     (a) point, try to find the targettouch, if found keep it and mark the targettouch, else drop the touch.
                //     (b) line with
                //          (i) one target: try to find it, if found keep it mark the targettouch, else drop the touch.
                //         (ii) two targets: if none can be found, drop the touch. if one can be found, remove the other target. mark all found targettouches
                //     (c) circle with [proceed like in line]

                // init the targettouches marker
                for (i = 0; i < evtTouches.length; i++) {
                    evtTouches[i].jxg_isused = false;
                }

                for (i = 0; i < tmpTouches.length; i++) {
                    // could all targets of the current this.touches.obj be assigned to targettouches?
                    found = false;
                    foundNumber = 0;

                    for (j = 0; j < tmpTouches[i].targets.length; j++) {
                        tmpTouches[i].targets[j].found = false;
                        for (k = 0; k < evtTouches.length; k++) {
                            if (Math.abs(Math.pow(evtTouches[k].screenX - tmpTouches[i].targets[j].X, 2) + Math.pow(evtTouches[k].screenY - tmpTouches[i].targets[j].Y, 2)) < eps * eps) {
                                tmpTouches[i].targets[j].found = true;
                                tmpTouches[i].targets[j].num = k;
                                tmpTouches[i].targets[j].X = evtTouches[k].screenX;
                                tmpTouches[i].targets[j].Y = evtTouches[k].screenY;
                                foundNumber += 1;
                                break;
                            }
                        }
                    }

                    if (Type.isPoint(tmpTouches[i].obj)) {
                        found = (tmpTouches[i].targets[0] && tmpTouches[i].targets[0].found);
                    } else if (tmpTouches[i].obj.elementClass === Const.OBJECT_CLASS_LINE) {
                        found = (tmpTouches[i].targets[0] && tmpTouches[i].targets[0].found) || (tmpTouches[i].targets[1] && tmpTouches[i].targets[1].found);
                    } else if (tmpTouches[i].obj.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                        found = foundNumber === 1 || foundNumber === 3;
                    }

                    // if we found this object to be still dragged by the user, add it back to this.touches
                    if (found) {
                        this.touches.push({
                            obj: tmpTouches[i].obj,
                            targets: []
                        });

                        for (j = 0; j < tmpTouches[i].targets.length; j++) {
                            if (tmpTouches[i].targets[j].found) {
                                this.touches[this.touches.length - 1].targets.push({
                                    num: tmpTouches[i].targets[j].num,
                                    X: tmpTouches[i].targets[j].screenX,
                                    Y: tmpTouches[i].targets[j].screenY,
                                    Xprev: NaN,
                                    Yprev: NaN,
                                    Xstart: tmpTouches[i].targets[j].Xstart,
                                    Ystart: tmpTouches[i].targets[j].Ystart,
                                    Zstart: tmpTouches[i].targets[j].Zstart
                                });
                            }
                        }

                    } else {
                        tmpTouches[i].obj.noHighlight();
                    }
                }

            } else {
                this.touches.length = 0;
            }

            for (i = this.downObjects.length - 1; i > -1; i--) {
                found = false;
                for (j = 0; j < this.touches.length; j++) {
                    if (this.touches[j].obj.id === this.downObjects[i].id) {
                        found = true;
                    }
                }
                if (!found) {
                    this.downObjects[i].triggerEventHandlers(['touchup', 'up'], [evt]);
                    this.downObjects[i].snapToGrid();
                    this.downObjects[i].snapToPoints();
                    this.downObjects.splice(i, 1);
                }
            }

            if (!evtTouches || evtTouches.length === 0) {

                if (this.hasTouchEnd) {
                    Env.removeEvent(this.document, 'touchend', this.touchEndListener, this);
                    this.hasTouchEnd = false;
                }

                this.dehighlightAll();
                this.updateQuality = this.BOARD_QUALITY_HIGH;

                this.originMoveEnd();
                this.update();
            }

            return true;
        },

        /**
         * This method is called by the browser when the mouse button is clicked.
         * @param {Event} evt The browsers event object.
         * @returns {Boolean} True if no element is found under the current mouse pointer, false otherwise.
         */
        mouseDownListener: function (evt) {
            var pos, elements, result;

            // prevent accidental selection of text
            if (this.document.selection && typeof this.document.selection.empty === 'function') {
                this.document.selection.empty();
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            if (!this.hasMouseUp) {
                Env.addEvent(this.document, 'mouseup', this.mouseUpListener, this);
                this.hasMouseUp = true;
            } else {
                // In case this.hasMouseUp==true, it may be that there was a
                // mousedown event before which was not followed by an mouseup event.
                // This seems to happen with interactive whiteboard pens sometimes.
                return;
            }

            pos = this.getMousePosition(evt);
            elements = this.initMoveObject(pos[0], pos[1], evt, 'mouse');

            // if no draggable object can be found, get out here immediately
            if (elements.length === 0) {
                this.mode = this.BOARD_MODE_NONE;
                result = true;
            } else {
                this.mouse = {
                    obj: null,
                    targets: [{
                        X: pos[0],
                        Y: pos[1],
                        Xprev: NaN,
                        Yprev: NaN
                    }]
                };
                this.mouse.obj = elements[elements.length - 1];

                this.dehighlightAll();
                this.mouse.obj.highlight(true);

                this.mouse.targets[0].Xstart = [];
                this.mouse.targets[0].Ystart = [];
                this.mouse.targets[0].Zstart = [];

                this.saveStartPos(this.mouse.obj, this.mouse.targets[0]);

                // prevent accidental text selection
                // this could get us new trouble: input fields, links and drop down boxes placed as text
                // on the board don't work anymore.
                if (evt && evt.preventDefault) {
                    evt.preventDefault();
                } else if (window.event) {
                    window.event.returnValue = false;
                }
            }

            if (this.mode === this.BOARD_MODE_NONE) {
                result = this.mouseOriginMoveStart(evt);
            }

            this.triggerEventHandlers(['mousedown', 'down'], [evt]);

            return result;
        },

        /**
         * This method is called by the browser when the mouse button is released.
         * @param {Event} evt
         */
        mouseUpListener: function (evt) {
            var i;

            this.triggerEventHandlers(['mouseup', 'up'], [evt]);

            // redraw with high precision
            this.updateQuality = this.BOARD_QUALITY_HIGH;

            if (this.mouse && this.mouse.obj) {
                // The parameter is needed for lines with snapToGrid enabled
                this.mouse.obj.snapToGrid(this.mouse.targets[0]);
                this.mouse.obj.snapToPoints();
            }

            this.originMoveEnd();
            this.dehighlightAll();
            this.update();

            for (i = 0; i < this.downObjects.length; i++) {
                this.downObjects[i].triggerEventHandlers(['mouseup', 'up'], [evt]);
            }

            this.downObjects.length = 0;

            if (this.hasMouseUp) {
                Env.removeEvent(this.document, 'mouseup', this.mouseUpListener, this);
                this.hasMouseUp = false;
            }

            // release dragged mouse object
            this.mouse = null;
        },

        /**
         * This method is called by the browser when the mouse is moved.
         * @param {Event} evt The browsers event object.
         */
        mouseMoveListener: function (evt) {
            var pos;

            pos = this.getMousePosition(evt);

            this.updateQuality = this.BOARD_QUALITY_LOW;

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.dehighlightAll();
                this.renderer.hide(this.infobox);
            }

            // we have to check for three cases:
            //   * user moves origin
            //   * user drags an object
            //   * user just moves the mouse, here highlight all elements at
            //     the current mouse position

            if (!this.mouseOriginMove(evt)) {
                if (this.mode === this.BOARD_MODE_DRAG) {
                    this.moveObject(pos[0], pos[1], this.mouse, evt, 'mouse');
                } else { // BOARD_MODE_NONE
                    this.highlightElements(pos[0], pos[1], evt, -1);
                }
            }

            this.updateQuality = this.BOARD_QUALITY_HIGH;

            this.triggerEventHandlers(['mousemove', 'move'], [evt, this.mode]);
        },

        /**
         * Handler for mouse wheel events. Used to zoom in and out of the board.
         * @param {Event} evt
         * @returns {Boolean}
         */
        mouseWheelListener: function (evt) {
            if (!this.attr.zoom.wheel || (this.attr.zoom.needshift && !evt.shiftKey)) {
                return true;
            }

            evt = evt || window.event;
            var wd = evt.detail ? -evt.detail : evt.wheelDelta / 40,
                pos = new Coords(Const.COORDS_BY_SCREEN, this.getMousePosition(evt), this);

            if (wd > 0) {
                this.zoomIn(pos.usrCoords[1], pos.usrCoords[2]);
            } else {
                this.zoomOut(pos.usrCoords[1], pos.usrCoords[2]);
            }

            evt.preventDefault();
            return false;
        },

        /**********************************************************
         *
         * End of Event Handlers
         *
         **********************************************************/

        /**
         * Updates and displays a little info box to show coordinates of current selected points.
         * @param {JXG.GeometryElement} el A GeometryElement
         * @returns {JXG.Board} Reference to the board
         */
        updateInfobox: function (el) {
            var x, y, xc, yc;

            if (!el.visProp.showinfobox) {
                return this;
            }
            if (Type.isPoint(el)) {
                xc = el.coords.usrCoords[1];
                yc = el.coords.usrCoords[2];

                this.infobox.setCoords(xc + this.infobox.distanceX / this.unitX, yc + this.infobox.distanceY / this.unitY);

                if (typeof el.infoboxText !== 'string') {
                    if (el.visProp.infoboxdigits === 'auto') {
                        x = Type.autoDigits(xc);
                        y = Type.autoDigits(yc);
                    } else if (Type.isNumber(el.visProp.infoboxdigits)) {
                        x = xc.toFixed(el.visProp.infoboxdigits);
                        y = yc.toFixed(el.visProp.infoboxdigits);
                    } else {
                        x = xc;
                        y = yc;
                    }

                    this.highlightInfobox(x, y, el);
                } else {
                    this.highlightCustomInfobox(el.infoboxText, el);
                }

                this.renderer.show(this.infobox);
            }
            return this;
        },

        /**
         * Changes the text of the info box to what is provided via text.
         * @param {String} text
         * @param {JXG.GeometryElement} [el]
         * @returns {JXG.Board} Reference to the board.
         */
        highlightCustomInfobox: function (text, el) {
            this.infobox.setText(text);
            return this;
        },

        /**
         * Changes the text of the info box to show the given coordinates.
         * @param {Number} x
         * @param {Number} y
         * @param {JXG.GeometryElement} [el] The element the mouse is pointing at
         * @returns {JXG.Board} Reference to the board.
         */
        highlightInfobox: function (x, y, el) {
            this.highlightCustomInfobox('(' + x + ', ' + y + ')', el);
            return this;
        },

        /**
         * Remove highlighting of all elements.
         * @returns {JXG.Board} Reference to the board.
         */
        dehighlightAll: function () {
            var el, pEl, needsDehighlight = false;

            for (el in this.highlightedObjects) {
                if (this.highlightedObjects.hasOwnProperty(el)) {
                    pEl = this.highlightedObjects[el];

                    if (this.hasMouseHandlers || this.hasPointerHandlers) {
                        pEl.noHighlight();
                    }

                    needsDehighlight = true;

                    // In highlightedObjects should only be objects which fulfill all these conditions
                    // And in case of complex elements, like a turtle based fractal, it should be faster to
                    // just de-highlight the element instead of checking hasPoint...
                    // if ((!Type.exists(pEl.hasPoint)) || !pEl.hasPoint(x, y) || !pEl.visProp.visible)
                }
            }

            this.highlightedObjects = {};

            // We do not need to redraw during dehighlighting in CanvasRenderer
            // because we are redrawing anyhow
            //  -- We do need to redraw during dehighlighting. Otherwise objects won't be dehighlighted until
            // another object is highlighted.
            if (this.renderer.type === 'canvas' && needsDehighlight) {
                this.prepareUpdate();
                this.renderer.suspendRedraw(this);
                this.updateRenderer();
                this.renderer.unsuspendRedraw();
            }

            return this;
        },

        /**
         * Returns the input parameters in an array. This method looks pointless and it really is, but it had a purpose
         * once.
         * @param {Number} x X coordinate in screen coordinates
         * @param {Number} y Y coordinate in screen coordinates
         * @returns {Array} Coordinates of the mouse in screen coordinates.
         */
        getScrCoordsOfMouse: function (x, y) {
            return [x, y];
        },

        /**
         * This method calculates the user coords of the current mouse coordinates.
         * @param {Event} evt Event object containing the mouse coordinates.
         * @returns {Array} Coordinates of the mouse in screen coordinates.
         */
        getUsrCoordsOfMouse: function (evt) {
            var cPos = this.getCoordsTopLeftCorner(),
                absPos = Env.getPosition(evt, null, this.document),
                x = absPos[0] - cPos[0],
                y = absPos[1] - cPos[1],
                newCoords = new Coords(Const.COORDS_BY_SCREEN, [x, y], this);

            return newCoords.usrCoords.slice(1);
        },

        /**
         * Collects all elements under current mouse position plus current user coordinates of mouse cursor.
         * @param {Event} evt Event object containing the mouse coordinates.
         * @returns {Array} Array of elements at the current mouse position plus current user coordinates of mouse.
         */
        getAllUnderMouse: function (evt) {
            var elList = this.getAllObjectsUnderMouse(evt);
            elList.push(this.getUsrCoordsOfMouse(evt));

            return elList;
        },

        /**
         * Collects all elements under current mouse position.
         * @param {Event} evt Event object containing the mouse coordinates.
         * @returns {Array} Array of elements at the current mouse position.
         */
        getAllObjectsUnderMouse: function (evt) {
            var cPos = this.getCoordsTopLeftCorner(),
                absPos = Env.getPosition(evt, null, this.document),
                dx = absPos[0] - cPos[0],
                dy = absPos[1] - cPos[1],
                elList = [],
                el,
                pEl,
                len = this.objectsList.length;

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                if (pEl.visProp.visible && pEl.hasPoint && pEl.hasPoint(dx, dy)) {
                    elList[elList.length] = pEl;
                }
            }

            return elList;
        },

        /**
         * Update the coords object of all elements which possess this
         * property. This is necessary after changing the viewport.
         * @returns {JXG.Board} Reference to this board.
         **/
        updateCoords: function () {
            var el, ob, len = this.objectsList.length;

            for (ob = 0; ob < len; ob++) {
                el = this.objectsList[ob];

                if (Type.exists(el.coords)) {
                    if (el.visProp.frozen) {
                        el.coords.screen2usr();
                    } else {
                        el.coords.usr2screen();
                    }
                }
            }
            return this;
        },

        /**
         * Moves the origin and initializes an update of all elements.
         * @param {Number} x
         * @param {Number} y
         * @param {Boolean} [diff=false]
         * @returns {JXG.Board} Reference to this board.
         */
        moveOrigin: function (x, y, diff) {
            if (Type.exists(x) && Type.exists(y)) {
                this.origin.scrCoords[1] = x;
                this.origin.scrCoords[2] = y;

                if (diff) {
                    this.origin.scrCoords[1] -= this.drag_dx;
                    this.origin.scrCoords[2] -= this.drag_dy;
                }
            }

            this.updateCoords().clearTraces().fullUpdate();

            this.triggerEventHandlers(['boundingbox']);

            return this;
        },

        /**
         * Add conditional updates to the elements.
         * @param {String} str String containing coniditional update in geonext syntax
         */
        addConditions: function (str) {
            var term, m, left, right, name, el, property,
                functions = [],
                plaintext = 'var el, x, y, c, rgbo;\n',
                i = str.indexOf('<data>'),
                j = str.indexOf('<' + '/data>'),

                xyFun = function (board, el, f, what) {
                    return function () {
                        var e, t;

                        e = board.select(el.id);
                        t = e.coords.usrCoords[what];

                        if (what === 2) {
                            e.setPositionDirectly(Const.COORDS_BY_USER, [f(), t]);
                        } else {
                            e.setPositionDirectly(Const.COORDS_BY_USER, [t, f()]);
                        }
                        e.prepareUpdate().update();
                    };
                },

                visFun = function (board, el, f) {
                    return function () {
                        var e, v;

                        e = board.select(el.id);
                        v = f();

                        e.setAttribute({visible: v});
                    };
                },

                colFun = function (board, el, f, what) {
                    return function () {
                        var e, v;

                        e = board.select(el.id);
                        v = f();

                        if (what === 'strokewidth') {
                            e.visProp.strokewidth = v;
                        } else {
                            v = Color.rgba2rgbo(v);
                            e.visProp[what + 'color'] = v[0];
                            e.visProp[what + 'opacity'] = v[1];
                        }
                    };
                },

                posFun = function (board, el, f) {
                    return function () {
                        var e = board.select(el.id);

                        e.position = f();
                    };
                },

                styleFun = function (board, el, f) {
                    return function () {
                        var e = board.select(el.id);

                        e.setStyle(f());
                    };
                };

            if (i < 0) {
                return;
            }

            while (i >= 0) {
                term = str.slice(i + 6, j);   // throw away <data>
                m = term.indexOf('=');
                left = term.slice(0, m);
                right = term.slice(m + 1);
                m = left.indexOf('.');     // Dies erzeugt Probleme bei Variablennamen der Form " Steuern akt."
                name = left.slice(0, m);    //.replace(/\s+$/,''); // do NOT cut out name (with whitespace)
                el = this.elementsByName[Type.unescapeHTML(name)];

                property = left.slice(m + 1).replace(/\s+/g, '').toLowerCase(); // remove whitespace in property
                right = Type.createFunction(right, this, '', true);

                // Debug
                if (!Type.exists(this.elementsByName[name])) {
                    JXG.debug("debug conditions: |" + name + "| undefined");
                } else {
                    plaintext += "el = this.objects[\"" + el.id + "\"];\n";

                    switch (property) {
                    case 'x':
                        functions.push(xyFun(this, el, right, 2));
                        break;
                    case 'y':
                        functions.push(xyFun(this, el, right, 1));
                        break;
                    case 'visible':
                        functions.push(visFun(this, el, right));
                        break;
                    case 'position':
                        functions.push(posFun(this, el, right));
                        break;
                    case 'stroke':
                        functions.push(colFun(this, el, right, 'stroke'));
                        break;
                    case 'style':
                        functions.push(styleFun(this, el, right));
                        break;
                    case 'strokewidth':
                        functions.push(colFun(this, el, right, 'strokewidth'));
                        break;
                    case 'fill':
                        functions.push(colFun(this, el, right, 'fill'));
                        break;
                    case 'label':
                        break;
                    default:
                        JXG.debug("property '" + property + "' in conditions not yet implemented:" + right);
                        break;
                    }
                }
                str = str.slice(j + 7); // cut off "</data>"
                i = str.indexOf('<data>');
                j = str.indexOf('<' + '/data>');
            }

            this.updateConditions = function () {
                var i;

                for (i = 0; i < functions.length; i++) {
                    functions[i]();
                }

                this.prepareUpdate().updateElements();
                return true;
            };
            this.updateConditions();
        },

        /**
         * Computes the commands in the conditions-section of the gxt file.
         * It is evaluated after an update, before the unsuspendRedraw.
         * The function is generated in
         * @see JXG.Board#addConditions
         * @private
         */
        updateConditions: function () {
            return false;
        },

        /**
         * Calculates adequate snap sizes.
         * @returns {JXG.Board} Reference to the board.
         */
        calculateSnapSizes: function () {
            var p1 = new Coords(Const.COORDS_BY_USER, [0, 0], this),
                p2 = new Coords(Const.COORDS_BY_USER, [this.options.grid.gridX, this.options.grid.gridY], this),
                x = p1.scrCoords[1] - p2.scrCoords[1],
                y = p1.scrCoords[2] - p2.scrCoords[2];

            this.options.grid.snapSizeX = this.options.grid.gridX;
            while (Math.abs(x) > 25) {
                this.options.grid.snapSizeX *= 2;
                x /= 2;
            }

            this.options.grid.snapSizeY = this.options.grid.gridY;
            while (Math.abs(y) > 25) {
                this.options.grid.snapSizeY *= 2;
                y /= 2;
            }

            return this;
        },

        /**
         * Apply update on all objects with the new zoom-factors. Clears all traces.
         * @returns {JXG.Board} Reference to the board.
         */
        applyZoom: function () {
            this.updateCoords().calculateSnapSizes().clearTraces().fullUpdate();

            return this;
        },

        /**
         * Zooms into the board by the factors board.attr.zoom.factorX and board.attr.zoom.factorY and applies the zoom.
         * @param {Number} [x]
         * @param {Number} [y]
         * @returns {JXG.Board} Reference to the board
         */
        zoomIn: function (x, y) {
            var bb = this.getBoundingBox(),
                zX = this.attr.zoom.factorx,
                zY = this.attr.zoom.factory,
                dX = (bb[2] - bb[0]) * (1.0 - 1.0 / zX),
                dY = (bb[1] - bb[3]) * (1.0 - 1.0 / zY),
                lr = 0.5,
                tr = 0.5;

            if (typeof x === 'number' && typeof y === 'number') {
                lr = (x - bb[0]) / (bb[2] - bb[0]);
                tr = (bb[1] - y) / (bb[1] - bb[3]);
            }

            this.setBoundingBox([bb[0] + dX * lr, bb[1] - dY * tr, bb[2] - dX * (1 - lr), bb[3] + dY * (1 - tr)], false);
            this.zoomX *= zX;
            this.zoomY *= zY;
            this.applyZoom();

            return false;
        },

        /**
         * Zooms out of the board by the factors board.attr.zoom.factorX and board.attr.zoom.factorY and applies the zoom.
         * @param {Number} [x]
         * @param {Number} [y]
         * @returns {JXG.Board} Reference to the board
         */
        zoomOut: function (x, y) {
            var bb = this.getBoundingBox(),
                zX = this.attr.zoom.factorx,
                zY = this.attr.zoom.factory,
                dX = (bb[2] - bb[0]) * (1.0 - zX),
                dY = (bb[1] - bb[3]) * (1.0 - zY),
                lr = 0.5,
                tr = 0.5;

            if (this.zoomX < this.attr.zoom.eps || this.zoomY < this.attr.zoom.eps) {
                return false;
            }

            if (typeof x === 'number' && typeof y === 'number') {
                lr = (x - bb[0]) / (bb[2] - bb[0]);
                tr = (bb[1] - y) / (bb[1] - bb[3]);
            }

            this.setBoundingBox([bb[0] + dX * lr, bb[1] - dY * tr, bb[2] - dX * (1 - lr), bb[3] + dY * (1 - tr)], false);
            this.zoomX /= zX;
            this.zoomY /= zY;

            this.applyZoom();
            return false;
        },

        /**
         * Resets zoom factor to 100%.
         * @returns {JXG.Board} Reference to the board
         */
        zoom100: function () {
            var bb = this.getBoundingBox(),
                dX = (bb[2] - bb[0]) * (1.0 - this.zoomX) * 0.5,
                dY = (bb[1] - bb[3]) * (1.0 - this.zoomY) * 0.5;

            this.setBoundingBox([bb[0] + dX, bb[1] - dY, bb[2] - dX, bb[3] + dY], false);
            this.zoomX = 1.0;
            this.zoomY = 1.0;
            this.applyZoom();
            return false;
        },

        /**
         * Zooms the board so every visible point is shown. Keeps aspect ratio.
         * @returns {JXG.Board} Reference to the board
         */
        zoomAllPoints: function () {
            var el, border, borderX, borderY, pEl,
                minX = 0,
                maxX = 0,
                minY = 0,
                maxY = 0,
                len = this.objectsList.length;

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];

                if (Type.isPoint(pEl) && pEl.visProp.visible) {
                    if (pEl.coords.usrCoords[1] < minX) {
                        minX = pEl.coords.usrCoords[1];
                    } else if (pEl.coords.usrCoords[1] > maxX) {
                        maxX = pEl.coords.usrCoords[1];
                    }
                    if (pEl.coords.usrCoords[2] > maxY) {
                        maxY = pEl.coords.usrCoords[2];
                    } else if (pEl.coords.usrCoords[2] < minY) {
                        minY = pEl.coords.usrCoords[2];
                    }
                }
            }

            border = 50;
            borderX = border / this.unitX;
            borderY = border / this.unitY;

            this.zoomX = 1.0;
            this.zoomY = 1.0;

            this.setBoundingBox([minX - borderX, maxY + borderY, maxX + borderX, minY - borderY], true);

            this.applyZoom();

            return this;
        },

        /**
         * Reset the bounding box and the zoom level to 100% such that a given set of elements is within the board's viewport.
         * @param {Array} elements A set of elements given by id, reference, or name.
         * @returns {JXG.Board} Reference to the board.
         */
        zoomElements: function (elements) {
            var i, j, e, box,
                newBBox = [0, 0, 0, 0],
                dir = [1, -1, -1, 1];

            if (!Type.isArray(elements) || elements.length === 0) {
                return this;
            }

            for (i = 0; i < elements.length; i++) {
                e = this.select(elements[i]);

                box = e.bounds();
                if (Type.isArray(box)) {
                    if (Type.isArray(newBBox)) {
                        for (j = 0; j < 4; j++) {
                            if (dir[j] * box[j] < dir[j] * newBBox[j]) {
                                newBBox[j] = box[j];
                            }
                        }
                    } else {
                        newBBox = box;
                    }
                }
            }

            if (Type.isArray(newBBox)) {
                for (j = 0; j < 4; j++) {
                    newBBox[j] -= dir[j];
                }

                this.zoomX = 1.0;
                this.zoomY = 1.0;
                this.setBoundingBox(newBBox, true);
            }

            return this;
        },

        /**
         * Sets the zoom level to <tt>fX</tt> resp <tt>fY</tt>.
         * @param {Number} fX
         * @param {Number} fY
         * @returns {JXG.Board}
         */
        setZoom: function (fX, fY) {
            var oX = this.attr.zoom.factorx,
                oY = this.attr.zoom.factory;

            this.attr.zoom.factorx = fX / this.zoomX;
            this.attr.zoom.factory = fY / this.zoomY;

            this.zoomIn();

            this.attr.zoom.factorx = oX;
            this.attr.zoom.factory = oY;

            return this;
        },

        /**
         * Removes object from board and renderer.
         * @param {JXG.GeometryElement} object The object to remove.
         * @returns {JXG.Board} Reference to the board
         */
        removeObject: function (object) {
            var el, i;

            if (Type.isArray(object)) {
                for (i = 0; i < object.length; i++) {
                    this.removeObject(object[i]);
                }

                return this;
            }

            object = this.select(object);

            // If the object which is about to be removed unknown or a string, do nothing.
            // it is a string if a string was given and could not be resolved to an element.
            if (!Type.exists(object) || Type.isString(object)) {
                return this;
            }

            try {
                // remove all children.
                for (el in object.childElements) {
                    if (object.childElements.hasOwnProperty(el)) {
                        object.childElements[el].board.removeObject(object.childElements[el]);
                    }
                }

                for (el in this.objects) {
                    if (this.objects.hasOwnProperty(el) && Type.exists(this.objects[el].childElements)) {
                        delete this.objects[el].childElements[object.id];
                        delete this.objects[el].descendants[object.id];
                    }
                }

                // remove the object itself from our control structures
                if (object._pos > -1) {
                    this.objectsList.splice(object._pos, 1);
                    for (el = object._pos; el < this.objectsList.length; el++) {
                        this.objectsList[el]._pos--;
                    }
                } else {
                    JXG.debug('Board.removeObject: object ' + object.id + ' not found in list.');
                }
                delete this.objects[object.id];
                delete this.elementsByName[object.name];

                if (object.visProp && object.visProp.trace) {
                    object.clearTrace();
                }

                // the object deletion itself is handled by the object.
                if (Type.exists(object.remove)) {
                    object.remove();
                }
            } catch (e) {
                JXG.debug(object.id + ': Could not be removed: ' + e);
            }

            this.update();

            return this;
        },


        /**
         * Removes the ancestors of an object an the object itself from board and renderer.
         * @param {JXG.GeometryElement} object The object to remove.
         * @returns {JXG.Board} Reference to the board
         */
        removeAncestors: function (object) {
            var anc;

            for (anc in object.ancestors) {
                if (object.ancestors.hasOwnProperty(anc)) {
                    this.removeAncestors(object.ancestors[anc]);
                }
            }

            this.removeObject(object);

            return this;
        },

        /**
         * Initialize some objects which are contained in every GEONExT construction by default,
         * but are not contained in the gxt files.
         * @returns {JXG.Board} Reference to the board
         */
        initGeonextBoard: function () {
            var p1, p2, p3;

            p1 = this.create('point', [0, 0], {
                id: this.id + 'g00e0',
                name: 'Ursprung',
                withLabel: false,
                visible: false,
                fixed: true
            });

            p2 = this.create('point', [1, 0], {
                id: this.id + 'gX0e0',
                name: 'Punkt_1_0',
                withLabel: false,
                visible: false,
                fixed: true
            });

            p3 = this.create('point', [0, 1], {
                id: this.id + 'gY0e0',
                name: 'Punkt_0_1',
                withLabel: false,
                visible: false,
                fixed: true
            });

            this.create('line', [p1, p2], {
                id: this.id + 'gXLe0',
                name: 'X-Achse',
                withLabel: false,
                visible: false
            });

            this.create('line', [p1, p3], {
                id: this.id + 'gYLe0',
                name: 'Y-Achse',
                withLabel: false,
                visible: false
            });

            return this;
        },

        /**
         * Initialize the info box object which is used to display
         * the coordinates of points near the mouse pointer,
         * @returns {JXG.Board} Reference to the board
         */
        initInfobox: function () {
            var  attr = Type.copyAttributes({}, this.options, 'infobox');

            attr.id = this.id + '_infobox';

            this.infobox = this.create('text', [0, 0, '0,0'], attr);

            this.infobox.distanceX = -20;
            this.infobox.distanceY = 25;
            // this.infobox.needsUpdateSize = false;  // That is not true, but it speeds drawing up.

            this.infobox.dump = false;

            this.renderer.hide(this.infobox);
            return this;
        },

        /**
         * Change the height and width of the board's container.
         * After doing so, {@link JXG.JSXGraph#setBoundingBox} is called using
         * the actual size of the bounding box and the actual value of keepaspectratio.
         * If setBoundingbox() should not be called automatically, 
         * call resizeContainer with dontSetBoundingBox == true.
         * @param {Number} canvasWidth New width of the container.
         * @param {Number} canvasHeight New height of the container.
         * @param {Boolean} [dontset=false] If true do not set the height of the DOM element.
         * @param {Boolean} [dontSetBoundingBox=false] If true do not call setBoundingBox().
         * @returns {JXG.Board} Reference to the board
         */
        resizeContainer: function (canvasWidth, canvasHeight, dontset, dontSetBoundingBox) {
            var box;

            if (!dontSetBoundingBox) {
                box = this.getBoundingBox();
            }
            this.canvasWidth = parseInt(canvasWidth, 10);
            this.canvasHeight = parseInt(canvasHeight, 10);

            if (!dontset) {
                this.containerObj.style.width = (this.canvasWidth) + 'px';
                this.containerObj.style.height = (this.canvasHeight) + 'px';
            }

            this.renderer.resize(this.canvasWidth, this.canvasHeight);

            if (!dontSetBoundingBox) {
                this.setBoundingBox(box, this.keepaspectratio);
            }

            return this;
        },

        /**
         * Lists the dependencies graph in a new HTML-window.
         * @returns {JXG.Board} Reference to the board
         */
        showDependencies: function () {
            var el, t, c, f, i;

            t = '<p>\n';
            for (el in this.objects) {
                if (this.objects.hasOwnProperty(el)) {
                    i = 0;
                    for (c in this.objects[el].childElements) {
                        if (this.objects[el].childElements.hasOwnProperty(c)) {
                            i += 1;
                        }
                    }
                    if (i >= 0) {
                        t += '<strong>' + this.objects[el].id + ':<' + '/strong> ';
                    }

                    for (c in this.objects[el].childElements) {
                        if (this.objects[el].childElements.hasOwnProperty(c)) {
                            t += this.objects[el].childElements[c].id + '(' + this.objects[el].childElements[c].name + ')' + ', ';
                        }
                    }
                    t += '<p>\n';
                }
            }
            t += '<' + '/p>\n';
            f = window.open();
            f.document.open();
            f.document.write(t);
            f.document.close();
            return this;
        },

        /**
         * Lists the XML code of the construction in a new HTML-window.
         * @returns {JXG.Board} Reference to the board
         */
        showXML: function () {
            var f = window.open('');
            f.document.open();
            f.document.write('<pre>' + Type.escapeHTML(this.xmlString) + '<' + '/pre>');
            f.document.close();
            return this;
        },

        /**
         * Sets for all objects the needsUpdate flag to "true".
         * @returns {JXG.Board} Reference to the board
         */
        prepareUpdate: function () {
            var el, pEl, len = this.objectsList.length;

            /*
            if (this.attr.updatetype === 'hierarchical') {
                return this;
            }
            */

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                pEl.needsUpdate = pEl.needsRegularUpdate || this.needsFullUpdate;
            }

            for (el in this.groups) {
                if (this.groups.hasOwnProperty(el)) {
                    pEl = this.groups[el];
                    pEl.needsUpdate = pEl.needsRegularUpdate || this.needsFullUpdate;
                }
            }

            return this;
        },

        /**
         * Runs through all elements and calls their update() method.
         * @param {JXG.GeometryElement} drag Element that caused the update.
         * @returns {JXG.Board} Reference to the board
         */
        updateElements: function (drag) {
            var el, pEl;
            //var childId, i = 0;

            drag = this.select(drag);

            /*
            if (Type.exists(drag)) {
                for (el = 0; el < this.objectsList.length; el++) {
                    pEl = this.objectsList[el];
                    if (pEl.id === drag.id) {
                        i = el;
                        break;
                    }
                }
            }
            */

            for (el = 0; el < this.objectsList.length; el++) {
                pEl = this.objectsList[el];
                // For updates of an element we distinguish if the dragged element is updated or
                // other elements are updated.
                // The difference lies in the treatment of gliders.
                pEl.update(!Type.exists(drag) || pEl.id !== drag.id);

                /*
                if (this.attr.updatetype === 'hierarchical') {
                    for (childId in pEl.childElements) {
                        pEl.childElements[childId].needsUpdate = pEl.childElements[childId].needsRegularUpdate;
                    }
                }
                */
            }

            // update groups last
            for (el in this.groups) {
                if (this.groups.hasOwnProperty(el)) {
                    this.groups[el].update(drag);
                }
            }

            return this;
        },

        /**
         * Runs through all elements and calls their update() method.
         * @returns {JXG.Board} Reference to the board
         */
        updateRenderer: function () {
            var el, pEl,
                len = this.objectsList.length;

            /*
            objs = this.objectsList.slice(0);
            objs.sort(function(a, b) {
                if (a.visProp.layer < b.visProp.layer) {
                    return -1;
                } else if (a.visProp.layer === b.visProp.layer) {
                    return b.lastDragTime.getTime() - a.lastDragTime.getTime();
                } else {
                    return 1;
                }
            });
            */

            if (this.renderer.type === 'canvas') {
                this.updateRendererCanvas();
            } else {
                for (el = 0; el < len; el++) {
                    pEl = this.objectsList[el];
                    pEl.updateRenderer();
                }
            }
            return this;
        },

        /**
         * Runs through all elements and calls their update() method.
         * This is a special version for the CanvasRenderer.
         * Here, we have to do our own layer handling.
         * @returns {JXG.Board} Reference to the board
         */
        updateRendererCanvas: function () {
            var el, pEl, i, mini, la,
                olen = this.objectsList.length,
                layers = this.options.layer,
                len = this.options.layer.numlayers,
                last = Number.NEGATIVE_INFINITY;

            for (i = 0; i < len; i++) {
                mini = Number.POSITIVE_INFINITY;

                for (la in layers) {
                    if (layers.hasOwnProperty(la)) {
                        if (layers[la] > last && layers[la] < mini) {
                            mini = layers[la];
                        }
                    }
                }

                last = mini;

                for (el = 0; el < olen; el++) {
                    pEl = this.objectsList[el];

                    if (pEl.visProp.layer === mini) {
                        pEl.prepareUpdate().updateRenderer();
                    }
                }
            }
            return this;
        },

        /**
         * Please use {@link JXG.Board#on} instead.
         * @param {Function} hook A function to be called by the board after an update occured.
         * @param {String} [m='update'] When the hook is to be called. Possible values are <i>mouseup</i>, <i>mousedown</i> and <i>update</i>.
         * @param {Object} [context=board] Determines the execution context the hook is called. This parameter is optional, default is the
         * board object the hook is attached to.
         * @returns {Number} Id of the hook, required to remove the hook from the board.
         * @deprecated
         */
        addHook: function (hook, m, context) {
            m = Type.def(m, 'update');

            context = Type.def(context, this);

            this.hooks.push([m, hook]);
            this.on(m, hook, context);

            return this.hooks.length - 1;
        },

        /**
         * Alias of {@link JXG.Board#on}.
         */
        addEvent: JXG.shortcut(JXG.Board.prototype, 'on'),

        /**
         * Please use {@link JXG.Board#off} instead.
         * @param {Number|function} id The number you got when you added the hook or a reference to the event handler.
         * @returns {JXG.Board} Reference to the board
         * @deprecated
         */
        removeHook: function (id) {
            if (this.hooks[id]) {
                this.off(this.hooks[id][0], this.hooks[id][1]);
                this.hooks[id] = null;
            }

            return this;
        },

        /**
         * Alias of {@link JXG.Board#off}.
         */
        removeEvent: JXG.shortcut(JXG.Board.prototype, 'off'),

        /**
         * Runs through all hooked functions and calls them.
         * @returns {JXG.Board} Reference to the board
         * @deprecated
         */
        updateHooks: function (m) {
            var arg = Array.prototype.slice.call(arguments, 0);

            arg[0] = Type.def(arg[0], 'update');
            this.triggerEventHandlers([arg[0]], arguments);

            return this;
        },

        /**
         * Adds a dependent board to this board.
         * @param {JXG.Board} board A reference to board which will be updated after an update of this board occured.
         * @returns {JXG.Board} Reference to the board
         */
        addChild: function (board) {
            if (Type.exists(board) && Type.exists(board.containerObj)) {
                this.dependentBoards.push(board);
                this.update();
            }
            return this;
        },

        /**
         * Deletes a board from the list of dependent boards.
         * @param {JXG.Board} board Reference to the board which will be removed.
         * @returns {JXG.Board} Reference to the board
         */
        removeChild: function (board) {
            var i;

            for (i = this.dependentBoards.length - 1; i >= 0; i--) {
                if (this.dependentBoards[i] === board) {
                    this.dependentBoards.splice(i, 1);
                }
            }
            return this;
        },

        /**
         * Runs through most elements and calls their update() method and update the conditions.
         * @param {JXG.GeometryElement} [drag] Element that caused the update.
         * @returns {JXG.Board} Reference to the board
         */
        update: function (drag) {
            var i, len, b, insert;

            if (this.inUpdate || this.isSuspendedUpdate) {
                return this;
            }
            this.inUpdate = true;

            if (this.attr.minimizereflow === 'all' && this.containerObj && this.renderer.type !== 'vml') {
                insert = this.renderer.removeToInsertLater(this.containerObj);
            }

            if (this.attr.minimizereflow === 'svg' && this.renderer.type === 'svg') {
                insert = this.renderer.removeToInsertLater(this.renderer.svgRoot);
            }

            this.prepareUpdate().updateElements(drag).updateConditions();

            this.renderer.suspendRedraw(this);
            this.updateRenderer();
            this.renderer.unsuspendRedraw();
            this.triggerEventHandlers(['update'], []);

            if (insert) {
                insert();
            }

            // To resolve dependencies between boards
            // for (var board in JXG.boards) {
            len = this.dependentBoards.length;
            for (i = 0; i < len; i++) {
                b = this.dependentBoards[i];
                if (Type.exists(b) && b !== this) {
                    b.updateQuality = this.updateQuality;
                    b.prepareUpdate().updateElements().updateConditions();
                    b.renderer.suspendRedraw();
                    b.updateRenderer();
                    b.renderer.unsuspendRedraw();
                    b.triggerEventHandlers(['update'], []);
                }

            }

            this.inUpdate = false;
            return this;
        },

        /**
         * Runs through all elements and calls their update() method and update the conditions.
         * This is necessary after zooming and changing the bounding box.
         * @returns {JXG.Board} Reference to the board
         */
        fullUpdate: function () {
            this.needsFullUpdate = true;
            this.update();
            this.needsFullUpdate = false;
            return this;
        },

        /**
         * Adds a grid to the board according to the settings given in board.options.
         * @returns {JXG.Board} Reference to the board.
         */
        addGrid: function () {
            this.create('grid', []);

            return this;
        },

        /**
         * Removes all grids assigned to this board. Warning: This method also removes all objects depending on one or
         * more of the grids.
         * @returns {JXG.Board} Reference to the board object.
         */
        removeGrids: function () {
            var i;

            for (i = 0; i < this.grids.length; i++) {
                this.removeObject(this.grids[i]);
            }

            this.grids.length = 0;
            this.update(); // required for canvas renderer

            return this;
        },

        /**
         * Creates a new geometric element of type elementType.
         * @param {String} elementType Type of the element to be constructed given as a string e.g. 'point' or 'circle'.
         * @param {Array} parents Array of parent elements needed to construct the element e.g. coordinates for a point or two
         * points to construct a line. This highly depends on the elementType that is constructed. See the corresponding JXG.create*
         * methods for a list of possible parameters.
         * @param {Object} [attributes] An object containing the attributes to be set. This also depends on the elementType.
         * Common attributes are name, visible, strokeColor.
         * @returns {Object} Reference to the created element. This is usually a GeometryElement, but can be an array containing
         * two or more elements.
         */
        create: function (elementType, parents, attributes) {
            var el, i;

            elementType = elementType.toLowerCase();

            if (!Type.exists(parents)) {
                parents = [];
            }

            if (!Type.exists(attributes)) {
                attributes = {};
            }

            for (i = 0; i < parents.length; i++) {
                if (typeof parents[i] === 'string' && (elementType !== 'text' || i !== 2)) {
                    parents[i] = this.select(parents[i]);
                }
            }

            if (typeof JXG.elements[elementType] === 'function') {
                el = JXG.elements[elementType](this, parents, attributes);
            } else {
                throw new Error("JSXGraph: create: Unknown element type given: " + elementType);
            }

            if (!Type.exists(el)) {
                JXG.debug("JSXGraph: create: failure creating " + elementType);
                return el;
            }

            if (el.prepareUpdate && el.update && el.updateRenderer) {
                el.prepareUpdate().update().updateRenderer();
            }
            return el;
        },

        /**
         * Deprecated name for {@link JXG.Board#create}.
         * @deprecated
         */
        createElement: JXG.shortcut(JXG.Board.prototype, 'create'),


        /**
         * Delete the elements drawn as part of a trace of an element.
         * @returns {JXG.Board} Reference to the board
         */
        clearTraces: function () {
            var el;

            for (el = 0; el < this.objectsList.length; el++) {
                this.objectsList[el].clearTrace();
            }

            this.numTraces = 0;
            return this;
        },

        /**
         * Stop updates of the board.
         * @returns {JXG.Board} Reference to the board
         */
        suspendUpdate: function () {
            if (!this.inUpdate) {
                this.isSuspendedUpdate = true;
            }
            return this;
        },

        /**
         * Enable updates of the board.
         * @returns {JXG.Board} Reference to the board
         */
        unsuspendUpdate: function () {
            if (this.isSuspendedUpdate) {
                this.isSuspendedUpdate = false;
                this.update();
            }
            return this;
        },

        /**
         * Set the bounding box of the board.
         * @param {Array} bbox New bounding box [x1,y1,x2,y2]
         * @param {Boolean} [keepaspectratio=false] If set to true, the aspect ratio will be 1:1, but
         * the resulting viewport may be larger.
         * @returns {JXG.Board} Reference to the board
         */
        setBoundingBox: function (bbox, keepaspectratio) {
            var h, w,
                dim = Env.getDimensions(this.container, this.document);

            if (!Type.isArray(bbox)) {
                return this;
            }

            this.plainBB = bbox;

            this.canvasWidth = parseInt(dim.width, 10);
            this.canvasHeight = parseInt(dim.height, 10);
            w = this.canvasWidth;
            h = this.canvasHeight;

            if (keepaspectratio) {
                this.unitX = w / (bbox[2] - bbox[0]);
                this.unitY = h / (bbox[1] - bbox[3]);
                if (Math.abs(this.unitX) < Math.abs(this.unitY)) {
                    this.unitY = Math.abs(this.unitX) * this.unitY / Math.abs(this.unitY);
                } else {
                    this.unitX = Math.abs(this.unitY) * this.unitX / Math.abs(this.unitX);
                }
                this.keepaspectratio = true;
            } else {
                this.unitX = w / (bbox[2] - bbox[0]);
                this.unitY = h / (bbox[1] - bbox[3]);
                this.keepaspectratio = false;
            }

            this.moveOrigin(-this.unitX * bbox[0], this.unitY * bbox[1]);

            return this;
        },

        /**
         * Get the bounding box of the board.
         * @returns {Array} bounding box [x1,y1,x2,y2] upper left corner, lower right corner
         */
        getBoundingBox: function () {
            var ul = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this),
                lr = new Coords(Const.COORDS_BY_SCREEN, [this.canvasWidth, this.canvasHeight], this);

            return [ul.usrCoords[1], ul.usrCoords[2], lr.usrCoords[1], lr.usrCoords[2]];
        },

        /**
         * Adds an animation. Animations are controlled by the boards, so the boards need to be aware of the
         * animated elements. This function tells the board about new elements to animate.
         * @param {JXG.GeometryElement} element The element which is to be animated.
         * @returns {JXG.Board} Reference to the board
         */
        addAnimation: function (element) {
            var that = this;

            this.animationObjects[element.id] = element;

            if (!this.animationIntervalCode) {
                this.animationIntervalCode = window.setInterval(function () {
                    that.animate();
                }, element.board.attr.animationdelay);
            }

            return this;
        },

        /**
         * Cancels all running animations.
         * @returns {JXG.Board} Reference to the board
         */
        stopAllAnimation: function () {
            var el;

            for (el in this.animationObjects) {
                if (this.animationObjects.hasOwnProperty(el) && Type.exists(this.animationObjects[el])) {
                    this.animationObjects[el] = null;
                    delete this.animationObjects[el];
                }
            }

            window.clearInterval(this.animationIntervalCode);
            delete this.animationIntervalCode;

            return this;
        },

        /**
         * General purpose animation function. This currently only supports moving points from one place to another. This
         * is faster than managing the animation per point, especially if there is more than one animated point at the same time.
         * @returns {JXG.Board} Reference to the board
         */
        animate: function () {
            var props, el, o, newCoords, r, p, c, cbtmp,
                count = 0,
                obj = null;

            for (el in this.animationObjects) {
                if (this.animationObjects.hasOwnProperty(el) && Type.exists(this.animationObjects[el])) {
                    count += 1;
                    o = this.animationObjects[el];

                    if (o.animationPath) {
                        if (Type.isFunction(o.animationPath)) {
                            newCoords = o.animationPath(new Date().getTime() - o.animationStart);
                        } else {
                            newCoords = o.animationPath.pop();
                        }

                        if ((!Type.exists(newCoords)) || (!Type.isArray(newCoords) && isNaN(newCoords))) {
                            delete o.animationPath;
                        } else {
                            o.setPositionDirectly(Const.COORDS_BY_USER, newCoords);
                            o.prepareUpdate().update().updateRenderer();
                            obj = o;
                        }
                    }
                    if (o.animationData) {
                        c = 0;

                        for (r in o.animationData) {
                            if (o.animationData.hasOwnProperty(r)) {
                                p = o.animationData[r].pop();

                                if (!Type.exists(p)) {
                                    delete o.animationData[p];
                                } else {
                                    c += 1;
                                    props = {};
                                    props[r] = p;
                                    o.setAttribute(props);
                                }
                            }
                        }

                        if (c === 0) {
                            delete o.animationData;
                        }
                    }

                    if (!Type.exists(o.animationData) && !Type.exists(o.animationPath)) {
                        this.animationObjects[el] = null;
                        delete this.animationObjects[el];

                        if (Type.exists(o.animationCallback)) {
                            cbtmp = o.animationCallback;
                            o.animationCallback = null;
                            cbtmp();
                        }
                    }
                }
            }

            if (count === 0) {
                window.clearInterval(this.animationIntervalCode);
                delete this.animationIntervalCode;
            } else {
                this.update(obj);
            }

            return this;
        },

        /**
         * Migrate the dependency properties of the point src
         * to the point dest and  delete the point src.
         * For example, a circle around the point src
         * receives the new center dest. The old center src
         * will be deleted.
         * @param {JXG.Point} src Original point which will be deleted
         * @param {JXG.Point} dest New point with the dependencies of src.
         * @param {Boolean} copyName Flag which decides if the name of the src element is copied to the
         *  dest element.
         * @returns {JXG.Board} Reference to the board
         */
        migratePoint: function (src, dest, copyName) {
            var child, childId, prop, found, i, srcLabelId, srcHasLabel = false;

            src = this.select(src);
            dest = this.select(dest);

            if (JXG.exists(src.label)) {
                srcLabelId = src.label.id;
                srcHasLabel = true;
                this.removeObject(src.label);
            }

            for (childId in src.childElements) {
                if (src.childElements.hasOwnProperty(childId)) {
                    child = src.childElements[childId];
                    found = false;

                    for (prop in child) {
                        if (child.hasOwnProperty(prop)) {
                            if (child[prop] ===  src) {
                                child[prop] = dest;
                                found = true;
                            }
                        }
                    }

                    if (found) {
                        delete src.childElements[childId];
                    }

                    for (i = 0; i < child.parents.length; i++) {
                        if (child.parents[i] === src.id) {
                            child.parents[i] = dest.id;
                        }
                    }

                    dest.addChild(child);
                }
            }

            // The destination object should receive the name
            // and the label of the originating (src) object
            if (copyName) {
                if (srcHasLabel) {
                    delete dest.childElements[srcLabelId];
                    delete dest.descendants[srcLabelId];
                }

                if (dest.label) {
                    this.removeObject(dest.label);
                }

                delete this.elementsByName[dest.name];
                dest.name = src.name;
                if (srcHasLabel) {
                    dest.createLabel();
                }
            }

            this.removeObject(src);

            if (Type.exists(dest.name) && dest.name !== '') {
                this.elementsByName[dest.name] = dest;
            }

            this.update();

            return this;
        },

        /**
         * Initializes color blindness simulation.
         * @param {String} deficiency Describes the color blindness deficiency which is simulated. Accepted values are 'protanopia', 'deuteranopia', and 'tritanopia'.
         * @returns {JXG.Board} Reference to the board
         */
        emulateColorblindness: function (deficiency) {
            var e, o;

            if (!Type.exists(deficiency)) {
                deficiency = 'none';
            }

            if (this.currentCBDef === deficiency) {
                return this;
            }

            for (e in this.objects) {
                if (this.objects.hasOwnProperty(e)) {
                    o = this.objects[e];

                    if (deficiency !== 'none') {
                        if (this.currentCBDef === 'none') {
                            // this could be accomplished by JXG.extend, too. But do not use
                            // JXG.deepCopy as this could result in an infinite loop because in
                            // visProp there could be geometry elements which contain the board which
                            // contains all objects which contain board etc.
                            o.visPropOriginal = {
                                strokecolor: o.visProp.strokecolor,
                                fillcolor: o.visProp.fillcolor,
                                highlightstrokecolor: o.visProp.highlightstrokecolor,
                                highlightfillcolor: o.visProp.highlightfillcolor
                            };
                        }
                        o.setAttribute({
                            strokecolor: Color.rgb2cb(o.visPropOriginal.strokecolor, deficiency),
                            fillcolor: Color.rgb2cb(o.visPropOriginal.fillcolor, deficiency),
                            highlightstrokecolor: Color.rgb2cb(o.visPropOriginal.highlightstrokecolor, deficiency),
                            highlightfillcolor: Color.rgb2cb(o.visPropOriginal.highlightfillcolor, deficiency)
                        });
                    } else if (Type.exists(o.visPropOriginal)) {
                        JXG.extend(o.visProp, o.visPropOriginal);
                    }
                }
            }
            this.currentCBDef = deficiency;
            this.update();

            return this;
        },

        /**
         * Select a single or multiple elements at once.
         * @param {String|Object|function} str The name, id or a reference to a JSXGraph element on this board. An object will
         * be used as a filter to return multiple elements at once filtered by the properties of the object.
         * @returns {JXG.GeometryElement|JXG.Composition}
         * @example
         * // select the element with name A
         * board.select('A');
         *
         * // select all elements with strokecolor set to 'red' (but not '#ff0000')
         * board.select({
         *   strokeColor: 'red'
         * });
         *
         * // select all points on or below the x axis and make them black.
         * board.select({
         *   elementClass: JXG.OBJECT_CLASS_POINT,
         *   Y: function (v) {
         *     return v <= 0;
         *   }
         * }).setAttribute({color: 'black'});
         *
         * // select all elements
         * board.select(function (el) {
         *   return true;
         * });
         */
        select: function (str) {
            var flist, olist, i, l,
                s = str;

            if (s === null) {
                return s;
            }

            // it's a string, most likely an id or a name.
            if (typeof s === 'string' && s !== '') {
                // Search by ID
                if (Type.exists(this.objects[s])) {
                    s = this.objects[s];
                // Search by name
                } else if (Type.exists(this.elementsByName[s])) {
                    s = this.elementsByName[s];
                // Search by group ID
                } else if (Type.exists(this.groups[s])) {
                    s = this.groups[s];
                }
            // it's a function or an object, but not an element
            } else if (typeof s === 'function' || (typeof s === 'object' && !JXG.isArray(s) && typeof s.setAttribute !== 'function')) {

                flist = Type.filterElements(this.objectsList, s);

                olist = {};
                l = flist.length;
                for (i = 0; i < l; i++) {
                    olist[flist[i].id] = flist[i];
                }
                s = new EComposition(olist);
            // it's an element which has been deleted (and still hangs around, e.g. in an attractor list
            } else if (typeof s === 'object' && JXG.exists(s.id) && !JXG.exists(this.objects[s.id])) {
                s = null;
            }

            return s;
        },

        /**
         * Checks if the given point is inside the boundingbox.
         * @param {Number|JXG.Coords} x User coordinate or {@link JXG.Coords} object.
         * @param {Number} [y] User coordinate. May be omitted in case <tt>x</tt> is a {@link JXG.Coords} object.
         * @returns {Boolean}
         */
        hasPoint: function (x, y) {
            var px = x,
                py = y,
                bbox = this.getBoundingBox();

            if (JXG.exists(x) && JXG.isArray(x.usrCoords)) {
                px = x.usrCoords[1];
                py = x.usrCoords[2];
            }

            if (typeof px === 'number' && typeof py === 'number' &&
                    bbox[0] < px && px < bbox[2] && bbox[1] > py && py > bbox[3]) {
                return true;
            }

            return false;
        },

        /**
         * Update CSS transformations of sclaing type. It is used to correct the mouse position
         * in {@link JXG.Board#getMousePosition}.
         * The inverse transformation matrix is updated on each mouseDown and touchStart event.
         *
         * It is up to the user to call this method after an update of the CSS transformation
         * in the DOM.
         */
        updateCSSTransforms: function () {
            var obj = this.containerObj,
                o = obj,
                o2 = obj;

            this.cssTransMat = Env.getCSSTransformMatrix(o);

            /*
             * In Mozilla and Webkit: offsetParent seems to jump at least to the next iframe,
             * if not to the body. In IE and if we are in an position:absolute environment
             * offsetParent walks up the DOM hierarchy.
             * In order to walk up the DOM hierarchy also in Mozilla and Webkit
             * we need the parentNode steps.
             */
            o = o.offsetParent;
            while (o) {
                this.cssTransMat = Mat.matMatMult(Env.getCSSTransformMatrix(o), this.cssTransMat);

                o2 = o2.parentNode;
                while (o2 !== o) {
                    this.cssTransMat = Mat.matMatMult(Env.getCSSTransformMatrix(o), this.cssTransMat);
                    o2 = o2.parentNode;
                }

                o = o.offsetParent;
            }
            this.cssTransMat = Mat.inverse(this.cssTransMat);

            return this;
        },


        /* **************************
         *     EVENT DEFINITION
         * for documentation purposes
         * ************************** */

        //region Event handler documentation

        /**
         * @event
         * @description Whenever the user starts to touch or click the board.
         * @name JXG.Board#down
         * @param {Event} e The browser's event object.
         */
        __evt__down: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to click on the board.
         * @name JXG.Board#mousedown
         * @param {Event} e The browser's event object.
         */
        __evt__mousedown: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to touch the board.
         * @name JXG.Board#touchstart
         * @param {Event} e The browser's event object.
         */
        __evt__touchstart: function (e) { },

        /**
         * @event
         * @description Whenever the user stops to touch or click the board.
         * @name JXG.Board#up
         * @param {Event} e The browser's event object.
         */
        __evt__up: function (e) { },

        /**
         * @event
         * @description Whenever the user releases the mousebutton over the board.
         * @name JXG.Board#mouseup
         * @param {Event} e The browser's event object.
         */
        __evt__mouseup: function (e) { },

        /**
         * @event
         * @description Whenever the user stops touching the board.
         * @name JXG.Board#touchend
         * @param {Event} e The browser's event object.
         */
        __evt__touchend: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the finger or mouse pointer over the board.
         * @name JXG.Board#move
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see {JXG.Board#mode}
         */
        __evt__move: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the mouse over the board.
         * @name JXG.Board#mousemove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see {JXG.Board#mode}
         */
        __evt__mousemove: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the finger over the board.
         * @name JXG.Board#touchmove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see {JXG.Board#mode}
         */
        __evt__touchmove: function (e, mode) { },

        /**
         * @event
         * @description Whenever an element is highlighted this event is fired.
         * @name JXG.Board#hit
         * @param {Event} e The browser's event object.
         * @param {JXG.GeometryElement} el The hit element.
         * @param target
         */
        __evt__hit: function (e, el, target) { },

        /**
         * @event
         * @description Whenever an element is highlighted this event is fired.
         * @name JXG.Board#mousehit
         * @param {Event} e The browser's event object.
         * @param {JXG.GeometryElement} el The hit element.
         * @param target
         */
        __evt__mousehit: function (e, el, target) { },

        /**
         * @event
         * @description This board is updated.
         * @name JXG.Board#update
         */
        __evt__update: function () { },

        /**
         * @event
         * @description The bounding box of the board has changed.
         * @name JXG.Board#boundingbox
         */
        __evt__boundingbox: function () { },

        /**
         * @ignore
         */
        __evt: function () {},

        //endregion

        /**
         * Function to animate a curve rolling on another curve.
         * @param {Curve} c1 JSXGraph curve building the floor where c2 rolls
         * @param {Curve} c2 JSXGraph curve which rolls on c1.
         * @param {number} start_c1 The parameter t such that c1(t) touches c2. This is the start position of the
         *                          rolling process
         * @param {Number} stepsize Increase in t in each step for the curve c1
         * @param {Number} direction
         * @param {Number} time Delay time for setInterval()
         * @param {Array} pointlist Array of points which are rolled in each step. This list should contain
         *      all points which define c2 and gliders on c2.
         *
         * @example
         *
         * // Line which will be the floor to roll upon.
         * var line = brd.create('curve', [function (t) { return t;}, function (t){ return 1;}], {strokeWidth:6});
         * // Center of the rolling circle
         * var C = brd.create('point',[0,2],{name:'C'});
         * // Starting point of the rolling circle
         * var P = brd.create('point',[0,1],{name:'P', trace:true});
         * // Circle defined as a curve. The circle "starts" at P, i.e. circle(0) = P
         * var circle = brd.create('curve',[
         *           function (t){var d = P.Dist(C),
         *                           beta = JXG.Math.Geometry.rad([C.X()+1,C.Y()],C,P);
         *                       t += beta;
         *                       return C.X()+d*Math.cos(t);
         *           },
         *           function (t){var d = P.Dist(C),
         *                           beta = JXG.Math.Geometry.rad([C.X()+1,C.Y()],C,P);
         *                       t += beta;
         *                       return C.Y()+d*Math.sin(t);
         *           },
         *           0,2*Math.PI],
         *           {strokeWidth:6, strokeColor:'green'});
         *
         * // Point on circle
         * var B = brd.create('glider',[0,2,circle],{name:'B', color:'blue',trace:false});
         * var roll = brd.createRoulette(line, circle, 0, Math.PI/20, 1, 100, [C,P,B]);
         * roll.start() // Start the rolling, to be stopped by roll.stop()
         *
         * </pre><div id="e5e1b53c-a036-4a46-9e35-190d196beca5" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * var brd = JXG.JSXGraph.initBoard('e5e1b53c-a036-4a46-9e35-190d196beca5', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright:false, shownavigation: false});
         * // Line which will be the floor to roll upon.
         * var line = brd.create('curve', [function (t) { return t;}, function (t){ return 1;}], {strokeWidth:6});
         * // Center of the rolling circle
         * var C = brd.create('point',[0,2],{name:'C'});
         * // Starting point of the rolling circle
         * var P = brd.create('point',[0,1],{name:'P', trace:true});
         * // Circle defined as a curve. The circle "starts" at P, i.e. circle(0) = P
         * var circle = brd.create('curve',[
         *           function (t){var d = P.Dist(C),
         *                           beta = JXG.Math.Geometry.rad([C.X()+1,C.Y()],C,P);
         *                       t += beta;
         *                       return C.X()+d*Math.cos(t);
         *           },
         *           function (t){var d = P.Dist(C),
         *                           beta = JXG.Math.Geometry.rad([C.X()+1,C.Y()],C,P);
         *                       t += beta;
         *                       return C.Y()+d*Math.sin(t);
         *           },
         *           0,2*Math.PI],
         *           {strokeWidth:6, strokeColor:'green'});
         *
         * // Point on circle
         * var B = brd.create('glider',[0,2,circle],{name:'B', color:'blue',trace:false});
         * var roll = brd.createRoulette(line, circle, 0, Math.PI/20, 1, 100, [C,P,B]);
         * roll.start() // Start the rolling, to be stopped by roll.stop()
         * </script><pre>
         */
        createRoulette: function (c1, c2, start_c1, stepsize, direction, time, pointlist) {
            var brd = this,
                Roulette = function () {
                    var alpha = 0, Tx = 0, Ty = 0,
                        t1 = start_c1,
                        t2 = Numerics.root(
                            function (t) {
                                var c1x = c1.X(t1),
                                    c1y = c1.Y(t1),
                                    c2x = c2.X(t),
                                    c2y = c2.Y(t);

                                return (c1x - c2x) * (c1x - c2x) + (c1y - c2y) * (c1y - c2y);
                            },
                            [0, Math.PI * 2]
                        ),
                        t1_new = 0.0, t2_new = 0.0,
                        c1dist,

                        rotation = brd.create('transform', [
                            function () {
                                return alpha;
                            }
                        ], {type: 'rotate'}),

                        rotationLocal = brd.create('transform', [
                            function () {
                                return alpha;
                            },
                            function () {
                                return c1.X(t1);
                            },
                            function () {
                                return c1.Y(t1);
                            }
                        ], {type: 'rotate'}),

                        translate = brd.create('transform', [
                            function () {
                                return Tx;
                            },
                            function () {
                                return Ty;
                            }
                        ], {type: 'translate'}),

                        // arc length via Simpson's rule.
                        arclen = function (c, a, b) {
                            var cpxa = Numerics.D(c.X)(a),
                                cpya = Numerics.D(c.Y)(a),
                                cpxb = Numerics.D(c.X)(b),
                                cpyb = Numerics.D(c.Y)(b),
                                cpxab = Numerics.D(c.X)((a + b) * 0.5),
                                cpyab = Numerics.D(c.Y)((a + b) * 0.5),

                                fa = Math.sqrt(cpxa * cpxa + cpya * cpya),
                                fb = Math.sqrt(cpxb * cpxb + cpyb * cpyb),
                                fab = Math.sqrt(cpxab * cpxab + cpyab * cpyab);

                            return (fa + 4 * fab + fb) * (b - a) / 6;
                        },

                        exactDist = function (t) {
                            return c1dist - arclen(c2, t2, t);
                        },

                        beta = Math.PI / 18,
                        beta9 = beta * 9,
                        interval = null;

                    this.rolling = function () {
                        var h, g, hp, gp, z;

                        t1_new = t1 + direction * stepsize;

                        // arc length between c1(t1) and c1(t1_new)
                        c1dist = arclen(c1, t1, t1_new);

                        // find t2_new such that arc length between c2(t2) and c1(t2_new) equals c1dist.
                        t2_new = Numerics.root(exactDist, t2);

                        // c1(t) as complex number
                        h = new Complex(c1.X(t1_new), c1.Y(t1_new));

                        // c2(t) as complex number
                        g = new Complex(c2.X(t2_new), c2.Y(t2_new));

                        hp = new Complex(Numerics.D(c1.X)(t1_new), Numerics.D(c1.Y)(t1_new));
                        gp = new Complex(Numerics.D(c2.X)(t2_new), Numerics.D(c2.Y)(t2_new));

                        // z is angle between the tangents of c1 at t1_new, and c2 at t2_new
                        z = Complex.C.div(hp, gp);

                        alpha = Math.atan2(z.imaginary, z.real);
                        // Normalizing the quotient
                        z.div(Complex.C.abs(z));
                        z.mult(g);
                        Tx = h.real - z.real;

                        // T = h(t1_new)-g(t2_new)*h'(t1_new)/g'(t2_new);
                        Ty = h.imaginary - z.imaginary;

                        // -(10-90) degrees: make corners roll smoothly
                        if (alpha < -beta && alpha > -beta9) {
                            alpha = -beta;
                            rotationLocal.applyOnce(pointlist);
                        } else if (alpha > beta && alpha < beta9) {
                            alpha = beta;
                            rotationLocal.applyOnce(pointlist);
                        } else {
                            rotation.applyOnce(pointlist);
                            translate.applyOnce(pointlist);
                            t1 = t1_new;
                            t2 = t2_new;
                        }
                        brd.update();
                    };

                    this.start = function () {
                        if (time > 0) {
                            interval = window.setInterval(this.rolling, time);
                        }
                        return this;
                    };

                    this.stop = function () {
                        window.clearInterval(interval);
                        return this;
                    };
                    return this;
                };
            return new Roulette();
        }
    });

    return JXG.Board;
});
