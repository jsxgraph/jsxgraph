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
     * drag_obj is updated on mouse movement.
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

    // TODO: Do we still need the CONSTRUCTIOIN_TYPE_* properties?!?
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
    this.containerObj = document.getElementById(this.container);
    if (this.containerObj==null) {
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
     * Zoom factor in X direction
     * @type Number
     */
    this.zoomX = zoomX;

    /**
     * Zoom factor in Y direction.
     * @type Number
     */
    this.zoomY = zoomY;

    /**
     * The number of pixels which represent one unit in user-coordinates in x direction.
     * @type Number
     */
    this.unitX = unitX;

    /**
     * The number of pixels which represent one unit in user-coordinates in y direction.
     * @type Number
     */
    this.unitY = unitY;

    /**
     * stretchX is the product of zoomX and unitX. This is basically to save some multiplications.
     * @type Number
     */
    this.stretchX = this.zoomX*this.unitX;

    /**
     * stretchY is the product of zoomY and unitY. This is basically to save some multiplications.
     * @type Number
     */
    this.stretchY = this.zoomY*this.unitY;

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
    if (JXG.exists(id) && id !== '' && !JXG.exists(document.getElementById(id))) {
        this.id = id;
    } else {
        this.id = this.generateId();
    }

    /**
     * An array containing all hook functions.
     * @type Array
     * @see JXG.Board#addHook
     * @see JXG.Board#removeHook
     * @see JXG.Board#updateHooks
     */
    this.hooks = [];

    /**
     * An array containing all other boards that are updated after this board has been updated.
     * @type Array
     * @see JXG.Board#addChild
     * @see JXG.Board#removeChild
     */
    this.dependentBoards = [];

    /**
     * An associative array containing all geometric objects belonging to the board. Key is the id of the object and value is a reference to the object.
     * @type Object
     */
    this.objects = {};

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
     * Absolute position of the mouse pointer in screen pixel from the top left corner
     * of the HTML window.
     * @type Array
     */
    this.mousePosAbs = [0,0];

    /**
     * Relative position of the mouse pointer in screen pixel from the top left corner
     * of the JSXGraph canvas (the div element contining the board).
     * @type Array
     */
    this.mousePosRel = [0,0];

    /**
     * An array of references to the objects that are dragged on the board. Usually these are an object of
     * type {@link JXG.Point}.
     * @type Array
     */
    this.drag_obj = [];

    /**
     * This property is used to store the last time the user clicked on the board and the position he clicked.
     * @type Object
     */
    this.last_click = {
        time: 0,
        posX: 0,
        posY: 0
    };

    /**
     * A string containing the XML text of the construction. This is set in {@link JXG.FileReader#parseString}.
     * Only useful if a construction is read from a GEONExT-, Intergeo-, Geogebra-, or Cinderella-File.
     * @type String
     */
    this.xmlString = '';

    /**
     * Display the licence text.
     * @see JXG.JSXGraph#licenseText
     * @see JXG.JSXGraph#initBoard
     */
    this.showCopyright = false;
    if ((showCopyright!=null && showCopyright) || (showCopyright==null && this.options.showCopyright)) {
        this.renderer.displayCopyright(JXG.JSXGraph.licenseText, this.options.text.fontSize);
        this.showCopyright = true;
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
     * If GEONExT constructions are displayed, then this property should be set to true. Then no stdform updates
     * and no dragging of lines, circles and curves is possible. This is set in {@link JXG.GeonextReader#readGeonext}.
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

    // Introduce our event handlers to the browser
    JXG.addEvent(this.containerObj, 'mousedown', this.mouseDownListener, this);
    JXG.addEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);
    JXG.addEvent(document, 'mouseup', this.mouseUpListener,this);
    
    // To run JSXGraph on mobile touch devices we need these event listeners.
    JXG.addEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
    JXG.addEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);
    JXG.addEvent(this.containerObj, 'touchend', this.touchEndListener, this);

    // This one produces errors on IE
    //   JXG.addEvent(this.containerObj, 'contextmenu', function (e) { e.preventDefault(); return false;}, this);
    // this one works on IE, Firefox and Chromium with default configurations
    // It's possible this doesn't work on some Safari or Opera versions by default, the user then has to allow the deactivation of the context menu.
    this.containerObj.oncontextmenu = function (e) {if (JXG.exists(e)) e.preventDefault(); return false; };
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
            maxNameLength = 3,
            pre = '',
            post = '',
            indices = [],
            name = '',
            i, j;

        if (object.elementClass == JXG.OBJECT_CLASS_POINT) {
            // points have capital letters
            possibleNames = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        } else {
            // all other elements get lowercase labels
            possibleNames = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        }

        switch(object.type) {
            case JXG.OBJECT_TYPE_POLYGON:
                pre = 'P_{';
                post = '}';
                break;
            case JXG.OBJECT_TYPE_CIRCLE:
                pre = 'k_{';
                post = '}';
                break;
            case JXG.OBJECT_TYPE_ANGLE:
                pre = 'W_{';
                post = '}';
                break;
            default:
                if (object.elementClass != JXG.OBJECT_CLASS_POINT && object.elementClass != JXG.OBJECT_CLASS_LINE) {
                    pre = 's_{';
                    post = '}';
                }
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
            r = Math.round(Math.random()*33);
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

        return elId;
    },

    /**
     * After construction of the object the visibility is set
     * and the label is constructed if necessary.
     * @param {Object} obj The object to add.
     */
    finalizeAdding: function (obj) {
        if (!obj.visProp['visible']) {
            this.renderer.hide(obj);
        }
    },

    finalizeLabel: function (obj) {
        if (obj.hasLabel && !obj.label.content.isLabel && !obj.label.content.visProp['visible']) {
            this.renderer.hide(obj.label.content);
        }

    },

    /**
     * Calculates mouse coordinates relative to the boards container.
     * @returns {Array} Array of coordinates relative the boards container top left corner.
     */
    getRelativeMouseCoordinates: function () {
        var pCont = this.containerObj,
            cPos = JXG.getOffset(pCont),
            n;

        // add border width
        n = parseInt(JXG.getStyle(pCont,'borderLeftWidth'));
        if (isNaN(n)) n = 0; // IE problem if border-width not set explicitly
        cPos[0] += n;

        n = parseInt(JXG.getStyle(pCont,'borderTopWidth'));
        if (isNaN(n)) n = 0;
        cPos[1] += n;

        // add padding
        n = parseInt(JXG.getStyle(pCont,'paddingLeft'));
        if (isNaN(n)) n = 0;
        cPos[0] += n;

        n = parseInt(JXG.getStyle(pCont,'paddingTop'));
        if (isNaN(n)) n = 0;
        cPos[1] += n;

        return cPos;
    },

/**********************************************************
 *
 * Event Handler
 *
 **********************************************************/

    /**
     * Handler for click on left arrow in the navigation bar
     * @private
     */
    clickLeftArrow: function () {
        this.origin.scrCoords[1] += this.canvasWidth*0.1;
        this.moveOrigin();
        return this;
    },

    /**
     * Handler for click on right arrow in the navigation bar
     * @private
     */
    clickRightArrow: function () {
        this.origin.scrCoords[1] -= this.canvasWidth*0.1;
        this.moveOrigin();
        return this;
    },

    /**
     * Handler for click on up arrow in the navigation bar
     * @private
     */
    clickUpArrow: function () {
        this.origin.scrCoords[2] += this.canvasHeight*0.1;
        this.moveOrigin();
        return this;
    },

    /**
     * Handler for click on down arrow in the navigation bar
     * @private
     */
    clickDownArrow: function () {
        this.origin.scrCoords[2] -= this.canvasHeight*0.1;
        this.moveOrigin();
        return this;
    },

    /**
     * iPhone-Events
     */
    touchStartListener: function (evt) {
        evt.preventDefault();

        // variable initialization
        var e = document.createEvent("MouseEvents"), i, shift = false;
        this.drag_obj = [];

        // special gestures
        if ((evt.targetTouches.length==2) && (JXG.Math.Geometry.distance([evt.targetTouches[0].screenX, evt.targetTouches[0].screenY], [evt.targetTouches[1].screenX, evt.targetTouches[1].screenY])<80)) {
            evt.targetTouches.length = 1;
            shift = true;
        }

        // multitouch
        this.options.precision.hasPoint = this.options.precision.touch;
        for (i=0; i<evt.targetTouches.length; i++) {
            e.initMouseEvent('mousedown', true, false, this.containerObj, 0, evt.targetTouches[i].screenX, evt.targetTouches[i].screenY, evt.targetTouches[i].clientX, evt.targetTouches[i].clientY, false, false, shift, false, 0, null);
            e.fromTouch = true;
            this.mouseDownListener(e);
        }
    },

    touchMoveListener: function (evt) {
        evt.preventDefault();
        var i, myEvent;

        for (i=0; i<evt.targetTouches.length; i++) {
            myEvent = {pageX: evt.targetTouches[i].pageX, pageY: evt.targetTouches[i].pageY, clientX: evt.targetTouches[i].clientX, clientY: evt.targetTouches[i].clientY};
            myEvent.fromTouch = true;
            this.mouseMoveListener(myEvent, i);
        }
    },

    touchEndListener: function (evt) {
        var e = document.createEvent("MouseEvents"), i;

        e.initMouseEvent('mouseup', true, false, this.containerObj, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        e.fromTouch = true;
        this.mouseUpListener(e);

        this.options.precision.hasPoint = this.options.precision.mouse;
    },

    /**
     * This method is called by the browser when the mouse is moved.
     * @param {Event} Evt The browsers event object.
     * @private
     */
    mouseDownListener: function (Evt) {
        var el, pEl, cPos, absPos, dx, dy, nr;

        this.updateHooks('mousedown', Evt);

        // prevent accidental selection of text
        if (document.selection) {
            document.selection.empty();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }

        cPos = this.getRelativeMouseCoordinates(Evt);
        // position of mouse cursor relative to containers position of container
        absPos = JXG.getPosition(Evt);
        dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
        dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];
        this.mousePosAbs = absPos; // Save the mouse position
        this.mousePosRel = [dx,dy];

        if (Evt.shiftKey) {
            this.drag_dx = dx - this.origin.scrCoords[1];
            this.drag_dy = dy - this.origin.scrCoords[2];
            this.mode = this.BOARD_MODE_MOVE_ORIGIN;
            //Event.observe(this.container, 'mouseup', this.mouseUpListener.bind(this));
            JXG.addEvent(document, 'mouseup', this.mouseUpListener, this);
            return;
        }
        if (this.mode==this.BOARD_MODE_CONSTRUCT) return;

        //if (((new Date()).getTime() - this.last_click.time <500) && (JXG.Math.Geometry.distance(absPos, [this.last_click.posX, this.last_click.posY]) < 30)) {
        //	this.zoom100();
        //}

        this.last_click.time = (new Date()).getTime();
        this.last_click.posX = absPos[0];
        this.last_click.posY = absPos[1];

        this.mode = this.BOARD_MODE_DRAG;
        if (this.mode==this.BOARD_MODE_DRAG) {
            nr = 0;
            for (el in this.objects) {
                pEl = this.objects[el];
                if ( JXG.exists(pEl.hasPoint)
                    && ((pEl.type == JXG.OBJECT_TYPE_POINT) || (pEl.type == JXG.OBJECT_TYPE_GLIDER)
                    /*|| (!this.geonextCompatibilityMode && pEl.type == JXG.OBJECT_TYPE_LINE)  // not yet
                     || (!this.geonextCompatibilityMode && pEl.type == JXG.OBJECT_TYPE_CIRCLE)
                     || (!this.geonextCompatibilityMode && pEl.elementClass == JXG.OBJECT_CLASS_CURVE)*/ )
                    && (pEl.visProp['visible'])
                    && (!pEl.fixed) && (!pEl.frozen)
                    && (pEl.hasPoint(dx, dy))
                    ) {
                    // Points are preferred:
                    if ((pEl.type == JXG.OBJECT_TYPE_POINT) || (pEl.type == JXG.OBJECT_TYPE_GLIDER)) {
                        this.drag_obj.push({obj:this.objects[el],pos:nr}); // add the element and its number in this.object
                        if (this.options.takeFirst) break;
                    }
                }
                nr++;
            }
        }

        // if no draggable object can be found, get out here immediately
        if (this.drag_obj.length == 0) {
            this.mode = this.BOARD_MODE_NONE;
            return true;
        } else {
            // prevent accidental text selection
            // this could get us new trouble: input fields, links and drop down boxes placed as text
            // on the board doesn't work anymore.
            if (Evt && Evt.preventDefault) {
                Evt.preventDefault();
            } else {
                window.event.returnValue = false;
            }
        }

        // New mouse position in screen coordinates.
        this.dragObjCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx,dy], this);
        //JXG.addEvent(document, 'mouseup', this.mouseUpListener,this);

        return false;
    },

    /**
     * This method is called by the browser when the left mouse button is released.
     * @private
     */
    mouseUpListener: function (Evt) {
        this.updateHooks('mouseup', Evt);

        // redraw with high precision
        this.updateQuality = this.BOARD_QUALITY_HIGH;

        // release mouseup listener
        //JXG.removeEvent(document, 'mouseup', this.mouseUpListener, this);

        this.mode = this.BOARD_MODE_NONE;

        // if origin was moved update everything
        if (this.mode == this.BOARD_MODE_MOVE_ORIGIN) {
            this.moveOrigin();
        } else {
            //this.fullUpdate(); // Full update only needed on moveOrigin? (AW)
            this.update();
        }

        // release dragged object
        this.drag_obj = [];
    },

    /**
     * This method is called by the browser when the left mouse button is clicked.
     * @param {Event} Event The browsers event object.
     * @private
     */
    mouseMoveListener: function (Event, i) {
        var el, pEl, cPos, absPos, newPos, dx, dy, drag, oldCoords;

        this.updateHooks('mousemove', Event, this.mode);

        // if not called from touch events, i is undefined
        i = i || 0;

        cPos = this.getRelativeMouseCoordinates(Event);
        // position of mouse cursor relative to containers position of container
        absPos = JXG.getPosition(Event);
        dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
        dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];

        this.mousePosAbs = absPos; // Save the mouse position
        this.mousePosRel = [dx,dy];

        this.updateQuality = this.BOARD_QUALITY_LOW;

        this.dehighlightAll();
        if (this.mode != this.BOARD_MODE_DRAG) {
            this.renderer.hide(this.infobox);
        }

        // we have to check for three cases:
        //   * user moves origin
        //   * user drags an object
        //   * user just moves the mouse, here highlight all elements at
        //     the current mouse position
        if (this.mode == this.BOARD_MODE_MOVE_ORIGIN) {
            this.origin.scrCoords[1] = dx - this.drag_dx;
            this.origin.scrCoords[2] = dy - this.drag_dy;
            this.moveOrigin();
        } else if (this.mode == this.BOARD_MODE_DRAG) {
            newPos = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(dx,dy), this);
            drag = this.drag_obj[i].obj;

            if (drag.type == JXG.OBJECT_TYPE_POINT || drag.type == JXG.OBJECT_TYPE_LINE
                || drag.type == JXG.OBJECT_TYPE_CIRCLE || drag.elementClass == JXG.OBJECT_CLASS_CURVE) {

                drag.setPositionDirectly(JXG.COORDS_BY_USER, newPos.usrCoords[1], newPos.usrCoords[2]);
                this.update(drag);
            } else if (drag.type == JXG.OBJECT_TYPE_GLIDER) {
                oldCoords = drag.coords;

                // First the new position of the glider is set to the new mouse position
                drag.setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
                // Then, from this position we compute the projection to the object the glider on which the glider lives.
                if (drag.slideObject.type == JXG.OBJECT_TYPE_CIRCLE) {
                    drag.coords = JXG.Math.Geometry.projectPointToCircle(drag, drag.slideObject, this);
                } else if (drag.slideObject.type == JXG.OBJECT_TYPE_LINE) {
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
            this.updateInfobox(drag);
        } else { // BOARD_MODE_NONE or BOARD_MODE_CONSTRUCT
            // Elements  below the mouse pointer which are not highlighted yet will be highlighted.
            for (el in this.objects) {
                pEl = this.objects[el];
                if (JXG.exists(pEl.hasPoint) && pEl.visProp['visible'] && pEl.hasPoint(dx, dy)) {
                    // this is required in any case because otherwise the box won't be shown until the point is dragged
                    this.updateInfobox(pEl);
                    if (this.highlightedObjects[el] == null) { // highlight only if not highlighted
                        this.highlightedObjects[el] = pEl;
                        pEl.highlight();
                    }
                }
            }
        }
        this.updateQuality = this.BOARD_QUALITY_HIGH;
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

        if (!el.visProp.showInfobox) {
            return this;
        }
        if (el.elementClass == JXG.OBJECT_CLASS_POINT) {
            xc = el.coords.usrCoords[1];
            yc = el.coords.usrCoords[2];

            this.infobox.setCoords(xc+this.infobox.distanceX/(this.stretchX),
                yc+this.infobox.distanceY/(this.stretchY));
            if (typeof(el.infoboxText)!="string") {
                x = Math.abs(xc);
                if (x>0.1) {
                    x = xc.toFixed(2);
                } else if (x>=0.01) {
                    x = xc.toFixed(4);
                } else if (x>=0.0001) {
                    x = xc.toFixed(6);
                } else {
                    x = xc;
                }
                y = Math.abs(yc);
                if (y>0.1) {
                    y = yc.toFixed(2);
                } else if (y>=0.01) {
                    y = yc.toFixed(4);
                } else if (y>=0.0001) {
                    y = yc.toFixed(6);
                } else {
                    y = yc;
                }

                this.highlightInfobox(x,y,el);
            } else
                this.highlightCustomInfobox(el.infoboxText, el);

            this.renderer.show(this.infobox);
            this.renderer.updateText(this.infobox);
        }
        return this;
    },

    /**
     * Changes the text of the info box to what is provided via text.
     * @param {String} text
     * @returns {JXG.Board} Reference to the board.
     */
    highlightCustomInfobox: function (text) {
        this.infobox.setText('<span style="color:#bbbbbb;">' + text + '<'+'/span>');
        return this;
    },

    /**
     * Changes the text of the info box to show the given coordinates.
     * @param {Number} x
     * @param {Number} y
     * @returns {JXG.Board} Reference to the board.
     */
    highlightInfobox: function (x, y) {
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
            pEl.noHighlight();
            delete(this.highlightedObjects[el]);
            needsDehighlight = true;

            // In highlightedObjects should only be objects which fulfill all these conditions
            // And in case of complex elements, like a turtle based fractal, it should be faster to
            // just de-highlight the element instead of checking hasPoint...
            // if ((!JXG.exists(pEl.hasPoint)) || !pEl.hasPoint(x, y) || !pEl.visProp['visible'])
        }


        // We do not need to redraw during dehighlighting in CanvasRenderer
        // because we are redrawing anyhow
        //  -- We do need to redraw during dehighlighting. Otherwise objects won't be dehighlighted until
        // another object is highlighted.
        if (this.options.renderer=='canvas' && needsDehighlight) {
            this.prepareUpdate();
            this.renderer.suspendRedraw();
            this.updateRenderer();
            this.renderer.unsuspendRedraw();
        }

        return this;
    },

    /**
     * In case of snapToGrid activated this method caclulates the screen coords of mouse "snapped to grid".
     * @param {Number} x X coordinate in screen coordinates
     * @param {Number} y Y coordinate in screen coordinates
     * @returns {Array} Coordinates of the mouse in screen coordinates, snapped to grid.
     */
    getScrCoordsOfMouse: function (x, y) {
        if (this.options.grid.snapToGrid) {
            var newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);
            newCoords.setCoordinates(JXG.COORDS_BY_USER,
                [Math.round((newCoords.usrCoords[1])*this.options.grid.snapSizeX)/this.options.grid.snapSizeX,
                    Math.round((newCoords.usrCoords[2])*this.options.grid.snapSizeY)/this.options.grid.snapSizeY]);
            return [newCoords.scrCoords[1], newCoords.scrCoords[2]];
        } else {
            return [x,y];
        }
    },

    /**
     * In case of snapToGrid activated this method caclulates the user coords of mouse "snapped to grid".
     * @param {Event} Evt Event object containing the mouse coordinates.
     * @returns {Array} Coordinates of the mouse in screen coordinates, snapped to grid.
     */
    getUsrCoordsOfMouse: function (Evt) {
        var cPos = this.getRelativeMouseCoordinates(Evt),
            absPos = JXG.getPosition(Evt),
            x = absPos[0]-cPos[0],
            y = absPos[1]-cPos[1],
            newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);

        if (this.options.grid.snapToGrid) {
            newCoords.setCoordinates(JXG.COORDS_BY_USER,
                [Math.round((newCoords.usrCoords[1])*this.options.grid.snapSizeX)/this.options.grid.snapSizeX,
                    Math.round((newCoords.usrCoords[2])*this.options.grid.snapSizeY)/this.options.grid.snapSizeY]);
        }

        return [newCoords.usrCoords[1], newCoords.usrCoords[2]];
    },

    /**
     * Collects all elements under current mouse position plus current user coordinates of mouse cursor.
     * @param {Event} Evt Event object containing the mouse coordinates.
     * @returns {Array} Array of elements at the current mouse position plus current user coordinates of mouse.
     */
    getAllUnderMouse: function (Evt) {
        var elList = this.getAllObjectsUnderMouse(Evt);

        elList.push(this.getUsrCoordsOfMouse(Evt));

        return elList;
    },
    /**
     * Collects all elements under current mouse position.
     * @param {Event} Evt Event object containing the mouse coordinates.
     * @returns {Array} Array of elements at the current mouse position.
     */
    getAllObjectsUnderMouse: function (Evt) {
        var cPos = this.getRelativeMouseCoordinates(Evt),
            absPos = JXG.getPosition(Evt),
            dx = absPos[0]-cPos[0],
            dy = absPos[1]-cPos[1],
            elList = [];

        for (var el in this.objects) {
            if (this.objects[el].visProp['visible'] && this.objects[el].hasPoint && this.objects[el].hasPoint(dx, dy)) {
                elList.push(this.objects[el]);
            }
        }

        return elList;
    },


    /**
     * Moves the origin and initializes an update of all elements.
     * @returns {JXG.Board} Reference to this board.
     */
    moveOrigin: function () {
        var el, ob;

        for (ob in this.objects) {
            el = this.objects[ob];
            if (!el.frozen && (el.elementClass==JXG.OBJECT_CLASS_POINT ||
                el.elementClass==JXG.OBJECT_CLASS_CURVE ||
                el.type==JXG.OBJECT_TYPE_AXIS ||
                el.type==JXG.OBJECT_TYPE_TEXT)) {
                if (el.elementClass!=JXG.OBJECT_CLASS_CURVE && el.type!=JXG.OBJECT_TYPE_AXIS)
                    el.coords.usr2screen();
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
        var plaintext = 'var el,x,y,c;\n',
            i = str.indexOf('<data>'),
            j = str.indexOf('<'+'/data>'),
            term, m, left, right, name, el;

        if (i<0) {
            return;
        }

        while (i>=0) {
            term = str.slice(i+6,j); // throw away <data>
            m = term.indexOf('=');
            left = term.slice(0,m);
            right = term.slice(m+1);
            m = left.indexOf('.'); // Dies erzeugt Probleme bei Variablennamen der Form " Steuern akt."
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
                    plaintext += 'el.setPositionDirectly(JXG.COORDS_BY_USER,'+(right) +',y);\n';
                    plaintext += 'el.update();\n';
                    break;
                case 'y':
                    plaintext += 'var x=el.coords.usrCoords[1];\n';  // x stays
                    plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,[x,'+(right)+'],this);\n';
                    break;
                case 'visible':
                    plaintext += 'var c='+(right)+';\n';
                    plaintext += 'if (c) {el.showElement();} else {el.hideElement();}\n';
                    break;
                case 'position':
                    plaintext += 'el.position = ' + (right) +';\n';
                    plaintext += 'el.update();\n';
                    break;
                case 'stroke':
                    plaintext += 'el.strokeColor = ' + (right) +';\n';
                    break;
                case 'style':
                    plaintext += 'el.setStyle(' + (right) +');\n';
                    break;
                case 'strokewidth':
                    plaintext += 'el.strokeWidth = ' + (right) +';\n';   // wird auch bei Punkten verwendet, was nicht realisiert ist.
                    break;
                case 'fill':
                    plaintext += 'var f='+(right)+';\n';
                    plaintext += 'el.setProperty({fillColor:f})\n';
                    break;
                case 'label':
                    break;
                default:
                    JXG.debug("property '" + property + "' in conditions not yet implemented:" + right);
                    break;
            }
            //plaintext += "}\n";
            str = str.slice(j+7); // cut off "</data>"
            i = str.indexOf('<data>');
            j = str.indexOf('<'+'/data>');
        }
        plaintext += 'this.prepareUpdate();\n';
        plaintext += 'this.updateElements();\n';
        plaintext += 'return true;\n';

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
        var el, ob;
        for (ob in this.objects) {
            el = this.objects[ob];
            if (!el.frozen && (el.elementClass==JXG.OBJECT_CLASS_POINT ||
                el.elementClass==JXG.OBJECT_CLASS_CURVE ||
                el.type==JXG.OBJECT_TYPE_AXIS ||
                el.type==JXG.OBJECT_TYPE_TEXT)) {
                if (el.elementClass!=JXG.OBJECT_CLASS_CURVE && el.type!=JXG.OBJECT_TYPE_AXIS)
                    el.coords.usr2screen();
            }
        }
        this.calculateSnapSizes();
        this.clearTraces();
        this.fullUpdate();

        return this;
    },

    /**
     * Recalculate stretch factors.
     * Required after zooming or setting the bounding box.
     * @returns {JXG.Board} Reference to the board
     */
    updateStretch: function () {
        this.stretchX = this.zoomX*this.unitX;
        this.stretchY = this.zoomY*this.unitY;
        return this;
    },

    /**
     * Zooms into the board by the factor board.options.zoom.factor and applies the zoom.
     * @returns {JXG.Board} Reference to the board
     */
    zoomIn: function () {
        var oX, oY;
        this.zoomX *= this.options.zoom.factor;
        this.zoomY *= this.options.zoom.factor;
        oX = this.origin.scrCoords[1]*this.options.zoom.factor;
        oY = this.origin.scrCoords[2]*this.options.zoom.factor;
        this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
        this.updateStretch();
        this.applyZoom();
        return this;
    },

    /**
     * Zooms out of the board by the factor board.options.zoom.factor and applies the zoom.
     * @returns {JXG.Board} Reference to the board
     */
    zoomOut: function () {
        var oX, oY;
        this.zoomX /= this.options.zoom.factor;
        this.zoomY /= this.options.zoom.factor;
        oX = this.origin.scrCoords[1]/this.options.zoom.factor;
        oY = this.origin.scrCoords[2]/this.options.zoom.factor;
        this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
        this.updateStretch();
        this.applyZoom();
        return this;
    },

    /**
     * Resets zoom factor to 100%.
     * @returns {JXG.Board} Reference to the board
     */
    zoom100: function () {
        var oX, oY, zX, zY;

        zX = this.zoomX;
        zY = this.zoomY;
        this.zoomX = 1.0;
        this.zoomY = 1.0;

        oX = this.origin.scrCoords[1]/zX;
        oY = this.origin.scrCoords[2]/zY;
        this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
        this.updateStretch();
        this.applyZoom();
        return this;
    },

    /**
     * Zooms the board so every visible point is shown. Keeps aspect ratio.
     * @returns {JXG.Board} Reference to the board
     */
    zoomAllPoints: function () {
        var ratio, minX, maxX, minY, maxY, el,
            border, borderX, borderY, distX, distY, newZoom, newZoomX, newZoomY,
            newOriginX, newOriginY;

        ratio = this.zoomX / this.zoomY;
        minX = 0; // (0,0) soll auch sichtbar bleiben
        maxX = 0;
        minY = 0;
        maxY = 0;
        for (el in this.objects) {
            if ( (this.objects[el].elementClass == JXG.OBJECT_CLASS_POINT) &&
                this.objects[el].visProp['visible']) {
                if (this.objects[el].coords.usrCoords[1] < minX) {
                    minX = this.objects[el].coords.usrCoords[1];
                } else if (this.objects[el].coords.usrCoords[1] > maxX) {
                    maxX = this.objects[el].coords.usrCoords[1];
                }
                if (this.objects[el].coords.usrCoords[2] > maxY) {
                    maxY = this.objects[el].coords.usrCoords[2];
                } else if (this.objects[el].coords.usrCoords[2] < minY) {
                    minY = this.objects[el].coords.usrCoords[2];
                }
            }
        }
        border = 50;
        borderX = border/(this.unitX*this.zoomX);
        borderY = border/(this.unitY*this.zoomY);

        distX = maxX - minX + 2*borderX;
        distY = maxY - minY + 2*borderY;

        newZoom = Math.min(this.canvasWidth/(this.unitX*distX), this.canvasHeight/(this.unitY*distY));
        newZoomY = newZoom;
        newZoomX = newZoom*ratio;

        newOriginX = -(minX-borderX)*this.unitX*newZoomX;
        newOriginY = (maxY+borderY)*this.unitY*newZoomY;
        this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [newOriginX, newOriginY], this);
        this.zoomX = newZoomX;
        this.zoomY = newZoomY;
        this.updateStretch();
        this.applyZoom();
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
            for (i=0; i<object.length; i++)
                this.removeObject(object[i]);
        }

        object = JXG.getReference(this, object);

        // If the object which is about to be removed unknown, do nothing.
        if (!JXG.exists(object)) {
            return this;
        }

        try{
            // remove all children.
            for (el in object.childElements) {
                object.childElements[el].board.removeObject(object.childElements[el]);
            }

            for (el in this.objects) {
                if (JXG.exists(this.objects[el].childElements))
                    delete(this.objects[el].childElements[object.id]);
            }

            // remove the object itself from our control structures
            delete(this.objects[object.id]);
            delete(this.elementsByName[object.name]);

            // the object deletion itself is handled by the object.
            if (JXG.exists(object.remove)) object.remove();
        } catch(e) {
            JXG.debug(object.id + ': Could not be removed, JS says:\n\n' + e);
        }
        return this;
    },

    /**
     * Initialize some objects which are contained in every GEONExT construction by default,
     * but are not contained in the gxt files.
     * @returns {JXG.Board} Reference to the board
     */
    initGeonextBoard: function () {
        var p1, p2, p3, l1, l2;

        p1 = new JXG.Point(this, [0,0],this.id + 'gOOe0','Ursprung',false);
        p1.fixed = true;
        p2 = new JXG.Point(this, [1,0],this.id + 'gXOe0','Punkt_1_0',false);
        p2.fixed = true;
        p3 = new JXG.Point(this, [0,1],this.id + 'gYOe0','Punkt_0_1',false);
        p3.fixed = true;
        l1 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gXOe0', this.id + 'gXLe0','X-Achse', false);
        l1.hideElement();
        l2 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gYOe0', this.id + 'gYLe0','Y-Achse', false);
        l2.hideElement();
        return this;
    },

    /**
     * Initialize the info box object which is used to display
     * the coordinates of points near the mouse pointer,
     * @returns {JXG.Board} Reference to the board
     */
    initInfobox: function () {
        this.infobox = new JXG.Text(this, '0,0', '', [0,0], this.id + '__infobox',null, null, false, 'html');
        this.infobox.distanceX = -20;
        this.infobox.distanceY = 25;
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
        var el;
        for (el in this.objects) {
            this.objects[el].needsUpdate = true;
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
        // isBeforeDrag: see updateRenderer
        //isBeforeDrag = true; // If possible, we start the update at the dragged object.

        drag = JXG.getRef(this, drag);
        // if (drag==null) { isBeforeDrag = false; }

        for (el in this.objects) {
            pEl = this.objects[el];
            //if (isBeforeDrag && drag!=null && pEl.id == drag.id) {
            //    isBeforeDrag = false;
            //}
            if (!this.needsFullUpdate && (/*isBeforeDrag ||*/ !pEl.needsRegularUpdate)) { continue; }

            // For updates of an element we distinguish if the dragged element is updated or
            // other elements are updated.
            // The difference lies in the treatment of gliders.
            if (drag==null || pEl.id!=drag.id) {
                pEl.update(true);   // an element following the dragged element is updated
            } else {
                pEl.update(false);  // the dragged object itself is updated
            }
        }
        return this;
    },

    /**
     * Runs through all elements and calls their update() method.
     * @param {JXG.GeometryElement} drag Element that caused the update.
     * @returns {JXG.Board} Reference to the board
     */
    updateRenderer: function (drag) {
        var el, pEl;
        // isBeforDrag does not work because transformations may depend 
        // on a dragged element and can be bound to elements before the 
        // dragged element.
        //isBeforeDrag = true; // If possible, we start the update at the dragged object.

        if (this.options.renderer=='canvas') {
            this.updateRendererCanvas(drag);
        } else {
            // drag = JXG.getReference(this, drag);
            //if (drag==null) { isBeforeDrag = false; }

            for (el in this.objects) {
                pEl = this.objects[el];
                // if (isBeforeDrag && drag!=null && pEl.id == drag.id) { isBeforeDrag = false; }
                if ( !this.needsFullUpdate && (/*isBeforeDrag ||*/ !pEl.needsRegularUpdate) ) {
                    continue;
                }
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
        var el, pEl, i,
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
            for (el in this.objects) {
                pEl = this.objects[el];
                if (pEl.layer==mini) {
                    pEl.updateRenderer();
                }
            }
        }
        return this;
    },

    /**
     * Adds a hook to this board. A hook is a function which will be called on every board update.
     * @param {Function} hook A function to be called by the board after an update occured.
     * @param {String} m When the hook is to be called. Possible values are <i>mouseup</i>, <i>mousedown</i> and <i>update</i>.
     * @returns {Number} Id of the hook, required to remove the hook from the board.
     */
    addHook: function (hook, m) {
        if (!JXG.exists(m))
            m = 'update';

        this.hooks.push({fn: hook, mode: m});

        if (m=='update')
            hook(this);

        return (this.hooks.length-1);
    },

    /**
     * Removes a hook from the board.
     * @param {Number} id Id for the hook. The number you got when you added the hook.
     * @returns {JXG.Board} Reference to the board
     */
    removeHook: function (id) {
        this.hooks[id] = null;
        return this;
    },

    /**
     * Runs through all hooked functions and calls them.
     * @returns {JXG.Board} Reference to the board
     */
    updateHooks: function (m) {
        var i, args = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : [];

        if (!JXG.exists(m))
            m = 'update';

        for (i=0; i<this.hooks.length; i++) {
            if ((this.hooks[i] != null) && (this.hooks[i].mode == m)) {
                this.hooks[i].fn.apply(this, args);
            }
        }
        return this;
    },

    /**
     * Adds a dependent board to this board.
     * @param {JXG.Board} board A reference to board which will be updated after an update of this board occured.
     * @returns {JXG.Board} Reference to the board
     */
    addChild: function (board) {
        this.dependentBoards.push(board);
        this.update();
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
     * @param {Object} drag Element that caused the update.
     * @returns {JXG.Board} Reference to the board
     */
    update: function (drag) {
        var i, len, boardId, b;
        if (this.isSuspendedUpdate) { return this; }
        this.prepareUpdate(drag).updateElements(drag).updateConditions();
        this.renderer.suspendRedraw();
        this.updateRenderer(drag);
        this.renderer.unsuspendRedraw();
        this.updateHooks();

        // To resolve dependencies between boards
        //for (var board in JXG.JSXGraph.boards) {
        len = this.dependentBoards.length;
        for (i=0; i<len; i++) {
            boardId = this.dependentBoards[i].id;
            b = JXG.JSXGraph.boards[boardId];
            if ( b != this) {
                b.updateQuality = this.updateQuality;
                b.prepareUpdate().updateElements().updateConditions();
                b.renderer.suspendRedraw();
                b.updateRenderer();
                b.renderer.unsuspendRedraw();
                b.updateHooks();
            }

        }
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

        return this;
    },

    /**
     * Creates a new geometric element of type elementType.
     * @param {String} elementType Type of the element to be constructed given as a string e.g. 'point' or 'circle'.
     * @param {Array} parents Array of parent elements needed to construct the element e.g. coordinates for a point or two
     * points to construct a line. This highly depends on the elementType that is constructed. See the corresponding JXG.create*
     * methods for a list of possible parameters.
     * @param {Object} attributes An object containing the attributes to be set. This also depends on the elementType.
     * Common attributes are name, visible, strokeColor. See {@link JXG.GeometryElement#setProperty}.
     * @returns {Object} Reference to the created element. This is usually a GeometryElement, but can be an array containing
     * two or more elements.
     */
    create: function (elementType, parents, attributes) {
        var el, i, s;

        // Turtle may have no parent elements
        if (elementType!='turtle' && (!JXG.exists(parents) || (parents.length && parents.length == 0))) {
            return null;
        }

        if (!JXG.exists(parents)) {
            parents = [];
        }

        elementType = elementType.toLowerCase();

        if (attributes==null) {
            attributes = {};
        }
        for (i=0; i<parents.length; i++) {
            parents[i] = JXG.getReference(this, parents[i]); // TODO: should not be done for content-parameter of JXG.Text
        }

        if (JXG.JSXGraph.elements[elementType] != null) {
            if (typeof JXG.JSXGraph.elements[elementType] == 'function') {
                el = JXG.JSXGraph.elements[elementType](this, parents, attributes);
            } else {
                el = JXG.JSXGraph.elements[elementType].creator(this, parents, attributes);
            }
        } else {
            throw new Error("JSXGraph: JXG.createElement: Unknown element type given: "+elementType);
        }

        if (!JXG.exists(el)) {
            JXG.debug("JSXGraph: JXG.createElement: failure creating "+elementType);
            return el;
        }

        if (JXG.isArray(attributes)) {
            attributes = attributes[0];
        }

        if (el.multipleElements) {
            for (s in el) {
                if (el[s].setProperty)
                    el[s].setProperty(attributes);
            }
        } else {
            if (el.setProperty)
                el.setProperty(attributes);
        }

        this.update(el); // We start updating at the newly created element. AW
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

        for (el in this.objects) {
            if (this.objects[el].traced)
                this.objects[el].clearTrace();
        }
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
        if (!JXG.isArray(bbox)) return this;

        var h, w, oX, oY,
            dim = JXG.getDimensions(this.container);

        this.canvasWidth = parseInt(dim.width);
        this.canvasHeight = parseInt(dim.height);
        w = this.canvasWidth;
        h = this.canvasHeight;
        if (keepaspectratio) {
            this.unitX = w/(bbox[2]-bbox[0]);
            this.unitY = h/(-bbox[3]+bbox[1]);
            if (this.unitX<this.unitY) {
                this.unitY = this.unitX;
            } else {
                this.unitX = this.unitY;
            }
        } else {
            this.unitX = w/(bbox[2]-bbox[0]);
            this.unitY = h/(-bbox[3]+bbox[1]);
        }
        oX = -this.unitX*bbox[0]*this.zoomX;
        oY = this.unitY*bbox[1]*this.zoomY;
        this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
        this.updateStretch();
        this.moveOrigin();
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
        this.animationObjects[element.id] = element;

        if (!this.animationIntervalCode) {
            this.animationIntervalCode = window.setInterval('JXG.JSXGraph.boards[\'' + this.id + '\'].animate();', 35);
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

        window.clearInterval(this.animationIntervalCode);
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
            obj=null;

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
                    //o.setPositionByTransform(JXG.COORDS_BY_USER, newCoords[0] - o.coords.usrCoords[1], newCoords[1] - o.coords.usrCoords[2]);
                    o.setPositionDirectly(JXG.COORDS_BY_USER, newCoords[0], newCoords[1]);
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
            }
        }

        if (count == 0) {
            window.clearInterval(this.animationIntervalCode);
            delete(this.animationIntervalCode);
        } else {
            this.update(obj);
        }

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
                if (this.currentCBDef == 'none')
                    o.visPropOriginal = JXG.deepCopy(o.visProp);
                o.setProperty({strokeColor: JXG.rgb2cb(o.visPropOriginal.strokeColor, deficiency), fillColor: JXG.rgb2cb(o.visPropOriginal.fillColor, deficiency),
                    highlightStrokeColor: JXG.rgb2cb(o.visPropOriginal.highlightStrokeColor, deficiency), highlightFillColor: JXG.rgb2cb(o.visPropOriginal.highlightFillColor, deficiency)});
            } else if (JXG.exists(o.visPropOriginal)) {
                o.visProp = JXG.deepCopy(o.visPropOriginal);
            }
        }
        this.currentCBDef = deficiency;
        this.update();

        return this;
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
