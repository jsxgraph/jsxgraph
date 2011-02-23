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

/**
 * Uses SVG to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
 * @class JXG.AbstractRenderer
 * @augments JXG.AbstractRenderer
 * @param {HTMLNode} container Reference to a DOM node containing the board.
 * @see JXG.AbstractRenderer
 */
JXG.SVGRenderer = function(container) {
    var i;

    this.type = 'svg';

    /**
     * SVG root node
     * @type SVGAnimatedString
     * @private
     */
    this.svgRoot = null;

    /**
     * @private
     */
    this.suspendHandle = null;

    /**
     * The SVG Namespace used in JSXGraph.
     * @see http://www.w3.org/TR/SVG/
     * @type String
     * @default http://www.w3.org/2000/svg
     */
    this.svgNamespace = 'http://www.w3.org/2000/svg';

    /**
     * The xlink namespace. This is used for images.
     * @see http://www.w3.org/TR/xlink/
     * @type String
     * @default http://www.w3.org/1999/xlink
     */
    this.xlinkNamespace ='http://www.w3.org/1999/xlink';

    // container is documented in AbstractRenderer
    this.container = container;

    // prepare the div container and the svg root node for use with JSXGraph
    this.container.style.MozUserSelect = 'none';

    this.container.style.overflow = 'hidden';
    if (this.container.style.position=='') {
        this.container.style.position = 'relative';
    }

    this.svgRoot = this.container.ownerDocument.createElementNS(this.svgNamespace, "svg");
    this.svgRoot.style.overflow = 'hidden';
    this.svgRoot.style.width = this.container.style.width;
    this.svgRoot.style.height = this.container.style.height;
    this.container.appendChild(this.svgRoot);

    this.defs = this.container.ownerDocument.createElementNS(this.svgNamespace,'defs');
    this.svgRoot.appendChild(this.defs);
    this.filter = this.container.ownerDocument.createElementNS(this.svgNamespace,'filter');
    this.filter.setAttributeNS(null, 'id', this.container.id+'_'+'f1');
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
    
    /**
     * JSXGraph uses a layer system to sort the elements on the board. This puts certain types of elements in front
     * of other types of elements. For the order used see {@link JXG.Options.layer}. The number of layers is documented
     * there, too. The higher the number, the "more on top" are the elements on this layer.
     * @type Array
     */
    this.layer = [];
    for (i=0;i<JXG.Options.layer.numlayers;i++) {
        this.layer[i] = this.container.ownerDocument.createElementNS(this.svgNamespace,'g');
        this.svgRoot.appendChild(this.layer[i]);
    }

    /**
     * Defines dash patterns. Defined styles are: <ol>
     * <li value="-1"> 2px dash, 2px space</li>
     * <li> 5px dash, 5px space</li>
     * <li> 10px dash, 10px space</li>
     * <li> 20px dash, 20px space</li>
     * <li> 20px dash, 10px space, 10px dash, 10px dash</li>
     * <li> 20px dash, 5px space, 10px dash, 5px space</li></ol>
     * @type Array
     * @default ['2, 2', '5, 5', '10, 10', '20, 20', '20, 10, 10, 10', '20, 5, 10, 5']
     * @see http://www.w3.org/TR/SVG/painting.html#StrokeProperties
     */
    this.dashArray = ['2, 2', '5, 5', '10, 10', '20, 20', '20, 10, 10, 10', '20, 5, 10, 5'];
};

JXG.SVGRenderer.prototype = new JXG.AbstractRenderer();

