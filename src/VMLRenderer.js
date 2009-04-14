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
    // Original: IE <=7
    container.ownerDocument.namespaces.add("v", "urn:schemas-microsoft-com:vml");
    container.ownerDocument.createStyleSheet().addRule("v\\:*", "behavior: url(#default#VML);");
    // excanvas: 
    /*
        container.ownerDocument.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
        //container.ownerDocument.createStyleSheet().cssText = "v\\:*{behavior:url(#default#VML)}";
        var ss = container.ownerDocument.createStyleSheet();
        ss.cssText = '.jsxgbox{v\\:*{behavior:url(#default#VML)}}';
    */

    // Ohne Fehler, aber falsch:
    //container.ownerDocument.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");

    // MSDN tip
   /*
    if(!document.documentMode || document.documentMode<8) {
        document.createStyleSheet().addRule('v\\:*', "behavior: url(#default#VML);");
    }
    if(document.documentMode && document.documentMode>=8) {
        document.writeln('<?import namespace="v" implementation="#default#VML" ?>');
    }
    */

/*
    container.ownerDocument.namespaces.add("v", "urn:schemas-microsoft-com:vml");
    container.ownerDocument.createStyleSheet().addRule("v\\:shape","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:fill","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:fillcolor","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:stroke","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:from","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:to","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:points","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:control1","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:control2","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:arcsize","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:startangle","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:endangle","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:src","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:cropleft","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:croptop","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:cropright","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:cropbottom","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:embosscolor","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:gain","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:blacklevel","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:gamma","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:grayscale","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:bilevel","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:id","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:type","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:adj","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:path","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:href","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:target","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:class","behavior: url(#default#VML);");
*/    
    /*
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
    container.ownerDocument.createStyleSheet().addRule("v\\:","behavior: url(#default#VML);");
*/
    //-------------------------------
    //container.ownerDocument.createStyleSheet().addRule("v\\:fill", "behavior: url(#default#VML);");
    //container.ownerDocument.createStyleSheet().addRule("v\\:stroke", "behavior: url(#default#VML);");
    //container.ownerDocument.createStyleSheet().addRule("v\\:line", "behavior: url(#default#VML);");
        
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

JXG.VMLRenderer.prototype.drawTicks = function(axis) {
    var ticks = this.createPrimitive('path', axis.id+'_ticks');
    this.appendChildPrimitive(ticks,'lines');
    
    axis.rendNode = ticks;
}

JXG.VMLRenderer.prototype.updateTicks = function(axis,dxMaj,dyMaj,dxMin,dyMin) {
    var tickArr = [];
    for (var i=0; i<axis.ticks.length; i++) {
        var c = axis.ticks[i];
        if(c.major) {
            if (axis.labels[i].show) this.drawLabel(axis.labels[i]);
            tickArr.push(' m ' + Math.round(c.scrCoords[1]+dxMaj) + ', ' + Math.round(c.scrCoords[2]-dyMaj) + ' l ' + Math.round(c.scrCoords[1]-dxMaj) + ', ' + Math.round(c.scrCoords[2]+dyMaj)+' ');
        }
        else
            tickArr.push(' m ' + Math.round(c.scrCoords[1]+dxMin) + ', ' + Math.round(c.scrCoords[2]-dyMin) + ' l ' + Math.round(c.scrCoords[1]-dxMin) + ', ' + Math.round(c.scrCoords[2]+dyMin)+' ');
    }

    var ticks = document.getElementById(axis.id + '_ticks');
    if(ticks == null) {
        ticks = this.createPrimitive('path', axis.id+'_ticks');
        this.appendChildPrimitive(ticks,'lines');
    }
    ticks.setAttribute('stroked', 'true');
    ticks.setAttribute('strokecolor', axis.visProp['strokeColor'], 1);
    ticks.setAttribute('strokeweight', axis.visProp['strokeWidth']);   
    //ticks.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    this.updatePathPrimitive(ticks, tickArr, axis.board);
}

