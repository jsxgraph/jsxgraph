/* 
    Copyright 2008, 
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
 * @fileoverview In this file the AbstractRenderer is defined, a base class for all
 * renderers. All members a renderer has to provide are defined here.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new AbstractRenderer object.
 * @class This is the basic Renderer class.  
 * It can be considered an abstract class, even though no such thing
 * really exists in JavaScript, all members a renderer has to provide
 * are defined here.
 * If {enhancedRendering} is set to true, the visual properties of
 * the elements are updated during each update call.
 * @constructor
 */
JXG.AbstractRenderer = function() {
    this.vOffsetText = 8;
    this.enhancedRendering = true;
};

/**
 * Draws a point on the canvas.
 * @param {JXG.Point} el Reference to a point object, that has to be drawn.
 * @see JXG.Point
 * @see #updatePoint
 */
JXG.AbstractRenderer.prototype.drawPoint = function(el) { 
    var node;
    var node2;
    
    var size = this.getPointSize(el.visProp['style']);
    if(el.visProp['style'] == 0 || el.visProp['style'] == 1 || el.visProp['style'] == 2) { // x
        node = this.createPrimitive('line',el.id+'_x1');
        this.setStrokeProp(node,el.visProp);
        node2 = this.createPrimitive('line',el.id+'_x2');
        this.setStrokeProp(node2,el.visProp);
        this.appendChildPrimitive(node,'points');
        this.appendChildPrimitive(node2,'points');
        el.rendNodeX1 = node;
        el.rendNodeX2 = node2;
    }
    else if(el.visProp['style'] == 3 || el.visProp['style'] == 4 || el.visProp['style'] == 5 || el.visProp['style'] == 6) { // circle
        node = this.createPrimitive('circle',el.id);
        this.setStrokeProp(node,el.visProp);
        this.setFillProp(node,el.visProp);
        this.appendChildPrimitive(node,'points');
        el.rendNode = node;
    }
    else if(el.visProp['style'] == 7 || el.visProp['style'] == 8 || el.visProp['style'] == 9) { // rectangle
        node = this.createPrimitive('rect',el.id);
        this.setStrokeProp(node,el.visProp);
        this.setFillProp(node,el.visProp);
        this.appendChildPrimitive(node,'points');
        el.rendNode = node;
    }
    else if(el.visProp['style'] == 10 || el.visProp['style'] == 11 || el.visProp['style'] == 12) { // +
        node = this.createPrimitive('line',el.id+'_x1');
        this.setStrokeProp(node,el.visProp);
        node2 = this.createPrimitive('line',el.id+'_x2');
        this.setStrokeProp(node2,el.visProp);
        this.appendChildPrimitive(node,'points');
        this.appendChildPrimitive(node2,'points');
        el.rendNodeX1 = node;
        el.rendNodeX2 = node2;
    }
    this.setDraft(el);
    this.updatePoint(el);
};
   
/**
 * Updates color, position etc. of a point that already exists on the canvas.
 * @param {JXG.Point} el Reference to a point object, that has to be updated.
 * @see JXG.Point
 * @see #drawPoint
 */
JXG.AbstractRenderer.prototype.updatePoint = function(el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
        } else {
            this.setDraft(el);
        }
    }

    var size = this.getPointSize(el.visProp['style']);
    if(el.visProp['style'] == 0 || el.visProp['style'] == 1 || el.visProp['style'] == 2) { // x
        this.updateLinePrimitive(el.rendNodeX1,
            el.coords.scrCoords[1]-size,el.coords.scrCoords[2]-size,
            el.coords.scrCoords[1]+size,el.coords.scrCoords[2]+size);
        this.updateLinePrimitive(el.rendNodeX2,
            el.coords.scrCoords[1]+size,el.coords.scrCoords[2]-size,
            el.coords.scrCoords[1]-size,el.coords.scrCoords[2]+size);
    }
    else if(el.visProp['style'] == 3 || el.visProp['style'] == 4 || el.visProp['style'] == 5 || el.visProp['style'] == 6) { // circle
        this.updateCirclePrimitive(el.rendNode,el.coords.scrCoords[1],el.coords.scrCoords[2],size+1);            
    }
    else if(el.visProp['style'] == 7 || el.visProp['style'] == 8 || el.visProp['style'] == 9) { // rectangle
        this.updateRectPrimitive(el.rendNode,
                el.coords.scrCoords[1]-size, el.coords.scrCoords[2]-size, size*2, size*2);
    }
    else if(el.visProp['style'] == 10 || el.visProp['style'] == 11 || el.visProp['style'] == 12) { // +
        this.updateLinePrimitive(el.rendNodeX1,
            el.coords.scrCoords[1]-size,el.coords.scrCoords[2],
            el.coords.scrCoords[1]+size,el.coords.scrCoords[2]);
        this.updateLinePrimitive(el.rendNodeX2,
            el.coords.scrCoords[1],el.coords.scrCoords[2]-size,
            el.coords.scrCoords[1],el.coords.scrCoords[2]+size);
    }
};

/**
 * Changes the style of a point that already exists on the canvas.
 * @param {JXG.Point} el Reference to a point object, that has to be updated.
 * @see JXG.Point
 * @see #drawPoint
 */
JXG.AbstractRenderer.prototype.changePointStyle = function(el) {
    var node = $(el.id);
    if(node != null) {
        this.remove(node);
    }
    else {
        this.remove($(el.id+'_x1'));
        this.remove($(el.id+'_x2'));
    }
    this.drawPoint(el);
    if(!el.visProp['visible']) {
        this.hide(el);
    }
    if(el.visProp['draft']) {
        this.setDraft(el);
    }
};

