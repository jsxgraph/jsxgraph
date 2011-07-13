/*
    Copyright 2008-2011,
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
 * @fileoverview In this file the geometry element Curve is defined.
 */

/**
 * Curves are the common object for function graphs, parametric curves, polar curves, adn data plots.
 * @class Creates a new curve object. Do not use this constructor to create a curve. Use {@link JXG.Board#create} with
 * type {@link Curve}, or {@link Functiongraph} instead.  
 * @augments JXG.GeometryElement
 * @param {string|JXG.Board} board The board the new curve is drawn on.
 * @param {Array} parents defining terms An array with the functon terms or the data points of the curve.
 * @param {Object} attributes Defines the visual appearance of the curve.
 * @see JXG.Board#generateName
 * @see JXG.Board#addCurve
  */
JXG.Curve = function (board, parents, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_CURVE, JXG.OBJECT_CLASS_CURVE);
 
    this.points = []; 

    /** Use the algorithm by Gillam and Hohenwarter for plotting.
      * If false the naive algorithm is used.
      * It is much slower, but the result is better.
      */
    this.doAdvancedPlot = attributes.doadvancedplot;
    
    /** 
      * Number of points on curves after mouseUp, i.e. high quality output.
      * Only used if this.doAdvancedPlot==false
      * May be overwritten.
      **/
    this.numberPointsHigh = attributes.numberpointshigh;
    /** 
      * Number of points on curves after mousemove, i.e. low quality output.
      * Only used if this.doAdvancedPlot==false
      * May be overwritten.
      **/
    this.numberPointsLow = attributes.numberpointslow;
    /** 
      * Number of points on curves. This value changes
      * between numberPointsLow and numberPointsHigh.
      * It is set in {@link JXG.Curve#updateCurve}.
      */
    this.numberPoints = this.numberPointsHigh; 

    this.dataX = null;
    this.dataY = null;

    if (parents[0]!=null) {
        this.varname = parents[0];
    } else {
        this.varname = 'x';
    }
    this.xterm = parents[1];  // function graphs: "x"
    this.yterm = parents[2];  // function graphs: e.g. "x^2"
    this.generateTerm(this.varname,this.xterm,this.yterm,parents[3],parents[4]);  // Converts GEONExT syntax into JavaScript syntax
    this.updateCurve();                        // First evaluation of the curve
    
    this.id = this.board.setId(this,'G');
    this.board.renderer.drawCurve(this);
    
    this.board.finalizeAdding(this);

    this.createGradient();
    this.createLabel();

    if (typeof this.xterm=='string') {
        this.notifyParents(this.xterm);
    }
    if (typeof this.yterm=='string') {
        this.notifyParents(this.yterm);
    }
};
JXG.Curve.prototype = new JXG.GeometryElement;


