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
            if (JXG.isFunction(y)) {
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
            case 'fit':
                c = this.drawFit(board, [x, y], attributes);
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
    var _x = parents[0],
        _y = parents[1];

    /*
    var Fy = function(x) {
        var i, j = 0;

        for(i=0; i<_x.length; i++) {
            if(_x[i] == x) {
                j = i;
                break;
            }
        }

        if(typeof _y[j] == 'function')
            return _y[j]();
        else
            return _y[j];
    }
    */
    
    // not needed
    attributes['fillColor'] = 'none';
    attributes['highlightFillColor'] = 'none';

    var c = board.createElement('curve', [_x, _y], attributes);
    this.rendNode = c.rendNode;  // This is needed in setProperty
    return c;
};

JXG.Chart.prototype.drawSpline = function(board, parents, attributes) {
    var x = parents[0],
        y = parents[1],
        i;

    // not needed
    attributes['fillColor'] = 'none';
    attributes['highlightFillColor'] = 'none';

    var c = board.createElement('spline', [x, y], attributes);
    this.rendNode = c.rendNode;  // This is needed in setProperty
    return c;
};

JXG.Chart.prototype.drawFit = function(board, parents, attributes) {
    var x = parents[0],
        y = parents[1],
        deg = (((typeof attributes.degree == 'undefined') || (parseInt(attributes.degree) == NaN)|| (parseInt(attributes.degree) < 1)) ? 1 : parseInt(attributes.degree));

    // not needed
    attributes['fillColor'] = 'none';
    attributes['highlightFillColor'] = 'none';

    var regression = JXG.Math.Numerics.regressionPolynomial(deg, x, y);
    var c = board.createElement('functiongraph', [regression], attributes);
    this.rendNode = c.rendNode;  // This is needed in setProperty
    return c;
};

