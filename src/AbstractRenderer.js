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
 * @fileoverview AbstractRenderer is the base class for all renderers. This class is subject
 * to change the next time that only a few methods are strictly required for a special
 * renderer derived from this class to have a working special renderer. Of course other
 * methods may be overwritten for performance reasons, too.
 */

/**
 * Constructs a new AbstractRenderer object.
 * @class The AbstractRenderer is a base class that should be considered what in other languages
 * is called an abstract class, even though no such thing really exists in JavaScript. All members
 * essential for a renderer are defined here.
 * @constructor
 * @see JXG.SVGRenderer
 * @see JXG.VMLRenderer
 * @private
 */
JXG.AbstractRenderer = function() {
	/**
	 * TODO Needs description
	 * @type number
	 * @default 8
	 * @private
	 */
    this.vOffsetText = 8;
    
    /**
     * If true the visual properties of the elements are updated on every update.
     * @type boolean
     * @default true 
     */
    this.enhancedRendering = true;
};


/* ************************** 
 *    Point related stuff
 * **************************/

/**
 * Draws a point on the canvas.
 * @param el Reference to a point object, that has to be drawn.
 * @see JXG.Point
 * @see #updatePoint
 */
JXG.AbstractRenderer.prototype.drawPoint = function(/** JXG.Point */ el) {
    var node,
        f = el.visProp['face'];
        
    if(f == 'cross' || f == 'x') { // x
        node = this.createPrimitive('path',el.id);
        this.appendChildPrimitive(node,el.layer);
        this.appendNodesToElement(el, 'path');
    }
    else if(f == 'circle' || f == 'o') { // circle
        node = this.createPrimitive('circle',el.id);
        this.appendChildPrimitive(node,el.layer);
        this.appendNodesToElement(el, 'circle');
    }
    else if(f == 'square' || f == '[]') { // rectangle
        node = this.createPrimitive('rect',el.id);
        this.appendChildPrimitive(node,el.layer);
        this.appendNodesToElement(el, 'rect');
    }
    else if(f == 'plus' || f == '+') { // +
        node = this.createPrimitive('path',el.id);
        this.appendChildPrimitive(node,el.layer);  
        this.appendNodesToElement(el, 'path');
    }
    el.rendNode = node;
    
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
    this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);	

    this.updatePoint(el);
};
   
/**
 * Updates visual appearance of the renderer element assigned to the given line.
 * @param el Reference to a point object, that has to be updated.
 * @see JXG.Point
 * @see #drawPoint
 * @see #changePointStyle
 */
JXG.AbstractRenderer.prototype.updatePoint = function(/** JXG.Point */ el) {
    var size = el.visProp['size'],
    	f = el.visProp['face'];
    if (isNaN(el.coords.scrCoords[2]) || isNaN(el.coords.scrCoords[1])) return;
    
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
        } else {
            this.setDraft(el);
        }
    }
    // Zoom does not work for traces.
    size *= ((!el.board || !el.board.options.point.zoom)?1.0:Math.sqrt(el.board.zoomX*el.board.zoomY));
    
    if(f == 'cross' || f == 'x') { // x
        this.updatePathPrimitive(el.rendNode, this.updatePathStringPoint(el, size,'x'), el.board); 
    }
    else if(f == 'circle' || f == 'o') { // circle
        this.updateCirclePrimitive(el.rendNode,el.coords.scrCoords[1], el.coords.scrCoords[2], size+1);            
    }
    else if(f == 'square' || f == '[]') { // rectangle
        this.updateRectPrimitive(el.rendNode,
                el.coords.scrCoords[1]-size, el.coords.scrCoords[2]-size, size*2, size*2);
    }
    else if(f == 'plus' || f == '+') { // +
        this.updatePathPrimitive(el.rendNode, this.updatePathStringPoint(el,size,'+'), el.board); 
    }
    this.setShadow(el);
};

/**
 * Changes the style of a point that already exists on the canvas. This is required because
 * the point styles differ in what elements have to be drawn, e.g. if the point is marked by
 * a x or a + two lines are drawn, if it's marked by spot a circle is drawn. This method removes
 * the old renderer element(s) and creates the new one(s).
 * @param el Reference to a point object, that has to be updated.
 * @see JXG.Point
 * @see #updatePoint
 */
JXG.AbstractRenderer.prototype.changePointStyle = function(/** JXG.Point */el) {
    var node = this.getElementById(el.id);
    if(node != null) {
        this.remove(node);
    }
    this.drawPoint(el);
    JXG.clearVisPropOld(el);

    if(!el.visProp['visible']) {
        this.hide(el);
    }
    if(el.visProp['draft']) {
        this.setDraft(el);
    }
};


/* ************************** 
 *    Line related stuff
 * **************************/


/**
 * Draws a line on the canvas.
 * @param {JXG.Line} el Reference to a line object, that has to be drawn.
 * @see JXG.Line
 * @see #updateLine
 * @see #calcStraight
 */
JXG.AbstractRenderer.prototype.drawLine = function(el) { 
    var node = this.createPrimitive('line',el.id);
    this.appendChildPrimitive(node,el.layer);
    this.appendNodesToElement(el,'lines');

    this.updateLine(el);
};

/**
 * Updates visual appearance of the renderer element assigned to the given line.
 * @param el Reference to the line object that has to be updated.
 * @see JXG.Line
 * @see #drawLine
 * @see #calcStraight
 */
