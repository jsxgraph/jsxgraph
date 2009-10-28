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

JXG.SVGRenderer = function(container) {
    this.constructor();

    this.svgRoot = null;
    this.suspendHandle = null;
    
    this.svgNamespace = 'http://www.w3.org/2000/svg';
    this.xlinkNamespace ='http://www.w3.org/1999/xlink';

    this.container = container;
    this.container.style.MozUserSelect = 'none';

    this.container.style.overflow = 'hidden';
    if (this.container.style.position=='') {
        this.container.style.position = 'relative';
    }
    
    this.svgRoot = this.container.ownerDocument.createElementNS(this.svgNamespace, "svg");
    this.container.appendChild(this.svgRoot);

    this.defs = this.container.ownerDocument.createElementNS(this.svgNamespace,'defs');
    this.svgRoot.appendChild(this.defs);
    this.filter = this.container.ownerDocument.createElementNS(this.svgNamespace,'filter');
    this.filter.setAttributeNS(null, 'id', 'f1');
    this.filter.setAttributeNS(null, 'width', '300%');
    this.filter.setAttributeNS(null, 'height', '300%');
    this.feOffset = this.container.ownerDocument.createElementNS(this.svgNamespace,'feOffset');
    this.feOffset.setAttributeNS(null, 'result', 'offOut');
    this.feOffset.setAttributeNS(null, 'in', 'SourceAlpha');
    this.feOffset.setAttributeNS(null, 'dx', '5');
    this.feOffset.setAttributeNS(null, 'dy', '5');
    this.filter.appendChild(this.feOffset);
    this.feGaussianBlur = this.container.ownerDocument.createElementNS(this.svgNamespace,'feGaussianBlur');
    this.feGaussianBlur.setAttributeNS(null, 'result', 'blurOut');
    this.feGaussianBlur.setAttributeNS(null, 'in', 'offOut');
    this.feGaussianBlur.setAttributeNS(null, 'stdDeviation', '3');
    this.filter.appendChild(this.feGaussianBlur);
    this.feBlend = this.container.ownerDocument.createElementNS(this.svgNamespace,'feBlend');
    this.feBlend.setAttributeNS(null, 'in', 'SourceGraphic');
    this.feBlend.setAttributeNS(null, 'in2', 'blurOut');
    this.feBlend.setAttributeNS(null, 'mode', 'normal');
    this.filter.appendChild(this.feBlend);
    this.defs.appendChild(this.filter);    
    
    // um eine passende Reihenfolge herzustellen
    this.images = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.images);
    this.grid = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.grid);
    this.angles = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.angles);    
    this.sectors = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.sectors);
    this.polygone = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.polygone);
    this.curves = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.curves);
    this.circles = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.circles);
    this.lines = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.lines);
    this.arcs = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.arcs);
    this.points = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
    this.svgRoot.appendChild(this.points);
    
    // um Dashes zu realisieren
    this.dashArray = ['2, 2', '5, 5', '10, 10', '20, 20', '20, 10, 10, 10', '20, 5, 10, 5'];
};

JXG.SVGRenderer.prototype = new JXG.AbstractRenderer;

JXG.SVGRenderer.prototype.setShadow = function(element) {
    if(element.rendNode != null) {
        if(element.visProp['shadow']) {
            element.rendNode.setAttributeNS(null,'filter','url(#f1)');
        }
        else {
            element.rendNode.removeAttributeNS(null,'filter');

        }    
    }
}

