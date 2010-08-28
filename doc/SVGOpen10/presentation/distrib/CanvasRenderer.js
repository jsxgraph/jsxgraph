/*
    Copyright 2010
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
    if(typeof xanvas !== 'undefined')
        this.context = xanvas(this.canvasRoot);
    else
        this.context =  this.canvasRoot.getContext('2d');

    this.dashArray = [[2, 2], [5, 5], [10, 10], [20, 20], [20, 10, 10, 10], [20, 5, 10, 5]];
};

JXG.CanvasRenderer.prototype = new JXG.AbstractRenderer;

/*
 * I suggest to use this.fill() and this.stroke() instead of this.updateStencilBuffer() A.W.
 */
JXG.CanvasRenderer.prototype.updateStencilBuffer = function(el) {
    var highlight;

    // this highlight thing doesn't work by now ... :/
    if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
        if (el.visProp.strokeColor!='none') this.context.strokeStyle = el.visProp.highlightStrokeColor;
        if (el.visProp.fillColor!='none') this.context.fillStyle = el.visProp.highlightFillColor;
        this.context.lineWidth = parseFloat(el.visProp.strokeWidth);

        // we  can only set ONE globalAlpha value in here, so we set it to the elements fill-alpha.
        // but we can use the stroke alpha in the other methods by ourselves.
        this.context.globalAlpha = el.visProp.highlightFillOpacity;
        highlight = true;
    } else {
        if (el.visProp.strokeColor!='none') this.context.strokeStyle = el.visProp.strokeColor;
        if (el.visProp.fillColor!='none') this.context.fillStyle = el.visProp.fillColor;
        this.context.lineWidth = parseFloat(el.visProp.strokeWidth);

        // we  can only set ONE globalAlpha value in here, so we set it to the elements fill-alpha.
        // but we can use the stroke alpha in the other methods by ourselves.
        this.context.globalAlpha = el.visProp.fillOpacity;
        highlight = false;
    }

    return highlight;
};

/*
 * Sets color and opacity for filling and stroking
 */
JXG.CanvasRenderer.prototype.setColor = function(el, type) {
    var hasColor = true;
    if (type=='fill') {
        if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
            if (el.visProp.highlightFillColor!='none') {
                this.context.globalAlpha = el.visProp.highlightFillOpacity;
                this.context.fillStyle = el.visProp.highlightFillColor;
            } else {
                hasColor = false;
            }
        } else {
            if (el.visProp.fillColor!='none') {
                this.context.globalAlpha = el.visProp.fillOpacity;
                this.context.fillStyle = el.visProp.fillColor;
            } else {
                hasColor = false;
            }
        }
    } else {
        if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
            if (el.visProp.highlightStrokeColor!='none') {
                this.context.globalAlpha = el.visProp.highlightStrokeOpacity;
                this.context.strokeStyle = el.visProp.highlightStrokeColor;
            } else {
                hasColor = false;
            }
        } else {
            if (el.visProp.strokeColor!='none') {
                this.context.globalAlpha = el.visProp.strokeOpacity;
                this.context.strokeStyle = el.visProp.strokeColor;
            } else {
                hasColor = false;
            }
        }
        this.context.lineWidth = parseFloat(el.visProp.strokeWidth);
    }
    return hasColor;
};

/*
 * Sets color and opacity for filling
 * and does the filling
 */
JXG.CanvasRenderer.prototype.fill = function(el) {
    this.context.save();
    if (this.setColor(el, 'fill')) this.context.fill();
    this.context.restore();
};

/*
 * Sets color and opacity for drawing paths and lines
 * and draws the paths and lines.
 */
