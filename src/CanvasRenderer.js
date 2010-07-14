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

JXG.CanvasRenderer = function(container) {
    var i;
    this.constructor();

    this.canvasRoot = null;
    this.suspendHandle = null;
    this.canvasId = JXG.Util.genUUID();
    
    this.canvasNamespace = null;

    this.container = container;
    this.container.style.MozUserSelect = 'none';

    this.container.style.overflow = 'hidden';
    if (this.container.style.position=='') {
        this.container.style.position = 'relative';
    }
    
    //this.canvasRoot = this.container.ownerDocument.createElementNS(this.canvasNamespace, "canvas");
    this.container.innerHTML = '<canvas id="'+this.canvasId+'" width="'+this.container.style.width+'" height="'+this.container.style.height+'"></canvas>';
    //this.canvasRoot.setAttribute('id', 'canvasel');
    //this.canvasRoot.style.overflow = 'hidden';
    //this.canvasRoot.style.width = this.container.style.width;
    //this.canvasRoot.style.height = this.container.style.height;
    //this.container.appendChild(this.canvasRoot);
    this.canvasRoot = document.getElementById(this.canvasId);
    this.context = this.canvasRoot.getContext('2d');
};

JXG.CanvasRenderer.prototype = new JXG.AbstractRenderer;

JXG.CanvasRenderer.prototype.updateStencilBuffer = function(el) {
    var highlight;

    // this highlight thing doesn't work by now ... :/

    if(typeof el.board.highlightedObjects[el] != 'undefined' && el.board.highlightedObjects[el] != null) {
        this.context.strokeStyle = el.visProp.highlightStrokeColor;
        this.context.fillStyle = el.visProp.highlightFillColor;
        this.context.lineWidth = parseFloat(el.visProp.highlightStrokeWidth);

        // we  can only set ONE globalAlpha value in here, so we set it to the elements fill-alpha.
        // but we can use the stroke alpha in the other methods by ourselves.
        this.context.globalAlpha = el.visProp.highlightFillOpacity;
        highlight = true;
    } else {
        this.context.strokeStyle = el.visProp.strokeColor;
        this.context.fillStyle = el.visProp.fillColor;
        this.context.lineWidth = parseFloat(el.visProp.strokeWidth);

        // we  can only set ONE globalAlpha value in here, so we set it to the elements fill-alpha.
        // but we can use the stroke alpha in the other methods by ourselves.
        this.context.globalAlpha = el.visProp.fillOpacity;
        highlight = false;
    }

    return highlight;
};

JXG.CanvasRenderer.prototype.setShadow = function(el) {
    if (el.visPropOld['shadow']==el.visProp['shadow']) {
        return;
    }

    // not implemented yet
    // we simply have to redraw the element
    // probably the best way to do so would be to call el.updateRenderer(), i think.

    el.visPropOld['shadow']=el.visProp['shadow'];
};

JXG.CanvasRenderer.prototype.setGradient = function(el) {
    var fillNode = el.rendNode, col, op,
        node, node2, node3, x1, x2, y1, y2;
    
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

    // not implemented yet. this should be done in the draw methods for the
    // elements and here we just call the updateRenderer of the given element,
    // resp. the JXG.Board.update().

    if(el.visProp['gradient'] == 'linear') {
    }
    else if (el.visProp['gradient'] == 'radial') {
    }
    else {
    }
};

JXG.CanvasRenderer.prototype.updateGradient = function(el) {
    // see drawGradient
}; 

JXG.CanvasRenderer.prototype.displayCopyright = function(str, fontsize) {
    // this should be called on EVERY update, otherwise it won't be shown after the first update
    this.context.save();
    this.context.font = fontsize+'px Arial';
    this.context.fillStyle = '#aaa';
    this.context.lineWidth = 0.5;
    this.context.fillText(str, 10, 2+fontsize);
    this.context.restore();
};

JXG.CanvasRenderer.prototype.drawInternalText = function(el) {
    this.updateStencilBuffer(el);
    
    this.context.font = fontsize+'px Arial';
    this.context.fillText(el.plaintextStr, el.coords.scrCoords[1], el.coords.scrCoords[2]);

    return null;
};