JXG.SVGRenderer.prototype.setGradient = function(el) {
    var fillNode = el.rendNode, col, op;
    
    if(el.type == JXG.OBJECT_TYPE_ARC || el.type == JXG.OBJECT_TYPE_ANGLE) {
        fillNode = el.rendNode2;
    } 
    if (typeof el.visProp['fillOpacity']=='function') {
        op = el.visProp['fillOpacity']();
    } else {
        op = el.visProp['fillOpacity'];
    }
    op = (op>0)?op:0;
    if (typeof el.visProp['fillColor']=='function') {
        col = el.visProp['fillColor']();
    } else {
        col = el.visProp['fillColor'];
    }

    if(el.visProp['gradient'] == 'linear') {
        var node = this.createPrimitive('linearGradient',el.id+'_gradient');
        var x1 = '0%'; // TODO: get x1,x2,y1,y2 from el.visProp['angle']
        var x2 = '100%';
        var y1 = '0%';
        var y2 = '0%'; //means 270 degrees

        node.setAttributeNS(null,'x1',x1);
        node.setAttributeNS(null,'x2',x2);
        node.setAttributeNS(null,'y1',y1);
        node.setAttributeNS(null,'y2',y2);
        var node2 = this.createPrimitive('stop',el.id+'_gradient1');
        node2.setAttributeNS(null,'offset','0%');
        node2.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);     
        var node3 = this.createPrimitive('stop',el.id+'_gradient2');
        node3.setAttributeNS(null,'offset','100%');
        node3.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
        node.appendChild(node2);
        node.appendChild(node3);     
        this.defs.appendChild(node);
        fillNode.setAttributeNS(null, 'style', 'fill:url(#'+el.id+'_gradient)');      
        el.gradNode1 = node2;
        el.gradNode2 = node3;
    }
    else if (el.visProp['gradient'] == 'radial') {
        var node = this.createPrimitive('radialGradient',el.id+'_gradient');

        node.setAttributeNS(null, 'cx', '50%')
        node.setAttributeNS(null, 'cy', '50%')
        node.setAttributeNS(null, 'r', '50%')
        node.setAttributeNS(null, 'fx', el.visProp['gradientPositionX']*100+'%')
        node.setAttributeNS(null, 'fy', el.visProp['gradientPositionY']*100+'%')

        var node2 = this.createPrimitive('stop',el.id+'_gradient1');
        node2.setAttributeNS(null,'offset','0%');
        node2.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
        var node3 = this.createPrimitive('stop',el.id+'_gradient2');
        node3.setAttributeNS(null,'offset','100%');
        node3.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);         

        node.appendChild(node2);
        node.appendChild(node3);     
        this.defs.appendChild(node);
        fillNode.setAttributeNS(null, 'style', 'fill:url(#'+el.id+'_gradient)'); 
        el.gradNode1 = node2;
        el.gradNode2 = node3;
    }
    else {
        fillNode.removeAttributeNS(null,'style');
    }
};

JXG.SVGRenderer.prototype.updateGradient = function(el) {
    var node2 = el.gradNode1, 
        node3 = el.gradNode2, 
        col, op;

    if (node2==null || node3==0) {
        return;
    }
    if (typeof el.visProp['fillOpacity']=='function') {
        op = el.visProp['fillOpacity']();
    } else {
        op = el.visProp['fillOpacity'];
    }
    op = (op>0)?op:0;
    if (typeof el.visProp['fillColor']=='function') {
        col = el.visProp['fillColor']();
    } else {
        col = el.visProp['fillColor'];
    }
    
    if(el.visProp['gradient'] == 'linear') {
        node2.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);     
        node3.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
    } else if (el.visProp['gradient'] == 'radial') {
        node2.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
        node3.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);         
    }
}; 

JXG.SVGRenderer.prototype.displayCopyright = function(str,fontsize) {
    var node = this.createPrimitive('text','licenseText'),
        t;
    node.setAttributeNS(null,'x','20');
    node.setAttributeNS(null,'y',2+fontsize);
    node.setAttributeNS(null, "style", "font-family:Arial,Helvetica,sans-serif; font-size:"+fontsize+"px; fill:#356AA0;  opacity:0.3;");
    t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrimitive(node,'images');
};

JXG.SVGRenderer.prototype.drawInternalText = function(el) {
    var node = this.createPrimitive('text',el.id);
    node.setAttributeNS(null, "class", "JXGtext");
    el.rendNodeText = document.createTextNode('');
    node.appendChild(el.rendNodeText);
    this.appendChildPrimitive(node,'points');
    return node;
};

JXG.SVGRenderer.prototype.updateInternalText = function(/** JXG.Text */ el) { 
    el.rendNode.setAttributeNS(null, 'x', (el.coords.scrCoords[1])+'px'); 
    el.rendNode.setAttributeNS(null, 'y', (el.coords.scrCoords[2] - this.vOffsetText)+'px'); 
    el.updateText();
    if (el.htmlStr!= el.plaintextStr) {
        el.rendNodeText.data = el.plaintextStr;
        el.htmlStr = el.plaintextStr;
    }
};

JXG.SVGRenderer.prototype.drawTicks = function(axis) {
    var node = this.createPrimitive('path', axis.id);
    node.setAttributeNS(null, 'shape-rendering', 'crispEdges');
    this.appendChildPrimitive(node,'lines');
    this.appendNodesToElement(axis,'path'); 
};