JXG.CanvasRenderer.prototype.stroke = function(el) {
    this.context.save();
    if(el.visProp['dash']>0) {
// doesnt work by now
//        this.context.lineDashArray = this.dashArray[el.visProp['dash']-1];
    } else {
        this.context.lineDashArray = [];
    }
    if (this.setColor(el, 'stroke')) this.context.stroke();
    this.context.restore();
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

JXG.CanvasRenderer.prototype.displayCopyright = function(str, fontSize) {
    // this should be called on EVERY update, otherwise it won't be shown after the first update
    this.context.save();
    this.context.font = fontSize+'px Arial';
    this.context.fillStyle = '#aaa';
    this.context.lineWidth = 0.5;
    this.context.fillText(str, 10, 2+fontSize);
    this.context.restore();
};

JXG.CanvasRenderer.prototype.drawInternalText = function(el) {
    //this.updateStencilBuffer(el);
    this.context.save();
    if (this.setColor(el,'stroke')) {
        if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
                this.context.fillStyle = el.visProp.highlightStrokeColor;
        } else {
                this.context.fillStyle = el.visProp.strokeColor;
        }
        this.context.font = el.board.options.text.fontSize+'px Arial';
        this.context.fillText(el.plaintextStr, el.coords.scrCoords[1], el.coords.scrCoords[2]);
    }
    this.context.restore();

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
    //this.context.globalAlpha = axis.visProp[(this.updateStencilBuffer(axis) ? 'highlightS' : 's' ) + 'trokeOpacity'];

    this.context.beginPath();
    for (i=0; i<len; i++) {
        c = axis.ticks[i].scrCoords;
        if (axis.ticks[i].major) {
            if (axis.labels[i].visProp['visible'] /*&& (axis.board.needsFullUpdate || axis.needsRegularUpdate)*/) {
                this.drawText(axis.labels[i]);
            }
            this.context.moveTo(c[1]+dxMaj, c[2]-dyMaj);
            this.context.lineTo(c[1]-dxMaj, c[2]+dyMaj);
        }
        else {
            this.context.moveTo(c[1]+dxMin, c[2]-dyMin);
            this.context.lineTo(c[1]-dxMin, c[2]+dyMin);
        }
    }
    //this.context.stroke();
    this.stroke(axis);
};

JXG.CanvasRenderer.prototype.drawImage = function(el) {
    var updateImage = this.updateImage;
       
    el.rendNode = new Image();
    this.updateImage(el);
};

JXG.CanvasRenderer.prototype.updateImageURL = function(el) {
    var url;
    if (JXG.isFunction(el.url)) {
        url = el.url();
    } else {
        url = el.url;
    }
    if (el.rendNode.src!=url) {
        el.imgIsLoaded = false;
        el.rendNode.src = url;  
        return true;
    } else {
        return false;
    }
};

JXG.CanvasRenderer.prototype.updateImage = function(/** Image */ el) { 
    var ctx = this.context,
        transformParent = this.transformImageParent;
        transform = this.transformImage,
        paintImg = function(){ 
            ctx.save();
            if (el.parent != null) {
                transformParent(el,el.parent.imageTransformMatrix,ctx);
            } else {
                transformParent(el,null,ctx); // Transforms are cleared
            }
            transform(el,el.transformations,ctx);
            ctx.drawImage(el.rendNode, 
                    el.coords.scrCoords[1],
                    el.coords.scrCoords[2]-el.size[1],
                    el.size[0],
                    el.size[1]);
            ctx.restore();
            el.imgIsLoaded = true;
        };  
    
    if (this.updateImageURL(el)) 
        el.rendNode.onload = paintImg;
    else {
        if (el.imgIsLoaded) paintImg();
    }
        
};

JXG.CanvasRenderer.prototype.transformImage = function(el,t,ctx) {
    var tm, i,
        len = t.length;
        
    for (i=0;i<len;i++) {
        tm = t[i].matrix;
        ctx.transform(tm[1][1],tm[2][1],tm[1][2],tm[2][2],tm[1][0],tm[2][0]);
    }
};

JXG.CanvasRenderer.prototype.joinTransforms = function(el,t) {
    // not done yet
    return '';
};

