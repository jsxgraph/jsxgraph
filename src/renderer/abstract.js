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

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true, window: true */

/*
    nomen:    Allow underscores to indicate private class members. Might be replaced by local variables.
    plusplus: Only allowed in for-loops
    newcap:   AsciiMathMl exposes non-constructor functions beginning with upper case letters
*/
/*jslint nomen: true, plusplus: true, newcap: true, unparam: true*/
/*eslint no-unused-vars: "off"*/

/**
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer defined in this file.
 */

import JXG from "../jxg.js";
import Options from "../options.js";
import Coords from "../base/coords.js";
import Const from "../base/constants.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Type from "../utils/type.js";
import Env from "../utils/env.js";

/**
 * <p>This class defines the interface to the graphics part of JSXGraph. This class is an abstract class, it
 * actually does not render anything. This is up to the {@link JXG.SVGRenderer}, {@link JXG.VMLRenderer},
 * and {@link JXG.CanvasRenderer} classes. We strongly discourage you from using the methods in these classes
 * directly. Only the methods which are defined in this class and are not marked as private are guaranteed
 * to exist in any renderer instance you can access via {@link JXG.Board#renderer}. But not all methods may
 * work as expected.</p>
 * <p>The methods of this renderer can be divided into different categories:
 * <dl>
 *     <dt>Draw basic elements</dt>
 *     <dd>In this category we find methods to draw basic elements like {@link JXG.Point}, {@link JXG.Line},
 *     and {@link JXG.Curve} as well as assisting methods tightly bound to these basic painters. You do not
 *     need to implement these methods in a descendant renderer but instead implement the primitive drawing
 *     methods described below. This approach is encouraged when you're using a XML based rendering engine
 *     like VML and SVG. If you want to use a bitmap based rendering technique you are supposed to override
 *     these methods instead of the primitive drawing methods.</dd>
 *     <dt>Draw primitives</dt>
 *     <dd>This category summarizes methods to handle primitive nodes. As creation and management of these nodes
 *     is different among different the rendering techniques most of these methods are purely virtual and need
 *     proper implementation if you choose to not overwrite the basic element drawing methods.</dd>
 *     <dt>Attribute manipulation</dt>
 *     <dd>In XML based renders you have to manipulate XML nodes and their attributes to change the graphics.
 *     For that purpose attribute manipulation methods are defined to set the color, opacity, and other things.
 *     Please note that some of these methods are required in bitmap based renderers, too, because some elements
 *     like {@link JXG.Text} can be HTML nodes floating over the construction.</dd>
 *     <dt>Renderer control</dt>
 *     <dd>Methods to clear the drawing board or to stop and to resume the rendering engine.</dd>
 * </dl></p>
 * @class JXG.AbstractRenderer
 * @constructor
 * @see JXG.SVGRenderer
 * @see JXG.VMLRenderer
 * @see JXG.CanvasRenderer
 */
JXG.AbstractRenderer = function () {
    // WHY THIS IS A CLASS INSTEAD OF A SINGLETON OBJECT:
    //
    // The renderers need to keep track of some stuff which is not always the same on different boards,
    // like enhancedRendering, reference to the container object, and resolution in VML. Sure, those
    // things could be stored in board. But they are rendering related and JXG.Board is already very
    // very big.
    //
    // And we can't save the rendering related data in {SVG,VML,Canvas}Renderer and make only the
    // JXG.AbstractRenderer a singleton because of that:
    //
    // Given an object o with property a set to true
    //     var o = {a: true};
    // and a class c doing nothing
    //     c = function() {};
    // Set c's prototype to o
    //     c.prototype = o;
    // and create an instance of c we get i.a to be true
    //     i = new c();
    //     i.a;
    //     > true
    // But we can overwrite this property via
    //     c.prototype.a = false;
    //     i.a;
    //     > false

    /**
     * The vertical offset for {@link Text} elements. Every {@link Text} element will
     * be placed this amount of pixels below the user given coordinates.
     * @type Number
     * @default 0
     */
    this.vOffsetText = 0;

    /**
     * If this property is set to <tt>true</tt> the visual properties of the elements are updated
     * on every update. Visual properties means: All the stuff stored in the
     * {@link JXG.GeometryElement#visProp} property won't be set if enhancedRendering is <tt>false</tt>
     * @type Boolean
     * @default true
     */
    this.enhancedRendering = true;

    /**
     * The HTML element that stores the JSXGraph board in it.
     * @type Node
     */
    this.container = null;

    /**
     * This is used to easily determine which renderer we are using
     * @example if (board.renderer.type === 'vml') {
     *     // do something
     * }
     * @type String
     */
    this.type = "";

    /**
     * True if the browsers' SVG engine supports foreignObject.
     * Not supported browsers are IE 9 - 11.
     * It is tested in svg renderer.
     *
     * @type Boolean
     * @private
     */
    this.supportsForeignObject = false;

    /**
     * Defines dash patterns. Sizes are in pixel.
     * Defined styles are:
     * <ol>
     * <li> 2 dash, 2 space</li>
     * <li> 5 dash, 5 space</li>
     * <li> 10 dash, 10 space</li>
     * <li> 20 dash, 20 space</li>
     * <li> 20 dash, 10 space, 10 dash, 10 space</li>
     * <li> 20 dash, 5 space, 10 dash, 5 space</li>
     * <li> 0 dash, 5 space (dotted line)</li>
     * </ol>
     * This means, the numbering is <b>1-based</b>.
     * Solid lines are set with dash:0.
     * If the object's attribute "dashScale:true" the dash pattern is multiplied by
     * strokeWidth / 2.
     *
     * @type Array
     * @default [[2, 2], [5, 5], [10, 10], [20, 20], [20, 10, 10, 10], [20, 5, 10, 5], [0, 5]]
     * @see JXG.GeometryElement#dash
     * @see JXG.GeometryElement#dashScale
     */
    this.dashArray = [
        [2, 2],
        [5, 5],
        [10, 10],
        [20, 20],
        [20, 10, 10, 10],
        [20, 5, 10, 5],
        [0, 5]
    ];
};

