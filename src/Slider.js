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
 * Slider (Schieberegler)
 * input: 3 arrays:
 * [x0,y0],[x1,y1],[min,start,max]
 * The slider is line from [x0,y0] to [x1,y1].
 * The position [x0,y0]  corresponds to the value "min",
 * [x1,y1] corresponds to the value max.
 * Initally, the slider is at position [x0,y0] + ([x1,y1]-[x0,y0])*start/(max-min)
 * The return value is an invisible point, whos X() or Y() value
 * returns the position between max and min,
 * Further, there is a method Value() returning the same value.
 **/
JXG.createSlider = function(board, parentArr, atts) {
    var pos0, pos1, smin, start, smax, p1, p2, l1, ticks, ti, startx, starty, p3, l2, n, t;
    var snapWidth;
    pos0 = parentArr[0];
    pos1 = parentArr[1];
    smin = parentArr[2][0];
    start = parentArr[2][1];
    smax = parentArr[2][2];
    
    if(atts == null) 
        atts = {};
    if(atts['strokeColor'] == null || typeof atts['strokeColor'] == 'undefined') {
        atts['strokeColor'] = '#0080c0';
    }
    if(atts['fillColor'] == null || typeof atts['fillColor'] == 'undefined') {
        atts['fillColor'] = '#0080c0';
    }    

    p1 = board.createElement('point', pos0, {visible:false, fixed:true, name:'',withLabel:false}); 
    p2 = board.createElement('point', pos1, {visible:false, fixed:true, name:'',withLabel:false}); 
    l1 = board.createElement('line', [p1,p2], {straightFirst:false, straightLast:false, strokewidth:1, name:'',withLabel:false,strokeColor:atts['strokeColor']});
    ticks  = 1;
    
    ti = board.createElement('ticks', [l1, p2.Dist(p1)/ticks],{insertTicks:true, drawLabels:false, drawZero:true}); 

    p1.needsRegularUpdate = false;
    p2.needsRegularUpdate = false;
    l1.needsRegularUpdate = false;
    
    startx = pos0[0]+(pos1[0]-pos0[0])*(start-smin)/(smax-smin);
    starty = pos0[1]+(pos1[1]-pos0[1])*(start-smin)/(smax-smin);

    if (atts['snapWidth']!=null) snapWidth = atts['snapWidth'];
    if (atts['snapwidth']!=null) snapWidth = atts['snapwidth'];
    p3 = board.createElement('glider', [startx,starty,l1], {style:6,strokeColor:atts['strokeColor'],fillColor:atts['fillColor'],showInfobox:false,name:'',snapWidth:snapWidth});
    
    l2 = board.createElement('line', [p1,p3], {straightFirst:false, straightLast:false, strokewidth:3, strokeColor:atts['strokeColor'],name:'',withLabel:false}); 
    p3.Value = function() { return this.Dist(p1)/p2.Dist(p1)*(smax - smin)+smin; } 
    p3._smax = smax;
    p3._smin = smin;

    if (atts['name'] && atts['name']!='') {
        n = atts['name'] + ' = ';
    } else {
        n = '';
    }
    t = board.createElement('text', [((pos1[0]-pos0[0])*.05+pos1[0]), ((pos1[1]-pos0[1])*.05+pos1[1]), function(){return n+(p3.Value()).toFixed(2);}],{name:''}); 
    return p3;
};    

JXG.JSXGraph.registerElement('slider', JXG.createSlider);