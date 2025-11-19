/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true */
/*jslint nomen: true, plusplus: true, newcap:true*/

import JXG from "../jxg.js";
import Options from "../options.js";
import AbstractRenderer from "./abstract.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";
import Color from "../utils/color.js";
import Base64 from "../utils/base64.js";
import Numerics from "../math/numerics.js";

/**
 * Uses SVG to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
 * @class JXG.SVGRenderer
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

    this.isIE =
        navigator.appVersion.indexOf('MSIE') !== -1 || navigator.userAgent.match(/Trident\//);

    /**
     * SVG root node
     * @type Node
     */
    this.svgRoot = null;

    /**
     * The SVG Namespace used in JSXGraph.
     * @see http://www.w3.org/TR/SVG2/
     * @type String
     * @default http://www.w3.org/2000/svg
     */
    this.svgNamespace = "http://www.w3.org/2000/svg";

    /**
     * The xlink namespace. This is used for images.
     * @see http://www.w3.org/TR/xlink/
     * @type String
     * @default http://www.w3.org/1999/xlink
     */
    this.xlinkNamespace = "http://www.w3.org/1999/xlink";

    // container is documented in AbstractRenderer.
    // Type node
    this.container = container;

    // prepare the div container and the svg root node for use with JSXGraph
    this.container.style.MozUserSelect = 'none';
    this.container.style.userSelect = 'none';

    this.container.style.overflow = 'hidden';
    if (this.container.style.position === "") {
        this.container.style.position = 'relative';
    }

    this.svgRoot = this.container.ownerDocument.createElementNS(this.svgNamespace, 'svg');
    this.svgRoot.style.overflow = 'hidden';
    this.svgRoot.style.display = 'block';
    this.resize(dim.width, dim.height);

    //this.svgRoot.setAttributeNS(null, 'shape-rendering', 'crispEdge'); //'optimizeQuality'); //geometricPrecision');

    this.container.appendChild(this.svgRoot);

    /**
     * The <tt>defs</tt> element is a container element to reference reusable SVG elements.
     * @type Node
     * @see https://www.w3.org/TR/SVG2/struct.html#DefsElement
     */
    this.defs = this.container.ownerDocument.createElementNS(this.svgNamespace, 'defs');
    this.svgRoot.appendChild(this.defs);

    /**
     * Filters are used to apply shadows.
     * @type Node
     * @see https://www.w3.org/TR/SVG2/struct.html#DefsElement
     */
    /**
     * Create an SVG shadow filter. If the object's RGB color is [r,g,b], it's opacity is op, and
     * the parameter color is given as [r', g', b'] with opacity op'
     * the shadow will have RGB color [blend*r + r', blend*g + g', blend*b + b'] and the opacity will be equal to op * op'.
     * Further, blur and offset can be adjusted.
     *
     * The shadow color is [r*ble
     * @param {String} id Node is of the filter.
     * @param {Array|String} rgb RGB value for the blend color or the string 'none' for default values. Default 'black'.
     * @param {Number} opacity Value between 0 and 1, default is 1.
     * @param {Number} blend  Value between 0 and 1, default is 0.1.
     * @param {Number} blur  Default: 3
     * @param {Array} offset [dx, dy]. Default is [5,5].
     * @returns DOM node to be added to this.defs.
     * @private
     */
    this.createShadowFilter = function (id, rgb, opacity, blend, blur, offset) {
        var filter = this.container.ownerDocument.createElementNS(this.svgNamespace, 'filter'),
            feOffset, feColor, feGaussianBlur, feBlend,
            mat;

        filter.setAttributeNS(null, 'id', id);
        filter.setAttributeNS(null, 'width', '300%');
        filter.setAttributeNS(null, 'height', '300%');
        filter.setAttributeNS(null, 'filterUnits', 'userSpaceOnUse');

        feOffset = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feOffset');
        feOffset.setAttributeNS(null, 'in', 'SourceGraphic'); // b/w: SourceAlpha, Color: SourceGraphic
        feOffset.setAttributeNS(null, 'result', 'offOut');
        feOffset.setAttributeNS(null, 'dx', offset[0]);
        feOffset.setAttributeNS(null, 'dy', offset[1]);
        filter.appendChild(feOffset);

        feColor = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feColorMatrix');
        feColor.setAttributeNS(null, 'in', 'offOut');
        feColor.setAttributeNS(null, 'result', 'colorOut');
        feColor.setAttributeNS(null, 'type', 'matrix');
        // See https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
        if (rgb === 'none' || !Type.isArray(rgb) || rgb.length < 3) {
            feColor.setAttributeNS(null, 'values', '0.1 0 0 0 0  0 0.1 0 0 0  0 0 0.1 0 0  0 0 0 ' + opacity + ' 0');
        } else {
            rgb[0] /= 255;
            rgb[1] /= 255;
            rgb[2] /= 255;
            mat = blend + ' 0 0 0 ' + rgb[0] +
                '  0 ' + blend + ' 0 0 ' + rgb[1] +
                '  0 0 ' + blend + ' 0 ' + rgb[2] +
                '  0 0 0 ' + opacity + ' 0';
            feColor.setAttributeNS(null, 'values', mat);
        }
        filter.appendChild(feColor);

        feGaussianBlur = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feGaussianBlur');
        feGaussianBlur.setAttributeNS(null, 'in', 'colorOut');
        feGaussianBlur.setAttributeNS(null, 'result', 'blurOut');
        feGaussianBlur.setAttributeNS(null, 'stdDeviation', blur);
        filter.appendChild(feGaussianBlur);

        feBlend = this.container.ownerDocument.createElementNS(this.svgNamespace, 'feBlend');
        feBlend.setAttributeNS(null, 'in', 'SourceGraphic');
        feBlend.setAttributeNS(null, 'in2', 'blurOut');
        feBlend.setAttributeNS(null, 'mode', 'normal');
        filter.appendChild(feBlend);

        return filter;
    };

    /**
     * Create a "unique" string id from the arguments of the function.
     * Concatenate all arguments by "_".
     * "Unique" is achieved by simply prepending the container id.
     * Do not escape the string.
     *
     * If the id is used in an "url()" call it must be eascaped.
     *
     * @params {String} one or strings which will be concatenated.
     * @return {String}
     * @private
     */
    this.uniqName = function () {
        return this.container.id + '_' +
            Array.prototype.slice.call(arguments).join('_');
    };

    /**
     * Combine arguments to a string, joined by empty string.
     * The container id needs to be escaped, as it may contain URI-unsafe characters
     *
     * @params {String} str variable number of strings
     * @returns String
     * @see JXG.SVGRenderer#toURL
     * @private
     * @example
     * this.toStr('aaa', '_', 'bbb', 'TriangleEnd')
     * // Output:
     * // xxx_bbbTriangleEnd
     */
    this.toStr = function() {
        // ES6 would be [...arguments].join()
        var str = Array.prototype.slice.call(arguments).join('');
        // Mask special symbols like '/' and '\' in id
        if (Type.exists(encodeURIComponent)) {
            str = encodeURIComponent(str);
        }
        return str;
    };

    /**
     * Combine arguments to an URL string of the form
     * url(#...)
     * Masks the container id. Calls {@link JXG.SVGRenderer#toStr}.
     *
     * @params {String} str variable number of strings
     * @returns URL string
     * @see JXG.SVGRenderer#toStr
     * @private
     * @example
     * this.toURL('aaa', '_', 'bbb', 'TriangleEnd')
     * // Output:
     * // url(#xxx_bbbTriangleEnd)
     */
    this.toURL = function () {
        return 'url(#' +
            this.toStr.apply(this, arguments) + // Pass the arguments to toStr
            ')';
    };

    /* Default shadow filter */
    this.defs.appendChild(this.createShadowFilter(this.uniqName('f1'), 'none', 1, 0.1, 3, [5, 5]));

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

    try {
        this.foreignObjLayer = this.container.ownerDocument.createElementNS(
            this.svgNamespace,
            "foreignObject"
        );
        this.foreignObjLayer.setAttribute("display", 'none');
        this.foreignObjLayer.setAttribute("x", 0);
        this.foreignObjLayer.setAttribute("y", 0);
        this.foreignObjLayer.setAttribute("width", "100%");
        this.foreignObjLayer.setAttribute("height", "100%");
        this.foreignObjLayer.setAttribute("id", this.uniqName('foreignObj'));
        this.svgRoot.appendChild(this.foreignObjLayer);
        this.supportsForeignObject = true;
    } catch (e) {
        this.supportsForeignObject = false;
    }
};

JXG.SVGRenderer.prototype = new AbstractRenderer();

