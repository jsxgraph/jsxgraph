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
 * @fileoverview The geometry object Point is defined in this file. Point stores all
 * style and functional properties that are required to draw and move a point on
 * a board.
 */


/**
 * A point is the basic geometric element. Based on points lines and circles can be constructed which can be intersected
 * which in turn are points again which can be used to construct new lines, circles, polygons, etc. This class holds methods for
 * all kind of points like free points, gliders, and intersection points.
 * @class Creates a new point object. Do not use this constructor to create a point. Use {@link JXG.Board#create} with
 * type {@link Point}, {@link Glider}, or {@link Intersection} instead.  
 * @augments JXG.GeometryElement
 * @param {string|JXG.Board} board The board the new point is drawn on.
 * @param {Array} coordinates An array with the affine user coordinates of the point.
 * @param {Object} attributes An object containing visual properties like in {@link JXG.Options#point} and
 * {@link JXG.Options#elements}, and optional a name and a id.
 * @see JXG.Board#generateName
 * @see JXG.Board#addPoint
 */
JXG.Point = function (board, coordinates, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_POINT, JXG.OBJECT_CLASS_POINT);
    
    if (coordinates==null) {
        coordinates=[0,0];
    }
    /**
     * Coordinates of the point.
     * @type JXG.Coords
     * @private
     */
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);
    this.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);

    /**
     * Relative position on a line if point is a glider on a line.
     * @type number
     * @private
     */
    this.position = null;

    /**
     * Determines whether the point slides on a polygon if point is a glider.
     * @type boolean
     * @default false
     * @private
     */
    this.onPolygon = false;
    
    /**
     * When used as a glider this member stores the object, where to glide on. To set the object to glide on use the method
     * {@link JXG.Point#makeGlider} and DO NOT set this property directly as it will break the dependency tree.
     * TODO: Requires renaming to glideObject
     * @type JXG.GeometryElement
     * @name Glider#slideObject
     */
    this.slideObject = null;
    
    /**
     * Stores the groups of this point in an array of Group.
     * @type array
     * @see JXG.Group
     * @private
     */
    this.group = [];

    /* Register point at board. */
    this.id = this.board.setId(this, 'P');
    this.board.renderer.drawPoint(this);
    this.board.finalizeAdding(this);

    this.createLabel();
};

/**
 * Inherits here from {@link JXG.GeometryElement}.
 */
JXG.Point.prototype = new JXG.GeometryElement();