JXG.AbstractRenderer.prototype.updateLine = function(/** JXG.Line */ el) {
    var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
        screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
        ax, ay, bx, by, beta, sgn, x, y, m;
        
    //if(el.visProp['straightFirst'] || el.visProp['straightLast']) {
       this.calcStraight(el,screenCoords1,screenCoords2); 
    //} 
    this.updateLinePrimitive(el.rendNode,screenCoords1.scrCoords[1],screenCoords1.scrCoords[2],
            screenCoords2.scrCoords[1],screenCoords2.scrCoords[2],el.board);

    // Update the image which is connected to the line:
    if (el.image!=null) {
        ax = screenCoords1.scrCoords[1];
        ay = screenCoords1.scrCoords[2];
        bx = screenCoords2.scrCoords[1];
        by = screenCoords2.scrCoords[2];
        //beta;                                              // ???
        sgn = (bx-ax>0)?1:-1;
        if (Math.abs(bx-ax)>0.0000001) {
            beta = Math.atan((by-ay)/(bx-ax))+ ((sgn<0)?Math.PI:0);  
        } else {
            beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
        }
        x = 250; //ax;
        y = 256; //ay;//+el.image.size[1]*0.5;
        m = [
                 [1,                                    0,             0],
                 [x*(1-Math.cos(beta))+y*Math.sin(beta),Math.cos(beta),-Math.sin(beta)],
                 [y*(1-Math.cos(beta))-x*Math.sin(beta),Math.sin(beta), Math.cos(beta)]
                ];
        el.imageTransformMatrix = m;
    }
    this.makeArrows(el);
    
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setDashStyle(el,el.visProp);    
            this.setShadow(el);
        } else {
            this.setDraft(el);
        }
    }     
};

/**
 * Calculates drawing start and end point for a line. A segment is only drawn from start to end point, a straight line
 * is drawn until it meets the boards boundaries.
 * @param el Reference to a line object, that needs calculation of start and end point.
 * @param point1 Coordinates of the point where line drawing begins.
 * @param point2 Coordinates of the point where line drawing ends.
 * @see JXG.Line
 * @see #drawLine
 * @see #updateLine
 */