JXG.SVGRenderer.prototype.updateTicks = function(axis,dxMaj,dyMaj,dxMin,dyMin) {
    var tickStr = "",
        i, c, node, 
        len = axis.ticks.length;
        
    for (i=0; i<len; i++) {
        c = axis.ticks[i].scrCoords;
        if (axis.ticks[i].major) {
            if (axis.labels[i].visProp['visible']) this.drawText(axis.labels[i]);
            tickStr += "M " + (c[1]+dxMaj) + " " + (c[2]-dyMaj) + " L " + (c[1]-dxMaj) + " " + (c[2]+dyMaj) + " ";
        }
        else
            tickStr += "M " + (c[1]+dxMin) + " " + (c[2]-dyMin) + " L " + (c[1]-dxMin) + " " + (c[2]+dyMin) + " ";
    }
    
    node = document.getElementById(axis.id);
    if(node == null) {
        node = this.createPrimitive('path', axis.id);
        node.setAttributeNS(null, 'shape-rendering', 'crispEdges');
        this.appendChildPrimitive(node,'lines');
        this.appendNodesToElement(axis,'path');
    }
    node.setAttributeNS(null, 'stroke', axis.visProp['strokeColor']);    
    node.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    node.setAttributeNS(null, 'stroke-width', axis.visProp['strokeWidth']);
    this.updatePathPrimitive(node, tickStr, axis.board);
};

JXG.SVGRenderer.prototype.drawArc = function(el) {  
    var node = this.createPrimitive('path',el.id),
        radius, angle, circle, point3,
        pathString, pathString2, node2, node4;
        
    el.rendNode = node;
    
    radius = el.getRadius();  
    angle = el.board.algebra.trueAngle(el.point2, el.midpoint, el.point3);
    circle = {}; // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.midpoint;
    circle.getRadius = function() {
        return radius;
    };
    point3 = el.board.algebra.projectPointToCircle(el.point3,circle);

    pathString = 'M '+ el.point2.coords.scrCoords[1] +' '+ el.point2.coords.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(radius * el.board.stretchX) + ' ' + Math.round(radius * el.board.stretchY) + ' 0 '; // Radien
    // largeArc
    if(angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += point3.scrCoords[1] + ' ' + point3.scrCoords[2]; // Endpunkt
    
    this.updatePathPrimitive(node,pathString,el.board);
    if (el.visProp['strokeColor']!=null) {node.setAttributeNS(null, 'stroke', el.visProp['strokeColor']);}
    if (el.visProp['strokeOpacity']!=null) {node.setAttributeNS(null, 'stroke-opacity', el.visProp['strokeOpacity']);}
    if (el.visProp['strokeWidth']!=null) {node.setAttributeNS(null, 'stroke-width', el.visProp['strokeWidth']);}
    node.setAttributeNS(null, 'fill', 'none');
    this.setDashStyle(el,el.visProp);
    
    this.setShadow(el);

    if(el.visProp['firstArrow']) {
        node2 = this.createArrowHead(el,'Start');
        this.defs.appendChild(node2);
        el.rendNodeTriangleStart = node2;
        node.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'TriangleStart)');
    }
    if(el.visProp['lastArrow']) {
        node2 = this.createArrowHead(el,'End');
        this.defs.appendChild(node2);
        el.rendNodeTriangleEnd = node2;
        node.setAttributeNS(null, 'marker-start', 'url(#'+el.id+'TriangleEnd)');
    }      
    
    // Fuellflaeche
    node4 = this.createPrimitive('path',el.id+'sector');
    el.rendNode2 = node4;
    
    pathString2 = 'M ' + el.midpoint.coords.scrCoords[1] + " " + el.midpoint.coords.scrCoords[2];
    pathString2 += ' L '+ el.point2.coords.scrCoords[1] +' '+ el.point2.coords.scrCoords[2] +' A '; // Startpunkt
    pathString2 += Math.round(radius * el.board.stretchX) + ' ' + Math.round(radius * el.board.stretchY) + ' 0 '; // Radien
    // largeArc
    if(angle >= 180) {
        pathString2 += '1 ';
    }
    else {
        pathString2 += '0 ';
    }
    // sweepFlag
    pathString2 += '0 ';
    pathString2 += point3.scrCoords[1] + ' ' + point3.scrCoords[2];
    pathString2 += ' L ' + el.midpoint.coords.scrCoords[1] + " " + el.midpoint.coords.scrCoords[2]    + ' z'; // Endpunkt
    
    this.updatePathPrimitive(node4,pathString2,el.board);
    if (el.visProp['fillColor']!=null) {node4.setAttributeNS(null, 'fill', el.visProp['fillColor']);}
    if (el.visProp['fillOpacity']!=null) {node4.setAttributeNS(null, 'fill-opacity', el.visProp['fillOpacity']);}     
    node4.setAttributeNS(null, 'stroke', 'none');
    this.setGradient(el);
    
    this.arcs.appendChild(node);

    this.sectors.appendChild(node4);

    if (el.visProp['draft']) {
        this.setDraft(el);
    }
    if(!el.visProp['visible']) {
        el.hideElement();
    }
};