JXG.extend(JXG.Point.prototype, /** @lends JXG.Point.prototype */ {
    /**
     * Checks whether (x,y) is near the point.
     * @param {int} x Coordinate in x direction, screen coordinates.
     * @param {int} y Coordinate in y direction, screen coordinates.
     * @type boolean
     * @return True if (x,y) is near the point, False otherwise.
     * @private
     */
    hasPoint: function (x,y) {
        var coordsScr = this.coords.scrCoords, r;
        r = this.visProp.size;
        if(r < this.board.options.precision.hasPoint) {
            r = this.board.options.precision.hasPoint;
        }
        return ((Math.abs(coordsScr[1]-x) < r+2) && (Math.abs(coordsScr[2]-y)) < r+2);
    },

    /**
    * Dummy function for unconstrained points or gliders.
    * @private
    */
    updateConstraint: function() { return this; },

    /**
     * Updates the position of the point.
     */
    update: function (fromParent) {
        var i, p1coords, p2coords, factor, distP1S, distP1P2, distP2S, v,
            p1Scr, p2Scr, y, p1, p2, poly;
            
        if (!this.needsUpdate) { return this; }

        if(typeof fromParent == 'undefined') {
            fromParent = false;
        }
      
        if(this.visProp.trace) {
            this.cloneToBackground(true);
        }
        /*
         * We need to calculate the new coordinates no matter of the points visibility because
         * a child could be visible and depend on the coordinates of the point (e.g. perpendicular).
         * 
         * Check if point is a glider and calculate new coords in dependency of this.slideObject.
         * This function is called with fromParent==true for example if
         * the defining elements of the line or circle have been changed.
         */
        if(this.type == JXG.OBJECT_TYPE_GLIDER) {
            if(this.slideObject.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
                if (fromParent) {
                    this.coords.setCoordinates(JXG.COORDS_BY_USER, [this.slideObject.midpoint.X()+Math.cos(this.position),this.slideObject.midpoint.Y()+Math.sin(this.position)]);
                    this.coords  = JXG.Math.Geometry.projectPointToCircle(this, this.slideObject, this.board);
                } else {
                    this.coords  = JXG.Math.Geometry.projectPointToCircle(this, this.slideObject, this.board);
                    this.position = JXG.Math.Geometry.rad([this.slideObject.midpoint.X()+1.0,this.slideObject.midpoint.Y()],this.slideObject.midpoint,this);
                }
            } else if(this.slideObject.elementClass == JXG.OBJECT_CLASS_LINE) {
                this.coords  = JXG.Math.Geometry.projectPointToLine(this, this.slideObject, this.board);
                p1coords = this.slideObject.point1.coords;
                p2coords = this.slideObject.point2.coords;
                if (fromParent) {
                    if (Math.abs(p1coords.usrCoords[0])>=JXG.Math.eps && Math.abs(p2coords.usrCoords[0])>=JXG.Math.eps) {
                        this.coords.setCoordinates(JXG.COORDS_BY_USER, 
                                               [p1coords.usrCoords[1] + this.position*(p2coords.usrCoords[1] - p1coords.usrCoords[1]),
                                                p1coords.usrCoords[2] + this.position*(p2coords.usrCoords[2] - p1coords.usrCoords[2])]);
                    }
                } else {
                    factor = 1;
                    distP1S = p1coords.distance(JXG.COORDS_BY_USER, this.coords);
                    distP1P2 = p1coords.distance(JXG.COORDS_BY_USER, p2coords);
                    distP2S = p2coords.distance(JXG.COORDS_BY_USER, this.coords);
                    
                    if ( ((distP1S > distP1P2) || (distP2S > distP1P2)) && (distP1S < distP2S)) { // Glider not between P1 & P2 and beyond P1
                        factor = -1;
                    }
                    this.position = factor*distP1S/distP1P2;

                    // Snap the glider point of the slider into its appropiate position
                    // First, recalculate the new value of this.position
                    // Second, call update(fromParent==true) to make the positioning snappier.
                    if (this.visProp.snapwidth>0.0 && Math.abs(this._smax-this._smin)>=JXG.Math.eps) {
                        if (this.position<0.0) this.position = 0.0;
                        if (this.position>1.0) this.position = 1.0;
                        
                        v = this.position*(this._smax-this._smin)+this._smin;
                        v = Math.round(v/this.visProp.snapwidth)*this.visProp.snapwidth;
                        this.position = (v-this._smin)/(this._smax-this._smin);
                        this.update(true);
                    }
                }
                p1Scr = this.slideObject.point1.coords.scrCoords;
                p2Scr = this.slideObject.point2.coords.scrCoords;

                if(this.slideObject.getSlope() == 0) {
                    i = 1;
                } else {
                    i = 2;
                }

                y = this.coords.scrCoords[i];
                if (!this.slideObject.visProp.straightfirst) {
                    if(p1Scr[i] < p2Scr[i]) {
                        if(y < p1Scr[i]) {
                           this.coords = this.slideObject.point1.coords;
                           this.position = 0;
                        }
                    }
                    else if(p1Scr[i] > p2Scr[i]) {
                        if(y > p1Scr[i]) {
                           this.coords = this.slideObject.point1.coords;
                           this.position = 0;
                        }
                    }
                }
                if (!this.slideObject.visProp.straightlast) {
                    if(p1Scr[i] < p2Scr[i]) {
                        if (y > p2Scr[i]) {
                           this.coords = this.slideObject.point2.coords;
                           this.position = 1;
                        }
                    }
                    else if(p1Scr[i] > p2Scr[i]) {
                        if (y < p2Scr[i]) {
                           this.coords = this.slideObject.point2.coords;
                           this.position = 1;
                        }
                    }
                }  

                if (this.onPolygon) {
                    p1 = this.slideObject.point1.coords;
                    p2 = this.slideObject.point2.coords;
                    if (Math.abs(this.coords.scrCoords[1]-p1.scrCoords[1])<this.board.options.precision.hasPoint && 
                        Math.abs(this.coords.scrCoords[2]-p1.scrCoords[2])<this.board.options.precision.hasPoint) {
                        poly = this.slideObject.parentPolygon;
                        for (i=0; i<poly.borders.length; i++) {
                            if (this.slideObject == poly.borders[i]) {
                                this.slideObject = poly.borders[(i - 1 + poly.borders.length) % poly.borders.length];
                                break;
                            }
                        }
                    }
                    else if (Math.abs(this.coords.scrCoords[1]-p2.scrCoords[1])<this.board.options.precision.hasPoint && 
                             Math.abs(this.coords.scrCoords[2]-p2.scrCoords[2])<this.board.options.precision.hasPoint) {
                        poly = this.slideObject.parentPolygon;
                        for (i=0; i<poly.borders.length; i++) {
                            if(this.slideObject == poly.borders[i]) {
                                this.slideObject = poly.borders[(i + 1 + poly.borders.length) % poly.borders.length];
                                break;                        
                            }
                        }
                    }
                }
            } else if(this.slideObject.type == JXG.OBJECT_TYPE_TURTLE) {
                this.updateConstraint(); // In case, the point is a constrained glider.
                this.coords  = JXG.Math.Geometry.projectPointToTurtle(this, this.slideObject, this.board);
            } else if(this.slideObject.elementClass == JXG.OBJECT_CLASS_CURVE) {
                this.updateConstraint(); // In case, the point is a constrained glider.
                this.coords  = JXG.Math.Geometry.projectPointToCurve(this, this.slideObject, this.board);
            }
        }
        
        /* If point is a calculated point, call updateConstraint() to calculate new coords. */
        if (this.type == JXG.OBJECT_TYPE_CAS) {
            this.updateConstraint();
        }

        this.updateTransform();

        return this;
    },

    /**
     * Calls the renderer to update the drawing.
     * @private
     */
    updateRenderer: function () {
        if (!this.needsUpdate) { return this; }

        /* Call the renderer only if point is visible. */
        if(this.visProp.visible) {
            var wasReal = this.isReal;
            this.isReal = (!isNaN(this.coords.usrCoords[1] + this.coords.usrCoords[2]));
            this.isReal = (Math.abs(this.coords.usrCoords[0])>JXG.Math.eps)?this.isReal:false;  //Homogeneous coords: ideal point
            if (this.isReal) {
                if (wasReal!=this.isReal) { 
                    this.board.renderer.show(this); 
                    if(this.hasLabel && this.label.content.visProp.visible) this.board.renderer.show(this.label.content);
                }
                this.board.renderer.updatePoint(this);
            } else {
                if (wasReal!=this.isReal) { 
                    this.board.renderer.hide(this); 
                    if(this.hasLabel && this.label.content.visProp.visible) this.board.renderer.hide(this.label.content);
                }
            }
        } 

        /* Update the label if visible. */
        if(this.hasLabel && this.visProp.visible && this.label.content && this.label.content.visProp.visible && this.isReal) {
            this.label.content.update();
            this.board.renderer.updateText(this.label.content);
        }
        
        this.needsUpdate = false; 
        return this;
    },

    /**
     * Getter method for x, this is used by for CAS-points to access point coordinates.
     * @return User coordinate of point in x direction.
     * @type number
     */
    X: function () {
        return this.coords.usrCoords[1];
    },

    /**
     * Getter method for y, this is used by CAS-points to access point coordinates.
     * @return User coordinate of point in y direction.
     * @type number
     */
    Y: function () {
        return this.coords.usrCoords[2];
    },

    /**
     * Getter method for z, this is used by CAS-points to access point coordinates.
     * @return User coordinate of point in z direction.
     * @type number
     */
    Z: function () {
        return this.coords.usrCoords[0];
    },

    /**
     * New evaluation of the function term. 
     * This is required for CAS-points: Their XTerm() method is overwritten in {@link #addConstraint}
     * @return User coordinate of point in x direction.
     * @type number
     * @private
     */
    XEval: function () {
        return this.coords.usrCoords[1];
    },

    /**
     * New evaluation of the function term. 
     * This is required for CAS-points: Their YTerm() method is overwritten in {@link #addConstraint}
     * @return User coordinate of point in y direction.
     * @type number
     * @private
     */
    YEval: function () {
        return this.coords.usrCoords[2];
    },

    /**
     * New evaluation of the function term. 
     * This is required for CAS-points: Their ZTerm() method is overwritten in {@link #addConstraint}
     * @return User coordinate of point in z direction.
     * @type number
     * @private
     */
    ZEval: function () {
        return this.coords.usrCoords[0];
    },

    // documented in JXG.GeometryElement
    bounds: function () {
        return this.coords.usrCoords.slice(1).concat(this.coords.usrCoords.slice(1));
    },

    /**
     * Getter method for the distance to a second point, this is required for CAS-elements.
     * Here, function inlining seems to be worthwile  (for plotting).
     * @param {JXG.Point} point2 The point to which the distance shall be calculated.
     * @return Distance in user coordinate to the given point
     * @type number
     */
    Dist: function(point2) {
        var sum,
            c = point2.coords.usrCoords,
            ucr = this.coords.usrCoords,
            f;
            
        f = ucr[0]-c[0];
        sum = f*f;
        f = ucr[1]-c[1];
        sum += f*f;
        f = ucr[2]-c[2];
        sum += f*f;
        return Math.sqrt(sum);
    },

    /**
     * Sets x and y coordinate and calls the point's update() method.
     * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
     * @param {number} x x coordinate in screen/user units
     * @param {number} y y coordinate in screen/user units
     * @param {number} x optional: previous x coordinate in screen/user units (ignored)
     * @param {number} y optional: previous y coordinate in screen/user units (ignored)
     */
    setPositionDirectly: function (method, x, y) {
        var i, dx, dy, el, p,
            oldCoords = this.coords,
            newCoords;
            
        this.coords = new JXG.Coords(method, [x, y], this.board);

        if(this.group.length != 0) {
            // Update the initial coordinates. This is needed for free points
            // that have a transformation bound to it.
            dx = this.coords.usrCoords[1]-oldCoords.usrCoords[1];
            dy = this.coords.usrCoords[2]-oldCoords.usrCoords[2];
            for (i=0;i<this.group.length;i++) {
                for (el in this.group[i].objects) {
                    p = this.group[i].objects[el];
                    p.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, 
                        [p.initialCoords.usrCoords[1]+dx,p.initialCoords.usrCoords[2]+dy], 
                        this.board);
                }
            }

            this.group[this.group.length-1].dX = this.coords.scrCoords[1] - oldCoords.scrCoords[1];
            this.group[this.group.length-1].dY = this.coords.scrCoords[2] - oldCoords.scrCoords[2];
            this.group[this.group.length-1].update(this);
        } else {
            // Update the initial coordinates. This is needed for free points
            // that have a transformation bound to it.
            for (i=this.transformations.length-1;i>=0;i--) {
                if (method == JXG.COORDS_BY_SCREEN) {
                    newCoords = (new JXG.Coords(method, [x, y], this.board)).usrCoords;                
                } else {
                    newCoords = [1,x,y];
                }
                this.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, 
                        JXG.Math.matVecMult(JXG.Math.inverse(this.transformations[i].matrix), newCoords), 
                        this.board);      
            }
            this.update();
        }
        return this;
    },

    /**
     * TODO
     * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
     * @param {number} x x coordinate in screen/user units
     * @param {number} y y coordinate in screen/user units
     */
    setPositionByTransform: function (method, x, y) {
        var t = this.board.create('transform', [x,y], {type:'translate'});

        if (this.transformations.length > 0 && this.transformations[this.transformations.length - 1].isNumericMatrix) {
            this.transformations[this.transformations.length - 1].melt(t);
        } else {
            this.addTransform(this, t);
        }

        if (this.group.length == 0) {
            this.update();
        }
        return this;
    },

    /**
     * Sets x and y coordinate and calls the point's update() method.
     * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
     * @param {number} x x coordinate in screen/user units
     * @param {number} y y coordinate in screen/user units
     */
    setPosition: function (method, x, y) { 
        this.setPositionDirectly(method, x, y);
        return this;
    },

    /**
     * Convert the point to glider and update the construction.
     * @param {String|Object} glideObject The Object the point will be bound to.
     */
    makeGlider: function (glideObject) {
        this.slideObject = JXG.getReference(this.board, glideObject);
        this.type = JXG.OBJECT_TYPE_GLIDER;
        this.visProp.snapwidth = -1;          // By default, deactivate snapWidth
        this.slideObject.addChild(this);
        this.isDraggable = true;
        
        this.generatePolynomial = function() {
            return this.slideObject.generatePolynomial(this);
        };

        //this.needsUpdate = true;
        //this.update();
        return this;
    },

    /**
     * Convert the point to CAS point and call update().
     * @param {Array} terms [[zterm], xterm, yterm] defining terms for the z, x and y coordinate.
     * The z-coordinate is optional and it is used for homogeneaous coordinates.
     * The coordinates may be either <ul>
     *   <li>a JavaScript function,</li>
     *   <li>a string containing GEONExT syntax. This string will be converted into a JavaScript 
     *     function here,</li>
     *   <li>a number</li>
     *   <li>a pointer to a slider object. This will be converted into a call of the Value()-method 
     *     of this slider.</li>
     *   </ul>
     * @see JXG.GeonextParser#geonext2JS
     */
    addConstraint: function (terms) {
        this.type = JXG.OBJECT_TYPE_CAS;
        var elements = this.board.elementsByName;
        var newfuncs = [];
        var fs;
        
        this.isDraggable = false;
        for (var i=0;i<terms.length;i++) {
            var v = terms[i];
            if (typeof v=='string') {
                // Convert GEONExT syntax into  JavaScript syntax
                var t  = JXG.GeonextParser.geonext2JS(v, this.board);
                newfuncs[i] = new Function('','return ' + t + ';');
            } else if (typeof v=='function') {
                newfuncs[i] = v;
            } else if (typeof v=='number') {
                newfuncs[i] = function(z){ return function() { return z; }; }(v);
            } else if (typeof v == 'object' && typeof v.Value == 'function') {    // Slider
                newfuncs[i] = (function(a) { return function() { return a.Value(); };})(v);
            }
        }
        if (terms.length==1) { // Intersection function
            this.updateConstraint = function() { 
                    var c = newfuncs[0](); 
                    if (JXG.isArray(c)) {      // Array
                        this.coords.setCoordinates(JXG.COORDS_BY_USER,c);
                    } else {                   // Coords object
                        this.coords = c;
                    }
                };
        } else if (terms.length==2) { // Euclidean coordinates
            this.XEval = newfuncs[0];
            this.YEval = newfuncs[1];
            fs = 'this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.XEval(),this.YEval()]);';
            this.updateConstraint = new Function('',fs);
        } else { // Homogeneous coordinates
            this.ZEval = newfuncs[0];
            this.XEval = newfuncs[1];
            this.YEval = newfuncs[2];
            fs = 'this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.ZEval(),this.XEval(),this.YEval()]);';
            this.updateConstraint = new Function('',fs);
        }

        // if (!this.board.isSuspendedUpdate) { this.update(); }
        return this;
    },

    /**
     * TODO
     */
    updateTransform: function () {
        if (this.transformations.length==0 || this.baseElement==null) {
            return;
        }
        var c, i;

        if (this===this.baseElement) {      // case of bindTo
            c = this.transformations[0].apply(this.baseElement,'self');
        } else {                           // case of board.create('point',[baseElement,transform]);
            c = this.transformations[0].apply(this.baseElement);
        }
        this.coords.setCoordinates(JXG.COORDS_BY_USER,c);
        for (i=1;i<this.transformations.length;i++) {
            this.coords.setCoordinates(JXG.COORDS_BY_USER,this.transformations[i].apply(this));
        }
        return this;
    },

    /**
     * TODO
     * @param el TODO
     * @param transform TODO
     */
    addTransform: function (el, transform) {
        var list, i, len;
        if (this.transformations.length==0) { // There is only one baseElement possible
            this.baseElement = el;
        }
        if (JXG.isArray(transform)) {
            list = transform;
        } else {
            list = [transform];
        }
        len = list.length;
        for (i=0;i<len;i++) {
            this.transformations.push(list[i]);
        }
        return this;
    },

    /**
     * Animate the point. 
     * @param {number} direction The direction the glider is animated. Can be +1 or -1.
     * @param {number} stepCount The number of steps.
     * @name Glider#startAnimation
     * @see Glider#stopAnimation
     * @function
     */
    startAnimation: function(direction, stepCount) {
        if((this.type == JXG.OBJECT_TYPE_GLIDER) && (typeof this.intervalCode == 'undefined')) {
            this.intervalCode = window.setInterval('JXG.JSXGraph.boards[\'' + this.board.id + '\'].objects[\'' + this.id + '\']._anim(' 
                                                    + direction + ', ' + stepCount + ')', 250);
            if(typeof this.intervalCount == 'undefined')
                this.intervalCount = 0;
        }
        return this;
    },

    /**
     * Stop animation.
     * @name Glider#stopAnimation
     * @see Glider#startAnimation
     * @function
     */
    stopAnimation: function() {
        if(typeof this.intervalCode != 'undefined') {
            window.clearInterval(this.intervalCode);
            delete(this.intervalCode);
        }
        return this;
    },

    /**
     * Starts an animation which moves the point along a given path in given time.
     * @param {Array,function} path The path the point is moved on. This can be either an array of arrays containing x and y values of the points of
     * the path, or  function taking the amount of elapsed time since the animation has started and returns an array containing a x and a y value or NaN.
     * In case of NaN the animation stops.
     * @param {Number} time The time in milliseconds in which to finish the animation
     * @param {function} [callback] A callback function which is called once the animation is finished.
     * @returns {JXG.Point} Reference to the point.
     */
    moveAlong: function(path, time, callback) {
        var interpath = [],
            delay = 35,
            makeFakeFunction = function (i, j) {
                return function() {
                    return path[i][j];
                };
            },
            p = [], i, neville,
            steps = time/delay;

        if (JXG.isArray(path)) {
            for (i = 0; i < path.length; i++) {
                if (JXG.isPoint(path[i])) {
                    p[i] = path[i];
                } else {
                    p[i] = {
                        elementClass: JXG.OBJECT_CLASS_POINT,
                        X: makeFakeFunction(i, 0),
                        Y: makeFakeFunction(i, 1)
                    };
                }
            }

            time = time || 0;
            if (time === 0) {
                this.setPosition(JXG.COORDS_BY_USER, p[p.length - 1].X(), p[p.length - 1].Y());
                return this.board.update(this);
            }

            neville = JXG.Math.Numerics.Neville(p);
            for (i = 0; i < steps; i++) {
                interpath[i] = [];
                interpath[i][0] = neville[0]((steps - i) / steps * neville[3]());
                interpath[i][1] = neville[1]((steps - i) / steps * neville[3]());
            }

            this.animationPath = interpath;
        } else if (JXG.isFunction(path)) {
            this.animationPath = path;
            this.animationStart = new Date().getTime();
        }
        this.animationCallback = callback;

        this.board.addAnimation(this);
        return this;
    },

    /**
     * Starts an animated point movement towards the given coordinates <tt>where</tt>. The animation is done after <tt>time</tt> milliseconds.
     * If the second parameter is not given or is equal to 0, setPosition() is called, see #setPosition.
     * @param {Array} where Array containing the x and y coordinate of the target location.
     * @param {Number} [time] Number of milliseconds the animation should last.
     * @param {function} [callback] A function that is invoked once the animation is completed.
     * @returns {JXG.Point} Reference to itself.
     * @see #animate
     */
    moveTo: function(where, time, callback) {
        if (typeof time == 'undefined' || time == 0) {
            this.setPosition(JXG.COORDS_BY_USER, where[0], where[1]);
            return this.board.update(this);
        }
    	var delay = 35,
    	    steps = Math.ceil(time/(delay * 1.0)),
    		coords = new Array(steps+1),
    		X = this.coords.usrCoords[1],
    		Y = this.coords.usrCoords[2],
    		dX = (where[0] - X),
    		dY = (where[1] - Y),
    	    i;

        if(Math.abs(dX) < JXG.Math.eps && Math.abs(dY) < JXG.Math.eps)
            return this;
    	
    	for(i=steps; i>=0; i--) {
    		coords[steps-i] = [X + dX * Math.sin((i/(steps*1.0))*Math.PI/2.), Y+ dY * Math.sin((i/(steps*1.0))*Math.PI/2.)];
    	}

    	this.animationPath = coords;
        this.animationCallback = callback;
        this.board.addAnimation(this);
        return this;
    },

    /**
     * Starts an animated point movement towards the given coordinates <tt>where</tt>. After arriving at <tt>where</tt> the point moves back to where it started.
     * The animation is done after <tt>time</tt> milliseconds.
     * @param {Array} where Array containing the x and y coordinate of the target location.
     * @param {Number} time Number of milliseconds the animation should last.
     * @param {Number} [repeat] How often the animation should be repeated. The time value is then taken for one repeat.
     * @param {function} [callback] A function that is invoked once the animation is completed.
     * @returns {JXG.Point} Reference to itself.
     * @see #animate
     */
    visit: function(where, time, repeat, callback) {
        if(arguments.length == 2)
            repeat = 1;

        var delay = 35,
            steps = Math.ceil(time/(delay * 1.0)),
            coords = new Array(repeat*(steps+1)),
            X = this.coords.usrCoords[1],
            Y = this.coords.usrCoords[2],
            dX = (where[0] - X),
            dY = (where[1] - Y),
            i, j;
        
        for(j=0; j<repeat; j++) {
            for(i=steps; i>=0; i--) {
                coords[j*(steps+1) + steps-i] = [X + dX * Math.pow(Math.sin((i/(steps*1.0))*Math.PI), 2.), 
                                                 Y+ dY * Math.pow(Math.sin((i/(steps*1.0))*Math.PI), 2.)];
            }
        }
        this.animationPath = coords;
        this.animationCallback = callback;
        this.board.addAnimation(this);
        return this;
    },

    /**
     * Animates a glider. Is called by the browser after startAnimation is called.
     * @param {number} direction The direction the glider is animated.
     * @param {number} stepCount The number of steps.
     * @see #startAnimation
     * @see #stopAnimation
     * @private
     */
    _anim: function(direction, stepCount) {
        var distance, slope, dX, dY, alpha, startPoint,
            factor = 1, newX, radius;
        
        this.intervalCount++;
        if(this.intervalCount > stepCount)
            this.intervalCount = 0;
        
        if(this.slideObject.elementClass == JXG.OBJECT_CLASS_LINE) {
            distance = this.slideObject.point1.coords.distance(JXG.COORDS_BY_SCREEN, this.slideObject.point2.coords);
            slope = this.slideObject.getSlope();
            if(slope != 'INF') {
                alpha = Math.atan(slope);
                dX = Math.round((this.intervalCount/stepCount) * distance*Math.cos(alpha));
                dY = Math.round((this.intervalCount/stepCount) * distance*Math.sin(alpha));
            } else {
                dX = 0;
                dY = Math.round((this.intervalCount/stepCount) * distance);
            }
            
            if(direction < 0) {
                startPoint = this.slideObject.point2;
                if(this.slideObject.point2.coords.scrCoords[1] - this.slideObject.point1.coords.scrCoords[1] > 0)
                    factor = -1;
                else if(this.slideObject.point2.coords.scrCoords[1] - this.slideObject.point1.coords.scrCoords[1] == 0) {
                    if(this.slideObject.point2.coords.scrCoords[2] - this.slideObject.point1.coords.scrCoords[2] > 0)
                        factor = -1;
                }
            } else {
                startPoint = this.slideObject.point1;
                if(this.slideObject.point1.coords.scrCoords[1] - this.slideObject.point2.coords.scrCoords[1] > 0)
                    factor = -1;
                else if(this.slideObject.point1.coords.scrCoords[1] - this.slideObject.point2.coords.scrCoords[1] == 0) {
                    if(this.slideObject.point1.coords.scrCoords[2] - this.slideObject.point2.coords.scrCoords[2] > 0)
                        factor = -1;
                }
            }
            
            this.coords.setCoordinates(JXG.COORDS_BY_SCREEN, [startPoint.coords.scrCoords[1] + factor*dX, 
                                                              startPoint.coords.scrCoords[2] + factor*dY]);
        } else if(this.slideObject.elementClass == JXG.OBJECT_CLASS_CURVE) {
            if(direction > 0) {
                newX = Math.round(this.intervalCount/stepCount * this.board.canvasWidth);
            } else {
                newX = Math.round((stepCount - this.intervalCount)/stepCount * this.board.canvasWidth);
            }
      
            this.coords.setCoordinates(JXG.COORDS_BY_SCREEN, [newX, 0]);
            this.coords = JXG.Math.Geometry.projectPointToCurve(this, this.slideObject, this.board);
        } else if(this.slideObject.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
            if(direction < 0) {
                alpha = this.intervalCount/stepCount * 2*Math.PI;
            } else {
                alpha = (stepCount - this.intervalCount)/stepCount * 2*Math.PI;
            }

            radius = this.slideObject.Radius();

            this.coords.setCoordinates(JXG.COORDS_BY_USER, [this.slideObject.midpoint.coords.usrCoords[1] + radius*Math.cos(alpha), 
                                                            this.slideObject.midpoint.coords.usrCoords[2] + radius*Math.sin(alpha)]);
        }
        
        this.board.update(this);
        return this;
    },

    /**
     * Set the style of a point. Used for GEONExT import and should not be used to set the point's face and size.
     * @param {Number} i Integer to determine the style.
     * @private
     */
    setStyle: function(i) {
        var facemap = [
                // 0-2
                'cross', 'cross', 'cross',
                // 3-6
                'circle', 'circle', 'circle', 'circle',
                // 7-9
                'square', 'square', 'square',
                // 10-12
                'plus', 'plus', 'plus'
            ], sizemap = [
                // 0-2
                2, 3, 4,
                // 3-6
                1, 2, 3, 4,
                // 7-9
                2, 3, 4,
                // 10-12
                2, 3, 4
            ];

        this.visProp.face = facemap[i];
        this.visProp.size = sizemap[i];

        this.board.renderer.changePointStyle(this);
        return this;
    },

    /**
     * All point faces can be defined with more than one name, e.g. a cross faced point can be given
     * by face equal to 'cross' or equal to 'x'. This method maps all possible values to fixed ones to
     * simplify if- and switch-clauses regarding point faces. The translation table is as follows:
     * <table>
     * <tr><th>Input</th><th>Output</th></tr>
     * <tr><td>cross, x</td><td>x</td></tr>
     * <tr><td>circle, o</td><td>o</td></tr>
     * <tr><td>square, []</td><td>[]</td></tr>
     * <tr><td>plus, +</td><td>+</td></tr>
     * <tr><td>diamond, &lt;&gt;</td><td>&lt;&gt;</td></tr>
     * <tr><td>triangleup, a, ^</td><td>A</td></tr>
     * <tr><td>triangledown, v</td><td>v</td></tr>
     * <tr><td>triangleleft, &lt;</td><td>&lt;</td></tr>
     * <tr><td>triangleright, &gt;</td><td>&gt;</td></tr>
     * </table>
     * @param {String} s A string which should determine a valid point face.
     * @returns {String} Returns a normalized string or undefined if the given string is not a valid
     * point face.
     */
    normalizeFace: function(s) {
        var map = {
                cross: 'x',
                x: 'x',
                circle: 'o',
                o: 'o',
                square: '[]',
                '[]': '[]',
                plus: '+',
                '+': '+',
                diamond: '<>',
                '<>': '<>',
                triangleup: '^',
                a: '^',
                '^': '^',
                triangledown: 'v',
                v: 'v',
                triangleleft: '<',
                '<': '<',
                triangleright: '>',
                '>': '>'
            };

        return map[s];
    },

    /**
     * Remove the point from the drawing.
     */
    remove: function() {    
        if (this.hasLabel) {
            this.board.renderer.remove(this.board.renderer.getElementById(this.label.content.id));
        }
        this.board.renderer.remove(this.board.renderer.getElementById(this.id));
    },

    // documented in GeometryElement
    getTextAnchor: function() {
        return this.coords;
    },

    // documented in GeometryElement
    getLabelAnchor: function() {
        return this.coords;
    },

    /**
     * Set the face of a point element.
     * @param {string} f String which determines the face of the point. See {@link JXG.GeometryElement#face} for a list of available faces.
     * @see JXG.GeometryElement#face
     */
    face: function(f) {
        this.setProperty({face:f});
    },

    /**
     * Set the size of a point element
     * @param {int} s Integer which determines the size of the point.
     * @see JXG.GeometryElement#size
     */
    size: function(s) {
        this.setProperty({size:s});
    },

    // already documented in GeometryElement
    cloneToBackground: function() {
        var copy = {};

        copy.id = this.id + 'T' + this.numTraces;
        this.numTraces++;

        copy.coords = this.coords;
        copy.visProp = this.visProp;
        copy.visProp.layer = this.board.options.layer.trace;
        copy.elementClass = JXG.OBJECT_CLASS_POINT;
        copy.board = this.board;
        JXG.clearVisPropOld(copy);
        
        this.board.renderer.drawPoint(copy);
        this.traces[copy.id] = copy.rendNode;
        return this;
    }
});