JXG.CanvasRenderer.prototype.updateInternalText = function(/** JXG.Text */ el) {
    this.drawInternalText(el);
};

JXG.CanvasRenderer.prototype.drawTicks = function(axis) {
    // this function is supposed to initialize the svg/vml nodes in the SVG/VMLRenderer.
    // but in canvas there are no such nodes, hence we just do nothing and wait until
    // updateTicks is called.
};

JXG.CanvasRenderer.prototype.updateTicks = function(axis,dxMaj,dyMaj,dxMin,dyMin) {
    var i, c, len = axis.ticks.length;

    this.context.globalAlpha = axis.visProp[(this.updateStencilBuffer(axis) ? 'highlightS' : 's' ) + 'trokeOpacity'];

    this.context.beginPath();
    for (i=0; i<len; i++) {
        c = axis.ticks[i].scrCoords;
        if (axis.ticks[i].major) {
            if (axis.labels[i].visProp['visible']) this.drawText(axis.labels[i]);
            this.context.moveTo(c[1]+dxMaj, c[2]-dyMaj);
            this.context.lineTo(c[1]-dxMaj, c[2]+dyMaj);
        }
        else {
            this.context.moveTo(c[1]+dxMin, c[2]-dyMin);
            this.context.lineTo(c[1]-dxMin, c[2]+dyMin);
        }
    }
    this.context.stroke();
};

JXG.CanvasRenderer.prototype.drawImage = function(el) {
    var url = el.url, //'data:image/png;base64,' + el.imageBase64String,    
        node = this.createPrim('image',el.id);

    node.setAttributeNS(this.xlinkNamespace, 'xlink:href', url);
    node.setAttributeNS(null, 'preserveAspectRatio', 'none');
    this.appendChildPrim(node,el.layer);
    el.rendNode = node;
    this.updateImage(el);
};

JXG.CanvasRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode,
        str = node.getAttributeNS(null, 'transform');
        
    str += ' ' + this.joinTransforms(el,t);
    node.setAttributeNS(null, 'transform', str);
};

JXG.CanvasRenderer.prototype.joinTransforms = function(el,t) {
    // not done yet
    return '';
};

JXG.CanvasRenderer.prototype.transformImageParent = function(el,m) {
    // not done yet
};
  
JXG.CanvasRenderer.prototype.setArrowAtts = function(node, c, o) {
    // this isn't of any use in a canvas based renderer,
    // because the arrows have to be redrawn on every update.
};