/**
 * Updates properties of an arc that already exists.
 * @param {JXG.Arc} arc Reference to an arc object, that has to be updated.
 * @see JXG.Arc
 * @see #drawArc
 */
JXG.SVGRenderer.prototype.updateArc = function(el) { 
    // brutaler Fix der update-Methode...
    var node;
   
    this.remove(el.rendNode);
    this.remove(el.rendNode2);     
    node = el.rendNodeTriangleStart;
    if (node != null) {
        this.remove(node);
    }
    node = el.rendNodeTriangleEnd;
    if (node != null) {
        this.remove(node);
    }    
    this.drawArc(el);
    return;
};

JXG.SVGRenderer.prototype.drawAngle = function(el) {
    var angle = el.board.algebra.trueAngle(el.point1, el.point2, el.point3),
        circle, projectedP1, projectedP3,
        node, node2, pathString;
    circle = {};  // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.point2;
    circle.getRadius = function() {
        return el.radius;
    };
    projectedP1 = el.board.algebra.projectPointToCircle(el.point1,circle);
    projectedP3 = el.board.algebra.projectPointToCircle(el.point3,circle);

    node = this.createPrimitive('path',el.id+'_1');
    pathString = 'M ' + el.point2.coords.scrCoords[1] + " " + el.point2.coords.scrCoords[2];
    pathString += ' L '+ projectedP1.scrCoords[1] +' '+ projectedP1.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(el.radius * el.board.stretchX) + ' ' + Math.round(el.radius * el.board.stretchY) + ' 0 '; // Radien
    // largeArc
    if (angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += projectedP3.scrCoords[1] + ' ' + projectedP3.scrCoords[2];
    pathString += ' L ' + el.point2.coords.scrCoords[1] + " " + el.point2.coords.scrCoords[2]    + ' z'; // Endpunkt

    node.setAttributeNS(null, 'd', pathString);    
    
    node.setAttributeNS(null, 'fill', el.visProp['fillColor']);
    node.setAttributeNS(null, 'fill-opacity', el.visProp['fillOpacity']);    
    node.setAttributeNS(null, 'stroke', 'none');    
   
    node2 = this.createPrimitive('path',el.id+'_2');
    pathString = 'M '+  projectedP1.scrCoords[1] +' '+  projectedP1.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(el.radius * el.board.stretchX) + ' ' + Math.round(el.radius * el.board.stretchY) + ' 0 '; // Radien
    // largeArc
    if (angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += projectedP3.scrCoords[1] + ' ' + projectedP3.scrCoords[2]; // Endpunkt    

    node2.setAttributeNS(null, 'd', pathString);
    node2.setAttributeNS(null, 'id', el.id+'_2');
    node2.setAttributeNS(null, 'fill', 'none');    
    node2.setAttributeNS(null, 'stroke', el.visProp['strokeColor']);    
    node2.setAttributeNS(null, 'stroke-opacity', el.visProp['strokeOpacity']);

    this.appendChildPrimitive(node,'angles');
    el.rendNode = node;
    this.setShadow(el);    
    this.appendChildPrimitive(node2,'angles');
    el.rendNode2 = node2;
   
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
};

JXG.SVGRenderer.prototype.updateAngle = function(el) {
    /* erstmal nur der brutale Weg... */
    this.remove(el.rendNode);
    this.remove(el.rendNode2);    
    this.drawAngle(el);
    if (!el.visProp['visible']) {
        el.hideElement();
    }
    return;
};

JXG.SVGRenderer.prototype.drawImage = function(el) {
    var imageBase64 = 'data:image/png;base64,' + el.imageBase64String,    
        node = this.createPrimitive('image',el.id);

    node.setAttributeNS(this.xlinkNamespace, 'xlink:href', imageBase64);
    this.appendChildPrimitive(node,el.displayLevel);
    el.rendNode = node;
    this.updateImage(el);
};

JXG.SVGRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode,
        str = node.getAttributeNS(null, 'transform');
        
    str += ' ' + this.joinTransforms(el,t);
    node.setAttributeNS(null, 'transform', str);
};

JXG.SVGRenderer.prototype.joinTransforms = function(el,t) {
    var str = '', i, s,
        len = t.length;
        
    for (i=0;i<len;i++) {
        s = t[i].matrix[1][1]+','+t[i].matrix[2][1]+','+t[i].matrix[1][2]+','+t[i].matrix[2][2]+','+t[i].matrix[1][0]+','+t[i].matrix[2][0];
        str += 'matrix('+s+') ';
    }
    return str;
};
  
JXG.SVGRenderer.prototype.transformImageParent = function(el,m) {
    var s, str;
    if (m!=null) {
        s = m[1][1]+','+m[2][1]+','+m[1][2]+','+m[2][2]+','+m[1][0]+','+m[2][0];
        str = 'matrix('+s+')';
    } else {
        str = '';
    }
    el.rendNode.setAttributeNS(null, 'transform', str);
};
  
JXG.SVGRenderer.prototype.removeGrid = function(board) { 
    var c = this.grid;
    board.hasGrid = false;
    while (c.childNodes.length>0) {
        c.removeChild(c.firstChild);
    }
};
 
JXG.SVGRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    var c, o, node;
    if(opacity == undefined) {
        opacity = 1;
    }
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
    node = el.rendNode;
    if(el.type == JXG.OBJECT_TYPE_TEXT) {
        node.style.color = c; // Schriftfarbe
    }
    else {
        node.setAttributeNS(null, 'stroke', c);
        node.setAttributeNS(null, 'stroke-opacity', o);          
    }
    if(el.type == JXG.OBJECT_TYPE_ARROW) {
         el.rendNodeTriangle.setAttributeNS(null, 'stroke', c);
         el.rendNodeTriangle.setAttributeNS(null, 'stroke-opacity', o);
         el.rendNodeTriangle.setAttributeNS(null, 'fill', c);
         el.rendNodeTriangle.setAttributeNS(null, 'fill-opacity', o);             
    }
    if(el.type == JXG.OBJECT_TYPE_ARC) {
        if(el.visProp['firstArrow']) {
            el.rendNodeTriangleStart.setAttributeNS(null, 'stroke', c);
            el.rendNodeTriangleStart.setAttributeNS(null, 'stroke-opacity', o);                
            el.rendNodeTriangleStart.setAttributeNS(null, 'fill', c);
            el.rendNodeTriangleStart.setAttributeNS(null, 'fill-opacity', o);                    
        }
        if(el.visProp['lastArrow']) {
            el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke', c);
            el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke-opacity', o);                
            el.rendNodeTriangleEnd.setAttributeNS(null, 'fill', c);
            el.rendNodeTriangleEnd.setAttributeNS(null, 'fill-opacity', o);    
        }                
    }     
    else if(el.type == JXG.OBJECT_TYPE_LINE) {
        if(el.visProp['firstArrow']) {
            el.rendNodeTriangleStart.setAttributeNS(null, 'stroke', c);
            el.rendNodeTriangleStart.setAttributeNS(null, 'stroke-opacity', o);                
            el.rendNodeTriangleStart.setAttributeNS(null, 'fill', c);
            el.rendNodeTriangleStart.setAttributeNS(null, 'fill-opacity', o);                    
        }
        if(el.visProp['lastArrow']) {
            el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke', c);
            el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke-opacity', o);                
            el.rendNodeTriangleEnd.setAttributeNS(null, 'fill', c);
            el.rendNodeTriangleEnd.setAttributeNS(null, 'fill-opacity', o);    
        }                
    }
};

