/* 
    Copyright 2008,2009
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

/** 
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer defined in this file.
 */

/**
 * This function returns the AbstractRenderer object which defines the interface between the renderer
 * objects and the logical parts of JSXGraph.
 * @returns {Object} An instance of the AbstractRenderer class.
 * @see JXG.SVGRenderer
 * @see JXG.VMLRenderer
 * @see JXG.CanvasRenderer
 */
JXG.AbstractRenderer = function() {

return {
	/**
	 * The vertical offset for {@link Text} elements. Every {@link Text} element will
	 * be placed this amount of pixels below the user given coordinates.
	 * @type number
	 * @default 8
	 */
    vOffsetText: 8,
    
    /**
     * If this property is set to <tt>true</tt> the visual properties of the elements are updated
     * on every update. Visual properties means: All the stuff stored in the
     * {@link JXG.GeometryElement#visProp} property won't be set if enhancedRendering is <tt>false</tt>
     * @type Boolean
     * @default true 
     */
    enhancedRendering: true,

    /**
     * Update visual properties, but only if JXG.AbstractRenderer#enhancedRendering is set to true.
     * @param {JXG.GeometryElement} el The element to update
     * @param {Object} not Select properties you don't want to be updated: {fill: true, dash: true} updates
     * everything except for fill and dash. Possible values are stroke, fill, dash, shadow.
     * @param {Boolean} enhanced If true JXG.AbstractRenderer#enhancedRendering is assumed to be true.
     */
    updateVisual: function(el, not, enhanced) {
        not = not || {};
        
        if (enhanced || this.enhancedRendering) {
            if (!el.visProp['draft']) {
                if(!not.stroke) {
                    this.setObjectStrokeWidth(el, el.visProp['strokeWidth']);
                    this.setObjectStrokeColor(el, el.visProp['strokeColor'], el.visProp['strokeOpacity']);
                }

                if(!not.fill)
                    this.setObjectFillColor(el, el.visProp['fillColor'], el.visProp['fillOpacity']);

                if(!not.dash)
                    this.setDashStyle(el, el.visProp);

                if(!not.shadow)
                    this.setShadow(el);
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
     * @see #updatePoint
     * @see #changePointStyle
     */
    drawPoint: function(el) {
        var prim,
            face = JXG.Point.prototype.normalizeFace.call(this, el.visProp['face']);//el.normalizeFace(el.visProp['face']);

        // determine how the point looks like
        if (face === 'o') {
            prim = 'circle';
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
        this.updateVisual(el, {dash: true, shadow: true}, true);

        // By now we only created the xml nodes and set some styles, in updatePoint
        // the attributes are filled with data.
        this.updatePoint(el);
    },

    // continue revision here

    /**
     * Updates visual appearance of the renderer element assigned to the given {@link JXG.Point}.
     * @param {JXG.Point} el Reference to a {@link JXG.Point} object, that has to be updated.
     * @see JXG.Point
     * @see #drawPoint
     * @see #changePointStyle
     */
    updatePoint: function(el) {
        var size = el.visProp['size'],
            face = JXG.Point.prototype.normalizeFace.call(this, el.visProp['face']);//el.normalizeFace(el.visProp['face']);

        if (isNaN(el.coords.scrCoords[2]) || isNaN(el.coords.scrCoords[1])) return;

        this.updateVisual(el, {dash: false, shadow: false});

        // Zoom does not work for traces.
        size *= ((!el.board || !el.board.options.point.zoom) ? 1.0 : Math.sqrt(el.board.zoomX * el.board.zoomY));

        if (face === 'o') { // circle
            this.updateCirclePrim(el.rendNode, el.coords.scrCoords[1], el.coords.scrCoords[2], size + 1);
        } else if (face === '[]') { // rectangle
            this.updateRectPrim(el.rendNode, el.coords.scrCoords[1] - size, el.coords.scrCoords[2] - size, size * 2, size * 2);
        } else { // x, +, <>, ^, v, <, >
            this.updatePathPrim(el.rendNode, this.updatePathStringPoint(el, size, face), el.board);
        }
        this.setShadow(el);
    },

    /**
     * Changes the style of a {@link JXG.Point}. This is required because the point styles differ in what
     * elements have to be drawn, e.g. if the point is marked by a "x" or a "+" two lines are drawn, if
     * it's marked by spot a circle is drawn. This method removes the old renderer element(s) and creates
     * the new one(s).
     * @param {JXG.Point} el Reference to a {@link JXG.Point} object, that's style is changed.
     * @see Point
     * @see JXG.Point
     * @see #updatePoint
     * @see #drawPoint
     */
    changePointStyle: function(el) {
        var node = this.getElementById(el.id);

        // remove the existing point rendering node
        if (JXG.exists(node)) {
            this.remove(node);
        }

        // and make a new one
        this.drawPoint(el);
        JXG.clearVisPropOld(el);

        if (!el.visProp['visible']) {
            this.hide(el);
        }
        
        if (el.visProp['draft']) {
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
     * @see #updateLine
     * @see #calcStraight
     */
    drawLine: function(el) {
        this.appendChildPrim(this.createPrim('line', el.id), el.layer);
        this.appendNodesToElement(el, 'lines');
        this.updateLine(el);
    },

    /**
     * Updates visual appearance of the renderer element assigned to the given {@link JXG.Line}.
     * @param {JXG.Line} el Reference to the {@link JXG.Line} object that has to be updated.
     * @see Line
     * @see JXG.Line
     * @see #drawLine
     * @see #calcStraight
     */
    updateLine: function(el) {
        var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
            screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
            ax, ay, bx, by, beta, x, y;

        // a line can be a segment, straight, or ray. so it's not always delimited by point1 and point2
        // calcstraight calculates the visual start point and end point of the line.
        this.calcStraight(el, screenCoords1, screenCoords2);
        this.updateLinePrim(el.rendNode, screenCoords1.scrCoords[1], screenCoords1.scrCoords[2],
                                         screenCoords2.scrCoords[1], screenCoords2.scrCoords[2], el.board);
        // if this line has arrows attached, update them, too.
        this.makeArrows(el);
        this.updateVisual(el, {fill: true});
    },

    /**
     * Calculates drawing start and end point for a line. A segment is only drawn from start to end point, a straight line
     * is drawn until it meets the boards boundaries.
     * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
     * @param {JXG.Coords} point1 Coordinates of the point where line drawing begins. This value is calculated and set by this method.
     * @param {JXG.Coords} point2 Coordinates of the point where line drawing ends. This value is calculated and set by this method.
     * @see Line
     * @see JXG.Line
     * @see #drawLine
     * @see #updateLine
     */
    calcStraight: function(el, point1, point2) {
        var takePoint1, takePoint2, intersect1, intersect2, straightFirst, straightLast,
            c, s, i, j, p1, p2;

        straightFirst = el.visProp['straightFirst'];
        straightLast = el.visProp['straightLast'];

        // If one of the point is an ideal point in homogeneous coordinates
        // drawing of line segments or rays are not possible.
        if (Math.abs(point1.scrCoords[0]) < JXG.Math.eps) {
            straightFirst = true;
        }
        if (Math.abs(point2.scrCoords[0]) < JXG.Math.eps) {
            straightLast = true;
        }

        if (!straightFirst && !straightLast) {  // Do nothing in case of line segments (inside or outside of the board)
            return;
        }

        // Compute the stdform of the line in screen coordinates.
        c = [];
        c[0] = el.stdform[0] -
                el.stdform[1] * el.board.origin.scrCoords[1] / el.board.stretchX +
                el.stdform[2] * el.board.origin.scrCoords[2] / el.board.stretchY;
        c[1] = el.stdform[1] / el.board.stretchX;
        c[2] = el.stdform[2] / (-el.board.stretchY);

        if (isNaN(c[0] + c[1] + c[2])) return; // p1=p2

        // Intersect the line with the four borders of the board.
        s = [];
        s[0] = JXG.Math.crossProduct(c, [0,0,1]);  // top
        s[1] = JXG.Math.crossProduct(c, [0,1,0]);  // left
        s[2] = JXG.Math.crossProduct(c, [-el.board.canvasHeight,0,1]);  // bottom
        s[3] = JXG.Math.crossProduct(c, [-el.board.canvasWidth,1,0]);   // right

        // Normalize the intersections
        for (i = 0; i < 4; i++) {
            if (Math.abs(s[i][0]) > JXG.Math.eps) {
                for (j = 2; j > 0; j--) {
                    s[i][j] /= s[i][0];
                }
                s[i][0] = 1.0;
            }
        }

        takePoint1 = false;
        takePoint2 = false;
        if (!straightFirst && // Line starts at point1 and point2 is inside the board
                point1.scrCoords[1] >= 0.0 && point1.scrCoords[1] <= el.board.canvasWidth &&
                point1.scrCoords[2] >= 0.0 && point1.scrCoords[2] <= el.board.canvasHeight) {
            takePoint1 = true;
        }
        if (!straightLast && // Line ends at point2 and point2 is inside the board
                point2.scrCoords[1] >= 0.0 && point2.scrCoords[1] <= el.board.canvasWidth &&
                point2.scrCoords[2] >= 0.0 && point2.scrCoords[2] <= el.board.canvasHeight) {
            takePoint2 = true;
        }

        if (Math.abs(s[1][0]) < JXG.Math.eps) {           // line is parallel to "left", take "top" and "bottom"
            intersect1 = s[0];                          // top
            intersect2 = s[2];                          // bottom
        } else if (Math.abs(s[0][0]) < JXG.Math.eps) {           // line is parallel to "top", take "left" and "right"
            intersect1 = s[1];                          // left
            intersect2 = s[3];                          // right
        } else if (s[1][2] < 0) {                         // left intersection out of board (above)
            intersect1 = s[0];                          // top
            if (s[3][2] > el.board.canvasHeight) {        // right intersection out of board (below)
                intersect2 = s[2];                      // bottom
            } else {
                intersect2 = s[3];                      // right
            }
        } else if (s[1][2] > el.board.canvasHeight) {     // left intersection out of board (below)
            intersect1 = s[2];                          // bottom
            if (s[3][2] < 0) {                            // right intersection out of board (above)
                intersect2 = s[0];                      // top
            } else {
                intersect2 = s[3];                      // right
            }
        } else {
            intersect1 = s[1];                          // left
            if (s[3][2] < 0) {                            // right intersection out of board (above)
                intersect2 = s[0];                      // top
            } else if (s[3][2] > el.board.canvasHeight) { // right intersection out of board (below)
                intersect2 = s[2];                      // bottom
            } else {
                intersect2 = s[3];                      // right
            }
        }

        intersect1 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect1.slice(1), el.board);
        intersect2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect2.slice(1), el.board);

        if (!takePoint1 && !takePoint2) {              // If both points are outside and the complete ray is outside we do nothing
            if (!straightFirst && straightLast && // Ray starting at point 1
                    !this.isSameDirection(point1, point2, intersect1) && !this.isSameDirection(point1, point2, intersect2)) {
                return;
            } else if (straightFirst && !straightLast && // Ray starting at point 2
                    !this.isSameDirection(point2, point1, intersect1) && !this.isSameDirection(point2, point1, intersect2)) {
                return;
            }
        }

        if (!takePoint1) {
            if (!takePoint2) {                // Two border intersection points are used
                if (this.isSameDirection(point1, point2, intersect1)) {
                    if (!this.isSameDirection(point1, point2, intersect2)) {
                        p2 = intersect1;
                        p1 = intersect2;
                    } else {
                        if (JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect1.usrCoords) < JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect2.usrCoords)) {
                            p1 = intersect1;
                            p2 = intersect2;
                        } else {
                            p2 = intersect1;
                            p1 = intersect2;
                        }
                    }
                } else {
                    if (this.isSameDirection(point1, point2, intersect2)) {
                        p1 = intersect1;
                        p2 = intersect2;
                    } else {
                        if (JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect1.usrCoords) < JXG.Math.Geometry.affineDistance(point2.usrCoords, intersect2.usrCoords)) {
                            p2 = intersect1;
                            p1 = intersect2;
                        } else {
                            p1 = intersect1;
                            p2 = intersect2;
                        }
                    }
                }
            } else {                          // Instead of point1 the border intersection is taken
                if (this.isSameDirection(point2, point1, intersect1)) {
                    p1 = intersect1;
                } else {
                    p1 = intersect2;
                }
            }
        } else {
            if (!takePoint2) {                // Instead of point2 the border intersection is taken
                if (this.isSameDirection(point1, point2, intersect1)) {
                    p2 = intersect1;
                } else {
                    p2 = intersect2;
                }
            }
        }

        if (p1) point1.setCoordinates(JXG.COORDS_BY_USER, p1.usrCoords.slice(1));
        if (p2) point2.setCoordinates(JXG.COORDS_BY_USER, p2.usrCoords.slice(1));
    },

    /**
     * If you're looking from point "start" towards point "s" and can see the point "p", true is returned. Otherwise false.
     * @param {JXG.Coords} start The point you're standing on.
     * @param {JXG.Coords} p The point in which direction you're looking.
     * @param {JXG.Coords} s The point that should be visible.
     * @returns {Boolean} True, if from start the point p is in the same direction as s is, that means s-start = k*(p-start) with k>=0.
     */
    isSameDirection: function(start, p, s) {
        var dx, dy, sx, sy, r = false;

        dx = p.usrCoords[1] - start.usrCoords[1];
        dy = p.usrCoords[2] - start.usrCoords[2];

        sx = s.usrCoords[1] - start.usrCoords[1];
        sy = s.usrCoords[2] - start.usrCoords[2];

        if (Math.abs(dx) < JXG.Math.eps) dx = 0;
        if (Math.abs(dy) < JXG.Math.eps) dy = 0;
        if (Math.abs(sx) < JXG.Math.eps) sx = 0;
        if (Math.abs(sy) < JXG.Math.eps) sy = 0;

        if (dx >= 0 && sx >= 0) {
            if ((dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0)) {
                r = true;
            }
        } else if (dx <= 0 && sx <= 0) {
            if ((dy >= 0 && sy >= 0) || (dy <= 0 && sy <= 0)) {
                r = true;
            }
        }

        return r;
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
     * @see #removeTicks
     */
    updateTicks: function(axis, dxMaj, dyMaj, dxMin, dyMin) {
    },

    /**
     * Removes all ticks from an {@link JXG.Line}.
     * @param {JXG.Line} axis Reference of an {@link JXG.Line} object, that's ticks have to be removed.
     * @deprecated
     * @see Line
     * @see Ticks
     * @see Axis
     * @see JXG.Line
     * @see JXG.Ticks
     */
    removeTicks: function(axis) {
        this.remove(this.getElementById(axis.id + '_ticks'));
    },

    /* **************************
     *    Curves
     * **************************/

    /**
     * Draws a {@link JXG.Curve} on the {@link JXG.Board}.
     * @param {JXG.Curve} el Reference to a graph object, that has to be plotted.
     * @see Curve
     * @see JXG.Curve
     * @see #updateCurve
     */
    drawCurve: function(el) {
        this.appendChildPrim(this.createPrim('path', el.id), el.layer);
        this.appendNodesToElement(el, 'path');
        this.updateVisual(el, {shadow: true}, true);
        this.updateCurve(el);
    },

    /**
     * Updates visual appearance of the renderer element assigned to the given {@link JXG.Curve}.
     * @param {JXG.Curve} el Reference to a {@link JXG.Curve} object, that has to be updated.
     * @see Curve
     * @see JXG.Curve
     * @see #drawCurve
     */
    updateCurve: function(el) {
        this.updateVisual(el);
        this.updatePathPrim(el.rendNode, this.updatePathStringPrim(el), el.board);
        this.makeArrows(el);
    },


    /* **************************
     *    Circle related stuff
     * **************************/

    /**
     * Draws a {@link JXG.Circle} on the {@link JXG.Board}.
     * @param {JXG.Circle} el Reference to a {@link JXG.Circle} object, that has to be drawn.
     * @see Circle
     * @see JXG.Circle
     * @see #updateCircle
     */
    drawCircle: function(el) {
        this.appendChildPrim(this.createPrim('ellipse', el.id), el.layer);
        this.appendNodesToElement(el, 'ellipse');
        this.updateCircle(el);
    },

    /**
     * Updates visual appearance of a given {@link JXG.Circle} on the {@link JXG.Board}.
     * @param {JXG.Circle} el Reference to a {@link JXG.Circle} object, that has to be updated.
     * @see Circle
     * @see JXG.Circle
     * @see #drawCircle
     */
    updateCircle: function(el) {
        this.updateVisual(el);

        // Radius umrechnen:
        var radius = el.Radius();
        if (radius > 0.0 && !isNaN(radius + el.midpoint.coords.scrCoords[1] + el.midpoint.coords.scrCoords[2]) && radius*el.board.stretchX<20000) {
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
     * @see #updatePolygon
     */
    drawPolygon: function(el) {
        this.appendChildPrim(this.createPrim('polygon', el.id), el.layer);
        this.appendNodesToElement(el, 'polygon');
        this.updatePolygon(el);
    },

    /**
     * Updates properties of a {@link JXG.Polygon}'s rendering node.
     * @param {JXG.Polygon} el Reference to a {@link JXG.Polygon} object, that has to be updated.
     * @see Polygon
     * @see JXG.Polygon
     * @see #drawPolygon
     */
    updatePolygon: function(el) {
        // here originally strokecolor wasn't updated but strokewidth was
        // but if there's no strokecolor i don't see why we should update strokewidth.
        this.updateVisual(el, {stroke: true, dash: true});
        this.updatePolygonPrim(el.rendNode, el);
    },

    /* **************************
     *    Text related stuff
     * **************************/

    /**
     * Displays a {@link JXG.Text} on the {@link JXG.Board} by putting a HTML div over it.
     * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be displayed
     * @see Text
     * @see JXG.Text
     * @see #drawInternalText
     * @see #updateText
     * @see #updateInternalText
     * @see #updateTextStyle
     */
    drawText: function(el) {
        var node;
        
        if (el.display == 'html') {
            node = this.container.ownerDocument.createElement('div');
            node.style.position = 'absolute';
            node.style.color = el.visProp['strokeColor'];
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
     * An internal text is a {@link JXG.Text} element which is drawn using only
     * the given renderer but no HTML. This method is only a stub, the drawing
     * is done in the special renderers.
     * @param {JXG.Text} el Reference to a {@link JXG.Text} object
     * @see Text
     * @see JXG.Text
     * @see #updateInternalText
     * @see #drawText
     * @see #updateText
     * @see #updateTextStyle
     */
    drawInternalText: function(el) {
    },


    /**
     * Updates visual properties of an already existing {@link JXG.Text} element.
     * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see #drawText
     * @see #drawInternalText
     * @see #updateInternalText
     * @see #updateTextStyle
     */
    updateText: function(el) {
        // Update only objects that are visible.
        if (!el.visProp['visible']) return;
        if (isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) return;

        this.updateTextStyle(el);
        if (el.display == 'html') {
            el.rendNode.style.left = (el.coords.scrCoords[1]) + 'px';
            el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText) + 'px';
            el.updateText();
            if (el.htmlStr != el.plaintextStr) {
                el.rendNode.innerHTML = el.plaintextStr;
                if (el.board.options.text.useASCIIMathML) {
                    AMprocessNode(el.rendNode, false);
                }
                el.htmlStr = el.plaintextStr;
                if (el.board.options.text.useMathJax) {
                    MathJax.Hub.Typeset(el.rendNode);
                }
            }
        } else {
            this.updateInternalText(el);
        }
    },

    /**
     * Updates visual properties of an already existing {@link JXG.Text} element.
     * @param {JXG.Text} el Reference to an {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see #drawInternalText
     * @see #drawText
     * @see #updateText
     * @see #updateTextStyle
     */
    updateInternalText: function(el) {
    },

    /**
     * Updates CSS style properties of a {@link JXG.Text} node.
     * @param {JXG.Text} el Reference to the {@link JXG.Text} object, that has to be updated.
     * @see Text
     * @see JXG.Text
     * @see #drawText
     * @see #drawInternalText
     * @see #updateText
     * @see #updateInternalText
     */
    updateTextStyle: function(el) {
        var fs;
        
        if (el.visProp['fontSize']) {
            if (typeof el.visProp['fontSize'] == 'function') {
                fs = el.visProp['fontSize']();
                el.rendNode.style.fontSize = (fs > 0 ? fs : 0);
            } else {
                el.rendNode.style.fontSize = (el.visProp['fontSize']);
            }
        }
    },

    /* **************************
     *    Image related stuff
     * **************************/

    /**
     * Draws an {@link JXG.Image} on the {@link JXG.Board}; This is just a template, has to be implemented by special renderers.
     * @param {JXG.Image} el Reference to an image object, that has to be drawn.
     * @see Image
     * @see JXG.Image
     * @see #updateImage
     */
    drawImage: function(el) {
    },

    /**
     * If the URL of the image is proveided by a function, i.e. dynamic URL
     * the URL has to be updated during updateImage()
     * @param {JXG.Image} el Reference to an image object.
     * @see #updateImage
     */
    updateImageURL: function(el) {
    },

    /**
     * Updates the properties of an {@link JXG.Image} element.
     * @param {JXG.Image} el Reference to an {@link JXG.Image} object, that has to be updated.
     * @see JXG.Image
     * @see #drawImage
     */
    updateImage: function(el) {
        this.updateRectPrim(el.rendNode, el.coords.scrCoords[1], el.coords.scrCoords[2] - el.size[1],
                el.size[0], el.size[1]);
         
        this.updateImageURL(el);
        this.transformImage(el, el.transformations);
        this.updateVisual(el, {stroke: true, dash: true}, true);
    },
    
    /**
    * Multiplication of transformations without updating.
    * That means, at that point it is expected that the matrices
    * contain numbers only.
    * First, the origin in user coords is translated to (0,0) in screen coords.
    * Then, the stretch factors are divided out.
    * After the transformations in user coords, the  strech factors are multiplied in again,
    * and the origin in user coords is translated back to its position.
    * @see #transformImage
    */
    joinTransforms: function(el,t) {
        var m = [[1,0,0],[0,1,0],[0,0,1]], 
            mpre1 =  [[1, 0, 0], [-el.board.origin.scrCoords[1], 1, 0], [-el.board.origin.scrCoords[2], 0, 1]], 
            mpre2 =  [[1, 0, 0], [0, 1/el.board.stretchX, 0], [0, 0, -1/el.board.stretchY]],
            mpost2 = [[1, 0, 0], [0, el.board.stretchX, 0], [0, 0, -el.board.stretchY]],
            mpost1 = [[1, 0, 0], [el.board.origin.scrCoords[1], 1, 0], [el.board.origin.scrCoords[2], 0, 1]],
            i, len = t.length;
            
        for (i=0;i<len;i++) {
            m = JXG.Math.matMatMult(mpre1,m);
            m = JXG.Math.matMatMult(mpre2,m);
            m = JXG.Math.matMatMult(t[i].matrix,m);
            m = JXG.Math.matMatMult(mpost2,m);
            m = JXG.Math.matMatMult(mpost1,m);
        }
        return m;
    },
    

    /* **************************
     *    Grid stuff
     * **************************/

    /**
     * Creates a grid on the board, i.e. light helper lines to support the user on creating and manipulating a construction.
     * @param {JXG.Board} board Board on which the grid is drawn.
     * @see #removeGrid
     */
    drawGrid: function(board) {
        var gridX = board.options.grid.gridX,
            gridY = board.options.grid.gridY,
            k = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0], board),
            k2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board),
            tmp = Math.ceil(k.usrCoords[1]),
            j = 0,
            i, j2, l, l2,
            gx, gy, topLeft, bottomRight, node2, el;

        board.options.grid.hasGrid = true;

        for (i = 0; i <= gridX + 1; i++) {
            if (tmp - i / gridX < k.usrCoords[1]) {
                j = i - 1;
                break;
            }
        }

        tmp = Math.floor(k2.usrCoords[1]);
        j2 = 0;
        for (i = 0; i <= gridX + 1; i++) {
            if (tmp + i / gridX > k2.usrCoords[1]) {
                j2 = i - 1;
                break;
            }
        }

        tmp = Math.ceil(k2.usrCoords[2]);
        l2 = 0;
        for (i = 0; i <= gridY + 1; i++) {
            if (tmp - i / gridY < k2.usrCoords[2]) {
                l2 = i - 1;
                break;
            }
        }

        tmp = Math.floor(k.usrCoords[2]);
        l = 0;
        for (i = 0; i <= gridY + 1; i++) {
            if (tmp + i / gridY > k.usrCoords[2]) {
                l = i - 1;
                break;
            }
        }

        gx = Math.round((1.0 / gridX) * board.stretchX);
        gy = Math.round((1.0 / gridY) * board.stretchY);

        topLeft = new JXG.Coords(JXG.COORDS_BY_USER,
                [Math.ceil(k.usrCoords[1]) - j / gridX, Math.floor(k.usrCoords[2]) + l / gridY],
                board);
        bottomRight = new JXG.Coords(JXG.COORDS_BY_USER,
                [Math.floor(k2.usrCoords[1]) + j2 / gridX, Math.ceil(k2.usrCoords[2]) - l2 / gridY],
                board);

        node2 = this.drawVerticalGrid(topLeft, bottomRight, gx, board);
        this.appendChildPrim(node2, board.options.layer['grid']);
        if (!board.options.grid.snapToGrid) {
            el = new Object();
            el.visProp = {};
            el.rendNode = node2;
            el.elementClass = JXG.OBJECT_CLASS_LINE;
            el.id = "gridx";
            JXG.clearVisPropOld(el);
            this.setObjectStrokeColor(el, board.options.grid.gridColor, board.options.grid.gridOpacity);
        }
        else {
            el = new Object();
            el.visProp = {};
            el.rendNode = node2;
            el.elementClass = JXG.OBJECT_CLASS_LINE;
            el.id = "gridx";
            JXG.clearVisPropOld(el);
            this.setObjectStrokeColor(el, '#FF8080', 0.5); //board.gridOpacity);
        }
        this.setPropertyPrim(node2, 'stroke-width', '0.4px');
        if (board.options.grid.gridDash) {
            this.setGridDash("gridx");
        }

        node2 = this.drawHorizontalGrid(topLeft, bottomRight, gy, board);
        this.appendChildPrim(node2, board.options.layer['grid']); // Attention layer=1
        if (!board.options.grid.snapToGrid) {
            el = new Object();
            el.visProp = {};
            el.rendNode = node2;
            el.elementClass = JXG.OBJECT_CLASS_LINE;
            el.id = "gridy";
            JXG.clearVisPropOld(el);
            this.setObjectStrokeColor(el, board.options.grid.gridColor, board.options.grid.gridOpacity);
        }
        else {
            el = new Object();
            el.visProp = {};
            el.rendNode = node2;
            el.elementClass = JXG.OBJECT_CLASS_LINE;
            el.id = "gridy";
            JXG.clearVisPropOld(el);
            this.setObjectStrokeColor(el, '#FF8080', 0.5); //board.gridOpacity);
        }
        this.setPropertyPrim(node2, 'stroke-width', '0.4px');
        if (board.options.grid.gridDash) {
            this.setGridDash("gridy");
        }

    },

    /**
     * Remove the grid from the given board.
     * @param {JXG.Board} board Board from which the grid is removed.
     * @see #drawGrid
     */
    removeGrid: function(board) {
        // var getElementById = this.getElementById; // Does not work, because 
                                                     // this in getElementById would point to "window"

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
    hide: function(obj) {
    },

    /**
     * Shows a hidden element on the canvas; Only a stub, requires implementation in the derived renderer.
     * @param {JXG.GeometryElement} obj Reference to the object that has to appear.
     * @see #hide
     */
    show: function(obj) {
    },

    /**
     * Sets an element's stroke width.
     * @param {JXG.GeometryElement} el Reference to the geometry element.
     * @param {Number} width The new stroke width to be assigned to the element.
     */
    setObjectStrokeWidth: function(el, width) {
    },

    /**
     * Changes an objects stroke color to the given color.
     * @param {JXG.GeometryElement} obj Reference of the {@link JXG.GeometryElement} that gets a new stroke color.
     * @param {String} color Color in a HTML/CSS compatible format, e.g. <strong>#00ff00</strong> or <strong>green</strong> for green.
     * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
     */
    setObjectStrokeColor: function(obj, color, opacity) {
    },

    /**
     * Sets an objects fill color.
     * @param {JXG.GeometryElement} obj Reference of the object that wants a new fill color.
     * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose 'none'.
     * @param {Number} opacity Opacity of the fill color. Must be between 0 and 1.
     */
    setObjectFillColor: function(obj, color, opacity) {
    },

    /**
     * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards compatibility.
     * @param {JXG.GeometryElement} obj Reference of the object that is in draft mode.
     */
    setDraft: function (obj) {
        if (!obj.visProp['draft']) {
            return;
        }
        var draftColor = obj.board.options.elements.draft.color,
            draftOpacity = obj.board.options.elements.draft.opacity;

        if (obj.type == JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, draftColor, draftOpacity);
        }
        else {
            if (obj.elementClass == JXG.OBJECT_CLASS_POINT) {
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
        if (obj.type == JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillColorOpacity']);
        }
        else {
            if (obj.type == JXG.OBJECT_CLASS_POINT) {
                this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillColorOpacity']);
            }
            this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeColorOpacity']);
            this.setObjectStrokeWidth(obj, obj.visProp['strokeWidth']);
        }
    },

    /**
     * Highlights an object, i.e. changes the current colors of the object to its highlighting colors
     * @param {JXG.GeometryElement} obj Reference of the object that will be highlighted.
     */
    highlight: function(obj) {
        var i;

        if (!obj.visProp['draft']) {
            if (obj.type == JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
                this.setObjectFillColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
            }
            else if (obj.type == JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(obj, obj.visProp['highlightFillColor'], obj.visProp['highlightFillOpacity']);
                for (i = 0; i < obj.borders.length; i++) {
                    this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
                }
            }
            else {
                this.setObjectStrokeColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
                this.setObjectFillColor(obj, obj.visProp['highlightFillColor'], obj.visProp['highlightFillOpacity']);
            }
            if (obj.visProp['highlightStrokeWidth']) {
                this.setObjectStrokeWidth(obj, obj.visProp['highlightStrokeWidth']);
            }
        }
    },

    /**
     * Uses the "normal" colors of an object, i.e. the opposite of {@link #highlight}.
     * @param {JXG.GeometryElement} obj Reference of the object that will get its normal colors.
     */
    noHighlight: function(obj) {
        var i;
        
        if (!obj.visProp['draft']) {
            if (obj.type == JXG.OBJECT_CLASS_POINT) {
                this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
                this.setObjectFillColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
            }
            else if (obj.type == JXG.OBJECT_TYPE_POLYGON) {
                this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillOpacity']);
                for (i = 0; i < obj.borders.length; i++) {
                    this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp['strokeColor'], obj.visProp['strokeOpacity']);
                }
            }
            else {
                this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
                this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillOpacity']);
            }
            this.setObjectStrokeWidth(obj, obj.visProp['strokeWidth']);
        }
    },

    /**
     * Removes an HTML-Element from Canvas. Just a stub.
     * @param {HTMLElement} node The HTMLElement to remove.
     */
    remove: function(node) {
    },


    /* **************************
     * general renderer related methods
     * **************************/

    /**
     * Stop redraw. This method is called before every update, so a non-vector-graphics based renderer
     * can delete the contents of the drawing panel.
     * @see #unsuspendRedraw
     */
    suspendRedraw: function() {
    },

    /**
     * Restart redraw. This method is called after updating all the rendering node attributes.
     * @see #suspendRedraw
     */
    unsuspendRedraw: function() {
    },

    /**
     * The tiny zoom bar shown on the bottom of a board (if {@link JXG.Board#showNavigation} is true).
     * @param {JXG.Board} board Reference to a JSXGraph board.
     */
    drawZoomBar: function(board) {
        var doc,
            node,
            createButton = function(label, handler) {
                var button;

                button = doc.createElement('span');
                node.appendChild(button);
                button.innerHTML = label;
                JXG.addEvent(button, 'click', handler, board);
            };

        doc = this.container.ownerDocument;
        node = doc.createElement('div');

        node.setAttribute('id', this.container.id + '_navigationbar');
        node.className = 'JXGtext';
        node.style.color = '#aaaaaa';
        node.style.backgroundColor = '#f5f5f5';
        node.style.padding = '2px';
        node.style.position = 'absolute';
        node.style.fontSize = '10px';
        node.style.cursor = 'pointer';
        node.style.zIndex = '100';
        this.container.appendChild(node);
        node.style.right = '5px'; //(board.canvasWidth-100)+ 'px';
        node.style.bottom = '5px';

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
    getElementById: function(id) {
        return document.getElementById(this.container.id + '_' + id);
    },

    /**
     * findSplit() is a subroutine for {@link #RamenDouglasPeuker}.
     * It searches for the point between index i and j which
     * has the largest distance from the line between the points i and j.
     * @param {Array} pts Array of {@link JXG.Point}
     * @param {Number} i Index of a point in pts
     * @param {Number} j Index of a point in pts
     **/
    findSplit: function(pts, i, j) {
        var dist = 0,
            f = i,
            d, k, ci, cj, ck,
            x0, y0, x1, y1,
            den, lbda;

        if (j - i < 2) return [-1.0,0];

        ci = pts[i].scrCoords;
        cj = pts[j].scrCoords;
        if (isNaN(ci[1] + ci[2] + cj[1] + cj[2])) return [NaN,j];

        for (k = i + 1; k < j; k++) {
            ck = pts[k].scrCoords;
            x0 = ck[1] - ci[1];
            y0 = ck[2] - ci[2];
            x1 = cj[1] - ci[1];
            y1 = cj[2] - ci[2];
            den = x1 * x1 + y1 * y1;
            if (den >= JXG.Math.eps) {
                lbda = (x0 * x1 + y0 * y1) / den;
                d = x0 * x0 + y0 * y0 - lbda * (x0 * x1 + y0 * y1);
            } else {
                lbda = 0.0;
                d = x0 * x0 + y0 * y0;
            }
            if (lbda < 0.0) {
                d = x0 * x0 + y0 * y0;
            } else if (lbda > 1.0) {
                x0 = ck[1] - cj[1];
                y0 = ck[2] - cj[2];
                d = x0 * x0 + y0 * y0;
            }
            if (d > dist) {
                dist = d;
                f = k;
            }
        }
        return [Math.sqrt(dist),f];
    },

    /**
     * RDB() is a subroutine for {@link #RamenDouglasPeuker}.
     * It runs recursively through the point set and searches the
     * point which has the largest distance from the line between the first point and
     * the last point. If the distance from the line is greater than eps, this point is
     * included in our new point set otherwise it is discarded.
     * If it is taken, we recursively apply the subroutine to the point set before
     * and after the chosen point.
     * @param {Array} pts Array of {@link JXG.Point}s
     * @param {Number} i Index of an element of pts
     * @param {Number} j Index of an element of pts
     * @param {Number} eps If the absolute value of a given number <tt>x</tt> is smaller than <tt>eps</tt> it is considered to be equal <tt>0</tt>.
     * @param {Array} newPts Array of {@link JXG.Point}s
     */
    RDP: function(pts, i, j, eps, newPts) {
        var result = this.findSplit(pts, i, j);

        if (result[0] > eps) {
            this.RDP(pts, i, result[1], eps, newPts);
            this.RDP(pts, result[1], j, eps, newPts);
        } else {
            newPts.push(pts[j]);
        }
    },

    /**
     * Ramen-Douglas-Peuker algorithm.
     * It discards points which are not necessary from the polygonal line defined by the point array
     * pts. The computation is done in screen coordinates.
     * Average runtime is O(nlog(n)), worst case runtime is O(n^2), where n is the number of points.
     * @param {Array} pts Array of {@link JXG.Point}s
     * @param {Number} eps If the absolute value of a given number <tt>x</tt> is smaller than <tt>eps</tt> it is considered to be equal <tt>0</tt>.
     * @returns {Array} An array containing points which represent an apparently identical curve as the points of pts do, but contains fewer points.
     */
    RamenDouglasPeuker: function(pts, eps) {
        var newPts = [], i, k, len;

        len = pts.length;

        // Search for the left most point woithout NaN coordinates
        i = 0;
        while (i < len && isNaN(pts[i].scrCoords[1] + pts[i].scrCoords[2])) {
            i++;
        }
        // Search for the right most point woithout NaN coordinates
        k = len - 1;
        while (k > i && isNaN(pts[k].scrCoords[1] + pts[k].scrCoords[2])) {
            k--;
        }

        // Only proceed if something is left
        if (!(i > k || i == len)) {
            newPts[0] = pts[i];
            this.RDP(pts, i, k, eps, newPts);
        }

        return newPts;
    },

    /**
     * Sets the shadow properties to a geometry element. This method is only a stub, it is implemented in the actual renderers.
     * @param {JXG.GeometryElement} element Reference to a geometry object, that should get a shadow
     */
    setShadow: function(element) {
    },


    /**
     * @TODO Description of parameters
     * Updates a path element.
     */
    updatePathStringPoint: function(el, size, type) {
    },

    /**
     * If <tt>val</tt> is a function, it will be evaluated without giving any parameters, else the input value is just returned.
     * @param val Could be anything.
     */
    evaluate: function(val) {
        if (JXG.isFunction(val)) {
            return val();
        } else {
            return val;
        }
    },

    /**
     * This is just a stub. Usage and implementation may differ between the different renderers.
     */
    setBuffering: function() {

    }
};
};