JXG.extend(JXG.Curve.prototype, /** @lends JXG.Curve.prototype */ {

    /**
     * Gives the default value of the left bound for the curve.
     * May be overwritten in @see generateTerm.
     */
    minX: function () {
        if (this.visProp.curvetype=='polar') {
            return 0.0;
        } else {
            var leftCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], this.board);
            return leftCoords.usrCoords[1];
        }
    },

    /**
     * Gives the default value of the right bound for the curve.
     * May be overwritten in @see generateTerm.
     */
    maxX: function () {
        var rightCoords;
        if (this.visProp.curvetype=='polar') {
            return 2.0*Math.PI;
        } else {
            rightCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [this.board.canvasWidth, 0], this.board);
            return rightCoords.usrCoords[1];
        }
    },

    /**
     * Checks whether (x,y) is near the curve.
     * @param {Number} x Coordinate in x direction, screen coordinates.
     * @param {Number} y Coordinate in y direction, screen coordinates.
     * @return {Boolean} True if (x,y) is near the curve, False otherwise.
     */
    hasPoint: function (x,y) {
        var t, dist = Infinity,
            c, trans, i, j, tX, tY,
            xi, xi1, yi, yi1,
            lbda, x0, y0, x1, y1, xy, den,
            steps = this.numberPointsLow,
            d = (this.maxX()-this.minX())/steps,
            prec = this.board.options.precision.hasPoint/(this.board.unitX*this.board.zoomX),
            checkPoint, len,
            suspendUpdate = true;

        prec = prec*prec;
        checkPoint = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this.board);
        x = checkPoint.usrCoords[1];
        y = checkPoint.usrCoords[2];
        if (this.visProp.curvetype=='parameter' || this.visProp.curvetype=='polar' || this.visProp.curvetype=='functiongraph') {
            // Brute fore search for a point on the curve close to the mouse pointer
            len = this.transformations.length;
            for (i=0,t=this.minX(); i<steps; i++) {
                tX = this.X(t,suspendUpdate);
                tY = this.Y(t,suspendUpdate);
                for (j=0; j<len; j++) {
                    trans = this.transformations[j];
                    trans.update();
                    c = JXG.Math.matVecMult(trans.matrix,[1,tX,tY]);
                    tX = c[1];
                    tY = c[2];
                }
                dist = (x-tX)*(x-tX)+(y-tY)*(y-tY);
                if (dist<prec) { return true; }
                t+=d;
            }
        } else if (this.visProp.curvetype == 'plot') {
            len = this.numberPoints; // Rough search quality
            for (i=0;i<len-1;i++) {
                xi = this.X(i);
                xi1 = this.X(i+1);
                yi = this.Y(i);
                yi1 = this.Y(i+1);
                x1 = xi1 - xi;
                y1 = yi1-yi;

                x0 = x-xi;
                y0 = y-yi;
                den = x1*x1+y1*y1;

                if (den>=JXG.Math.eps) {
                    xy = x0*x1+y0*y1;
                    lbda = xy/den;
                    dist = x0*x0+y0*y0 - lbda*xy;
                } else {
                    lbda = 0.0;
                    dist = x0*x0+y0*y0;
                }
                if (lbda>=0.0 && lbda<=1.0 && dist<prec) {
                    return true;
                }
            }
            return false;
        }
        return (dist<prec);
    },

    /**
     * Allocate points in the Coords array this.points
     */
    allocatePoints: function () {
        var i, len;
        len = this.numberPoints;
        if (this.points.length<this.numberPoints) {
            for (i=this.points.length; i<len; i++) {
                this.points[i] = new JXG.Coords(JXG.COORDS_BY_USER, [0,0], this.board);
            }
        }
    },

    /**
     * Computes for equidistant points on the x-axis the values
     * of the function, {@link #updateCurve}
     * Then, the update function of the renderer
     * is called.
     */
    update: function () {
        if (this.needsUpdate) {
            if (this.visProp.trace) {
                this.cloneToBackground(true);
            }
            this.updateCurve();
        }
        return this;
    },

    /**
     * Then, the update function of the renderer
     * is called.
     */
    updateRenderer: function () {
        if (this.needsUpdate) {
            this.board.renderer.updateCurve(this);
            this.needsUpdate = false;

            /* Update the label if visible. */
            if(this.hasLabel && this.label.content.visProp.visible) {
                //this.label.setCoordinates(this.coords);
                this.label.content.update();
                //this.board.renderer.updateLabel(this.label);
                this.board.renderer.updateText(this.label.content);
            }
        }
        return this;
    },

    /**
     * For dynamic dataplots updateCurve
     * can be used to compute new entries
     * for the arrays this.dataX and
     * this.dataY. It is used in @see updateCurve.
     * Default is an empty method, can be overwritten
     * by the user.
     */
    updateDataArray: function () {
        return this;
    },

    /**
     * Computes for equidistant points on the x-axis the values
     * of the function. @see #update
     * If the mousemove event triggers this update, we use only few
     * points. Otherwise, e.g. on mouseup, many points are used.
     */
    updateCurve: function () {
        var len, mi, ma, x, y, i,
            suspendUpdate = false;

        this.updateDataArray();
        mi = this.minX();
        ma = this.maxX();

        // Discrete data points
        if (this.dataX!=null) { // x-coordinates are in an array
            this.numberPoints = this.dataX.length;
            len = this.numberPoints;
            this.allocatePoints();  // It is possible, that the array length has increased.
            for (i=0; i<len; i++) {
                x = i;
                if (this.dataY!=null) { // y-coordinates are in an array
                    y = i;
                } else {
                    y = this.X(x); // discrete x data, continuous y data
                }
                this.points[i].setCoordinates(JXG.COORDS_BY_USER, [this.X(x,suspendUpdate),this.Y(y,suspendUpdate)], false); // The last parameter prevents rounding in usr2screen().
                this.updateTransform(this.points[i]);
                suspendUpdate = true;
            }
        } else { // continuous x data
            if (this.doAdvancedPlot) {
                this.updateParametricCurve(mi,ma,len);
            } else {
                if (this.board.updateQuality==this.board.BOARD_QUALITY_HIGH) {
                    this.numberPoints = this.numberPointsHigh;
                } else {
                    this.numberPoints = this.numberPointsLow;
                }
                len = this.numberPoints;
                this.allocatePoints();  // It is possible, that the array length has increased.
                this.updateParametricCurveNaive(mi,ma,len);
            }
        }
        this.getLabelAnchor();
        return this;
    },

    updateParametricCurveNaive: function(mi,ma,len) {
        var i, t,
            suspendUpdate = false,
            stepSize = (ma-mi)/len;

        for (i=0; i<len; i++) {
            t = mi+i*stepSize;
            this.points[i].setCoordinates(JXG.COORDS_BY_USER, [this.X(t,suspendUpdate),this.Y(t,suspendUpdate)], false); // The last parameter prevents rounding in usr2screen().
            this.updateTransform(this.points[i]);
            suspendUpdate = true;
        }
        return this;
    },

    updateParametricCurve: function(mi, ma) {
        var i, t, t0,
            suspendUpdate = false,
            po = new JXG.Coords(JXG.COORDS_BY_USER, [0,0], this.board),
            x, y, x0, y0, top, depth,
            MAX_DEPTH,
            MAX_XDIST,
            MAX_YDIST,
            dyadicStack = [],
            depthStack = [],
            pointStack = [],
            divisors = [],
            distOK = false,
            j = 0;
            //stime = new Date(),
            //etime;


        if (this.board.updateQuality==this.board.BOARD_QUALITY_LOW) {
            MAX_DEPTH = 12;
            MAX_XDIST = 12;
            MAX_YDIST = 12;
        } else {
            MAX_DEPTH = 18; // 20
            MAX_XDIST = 2;
            MAX_YDIST = 2;
        }

        divisors[0] = ma-mi;
        for (i=1;i<MAX_DEPTH;i++) {
            divisors[i] = divisors[i-1]*0.5;
        }

        i = 1;
        dyadicStack[0] = 1;
        depthStack[0] = 0;
        t = mi;
        po.setCoordinates(JXG.COORDS_BY_USER, [this.X(t,suspendUpdate),this.Y(t,suspendUpdate)], false);
        suspendUpdate = true;
        x0 = po.scrCoords[1];
        y0 = po.scrCoords[2];
        t0 = t;

        t = ma;
        po.setCoordinates(JXG.COORDS_BY_USER, [this.X(t,suspendUpdate),this.Y(t,suspendUpdate)], false);
        x = po.scrCoords[1];
        y = po.scrCoords[2];

        pointStack[0] = [x,y];

        top = 1;
        depth = 0;

        this.points = [];
        this.points[j++] = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x0, y0], this.board);

        do {
            distOK = this.isDistOK(x0,y0,x,y,MAX_XDIST,MAX_YDIST)||this.isSegmentOutside(x0,y0,x,y);
            while (depth < MAX_DEPTH && (!distOK || depth < 3) && !(!this.isSegmentDefined(x0, y0, x, y) && depth > 8)) {
                dyadicStack[top] = i;
                depthStack[top] = depth;
                pointStack[top] = [x,y];
                top++;

                i = 2*i-1;
                depth++;
                t = mi+i*divisors[depth];
                po.setCoordinates(JXG.COORDS_BY_USER, [this.X(t,suspendUpdate),this.Y(t,suspendUpdate)], false);
                x = po.scrCoords[1];
                y = po.scrCoords[2];
                distOK = this.isDistOK(x0,y0,x,y,MAX_XDIST,MAX_YDIST)||this.isSegmentOutside(x0,y0,x,y);
            }

            this.points[j] = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x, y], this.board);
            this.updateTransform(this.points[j]);
            j++;

            x0 = x;
            y0 = y;
            t0 = t;

            top--;
            x = pointStack[top][0];
            y = pointStack[top][1];
            depth = depthStack[top]+1;
            i = dyadicStack[top]*2;

        } while (top != 0);
        this.numberPoints = this.points.length;
        
        //etime = new Date();
        //console.log(etime.getTime()-stime.getTime());

        return this;

    },

    isSegmentOutside: function (x0,y0,x1,y1) {
        if (y0<0 && y1<0) { return true; }
        else if (y0>this.board.canvasHeight && y1>this.board.canvasHeight) { return true; }
        else if (x0<0 && x1<0) { return true; }
        else if (x0>this.board.canvasWidth && x1>this.board.canvasWidth) { return true; }
        return false;
    },

    isDistOK: function (x0,y0,x1,y1,MAXX,MAXY) {
        if (isNaN(x0+y0+x1+y1)) { return false; }
        return (Math.abs(x1-x0)<MAXY && Math.abs(y1-y0)<MAXY);
    },

    isSegmentDefined: function (x0,y0,x1,y1) {
        return !(isNaN(x0 + y0) && isNaN(x1 + y1));

    },

    updateTransform: function (p) {
        var t, c, i,
            len = this.transformations.length;
        if (len==0) {
            return p;
        }
        for (i=0; i<len; i++) {
            t = this.transformations[i];
            t.update();
            c = JXG.Math.matVecMult(t.matrix,p.usrCoords);
            p.setCoordinates(JXG.COORDS_BY_USER,[c[1],c[2]]);
        }
        return p;
    },

    addTransform: function (transform) {
        var list, i, len;
        
        list = JXG.isArray(transform) ? transform : [transform];
        len = list.length;
        for (i = 0; i < len; i++) {
            this.transformations.push(list[i]);
        }
        return this;
    },

    setPosition: function (method, x, y) {
        var t = this.board.create('transform',[x,y],{type:'translate'});
        if (this.transformations.length>0 && this.transformations[this.transformations.length-1].isNumericMatrix) {
            this.transformations[this.transformations.length-1].melt(t);
        } else {
            this.addTransform(t);
        }
        return this;
    },

    /**
     * Converts the GEONExT syntax of the defining function term into JavaScript.
     * New methods X() and Y() for the Curve object are generated, further
     * new methods for minX() and maxX().
     * @see JXG.GeonextParser#geonext2JS.
     */
    generateTerm: function (varname, xterm, yterm, mi, ma) {
        var fx, fy;

        // Generate the methods X() and Y()
        if (JXG.isArray(xterm)) {
            this.dataX = xterm;
            this.X = function(t) { 
                var i = parseInt(Math.floor(t)), f1, f2;
                if (t<0) i = 0;
                else if (t>this.dataX.length-2) i = this.dataX.length-2;
                if (i==t) {
                    return this.dataX[i]; 
                } else {
                    f1 = this.dataX[i]; 
                    f2 = this.dataX[i+1]; 
                    return f1+(f2-f1)*(t-i);
                }
            };
            this.visProp.curvetype = 'plot';
            this.numberPoints = this.dataX.length;
        } else {
            this.X = JXG.createFunction(xterm, this.board, varname);
            if (JXG.isString(xterm)) {
                this.visProp.curvetype = 'functiongraph';
            } else if (JXG.isFunction(xterm) || JXG.isNumber(xterm)) {
                this.visProp.curvetype = 'parameter';
            }
        }

        if (JXG.isArray(yterm)) {
            this.dataY = yterm;
            this.Y = function(t) {
                var i = parseInt(Math.floor(t)), f1, f2;
                if (t<0) i = 0;
                else if (t>this.dataY.length-2) i = this.dataY.length-2;
                if (i==t) {
                    if (JXG.isFunction(this.dataY[i])) {
                        return this.dataY[i]();
                    } else {
                        return this.dataY[i];
                    }
                } else {
                    if (JXG.isFunction(this.dataY[i])) {
                        f1 = this.dataY[i]();
                    } else {
                        f1 = this.dataY[i];
                    }
                    if (JXG.isFunction(this.dataY[i+1])) {
                        f2 = this.dataY[i+1]();
                    } else {
                        f2 = this.dataY[i+1];
                    }
                    return f1+(f2-f1)*(t-i);
                }
            };
        } else {
            this.Y = JXG.createFunction(yterm,this.board,varname);
        }

        // polar form
        if (JXG.isFunction(xterm) && JXG.isArray(yterm)) {
            // Xoffset, Yoffset
            fx = JXG.createFunction(yterm[0],this.board,'');
            fy = JXG.createFunction(yterm[1],this.board,'');
            this.X = function(phi){return (xterm)(phi)*Math.cos(phi)+fx();};
            this.Y = function(phi){return (xterm)(phi)*Math.sin(phi)+fy();};
            this.visProp.curvetype = 'polar';
        }

        // Set the bounds
        // lower bound
        if (mi!=null) this.minX = JXG.createFunction(mi,this.board,'');
        if (ma!=null) this.maxX = JXG.createFunction(ma,this.board,'');
    },

    /**
     * Finds dependencies in a given term and notifies the parents by adding the
     * dependent object to the found objects child elements.
     * @param {String} contentStr String containing dependencies for the given object.
     */
    notifyParents: function (contentStr) {
        JXG.GeonextParser.findDependencies(this,contentStr, this.board);
    },

    /**
     * Calculates LabelAnchor.
     * @type JXG.Coords
     * @return Text anchor coordinates as JXG.Coords object.
     */
    getLabelAnchor: function() {
        var c = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, this.board.canvasHeight*0.5], this.board);
        c = JXG.Math.Geometry.projectCoordsToCurve(c.usrCoords[1],c.usrCoords[2],0.0,this,this.board)[0];
        return c;
    },

    /**
     * Clone curve to the background.
     * @param addToTrace Not used yet. Always true.
     */
    cloneToBackground: function () {
        var copy = {}, er;

        copy.id = this.id + 'T' + this.numTraces;
        copy.elementClass = JXG.OBJECT_CLASS_CURVE;
        this.numTraces++;

        copy.points = this.points.slice(0);
        copy.numberPoints = this.numberPoints;
        copy.board = this.board;
        copy.visProp = this.visProp;
        copy.visProp.layer = this.board.options.layer.trace;
        copy.visProp.curvetype = this.visProp.curvetype;

        JXG.clearVisPropOld(copy);
        
        er = this.board.renderer.enhancedRendering;
        this.board.renderer.enhancedRendering = true;
        this.board.renderer.drawCurve(copy);
        this.board.renderer.enhancedRendering = er;
        this.traces[copy.id] = copy.rendNode;
    },

    bounds: function () {
        var steps = this.numberPointsLow,
            d = (this.maxX()-this.minX())/steps,
            i, j, trans, t, c, len, tX, tY, box = [this.minX(), 0, this.maxX(), 0];

        if (this.visProp.curvetype=='parameter' || this.visProp.curvetype=='polar' || this.visProp.curvetype=='functiongraph') {
            len = this.transformations.length;
            t = this.minX();
            for (i = 0; i < steps; i++) {
                tX = this.X(t, true);
                tY = this.Y(t, true);
                for (j = 0; j < len; j++) {
                    trans = this.transformations[j];
                    trans.update();
                    c = JXG.Math.matVecMult(trans.matrix,[1,tX,tY]);
                    tX = c[1];
                    tY = c[2];
                }
                if (box[1] < tY) {
                    box[1] = tY;
                }
                if (box[3] > tY) {
                    box[3] = tY;
                }
                t+=d;
            }
        } else if (this.visProp.curvetype == 'plot') {
            len = this.numberPoints;
            for (i = 0; i < len; i++) {
                tY = this.Y(i);
                if (box[1] < tY) {
                    box[1] = tY;
                }
                if (box[3] > tY) {
                    box[3] = tY;
                }
            }
        }
        return box;
    }
});


