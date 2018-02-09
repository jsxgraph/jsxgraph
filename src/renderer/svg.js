/*
    Copyright 2008-2018
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
    'jxg', 'options', 'renderer/abstract', 'base/constants', 'utils/type', 'utils/env', 'utils/color', 'utils/base64', 'math/numerics'
], function (JXG, Options, AbstractRenderer, Const, Type, Env, Color, Base64, Numerics) {

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

        this.isIE = navigator.appVersion.indexOf("MSIE") !== -1 || navigator.userAgent.match(/Trident\//);

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
        this.container.style.userSelect = 'none';

        this.container.style.overflow = 'hidden';
        if (this.container.style.position === '') {
            this.container.style.position = 'relative';
        }

        this.svgRoot = this.container.ownerDocument.createElementNS(this.svgNamespace, "svg");
        this.svgRoot.style.overflow = 'hidden';

        this.resize(dim.width, dim.height);

        //this.svgRoot.setAttributeNS(null, 'shape-rendering', 'crispEdge'); //'optimizeQuality'); //geometricPrecision');

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
        /*
        this.filter.setAttributeNS(null, 'x', '-100%');
        this.filter.setAttributeNS(null, 'y', '-100%');
        this.filter.setAttributeNS(null, 'width', '400%');
        this.filter.setAttributeNS(null, 'height', '400%');
        //this.filter.setAttributeNS(null, 'filterUnits', 'userSpaceOnUse');
        */
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

        // already documented in JXG.AbstractRenderer
        this.supportsForeignObject = document.implementation.hasFeature("http://w3.org/TR/SVG11/feature#Extensibility", "1.1");

        if (this.supportsForeignObject) {
            this.foreignObjLayer = this.container.ownerDocument.createElementNS(this.svgNamespace, 'foreignObject');
            this.foreignObjLayer.setAttribute("x",0);
            this.foreignObjLayer.setAttribute("y",0);
            this.foreignObjLayer.setAttribute("width","100%");
            this.foreignObjLayer.setAttribute("height","100%");
            this.foreignObjLayer.setAttribute('id', this.container.id + '_foreignObj');
            this.svgRoot.appendChild(this.foreignObjLayer);
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
         * @param {JXG.GeometryElement} el A JSXGraph element, preferably one that can have an arrow attached.
         * @param {String} [idAppendix=''] A string that is added to the node's id.
         * @returns {Node} Reference to the node added to the DOM.
         */
        _createArrowHead: function (el, idAppendix) {
            var node2, node3,
                id = el.id + 'Triangle',
                type = null,
                w, s,
                ev_fa = Type.evaluate(el.visProp.firstarrow),
                ev_la = Type.evaluate(el.visProp.lastarrow);

            if (Type.exists(idAppendix)) {
                id += idAppendix;
            }
            node2 = this.createPrim('marker', id);

            node2.setAttributeNS(null, 'stroke', Type.evaluate(el.visProp.strokecolor));
            node2.setAttributeNS(null, 'stroke-opacity', Type.evaluate(el.visProp.strokeopacity));
            node2.setAttributeNS(null, 'fill', Type.evaluate(el.visProp.strokecolor));
            node2.setAttributeNS(null, 'fill-opacity', Type.evaluate(el.visProp.strokeopacity));
            node2.setAttributeNS(null, 'stroke-width', 0);  // this is the stroke-width of the arrow head.
                                                            // Should be zero to simplify the calculations

            node2.setAttributeNS(null, 'orient', 'auto');
            node2.setAttributeNS(null, 'markerUnits', 'strokeWidth'); // 'strokeWidth' 'userSpaceOnUse');

            /*
               The arrow head is an isosceles triangle with base length 10 and height 10.
               This 10 units are scaled to strokeWidth * arrowSize pixels, see
               this._setArrowWidth().

               See also abstractRenderer.updateLine() where the line path is shortened accordingly.

               Changes here are also necessary in setArrowWidth().
            */
            node3 = this.container.ownerDocument.createElementNS(this.svgNamespace, 'path');
            if (idAppendix === 'End') {
                // First arrow
                if (JXG.exists(ev_fa.type)) {
                    type = Type.evaluate(ev_fa.type);
                }

                node2.setAttributeNS(null, 'refY', 5);
                if (type === 2) {
                    node2.setAttributeNS(null, 'refX', 4.9);
                    node3.setAttributeNS(null, 'd', 'M 10,0 L 0,5 L 10,10 L 5,5 z');
                } else if (type === 3) {
                        node2.setAttributeNS(null, 'refX', 3.33);
                        node3.setAttributeNS(null, 'd', 'M 0,0 L 3.33,0 L 3.33,10 L 0,10 z');
                } else {
                    node2.setAttributeNS(null, 'refX', 9.9);
                    node3.setAttributeNS(null, 'd', 'M 10,0 L 0,5 L 10,10 z');
                }
            } else {
                // Last arrow
                if (JXG.exists(ev_la.type)) {
                    type = Type.evaluate(ev_la.type);
                }

                node2.setAttributeNS(null, 'refY', 5);
                if (type === 2) {
                    node2.setAttributeNS(null, 'refX', 5.1);
                    node3.setAttributeNS(null, 'd', 'M 0,0 L 10,5 L 0,10 L 5,5 z');
                } else if (type === 3) {
                    node2.setAttributeNS(null, 'refX', 0.1);
                    node3.setAttributeNS(null, 'd', 'M 0,0 L 3.33,0 L 3.33,10 L 0,10 z');
                } else {
                    node2.setAttributeNS(null, 'refX', 0.1);
                    node3.setAttributeNS(null, 'd', 'M 0,0 L 10,5 L 0,10 z');
                }
            }

            node2.appendChild(node3);
            return node2;
        },

        /**
         * Updates color of an arrow DOM node.
         * @param {Node} node The arrow node.
         * @param {String} color Color value in a HTML compatible format, e.g. <tt>#00ff00</tt> or <tt>green</tt> for green.
         * @param {Number} opacity
         * @param {JXG.GeometryElement} el The element the arrows are to be attached to
         */
        _setArrowColor: function (node, color, opacity, el) {
            var s, d;

            if (node) {
                if (Type.isString(color)) {
                    this._setAttribute(function() {
                        node.setAttributeNS(null, 'stroke', color);
                        node.setAttributeNS(null, 'fill', color);
                        node.setAttributeNS(null, 'stroke-opacity', opacity);
                        node.setAttributeNS(null, 'fill-opacity', opacity);
                    }, el.visPropOld.fillcolor);
                }

                if (this.isIE) {
                    el.rendNode.parentNode.insertBefore(el.rendNode, el.rendNode);
                }
            }

        },

        // already documented in JXG.AbstractRenderer
        _setArrowWidth: function (node, width, parentNode, size) {
            var s, d;

            if (node) {
                if (width === 0) {
                    node.setAttributeNS(null, 'display', 'none');
                } else {
                    s = width;
                    d = s * size;
                    node.setAttributeNS(null, 'viewBox', (0) + ' ' + (0) + ' ' + (s * 10) + ' ' + (s * 10));
                    node.setAttributeNS(null, 'markerHeight', d);
                    node.setAttributeNS(null, 'markerWidth', d);
                    node.setAttributeNS(null, 'display', 'inherit');
                }

                if (this.isIE) {
                    parentNode.parentNode.insertBefore(parentNode, parentNode);
                }
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

                if (Type.isNumber(x[0]) && Type.isNumber(x[1])) {
                    tickStr += "M " + (x[0]) + " " + (y[0]) + " L " + (x[1]) + " " + (y[1]) + " ";
                }
            }

            node = ticks.rendNode;

            if (!Type.exists(node)) {
                node = this.createPrim('path', ticks.id);
                this.appendChildPrim(node, Type.evaluate(ticks.visProp.layer));
                ticks.rendNode = node;
            }

            node.setAttributeNS(null, 'stroke', Type.evaluate(ticks.visProp.strokecolor));
            node.setAttributeNS(null, 'stroke-opacity', Type.evaluate(ticks.visProp.strokeopacity));
            node.setAttributeNS(null, 'stroke-width', Type.evaluate(ticks.visProp.strokewidth));
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
            t = this.container.ownerDocument.createTextNode(str);
            node.appendChild(t);
            this.appendChildPrim(node, 0);
        },

        // already documented in JXG.AbstractRenderer
        drawInternalText: function (el) {
            var node = this.createPrim('text', el.id);

            //node.setAttributeNS(null, "style", "alignment-baseline:middle"); // Not yet supported by Firefox
            // Preserve spaces
            //node.setAttributeNS("http://www.w3.org/XML/1998/namespace", "space", "preserve");
            node.style.whiteSpace = 'nowrap';

            el.rendNodeText = this.container.ownerDocument.createTextNode('');
            node.appendChild(el.rendNodeText);
            this.appendChildPrim(node,  Type.evaluate(el.visProp.layer));

            return node;
        },

        // already documented in JXG.AbstractRenderer
        updateInternalText: function (el) {
            var content = el.plaintext, v,
                ev_ax = el.getAnchorX(),
                ev_ay = el.getAnchorY();

            if (el.rendNode.getAttributeNS(null, "class") !== el.visProp.cssclass) {
                el.rendNode.setAttributeNS(null, "class", Type.evaluate(el.visProp.cssclass));
                el.needsSizeUpdate = true;
            }

            if (!isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {
                // Horizontal
                v = el.coords.scrCoords[1];
                if (el.visPropOld.left !== (ev_ax + v)) {
                    el.rendNode.setAttributeNS(null, 'x', v + 'px');

                    if (ev_ax === 'left') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'start');
                    } else if (ev_ax === 'right') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'end');
                    } else if (ev_ax === 'middle') {
                        el.rendNode.setAttributeNS(null, 'text-anchor', 'middle');
                    }
                    el.visPropOld.left = ev_ax + v;
                }

                // Vertical
                v = el.coords.scrCoords[2];
                if (el.visPropOld.top !== (ev_ay + v)) {
                    el.rendNode.setAttributeNS(null, 'y', (v + this.vOffsetText * 0.5) + 'px');

                    if (ev_ay === 'bottom') {
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-after-edge');
                    } else if (ev_ay === 'top') {
                        el.rendNode.setAttributeNS(null, 'dy', '1.6ex');
                        //el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-before-edge'); // Not supported by IE, edge
                    } else if (ev_ay === 'middle') {
                        //el.rendNode.setAttributeNS(null, 'dominant-baseline', 'middle');
                        el.rendNode.setAttributeNS(null, 'dy', '0.6ex');
                    }
                    el.visPropOld.top = ev_ay + v;
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
        updateInternalTextStyle: function (el, strokeColor, strokeOpacity, duration) {
            this.setObjectFillColor(el, strokeColor, strokeOpacity);
        },

        /* **************************
         *    Image related stuff
         * **************************/

        // already documented in JXG.AbstractRenderer
        drawImage: function (el) {
            var node = this.createPrim('image', el.id);

            node.setAttributeNS(null, 'preserveAspectRatio', 'none');
            this.appendChildPrim(node, Type.evaluate(el.visProp.layer));
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
            var css = Type.evaluate(doHighlight ? el.visProp.highlightcssclass : el.visProp.cssclass);

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
        createPrim: function (type, id) {
            var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
            node.setAttributeNS(null, 'id', this.container.id + '_' + id);
            node.style.position = 'absolute';
            if (type === 'path') {
                node.setAttributeNS(null, 'stroke-linecap', 'round');
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
            var node2,
                ev_fa = Type.evaluate(el.visProp.firstarrow),
                ev_la = Type.evaluate(el.visProp.lastarrow);

            if (el.visPropOld.firstarrow === ev_fa &&
                el.visPropOld.lastarrow === ev_la) {
                if (this.isIE && el.visPropCalc.visible &&
                    (ev_fa || ev_la)) {
                    el.rendNode.parentNode.insertBefore(el.rendNode, el.rendNode);
                }
                return;
            }

            if (ev_fa) {
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
            if (ev_la) {
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
            el.visPropOld.firstarrow = ev_fa;
            el.visPropOld.lastarrow = ev_la;
        },

        // already documented in JXG.AbstractRenderer
        updateEllipsePrim: function (node, x, y, rx, ry) {
            var huge = 1000000;

            huge = 200000; // IE
            // webkit does not like huge values if the object is dashed
            // iE doesn't like huge values above 216000
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

            huge = 200000; //IE
            if (!isNaN(p1x + p1y + p2x + p2y)) {
                // webkit does not like huge values if the object is dashed
                // IE doesn't like huge values above 216000
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
                pStr = '';

            if (el.numberPoints <= 0) {
                return '';
            }

            len = Math.min(el.points.length, el.numberPoints);

            if (el.bezierDegree === 1) {
                for (i = 0; i < len; i++) {
                    scr = el.points[i].scrCoords;
                    if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
                        nextSymb = symbm;
                    } else {
                        // Chrome has problems with values being too far away.
                        scr[1] = Math.max(Math.min(scr[1], maxSize), -maxSize);
                        scr[2] = Math.max(Math.min(scr[2], maxSize), -maxSize);

                        // Attention: first coordinate may be inaccurate if far way
                        //pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                        pStr += nextSymb + scr[1] + ' ' + scr[2];   // Seems to be faster now (webkit and firefox)
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
                f = Type.evaluate(el.visProp.strokewidth),
                isNoPlot = (Type.evaluate(el.visProp.curvetype) !== 'plot');

            if (el.numberPoints <= 0) {
                return '';
            }

            if (isNoPlot && el.board.options.curve.RDPsmoothing) {
                el.points = Numerics.RamerDouglasPeucker(el.points, 0.5);
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
                        scr[1] = Math.max(Math.min(scr[1], maxSize), -maxSize);
                        scr[2] = Math.max(Math.min(scr[2], maxSize), -maxSize);

                        // Attention: first coordinate may be inaccurate if far way
                        if (nextSymb === symbm) {
                            //pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                            pStr += nextSymb + scr[1] + ' ' + scr[2];   // Seems to be faster now (webkit and firefox)
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

        display: function(el, val) {
            var node;

            if (el && el.rendNode) {
                el.visPropOld.visible = val;
                node = el.rendNode;
                if (val) {
                    node.setAttributeNS(null, 'display', 'inline');
                    node.style.visibility = "inherit";
                } else {
                    node.setAttributeNS(null, 'display', 'none');
                    node.style.visibility = "hidden";
                }
            }
        },

        // documented in JXG.AbstractRenderer
        show: function (el) {
            JXG.deprecated('Board.renderer.show()', 'Board.renderer.display()');
            this.display(el, true);
            // var node;
            //
            // if (el && el.rendNode) {
            //     node = el.rendNode;
            //     node.setAttributeNS(null, 'display', 'inline');
            //     node.style.visibility = "inherit";
            // }
        },

        // documented in JXG.AbstractRenderer
        hide: function (el) {
            JXG.deprecated('Board.renderer.hide()', 'Board.renderer.display()');
            this.display(el, false);
            // var node;
            //
            // if (el && el.rendNode) {
            //     node = el.rendNode;
            //     node.setAttributeNS(null, 'display', 'none');
            //     node.style.visibility = "hidden";
            // }
        },

        // documented in JXG.AbstractRenderer
        setBuffering: function (el, type) {
            el.rendNode.setAttribute('buffered-rendering', type);
        },

        // documented in JXG.AbstractRenderer
        setDashStyle: function (el) {
            var dashStyle = Type.evaluate(el.visProp.dash),
                node = el.rendNode;

            if (dashStyle > 0) {
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
                node, node2, node3, x1, x2, y1, y2,
                ev_g = Type.evaluate(el.visProp.gradient);

            op = Type.evaluate(el.visProp.fillopacity);
            op = (op > 0) ? op : 0;
            col = Type.evaluate(el.visProp.fillcolor);

            if (ev_g === 'linear') {
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
                node3.setAttributeNS(null, 'style', 'stop-color:' + Type.evaluate(el.visProp.gradientsecondcolor) +
                            ';stop-opacity:' + Type.evaluate(el.visProp.gradientsecondopacity));
                node.appendChild(node2);
                node.appendChild(node3);
                this.defs.appendChild(node);
                fillNode.setAttributeNS(null, 'style', 'fill:url(#' + this.container.id + '_' + el.id + '_gradient)');
                el.gradNode1 = node2;
                el.gradNode2 = node3;
            } else if (ev_g === 'radial') {
                node = this.createPrim('radialGradient', el.id + '_gradient');

                node.setAttributeNS(null, 'cx', '50%');
                node.setAttributeNS(null, 'cy', '50%');
                node.setAttributeNS(null, 'r', '50%');
                node.setAttributeNS(null, 'fx', Type.evaluate(el.visProp.gradientpositionx) * 100 + '%');
                node.setAttributeNS(null, 'fy', Type.evaluate(el.visProp.gradientpositiony) * 100 + '%');

                node2 = this.createPrim('stop', el.id + '_gradient1');
                node2.setAttributeNS(null, 'offset', '0%');
                node2.setAttributeNS(null, 'style', 'stop-color:' + Type.evaluate(el.visProp.gradientsecondcolor) +
                                ';stop-opacity:' + Type.evaluate(el.visProp.gradientsecondopacity));
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
                node3 = el.gradNode2,
                ev_g = Type.evaluate(el.visProp.gradient);

            if (!Type.exists(node2) || !Type.exists(node3)) {
                return;
            }

            op = Type.evaluate(el.visProp.fillopacity);
            op = (op > 0) ? op : 0;
            col = Type.evaluate(el.visProp.fillcolor);

            if (ev_g === 'linear') {
                node2.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);
                node3.setAttributeNS(null, 'style', 'stop-color:' + Type.evaluate(el.visProp.gradientsecondcolor) +
                        ';stop-opacity:' + Type.evaluate(el.visProp.gradientsecondopacity));
            } else if (ev_g === 'radial') {
                node2.setAttributeNS(null, 'style', 'stop-color:' + Type.evaluate(el.visProp.gradientsecondcolor) +
                        ';stop-opacity:' + Type.evaluate(el.visProp.gradientsecondopacity));
                node3.setAttributeNS(null, 'style', 'stop-color:' + col + ';stop-opacity:' + op);
            }
        },

        // documented in JXG.AbstractRenderer
        setObjectTransition: function (el, duration) {
            var node, transitionStr,
                i, len,
                nodes = ['rendNode',
                         'rendNodeTriangleStart',
                         'rendNodeTriangleEnd'];

            if (duration === undefined) {
                duration = Type.evaluate(el.visProp.transitionduration);
            }

            if (duration === el.visPropOld.transitionduration) {
                return;
            }

            if (el.elementClass === Const.OBJECT_CLASS_TEXT &&
                Type.evaluate(el.visProp.display) === 'html') {
                transitionStr = ' color ' + duration + 'ms,' +
                            ' opacity ' + duration + 'ms';
            } else {
                transitionStr = ' fill ' + duration + 'ms,' +
                            ' fill-opacity ' + duration + 'ms,' +
                            ' stroke ' + duration + 'ms,' +
                            ' stroke-opacity ' + duration + 'ms';
            }

            len = nodes.length;
            for (i = 0; i < len; ++i) {
                if (el[nodes[i]]) {
                    node = el[nodes[i]];
                    node.style.transition = transitionStr;
                }
            }

            el.visPropOld.transitionduration = duration;
        },

        /**
         * Call user-defined function to set visual attributes.
         * If "testAttribute" is the empty string, the function
         * is called immediately, otherwise it is called in a timeOut.
         *
         * This is necessary to realize smooth transitions buit avoid transistions
         * when first creating the objects.
         *
         * Usually, the string in testAttribute is the visPropOld attribute
         * of the values which are set.
         *
         * @param {Function} setFunc       Some function which usually sets some attributes
         * @param {String} testAttribute If this string is the empty string  the function is called immediately,
         *                               otherwise it is called in a setImeout.
         * @see JXG.SVGRenderer#setObjectFillColor
         * @see JXG.SVGRenderer#setObjectStrokeColor
         * @see JXG.SVGRenderer#_setArrowColor
         * @private
         */
        _setAttribute: function(setFunc, testAttribute) {
            if (testAttribute === '') {
                setFunc();
            } else {
                setTimeout(setFunc, 1);
            }
        },

        // documented in JXG.AbstractRenderer
        setObjectFillColor: function (el, color, opacity, rendNode) {
            var node, c, rgbo, oo, t,
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

                if (rendNode === undefined) {
                    node = el.rendNode;
                } else {
                    node = rendNode;
                }

                if (c !== 'none') {
                    this._setAttribute(function() {
                            node.setAttributeNS(null, 'fill', c);
                        }, el.visPropOld.fillcolor);
                }

                if (el.type === JXG.OBJECT_TYPE_IMAGE) {
                    this._setAttribute(function() {
                            node.setAttributeNS(null, 'opacity', oo);
                        }, el.visPropOld.fillopacity);
                    //node.style['opacity'] = oo;  // This would overwrite values set by CSS class.
                } else {
                    if (c === 'none') {  // This is done only for non-images
                                         // because images have no fill color.
                        oo = 0;
                    }
                    this._setAttribute(function() {
                            node.setAttributeNS(null, 'fill-opacity', oo);
                        }, el.visPropOld.fillopacity);
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

                if (el.elementClass === Const.OBJECT_CLASS_TEXT) {
                    if (Type.evaluate(el.visProp.display) === 'html') {
                        this._setAttribute(function() {
                                node.style.color = c;
                                node.style.opacity = oo;
                            }, el.visPropOld.strokecolor);

                    } else {
                        this._setAttribute(function() {
                                node.setAttributeNS(null, "style", "fill:" + c);
                                node.setAttributeNS(null, "style", "fill-opacity:" + oo);
                            }, el.visPropOld.strokecolor);
                    }
                } else {
                    this._setAttribute(function() {
                            node.setAttributeNS(null, 'stroke', c);
                            node.setAttributeNS(null, 'stroke-opacity', oo);
                        }, el.visPropOld.strokecolor);
                }

                if (el.elementClass === Const.OBJECT_CLASS_CURVE ||
                    el.elementClass === Const.OBJECT_CLASS_LINE) {
                    if (Type.evaluate(el.visProp.firstarrow)) {
                        this._setArrowColor(el.rendNodeTriangleStart, c, oo, el);
                    }

                    if (Type.evaluate(el.visProp.lastarrow)) {
                        this._setArrowColor(el.rendNodeTriangleEnd, c, oo, el);
                    }
                }
            }

            el.visPropOld.strokecolor = rgba;
            el.visPropOld.strokeopacity = o;
        },

        // documented in JXG.AbstractRenderer
        setObjectStrokeWidth: function (el, width) {
            var node,
                w = Type.evaluate(width),
                rgba, c, rgbo, o, oo;

            if (isNaN(w) || el.visPropOld.strokewidth === w) {
                return;
            }

            node = el.rendNode;
            this.setPropertyPrim(node, 'stroked', 'true');
            if (Type.exists(w)) {
                this.setPropertyPrim(node, 'stroke-width', w + 'px');

                // if (el.elementClass === Const.OBJECT_CLASS_CURVE ||
                // el.elementClass === Const.OBJECT_CLASS_LINE) {
                //     if (Type.evaluate(el.visProp.firstarrow)) {
                //         this._setArrowWidth(el.rendNodeTriangleStart, w, el.rendNode);
                //     }
                //
                //     if (Type.evaluate(el.visProp.lastarrow)) {
                //         this._setArrowWidth(el.rendNodeTriangleEnd, w, el.rendNode);
                //     }
                // }
             }
            el.visPropOld.strokewidth = w;
        },

        // documented in JXG.AbstractRenderer
        setLineCap: function (el) {
            var capStyle = Type.evaluate(el.visProp.linecap);

            if (capStyle === undefined || capStyle === '' || el.visPropOld.linecap === capStyle ||
                !Type.exists(el.rendNode)) {
                return;
            }

            this.setPropertyPrim(el.rendNode, 'stroke-linecap', capStyle);
            el.visPropOld.linecap = capStyle;

        },

        // documented in JXG.AbstractRenderer
        setShadow: function (el) {
            var ev_s = Type.evaluate(el.visProp.shadow);
            if (el.visPropOld.shadow === ev_s) {
                return;
            }

            if (Type.exists(el.rendNode)) {
                if (ev_s) {
                    el.rendNode.setAttributeNS(null, 'filter', 'url(#' + this.container.id + '_' + 'f1)');
                } else {
                    el.rendNode.removeAttributeNS(null, 'filter');
                }
            }
            el.visPropOld.shadow = ev_s;
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
            this.svgRoot.setAttribute("width", parseFloat(w));
            this.svgRoot.setAttribute("height", parseFloat(h));
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
        },

        /**
         * Convert the SVG construction into an HTML canvas image.
         * This works for all SVG supporting browsers.
         * For IE it works from version 9, with the execption that HTML texts
         * are ignored on IE. The drawing is done with a delay of
         * 200 ms. Otherwise there would be problems with IE.
         *
         *
         * @param {String} canvasId Id of an HTML canvas element
         * @param {Number} w Width in pixel of the dumped image, i.e. of the canvas tag.
         * @param {Number} h Height in pixel of the dumped image, i.e. of the canvas tag.
         * @param {Boolean} ignoreTexts If true, the foreignObject tag is taken out from the SVG root.
         * This is necessary for Safari. Default: false
         * @returns {Object}          the svg renderer object.
         *
         * @example
         * 	board.renderer.dumpToCanvas('canvas');
         */
        dumpToCanvas: function(canvasId, w, h, ignoreTexts) {
            var svgRoot = this.svgRoot,
                btoa = window.btoa || Base64.encode,
                svg, tmpImg, cv, ctx,
                wOrg, hOrg,
                // uriPayload,
                // DOMURL, svgBlob, url,
                virtualNode, doc;

            // Move all HTML tags (beside the SVG root) of the container
            // to the foreignObject element inside of the svgRoot node
            if (this.container.hasChildNodes() && Type.exists(this.foreignObjLayer)) {
                while (svgRoot.nextSibling) {
                    this.foreignObjLayer.appendChild(svgRoot.nextSibling);
                }
                if (ignoreTexts === true) {
                    doc = this.container.ownerDocument;
                    virtualNode = doc.createElement('div');
                    virtualNode.appendChild(this.foreignObjLayer);
                }
            }

            svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            wOrg = svgRoot.getAttribute('width');
            hOrg = svgRoot.getAttribute('height');

            svg = new XMLSerializer().serializeToString(svgRoot);

            if (false) {
                // Debug: example svg image
                svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="220" height="220"><rect width="66" height="30" x="21" y="32" stroke="#204a87" stroke-width="2" fill="none" /></svg>';
            }

            // In IE we have to remove the namespace again.
            if ((svg.match(/xmlns=\"http:\/\/www.w3.org\/2000\/svg\"/g) || []).length > 1) {
                svg = svg.replace(/xmlns=\"http:\/\/www.w3.org\/2000\/svg\"/g, '');
            }

            // Safari fails if the svg string contains a "&nbsp;"
            svg = svg.replace(/&nbsp;/g, ' ');

            cv = document.getElementById(canvasId);
            // Clear the canvas
            cv.width = cv.width;

            ctx = cv.getContext("2d");
            if (w !== undefined && h !== undefined) {
                // Scale twice the CSS size to make the image crisp
                cv.style.width = parseFloat(w) + 'px';
                cv.style.height = parseFloat(h) + 'px';
                cv.setAttribute('width',  2 * parseFloat(wOrg));
                cv.setAttribute('height', 2 * parseFloat(hOrg));
                ctx.scale(2 * wOrg / w, 2 * hOrg / h);
            }

            tmpImg = new Image();
            if (true) {
                tmpImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
                // uriPayload = encodeURIComponent(svg.replace(/\n+/g, '')) // remove newlines // encode URL-unsafe characters
                //             .replace(/%20/g, ' ') // put spaces back in
                //             .replace(/%3D/g, '=') // ditto equals signs
                //             .replace(/%3A/g, ':') // ditto colons
                //             .replace(/%2F/g, '/') // ditto slashes
                //             .replace(/%22/g, "'");
                // tmpImg.src = 'data:image/svg+xml,' + uriPayload;

                tmpImg.onload = function () {
                    // IE needs a pause...
                    setTimeout(function(){
                        ctx.drawImage(tmpImg, 0, 0, w, h);
                    }, 200);
                };
            } else {
                // // Alternative version
                // DOMURL = window.URL || window.webkitURL || window;
                // svgBlob = new Blob([svg], {type: 'image/svg+xml'});
                // url = DOMURL.createObjectURL(svgBlob);
                // tmpImg.src = url;
                //
                // tmpImg.onload = function () {
                //     // IE needs a pause...
                //     setTimeout(function(){
                //         ctx.drawImage(tmpImg, 0, 0, w, h);
                //     }, 200);
                //     DOMURL.revokeObjectURL(url);
                // };
            }

            // Move all HTML tags back from
            // the foreignObject element to the container
            if (Type.exists(this.foreignObjLayer) && this.foreignObjLayer.hasChildNodes()) {
                if (ignoreTexts === true) {
                    svgRoot.appendChild(this.foreignObjLayer);
                }
                while (this.foreignObjLayer.firstChild) {
                    this.container.appendChild(this.foreignObjLayer.firstChild);
                }
            }

            return this;
        },

        /**
         * Display SVG image in html img-tag which enables
         * easy download for the user.
         *
         * Support:
         * <ul>
         * <li> IE: No
         * <li> Edge: full
         * <li>Firefox: full
         * <li> Chrome: full
         * <li> Safari: supported, but no texts (to be precise, no foreignObject-element is allowed in SVG)
         * </ul>
         *
         * @param {JXG.Board} board Link to the board.
         * @param {String} imgId Optional id of an img object. If given and different from the empty string,
         * the screenshot is copied to this img object. The width and height will be set to the values of the
         * JSXGraph container.
         * @param {Boolean} ignoreTexts If set to true, the foreignObject is taken out of the
         *  SVGRoot and texts are not displayed. This is mandatory for Safari. Default: false
         * @return {Object}       the svg renderer object
         */
        screenshot: function(board, imgId, ignoreTexts) {
            var node,
                doc = this.container.ownerDocument,
                parent = this.container.parentNode,
                cPos,
                canvas, id,
                img,
                button, buttonText,
                w, h,
                bas = board.attr.screenshot,
                zbar, zbarDisplay, cssTxt,
                newImg = false,
                isDebug = false;

            if (this.type === 'no') {
                return this;
            }

            w = bas.scale * parseFloat(this.container.style.width);
            h = bas.scale * parseFloat(this.container.style.height);

            if (imgId === undefined || imgId === '') {
                newImg = true;
                img = new Image(); //doc.createElement('img');
                img.style.width = w + 'px';
                img.style.height = h + 'px';
            } else {
                newImg = false;
                img = doc.getElementById(imgId);
            }
            // img.crossOrigin = 'anonymous';

            // Create div which contains canvas element and close button
            if (newImg) {
                node = doc.createElement('div');
                node.style.cssText = bas.css;
                node.style.width = (w) + 'px';
                node.style.height = (h) + 'px';
                node.style.zIndex = this.container.style.zIndex + 120;

                // Position the div exactly over the JSXGraph board
                cPos = board.getCoordsTopLeftCorner();
                node.style.position= 'absolute';
                node.style.left = (cPos[0]) + 'px';
                node.style.top = (cPos[1]) + 'px';
            }

            if (!isDebug) {
                // Create canvas element and add it to the DOM
                // It will be removed after the image has been stored.
                canvas = doc.createElement('canvas');
                id = Math.random().toString(36).substr(2, 5);
                canvas.setAttribute('id', id);
                canvas.setAttribute('width', w);
                canvas.setAttribute('height', h);
                canvas.style.width = w + 'px';
                canvas.style.height = w + 'px';
                canvas.style.display = 'none';
                parent.append(canvas);
            } else {
                // Debug: use canvas element
                // 'jxgbox_canvas' from jsxdev/dump.html
                id = 'jxgbox_canvas';
                canvas = document.getElementById(id);
            }

            if (newImg) {
                // Create close button
                button = doc.createElement('span');
                buttonText = doc.createTextNode('\u2716');
                button.style.cssText = bas.cssButton;
                button.appendChild(buttonText);
                button.onclick = function() {
                    node.parentNode.removeChild(node);
                };

                // Add all nodes
                node.appendChild(img);
                node.appendChild(button);
                parent.appendChild(node);
            }

            // Hide navigation bar in board
            zbar = document.getElementById(this.container.id + '_navigationbar');
            if (Type.exists(zbar)) {
                zbarDisplay = zbar.style.display;
                zbar.style.display = 'none';
            }

            // Create screenshot in canvas
            this.dumpToCanvas(id, w, h, ignoreTexts);

            // Show image in img tag
            setTimeout(function() {
                //console.log(canvas.toDataURL('image/png'));
                img.src = canvas.toDataURL('image/png');

                // Remove canvas node
                if (!isDebug) {
                    parent.removeChild(canvas);
                }
            }, 400);

            // Show navigation bar in board
            if (Type.exists(zbar)) {
                zbar.style.display = zbarDisplay;
            }

            return this;
        }

    });

    return JXG.SVGRenderer;
});