/**
 * Draws a line on the canvas.
 * @param {JXG.Line} el Reference to a line object, that has to be drawn.
 * @see JXG.Line
 * @see #updateLine
 * @see #calcStraight
 */
JXG.AbstractRenderer.prototype.drawLine = function(el) { 
    var node = this.createPrimitive('line',el.id);
    this.appendChildPrimitive(node,'lines');
    el.rendNode = node;
    //this.setStrokeProp(el.rendNode,el.visProp);
    this.setDashStyle(el.rendNode,el.visProp);
    //this.setDraft(el);
    this.updateLine(el);
};
   
/**
 * Updates color, position etc. of a line that already exists on the canvas.
 * @param {JXG.Line} el Reference to a line object, that has to be updated.
 * @see JXG.Line
 * @see #drawLine
 * @see #calcStraight
 */
JXG.AbstractRenderer.prototype.updateLine = function(el) {
    //var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, [el.point1.coords.usrCoords[1], el.point1.coords.usrCoords[2]], el.board);
    //var screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, [el.point2.coords.usrCoords[1], el.point2.coords.usrCoords[2]], el.board);
    var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board);
    var screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board);
    if(el.visProp['straightFirst'] || el.visProp['straightLast']) {
       this.calcStraight(el,screenCoords1,screenCoords2); 
    } 
    this.updateLinePrimitive(el.rendNode,screenCoords1.scrCoords[1],screenCoords1.scrCoords[2],
            screenCoords2.scrCoords[1],screenCoords2.scrCoords[2]);

    // Update the image which is connected to the line:
    if (el.image!=null) {
        var ax = screenCoords1.scrCoords[1];
        var ay = screenCoords1.scrCoords[2];
        var bx = screenCoords2.scrCoords[1];
        var by = screenCoords2.scrCoords[2];
        var beta;
        var sgn = (bx-ax>0)?1:-1;
        if (Math.abs(bx-ax)>0.0000001) {
            beta = Math.atan((by-ay)/(bx-ax))+ ((sgn<0)?Math.PI:0);  
        } else {
            beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
        }
        var x = 250; //ax;
        var y = 256; //ay;//+el.image.size[1]*0.5;
        var m = [
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
        } else {
            this.setDraft(el);
        }
    }    
}

/**
 * Draws a graph on the canvas.
 * @param {JXG.Curve} el Reference to a graph object, that has to be plotted.
 * @see JXG.Curve
 * @see #updateCurve
 */
JXG.AbstractRenderer.prototype.drawCurve = function(el) { 
    var node = this.createPrimitive('path',el.id);
    //node.setAttributeNS(null, 'stroke-linejoin', 'round');
    this.appendChildPrimitive(node,'curves');
    el.rendNode = node;
    this.setStrokeProp(el.rendNode,el.visProp);
    this.setFillProp(el.rendNode,el.visProp);
    this.setDashStyle(el.rendNode,el.visProp);
    this.updateCurve(el);
};

/**
 * Updates properties of a graph that already exists on the canvas.
 * @param {JXG.Curve} el Reference to a graph object, that has to be updated.
 * @see JXG.Curve
 * @see #drawCurve
 */
JXG.AbstractRenderer.prototype.updateCurve = function(el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
        } else {
            this.setDraft(el);
        }
    }
    this.updatePathPrimitive2(el,this.updatePathStringPrimitive(el));
};

/**
 * Calculates start and end point for a line.
 * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
 * @param {JXG.Coords} screenCoords1 Coordinates of the point where line drawing begins.
 * @param {JXG.Coords} screenCoords2 Coordinates of the point where line drawing ends.
 * @see JXG.Line
 * @see #drawLine
 * @see #updateLine
 */
