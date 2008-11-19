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
}

JXG.SVGRenderer.prototype = new JXG.AbstractRenderer;

JXG.SVGRenderer.prototype.displayCopyright = function(str,fontsize) {
    var node = this.createPrimitive('text','licenseText');
    node.setAttributeNS(null,'x','20');
    node.setAttributeNS(null,'y',2+fontsize);
    node.setAttributeNS(null, "style", "font-family:Arial,Helvetica,sans-serif; font-size:"+fontsize+"; fill:#356AA0;  opacity:0.3;");
    var t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrimitive(node,'images');
};


JXG.SVGRenderer.prototype.drawAxis = function(el) {  
    var node = this.createPrimitive('line',el.id);
    node.setAttributeNS(null, 'stroke', el.visProp['strokeColor']);
    node.setAttributeNS(null, 'stroke-width', el.visProp['strokeWidth']);
    
    var node2 = this.createArrowHead(el);
    node2.setAttributeNS(null, 'fill', el.visProp['strokeColor']);
    this.defs.appendChild(node2);
    node.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'Triangle)');

    this.lines.appendChild(node);
    el.rendNode = node;
    el.rendNodeTriangle = node2;
    this.updateAxisTicks(el, 0);
    this.updateAxis(el);
}

JXG.SVGRenderer.prototype.updateAxis = function(el) {
    var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, [el.point1.coords.usrCoords[1], el.point1.coords.usrCoords[2]], el.board);
    var screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, [el.point2.coords.usrCoords[1], el.point2.coords.usrCoords[2]], el.board);
    if(el.visProp['straightFirst'] || el.visProp['straightLast']) {
       this.calcStraight(el,screenCoords1,screenCoords2); 
    } 
    var node = $(el.id);
    if (el.point1.coords.scrCoords[1]==el.point2.coords.scrCoords[1]) {
        this.updateLinePrimitive(node,el.board.origin.scrCoords[1],el.board.canvasHeight,el.board.origin.scrCoords[1],0);
    } else {
        this.updateLinePrimitive(node,0,el.board.origin.scrCoords[2],el.board.canvasWidth,el.board.origin.scrCoords[2]);
    }    
    this.setStrokeProp(node,el.visProp);
    this.updateAxisTicksInnerLoop(el,0);
}

JXG.SVGRenderer.prototype.drawArc = function(el) {  
    var node = this.createPrimitive('path',el.id);

    var radius = el.getRadius();  
    var angle = el.board.algebra.trueAngle(el.point2, el.midpoint, el.point3);
    var circle = {}; // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.midpoint;
    circle.getRadius = function() {
        return radius;
    }
    var point3 = el.board.algebra.projectPointToCircle(el.point3,circle);

    var pathString = 'M '+ el.point2.coords.scrCoords[1] +' '+ el.point2.coords.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(radius * el.board.unitX * el.board.zoomX) + ' ' + Math.round(radius * el.board.unitY * el.board.zoomY) + ' 0 '; // Radien
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
    
    this.updatePathPrimitive(node,pathString);
    this.setStrokeProp(node,el.visProp);
    node.setAttributeNS(null, 'fill', 'none');
    this.setDashStyle(node,el.visProp);

    var node2;
    var node3;
    if(el.visProp['firstArrow']) {
        var node2 = this.createArrowHead(el,'Start');
        //this.setFillProp(node2,el.visProp);
        this.defs.appendChild(node2);
        el.rendNodeTriangleStart = node2;
        node.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'TriangleStart)');
    }
    if(el.visProp['lastArrow']) {
        var node2 = this.createArrowHead(el,'End');
        //this.setFillProp(node2,el.visProp);
        this.defs.appendChild(node2);
        el.rendNodeTriangleEnd = node2;
        node.setAttributeNS(null, 'marker-start', 'url(#'+el.id+'TriangleEnd)');
    }      
    
    // Fuellflaeche
    var node4 = this.createPrimitive('path',el.id+'_fill');
    var pathString2 = 'M ' + el.midpoint.coords.scrCoords[1] + " " + el.midpoint.coords.scrCoords[2];
    pathString2 += ' L '+ el.point2.coords.scrCoords[1] +' '+ el.point2.coords.scrCoords[2] +' A '; // Startpunkt
    pathString2 += Math.round(radius * el.board.unitX * el.board.zoomX) + ' ' + Math.round(radius * el.board.unitY * el.board.zoomY) + ' 0 '; // Radien
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
    
    this.updatePathPrimitive(node4,pathString2);
    this.setFillProp(node4,el.visProp);
    node4.setAttributeNS(null, 'stroke', 'none');
    
    this.arcs.appendChild(node);
    el.rendNode = node;
    this.sectors.appendChild(node4);
    el.rendNodeFill = node4;
    this.setDraft(el);
    if(!el.visProp['visible']) {
        el.hideElement();
    }
}

