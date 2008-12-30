 /*
    Copyright 2008,
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
var JSXTurtleObj = function(board,attributes) {
    this.turtleIsHidden = false;
    this.board = board;
    if (attributes==null) {
        this.attributes = {
            strokeColor:'#000000'
        };
    } else {
        this.attributes = attributes;
    }
    this.attributes.straightFirst = false;
    this.attributes.straightLast = false;
    this.init();
};

JSXTurtleObj.prototype.init = function() {
    this.pos = [0,0];
    this.isPenDown = true;
    this.dir = 90;
    this.stack = [];
    this.attributes.curveType = 'plot';
    this.curve = this.board.createElement('curve',
            [[this.pos[0]],[this.pos[1]]],this.attributes);

    this.turtle = this.board.createElement('point',this.pos,{fixed:true,name:' ',visible:false});
    this.turtle2 = this.board.createElement('point',[this.pos[0],this.pos[1]+20],
            {fixed:true,name:' ',visible:false});
    this.arrow = this.board.createElement('line',[this.turtle,this.turtle2],
            {lastArrow:true,strokeColor:'#ff0000',straightFirst:false,straightLast:false});
}

JSXTurtleObj.prototype.forward = function(len) {
    if (len==0) { return; }
    var dx = -len*Math.cos(this.dir*Math.PI/180.0);
    var dy = len*Math.sin(this.dir*Math.PI/180.0);
    if (!this.turtleIsHidden) {
        var t = this.board.createElement('transform', [dx,dy], {type:'translate'});
        t.applyOnce(this.turtle);
        t.applyOnce(this.turtle2);
    }
    if (this.isPenDown) if (this.curve.dataX.length>=8192) { // IE workaround
        this.curve = this.board.createElement('curve',
               [[this.pos[0]],[this.pos[1]]],this.attributes);
    }
    this.pos[0] += dx;
    this.pos[1] += dy;
    if (this.isPenDown) {
        this.curve.dataX.push(this.pos[0]);
        this.curve.dataY.push(this.pos[1]);
    }
    return this;
};
     
JSXTurtleObj.prototype.back = function(len) {
    return this.forward(-len);
};
     
JSXTurtleObj.prototype.right = function(angle) {
    this.dir += angle;
    if (!this.turtleIsHidden) {
        var t = this.board.createElement('transform', [-angle*Math.PI/180.0,this.turtle], {type:'rotate'});
        t.applyOnce(this.turtle2);
    }
    return this;
};
     
JSXTurtleObj.prototype.left = function(angle) {
    return this.right(-angle);
};

JSXTurtleObj.prototype.penUp = function() {
    this.isPenDown = false;
    return this;
};

JSXTurtleObj.prototype.penDown = function() {
    this.isPenDown = true;
    this.curve = this.board.createElement('curve',
    [[this.pos[0]],[this.pos[1]]],this.attributes);
    return this;
};

JSXTurtleObj.prototype.clean = function() {
    for(var el in this.board.objects) {
        if (this.board.objects[el].type==JXG.OBJECT_TYPE_CURVE) {
            this.board.removeObject(el);
        }
    }
    return this;
};

JSXTurtleObj.prototype.clearScreen = function() {
    for(var el in this.board.objects) {
        this.board.removeObject(el);
    }
    this.init();
    return this;
};

JSXTurtleObj.prototype.setPos = function(x,y) {
    this.pos = [x,y];
    if (!this.turtleIsHidden) {
        this.turtle.setPositionDirectly(JXG.COORDS_BY_USER,x,y);
        this.turtle2.setPositionDirectly(JXG.COORDS_BY_USER,x,y+20);
        var t = this.board.createElement('transform', 
                [-(this.dir-90)*Math.PI/180.0,this.turtle], {type:'rotate'});
        t.applyOnce(this.turtle2);
    }
    this.curve = this.board.createElement('curve',
            [[this.pos[0]],[this.pos[1]]],this.attributes);
    return this;
}

JSXTurtleObj.prototype.setPenSize = function(size) { 
    this.attributes.strokeWidth = size; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    return this;
};

JSXTurtleObj.prototype.setPenColor = function(colStr) { 
    this.attributes.strokeColor = colStr; 
    this.curve = this.board.createElement('curve',[[this.pos[0]],[this.pos[1]]],this.attributes);
    return this;
};

JSXTurtleObj.prototype.setProperty = function() {
    var pair;
    var pairRaw;
    var i;
    var key;
    for (i=0; i<arguments.length; i++) {
        pairRaw = arguments[i];
        if (typeof pairRaw == 'string') {    // pairRaw is string of the form 'key:value'
            pair = pairRaw.split(':');
        } else if (!Object.isArray(pairRaw)) {    // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
            for (i=0; i<Object.keys(pairRaw).length;i++) {  // Here, the prototype lib is used (Object.keys, Object.isArray)
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
    return this;
};

JSXTurtleObj.prototype.showTurtle = function() { 
    this.turtleIsHidden = false; 
    this.arrow.setProperty('visible:true');
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

JSXTurtleObj.prototype.hideTurtle = function() { 
    this.turtleIsHidden = true;
    this.arrow.setProperty('visible:false');
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

JSXTurtleObj.prototype.home= function() { 
    this.pos = [0,0];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

JSXTurtleObj.prototype.pushTurtle= function() { 
    this.stack.push([this.pos[0],this.pos[1],this.dir]);
    return this;
};

JSXTurtleObj.prototype.popTurtle= function() { 
    var status = this.stack.pop();
    this.pos[0] = status[0];
    this.pos[1] = status[1];
    this.dir = status[2];
    this.setPos(this.pos[0],this.pos[1]);
    return this;
};

/**
  * Shortcuts
  */
JSXTurtleObj.prototype.fd = function(len) { return this.forward(len); };
JSXTurtleObj.prototype.bk = function(len) { return this.back(len); };
JSXTurtleObj.prototype.lt = function(angle) { return this.left(angle); };
JSXTurtleObj.prototype.rt = function(angle) { return this.right(angle); };
JSXTurtleObj.prototype.pu = function() { return this.penUp(); };
JSXTurtleObj.prototype.pd = function() { return this.penDown(); };
JSXTurtleObj.prototype.ht = function() { return this.hideTurtle(); };
JSXTurtleObj.prototype.st = function() { return this.showTurtle(); };
JSXTurtleObj.prototype.cs = function() { return this.clearScreen(); };
JSXTurtleObj.prototype.push = function() { return this.pushTurtle(); };
JSXTurtleObj.prototype.pop = function() { return this.popTurtle(); };

