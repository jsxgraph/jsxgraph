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
 * @fileoverview The Board object is defined in this file. Board controls all properties and methods
 * used to manage a geonext board like adding geometric elements, removing them, managing
 * mouse over, drag & drop of geometric objects etc.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Board object.
 * @class This is the Board class. It stores all methods and properties required
 * to manage a geonext board like adding geometric elements, removing them, managing
 * mouse over, drag & drop of geometric objects etc.
 * @constructor
 * @param {String,Object} container The id or reference of the html-element the board is drawn in.
 * @param {JXG.AbstractRenderer} renderer The reference of a geonext renderer.
 * @param {String} id Unique identifier for the board, may be an empty string or null or even undefined.
 * @param {JXG.Coords} origin The coordinates where the origin is placed, in user coordinates.
 * @param {float} zoomX Zoom factor in x-axis direction
 * @param {float} zoomY Zoom factor in y-axis direction
 * @param {int} unitX Units in x-axis direction
 * @param {int} unitY Units in y-axis direction
 * @param {int} canvasWidth  The width of canvas
 * @param {int} canvasHeight The height of canvas
 * @param {bool} showCopyright Display the copyright text
 */
JXG.Board = function(container, renderer, id, origin, zoomX, zoomY, unitX, unitY, canvasWidth, canvasHeight, showCopyright) {
    /**
     * Board is in no special mode, objects are highlighted on mouse over and objects may be
     * clicked to start drag&drop.
     * @type int
     * @private
     * @final
     */
    this.BOARD_MODE_NONE = 0x0000;
    
    /**
     * Board is in drag mode, objects aren't highlighted on mouse over and the object referenced in
     * drag_obj is updated on mouse movement.
     * @type int
     * @see #drag_obj
     * @private
     * @final
     */
    this.BOARD_MODE_DRAG = 0x0001;
    
    /**
     * Board is in construction mode, objects are highlighted on mouse over and the behaviour of the board
     * is determined by the construction type stored in the field constructionType.
     * @type int
     * @see #constructionType
     * @private
     * @final
     */
    this.BOARD_MODE_CONSTRUCT = 0x0010;

    /**
     * Board is in move origin mode.
     * @type int
     * @private
     * @final
     */
    this.BOARD_MODE_MOVE_ORIGIN = 0x0002;
    
    /**
     * Updating is made with low quality, e.g. graphs are evaluated at a lesser amount of points.
     * @type int
     * @see #updateQuality
     * @private
     * @final
     */
    this.BOARD_QUALITY_LOW = 0x1;
    
    /**
     * Updating is made with high quality, e.g. graphs are evaluated at much more points.
     * @type int
     * @see #updateQuality
     * @private
     * @final
     */
    this.BOARD_QUALITY_HIGH = 0x2;

    /**
     * When the board is in construction mode this construction type says we want to construct a point.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_POINT         = 0x43545054;       // CTPT
    /**
     * When the board is in construction mode this construction type says we want to construct a circle.
     * @type int
     * @private
     * @final
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
        throw ("\nJSXGraph error: HTML container element '" + (box) + "' not found.");
    }
    //this.containerObj.undoPositioned;  //???

    /**
     * A reference to this boards renderer.
     * @private
     * @type AbstractRenderer
     */
    this.renderer = renderer;
    
    /**
    * Some standard options
    * @type Options
    */
    this.options = new JXG.Options();
    
    /**
     * Dimension of the board.
     * @private
     * @type int
     */
    this.dimension = 2;

    /**
     * Coordinates of the boards origin
     * @type Coords
     */    
    this.origin = {};
    this.origin.usrCoords = [1, 0, 0];
    this.origin.scrCoords = [1, origin[0], origin[1]];

    /**
     * Zoom factor in X direction
     * @type int
     */
    this.zoomX = zoomX;
    
    /**
     * Zoom factor in Y direction
     * @type int
     */
    this.zoomY = zoomY;
    
    /**
     * This means the number of pixel which represents
     * one unit in user-coordinates in x direction.
     * @type int
     */
    this.unitX = unitX;
    
    /**
     * This means the number of pixel which represents
     * one unit in user-coordinates in y direction.
     * @type int
     */
    this.unitY = unitY;
    
    /**
     * Canvas Width
     * @type int
     */
    this.canvasWidth = canvasWidth;

    /**
     * Canvas Width
     * @type int
     */
    this.canvasHeight = canvasHeight;

    /**
     * Default font size for labels and texts.
     * @type int
     */
    this.fontSize = this.options.fontSize;
        
    /**
     * A reference to an object of class Algebra.
     * @see Algebra
     * @private
     * @type Algebra
     */
    this.algebra = new JXG.Algebra(this);
    this.mathStatistics = new JXG.MathStatistics();

    /* If the given id is not valid, generate an unique id */
    if((id != '') && (id != null) && (typeof document.getElementById(id) != 'undefined'))
        this.id = id;
    else
        this.id = this.generateId();
        
    /**
     * An array containing all hooked functions.
     * @type Array
     */
    this.hooks = [];

    /**
     * An array containing all other boards that are updated after this board has been updated. 
     * @private
     * @type Array
     */
    this.dependentBoards = [];

    /**
     * An associative array containing all geometric objects belonging to the board. Key is the id of the object and value is a reference to the object.
     * @private
     * @type Object
     */
    this.objects = {};
        
    /**
     * An associative array containing all highlighted geometric objects belonging to the board.
     * @private
     * @type Object
     */
    this.highlightedObjects = {};
    
    /**
     * Number of objects ever created on this board. This includes every object, even invisible and deleted ones.
     * @private
     * @type int
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
     * <li>Board.BOARD_MODE_NONE</li>
     * <li>Board.BOARD_MODE_DRAG</li>
     * <li>Board.BOARD_MODE_CONSTRUCT</li>
     * </ul>
     * @private
     * @type int
     */
    this.mode = this.BOARD_MODE_NONE;
    
    /**
     * The update quality of the board. In most cases this is set to Board.BOARD_QUALITY_HIGH when mode is not Board.BOARD_MODE_DRAG
     * and Board.QUALITY_HIGH otherwise. Possible values are
     * <ul>
     * <li>BOARD_QUALITY_LOW</li>
     * <li>BOARD_QUALITY_HIGH</li>
     * </ul>
     * @see #mode
     * @private
     * @type int
     */
    this.updateQuality = this.BOARD_QUALITY_HIGH;
    
   /**
    * If true updates are skipped
     * @private
    * @type bool
    */   
   this.isSuspendedRedraw = false;
    
   /**
    * The way objects can be dragged. If true, objects can only moved on a predefined grid, if false objects can be moved smoothly almost everywhere.
    * @type bool
    */
   this.snapToGrid = this.options.grid.snapToGrid;
   
   /**
    * The amount of grid points plus one that fit in one unit of user coordinates in x direction.
    * @type int
    */
   this.gridX = this.options.grid.gridX;
   
   /**
    * The amount of grid points plus one that fit in one unit of user coordinates in y direction.
    * @type int
    */
   this.gridY = this.options.grid.gridY;
    
   /**
    * Color of the grid.
    * @type string
    */        
   this.gridColor = this.options.grid.gridColor;
   
   /**
    * Opacity of the grid color, between 0 and 1.
    * @type float
    */        
   this.gridOpacity = this.options.grid.gridOpacity;
   
   /**
    * Determines whether the grid is dashed or not.
    * @type bool
    */    
   this.gridDash = this.options.grid.gridDash;
   
   /**
    * The amount of grid points plus one for snapToGrid that fit in one unit of user coordinates in x direction.
    * @type int
    */
   this.snapSizeX = this.options.grid.snapSizeX;
   
   /**
    * The amount of grid points plus one for snapToGrid that fit in one unit of user coordinates in y direction.
    * @type int
    */
   this.snapSizeY = this.options.grid.snapSizeY;    
   
   this.calculateSnapSizes();
   
   /**
    * Visibility of the boards grid.
    * @private
    * @type bool
    */
   this.hasGrid = this.options.grid.hasGrid;
    
   /**
    * The distance from the mouse to the dragged object in x direction when the user clicked the mouse button.
    * @type int
    * @see drag_dy
    * @see #drag_obj
    * @private
    */
   this.drag_dx = 0;
   
   /**
    * The distance from the mouse to the dragged object in y direction when the user clicked the mouse button.
    * @type int
    * @see drag_dx
    * @see #drag_obj
    * @private
    */
   this.drag_dy = 0;
   
   /**
    * A reference to the object that is dragged on the board.
    * @private
    * @type Object
    */
   this.drag_obj = null;

   /**
    * string containing the XML text of the construction.
    * it is set in @see FileReader.parseString.
    * Only useful if a construction from GEONExT, Intergeo, ...
    * is read.
    * @type string
    * @private
    */
   this.xmlString = '';
    
    /*
    * Display the licence text, @see JSXGraph
    */
    if ( (showCopyright!=null && showCopyright) || (showCopyright==null && this.options.showCopyright) ) {
        this.renderer.displayCopyright(JXG.JSXGraph.licenseText,this.options.fontSize);
    }
        
   /**
    * Full updates are needed after zoom and axis translates.
    * This saves some time during update
    * @private
    * @type bool
    */
   this.needsFullUpdate = false;
    
   /**
    * if {reducedUpdate} is set to true, then only the dragged element and few (i.e. 2) following
    * elements are updated during mouse move. On muose up the whole construction is
    * updated. This enables JSXGraph even on very slow devices.
    * @private
    * @type bool
    */
   this.reducedUpdate = false;

   /** 
    * If GEONExT constructions are displayed,
    * then this property should be set to true.
    * Then no stdform updates and no dragging
    * of lines, circles and curves is possible.
    * @private
    * @type bool
    */
   this.geonextCompatibilityMode = false;

   /* Event needs to know which methods to call when mouse is moved or clicked */
   // // Event.observe(this.container, 'mousedown', this.mouseDownListener.bind(this));
   //// Event.observe(this.container, 'mousemove', this.mouseMoveListener.bind(this));
   //Event.observe(document, 'mousedown', this.mouseDownListener.bind(this));
   //Event.observe(this.containerObj, 'mousemove', this.mouseMoveListener.bind(this));
   
   JXG.addEvent(document,'mousedown', this.mouseDownListener, this);
   JXG.addEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);
};