JXG.CanvasRenderer.prototype.transformImageParent = function(el,m,ctx) {
    if (m!=null) 
        ctx.setTransform(m[1][1],m[2][1],m[1][2],m[2][2],m[1][0],m[2][0]);
    else
        ctx.setTransform(1,0,0,1,0,0);
};

JXG.CanvasRenderer.prototype.setArrowAtts = function(node, c, o) {
    // this isn't of any use in a canvas based renderer,
    // because the arrows have to be redrawn on every update.
};

JXG.CanvasRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    // this is not required in a canvas based renderer
    //if (el.board!=JXG.undefined)
    //    el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    // useless
    //el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    // useless
    //el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.hide = function(el) {
    // useless
    //el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.show = function(el) {
    // useless
    //el.board.updateRenderer();
};

JXG.CanvasRenderer.prototype.remove = function(shape) {
    // useless with the exception of HTML texts
    if(shape!=null && shape.parentNode != null)
        shape.parentNode.removeChild(shape);
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

/*
// seems to be unused
JXG.CanvasRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    // we have to draw arrow heads directly in the draw line methods
};
*/

/*
 * _drawFilledPolygon, _translateShape, _rotateShape 
 * are necessary for drawing arrow heads.
 */
JXG.CanvasRenderer.prototype._drawFilledPolygon = function(shape) {
    var i, len = shape.length;
    if (len<=0) return;
    this.context.beginPath();
    this.context.moveTo(shape[0][0],shape[0][1]);
    for(i=0;i<len;i++) {
        if (i > 0) this.context.lineTo(shape[i][0],shape[i][1]);
    }
    this.context.lineTo(shape[0][0],shape[0][1]);
    this.context.fill();
};

JXG.CanvasRenderer.prototype._translateShape = function(shape,x,y) {
    var i, rv = [], len = shape.length;
    if (len<=0) return shape;
    for(i=0;i<len;i++) {
        rv.push([ shape[i][0] + x, shape[i][1] + y ]);
    }
    return rv;
};

JXG.CanvasRenderer.prototype._rotateShape = function(shape,ang) {
    var i, rv = [], len = shape.length;
    if (len<=0) return shape;
    
    for(i=0;i<len;i++) {
        rv.push(this._rotatePoint(ang,shape[i][0],shape[i][1]));
    }
    return rv;
};

JXG.CanvasRenderer.prototype._rotatePoint = function(ang,x,y) {
    return [
        (x * Math.cos(ang)) - (y * Math.sin(ang)),
        (x * Math.sin(ang)) + (y * Math.cos(ang))
    ];
};

JXG.CanvasRenderer.prototype.makeArrows = function(el, scr1, scr2) {
    var ang;
    
    // not done yet for curves and arcs.
    var arrowHead = [
            [ 2, 0 ],
            [ -10, -4 ],
            [ -10, 4]
            ],
        arrowTail = [
            [ -2, 0 ],
            [ 10, -4 ],
            [ 10, 4]
            ],            
        x1, y1, x2, y2, ang;
    
    if (el.visProp['strokeColor']!='none' && (el.visProp['lastArrow']||el.visProp['firstArrow'])) {
        if (el.elementClass==JXG.OBJECT_CLASS_LINE) {
            x1 = scr1.scrCoords[1];
            y1 = scr1.scrCoords[2];
            x2 = scr2.scrCoords[1];
            y2 = scr2.scrCoords[2];
        } else {
            return;
        }
        
        this.context.save();
        if (this.setColor(el,'stroke')) {
            if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
                    this.context.fillStyle = el.visProp.highlightStrokeColor;
            } else {
                    this.context.fillStyle = el.visProp.strokeColor;
            }
            var ang = Math.atan2(y2-y1,x2-x1);
            if (el.visProp['lastArrow']) 
                this._drawFilledPolygon(this._translateShape(this._rotateShape(arrowHead,ang),x2,y2));
            if (el.visProp['firstArrow']) 
                this._drawFilledPolygon(this._translateShape(this._rotateShape(arrowTail,ang),x1,y1));
        }
        this.context.restore();
    }
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

JXG.CanvasRenderer.prototype.updatePathPrim = function(node, pointString, board) { 
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
    //this.context.closePath();
    this.fill(el);
    this.stroke(el);
    return null;
};

JXG.CanvasRenderer.prototype.updatePolygonePrim = function(node, el) {
/*    
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
*/    
};

JXG.CanvasRenderer.prototype.appendChildPrim = function(node,level) {

};

JXG.CanvasRenderer.prototype.setPropertyPrim = function(node,key,val) {
    if (key=='stroked') {
        return;
    }
    //node.setAttributeNS(null, key, val);
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
        stroke05 = parseFloat(el.visProp.strokeWidth)/2.0;

    if (size<=0) return;
    // determine how the point looks like
    switch(f) {
        case 'cross':  // x
        case 'x':
            //this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]-size);
            this.context.lineTo(scr[1]+size, scr[2]+size);
            this.context.moveTo(scr[1]+size, scr[2]-size);
            this.context.lineTo(scr[1]-size, scr[2]+size);
            this.context.closePath();
            this.stroke(el);
        break;
        case 'circle': // dot
        case 'o':
            this.context.beginPath();
            this.context.arc(scr[1], scr[2], size+1+stroke05, 0, 2*Math.PI, false);
            this.context.closePath();
            //this.context.fill();
            this.fill(el);
            this.stroke(el);
        break;
        case 'square':  // rectangle
        case '[]':
            if (size<=0) break;
            this.context.save();
            if (this.setColor(el,'stroke')) {
                if(typeof el.board.highlightedObjects[el.id] != 'undefined' && el.board.highlightedObjects[el.id] != null) {
                    this.context.fillStyle = el.visProp.highlightStrokeColor;
                } else {
                    this.context.fillStyle = el.visProp.strokeColor;
                }
                this.context.fillRect(scr[1]-size-stroke05, scr[2]-size-stroke05, size*2+3*stroke05, size*2+3*stroke05);
            }
            this.context.restore();
            this.context.save();
            this.setColor(el,'fill');
            this.context.fillRect(scr[1]-size+stroke05, scr[2]-size+stroke05, size*2-stroke05, size*2-stroke05);
            this.context.restore();
        break;
        case 'plus':  // +
        case '+':
            //this.context.globalAlpha = el.visProp[(highlight ? 'highlightS' : 's' ) + 'trokeOpacity'];
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1]+size, scr[2]);
            this.context.moveTo(scr[1], scr[2]-size);
            this.context.lineTo(scr[1], scr[2]+size);
            this.context.closePath();
            this.stroke(el);
        break;
        case 'diamond':   // <>
        case '<>':
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1], scr[2]+size);
            this.context.lineTo(scr[1]+size, scr[2]);
            this.context.lineTo(scr[1], scr[2]-size);
            this.context.closePath();
            this.fill(el);
            this.stroke(el);
        break;
        case 'triangleup':
        case 'a':
        case '^':
            this.context.beginPath();
            this.context.moveTo(scr[1], scr[2]-size);
            this.context.lineTo(scr[1]-sqrt32, scr[2]+s05);
            this.context.lineTo(scr[1]+sqrt32, scr[2]+s05);
            this.context.closePath();
            this.fill(el);
            this.stroke(el);
        break;
        case 'triangledown':
        case 'v':
            this.context.beginPath();
            this.context.moveTo(scr[1], scr[2]+size);
            this.context.lineTo(scr[1]-sqrt32, scr[2]-s05);
            this.context.lineTo(scr[1]+sqrt32, scr[2]-s05);
            this.context.closePath();
            this.fill(el);
            this.stroke(el);
        break;
        case 'triangleleft':
        case '<':
            this.context.beginPath();
            this.context.moveTo(scr[1]-size, scr[2]);
            this.context.lineTo(scr[1]+s05, scr[2]-sqrt32);
            this.context.lineTo(scr[1]+s05, scr[2]+sqrt32);
            this.context.closePath();
            this.fill(el);
            this.stroke(el);
        break;
        case 'triangleright':
        case '>':
            this.context.beginPath();
            this.context.moveTo(scr[1]+size, scr[2]);
            this.context.lineTo(scr[1]-s05, scr[2]-sqrt32);
            this.context.lineTo(scr[1]-s05, scr[2]+sqrt32);
            this.context.closePath();
            this.fill(el);
            this.stroke(el);
        break;
    }
};