JXG.AbstractRenderer.prototype.calcStraight = function(/** JXG.Line */ el, /** JXG.Coords */ point1, /** JXG.Coords */ point2) {
    var takePoint1, takePoint2, intersect1, intersect2, straightFirst, straightLast, 
        b, c, s, i, j, p1, p2;
    
    b = el.board.algebra;
    straightFirst = el.visProp['straightFirst'];
    straightLast  = el.visProp['straightLast'];

/*
    if (Math.abs(point1.scrCoords[0])<b.eps||Math.abs(point2.scrCoords[0])<b.eps) {
        straightFirst = true;
        straightLast  = true;
    }
*/    
    // If one of the point is an ideal point in homogeneous coordinates
    // drawing of line segments or rays are not possible. 
    if (Math.abs(point1.scrCoords[0])<b.eps) {
        straightFirst = true;
    }
    if (Math.abs(point2.scrCoords[0])<b.eps) {
        straightLast  = true;
    }

    if ( !straightFirst && !straightLast ) {  // Do nothing in case of line segments (inside or outside of the board)
        return;
    }
    
    // Compute the stdform of the line in screen coordinates.
    c = [];
    c[0] = el.stdform[0] - 
           el.stdform[1]*el.board.origin.scrCoords[1]/el.board.stretchX+
           el.stdform[2]*el.board.origin.scrCoords[2]/el.board.stretchY;
    c[1] = el.stdform[1]/el.board.stretchX;
    c[2] = el.stdform[2]/(-el.board.stretchY);

    if (isNaN(c[0]+c[1]+c[2])) return; // p1=p2
    
    // Intersect the line with the four borders of the board.
    s = [];
    s[0] = b.crossProduct(c,[0,0,1]);  // top
    s[1] = b.crossProduct(c,[0,1,0]);  // left
    s[2] = b.crossProduct(c,[-el.board.canvasHeight,0,1]);  // bottom
    s[3] = b.crossProduct(c,[-el.board.canvasWidth,1,0]);   // right

    // Normalize the intersections 
    for (i=0;i<4;i++) {
        if (Math.abs(s[i][0])>b.eps) {
            for (j=2;j>0;j--) {
                s[i][j] /= s[i][0];
            }
            s[i][0] = 1.0;
        }
    }
    
    takePoint1 = false;
    takePoint2 = false;
    if (!straightFirst &&    // Line starts at point1 and point2 is inside the board
            point1.scrCoords[1]>=0.0 && point1.scrCoords[1]<=el.board.canvasWidth &&
            point1.scrCoords[2]>=0.0 && point1.scrCoords[2]<=el.board.canvasHeight) {
        takePoint1 = true;
    }
    if (!straightLast &&    // Line ends at point2 and point2 is inside the board
            point2.scrCoords[1]>=0.0 && point2.scrCoords[1]<=el.board.canvasWidth &&
            point2.scrCoords[2]>=0.0 && point2.scrCoords[2]<=el.board.canvasHeight) {
        takePoint2 = true;
    }

    if (Math.abs(s[1][0])<b.eps) {                  // line is parallel to "left", take "top" and "bottom"
        intersect1 = s[0];                          // top
        intersect2 = s[2];                          // bottom
    } else if (Math.abs(s[0][0])<b.eps) {           // line is parallel to "top", take "left" and "right"
        intersect1 = s[1];                          // left
        intersect2 = s[3];                          // right
    } else if (s[1][2]<0) {                         // left intersection out of board (above)
        intersect1 = s[0];                          // top
        if (s[3][2]>el.board.canvasHeight) {        // right intersection out of board (below)
            intersect2 = s[2];                      // bottom
        } else {
            intersect2 = s[3];                      // right
        }
    } else if (s[1][2]>el.board.canvasHeight) {     // left intersection out of board (below)
        intersect1 = s[2];                          // bottom
        if (s[3][2]<0) {                            // right intersection out of board (above)
            intersect2 = s[0];                      // top
        } else {
            intersect2 = s[3];                      // right
        }
    } else {
        intersect1 = s[1];                          // left
        if (s[3][2]<0) {                            // right intersection out of board (above)
            intersect2 = s[0];                      // top
        } else if (s[3][2]>el.board.canvasHeight) { // right intersection out of board (below)
            intersect2 = s[2];                      // bottom
        } else {
            intersect2 = s[3];                      // right
        }
    }
    
    intersect1 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect1.slice(1), el.board);
    intersect2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, intersect2.slice(1), el.board);
 
    if (!takePoint1) {
        if (!takePoint2) {                // Two border intersection points are used
            if (this.isSameDirection(point1, point2, intersect1)) {
                if (!this.isSameDirection(point1, point2, intersect2)) {
                    p2 = intersect1;
                    p1 = intersect2;
                } else {
                    if (el.board.algebra.affineDistance(point2.usrCoords,intersect1.usrCoords)<el.board.algebra.affineDistance(point2.usrCoords,intersect2.usrCoords)) {
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
                    if (el.board.algebra.affineDistance(point2.usrCoords,intersect1.usrCoords)<el.board.algebra.affineDistance(point2.usrCoords,intersect2.usrCoords)) {
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
};

/**
* If you're looking from point "start" towards point "s" and can see the point "p", true is returned. Otherwise false.
* @param start The point you're standing on.
* @param p The point in which direction you're looking.
* @param s The point that should be visible.
* @return True, if from start the point p is in the same direction as s is, that means s-start = k*(p-start) with k>=0.
* @private
*/
JXG.AbstractRenderer.prototype.isSameDirection = function(/** JXG.Coords */ start, /** JXG.Coords */ p, /** JXG.Coords */ s) /** boolean */ {
    var dx, dy, sx, sy;
    
    dx = p.usrCoords[1]-start.usrCoords[1];
    dy = p.usrCoords[2]-start.usrCoords[2];

    sx = s.usrCoords[1]-start.usrCoords[1];
    sy = s.usrCoords[2]-start.usrCoords[2];

    if (Math.abs(dx)<JXG.Math.eps) dx=0;
    if (Math.abs(dy)<JXG.Math.eps) dy=0;
    if (Math.abs(sx)<JXG.Math.eps) sx=0;
    if (Math.abs(sy)<JXG.Math.eps) sy=0;

    if (dx>=0&&sx>=0) {
        if ((dy>=0&&sy>=0) || (dy<=0&&sy<=0)) { return true; }
    } else if (dx<=0&&sx<=0){
        if ((dy>=0&&sy>=0) || (dy<=0&&sy<=0)) { return true; }        
    }

    return false;
};

/**
 * Update ticks on a line. This method is only a stub and is by now implemented only in the special renderers.
 * @param axis Reference of an line object, thats ticks have to be updated.
 * @param dxMaj Number of pixels a major tick counts in x direction.
 * @param dyMaj Number of pixels a major tick counts in y direction.
 * @param dxMin Number of pixels a minor tick counts in x direction.
 * @param dyMin Number of pixels a minor tick counts in y direction.
 * @see JXG.Line
 */
JXG.AbstractRenderer.prototype.updateTicks = function(/** JXG.Line */ axis, /** number */ dxMaj,
                                                      /** number */ dyMaj, /** number */ dxMin, /** number */ dyMin)
{ };

/**
 * Removes all ticks from an axis.
 * @param axis Reference of an line object, that's ticks have to be removed.
 * @deprecated
 * @see JXG.Line
 * @see #upateTicks
 */
JXG.AbstractRenderer.prototype.removeTicks = function(/** JXG.Line */ axis) {
    var ticks = this.getElementById(axis.id+'_ticks');
    this.remove(ticks);
};


/**
 * Creates a rendering node for an arrow on the board.
 * @param el Reference to an arrow object, that has to be drawn.
 * @see Arrow
 * @see JXG.Line
 * @see #updateArrow
 */
JXG.AbstractRenderer.prototype.drawArrow = function(/** JXG.Line */ el) {
    var node = this.createPrimitive('line',el.id);
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']); // ?
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']); // ?
    this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']); // ?
    this.setDashStyle(el,el.visProp); // ?
    this.makeArrow(node,el);
    this.appendChildPrimitive(node,el.layer);
    this.appendNodesToElement(el,'lines');

    this.updateArrow(el);
};

/**
 * Updates properties of an arrow that already exists on the canvas.
 * @param el Reference to an arrow object, that has to be updated.
 * @see Arrow
 * @see JXG.Line
 * @see #drawArrow
 */
JXG.AbstractRenderer.prototype.updateArrow = function(/** JXG.Line */ el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
            this.setShadow(el);
            this.setDashStyle(el,el.visProp);
        } else {
            this.setDraft(el);
        }
    }
    this.updateLinePrimitive(el.rendNode,el.point1.coords.scrCoords[1],el.point1.coords.scrCoords[2],
        el.point2.coords.scrCoords[1],el.point2.coords.scrCoords[2],el.board);
};


/* ************************** 
 *    Curve related stuff
 * **************************/

/**
 * Draws a graph on the canvas.
 * @param {JXG.Curve} el Reference to a graph object, that has to be plotted.
 * @see JXG.Curve
 * @see #updateCurve
 */
JXG.AbstractRenderer.prototype.drawCurve = function(el) { 
    var node = this.createPrimitive('path',el.id);
    
    //node.setAttributeNS(null, 'stroke-linejoin', 'round');
    this.appendChildPrimitive(node,el.layer);
    this.appendNodesToElement(el,'path');
    this.setObjectStrokeWidth(el,el.visProp['strokeWidth']); // ?
    this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']); // ?
    this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']); // ?
    this.setDashStyle(el,el.visProp); // ?
    this.updateCurve(el);
};

/**
 * Updates visual appearance of the renderer element assigned to the given curve.
 * @param el Reference to a curve object, that has to be updated.
 * @see JXG.Curve
 * @see #drawCurve
 */
JXG.AbstractRenderer.prototype.updateCurve = function(/** JXG.Curve */ el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
            this.setDashStyle(el,el.visProp);
            this.setShadow(el);
        } else {
            this.setDraft(el);
        }
    }
    this.updatePathPrimitive(el.rendNode,this.updatePathStringPrimitive(el),el.board);
};


/* ************************** 
 *    Circle related stuff
 * **************************/

/**
 * Draws a circle on the canvas.
 * @param el Reference to a circle object, that has to be drawn.
 * @see JXG.Circle
 * @see #updateCircle
 */
JXG.AbstractRenderer.prototype.drawCircle = function(/** JXG.Circle */ el) { 
    var node = this.createPrimitive('ellipse',el.id);
    this.appendChildPrimitive(node,el.layer);
    this.appendNodesToElement(el,'ellipse'); 
    
    this.updateCircle(el);
};

/**
 * Updates visual appearance of a given circle on the board.
 * @param {JXG.Circle} el Reference to a circle object, that has to be updated.
 * @see JXG.Circle
 * @see #drawCircle
 */
JXG.AbstractRenderer.prototype.updateCircle = function(el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
            this.setDashStyle(el,el.visProp);
            this.setShadow(el);
        } else {
            this.setDraft(el);
        }
    }
    // Radius umrechnen:
    var radius = el.Radius();
    if (radius>0.0 && !isNaN(el.midpoint.coords.scrCoords[1]+el.midpoint.coords.scrCoords[2]) ) {
        this.updateEllipsePrimitive(el.rendNode,el.midpoint.coords.scrCoords[1],el.midpoint.coords.scrCoords[2],
            (radius * el.board.stretchX),(radius * el.board.stretchY));
    }
};
    

