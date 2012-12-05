/*
    Copyright 2008-2012
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
 * @fileoverview The JXG.Board class is defined in this file. JXG.Board controls all properties and methods
 * used to manage a geonext board like managing geometric elements, managing mouse and touch events, etc.
 * @author graphjs
 * @version 0.1
 */

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
 * @param {Boolean} showCopyright Display the copyright text
 * @borrows JXG.EventEmitter#on as this.on
 * @borrows JXG.EventEmitter#off as this.off
 * @borrows JXG.EventEmitter#triggerEventHandlers as this.triggerEventHandlers
 * @borrows JXG.EventEmitter#eventHandlers as this.eventHandlers
 */
JXG.Board = function (container, renderer, id, origin, zoomX, zoomY, unitX, unitY, canvasWidth, canvasHeight, showCopyright) {
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
     /* Update is made with low quality, e.g. graphs are evaluated at a lesser amount of points.
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

    // TODO: Do we still need the CONSTRUCTIOIN_TYPE_* properties?!? -- Haaner says: NO
    // BEGIN CONSTRUCTION_TYPE_* stuff

    /**
     * Board is in construction mode, objects are highlighted on mouse over and the behaviour of the board
     * is determined by the construction type stored in the field constructionType.
     * @type Number
     * @constant
     */
    this.BOARD_MODE_CONSTRUCT = 0x0010;

    /**
     * When the board is in construction mode this construction type says we want to construct a point.
     * @type Number
     * @constant
     */
    this.CONSTRUCTION_TYPE_POINT         = 0x43545054;       // CTPT
    /**
     * When the board is in construction mode this construction type says we want to construct a circle.
     * @type Number
     * @constant
     */
    this.CONSTRUCTION_TYPE_CIRCLE        = 0x4354434C;       // CTCL
    /**
     * When the board is in construction mode this construction type says we want to construct a line.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_LINE          = 0x43544C4E;       // CTLN
    /**
     * When the board is in construction mode this construction type says we want to construct a glider.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_GLIDER        = 0x43544744;       // CTSD
    /**
     * When the board is in construction mode this construction type says we want to construct a midpoint.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_MIDPOINT      = 0x43544D50;       // CTMP
    /**
     * When the board is in construction mode this construction type says we want to construct a perpendicular.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_PERPENDICULAR = 0x43545044;       // CTPD
    /**
     * When the board is in construction mode this construction type says we want to construct a parallel.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_PARALLEL      = 0x4354504C;       // CTPL
    /**
     * When the board is in construction mode this construction type says we want to construct a intersection.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_INTERSECTION  = 0x43544953;       // CTIS
    // END CONSTRUCTION_TYPE_* stuff

    /**
     * The html-id of the html element containing the board.
     * @type String
     */
    this.container = container;

    /**
     * Pointer to the html element containing the board.
     * @type Object
     */
    this.containerObj = typeof document != 'undefined' ? document.getElementById(this.container) : null;
    if (typeof document != 'undefined' && this.containerObj == null) {
        throw new Error("\nJSXGraph: HTML container element '" + (container) + "' not found.");
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
    this.options = JXG.deepCopy(JXG.Options);

    /**
     * Dimension of the board.
     * @default 2
     * @type Number
     */
    this.dimension = 2;

    this.jc = new JXG.JessieCode();
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
    this.unitX = unitX*this.zoomX;

    /**
     * The number of pixels which represent one unit in user-coordinates in y direction.
     * @type Number
     */
    this.unitY = unitY*this.zoomY;

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
    if (JXG.exists(id) && id !== '' && typeof document != 'undefined' && !JXG.exists(document.getElementById(id))) {
        this.id = id;
    } else {
        this.id = this.generateId();
    }

    JXG.EventEmitter.eventify(this);
    
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
     * <li>JXG.Board.BOARD_MODE_CONSTRUCT</li>
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
     * References to the object that is dragged with the mouse on the board.
     * @type {@link JXG.GeometryElement}.
     * @see {JXG.Board#touches}
     */
    this.mouse = null;

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
     * Cached ressult of getCoordsTopLeftCorner for touch/mouseMove-Events to save some DOM operations.
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
     * Collects all elements that triggered a mouse down event.
     * @type Array
     */
    this.downObjects = [];

    /**
     * Display the licence text.
     * @see JXG.JSXGraph#licenseText
     * @see JXG.JSXGraph#initBoard
     */
    this.showCopyright = false;
    if ((showCopyright!=null && showCopyright) || (showCopyright==null && this.options.showCopyright)) {
        this.showCopyright = true;
        this.renderer.displayCopyright(JXG.JSXGraph.licenseText, parseInt(this.options.text.fontSize));
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
     * @default true
     */
    this.hasMouseHandlers = false;

    /**
     * A flag which tells if the board registers touch events.
     * @type Boolean
     * @default true
     */
    this.hasTouchHandlers = false;

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

    this.addEventHandlers();

    this.methodMap = {
        update: 'update',
        on: 'on',
        off: 'off',
        setView: 'setBoundingBox',
        setBoundingBox: 'setBoundingBox',
        migratePoint: 'migratePoint',
        colorblind: 'emulateColorblindness'
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
        if (object.type == JXG.OBJECT_TYPE_TICKS) {
            return '';
        }

        var possibleNames,
            maxNameLength = 2,
            pre = '',
            post = '',
            indices = [],
            name = '',
            i, j;

        if (object.elementClass == JXG.OBJECT_CLASS_POINT) {
            // points have capital letters
            possibleNames = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        } else if (object.type == JXG.OBJECT_TYPE_ANGLE) {
            if (false) {
                possibleNames = ['', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ','ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 
                    'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω']; //'&sigmaf;', 
            } else {
                possibleNames = ['', '&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;', '&theta;',
                    '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', 
                    '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;']; //'&sigmaf;', 
            }
        } else {
            // all other elements get lowercase labels
            possibleNames = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        }

        if (    object.elementClass !== JXG.OBJECT_CLASS_POINT 
            && object.elementClass != JXG.OBJECT_CLASS_LINE
            && object.type != JXG.OBJECT_TYPE_ANGLE) {
            
            if (object.type === JXG.OBJECT_TYPE_POLYGON) {
                pre = 'P_{';
            //} else if (object.type === JXG.OBJECT_TYPE_ANGLE) {
            //    pre = 'W_{';
            } else if (object.elementClass === JXG.OBJECT_CLASS_CIRCLE) {
                pre = 'k_{';
            } else if (object.type === JXG.OBJECT_TYPE_TEXT) {
                pre = 't_{';
            } else {
                pre = 's_{';
            }
            post = '}';
        }

        for (i=0; i<maxNameLength; i++) {
            indices[i] = 0;
        }

        while (indices[maxNameLength-1] < possibleNames.length) {
            for (indices[0]=1; indices[0]<possibleNames.length; indices[0]++) {
                name = pre;

                for (i=maxNameLength; i>0; i--) {
                    name += possibleNames[indices[i-1]];
                }

                if (this.elementsByName[name+post] == null) {
                    return name+post;
                }

            }
            indices[0] = possibleNames.length;
            for (i=1; i<maxNameLength; i++) {
                if (indices[i-1] == possibleNames.length) {
                    indices[i-1] = 1;
                    indices[i]++;
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

        // as long as we don't have an unique id generate a new one
        while (JXG.JSXGraph.boards['jxgBoard' + r] != null) {
            r = Math.round(Math.random()*65535);
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
        var num = this.numObjects++,
            elId = obj.id;

        // Falls Id nicht vorgegeben, eine Neue generieren:
        if (elId == '' || !JXG.exists(elId)) {
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
        if (obj.hasLabel && !obj.label.content.visProp.islabel && !obj.label.content.visProp.visible) {
            this.renderer.hide(obj.label.content);
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
        var pCont = this.containerObj,
            cPos = JXG.getOffset(pCont),
            doc = document.documentElement.ownerDocument,
            getProp = function(css) {
                var n = parseInt(JXG.getStyle(pCont, css));
                return isNaN(n) ? 0 : n;
            };

        if (this.cPos.length > 0 && (this.mode === JXG.BOARD_MODE_DRAG || this.mode === JXG.BOARD_MODE_MOVE_ORIGIN)) {
            return this.cPos;
        }

        if (!pCont.currentStyle && doc.defaultView) {     // Non IE
            pCont = document.documentElement;

            // this is for hacks like this one used in wordpress for the admin bar:
            // html { margin-top: 28px }
            // seems like it doesn't work in IE

            cPos[0] += getProp('margin-left');
            cPos[1] += getProp('margin-top');

            cPos[0] += getProp('border-left-width');
            cPos[1] += getProp('border-top-width');

            cPos[0] += getProp('padding-left');
            cPos[1] += getProp('padding-top');

            pCont = this.containerObj;
        }

        // add border width
        cPos[0] += getProp('border-left-width');
        cPos[1] += getProp('border-top-width');

        // vml seems to ignore paddings
        if (this.renderer.type !== 'vml') {
            // add padding
            cPos[0] += getProp('padding-left');
            cPos[1] += getProp('padding-top');
        }

        this.cPos = cPos;

        return cPos;
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
            absPos, v;

        // This fixes the object-drag bug on zoomed webpages on Android powered devices with the default WebKit browser
        // Seems to be obsolete now
        //if (JXG.isWebkitAndroid()) {
        //    cPos[0] -= document.body.scrollLeft;
        //    cPos[1] -= document.body.scrollTop;
        //}

        // position of mouse cursor relative to containers position of container
        absPos = JXG.getPosition(e, i);
        
        /*
        v = [1, absPos[0], absPos[1]];
        v = JXG.Math.matVecMult(this.cssTransMat, v);
        v[1] /= v[0];
        v[2] /= v[1];
        return [v[1]-cPos[0], v[2]-cPos[1]];
        */
        return [absPos[0]-cPos[0], absPos[1]-cPos[1]];
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
            dragEl = {visProp:{layer:-10000}};

        //for (el in this.objects) {
        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            haspoint = pEl.hasPoint && pEl.hasPoint(x, y);

            if (pEl.visProp.visible && haspoint) {
                pEl.triggerEventHandlers([type + 'down', 'down'], evt);
                this.downObjects.push(pEl);
            }
            if (
                ((this.geonextCompatibilityMode
                  && (pEl.elementClass==JXG.OBJECT_CLASS_POINT
                     || pEl.type==JXG.OBJECT_TYPE_TEXT)
                 )
                 ||
                 !this.geonextCompatibilityMode
                )
                && pEl.isDraggable
                && pEl.visProp.visible
                && (!pEl.visProp.fixed) && (!pEl.visProp.frozen)
                && haspoint
                ) {
                    // Elements in the highest layer get priority.
                    if (pEl.visProp.layer >= dragEl.visProp.layer) {
                        // If an element and its label have the focus
                        // simultaneously, the element is taken
                        // this only works if we assume that every browser runs
                        // through this.objects in the right order, i.e. an element A
                        // added before element B turns up here before B does.
                        if (JXG.exists(dragEl.label) && pEl==dragEl.label.content) {
                            continue;
                        }

                        dragEl = pEl;
                        collect[0] = dragEl;

                        // we can't drop out of this loop because of the event handling system
                        //if (this.options.takeFirst) {
                        //    return collect;
                        //}
                    }
            }
        }

        if (collect.length > 0) {
            this.mode = this.BOARD_MODE_DRAG;
        }

        if (this.options.takeFirst) {
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
        var newPos = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(x, y), this),
            drag = o.obj,
            oldCoords;

        if (drag.type != JXG.OBJECT_TYPE_GLIDER) {
            if (!isNaN(o.targets[0].Xprev+o.targets[0].Yprev)) {
                 drag.setPositionDirectly(
                    JXG.COORDS_BY_SCREEN, newPos.scrCoords.slice(1), 
                    [o.targets[0].Xprev, o.targets[0].Yprev]);
            }
            // Remember the actual position for the next move event. Then we are able to
            // compute the difference vector.
            o.targets[0].Xprev = newPos.scrCoords[1];
            o.targets[0].Yprev = newPos.scrCoords[2];
            this.update(drag);
        } else if (drag.type == JXG.OBJECT_TYPE_GLIDER) {
            oldCoords = drag.coords;

            // First the new position of the glider is set to the new mouse position
            drag.setPositionDirectly(JXG.COORDS_BY_USER, newPos.usrCoords.slice(1));

            // Then, from this position we compute the projection to the object the glider on which the glider lives.
            if (drag.slideObject.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
                drag.coords = JXG.Math.Geometry.projectPointToCircle(drag, drag.slideObject, this);
            } else if (drag.slideObject.elementClass == JXG.OBJECT_CLASS_LINE) {
                drag.coords = JXG.Math.Geometry.projectPointToLine(drag, drag.slideObject, this);
            }

            // Now, we have to adjust the other group elements again.
            if (drag.group.length != 0) {
                drag.group[drag.group.length-1].dX = drag.coords.scrCoords[1] - oldCoords.scrCoords[1];
                drag.group[drag.group.length-1].dY = drag.coords.scrCoords[2] - oldCoords.scrCoords[2];
                drag.group[drag.group.length-1].update(this);
            } else {
                this.update(drag);
            }
        }

        drag.triggerEventHandlers([type+  'drag', 'drag'], evt);

        this.updateInfobox(drag);
        this.update();
        drag.highlight(true);
    },

    /**
     * Moves elements in multitouch mode.
     * @param {Array} p1 x,y coordinates of first touch
     * @param {Array} p2 x,y coordinates of second touch
     * @param {Object} o The touch object that is dragged: {JXG.Board#touches}.
     * @param {Object} evt The event object that lead to this movement.
     */
    twoFingerMove: function(p1, p2, o, evt) {
        var np1c, np2c, drag;

        if (JXG.exists(o) && JXG.exists(o.obj)) {
            drag = o.obj;
        } else {
            return;
        }

        // New finger position
        np1c = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(p1[0], p1[1]), this);
        np2c = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(p2[0], p2[1]), this);

        if (drag.elementClass===JXG.OBJECT_CLASS_LINE
            || drag.type===JXG.OBJECT_TYPE_POLYGON) {
            this.twoFingerTouchObject(np1c, np2c, o, drag);
        } else if (drag.elementClass===JXG.OBJECT_CLASS_CIRCLE) {
            this.twoFingerTouchCircle(np1c, np2c, o, drag);
        } 
        drag.triggerEventHandlers(['touchdrag', 'drag'], evt);

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
    twoFingerTouchObject: function(np1c, np2c, o, drag) {
        var np1, np2, op1, op2,
            nmid, omid, nd, od,
            d,
            S, alpha, t1, t2, t3, t4, t5;

        if (JXG.exists(o.targets[0]) &&
            JXG.exists(o.targets[1]) &&
            !isNaN(o.targets[0].Xprev + o.targets[0].Yprev + o.targets[1].Xprev + o.targets[1].Yprev)) {

            np1 = np1c.usrCoords;
            np2 = np2c.usrCoords;
            // Previous finger position
            op1 = (new JXG.Coords(JXG.COORDS_BY_SCREEN, [o.targets[0].Xprev,o.targets[0].Yprev], this)).usrCoords;
            op2 = (new JXG.Coords(JXG.COORDS_BY_SCREEN, [o.targets[1].Xprev,o.targets[1].Yprev], this)).usrCoords;

            // Affine mid points of the old and new positions
            omid = [1, (op1[1]+op2[1])*0.5, (op1[2]+op2[2])*0.5];
            nmid = [1, (np1[1]+np2[1])*0.5, (np1[2]+np2[2])*0.5];

            // Old and new directions
            od = JXG.Math.crossProduct(op1, op2);
            nd = JXG.Math.crossProduct(np1, np2);
            S = JXG.Math.crossProduct(od, nd);

            // If parallel, translate otherwise rotate
            if (Math.abs(S[0])<JXG.Math.eps){
                return;
                t1 = this.create('transform', [nmid[1]-omid[1], nmid[2]-omid[2]], {type:'translate'});
            } else {
                S[1] /= S[0];
                S[2] /= S[0];
                alpha = JXG.Math.Geometry.rad(omid.slice(1), S.slice(1), nmid.slice(1));
                t1 = this.create('transform', [alpha, S[1], S[2]], {type:'rotate'});
            }
            // Old midpoint of fingers after first transformation:
            t1.update();
            omid = JXG.Math.matVecMult(t1.matrix, omid);
            omid[1] /= omid[0];
            omid[2] /= omid[0];

            // Shift to the new mid point
            t2 = this.create('transform', [nmid[1]-omid[1], nmid[2]-omid[2]], {type:'translate'});
            t2.update();
            //omid = JXG.Math.matVecMult(t2.matrix, omid);

            t1.melt(t2);
            if (drag.visProp.scalable) {
                // Scale
                d = JXG.Math.Geometry.distance(np1, np2) / JXG.Math.Geometry.distance(op1, op2);
                t3 = this.create('transform', [-nmid[1], -nmid[2]], {type:'translate'});
                t4 = this.create('transform', [d, d], {type:'scale'});
                t5 = this.create('transform', [nmid[1], nmid[2]], {type:'translate'});
                t1.melt(t3).melt(t4).melt(t5);
            }

            if (drag.elementClass===JXG.OBJECT_CLASS_LINE) {
                t1.applyOnce([drag.point1, drag.point2]);
            } else if (drag.type===JXG.OBJECT_TYPE_POLYGON) {
                t1.applyOnce(drag.vertices.slice(0,-1));
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
    twoFingerTouchCircle: function(np1c, np2c, o, drag) {
        var np1, np2, op1, op2,
            d, alpha, t1, t2, t3, t4, t5;

        if (drag.method === 'pointCircle'
            || drag.method === 'pointLine') {
            return;
        }

        if (JXG.exists(o.targets[0]) &&
            JXG.exists(o.targets[1]) &&
            !isNaN(o.targets[0].Xprev + o.targets[0].Yprev + o.targets[1].Xprev + o.targets[1].Yprev)) {

            np1 = np1c.usrCoords;
            np2 = np2c.usrCoords;
            // Previous finger position
            op1 = (new JXG.Coords(JXG.COORDS_BY_SCREEN, [o.targets[0].Xprev,o.targets[0].Yprev], this)).usrCoords;
            op2 = (new JXG.Coords(JXG.COORDS_BY_SCREEN, [o.targets[1].Xprev,o.targets[1].Yprev], this)).usrCoords;

            // Shift by the movement of the first finger
            t1 = this.create('transform', [np1[1]-op1[1], np1[2]-op1[2]], {type:'translate'});
            alpha = JXG.Math.Geometry.rad(op2.slice(1), np1.slice(1), np2.slice(1));

            // Rotate and scale by the movement of the second finger
            t2 = this.create('transform', [-np1[1], -np1[2]], {type:'translate'});
            t3 = this.create('transform', [alpha], {type:'rotate'});
            t1.melt(t2).melt(t3);

            if (drag.visProp.scalable) {
                d = JXG.Math.Geometry.distance(np1, np2) / JXG.Math.Geometry.distance(op1, op2);
                t4 = this.create('transform', [d, d], {type:'scale'});
                t1.melt(t4);
            }
            t5 = this.create('transform', [ np1[1], np1[2]], {type:'translate'});
            t1.melt(t5);

            t1.applyOnce([drag.center]);

            if (drag.method==='twoPoints') {
                t1.applyOnce([drag.point2]);
            } else if (drag.method==='pointRadius') {
                if (JXG.isNumber(drag.updateRadius.origin)) {
                    drag.setRadius(drag.radius*d);
                }
            }
            this.update(drag.center);
            drag.highlight(true);
        }
    },

    highlightElements: function (x, y, evt, target) {
        var el, pEl, pId, len = this.objectsList.length;

        // Elements  below the mouse pointer which are not highlighted yet will be highlighted.
        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            pId = pEl.id;
            if (pEl.visProp.highlight && JXG.exists(pEl.hasPoint) && pEl.visProp.visible && pEl.hasPoint(x, y)) {
                // this is required in any case because otherwise the box won't be shown until the point is dragged
                this.updateInfobox(pEl);

                if (!JXG.exists(this.highlightedObjects[pId])) { // highlight only if not highlighted
                    this.highlightedObjects[pId] = pEl;
                    pEl.highlight();
                    this.triggerEventHandlers(['mousehit', 'hit'], evt, pEl, target);
                }

                if (pEl.mouseover) {
                    pEl.triggerEventHandlers(['mousemove', 'move'], evt);
                } else {
                    pEl.triggerEventHandlers(['mouseover', 'over'], evt);
                    pEl.mouseover = true;
                }
            }
        }

        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            pId = pEl.id;
            if (pEl.mouseover) {
                if (!this.highlightedObjects[pId]) {
                    pEl.triggerEventHandlers(['mouseout', 'out'], evt);
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
    saveStartPos: function (obj, targ) {
        var xy = [], i, len;
        
        if (obj.elementClass == JXG.OBJECT_CLASS_LINE) {
            xy.push(obj.point1.coords.usrCoords);
            xy.push(obj.point2.coords.usrCoords);
        } else if (obj.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
            xy.push(obj.center.coords.usrCoords);
        } else if (obj.type == JXG.OBJECT_TYPE_GLIDER) {
            xy.push([obj.position, obj.position, obj.position]);
        } else if (obj.type == JXG.OBJECT_TYPE_POLYGON) {
            len = obj.vertices.length-1;
            for (i=0; i<len; i++) {
                xy.push(obj.vertices[i].coords.usrCoords);
            }
        } else if (obj.elementClass == JXG.OBJECT_CLASS_POINT) {
            xy.push(obj.coords.usrCoords);
        } else {
            try {
                xy.push(obj.coords.usrCoords);
            } catch(e) {
                JXG.debug('JSXGraph+ saveStartPos: obj.coords.usrCoords not available: ' + e);
            }
        }

        len = xy.length;
        for (i=0; i<len; i++) {
            targ.Zstart.push(xy[i][0]);
            targ.Xstart.push(xy[i][1]);
            targ.Ystart.push(xy[i][2]);
        }
    },

    mouseOriginMoveStart: function (evt) {
        var r = this.options.pan.enabled && (!this.options.pan.needShift || evt.shiftKey);
        
        if (r) {
            var pos = this.getMousePosition(evt);
            this.initMoveOrigin(pos[0], pos[1]);
        }

        return r;
    },

    mouseOriginMove: function (evt) {
        var r = (this.mode === this.BOARD_MODE_MOVE_ORIGIN);

        if (r) {
            var pos = this.getMousePosition(evt);
            this.moveOrigin(pos[0], pos[1], true);
        }

        return r;
    },

    touchOriginMoveStart: function (evt) {
        var touches = evt[JXG.touchProperty],
            twoFingersCondition = (touches.length == 2 && JXG.Math.Geometry.distance([touches[0].screenX, touches[0].screenY], [touches[1].screenX, touches[1].screenY]) < 80),
            r = this.options.pan.enabled && (!this.options.pan.needTwoFingers || twoFingersCondition);

        if (r) {
            var pos = this.getMousePosition(evt, 0);
            this.initMoveOrigin(pos[0], pos[1]);
        }

        return r;
    },

    touchOriginMove: function(evt) {
        var r = (this.mode === this.BOARD_MODE_MOVE_ORIGIN);

        if (r) {
            var pos = this.getMousePosition(evt, 0);
            this.moveOrigin(pos[0], pos[1], true);
        }

        return r;
    },

    originMoveEnd: function () {
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
        this.addMouseEventHandlers();
        this.addTouchEventHandlers();
      },

    addMouseEventHandlers: function () {

	   if (!this.hasMouseHandlers && typeof document != 'undefined') {

            JXG.addEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
            JXG.addEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);

            // this is now added dynamically in mousedown
            //JXG.addEvent(document, 'mouseup', this.mouseUpListener,this);

           	JXG.addEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
           	JXG.addEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);

            this.hasMouseHandlers = true;

            // This one produces errors on IE
            //   JXG.addEvent(this.containerObj, 'contextmenu', function (e) { e.preventDefault(); return false;}, this);

            // This one works on IE, Firefox and Chromium with default configurations. On some Safari
            // or Opera versions the user must explicitly allow the deactivation of the context menu.
            this.containerObj.oncontextmenu = function (e) { if (JXG.exists(e)) e.preventDefault(); return false; };
        }
    },

    addTouchEventHandlers: function () {

		if (!this.hasTouchHandlers && typeof document != 'undefined') {

            JXG.addEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
            JXG.addEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);

            // this is now added dynamically in touchstart
            //JXG.addEvent(document, 'touchend', this.touchEndListener, this);

           	JXG.addEvent(this.containerObj, 'gesturestart', this.gestureStartListener, this);
           	JXG.addEvent(this.containerObj, 'gesturechange', this.gestureChangeListener, this);

            this.hasTouchHandlers = true;
        }
    },

    removeMouseEventHandlers: function () {

        if (this.hasMouseHandlers && typeof document != 'undefined') {

            JXG.removeEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
            JXG.removeEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);

            if (this.hasMouseUp) {
                JXG.removeEvent(document, 'mouseup', this.mouseUpListener, this);
                this.hasMouseUp = false;
            }

           	JXG.removeEvent(this.containerObj, 'mousewheel', this.mouseWheelListener, this);
		    JXG.removeEvent(this.containerObj, 'DOMMouseScroll', this.mouseWheelListener, this);

            this.hasMouseHandlers = false;
        }
    },

    removeTouchEventHandlers: function () {

        if (this.hasTouchHandlers && typeof document != 'undefined') {

            JXG.removeEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
            JXG.removeEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);

            if (this.hasTouchEnd) {
                JXG.removeEvent(document, 'touchend', this.touchEndListener, this);
                this.hasTouchEnd = false;
            }

			JXG.removeEvent(this.containerObj, 'gesturestart', this.gestureStartListener, this);
			JXG.removeEvent(this.containerObj, 'gesturechange', this.gestureChangeListener, this);

            this.hasTouchHandlers = false;
        }
    },

    /**
     * Remove all event handlers from the board object
     */
    removeEventHandlers: function () {
        this.removeMouseEventHandlers();
        this.removeTouchEventHandlers();
    },

    /**
     * Handler for click on left arrow in the navigation bar
     * @private
     */
    clickLeftArrow: function () {
        this.moveOrigin(this.origin.scrCoords[1] + this.canvasWidth*0.1, this.origin.scrCoords[2]);
        return this;
    },

    /**
     * Handler for click on right arrow in the navigation bar
     * @private
     */
    clickRightArrow: function () {
        this.moveOrigin(this.origin.scrCoords[1] - this.canvasWidth*0.1, this.origin.scrCoords[2]);
        return this;
    },

    /**
     * Handler for click on up arrow in the navigation bar
     * @private
     */
    clickUpArrow: function () {
        this.moveOrigin(this.origin.scrCoords[1], this.origin.scrCoords[2] - this.canvasHeight*0.1);
        return this;
    },

    /**
     * Handler for click on down arrow in the navigation bar
     * @private
     */
    clickDownArrow: function () {
        this.moveOrigin(this.origin.scrCoords[1], this.origin.scrCoords[2] + this.canvasHeight*0.1);
        return this;
    },

    /**
     * Triggered on iOS/Safari while the user inputs a gesture (e.g. pinch) and is used to zoom into the board. Only works on iOS/Safari.
     * @param {Event} evt Browser event object
     * @return {Boolean}
     */
    gestureChangeListener: function (evt) {
        var c,
            zx = this.options.zoom.factorX,
            zy = this.options.zoom.factorY;

        if (!this.options.zoom.wheel) {
            return true;
        }

        evt.preventDefault();

        if (this.mode === this.BOARD_MODE_NONE) {
            c = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getMousePosition(evt), this);

            this.options.zoom.factorX = evt.scale/this.prevScale;
            this.options.zoom.factorY = evt.scale/this.prevScale;

            this.zoomIn(c.usrCoords[1], c.usrCoords[2]);
            this.prevScale = evt.scale;

            this.options.zoom.factorX = zx;
            this.options.zoom.factorY = zy;
        }

        return false;
    },

    /**
     * Called by iOS/Safari as soon as the user starts a gesture (only works on iOS/Safari).
     * @param {Event} evt
     * @return {Boolean}
     */
    gestureStartListener: function (evt) {
        if (!this.options.zoom.wheel) {
            return true;
        }

        evt.preventDefault();
        this.prevScale = 1;

        return false;
    },

    /**
     * Touch-Events
     */

    /**
     * This method is called by the browser when a finger touches the surface of the touch-device.
     * @param {Event} evt The browsers event object.
     * @param {Object} object If the object to be dragged is already known, it can be submitted via this parameter
     * @returns {Boolean} ...
     */
    touchStartListener: function (evt, object) {
        var i, pos, elements, j, k,
            eps = this.options.precision.touch,
            obj, found, targets,
            evtTouches = evt[JXG.touchProperty];

        if (!this.hasTouchEnd) {
            JXG.addEvent(document, 'touchend', this.touchEndListener, this);
            this.hasTouchEnd = true;
        }

        if (this.hasMouseHandlers) {
			this.removeMouseEventHandlers();
        }

        // prevent accidental selection of text
        if (document.selection && typeof document.selection.empty == 'function') {
            document.selection.empty();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }

        // multitouch
        this.options.precision.hasPoint = this.options.precision.touch;

        // TODO: Is the following TODO still relevant? Or has it been done already? If so, this comment should be updated ...
        // assuming only points are getting dragged
        // todo: this is the most critical part. first we should run through the existing touches and collect all targettouches that don't belong to our
        // previous touches. once this is done we run through the existing touches again and watch out for free touches that can be attached to our existing
        // touches, e.g. we translate (parallel translation) a line with one finger, now a second finger is over this line. this should change the operation to
        // a rotational translation. or one finger moves a circle, a second finger can be attached to the circle: this now changes the operation from translation to
        // stretching. as a last step we're going through the rest of the targettouches and initiate new move operations:
        //  * points have higher priority over other elements.
        //  * if we find a targettouch over an element that could be transformed with more than one finger, we search the rest of the targettouches, if they are over
        //    this element and add them.
        // ADDENDUM 11/10/11:
        // to allow the user to drag lines and circles with multitouch we have to change this here. some notes for me before implementation:
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
                            Math.pow(evtTouches[k].screenY - this.touches[i].targets[j].Y, 2)) < eps*eps) {
                            this.touches[i].targets[j].num = k;

                            this.touches[i].targets[j].X = evtTouches[k].screenX;
                            this.touches[i].targets[j].Y = evtTouches[k].screenY;
                            evtTouches[k].jxg_isused = true;
                            break;
                        }
                    }

                    eps *= 2;

                } while (this.touches[i].targets[j].num == -1 && eps < this.options.precision.touchMax);

                if (this.touches[i].targets[j].num === -1) {
                    JXG.debug('i couldn\'t find a targettouches for target no ' + j + ' on ' + this.touches[i].obj.name + ' (' + this.touches[i].obj.id + '). Removed the target.');
                    JXG.debug('eps = ' + eps + ', touchMax = ' + JXG.Options.precision.touchMax);
                    this.touches[i].targets.splice(i, 1);
                }

            }
        }

        // we just re-mapped the targettouches to our existing touches list. now we have to initialize some touches from additional targettouches
        for (i = 0; i < evtTouches.length; i++) {
            if (object || !evtTouches[i].jxg_isused) {
                pos = this.getMousePosition(evt, i);

                if (object) {
                    elements = [ object ];
                    this.mode = this.BOARD_MODE_DRAG;
                } else
                    elements = this.initMoveObject(pos[0], pos[1], evt, 'touch');

                if (elements.length != 0) {
                    obj = elements[elements.length-1];

                    if (JXG.isPoint(obj) 
                        || obj.type === JXG.OBJECT_TYPE_TEXT
                        || obj.type === JXG.OBJECT_TYPE_TICKS) {
                        // it's a point, so it's single touch, so we just push it to our touches

                        targets = [{ num: i, X: evtTouches[i].screenX, Y: evtTouches[i].screenY, Xprev: NaN, Yprev: NaN, Xstart: [], Ystart: [], Zstart: [] }];

                        // For the UNDO/REDO of object moves
                        this.saveStartPos(obj, targets[0]);
                        this.touches.push({ obj: obj, targets: targets });
                        this.highlightedObjects[obj.id] = obj;
                        obj.highlight(true);
                    } else if (obj.elementClass === JXG.OBJECT_CLASS_LINE 
                                || obj.elementClass === JXG.OBJECT_CLASS_CIRCLE
                                || obj.type === JXG.OBJECT_TYPE_POLYGON
                                ) {
                        found = false;
                        // first check if this geometric object is already capture in this.touches
                        for (j = 0; j < this.touches.length; j++) {
                            if (obj.id === this.touches[j].obj.id) {
                                found = true;
                                // only add it, if we don't have two targets in there already
                                if (this.touches[j].targets.length === 1) {

                                    var target = { num: i, X: evtTouches[i].screenX, Y: evtTouches[i].screenY, Xprev: NaN, Yprev: NaN, Xstart: [], Ystart: [], Zstart: [] };

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
                            this.highlightedObjects[obj.id] = obj;
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
            this.triggerEventHandlers(['touchstart', 'down'], evt);
            return false;
        }
        

        if (JXG.isWebkitAndroid()) {
            var ti = new Date();
            this.touchMoveLast = ti.getTime()-200;
        }

        this.options.precision.hasPoint = this.options.precision.mouse;

        this.triggerEventHandlers(['touchstart', 'down'], evt);

        return this.touches.length > 0;
    },

    /**
     * Called periodically by the browser while the user moves his fingers across the device.
     * @param {Event} evt
     * @return {Boolean}
     */
    touchMoveListener: function (evt) {
        var i, count = 0, pos,
            evtTouches = evt[JXG.touchProperty];

        if (this.mode !== this.BOARD_MODE_NONE) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        // Reduce update frequency for Android devices
        if (JXG.isWebkitAndroid()) {
            var ti = new Date();
            ti = ti.getTime();
            if (ti-this.touchMoveLast<80) {
                this.updateQuality = this.BOARD_QUALITY_HIGH;
                this.triggerEventHandlers(['touchmove', 'move'], evt, this.mode);

                return false;
            } else {
                this.touchMoveLast = ti;
            }
        }

        if (this.mode != this.BOARD_MODE_DRAG) {
            this.renderer.hide(this.infobox);
        }

        this.options.precision.hasPoint = this.options.precision.touch;

        if (!this.touchOriginMove(evt)) {

            if (this.mode == this.BOARD_MODE_DRAG) {
                // Runs over through all elements which are touched
                // by at least one finger.
                for (i = 0; i < this.touches.length; i++) {
                    // Touch by one finger:  this is possible for all elements that can be dragged
                    if (this.touches[i].targets.length === 1) {
                        if (evtTouches[this.touches[i].targets[0].num]) {
                            this.touches[i].targets[0].X = evtTouches[this.touches[i].targets[0].num].screenX;
                            this.touches[i].targets[0].Y = evtTouches[this.touches[i].targets[0].num].screenY;
                            pos = this.getMousePosition(evt, this.touches[i].targets[0].num);
                            this.moveObject(pos[0], pos[1], this.touches[i], evt, 'touch');
                        }
                        // Touch by two fingers: moving lines
                    } else if (this.touches[i].targets.length === 2 && this.touches[i].targets[0].num > -1 && this.touches[i].targets[1].num > -1) {
                        if (evtTouches[this.touches[i].targets[0].num] && evtTouches[this.touches[i].targets[1].num]) {
                            this.touches[i].targets[0].X = evtTouches[this.touches[i].targets[0].num].screenX;
                            this.touches[i].targets[0].Y = evtTouches[this.touches[i].targets[0].num].screenY;
                            this.touches[i].targets[1].X = evtTouches[this.touches[i].targets[1].num].screenX;
                            this.touches[i].targets[1].Y = evtTouches[this.touches[i].targets[1].num].screenY;
                            this.twoFingerMove(
                                this.getMousePosition(evt, this.touches[i].targets[0].num),
                                this.getMousePosition(evt, this.touches[i].targets[1].num),
                                this.touches[i],
                                evt
                            );
                        }
                    }
                }
            }
        }

        if (this.mode != this.BOARD_MODE_DRAG) {
            this.renderer.hide(this.infobox);
        }

        this.options.precision.hasPoint = this.options.precision.mouse;
        this.triggerEventHandlers(['touchmove', 'move'], evt, this.mode);

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
            evtTouches = evt[JXG.touchProperty];

        this.triggerEventHandlers(['touchend', 'up'], evt);
        this.renderer.hide(this.infobox);

        if (evtTouches.length > 0) {
            for (i = 0; i < this.touches.length; i++) {
                tmpTouches[i] = this.touches[i];
            }
            this.touches.length = 0;

            // assuming only points can be moved
            // todo: don't run through the targettouches but through the touches and check if all touches.targets are still available
            // if not, try to convert the operation, e.g. if a lines is rotated and translated with two fingers and one finger is lifted,
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
                        if (Math.abs(Math.pow(evtTouches[k].screenX - tmpTouches[i].targets[j].X, 2) + Math.pow(evtTouches[k].screenY - tmpTouches[i].targets[j].Y, 2)) < eps*eps) {
                            tmpTouches[i].targets[j].found = true;
                            tmpTouches[i].targets[j].num = k;
                            tmpTouches[i].targets[j].X = evtTouches[k].screenX;
                            tmpTouches[i].targets[j].Y = evtTouches[k].screenY;
                            foundNumber++;
                            break;
                        }
                    }
                }

                if (JXG.isPoint(tmpTouches[i].obj)) {
                    found = (tmpTouches[i].targets[0] && tmpTouches[i].targets[0].found);
                } else if (tmpTouches[i].obj.elementClass === JXG.OBJECT_CLASS_LINE) {
                    found = (tmpTouches[i].targets[0] && tmpTouches[i].targets[0].found) || (tmpTouches[i].targets[1] && tmpTouches[i].targets[1].found);
                } else if (tmpTouches[i].obj.elementClass === JXG.OBJECT_CLASS_CIRCLE) {
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
                            this.touches[this.touches.length-1].targets.push({
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
                    delete this.highlightedObjects[tmpTouches[i].obj.id];
                    tmpTouches[i].obj.noHighlight();
                }
            }

        } else {
            this.touches.length = 0;
        }

        for (i = 0; i < this.downObjects.length; i++) {
            found = false;
            for (j = 0; j < this.touches.length; j++) {
                if (this.touches[j].obj.id == this.downObjects[i].id) {
                    found = true;
                }
            }
            if (!found) {
                this.downObjects[i].triggerEventHandlers(['touchup', 'up'], evt);
                this.downObjects[i].snapToGrid();
                this.downObjects.splice(i, 1);
            }
        }

        if (!evtTouches || evtTouches.length === 0) {
            JXG.removeEvent(document, 'touchend', this.touchEndListener, this);
            this.hasTouchEnd = false;

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
     * @param {Object} object If the object to be dragged is already known, it can be submitted via this parameter
     * @returns {Boolean} True if no element is found under the current mouse pointer, false otherwise.
     */
    mouseDownListener: function (evt, object) {
        var pos, elements, xy, result, i;

        // prevent accidental selection of text
        if (document.selection && typeof document.selection.empty == 'function') {
            document.selection.empty();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }

        if (!this.hasMouseUp) {
            JXG.addEvent(document, 'mouseup', this.mouseUpListener, this);
            this.hasMouseUp = true;
        }

        pos = this.getMousePosition(evt);

        if (object) {
            elements = [ object ];
            this.mode = this.BOARD_MODE_DRAG;
        } else
            elements = this.initMoveObject(pos[0], pos[1], evt, 'mouse');

        // if no draggable object can be found, get out here immediately
        if (elements.length == 0) {
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
                }
                ]
            };
            this.mouse.obj = elements[elements.length-1];

            this.dehighlightAll();
            this.highlightedObjects[this.mouse.obj.id] = this.mouse.obj;
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

        if (!object)
            this.triggerEventHandlers(['mousedown', 'down'], evt);

        return result;
    },

    /**
     * This method is called by the browser when the mouse button is released.
     * @param {Event} evt
     */
    mouseUpListener: function (evt) {
        var i;

        this.triggerEventHandlers(['mouseup', 'up'], evt);

        // redraw with high precision
        this.updateQuality = this.BOARD_QUALITY_HIGH;

        if (this.mouse && this.mouse.obj) {
            this.mouse.obj.snapToGrid();
        }

        this.originMoveEnd();
        this.dehighlightAll();
        this.update();

        for (i = 0; i < this.downObjects.length; i++) {
            this.downObjects[i].triggerEventHandlers(['mouseup', 'up'], evt);
        }

        this.downObjects.length = 0;

        if (this.hasMouseUp) {
            JXG.removeEvent(document, 'mouseup', this.mouseUpListener, this);
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

        if (this.mode != this.BOARD_MODE_DRAG) {
            this.dehighlightAll();
            this.renderer.hide(this.infobox);
        }

        // we have to check for three cases:
        //   * user moves origin
        //   * user drags an object
        //   * user just moves the mouse, here highlight all elements at
        //     the current mouse position

        if (!this.mouseOriginMove(evt)) {
            if (this.mode == this.BOARD_MODE_DRAG) {
                this.moveObject(pos[0], pos[1], this.mouse, evt, 'mouse');
            } else { // BOARD_MODE_NONE or BOARD_MODE_CONSTRUCT
                this.highlightElements(pos[0], pos[1], evt, -1);
            }
        }

        this.updateQuality = this.BOARD_QUALITY_HIGH;

        this.triggerEventHandlers(['mousemove', 'move'], evt, this.mode);
    },

    /**
     * Handler for mouse wheel events. Used to zoom in and out of the board.
     * @param {Event} evt
     * @returns {Boolean}
     */
    mouseWheelListener: function (evt) {
        if (!this.options.zoom.wheel || (this.options.zoom.needShift && !evt.shiftKey)) {
            return true;
        }

        evt = evt || window.event;
        var wd = evt.detail ? evt.detail*(-1) : evt.wheelDelta/40,
            pos = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getMousePosition(evt), this);

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
        if (el.elementClass == JXG.OBJECT_CLASS_POINT) {
            xc = el.coords.usrCoords[1];
            yc = el.coords.usrCoords[2];

            this.infobox.setCoords(xc+this.infobox.distanceX/(this.unitX),
                yc+this.infobox.distanceY/(this.unitY));
                
            if (typeof(el.infoboxText)!="string") {
                if (el.visProp.infoboxdigits==='auto') {
                    x = JXG.autoDigits(xc);
                    y = JXG.autoDigits(yc);
                } else if (JXG.isNumber(el.visProp.infoboxdigits)) {
                    x = xc.toFixed(el.visProp.infoboxdigits);
                    y = yc.toFixed(el.visProp.infoboxdigits);
                } else {
                    x = xc;
                    y = yc;
                }
                
                this.highlightInfobox(x,y,el);
            } else {
                this.highlightCustomInfobox(el.infoboxText, el);
            }

            this.renderer.show(this.infobox);
            //this.renderer.updateText(this.infobox);
        }
        return this;
    },

    /**
     * Changes the text of the info box to what is provided via text.
     * @param {String} text
     * @returns {JXG.Board} Reference to the board.
     */
    highlightCustomInfobox: function (text) {
        //this.infobox.setText('<span style="color:#bbbbbb;">' + text + '<'+'/span>');
        this.infobox.setText(text);
        return this;
    },

    /**
     * Changes the text of the info box to show the given coordinates.
     * @param {Number} x
     * @param {Number} y
     * @param {JXG.Point} el The element the mouse is pointing at
     * @returns {JXG.Board} Reference to the board.
     */
    highlightInfobox: function (x, y, el) {
        this.highlightCustomInfobox('(' + x + ', ' + y + ')');
        return this;
    },

    /**
     * Remove highlighting of all elements.
     * @returns {JXG.Board} Reference to the board.
     */
    dehighlightAll: function () {
        var el, pEl, needsDehighlight = false;

        for (el in this.highlightedObjects) {
            pEl = this.highlightedObjects[el];

            if (this.hasMouseHandlers)
                pEl.noHighlight();

            needsDehighlight = true;

            // In highlightedObjects should only be objects which fulfill all these conditions
            // And in case of complex elements, like a turtle based fractal, it should be faster to
            // just de-highlight the element instead of checking hasPoint...
            // if ((!JXG.exists(pEl.hasPoint)) || !pEl.hasPoint(x, y) || !pEl.visProp.visible)
        }

        this.highlightedObjects = {};

        // We do not need to redraw during dehighlighting in CanvasRenderer
        // because we are redrawing anyhow
        //  -- We do need to redraw during dehighlighting. Otherwise objects won't be dehighlighted until
        // another object is highlighted.
        if (this.options.renderer=='canvas' && needsDehighlight) {
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
            absPos = JXG.getPosition(evt),
            x = absPos[0]-cPos[0],
            y = absPos[1]-cPos[1],
            newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);

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
            absPos = JXG.getPosition(evt),
            dx = absPos[0]-cPos[0],
            dy = absPos[1]-cPos[1],
            elList = [],
            el, pEl, len = this.objectsList.length;

        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            if (pEl.visProp.visible && pEl.hasPoint && pEl.hasPoint(dx, dy)) {
                elList[elList.length] = pEl;
            }
        }

        return elList;
    },

    /**
     * Moves the origin and initializes an update of all elements.
     * @param {Number} x
     * @param {Number} y
     * @param {Boolean} [diff=false]
     * @returns {JXG.Board} Reference to this board.
     */
    moveOrigin: function (x, y, diff) {
        var el, ob, len = this.objectsList.length;

        if (JXG.exists(x) && JXG.exists(y)) {
            this.origin.scrCoords[1] = x;
            this.origin.scrCoords[2] = y;

            if (diff) {
                this.origin.scrCoords[1] -= this.drag_dx;
                this.origin.scrCoords[2] -= this.drag_dy;
            }
        }

        for (ob = 0; ob < len; ob++) {
            el = this.objectsList[ob];
            if (!el.visProp.frozen && (el.elementClass==JXG.OBJECT_CLASS_POINT ||
                el.elementClass==JXG.OBJECT_CLASS_CURVE ||
                el.type==JXG.OBJECT_TYPE_AXIS ||
                el.type==JXG.OBJECT_TYPE_TEXT)) {
                if (el.elementClass!=JXG.OBJECT_CLASS_CURVE && el.type!=JXG.OBJECT_TYPE_AXIS) {
                    el.coords.usr2screen();
                }
            }
        }

        this.clearTraces();
        this.fullUpdate();

        return this;
    },

    /**
     * Add conditional updates to the elements.
     * @param {String} str String containing coniditional update in geonext syntax
     */
    addConditions: function (str) {
        var plaintext = 'var el, x, y, c, rgbo;\n',
            i = str.indexOf('<data>'),
            j = str.indexOf('<'+'/data>'),
            term, m, left, right, name, el;

        if (i<0) {
            return;
        }

        while (i>=0) {
            term = str.slice(i+6,j);   // throw away <data>
            m = term.indexOf('=');
            left = term.slice(0,m);
            right = term.slice(m+1);
            m = left.indexOf('.');     // Dies erzeugt Probleme bei Variablennamen der Form " Steuern akt."
            name = left.slice(0,m);    //.replace(/\s+$/,''); // do NOT cut out name (with whitespace)
            el = this.elementsByName[JXG.unescapeHTML(name)];

            var property = left.slice(m+1).replace(/\s+/g,'').toLowerCase(); // remove whitespace in property
            right = JXG.GeonextParser.geonext2JS(right, this);
            right = right.replace(/this\.board\./g,'this.');

            // Debug
            if (!JXG.exists(this.elementsByName[name])){
                JXG.debug("debug conditions: |"+name+"| undefined");
            }
            plaintext += "el = this.objects[\"" + el.id + "\"];\n";

            switch (property) {
                case 'x':
                    plaintext += 'var y=el.coords.usrCoords[2];\n';  // y stays
                    plaintext += 'el.setPositionDirectly(JXG.COORDS_BY_USER,['+(right) +',y]);\n';
                    plaintext += 'el.prepareUpdate().update();\n';
                    break;
                case 'y':
                    plaintext += 'var x=el.coords.usrCoords[1];\n';  // x stays
                    plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,[x,'+(right)+'],this);\n';
                    plaintext += 'el.setPositionDirectly(JXG.COORDS_BY_USER,[x,'+(right) +']);\n';
                    plaintext += 'el.prepareUpdate().update();\n';
                    break;
                case 'visible':
                    plaintext += 'var c='+(right)+';\n';
                    plaintext += 'el.visProp.visible = c;\n';
                    plaintext += 'if (c) {el.showElement();} else {el.hideElement();}\n';
                    break;
                case 'position':
                    plaintext += 'el.position = ' + (right) +';\n';
                    plaintext += 'el.prepareUpdate().update(true);\n';
                    break;
                case 'stroke':
                    plaintext += 'rgbo = JXG.rgba2rgbo('+(right)+');\n';
                    plaintext += 'el.visProp.strokecolor = rgbo[0];\n';
                    plaintext += 'el.visProp.strokeopacity = rgbo[1];\n';
                    break;
                case 'style':
                    plaintext += 'el.setStyle(' + (right) +');\n';
                    break;
                case 'strokewidth':
                    plaintext += 'el.strokeWidth = ' + (right) +';\n';   // wird auch bei Punkten verwendet, was nicht realisiert ist.
                    break;
                case 'fill':
                    plaintext += 'var rgbo = JXG.rgba2rgbo('+(right)+');\n';
                    plaintext += 'el.visProp.fillcolor = rgbo[0];\n';
                    plaintext += 'el.visProp.fillopacity = rgbo[1];\n';
                    break;
                case 'label':
                    break;
                default:
                    JXG.debug("property '" + property + "' in conditions not yet implemented:" + right);
                    break;
            }
            str = str.slice(j+7); // cut off "</data>"
            i = str.indexOf('<data>');
            j = str.indexOf('<'+'/data>');
        }
        plaintext += 'this.prepareUpdate().updateElements();\n';
        plaintext += 'return true;\n';

        plaintext = plaintext.replace(/&lt;/g, "<");
        plaintext = plaintext.replace(/&gt;/g, ">");
        plaintext = plaintext.replace(/&amp;/g, "&");

        this.updateConditions = new Function(plaintext);
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
        var p1 = new JXG.Coords(JXG.COORDS_BY_USER, [0, 0], this),
            p2 = new JXG.Coords(JXG.COORDS_BY_USER, [this.options.grid.gridX, this.options.grid.gridY], this),
            x = p1.scrCoords[1]-p2.scrCoords[1],
            y = p1.scrCoords[2]-p2.scrCoords[2];

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
        var el, ob, len = this.objectsList.length;

        for (ob = 0; ob < len; ob++) {
            el = this.objectsList[ob];
            if (!el.visProp.frozen
                 && (el.elementClass==JXG.OBJECT_CLASS_POINT
                 || el.elementClass==JXG.OBJECT_CLASS_CURVE
                 || el.type==JXG.OBJECT_TYPE_AXIS
                 || el.type==JXG.OBJECT_TYPE_TEXT)) {
                
                if (el.elementClass!=JXG.OBJECT_CLASS_CURVE 
                    && el.type!=JXG.OBJECT_TYPE_AXIS) {
                    el.coords.usr2screen();
                }
            }
        }
        this.calculateSnapSizes();
        this.clearTraces();
        this.fullUpdate();

        return this;
    },

    /**
     * Zooms into the board by the factors board.options.zoom.factorX and board.options.zoom.factorY and applies the zoom.
     * @returns {JXG.Board} Reference to the board
     */
    zoomIn: function (x, y) {
        var bb = this.getBoundingBox(),
            zX = this.options.zoom.factorX,
            zY = this.options.zoom.factorY,
            dX = (bb[2]-bb[0])*(1.0-1.0/zX),
            dY = (bb[1]-bb[3])*(1.0-1.0/zY),
            lr = 0.5, tr = 0.5;

        if (typeof x === 'number' && typeof y === 'number') {
            lr = (x - bb[0])/(bb[2] - bb[0]);
            tr = (bb[1] - y)/(bb[1] - bb[3]);
        }

        this.setBoundingBox([bb[0]+dX*lr, bb[1]-dY*tr, bb[2]-dX*(1-lr), bb[3]+dY*(1-tr)], false);
        this.zoomX *= zX;
        this.zoomY *= zY;
        this.applyZoom();

        return this;
    },

    /**
     * Zooms out of the board by the factors board.options.zoom.factorX and board.options.zoom.factorY and applies the zoom.
     * @returns {JXG.Board} Reference to the board
     */
    zoomOut: function (x, y) {
        var bb = this.getBoundingBox(),
            zX = this.options.zoom.factorX,
            zY = this.options.zoom.factorY,
            dX = (bb[2]-bb[0])*(1.0-zX),
            dY = (bb[1]-bb[3])*(1.0-zY),
            lr = 0.5, tr = 0.5;

        if (this.zoomX < JXG.Options.zoom.eps || this.zoomY < JXG.Options.zoom.eps)
            return this;

        if (typeof x === 'number' && typeof y === 'number') {
            lr = (x - bb[0])/(bb[2] - bb[0]);
            tr = (bb[1] - y)/(bb[1] - bb[3]);
        }

        this.setBoundingBox([bb[0]+dX*lr, bb[1]-dY*tr, bb[2]-dX*(1-lr), bb[3]+dY*(1-tr)], false);
        this.zoomX /= zX;
        this.zoomY /= zY;

        this.applyZoom();
        return this;
    },

    /**
     * Resets zoom factor to 100%.
     * @returns {JXG.Board} Reference to the board
     */
    zoom100: function () {
        var bb = this.getBoundingBox(),
            dX = (bb[2]-bb[0])*(1.0-this.zoomX)*0.5,
            dY = (bb[1]-bb[3])*(1.0-this.zoomY)*0.5;

        this.setBoundingBox([bb[0]+dX, bb[1]-dY, bb[2]-dX, bb[3]+dY], false);
        this.zoomX = 1.0;
        this.zoomY = 1.0;
        this.applyZoom();
        return this;
    },

    /**
     * Zooms the board so every visible point is shown. Keeps aspect ratio.
     * @returns {JXG.Board} Reference to the board
     */
    zoomAllPoints: function () {
        var minX = 0, // (0,0) shall be visible, too
            maxX = 0,
            minY = 0,
            maxY = 0,
            el, border, borderX, borderY, len = this.objectsList.length, pEl;

        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            if (JXG.isPoint(pEl) && pEl.visProp.visible) {
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
        borderX = border/(this.unitX);
        borderY = border/(this.unitY);

        this.zoomX = 1.0;
        this.zoomY = 1.0;

        this.setBoundingBox([minX-borderX, maxY+borderY, maxX+borderX, minY-borderY], true);

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

        if (!JXG.isArray(elements) || elements.length === 0) {
            return this;
        }

        for (i = 0; i < elements.length; i++) {
            e = JXG.getRef(this, elements[i]);

            box = e.bounds();
            if (JXG.isArray(box)) {
                if (JXG.isArray(newBBox)) {
                    for (j = 0; j < 4; j++) {
                        if (dir[j]*box[j] < dir[j]*newBBox[j]) {
                            newBBox[j] = box[j];
                        }
                    }
                } else {
                    newBBox = box;
                }
            }
        }

        if (JXG.isArray(newBBox)) {
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
        var oX = this.options.zoom.factorX, oY = this.options.zoom.factorY;

        this.options.zoom.factorX = fX/this.zoomX;
        this.options.zoom.factorY = fY/this.zoomY;

        this.zoomIn();

        this.options.zoom.factorX = oX;
        this.options.zoom.factorY = oY;

        return this;
    },

    /**
     * Removes object from board and renderer.
     * @param {JXG.GeometryElement} object The object to remove.
     * @returns {JXG.Board} Reference to the board
     */
    removeObject: function (object) {
        var el, i;

        if (JXG.isArray(object)) {
            for (i=0; i<object.length; i++) {
                this.removeObject(object[i]);
            }

            return this;
        }

        object = JXG.getReference(this, object);

        // If the object which is about to be removed unknown, do nothing.
        if (!JXG.exists(object)) {
            return this;
        }

        try {
            // remove all children.
            for (el in object.childElements) {
                object.childElements[el].board.removeObject(object.childElements[el]);
            }

            for (el in this.objects) {
                if (JXG.exists(this.objects[el].childElements)) {
                    delete(this.objects[el].childElements[object.id]);
                    delete(this.objects[el].descendants[object.id]);
                }
            }

            // remove the object itself from our control structures
            if (object._pos > -1) {
                this.objectsList.splice(object._pos, 1);
                for (el = object._pos; el < this.objectsList.length; el++) {
                    this.objectsList[el]._pos--;
                }
            } else {
                JXG.debug('object ' + object.id + ' not found in list.');
            }
            delete(this.objects[object.id]);
            delete(this.elementsByName[object.name]);

            if (object.visProp && object.visProp.trace) {
                object.clearTrace();
            }

            // the object deletion itself is handled by the object.
            if (JXG.exists(object.remove)) object.remove();
        } catch(e) {
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
        for (var anc in object.ancestors)
            this.removeAncestors(object.ancestors[anc]);
        this.removeObject(object);

        return this;
    },

    /**
     * Initialize some objects which are contained in every GEONExT construction by default,
     * but are not contained in the gxt files.
     * @returns {JXG.Board} Reference to the board
     */
    initGeonextBoard: function () {
        var p1, p2, p3, l1, l2;

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

        l1 = this.create('line', [p1, p2], {
            id: this.id + 'gXLe0',
            name: 'X-Achse',
            withLabel: false,
            visible: false
        });

        l2 = this.create('line', [p1, p3], {
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
        var  attr = JXG.copyAttributes({}, this.options, 'infobox');

        attr.id = this.id + '_infobox';

        this.infobox = this.create('text', [0, 0, '0,0'], attr);

        this.infobox.distanceX = -20;
        this.infobox.distanceY = 25;
        this.infobox.needsUpdateSize = false;  // That is not true, but it speeds drawing up.

        this.infobox.dump = false;

        this.renderer.hide(this.infobox);
        return this;
    },

    /**
     * Change the height and width of the board's container.
     * @param {Number} canvasWidth New width of the container.
     * @param {Number} canvasHeight New height of the container.
     * @returns {JXG.Board} Reference to the board
     */
    resizeContainer: function (canvasWidth, canvasHeight) {
        this.canvasWidth = parseFloat(canvasWidth);
        this.canvasHeight = parseFloat(canvasHeight);
        this.containerObj.style.width = (this.canvasWidth) + 'px';
        this.containerObj.style.height = (this.canvasHeight) + 'px';

        this.renderer.resize(this.canvasWidth, this.canvasHeight);

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
            i = 0;
            for (c in this.objects[el].childElements) {
                i++;
            }
            if (i>=0) {
                t += '<b>' + this.objects[el].id + ':<'+'/b> ';
            }
            for (c in this.objects[el].childElements) {
                t += this.objects[el].childElements[c].id+'('+this.objects[el].childElements[c].name+')'+', ';
            }
            t += '<p>\n';
        }
        t += '<'+'/p>\n';
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
        f.document.write('<pre>'+JXG.escapeHTML(this.xmlString)+'<'+'/pre>');
        f.document.close();
        return this;
    },

    /**
     * Sets for all objects the needsUpdate flag to "true".
     * @returns {JXG.Board} Reference to the board
     */
    prepareUpdate: function () {
        var el, pEl, len = this.objectsList.length;

        for (el = 0; el < len; el++) {
            pEl = this.objectsList[el];
            pEl.needsUpdate = pEl.needsRegularUpdate || this.needsFullUpdate;
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

        drag = JXG.getRef(this, drag);

        for (el = 0; el < this.objectsList.length; el++) {
            pEl = this.objectsList[el];
            // For updates of an element we distinguish if the dragged element is updated or
            // other elements are updated.
            // The difference lies in the treatment of gliders.
            pEl.update(!JXG.exists(drag) || pEl.id !== drag.id);
        }

        return this;
    },

    /**
     * Runs through all elements and calls their update() method.
     * @param {JXG.GeometryElement} drag Element that caused the update.
     * @returns {JXG.Board} Reference to the board
     */
    updateRenderer: function (drag) {
        var el, pEl, len = this.objectsList.length;

        if (this.options.renderer=='canvas') {
            this.updateRendererCanvas(drag);
        } else {
            for (el = 0; el < len; el++) {
                pEl = this.objectsList[el];
                //if ( !this.needsFullUpdate && (/*isBeforeDrag ||*/ !pEl.needsRegularUpdate) ) { continue; }
                pEl.updateRenderer();
            }
        }
        return this;
    },

    /**
     * Runs through all elements and calls their update() method.
     * This is a special version for the CanvasRenderer.
     * Here, we have to do our own layer handling.
     * @param {JXG.GeometryElement} drag Element that caused the update.
     * @returns {JXG.Board} Reference to the board
     */
    updateRendererCanvas: function (drag) {
        var el, pEl, i, olen = this.objectsList.length,
            layers = this.options.layer,
            len = this.options.layer.numlayers,
            last = Number.NEGATIVE_INFINITY, mini, la;

        for (i=0;i<len;i++) {
            mini = Number.POSITIVE_INFINITY;
            for (la in layers) {
                if (layers[la]>last && layers[la]<mini) {
                    mini = layers[la];
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
        m = JXG.def(m, 'update');

        context = JXG.def(context, this);

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
        arguments[0] = JXG.def(arguments[0], 'update');
        this.triggerEventHandlers.apply(this, arguments);

        return this;
    },

    /**
     * Adds a dependent board to this board.
     * @param {JXG.Board} board A reference to board which will be updated after an update of this board occured.
     * @returns {JXG.Board} Reference to the board
     */
    addChild: function (board) {
        if (board!==null && JXG.exists(board.containerObj)) {
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
        for (i=this.dependentBoards.length-1; i>=0; i--) {
            if (this.dependentBoards[i] == board) {
                this.dependentBoards.splice(i,1);
            }
        }
        return this;
    },

    /**
     * Runs through most elements and calls their update() method and update the conditions.
     * @param {Object} [drag] Element that caused the update.
     * @returns {JXG.Board} Reference to the board
     */
    update: function (drag) {
        var i, len, boardId, b;

        if (this.inUpdate || this.isSuspendedUpdate) {
            return this;
        }
        this.inUpdate = true;

        this.prepareUpdate(drag).updateElements(drag).updateConditions();
        this.renderer.suspendRedraw(this);
        this.updateRenderer(drag);
        this.renderer.unsuspendRedraw();
        this.triggerEventHandlers('update');

        // To resolve dependencies between boards
        //for (var board in JXG.JSXGraph.boards) {
        len = this.dependentBoards.length;
        for (i=0; i<len; i++) {
            // boardId = this.dependentBoards[i].id;
            // b = JXG.JSXGraph.boards[boardId];
            b = this.dependentBoards[i];
            if ( b != this) {
                b.updateQuality = this.updateQuality;
                b.prepareUpdate().updateElements().updateConditions();
                b.renderer.suspendRedraw();
                b.updateRenderer();
                b.renderer.unsuspendRedraw();
                b.triggerEventHandlers('update');
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

        if (!JXG.exists(parents)) {
            parents = [];
        }

        if (!JXG.exists(attributes)) {
            attributes = {};
        }

        for (i = 0; i < parents.length; i++) {
            if (elementType != 'text' || i!=2) {
                parents[i] = JXG.getReference(this, parents[i]);
            }
        }

        if (JXG.JSXGraph.elements[elementType] != null) {
            if (typeof JXG.JSXGraph.elements[elementType] == 'function') {
                el = JXG.JSXGraph.elements[elementType](this, parents, attributes);
            } else {
                el = JXG.JSXGraph.elements[elementType].creator(this, parents, attributes);
            }
        } else {
            throw new Error("JSXGraph: JXG.createElement: Unknown element type given: " + elementType);
        }

        if (!JXG.exists(el)) {
            JXG.debug("JSXGraph: JXG.createElement: failure creating " + elementType);
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

        for (el = 0; el < this.objectsList.length; el++)
            this.objectsList[el].clearTrace();

        this.numTraces = 0;
        return this;
    },

    /**
     * Stop updates of the board.
     * @returns {JXG.Board} Reference to the board
     */
    suspendUpdate: function () {
        this.isSuspendedUpdate = true;
        return this;
    },

    /**
     * Enable updates of the board.
     * @returns {JXG.Board} Reference to the board
     */
    unsuspendUpdate: function () {
        this.isSuspendedUpdate = false;
        this.update();
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
        if (!JXG.isArray(bbox)) {
            return this;
        }

        var h, w,
            dim = JXG.getDimensions(this.container);
        
        this.plainBB = bbox;

        this.canvasWidth = parseInt(dim.width);
        this.canvasHeight = parseInt(dim.height);
        w = this.canvasWidth;
        h = this.canvasHeight;
        if (keepaspectratio) {
            this.unitX = w/(bbox[2]-bbox[0]);
            this.unitY = h/(bbox[1]-bbox[3]);
            if (Math.abs(this.unitX)<Math.abs(this.unitY)) {
                this.unitY = Math.abs(this.unitX)*this.unitY/Math.abs(this.unitY);
            } else {
                this.unitX = Math.abs(this.unitY)*this.unitX/Math.abs(this.unitX);
            }
        } else {
            this.unitX = w/(bbox[2]-bbox[0]);
            this.unitY = h/(bbox[1]-bbox[3]);
        }

        this.moveOrigin(-this.unitX*bbox[0], this.unitY*bbox[1]);
        return this;
    },

    /**
     * Get the bounding box of the board.
     * @returns {Array} bounding box [x1,y1,x2,y2] upper left corner, lower right corner
     */
    getBoundingBox: function () {
        var ul = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0], this),
            lr = new JXG.Coords(JXG.COORDS_BY_SCREEN, [this.canvasWidth, this.canvasHeight], this);
        return [ul.usrCoords[1],ul.usrCoords[2],lr.usrCoords[1],lr.usrCoords[2]];
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
            this.animationIntervalCode = setInterval(function () {
                JXG.JSXGraph.boards[that.id].animate();
            }, element.board.options.animationDelay);
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
            if (this.animationObjects[el] === null)
                continue;

            this.animationObjects[el] = null;
            delete(this.animationObjects[el]);
        }

        clearInterval(this.animationIntervalCode);
        delete(this.animationIntervalCode);

        return this;
    },

    /**
     * General purpose animation function. This currently only supports moving points from one place to another. This
     * is faster than managing the animation per point, especially if there is more than one animated point at the same time.
     * @returns {JXG.Board} Reference to the board
     */
    animate: function () {
        var count = 0,
            el, o, newCoords, r, p, c,
            obj=null, cbtmp;

        for (el in this.animationObjects) {
            if (this.animationObjects[el] === null)
                continue;

            count++;
            o = this.animationObjects[el];
            if (o.animationPath) {
                if (JXG.isFunction (o.animationPath)) {
                    newCoords = o.animationPath(new Date().getTime() - o.animationStart);
                } else {
                    newCoords = o.animationPath.pop();
                }

                if ((!JXG.exists(newCoords)) || (!JXG.isArray(newCoords) && isNaN(newCoords))) {
                    delete(o.animationPath);
                } else {
                    //o.setPositionByTransform(JXG.COORDS_BY_USER, [newCoords[0] - o.coords.usrCoords[1], newCoords[1] - o.coords.usrCoords[2]]);
                    o.setPositionDirectly(JXG.COORDS_BY_USER, newCoords);
                    //this.update(o);  // May slow down the animation, but is important
                    // for dependent glider objects (see tangram.html).
                    // Otherwise the intended projection may be incorrect.
                    o.prepareUpdate().update().updateRenderer();
                    obj = o;
                }
            }
            if (o.animationData) {
                c = 0;
                for (r in o.animationData) {
                    p = o.animationData[r].pop();
                    if (!JXG.exists(p)) {
                        delete(o.animationData[p]);
                    } else {
                        c++;
                        o.setProperty(r + ':' + p);
                    }
                }
                if (c==0)
                    delete(o.animationData);
            }

            if (!JXG.exists(o.animationData) && !JXG.exists(o.animationPath)) {
                this.animationObjects[el] = null;
                delete(this.animationObjects[el]);
                if (JXG.exists(o.animationCallback)) {
                    cbtmp = o.animationCallback;
                    o.animationCallback = null;
                    cbtmp();
                }
            }
        }

        if (count == 0) {
            clearInterval(this.animationIntervalCode);
            delete(this.animationIntervalCode);
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
     * @returns {JXG.Board} Reference to the board
     */
    migratePoint: function(src, dest) {
        var child, childId, prop, found, i;

        src = JXG.getRef(this, src);
        dest = JXG.getRef(this, dest);

        for (childId in src.childElements) {
            child = src.childElements[childId];

            found = false;
            for  (prop in child) {
                if (child[prop] ===  src) {
                    child[prop] = dest;
                    found = true;
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
            //child.prepareUpdate().update().updateRenderer();
        }
        this.removeObject(src);
        this.update();
        return this;
    },

    /**
     * Initializes color blindness simulation.
     * @param {String} deficiency Describes the color blindness deficiency which is simulated. Accepted values are 'protanopia', 'deuteranopia', and 'tritanopia'.
     * @returns {JXG.Board} Reference to the board
     */
    emulateColorblindness: function (deficiency) {
        var e, o, brd=this;

        if (!JXG.exists(deficiency))
            deficiency = 'none';

        if (this.currentCBDef == deficiency)
            return this;

        for (e in brd.objects) {
            o = brd.objects[e];
            if (deficiency != 'none') {
                if (this.currentCBDef == 'none') {
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
                o.setProperty({
                    strokecolor: JXG.rgb2cb(o.visPropOriginal.strokecolor, deficiency),
                    fillcolor: JXG.rgb2cb(o.visPropOriginal.fillcolor, deficiency),
                    highlightstrokecolor: JXG.rgb2cb(o.visPropOriginal.highlightstrokecolor, deficiency),
                    highlightfillcolor: JXG.rgb2cb(o.visPropOriginal.highlightfillcolor, deficiency)
                });
            } else if (JXG.exists(o.visPropOriginal)) {
                JXG.extend(o.visProp, o.visPropOriginal);
            }
        }
        this.currentCBDef = deficiency;
        this.update();

        return this;
    },
    
    /**
     * TODO
     */
    updateCSSTransforms: function () {
        var obj = this.containerObj,
            o = obj,
            o2 = obj;

        this.cssTransMat = JXG.getCSSTransformMatrix(o);

        /*
         * In Mozilla and Webkit: offsetParent seems to jump at least to the next iframe,
         * if not to the body. In IE and if we are in an position:absolute environment 
         * offsetParent walks up the DOM hierarchy.
         * In order to walk up the DOM hierarchy also in Mozilla and Webkit
         * we need the parentNode steps.
         */
        while (o=o.offsetParent) {
            this.cssTransMat = JXG.Math.matMatMult(JXG.getCSSTransformMatrix(o), this.cssTransMat);
            
            o2 = o2.parentNode;
            while (o2!=o) {
                this.cssTransMat = JXG.Math.matMatMult(JXG.getCSSTransformMatrix(o), this.cssTransMat);
                o2 = o2.parentNode;
            }

        }
        this.cssTransMat = JXG.Math.inverse(this.cssTransMat);

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
    __evt__: function (e) { },

    /**
     * @event
     * @description Whenever the user starts to click on the board.
     * @name JXG.Board#mousedown
     * @param {Event} e The browser's event object.
     */
    __evt__: function (e) { },

    /**
     * @event
     * @description Whenever the user starts to touch the board.
     * @name JXG.Board#touchstart
     * @param {Event} e The browser's event object.
     */
    __evt__: function (e) { },

    /**
     * @event
     * @description Whenever the user stops to touch or click the board.
     * @name JXG.Board#up
     * @param {Event} e The browser's event object.
     */
    __evt__: function (e) { },

    /**
     * @event
     * @description Whenever the user releases the mousebutton over the board.
     * @name JXG.Board#mouseup
     * @param {Event} e The browser's event object.
     */
    __evt__: function (e) { },

    /**
     * @event
     * @description Whenever the user stops touching the board.
     * @name JXG.Board#touchend
     * @param {Event} e The browser's event object.
     */
    __evt__: function (e) { },
    
    /**
     * @event
     * @description This event is fired whenever the user is moving the finger or mouse pointer over the board.
     * @name JXG.Board#move
     * @param {Event} e The browser's event object.
     * @param {Number} mode The mode the board currently is in
     * @see {JXG.Board#mode}
     */
    __evt__: function (e, mode) { },

    /**
     * @event
     * @description This event is fired whenever the user is moving the mouse over the board.
     * @name JXG.Board#mousemove
     * @param {Event} e The browser's event object.
     * @param {Number} mode The mode the board currently is in
     * @see {JXG.Board#mode}
     */
    __evt__: function (e, mode) { },
    
    /**
     * @event
     * @description This event is fired whenever the user is moving the finger over the board.
     * @name JXG.Board#touchmove
     * @param {Event} e The browser's event object.
     * @param {Number} mode The mode the board currently is in
     * @see {JXG.Board#mode}
     */
    __evt__: function (e, mode) { },

    /**
     * @event
     * @description Whenever an element is highlighted this event is fired.
     * @name JXG.Board#hit
     * @param {Event} e The browser's event object.
     * @param {JXG.GeoemtryElement} el The hit element.
     * @param {%} target ?
     */
    __evt__: function (e, el, target) { },

    /**
     * @event
     * @description Whenever an element is highlighted this event is fired.
     * @name JXG.Board#mousehit
     * @param {Event} e The browser's event object.
     * @param {JXG.GeoemtryElement} el The hit element.
     * @param {%} target ?
     */
    __evt__: function (e, el, target) { },
    
    /**
     * @event
     * @description This board is updated.
     * @name JXG.Board#update
     */
    __evt__: function () { },

    /**
     * @ignore
     */
    __evt__: function () {},
        
    //endregion

    /**
     * Return all elements that somehow depend on the element <tt>root</tt> and satisfy one of the <tt>filter</tt> rules.
     * <tt>filters</tt> are objects which's properties are compared to every element found in the dependency tree.
     * @param {JXG.GeometryElement} root Dependency tree root element
     * @param {Object} filters An arbitrary amount of objects which define filters for the elements to return. Only elements
     * that fulfill at least one filter are returned. The comparison is a direct comparison, i.e. nested objects won't be
     * compared.
     * @example
     * // This will return only points
     * var partPoints = board.getPartialConstruction(p, {elementClass: JXG.OBJECT_CLASS_POINT});
     *
     * // This will return only points and lines
     * var partPointsLines = board.getPartialConstruction(p, {elementClass: JXG.OBJECT_CLASS_POINT}, {elementClass: JXG.OBJECT_CLASS_LINE});
     */
    getPartialConstruction: function (root) {
        var filters, i;

        for (i = 1; i < arguments.length; i++) {
            filters.push(arguments[i]);
        }
    },

    /**
     * Function to animate a curve rolling on another curve.
     * @param {Curve} c1 JSXGraph curve building the floor where c2 rolls
     * @param {Curve} c2 JSXGraph curve which rolls on c1.
     * @param {number} start_c1 The parameter t such that c1(t) touches c2. This is the start position of the
     *                          rolling process
     * @param {Number} stepsize Increase in t in each step for the curve c1
     * @param {Number} time Delay time for setInterval()
     * @returns {Array} pointlist Array of points which are rolled in each step. This list should contain
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
     *
     */
    createRoulette: function (c1, c2, start_c1, stepsize, direction, time, pointlist) {
        var brd = this;
        var Roulette = function () {
            var alpha = 0, Tx = 0, Ty = 0,
                t1 = start_c1,
                t2 = JXG.Math.Numerics.root(
                    function (t) {
                        var c1x = c1.X(t1),
                            c1y = c1.Y(t1),
                            c2x = c2.X(t),
                            c2y = c2.Y(t);
                        return (c1x-c2x)*(c1x-c2x) + (c1y-c2y)*(c1y-c2y);
                    },
                    [0,Math.PI*2]),
                t1_new = 0.0, t2_new = 0.0,
                c1dist,
                rotation = brd.create('transform',[function (){ return alpha;}], {type:'rotate'}),
                rotationLocal = brd.create('transform',[function (){ return alpha;},
                    function (){ return c1.X(t1);},
                    function (){ return c1.Y(t1);}],
                {type:'rotate'}),
                translate = brd.create('transform',[function (){ return Tx;}, function (){ return Ty;}], {type:'translate'}),

                //
                // arc length via Simpson's rule.
                arclen = function (c,a,b) {
                    var cpxa = JXG.Math.Numerics.D(c.X)(a), cpya = JXG.Math.Numerics.D(c.Y)(a),
                        cpxb = JXG.Math.Numerics.D(c.X)(b), cpyb = JXG.Math.Numerics.D(c.Y)(b),
                        cpxab = JXG.Math.Numerics.D(c.X)((a+b)*0.5), cpyab = JXG.Math.Numerics.D(c.Y)((a+b)*0.5),
                        fa = Math.sqrt(cpxa*cpxa+cpya*cpya),
                        fb = Math.sqrt(cpxb*cpxb+cpyb*cpyb),
                        fab = Math.sqrt(cpxab*cpxab+cpyab*cpyab);
                    return (fa+4*fab+fb)*(b-a)/6.0;
                },
                exactDist = function (t) {
                    return c1dist - arclen(c2,t2,t);
                },
                beta = Math.PI/18.0,
                beta9 = beta*9,
                interval = null;

            this.rolling = function (){
                t1_new = t1+direction*stepsize;
                c1dist = arclen(c1,t1,t1_new);             // arc length between c1(t1) and c1(t1_new)
                t2_new = JXG.Math.Numerics.root(exactDist, t2);
                // find t2_new such that arc length between c2(t2) and c1(t2_new)
                // equals c1dist.

                var h = new JXG.Complex(c1.X(t1_new),c1.Y(t1_new));    // c1(t) as complex number
                var g = new JXG.Complex(c2.X(t2_new),c2.Y(t2_new));    // c2(t) as complex number
                var hp = new JXG.Complex(JXG.Math.Numerics.D(c1.X)(t1_new),JXG.Math.Numerics.D(c1.Y)(t1_new));
                var gp = new JXG.Complex(JXG.Math.Numerics.D(c2.X)(t2_new),JXG.Math.Numerics.D(c2.Y)(t2_new));
                var z = JXG.C.div(hp,gp);                  // z is angle between the tangents of
                // c1 at t1_new, and c2 at t2_new
                alpha = Math.atan2(z.imaginary, z.real);
                z.div(JXG.C.abs(z));                       // Normalizing the quotient
                z.mult(g);
                Tx = h.real-z.real;
                Ty = h.imaginary-z.imaginary;              // T = h(t1_new)-g(t2_new)*h'(t1_new)/g'(t2_new);

                if (alpha <-beta && alpha>-beta9) {        // -(10-90) degrees: make corners roll smoothly
                    alpha = -beta;
                    rotationLocal.applyOnce(pointlist);
                } else if (alpha>beta && alpha<beta9) {
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
                if (time>0) {
                    interval = setInterval(this.rolling, time);
                }
                return this;
            };

            this.stop = function () {
                clearInterval(interval);
                return this;
            };
            return this;
        };
        return new Roulette();
    }
});