JXG.SVGRenderer.prototype.drawAngle = function(el) {
    var angle = el.board.algebra.trueAngle(el.point1, el.point2, el.point3);
    var circle = {};  // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.point2;
    circle.getRadius = function() {
        return el.radius;
    }
    var projectedP1 = el.board.algebra.projectPointToCircle(el.point1,circle);
    var projectedP3 = el.board.algebra.projectPointToCircle(el.point3,circle);

    var node = this.createPrimitive('path',el.id+'_1');
    var pathString = 'M ' + el.point2.coords.scrCoords[1] + " " + el.point2.coords.scrCoords[2];
    pathString += ' L '+ projectedP1.scrCoords[1] +' '+ projectedP1.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(el.radius * el.board.unitX * el.board.zoomX) + ' ' + Math.round(el.radius * el.board.unitY * el.board.zoomY) + ' 0 '; // Radien
    // largeArc
    if(angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += projectedP3.scrCoords[1] + ' ' + projectedP3.scrCoords[2];
    pathString += ' L ' + el.point2.coords.scrCoords[1] + " " + el.point2.coords.scrCoords[2]    + ' z'; // Endpunkt
    //this.updatePathPrimitive(node,pathString);
    node.setAttributeNS(null, 'd', pathString);    
    
    node.setAttributeNS(null, 'fill', el.visProp['fillColor']);
    node.setAttributeNS(null, 'fill-opacity', el.visProp['fillOpacity']);    
    node.setAttributeNS(null, 'stroke', 'none');    
   
    var node2 = this.createPrimitive('path',el.id+'_2');
    var pathString = 'M '+  projectedP1.scrCoords[1] +' '+  projectedP1.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(el.radius * el.board.unitX * el.board.zoomX) + ' ' + Math.round(el.radius * el.board.unitY * el.board.zoomY) + ' 0 '; // Radien
    // largeArc
    if(angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += projectedP3.scrCoords[1] + ' ' + projectedP3.scrCoords[2]; // Endpunkt    

    //this.updatePathPrimitive(node2,pathString);
    node2.setAttributeNS(null, 'd', pathString);
    node2.setAttributeNS(null, 'id', el.id+'_2');
    node2.setAttributeNS(null, 'fill', 'none');    
    node2.setAttributeNS(null, 'stroke', el.visProp['strokeColor']);    
    node2.setAttributeNS(null, 'stroke-opacity', el.visProp['strokeOpacity']);


    this.appendChildPrimitive(node,'angles');
    el.rendNode1 = node;
    this.appendChildPrimitive(node2,'angles');
    el.rendNode2 = node2;
    //   this.setDraft(el);
    
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
}

JXG.SVGRenderer.prototype.updateAngle = function(el) {
    /* erstmal nur der brutale Weg... */
    this.remove(el.rendNode1);
    this.remove(el.rendNode2);    
    this.drawAngle(el);
    if(!el.visProp['visible']) {
        el.hideElement();
    }
    return;
};

JXG.SVGRenderer.prototype.drawImage = function(el) {
    var imageBase64 = 'data:image/png;base64,' + el.imageBase64String;    
    var node = this.createPrimitive('image',el.id);

    node.setAttributeNS(this.xlinkNamespace, 'xlink:href', imageBase64);
    this.appendChildPrimitive(node,el.displayLevel);
    el.rendNode = node;
    this.updateImage(el);
}

JXG.SVGRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode;
    var str = node.getAttributeNS(null, 'transform');
    str += ' ' + this.joinTransforms(el,t);
    node.setAttributeNS(null, 'transform', str);
}

JXG.SVGRenderer.prototype.joinTransforms = function(el,t) {
    var str = '';
    for (var i=0;i<t.length;i++) {
        var s = t[i].matrix[1][1]+','+t[i].matrix[2][1]+','+t[i].matrix[1][2]+','+t[i].matrix[2][2]+','+t[i].matrix[1][0]+','+t[i].matrix[2][0];
        str += 'matrix('+s+') ';
    }
    return str;
}
  
JXG.SVGRenderer.prototype.transformImageParent = function(el,m) {
    if (m!=null) {
        var s = m[1][1]+','+m[2][1]+','+m[1][2]+','+m[2][2]+','+m[1][0]+','+m[2][0];
        var str = 'matrix('+s+')';
    } else {
        var str = '';
    }
    el.rendNode.setAttributeNS(null, 'transform', str);
}
  
JXG.SVGRenderer.prototype.removeGrid = function(board) { 
    board.hasGrid = false;
    var c = this.grid;
    while (c.childNodes.length>0) {
        c.removeChild(c.firstChild);
    }
}

JXG.SVGRenderer.prototype.setObjectDash = function(el) {
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) { // Punkte haben keine dash-Eigenschaft
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode2;
        }
        else {
            node = el.rendNode;
        }
        if(el.visProp['dash'] > 0) {
            var dashStyle = el.visProp['dash'];
            node.setAttributeNS(null, 'stroke-dasharray', this.dashArray[dashStyle-1]);
        }
        else {
            if(node.hasAttributeNS(null, 'stroke-dasharray')) {
                node.removeAttributeNS(null, 'stroke-dasharray');
            }
        }
    }
}
 
