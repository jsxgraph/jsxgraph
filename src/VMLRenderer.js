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
    
    this.resolution = 10; // Paths are drawn with a a resolution of this.resolution/pixel.
  
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

JXG.VMLRenderer.prototype.addShadowToElement = function(element) {
    var nodeShadow;
    if(element.rendNode != null) {
        nodeShadow = this.container.ownerDocument.createElement('v:shadow');
        nodeShadow.setAttribute('id', element.id+'shadow');
        nodeShadow.setAttribute('On', 'True');
        nodeShadow.setAttribute('Offset', '3pt,3pt');
        nodeShadow.setAttribute('Opacity', '60%');
        nodeShadow.setAttribute('Color', '#aaaaaa');
        element.rendNode.appendChild(nodeShadow);
    }
    else {
        if(element.rendNodeX1 != null) {
            nodeShadow = this.container.ownerDocument.createElement('v:shadow');
            nodeShadow.setAttribute('id', element.id+'_x1'+'shadow');
            nodeShadow.setAttribute('On', 'True');
            nodeShadow.setAttribute('Offset', '3pt,3pt');
            nodeShadow.setAttribute('Opacity', '60%');
            nodeShadow.setAttribute('Color', '#aaaaaa');
            element.rendNodeX1.appendChild(nodeShadow);
        }       
        if(element.rendNodeX2 != null) {
            nodeShadow = this.container.ownerDocument.createElement('v:shadow');
            nodeShadow.setAttribute('id', element.id+'_x2'+'shadow');
            nodeShadow.setAttribute('On', 'True');
            nodeShadow.setAttribute('Offset', '3pt,3pt');
            nodeShadow.setAttribute('Opacity', '60%');
            nodeShadow.setAttribute('Color', '#aaaaaa');
            element.rendNodeX2.appendChild(nodeShadow);
        }
    }
    element.board.fullUpdate();
};

JXG.VMLRenderer.prototype.addShadowToGroup = function(groupname, board) {
    var el, pEl;
    if(groupname == "lines") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_LINE) {
                this.addShadowToElement(pEl);
            }
        }
    }
    else if(groupname == "points") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_POINT) {
                this.addShadowToElement(pEl);
            }
        }
    }
    else if(groupname == "circles") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
                this.addShadowToElement(pEl);
            }
        }
    }    
    board.fullUpdate();
};

JXG.VMLRenderer.prototype.displayCopyright = function(str,fontsize) {
    var node = this.createPrimitive('textbox','licenseText'), 
        t;
        
    node.style.left = 20;
    node.style.top = (2);
    node.style.fontSize = (fontsize);
    node.style.color = '#356AA0';
    node.style.fontFamily = 'Arial,Helvetica,sans-serif';
    node.setAttribute('opacity','30%');
    node.style.filter = 'alpha(opacity = 30)';
    
    t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrimitive(node,'images');
};

JXG.VMLRenderer.prototype.drawTicks = function(axis) {
    var ticks = this.createPrimitive('path', axis.id+'_ticks');
    this.appendChildPrimitive(ticks,'lines');
    axis.rendNode = ticks;
};