JXG.extend(JXG.SVGRenderer, /** @lends JXG.SVGRenderer.prototype */ {
    
    setShadow: function(el) {
        if (el.visPropOld['shadow'] === el.visProp['shadow']) {
            return;
        }

        if(el.rendNode != null) {
            if(el.visProp['shadow']) {
                el.rendNode.setAttributeNS(null,'filter','url(#'+this.container.id+'_'+'f1)');
            }
            else {
                el.rendNode.removeAttributeNS(null,'filter');
            }
        }
        el.visPropOld['shadow'] = el.visProp['shadow'];
    },

    setGradient: function(el) {
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

        if(el.visProp['gradient'] == 'linear') {
            node = this.createPrim('linearGradient', el.id+'_gradient');
            x1 = '0%'; // TODO: get x1,x2,y1,y2 from el.visProp['angle']
            x2 = '100%';
            y1 = '0%';
            y2 = '0%'; //means 270 degrees

            node.setAttributeNS(null,'x1',x1);
            node.setAttributeNS(null,'x2',x2);
            node.setAttributeNS(null,'y1',y1);
            node.setAttributeNS(null,'y2',y2);
            node2 = this.createPrim('stop',el.id+'_gradient1');
            node2.setAttributeNS(null,'offset','0%');
            node2.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);
            node3 = this.createPrim('stop',el.id+'_gradient2');
            node3.setAttributeNS(null,'offset','100%');
            node3.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
            node.appendChild(node2);
            node.appendChild(node3);
            this.defs.appendChild(node);
            fillNode.setAttributeNS(null, 'style', 'fill:url(#'+this.container.id+'_'+el.id+'_gradient)');
            el.gradNode1 = node2;
            el.gradNode2 = node3;
        }
        else if (el.visProp['gradient'] == 'radial') {
            node = this.createPrim('radialGradient',el.id+'_gradient');

            node.setAttributeNS(null, 'cx', '50%');
            node.setAttributeNS(null, 'cy', '50%');
            node.setAttributeNS(null, 'r', '50%');
            node.setAttributeNS(null, 'fx', el.visProp['gradientPositionX']*100+'%');
            node.setAttributeNS(null, 'fy', el.visProp['gradientPositionY']*100+'%');

            node2 = this.createPrim('stop',el.id+'_gradient1');
            node2.setAttributeNS(null,'offset','0%');
            node2.setAttributeNS(null,'style','stop-color:'+el.visProp['gradientSecondColor']+';stop-opacity:'+el.visProp['gradientSecondOpacity']);
            node3 = this.createPrim('stop',el.id+'_gradient2');
            node3.setAttributeNS(null,'offset','100%');
            node3.setAttributeNS(null,'style','stop-color:'+col+';stop-opacity:'+op);

            node.appendChild(node2);
            node.appendChild(node3);
            this.defs.appendChild(node);
            fillNode.setAttributeNS(null, 'style', 'fill:url(#'+this.container.id+'_'+el.id+'_gradient)');
            el.gradNode1 = node2;
            el.gradNode2 = node3;
        }
        else {
            fillNode.removeAttributeNS(null,'style');
        }
    },

    updateGradient: function(el) {
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
    },

    // already documented in JXG.AbstractRenderer
    displayCopyright: function(str, fontsize) {
        var node = this.createPrim('text','licenseText'),
            t;
        node.setAttributeNS(null,'x','20');
        node.setAttributeNS(null,'y',2+fontsize);
        node.setAttributeNS(null, "style", "font-family:Arial,Helvetica,sans-serif; font-size:"+fontsize+"px; fill:#356AA0;  opacity:0.3;");
        t = document.createTextNode(str);
        node.appendChild(t);
        this.appendChildPrim(node,0);
    },

    drawInternalText: function(el) {
        var node = this.createPrim('text',el.id);

        node.setAttributeNS(null, "class", "JXGtext");
        node.setAttributeNS(null, "style", "'alignment-baseline:middle;");
        el.rendNodeText = document.createTextNode('');
        node.appendChild(el.rendNodeText);
        this.appendChildPrim(node,9);

        return node;
    },

    updateInternalText: function(/** JXG.Text */ el) {
        el.rendNode.setAttributeNS(null, 'x', (el.coords.scrCoords[1])+'px');
        el.rendNode.setAttributeNS(null, 'y', (el.coords.scrCoords[2])+'px');
        el.updateText();
        if (el.htmlStr!= el.plaintextStr) {
            el.rendNodeText.data = el.plaintextStr;
            el.htmlStr = el.plaintextStr;
        }
        this.transformImage(el, el.transformations);
    },

    drawTicks: function(axis) {
        var node = this.createPrim('path', axis.id);

        this.appendChildPrim(node,axis.layer);
        this.appendNodesToElement(axis,'path');
    },

    /**
     * TEST
     * @param axis
     * @param dxMaj
     * @param dyMaj
     * @param dxMin
     * @param dyMin
     */
    updateTicks: function(axis,dxMaj,dyMaj,dxMin,dyMin) {
        var tickStr = "",
            i, c, node,
            len = axis.ticks.length;

        for (i=0; i<len; i++) {
            c = axis.ticks[i].scrCoords;
            if (axis.ticks[i].major) {
                if ((axis.board.needsFullUpdate||axis.needsRegularUpdate) && axis.labels[i].visProp['visible']) {
                    this.drawText(axis.labels[i]);
                }
                tickStr += "M " + (c[1]+dxMaj) + " " + (c[2]-dyMaj) + " L " + (c[1]-dxMaj) + " " + (c[2]+dyMaj) + " ";
            }
            else
                tickStr += "M " + (c[1]+dxMin) + " " + (c[2]-dyMin) + " L " + (c[1]-dxMin) + " " + (c[2]+dyMin) + " ";

        }

        node = this.getElementById(axis.id);
        if(node == null) {
            node = this.createPrim('path', axis.id);
            //node.setAttributeNS(null, 'shape-rendering', 'crispEdges');
            this.appendChildPrim(node,axis.layer);
            this.appendNodesToElement(axis,'path');
        }
        node.setAttributeNS(null, 'stroke', axis.visProp['strokeColor']);
        node.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
        node.setAttributeNS(null, 'stroke-width', axis.visProp['strokeWidth']);
        this.updatePathPrim(node, tickStr, axis.board);
    },

    drawImage: function(el) {
        var node = this.createPrim('image',el.id);

        node.setAttributeNS(null, 'preserveAspectRatio', 'none');
        this.appendChildPrim(node,el.layer);
        el.rendNode = node;

        this.updateImage(el);
    },

    updateImageURL: function(el) {
        var url;
        if (JXG.isFunction(el.url)) {
            url = el.url();
        } else {
            url = el.url;
        }
        el.rendNode.setAttributeNS(this.xlinkNamespace, 'xlink:href', url);
    },

    transformImage: function(el,t) {
        var node = el.rendNode, m,
            str = "",
            s, len = t.length;

        if (len>0) {
            m = this.joinTransforms(el,t);
            s = m[1][1]+','+m[2][1]+','+m[1][2]+','+m[2][2]+','+m[1][0]+','+m[2][0];
            str += ' matrix('+s+') ';
            node.setAttributeNS(null, 'transform', str);
        }
    },

    setArrowAtts: function(node, c, o) {
        if (!node) return;
        node.setAttributeNS(null, 'stroke', c);
        node.setAttributeNS(null, 'stroke-opacity', o);
        node.setAttributeNS(null, 'fill', c);
        node.setAttributeNS(null, 'fill-opacity', o);
    },

    setObjectStrokeColor: function(el, color, opacity) {
        var c = this.evaluate(color),
            o = this.evaluate(opacity),
            node;

        o = (o>0)?o:0;

        if (el.visPropOld['strokeColor']==c && el.visPropOld['strokeOpacity']==o) {
            return;
        }
        node = el.rendNode;
        if(el.type == JXG.OBJECT_TYPE_TEXT) {
            if (el.display=='html') {
                node.style.color = c; // Schriftfarbe
            } else {
                node.setAttributeNS(null, "style", "fill:"+ c);
            }
        }
        else {
            node.setAttributeNS(null, 'stroke', c);
            node.setAttributeNS(null, 'stroke-opacity', o);
        }
        if(el.type == JXG.OBJECT_TYPE_ARROW) {
            this.setArrowAtts(el.rendNodeTriangle,c,o);
        } else if (el.elementClass == JXG.OBJECT_CLASS_CURVE || el.elementClass == JXG.OBJECT_CLASS_LINE) {
            if(el.visProp['firstArrow']) {
                this.setArrowAtts(el.rendNodeTriangleStart,c,o);
            }
            if(el.visProp['lastArrow']) {
                this.setArrowAtts(el.rendNodeTriangleEnd,c,o);
            }
        }
        el.visPropOld['strokeColor'] = c;
        el.visPropOld['strokeOpacity'] = o;
    },

    setObjectFillColor: function(el, color, opacity) {
        var node, c = this.evaluate(color),
            o = this.evaluate(opacity);

        o = (o>0)?o:0;

        if (el.visPropOld['fillColor']==c && el.visPropOld['fillOpacity']==o) {
            return;
        }
        node = el.rendNode;
        node.setAttributeNS(null, 'fill', c);
        if (el.type==JXG.OBJECT_TYPE_IMAGE) {
            node.setAttributeNS(null, 'opacity', o);
        } else {
            node.setAttributeNS(null, 'fill-opacity', o);
        }

        if (el.visProp['gradient']!=null) {
            this.updateGradient(el);
        }
        el.visPropOld['fillColor'] = c;
        el.visPropOld['fillOpacity'] = o;
    },

    /**
     * Sets an elements stroke width.
     * @param {Object} el Reference to the geometry element.
     * @param {int} width The new stroke width to be assigned to the element.
     */
    setObjectStrokeWidth: function(el, width) {
        var w = this.evaluate(width),
            node;
        //w = (w>0)?w:0;
        try {
            if (el.visPropOld['strokeWidth']==w) {
                return;
            }
        } catch (e){
            //alert(el.id);
        }

        node = el.rendNode;
        this.setPropertyPrim(node,'stroked', 'true');
        if (w!=null) {
            this.setPropertyPrim(node,'stroke-width',w);
        }
        el.visPropOld['strokeWidth'] = w;
    },

    hide: function(el) {
        var node;

        if (!JXG.exists(el))
            return;
        node = el.rendNode;
        if(JXG.exists(node)) {
            node.setAttributeNS(null, 'display', 'none');
            node.style.visibility = "hidden";
        }
    },

    show: function(el) {
        var node;

        if (!JXG.exists(el))
            return;
        node = el.rendNode;
        if(JXG.exists(node)) {
            node.setAttributeNS(null, 'display', 'inline');
            node.style.visibility = "inherit";
        }
    },

    remove: function(shape) {
        if(shape!=null && shape.parentNode != null)
            shape.parentNode.removeChild(shape);
    },

    suspendRedraw: function() {
        // It seems to be important for the Linux version of firefox
        this.suspendHandle = this.svgRoot.suspendRedraw(10000);
    },

    unsuspendRedraw: function() {
        this.svgRoot.unsuspendRedraw(this.suspendHandle);
        this.svgRoot.forceRedraw();
    },

    setDashStyle: function(el,visProp) {
        var dashStyle = el.visProp['dash'], node = el.rendNode;
        if(el.visProp['dash'] > 0) {
            node.setAttributeNS(null, 'stroke-dasharray', this.dashArray[dashStyle-1]);
        } else {
            if(node.hasAttributeNS(null, 'stroke-dasharray')) {
                node.removeAttributeNS(null, 'stroke-dasharray');
            }
        }
    },

    setGridDash: function(id) {
        var node = this.getElementById(id);
        this.setPropertyPrim(node,'stroke-dasharray', '5, 5');
    },

    // already documented in JXG.AbstractRenderer
    createPrim: function(type, id) {
        var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
        node.setAttributeNS(null, 'id', this.container.id+'_'+id);
        node.style.position = 'absolute';
        if (type=='path') {
            node.setAttributeNS(null, 'stroke-linecap', 'butt');
            node.setAttributeNS(null, 'stroke-linejoin', 'round');
        }
        return node;
    },

    createArrowHead: function(el,idAppendix) {
        var id = el.id+'Triangle',
            node2, node3;

        if (idAppendix!=null) { id += idAppendix; }
        node2 = this.createPrim('marker',id);

        node2.setAttributeNS(null, 'viewBox', '0 0 10 6');
        node2.setAttributeNS(null, 'refY', '3');
        node2.setAttributeNS(null, 'markerUnits', 'strokeWidth');
        node2.setAttributeNS(null, 'markerHeight', '12');
        node2.setAttributeNS(null, 'markerWidth', '10');
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
    },

    makeArrows: function(el) {
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
    },

    updateLinePrim: function(node,p1x,p1y,p2x,p2y) {
        node.setAttributeNS(null, 'x1', p1x);
        node.setAttributeNS(null, 'y1', p1y);
        node.setAttributeNS(null, 'x2', p2x);
        node.setAttributeNS(null, 'y2', p2y);
    },

    updateCirclePrim: function(node,x,y,r) {
        node.setAttributeNS(null, 'cx', (x));
        node.setAttributeNS(null, 'cy', (y));
        node.setAttributeNS(null, 'r', (r));
    },

    updateEllipsePrim: function(node,x,y,rx,ry) {
        node.setAttributeNS(null, 'cx', (x));
        node.setAttributeNS(null, 'cy', (y));
        node.setAttributeNS(null, 'rx', (rx));
        node.setAttributeNS(null, 'ry', (ry));
    },

    updateRectPrim: function(node,x,y,w,h) {
        node.setAttributeNS(null, 'x', (x));
        node.setAttributeNS(null, 'y', (y));
        node.setAttributeNS(null, 'width', (w));
        node.setAttributeNS(null, 'height', (h));
    },

    updatePathPrim: function(node, pointString, board) {
        node.setAttributeNS(null, 'd', pointString);
    },

    updatePathStringPrim: function(el) {
        var symbm = ' M ',
            symbl = ' L ',
            nextSymb = symbm,
            maxSize = 5000.0,
            pStr = '',
            i, scr,
            isNoPlot = (el.curveType!='plot'),
            len;

        if (el.numberPoints<=0) { return ''; }

        if (isNoPlot && el.board.options.curve.RDPsmoothing) {
            el.points = this.RamenDouglasPeuker(el.points,0.5);
        }
        len = Math.min(el.points.length,el.numberPoints);
        for (i=0; i<len; i++) {
            scr = el.points[i].scrCoords;
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
    },

    updatePathStringPoint: function(el, size, type) {
        var s = '',
            scr = el.coords.scrCoords,
            sqrt32 = size*Math.sqrt(3)*0.5,
            s05 = size*0.5;

        if(type == 'x') {
            s = 'M ' + (scr[1]-size) + ' ' + (scr[2]-size) + ' L ' +
                (scr[1]+size) + ' ' + (scr[2]+size) + ' M ' +
                (scr[1]+size) + ' ' + (scr[2]-size) + ' L ' +
                (scr[1]-size) + ' ' + (scr[2]+size);
        }
        else if(type == '+') {
            s = 'M ' + (scr[1]-size) + ' ' + (scr[2]) + ' L ' +
                (scr[1]+size) + ' ' + (scr[2]) + ' M ' +
                (scr[1]) + ' ' + (scr[2]-size) + ' L ' +
                (scr[1]) + ' ' + (scr[2]+size);
        }
        else if(type == '<>') {
            s = 'M ' + (scr[1]-size) + ' ' + (scr[2]) + ' L ' +
                (scr[1]) + ' ' + (scr[2]+size) + ' L ' +
                (scr[1]+size) + ' ' + (scr[2]) + ' L ' +
                (scr[1]) + ' ' + (scr[2]-size) + ' Z ';
        }
        else if(type == '^') {
            s = 'M ' + (scr[1]) + ' ' + (scr[2]-size) + ' L ' +
                (scr[1]-sqrt32) + ' ' + (scr[2]+s05) + ' L ' +
                (scr[1]+sqrt32) + ' ' + (scr[2]+s05) + ' Z ';
        }
        else if(type == 'v') {
            s = 'M ' + (scr[1]) + ' ' + (scr[2]+size) + ' L ' +
                (scr[1]-sqrt32) + ' ' + (scr[2]-s05) + ' L ' +
                (scr[1]+sqrt32) + ' ' + (scr[2]-s05) + ' Z ';
        }
        else if(type == '>') {
            s = 'M ' + (scr[1]+size) + ' ' + (scr[2]) + ' L ' +
                (scr[1]-s05) + ' ' + (scr[2]-sqrt32) + ' L ' +
                (scr[1]-s05) + ' ' + (scr[2]+sqrt32) + ' Z ';
        }
        else if(type == '<') {
            s = 'M ' + (scr[1]-size) + ' ' + (scr[2]) + ' L ' +
                (scr[1]+s05) + ' ' + (scr[2]-sqrt32) + ' L ' +
                (scr[1]+s05) + ' ' + (scr[2]+sqrt32) + ' Z ';
        }
        return s;
    },

    updatePolygonPrim: function(node, el) {
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
    },

    appendChildPrim: function(node,level) {
        if (typeof level=='undefined') { // trace nodes have level not set
            level = 0;
        } else if (level>=JXG.Options.layer.numlayers) {
            level = JXG.Options.layer.numlayers-1;
        }
        this.layer[level].appendChild(node);
    },

    setPropertyPrim: function(node,key,val) {
        if (key=='stroked') {
            return;
        }
        node.setAttributeNS(null, key, val);
    },

    drawVerticalGrid: function(topLeft, bottomRight, gx, board) {
        var node = this.createPrim('path', 'gridx'),
            gridArr = '';

        while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) {
            gridArr += ' M ' + topLeft.scrCoords[1] + ' ' + 0 + ' L ' + topLeft.scrCoords[1] + ' ' + board.canvasHeight+' ';
            topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);
        }
        this.updatePathPrim(node, gridArr, board);
        return node;
    },

    drawHorizontalGrid: function(topLeft, bottomRight, gy, board) {
        var node = this.createPrim('path', 'gridy'),
            gridArr = '';

        while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
            gridArr += ' M ' + 0 + ' ' + topLeft.scrCoords[2] + ' L ' + board.canvasWidth + ' ' + topLeft.scrCoords[2]+' ';
            topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
        }
        this.updatePathPrim(node, gridArr, board);
        return node;
    },

    appendNodesToElement: function(element, type) {
        element.rendNode = this.getElementById(element.id);
    },

    /**
     * Sets the buffering as recommended by SVGWG. Until now only Opera supports this and will be ignored by other browsers.
     * @param {DOMNode} el The SVG DOM Node which buffering type to update.
     * @param {String} type Either 'auto', 'dynamic', or 'static'. For an explanation see
     *   {@link http://www.w3.org/TR/SVGTiny12/painting.html#BufferedRenderingProperty}.
     */
    setBuffering: function(el, type) {
        el.rendNode.setAttribute('buffered-rendering', type);
    }
});