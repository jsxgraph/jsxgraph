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
 * Turtle graphics.
 * Possible input parentArr is the start position and the start direction:
 * [x,y,dir]
 * [[x,y],dir]
 * [x,y]
 * [[x,y]]
 * parentArr may be empty or null.
 **/
JXG.Turtle = function (board, parentArr, attributes) {
    this.arrowLen = 20.0;
    this.turtleIsHidden = false;
    this.board = board;
    if (attributes==null) {
        this.attributes = {};
    } else {
        this.attributes = attributes;
    }
    this.attributes.straightFirst = false;
    this.attributes.straightLast = false;
    this.init();
    
    if (parentArr.length!=0) {
        if (parentArr.length==3) {   // [x,y,dir]
            // Only numbers are accepted at the moment
            this.setPos(parentArr[0],parentArr[1]);
            this.right(90-parentArr[2]);
        } else if (parentArr.length==2) {
            if (JXG.IsArray(parentArr[0])) {  // [[x,y],dir]
                this.setPos(parentArr[0][0],parentArr[0][1]);
                this.right(90-parentArr[1]);
            } else {  // [x,y]
                this.setPos(parentArr[0],parentArr[1]);
            }
        } else { // [[x,y]]
           this.setPos(parentArr[0][0],parentArr[0][1]);
        }
    }
    
    return this;
} 
JXG.Turtle.prototype = new JXG.GeometryElement;

JXG.Turtle.prototype.init = function() {
    this.arrowLen = 20.0/Math.sqrt(this.board.unitX*this.board.unitX+this.board.unitY*this.board.unitY);

    this.pos = [0,0];
    this.isPenDown = true;
    this.dir = 90;
    this.stack = [];
    this.objects = [];
    this.attributes.curveType = 'plot';
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);

    this.turtle = this.board.createElement('point',this.pos,{fixed:true,name:' ',visible:false});
    this.objects.push(this.turtle);
    
    this.turtle2 = this.board.createElement('point',[this.pos[0],this.pos[1]+this.arrowLen],
            {fixed:true,name:' ',visible:false});
    this.objects.push(this.turtle2);
    
    this.arrow = this.board.createElement('line',[this.turtle,this.turtle2],
            {lastArrow:true,strokeColor:'#ff0000',straightFirst:false,straightLast:false});
    this.objects.push(this.arrow);
    
    this.board.update();
}

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
     
JXG.Turtle.prototype.back = function(len) {
    return this.forward(-len);
};
     
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
     
JXG.Turtle.prototype.left = function(angle) {
    return this.right(-angle);
};

JXG.Turtle.prototype.penUp = function() {
    this.isPenDown = false;
    return this;
};

JXG.Turtle.prototype.penDown = function() {
    this.isPenDown = true;
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
            
    return this;
};

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

JXG.Turtle.prototype.clearScreen = function() {
    for(var i=0;i<this.objects.length;i++) {
        var el = this.objects[i];
        this.board.removeObject(el.id);
    }
    this.init();
    return this;
};

JXG.Turtle.prototype.setPos = function(x,y) {
    if (JXG.IsArray(x)) {
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
}

JXG.Turtle.prototype.setPenSize = function(size) { 
    this.attributes.strokeWidth = size; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

JXG.Turtle.prototype.setPenColor = function(colStr) { 
    this.attributes.strokeColor = colStr; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

JXG.Turtle.prototype.setProperty = function() {
    var pair;
    var pairRaw;
    var i;
    var key;
    for (i=0; i<arguments.length; i++) {
        pairRaw = arguments[i];
        if (typeof pairRaw == 'string') {    // pairRaw is string of the form 'key:value'
            pair = pairRaw.split(':');
        } else if (!Object.isArray(pairRaw)) {    
            // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
            for (i=0; i<Object.keys(pairRaw).length;i++) {  
                // Here, the prototype lib is used (Object.keys, Object.isArray)
                key = Object.keys(pairRaw)[i];
                this.setProperty([key,pairRaw[key]]);
            }
            return;
        } else {                             // pairRaw consists of array [key,value]
            pair = pairRaw;
        }
        this.attributes[pair[0]] = pair[1];
    }
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    this.objects.push(this.curve);
    return this;
};

JXG.Turtle.prototype.showTurtle = function() { 
    this.turtleIsHidden = false; 
    this.arrow.setProperty('visible:true');
    this.setPos(this.pos[0],this.pos[1]);
    this.board.update();
    return this;
};

JXG.Turtle.prototype.hideTurtle = function() { 
    this.turtleIsHidden = true;
    this.arrow.setProperty('visible:false');
    this.setPos(this.pos[0],this.pos[1]);
    this.board.update();
    return this;
};

JXG.Turtle.prototype.home= function() { 
    this.pos = [0,0];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

JXG.Turtle.prototype.pushTurtle= function() { 
    this.stack.push([this.pos[0],this.pos[1],this.dir]);
    return this;
};

JXG.Turtle.prototype.popTurtle= function() { 
    var status = this.stack.pop();
    this.pos[0] = status[0];
    this.pos[1] = status[1];
    this.dir = status[2];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

JXG.Turtle.prototype.lookTo= function(target) { 
    if (JXG.IsArray(target)) {
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
    } else if (JXG.IsNumber(target)) {
        this.right(this.dir-(target));
    }
    return this;
}

/**
  * Shortcuts
  */
JXG.Turtle.prototype.fd = function(len) { return this.forward(len); };
JXG.Turtle.prototype.bk = function(len) { return this.back(len); };
JXG.Turtle.prototype.lt = function(angle) { return this.left(angle); };
JXG.Turtle.prototype.rt = function(angle) { return this.right(angle); };
JXG.Turtle.prototype.pu = function() { return this.penUp(); };
JXG.Turtle.prototype.pd = function() { return this.penDown(); };
JXG.Turtle.prototype.ht = function() { return this.hideTurtle(); };
JXG.Turtle.prototype.st = function() { return this.showTurtle(); };
JXG.Turtle.prototype.cs = function() { return this.clearScreen(); };
JXG.Turtle.prototype.push = function() { return this.pushTurtle(); };
JXG.Turtle.prototype.pop = function() { return this.popTurtle(); };

JXG.createTurtle = function(board, parentArr, atts) {
    if (parentArr==null) {
        var parentArr = [];
    }
    return new JXG.Turtle(board,parentArr,atts);
}

JXG.JSXGraph.registerElement('turtle', JXG.createTurtle);