JXG.VMLRenderer.prototype.updateTicks = function(axis,dxMaj,dyMaj,dxMin,dyMin) {
    var tickArr = [], i, len, c, ticks;
    
    len = axis.ticks.length;
    for (i=0; i<len; i++) {
        c = axis.ticks[i];
        if(c.major) {
            if (axis.labels[i].visProp['visible']) this.drawText(axis.labels[i]);        
            tickArr.push(' m ' + Math.round(this.resolution*(c.scrCoords[1]+dxMaj)) + 
                         ', ' + Math.round(this.resolution*(c.scrCoords[2]-dyMaj)) + 
                         ' l ' + Math.round(this.resolution*(c.scrCoords[1]-dxMaj)) + 
                         ', ' + Math.round(this.resolution*(c.scrCoords[2]+dyMaj))+' ');
        }
        else
            tickArr.push(' m ' + Math.round(this.resolution*(c.scrCoords[1]+dxMin)) + 
                         ', ' + Math.round(this.resolution*(c.scrCoords[2]-dyMin)) + 
                         ' l ' + Math.round(this.resolution*(c.scrCoords[1]-dxMin)) + 
                         ', ' + Math.round(this.resolution*(c.scrCoords[2]+dyMin))+' ');
    }

    ticks = document.getElementById(axis.id + '_ticks');
    if(ticks == null) {
        ticks = this.createPrimitive('path', axis.id+'_ticks');
        this.appendChildPrimitive(ticks,'lines');
    }
    ticks.setAttribute('stroked', 'true');
    ticks.setAttribute('strokecolor', axis.visProp['strokeColor'], 1);
    ticks.setAttribute('strokeweight', axis.visProp['strokeWidth']);   
    //ticks.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    this.updatePathPrimitive(ticks, tickArr, axis.board);
};

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
};

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
};


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
    var node = this.drawArcLine(el.id, radius, angle1, angle2, el.midpoint, el.board);
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
    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity']);
    
    /* append nodes */
    this.appendChildPrimitive(node,'lines'); //arc
    this.appendChildPrimitive(node2,'angles'); //fill
    
    /* draft mode */
    if(el.visProp['draft']) {
       this.setDraft(el);
    }
};

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
    };
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
    var node = this.drawArcLine(el.id, el.radius, angle1, angle2, el.point2, el.board);
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
    var p3 = {};
    p3.coords = projectedP3;
    var node2 = this.drawArcFill(el.id, el.radius, el.point2, p1, p3, el.board);
    el.rendNode2 = node2;

    /* fill props */
    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity']);
    
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
};

JXG.VMLRenderer.prototype.updateAngle = function(el) {
    // erstmal nur der brutale Weg... 
    this.remove(el.rendNode);
    this.remove(el.rendNode2);  
    this.drawAngle(el);
    return;
};

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
};

JXG.VMLRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode;
    var m = this.joinTransforms(el,t);
    node.style.left = (el.coords.scrCoords[1] + m[1][0]) + 'px'; 
    node.style.top = (el.coords.scrCoords[2]-el.size[1] + m[2][0]) + 'px';    
    node.filters.item(0).M11 = m[1][1];
    node.filters.item(0).M12 = m[1][2];
    node.filters.item(0).M21 = m[2][1];
    node.filters.item(0).M22 = m[2][2];
};

JXG.VMLRenderer.prototype.joinTransforms = function(el,t) {
    var m = [[1,0,0],[0,1,0],[0,0,1]], 
        i,
        len = t.length;
        
    for (i=0;i<len;i++) {
        m = el.board.algebra.matMatMult(t[i].matrix,m);
    }
    return m;
};

JXG.VMLRenderer.prototype.transformImageParent = function(el,m) {};

JXG.VMLRenderer.prototype.removeGrid = function(board) { 
    var c = document.getElementById('gridx');
    this.remove(c);

    c = document.getElementById('gridy');
    this.remove(c);

    board.hasGrid = false;
};

JXG.VMLRenderer.prototype.hide = function(el) {
    var node;
    if(!JXG.IsPoint(el)) {
        node = el.rendNode;
        node.style.visibility = "hidden"; 
        if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNodeFill; 
            node.style.visibility = "hidden";         
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            node = el.rendNode;
            node.style.visibility = "hidden";  
        }
        else {
            node = el.rendNodeX1;
            node.style.visibility = "hidden";     
            node = el.rendNodeX2;
            node.style.visibility = "hidden";  
        }
    }  
};

JXG.VMLRenderer.prototype.show = function(el) {
    var node;
    if(!JXG.IsPoint(el)) {  
        node = el.rendNode;
        node.style.visibility = "inherit";  
        if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNodeFill; 
            node.style.visibility = "inherit";         
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            node = el.rendNode;
            node.style.visibility = "inherit";  
        }
        else {
            node = el.rendNodeX1;
            node.style.visibility = "inherit";     
            node = el.rendNodeX2;
            node.style.visibility = "inherit";  
        }
    }  
};