/**
 * @class This element is used to provide a constructor for curve, which is just a wrapper for element {@link Curve}. 
 * A curve is a mapping from R to R^2. t mapsto (x(t),y(t)). The graph is drawn for t in the interval [a,b]. 
 * <p>
 * The following types of curves can be plotted:
 * <ul>
 *  <li> parametric curves: t mapsto (x(t),y(t)), where x() and y() are univariate functions.
 *  <li> polar curves: curves commonly written with polar equations like spirals and cardioids.
 *  <li> data plots: plot linbe segments through a given list of coordinates.
 * </ul>
 * @pseudo
 * @description
 * @name Curve
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @param {function,number_function,number_function,number_function,number} x,y,a_,b_ Parent elements for Parametric Curves. 
 *                     <p>
 *                     x describes the x-coordinate of the curve. It may be a function term in one variable, e.g. x(t). 
 *                     In case of x being of type number, x(t) is set to  a constant function.
 *                     this function at the values of the array.
 *                     </p>
 *                     <p>
 *                     y describes the y-coordinate of the curve. In case of a number, y(t) is set to the constant function
 *                     returning this number. 
 *                     </p>
 *                     <p>
 *                     Further parameters are an optional number or function for the left interval border a, 
 *                     and an optional number or function for the right interval border b. 
 *                     </p>
 *                     <p>
 *                     Default values are a=-10 and b=10.
 *                     </p>
 * @param {array_array,function,number} x,y Parent elements for Data Plots.
 *                     <p>
 *                     x and y are arrays contining the x and y coordinates of the data points which are connected by
 *                     line segments. The individual entries of x and y may also be functions.
 *                     In case of x being an array the curve type is data plot, regardless of the second parameter and 
 *                     if additionally the second parameter y is a function term the data plot evaluates.
 *                     </p>
 * @param {function_array,function,number_function,number_function,number} r,offset_,a_,b_ Parent elements for Polar Curves.
 *                     <p>
 *                     The first parameter is a function term r(phi) describing the polar curve.
 *                     </p>
 *                     <p>
 *                     The second parameter is the offset of the curve. It has to be
 *                     an array containing numbers or functions describing the offset. Default value is the origin [0,0].
 *                     </p>
 *                     <p>
 *                     Further parameters are an optional number or function for the left interval border a, 
 *                     and an optional number or function for the right interval border b. 
 *                     </p>
 *                     <p>
 *                     Default values are a=-10 and b=10.
 *                     </p>
 * @see JXG.Curve
 * @example
 * // Parametric curve
 * // Create a curve of the form (t-sin(t), 1-cos(t), i.e.
 * // the cycloid curve.
 *   var graph = board.create('curve', 
 *                        [function(t){ return t-Math.sin(t);}, 
 *                         function(t){ return 1-Math.cos(t);},
 *                         0, 2*Math.PI]
 *                     );
 * </pre><div id="af9f818b-f3b6-4c4d-8c4c-e4a4078b726d" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c1_board = JXG.JSXGraph.initBoard('af9f818b-f3b6-4c4d-8c4c-e4a4078b726d', {boundingbox: [-1, 5, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var graph1 = c1_board.create('curve', [function(t){ return t-Math.sin(t);},function(t){ return 1-Math.cos(t);},0, 2*Math.PI]);
 * </script><pre>
 * @example
 * // Data plots
 * // Connect a set of points given by coordinates with dashed line segments.
 * // The x- and y-coordinates of the points are given in two separate 
 * // arrays.
 *   var x = [0,1,2,3,4,5,6,7,8,9];
 *   var y = [9.2,1.3,7.2,-1.2,4.0,5.3,0.2,6.5,1.1,0.0];
 *   var graph = board.create('curve', [x,y], {dash:2});
 * </pre><div id="7dcbb00e-b6ff-481d-b4a8-887f5d8c6a83" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c3_board = JXG.JSXGraph.initBoard('7dcbb00e-b6ff-481d-b4a8-887f5d8c6a83', {boundingbox: [-1,10,10,-1], axis: true, showcopyright: false, shownavigation: false});
 *   var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
 *   var y = [9.2, 1.3, 7.2, -1.2, 4.0, 5.3, 0.2, 6.5, 1.1, 0.0];
 *   var graph3 = c3_board.create('curve', [x,y], {dash:2});
 * </script><pre>
 * @example
 * // Polar plot
 * // Create a curve with the equation r(phi)= a*(1+phi), i.e.
 * // a cardioid.
 *   var a = board.create('slider',[[0,2],[2,2],[0,1,2]]);
 *   var graph = board.create('curve', 
 *                        [function(phi){ return a.Value()*(1-Math.cos(phi));}, 
 *                         [1,0], 
 *                         0, 2*Math.PI]
 *                     );
 * </pre><div id="d0bc7a2a-8124-45ca-a6e7-142321a8f8c2" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c2_board = JXG.JSXGraph.initBoard('d0bc7a2a-8124-45ca-a6e7-142321a8f8c2', {boundingbox: [-3,3,3,-3], axis: true, showcopyright: false, shownavigation: false});
 *   var a = c2_board.create('slider',[[0,2],[2,2],[0,1,2]]);
 *   var graph2 = c2_board.create('curve', [function(phi){ return a.Value()*(1-Math.cos(phi));}, [1,0], 0, 2*Math.PI]);
 * </script><pre>
 */
