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
    container.ownerDocument.namespaces.add("jxgvml", "urn:schemas-microsoft-com:vml");
    //container.ownerDocument.createStyleSheet().addRule("v\\:*", "behavior: url(#default#VML);");

    this.container.ownerDocument.createStyleSheet().addRule(".jxgvml", "behavior:url(#default#VML)");
    try {
        !container.ownerDocument.namespaces.jxgvml && container.ownerDocument.namespaces.add("jxgvml", "urn:schemas-microsoft-com:vml");
        this.createNode = function (tagName) {
            return container.ownerDocument.createElement('<jxgvml:' + tagName + ' class="jxgvml">');
        };
    } catch (e) {
        this.createNode = function (tagName) {
            return container.ownerDocument.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="jxgvml">');
        };
    }
        
    // um Dashes zu realisieren
    this.dashArray = ['Solid', '1 1', 'ShortDash', 'Dash', 'LongDash', 'ShortDashDot', 'LongDashDot'];    
};

JXG.VMLRenderer.prototype = new JXG.AbstractRenderer;

JXG.VMLRenderer.prototype.setAttr = function(node, key, val, val2) {
    try {
        if (document.documentMode==8) {
            node[key] = val;
        } else {
            node.setAttribute(key,val,val2);
        }
    } catch (e) {
        //document.getElementById('debug').innerHTML += node.id+' '+key+' '+val+'<br>\n';
    }
};

JXG.VMLRenderer.prototype.eval = function(val) {
    if (typeof val=='function') {
        return val();
    } else {
        return val;
    }
};

JXG.VMLRenderer.prototype.setShadow = function(element) {
    var nodeShadow = element.rendNodeShadow;
    if (!nodeShadow) return;                          // Added 29.9.09. A.W.
    if(element.visProp['shadow']) {
        this.setAttr(nodeShadow, 'On', 'True');
        this.setAttr(nodeShadow, 'Offset', '3pt,3pt');
        this.setAttr(nodeShadow, 'Opacity', '60%');
        this.setAttr(nodeShadow, 'Color', '#aaaaaa');
    }
    else {
        this.setAttr(nodeShadow, 'On', 'False');
    }
};

JXG.VMLRenderer.prototype.setGradient = function(el) {
    var nodeFill = el.rendNodeFill;
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        nodeFill = el.rendNode2Fill;
    }    
    
    if(el.visProp['gradient'] == 'linear') {
        this.setAttr(nodeFill, 'type', 'gradient');
        this.setAttr(nodeFill, 'color2', el.visProp['gradientSecondColor']);
        this.setAttr(nodeFill, 'opacity2', el.visProp['gradientSecondOpacity']);
        this.setAttr(nodeFill, 'angle', el.visProp['gradientAngle']);
    }
    else if (el.visProp['gradient'] == 'radial') {
        this.setAttr(nodeFill, 'type','gradientradial');
        this.setAttr(nodeFill, 'color2',el.visProp['gradientSecondColor']);
        this.setAttr(nodeFill, 'opacity2',el.visProp['gradientSecondOpacity']);
        this.setAttr(nodeFill, 'focusposition', el.visProp['gradientPositionX']*100+'%,'+el.visProp['gradientPositionY']*100+'%');
        this.setAttr(nodeFill, 'focussize', '0,0');
    }
    else {
        this.setAttr(nodeFill, 'type','solid');
    }
};

JXG.VMLRenderer.prototype.updateGradient = function(el) {}; // Not needed in VML;

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
    
    //node = this.container.ownerDocument.createElement('v:textbox');
    node = this.createNode('textbox');
    node.style.position = 'absolute';
    this.setAttr(node,'id', 'licenseText');
    
    node.style.left = 20;
    node.style.top = (2);
    node.style.fontSize = (fontsize);
    node.style.color = '#356AA0';
    node.style.fontFamily = 'Arial,Helvetica,sans-serif';
    this.setAttr(node,'opacity','30%');
    node.style.filter = 'alpha(opacity = 30)';
    
    t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrimitive(node,'images');
};

JXG.VMLRenderer.prototype.drawInternalText = function(el) {
    var node;
    node = this.createNode('textbox');
    node.style.position = 'absolute';
    if (document.documentMode==8) {    
        node.setAttribute('class', 'JXGtext');
    } else {
        node.setAttribute('className', 'JXGtext');
    }
    el.rendNodeText = document.createTextNode('');
    node.appendChild(el.rendNodeText);
    this.appendChildPrimitive(node,'points');
    return node;
};

JXG.VMLRenderer.prototype.updateInternalText = function(/** JXG.Text */ el) { 
    el.rendNode.style.left = (el.coords.scrCoords[1])+'px'; 
    el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px'; 
    el.updateText();
    if (el.htmlStr!= el.plaintextStr) {
        el.rendNodeText.data = el.plaintextStr;
        el.htmlStr = el.plaintextStr;
    }
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
    this.setAttr(ticks,'stroked', 'true');
    this.setAttr(ticks,'strokecolor', axis.visProp['strokeColor'], 1);
    this.setAttr(ticks,'strokeweight', axis.visProp['strokeWidth']);   
    //ticks.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    this.updatePathPrimitive(ticks, tickArr, axis.board);
};

