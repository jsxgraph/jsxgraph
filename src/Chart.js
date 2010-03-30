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
            case 'radar':
                c = this.drawRadar(board,parents,attributes);
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

    var c = board.create('curve', [_x, _y], attributes);
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

    var c = board.create('spline', [x, y], attributes);
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
    var c = board.create('functiongraph', [regression], attributes);
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
            p[0] = board.create('point',[0,xp0], {name:'',fixed:true,visible:false});
            p[1] = board.create('point',[yp,xp0], {name:'',fixed:true,visible:false});
            p[2] = board.create('point',[yp,xp2], {name:'',fixed:true,visible:false});
            p[3] = board.create('point',[0,xp2], {name:'',fixed:true,visible:false});
            if (attributes['labels'] && attributes['labels'][i]) {
                board.create('text',[yp,xp2,attributes['labels'][i]],attributes);
            }
        } else { // vertical bars
            p[0] = board.create('point',[xp0,0], {name:'',fixed:true,visible:false});
            p[1] = board.create('point',[xp0,yp], {name:'',fixed:true,visible:false});
            p[2] = board.create('point',[xp2,yp], {name:'',fixed:true,visible:false});
            p[3] = board.create('point',[xp2,0], {name:'',fixed:true,visible:false});
            if (attributes['labels'] && attributes['labels'][i]) {
                board.create('text',[xp2,yp,attributes['labels'][i]],attributes);
            }
        }
        attributes['withLines'] = false;

        if(!fill) {
            colorArray = attributes['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
            attributes['fillColor'] = colorArray[i%colorArray.length];
        }
        pols[i] = board.create('polygon',p,attributes);
    }
    this.rendNode = pols[0].rendNode;  // This is needed in setProperty

    return pols; //[0];  // Not enough! We need pols, but this gives an error in board.setProperty.
};

