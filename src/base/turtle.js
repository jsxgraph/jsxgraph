/*
    Copyright 2008-2013
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


/**
 * @fileoverview The JSXGraph object Turtle is defined. It acts like
 * "turtle graphics".
 * @author A.W.
 */

/**
 * Constructs a new Turtle object.
 * @class This is the Turtle class. 
 * It is derived from {@link JXG.GeometryElement}.
 * It stores all properties required
 * to move a turtle.
 * @constructor
 * @param {String} JXG.board The board the new turtle is drawn on.
 * @param {Array}  [x,y,angle] Start position and start direction of the turtle. Possible values are
 * [x,y,angle]
 * [[x,y],angle]
 * [x,y]
 * [[x,y]]
 * @param {Object} attributes Attributes to change the visual properties of the turtle object
 * All angles are in degrees.
  */
JXG.Turtle = function (board, parents, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_TURTLE, JXG.OBJECT_CLASS_OTHER);

    var x,y,dir;
    this.turtleIsHidden = false;
    this.board = board;
    this.visProp.curveType = 'plot';

    // Save visProp in this._attributes.
    // this._attributes is overwritten by setPenSize, setPenColor...
    // Setting the color or size affects the turtle from the time of
    // calling the method,
    // whereas Turtle.setProperty affects all turtle curves.
    this._attributes = JXG.copyAttributes(this.visProp, board.options, 'turtle');
    delete(this._attributes['id']);
    
    x = 0;
    y = 0;
    dir = 90;
    if (parents.length!=0) {
        if (parents.length==3) {   // [x,y,dir]
            // Only numbers are accepted at the moment
            x = parents[0];
            y = parents[1];
            dir = parents[2];
        } else if (parents.length==2) {
            if (JXG.isArray(parents[0])) {  // [[x,y],dir]
                x = parents[0][0];
                y = parents[0][1];
                dir = parents[1];
            } else {  // [x,y]
                x = parents[0];
                y = parents[1];
            }
        } else { // [[x,y]]
            x = parents[0][0];
            y = parents[0][1];
        }
    }
    
    this.init(x,y,dir);
    return this;
};
JXG.Turtle.prototype = new JXG.GeometryElement;

