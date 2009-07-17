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
 * Chart plotting
 * input array: 
 * 
 **/
 
JXG.Chart = function(board, parents, attributes) {
    this.constructor();
    if (parents.length==0) { return; }  // No input data in parentArr
    
    /**
            * Contains lpointers to the various displays.
            */
    this.elements = [];
    
    var id = attributes['id'] || '';
    var name = attributes['name'] || '';
    this.init(board, id, name);
    
    var x,y,i;
    if (parents.length>0 && (typeof parents[0]=='number')) { // parents looks like [a,b,c,..]
                                                                // x has to be filled
        y = parents;
        x = [];
        for (i=0;i<y.length;i++) {
            x[i] = i+1;
        }
    } else {
        if (parents.length==1) { // parents looks like [[a,b,c,..]]
                                // x has to be filled
            y = parents[0];
            x = [];
            var len;
            if (typeof y=='function') {
                len = y().length;
            } else {
                len = y.length;
            }
            for (i=0;i<len;i++) {
                x[i] = i+1;
            }
        }
        if (parents.length==2) { // parents looks like [[x0,x1,x2,...],[y1,y2,y3,...]]
            x = parents[0];
            y = parents[1];
        }
    }
    if (attributes==undefined) attributes = {};
    var style = attributes['chartStyle'] || 'line';
    style = style.replace(/ /g,'');
    style = style.split(',');
    var c;
    for (i=0;i<style.length;i++) {
        switch (style[i]) {
            case 'bar':
                c = this.drawBar(board,[x,y],attributes);
                break;
            case 'line':
                c = this.drawLine(board, [x, y], attributes);
                break;
            case 'spline':
                c = this.drawSpline(board, [x, y], attributes);
                break;
            case 'pie':
                c = this.drawPie(board,[y],attributes);
                break;
            case 'point':
                c = this.drawPoints(board,[x,y],attributes);
                break;
        };
        this.elements.push(c);
    };
    this.id = this.board.addChart(this);
    return this.elements;
};
JXG.Chart.prototype = new JXG.GeometryElement;

JXG.Chart.prototype.drawLine = function(board, parents, attributes) {
    var c = board.createElement('curve', parents, attributes);
    this.rendNode = c.rendNode;  // This is needed in setProperty
    return c;
};

JXG.Chart.prototype.drawSpline = function(board, parents, attributes) {
    var x = parents[0];
    var y = parents[1];
    
    var F = JXG.Math.Numerics.splineDef(x, y);
    var px = new Array();
    var i = 0;
    var delta = (x[x.length-1]-x[0])/board.canvasWidth*1.0;
    while(x[0] + i*delta < x[x.length-1]) {
        px[i] = x[0] + i*delta;
        i++;
    }
    var py = JXG.Math.Numerics.splineEval(px, x, y, F);

    var c = board.createElement('curve', [px, py], attributes);
    this.rendNode = c.rendNode;  // This is needed in setProperty
    return c;
};

JXG.Chart.prototype.drawBar = function(board, parents, attributes) {
    var i;
    var pols = [];
    if (attributes['fillOpacity'] == undefined) {
        attributes['fillOpacity'] = 0.6;
    }
    var x = parents[0];
    var y = parents[1];
    
    // Determine the width of the bars
    var w;
    if (attributes && attributes['width']) {  // width given
        w = attributes['width'];
    } else {
        if (x.length<=1) {
            w = 1;
        } else {
            // Find minimum distance between to bars.
            w = x[1]-x[0];
            for (i=1;i<x.length-1;i++) {  
                w = (x[i+1]-x[i]<w)?(x[i+1]-x[i]):w;
            }
        }
        w *=0.8;
    }
    
    for (i=0;i<x.length;i++) {
        var xp0,xp1,xp2, yp, ypL;
        
        if (typeof x[i]=='function') {  // Not yet
            xp0 = function() { return x[i]()-w*0.5; };
            xp1 = function() { return x[i](); };
            xp2 = function() { return x[i]()+w*0.5; };
        } else {
            xp0 = x[i]-w*0.5;
            xp1 = x[i];
            xp2 = x[i]+w*0.5;
        }
        if (typeof y[i]=='function') {  // Not yet
            ypL = yp; //function() { return y[i]()*1.1; };
        } else {
            ypL = y[i]+0.2;
        }
        yp = y[i];
        
        var p = [];
        if (attributes['dir']=='horizontal') {  // horizontal bars
            p[0] = board.createElement('point',[0,xp0], {name:'',fixed:true,visible:false});
            p[1] = board.createElement('point',[yp,xp0], {name:'',fixed:true,visible:false});
            p[2] = board.createElement('point',[yp,xp2], {name:'',fixed:true,visible:false});
            p[3] = board.createElement('point',[0,xp2], {name:'',fixed:true,visible:false});
            if (attributes['labels'] && attributes['labels'][i]) {
                board.createElement('text',[yp,xp2,attributes['labels'][i]],attributes);
            }
        } else { // vertical bars
            p[0] = board.createElement('point',[xp0,0], {name:'',fixed:true,visible:false});
            p[1] = board.createElement('point',[xp0,yp], {name:'',fixed:true,visible:false});
            p[2] = board.createElement('point',[xp2,yp], {name:'',fixed:true,visible:false});
            p[3] = board.createElement('point',[xp2,0], {name:'',fixed:true,visible:false});
            if (attributes['labels'] && attributes['labels'][i]) {
                board.createElement('text',[xp2,yp,attributes['labels'][i]],attributes);
            }
        }
        attributes['withLines'] = false;
        pols[i] = board.createElement('polygon',p,attributes);
    }
    this.rendNode = pols[0].rendNode;  // This is needed in setProperty

    return pols; //[0];  // Not enough! We need pols, but this gives an error in board.setProperty.
};

