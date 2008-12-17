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
/*
--------------------------------------------------------------------
von AbstractRenderer abgeleitete Zeichenklasse
fuer Browser mit VML-Elementen (Internet Explorer)
--------------------------------------------------------------------
*/

JXG.VMLRenderer = function(container) {
    this.constructor();
    
    this.container = container;
    this.container.style.overflow = 'hidden';
    this.container.onselectstart = function () { return false; };
  
    // Add VML includes and namespace
    container.ownerDocument.namespaces.add("v", "urn:schemas-microsoft-com:vml");

    var style = container.ownerDocument.createStyleSheet();
    style.addRule('v\\:*', "behavior: url(#default#VML);");    

    // um Dashes zu realisieren
    this.dashArray = ['Solid', '1 1', 'ShortDash', 'Dash', 'LongDash', 'ShortDashDot', 'LongDashDot'];    
};

JXG.VMLRenderer.prototype = new JXG.AbstractRenderer;

JXG.VMLRenderer.prototype.displayCopyright = function(str,fontsize) {
    var node = this.createPrimitive('textbox','licenseText');
    node.style.left = 20;
    node.style.top = (2);
    node.style.fontSize = (fontsize);
    node.style.color = '#356AA0';
    node.style.fontFamily = 'Arial,Helvetica,sans-serif';
    node.setAttribute('opacity','30%');
    node.style.filter = 'alpha(opacity = 30)';
    
    var t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrimitive(node,'images');
};

JXG.VMLRenderer.prototype.drawAxis = function(el) { 
    var node;
    node = this.container.ownerDocument.createElement('v:line');
    node.style.position = 'absolute';
    if (el.point1.coords.scrCoords[1]==el.point2.coords.scrCoords[1]) {
        node.setAttribute('from', (el.board.origin.scrCoords[1]) + 'px,' + (el.board.canvasHeight) + 'px');
        node.setAttribute('to', (el.board.origin.scrCoords[1]) + 'px,' + '0px');      
    } 
    else {
        node.setAttribute('from', '0px,' + (el.board.origin.scrCoords[2]) + 'px');
        node.setAttribute('to', (el.board.canvasWidth) + 'px,' + (el.board.origin.scrCoords[2]) + 'px');      
    }    
    this.setStrokeProp(node,el.visProp);
    node.style.zIndex = "4"; 
    node.setAttribute('id', el.id);
    el.rendNode = node;

    var nodeStroke = this.container.ownerDocument.createElement('v:stroke');
    nodeStroke.setAttribute('endarrow', 'block');
    nodeStroke.setAttribute('endarrowlength', 'long');
    node.appendChild(nodeStroke);

    this.updateAxisTicks(el, 0);
    this.container.appendChild(node);
}

JXG.VMLRenderer.prototype.updateAxis = function(el) {
    // not yet
    var node = $(el.id);
    
    if (el.point1.coords.scrCoords[1]==el.point2.coords.scrCoords[1]) {
        node.setAttribute('from', (el.board.origin.scrCoords[1]) + 'px,' + (el.board.canvasHeight) + 'px');
        node.setAttribute('to', (el.board.origin.scrCoords[1]) + 'px,' + '0px');     
    } 
    else {
        node.setAttribute('from', '0px,' + (el.board.origin.scrCoords[2]) + 'px');
        node.setAttribute('to', (el.board.canvasWidth) + 'px,' + (el.board.origin.scrCoords[2]) + 'px');     
    }    
    this.setStrokeProp(node,el.visProp);
 
    for (var i=0;i<el.ticks.length;i++) {
        var c = el.ticks[i];
        var tick = $(el.id+'tick'+i);
        tick.setAttribute('from', c.scrCoords[1] + 'px,' + c.scrCoords[2] + 'px');
        if (el.point1.coords.scrCoords[1]==el.point2.coords.scrCoords[1]) {
            tick.setAttribute('to', (c.scrCoords[1] - el.r) + 'px,' + (c.scrCoords[2]) + 'px');   
        } 
        else {
            tick.setAttribute('to', (c.scrCoords[1]) + 'px,' + (c.scrCoords[2] + el.r) + 'px');   
        }
        
        tick.setAttribute('stroked', 'true');
        tick.setAttribute('strokecolor', el.visProp['strokeColor'], 1);
        tick.setAttribute('strokeweight', el.visProp['strokeWidth']);   
    }
}