/**
 * @private
 * Generates unique name for the given object. The result depends on object.type, if the object is a point, just capital characters are used, if it is
 * a line just lower case characters. If object is of type Polygon, lower case prefixed with P_ is used and if it's of type circle, lower case characters
 * prefixed with k_ is used. In any other case, lower case chars prefixed with s_ is used.
 * @param {String,Object} object Reference or id or name of an geometry object that is to be named.
 * @return {String} Unique name for the object.
 */
JXG.Board.prototype.generateName = function(object) {
    if(object.type == JXG.OBJECT_TYPE_TICKS)
        return;
    
    var possibleNames;
    if(object.elementClass == JXG.OBJECT_CLASS_POINT) {
        // points have capital letters 
        possibleNames = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                                  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    } 
    else {
        // all other elements get lowercase labels
        possibleNames = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                                  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']; 
    }
    
    
    // how long the name can be at most
    var maxNameLength = 3;
    var pre = '';
    var nameBase = '';
    var post = '';
    
    if(object.elementClass == JXG.OBJECT_CLASS_POINT || object.elementClass == JXG.OBJECT_CLASS_LINE) {
    }
    else {
        if(object.type == JXG.OBJECT_TYPE_POLYGON) {
            pre = 'P_{';
            post = '}';
        }
        else if(object.type == JXG.OBJECT_TYPE_CIRCLE) {
            pre = 'k_{';
            post = '}';
        }
        else if(object.type == JXG.OBJECT_TYPE_ANGLE) {
            pre = 'W_{';
            post = '}';
        }
        else {
            pre = 's_{';
            post = '}';
        }
    }
    var indices = [];
    var name = '';
    var tmp = '';

    var i = 0;
    var j = 0;

    for(i=0; i<maxNameLength; i++) {
        indices[i] = 0;
    }
    
    while (indices[maxNameLength-1] < possibleNames.length) {
        for(indices[0]=1; indices[0]<possibleNames.length; indices[0]++) {
            name = pre;

            for(i=maxNameLength; i>0; i--) {
                name += possibleNames[indices[i-1]];
            }

            if (this.elementsByName[name+post] == null) {
                return name+post;
            }

        }
        indices[0] = possibleNames.length;
        for(i=1; i<maxNameLength; i++) {
            if(indices[i-1] == possibleNames.length) {
                indices[i-1] = 1;
                indices[i]++;
            }
        }
    }

    return '';
};

/**
 * Generates unique id for a board. The result is randomly generated and prefixed with 'gxtBoard'.
 * @return {String} Unique id for a board.
 * @private
 */
JXG.Board.prototype.generateId = function () {
    var r = 1;

    // as long as we don't have an unique id generate a new one
    while(JXG.JSXGraph.boards['gxtBoard' + r] != null) {
        r = Math.round(Math.random()*33);
    }

    return ('gxtBoard' + r);
};

/**
 * @private
 * Calculates mouse coordinates relative to the boards container.
 * @param {Event} Evt The browsers event object.
 * @type Array
 * @return Array of coordinates relative the boards container top left corner.
 */
JXG.Board.prototype.getRelativeMouseCoordinates = function (Evt) {
    var pCont = this.containerObj;
    var cPos = JXG.getOffset(pCont); //Element.cumulativeOffset(pCont);
    // add border width
    cPos[0] += parseInt(JXG.getStyle(pCont,'borderLeftWidth'));
    cPos[1] += parseInt(JXG.getStyle(pCont,'borderTopWidth'));
    // add padding
    cPos[0] += parseInt(JXG.getStyle(pCont,'paddingLeft'));
    cPos[1] += parseInt(JXG.getStyle(pCont,'paddingTop'));
    
    return cPos;
};

/**
 * @private
 * Handler for click on left arrow in the navigation bar
 **/
JXG.Board.prototype.clickLeftArrow = function (Event) {
    this.origin.scrCoords[1] += this.canvasWidth*0.1;
    this.moveOrigin();
};

/**
 * @private
 * Handler for click on right arrow in the navigation bar
 **/
JXG.Board.prototype.clickRightArrow = function (Event) {
    this.origin.scrCoords[1] -= this.canvasWidth*0.1;
    this.moveOrigin();
};

/**
 * @private
 * Handler for click on up arrow in the navigation bar
 **/
JXG.Board.prototype.clickUpArrow = function (Event) {
    this.origin.scrCoords[2] += this.canvasHeight*0.1;
    this.moveOrigin();
};

/**
 * @private
 * Handler for click on down arrow in the navigation bar
 **/
JXG.Board.prototype.clickDownArrow = function (Event) {
    this.origin.scrCoords[2] -= this.canvasHeight*0.1;
    this.moveOrigin();
};

/**
 * This method is called by the browser when the left mouse button is released.
 * @param {Event} Event The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseUpListener = function (evt) {
    // redraw with high precision
    this.updateQuality = this.BOARD_QUALITY_HIGH;
    
    // release mouseup listener
    JXG.removeEvent(document, 'mouseup', this.mouseUpListener, this);
    
    // if origin was moved update everything
    if(this.mode == this.BOARD_MODE_MOVE_ORIGIN) {
        this.moveOrigin();
    } else {
        var save = this.reducedUpdate; this.reducedUpdate = false;
        this.fullUpdate();
        this.reducedUpdate = save; 
    }

    this.mode = this.BOARD_MODE_NONE;
    // release dragged object
    this.drag_obj = null;
};

/**
 * This method is called by the browser when the mouse is moved.
 * @param {Event} Evt The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseDownListener = function (Evt) {
    var el;
    var cPos = this.getRelativeMouseCoordinates(Evt);
    // position of mouse cursor relative to containers position of container
    var absPos = JXG.getPosition(Evt);
    var dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];
    
    if(Evt.shiftKey) {
        this.drag_dx = dx - this.origin.scrCoords[1];
        this.drag_dy = dy - this.origin.scrCoords[2];
        this.mode = this.BOARD_MODE_MOVE_ORIGIN;
        //Event.observe(this.container, 'mouseup', this.mouseUpListener.bind(this));
        JXG.addEvent(document, 'mouseup', this.mouseUpListener, this);
        return;
    }
    if (this.mode==this.BOARD_MODE_CONSTRUCT) return;

    this.mode = this.BOARD_MODE_DRAG;
    if (this.mode==this.BOARD_MODE_DRAG) {   
        for(el in this.objects) {
            if( (this.objects[el].hasPoint != undefined)
                    && (this.objects[el].hasPoint(dx, dy))
                    && ((this.objects[el].type == JXG.OBJECT_TYPE_POINT) || (this.objects[el].type == JXG.OBJECT_TYPE_GLIDER) 
                        /*|| (!this.geonextCompatibilityMode && this.objects[el].type == JXG.OBJECT_TYPE_LINE)  // not yet
                        || (!this.geonextCompatibilityMode && this.objects[el].type == JXG.OBJECT_TYPE_CIRCLE)
                        || (!this.geonextCompatibilityMode && this.objects[el].type == JXG.OBJECT_TYPE_CURVE)*/ )
                    && (this.objects[el].visProp['visible'])
                    && (!this.objects[el].fixed)) {
                this.drag_obj = this.objects[el];
                // Points are preferred:
                if ((this.objects[el].type == JXG.OBJECT_TYPE_POINT) || (this.objects[el].type == JXG.OBJECT_TYPE_GLIDER)) {
                    break;
                }
            }
        }
    }

    // if no draggable object can be found, get outta here immediately
    if(this.drag_obj == null) {
        this.mode = this.BOARD_MODE_NONE;
        return;
    }

    /**
      * New mouse position in screen coordinates.
      */
    this.dragObjCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx,dy], this);
    JXG.addEvent(document, 'mouseup', this.mouseUpListener,this);
};