JXG.extend(
    JXG.AbstractRenderer.prototype,
    /** @lends JXG.AbstractRenderer.prototype */ {

        /* ********* Private methods *********** */

        /**
         * Update visual properties, but only if {@link JXG.AbstractRenderer#enhancedRendering} or <tt>enhanced</tt> is set to true.
         * @param {JXG.GeometryElement} el The element to update
         * @param {Object} [not={}] Select properties you don't want to be updated: <tt>{fill: true, dash: true}</tt> updates
         * everything except for fill and dash. Possible values are <tt>stroke, fill, dash, shadow, gradient</tt>.
         * @param {Boolean} [enhanced=false] If true, {@link JXG.AbstractRenderer#enhancedRendering} is assumed to be true.
         * @private
         */
        _updateVisual: function (el, not, enhanced) {
            if (enhanced || this.enhancedRendering) {
                not = not || {};

                this.setObjectTransition(el);
                if (!el.evalVisProp('draft')) {
                    if (!not.stroke) {
                        if (el.highlighted) {
                            this.setObjectStrokeColor(
                                el,
                                el.evalVisProp('highlightstrokecolor'),
                                el.evalVisProp('highlightstrokeopacity')
                            );
                            this.setObjectStrokeWidth(el, el.evalVisProp('highlightstrokewidth'));
                        } else {
                            this.setObjectStrokeColor(
                                el,
                                el.evalVisProp('strokecolor'),
                                el.evalVisProp('strokeopacity')
                            );
                            this.setObjectStrokeWidth(el, el.evalVisProp('strokewidth'));
                        }
                    }

                    if (!not.fill) {
                        if (el.highlighted) {
                            this.setObjectFillColor(
                                el,
                                el.evalVisProp('highlightfillcolor'),
                                el.evalVisProp('highlightfillopacity')
                            );
                        } else {
                            this.setObjectFillColor(
                                el,
                                el.evalVisProp('fillcolor'),
                                el.evalVisProp('fillopacity')
                            );
                        }
                    }

                    if (!not.dash) {
                        this.setDashStyle(el, el.visProp);
                    }

                    if (!not.shadow) {
                        this.setShadow(el);
                    }

                    // if (!not.gradient) {
                    //     // this.setGradient(el);
                    //     this.setShadow(el);
                    // }

                    if (!not.tabindex) {
                        this.setTabindex(el);
                    }
                } else {
                    this.setDraft(el);
                }

                if (el.highlighted) {
                    this.setCssClass(el, el.evalVisProp('highlightcssclass'));
                } else {
                    this.setCssClass(el, el.evalVisProp('cssclass'));
                }

                if (el.evalVisProp('aria.enabled')) {
                    this.setARIA(el);
                }
            }
        },

        /**
         * Get information if element is highlighted.
         * @param {JXG.GeometryElement} el The element which is tested for being highlighted.
         * @returns {String} 'highlight' if highlighted, otherwise the ampty string '' is returned.
         * @private
         */
        _getHighlighted: function (el) {
            var isTrace = false,
                hl;

            if (!Type.exists(el.board) || !Type.exists(el.board.highlightedObjects)) {
                // This case handles trace elements.
                // To make them work, we simply neglect highlighting.
                isTrace = true;
            }

            if (!isTrace && Type.exists(el.board.highlightedObjects[el.id])) {
                hl = 'highlight';
            } else {
                hl = "";
            }
            return hl;
        },

        /* ********* Point related stuff *********** */

        /**
         * Draws a point on the {@link JXG.Board}.
         * @param {JXG.Point} el Reference to a {@link JXG.Point} object that has to be drawn.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#updatePoint
         * @see JXG.AbstractRenderer#changePointStyle
         */
        drawPoint: function (el) {
            var prim,
                // Sometimes el is not a real point and lacks the methods of a JXG.Point instance,
                // in these cases to not use el directly.
                face = Options.normalizePointFace(el.evalVisProp('face'));

            // Determine how the point looks like
            if (face === 'o') {
                prim = 'ellipse';
            } else if (face === "[]") {
                prim = 'rect';
            } else {
                // cross/x, diamond/<>, triangleup/A/^, triangledown/v, triangleleft/<,
                // triangleright/>, plus/+, |, -
                prim = 'path';
            }

            el.rendNode = this.appendChildPrim(
                this.createPrim(prim, el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, prim);

            // Adjust visual properties
            this._updateVisual(el, { dash: true, shadow: true }, true);

            // By now we only created the xml nodes and set some styles, in updatePoint
            // the attributes are filled with data.
            this.updatePoint(el);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Point}.
         * @param {JXG.Point} el Reference to a {@link JXG.Point} object, that has to be updated.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#drawPoint
         * @see JXG.AbstractRenderer#changePointStyle
         */
        updatePoint: function (el) {
            var size = el.evalVisProp('size'),
                // sometimes el is not a real point and lacks the methods of a JXG.Point instance,
                // in these cases to not use el directly.
                face = Options.normalizePointFace(el.evalVisProp('face')),
                unit = el.evalVisProp('sizeunit'),
                zoom = el.evalVisProp('zoom'),
                s1;

            if (!isNaN(el.coords.scrCoords[2] + el.coords.scrCoords[1])) {
                if (unit === 'user') {
                    size *= Math.sqrt(Math.abs(el.board.unitX * el.board.unitY));
                }
                size *= !el.board || !zoom ? 1.0 : Math.sqrt(el.board.zoomX * el.board.zoomY);
                s1 = size === 0 ? 0 : size + 1;

                if (face === 'o') {
                    // circle
                    this.updateEllipsePrim(
                        el.rendNode,
                        el.coords.scrCoords[1],
                        el.coords.scrCoords[2],
                        s1,
                        s1
                    );
                } else if (face === "[]") {
                    // rectangle
                    this.updateRectPrim(
                        el.rendNode,
                        el.coords.scrCoords[1] - size,
                        el.coords.scrCoords[2] - size,
                        size * 2,
                        size * 2
                    );
                } else {
                    // x, +, <>, <<>>, ^, v, <, >
                    this.updatePathPrim(
                        el.rendNode,
                        this.updatePathStringPoint(el, size, face),
                        el.board
                    );
                }
                this._updateVisual(el, { dash: false, shadow: false });
                this.setShadow(el);
            }
        },

        /**
         * Changes the style of a {@link JXG.Point}. This is required because the point styles differ in what
         * elements have to be drawn, e.g. if the point is marked by a "x" or a "+" two lines are drawn, if
         * it's marked by spot a circle is drawn. This method removes the old renderer element(s) and creates
         * the new one(s).
         * @param {JXG.Point} el Reference to a {@link JXG.Point} object, that's style is changed.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#updatePoint
         * @see JXG.AbstractRenderer#drawPoint
         */
        changePointStyle: function (el) {
            var node = this.getElementById(el.id);

            // remove the existing point rendering node
            if (Type.exists(node)) {
                this.remove(node);
            }

            // and make a new one
            this.drawPoint(el);
            Type.clearVisPropOld(el);

            if (!el.visPropCalc.visible) {
                this.display(el, false);
            }

            if (el.evalVisProp('draft')) {
                this.setDraft(el);
            }
        },

        /* ********* Line related stuff *********** */

        /**
         * Draws a line on the {@link JXG.Board}.
         * @param {JXG.Line} el Reference to a line object, that has to be drawn.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#updateLine
         */
        drawLine: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("line", el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, 'lines');
            this.updateLine(el);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Line}.
         * @param {JXG.Line} el Reference to the {@link JXG.Line} object that has to be updated.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#drawLine
         */
        updateLine: function (el) {
            this._updateVisual(el);
            this.updatePathWithArrowHeads(el); // Calls the renderer primitive
            this.setLineCap(el);
        },

        /* ********* Curve related stuff *********** */

        /**
         * Draws a {@link JXG.Curve} on the {@link JXG.Board}.
         * @param {JXG.Curve} el Reference to a graph object, that has to be plotted.
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#updateCurve
         */
        drawCurve: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("path", el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, 'path');
            this.updateCurve(el);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Curve}.
         * @param {JXG.Curve} el Reference to a {@link JXG.Curve} object, that has to be updated.
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#drawCurve
         */
        updateCurve: function (el) {
            this._updateVisual(el);
            this.updatePathWithArrowHeads(el); // Calls the renderer primitive
            this.setLineCap(el);
        },

        /* ********* Arrow heads and related stuff *********** */

        /**
         * Handles arrow heads of a line or curve element and calls the renderer primitive.
         *
         * @param {JXG.GeometryElement} el Reference to a line or curve object that has to be drawn.
         * @param {Boolean} doHighlight
         *
         * @private
         * @see Line
         * @see JXG.Line
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#updateLine
         * @see JXG.AbstractRenderer#updateCurve
         * @see JXG.AbstractRenderer#makeArrows
         * @see JXG.AbstractRenderer#getArrowHeadData
         */
        updatePathWithArrowHeads: function (el, doHighlight) {
            var hl = doHighlight ? 'highlight' : '',
                w,
                arrowData;

            if (doHighlight && el.evalVisProp('highlightstrokewidth')) {
                w = Math.max(
                    el.evalVisProp('highlightstrokewidth'),
                    el.evalVisProp('strokewidth')
                );
            } else {
                w = el.evalVisProp('strokewidth');
            }

            // Get information if there are arrow heads and how large they are.
            arrowData = this.getArrowHeadData(el, w, hl);

            // Create the SVG nodes if necessary
            this.makeArrows(el, arrowData);

            // Draw the paths with arrow heads
            if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                this.updateLineWithEndings(el, arrowData);
            } else if (el.elementClass === Const.OBJECT_CLASS_CURVE) {
                this.updatePath(el);
            }

            this.setArrowSize(el, arrowData);
        },

        /**
         * This method determines some data about the line endings of this element.
         * If there are arrow heads, the offset is determined so that no parts of the line stroke
         * lap over the arrow head.
         * <p>
         * The returned object also contains the types of the arrow heads.
         *
         * @param {JXG.GeometryElement} el JSXGraph line or curve element
         * @param {Number} strokewidth strokewidth of the element
         * @param {String} hl Ither 'highlight' or empty string
         * @returns {Object} object containing the data
         *
         * @private
         */
        getArrowHeadData: function (el, strokewidth, hl) {
            var minlen = Mat.eps,
                typeFirst,
                typeLast,
                offFirst = 0,
                offLast = 0,
                sizeFirst = 0,
                sizeLast = 0,
                ev_fa = el.evalVisProp('firstarrow'),
                ev_la = el.evalVisProp('lastarrow'),
                off,
                size;

            /*
               Handle arrow heads.

               The default arrow head is an isosceles triangle with base length 10 units and height 10 units.
               These 10 units are scaled to strokeWidth * arrowSize pixels.
            */
            if (ev_fa || ev_la) {
                if (Type.exists(ev_fa.type)) {
                    typeFirst = el.eval(ev_fa.type);
                } else {
                    if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                        typeFirst = 1;
                    } else {
                        typeFirst = 7;
                    }
                }
                if (Type.exists(ev_la.type)) {
                    typeLast = el.eval(ev_la.type);
                } else {
                    if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                        typeLast = 1;
                    } else {
                        typeLast = 7;
                    }
                }

                if (ev_fa) {
                    size = 6;
                    if (Type.exists(ev_fa.size)) {
                        size = el.eval(ev_fa.size);
                    }
                    if (hl !== "" && Type.exists(ev_fa[hl + "size"])) {
                        size = el.eval(ev_fa[hl + "size"]);
                    }

                    off = strokewidth * size;
                    if (typeFirst === 2) {
                        off *= 0.5;
                        minlen += strokewidth * size;
                    } else if (typeFirst === 3) {
                        off = (strokewidth * size) / 3;
                        minlen += strokewidth;
                    } else if (typeFirst === 4 || typeFirst === 5 || typeFirst === 6) {
                        off = (strokewidth * size) / 1.5;
                        minlen += strokewidth * size;
                    } else if (typeFirst === 7) {
                        off = 0;
                        size = 10;
                        minlen += strokewidth;
                    } else {
                        minlen += strokewidth * size;
                    }
                    offFirst += off;
                    sizeFirst = size;
                }

                if (ev_la) {
                    size = 6;
                    if (Type.exists(ev_la.size)) {
                        size = el.eval(ev_la.size);
                    }
                    if (hl !== "" && Type.exists(ev_la[hl + "size"])) {
                        size = el.eval(ev_la[hl + "size"]);
                    }
                    off = strokewidth * size;
                    if (typeLast === 2) {
                        off *= 0.5;
                        minlen += strokewidth * size;
                    } else if (typeLast === 3) {
                        off = (strokewidth * size) / 3;
                        minlen += strokewidth;
                    } else if (typeLast === 4 || typeLast === 5 || typeLast === 6) {
                        off = (strokewidth * size) / 1.5;
                        minlen += strokewidth * size;
                    } else if (typeLast === 7) {
                        off = 0;
                        size = 10;
                        minlen += strokewidth;
                    } else {
                        minlen += strokewidth * size;
                    }
                    offLast += off;
                    sizeLast = size;
                }
            }
            el.visPropCalc.typeFirst = typeFirst;
            el.visPropCalc.typeLast = typeLast;

            return {
                evFirst: ev_fa,
                evLast: ev_la,
                typeFirst: typeFirst,
                typeLast: typeLast,
                offFirst: offFirst,
                offLast: offLast,
                sizeFirst: sizeFirst,
                sizeLast: sizeLast,
                showFirst: 1, // Show arrow head. 0 if the distance is too small
                showLast: 1, // Show arrow head. 0 if the distance is too small
                minLen: minlen,
                strokeWidth: strokewidth
            };
        },

        /**
         * Corrects the line length if there are arrow heads, such that
         * the arrow ends exactly at the intended position.
         * Calls the renderer method to draw the line.
         *
         * @param {JXG.Line} el Reference to a line object, that has to be drawn
         * @param {Object} arrowData Data concerning possible arrow heads
         *
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         *
         * @private
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#updateLine
         * @see JXG.AbstractRenderer#getPositionArrowHead
         *
         */
        updateLineWithEndings: function (el, arrowData) {
            var c1,
                c2,
                // useTotalLength = true,
                margin = null;

            c1 = new Coords(Const.COORDS_BY_USER, el.point1.coords.usrCoords, el.board);
            c2 = new Coords(Const.COORDS_BY_USER, el.point2.coords.usrCoords, el.board);
            margin = el.evalVisProp('margin');
            Geometry.calcStraight(el, c1, c2, margin);

            this.handleTouchpoints(el, c1, c2, arrowData);
            this.getPositionArrowHead(el, c1, c2, arrowData);

            this.updateLinePrim(
                el.rendNode,
                c1.scrCoords[1],
                c1.scrCoords[2],
                c2.scrCoords[1],
                c2.scrCoords[2],
                el.board
            );

            return this;
        },

        /**
         *
         * Calls the renderer method to draw a curve.
         *
         * @param {JXG.GeometryElement} el Reference to a line object, that has to be drawn.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         *
         * @private
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#updateCurve
         *
         */
        updatePath: function (el) {
            if (el.evalVisProp('handdrawing')) {
                this.updatePathPrim(el.rendNode, this.updatePathStringBezierPrim(el), el.board);
            } else {
                this.updatePathPrim(el.rendNode, this.updatePathStringPrim(el), el.board);
            }

            return this;
        },

        /**
         * Shorten the length of a line element such that the arrow head touches
         * the start or end point and such that the arrow head ends exactly
         * at the start / end position of the line.
         * <p>
         * The Coords objects c1 and c2 are changed in place. In object a, the Boolean properties
         * 'showFirst' and 'showLast' are set.
         *
         * @param  {JXG.Line} el Reference to the line object that gets arrow heads.
         * @param  {JXG.Coords} c1  Coords of the first point of the line (after {@link JXG.Math.Geometry#calcStraight}).
         * @param  {JXG.Coords} c2  Coords of the second point of the line (after {@link JXG.Math.Geometry#calcStraight}).
         * @param  {Object}  a Object { evFirst: Boolean, evLast: Boolean} containing information about arrow heads.
         * @see JXG.AbstractRenderer#getArrowHeadData
         *
         */
        getPositionArrowHead: function (el, c1, c2, a) {
            var d, d1x, d1y, d2x, d2y;

            //    Handle arrow heads.

            //    The default arrow head (type==1) is an isosceles triangle with base length 10 units and height 10 units.
            //    These 10 units are scaled to strokeWidth * arrowSize pixels.
            if (a.evFirst || a.evLast) {
                // Correct the position of the arrow heads
                d1x = d1y = d2x = d2y = 0.0;
                d = c1.distance(Const.COORDS_BY_SCREEN, c2);

                if (a.evFirst && el.board.renderer.type !== 'vml') {
                    if (d >= a.minLen) {
                        d1x = ((c2.scrCoords[1] - c1.scrCoords[1]) * a.offFirst) / d;
                        d1y = ((c2.scrCoords[2] - c1.scrCoords[2]) * a.offFirst) / d;
                    } else {
                        a.showFirst = 0;
                    }
                }

                if (a.evLast && el.board.renderer.type !== 'vml') {
                    if (d >= a.minLen) {
                        d2x = ((c2.scrCoords[1] - c1.scrCoords[1]) * a.offLast) / d;
                        d2y = ((c2.scrCoords[2] - c1.scrCoords[2]) * a.offLast) / d;
                    } else {
                        a.showLast = 0;
                    }
                }
                c1.setCoordinates(
                    Const.COORDS_BY_SCREEN,
                    [c1.scrCoords[1] + d1x, c1.scrCoords[2] + d1y],
                    false,
                    true
                );
                c2.setCoordinates(
                    Const.COORDS_BY_SCREEN,
                    [c2.scrCoords[1] - d2x, c2.scrCoords[2] - d2y],
                    false,
                    true
                );
            }

            return this;
        },

        /**
         * Handle touchlastpoint / touchfirstpoint
         *
         * @param {JXG.GeometryElement} el
         * @param {JXG.Coords} c1 Coordinates of the start of the line. The coordinates are changed in place.
         * @param {JXG.Coords} c2 Coordinates of the end of the line. The coordinates are changed in place.
         * @param {Object} a
         * @see JXG.AbstractRenderer#getArrowHeadData
         */
        handleTouchpoints: function (el, c1, c2, a) {
            var s1, s2, d, d1x, d1y, d2x, d2y;

            if (a.evFirst || a.evLast) {
                d = d1x = d1y = d2x = d2y = 0.0;

                s1 = el.point1.evalVisProp('size') +
                    el.point1.evalVisProp('strokewidth');

                s2 = el.point2.evalVisProp('size') +
                    el.point2.evalVisProp('strokewidth');

                // Handle touchlastpoint /touchfirstpoint
                if (a.evFirst && el.evalVisProp('touchfirstpoint') &&
                        el.point1.evalVisProp('visible')) {
                    d = c1.distance(Const.COORDS_BY_SCREEN, c2);
                    //if (d > s) {
                    d1x = ((c2.scrCoords[1] - c1.scrCoords[1]) * s1) / d;
                    d1y = ((c2.scrCoords[2] - c1.scrCoords[2]) * s1) / d;
                    //}
                }
                if (a.evLast && el.evalVisProp('touchlastpoint') &&
                        el.point2.evalVisProp('visible')) {
                    d = c1.distance(Const.COORDS_BY_SCREEN, c2);
                    //if (d > s) {
                    d2x = ((c2.scrCoords[1] - c1.scrCoords[1]) * s2) / d;
                    d2y = ((c2.scrCoords[2] - c1.scrCoords[2]) * s2) / d;
                    //}
                }
                c1.setCoordinates(
                    Const.COORDS_BY_SCREEN,
                    [c1.scrCoords[1] + d1x, c1.scrCoords[2] + d1y],
                    false,
                    true
                );
                c2.setCoordinates(
                    Const.COORDS_BY_SCREEN,
                    [c2.scrCoords[1] - d2x, c2.scrCoords[2] - d2y],
                    false,
                    true
                );
            }

            return this;
        },

        /**
         * Set the arrow head size.
         *
         * @param {JXG.GeometryElement} el Reference to a line or curve object that has to be drawn.
         * @param {Object} arrowData Data concerning possible arrow heads
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         *
         * @private
         * @see Line
         * @see JXG.Line
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#updatePathWithArrowHeads
         * @see JXG.AbstractRenderer#getArrowHeadData
         */
        setArrowSize: function (el, a) {
            if (a.evFirst) {
                this._setArrowWidth(
                    el.rendNodeTriangleStart,
                    a.showFirst * a.strokeWidth,
                    el.rendNode,
                    a.sizeFirst
                );
            }
            if (a.evLast) {
                this._setArrowWidth(
                    el.rendNodeTriangleEnd,
                    a.showLast * a.strokeWidth,
                    el.rendNode,
                    a.sizeLast
                );
            }
            return this;
        },

        /**
         * Update the line endings (linecap) of a straight line from its attribute
         * 'linecap'.
         * Possible values for the attribute 'linecap' are: 'butt', 'round', 'square'.
         * The default value is 'butt'. Not available for VML renderer.
         *
         * @param {JXG.Line} element A arbitrary line.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#updateLine
         */
        setLineCap: function (el) { /* stub */ },

        /* ********* Ticks related stuff *********** */

        /**
         * Creates a rendering node for ticks added to a line.
         * @param {JXG.Line} el A arbitrary line.
         * @see Line
         * @see Ticks
         * @see JXG.Line
         * @see JXG.Ticks
         * @see JXG.AbstractRenderer#updateTicks
         */
        drawTicks: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("path", el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, 'path');
        },

        /**
         * Update {@link Ticks} on a {@link JXG.Line}. This method is only a stub and has to be implemented
         * in any descendant renderer class.
         * @param {JXG.Ticks} el Reference of a ticks object that has to be updated.
         * @see Line
         * @see Ticks
         * @see JXG.Line
         * @see JXG.Ticks
         * @see JXG.AbstractRenderer#drawTicks
         */
        updateTicks: function (el) { /* stub */ },

        /* ********* Circle related stuff *********** */

        /**
         * Draws a {@link JXG.Circle}
         * @param {JXG.Circle} el Reference to a {@link JXG.Circle} object that has to be drawn.
         * @see Circle
         * @see JXG.Circle
         * @see JXG.AbstractRenderer#updateEllipse
         */
        drawEllipse: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("ellipse", el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, 'ellipse');
            this.updateEllipse(el);
        },

        /**
         * Updates visual appearance of a given {@link JXG.Circle} on the {@link JXG.Board}.
         * @param {JXG.Circle} el Reference to a {@link JXG.Circle} object, that has to be updated.
         * @see Circle
         * @see JXG.Circle
         * @see JXG.AbstractRenderer#drawEllipse
         */
        updateEllipse: function (el) {
            this._updateVisual(el);

            var radius = el.Radius();

            if (
                /*radius > 0.0 &&*/
                Math.abs(el.center.coords.usrCoords[0]) > Mat.eps &&
                !isNaN(radius + el.center.coords.scrCoords[1] + el.center.coords.scrCoords[2]) &&
                radius * el.board.unitX < 2000000
            ) {
                this.updateEllipsePrim(
                    el.rendNode,
                    el.center.coords.scrCoords[1],
                    el.center.coords.scrCoords[2],
                    radius * el.board.unitX,
                    radius * el.board.unitY
                );
            }
            this.setLineCap(el);
        },

        /* ********* Polygon related stuff *********** */

        /**
         * Draws a {@link JXG.Polygon} on the {@link JXG.Board}.
         * @param {JXG.Polygon} el Reference to a Polygon object, that is to be drawn.
         * @see Polygon
         * @see JXG.Polygon
         * @see JXG.AbstractRenderer#updatePolygon
         */
        drawPolygon: function (el) {
            el.rendNode = this.appendChildPrim(
                this.createPrim("polygon", el.id),
                el.evalVisProp('layer')
            );
            this.appendNodesToElement(el, 'polygon');
            this.updatePolygon(el);
        },

        /**
         * Updates properties of a {@link JXG.Polygon}'s rendering node.
         * @param {JXG.Polygon} el Reference to a {@link JXG.Polygon} object, that has to be updated.
         * @see Polygon
         * @see JXG.Polygon
         * @see JXG.AbstractRenderer#drawPolygon
         */
        updatePolygon: function (el) {
            // Here originally strokecolor wasn't updated but strokewidth was.
            // But if there's no strokecolor i don't see why we should update strokewidth.
            this._updateVisual(el, { stroke: true, dash: true });
            this.updatePolygonPrim(el.rendNode, el);
        },

        /* ********* Text related stuff *********** */

        /**
         * Shows a small copyright notice in the top left corner of the board.
         * @param {String} str The copyright notice itself
         * @param {Number} fontsize Size of the font the copyright notice is written in
         * @see JXG.AbstractRenderer#displayLogo
         * @see Text#fontSize
         */
        displayCopyright: function (str, fontsize) { /* stub */ },

        /**
         * Shows a small JSXGraph logo in the top left corner of the board.
         * @param {String} str The data-URL of the logo
         * @param {Number} fontsize Size of the font the copyright notice is written in
         * @see JXG.AbstractRenderer#displayCopyright
         * @see Text#fontSize
         */
        displayLogo: function (str, fontsize) { /* stub */ },

        /**
         * An internal text is a {@link JXG.Text} element which is drawn using only
         * the given renderer but no HTML. This method is only a stub, the drawing
         * is done in the special renderers.
         * @param {JXG.Text} el Reference to a {@link JXG.Text} object
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        drawInternalText: function (el) { /* stub */ },

        /**
         * Updates visual properties of an already existing {@link JXG.Text} element.
         * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be updated.
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        updateInternalText: function (el) { /* stub */ },

        /**
         * Displays a {@link JXG.Text} on the {@link JXG.Board} by putting a HTML div over it.
         * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be displayed
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        drawText: function (el) {
            var node, z, level, ev_visible;

            if (
                el.evalVisProp('display') === "html" &&
                Env.isBrowser &&
                this.type !== "no"
            ) {
                node = this.container.ownerDocument.createElement('div');
                //node = this.container.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml', 'div'); //
                node.style.position = 'absolute';
                node.className = el.evalVisProp('cssclass');

                level = el.evalVisProp('layer');
                if (!Type.exists(level)) {
                    // trace nodes have level not set
                    level = 0;
                }

                if (this.container.style.zIndex === "") {
                    z = 0;
                } else {
                    z = parseInt(this.container.style.zIndex, 10);
                }

                node.style.zIndex = z + level;
                this.container.appendChild(node);

                node.setAttribute("id", this.container.id + "_" + el.id);
            } else {
                node = this.drawInternalText(el);
            }

            el.rendNode = node;
            el.htmlStr = "";

            // Set el.visPropCalc.visible
            if (el.visProp.islabel && Type.exists(el.visProp.anchor)) {
                ev_visible = el.visProp.anchor.evalVisProp('visible');
                el.prepareUpdate().updateVisibility(ev_visible);
            } else {
                el.prepareUpdate().updateVisibility();
            }
            this.updateText(el);
        },

        /**
         * Updates visual properties of an already existing {@link JXG.Text} element.
         * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be updated.
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        updateText: function (el) {
            var content = el.plaintext,
                v, c,
                parentNode, node,
                // scale, vshift,
                // id, wrap_id,
                ax, ay, angle, co, si,
                to_h, to_v;

            if (el.visPropCalc.visible) {
                this.updateTextStyle(el, false);

                if (el.evalVisProp('display') === "html" && this.type !== 'no') {
                    // Set the position
                    if (!isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {
                        // Horizontal
                        c = el.coords.scrCoords[1];
                        // webkit seems to fail for extremely large values for c.
                        c = Math.abs(c) < 1000000 ? c : 1000000;
                        ax = el.getAnchorX();

                        if (ax === 'right') {
                            // v = Math.floor(el.board.canvasWidth - c);
                            v = el.board.canvasWidth - c;
                            to_h = 'right';
                        } else if (ax === 'middle') {
                            // v = Math.floor(c - 0.5 * el.size[0]);
                            v = c - 0.5 * el.size[0];
                            to_h = 'center';
                        } else {
                            // 'left'
                            // v = Math.floor(c);
                            v = c;
                            to_h = 'left';
                        }

                        // This may be useful for foreignObj.
                        //if (window.devicePixelRatio !== undefined) {
                        //v *= window.devicePixelRatio;
                        //}

                        if (el.visPropOld.left !== ax + v) {
                            if (ax === 'right') {
                                el.rendNode.style.right = v + 'px';
                                el.rendNode.style.left = 'auto';
                            } else {
                                el.rendNode.style.left = v + 'px';
                                el.rendNode.style.right = 'auto';
                            }
                            el.visPropOld.left = ax + v;
                        }

                        // Vertical
                        c = el.coords.scrCoords[2] + this.vOffsetText;
                        c = Math.abs(c) < 1000000 ? c : 1000000;
                        ay = el.getAnchorY();

                        if (ay === 'bottom') {
                            // v = Math.floor(el.board.canvasHeight - c);
                            v = el.board.canvasHeight - c;
                            to_v = 'bottom';
                        } else if (ay === 'middle') {
                            // v = Math.floor(c - 0.5 * el.size[1]);
                            v = c - 0.5 * el.size[1];
                            to_v = 'center';
                        } else {
                            // top
                            // v = Math.floor(c);
                            v = c;
                            to_v = 'top';
                        }

                        // This may be useful for foreignObj.
                        //if (window.devicePixelRatio !== undefined) {
                        //v *= window.devicePixelRatio;
                        //}

                        if (el.visPropOld.top !== ay + v) {
                            if (ay === 'bottom') {
                                el.rendNode.style.top = 'auto';
                                el.rendNode.style.bottom = v + 'px';
                            } else {
                                el.rendNode.style.bottom = 'auto';
                                el.rendNode.style.top = v + 'px';
                            }
                            el.visPropOld.top = ay + v;
                        }
                    }

                    // Set the content
                    if (el.htmlStr !== content) {
                        try {
                            if (el.type === Type.OBJECT_TYPE_BUTTON) {
                                el.rendNodeButton.innerHTML = content;
                            } else if (
                                el.type === Type.OBJECT_TYPE_CHECKBOX ||
                                el.type === Type.OBJECT_TYPE_INPUT
                            ) {
                                el.rendNodeLabel.innerHTML = content;
                            } else {
                                el.rendNode.innerHTML = content;
                            }
                        } catch (e) {
                            // Setting innerHTML sometimes fails in IE8.
                            // A workaround is to take the node off the DOM, assign innerHTML,
                            // then append back.
                            // Works for text elements as they are absolutely positioned.
                            parentNode = el.rendNode.parentNode;
                            el.rendNode.parentNode.removeChild(el.rendNode);
                            el.rendNode.innerHTML = content;
                            parentNode.appendChild(el.rendNode);
                        }
                        el.htmlStr = content;

                        if (el.evalVisProp('usemathjax')) {
                            // Typesetting directly might not work because MathJax was not loaded completely
                            try {
                                if (MathJax.typeset) {
                                    // Version 3
                                    MathJax.typeset([el.rendNode]);
                                } else {
                                    // Version 2
                                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.rendNode]);
                                }

                                // Obsolete:
                                // // Restore the transformation necessary for fullscreen mode
                                // // MathJax removes it when handling dynamic content
                                // id = el.board.container;
                                // wrap_id = "fullscreenwrap_" + id;
                                // if (document.getElementById(wrap_id)) {
                                //     scale = el.board.containerObj._cssFullscreenStore.scale;
                                //     vshift = el.board.containerObj._cssFullscreenStore.vshift;
                                //     Env.scaleJSXGraphDiv(
                                //         "#" + wrap_id,
                                //         "#" + id,
                                //         scale,
                                //         vshift
                                //     );
                                // }
                            } catch (e) {
                                JXG.debug("MathJax (not yet) loaded");
                            }
                        } else if (el.evalVisProp('usekatex')) {
                            try {
                                // Checkboxes et. al. do not possess rendNodeLabel during the first update.
                                // In this case node will be undefined and not rendered by KaTeX.
                                if (el.rendNode.innerHTML.indexOf('<span') === 0 &&
                                    el.rendNode.innerHTML.indexOf('<label') > 0 &&
                                    (
                                        el.rendNode.innerHTML.indexOf('<checkbox') > 0 ||
                                        el.rendNode.innerHTML.indexOf('<input') > 0
                                    )
                                 ) {
                                    node = el.rendNodeLabel;
                                } else if (el.rendNode.innerHTML.indexOf('<button') === 0) {
                                    node = el.rendNodeButton;
                                } else {
                                    node = el.rendNode;
                                }

                                if (node) {
                                    /* eslint-disable no-undef */
                                    katex.render(content, node, {
                                        macros: el.evalVisProp('katexmacros'),
                                        throwOnError: false
                                    });
                                    /* eslint-enable no-undef */
                                }
                            } catch (e) {
                                JXG.debug("KaTeX not loaded (yet)");
                            }
                        } else if (el.evalVisProp('useasciimathml')) {
                            // This is not a constructor.
                            // See http://asciimath.org/ for more information
                            // about AsciiMathML and the project's source code.
                            try {
                                AMprocessNode(el.rendNode, false);
                            } catch (e) {
                                JXG.debug("AsciiMathML not loaded (yet)");
                            }
                        }
                    }

                    angle = el.evalVisProp('rotate');
                    if (angle !== 0) {
                        // Don't forget to convert to rad
                        angle *= (Math.PI / 180);
                        co = Math.cos(angle);
                        si = Math.sin(angle);

                        el.rendNode.style['transform'] = 'matrix(' +
                                [co, -1 * si, si, co, 0, 0].join(',') +
                            ')';
                        el.rendNode.style['transform-origin'] = to_h + ' ' + to_v;
                    }
                    this.transformRect(el, el.transformations);
                } else {
                    this.updateInternalText(el);
                }
            }
        },

        /**
         * Converts string containing CSS properties into
         * array with key-value pair objects.
         *
         * @example
         * "color:blue; background-color:yellow" is converted to
         * [{'color': 'blue'}, {'backgroundColor': 'yellow'}]
         *
         * @param  {String} cssString String containing CSS properties
         * @return {Array}           Array of CSS key-value pairs
         */
        _css2js: function (cssString) {
            var pairs = [],
                i,
                len,
                key,
                val,
                s,
                list = Type.trim(cssString).replace(/;$/, "").split(";");

            len = list.length;
            for (i = 0; i < len; ++i) {
                if (Type.trim(list[i]) !== "") {
                    s = list[i].split(":");
                    key = Type.trim(
                        s[0].replace(/-([a-z])/gi, function (match, char) {
                            return char.toUpperCase();
                        })
                    );
                    val = Type.trim(s[1]);
                    pairs.push({ key: key, val: val });
                }
            }
            return pairs;
        },

        /**
         * Updates font-size, color and opacity properties and CSS style properties of a {@link JXG.Text} node.
         * This function is also called by highlight() and nohighlight().
         * @param {JXG.Text} el Reference to the {@link JXG.Text} object, that has to be updated.
         * @param {Boolean} doHighlight
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateInternalTextStyle
         */
        updateTextStyle: function (el, doHighlight) {
            var fs,
                so, sc,
                css,
                node,
                display = Env.isBrowser ? el.visProp.display : "internal",
                nodeList = ["rendNode", "rendNodeTag", "rendNodeLabel"],
                lenN = nodeList.length,
                fontUnit = el.evalVisProp('fontunit'),
                cssList,
                prop,
                style,
                cssString,
                styleList = ["cssdefaultstyle", "cssstyle"],
                lenS = styleList.length;

            if (doHighlight) {
                sc = el.evalVisProp('highlightstrokecolor');
                so = el.evalVisProp('highlightstrokeopacity');
                css = el.evalVisProp('highlightcssclass');
            } else {
                sc = el.evalVisProp('strokecolor');
                so = el.evalVisProp('strokeopacity');
                css = el.evalVisProp('cssclass');
            }

            // This part is executed for all text elements except internal texts in canvas.
            // HTML-texts or internal texts in SVG or VML.
            //            HTML    internal
            //  SVG        +         +
            //  VML        +         +
            //  canvas     +         -
            //  no         -         -
            if (this.type !== "no" && (display === "html" || this.type !== 'canvas')) {
                for (style = 0; style < lenS; style++) {
                    // First set cssString to
                    // ev.cssdefaultstyle of ev.highlightcssdefaultstyle,
                    // then to
                    // ev.cssstyle of ev.highlightcssstyle
                    cssString = el.evalVisProp(
                        (doHighlight ? 'highlight' : '') + styleList[style]
                    );
                    // Set the CSS style properties - without deleting other properties
                    for (node = 0; node < lenN; node++) {
                        if (Type.exists(el[nodeList[node]])) {
                            if (cssString !== "" && el.visPropOld[styleList[style] + '_' + node] !== cssString) {
                                cssList = this._css2js(cssString);
                                for (prop in cssList) {
                                    if (cssList.hasOwnProperty(prop)) {
                                        el[nodeList[node]].style[cssList[prop].key] = cssList[prop].val;
                                    }
                                }
                                el.visPropOld[styleList[style] + '_' + node] = cssString;
                            }
                        }
                        // el.visPropOld[styleList[style]] = cssString;
                    }
                }

                fs = el.evalVisProp('fontsize');
                if (el.visPropOld.fontsize !== fs) {
                    el.needsSizeUpdate = true;
                    try {
                        for (node = 0; node < lenN; node++) {
                            if (Type.exists(el[nodeList[node]])) {
                                el[nodeList[node]].style.fontSize = fs + fontUnit;
                            }
                        }
                    } catch (e) {
                        // IE needs special treatment.
                        for (node = 0; node < lenN; node++) {
                            if (Type.exists(el[nodeList[node]])) {
                                el[nodeList[node]].style.fontSize = fs;
                            }
                        }
                    }
                    el.visPropOld.fontsize = fs;
                }
            }

            this.setTabindex(el);

            this.setObjectTransition(el);
            if (display === "html" && this.type !== 'no') {
                // Set new CSS class
                if (el.visPropOld.cssclass !== css) {
                    el.rendNode.className = css;
                    el.visPropOld.cssclass = css;
                    el.needsSizeUpdate = true;
                }
                this.setObjectStrokeColor(el, sc, so);
            } else {
                this.updateInternalTextStyle(el, sc, so);
            }

            if (el.evalVisProp('aria.enabled')) {
                this.setARIA(el);
            }

            return this;
        },

        /**
         * Set color and opacity of internal texts.
         * This method is used for Canvas and VML.
         * SVG needs its own version.
         * @private
         * @see JXG.AbstractRenderer#updateTextStyle
         * @see JXG.SVGRenderer#updateInternalTextStyle
         */
        updateInternalTextStyle: function (el, strokeColor, strokeOpacity) {
            this.setObjectStrokeColor(el, strokeColor, strokeOpacity);
        },

        /* ********* Image related stuff *********** */

        /**
         * Draws an {@link JXG.Image} on a board; This is just a template that has to be implemented by special
         * renderers.
         * @param {JXG.Image} el Reference to the image object that is to be drawn
         * @see Image
         * @see JXG.Image
         * @see JXG.AbstractRenderer#updateImage
         */
        drawImage: function (el) { /* stub */ },

        /**
         * Updates the properties of an {@link JXG.Image} element.
         * @param {JXG.Image} el Reference to an {@link JXG.Image} object, that has to be updated.
         * @see Image
         * @see JXG.Image
         * @see JXG.AbstractRenderer#drawImage
         */
        updateImage: function (el) {
            this.updateRectPrim(
                el.rendNode,
                el.coords.scrCoords[1],
                el.coords.scrCoords[2] - el.size[1],
                el.size[0],
                el.size[1]
            );

            this.updateImageURL(el);
            this.transformRect(el, el.transformations);
            this._updateVisual(el, { stroke: true, dash: true }, true);
        },

        /**
         * Multiplication of transformations without updating. That means, at that point it is expected that the
         * matrices contain numbers only. First, the origin in user coords is translated to <tt>(0,0)</tt> in screen
         * coords. Then, the stretch factors are divided out. After the transformations in user coords, the stretch
         * factors are multiplied in again, and the origin in user coords is translated back to its position. This
         * method does not have to be implemented in a new renderer.
         * @param {JXG.GeometryElement} el A JSXGraph element. We only need its board property.
         * @param {Array} transformations An array of JXG.Transformations.
         * @returns {Array} A matrix represented by a two dimensional array of numbers.
         * @see JXG.AbstractRenderer#transformRect
         */
        joinTransforms: function (el, transformations) {
            var i,
                ox = el.board.origin.scrCoords[1],
                oy = el.board.origin.scrCoords[2],
                ux = el.board.unitX,
                uy = el.board.unitY,

                len = transformations.length,
                // Translate to 0,0 in screen coords and then scale
                m = [
                    [1, 0, 0],
                    [-ox / ux, 1 / ux, 0],
                    [oy / uy, 0, -1 / uy]
                ];

            for (i = 0; i < len; i++) {
                m = Mat.matMatMult(transformations[i].matrix, m);
            }
            // Scale back and then translate back
            m = Mat.matMatMult(
                [
                    [1, 0, 0],
                    [ox, ux, 0],
                    [oy, 0, -uy]
                ],
                m
            );
            return m;
        },

        /**
         * Applies transformations on images and text elements. This method has to implemented in
         * all descendant classes where text and image transformations are to be supported.
         * <p>
         * Only affine transformation are supported, no proper projective transformations. This means, the
         * respective entries of the transformation matrix are simply ignored.
         *
         * @param {JXG.Image|JXG.Text} el A {@link JXG.Image} or {@link JXG.Text} object.
         * @param {Array} transformations An array of {@link JXG.Transformation} objects. This is usually the
         * transformations property of the given element <tt>el</tt>.
         */
        transformRect: function (el, transformations) { /* stub */ },

        /**
         * If the URL of the image is provided by a function the URL has to be updated during updateImage()
         * @param {JXG.Image} el Reference to an image object.
         * @see JXG.AbstractRenderer#updateImage
         */
        updateImageURL: function (el) { /* stub */ },

        /**
         * Updates CSS style properties of a {@link JXG.Image} node.
         * In SVGRenderer opacity is the only available style element.
         * This function is called by highlight() and nohighlight().
         * This function works for VML.
         * It does not work for Canvas.
         * SVGRenderer overwrites this method.
         * @param {JXG.Text} el Reference to the {@link JXG.Image} object, that has to be updated.
         * @param {Boolean} doHighlight
         * @see Image
         * @see JXG.Image
         * @see JXG.AbstractRenderer#highlight
         * @see JXG.AbstractRenderer#noHighlight
         */
        updateImageStyle: function (el, doHighlight) {
            el.rendNode.className = el.evalVisProp(
                doHighlight ? 'highlightcssclass' : 'cssclass'
            );
        },

        drawForeignObject: function (el) { /* stub */ },

        updateForeignObject: function (el) {
            /* stub */
        },

        /* ********* Render primitive objects *********** */

        /**
         * Appends a node to a specific layer level. This is just an abstract method and has to be implemented
         * in all renderers that want to use the <tt>createPrim</tt> model to draw.
         * @param {Node} node A DOM tree node.
         * @param {Number} level The layer the node is attached to. This is the index of the layer in
         * {@link JXG.SVGRenderer#layer} or the <tt>z-index</tt> style property of the node in VMLRenderer.
         */
        appendChildPrim: function (node, level) { /* stub */ },

        /**
         * Stores the rendering nodes. This is an abstract method which has to be implemented in all renderers that use
         * the <tt>createPrim</tt> method.
         * @param {JXG.GeometryElement} el A JSXGraph element.
         * @param {String} type The XML node name. Only used in VMLRenderer.
         */
        appendNodesToElement: function (el, type) { /* stub */ },

        /**
         * Creates a node of a given type with a given id.
         * @param {String} type The type of the node to create.
         * @param {String} id Set the id attribute to this.
         * @returns {Node} Reference to the created node.
         */
        createPrim: function (type, id) { /* stub */ return null; },

        /**
         * Removes an element node. Just a stub.
         * @param {Node} node The node to remove.
         */
        remove: function (node) { /* stub */ },

        /**
         * Can be used to create the nodes to display arrows. This is an abstract method which has to be implemented
         * in any descendant renderer.
         * @param {JXG.GeometryElement} el The element the arrows are to be attached to.
         * @param {Object} arrowData Data concerning possible arrow heads
         *
         */
        makeArrows: function (el, arrowData) { /* stub */ },

        /**
         * Updates width of an arrow DOM node. Used in
         * @param {Node} node The arrow node.
         * @param {Number} width
         * @param {Node} parentNode Used in IE only
         */
        _setArrowWidth: function (node, width, parentNode) { /* stub */ },

        /**
         * Updates an ellipse node primitive. This is an abstract method which has to be implemented in all renderers
         * that use the <tt>createPrim</tt> method.
         * @param {Node} node Reference to the node.
         * @param {Number} x Centre X coordinate
         * @param {Number} y Centre Y coordinate
         * @param {Number} rx The x-axis radius.
         * @param {Number} ry The y-axis radius.
         */
        updateEllipsePrim: function (node, x, y, rx, ry) { /* stub */ },

        /**
         * Refreshes a line node. This is an abstract method which has to be implemented in all renderers that use
         * the <tt>createPrim</tt> method.
         * @param {Node} node The node to be refreshed.
         * @param {Number} p1x The first point's x coordinate.
         * @param {Number} p1y The first point's y coordinate.
         * @param {Number} p2x The second point's x coordinate.
         * @param {Number} p2y The second point's y coordinate.
         * @param {JXG.Board} board
         */
        updateLinePrim: function (node, p1x, p1y, p2x, p2y, board) { /* stub */ },

        /**
         * Updates a path element. This is an abstract method which has to be implemented in all renderers that use
         * the <tt>createPrim</tt> method.
         * @param {Node} node The path node.
         * @param {String} pathString A string formatted like e.g. <em>'M 1,2 L 3,1 L5,5'</em>. The format of the string
         * depends on the rendering engine.
         * @param {JXG.Board} board Reference to the element's board.
         */
        updatePathPrim: function (node, pathString, board) { /* stub */ },

        /**
         * Builds a path data string to draw a point with a face other than <em>rect</em> and <em>circle</em>. Since
         * the format of such a string usually depends on the renderer this method
         * is only an abstract method. Therefore, it has to be implemented in the descendant renderer itself unless
         * the renderer does not use the createPrim interface but the draw* interfaces to paint.
         * @param {JXG.Point} el The point element
         * @param {Number} size A positive number describing the size. Usually the half of the width and height of
         * the drawn point.
         * @param {String} type A string describing the point's face. This method only accepts the shortcut version of
         * each possible face: <tt>x, +, |, -, [], <>, <<>>,^, v, >, < </tt>
         */
        updatePathStringPoint: function (el, size, type) { /* stub */ },

        /**
         * Builds a path data string from a {@link JXG.Curve} element. Since the path data strings heavily depend on the
         * underlying rendering technique this method is just a stub. Although such a path string is of no use for the
         * CanvasRenderer, this method is used there to draw a path directly.
         * @param {JXG.GeometryElement} el
         */
        updatePathStringPrim: function (el) { /* stub */ },

        /**
         * Builds a path data string from a {@link JXG.Curve} element such that the curve looks like hand drawn. Since
         * the path data strings heavily depend on the underlying rendering technique this method is just a stub.
         * Although such a path string is of no use for the CanvasRenderer, this method is used there to draw a path
         * directly.
         * @param  {JXG.GeometryElement} el
         */
        updatePathStringBezierPrim: function (el) { /* stub */ },

        /**
         * Update a polygon primitive.
         * @param {Node} node
         * @param {JXG.Polygon} el A JSXGraph element of type {@link JXG.Polygon}
         */
        updatePolygonPrim: function (node, el) { /* stub */ },

        /**
         * Update a rectangle primitive. This is used only for points with face of type 'rect'.
         * @param {Node} node The node yearning to be updated.
         * @param {Number} x x coordinate of the top left vertex.
         * @param {Number} y y coordinate of the top left vertex.
         * @param {Number} w Width of the rectangle.
         * @param {Number} h The rectangle's height.
         */
        updateRectPrim: function (node, x, y, w, h) { /* stub */ },

        /* ********* Set attributes *********** */

        /**
         * Shows or hides an element on the canvas; Only a stub, requires implementation in the derived renderer.
         * @param {JXG.GeometryElement} el Reference to the object that has to appear.
         * @param {Boolean} value true to show the element, false to hide the element.
         */
        display: function (el, value) {
            if (el) {
                el.visPropOld.visible = value;
            }
        },

        /**
         * Hides an element on the canvas; Only a stub, requires implementation in the derived renderer.
         *
         * Please use JXG.AbstractRenderer#display instead
         * @param {JXG.GeometryElement} el Reference to the geometry element that has to disappear.
         * @see JXG.AbstractRenderer#show
         * @deprecated
         */
        hide: function (el) { /* stub */ },

        /**
         * Highlights an object, i.e. changes the current colors of the object to its highlighting colors
         * and highlighting strokewidth.
         * @param {JXG.GeometryElement} el Reference of the object that will be highlighted.
         * @param {Boolean} [suppressHighlightStrokeWidth=undefined] If undefined or false, highlighting also changes strokeWidth. This might not be
         * the cases for polygon borders. Thus, if a polygon is highlighted, its polygon borders change strokeWidth only if the polygon attribute
         * highlightByStrokeWidth == true.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        highlight: function (el, suppressHighlightStrokeWidth) {
            var i, do_hl, sw;

            this.setObjectTransition(el);
            if (!el.visProp.draft) {
                if (el.type === Const.OBJECT_TYPE_POLYGON) {
                    this.setObjectFillColor(el, el.evalVisProp('highlightfillcolor'), el.evalVisProp('highlightfillopacity'));
                    do_hl = el.evalVisProp('highlightbystrokewidth');
                    for (i = 0; i < el.borders.length; i++) {
                        this.highlight(el.borders[i], !do_hl);
                    }
                } else {
                    if (el.elementClass === Const.OBJECT_CLASS_TEXT) {
                        this.updateTextStyle(el, true);
                    } else if (el.type === Const.OBJECT_TYPE_IMAGE) {
                        this.updateImageStyle(el, true);
                        this.setObjectFillColor(
                            el,
                            el.evalVisProp('highlightfillcolor'),
                            el.evalVisProp('highlightfillopacity')
                        );
                    } else {
                        this.setObjectStrokeColor(
                            el,
                            el.evalVisProp('highlightstrokecolor'),
                            el.evalVisProp('highlightstrokeopacity')
                        );
                        this.setObjectFillColor(
                            el,
                            el.evalVisProp('highlightfillcolor'),
                            el.evalVisProp('highlightfillopacity')
                        );
                    }
                }

                // Highlight strokeWidth is suppressed if
                // parameter suppressHighlightStrokeWidth is false or undefined.
                // suppressHighlightStrokeWidth is false if polygon attribute
                // highlightbystrokewidth is true.
                if (!suppressHighlightStrokeWidth && el.evalVisProp('highlightstrokewidth')) {
                    sw = Math.max(
                        el.evalVisProp('highlightstrokewidth'),
                        el.evalVisProp('strokewidth')
                    );
                    this.setObjectStrokeWidth(el, sw);
                    if (
                        el.elementClass === Const.OBJECT_CLASS_LINE ||
                        el.elementClass === Const.OBJECT_CLASS_CURVE
                    ) {
                        this.updatePathWithArrowHeads(el, true);
                    }
                }
            }
            this.setCssClass(el, el.evalVisProp('highlightcssclass'));

            return this;
        },

        /**
         * Uses the normal colors of an object, i.e. the opposite of {@link JXG.AbstractRenderer#highlight}.
         * @param {JXG.GeometryElement} el Reference of the object that will get its normal colors.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        noHighlight: function (el) {
            var i, sw;

            this.setObjectTransition(el);
            if (!el.evalVisProp('draft')) {
                if (el.type === Const.OBJECT_TYPE_POLYGON) {
                    this.setObjectFillColor(el, el.evalVisProp('fillcolor'), el.evalVisProp('fillopacity'));
                    for (i = 0; i < el.borders.length; i++) {
                        this.noHighlight(el.borders[i]);
                    }
                } else {
                    if (el.elementClass === Const.OBJECT_CLASS_TEXT) {
                        this.updateTextStyle(el, false);
                    } else if (el.type === Const.OBJECT_TYPE_IMAGE) {
                        this.updateImageStyle(el, false);
                        this.setObjectFillColor(el, el.evalVisProp('fillcolor'), el.evalVisProp('fillopacity'));
                    } else {
                        this.setObjectStrokeColor(el, el.evalVisProp('strokecolor'), el.evalVisProp('strokeopacity'));
                        this.setObjectFillColor(el, el.evalVisProp('fillcolor'), el.evalVisProp('fillopacity'));
                    }
                }

                sw = el.evalVisProp('strokewidth');
                this.setObjectStrokeWidth(el, sw);
                if (
                    el.elementClass === Const.OBJECT_CLASS_LINE ||
                    el.elementClass === Const.OBJECT_CLASS_CURVE
                ) {
                    this.updatePathWithArrowHeads(el, false);
                }
            }
            this.setCssClass(el, el.evalVisProp('cssclass'));

            return this;
        },

        /**
         * Puts an object from draft mode back into normal mode.
         * @param {JXG.GeometryElement} el Reference of the object that no longer is in draft mode.
         */
        removeDraft: function (el) {
            this.setObjectTransition(el);
            if (el.type === Const.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(el, el.evalVisProp('fillcolor'), el.evalVisProp('fillopacity'));
            } else {
                if (el.type === Const.OBJECT_CLASS_POINT) {
                    this.setObjectFillColor(el, el.evalVisProp('fillcolor'), el.evalVisProp('fillopacity'));
                }
                this.setObjectStrokeColor(el, el.evalVisProp('strokecolor'), el.evalVisProp('strokeopacity'));
                this.setObjectStrokeWidth(el, el.evalVisProp('strokewidth'));
            }
        },

        /**
         * Set ARIA related properties of an element. The attribute "aria" of an element contains at least the
         * properties "enabled", "label", and "live". Additionally, all available properties from
         * {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA} may be set.
         * <p>
         * In JSXGraph, the available properties are used without the leading 'aria-'.
         * For example, the value of the JSXGraph attribute 'aria.label' will be set to the
         * HTML attribute 'aria-label'.
         *
         * @param {JXG.GeometryElement} el Reference of the object that wants new
         *        ARIA attributes.
         */
        setARIA: function(el) { /* stub */ },

        /**
         * Sets the buffering as recommended by SVGWG. Until now only Opera supports this and will be ignored by other
         * browsers. Although this feature is only supported by SVG we have this method in {@link JXG.AbstractRenderer}
         * because it is called from outside the renderer.
         * @param {Node} node The SVG DOM Node which buffering type to update.
         * @param {String} type Either 'auto', 'dynamic', or 'static'. For an explanation see
         *   {@link https://www.w3.org/TR/SVGTiny12/painting.html#BufferedRenderingProperty}.
         */
        setBuffering: function (node, type) { /* stub */ },

        /**
         * Sets CSS classes for elements (relevant for SVG only).
         *
         * @param {JXG.GeometryElement} el Reference of the object that wants a
         *         new set of CSS classes.
         * @param {String} cssClass String containing a space separated list of CSS classes.
         */
        setCssClass: function (el, cssClass) { /* stub */ },

        /**
         * Sets an element's dash style.
         * @param {JXG.GeometryElement} el An JSXGraph element.
         */
        setDashStyle: function (el) { /* stub */ },

        /**
         * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards
         * compatibility.
         * @param {JXG.GeometryElement} el Reference of the object that is in draft mode.
         */
        setDraft: function (el) {
            if (!el.evalVisProp('draft')) {
                return;
            }
            var draftColor = el.board.options.elements.draft.color,
                draftOpacity = el.board.options.elements.draft.opacity;

                this.setObjectTransition(el);
            if (el.type === Const.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(el, draftColor, draftOpacity);
            } else {
                if (el.elementClass === Const.OBJECT_CLASS_POINT) {
                    this.setObjectFillColor(el, draftColor, draftOpacity);
                } else {
                    this.setObjectFillColor(el, "none", 0);
                }
                this.setObjectStrokeColor(el, draftColor, draftOpacity);
                this.setObjectStrokeWidth(el, el.board.options.elements.draft.strokeWidth);
            }
        },

        /**
         * Sets up nodes for rendering a gradient fill.
         * @param {JXG.GeometryElement}  el Reference of the object which gets the gradient
         */
        setGradient: function (el) { /* stub */ },

        /**
         * Move element into new layer. This is trivial for canvas, but needs more effort in SVG.
         * Does not work dynamically, i.e. if level is a function.
         *
         * @param {JXG.GeometryElement} el Element which is put into different layer
         * @param {Number} value Layer number
         * @private
         */
        setLayer: function (el, level) { /* stub */ },

        /**
         * Sets an objects fill color.
         * @param {JXG.GeometryElement} el Reference of the object that wants a new fill color.
         * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose
         * 'none'.
         * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
         */
        setObjectFillColor: function (el, color, opacity) { /* stub */ },

        /**
         * Changes an objects stroke color to the given color.
         * @param {JXG.GeometryElement} el Reference of the {@link JXG.GeometryElement} that gets a new stroke
         * color.
         * @param {String} color Color value in a HTML compatible format, e.g. <strong>#00ff00</strong> or
         * <strong>green</strong> for green.
         * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
         */
        setObjectStrokeColor: function (el, color, opacity) { /* stub */ },

        /**
         * Sets an element's stroke width.
         * @param {JXG.GeometryElement} el Reference to the geometry element.
         * @param {Number} width The new stroke width to be assigned to the element.
         */
        setObjectStrokeWidth: function (el, width) { /* stub */ },

        /**
         * Sets the transition duration (in milliseconds) for fill color and stroke
         * color and opacity.
         * @param {JXG.GeometryElement} el Reference of the object that wants a
         *         new transition duration.
         * @param {Number} duration (Optional) duration in milliseconds. If not given,
         *        element.visProp.transitionDuration is taken. This is the default.
         */
        setObjectTransition: function (el, duration) { /* stub */ },

        /**
         * Sets a node's attribute.
         * @param {Node} node The node that is to be updated.
         * @param {String} key Name of the attribute.
         * @param {String} val New value for the attribute.
         */
        setPropertyPrim: function (node, key, val) { /* stub */ },

        /**
         * Sets the shadow properties to a geometry element. This method is only a stub, it is implemented in the actual
         * renderers.
         * @param {JXG.GeometryElement} el Reference to a geometry object, that should get a shadow
         */
        setShadow: function (el) { /* stub */ },

        /**
         * Set the attribute `tabindex` to the attribute `tabindex` of an element.
         * This is only relevant for the SVG renderer.
         *
         * @param {JXG.GeometryElement} el
         */
        setTabindex: function (el) { /* stub */ },

        /**
         * Shows a hidden element on the canvas; Only a stub, requires implementation in the derived renderer.
         *
         * Please use JXG.AbstractRenderer#display instead
         * @param {JXG.GeometryElement} el Reference to the object that has to appear.
         * @see JXG.AbstractRenderer#hide
         * @deprecated
         */
        show: function (el) { /* stub */ },

        /**
         * Updates the gradient fill.
         * @param {JXG.GeometryElement} el An JSXGraph element with an area that can be filled.
         */
        updateGradient: function (el) { /* stub */ },

        /* ********* Renderer control *********** */

        /**
         * Stop redraw. This method is called before every update, so a non-vector-graphics based renderer can use this
         * method to delete the contents of the drawing panel. This is an abstract method every descendant renderer
         * should implement, if appropriate.
         * @see JXG.AbstractRenderer#unsuspendRedraw
         */
        suspendRedraw: function () { /* stub */ },

        /**
         * Restart redraw. This method is called after updating all the rendering node attributes.
         * @see JXG.AbstractRenderer#suspendRedraw
         */
        unsuspendRedraw: function () { /* stub */ },

        /**
         * The tiny zoom bar shown on the bottom of a board (if board attribute "showNavigation" is true).
         * It is a div element and gets the CSS class "JXG_navigation" and the id {board id}_navigationbar.
         * <p>
         * The buttons get the CSS class "JXG_navigation_button" and the id {board_id}_name where name is
         * one of [top, down, left, right, out, 100, in, fullscreen, screenshot, reload, cleartraces].
         * <p>
         * The symbols for zoom, navigation and reload are hard-coded.
         *
         * @param {JXG.Board} board Reference to a JSXGraph board.
         * @param {Object} attr Attributes of the navigation bar
         * @private
         */
        drawNavigationBar: function (board, attr) {
            var doc,
                node,
                cancelbubble = function (e) {
                    if (!e) {
                        e = window.event;
                    }

                    if (e.stopPropagation) {
                        // Non IE<=8
                        e.stopPropagation();
                    } else {
                        e.cancelBubble = true;
                    }
                },
                createButton = function (label, handler, board_id, type) {
                    var button;

                    board_id = board_id || "";

                    button = doc.createElement('span');
                    button.innerHTML = label; // button.appendChild(doc.createTextNode(label));

                    // Style settings are superseded by adding the CSS class below
                    button.style.paddingLeft = '7px';
                    button.style.paddingRight = '7px';

                    if (button.classList !== undefined) {
                        // classList not available in IE 9
                        button.classList.add("JXG_navigation_button");
                        button.classList.add("JXG_navigation_button_" + type);
                    }
                    // button.setAttribute('tabindex', 0);

                    button.setAttribute("id", board_id + '_navigation_' + type);
                    button.setAttribute("aria-hidden", 'true');   // navigation buttons should never appear in screen reader

                    node.appendChild(button);

                    Env.addEvent(
                        button,
                        "click",
                        function (e) {
                            Type.bind(handler, board)();
                            return false;
                        },
                        board
                    );
                    // prevent the click from bubbling down to the board
                    Env.addEvent(button, "pointerup", cancelbubble, board);
                    Env.addEvent(button, "pointerdown", cancelbubble, board);
                    Env.addEvent(button, "pointerleave", cancelbubble, board);
                    Env.addEvent(button, "mouseup", cancelbubble, board);
                    Env.addEvent(button, "mousedown", cancelbubble, board);
                    Env.addEvent(button, "touchend", cancelbubble, board);
                    Env.addEvent(button, "touchstart", cancelbubble, board);
                };

            if (Env.isBrowser && this.type !== 'no') {
                doc = board.containerObj.ownerDocument;
                node = doc.createElement('div');

                node.setAttribute("id", board.container + "_navigationbar");

                // Style settings are superseded by adding the CSS class below
                node.style.color = attr.strokecolor;
                node.style.backgroundColor = attr.fillcolor;
                node.style.padding = attr.padding;
                node.style.position = attr.position;
                node.style.fontSize = attr.fontsize;
                node.style.cursor = attr.cursor;
                node.style.zIndex = attr.zindex;
                board.containerObj.appendChild(node);
                node.style.right = attr.right;
                node.style.bottom = attr.bottom;

                if (node.classList !== undefined) {
                    // classList not available in IE 9
                    node.classList.add("JXG_navigation");
                }
                // For XHTML we need unicode instead of HTML entities

                if (board.attr.showfullscreen) {
                    createButton(
                        board.attr.fullscreen.symbol,
                        function () {
                            board.toFullscreen(board.attr.fullscreen.id);
                        },
                        board.container, "fullscreen"
                    );
                }

                if (board.attr.showscreenshot) {
                    createButton(
                        board.attr.screenshot.symbol,
                        function () {
                            window.setTimeout(function () {
                                board.renderer.screenshot(board, "", false);
                            }, 330);
                        },
                        board.container, "screenshot"
                    );
                }

                if (board.attr.showreload) {
                    // full reload circle: \u27F2
                    // the board.reload() method does not exist during the creation
                    // of this button. That's why this anonymous function wrapper is required.
                    createButton(
                        "\u21BB",
                        function () {
                            board.reload();
                        },
                        board.container, "reload"
                    );
                }

                if (board.attr.showcleartraces) {
                    // clear traces symbol (otimes): \u27F2
                    createButton("\u2297",
                        function () {
                            board.clearTraces();
                        },
                        board.container, "cleartraces"
                    );
                }

                if (board.attr.shownavigation) {
                    if (board.attr.showzoom) {
                        createButton("\u2013", board.zoomOut, board.container, 'out');
                        createButton("o", board.zoom100, board.container, '100');
                        createButton("+", board.zoomIn, board.container, 'in');
                    }
                    createButton("\u2190", board.clickLeftArrow, board.container, 'left');
                    createButton("\u2193", board.clickUpArrow, board.container, 'down'); // Down arrow
                    createButton("\u2191", board.clickDownArrow, board.container, 'up'); // Up arrow
                    createButton("\u2192", board.clickRightArrow, board.container, 'right');
                }
            }
        },

        /**
         * Wrapper for getElementById for maybe other renderers which elements are not directly accessible by DOM
         * methods like document.getElementById().
         * @param {String} id Unique identifier for element.
         * @returns {Object} Reference to a JavaScript object. In case of SVG/VMLRenderer it's a reference to a SVG/VML node.
         */
        getElementById: function (id) {
            var str;
            if (Type.exists(this.container)) {
                // Use querySelector over getElementById for compatibility with both 'regular' document
                // and ShadowDOM fragments.
                str = this.container.id + '_' + id;
                // Mask special symbols like '/' and '\' in id
                if (Type.exists(CSS) && Type.exists(CSS.escape)) {
                    str = CSS.escape(str);
                }
                return this.container.querySelector('#' + str);
            }
            return "";
        },

        /**
         * Remove an element and provide a function that inserts it into its original position. This method
         * is taken from this article {@link https://developers.google.com/speed/articles/javascript-dom}.
         * @author KeeKim Heng, Google Web Developer
         * @param {Element} el The element to be temporarily removed
         * @returns {Function} A function that inserts the element into its original position
         */
        removeToInsertLater: function (el) {
            var parentNode = el.parentNode,
                nextSibling = el.nextSibling;

            if (parentNode === null) {
                return;
            }
            parentNode.removeChild(el);

            return function () {
                if (nextSibling) {
                    parentNode.insertBefore(el, nextSibling);
                } else {
                    parentNode.appendChild(el);
                }
            };
        },

        /**
         * Resizes the rendering element
         * @param {Number} w New width
         * @param {Number} h New height
         */
        resize: function (w, h) { /* stub */ },

        /**
         * Create crosshair elements (Fadenkreuz) for presentations.
         * @param {Number} n Number of crosshairs.
         */
        createTouchpoints: function (n) { /* stub */ },

        /**
         * Show a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         */
        showTouchpoint: function (i) { /* stub */ },

        /**
         * Hide a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         */
        hideTouchpoint: function (i) { /* stub */ },

        /**
         * Move a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         * @param {Array} pos New positon in screen coordinates
         */
        updateTouchpoint: function (i, pos) { /* stub */ },

        /* ********* Dump related stuff *********** */

        /**
         * Convert SVG construction to base64 encoded SVG data URL.
         * Only available on SVGRenderer.
         *
         * @see JXG.SVGRenderer#dumpToDataURI
         */
        dumpToDataURI: function (_ignoreTexts) { /* stub */ },

        /**
         * Convert SVG construction to canvas.
         * Only available on SVGRenderer.
         *
         * @see JXG.SVGRenderer#dumpToCanvas
         */
        dumpToCanvas: function (canvasId, w, h, _ignoreTexts) { /* stub */ },

        /**
         * Display SVG image in html img-tag which enables
         * easy download for the user.
         *
         * See JXG.SVGRenderer#screenshot
         */
        screenshot: function (board) { /* stub */ }

    }
);

export default JXG.AbstractRenderer;