JXG.Chart.prototype.drawBar = function(board, parents, attributes) {
    var i, pols = [], x = parents[0], y = parents[1], w, xp0,xp1,xp2, yp, ypL, colorArray, p = [], fill;
    if (attributes['fillOpacity'] == undefined) {
        attributes['fillOpacity'] = 0.6;
    }
    
    // Determine the width of the bars
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

    fill = attributes['fillColor']
    for (i=0;i<x.length;i++) {        
        if (JXG.isFunction(x[i])) {  // Not yet
            xp0 = function() { return x[i]()-w*0.5; };
            xp1 = function() { return x[i](); };
            xp2 = function() { return x[i]()+w*0.5; };
        } else {
            xp0 = x[i]-w*0.5;
            xp1 = x[i];
            xp2 = x[i]+w*0.5;
        }
        if (JXG.isFunction(y[i])) {  // Not yet
            ypL = yp; //function() { return y[i]()*1.1; };
        } else {
            ypL = y[i]+0.2;
        }
        yp = y[i];
       
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

        if(typeof fill == 'undefined' && fill == null) {
            colorArray = attributes['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
            attributes['fillColor'] = colorArray[i%colorArray.length];
        }
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
    var highlightColorArray = attributes['highlightColorArray'] || ['#FF7400'];
    var la = new Array(y.length);
    for(i=0; i<y.length; i++) {
        la[i] = '';
    }
    var labelArray = attributes['labelArray'] || la;
    var radius = attributes['radius'] || 4;
    var myAtts = {};
    if (typeof attributes['highlightOnSector']  =='undefined') {
        attributes['highlightOnSector'] = false;
    }    
    myAtts['name'] = attributes['name'];
    myAtts['id'] = attributes['id'];
    myAtts['strokeWidth'] = attributes['strokeWidth'] || 1;
    myAtts['strokeColor'] = attributes['strokeColor'] || 'none';
    myAtts['straightFirst'] = false;
    myAtts['straightLast'] = false;
    myAtts['fillColor'] = attributes['fillColor'] || '#FFFF88';
    myAtts['fillOpacity'] = attributes['fillOpacity'] || 0.6;
    myAtts['highlightFillColor'] = attributes['highlightFillColor'] || '#FF7400';
    myAtts['highlightStrokeColor'] = attributes['highlightStrokeColor'] || '#FFFFFF';
    myAtts['gradient'] = attributes['gradient'] || 'none';
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
            {strokeColor:myAtts['strokeColor'], straightFirst:false, straightLast:false, strokeWidth:myAtts['strokeWidth'], strokeOpacity:1.0,withLabel:false,highlightStrokeColor:myAtts['highlightStrokeColor']});
        myAtts['fillColor'] = colorArray[i%colorArray.length];
        myAtts['name'] = labelArray[i];
        if(myAtts['name'] != '') {
            myAtts['withLabel'] = true;
        }
        else {
            myAtts['withLabel'] = false;
        }
        myAtts['labelColor'] = colorArray[i%colorArray.length];
        myAtts['highlightfillColor'] = highlightColorArray[i%highlightColorArray.length];
        arc[i] = board.createElement('arc',[center,p[i],p[i+1]], myAtts);
        
        if(attributes['highlightOnSector']) {
            arc[i].hasPoint = arc[i].hasPointSector; // overwrite hasPoint so that the whole sector is used for highlighting
        }

    }
    for (i=0;i<y.length;i++) {    
        arc[i].additionalLines = [line[i],line[(i+1)%y.length]];
    }
    this.rendNode = arc[0].rendNode;
    return {arcs:arc, lines:line, points:p, midpoint:center}; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
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
    if((parents.length == 1) && (typeof parents[0] == 'string')) {
        var table = document.getElementById(parents[0]),
            data, row, i, j, col, cell, charts = [], w, x, showRows,
            originalWidth, name, strokeColor, fillColor, hStrokeColor, hFillColor, len;
        if(typeof table != 'undefined') {
            // extract the data
            if(attributes['withHeader']) {} else attributes['withHeader'] = true;
            table = (new JXG.DataSource()).loadFromTable(parents[0], attributes['withHeader'], attributes['withHeader']);
            data = table.data;
            col = table.columnHeader;
            row = table.rowHeader;

            originalWidth = attributes['width'];
            name = attributes['name'];
            strokeColor = attributes['strokeColor'];
            fillColor = attributes['fillColor'];
            hStrokeColor = attributes['highlightStrokeColor'];
            hFillColor = attributes['highlightFillColor'];

            board.suspendUpdate();

            len = data.length;
            showRows = [];
            if (attributes['rows'] && JXG.isArray(attributes['rows'])) {
                for(i=0; i<len; i++) {
                    for(j=0; j<attributes['rows'].length; j++) {
                        if((attributes['rows'][j] == i) || (attributes['withHeaders'] && attributes['rows'][j] == row[i])) {
                            showRows.push(data[i]);
                            break;
                        }
                    }
                }
            } else {
                showRows = data;
            }

            len = showRows.length;

            for(i=0; i<len; i++) {

                x = [];
                if(attributes['chartStyle'] && attributes['chartStyle'].indexOf('bar') != -1) {
                    if(originalWidth) {
                        w = originalWidth;
                    } else {
                        w = 0.8;
                    }
                    x.push(1 - w/2. + (i+0.5)*w/(1.0*len));
                    for(j=1; j<showRows[i].length; j++) {
                        x.push(x[j-1] + 1);
                    }
                    attributes['width'] = w/(1.0*len);
                }
                
                if(name && name.length == len)
                    attributes['name'] = name[i];
                else if(attributes['withHeaders'])
                    attributes['name'] = col[i];
                
                if(strokeColor && strokeColor.length == len)
                    attributes['strokeColor'] = strokeColor[i];
                else
                    attributes['strokeColor'] = JXG.hsv2rgb(((i+1)/(1.0*len))*360,0.9,0.6);
                
                if(fillColor && fillColor.length == len)
                    attributes['fillColor'] = fillColor[i];
                else
                    attributes['fillColor'] = JXG.hsv2rgb(((i+1)/(1.0*len))*360,0.9,1.0);
                
                if(hStrokeColor && hStrokeColor.length == len)
                    attributes['highlightStrokeColor'] = hStrokeColor[i];
                else
                    attributes['highlightStrokeColor'] = JXG.hsv2rgb(((i+1)/(1.0*len))*360,0.9,1.0);
                
                if(hFillColor && hFillColor.length == len)
                    attributes['highlightFillColor'] = hFillColor[i];
                else
                    attributes['highlightFillColor'] = JXG.hsv2rgb(((i+1)/(1.0*len))*360,0.9,0.6);
                
                if(attributes['chartStyle'] && attributes['chartStyle'].indexOf('bar') != -1) {
                    charts.push(new JXG.Chart(board, [x, showRows[i]], attributes));
                } else
                    charts.push(new JXG.Chart(board, [showRows[i]], attributes));
            }

            board.unsuspendUpdate();

        }
        return charts;
    } else     
        return new JXG.Chart(board, parents, attributes);
};    

JXG.JSXGraph.registerElement('chart', JXG.createChart);