JXG.Chart.prototype.drawPoints = function(board, parents, attributes) {
    var i;
    var points = [];
    attributes['fixed'] = true;
    attributes['name'] = '';
    var infoboxArray = JXG.isArray(attributes['infoboxArray']) ? attributes['infoboxArray'] || false : false;
    var x = parents[0];
    var y = parents[1];
    
    for (i=0;i<x.length;i++) {
        attributes['infoboxtext'] = infoboxArray ? infoboxArray[i%infoboxArray.length] : false;
        points[i] = board.create('point',[x[i],y[i]], attributes);
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
    var arc = [];
    var s = JXG.Math.Statistics.sum(y);
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

    var center = board.create('point',[xc,yc], {name:'',fixed:true,visible:false});
    p[0] = board.create('point',[radius+xc,0+yc], {name:'',fixed:true,visible:false});
    var rad = 0.0;
    for (i=0;i<y.length;i++) {
        rad += (s!=0)?(2*Math.PI*y[i]/s):0;
        var xcoord = radius*Math.cos(rad)+xc;
        var ycoord = radius*Math.sin(rad)+yc;
        p[i+1] = board.create('point',[xcoord,ycoord], {name:'',fixed:true,visible:false,withLabel:false});
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
        arc[i] = board.create('sector',[center,p[i],p[i+1]], myAtts);
        
        if(attributes['highlightOnSector']) {
            arc[i].hasPoint = arc[i].hasPointSector; // overwrite hasPoint so that the whole sector is used for highlighting
        }

    }
    this.rendNode = arc[0].rendNode;
    return {arcs:arc, points:p, midpoint:center}; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
};

/*
 * labelArray=[ row1, row2, row3 ]
 * paramArray=[ paramx, paramy, paramz ]
 * parents=[[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]]
 */
JXG.Chart.prototype.drawRadar = function(board, parents, attributes) { 
    if (parents.length<=0) { alert("No data"); return; } 
    // labels for axes
    var paramArray = attributes['paramArray'];
    if (paramArray == undefined){ alert("Need paramArray attribute"); return; }
    var numofparams=paramArray.length;
    if (numofparams<=1) { alert("Need more than 1 param"); return; }

    var i,j;
    for(i=0; i<parents.length; i++) {
        if (numofparams!=parents[i].length) { alert("Use data length equal to number of params (" + parents[i].length + " != " + numofparams + ")"); return; }
    }
    maxes=new Array(numofparams);
    mins=new Array(numofparams);
    for(j=0; j<numofparams; j++) {
        maxes[j] = parents[0][j];
        mins[j] = maxes[j];
    }
    for(i=1; i<parents.length; i++) {
        for(j=0;j<numofparams; j++) {
            if (parents[i][j]>maxes[j])
                maxes[j] = parents[i][j];
            if (parents[i][j]<mins[j])
                mins[j] = parents[i][j];
        }
    }
    //alert("maxes " + maxes + ", mins " + mins);
    var la = new Array(parents.length);
    var pdata = new Array(parents.length);
    for(i=0; i<parents.length; i++) {
        la[i] = '';
        pdata[i] = [];
    }

    var ssa = new Array(numofparams);
    var esa = new Array(numofparams);
    // 0 <= Offset from chart center <=1
    var ssratio = attributes['startShiftRatio'] || 0.0;
    // 0 <= Offset from chart radius <=1
    var esratio = attributes['endShiftRatio'] || 0.0;
    for(i=0; i<numofparams; i++) {
        ssa[i] = (maxes[i]-mins[i])*ssratio;
        esa[i] = (maxes[i]-mins[i])*esratio;
    }
    // Adjust offsets per each axis
    var sshifts = attributes['startShiftArray'] || ssa;
    var eshifts = attributes['endShiftArray'] || esa;
    // Values for inner circle, minimums by default
    var starts = attributes['startArray'] || mins;
    if (attributes['start'] != undefined)
        for(var i=0;i<numofparams; i++) starts[i] = attributes['start'];
    // Values for outer circle, maximums by default
    var ends = attributes['endArray'] || maxes;
    if (attributes['end'] != undefined)
        for(var i=0;i<numofparams; i++) ends[i] = attributes['end'];

    if(sshifts.length != numofparams) { alert("Start shifts length is not equal to number of parameters"); return; }
    if(eshifts.length != numofparams) { alert("End shifts length is not equal to number of parameters"); return; }
    if(starts.length != numofparams) { alert("Starts length is not equal to number of parameters"); return; }
    if(ends.length != numofparams) { alert("Ends length is not equal to number of parameters"); return; }

    //for(i=0; i<numofparams; i++) {
        //starts[i]-=sshifts[i];
        //ends[i]+=eshifts[i];
    //}
    //alert(starts + ' ' + ends);
    // labels for legend
    var labelArray = attributes['labelArray'] || la;
    var colorArray = attributes['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
    var highlightColorArray = attributes['highlightColorArray'] || ['#FF7400'];
    var radius = attributes['radius'] || 10;
    var myAtts = {};
    if (typeof attributes['highlightOnSector']  =='undefined') {
        attributes['highlightOnSector'] = false;
    }    
    myAtts['name'] = attributes['name'];
    myAtts['id'] = attributes['id'];
    myAtts['strokeWidth'] = attributes['strokeWidth'] || 1;
    myAtts['polyStrokeWidth'] = attributes['polyStrokeWidth'] || 2*myAtts['strokeWidth'];
    myAtts['strokeColor'] = attributes['strokeColor'] || 'black';
    myAtts['straightFirst'] = false;
    myAtts['straightLast'] = false;
    myAtts['fillColor'] = attributes['fillColor'] || '#FFFF88';
    myAtts['fillOpacity'] = attributes['fillOpacity'] || 0.4;
    myAtts['highlightFillColor'] = attributes['highlightFillColor'] || '#FF7400';
    myAtts['highlightStrokeColor'] = attributes['highlightStrokeColor'] || 'black';
    myAtts['gradient'] = attributes['gradient'] || 'none';

    var cent = attributes['center'] || [0,0];
    var xc = cent[0];
    var yc = cent[1];

    var center = board.createElement('point',[xc,yc], {name:'',fixed:true, withlabel:false,visible:false});
    var start_angle = Math.PI/2 - Math.PI/numofparams;
    if(attributes['startAngle'] || attributes['startAngle'] === 0) start_angle = attributes['startAngle'];
    var rad = start_angle;
    var p = [];
    var line = [];
    var get_anchor =  function() {
        var x1,x2,y1,y2,relCoords = [].concat(this.labelOffsets);
        x1 = this.point1.X();
        x2 = this.point2.X();
        y1 = this.point1.Y();
        y2 = this.point2.Y();
        if(x2<x1)
            relCoords[0] = -relCoords[0];
        if(y2<y1)
            relCoords[1] = -relCoords[1];

        this.setLabelRelativeCoords(relCoords);
        return new JXG.Coords(JXG.COORDS_BY_USER, [this.point2.X(),this.point2.Y()],this.board);
    }

    var get_transform = function(angle,i) {
        var t;
        var tscale;
        var trot;
        t = board.createElement('transform', [-(starts[i]-sshifts[i]), 0],{type:'translate'}); 
        tscale = board.createElement('transform', [radius/((ends[i]+eshifts[i])-(starts[i]-sshifts[i])), 1],{type:'scale'}); 
        t.melt(tscale);
        trot = board.createElement('transform', [angle],{type:'rotate'}); 
        t.melt(trot);
        return t;
    }
    var t;
    for (i=0;i<numofparams;i++) {
        rad += 2*Math.PI/numofparams;
        var xcoord = radius*Math.cos(rad)+xc;
        var ycoord = radius*Math.sin(rad)+yc;

        p[i] = board.createElement('point',[xcoord,ycoord], {name:'',fixed:true,withlabel:false,visible:false});
        line[i] = board.createElement('line',[center,p[i]], 
            {name:paramArray[i], 
            strokeColor:myAtts['strokeColor'], strokeWidth:myAtts['strokeWidth'], strokeOpacity:1.0,
            straightFirst:false, straightLast:false, withLabel:true,
            highlightStrokeColor:myAtts['highlightStrokeColor'],
        });
        line[i].getLabelAnchor = get_anchor;
        t = get_transform(rad,i);

        for(j=0; j<parents.length; j++) {
            var data=parents[j][i];
            pdata[j][i] = board.createElement('point',[data,0], {name:'',fixed:true,withlabel:false,visible:false});
            pdata[j][i].addTransform(pdata[j][i], t);
        }
        //board.unsuspendUpdate();
        //alert('');
        /*
        if(myAtts['name'] != '') {
            myAtts['withLabel'] = true;
        }
        else {
            myAtts['withLabel'] = false;
        }
        */

    }
    var polygons = new Array(parents.length);
    for(i=0;i<parents.length;i++) {
        myAtts['labelColor'] = colorArray[i%colorArray.length];
        myAtts['strokeColor'] = colorArray[i%colorArray.length];
        myAtts['fillColor'] = colorArray[i%colorArray.length];
        polygons[i] = board.createElement('polygon',pdata[i], 
                {withLines:true,
                withLabel:false,
                fillColor:myAtts['fillColor'],
                fillOpacity:myAtts['fillOpacity'],
                });
        for(j=0;j<numofparams;j++) {
            polygons[i].borders[j].setProperty('strokeColor:' + colorArray[i%colorArray.length]);
            polygons[i].borders[j].setProperty('strokeWidth:' + myAtts['polyStrokeWidth']);
        }
    }

    var legend_position = attributes['legendPosition'] || 'none';
    switch(legend_position) {
        case 'right':
        var lxoff = attributes['legendLeftOffset'] || 2;
            var lyoff = attributes['legendTopOffset'] || 1;
            this.legend = board.createElement('legend', [xc+radius+lxoff,yc+radius-lyoff],
            {labelArray:labelArray,
            colorArray: colorArray,
            });
            break;
        case 'none':
            break;
        default:
            alert('Unknown legend position');
    }

    var circles = [];
    if (attributes['showCircles'] != false) {
        var cla = [];
        for(i=0;i<6;i++)
            cla[i]=20*i;
        cla[0] = "0";
        var clabelArray = attributes['circleLabelArray'] || cla;
        var ncircles = clabelArray.length;
        if (ncircles<2) {alert("Too less circles"); return; }
        var pcircles = [];
        var angle=start_angle + Math.PI/numofparams
        t = get_transform(angle,0);
        myAtts['fillColor'] = 'none';
        myAtts['highlightFillColor'] = 'none';
        myAtts['strokeColor'] = attributes['strokeColor'] || 'black';
        myAtts['strokeWidth'] = attributes['circleStrokeWidth'] || 0.5;
        // we have ncircles-1 intervals between ncircles circles
        var dr = (ends[0]-starts[0])/(ncircles-1);
        for(i=0;i<ncircles;i++) {
            pcircles[i] = board.createElement('point', [starts[0]+i*dr,0],{name:clabelArray[i], size:0,withLabel:true, visible:true});
            pcircles[i].addTransform(pcircles[i],t);
            circles[i] = board.createElement('circle', [center,pcircles[i]], myAtts);
        }

    }
    this.rendNode = polygons[0].rendNode;
    return {circles:circles, lines:line, points:pdata, midpoint:center,polygons:polygons}; //[0];  // Not enough! We need points, but this gives an error in board.setProperty.
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
            attributes = JXG.checkAttributes(attributes,{withHeader:true});
            
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

/**
 * Legend for chart
 * 
 **/
JXG.Legend = function(board, coords, attributes) {
    /* Call the constructor of GeometryElement */
    this.constructor();
    this.board = board;
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, coords, this.board);
    this.myAtts = {};
    this.label_array = attributes['labelArray'] || ['1','2','3','4','5','6','7','8'];
    this.color_array = attributes['colorArray'] || ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'];
    var i;
    this.lines = [];
    this.myAtts['strokeWidth'] = attributes['strokeWidth'] || 5;
    this.myAtts['straightFirst'] = false;
    this.myAtts['straightLast'] = false;
    this.myAtts['withLabel'] = true;
    this.style = attributes['legendStyle'] || 'vertical';

    switch(this.style) {
        case 'vertical':
            this.drawVerticalLegend(attributes); 
            break;
        default:
            alert('Unknown legend style' + this.style);
            break;
    }
}
JXG.Legend.prototype = new JXG.GeometryElement;

JXG.Legend.prototype.drawVerticalLegend = function(attributes) {
    var line_length = attributes['lineLength'] || 1;
    var offy = (attributes['rowHeight'] || 20)/this.board.stretchY;

    for(i=0;i<this.label_array.length;i++) {
        this.myAtts['strokeColor'] = this.color_array[i];
        this.myAtts['highlightStrokeColor'] = this.color_array[i];
        this.myAtts['name'] = this.label_array[i];
        this.myAtts['labelOffsets'] = [10, 0];
        this.lines[i] = board.createElement('line', 
                [[this.coords.usrCoords[1],this.coords.usrCoords[2] - i*offy],
                [this.coords.usrCoords[1] + line_length,this.coords.usrCoords[2] - i*offy]],
                this.myAtts
                );
        this.lines[i].getLabelAnchor = function() {
            this.setLabelRelativeCoords(this.labelOffsets);
            return new JXG.Coords(JXG.COORDS_BY_USER, [this.point2.X(),this.point2.Y()],this.board);
        }
    }
}

JXG.createLegend = function(board, parents, attributes) {
    //parents are coords of left top point of the legend
    var start_from = [0,0];
    if(parents != undefined)
        if(parents.length == 2) {
            start_from = parents;
        }
    return new JXG.Legend(board, start_from, attributes);
}
JXG.JSXGraph.registerElement('legend', JXG.createLegend);
// vim: et ts=4