/**
 * This method is called by the browser when the left mouse button is clicked.
 * @param {Event} Event The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseMoveListener = function (Event) {
    var el;
    var cPos = this.getRelativeMouseCoordinates(Event);

    // position of mouse cursor relative to containers position of container
    var absPos = JXG.getPosition(Event);
    var x = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var y = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];

    this.updateQuality = this.BOARD_QUALITY_LOW;

    
    this.dehighlightAll(x,y);
    if(this.mode != this.BOARD_MODE_DRAG) {
        this.renderer.hide(this.infobox);
    }
    
    if(this.mode == this.BOARD_MODE_MOVE_ORIGIN) { 
        this.origin.scrCoords[1] = x - this.drag_dx;
        this.origin.scrCoords[2] = y - this.drag_dy;
        this.moveOrigin();
    }
    else if(this.mode == this.BOARD_MODE_DRAG) {
        var newPos = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(x,y), this);
        if(this.drag_obj.type == JXG.OBJECT_TYPE_POINT 
            || this.drag_obj.type == JXG.OBJECT_TYPE_LINE 
            || this.drag_obj.type == JXG.OBJECT_TYPE_CIRCLE
            || this.drag_obj.type == JXG.OBJECT_TYPE_CURVE) {

            if ((this.geonextCompatibilityMode && this.drag_obj.type==JXG.OBJECT_TYPE_POINT) || this.drag_obj.group.length != 0) {
                // This is for performance reasons with GEONExT files and for groups (transformations do not work yet with groups)
                this.drag_obj.setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
            } else {
                this.drag_obj.setPositionByTransform(JXG.COORDS_BY_USER, 
                    newPos.usrCoords[1]-this.dragObjCoords.usrCoords[1], 
                    newPos.usrCoords[2]-this.dragObjCoords.usrCoords[2]);
                // Save new mouse position in screen coordinates.
                this.dragObjCoords = newPos; 
            }
            this.update();
        } else if(this.drag_obj.type == JXG.OBJECT_TYPE_GLIDER) {
            var oldCoords = this.drag_obj.coords;
            // First the new position of the glider is set to the new mouse position
            this.drag_obj.setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
            // Then, from this position we compute the projection to the object the glider on which the glider lives.
            if(this.drag_obj.slideObject.type == JXG.OBJECT_TYPE_CIRCLE) {
                this.drag_obj.coords = this.algebra.projectPointToCircle(this.drag_obj, this.drag_obj.slideObject);
            } else if (this.drag_obj.slideObject.type == JXG.OBJECT_TYPE_LINE) {
                this.drag_obj.coords = this.algebra.projectPointToLine(this.drag_obj, this.drag_obj.slideObject);
            }
            if(this.drag_obj.group.length != 0) {
                this.drag_obj.group[this.drag_obj.group.length-1].dX = this.drag_obj.coords.scrCoords[1] - oldCoords.scrCoords[1];
                this.drag_obj.group[this.drag_obj.group.length-1].dY = this.drag_obj.coords.scrCoords[2] - oldCoords.scrCoords[2];
                this.drag_obj.group[this.drag_obj.group.length-1].update(this);
            } else {
                this.update(this.drag_obj);
            }
        }
        this.updateInfobox(this.drag_obj);
    }
    else { // BOARD_MODE_NONE or BOARD_MODE_CONSTRUCT
        // Elements  below the mouse pointer which are not highlighted are highlighted.
        for(el in this.objects) {
            if((this.objects[el].hasPoint != undefined) && (this.objects[el].hasPoint(x, y)) && (this.objects[el].visProp['visible'] == true)) {
                //this.renderer.highlight(this.objects[el]);

		// this is required in any case because otherwise the box won't be shown until the point is dragged
                this.updateInfobox(this.objects[el]);
                if(this.highlightedObjects[el] == null) { // highlight only if not highlighted
                    this.objects[el].highlight();
                    this.highlightedObjects[el] = this.objects[el];
                }
            }
        }
    }
};

/**
 * Updates and displays a little info box to show coordinates of current selected points.
 * @param {JXG.GeometryElement} el A GeometryElement
 * @private
 */
JXG.Board.prototype.updateInfobox = function(el) {
    var x, y;
    if((el.elementClass == JXG.OBJECT_CLASS_POINT) && el.showInfobox) {
        this.infobox.setCoords(el.coords.usrCoords[1]*1+this.infobox.distanceX/(this.unitX*this.zoomX),
                               el.coords.usrCoords[2]*1+this.infobox.distanceY/(this.unitY*this.zoomY));
        x = Math.abs(el.coords.usrCoords[1]);
        if (x>0.1) {
            x = el.coords.usrCoords[1].toFixed(2);
        } else if (x>=0.01) {
            x = el.coords.usrCoords[1].toFixed(4);
        } else if (x>=0.0001) {
            x = el.coords.usrCoords[1].toFixed(6);
        } else {
            x = el.coords.usrCoords[1];
        }
        y = Math.abs(el.coords.usrCoords[2]);
        if (y>0.1) {
            y = el.coords.usrCoords[2].toFixed(2);
        } else if (y>=0.01) {
            y = el.coords.usrCoords[2].toFixed(4);
        } else if (y>=0.0001) {
            y = el.coords.usrCoords[2].toFixed(6);
        } else {
            y = el.coords.usrCoords[2];
        }
        
        //this.infobox.nameHTML = '<span style="color:#bbbbbb;">(' + x + ', ' + y + ')</span>';
        //this.infobox.nameHTML = '(' + el.coords.usrCoords[1] + ', ' + el.coords.usrCoords[2] + ')';
        this.highlightInfobox(x,y,el);
        this.renderer.show(this.infobox);
        this.renderer.updateText(this.infobox);
    }
};

JXG.Board.prototype.highlightInfobox = function(x,y,el) {
    this.infobox.setText('<span style="color:#bbbbbb;">(' + x + ', ' + y + ')</span>');
}

/**
 * Remove highlighting of all elements.
 * @private
 */
JXG.Board.prototype.dehighlightAll = function(x,y) {
    for(var Element in this.highlightedObjects) {
        //this.renderer.noHighlight(this.highlightedObjects[Element]);
        if((this.highlightedObjects[Element].hasPoint == undefined) || 
           (!this.highlightedObjects[Element].hasPoint(x, y)) || 
           (this.highlightedObjects[Element].visProp['visible'] == false)) { // dehighlight only if necessary
                this.highlightedObjects[Element].noHighlight();
                delete(this.highlightedObjects[Element]);
        }
    }
};

/**
 * In case of snapToGrid activated this method caclulates the screen coords of mouse "snapped to grid".
 * @param {int} x X coordinate in screen coordinates
 * @param {int} y Y coordinate in screen coordinates
 */
JXG.Board.prototype.getScrCoordsOfMouse = function (x,y) {
    if(this.snapToGrid) {
        var newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);
        newCoords.setCoordinates(JXG.COORDS_BY_USER,
            [Math.round((newCoords.usrCoords[1])*this.snapSizeX)/this.snapSizeX,
             Math.round((newCoords.usrCoords[2])*this.snapSizeY)/this.snapSizeY]);
        return [newCoords.scrCoords[1], newCoords.scrCoords[2]];
    } else {
        return [x,y];
    }
};

/**
 * In case of snapToGrid activated this method caclulates the user coords of mouse "snapped to grid".
 * @param {Event} Evt Event object containing the mouse coordinates.
 */
JXG.Board.prototype.getUsrCoordsOfMouse = function (Evt) {    
    var cPos = this.getRelativeMouseCoordinates(Evt);
    //var x = Event.pointerX(Evt) - cPos[0];
    //var y = Event.pointerY(Evt) - cPos[1];
    var absPos = JXG.getPosition(Evt);
    var x = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var y = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];

    var newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);
    if(this.snapToGrid) {
        newCoords.setCoordinates(JXG.COORDS_BY_USER,
            [Math.round((newCoords.usrCoords[1])*this.snapSizeX)/this.snapSizeX,
             Math.round((newCoords.usrCoords[2])*this.snapSizeY)/this.snapSizeY]);
    }
    return [newCoords.usrCoords[1], newCoords.usrCoords[2]];
};

/**
 * Collects all elements under current mouse position plus current user coordinates of mouse cursor.
 * @param {Event} Evt Event object containing the mouse coordinates.
 * @type Array
 * @return Array of elements at the current mouse position plus current user coordinates of mouse.
 * @private
 */
JXG.Board.prototype.getAllUnderMouse = function (Evt) {
    var elList = this.getAllObjectsUnderMouse(Evt);
    elList.push(this.getUsrCoordsOfMouse(Evt));
    return elList;
    //return {"elList":elList, "coords":this.getUsrCoordsOfMouse(Evt)};
};

/**
 * Collects all elements under current mouse position.
 * @param {Event} Evt Event object containing the mouse coordinates.
 * @type Array
 * @return Array of elements at the current mouse position.
 * @private
 */
JXG.Board.prototype.getAllObjectsUnderMouse = function (Evt) {
    var cPos = this.getRelativeMouseCoordinates(Evt);
    
    // mouse position relative to container
    //var dx = Event.pointerX(Evt) - cPos[0];
    //var dy = Event.pointerY(Evt) - cPos[1];
    var absPos = JXG.getPosition(Evt);
    var dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];
    var elList = [];
    for (var el in this.objects) {
        if (this.objects[el].visProp['visible'] && this.objects[el].hasPoint(dx, dy)) {
            elList.push(this.objects[el]);
        }
    }
    return elList;
};

/**
 * Sets the board mode.
 * @param {int} mode The board mode the board should be set to. Possible values are
 * <li><ul>BOARD_MODE_NONE</ul><ul>BOARD_MODE_DRAG</ul><ul>BOARD_MODE_CONSTRUCT</ul><ul>BOARD_MODE_MOVE_ORIGIN</ul></li>
 * @private
 */
JXG.Board.prototype.setBoardMode = function (mode) {
    this.mode = mode;
};

/**
 * Moves the origin and initializes an update of all elements.
 * @private
 */
JXG.Board.prototype.moveOrigin = function () {
    for(var Element in this.objects) {
        if( (this.objects[Element].elementClass == JXG.OBJECT_CLASS_POINT) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_CURVE) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_AXIS) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_TEXT) ) {
            if((this.objects[Element].type != JXG.OBJECT_TYPE_CURVE) && (this.objects[Element].type != JXG.OBJECT_TYPE_AXIS))
                this.objects[Element].coords.usr2screen();
        }
    }
    
    this.clearTraces();
    
    this.fullUpdate();
    if(this.hasGrid) {
        this.renderer.removeGrid(this);
        this.renderer.drawGrid(this);
    }
};