JXG.createCurve = function(board, parents, attributes) {
    var attr = JXG.copyAttributes(attributes, board.options, 'curve');
    return new JXG.Curve(board, ['x'].concat(parents), attr);
};

JXG.JSXGraph.registerElement('curve', JXG.createCurve);

/**
 * @class This element is used to provide a constructor for functiongraph, which is just a wrapper for element {@link Curve} with {@link JXG.Curve#X()}
 * set to x. The graph is drawn for x in the interval [a,b].
 * @pseudo
 * @description
 * @name Functiongraph
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @param {function_number,function_number,function} f,a_,b_ Parent elements are a function term f(x) describing the function graph. 
 *         <p>
 *         Further, an optional number or function for the left interval border a, 
 *         and an optional number or function for the right interval border b. 
 *         <p>
 *         Default values are a=-10 and b=10.
 * @see JXG.Curve
 * @example
 * // Create a function graph for f(x) = 0.5*x*x-2*x
 *   var graph = board.create('functiongraph', 
 *                        [function(x){ return 0.5*x*x-2*x;}, -2, 4]
 *                     );
 * </pre><div id="efd432b5-23a3-4846-ac5b-b471e668b437" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var alex1_board = JXG.JSXGraph.initBoard('efd432b5-23a3-4846-ac5b-b471e668b437', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var graph = alex1_board.create('functiongraph', [function(x){ return 0.5*x*x-2*x;}, -2, 4]);
 * </script><pre>
 * @example
 * // Create a function graph for f(x) = 0.5*x*x-2*x with variable interval
 *   var s = board.create('slider',[[0,4],[3,4],[-2,4,5]]);
 *   var graph = board.create('functiongraph', 
 *                        [function(x){ return 0.5*x*x-2*x;}, 
 *                         -2, 
 *                         function(){return s.Value();}]
 *                     );
 * </pre><div id="4a203a84-bde5-4371-ad56-44619690bb50" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var alex2_board = JXG.JSXGraph.initBoard('4a203a84-bde5-4371-ad56-44619690bb50', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var s = alex2_board.create('slider',[[0,4],[3,4],[-2,4,5]]);
 *   var graph = alex2_board.create('functiongraph', [function(x){ return 0.5*x*x-2*x;}, -2, function(){return s.Value();}]);
 * </script><pre>
 */