JXG.VMLRenderer.prototype.drawArcLine = function(id, radius, angle1, angle2, midpoint, board, el) {
    //var node = this.createPrimitive('arc',id);  doesn't work here
    var node = this.createNode('arc'),
        fillNode = this.createNode('fill'),
        strokeNode = this.createNode('stroke'),
        shadowNode = this.createNode('shadow');

    this.setAttr(node,'id', id);
    this.setAttr(fillNode,'id', id+'_fill');
    this.setAttr(strokeNode,'id', id+'_stroke');
    this.setAttr(shadowNode,'id', id+'_shadow');

    node.appendChild(fillNode);
    node.appendChild(strokeNode);
    node.appendChild(shadowNode);   
    
    el.rendNode = node;
    el.rendNodeFill = fillNode;
    el.rendNodeStroke = strokeNode;
    el.rendNodeShadow = shadowNode;    
    
    node.style.position = 'absolute';
    this.setAttr(node,'filled', 'false');

    node.style.left = (midpoint.coords.scrCoords[1] - Math.round(radius * board.stretchX)) + 'px'; 
    node.style.top = (midpoint.coords.scrCoords[2] - Math.round(radius * board.stretchY))  + 'px'; 
    node.style.width = (Math.round(radius * board.stretchX)*2) + 'px'; 
    node.style.height = (Math.round(radius * board.stretchY)*2) + 'px';  
    this.setAttr(node,'startangle', angle1);
    this.setAttr(node,'endangle', angle2);  
    
    return node;
};

JXG.VMLRenderer.prototype.drawArcFill = function(id, radius, midpoint, point2, point3, board, element) {
    // createPrimitive doesn't work here...
    var x, y, pathString,
        pathNode = this.createNode('path'),
        node2 = this.createNode('shape'),
        fillNode = this.createNode('fill'),
        strokeNode = this.createNode('stroke'),
        shadowNode = this.createNode('shadow');
 
    id = id+'sector';
    this.setAttr(pathNode, 'id', id+'_path');        
    this.setAttr(fillNode,'id', id+'_fill');
    this.setAttr(strokeNode,'id', id+'_stroke');
    this.setAttr(shadowNode,'id', id+'_shadow');    
    this.setAttr(node2,'id', id);
 
    node2.appendChild(fillNode);
    node2.appendChild(strokeNode);
    node2.appendChild(shadowNode);   
    node2.appendChild(pathNode);
    node2.style.position = 'absolute';    
    
    element.rendNode2 = node2;
    element.rendNode2Fill = fillNode;
    element.rendNode2Stroke = strokeNode;
    element.rendNode2Shadow = shadowNode;
    element.rendNode2Path = pathNode;
        
    this.setAttr(node2,'stroked', 'false');

    x = Math.round(radius * board.stretchX); // Breite des umgebenden Rechtecks?
    y = Math.round(radius * board.stretchY); // Hoehe des umgebenden Rechtecks?

    node2.style.width = x;
    node2.style.height = y;
    this.setAttr(node2,'coordsize', x+','+y);

    pathString = 'm ' + midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' l ';  
    pathString += point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2] + ' at ';
    pathString += (midpoint.coords.scrCoords[1]-x) + ',' + (midpoint.coords.scrCoords[2]-y) + ',';
    pathString += (midpoint.coords.scrCoords[1]+x) + ',' + (midpoint.coords.scrCoords[2]+y);
    pathString += ' ' + point2.coords.scrCoords[1] + ',' + point2.coords.scrCoords[2];
    pathString += ', ' + point3.coords.scrCoords[1] + ',' + point3.coords.scrCoords[2] + ' l ';
    pathString += midpoint.coords.scrCoords[1] + ',' + midpoint.coords.scrCoords[2] + ' x e';
    
    this.setAttr(pathNode,'v', pathString);
    
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
        this.setAttr(nodeStroke,'endarrow', 'block');
        this.setAttr(nodeStroke,'endarrowlength', 'long');
    }
    if(el.visProp['firstArrow']) {        
        this.setAttr(nodeStroke,'startarrow', 'block');
        this.setAttr(nodeStroke,'startarrowlength', 'long');
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
    if(!el.visProp['visible']) {
        el.hideElement(el);
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
    var circle  = {}, projectedP1, projectedP3, p = {}, 
        angle1, angle2, node, tmp, nodeStroke,
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
    this.setAttr(nodeStroke,'dashstyle', this.dashArray[tmp]);     
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
    this.setAttr(node,'id', el.id);

    this.setAttr(node,'src',imageBase64);
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
        this.setAttr(node,'dashstyle', this.dashArray[visProp['dash']]);
    }
};
 
JXG.VMLRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    var c = this.eval(color), 
        o = this.eval(opacity), 
        node, nodeStroke;

    o = (o>0)?o:0;
    if(el.type == JXG.OBJECT_TYPE_TEXT) {
        el.rendNode.style.color = c;
    }        
    else {       
        node = el.rendNode;
        this.setAttr(node,'stroked', 'true');
        this.setAttr(node,'strokecolor', c);
        
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
            this.setAttr(nodeStroke,'opacity', (o*100)+'%');  
        }
    }
};

