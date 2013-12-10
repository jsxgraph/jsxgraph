/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true */
/*jslint nomen: true, plusplus: true, newcap:true*/

/* depends:
 jxg
 options
 renderer/abstract
 base/constants
 utils/type
 utils/env
 utils/color
 math/numerics
*/

define([
    'jxg', 'options', 'renderer/abstract', 'base/constants', 'utils/type', 'utils/env', 'utils/color', 'math/numerics'
], function (JXG, Options, AbstractRenderer, Const, Type, Env, Color, Numerics) {

    "use strict";

    /**
     * Uses SVG to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
     * @class JXG.AbstractRenderer
     * @augments JXG.AbstractRenderer
     * @param {Node} container Reference to a DOM node containing the board.
     * @param {Object} dim The dimensions of the board
     * @param {Number} dim.width
     * @param {Number} dim.height
     * @see JXG.AbstractRenderer
     */
    JXG.SVGRenderer = function (container, dim) {
        var i;

        // docstring in AbstractRenderer
        this.type = 'svg';

        /**
         * SVG root node
         * @type Node
         */
        this.svgRoot = null;

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

        this.svgRoot.style.width = dim.width + 'px';
        this.svgRoot.style.height = dim.height + 'px';

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
        for (i = 0; i < Options.layer.numlayers; i++) {
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

    JXG.SVGRenderer.prototype = new AbstractRenderer();

    JXG.extend(JXG.SVGRenderer.prototype, /** @lends JXG.SVGRenderer.prototype */ {

        /**
         * Creates an arrow DOM node. Arrows are displayed in SVG with a <em>marker</em> tag.
         * @private
         * @param {JXG.GeometryElement} element A JSXGraph element, preferably one that can have an arrow attached.
         * @param {String} [idAppendix=''] A string that is added to the node's id.
         * @returns {Node} Reference to the node added to the DOM.
         */
        _createArrowHead: function (element, idAppendix) {
            var node2, node3,
                id = element.id + 'Triangle',
                s, d;

            if (Type.exists(idAppendix)) {
                id += idAppendix;
            }
            node2 = this.createPrim('marker', id);

            node2.setAttributeNS(null, 'stroke', Type.evaluate(element.visProp.strokecolor));
            node2.setAttributeNS(null, 'stroke-opacity', Type.evaluate(element.visProp.strokeopacity));
            node2.setAttributeNS(null, 'fill', Type.evaluate(element.visProp.strokecolor));
            node2.setAttributeNS(null, 'fill-opacity', Type.evaluate(element.visProp.strokeopacity));
            node2.setAttributeNS(null, 'stroke-width', 0);  // this is the stroke-width of the arrow head.
                                                            // Should be zero to make the positioning easy

            node2.setAttributeNS(null, 'orient', 'auto');
            node2.setAttributeNS(null, 'markerUnits', 'strokeWidth'); // 'strokeWidth' 'userSpaceOnUse');

            /*
            * Changes here are also necessary in _setArrowAtts()
            */
            s = parseInt(element.visProp.strokewidth, 10);
            //node2.setAttributeNS(null, 'viewBox', (-s) + ' ' + (-s) + ' ' + s * 12 + ' ' + s * 12);
            node2.setAttributeNS(null, 'viewBox', (-s) + ' ' + (-s) + ' ' + s * 10 + ' ' + s * 10);

            /*
               The arrow head is an equilateral triangle with base length 10 and height 10.
               This 10 units are scaled to strokeWidth*3 pixels or minimum 10 pixels.
               See also abstractRenderer.updateLine() where the line path is shortened accordingly.
            */
            d = Math.max(s * 3, 10);
            node2.setAttributeNS(null, 'markerHeight', d);
            node2.setAttributeNS(null, 'markerWidth', d);

            node3 = this.container.ownerDocument.createElementNS(this.svgNamespace, 'path');

            if (idAppendix === 'End') {     // First arrow
                node2.setAttributeNS(null, 'refY', 5);
                node2.setAttributeNS(null, 'refX', 10);
                node3.setAttributeNS(null, 'd', 'M 10 0 L 0 5 L 10 10 z');
            } else {                        // Last arrow
                node2.setAttributeNS(null, 'refY', 5);
                node2.setAttributeNS(null, 'refX', 0);
                node3.setAttributeNS(null, 'd', 'M 0 0 L 10 5 L 0 10 z');
            }

            node2.appendChild(node3);
            return node2;
        },

        /**
         * Updates an arrow DOM node.
         * @param {Node} node The arrow node.
         * @param {String} color Color value in a HTML compatible format, e.g. <tt>#00ff00</tt> or <tt>green</tt> for green.
         * @param {Number} opacity
         * @param {Number} width
         */
        _setArrowAtts: function (node, color, opacity, width) {
            var s, d;

            if (node) {
                node.setAttributeNS(null, 'stroke', color);
                node.setAttributeNS(null, 'stroke-opacity', opacity);
                node.setAttributeNS(null, 'fill', color);
                node.setAttributeNS(null, 'fill-opacity', opacity);

                // This is the stroke-width of the arrow head.
                // Should be zero to make the positioning easy
                node.setAttributeNS(null, 'stroke-width', 0);

                // The next lines are important if the strokeWidth of the line is changed.
                s = width;
                node.setAttributeNS(null, 'viewBox', (-s) + ' ' + (-s) + ' ' + s * 10 + ' ' + s * 10);
                d = Math.max(s * 3, 10);

                node.setAttributeNS(null, 'markerHeight', d);
                node.setAttributeNS(null, 'markerWidth', d);
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
        updateTicks: function (ticks) {
            var i, c, node, x, y,
                tickStr = '',
                len = ticks.ticks.length;

            for (i = 0; i < len; i++) {
                c = ticks.ticks[i];
                x = c[0];
                y = c[1];

                if (typeof x[0] === 'number' && typeof x[1] === 'number') {
                    tickStr += "M " + (x[0]) + " " + (y[0]) + " L " + (x[1]) + " " + (y[1]) + " ";
                }
            }

            node = ticks.rendNode;

            if (!Type.exists(node)) {
                node = this.createPrim('path', ticks.id);
                this.appendChildPrim(node, ticks.visProp.layer);
                ticks.rendNode = node;
            }

            node.setAttributeNS(null, 'stroke', ticks.visProp.strokecolor);
            node.setAttributeNS(null, 'stroke-opacity', ticks.visProp.strokeopacity);
            node.setAttributeNS(null, 'stroke-width', ticks.visProp.strokewidth);
            this.updatePathPrim(node, tickStr, ticks.board);
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

            node.setAttributeNS(null, "class", el.visProp.cssclass);
            //node.setAttributeNS(null, "style", "alignment-baseline:middle"); // Not yet supported by Firefox
            el.rendNodeText = document.createTextNode('');
            node.appendChild(el.rendNodeText);
            this.appendChildPrim(node,  el.visProp.layer);

            return node;
        },

        // already documented in JXG.AbstractRenderer
        updateInternalText: function (el) {
            var content = el.plaintext, v;

            // el.rendNode.setAttributeNS(null, "class", el.visProp.cssclass);
            if (!isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {

                // Horizontal
                v = el.coords.scrCoords[1];
                if (el.visPropOld.left !== (el.visProp.anchorx + v)) {
                    el.rendNode.setAttributeNS(null, 'x', v + 'px');

                    if (el.visProp.anchorx === 'left') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'start');
                    } else if (el.visProp.anchorx === 'right') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'end');
                    } else if (el.visProp.anchorx === 'middle') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'middle');
                    }
                    el.visPropOld.left = el.visProp.anchorx + v;
                }

                // Vertical
                v = el.coords.scrCoords[2];
                if (el.visPropOld.top !== (el.visProp.anchory + v)) {
                    el.rendNode.setAttributeNS(null, 'y', (v + this.vOffsetText * 0.5) + 'px');

                    if (el.visProp.anchory === 'bottom') {
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-after-edge');
                    } else if (el.visProp.anchory === 'top') {
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-before-edge');
                    } else if (el.visProp.anchory === 'middle') {
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'middle');
                    }
                    el.visPropOld.top = el.visProp.anchory + v;
                }
            }
            if (el.htmlStr !== content) {
                el.rendNodeText.data = content;
                el.htmlStr = content;
            }
            this.transformImage(el, el.transformations);
        },

        /**
         * Set color and opacity of internal texts.
         * SVG needs its own version.
         * @private
         * @see JXG.AbstractRenderer#updateTextStyle
         * @see JXG.AbstractRenderer#updateInternalTextStyle
         */
        updateInternalTextStyle: function (element, strokeColor, strokeOpacity) {
            this.setObjectFillColor(element, strokeColor, strokeOpacity);
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
            var s, m,
                node = el.rendNode,
                str = "",
                len = t.length;

            if (len > 0) {
                m = this.joinTransforms(el, t);
                s = [m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]].join(',');
                str += ' matrix(' + s + ') ';
                node.setAttributeNS(null, 'transform', str);
            }
        },

        // already documented in JXG.AbstractRenderer
        updateImageURL: function (el) {
            var url = Type.evaluate(el.url);

            el.rendNode.setAttributeNS(this.xlinkNamespace, 'xlink:href', url);
        },

        // already documented in JXG.AbstractRenderer
        updateImageStyle: function (el, doHighlight) {
            var css = doHighlight ? el.visProp.highlightcssclass : el.visProp.cssclass;

            el.rendNode.setAttributeNS(null, 'class', css);
        },

        /* **************************
         * Render primitive objects
         * **************************/

        // already documented in JXG.AbstractRenderer
        appendChildPrim: function (node, level) {
            if (!Type.exists(level)) { // trace nodes have level not set
                level = 0;
            } else if (level >= Options.layer.numlayers) {
                level = Options.layer.numlayers - 1;
            }

            this.layer[level].appendChild(node);

            return node;
        },

        // already documented in JXG.AbstractRenderer
        /*
        appendNodesToElement: function (element) {
            element.rendNode = this.getElementById(element.id);
        },
        */

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
            if (Type.exists(shape) && Type.exists(shape.parentNode)) {
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
                if (!Type.exists(node2)) {
                    node2 = this._createArrowHead(el, 'End');
                    this.defs.appendChild(node2);
                    el.rendNodeTriangleStart = node2;
                    el.rendNode.setAttributeNS(null, 'marker-start', 'url(#' + this.container.id + '_' + el.id + 'TriangleEnd)');
                } else {
                    this.defs.appendChild(node2);
                }
            } else {
                node2 = el.rendNodeTriangleStart;
                if (Type.exists(node2)) {
                    this.remove(node2);
                }
            }
            if (el.visProp.lastarrow) {
                node2 = el.rendNodeTriangleEnd;
                if (!Type.exists(node2)) {
                    node2 = this._createArrowHead(el, 'Start');
                    this.defs.appendChild(node2);
                    el.rendNodeTriangleEnd = node2;
                    el.rendNode.setAttributeNS(null, 'marker-end', 'url(#' + this.container.id + '_' + el.id + 'TriangleStart)');
                } else {
                    this.defs.appendChild(node2);
                }
            } else {
                node2 = el.rendNodeTriangleEnd;
                if (Type.exists(node2)) {
                    this.remove(node2);
                }
            }
            el.visPropOld.firstarrow = el.visProp.firstarrow;
            el.visPropOld.lastarrow = el.visProp.lastarrow;
        },

        // already documented in JXG.AbstractRenderer
        updateEllipsePrim: function (node, x, y, rx, ry) {
            var huge = 1000000;

            // webkit does not like huge values if the object is dashed
            x = Math.abs(x) < huge ? x : huge * x / Math.abs(x);
            y = Math.abs(y) < huge ? y : huge * y / Math.abs(y);
            rx = Math.abs(rx) < huge ? rx : huge * rx / Math.abs(rx);
            ry = Math.abs(ry) < huge ? ry : huge * ry / Math.abs(ry);

            node.setAttributeNS(null, 'cx', x);
            node.setAttributeNS(null, 'cy', y);
            node.setAttributeNS(null, 'rx', Math.abs(rx));
            node.setAttributeNS(null, 'ry', Math.abs(ry));
        },

        // already documented in JXG.AbstractRenderer
        updateLinePrim: function (node, p1x, p1y, p2x, p2y) {
            var huge = 1000000;

            if (!isNaN(p1x + p1y + p2x + p2y)) {
                // webkit does not like huge values if the object is dashed
                p1x = Math.abs(p1x) < huge ? p1x : huge * p1x / Math.abs(p1x);
                p1y = Math.abs(p1y) < huge ? p1y : huge * p1y / Math.abs(p1y);
                p2x = Math.abs(p2x) < huge ? p2x : huge * p2x / Math.abs(p2x);
                p2y = Math.abs(p2y) < huge ? p2y : huge * p2y / Math.abs(p2y);

                node.setAttributeNS(null, 'x1', p1x);
                node.setAttributeNS(null, 'y1', p1y);
                node.setAttributeNS(null, 'x2', p2x);
                node.setAttributeNS(null, 'y2', p2y);
            }
        },

        // already documented in JXG.AbstractRenderer
        updatePathPrim: function (node, pointString) {
            if (pointString === '') {
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
            var i, scr, len,
                symbm = ' M ',
                symbl = ' L ',
                symbc = ' C ',
                nextSymb = symbm,
                maxSize = 5000.0,
                pStr = '',
                isNotPlot = (el.visProp.curvetype !== 'plot');

            if (el.numberPoints <= 0) {
                return '';
            }

            len = Math.min(el.points.length, el.numberPoints);

            if (el.bezierDegree === 1) {
                if (isNotPlot && el.board.options.curve.RDPsmoothing) {
                    el.points = Numerics.RamerDouglasPeuker(el.points, 0.5);
                }

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
                        //pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                        pStr += nextSymb + scr[1] + ' ' + scr[2];   // Seems to be faster on now (webkit and firefox)
                        nextSymb = symbl;
                    }
                }
            } else if (el.bezierDegree === 3) {
                i = 0;
                while (i < len) {
                    scr = el.points[i].scrCoords;
                    if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
                        nextSymb = symbm;
                    } else {
                        pStr += nextSymb + scr[1] + ' ' + scr[2];
                        if (nextSymb === symbc) {
                            i += 1;
                            scr = el.points[i].scrCoords;
                            pStr += ' ' + scr[1] + ' ' + scr[2];
                            i += 1;
                            scr = el.points[i].scrCoords;
                            pStr += ' ' + scr[1] + ' ' + scr[2];
                        }
                        nextSymb = symbc;
                    }
                    i += 1;
                }
            }
            return pStr;
        },

        // already documented in JXG.AbstractRenderer
        updatePathStringBezierPrim: function (el) {
            var i, j, k, scr, lx, ly, len,
                symbm = ' M ',
                symbl = ' C ',
                nextSymb = symbm,
                maxSize = 5000.0,
                pStr = '',
                f = el.visProp.strokewidth,
                isNoPlot = (el.visProp.curvetype !== 'plot');

            if (el.numberPoints <= 0) {
                return '';
            }

            if (isNoPlot && el.board.options.curve.RDPsmoothing) {
                el.points = Numerics.RamerDouglasPeuker(el.points, 0.5);
            }

            len = Math.min(el.points.length, el.numberPoints);
            for (j = 1; j < 3; j++) {
                nextSymb = symbm;
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
                        if (nextSymb === symbm) {
                            pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                        } else {
                            k = 2 * j;
                            pStr += [nextSymb,
                                (lx + (scr[1] - lx) * 0.333 + f * (k * Math.random() - j)), ' ',
                                (ly + (scr[2] - ly) * 0.333 + f * (k * Math.random() - j)), ' ',
                                (lx + (scr[1] - lx) * 0.666 + f * (k * Math.random() - j)), ' ',
                                (ly + (scr[2] - ly) * 0.666 + f * (k * Math.random() - j)), ' ',
                                scr[1], ' ', scr[2]].join('');
                        }

                        nextSymb = symbl;
                        lx = scr[1];
                        ly = scr[2];
                    }
                }
            }
            return pStr;
        },

        // already documented in JXG.AbstractRenderer
        updatePolygonPrim: function (node, el) {
            var i,
                pStr = '',
                scrCoords,
                len = el.vertices.length;

            node.setAttributeNS(null, 'stroke', 'none');

            for (i = 0; i < len - 1; i++) {
                if (el.vertices[i].isReal) {
                    scrCoords = el.vertices[i].coords.scrCoords;
                    pStr = pStr + scrCoords[1] + "," + scrCoords[2];
                } else {
                    node.setAttributeNS(null, 'points', '');
                    return;
                }

                if (i < len - 2) {
                    pStr += " ";
                }
            }
            if (pStr.indexOf('NaN') === -1) {
                node.setAttributeNS(null, 'points', pStr);
            }
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

//console.log((typeof el.rendNode) + ' ' + (typeof el.rendNode.style));
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

            op = Type.evaluate(el.visProp.fillopacity);
            op = (op > 0) ? op : 0;

            col = Type.evaluate(el.visProp.fillcolor);

            if (el.visProp.gradient === 'linear') {
                node = this.createPrim('linearGradient', el.id + '_gradient');
                x1 = '0%';
                x2 = '100%';
                y1 = '0%';
                y2 = '0%';

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
            var col, op,
                node2 = el.gradNode1,
                node3 = el.gradNode2;

            if (!Type.exists(node2) || !Type.exists(node3)) {
                return;
            }

            op = Type.evaluate(el.visProp.fillopacity);
            op = (op > 0) ? op : 0;

            col = Type.evaluate(el.visProp.fillcolor);

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
            var node, c, rgbo, oo,
                rgba = Type.evaluate(color),
                o = Type.evaluate(opacity);

            o = (o > 0) ? o : 0;

            if (el.visPropOld.fillcolor === rgba && el.visPropOld.fillopacity === o) {
                return;
            }
            if (Type.exists(rgba) && rgba !== false) {
                if (rgba.length !== 9) {          // RGB, not RGBA
                    c = rgba;
                    oo = o;
                } else {                       // True RGBA, not RGB
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }

                node = el.rendNode;

                if (c !== 'none') {               // problem in firefox 17
                    node.setAttributeNS(null, 'fill', c);
                } else {
                    oo = 0;
                }

                if (el.type === JXG.OBJECT_TYPE_IMAGE) {
                    node.setAttributeNS(null, 'opacity', oo);
                } else {
                    node.setAttributeNS(null, 'fill-opacity', oo);
                }

                if (Type.exists(el.visProp.gradient)) {
                    this.updateGradient(el);
                }
            }
            el.visPropOld.fillcolor = rgba;
            el.visPropOld.fillopacity = o;
        },

        // documented in JXG.AbstractRenderer
        setObjectStrokeColor: function (el, color, opacity) {
            var rgba = Type.evaluate(color), c, rgbo,
                o = Type.evaluate(opacity), oo,
                node;

            o = (o > 0) ? o : 0;

            if (el.visPropOld.strokecolor === rgba && el.visPropOld.strokeopacity === o) {
                return;
            }

            if (Type.exists(rgba) && rgba !== false) {
                if (rgba.length !== 9) {          // RGB, not RGBA
                    c = rgba;
                    oo = o;
                } else {                       // True RGBA, not RGB
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }

                node = el.rendNode;

                if (el.type === Const.OBJECT_TYPE_TEXT) {
                    if (el.visProp.display === 'html') {
                        node.style.color = c;
                        node.style.opacity = oo;
                    } else {
                        node.setAttributeNS(null, "style", "fill:" + c);
                        node.setAttributeNS(null, "style", "fill-opacity:" + oo);
                    }
                } else {
                    node.setAttributeNS(null, 'stroke', c);
                    node.setAttributeNS(null, 'stroke-opacity', oo);
                }

                if (el.type === Const.OBJECT_TYPE_ARROW) {
                    this._setArrowAtts(el.rendNodeTriangle, c, oo, el.visProp.strokewidth);
                } else if (el.elementClass === Const.OBJECT_CLASS_CURVE || el.elementClass === Const.OBJECT_CLASS_LINE) {
                    if (el.visProp.firstarrow) {
                        this._setArrowAtts(el.rendNodeTriangleStart, c, oo, el.visProp.strokewidth);
                    }

                    if (el.visProp.lastarrow) {
                        this._setArrowAtts(el.rendNodeTriangleEnd, c, oo, el.visProp.strokewidth);
                    }
                }
            }

            el.visPropOld.strokecolor = rgba;
            el.visPropOld.strokeopacity = o;
        },

        // documented in JXG.AbstractRenderer
        setObjectStrokeWidth: function (el, width) {
            var node,
                w = Type.evaluate(width);

            if (isNaN(w) || el.visPropOld.strokewidth === w) {
                return;
            }

            node = el.rendNode;
            this.setPropertyPrim(node, 'stroked', 'true');
            if (Type.exists(w)) {
                this.setPropertyPrim(node, 'stroke-width', w + 'px');

                if (el.type === Const.OBJECT_TYPE_ARROW) {
                    this._setArrowAtts(el.rendNodeTriangle, el.visProp.strokecolor, el.visProp.strokeopacity, w);
                } else if (el.elementClass === Const.OBJECT_CLASS_CURVE || el.elementClass === Const.OBJECT_CLASS_LINE) {
                    if (el.visProp.firstarrow) {
                        this._setArrowAtts(el.rendNodeTriangleStart, el.visProp.strokecolor, el.visProp.strokeopacity, w);
                    }

                    if (el.visProp.lastarrow) {
                        this._setArrowAtts(el.rendNodeTriangleEnd, el.visProp.strokecolor, el.visProp.strokeopacity, w);
                    }
                }
            }
            el.visPropOld.strokewidth = w;
        },

        // documented in JXG.AbstractRenderer
        setShadow: function (el) {
            if (el.visPropOld.shadow === el.visProp.shadow) {
                return;
            }

            if (Type.exists(el.rendNode)) {
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
            //this.suspendHandle = this.svgRoot.suspendRedraw(10000);
        },

        // documented in JXG.AbstractRenderer
        unsuspendRedraw: function () {
            //this.svgRoot.unsuspendRedraw(this.suspendHandle);
            //this.svgRoot.unsuspendRedrawAll();
            //this.svgRoot.forceRedraw();
        },

        // documented in AbstractRenderer
        resize: function (w, h) {
            this.svgRoot.style.width = parseFloat(w) + 'px';
            this.svgRoot.style.height = parseFloat(h) + 'px';
        },

        // documented in JXG.AbstractRenderer
        createTouchpoints: function (n) {
            var i, na1, na2, node;
            this.touchpoints = [];
            for (i = 0; i < n; i++) {
                na1 = 'touchpoint1_' + i;
                node = this.createPrim('path', na1);
                this.appendChildPrim(node, 19);
                node.setAttributeNS(null, 'd', 'M 0 0');
                this.touchpoints.push(node);

                this.setPropertyPrim(node, 'stroked', 'true');
                this.setPropertyPrim(node, 'stroke-width', '1px');
                node.setAttributeNS(null, 'stroke', '#000000');
                node.setAttributeNS(null, 'stroke-opacity', 1.0);
                node.setAttributeNS(null, 'display', 'none');

                na2 = 'touchpoint2_' + i;
                node = this.createPrim('ellipse', na2);
                this.appendChildPrim(node, 19);
                this.updateEllipsePrim(node, 0, 0, 0, 0);
                this.touchpoints.push(node);

                this.setPropertyPrim(node, 'stroked', 'true');
                this.setPropertyPrim(node, 'stroke-width', '1px');
                node.setAttributeNS(null, 'stroke', '#000000');
                node.setAttributeNS(null, 'stroke-opacity', 1.0);
                node.setAttributeNS(null, 'fill', '#ffffff');
                node.setAttributeNS(null, 'fill-opacity', 0.0);

                node.setAttributeNS(null, 'display', 'none');
            }
        },

        // documented in JXG.AbstractRenderer
        showTouchpoint: function (i) {
            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                this.touchpoints[2 * i].setAttributeNS(null, 'display', 'inline');
                this.touchpoints[2 * i + 1].setAttributeNS(null, 'display', 'inline');
            }
        },

        // documented in JXG.AbstractRenderer
        hideTouchpoint: function (i) {
            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                this.touchpoints[2 * i].setAttributeNS(null, 'display', 'none');
                this.touchpoints[2 * i + 1].setAttributeNS(null, 'display', 'none');
            }
        },

        // documented in JXG.AbstractRenderer
        updateTouchpoint: function (i, pos) {
            var x, y,
                d = 37;

            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                x = pos[0];
                y = pos[1];

                this.touchpoints[2 * i].setAttributeNS(null, 'd', 'M ' + (x - d) + ' ' + y + ' ' +
                    'L ' + (x + d) + ' ' + y + ' ' +
                    'M ' + x + ' ' + (y - d) + ' ' +
                    'L ' + x + ' ' + (y + d));
                this.updateEllipsePrim(this.touchpoints[2 * i + 1], pos[0], pos[1], 25, 25);
            }
        }
    });

    return JXG.SVGRenderer;
});
