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

JXG.VMLRenderer.prototype.setShadow = function(element) {
    var nodeShadow = element.rendNodeShadow;
    if(element.visProp['shadow']) {
        nodeShadow.setAttribute('On', 'True');
        nodeShadow.setAttribute('Offset', '3pt,3pt');
        nodeShadow.setAttribute('Opacity', '60%');
        nodeShadow.setAttribute('Color', '#aaaaaa');
    }
    else {
        nodeShadow.setAttribute('On', 'False');
    }
};

JXG.VMLRenderer.prototype.setGradient = function(el) {
    var nodeFill = el.rendNodeFill;
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        nodeFill = el.rendNode2Fill;
    }    
    
    if(el.visProp['gradient'] == 'linear') {
        nodeFill.setAttribute('type','gradient');
        nodeFill.setAttribute('color2',el.visProp['gradientSecondColor']);
        nodeFill.setAttribute('opacity2',el.visProp['gradientSecondOpacity']);
        nodeFill.setAttribute('angle',el.visProp['gradientAngle']);
    }
    else if (el.visProp['gradient'] == 'radial') {
        nodeFill.setAttribute('type','gradientradial');
        nodeFill.setAttribute('color2',el.visProp['gradientSecondColor']);
        nodeFill.setAttribute('opacity2',el.visProp['gradientSecondOpacity']);
        nodeFill.setAttribute('focusposition', el.visProp['gradientPositionX']*100+'%,'+el.visProp['gradientPositionY']*100+'%');
        nodeFill.setAttribute('focussize', '0,0');
    }
    else {
        nodeFill.setAttribute('type','solid');
    }
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
    var node, t;
    
    node = this.container.ownerDocument.createElement('v:textbox');
    node.style.position = 'absolute';
    node.setAttribute('id', 'licenseText');
    
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

JXG.VMLRenderer.prototype.drawTicks = function(ticks) {
    var ticksNode = this.createPrimitive('path', ticks.id);
    this.appendChildPrimitive(ticksNode,'lines');
    //ticks.rendNode = ticksNode;
    this.appendNodesToElement(ticks, 'path');
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

    ticks = document.getElementById(axis.id);
    if(ticks == null) {
        ticks = this.createPrimitive('path', axis.id);
        this.appendChildPrimitive(ticks,'lines');
        this.appendNodesToElement(axis,'path');
    } 
    ticks.setAttribute('stroked', 'true');
    ticks.setAttribute('strokecolor', axis.visProp['strokeColor'], 1);
    ticks.setAttribute('strokeweight', axis.visProp['strokeWidth']);   
    //ticks.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    this.updatePathPrimitive(ticks, tickArr, axis.board);
};

JXG.VMLRenderer.prototype.drawArcLine = function(id, radius, angle1, angle2, midpoint, board, el) {
    //var node = this.createPrimitive('arc',id);  doesn't work here
    
    var node = this.container.ownerDocument.createElement('v:arc');
    node.setAttribute('id', id);
    fillNode = this.container.ownerDocument.createElement('v:fill');
    fillNode.setAttribute('id', id+'_fill');
    strokeNode = this.container.ownerDocument.createElement('v:stroke');
    strokeNode.setAttribute('id', id+'_stroke');
    shadowNode = this.container.ownerDocument.createElement('v:shadow');
    shadowNode.setAttribute('id', id+'_shadow');
    node.appendChild(fillNode);
    node.appendChild(strokeNode);
    node.appendChild(shadowNode);   
    
    el.rendNode = node;
    el.rendNodeFill = fillNode;
    el.rendNodeStroke = strokeNode;
    el.rendNodeShadow = shadowNode;    
    
    node.style.position = 'absolute';
    node.setAttribute('filled', 'false');

    node.style.left = (midpoint.coords.scrCoords[1] - Math.round(radius * board.stretchX)) + 'px'; 
    node.style.top = (midpoint.coords.scrCoords[2] - Math.round(radius * board.stretchY))  + 'px'; 
    node.style.width = (Math.round(radius * board.stretchX)*2) + 'px'; 
    node.style.height = (Math.round(radius * board.stretchY)*2) + 'px';  
    node.setAttribute('startangle', angle1);
    node.setAttribute('endangle', angle2);  
    
    return node;
};

