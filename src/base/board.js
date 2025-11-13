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

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, window: true, document: true, init: true, translateASCIIMath: true, google: true*/

/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The JXG.Board class is defined in this file. JXG.Board controls all properties and methods
 * used to manage a geonext board like managing geometric elements, managing mouse and touch events, etc.
 */

import JXG from '../jxg.js';
import Const from './constants.js';
import Coords from './coords.js';
import Options from '../options.js';
import Numerics from '../math/numerics.js';
import Mat from '../math/math.js';
import Geometry from '../math/geometry.js';
import Complex from '../math/complex.js';
import Statistics from '../math/statistics.js';
import JessieCode from '../parser/jessiecode.js';
import Color from '../utils/color.js';
import Type from '../utils/type.js';
import EventEmitter from '../utils/event.js';
import Env from '../utils/env.js';
import Composition from './composition.js';

/**
 * Constructs a new Board object.
 * @class JXG.Board controls all properties and methods used to manage a geonext board like managing geometric
 * elements, managing mouse and touch events, etc. You probably don't want to use this constructor directly.
 * Please use {@link JXG.JSXGraph.initBoard} to initialize a board.
 * @constructor
 * @param {String|Object} container The id of or reference to the HTML DOM element
 * the board is drawn in. This is usually a HTML div. If it is the reference to an HTML element and this element does not have an attribute "id",
 * this attribute "id" is set to a random value.
 * @param {JXG.AbstractRenderer} renderer The reference of a renderer.
 * @param {String} id Unique identifier for the board, may be an empty string or null or even undefined.
 * @param {JXG.Coords} origin The coordinates where the origin is placed, in user coordinates.
 * @param {Number} zoomX Zoom factor in x-axis direction
 * @param {Number} zoomY Zoom factor in y-axis direction
 * @param {Number} unitX Units in x-axis direction
 * @param {Number} unitY Units in y-axis direction
 * @param {Number} canvasWidth  The width of canvas
 * @param {Number} canvasHeight The height of canvas
 * @param {Object} attributes The attributes object given to {@link JXG.JSXGraph.initBoard}
 * @borrows JXG.EventEmitter#on as this.on
 * @borrows JXG.EventEmitter#off as this.off
 * @borrows JXG.EventEmitter#triggerEventHandlers as this.triggerEventHandlers
 * @borrows JXG.EventEmitter#eventHandlers as this.eventHandlers
 */