JXG.SVGRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    var c, o, node;
    if(opacity==undefined) {
        opacity = 1;
    }
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
        node = el.rendNode2;
        node.setAttributeNS(null, 'fill', c);
        node.setAttributeNS(null, 'fill-opacity', o);        
    }    
    else {
        node = el.rendNode;
        node.setAttributeNS(null, 'fill', c);           
        node.setAttributeNS(null, 'fill-opacity', o);                   
    }
    
    if (el.visProp['gradient']!=null) {
        this.updateGradient(el);
    }
} ;

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.SVGRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    var w, node;
    if (typeof width=='function') {
        w = width();
    } else {
        w = width;
    }
    //w = (w>0)?w:0;
    
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        node;
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode2;
        }
        else {
            node = el.rendNode;
        }
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

JXG.SVGRenderer.prototype.hide = function(el) {
    var node;
    if (el==null) return;
    if(el.type == JXG.OBJECT_TYPE_ARC) {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";         
    }
    else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";         
    }   
    else {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";     
    }
};

JXG.SVGRenderer.prototype.show = function(el) {
    var node;
    if(el.type == JXG.OBJECT_TYPE_ARC) {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit";     
    }
    else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit";         
    }    
    else {
        node = el.rendNode;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
    }
};

JXG.SVGRenderer.prototype.remove = function(shape) {
    if(shape!=null && shape.parentNode != null)
        shape.parentNode.removeChild(shape);
};