JXG.CanvasRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    // this is not required in a canvas based renderer
    el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    // useless
    el.board.updateRenderer();
};

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.CanvasRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    // useless
    el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.hide = function(el) {
    // useless
    el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.show = function(el) {
    // useless
    el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.remove = function(shape) {
    // useless
    el.board.updateRenderer()();
};

JXG.CanvasRenderer.prototype.suspendRedraw = function() {
    this.context.save();
    this.context.clearRect(0, 0, this.canvasRoot.width, this.canvasRoot.height);
    this.displayCopyright(JXG.JSXGraph.licenseText, 12);
};

JXG.CanvasRenderer.prototype.unsuspendRedraw = function() {
    this.context.restore();
};

JXG.CanvasRenderer.prototype.setDashStyle = function(el,visProp) {
    // useless
};

JXG.CanvasRenderer.prototype.setGridDash = function(id) {
    // useless
};

JXG.CanvasRenderer.prototype.createPrim = function(type,id) {
    // <canvas> is not node-based like svg, hence this is useless
};

JXG.CanvasRenderer.prototype.createArrowHead = function(el,idAppendix) {
    // we have to draw arrow heads directly in the draw line methods
};

JXG.CanvasRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    // we have to draw arrow heads directly in the draw line methods
};

JXG.CanvasRenderer.prototype.makeArrows = function(el) {
    // not done yet
    return;

    var node2;
    if (el.visPropOld['firstArrow']==el.visProp['firstArrow'] && el.visPropOld['lastArrow']==el.visProp['lastArrow']) {
        return;
    }
    if(el.visProp['firstArrow']) {
        node2 = el.rendNodeTriangleStart;
        if(node2 == null) {
            node2 = this.createArrowHead(el,'End');
            this.defs.appendChild(node2);            
            el.rendNodeTriangleStart = node2;
            el.rendNode.setAttributeNS(null, 'marker-start', 'url(#'+this.container.id+'_'+el.id+'TriangleEnd)');    
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
            el.rendNode.setAttributeNS(null, 'marker-end', 'url(#'+this.container.id+'_'+el.id+'TriangleStart)'); 
        }    
    }
    else {
        node2 = el.rendNodeTriangleEnd;
        if(node2 != null) {
            this.remove(node2);
        }        
    }
    el.visPropOld['firstArrow'] = el.visProp['firstArrow'];
    el.visPropOld['lastArrow'] = el.visProp['lastArrow'];
};

JXG.CanvasRenderer.prototype.updateLinePrim = function(node,p1x,p1y,p2x,p2y) {
    // not required
};

JXG.CanvasRenderer.prototype.updateCirclePrim = function(node,x,y,r) {
    // not required
};

JXG.CanvasRenderer.prototype.updateEllipsePrim = function(node,x,y,rx,ry) {
    // not required
};

JXG.CanvasRenderer.prototype.updateRectPrim = function(node,x,y,w,h) {
    // not required
};

JXG.CanvasRenderer.prototype.updatePathPrim = function(node, pointString, board) {  // board not necessary in SVG
    // not required
};

JXG.CanvasRenderer.prototype.updatePathStringPrim = function(el) {
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

    this.context.globalAlpha = el.visProp[(this.updateStencilBuffer(el) ? 'highlightS' : 's' ) + 'trokeOpacity'];
    this.context.beginPath();

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
            
            if(nextSymb == 'M')
                this.context.moveTo(scr[1], scr[2]);
            else
                this.context.lineTo(scr[1], scr[2]);
            //pStr += [nextSymb,scr[1],' ',scr[2]].join(''); // Attention: first coordinate may be inaccurate if far way
            nextSymb = symbl;
        }
    }
    this.context.stroke();
    return null;
};

JXG.CanvasRenderer.prototype.updatePolygonePrim = function(node, el) {
    return;
    var pStr = '', 
        scrCoords, i,
        len = el.vertices.length;
        
    node.setAttributeNS(null, 'stroke', 'none');
    for(i=0; i<len-1; i++) {
        scrCoords = el.vertices[i].coords.scrCoords;
        pStr = pStr + scrCoords[1] + "," + scrCoords[2];
        if(i<len-2) { pStr += " "; }
    }
    node.setAttributeNS(null, 'points', pStr);
};

JXG.CanvasRenderer.prototype.appendChildPrim = function(node,level) {

};

JXG.CanvasRenderer.prototype.setPropertyPrim = function(node,key,val) {
    if (key=='stroked') {
        return;
    }
    node.setAttributeNS(null, key, val);
};

JXG.CanvasRenderer.prototype.drawVerticalGrid = function(topLeft, bottomRight, gx, board) {
    var node = this.createPrim('path', 'gridx'),
        gridArr = '';
        
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        gridArr += ' M ' + topLeft.scrCoords[1] + ' ' + 0 + ' L ' + topLeft.scrCoords[1] + ' ' + board.canvasHeight+' ';
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);   
    }
    this.updatePathPrim(node, gridArr, board);
    return node;
};

JXG.CanvasRenderer.prototype.drawHorizontalGrid = function(topLeft, bottomRight, gy, board) {
    var node = this.createPrim('path', 'gridy'),
        gridArr = '';
        
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
        gridArr += ' M ' + 0 + ' ' + topLeft.scrCoords[2] + ' L ' + board.canvasWidth + ' ' + topLeft.scrCoords[2]+' ';
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }
    this.updatePathPrim(node, gridArr, board);
    return node;
};

JXG.CanvasRenderer.prototype.appendNodesToElement = function(element, type) {
    // not used,
};