/**
 * Registers a point at the board and adds it to the renderer.
 * @param {JXG.Point} obj The point to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addPoint = function (obj) {   
    var number = this.numObjects;
    this.numObjects++;
    var elementId = obj.id;
     
    // Falls Id nicht vergeben, eine neue generieren:
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'P' + number;
    }
    if (obj.hasLabel) {
        obj.label.content.id = elementId+"Label";
    } 
    
    // Objekt in die assoziativen Arrays einfuegen
    this.objects[elementId] = obj;
    this.elementsByName[obj.name] = obj;
    
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    if (obj.hasLabel) {
        this.addText(obj.label.content);
    }
    
    this.renderer.drawPoint(obj);
    if (obj.hasLabel) {
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }

    return elementId;
};

/**
 * Registers a line at the board and adds it to the renderer.
 * @param {JXG.Line} obj The line to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addLine = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    
    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'L' + number;
    }

    if (obj.hasLabel) {
        obj.label.content.id = elementId+"Label";
    }
    
    // Objekt in das assoziative Array einfuegen    
    this.objects[elementId] = obj;

    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    this.renderer.drawLine(obj);
    if (obj.hasLabel) {
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }
    
    return elementId;
};

/**
 * Registers a circle at the board and adds it to the renderer.
 * @param {JXG.Circle} obj The circle to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addCircle = function(obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
       elementId = this.id + 'C' + number;
    }
    if (obj.hasLabel) {
        obj.label.content.id = elementId+"Label";
    }
    
    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
       
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    
    if (obj.hasLabel) {
        this.addText(obj.label.content);
    }
    
    this.renderer.drawCircle(obj);
    if (obj.hasLabel) {
        this.renderer.drawText(obj.label.content);
    }

    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }    
    return elementId;
};

/**
 * Registers a polygon at the board and adds it to the renderer.
 * @param {JXG.Polygon} obj The polygon to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addPolygon = function(obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Py' + number;
    }
    if(obj.hasLabel) {
        obj.label.content.id = elementId+"Label";
    }
    
    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
 
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    
    if(obj.hasLabel) {
        this.addText(obj.label.content);  
    }
    
    this.renderer.drawPolygon(obj);
    
    if(obj.hasLabel) {
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }   
    
    return elementId;
};

/**
 * Registers a arc at the board and adds it to the renderer.
 * @param {JXG.Arc} obj The arc to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addArc = function(obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Ac' + number;
    }
    obj.id = elementId;    
    if(obj.hasLabel) {
        obj.label.content.id = elementId+"Label";    
    }
        
    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
 
    if(obj.hasLabel) {    
        this.addText(obj.label.content);
    }

    // Objekt an den Renderer zum Zeichnen uebergeben    
    this.renderer.drawArc(obj);

    if(obj.hasLabel) {     
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }       

    return elementId;
};

/**
 * Registers a sector at the board and adds it to the renderer.
 * @param {JXG.Sector} obj The sector to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addSector = function(obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Sc' + number;
    }

    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
 
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    // nichts zeichnen, Kindelemente werden einzeln gezeichnet

    return elementId;
};

/**
 * Registers an angle at the board and adds it to the renderer.
 * @param {JXG.Angle} obj The angle to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addAngle = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    
    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Ag' + number;
    }
    if(obj.hasLabel) {
        obj.label.content.id = elementId+"Label";    
    }    
    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
 
    if(obj.hasLabel) {    
        this.addText(obj.label.content);
    }

    // Objekt an den Renderer zum Zeichnen uebergeben    
    this.renderer.drawAngle(obj);

    if(obj.hasLabel) {     
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }           
    
    return elementId;
};

/**
 * Registers a curve at the board and adds it to the renderer.
 * @param {JXG.Curve} obj The curve to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addCurve = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    
    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'G' + number;
    }
    if(obj.hasLabel) {
        obj.label.content.id = elementId+"Label";    
    }    
    // Objekt in das assoziative Array einfuegen    
    this.objects[elementId] = obj;

    if(obj.hasLabel) {    
        this.addText(obj.label.content);
    }    
    
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    this.renderer.drawCurve(obj);
    
    if(obj.hasLabel) {     
        this.renderer.drawText(obj.label.content);
    }    
    
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }
    
    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }        
    
    return elementId;
};

/**
 * Registers a chart at the board and adds it to the renderer.
 * @param {JXG.Chart} obj The chart to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addChart = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    
    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Chart' + number;
    }
    
    // Objekt in das assoziative Array einfuegen    
    this.objects[elementId] = obj;

    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    //this.renderer.drawCurve(obj);
    
    return elementId;
};

/**
 * Adds the midpoint between two points to the board and the renderer.
 * @param {JXG.Point} p1 First point.
 * @param {JXG.Point} p2 Second point.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addMidpoint = function(p1, p2, id, name) {
   var point1 = JXG.getReference(this, p1);
   var point2 = JXG.getReference(this, p2);
   
   var midpointCoords = this.algebra.midpoint(point1,point2).usrCoords.slice(1);
   var p = new JXG.Point(this, midpointCoords, id, name, true);
   p.fixed = true;
   
   point1.addChild(p);
   point2.addChild(p);
   
   p.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.midpoint(point1,point2);
            // Label mitschieben
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            if(this.traced) {
                this.cloneToBackground(true);
            }            
        }
   };
   return p;
};

/**
 * Adds the reflection of a point off a line to the board and the renderer.
 * @param {JXG.Line} line Mirror line.
 * @param {JXG.Point} point Point to reflect.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addReflection = function(line, point, id, name) {
   var po = JXG.getReference(this, point);
   var li = JXG.getReference(this, line);
   
   var reflectCoords = this.algebra.reflection(li,po).usrCoords.slice(1);
   var p = new JXG.Point(this, reflectCoords, id, name, true);
   p.fixed = true;
   
   po.addChild(p);
   li.addChild(p);
   
   p.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.reflection(li,po);
            // Label mitschieben
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            if(this.traced) {
                this.cloneToBackground(true);
            }                        
        }
   };
   return p;
};

/**
 * Adds a copy of point to the board and the renderer that is rotated by angle phi around rotpoint.
 * @param {JXG.Point} rotpoint The resulting point will be rotated around this point.
 * @param {JXG.Point} point This point will be copied.
 * @param {float} phi The point will be rotated by this angle.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addRotation = function(rotpoint, point, phi, id, name) {
    var po = JXG.getReference(this, point);
    var ropo = JXG.getReference(this, rotpoint);
   
    var rotCoords = this.algebra.rotation(ropo,po,phi).usrCoords.slice(1);
    var p = new JXG.Point(this, rotCoords, id, name, true);
    p.fixed = true;
   
    po.addChild(p);
    ropo.addChild(p);
   
    p.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.rotation(ropo,po,phi);
            // Label mitschieben
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            this.needsUpdate = false;
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
    };
    return p;
};

/**
 * Adds a parallel to the line through the point to the board and the renderer.
 * @param {JXG.Line} l The resulting line will be parallel to this one.
 * @param {JXG.Point} p The parallel will contain this point.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated. 
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addParallel = function(l, p, id, name) {
    var point = JXG.getReference(this, p);
    var line = JXG.getReference(this, l);
 
    var number = this.numObjects;
    number++;
    if((id == '') || (id == null)) {
        id = this.id + 'L' + number;
    }
 
   // versteckter Hilfs-Punkt
   var p2coords = this.algebra.parallel(line.point1, line.point2, point).usrCoords.slice(1);
   var point2 = new JXG.Point(this, p2coords, id+"P2", name+"P2", false);

   point2.fixed = true;
   point.addChild(point2); // notwendig, um auch den Punkt upzudaten
   
   var parallel = new JXG.Line(this, point.id, point2.id, id, name);
  
   //line.addChild(point2); // notwendig, um auch den Punkt upzudaten
   
   parallel.update = function() {
        if (this.needsUpdate) { 
            this.point2.coords = this.board.algebra.parallel(line.point1, line.point2, point);
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }    
        }
   };
   return parallel;
};

/**
 * Adds an arrow parallel to the given arrow with the given point as startpoint to the board and the renderer.
 * @param {JXG.Arrow} a The resulting arrow will be parallel to this one.
 * @param {JXG.Point} p The arrow will start at this point.
 * @param {String} arrowId Unique identifier for the resulting arrow object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} pointId Unique identifier for the resulting point object.  If null or an empty string is given,
 * an unique id will be generated by Board 
 * @param {String} arrowName Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @param {String} pointName Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated. 
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addArrowParallel = function(a, p, arrowId, pointId, arrowName, pointName) {
    var point = JXG.getReference(this, p);
    var arrow = JXG.getReference(this, a);
    
    var number = this.numObjects;
    number++;
    if((arrowId == '') || (arrowId == null)) {
        arrowId = this.id + 'A' + number;
    }
    number++;
    if((pointId == '') || (pointId == null)) {
        pointId = this.id + 'P' + number;
    }    
 
   var p2coords = this.algebra.parallel(arrow.point1, arrow.point2, point).usrCoords.slice(1);
   var point2 = new JXG.Point(this, p2coords, pointId, pointName, true);

   point2.fixed = true;
   point.addChild(point2); // notwendig, um auch den Punkt upzudaten
   arrow.addChild(point2);
   
   var parallelArrow = new JXG.Line(this, point.id, point2.id, arrowId, arrowName);
   parallelArrow.setStraight(false,false);
   parallelArrow.setArrow(false,true);
  
   //line.addChild(point2); // notwendig, um auch den Punkt upzudaten
   
   parallelArrow.update = function() {
        if (this.needsUpdate) { 
            this.point2.coords = this.board.algebra.parallel(arrow.point1, arrow.point2, point);
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }    
        }
   };
   
   point2.update = function() {
        if (this.needsUpdate) { 
            this.coords = this.board.algebra.parallel(arrow.point1, arrow.point2, point);
            if(this.label.content.visProp['visible']) {
                //this.label.setCoordinates(this.coords);
                this.label.content.update();
            }
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
   };   
   return [parallelArrow, point2];
};

/**
 * Adds a point to the board and the renderer that has the same distance to the given point as the defining
 * points of the line and defines a parallel to the line together with the point.
 * @param {JXG.Point} p A Point.
 * @param {JXG.Point} p A Point.
 * @param {JXG.Point} p A Point.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addParallelPoint = function(p1, p2, p3, id, name) {
    var number = this.numObjects;
    number++;
    if((id == '') || (id == null)) {
        id = this.id + 'P' + number;
    }
 
    p1 = JXG.getReference(this, p1);
    p2 = JXG.getReference(this, p2);
    p3 = JXG.getReference(this, p3);
    var p2coords = this.algebra.parallel(p1, p2, p3).usrCoords.slice(1);
    var point2 = new JXG.Point(this, p2coords, id, name, true);
    point2.fixed = true;
    
    p1.addChild(point2); 
    p3.addChild(point2); 
    if (p1.type == JXG.OBJECT_TYPE_POINT) {
        p2.addChild(point2); 
    }
    
    point2.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.parallel(p1,p2,p3);
            // Label mitschieben
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
   };
   return point2;
};

/**
 * Registers a arrow at the board and adds it to the renderer.
 * @param {JXG.Arrow} obj The arrow to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addArrow = function(obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'A' + number;
    }

    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
 
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    this.renderer.drawArrow(obj);

    return elementId;
};

/**
 * Adds a line to the board and renderer which is orthogonal to the given line and contains point.
 * @param {JXG.Line} l A line.
 * @param {JXG.Point} p A Point.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addNormal = function(l, p, id, name) {
    var point = JXG.getReference(this, p);
    var line = JXG.getReference(this, l);
   
    var number = this.numObjects;
    number++;
    if((id == '') || (id == null)) {
        id = this.id + 'L' + number;
    }
   
    // versteckter Hilfs-Punkt
    var erg = this.algebra.perpendicular(line, point);
    var p2coords = erg[0].usrCoords.slice(1);
    var point2 = new JXG.Point(this, p2coords, id+"P2", '', false);
    point2.fixed = true; 
    point.addChild(point2); // notwendig, um auch den Punkt upzudaten
    line.addChild(point2); // notwendig, um auch den Punkt upzudaten
    
    var perpendicular;
    if(erg[1]) {
        perpendicular = new JXG.Line(this, point2.id, point.id, id, name);
    }
    else {
        perpendicular = new JXG.Line(this, point.id, point2.id, id, name);
    }
    perpendicular.changed = erg[1];   
    //point.addChild(perpendicular);
    //line.addChild(perpendicular);
   
    perpendicular.update = function() {
        if (this.needsUpdate) {
            var erg = this.board.algebra.perpendicular(line, point);
            point2.coords = erg[0];            
            if(this.changed != erg[1]) {
                var tmp = this.point1;
                this.point1 = this.point2;
                this.point2 = tmp;
            }
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
    };
    return perpendicular;
};

/**
 * Adds a line to the board and renderer which is orthogonal to the given line and contains point
 * and adds a point to the board contained by the line and the perpendicular.
 * @param {JXG.Line} l A line.
 * @param {JXG.Point} p A Point.
 * @param {String} idL Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} nameL Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @param {String} idP Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} nameP Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type Array
 * @return Array of element ids of the created objects. First element is id of line, second is id of point.
 * @private
 */