/**
 * @class This element is used to provide a constructor for a general point. A free point is created if the given parent elements are all numbers
 * and the property fixed is not set or set to false. If one or more parent elements is not a number but a string containing a GEONE<sub>x</sub>T
 * constraint or a function the point will be considered as constrained). That means that the user won't be able to change the point's
 * position directly.
 * @pseudo
 * @description
 * @name Point
 * @augments JXG.Point
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {number,string,function_number,string,function_number,string,function} z_,x,y Parent elements can be two or three elements of type number, a string containing a GEONE<sub>x</sub>T
 * constraint, or a function which takes no parameter and returns a number. Every parent element determines one coordinate. If a coordinate is
 * given by a number, the number determines the initial position of a free point. If given by a string or a function that coordinate will be constrained
 * that means the user won't be able to change the point's position directly by mouse because it will be calculated automatically depending on the string
 * or the function's return value. If two parent elements are given the coordinates will be interpreted as 2D affine euclidean coordinates, if three such
 * parent elements are given they will be interpreted as homogeneous coordinates.
 * @param {JXG.Point_JXG.Transformation} Point,Transformation A point can also be created providing a transformation. The resulting point is a clone of the base
 * point transformed by the given Transformation. {@see JXG.Transformation}.
 * @example
 * // Create a free point using affine euclidean coordinates 
 * var p1 = board.create('point', [3.5, 2.0]);
 * </pre><div id="672f1764-7dfa-4abc-a2c6-81fbbf83e44b" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   var board = JXG.JSXGraph.initBoard('672f1764-7dfa-4abc-a2c6-81fbbf83e44b', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var p1 = board.create('point', [3.5, 2.0]);
 * </script><pre>
 * @example
 * // Create a constrained point using anonymous function 
 * var p2 = board.create('point', [3.5, function () { return p1.X(); }]);
 * </pre><div id="4fd4410c-3383-4e80-b1bb-961f5eeef224" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   var fpex1_board = JXG.JSXGraph.initBoard('4fd4410c-3383-4e80-b1bb-961f5eeef224', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var fpex1_p1 = fpex1_board.create('point', [3.5, 2.0]);
 *   var fpex1_p2 = fpex1_board.create('point', [3.5, function () { return fpex1_p1.X(); }]);
 * </script><pre>
 * @example
 * // Create a point using transformations 
 * var trans = board.create('transform', [2, 0.5], {type:'scale'});
 * var p3 = board.create('point', [p2, trans]);
 * </pre><div id="630afdf3-0a64-46e0-8a44-f51bd197bb8d" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var fpex2_board = JXG.JSXGraph.initBoard('630afdf3-0a64-46e0-8a44-f51bd197bb8d', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var fpex2_trans = fpex2_board.create('transform', [2, 0.5], {type:'scale'});
 *   var fpex2_p2 = fpex2_board.create('point', [3.5, 2.0]);
 *   var fpex2_p3 = fpex2_board.create('point', [fpex2_p2, fpex2_trans]);
 * </script><pre>
 */