JXG.SVGRenderer.prototype.suspendRedraw = function() {
    // It seems to be important for the Linux version of firefox
    if (true) { this.suspendHandle = this.svgRoot.suspendRedraw(10000); }
};

JXG.SVGRenderer.prototype.unsuspendRedraw = function() {
    if (true) { 
        this.svgRoot.unsuspendRedraw(this.suspendHandle);
        this.svgRoot.forceRedraw();
    }
};

JXG.SVGRenderer.prototype.setDashStyle = function(el,visProp) {
    var dashStyle = el.visProp['dash'], node = el.rendNode;
    if(el.visProp['dash'] > 0) {
        node.setAttributeNS(null, 'stroke-dasharray', this.dashArray[dashStyle-1]);
    }
    else {
        if(node.hasAttributeNS(null, 'stroke-dasharray')) {
            node.removeAttributeNS(null, 'stroke-dasharray');
        }
    }    
};

JXG.SVGRenderer.prototype.setGridDash = function(id) {
    var node = document.getElementById(id);
    this.setPropertyPrimitive(node,'stroke-dasharray', '5, 5'); 
};

JXG.SVGRenderer.prototype.createPrimitive = function(type,id) {
    var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
    node.setAttributeNS(null, 'id', id);
    node.style.position = 'absolute';
    if (type=='path') {
        node.setAttributeNS(null, 'stroke-linecap', 'butt');
        node.setAttributeNS(null, 'stroke-linejoin', 'round');
        //node.setAttributeNS(null, 'shape-rendering', 'geometricPrecision'); // 'crispEdges'
    }
    return node;
};

JXG.SVGRenderer.prototype.createArrowHead = function(el,idAppendix) {
    var id = el.id+'Triangle',
        node2, node3;
        
    if (idAppendix!=null) { id += idAppendix; }
    node2 = this.createPrimitive('marker',id);
    node2.setAttributeNS(null, 'viewBox', '0 0 10 6');
    node2.setAttributeNS(null, 'refY', '3');
    node2.setAttributeNS(null, 'markerUnits', 'strokeWidth');
    node2.setAttributeNS(null, 'markerHeight', '6');
    node2.setAttributeNS(null, 'markerWidth', '6');
    node2.setAttributeNS(null, 'orient', 'auto');
    node2.setAttributeNS(null, 'stroke', el.visProp['strokeColor']);
    node2.setAttributeNS(null, 'stroke-opacity', el.visProp['strokeOpacity']);            
    node2.setAttributeNS(null, 'fill', el.visProp['strokeColor']);
    node2.setAttributeNS(null, 'fill-opacity', el.visProp['strokeOpacity']);    
    node3 = this.container.ownerDocument.createElementNS(this.svgNamespace,'path');
    if (idAppendix=='End') {
        node2.setAttributeNS(null, 'refX', '0');
        node3.setAttributeNS(null, 'd', 'M 0 3 L 10 6 L 10 0 z');
    } else {
        node2.setAttributeNS(null, 'refX', '10');
        node3.setAttributeNS(null, 'd', 'M 0 0 L 10 3 L 0 6 z');
    }
    node2.appendChild(node3);
    return node2;
};