JXG.VMLRenderer.prototype.drawArc = function(el) { 
    var radius = el.getRadius();  
    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.midpoint.coords.usrCoords[1], el.board.origin.scrCoords[2]/(el.board.unitY*el.board.zoomY)],
                          el.board);
    var angle2 = el.board.algebra.trueAngle(el.point2, el.midpoint, p);
    var angle1 = el.board.algebra.trueAngle(el.point3, el.midpoint, p);
    if(angle2 < angle1) {
        angle1 -= 360;
    }

    var node = this.createPrimitive('arc',el.id);    
/*  var node = this.container.ownerDocument.createElement('v:arc');
    node.setAttribute('id', el.id);
    node.style.position = 'absolute';
*/
    node.setAttribute('filled', 'false');
    this.setStrokeProp(node,el.visProp);
    
    node.style.left = (el.midpoint.coords.scrCoords[1] - Math.round(radius * el.board.unitX * el.board.zoomX)) + 'px'; 
    node.style.top = (el.midpoint.coords.scrCoords[2] - Math.round(radius * el.board.unitY * el.board.zoomY))  + 'px'; 
    node.style.width = (Math.round(radius * el.board.unitX * el.board.zoomX)*2) + 'px'; 
    node.style.height = (Math.round(radius * el.board.unitY * el.board.zoomY)*2) + 'px';  
    node.setAttribute('startangle', angle1);
    node.setAttribute('endangle', angle2);    
    
    var nodeStroke = this.container.ownerDocument.createElement('v:stroke');
    if(el.visProp['lastArrow']) {        
        nodeStroke.setAttribute('endarrow', 'block');
        nodeStroke.setAttribute('endarrowlength', 'long');
    }
    if(el.visProp['firstArrow']) {        
        nodeStroke.setAttribute('startarrow', 'block');
        nodeStroke.setAttribute('startarrowlength', 'long');
    }    
    nodeStroke.setAttribute('id', el.id+'stroke');
    var tmp = el.visProp['dash'];
    nodeStroke.setAttribute('dashstyle', this.dashArray[tmp]);    
    node.appendChild(nodeStroke);    
   
    var node2 = this.createPrimitive('shape',el.id+'_fill');
    if(el.visProp['fillColor'] == 'none') {
        node2.setAttribute('filled', 'false');
    }
    else {
        node2.setAttribute('filled', 'true');
        node2.setAttribute('fillcolor', el.visProp['fillColor']); 
    }
    node2.setAttribute('stroked', 'false');

    var x = Math.round(radius * el.board.unitX * el.board.zoomX); // Breite des umgebenden Rechtecks?
    var y = Math.round(radius * el.board.unitY * el.board.zoomY); // Hoehe des umgebenden Rechtecks?
    node2.style.width = x;
    node2.style.height = y;
    node2.setAttribute('coordsize', x+','+y);
    var nodePath = this.container.ownerDocument.createElement('v:path');
    nodePath.setAttribute('id', el.id+'path');

    var p4coords = el.board.algebra.projectPointToCircle(el.point3,el);    

    var pathString = 'm ' + el.midpoint.coords.scrCoords[1] + ',' + el.midpoint.coords.scrCoords[2] + ' l ';  
    pathString += el.point2.coords.scrCoords[1] + ',' + el.point2.coords.scrCoords[2] + ' at ';
    pathString += (el.midpoint.coords.scrCoords[1]-x) + ',' + (el.midpoint.coords.scrCoords[2]-y) + ',';
    pathString += (el.midpoint.coords.scrCoords[1]+x) + ',' + (el.midpoint.coords.scrCoords[2]+y);
    pathString += ' ' + el.point2.coords.scrCoords[1] + ',' + el.point2.coords.scrCoords[2];
    pathString += ', ' + p4coords.scrCoords[1] + ',' + p4coords.scrCoords[2] + ' l ';
    pathString += el.midpoint.coords.scrCoords[1] + ',' + el.midpoint.coords.scrCoords[2] + ' x e';

    nodePath.setAttribute('v', pathString);
    node2.appendChild(nodePath);

    var nodeFill = this.container.ownerDocument.createElement('v:fill');
    nodeFill.setAttribute('id',el.id+'_fillnode');
    nodeFill.setAttribute('opacity', (el.visProp['fillOpacity']*100)+'%');
    node2.appendChild(nodeFill);    
    
    this.appendChildPrimitive(node,'lines');
    //this.container.appendChild(node);
    //node.style.zIndex = "4"; 

    this.appendChildPrimitive(node2,'angles');
