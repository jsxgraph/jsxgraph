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
   undef: true, white: false, sub: false*/
/*global JXG: true, AMprocessNode: true, MathJax: true, document: true */

/**
 * Uses VML to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
 * @class JXG.AbstractRenderer
 * @augments JXG.AbstractRenderer
 * @param {Node} container Reference to a DOM node containing the board.
 * @see JXG.AbstractRenderer
 */
JXG.VMLRenderer = function (container) {
    this.type = 'vml';
    
    this.container = container;
    this.container.style.overflow = 'hidden';
    this.container.onselectstart = function () {
        return false;
    };
    
    this.resolution = 10; // Paths are drawn with a a resolution of this.resolution/pixel.
  
    // Add VML includes and namespace
    // Original: IE <=7
    //container.ownerDocument.createStyleSheet().addRule("v\\:*", "behavior: url(#default#VML);");
    if (!JXG.exists(JXG.vmlStylesheet)) {
        container.ownerDocument.namespaces.add("jxgvml", "urn:schemas-microsoft-com:vml");
        JXG.vmlStylesheet = this.container.ownerDocument.createStyleSheet();
        JXG.vmlStylesheet.addRule(".jxgvml", "behavior:url(#default#VML)");
    }

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

    // dash styles
    this.dashArray = ['Solid', '1 1', 'ShortDash', 'Dash', 'LongDash', 'ShortDashDot', 'LongDashDot'];    
};

JXG.VMLRenderer.prototype = new JXG.AbstractRenderer();