/* ************************** 
 *   Polygon related stuff
 * **************************/

/**
 * Draws a polygon on the canvas.
 * @param el Reference to a Polygon object, that is to be drawn.
 * @see JXG.Polygon
 * @see #updatePolygon
 */
JXG.AbstractRenderer.prototype.drawPolygon = function(/** JXG.Polygon */ el) { 
    var node = this.createPrimitive('polygon',el.id);
    el.visProp['fillOpacity'] = 0.3;
    //el.visProp['strokeColor'] = 'none';
    //this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
    this.appendChildPrimitive(node,el.layer);
    this.appendNodesToElement(el,'polygon');
    this.updatePolygon(el);
};
    
/**
 * Updates properties of a polygon's rendering node.
 * @param {} el Reference to a polygon object, that has to be updated.
 * @see JXG.Polygon
 * @see #drawPolygon
 */
JXG.AbstractRenderer.prototype.updatePolygon = function(/** JXG.Polygon */ el) { 
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
            this.setShadow(el); 
        } else {
            this.setDraft(el);
        }
    }

    this.updatePolygonePrimitive(el.rendNode,el);
};


/* ************************** 
 *    Arc related stuff
 * **************************/

/**
 * Draws an arc on the canvas; This method is a stub and has to be implemented by the special renderers.
 * @param arc Reference to an arc object, that has to be drawn.
 * @see JXG.Arc
 * @see #updateArc
 */
JXG.AbstractRenderer.prototype.drawArc = function(/** JXG.Arc */ arc) { };

/**
 * Updates properties of an arc; This method is a stub and has to be implemented by the special renderers.
 * @param arc Reference to an arc object, that has to be updated.
 * @see JXG.Arc
 * @see #drawArc
 */
JXG.AbstractRenderer.prototype.updateArc = function(/** JXG.Arc */ el) { };


/* ************************** 
 *    Text related stuff
 * **************************/

/**
 * Puts a text node onto the board.
 * @param text Reference to an text object, that has to be drawn
 * @see JXG.Text
 * @see #updateText
 * @see #updateTextStyle
 */