JXG.Board.prototype.addPerpendicular = function(l, p, idL, nameL, idP, nameP) {
    var point = JXG.getReference(this, p);
    var line = JXG.getReference(this, l);
   
    var number = this.numObjects;
    number ++;
    if((idL == '') || (idL == null)) {
        idL = this.id + 'L' + number;
    }
    number++;
    if((idP == '') || (idP == null)) {
        idP = this.id + 'P' + number;
    }    
   
    var erg = this.algebra.perpendicular(line, point);
    var p2coords = erg[0].usrCoords.slice(1);
    var point2 = new JXG.Point(this, p2coords, idP, nameP, true);
    point2.fixed = true;  
    point.addChild(point2); // notwendig, um auch den Punkt upzudaten
    line.addChild(point2); // notwendig, um auch den Punkt upzudaten
    
    var perpendicular;
    if(erg[1]) { // is needed to make sure that intersections with perpendiculars from GEONExT are drawn in the right order
        perpendicular = new JXG.Line(this, point2.id, point.id, idL, nameL);
    }
    else {
        perpendicular = new JXG.Line(this, point.id, point2.id, idL, nameL);
    }
    perpendicular.setStraight(false, false);
    perpendicular.changed = erg[1]; 
   
    //point.addChild(perpendicular);
    //line.addChild(perpendicular);
   
    perpendicular.update = function() {
        if (this.needsUpdate) {
            var erg = this.board.algebra.perpendicular(line, point);
            point2.coords = erg[0];
            if(this.changed != erg[1]) { // is needed to make sure that intersections with perpendiculars from GEONExT are drawn in the right order
                var tmp = this.point1;
                this.point1 = this.point2;
                this.point2 = tmp;
            }
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
    };
    return [perpendicular, point2];
};

/**
 * Adds a point to the board contained by the line and the perpendicular through the point.
 * @param {JXG.Line} l A line.
 * @param {JXG.Point} p A Point.
 * @param {String} idP Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} nameP Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type Array
 * @return Array of element ids of the created objects. First element is id of line, second is id of point.
 * @private
 */
JXG.Board.prototype.addPerpendicularPoint = function(l, p, idP, nameP) {

    var point = JXG.getReference(this, p);
    var line = JXG.getReference(this, l);
   
    var number = this.numObjects;
    number++;
    if((idP == '') || (idP == null)) {
        idP = this.id + 'P' + number;
    }    

    var p2coords = this.algebra.perpendicular(line, point)[0].usrCoords.slice(1);
    var point2 = new JXG.Point(this, p2coords, idP, nameP, true);
    point2.fixed = true;  
   
    point.addChild(point2); 
    line.addChild(point2); 
   
    point2.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.perpendicular(line, point)[0];
            // Label mitschieben
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
   };
   return point2;
};

/**
 * Adds a circumcenter and its midpoint defined by the given points.
 * @param {JXG.Point} point1 A Point.
 * @param {JXG.Point} point2 A Point.
 * @param {JXG.Point} point3 A Point.
 * @param {String} midpointId Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} midpointName Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @param {String} circleId Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} circleName Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type Array
 * @return Array of element ids of the created objects. First element is midpoint, second is circle.
 * @private
 */
JXG.Board.prototype.addCircumcenter = function(point1, point2, point3, midpointId, midpointName, circleId, circleName) {
    var p1 = JXG.getReference(this, point1);
    var p2 = JXG.getReference(this, point2);
    var p3 = JXG.getReference(this, point3);
   
    var midpointCoordinates = this.algebra.circumcenterMidpoint(p1, p2, p3);
    var midpoint = new JXG.Point(this, midpointCoordinates.usrCoords.slice(1), midpointId, midpointName, true);
    midpoint.fixed = true;

    p1.addChild(midpoint);
    p2.addChild(midpoint);
    p3.addChild(midpoint);
   
    var circumcircle = new JXG.Circle(this, 'pointRadius', midpoint.id, function(){ return this.midpoint.coords.distance(JXG.COORDS_BY_USER, p1.coords);} , circleId, circleName);

    p1.addChild(circumcircle);
    p2.addChild(circumcircle);
    p3.addChild(circumcircle);        
    
    midpoint.update = function() {
        if (this.needsUpdate) {
            this.coords = this.board.algebra.circumcenterMidpoint(p1, p2, p3);
            if(this.label.content.visProp['visible']) {
                //this.label.setCoordinates(this.coords);
                this.label.content.update();
            }
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
    };
    circumcircle.update = function() {
        if (this.needsUpdate) { 
            this.updateRadius(); 
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }    
        }
    };
    return [midpoint, circumcircle];
};

