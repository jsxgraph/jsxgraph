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
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer defined in this file.
 */

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
    this.vOffsetText = 3;

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
        if (enhanced || this.enhancedRendering) {
            not = not || {};

            if (!element.visProp.draft) {
                if (!not.stroke) {
                    this.setObjectStrokeWidth(element, element.visProp.strokewidth);
                    this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
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
            face = JXG.Point.prototype.normalizeFace.call(this, element.visProp.face);

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

        this.appendChildPrim(this.createPrim(prim, element.id), element.visProp.layer);
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
            face = JXG.Point.prototype.normalizeFace.call(this, element.visProp.face);

        if (!isNaN(element.coords.scrCoords[2] + element.coords.scrCoords[1])) {
            this._updateVisual(element, {dash: false, shadow: false});

            // Zoom does not work for traces.
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
        if (JXG.exists(node)) {
            this.remove(node);
        }

        // and make a new one
        this.drawPoint(element);
        JXG.clearVisPropOld(element);

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
        this.appendChildPrim(this.createPrim('line', element.id), element.visProp.layer);
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
        var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, element.point1.coords.usrCoords, element.board),
            screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, element.point2.coords.usrCoords, element.board);

        JXG.Math.Geometry.calcStraight(element, screenCoords1, screenCoords2);
        this.updateLinePrim(element.rendNode, screenCoords1.scrCoords[1], screenCoords1.scrCoords[2],
                                         screenCoords2.scrCoords[1], screenCoords2.scrCoords[2], element.board);

        this.makeArrows(element);
        this._updateVisual(element, {fill: true});
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
        var node = this.createPrim('path', element.id);

        this.appendChildPrim(node, element.visProp.layer);
        this.appendNodesToElement(element, 'path');
    },

    /**
     * Update {@link Ticks} on a {@link JXG.Line}. This method is only a stub and has to be implemented
     * in any descendant renderer class.
     * @param {JXG.Line} element Reference of an line object, thats ticks have to be updated.
     * @param {Number} dxMaj Number of pixels a major tick counts in x direction.
     * @param {Number} dyMaj Number of pixels a major tick counts in y direction.
     * @param {Number} dxMin Number of pixels a minor tick counts in x direction.
     * @param {Number} dyMin Number of pixels a minor tick counts in y direction.
     * @see Line
     * @see Ticks
     * @see JXG.Line
     * @see JXG.Ticks
     * @see JXG.AbstractRenderer#drawTicks
     */
    updateTicks: function (element, dxMaj, dyMaj, dxMin, dyMin) { /* stub */ },

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
        this.appendChildPrim(this.createPrim('path', element.id), element.visProp.layer);
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
        this.updatePathPrim(element.rendNode, this.updatePathStringPrim(element), element.board);
        this.makeArrows(element);
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
        this.appendChildPrim(this.createPrim('ellipse', element.id), element.visProp.layer);
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

        // Radius umrechnen:
        var radius = element.Radius();
        if (radius > 0.0 && !isNaN(radius + element.midpoint.coords.scrCoords[1] + element.midpoint.coords.scrCoords[2]) && radius * element.board.unitX < 20000) {
            this.updateEllipsePrim(element.rendNode, element.midpoint.coords.scrCoords[1], element.midpoint.coords.scrCoords[2],
                    (radius * element.board.unitX), (radius * element.board.unitY));
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
        this.appendChildPrim(this.createPrim('polygon', element.id), element.visProp.layer);
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
        // here originally strokecolor wasn't updated but strokewidth was
        // but if there's no strokecolor i don't see why we should update strokewidth.
        this._updateVisual(element, {stroke: true, dash: true});
        this.updatePolygonPrim(element.rendNode, element);
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
        var node;

        if (element.visProp.display === 'html') {
            node = this.container.ownerDocument.createElement('div');
            node.style.position = 'absolute';
            node.className = 'JXGtext';
            node.style.zIndex = '10';
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
     * @param {JXG.Text} element Reference to an {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see JXG.AbstractRenderer#drawText
     * @see JXG.AbstractRenderer#drawInternalText
     * @see JXG.AbstractRenderer#updateInternalText
     * @see JXG.AbstractRenderer#updateTextStyle
     */
    updateText: function (element) {
        var content = element.plaintext;

        if (element.visProp.visible) {
            this.updateTextStyle(element);

            if (element.visProp.display === 'html') {
                if (!isNaN(element.coords.scrCoords[1] + element.coords.scrCoords[2])) {
                    element.rendNode.style.left = parseInt(element.coords.scrCoords[1]) + 'px';
                    element.rendNode.style.top = parseInt(element.coords.scrCoords[2] - parseInt(element.visProp.fontsize) + this.vOffsetText) + 'px';
                }

                if (element.htmlStr !== content) {
                    element.rendNode.innerHTML = content;
                    element.htmlStr = content;
                    
                    if (element.visProp.useasciimathml) {
                        AMprocessNode(element.rendNode, false);
                    }
                    if (element.visProp.usemathjax) {
                        MathJax.Hub.Typeset(element.rendNode);
                    }
                }
                this.transformImage(element, element.transformations);
            } else {
                this.updateInternalText(element);
            }
        }
    },

    /**
     * Updates CSS style properties of a {@link JXG.Text} node.
     * @param {JXG.Text} element Reference to the {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see JXG.AbstractRenderer#drawText
     * @see JXG.AbstractRenderer#drawInternalText
     * @see JXG.AbstractRenderer#updateText
     * @see JXG.AbstractRenderer#updateInternalText
     */
    updateTextStyle: function (element) {
        var fs = JXG.evaluate(element.visProp.fontsize);

            try {
                element.rendNode.style.fontSize = fs + 'px';
            } catch (e) {
                // IE needs special treatment.
                element.rendNode.style.fontSize = fs;
            }
        if (element.visProp.display === 'html') {
            element.rendNode.style.color = JXG.evaluate(element.visProp.strokecolor);
        } else {
            this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);        
        }
    },

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
    updateImage: function (element) {
        this.updateRectPrim(element.rendNode, element.coords.scrCoords[1], element.coords.scrCoords[2] - element.size[1],
                element.size[0], element.size[1]);

        this.updateImageURL(element);
        this.transformImage(element, element.transformations);
        this._updateVisual(element, {stroke: true, dash: true}, true);
    },

    /**
     * Multiplication of transformations without updating. That means, at that point it is expected that the matrices
     * contain numbers only. First, the origin in user coords is translated to <tt>(0,0)</tt> in screen coords.
     * Then, the stretch factors are divided out. After the transformations in user coords, the  stretch factors
     * are multiplied in again, and the origin in user coords is translated back to its position.
     * This method does not have to be implemented in a new renderer.
     * @param {JXG.GeometryElement} element A JSXGraph element. We only need its board property.
     * @param {Array} transformations An array of JXG.Transformations.
     * @returns {Array} A matrix represented by a two dimensional array of numbers.
     * @see JXG.AbstractRenderer#transformImage
     */
    joinTransforms: function (element, transformations) {
        var m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            ox = element.board.origin.scrCoords[1],
            oy = element.board.origin.scrCoords[2],
            ux = element.board.unitX,
            uy = element.board.unitY,
            mpre1 =  [[1,   0, 0],      // Translate to 0,0 in screen coords
                      [-ox, 1, 0], 
                      [-oy, 0, 1]],  
            mpre2 =  [[1, 0,     0],    // Scale
                      [0, 1/ux,  0], 
                      [0, 0, -1/uy]],
            mpost2 = [[1, 0,   0],      // Scale back
                      [0, ux,  0], 
                      [0, 0, -uy]],
            mpost1 = [[1,  0, 0],       // Translate back
                      [ox, 1, 0], 
                      [oy, 0, 1]],
            i, len = transformations.length;

        for (i = 0; i < len; i++) {
            m = JXG.Math.matMatMult(mpre1, m);
            m = JXG.Math.matMatMult(mpre2, m);
            m = JXG.Math.matMatMult(transformations[i].matrix, m);
            m = JXG.Math.matMatMult(mpost2, m);
            m = JXG.Math.matMatMult(mpost1, m);
        }
        return m;
    },

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
    makeArrows: function(element) { /* stub */ },

    /**
     * Updates an ellipse node primitive. This is an abstract method which has to be implemented in all renderers
     * that use the <tt>createPrim</tt> method.
     * @param {Node} node Reference to the node.
     * @param {Number} x Centre X coordinate
     * @param {Number} y Centre Y coordinate
     * @param {Number} rx The x-axis radius.
     * @param {Number} ry The y-axis radius.
     */
    updateEllipsePrim: function(node, x, y, rx, ry) { /* stub */ },

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
    updateLinePrim: function(node, p1x, p1y, p2x, p2y, board) { /* stub */ },

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
    updateRectPrim: function(node, x, y, w, h) { /* stub */ },

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
    setDraft: function (element) {
        if (!element.visProp.draft) {
            return;
        }
        var draftColor = element.board.options.elements.draft.color,
            draftOpacity = element.board.options.elements.draft.opacity;

        if (element.type === JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(element, draftColor, draftOpacity);
        }
        else {
            if (element.elementClass === JXG.OBJECT_CLASS_POINT) {
                this.setObjectFillColor(element, draftColor, draftOpacity);
            }
            else {
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
        if (element.type === JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
        }
        else {
            if (element.type === JXG.OBJECT_CLASS_POINT) {
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
    highlight: function (element) {
        var i;

        if (!element.visProp.draft) {
            if (element.type === JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(element, element.visProp.highlightstrokecolor, element.visProp.highlightstrokeopacity);
                this.setObjectFillColor(element, element.visProp.highlightstrokecolor, element.visProp.highlightstrokeopacity);
            } else if (element.type === JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(element, element.visProp.highlightfillcolor, element.visProp.highlightfillopacity);
                for (i = 0; i < element.borders.length; i++) {
                    this.setObjectStrokeColor(element.borders[i], element.borders[i].visProp.highlightstrokecolor, element.visProp.highlightstrokeopacity);
                }
            } else {
                this.setObjectStrokeColor(element, element.visProp.highlightstrokecolor, element.visProp.highlightstrokeopacity);
                this.setObjectFillColor(element, element.visProp.highlightfillcolor, element.visProp.highlightfillopacity);
            }
            if (element.visProp.highlightstrokewidth) {
                this.setObjectStrokeWidth(element, element.visProp.highlightstrokewidth);
            }
        }

        return this;
    },

    /**
     * Uses the normal colors of an object, i.e. the opposite of {@link JXG.AbstractRenderer#highlight}.
     * @param {JXG.GeometryElement} element Reference of the object that will get its normal colors.
     * @returns {JXG.AbstractRenderer} Reference to the renderer
     */
    noHighlight: function (element) {
        var i;

        if (!element.visProp.draft) {
            if (element.type === JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
                this.setObjectFillColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
            } else if (element.type === JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
                for (i = 0; i < element.borders.length; i++) {
                    this.setObjectStrokeColor(element.borders[i], element.borders[i].visProp.strokecolor, element.visProp.strokeopacity);
                }
            } else {
                this.setObjectStrokeColor(element, element.visProp.strokecolor, element.visProp.strokeopacity);
                this.setObjectFillColor(element, element.visProp.fillcolor, element.visProp.fillopacity);
            }
            this.setObjectStrokeWidth(element, element.visProp.strokewidth);
        }

        return this;
    },


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
    drawZoomBar: function (board) {
        var doc,
            node,
            createButton = function (label, handler) {
                var button;

                button = doc.createElement('span');
                node.appendChild(button);
                button.innerHTML = label;
                JXG.addEvent(button, 'click', handler, board);
            };

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

        createButton('&nbsp;&ndash;&nbsp', board.zoomOut);
        createButton('&nbsp;o&nbsp;', board.zoom100);
        createButton('&nbsp;+&nbsp;', board.zoomIn);
        createButton('&nbsp;&larr;&nbsp;', board.clickLeftArrow);
        createButton('&nbsp;&uarr;&nbsp;', board.clickUpArrow);
        createButton('&nbsp;&darr;&nbsp;', board.clickDownArrow);
        createButton('&nbsp;&rarr;&nbsp;', board.clickRightArrow);
    },

    /**
     * Wrapper for getElementById for maybe other renderers which elements are not directly accessible by DOM methods like document.getElementById().
     * @param {String} id Unique identifier for element.
     * @returns {Object} Reference to a JavaScript object. In case of SVG/VMLRenderer it's a reference to a SVG/VML node.
     */
    getElementById: function (id) {
        return document.getElementById(this.container.id + '_' + id);
    },

    /**
     * Resizes the rendering element
     * @param {Number} w New width
     * @param {Number} h New height
     */
    resize: function (w, h) { /* stub */}

});