JXG.VMLRenderer.prototype.setObjectDash = function(el) {
    var node, tmp;
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) { // Punkte haben keine dash-Eigenschaft
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode; 
            tmp = el.visProp['dash'];
            node.setAttribute('dashstyle', this.dashArray[tmp]);            
        }
        else {
            node = document.getElementById(el.id+'stroke');
            if (node) {
                tmp = el.visProp['dash'];
                node.setAttribute('dashstyle', this.dashArray[tmp]);
            }
        }
    }
};
 
JXG.VMLRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    var c, o, node, nodeStroke;
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
            node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
            
            nodeStroke = this.getElementById(el.id+'stroke');
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
            node = el.rendNode;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c);
            
            nodeStroke = this.getElementById(el.id+'stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
        }
        else {
            node = el.rendNodeX1;
            node.setAttribute('stroked', 'true');
            node.setAttribute('strokecolor', c); 
            
            nodeStroke = this.getElementById(el.id+'_x1stroke');
            if(nodeStroke == null) {
                nodeStroke = this.container.ownerDocument.createElement('v:stroke');
                nodeStroke.setAttribute('id', el.id+'_x1stroke');
                node.appendChild(nodeStroke);
            }
            if (o!=undefined) nodeStroke.setAttribute('opacity', (o*100)+'%');
            
            node = el.rendNodeX2;
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
};

JXG.VMLRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    var c, o, node, nodeFill;

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
            node = document.getElementById(el.id+'_fillnode');
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
            node = el.rendNode;
            nodeFill = document.getElementById(el.id+'_fillnode');
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
            node = el.rendNodeX1;
            if(c == 'none') {
                node.setAttribute('filled', 'false');
            }
            else {
                node.setAttribute('filled', 'true');
                node.setAttribute('fillcolor', c); 
            }
            node = el.rendNodeX2;
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
        nodeFill = document.getElementById(el.id+'_fillnode');
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
};

JXG.VMLRenderer.prototype.remove = function(node) {
  if (node!=null) node.removeNode(true);
};

JXG.VMLRenderer.prototype.suspendRedraw = function() {
    this.container.style.display='none';
};

JXG.VMLRenderer.prototype.unsuspendRedraw = function() {
    this.container.style.display='';
};

JXG.VMLRenderer.prototype.setAttributes = function(node,props,vmlprops,visProp) {
    var val, i, 
        len = props.length;

    for (i=0;i<len;i++) {
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
    var w, node;
    if (typeof width=='function') {
        w = width();
    } else {
        w = width;
    }
    //w = (w>0)?w:0;
    
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        node = el.rendNode;
        this.setPropertyPrimitive(node,'stroked', 'true');
        if (w!=null) { 
            this.setPropertyPrimitive(node,'stroke-width',w);    
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            node = el.rendNode;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w); 
            }
        }
        else {
            node = el.rendNodeX1;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w);  
            }
            node = el.rendNodeX2;
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
    var nodeStroke;
    
    if(el.visProp['firstArrow']) {
        nodeStroke = el.rendNodeStroke;
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
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            nodeStroke.setAttribute('startarrow', 'none');
        }            
    }
    if(el.visProp['lastArrow']) {
        nodeStroke = el.rendNodeStroke;
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
        nodeStroke = el.rendNodeStroke;
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
    node.setAttribute('coordsize', (this.resolution*x)+','+(this.resolution*y));
    node.setAttribute('path',pointString.join(""));
    //node.points.value = pointString;
};