/**
 * Adds the midpoint of a circumcenter defined by the given points to board and renderer.
 * @param {JXG.Point} point1 A Point.
 * @param {JXG.Point} point2 A Point.
 * @param {JXG.Point} point3 A Point.
 * @param {String} midpointId Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} midpointName Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addCircumcenterMidpoint = function(point1, point2, point3, midpointId, midpointName) {
    var p1 = JXG.getReference(this, point1);
    var p2 = JXG.getReference(this, point2);
    var p3 = JXG.getReference(this, point3);
   
    var mp = this.algebra.circumcenterMidpoint(p1, p2, p3).usrCoords.slice(1);
    var midpoint = new JXG.Point(this, mp, midpointId, midpointName, true);
    midpoint.fixed = true;

    p1.addChild(midpoint);
    p2.addChild(midpoint);
    p3.addChild(midpoint);

    midpoint.update = function() {        
        if (this.needsUpdate) {
            this.coords = this.board.algebra.circumcenterMidpoint(p1, p2, p3);
            // Label mitschieben
            if(this.label.content.visProp['visible']) {
                //this.label.setCoordinates(this.coords);
                this.label.content.update();
            }
            if(this.traced) {
                this.cloneToBackground(true);
            }                
        }
    };
    return midpoint;
};

/**
 * Registers an intersection at the board and adds it to the renderer.
 * @param {JXG.Intersection} obj The intersection to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addIntersection = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    var elementId = obj.id;
     
    // Falls Id nicht vergeben, eine neue generieren:
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'I' + number;
    }
    
    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;
    
    obj.id = elementId;

    obj.intersect1.addChild(obj);
    obj.intersect2.addChild(obj);

    return elementId;
};

/**
 * Adds the bisection of the given points to board and renderer.
 * @param {JXG.Point} point1 A Point.
 * @param {JXG.Point} point2 A Point.
 * @param {JXG.Point} point3 A Point.
 * @param {String} id Unique identifier for this object.  If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name, displayed on the board.  If null or an
 * empty string is given, an unique name will be generated.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addAngleBisector = function(p1, p2, p3, id, name) {
   var point1 = JXG.getReference(this, p1);
   var point2 = JXG.getReference(this, p2);
   var point3 = JXG.getReference(this, p3);
   
    var number = this.numObjects;
    number++;
    if((id == '') || (id == null)) {
        id = this.id + 'L' + number;
    }
 
   // versteckter Hilfs-Punkt
   var pCoords = this.algebra.angleBisector(point1, point2, point3).usrCoords.slice(1);
   var point = new JXG.Point(this, pCoords, id+"P2", '', false);
   point.fixed = true;  
   
   point1.addChild(point); // notwendig, um auch den Punkt upzudaten
   point2.addChild(point); // notwendig, um auch den Punkt upzudaten
   point3.addChild(point); // notwendig, um auch den Punkt upzudaten    

   var bisector = new JXG.Line(this, p2, point.id, id, name);
   bisector.setStraight(false, true);

   //point1.addChild(bisector);
   //point2.addChild(bisector);
   //point3.addChild(bisector);

   bisector.update = function() {
        if (this.needsUpdate) {
            this.point2.coords = this.board.algebra.angleBisector(point1, point2, point3);
            this.updateStdform(); // For the new intersection functions
            if(this.traced) {
                this.cloneToBackground(true);
            }        
        }
   };
   return bisector;
};

/**
 * Registers a text at the board and adds it to the renderer.
 * @param {JXG.Text} obj The text to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addText = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    
    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'T' + number;
    }
    
    // Objekt in das assoziative Array einfuegen    
    this.objects[elementId] = obj;

    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    if(!obj.isLabel) {
        this.renderer.drawText(obj);
        if(!obj.visProp['visible']) {
            this.renderer.hide(obj);
        }
    }
    
    return elementId;
};

/**
  * Add conditional updates to the elements.
  * @param {string} str String containing coniditional update in geonext syntax
  */
JXG.Board.prototype.addConditions = function (str) {
    var res = null;
    var plaintext = 'var el,x,y,c;\n';
    var i = str.indexOf('<data>');
    var j = str.indexOf('</data>');
    if (i<0) {
        return;
    }
    while (i>=0) {
        var term = str.slice(i+6,j); // throw away <data>
        var m = term.indexOf('=');
        var left = term.slice(0,m);
        var right = term.slice(m+1);
        m = left.indexOf('.'); // Dies erzeugt Probleme bei Variablennamen der Form " Steuern akt."
        var name = left.slice(0,m);    //.replace(/\s+$/,''); // do NOT cut out name (with whitespace)
        var el = this.elementsByName[JXG.unescapeHTML(name)];

        var property = left.slice(m+1).replace(/\s+/g,'').toLowerCase(); // remove whitespace in property
        right = this.algebra.geonext2JS(right);
        right = right.replace(/this\.board\./g,'this.');

        // Debug 
        if (typeof this.elementsByName[name]=='undefined'){
            alert("debug conditions: |"+name+"| undefined");
        }
        plaintext += "el = this.objects[\"" + el.id + "\"];\n";
        //plaintext += "if (el==undefined) { $('debug').value = \"" + name + "\"; } else {\n";
        switch (property) {
            case 'x': 
                plaintext += 'y=el.coords.usrCoords[2];\n';  // y stays
                //plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,['+(right) +',y],this);\n';
                plaintext += 'el.setPositionDirectly(JXG.COORDS_BY_USER,'+(right) +',y);\n';
                plaintext += 'el.update();\n';
                break;
            case 'y': 
                plaintext += 'x=el.coords.usrCoords[1];\n';  // x stays
                plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,[x,'+(right)+'],this);\n';
                //plaintext += 'el.update();\n';
                break;
            case 'visible': 
                plaintext += 'c='+(right)+';\n'; 
                plaintext += 'if (c) {el.showElement();} else {el.hideElement();}\n';
                break;
            case 'position': 
                plaintext += 'el.position = ' + (right) +';\n';
                plaintext += 'el.update();\n';
                //plaintext += 'this.updateElements();\n';
                break;
            case 'stroke': 
                plaintext += 'el.strokeColor = ' + (right) +';\n';
                break;
            case 'strokewidth': 
                plaintext += 'el.strokeWidth = ' + (right) +';\n';   // wird auch bei Punkten verwendet, was nicht realisiert ist.
                break;
            case 'label': 
                //plaintext += 'var color = ' + (right) +';\n';
                //plaintext += 'el.setProperty("labelColor:color");\n';
                break;
            default:
                alert("property '" + property + "' in conditions not implemented:" + right);
                break;
        }
        //plaintext += "}\n";
        str = str.slice(j+7); // cut off "</data>"
        i = str.indexOf('<data>');
        j = str.indexOf('</data>');
    }
    plaintext += 'this.prepareUpdate();\n';
    plaintext += 'this.updateElements();\n';
    plaintext += 'return true;\n';
    //alert(plaintext);
    this.updateConditions = new Function(plaintext);
    this.updateConditions();
};

/**
 * Computes the commands in the conditions-section of the gxt file.
 * It is evaluated after an update, before the unsuspendRedraw.
 * The function is generated in @see #addConditions
 * @private
 */
JXG.Board.prototype.updateConditions = function() { return false; };

/**
 * Registers an image at the board and adds it to the renderer.
 * @param {JXG.Image} obj The image to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addImage = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    var elementId = obj.id;
     
    // Falls Id nicht vergeben, eine neue generieren:
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Im' + number;
    }
    
    // Objekt in die assoziativen Arrays einfuegen
    this.objects[elementId] = obj;
    this.elementsByName[obj.name] = obj;
    
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    
    this.renderer.drawImage(obj);
    if(!obj.visProp['visible']) {
       this.renderer.hide(obj);
    }
    
    return elementId;
};

/**
 * Draws an integral on the board.
 * @param {Array} interval Integration limits
 * @param {JXG.Curve} curve Integrated curve, must be of type 'plot'.
 * @type JXG.Polygon
 * @return Reference to the created polygon object.
 * @private
 */
JXG.Board.prototype.addIntegral = function (interval, curve, ids, names, atts) {
    if(!JXG.isArray(ids) || (ids.length != 5)) {
        ids = ['','','','',''];
    }
    if(!JXG.isArray(names) || (names.length != 5)) {
       names = ['','','','',''];
    }

    var points = [];
    
    var attribs = {};
    if( (typeof atts != 'undefined') && (atts != null))
        attribs = atts;

    attribs.name = names[0];
    attribs.id = ids[0];
    attribs.slideObject = curve;
    
    var start = 0;
    if(interval[0] > curve.points[0].usrCoords[1])
        start = interval[0];
    else
        start = curve.points[0].usrCoords[1];

    var pa_on_curve = this.createElement('point', [start, curve.yterm(start)], attribs);

    attribs.name = names[1];
    attribs.id = ids[1];
    attribs.visible = false;
    attribs.slideObject = null;

    var pa_on_axis = this.createElement('point', [function () { return pa_on_curve.X(); }, 0], attribs);

    points.push(pa_on_axis);
    points.push(pa_on_curve);
    
    pa_on_curve.addChild(pa_on_axis);    
    
    var fakePoint;
    for(var i=0; i < curve.numberPoints; i++) {
        if( (interval[0] <= curve.points[i].usrCoords[1]) && (curve.points[i].usrCoords[1] <= interval[1]) ) {
            fakePoint = {
                type: JXG.OBJECT_TYPE_POINT,
                elementClass: JXG.OBJECT_CLASS_POINT,
                addChild: function(el) { },
                X: function(){},
                Y: function(){},
                coords: curve.points[i]
            };
            points.push( fakePoint );
        }
    }
    
    attribs.name = names[2];
    attribs.id = ids[2];
    attribs.slideObject = curve;
    attribs.visible = true;
    var pb_on_curve = this.createElement('point', [points[points.length-1].coords.usrCoords[1], curve.yterm(points[points.length-1].coords.usrCoords[1])], attribs);
    
    attribs.name = names[3];
    attribs.id = ids[3];
    attribs.slideObject = null;
    attribs.visible = false;
    var pb_on_axis = this.createElement('point', [function () { return pb_on_curve.X(); }, 0], attribs);
    points.push(pb_on_curve);
    points.push(pb_on_axis);
    
    pb_on_curve.addChild(pb_on_axis);
    
    var Int = JXG.Math.Numerics.I([points[0].coords.usrCoords[1], points[points.length-1].coords.usrCoords[1]], curve.yterm);
    var t = this.createElement('text', [
        function () { return pb_on_curve.X() + 0.2; }, 
        function () { return pb_on_curve.Y() - 1.0; },
        function () {
                var Int = JXG.Math.Numerics.I([points[0].coords.usrCoords[1], points[points.length-1].coords.usrCoords[1]], curve.yterm);
                return '&int; = ' + (Int).toFixed(4);
            }
        ]);

    var attribs = {};
    if( (typeof atts != 'undefined') && (atts != null))
        attribs = atts;
    attribs.withLines = false;
    attribs.name = names[4];
    attribs.id = ids[4];
    attribs.visible = true;
    
    var p = this.createElement('polygon', points, attribs);
    
    p.update = function() {
        var fakePoint;
        var ps = [pa_on_axis, pa_on_curve];
        for(var i=0; i < curve.numberPoints; i++) {
            if( (pa_on_axis.X() <= curve.points[i].usrCoords[1]) && (curve.points[i].usrCoords[1] <= pb_on_axis.X()) ) {
                fakePoint = {
                    type: JXG.OBJECT_TYPE_POINT,
                    elementClass: JXG.OBJECT_CLASS_POINT,
                    addChild: function(el) { },
                    X: function(){},
                    Y: function(){},
                    coords: curve.points[i]
                };
                ps.push( fakePoint );
            }
        }
        ps.push(pb_on_curve);
        ps.push(pb_on_axis);
        ps.push(pa_on_axis);
        this.vertices = ps;
    };
    
    pa_on_curve.addChild(p);
    pb_on_curve.addChild(p);
    pa_on_curve.addChild(t);
    pb_on_curve.addChild(t);
    
    return p;//[pa_on_axis, pb_on_axis, p, t];
};