JXG.extend(JXG.Turtle.prototype, /** @lends JXG.Turtle.prototype */ {
    /**
    * Initialize a new turtle or reinitialize  a turtle after {@link #clearscreen}.
    * @private
    */
    init: function(x,y,dir) {
        this.arrowLen = 20.0/Math.sqrt(this.board.unitX*this.board.unitX+this.board.unitY*this.board.unitY);

        this.pos = [x,y];
        this.isPenDown = true;
        this.dir = 90;
        this.stack = [];
        this.objects = [];
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this._attributes);
        this.objects.push(this.curve);

        this.turtle = this.board.create('point',this.pos,{fixed:true, name:' ', visible:false, withLabel:false});
        this.objects.push(this.turtle);
        
        this.turtle2 = this.board.create('point',[this.pos[0],this.pos[1]+this.arrowLen],
                {fixed:true, name:' ', visible:false, withLabel:false});
        this.objects.push(this.turtle2);
        
		this.visProp.arrow['lastArrow'] = true;
		this.visProp.arrow['straightFirst'] = false;
		this.visProp.arrow['straightLast'] = false;
        this.arrow = this.board.create('line', [this.turtle,this.turtle2], this.visProp.arrow);
        this.objects.push(this.arrow);

        this.right(90-dir);
        this.board.update();
    },

    /**
    * Move the turtle forward.
    * @param {Number} length of forward move in user coordinates
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    forward: function(len) {
        if (len === 0) {
            return this;
        }

        var dx = len*Math.cos(this.dir*Math.PI/180.0),
            dy = len*Math.sin(this.dir*Math.PI/180.0);
        
        if (!this.turtleIsHidden) {
            var t = this.board.create('transform', [dx,dy], {type:'translate'});
            t.applyOnce(this.turtle);
            t.applyOnce(this.turtle2);
        }
        if (this.isPenDown) if (this.curve.dataX.length>=8192) { // IE workaround
            this.curve = this.board.create('curve',
                   [[this.pos[0]],[this.pos[1]]], this._attributes);
            this.objects.push(this.curve);
        }
        this.pos[0] += dx;
        this.pos[1] += dy;
        if (this.isPenDown) {
            this.curve.dataX.push(this.pos[0]);
            this.curve.dataY.push(this.pos[1]);
        }

        this.board.update();
        return this;
    },
     
    /**
    * Move the turtle backwards.
    * @param {Number} length of backwards move in user coordinates
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    back: function(len) {
        return this.forward(-len);
    },
     
    /**
    * Rotate the turtle direction to the right
    * @param {Number} angle of the rotation in degrees
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    right: function(angle) {
        this.dir -= angle;
        this.dir %= 360.0;
        if (!this.turtleIsHidden) {
            var t = this.board.create('transform', [-angle*Math.PI/180.0,this.turtle], {type:'rotate'});
            t.applyOnce(this.turtle2);
        }
        this.board.update();
        return this;
    },
     
    /**
    * Rotate the turtle direction to the right.
    * @param {Number} angle of the rotation in degrees
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    left: function(angle) {
        return this.right(-angle);
    },

    /**
    * Pen up, stops visible drawing
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    penUp: function() {
        this.isPenDown = false;
        return this;
    },

    /**
    * Pen down, continues visible drawing
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    penDown: function() {
        this.isPenDown = true;
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this._attributes);
        this.objects.push(this.curve);
		
        return this;
    },

    /**
    *  Removes the turtle curve from the board. The turtle stays in its position.
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    clean: function() {
        for(var i=0;i<this.objects.length;i++) {
            var el = this.objects[i];
            if (el.type==JXG.OBJECT_TYPE_CURVE) {
                this.board.removeObject(el);
                this.objects.splice(i,1);
            }
        }
        this.curve = this.board.create('curve',
                  [[this.pos[0]],[this.pos[1]]], this._attributes);
        this.objects.push(this.curve);
        this.board.update();
        return this;
    },

    /**
    *  Removes the turtle completely and resets it to its initial position and direction.
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    clearScreen: function() {
        var i, el, len = this.objects.length;
        for(i=0; i<len; i++) {
            el = this.objects[i];
            this.board.removeObject(el);
        }
        this.init(0,0, 90);
        return this;
    },

    /**
    *  Moves the turtle without drawing to a new position
    * @param {Number} x new x- coordinate
    * @param {Number} y new y- coordinate
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    setPos: function(x,y) {
        if (JXG.isArray(x)) {
            this.pos = x;
        } else {
            this.pos = [x,y];
        }
        if (!this.turtleIsHidden) {
            this.turtle.setPositionDirectly(JXG.COORDS_BY_USER, [x, y]);
            this.turtle2.setPositionDirectly(JXG.COORDS_BY_USER, [x, y + this.arrowLen]);
            var t = this.board.create('transform', 
                    [-(this.dir-90)*Math.PI/180.0,this.turtle], {type:'rotate'});
            t.applyOnce(this.turtle2);
        }
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this._attributes);
        this.objects.push(this.curve);
        this.board.update();
        return this;
    },

    /**
    *  Sets the pen size. Equivalent to setProperty({strokeWidth:size})
    * but affects only the future turtle.
    * @param {Number} size
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
   setPenSize: function(size) { 
        //this.visProp.strokewidth = size; 
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this.copyAttr('strokeWidth', size));
        this.objects.push(this.curve);
        return this;
    },

    /**
    *  Sets the pen color. Equivalent to setProperty({strokeColor:color})
    * but affects only the future turtle.
    * @param {String} color
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    setPenColor: function(colStr) { 
        //this.visProp.strokecolor = colStr; 
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this.copyAttr('strokeColor', colStr));
        this.objects.push(this.curve);
        return this;
    },

    /**
    *  Sets the highlight pen color. Equivalent to setProperty({highlightStrokeColor:color})
    * but affects only the future turtle.
    * @param {String} color
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    setHighlightPenColor: function(colStr) { 
        //this.visProp.highlightstrokecolor = colStr; 
        this.curve = this.board.create('curve',[[this.pos[0]],[this.pos[1]]], this.copyAttr('highlightStrokeColor', colStr));
        this.objects.push(this.curve);
        return this;
    },

    /**
    * Sets properties of the turtle, see also {@link JXG.GeometryElement#setProperty}.
    * Sets the property for all curves of the turtle in the past and in the future.
    * @param {Object} key:value pairs
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    setProperty: function(attributes) {
        var i, el, len = this.objects.length, tmp;
        for (i=0; i<len; i++) {
            el = this.objects[i];
            if (el.type==JXG.OBJECT_TYPE_CURVE) {
                el.setProperty(attributes);
            }
        }
        // Set visProp of turtle
        tmp = this.visProp['id'];
        this.visProp = JXG.deepCopy(this.curve.visProp);
        this.visProp['id'] = tmp;
        this._attributes = JXG.deepCopy(this.visProp);
        delete(this._attributes['id']);
        return this;
    },
    
    /**
    * Set a future attribute of the turtle.
    * @private
    * @param {String} key
    * @param {Object} value (number, string)
    * @type {Object}
    * @return pointer to an attributes object
    */
    copyAttr: function(key, val) {
        this._attributes[key.toLowerCase()] = val;
        return this._attributes;
    },

    /**
    * Sets the visibility of the turtle head to true,
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    showTurtle: function() { 
        this.turtleIsHidden = false; 
        this.arrow.setProperty({visible:true});
        this.visProp.arrow['visible'] = false;
        this.setPos(this.pos[0],this.pos[1]);
        this.board.update();
        return this;
    },

    /**
    * Sets the visibility of the turtle head to false,
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    hideTurtle: function() { 
        this.turtleIsHidden = true;
        this.arrow.setProperty({visible:false});
        this.visProp.arrow['visible'] = false;
        //this.setPos(this.pos[0],this.pos[1]);
        this.board.update();
        return this;
    },

    /**
    * Moves the turtle to position [0,0].
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    home: function() { 
        this.pos = [0,0];
        this.setPos(this.pos[0],this.pos[1]);
        return this;
    },

    /**
    *  Pushes the position of the turtle on the stack.
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    pushTurtle: function() { 
        this.stack.push([this.pos[0],this.pos[1],this.dir]);
        return this;
    },

    /**
    *  Gets the last position of the turtle on the stack, sets the turtle to this position and removes this 
    * position from the stack.
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    popTurtle: function() { 
        var status = this.stack.pop();
        this.pos[0] = status[0];
        this.pos[1] = status[1];
        this.dir = status[2];
        this.setPos(this.pos[0],this.pos[1]);
        return this;
    },

    /**
    * Rotates the turtle into a new direction.
    * There are two possibilities:
    * @param {Number} angle New direction to look to
    * or
    * @param {Number} x New x coordinate to look to
    * @param {Number} y New y coordinate to look to
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    lookTo: function(target) { 
        if (JXG.isArray(target)) {
            var ax = this.pos[0];
            var ay = this.pos[1];
            var bx = target[0];
            var by = target[1];
            var beta; 
            // Rotate by the slope of the line [this.pos, target]
            /*
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan2(by-ay,bx-ax)+((sgn<0)?Math.PI:0);  
            } else {
                beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
            }
            */
            beta = Math.atan2(by-ay,bx-ax);
            this.right(this.dir-(beta*180/Math.PI));
        } else if (JXG.isNumber(target)) {
            this.right(this.dir-(target));
        }
        return this;
    },

    /**
    * Moves the turtle to a given coordinate pair.
    * The direction is not changed.
    * @param {Number} x New x coordinate to look to
    * @param {Number} y New y coordinate to look to
    * @type {JXG.Turtle}
    * @return pointer to the turtle object
    */
    moveTo: function(target) { 
        if (JXG.isArray(target)) {
            var dx = target[0]-this.pos[0];
            var dy = target[1]-this.pos[1];
            if (!this.turtleIsHidden) {
                var t = this.board.create('transform', [dx,dy], {type:'translate'});
                t.applyOnce(this.turtle);
                t.applyOnce(this.turtle2);
            }
            if (this.isPenDown) if (this.curve.dataX.length>=8192) { // IE workaround
                this.curve = this.board.create('curve',
                   [[this.pos[0]],[this.pos[1]]], this._attributes);
                this.objects.push(this.curve);
            }
            this.pos[0] = target[0];
            this.pos[1] = target[1];
            if (this.isPenDown) {
                this.curve.dataX.push(this.pos[0]);
                this.curve.dataY.push(this.pos[1]);
            }
            this.board.update();
        }
        return this;
    },

    /**
      * Alias for {@link #forward}
      */
    fd: function(len) { return this.forward(len); },
    /**
      * Alias for {@link #back}
      */
    bk: function(len) { return this.back(len); },
    /**
      * Alias for {@link #left}
      */
    lt: function(angle) { return this.left(angle); },
    /**
      * Alias for {@link #right}
      */
    rt: function(angle) { return this.right(angle); },
    /**
      * Alias for {@link #penUp}
      */
    pu: function() { return this.penUp(); },
    /**
      * Alias for {@link #penDown}
      */
    pd: function() { return this.penDown(); },
    /**
      * Alias for {@link #hideTurtle}
      */
    ht: function() { return this.hideTurtle(); },
    /**
      * Alias for {@link #showTurtle}
      */
    st: function() { return this.showTurtle(); },
    /**
      * Alias for {@link #clearScreen}
      */
    cs: function() { return this.clearScreen(); },
    /**
      * Alias for {@link #pushTurtle}
      */
    push: function() { return this.pushTurtle(); },
    /**
      * Alias for {@link #popTurtle}
      */
    pop: function() { return this.popTurtle(); },

    /**
     * the "co"-coordinate of the turtle curve at position t is returned.
     * @param {Number} t parameter
     * @param {String} coordinate. Either 'X' or 'Y'.
     * @return {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
     */
    evalAt: function(/** float */ t, /** string */ co) /** float */ { 
        var i, j, el, tc, len = this.objects.length;
        for (i=0, j=0; i<len; i++) {
            el = this.objects[i]; 
            if (el.elementClass == JXG.OBJECT_CLASS_CURVE) {
                if (j<=t && t<j+el.numberPoints) {
                    tc = (t-j);
                    return el[co](tc);
                }
                j += el.numberPoints;
            }
        }
        return this[co]();
    },

    /**
     * if t is not supplied the x-coordinate of the turtle is returned. Otherwise
     * the x-coordinate of the turtle curve at position t is returned.
     * @param {Number} t parameter
     * @return {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
     */
    X: function(/** float */ t) /** float */ { 
        if (typeof t == 'undefined' ) {
            return this.pos[0]; //this.turtle.X();
        } else {
            return this.evalAt(t, 'X');
        }
    },

    /**
     * if t is not supplied the y-coordinate of the turtle is returned. Otherwise
     * the y-coordinate of the turtle curve at position t is returned.
     * @param {Number} t parameter
     * @return {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
     */
    Y: function(/** float */ t) /** float */ { 
        if (typeof t == 'undefined' ) {
            return this.pos[1]; //this.turtle.Y();
        } else {
            return this.evalAt(t, 'Y');
        }
    },

    /**
    * @return z-coordinate of the turtle position
    * @type {Number}
    */
    Z: function(/** float */ t) /** float */ { 
        return 1.0; 
    },

    /**
     * Gives the lower bound of the parameter if the the turtle is treated as parametric curve.
     */
    minX: function () {
        return 0;
    },

    /**
     * Gives the upper bound of the parameter if the the turtle is treated as parametric curve.
     * May be overwritten in @see generateTerm.
     */
    maxX: function () {
        var np = 0, i, len = this.objects.length, el;
        for (i=0; i <len; i++) {
            el = this.objects[i];
            if (el.elementClass == JXG.OBJECT_CLASS_CURVE) {
                np += this.objects[i].numberPoints; 
            }
        }
        return np;
    },

    /**
     * Checks whether (x,y) is near the curve.
     * @param {Number} x Coordinate in x direction, screen coordinates.
     * @param {Number} y Coordinate in y direction, screen coordinates.
     * @return {Boolean} True if (x,y) is near the curve, False otherwise.
     */
    hasPoint: function (x,y) {
        var i, el;
        for(i=0;i<this.objects.length;i++) {  // run through all curves of this turtle
            el = this.objects[i];
            if (el.type==JXG.OBJECT_TYPE_CURVE) {
                if (el.hasPoint(x,y)) {
                    return true;              // So what??? All other curves have to be notified now (for highlighting)
                                              // This has to be done, yet.
                }
            }
        }
        return false;
    }
});

/**
 * Creates a new turtle
 * @param {JXG.Board} board The board the turtle is put on.
 * @param {Array} parents 
 * @param {Object} attributes Object containing properties for the element such as stroke-color and visibility. See {@link JXG.GeometryElement#setProperty}
 * @type JXG.Turtle
 * @return Reference to the created turtle object.
 */
JXG.createTurtle = function(board, parents, attributes) {
	var attr;
    parents = parents || [];

    attr = JXG.copyAttributes(attributes, board.options, 'turtle');
    return new JXG.Turtle(board, parents, attr);
};

JXG.JSXGraph.registerElement('turtle', JXG.createTurtle);