JXG.Chart.prototype.drawPoints = function(board, parents, attributes) {
    var i;
    var points = [];
    attributes['fixed'] = true;
    attributes['name'] = '';
    var x = parents[0];
    var y = parents[1];
    
    for (i=0;i<x.length;i++) {
        points[i] = board.createElement('point',[x[i],y[i]], attributes);
    }
    this.rendNode = points[0].rendNode;
    return points; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
};

JXG.Chart.prototype.drawPie = function(board, parents, attributes) {  // Only 1 array possible as argument 
    var y = parents[0];
    if (y.length<=0) { return; }
    if (typeof y[0] == 'function') { return; } // functions not yet possible

    
    var i;
    var p = [];
    var line = [];
    var arc = [];
    var s = board.mathStatistics.sum(y);
    var colorArray = attributes['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
    var radius = attributes['radius'] || 4;
    var myAtts = {};
    myAtts['name'] = attributes['name'];
    myAtts['id'] = attributes['id'];
    myAtts['strokeWidth'] = attributes['strokeWidth'] || 1;
    myAtts['strokeColor'] = attributes['strokeColor'] || 'none';
    myAtts['straightFirst'] = false;
    myAtts['straightLast'] = false;
    myAtts['fillColor'] = attributes['fillColor'] || '#FFFF88';
    myAtts['fillOpacity'] = attributes['fillOpacity'] || 0.6;
    myAtts['highlightFillColor'] = attributes['highlightFillColor'] || '#FF7400';
    myAtts['highlightStrokeColor'] = attributes['highlightStrokeColor'] || '#FF7400';
    var cent = attributes['center'] || [0,0];
    var xc = cent[0];
    var yc = cent[1];

    var center = board.createElement('point',[xc,yc], {name:'',fixed:true,visible:false});
    p[0] = board.createElement('point',[radius+xc,0+yc], {name:'',fixed:true,visible:false});
    var rad = 0.0;
    for (i=0;i<y.length;i++) {
        rad += (s!=0)?(2*Math.PI*y[i]/s):0;
        var xcoord = radius*Math.cos(rad)+xc;
        var ycoord = radius*Math.sin(rad)+yc;
        p[i+1] = board.createElement('point',[xcoord,ycoord], {name:'',fixed:true,visible:false,withLabel:false});
        line[i] = board.createElement('line',[center,p[i]], 
            {strokeColor:'#ffffff', straightFirst:false, straightLast:false, strokeWidth:6, strokeOpacity:1.0,withLabel:false});
        myAtts['fillColor'] = colorArray[i%colorArray.length];
        arc[i] = board.createElement('arc',[center,p[i],p[i+1]], myAtts);
    }
    this.rendNode = arc[0].rendNode;
    return arc; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
};

/**
 * Then, the update function of the renderer
 * is called.  Since a chart is only an abstract element,
 * containing other elements, this function is empty.
 */
JXG.Chart.prototype.updateRenderer = function () {};

/**
 * Update of the defining points
 */
JXG.Chart.prototype.update = function () {
    if (this.needsUpdate) {
        this.updateDataArray();
    }
};

/**
  * For dynamic charts update
  * can be used to compute new entries
  * for the arrays this.dataX and
  * this.dataY. It is used in @see update.
  * Default is an empty method, can be overwritten
  * by the user.
  */
JXG.Chart.prototype.updateDataArray = function () {};


JXG.createChart = function(board, parents, attributes) {
    return new JXG.Chart(board, parents, attributes);
};    

JXG.JSXGraph.registerElement('chart', JXG.createChart);