/**
 * Calculates adequate snap sizes.
 * @private
 */
JXG.Board.prototype.calculateSnapSizes = function() {
    var p1 = new JXG.Coords(JXG.COORDS_BY_USER,[0,0],this);
    var p2 = new JXG.Coords(JXG.COORDS_BY_USER,[1/this.gridX,1/this.gridY],this);
    var x = p1.scrCoords[1]-p2.scrCoords[1];
    var y = p1.scrCoords[2]-p2.scrCoords[2];
    
    this.snapSizeX = this.gridX;
    while(Math.abs(x) > 25) {
        this.snapSizeX *= 2;
        x /= 2;
    }
    
    this.snapSizeY = this.gridY;
    while(Math.abs(y) > 25) {
        this.snapSizeY *= 2;
        y /= 2;
    }    
};

/**
 * Apply update on all objects with the
 * new zoom-factors.
 * @private
 */
JXG.Board.prototype.applyZoom = function() {
    this.updateQuality = this.BOARD_QUALITY_HIGH;
    for(var Element in this.objects) {
        if( (this.objects[Element].elementClass == JXG.OBJECT_CLASS_POINT) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_CURVE) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_AXIS) ||
            (this.objects[Element].type == JXG.OBJECT_TYPE_TEXT) ) {
            if((this.objects[Element].type != JXG.OBJECT_TYPE_CURVE) && (this.objects[Element].type != JXG.OBJECT_TYPE_AXIS))
                this.objects[Element].coords.usr2screen();
        }
    }    
    this.calculateSnapSizes();
    
    this.clearTraces();

    this.fullUpdate();
    if(this.hasGrid) {
        this.renderer.removeGrid(this);
        this.renderer.drawGrid(this);
    }
};
 
/**
 * Zooms into the board.
 */
JXG.Board.prototype.zoomIn = function() {
    this.zoomX *= this.options.zoom.factor;
    this.zoomY *= this.options.zoom.factor;    
    this.applyZoom();
};

/**
 * Zooms out of the board.
 */
JXG.Board.prototype.zoomOut = function() {
    this.zoomX /= this.options.zoom.factor;
    this.zoomY /= this.options.zoom.factor;
    this.applyZoom();
};

/**
 * Resets zoom factor zu 1.
 */
JXG.Board.prototype.zoom100 = function() {
    this.zoomX = 1.0;
    this.zoomY = 1.0;
    this.applyZoom();
};

/**
 * Zooms the board so every visible point is shown. Keeps aspect ratio.
 */
JXG.Board.prototype.zoomAllPoints = function() {
    var ratio = this.zoomX / this.zoomY;
    var minX = 0; // (0,0) soll auch sichtbar bleiben
    var maxX = 0;
    var minY = 0;
    var maxY = 0;
    for(var Element in this.objects) {
        if( (this.objects[Element].elementClass == JXG.OBJECT_CLASS_POINT) &&
            this.objects[Element].visProp['visible']) {
            if(this.objects[Element].coords.usrCoords[1] < minX) {
                minX = this.objects[Element].coords.usrCoords[1];
            }
            if(this.objects[Element].coords.usrCoords[1] > maxX) {
                maxX = this.objects[Element].coords.usrCoords[1];
            }   
            if(this.objects[Element].coords.usrCoords[2] > maxY) {
                maxY = this.objects[Element].coords.usrCoords[2];
            }
            if(this.objects[Element].coords.usrCoords[2] < minY) {
                minY = this.objects[Element].coords.usrCoords[2];
            }                       
        }            
    }
    var border = 50;
    var borderX = border/(this.unitX*this.zoomX);
    var borderY = border/(this.unitY*this.zoomY);

    var distX = maxX - minX + 2*borderX;
    var distY = maxY - minY + 2*borderY;
    
    var newZoom = Math.min(this.canvasWidth/(this.unitX*distX), this.canvasHeight/(this.unitY*distY));
    var newZoomY = newZoom;
    var newZoomX = newZoom*ratio;
    
    var newOriginX = -(minX-borderX)*this.unitX*newZoomX;
    var newOriginY = (maxY+borderY)*this.unitY*newZoomY;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [newOriginX, newOriginY], this);
    this.zoomX = newZoomX;
    this.zoomY = newZoomY;
    
    this.applyZoom();
};

/**
 * Removes object from board and renderer.
 * @param {GeometryElement} object The object to remove.
 */
JXG.Board.prototype.removeObject = function(object) {
    object = JXG.getReference(this, object);

    /* Wenn weder die ID noch der Name des Objekts bekannt ist, einfach wieder zurueckgehen */
    if(object == undefined) {
        return;
    }
    
    try{
        /* Alle Kinder entfernen */
        for(var Elements in object.childElements) {
            object.childElements[Elements].board.removeObject(object.childElements[Elements]);
        }
        
        for(var el in this.objects) {
            if(typeof this.objects[el].childElements != 'undefined')
                delete(this.objects[el].childElements[object.id]);
        }
        
        /* Das Objekt selbst aus board.objects und board.elementsByName loeschen */
        delete(this.objects[object.id]);
        delete(this.elementsByName[object.name]);
        
        /* Alles weitere erledigt das Objekt selbst fuer uns. Ist sinnvoller, weil man sonst wieder unterscheiden muesste, was das fuer ein Objekt ist. */
        if(object.remove != undefined) object.remove();
    } catch(e) {
//        alert(object.id + ': Could not be removed, JS says:\n\n' + e);
    }
};

/**
 * Initialise some objects which are contained in every GEONExT construction by default, 
 * but are not contained in the gxt files.
 * @private
 */
JXG.Board.prototype.initGeonextBoard = function() {
    var p1 = new JXG.Point(this, [0,0],this.id + 'gOOe0','Ursprung',false);
    p1.fixed = true;
    var p2 = new JXG.Point(this, [1,0],this.id + 'gXOe0','Punkt_1_0',false);
    p2.fixed = true;
    var p3 = new JXG.Point(this, [0,1],this.id + 'gYOe0','Punkt_0_1',false);
    p3.fixed = true;
    var l1 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gXOe0', this.id + 'gXLe0','X-Achse');
    l1.hideElement();
    var l2 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gYOe0', this.id + 'gYLe0','Y-Achse');
    l2.hideElement();    
};

/**
 * Initialise the info box object which is used to display
 * the coordinates of points under the mouse pointer,
 * @private
 */
JXG.Board.prototype.initInfobox= function() {
    //this.infobox = new JXG.Label(this, '0,0', new JXG.Coords(JXG.COORDS_BY_USER, [0, 0], this), this.id + '__infobox');
    this.infobox = new JXG.Text(this, '0,0', '', [0,0], this.id + '__infobox',null, null, false);
    this.infobox.distanceX = -20; 
    this.infobox.distanceY = 25;
    //this.renderer.drawText(this.infobox);
    this.renderer.hide(this.infobox);
};

/**
 * Change the height and width of the board's container.
 * @param {int} canvasWidth New width of the container.
 * @param {int} canvasHeight New height of the container.
 */
JXG.Board.prototype.resizeContainer = function(canvasWidth, canvasHeight) {
    this.canvasWidth = 1*canvasWidth;
    this.canvasHeight = 1*canvasHeight;
    this.containerObj.style.width = (this.canvasWidth) + 'px';
    this.containerObj.style.height = (this.canvasHeight) + 'px';
};

/**
 * Lists the dependencies graph in a new HTML-window.
 */
JXG.Board.prototype.showDependencies = function() {
    var el;
    var t = '<p>\n';
    for (el in this.objects) {
        var i = 0;
        for (var c in this.objects[el].childElements) {
            i++;
        }
        if (i>=0) {
            t += '<b>' + this.objects[el].id + ':</b> ';
        }
        for (var c in this.objects[el].childElements) {
            t += this.objects[el].childElements[c].id+'('+this.objects[el].childElements[c].name+')'+', ';
        }
        t += '<p>\n';
    }
    t += '</p>\n';
    var f = window.open();
    f.document.open();
    f.document.write(t);
    f.document.close();
};

/**
 * Lists the XML code of the construction in a new HTML-window.
 */
JXG.Board.prototype.showXML = function() {
    var f = window.open("");
    f.document.open();
    f.document.write("<pre>"+JXG.escapeHTML(this.xmlString)+"</pre>");
    f.document.close();
};

/** 
 * Sets for all objects the needsUpdate flag to "true".
 * @param {Object,String} drag Element that caused the update.
 * @private
 */
JXG.Board.prototype.prepareUpdate = function(drag) {
    for(var el in this.objects) {
       this.objects[el].needsUpdate = true;
    }
};

/**
  * Runs through all elements and calls their update() method.
  * @param {Object,String} drag Element that caused the update.
  * @private
  */