/*    node2.style.zIndex = "2";
    this.container.appendChild(node2);  */
    el.rendNode = node;
    el.rendNodeFill = node2;
    
    if(el.visProp['draft']) {
       this.setDraft(el);
    }
}

JXG.VMLRenderer.prototype.drawAngle = function(el) {
    var node = this.container.ownerDocument.createElement('v:shape');
    node.style.position = 'absolute';
    node.setAttribute('filled', 'true');
    node.setAttribute('fillcolor', el.visProp['fillColor']); 
    node.setAttribute('stroked', 'false');
    node.style.zIndex = "2";
    node.setAttribute('id', el.id+'_1');
    
    var x = Math.round(el.radius * el.board.unitX * el.board.zoomX); // Breite des umgebenden Rechtecks?
    var y = Math.round(el.radius * el.board.unitY * el.board.zoomY); // Hoehe des umgebenden Rechtecks?
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', x+','+y);

    var circle = {};  // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.point2;
    circle.getRadius = function() {
        return el.radius;
    }
    var projectedP1 = el.board.algebra.projectPointToCircle(el.point1,circle);
    var projectedP3 = el.board.algebra.projectPointToCircle(el.point3,circle);    
    
    var nodePath = this.container.ownerDocument.createElement('v:path');
    nodePath.setAttribute('id', el.id+"_path");

    var pathString = 'm ' + el.point2.coords.scrCoords[1] + ',' + el.point2.coords.scrCoords[2] + ' l ';  
    pathString += projectedP1.scrCoords[1] + ',' + projectedP1.scrCoords[2] + ' at ';
    pathString += (el.point2.coords.scrCoords[1]-x) + ',' + (el.point2.coords.scrCoords[2]-y) + ',';
    pathString += (el.point2.coords.scrCoords[1]+x) + ',' + (el.point2.coords.scrCoords[2]+y);
    pathString += ' ' + projectedP1.scrCoords[1] + ',' + projectedP1.scrCoords[2];
    pathString += ', ' + projectedP3.scrCoords[1] + ',' + projectedP3.scrCoords[2] + ' l ';
    pathString += el.point2.coords.scrCoords[1] + ',' + el.point2.coords.scrCoords[2] + ' x e';
    
    //alert(pathString);
    nodePath.setAttribute('v', pathString);
    node.appendChild(nodePath);    

    var nodeFill = this.container.ownerDocument.createElement('v:fill');
    nodeFill.setAttribute('opacity', el.visProp['fillOpacity']*10+'%');
    nodeFill.setAttribute('id',el.id+'_fillnode');
    node.appendChild(nodeFill);    

    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.point2.coords.usrCoords[1], el.board.origin.scrCoords[2]/(el.board.unitY*el.board.zoomY)],
                          el.board);
    var angle2 = el.board.algebra.trueAngle(el.point1, el.point2, p);
    var angle1 = el.board.algebra.trueAngle(el.point3, el.point2, p);
    if(angle2 < angle1) {
        angle1 -= 360;
    }
    var node2 = this.container.ownerDocument.createElement('v:arc');
    node2.style.position = 'absolute';
    node2.style.left = (el.point2.coords.scrCoords[1] - Math.round(el.radius * el.board.unitX * el.board.zoomX)) + 'px'; 
    node2.style.top = (el.point2.coords.scrCoords[2] - Math.round(el.radius * el.board.unitY * el.board.zoomY))  + 'px'; 
    node2.style.width = (Math.round(el.radius * el.board.unitX * el.board.zoomX)*2) + 'px'; 
    node2.style.height = (Math.round(el.radius * el.board.unitY * el.board.zoomY)*2) + 'px'; 
    node2.setAttribute('startangle', angle1);
    node2.setAttribute('endangle', angle2);   
    node2.setAttribute('stroked', 'true');
    node2.setAttribute('strokecolor', el.visProp['strokeColor']);
    node2.setAttribute('strokeweight', el.visProp['strokeWidth']);
    node2.setAttribute('filled', 'false');
    node2.style.zIndex = "4"; 
    node2.setAttribute('id', el.id+"_2");    
    
    this.container.appendChild(node);
    this.container.appendChild(node2);
    el.rendNode1 = node;
    el.rendNode2 = node2;

    if(!el.visProp['visible']) {
        el.hideElement(el);
    }
    //if(el.visProp['draft']) {
    //   this.setDraft(el);
    //}
}

