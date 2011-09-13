/*
    Copyright 2008-2011
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

/*jshint bitwise: false, curly: true, debug: false, eqeqeq: true, devel: false, evil: false,
  forin: false, immed: true, laxbreak: false, newcap: false, noarg: true, nonew: true, onevar: true,
   undef: true, white: true, sub: false*/
/*global JXG: true, AMprocessNode: true, MathJax: true, document: true */

/**
 * Uses SVG to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
 * @class JXG.AbstractRenderer
 * @augments JXG.AbstractRenderer
 * @param {Node} container Reference to a DOM node containing the board.
 * @see JXG.AbstractRenderer
 */
JXG.SVGRenderer = function (container) {
    var i;

    // docstring in AbstractRenderer
    this.type = 'svg';

    /**
     * SVG root node
     * @type Node
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
    this.xlinkNamespace = 'http://www.w3.org/1999/xlink';

    // container is documented in AbstractRenderer
    this.container = container;

    // prepare the div container and the svg root node for use with JSXGraph
    this.container.style.MozUserSelect = 'none';

    this.container.style.overflow = 'hidden';
    if (this.container.style.position === '') {
        this.container.style.position = 'relative';
    }

    this.svgRoot = this.container.ownerDocument.createElementNS(this.svgNamespace, "svg");
    this.svgRoot.style.overflow = 'hidden';
    this.svgRoot.style.width = this.container.style.width;
    this.svgRoot.style.height = this.container.style.height;
    this.container.appendChild(this.svgRoot);

    /**
     * The <tt>defs</tt> element is a container element to reference reusable SVG elements.
     * @type Node
     * @see http://www.w3.org/TR/SVG/struct.html#DefsElement
     */
    this.defs = this.container.ownerDocument.createElementNS(this.svgNamespace, 'defs');
    this.svgRoot.appendChild(this.defs);

    /**
     * Filters are used to apply shadows.
     * @type Node
     * @see http://www.w3.org/TR/SVG/filters.html#FilterElement
     */
    this.filter = this.container.ownerDocument.createElementNS(this.svgNamespace, 'filter');
    this.filter.setAttributeNS(null, 'id', this.container.id + '_' + 'f1');
    this.filter.setAttributeNS(null, 'width', '300%');
    this.filter.setAttributeNS(null, 'height', '300%');
    this.filter.setAttributeNS(null, 'filterUnits', 'userSpaceOnUse');
    
    this.feOffset = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feOffset');
    this.feOffset.setAttributeNS(null, 'result', 'offOut');
    this.feOffset.setAttributeNS(null, 'in', 'SourceAlpha');
    this.feOffset.setAttributeNS(null, 'dx', '5');
    this.feOffset.setAttributeNS(null, 'dy', '5');
    this.filter.appendChild(this.feOffset);

    this.feGaussianBlur = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feGaussianBlur');
    this.feGaussianBlur.setAttributeNS(null, 'result', 'blurOut');
    this.feGaussianBlur.setAttributeNS(null, 'in', 'offOut');
    this.feGaussianBlur.setAttributeNS(null, 'stdDeviation', '3'); 
    this.filter.appendChild(this.feGaussianBlur);

    this.feBlend = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feBlend');
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
    for (i = 0; i < JXG.Options.layer.numlayers; i++) {
        this.layer[i] = this.container.ownerDocument.createElementNS(this.svgNamespace, 'g');
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

JXG.extend(JXG.SVGRenderer.prototype, /** @lends JXG.SVGRenderer.prototype */ {

    /**
     * Creates an arrow DOM node. Arrows are displayed in SVG with a <em>marker</em> tag.
     * @private
     * @param {JXG.GeometryElement} element A JSXGraph element, preferably one that can have an arrow attached.
     * @param {String} [idAppendix=''] A string that is added to the node's id.
     * @returns {Node} Reference to the node added to the DOM.
     */
    _createArrowHead: function (element, idAppendix) {
        var id = element.id + 'Triangle',
            node2, node3;

        if (JXG.exists(idAppendix)) {
            id += idAppendix;
        }
        node2 = this.createPrim('marker', id);

        node2.setAttributeNS(null, 'viewBox', '0 0 10 6');
        node2.setAttributeNS(null, 'refY', '3');
        node2.setAttributeNS(null, 'markerUnits', 'userSpaceOnUse'); //'strokeWidth');
        node2.setAttributeNS(null, 'markerHeight', '12');
        node2.setAttributeNS(null, 'markerWidth', '10');
        node2.setAttributeNS(null, 'orient', 'auto');
        node2.setAttributeNS(null, 'stroke', element.visProp.strokecolor);
        node2.setAttributeNS(null, 'stroke-opacity', element.visProp.strokeopacity);
        node2.setAttributeNS(null, 'fill', element.visProp.strokecolor);
        node2.setAttributeNS(null, 'fill-opacity', element.visProp.strokeopacity);
        node3 = this.container.ownerDocument.createElementNS(this.svgNamespace, 'path');

        if (idAppendix === 'End') {
            node2.setAttributeNS(null, 'refX', '0');
            node3.setAttributeNS(null, 'd', 'M 0 3 L 10 6 L 10 0 z');
        } else {
            node2.setAttributeNS(null, 'refX', '10');
            node3.setAttributeNS(null, 'd', 'M 0 0 L 10 3 L 0 6 z');
        }
        node2.appendChild(node3);
        return node2;
    },

    /**
     * Updates an arrow DOM node.
     * @param {Node} node The arrow node.
     * @param {String} color Color value in a HTML compatible format, e.g. <tt>#00ff00</tt> or <tt>green</tt> for green.
     * @param {Number} opacity
     */
    _setArrowAtts: function (node, color, opacity) {
        if (node) {
            node.setAttributeNS(null, 'stroke', color);
            node.setAttributeNS(null, 'stroke-opacity', opacity);
            node.setAttributeNS(null, 'fill', color);
            node.setAttributeNS(null, 'fill-opacity', opacity);
        }
    },

    /* ******************************** *
     *  This renderer does not need to
     *  override draw/update* methods
     *  since it provides draw/update*Prim
     *  methods except for some cases like
     *  internal texts or images.
     * ******************************** */

    /* **************************
     *    Lines
     * **************************/

    // documented in AbstractRenderer
    updateTicks: function (axis, dxMaj, dyMaj, dxMin, dyMin) {
        var tickStr = '',
            i, c, node,
            len = axis.ticks.length;

        for (i = 0; i < len; i++) {
            c = axis.ticks[i].scrCoords;
            if (axis.ticks[i].major) {
                if ((axis.board.needsFullUpdate || axis.needsRegularUpdate) && axis.labels[i] && axis.labels[i].visProp.visible) {
                    this.updateText(axis.labels[i]);
                }
                tickStr += "M " + (c[1] + dxMaj) + " " + (c[2] - dyMaj) + " L " + (c[1] - dxMaj) + " " + (c[2] + dyMaj) + " ";
            } else {
                tickStr += "M " + (c[1] + dxMin) + " " + (c[2] - dyMin) + " L " + (c[1] - dxMin) + " " + (c[2] + dyMin) + " ";
            }
        }
        node = this.getElementById(axis.id);
        if (!JXG.exists(node)) {
            node = this.createPrim('path', axis.id);
            this.appendChildPrim(node, axis.visProp.layer);
            this.appendNodesToElement(axis, 'path');
        }
        node.setAttributeNS(null, 'stroke', axis.visProp.strokecolor);
        node.setAttributeNS(null, 'stroke-opacity', axis.visProp.strokeopacity);
        node.setAttributeNS(null, 'stroke-width', axis.visProp.strokewidth);
        this.updatePathPrim(node, tickStr, axis.board);
    },

    /* **************************
     *    Text related stuff
     * **************************/

    // already documented in JXG.AbstractRenderer
    displayCopyright: function (str, fontsize) {
        var node = this.createPrim('text', 'licenseText'),
            t;
        node.setAttributeNS(null, 'x', '20px');
        node.setAttributeNS(null, 'y', (2 + fontsize) + 'px');
        node.setAttributeNS(null, "style", "font-family:Arial,Helvetica,sans-serif; font-size:" + fontsize + "px; fill:#356AA0;  opacity:0.3;");
        t = document.createTextNode(str);
        node.appendChild(t);
        this.appendChildPrim(node, 0);
    },

    // already documented in JXG.AbstractRenderer
    drawInternalText: function (el) {
        var node = this.createPrim('text', el.id);

        node.setAttributeNS(null, "class", "JXGtext");
        //node.setAttributeNS(null, "style", "alignment-baseline:middle"); // Not yet supported by Firefox
        el.rendNodeText = document.createTextNode('');
        node.appendChild(el.rendNodeText);
        this.appendChildPrim(node, 9);

        return node;
    },

    // already documented in JXG.AbstractRenderer
    updateInternalText: function (el) {
        var content = el.plaintext;

        el.rendNode.setAttributeNS(null, 'x', el.coords.scrCoords[1] + 'px');
        el.rendNode.setAttributeNS(null, 'y', (el.coords.scrCoords[2] + this.vOffsetText*0.5) + 'px');

        if (el.htmlStr !== content) {
            el.rendNodeText.data = content;
            el.htmlStr = content;
        }
        this.transformImage(el, el.transformations);
    },

    /* **************************
     *    Image related stuff
     * **************************/

    // already documented in JXG.AbstractRenderer
    drawImage: function (el) {
        var node = this.createPrim('image', el.id);

        node.setAttributeNS(null, 'preserveAspectRatio', 'none');
        this.appendChildPrim(node, el.visProp.layer);
        el.rendNode = node;

        this.updateImage(el);
    },

    // already documented in JXG.AbstractRenderer
    transformImage: function (el, t) {
        var node = el.rendNode, m,
            str = "",
            s, len = t.length;

        if (len > 0) {
            m = this.joinTransforms(el, t);
            s = [m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]].join(',');
            str += ' matrix(' + s + ') ';
            node.setAttributeNS(null, 'transform', str);
        }
    },

    // already documented in JXG.AbstractRenderer
    updateImageURL: function (el) {
        var url = JXG.evaluate(el.url);
        el.rendNode.setAttributeNS(this.xlinkNamespace, 'xlink:href', url);
    },

    /* **************************
     * Render primitive objects
     * **************************/

    // already documented in JXG.AbstractRenderer
    appendChildPrim: function (node, level) {
        if (!JXG.exists(level)) { // trace nodes have level not set
            level = 0;
        } else if (level >= JXG.Options.layer.numlayers) {
            level = JXG.Options.layer.numlayers - 1;
        }
        this.layer[level].appendChild(node);
    },

    // already documented in JXG.AbstractRenderer
    appendNodesToElement: function (element) {
        element.rendNode = this.getElementById(element.id);
    },

    // already documented in JXG.AbstractRenderer
    createPrim: function (type, id) {
        var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
        node.setAttributeNS(null, 'id', this.container.id + '_' + id);
        node.style.position = 'absolute';
        if (type === 'path') {
            node.setAttributeNS(null, 'stroke-linecap', 'butt');
            node.setAttributeNS(null, 'stroke-linejoin', 'round');
        }
        return node;
    },

    // already documented in JXG.AbstractRenderer
    remove: function (shape) {
        if (JXG.exists(shape) && JXG.exists(shape.parentNode)) {
            shape.parentNode.removeChild(shape);
        }
    },

    // already documented in JXG.AbstractRenderer
    makeArrows: function (el) {
        var node2;

        if (el.visPropOld.firstarrow === el.visProp.firstarrow && el.visPropOld.lastarrow === el.visProp.lastarrow) {
            return;
        }

        if (el.visProp.firstarrow) {
            node2 = el.rendNodeTriangleStart;
            if (!JXG.exists(node2)) {
                node2 = this._createArrowHead(el, 'End');
                this.defs.appendChild(node2);
                el.rendNodeTriangleStart = node2;
                el.rendNode.setAttributeNS(null, 'marker-start', 'url(#' + this.container.id + '_' + el.id + 'TriangleEnd)');
            }
        } else {
            node2 = el.rendNodeTriangleStart;
            if (JXG.exists(node2)) {
                this.remove(node2);
            }
        }
        if (el.visProp.lastarrow) {
            node2 = el.rendNodeTriangleEnd;
            if (!JXG.exists(node2)) {
                node2 = this._createArrowHead(el, 'Start');
                this.defs.appendChild(node2);
                el.rendNodeTriangleEnd = node2;
                el.rendNode.setAttributeNS(null, 'marker-end', 'url(#' + this.container.id + '_' + el.id + 'TriangleStart)');
            }
        } else {
            node2 = el.rendNodeTriangleEnd;
            if (JXG.exists(node2)) {
                this.remove(node2);
            }
        }
        el.visPropOld.firstarrow = el.visProp.firstarrow;
        el.visPropOld.lastarrow = el.visProp.lastarrow;
    },

    // already documented in JXG.AbstractRenderer
    updateEllipsePrim: function (node, x, y, rx, ry) {
        node.setAttributeNS(null, 'cx', x);
        node.setAttributeNS(null, 'cy', y);
        node.setAttributeNS(null, 'rx', rx);
        node.setAttributeNS(null, 'ry', ry);
    },

    // already documented in JXG.AbstractRenderer
    updateLinePrim: function (node, p1x, p1y, p2x, p2y) {
        if (!isNaN(p1x+p1y+p2x+p2y)) {
            node.setAttributeNS(null, 'x1', p1x);
            node.setAttributeNS(null, 'y1', p1y);
            node.setAttributeNS(null, 'x2', p2x);
            node.setAttributeNS(null, 'y2', p2y);
        }
    },

    // already documented in JXG.AbstractRenderer
    updatePathPrim: function (node, pointString) {
        if (pointString == '') {
            pointString = 'M 0 0';
        }
        node.setAttributeNS(null, 'd', pointString);
    },

    // already documented in JXG.AbstractRenderer
    updatePathStringPoint: function (el, size, type) {
        var s = '',
            scr = el.coords.scrCoords,
            sqrt32 = size * Math.sqrt(3) * 0.5,
            s05 = size * 0.5;

        if (type === 'x') {
            s = ' M ' + (scr[1] - size) + ' ' + (scr[2] - size) +
                ' L ' + (scr[1] + size) + ' ' + (scr[2] + size) +
                ' M ' + (scr[1] + size) + ' ' + (scr[2] - size) +
                ' L ' + (scr[1] - size) + ' ' + (scr[2] + size);
        } else if (type === '+') {
            s = ' M ' + (scr[1] - size) + ' ' + (scr[2]) +
                ' L ' + (scr[1] + size) + ' ' + (scr[2]) +
                ' M ' + (scr[1])        + ' ' + (scr[2] - size) +
                ' L ' + (scr[1])        + ' ' + (scr[2] + size);
        } else if (type === '<>') {
            s = ' M ' + (scr[1] - size) + ' ' + (scr[2]) +
                ' L ' + (scr[1])        + ' ' + (scr[2] + size) +
                ' L ' + (scr[1] + size) + ' ' + (scr[2]) +
                ' L ' + (scr[1])        + ' ' + (scr[2] - size) + ' Z ';
        } else if (type === '^') {
            s = ' M ' + (scr[1])          + ' ' + (scr[2] - size) +
                ' L ' + (scr[1] - sqrt32) + ' ' + (scr[2] + s05) +
                ' L ' + (scr[1] + sqrt32) + ' ' + (scr[2] + s05) +
                ' Z ';  // close path
        } else if (type === 'v') {
            s = ' M ' + (scr[1])          + ' ' + (scr[2] + size) +
                ' L ' + (scr[1] - sqrt32) + ' ' + (scr[2] - s05) +
                ' L ' + (scr[1] + sqrt32) + ' ' + (scr[2] - s05) +
                ' Z ';
        } else if (type === '>') {
            s = ' M ' + (scr[1] + size) + ' ' + (scr[2]) +
                ' L ' + (scr[1] - s05)  + ' ' + (scr[2] - sqrt32) +
                ' L ' + (scr[1] - s05)  + ' ' + (scr[2] + sqrt32) +
                ' Z ';
        } else if (type === '<') {
            s = ' M ' + (scr[1] - size) + ' ' + (scr[2]) +
                ' L ' + (scr[1] + s05)  + ' ' + (scr[2] - sqrt32) +
                ' L ' + (scr[1] + s05)  + ' ' + (scr[2] + sqrt32) +
                ' Z ';
        }
        return s;
    },

    // already documented in JXG.AbstractRenderer
    updatePathStringPrim: function (el) {
        var symbm = ' M ',
            symbl = ' L ',
            nextSymb = symbm,
            maxSize = 5000.0,
            pStr = '',
            i, scr,
            isNoPlot = (el.visProp.curvetype !== 'plot'),
            len;

        if (el.numberPoints <= 0) {
            return '';
        }

        if (isNoPlot && el.board.options.curve.RDPsmoothing) {
            el.points = JXG.Math.Numerics.RamenDouglasPeuker(el.points, 0.5);
        }

        len = Math.min(el.points.length, el.numberPoints);
        for (i = 0; i < len; i++) {
            scr = el.points[i].scrCoords;
            if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
                nextSymb = symbm;
            } else {
                // Chrome has problems with values being too far away.
                if (scr[1] > maxSize) {
                    scr[1] = maxSize;
                } else if (scr[1] < -maxSize) {
                    scr[1] = -maxSize;
                }

                if (scr[2] > maxSize) {
                    scr[2] = maxSize;
                } else if (scr[2] < -maxSize) {
                    scr[2] = -maxSize;
                }

                // Attention: first coordinate may be inaccurate if far way
                pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                nextSymb = symbl;
            }
        }
        return pStr;
    },

    // already documented in JXG.AbstractRenderer
    updatePolygonPrim: function (node, el) {
        var pStr = '',
            scrCoords, i,
            len = el.vertices.length;

        node.setAttributeNS(null, 'stroke', 'none');
        for (i = 0; i < len - 1; i++) {
            scrCoords = el.vertices[i].coords.scrCoords;
            pStr = pStr + scrCoords[1] + "," + scrCoords[2];
            if (i < len - 2) {
                pStr += " ";
            }
        }
        if (pStr.indexOf('NaN')==-1) 
            node.setAttributeNS(null, 'points', pStr);
    },

    // already documented in JXG.AbstractRenderer
    updateRectPrim: function (node, x, y, w, h) {
        node.setAttributeNS(null, 'x', x);
        node.setAttributeNS(null, 'y', y);
        node.setAttributeNS(null, 'width', w);
        node.setAttributeNS(null, 'height', h);
    },

    /* **************************
     *  Set Attributes
     * **************************/

    // documented in JXG.AbstractRenderer
    setPropertyPrim: function (node, key, val) {
        if (key === 'stroked') {
            return;
        }
        node.setAttributeNS(null, key, val);
    },

    // documented in JXG.AbstractRenderer
    show: function (el) {
        var node;

        if (el && el.rendNode) {
            node = el.rendNode;
            node.setAttributeNS(null, 'display', 'inline');
            node.style.visibility = "inherit";
        }
    },

    // documented in JXG.AbstractRenderer
    hide: function (el) {
        var node;

        if (el && el.rendNode) {
            node = el.rendNode;
            node.setAttributeNS(null, 'display', 'none');
            node.style.visibility = "hidden";
        }
    },

    // documented in JXG.AbstractRenderer
    setBuffering: function (el, type) {
        el.rendNode.setAttribute('buffered-rendering', type);
    },

    // documented in JXG.AbstractRenderer
    setDashStyle: function (el) {
        var dashStyle = el.visProp.dash, node = el.rendNode;
        
        if (el.visProp.dash > 0) {
            node.setAttributeNS(null, 'stroke-dasharray', this.dashArray[dashStyle - 1]);
        } else {
            if (node.hasAttributeNS(null, 'stroke-dasharray')) {
                node.removeAttributeNS(null, 'stroke-dasharray');
            }
        }
    },

    // documented in JXG.AbstractRenderer
    setGradient: function (el) {
        var fillNode = el.rendNode, col, op,
            node, node2, node3, x1, x2, y1, y2;

        op = JXG.evaluate(el.visProp.fillopacity);
        op = (op > 0) ? op : 0;

        col = JXG.evaluate(el.visProp.fillcolor);

        if (el.visProp.gradient === 'linear') {
            node = this.createPrim('linearGradient', el.id + '_gradient');
            x1 = '0%'; // TODO: get x1,x2,y1,y2 from el.visProp['angle']
            x2 = '100%';
            y1 = '0%';
            y2 = '0%'; //means 270 degrees

            node.setAttributeNS(null, 'x1', x1);
            node.setAttributeNS(null, 'x2', x2);
            node.setAttributeNS(null, 'y1', y1);
            node.setAttributeNS(null, 'y2', y2);
            node2 = this.createPrim('stop', el.id + '_gradient1');
            node2.setAttributeNS(null, 'offset', '0%');
            node2.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);
            node3 = this.createPrim('stop', el.id + '_gradient2');
            node3.setAttributeNS(null, 'offset', '100%');
            node3.setAttributeNS(null, 'style', 'stop-color:' + el.visProp.gradientsecondcolor + ';stop-opacity:' + el.visProp.gradientsecondopacity);
            node.appendChild(node2);
            node.appendChild(node3);
            this.defs.appendChild(node);
            fillNode.setAttributeNS(null, 'style', 'fill:url(#' + this.container.id + '_' + el.id + '_gradient)');
            el.gradNode1 = node2;
            el.gradNode2 = node3;
        } else if (el.visProp.gradient === 'radial') {
            node = this.createPrim('radialGradient', el.id + '_gradient');

            node.setAttributeNS(null, 'cx', '50%');
            node.setAttributeNS(null, 'cy', '50%');
            node.setAttributeNS(null, 'r', '50%');
            node.setAttributeNS(null, 'fx', el.visProp.gradientpositionx * 100 + '%');
            node.setAttributeNS(null, 'fy', el.visProp.gradientpositiony * 100 + '%');

            node2 = this.createPrim('stop', el.id + '_gradient1');
            node2.setAttributeNS(null, 'offset', '0%');
            node2.setAttributeNS(null, 'style', 'stop-color:' + el.visProp.gradientsecondcolor + ';stop-opacity:' + el.visProp.gradientsecondopacity);
            node3 = this.createPrim('stop', el.id + '_gradient2');
            node3.setAttributeNS(null, 'offset', '100%');
            node3.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);

            node.appendChild(node2);
            node.appendChild(node3);
            this.defs.appendChild(node);
            fillNode.setAttributeNS(null, 'style', 'fill:url(#' + this.container.id + '_' + el.id + '_gradient)');
            el.gradNode1 = node2;
            el.gradNode2 = node3;
        } else {
            fillNode.removeAttributeNS(null, 'style');
        }
    },

    // documented in JXG.AbstractRenderer
    updateGradient: function (el) {
        var node2 = el.gradNode1,
            node3 = el.gradNode2,
            col, op;

        if (!JXG.exists(node2) || !JXG.exists(node3)) {
            return;
        }

        op = JXG.evaluate(el.visProp.fillopacity);
        op = (op > 0) ? op : 0;

        col = JXG.evaluate(el.visProp.fillcolor);

        if (el.visProp.gradient === 'linear') {
            node2.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);
            node3.setAttributeNS(null, 'style', 'stop-color:' + el.visProp.gradientsecondcolor + ';stop-opacity:' + el.visProp.gradientsecondopacity);
        } else if (el.visProp.gradient === 'radial') {
            node2.setAttributeNS(null, 'style', 'stop-color:' + el.visProp.gradientsecondcolor + ';stop-opacity:' + el.visProp.gradientsecondopacity);
            node3.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);
        }
    },

    // documented in JXG.AbstractRenderer
    setObjectFillColor: function (el, color, opacity) {
        var node, c = JXG.evaluate(color),
            o = JXG.evaluate(opacity);

        o = (o > 0) ? o : 0;

        if (el.visPropOld.fillcolor === c && el.visPropOld.fillopacity === o) {
            return;
        }
        if (c !== false) {
            node = el.rendNode;
            node.setAttributeNS(null, 'fill', c);
            if (el.type === JXG.OBJECT_TYPE_IMAGE) {
                node.setAttributeNS(null, 'opacity', o);
            } else {
                node.setAttributeNS(null, 'fill-opacity', o);
            }
            if (JXG.exists(el.visProp.gradient)) {
                this.updateGradient(el);
            }
        }
        el.visPropOld.fillcolor = c;
        el.visPropOld.fillopacity = o;
    },

    // documented in JXG.AbstractRenderer
    setObjectStrokeColor: function (el, color, opacity) {
        var c = JXG.evaluate(color),
            o = JXG.evaluate(opacity),
            node;

        o = (o > 0) ? o : 0;

        if (el.visPropOld.strokecolor === c && el.visPropOld.strokeopacity === o) {
            return;
        }

        if (c !== false) {
            node = el.rendNode;
            if (el.type === JXG.OBJECT_TYPE_TEXT) {
                if (el.visProp.display === 'html') {
                    node.style.color = c; // Schriftfarbe
                } else {
                    node.setAttributeNS(null, "style", "fill:" + c);
                }
            } else {
                node.setAttributeNS(null, 'stroke', c);
                node.setAttributeNS(null, 'stroke-opacity', o);
            }
        }

        if (el.type === JXG.OBJECT_TYPE_ARROW) {
            this._setArrowAtts(el.rendNodeTriangle, c, o);
        } else if (el.elementClass === JXG.OBJECT_CLASS_CURVE || el.elementClass === JXG.OBJECT_CLASS_LINE) {
            if (el.visProp.firstarrow) {
                this._setArrowAtts(el.rendNodeTriangleStart, c, o);
            }
            if (el.visProp.lastarrow) {
                this._setArrowAtts(el.rendNodeTriangleEnd, c, o);
            }
        }

        el.visPropOld.strokecolor = c;
        el.visPropOld.strokeopacity = o;
    },

    // documented in JXG.AbstractRenderer
    setObjectStrokeWidth: function (el, width) {
        var w = JXG.evaluate(width),
            node;

        if (el.visPropOld.strokewidth === w) {
            return;
        }

        node = el.rendNode;
        this.setPropertyPrim(node, 'stroked', 'true');
        if (JXG.exists(w)) {

            this.setPropertyPrim(node, 'stroke-width', w + 'px');
        }
        el.visPropOld.strokewidth = w;
    },

    // documented in JXG.AbstractRenderer
    setShadow: function (el) {
        if (el.visPropOld.shadow === el.visProp.shadow) {
            return;
        }

        if (JXG.exists(el.rendNode)) {
            if (el.visProp.shadow) {
                el.rendNode.setAttributeNS(null, 'filter', 'url(#' + this.container.id + '_' + 'f1)');
            } else {
                el.rendNode.removeAttributeNS(null, 'filter');
            }
        }
        el.visPropOld.shadow = el.visProp.shadow;
    },

    /* **************************
     * renderer control
     * **************************/
    
    // documented in JXG.AbstractRenderer
    suspendRedraw: function () {
        // It seems to be important for the Linux version of firefox
        this.suspendHandle = this.svgRoot.suspendRedraw(10000);
    },

    // documented in JXG.AbstractRenderer
    unsuspendRedraw: function () {
        this.svgRoot.unsuspendRedraw(this.suspendHandle);
        this.svgRoot.forceRedraw();
    },

    // document in AbstractRenderer
    resize: function (w, h) {
        this.svgRoot.style.width = parseFloat(w) + 'px';
        this.svgRoot.style.height = parseFloat(h) + 'px';
    }

});