JXG.AbstractRenderer.prototype.drawText = function(/** JXG.Text */ el) { 
    var node;
    if (el.display=='html') {
        node = this.container.ownerDocument.createElement('div');
        node.style.position = 'absolute';
        node.style.fontSize = el.board.fontSize + 'px';  
        node.style.color = el.visProp['strokeColor'];
        node.className = 'JXGtext';
        node.style.zIndex = '10';      
        this.container.appendChild(node);
        node.setAttribute('id', el.id);
    } else {
        node = this.drawInternalText(el);
    }
    el.rendNode = node;
    el.htmlStr = '';
    this.updateText(el);
};

JXG.AbstractRenderer.prototype.drawInternalText = function(el) {};


/**
 * Updates GeometryElement properties of an already existing text element.
 * @param el Reference to an text object, that has to be updated.
 * @see JXG.Text
 * @see #drawText
 * @see #updateTextStyle
 */
JXG.AbstractRenderer.prototype.updateText = function(/** JXG.Text */ el) { 
    // Update onky objects that are visible.
    if (el.visProp['visible'] == false) return;
    if (isNaN(el.coords.scrCoords[1]+el.coords.scrCoords[2])) return;
    this.updateTextStyle(el);
    if (el.display=='html') {
        el.rendNode.style.left = (el.coords.scrCoords[1])+'px'; 
        el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px'; 
        el.updateText();
        if (el.htmlStr!= el.plaintextStr) {
            el.rendNode.innerHTML = el.plaintextStr;
            if (el.board.options.text.useASCIIMathML) {
                AMprocessNode(el.rendNode,false);
            }
            el.htmlStr = el.plaintextStr;
        }
    } else {
        this.updateInternalText(el);
    }
};

JXG.AbstractRenderer.prototype.updateInternalText = function(el) {};

/**
 * Updates CSS style properties of a text node.
 * @param el Reference to the text object, that has to be updated.
 * @see JXG.Text
 * @see #drawText
 * @see #updateText
 */
JXG.AbstractRenderer.prototype.updateTextStyle = function(/** JXG.Text */ el) { 
    var fs;
    if (el.visProp['fontSize']) {
        if (typeof el.visProp['fontSize'] == 'function') {
            fs = el.visProp['fontSize']();
            el.rendNode.style.fontSize = (fs>0?fs:0); 
        } else {
            el.rendNode.style.fontSize = (el.visProp['fontSize']); 
        }
    }
};


/* ************************** 
 *    Angle related stuff
 * **************************/

/**
 * Draft method for special renderers to draw an angle.
 * @param angle Reference to an angle object, that has to be drawn.
 * @see JXG.Angle
 * @see #updateAngle
 */
JXG.AbstractRenderer.prototype.drawAngle = function(/** JXG.Angle */ angle) { };

/**
 * Update method draft for updating the properties of an angle.
 * @param angle Reference to an angle object.
 * @see JXG.Angle
 * @see #drawAngle
 */
JXG.AbstractRenderer.prototype.updateAngle = function(/** JXG.Angle */ angle) { };


/* ************************** 
 *    Image related stuff
 * **************************/

/**
 * Draws an image on the canvas; This is just a template, has to be implemented by special renderers.
 * @param image Reference to an image object, that has to be drawn.
 * @see JXG.Image
 * @see #updateImage
 */
JXG.AbstractRenderer.prototype.drawImage = function(/** JXG.Image */ image) { };

/**
 * Updates the properties of an Image element.
 * @param el Reference to an image object, that has to be updated.
 * @see JXG.Image
 * @see #drawImage
 */
JXG.AbstractRenderer.prototype.updateImage = function(/** JXG.Image */ el) { 
    this.updateRectPrimitive(el.rendNode,el.coords.scrCoords[1],el.coords.scrCoords[2]-el.size[1],
        el.size[0],el.size[1]);
        
    if (el.parent != null) {
        this.transformImageParent(el,el.parent.imageTransformMatrix);
    } else {
        this.transformImageParent(el); // Transforms are cleared
    }
    this.transformImage(el,el.transformations);    
};


/* ************************** 
 *    Grid stuff
 * **************************/

/**
 * Creates a grid on the board, i.e. light helper lines to support the user on creating and manipulating a construction.
 * @param board Board on which the grid is drawn.
 * @see #removeGrid
 */