JXG.AbstractRenderer.prototype.calcStraightv1 = function(el, screenCoords1, screenCoords2) {
    var slope = el.getSlope();
    var rise = el.getRise();
    
    if(slope== "INF") { // senkrechte Gerade
        // Schnittpunkte mit dem Begrenzungsrahmen

        var x1 = screenCoords1.scrCoords[1];
        var y1 = screenCoords1.scrCoords[2];
        var x2 = screenCoords2.scrCoords[1];
        var y2 = screenCoords2.scrCoords[2];
        if(screenCoords1.scrCoords[2] < screenCoords2.scrCoords[2]) {
            if(el.visProp['straightFirst']) {
                //x1 = screenCoords1.scrCoords[1];
                y1 = 0;
            }               
            if(el.visProp['straightLast']) {
                //x2 = screenCoords1.scrCoords[1];
                y2 = el.board.canvasHeight;
            }
        } else {
            if(el.visProp['straightFirst']) {
                //x2 = screenCoords1.scrCoords[1];
                y1 = el.board.canvasHeight;
            } 
            if(el.visProp['straightLast']) {
                //x1 = screenCoords1.scrCoords[1];
                y2 = 0;
            }
        }
        
        screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, [x1, y1], this);
        screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, [x2, y2], this);
        
        return;
    } // sonst:
   
    // Schnittpunkte mit dem Begrenzungsrahmen
    var coordsLeft = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, rise], el.board);
    var coordsRight = new JXG.Coords(JXG.COORDS_BY_SCREEN, [el.board.canvasWidth, slope*el.board.canvasWidth + rise], el.board);
    var coordsTop = new JXG.Coords(JXG.COORDS_BY_SCREEN, [Math.round(-rise/slope), 0], el.board);
    var coordsBottom = new JXG.Coords(JXG.COORDS_BY_SCREEN, [Math.round((el.board.canvasHeight-rise)/slope), el.board.canvasHeight], el.board);

    if(coordsLeft.scrCoords[2] < 0) { 
        // Punkt am oberen Rand verwenden
        var distP1Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
        var distP2Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords2);
        if((distP1Top < distP2Top) && el.visProp['straightFirst']) {
            screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
        } else if((distP1Top > distP2Top) && el.visProp['straightLast']) {
            screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
        }
  
        if(coordsRight.scrCoords[2] > el.board.canvasHeight) { 
            // Punkt am unteren Rand verwenden
            var distP1Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords2);             
            if((distP1Bottom < distP2Bottom) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
            } else if((distP1Bottom > distP2Bottom) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
            }
     
        } else {
            // Punkt am rechten Rand verwenden
            var distP1Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords2);             
            if((distP1Right < distP2Right) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            } else if((distP1Right > distP2Right) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            }
        }
    } else if(coordsLeft.scrCoords[2] > el.board.canvasHeight) { 
        // Punkt am unteren Rand verwenden
        var distP1Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
        var distP2Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords2);   
        if((distP1Bottom < distP2Bottom) && el.visProp['straightFirst']) {
            screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
        } else if((distP1Bottom > distP2Bottom) && el.visProp['straightLast']) {
            screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
        }
 
        if(coordsRight.scrCoords[2] < 0) { 
            // Punkt am oberen Rand verwenden
            var distP1Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords2);
            if((distP1Top < distP2Top) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
            } else if((distP1Top > distP2Top) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
            }
        } else {
            // Punkt am rechten Rand verwenden
            var distP1Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords2);             
            if((distP1Right < distP2Right) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            } else if((distP1Right > distP2Right) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            }
        }          
    } else {
        // Punkt am linken Rand verwenden
        var distP1Left = coordsLeft.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
        var distP2Left = coordsLeft.distance(JXG.COORDS_BY_SCREEN, screenCoords2);
        if((distP1Left < distP2Left) && el.visProp['straightFirst']) {
            screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsLeft.scrCoords.slice(1));
        } else if((distP1Left > distP2Left) && el.visProp['straightLast']) {
            screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsLeft.scrCoords.slice(1));
        }

        if(coordsRight.scrCoords[2] < 0) {
            // Punkt am oberen Rand verwenden
            var distP1Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Top = coordsTop.distance(JXG.COORDS_BY_SCREEN, screenCoords2);
            if((distP1Top < distP2Top) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
            } else if((distP1Top > distP2Top) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsTop.scrCoords.slice(1));
            }
        } else if(coordsRight.scrCoords[2] > el.board.canvasHeight) {
            // Punkt am unteren Rand verwenden
            var distP1Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Bottom = coordsBottom.distance(JXG.COORDS_BY_SCREEN, screenCoords2);
            if((distP1Bottom < distP2Bottom) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
            } else if((distP1Bottom > distP2Bottom) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsBottom.scrCoords.slice(1));
            }
        } else {
            // Punkt am rechten Rand verwenden
            var distP1Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords1);
            var distP2Right = coordsRight.distance(JXG.COORDS_BY_SCREEN, screenCoords2);     
            if((distP1Right < distP2Right) && el.visProp['straightFirst']) {
                screenCoords1.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            } else if((distP1Right > distP2Right) && el.visProp['straightLast']) {
                screenCoords2.setCoordinates(JXG.COORDS_BY_SCREEN, coordsRight.scrCoords.slice(1));
            }
        }
    }
};

/**
 * Calculates start and end point for a line.
 * @param {JXG.Line} el Reference to a line object, that needs calculation of start and end point.
 * @param {JXG.Coords} point1 Coordinates of the point where line drawing begins.
 * @param {JXG.Coords} point2 Coordinates of the point where line drawing ends.
 * @see JXG.Line
 * @see #drawLine
 * @see #updateLine
 */