JXG.VMLRenderer.prototype.drawArcFill = function(id, radius, midpoint, point2, point3, board, element) {
    var node2, x, y, nodePath, pathString;
    id = id+'sector';
    
    // createPrimitive doesn't work here...
    fillNode = this.container.ownerDocument.createElement('v:fill');
    fillNode.setAttribute('id', id+'_fill');
    strokeNode = this.container.ownerDocument.createElement('v:stroke');
    strokeNode.setAttribute('id', id+'_stroke');
    shadowNode = this.container.ownerDocument.createElement('v:shadow');
    shadowNode.setAttribute('id', id+'_shadow');    
    pathNode = this.container.ownerDocument.createElement('v:path');
    pathNode.setAttribute('id', id+'_path');        
 
    node2 = this.container.ownerDocument.createElement('v:shape');
    node2.appendChild(fillNode);
    node2.appendChild(strokeNode);
    node2.appendChild(shadowNode);   
    node2.appendChild(pathNode);
    node2.setAttribute('id', id);
    node2.style.position = 'absolute';    
    
    element.rendNode2 = node2;
    element.rendNode2Fill = fillNode;
    element.rendNode2Stroke = strokeNode;
    element.rendNode2Shadow = shadowNode;
    element.rendNode2Path = pathNode;
        
    node2.setAttribute('stroked', 'false');

    x = Math.round(radius * board.stretchX); // Breite des umgebenden Rechtecks?
    y = Math.round(radius * board.stretchY); // Hoehe des umgebenden Rechtecks?

    node2.style.width = x;
    node2.style.height = y;
    node2.setAttribute('coordsize', x+','+y);

    pathString = 'm ' + midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' l ';  
    pathString += point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2] + ' at ';
    pathString += (midpoint.coords.scrCoords[1]-x) + ',' + (midpoint.coords.scrCoords[2]-y) + ',';
    pathString += (midpoint.coords.scrCoords[1]+x) + ',' + (midpoint.coords.scrCoords[2]+y);
    pathString += ' ' + point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2];
    pathString += ', ' + point3.coords.scrCoords[1] + ',' + point3.coords.scrCoords[2] + ' l ';
    pathString += midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' x e';
    
    pathNode.setAttribute('v', pathString);
    
    return node2;
};


JXG.VMLRenderer.prototype.drawArc = function(el) { 
    var radius, p = {}, angle1, angle2, node, nodeStroke, node2, p4 = {};
    /* some computations */
    radius = el.getRadius();  
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.midpoint.coords.usrCoords[1], el.board.origin.scrCoords[2]/el.board.stretchY],
                          el.board);
    angle2 = el.board.algebra.trueAngle(el.point2, el.midpoint, p);
    angle1 = el.board.algebra.trueAngle(el.point3, el.midpoint, p);
    if(angle2 < angle1) {
        angle1 -= 360;
    }
    
    /* arc line */
    node = this.drawArcLine(el.id, radius, angle1, angle2, el.midpoint, el.board, el);
    
    /* arrows at the ends of the arc line */
    nodeStroke = el.rendNodeStroke;
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
    
    /* dashstyle and shadow */
    this.setDashStyle(el,el.visProp);  
    this.setShadow(el); 
   
    /* arc fill */
    p4.coords = el.board.algebra.projectPointToCircle(el.point3,el);      
    node2 = this.drawArcFill(el.id, radius, el.midpoint, el.point2, p4, el.board, el);
    
    /* fill props */
    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity']);
    this.setGradient(el);    
    
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
    this.remove(el.rendNode2);
    this.drawArc(el);
    return;
};

JXG.VMLRenderer.prototype.drawAngle = function(el) {
    var circle  = {}, projectedP1, projectedP3, p = {}, angle1, angle2, node, tmp, nodeStroke,
        p1 = {}, p3 = {}, node2;

    /* some computations */
  
    // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.point2;
    circle.getRadius = function() {
        return el.radius;
    };
    projectedP1 = el.board.algebra.projectPointToCircle(el.point1,circle);
    projectedP3 = el.board.algebra.projectPointToCircle(el.point3,circle);  
    
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.point2.coords.usrCoords[1], el.board.origin.scrCoords[2]/(el.board.stretchY)],
                          el.board);
    angle2 = el.board.algebra.trueAngle(el.point1, el.point2, p);
    angle1 = el.board.algebra.trueAngle(el.point3, el.point2, p);
    if(angle2 < angle1) {
        angle1 -= 360;
    }    

    /* arc line */
    node = this.drawArcLine(el.id, el.radius, angle1, angle2, el.point2, el.board, el);

    /* stroke color and width */
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
    
    /* dashstyle and shadow */
    tmp = el.visProp['dash'];
    nodeStroke = el.rendNodeStroke;    
    nodeStroke.setAttribute('dashstyle', this.dashArray[tmp]);     
    this.setShadow(el); 
   
    /* arc fill */
    p1.coords = projectedP1;  
    p3.coords = projectedP3;
    node2 = this.drawArcFill(el.id, el.radius, el.point2, p1, p3, el.board, el);   

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
    var node,imageBase64;
    
    imageBase64 = 'data:image/png;base64,' + el.imageBase64String;    
    
    node = this.container.ownerDocument.createElement('img');
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
    var node = el.rendNode, 
        m;
    m = this.joinTransforms(el,t);
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
        m = JXG.Math.matMatMult(t[i].matrix,m);
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
    var node = el.rendNode;
    node.style.visibility = "hidden"; 
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        node = el.rendNode2; 
        node.style.visibility = "hidden";         
    }
};