JXG.VMLRenderer.prototype.updateAngle = function(el) {
    // erstmal nur der brutale Weg... 
    this.remove(el.rendNode1);
    this.remove(el.rendNode2);  
    this.drawAngle(el);
    return;
}

JXG.VMLRenderer.prototype.drawImage = function(el) {
    // IE 8: Bilder ueber data URIs werden bis 32kB unterstuetzt.
    var imageBase64 = 'data:image/png;base64,' + el.imageBase64String;    
    
    var node = this.container.ownerDocument.createElement('img');
    node.style.position = 'absolute';
    node.setAttribute('id', el.id);

    node.setAttribute('src',imageBase64);
    this.container.appendChild(node);
    this.appendChildPrimitive(node,el.displayLevel);
    node.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11='1.0', sizingMethod='auto expand')";
    el.rendNode = node;
    this.updateImage(el);
}

JXG.VMLRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode;
    var m = this.joinTransforms(el,t);
    node.style.left = (el.coords.scrCoords[1] + m[1][0]) + 'px'; 
    node.style.top = (el.coords.scrCoords[2]-el.size[1] + m[2][0]) + 'px';    
    node.filters.item(0).M11 = m[1][1];
    node.filters.item(0).M12 = m[1][2];
    node.filters.item(0).M21 = m[2][1];
    node.filters.item(0).M22 = m[2][2];
}

JXG.VMLRenderer.prototype.joinTransforms = function(el,t) {
    var m = [[1,0,0],[0,1,0],[0,0,1]];
    for (var i=0;i<t.length;i++) {
        m = el.board.algebra.matMatMult(t[i].matrix,m);
    }
    return m;
}

JXG.VMLRenderer.prototype.transformImageParent = function(el,m) {};

JXG.VMLRenderer.prototype.removeGrid = function(board) { 
    board.hasGrid = false;
    for(var i=0; i<=this.gridXsize; i++) {
        var c = $('gridx'+i);
        while (c.childNodes.length>0) {
            c.removeChild(c.firstChild);
        }
        c.remove();
    }
    for(var i=0; i<=this.gridYsize; i++) {
        var c = $('gridy'+i);
        while (c.childNodes.length>0) {
            c.removeChild(c.firstChild);
        }
        c.remove();
    }
}