JXG.extend(
    JXG.SVGRenderer.prototype,
    /** @lends JXG.SVGRenderer.prototype */ {
        /* ******************************** *
         *  This renderer does not need to
         *  override draw/update* methods
         *  since it provides draw/update*Prim
         *  methods except for some cases like
         *  internal texts or images.
         * ******************************** */

        /* ********* Arrow head related stuff *********** */

        /**
         * Creates an arrow DOM node. Arrows are displayed in SVG with a <em>marker</em> tag.
         * @private
         * @param {JXG.GeometryElement} el A JSXGraph element, preferably one that can have an arrow attached.
         * @param {String} [idAppendix=''] A string that is added to the node's id.
         * @returns {Node} Reference to the node added to the DOM.
         */
        _createArrowHead: function (el, idAppendix, type) {
            var node2,
                node3,
                id = el.id + "Triangle",
                //type = null,
                v,
                h;

            if (Type.exists(idAppendix)) {
                id += idAppendix;
            }
            if (Type.exists(type)) {
                id += type;
            }
            node2 = this.createPrim('marker', id);

            // 'context-stroke': property is inherited from line or curve
            node2.setAttributeNS(null, 'fill', 'context-stroke');
            node2.setAttributeNS(null, 'stroke', 'context-stroke');
            // node2.setAttributeNS(null, 'fill-opacity', 'context-stroke'); // Not available
            // node2.setAttributeNS(null, 'stroke-opacity', 'context-stroke');
            node2.setAttributeNS(null, 'stroke-width', 0); // this is the stroke-width of the arrow head.
            // Should be zero to simplify the calculations

            node2.setAttributeNS(null, 'orient', 'auto');
            node2.setAttributeNS(null, 'markerUnits', 'strokeWidth'); // 'strokeWidth' 'userSpaceOnUse');

            /*
               Types 1, 2:
               The arrow head is an isosceles triangle with base length 10 and height 10.

               Type 3:
               A rectangle

               Types 4, 5, 6:
               Defined by Bezier curves from mp_arrowheads.html

               In any case but type 3 the arrow head is 10 units long,
               type 3 is 10 units high.
               These 10 units are scaled to strokeWidth * arrowSize pixels, see
               this._setArrowWidth().

               See also abstractRenderer.updateLine() where the line path is shortened accordingly.

               Changes here are also necessary in setArrowWidth().

               So far, lines with arrow heads are shortenend to avoid overlapping of
               arrow head and line. This is not the case for curves, yet.
               Therefore, the offset refX has to be adapted to the path type.
            */
            node3 = this.container.ownerDocument.createElementNS(this.svgNamespace, 'path');
            h = 5;
            if (idAppendix === 'Start') {
                // First arrow
                v = 0;
                if (type === 2) {
                    node3.setAttributeNS(null, "d", "M 10,0 L 0,5 L 10,10 L 5,5 z");
                } else if (type === 3) {
                    node3.setAttributeNS(null, "d", "M 0,0 L 3.33,0 L 3.33,10 L 0,10 z");
                } else if (type === 4) {
                    // insetRatio:0.8 tipAngle:45 wingCurve:15 tailCurve:0
                    h = 3.31;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 0.00,3.31 C 3.53,3.84 7.13,4.50 10.00,6.63 C 9.33,5.52 8.67,4.42 8.00,3.31 C 8.67,2.21 9.33,1.10 10.00,0.00 C 7.13,2.13 3.53,2.79 0.00,3.31"
                    );
                } else if (type === 5) {
                    // insetRatio:0.9 tipAngle:40 wingCurve:5 tailCurve:15
                    h = 3.28;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 0.00,3.28 C 3.39,4.19 6.81,5.07 10.00,6.55 C 9.38,5.56 9.00,4.44 9.00,3.28 C 9.00,2.11 9.38,0.99 10.00,0.00 C 6.81,1.49 3.39,2.37 0.00,3.28"
                    );
                } else if (type === 6) {
                    // insetRatio:0.9 tipAngle:35 wingCurve:5 tailCurve:0
                    h = 2.84;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 0.00,2.84 C 3.39,3.59 6.79,4.35 10.00,5.68 C 9.67,4.73 9.33,3.78 9.00,2.84 C 9.33,1.89 9.67,0.95 10.00,0.00 C 6.79,1.33 3.39,2.09 0.00,2.84"
                    );
                } else if (type === 7) {
                    // insetRatio:0.9 tipAngle:60 wingCurve:30 tailCurve:0
                    h = 5.2;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 0.00,5.20 C 4.04,5.20 7.99,6.92 10.00,10.39 M 10.00,0.00 C 7.99,3.47 4.04,5.20 0.00,5.20"
                    );
                } else {
                    // type == 1 or > 6
                    node3.setAttributeNS(null, "d", "M 10,0 L 0,5 L 10,10 z");
                }
                if (
                    // !Type.exists(el.rendNode.getTotalLength) &&
                    el.elementClass === Const.OBJECT_CLASS_LINE
                ) {
                    if (type === 2) {
                        v = 4.9;
                    } else if (type === 3) {
                        v = 3.3;
                    } else if (type === 4 || type === 5 || type === 6) {
                        v = 6.66;
                    } else if (type === 7) {
                        v = 0.0;
                    } else {
                        v = 10.0;
                    }
                }
            } else {
                // Last arrow
                v = 10.0;
                if (type === 2) {
                    node3.setAttributeNS(null, "d", "M 0,0 L 10,5 L 0,10 L 5,5 z");
                } else if (type === 3) {
                    v = 3.3;
                    node3.setAttributeNS(null, "d", "M 0,0 L 3.33,0 L 3.33,10 L 0,10 z");
                } else if (type === 4) {
                    // insetRatio:0.8 tipAngle:45 wingCurve:15 tailCurve:0
                    h = 3.31;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 10.00,3.31 C 6.47,3.84 2.87,4.50 0.00,6.63 C 0.67,5.52 1.33,4.42 2.00,3.31 C 1.33,2.21 0.67,1.10 0.00,0.00 C 2.87,2.13 6.47,2.79 10.00,3.31"
                    );
                } else if (type === 5) {
                    // insetRatio:0.9 tipAngle:40 wingCurve:5 tailCurve:15
                    h = 3.28;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 10.00,3.28 C 6.61,4.19 3.19,5.07 0.00,6.55 C 0.62,5.56 1.00,4.44 1.00,3.28 C 1.00,2.11 0.62,0.99 0.00,0.00 C 3.19,1.49 6.61,2.37 10.00,3.28"
                    );
                } else if (type === 6) {
                    // insetRatio:0.9 tipAngle:35 wingCurve:5 tailCurve:0
                    h = 2.84;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 10.00,2.84 C 6.61,3.59 3.21,4.35 0.00,5.68 C 0.33,4.73 0.67,3.78 1.00,2.84 C 0.67,1.89 0.33,0.95 0.00,0.00 C 3.21,1.33 6.61,2.09 10.00,2.84"
                    );
                } else if (type === 7) {
                    // insetRatio:0.9 tipAngle:60 wingCurve:30 tailCurve:0
                    h = 5.2;
                    node3.setAttributeNS(
                        null,
                        "d",
                        "M 10.00,5.20 C 5.96,5.20 2.01,6.92 0.00,10.39 M 0.00,0.00 C 2.01,3.47 5.96,5.20 10.00,5.20"
                    );
                } else {
                    // type == 1 or > 6
                    node3.setAttributeNS(null, "d", "M 0,0 L 10,5 L 0,10 z");
                }
                if (
                    // !Type.exists(el.rendNode.getTotalLength) &&
                    el.elementClass === Const.OBJECT_CLASS_LINE
                ) {
                    if (type === 2) {
                        v = 5.1;
                    } else if (type === 3) {
                        v = 0.02;
                    } else if (type === 4 || type === 5 || type === 6) {
                        v = 3.33;
                    } else if (type === 7) {
                        v = 10.0;
                    } else {
                        v = 0.05;
                    }
                }
            }
            if (type === 7) {
                node2.setAttributeNS(null, 'fill', 'none');
                node2.setAttributeNS(null, 'stroke-width', 1); // this is the stroke-width of the arrow head.
            }
            node2.setAttributeNS(null, "refY", h);
            node2.setAttributeNS(null, "refX", v);
            // this.setPropertyPrim(node2, 'class', el.evalVisProp('cssclass'));

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
        _setArrowColor: function (node, color, opacity, el, type) {
            if (node) {
                if (Type.isString(color)) {
                    if (type !== 7) {
                        this._setAttribute(function () {
                            node.setAttributeNS(null, 'fill', 'context-stroke');
                            // node.setAttributeNS(null, 'stroke-opacity', 'context-stroke');
                            // node.setAttributeNS(null, 'fill-opacity', 'context-stroke');
                        }, el.visPropOld.fillcolor);
                    } else {
                        this._setAttribute(function () {
                            node.setAttributeNS(null, 'fill', 'none');
                            node.setAttributeNS(null, 'stroke', 'context-stroke');
                            // node.setAttributeNS(null, 'stroke-opacity', 'context-stroke');
                        }, el.visPropOld.fillcolor);
                    }
                }

                // if (this.isIE) {
                    // Necessary, since Safari is the new IE (11.2024)
                    el.rendNode.parentNode.insertBefore(el.rendNode, el.rendNode);
                // }
            }
        },

        // Already documented in JXG.AbstractRenderer
        _setArrowWidth: function (node, width, parentNode, size) {
            var s, d;

            if (node) {
                // if (width === 0) {
                //     // display:none does not work well in webkit
                //     node.setAttributeNS(null, 'display', 'none');
                // } else {
                s = width;
                d = s * size;
                node.setAttributeNS(null, "viewBox", 0 + " " + 0 + " " + s * 10 + " " + s * 10);
                node.setAttributeNS(null, "markerHeight", d);
                node.setAttributeNS(null, "markerWidth", d);
                node.setAttributeNS(null, "display", 'inherit');
                // }

                // if (this.isIE) {
                    // Necessary, since Safari is the new IE (11.2024)
                    parentNode.parentNode.insertBefore(parentNode, parentNode);
                // }
            }
        },

        /* ********* Line related stuff *********** */

        // documented in AbstractRenderer
        updateTicks: function (ticks) {
            var i,
                j,
                c,
                node,
                x,
                y,
                tickStr = "",
                len = ticks.ticks.length,
                len2,
                str,
                isReal = true;

            for (i = 0; i < len; i++) {
                c = ticks.ticks[i];
                x = c[0];
                y = c[1];

                len2 = x.length;
                str = " M " + x[0] + " " + y[0];
                if (!Type.isNumber(x[0])) {
                    isReal = false;
                }
                for (j = 1; isReal && j < len2; ++j) {
                    if (Type.isNumber(x[j])) {
                        str += " L " + x[j] + " " + y[j];
                    } else {
                        isReal = false;
                    }
                }
                if (isReal) {
                    tickStr += str;
                }
            }

            node = ticks.rendNode;

            if (!Type.exists(node)) {
                node = this.createPrim("path", ticks.id);
                this.appendChildPrim(node, ticks.evalVisProp('layer'));
                ticks.rendNode = node;
            }

            node.setAttributeNS(null, "stroke", ticks.evalVisProp('strokecolor'));
            node.setAttributeNS(null, "fill", 'none');
            // node.setAttributeNS(null, 'fill', ticks.evalVisProp('fillcolor'));
            // node.setAttributeNS(null, 'fill-opacity', ticks.evalVisProp('fillopacity'));
            node.setAttributeNS(null, 'stroke-opacity', ticks.evalVisProp('strokeopacity'));
            node.setAttributeNS(null, "stroke-width", ticks.evalVisProp('strokewidth'));
            this.updatePathPrim(node, tickStr, ticks.board);
        },

        /* ********* Text related stuff *********** */

        // Already documented in JXG.AbstractRenderer
        displayCopyright: function (str, fontsize) {
            var node, t,
                x = 4 + 1.8 * fontsize,
                y = 6 + fontsize,
                alpha = 0.2;

            node = this.createPrim("text", 'licenseText');
            node.setAttributeNS(null, 'x', x + 'px');
            node.setAttributeNS(null, 'y', y + 'px');
            node.setAttributeNS(null, 'style', 'font-family:Arial,Helvetica,sans-serif; font-size:' +
                fontsize + 'px; opacity:' + alpha + ';');
                // fill:#356AA0;
            node.setAttributeNS(null, 'aria-hidden', 'true');

            t = this.container.ownerDocument.createTextNode(str);
            node.appendChild(t);
            this.appendChildPrim(node, 0);
        },

        // Already documented in JXG.AbstractRenderer
        displayLogo: function (str, fontsize) {
            var node,
                s = 1.5 * fontsize,
                alpha = 0.2;

            node = this.createPrim("image", 'licenseLogo');
            node.setAttributeNS(null, 'x', '5px');
            node.setAttributeNS(null, 'y', '5px');
            node.setAttributeNS(null, 'width', s + 'px');
            node.setAttributeNS(null, 'height', s + 'px');
            node.setAttributeNS(null, "preserveAspectRatio", 'none');
            node.setAttributeNS(null, 'style', 'opacity:' + alpha + ';');
            node.setAttributeNS(null, 'aria-hidden', 'true');

            node.setAttributeNS(this.xlinkNamespace, "xlink:href", str);
            this.appendChildPrim(node, 0);
        },

        // Already documented in JXG.AbstractRenderer
        drawInternalText: function (el) {
            var node = this.createPrim("text", el.id);

            //node.setAttributeNS(null, "style", "alignment-baseline:middle"); // Not yet supported by Firefox
            // Preserve spaces
            //node.setAttributeNS("http://www.w3.org/XML/1998/namespace", "space", 'preserve');
            node.style.whiteSpace = 'nowrap';

            el.rendNodeText = this.container.ownerDocument.createTextNode("");
            node.appendChild(el.rendNodeText);
            this.appendChildPrim(node, el.evalVisProp('layer'));

            return node;
        },

        // Already documented in JXG.AbstractRenderer
        updateInternalText: function (el) {
            var content = el.plaintext,
                v, css,
                ev_ax = el.getAnchorX(),
                ev_ay = el.getAnchorY();

            css = el.evalVisProp('cssclass');
            if (el.rendNode.getAttributeNS(null, 'class') !== css) {
                el.rendNode.setAttributeNS(null, "class", css);
                el.needsSizeUpdate = true;
            }

            if (!isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {
                // Horizontal
                v = el.coords.scrCoords[1];
                if (el.visPropOld.left !== ev_ax + v) {
                    el.rendNode.setAttributeNS(null, "x", v + 'px');

                    if (ev_ax === 'left') {
                        el.rendNode.setAttributeNS(null, "text-anchor", 'start');
                    } else if (ev_ax === 'right') {
                        el.rendNode.setAttributeNS(null, "text-anchor", 'end');
                    } else if (ev_ax === 'middle') {
                        el.rendNode.setAttributeNS(null, "text-anchor", 'middle');
                    }
                    el.visPropOld.left = ev_ax + v;
                }

                // Vertical
                v = el.coords.scrCoords[2];
                if (el.visPropOld.top !== ev_ay + v) {
                    el.rendNode.setAttributeNS(null, "y", v + this.vOffsetText * 0.5 + 'px');

                    // Not supported by IE, edge
                    // el.rendNode.setAttributeNS(null, "dy", '0');
                    // if (ev_ay === 'bottom') {
                    //     el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-after-edge');
                    // } else if (ev_ay === 'top') {
                    //     el.rendNode.setAttributeNS(null, 'dominant-baseline', 'text-before-edge');
                    // } else if (ev_ay === 'middle') {
                    //     el.rendNode.setAttributeNS(null, 'dominant-baseline', 'middle');
                    // }

                    if (ev_ay === 'bottom') {
                        el.rendNode.setAttributeNS(null, "dy", '0');
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'auto');
                    } else if (ev_ay === 'top') {
                        el.rendNode.setAttributeNS(null, "dy", '1.6ex');
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'auto');
                    } else if (ev_ay === 'middle') {
                        el.rendNode.setAttributeNS(null, "dy", '0.6ex');
                        el.rendNode.setAttributeNS(null, 'dominant-baseline', 'auto');
                    }
                    el.visPropOld.top = ev_ay + v;
                }
            }
            if (el.htmlStr !== content) {
                el.rendNodeText.data = content;
                el.htmlStr = content;
            }
            this.transformRect(el, el.transformations);
        },

        /**
         * Set color and opacity of internal texts.
         * @private
         * @see JXG.AbstractRenderer#updateTextStyle
         * @see JXG.AbstractRenderer#updateInternalTextStyle
         */
        updateInternalTextStyle: function (el, strokeColor, strokeOpacity, duration) {
            this.setObjectFillColor(el, strokeColor, strokeOpacity);
        },

        /* ********* Image related stuff *********** */

        // Already documented in JXG.AbstractRenderer
        drawImage: function (el) {
            var node = this.createPrim("image", el.id);

            node.setAttributeNS(null, "preserveAspectRatio", 'none');
            this.appendChildPrim(node, el.evalVisProp('layer'));
            el.rendNode = node;

            this.updateImage(el);
        },

        // Already documented in JXG.AbstractRenderer
        transformRect: function (el, t) {
            var s, m, node,
                str = "",
                cx, cy,
                len = t.length;

            if (len > 0) {
                node = el.rendNode;
                m = this.joinTransforms(el, t);
                s = [m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]].join(",");
                if (s.indexOf('NaN') === -1) {
                    str += " matrix(" + s + ") ";
                    if (el.elementClass === Const.OBJECT_CLASS_TEXT && el.visProp.display === 'html') {
                        node.style.transform = str;
                        cx = -el.coords.scrCoords[1];
                        cy = -el.coords.scrCoords[2];
                        switch (el.evalVisProp('anchorx')) {
                            case 'right': cx += el.size[0]; break;
                            case 'middle': cx += el.size[0] * 0.5; break;
                        }
                        switch (el.evalVisProp('anchory')) {
                            case 'bottom': cy += el.size[1]; break;
                            case 'middle': cy += el.size[1] * 0.5; break;
                        }
                        node.style['transform-origin'] = (cx) + 'px ' + (cy) + 'px';
                    } else {
                        // Images and texts with display:'internal'
                        node.setAttributeNS(null, "transform", str);
                    }
                }
            }
        },

        // Already documented in JXG.AbstractRenderer
        updateImageURL: function (el) {
            var url = el.eval(el.url);

            if (el._src !== url) {
                el.imgIsLoaded = false;
                el.rendNode.setAttributeNS(this.xlinkNamespace, "xlink:href", url);
                el._src = url;

                return true;
            }

            return false;
        },

        // Already documented in JXG.AbstractRenderer
        updateImageStyle: function (el, doHighlight) {
            var css = el.evalVisProp(
                doHighlight ? 'highlightcssclass' : 'cssclass'
            );

            el.rendNode.setAttributeNS(null, "class", css);
        },

        // Already documented in JXG.AbstractRenderer
        drawForeignObject: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("foreignObject", el.id),
                el.evalVisProp('layer')
            );

            this.appendNodesToElement(el, 'foreignObject');
            this.updateForeignObject(el);
        },

        // Already documented in JXG.AbstractRenderer
        updateForeignObject: function (el) {
            if (el._useUserSize) {
                el.rendNode.style.overflow = 'hidden';
            } else {
                el.rendNode.style.overflow = 'visible';
            }

            this.updateRectPrim(
                el.rendNode,
                el.coords.scrCoords[1],
                el.coords.scrCoords[2] - el.size[1],
                el.size[0],
                el.size[1]
            );

            if (el.evalVisProp('evaluateOnlyOnce') !== true || !el.renderedOnce) {
                el.rendNode.innerHTML = el.content;
                el.renderedOnce = true;
            }
            this._updateVisual(el, { stroke: true, dash: true }, true);
        },

        /* ********* Render primitive objects *********** */

        // Already documented in JXG.AbstractRenderer
        appendChildPrim: function (node, level) {
            if (!Type.exists(level)) {
                // trace nodes have level not set
                level = 0;
            } else if (level >= Options.layer.numlayers) {
                level = Options.layer.numlayers - 1;
            }
            this.layer[level].appendChild(node);

            return node;
        },

        // Already documented in JXG.AbstractRenderer
        createPrim: function (type, id) {
            var node = this.container.ownerDocument.createElementNS(this.svgNamespace, type);
            node.setAttributeNS(null, "id", this.uniqName(id));
            node.style.position = 'absolute';
            if (type === 'path') {
                node.setAttributeNS(null, "stroke-linecap", 'round');
                node.setAttributeNS(null, "stroke-linejoin", 'round');
                node.setAttributeNS(null, "fill-rule", 'evenodd');
            }

            return node;
        },

        // Already documented in JXG.AbstractRenderer
        remove: function (shape) {
            if (Type.exists(shape) && Type.exists(shape.parentNode)) {
                shape.parentNode.removeChild(shape);
            }
        },

        // Already documented in JXG.AbstractRenderer
        setLayer: function (el, level) {
            if (!Type.exists(level)) {
                level = 0;
            } else if (level >= Options.layer.numlayers) {
                level = Options.layer.numlayers - 1;
            }

            this.layer[level].appendChild(el.rendNode);
        },

        // Already documented in JXG.AbstractRenderer
        makeArrows: function (el, a) {
            var node2, str,
                ev_fa = a.evFirst,
                ev_la = a.evLast;

            if (this.isIE && el.visPropCalc.visible && (ev_fa || ev_la)) {
                // Necessary, since Safari is the new IE (11.2024)
                el.rendNode.parentNode.insertBefore(el.rendNode, el.rendNode);
                return;
            }

            // We can not compare against visPropOld if there is need for a new arrow head,
            // since here visPropOld and ev_fa / ev_la already have the same value.
            // This has been set in _updateVisual.
            //
            node2 = el.rendNodeTriangleStart;
            if (ev_fa) {
                str = this.toStr(this.container.id, '_', el.id, 'TriangleStart', a.typeFirst);

                // If we try to set the same arrow head as is already set, we can bail out now
                if (!Type.exists(node2) || node2.id !== str) {
                    node2 = this.container.ownerDocument.getElementById(str);
                    // Check if the marker already exists.
                    // If not, create a new marker
                    if (node2 === null) {
                        node2 = this._createArrowHead(el, "Start", a.typeFirst);
                        this.defs.appendChild(node2);
                    }
                    el.rendNodeTriangleStart = node2;
                    el.rendNode.setAttributeNS(null, 'marker-start', this.toURL(str));
                }
            } else {
                if (Type.exists(node2)) {
                    this.remove(node2);
                    el.rendNodeTriangleStart = null;
                }
                // el.rendNode.setAttributeNS(null, "marker-start", null);
                el.rendNode.removeAttributeNS(null, 'marker-start');
            }

            node2 = el.rendNodeTriangleEnd;
            if (ev_la) {
                str = this.toStr(this.container.id, '_', el.id, 'TriangleEnd', a.typeLast);

                // If we try to set the same arrow head as is already set, we can bail out now
                if (!Type.exists(node2) || node2.id !== str) {
                    node2 = this.container.ownerDocument.getElementById(str);
                    // Check if the marker already exists.
                    // If not, create a new marker
                    if (node2 === null) {
                        node2 = this._createArrowHead(el, "End", a.typeLast);
                        this.defs.appendChild(node2);
                    }
                    el.rendNodeTriangleEnd = node2;
                    el.rendNode.setAttributeNS(null, "marker-end", this.toURL(str));
                }
            } else {
                if (Type.exists(node2)) {
                    this.remove(node2);
                    el.rendNodeTriangleEnd = null;
                }
                // el.rendNode.setAttributeNS(null, "marker-end", null);
                el.rendNode.removeAttributeNS(null, "marker-end");
            }
        },

        // Already documented in JXG.AbstractRenderer
        updateEllipsePrim: function (node, x, y, rx, ry) {
            var huge = 1000000;

            huge = 200000; // IE
            // webkit does not like huge values if the object is dashed
            // iE doesn't like huge values above 216000
            x = Math.abs(x) < huge ? x : (huge * x) / Math.abs(x);
            y = Math.abs(y) < huge ? y : (huge * y) / Math.abs(y);
            rx = Math.abs(rx) < huge ? rx : (huge * rx) / Math.abs(rx);
            ry = Math.abs(ry) < huge ? ry : (huge * ry) / Math.abs(ry);

            node.setAttributeNS(null, "cx", x);
            node.setAttributeNS(null, "cy", y);
            node.setAttributeNS(null, "rx", Math.abs(rx));
            node.setAttributeNS(null, "ry", Math.abs(ry));
        },

        // Already documented in JXG.AbstractRenderer
        updateLinePrim: function (node, p1x, p1y, p2x, p2y) {
            var huge = 1000000;

            huge = 200000; //IE
            if (!isNaN(p1x + p1y + p2x + p2y)) {
                // webkit does not like huge values if the object is dashed
                // IE doesn't like huge values above 216000
                p1x = Math.abs(p1x) < huge ? p1x : (huge * p1x) / Math.abs(p1x);
                p1y = Math.abs(p1y) < huge ? p1y : (huge * p1y) / Math.abs(p1y);
                p2x = Math.abs(p2x) < huge ? p2x : (huge * p2x) / Math.abs(p2x);
                p2y = Math.abs(p2y) < huge ? p2y : (huge * p2y) / Math.abs(p2y);

                node.setAttributeNS(null, "x1", p1x);
                node.setAttributeNS(null, "y1", p1y);
                node.setAttributeNS(null, "x2", p2x);
                node.setAttributeNS(null, "y2", p2y);
            }
        },

        // Already documented in JXG.AbstractRenderer
        updatePathPrim: function (node, pointString) {
            if (pointString === "") {
                pointString = "M 0 0";
            }
            node.setAttributeNS(null, "d", pointString);
        },

        // Already documented in JXG.AbstractRenderer
        updatePathStringPoint: function (el, size, type) {
            var s = "",
                scr = el.coords.scrCoords,
                sqrt32 = size * Math.sqrt(3) * 0.5,
                s05 = size * 0.5;

            if (type === 'x') {
                s =
                    " M " +
                    (scr[1] - size) +
                    " " +
                    (scr[2] - size) +
                    " L " +
                    (scr[1] + size) +
                    " " +
                    (scr[2] + size) +
                    " M " +
                    (scr[1] + size) +
                    " " +
                    (scr[2] - size) +
                    " L " +
                    (scr[1] - size) +
                    " " +
                    (scr[2] + size);
            } else if (type === "+") {
                s =
                    " M " +
                    (scr[1] - size) +
                    " " +
                    scr[2] +
                    " L " +
                    (scr[1] + size) +
                    " " +
                    scr[2] +
                    " M " +
                    scr[1] +
                    " " +
                    (scr[2] - size) +
                    " L " +
                    scr[1] +
                    " " +
                    (scr[2] + size);
            } else if (type === "|") {
                s =
                    " M " +
                    scr[1] +
                    " " +
                    (scr[2] - size) +
                    " L " +
                    scr[1] +
                    " " +
                    (scr[2] + size);
            } else if (type === "-") {
                s =
                    " M " +
                    (scr[1] - size) +
                    " " +
                    scr[2] +
                    " L " +
                    (scr[1] + size) +
                    " " +
                    scr[2];
            } else if (type === "<>" || type === "<<>>") {
                if (type === "<<>>") {
                    size *= 1.41;
                }
                s =
                    " M " +
                    (scr[1] - size) +
                    " " +
                    scr[2] +
                    " L " +
                    scr[1] +
                    " " +
                    (scr[2] + size) +
                    " L " +
                    (scr[1] + size) +
                    " " +
                    scr[2] +
                    " L " +
                    scr[1] +
                    " " +
                    (scr[2] - size) +
                    " Z ";
                } else if (type === "^") {
                    s =
                    " M " +
                    scr[1] +
                    " " +
                    (scr[2] - size) +
                    " L " +
                    (scr[1] - sqrt32) +
                    " " +
                    (scr[2] + s05) +
                    " L " +
                    (scr[1] + sqrt32) +
                    " " +
                    (scr[2] + s05) +
                    " Z "; // close path
            } else if (type === 'v') {
                s =
                    " M " +
                    scr[1] +
                    " " +
                    (scr[2] + size) +
                    " L " +
                    (scr[1] - sqrt32) +
                    " " +
                    (scr[2] - s05) +
                    " L " +
                    (scr[1] + sqrt32) +
                    " " +
                    (scr[2] - s05) +
                    " Z ";
            } else if (type === ">") {
                s =
                    " M " +
                    (scr[1] + size) +
                    " " +
                    scr[2] +
                    " L " +
                    (scr[1] - s05) +
                    " " +
                    (scr[2] - sqrt32) +
                    " L " +
                    (scr[1] - s05) +
                    " " +
                    (scr[2] + sqrt32) +
                    " Z ";
            } else if (type === "<") {
                s =
                    " M " +
                    (scr[1] - size) +
                    " " +
                    scr[2] +
                    " L " +
                    (scr[1] + s05) +
                    " " +
                    (scr[2] - sqrt32) +
                    " L " +
                    (scr[1] + s05) +
                    " " +
                    (scr[2] + sqrt32) +
                    " Z ";
            }
            return s;
        },

        // Already documented in JXG.AbstractRenderer
        updatePathStringPrim: function (el) {
            var i,
                scr,
                len,
                symbm = " M ",
                symbl = " L ",
                symbc = " C ",
                nextSymb = symbm,
                maxSize = 5000.0,
                pStr = "";

            if (el.numberPoints <= 0) {
                return "";
            }

            len = Math.min(el.points.length, el.numberPoints);

            if (el.bezierDegree === 1) {
                for (i = 0; i < len; i++) {
                    scr = el.points[i].scrCoords;
                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        // Chrome has problems with values being too far away.
                        scr[1] = Math.max(Math.min(scr[1], maxSize), -maxSize);
                        scr[2] = Math.max(Math.min(scr[2], maxSize), -maxSize);

                        // Attention: first coordinate may be inaccurate if far way
                        //pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                        pStr += nextSymb + scr[1] + " " + scr[2]; // Seems to be faster now (webkit and firefox)
                        nextSymb = symbl;
                    }
                }
            } else if (el.bezierDegree === 3) {
                i = 0;
                while (i < len) {
                    scr = el.points[i].scrCoords;
                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        pStr += nextSymb + scr[1] + " " + scr[2];
                        if (nextSymb === symbc) {
                            i += 1;
                            scr = el.points[i].scrCoords;
                            pStr += " " + scr[1] + " " + scr[2];
                            i += 1;
                            scr = el.points[i].scrCoords;
                            pStr += " " + scr[1] + " " + scr[2];
                        }
                        nextSymb = symbc;
                    }
                    i += 1;
                }
            }
            return pStr;
        },

        // Already documented in JXG.AbstractRenderer
        updatePathStringBezierPrim: function (el) {
            var i, j, k,
                scr,
                lx, ly,
                len,
                symbm = " M ",
                symbl = " C ",
                nextSymb = symbm,
                maxSize = 5000.0,
                pStr = "",
                f = el.evalVisProp('strokewidth'),
                isNoPlot = el.evalVisProp('curvetype') !== 'plot';

            if (el.numberPoints <= 0) {
                return "";
            }

            if (isNoPlot && el.board.options.curve.RDPsmoothing) {
                el.points = Numerics.RamerDouglasPeucker(el.points, 0.5);
            }

            len = Math.min(el.points.length, el.numberPoints);
            for (j = 1; j < 3; j++) {
                nextSymb = symbm;
                for (i = 0; i < len; i++) {
                    scr = el.points[i].scrCoords;

                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        // Chrome has problems with values being too far away.
                        scr[1] = Math.max(Math.min(scr[1], maxSize), -maxSize);
                        scr[2] = Math.max(Math.min(scr[2], maxSize), -maxSize);

                        // Attention: first coordinate may be inaccurate if far way
                        if (nextSymb === symbm) {
                            //pStr += [nextSymb, scr[1], ' ', scr[2]].join('');
                            pStr += nextSymb + scr[1] + " " + scr[2]; // Seems to be faster now (webkit and firefox)
                        } else {
                            k = 2 * j;
                            pStr += [
                                nextSymb,
                                lx + (scr[1] - lx) * 0.333 + f * (k * Math.random() - j),
                                " ",
                                ly + (scr[2] - ly) * 0.333 + f * (k * Math.random() - j),
                                " ",
                                lx + (scr[1] - lx) * 0.666 + f * (k * Math.random() - j),
                                " ",
                                ly + (scr[2] - ly) * 0.666 + f * (k * Math.random() - j),
                                " ",
                                scr[1],
                                " ",
                                scr[2]
                            ].join("");
                        }

                        nextSymb = symbl;
                        lx = scr[1];
                        ly = scr[2];
                    }
                }
            }
            return pStr;
        },

        // Already documented in JXG.AbstractRenderer
        updatePolygonPrim: function (node, el) {
            var i,
                pStr = "",
                scrCoords,
                len = el.vertices.length;

            node.setAttributeNS(null, "stroke", 'none');
            node.setAttributeNS(null, "fill-rule", 'evenodd');
            if (el.elType === 'polygonalchain') {
                len++;
            }

            for (i = 0; i < len - 1; i++) {
                if (el.vertices[i].isReal) {
                    scrCoords = el.vertices[i].coords.scrCoords;
                    pStr = pStr + scrCoords[1] + "," + scrCoords[2];
                } else {
                    node.setAttributeNS(null, "points", "");
                    return;
                }

                if (i < len - 2) {
                    pStr += " ";
                }
            }
            if (pStr.indexOf('NaN') === -1) {
                node.setAttributeNS(null, "points", pStr);
            }
        },

        // Already documented in JXG.AbstractRenderer
        updateRectPrim: function (node, x, y, w, h) {
            node.setAttributeNS(null, "x", x);
            node.setAttributeNS(null, "y", y);
            node.setAttributeNS(null, "width", w);
            node.setAttributeNS(null, "height", h);
        },

        /* ********* Set attributes *********** */

        /**
         * Call user-defined function to set visual attributes.
         * If "testAttribute" is the empty string, the function
         * is called immediately, otherwise it is called in a timeOut.
         *
         * This is necessary to realize smooth transitions but avoid transitions
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
        _setAttribute: function (setFunc, testAttribute) {
            if (testAttribute === "") {
                setFunc();
            } else {
                window.setTimeout(setFunc, 1);
            }
        },

        display: function (el, val) {
            var node;

            if (el && el.rendNode) {
                el.visPropOld.visible = val;
                node = el.rendNode;
                if (val) {
                    node.setAttributeNS(null, "display", 'inline');
                    node.style.visibility = 'inherit';
                } else {
                    node.setAttributeNS(null, "display", 'none');
                    node.style.visibility = 'hidden';
                }
            }
        },

        // documented in JXG.AbstractRenderer
        hide: function (el) {
            JXG.deprecated("Board.renderer.hide()", "Board.renderer.display()");
            this.display(el, false);
        },

        // documented in JXG.AbstractRenderer
        setARIA: function(el) {
            // This method is only called in abstractRenderer._updateVisual() if aria.enabled == true.
            var key, k, v;

            // this.setPropertyPrim(el.rendNode, 'aria-label', el.evalVisProp('aria.label'));
            // this.setPropertyPrim(el.rendNode, 'aria-live', el.evalVisProp('aria.live'));
            for (key in el.visProp.aria) {
                if (el.visProp.aria.hasOwnProperty(key) && key !== 'enabled') {
                    k = 'aria.' + key;
                    v = el.evalVisProp('aria.' + key);
                    if (el.visPropOld[k] !== v) {
                        this.setPropertyPrim(el.rendNode, 'aria-' + key, v);
                        el.visPropOld[k] = v;
                    }
                }
            }
        },

        // documented in JXG.AbstractRenderer
        setBuffering: function (el, type) {
            el.rendNode.setAttribute("buffered-rendering", type);
        },

        // documented in JXG.AbstractRenderer
        setCssClass(el, cssClass) {

            if (el.visPropOld.cssclass !== cssClass) {
                this.setPropertyPrim(el.rendNode, 'class', cssClass);
                el.visPropOld.cssclass = cssClass;
            }
        },

        // documented in JXG.AbstractRenderer
        setDashStyle: function (el) {
            var dashStyle = el.evalVisProp('dash'),
                ds = el.evalVisProp('dashscale'),
                sw = ds ? 0.5 * el.evalVisProp('strokewidth') : 1,
                node = el.rendNode;

            if (dashStyle > 0) {
                node.setAttributeNS(null, "stroke-dasharray",
                    // sw could distinguish highlighting or not.
                    // But it seems to preferable to ignore this.
                    this.dashArray[dashStyle - 1].map(function (x) { return x * sw; }).join(',')
                );
            } else {
                if (node.hasAttributeNS(null, "stroke-dasharray")) {
                    node.removeAttributeNS(null, "stroke-dasharray");
                }
            }
        },

        // documented in JXG.AbstractRenderer
        setGradient: function (el) {
            var fillNode = el.rendNode,
                node, node2, node3,
                ev_g = el.evalVisProp('gradient');

            if (ev_g === "linear" || ev_g === 'radial') {
                node = this.createPrim(ev_g + "Gradient", el.id + "_gradient");
                node2 = this.createPrim("stop", el.id + "_gradient1");
                node3 = this.createPrim("stop", el.id + "_gradient2");
                node.appendChild(node2);
                node.appendChild(node3);
                this.defs.appendChild(node);
                fillNode.setAttributeNS(
                    null,
                    'style',
                    // "fill:url(#" + this.container.id + "_" + el.id + "_gradient)"
                    'fill:' + this.toURL(this.container.id + '_' + el.id + '_gradient')
                );
                el.gradNode1 = node2;
                el.gradNode2 = node3;
                el.gradNode = node;
            } else {
                fillNode.removeAttributeNS(null, 'style');
            }
        },

        // documented in JXG.AbstractRenderer
        setLineCap: function (el) {
            var capStyle = el.evalVisProp('linecap');

            if (
                capStyle === undefined ||
                capStyle === "" ||
                el.visPropOld.linecap === capStyle ||
                !Type.exists(el.rendNode)
            ) {
                return;
            }

            this.setPropertyPrim(el.rendNode, "stroke-linecap", capStyle);
            el.visPropOld.linecap = capStyle;
        },

        // documented in JXG.AbstractRenderer
        setObjectFillColor: function (el, color, opacity, rendNode) {
            var node, c, rgbo, oo,
                rgba = color,
                o = opacity,
                grad = el.evalVisProp('gradient');

            o = o > 0 ? o : 0;

            // TODO  save gradient and gradientangle
            if (
                el.visPropOld.fillcolor === rgba &&
                el.visPropOld.fillopacity === o &&
                grad === null
            ) {
                return;
            }
            if (Type.exists(rgba) && rgba !== false) {
                if (rgba.length !== 9) {
                    // RGB, not RGBA
                    c = rgba;
                    oo = o;
                } else {
                    // True RGBA, not RGB
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }

                if (rendNode === undefined) {
                    node = el.rendNode;
                } else {
                    node = rendNode;
                }

                if (c !== "none" && c !== "" && c !== false) {
                    this._setAttribute(function () {
                        node.setAttributeNS(null, "fill", c);
                    }, el.visPropOld.fillcolor);
                }

                if (el.type === JXG.OBJECT_TYPE_IMAGE) {
                    this._setAttribute(function () {
                        node.setAttributeNS(null, "opacity", oo);
                    }, el.visPropOld.fillopacity);
                    //node.style['opacity'] = oo;  // This would overwrite values set by CSS class.
                } else {
                    if (c === 'none') {
                        // This is done only for non-images
                        // because images have no fill color.
                        oo = 0;
                        // This is necessary if there is a foreignObject below.
                        node.setAttributeNS(null, "pointer-events", 'visibleStroke');
                    } else {
                        // This is the default
                        node.setAttributeNS(null, "pointer-events", 'visiblePainted');
                    }
                    this._setAttribute(function () {
                        node.setAttributeNS(null, 'fill-opacity', oo);
                    }, el.visPropOld.fillopacity);
                }

                if (grad === "linear" || grad === 'radial') {
                    this.updateGradient(el);
                }
            }
            el.visPropOld.fillcolor = rgba;
            el.visPropOld.fillopacity = o;
        },

        // documented in JXG.AbstractRenderer
        setObjectStrokeColor: function (el, color, opacity) {
            var rgba = color,
                c, rgbo,
                o = opacity,
                oo, node;

            o = o > 0 ? o : 0;

            if (el.visPropOld.strokecolor === rgba && el.visPropOld.strokeopacity === o) {
                return;
            }

            if (Type.exists(rgba) && rgba !== false) {
                if (rgba.length !== 9) {
                    // RGB, not RGBA
                    c = rgba;
                    oo = o;
                } else {
                    // True RGBA, not RGB
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }

                node = el.rendNode;

                if (el.elementClass === Const.OBJECT_CLASS_TEXT) {
                    if (el.evalVisProp('display') === 'html') {
                        this._setAttribute(function () {
                            node.style.color = c;
                            node.style.opacity = oo;
                        }, el.visPropOld.strokecolor);
                    } else {
                        this._setAttribute(function () {
                            node.setAttributeNS(null, 'fill', c);
                            node.setAttributeNS(null, 'fill-opacity', oo);
                        }, el.visPropOld.strokecolor);
                    }
                } else {
                    this._setAttribute(function () {
                        node.setAttributeNS(null, "stroke", c);
                        node.setAttributeNS(null, 'stroke-opacity', oo);
                    }, el.visPropOld.strokecolor);
                }

                if (
                    el.elementClass === Const.OBJECT_CLASS_CURVE ||
                    el.elementClass === Const.OBJECT_CLASS_LINE
                ) {
                    if (el.evalVisProp('firstarrow')) {
                        this._setArrowColor(
                            el.rendNodeTriangleStart,
                            c, oo, el,
                            el.visPropCalc.typeFirst
                        );
                    }

                    if (el.evalVisProp('lastarrow')) {
                        this._setArrowColor(
                            el.rendNodeTriangleEnd,
                            c, oo, el,
                            el.visPropCalc.typeLast
                        );
                    }
                }
            }

            el.visPropOld.strokecolor = rgba;
            el.visPropOld.strokeopacity = o;
        },

        // documented in JXG.AbstractRenderer
        setObjectStrokeWidth: function (el, width) {
            var node,
                w = width;

            if (isNaN(w) || el.visPropOld.strokewidth === w) {
                return;
            }

            node = el.rendNode;
            this.setPropertyPrim(node, "stroked", 'true');
            if (Type.exists(w)) {
                this.setPropertyPrim(node, "stroke-width", w + 'px');

                // if (el.elementClass === Const.OBJECT_CLASS_CURVE ||
                // el.elementClass === Const.OBJECT_CLASS_LINE) {
                //     if (el.evalVisProp('firstarrow')) {
                //         this._setArrowWidth(el.rendNodeTriangleStart, w, el.rendNode);
                //     }
                //
                //     if (el.evalVisProp('lastarrow')) {
                //         this._setArrowWidth(el.rendNodeTriangleEnd, w, el.rendNode);
                //     }
                // }
            }
            el.visPropOld.strokewidth = w;
        },

        // documented in JXG.AbstractRenderer
        setObjectTransition: function (el, duration) {
            var node, props,
                transitionArr = [],
                transitionStr,
                i,
                len = 0,
                nodes = ["rendNode", "rendNodeTriangleStart", "rendNodeTriangleEnd"];

            if (duration === undefined) {
                duration = el.evalVisProp('transitionduration');
            }

            props = el.evalVisProp('transitionproperties');
            if (duration === el.visPropOld.transitionduration &&
                props === el.visPropOld.transitionproperties) {
                return;
            }

            // if (
            //     el.elementClass === Const.OBJECT_CLASS_TEXT &&
            //     el.evalVisProp('display') === "html"
            // ) {
            //     // transitionStr = " color " + duration + "ms," +
            //     //     " opacity " + duration + 'ms'
            //     transitionStr = " all " + duration + "ms ease";
            // } else {
            //     transitionStr =
            //         " fill " + duration + "ms," +
            //         " fill-opacity " + duration + "ms," +
            //         " stroke " + duration + "ms," +
            //         " stroke-opacity " + duration + "ms," +
            //         " stroke-width " + duration + "ms," +
            //         " width " + duration + "ms," +
            //         " height " + duration + "ms," +
            //         " rx " + duration + "ms," +
            //         " ry " + duration + 'ms'
            // }

            if (Type.exists(props)) {
                len = props.length;
            }
            for (i = 0; i < len; i++) {
                transitionArr.push(props[i] + ' ' + duration + 'ms');
            }
            transitionStr = transitionArr.join(', ');

            len = nodes.length;
            for (i = 0; i < len; ++i) {
                if (el[nodes[i]]) {
                    node = el[nodes[i]];
                    node.style.transition = transitionStr;
                }
            }

            el.visPropOld.transitionduration = duration;
            el.visPropOld.transitionproperties = props;
        },

        // documented in JXG.AbstractRenderer
        setShadow: function (el) {
            var ev_s = el.evalVisProp('shadow'),
                ev_s_json, c, b, bl, o, op, id, node,
                use_board_filter = true,
                show = false;

            ev_s_json = JSON.stringify(ev_s);
            if (ev_s_json === el.visPropOld.shadow) {
                return;
            }

            if (typeof ev_s === 'boolean') {
                use_board_filter = true;
                show = ev_s;
                c = 'none';
                b = 3;
                bl = 0.1;
                o = [5, 5];
                op = 1;
            } else {
                if (el.evalVisProp('shadow.enabled')) {
                    use_board_filter = false;
                    show = true;
                    c = JXG.rgbParser(el.evalVisProp('shadow.color'));
                    b = el.evalVisProp('shadow.blur');
                    bl = el.evalVisProp('shadow.blend');
                    o = el.evalVisProp('shadow.offset');
                    op = el.evalVisProp('shadow.opacity');
                } else {
                    show = false;
                }
            }

            if (Type.exists(el.rendNode)) {
                if (show) {
                    if (use_board_filter) {
                        el.rendNode.setAttributeNS(null, 'filter', this.toURL(this.container.id + '_' + 'f1'));
                        // 'url(#' + this.container.id + '_' + 'f1)');
                    } else {
                        node = this.container.ownerDocument.getElementById(id);
                        if (node) {
                            this.defs.removeChild(node);
                        }
                        id = el.rendNode.id + '_' + 'f1';
                        this.defs.appendChild(this.createShadowFilter(id, c, op, bl, b, o));
                        el.rendNode.setAttributeNS(null, 'filter', this.toURL(id));
                        // 'url(#' + id + ')');
                    }
                } else {
                    el.rendNode.removeAttributeNS(null, 'filter');
                }
            }

            el.visPropOld.shadow = ev_s_json;
        },

        // documented in JXG.AbstractRenderer
        setTabindex: function (el) {
            var val;
            if (el.board.attr.keyboard.enabled && Type.exists(el.rendNode)) {
                val = el.evalVisProp('tabindex');
                if (!el.visPropCalc.visible /* || el.evalVisProp('fixed') */) {
                    val = null;
                }
                if (val !== el.visPropOld.tabindex) {
                    el.rendNode.setAttribute("tabindex", val);
                    el.visPropOld.tabindex = val;
                }
            }
        },

        // documented in JXG.AbstractRenderer
        setPropertyPrim: function (node, key, val) {
            if (key === 'stroked') {
                return;
            }
            node.setAttributeNS(null, key, val);
        },

        // documented in JXG.AbstractRenderer
        show: function (el) {
            JXG.deprecated("Board.renderer.show()", "Board.renderer.display()");
            this.display(el, true);
            // var node;
            //
            // if (el && el.rendNode) {
            //     node = el.rendNode;
            //     node.setAttributeNS(null, 'display', 'inline');
            //     node.style.visibility = 'inherit'
            // }
        },

        // documented in JXG.AbstractRenderer
        updateGradient: function (el) {
            var col,
                op,
                node2 = el.gradNode1,
                node3 = el.gradNode2,
                ev_g = el.evalVisProp('gradient');

            if (!Type.exists(node2) || !Type.exists(node3)) {
                return;
            }

            op = el.evalVisProp('fillopacity');
            op = op > 0 ? op : 0;
            col = el.evalVisProp('fillcolor');

            node2.setAttributeNS(null, "style", "stop-color:" + col + ";stop-opacity:" + op);
            node3.setAttributeNS(
                null,
                "style",
                "stop-color:" +
                el.evalVisProp('gradientsecondcolor') +
                ";stop-opacity:" +
                el.evalVisProp('gradientsecondopacity')
            );
            node2.setAttributeNS(
                null,
                "offset",
                el.evalVisProp('gradientstartoffset') * 100 + "%"
            );
            node3.setAttributeNS(
                null,
                "offset",
                el.evalVisProp('gradientendoffset') * 100 + "%"
            );
            if (ev_g === 'linear') {
                this.updateGradientAngle(el.gradNode, el.evalVisProp('gradientangle'));
            } else if (ev_g === 'radial') {
                this.updateGradientCircle(
                    el.gradNode,
                    el.evalVisProp('gradientcx'),
                    el.evalVisProp('gradientcy'),
                    el.evalVisProp('gradientr'),
                    el.evalVisProp('gradientfx'),
                    el.evalVisProp('gradientfy'),
                    el.evalVisProp('gradientfr')
                );
            }
        },

        /**
         * Set the gradient angle for linear color gradients.
         *
         * @private
         * @param {SVGnode} node SVG gradient node of an arbitrary JSXGraph element.
         * @param {Number} radians angle value in radians. 0 is horizontal from left to right, Pi/4 is vertical from top to bottom.
         */
        updateGradientAngle: function (node, radians) {
            // Angles:
            // 0: ->
            // 90: down
            // 180: <-
            // 90: up
            var f = 1.0,
                co = Math.cos(radians),
                si = Math.sin(radians);

            if (Math.abs(co) > Math.abs(si)) {
                f /= Math.abs(co);
            } else {
                f /= Math.abs(si);
            }

            if (co >= 0) {
                node.setAttributeNS(null, "x1", 0);
                node.setAttributeNS(null, "x2", co * f);
            } else {
                node.setAttributeNS(null, "x1", -co * f);
                node.setAttributeNS(null, "x2", 0);
            }
            if (si >= 0) {
                node.setAttributeNS(null, "y1", 0);
                node.setAttributeNS(null, "y2", si * f);
            } else {
                node.setAttributeNS(null, "y1", -si * f);
                node.setAttributeNS(null, "y2", 0);
            }
        },

        /**
         * Set circles for radial color gradients.
         *
         * @private
         * @param {SVGnode} node SVG gradient node
         * @param {Number} cx SVG value cx (value between 0 and 1)
         * @param {Number} cy  SVG value cy (value between 0 and 1)
         * @param {Number} r  SVG value r (value between 0 and 1)
         * @param {Number} fx  SVG value fx (value between 0 and 1)
         * @param {Number} fy  SVG value fy (value between 0 and 1)
         * @param {Number} fr  SVG value fr (value between 0 and 1)
         */
        updateGradientCircle: function (node, cx, cy, r, fx, fy, fr) {
            node.setAttributeNS(null, "cx", cx * 100 + "%"); // Center first color
            node.setAttributeNS(null, "cy", cy * 100 + "%");
            node.setAttributeNS(null, "r", r * 100 + "%");
            node.setAttributeNS(null, "fx", fx * 100 + "%"); // Center second color / focal point
            node.setAttributeNS(null, "fy", fy * 100 + "%");
            node.setAttributeNS(null, "fr", fr * 100 + "%");
        },

        /* ********* Renderer control *********** */

        // documented in JXG.AbstractRenderer
        suspendRedraw: function () {
            // It seems to be important for the Linux version of firefox
            this.suspendHandle = this.svgRoot.suspendRedraw(10000);
        },

        // documented in JXG.AbstractRenderer
        unsuspendRedraw: function () {
            this.svgRoot.unsuspendRedraw(this.suspendHandle);
            // this.svgRoot.unsuspendRedrawAll();
            //this.svgRoot.forceRedraw();
        },

        // documented in AbstractRenderer
        resize: function (w, h) {
            this.svgRoot.setAttribute("width", parseFloat(w));
            this.svgRoot.setAttribute("height", parseFloat(h));
        },

        // documented in JXG.AbstractRenderer
        createTouchpoints: function (n) {
            var i, na1, na2, node;
            this.touchpoints = [];
            for (i = 0; i < n; i++) {
                na1 = "touchpoint1_" + i;
                node = this.createPrim("path", na1);
                this.appendChildPrim(node, 19);
                node.setAttributeNS(null, "d", "M 0 0");
                this.touchpoints.push(node);

                this.setPropertyPrim(node, "stroked", 'true');
                this.setPropertyPrim(node, "stroke-width", '1px');
                node.setAttributeNS(null, "stroke", "#000000");
                node.setAttributeNS(null, 'stroke-opacity', 1.0);
                node.setAttributeNS(null, "display", 'none');

                na2 = "touchpoint2_" + i;
                node = this.createPrim("ellipse", na2);
                this.appendChildPrim(node, 19);
                this.updateEllipsePrim(node, 0, 0, 0, 0);
                this.touchpoints.push(node);

                this.setPropertyPrim(node, "stroked", 'true');
                this.setPropertyPrim(node, "stroke-width", '1px');
                node.setAttributeNS(null, "stroke", "#000000");
                node.setAttributeNS(null, "fill", "#ffffff");
                node.setAttributeNS(null, 'stroke-opacity', 1.0);
                node.setAttributeNS(null, 'fill-opacity', 0.0);
                node.setAttributeNS(null, "display", 'none');
            }
        },

        // documented in JXG.AbstractRenderer
        showTouchpoint: function (i) {
            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                this.touchpoints[2 * i].setAttributeNS(null, "display", 'inline');
                this.touchpoints[2 * i + 1].setAttributeNS(null, "display", 'inline');
            }
        },

        // documented in JXG.AbstractRenderer
        hideTouchpoint: function (i) {
            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                this.touchpoints[2 * i].setAttributeNS(null, "display", 'none');
                this.touchpoints[2 * i + 1].setAttributeNS(null, "display", 'none');
            }
        },

        // documented in JXG.AbstractRenderer
        updateTouchpoint: function (i, pos) {
            var x,
                y,
                d = 37;

            if (this.touchpoints && i >= 0 && 2 * i < this.touchpoints.length) {
                x = pos[0];
                y = pos[1];

                this.touchpoints[2 * i].setAttributeNS(
                    null,
                    "d",
                    "M " +
                    (x - d) +
                    " " +
                    y +
                    " " +
                    "L " +
                    (x + d) +
                    " " +
                    y +
                    " " +
                    "M " +
                    x +
                    " " +
                    (y - d) +
                    " " +
                    "L " +
                    x +
                    " " +
                    (y + d)
                );
                this.updateEllipsePrim(this.touchpoints[2 * i + 1], pos[0], pos[1], 25, 25);
            }
        },

        /* ********* Dump related stuff *********** */

        /**
         * Walk recursively through the DOM subtree of a node and collect all
         * value attributes together with the id of that node.
         * <b>Attention:</b> Only values of nodes having a valid id are taken.
         * @param  {Node} node   root node of DOM subtree that will be searched recursively.
         * @return {Array}      Array with entries of the form [id, value]
         * @private
         */
        _getValuesOfDOMElements: function (node) {
            var values = [];
            if (node.nodeType === 1) {
                node = node.firstChild;
                while (node) {
                    if (node.id !== undefined && node.value !== undefined) {
                        values.push([node.id, node.value]);
                    }
                    Type.concat(values, this._getValuesOfDOMElements(node));
                    node = node.nextSibling;
                }
            }
            return values;
        },

        // _getDataUri: function (url, callback) {
        //     var image = new Image();
        //     image.onload = function () {
        //         var canvas = document.createElement('canvas');
        //         canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        //         canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
        //         canvas.getContext('2d').drawImage(this, 0, 0);
        //         callback(canvas.toDataURL("image/png"));
        //         canvas.remove();
        //     };
        //     image.src = url;
        // },

        _getImgDataURL: function (svgRoot) {
            var images, len, canvas, ctx, ur, i;

            images = svgRoot.getElementsByTagName('image');
            len = images.length;
            if (len > 0) {
                canvas = document.createElement('canvas');
                //img = new Image();
                for (i = 0; i < len; i++) {
                    images[i].setAttribute("crossorigin", 'anonymous');
                    //img.src = images[i].href;
                    //img.onload = function() {
                    // img.crossOrigin = 'anonymous'
                    ctx = canvas.getContext('2d');
                    canvas.width = images[i].getAttribute('width');
                    canvas.height = images[i].getAttribute('height');
                    try {
                        ctx.drawImage(images[i], 0, 0, canvas.width, canvas.height);

                        // If the image is not png, the format must be specified here
                        ur = canvas.toDataURL();
                        images[i].setAttribute("xlink:href", ur);
                    } catch (err) {
                        console.log("CORS problem! Image can not be used", err);
                    }
                }
                //canvas.remove();
            }
            return true;
        },

        /**
         * Return a data URI of the SVG code representing the construction.
         * The SVG code of the construction is base64 encoded. The return string starts
         * with "data:image/svg+xml;base64,...".
         *
         * @param {Boolean} ignoreTexts If true, the foreignObject tag is set to display=none.
         * This is necessary for older versions of Safari. Default: false
         * @returns {String}  data URI string
         *
         * @example
         * var A = board.create('point', [2, 2]);
         *
         * var txt = board.renderer.dumpToDataURI(false);
         * // txt consists of a string of the form
         * // data:image/svg+xml;base64,PHN2Zy. base64 encoded SVG..+PC9zdmc+
         * // Behind the comma, there is the base64 encoded SVG code
         * // which is decoded with atob().
         * // The call of decodeURIComponent(escape(...)) is necessary
         * // to handle unicode strings correctly.
         * var ar = txt.split(',');
         * document.getElementById('output').value = decodeURIComponent(escape(atob(ar[1])));
         *
         * </pre><div id="JXG1bad4bec-6d08-4ce0-9b7f-d817e8dd762d" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <textarea id="output2023" rows="5" cols="50"></textarea>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG1bad4bec-6d08-4ce0-9b7f-d817e8dd762d',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var A = board.create('point', [2, 2]);
         *
         *     var txt = board.renderer.dumpToDataURI(false);
         *     // txt consists of a string of the form
         *     // data:image/svg+xml;base64,PHN2Zy. base64 encoded SVG..+PC9zdmc+
         *     // Behind the comma, there is the base64 encoded SVG code
         *     // which is decoded with atob().
         *     // The call of decodeURIComponent(escape(...)) is necessary
         *     // to handle unicode strings correctly.
         *     var ar = txt.split(',');
         *     document.getElementById('output2023').value = decodeURIComponent(escape(atob(ar[1])));
         *
         *     })();
         *
         * </script><pre>
         *
         */
        dumpToDataURI: function (ignoreTexts) {
            var svgRoot = this.svgRoot,
                btoa = window.btoa || Base64.encode,
                svg, i, len,
                values = [];

            // Move all HTML tags (beside the SVG root) of the container
            // to the foreignObject element inside of the svgRoot node
            // Problem:
            // input values are not copied. This can be verified by looking at an innerHTML output
            // of an input element. Therefore, we do it "by hand".
            if (this.container.hasChildNodes() && Type.exists(this.foreignObjLayer)) {
                if (!ignoreTexts) {
                    this.foreignObjLayer.setAttribute("display", 'inline');
                }
                while (svgRoot.nextSibling) {
                    // Copy all value attributes
                    Type.concat(values, this._getValuesOfDOMElements(svgRoot.nextSibling));
                    this.foreignObjLayer.appendChild(svgRoot.nextSibling);
                }
            }

            this._getImgDataURL(svgRoot);

            // Convert the SVG graphic into a string containing SVG code
            svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg = new XMLSerializer().serializeToString(svgRoot);

            if (ignoreTexts !== true) {
                // Handle SVG texts
                // Insert all value attributes back into the svg string
                len = values.length;
                for (i = 0; i < len; i++) {
                    svg = svg.replace(
                        'id="' + values[i][0] + '"',
                        'id="' + values[i][0] + '" value="' + values[i][1] + '"'
                    );
                }
            }

            // if (false) {
            //     // Debug: use example svg image
            //     svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="220" height="220"><rect width="66" height="30" x="21" y="32" stroke="#204a87" stroke-width="2" fill="none" /></svg>';
            // }

            // In IE we have to remove the namespace again.
            // Since 2024 we have to check if the namespace attribute appears twice in one tag, because
            // there might by a svg inside of the svg, e.g. the screenshot icon.
            if (this.isIE &&
                (svg.match(/xmlns="http:\/\/www.w3.org\/2000\/svg"\s+xmlns="http:\/\/www.w3.org\/2000\/svg"/g) || []).length > 1
            ) {
                svg = svg.replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"\s+xmlns="http:\/\/www.w3.org\/2000\/svg"/g, "");
            }

            // Safari fails if the svg string contains a "&nbsp;"
            // Obsolete with Safari 12+
            svg = svg.replace(/&nbsp;/g, " ");
            // Replacing &quot;s might be necessary for older Safari versions
            // svg = svg.replace(/url\(&quot;(.*)&quot;\)/g, "url($1)"); // Bug: does not replace matching &quot;s
            // svg = svg.replace(/&quot;/g, "");

            // Move all HTML tags back from
            // the foreignObject element to the container
            if (Type.exists(this.foreignObjLayer) && this.foreignObjLayer.hasChildNodes()) {
                // Restore all HTML elements
                while (this.foreignObjLayer.firstChild) {
                    this.container.appendChild(this.foreignObjLayer.firstChild);
                }
                this.foreignObjLayer.setAttribute("display", 'none');
            }

            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        },

        /**
         * Convert the SVG construction into an HTML canvas image.
         * This works for all SVG supporting browsers. Implemented as Promise.
         * <p>
         * Might fail if any text element or foreign object element contains SVG. This
         * is the case e.g. for the default fullscreen symbol.
         * <p>
         * For IE, it is realized as function.
         * It works from version 9, with the exception that HTML texts
         * are ignored on IE. The drawing is done with a delay of
         * 200 ms. Otherwise there would be problems with IE.
         *
         * @param {String} canvasId Id of an HTML canvas element
         * @param {Number} w Width in pixel of the dumped image, i.e. of the canvas tag.
         * @param {Number} h Height in pixel of the dumped image, i.e. of the canvas tag.
         * @param {Boolean} ignoreTexts If true, the foreignObject tag is taken out from the SVG root.
         * This is necessary for older versions of Safari. Default: false
         * @returns {Promise}  Promise object
         *
         * @example
         * 	board.renderer.dumpToCanvas('canvas').then(function() { console.log('done'); });
         *
         * @example
         *  // IE 11 example:
         * 	board.renderer.dumpToCanvas('canvas');
         * 	setTimeout(function() { console.log('done'); }, 400);
         */
        dumpToCanvas: function (canvasId, w, h, ignoreTexts) {
            var svg, tmpImg,
                cv, ctx,
                doc = this.container.ownerDocument;

            // Prepare the canvas element
            cv = doc.getElementById(canvasId);

            // Clear the canvas
            /* eslint-disable no-self-assign */
            cv.width = cv.width;
            /* eslint-enable no-self-assign */

            ctx = cv.getContext('2d');
            if (w !== undefined && h !== undefined) {
                cv.style.width = parseFloat(w) + 'px';
                cv.style.height = parseFloat(h) + 'px';
                // Scale twice the CSS size to make the image crisp
                // cv.setAttribute('width', 2 * parseFloat(wOrg));
                // cv.setAttribute('height', 2 * parseFloat(hOrg));
                // ctx.scale(2 * wOrg / w, 2 * hOrg / h);
                cv.setAttribute("width", parseFloat(w));
                cv.setAttribute("height", parseFloat(h));
            }

            // Display the SVG string as data-uri in an HTML img.
            /**
             * @type {Image}
             * @ignore
             * {ignore}
             */
            tmpImg = new Image();
            svg = this.dumpToDataURI(ignoreTexts);
            tmpImg.src = svg;

            // Finally, draw the HTML img in the canvas.
            if (!("Promise" in window)) {
                /**
                 * @function
                 * @ignore
                 */
                tmpImg.onload = function () {
                    // IE needs a pause...
                    // Seems to be broken
                    window.setTimeout(function () {
                        try {
                            ctx.drawImage(tmpImg, 0, 0, w, h);
                        } catch (err) {
                            console.log("screenshots not longer supported on IE");
                        }
                    }, 200);
                };
                return this;
            }

            return new Promise(function (resolve, reject) {
                try {
                    tmpImg.onload = function () {
                        ctx.drawImage(tmpImg, 0, 0, w, h);
                        resolve();
                    };
                } catch (e) {
                    reject(e);
                }
            });
        },

        /**
         * Display SVG image in html img-tag which enables
         * easy download for the user.
         *
         * Support:
         * <ul>
         * <li> IE: No
         * <li> Edge: full
         * <li> Firefox: full
         * <li> Chrome: full
         * <li> Safari: full (No text support in versions prior to 12).
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
        screenshot: function (board, imgId, ignoreTexts) {
            var node,
                doc = this.container.ownerDocument,
                parent = this.container.parentNode,
                // cPos,
                // cssTxt,
                canvas, id, img,
                button, buttonText,
                w, h,
                bas = board.attr.screenshot,
                navbar, navbarDisplay, insert,
                newImg = false,
                _copyCanvasToImg,
                isDebug = false;

            if (this.type === 'no') {
                return this;
            }

            w = bas.scale * this.container.getBoundingClientRect().width;
            h = bas.scale * this.container.getBoundingClientRect().height;

            if (imgId === undefined || imgId === "") {
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
                node.style.width = w + 'px';
                node.style.height = h + 'px';
                node.style.zIndex = this.container.style.zIndex + 120;

                // Try to position the div exactly over the JSXGraph board
                node.style.position = 'absolute';
                node.style.top = this.container.offsetTop + 'px';
                node.style.left = this.container.offsetLeft + 'px';
            }

            if (!isDebug) {
                // Create canvas element and add it to the DOM
                // It will be removed after the image has been stored.
                canvas = doc.createElement('canvas');
                id = Math.random().toString(36).slice(2, 7);
                canvas.setAttribute("id", id);
                canvas.setAttribute("width", w);
                canvas.setAttribute("height", h);
                canvas.style.width = w + 'px';
                canvas.style.height = w + 'px';
                canvas.style.display = 'none';
                parent.appendChild(canvas);
            } else {
                // Debug: use canvas element 'jxgbox_canvas' from jsxdev/dump.html
                id = "jxgbox_canvas";
                canvas = doc.getElementById(id);
            }

            if (newImg) {
                // Create close button
                button = doc.createElement('span');
                buttonText = doc.createTextNode("\u2716");
                button.style.cssText = bas.cssButton;
                button.appendChild(buttonText);
                button.onclick = function () {
                    node.parentNode.removeChild(node);
                };

                // Add all nodes
                node.appendChild(img);
                node.appendChild(button);
                parent.insertBefore(node, this.container.nextSibling);
            }

            // Hide navigation bar in board
            navbar = doc.getElementById(this.uniqName('navigationbar'));
            if (Type.exists(navbar)) {
                navbarDisplay = navbar.style.display;
                navbar.style.display = 'none';
                insert = this.removeToInsertLater(navbar);
            }

            _copyCanvasToImg = function () {
                // Show image in img tag
                img.src = canvas.toDataURL("image/png");

                // Remove canvas node
                if (!isDebug) {
                    parent.removeChild(canvas);
                }
            };

            // Create screenshot in image element
            if ("Promise" in window) {
                this.dumpToCanvas(id, w, h, ignoreTexts).then(_copyCanvasToImg);
            } else {
                // IE
                this.dumpToCanvas(id, w, h, ignoreTexts);
                window.setTimeout(_copyCanvasToImg, 200);
            }

            // Reinsert navigation bar in board
            if (Type.exists(navbar)) {
                navbar.style.display = navbarDisplay;
                insert();
            }

            return this;
        }
    }
);

export default JXG.SVGRenderer;
