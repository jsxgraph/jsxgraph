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
    var x,y,dir;
    this.type = JXG.OBJECT_TYPE_TURTLE;
    this.turtleIsHidden = false;
    this.board = board;
    if (attributes==null) {
        this.attributes = {};
    } else {
        this.attributes = attributes;
    }
    this.attributes.straightFirst = false;
    this.attributes.straightLast = false;
    this.attributes.withLabel = false;
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

/**
* Initialize a new turtle or reinitialize  a turtle after {@link #clearscreen}.
* @private
*/
JXG.Turtle.prototype.init = function(x,y,dir) {
    this.arrowLen = 20.0/Math.sqrt(this.board.unitX*this.board.unitX+this.board.unitY*this.board.unitY);

    this.pos = [x,y];
    this.isPenDown = true;
    this.dir = 90;
    this.stack = [];
    this.objects = [];
    this.attributes.curveType = 'plot';
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);

    this.turtle = this.board.createElement('point',this.pos,{fixed:true,name:' ',visible:false,withLabel:false});
    this.objects.push(this.turtle);
    
    this.turtle2 = this.board.createElement('point',[this.pos[0],this.pos[1]+this.arrowLen],
            {fixed:true,name:' ',visible:false,withLabel:false});
    this.objects.push(this.turtle2);
    
    var w = this.attributes.strokeWidth || this.attributes.strokewidth || 2;  // Attention; should be moved to Options.js
    this.arrow = this.board.createElement('line',[this.turtle,this.turtle2],
            {lastArrow:true,strokeColor:'#ff0000',straightFirst:false,straightLast:false,strokeWidth:w,withLabel:false});
    this.objects.push(this.arrow);

    this.right(90-dir);
    this.board.update();
};