JXG.createFunctiongraph = function(board, parents, attributes) {
    var attr, par = ["x","x"].concat(parents);
        
    attr = JXG.copyAttributes(attributes, board.options, 'curve');
    attr['curvetype'] = 'functiongraph';
    return new JXG.Curve(board, par, attr);
};

JXG.JSXGraph.registerElement('functiongraph', JXG.createFunctiongraph);


/**
 * TODO
 * Create a dynamic spline interpolated curve given by sample points p_1 to p_n.
 * @param {JXG.Board} board Reference to the board the spline is drawn on.
 * @param {Array} parents Array of points the spline interpolates
 * @param {Object} attributes Define color, width, ... of the spline
 * @type JXG.Curve
 * @return Returns reference to an object of type JXG.Curve.
 */
JXG.createSpline = function(board, parents, attributes) {
    var F;
    F = function() {
        var D, x=[], y=[];
        
        var fct = function (t,suspended) {
            var i, j;
        
            if (!suspended) {
                x = [];
                y = [];

                // given as [x[], y[]]
                if(parents.length == 2 && JXG.isArray(parents[0]) && JXG.isArray(parents[1]) && parents[0].length == parents[1].length) {
                    for(i=0; i<parents[0].length; i++) {
                        if(typeof parents[0][i] == 'function')
                            x.push(parents[0][i]());
                        else
                            x.push(parents[0][i]);
                        if(typeof parents[1][i] == 'function')
                            y.push(parents[1][i]());
                        else
                            y.push(parents[1][i]);
                    }
                } else {
                    for(i=0; i<parents.length; i++) {
                        if(JXG.isPoint(parents[i])) {
                            //throw new Error("JSXGraph: JXG.createSpline: Parents has to be an array of JXG.Point.");
                            x.push(parents[i].X());
                            y.push(parents[i].Y());
                        } else if (JXG.isArray(parents[i]) && parents[i].length == 2) {     // given as [[x1,y1], [x2, y2], ...]
                            for(i=0; i<parents.length; i++) {
                                if(typeof parents[i][0] == 'function')
                                    x.push(parents[i][0]());
                                else
                                    x.push(parents[i][0]);
                                if(typeof parents[i][1] == 'function')
                                    y.push(parents[i][1]());
                                else
                                    y.push(parents[i][1]);
                            }
                        }
                    }
                }
        
                // The array D has only to be calculated when the position of one or more sample point
                // changes. otherwise D is always the same for all points on the spline.
                D = JXG.Math.Numerics.splineDef(x, y);
            }
            return JXG.Math.Numerics.splineEval(t, x, y, D);
        };
        return fct;
    };
    return board.create('curve', ["x", F()], attributes);
};