JXG.VMLRenderer.prototype.hide = function(el) {
    if(!JXG.IsPoint(el)) {
        if(el.type != JXG.OBJECT_TYPE_ANGLE) {
            var node = el.rendNode;
            node.style.visibility = "hidden"; 
            if(el.type == JXG.OBJECT_TYPE_ARC) {
                node = el.rendNodeFill; 
                node.style.visibility = "hidden";         
            }
        }
        else {
            var node = el.rendNode1;
            node.style.visibility = "hidden"; 
            node = el.rendNode2;
            node.style.visibility = "hidden"; 
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.style.visibility = "hidden";  
        }
        else {
            var node = el.rendNodeX1;
            node.style.visibility = "hidden";     
            var node = el.rendNodeX2;
            node.style.visibility = "hidden";  
        }
    }  
}

JXG.VMLRenderer.prototype.show = function(el) {
    if(!JXG.IsPoint(el)) {
        if(el.type != JXG.OBJECT_TYPE_ANGLE) {    
            var node = el.rendNode;
            node.style.visibility = "inherit";  
            if(el.type == JXG.OBJECT_TYPE_ARC) {
                node = el.rendNodeFill; 
                node.style.visibility = "inherit";         
            }
        }
        else {
            var node = el.rendNode1;
            node.style.visibility = "inherit";     
            node = el.rendNode2;
            node.style.visibility = "inherit";
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.style.visibility = "inherit";  
        }
        else {
            var node = el.rendNodeX1;
            node.style.visibility = "inherit";     
            var node = el.rendNodeX2;
            node.style.visibility = "inherit";  
        }
    }  
}

JXG.VMLRenderer.prototype.setObjectDash = function(el) {
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) { // Punkte haben keine dash-Eigenschaft
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            var node = el.rendNode2; 
                var tmp = el.visProp['dash'];
                node.setAttribute('dashstyle', this.dashArray[tmp]);            
        }
        else {
            var node = $(el.id+'stroke');
            if (node) {
                var tmp = el.visProp['dash'];
                node.setAttribute('dashstyle', this.dashArray[tmp]);
            }
        }
    }
}
 
JXG.VMLRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    var c, o;
    /* // Not yet
    if (typeof opacity=='function') {
        o = opacity();
    } else {
        o = opacity;
    }
    o = (o>0)?o:0;
    */
    if (typeof color=='function') {
        c = color();
    } else {
        c = color;
    }
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            var node = el.rendNode2; 
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);            
        }
        else if(el.type == JXG.OBJECT_TYPE_TEXT) {
            el.rendNode.style.color = c;
        }        
        else {
            var node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
        }
        else {
            var node = el.rendNodeX1;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c); 
            var node = el.rendNodeX2;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
        }
    }
}

JXG.VMLRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    var node;
    var c, o;
    if (typeof opacity=='function') {
        o = opacity();
    } else {
        o = opacity;
    }
    o = (o>0)?o:0;
    if (typeof color=='function') {
        c = color();
    } else {
        c = color;
    }
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        if(el.type == JXG.OBJECT_TYPE_ARC) {
            node = el.rendNodeFill; 
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }         
        }
        else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode1; 
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }         
        }
        else {
            node = el.rendNode;
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }
        }
        else {
            var node = el.rendNodeX1;
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }
            var node = el.rendNodeX2;
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }            
        }
    }
    if(el.type == JXG.OBJECT_TYPE_POLYGON || el.type == JXG.OBJECT_TYPE_CIRCLE || el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE || el.type == JXG.OBJECT_TYPE_CURVE) {
        var nodeFill = $(el.id+'_fillnode');
        if (o!=undefined) nodeFill.setAttribute('opacity', (o*100)+'%');     
    }
}

JXG.VMLRenderer.prototype.remove = function(node) {
  node.removeNode(true);
}

