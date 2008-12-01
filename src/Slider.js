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
 * Slider (Schieberegler)
 * input array: 6 values:
 * start position (x,y), length, min val, max val, startpos
 **/
JXG.createSlider = function(board, parentArr, atts) {
    var sx = parentArr[0];
    var sy = parentArr[1];
    var sw = parentArr[2];
    var smin = parentArr[3];
    var smax = parentArr[4];
    var start = (parentArr[5]-smin)*sw/ (smax - smin);
    var p1 = board.createElement('point', [sx, sy], {visible:false, fixed:true,name:''}); 
    var p2 = board.createElement('point', [sx + sw, sy],{visible:false,fixed:true,name:''}); 
    var l1 = board.createElement('line', [p1,p2], {straightFirst:false,straightLast:false,strokewidth:1,name:''});
    var ticks  = 10;
    l1.ticksDelta = sw/ticks;
    l1.enableTicks();
    var p3 = board.createElement('point', [sx + start, sy], {slideObject:l1,style:6,strokeColor:'#0080c0',fillColor:'#0080c0',name:''});
    var p4 = board.createElement('point', [function() {return ((p3.X() - sx)/sw * (smax - smin)+smin);}, function() {return (sy  + 1);}], {visible:false,name:''});
    var l2 = board.createElement('line', [p1,p3], {straightFirst:false,straightLast:false,strokewidth:3,strokeColor:'#0080c0',name:''}); 
    var t = board.createElement('text', [sx+sw+0.25, sy, function(){return board.round(p4.X(),2);}],{name:''}); 
    return p4;
};    

JXG.JSXGraph.registerElement('slider', JXG.createSlider);