/**
 * Register the element type spline at JSXGraph
 * @private
 */
JXG.JSXGraph.registerElement('spline', JXG.createSpline);

/**
 * @class This element is used to provide a constructor for Riemann sums, which is relaized as a special curve. 
 * @pseudo
 * @description
 * @name Riemannsum
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @param {function_number,function_string,function_function,number_function,number} f,n,type_,a_,b_ Parent elements of Riemannsum are a 
 *         function term f(x) describing the function graph which is filled by the Riemann rectangles.
 *         <p>
 *         n determines the number of rectangles, it is either a fixed number or a function.
 *         <p>
 *         type is a string or function returning one of the values:  'left', 'right', 'middle', 'lower', 'upper', or 'trapezodial'.
 *         Default value is 'left'.
 *         <p>
 *         Further parameters are an optional number or function for the left interval border a, 
 *         and an optional number or function for the right interval border b. 
 *         <p>
 *         Default values are a=-10 and b=10.
 * @see JXG.Curve
 * @example
 * // Create Riemann sums for f(x) = 0.5*x*x-2*x.
 *   var s = board.create('slider',[[0,4],[3,4],[0,4,10]],{snapWidth:1});
 *   var f = function(x) { return 0.5*x*x-2*x; };
 *   var r = board.create('riemannsum', 
 *               [f, function(){return s.Value();}, 'upper', -2, 5],
 *               {fillOpacity:0.4}
 *               );
 *   var g = board.create('functiongraph',[f, -2, 5]);
 * </pre><div id="940f40cc-2015-420d-9191-c5d83de988cf" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var rs1_board = JXG.JSXGraph.initBoard('940f40cc-2015-420d-9191-c5d83de988cf', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var f = function(x) { return 0.5*x*x-2*x; };
 *   var s = rs1_board.create('slider',[[0,4],[3,4],[0,4,10]],{snapWidth:1});
 *   var r = rs1_board.create('riemannsum', [f, function(){return s.Value();}, 'upper', -2, 5], {fillOpacity:0.4});
 *   var g = rs1_board.create('functiongraph', [f, -2, 5]);
 * </script><pre>
 */
JXG.createRiemannsum = function(board, parents, attributes) {
    var n, type, f, par, c, attr;
    
    attr = JXG.copyAttributes(attributes, board.options, 'riemannsum');
    attr['curvetype'] = 'plot';

    f = parents[0]; 
    n = JXG.createFunction(parents[1],board,'');
    if (n==null) {
        throw new Error("JSXGraph: JXG.createRiemannsum: argument '2' n has to be number or function." +
                        "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]");
    }

    type = JXG.createFunction(parents[2],board,'',false);
    if (type==null) {
        throw new Error("JSXGraph: JXG.createRiemannsum: argument 3 'type' has to be string or function." +
                        "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]");
    }

    par = [[0], [0]].concat(parents.slice(3));
    /**
     * @private
     */
    c = board.create('curve', par, attr);
    /**
     * @private
     */
    c.updateDataArray = function() {
            var u = JXG.Math.Numerics.riemann(f,n(),type(),this.minX(),this.maxX());
            this.dataX = u[0];
            this.dataY = u[1];
        };
    return c;
};

JXG.JSXGraph.registerElement('riemannsum', JXG.createRiemannsum);