JXG.SVGRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    var node2 = this.createArrowHead(el,idAppendix);
    this.defs.appendChild(node2);
    node.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'Triangle)');
    el.rendNodeTriangle = node2;
};

JXG.SVGRenderer.prototype.makeArrows = function(el) {
    var node2;
    if(el.visProp['firstArrow']) {
        node2 = el.rendNodeTriangleStart;
        if(node2 == null) {
            node2 = this.createArrowHead(el,'End');
            this.defs.appendChild(node2);            
            el.rendNodeTriangleStart = node2;
            el.rendNode.setAttributeNS(null, 'marker-start', 'url(#'+el.id+'TriangleEnd)');    
        }    
    }
    else {
        node2 = el.rendNodeTriangleStart;
        if(node2 != null) {
            this.remove(node2);
        }
    }
    if(el.visProp['lastArrow']) {
        node2 = el.rendNodeTriangleEnd;
        if(node2 == null) {
            node2 = this.createArrowHead(el,'Start');
            this.defs.appendChild(node2);            
            el.rendNodeTriangleEnd = node2;
            el.rendNode.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'TriangleStart)'); 
        }    
    }
    else {
        node2 = el.rendNodeTriangleEnd;
        if(node2 != null) {
            this.remove(node2);
        }        
    }
};

JXG.SVGRenderer.prototype.updateLinePrimitive = function(node,p1x,p1y,p2x,p2y) {
    node.setAttributeNS(null, 'x1', p1x);
    node.setAttributeNS(null, 'y1', p1y);
    node.setAttributeNS(null, 'x2', p2x);
    node.setAttributeNS(null, 'y2', p2y);    
};

JXG.SVGRenderer.prototype.updateCirclePrimitive = function(node,x,y,r) {
    node.setAttributeNS(null, 'cx', (x));
    node.setAttributeNS(null, 'cy', (y));
    node.setAttributeNS(null, 'r', (r));
};

JXG.SVGRenderer.prototype.updateEllipsePrimitive = function(node,x,y,rx,ry) {
    node.setAttributeNS(null, 'cx', (x));
    node.setAttributeNS(null, 'cy', (y));
    node.setAttributeNS(null, 'rx', (rx));
    node.setAttributeNS(null, 'ry', (ry));
};

JXG.SVGRenderer.prototype.updateRectPrimitive = function(node,x,y,w,h) {
    node.setAttributeNS(null, 'x', (x));
    node.setAttributeNS(null, 'y', (y));
    node.setAttributeNS(null, 'width', (w));
    node.setAttributeNS(null, 'height', (h));
};

JXG.SVGRenderer.prototype.updatePathPrimitive = function(node, pointString, board) {  // board not necessary in SVG
    /*
    node.setAttributeNS(null, 'stroke-linecap', 'butt');
    node.setAttributeNS(null, 'stroke-linejoin', 'round');
    //node.setAttributeNS(null, 'shape-rendering', 'geometricPrecision');
    //node.setAttributeNS(null, 'shape-rendering', 'crispEdges');
    */
    node.setAttributeNS(null, 'd', pointString);
};

JXG.SVGRenderer.prototype.updatePathStringPrimitive = function(el) {
    var symbm = ' M ',
        symbl = ' L ',
        nextSymb = symbm,
        maxSize = 5000.0,
        pStr = '',
        //h = 3*el.board.canvasHeight,
        //w = 100*el.board.canvasWidth,
        i, scr, 
        isNoPlot = (el.curveType!='plot'),
        //isFunctionGraph = (el.curveType=='functiongraph'),
        len;

    if (el.numberPoints<=0) { return ''; }
    
    if (isNoPlot && el.board.options.curve.RDPsmoothing) {
        el.points = this.RamenDouglasPeuker(el.points,0.5);
    }
    len = Math.min(el.points.length,el.numberPoints);
    for (i=0; i<len; i++) {
        scr = el.points[i].scrCoords;
        //if (isNaN(scr[1]) || isNaN(scr[2]) /*|| Math.abs(scr[1])>w || (isFunctionGraph && (scr[2]>h || scr[2]<-0.5*h))*/ ) {  // PenUp
        if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
            nextSymb = symbm;
        } else {
            // Chrome has problems with values  being too far away.
            if (scr[1]>maxSize) { scr[1] = maxSize; }
            else if (scr[1]<-maxSize) { scr[1] = -maxSize; }
            if (scr[2]>maxSize) { scr[2] = maxSize; }
            else if (scr[2]<-maxSize) { scr[2] = -maxSize; }
            
            pStr += [nextSymb,scr[1],' ',scr[2]].join(''); // Attention: first coordinate may be inaccurate if far way
            nextSymb = symbl;
        }
    }
    return pStr;
};