JXG.SVGRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    if(opacity == undefined) {
        opacity = 1;
    }
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
        var node = el.rendNode;
        if(el.type == JXG.OBJECT_TYPE_TEXT) {
            node.style.color = c;
        }
        else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode2;
            node.setAttributeNS(null, 'stroke', c);
            node.setAttributeNS(null, 'stroke-opacity', o);            
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
            if(!el.visProp['straightFirst'] && el.visProp['firstArrow']) {
                el.rendNodeTriangleStart.setAttributeNS(null, 'stroke', c);
                el.rendNodeTriangleStart.setAttributeNS(null, 'stroke-opacity', o);                
                el.rendNodeTriangleStart.setAttributeNS(null, 'fill', c);
                el.rendNodeTriangleStart.setAttributeNS(null, 'fill-opacity', o);                    
            }
            if(!el.visProp['straightLast'] && el.visProp['lastArrow']) {
                el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke', c);
                el.rendNodeTriangleEnd.setAttributeNS(null, 'stroke-opacity', o);                
                el.rendNodeTriangleEnd.setAttributeNS(null, 'fill', c);
                el.rendNodeTriangleEnd.setAttributeNS(null, 'fill-opacity', o);    
            }                
        }         
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttributeNS(null, 'stroke', c);      
            node.setAttributeNS(null, 'stroke-opacity', o);              
        }
        else {
            var node = el.rendNodeX1;
            node.setAttributeNS(null, 'stroke', c);   
            node.setAttributeNS(null, 'stroke-opacity', o);             
            node = el.rendNodeX2;
            node.setAttributeNS(null, 'stroke', c);
            node.setAttributeNS(null, 'stroke-opacity', o);             
        }
    } 
};