JXG.Board.prototype.updateElements = function(drag) {
    drag = JXG.getReference(this, drag);
    
    var count = -1;
    if (!this.reducedUpdate) count = 1;
    for(var el in this.objects) {
        var pEl = this.objects[el];
        if (!this.needsFullUpdate && !pEl.needsRegularUpdate && pEl.afterFirstUpdate) { continue; }
        if (drag == null || pEl.id != drag.id) {
            if (count>=0 || !pEl.afterFirstUpdate || this.needsFullUpdate) { pEl.update(true); }
        } else {
            pEl.update(false);
            count = 5;
        }
        if (this.reducedUpdate) count--;
    }
};

/**
  * Runs through all elements and calls their update() method.
  * @param {Object,String} drag Element that caused the update.
  * @private
  */
JXG.Board.prototype.updateRenderer = function(drag) {
    var drag = JXG.getReference(this, drag);
    
    var count = -1;
    if (!this.reducedUpdate) count = 1;
    for(var el in this.objects) {
        var pEl = this.objects[el];
        if (!this.needsFullUpdate && !pEl.needsRegularUpdate && pEl.afterFirstUpdate) { continue; }
        if (drag == null || pEl.id != drag.id) {
            if (count>=0 || !pEl.afterFirstUpdate || this.needsFullUpdate) { pEl.updateRenderer(); }
        } else {
            pEl.updateRenderer();
            count = 5;
        }
        if (this.reducedUpdate) count--;
        pEl.afterFirstUpdate = true;
    }
};

/**
  * Adds a hook to this board.
  * @param {function} hook A function to be called by the board after an update occured.
  * @type int
  * @return Id of the hook, required to remove the hook from the board.
  */
JXG.Board.prototype.addHook = function(hook) {
    this.hooks.push(hook);
    
    hook(this);
    
    return (this.hooks.length-1);
};

/**
  * Deletes a hook from this board.
  * @param {int} id Id for the hook, required to delete the hook.
  */
JXG.Board.prototype.removeHook = function(id) {
    this.hooks[id] = null;
};

/**
  * Runs through all hooked functions and calls them.
  * @private
  */
JXG.Board.prototype.updateHooks = function() {
    for(var i=0; i<this.hooks.length; i++) {
        if(this.hooks[i] != null)
            this.hooks[i](this);
    }
};

/**
  * Adds a dependent board to this board.
  * @param {object}  A reference to board which will be updated after an update of this board occured.
  */
JXG.Board.prototype.addChild = function(board) {
    this.dependentBoards.push(board);
    this.update();
};

/**
  * Deletes a board from the list of dependent boards.
  * @param {object} board Reference to the board which will be removed.
  */
JXG.Board.prototype.removeChild = function(board) {
    var i;
    for (i=this.dependentBoards.length-1; i>=0; i--) {
        if (this.dependentBoards[i] == board) {
            this.dependentBoards.splice(i,1);
        }
    }
};

/**
  * Runs through most elements and calls their
  * update() method and update the conditions.
  * @param {Object,String} drag Element that caused the update.
  */
JXG.Board.prototype.update = function(drag) {
    var i, len, boardId;
    if (this.isSuspendedUpdate) { return; }
    this.prepareUpdate(drag);
    this.updateElements(drag);
    this.updateConditions();
    this.renderer.suspendRedraw();
    this.updateRenderer(drag);
    this.renderer.unsuspendRedraw();
    this.updateHooks();

    // To resolve dependencies between boards
    //for(var board in JXG.JSXGraph.boards) {
    len = this.dependentBoards.length;
    for (i=0; i<len; i++) {
        boardId = this.dependentBoards[i].id;
        if(JXG.JSXGraph.boards[boardId] != this) {
            JXG.JSXGraph.boards[boardId].prepareUpdate(drag);
            JXG.JSXGraph.boards[boardId].updateElements(drag);
            JXG.JSXGraph.boards[boardId].updateConditions();
            JXG.JSXGraph.boards[boardId].renderer.suspendRedraw();
            JXG.JSXGraph.boards[boardId].updateRenderer(drag);
            JXG.JSXGraph.boards[boardId].renderer.unsuspendRedraw();
            JXG.JSXGraph.boards[boardId].updateHooks();
        }
        
    }
};

/**
  * Runs through all elements and calls their
  * update() method and update the conditions.
  * This is necessary after zooming and changing the bounding box.
  */
JXG.Board.prototype.fullUpdate = function() {
    this.needsFullUpdate = true;
    this.update();
    this.needsFullUpdate = false;
};

/**
 * Creates a new geometric element of type elementType.
 * @param {string} elementType Type of the element to be constructed given as a string e.g. 'point' or 'circle'.
 * @param {Array} parents Array of parent elements needed to construct the element e.g. coordinates for a point or two
 * points to construct a line. This highly depends on the elementType that is constructed. See the corresponding JXG.create*
 * methods for a list of possible parameters.
 * @param {Object} attributes An object containing the attributes to be set. This also depends on the elementType.
 * Common attributes are name, visible, strokeColor. @see GeometryElement#setProperty
 * @type Object
 * @return Reference to the created element.
 */
JXG.Board.prototype.createElement = function(elementType, parents, attributes) {
    // CM: AW: 
    if (elementType!='turtle' && (parents == null || parents.length == 0)) {  // Turtle may have no parent elements
        return null;
    } 
    if (parents == null) { parents = []; }
    
    var el;
    elementType = elementType.toLowerCase();
    
    if (attributes==null) {
        attributes = {};
    }
    for (var i=0; i<parents.length; i++) {
        parents[i] = JXG.getReference(this, parents[i]); // TODO: should not be done for content-parameter of JXG.Text
    }

    if(JXG.JSXGraph.elements[elementType] != null) {
        el = JXG.JSXGraph.elements[elementType](this, parents, attributes);
    } else {
        throw "JXG.createElement: Unknown element type given: "+elementType;
    }

    if (el==undefined) { 
        //throw "JXG.createElement: failure creating "+elementType;
        return;
    };
  
    if(JXG.isArray(attributes)) {
        attributes = attributes[0];
    }
//    try {
        if(el.multipleElements) {
            for(var s in el) {
                if(typeof el[s].setProperty != 'undefined')
                    el[s].setProperty(attributes);
            }  
        } else {
            if(typeof el.setProperty != 'undefined')
                el.setProperty(attributes);
        }
        
//    } catch (e) { alert("Error setting Property:" + e); };
    
//    if(!JXG.isArray(el)) {  // Default way of setting attributes: strings, arrays and objects are possible
//        el.setProperty(attributes);
//    }
/* AW: Doch erstmal wieder auskommentiert
    else {                  // Setting attributes of multiple objects simultaneously.  Here, only strings are possible
        for (var s in attributes) {
            for(var i=0; i<el.length; i++) {
                if(attributes[s][i] != null) {el[i].setProperty(s+':'+attributes[s][i]);}
            }
        }
    }
*/
/*
    for (var s in attributes) {
        if(!JXG.isArray(el)) {
            el.setProperty(s+':'+attributes[s]);
        }
        else {
            for(var i=0; i<el.length; i++) {
                if(attributes[s][i] != null) {
                    el[i].setProperty(s+':'+attributes[s][i]);
                }
            }
        }
    }
*/
    this.update();
    return el;
};

/**
 * Delete the elements drawn as part of a trace of an element.
 */
JXG.Board.prototype.clearTraces = function() {
    for(var el in this.objects) {
        if (this.objects[el].traced)
            this.objects[el].clearTrace();
    }
};

/**
 * Method called before a board is initialized or load from a file. Currently unused.
 * @private
 */
JXG.Board.prototype.beforeLoad = function() {
/*    if(document.getElementsByTagName("body").length > 0) {
        var divNode = document.createElement("div");
        divNode.setAttribute("id", "JXGPreLoadAnimation");
        var imgNode = document.createElement("img");
        imgNode.setAttribute("src", "./css/load.gif");
        divNode.appendChild(imgNode);
        divNode.setStyle({
                    zIndex: 999,
                    position: 'absolute',
                    left: parseInt(JXG.getStyle(this.containerObj,"left")) + (this.canvasWidth - 100)/2,
                    top: parseInt(JXG.getStyle(this.containerObj,"top")) + (this.canvasHeight - 100)/2
                });
    
        document.getElementsByTagName("body")[0].appendChild(divNode);
    }*/
};

/**
 * Method called after a board got initialized or load from a file. Currently unused.
 * @private
 */
JXG.Board.prototype.afterLoad = function() {
  /*  if(document.getElementsByTagName("body").length > 0) {
        document.getElementsByTagName("body")[0].removeChild(document.getElementById("JXGPreLoadAnimation"));
    }*/
};

/**
 * Stop updates of the board.
 */
JXG.Board.prototype.suspendUpdate = function() {
    this.isSuspendedUpdate = true;
};

/**
 * Enable updates of the board again.
 */
JXG.Board.prototype.unsuspendUpdate = function() {
    this.isSuspendedUpdate = false;
    this.update();
};

/**
 * Set the bounding box of the board.
 * @param {Array} New bounding box [x1,y1,x2,y2]
 * @param {Bool} keepaspectratio: optional flag
 */
JXG.Board.prototype.setBoundingBox = function(bbox,keepaspectratio) {
    if (!JXG.isArray(bbox)) return;
    var h,w;
    w = this.canvasWidth;
    h = this.canvasHeight;
    if (keepaspectratio) {
        this.unitX = w/(bbox[2]-bbox[0]);
        this.unitY = h/(-bbox[3]+bbox[1]);
        if (this.unitX>this.unitY) {
            this.unitY = this.unitX;
        } else {
            this.unitX = this.unitY;
        }
    } else {
        this.unitX = w/(bbox[2]-bbox[0]);
        this.unitY = h/(-bbox[3]+bbox[1]);
    }
    this.originX = -this.unitX*bbox[0];
    this.originY = this.unitY*bbox[1];
    this.moveOrigin();
};