JXG.Board = function (container, renderer, id,
    origin, zoomX, zoomY, unitX, unitY,
    canvasWidth, canvasHeight, attributes) {
    /**
     * Board is in no special mode, objects are highlighted on mouse over and objects may be
     * clicked to start drag&drop.
     * @type Number
     * @constant
     */
    this.BOARD_MODE_NONE = 0x0000;

    /**
     * Board is in drag mode, objects aren't highlighted on mouse over and the object referenced in
     * {@link JXG.Board#mouse} is updated on mouse movement.
     * @type Number
     * @constant
     */
    this.BOARD_MODE_DRAG = 0x0001;

    /**
     * In this mode a mouse move changes the origin's screen coordinates.
     * @type Number
     * @constant
     */
    this.BOARD_MODE_MOVE_ORIGIN = 0x0002;

    /**
     * Update is made with high quality, e.g. graphs are evaluated at much more points.
     * @type Number
     * @constant
     * @see JXG.Board#updateQuality
     */
    this.BOARD_MODE_ZOOM = 0x0011;

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
     * Pointer to the document element containing the board.
     * @type Object
     */
    if (Type.exists(attributes.document) && attributes.document !== false) {
        this.document = attributes.document;
    } else if (Env.isBrowser) {
        this.document = document;
    }

    /**
     * The html-id of the html element containing the board.
     * @type String
     */
    this.container = ''; // container

    /**
     * ID of the board
     * @type String
     */
    this.id = '';

    /**
     * Pointer to the html element containing the board.
     * @type Object
     */
    this.containerObj = null; // (Env.isBrowser ? this.document.getElementById(this.container) : null);

    // Set this.container and this.containerObj
    if (Type.isString(container)) {
        // Hosting div is given as string
        this.container = container; // container
        this.containerObj = (Env.isBrowser ? this.document.getElementById(this.container) : null);

    } else if (Env.isBrowser) {

        // Hosting div is given as object pointer
        this.containerObj = container;
        this.container = this.containerObj.getAttribute('id');
        if (this.container === null) {
            // Set random ID to this.container, but not to the DOM element

            this.container = 'null' + parseInt(Math.random() * 16777216).toString();
        }
    }

    if (Env.isBrowser && renderer.type !== 'no' && this.containerObj === null) {
        throw new Error('\nJSXGraph: HTML container element "' + container + '" not found.');
    }

    // TODO
    // Why do we need this.id AND this.container?
    // There was never a board attribute "id".
    // The origin seems to be that in the geonext renderer we use a separate id, extracted from the GEONExT file.
    if (Type.exists(id) && id !== '' && Env.isBrowser && !Type.exists(this.document.getElementById(id))) {
        // If the given id is not valid, generate an unique id
        this.id = id;
    } else {
        this.id = this.generateId();
    }

    /**
     * A reference to this boards renderer.
     * @type JXG.AbstractRenderer
     * @name JXG.Board#renderer
     * @private
     * @ignore
     */
    this.renderer = renderer;

    /**
     * Grids keeps track of all grids attached to this board.
     * @type Array
     * @private
     */
    this.grids = [];

    /**
     * Copy of the default options
     * @type JXG.Options
     */
    this.options = Type.deepCopy(Options);  // A possible theme is not yet merged in

    /**
     * Board attributes
     * @type Object
     */
    this.attr = attributes;

    if (this.attr.theme !== 'default' && Type.exists(JXG.themes[this.attr.theme])) {
        Type.mergeAttr(this.options, JXG.themes[this.attr.theme], true);
    }

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
     * @private
     */
    this.origin = {};
    this.origin.usrCoords = [1, 0, 0];
    this.origin.scrCoords = [1, origin[0], origin[1]];

    /**
     * Zoom factor in X direction. It only stores the zoom factor to be able
     * to get back to 100% in zoom100().
     * @name JXG.Board.zoomX
     * @type Number
     * @private
     * @ignore
     */
    this.zoomX = zoomX;

    /**
     * Zoom factor in Y direction. It only stores the zoom factor to be able
     * to get back to 100% in zoom100().
     * @name JXG.Board.zoomY
     * @type Number
     * @private
     * @ignore
     */
    this.zoomY = zoomY;

    /**
     * The number of pixels which represent one unit in user-coordinates in x direction.
     * @type Number
     * @private
     */
    this.unitX = unitX * this.zoomX;

    /**
     * The number of pixels which represent one unit in user-coordinates in y direction.
     * @type Number
     * @private
     */
    this.unitY = unitY * this.zoomY;

    /**
     * Keep aspect ratio if bounding box is set and the width/height ratio differs from the
     * width/height ratio of the canvas.
     * @type Boolean
     * @private
     */
    this.keepaspectratio = false;

    /**
     * Canvas width.
     * @type Number
     * @private
     */
    this.canvasWidth = canvasWidth;

    /**
     * Canvas Height
     * @type Number
     * @private
     */
    this.canvasHeight = canvasHeight;

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
     * @type Array
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
     * An associative array / dictionary to store the objects of the board by name. The name of the object is the key and value is a reference to the object.
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
     */
    this.drag_dx = 0;

    /**
     * The distance from the mouse to the dragged object in y direction when the user clicked the mouse button.
     * @type Number
     * @see JXG.Board#drag_dx
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
     * @type JXG.GeometryElement
     * @see JXG.Board#touches
     */
    this.mouse = {};

    /**
     * Keeps track on touched elements, like {@link JXG.Board#mouse} does for mouse events.
     * @type Array
     * @see JXG.Board#mouse
     */
    this.touches = [];

    /**
     * A string containing the XML text of the construction.
     * This is set in {@link JXG.FileReader.parseString}.
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
     * Contains the pointerId of the last touchMove event which was not thrown away or since
     * touchStart because Android's Webkit browser fires too much of them.
     * @type Number
     */
    this.touchMoveLastId = Infinity;

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
    this.clickObjects = {};

    /**
     * Collects all elements that have keyboard focus. Should be either one or no element.
     * Elements are stored with their id.
     * @type Array
     */
    this.focusObjects = [];

    if (this.attr.showcopyright || this.attr.showlogo) {
        this.renderer.displayLogo(Const.licenseLogo, parseInt(this.options.text.fontSize, 10), this);
    }

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
     * This is set in {@link JXG.GeonextReader.readGeonext}.
     * @type Boolean
     * @default false
     * @see JXG.GeonextReader.readGeonext
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
     * @type Boolean
     * @default false
     */
    this.hasPointerHandlers = false;

    /**
     * A flag which stores if the board registered zoom events, i.e. mouse wheel scroll events.
     * @type Boolean
     * @default false
     */
    this.hasWheelHandlers = false;

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
     * @type Boolean
     * @default false
     */
    this.hasPointerUp = false;

    /**
     * Array containing the events related to resizing that have event listeners.
     * @type Array
     * @default []
     */
    this.resizeHandlers = [];

    /**
     * Offset for large coords elements like images
     * @type Array
     * @private
     * @default [0, 0]
     */
    this._drag_offset = [0, 0];

    /**
     * Stores the input device used in the last down or move event.
     * @type String
     * @private
     * @default 'mouse'
     */
    this._inputDevice = 'mouse';

    /**
     * Keeps a list of pointer devices which are currently touching the screen.
     * @type Array
     * @private
     */
    this._board_touches = [];

    /**
     * A flag which tells us if the board is in the selecting mode
     * @type Boolean
     * @default false
     */
    this.selectingMode = false;

    /**
     * A flag which tells us if the user is selecting
     * @type Boolean
     * @default false
     */
    this.isSelecting = false;

    /**
     * A flag which tells us if the user is scrolling the viewport
     * @type Boolean
     * @private
     * @default false
     * @see JXG.Board#scrollListener
     */
    this._isScrolling = false;

    /**
     * A flag which tells us if a resize is in process
     * @type Boolean
     * @private
     * @default false
     * @see JXG.Board#resizeListener
     */
    this._isResizing = false;

    /**
     * A flag which tells us if the update is triggered by a change of the
     * 3D view. In that case we only have to update the projection of
     * the 3D elements and can avoid a full board update.
     *
     * @type Boolean
     * @private
     * @default false
     */
    this._change3DView = false;

    /**
     * A bounding box for the selection
     * @type Array
     * @default [ [0,0], [0,0] ]
     */
    this.selectingBox = [[0, 0], [0, 0]];

    /**
     * Array to log user activity.
     * Entries are objects of the form '{type, id, start, end}' notifying
     * the start time as well as the last time of a single event of type 'type'
     * on a JSXGraph element of id 'id'.
     * <p> 'start' and 'end' contain the amount of milliseconds elapsed between 1 January 1970 00:00:00 UTC
     * and the time the event happened.
     * <p>
     * For the time being (i.e. v1.5.0) the only supported type is 'drag'.
     * @type Array
     */
    this.userLog = [];

    this.mathLib = Math;        // Math or JXG.Math.IntervalArithmetic
    this.mathLibJXG = JXG.Math; // JXG.Math or JXG.Math.IntervalArithmetic

    if (this.attr.registerevents === true) {
        this.attr.registerevents = {
            fullscreen: true,
            keyboard: true,
            pointer: true,
            resize: true,
            wheel: true
        };
    } else if (typeof this.attr.registerevents === 'object') {
        if (!Type.exists(this.attr.registerevents.fullscreen)) {
            this.attr.registerevents.fullscreen = true;
        }
        if (!Type.exists(this.attr.registerevents.keyboard)) {
            this.attr.registerevents.keyboard = true;
        }
        if (!Type.exists(this.attr.registerevents.pointer)) {
            this.attr.registerevents.pointer = true;
        }
        if (!Type.exists(this.attr.registerevents.resize)) {
            this.attr.registerevents.resize = true;
        }
        if (!Type.exists(this.attr.registerevents.wheel)) {
            this.attr.registerevents.wheel = true;
        }
    }
    if (this.attr.registerevents !== false) {
        if (this.attr.registerevents.fullscreen) {
            this.addFullscreenEventHandlers();
        }
        if (this.attr.registerevents.keyboard) {
            this.addKeyboardEventHandlers();
        }
        if (this.attr.registerevents.pointer) {
            this.addEventHandlers();
        }
        if (this.attr.registerevents.resize) {
            this.addResizeEventHandlers();
        }
        if (this.attr.registerevents.wheel) {
            this.addWheelEventHandlers();
        }
    }

    this.methodMap = {
        update: 'update',
        fullUpdate: 'fullUpdate',
        on: 'on',
        off: 'off',
        trigger: 'trigger',
        setAttribute: 'setAttribute',
        setBoundingBox: 'setBoundingBox',
        setView: 'setBoundingBox',
        getBoundingBox: 'getBoundingBox',
        BoundingBox: 'getBoundingBox',
        getView: 'getBoundingBox',
        View: 'getBoundingBox',
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

JXG.extend(
    JXG.Board.prototype,
    /** @lends JXG.Board.prototype */ {
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
            var possibleNames, i,
                maxNameLength = this.attr.maxnamelength,
                pre = '',
                post = '',
                indices = [],
                name = '';

            if (object.type === Const.OBJECT_TYPE_TICKS) {
                return '';
            }

            if (Type.isPoint(object) || Type.isPoint3D(object)) {
                // points have capital letters
                possibleNames = [
                    '', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
                ];
            } else if (object.type === Const.OBJECT_TYPE_ANGLE) {
                possibleNames = [
                    '', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;', '&iota;', '&kappa;', '&lambda;',
                    '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;'
                ];
            } else {
                // all other elements get lowercase labels
                possibleNames = [
                    '', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
                ];
            }

            if (
                !Type.isPoint(object) &&
                !Type.isPoint3D(object) &&
                object.elementClass !== Const.OBJECT_CLASS_LINE &&
                object.type !== Const.OBJECT_TYPE_ANGLE
            ) {
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
                r = Math.round(Math.random() * 16777216);
            }

            return 'jxgBoard' + r;
        },

        /**
         * Composes an id for an element. If the ID is empty ('' or null) a new ID is generated, depending on the
         * object type. As a side effect {@link JXG.Board#numObjects}
         * is updated.
         * @param {Object} obj Reference of an geometry object that needs an id.
         * @param {Number} type Type of the object.
         * @returns {String} Unique id for an element.
         */
        setId: function (obj, type) {
            var randomNumber,
                num = this.numObjects,
                elId = obj.id;

            this.numObjects += 1;

            // If no id is provided or id is empty string, a new one is chosen
            if (elId === '' || !Type.exists(elId)) {
                elId = this.id + type + num;
                while (Type.exists(this.objects[elId])) {
                    randomNumber = Math.round(Math.random() * 65535);
                    elId = this.id + type + num + '-' + randomNumber;
                }
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
            if (obj.evalVisProp('visible') === false) {
                this.renderer.display(obj, false);
            }
        },

        finalizeLabel: function (obj) {
            if (
                obj.hasLabel &&
                !obj.label.evalVisProp('islabel') &&
                obj.label.evalVisProp('visible') === false
            ) {
                this.renderer.display(obj.label, false);
            }
        },

        /**********************************************************
         *
         * Event Handler helpers
         *
         **********************************************************/

        /**
         * Returns false if the event has been triggered faster than the maximum frame rate.
         *
         * @param {Event} evt Event object given by the browser (unused)
         * @returns {Boolean} If the event has been triggered faster than the maximum frame rate, false is returned.
         * @private
         * @see JXG.Board#pointerMoveListener
         * @see JXG.Board#touchMoveListener
         * @see JXG.Board#mouseMoveListener
         */
        checkFrameRate: function (evt) {
            var handleEvt = false,
                time = new Date().getTime();

            if (Type.exists(evt.pointerId) && this.touchMoveLastId !== evt.pointerId) {
                handleEvt = true;
                this.touchMoveLastId = evt.pointerId;
            }
            if (!handleEvt && (time - this.touchMoveLast) * this.attr.maxframerate >= 1000) {
                handleEvt = true;
            }
            if (handleEvt) {
                this.touchMoveLast = time;
            }
            return handleEvt;
        },

        /**
         * Calculates mouse coordinates relative to the boards container.
         * @returns {Array} Array of coordinates relative the boards container top left corner.
         */
        getCoordsTopLeftCorner: function () {
            var cPos,
                doc,
                crect,
                // In ownerDoc we need the 'real' document object.
                // The first version is used in the case of shadowDOM,
                // the second case in the 'normal' case.
                ownerDoc = this.document.ownerDocument || this.document,
                docElement = ownerDoc.documentElement || this.document.body.parentNode,
                docBody = ownerDoc.body,
                container = this.containerObj,
                zoom,
                o;

            /**
             * During drags and origin moves the container element is usually not changed.
             * Check the position of the upper left corner at most every 1000 msecs
             */
            if (
                this.cPos.length > 0 &&
                (this.mode === this.BOARD_MODE_DRAG ||
                    this.mode === this.BOARD_MODE_MOVE_ORIGIN ||
                    new Date().getTime() - this.positionAccessLast < 1000)
            ) {
                return this.cPos;
            }
            this.positionAccessLast = new Date().getTime();

            // Check if getBoundingClientRect exists. If so, use this as this covers *everything*
            // even CSS3D transformations etc.
            // Supported by all browsers but IE 6, 7.
            if (container.getBoundingClientRect) {
                crect = container.getBoundingClientRect();

                zoom = 1.0;
                // Recursively search for zoom style entries.
                // This is necessary for reveal.js on webkit.
                // It fails if the user does zooming
                o = container;
                while (o && Type.exists(o.parentNode)) {
                    if (
                        Type.exists(o.style) &&
                        Type.exists(o.style.zoom) &&
                        o.style.zoom !== ''
                    ) {
                        zoom *= parseFloat(o.style.zoom);
                    }
                    o = o.parentNode;
                }
                cPos = [crect.left * zoom, crect.top * zoom];

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

            //
            //  OLD CODE
            //  IE 6-7 only:
            //
            cPos = Env.getOffset(container);
            doc = this.document.documentElement.ownerDocument;

            if (!this.containerObj.currentStyle && doc.defaultView) {
                // Non IE
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
            return this.cPos;
        },

        /**
         * This function divides the board into 9 sections and returns an array <tt>[u,v]</tt> which symbolizes the location of <tt>position</tt>.
         * Optional a <tt>margin</tt> to the inner of the board is respected.<br>
         *
         * @name Board#getPointLoc
         * @param {Array} position Array of requested position <tt>[x, y]</tt> or <tt>[w, x, y]</tt>.
         * @param {Array|Number} [margin] Optional margin for the inner of the board: <tt>[top, right, bottom, left]</tt>. A single number <tt>m</tt> is interpreted as <tt>[m, m, m, m]</tt>.
         * @returns {Array} [u,v] with the following meanings:
         * <pre>
         *     v    u > |   -1    |    0   |    1   |
         * ------------------------------------------
         *     1        | [-1,1]  |  [0,1] |  [1,1] |
         * ------------------------------------------
         *     0        | [-1,0]  |  Board |  [1,0] |
         * ------------------------------------------
         *    -1        | [-1,-1] | [0,-1] | [1,-1] |
         * </pre>
         * Positions inside the board (minus margin) return the value <tt>[0,0]</tt>.
         *
         * @example
         *      var point1, point2, point3, point4, margin,
         *             p1Location, p2Location, p3Location, p4Location,
         *             helppoint1, helppoint2, helppoint3, helppoint4;
         *
         *      // margin to make the boundingBox virtually smaller
         *      margin = [2,2,2,2];
         *
         *      // Points which are seen on screen
         *      point1 = board.create('point', [0,0]);
         *      point2 = board.create('point', [0,7]);
         *      point3 = board.create('point', [7,7]);
         *      point4 = board.create('point', [-7,-5]);
         *
         *      p1Location = board.getPointLoc(point1.coords.usrCoords, margin);
         *      p2Location = board.getPointLoc(point2.coords.usrCoords, margin);
         *      p3Location = board.getPointLoc(point3.coords.usrCoords, margin);
         *      p4Location = board.getPointLoc(point4.coords.usrCoords, margin);
         *
         *      // Text seen on screen
         *      board.create('text', [1,-1, "getPointLoc(A): " + "[" + p1Location + "]"])
         *      board.create('text', [1,-2, "getPointLoc(B): " + "[" + p2Location + "]"])
         *      board.create('text', [1,-3, "getPointLoc(C): " + "[" + p3Location + "]"])
         *      board.create('text', [1,-4, "getPointLoc(D): " + "[" + p4Location + "]"])
         *
         *
         *      // Helping points that are used to create the helping lines
         *      helppoint1 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[2] - 2, bbx[1] -2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      helppoint2 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[0] + 2, bbx[1] -2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      helppoint3 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[0]+ 2, bbx[3] + 2];
         *      })],{
         *          visible: false,
         *      })
         *
         *      helppoint4 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[2] -2, bbx[3] + 2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      // Helping lines to visualize the 9 sectors and the margin
         *      board.create('line', [helppoint1, helppoint2]);
         *      board.create('line', [helppoint2, helppoint3]);
         *      board.create('line', [helppoint3, helppoint4]);
         *      board.create('line', [helppoint4, helppoint1]);
         *
         * </pre><div id="JXG4b3efef5-839d-4fac-bad1-7a14c0a89c70" class="jxgbox" style="width: 500px; height: 500px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG4b3efef5-839d-4fac-bad1-7a14c0a89c70',
         *             {boundingbox: [-8, 8, 8,-8], maxboundingbox: [-7.5,7.5,7.5,-7.5], axis: true, showcopyright: false, shownavigation: false, showZoom: false});
         *     var point1, point2, point3, point4, margin,
         *             p1Location, p2Location, p3Location, p4Location,
         *             helppoint1, helppoint2, helppoint3, helppoint4;
         *
         *      // margin to make the boundingBox virtually smaller
         *      margin = [2,2,2,2];
         *
         *      // Points which are seen on screen
         *      point1 = board.create('point', [0,0]);
         *      point2 = board.create('point', [0,7]);
         *      point3 = board.create('point', [7,7]);
         *      point4 = board.create('point', [-7,-5]);
         *
         *      p1Location = board.getPointLoc(point1.coords.usrCoords, margin);
         *      p2Location = board.getPointLoc(point2.coords.usrCoords, margin);
         *      p3Location = board.getPointLoc(point3.coords.usrCoords, margin);
         *      p4Location = board.getPointLoc(point4.coords.usrCoords, margin);
         *
         *      // Text seen on screen
         *      board.create('text', [1,-1, "getPointLoc(A): " + "[" + p1Location + "]"])
         *      board.create('text', [1,-2, "getPointLoc(B): " + "[" + p2Location + "]"])
         *      board.create('text', [1,-3, "getPointLoc(C): " + "[" + p3Location + "]"])
         *      board.create('text', [1,-4, "getPointLoc(D): " + "[" + p4Location + "]"])
         *
         *
         *      // Helping points that are used to create the helping lines
         *      helppoint1 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[2] - 2, bbx[1] -2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      helppoint2 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[0] + 2, bbx[1] -2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      helppoint3 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[0]+ 2, bbx[3] + 2];
         *      })],{
         *          visible: false,
         *      })
         *
         *      helppoint4 = board.create('point', [(function (){
         *          var bbx = board.getBoundingBox();
         *          return [bbx[2] -2, bbx[3] + 2];
         *      })], {
         *          visible: false,
         *      })
         *
         *      // Helping lines to visualize the 9 sectors and the margin
         *      board.create('line', [helppoint1, helppoint2]);
         *      board.create('line', [helppoint2, helppoint3]);
         *      board.create('line', [helppoint3, helppoint4]);
         *      board.create('line', [helppoint4, helppoint1]);
         *  })();
         *
         * </script><pre>
         *
         */
        getPointLoc: function (position, margin) {
            var bbox, pos, res, marg;

            bbox = this.getBoundingBox();
            pos = position;
            if (pos.length === 2) {
                pos.unshift(undefined);
            }
            res = [0, 0];
            marg = margin || 0;
            if (Type.isNumber(marg)) {
                marg = [marg, marg, marg, marg];
            }

            if (pos[1] > (bbox[2] - marg[1])) {
                res[0] = 1;
            }
            if (pos[1] < (bbox[0] + marg[3])) {
                res[0] = -1;
            }

            if (pos[2] > (bbox[1] - marg[0])) {
                res[1] = 1;
            }
            if (pos[2] < (bbox[3] + marg[2])) {
                res[1] = -1;
            }

            return res;
        },

        /**
         * This function calculates where the origin is located (@link Board#getPointLoc).
         * Optional a <tt>margin</tt> to the inner of the board is respected.<br>
         *
         * @name Board#getLocationOrigin
         * @param {Array|Number} [margin] Optional margin for the inner of the board: <tt>[top, right, bottom, left]</tt>. A single number <tt>m</tt> is interpreted as <tt>[m, m, m, m]</tt>.
         * @returns {Array} [u,v] which shows where the origin is located (@link Board#getPointLoc).
         */
        getLocationOrigin: function (margin) {
            return this.getPointLoc([0, 0], margin);
        },

        /**
         * Get the position of the pointing device in screen coordinates, relative to the upper left corner
         * of the host tag.
         * @param {Event} e Event object given by the browser.
         * @param {Number} [i] Only use in case of touch events. This determines which finger to use and should not be set
         * for mouseevents.
         * @returns {Array} Contains the mouse coordinates in screen coordinates, ready for {@link JXG.Coords}
         */
        getMousePosition: function (e, i) {
            var cPos = this.getCoordsTopLeftCorner(),
                absPos,
                v;

            // Position of cursor using clientX/Y
            absPos = Env.getPosition(e, i, this.document);

            // Old:
            // This seems to be obsolete anyhow:
            // "In case there has been no down event before."
            // if (!Type.exists(this.cssTransMat)) {
            // this.updateCSSTransforms();
            // }
            // New:
            // We have to update the CSS transform matrix all the time,
            // since libraries like ZIMJS do not notify JSXGraph about a change.
            // In particular, sending a resize event event to JSXGraph
            // would be necessary.
            this.updateCSSTransforms();

            // Position relative to the top left corner
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
         * <ul>
         * <li>isDraggable</li>
         * <li>visible</li>
         * <li>not fixed</li>
         * <li>not frozen</li>
         * </ul>
         * @param {Number} x Current mouse/touch coordinates
         * @param {Number} y current mouse/touch coordinates
         * @param {Object} evt An event object
         * @param {String} type What type of event? 'touch', 'mouse' or 'pen'.
         * @returns {Array} A list of geometric elements.
         */
        initMoveObject: function (x, y, evt, type) {
            var pEl,
                el,
                collect = [],
                offset = [],
                haspoint,
                len = this.objectsList.length,
                dragEl = { visProp: { layer: -10000 } };

            // Store status of key presses for 3D movement
            this._shiftKey = evt.shiftKey;
            this._ctrlKey = evt.ctrlKey;

            //for (el in this.objects) {
            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                haspoint = pEl.hasPoint && pEl.hasPoint(x, y);

                if (pEl.visPropCalc.visible && haspoint) {
                    pEl.triggerEventHandlers([type + 'down', 'down'], [evt]);
                    this.downObjects.push(pEl);
                }

                if (haspoint &&
                    pEl.isDraggable &&
                    pEl.visPropCalc.visible &&
                    ((this.geonextCompatibilityMode &&
                        (Type.isPoint(pEl) || pEl.elementClass === Const.OBJECT_CLASS_TEXT)) ||
                        !this.geonextCompatibilityMode) &&
                    !pEl.evalVisProp('fixed')
                    /*(!pEl.visProp.frozen) &&*/
                ) {
                    // Elements in the highest layer get priority.
                    if (
                        pEl.visProp.layer > dragEl.visProp.layer ||
                        (pEl.visProp.layer === dragEl.visProp.layer &&
                            pEl.lastDragTime.getTime() >= dragEl.lastDragTime.getTime())
                    ) {
                        // If an element and its label have the focus
                        // simultaneously, the element is taken.
                        // This only works if we assume that every browser runs
                        // through this.objects in the right order, i.e. an element A
                        // added before element B turns up here before B does.
                        if (
                            !this.attr.ignorelabels ||
                            !Type.exists(dragEl.label) ||
                            pEl !== dragEl.label
                        ) {
                            dragEl = pEl;
                            collect.push(dragEl);

                            // Save offset for large coords elements.
                            if (Type.exists(dragEl.coords)) {
                                if (dragEl.elementClass === Const.OBJECT_CLASS_POINT ||
                                    dragEl.relativeCoords    // Relative texts like labels
                                ) {
                                    offset.push(Statistics.subtract(dragEl.coords.scrCoords.slice(1), [x, y]));
                                } else {
                                   // Images and texts
                                    offset.push(Statistics.subtract(dragEl.actualCoords.scrCoords.slice(1), [x, y]));
                                }
                            } else {
                                offset.push([0, 0]);
                            }

                            // We can't drop out of this loop because of the event handling system
                            //if (this.attr.takefirst) {
                            //    return collect;
                            //}
                        }
                    }
                }
            }

            if (this.attr.drag.enabled && collect.length > 0) {
                this.mode = this.BOARD_MODE_DRAG;
            }

            // A one-element array is returned.
            if (this.attr.takefirst) {
                collect.length = 1;
                this._drag_offset = offset[0];
            } else {
                collect = collect.slice(-1);
                this._drag_offset = offset[offset.length - 1];
            }

            if (!this._drag_offset) {
                this._drag_offset = [0, 0];
            }

            // Move drag element to the top of the layer
            if (this.renderer.type === 'svg' &&
                Type.exists(collect[0]) &&
                collect[0].evalVisProp('dragtotopoflayer') &&
                collect.length === 1 &&
                Type.exists(collect[0].rendNode)
            ) {
                collect[0].rendNode.parentNode.appendChild(collect[0].rendNode);
            }

            // // Init rotation angle and scale factor for two finger movements
            // this.previousRotation = 0.0;
            // this.previousScale = 1.0;

            if (collect.length >= 1) {
                collect[0].highlight(true);
                this.triggerEventHandlers(['mousehit', 'hit'], [evt, collect[0]]);
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
            var newPos = new Coords(
                Const.COORDS_BY_SCREEN,
                this.getScrCoordsOfMouse(x, y),
                this
            ),
                drag,
                dragScrCoords,
                newDragScrCoords;

            if (!(o && o.obj)) {
                return;
            }
            drag = o.obj;

            // Avoid updates for very small movements of coordsElements, see below
            if (drag.coords) {
                dragScrCoords = drag.coords.scrCoords.slice();
            }

            this.addLogEntry('drag', drag, newPos.usrCoords.slice(1));

            // Store the position and add the correctionvector from the mouse
            // position to the object's coords.
            this.drag_position = [newPos.scrCoords[1], newPos.scrCoords[2]];
            this.drag_position = Statistics.add(this.drag_position, this._drag_offset);

            // Store status of key presses for 3D movement
            this._shiftKey = evt.shiftKey;
            this._ctrlKey = evt.ctrlKey;

            //
            // We have to distinguish between CoordsElements and other elements like lines.
            // The latter need the difference between two move events.
            if (Type.exists(drag.coords)) {
                drag.setPositionDirectly(Const.COORDS_BY_SCREEN, this.drag_position, [x, y]);
            } else {
                this.displayInfobox(false);
                // Hide infobox in case the user has touched an intersection point
                // and drags the underlying line now.

                if (!isNaN(o.targets[0].Xprev + o.targets[0].Yprev)) {
                    drag.setPositionDirectly(
                        Const.COORDS_BY_SCREEN,
                        [newPos.scrCoords[1], newPos.scrCoords[2]],
                        [o.targets[0].Xprev, o.targets[0].Yprev]
                    );
                }
                // Remember the actual position for the next move event. Then we are able to
                // compute the difference vector.
                o.targets[0].Xprev = newPos.scrCoords[1];
                o.targets[0].Yprev = newPos.scrCoords[2];
            }
            // This may be necessary for some gliders and labels
            if (Type.exists(drag.coords)) {
                drag.prepareUpdate().update(false).updateRenderer();
                this.updateInfobox(drag);
                drag.prepareUpdate().update(true).updateRenderer();
            }

            if (drag.coords) {
                newDragScrCoords = drag.coords.scrCoords;
            }
            // No updates for very small movements of coordsElements
            if (
                !drag.coords ||
                dragScrCoords[1] !== newDragScrCoords[1] ||
                dragScrCoords[2] !== newDragScrCoords[2]
            ) {
                drag.triggerEventHandlers([type + 'drag', 'drag'], [evt]);
                // Update all elements of the board
                this.update(drag);
            }
            drag.highlight(true);
            this.triggerEventHandlers(['mousehit', 'hit'], [evt, drag]);

            drag.lastDragTime = new Date();
        },

        /**
         * Moves elements in multitouch mode.
         * @param {Array} p1 x,y coordinates of first touch
         * @param {Array} p2 x,y coordinates of second touch
         * @param {Object} o The touch object that is dragged: {JXG.Board#touches}.
         * @param {Object} evt The event object that lead to this movement.
         */
        twoFingerMove: function (o, id, evt) {
            var drag;

            if (Type.exists(o) && Type.exists(o.obj)) {
                drag = o.obj;
            } else {
                return;
            }

            if (
                drag.elementClass === Const.OBJECT_CLASS_LINE ||
                drag.type === Const.OBJECT_TYPE_POLYGON
            ) {
                this.twoFingerTouchObject(o.targets, drag, id);
            } else if (drag.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                this.twoFingerTouchCircle(o.targets, drag, id);
            }

            if (evt) {
                drag.triggerEventHandlers(['touchdrag', 'drag'], [evt]);
            }
        },

        /**
         * Compute the transformation matrix to move an element according to the
         * previous and actual positions of finger 1 and finger 2.
         * See also https://math.stackexchange.com/questions/4010538/solve-for-2d-translation-rotation-and-scale-given-two-touch-point-movements
         *
         * @param {Object} finger1 Actual and previous position of finger 1
         * @param {Object} finger1 Actual and previous position of finger 1
         * @param {Boolean} scalable Flag if element may be scaled
         * @param {Boolean} rotatable Flag if element may be rotated
         * @returns {Array}
         */
        getTwoFingerTransform(finger1, finger2, scalable, rotatable) {
            var crd,
                x1, y1, x2, y2,
                dx, dy,
                xx1, yy1, xx2, yy2,
                dxx, dyy,
                C, S, LL, tx, ty, lbda;

            crd = new Coords(Const.COORDS_BY_SCREEN, [finger1.Xprev, finger1.Yprev], this).usrCoords;
            x1 = crd[1];
            y1 = crd[2];
            crd = new Coords(Const.COORDS_BY_SCREEN, [finger2.Xprev, finger2.Yprev], this).usrCoords;
            x2 = crd[1];
            y2 = crd[2];

            crd = new Coords(Const.COORDS_BY_SCREEN, [finger1.X, finger1.Y], this).usrCoords;
            xx1 = crd[1];
            yy1 = crd[2];
            crd = new Coords(Const.COORDS_BY_SCREEN, [finger2.X, finger2.Y], this).usrCoords;
            xx2 = crd[1];
            yy2 = crd[2];

            dx = x2 - x1;
            dy = y2 - y1;
            dxx = xx2 - xx1;
            dyy = yy2 - yy1;

            LL = dx * dx + dy * dy;
            C = (dxx * dx + dyy * dy) / LL;
            S = (dyy * dx - dxx * dy) / LL;
            if (!scalable) {
                lbda = Mat.hypot(C, S);
                C /= lbda;
                S /= lbda;
            }
            if (!rotatable) {
                S = 0;
            }
            tx = 0.5 * (xx1 + xx2 - C * (x1 + x2) + S * (y1 + y2));
            ty = 0.5 * (yy1 + yy2 - S * (x1 + x2) - C * (y1 + y2));

            return [1, 0, 0,
                tx, C, -S,
                ty, S, C];
        },

        /**
         * Moves, rotates and scales a line or polygon with two fingers.
         * <p>
         * If one vertex of the polygon snaps to the grid or to points or is not draggable,
         * two-finger-movement is cancelled.
         *
         * @param {Array} tar Array containing touch event objects: {JXG.Board#touches.targets}.
         * @param {object} drag The object that is dragged:
         * @param {Number} id pointerId of the event. In case of old touch event this is emulated.
         */
        twoFingerTouchObject: function (tar, drag, id) {
            var t, T,
                ar, i, len,
                snap = false;

            if (
                Type.exists(tar[0]) &&
                Type.exists(tar[1]) &&
                !isNaN(tar[0].Xprev + tar[0].Yprev + tar[1].Xprev + tar[1].Yprev)
            ) {

                T = this.getTwoFingerTransform(
                    tar[0], tar[1],
                    drag.evalVisProp('scalable'),
                    drag.evalVisProp('rotatable'));
                t = this.create('transform', T, { type: 'generic' });
                t.update();

                if (drag.elementClass === Const.OBJECT_CLASS_LINE) {
                    ar = [];
                    if (drag.point1.draggable()) {
                        ar.push(drag.point1);
                    }
                    if (drag.point2.draggable()) {
                        ar.push(drag.point2);
                    }
                    t.applyOnce(ar);
                } else if (drag.type === Const.OBJECT_TYPE_POLYGON) {
                    len = drag.vertices.length - 1;
                    snap = drag.evalVisProp('snaptogrid') || drag.evalVisProp('snaptopoints');
                    for (i = 0; i < len && !snap; ++i) {
                        snap = snap || drag.vertices[i].evalVisProp('snaptogrid') || drag.vertices[i].evalVisProp('snaptopoints');
                        snap = snap || (!drag.vertices[i].draggable());
                    }
                    if (!snap) {
                        ar = [];
                        for (i = 0; i < len; ++i) {
                            if (drag.vertices[i].draggable()) {
                                ar.push(drag.vertices[i]);
                            }
                        }
                        t.applyOnce(ar);
                    }
                }

                this.update();
                drag.highlight(true);
            }
        },

        /*
         * Moves, rotates and scales a circle with two fingers.
         * @param {Array} tar Array containing touch event objects: {JXG.Board#touches.targets}.
         * @param {object} drag The object that is dragged:
         * @param {Number} id pointerId of the event. In case of old touch event this is emulated.
         */
        twoFingerTouchCircle: function (tar, drag, id) {
            var fixEl, moveEl, np, op, fix, d, alpha, t1, t2, t3, t4;

            if (drag.method === 'pointCircle' || drag.method === 'pointLine') {
                return;
            }

            if (
                Type.exists(tar[0]) &&
                Type.exists(tar[1]) &&
                !isNaN(tar[0].Xprev + tar[0].Yprev + tar[1].Xprev + tar[1].Yprev)
            ) {
                if (id === tar[0].num) {
                    fixEl = tar[1];
                    moveEl = tar[0];
                } else {
                    fixEl = tar[0];
                    moveEl = tar[1];
                }

                fix = new Coords(Const.COORDS_BY_SCREEN, [fixEl.Xprev, fixEl.Yprev], this)
                    .usrCoords;
                // Previous finger position
                op = new Coords(Const.COORDS_BY_SCREEN, [moveEl.Xprev, moveEl.Yprev], this)
                    .usrCoords;
                // New finger position
                np = new Coords(Const.COORDS_BY_SCREEN, [moveEl.X, moveEl.Y], this).usrCoords;

                alpha = Geometry.rad(op.slice(1), fix.slice(1), np.slice(1));

                // Rotate and scale by the movement of the second finger
                t1 = this.create('transform', [-fix[1], -fix[2]], {
                    type: 'translate'
                });
                t2 = this.create('transform', [alpha], { type: 'rotate' });
                t1.melt(t2);
                if (drag.evalVisProp('scalable')) {
                    d = Geometry.distance(fix, np) / Geometry.distance(fix, op);
                    t3 = this.create('transform', [d, d], { type: 'scale' });
                    t1.melt(t3);
                }
                t4 = this.create('transform', [fix[1], fix[2]], {
                    type: 'translate'
                });
                t1.melt(t4);

                if (drag.center.draggable()) {
                    t1.applyOnce([drag.center]);
                }

                if (drag.method === 'twoPoints') {
                    if (drag.point2.draggable()) {
                        t1.applyOnce([drag.point2]);
                    }
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
            var el,
                pEl,
                pId,
                overObjects = {},
                len = this.objectsList.length;

            // Elements  below the mouse pointer which are not highlighted yet will be highlighted.
            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                pId = pEl.id;
                if (
                    Type.exists(pEl.hasPoint) &&
                    pEl.visPropCalc.visible &&
                    pEl.hasPoint(x, y)
                ) {
                    // this is required in any case because otherwise the box won't be shown until the point is dragged
                    this.updateInfobox(pEl);

                    if (!Type.exists(this.highlightedObjects[pId])) {
                        // highlight only if not highlighted
                        overObjects[pId] = pEl;
                        pEl.highlight();
                        // triggers board event.
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
            var xy = [],
                i,
                len;

            if (obj.type === Const.OBJECT_TYPE_TICKS) {
                xy.push([1, NaN, NaN]);
            } else if (obj.elementClass === Const.OBJECT_CLASS_LINE) {
                xy.push(obj.point1.coords.usrCoords);
                xy.push(obj.point2.coords.usrCoords);
            } else if (obj.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                xy.push(obj.center.coords.usrCoords);
                if (obj.method === 'twoPoints') {
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
                // if (Type.exists(obj.parents)) {
                //     len = obj.parents.length;
                //     if (len > 0) {
                //         for (i = 0; i < len; i++) {
                //             xy.push(this.select(obj.parents[i]).coords.usrCoords);
                //         }
                //     } else
                // }
                if (obj.points.length > 0) {
                    xy.push(obj.points[0].usrCoords);
                }
            } else {
                try {
                    xy.push(obj.coords.usrCoords);
                } catch (e) {
                    JXG.debug(
                        'JSXGraph+ saveStartPos: obj.coords.usrCoords not available: ' + e
                    );
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
            var r, pos;

            r = this._isRequiredKeyPressed(evt, 'pan');
            if (r) {
                pos = this.getMousePosition(evt);
                this.initMoveOrigin(pos[0], pos[1]);
            }

            return r;
        },

        mouseOriginMove: function (evt) {
            var r = this.mode === this.BOARD_MODE_MOVE_ORIGIN,
                pos;

            if (r) {
                pos = this.getMousePosition(evt);
                this.moveOrigin(pos[0], pos[1], true);
            }

            return r;
        },

        /**
         * Start moving the origin with one finger.
         * @private
         * @param  {Object} evt Event from touchStartListener
         * @return {Boolean}   returns if the origin is moved.
         */
        touchStartMoveOriginOneFinger: function (evt) {
            var touches = evt['touches'],
                conditions,
                pos;

            conditions =
                this.attr.pan.enabled && !this.attr.pan.needtwofingers && touches.length === 1;

            if (conditions) {
                pos = this.getMousePosition(evt, 0);
                this.initMoveOrigin(pos[0], pos[1]);
            }

            return conditions;
        },

        /**
         * Move the origin with one finger
         * @private
         * @param  {Object} evt Event from touchMoveListener
         * @return {Boolean}     returns if the origin is moved.
         */
        touchOriginMove: function (evt) {
            var r = this.mode === this.BOARD_MODE_MOVE_ORIGIN,
                pos;

            if (r) {
                pos = this.getMousePosition(evt, 0);
                this.moveOrigin(pos[0], pos[1], true);
            }

            return r;
        },

        /**
         * Stop moving the origin with one finger
         * @return {null} null
         * @private
         */
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
         * Suppresses the default event handling.
         * Used for context menu.
         *
         * @param {Event} e
         * @returns {Boolean} false
         */
        suppressDefault: function (e) {
            if (Type.exists(e)) {
                e.preventDefault();
            }
            return false;
        },

        /**
         * Add all possible event handlers to the board object
         * that move objects, i.e. mouse, pointer and touch events.
         */
        addEventHandlers: function () {
            if (Env.supportsPointerEvents()) {
                this.addPointerEventHandlers();
            } else {
                this.addMouseEventHandlers();
                this.addTouchEventHandlers();
            }

            if (this.containerObj !== null) {
                // this.containerObj.oncontextmenu = this.suppressDefault;
                Env.addEvent(this.containerObj, 'contextmenu', this.suppressDefault, this);
            }

            // This one produces errors on IE
            // // Env.addEvent(this.containerObj, 'contextmenu', function (e) { e.preventDefault(); return false;}, this);
            // This one works on IE, Firefox and Chromium with default configurations. On some Safari
            // or Opera versions the user must explicitly allow the deactivation of the context menu.
        },

        /**
         * Remove all event handlers from the board object
         */
        removeEventHandlers: function () {
            if ((this.hasPointerHandlers || this.hasMouseHandlers || this.hasTouchHandlers) &&
                this.containerObj !== null
            ) {
                Env.removeEvent(this.containerObj, 'contextmenu', this.suppressDefault, this);
            }

            this.removeMouseEventHandlers();
            this.removeTouchEventHandlers();
            this.removePointerEventHandlers();

            this.removeFullscreenEventHandlers();
            this.removeKeyboardEventHandlers();
            this.removeResizeEventHandlers();

            // if (Env.isBrowser) {
            //     if (Type.exists(this.resizeObserver)) {
            //         this.stopResizeObserver();
            //     } else {
            //         Env.removeEvent(window, 'resize', this.resizeListener, this);
            //         this.stopIntersectionObserver();
            //     }
            //     Env.removeEvent(window, 'scroll', this.scrollListener, this);
            // }
        },

        /**
         * Add resize related event handlers
         *
         */
        addResizeEventHandlers: function () {
            // var that = this;

            this.resizeHandlers = [];
            if (Env.isBrowser) {
                try {
                    // Supported by all new browsers
                    // resizeObserver: triggered if size of the JSXGraph div changes.
                    this.startResizeObserver();
                    this.resizeHandlers.push('resizeobserver');
                } catch (err) {
                    // Certain Safari and edge version do not support
                    // resizeObserver, but intersectionObserver.
                    // resize event: triggered if size of window changes
                    Env.addEvent(window, 'resize', this.resizeListener, this);
                    // intersectionObserver: triggered if JSXGraph becomes visible.
                    this.startIntersectionObserver();
                    this.resizeHandlers.push('resize');
                }
                // Scroll event: needs to be captured since on mobile devices
                // sometimes a header bar is displayed / hidden, which triggers a
                // resize event.
                Env.addEvent(window, 'scroll', this.scrollListener, this);
                this.resizeHandlers.push('scroll');

                // On browser print:
                // we need to call the listener when having @media: print.
                try {
                    // window.matchMedia('print').addEventListener('change', this.printListenerMatch.apply(this, arguments));
                    window.matchMedia('print').addEventListener('change', this.printListenerMatch.bind(this));
                    window.matchMedia('screen').addEventListener('change', this.printListenerMatch.bind(this));
                    this.resizeHandlers.push('print');
                } catch (err) {
                    JXG.debug("Error adding printListener", err);
                }
                // if (Type.isFunction(MediaQueryList.prototype.addEventListener)) {
                //     window.matchMedia('print').addEventListener('change', function (mql) {
                //         if (mql.matches) {
                //             that.printListener();
                //         }
                //     });
                // } else if (Type.isFunction(MediaQueryList.prototype.addListener)) { // addListener might be deprecated
                //     window.matchMedia('print').addListener(function (mql, ev) {
                //         if (mql.matches) {
                //             that.printListener(ev);
                //         }
                //     });
                // }

                // When closing the print dialog we again have to resize.
                // Env.addEvent(window, 'afterprint', this.printListener, this);
                // this.resizeHandlers.push('afterprint');
            }
        },

        /**
         * Remove resize related event handlers
         *
         */
        removeResizeEventHandlers: function () {
            var i, e;
            if (this.resizeHandlers.length > 0 && Env.isBrowser) {
                for (i = 0; i < this.resizeHandlers.length; i++) {
                    e = this.resizeHandlers[i];
                    switch (e) {
                        case 'resizeobserver':
                            if (Type.exists(this.resizeObserver)) {
                                this.stopResizeObserver();
                            }
                            break;
                        case 'resize':
                            Env.removeEvent(window, 'resize', this.resizeListener, this);
                            if (Type.exists(this.intersectionObserver)) {
                                this.stopIntersectionObserver();
                            }
                            break;
                        case 'scroll':
                            Env.removeEvent(window, 'scroll', this.scrollListener, this);
                            break;
                        case 'print':
                            window.matchMedia('print').removeEventListener('change', this.printListenerMatch.bind(this), false);
                            window.matchMedia('screen').removeEventListener('change', this.printListenerMatch.bind(this), false);
                            break;
                        // case 'afterprint':
                        //     Env.removeEvent(window, 'afterprint', this.printListener, this);
                        //     break;
                    }
                }
                this.resizeHandlers = [];
            }
        },


        /**
         * Registers pointer event handlers.
         */
        addPointerEventHandlers: function () {
            if (!this.hasPointerHandlers && Env.isBrowser) {
                var moveTarget = this.attr.movetarget || this.containerObj;

                if (window.navigator.msPointerEnabled) {
                    // IE10-
                    Env.addEvent(this.containerObj, 'MSPointerDown', this.pointerDownListener, this);
                    Env.addEvent(moveTarget, 'MSPointerMove', this.pointerMoveListener, this);
                } else {
                    Env.addEvent(this.containerObj, 'pointerdown', this.pointerDownListener, this);
                    Env.addEvent(moveTarget, 'pointermove', this.pointerMoveListener, this);
                    Env.addEvent(moveTarget, 'pointerleave', this.pointerLeaveListener, this);
                    Env.addEvent(moveTarget, 'click', this.pointerClickListener, this);
                    Env.addEvent(moveTarget, 'dblclick', this.pointerDblClickListener, this);
                }

                if (this.containerObj !== null) {
                    // This is needed for capturing touch events.
                    // It is in jsxgraph.css, for ms-touch-action...
                    this.containerObj.style.touchAction = 'none';
                    // this.containerObj.style.touchAction = 'auto';
                }

                this.hasPointerHandlers = true;
            }
        },

        /**
         * Registers mouse move, down and wheel event handlers.
         */
        addMouseEventHandlers: function () {
            if (!this.hasMouseHandlers && Env.isBrowser) {
                var moveTarget = this.attr.movetarget || this.containerObj;

                Env.addEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
                Env.addEvent(moveTarget, 'mousemove', this.mouseMoveListener, this);
                Env.addEvent(moveTarget, 'click', this.mouseClickListener, this);
                Env.addEvent(moveTarget, 'dblclick', this.mouseDblClickListener, this);

                this.hasMouseHandlers = true;
            }
        },

        /**
         * Register touch start and move and gesture start and change event handlers.
         * @param {Boolean} appleGestures If set to false the gesturestart and gesturechange event handlers
         * will not be registered.
         *
         * Since iOS 13, touch events were abandoned in favour of pointer events
         */
        addTouchEventHandlers: function (appleGestures) {
            if (!this.hasTouchHandlers && Env.isBrowser) {
                var moveTarget = this.attr.movetarget || this.containerObj;

                Env.addEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
                Env.addEvent(moveTarget, 'touchmove', this.touchMoveListener, this);

                /*
                if (!Type.exists(appleGestures) || appleGestures) {
                    // Gesture listener are called in touchStart and touchMove.
                    //Env.addEvent(this.containerObj, 'gesturestart', this.gestureStartListener, this);
                    //Env.addEvent(this.containerObj, 'gesturechange', this.gestureChangeListener, this);
                }
                */

                this.hasTouchHandlers = true;
            }
        },

        /**
         * Registers pointer event handlers.
         */
        addWheelEventHandlers: function () {
            if (!this.hasWheelHandlers && Env.isBrowser) {
                Env.addEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
                Env.addEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);
                this.hasWheelHandlers = true;
            }
        },

        /**
         * Add fullscreen events which update the CSS transformation matrix to correct
         * the mouse/touch/pointer positions in case of CSS transformations.
         */
        addFullscreenEventHandlers: function () {
            var i,
                // standard/Edge, firefox, chrome/safari, IE11
                events = [
                    'fullscreenchange',
                    'mozfullscreenchange',
                    'webkitfullscreenchange',
                    'msfullscreenchange'
                ],
                le = events.length;

            if (!this.hasFullscreenEventHandlers && Env.isBrowser) {
                for (i = 0; i < le; i++) {
                    Env.addEvent(this.document, events[i], this.fullscreenListener, this);
                }
                this.hasFullscreenEventHandlers = true;
            }
        },

        /**
         * Register keyboard event handlers.
         */
        addKeyboardEventHandlers: function () {
            if (this.attr.keyboard.enabled && !this.hasKeyboardHandlers && Env.isBrowser) {
                Env.addEvent(this.containerObj, 'keydown', this.keyDownListener, this);
                Env.addEvent(this.containerObj, 'focusin', this.keyFocusInListener, this);
                Env.addEvent(this.containerObj, 'focusout', this.keyFocusOutListener, this);
                this.hasKeyboardHandlers = true;
            }
        },

        /**
         * Remove all registered touch event handlers.
         */
        removeKeyboardEventHandlers: function () {
            if (this.hasKeyboardHandlers && Env.isBrowser) {
                Env.removeEvent(this.containerObj, 'keydown', this.keyDownListener, this);
                Env.removeEvent(this.containerObj, 'focusin', this.keyFocusInListener, this);
                Env.removeEvent(this.containerObj, 'focusout', this.keyFocusOutListener, this);
                this.hasKeyboardHandlers = false;
            }
        },

        /**
         * Remove all registered event handlers regarding fullscreen mode.
         */
        removeFullscreenEventHandlers: function () {
            var i,
                // standard/Edge, firefox, chrome/safari, IE11
                events = [
                    'fullscreenchange',
                    'mozfullscreenchange',
                    'webkitfullscreenchange',
                    'msfullscreenchange'
                ],
                le = events.length;

            if (this.hasFullscreenEventHandlers && Env.isBrowser) {
                for (i = 0; i < le; i++) {
                    Env.removeEvent(this.document, events[i], this.fullscreenListener, this);
                }
                this.hasFullscreenEventHandlers = false;
            }
        },

        /**
         * Remove MSPointer* Event handlers.
         */
        removePointerEventHandlers: function () {
            if (this.hasPointerHandlers && Env.isBrowser) {
                var moveTarget = this.attr.movetarget || this.containerObj;

                if (window.navigator.msPointerEnabled) {
                    // IE10-
                    Env.removeEvent(this.containerObj, 'MSPointerDown', this.pointerDownListener, this);
                    Env.removeEvent(moveTarget, 'MSPointerMove', this.pointerMoveListener, this);
                } else {
                    Env.removeEvent(this.containerObj, 'pointerdown', this.pointerDownListener, this);
                    Env.removeEvent(moveTarget, 'pointermove', this.pointerMoveListener, this);
                    Env.removeEvent(moveTarget, 'pointerleave', this.pointerLeaveListener, this);
                    Env.removeEvent(moveTarget, 'click', this.pointerClickListener, this);
                    Env.removeEvent(moveTarget, 'dblclick', this.pointerDblClickListener, this);
                }

                if (this.hasWheelHandlers) {
                    Env.removeEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
                    Env.removeEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);
                }

                if (this.hasPointerUp) {
                    if (window.navigator.msPointerEnabled) {
                        // IE10-
                        Env.removeEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                    } else {
                        Env.removeEvent(this.document, 'pointerup', this.pointerUpListener, this);
                        Env.removeEvent(this.document, 'pointercancel', this.pointerUpListener, this);
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
                var moveTarget = this.attr.movetarget || this.containerObj;

                Env.removeEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
                Env.removeEvent(moveTarget, 'mousemove', this.mouseMoveListener, this);
                Env.removeEvent(moveTarget, 'click', this.mouseClickListener, this);
                Env.removeEvent(moveTarget, 'dblclick', this.mouseDblClickListener, this);

                if (this.hasMouseUp) {
                    Env.removeEvent(this.document, 'mouseup', this.mouseUpListener, this);
                    this.hasMouseUp = false;
                }

                if (this.hasWheelHandlers) {
                    Env.removeEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
                    Env.removeEvent(
                        this.containerObj,
                        'DOMMouseScroll',
                        this.mouseWheelListener,
                        this
                    );
                }

                this.hasMouseHandlers = false;
            }
        },

        /**
         * Remove all registered touch event handlers.
         */
        removeTouchEventHandlers: function () {
            if (this.hasTouchHandlers && Env.isBrowser) {
                var moveTarget = this.attr.movetarget || this.containerObj;

                Env.removeEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
                Env.removeEvent(moveTarget, 'touchmove', this.touchMoveListener, this);

                if (this.hasTouchEnd) {
                    Env.removeEvent(this.document, 'touchend', this.touchEndListener, this);
                    this.hasTouchEnd = false;
                }

                this.hasTouchHandlers = false;
            }
        },

        /**
         * Handler for click on left arrow in the navigation bar
         * @returns {JXG.Board} Reference to the board
         */
        clickLeftArrow: function () {
            this.moveOrigin(
                this.origin.scrCoords[1] + this.canvasWidth * 0.1,
                this.origin.scrCoords[2]
            );
            return this;
        },

        /**
         * Handler for click on right arrow in the navigation bar
         * @returns {JXG.Board} Reference to the board
         */
        clickRightArrow: function () {
            this.moveOrigin(
                this.origin.scrCoords[1] - this.canvasWidth * 0.1,
                this.origin.scrCoords[2]
            );
            return this;
        },

        /**
         * Handler for click on up arrow in the navigation bar
         * @returns {JXG.Board} Reference to the board
         */
        clickUpArrow: function () {
            this.moveOrigin(
                this.origin.scrCoords[1],
                this.origin.scrCoords[2] - this.canvasHeight * 0.1
            );
            return this;
        },

        /**
         * Handler for click on down arrow in the navigation bar
         * @returns {JXG.Board} Reference to the board
         */
        clickDownArrow: function () {
            this.moveOrigin(
                this.origin.scrCoords[1],
                this.origin.scrCoords[2] + this.canvasHeight * 0.1
            );
            return this;
        },

        /**
         * Triggered on iOS/Safari while the user inputs a gesture (e.g. pinch) and is used to zoom into the board.
         * Works on iOS/Safari and Android.
         * @param {Event} evt Browser event object
         * @returns {Boolean}
         */
        gestureChangeListener: function (evt) {
            var c,
                dir1 = [],
                dir2 = [],
                angle,
                mi = 10,
                isPinch = false,
                // Save zoomFactors
                zx = this.attr.zoom.factorx,
                zy = this.attr.zoom.factory,
                factor, dist, theta, bound,
                zoomCenter,
                doZoom = false,
                dx, dy, cx, cy;

            if (this.mode !== this.BOARD_MODE_ZOOM) {
                return true;
            }
            evt.preventDefault();

            dist = Geometry.distance(
                [evt.touches[0].clientX, evt.touches[0].clientY],
                [evt.touches[1].clientX, evt.touches[1].clientY],
                2
            );

            // Android pinch to zoom
            // evt.scale was available in iOS touch events (pre iOS 13)
            // evt.scale is undefined in Android
            if (evt.scale === undefined) {
                evt.scale = dist / this.prevDist;
            }

            if (!Type.exists(this.prevCoords)) {
                return false;
            }
            // Compute the angle of the two finger directions
            dir1 = [
                evt.touches[0].clientX - this.prevCoords[0][0],
                evt.touches[0].clientY - this.prevCoords[0][1]
            ];
            dir2 = [
                evt.touches[1].clientX - this.prevCoords[1][0],
                evt.touches[1].clientY - this.prevCoords[1][1]
            ];

            if (
                dir1[0] * dir1[0] + dir1[1] * dir1[1] < mi * mi &&
                dir2[0] * dir2[0] + dir2[1] * dir2[1] < mi * mi
            ) {
                return false;
            }

            angle = Geometry.rad(dir1, [0, 0], dir2);
            if (
                this.isPreviousGesture !== 'pan' &&
                Math.abs(angle) > Math.PI * 0.2 &&
                Math.abs(angle) < Math.PI * 1.8
            ) {
                isPinch = true;
            }

            if (this.isPreviousGesture !== 'pan' && !isPinch) {
                if (Math.abs(evt.scale) < 0.77 || Math.abs(evt.scale) > 1.3) {
                    isPinch = true;
                }
            }

            factor = evt.scale / this.prevScale;
            this.prevScale = evt.scale;
            this.prevCoords = [
                [evt.touches[0].clientX, evt.touches[0].clientY],
                [evt.touches[1].clientX, evt.touches[1].clientY]
            ];

            c = new Coords(Const.COORDS_BY_SCREEN, this.getMousePosition(evt, 0), this);

            if (this.attr.pan.enabled && this.attr.pan.needtwofingers && !isPinch) {
                // Pan detected
                this.isPreviousGesture = 'pan';
                this.moveOrigin(c.scrCoords[1], c.scrCoords[2], true);

            } else if (this.attr.zoom.enabled && Math.abs(factor - 1.0) < 0.5) {
                doZoom = false;
                zoomCenter = this.attr.zoom.center;
                // Pinch detected
                if (this.attr.zoom.pinchhorizontal || this.attr.zoom.pinchvertical) {
                    dx = Math.abs(evt.touches[0].clientX - evt.touches[1].clientX);
                    dy = Math.abs(evt.touches[0].clientY - evt.touches[1].clientY);
                    theta = Math.abs(Math.atan2(dy, dx));
                    bound = (Math.PI * this.attr.zoom.pinchsensitivity) / 90.0;
                }

                if (!this.keepaspectratio &&
                    this.attr.zoom.pinchhorizontal &&
                    theta < bound) {
                    this.attr.zoom.factorx = factor;
                    this.attr.zoom.factory = 1.0;
                    cx = 0;
                    cy = 0;
                    doZoom = true;
                } else if (!this.keepaspectratio &&
                    this.attr.zoom.pinchvertical &&
                    Math.abs(theta - Math.PI * 0.5) < bound
                ) {
                    this.attr.zoom.factorx = 1.0;
                    this.attr.zoom.factory = factor;
                    cx = 0;
                    cy = 0;
                    doZoom = true;
                } else if (this.attr.zoom.pinch) {
                    this.attr.zoom.factorx = factor;
                    this.attr.zoom.factory = factor;
                    cx = c.usrCoords[1];
                    cy = c.usrCoords[2];
                    doZoom = true;
                }

                if (doZoom) {
                    if (zoomCenter === 'board') {
                        this.zoomIn();
                    } else { // including zoomCenter === 'auto'
                        this.zoomIn(cx, cy);
                    }

                    // Restore zoomFactors
                    this.attr.zoom.factorx = zx;
                    this.attr.zoom.factory = zy;
                }
            }

            return false;
        },

        /**
         * Called by iOS/Safari as soon as the user starts a gesture. Works natively on iOS/Safari,
         * on Android we emulate it.
         * @param {Event} evt
         * @returns {Boolean}
         */
        gestureStartListener: function (evt) {
            var pos;

            evt.preventDefault();
            this.prevScale = 1.0;
            // Android pinch to zoom
            this.prevDist = Geometry.distance(
                [evt.touches[0].clientX, evt.touches[0].clientY],
                [evt.touches[1].clientX, evt.touches[1].clientY],
                2
            );
            this.prevCoords = [
                [evt.touches[0].clientX, evt.touches[0].clientY],
                [evt.touches[1].clientX, evt.touches[1].clientY]
            ];
            this.isPreviousGesture = 'none';

            // If pinch-to-zoom is interpreted as panning
            // we have to prepare move origin
            pos = this.getMousePosition(evt, 0);
            this.initMoveOrigin(pos[0], pos[1]);

            this.mode = this.BOARD_MODE_ZOOM;
            return false;
        },

        /**
         * Test if the required key combination is pressed for wheel zoom, move origin and
         * selection
         * @private
         * @param  {Object}  evt    Mouse or pen event
         * @param  {String}  action String containing the action: 'zoom', 'pan', 'selection'.
         * Corresponds to the attribute subobject.
         * @return {Boolean}        true or false.
         */
        _isRequiredKeyPressed: function (evt, action) {
            var obj = this.attr[action];
            if (!obj.enabled) {
                return false;
            }

            if (
                ((obj.needshift && evt.shiftKey) || (!obj.needshift && !evt.shiftKey)) &&
                ((obj.needctrl && evt.ctrlKey) || (!obj.needctrl && !evt.ctrlKey))
            ) {
                return true;
            }

            return false;
        },

        /*
         * Pointer events
         */

        /**
         *
         * Check if pointer event is already registered in {@link JXG.Board#_board_touches}.
         *
         * @param  {Object} evt Event object
         * @return {Boolean} true if down event has already been sent.
         * @private
         */
        _isPointerRegistered: function (evt) {
            var i,
                len = this._board_touches.length;

            for (i = 0; i < len; i++) {
                if (this._board_touches[i].pointerId === evt.pointerId) {
                    return true;
                }
            }
            return false;
        },

        /**
         *
         * Store the position of a pointer event.
         * If not yet done, registers a pointer event in {@link JXG.Board#_board_touches}.
         * Allows to follow the path of that finger on the screen.
         * Only two simultaneous touches are supported.
         *
         * @param {Object} evt Event object
         * @returns {JXG.Board} Reference to the board
         * @private
         */
        _pointerStorePosition: function (evt) {
            var i, found;

            for (i = 0, found = false; i < this._board_touches.length; i++) {
                if (this._board_touches[i].pointerId === evt.pointerId) {
                    this._board_touches[i].clientX = evt.clientX;
                    this._board_touches[i].clientY = evt.clientY;
                    found = true;
                    break;
                }
            }

            // Restrict the number of simultaneous touches to 2
            if (!found && this._board_touches.length < 2) {
                this._board_touches.push({
                    pointerId: evt.pointerId,
                    clientX: evt.clientX,
                    clientY: evt.clientY
                });
            }

            return this;
        },

        /**
         * Deregisters a pointer event in {@link JXG.Board#_board_touches}.
         * It happens if a finger has been lifted from the screen.
         *
         * @param {Object} evt Event object
         * @returns {JXG.Board} Reference to the board
         * @private
         */
        _pointerRemoveTouches: function (evt) {
            var i;
            for (i = 0; i < this._board_touches.length; i++) {
                if (this._board_touches[i].pointerId === evt.pointerId) {
                    this._board_touches.splice(i, 1);
                    break;
                }
            }

            return this;
        },

        /**
         * Remove all registered fingers from {@link JXG.Board#_board_touches}.
         * This might be necessary if too many fingers have been registered.
         * @returns {JXG.Board} Reference to the board
         * @private
         */
        _pointerClearTouches: function (pId) {
            // var i;
            // if (pId) {
            //     for (i = 0; i < this._board_touches.length; i++) {
            //         if (pId === this._board_touches[i].pointerId) {
            //             this._board_touches.splice(i, i);
            //             break;
            //         }
            //     }
            // } else {
            // }
            if (this._board_touches.length > 0) {
                this.dehighlightAll();
            }
            this.updateQuality = this.BOARD_QUALITY_HIGH;
            this.mode = this.BOARD_MODE_NONE;
            this._board_touches = [];
            this.touches = [];
        },

        /**
         * Determine which input device is used for this action.
         * Possible devices are 'touch', 'pen' and 'mouse'.
         * This affects the precision and certain events.
         * In case of no browser, 'mouse' is used.
         *
         * @see JXG.Board#pointerDownListener
         * @see JXG.Board#pointerMoveListener
         * @see JXG.Board#initMoveObject
         * @see JXG.Board#moveObject
         *
         * @param {Event} evt The browsers event object.
         * @returns {String} 'mouse', 'pen', or 'touch'
         * @private
         */
        _getPointerInputDevice: function (evt) {
            if (Env.isBrowser) {
                if (
                    evt.pointerType === 'touch' || // New
                    (window.navigator.msMaxTouchPoints && // Old
                        window.navigator.msMaxTouchPoints > 1)
                ) {
                    return 'touch';
                }
                if (evt.pointerType === 'mouse') {
                    return 'mouse';
                }
                if (evt.pointerType === 'pen') {
                    return 'pen';
                }
            }
            return 'mouse';
        },

        /**
         * This method is called by the browser when a pointing device is pressed on the screen.
         * @param {Event} evt The browsers event object.
         * @param {Object} object If the object to be dragged is already known, it can be submitted via this parameter
         * @param {Boolean} [allowDefaultEventHandling=false] If true event is not canceled, i.e. prevent call of evt.preventDefault()
         * @returns {Boolean} false if the first finger event is sent twice, or not a browser, or in selection mode. Otherwise returns true.
         */
        pointerDownListener: function (evt, object, allowDefaultEventHandling) {
            var i, j, k, pos,
                elements, sel, target_obj,
                type = 'mouse', // Used in case of no browser
                found, target, ta;

            // Fix for Firefox browser: When using a second finger, the
            // touch event for the first finger is sent again.
            if (!object && this._isPointerRegistered(evt)) {
                return false;
            }

            if (Type.evaluate(this.attr.movetarget) === null &&
                Type.exists(evt.target) && Type.exists(evt.target.releasePointerCapture)) {
                evt.target.releasePointerCapture(evt.pointerId);
            }

            if (!object && evt.isPrimary) {
                // First finger down. To be on the safe side this._board_touches is cleared.
                // this._pointerClearTouches();
            }

            if (!this.hasPointerUp) {
                if (window.navigator.msPointerEnabled) {
                    // IE10-
                    Env.addEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                } else {
                    // 'pointercancel' is fired e.g. if the finger leaves the browser and drags down the system menu on Android
                    Env.addEvent(this.document, 'pointerup', this.pointerUpListener, this);
                    Env.addEvent(this.document, 'pointercancel', this.pointerUpListener, this);
                }
                this.hasPointerUp = true;
            }

            if (this.hasMouseHandlers) {
                this.removeMouseEventHandlers();
            }

            if (this.hasTouchHandlers) {
                this.removeTouchEventHandlers();
            }

            // Prevent accidental selection of text
            if (this.document.selection && Type.isFunction(this.document.selection.empty)) {
                this.document.selection.empty();
            } else if (window.getSelection) {
                sel = window.getSelection();
                if (sel.removeAllRanges) {
                    try {
                        sel.removeAllRanges();
                    } catch (e) { }
                }
            }

            // Mouse, touch or pen device
            this._inputDevice = this._getPointerInputDevice(evt);
            type = this._inputDevice;
            this.options.precision.hasPoint = this.options.precision[type];

            // Handling of multi touch with pointer events should be easier than with touch events.
            // Every pointer device has its own pointerId, e.g. the mouse
            // always has id 1 or 0, fingers and pens get unique ids every time a pointerDown event is fired and they will
            // keep this id until a pointerUp event is fired. What we have to do here is:
            //  1. collect all elements under the current pointer
            //  2. run through the touches control structure
            //    a. look for the object collected in step 1.
            //    b. if an object is found, check the number of pointers. If appropriate, add the pointer.
            pos = this.getMousePosition(evt);

            // Handle selection rectangle
            this._testForSelection(evt);
            if (this.selectingMode) {
                this._startSelecting(pos);
                this.triggerEventHandlers(
                    ['touchstartselecting', 'pointerstartselecting', 'startselecting'],
                    [evt]
                );
                return; // don't continue as a normal click
            }

            if (this.attr.drag.enabled && object) {
                elements = [object];
                this.mode = this.BOARD_MODE_DRAG;
            } else {
                elements = this.initMoveObject(pos[0], pos[1], evt, type);
            }

            target_obj = {
                num: evt.pointerId,
                X: pos[0],
                Y: pos[1],
                Xprev: NaN,
                Yprev: NaN,
                Xstart: [],
                Ystart: [],
                Zstart: []
            };

            // If no draggable object can be found, get out here immediately
            if (elements.length > 0) {
                // check touches structure
                target = elements[elements.length - 1];
                found = false;

                // Reminder: this.touches is the list of elements which
                // currently 'possess' a pointer (mouse, pen, finger)
                for (i = 0; i < this.touches.length; i++) {
                    // An element receives a further touch, i.e.
                    // the target is already in our touches array, add the pointer to the existing touch
                    if (this.touches[i].obj === target) {
                        j = i;
                        k = this.touches[i].targets.push(target_obj) - 1;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // A new element has been touched.
                    k = 0;
                    j =
                        this.touches.push({
                            obj: target,
                            targets: [target_obj]
                        }) - 1;
                }

                this.dehighlightAll();
                target.highlight(true);

                this.saveStartPos(target, this.touches[j].targets[k]);

                // Prevent accidental text selection
                // this could get us new trouble: input fields, links and drop down boxes placed as text
                // on the board don't work anymore.
                if (evt && evt.preventDefault && !allowDefaultEventHandling) {
                    // All browser supporting pointer events know preventDefault()
                    evt.preventDefault();
                }
            }

            if (this.touches.length > 0 && !allowDefaultEventHandling) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            if (!Env.isBrowser) {
                return false;
            }
            if (this._getPointerInputDevice(evt) !== 'touch') {
                if (this.mode === this.BOARD_MODE_NONE) {
                    this.mouseOriginMoveStart(evt);
                }
            } else {
                this._pointerStorePosition(evt);
                evt.touches = this._board_touches;

                // Touch events on empty areas of the board are handled here, see also touchStartListener
                // 1. case: one finger. If allowed, this triggers pan with one finger
                if (
                    evt.touches.length === 1 &&
                    this.mode === this.BOARD_MODE_NONE &&
                    this.touchStartMoveOriginOneFinger(evt)
                ) {
                    // Empty by purpose
                } else if (
                    evt.touches.length === 2 &&
                    (this.mode === this.BOARD_MODE_NONE ||
                        this.mode === this.BOARD_MODE_MOVE_ORIGIN)
                ) {
                    // 2. case: two fingers: pinch to zoom or pan with two fingers needed.
                    // This happens when the second finger hits the device. First, the
                    // 'one finger pan mode' has to be cancelled.
                    if (this.mode === this.BOARD_MODE_MOVE_ORIGIN) {
                        this.originMoveEnd();
                    }

                    this.gestureStartListener(evt);
                }
            }

            // Allow browser scrolling
            // For this: pan by one finger has to be disabled

            ta = 'none';   // JSXGraph catches all user touch events
            if (this.mode === this.BOARD_MODE_NONE &&
                (Type.evaluate(this.attr.browserpan) === true || Type.evaluate(this.attr.browserpan.enabled) === true) &&
                // One-finger pan has priority over browserPan
                (Type.evaluate(this.attr.pan.enabled) === false || Type.evaluate(this.attr.pan.needtwofingers) === true)
            ) {
                // ta = 'pan-x pan-y';  // JSXGraph allows browser scrolling
                ta = 'auto';  // JSXGraph allows browser scrolling
            }
            this.containerObj.style.touchAction = ta;

            this.triggerEventHandlers(['touchstart', 'down', 'pointerdown', 'MSPointerDown'], [evt]);

            return true;
        },

        /**
         * Internal handling of click events for pointers and mouse.
         *
         * @param {Event} evt The browsers event object.
         * @param {Array} evtArray list of event names
         * @private
         */
        _handleClicks: function(evt, evtArray) {
            var that = this,
                el, delay, suppress;

            if (this.selectingMode) {
                evt.stopPropagation();
                return;
            }

            delay = Type.evaluate(this.attr.clickdelay);
            suppress = Type.evaluate(this.attr.dblclicksuppressclick);

            if (suppress) {
                // dblclick suppresses previous click events
                this._preventSingleClick = false;

                // Wait if there is a dblclick event.
                // If not fire a click event
                this._singleClickTimer = setTimeout(function() {
                    if (!that._preventSingleClick) {
                        // Fire click event and remove element from click list
                        that.triggerEventHandlers(evtArray, [evt]);
                        for (el in that.clickObjects) {
                            if (that.clickObjects.hasOwnProperty(el)) {
                                that.clickObjects[el].triggerEventHandlers(evtArray, [evt]);
                                delete that.clickObjects[el];
                            }
                        }
                    }
                }, delay);
            } else {
                // dblclick is preceded by two click events

                // Fire click events
                that.triggerEventHandlers(evtArray, [evt]);
                for (el in that.clickObjects) {
                    if (that.clickObjects.hasOwnProperty(el)) {
                        that.clickObjects[el].triggerEventHandlers(evtArray, [evt]);
                    }
                }

                // Clear list of clicked elements with a delay
                setTimeout(function() {
                    for (el in that.clickObjects) {
                        if (that.clickObjects.hasOwnProperty(el)) {
                            delete that.clickObjects[el];
                        }
                    }
                }, delay);
            }
            evt.stopPropagation();
        },

        /**
         * Internal handling of dblclick events for pointers and mouse.
         *
         * @param {Event} evt The browsers event object.
         * @param {Array} evtArray list of event names
         * @private
         */
        _handleDblClicks: function(evt, evtArray) {
            var el;

            if (this.selectingMode) {
                evt.stopPropagation();
                return;
            }

            // Notify that a dblclick has happened
            this._preventSingleClick = true;
            clearTimeout(this._singleClickTimer);

            // Fire dblclick event
            this.triggerEventHandlers(evtArray, [evt]);
            for (el in this.clickObjects) {
                if (this.clickObjects.hasOwnProperty(el)) {
                    this.clickObjects[el].triggerEventHandlers(evtArray, [evt]);
                    delete this.clickObjects[el];
                }
            }

            evt.stopPropagation();
        },

        /**
         * This method is called by the browser when a pointer device clicks on the screen.
         * @param {Event} evt The browsers event object.
         */
        pointerClickListener: function (evt) {
            this._handleClicks(evt, ['click', 'pointerclick']);
        },

        /**
         * This method is called by the browser when a pointer device double clicks on the screen.
         * @param {Event} evt The browsers event object.
         */
        pointerDblClickListener: function (evt) {
            this._handleDblClicks(evt, ['dblclick', 'pointerdblclick']);
        },

        /**
         * This method is called by the browser when the mouse device clicks on the screen.
         * @param {Event} evt The browsers event object.
         */
        mouseClickListener: function (evt) {
            this._handleClicks(evt, ['click', 'mouseclick']);
        },

        /**
         * This method is called by the browser when the mouse device double clicks on the screen.
         * @param {Event} evt The browsers event object.
         */
        mouseDblClickListener: function (evt) {
            this._handleDblClicks(evt, ['dblclick', 'mousedblclick']);
        },

        // /**
        //  * Called if pointer leaves an HTML tag. It is called by the inner-most tag.
        //  * That means, if a JSXGraph text, i.e. an HTML div, is placed close
        //  * to the border of the board, this pointerout event will be ignored.
        //  * @param  {Event} evt
        //  * @return {Boolean}
        //  */
        // pointerOutListener: function (evt) {
        //     if (evt.target === this.containerObj ||
        //         (this.renderer.type === 'svg' && evt.target === this.renderer.foreignObjLayer)) {
        //         this.pointerUpListener(evt);
        //     }
        //     return this.mode === this.BOARD_MODE_NONE;
        // },

        /**
         * Called periodically by the browser while the user moves a pointing device across the screen.
         * @param {Event} evt
         * @returns {Boolean}
         */
        pointerMoveListener: function (evt) {
            var i, j, pos, eps,
                touchTargets,
                type = 'mouse'; // in case of no browser

            if (
                this._getPointerInputDevice(evt) === 'touch' &&
                !this._isPointerRegistered(evt)
            ) {
                // Test, if there was a previous down event of this _getPointerId
                // (in case it is a touch event).
                // Otherwise this move event is ignored. This is necessary e.g. for sketchometry.
                return this.BOARD_MODE_NONE;
            }

            if (!this.checkFrameRate(evt)) {
                return false;
            }

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.dehighlightAll();
                this.displayInfobox(false);
            }

            if (this.mode !== this.BOARD_MODE_NONE) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            this.updateQuality = this.BOARD_QUALITY_LOW;
            // Mouse, touch or pen device
            this._inputDevice = this._getPointerInputDevice(evt);
            type = this._inputDevice;
            this.options.precision.hasPoint = this.options.precision[type];
            eps = this.options.precision.hasPoint * 0.3333;

            pos = this.getMousePosition(evt);
            // Ignore pointer move event if too close at the border
            // and setPointerCapture is off
            if (Type.evaluate(this.attr.movetarget) === null &&
                pos[0] <= eps || pos[1] <= eps ||
                pos[0] >= this.canvasWidth - eps ||
                pos[1] >= this.canvasHeight - eps
            ) {
                return this.mode === this.BOARD_MODE_NONE;
            }

            // selection
            if (this.selectingMode) {
                this._moveSelecting(pos);
                this.triggerEventHandlers(
                    ['touchmoveselecting', 'moveselecting', 'pointermoveselecting'],
                    [evt, this.mode]
                );
            } else if (!this.mouseOriginMove(evt)) {
                if (this.mode === this.BOARD_MODE_DRAG) {
                    // Run through all jsxgraph elements which are touched by at least one finger.
                    for (i = 0; i < this.touches.length; i++) {
                        touchTargets = this.touches[i].targets;
                        // Run through all touch events which have been started on this jsxgraph element.
                        for (j = 0; j < touchTargets.length; j++) {
                            if (touchTargets[j].num === evt.pointerId) {
                                touchTargets[j].X = pos[0];
                                touchTargets[j].Y = pos[1];

                                if (touchTargets.length === 1) {
                                    // Touch by one finger: this is possible for all elements that can be dragged
                                    this.moveObject(pos[0], pos[1], this.touches[i], evt, type);
                                } else if (touchTargets.length === 2) {
                                    // Touch by two fingers: e.g. moving lines
                                    this.twoFingerMove(this.touches[i], evt.pointerId, evt);

                                    touchTargets[j].Xprev = pos[0];
                                    touchTargets[j].Yprev = pos[1];
                                }

                                // There is only one pointer in the evt object, so there's no point in looking further
                                break;
                            }
                        }
                    }
                } else {
                    if (this._getPointerInputDevice(evt) === 'touch') {
                        this._pointerStorePosition(evt);

                        if (this._board_touches.length === 2) {
                            evt.touches = this._board_touches;
                            this.gestureChangeListener(evt);
                        }
                    }

                    // Move event without dragging an element
                    this.highlightElements(pos[0], pos[1], evt, -1);
                }
            }

            // Hiding the infobox is commented out, since it prevents showing the infobox
            // on IE 11+ on 'over'
            //if (this.mode !== this.BOARD_MODE_DRAG) {
            //this.displayInfobox(false);
            //}
            this.triggerEventHandlers(['pointermove', 'MSPointerMove', 'move'], [evt, this.mode]);
            this.updateQuality = this.BOARD_QUALITY_HIGH;

            return this.mode === this.BOARD_MODE_NONE;
        },

        /**
         * Triggered as soon as the user stops touching the device with at least one finger.
         *
         * @param {Event} evt
         * @returns {Boolean}
         */
        pointerUpListener: function (evt) {
            var i, j, found, eh,
                touchTargets,
                updateNeeded = false;

            this.triggerEventHandlers(['touchend', 'up', 'pointerup', 'MSPointerUp'], [evt]);
            this.displayInfobox(false);

            if (evt) {
                for (i = 0; i < this.touches.length; i++) {
                    touchTargets = this.touches[i].targets;
                    for (j = 0; j < touchTargets.length; j++) {
                        if (touchTargets[j].num === evt.pointerId) {
                            touchTargets.splice(j, 1);
                            if (touchTargets.length === 0) {
                                this.touches.splice(i, 1);
                            }
                            break;
                        }
                    }
                }
            }

            this.originMoveEnd();
            this.update();

            // selection
            if (this.selectingMode) {
                this._stopSelecting(evt);
                this.triggerEventHandlers(
                    ['touchstopselecting', 'pointerstopselecting', 'stopselecting'],
                    [evt]
                );
                this.stopSelectionMode();
            } else {
                for (i = this.downObjects.length - 1; i > -1; i--) {
                    found = false;
                    for (j = 0; j < this.touches.length; j++) {
                        if (this.touches[j].obj.id === this.downObjects[i].id) {
                            found = true;
                        }
                    }
                    if (!found) {
                        this.downObjects[i].triggerEventHandlers(
                            ['touchend', 'up', 'pointerup', 'MSPointerUp'],
                            [evt]
                        );
                        if (!Type.exists(this.downObjects[i].coords)) {
                            // snapTo methods have to be called e.g. for line elements here.
                            // For coordsElements there might be a conflict with
                            // attractors, see commit from 2022.04.08, 11:12:18.
                            this.downObjects[i].snapToGrid();
                            this.downObjects[i].snapToPoints();
                            updateNeeded = true;
                        }

                        // Check if we have to keep the element for a click or dblclick event
                        // Otherwise remove it from downObjects
                        eh = this.downObjects[i].eventHandlers;
                        if ((Type.exists(eh.click) && eh.click.length > 0) ||
                            (Type.exists(eh.pointerclick) && eh.pointerclick.length > 0) ||
                            (Type.exists(eh.dblclick) && eh.dblclick.length > 0) ||
                            (Type.exists(eh.pointerdblclick) && eh.pointerdblclick.length > 0)
                        ) {
                            this.clickObjects[this.downObjects[i].id] = this.downObjects[i];
                        }
                        this.downObjects.splice(i, 1);
                    }
                }
            }

            if (this.hasPointerUp) {
                if (window.navigator.msPointerEnabled) {
                    // IE10-
                    Env.removeEvent(this.document, 'MSPointerUp', this.pointerUpListener, this);
                } else {
                    Env.removeEvent(this.document, 'pointerup', this.pointerUpListener, this);
                    Env.removeEvent(
                        this.document,
                        'pointercancel',
                        this.pointerUpListener,
                        this
                    );
                }
                this.hasPointerUp = false;
            }

            // After one finger leaves the screen the gesture is stopped.
            this._pointerClearTouches(evt.pointerId);
            if (this._getPointerInputDevice(evt) !== 'touch') {
                this.dehighlightAll();
            }

            if (updateNeeded) {
                this.update();
            }

            return true;
        },

        /**
         * Triggered by the pointerleave event. This is needed in addition to
         * {@link JXG.Board#pointerUpListener} in the situation that a pen is used
         * and after an up event the pen leaves the hover range vertically. Here, it happens that
         * after the pointerup event further pointermove events are fired and elements get highlighted.
         * This highlighting has to be cancelled.
         *
         * @param {Event} evt
         * @returns {Boolean}
         */
        pointerLeaveListener: function (evt) {
            this.displayInfobox(false);
            this.dehighlightAll();

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
            var i, j, k,
                pos, elements, obj,
                eps = this.options.precision.touch,
                evtTouches = evt['touches'],
                found,
                targets, target,
                touchTargets;

            if (!this.hasTouchEnd) {
                Env.addEvent(this.document, 'touchend', this.touchEndListener, this);
                this.hasTouchEnd = true;
            }

            // Do not remove mouseHandlers, since Chrome on win tablets sends mouseevents if used with pen.
            //if (this.hasMouseHandlers) { this.removeMouseEventHandlers(); }

            // prevent accidental selection of text
            if (this.document.selection && Type.isFunction(this.document.selection.empty)) {
                this.document.selection.empty();
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            // multitouch
            this._inputDevice = 'touch';
            this.options.precision.hasPoint = this.options.precision.touch;

            // This is the most critical part. first we should run through the existing touches and collect all targettouches that don't belong to our
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
            //      --- in the following cases, 'init' means:
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
                touchTargets = this.touches[i].targets;
                for (j = 0; j < touchTargets.length; j++) {
                    touchTargets[j].num = -1;
                    eps = this.options.precision.touch;

                    do {
                        for (k = 0; k < evtTouches.length; k++) {
                            // find the new targettouches
                            if (
                                Math.abs(
                                    Math.pow(evtTouches[k].screenX - touchTargets[j].X, 2) +
                                    Math.pow(evtTouches[k].screenY - touchTargets[j].Y, 2)
                                ) <
                                eps * eps
                            ) {
                                touchTargets[j].num = k;
                                touchTargets[j].X = evtTouches[k].screenX;
                                touchTargets[j].Y = evtTouches[k].screenY;
                                evtTouches[k].jxg_isused = true;
                                break;
                            }
                        }

                        eps *= 2;
                    } while (
                        touchTargets[j].num === -1 &&
                        eps < this.options.precision.touchMax
                    );

                    if (touchTargets[j].num === -1) {
                        JXG.debug(
                            "i couldn't find a targettouches for target no " +
                            j +
                            ' on ' +
                            this.touches[i].obj.name +
                            ' (' +
                            this.touches[i].obj.id +
                            '). Removed the target.'
                        );
                        JXG.debug(
                            'eps = ' + eps + ', touchMax = ' + Options.precision.touchMax
                        );
                        touchTargets.splice(i, 1);
                    }
                }
            }

            // we just re-mapped the targettouches to our existing touches list.
            // now we have to initialize some touches from additional targettouches
            for (i = 0; i < evtTouches.length; i++) {
                if (!evtTouches[i].jxg_isused) {
                    pos = this.getMousePosition(evt, i);
                    // selection
                    // this._testForSelection(evt); // we do not have shift or ctrl keys yet.
                    if (this.selectingMode) {
                        this._startSelecting(pos);
                        this.triggerEventHandlers(
                            ['touchstartselecting', 'startselecting'],
                            [evt]
                        );
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.options.precision.hasPoint = this.options.precision.mouse;
                        return this.touches.length > 0; // don't continue as a normal click
                    }

                    elements = this.initMoveObject(pos[0], pos[1], evt, 'touch');
                    if (elements.length !== 0) {
                        obj = elements[elements.length - 1];
                        target = {
                            num: i,
                            X: evtTouches[i].screenX,
                            Y: evtTouches[i].screenY,
                            Xprev: NaN,
                            Yprev: NaN,
                            Xstart: [],
                            Ystart: [],
                            Zstart: []
                        };

                        if (
                            Type.isPoint(obj) ||
                            obj.elementClass === Const.OBJECT_CLASS_TEXT ||
                            obj.type === Const.OBJECT_TYPE_TICKS ||
                            obj.type === Const.OBJECT_TYPE_IMAGE
                        ) {
                            // It's a point, so it's single touch, so we just push it to our touches
                            targets = [target];

                            // For the UNDO/REDO of object moves
                            this.saveStartPos(obj, targets[0]);

                            this.touches.push({ obj: obj, targets: targets });
                            obj.highlight(true);
                        } else if (
                            obj.elementClass === Const.OBJECT_CLASS_LINE ||
                            obj.elementClass === Const.OBJECT_CLASS_CIRCLE ||
                            obj.elementClass === Const.OBJECT_CLASS_CURVE ||
                            obj.type === Const.OBJECT_TYPE_POLYGON
                        ) {
                            found = false;

                            // first check if this geometric object is already captured in this.touches
                            for (j = 0; j < this.touches.length; j++) {
                                if (obj.id === this.touches[j].obj.id) {
                                    found = true;
                                    // only add it, if we don't have two targets in there already
                                    if (this.touches[j].targets.length === 1) {
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
                                targets = [target];

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

            // Touch events on empty areas of the board are handled here:
            // 1. case: one finger. If allowed, this triggers pan with one finger
            if (
                evtTouches.length === 1 &&
                this.mode === this.BOARD_MODE_NONE &&
                this.touchStartMoveOriginOneFinger(evt)
            ) {
            } else if (
                evtTouches.length === 2 &&
                (this.mode === this.BOARD_MODE_NONE ||
                    this.mode === this.BOARD_MODE_MOVE_ORIGIN)
            ) {
                // 2. case: two fingers: pinch to zoom or pan with two fingers needed.
                // This happens when the second finger hits the device. First, the
                // 'one finger pan mode' has to be cancelled.
                if (this.mode === this.BOARD_MODE_MOVE_ORIGIN) {
                    this.originMoveEnd();
                }
                this.gestureStartListener(evt);
            }

            this.options.precision.hasPoint = this.options.precision.mouse;
            this.triggerEventHandlers(['touchstart', 'down'], [evt]);

            return false;
            //return this.touches.length > 0;
        },

        /**
         * Called periodically by the browser while the user moves his fingers across the device.
         * @param {Event} evt
         * @returns {Boolean}
         */
        touchMoveListener: function (evt) {
            var i,
                pos1,
                pos2,
                touchTargets,
                evtTouches = evt['touches'];

            if (!this.checkFrameRate(evt)) {
                return false;
            }

            if (this.mode !== this.BOARD_MODE_NONE) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.dehighlightAll();
                this.displayInfobox(false);
            }

            this._inputDevice = 'touch';
            this.options.precision.hasPoint = this.options.precision.touch;
            this.updateQuality = this.BOARD_QUALITY_LOW;

            // selection
            if (this.selectingMode) {
                for (i = 0; i < evtTouches.length; i++) {
                    if (!evtTouches[i].jxg_isused) {
                        pos1 = this.getMousePosition(evt, i);
                        this._moveSelecting(pos1);
                        this.triggerEventHandlers(
                            ['touchmoves', 'moveselecting'],
                            [evt, this.mode]
                        );
                        break;
                    }
                }
            } else {
                if (!this.touchOriginMove(evt)) {
                    if (this.mode === this.BOARD_MODE_DRAG) {
                        // Runs over through all elements which are touched
                        // by at least one finger.
                        for (i = 0; i < this.touches.length; i++) {
                            touchTargets = this.touches[i].targets;
                            if (touchTargets.length === 1) {
                                // Touch by one finger:  this is possible for all elements that can be dragged
                                if (evtTouches[touchTargets[0].num]) {
                                    pos1 = this.getMousePosition(evt, touchTargets[0].num);
                                    if (
                                        pos1[0] < 0 ||
                                        pos1[0] > this.canvasWidth ||
                                        pos1[1] < 0 ||
                                        pos1[1] > this.canvasHeight
                                    ) {
                                        return;
                                    }
                                    touchTargets[0].X = pos1[0];
                                    touchTargets[0].Y = pos1[1];
                                    this.moveObject(
                                        pos1[0],
                                        pos1[1],
                                        this.touches[i],
                                        evt,
                                        'touch'
                                    );
                                }
                            } else if (
                                touchTargets.length === 2 &&
                                touchTargets[0].num > -1 &&
                                touchTargets[1].num > -1
                            ) {
                                // Touch by two fingers: moving lines, ...
                                if (
                                    evtTouches[touchTargets[0].num] &&
                                    evtTouches[touchTargets[1].num]
                                ) {
                                    // Get coordinates of the two touches
                                    pos1 = this.getMousePosition(evt, touchTargets[0].num);
                                    pos2 = this.getMousePosition(evt, touchTargets[1].num);
                                    if (
                                        pos1[0] < 0 ||
                                        pos1[0] > this.canvasWidth ||
                                        pos1[1] < 0 ||
                                        pos1[1] > this.canvasHeight ||
                                        pos2[0] < 0 ||
                                        pos2[0] > this.canvasWidth ||
                                        pos2[1] < 0 ||
                                        pos2[1] > this.canvasHeight
                                    ) {
                                        return;
                                    }

                                    touchTargets[0].X = pos1[0];
                                    touchTargets[0].Y = pos1[1];
                                    touchTargets[1].X = pos2[0];
                                    touchTargets[1].Y = pos2[1];

                                    this.twoFingerMove(
                                        this.touches[i],
                                        touchTargets[0].num,
                                        evt
                                    );

                                    touchTargets[0].Xprev = pos1[0];
                                    touchTargets[0].Yprev = pos1[1];
                                    touchTargets[1].Xprev = pos2[0];
                                    touchTargets[1].Yprev = pos2[1];
                                }
                            }
                        }
                    } else {
                        if (evtTouches.length === 2) {
                            this.gestureChangeListener(evt);
                        }
                        // Move event without dragging an element
                        pos1 = this.getMousePosition(evt, 0);
                        this.highlightElements(pos1[0], pos1[1], evt, -1);
                    }
                }
            }

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.displayInfobox(false);
            }

            this.triggerEventHandlers(['touchmove', 'move'], [evt, this.mode]);
            this.options.precision.hasPoint = this.options.precision.mouse;
            this.updateQuality = this.BOARD_QUALITY_HIGH;

            return this.mode === this.BOARD_MODE_NONE;
        },

        /**
         * Triggered as soon as the user stops touching the device with at least one finger.
         * @param {Event} evt
         * @returns {Boolean}
         */
        touchEndListener: function (evt) {
            var i,
                j,
                k,
                eps = this.options.precision.touch,
                tmpTouches = [],
                found,
                foundNumber,
                evtTouches = evt && evt['touches'],
                touchTargets,
                updateNeeded = false;

            this.triggerEventHandlers(['touchend', 'up'], [evt]);
            this.displayInfobox(false);

            // selection
            if (this.selectingMode) {
                this._stopSelecting(evt);
                this.triggerEventHandlers(['touchstopselecting', 'stopselecting'], [evt]);
                this.stopSelectionMode();
            } else if (evtTouches && evtTouches.length > 0) {
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
                    touchTargets = tmpTouches[i].targets;

                    for (j = 0; j < touchTargets.length; j++) {
                        touchTargets[j].found = false;
                        for (k = 0; k < evtTouches.length; k++) {
                            if (
                                Math.abs(
                                    Math.pow(evtTouches[k].screenX - touchTargets[j].X, 2) +
                                    Math.pow(evtTouches[k].screenY - touchTargets[j].Y, 2)
                                ) <
                                eps * eps
                            ) {
                                touchTargets[j].found = true;
                                touchTargets[j].num = k;
                                touchTargets[j].X = evtTouches[k].screenX;
                                touchTargets[j].Y = evtTouches[k].screenY;
                                foundNumber += 1;
                                break;
                            }
                        }
                    }

                    if (Type.isPoint(tmpTouches[i].obj)) {
                        found = touchTargets[0] && touchTargets[0].found;
                    } else if (tmpTouches[i].obj.elementClass === Const.OBJECT_CLASS_LINE) {
                        found =
                            (touchTargets[0] && touchTargets[0].found) ||
                            (touchTargets[1] && touchTargets[1].found);
                    } else if (tmpTouches[i].obj.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                        found = foundNumber === 1 || foundNumber === 3;
                    }

                    // if we found this object to be still dragged by the user, add it back to this.touches
                    if (found) {
                        this.touches.push({
                            obj: tmpTouches[i].obj,
                            targets: []
                        });

                        for (j = 0; j < touchTargets.length; j++) {
                            if (touchTargets[j].found) {
                                this.touches[this.touches.length - 1].targets.push({
                                    num: touchTargets[j].num,
                                    X: touchTargets[j].screenX,
                                    Y: touchTargets[j].screenY,
                                    Xprev: NaN,
                                    Yprev: NaN,
                                    Xstart: touchTargets[j].Xstart,
                                    Ystart: touchTargets[j].Ystart,
                                    Zstart: touchTargets[j].Zstart
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
                    if (!Type.exists(this.downObjects[i].coords)) {
                        // snapTo methods have to be called e.g. for line elements here.
                        // For coordsElements there might be a conflict with
                        // attractors, see commit from 2022.04.08, 11:12:18.
                        this.downObjects[i].snapToGrid();
                        this.downObjects[i].snapToPoints();
                        updateNeeded = true;
                    }
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
                if (updateNeeded) {
                    this.update();
                }
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
            if (this.document.selection && Type.isFunction(this.document.selection.empty)) {
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

            this._inputDevice = 'mouse';
            this.options.precision.hasPoint = this.options.precision.mouse;
            pos = this.getMousePosition(evt);

            // selection
            this._testForSelection(evt);
            if (this.selectingMode) {
                this._startSelecting(pos);
                this.triggerEventHandlers(['mousestartselecting', 'startselecting'], [evt]);
                return; // don't continue as a normal click
            }

            elements = this.initMoveObject(pos[0], pos[1], evt, 'mouse');

            // if no draggable object can be found, get out here immediately
            if (elements.length === 0) {
                this.mode = this.BOARD_MODE_NONE;
                result = true;
            } else {
                this.mouse = {
                    obj: null,
                    targets: [
                        {
                            X: pos[0],
                            Y: pos[1],
                            Xprev: NaN,
                            Yprev: NaN
                        }
                    ]
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
         * This method is called by the browser when the mouse is moved.
         * @param {Event} evt The browsers event object.
         */
        mouseMoveListener: function (evt) {
            var pos;

            if (!this.checkFrameRate(evt)) {
                return false;
            }

            pos = this.getMousePosition(evt);

            this.updateQuality = this.BOARD_QUALITY_LOW;

            if (this.mode !== this.BOARD_MODE_DRAG) {
                this.dehighlightAll();
                this.displayInfobox(false);
            }

            // we have to check for four cases:
            //   * user moves origin
            //   * user drags an object
            //   * user just moves the mouse, here highlight all elements at
            //     the current mouse position
            //   * the user is selecting

            // selection
            if (this.selectingMode) {
                this._moveSelecting(pos);
                this.triggerEventHandlers(
                    ['mousemoveselecting', 'moveselecting'],
                    [evt, this.mode]
                );
            } else if (!this.mouseOriginMove(evt)) {
                if (this.mode === this.BOARD_MODE_DRAG) {
                    this.moveObject(pos[0], pos[1], this.mouse, evt, 'mouse');
                } else {
                    // BOARD_MODE_NONE
                    // Move event without dragging an element
                    this.highlightElements(pos[0], pos[1], evt, -1);
                }
                this.triggerEventHandlers(['mousemove', 'move'], [evt, this.mode]);
            }
            this.updateQuality = this.BOARD_QUALITY_HIGH;
        },

        /**
         * This method is called by the browser when the mouse button is released.
         * @param {Event} evt
         */
        mouseUpListener: function (evt) {
            var i;

            if (this.selectingMode === false) {
                this.triggerEventHandlers(['mouseup', 'up'], [evt]);
            }

            // redraw with high precision
            this.updateQuality = this.BOARD_QUALITY_HIGH;

            if (this.mouse && this.mouse.obj) {
                if (!Type.exists(this.mouse.obj.coords)) {
                    // snapTo methods have to be called e.g. for line elements here.
                    // For coordsElements there might be a conflict with
                    // attractors, see commit from 2022.04.08, 11:12:18.
                    // The parameter is needed for lines with snapToGrid enabled
                    this.mouse.obj.snapToGrid(this.mouse.targets[0]);
                    this.mouse.obj.snapToPoints();
                }
            }

            this.originMoveEnd();
            this.dehighlightAll();
            this.update();

            // selection
            if (this.selectingMode) {
                this._stopSelecting(evt);
                this.triggerEventHandlers(['mousestopselecting', 'stopselecting'], [evt]);
                this.stopSelectionMode();
            } else {
                for (i = 0; i < this.downObjects.length; i++) {
                    this.downObjects[i].triggerEventHandlers(['mouseup', 'up'], [evt]);
                }
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
         * Handler for mouse wheel events. Used to zoom in and out of the board.
         * @param {Event} evt
         * @returns {Boolean}
         */
        mouseWheelListener: function (evt) {
            var wd, zoomCenter, pos;

            if (!this.attr.zoom.enabled ||
                !this.attr.zoom.wheel ||
                !this._isRequiredKeyPressed(evt, 'zoom')) {

                return true;
            }

            evt = evt || window.event;
            wd = evt.detail ? -evt.detail : evt.wheelDelta / 40;
            zoomCenter = this.attr.zoom.center;

            if (zoomCenter === 'board') {
                pos = [];
            } else { // including zoomCenter === 'auto'
                pos = new Coords(Const.COORDS_BY_SCREEN, this.getMousePosition(evt), this).usrCoords;
            }

            // pos == [] does not throw an error
            if (wd > 0) {
                this.zoomIn(pos[1], pos[2]);
            } else {
                this.zoomOut(pos[1], pos[2]);
            }

            this.triggerEventHandlers(['mousewheel'], [evt]);

            evt.preventDefault();
            return false;
        },

        /**
         * Allow moving of JSXGraph elements with arrow keys.
         * The selection of the element is done with the tab key. For this,
         * the attribute 'tabindex' of the element has to be set to some number (default=0).
         * tabindex corresponds to the HTML and SVG attribute of the same name.
         * <p>
         * Panning of the construction is done with arrow keys
         * if the pan key (shift or ctrl - depending on the board attributes) is pressed.
         * <p>
         * Zooming is triggered with the keys +, o, -, if
         * the pan key (shift or ctrl - depending on the board attributes) is pressed.
         * <p>
         * Keyboard control (move, pan, and zoom) is disabled if an HTML element of type input or textarea has received focus.
         *
         * @param  {Event} evt The browser's event object
         *
         * @see JXG.Board#keyboard
         * @see JXG.Board#keyFocusInListener
         * @see JXG.Board#keyFocusOutListener
         *
         */
        keyDownListener: function (evt) {
            var id_node = evt.target.id,
                id, el, res, doc,
                sX = 0,
                sY = 0,
                // dx, dy are provided in screen units and
                // are converted to user coordinates
                dx = Type.evaluate(this.attr.keyboard.dx) / this.unitX,
                dy = Type.evaluate(this.attr.keyboard.dy) / this.unitY,
                // u = 100,
                doZoom = false,
                done = true,
                dir,
                actPos;

            if (!this.attr.keyboard.enabled || id_node === '') {
                return false;
            }

            // dx = Math.round(dx * u) / u;
            // dy = Math.round(dy * u) / u;

            // An element of type input or textarea has focus, get out of here.
            doc = this.containerObj.shadowRoot || document;
            if (doc.activeElement) {
                el = doc.activeElement;
                if (el.tagName === 'INPUT' || el.tagName === 'textarea') {
                    return false;
                }
            }

            // Get the JSXGraph id from the id of the SVG node.
            id = id_node.replace(this.containerObj.id + '_', '');
            el = this.select(id);

            if (Type.exists(el.coords)) {
                actPos = el.coords.usrCoords.slice(1);
            }

            if (
                (Type.evaluate(this.attr.keyboard.panshift) && evt.shiftKey) ||
                (Type.evaluate(this.attr.keyboard.panctrl) && evt.ctrlKey)
            ) {
                // Pan key has been pressed

                if (Type.evaluate(this.attr.zoom.enabled) === true) {
                    doZoom = true;
                }

                // Arrow keys
                if (evt.keyCode === 38) {
                    // up
                    this.clickUpArrow();
                } else if (evt.keyCode === 40) {
                    // down
                    this.clickDownArrow();
                } else if (evt.keyCode === 37) {
                    // left
                    this.clickLeftArrow();
                } else if (evt.keyCode === 39) {
                    // right
                    this.clickRightArrow();

                    // Zoom keys
                } else if (doZoom && evt.keyCode === 171) {
                    // +
                    this.zoomIn();
                } else if (doZoom && evt.keyCode === 173) {
                    // -
                    this.zoomOut();
                } else if (doZoom && evt.keyCode === 79) {
                    // o
                    this.zoom100();
                } else {
                    done = false;
                }
            } else if (!evt.shiftKey && !evt.ctrlKey) {         // Move an element if neither shift or ctrl are pressed
                // Adapt dx, dy to snapToGrid and attractToGrid.
                // snapToGrid has priority.
                if (Type.exists(el.visProp)) {
                    if (
                        Type.exists(el.visProp.snaptogrid) &&
                        el.visProp.snaptogrid &&
                        el.evalVisProp('snapsizex') &&
                        el.evalVisProp('snapsizey')
                    ) {
                        // Adapt dx, dy such that snapToGrid is possible
                        res = el.getSnapSizes();
                        sX = res[0];
                        sY = res[1];
                        // If snaptogrid is true,
                        // we can only jump from grid point to grid point.
                        dx = sX;
                        dy = sY;
                    } else if (
                        Type.exists(el.visProp.attracttogrid) &&
                        el.visProp.attracttogrid &&
                        el.evalVisProp('attractordistance') &&
                        el.evalVisProp('attractorunit')
                    ) {
                        // Adapt dx, dy such that attractToGrid is possible
                        sX = 1.1 * el.evalVisProp('attractordistance');
                        sY = sX;

                        if (el.evalVisProp('attractorunit') === 'screen') {
                            sX /= this.unitX;
                            sY /= this.unitX;
                        }
                        dx = Math.max(sX, dx);
                        dy = Math.max(sY, dy);
                    }
                }

                if (evt.keyCode === 38) {
                    // up
                    dir = [0, dy];
                } else if (evt.keyCode === 40) {
                    // down
                    dir = [0, -dy];
                } else if (evt.keyCode === 37) {
                    // left
                    dir = [-dx, 0];
                } else if (evt.keyCode === 39) {
                    // right
                    dir = [dx, 0];
                } else {
                    done = false;
                }

                if (dir && el.isDraggable &&
                    el.visPropCalc.visible &&
                    ((this.geonextCompatibilityMode &&
                        (Type.isPoint(el) ||
                            el.elementClass === Const.OBJECT_CLASS_TEXT)
                    ) || !this.geonextCompatibilityMode) &&
                    !el.evalVisProp('fixed')
                ) {
                    this.mode = this.BOARD_MODE_DRAG;
                    if (Type.exists(el.coords)) {
                        dir[0] += actPos[0];
                        dir[1] += actPos[1];
                    }
                    // For coordsElement setPosition has to call setPositionDirectly.
                    // Otherwise the position is set by a translation.
                    if (Type.exists(el.coords)) {
                        el.setPosition(JXG.COORDS_BY_USER, dir);
                        this.updateInfobox(el);
                    } else {
                        this.displayInfobox(false);
                        el.setPositionDirectly(
                            Const.COORDS_BY_USER,
                            dir,
                            [0, 0]
                        );
                    }

                    this.triggerEventHandlers(['keymove', 'move'], [evt, this.mode]);
                    el.triggerEventHandlers(['keydrag', 'drag'], [evt]);
                    this.mode = this.BOARD_MODE_NONE;
                }
            }

            this.update();

            if (done && Type.exists(evt.preventDefault)) {
                evt.preventDefault();
            }
            return done;
        },

        /**
         * Event listener for SVG elements getting focus.
         * This is needed for highlighting when using keyboard control.
         * Only elements having the attribute 'tabindex' can receive focus.
         *
         * @see JXG.Board#keyFocusOutListener
         * @see JXG.Board#keyDownListener
         * @see JXG.Board#keyboard
         *
         * @param  {Event} evt The browser's event object
         */
        keyFocusInListener: function (evt) {
            var id_node = evt.target.id,
                id,
                el;

            if (!this.attr.keyboard.enabled || id_node === '') {
                return false;
            }

            // Get JSXGraph id from node id
            id = id_node.replace(this.containerObj.id + '_', '');
            el = this.select(id);
            if (Type.exists(el.highlight)) {
                el.highlight(true);
                this.focusObjects = [id];
                el.triggerEventHandlers(['hit'], [evt]);
            }
            if (Type.exists(el.coords)) {
                this.updateInfobox(el);
            }
        },

        /**
         * Event listener for SVG elements losing focus.
         * This is needed for dehighlighting when using keyboard control.
         * Only elements having the attribute 'tabindex' can receive focus.
         *
         * @see JXG.Board#keyFocusInListener
         * @see JXG.Board#keyDownListener
         * @see JXG.Board#keyboard
         *
         * @param  {Event} evt The browser's event object
         */
        keyFocusOutListener: function (evt) {
            if (!this.attr.keyboard.enabled) {
                return false;
            }
            this.focusObjects = []; // This has to be before displayInfobox(false)
            this.dehighlightAll();
            this.displayInfobox(false);
        },

        /**
         * Update the width and height of the JSXGraph container div element.
         * If width and height are not supplied, read actual values with offsetWidth/Height,
         * and call board.resizeContainer() with this values.
         * <p>
         * If necessary, also call setBoundingBox().
         * @param {Number} [width=this.containerObj.offsetWidth] Width of the container element
         * @param {Number} [height=this.containerObj.offsetHeight] Height of the container element
         * @returns {JXG.Board} Reference to the board
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#resizeListener
         * @see JXG.Board#resizeContainer
         * @see JXG.Board#setBoundingBox
         *
         */
        updateContainerDims: function (width, height) {
            var w = width,
                h = height,
                // bb,
                css,
                width_adjustment, height_adjustment;

            if (width === undefined) {
                // Get size of the board's container div
                //
                // offsetWidth/Height ignores CSS transforms,
                // getBoundingClientRect includes CSS transforms
                //
                // bb = this.containerObj.getBoundingClientRect();
                // w = bb.width;
                // h = bb.height;
                w = this.containerObj.offsetWidth;
                h = this.containerObj.offsetHeight;
            }

            if (width === undefined && window && window.getComputedStyle) {
                // Subtract the border size
                css = window.getComputedStyle(this.containerObj, null);
                width_adjustment = parseFloat(css.getPropertyValue('border-left-width')) + parseFloat(css.getPropertyValue('border-right-width'));
                if (!isNaN(width_adjustment)) {
                    w -= width_adjustment;
                }
                height_adjustment = parseFloat(css.getPropertyValue('border-top-width')) + parseFloat(css.getPropertyValue('border-bottom-width'));
                if (!isNaN(height_adjustment)) {
                    h -= height_adjustment;
                }
            }

            // If div is invisible - do nothing
            if (w <= 0 || h <= 0 || isNaN(w) || isNaN(h)) {
                return this;
            }

            // If bounding box is not yet initialized, do it now.
            if (isNaN(this.getBoundingBox()[0])) {
                this.setBoundingBox(this.attr.boundingbox, this.keepaspectratio, 'keep');
            }

            // Do nothing if the dimension did not change since being visible
            // the last time. Note that if the div had display:none in the mean time,
            // we did not store this._prevDim.
            if (Type.exists(this._prevDim) && this._prevDim.w === w && this._prevDim.h === h) {
                return this;
            }
            // Set the size of the SVG or canvas element
            this.resizeContainer(w, h, true);
            this._prevDim = {
                w: w,
                h: h
            };
            return this;
        },

        /**
         * Start observer which reacts to size changes of the JSXGraph
         * container div element. Calls updateContainerDims().
         * If not available, an event listener for the window-resize event is started.
         * On mobile devices also scrolling might trigger resizes.
         * However, resize events triggered by scrolling events should be ignored.
         * Therefore, also a scrollListener is started.
         * Resize can be controlled with the board attribute resize.
         *
         * @see JXG.Board#updateContainerDims
         * @see JXG.Board#resizeListener
         * @see JXG.Board#scrollListener
         * @see JXG.Board#resize
         *
         */
        startResizeObserver: function () {
            var that = this;

            if (!Env.isBrowser || !this.attr.resize || !this.attr.resize.enabled) {
                return;
            }

            this.resizeObserver = new ResizeObserver(function (entries) {
                var bb;
                if (!that._isResizing) {
                    that._isResizing = true;
                    bb = entries[0].contentRect;
                    window.setTimeout(function () {
                        try {
                            that.updateContainerDims(bb.width, bb.height);
                        } catch (e) {
                            JXG.debug(e);   // Used to log errors during board.update()
                            that.stopResizeObserver();
                        } finally {
                            that._isResizing = false;
                        }
                    }, that.attr.resize.throttle);
                }
            });
            this.resizeObserver.observe(this.containerObj);
        },

        /**
         * Stops the resize observer.
         * @see JXG.Board#startResizeObserver
         *
         */
        stopResizeObserver: function () {
            if (!Env.isBrowser || !this.attr.resize || !this.attr.resize.enabled) {
                return;
            }

            if (Type.exists(this.resizeObserver)) {
                this.resizeObserver.unobserve(this.containerObj);
            }
        },

        /**
         * Fallback solutions if there is no resizeObserver available in the browser.
         * Reacts to resize events of the window (only). Otherwise similar to
         * startResizeObserver(). To handle changes of the visibility
         * of the JSXGraph container element, additionally an intersection observer is used.
         * which watches changes in the visibility of the JSXGraph container element.
         * This is necessary e.g. for register tabs or dia shows.
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#startIntersectionObserver
         */
        resizeListener: function () {
            var that = this;

            if (!Env.isBrowser || !this.attr.resize || !this.attr.resize.enabled) {
                return;
            }
            if (!this._isScrolling && !this._isResizing) {
                this._isResizing = true;
                window.setTimeout(function () {
                    that.updateContainerDims();
                    that._isResizing = false;
                }, this.attr.resize.throttle);
            }
        },

        /**
         * Listener to watch for scroll events. Sets board._isScrolling = true
         * @param  {Event} evt The browser's event object
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#resizeListener
         *
         */
        scrollListener: function (evt) {
            var that = this;

            if (!Env.isBrowser) {
                return;
            }
            if (!this._isScrolling) {
                this._isScrolling = true;
                window.setTimeout(function () {
                    that._isScrolling = false;
                }, 66);
            }
        },

        /**
         * Watch for changes of the visibility of the JSXGraph container element.
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#resizeListener
         *
         */
        startIntersectionObserver: function () {
            var that = this,
                options = {
                    root: null,
                    rootMargin: '0px',
                    threshold: 0.8
                };

            try {
                this.intersectionObserver = new IntersectionObserver(function (entries) {
                    // If bounding box is not yet initialized, do it now.
                    if (isNaN(that.getBoundingBox()[0])) {
                        that.updateContainerDims();
                    }
                }, options);
                this.intersectionObserver.observe(that.containerObj);
            } catch (err) {
                JXG.debug('JSXGraph: IntersectionObserver not available in this browser.');
            }
        },

        /**
         * Stop the intersection observer
         *
         * @see JXG.Board#startIntersectionObserver
         *
         */
        stopIntersectionObserver: function () {
            if (Type.exists(this.intersectionObserver)) {
                this.intersectionObserver.unobserve(this.containerObj);
            }
        },

        /**
         * Update the container before and after printing.
         * @param {Event} [evt]
         */
        printListener: function(evt) {
            this.updateContainerDims();
        },

        /**
         * Wrapper for printListener to be used in mediaQuery matches.
         * @param {MediaQueryList} mql
         */
        printListenerMatch: function (mql) {
            if (mql.matches) {
                this.printListener();
            }
        },

        /**********************************************************
         *
         * End of Event Handlers
         *
         **********************************************************/

        /**
         * Initialize the info box object which is used to display
         * the coordinates of points near the mouse pointer,
         * @returns {JXG.Board} Reference to the board
         */
        initInfobox: function (attributes) {
            var attr = Type.copyAttributes(attributes, this.options, 'infobox');

            attr.id = this.id + '_infobox';

            /**
             * Infobox close to points in which the points' coordinates are displayed.
             * This is simply a JXG.Text element. Access through board.infobox.
             * Uses CSS class .JXGinfobox.
             *
             * @namespace
             * @name JXG.Board.infobox
             * @type JXG.Text
             *
             * @example
             * const board = JXG.JSXGraph.initBoard(BOARDID, {
             *     boundingbox: [-0.5, 0.5, 0.5, -0.5],
             *     intl: {
             *         enabled: false,
             *         locale: 'de-DE'
             *     },
             *     keepaspectratio: true,
             *     axis: true,
             *     infobox: {
             *         distanceY: 40,
             *         intl: {
             *             enabled: true,
             *             options: {
             *                 minimumFractionDigits: 1,
             *                 maximumFractionDigits: 2
             *             }
             *         }
             *     }
             * });
             * var p = board.create('point', [0.1, 0.1], {});
             *
             * </pre><div id="JXG822161af-fe77-4769-850f-cdf69935eab0" class="jxgbox" style="width: 300px; height: 300px;"></div>
             * <script type="text/javascript">
             *     (function() {
             *     const board = JXG.JSXGraph.initBoard('JXG822161af-fe77-4769-850f-cdf69935eab0', {
             *         boundingbox: [-0.5, 0.5, 0.5, -0.5], showcopyright: false, shownavigation: false,
             *         intl: {
             *             enabled: false,
             *             locale: 'de-DE'
             *         },
             *         keepaspectratio: true,
             *         axis: true,
             *         infobox: {
             *             distanceY: 40,
             *             intl: {
             *                 enabled: true,
             *                 options: {
             *                     minimumFractionDigits: 1,
             *                     maximumFractionDigits: 2
             *                 }
             *             }
             *         }
             *     });
             *     var p = board.create('point', [0.1, 0.1], {});
             *     })();
             *
             * </script><pre>
             *
             */
            this.infobox = this.create('text', [0, 0, '0,0'], attr);
            // this.infobox.needsUpdateSize = false;  // That is not true, but it speeds drawing up.
            this.infobox.dump = false;

            this.displayInfobox(false);
            return this;
        },

        /**
         * Updates and displays a little info box to show coordinates of current selected points.
         * @param {JXG.GeometryElement} el A GeometryElement
         * @returns {JXG.Board} Reference to the board
         * @see JXG.Board#displayInfobox
         * @see JXG.Board#showInfobox
         * @see Point#showInfobox
         *
         */
        updateInfobox: function (el) {
            var x, y, xc, yc,
                vpinfoboxdigits,
                distX, distY,
                vpsi = el.evalVisProp('showinfobox');

            if ((!Type.evaluate(this.attr.showinfobox) && vpsi === 'inherit') || !vpsi) {
                return this;
            }

            if (Type.isPoint(el)) {
                xc = el.coords.usrCoords[1];
                yc = el.coords.usrCoords[2];
                distX = this.infobox.evalVisProp('distancex');
                distY = this.infobox.evalVisProp('distancey');

                this.infobox.setCoords(
                    xc + distX / this.unitX,
                    yc + distY / this.unitY
                );

                vpinfoboxdigits = el.evalVisProp('infoboxdigits');
                if (typeof el.infoboxText !== 'string') {
                    if (vpinfoboxdigits === 'auto') {
                        if (this.infobox.useLocale()) {
                            x = this.infobox.formatNumberLocale(xc);
                            y = this.infobox.formatNumberLocale(yc);
                        } else {
                            x = Type.autoDigits(xc);
                            y = Type.autoDigits(yc);
                        }
                    } else if (Type.isNumber(vpinfoboxdigits)) {
                        if (this.infobox.useLocale()) {
                            x = this.infobox.formatNumberLocale(xc, vpinfoboxdigits);
                            y = this.infobox.formatNumberLocale(yc, vpinfoboxdigits);
                        } else {
                            x = Type.toFixed(xc, vpinfoboxdigits);
                            y = Type.toFixed(yc, vpinfoboxdigits);
                        }

                    } else {
                        x = xc;
                        y = yc;
                    }

                    this.highlightInfobox(x, y, el);
                } else {
                    this.highlightCustomInfobox(el.infoboxText, el);
                }

                this.displayInfobox(true);
            }
            return this;
        },

        /**
         * Set infobox visible / invisible.
         *
         * It uses its property hiddenByParent to memorize its status.
         * In this way, many DOM access can be avoided.
         *
         * @param  {Boolean} val true for visible, false for invisible
         * @returns {JXG.Board} Reference to the board.
         * @see JXG.Board#updateInfobox
         *
         */
        displayInfobox: function (val) {
            if (!val && this.focusObjects.length > 0 &&
                this.select(this.focusObjects[0]).elementClass === Const.OBJECT_CLASS_POINT) {
                // If an element has focus we do not hide its infobox
                return this;
            }
            if (this.infobox.hiddenByParent === val) {
                this.infobox.hiddenByParent = !val;
                this.infobox.prepareUpdate().updateVisibility(val).updateRenderer();
            }
            return this;
        },

        // Alias for displayInfobox to be backwards compatible.
        // The method showInfobox clashes with the board attribute showInfobox
        showInfobox: function (val) {
            return this.displayInfobox(val);
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
         * Remove highlighting of all elements.
         * @returns {JXG.Board} Reference to the board.
         */
        dehighlightAll: function () {
            var el,
                pEl,
                stillHighlighted = {},
                needsDeHighlight = false;

            for (el in this.highlightedObjects) {
                if (this.highlightedObjects.hasOwnProperty(el)) {

                    pEl = this.highlightedObjects[el];
                    if (this.focusObjects.indexOf(el) < 0) { // Element does not have focus
                        if (this.hasMouseHandlers || this.hasPointerHandlers) {
                            pEl.noHighlight();
                        }
                        needsDeHighlight = true;
                    } else {
                        stillHighlighted[el] = pEl;
                    }
                    // In highlightedObjects should only be objects which fulfill all these conditions
                    // And in case of complex elements, like a turtle based fractal, it should be faster to
                    // just de-highlight the element instead of checking hasPoint...
                    // if ((!Type.exists(pEl.hasPoint)) || !pEl.hasPoint(x, y) || !pEl.visPropCalc.visible)
                }
            }

            this.highlightedObjects = stillHighlighted;

            // We do not need to redraw during dehighlighting in CanvasRenderer
            // because we are redrawing anyhow
            //  -- We do need to redraw during dehighlighting. Otherwise objects won't be dehighlighted until
            // another object is highlighted.
            if (this.renderer.type === 'canvas' && needsDeHighlight) {
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
         * @private
         * @param {Number} x X coordinate in screen coordinates
         * @param {Number} y Y coordinate in screen coordinates
         * @returns {Array} Coordinates [x, y] of the mouse in screen coordinates.
         * @see JXG.Board#getUsrCoordsOfMouse
         */
        getScrCoordsOfMouse: function (x, y) {
            return [x, y];
        },

        /**
         * This method calculates the user coords of the current mouse coordinates.
         * @param {Event} evt Event object containing the mouse coordinates.
         * @returns {Array} Coordinates [x, y] of the mouse in user coordinates.
         * @example
         * board.on('up', function (evt) {
         *         var a = board.getUsrCoordsOfMouse(evt),
         *             x = a[0],
         *             y = a[1],
         *             somePoint = board.create('point', [x,y], {name:'SomePoint',size:4});
         *             // Shorter version:
         *             //somePoint = board.create('point', a, {name:'SomePoint',size:4});
         *         });
         *
         * </pre><div id='JXG48d5066b-16ba-4920-b8ea-a4f8eff6b746' class='jxgbox' style='width: 300px; height: 300px;'></div>
         * <script type='text/javascript'>
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG48d5066b-16ba-4920-b8ea-a4f8eff6b746',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     board.on('up', function (evt) {
         *             var a = board.getUsrCoordsOfMouse(evt),
         *                 x = a[0],
         *                 y = a[1],
         *                 somePoint = board.create('point', [x,y], {name:'SomePoint',size:4});
         *                 // Shorter version:
         *                 //somePoint = board.create('point', a, {name:'SomePoint',size:4});
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         * @see JXG.Board#getScrCoordsOfMouse
         * @see JXG.Board#getAllUnderMouse
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
         * @see JXG.Board#getUsrCoordsOfMouse
         * @see JXG.Board#getAllObjectsUnderMouse
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
         * @see JXG.Board#getAllUnderMouse
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
                if (pEl.visPropCalc.visible && pEl.hasPoint && pEl.hasPoint(dx, dy)) {
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
            var el, ob,
                len = this.objectsList.length;

            for (ob = 0; ob < len; ob++) {
                el = this.objectsList[ob];

                if (Type.exists(el.coords)) {
                    if (el.evalVisProp('frozen') === true) {
                        if (el.is3D) {
                            el.element2D.coords.screen2usr();
                        } else {
                            el.coords.screen2usr();
                        }
                    } else {
                        if (el.is3D) {
                            el.element2D.coords.usr2screen();
                        } else {
                            el.coords.usr2screen();
                            if (Type.exists(el.actualCoords)) {
                                el.actualCoords.usr2screen();
                            }
                        }
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
            var ox, oy, ul, lr;
            if (Type.exists(x) && Type.exists(y)) {
                ox = this.origin.scrCoords[1];
                oy = this.origin.scrCoords[2];

                this.origin.scrCoords[1] = x;
                this.origin.scrCoords[2] = y;

                if (diff) {
                    this.origin.scrCoords[1] -= this.drag_dx;
                    this.origin.scrCoords[2] -= this.drag_dy;
                }

                ul = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this).usrCoords;
                lr = new Coords(
                    Const.COORDS_BY_SCREEN,
                    [this.canvasWidth, this.canvasHeight],
                    this
                ).usrCoords;
                if (
                    ul[1] < this.maxboundingbox[0] - Mat.eps ||
                    ul[2] > this.maxboundingbox[1] + Mat.eps ||
                    lr[1] > this.maxboundingbox[2] + Mat.eps ||
                    lr[2] < this.maxboundingbox[3] - Mat.eps
                ) {
                    this.origin.scrCoords[1] = ox;
                    this.origin.scrCoords[2] = oy;
                }
            }

            this.updateCoords().clearTraces().fullUpdate();
            this.triggerEventHandlers(['boundingbox']);

            return this;
        },

        /**
         * Add conditional updates to the elements.
         * @param {String} str String containing conditional update in geonext syntax
         */
        addConditions: function (str) {
            var term,
                m,
                left,
                right,
                name,
                el,
                property,
                functions = [],
                // plaintext = 'var el, x, y, c, rgbo;\n',
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

                        e.setAttribute({ visible: v });
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
                term = str.slice(i + 6, j); // throw away <data>
                m = term.indexOf('=');
                left = term.slice(0, m);
                right = term.slice(m + 1);
                m = left.indexOf('.');   // Resulting variable names must not contain dots, e.g. ' Steuern akt.'
                name = left.slice(0, m); //.replace(/\s+$/,''); // do NOT cut out name (with whitespace)
                el = this.elementsByName[Type.unescapeHTML(name)];

                property = left
                    .slice(m + 1)
                    .replace(/\s+/g, '')
                    .toLowerCase(); // remove whitespace in property
                right = Type.createFunction(right, this, '', true);

                // Debug
                if (!Type.exists(this.elementsByName[name])) {
                    JXG.debug('debug conditions: |' + name + '| undefined');
                } else {
                    // plaintext += 'el = this.objects[\'' + el.id + '\'];\n';

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
                            JXG.debug(
                                'property "' +
                                property +
                                '" in conditions not yet implemented:' +
                                right
                            );
                            break;
                    }
                }
                str = str.slice(j + 7); // cut off '</data>'
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
            var p1, p2,
                bbox = this.getBoundingBox(),
                gridStep = Type.evaluate(this.options.grid.majorStep),
                gridX = Type.evaluate(this.options.grid.gridX),
                gridY = Type.evaluate(this.options.grid.gridY),
                x, y;

            if (!Type.isArray(gridStep)) {
                gridStep = [gridStep, gridStep];
            }
            if (gridStep.length < 2) {
                gridStep = [gridStep[0], gridStep[0]];
            }
            if (Type.exists(gridX)) {
                gridStep[0] = gridX;
            }
            if (Type.exists(gridY)) {
                gridStep[1] = gridY;
            }

            if (gridStep[0] === 'auto') {
                gridStep[0] = 1;
            } else {
                gridStep[0] = Type.parseNumber(gridStep[0], Math.abs(bbox[1] - bbox[3]), 1 / this.unitX);
            }
            if (gridStep[1] === 'auto') {
                gridStep[1] = 1;
            } else {
                gridStep[1] = Type.parseNumber(gridStep[1], Math.abs(bbox[0] - bbox[2]), 1 / this.unitY);
            }

            p1 = new Coords(Const.COORDS_BY_USER, [0, 0], this);
            p2 = new Coords(
                Const.COORDS_BY_USER,
                [gridStep[0], gridStep[1]],
                this
            );
            x = p1.scrCoords[1] - p2.scrCoords[1];
            y = p1.scrCoords[2] - p2.scrCoords[2];

            this.options.grid.snapSizeX = gridStep[0];
            while (Math.abs(x) > 25) {
                this.options.grid.snapSizeX *= 2;
                x /= 2;
            }

            this.options.grid.snapSizeY = gridStep[1];
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
         * The zoom operation is centered at x, y.
         * @param {Number} [x]
         * @param {Number} [y]
         * @returns {JXG.Board} Reference to the board
         */
        zoomIn: function (x, y) {
            var bb = this.getBoundingBox(),
                zX = Type.evaluate(this.attr.zoom.factorx),
                zY =  Type.evaluate(this.attr.zoom.factory),
                dX = (bb[2] - bb[0]) * (1.0 - 1.0 / zX),
                dY = (bb[1] - bb[3]) * (1.0 - 1.0 / zY),
                lr = 0.5,
                tr = 0.5,
                ma = Type.evaluate(this.attr.zoom.max),
                mi =  Type.evaluate(this.attr.zoom.eps) || Type.evaluate(this.attr.zoom.min) || 0.001; // this.attr.zoom.eps is deprecated

            if (
                (this.zoomX > ma && zX > 1.0) ||
                (this.zoomY > ma && zY > 1.0) ||
                (this.zoomX < mi && zX < 1.0) || // zoomIn is used for all zooms on touch devices
                (this.zoomY < mi && zY < 1.0)
            ) {
                return this;
            }

            if (Type.isNumber(x) && Type.isNumber(y)) {
                lr = (x - bb[0]) / (bb[2] - bb[0]);
                tr = (bb[1] - y) / (bb[1] - bb[3]);
            }

            this.setBoundingBox(
                [
                    bb[0] + dX * lr,
                    bb[1] - dY * tr,
                    bb[2] - dX * (1 - lr),
                    bb[3] + dY * (1 - tr)
                ],
                this.keepaspectratio,
                'update'
            );
            return this.applyZoom();
        },

        /**
         * Zooms out of the board by the factors board.attr.zoom.factorX and board.attr.zoom.factorY and applies the zoom.
         * The zoom operation is centered at x, y.
         *
         * @param {Number} [x]
         * @param {Number} [y]
         * @returns {JXG.Board} Reference to the board
         */
        zoomOut: function (x, y) {
            var bb = this.getBoundingBox(),
                zX = Type.evaluate(this.attr.zoom.factorx),
                zY = Type.evaluate(this.attr.zoom.factory),
                dX = (bb[2] - bb[0]) * (1.0 - zX),
                dY = (bb[1] - bb[3]) * (1.0 - zY),
                lr = 0.5,
                tr = 0.5,
                mi = Type.evaluate(this.attr.zoom.eps) || Type.evaluate(this.attr.zoom.min) || 0.001; // this.attr.zoom.eps is deprecated

            if (this.zoomX < mi || this.zoomY < mi) {
                return this;
            }

            if (Type.isNumber(x) && Type.isNumber(y)) {
                lr = (x - bb[0]) / (bb[2] - bb[0]);
                tr = (bb[1] - y) / (bb[1] - bb[3]);
            }

            this.setBoundingBox(
                [
                    bb[0] + dX * lr,
                    bb[1] - dY * tr,
                    bb[2] - dX * (1 - lr),
                    bb[3] + dY * (1 - tr)
                ],
                this.keepaspectratio,
                'update'
            );

            return this.applyZoom();
        },

        /**
         * Reset the zoom level to the original zoom level from initBoard();
         * Additionally, if the board as been initialized with a boundingBox (which is the default),
         * restore the viewport to the original viewport during initialization. Otherwise,
         * (i.e. if the board as been initialized with unitX/Y and originX/Y),
         * just set the zoom level to 100%.
         *
         * @returns {JXG.Board} Reference to the board
         */
        zoom100: function () {
            var bb, dX, dY;

            if (Type.exists(this.attr.boundingbox)) {
                this.setBoundingBox(this.attr.boundingbox, this.keepaspectratio, 'reset');
            } else {
                // Board has been set up with unitX/Y and originX/Y
                bb = this.getBoundingBox();
                dX = (bb[2] - bb[0]) * (1.0 - this.zoomX) * 0.5;
                dY = (bb[1] - bb[3]) * (1.0 - this.zoomY) * 0.5;
                this.setBoundingBox(
                    [bb[0] + dX, bb[1] - dY, bb[2] - dX, bb[3] + dY],
                    this.keepaspectratio,
                    'reset'
                );
            }
            return this.applyZoom();
        },

        /**
         * Zooms the board so every visible point is shown. Keeps aspect ratio.
         * @returns {JXG.Board} Reference to the board
         */
        zoomAllPoints: function () {
            var el,
                border,
                borderX,
                borderY,
                pEl,
                minX = 0,
                maxX = 0,
                minY = 0,
                maxY = 0,
                len = this.objectsList.length;

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];

                if (Type.isPoint(pEl) && pEl.visPropCalc.visible) {
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

            this.setBoundingBox(
                [minX - borderX, maxY + borderY, maxX + borderX, minY - borderY],
                this.keepaspectratio,
                'update'
            );

            return this.applyZoom();
        },

        /**
         * Reset the bounding box and the zoom level to 100% such that a given set of elements is
         * within the board's viewport.
         * @param {Array} elements A set of elements given by id, reference, or name.
         * @returns {JXG.Board} Reference to the board.
         */
        zoomElements: function (elements) {
            var i, e,
                box,
                newBBox = [Infinity, -Infinity, -Infinity, Infinity],
                cx, cy,
                dx, dy,
                d;

            if (!Type.isArray(elements) || elements.length === 0) {
                return this;
            }

            for (i = 0; i < elements.length; i++) {
                e = this.select(elements[i]);

                box = e.bounds();
                if (Type.isArray(box)) {
                    if (box[0] < newBBox[0]) {
                        newBBox[0] = box[0];
                    }
                    if (box[1] > newBBox[1]) {
                        newBBox[1] = box[1];
                    }
                    if (box[2] > newBBox[2]) {
                        newBBox[2] = box[2];
                    }
                    if (box[3] < newBBox[3]) {
                        newBBox[3] = box[3];
                    }
                }
            }

            if (Type.isArray(newBBox)) {
                cx = 0.5 * (newBBox[0] + newBBox[2]);
                cy = 0.5 * (newBBox[1] + newBBox[3]);
                dx = 1.5 * (newBBox[2] - newBBox[0]) * 0.5;
                dy = 1.5 * (newBBox[1] - newBBox[3]) * 0.5;
                d = Math.max(dx, dy);
                this.setBoundingBox(
                    [cx - d, cy + d, cx + d, cy - d],
                    this.keepaspectratio,
                    'update'
                );
            }

            return this;
        },

        /**
         * Sets the zoom level to <tt>fX</tt> resp <tt>fY</tt>.
         * @param {Number} fX
         * @param {Number} fY
         * @returns {JXG.Board} Reference to the board.
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
         * Inner, recursive method of removeObject.
         *
         * @param {JXG.GeometryElement|Array} object The object to remove or array of objects to be removed.
         * The element(s) is/are given by name, id or a reference.
         * @param {Boolean} [saveMethod=false] If saveMethod=true, the algorithm runs through all elements
         * and tests if the element to be deleted is a child element. If this is the case, it will be
         * removed from the list of child elements. If saveMethod=false (default), the element
         * is removed from the lists of child elements of all its ancestors.
         * The latter should be much faster.
         * @returns {JXG.Board} Reference to the board
         * @private
         */
        _removeObj: function (object, saveMethod) {
            var el, i;

            if (Type.isArray(object)) {
                for (i = 0; i < object.length; i++) {
                    this._removeObj(object[i], saveMethod);
                }

                return this;
            }

            object = this.select(object);

            // If the object which is about to be removed is unknown or a string, do nothing.
            // it is a string if a string was given and could not be resolved to an element.
            if (!Type.exists(object) || Type.isString(object)) {
                return this;
            }

            try {
                // remove all children.
                for (el in object.childElements) {
                    if (object.childElements.hasOwnProperty(el)) {
                        object.childElements[el].board._removeObj(object.childElements[el]);
                    }
                }

                // Remove all children in elements like turtle
                for (el in object.objects) {
                    if (object.objects.hasOwnProperty(el)) {
                        object.objects[el].board._removeObj(object.objects[el]);
                    }
                }

                // Remove the element from the childElement list and the descendant list of all elements.
                if (saveMethod) {
                    // Running through all objects has quadratic complexity if many objects are deleted.
                    for (el in this.objects) {
                        if (this.objects.hasOwnProperty(el)) {
                            if (
                                Type.exists(this.objects[el].childElements) &&
                                Type.exists(
                                    this.objects[el].childElements.hasOwnProperty(object.id)
                                )
                            ) {
                                delete this.objects[el].childElements[object.id];
                                delete this.objects[el].descendants[object.id];
                            }
                        }
                    }
                } else if (Type.exists(object.ancestors)) {
                    // Running through the ancestors should be much more efficient.
                    for (el in object.ancestors) {
                        if (object.ancestors.hasOwnProperty(el)) {
                            if (
                                Type.exists(object.ancestors[el].childElements) &&
                                Type.exists(
                                    object.ancestors[el].childElements.hasOwnProperty(object.id)
                                )
                            ) {
                                delete object.ancestors[el].childElements[object.id];
                                delete object.ancestors[el].descendants[object.id];
                            }
                        }
                    }
                }

                // remove the object itself from our control structures
                if (object._pos > -1) {
                    this.objectsList.splice(object._pos, 1);
                    for (i = object._pos; i < this.objectsList.length; i++) {
                        this.objectsList[i]._pos--;
                    }
                } else if (object.type !== Const.OBJECT_TYPE_TURTLE) {
                    JXG.debug(
                        'Board.removeObject: object ' + object.id + ' not found in list.'
                    );
                }

                delete this.objects[object.id];
                delete this.elementsByName[object.name];

                if (object.visProp && object.evalVisProp('trace')) {
                    object.clearTrace();
                }

                // the object deletion itself is handled by the object.
                if (Type.exists(object.remove)) {
                    object.remove();
                }
            } catch (e) {
                JXG.debug(object.id + ': Could not be removed: ' + e);
            }

            return this;
        },

        /**
         * Removes object from board and from the renderer object.
         * <p>
         * <b>Performance hints:</b> It is recommended to use the JSXGraph object's id.
         * If many elements are removed, it is best to either
         * <ul>
         *   <li> remove the whole array if the elements are contained in an array instead
         *    of looping through the array OR
         *   <li> call <tt>board.suspendUpdate()</tt>
         * before looping through the elements to be removed and call
         * <tt>board.unsuspendUpdate()</tt> after the loop. Further, it is advisable to loop
         * in reverse order, i.e. remove the object in reverse order of their creation time.
         * </ul>
         * @param {JXG.GeometryElement|Array} object The object to remove or array of objects to be removed.
         * The element(s) is/are given by name, id or a reference.
         * @param {Boolean} saveMethod If true, the algorithm runs through all elements
         * and tests if the element to be deleted is a child element. If yes, it will be
         * removed from the list of child elements. If false (default), the element
         * is removed from the lists of child elements of all its ancestors.
         * This should be much faster.
         * @returns {JXG.Board} Reference to the board
         */
        removeObject: function (object, saveMethod) {
            var i;

            this.renderer.suspendRedraw(this);
            if (Type.isArray(object)) {
                for (i = 0; i < object.length; i++) {
                    this._removeObj(object[i], saveMethod);
                }
            } else {
                this._removeObj(object, saveMethod);
            }
            this.renderer.unsuspendRedraw();

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
         * Change the height and width of the board's container.
         * After doing so, {@link JXG.JSXGraph.setBoundingBox} is called using
         * the actual size of the bounding box and the actual value of keepaspectratio.
         * If setBoundingbox() should not be called automatically,
         * call resizeContainer with dontSetBoundingBox == true.
         * @param {Number} canvasWidth New width of the container.
         * @param {Number} canvasHeight New height of the container.
         * @param {Boolean} [dontset=false] If true do not set the CSS width and height of the DOM element.
         * @param {Boolean} [dontSetBoundingBox=false] If true do not call setBoundingBox(), but keep view centered around original visible center.
         * @returns {JXG.Board} Reference to the board
         */
        resizeContainer: function (canvasWidth, canvasHeight, dontset, dontSetBoundingBox) {
            var box,
                oldWidth, oldHeight,
                oX, oY;

            oldWidth = this.canvasWidth;
            oldHeight = this.canvasHeight;

            if (!dontSetBoundingBox) {
                box = this.getBoundingBox();    // This is the actual bounding box.
            }

            // this.canvasWidth = Math.max(parseFloat(canvasWidth), Mat.eps);
            // this.canvasHeight = Math.max(parseFloat(canvasHeight), Mat.eps);
            this.canvasWidth = parseFloat(canvasWidth);
            this.canvasHeight = parseFloat(canvasHeight);

            if (!dontset) {
                this.containerObj.style.width = this.canvasWidth + 'px';
                this.containerObj.style.height = this.canvasHeight + 'px';
            }
            this.renderer.resize(this.canvasWidth, this.canvasHeight);

            if (!dontSetBoundingBox) {
                this.setBoundingBox(box, this.keepaspectratio, 'keep');
            } else {
                oX = (this.canvasWidth - oldWidth) * 0.5;
                oY = (this.canvasHeight - oldHeight) * 0.5;

                this.moveOrigin(
                    this.origin.scrCoords[1] + oX,
                    this.origin.scrCoords[2] + oY
                );
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
                            t +=
                                this.objects[el].childElements[c].id +
                                '(' +
                                this.objects[el].childElements[c].name +
                                ')' +
                                ', ';
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
         * Sets for all objects the needsUpdate flag to 'true'.
         * @param{JXG.GeometryElement} [drag=undefined] Optional element that is dragged.
         * @returns {JXG.Board} Reference to the board
         */
        prepareUpdate: function (drag) {
            var el, i,
                pEl,
                len = this.objectsList.length;

            /*
            if (this.attr.updatetype === 'hierarchical') {
                return this;
            }
            */

            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                if (this._change3DView ||
                    (Type.exists(drag) && drag.elType === 'view3d_slider')
                ) {
                    // The 3D view has changed. No elements are recomputed,
                    // only 3D elements are projected to the new view.
                    pEl.needsUpdate =
                        pEl.visProp.element3d ||
                        pEl.elType === 'view3d' ||
                        pEl.elType === 'view3d_slider' ||
                        this.needsFullUpdate;

                    // Special case sphere3d in central projection:
                    // We have to update the defining points of the ellipse
                    if (pEl.visProp.element3d &&
                        pEl.visProp.element3d.type === Const.OBJECT_TYPE_SPHERE3D
                        ) {
                        for (i = 0; i < pEl.parents.length; i++) {
                            this.objects[pEl.parents[i]].needsUpdate = true;
                        }
                    }
                } else {
                    pEl.needsUpdate = pEl.needsRegularUpdate || this.needsFullUpdate;
                }
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
                if (this.needsFullUpdate && pEl.elementClass === Const.OBJECT_CLASS_TEXT) {
                    pEl.updateSize();
                }

                // For updates of an element we distinguish if the dragged element is updated or
                // other elements are updated.
                // The difference lies in the treatment of gliders and points based on transformations.
                pEl.update(!Type.exists(drag) || pEl.id !== drag.id).updateVisibility();
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
            var el,
                len = this.objectsList.length,
                autoPositionLabelList = [],
                currentIndex, randomIndex;

            if (!this.renderer) {
                return;
            }

            /*
            objs = this.objectsList.slice(0);
            objs.sort(function (a, b) {
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
                    if (this.objectsList[el].visProp.islabel && this.objectsList[el].visProp.autoposition) {
                        autoPositionLabelList.push(el);
                    } else {
                    this.objectsList[el].updateRenderer();
                }
            }

                currentIndex = autoPositionLabelList.length;

                // Randomize the order of the labels
                while (currentIndex !== 0) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex--;
                    [autoPositionLabelList[currentIndex], autoPositionLabelList[randomIndex]] = [autoPositionLabelList[randomIndex], autoPositionLabelList[currentIndex]];
                }

                for (el = 0; el < autoPositionLabelList.length; el++) {
                    this.objectsList[autoPositionLabelList[el]].updateRenderer();
                }
                /*
                for (el = autoPositionLabelList.length - 1; el >= 0; el--) {
                    this.objectsList[autoPositionLabelList[el]].updateRenderer();
                }
                */
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
            var el, pEl,
                olen = this.objectsList.length,
                // i, minim, lay,
                // layers = this.options.layer,
                // len = this.options.layer.numlayers,
                // last = Number.NEGATIVE_INFINITY.toExponential,
                depth_order_layers = [],
                objects_sorted,
                // Sort the elements for the canvas rendering according to
                // their layer, _pos, depthOrder (with this priority)
                // @private
                _compareFn = function(a, b) {
                    if (a.visProp.layer !== b.visProp.layer) {
                        return a.visProp.layer - b.visProp.layer;
                    }

                    // The objects are in the same layer, but the layer is not depth ordered
                    if (depth_order_layers.indexOf(a.visProp.layer) === -1) {
                        return a._pos - b._pos;
                    }

                    // The objects are in the same layer and the layer is depth ordered
                    // We have to sort 2D elements according to the zIndices of
                    // their 3D parents.
                    if (!a.visProp.element3d && !b.visProp.element3d) {
                        return a._pos - b._pos;
                    }

                    if (a.visProp.element3d && !b.visProp.element3d) {
                        return -1;
                    }

                    if (b.visProp.element3d && !a.visProp.element3d) {
                        return 1;
                    }

                    return a.visProp.element3d.zIndex - b.visProp.element3d.zIndex;
                };

            // Only one view3d element is supported. Get the depth orderer layers and
            // update the zIndices of the 3D elements.
            for (el = 0; el < olen; el++) {
                pEl = this.objectsList[el];
                if (pEl.elType === 'view3d' && pEl.evalVisProp('depthorder.enabled')) {
                    depth_order_layers = pEl.evalVisProp('depthorder.layers');
                    pEl.updateRenderer();
                    break;
                }
            }

            objects_sorted = this.objectsList.toSorted(_compareFn);
            olen = objects_sorted.length;
            for (el = 0; el < olen; el++) {
                objects_sorted[el].prepareUpdate().updateRenderer();
            }

            // for (i = 0; i < len; i++) {
            //     minim = Number.POSITIVE_INFINITY;

            //     for (lay in layers) {
            //         if (layers.hasOwnProperty(lay)) {
            //             if (layers[lay] > last && layers[lay] < minim) {
            //                 minim = layers[lay];
            //             }
            //         }
            //     }

            //     for (el = 0; el < olen; el++) {
            //         pEl = this.objectsList[el];
            //         if (pEl.visProp.layer === minim) {
            //             pEl.prepareUpdate().updateRenderer();
            //         }
            //     }
            //     last = minim;
            // }

            return this;
        },

        /**
         * Please use {@link JXG.Board.on} instead.
         * @param {Function} hook A function to be called by the board after an update occurred.
         * @param {String} [m='update'] When the hook is to be called. Possible values are <i>mouseup</i>, <i>mousedown</i> and <i>update</i>.
         * @param {Object} [context=board] Determines the execution context the hook is called. This parameter is optional, default is the
         * board object the hook is attached to.
         * @returns {Number} Id of the hook, required to remove the hook from the board.
         * @deprecated
         */
        addHook: function (hook, m, context) {
            JXG.deprecated('Board.addHook()', 'Board.on()');
            m = Type.def(m, 'update');

            context = Type.def(context, this);

            this.hooks.push([m, hook]);
            this.on(m, hook, context);

            return this.hooks.length - 1;
        },

        /**
         * Alias of {@link JXG.Board.on}.
         */
        addEvent: JXG.shortcut(JXG.Board.prototype, 'on'),

        /**
         * Please use {@link JXG.Board.off} instead.
         * @param {Number|function} id The number you got when you added the hook or a reference to the event handler.
         * @returns {JXG.Board} Reference to the board
         * @deprecated
         */
        removeHook: function (id) {
            JXG.deprecated('Board.removeHook()', 'Board.off()');
            if (this.hooks[id]) {
                this.off(this.hooks[id][0], this.hooks[id][1]);
                this.hooks[id] = null;
            }

            return this;
        },

        /**
         * Alias of {@link JXG.Board.off}.
         */
        removeEvent: JXG.shortcut(JXG.Board.prototype, 'off'),

        /**
         * Runs through all hooked functions and calls them.
         * @returns {JXG.Board} Reference to the board
         * @deprecated
         */
        updateHooks: function (m) {
            var arg = Array.prototype.slice.call(arguments, 0);

            JXG.deprecated('Board.updateHooks()', 'Board.triggerEventHandlers()');

            arg[0] = Type.def(arg[0], 'update');
            this.triggerEventHandlers([arg[0]], arguments);

            return this;
        },

        /**
         * Adds a dependent board to this board.
         * @param {JXG.Board} board A reference to board which will be updated after an update of this board occurred.
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
            var i, len, b, insert, storeActiveEl;

            if (this.inUpdate || this.isSuspendedUpdate) {
                return this;
            }
            this.inUpdate = true;

            if (
                this.attr.minimizereflow === 'all' &&
                this.containerObj &&
                this.renderer.type !== 'vml'
            ) {
                storeActiveEl = this.document.activeElement; // Store focus element
                insert = this.renderer.removeToInsertLater(this.containerObj);
            }

            if (this.attr.minimizereflow === 'svg' && this.renderer.type === 'svg') {
                storeActiveEl = this.document.activeElement;
                insert = this.renderer.removeToInsertLater(this.renderer.svgRoot);
            }

            this.prepareUpdate(drag).updateElements(drag).updateConditions();

            this.renderer.suspendRedraw(this);
            this.updateRenderer();
            this.renderer.unsuspendRedraw();
            this.triggerEventHandlers(['update'], []);

            if (insert) {
                insert();
                storeActiveEl.focus(); // Restore focus element
            }

            // To resolve dependencies between boards
            // for (var board in JXG.boards) {
            len = this.dependentBoards.length;
            for (i = 0; i < len; i++) {
                b = this.dependentBoards[i];
                if (Type.exists(b) && b !== this) {
                    b.updateQuality = this.updateQuality;
                    b.prepareUpdate().updateElements().updateConditions();
                    b.renderer.suspendRedraw(this);
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
                if (
                    Type.isString(parents[i]) &&
                    !(elementType === 'text' && i === 2) &&
                    !(elementType === 'solidofrevolution3d' && i === 2) &&
                    !(elementType === 'text3d' && (i === 2 || i === 4)) &&
                    !(
                        (elementType === 'input' ||
                            elementType === 'checkbox' ||
                            elementType === 'button') &&
                        (i === 2 || i === 3)
                    ) &&
                    !(elementType === 'curve' /*&& i > 0*/) && // Allow curve plots with jessiecode, parents[0] is the
                                                               // variable name
                    !(elementType === 'functiongraph') && // Prevent problems with function terms like 'x', 'y'
                    !(elementType === 'implicitcurve')
                ) {
                    if (i > 0 && parents[0].elType === 'view3d') {
                        // 3D elements are based on 3D elements, only
                        parents[i] = parents[0].select(parents[i]);
                    } else {
                        parents[i] = this.select(parents[i]);
                    }
                }
            }

            if (Type.isFunction(JXG.elements[elementType])) {
                el = JXG.elements[elementType](this, parents, attributes);
            } else {
                throw new Error('JSXGraph: create: Unknown element type given: ' + elementType);
            }

            if (!Type.exists(el)) {
                JXG.debug('JSXGraph: create: failure creating ' + elementType);
                return el;
            }

            if (el.prepareUpdate && el.update && el.updateRenderer) {
                el.fullUpdate();
            }
            return el;
        },

        /**
         * Deprecated name for {@link JXG.Board.create}.
         * @deprecated
         */
        createElement: function () {
            JXG.deprecated('Board.createElement()', 'Board.create()');
            return this.create.apply(this, arguments);
        },

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
                this.fullUpdate();
            }
            return this;
        },

        /**
         * Set the bounding box of the board.
         * @param {Array} bbox New bounding box [x1,y1,x2,y2]
         * @param {Boolean} [keepaspectratio=false] If set to true, the aspect ratio will be 1:1, but
         * the resulting viewport may be larger.
         * @param {String} [setZoom='reset'] Reset, keep or update the zoom level of the board. 'reset'
         * sets {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY} to the start values (or 1.0).
         * 'update' adapts these values accoring to the new bounding box and 'keep' does nothing.
         * @returns {JXG.Board} Reference to the board
         */
        setBoundingBox: function (bbox, keepaspectratio, setZoom) {
            var h, w, ux, uy,
                offX = 0,
                offY = 0,
                zoom_ratio = 1,
                ratio, dx, dy, prev_w, prev_h,
                dim = Env.getDimensions(this.containerObj, this.document);

            if (!Type.isArray(bbox)) {
                return this;
            }

            if (
                bbox[0] < this.maxboundingbox[0] - Mat.eps ||
                bbox[1] > this.maxboundingbox[1] + Mat.eps ||
                bbox[2] > this.maxboundingbox[2] + Mat.eps ||
                bbox[3] < this.maxboundingbox[3] - Mat.eps
            ) {
                return this;
            }

            if (!Type.exists(setZoom)) {
                setZoom = 'reset';
            }

            ux = this.unitX;
            uy = this.unitY;
            this.canvasWidth = parseFloat(dim.width);   // parseInt(dim.width, 10);
            this.canvasHeight = parseFloat(dim.height); // parseInt(dim.height, 10);
            w = this.canvasWidth;
            h = this.canvasHeight;
            if (keepaspectratio) {
                if (this.keepaspectratio) {
                    ratio = ux / uy;        // Keep this ratio if keepaspectratio was true
                    if (isNaN(ratio)) {
                        ratio = 1.0;
                    }
                } else {
                    ratio = 1.0;
                }
                if (setZoom === 'keep') {
                    zoom_ratio = this.zoomX / this.zoomY;
                }
                dx = bbox[2] - bbox[0];
                dy = bbox[1] - bbox[3];
                prev_w = ux * dx;
                prev_h = uy * dy;
                if (w >= h) {
                    if (prev_w >= prev_h) {
                        this.unitY = h / dy;
                        this.unitX = this.unitY * ratio;
                    } else {
                        // Switch dominating interval
                        this.unitY = h / Math.abs(dx) * Mat.sign(dy) / zoom_ratio;
                        this.unitX = this.unitY * ratio;
                    }
                } else {
                    if (prev_h > prev_w) {
                        this.unitX = w / dx;
                        this.unitY = this.unitX / ratio;
                    } else {
                        // Switch dominating interval
                        this.unitX = w / Math.abs(dy) * Mat.sign(dx) * zoom_ratio;
                        this.unitY = this.unitX / ratio;
                    }
                }
                // Add the additional units in equal portions left and right
                offX = (w / this.unitX - dx) * 0.5;
                // Add the additional units in equal portions above and below
                offY = (h / this.unitY - dy) * 0.5;
                this.keepaspectratio = true;
            } else {
                this.unitX = w / (bbox[2] - bbox[0]);
                this.unitY = h / (bbox[1] - bbox[3]);
                this.keepaspectratio = false;
            }

            this.moveOrigin(-this.unitX * (bbox[0] - offX), this.unitY * (bbox[1] + offY));

            if (setZoom === 'update') {
                this.zoomX *= this.unitX / ux;
                this.zoomY *= this.unitY / uy;
            } else if (setZoom === 'reset') {
                this.zoomX = Type.exists(this.attr.zoomx) ? this.attr.zoomx : 1.0;
                this.zoomY = Type.exists(this.attr.zoomy) ? this.attr.zoomy : 1.0;
            }

            return this;
        },

        /**
         * Get the bounding box of the board.
         * @returns {Array} bounding box [x1,y1,x2,y2] upper left corner, lower right corner
         */
        getBoundingBox: function () {
            var ul = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this).usrCoords,
                lr = new Coords(
                    Const.COORDS_BY_SCREEN,
                    [this.canvasWidth, this.canvasHeight],
                    this
                ).usrCoords;
            return [ul[1], ul[2], lr[1], lr[2]];
        },

        /**
         * Sets the value of attribute <tt>key</tt> to <tt>value</tt>.
         * @param {String} key The attribute's name.
         * @param value The new value
         * @private
         */
        _set: function (key, value) {
            key = key.toLocaleLowerCase();

            if (
                value !== null &&
                Type.isObject(value) &&
                !Type.exists(value.id) &&
                !Type.exists(value.name)
            ) {
                // value is of type {prop: val, prop: val,...}
                // Convert these attributes to lowercase, too
                // this.attr[key] = {};
                // for (el in value) {
                //     if (value.hasOwnProperty(el)) {
                //         this.attr[key][el.toLocaleLowerCase()] = value[el];
                //     }
                // }
                Type.mergeAttr(this.attr[key], value);
            } else {
                this.attr[key] = value;
            }
        },

        /**
         * Sets an arbitrary number of attributes. This method has one or more
         * parameters of the following types:
         * <ul>
         * <li> object: {key1:value1,key2:value2,...}
         * <li> string: 'key:value'
         * <li> array: ['key', value]
         * </ul>
         * Some board attributes are immutable, like e.g. the renderer type.
         *
         * @param {Object} attributes An object with attributes.
         * @returns {JXG.Board} Reference to the board
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-5, 5, 5, -5],
         *     keepAspectRatio: false,
         *     axis:true,
         *     showFullscreen: true,
         *     showScreenshot: true,
         *     showCopyright: false
         * });
         *
         * board.setAttribute({
         *     animationDelay: 10,
         *     boundingbox: [-10, 5, 10, -5],
         *     defaultAxes: {
         *         x: { strokeColor: 'blue', ticks: { strokeColor: 'blue'}}
         *     },
         *     description: 'test',
         *     fullscreen: {
         *         scale: 0.5
         *     },
         *     intl: {
         *         enabled: true,
         *         locale: 'de-DE'
         *     }
         * });
         *
         * board.setAttribute({
         *     selection: {
         *         enabled: true,
         *         fillColor: 'blue'
         *     },
         *     showInfobox: false,
         *     zoomX: 0.5,
         *     zoomY: 2,
         *     fullscreen: { symbol: 'x' },
         *     screenshot: { symbol: 'y' },
         *     showCopyright: true,
         *     showFullscreen: false,
         *     showScreenshot: false,
         *     showZoom: false,
         *     showNavigation: false
         * });
         * board.setAttribute('showCopyright:false');
         *
         * var p = board.create('point', [1, 1], {size: 10,
         *     label: {
         *         fontSize: 24,
         *         highlightStrokeOpacity: 0.1,
         *         offset: [5, 0]
         *     }
         * });
         *
         *
         * </pre><div id="JXGea7b8e09-beac-4d95-9a0c-5fc1c761ffbc" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     const board = JXG.JSXGraph.initBoard('JXGea7b8e09-beac-4d95-9a0c-5fc1c761ffbc', {
         *         boundingbox: [-5, 5, 5, -5],
         *         keepAspectRatio: false,
         *         axis:true,
         *         showFullscreen: true,
         *         showScreenshot: true,
         *         showCopyright: false
         *     });
         *
         *     board.setAttribute({
         *         animationDelay: 10,
         *         boundingbox: [-10, 5, 10, -5],
         *         defaultAxes: {
         *             x: { strokeColor: 'blue', ticks: { strokeColor: 'blue'}}
         *         },
         *         description: 'test',
         *         fullscreen: {
         *             scale: 0.5
         *         },
         *         intl: {
         *             enabled: true,
         *             locale: 'de-DE'
         *         }
         *     });
         *
         *     board.setAttribute({
         *         selection: {
         *             enabled: true,
         *             fillColor: 'blue'
         *         },
         *         showInfobox: false,
         *         zoomX: 0.5,
         *         zoomY: 2,
         *         fullscreen: { symbol: 'x' },
         *         screenshot: { symbol: 'y' },
         *         showCopyright: true,
         *         showFullscreen: false,
         *         showScreenshot: false,
         *         showZoom: false,
         *         showNavigation: false
         *     });
         *
         *     board.setAttribute('showCopyright:false');
         *
         *     var p = board.create('point', [1, 1], {size: 10,
         *         label: {
         *             fontSize: 24,
         *             highlightStrokeOpacity: 0.1,
         *             offset: [5, 0]
         *         }
         *     });
         *
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        setAttribute: function (attr) {
            var i, arg, pair,
                key, value, oldvalue,// j, le,
                node,
                attributes = {};

            // Normalize the user input
            for (i = 0; i < arguments.length; i++) {
                arg = arguments[i];
                if (Type.isString(arg)) {
                    // pairRaw is string of the form 'key:value'
                    pair = arg.split(":");
                    attributes[Type.trim(pair[0])] = Type.trim(pair[1]);
                } else if (!Type.isArray(arg)) {
                    // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
                    JXG.extend(attributes, arg);
                } else {
                    // pairRaw consists of array [key,value]
                    attributes[arg[0]] = arg[1];
                }
            }

            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    key = i.replace(/\s+/g, "").toLowerCase();
                    value = attributes[i];
                }
                value = (value.toLowerCase && value.toLowerCase() === 'false')
                    ? false
                    : value;

                oldvalue = this.attr[key];
                if (oldvalue === value) {
                    continue;
                }
                switch (key) {
                    case 'axis':
                        if (value === false) {
                            if (Type.exists(this.defaultAxes)) {
                                this.defaultAxes.x.setAttribute({ visible: false });
                                this.defaultAxes.y.setAttribute({ visible: false });
                            }
                        } else {
                            // TODO
                        }
                        break;
                    case 'boundingbox':
                        this.setBoundingBox(value, this.keepaspectratio);
                        this._set(key, value);
                        break;
                    case 'defaultaxes':
                        if (Type.exists(this.defaultAxes.x) && Type.exists(value.x)) {
                            this.defaultAxes.x.setAttribute(value.x);
                        }
                        if (Type.exists(this.defaultAxes.y) && Type.exists(value.y)) {
                            this.defaultAxes.y.setAttribute(value.y);
                        }
                        break;
                    case 'title':
                        this.document.getElementById(this.container + '_ARIAlabel')
                            .innerText = value;
                        this._set(key, value);
                        break;
                    case 'keepaspectratio':
                        this._set(key, value);
                        this.setBoundingBox(this.getBoundingBox(), value, 'keep');
                        break;

                    // /* eslint-disable no-fallthrough */
                    case 'document':
                    case 'maxboundingbox':
                        this[key] = value;
                        this._set(key, value);
                        break;

                    case 'zoomx':
                    case 'zoomy':
                        this[key] = value;
                        this._set(key, value);
                        this.setZoom(this.attr.zoomx, this.attr.zoomy);
                        break;

                    case 'registerevents':
                    case 'renderer':
                        // immutable, i.e. ignored
                        break;

                    case 'fullscreen':
                    case 'screenshot':
                        node = this.containerObj.ownerDocument.getElementById(
                            this.container + '_navigation_' + key);
                        if (node && Type.exists(value.symbol)) {
                            node.innerText = Type.evaluate(value.symbol);
                        }
                        this._set(key, value);
                        break;

                    case 'selection':
                        value.visible = false;
                        value.withLines = false;
                        value.vertices = { visible: false };
                        this._set(key, value);
                        break;

                    case 'showcopyright':
                        if (this.renderer.type === 'svg') {
                            node = this.containerObj.ownerDocument.getElementById(
                                this.renderer.uniqName('licenseText')
                            );
                            if (node) {
                                node.style.display = ((Type.evaluate(value)) ? 'inline' : 'none');
                            } else if (Type.evaluate(value)) {
                                this.renderer.displayCopyright(Const.licenseText, parseInt(this.options.text.fontSize, 10));
                            }
                        }
                        this._set(key, value);
                        break;

                    case 'showlogo':
                        if (this.renderer.type === 'svg') {
                            node = this.containerObj.ownerDocument.getElementById(
                                this.renderer.uniqName('licenseLogo')
                            );
                            if (node) {
                                node.style.display = ((Type.evaluate(value)) ? 'inline' : 'none');
                            } else if (Type.evaluate(value)) {
                                this.renderer.displayLogo(Const.licenseLogo, parseInt(this.options.text.fontSize, 10));
                            }
                        }
                        this._set(key, value);
                        break;

                    default:
                        if (Type.exists(this.attr[key])) {
                            this._set(key, value);
                        }
                        break;
                    // /* eslint-enable no-fallthrough */
                }
            }

            // Redraw navbar to handle the remaining show* attributes
            this.containerObj.ownerDocument.getElementById(
                this.container + "_navigationbar"
            ).remove();
            this.renderer.drawNavigationBar(this, this.attr.navbar);

            this.triggerEventHandlers(["attribute"], [attributes, this]);
            this.fullUpdate();

            return this;
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
                if (
                    this.animationObjects.hasOwnProperty(el) &&
                    Type.exists(this.animationObjects[el])
                ) {
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
            var props,
                el,
                o,
                newCoords,
                r,
                p,
                c,
                cbtmp,
                count = 0,
                obj = null;

            for (el in this.animationObjects) {
                if (
                    this.animationObjects.hasOwnProperty(el) &&
                    Type.exists(this.animationObjects[el])
                ) {
                    count += 1;
                    o = this.animationObjects[el];

                    if (o.animationPath) {
                        if (Type.isFunction(o.animationPath)) {
                            newCoords = o.animationPath(
                                new Date().getTime() - o.animationStart
                            );
                        } else {
                            newCoords = o.animationPath.pop();
                        }

                        if (
                            !Type.exists(newCoords) ||
                            (!Type.isArray(newCoords) && isNaN(newCoords))
                        ) {
                            delete o.animationPath;
                        } else {
                            o.setPositionDirectly(Const.COORDS_BY_USER, newCoords);
                            o.fullUpdate();
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
         * to the point dest and delete the point src.
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
            var child,
                childId,
                prop,
                found,
                i,
                srcLabelId,
                srcHasLabel = false;

            src = this.select(src);
            dest = this.select(dest);

            if (Type.exists(src.label)) {
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
                            if (child[prop] === src) {
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

            this.fullUpdate();

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
                            strokecolor: Color.rgb2cb(
                                o.eval(o.visPropOriginal.strokecolor),
                                deficiency
                            ),
                            fillcolor: Color.rgb2cb(
                                o.eval(o.visPropOriginal.fillcolor),
                                deficiency
                            ),
                            highlightstrokecolor: Color.rgb2cb(
                                o.eval(o.visPropOriginal.highlightstrokecolor),
                                deficiency
                            ),
                            highlightfillcolor: Color.rgb2cb(
                                o.eval(o.visPropOriginal.highlightfillcolor),
                                deficiency
                            )
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
         * @param {Boolean} onlyByIdOrName If true (default:false) elements are only filtered by their id, name or groupId.
         * The advanced filters consisting of objects or functions are ignored.
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
        select: function (str, onlyByIdOrName) {
            var flist,
                olist,
                i,
                l,
                s = str;

            if (s === null) {
                return s;
            }

            // It's a string, most likely an id or a name.
            if (Type.isString(s) && s !== '') {
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

                // It's a function or an object, but not an element
            } else if (
                !onlyByIdOrName &&
                (Type.isFunction(s) || (Type.isObject(s) && !Type.isFunction(s.setAttribute)))
            ) {
                flist = Type.filterElements(this.objectsList, s);

                olist = {};
                l = flist.length;
                for (i = 0; i < l; i++) {
                    olist[flist[i].id] = flist[i];
                }
                s = new Composition(olist);

                // It's an element which has been deleted (and still hangs around, e.g. in an attractor list
            } else if (
                Type.isObject(s) &&
                Type.exists(s.id) &&
                !Type.exists(this.objects[s.id])
            ) {
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

            if (Type.exists(x) && Type.isArray(x.usrCoords)) {
                px = x.usrCoords[1];
                py = x.usrCoords[2];
            }

            return !!(
                Type.isNumber(px) &&
                Type.isNumber(py) &&
                bbox[0] < px &&
                px < bbox[2] &&
                bbox[1] > py &&
                py > bbox[3]
            );
        },

        /**
         * Update CSS transformations of type scaling. It is used to correct the mouse position
         * in {@link JXG.Board.getMousePosition}.
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

            // Newer variant of walking up the tree.
            // We walk up all parent nodes and collect possible CSS transforms.
            // Works also for ShadowDOM
            if (Type.exists(o.getRootNode)) {
                o = o.parentNode === o.getRootNode() ? o.parentNode.host : o.parentNode;
                while (o) {
                    this.cssTransMat = Mat.matMatMult(Env.getCSSTransformMatrix(o), this.cssTransMat);
                    o = o.parentNode === o.getRootNode() ? o.parentNode.host : o.parentNode;
                }
                this.cssTransMat = Mat.inverse(this.cssTransMat);
            } else {
                /*
                 * This is necessary for IE11
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
            }
            return this;
        },

        /**
         * Start selection mode. This function can either be triggered from outside or by
         * a down event together with correct key pressing. The default keys are
         * shift+ctrl. But this can be changed in the options.
         *
         * Starting from out side can be realized for example with a button like this:
         * <pre>
         * 	&lt;button onclick='board.startSelectionMode()'&gt;Start&lt;/button&gt;
         * </pre>
         * @example
         * //
         * // Set a new bounding box from the selection rectangle
         * //
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingBox:[-3,2,3,-2],
         *         keepAspectRatio: false,
         *         axis:true,
         *         selection: {
         *             enabled: true,
         *             needShift: false,
         *             needCtrl: true,
         *             withLines: false,
         *             vertices: {
         *                 visible: false
         *             },
         *             fillColor: '#ffff00',
         *         }
         *      });
         *
         * var f = function f(x) { return Math.cos(x); },
         *     curve = board.create('functiongraph', [f]);
         *
         * board.on('stopselecting', function(){
         *     var box = board.stopSelectionMode(),
         *
         *         // bbox has the coordinates of the selection rectangle.
         *         // Attention: box[i].usrCoords have the form [1, x, y], i.e.
         *         // are homogeneous coordinates.
         *         bbox = box[0].usrCoords.slice(1).concat(box[1].usrCoords.slice(1));
         *
         *         // Set a new bounding box
         *         board.setBoundingBox(bbox, false);
         *  });
         *
         *
         * </pre><div class='jxgbox' id='JXG11eff3a6-8c50-11e5-b01d-901b0e1b8723' style='width: 300px; height: 300px;'></div>
         * <script type='text/javascript'>
         *     (function() {
         *     //
         *     // Set a new bounding box from the selection rectangle
         *     //
         *     var board = JXG.JSXGraph.initBoard('JXG11eff3a6-8c50-11e5-b01d-901b0e1b8723', {
         *             boundingBox:[-3,2,3,-2],
         *             keepAspectRatio: false,
         *             axis:true,
         *             selection: {
         *                 enabled: true,
         *                 needShift: false,
         *                 needCtrl: true,
         *                 withLines: false,
         *                 vertices: {
         *                     visible: false
         *                 },
         *                 fillColor: '#ffff00',
         *             }
         *        });
         *
         *     var f = function f(x) { return Math.cos(x); },
         *         curve = board.create('functiongraph', [f]);
         *
         *     board.on('stopselecting', function(){
         *         var box = board.stopSelectionMode(),
         *
         *             // bbox has the coordinates of the selection rectangle.
         *             // Attention: box[i].usrCoords have the form [1, x, y], i.e.
         *             // are homogeneous coordinates.
         *             bbox = box[0].usrCoords.slice(1).concat(box[1].usrCoords.slice(1));
         *
         *             // Set a new bounding box
         *             board.setBoundingBox(bbox, false);
         *      });
         *     })();
         *
         * </script><pre>
         *
         */
        startSelectionMode: function () {
            this.selectingMode = true;
            this.selectionPolygon.setAttribute({ visible: true });
            this.selectingBox = [
                [0, 0],
                [0, 0]
            ];
            this._setSelectionPolygonFromBox();
            this.selectionPolygon.fullUpdate();
        },

        /**
         * Finalize the selection: disable selection mode and return the coordinates
         * of the selection rectangle.
         * @returns {Array} Coordinates of the selection rectangle. The array
         * contains two {@link JXG.Coords} objects. One the upper left corner and
         * the second for the lower right corner.
         */
        stopSelectionMode: function () {
            this.selectingMode = false;
            this.selectionPolygon.setAttribute({ visible: false });
            return [
                this.selectionPolygon.vertices[0].coords,
                this.selectionPolygon.vertices[2].coords
            ];
        },

        /**
         * Start the selection of a region.
         * @private
         * @param  {Array} pos Screen coordiates of the upper left corner of the
         * selection rectangle.
         */
        _startSelecting: function (pos) {
            this.isSelecting = true;
            this.selectingBox = [
                [pos[0], pos[1]],
                [pos[0], pos[1]]
            ];
            this._setSelectionPolygonFromBox();
        },

        /**
         * Update the selection rectangle during a move event.
         * @private
         * @param  {Array} pos Screen coordiates of the move event
         */
        _moveSelecting: function (pos) {
            if (this.isSelecting) {
                this.selectingBox[1] = [pos[0], pos[1]];
                this._setSelectionPolygonFromBox();
                this.selectionPolygon.fullUpdate();
            }
        },

        /**
         * Update the selection rectangle during an up event. Stop selection.
         * @private
         * @param  {Object} evt Event object
         */
        _stopSelecting: function (evt) {
            var pos = this.getMousePosition(evt);

            this.isSelecting = false;
            this.selectingBox[1] = [pos[0], pos[1]];
            this._setSelectionPolygonFromBox();
        },

        /**
         * Update the Selection rectangle.
         * @private
         */
        _setSelectionPolygonFromBox: function () {
            var A = this.selectingBox[0],
                B = this.selectingBox[1];

            this.selectionPolygon.vertices[0].setPositionDirectly(JXG.COORDS_BY_SCREEN, [
                A[0],
                A[1]
            ]);
            this.selectionPolygon.vertices[1].setPositionDirectly(JXG.COORDS_BY_SCREEN, [
                A[0],
                B[1]
            ]);
            this.selectionPolygon.vertices[2].setPositionDirectly(JXG.COORDS_BY_SCREEN, [
                B[0],
                B[1]
            ]);
            this.selectionPolygon.vertices[3].setPositionDirectly(JXG.COORDS_BY_SCREEN, [
                B[0],
                A[1]
            ]);
        },

        /**
         * Test if a down event should start a selection. Test if the
         * required keys are pressed. If yes, {@link JXG.Board.startSelectionMode} is called.
         * @param  {Object} evt Event object
         */
        _testForSelection: function (evt) {
            if (this._isRequiredKeyPressed(evt, 'selection')) {
                if (!Type.exists(this.selectionPolygon)) {
                    this._createSelectionPolygon(this.attr);
                }
                this.startSelectionMode();
            }
        },

        /**
         * Create the internal selection polygon, which will be available as board.selectionPolygon.
         * @private
         * @param  {Object} attr board attributes, e.g. the subobject board.attr.
         * @returns {Object} pointer to the board to enable chaining.
         */
        _createSelectionPolygon: function (attr) {
            var selectionattr;

            if (!Type.exists(this.selectionPolygon)) {
                selectionattr = Type.copyAttributes(attr, Options, 'board', 'selection');
                if (selectionattr.enabled === true) {
                    this.selectionPolygon = this.create(
                        'polygon',
                        [
                            [0, 0],
                            [0, 0],
                            [0, 0],
                            [0, 0]
                        ],
                        selectionattr
                    );
                }
            }

            return this;
        },

        /* **************************
         *     EVENT DEFINITION
         * for documentation purposes
         * ************************** */

        //region Event handler documentation

        /**
         * @event
         * @description Whenever the {@link JXG.Board#setAttribute} is called.
         * @name JXG.Board#attribute
         * @param {Event} e The browser's event object.
         */
        __evt__attribute: function (e) { },

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
         * @description Whenever the user taps the pen on the board.
         * @name JXG.Board#pendown
         * @param {Event} e The browser's event object.
         */
        __evt__pendown: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to click on the board with a
         * device sending pointer events.
         * @name JXG.Board#pointerdown
         * @param {Event} e The browser's event object.
         */
        __evt__pointerdown: function (e) { },

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
         * @description Whenever the user releases the mousebutton over the board with a
         * device sending pointer events.
         * @name JXG.Board#pointerup
         * @param {Event} e The browser's event object.
         */
        __evt__pointerup: function (e) { },

        /**
         * @event
         * @description Whenever the user stops touching the board.
         * @name JXG.Board#touchend
         * @param {Event} e The browser's event object.
         */
        __evt__touchend: function (e) { },

        /**
         * @event
         * @description Whenever the user clicks on the board.
         * @name JXG.Board#click
         * @see JXG.Board#clickDelay
         * @param {Event} e The browser's event object.
         */
        __evt__click: function (e) { },

        /**
         * @event
         * @description Whenever the user double clicks on the board.
         * This event works on desktop browser, but is undefined
         * on mobile browsers.
         * @name JXG.Board#dblclick
         * @see JXG.Board#clickDelay
         * @see JXG.Board#dblClickSuppressClick
         * @param {Event} e The browser's event object.
         */
        __evt__dblclick: function (e) { },

        /**
         * @event
         * @description Whenever the user clicks on the board with a mouse device.
         * @name JXG.Board#mouseclick
         * @param {Event} e The browser's event object.
         */
        __evt__mouseclick: function (e) { },

        /**
         * @event
         * @description Whenever the user double clicks on the board with a mouse device.
         * @name JXG.Board#mousedblclick
         * @see JXG.Board#clickDelay
         * @param {Event} e The browser's event object.
         */
        __evt__mousedblclick: function (e) { },

        /**
         * @event
         * @description Whenever the user clicks on the board with a pointer device.
         * @name JXG.Board#pointerclick
         * @param {Event} e The browser's event object.
         */
        __evt__pointerclick: function (e) { },

        /**
         * @event
         * @description Whenever the user double clicks on the board with a pointer device.
         * This event works on desktop browser, but is undefined
         * on mobile browsers.
         * @name JXG.Board#pointerdblclick
         * @see JXG.Board#clickDelay
         * @param {Event} e The browser's event object.
         */
        __evt__pointerdblclick: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the finger or mouse pointer over the board.
         * @name JXG.Board#move
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__move: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the mouse over the board.
         * @name JXG.Board#mousemove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__mousemove: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the pen over the board.
         * @name JXG.Board#penmove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__penmove: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the mouse over the board with a
         * device sending pointer events.
         * @name JXG.Board#pointermove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__pointermove: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the finger over the board.
         * @name JXG.Board#touchmove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__touchmove: function (e, mode) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving an element over the board by
         * pressing arrow keys on a keyboard.
         * @name JXG.Board#keymove
         * @param {Event} e The browser's event object.
         * @param {Number} mode The mode the board currently is in
         * @see JXG.Board#mode
         */
        __evt__keymove: function (e, mode) { },

        /**
         * @event
         * @description Whenever an element is highlighted this event is fired.
         * @name JXG.Board#hit
         * @param {Event} e The browser's event object.
         * @param {JXG.GeometryElement} el The hit element.
         * @param target
         *
         * @example
         * var c = board.create('circle', [[1, 1], 2]);
         * board.on('hit', function(evt, el) {
         *     console.log('Hit element', el);
         * });
         *
         * </pre><div id='JXG19eb31ac-88e6-11e8-bcb5-901b0e1b8723' class='jxgbox' style='width: 300px; height: 300px;'></div>
         * <script type='text/javascript'>
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG19eb31ac-88e6-11e8-bcb5-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var c = board.create('circle', [[1, 1], 2]);
         *     board.on('hit', function(evt, el) {
         *         console.log('Hit element', el);
         *     });
         *
         *     })();
         *
         * </script><pre>
         */
        __evt__hit: function (e, el, target) { },

        /**
         * @event
         * @description Whenever an element is highlighted this event is fired.
         * @name JXG.Board#mousehit
         * @see JXG.Board#hit
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
         * @event
         * @description Select a region is started during a down event or by calling
         * {@link JXG.Board.startSelectionMode}
         * @name JXG.Board#startselecting
         */
        __evt__startselecting: function () { },

        /**
         * @event
         * @description Select a region is started during a down event
         * from a device sending mouse events or by calling
         * {@link JXG.Board.startSelectionMode}.
         * @name JXG.Board#mousestartselecting
         */
        __evt__mousestartselecting: function () { },

        /**
         * @event
         * @description Select a region is started during a down event
         * from a device sending pointer events or by calling
         * {@link JXG.Board.startSelectionMode}.
         * @name JXG.Board#pointerstartselecting
         */
        __evt__pointerstartselecting: function () { },

        /**
         * @event
         * @description Select a region is started during a down event
         * from a device sending touch events or by calling
         * {@link JXG.Board.startSelectionMode}.
         * @name JXG.Board#touchstartselecting
         */
        __evt__touchstartselecting: function () { },

        /**
         * @event
         * @description Selection of a region is stopped during an up event.
         * @name JXG.Board#stopselecting
         */
        __evt__stopselecting: function () { },

        /**
         * @event
         * @description Selection of a region is stopped during an up event
         * from a device sending mouse events.
         * @name JXG.Board#mousestopselecting
         */
        __evt__mousestopselecting: function () { },

        /**
         * @event
         * @description Selection of a region is stopped during an up event
         * from a device sending pointer events.
         * @name JXG.Board#pointerstopselecting
         */
        __evt__pointerstopselecting: function () { },

        /**
         * @event
         * @description Selection of a region is stopped during an up event
         * from a device sending touch events.
         * @name JXG.Board#touchstopselecting
         */
        __evt__touchstopselecting: function () { },

        /**
         * @event
         * @description A move event while selecting of a region is active.
         * @name JXG.Board#moveselecting
         */
        __evt__moveselecting: function () { },

        /**
         * @event
         * @description A move event while selecting of a region is active
         * from a device sending mouse events.
         * @name JXG.Board#mousemoveselecting
         */
        __evt__mousemoveselecting: function () { },

        /**
         * @event
         * @description Select a region is started during a down event
         * from a device sending mouse events.
         * @name JXG.Board#pointermoveselecting
         */
        __evt__pointermoveselecting: function () { },

        /**
         * @event
         * @description Select a region is started during a down event
         * from a device sending touch events.
         * @name JXG.Board#touchmoveselecting
         */
        __evt__touchmoveselecting: function () { },

        /**
         * @ignore
         */
        __evt: function () { },

        //endregion

        /**
         * Expand the JSXGraph construction to fullscreen.
         * In order to preserve the proportions of the JSXGraph element,
         * a wrapper div is created which is set to fullscreen.
         * This function is called when fullscreen mode is triggered
         * <b>and</b> when it is closed.
         * <p>
         * The wrapping div has the CSS class 'jxgbox_wrap_private' which is
         * defined in the file 'jsxgraph.css'
         * <p>
         * This feature is not available on iPhones (as of December 2021).
         *
         * @param {String} id (Optional) id of the div element which is brought to fullscreen.
         * If not provided, this defaults to the JSXGraph div. However, it may be necessary for the aspect ratio trick
         * which using padding-bottom/top and an out div element. Then, the id of the outer div has to be supplied.
         *
         * @return {JXG.Board} Reference to the board
         *
         * @example
         * &lt;div id='jxgbox' class='jxgbox' style='width:500px; height:200px;'&gt;&lt;/div&gt;
         * &lt;button onClick='board.toFullscreen()'&gt;Fullscreen&lt;/button&gt;
         *
         * &lt;script language='Javascript' type='text/javascript'&gt;
         * var board = JXG.JSXGraph.initBoard('jxgbox', {axis:true, boundingbox:[-5,5,5,-5]});
         * var p = board.create('point', [0, 1]);
         * &lt;/script&gt;
         *
         * </pre><div id='JXGd5bab8b6-fd40-11e8-ab14-901b0e1b8723' class='jxgbox' style='width: 300px; height: 300px;'></div>
         * <script type='text/javascript'>
         *      var board_d5bab8b6;
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGd5bab8b6-fd40-11e8-ab14-901b0e1b8723',
         *             {boundingbox:[-5,5,5,-5], axis: true, showcopyright: false, shownavigation: false});
         *         var p = board.create('point', [0, 1]);
         *         board_d5bab8b6 = board;
         *     })();
         * </script>
         * <button onClick='board_d5bab8b6.toFullscreen()'>Fullscreen</button>
         * <pre>
         *
         * @example
         * &lt;div id='outer' style='max-width: 500px; margin: 0 auto;'&gt;
         * &lt;div id='jxgbox' class='jxgbox' style='height: 0; padding-bottom: 100%'&gt;&lt;/div&gt;
         * &lt;/div&gt;
         * &lt;button onClick='board.toFullscreen('outer')'&gt;Fullscreen&lt;/button&gt;
         *
         * &lt;script language='Javascript' type='text/javascript'&gt;
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *     axis:true,
         *     boundingbox:[-5,5,5,-5],
         *     fullscreen: { id: 'outer' },
         *     showFullscreen: true
         * });
         * var p = board.create('point', [-2, 3], {});
         * &lt;/script&gt;
         *
         * </pre><div id='JXG7103f6b_outer' style='max-width: 500px; margin: 0 auto;'>
         * <div id='JXG7103f6be-6993-4ff8-8133-c78e50a8afac' class='jxgbox' style='height: 0; padding-bottom: 100%;'></div>
         * </div>
         * <button onClick='board_JXG7103f6be.toFullscreen('JXG7103f6b_outer')'>Fullscreen</button>
         * <script type='text/javascript'>
         *     var board_JXG7103f6be;
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG7103f6be-6993-4ff8-8133-c78e50a8afac',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, fullscreen: { id: 'JXG7103f6b_outer' }, showFullscreen: true,
         *              showcopyright: false, shownavigation: false});
         *     var p = board.create('point', [-2, 3], {});
         *     board_JXG7103f6be = board;
         *     })();
         *
         * </script><pre>
         *
         *
         */
        toFullscreen: function (id) {
            var wrap_id,
                wrap_node,
                inner_node,
                dim,
                doc = this.document,
                fullscreenElement;

            id = id || this.container;
            this._fullscreen_inner_id = id;
            inner_node = doc.getElementById(id);
            wrap_id = 'fullscreenwrap_' + id;

            if (!Type.exists(inner_node._cssFullscreenStore)) {
                // Store the actual, absolute size of the div
                // This is used in scaleJSXGraphDiv
                dim = this.containerObj.getBoundingClientRect();
                inner_node._cssFullscreenStore = {
                    w: dim.width,
                    h: dim.height
                };
            }

            // Wrap a div around the JSXGraph div.
            // It is removed when fullscreen mode is closed.
            if (doc.getElementById(wrap_id)) {
                wrap_node = doc.getElementById(wrap_id);
            } else {
                wrap_node = document.createElement('div');
                wrap_node.classList.add('JXG_wrap_private');
                wrap_node.setAttribute('id', wrap_id);
                inner_node.parentNode.insertBefore(wrap_node, inner_node);
                wrap_node.appendChild(inner_node);
            }

            // Trigger fullscreen mode
            wrap_node.requestFullscreen =
                wrap_node.requestFullscreen ||
                wrap_node.webkitRequestFullscreen ||
                wrap_node.mozRequestFullScreen ||
                wrap_node.msRequestFullscreen;

            if (doc.fullscreenElement !== undefined) {
                fullscreenElement = doc.fullscreenElement;
            } else if (doc.webkitFullscreenElement !== undefined) {
                fullscreenElement = doc.webkitFullscreenElement;
            } else {
                fullscreenElement = doc.msFullscreenElement;
            }

            if (fullscreenElement === null) {
                // Start fullscreen mode
                if (wrap_node.requestFullscreen) {
                    wrap_node.requestFullscreen();
                    this.startFullscreenResizeObserver(wrap_node);
                }
            } else {
                this.stopFullscreenResizeObserver(wrap_node);
                if (Type.exists(document.exitFullscreen)) {
                    document.exitFullscreen();
                } else if (Type.exists(document.webkitExitFullscreen)) {
                    document.webkitExitFullscreen();
                }
            }

            return this;
        },

        /**
         * If fullscreen mode is toggled, the possible CSS transformations
         * which are applied to the JSXGraph canvas have to be reread.
         * Otherwise the position of upper left corner is wrongly interpreted.
         *
         * @param  {Object} evt fullscreen event object (unused)
         */
        fullscreenListener: function (evt) {
            var inner_id,
                inner_node,
                fullscreenElement,
                doc = this.document;

            inner_id = this._fullscreen_inner_id;
            if (!Type.exists(inner_id)) {
                return;
            }

            if (doc.fullscreenElement !== undefined) {
                fullscreenElement = doc.fullscreenElement;
            } else if (doc.webkitFullscreenElement !== undefined) {
                fullscreenElement = doc.webkitFullscreenElement;
            } else {
                fullscreenElement = doc.msFullscreenElement;
            }

            inner_node = doc.getElementById(inner_id);
            // If full screen mode is started we have to remove CSS margin around the JSXGraph div.
            // Otherwise, the positioning of the fullscreen div will be false.
            // When leaving the fullscreen mode, the margin is put back in.
            if (fullscreenElement) {
                // Just entered fullscreen mode

                // Store the original data.
                // Further, the CSS margin has to be removed when in fullscreen mode,
                // and must be restored later.
                //
                // Obsolete:
                // It is used in AbstractRenderer.updateText to restore the scaling matrix
                // which is removed by MathJax.
                inner_node._cssFullscreenStore.id = fullscreenElement.id;
                inner_node._cssFullscreenStore.isFullscreen = true;
                inner_node._cssFullscreenStore.margin = inner_node.style.margin;
                inner_node._cssFullscreenStore.width = inner_node.style.width;
                inner_node._cssFullscreenStore.height = inner_node.style.height;
                inner_node._cssFullscreenStore.transform = inner_node.style.transform;
                // Be sure to replace relative width / height units by absolute units
                inner_node.style.width = inner_node._cssFullscreenStore.w + 'px';
                inner_node.style.height = inner_node._cssFullscreenStore.h + 'px';
                inner_node.style.margin = '';

                // Do the shifting and scaling via CSS properties
                // We do this after fullscreen mode has been established to get the correct size
                // of the JSXGraph div.
                Env.scaleJSXGraphDiv(fullscreenElement.id, inner_id, doc,
                    Type.evaluate(this.attr.fullscreen.scale));

                // Clear this.doc.fullscreenElement, because Safari doesn't to it and
                // when leaving full screen mode it is still set.
                fullscreenElement = null;
            } else if (Type.exists(inner_node._cssFullscreenStore)) {
                // Just left the fullscreen mode

                inner_node._cssFullscreenStore.isFullscreen = false;
                inner_node.style.margin = inner_node._cssFullscreenStore.margin;
                inner_node.style.width = inner_node._cssFullscreenStore.width;
                inner_node.style.height = inner_node._cssFullscreenStore.height;
                inner_node.style.transform = inner_node._cssFullscreenStore.transform;
                inner_node._cssFullscreenStore = null;

                // Remove the wrapper div
                inner_node.parentElement.replaceWith(inner_node);
            }

            this.updateCSSTransforms();
        },

        /**
         * Start resize observer to handle
         * orientation changes in fullscreen mode.
         *
         * @param {Object} node DOM object which is in fullscreen mode. It is the wrapper element
         * around the JSXGraph div.
         * @returns {JXG.Board} Reference to the board
         * @private
         * @see JXG.Board#toFullscreen
         *
         */
        startFullscreenResizeObserver: function(node) {
            var that = this;

            if (!Env.isBrowser || !this.attr.resize || !this.attr.resize.enabled) {
                return this;
            }

            this.resizeObserver = new ResizeObserver(function (entries) {
                var inner_id,
                    fullscreenElement,
                    doc = that.document;

                if (!that._isResizing) {
                    that._isResizing = true;
                    window.setTimeout(function () {
                        try {
                            inner_id = that._fullscreen_inner_id;
                            if (doc.fullscreenElement !== undefined) {
                                fullscreenElement = doc.fullscreenElement;
                            } else if (doc.webkitFullscreenElement !== undefined) {
                                fullscreenElement = doc.webkitFullscreenElement;
                            } else {
                                fullscreenElement = doc.msFullscreenElement;
                            }
                            if (fullscreenElement !== null) {
                                Env.scaleJSXGraphDiv(fullscreenElement.id, inner_id, doc,
                                    Type.evaluate(that.attr.fullscreen.scale));
                            }
                        } catch (err) {
                            that.stopFullscreenResizeObserver(node);
                        } finally {
                            that._isResizing = false;
                        }
                    }, that.attr.resize.throttle);
                }
            });
            this.resizeObserver.observe(node);
            return this;
        },

        /**
         * Remove resize observer to handle orientation changes in fullscreen mode.
         * @param {Object} node DOM object which is in fullscreen mode. It is the wrapper element
         * around the JSXGraph div.
         * @returns {JXG.Board} Reference to the board
         * @private
         * @see JXG.Board#toFullscreen
         */
        stopFullscreenResizeObserver: function(node) {
            if (!Env.isBrowser || !this.attr.resize || !this.attr.resize.enabled) {
                return this;
            }

            if (Type.exists(this.resizeObserver)) {
                this.resizeObserver.unobserve(node);
            }
            return this;
        },

        /**
         * Add user activity to the array 'board.userLog'.
         *
         * @param {String} type Event type, e.g. 'drag'
         * @param {Object} obj JSXGraph element object
         *
         * @see JXG.Board#userLog
         * @return {JXG.Board} Reference to the board
         */
        addLogEntry: function (type, obj, pos) {
            var t, id,
                last = this.userLog.length - 1;

            if (Type.exists(obj.elementClass)) {
                id = obj.id;
            }
            if (Type.evaluate(this.attr.logging.enabled)) {
                t = (new Date()).getTime();
                if (last >= 0 &&
                    this.userLog[last].type === type &&
                    this.userLog[last].id === id &&
                    // Distinguish consecutive drag events of
                    // the same element
                    t - this.userLog[last].end < 500) {

                    this.userLog[last].end = t;
                    this.userLog[last].endpos = pos;
                } else {
                    this.userLog.push({
                        type: type,
                        id: id,
                        start: t,
                        startpos: pos,
                        end: t,
                        endpos: pos,
                        bbox: this.getBoundingBox(),
                        canvas: [this.canvasWidth, this.canvasHeight],
                        zoom: [this.zoomX, this.zoomY]
                    });
                }
            }
            return this;
        },

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
         * var line = board.create('curve', [function (t) { return t;}, function (t){ return 1;}], {strokeWidth:6});
         * // Center of the rolling circle
         * var C = board.create('point',[0,2],{name:'C'});
         * // Starting point of the rolling circle
         * var P = board.create('point',[0,1],{name:'P', trace:true});
         * // Circle defined as a curve. The circle 'starts' at P, i.e. circle(0) = P
         * var circle = board.create('curve',[
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
         * var B = board.create('glider',[0,2,circle],{name:'B', color:'blue',trace:false});
         * var roll = board.createRoulette(line, circle, 0, Math.PI/20, 1, 100, [C,P,B]);
         * roll.start() // Start the rolling, to be stopped by roll.stop()
         *
         * </pre><div class='jxgbox' id='JXGe5e1b53c-a036-4a46-9e35-190d196beca5' style='width: 300px; height: 300px;'></div>
         * <script type='text/javascript'>
         * var brd = JXG.JSXGraph.initBoard('JXGe5e1b53c-a036-4a46-9e35-190d196beca5', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright:false, shownavigation: false});
         * // Line which will be the floor to roll upon.
         * var line = brd.create('curve', [function (t) { return t;}, function (t){ return 1;}], {strokeWidth:6});
         * // Center of the rolling circle
         * var C = brd.create('point',[0,2],{name:'C'});
         * // Starting point of the rolling circle
         * var P = brd.create('point',[0,1],{name:'P', trace:true});
         * // Circle defined as a curve. The circle 'starts' at P, i.e. circle(0) = P
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
                    var alpha = 0,
                        Tx = 0,
                        Ty = 0,
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
                        t1_new = 0.0,
                        t2_new = 0.0,
                        c1dist,
                        rotation = brd.create(
                            'transform',
                            [
                                function () {
                                    return alpha;
                                }
                            ],
                            { type: 'rotate' }
                        ),
                        rotationLocal = brd.create(
                            'transform',
                            [
                                function () {
                                    return alpha;
                                },
                                function () {
                                    return c1.X(t1);
                                },
                                function () {
                                    return c1.Y(t1);
                                }
                            ],
                            { type: 'rotate' }
                        ),
                        translate = brd.create(
                            'transform',
                            [
                                function () {
                                    return Tx;
                                },
                                function () {
                                    return Ty;
                                }
                            ],
                            { type: 'translate' }
                        ),
                        // arc length via Simpson's rule.
                        arclen = function (c, a, b) {
                            var cpxa = Numerics.D(c.X)(a),
                                cpya = Numerics.D(c.Y)(a),
                                cpxb = Numerics.D(c.X)(b),
                                cpyb = Numerics.D(c.Y)(b),
                                cpxab = Numerics.D(c.X)((a + b) * 0.5),
                                cpyab = Numerics.D(c.Y)((a + b) * 0.5),
                                fa = Mat.hypot(cpxa, cpya),
                                fb = Mat.hypot(cpxb, cpyb),
                                fab = Mat.hypot(cpxab, cpyab);

                            return ((fa + 4 * fab + fb) * (b - a)) / 6;
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
    }
);

export default JXG.Board;