JXG.SVGRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    if(opacity==undefined) {
        opacity = 1;
    }
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
            var node = el.rendNodeFill;
            node.setAttributeNS(null, 'fill', c);
            node.setAttributeNS(null, 'fill-opacity', o);        
        }
        else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode1;
            node.setAttributeNS(null, 'fill', c);
            node.setAttributeNS(null, 'fill-opacity', o);            
        }        
        else {
            var node = el.rendNode;
            node.setAttributeNS(null, 'fill', c);
            node.setAttributeNS(null, 'fill-opacity', o);                
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttributeNS(null, 'fill', c); 
            node.setAttributeNS(null, 'fill-opacity', o);
        }
        else {
            var node = el.rendNodeX1;
            node.setAttributeNS(null, 'fill', c);
            node.setAttributeNS(null, 'fill-opacity', o);    
            node = el.rendNodeX2;
            node.setAttributeNS(null, 'fill', c); 
            node.setAttributeNS(null, 'fill-opacity', o);                
        }
    }
} ;

JXG.SVGRenderer.prototype.hide = function(el) {
    if(JXG.IsPoint(el)) {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttributeNS(null, 'display', 'none');
            node.style.visibility = "hidden";    
        }
        else {
            var node = el.rendNodeX1;
            node.setAttributeNS(null, 'display', 'none');
            node.style.visibility = "hidden";  
            node = el.rendNodeX2;
            node.setAttributeNS(null, 'display', 'none');
            node.style.visibility = "hidden";        
        }
    }
    else if(el.type == JXG.OBJECT_TYPE_ARC) {
        var node = el.rendNode;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden"; 
        node = el.rendNodeFill;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";         
    }
    else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
        var node = el.rendNode1;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";         
    }    
    else {
        var node = el.rendNode;
        node.setAttributeNS(null, 'display', 'none');
        node.style.visibility = "hidden";  
    }
}

JXG.SVGRenderer.prototype.show = function(el) {
    if(JXG.IsPoint(el)) {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            node.setAttributeNS(null, 'display', 'inline');
            node.style.visibility = "inherit"; 
        }
        else {
            var node = el.rendNodeX1;
            node.setAttributeNS(null, 'display', 'inline');
            node.style.visibility = "inherit"; 
            node = el.rendNodeX2;
            node.setAttributeNS(null, 'display', 'inline');
            node.style.visibility = "inherit";    
        }
    }
    else if(el.type == JXG.OBJECT_TYPE_ARC) {
        var node = el.rendNode;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
        node = el.rendNodeFill;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit";     
    }
    else if(el.type == JXG.OBJECT_TYPE_ANGLE) {
        var node = el.rendNode1;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
        node = el.rendNode2;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit";         
    }    
    else {
        var node = el.rendNode;
        node.setAttributeNS(null, 'display', 'inline');
        node.style.visibility = "inherit"; 
    }
}

JXG.SVGRenderer.prototype.remove = function(shape) {
    shape.parentNode.removeChild(shape);
}

JXG.SVGRenderer.prototype.suspendRedraw = function() {
    // It seems to be important for the Linux version of firefox
    if (true) { this.suspendHandle = this.svgRoot.suspendRedraw(10000); }
}

JXG.SVGRenderer.prototype.unsuspendRedraw = function() {
    //try {
        if (true) { 
            this.svgRoot.unsuspendRedraw(this.suspendHandle);
            this.svgRoot.forceRedraw();
        }
    //} catch(e) {
        //alert('Unsuspend not working!');
    //}
}

JXG.SVGRenderer.prototype.setStrokeProp = function(node,visProp) {
    if (visProp['strokeColor']!=null) {node.setAttributeNS(null, 'stroke', visProp['strokeColor']);}
    if (visProp['strokeOpacity']!=null) {node.setAttributeNS(null, 'stroke-opacity', visProp['strokeOpacity']);}
    if (visProp['strokeWidth']!=null) {node.setAttributeNS(null, 'stroke-width', visProp['strokeWidth']);}
    //node.setAttributeNS(null, 'opacity', '0.3');    
}