JXG.VMLRenderer.prototype.suspendRedraw = function() {
    this.container.style.display='none';
};

JXG.VMLRenderer.prototype.unsuspendRedraw = function() {
    this.container.style.display='';
};

JXG.VMLRenderer.prototype.setStrokeProp = function(node,visProp) {
    if(visProp['strokeColor'] == 'none') {
        node.setAttribute('stroked', 'false');          
    }
    else {
        node.setAttribute('stroked', 'true');
        var props    = ['strokeColor','strokeWidth'];
        var vmlprops = ['strokecolor','strokeweight'];
        this.setAttributes(node,props,vmlprops,visProp);
        //node.setAttribute('strokeweight', 1);
    }
};

JXG.VMLRenderer.prototype.setFillProp = function(node,visProp) {
//$('debug').innerHTML += node.id +':'+visProp['fillColor']+':<br>';
    if (visProp['fillColor'] == null || visProp['fillColor'] == 'none') {
        node.setAttribute('filled', 'false');
    }
    else {
        node.setAttribute('filled', 'true');
        node.setAttribute('fillcolor', visProp['fillColor']); 
    }
    var nodeFill = this.container.ownerDocument.createElement('v:fill');
    nodeFill.setAttribute('id',node.id+'_fillnode');
    nodeFill.setAttribute('opacity', (visProp['fillOpacity']*100)+'%'); 
    node.appendChild(nodeFill); 
};

JXG.VMLRenderer.prototype.setAttributes = function(node,props,vmlprops,visProp) {
    var val;
    for (var i=0;i<props.length;i++) {
        var p = props[i];
        if (visProp[p]!=null) {
            if (typeof visProp[p]=='function') {
                val = visProp[p]();
                val = (val>0)?val:0;
            } else {
                val = visProp[p];
            }
            node.setAttribute(vmlprops[i], val);
        }
    }
};

JXG.VMLRenderer.prototype.setDashStyle = function(node,visProp) {
    if(visProp['dash'] >= 0) {
        var node2 = this.container.ownerDocument.createElement('v:stroke'); 
        node2.setAttribute('id', node.id+'stroke');
        node2.setAttribute('dashstyle', this.dashArray[visProp['dash']]);
        node.appendChild(node2);
    }
};

JXG.VMLRenderer.prototype.createPrimitive = function(type,id) {
    var node;
    if (type=='circle' || type=='ellipse' ) {
        node = this.container.ownerDocument.createElement('v:oval');
    } else if (type=='polygon') {
        node = this.container.ownerDocument.createElement('v:shape');
    } else if (type=='path') {
        node = this.container.ownerDocument.createElement('v:shape');
    } else {
        node = this.container.ownerDocument.createElement('v:'+type);
    }
    node.style.position = 'absolute';
    node.setAttribute('id', id);
    return node;
};

JXG.VMLRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    var nodeStroke = this.container.ownerDocument.createElement('v:stroke');
    nodeStroke.setAttribute('endarrow', 'block');
    nodeStroke.setAttribute('endarrowlength', 'long');
    node.appendChild(nodeStroke);
};

JXG.VMLRenderer.prototype.makeArrows = function(el) {
    if(el.visProp['firstArrow']) {
        var nodeStroke = el.rendNodeStroke;
        if(nodeStroke == null) {
            nodeStroke = this.container.ownerDocument.createElement('v:stroke');
            nodeStroke.setAttribute('id', el.id+"stroke");
            nodeStroke.setAttribute('startarrow', 'block');
            nodeStroke.setAttribute('startarrowlength', 'long');
            el.rendNode.appendChild(nodeStroke);
            el.rendNodeStroke = nodeStroke;
        }            
    }
    else {
        var nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            nodeStroke.setAttribute('startarrow', 'none');
        }            
    }
    if(el.visProp['lastArrow']) {
        var nodeStroke = el.rendNodeStroke;
        if(nodeStroke == null) {
            nodeStroke = this.container.ownerDocument.createElement('v:stroke');
            el.rendNode.appendChild(nodeStroke);
            el.rendNodeStroke = nodeStroke;                    
        }
        nodeStroke.setAttribute('id', el.id+"stroke");
        nodeStroke.setAttribute('endarrow', 'block');
        nodeStroke.setAttribute('endarrowlength', 'long');            
    }
    else {
        var nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            nodeStroke.setAttribute('endarrow', 'none');
        }        
    }    
};

