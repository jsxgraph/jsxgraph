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

/**
 * Chart plotting
 * input array: 
 * 
 **/
 
JXG.Chart = function(){};

JXG.Chart.prototype.drawLine = function(board,parentArr,atts) {
    var c = board.createElement('curve',parentArr,atts);
    return c;
};

JXG.Chart.prototype.drawBar = function(board,parentArr,atts) {
    var i;
    var pols = [];
    if (atts['fillOpacity'] == undefined) {
        atts['fillOpacity'] = 0.6;
    }
    var x = parentArr[0];
    var y = parentArr[1];
    
    // Determine the width of the bars
    var w;
    if (atts && atts['width']) {  // width given
        w = atts['width'];
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
        if (atts['dir']=='horizontal') {  // horizontal bars
            p[0] = board.createElement('point',[0,xp0], {name:'',fixed:true,visible:false});
            p[1] = board.createElement('point',[yp,xp0], {name:'',fixed:true,visible:false});
            p[2] = board.createElement('point',[yp,xp2], {name:'',fixed:true,visible:false});
            p[3] = board.createElement('point',[0,xp2], {name:'',fixed:true,visible:false});
            if (atts['labels'] && atts['labels'][i]) {
                board.createElement('text',[yp,xp2,atts['labels'][i]],atts);
            }
        } else { // vertical bars
            p[0] = board.createElement('point',[xp0,0], {name:'',fixed:true,visible:false});
            p[1] = board.createElement('point',[xp0,yp], {name:'',fixed:true,visible:false});
            p[2] = board.createElement('point',[xp2,yp], {name:'',fixed:true,visible:false});
            p[3] = board.createElement('point',[xp2,0], {name:'',fixed:true,visible:false});
            if (atts['labels'] && atts['labels'][i]) {
                board.createElement('text',[xp2,yp,atts['labels'][i]],atts);
            }
        }
        atts['withLines'] = false;
        pols[i] = board.createElement('polygon',p,atts);
    }
    return pols; //[0];  // Not enough! We need pols, but this gives an error in board.setProperty.
};

JXG.Chart.prototype.drawPoints = function(board,parentArr,atts) {
    var i;
    var points = [];
    atts['fixed'] = true;
    atts['name'] = '';
    var x = parentArr[0];
    var y = parentArr[1];
    
    for (i=0;i<x.length;i++) {
        points[i] = board.createElement('point',[x[i],y[i]], atts);
    }
    return points; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
};

JXG.Chart.prototype.drawPie = function(board,parentArr,atts) {  // Only 1 array possible as argument 
    var y = parentArr[0];
    if (y.length<=0) { return; }
    if (typeof y[0] == 'function') { return; } // functions not yet possible

    
    var i;
    var p = [];
    var line = [];
    var arc = [];
    var s = board.mathStatistics.sum(y);
    var colorArray = atts['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
    var radius = atts['radius'] || 4;
    var myAtts = {};
    myAtts['name'] = atts['name'];
    myAtts['id'] = atts['id'];
    myAtts['strokeWidth'] = atts['strokeWidth'] || 1;
    myAtts['strokeColor'] = atts['strokeColor'] || 'none';
    myAtts['straightFirst'] = false;
    myAtts['straightLast'] = false;
    myAtts['fillColor'] = atts['fillColor'] || '#FFFF88';
    myAtts['fillOpacity'] = atts['fillOpacity'] || 0.6;
    myAtts['highlightFillColor'] = atts['highlightFillColor'] || '#FF7400';
    myAtts['highlightStrokeColor'] = atts['highlightStrokeColor'] || '#FF7400';
    var cent = atts['center'] || [0,0];
    var xc = cent[0];
    var yc = cent[1];

    var center = board.createElement('point',[xc,yc], {name:'',fixed:true,visible:false});
    p[0] = board.createElement('point',[radius+xc,0+yc], {name:'',fixed:true,visible:false});
    var rad = 0.0;
    for (i=0;i<y.length;i++) {
        rad += (s!=0)?(2*Math.PI*y[i]/s):0;
        var xcoord = radius*Math.cos(rad)+xc;
        var ycoord = radius*Math.sin(rad)+yc;
        p[i+1] = board.createElement('point',[xcoord,ycoord], {name:'',fixed:true,visible:false});
        line[i] = board.createElement('line',[center,p[i]], 
        {strokeColor:'#ffffff', straightFirst:false, straightLast:false, strokeWidth:6, strokeOpacity:1.0});
        myAtts['fillColor'] = colorArray[i%colorArray.length];
        arc[i] = board.createElement('arc',[center,p[i],p[i+1]], myAtts);
    }
    return arc; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
};

JXG.createChart = function(board, parentArr, atts) {
    if (parentArr.length==0) { return; }  // No input data in parentArr
    var x;
    var y;
    var i;
    if (parentArr.length>0 && (typeof parentArr[0]=='number')) { // parentArrInput looks like [a,b,c,..]
                                                                // x has to be filled
        y = parentArr;
        x = [];
        for (i=0;i<y.length;i++) {
            x[i] = i+1;
        }
    } else {
        if (parentArr.length==1) { // parentArrInput looks like [[a,b,c,..]]
                                // x has to be filled
            y = parentArr[0];
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
        if (parentArr.length==2) { // parentArrInput looks like [[x0,x1,x2,...],[y1,y2,y3,...]]
            y = parentArr[1];
            x = parentArr[0];
        }
    }
    var chart = new JXG.Chart();
    if (atts==undefined) atts = {};
    var style = atts['chartStyle'] || 'line';
    style = style.replace(/ /g,'');
    style = style.split(',');
    var c;
    for (i=0;i<style.length;i++) {
        switch (style[i]) {
            case 'bar':
                c = chart.drawBar(board,[x,y],atts);
                break;
            case 'line':
                c = chart.drawLine(board,[x,y],atts);
                break;
            case 'pie':
                c = chart.drawPie(board,[y],atts);
                break;
            case 'point':
                c = chart.drawPoints(board,[x,y],atts);
                break;
        }
    }
    return c;       
};    

JXG.JSXGraph.registerElement('chart', JXG.createChart);