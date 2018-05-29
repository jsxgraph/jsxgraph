/*
    Copyright 2008-2018
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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 base/element
 math/math
 math/geometry
 math/statistics
 math/numerics
 parser/geonext
 utils/type
  elements:
   transform
 */

/**
 * @fileoverview In this file the geometry element Curve is defined.
 */

define([
    'jxg', 'base/constants', 'base/coords', 'base/element', 'math/math', 'math/statistics', 'math/numerics',
    'math/geometry', 'parser/geonext', 'utils/type', 'base/transformation', 'math/qdt'
], function (JXG, Const, Coords, GeometryElement, Mat, Statistics, Numerics, Geometry, GeonextParser, Type, Transform, QDT) {

    "use strict";

    /**
     * Curves are the common object for function graphs, parametric curves, polar curves, and data plots.
     * @class Creates a new curve object. Do not use this constructor to create a curve. Use {@link JXG.Board#create} with
     * type {@link Curve}, or {@link Functiongraph} instead.
     * @augments JXG.GeometryElement
     * @param {String|JXG.Board} board The board the new curve is drawn on.
     * @param {Array} parents defining terms An array with the functon terms or the data points of the curve.
     * @param {Object} attributes Defines the visual appearance of the curve.
     * @see JXG.Board#generateName
     * @see JXG.Board#addCurve
     */
    JXG.Curve = function (board, parents, attributes) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_CURVE, Const.OBJECT_CLASS_CURVE);

        this.points = [];
        /**
         * Number of points on curves. This value changes
         * between numberPointsLow and numberPointsHigh.
         * It is set in {@link JXG.Curve#updateCurve}.
         */
        this.numberPoints = Type.evaluate(this.visProp.numberpointshigh);

        this.bezierDegree = 1;

        /**
         * Array holding the x-coordinates of a data plot.
         * This array can be updated during run time by overwriting
         * the method {@link JXG.Curve#updateDataArray}.
         * @type {array}
         */
        this.dataX = null;

        /**
         * Array holding the y-coordinates of a data plot.
         * This array can be updated during run time by overwriting
         * the method {@link JXG.Curve#updateDataArray}.
         * @type {array}
         */
        this.dataY = null;

        /**
         * Stores a quad tree if it is required. The quad tree is generated in the curve
         * updates and can be used to speed up the hasPoint method.
         * @type {JXG.Math.Quadtree}
         */
        this.qdt = null;

        if (Type.exists(parents[0])) {
            this.varname = parents[0];
        } else {
            this.varname = 'x';
        }

        // function graphs: "x"
        this.xterm = parents[1];
        // function graphs: e.g. "x^2"
        this.yterm = parents[2];

        // Converts GEONExT syntax into JavaScript syntax
        this.generateTerm(this.varname, this.xterm, this.yterm, parents[3], parents[4]);
        // First evaluation of the curve
        this.updateCurve();

        this.id = this.board.setId(this, 'G');
        this.board.renderer.drawCurve(this);

        this.board.finalizeAdding(this);

        this.createGradient();
        this.elType = 'curve';
        this.createLabel();

        if (Type.isString(this.xterm)) {
            this.notifyParents(this.xterm);
        }
        if (Type.isString(this.yterm)) {
            this.notifyParents(this.yterm);
        }

        this.methodMap = Type.deepCopy(this.methodMap, {
            generateTerm: 'generateTerm',
            setTerm: 'generateTerm',
            move: 'moveTo',
            moveTo: 'moveTo'
        });
    };

    JXG.Curve.prototype = new GeometryElement();

    JXG.extend(JXG.Curve.prototype, /** @lends JXG.Curve.prototype */ {

        /**
         * Gives the default value of the left bound for the curve.
         * May be overwritten in {@link JXG.Curve#generateTerm}.
         * @returns {Number} Left bound for the curve.
         */
        minX: function () {
            var leftCoords;

            if (Type.evaluate(this.visProp.curvetype) === 'polar') {
                return 0;
            }

            leftCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board, false);
            return leftCoords.usrCoords[1];
        },

        /**
         * Gives the default value of the right bound for the curve.
         * May be overwritten in {@link JXG.Curve#generateTerm}.
         * @returns {Number} Right bound for the curve.
         */
        maxX: function () {
            var rightCoords;

            if (Type.evaluate(this.visProp.curvetype) === 'polar') {
                return 2 * Math.PI;
            }
            rightCoords = new Coords(Const.COORDS_BY_SCREEN, [this.board.canvasWidth, 0], this.board, false);

            return rightCoords.usrCoords[1];
        },

        /**
         * The parametric function which defines the x-coordinate of the curve.
         * @param {Number} t A number between {@link JXG.Curve#minX} and {@link JXG.Curve#maxX}.
         * @param {Boolean} suspendUpdate A boolean flag which is false for the
         * first call of the function during a fresh plot of the curve and true
         * for all subsequent calls of the function. This may be used to speed up the
         * plotting of the curve, if the e.g. the curve depends on some input elements.
         * @returns {Number} x-coordinate of the curve at t.
         */
        X: function (t) {
            return NaN;
        },
        /**
        * The parametric function which defines the y-coordinate of the curve.
        * @param {Number} t A number between {@link JXG.Curve#minX} and {@link JXG.Curve#maxX}.
        * @param {Boolean} suspendUpdate A boolean flag which is false for the
        * first call of the function during a fresh plot of the curve and true
        * for all subsequent calls of the function. This may be used to speed up the
        * plotting of the curve, if the e.g. the curve depends on some input elements.
        * @returns {Number} y-coordinate of the curve at t.
         */
        Y: function (t) {
            return NaN;
        },

        /**
         * Treat the curve as curve with homogeneous coordinates.
         * @param {Number} t A number between {@link JXG.Curve#minX} and {@link JXG.Curve#maxX}.
         * @returns {Number} Always 1.0
         */
        Z: function (t) {
            return 1;
        },

        /**
         * Checks whether (x,y) is near the curve.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @param {Number} start Optional start index for search on data plots.
         * @returns {Boolean} True if (x,y) is near the curve, False otherwise.
         */
        hasPoint: function (x, y, start) {
            var t, checkPoint, len, invMat, c,
                i, tX, tY,
                res = [],
                points, qdt,
                steps = Type.evaluate(this.visProp.numberpointslow),
                d = (this.maxX() - this.minX()) / steps,
                prec = this.board.options.precision.hasPoint,
                dist = Infinity,
                ux2, uy2,
                ev_ct,
                suspendUpdate = true;

            checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board, false);
            x = checkPoint.usrCoords[1];
            y = checkPoint.usrCoords[2];

            // We use usrCoords. Only in the final distance calculation
            // screen coords are used
            prec += Type.evaluate(this.visProp.strokewidth) * 0.5;
            prec *= prec; // We do not want to take sqrt
            ux2 = this.board.unitX * this.board.unitX;
            uy2 = this.board.unitY * this.board.unitY;


            ev_ct = Type.evaluate(this.visProp.curvetype);
            if (ev_ct === 'parameter' || ev_ct === 'polar') {
                if (this.transformations.length > 0) {
                    /**
                     * Transform the mouse/touch coordinates
                     * back to the original position of the curve.
                     */
                    this.updateTransformMatrix();
                    invMat = Mat.inverse(this.transformMat);
                    c = Mat.matVecMult(invMat, [1, x, y]);
                    x = c[1];
                    y = c[2];
                }

                // Brute force search for a point on the curve close to the mouse pointer
                for (i = 0, t = this.minX(); i < steps; i++) {
                    tX = this.X(t, suspendUpdate);
                    tY = this.Y(t, suspendUpdate);

                    dist = (x - tX) * (x - tX) * ux2 + (y - tY) * (y - tY) * uy2;

                    if (dist <= prec) {
                        return true;
                    }

                    t += d;
                }
            } else if (ev_ct === 'plot' ||
                        ev_ct === 'functiongraph') {

                if (!Type.exists(start) || start < 0) {
                    start = 0;
                }

                if (Type.exists(this.qdt) && Type.evaluate(this.visProp.useqdt) && this.bezierDegree !== 3) {
                    qdt = this.qdt.query(new Coords(Const.COORDS_BY_USER, [x, y], this.board));
                    points = qdt.points;
                    len = points.length;
                } else {
                    points = this.points;
                    len = this.numberPoints - 1;
                }

                for (i = start; i < len; i++) {
                    if (this.bezierDegree === 3) {
                        res.push(Geometry.projectCoordsToBeziersegment([1, x, y], this, i));
                    } else {
                        if (qdt) {
                            if (points[i].prev) {
                                res = Geometry.projectCoordsToSegment(
                                    [1, x, y],
                                    points[i].prev.usrCoords,
                                    points[i].usrCoords
                                );
                            }

                            // If the next point in the array is the same as the current points
                            // next neighbor we don't have to project it onto that segment because
                            // that will already be done in the next iteration of this loop.
                            if (points[i].next && points[i + 1] !== points[i].next) {
                                res = Geometry.projectCoordsToSegment(
                                    [1, x, y],
                                    points[i].usrCoords,
                                    points[i].next.usrCoords
                                );
                            }
                        } else {
                            res = Geometry.projectCoordsToSegment(
                                [1, x, y],
                                points[i].usrCoords,
                                points[i + 1].usrCoords
                            );
                        }
                    }

                    if (res[1] >= 0 && res[1] <= 1 &&
                        (x - res[0][1]) * (x - res[0][1]) * ux2 +
                        (y - res[0][2]) * (y - res[0][2]) * uy2 <= prec) {
                        return true;
                    }
                }
                return false;
            }
            return (dist < prec);
        },

        /**
         * Allocate points in the Coords array this.points
         */
        allocatePoints: function () {
            var i, len;

            len = this.numberPoints;

            if (this.points.length < this.numberPoints) {
                for (i = this.points.length; i < len; i++) {
                    this.points[i] = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false);
                }
            }
        },

        /**
         * Computes for equidistant points on the x-axis the values of the function
         * @returns {JXG.Curve} Reference to the curve object.
         * @see JXG.Curve#updateCurve
         */
        update: function () {
            if (this.needsUpdate) {
                if (Type.evaluate(this.visProp.trace)) {
                    this.cloneToBackground(true);
                }
                this.updateCurve();
            }

            return this;
        },

        /**
         * Updates the visual contents of the curve.
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateRenderer: function () {
            //var wasReal;

            if (!this.needsUpdate) {
                return this;
            }

            if (this.visPropCalc.visible) {
                // wasReal = this.isReal;

                this.checkReal();

                if (//wasReal &&
                    !this.isReal) {
                    this.updateVisibility(false);
                }
            }

            if (this.visPropCalc.visible) {
                this.board.renderer.updateCurve(this);
            }

            /* Update the label if visible. */
            if (this.hasLabel && this.visPropCalc.visible && this.label &&
                this.label.visPropCalc.visible && this.isReal) {

                this.label.update();
                this.board.renderer.updateText(this.label);
            }

            // Update rendNode display
            this.setDisplayRendNode();
            // if (this.visPropCalc.visible !== this.visPropOld.visible) {
            //     this.board.renderer.display(this, this.visPropCalc.visible);
            //     this.visPropOld.visible = this.visPropCalc.visible;
            //
            //     if (this.hasLabel) {
            //         this.board.renderer.display(this.label, this.label.visPropCalc.visible);
            //     }
            // }

            this.needsUpdate = false;
            return this;
        },

        /**
         * For dynamic dataplots updateCurve can be used to compute new entries
         * for the arrays {@link JXG.Curve#dataX} and {@link JXG.Curve#dataY}. It
         * is used in {@link JXG.Curve#updateCurve}. Default is an empty method, can
         * be overwritten by the user.
         *
         *
         * @example
         * // This example overwrites the updateDataArray method.
         * // There, new values for the arrays JXG.Curve.dataX and JXG.Curve.dataY
         * // are computed from the value of the slider N
         *
         * var N = board.create('slider', [[0,1.5],[3,1.5],[1,3,40]], {name:'n',snapWidth:1});
         * var circ = board.create('circle',[[4,-1.5],1],{strokeWidth:1, strokecolor:'black', strokeWidth:2,
         * 		fillColor:'#0055ff13'});
         *
         * var c = board.create('curve', [[0],[0]],{strokecolor:'red', strokeWidth:2});
         * c.updateDataArray = function() {
         *         var r = 1, n = Math.floor(N.Value()),
         *             x = [0], y = [0],
         *             phi = Math.PI/n,
         *             h = r*Math.cos(phi),
         *             s = r*Math.sin(phi),
         *             i, j,
         *             px = 0, py = 0, sgn = 1,
         *             d = 16,
         *             dt = phi/d,
         *             pt;
         *
         *         for (i = 0; i < n; i++) {
         *             for (j = -d; j <= d; j++) {
         *                 pt = dt*j;
         *                 x.push(px + r*Math.sin(pt));
         *                 y.push(sgn*r*Math.cos(pt) - (sgn-1)*h*0.5);
         *             }
         *             px += s;
         *             sgn *= (-1);
         *         }
         *         x.push((n - 1)*s);
         *         y.push(h + (sgn - 1)*h*0.5);
         *         this.dataX = x;
         *         this.dataY = y;
         *     }
         *
         * var c2 = board.create('curve', [[0],[0]],{strokecolor:'red', strokeWidth:1});
         * c2.updateDataArray = function() {
         *         var r = 1, n = Math.floor(N.Value()),
         *             px = circ.midpoint.X(), py = circ.midpoint.Y(),
         *             x = [px], y = [py],
         *             phi = Math.PI/n,
         *             s = r*Math.sin(phi),
         *             i, j,
         *             d = 16,
         *             dt = phi/d,
         *             pt = Math.PI*0.5+phi;
         *
         *         for (i = 0; i < n; i++) {
         *             for (j= -d; j <= d; j++) {
         *                 x.push(px + r*Math.cos(pt));
         *                 y.push(py + r*Math.sin(pt));
         *                 pt -= dt;
         *             }
         *             x.push(px);
         *             y.push(py);
         *             pt += dt;
         *         }
         *         this.dataX = x;
         *         this.dataY = y;
         *     }
         *     board.update();
         *
         * </pre><div id="20bc7802-e69e-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 600px; height: 400px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('20bc7802-e69e-11e5-b1bf-901b0e1b8723',
         *             {boundingbox: [-1.5,2,8,-3], keepaspectratio: true, axis: true, showcopyright: false, shownavigation: false});
         *             var N = board.create('slider', [[0,1.5],[3,1.5],[1,3,40]], {name:'n',snapWidth:1});
         *             var circ = board.create('circle',[[4,-1.5],1],{strokeWidth:1, strokecolor:'black',
         *             strokeWidth:2, fillColor:'#0055ff13'});
         *
         *             var c = board.create('curve', [[0],[0]],{strokecolor:'red', strokeWidth:2});
         *             c.updateDataArray = function() {
         *                     var r = 1, n = Math.floor(N.Value()),
         *                         x = [0], y = [0],
         *                         phi = Math.PI/n,
         *                         h = r*Math.cos(phi),
         *                         s = r*Math.sin(phi),
         *                         i, j,
         *                         px = 0, py = 0, sgn = 1,
         *                         d = 16,
         *                         dt = phi/d,
         *                         pt;
         *
         *                     for (i=0;i<n;i++) {
         *                         for (j=-d;j<=d;j++) {
         *                             pt = dt*j;
         *                             x.push(px+r*Math.sin(pt));
         *                             y.push(sgn*r*Math.cos(pt)-(sgn-1)*h*0.5);
         *                         }
         *                         px += s;
         *                         sgn *= (-1);
         *                     }
         *                     x.push((n-1)*s);
         *                     y.push(h+(sgn-1)*h*0.5);
         *                     this.dataX = x;
         *                     this.dataY = y;
         *                 }
         *
         *             var c2 = board.create('curve', [[0],[0]],{strokecolor:'red', strokeWidth:1});
         *             c2.updateDataArray = function() {
         *                     var r = 1, n = Math.floor(N.Value()),
         *                         px = circ.midpoint.X(), py = circ.midpoint.Y(),
         *                         x = [px], y = [py],
         *                         phi = Math.PI/n,
         *                         s = r*Math.sin(phi),
         *                         i, j,
         *                         d = 16,
         *                         dt = phi/d,
         *                         pt = Math.PI*0.5+phi;
         *
         *                     for (i=0;i<n;i++) {
         *                         for (j=-d;j<=d;j++) {
         *                             x.push(px+r*Math.cos(pt));
         *                             y.push(py+r*Math.sin(pt));
         *                             pt -= dt;
         *                         }
         *                         x.push(px);
         *                         y.push(py);
         *                         pt += dt;
         *                     }
         *                     this.dataX = x;
         *                     this.dataY = y;
         *                 }
         *                 board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * // This is an example which overwrites updateDataArray and produces
         * // a Bezier curve of degree three.
         * var A = board.create('point', [-3,3]);
         * var B = board.create('point', [3,-2]);
         * var line = board.create('segment', [A,B]);
         *
         * var height = 0.5; // height of the curly brace
         *
         * // Curly brace
         * var crl = board.create('curve', [[0],[0]], {strokeWidth:1, strokeColor:'black'});
         * crl.bezierDegree = 3;
         * crl.updateDataArray = function() {
         *     var d = [B.X()-A.X(), B.Y()-A.Y()],
         *         dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *         mid = [(A.X()+B.X())*0.5, (A.Y()+B.Y())*0.5];
         *
         *     d[0] *= height/dl;
         *     d[1] *= height/dl;
         *
         *     this.dataX = [ A.X(), A.X()-d[1], mid[0], mid[0]-d[1], mid[0], B.X()-d[1], B.X() ];
         *     this.dataY = [ A.Y(), A.Y()+d[0], mid[1], mid[1]+d[0], mid[1], B.Y()+d[0], B.Y() ];
         * };
         *
         * // Text
         * var txt = board.create('text', [
         *                     function() {
         *                         var d = [B.X()-A.X(), B.Y()-A.Y()],
         *                             dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *                             mid = (A.X()+B.X())*0.5;
         *
         *                         d[1] *= height/dl;
         *                         return mid-d[1]+0.1;
         *                     },
         *                     function() {
         *                         var d = [B.X()-A.X(), B.Y()-A.Y()],
         *                             dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *                             mid = (A.Y()+B.Y())*0.5;
         *
         *                         d[0] *= height/dl;
         *                         return mid+d[0]+0.1;
         *                     },
         *                     function() { return "length=" + JXG.toFixed(B.Dist(A), 2); }
         *                 ]);
         *
         *
         * board.update(); // This update is necessary to call updateDataArray the first time.
         *
         * </pre><div id="a61a4d66-e69f-11e5-b1bf-901b0e1b8723"  class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *      var board = JXG.JSXGraph.initBoard('a61a4d66-e69f-11e5-b1bf-901b0e1b8723',
         *             {boundingbox: [-4, 4, 4,-4], axis: true, showcopyright: false, shownavigation: false});
         *     var A = board.create('point', [-3,3]);
         *     var B = board.create('point', [3,-2]);
         *     var line = board.create('segment', [A,B]);
         *
         *     var height = 0.5; // height of the curly brace
         *
         *     // Curly brace
         *     var crl = board.create('curve', [[0],[0]], {strokeWidth:1, strokeColor:'black'});
         *     crl.bezierDegree = 3;
         *     crl.updateDataArray = function() {
         *         var d = [B.X()-A.X(), B.Y()-A.Y()],
         *             dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *             mid = [(A.X()+B.X())*0.5, (A.Y()+B.Y())*0.5];
         *
         *         d[0] *= height/dl;
         *         d[1] *= height/dl;
         *
         *         this.dataX = [ A.X(), A.X()-d[1], mid[0], mid[0]-d[1], mid[0], B.X()-d[1], B.X() ];
         *         this.dataY = [ A.Y(), A.Y()+d[0], mid[1], mid[1]+d[0], mid[1], B.Y()+d[0], B.Y() ];
         *     };
         *
         *     // Text
         *     var txt = board.create('text', [
         *                         function() {
         *                             var d = [B.X()-A.X(), B.Y()-A.Y()],
         *                                 dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *                                 mid = (A.X()+B.X())*0.5;
         *
         *                             d[1] *= height/dl;
         *                             return mid-d[1]+0.1;
         *                         },
         *                         function() {
         *                             var d = [B.X()-A.X(), B.Y()-A.Y()],
         *                                 dl = Math.sqrt(d[0]*d[0]+d[1]*d[1]),
         *                                 mid = (A.Y()+B.Y())*0.5;
         *
         *                             d[0] *= height/dl;
         *                             return mid+d[0]+0.1;
         *                         },
         *                         function() { return "length="+JXG.toFixed(B.Dist(A), 2); }
         *                     ]);
         *
         *
         *     board.update(); // This update is necessary to call updateDataArray the first time.
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        updateDataArray: function () {
            // this used to return this, but we shouldn't rely on the user to implement it.
        },

        /**
         * Computes for equidistant points on the x-axis the values
         * of the function.
         * If the mousemove event triggers this update, we use only few
         * points. Otherwise, e.g. on mouseup, many points are used.
         * @see JXG.Curve#update
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateCurve: function () {
            var len, mi, ma, x, y, i,
                //t1, t2, l1,
                suspendUpdate = false;

            this.updateTransformMatrix();
            this.updateDataArray();
            mi = this.minX();
            ma = this.maxX();

            // Discrete data points
            // x-coordinates are in an array
            if (Type.exists(this.dataX)) {
                this.numberPoints = this.dataX.length;
                len = this.numberPoints;

                // It is possible, that the array length has increased.
                this.allocatePoints();

                for (i = 0; i < len; i++) {
                    x = i;

                    // y-coordinates are in an array
                    if (Type.exists(this.dataY)) {
                        y = i;
                        // The last parameter prevents rounding in usr2screen().
                        this.points[i].setCoordinates(Const.COORDS_BY_USER, [this.dataX[i], this.dataY[i]], false);
                    } else {
                        // discrete x data, continuous y data
                        y = this.X(x);
                        // The last parameter prevents rounding in usr2screen().
                        this.points[i].setCoordinates(Const.COORDS_BY_USER, [this.dataX[i], this.Y(y, suspendUpdate)], false);
                    }
                    this.points[i]._t = i;

                    this.updateTransform(this.points[i]);
                    suspendUpdate = true;
                }
            // continuous x data
            } else {
                if (Type.evaluate(this.visProp.doadvancedplot)) {
                    this.updateParametricCurve(mi, ma);
                } else if (Type.evaluate(this.visProp.doadvancedplotold)) {
                    this.updateParametricCurveOld(mi, ma);
                } else {
                    if (this.board.updateQuality === this.board.BOARD_QUALITY_HIGH) {
                        this.numberPoints = Type.evaluate(this.visProp.numberpointshigh);
                    } else {
                        this.numberPoints = Type.evaluate(this.visProp.numberpointslow);
                    }

                    // It is possible, that the array length has increased.
                    this.allocatePoints();
                    this.updateParametricCurveNaive(mi, ma, this.numberPoints);
                }
                len = this.numberPoints;

                if (Type.evaluate(this.visProp.useqdt) &&
                    this.board.updateQuality === this.board.BOARD_QUALITY_HIGH) {
                    this.qdt = new QDT(this.board.getBoundingBox());
                    for (i = 0; i < this.points.length; i++) {
                        this.qdt.insert(this.points[i]);

                        if (i > 0) {
                            this.points[i].prev = this.points[i - 1];
                        }

                        if (i < len - 1) {
                            this.points[i].next = this.points[i + 1];
                        }
                    }
                }

                for (i = 0; i < len; i++) {
                    this.updateTransform(this.points[i]);
                }
            }

            if (Type.evaluate(this.visProp.curvetype) !== 'plot' &&
                    Type.evaluate(this.visProp.rdpsmoothing)) {
                this.points = Numerics.RamerDouglasPeucker(this.points, 0.2);
                this.numberPoints = this.points.length;
            }

            return this;
        },

        updateTransformMatrix: function () {
            var t, i,
                len = this.transformations.length;

            this.transformMat = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

            for (i = 0; i < len; i++) {
                t = this.transformations[i];
                t.update();
                this.transformMat = Mat.matMatMult(t.matrix, this.transformMat);
            }

            return this;
        },

        /**
         * Check if at least one point on the curve is finite and real.
         **/
        checkReal: function () {
            var b = false, i, p,
                len = this.numberPoints;

            for (i = 0; i < len; i++) {
                p = this.points[i].usrCoords;
                if (!isNaN(p[1]) && !isNaN(p[2]) && Math.abs(p[0]) > Mat.eps) {
                    b = true;
                    break;
                }
            }
            this.isReal = b;
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>false</tt>.
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @param {Number} len Number of data points
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurveNaive: function (mi, ma, len) {
            var i, t,
                suspendUpdate = false,
                stepSize = (ma - mi) / len;

            for (i = 0; i < len; i++) {
                t = mi + i * stepSize;
                // The last parameter prevents rounding in usr2screen().
                this.points[i].setCoordinates(Const.COORDS_BY_USER, [this.X(t, suspendUpdate), this.Y(t, suspendUpdate)], false);
                this.points[i]._t = t;
                suspendUpdate = true;
            }
            return this;
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>true</tt>.
         * Since 0.99 this algorithm is deprecated. It still can be used if {@link JXG.Curve#doadvancedplotold} is <tt>true</tt>.
         *
         * @deprecated
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurveOld: function (mi, ma) {
            var i, t, d,
                x, y, x0, y0, top, depth,
                MAX_DEPTH, MAX_XDIST, MAX_YDIST,
                suspendUpdate = false,
                po = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false),
                dyadicStack = [],
                depthStack = [],
                pointStack = [],
                divisors = [],
                distOK = false,
                j = 0,
                distFromLine = function (p1, p2, p0) {
                    var lbda, d,
                        x0 = p0[1] - p1[1],
                        y0 = p0[2] - p1[2],
                        x1 = p2[0] - p1[1],
                        y1 = p2[1] - p1[2],
                        den = x1 * x1 + y1 * y1;

                    if (den >= Mat.eps) {
                        lbda = (x0 * x1 + y0 * y1) / den;
                        if (lbda > 0) {
                            if (lbda <= 1) {
                                x0 -= lbda * x1;
                                y0 -= lbda * y1;
                            // lbda = 1.0;
                            } else {
                                x0 -= x1;
                                y0 -= y1;
                            }
                        }
                    }
                    d = x0 * x0 + y0 * y0;
                    return Math.sqrt(d);
                };

            JXG.deprecated('Curve.updateParametricCurveOld()');

            if (this.board.updateQuality === this.board.BOARD_QUALITY_LOW) {
                MAX_DEPTH = 15;
                MAX_XDIST = 10; // 10
                MAX_YDIST = 10; // 10
            } else {
                MAX_DEPTH = 21;
                MAX_XDIST = 0.7; // 0.7
                MAX_YDIST = 0.7; // 0.7
            }

            divisors[0] = ma - mi;
            for (i = 1; i < MAX_DEPTH; i++) {
                divisors[i] = divisors[i - 1] * 0.5;
            }

            i = 1;
            dyadicStack[0] = 1;
            depthStack[0] = 0;

            t = mi;
            po.setCoordinates(Const.COORDS_BY_USER, [this.X(t, suspendUpdate), this.Y(t, suspendUpdate)], false);

            // Now, there was a first call to the functions defining the curve.
            // Defining elements like sliders have been evaluated.
            // Therefore, we can set suspendUpdate to false, so that these defining elements
            // need not be evaluated anymore for the rest of the plotting.
            suspendUpdate = true;
            x0 = po.scrCoords[1];
            y0 = po.scrCoords[2];
            t0 = t;

            t = ma;
            po.setCoordinates(Const.COORDS_BY_USER, [this.X(t, suspendUpdate), this.Y(t, suspendUpdate)], false);
            x = po.scrCoords[1];
            y = po.scrCoords[2];

            pointStack[0] = [x, y];

            top = 1;
            depth = 0;

            this.points = [];
            this.points[j++] = new Coords(Const.COORDS_BY_SCREEN, [x0, y0], this.board, false);

            do {
                distOK = this.isDistOK(x - x0, y - y0, MAX_XDIST, MAX_YDIST) || this.isSegmentOutside(x0, y0, x, y);
                while (depth < MAX_DEPTH && (!distOK || depth < 6) && (depth <= 7 || this.isSegmentDefined(x0, y0, x, y))) {
                    // We jump out of the loop if
                    // * depth>=MAX_DEPTH or
                    // * (depth>=6 and distOK) or
                    // * (depth>7 and segment is not defined)

                    dyadicStack[top] = i;
                    depthStack[top] = depth;
                    pointStack[top] = [x, y];
                    top += 1;

                    i = 2 * i - 1;
                    // Here, depth is increased and may reach MAX_DEPTH
                    depth++;
                    // In that case, t is undefined and we will see a jump in the curve.
                    t = mi + i * divisors[depth];

                    po.setCoordinates(Const.COORDS_BY_USER, [this.X(t, suspendUpdate), this.Y(t, suspendUpdate)], false, true);
                    x = po.scrCoords[1];
                    y = po.scrCoords[2];
                    distOK = this.isDistOK(x - x0, y - y0, MAX_XDIST, MAX_YDIST) || this.isSegmentOutside(x0, y0, x, y);
                }

                if (j > 1) {
                    d = distFromLine(this.points[j - 2].scrCoords, [x, y], this.points[j - 1].scrCoords);
                    if (d < 0.015) {
                        j -= 1;
                    }
                }

                this.points[j] = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board, false);
                this.points[j]._t = t;
                j += 1;

                x0 = x;
                y0 = y;
                t0 = t;

                top -= 1;
                x = pointStack[top][0];
                y = pointStack[top][1];
                depth = depthStack[top] + 1;
                i = dyadicStack[top] * 2;

            } while (top > 0 && j < 500000);

            this.numberPoints = this.points.length;

            return this;
        },

        /**
         * Crude and cheap test if the segment defined by the two points <tt>(x0, y0)</tt> and <tt>(x1, y1)</tt> is
         * outside the viewport of the board. All parameters have to be given in screen coordinates.
         *
         * @private
         * @param {Number} x0
         * @param {Number} y0
         * @param {Number} x1
         * @param {Number} y1
         * @returns {Boolean} <tt>true</tt> if the given segment is outside the visible area.
         */
        isSegmentOutside: function (x0, y0, x1, y1) {
            return (y0 < 0 && y1 < 0) || (y0 > this.board.canvasHeight && y1 > this.board.canvasHeight) ||
                (x0 < 0 && x1 < 0) || (x0 > this.board.canvasWidth && x1 > this.board.canvasWidth);
        },

        /**
         * Compares the absolute value of <tt>dx</tt> with <tt>MAXX</tt> and the absolute value of <tt>dy</tt>
         * with <tt>MAXY</tt>.
         *
         * @private
         * @param {Number} dx
         * @param {Number} dy
         * @param {Number} MAXX
         * @param {Number} MAXY
         * @returns {Boolean} <tt>true</tt>, if <tt>|dx| &lt; MAXX</tt> and <tt>|dy| &lt; MAXY</tt>.
         */
        isDistOK: function (dx, dy, MAXX, MAXY) {
            return (Math.abs(dx) < MAXX && Math.abs(dy) < MAXY) && !isNaN(dx + dy);
        },

         /**
         * @private
         */
        isSegmentDefined: function (x0, y0, x1, y1) {
            return !(isNaN(x0 + y0) && isNaN(x1 + y1));
        },

        /**
         * Add a point to the curve plot. If the new point is too close to the previously inserted point,
         * it is skipped.
         * Used in {@link JXG.Curve._plotRecursive}.
         *
         * @private
         * @param {JXG.Coords} pnt Coords to add to the list of points
         */
        _insertPoint: function (pnt, t) {
            var lastReal = !isNaN(this._lastCrds[1] + this._lastCrds[2]),     // The last point was real
                newReal = !isNaN(pnt.scrCoords[1] + pnt.scrCoords[2]),        // New point is real point
                cw = this.board.canvasWidth,
                ch = this.board.canvasHeight,
                off = 500;

            newReal = newReal &&
                        (pnt.scrCoords[1] > -off && pnt.scrCoords[2] > -off &&
                         pnt.scrCoords[1] < cw + off && pnt.scrCoords[2] < ch + off);

            /*
             * Prevents two consecutive NaNs or points wich are too close
             */
            if ((!newReal && lastReal) ||
                    (newReal && (!lastReal ||
                        Math.abs(pnt.scrCoords[1] - this._lastCrds[1]) > 0.7 ||
                        Math.abs(pnt.scrCoords[2] - this._lastCrds[2]) > 0.7))) {
                pnt._t = t;
                this.points.push(pnt);
                this._lastCrds = pnt.copy('scrCoords');
            }
        },

        /**
         * Find the intersection of the asymptote for e.g. a log function
         * with the canvas.
         * @private
         * @param  {Array} asymptote Asymptote line in standard form
         * @param  {Array} box       Bounding box of the canavs
         * @param  {Number} direction horizontal direction of the asymptote. If < 0 the asymptote
         *  goes to the left, otherwise to the right.
         * @returns {Array}           Homogeneous coordinate array of the intersection point.
         */
        _intersectWithBorder: function(asymptote, box, direction) {
            var border, intersection, x, y;

            if (direction <= 0) { // Intersect with left border
                border = [-box[0], 1, 0];
                intersection = Mat.crossProduct(border, asymptote);
                if (intersection[0] !== 0.0) {
                    x = intersection[1] / intersection[0];
                    y = intersection[2] / intersection[0];
                } else {
                    y = Infinity;
                }

                if (y < box[3]) { // Intersect with bottom border
                    border = [-box[3], 0, 1];
                    intersection = Mat.crossProduct(border, asymptote);
                    if (intersection[0] !== 0.0) {
                        x = intersection[1] / intersection[0];
                        y = intersection[2] / intersection[0];
                    } else {
                        x = Infinity;
                    }
                } else if (y > box[1]) { // Intersect with top border
                    border = [-box[1], 0, 1];
                    intersection = Mat.crossProduct(border, asymptote);
                    if (intersection[0] !== 0.0) {
                        x = intersection[1] / intersection[0];
                        y = intersection[2] / intersection[0];
                    } else {
                        x = Infinity;
                    }
                }
            } else { // Intersect with right border
                border = [-box[2], 1, 0];
                intersection = Mat.crossProduct(border, asymptote);
                if (intersection[0] !== 0.0) {
                    x = intersection[1] / intersection[0];
                    y = intersection[2] / intersection[0];
                } else {
                    y = Infinity;
                }

                if (y < box[3]) { // Intersect with bottom border
                    border = [-box[3], 0, 1];
                    intersection = Mat.crossProduct(border, asymptote);
                    if (intersection[0] !== 0.0) {
                        x = intersection[1] / intersection[0];
                        y = intersection[2] / intersection[0];
                    } else {
                        x = Infinity;
                    }
                } else if (y > box[1]) { // Intersect with top border
                    border = [-box[1], 0, 1];
                    intersection = Mat.crossProduct(border, asymptote);
                    if (intersection[0] !== 0.0) {
                        x = intersection[1] / intersection[0];
                        y = intersection[2] / intersection[0];
                    } else {
                        x = Infinity;
                    }
                }
            }
            return [1, x, y];
        },

        /**
         * Investigate a function term at the bounds of intervals where
         * the function is not defined, e.g. log(x) at x = 0.
         *
         * c is inbetween a and b
         * @private
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Array} c Screen coordinates of the bisection point at (ta + tb) / 2
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} tc (ta + tb) / 2 = tc. Parameter which evaluates to b, i.e. [1, X(tc), Y(tc)] = c in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @returns {JXG.Boolean} true if the point is inserted and the recursion should stop, false otherwise.
         */
         _borderCase: function (a, b, c, ta, tb, tc, depth) {
             var t, pnt, p,
                 p_good = null,
                 j,
                 max_it = 30,
                 is_undef = false,
                 t_nan, t_real, t_real2,
                 box,
                 vx, vy, vx2, vy2, dx, dy,
                 asymptote;


             if (depth <= 1) {
                pnt = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false);
                j = 0;
                // Bisect a, b and c until the point t_real is inside of the definition interval
                // and as close as possible at the boundary.
                // t_real2 is the second closest point.
                do {
                    // There are four cases:
                    //  a  |  c  |  b
                    // ---------------
                    // inf | R   | R
                    // R   | R   | inf
                    // inf | inf | R
                    // R   | inf | inf
                    //
                    if (isNaN(a[1] + a[2]) && !isNaN(c[1] + c[2])) {
                        t_nan = ta;
                        t_real = tc;
                        t_real2 = tb;
                    } else if (isNaN(b[1] + b[2]) && !isNaN(c[1] + c[2])) {
                        t_nan = tb;
                        t_real = tc;
                        t_real2 = ta;
                    } else if (isNaN(c[1] + c[2]) && !isNaN(b[1] + b[2])) {
                        t_nan = tc;
                        t_real = tb;
                        t_real2 = tb + (tb - tc);
                    } else if (isNaN(c[1] + c[2]) && !isNaN(a[1] + a[2])) {
                        t_nan = tc;
                        t_real = ta;
                        t_real2 = ta - (tc - ta);
                    } else {
                        return false;
                    }
                    t = 0.5 * (t_nan + t_real);
                    pnt.setCoordinates(Const.COORDS_BY_USER, [this.X(t, true), this.Y(t, true)], false);
                    p = pnt.usrCoords;

                    is_undef = isNaN(p[1] + p[2]);
                    if (is_undef) {
                        t_nan = t;
                    } else {
                        t_real2 = t_real;
                        t_real = t;
                    }
                    ++j;
                } while (is_undef && j < max_it);

                // If bisection was successful, take this point.
                // Usefule only for general curves, for function graph
                // the code below overwrite p_good from here.
                if (j < max_it) {
                    p_good = p.slice();
                    c = p.slice();
                    t_real = t;
                }

                // OK, bisection has been done now.
                // t_real contains the closest inner point to the border of the interval we could find.
                // t_real2 is the second nearest point to this boundary.
                // Now we approximate the derivative by computing the slope of the line through these two points
                // and test if it is "infinite", i.e larger than 400 in absolute values.
                //
                vx = this.X(t_real, true) ;
                vx2 = this.X(t_real2, true) ;
                dx = (vx - vx2) / (t_real - t_real2);
                vy = this.Y(t_real, true) ;
                vy2 = this.Y(t_real2, true) ;
                dy = (vy - vy2) / (t_real - t_real2);

                // If the derivatives are large enough we draw the asymptote.
                box = this.board.getBoundingBox();
                if (Math.sqrt(dx * dx + dy * dy) > 500.0) {

                    // The asymptote is a line of the form
                    //  [c, a, b] = [dx * vy - dy * vx, dy, -dx]
                    //  Now we have to find the intersection with the correct canvas border.
                    asymptote = [dx * vy - dy * vx, dy, -dx];

                    p_good = this._intersectWithBorder(asymptote, box, vx - vx2);
                }

                if (p_good !== null) {
                    this._insertPoint(new Coords(Const.COORDS_BY_USER, p_good, this.board, false));
                    return true;
                }
            }
            return false;
        },

        /**
         * Compute distances in screen coordinates between the points ab,
         * ac, cb, and cd, where d = (a + b)/2.
         * cd is used for the smoothness test, ab, ac, cb are used to detect jumps, cusps and poles.
         *
         * @private
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Array} c Screen coordinates of the bisection point at (ta + tb) / 2
         * @returns {Array} array of distances in screen coordinates between: ab, ac, cb, and cd.
         */
        _triangleDists: function (a, b, c) {
            var d, d_ab, d_ac, d_cb, d_cd;

            d = [a[0] * b[0], (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5];

            d_ab = Geometry.distance(a, b, 3);
            d_ac = Geometry.distance(a, c, 3);
            d_cb = Geometry.distance(c, b, 3);
            d_cd = Geometry.distance(c, d, 3);

            return [d_ab, d_ac, d_cb, d_cd];
        },

        /**
         * Test if the function is undefined on an interval:
         * If the interval borders a and b are undefined, 20 random values
         * are tested if they are undefined, too.
         * Only if all values are undefined, we declare the function to be undefined in this interval.
         *
         * @private
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         */
        _isUndefined: function (a, ta, b, tb) {
            var t, i, pnt;

            if (!isNaN(a[1] + a[2]) || !isNaN(b[1] + b[2])) {
                return false;
            }

            pnt = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false);

            for (i = 0; i < 20; ++i) {
                t = ta + Math.random() * (tb - ta);
                pnt.setCoordinates(Const.COORDS_BY_USER, [this.X(t, true), this.Y(t, true)], false);
                if (!isNaN(pnt.scrCoords[0] + pnt.scrCoords[1] + pnt.scrCoords[2])) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Decide if a path segment is too far from the canvas that we do not need to draw it.
         * @param  {Array}  a  Screen coordinates of the start point of the segment
         * @param  {Array}  ta Curve parameter of a.
         * @param  {Array}  b  Screen coordinates of the end point of the segment
         * @param  {Array}  tb Curve parameter of b.
         * @returns {Boolean}   True if the segment is too far away from the canvas, false otherwise.
         */
        _isOutside: function (a, ta, b, tb) {
            var off = 500,
                cw = this.board.canvasWidth,
                ch = this.board.canvasHeight;

            return !!((a[1] < -off && b[1] < -off) ||
                (a[2] < -off && b[2] < -off) ||
                (a[1] > cw + off && b[1] > cw + off) ||
                (a[2] > ch + off && b[2] > ch + off));
        },

        /**
         * Recursive interval bisection algorithm for curve plotting.
         * Used in {@link JXG.Curve.updateParametricCurve}.
         * @private
         * @param {Array} a Screen coordinates of the left interval bound
         * @param {Number} ta Parameter which evaluates to a, i.e. [1, X(ta), Y(ta)] = a in screen coordinates
         * @param {Array} b Screen coordinates of the right interval bound
         * @param {Number} tb Parameter which evaluates to b, i.e. [1, X(tb), Y(tb)] = b in screen coordinates
         * @param {Number} depth Actual recursion depth. The recursion stops if depth is equal to 0.
         * @param {Number} delta If the distance of the bisection point at (ta + tb) / 2 from the point (a + b) / 2 is less then delta,
         *                 the segment [a,b] is regarded as straight line.
         * @returns {JXG.Curve} Reference to the curve object.
         */
        _plotRecursive: function (a, ta, b, tb, depth, delta) {
            var tc, c,
                ds, mindepth = 0,
                isSmooth, isJump, isCusp,
                cusp_threshold = 0.5,
                pnt = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false);

            if (this.numberPoints > 65536) {
                return;
            }

            // Test if the function is undefined on an interval
            if (depth < this.nanLevel && this._isUndefined(a, ta, b, tb)) {
                return this;
            }

            if (depth < this.nanLevel && this._isOutside(a, ta, b, tb)) {
                return this;
            }

            tc = 0.5 * (ta  + tb);
            pnt.setCoordinates(Const.COORDS_BY_USER, [this.X(tc, true), this.Y(tc, true)], false);
            c = pnt.scrCoords;

            if (this._borderCase(a, b, c, ta, tb, tc, depth)) {
                return this;
            }

            ds = this._triangleDists(a, b, c);           // returns [d_ab, d_ac, d_cb, d_cd]
            isSmooth = (depth < this.smoothLevel) && (ds[3] < delta);

            isJump = (depth < this.jumpLevel) &&
                        ((ds[2] > 0.99 * ds[0]) || (ds[1] > 0.99 * ds[0]) ||
                        ds[0] === Infinity || ds[1] === Infinity || ds[2] === Infinity);
            isCusp = (depth < this.smoothLevel + 2) && (ds[0] < cusp_threshold * (ds[1] + ds[2]));

            if (isCusp) {
                mindepth = 0;
                isSmooth = false;
            }

            --depth;

            if (isJump) {
                this._insertPoint(new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], this.board, false), tc);
            } else if (depth <= mindepth || isSmooth) {
                this._insertPoint(pnt, tc);
                //if (this._borderCase(a, b, c, ta, tb, tc, depth)) {}
            } else {
                this._plotRecursive(a, ta, c, tc, depth, delta);
                this._insertPoint(pnt, tc);
                this._plotRecursive(c, tc, b, tb, depth, delta);
            }

            return this;
        },

        /**
         * Updates the data points of a parametric curve. This version is used if {@link JXG.Curve#doadvancedplot} is <tt>true</tt>.
         * @param {Number} mi Left bound of curve
         * @param {Number} ma Right bound of curve
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateParametricCurve: function (mi, ma) {
            var ta, tb, a, b,
                suspendUpdate = false,
                pa = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false),
                pb = new Coords(Const.COORDS_BY_USER, [0, 0], this.board, false),
                depth, delta;

            if (this.board.updateQuality === this.board.BOARD_QUALITY_LOW) {
                depth = Type.evaluate(this.visProp.recursiondepthlow) || 13;
                delta = 2;
                this.smoothLevel = 5; //depth - 7;
                this.jumpLevel = 5;
            } else {
                depth = Type.evaluate(this.visProp.recursiondepthhigh) || 17;
                delta = 2;
                // smoothLevel has to be small for graphs in a huge interval.
                this.smoothLevel = 3; //depth - 7; // 9
                this.jumpLevel = 3;
            }
            this.nanLevel = depth - 4;

            this.points = [];

            ta = mi;
            pa.setCoordinates(Const.COORDS_BY_USER, [this.X(ta, suspendUpdate), this.Y(ta, suspendUpdate)], false);
            a = pa.copy('scrCoords');
            suspendUpdate = true;

            tb = ma;
            pb.setCoordinates(Const.COORDS_BY_USER, [this.X(tb, suspendUpdate), this.Y(tb, suspendUpdate)], false);
            b = pb.copy('scrCoords');

            pa._t = ta;
            this.points.push(pa);
            this._lastCrds = pa.copy('scrCoords');   //Used in _insertPoint
            this._plotRecursive(a, ta, b, tb, depth, delta);
            pb._t = tb;
            this.points.push(pb);

            this.numberPoints = this.points.length;

            return this;
        },

        /**
         * Applies the transformations of the curve to the given point <tt>p</tt>.
         * Before using it, {@link JXG.Curve#updateTransformMatrix} has to be called.
         * @param {JXG.Point} p
         * @returns {JXG.Point} The given point.
         */
        updateTransform: function (p) {
            var c,
                len = this.transformations.length;

            if (len > 0) {
                c = Mat.matVecMult(this.transformMat, p.usrCoords);
                p.setCoordinates(Const.COORDS_BY_USER, [c[1], c[2]], false, true);
            }

            return p;
        },

        /**
         * Add transformations to this curve.
         * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation} or an array of {@link JXG.Transformation}s.
         * @returns {JXG.Curve} Reference to the curve object.
         */
        addTransform: function (transform) {
            var i,
                list = Type.isArray(transform) ? transform : [transform],
                len = list.length;

            for (i = 0; i < len; i++) {
                this.transformations.push(list[i]);
            }

            return this;
        },

        /**
         * Generate the method curve.X() in case curve.dataX is an array
         * and generate the method curve.Y() in case curve.dataY is an array.
         * @private
         * @param {String} which Either 'X' or 'Y'
         * @returns {function}
         **/
        interpolationFunctionFromArray: function (which) {
            var data = 'data' + which;

            return function (t, suspendedUpdate) {
                var i, j, t0, t1,
                    arr = this[data],
                    len = arr.length,
                    f = [];

                if (isNaN(t)) {
                    return NaN;
                }

                if (t < 0) {
                    if (Type.isFunction(arr[0])) {
                        return arr[0]();
                    }

                    return arr[0];
                }

                if (this.bezierDegree === 3) {
                    len /= 3;
                    if (t >= len) {
                        if (Type.isFunction(arr[arr.length - 1])) {
                            return arr[arr.length - 1]();
                        }

                        return arr[arr.length - 1];
                    }

                    i = Math.floor(t) * 3;
                    t0 = t % 1;
                    t1 = 1 - t0;

                    for (j = 0; j < 4; j++) {
                        if (Type.isFunction(arr[i + j])) {
                            f[j] = arr[i + j]();
                        } else {
                            f[j] = arr[i + j];
                        }
                    }

                    return t1 * t1 * (t1 * f[0] + 3 * t0 * f[1]) + (3 * t1 * f[2] + t0 * f[3]) * t0 * t0;
                }

                if (t > len - 2) {
                    i = len - 2;
                } else {
                    i = parseInt(Math.floor(t), 10);
                }

                if (i === t) {
                    if (Type.isFunction(arr[i])) {
                        return arr[i]();
                    }
                    return arr[i];
                }

                for (j = 0; j < 2; j++) {
                    if (Type.isFunction(arr[i + j])) {
                        f[j] = arr[i + j]();
                    } else {
                        f[j] = arr[i + j];
                    }
                }
                return f[0] + (f[1] - f[0]) * (t - i);
            };
        },

        /**
         * Converts the GEONExT syntax of the defining function term into JavaScript.
         * New methods X() and Y() for the Curve object are generated, further
         * new methods for minX() and maxX().
         * @see JXG.GeonextParser.geonext2JS.
         */
        generateTerm: function (varname, xterm, yterm, mi, ma) {
            var fx, fy;

            // Generate the methods X() and Y()
            if (Type.isArray(xterm)) {
                // Discrete data
                this.dataX = xterm;

                this.numberPoints = this.dataX.length;
                this.X = this.interpolationFunctionFromArray('X');
                this.visProp.curvetype = 'plot';
                this.isDraggable = true;
            } else {
                // Continuous data
                this.X = Type.createFunction(xterm, this.board, varname);
                if (Type.isString(xterm)) {
                    this.visProp.curvetype = 'functiongraph';
                } else if (Type.isFunction(xterm) || Type.isNumber(xterm)) {
                    this.visProp.curvetype = 'parameter';
                }

                this.isDraggable = true;
            }

            if (Type.isArray(yterm)) {
                this.dataY = yterm;
                this.Y = this.interpolationFunctionFromArray('Y');
            } else {
                this.Y = Type.createFunction(yterm, this.board, varname);
            }

            /**
             * Polar form
             * Input data is function xterm() and offset coordinates yterm
             */
            if (Type.isFunction(xterm) && Type.isArray(yterm)) {
                // Xoffset, Yoffset
                fx = Type.createFunction(yterm[0], this.board, '');
                fy = Type.createFunction(yterm[1], this.board, '');

                this.X = function (phi) {
                    return xterm(phi) * Math.cos(phi) + fx();
                };

                this.Y = function (phi) {
                    return xterm(phi) * Math.sin(phi) + fy();
                };

                this.visProp.curvetype = 'polar';
            }

            // Set the bounds lower bound
            if (Type.exists(mi)) {
                this.minX = Type.createFunction(mi, this.board, '');
            }
            if (Type.exists(ma)) {
                this.maxX = Type.createFunction(ma, this.board, '');
            }
        },

        /**
         * Finds dependencies in a given term and notifies the parents by adding the
         * dependent object to the found objects child elements.
         * @param {String} contentStr String containing dependencies for the given object.
         */
        notifyParents: function (contentStr) {
            var fstr, dep,
                isJessieCode = false,
                obj;

            // Read dependencies found by the JessieCode parser
            obj = {'xterm': 1, 'yterm': 1};
            for (fstr in obj) {
                if (obj.hasOwnProperty(fstr) && this.hasOwnProperty(fstr) && this[fstr].origin) {
                    isJessieCode = true;
                    for (dep in this[fstr].origin.deps) {
                        if (this[fstr].origin.deps.hasOwnProperty(dep)) {
                            this[fstr].origin.deps[dep].addChild(this);
                        }
                    }
                }
            }

            if (!isJessieCode) {
                GeonextParser.findDependencies(this, contentStr, this.board);
            }
        },

        // documented in geometry element
        getLabelAnchor: function () {
            var c, x, y,
                ax = 0.05 * this.board.canvasWidth,
                ay = 0.05 * this.board.canvasHeight,
                bx = 0.95 * this.board.canvasWidth,
                by = 0.95 * this.board.canvasHeight;

            switch (Type.evaluate(this.visProp.label.position)) {
            case 'ulft':
                x = ax;
                y = ay;
                break;
            case 'llft':
                x = ax;
                y = by;
                break;
            case 'rt':
                x = bx;
                y = 0.5 * by;
                break;
            case 'lrt':
                x = bx;
                y = by;
                break;
            case 'urt':
                x = bx;
                y = ay;
                break;
            case 'top':
                x = 0.5 * bx;
                y = ay;
                break;
            case 'bot':
                x = 0.5 * bx;
                y = by;
                break;
            default:
                // includes case 'lft'
                x = ax;
                y = 0.5 * by;
            }

            c = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board, false);
            return Geometry.projectCoordsToCurve(c.usrCoords[1], c.usrCoords[2], 0, this, this.board)[0];
        },

        // documented in geometry element
        cloneToBackground: function () {
            var er,
                copy = {
                    id: this.id + 'T' + this.numTraces,
                    elementClass: Const.OBJECT_CLASS_CURVE,

                    points: this.points.slice(0),
                    bezierDegree: this.bezierDegree,
                    numberPoints: this.numberPoints,
                    board: this.board,
                    visProp: Type.deepCopy(this.visProp, this.visProp.traceattributes, true)
                };

            copy.visProp.layer = this.board.options.layer.trace;
            copy.visProp.curvetype = this.visProp.curvetype;
            this.numTraces++;

            Type.clearVisPropOld(copy);
            copy.visPropCalc = {
                visible: Type.evaluate(copy.visProp.visible)
            };
            er = this.board.renderer.enhancedRendering;
            this.board.renderer.enhancedRendering = true;
            this.board.renderer.drawCurve(copy);
            this.board.renderer.enhancedRendering = er;
            this.traces[copy.id] = copy.rendNode;

            return this;
        },

        // already documented in GeometryElement
        bounds: function () {
            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity,
                l = this.points.length, i,
                bezier, up;

            if (this.bezierDegree === 3) {
                // Add methods X(), Y()
                for (i = 0; i < l; i++) {
                    this.points[i].X = Type.bind(function() { return this.usrCoords[1]; }, this.points[i]);
                    this.points[i].Y = Type.bind(function() { return this.usrCoords[2]; }, this.points[i]);
                }
                bezier = Numerics.bezier(this.points);
                up = bezier[3]();
                minX = Numerics.fminbr(function(t) { return bezier[0](t); }, [0, up]);
                maxX = Numerics.fminbr(function(t) { return -bezier[0](t); }, [0, up]);
                minY = Numerics.fminbr(function(t) { return bezier[1](t); }, [0, up]);
                maxY = Numerics.fminbr(function(t) { return -bezier[1](t); }, [0, up]);

                minX = bezier[0](minX);
                maxX = bezier[0](maxX);
                minY = bezier[1](minY);
                maxY = bezier[1](maxY);
                return [minX, maxY, maxX, minY];
            }

            // Linear segments
            for (i = 0; i < l; i++) {
                if (minX > this.points[i].usrCoords[1]) {
                    minX = this.points[i].usrCoords[1];
                }

                if (maxX < this.points[i].usrCoords[1]) {
                    maxX = this.points[i].usrCoords[1];
                }

                if (minY > this.points[i].usrCoords[2]) {
                    minY = this.points[i].usrCoords[2];
                }

                if (maxY < this.points[i].usrCoords[2]) {
                    maxY = this.points[i].usrCoords[2];
                }
            }

            return [minX, maxY, maxX, minY];
        },

        // documented in element.js
        getParents: function () {
            var p = [this.xterm, this.yterm, this.minX(), this.maxX()];

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        },

        /**
         * Shift the curve by the vector 'where'.
         *
         * @param {Array} where Array containing the x and y coordinate of the target location.
         * @returns {JXG.Curve} Reference to itself.
         */
        moveTo: function(where) {
            // TODO add animation
            var delta = [], p;
            if (this.points.length > 0 && !Type.evaluate(this.visProp.fixed)) {
                p = this.points[0];
                if (where.length === 3) {
                    delta = [where[0] - p.usrCoords[0],
                            where[1] - p.usrCoords[1],
                            where[2] - p.usrCoords[2]];
                } else {
                    delta = [where[0] - p.usrCoords[1],
                            where[1] - p.usrCoords[2]];
                }
                this.setPosition(Const.COORDS_BY_USER, delta);
            }
            return this;
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
     *  <li> data plots: plot line segments through a given list of coordinates.
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
     * <p>
     * Additionally, a curve can be created by providing a curve and a transformation (or an array of transformations).
     * The result is a curve which is the transformation of the supplied curve.
     *
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
     * </pre><div class="jxgbox" id="af9f818b-f3b6-4c4d-8c4c-e4a4078b726d" style="width: 300px; height: 300px;"></div>
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
     * </pre><div class="jxgbox" id="7dcbb00e-b6ff-481d-b4a8-887f5d8c6a83" style="width: 300px; height: 300px;"></div>
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
     *                         0, 2*Math.PI],
     *                         {curveType: 'polar'}
     *                     );
     * </pre><div class="jxgbox" id="d0bc7a2a-8124-45ca-a6e7-142321a8f8c2" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var c2_board = JXG.JSXGraph.initBoard('d0bc7a2a-8124-45ca-a6e7-142321a8f8c2', {boundingbox: [-3,3,3,-3], axis: true, showcopyright: false, shownavigation: false});
     *   var a = c2_board.create('slider',[[0,2],[2,2],[0,1,2]]);
     *   var graph2 = c2_board.create('curve', [function(phi){ return a.Value()*(1-Math.cos(phi));}, [1,0], 0, 2*Math.PI], {curveType: 'polar'});
     * </script><pre>
     *
     * @example
     *  // Draggable Bezier curve
     *  var col, p, c;
     *  col = 'blue';
     *  p = [];
     *  p.push(board.create('point',[-2, -1 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[1, 2.5 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[-1, -2.5 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[2, -2], {size: 5, strokeColor:col, fillColor:col}));
     *
     *  c = board.create('curve', JXG.Math.Numerics.bezier(p),
     *              {strokeColor:'red', name:"curve", strokeWidth:5, fixed: false}); // Draggable curve
     *  c.addParents(p);
     * </pre><div class="jxgbox" id="7bcc6280-f6eb-433e-8281-c837c3387849" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function(){
     *  var board, col, p, c;
     *  board = JXG.JSXGraph.initBoard('7bcc6280-f6eb-433e-8281-c837c3387849', {boundingbox: [-3,3,3,-3], axis: true, showcopyright: false, shownavigation: false});
     *  col = 'blue';
     *  p = [];
     *  p.push(board.create('point',[-2, -1 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[1, 2.5 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[-1, -2.5 ], {size: 5, strokeColor:col, fillColor:col}));
     *  p.push(board.create('point',[2, -2], {size: 5, strokeColor:col, fillColor:col}));
     *
     *  c = board.create('curve', JXG.Math.Numerics.bezier(p),
     *              {strokeColor:'red', name:"curve", strokeWidth:5, fixed: false}); // Draggable curve
     *  c.addParents(p);
     * })();
     * </script><pre>
     *
     * @example
     *         // The curve cu2 is the reflection of cu1 against line li
     *         var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
     *         var reflect = board.create('transform', [li], {type: 'reflect'});
     *         var cu1 = board.create('curve', [[-1, -1, -0.5, -1, -1, -0.5], [-3, -2, -2, -2, -2.5, -2.5]]);
     *         var cu2 = board.create('curve', [cu1, reflect], {strokeColor: 'red'});
     *
     * </pre><div id="866dc7a2-d448-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('866dc7a2-d448-11e7-93b3-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *             var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
     *             var reflect = board.create('transform', [li], {type: 'reflect'});
     *             var cu1 = board.create('curve', [[-1, -1, -0.5, -1, -1, -0.5], [-3, -2, -2, -2, -2.5, -2.5]]);
     *             var cu2 = board.create('curve', [cu1, reflect], {strokeColor: 'red'});
     *
     *     })();
     *
     * </script><pre>
     */
    JXG.createCurve = function (board, parents, attributes) {
        var obj, cu,
            attr = Type.copyAttributes(attributes, board.options, 'curve');

        obj = board.select(parents[0]);
        if (Type.isObject(obj) &&
            (obj.type === Const.OBJECT_TYPE_CURVE ||
             obj.type === Const.OBJECT_TYPE_ANGLE ||
             obj.type === Const.OBJECT_TYPE_ARC   ||
             obj.type === Const.OBJECT_TYPE_CONIC ||
             obj.type === Const.OBJECT_TYPE_SECTOR) &&
            Type.isTransformationOrArray(parents[1])) {

            if (obj.type === Const.OBJECT_TYPE_SECTOR) {
                attr = Type.copyAttributes(attributes, board.options, 'sector');
            } else if (obj.type === Const.OBJECT_TYPE_ARC) {
                attr = Type.copyAttributes(attributes, board.options, 'arc');
            } else if (obj.type === Const.OBJECT_TYPE_ANGLE) {
                if (!Type.exists(attributes.withLabel)) {
                    attributes.withLabel = false;
                }
                attr = Type.copyAttributes(attributes, board.options, 'angle');
            } else {
                attr = Type.copyAttributes(attributes, board.options, 'curve');
            }
            attr = Type.copyAttributes(attr, board.options, 'curve');

            cu = new JXG.Curve(board, ['x', [], []], attr);
            cu.updateDataArray = function() {
                    var i, le = obj.numberPoints;
                    this.bezierDegree = obj.bezierDegree;
                    this.dataX = [];
                    this.dataY = [];
                    for (i = 0; i < le; i++) {
                        this.dataX.push(obj.points[i].usrCoords[1]);
                        this.dataY.push(obj.points[i].usrCoords[2]);
                    }
                    return this;
                };
            cu.addTransform(parents[1]);
            return cu;
        } else {
            attr = Type.copyAttributes(attributes, board.options, 'curve');
            return new JXG.Curve(board, ['x'].concat(parents), attr);
        }
    };

    JXG.registerElement('curve', JXG.createCurve);

    /**
     * @class This element is used to provide a constructor for functiongraph,
     * which is just a wrapper for element {@link Curve} with {@link JXG.Curve#X}()
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
     * </pre><div class="jxgbox" id="efd432b5-23a3-4846-ac5b-b471e668b437" style="width: 300px; height: 300px;"></div>
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
     * </pre><div class="jxgbox" id="4a203a84-bde5-4371-ad56-44619690bb50" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var alex2_board = JXG.JSXGraph.initBoard('4a203a84-bde5-4371-ad56-44619690bb50', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     *   var s = alex2_board.create('slider',[[0,4],[3,4],[-2,4,5]]);
     *   var graph = alex2_board.create('functiongraph', [function(x){ return 0.5*x*x-2*x;}, -2, function(){return s.Value();}]);
     * </script><pre>
     */
    JXG.createFunctiongraph = function (board, parents, attributes) {
        var attr,
            par = ['x', 'x'].concat(parents);

        attr = Type.copyAttributes(attributes, board.options, 'curve');
        attr.curvetype = 'functiongraph';
        return new JXG.Curve(board, par, attr);
    };

    JXG.registerElement('functiongraph', JXG.createFunctiongraph);
    JXG.registerElement('plot', JXG.createFunctiongraph);

    /**
     * @class This element is used to provide a constructor for (natural) cubic spline curves.
     * Create a dynamic spline interpolated curve given by sample points p_1 to p_n.
     * @pseudo
     * @description
     * @name Spline
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {JXG.Board} board Reference to the board the spline is drawn on.
     * @param {Array} parents Array of points the spline interpolates. This can be
     *   <ul>
     *   <li> an array of JXGGraph points</li>
     *   <li> an array of coordinate pairs</li>
     *   <li> an array of functions returning coordinate pairs</li>
     *   <li> an array consisting of an array with x-coordinates and an array of y-coordinates</li>
     *   </ul>
     *   All individual entries of coordinates arrays may be numbers or functions returning numbers.
     * @param {Object} attributes Define color, width, ... of the spline
     * @returns {JXG.Curve} Returns reference to an object of type JXG.Curve.
     * @see JXG.Curve
     * @example
     *
     * var p = [];
     * p[0] = board.create('point', [-2,2], {size: 4, face: 'o'});
     * p[1] = board.create('point', [0,-1], {size: 4, face: 'o'});
     * p[2] = board.create('point', [2,0], {size: 4, face: 'o'});
     * p[3] = board.create('point', [4,1], {size: 4, face: 'o'});
     *
     * var c = board.create('spline', p, {strokeWidth:3});
     * </pre><div id="6c197afc-e482-11e5-b1bf-901b0e1b8723" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('6c197afc-e482-11e5-b1bf-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *
     *     var p = [];
     *     p[0] = board.create('point', [-2,2], {size: 4, face: 'o'});
     *     p[1] = board.create('point', [0,-1], {size: 4, face: 'o'});
     *     p[2] = board.create('point', [2,0], {size: 4, face: 'o'});
     *     p[3] = board.create('point', [4,1], {size: 4, face: 'o'});
     *
     *     var c = board.create('spline', p, {strokeWidth:3});
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createSpline = function (board, parents, attributes) {
        var el, f;

        f = function () {
            var D, x = [], y = [];

            return function (t, suspended) {
                var i, j, c;

                if (!suspended) {
                    x = [];
                    y = [];

                    // given as [x[], y[]]
                    if (parents.length === 2 && Type.isArray(parents[0]) && Type.isArray(parents[1]) && parents[0].length === parents[1].length) {
                        for (i = 0; i < parents[0].length; i++) {
                            if (Type.isFunction(parents[0][i])) {
                                x.push(parents[0][i]());
                            } else {
                                x.push(parents[0][i]);
                            }

                            if (Type.isFunction(parents[1][i])) {
                                y.push(parents[1][i]());
                            } else {
                                y.push(parents[1][i]);
                            }
                        }
                    } else {
                        for (i = 0; i < parents.length; i++) {
                            if (Type.isPoint(parents[i])) {
                                x.push(parents[i].X());
                                y.push(parents[i].Y());
                            // given as [[x1,y1], [x2, y2], ...]
                            } else if (Type.isArray(parents[i]) && parents[i].length === 2) {
                                for (j = 0; j < parents.length; j++) {
                                    if (Type.isFunction(parents[j][0])) {
                                        x.push(parents[j][0]());
                                    } else {
                                        x.push(parents[j][0]);
                                    }

                                    if (Type.isFunction(parents[j][1])) {
                                        y.push(parents[j][1]());
                                    } else {
                                        y.push(parents[j][1]);
                                    }
                                }
                            } else if (Type.isFunction(parents[i]) && parents[i]().length === 2) {
                                c = parents[i]();
                                x.push(c[0]);
                                y.push(c[1]);
                            }
                        }
                    }

                    // The array D has only to be calculated when the position of one or more sample points
                    // changes. Otherwise D is always the same for all points on the spline.
                    D = Numerics.splineDef(x, y);
                }
                return Numerics.splineEval(t, x, y, D);
            };
        };

        attributes = Type.copyAttributes(attributes, board.options, 'curve');
        attributes.curvetype = 'functiongraph';
        el = new JXG.Curve(board, ['x', 'x', f()], attributes);
        el.setParents(parents);
        el.elType = 'spline';

        return el;
    };

    /**
     * Register the element type spline at JSXGraph
     * @private
     */
    JXG.registerElement('spline', JXG.createSpline);

    /**
     * @class This element is used to provide a constructor for cardinal spline curves.
     * Create a dynamic cardinal spline interpolated curve given by sample points p_1 to p_n.
     * @pseudo
     * @description
     * @name Cardinalspline
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {JXG.Board} board Reference to the board the cardinal spline is drawn on.
     * @param {Array} parents Array with three entries.
     * <p>
     *   First entry: Array of points the spline interpolates. This can be
     *   <ul>
     *   <li> an array of JXGGraph points</li>
     *   <li> an array of coordinate pairs</li>
     *   <li> an array of functions returning coordinate pairs</li>
     *   <li> an array consisting of an array with x-coordinates and an array of y-coordinates</li>
     *   </ul>
     *   All individual entries of coordinates arrays may be numbers or functions returning numbers.
     *   <p>
     *   Second entry: tau number or function
     *   <p>
     *   Third entry: type string containing 'uniform' (default) or 'centripetal'.
     * @param {Object} attributes Define color, width, ... of the cardinal spline
     * @returns {JXG.Curve} Returns reference to an object of type JXG.Curve.
     * @see JXG.Curve
     */
    JXG.createCardinalSpline = function (board, parents, attributes) {
        var el,
            points, tau, type,
            p, q, i, le,
            splineArr,
            errStr = "\nPossible parent types: [points:array, tau:number|function, type:string]";

        if (!Type.exists(parents[0]) || !Type.isArray(parents[0])) {
            throw new Error("JSXGraph: JXG.createCardinalSpline: argument 1 'points' has to be array of points or coordinate pairs" + errStr);
        }
        if (!Type.exists(parents[1]) || (!Type.isNumber(parents[1]) && !Type.isFunction(parents[1]))) {
            throw new Error("JSXGraph: JXG.createCardinalSpline: argument 2 'tau' has to be number between [0,1] or function'" + errStr);
        }
        if (!Type.exists(parents[2]) || !Type.isString(parents[2])) {
            throw new Error("JSXGraph: JXG.createCardinalSpline: argument 3 'type' has to be string 'uniform' or 'centripetal'" + errStr);
        }

        attributes = Type.copyAttributes(attributes, board.options, 'curve');
        attributes = Type.copyAttributes(attributes, board.options, 'cardinalspline');
        attributes.curvetype = 'parameter';

        p = parents[0];
        q = [];

        // given as [x[], y[]]
        if (!attributes.isarrayofcoordinates &&
            p.length === 2 && Type.isArray(p[0]) && Type.isArray(p[1]) &&
            p[0].length === p[1].length) {
            for (i = 0; i < p[0].length; i++) {
                q[i] = [];
                if (Type.isFunction(p[0][i])) {
                    q[i].push(p[0][i]());
                } else {
                    q[i].push(p[0][i]);
                }

                if (Type.isFunction(p[1][i])) {
                    q[i].push(p[1][i]());
                } else {
                    q[i].push(p[1][i]);
                }
            }
        } else {
            // given as [[x0, y0], [x1, y1], point, ...]
            for (i = 0; i < p.length; i++) {
                if (Type.isString(p[i])) {
                    q.push(board.select(p[i]));
                } else if (Type.isPoint(p[i])) {
                    q.push(p[i]);
                // given as [[x0,y0], [x1, y2], ...]
                } else if (Type.isArray(p[i]) && p[i].length === 2) {
                    q[i] = [];
                    if (Type.isFunction(p[i][0])) {
                        q[i].push(p[i][0]());
                    } else {
                        q[i].push(p[i][0]);
                    }

                    if (Type.isFunction(p[i][1])) {
                        q[i].push(p[i][1]());
                    } else {
                        q[i].push(p[i][1]);
                    }
                } else if (Type.isFunction(p[i]) && p[i]().length === 2) {
                    q.push(parents[i]());
                }
            }
        }

        if (attributes.createpoints === true) {
            points = Type.providePoints(board, q, attributes, 'cardinalspline', ['points']);
        } else {
            points = [];
            for (i = 0; i < q.length; i++) {
                if (Type.isPoint(q[i])) {
                    points.push(q[i]);
                } else {
                    points.push(
                        (function(ii) { return {
                            X: function() { return q[ii][0]; },
                            Y: function() { return q[ii][1]; }
                            };
                        })(i)
                    );
                }
            }
        }

        tau = parents[1];
        type = parents[2];

        splineArr = ['x'].concat(Numerics.CardinalSpline(points, tau));

        el = new JXG.Curve(board, splineArr, attributes);
        le = points.length;
        el.setParents(points);
        for (i = 0; i < le; i++) {
            if (Type.isPoint(points[i])) {
                points[i].addChild(el);
            }
        }
        el.elType = 'cardinalspline';

        return el;
    };

    /**
     * Register the element type spline at JSXGraph
     * @private
     */
    JXG.registerElement('cardinalspline', JXG.createCardinalSpline);

    /**
     * @class This element is used to provide a constructor for Riemann sums, which is realized as a special curve.
     * The returned element has the method Value() which returns the sum of the areas of the bars.
     * @pseudo
     * @description
     * @name Riemannsum
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {function,array_number,function_string,function_function,number_function,number} f,n,type_,a_,b_ Parent elements of Riemannsum are a
     *         Either a function term f(x) describing the function graph which is filled by the Riemann bars, or
     *         an array consisting of two functions and the area between is filled by the Riemann bars.
     *         <p>
     *         n determines the number of bars, it is either a fixed number or a function.
     *         <p>
     *         type is a string or function returning one of the values:  'left', 'right', 'middle', 'lower', 'upper', 'random', 'simpson', or 'trapezodial'.
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
     *   var t = board.create('text',[-2,-2, function(){ return 'Sum=' + JXG.toFixed(r.Value(), 4); }]);
     * </pre><div class="jxgbox" id="940f40cc-2015-420d-9191-c5d83de988cf" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function(){
     *   var board = JXG.JSXGraph.initBoard('940f40cc-2015-420d-9191-c5d83de988cf', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     *   var f = function(x) { return 0.5*x*x-2*x; };
     *   var s = board.create('slider',[[0,4],[3,4],[0,4,10]],{snapWidth:1});
     *   var r = board.create('riemannsum', [f, function(){return s.Value();}, 'upper', -2, 5], {fillOpacity:0.4});
     *   var g = board.create('functiongraph', [f, -2, 5]);
     *   var t = board.create('text',[-2,-2, function(){ return 'Sum=' + JXG.toFixed(r.Value(), 4); }]);
     * })();
     * </script><pre>
     *
     * @example
     *   // Riemann sum between two functions
     *   var s = board.create('slider',[[0,4],[3,4],[0,4,10]],{snapWidth:1});
     *   var g = function(x) { return 0.5*x*x-2*x; };
     *   var f = function(x) { return -x*(x-4); };
     *   var r = board.create('riemannsum',
     *               [[g,f], function(){return s.Value();}, 'lower', 0, 4],
     *               {fillOpacity:0.4}
     *               );
     *   var f = board.create('functiongraph',[f, -2, 5]);
     *   var g = board.create('functiongraph',[g, -2, 5]);
     *   var t = board.create('text',[-2,-2, function(){ return 'Sum=' + JXG.toFixed(r.Value(), 4); }]);
     * </pre><div class="jxgbox" id="f9a7ba38-b50f-4a32-a873-2f3bf9caee79" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function(){
     *   var board = JXG.JSXGraph.initBoard('f9a7ba38-b50f-4a32-a873-2f3bf9caee79', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     *   var s = board.create('slider',[[0,4],[3,4],[0,4,10]],{snapWidth:1});
     *   var g = function(x) { return 0.5*x*x-2*x; };
     *   var f = function(x) { return -x*(x-4); };
     *   var r = board.create('riemannsum',
     *               [[g,f], function(){return s.Value();}, 'lower', 0, 4],
     *               {fillOpacity:0.4}
     *               );
     *   var f = board.create('functiongraph',[f, -2, 5]);
     *   var g = board.create('functiongraph',[g, -2, 5]);
     *   var t = board.create('text',[-2,-2, function(){ return 'Sum=' + JXG.toFixed(r.Value(), 4); }]);
     * })();
     * </script><pre>
     */
    JXG.createRiemannsum = function (board, parents, attributes) {
        var n, type, f, par, c, attr;

        attr = Type.copyAttributes(attributes, board.options, 'riemannsum');
        attr.curvetype = 'plot';

        f = parents[0];
        n = Type.createFunction(parents[1], board, '');

        if (!Type.exists(n)) {
            throw new Error("JSXGraph: JXG.createRiemannsum: argument '2' n has to be number or function." +
                "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]");
        }

        type = Type.createFunction(parents[2], board, '', false);
        if (!Type.exists(type)) {
            throw new Error("JSXGraph: JXG.createRiemannsum: argument 3 'type' has to be string or function." +
                "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]");
        }

        par = [[0], [0]].concat(parents.slice(3));

        c = board.create('curve', par, attr);

        c.sum = 0.0;
        c.Value = function () {
            return this.sum;
        };

        c.updateDataArray = function () {
            var u = Numerics.riemann(f, n(), type(), this.minX(), this.maxX());
            this.dataX = u[0];
            this.dataY = u[1];

            // Update "Riemann sum"
            this.sum = u[2];
        };

        return c;
    };

    JXG.registerElement('riemannsum', JXG.createRiemannsum);

    /**
     * @class This element is used to provide a constructor for trace curve (simple locus curve), which is realized as a special curve.
     * @pseudo
     * @description
     * @name Tracecurve
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {Point,Point} Parent elements of Tracecurve are a
     *         glider point and a point whose locus is traced.
     * @see JXG.Curve
     * @example
     * // Create trace curve.
     * var c1 = board.create('circle',[[0, 0], [2, 0]]),
     * p1 = board.create('point',[-3, 1]),
     * g1 = board.create('glider',[2, 1, c1]),
     * s1 = board.create('segment',[g1, p1]),
     * p2 = board.create('midpoint',[s1]),
     * curve = board.create('tracecurve', [g1, p2]);
     *
     * </pre><div class="jxgbox" id="5749fb7d-04fc-44d2-973e-45c1951e29ad" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var tc1_board = JXG.JSXGraph.initBoard('5749fb7d-04fc-44d2-973e-45c1951e29ad', {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false});
     *   var c1 = tc1_board.create('circle',[[0, 0], [2, 0]]),
     *       p1 = tc1_board.create('point',[-3, 1]),
     *       g1 = tc1_board.create('glider',[2, 1, c1]),
     *       s1 = tc1_board.create('segment',[g1, p1]),
     *       p2 = tc1_board.create('midpoint',[s1]),
     *       curve = tc1_board.create('tracecurve', [g1, p2]);
     * </script><pre>
     */
    JXG.createTracecurve = function (board, parents, attributes) {
        var c, glider, tracepoint, attr;

        if (parents.length !== 2) {
            throw new Error("JSXGraph: Can't create trace curve with given parent'" +
                "\nPossible parent types: [glider, point]");
        }

        glider = board.select(parents[0]);
        tracepoint = board.select(parents[1]);

        if (glider.type !== Const.OBJECT_TYPE_GLIDER || !Type.isPoint(tracepoint)) {
            throw new Error("JSXGraph: Can't create trace curve with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [glider, point]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'tracecurve');
        attr.curvetype = 'plot';
        c = board.create('curve', [[0], [0]], attr);

        c.updateDataArray = function () {
            var i, step, t, el, pEl, x, y, from, savetrace,
                le = attr.numberpoints,
                savePos = glider.position,
                slideObj = glider.slideObject,
                mi = slideObj.minX(),
                ma = slideObj.maxX();

            // set step width
            step = (ma - mi) / le;
            this.dataX = [];
            this.dataY = [];

            /*
             * For gliders on circles and lines a closed curve is computed.
             * For gliders on curves the curve is not closed.
             */
            if (slideObj.elementClass !== Const.OBJECT_CLASS_CURVE) {
                le++;
            }

            // Loop over all steps
            for (i = 0; i < le; i++) {
                t = mi + i * step;
                x = slideObj.X(t) / slideObj.Z(t);
                y = slideObj.Y(t) / slideObj.Z(t);

                // Position the glider
                glider.setPositionDirectly(Const.COORDS_BY_USER, [x, y]);
                from = false;

                // Update all elements from the glider up to the trace element
                for (el in this.board.objects) {
                    if (this.board.objects.hasOwnProperty(el)) {
                        pEl = this.board.objects[el];

                        if (pEl === glider) {
                            from = true;
                        }

                        if (from && pEl.needsRegularUpdate) {
                            // Save the trace mode of the element
                            savetrace = pEl.visProp.trace;
                            pEl.visProp.trace = false;
                            pEl.needsUpdate = true;
                            pEl.update(true);

                            // Restore the trace mode
                            pEl.visProp.trace = savetrace;
                            if (pEl === tracepoint) {
                                break;
                            }
                        }
                    }
                }

                // Store the position of the trace point
                this.dataX[i] = tracepoint.X();
                this.dataY[i] = tracepoint.Y();
            }

            // Restore the original position of the glider
            glider.position = savePos;
            from = false;

            // Update all elements from the glider to the trace point
            for (el in this.board.objects) {
                if (this.board.objects.hasOwnProperty(el)) {
                    pEl = this.board.objects[el];
                    if (pEl === glider) {
                        from = true;
                    }

                    if (from && pEl.needsRegularUpdate) {
                        savetrace = pEl.visProp.trace;
                        pEl.visProp.trace = false;
                        pEl.needsUpdate = true;
                        pEl.update(true);
                        pEl.visProp.trace = savetrace;

                        if (pEl === tracepoint) {
                            break;
                        }
                    }
                }
            }
        };

        return c;
    };

    JXG.registerElement('tracecurve', JXG.createTracecurve);

    /**
     * @class This element is used to provide a constructor for step function, which is realized as a special curve.
     *
     * In case the data points should be updated after creation time, they can be accessed by curve.xterm and curve.yterm.
     * @pseudo
     * @description
     * @name Stepfunction
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {Array,Array|Function} Parent elements of Stepfunction are two arrays containing the coordinates.
     * @see JXG.Curve
     * @example
     * // Create step function.
     var curve = board.create('stepfunction', [[0,1,2,3,4,5], [1,3,0,2,2,1]]);

     * </pre><div class="jxgbox" id="32342ec9-ad17-4339-8a97-ff23dc34f51a" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var sf1_board = JXG.JSXGraph.initBoard('32342ec9-ad17-4339-8a97-ff23dc34f51a', {boundingbox: [-1, 5, 6, -2], axis: true, showcopyright: false, shownavigation: false});
     *   var curve = sf1_board.create('stepfunction', [[0,1,2,3,4,5], [1,3,0,2,2,1]]);
     * </script><pre>
     */
    JXG.createStepfunction = function (board, parents, attributes) {
        var c, attr;
        if (parents.length !== 2) {
            throw new Error("JSXGraph: Can't create step function with given parent'" +
                "\nPossible parent types: [array, array|function]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'stepfunction');
        c = board.create('curve', parents, attr);
        c.updateDataArray = function () {
            var i, j = 0,
                len = this.xterm.length;

            this.dataX = [];
            this.dataY = [];

            if (len === 0) {
                return;
            }

            this.dataX[j] = this.xterm[0];
            this.dataY[j] = this.yterm[0];
            ++j;

            for (i = 1; i < len; ++i) {
                this.dataX[j] = this.xterm[i];
                this.dataY[j] = this.dataY[j - 1];
                ++j;
                this.dataX[j] = this.xterm[i];
                this.dataY[j] = this.yterm[i];
                ++j;
            }
        };

        return c;
    };

    JXG.registerElement('stepfunction', JXG.createStepfunction);

    /**
     * @class This element is used to provide a constructor for the graph showing
     * the (numerical) derivative of a given curve.
     *
     * @pseudo
     * @description
     * @name Derivative
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @param {JXG.Curve} Parent Curve for which the derivative is generated.
     * @see JXG.Curve
     * @example
     * var cu = board.create('cardinalspline', [[[-3,0], [-1,2], [0,1], [2,0], [3,1]], 0.5, 'centripetal'], {createPoints: false});
     * var d = board.create('derivative', [cu], {dash: 2});
     *
     * </pre><div id="b9600738-1656-11e8-8184-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('b9600738-1656-11e8-8184-901b0e1b8723',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *     var cu = board.create('cardinalspline', [[[-3,0], [-1,2], [0,1], [2,0], [3,1]], 0.5, 'centripetal'], {createPoints: false});
     *     var d = board.create('derivative', [cu], {dash: 2});
     *
     *     })();
     *
     * </script><pre>
     *
     */
    JXG.createDerivative = function (board, parents, attributes) {
        var c,
            curve, dx, dy,
            attr;

        if (parents.length !== 1 && parents[0].class !== Const.OBJECT_CLASS_CURVE) {
            throw new Error("JSXGraph: Can't create derivative curve with given parent'" +
                "\nPossible parent types: [curve]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'curve');

        curve = parents[0];
        dx = Numerics.D(curve.X);
        dy = Numerics.D(curve.Y);

        c = board.create('curve', [
                function(t) { return curve.X(t); },
                function(t) { return dy(t) / dx(t); },
                curve.minX(), curve.maxX()
            ], attr);

        c.setParents(curve);

        return c;
    };

    JXG.registerElement('derivative', JXG.createDerivative);

    return {
        Curve: JXG.Curve,
        createCurve: JXG.createCurve,
        createFunctiongraph: JXG.createFunctiongraph,
        createPlot: JXG.createPlot,
        createSpline: JXG.createSpline,
        createRiemannsum: JXG.createRiemannsum,
        createTracecurve: JXG.createTracecurve,
        createStepfunction: JXG.createStepfunction
    };
});