JXG.VMLRenderer.prototype.show = function(el) {
    var node = el.rendNode;
    node.style.visibility = "inherit";  
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        node = el.rendNode2; 
        node.style.visibility = "inherit";         
    }
};

JXG.VMLRenderer.prototype.setDashStyle = function(el,visProp) {
    var node;
    if(visProp['dash'] >= 0) {
        node = el.rendNodeStroke;
        node.setAttribute('dashstyle', this.dashArray[visProp['dash']]);
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
    if(el.type == JXG.OBJECT_TYPE_TEXT) {
        el.rendNode.style.color = c;
    }        
    else {       
        node = el.rendNode;
        node.setAttribute('stroked', 'true');
        node.setAttribute('strokecolor', c);
        
        if(el.id == 'gridx') {
            nodeStroke = document.getElementById('gridx_stroke')
        }
        else if(el.id == 'gridy') {
            nodeStroke = document.getElementById('gridy_stroke')
        }
        else {
            nodeStroke = el.rendNodeStroke;
        }
        if (o!=undefined) {
            nodeStroke.setAttribute('opacity', (o*100)+'%');  
        }
    }
};

JXG.VMLRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
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
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        if(c == 'none') {
            el.rendNode2.setAttribute('filled', 'false');
        }
        else {
            el.rendNode2.setAttribute('filled', 'true');
            el.rendNode2.setAttribute('fillcolor', c); 
            if (o!=undefined) {
                el.rendNode2Fill.setAttribute('opacity', (o*100)+'%');
            }
        }
    }
    else {
        if(c == 'none') {
            el.rendNode.setAttribute('filled', 'false');
        }
        else {
            el.rendNode.setAttribute('filled', 'true');
            el.rendNode.setAttribute('fillcolor', c); 
            if (o!=undefined) {
                el.rendNodeFill.setAttribute('opacity', (o*100)+'%');
            }
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
    var val, i, p
        len = props.length;

    for (i=0;i<len;i++) {
        p = props[i];
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

JXG.VMLRenderer.prototype.setGridDash = function(id, node) {
    var node = document.getElementById(id+'_stroke');
    node.setAttribute('dashstyle', 'Dash');
};

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.VMLRenderer.prototype.setObjectStrokeWidth = function(el, width) {
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
        node = el.rendNode;
        this.setPropertyPrimitive(node,'stroked', 'true');
        if (w!=null) { 
            this.setPropertyPrimitive(node,'stroke-width',w); 
        }
    }
};

JXG.VMLRenderer.prototype.createPrimitive = function(type, id) {
    var node, fillNode, strokeNode, shadowNode, pathNode;
    
    /* create subnodes */
    fillNode = this.container.ownerDocument.createElement('v:fill');
    fillNode.setAttribute('id', id+'_fill');
    strokeNode = this.container.ownerDocument.createElement('v:stroke');
    strokeNode.setAttribute('id', id+'_stroke');
    shadowNode = this.container.ownerDocument.createElement('v:shadow');
    shadowNode.setAttribute('id', id+'_shadow');
    
    if (type=='circle' || type=='ellipse' ) {
        node = this.container.ownerDocument.createElement('v:oval');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    } else if (type == 'polygon' || type == 'path' || type == 'shape') {    
        node = this.container.ownerDocument.createElement('v:shape');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);   
        pathNode = this.container.ownerDocument.createElement('v:path');
        pathNode.setAttribute('id', id+'_path');        
        node.appendChild(pathNode);
    } else {
        node = this.container.ownerDocument.createElement('v:'+type);
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    }
    node.style.position = 'absolute';
    node.setAttribute('id', id);
    
    return node;
};

JXG.VMLRenderer.prototype.appendNodesToElement = function(element, type) {
    if(type == 'shape' || type == 'path' || type == 'polygon') {
        element.rendNodePath = document.getElementById(element.id+'_path');
    }
    element.rendNodeFill = document.getElementById(element.id+'_fill');
    element.rendNodeStroke = document.getElementById(element.id+'_stroke');
    element.rendNodeShadow = document.getElementById(element.id+'_shadow');

    element.rendNode = document.getElementById(element.id);
};

JXG.VMLRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    var nodeStroke = el.rendNodeStroke;
    nodeStroke.setAttribute('endarrow', 'block');
    nodeStroke.setAttribute('endarrowlength', 'long');
};

