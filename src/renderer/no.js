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
 renderer/abstract
*/

/**
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer.
 */

define(['jxg', 'renderer/abstract'], function (JXG, AbstractRenderer) {

    "use strict";

    /**
     * This renderer draws nothing. It is intended to be used in environments where none of our rendering engines
     * are available, e.g. WebWorkers.
     * @class JXG.AbstractRenderer
     */
    JXG.NoRenderer = function () {
        /**
         * If this property is set to <tt>true</tt> the visual properties of the elements are updated
         * on every update. Visual properties means: All the stuff stored in the
         * {@link JXG.GeometryElement#visProp} property won't be set if enhancedRendering is <tt>false</tt>
         * @type Boolean
         * @default true
         */
        this.enhancedRendering = false;

        /**
         * This is used to easily determine which renderer we are using
         * @example if (board.renderer.type === 'vml') {
         *     // do something
         * }
         * @type String
         */
        this.type = 'no';
    };

    JXG.extend(JXG.NoRenderer.prototype, /** @lends JXG.AbstractRenderer.prototype */ {
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
        drawPoint: function (element) {},

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Point}.
         * @param {JXG.Point} element Reference to a {@link JXG.Point} object, that has to be updated.
         * @see Point
         * @see JXG.Point
         * @see JXG.AbstractRenderer#drawPoint
         * @see JXG.AbstractRenderer#changePointStyle
         */
        updatePoint: function (element) { },

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
        changePointStyle: function (element) { },

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
        drawLine: function (element) { },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Line}.
         * @param {JXG.Line} element Reference to the {@link JXG.Line} object that has to be updated.
         * @see Line
         * @see JXG.Line
         * @see JXG.AbstractRenderer#drawLine
         */
        updateLine: function (element) { },

        /**
         * Creates a rendering node for ticks added to a line.
         * @param {JXG.Line} element A arbitrary line.
         * @see Line
         * @see Ticks
         * @see JXG.Line
         * @see JXG.Ticks
         * @see JXG.AbstractRenderer#updateTicks
         */
        drawTicks: function (element) { },

        /**
         * Update {@link Ticks} on a {@link JXG.Line}. This method is only a stub and has to be implemented
         * in any descendant renderer class.
         * @param {JXG.Line} element Reference of an line object, thats ticks have to be updated.
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
        drawCurve: function (element) { },

        /**
         * Updates visual appearance of the renderer element assigned to the given {@link JXG.Curve}.
         * @param {JXG.Curve} element Reference to a {@link JXG.Curve} object, that has to be updated.
         * @see Curve
         * @see JXG.Curve
         * @see JXG.AbstractRenderer#drawCurve
         */
        updateCurve: function (element) { },

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
        drawEllipse: function (element) { },

        /**
         * Updates visual appearance of a given {@link JXG.Circle} on the {@link JXG.Board}.
         * @param {JXG.Circle} element Reference to a {@link JXG.Circle} object, that has to be updated.
         * @see Circle
         * @see JXG.Circle
         * @see JXG.AbstractRenderer#drawEllipse
         */
        updateEllipse: function (element) { },


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
        drawPolygon: function (element) { },

        /**
         * Updates properties of a {@link JXG.Polygon}'s rendering node.
         * @param {JXG.Polygon} element Reference to a {@link JXG.Polygon} object, that has to be updated.
         * @see Polygon
         * @see JXG.Polygon
         * @see JXG.AbstractRenderer#drawPolygon
         */
        updatePolygon: function (element) { },

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
        drawText: function (element) { },

        /**
         * Updates visual properties of an already existing {@link JXG.Text} element.
         * @param {JXG.Text} element Reference to an {@link JXG.Text} object, that has to be updated.
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateInternalText
         * @see JXG.AbstractRenderer#updateTextStyle
         */
        updateText: function (element) { },

        /**
         * Updates CSS style properties of a {@link JXG.Text} node.
         * @param {JXG.Text} element Reference to the {@link JXG.Text} object, that has to be updated.
         * @param {Boolean} doHighlight
         * @see Text
         * @see JXG.Text
         * @see JXG.AbstractRenderer#drawText
         * @see JXG.AbstractRenderer#drawInternalText
         * @see JXG.AbstractRenderer#updateText
         * @see JXG.AbstractRenderer#updateInternalText
         */
        updateTextStyle: function (element, doHighlight) { },

        /**
         * Set color and opacity of internal texts.
         * SVG needs its own version.
         * @private
         * @see JXG.AbstractRenderer#updateTextStyle
         * @see JXG.AbstractRenderer#updateInternalTextStyle
         */
        updateInternalTextStyle: function (element, strokeColor, strokeOpacity) { /* stub */ },

        /* **************************
         *    Image related stuff
         * **************************/

        /**
         * Draws an {@link JXG.Image} on a board; This is just a template that has to be implemented by special renderers.
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
        updateImage: function (element) { },

        /**
         * Applies transformations on images and text elements. This method is just a stub and has to be implemented in all
         * descendant classes where text and image transformations are to be supported.
         * @param {JXG.Image|JXG.Text} element A {@link JXG.Image} or {@link JXG.Text} object.
         * @param {Array} transformations An array of {@link JXG.Transformation} objects. This is usually the transformations property
         * of the given element <tt>el</tt>.
         */
        transformImage: function (element, transformations) { /* stub */ },

        /**
         * If the URL of the image is provided by a function the URL has to be updated during updateImage()
         * @param {JXG.Image} element Reference to an image object.
         * @see JXG.AbstractRenderer#updateImage
         */
        updateImageURL: function (element) { /* stub */ },

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
         * Builds a path data string from a {@link JXG.Curve} element such that the curve looks like
         * hand drawn.
         * Since the path data strings heavily depend on the
         * underlying rendering technique this method is just a stub. Although such a path string is of no use for the
         * CanvasRenderer, this method is used there to draw a path directly.
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
         * Sets the buffering as recommended by SVGWG. Until now only Opera supports this and will be ignored by
         * other browsers. Although this feature is only supported by SVG we have this method in {@link JXG.AbstractRenderer}
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
         * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards compatibility.
         * @param {JXG.GeometryElement} element Reference of the object that is in draft mode.
         */
        setDraft: function (element) { },

        /**
         * Puts an object from draft mode back into normal mode.
         * @param {JXG.GeometryElement} element Reference of the object that no longer is in draft mode.
         */
        removeDraft: function (element) { },

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
         * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose 'none'.
         * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
         */
        setObjectFillColor: function (element, color, opacity) { /* stub */ },

        /**
         * Changes an objects stroke color to the given color.
         * @param {JXG.GeometryElement} element Reference of the {@link JXG.GeometryElement} that gets a new stroke color.
         * @param {String} color Color value in a HTML compatible format, e.g. <strong>#00ff00</strong> or <strong>green</strong> for green.
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
         * Sets the shadow properties to a geometry element. This method is only a stub, it is implemented in the actual renderers.
         * @param {JXG.GeometryElement} element Reference to a geometry object, that should get a shadow
         */
        setShadow: function (element) { /* stub */ },

        /**
         * Highlights an object, i.e. changes the current colors of the object to its highlighting colors
         * @param {JXG.GeometryElement} element Reference of the object that will be highlighted.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         */
        highlight: function (element) { },

        /**
         * Uses the normal colors of an object, i.e. the opposite of {@link JXG.AbstractRenderer#highlight}.
         * @param {JXG.GeometryElement} element Reference of the object that will get its normal colors.
         * @returns {JXG.AbstractRenderer} Reference to the renderer
         */
        noHighlight: function (element) { },


        /* **************************
         * renderer control
         * **************************/

        /**
         * Stop redraw. This method is called before every update, so a non-vector-graphics based renderer
         * can use this method to delete the contents of the drawing panel. This is an abstract method every
         * descendant renderer should implement, if appropriate.
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
        drawZoomBar: function (board) { },

        /**
         * Wrapper for getElementById for maybe other renderers which elements are not directly accessible by DOM methods like document.getElementById().
         * @param {String} id Unique identifier for element.
         * @returns {Object} Reference to a JavaScript object. In case of SVG/VMLRenderer it's a reference to a SVG/VML node.
         */
        getElementById: function (id) {
            return null;
        },

        /**
         * Resizes the rendering element
         * @param {Number} w New width
         * @param {Number} h New height
         */
        resize: function (w, h) { /* stub */},

        removeToInsertLater: function () {
            return function () {};
        }

    });

    JXG.NoRenderer.prototype = new AbstractRenderer();

    return JXG.NoRenderer;
});