JXG.extend(JXG.VMLRenderer.prototype, /** @lends JXG.VMLRenderer */ {

    /**
     * Sets attribute <tt>key</tt> of node <tt>node</tt> to <tt>value</tt>.
     * @param {Node} node A DOM node.
     * @param {String} key Name of the attribute.
     * @param {String} val New value of the attribute.
     * @param {Boolean} [iFlag=false] If false, the attribute's name is case insensitive.
     */
    _setAttr: function (node, key, val, iFlag) {
        try {
            if (document.documentMode === 8) {
                node[key] = val;
            } else {
                node.setAttribute(key, val, iFlag);
            }
        } catch (e) {
            JXG.debug(node.id + ' ' + key + ' ' + val + '<br>\n');
        }
    },

    /* ******************************** *
     *  This renderer does not need to
     *  override draw/update* methods
     *  since it provides draw/update*Prim
     *  methods.
     * ******************************** */

    /* **************************
     *    Lines
     * **************************/

    // documented in AbstractRenderer
    updateTicks: function (axis, dxMaj, dyMaj, dxMin, dyMin) {
        var tickArr = [], i, len, c, ticks, r = this.resolution;

        len = axis.ticks.length;
        for (i = 0; i < len; i++) {
            c = axis.ticks[i].scrCoords;
            if (axis.ticks[i].major) {
                if ((axis.board.needsFullUpdate || axis.needsRegularUpdate) && axis.labels[i] && axis.labels[i].visProp.visible) {
                    this.updateText(axis.labels[i]);
                }
                tickArr.push(
                    ' m ' + Math.round(r * (c[1] + dxMaj)) + ', ' + Math.round(r * (c[2] - dyMaj)) +
                    ' l ' + Math.round(r * (c[1] - dxMaj)) + ', ' + Math.round(r * (c[2] + dyMaj)) + ' '
                );
            } else {
                tickArr.push(
                    ' m ' + Math.round(r * (c[1] + dxMin)) + ', ' + Math.round(r * (c[2] - dyMin)) +
                    ' l ' + Math.round(r * (c[1] - dxMin)) + ', ' + Math.round(r * (c[2] + dyMin)) + ' '
                );
            }
        }

        //ticks = this.getElementById(axis.id);
        if (!JXG.exists(axis)) {
            ticks = this.createPrim('path', axis.id);
            this.appendChildPrim(ticks, axis.visProp.layer);
            this.appendNodesToElement(axis, 'path');
        }
        this._setAttr(axis.rendNode, 'stroked', 'true');
        this._setAttr(axis.rendNode, 'strokecolor', axis.visProp.strokecolor, 1);
        this._setAttr(axis.rendNode, 'strokeweight', axis.visProp.strokewidth);
        this._setAttr(axis.rendNodeStroke, 'opacity', (axis.visProp.strokeopacity * 100) + '%');
        this.updatePathPrim(axis.rendNode, tickArr, axis.board);
    },

    /* **************************
     *    Text related stuff
     * **************************/

    // already documented in JXG.AbstractRenderer
    displayCopyright: function (str, fontsize) {
        var node, t;

        node = this.createNode('textbox');
        node.style.position = 'absolute';
        this._setAttr(node, 'id', this.container.id + '_' + 'licenseText');

        node.style.left = 20;
        node.style.top = 2;
        node.style.fontSize = fontsize;
        node.style.color = '#356AA0';
        node.style.fontFamily = 'Arial,Helvetica,sans-serif';
        this._setAttr(node, 'opacity', '30%');
        node.style.filter = 'alpha(opacity = 30)';

        t = document.createTextNode(str);
        node.appendChild(t);
        this.appendChildPrim(node, 0);
    },

    // documented in AbstractRenderer
    drawInternalText: function (el) {
        var node;
        node = this.createNode('textbox');
        node.style.position = 'absolute';
        if (document.documentMode === 8) {
            node.setAttribute('class', 'JXGtext');
        } else {
            node.setAttribute('className', 9);
        }
        el.rendNodeText = document.createTextNode('');
        node.appendChild(el.rendNodeText);
        this.appendChildPrim(node, 9);
        return node;
    },

    // documented in AbstractRenderer
    updateInternalText: function (el) {
        var content = el.plaintext;

        el.rendNode.style.left = parseInt(el.coords.scrCoords[1]) + 'px';
        el.rendNode.style.top = parseInt(el.coords.scrCoords[2] - parseInt(el.visProp.fontsize) + this.vOffsetText) + 'px';
        
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
        // IE 8: Bilder ueber data URIs werden bis 32kB unterstuetzt.
        var node;

        node = this.container.ownerDocument.createElement('img');
        node.style.position = 'absolute';
        this._setAttr(node, 'id', this.container.id + '_' + el.id);

        this.container.appendChild(node);
        this.appendChildPrim(node, el.visProp.layer);

        // Adding the rotation filter. This is always filter item 0:
        // node.filters.item(0), see transformImage
        node.style.filter = node.style['-ms-filter'] = "progid:DXImageTransform.Microsoft.Matrix(M11='1.0', sizingMethod='auto expand')";

        el.rendNode = node;
        this.updateImage(el);
    },

    // already documented in JXG.AbstractRenderer
    transformImage: function (el, t) {
        var node = el.rendNode,
            m, p = [], s, len = t.length,
            maxX, maxY, minX, minY, i, nt;

        if (el.type === JXG.OBJECT_TYPE_TEXT) {
            el.updateSize();
        }
        if (len > 0) {
            nt = el.rendNode.style.filter.toString();
            if (!nt.match(/DXImageTransform/)) {
                node.style.filter = node.style['-ms-filter'] = "progid:DXImageTransform.Microsoft.Matrix(M11='1.0', sizingMethod='auto expand') " + nt;
            }

            m = this.joinTransforms(el, t);
            p[0] = JXG.Math.matVecMult(m, el.coords.scrCoords);
            p[0][1] /= p[0][0];
            p[0][2] /= p[0][0];
            p[1] = JXG.Math.matVecMult(m, [1, el.coords.scrCoords[1] + el.size[0], el.coords.scrCoords[2]]);
            p[1][1] /= p[1][0];
            p[1][2] /= p[1][0];
            p[2] = JXG.Math.matVecMult(m, [1, el.coords.scrCoords[1] + el.size[0], el.coords.scrCoords[2] - el.size[1]]);
            p[2][1] /= p[2][0];
            p[2][2] /= p[2][0];
            p[3] = JXG.Math.matVecMult(m, [1, el.coords.scrCoords[1], el.coords.scrCoords[2] - el.size[1]]);
            p[3][1] /= p[3][0];
            p[3][2] /= p[3][0];
            maxX = p[0][1];
            minX = p[0][1];
            maxY = p[0][2];
            minY = p[0][2];
            for (i = 1; i < 4; i++) {
                maxX = Math.max(maxX, p[i][1]);
                minX = Math.min(minX, p[i][1]);
                maxY = Math.max(maxY, p[i][2]);
                minY = Math.min(minY, p[i][2]);
            }
            node.style.left = parseInt(minX) + 'px';
            node.style.top  = parseInt(minY) + 'px';

            node.filters.item(0).M11 = m[1][1];
            node.filters.item(0).M12 = m[1][2];
            node.filters.item(0).M21 = m[2][1];
            node.filters.item(0).M22 = m[2][2];
        }
    },

    // already documented in JXG.AbstractRenderer
    updateImageURL: function (el) {
        var url = JXG.evaluate(el.url);
        this._setAttr(el.rendNode, 'src', url);
    },

    /* **************************
     * Render primitive objects
     * **************************/

    // already documented in JXG.AbstractRenderer
    appendChildPrim: function (node, level) {
        if (!JXG.exists(level)) {  // For trace nodes
            level = 0;
        }
        node.style.zIndex = level;
        this.container.appendChild(node);
    },

    // already documented in JXG.AbstractRenderer
    appendNodesToElement: function (element, type) {
        if (type === 'shape' || type === 'path' || type === 'polygon') {
            element.rendNodePath = this.getElementById(element.id + '_path');
        }
        element.rendNodeFill = this.getElementById(element.id + '_fill');
        element.rendNodeStroke = this.getElementById(element.id + '_stroke');
        element.rendNodeShadow = this.getElementById(element.id + '_shadow');
        element.rendNode = this.getElementById(element.id);
    },

    // already documented in JXG.AbstractRenderer
    createPrim: function (type, id) {
        var node,
            fillNode = this.createNode('fill'),
            strokeNode = this.createNode('stroke'),
            shadowNode = this.createNode('shadow'),
            pathNode;

        this._setAttr(fillNode, 'id', this.container.id + '_' + id + '_fill');
        this._setAttr(strokeNode, 'id', this.container.id + '_' + id + '_stroke');
        this._setAttr(shadowNode, 'id', this.container.id + '_' + id + '_shadow');

        if (type === 'circle' || type === 'ellipse') {
            node = this.createNode('oval');
            node.appendChild(fillNode);
            node.appendChild(strokeNode);
            node.appendChild(shadowNode);
        } else if (type === 'polygon' || type === 'path' || type === 'shape' || type === 'line') {
            node = this.createNode('shape');
            node.appendChild(fillNode);
            node.appendChild(strokeNode);
            node.appendChild(shadowNode);
            pathNode = this.createNode('path');
            this._setAttr(pathNode, 'id', this.container.id + '_' + id + '_path');
            node.appendChild(pathNode);
        } else {
            node = this.createNode(type);
            node.appendChild(fillNode);
            node.appendChild(strokeNode);
            node.appendChild(shadowNode);
        }
        node.style.position = 'absolute';
        node.style.left = '0px';
        node.style.top = '0px';
        this._setAttr(node, 'id', this.container.id + '_' + id);

        return node;
    },

    // already documented in JXG.AbstractRenderer
    remove: function (node) {
        if (JXG.exists(node)) {
            node.removeNode(true);
        }
    },

    // already documented in JXG.AbstractRenderer
    makeArrows: function (el) {
        var nodeStroke;

        if (el.visPropOld.firstarrow === el.visProp.firstarrow && el.visPropOld.lastarrow === el.visProp.lastarrow) {
            return;
        }

        if (el.visProp.firstarrow) {
            nodeStroke = el.rendNodeStroke;
            this._setAttr(nodeStroke, 'startarrow', 'block');
            this._setAttr(nodeStroke, 'startarrowlength', 'long');
        } else {
            nodeStroke = el.rendNodeStroke;
            if (JXG.exists(nodeStroke)) {
                this._setAttr(nodeStroke, 'startarrow', 'none');
            }
        }

        if (el.visProp.lastarrow) {
            nodeStroke = el.rendNodeStroke;
            this._setAttr(nodeStroke, 'id', this.container.id + '_' + el.id + "stroke");
            this._setAttr(nodeStroke, 'endarrow', 'block');
            this._setAttr(nodeStroke, 'endarrowlength', 'long');
        } else {
            nodeStroke = el.rendNodeStroke;
            if (JXG.exists(nodeStroke)) {
                this._setAttr(nodeStroke, 'endarrow', 'none');
            }
        }
        el.visPropOld.firstarrow = el.visProp.firstarrow;
        el.visPropOld.lastarrow = el.visProp.lastarrow;
    },

    // already documented in JXG.AbstractRenderer
    updateEllipsePrim: function (node, x, y, rx, ry) {
        node.style.left = parseInt(x - rx) + 'px';
        node.style.top =  parseInt(y - ry) + 'px';
        node.style.width = parseInt(rx * 2) + 'px';
        node.style.height = parseInt(ry * 2) + 'px';
    },

    // already documented in JXG.AbstractRenderer
    updateLinePrim: function (node, p1x, p1y, p2x, p2y, board) {
        var s, r = this.resolution;

        if (!isNaN(p1x+p1y+p2x+p2y)) {
            s = ['m ', parseInt(r * p1x), ', ', parseInt(r * p1y), ' l ', parseInt(r * p2x), ', ', parseInt(r * p2y)];
            this.updatePathPrim(node, s, board);
        }
    },

    // already documented in JXG.AbstractRenderer
    updatePathPrim: function (node, pointString, board) {
        var x = board.canvasWidth,
            y = board.canvasHeight;
        if (pointString.length <= 0) {
            pointString = ['m 0,0'];
        }
        node.style.width = x;
        node.style.height = y;
        this._setAttr(node, 'coordsize', [parseInt(this.resolution * x), parseInt(this.resolution * y)].join(','));
        this._setAttr(node, 'path', pointString.join(""));
    },

    // already documented in JXG.AbstractRenderer
    updatePathStringPoint: function (el, size, type) {
        var s = [],
            mround = Math.round,
            scr = el.coords.scrCoords,
            sqrt32 = size * Math.sqrt(3) * 0.5,
            s05 = size * 0.5,
            r = this.resolution;

        if (type === 'x') {
            s.push([
                ' m ', mround(r * (scr[1] - size)), ', ', mround(r * (scr[2] - size)),
                ' l ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2] + size)),
                ' m ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2] - size)),
                ' l ', mround(r * (scr[1] - size)), ', ', mround(r * (scr[2] + size))
            ].join(''));
        }
        else if (type === '+') {
            s.push([
                ' m ', mround(r * (scr[1] - size)), ', ', mround(r * (scr[2])),
                ' l ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2])),
                ' m ', mround(r * (scr[1])),        ', ', mround(r * (scr[2] - size)),
                ' l ', mround(r * (scr[1])),        ', ', mround(r * (scr[2] + size))
            ].join(''));
        }
        else if (type === '<>') {
            
            s.push([
                ' m ', mround(r * (scr[1] - size)), ', ', mround(r * (scr[2])),
                ' l ', mround(r * (scr[1])),        ', ', mround(r * (scr[2] + size)),
                ' l ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2])),
                ' l ', mround(r * (scr[1])),        ', ', mround(r * (scr[2] - size)),
                ' x e '
            ].join(''));
        }
        else if (type === '^') {
            s.push([
                ' m ', mround(r * (scr[1])),          ', ', mround(r * (scr[2] - size)),
                ' l ', mround(r * (scr[1] - sqrt32)), ', ', mround(r * (scr[2] + s05)),
                ' l ', mround(r * (scr[1] + sqrt32)), ', ', mround(r * (scr[2] + s05)),
                ' x e '
            ].join(''));
        }
        else if (type === 'v') {
            s.push([
                ' m ', mround(r * (scr[1])),          ', ', mround(r * (scr[2] + size)),
                ' l ', mround(r * (scr[1] - sqrt32)), ', ', mround(r * (scr[2] - s05)),
                ' l ', mround(r * (scr[1] + sqrt32)), ', ', mround(r * (scr[2] - s05)),
                ' x e '
            ].join(''));
        }
        else if (type === '>') {
            s.push([
                ' m ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2])),
                ' l ', mround(r * (scr[1] - s05)),  ', ', mround(r * (scr[2] - sqrt32)),
                ' l ', mround(r * (scr[1] - s05)),  ', ', mround(r * (scr[2] + sqrt32)),
                ' l ', mround(r * (scr[1] + size)), ', ', mround(r * (scr[2]))
            ].join(''));
        }
        else if (type === '<') {
            s.push([
                ' m ', mround(r * (scr[1] - size)), ', ', mround(r * (scr[2])),
                ' l ', mround(r * (scr[1] + s05)),  ', ', mround(r * (scr[2] - sqrt32)),
                ' l ', mround(r * (scr[1] + s05)),  ', ', mround(r * (scr[2] + sqrt32)),
                ' x e '
            ].join(''));
        }
        return s;
    },

    // already documented in JXG.AbstractRenderer
    updatePathStringPrim: function (el) {
        var pStr = [],
            i, scr,
            r = this.resolution,
            mround = Math.round,
            symbm = ' m ',
            symbl = ' l ',
            nextSymb = symbm,
            isNoPlot = (el.visProp.curvetype !== 'plot'),
            len = Math.min(el.numberPoints, 8192); // otherwise IE 7 crashes in hilbert.html

        if (el.numberPoints <= 0) {
            return '';
        }
        if (isNoPlot && el.board.options.curve.RDPsmoothing) {
            el.points = JXG.Math.Numerics.RamenDouglasPeuker(el.points, 1.0);
        }
        len = Math.min(len, el.points.length);

        for (i = 0; i < len; i++) {
            scr = el.points[i].scrCoords;
            if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
                nextSymb = symbm;
            } else {
                // IE has problems with values  being too far away.
                if (scr[1] > 20000.0) {
                    scr[1] = 20000.0;
                } else if (scr[1] < -20000.0) {
                    scr[1] = -20000.0;
                }

                if (scr[2] > 20000.0) {
                    scr[2] = 20000.0;
                } else if (scr[2] < -20000.0) {
                    scr[2] = -20000.0;
                }

                pStr.push([nextSymb, mround(r * scr[1]), ', ', mround(r * scr[2])].join(''));
                nextSymb = symbl;
            }
        }
        pStr.push(' e');
        return pStr;
    },

    // already documented in JXG.AbstractRenderer
    updatePolygonPrim: function (node, el) {
        var i,
            len = el.vertices.length,
            r = this.resolution,
            scr,
            pStr = [];

        this._setAttr(node, 'stroked', 'false');

        scr = el.vertices[0].coords.scrCoords;
        if (isNaN(scr[1]+scr[2])) return;
        pStr.push(["m ", parseInt(r * scr[1]), ",", parseInt(r * scr[2]), " l "].join(''));

        for (i = 1; i < len - 1; i++) {
            scr = el.vertices[i].coords.scrCoords;
            if (isNaN(scr[1]+scr[2])) return;
            pStr.push(parseInt(r * scr[1]) + "," + parseInt(r * scr[2]));
            if (i < len - 2) {
                pStr.push(", ");
            }
        }
        pStr.push(" x e");
        this.updatePathPrim(node, pStr, el.board);
    },

    // already documented in JXG.AbstractRenderer
    updateRectPrim: function (node, x, y, w, h) {
        node.style.left = parseInt(x) + 'px';
        node.style.top = parseInt(y) + 'px';

        if (w >= 0) {
            node.style.width = w + 'px';
        }
        
        if (h >= 0) {
            node.style.height = h + 'px';
        }
    },

    /* **************************
     *  Set Attributes
     * **************************/

    // already documented in JXG.AbstractRenderer
    setPropertyPrim: function (node, key, val) {
        var keyVml = '',
            v;

        switch (key) {
            case 'stroke':
                keyVml = 'strokecolor';
                break;
            case 'stroke-width':
                keyVml = 'strokeweight';
                break;
            case 'stroke-dasharray':
                keyVml = 'dashstyle';
                break;
        }

        if (keyVml !== '') {
            v = JXG.evaluate(val);
            this._setAttr(node, keyVml, v);
        }
    },

    // already documented in JXG.AbstractRenderer
    show: function (el) {
        if (el && el.rendNode) {
            el.rendNode.style.visibility = "inherit";
        }
    },

    // already documented in JXG.AbstractRenderer
    hide: function (el) {
        if (el && el.rendNode) {
            el.rendNode.style.visibility = "hidden";
        }
    },

    // already documented in JXG.AbstractRenderer
    setDashStyle: function (el, visProp) {
        var node;
        if (visProp.dash >= 0) {
            node = el.rendNodeStroke;
            this._setAttr(node, 'dashstyle', this.dashArray[visProp.dash]);
        }
    },

    // already documented in JXG.AbstractRenderer
    setGradient: function (el) {
        var nodeFill = el.rendNodeFill;
        
        if (el.visProp.gradient === 'linear') {
            this._setAttr(nodeFill, 'type', 'gradient');
            this._setAttr(nodeFill, 'color2', el.visProp.gradientsecondcolor);
            this._setAttr(nodeFill, 'opacity2', el.visProp.gradientsecondopacity);
            this._setAttr(nodeFill, 'angle', el.visProp.gradientangle);
        } else if (el.visProp.gradient === 'radial') {
            this._setAttr(nodeFill, 'type', 'gradientradial');
            this._setAttr(nodeFill, 'color2', el.visProp.gradientsecondcolor);
            this._setAttr(nodeFill, 'opacity2', el.visProp.gradientsecondopacity);
            this._setAttr(nodeFill, 'focusposition', el.visProp.gradientpositionx * 100 + '%,' + el.visProp.gradientpositiony * 100 + '%');
            this._setAttr(nodeFill, 'focussize', '0,0');
        } else {
            this._setAttr(nodeFill, 'type', 'solid');
        }
    },

    // already documented in JXG.AbstractRenderer
    setObjectFillColor: function (el, color, opacity) {
        var c = JXG.evaluate(color),
            o = JXG.evaluate(opacity), t;

        o = (o > 0) ? o : 0;

        if (el.visPropOld.fillcolor === c && el.visPropOld.fillopacity === o) {
            return;
        }

        if (c === 'none' || c === false) {
            this._setAttr(el.rendNode, 'filled', 'false');
        } else {
            this._setAttr(el.rendNode, 'filled', 'true');
            this._setAttr(el.rendNode, 'fillcolor', c);

            if (JXG.exists(o) && el.rendNodeFill) {
                this._setAttr(el.rendNodeFill, 'opacity', (o * 100) + '%');
            }
        }
        if (el.type === JXG.OBJECT_TYPE_IMAGE) {
            t = el.rendNode.style.filter.toString();
            if (t.match(/alpha/)) {
                el.rendNode.style.filter = t.replace(/alpha\(opacity *= *[0-9\.]+\)/, 'alpha(opacity = ' + (o * 100) + ')');
            } else {
                el.rendNode.style.filter += ' alpha(opacity = ' + (o * 100) +')';
            }
        }
        el.visPropOld.fillcolor = c;
        el.visPropOld.fillopacity = o;
    },

    // already documented in JXG.AbstractRenderer
    setObjectStrokeColor: function (el, color, opacity) {
        var c = JXG.evaluate(color),
            o = JXG.evaluate(opacity),
            node, nodeStroke;

        o = (o > 0) ? o : 0;

        if (el.visPropOld.strokecolor === c && el.visPropOld.strokeopacity === o) {
            return;
        }

        if (el.type === JXG.OBJECT_TYPE_TEXT) {
            el.rendNode.style.color = c;
        } else {
            node = el.rendNode;
            if (c !== false) {
                this._setAttr(node, 'stroked', 'true');
                this._setAttr(node, 'strokecolor', c);
            }

            nodeStroke = el.rendNodeStroke;
            if (JXG.exists(o)) {
                this._setAttr(nodeStroke, 'opacity', (o * 100) + '%');
            }
        }
        el.visPropOld.strokecolor = c;
        el.visPropOld.strokeopacity = o;
    },

    // already documented in JXG.AbstractRenderer
    setObjectStrokeWidth: function (el, width) {
        var w = JXG.evaluate(width),
            node;

        if (el.visPropOld.strokewidth === w) {
            return;
        }

        node = el.rendNode;
        this.setPropertyPrim(node, 'stroked', 'true');
        if (JXG.exists(w)) {
            this.setPropertyPrim(node, 'stroke-width', w);
        }
        el.visPropOld.strokewidth = w;
    },

    // already documented in JXG.AbstractRenderer
    setShadow: function (el) {
        var nodeShadow = el.rendNodeShadow;

        if (!nodeShadow || el.visPropOld.shadow === el.visProp.shadow) {
            return;
        }

        if (el.visProp.shadow) {
            this._setAttr(nodeShadow, 'On', 'True');
            this._setAttr(nodeShadow, 'Offset', '3pt,3pt');
            this._setAttr(nodeShadow, 'Opacity', '60%');
            this._setAttr(nodeShadow, 'Color', '#aaaaaa');
        } else {
            this._setAttr(nodeShadow, 'On', 'False');
        }

        el.visPropOld.shadow = el.visProp.shadow;
    },

    /* **************************
     * renderer control
     * **************************/

    // already documented in JXG.AbstractRenderer
    suspendRedraw: function () {
        this.container.style.display = 'none';
    },

    // already documented in JXG.AbstractRenderer
    unsuspendRedraw: function () {
        this.container.style.display = '';
    }

});