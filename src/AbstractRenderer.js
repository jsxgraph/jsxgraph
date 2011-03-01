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
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer defined in this file.
 */

/**
 * This class defines the interface between the renderer objects and the logical parts of JSXGraph.
 * @class JXG.AbstractRenderer
 * @see JXG.SVGRenderer
 * @see JXG.VMLRenderer
 * @see JXG.CanvasRenderer
 */
JXG.AbstractRenderer = function () {

    // WHY THIS IS A CLASS INSTEAD OF A SINGLETON OBJECT:
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
    this.vOffsetText = 8;

    /**
     * If this property is set to <tt>true</tt> the visual properties of the elements are updated
     * on every update. Visual properties means: All the stuff stored in the
     * {@link JXG.GeometryElement#visProp} property won't be set if enhancedRendering is <tt>false</tt>
     * @type Boolean
     * @default true
     */
    this.enhancedRendering = true;

    /**
     * This is used to easily determine which renderer we are using
     * @example if (board.renderer.type === 'vml') {
     *     // do something
     * }
     * @type String
     */
    this.type = '';
};

JXG.extend(JXG.AbstractRenderer, /** @lends JXG.AbstractRenderer.prototype */ {

    /* ******************************** *
     *    private methods               *
     *    should not be called from     *
     *    outside AbstractRenderer      *
     * ******************************** */

    /**
     * Update visual properties, but only if JXG.AbstractRenderer#enhancedRendering is set to true.
     * @param {JXG.GeometryElement} el The element to update
     * @param {Object} [not={}] Select properties you don't want to be updated: {fill: true, dash: true} updates
     * everything except for fill and dash. Possible values are stroke, fill, dash, shadow.
     * @param {Boolean} [enhanced=false] If true JXG.AbstractRenderer#enhancedRendering is assumed to be true.
     */
    _updateVisual: function (el, not, enhanced) {
        if (enhanced || this.enhancedRendering) {
            not = not || {};

            if (!el.visProp.draft) {
                if (!not.stroke) {
                    this.setObjectStrokeWidth(el, el.visProp.strokeWidth);
                    this.setObjectStrokeColor(el, el.visProp.strokeColor, el.visProp.strokeOpacity);
                }

                if (!not.fill) {
                    this.setObjectFillColor(el, el.visProp.fillColor, el.visProp.fillOpacity);
                }

                if (!not.dash) {
                    this.setDashStyle(el, el.visProp);
                }

                if (!not.shadow) {
                    this.setShadow(el);
                }
            } else {
                this.setDraft(el);
            }
        }
    },


    /* ******************************** *
     *    Point drawing and updating    *
     * ******************************** */

    /**
     * Draws a point on the {@link JXG.Board}.
     * @param {JXG.Point} el Reference to a {@link JXG.Point} object that has to be drawn.
     * @see JXG.Point
     * @see JXG.AbstractRenderer#updatePoint
     * @see JXG.AbstractRenderer#changePointStyle
     */
    drawPoint: function (el) {
        var prim,
            face = JXG.Point.prototype.normalizeFace.call(this, el.visProp.face);

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

        this.appendChildPrim(this.createPrim(prim, el.id), el.layer);
        this.appendNodesToElement(el, prim);

        // adjust visual propertys
        this._updateVisual(el, {dash: true, shadow: true}, true);

        // By now we only created the xml nodes and set some styles, in updatePoint
        // the attributes are filled with data.
        this.updatePoint(el);
    },

    /**
     * Updates visual appearance of the renderer element assigned to the given {@link JXG.Point}.
     * @param {JXG.Point} el Reference to a {@link JXG.Point} object, that has to be updated.
     * @see JXG.Point
     * @see JXG.AbstractRenderer#drawPoint
     * @see JXG.AbstractRenderer#changePointStyle
     */
    updatePoint: function (el) {
        var size = el.visProp.size,
            face = JXG.Point.prototype.normalizeFace.call(this, el.visProp.face);

        if (!isNaN(el.coords.scrCoords[2] + el.coords.scrCoords[1])) {
            this._updateVisual(el, {dash: false, shadow: false});

            // Zoom does not work for traces.
            size *= ((!el.board || !el.board.options.point.zoom) ? 1.0 : Math.sqrt(el.board.zoomX * el.board.zoomY));

            if (face === 'o') { // circle
                this.updateEllipsePrim(el.rendNode, el.coords.scrCoords[1], el.coords.scrCoords[2], size + 1, size + 1);
            } else if (face === '[]') { // rectangle
                this.updateRectPrim(el.rendNode, el.coords.scrCoords[1] - size, el.coords.scrCoords[2] - size, size * 2, size * 2);
            } else { // x, +, <>, ^, v, <, >
                this.updatePathPrim(el.rendNode, this.updatePathStringPoint(el, size, face), el.board);
            }
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
        if (JXG.exists(node)) {
            this.remove(node);
        }

        // and make a new one
        this.drawPoint(el);
        JXG.clearVisPropOld(el);

        if (!el.visProp.visible) {
            this.hide(el);
        }

        if (el.visProp.draft) {
            this.setDraft(el);
        }
    },
    
    /* ******************************** *
     *           Lines                  *
     * ******************************** */

    /**
     * Draws a line on the {@link JXG.Board}.
     * @param {JXG.Line} el Reference to a line object, that has to be drawn.
     * @see Line
     * @see JXG.Line
     * @see JXG.AbstractRenderer#updateLine
     */
    drawLine: function (el) {
        this.appendChildPrim(this.createPrim('line', el.id), el.layer);
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
        var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
            screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board);

        JXG.Math.Geometry.calcStraight(el, screenCoords1, screenCoords2);
        this.updateLinePrim(el.rendNode, screenCoords1.scrCoords[1], screenCoords1.scrCoords[2],
                                         screenCoords2.scrCoords[1], screenCoords2.scrCoords[2], el.board);

        this.makeArrows(el);
        this._updateVisual(el, {fill: true});
    },

    drawTicks: function (axis) {
        var node = this.createPrim('path', axis.id);

        this.appendChildPrim(node, axis.layer);
        this.appendNodesToElement(axis, 'path');
    },

    /**
     * Update {@link Ticks} on a {@link JXG.Line}. This method is only a stub and is implemented only in the special renderers.
     * @param {JXG.Line} axis Reference of an line object, thats ticks have to be updated.
     * @param {Number} dxMaj Number of pixels a major tick counts in x direction.
     * @param {Number} dyMaj Number of pixels a major tick counts in y direction.
     * @param {Number} dxMin Number of pixels a minor tick counts in x direction.
     * @param {Number} dyMin Number of pixels a minor tick counts in y direction.
     * @see Line
     * @see Ticks
     * @see JXG.Line
     * @see JXG.Ticks
     */
    updateTicks: function (axis, dxMaj, dyMaj, dxMin, dyMin) { /* stub */ },

    /* **************************
     *    Curves
     * **************************/

    /**
     * Draws a {@link JXG.Curve} on the {@link JXG.Board}.
     * @param {JXG.Curve} el Reference to a graph object, that has to be plotted.
     * @see Curve
     * @see JXG.Curve
     * @see JXG.AbstractRenderer#updateCurve
     */
    drawCurve: function (el) {
        this.appendChildPrim(this.createPrim('path', el.id), el.layer);
        this.appendNodesToElement(el, 'path');
        this._updateVisual(el, {shadow: true}, true);
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
        this.updatePathPrim(el.rendNode, this.updatePathStringPrim(el), el.board);
        this.makeArrows(el);
    },

    /* **************************
     *    Circle related stuff
     * **************************/

    /**
     * Draws a {@link JXG.Circle}
     * @param {JXG.Circle} el Reference to a {@link JXG.Circle} object that has to be drawn.
     * @see Circle
     * @see JXG.Circle
     * @see JXG.AbstractRenderer#updateEllipse
     */
    drawEllipse: function (el) {
        this.appendChildPrim(this.createPrim('ellipse', el.id), el.layer);
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

        // Radius umrechnen:
        var radius = el.Radius();
        if (radius > 0.0 && !isNaN(radius + el.midpoint.coords.scrCoords[1] + el.midpoint.coords.scrCoords[2]) && radius * el.board.stretchX < 20000) {
            this.updateEllipsePrim(el.rendNode, el.midpoint.coords.scrCoords[1], el.midpoint.coords.scrCoords[2],
                    (radius * el.board.stretchX), (radius * el.board.stretchY));
        }
    },


    /* **************************
     *   Polygon related stuff
     * **************************/

    /**
     * Draws a {@link JXG.Polygon} on the {@link JXG.Board}.
     * @param {JXG.Polygon} el Reference to a Polygon object, that is to be drawn.
     * @see Polygon
     * @see JXG.Polygon
     * @see JXG.AbstractRenderer#updatePolygon
     */
    drawPolygon: function (el) {
        this.appendChildPrim(this.createPrim('polygon', el.id), el.layer);
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
        // here originally strokecolor wasn't updated but strokewidth was
        // but if there's no strokecolor i don't see why we should update strokewidth.
        this._updateVisual(el, {stroke: true, dash: true});
        this.updatePolygonPrim(el.rendNode, el);
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
        var node;

        if (el.display === 'html') {
            node = this.container.ownerDocument.createElement('div');
            node.style.position = 'absolute';
            node.style.color = el.visProp.strokeColor;
            node.className = 'JXGtext';
            node.style.zIndex = '10';
            this.container.appendChild(node);
            node.setAttribute('id', this.container.id + '_' + el.id);
        } else {
            node = this.drawInternalText(el);
        }
        node.style.fontSize = el.board.options.text.fontSize + 'px';
        el.rendNode = node;
        el.htmlStr = '';
        this.updateText(el);
    },

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
        // Update only objects that are visible.
        if (el.visProp.visible && !isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {
            this.updateTextStyle(el);

            if (el.display === 'html') {
                el.rendNode.style.left = (el.coords.scrCoords[1]) + 'px';
                el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText) + 'px';
                el.updateText();
                if (el.htmlStr !== el.plaintextStr) {
                    el.rendNode.innerHTML = el.plaintextStr;
                    if (el.board.options.text.useASCIIMathML) {
                        AMprocessNode(el.rendNode, false);
                    }
                    el.htmlStr = el.plaintextStr;
                    if (el.board.options.text.useMathJax) {
                        MathJax.Hub.Typeset(el.rendNode);
                    }
                }
                this.transformImage(el, el.transformations);
            } else {
                this.updateInternalText(el);
            }
        }
    },

    /**
     * Updates CSS style properties of a {@link JXG.Text} node.
     * @param {JXG.Text} el Reference to the {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see JXG.AbstractRenderer#drawText
     * @see JXG.AbstractRenderer#drawInternalText
     * @see JXG.AbstractRenderer#updateText
     * @see JXG.AbstractRenderer#updateInternalText
     */
    updateTextStyle: function (el) {
        var fs = JXG.evaluate(el.visProp.fontSize);

        if (fs) {
            fs = (fs > 0 ? fs : 0);
            el.rendNode.style.fontSize = fs;
        }
    },

    /* **************************
     *    Image related stuff
     * **************************/

    /**
     * Draws an {@link JXG.Image} on a board; This is just a template that has to be implemented by special renderers.
     * @param {JXG.Image} el Reference to the image object that is to be drawn
     * @see Image
     * @see JXG.Image
     * @see JXG.AbstractRenderer#updateImage
     */
    drawImage: function (el) { /* stub */ },

    /**
     * Multiplication of transformations without updating. That means, at that point it is expected that the matrices
     * contain numbers only. First, the origin in user coords is translated to <tt>(0,0)</tt> in screen coords.
     * Then, the stretch factors are divided out. After the transformations in user coords, the  strech factors
     * are multiplied in again, and the origin in user coords is translated back to its position.
     * This method does not have to be implemented in a new renderer.
     * @see JXG.AbstractRenderer#transformImage
     */
    joinTransforms: function (el, t) {
        var m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            mpre1 =  [[1, 0, 0], [-el.board.origin.scrCoords[1], 1, 0], [-el.board.origin.scrCoords[2], 0, 1]],
            mpre2 =  [[1, 0, 0], [0, 1 / el.board.stretchX, 0], [0, 0, -1 / el.board.stretchY]],
            mpost2 = [[1, 0, 0], [0, el.board.stretchX, 0], [0, 0, -el.board.stretchY]],
            mpost1 = [[1, 0, 0], [el.board.origin.scrCoords[1], 1, 0], [el.board.origin.scrCoords[2], 0, 1]],
            i, len = t.length;

        for (i = 0; i < len; i++) {
            m = JXG.Math.matMatMult(mpre1, m);
            m = JXG.Math.matMatMult(mpre2, m);
            m = JXG.Math.matMatMult(t[i].matrix, m);
            m = JXG.Math.matMatMult(mpost2, m);
            m = JXG.Math.matMatMult(mpost1, m);
        }
        return m;
    },

    /**
     * Applies transformations on images and text elements. This method is just a stub and has to be implemented in all
     * descendant classes where text and image transformations are to be supported.
     * @param {JXG.Image|JXG.Text} el A {@link JXG.Image} or {@link JXG.Text} object.
     * @param {Array} t An array of {@link JXG.Transformation} objects. This is usually the transformations property
     * of the given element <tt>el</tt>.
     */
    transformImage: function (el, t) { /* stub */ },

    /**
     * Updates the properties of an {@link JXG.Image} element.
     * @param {JXG.Image} el Reference to an {@link JXG.Image} object, that has to be updated.
     * @see JXG.Image
     * @see JXG.AbstractRenderer#drawImage
     */
    updateImage: function (el) {
        this.updateRectPrim(el.rendNode, el.coords.scrCoords[1], el.coords.scrCoords[2] - el.size[1],
                el.size[0], el.size[1]);

        this.updateImageURL(el);
        this.transformImage(el, el.transformations);
        this._updateVisual(el, {stroke: true, dash: true}, true);
    },

    /**
     * If the URL of the image is provided by a function the URL has to be updated during updateImage()
     * @param {JXG.Image} el Reference to an image object.
     * @see JXG.AbstractRenderer#updateImage
     */
    updateImageURL: function (el) { /* stub */ },

    /* **************************
     *    Grid stuff
     * **************************/

    /**
     * A grid are a set of vertical and horizontal lines to support the user with element placement. This method
     * draws such a grid on the given board. It uses options given in {@link JXG.Options#grid}. In a descendant
     * class this method can be overridden but it does not have to. If you choose to not override this method,
     * you have to override {@link JXG.AbstractRenderer#drawHorizontalGrid} and
     * {@link JXG.AbstractRenderer#drawVerticalGrid}.
     * @param {JXG.Board} board Board on which the grid is to be drawn.
     * @see JXG.AbstractRenderer#removeGrid
     * @see JXG.AbstractRenderer#drawHorizontalGrid
     * @see JXG.AbstractRenderer#drawVerticalGrid
     */
    drawGrid: function (board) {
        var gridX = board.options.grid.gridX,
            gridY = board.options.grid.gridY,
            topLeft = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board),
            bottomRight = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board),
            node2, el;

        //
        //      |         |         |
        //  ----+---------+---------+-----
        //      |        /|         |
        //      |    gridY|     <---+------   Grid Cell
        //      |        \|         |
        //  ----+---------+---------+-----
        //      |         |\ gridX /|
        //      |         |         |
        //
        // uc: usercoordinates
        //
        // currently one grid cell is 1/JXG.Options.grid.gridX uc wide and 1/JXG.Options.grid.gridY uc high.
        // this may work perfectly with GeonextReader (#readGeonext, initialization of gridX and gridY) but it
        // is absolutely not user friendly when it comes to use it as an API interface.
        // i changed this to use gridX and gridY as the actual width and height of the grid cell. for this i
        // had to refactor these methods:
        //
        //  DONE JXG.Board.calculateSnapSizes (init p1, p2)
        //  DONE JXG.GeonextReader.readGeonext (init gridX, gridY)
        //

        board.options.grid.hasGrid = true;

        topLeft.setCoordinates(JXG.COORDS_BY_USER, [Math.floor(topLeft.usrCoords[1] / gridX) * gridX, Math.ceil(topLeft.usrCoords[2] / gridY) * gridY]);
        bottomRight.setCoordinates(JXG.COORDS_BY_USER, [Math.ceil(bottomRight.usrCoords[1] / gridX) * gridX, Math.floor(bottomRight.usrCoords[2] / gridY) * gridY]);

        node2 = this.drawVerticalGrid(topLeft, bottomRight, gridX, board);
        this.appendChildPrim(node2, board.options.layer.grid);

        el = {};
        el.elementClass = JXG.OBJECT_CLASS_LINE;

        el.visProp = {};
        el.rendNode = node2;
        el.id = "gridx";
        JXG.clearVisPropOld(el);
        this.setObjectStrokeColor(el, board.options.grid.gridColor, board.options.grid.gridOpacity);

        this.setPropertyPrim(node2, 'stroke-width', '0.4px');
        if (board.options.grid.gridDash) {
            this.setGridDash("gridx");
        }

        node2 = this.drawHorizontalGrid(topLeft, bottomRight, gridY, board);

        el.visProp = {};
        el.rendNode = node2;
        el.id = "gridy";
        JXG.clearVisPropOld(el);

        this.appendChildPrim(node2, board.options.layer.grid); // Attention layer=1
        this.setObjectStrokeColor(el, board.options.grid.gridColor, board.options.grid.gridOpacity);

        this.setPropertyPrim(node2, 'stroke-width', '0.4px');

        if (board.options.grid.gridDash) {
            this.setGridDash("gridy");
        }
    },

    /**
     * Draws the horizontal lines of a grid. This method has to be implemented in a subclass if
     * {@link JXG.AbstractRenderer#drawGrid} is not overridden.
     * @param {JXG.Coords} topLeft Coordinates of the top left corner where the drawing starts.
     * @param {JXG.Coords} bottomRight Coordinates of the bottom right corner where the drawing ends.
     * @param {Number} gx The width of a grid cell in user coordinates. Usually equals JXG.Options.grid.gridX.
     * @param {JXG.Board} board Reference to the board that requests the grid.
     * @returns {Node} Reference to the drawn element.
     * @see JXG.AbstractRenderer#drawGrid
     * @see JXG.AbstractRenderer#drawVerticalGrid
     * @see JXG.AbstractRenderer#removeGrid
     */
    drawHorizontalGrid: function (topLeft, bottomRight, gx, board) {
        /* stub */
        return null;
    },

    /**
     * Draws the vertical lines of a grid. This method has to be implemented in a subclass if
     * {@link JXG.AbstractRenderer#drawGrid} is not overridden.
     * @param {JXG.Coords} topLeft Coordinates of the top left corner where the drawing starts.
     * @param {JXG.Coords} bottomRight Coordinates of the bottom right corner where the drawing ends.
     * @param {Number} gy The height of a grid cell in user coordinates. Usually equals JXG.Options.grid.gridY.
     * @param {JXG.Board} board Reference to the board that requests the grid.
     * @returns {Node} Reference to the drawn element.
     * @see JXG.AbstractRenderer#drawGrid
     * @see JXG.AbstractRenderer#drawHorizontalGrid
     * @see JXG.AbstractRenderer#removeGrid
     */
    drawVerticalGrid: function (topLeft, bottomRight, gy, board) {
        /* stub */
        return null;
    },

    /**
     * Remove the grid from the given board.
     * @param {JXG.Board} board Board from which the grid is removed.
     * @see #drawGrid
     */
    removeGrid: function (board) {
        this.remove(this.getElementById('gridx'));
        this.remove(this.getElementById('gridy'));

        board.options.grid.hasGrid = false;
    },


    /* **************************
     *  general element helpers
     * **************************/

    /**
     * Hides an element on the canvas; Only a stub, requires implementation in the derived renderer.
     * @param {JXG.GeometryElement} obj Reference to the geometry element that has to disappear.
     * @see #show
     */
    hide: function (obj) {
    },

    /**
     * Shows a hidden element on the canvas; Only a stub, requires implementation in the derived renderer.
     * @param {JXG.GeometryElement} obj Reference to the object that has to appear.
     * @see #hide
     */
    show: function (obj) {
    },

    /**
     * Sets an element's stroke width.
     * @param {JXG.GeometryElement} el Reference to the geometry element.
     * @param {Number} width The new stroke width to be assigned to the element.
     */
    setObjectStrokeWidth: function (el, width) { /* stub */ },

    /**
     * Changes an objects stroke color to the given color.
     * @param {JXG.GeometryElement} obj Reference of the {@link JXG.GeometryElement} that gets a new stroke color.
     * @param {String} color Color in a HTML/CSS compatible format, e.g. <strong>#00ff00</strong> or <strong>green</strong> for green.
     * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
     */
    setObjectStrokeColor: function (obj, color, opacity) { /* stub */ },

    /**
     * Sets an objects fill color.
     * @param {JXG.GeometryElement} obj Reference of the object that wants a new fill color.
     * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose 'none'.
     * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
     */
    setObjectFillColor: function (obj, color, opacity) { /* stub */ },

    /**
     * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards compatibility.
     * @param {JXG.GeometryElement} obj Reference of the object that is in draft mode.
     */
    setDraft: function (obj) {
        if (!obj.visProp.draft) {
            return;
        }
        var draftColor = obj.board.options.elements.draft.color,
            draftOpacity = obj.board.options.elements.draft.opacity;

        if (obj.type === JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, draftColor, draftOpacity);
        }
        else {
            if (obj.elementClass === JXG.OBJECT_CLASS_POINT) {
                this.setObjectFillColor(obj, draftColor, draftOpacity);
            }
            else {
                this.setObjectFillColor(obj, 'none', 0);
            }
            this.setObjectStrokeColor(obj, draftColor, draftOpacity);
            this.setObjectStrokeWidth(obj, obj.board.options.elements.draft.strokeWidth);
        }
    },

    /**
     * Puts an object from draft mode back into normal mode.
     * @param {JXG.GeometryElement} obj Reference of the object that no longer is in draft mode.
     */
    removeDraft: function (obj) {
        if (obj.type === JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, obj.visProp.fillColor, obj.visProp.fillOpacity);
        }
        else {
            if (obj.type === JXG.OBJECT_CLASS_POINT) {
                this.setObjectFillColor(obj, obj.visProp.fillColor, obj.visProp.fillOpacity);
            }
            this.setObjectStrokeColor(obj, obj.visProp.strokeColor, obj.visProp.strokeOpacity);
            this.setObjectStrokeWidth(obj, obj.visProp.strokeWidth);
        }
    },

    /**
     * Highlights an object, i.e. changes the current colors of the object to its highlighting colors
     * @param {JXG.GeometryElement} obj Reference of the object that will be highlighted.
     * @returns {JXG.AbstractRenderer} Reference to the renderer
     */
    highlight: function (obj) {
        var i;

        if (!obj.visProp.draft) {
            if (obj.type === JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(obj, obj.visProp.highlightStrokeColor, obj.visProp.highlightStrokeOpacity);
                this.setObjectFillColor(obj, obj.visProp.highlightStrokeColor, obj.visProp.highlightStrokeOpacity);
            }
            else if (obj.type === JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(obj, obj.visProp.highlightFillColor, obj.visProp.highlightFillOpacity);
                for (i = 0; i < obj.borders.length; i++) {
                    this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp.highlightStrokeColor, obj.visProp.highlightStrokeOpacity);
                }
            }
            else {
                this.setObjectStrokeColor(obj, obj.visProp.highlightStrokeColor, obj.visProp.highlightStrokeOpacity);
                this.setObjectFillColor(obj, obj.visProp.highlightFillColor, obj.visProp.highlightFillOpacity);
            }
            if (obj.visProp.highlightStrokeWidth) {
                this.setObjectStrokeWidth(obj, obj.visProp.highlightStrokeWidth);
            }
        }

        return this;
    },

    /**
     * Uses the "normal" colors of an object, i.e. the opposite of {@link #highlight}.
     * @param {JXG.GeometryElement} obj Reference of the object that will get its normal colors.
     * @returns {JXG.AbstractRenderer} Reference to the renderer
     */
    noHighlight: function (obj) {
        var i;

        if (!obj.visProp.draft) {
            if (obj.type === JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(obj, obj.visProp.strokeColor, obj.visProp.strokeOpacity);
                this.setObjectFillColor(obj, obj.visProp.strokeColor, obj.visProp.strokeOpacity);
            }
            else if (obj.type === JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(obj, obj.visProp.fillColor, obj.visProp.fillOpacity);
                for (i = 0; i < obj.borders.length; i++) {
                    this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp.strokeColor, obj.visProp.strokeOpacity);
                }
            }
            else {
                this.setObjectStrokeColor(obj, obj.visProp.strokeColor, obj.visProp.strokeOpacity);
                this.setObjectFillColor(obj, obj.visProp.fillColor, obj.visProp.fillOpacity);
            }
            this.setObjectStrokeWidth(obj, obj.visProp.strokeWidth);
        }

        return this;
    },

    /**
     * Removes an HTML-Element from Canvas. Just a stub.
     * @param {HTMLElement} node The HTMLElement to remove.
     */
    remove: function (node) {
    },

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
     * TODO docstring
     * @param node
     * @param pointString
     * @param board
     */
    updatePathPrim: function (node, pointString, board) {

    },

    /**
     * TODO docstring
     */
    appendChildPrim: function () {
        // This is just a stub. Implementation is done in the actual renderers.
    },

    /**
     * TODO docstring
     */
    appendNodesToElement: function () {
        // This is just a stub. Implementation is done in the actual renderers.
    },

    /* **************************
     * general renderer related methods
     * **************************/

    /**
     * Stop redraw. This method is called before every update, so a non-vector-graphics based renderer
     * can delete the contents of the drawing panel.
     * @see #unsuspendRedraw
     */
    suspendRedraw: function () {
    },

    /**
     * Restart redraw. This method is called after updating all the rendering node attributes.
     * @see #suspendRedraw
     */
    unsuspendRedraw: function () {
    },

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
        node.className = 'JXGtext';

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
     * Sets the shadow properties to a geometry element. This method is only a stub, it is implemented in the actual renderers.
     * @param {JXG.GeometryElement} element Reference to a geometry object, that should get a shadow
     */
    setShadow: function (element) {
        // This is just a stub. Usage and implementation may differ between the different renderers.
    },


    /**
     * @TODO Description of parameters
     * Updates a path element.
     */
    updatePathStringPoint: function (el, size, type) {
        // This is just a stub. Usage and implementation may differ between the different renderers.
    },

    /**
     * This is just a stub. Usage and implementation may differ between the different renderers.
     */
    setBuffering: function () {
        // This is just a stub. Usage and implementation may differ between the different renderers.
    }
});