JXG.AbstractRenderer.prototype.calcStraight = function(el, point1, point2) {
    var b = el.board.algebra;
    var eps = 0.0001;
    
    // Compute the stdform of the line in screen coordinates.
    var c = [];
    c[0] = el.stdform[0] - 
           el.stdform[1]*el.board.origin.scrCoords[1]/(el.board.unitX*el.board.zoomX)+
           el.stdform[2]*el.board.origin.scrCoords[2]/(el.board.unitY*el.board.zoomY);
    c[1] = el.stdform[1]/(el.board.unitX*el.board.zoomX);
    c[2] = el.stdform[2]/(-el.board.unitY*el.board.zoomY);

    /**
      * Intersect the line with the four borders 
      * of the board.
      */
    var s = [];
    s[0] = b.crossProduct(c,[0,0,1]);  // top
    s[1] = b.crossProduct(c,[0,1,0]);  // left
    s[2] = b.crossProduct(c,[-el.board.canvasHeight,0,1]);  // bottom
    s[3] = b.crossProduct(c,[-el.board.canvasWidth,1,0]);   // right

    // Normalize the intersections 
    for (var i=0;i<4;i++) {
        if (Math.abs(s[i][0])>eps) {
            for (var j=2;j>=0;j--) {
                s[i][j] /= s[i][0];
            }
        }
    }
    
    var d1, d2;
    if(s[1][2]<0 || Math.abs(s[1][0])<eps) { // left intersection out of board (above)
        // Punkt am oberen Rand verwenden (Top)
        d1 = b.affineDistance(s[0], point1.scrCoords);
        d2 = b.affineDistance(s[0], point2.scrCoords);
        if((d1 < d2) && el.visProp['straightFirst']) {
            point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
        } else if((d1 > d2) && el.visProp['straightLast']) {
            point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
        }
  
        if(s[3][2] > el.board.canvasHeight || Math.abs(s[3][0])<eps) {  // right intersection out of board
            // Punkt am unteren Rand verwenden (Bottom)
            d1 = b.affineDistance(s[2], point1.scrCoords);
            d2 = b.affineDistance(s[2], point2.scrCoords);             
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
            }
     
        } else {
            // Punkt am rechten Rand verwenden (Right)
            d1 = b.affineDistance(s[3], point1.scrCoords);
            d2 = b.affineDistance(s[3], point2.scrCoords);             
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            }
        }
    } else if(s[1][2] > el.board.canvasHeight) { // left intersection out of board (below)
        // Punkt am unteren Rand verwenden (Bottom)
        d1 = b.affineDistance(s[2], point1.scrCoords);
        d2 = b.affineDistance(s[2], point2.scrCoords);   
        if((d1 < d2) && el.visProp['straightFirst']) {
            point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
        } else if((d1 > d2) && el.visProp['straightLast']) {
            point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
        }
 
        if(s[3][2]<0 || Math.abs(s[3][0])<eps) { 
            // Punkt am oberen Rand verwenden (Top)
            d1 = b.affineDistance(s[0], point1.scrCoords);
            d2 = b.affineDistance(s[0], point2.scrCoords);
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
            }
        } else {
            // Punkt am rechten Rand verwenden (Right)
            d1 = b.affineDistance(s[3], point1.scrCoords);
            d2 = b.affineDistance(s[3], point2.scrCoords);             
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            }
        }          
    } else {
        // Punkt am linken Rand verwenden (Left)
        d1 = b.affineDistance(s[1], point1.scrCoords);
        d2 = b.affineDistance(s[1], point2.scrCoords);
        if((d1 < d2) && el.visProp['straightFirst']) {
            point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[1].slice(1));
        } else if((d1 > d2) && el.visProp['straightLast']) {
            point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[1].slice(1));
        }
        
        if(s[3][2] < 0 || Math.abs(s[3][0])<eps) {
            // Punkt am oberen Rand verwenden (Top)
            d1 = b.affineDistance(s[0], point1.scrCoords);
            d2 = b.affineDistance(s[0], point2.scrCoords);
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[0].slice(1));
            }
        } else if(s[3][2] > el.board.canvasHeight || Math.abs(s[3][0])<eps) {
            // Punkt am unteren Rand verwenden (Bottom)
            d1 = b.affineDistance(s[2], point1.scrCoords);
            d2 = b.affineDistance(s[2], point2.scrCoords);
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[2].slice(1));
            }
        } else {
            // Punkt am rechten Rand verwenden (Right)
            d1 = b.affineDistance(s[3], point1.scrCoords);
            d2 = b.affineDistance(s[3], point2.scrCoords);     
            if((d1 < d2) && el.visProp['straightFirst']) {
                point1.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            } else if((d1 > d2) && el.visProp['straightLast']) {
                point2.setCoordinates(JXG.COORDS_BY_SCREEN, s[3].slice(1));
            }
        }
    }
};

/**
 * Draws a circle on the canvas.
 * @param {JXG.Circle} el Reference to a circle object, that has to be drawn.
 * @see JXG.Circle
 * @see #updateCircle
 */
JXG.AbstractRenderer.prototype.drawCircle = function(el) { 
    var node = this.createPrimitive('ellipse',el.id);
    this.setStrokeProp(node,el.visProp);
    this.setFillProp(node,el.visProp);
    //node.setAttributeNS(null, 'opacity', '1');    
    this.setDashStyle(node,el.visProp);
    this.appendChildPrimitive(node,'circles');
    el.rendNode = node;
    this.setDraft(el);
    this.updateCircle(el);
};
   
/**
 * Updates properties of a circle that already exists on the canvas.
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
        } else {
            this.setDraft(el);
        }
    }
    // Radius umrechnen:
    var radius = el.getRadius();
    this.updateEllipsePrimitive(el.rendNode,el.midpoint.coords.scrCoords[1],el.midpoint.coords.scrCoords[2],
        (radius * el.board.unitX * el.board.zoomX),(radius * el.board.unitY * el.board.zoomY));
}
    
/**
 * Draws a polygon on the canvas.
 * @param {JXG.Polygon} el Reference to a Polygon object, that has to be drawn.
 * @see JXG.Polygon
 * @see #updatePolygon
 */
JXG.AbstractRenderer.prototype.drawPolygon = function(el) { 
    var node = this.createPrimitive('polygon',el.id);
    el.visProp['fillOpacity'] = 0.3;
    //el.visProp['strokeColor'] = 'none';
    this.setFillProp(node,el.visProp);
    //this.setStrokeProp(node,el.visProp);
    this.appendChildPrimitive(node,'polygone');
    el.rendNode = node;
    this.setDraft(el);
    this.updatePolygon(el);
};
    
/**
 * Updates properties of a polygon.
 * @param {JXG.Polygon} el Reference to a polygon object, that has to be updated.
 * @see JXG.Polygon
 * @see #drawPolygon
 */
JXG.AbstractRenderer.prototype.updatePolygon = function(el) { 
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
        } else {
            this.setDraft(el);
        }
    }

    this.updatePolygonePrimitive(el.rendNode,el);
};

/**
 * Draws an arrow on the board.
 * @param {JXG.Arrow} el Reference to an arrow object, that has to be drawn.
 * @see JXG.Arrow
 * @see #updateArrow
 */