JXG.AbstractRenderer.prototype.drawGrid = function(/** JXG.Board */ board) { 
    var gridX = board.gridX,
        gridY = board.gridY,
        k = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0], board),
        k2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board),
        tmp = Math.ceil(k.usrCoords[1]),
        j = 0,
        i, j2, l, l2,
        gx, gy, topLeft, bottomRight, node2,
        el, eltmp;
        
    board.hasGrid = true;

    for(i = 0; i <= gridX+1; i++) {
        if(tmp-i/gridX < k.usrCoords[1]) {
            j = i-1;
            break;
        }
    }

    tmp = Math.floor(k2.usrCoords[1]);
    j2 = 0;
    for(i = 0; i <= gridX+1; i++) {
        if(tmp+i/gridX > k2.usrCoords[1]) {
            j2 = i-1;
            break;
        }
    } 

    tmp = Math.ceil(k2.usrCoords[2]);
    l2 = 0;
    for(i = 0; i <= gridY+1; i++) {
        if(tmp-i/gridY < k2.usrCoords[2]) {
            l2 = i-1;
            break;
        }
    }

    tmp = Math.floor(k.usrCoords[2]);
    l = 0;
    for(i = 0; i <= gridY+1; i++) {
        if(tmp+i/gridY > k.usrCoords[2]) {
            l = i-1;
            break;
        }
    }

    gx = Math.round((1.0/gridX)*board.stretchX);
    gy = Math.round((1.0/gridY)*board.stretchY);

    topLeft = new JXG.Coords(JXG.COORDS_BY_USER, 
                             [Math.ceil(k.usrCoords[1])-j/gridX, Math.floor(k.usrCoords[2])+l/gridY],
                             board);
    bottomRight = new JXG.Coords(JXG.COORDS_BY_USER,
                                 [Math.floor(k2.usrCoords[1])+j2/gridX, Math.ceil(k2.usrCoords[2])-l2/gridY],
                                 board);
                                     
    node2 = this.drawVerticalGrid(topLeft, bottomRight, gx, board);
    this.appendChildPrimitive(node2, board.options.layer['grid']);
    if(!board.snapToGrid) {
        el = new Object();
        el.rendNode = node2;
        el.elementClass = JXG.OBJECT_CLASS_LINE;
        el.id = "gridx";
        JXG.clearVisPropOld(el);
        this.setObjectStrokeColor(el, board.gridColor, board.gridOpacity);
    }
    else {
        el = new Object();
        el.rendNode = node2;
        el.elementClass = JXG.OBJECT_CLASS_LINE;
        el.id = "gridx";        
        JXG.clearVisPropOld(el);
        this.setObjectStrokeColor(el, '#FF8080', 0.5); //board.gridOpacity);    
    }
    this.setPropertyPrimitive(node2,'stroke-width', '0.4px');  
    if(board.gridDash) {
        this.setGridDash("gridx"); 
    }

    node2 = this.drawHorizontalGrid(topLeft, bottomRight, gy, board);
    this.appendChildPrimitive(node2, board.options.layer['grid']); // Attention layer=1
    if(!board.snapToGrid) {
        el = new Object();
        el.rendNode = node2;
        el.elementClass = JXG.OBJECT_CLASS_LINE;
        el.id = "gridy";   
        JXG.clearVisPropOld(el);
        this.setObjectStrokeColor(el, board.gridColor, board.gridOpacity);
    }
    else {
        el = new Object();
        el.rendNode = node2;
        el.elementClass = JXG.OBJECT_CLASS_LINE;
        el.id = "gridy";        
        JXG.clearVisPropOld(el);
        this.setObjectStrokeColor(el, '#FF8080', 0.5); //board.gridOpacity);    
    }
    this.setPropertyPrimitive(node2,'stroke-width', '0.4px');  
    if(board.gridDash) {
        this.setGridDash("gridy"); 
    }
   
};

/**
 * Remove the grid from the given board; This is a template that has to be implemented by the renderer itself.
 * @param board Board from which the grid is removed.
 * @see #drawGrid
 */
JXG.AbstractRenderer.prototype.removeGrid = function(/** JXG.Board */ board) {
    var c = document.getElementById('gridx');
    this.remove(c);

    c = document.getElementById('gridy');
    this.remove(c);

    board.hasGrid = false;
/*
    var c = this.layer[board.options.layer['grid']];
    board.hasGrid = false;
    while (c.childNodes.length>0) {
        c.removeChild(c.firstChild);
    }
 */
};
 


/* ************************** 
 *  general element helpers
 * **************************/

/**
 * Hides an element on the canvas; Only a stub, requires implementation in the derived renderer.
 * @param obj Reference to the geometry element that has to disappear.
 * @see #show
 */
JXG.AbstractRenderer.prototype.hide = function(/** JXG.GeometryElement */ obj) { };

/**
 * Shows a hidden element on the canvas; Only a stub, requires implementation in the derived renderer.
 * @param obj Reference to the object that has to appear.
 * @see #hide
 */
JXG.AbstractRenderer.prototype.show = function(/** JXG.GeometryElement */ obj) { };

/**
 * Sets an element's stroke width.
 * @param el Reference to the geometry element.
 * @param width The new stroke width to be assigned to the element.
 */
JXG.AbstractRenderer.prototype.setObjectStrokeWidth = function(/** JXG.GeometryElement */ el, /** number */ width) { };

/**
 * Changes an objects stroke color to the given color.
 * @param obj Reference of the {@link JXG.GeometryElement} that gets a new stroke color.
 * @param color Color in a HTML/CSS compatible format, e.g. <strong>#00ff00</strong> or <strong>green</strong> for green.
 * @param opacity Opacity of the fill color. Must be between 0 and 1.
 */
JXG.AbstractRenderer.prototype.setObjectStrokeColor = function(/** JXG.GeometryElement */ obj, /** string */ color, /** number */ opacity) { };

/**
 * Sets an objects fill color.
 * @param obj Reference of the object that wants a new fill color.
 * @param color Color in a HTML/CSS compatible format. If you don't want any fill color at all, choose 'none'.
 * @param opacity Opacity of the fill color. Must be between 0 and 1.
 */
JXG.AbstractRenderer.prototype.setObjectFillColor = function(/** JXG.GeometryElement */ obj, /** string */ color, /** number */ opacity) { };