JXG.CanvasRenderer.prototype.updatePoint = function(el) {
    this.drawPoint(el);
};

JXG.CanvasRenderer.prototype.changePointStyle = function(/** Point */el) {
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
        node.style.fontSize = el.board.options.text.fontSize + 'px';
    } else {
        node = this.drawInternalText(el);
    }
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
    var scr1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
        scr2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
        ax, ay, bx, by, beta, sgn, x, y, m;
    this.calcStraight(el,scr1,scr2);

    this.context.beginPath();
    this.context.moveTo(scr1.scrCoords[1],scr1.scrCoords[2]);
    this.context.lineTo(scr2.scrCoords[1],scr2.scrCoords[2]);
    //this.context.stroke();
    //this.context.closePath();
    this.stroke(el);
    
    // Update the image which is connected to the line:
    if (el.image!=null) {
        ax = scr1.scrCoords[1];
        ay = scr1.scrCoords[2];
        bx = scr2.scrCoords[1];
        by = scr2.scrCoords[2];

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
    this.makeArrows(el,scr1,scr2);
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

    //this.context.globalAlpha = el.visProp[(this.updateStencilBuffer(el) ? 'highlightS' : 's' ) + 'trokeOpacity'];
    if (rX>0.0 && rY>0.0 && !isNaN(m1+m2) ) {
        this.context.beginPath();
        this.context.moveTo(aX, mY);
        this.context.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        this.context.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        this.context.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        this.context.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
        this.context.closePath();
        this.fill(el);
        this.stroke(el);
    }
};