JXG.createPoint = function(board, parents, attributes) {
    var el, isConstrained = false, i, show, attr;

    attr = JXG.copyAttributes(attributes, board.options, 'point');

    for (i=0;i<parents.length;i++) {
        if (typeof parents[i]=='function' || typeof parents[i]=='string') {
            isConstrained = true;
        }
    }
    if (!isConstrained) {
        if ( (JXG.isNumber(parents[0])) && (JXG.isNumber(parents[1])) ) {
            el = new JXG.Point(board, parents, attr);
            if ( JXG.exists(attr["slideobject"]) ) {
                el.makeGlider(attr["slideobject"]);
            } else {
                el.baseElement = el; // Free point
            }
            el.isDraggable = true;
        } else if ( (typeof parents[0]=='object') && (typeof parents[1]=='object') ) { // Transformation
            el = new JXG.Point(board, [0,0], attr);
            el.addTransform(parents[0],parents[1]);
            el.isDraggable = false;
        }
        else {// Failure
            throw new Error("JSXGraph: Can't create point with parent types '" + 
                            (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                            "\nPossible parent types: [x,y], [z,x,y], [point,transformation]");
        }
    } else {
        el = new JXG.Point(board, [NaN, NaN], attr);
        el.addConstraint(parents);
    }

    return el;
};

/**
 * @class This element is used to provide a constructor for a glider point. 
 * @pseudo
 * @description A glider is a point which lives on another geometric element like a line, circle, curve, turtle.
 * @name Glider
 * @augments JXG.Point
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {number_number_number_JXG.GeometryElement} z_,x_,y_,GlideObject Parent elements can be two or three elements of type number and the object the glider lives on.
 * The coordinates are completely optional. If not given the origin is used. If you provide two numbers for coordinates they will be interpreted as affine euclidean
 * coordinates, otherwise they will be interpreted as homogeneous coordinates. In any case the point will be projected on the glide object.
 * @example
 * // Create a glider with user defined coordinates. If the coordinates are not on
 * // the circle (like in this case) the point will be projected onto the circle.
 * var p1 = board.create('point', [2.0, 2.0]);
 * var c1 = board.create('circle', [p1, 2.0]);
 * var p2 = board.create('glider', [2.0, 1.5, c1]);
 * </pre><div id="4f65f32f-e50a-4b50-9b7c-f6ec41652930" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var gpex1_board = JXG.JSXGraph.initBoard('4f65f32f-e50a-4b50-9b7c-f6ec41652930', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var gpex1_p1 = gpex1_board.create('point', [2.0, 2.0]);
 *   var gpex1_c1 = gpex1_board.create('circle', [gpex1_p1, 2.0]);
 *   var gpex1_p2 = gpex1_board.create('glider', [2.0, 1.5, gpex1_c1]);
 * </script><pre>
 * @example
 * // Create a glider with default coordinates (1,0,0). Same premises as above.
 * var p1 = board.create('point', [2.0, 2.0]);
 * var c1 = board.create('circle', [p1, 2.0]);
 * var p2 = board.create('glider', [c1]);
 * </pre><div id="4de7f181-631a-44b1-a12f-bc4d995609e8" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   var gpex2_board = JXG.JSXGraph.initBoard('4de7f181-631a-44b1-a12f-bc4d995609e8', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var gpex2_p1 = gpex2_board.create('point', [2.0, 2.0]);
 *   var gpex2_c1 = gpex2_board.create('circle', [gpex2_p1, 2.0]);
 *   var gpex2_p2 = gpex2_board.create('glider', [gpex2_c1]);
 * </script><pre>
 */
JXG.createGlider = function(board, parents, attributes) {
    var el, 
        attr = JXG.copyAttributes(attributes, board.options, 'point');
        
    if (parents.length === 1) {
        el = board.create('point', [0, 0], attr);
    } else {
        el = board.create('point', parents.slice(0, 2), attr);
    }

    el.makeGlider(parents[parents.length-1]);
    
    return el;
};

/**
 * @class This element is used to provide a constructor for an intersection point. 
 * @pseudo
 * @description An intersection point is a point which lives on two Lines or Circles or one Line and one Circle at the same time, i.e.
 * an intersection point of the two elements.
 * @name Intersection
 * @augments JXG.Point
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_number} el1,el2,i The result will be a intersection point on el1 and el2. i determines the
 * intersection point if two points are available: <ul>
 *   <li>i==0: use the positive square root,</li> 
 *   <li>i==1: use the negative square root.</li></ul>
 * @example
 * // Create an intersection point of circle and line
 * var p1 = board.create('point', [2.0, 2.0]);
 * var c1 = board.create('circle', [p1, 2.0]);
 * 
 * var p2 = board.create('point', [2.0, 2.0]);
 * var p3 = board.create('point', [2.0, 2.0]);
 * var l1 = board.create('line', [p2, p3]);
 * 
 * var i = board.create('intersection', [c1, l1, 0]);
 * </pre><div id="e5b0e190-5200-4bc3-b995-b6cc53dc5dc0" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var ipex1_board = JXG.JSXGraph.initBoard('e5b0e190-5200-4bc3-b995-b6cc53dc5dc0', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ipex1_p1 = ipex1_board.create('point', [4.0, 4.0]);
 *   var ipex1_c1 = ipex1_board.create('circle', [ipex1_p1, 2.0]);
 *   var ipex1_p2 = ipex1_board.create('point', [1.0, 1.0]);
 *   var ipex1_p3 = ipex1_board.create('point', [5.0, 3.0]);
 *   var ipex1_l1 = ipex1_board.create('line', [ipex1_p2, ipex1_p3]);
 *   var ipex1_i = ipex1_board.create('intersection', [ipex1_c1, ipex1_l1, 0]);
 * </script><pre>
 */
JXG.createIntersectionPoint = function(board, parents, attributes) {
    var el;
    if (parents.length>=3) {
        if(parents.length == 3)
            parents.push(null);
        el = board.create('point', [board.intersection(parents[0], parents[1], parents[2], parents[3])], attributes);
    }

    parents[0].addChild(el);
    parents[1].addChild(el);

    el.generatePolynomial = function () {
        var poly1 = parents[0].generatePolynomial(el);
        var poly2 = parents[1].generatePolynomial(el);

        if((poly1.length == 0) || (poly2.length == 0))
            return [];
        else
            return [poly1[0], poly2[0]];
    };
    
    return el;
};

/**
 * @class This element is used to provide a constructor for the "other" intersection point.
 * @pseudo
 * @description An intersection point is a point which lives on two Lines or Circles or one Line and one Circle at the same time, i.e.
 * an intersection point of the two elements. Additionally, one intersection point is provided. The function returns the other intersection point.
 * @name OtherIntersection
 * @augments JXG.Point
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line,JXG.Circle_JXG.Line,JXG.Circle_JXG.Point} el1,el2,p The result will be a intersection point on el1 and el2. i determines the
 * intersection point different from p: 
 * @example
 * // Create an intersection point of circle and line
 * var p1 = board.create('point', [2.0, 2.0]);
 * var c1 = board.create('circle', [p1, 2.0]);
 * 
 * var p2 = board.create('point', [2.0, 2.0]);
 * var p3 = board.create('point', [2.0, 2.0]);
 * var l1 = board.create('line', [p2, p3]);
 * 
 * var i = board.create('intersection', [c1, l1, 0]);
 * var j = board.create('otherintersection', [c1, l1, i]);
 * </pre><div id="45e25f12-a1de-4257-a466-27a2ae73614c" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var ipex2_board = JXG.JSXGraph.initBoard('45e25f12-a1de-4257-a466-27a2ae73614c', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ipex2_p1 = ipex2_board.create('point', [4.0, 4.0]);
 *   var ipex2_c1 = ipex2_board.create('circle', [ipex2_p1, 2.0]);
 *   var ipex2_p2 = ipex2_board.create('point', [1.0, 1.0]);
 *   var ipex2_p3 = ipex2_board.create('point', [5.0, 3.0]);
 *   var ipex2_l1 = ipex2_board.create('line', [ipex2_p2, ipex2_p3]);
 *   var ipex2_i = ipex2_board.create('intersection', [ipex2_c1, ipex2_l1, 0], {name:'D'});
 *   var ipex2_j = ipex2_board.create('otherintersection', [ipex2_c1, ipex2_l1, ipex2_i], {name:'E'});
 * </script><pre>
 */
JXG.createOtherIntersectionPoint = function(board, parents, attributes) {
    var el;
    if (parents.length!=3 || 
        !JXG.isPoint(parents[2]) ||
        (parents[0].elementClass != JXG.OBJECT_CLASS_LINE && parents[0].elementClass != JXG.OBJECT_CLASS_CIRCLE) ||
        (parents[1].elementClass != JXG.OBJECT_CLASS_LINE && parents[1].elementClass != JXG.OBJECT_CLASS_CIRCLE) ) {
        // Failure
        throw new Error("JSXGraph: Can't create 'other intersection point' with parent types '" + 
                        (typeof parents[0]) + "',  '" + (typeof parents[1])+ "'and  '" + (typeof parents[2]) + "'." +
                        "\nPossible parent types: [circle|line,circle|line,point]");
    }
    else {
        el = board.create('point', [board.otherIntersection(parents[0], parents[1], parents[2])], attributes);
    }
    
    parents[0].addChild(el);
    parents[1].addChild(el);

    el.generatePolynomial = function () {
        var poly1 = parents[0].generatePolynomial(el);
        var poly2 = parents[1].generatePolynomial(el);

        if((poly1.length == 0) || (poly2.length == 0))
            return [];
        else
            return [poly1[0], poly2[0]];
    };
    
    return el;
};


JXG.JSXGraph.registerElement('point',JXG.createPoint);
/*
// Post-poned (A.W.)
JXG.JSXGraph.registerElement('point', {
    icon:           'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAqCAIAAACofUV1AAAAu0lEQVR42u2Y2w7EIAhEYeL//zL7ttntRakyhjTw2MhwYDSaqplJgoDkiAAOFV0XaSGFD19MjMjh7/u70g8E6vBV1JmIQK2VHhp7A/5KdWxKf24Dh+HRxDaIvnJiX3jD6OhjM8RdlRfdc/Ece0y5rFW+FEdxFMerOCbe+9NxqFW+9Dn2WHOuAs8iNkT6/cEbyZ0yniYwIBL50ob4IY/F4XThkVj0yJOOQK2VHtpEW0OnuP+lqEep7rn/+AD75zNf8mTQTQAAAABJRU5ErkJggg%3D%3D',
    label:          'Free point',
    alttext:        'Constructs a free point',
    category:       'basic/points',
    description:    'Click on the board to place a free point or enter a pair of coordinates in the textbox.',
    showCoordsBox:  true,
    showInputbox:   false,
    checkInput:     function (draft, input) {
                       if(draft && input[input.length-1].usrCoords)
                           return true;

                       if(!draft && input.length == 1) {
                           return board.create('point', input[0].usrCoords.slice(1));
                       }

                       return false;
                    },
    creator:        JXG.createPoint
});
*/
JXG.JSXGraph.registerElement('glider', JXG.createGlider);
JXG.JSXGraph.registerElement('intersection', JXG.createIntersectionPoint);
JXG.JSXGraph.registerElement('otherintersection', JXG.createOtherIntersectionPoint);