JXG.AbstractRenderer.prototype.drawArrow = function(el) {
    var node = this.createPrimitive('line',el.id);
    this.setStrokeProp(node,el.visProp);
    this.setDashStyle(node,el.visProp);
    this.makeArrow(node,el);
    this.appendChildPrimitive(node,'lines');
    el.rendNode = node;
    this.setDraft(el);
    this.updateArrow(el);
};

/**
 * Updates properties of an arrow that already exists on the canvas.
 * @param {JXG.Arrow} el Reference to an arrow object, that has to be updated.
 * @see JXG.Arrow
 * @see #drawArrow
 */
JXG.AbstractRenderer.prototype.updateArrow = function(el) {
    if (this.enhancedRendering) {
        if (!el.visProp['draft']) {
            this.setObjectStrokeWidth(el,el.visProp['strokeWidth']);
            this.setObjectStrokeColor(el,el.visProp['strokeColor'],el.visProp['strokeOpacity']);
            this.setObjectFillColor(el,el.visProp['fillColor'],el.visProp['fillOpacity']);
        } else {
            this.setDraft(el);
        }
    }
    this.updateLinePrimitive(el.rendNode,el.point1.coords.scrCoords[1],el.point1.coords.scrCoords[2],
        el.point2.coords.scrCoords[1],el.point2.coords.scrCoords[2]);
}

/**
 * Draws an axis on the canvas.
 * @param {JXG.Axis} axis Reference to an axis object, that has to be drawn.
 * @see JXG.Axis
 * @see #updateAxis
 * @see #updateAxisTicks
 */
JXG.AbstractRenderer.prototype.drawAxis = function(axis) { };

/**
 * Update properties of an axis that already exists on the canvas.
 * @param {JXG.Axis} axis Reference to an axis object, that has to be updated.
 * @see JXG.Axis
 * @see #drawAxis
 * @see #updateAxisTicks
 */
JXG.AbstractRenderer.prototype.updateAxis = function(axis) { };

/**
 * Update ticks of an axis that.
 * @param {JXG.Axis} axis Reference of an axis object, that has to be updated.
 * @param {int} oldTicksCount Number of ticks that already exists.
 * @see JXG.Axis
 * @see #drawAxis
 * @see #updateAxisTicksInnerLoop
 */
JXG.AbstractRenderer.prototype.updateAxisTicks = function(axis, oldTicksCount) {
    var i;
    if(oldTicksCount == axis.ticks.length) {
        return;
    } else if(oldTicksCount < axis.ticks.length) {
        for (i = oldTicksCount; i<axis.ticks.length; i++) {
            var tick = this.createPrimitive('line',axis.id+'tick'+i);
            this.appendChildPrimitive(tick, 'lines');
            this.setStrokeProp(tick, axis.visProp);
        }   
        this.updateAxisTicksInnerLoop(axis, oldTicksCount);
    } else if(oldTicksCount > axis.ticks.length) {
        for (i = axis.ticks.length; i<oldTicksCount; i++) {
            this.remove($(axis.id+'tick'+i));
        }
    }
}

/**
 * Update the tick's line objects.
 * @param {JXG.Axis} axis Reference of an axis object, that's ticks have to be updated.
 * @param {int} start Number of tick where update process should start
 * @see JXG.Axis
 * @see #drawAxis
 * @see #updateAxisTicks
 */
JXG.AbstractRenderer.prototype.updateAxisTicksInnerLoop = function(axis, start) {
    var eps = 0.00001;
    var slope = -axis.getSlope();
    var dist = 3*axis.r / 2;
    
    var dx, dy;
    
    if(Math.abs(slope) < eps) {
        // if the slope of the line is (almost) 0, we can set dx and dy directly
        dx = 0;
        dy = dist;
    } else if((Math.abs(slope) > 1/eps) || (isNaN(slope))) {
        // if the slope of the line is (theoretically) infinite, we can set dx and dy directly
        dx = dist;
        dy = 0;
    } else {
        // here we have to calculate dx and dy depending on the slope and the length of the tick (dist)
        // if slope is the line's slope, the tick's slope is given by
        // 
        //            1          dy
        //     -   -------  =   ----                 (I)
        //          slope        dx
        //
        // when dist is the length of the tick, using the pythagorean theorem we get
        // 
        //     dx*dx + dy*dy = dist*dist             (II)
        //
        // dissolving (I) by dy and applying that to equation (II) we get the following formulas for dx and dy
        dx = dist/Math.sqrt(1/(slope*slope) + 1);
        dy = -dx/slope;
    }
    
    for (var i=start; i<axis.ticks.length; i++) {
        var c = axis.ticks[i];
        var tick = $(axis.id+'tick'+i);
        var tickLabel = $(axis.id+'tick'+i+'text');

        this.updateLinePrimitive(tick, c.scrCoords[1]+dx, c.scrCoords[2]-dy, c.scrCoords[1]-dx, c.scrCoords[2]+dy);
        this.setStrokeProp(tick, axis.visProp);
    }    
}

/**
 * Removes all ticks from an axis
 * @param {JXG.Axis} axis Reference of an axis object, thats ticks have to be removed.
 * @see JXG.Axis
 * @see #drawAxis
 * @see #updateAxis
 * @see #upateAxisTicksInnerLoop
 */
JXG.AbstractRenderer.prototype.removeAxisTicks = function(axis) {
    for(var i=0; i<axis.ticks.length; i++) {
        var tick = $(axis.id+'tick'+i);
        this.remove(tick);
    }
}

/**
 * Draws an arc on the canvas.
 * @param {JXG.Arc} arc Reference to an arc object, that has to be drawn.
 * @see JXG.Arc
 * @see #updateArc
 */