JXG.VMLRenderer.prototype.drawArcLine = function(id, radius, angle1, angle2, midpoint, board) {
    var node = this.createPrimitive('arc',id); 
    node.style.position = 'absolute';
    node.setAttribute('filled', 'false');

    node.style.left = (midpoint.coords.scrCoords[1] - Math.round(radius * board.unitX * board.zoomX)) + 'px'; 
    node.style.top = (midpoint.coords.scrCoords[2] - Math.round(radius * board.unitY * board.zoomY))  + 'px'; 
    node.style.width = (Math.round(radius * board.unitX * board.zoomX)*2) + 'px'; 
    node.style.height = (Math.round(radius * board.unitY * board.zoomY)*2) + 'px';  
    node.setAttribute('startangle', angle1);
    node.setAttribute('endangle', angle2);  
    
    return node;
}

JXG.VMLRenderer.prototype.drawArcFill = function(id, radius, midpoint, point2, point3, board) {
    var node2 = this.createPrimitive('shape', id+'_fill');

    node2.setAttribute('stroked', 'false');

    var x = Math.round(radius * board.unitX * board.zoomX); // Breite des umgebenden Rechtecks?
    var y = Math.round(radius * board.unitY * board.zoomY); // Hoehe des umgebenden Rechtecks?
    node2.style.width = x;
    node2.style.height = y;
    node2.setAttribute('coordsize', x+','+y);
    
    var nodePath = this.container.ownerDocument.createElement('v:path');
    nodePath.setAttribute('id', id+'path');

    var pathString = 'm ' + midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' l ';  
    pathString += point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2] + ' at ';
    pathString += (midpoint.coords.scrCoords[1]-x) + ',' + (midpoint.coords.scrCoords[2]-y) + ',';
    pathString += (midpoint.coords.scrCoords[1]+x) + ',' + (midpoint.coords.scrCoords[2]+y);
    pathString += ' ' + point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2];
    pathString += ', ' + point3.coords.scrCoords[1] + ',' + point3.coords.scrCoords[2] + ' l ';
    pathString += midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' x e';
    
    nodePath.setAttribute('v', pathString);
    node2.appendChild(nodePath);
    
    return node2;
}


JXG.VMLRenderer.prototype.drawArc = function(el) { 
    /* some computations */
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
    
    /* arc line */
    var node = this.drawArcLine(el.id, radius, angle1, angle2, el.midpoint, el.board)
    el.rendNode = node;

    /* arrows at the ends of the arc line */
    var nodeStroke = this.getElementById(el.id+'stroke');
    if(nodeStroke == null) {
        nodeStroke = this.container.ownerDocument.createElement('v:stroke');
        nodeStroke.setAttribute('id', el.id+'stroke');
        node.appendChild(nodeStroke);
    }
    if(el.visProp['lastArrow']) {        
        nodeStroke.setAttribute('endarrow', 'block');
        nodeStroke.setAttribute('endarrowlength', 'long');
    }
    if(el.visProp['firstArrow']) {        
        nodeStroke.setAttribute('startarrow', 'block');
        nodeStroke.setAttribute('startarrowlength', 'long');
    }
    
    /* stroke color and width */
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
    
    /* dashstyle */
    var tmp = el.visProp['dash'];
    nodeStroke.setAttribute('dashstyle', this.dashArray[tmp]);    
    node.appendChild(nodeStroke);    
   
    /* arc fill */
    var p4 = {};
    p4.coords = el.board.algebra.projectPointToCircle(el.point3,el);      
    var node2 = this.drawArcFill(el.id, radius, el.midpoint, el.point2, p4, el.board);
    el.rendNode2 = node2;

    /* fill props */
    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity'])
    
    /* append nodes */
    this.appendChildPrimitive(node,'lines'); //arc
    this.appendChildPrimitive(node2,'angles'); //fill
    
    /* draft mode */
    if(el.visProp['draft']) {
       this.setDraft(el);
    }
}