JXG.VMLRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    var c = this.eval(color), 
        o = this.eval(opacity);

    o = (o>0)?o:0;
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        if(c == 'none') {
             this.setAttr(el.rendNode2,'filled', 'false');
        }
        else {
            this.setAttr(el.rendNode2,'filled', 'true');
            this.setAttr(el.rendNode2,'fillcolor', c); 
            if (o!=undefined) {
                 this.setAttr(el.rendNode2Fill,'opacity', (o*100)+'%');
            }
        }
    }
    else {
        if(c == 'none') {
            this.setAttr(el.rendNode,'filled', 'false');
        }
        else {
            this.setAttr(el.rendNode,'filled', 'true');
            this.setAttr(el.rendNode,'fillcolor', c); 
            if (o!=undefined && el.rendNodeFill) {  // Added el.rendNodeFill 29.9.09  A.W.
                this.setAttr(el.rendNodeFill,'opacity', (o*100)+'%');
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
            val = this.eval(visProp[p]);
            val = (val>0)?val:0;
            this.setAttr(node,vmlprops[i], val);
        }
    }
};

JXG.VMLRenderer.prototype.setGridDash = function(id, node) {
    var node = document.getElementById(id+'_stroke');
    this.setAttr(node,'dashstyle', 'Dash');
};

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.VMLRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    var w = this.eval(width), 
        node;
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
    var node, 
        fillNode = this.createNode('fill'), 
        strokeNode = this.createNode('stroke'), 
        shadowNode = this.createNode('shadow'), 
        pathNode;
    
    this.setAttr(fillNode, 'id', id+'_fill');
    this.setAttr(strokeNode, 'id', id+'_stroke');
    this.setAttr(shadowNode, 'id', id+'_shadow');
    
    if (type=='circle' || type=='ellipse' ) {
        node = this.createNode('oval');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    } else if (type == 'polygon' || type == 'path' || type == 'shape' || type == 'line') {    
        node = this.createNode('shape');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);   
        pathNode = this.createNode('path');
        this.setAttr(pathNode, 'id', id+'_path');        
        node.appendChild(pathNode);
    } else {
        node = this.createNode(type);
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    }
    node.style.position = 'absolute';
    this.setAttr(node, 'id', id);
    
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
    this.setAttr(nodeStroke, 'endarrow', 'block');
    this.setAttr(nodeStroke, 'endarrowlength', 'long');
};

JXG.VMLRenderer.prototype.makeArrows = function(el) {
    var nodeStroke;
    
    if(el.visProp['firstArrow']) {
        nodeStroke = el.rendNodeStroke;
        this.setAttr(nodeStroke, 'startarrow', 'block');
        this.setAttr(nodeStroke, 'startarrowlength', 'long');                 
    }
    else {
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            this.setAttr(nodeStroke, 'startarrow', 'none');
        }            
    }
    if(el.visProp['lastArrow']) {
        nodeStroke = el.rendNodeStroke;
        this.setAttr(nodeStroke, 'id', el.id+"stroke");
        this.setAttr(nodeStroke, 'endarrow', 'block');
        this.setAttr(nodeStroke, 'endarrowlength', 'long');            
    }
    else {
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            this.setAttr(nodeStroke, 'endarrow', 'none');
        }        
    }    
};

JXG.VMLRenderer.prototype.updateLinePrimitive = function(node,p1x,p1y,p2x,p2y,board) {
    /* 
    this.setAttr(node, 'from', [p1x,p1y].join(',')); 
    this.setAttr(node, 'to', [p2x,p2y].join(','));      
    */
    var s, r = this.resolution;
    s = ['m ',r*p1x,', ',r*p1y,' l ',r*p2x,', ',r*p2y];
    this.updatePathPrimitive(node,s,board);
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
    this.setAttr(node, 'coordsize', [(this.resolution*x),(this.resolution*y)].join(','));
    this.setAttr(node, 'path',pointString.join(""));
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
        
    this.setAttr(node, 'stroked', 'false');
    for(i=1; i<len-1; i++) {
        scr = el.vertices[i].coords.scrCoords;
        if(scr[1] < minX) {
            minX = scr[1];
        }
        else if(scr[1] > maxX) {
            maxX = scr[1];
        }
        if(scr[2] < minY) {
            minY = scr[2];
        }
        else if(scr[2] > maxY) {
            maxY = scr[2];
        }
    }

    x = Math.round(maxX-minX); // Breite des umgebenden Rechtecks?
    y = Math.round(maxY-minY); // Hoehe des umgebenden Rechtecks?

    if (!isNaN(x) && !isNaN(y)) {
        node.style.width = x;
        node.style.height = y;
        this.setAttr(node, 'coordsize', x+','+y);
    }
     
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

    this.setAttr(node, 'path',pStr.join(""));
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
        v = this.eval(val);
        this.setAttr(node, keyVml, v);
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