JXG.AbstractRenderer.prototype.drawArc = function(arc) { };

/**
 * Updates properties of an arc that already exists.
 * @param {JXG.Arc} arc Reference to an arc object, that has to be updated.
 * @see JXG.Arc
 * @see #drawArc
 */
JXG.AbstractRenderer.prototype.updateArc = function(el) { 
    // AW: brutaler fix der update-Methode...
    // BV: falls die update-Methode doch wieder "normal" funktionsfaehig wird, muss noch auf die Start- und Endpfeile geachtet werden 
    //    (derzeit noch nicht beruecksichtigt)
    this.remove(el.rendNode);
    this.remove(el.rendNodeFill);  
    var node = el.rendNodeTriangleStart;
    if(node != null) {
        this.remove(node);
    }
    node = el.rendNodeTriangleEnd;
    if(node != null) {
        this.remove(node);
    }    
    this.drawArc(el);
    this.setDraft(el);
    return;

    //-----------------------------------------------------------
/*
    var radius = el.getRadius();
    
    var angle = el.board.algebra.trueAngle(el.point2, el.midpoint, el.point3);
    var circle = {}; // um projectToCircle benutzen zu koennen...
    circle.midpoint = el.midpoint;
    circle.getRadius = function() {
        return radius;
    }
    var point3 = el.board.algebra.projectPointToCircle(el.point3,circle);

    node = this.container.ownerDocument.createElementNS(this.svgNamespace, 'path');
    var pathString = 'M '+ el.point2.coords.scrCoords[1] +' '+ el.point2.coords.scrCoords[2] +' A '; // Startpunkt
    pathString += Math.round(radius * el.board.unitX * el.board.zoomX) + ' ' + Math.round(radius * el.board.unitY * el.board.zoomY) + ' 0 '; // Radien
    // largeArc
    if(angle >= 180) {
        pathString += '1 ';
    }
    else {
        pathString += '0 ';
    }
    // sweepFlag
    pathString += '0 ';
    pathString += point3.scrCoords[1] + ' ' + point3.scrCoords[2]; // Endpunkt
    node.setAttributeNS(null, 'd', pathString);    
*/
};

/**
 * Draws a label on the canvas.
 * @param {JXG.Label} el Reference to a label object, that has to be drawn.
 * @see JXG.Label
 * @see #updateLabel
 */
JXG.AbstractRenderer.prototype.drawLabel = function(el) { 
    var node = this.container.ownerDocument.createElement('div');
    node.style.position = 'absolute';
    node.style.fontSize = el.board.fontSize + 'px';
    node.style.color = el.color;
    node.className = 'JXGText';
    node.style.zIndex = '10';   
    node.setAttribute('id', el.id);
    node.innerHTML = el.nameHTML;
    this.container.appendChild(node);
    el.rendNode = node;
    this.updateLabel(el);
};
    
/**
 * Updates properties of a label that already exists on the canvas.
 * @param {JXG.Label} el Reference to a label object, that has to be updated.
 * @see JXG.Label
 * @see #drawLabel
 */
JXG.AbstractRenderer.prototype.updateLabel = function(el) { 
    el.rendNode.style.left = (el.coords.scrCoords[1])+'px'; 
    el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px'; 
    //el.rendNode.innerHTML = el.nameHTML;
};
    
/**
 * Draws text on the canvas
 * @param {Text}  text Reference to an text object, that has to be drawn
 * @see Text
 * @see #updateText
 */
JXG.AbstractRenderer.prototype.drawText = function(el) { 
    var node = this.container.ownerDocument.createElement('div');
    node.setAttribute('id', el.id);
    node.style.position = 'absolute';
    node.style.fontSize = el.board.fontSize + 'px';  
    node.style.color = el.visProp['strokeColor'];
    node.className = 'JXGtext';
    node.style.zIndex = '10';      
    this.container.appendChild(node);
    el.rendNode = node;
    this.updateText(el);
};

/**
 * Updates properties of an text that already exists on the canvas.
 * @param {JXG.Text} el Reference to an text object, that has to be updated.
 * @see JXG.Text
 * @see #drawText
 */
JXG.AbstractRenderer.prototype.updateText = function(el) { 
    this.updateTextStyle(el);
    el.rendNode.style.left = (el.coords.scrCoords[1])+'px'; 
    el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px'; 
    el.rendNode.innerHTML = el.plaintextStr;
};

/**
 * Updates CSS properties of an text that already exists on the canvas.
 * @param {JXG.Text} el Reference to the text object, that has to be updated.
 * @see JXG.Text
 * @see #drawText
 */
JXG.AbstractRenderer.prototype.updateTextStyle = function(el) { 
    if (el.visProp['fontSize']) {
        if (typeof el.visProp['fontSize'] == 'function') {
            var fs = el.visProp['fontSize']();
            el.rendNode.style.fontSize = (fs>0?fs:0); 
        } else {
            el.rendNode.style.fontSize = (el.visProp['fontSize']); 
        }
    }
};

/**
 * Draws angle on the canvas.
 * @param {JXG.Angle}  angle Reference to an angle object, that has to be drawn.
 * @see JXG.Angle
 * @see #updateAngle
 */
JXG.AbstractRenderer.prototype.drawAngle = function(angle) { };

/**
 * Update properties of an angle that already exists on the canvas.
 * @param {JXG.Angle} angle Reference to an angle object, that has to be updated.
 * @see JXG.Angle
 * @see #drawAngle
 */
JXG.AbstractRenderer.prototype.updateAngle = function(angle) { };