JXG.SVGRenderer.prototype.updatePathStringPoint = function(el, size, type) {
    var s = '';
    if(type == 'x') {
        s = 'M ' + (el.coords.scrCoords[1]-size) + ' ' + (el.coords.scrCoords[2]-size) + ' L ' + 
        (el.coords.scrCoords[1]+size) + ' ' + (el.coords.scrCoords[2]+size) + ' M ' + 
        (el.coords.scrCoords[1]+size) + ' ' + (el.coords.scrCoords[2]-size) + ' L ' +
        (el.coords.scrCoords[1]-size) + ' ' + (el.coords.scrCoords[2]+size);
    }
    else if(type == '+') {
        s = 'M ' + (el.coords.scrCoords[1]-size) + ' ' + (el.coords.scrCoords[2]) + ' L ' + 
        (el.coords.scrCoords[1]+size) + ' ' + (el.coords.scrCoords[2]) + ' M ' + 
        (el.coords.scrCoords[1]) + ' ' + (el.coords.scrCoords[2]-size) + ' L ' +
        (el.coords.scrCoords[1]) + ' ' + (el.coords.scrCoords[2]+size);    
    }
    return s;
}

JXG.SVGRenderer.prototype.updatePolygonePrimitive = function(node, el) {
    var pStr = '', 
        screenCoords, i,
        len = el.vertices.length;
        
    node.setAttributeNS(null, 'stroke', 'none');
    for(i=0; i<len-1; i++) {
        screenCoords = el.vertices[i].coords.scrCoords;
        pStr = pStr + screenCoords[1] + "," + screenCoords[2];
        if(i<len-2) { pStr += " "; }
    }
    node.setAttributeNS(null, 'points', pStr);
};

JXG.SVGRenderer.prototype.appendChildPrimitive = function(node,level) {
    switch (level) {
        case 'images': this.images.appendChild(node); break;
        case 'grid': this.grid.appendChild(node); break;
        case 'angles': this.angles.appendChild(node); break;
        case 'sectors': this.sectors.appendChild(node); break;
        case 'polygone': this.polygone.appendChild(node); break;
        case 'curves': this.curves.appendChild(node); break; //this.lines.appendChild(node); break;
        case 'circles': this.circles.appendChild(node); break; // this.lines.appendChild(node); break; //
        case 'lines': this.lines.appendChild(node); break;
        case 'arcs': this.arcs.appendChild(node); break;
        case 'points': this.points.appendChild(node); break;
    }
};

JXG.SVGRenderer.prototype.setPropertyPrimitive = function(node,key,val) {
    if (key=='stroked') {
        return;
    }
    node.setAttributeNS(null, key, val);
};

JXG.SVGRenderer.prototype.drawVerticalGrid = function(topLeft, bottomRight, gx, board) {
    var node = this.createPrimitive('path', 'gridx'),
        gridArr = '';
        
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        gridArr += ' M ' + topLeft.scrCoords[1] + ' ' + 0 + ' L ' + topLeft.scrCoords[1] + ' ' + board.canvasHeight+' ';
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);   
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
};

JXG.SVGRenderer.prototype.drawHorizontalGrid = function(topLeft, bottomRight, gy, board) {
    var node = this.createPrimitive('path', 'gridy'),
        gridArr = '';
        
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
        gridArr += ' M ' + 0 + ' ' + topLeft.scrCoords[2] + ' L ' + board.canvasWidth + ' ' + topLeft.scrCoords[2]+' ';
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }
    this.updatePathPrimitive(node, gridArr, board);
    return node;
};

JXG.SVGRenderer.prototype.appendNodesToElement = function(element, type) {
    element.rendNode = document.getElementById(element.id);
};

/*
JXG.SVGRenderer.prototype.cloneSubTree = function(el,id,type) {
    var n = el.rendNode.cloneNode(true);
    n.setAttribute('id', id);
    this.appendChildPrimitive(n,type);
    return n;
};
*/