/**
 * Puts an object into draft mode, i.e. it's visual appearance will be changed. For GEONE<sub>x</sub>T backwards compatibility. 
 * @param obj Reference of the object that shall be in draft mode.
 */
JXG.AbstractRenderer.prototype.setDraft = function (/** JXG.GeometryElement */ obj) {
    if (!obj.visProp['draft']) {
        return;
    }
    var draftColor = obj.board.options.elements.draft.color,
        draftOpacity = obj.board.options.elements.draft.opacity;
        
    if(obj.type == JXG.OBJECTT_TYPE_POLYGON) {
        this.setObjectFillColor(obj, draftColor, draftOpacity);
    }     
    else {
        if(obj.elementClass == JXG.OBJECT_CLASS_POINT) {
            this.setObjectFillColor(obj, draftColor, draftOpacity); 
        }
        else {
            this.setObjectFillColor(obj, 'none', 0); 
        }
        this.setObjectStrokeColor(obj, draftColor, draftOpacity);    
        this.setObjectStrokeWidth(obj, obj.board.options.elements.draft.strokeWidth);
    }      
};

/**
 * Puts an object from draft mode back into normal mode.
 * @param obj Reference of the object that shall no longer be in draft mode.
 */
JXG.AbstractRenderer.prototype.removeDraft = function (/** JXG.GeometryElement */ obj) {
    if(obj.type == JXG.OBJECT_TYPE_POLYGON) {
        this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillColorOpacity']);
    }     
    else {
        if(obj.type == JXG.OBJECT_CLASS_POINT) {
            this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillColorOpacity']);
        }
        this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeColorOpacity']);        
        this.setObjectStrokeWidth(obj, obj.visProp['strokeWidth']);
    }      
};

/**
 * Highlights an object,
 * i.e. uses the respective highlighting properties of an object.
 * @param obj Reference of the object that will be highlighted.
 */
JXG.AbstractRenderer.prototype.highlight = function(/** JXG.GeometryElement */ obj) {
    var i;
    if(obj.visProp['draft'] == false) {
        if(obj.type == JXG.OBJECT_CLASS_POINT) {
            this.setObjectStrokeColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
            this.setObjectFillColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
        }
        else if(obj.type == JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, obj.visProp['highlightFillColor'], obj.visProp['highlightFillOpacity']);
            for(i=0; i<obj.borders.length; i++) {
                this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
            }
        }    
        else {
            this.setObjectStrokeColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
            this.setObjectFillColor(obj, obj.visProp['highlightFillColor'], obj.visProp['highlightFillOpacity']);    
        }
    }
};

/**
 * Uses the "normal" colors of an object,
 * i.e. the contrasting function to {@link #highlight}.
 * @param obj Reference of the object that will get its normal colors.
 */
JXG.AbstractRenderer.prototype.noHighlight = function(/** JXG.GeometryElement */ obj) {
    var i;
    if(obj.visProp['draft'] == false) {
        if(obj.type == JXG.OBJECT_CLASS_POINT) {
            this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
            this.setObjectFillColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
        }
        else if(obj.type == JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillOpacity']);
            for(i=0; i<obj.borders.length; i++) {
                this.setObjectStrokeColor(obj.borders[i], obj.borders[i].visProp['strokeColor'], obj.visProp['strokeOpacity']);
            }
        }    
        else {
            this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);
            this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillOpacity']); 
        }
    }
};

/**
 * Removes an HTML-Element from Canvas. Just a stub.
 * @param node The HTMLElement that shall be removed.
 */
JXG.AbstractRenderer.prototype.remove = function(/** HTMLElement */ node) { };


/* ************************** 
 * general renderer related methods
 * **************************/

/**
 * Stop redraw. This method is called before every update, so a non-vector-graphics based renderer
 * can delete the contents of the drawing panel.
 * @see #unsuspendRedraw
 */
JXG.AbstractRenderer.prototype.suspendRedraw = function() { };

/**
 * Restart redraw. This method is called after updating all the rendering node attributes.
 * @see #suspendRedraw
 */
JXG.AbstractRenderer.prototype.unsuspendRedraw = function() { };

/**
 * The tiny zoom bar shown on the bottom of a board (if {@link JXG.Board#showNavigation} is true).
 * @see #updateText
 */
JXG.AbstractRenderer.prototype.drawZoomBar = function(board) { 
    var doc,
        node,
        node_minus,
        node_100,
        node_plus,
        node_larr,
        node_uarr,
        node_darr,
        node_rarr;

    doc = this.container.ownerDocument;
    node = doc.createElement('div');
    
    //node.setAttribute('id', el.id);
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
    //node.style.top = (board.canvasHeight-22) + 'px';
    
    node_minus = doc.createElement('span');
    node.appendChild(node_minus);
    node_minus.innerHTML = '&nbsp;&ndash;&nbsp;';
    JXG.addEvent(node_minus, 'click', board.zoomOut, board);

    node_100 = doc.createElement('span');
    node.appendChild(node_100);
    node_100.innerHTML = '&nbsp;o&nbsp;';
    JXG.addEvent(node_100, 'click', board.zoom100, board);
    
    node_plus = doc.createElement('span');
    node.appendChild(node_plus);
    node_plus.innerHTML = '&nbsp;+&nbsp;';
    JXG.addEvent(node_plus, 'click', board.zoomIn, board);
    
    node_larr = doc.createElement('span');
    node.appendChild(node_larr);
    node_larr.innerHTML = '&nbsp;&larr;&nbsp;';
    JXG.addEvent(node_larr, 'click', board.clickLeftArrow, board);
    
    node_uarr = doc.createElement('span');
    node.appendChild(node_uarr);
    node_uarr.innerHTML = '&nbsp;&uarr;&nbsp;';
    JXG.addEvent(node_uarr, 'click', board.clickUpArrow, board);
    
    node_darr = doc.createElement('span');
    node.appendChild(node_darr);
    node_darr.innerHTML = '&nbsp;&darr;&nbsp;';
    JXG.addEvent(node_darr, 'click', board.clickDownArrow, board);
    
    node_rarr = doc.createElement('span');
    node.appendChild(node_rarr);
    node_rarr.innerHTML = '&nbsp;&rarr;&nbsp;';
    JXG.addEvent(node_rarr, 'click', board.clickRightArrow, board);

};