// we need to overwrite some AbstractRenderer methods which are only useful for vector based renderers
JXG.CanvasRenderer.prototype.drawPoint = function(/** Point */ el) {
    var f = el.visProp['face'],
        size = el.visProp['size'],
        scr = el.coords.scrCoords,
        sqrt32 = size*Math.sqrt(3)*0.5,
        s05 = size*0.5,
        stroke05 = parseFloat(el.visProp.strokeWidth)/2.0,
        highlight = this.updateStencilBuffer(el);

    // determine how the point looks like
    switch(f) {
        case 'cross':  // x
        case 'x':
            this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]-size);
            this.context.lineTo(scr[1]+size, scr[2]+size);
            this.context.moveTo(scr[1]+size, scr[2]-size);
            this.context.lineTo(scr[1]-size, scr[2]+size);
            //this.context.stroke();
        break;
        case 'circle': // dot
        case 'o':
            // draw the circle's stroke
            this.context.save();
            this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.fillStyle = el.visProp.strokeColor;
            this.context.beginPath();
            this.context.arc(scr[1], scr[2], size+1+stroke05, 0, 2*Math.PI, false);
            this.context.fill();

            // draw the circle's fill
            this.context.restore();
            this.context.beginPath();
            this.context.arc(scr[1], scr[2], size-stroke05, 0, 2*Math.PI, false);
            this.context.fill();
        break;
        case 'square':  // rectangle
        case '[]':
            this.context.save();
            this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.fillStyle = el.visProp.strokeColor;
            this.context.fillRect(scr[1]-size-stroke05, scr[2]-size-stroke05, size*2+3*stroke05, size*2+3*stroke05);
            this.context.restore();
            this.context.fillRect(scr[1]-size+stroke05, scr[2]-size+stroke05, size*2-stroke05, size*2-stroke05);
        break;
        case 'plus':  // +
        case '+':
            this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1]+size, scr[2]);
            this.context.moveTo(scr[1], scr[2]-size);
            this.context.lineTo(scr[1], scr[2]+size);
            //this.context.stroke();
        break;
        case 'diamond':   // <>
        case '<>':
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1], scr[2]+size);
            this.context.lineTo(scr[1]+size, scr[2]);
            this.context.lineTo(scr[1], scr[2]-size);
            this.context.closePath();
            this.context.fill();
        break;
        case 'triangleup':
        case 'a':
        case '^':
            this.context.beginPath();
            this.context.moveTo(scr[1], scr[2]-size);
            this.context.lineTo(scr[1]-sqrt32, scr[2]+s05);
            this.context.lineTo(scr[1]+sqrt32, scr[2]+s05);
            this.context.closePath();
            this.context.fill();
        break;
        case 'triangledown':
        case 'v':
            this.context.beginPath();
            this.context.moveTo(scr[1], scr[2]+size);
            this.context.lineTo(scr[1]-sqrt32, scr[2]-s05);
            this.context.lineTo(scr[1]+sqrt32, scr[2]-s05);
            this.context.closePath();
            this.context.fill();
        break;
        case 'triangleleft':
        case '<':
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1]+s05, scr[2]-sqrt32);
            this.context.lineTo(scr[1]+s05, scr[2]+sqrt32);
            this.context.closePath();
            this.context.fill();
        break;
        case 'triangleright':
        case '>':
            this.context.beginPath();
            this.context.moveTo(scr[1]+size, scr[2]);
            this.context.lineTo(scr[1]-s05, scr[2]-sqrt32);
            this.context.lineTo(scr[1]-s05, scr[2]+sqrt32);
            this.context.closePath();
            this.context.fill();
        break;
    }
};

JXG.CanvasRenderer.prototype.updatePoint = function(el) {
    this.drawPoint(el);
};

JXG.AbstractRenderer.prototype.changePointStyle = function(/** Point */el) {
    this.drawPoint(el);
};

JXG.CanvasRenderer.prototype.drawText = function(/** Text */ el) {
    var node;
    if (el.display=='html') {
        node = this.container.ownerDocument.createElement('div');
        node.style.position = 'absolute';
        node.style.color = el.visProp['strokeColor'];
        node.className = 'JXGtext';
        node.style.zIndex = '10';
        this.container.appendChild(node);
        node.setAttribute('id', this.container.id+'_'+el.id);
    } else {
        node = this.drawInternalText(el);
    }
    node.style.fontSize = el.board.options.text.fontSize + 'px';
    el.rendNode = node;
    el.htmlStr = '';
    this.updateText(el);
};