JXG.VMLRenderer.prototype.updateLinePrimitive = function(node,p1x,p1y,p2x,p2y) {
    node.setAttribute('from', [p1x,p1y].join(',')); 
    node.setAttribute('to', [p2x,p2y].join(','));      
};

JXG.VMLRenderer.prototype.updateCirclePrimitive = function(node,x,y,r) {
    node.style.left = (x-r)+'px';
    node.style.top = (y-r)+'px';    
    node.style.width = (r*2)+'px'; 
    node.style.height = (r*2)+'px';   
};

JXG.VMLRenderer.prototype.updateRectPrimitive = function(node,x,y,w,h) {
    node.style.left = (x)+'px';
    node.style.top = (y)+'px';    
    node.style.width = (w)+'px'; 
    node.style.height = (h)+'px';   
};

JXG.VMLRenderer.prototype.updateEllipsePrimitive = function(node,x,y,rx,ry) {
    node.style.left = (x-rx)+'px';
    node.style.top =  (y-ry)+'px'; 
    node.style.width = (rx*2)+'px'; 
    node.style.height = (ry*2)+'px';
};

JXG.VMLRenderer.prototype.updatePathPrimitive2 = function(el,pointString) {
    var node = el.rendNode;
    var x = el.board.canvasWidth;
    var y = el.board.canvasHeight;
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', x+','+y);
    
    node.setAttribute('path',pointString.join(""));
    //node.points.value = pointString;
};

JXG.VMLRenderer.prototype.updatePathStringPrimitive = function(el) {
    if (el.numberPoints<=0) { return ''; }
    var nextSymb = ' m ';
    var pStr = [];
    var h = 2*el.board.canvasHeight;
    var w = 2*el.board.canvasWidth;
    var m = Math.min(el.numberPoints,8192); // otherwise IE 7 crashes in hilbert.html
    
    for (var i=0; i<m; i++) {
        var scr = el.points[i].scrCoords;
        if (isNaN(scr[1]) || isNaN(scr[2]) || Math.abs(scr[1])>w || Math.abs(scr[2])>h) {
            nextSymb = ' m ';
        } else {
            pStr.push(nextSymb + scr[1] + ', ' + scr[2]);
            nextSymb = ' l ';
        }
    }
    pStr.push(' e');
//$('debug').innerHTML = pStr;
    return pStr;
};

JXG.VMLRenderer.prototype.updatePathStringPrimitiveOld = function(el) {
    // Loop unrolling
    var h = 2*el.board.canvasHeight;
    var w = 2*el.board.canvasWidth;
    var pStr = '';
    var scr;
    var i = 0;
    var n = el.numberPoints%8;
    if (n>0) {
        do 
        {
            scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        }
        while ((--n)>0); // n must be greater than 0 here
    }
    n = parseInt(el.numberPoints/8);
    if (n>0) { do 
    {
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
        scr = el.points[i++].scrCoords; if (!isNaN(scr[1]) && !isNaN(scr[2]) && Math.abs(scr[1])<=w && Math.abs(scr[2])<=h) { pStr += scr[1] + ',' + scr[2] + ' '; }
    }
    while ((--n)>0);}
    return pStr;
};