/**
 * Wrapper for getElementById for maybe other renderers which elements are not directly accessible by DOM methods like document.getElementById().
 * @param id Unique identifier for element.
 * @return Reference to an JavaScript object. In case of SVG/VMLRenderer it's a reference to an SVG/VML node.
 */
JXG.AbstractRenderer.prototype.getElementById = function(/** string */ id) /** object */ {
    return document.getElementById(id);
};

/**
 * findSplit() is a subroutine for {@link #RamenDouglasPeuker}.
 * It searches for the point between index i and j which 
 * has the largest distance from the line petween poin_i and point_j.
 **/
JXG.AbstractRenderer.prototype.findSplit = function(pts, i, j) {
    var dist = 0, 
        f = i, 
        d, k, ci, cj, ck,
        x0, y0, x1, y1,
        den, lbda;
        
    if (j-i<2) return [-1.0,0];
    
    ci = pts[i].scrCoords;
    cj = pts[j].scrCoords;
    if (isNaN(ci[1]+ci[2]+cj[1]+cj[2])) return [NaN,j];
    
    for (k=i+1; k<j; k++) {
        ck = pts[k].scrCoords;
        x0 = ck[1]-ci[1];
        y0 = ck[2]-ci[2];
        x1 = cj[1]-ci[1];
        y1 = cj[2]-ci[2];
        den = x1*x1+y1*y1;
        if (den>=JXG.Math.eps) {
            lbda = (x0*x1+y0*y1)/den;
            d = x0*x0+y0*y0 - lbda*(x0*x1+y0*y1);
        } else {
            lbda = 0.0;
            d = x0*x0+y0*y0;
        }
        if (lbda<0.0) {
            d = x0*x0+y0*y0;
        } else if (lbda>1.0) {
            x0 = ck[1]-cj[1];
            y0 = ck[2]-cj[2];
            d = x0*x0+y0*y0;
        }
        if (d>dist) {
            dist = d;
            f = k;
        }
    }
    return [Math.sqrt(dist),f];
};

/**
 * RDB() is a subroutine for {@link #RamenDouglasPeuker}.
 * It runs recursively through the point set and searches the
 * point which has the largest distance from the line between the first point and
 * the last point. If the distance from the line is greater than eps, this point is 
 * included in our new point set otherwise it is discarded.
 * If it is taken, we recursively apply the subroutine to the point set before
 * and after the chosen point.
 */
JXG.AbstractRenderer.prototype.RDP = function(pts,i,j,eps,newPts) {
    var result = this.findSplit(pts,i,j);
    if (result[0]>eps) {
        this.RDP(pts, i,result[1], eps,newPts);
        this.RDP(pts, result[1],j, eps,newPts);
    } else {
        newPts.push(pts[j]);
    }
};

/**
  * Ramen-Douglas-Peuker algorithm.
  * It discards points which are not necessary from the polygonal line defined by the point array
  * pts. The computation is done in screen coordinates.
  * Average runtime is O(nlog(n)), worst case runtime is O(n^2), where n is the number of points.
  */
JXG.AbstractRenderer.prototype.RamenDouglasPeuker = function(pts,eps) {
    var newPts = [], i, k, len;
    //return pts;

    len = pts.length;
    
    // Search for the left most point woithout NaN coordinates
    i = 0;
    while (i<len && isNaN(pts[i].scrCoords[1]+pts[i].scrCoords[2])) {i++;}
    // Search for the right most point woithout NaN coordinates
    k = len - 1;
    while (k>i && isNaN(pts[k].scrCoords[1]+pts[k].scrCoords[2])) {k--;}

    // Exit if nothing is left
    if (i>k || i==len) { return []; }
    
    newPts[0] = pts[i];
    this.RDP(pts,i,k,eps,newPts);
    //this.RDP(pts,0,pts.length-1,eps,newPts);
    //$('debug').innerHTML = newPts.length;
    return newPts;
};

/**
 * Sets the shadow properties to a geometry element.
 * @param {JXG.GeometyElement} element Reference to a geometry object, that should get a shadow
 */
JXG.AbstractRenderer.prototype.setShadow = function(element) {
};


JXG.AbstractRenderer.prototype.updatePathStringPoint = function(el, size, type) {
};

JXG.AbstractRenderer.prototype.eval = function(val) {
    if (typeof val=='function') {
        return val();
    } else {
        return val;
    }
};