JXG.CanvasRenderer.prototype.updateText = function(/** JXG.Text */ el) {
    // Update only objects that are visible.
    if (el.visProp['visible'] == false) return;
    if (isNaN(el.coords.scrCoords[1]+el.coords.scrCoords[2])) return;
    this.updateTextStyle(el);
    if (el.display=='html') {
        el.rendNode.style.left = (el.coords.scrCoords[1])+'px';
        el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px';
        el.updateText();
        if (el.htmlStr!= el.plaintextStr) {
            el.rendNode.innerHTML = el.plaintextStr;
            if (el.board.options.text.useASCIIMathML) {
                AMprocessNode(el.rendNode,false);
            }
            el.htmlStr = el.plaintextStr;
        }
    } else {
        this.updateInternalText(el);
    }
};

JXG.CanvasRenderer.prototype.drawLine = function(/** Line */ el) {
    var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
        screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
        ax, ay, bx, by, beta, sgn, x, y, m;

    this.calcStraight(el,screenCoords1,screenCoords2);

    this.context.globalAlpha = el.visProp[(this.updateStencilBuffer(el) ? 'highlightS' : 's' ) + 'trokeOpacity'];


    this.context.beginPath();
    this.context.moveTo(screenCoords1.scrCoords[1],screenCoords1.scrCoords[2]);
    this.context.lineTo(screenCoords2.scrCoords[1],screenCoords2.scrCoords[2]);
    this.context.stroke();

    // Update the image which is connected to the line:
    if (el.image!=null) {
        ax = screenCoords1.scrCoords[1];
        ay = screenCoords1.scrCoords[2];
        bx = screenCoords2.scrCoords[1];
        by = screenCoords2.scrCoords[2];

        beta = Math.atan2(by-ay,bx-ax);
        x = 250; //ax;
        y = 256; //ay;//+el.image.size[1]*0.5;
        m = [
                 [1,                                    0,             0],
                 [x*(1-Math.cos(beta))+y*Math.sin(beta),Math.cos(beta),-Math.sin(beta)],
                 [y*(1-Math.cos(beta))-x*Math.sin(beta),Math.sin(beta), Math.cos(beta)]
            ];
        el.imageTransformMatrix = m;
    }

    // if this line has arrows attached, update them, too.
    this.makeArrows(el);
};

JXG.CanvasRenderer.prototype.updateLine = function(/** Line */ el) {
    this.drawLine(el);
};

JXG.CanvasRenderer.prototype.drawCurve = function(/** Curve */ el) {
    this.updatePathStringPrim(el);
};

JXG.CanvasRenderer.prototype.updateCurve = function(/** Curve */ el) {
    this.drawCurve(el);
};

JXG.CanvasRenderer.prototype.drawEllipse = function(el, m1, m2, sX, sY, rX, rY) {
    var aWidth = rX*sX,
        aHeight = rY*sY,
        aX = m1 - aWidth/2,
        aY = m2 - aHeight/2,
        hB = (aWidth / 2) * .5522848,
        vB = (aHeight / 2) * .5522848,
        eX = aX + aWidth,
        eY = aY + aHeight,
        mX = aX + aWidth / 2,
        mY = aY + aHeight / 2;

    this.context.globalAlpha = el.visProp[(this.updateStencilBuffer(el) ? 'highlightS' : 's' ) + 'trokeOpacity'];


    if (rX>0.0 && rY>0.0 && !isNaN(m1+m2) ) {
        this.context.moveTo(aX, mY);
        this.context.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        this.context.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        this.context.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        this.context.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
        this.context.closePath();
        this.context.stroke();
    }
};

JXG.CanvasRenderer.prototype.drawCircle = function(/** Circle */ el) {
    this.drawEllipse(el, el.midpoint.coords.scrCoords[1], el.midpoint.coords.scrCoords[2], el.board.stretchX, el.board.stretchY, 2*el.Radius(), 2*el.Radius());
};

JXG.CanvasRenderer.prototype.updateCircle = function(/** Circle */ el) {
    this.drawCircle(el);
};