JXG.SVGRenderer.prototype.setFillProp = function(node,visProp) {
    if (visProp['fillColor']!=null) {node.setAttributeNS(null, 'fill', visProp['fillColor']);}
    if (visProp['fillOpacity']!=null) {node.setAttributeNS(null, 'fill-opacity', visProp['fillOpacity']);}     
    //node.setAttributeNS(null, 'opacity', '0.3');    
}


JXG.SVGRenderer.prototype.setDashStyle = function(node,visProp) {
    if(visProp['dash'] > 0) {
        var dashStyle = visProp['dash'];
        node.setAttributeNS(null, 'stroke-dasharray', this.dashArray[dashStyle-1]);
    }
}


JXG.SVGRenderer.prototype.createPrimitive = function(type,id) {
    var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
    node.setAttributeNS(null, 'id', id);
    node.style.position = 'absolute';
    return node;
}

JXG.SVGRenderer.prototype.createArrowHead = function(el,idAppendix) {
    var id = el.id+'Triangle';
    if (idAppendix!=null) { id += idAppendix; }
    var node2 = this.createPrimitive('marker',id);
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
    var node3 = this.container.ownerDocument.createElementNS(this.svgNamespace,'path');
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
    if(el.visProp['firstArrow']) {
        var node2 = el.rendNodeTriangleStart;
        if(node2 == null) {
            node2 = this.createArrowHead(el,'End');
            this.defs.appendChild(node2);            
            el.rendNodeTriangleStart = node2;
            el.rendNode.setAttributeNS(null, 'marker-start', 'url(#'+el.id+'TriangleEnd)');    
        }    
    }
    else {
        var node2 = el.rendNodeTriangleStart;
        if(node2 != null) {
            this.remove(node2);
        }
    }
    if(el.visProp['lastArrow']) {
        var node2 = el.rendNodeTriangleEnd;
        if(node2 == null) {
            node2 = this.createArrowHead(el,'Start');
            this.defs.appendChild(node2);            
            el.rendNodeTriangleEnd = node2;
            el.rendNode.setAttributeNS(null, 'marker-end', 'url(#'+el.id+'TriangleStart)'); 
        }    
    }
    else {
        var node2 = el.rendNodeTriangleEnd;
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

JXG.SVGRenderer.prototype.updatePathPrimitive = function(node,pointString) {
    node.setAttributeNS(null, 'd', pointString);
    node.setAttributeNS(null, 'stroke-linecap', 'round');
    node.setAttributeNS(null, 'stroke-linejoin', 'round');
};

JXG.SVGRenderer.prototype.updatePathStringPrimitive = function(el) {
    if (el.numberPoints<=0) { return ''; }
    var j = 0;
    var screenCoords = el.points[j].scrCoords;
    while ((isNaN(screenCoords[1]) || isNaN(screenCoords[2])) && (j<el.numberPoints-1)) {
        j++;
        screenCoords = el.points[j].scrCoords;
    }
    if (j>=el.numberPoints) { return ''; }
    var pStr = 'M ' + screenCoords[1] + ' ' + screenCoords[2];

    for (var i=j+1; i<el.numberPoints; i++) {
        var screenCoords = el.points[i].scrCoords;
        if (!isNaN(screenCoords[1]) && !isNaN(screenCoords[2])) {
            pStr += ' L '+ screenCoords[1] + ' ' + screenCoords[2];
        }
    }
//$('debug').innerHTML = pStr;
    return pStr;
};

JXG.SVGRenderer.prototype.updatePolygonePrimitive = function(node,pointString) {
    node.setAttributeNS(null, 'points', pointString);
};

JXG.SVGRenderer.prototype.appendChildPrimitive = function(node,level) {
    switch (level) {
        case 'images': this.images.appendChild(node); break;
        case 'grid': this.grid.appendChild(node); break;
        case 'angles': this.angles.appendChild(node); break;
        case 'sectors': this.sectors.appendChild(node); break;
        case 'polygone': this.polygone.appendChild(node); break;
        case 'curves': this.curves.appendChild(node); break;
        case 'circles': this.circles.appendChild(node); break;
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