/**
 * Draws an image on the canvas.
 * @param {JXG.Image} image Reference to an image object, that has to be drawn.
 * @see JXG.Image
 * @see #updateImage
 */
JXG.AbstractRenderer.prototype.drawImage = function(image) { };

/**
 * Updates the properties of an Image element.
 * @param {JXG.Image} el Reference to an image object, that has to be updated.
 * @see JXG.Image
 * @see #drawImage
 */
JXG.AbstractRenderer.prototype.updateImage = function(el) { 
    this.updateRectPrimitive(el.rendNode,el.coords.scrCoords[1],el.coords.scrCoords[2]-el.size[1],
        el.size[0],el.size[1]);
        
    if (el.parent != null) {
        this.transformImageParent(el,el.parent.imageTransformMatrix);
    } else {
        this.transformImageParent(el); // Transforms are cleared
    }
    this.transformImage(el,el.transformations);
};

/**
 * Draws the grid.
 * @see #removeGrid
 * @param {Board} board Board on which the grid is drawn.
 */
JXG.AbstractRenderer.prototype.drawGrid = function(board) { 
    board.hasGrid = true;
    var gridX = board.gridX;
    var gridY = board.gridY;

    var node;

    var k = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0], board);
    var k2 = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);

    var tmp = Math.ceil(k.usrCoords[1]);
    var j = 0;
    for(var i = 0; i <= gridX+1; i++) {
        if(tmp-i/gridX < k.usrCoords[1]) {
            j = i-1;
            break;
        }
    }

    tmp = Math.floor(k2.usrCoords[1]);
    var j2 = 0;
    for(var i = 0; i <= gridX+1; i++) {
        if(tmp+i/gridX > k2.usrCoords[1]) {
            j2 = i-1;
            break;
        }
    } 

    tmp = Math.ceil(k2.usrCoords[2]);
    var l2 = 0;
    for(var i = 0; i <= gridY+1; i++) {
        if(tmp-i/gridY < k2.usrCoords[2]) {
            l2 = i-1;
            break;
        }
    }

    tmp = Math.floor(k.usrCoords[2]);
    var l = 0;
    for(var i = 0; i <= gridY+1; i++) {
        if(tmp+i/gridY > k.usrCoords[2]) {
            l = i-1;
            break;
        }
    }

    var gx = Math.round((1.0/gridX)*board.zoomX*board.unitX);
    var gy = Math.round((1.0/gridY)*board.zoomY*board.unitY);

    var topLeft = new JXG.Coords(JXG.COORDS_BY_USER, 
                                 [Math.ceil(k.usrCoords[1])-j/gridX, Math.floor(k.usrCoords[2])+l/gridY],
                                 board);
    var bottomRight = new JXG.Coords(JXG.COORDS_BY_USER,
                                     [Math.floor(k2.usrCoords[1])+j2/gridX, Math.ceil(k2.usrCoords[2])-l2/gridY],
                                     board);
    var i = 0;
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        var node2 = this.createPrimitive('line','gridx'+i);
        this.updateLinePrimitive(node2,topLeft.scrCoords[1],0,topLeft.scrCoords[1],board.canvasHeight);
        if(!board.snapToGrid) {
            this.setPropertyPrimitive(node2,'stroke', board.gridColor);
        }
        else {
            this.setPropertyPrimitive(node2,'stroke', '#FF8080');
        }
        this.setPropertyPrimitive(node2,'stroke-width', '0.4px');  
        if(board.gridDash) {
            this.setPropertyPrimitive(node2,'stroke-dasharray', '5, 5'); 
        }
        this.appendChildPrimitive(node2,'grid');
        i++;
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);
    }
    i = 0;
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) { 
        var node2 = this.createPrimitive('line','gridy'+i);
        this.updateLinePrimitive(node2,0,topLeft.scrCoords[2],board.canvasWidth,topLeft.scrCoords[2]);
        if(!board.snapToGrid) {
            this.setPropertyPrimitive(node2,'stroke', board.gridColor);
        }
        else {
            this.setPropertyPrimitive(node2,'stroke', '#FF8080');
        }
        this.setPropertyPrimitive(node2,'stroke-width', '0.4px');  
        if(board.gridDash) {
            this.setPropertyPrimitive(node2,'stroke-dasharray', '5, 5'); 
        }
        this.appendChildPrimitive(node2,'grid');
        i++;
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }   
};

/**
 * Removes the grid.
 * @see #drawGrid
 * @param {Board} board Board on which the grid is drawn.
 */
JXG.AbstractRenderer.prototype.removeGrid = function(board) { };

/**
 * Hides an element on the canvas.
 * @param {Object} obj Reference to the object that has to disappear.
 * @see #show
 */
JXG.AbstractRenderer.prototype.hide = function(obj) { };

/**
 * Shows an element on the canvas.
 * @param {Object} obj Reference to the object that has to appear.
 * @see #hide
 */
JXG.AbstractRenderer.prototype.show = function(obj) { };

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.AbstractRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    var w;
    if (typeof width=='function') {
        w = width();
    } else {
        w = width;
    }
    //w = (w>0)?w:0;
    
    if(el.elementClass != JXG.OBJECT_CLASS_POINT) {
        var node;
        if(el.type == JXG.OBJECT_TYPE_ANGLE) {
            node = el.rendNode2;
        }
        else {
            node = el.rendNode;
        }
        this.setPropertyPrimitive(node,'stroked', 'true');
        if (w!=null) { 
            this.setPropertyPrimitive(node,'stroke-width',w);    
        }
    }
    else {
        if(el.visProp['style'] >= 3 && el.visProp['style'] <= 9) {
            var node = el.rendNode;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w); 
            }
        }
        else {
            var node = el.rendNodeX1;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w);  
            }
            var node = el.rendNodeX2;
            this.setPropertyPrimitive(node,'stroked', 'true');
            if (w!=null) { 
                this.setPropertyPrimitive(node,'stroke-width',w); 
            }
        }
    }
};