JXG.VMLRenderer.prototype.updatePathStringPrimitiveOld2 = function(el) {
    var pStr = '';
    var t = '';
    for (var i=0; i<el.numberPoints; i++) {
        var scr = el.points[i].scrCoords;
            t += scr[1] + ',' + scr[2] + ' ';
        if (!isNaN(scr[1]) && !isNaN(scr[2])) {
            pStr += scr[1] + ',' + scr[2] + ' ';
        }
    }
    return pStr;
    //return el.points.slice(0,el.numberPoints).map(function(p){return p.scrCoords[1]+','+p.scrCoords[2];}).join(' ');
};

JXG.VMLRenderer.prototype.updatePolygonePrimitive = function(node,el) {
    node.setAttribute('stroked', 'false');
    var minX = el.vertices[0].coords.scrCoords[1];
    var maxX = el.vertices[0].coords.scrCoords[1];
    var minY = el.vertices[0].coords.scrCoords[2];
    var maxY = el.vertices[0].coords.scrCoords[2];
    for(var i=1; i<el.vertices.length-1; i++) {
        var screenCoords = el.vertices[i].coords.scrCoords;
        if(screenCoords[1] < minX) {
            minX = screenCoords[1];
        }
        if(screenCoords[1] > maxX) {
            maxX = screenCoords[1];
        }
        if(screenCoords[2] < minY) {
            minY = screenCoords[2];
        }
        if(screenCoords[2] > maxY) {
            maxY = screenCoords[2];
        }
    }

    var x = Math.round(maxX-minX); // Breite des umgebenden Rechtecks?
    var y = Math.round(maxY-minY); // Hoehe des umgebenden Rechtecks?
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', x+','+y);
     
    var pStr = [];
    pStr.push("m ");
    var screenCoords = el.vertices[0].coords.scrCoords;
    pStr.push(screenCoords[1] + "," + screenCoords[2]);    
    pStr.push(" l ");
    for(var i=1; i<el.vertices.length-1; i++) {
        var screenCoords = el.vertices[i].coords.scrCoords;
        pStr.push(screenCoords[1] + "," + screenCoords[2]);
        if(i<el.vertices.length-2) {
            pStr.push(", ");
        }
    }
    pStr.push(" x e");

    node.setAttribute('path',pStr.join(""));
};

JXG.VMLRenderer.prototype.appendChildPrimitive = function(node,level) {
    switch (level) {
        case 'images': node.style.zIndex = "1"; break;
        case 'grid': node.style.zIndex = "1"; break;
        case 'angles': node.style.zIndex = "2"; break;
        case 'sectors': node.style.zIndex = "2"; break;
        case 'polygone': node.style.zIndex = "2"; break;
        case 'curves': node.style.zIndex = "2"; break;
        case 'circles': node.style.zIndex = "3"; break;
        case 'lines': node.style.zIndex = "4"; break;
        case 'arcs': node.style.zIndex = "4"; break;
        case 'points': node.style.zIndex = "5"; break;
    }
    this.container.appendChild(node);
};

JXG.VMLRenderer.prototype.setPropertyPrimitive = function(node,key,val) {
    var keyVml = '';
    switch (key) {
        case 'stroke': keyVml = 'strokecolor'; break;
        case 'stroke-width': keyVml = 'strokeweight'; break;
        case 'stroke-dasharray': keyVml = 'dashstyle'; break;
    }
    if (key=='stroke-dasharray'  /*&&val=='5, 5'*/) {
        var node2 = this.container.ownerDocument.createElement('v:stroke'); 
        node2.setAttribute('id', node.id+'stroke');
        node2.setAttribute('dashstyle', 'Dash');
        node.appendChild(node2);
    } else {
        if (keyVml!='') {
            var v;
            if (typeof val=='function') {
                v = val();
            } else {
                v = val;
            }
            node.setAttribute(keyVml, v);
        }
    }
};

/*
JXG.VMLRenderer.prototype.cloneSubTree = function(el,id,type) {
    var node = el.rendNode.cloneNode(true);
    node.setAttribute('id', id);
    this.appendChildPrimitive(node,type);
};
*/