JXG.VMLRenderer.prototype.makeArrows = function(el) {
    var nodeStroke;
    
    if(el.visProp['firstArrow']) {
        nodeStroke = el.rendNodeStroke;
        nodeStroke.setAttribute('startarrow', 'block');
        nodeStroke.setAttribute('startarrowlength', 'long');                 
    }
    else {
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            nodeStroke.setAttribute('startarrow', 'none');
        }            
    }
    if(el.visProp['lastArrow']) {
        nodeStroke = el.rendNodeStroke;
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
    //node.setAttribute('style','left:'+(x-r)+'px; top:'+(y-r)+'px; width:'+(r*2)+'px; height:'+ (r*2)+'px'); 
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
    var x = board.canvasWidth, 
        y = board.canvasHeight;
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', [(this.resolution*x),(this.resolution*y)].join(','));
    node.setAttribute('path',pointString.join(""));
    //node.points.value = pointString;
};

JXG.VMLRenderer.prototype.updatePathStringPrimitive = function(el) {
    var pStr = [], 
        //h = 3*el.board.canvasHeight, 
        //w = 100*el.board.canvasWidth, 
        i, scr,
        r = this.resolution,
        mround = Math.round,
        symbm = ' m ', 
        symbl = ' l ',
        nextSymb = symbm, 
        isNoPlot = (el.curveType!='plot'),
        //isFunctionGraph = (el.curveType=='functiongraph'),
        len = Math.min(el.numberPoints,8192); // otherwise IE 7 crashes in hilbert.html
    
    if (el.numberPoints<=0) { return ''; }
    if (isNoPlot && el.board.options.curve.RDPsmoothing) {
        el.points = this.RamenDouglasPeuker(el.points,1.0);
    }
    len = Math.min(len,el.points.length);

    for (i=0; i<len; i++) {
        scr = el.points[i].scrCoords;
        if (isNaN(scr[1]) || isNaN(scr[2]) /* || Math.abs(scr[1])>w || (isFunctionGraph && (scr[2]>h || scr[2]<-0.5*h))*/ ) {  // PenUp
            nextSymb = symbm;
        } else {
            // IE has problems with values  being too far away.
            if (scr[1]>20000.0) { scr[1] = 20000.0; }
            else if (scr[1]<-20000.0) { scr[1] = -20000.0; }
            if (scr[2]>20000.0) { scr[2] = 20000.0; }
            else if (scr[2]<-20000.0) { scr[2] = -20000.0; }

            pStr.push([nextSymb,mround(r*scr[1]),', ',mround(r*scr[2])].join(''));
            nextSymb = symbl;
        }
    }
    pStr.push(' e');
    return pStr;
};

JXG.VMLRenderer.prototype.updatePathStringPoint = function(el, size, type) {
    var s = [],
        scr = el.coords.scrCoords,
        r = this.resolution;
    
    if(type == 'x') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1]+size)),', ',(r*(scr[2]+size)),' m ',
        (r*(scr[1]+size)),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1]-size)),', ',(r*(scr[2]+size))].join(''));
    }
    else if(type == '+') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1]+size)),', ',(r*(scr[2])),' m ',
        (r*(scr[1])),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1])),', ',(r*(scr[2]+size))].join(''));    
    }
    return s;
}

JXG.VMLRenderer.prototype.updatePolygonePrimitive = function(node,el) {
    var minX = el.vertices[0].coords.scrCoords[1],
        maxX = el.vertices[0].coords.scrCoords[1],
        minY = el.vertices[0].coords.scrCoords[2],
        maxY = el.vertices[0].coords.scrCoords[2],
        i, 
        len = el.vertices.length,
        scr, x, y, 
        pStr = [];
        
    node.setAttribute('stroked', 'false');
    for(i=1; i<len-1; i++) {
        scr = el.vertices[i].coords.scrCoords;
        if(scr[1] < minX) {
            minX = scr[1];
        }
        if(scr[1] > maxX) {
            maxX = scr[1];
        }
        if(scr[2] < minY) {
            minY = scr[2];
        }
        if(scr[2] > maxY) {
            maxY = scr[2];
        }
    }

    x = Math.round(maxX-minX); // Breite des umgebenden Rechtecks?
    y = Math.round(maxY-minY); // Hoehe des umgebenden Rechtecks?
    
    node.style.width = x;
    node.style.height = y;
    node.setAttribute('coordsize', x+','+y);
     
    scr = el.vertices[0].coords.scrCoords;
    pStr.push(["m ",scr[1],",",scr[2]," l "].join(''));
    
    for(i=1; i<len-1; i++) {
        scr = el.vertices[i].coords.scrCoords;
        pStr.push(scr[1] + "," + scr[2]);
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
    if (keyVml!='') {
        v;
        if (typeof val=='function') {
            v = val();
        } else {
            v = val;
        }
        node.setAttribute(keyVml, v);
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