/**
 * Updates properties of an arc that already exists.
 * @param {JXG.Arc} arc Reference to an arc object, that has to be updated.
 * @see JXG.Arc
 * @see #drawArc
 */
JXG.AbstractRenderer.prototype.updateArc = function(el) { 
    // AW: brutaler fix der update-Methode...
    this.remove(el.rendNode);
    this.remove(el.rendNodeFill);     
    this.remove(el.rendNode2);
    this.drawArc(el);
    this.setDraft(el);
    return;
};

JXG.VMLRenderer.prototype.drawAngle = function(el) {
    /* some computations */
    var circle = {};  // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.point2;
    circle.getRadius = function() {
        return el.radius;
    }
    var projectedP1 = el.board.algebra.projectPointToCircle(el.point1,circle);
    var projectedP3 = el.board.algebra.projectPointToCircle(el.point3,circle);  
    
    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.point2.coords.usrCoords[1], el.board.origin.scrCoords[2]/(el.board.unitY*el.board.zoomY)],
                          el.board);
    var angle2 = el.board.algebra.trueAngle(el.point1, el.point2, p);
    var angle1 = el.board.algebra.trueAngle(el.point3, el.point2, p);
    if(angle2 < angle1) {
        angle1 -= 360;
    }    

    /* arc line */
    var node = this.drawArcLine(el.id, el.radius, angle1, angle2, el.point2, el.board)
    el.rendNode = node;

    /* stroke color and width */
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
    
    /* dashstyle */
    var tmp = el.visProp['dash'];
    var nodeStroke = this.getElementById(el.id+'stroke');
    if(nodeStroke == null) {
        nodeStroke = this.container.ownerDocument.createElement('v:stroke');
        nodeStroke.setAttribute('id', el.id+'stroke');
        node.appendChild(nodeStroke);
    }    
    nodeStroke.setAttribute('dashstyle', this.dashArray[tmp]);    
    node.appendChild(nodeStroke);    
   
    /* arc fill */
    var p1 = {};
    p1.coords = projectedP1;  
    var p3 = {}
    p3.coords = projectedP3;
    var node2 = this.drawArcFill(el.id, el.radius, el.point2, p1, p3, el.board);
    el.rendNode2 = node2;

    /* fill props */
    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity'])
    
    /* append nodes */
    this.appendChildPrimitive(node,'lines'); //arc
    this.appendChildPrimitive(node2,'angles'); //fill
    
    /* draft mode */
    if(el.visProp['draft']) {
       this.setDraft(el);
    }

    if(!el.visProp['visible']) {
        el.hideElement(el);
    }
}

JXG.VMLRenderer.prototype.updateAngle = function(el) {
    // erstmal nur der brutale Weg... 
    this.remove(el.rendNode);
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
    var c = document.getElementById('gridx');
    this.remove(c);

    var c = document.getElementById('gridy');
    this.remove(c);
}

JXG.VMLRenderer.prototype.hide = function(el) {
    if(!JXG.IsPoint(el)) {
        var node = el.rendNode;
        node.style.visibility = "hidden"; 
        if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNodeFill; 
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
        var node = el.rendNode;
        node.style.visibility = "inherit";  
        if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNodeFill; 
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
            var node = el.rendNode; 
                var tmp = el.visProp['dash'];
                node.setAttribute('dashstyle', this.dashArray[tmp]);            
        }
        else {
            var node = document.getElementById(el.id+'stroke');
            if (node) {
                var tmp = el.visProp['dash'];
                node.setAttribute('dashstyle', this.dashArray[tmp]);
            }
        }
    }
}
 