/**
 * Changes an objects stroke color
 * @param {Object} obj Reference of the object that wants a new stroke color.
 * @param {String} color Color in a HTML/CSS compatible format.
 * @param {float} opacity Opacity of the fill color. Must be between 0 and 1.
 * @see #setObjectFillColor
 */
JXG.AbstractRenderer.prototype.setObjectStrokeColor = function(obj, color, opacity) { };

/**
 * Changes an objects dash style.
 * @param {Object} obj Reference of the object that wants a new dash style
 */
JXG.AbstractRenderer.prototype.setObjectDash = function(obj) { };
   
/**
 * Changes an objects fill color.
 * @param {Object} obj Reference of the object that wants a new fill color.
 * @param {String} color Color in a HTML/CSS compatible format. If you don't want any fill color
 * at all, choose 'none'.
 * @param {float} opacity Opacity of the fill color. Must be between 0 and 1.
 * @see #setObjectStrokeColor
 */
JXG.AbstractRenderer.prototype.setObjectFillColor = function(obj, color, opacity) { };

/*
/**
 * Changes all properties of an object.
 * @param {Object} obj Reference of the object that wants new properties.
 */
/*
UNUSED?????
JXG.AbstractRenderer.prototype.setProperty = function (obj) {
    this.setObjectStrokeWidth(obj, obj.visProp['strokeWidth']);
    this.setObjectStrokeColor(obj, obj.visProp['strokeColor'], obj.visProp['strokeOpacity']);    
    this.setObjectFillColor(obj, obj.visProp['fillColor'], obj.visProp['fillOpacity']);
    if (obj.visProp['visible'] == false) {
        this.hide(obj);
    } else {
        this.show(obj);
    }
    if(obj.visProp['draft'] == true) {
        this.setDraft(obj);
    }
};
*/

/**
 * Puts an object into draft mode.
 * @param {Object} obj Reference of the object that shall be in draft mode.
 */
JXG.AbstractRenderer.prototype.setDraft = function (obj) {
    if (!obj.visProp['draft']) {
        return;
    }

    var draftColor = obj.board.options.elements.draft.color;
    var draftOpacity = obj.board.options.elements.draft.opacity;
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
 * @param {Object} obj Reference of the object that shall no longer be in draft mode.
 */
JXG.AbstractRenderer.prototype.removeDraft = function (obj) {
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
 * Highlights an object
 * i.e. uses the respective highlight colors of an object.
 * @param {Object} obj Reference of the object that will be highlighted.
 */
JXG.AbstractRenderer.prototype.highlight = function(obj) {
    if(obj.visProp['draft'] == false) {
        if(obj.type == JXG.OBJECT_CLASS_POINT) {
            this.setObjectStrokeColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
            this.setObjectFillColor(obj, obj.visProp['highlightStrokeColor'], obj.visProp['highlightStrokeOpacity']);
        }
        else if(obj.type == JXG.OBJECT_TYPE_POLYGON) {
            this.setObjectFillColor(obj, obj.visProp['highlightFillColor'], obj.visProp['highlightFillOpacity']);
            for(var i=0; i<obj.borders.length; i++) {
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
 * Uses the "normal" colors of an object
 * i.e. the contrasting function to @see highlight.
 * @param {Object} obj Reference of the object that will get its normal colors.
 */
JXG.AbstractRenderer.prototype.noHighlight = function(obj) {
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
 * Changes the color of the element's label to the color of the element.
 * @param {Object} el Reference of the element.
 */
JXG.AbstractRenderer.prototype.setLabelColor = function(el) {
    el.rendNode.style.color = el.color;
};

/**
 * Stop redraw.
 * @see #suspendRedraw
 */
JXG.AbstractRenderer.prototype.suspendRedraw = function() { };

/**
 * Restart redraw.
 * @see #unsuspendRedraw
 */
JXG.AbstractRenderer.prototype.unsuspendRedraw = function() { };

/**
 * Removes an HTML-Element from Canvas.
 * @param {HTMLElement} shape the HTMLElement that shall be removed.
 */
JXG.AbstractRenderer.prototype.remove = function(shape) { };

/**
 * Determines the size-parameter of a point depending on its style.
 * @param {number} style A point style constant.
 * @type int
 * @return Size of a point style.
 */
JXG.AbstractRenderer.prototype.getPointSize = function(style) {
    var size = 0;
    switch (style) {    
        case 0:
            size = 2; // small x
            break;
        case 1:
            size = 3; // medium x
            break;
        case 2:
            size = 4; // big x
            break;
        case 3:
            size = 1; // tiny circle
            break;
        case 4:
            size = 2; // small circle 
            break;
        case 5:
            size = 3; // medium circle
            break;
        case 6:
            size = 4; // big circle
            break;
        case 7:
            size = 2; // small rectangle
            break;
        case 8:
            size = 3; // medium rectangle
            break;
        case 9:
            size = 4; // big rectangle
            break;
        case 10:
            size = 2; // small +
            break;
        case 11:
            size = 3; // medium +
            break;
        case 12:
            size = 4; // big +
            break;
        default:
    }   
    return size;
};

/*
JXG.AbstractRenderer.prototype.cloneSubTree = function(){};
*/