JXG.VMLRenderer.prototype.updatePathStringPrimitive = function(el) {
    var oldx = -10000.0, 
        oldy = -10000.0, 
        pStr = [], 
        h = 3*el.board.canvasHeight, 
        w = 100*el.board.canvasWidth, 
        len = Math.min(el.numberPoints,8192), // otherwise IE 7 crashes in hilbert.html
        i, scr,
        symbm = ' m ', 
        symbl = ' l ',
        nextSymb = symbm, 
        isNoPlot = (el.curveType!='plot'),
        isFunctionGraph = (el.curveType=='functiongraph');
    
    if (el.numberPoints<=0) { return ''; }
    if (isNoPlot && el.board.options.curve.RDPsmoothing) {
        //el.points = this.RamenDouglasPeuker(el.points,1.0); // Takes too long in IE.
    }
    len = Math.min(len,el.points.length);

    for (i=0; i<len; i++) {
        scr = el.points[i].scrCoords;
        //if (el.curveType!='plot' && Math.abs(oldx-scr[1])+Math.abs(oldy-scr[2])<4) continue;
        if (isNaN(scr[1]) || isNaN(scr[2]) || Math.abs(scr[1])>w || (isFunctionGraph && (scr[2]>h || scr[2]<-0.5*h)) ) {  // PenUp
            nextSymb = symbm;
        } else {
            pStr.push([nextSymb,Math.round(this.resolution*scr[1]),
                       ', ',
                       Math.round(this.resolution*scr[2])].join(''));
            nextSymb = symbl;
        }
        oldx = scr[1];
        oldy = scr[2];
    }
    pStr.push(' e');
    return pStr;
};

JXG.VMLRenderer.prototype.updatePolygonePrimitive = function(node,el) {
    var minX = el.vertices[0].coords.scrCoords[1],
        maxX = el.vertices[0].coords.scrCoords[1],
        minY = el.vertices[0].coords.scrCoords[2],
        maxY = el.vertices[0].coords.scrCoords[2],
        i, 
        len = el.vertices.length,
        screenCoords, x, y, 
        pStr = [];
        
    node.setAttribute('stroked', 'false');
    for(i=1; i<len-1; i++) {
        screenCoords = el.vertices[i].coords.scrCoords;
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

    x = Math.round(maxX-minX); // Breite des umgebenden Rechtecks?
    y = Math.round(maxY-minY); // Hoehe des umgebenden Rechtecks?
    
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', x+','+y);
     
    pStr.push("m ");
    screenCoords = el.vertices[0].coords.scrCoords;
    pStr.push(screenCoords[1] + "," + screenCoords[2]);    
    pStr.push(" l ");
    
    for(i=1; i<len-1; i++) {
        screenCoords = el.vertices[i].coords.scrCoords;
        pStr.push(screenCoords[1] + "," + screenCoords[2]);
        if(i<len-2) {
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
    var keyVml = '', 
        node2, v;
        
    switch (key) {
        case 'stroke': keyVml = 'strokecolor'; break;
        case 'stroke-width': keyVml = 'strokeweight'; break;
        case 'stroke-dasharray': keyVml = 'dashstyle'; break;
    }
    if (key=='stroke-dasharray'  /*&&val=='5, 5'*/) {
        node2 = this.container.ownerDocument.createElement('v:stroke'); 
        node2.setAttribute('id', node.id+'stroke');
        node2.setAttribute('dashstyle', 'Dash');
        node.appendChild(node2);
    } else {
        if (keyVml!='') {
            v;
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
    var node = this.createPrimitive('path', 'gridx'),
        gridArr = [];
        
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        gridArr.push(' m ' + (this.resolution*topLeft.scrCoords[1]) + 
                     ', ' + 0 + 
                     ' l ' + (this.resolution*topLeft.scrCoords[1]) + 
                     ', ' + (this.resolution*board.canvasHeight)+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);   
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
};

JXG.VMLRenderer.prototype.drawHorizontalGrid = function(topLeft, bottomRight, gy, board) {
    var node = this.createPrimitive('path', 'gridy'),
        gridArr = [];
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
        gridArr.push(' m ' + 0 + 
                     ', ' + (this.resolution*topLeft.scrCoords[2]) + 
                     ' l ' + (this.resolution*board.canvasWidth) + 
                     ', ' + (this.resolution*topLeft.scrCoords[2])+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
};
/*
JXG.VMLRenderer.prototype.cloneSubTree = function(el,id,type) {
    var node = el.rendNode.cloneNode(true);
    node.setAttribute('id', id);
    this.appendChildPrimitive(node,type);
};
*/