JXG.VMLRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
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
        if(el.type == JXG.OBJECT_TYPE_TEXT) {
            el.rendNode.style.color = c;
        }        
        else {       
            var node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
            
            var nodeStroke = this.getElementById(el.id+'stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
            
            var nodeStroke = this.getElementById(el.id+'stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
        }
        else {
            var node = el.rendNodeX1;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c); 
            
            var nodeStroke = this.getElementById(el.id+'_x1stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'_x1stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
            
            var node = el.rendNodeX2;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
            
            nodeStroke = this.getElementById(el.id+'_x2stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'_x2stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
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
        if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
            var node = document.getElementById(el.id+'_fillnode');
            if(node == null) {
                node = this.container.ownerDocument.createElement('v:fill');
                node.setAttribute('id',el.id+'_fillnode');
                el.rendNode2.appendChild(node);
            }        
            el.rendNodeFill = node; 
            if(c == 'none') {
                el.rendNode2.setAttribute('filled', 'false');
            }
            else {
                el.rendNode2.setAttribute('filled', 'true');
                el.rendNode2.setAttribute('fillcolor', c); 
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
            var nodeFill = document.getElementById(el.id+'_fillnode');
            if(nodeFill == null) {
                nodeFill = this.container.ownerDocument.createElement('v:fill');
                nodeFill.setAttribute('id',el.id+'_fillnode');
                node.appendChild(nodeFill);
            }        
            el.rendNodeFill = nodeFill;            
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
                if (o!=undefined) nodeFill.setAttribute('opacity', (o*100)+'%');
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
        var nodeFill = document.getElementById(el.id+'_fillnode');
        if(nodeFill == null) {
            nodeFill = this.container.ownerDocument.createElement('v:fill');
            nodeFill.setAttribute('id',el.id+'_fillnode');
            if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
                el.rendNode2.appendChild(nodeFill);
            }
            else {
                el.rendNode.appendChild(nodeFill);
            }
        }        
        el.rendNodeFill = nodeFill;        
        if (o!=undefined) {
            nodeFill.setAttribute('opacity', (o*100)+'%');
            //alert(el.name+"     "+nodeFill.getAttribute('opacity')+"......"+o);
        }
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

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.AbstractRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    var w;
    if (typeof width=='function') {
        w = width();
    } else {
        w = width;
    }
    //w = (w>0)?w:0;
    
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        var node = el.rendNode;
        this.setPropertyPrimitive(node,'stroked', 'true');
        if (w!=null) { 
            this.setPropertyPrimitive(node,'stroke-width',w);    
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w); 
            }
        }
        else {
            var node = el.rendNodeX1;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w);  
            }
            var node = el.rendNodeX2;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w); 
            }
        }
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

JXG.VMLRenderer.prototype.updatePathPrimitive = function(node,pointString,board) {
    //var node = el.rendNode;
    var x = board.canvasWidth;
    var y = board.canvasHeight;
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
    var h = 100*el.board.canvasHeight; // This is a weak test to detect infinity
    var w = 100*el.board.canvasWidth;
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
        case 'curves': node.style.zIndex = "4"; break; //2
        case 'circles': node.style.zIndex = "4"; break; //3
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

JXG.VMLRenderer.prototype.drawVerticalGrid = function(topLeft, bottomRight, gx, board) {
    var node = this.createPrimitive('path', 'gridx');
    var gridArr = [];
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        gridArr.push(' m ' + topLeft.scrCoords[1] + ', ' + 0 + ' l ' + topLeft.scrCoords[1] + ', ' + board.canvasHeight+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);   
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
}

JXG.VMLRenderer.prototype.drawHorizontalGrid = function(topLeft, bottomRight, gy, board) {
    var node = this.createPrimitive('path', 'gridy');
    var gridArr = [];
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
        gridArr.push(' m ' + 0 + ', ' + topLeft.scrCoords[2] + ' l ' + board.canvasWidth + ', ' + topLeft.scrCoords[2]+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
}
/*
JXG.VMLRenderer.prototype.cloneSubTree = function(el,id,type) {
    var node = el.rendNode.cloneNode(true);
    node.setAttribute('id', id);
    this.appendChildPrimitive(node,type);
};
*/