JXG.CanvasRenderer.prototype.drawCircle = function(/** Circle */ el) {
    this.drawEllipse(el, el.midpoint.coords.scrCoords[1], 
                         el.midpoint.coords.scrCoords[2], 
                         el.board.stretchX, el.board.stretchY, 
                         2*el.Radius(), 2*el.Radius());
};

JXG.CanvasRenderer.prototype.updateCircle = function(/** Circle */ el) {
    this.drawCircle(el);
};

JXG.CanvasRenderer.prototype.drawPolygon = function(/** Polygon */ el) { 
};

JXG.CanvasRenderer.prototype.updatePolygonePrim = function(node, el) {
    var pStr = '', 
        scrCoords, i,
        len = el.vertices.length;
        
    if (len<=0) return;
    this.context.beginPath();
    scrCoords = el.vertices[0].coords.scrCoords;
    this.context.moveTo(scrCoords[1],scrCoords[2]);
    for (i=1; i<len; i++) {
            scrCoords = el.vertices[i].coords.scrCoords;
            this.context.lineTo(scrCoords[1],scrCoords[2]);
    }
    this.context.closePath();
    
    this.fill(el);    // The edges of a polygon are displayed separately (as segments).
};

/*
 * Highlighting in CanvasRenderer means we have to render again
 */
JXG.CanvasRenderer.prototype.highlight = function(/** JXG.GeometryElement */ obj) {
    obj.board.prepareUpdate();
    obj.board.renderer.suspendRedraw();
    obj.board.updateRenderer();
    obj.board.renderer.unsuspendRedraw();
    return this;
};

/*
 * Dehighlighting in CanvasRenderer means we have to render again
 */
JXG.CanvasRenderer.prototype.noHighlight = function(/** JXG.GeometryElement */ obj) {
    obj.board.prepareUpdate();
    obj.board.renderer.suspendRedraw();
    obj.board.updateRenderer();
    obj.board.renderer.unsuspendRedraw();
    return this;
};
