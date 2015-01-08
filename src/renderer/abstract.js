/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true, window: true */

/*
    nomen:    Allow underscores to indicate private class members. Might be replaced by local variables.
    plusplus: Only allowed in for-loops
    newcap:   AsciiMathMl exposes non-constructor functions beginning with upper case letters
*/
/*jslint nomen: true, plusplus: true, newcap:true*/

/* depends:
 jxg
 options
 base/coords
 base/constants
 math/math
 math/geometry
 utils/type
 utils/env
*/

/**
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer defined in this file.
 */

define([
    'jxg', 'options', 'base/coords', 'base/constants', 'math/math', 'math/geometry', 'utils/type', 'utils/env'
], function (JXG, Options, Coords, Const, Mat, Geometry, Type, Env) {

    "use strict";

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
         * @type number
         * @default 8
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
        this.type = '';
    };

    JXG.extend(JXG.AbstractRenderer.prototype, /** @lends JXG.AbstractRenderer.prototype */ {

        /* ******************************** *
         *    private methods               *
         *    should not be called from     *
         *    outside AbstractRenderer      *
         * ******************************** */

        /**
         * Update visual properties, but only if {@link JXG.AbstractRenderer#enhancedRendering} or <tt>enhanced</tt> is set to true.
         * @param {JXG.GeometryElement} element The element to update
         * @param {Object} [not={}] Select properties you don't want to be updated: <tt>{fill: true, dash: true}</tt> updates
         * everything except for fill and dash. Possible values are <tt>stroke, fill, dash, shadow, gradient</tt>.
         * @param {Boolean} [enhanced=false] If true, {@link JXG.AbstractRenderer#enhancedRendering} is assumed to be true.
         * @private
         */
        _updateVisual: function (element, not, enhanced) {
            var rgbo;

            if (enhanced || this.enhancedRendering) {
                not = not || {};

                if (!element.visProp.draft) {
                    if (!not.stroke) {
                        this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
                        this.setObjectStrokeWidth(element, element.visProp.strokewidth);
                    }

                    if (!not.fill) {
                        this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
                    }

                    if (!not.dash) {
                        this.setDashStyle(element, element.visProp);
                    }

                    if (!not.shadow) {
                        this.setShadow(element);
                    }

                    if (!not.gradient) {
                        this.setShadow(element);
                    }
                } else {
                    this.setDraft(element);
                }
            }
        },


        /* ******************************** *
         *    Point drawing and updating    *
         * ******************************** */

        /**
         * Draws a point on the {@link JXG.Board}.
         * @param {JXG.Point} element Reference to a {@link JXG.Point} object that has to be drawn.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#updatePoint
         * @see JXG.AbstractRenderer#changePointStyle
         */
        drawPoint: function (element) {
            var prim,
                // sometimes element is not a real point and lacks the methods of a JXG.Point instance,
                // in these cases to not use element directly.
                face = Options.normalizePointFace(element.visProp.face);

            // determine how the point looks like
            if (face === 'o') {
                prim = 'ellipse';
            } else if (face === '[]') {
                prim = 'rect';
            } else {
                // cross/x, diamond/<>, triangleup/a/^, triangledown/v, triangleleft/<,
                // triangleright/>, plus/+,
                prim = 'path';
            }

            element.rendNode = this.appendChildPrim(this.createPrim(prim, element.id), element.visProp.layer);
            this.appendNodesToElement(element, prim);

            // adjust visual propertys
            this._updateVisual(element, {dash: true, shadow: true}, true);


            // By now we only created the xml nodes and set some styles, in updatePoint
            // the attributes are filled with data.
            this.updatePoint(element);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Point}.
         * @param {JXG.Point} element Reference to a {@link JXG.Point} object, that has to be updated.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#drawPoint
         * @see JXG.AbstractRenderer#changePointStyle
         */
        updatePoint: function (element) {
            var size = element.visProp.size,
                // sometimes element is not a real point and lacks the methods of a JXG.Point instance,
                // in these cases to not use element directly.
                face = Options.normalizePointFace(element.visProp.face);

            if (!isNaN(element.coords.scrCoords[2] + element.coords.scrCoords[1])) {
                this._updateVisual(element, {dash: false, shadow: false});
                size *= ((!element.board || !element.board.options.point.zoom) ? 1.0 : Math.sqrt(element.board.zoomX * element.board.zoomY));

                if (face === 'o') { // circle
                    this.updateEllipsePrim(element.rendNode, element.coords.scrCoords[1], element.coords.scrCoords[2], size + 1, size + 1);
                } else if (face === '[]') { // rectangle
                    this.updateRectPrim(element.rendNode, element.coords.scrCoords[1] - size, element.coords.scrCoords[2] - size, size * 2, size * 2);
                } else { // x, +, <>, ^, v, <, >
                    this.updatePathPrim(element.rendNode, this.updatePathStringPoint(element, size, face), element.board);
                }
                this.setShadow(element);
            }
        },

        /**
         * Changes the style of a {@link JXG.Point}. This is required because the point styles differ in what
         * elements have to be drawn, e.g. if the point is marked by a "x" or a "+" two lines are drawn, if
         * it's marked by spot a circle is drawn. This method removes the old renderer element(s) and creates
         * the new one(s).
         * @param {JXG.Point} element Reference to a {@link JXG.Point} object, that's style is changed.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#updatePoint
         * @see JXG.AbstractRenderer#drawPoint
         */
        changePointStyle: function (element) {
            var node = this.getElementById(element.id);

            // remove the existing point rendering node
            if (Type.exists(node)) {
                this.remove(node);
            }

            // and make a new one
            this.drawPoint(element);
            Type.clearVisPropOld(element);

            if (!element.visProp.visible) {
                this.hide(element);
            }

            if (element.visProp.draft) {
                this.setDraft(element);
            }
        },

        /* ******************************** *
         *           Lines                  *
         * ******************************** */

        /**
         * Draws a line on the {@link JXG.Board}.
         * @param {JXG.Line} element Reference to a line object, that has to be drawn.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#updateLine
         */
        drawLine: function (element) {
            element.rendNode = this.appendChildPrim(this.createPrim('line', element.id), element.visProp.layer);
            this.appendNodesToElement(element, 'lines');
            this.updateLine(element);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Line}.
         * @param {JXG.Line} element Reference to the {@link JXG.Line} object that has to be updated.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#drawLine
         */
        updateLine: function (element) {
            var s, s1, s2, d, d1x, d1y, d2x, d2y,
                c1 = new Coords(Const.COORDS_BY_USER, element.point1.coords.usrCoords, element.board),
                c2 = new Coords(Const.COORDS_BY_USER, element.point2.coords.usrCoords, element.board),
                minlen = 10,
                margin = null;

            if (element.visProp.firstarrow || element.visProp.lastarrow) {
                margin = -4;
            }
            Geometry.calcStraight(element, c1, c2, margin);

            d1x = d1y = d2x = d2y = 0.0;
            /*
               Handle arrow heads.

               The arrow head is an equilateral triangle with base length 10 and height 10.
               These 10 units are scaled to strokeWidth*3 pixels or minlen pixels.
            */
            if (element.visProp.lastarrow || element.visProp.firstarrow) {

                s1 = element.point1.visProp.size;
                s2 = element.point2.visProp.size;
                s = s1 + s2;
                if (element.visProp.lastarrow && element.visProp.touchlastpoint) {
                    d = c1.distance(Const.COORDS_BY_SCREEN, c2);
                    if (d > s) {
                        d2x = (c2.scrCoords[1] - c1.scrCoords[1]) * s2 / d;
                        d2y = (c2.scrCoords[2] - c1.scrCoords[2]) * s2 / d;
                        c2 = new Coords(Const.COORDS_BY_SCREEN, [c2.scrCoords[1] - d2x, c2.scrCoords[2] - d2y], element.board);
                    }
                }
                if (element.visProp.firstarrow && element.visProp.touchfirstpoint) {
                    d = c1.distance(Const.COORDS_BY_SCREEN, c2);
                    if (d > s) {
                        d1x = (c2.scrCoords[1] - c1.scrCoords[1]) * s1 / d;
                        d1y = (c2.scrCoords[2] - c1.scrCoords[2]) * s1 / d;
                        c1 = new Coords(Const.COORDS_BY_SCREEN, [c1.scrCoords[1] + d1x, c1.scrCoords[2] + d1y], element.board);
                    }
                }

                s = Math.max(parseInt(element.visProp.strokewidth, 10) * 3, minlen);
                d = c1.distance(Const.COORDS_BY_SCREEN, c2);
                if (element.visProp.lastarrow && element.board.renderer.type !== 'vml' && d >= minlen) {
                    d2x = (c2.scrCoords[1] - c1.scrCoords[1]) * s / d;
                    d2y = (c2.scrCoords[2] - c1.scrCoords[2]) * s / d;
                }
                if (element.visProp.firstarrow && element.board.renderer.type !== 'vml' && d >= minlen) {
                    d1x = (c2.scrCoords[1] - c1.scrCoords[1]) * s / d;
                    d1y = (c2.scrCoords[2] - c1.scrCoords[2]) * s / d;
                }
            }

            this.updateLinePrim(element.rendNode,
                c1.scrCoords[1] + d1x, c1.scrCoords[2] + d1y,
                c2.scrCoords[1] - d2x, c2.scrCoords[2] - d2y, element.board);

            this.makeArrows(element);
            this._updateVisual(element);
        },

        /**
         * Creates a rendering node for ticks added to a line.
         * @param {JXG.Line} element A arbitrary line.
         * @see Line
         * @see Ticks
         * @see JXG.Line
         * @see JXG.Ticks
         * @see JXG.AbstractRenderer#updateTicks
         */
        drawTicks: function (element) {
            element.rendNode = this.appendChildPrim(this.createPrim('path', element.id), element.visProp.layer);
            this.appendNodesToElement(element, 'path');
        },

        /**
         * Update {@link Ticks} on a {@link JXG.Line}. This method is only a stub and has to be implemented
         * in any descendant renderer class.
         * @param {JXG.Ticks} element Reference of a ticks object that has to be updated.
         * @see Line
         * @see Ticks
         * @see JXG.Line
         * @see JXG.Ticks
         * @see JXG.AbstractRenderer#drawTicks
         */
        updateTicks: function (element) { /* stub */ },

        /* **************************
         *    Curves
         * **************************/

        /**
         * Draws a {@link JXG.Curve} on the {@link JXG.Board}.
         * @param {JXG.Curve} element Reference to a graph object, that has to be plotted.
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#updateCurve
         */
        drawCurve: function (element) {
            element.rendNode = this.appendChildPrim(this.createPrim('path', element.id), element.visProp.layer);
            this.appendNodesToElement(element, 'path');
            this._updateVisual(element, {shadow: true}, true);
            this.updateCurve(element);
        },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Curve}.
         * @param {JXG.Curve} element Reference to a {@link JXG.Curve} object, that has to be updated.
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#drawCurve
         */
        updateCurve: function (element) {
            this._updateVisual(element);
            if (element.visProp.handdrawing) {
                this.updatePathPrim(element.rendNode, this.updatePathStringBezierPrim(element), element.board);
            } else {
                this.updatePathPrim(element.rendNode, this.updatePathStringPrim(element), element.board);
            }
            if (element.numberPoints > 1) {
                this.makeArrows(element);
            }
        },

        /* **************************
         *    Circle related stuff
         * **************************/

        /**
         * Draws a {@link JXG.Circle}
         * @param {JXG.Circle} element Reference to a {@link JXG.Circle} object that has to be drawn.
         * @see Circle
         * @see JXG.Circle
         * @see JXG.AbstractRenderer#updateEllipse
         */
        drawEllipse: function (element) {
            element.rendNode = this.appendChildPrim(this.createPrim('ellipse', element.id), element.visProp.layer);
            this.appendNodesToElement(element, 'ellipse');
            this.updateEllipse(element);
        },

        /**
         * Updates visual appearance of a given {@link JXG.Circle} on the {@link JXG.Board}.
         * @param {JXG.Circle} element Reference to a {@link JXG.Circle} object, that has to be updated.
         * @see Circle
         * @see JXG.Circle
         * @see JXG.AbstractRenderer#drawEllipse
         */
        updateEllipse: function (element) {
            this._updateVisual(element);

            var radius = element.Radius();

            if (radius > 0.0 &&
                    Math.abs(element.center.coords.usrCoords[0]) > Mat.eps &&
                    !isNaN(radius + element.center.coords.scrCoords[1] + element.center.coords.scrCoords[2]) &&
                    radius * element.board.unitX < 2000000) {
                this.updateEllipsePrim(element.rendNode, element.center.coords.scrCoords[1],
                    element.center.coords.scrCoords[2], (radius * element.board.unitX), (radius * element.board.unitY));
            }
        },


        /* **************************
         *   Polygon related stuff
         * **************************/

        /**
         * Draws a {@link JXG.Polygon} on the {@link JXG.Board}.
         * @param {JXG.Polygon} element Reference to a Polygon object, that is to be drawn.
         * @see Polygon
         * @see JXG.Polygon
         * @see JXG.AbstractRenderer#updatePolygon
         */
        drawPolygon: function (element) {
            element.rendNode = this.appendChildPrim(this.createPrim('polygon', element.id), element.visProp.layer);
            this.appendNodesToElement(element, 'polygon');
            this.updatePolygon(element);
        },

        /**
         * Updates properties of a {@link JXG.Polygon}'s rendering node.
         * @param {JXG.Polygon} element Reference to a {@link JXG.Polygon} object, that has to be updated.
         * @see Polygon
         * @see JXG.Polygon
         * @see JXG.AbstractRenderer#drawPolygon
         */
        updatePolygon: function (element) {
            var i, len, polIsReal;

            // here originally strokecolor wasn't updated but strokewidth was
            // but if there's no strokecolor i don't see why we should update strokewidth.
            this._updateVisual(element, {stroke: true, dash: true});
            this.updatePolygonPrim(element.rendNode, element);

            len = element.vertices.length;
            polIsReal = true;
            for (i = 0; i < len; ++i) {
                if (!element.vertices[i].isReal) {
                    polIsReal = false;
                    break;
                }
            }

            len = element.borders.length;
            for (i = 0; i < len; ++i) {
                if (polIsReal && element.borders[i].visProp.visible) {
                    this.show(element.borders[i]);
                } else {
                    this.hide(element.borders[i]);
                }
            }
        },

        /* **************************
         *    Text related stuff
         * **************************/

        /**
         * Shows a small copyright notice in the top left corner of the board.
         * @param {String} str The copyright notice itself
         * @param {Number} fontsize Size of the font the copyright notice is written in
         */
        displayCopyright: function (str, fontsize) { /* stub */ },

        /**
         * An internal text is a {@link JXG.Text} element which is drawn using only
         * the given renderer but no HTML. This method is only a stub, the drawing
         * is done in the special renderers.
         * @param {JXG.Text} element Reference to a {@link JXG.Text} object
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        drawInternalText: function (element) { /* stub */ },

        /**
         * Updates visual properties of an already existing {@link JXG.Text} element.
         * @param {JXG.Text} element Reference to an {@link JXG.Text} object, that has to be updated.
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        updateInternalText: function (element) { /* stub */ },

        /**
         * Displays a {@link JXG.Text} on the {@link JXG.Board} by putting a HTML div over it.
         * @param {JXG.Text} element Reference to an {@link JXG.Text} object, that has to be displayed
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        drawText: function (element) {
            var node, z;

            if (element.visProp.display === 'html' && Env.isBrowser) {
                node = this.container.ownerDocument.createElement('div');
                node.style.position = 'absolute';

                node.className = element.visProp.cssclass;
                if (this.container.style.zIndex === '') {
                    z = 0;
                } else {
                    z = parseInt(this.container.style.zIndex, 10);
                }

                node.style.zIndex = z + element.board.options.layer.text;
                this.container.appendChild(node);
                node.setAttribute('id', this.container.id + '_' + element.id);
            } else {
                node = this.drawInternalText(element);
            }

            element.rendNode = node;
            element.htmlStr = '';
            this.updateText(element);
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
            var content = el.plaintext, v, c;

            if (el.visProp.visible) {
                this.updateTextStyle(el, false);

                if (el.visProp.display === 'html') {
                    // Set the position
                    if (!isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {

                        // Horizontal
                        c = el.coords.scrCoords[1];
                        // webkit seems to fail for extremely large values for c.
                        c = Math.abs(c) < 1000000 ? c : 1000000;

                        if (el.visProp.anchorx === 'right') {
                            v = Math.floor(el.board.canvasWidth - c);
                        } else if (el.visProp.anchorx === 'middle') {
                            v = Math.floor(c - 0.5 * el.size[0]);
                        } else { // 'left'
                            v = Math.floor(c);
                        }

                        if (el.visPropOld.left !== (el.visProp.anchorx + v)) {
                            if (el.visProp.anchorx === 'right') {
                                el.rendNode.style.right = v + 'px';
                                el.rendNode.style.left = 'auto';
                            } else {
                                el.rendNode.style.left = v + 'px';
                                el.rendNode.style.right = 'auto';
                            }
                            el.visPropOld.left = el.visProp.anchorx + v;
                        }

                        // Vertical
                        c = el.coords.scrCoords[2] + this.vOffsetText;
                        c = Math.abs(c) < 1000000 ? c : 1000000;

                        if (el.visProp.anchory === 'bottom') {
                            v = Math.floor(el.board.canvasHeight - c);
                        } else if (el.visProp.anchory === 'middle') {
                            v = Math.floor(c - 0.5 * el.size[1]);
                        } else { // top
                            v = Math.floor(c);
                        }

                        if (el.visPropOld.top !== (el.visProp.anchory + v)) {
                            if (el.visProp.anchory === 'bottom') {
                                el.rendNode.style.top = 'auto';
                                el.rendNode.style.bottom = v + 'px';
                            } else {
                                el.rendNode.style.bottom = 'auto';
                                el.rendNode.style.top = v + 'px';
                            }
                            el.visPropOld.top = el.visProp.anchory + v;
                        }
                    }

                    // Set the content
                    if (el.htmlStr !== content) {
                        el.rendNode.innerHTML = content;
                        el.htmlStr = content;

                        if (el.visProp.usemathjax) {
                            // typesetting directly might not work because mathjax was not loaded completely
                            // see http://www.mathjax.org/docs/1.1/typeset.html
                            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el.rendNode]);
                        } else if (el.visProp.useasciimathml) {
                            // This is not a constructor.
                            // See http://www1.chapman.edu/~jipsen/mathml/asciimath.html for more information
                            // about AsciiMathML and the project's source code.
                            AMprocessNode(el.rendNode, false);
                        }
                    }
                    this.transformImage(el, el.transformations);
                } else {
                    this.updateInternalText(el);
                }
            }
        },

        /**
         * Updates font-size, color and opacity propertiey and CSS style properties of a {@link JXG.Text} node.
         * This function is also called by highlight() and nohighlight().
         * @param {JXG.Text} element Reference to the {@link JXG.Text} object, that has to be updated.
         * @param {Boolean} doHighlight
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateInternalTextStyle
         */
        updateTextStyle: function (element, doHighlight) {
            var fs, so, sc, css,
                ev = element.visProp,
                display = Env.isBrowser ? ev.display : 'internal';

            if (doHighlight) {
                sc = ev.highlightstrokecolor;
                so = ev.highlightstrokeopacity;
                css = ev.highlightcssclass;
            } else {
                sc = ev.strokecolor;
                so = ev.strokeopacity;
                css = ev.cssclass;
            }

            // This part is executed for all text elements except internal texts in canvas.
            if (display === 'html' || (this.type !== 'canvas' && this.type !== 'no')) {
                fs = Type.evaluate(element.visProp.fontsize);
                if (element.visPropOld.fontsize !== fs) {
                    element.needsSizeUpdate = true;
                    try {
                        element.rendNode.style.fontSize = fs + 'px';
                    } catch (e) {
                        // IE needs special treatment.
                        element.rendNode.style.fontSize = fs;
                    }
                    element.visPropOld.fontsize = fs;
                }

            }

            if (display === 'html') {
                if (element.visPropOld.cssclass !== css) {
                    element.rendNode.className = css;
                    element.visPropOld.cssclass = css;
                    element.needsSizeUpdate = true;
                }
                this.setObjectStrokeColor(element, sc, so);
            } else {
                this.updateInternalTextStyle(element, sc, so);
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
        updateInternalTextStyle: function (element, strokeColor, strokeOpacity) {
            this.setObjectStrokeColor(element, strokeColor, strokeOpacity);
        },

        /* **************************
         *    Image related stuff
         * **************************/

        /**
         * Draws an {@link JXG.Image} on a board; This is just a template that has to be implemented by special
         * renderers.
         * @param {JXG.Image} element Reference to the image object that is to be drawn
         * @see Image
         * @see JXG.Image
         * @see JXG.AbstractRenderer#updateImage
         */
        drawImage: function (element) { /* stub */ },

        /**
         * Updates the properties of an {@link JXG.Image} element.
         * @param {JXG.Image} element Reference to an {@link JXG.Image} object, that has to be updated.
         * @see Image
         * @see JXG.Image
         * @see JXG.AbstractRenderer#drawImage
         */
        updateImage: function (element) {
            this.updateRectPrim(element.rendNode, element.coords.scrCoords[1],
                element.coords.scrCoords[2] - element.size[1], element.size[0], element.size[1]);

            this.updateImageURL(element);
            this.transformImage(element, element.transformations);
            this._updateVisual(element, {stroke: true, dash: true}, true);
        },

        /**
         * Multiplication of transformations without updating. That means, at that point it is expected that the
         * matrices contain numbers only. First, the origin in user coords is translated to <tt>(0,0)</tt> in screen
         * coords. Then, the stretch factors are divided out. After the transformations in user coords, the stretch
         * factors are multiplied in again, and the origin in user coords is translated back to its position. This
         * method does not have to be implemented in a new renderer.
         * @param {JXG.GeometryElement} element A JSXGraph element. We only need its board property.
         * @param {Array} transformations An array of JXG.Transformations.
         * @returns {Array} A matrix represented by a two dimensional array of numbers.
         * @see JXG.AbstractRenderer#transformImage
         */
        joinTransforms: function (element, transformations) {
            var i,
                ox = element.board.origin.scrCoords[1],
                oy = element.board.origin.scrCoords[2],
                ux = element.board.unitX,
                uy = element.board.unitY,
                // Translate to 0,0 in screen coords
                /*
                m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                mpre1 =  [[1,   0, 0],
                    [-ox, 1, 0],
                    [-oy, 0, 1]],
                // Scale
                mpre2 =  [[1, 0,     0],
                    [0, 1 / ux,  0],
                    [0, 0, -1 / uy]],
                // Scale back
                mpost2 = [[1, 0,   0],
                    [0, ux,  0],
                    [0, 0, -uy]],
                // Translate back
                mpost1 = [[1,  0, 0],
                    [ox, 1, 0],
                    [oy, 0, 1]],
                */
                len = transformations.length,
                // Translate to 0,0 in screen coords and then scale
                m = [[1,        0,       0],
                     [-ox / ux, 1 / ux,  0],
                     [ oy / uy, 0, -1 / uy]];

            for (i = 0; i < len; i++) {
                //m = Mat.matMatMult(mpre1, m);
                //m = Mat.matMatMult(mpre2, m);
                m = Mat.matMatMult(transformations[i].matrix, m);
                //m = Mat.matMatMult(mpost2, m);
                //m = Mat.matMatMult(mpost1, m);
            }
            // Scale back and then translate back
            m = Mat.matMatMult([[1,   0, 0],
                                [ox, ux, 0],
                                [oy,  0, -uy]], m);
            return m;
        },

        /**
         * Applies transformations on images and text elements. This method is just a stub and has to be implemented in
         * all descendant classes where text and image transformations are to be supported.
         * @param {JXG.Image|JXG.Text} element A {@link JXG.Image} or {@link JXG.Text} object.
         * @param {Array} transformations An array of {@link JXG.Transformation} objects. This is usually the
         * transformations property of the given element <tt>el</tt>.
         */
        transformImage: function (element, transformations) { /* stub */ },

        /**
         * If the URL of the image is provided by a function the URL has to be updated during updateImage()
         * @param {JXG.Image} element Reference to an image object.
         * @see JXG.AbstractRenderer#updateImage
         */
        updateImageURL: function (element) { /* stub */ },

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
            el.rendNode.className = doHighlight ? el.visProp.highlightcssclass : el.visProp.cssclass;
        },


        /* **************************
         * Render primitive objects
         * **************************/

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
         * @param {JXG.GeometryElement} element A JSXGraph element.
         * @param {String} type The XML node name. Only used in VMLRenderer.
         */
        appendNodesToElement: function (element, type) { /* stub */ },

        /**
         * Creates a node of a given type with a given id.
         * @param {String} type The type of the node to create.
         * @param {String} id Set the id attribute to this.
         * @returns {Node} Reference to the created node.
         */
        createPrim: function (type, id) {
            /* stub */
            return null;
        },

        /**
         * Removes an element node. Just a stub.
         * @param {Node} node The node to remove.
         */
        remove: function (node) { /* stub */ },

        /**
         * Can be used to create the nodes to display arrows. This is an abstract method which has to be implemented
         * in any descendant renderer.
         * @param {JXG.GeometryElement} element The element the arrows are to be attached to.
         */
        makeArrows: function (element) { /* stub */ },

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
         * @param {JXG.Point} element The point element
         * @param {Number} size A positive number describing the size. Usually the half of the width and height of
         * the drawn point.
         * @param {String} type A string describing the point's face. This method only accepts the shortcut version of
         * each possible face: <tt>x, +, <>, ^, v, >, <
         */
        updatePathStringPoint: function (element, size, type) { /* stub */ },

        /**
         * Builds a path data string from a {@link JXG.Curve} element. Since the path data strings heavily depend on the
         * underlying rendering technique this method is just a stub. Although such a path string is of no use for the
         * CanvasRenderer, this method is used there to draw a path directly.
         * @param element
         */
        updatePathStringPrim: function (element) { /* stub */ },

        /**
         * Builds a path data string from a {@link JXG.Curve} element such that the curve looks like hand drawn. Since
         * the path data strings heavily depend on the underlying rendering technique this method is just a stub.
         * Although such a path string is of no use for the CanvasRenderer, this method is used there to draw a path
         * directly.
         * @param element
         */
        updatePathStringBezierPrim: function (element) { /* stub */ },


        /**
         * Update a polygon primitive.
         * @param {Node} node
         * @param {JXG.Polygon} element A JSXGraph element of type {@link JXG.Polygon}
         */
        updatePolygonPrim: function (node, element) { /* stub */ },

        /**
         * Update a rectangle primitive. This is used only for points with face of type 'rect'.
         * @param {Node} node The node yearning to be updated.
         * @param {Number} x x coordinate of the top left vertex.
         * @param {Number} y y coordinate of the top left vertex.
         * @param {Number} w Width of the rectangle.
         * @param {Number} h The rectangle's height.
         */
        updateRectPrim: function (node, x, y, w, h) { /* stub */ },

        /* **************************
         *  Set Attributes
         * **************************/

        /**
         * Sets a node's attribute.
         * @param {Node} node The node that is to be updated.
         * @param {String} key Name of the attribute.
         * @param {String} val New value for the attribute.
         */
        setPropertyPrim: function (node, key, val) { /* stub */ },

        /**
         * Shows a hidden element on the canvas; Only a stub, requires implementation in the derived renderer.
         * @param {JXG.GeometryElement} element Reference to the object that has to appear.
         * @see JXG.AbstractRenderer#hide
         */
        show: function (element) { /* stub */ },

        /**
         * Hides an element on the canvas; Only a stub, requires implementation in the derived renderer.
         * @param {JXG.GeometryElement} element Reference to the geometry element that has to disappear.
         * @see JXG.AbstractRenderer#show
         */
        hide: function (element) { /* stub */ },

        /**
         * Sets the buffering as recommended by SVGWG. Until now only Opera supports this and will be ignored by other
         * browsers. Although this feature is only supported by SVG we have this method in {@link JXG.AbstractRenderer}
         * because it is called from outside the renderer.
         * @param {Node} node The SVG DOM Node which buffering type to update.
         * @param {String} type Either 'auto', 'dynamic', or 'static'. For an explanation see
         *   {@link http://www.w3.org/TR/SVGTiny12/painting.html#BufferedRenderingProperty}.
         */
        setBuffering: function (node, type) { /* stub */ },

        /**
         * Sets an element's dash style.
         * @param {JXG.GeometryElement} element An JSXGraph element.
         */
        setDashStyle: function (element) { /* stub */ },

        /**
         * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards
         * compatibility.
         * @param {JXG.GeometryElement} element Reference of the object that is in draft mode.
         */
        setDraft: function (element) {
            if (!element.visProp.draft) {
                return;
            }
            var draftColor = element.board.options.elements.draft.color,
                draftOpacity = element.board.options.elements.draft.opacity;

            if (element.type === Const.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(element, draftColor, draftOpacity);
            } else {
                if (element.elementClass === Const.OBJECT_CLASS_POINT) {
                    this.setObjectFillColor(element, draftColor, draftOpacity);
                } else {
                    this.setObjectFillColor(element, 'none', 0);
                }
                this.setObjectStrokeColor(element, draftColor, draftOpacity);
                this.setObjectStrokeWidth(element, element.board.options.elements.draft.strokeWidth);
            }
        },

        /**
         * Puts an object from draft mode back into normal mode.
         * @param {JXG.GeometryElement} element Reference of the object that no longer is in draft mode.
         */
        removeDraft: function (element) {
            if (element.type === Const.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
            } else {
                if (element.type === Const.OBJECT_CLASS_POINT) {
                    this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
                }
                this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
                this.setObjectStrokeWidth(element, element.visProp.strokewidth);
            }
        },

        /**
         * Sets up nodes for rendering a gradient fill.
         * @param element
         */
        setGradient: function (element) { /* stub */ },

        /**
         * Updates the gradient fill.
         * @param {JXG.GeometryElement} element An JSXGraph element with an area that can be filled.
         */
        updateGradient: function (element) { /* stub */ },

        /**
         * Sets an objects fill color.
         * @param {JXG.GeometryElement} element Reference of the object that wants a new fill color.
         * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose
         * 'none'.
         * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
         */
        setObjectFillColor: function (element, color, opacity) { /* stub */ },

        /**
         * Changes an objects stroke color to the given color.
         * @param {JXG.GeometryElement} element Reference of the {@link JXG.GeometryElement} that gets a new stroke
         * color.
         * @param {String} color Color value in a HTML compatible format, e.g. <strong>#00ff00</strong> or
         * <strong>green</strong> for green.
         * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
         */
        setObjectStrokeColor: function (element, color, opacity) { /* stub */ },

        /**
         * Sets an element's stroke width.
         * @param {JXG.GeometryElement} element Reference to the geometry element.
         * @param {Number} width The new stroke width to be assigned to the element.
         */
        setObjectStrokeWidth: function (element, width) { /* stub */ },

        /**
         * Sets the shadow properties to a geometry element. This method is only a stub, it is implemented in the actual
         * renderers.
         * @param {JXG.GeometryElement} element Reference to a geometry object, that should get a shadow
         */
        setShadow: function (element) { /* stub */ },

        /**
         * Highlights an object, i.e. changes the current colors of the object to its highlighting colors
         * @param {JXG.GeometryElement} element Reference of the object that will be highlighted.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        highlight: function (element) {
            var i, ev = element.visProp;

            if (!ev.draft) {
                if (element.type === Const.OBJECT_TYPE_POLYGON) {
                    this.setObjectFillColor(element, ev.highlightfillcolor, ev.highlightfillopacity);
                    for (i = 0; i < element.borders.length; i++) {
                        this.setObjectStrokeColor(element.borders[i], element.borders[i].visProp.highlightstrokecolor,
                            element.borders[i].visProp.highlightstrokeopacity);
                    }
                } else {
                    if (element.elementClass === Const.OBJECT_CLASS_TEXT) {
                        this.updateTextStyle(element, true);
                    } else if (element.type === Const.OBJECT_TYPE_IMAGE) {
                        this.updateImageStyle(element, true);
                    } else {
                        this.setObjectStrokeColor(element, ev.highlightstrokecolor, ev.highlightstrokeopacity);
                        this.setObjectFillColor(element, ev.highlightfillcolor, ev.highlightfillopacity);
                    }
                }
                if (ev.highlightstrokewidth) {
                    this.setObjectStrokeWidth(element, Math.max(ev.highlightstrokewidth, ev.strokewidth));
                }
            }

            return this;
        },

        /**
         * Uses the normal colors of an object, i.e. the opposite of {@link JXG.AbstractRenderer#highlight}.
         * @param {JXG.GeometryElement} element Reference of the object that will get its normal colors.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        noHighlight: function (element) {
            var i, ev = element.visProp;

            if (!element.visProp.draft) {
                if (element.type === Const.OBJECT_TYPE_POLYGON) {
                    this.setObjectFillColor(element, ev.fillcolor, ev.fillopacity);
                    for (i = 0; i < element.borders.length; i++) {
                        this.setObjectStrokeColor(element.borders[i], element.borders[i].visProp.strokecolor,
                            element.borders[i].visProp.strokeopacity);
                    }
                } else {
                    if (element.elementClass === Const.OBJECT_CLASS_TEXT) {
                        this.updateTextStyle(element, false);
                    } else if (element.type === Const.OBJECT_TYPE_IMAGE) {
                        this.updateImageStyle(element, false);
                    } else {
                        this.setObjectStrokeColor(element, ev.strokecolor, ev.strokeopacity);
                        this.setObjectFillColor(element, ev.fillcolor, ev.fillopacity);
                    }
                }
                this.setObjectStrokeWidth(element, ev.strokewidth);
            }

            return this;
        },

        /* **************************
         * renderer control
         * **************************/

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
         * The tiny zoom bar shown on the bottom of a board (if showNavigation on board creation is true).
         * @param {JXG.Board} board Reference to a JSXGraph board.
         */
        drawZoomBar: function (board) {
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
                createButton = function (label, handler) {
                    var button;

                    button = doc.createElement('span');
                    node.appendChild(button);
                    button.appendChild(doc.createTextNode(label));
                    Env.addEvent(button, 'mouseover', function () {
                        this.style.backgroundColor = board.options.navbar.highlightFillColor;
                    }, button);
                    Env.addEvent(button, 'mouseover', function () {
                        this.style.backgroundColor = board.options.navbar.highlightFillColor;
                    }, button);
                    Env.addEvent(button, 'mouseout', function () {
                        this.style.backgroundColor = board.options.navbar.fillColor;
                    }, button);

                    Env.addEvent(button, 'click', handler, board);
                    // prevent the click from bubbling down to the board
                    Env.addEvent(button, 'mouseup', cancelbubble, board);
                    Env.addEvent(button, 'mousedown', cancelbubble, board);
                    Env.addEvent(button, 'touchend', cancelbubble, board);
                    Env.addEvent(button, 'touchstart', cancelbubble, board);
                };

            if (Env.isBrowser) {
                doc = board.containerObj.ownerDocument;
                node = doc.createElement('div');

                node.setAttribute('id', board.containerObj.id + '_navigationbar');

                node.style.color = board.options.navbar.strokeColor;
                node.style.backgroundColor = board.options.navbar.fillColor;
                node.style.padding = board.options.navbar.padding;
                node.style.position = board.options.navbar.position;
                node.style.fontSize = board.options.navbar.fontSize;
                node.style.cursor = board.options.navbar.cursor;
                node.style.zIndex = board.options.navbar.zIndex;
                board.containerObj.appendChild(node);
                node.style.right = board.options.navbar.right;
                node.style.bottom = board.options.navbar.bottom;

                // For XHTML we need unicode instead of HTML entities

                if (board.attr.showreload) {
                    // full reload circle: \u27F2
                    // the board.reload() method does not exist during the creation
                    // of this button. That's why this anonymous function wrapper is required.
                    createButton('\u00A0\u21BB\u00A0', function () {
                        board.reload();
                    });
                }

                if (board.attr.showcleartraces) {
                    // clear traces symbol (otimes): \u27F2
                    createButton('\u00A0\u2297\u00A0', function () {
                        board.clearTraces();
                    });
                }

                if (board.attr.shownavigation) {
                    createButton('\u00A0\u2013\u00A0', board.zoomOut);
                    createButton('\u00A0o\u00A0', board.zoom100);
                    createButton('\u00A0+\u00A0', board.zoomIn);
                    createButton('\u00A0\u2190\u00A0', board.clickLeftArrow);
                    createButton('\u00A0\u2193\u00A0', board.clickUpArrow);
                    createButton('\u00A0\u2191\u00A0', board.clickDownArrow);
                    createButton('\u00A0\u2192\u00A0', board.clickRightArrow);
                }
            }
        },

        /**
         * Wrapper for getElementById for maybe other renderers which elements are not directly accessible by DOM
         * methods like document.getElementById().
         * @param {String} id Unique identifier for element.
         * @returns {Object} Reference to a JavaScript object. In case of SVG/VMLRenderer it's a reference to a SVG/VML
         * node.
         */
        getElementById: function (id) {
            return this.container.ownerDocument.getElementById(this.container.id + '_' + id);
        },

        /**
         * Remove an element and provide a function that inserts it into its original position. This method
         * is taken from this article {@link https://developers.google.com/speed/articles/javascript-dom}.
         * @author KeeKim Heng, Google Web Developer
         * @param {Element} element The element to be temporarily removed
         * @returns {Function} A function that inserts the element into its original position
         */
        removeToInsertLater: function (element) {
            var parentNode = element.parentNode,
                nextSibling = element.nextSibling;

            parentNode.removeChild(element);

            return function () {
                if (nextSibling) {
                    parentNode.insertBefore(element, nextSibling);
                } else {
                    parentNode.appendChild(element);
                }
            };
        },

        /**
         * Resizes the rendering element
         * @param {Number} w New width
         * @param {Number} h New height
         */
        resize: function (w, h) { /* stub */},

        /**
         * Create crosshair elements (Fadenkreuz) for presentations.
         * @param {Number} n Number of crosshairs.
         */
        createTouchpoints: function (n) {},

        /**
         * Show a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         */
        showTouchpoint: function (i) {},

        /**
         * Hide a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         */
        hideTouchpoint: function (i) {},

        /**
         * Move a specific crosshair.
         * @param {Number} i Number of the crosshair to show
         * @param {Array} pos New positon in screen coordinates
         */
        updateTouchpoint: function (i, pos) {}
    });

    return JXG.AbstractRenderer;
});