/**
* Move the turtle forward.
* @param {float} length of forward move in user coordinates
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.forward = function(len) {
    if (len==0) { return; }
    var dx = len*Math.cos(this.dir*Math.PI/180.0);
    var dy = len*Math.sin(this.dir*Math.PI/180.0);
    if (!this.turtleIsHidden) {
        var t = this.board.createElement('transform', [dx,dy], {type:'translate'});
        t.applyOnce(this.turtle);
        t.applyOnce(this.turtle2);
    }
    if (this.isPenDown) if (this.curve.dataX.length>=8192) { // IE workaround
        this.curve = this.board.createElement('curve',
               [[this.pos[0]],[this.pos[1]]],this.attributes);
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
};
     
/**
* Move the turtle backwards.
* @param {float} length of backwards move in user coordinates
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.back = function(len) {
    return this.forward(-len);
};
     
/**
* Rotate the turtle direction to the right
* @param {float} angle of the rotation in degrees
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.right = function(angle) {
    this.dir -= angle;
    this.dir %= 360.0;
    if (!this.turtleIsHidden) {
        var t = this.board.createElement('transform', [-angle*Math.PI/180.0,this.turtle], {type:'rotate'});
        t.applyOnce(this.turtle2);
    }
    this.board.update();
    return this;
};
     
/**
* Rotate the turtle direction to the right.
* @param {float} angle of the rotation in degrees
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.left = function(angle) {
    return this.right(-angle);
};

/**
* Pen up, stops visible drawing
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.penUp = function() {
    this.isPenDown = false;
    return this;
};

/**
* Pen down, continues visible drawing
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.penDown = function() {
    this.isPenDown = true;
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
            
    return this;
};

/**
*  Removes the turtle curve from the board. The turtle stays in its position.
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.clean = function() {
    for(var i=0;i<this.objects.length;i++) {
        var el = this.objects[i];
        if (el.type==JXG.OBJECT_TYPE_CURVE) {
            this.board.removeObject(el.id);
            this.objects.splice(i,1);
        }
    }
    this.curve = this.board.createElement('curve',
              [[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    this.board.update();
    return this;
};

/**
*  Removes the turtle completely and resets it to its initial position and direction.
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.clearScreen = function() {
    for(var i=0;i<this.objects.length;i++) {
        var el = this.objects[i];
        this.board.removeObject(el.id);
    }
    this.init(0,0,90);
    return this;
};

/**
*  Moves the turtle without drawing to a new position
* @param {float} x new x- coordinate 
* @param {float} y new y- coordinate 
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.setPos = function(x,y) {
    if (JXG.isArray(x)) {
        this.pos = x;
    } else {
        this.pos = [x,y];
    }
    if (!this.turtleIsHidden) {
        this.turtle.setPositionDirectly(JXG.COORDS_BY_USER,x,y);
        this.turtle2.setPositionDirectly(JXG.COORDS_BY_USER,x,y+this.arrowLen);
        var t = this.board.createElement('transform', 
                [-(this.dir-90)*Math.PI/180.0,this.turtle], {type:'rotate'});
        t.applyOnce(this.turtle2);
    }
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    this.board.update();
    return this;
};

/**
*  Sets the pen size. Equivalent to setProperty({strokeWidth:size})
* @param {float} size
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.setPenSize = function(size) { 
    this.attributes.strokeWidth = size; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

/**
*  Sets the pen color. Equivalent to setProperty({strokeColor:color})
* @param {string} color
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.setPenColor = function(colStr) { 
    this.attributes.strokeColor = colStr; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

/**
*  Sets the highlight pen color. Equivalent to setProperty({highlightStrokeColor:color})
* @param {string} color
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.setHighlightPenColor = function(colStr) { 
    this.attributes.highlightStrokeColor = colStr; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

/**
* Sets properties of the turtle, see also {@link JXG.GeometryElement#setProperty}.
* Sets the property for all curves of the turtle.
* @param {Object} key:value pairs
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.setProperty = function() {
    var pair;
    var pairRaw;
    var i, el;
    var key;
    for (i=0; i<arguments.length; i++) {
        pairRaw = arguments[i];
        if (typeof pairRaw == 'string') {    // pairRaw is string of the form 'key:value'
            pair = pairRaw.split(':');
        } else if (!JXG.isArray(pairRaw)) {    
            // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
            for (var key in pairRaw) {
                this.setProperty([key,pairRaw[key]]);
            }
            return this;
        } else {                             // pairRaw consists of array [key,value]
            pair = pairRaw;
        }
        this.attributes[pair[0]] = pair[1];
    }
    for (i=0; i<this.objects.length; i++) {
        el = this.objects[i];
        if (el.type==JXG.OBJECT_TYPE_CURVE) {
            el.setProperty(this.attributes);
        }
    }
    //this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    //this.objects.push(this.curve);
    return this;
};

/**
*  Sets the visibility of the turtle head to true,
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.showTurtle = function() { 
    this.turtleIsHidden = false; 
    this.arrow.setProperty('visible:true');
    this.setPos(this.pos[0],this.pos[1]);
    this.board.update();
    return this;
};

/**
*  Sets the visibility of the turtle head to false,
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.hideTurtle = function() { 
    this.turtleIsHidden = true;
    this.arrow.setProperty('visible:false');
    this.setPos(this.pos[0],this.pos[1]);
    this.board.update();
    return this;
};

/**
*  Moves the turtle to position [0,0].
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.home = function() { 
    this.pos = [0,0];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

/**
*  Pushes the position of the turtle on the stack.
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.pushTurtle = function() { 
    this.stack.push([this.pos[0],this.pos[1],this.dir]);
    return this;
};

/**
*  Gets the last position of the turtle on the stack, sets the turtle to this position and removes this 
* position from the stack.
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.popTurtle = function() { 
    var status = this.stack.pop();
    this.pos[0] = status[0];
    this.pos[1] = status[1];
    this.dir = status[2];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

/**
* Rotates the turtle into a new direction.
* There are two possibilities:
* @param {float} angle New direction to look to
* or
* @param {float} x New x coordinate to look to
* @param {float} y New y coordinate to look to
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.lookTo = function(target) { 
    if (JXG.isArray(target)) {
        var ax = this.pos[0];
        var ay = this.pos[1];
        var bx = target[0];
        var by = target[1];
        var beta; 
        // Rotate by the slope of the line [this.pos, target]
        var sgn = (bx-ax>0)?1:-1;
        if (Math.abs(bx-ax)>0.0000001) {
            beta = Math.atan((by-ay)/(bx-ax))+((sgn<0)?Math.PI:0);  
        } else {
            beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
        }
        this.right(this.dir-(beta*180/Math.PI));
    } else if (JXG.isNumber(target)) {
        this.right(this.dir-(target));
    }
    return this;
};

/**
* Moves the turtle to a given coordinate pair.
* The direction is not changed.
* @param {float} x New x coordinate to look to
* @param {float} y New y coordinate to look to
* @type {JXG.Turtle}
* @return pointer to the turtle object
*/
JXG.Turtle.prototype.moveTo = function(target) { 
    if (JXG.isArray(target)) {
        var dx = target[0]-this.pos[0];
        var dy = target[1]-this.pos[1];
        if (!this.turtleIsHidden) {
            var t = this.board.createElement('transform', [dx,dy], {type:'translate'});
            t.applyOnce(this.turtle);
            t.applyOnce(this.turtle2);
        }
        if (this.isPenDown) if (this.curve.dataX.length>=8192) { // IE workaround
            this.curve = this.board.createElement('curve',
               [[this.pos[0]],[this.pos[1]]],this.attributes);
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
};

/**
  * Alias for {@link #forward}
  */
JXG.Turtle.prototype.fd = function(len) { return this.forward(len); };
/**
  * Alias for {@link #back}
  */
JXG.Turtle.prototype.bk = function(len) { return this.back(len); };
/**
  * Alias for {@link #left}
  */
JXG.Turtle.prototype.lt = function(angle) { return this.left(angle); };
/**
  * Alias for {@link #right}
  */
JXG.Turtle.prototype.rt = function(angle) { return this.right(angle); };
/**
  * Alias for {@link #penUp}
  */
JXG.Turtle.prototype.pu = function() { return this.penUp(); };
/**
  * Alias for {@link #penDown}
  */
JXG.Turtle.prototype.pd = function() { return this.penDown(); };
/**
  * Alias for {@link #hideTurtle}
  */
JXG.Turtle.prototype.ht = function() { return this.hideTurtle(); };
/**
  * Alias for {@link #showTurtle}
  */
JXG.Turtle.prototype.st = function() { return this.showTurtle(); };
/**
  * Alias for {@link #clearScreen}
  */
JXG.Turtle.prototype.cs = function() { return this.clearScreen(); };
/**
  * Alias for {@link #pushTurtle}
  */
JXG.Turtle.prototype.push = function() { return this.pushTurtle(); };
/**
  * Alias for {@link #popTurtle}
  */
JXG.Turtle.prototype.pop = function() { return this.popTurtle(); };

/**
* @return x-coordinate of the turtle position
* @type {float}
*/
JXG.Turtle.prototype.X = function(target) { 
    return this.pos[0]; //this.turtle.X();
};

/**
* @return y-coordinate of the turtle position
* @type {float}
*/
JXG.Turtle.prototype.Y = function(target) { 
    return this.pos[1]; //this.turtle.Y();
};

/**
 * Checks whether (x,y) is near the curve.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @param {y} Find closest point on the curve to (x,y)
 * @return {bool} True if (x,y) is near the curve, False otherwise.
 */
JXG.Turtle.prototype.hasPoint = function (x,y) {
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
};

/**
 * Creates a new turtle
 * @param {JXG.Board} board The board the turtle is put on.
 * @param {Array} parents 
 * @param {Object} attributs Object containing properties for the element such as stroke-color and visibility. See {@link JXG.GeometryElement#setProperty}
 * @type JXG.Turtle
 * @return Reference to the created turtle object.
 */
JXG.createTurtle = function(board, parents, attributes) {
    if (parents==null) {
        var parents = [];
    }
    return new JXG.Turtle(board,parents,attributes);
};

JXG.JSXGraph.registerElement('turtle', JXG.createTurtle);
