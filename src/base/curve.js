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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the geometry element Curve is defined.
 */

import JXG from "../jxg.js";
import Clip from "../math/clip.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import Geometry from "../math/geometry.js";
import GeometryElement from "./element.js";
import GeonextParser from "../parser/geonext.js";
import ImplicitPlot from "../math/implicitplot.js";
import Mat from "../math/math.js";
import Metapost from "../math/metapost.js";
import Numerics from "../math/numerics.js";
import Plot from "../math/plot.js";
import QDT from "../math/qdt.js";
import Type from "../utils/type.js";

/**
 * Curves are the common object for function graphs, parametric curves, polar curves, and data plots.
 * @class Creates a new curve object. Do not use this constructor to create a curve. Use {@link JXG.Board#create} with
 * type {@link Curve}, or {@link Functiongraph} instead.
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new curve is drawn on.
 * @param {Array} parents defining terms An array with the function terms or the data points of the curve.
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
    this.numberPoints = this.evalVisProp('numberpointshigh');

    this.bezierDegree = 1;

    /**
     * Array holding the x-coordinates of a data plot.
     * This array can be updated during run time by overwriting
     * the method {@link JXG.Curve#updateDataArray}.
     * @type array
     */
    this.dataX = null;

    /**
     * Array holding the y-coordinates of a data plot.
     * This array can be updated during run time by overwriting
     * the method {@link JXG.Curve#updateDataArray}.
     * @type array
     */
    this.dataY = null;

    /**
     * Array of ticks storing all the ticks on this curve. Do not set this field directly and use
     * {@link JXG.Curve#addTicks} and {@link JXG.Curve#removeTicks} to add and remove ticks to and
     * from the curve.
     * @type Array
     * @see JXG.Ticks
     */
    this.ticks = [];

    /**
     * Stores a quadtree if it is required. The quadtree is generated in the curve
     * updates and can be used to speed up the hasPoint method.
     * @type JXG.Math.Quadtree
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
        generateTerm: "generateTerm",
        setTerm: "generateTerm",
        move: "moveTo",
        moveTo: "moveTo",
        MinX: "minX",
        MaxX: "maxX"
    });
};

JXG.Curve.prototype = new GeometryElement();

JXG.extend(
    JXG.Curve.prototype,
    /** @lends JXG.Curve.prototype */ {
        /**
         * Gives the default value of the left bound for the curve.
         * May be overwritten in {@link JXG.Curve#generateTerm}.
         * @returns {Number} Left bound for the curve.
         */
        minX: function () {
            var leftCoords;

            if (this.evalVisProp('curvetype') === 'polar') {
                return 0;
            }

            leftCoords = new Coords(
                Const.COORDS_BY_SCREEN,
                [-this.board.canvasWidth * 0.1, 0],
                this.board,
                false
            );
            return leftCoords.usrCoords[1];
        },

        /**
         * Gives the default value of the right bound for the curve.
         * May be overwritten in {@link JXG.Curve#generateTerm}.
         * @returns {Number} Right bound for the curve.
         */
        maxX: function () {
            var rightCoords;

            if (this.evalVisProp('curvetype') === 'polar') {
                return 2 * Math.PI;
            }
            rightCoords = new Coords(
                Const.COORDS_BY_SCREEN,
                [this.board.canvasWidth * 1.1, 0],
                this.board,
                false
            );

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
         * Return the homogeneous coordinates of the curve at t - including all transformations
         * applied to the curve.
         * @param {Number} t A number between {@link JXG.Curve#minX} and {@link JXG.Curve#maxX}.
         * @returns {Array} [Z(t), X(t), Y(t)] plus transformations
         */
        Ft: function(t) {
            var c = [this.Z(t), this.X(t), this.Y(t)],
                len = this.transformations.length;

            if (len > 0) {
                c = Mat.matVecMult(this.transformMat, c);
            }
            c[1] /= c[0];
            c[2] /= c[0];
            c[0] /= c[0];

            return c;
        },

        /**
         * Checks whether (x,y) is near the curve.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @param {Number} start Optional start index for search on data plots.
         * @returns {Boolean} True if (x,y) is near the curve, False otherwise.
         */
        hasPoint: function (x, y, start) {
            var t, c, i, tX, tY,
                checkPoint, len, invMat, isIn,
                res = [],
                points,
                qdt,
                steps = this.evalVisProp('numberpointslow'),
                d = (this.maxX() - this.minX()) / steps,
                prec, type,
                dist = Infinity,
                ux2, uy2,
                ev_ct,
                mi, ma,
                suspendUpdate = true;

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                prec = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                prec = this.board.options.precision.hasPoint;
            }

            // From now on, x,y are usrCoords
            checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board, false);
            x = checkPoint.usrCoords[1];
            y = checkPoint.usrCoords[2];

            // Handle inner points of the curve
            if (this.bezierDegree === 1 && this.evalVisProp('hasinnerpoints')) {
                isIn = Geometry.windingNumber([1, x, y], this.points, true);
                if (isIn !== 0) {
                    return true;
                }
            }

            // We use usrCoords. Only in the final distance calculation
            // screen coords are used
            prec += this.evalVisProp('strokewidth') * 0.5;
            prec *= prec; // We do not want to take sqrt
            ux2 = this.board.unitX * this.board.unitX;
            uy2 = this.board.unitY * this.board.unitY;

            mi = this.minX();
            ma = this.maxX();
            if (Type.exists(this._visibleArea)) {
                mi = this._visibleArea[0];
                ma = this._visibleArea[1];
                d = (ma - mi) / steps;
            }

            ev_ct = this.evalVisProp('curvetype');
            if (ev_ct === "parameter" || ev_ct === 'polar') {
                // Transform the mouse/touch coordinates
                // back to the original position of the curve.
                // This is needed, because we work with the function terms, not the points.
                if (this.transformations.length > 0) {
                    this.updateTransformMatrix();
                    invMat = Mat.inverse(this.transformMat);
                    c = Mat.matVecMult(invMat, [1, x, y]);
                    x = c[1];
                    y = c[2];
                }

                // Brute force search for a point on the curve close to the mouse pointer
                for (i = 0, t = mi; i < steps; i++) {
                    tX = this.X(t, suspendUpdate);
                    tY = this.Y(t, suspendUpdate);

                    dist = (x - tX) * (x - tX) * ux2 + (y - tY) * (y - tY) * uy2;

                    if (dist <= prec) {
                        return true;
                    }

                    t += d;
                }
            } else if (ev_ct === "plot" || ev_ct === 'functiongraph') {
                // Here, we can ignore transformations of the curve,
                // since we are working directly with the points.

                if (!Type.exists(start) || start < 0) {
                    start = 0;
                }

                if (
                    Type.exists(this.qdt) &&
                    this.evalVisProp('useqdt') &&
                    this.bezierDegree !== 3
                ) {
                    qdt = this.qdt.query(new Coords(Const.COORDS_BY_USER, [x, y], this.board));
                    points = qdt.points;
                    len = points.length;
                } else {
                    points = this.points;
                    len = this.numberPoints - 1;
                }

                for (i = start; i < len; i++) {
                    if (this.bezierDegree === 3) {
                        //res.push(Geometry.projectCoordsToBeziersegment([1, x, y], this, i));
                        res = Geometry.projectCoordsToBeziersegment([1, x, y], this, i);
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

                    if (
                        res[1] >= 0 &&
                        res[1] <= 1 &&
                        (x - res[0][1]) * (x - res[0][1]) * ux2 +
                        (y - res[0][2]) * (y - res[0][2]) * uy2 <=
                        prec
                    ) {
                        return true;
                    }
                }
                return false;
            }
            return dist < prec;
        },

        /**
         * Allocate points in the Coords array this.points
         */
        allocatePoints: function () {
            var i, len;

            len = this.numberPoints;

            if (this.points.length < this.numberPoints) {
                for (i = this.points.length; i < len; i++) {
                    this.points[i] = new Coords(
                        Const.COORDS_BY_USER,
                        [0, 0],
                        this.board,
                        false
                    );
                }
            }
        },

        /**
         * Generates points of the curve to be plotted.
         * @returns {JXG.Curve} Reference to the curve object.
         * @see JXG.Curve#updateCurve
         */
        update: function () {
            if (this.needsUpdate) {
                if (this.evalVisProp('trace')) {
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

                this.isReal = Plot.checkReal(this.points);

                if (
                    //wasReal &&
                    !this.isReal
                ) {
                    this.updateVisibility(false);
                }
            }

            if (this.visPropCalc.visible) {
                this.board.renderer.updateCurve(this);
            }

            /* Update the label if visible. */
            if (
                this.hasLabel &&
                this.visPropCalc.visible &&
                this.label &&
                this.label.visPropCalc.visible &&
                this.isReal
            ) {
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
         * </pre><div id="JXG20bc7802-e69e-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 600px; height: 400px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG20bc7802-e69e-11e5-b1bf-901b0e1b8723',
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
         * </pre><div id="JXGa61a4d66-e69f-11e5-b1bf-901b0e1b8723"  class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *      var board = JXG.JSXGraph.initBoard('JXGa61a4d66-e69f-11e5-b1bf-901b0e1b8723',
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
         * Computes the curve path
         * @see JXG.Curve#update
         * @returns {JXG.Curve} Reference to the curve object.
         */
        updateCurve: function () {
            var i, len, mi, ma,
                x, y,
                version = this.visProp.plotversion,
                //t1, t2, l1,
                suspendUpdate = false;

            this.updateTransformMatrix();
            this.updateDataArray();
            mi = this.minX();
            ma = this.maxX();

            if (Type.exists(this.dataX)) {
                // Discrete data points, i.e. x-coordinates are given in an array
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
                        this.points[i].setCoordinates(
                            Const.COORDS_BY_USER,
                            [this.dataX[i], this.dataY[i]],
                            false
                        );
                    } else {
                        // discrete x data, continuous y data
                        y = this.X(x);
                        // The last parameter prevents rounding in usr2screen().
                        this.points[i].setCoordinates(
                            Const.COORDS_BY_USER,
                            [this.dataX[i], this.Y(y, suspendUpdate)],
                            false
                        );
                    }
                    this.points[i]._t = i;

                    // this.updateTransform(this.points[i]);
                    suspendUpdate = true;
                }

            } else {
                // Continuous x-data, i.e. given as a function
                if (this.evalVisProp('doadvancedplot')) {
                    // console.time('plot');

                    if (version === 1 || this.evalVisProp('doadvancedplotold')) {
                        Plot.updateParametricCurveOld(this, mi, ma);
                    } else if (version === 2) {
                        Plot.updateParametricCurve_v2(this, mi, ma);
                    } else if (version === 3) {
                        Plot.updateParametricCurve_v3(this, mi, ma);
                    } else if (version === 4) {
                        Plot.updateParametricCurve_v4(this, mi, ma);
                    } else {
                        Plot.updateParametricCurve_v2(this, mi, ma);
                    }
                    // console.timeEnd('plot');
                } else {
                    if (this.board.updateQuality === this.board.BOARD_QUALITY_HIGH) {
                        this.numberPoints = this.evalVisProp('numberpointshigh');
                    } else {
                        this.numberPoints = this.evalVisProp('numberpointslow');
                    }

                    // It is possible, that the array length has increased.
                    this.allocatePoints();
                    Plot.updateParametricCurveNaive(this, mi, ma, this.numberPoints);
                }
                len = this.numberPoints;

                if (
                    this.evalVisProp('useqdt') &&
                    this.board.updateQuality === this.board.BOARD_QUALITY_HIGH
                ) {
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

                // for (i = 0; i < len; i++) {
                //     this.updateTransform(this.points[i]);
                // }
            }

            if (
                this.evalVisProp('curvetype') !== "plot" &&
                this.evalVisProp('rdpsmoothing')
            ) {
                // console.time('rdp');
                this.points = Numerics.RamerDouglasPeucker(this.points, 0.2);
                this.numberPoints = this.points.length;
                // console.timeEnd('rdp');
                // console.log(this.numberPoints);
            }

            len = this.numberPoints;
            for (i = 0; i < len; i++) {
                this.updateTransform(this.points[i]);
            }

            return this;
        },

        updateTransformMatrix: function () {
            var t,
                i,
                len = this.transformations.length;

            this.transformMat = [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ];

            for (i = 0; i < len; i++) {
                t = this.transformations[i];
                t.update();
                this.transformMat = Mat.matMatMult(t.matrix, this.transformMat);
            }

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
                p.setCoordinates(Const.COORDS_BY_USER, c, false, true);
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
            var data = "data" + which,
                that = this;

            return function (t, suspendedUpdate) {
                var i,
                    j,
                    t0,
                    t1,
                    arr = that[data],
                    len = arr.length,
                    last,
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

                if (that.bezierDegree === 3) {
                    last = (len - 1) / 3;

                    if (t >= last) {
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

                    return (
                        t1 * t1 * (t1 * f[0] + 3 * t0 * f[1]) +
                        (3 * t1 * f[2] + t0 * f[3]) * t0 * t0
                    );
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
         * Converts the JavaScript/JessieCode/GEONExT syntax of the defining function term into JavaScript.
         * New methods X() and Y() for the Curve object are generated, further
         * new methods for minX() and maxX().
         * If mi or ma are not supplied, default functions are set.
         *
         * @param {String} varname Name of the parameter in xterm and yterm, e.g. 'x' or 't'
         * @param {String|Number|Function|Array} xterm Term for the x coordinate. Can also be an array consisting of discrete values.
         * @param {String|Number|Function|Array} yterm Term for the y coordinate. Can also be an array consisting of discrete values.
         * @param {String|Number|Function} [mi] Lower bound on the parameter
         * @param {String|Number|Function} [ma] Upper bound on the parameter
         * @see JXG.GeonextParser.geonext2JS
         */
        generateTerm: function (varname, xterm, yterm, mi, ma) {
            var fx, fy, mat;

            // Generate the methods X() and Y()
            if (Type.isArray(xterm)) {
                // Discrete data
                this.dataX = xterm;

                this.numberPoints = this.dataX.length;
                this.X = this.interpolationFunctionFromArray.apply(this, ["X"]);
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
                this.Y = this.interpolationFunctionFromArray.apply(this, ["Y"]);
            } else if (!Type.exists(yterm)) {
                // Discrete data as an array of coordinate pairs,
                // i.e. transposed input
                mat = Mat.transpose(xterm);
                this.dataX = mat[0];
                this.dataY = mat[1];
                this.numberPoints = this.dataX.length;
                this.Y = this.interpolationFunctionFromArray.apply(this, ["Y"]);
            } else {
                this.Y = Type.createFunction(yterm, this.board, varname);
            }

            /**
             * Polar form
             * Input data is function xterm() and offset coordinates yterm
             */
            if (Type.isFunction(xterm) && Type.isArray(yterm)) {
                // Xoffset, Yoffset
                fx = Type.createFunction(yterm[0], this.board, "");
                fy = Type.createFunction(yterm[1], this.board, "");

                this.X = function (phi) {
                    return xterm(phi) * Math.cos(phi) + fx();
                };
                this.X.deps = fx.deps;

                this.Y = function (phi) {
                    return xterm(phi) * Math.sin(phi) + fy();
                };
                this.Y.deps = fy.deps;

                this.visProp.curvetype = 'polar';
            }

            // Set the upper and lower bounds for the parameter of the curve.
            // If not defined, reset the bounds to the default values
            // given in Curve.prototype.minX, Curve.prototype.maxX
            if (Type.exists(mi)) {
                this.minX = Type.createFunction(mi, this.board, "");
            } else {
                delete this.minX;
            }
            if (Type.exists(ma)) {
                this.maxX = Type.createFunction(ma, this.board, "");
            } else {
                delete this.maxX;
            }

            this.addParentsFromJCFunctions([this.X, this.Y, this.minX, this.maxX]);
        },

        /**
         * Finds dependencies in a given term and notifies the parents by adding the
         * dependent object to the found objects child elements.
         * @param {String} contentStr String containing dependencies for the given object.
         */
        notifyParents: function (contentStr) {
            var fstr,
                dep,
                isJessieCode = false,
                obj;

            // Read dependencies found by the JessieCode parser
            obj = { xterm: 1, yterm: 1 };
            for (fstr in obj) {
                if (
                    obj.hasOwnProperty(fstr) &&
                    this.hasOwnProperty(fstr) &&
                    this[fstr].origin
                ) {
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

        /**
         * Position a curve label according to the attributes "position" and distance.
         * This function is also used for angle, arc and sector.
         *
         * @param {String} pos
         * @param {Number} distance
         * @returns {JXG.Coords}
         */
        getLabelPosition: function(pos, distance) {
            var x, y, xy,
                c, d, e,
                lbda,
                mi, ma, ar,
                t, dx, dy,
                dist = 1.5;

            // Shrink domain if necessary
            mi = this.minX();
            ma = this.maxX();
            ar = Numerics.findDomain(this.X, [mi, ma], null, false);
            ar = Numerics.findDomain(this.Y, ar, null, false);
            mi = Math.max(ar[0], ar[0]);
            ma = Math.min(ar[1], ar[1]);

            xy = Type.parsePosition(pos);
            lbda = Type.parseNumber(xy.pos, ma - mi, 1);

            if (xy.pos.indexOf('fr') < 0 &&
                xy.pos.indexOf('%') < 0) {
                // 'px' or numbers are not supported
                lbda = 0;
            }

            t = mi + lbda;

            x = this.X(t);
            y = this.Y(t);
            // If x or y are NaN, the label is set to the line
            // between the first and last point.
            if (isNaN(x + y)) {
                lbda /= (ma - mi);
                t = mi + lbda;
                x = this.X(mi) + lbda * (this.X(ma) - this.X(mi));
                y = this.Y(mi) + lbda * (this.Y(ma) - this.Y(mi));
            }
            c = (new Coords(Const.COORDS_BY_USER, [x, y], this.board)).scrCoords;

            e = Mat.eps;
            if (t < mi + e) {
                dx = (this.X(t + e) - this.X(t)) / e;
                dy = (this.Y(t + e) - this.Y(t)) / e;
            } else if (t > ma - e) {
                dx = (this.X(t) - this.X(t - e)) / e;
                dy = (this.Y(t) - this.Y(t - e)) / e;
            } else {
                dx = 0.5 * (this.X(t + e) - this.X(t - e)) / e;
                dy = 0.5 * (this.Y(t + e) - this.Y(t - e)) / e;
            }
            dx = isNaN(dx) ? 1. : dx;
            dy = isNaN(dy) ? 1. : dy;
            d = Mat.hypot(dx, dy);

            if (xy.side === 'left') {
                dy *= -1;
            } else {
                dx *= -1;
            }

            // Position left or right

            if (Type.exists(this.label)) {
                dist = 0.5 * distance / d;
            }

            x = c[1] + dy * this.label.size[0] * dist;
            y = c[2] - dx * this.label.size[1] * dist;

            return new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);
        },

        // documented in geometryElement
        getLabelAnchor: function () {
            var x, y, pos,
                // xy, lbda, e,
                // t, dx, dy, d,
                // dist = 1.5,
                c,
                ax = 0.05 * this.board.canvasWidth,
                ay = 0.05 * this.board.canvasHeight,
                bx = 0.95 * this.board.canvasWidth,
                by = 0.95 * this.board.canvasHeight;

            if (!Type.exists(this.label)) {
                return new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], this.board);
            }
            pos = this.label.evalVisProp('position');
            if (!Type.isString(pos)) {
                return new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], this.board);
            }

            if (pos.indexOf('right') < 0 && pos.indexOf('left') < 0) {
                switch (this.evalVisProp('label.position')) {
                    case "ulft":
                        x = ax;
                        y = ay;
                        break;
                    case "llft":
                        x = ax;
                        y = by;
                        break;
                    case "rt":
                        x = bx;
                        y = 0.5 * by;
                        break;
                    case "lrt":
                        x = bx;
                        y = by;
                        break;
                    case "urt":
                        x = bx;
                        y = ay;
                        break;
                    case "top":
                        x = 0.5 * bx;
                        y = ay;
                        break;
                    case "bot":
                        x = 0.5 * bx;
                        y = by;
                        break;
                    default:
                        // includes case 'lft'
                        x = ax;
                        y = 0.5 * by;
                }
            } else {
                // New positioning
                return this.getLabelPosition(pos, this.label.evalVisProp('distance'));
                // xy = Type.parsePosition(pos);
                // lbda = Type.parseNumber(xy.pos, this.maxX() - this.minX(), 1);

                // if (xy.pos.indexOf('fr') < 0 &&
                //     xy.pos.indexOf('%') < 0) {
                //     // 'px' or numbers are not supported
                //     lbda = 0;
                // }

                // t = this.minX() + lbda;
                // x = this.X(t);
                // y = this.Y(t);
                // c = (new Coords(Const.COORDS_BY_USER, [x, y], this.board)).scrCoords;

                // e = Mat.eps;
                // if (t < this.minX() + e) {
                //     dx = (this.X(t + e) - this.X(t)) / e;
                //     dy = (this.Y(t + e) - this.Y(t)) / e;
                // } else if (t > this.maxX() - e) {
                //     dx = (this.X(t) - this.X(t - e)) / e;
                //     dy = (this.Y(t) - this.Y(t - e)) / e;
                // } else {
                //     dx = 0.5 * (this.X(t + e) - this.X(t - e)) / e;
                //     dy = 0.5 * (this.Y(t + e) - this.Y(t - e)) / e;
                // }
                // d = Mat.hypot(dx, dy);

                // if (xy.side === 'left') {
                //     dy *= -1;
                // } else {
                //     dx *= -1;
                // }

                // // Position left or right

                // if (Type.exists(this.label)) {
                //     dist = 0.5 * this.label.evalVisProp('distance') / d;
                // }

                // x = c[1] + dy * this.label.size[0] * dist;
                // y = c[2] - dx * this.label.size[1] * dist;

                // return new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);

            }
            c = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board, false);
            return Geometry.projectCoordsToCurve(
                c.usrCoords[1], c.usrCoords[2], 0, this, this.board
            )[0];
        },

        // documented in geometry element
        cloneToBackground: function () {
            var er,
                copy = Type.getCloneObject(this);

            copy.points = this.points.slice(0);
            copy.bezierDegree = this.bezierDegree;
            copy.numberPoints = this.numberPoints;

            er = this.board.renderer.enhancedRendering;
            this.board.renderer.enhancedRendering = true;
            this.board.renderer.drawCurve(copy);
            this.board.renderer.enhancedRendering = er;
            this.traces[copy.id] = copy.rendNode;

            return this;
        },

        // Already documented in GeometryElement
        bounds: function () {
            var minX = Infinity,
                maxX = -Infinity,
                minY = Infinity,
                maxY = -Infinity,
                l = this.points.length,
                i,
                bezier,
                up;

            if (this.bezierDegree === 3) {
                // Add methods X(), Y()
                for (i = 0; i < l; i++) {
                    this.points[i].X = Type.bind(function () {
                        return this.usrCoords[1];
                    }, this.points[i]);
                    this.points[i].Y = Type.bind(function () {
                        return this.usrCoords[2];
                    }, this.points[i]);
                }
                bezier = Numerics.bezier(this.points);
                up = bezier[3]();
                minX = Numerics.fminbr(
                    function (t) {
                        return bezier[0](t);
                    },
                    [0, up]
                );
                maxX = Numerics.fminbr(
                    function (t) {
                        return -bezier[0](t);
                    },
                    [0, up]
                );
                minY = Numerics.fminbr(
                    function (t) {
                        return bezier[1](t);
                    },
                    [0, up]
                );
                maxY = Numerics.fminbr(
                    function (t) {
                        return -bezier[1](t);
                    },
                    [0, up]
                );

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
        moveTo: function (where) {
            // TODO add animation
            var delta = [],
                p;
            if (this.points.length > 0 && !this.evalVisProp('fixed')) {
                p = this.points[0];
                if (where.length === 3) {
                    delta = [
                        where[0] - p.usrCoords[0],
                        where[1] - p.usrCoords[1],
                        where[2] - p.usrCoords[2]
                    ];
                } else {
                    delta = [where[0] - p.usrCoords[1], where[1] - p.usrCoords[2]];
                }
                this.setPosition(Const.COORDS_BY_USER, delta);
                return this.board.update(this);
            }
            return this;
        },

        /**
         * If the curve is the result of a transformation applied
         * to a continuous curve, the glider projection has to be done
         * on the original curve. Otherwise there will be problems
         * when changing between high and low precision plotting,
         * since there number of points changes.
         *
         * @private
         * @returns {Array} [Boolean, curve]: Array contining 'true' if curve is result of a transformation,
         *   and the source curve of the transformation.
         */
        getTransformationSource: function () {
            var isTransformed, curve_org;
            if (Type.exists(this._transformationSource)) {
                curve_org = this._transformationSource;
                if (
                    curve_org.elementClass === Const.OBJECT_CLASS_CURVE //&&
                    //curve_org.evalVisProp('curvetype') !== 'plot'
                ) {
                    isTransformed = true;
                }
            }
            return [isTransformed, curve_org];
        }

        // See JXG.Math.Geometry.pnpoly
        // pnpoly: function (x_in, y_in, coord_type) {
        //     var i,
        //         j,
        //         len,
        //         x,
        //         y,
        //         crds,
        //         v = this.points,
        //         isIn = false;

        //     if (coord_type === Const.COORDS_BY_USER) {
        //         crds = new Coords(Const.COORDS_BY_USER, [x_in, y_in], this.board);
        //         x = crds.scrCoords[1];
        //         y = crds.scrCoords[2];
        //     } else {
        //         x = x_in;
        //         y = y_in;
        //     }

        //     len = this.points.length;
        //     for (i = 0, j = len - 2; i < len - 1; j = i++) {
        //         if (
        //             v[i].scrCoords[2] > y !== v[j].scrCoords[2] > y &&
        //             x <
        //                 ((v[j].scrCoords[1] - v[i].scrCoords[1]) * (y - v[i].scrCoords[2])) /
        //                     (v[j].scrCoords[2] - v[i].scrCoords[2]) +
        //                     v[i].scrCoords[1]
        //         ) {
        //             isIn = !isIn;
        //         }
        //     }

        //     return isIn;
        // }
    }
);

/**
 * @class  Curves can be defined by mappings or by discrete data sets.
 * In general, a curve is a mapping from R to R^2, where t maps to (x(t),y(t)). The graph is drawn for t in the interval [a,b].
 * <p>
 * The following types of curves can be plotted:
 * <ul>
 *  <li> parametric curves: t mapsto (x(t),y(t)), where x() and y() are univariate functions.
 *  <li> polar curves: curves commonly written with polar equations like spirals and cardioids.
 *  <li> data plots: plot line segments through a given list of coordinates.
 * </ul>
 * @pseudo
 * @name Curve
 * @augments JXG.Curve
 * @constructor
 * @type Object
 * @description JXG.Curve

 * @param {function,number_function,number_function,number_function,number}  x,y,a_,b_ Parent elements for Parametric Curves.
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
 *
 * @param {array_array,function,number}
 *
 * @description x,y Parent elements for Data Plots.
 *                     <p>
 *                     x and y are arrays contining the x and y coordinates of the data points which are connected by
 *                     line segments. The individual entries of x and y may also be functions.
 *                     In case of x being an array the curve type is data plot, regardless of the second parameter and
 *                     if additionally the second parameter y is a function term the data plot evaluates.
 *                     </p>
 * @param {function_array,function,number_function,number_function,number}
 * @description r,offset_,a_,b_ Parent elements for Polar Curves.
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
 * </pre><div class="jxgbox" id="JXGaf9f818b-f3b6-4c4d-8c4c-e4a4078b726d" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c1_board = JXG.JSXGraph.initBoard('JXGaf9f818b-f3b6-4c4d-8c4c-e4a4078b726d', {boundingbox: [-1, 5, 7, -1], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div class="jxgbox" id="JXG7dcbb00e-b6ff-481d-b4a8-887f5d8c6a83" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c3_board = JXG.JSXGraph.initBoard('JXG7dcbb00e-b6ff-481d-b4a8-887f5d8c6a83', {boundingbox: [-1,10,10,-1], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div class="jxgbox" id="JXGd0bc7a2a-8124-45ca-a6e7-142321a8f8c2" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var c2_board = JXG.JSXGraph.initBoard('JXGd0bc7a2a-8124-45ca-a6e7-142321a8f8c2', {boundingbox: [-3,3,3,-3], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div class="jxgbox" id="JXG7bcc6280-f6eb-433e-8281-c837c3387849" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function(){
 *  var board, col, p, c;
 *  board = JXG.JSXGraph.initBoard('JXG7bcc6280-f6eb-433e-8281-c837c3387849', {boundingbox: [-3,3,3,-3], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div id="JXG866dc7a2-d448-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG866dc7a2-d448-11e7-93b3-901b0e1b8723',
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
    var obj,
        cu,
        attr = Type.copyAttributes(attributes, board.options, 'curve');

    obj = board.select(parents[0], true);
    if (
        Type.isTransformationOrArray(parents[1]) &&
        Type.isObject(obj) &&
        (obj.type === Const.OBJECT_TYPE_CURVE ||
            obj.type === Const.OBJECT_TYPE_ANGLE ||
            obj.type === Const.OBJECT_TYPE_ARC ||
            obj.type === Const.OBJECT_TYPE_CONIC ||
            obj.type === Const.OBJECT_TYPE_SECTOR)
    ) {
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

        cu = new JXG.Curve(board, ["x", [], []], attr);
        /**
         * @class
         * @ignore
         */
        cu.updateDataArray = function () {
            var i,
                le = obj.numberPoints;
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
        obj.addChild(cu);
        cu.setParents([obj]);
        cu._transformationSource = obj;

        return cu;
    }
    attr = Type.copyAttributes(attributes, board.options, 'curve');
    return new JXG.Curve(board, ["x"].concat(parents), attr);
};

JXG.registerElement("curve", JXG.createCurve);

/**
 * @class A functiongraph visualizes a map x &rarr; f(x).
 * The graph is displayed for x in the interval [a,b] and is a {@link Curve} element.
 * @pseudo
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
 * </pre><div class="jxgbox" id="JXGefd432b5-23a3-4846-ac5b-b471e668b437" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var alex1_board = JXG.JSXGraph.initBoard('JXGefd432b5-23a3-4846-ac5b-b471e668b437', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div class="jxgbox" id="JXG4a203a84-bde5-4371-ad56-44619690bb50" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var alex2_board = JXG.JSXGraph.initBoard('JXG4a203a84-bde5-4371-ad56-44619690bb50', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var s = alex2_board.create('slider',[[0,4],[3,4],[-2,4,5]]);
 *   var graph = alex2_board.create('functiongraph', [function(x){ return 0.5*x*x-2*x;}, -2, function(){return s.Value();}]);
 * </script><pre>
 */
JXG.createFunctiongraph = function (board, parents, attributes) {
    var attr,
        par = ["x", "x"].concat(parents); // variable name and identity function for x-coordinate
    // par = ["x", function(x) { return x; }].concat(parents);

    attr = Type.copyAttributes(attributes, board.options, 'functiongraph');
    attr = Type.copyAttributes(attr, board.options, 'curve');
    attr.curvetype = 'functiongraph';
    return new JXG.Curve(board, par, attr);
};

JXG.registerElement("functiongraph", JXG.createFunctiongraph);
JXG.registerElement("plot", JXG.createFunctiongraph);

/**
 * @class The (natural) cubic spline curves (function graph) interpolating a set of points.
 * Create a dynamic spline interpolated curve given by sample points p_1 to p_n.
 * @pseudo
 * @name Spline
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @param {JXG.Board} board Reference to the board the spline is drawn on.
 * @param {Array} parents Array of points the spline interpolates. This can be
 *   <ul>
 *   <li> an array of JSXGraph points</li>
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
 * </pre><div id="JXG6c197afc-e482-11e5-b1bf-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6c197afc-e482-11e5-b1bf-901b0e1b8723',
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
    var el, funcs, ret;

    funcs = function () {
        var D,
            x = [],
            y = [];

        return [
            function (t, suspended) {
                // Function term
                var i, j, c;

                if (!suspended) {
                    x = [];
                    y = [];

                    // given as [x[], y[]]
                    if (
                        parents.length === 2 &&
                        Type.isArray(parents[0]) &&
                        Type.isArray(parents[1]) &&
                        parents[0].length === parents[1].length
                    ) {
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
                            } else if (
                                Type.isFunction(parents[i]) &&
                                parents[i]().length === 2
                            ) {
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
            },
            // minX()
            function () {
                return x[0];
            },
            //maxX()
            function () {
                return x[x.length - 1];
            }
        ];
    };

    attributes = Type.copyAttributes(attributes, board.options, 'curve');
    attributes.curvetype = 'functiongraph';
    ret = funcs();
    el = new JXG.Curve(board, ["x", "x", ret[0], ret[1], ret[2]], attributes);
    el.setParents(parents);
    el.elType = 'spline';

    return el;
};

/**
 * Register the element type spline at JSXGraph
 * @private
 */
JXG.registerElement("spline", JXG.createSpline);

/**
 * @class Cardinal spline curve through a given data set.
 * Create a dynamic cardinal spline interpolated curve given by sample points p_1 to p_n.
 * @pseudo
 * @name Cardinalspline
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @param {Array} points Points array defining the cardinal spline. This can be
 *   <ul>
 *   <li> an array of JSXGraph points</li>
 *   <li> an array of coordinate pairs</li>
 *   <li> an array of functions returning coordinate pairs</li>
 *   <li> an array consisting of an array with x-coordinates and an array of y-coordinates</li>
 *   </ul>
 *   All individual entries of coordinates arrays may be numbers or functions returning numbers.
 * @param {function,Number} tau Tension parameter
 * @param {String} [type='uniform'] Type of the cardinal spline, may be 'uniform' (default) or 'centripetal'
 * @see JXG.Curve
 * @example
 * //Create a cardinal spline out of an array of JXG points with adjustable tension
 *
 * //Create array of points
 * var p = [];
 * p.push(board.create('point',[0,0]));
 * p.push(board.create('point',[1,4]));
 * p.push(board.create('point',[4,5]));
 * p.push(board.create('point',[2,3]));
 * p.push(board.create('point',[3,0]));
 *
 * // tension
 * var tau = board.create('slider', [[-4,-5],[2,-5],[0.001,0.5,1]], {name:'tau'});
 * var c = board.create('cardinalspline', [p, function(){ return tau.Value();}], {strokeWidth:3});
 *
 * </pre><div id="JXG1537cb69-4d45-43aa-8fc3-c6d4f98b4cdd" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1537cb69-4d45-43aa-8fc3-c6d4f98b4cdd',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     //Create a cardinal spline out of an array of JXG points with adjustable tension
 *
 *     //Create array of points
 *     var p = [];
 *     p.push(board.create('point',[0,0]));
 *     p.push(board.create('point',[1,4]));
 *     p.push(board.create('point',[4,5]));
 *     p.push(board.create('point',[2,3]));
 *     p.push(board.create('point',[3,0]));
 *
 *     // tension
 *     var tau = board.create('slider', [[-4,-5],[2,-5],[0.001,0.5,1]], {name:'tau'});
 *     var c = board.create('cardinalspline', [p, function(){ return tau.Value();}], {strokeWidth:3});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createCardinalSpline = function (board, parents, attributes) {
    var el,
        getPointLike,
        points,
        tau,
        type,
        p,
        q,
        i,
        le,
        splineArr,
        errStr = "\nPossible parent types: [points:array, tau:number|function, type:string]";

    if (!Type.exists(parents[0]) || !Type.isArray(parents[0])) {
        throw new Error(
            "JSXGraph: JXG.createCardinalSpline: argument 1 'points' has to be array of points or coordinate pairs" +
            errStr
        );
    }
    if (
        !Type.exists(parents[1]) ||
        (!Type.isNumber(parents[1]) && !Type.isFunction(parents[1]))
    ) {
        throw new Error(
            "JSXGraph: JXG.createCardinalSpline: argument 2 'tau' has to be number between [0,1] or function'" +
            errStr
        );
    }
    if (!Type.exists(parents[2]) || !Type.isString(parents[2])) {
        type = 'uniform';
        // throw new Error(
        //     "JSXGraph: JXG.createCardinalSpline: argument 3 'type' has to be string 'uniform' or 'centripetal'" +
        //     errStr
        // );
    } else {
        type = parents[2];
    }

    attributes = Type.copyAttributes(attributes, board.options, 'curve');
    attributes = Type.copyAttributes(attributes, board.options, 'cardinalspline');
    attributes.curvetype = 'parameter';

    p = parents[0];
    q = [];

    // Given as [x[], y[]]
    if (
        !attributes.isarrayofcoordinates &&
        p.length === 2 &&
        Type.isArray(p[0]) &&
        Type.isArray(p[1]) &&
        p[0].length === p[1].length
    ) {
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
        points = Type.providePoints(board, q, attributes, "cardinalspline", ["points"]);
    } else {
        points = [];

        /**
         * @ignore
         */
        getPointLike = function (ii) {
            return {
                X: function () {
                    return q[ii][0];
                },
                Y: function () {
                    return q[ii][1];
                },
                Dist: function (p) {
                    var dx = this.X() - p.X(),
                        dy = this.Y() - p.Y();

                    return Mat.hypot(dx, dy);
                }
            };
        };

        for (i = 0; i < q.length; i++) {
            if (Type.isPoint(q[i])) {
                points.push(q[i]);
            } else {
                points.push(getPointLike(i));
            }
        }
    }

    tau = parents[1];
    // type = parents[2];

    splineArr = ["x"].concat(Numerics.CardinalSpline(points, tau, type));

    el = new JXG.Curve(board, splineArr, attributes);
    le = points.length;
    el.setParents(points);
    for (i = 0; i < le; i++) {
        p = points[i];
        if (Type.isPoint(p)) {
            if (Type.exists(p._is_new)) {
                el.addChild(p);
                delete p._is_new;
            } else {
                p.addChild(el);
            }
        }
    }
    el.elType = 'cardinalspline';

    return el;
};

/**
 * Register the element type cardinalspline at JSXGraph
 * @private
 */
JXG.registerElement("cardinalspline", JXG.createCardinalSpline);

/**
 * @class Interpolate data points by the spline curve from Metapost (by Donald Knuth and John Hobby).
 * Create a dynamic metapost spline interpolated curve given by sample points p_1 to p_n.
 * @pseudo
 * @name Metapostspline
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @param {JXG.Board} board Reference to the board the metapost spline is drawn on.
 * @param {Array} parents Array with two entries.
 * <p>
 *   First entry: Array of points the spline interpolates. This can be
 *   <ul>
 *   <li> an array of JSXGraph points</li>
 *   <li> an object of coordinate pairs</li>
 *   <li> an array of functions returning coordinate pairs</li>
 *   <li> an array consisting of an array with x-coordinates and an array of y-coordinates</li>
 *   </ul>
 *   All individual entries of coordinates arrays may be numbers or functions returning numbers.
 *   <p>
 *   Second entry: JavaScript object containing the control values like tension, direction, curl.
 * @param {Object} attributes Define color, width, ... of the metapost spline
 * @returns {JXG.Curve} Returns reference to an object of type JXG.Curve.
 * @see JXG.Curve
 * @example
 *     var po = [],
 *         attr = {
 *             size: 5,
 *             color: 'red'
 *         },
 *         controls;
 *
 *     var tension = board.create('slider', [[-3, 6], [3, 6], [0, 1, 20]], {name: 'tension'});
 *     var curl = board.create('slider', [[-3, 5], [3, 5], [0, 1, 30]], {name: 'curl A, D'});
 *     var dir = board.create('slider', [[-3, 4], [3, 4], [-180, 0, 180]], {name: 'direction B'});
 *
 *     po.push(board.create('point', [-3, -3]));
 *     po.push(board.create('point', [0, -3]));
 *     po.push(board.create('point', [4, -5]));
 *     po.push(board.create('point', [6, -2]));
 *
 *     var controls = {
 *         tension: function() {return tension.Value(); },
 *         direction: { 1: function() {return dir.Value(); } },
 *         curl: { 0: function() {return curl.Value(); },
 *                 3: function() {return curl.Value(); }
 *             },
 *         isClosed: false
 *     };
 *
 *     // Plot a metapost curve
 *     var cu = board.create('metapostspline', [po, controls], {strokeColor: 'blue', strokeWidth: 2});
 *
 *
 * </pre><div id="JXGb8c6ffed-7419-41a3-9e55-3754b2327ae9" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb8c6ffed-7419-41a3-9e55-3754b2327ae9',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *         var po = [],
 *             attr = {
 *                 size: 5,
 *                 color: 'red'
 *             },
 *             controls;
 *
 *         var tension = board.create('slider', [[-3, 6], [3, 6], [0, 1, 20]], {name: 'tension'});
 *         var curl = board.create('slider', [[-3, 5], [3, 5], [0, 1, 30]], {name: 'curl A, D'});
 *         var dir = board.create('slider', [[-3, 4], [3, 4], [-180, 0, 180]], {name: 'direction B'});
 *
 *         po.push(board.create('point', [-3, -3]));
 *         po.push(board.create('point', [0, -3]));
 *         po.push(board.create('point', [4, -5]));
 *         po.push(board.create('point', [6, -2]));
 *
 *         var controls = {
 *             tension: function() {return tension.Value(); },
 *             direction: { 1: function() {return dir.Value(); } },
 *             curl: { 0: function() {return curl.Value(); },
 *                     3: function() {return curl.Value(); }
 *                 },
 *             isClosed: false
 *         };
 *
 *         // Plot a metapost curve
 *         var cu = board.create('metapostspline', [po, controls], {strokeColor: 'blue', strokeWidth: 2});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createMetapostSpline = function (board, parents, attributes) {
    var el,
        getPointLike,
        points,
        controls,
        p,
        q,
        i,
        le,
        errStr = "\nPossible parent types: [points:array, controls:object";

    if (!Type.exists(parents[0]) || !Type.isArray(parents[0])) {
        throw new Error(
            "JSXGraph: JXG.createMetapostSpline: argument 1 'points' has to be array of points or coordinate pairs" +
            errStr
        );
    }
    if (!Type.exists(parents[1]) || !Type.isObject(parents[1])) {
        throw new Error(
            "JSXGraph: JXG.createMetapostSpline: argument 2 'controls' has to be a JavaScript object'" +
            errStr
        );
    }

    attributes = Type.copyAttributes(attributes, board.options, 'curve');
    attributes = Type.copyAttributes(attributes, board.options, 'metapostspline');
    attributes.curvetype = 'parameter';

    p = parents[0];
    q = [];

    // given as [x[], y[]]
    if (
        !attributes.isarrayofcoordinates &&
        p.length === 2 &&
        Type.isArray(p[0]) &&
        Type.isArray(p[1]) &&
        p[0].length === p[1].length
    ) {
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
        points = Type.providePoints(board, q, attributes, 'metapostspline', ['points']);
    } else {
        points = [];

        /**
         * @ignore
         */
        getPointLike = function (ii) {
            return {
                X: function () {
                    return q[ii][0];
                },
                Y: function () {
                    return q[ii][1];
                }
            };
        };

        for (i = 0; i < q.length; i++) {
            if (Type.isPoint(q[i])) {
                points.push(q[i]);
            } else {
                points.push(getPointLike);
            }
        }
    }

    controls = parents[1];

    el = new JXG.Curve(board, ["t", [], [], 0, p.length - 1], attributes);
    /**
     * @class
     * @ignore
     */
    el.updateDataArray = function () {
        var res,
            i,
            len = points.length,
            p = [];

        for (i = 0; i < len; i++) {
            p.push([points[i].X(), points[i].Y()]);
        }

        res = Metapost.curve(p, controls);
        this.dataX = res[0];
        this.dataY = res[1];
    };
    el.bezierDegree = 3;

    le = points.length;
    el.setParents(points);
    for (i = 0; i < le; i++) {
        if (Type.isPoint(points[i])) {
            points[i].addChild(el);
        }
    }
    el.elType = 'metapostspline';

    return el;
};

JXG.registerElement("metapostspline", JXG.createMetapostSpline);

/**
 * @class Visualize the Riemann sum which is an approximation of an integral by a finite sum.
 * It is realized as a special curve.
 * The returned element has the method Value() which returns the sum of the areas of the bars.
 * <p>
 * In case of type "simpson" and "trapezoidal", the horizontal line approximating the function value
 * is replaced by a parabola or a secant. IN case of "simpson",
 * the parabola is approximated visually by a polygonal chain of fixed step width.
 *
 * @pseudo
 * @name Riemannsum
 * @augments JXG.Curve
 * @constructor
 * @type Curve
 * @param {function,array_number,function_string,function_function,number_function,number} f,n,type_,a_,b_ Parent elements of Riemannsum are a
 *         Either a function term f(x) describing the function graph which is filled by the Riemann bars, or
 *         an array consisting of two functions and the area between is filled by the Riemann bars.
 *         <p>
 *         n determines the number of bars, it is either a fixed number or a function.
 *         <p>
 *         type is a string or function returning one of the values:  'left', 'right', 'middle', 'lower', 'upper', 'random', 'simpson', or 'trapezoidal'.
 *         Default value is 'left'. "simpson" is Simpson's 1/3 rule.
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
 * </pre><div class="jxgbox" id="JXG940f40cc-2015-420d-9191-c5d83de988cf" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function(){
 *   var board = JXG.JSXGraph.initBoard('JXG940f40cc-2015-420d-9191-c5d83de988cf', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
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
 * </pre><div class="jxgbox" id="JXGf9a7ba38-b50f-4a32-a873-2f3bf9caee79" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function(){
 *   var board = JXG.JSXGraph.initBoard('JXGf9a7ba38-b50f-4a32-a873-2f3bf9caee79', {boundingbox: [-3, 7, 5, -3], axis: true, showcopyright: false, shownavigation: false});
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
    n = Type.createFunction(parents[1], board, "");

    if (!Type.exists(n)) {
        throw new Error(
            "JSXGraph: JXG.createRiemannsum: argument '2' n has to be number or function." +
            "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]"
        );
    }

    if (typeof parents[2] === 'string') {
        parents[2] = '\'' + parents[2] + '\'';
    }

    type = Type.createFunction(parents[2], board, "");
    if (!Type.exists(type)) {
        throw new Error(
            "JSXGraph: JXG.createRiemannsum: argument 3 'type' has to be string or function." +
            "\nPossible parent types: [function,n:number|function,type,start:number|function,end:number|function]"
        );
    }

    par = [[0], [0]].concat(parents.slice(3));

    c = board.create("curve", par, attr);

    c.sum = 0.0;
    /**
     * Returns the value of the Riemann sum, i.e. the sum of the (signed) areas of the rectangles.
     * @name Value
     * @memberOf Riemannsum.prototype
     * @function
     * @returns {Number} value of Riemann sum.
     */
    c.Value = function () {
        return this.sum;
    };

    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var u = Numerics.riemann(f, n(), type(), this.minX(), this.maxX());
        this.dataX = u[0];
        this.dataY = u[1];

        // Update "Riemann sum"
        this.sum = u[2];
    };

    c.addParentsFromJCFunctions([n, type]);

    return c;
};

JXG.registerElement("riemannsum", JXG.createRiemannsum);

/**
 * @class A trace curve is simple locus curve showing the orbit of a point that depends on a glider point.
 * @pseudo
 * @name Tracecurve
 * @augments JXG.Curve
 * @constructor
 * @type Object
 * @descript JXG.Curve
 * @param {Point} Parent elements of Tracecurve are a
 *         glider point and a point whose locus is traced.
 * @param {point}
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
 * </pre><div class="jxgbox" id="JXG5749fb7d-04fc-44d2-973e-45c1951e29ad" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var tc1_board = JXG.JSXGraph.initBoard('JXG5749fb7d-04fc-44d2-973e-45c1951e29ad', {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false});
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
        throw new Error(
            "JSXGraph: Can't create trace curve with given parent'" +
            "\nPossible parent types: [glider, point]"
        );
    }

    glider = board.select(parents[0]);
    tracepoint = board.select(parents[1]);

    if (glider.type !== Const.OBJECT_TYPE_GLIDER || !Type.isPoint(tracepoint)) {
        throw new Error(
            "JSXGraph: Can't create trace curve with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [glider, point]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'tracecurve');
    attr.curvetype = 'plot';
    c = board.create("curve", [[0], [0]], attr);

    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var i, step, t, el, pEl, x, y, from,
            savetrace,
            le = this.visProp.numberpoints,
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

JXG.registerElement("tracecurve", JXG.createTracecurve);

/**
     * @class A step function is a function graph that is piecewise constant.
     *
     * In case the data points should be updated after creation time,
     * they can be accessed by curve.xterm and curve.yterm.
     * @pseudo
     * @name Stepfunction
     * @augments JXG.Curve
     * @constructor
     * @type Curve
     * @description JXG.Curve
     * @param {Array|Function} Parent1 elements of Stepfunction are two arrays containing the coordinates.
     * @param {Array|Function} Parent2
     * @see JXG.Curve
     * @example
     * // Create step function.
     var curve = board.create('stepfunction', [[0,1,2,3,4,5], [1,3,0,2,2,1]]);

     * </pre><div class="jxgbox" id="JXG32342ec9-ad17-4339-8a97-ff23dc34f51a" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var sf1_board = JXG.JSXGraph.initBoard('JXG32342ec9-ad17-4339-8a97-ff23dc34f51a', {boundingbox: [-1, 5, 6, -2], axis: true, showcopyright: false, shownavigation: false});
     *   var curve = sf1_board.create('stepfunction', [[0,1,2,3,4,5], [1,3,0,2,2,1]]);
     * </script><pre>
     */
JXG.createStepfunction = function (board, parents, attributes) {
    var c, attr;
    if (parents.length !== 2) {
        throw new Error(
            "JSXGraph: Can't create step function with given parent'" +
            "\nPossible parent types: [array, array|function]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'stepfunction');
    c = board.create("curve", parents, attr);
    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var i,
            j = 0,
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

JXG.registerElement("stepfunction", JXG.createStepfunction);

/**
 * @class A curve visualizing the function graph of the (numerical) derivative of a given curve.
 *
 * @pseudo
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
 * </pre><div id="JXGb9600738-1656-11e8-8184-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGb9600738-1656-11e8-8184-901b0e1b8723',
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
    var c, curve, dx, dy, attr;

    if (parents.length !== 1 && parents[0].class !== Const.OBJECT_CLASS_CURVE) {
        throw new Error(
            "JSXGraph: Can't create derivative curve with given parent'" +
            "\nPossible parent types: [curve]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'curve');

    curve = parents[0];
    dx = Numerics.D(curve.X);
    dy = Numerics.D(curve.Y);

    c = board.create(
        "curve",
        [
            function (t) {
                return curve.X(t);
            },
            function (t) {
                return dy(t) / dx(t);
            },
            curve.minX(),
            curve.maxX()
        ],
        attr
    );

    c.setParents(curve);

    return c;
};

JXG.registerElement("derivative", JXG.createDerivative);

/**
 * @class The path forming the intersection of two closed path elements.
 * The elements may be of type curve, circle, polygon, inequality.
 * If one element is a curve, it has to be closed.
 * The resulting element is of type curve.
 * @pseudo
 * @name CurveIntersection
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve1 First element which is intersected
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve2 Second element which is intersected
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @example
 * var f = board.create('functiongraph', ['cos(x)']);
 * var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 * var circ = board.create('circle', [[0,0], 4]);
 * var clip = board.create('curveintersection', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 * </pre><div id="JXGe2948257-8835-4276-9164-8acccb48e8d4" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGe2948257-8835-4276-9164-8acccb48e8d4',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var f = board.create('functiongraph', ['cos(x)']);
 *     var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 *     var circ = board.create('circle', [[0,0], 4]);
 *     var clip = board.create('curveintersection', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createCurveIntersection = function (board, parents, attributes) {
    var c;

    if (parents.length !== 2) {
        throw new Error(
            "JSXGraph: Can't create curve intersection with given parent'" +
            "\nPossible parent types: [array, array|function]"
        );
    }

    c = board.create("curve", [[], []], attributes);
    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var a = Clip.intersection(parents[0], parents[1], this.board);
        this.dataX = a[0];
        this.dataY = a[1];
    };
    return c;
};

/**
 * @class The path forming the union of two closed path elements.
 * The elements may be of type curve, circle, polygon, inequality.
 * If one element is a curve, it has to be closed.
 * The resulting element is of type curve.
 * @pseudo
 * @name CurveUnion
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve1 First element defining the union
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve2 Second element defining the union
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @example
 * var f = board.create('functiongraph', ['cos(x)']);
 * var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 * var circ = board.create('circle', [[0,0], 4]);
 * var clip = board.create('curveunion', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 * </pre><div id="JXGe2948257-8835-4276-9164-8acccb48e8d4" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGe2948257-8835-4276-9164-8acccb48e8d4',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var f = board.create('functiongraph', ['cos(x)']);
 *     var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 *     var circ = board.create('circle', [[0,0], 4]);
 *     var clip = board.create('curveunion', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createCurveUnion = function (board, parents, attributes) {
    var c;

    if (parents.length !== 2) {
        throw new Error(
            "JSXGraph: Can't create curve union with given parent'" +
            "\nPossible parent types: [array, array|function]"
        );
    }

    c = board.create("curve", [[], []], attributes);
    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var a = Clip.union(parents[0], parents[1], this.board);
        this.dataX = a[0];
        this.dataY = a[1];
    };
    return c;
};

/**
 * @class The path forming the difference of two closed path elements.
 * The elements may be of type curve, circle, polygon, inequality.
 * If one element is a curve, it has to be closed.
 * The resulting element is of type curve.
 * @pseudo
 * @name CurveDifference
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve1 First element from which the second element is "subtracted"
 * @param {JXG.Curve|JXG.Polygon|JXG.Circle} curve2 Second element which is subtracted from the first element
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @example
 * var f = board.create('functiongraph', ['cos(x)']);
 * var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 * var circ = board.create('circle', [[0,0], 4]);
 * var clip = board.create('curvedifference', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 * </pre><div id="JXGe2948257-8835-4276-9164-8acccb48e8d4" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGe2948257-8835-4276-9164-8acccb48e8d4',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var f = board.create('functiongraph', ['cos(x)']);
 *     var ineq = board.create('inequality', [f], {inverse: true, fillOpacity: 0.1});
 *     var circ = board.create('circle', [[0,0], 4]);
 *     var clip = board.create('curvedifference', [ineq, circ], {fillColor: 'yellow', fillOpacity: 0.6});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createCurveDifference = function (board, parents, attributes) {
    var c;

    if (parents.length !== 2) {
        throw new Error(
            "JSXGraph: Can't create curve difference with given parent'" +
            "\nPossible parent types: [array, array|function]"
        );
    }

    c = board.create("curve", [[], []], attributes);
    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var a = Clip.difference(parents[0], parents[1], this.board);
        this.dataX = a[0];
        this.dataY = a[1];
    };
    return c;
};

JXG.registerElement("curvedifference", JXG.createCurveDifference);
JXG.registerElement("curveintersection", JXG.createCurveIntersection);
JXG.registerElement("curveunion", JXG.createCurveUnion);

// /**
//  * @class Concat of two path elements, in general neither is a closed path. The parent elements have to be curves, too.
//  * The resulting element is of type curve. The curve points are simply concatenated.
//  * @pseudo
//  * @name CurveConcat
//  * @param {JXG.Curve} curve1 First curve element.
//  * @param {JXG.Curve} curve2 Second curve element.
//  * @augments JXG.Curve
//  * @constructor
//  * @type JXG.Curve
//  */
// JXG.createCurveConcat = function (board, parents, attributes) {
//     var c;

//     if (parents.length !== 2) {
//         throw new Error(
//             "JSXGraph: Can't create curve difference with given parent'" +
//                 "\nPossible parent types: [array, array|function]"
//         );
//     }

//     c = board.create("curve", [[], []], attributes);
//     /**
//      * @class
//      * @ignore
//      */
//     c.updateCurve = function () {
//         this.points = parents[0].points.concat(
//                 [new JXG.Coords(Const.COORDS_BY_USER, [NaN, NaN], this.board)]
//             ).concat(parents[1].points);
//         this.numberPoints = this.points.length;
//         return this;
//     };

//     return c;
// };

// JXG.registerElement("curveconcat", JXG.createCurveConcat);

/**
 * @class Vertical or horizontal box plot curve to present numerical data through their quartiles.
 * The direction of the box plot is controlled by the attribute "dir".
 * @pseudo
 * @name Boxplot
 * @param {Array} quantiles Array containing at least five quantiles. The elements can be of type number, function or string.
 * @param {Number|Function} axis Axis position of the box plot
 * @param {Number|Function} width Width of the rectangle part of the box plot. The width of the first and 4th quantile
 * is relative to this width and can be controlled by the attribute "smallWidth".
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @example
 * var Q = [ -1, 2, 3, 3.5, 5 ];
 *
 * var b = board.create('boxplot', [Q, 2, 4], {strokeWidth: 3});
 *
 * </pre><div id="JXG13eb23a1-a641-41a2-be11-8e03e400a947" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG13eb23a1-a641-41a2-be11-8e03e400a947',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var Q = [ -1, 2, 3, 3.5, 5 ];
 *     var b = board.create('boxplot', [Q, 2, 4], {strokeWidth: 3});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var Q = [ -1, 2, 3, 3.5, 5 ];
 * var b = board.create('boxplot', [Q, 3, 4], {dir: 'horizontal', smallWidth: 0.25, color:'red'});
 *
 * </pre><div id="JXG0deb9cb2-84bc-470d-a6db-8be9a5694813" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG0deb9cb2-84bc-470d-a6db-8be9a5694813',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var Q = [ -1, 2, 3, 3.5, 5 ];
 *     var b = board.create('boxplot', [Q, 3, 4], {dir: 'horizontal', smallWidth: 0.25, color:'red'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var data = [57, 57, 57, 58, 63, 66, 66, 67, 67, 68, 69, 70, 70, 70, 70, 72, 73, 75, 75, 76, 76, 78, 79, 81];
 * var Q = [];
 *
 * Q[0] = JXG.Math.Statistics.min(data);
 * Q = Q.concat(JXG.Math.Statistics.percentile(data, [25, 50, 75]));
 * Q[4] = JXG.Math.Statistics.max(data);
 *
 * var b = board.create('boxplot', [Q, 0, 3]);
 *
 * </pre><div id="JXGef079e76-ae99-41e4-af29-1d07d83bf85a" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGef079e76-ae99-41e4-af29-1d07d83bf85a',
 *             {boundingbox: [-5,90,5,30], axis: true, showcopyright: false, shownavigation: false});
 *     var data = [57, 57, 57, 58, 63, 66, 66, 67, 67, 68, 69, 70, 70, 70, 70, 72, 73, 75, 75, 76, 76, 78, 79, 81];
 *     var Q = [];
 *
 *     Q[0] = JXG.Math.Statistics.min(data);
 *     Q = Q.concat(JXG.Math.Statistics.percentile(data, [25, 50, 75]));
 *     Q[4] = JXG.Math.Statistics.max(data);
 *
 *     var b = board.create('boxplot', [Q, 0, 3]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var mi = board.create('glider', [0, -1, board.defaultAxes.y]);
 * var ma = board.create('glider', [0, 5, board.defaultAxes.y]);
 * var Q = [function() { return mi.Y(); }, 2, 3, 3.5, function() { return ma.Y(); }];
 *
 * var b = board.create('boxplot', [Q, 0, 2]);
 *
 * </pre><div id="JXG3b3225da-52f0-42fe-8396-be9016bf289b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG3b3225da-52f0-42fe-8396-be9016bf289b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var mi = board.create('glider', [0, -1, board.defaultAxes.y]);
 *     var ma = board.create('glider', [0, 5, board.defaultAxes.y]);
 *     var Q = [function() { return mi.Y(); }, 2, 3, 3.5, function() { return ma.Y(); }];
 *
 *     var b = board.create('boxplot', [Q, 0, 2]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createBoxPlot = function (board, parents, attributes) {
    var box, i, len,
        attr = Type.copyAttributes(attributes, board.options, 'boxplot');

    if (parents.length !== 3) {
        throw new Error(
            "JSXGraph: Can't create box plot with given parent'" +
            "\nPossible parent types: [array, number|function, number|function] containing quantiles, axis, width"
        );
    }
    if (parents[0].length < 5) {
        throw new Error(
            "JSXGraph: Can't create box plot with given parent[0]'" +
            "\nparent[0] has to contain at least 5 quantiles."
        );
    }
    box = board.create("curve", [[], []], attr);

    len = parents[0].length; // Quantiles
    box.Q = [];
    for (i = 0; i < len; i++) {
        box.Q[i] = Type.createFunction(parents[0][i], board);
    }
    box.x = Type.createFunction(parents[1], board);
    box.w = Type.createFunction(parents[2], board);

    /**
     * @class
     * @ignore
     */
    box.updateDataArray = function () {
        var v1, v2, l1, l2, r1, r2, w2, dir, x;

        w2 = this.evalVisProp('smallwidth');
        dir = this.evalVisProp('dir');
        x = this.x();
        l1 = x - this.w() * 0.5;
        l2 = x - this.w() * 0.5 * w2;
        r1 = x + this.w() * 0.5;
        r2 = x + this.w() * 0.5 * w2;
        v1 = [x, l2, r2, x, x, l1, l1, r1, r1, x, NaN, l1, r1, NaN, x, x, l2, r2, x];
        v2 = [
            this.Q[0](),
            this.Q[0](),
            this.Q[0](),
            this.Q[0](),
            this.Q[1](),
            this.Q[1](),
            this.Q[3](),
            this.Q[3](),
            this.Q[1](),
            this.Q[1](),
            NaN,
            this.Q[2](),
            this.Q[2](),
            NaN,
            this.Q[3](),
            this.Q[4](),
            this.Q[4](),
            this.Q[4](),
            this.Q[4]()
        ];
        if (dir === 'vertical') {
            this.dataX = v1;
            this.dataY = v2;
        } else {
            this.dataX = v2;
            this.dataY = v1;
        }
    };

    box.addParentsFromJCFunctions([box.Q, box.x, box.w]);

    return box;
};

JXG.registerElement("boxplot", JXG.createBoxPlot);

/**
 * @class An implicit curve is a plane curve defined by an implicit equation
 * relating two coordinate variables, commonly <i>x</i> and <i>y</i>.
 * For example, the unit circle is defined by the implicit equation
 * x<sup>2</sup> + y<sup>2</sup> = 1.
 * In general, every implicit curve is defined by an equation of the form
 * <i>f(x, y) = 0</i>
 * for some function <i>f</i> of two variables. (<a href="https://en.wikipedia.org/wiki/Implicit_curve">Wikipedia</a>)
 * <p>
 * The partial derivatives for <i>f</i> are optional. If not given, numerical
 * derivatives are used instead. This is good enough for most practical use cases.
 * But if supplied, both partial derivatives must be supplied.
 * <p>
 * The most effective attributes to tinker with if the implicit curve algorithm fails are
 * {@link ImplicitCurve#resolution_outer},
 * {@link ImplicitCurve#resolution_inner},
 * {@link ImplicitCurve#alpha_0},
 * {@link ImplicitCurve#h_initial},
 * {@link ImplicitCurve#h_max}, and
 * {@link ImplicitCurve#qdt_box}.
 *
 * @pseudo
 * @name ImplicitCurve
 * @param {Function|String} f Function of two variables for the left side of the equation <i>f(x,y)=0</i>.
 * If f is supplied as string, it has to use the variables 'x' and 'y'.
 * @param {Function|String} [dfx=null] Optional partial derivative in respect to the first variable
 * If dfx is supplied as string, it has to use the variables 'x' and 'y'.
 * @param {Function|String} [dfy=null] Optional partial derivative in respect to the second variable
 * If dfy is supplied as string, it has to use the variables 'x' and 'y'.
 * @param {Array|Function} [rangex=boundingbox] Optional array of length 2
 * of the form [x_min, x_max] setting the domain of the x coordinate of the implicit curve.
 * If not supplied, the board's boundingbox (+ the attribute 'margin') is taken.
 * @param {Array|Function} [rangey=boundingbox] Optional array of length 2
 * of the form [y_min, y_max] setting the domain of the y coordinate of the implicit curve.
 * If not supplied, the board's boundingbox (+ the attribute 'margin') is taken.
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 *
 * @example
 *   var f, c;
 *   f = (x, y) => 1 / 16 * x ** 2 + y ** 2 - 1;
 *   c = board.create('implicitcurve', [f], {
 *       strokeWidth: 3,
 *       strokeColor: JXG.palette.red,
 *       strokeOpacity: 0.8
 *   });
 *
 * </pre><div id="JXGa6e86701-1a82-48d0-b007-3a3d32075076" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGa6e86701-1a82-48d0-b007-3a3d32075076',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var f, c;
 *             f = (x, y) => 1 / 16 * x ** 2 + y ** 2 - 1;
 *             c = board.create('implicitcurve', [f], {
 *                 strokeWidth: 3,
 *                 strokeColor: JXG.palette.red,
 *                 strokeOpacity: 0.8
 *             });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *  var a, c, f;
 *  a = board.create('slider', [[-3, 6], [3, 6], [-3, 1, 3]], {
 *      name: 'a', stepWidth: 0.1
 *  });
 *  f = (x, y) => x ** 2 - 2 * x * y - 2 * x + (a.Value() + 1) * y ** 2 + (4 * a.Value() + 2) * y + 4 * a.Value() - 3;
 *  c = board.create('implicitcurve', [f], {
 *      strokeWidth: 3,
 *      strokeColor: JXG.palette.red,
 *      strokeOpacity: 0.8,
 *      resolution_outer: 20,
 *      resolution_inner: 20
 *  });
 *
 * </pre><div id="JXG0b133a54-9509-4a65-9722-9c5145e23b40" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG0b133a54-9509-4a65-9722-9c5145e23b40',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var a, c, f;
 *             a = board.create('slider', [[-3, 6], [3, 6], [-3, 1, 3]], {
 *                 name: 'a', stepWidth: 0.1
 *             });
 *             f = (x, y) => x ** 2 - 2 * x * y - 2 * x + (a.Value() + 1) * y ** 2 + (4 * a.Value() + 2) * y + 4 * a.Value() - 3;
 *             c = board.create('implicitcurve', [f], {
 *                 strokeWidth: 3,
 *                 strokeColor: JXG.palette.red,
 *                 strokeOpacity: 0.8,
 *                 resolution_outer: 20,
 *                 resolution_inner: 20
 *             });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *  var c = board.create('implicitcurve', ['abs(x * y) - 3'], {
 *      strokeWidth: 3,
 *      strokeColor: JXG.palette.red,
 *      strokeOpacity: 0.8
 *  });
 *
 * </pre><div id="JXG02802981-0abb-446b-86ea-ee588f02ed1a" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG02802981-0abb-446b-86ea-ee588f02ed1a',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var c = board.create('implicitcurve', ['abs(x * y) - 3'], {
 *                 strokeWidth: 3,
 *                 strokeColor: JXG.palette.red,
 *                 strokeOpacity: 0.8
 *             });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var niveauline = [];
 * niveauline = [0.5, 1, 1.5, 2];
 * for (let i = 0; i < niveauline.length; i++) {
 *     board.create("implicitcurve", [
 *         (x, y) => x ** .5 * y ** .5 - niveauline[i],
           [0.25, 3], [0.5, 4] // Domain
 *     ], {
 *         strokeWidth: 2,
 *         strokeColor: JXG.palette.red,
 *         strokeOpacity: (1 + i) / niveauline.length,
 *         needsRegularUpdate: false
 *     });
 * }
 *
 * </pre><div id="JXGccee9aab-6dd9-4a79-827d-3164f70cc6a1" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGccee9aab-6dd9-4a79-827d-3164f70cc6a1',
 *             {boundingbox: [-1, 5, 5,-1], axis: true, showcopyright: false, shownavigation: false});
 *         var niveauline = [];
 *         niveauline = [0.5, 1, 1.5, 2];
 *         for (let i = 0; i < niveauline.length; i++) {
 *             board.create("implicitcurve", [
 *                 (x, y) => x ** .5 * y ** .5 - niveauline[i],
 *                 [0.25, 3], [0.5, 4]
 *             ], {
 *                 strokeWidth: 2,
 *                 strokeColor: JXG.palette.red,
 *                 strokeOpacity: (1 + i) / niveauline.length,
 *                 needsRegularUpdate: false
 *             });
 *         }
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createImplicitCurve = function (board, parents, attributes) {
    var c, attr;

    if ([1, 3, 5].indexOf(parents.length) < 0) {
        throw new Error(
            "JSXGraph: Can't create curve implicitCurve with given parent'" +
            "\nPossible parent types: [f], [f, rangex, rangey], [f, dfx, dfy] or [f, dfx, dfy, rangex, rangey]" +
            "\nwith functions f, dfx, dfy and arrays of length 2 rangex, rangey."
        );
    }

    // if (parents.length === 3) {
    //     if (!Type.isArray(parents[1]) && !Type.isArray(parents[2])) {
    //         throw new Error(
    //             "JSXGraph: Can't create curve implicitCurve with given parent'" +
    //             "\nPossible parent types: [f], [f, rangex, rangey], [f, dfx, dfy] or [f, dfx, dfy, rangex, rangey]" +
    //             "\nwith functions f, dfx, dfy and arrays of length 2 rangex, rangey."
    //         );
    //     }
    // }
    // if (parents.length === 5) {
    //     if (!Type.isArray(parents[3]) && !Type.isArray(parents[4])) {
    //         throw new Error(
    //             "JSXGraph: Can't create curve implicitCurve with given parent'" +
    //             "\nPossible parent types: [f], [f, rangex, rangey], [f, dfx, dfy] or [f, dfx, dfy, rangex, rangey]" +
    //             "\nwith functions f, dfx, dfy and arrays of length 2 rangex, rangey."
    //         );
    //     }
    // }

    attr = Type.copyAttributes(attributes, board.options, 'implicitcurve');
    c = board.create("curve", [[], []], attr);

    /**
     * Function of two variables for the left side of the equation <i>f(x,y)=0</i>.
     *
     * @name f
     * @memberOf ImplicitCurve.prototype
     * @function
     * @returns {Number}
     */
    c.f = Type.createFunction(parents[0], board, 'x, y');

    /**
     * Partial derivative in the first variable of
     * the left side of the equation <i>f(x,y)=0</i>.
     * If null, then numerical derivative is used.
     *
     * @name dfx
     * @memberOf ImplicitCurve.prototype
     * @function
     * @returns {Number}
     */
    if (parents.length === 5 || Type.isString(parents[1]) || Type.isFunction(parents[1])) {
        c.dfx = Type.createFunction(parents[1], board, 'x, y');
    } else {
        c.dfx = null;
    }

    /**
     * Partial derivative in the second variable of
     * the left side of the equation <i>f(x,y)=0</i>.
     * If null, then numerical derivative is used.
     *
     * @name dfy
     * @memberOf ImplicitCurve.prototype
     * @function
     * @returns {Number}
     */
    if (parents.length === 5 || Type.isString(parents[2]) || Type.isFunction(parents[2])) {
        c.dfy = Type.createFunction(parents[2], board, 'x, y');
    } else {
        c.dfy = null;
    }

    /**
     * Defines a domain for searching f(x,y)=0. Default is null, meaning
     * the bounding box of the board is used.
     * Using domain, visProp.margin is ignored.
     * @name domain
     * @memberOf ImplicitCurve.prototype
     * @param {Array} of length 4 defining the domain used to compute the implict curve.
     * Syntax: [x_min, y_max, x_max, y_min]
     */
    // c.domain = board.getBoundingBox();
    c.domain = null;
    if (parents.length === 5) {
        c.domain = [parents[3], parents[4]];
        //     [Math.min(parents[3][0], parents[3][1]), Math.max(parents[3][0], parents[3][1])],
        //     [Math.min(parents[4][0], parents[4][1]), Math.max(parents[4][0], parents[4][1])]
        // ];
    } else if (parents.length === 3) {
        c.domain = [parents[1], parents[2]];
        //     [Math.min(parents[1][0], parents[1][1]), Math.max(parents[1][0], parents[1][1])],
        //     [Math.min(parents[2][0], parents[2][1]), Math.max(parents[2][0], parents[2][1])]
        // ];
    }

    /**
     * @class
     * @ignore
     */
    c.updateDataArray = function () {
        var bbox, rx, ry,
            ip, cfg,
            ret = [],
            mgn;

        if (this.domain === null) {
            mgn = this.evalVisProp('margin');
            bbox = this.board.getBoundingBox();
            bbox[0] -= mgn;
            bbox[1] += mgn;
            bbox[2] += mgn;
            bbox[3] -= mgn;
        } else {
            rx = Type.evaluate(this.domain[0]);
            ry = Type.evaluate(this.domain[1]);
            bbox = [
                Math.min(rx[0], rx[1]),
                Math.max(ry[0], ry[1]),
                Math.max(rx[0], rx[1]),
                Math.min(ry[0], ry[1])
                // rx[0], ry[1], rx[1], ry[0]
            ];
        }

        cfg = {
            resolution_out: Math.max(0.01, this.evalVisProp('resolution_outer')),
            resolution_in: Math.max(0.01, this.evalVisProp('resolution_inner')),
            max_steps: this.evalVisProp('max_steps'),
            alpha_0: this.evalVisProp('alpha_0'),
            tol_u0: this.evalVisProp('tol_u0'),
            tol_newton: this.evalVisProp('tol_newton'),
            tol_cusp: this.evalVisProp('tol_cusp'),
            tol_progress: this.evalVisProp('tol_progress'),
            qdt_box: this.evalVisProp('qdt_box'),
            kappa_0: this.evalVisProp('kappa_0'),
            delta_0: this.evalVisProp('delta_0'),
            h_initial: this.evalVisProp('h_initial'),
            h_critical: this.evalVisProp('h_critical'),
            h_max: this.evalVisProp('h_max'),
            loop_dist: this.evalVisProp('loop_dist'),
            loop_dir: this.evalVisProp('loop_dir'),
            loop_detection: this.evalVisProp('loop_detection'),
            unitX: this.board.unitX,
            unitY: this.board.unitY
        };
        this.dataX = [];
        this.dataY = [];

        // console.time("implicit plot");
        ip = new ImplicitPlot(bbox, cfg, this.f, this.dfx, this.dfy);
        this.qdt = ip.qdt;

        ret = ip.plot();
        // console.timeEnd("implicit plot");

        this.dataX = ret[0];
        this.dataY = ret[1];
    };

    c.elType = 'implicitcurve';

    return c;
};

JXG.registerElement("implicitcurve", JXG.createImplicitCurve);


export default JXG.Curve;

// export default {
//     Curve: JXG.Curve,
//     createCardinalSpline: JXG.createCardinalSpline,
//     createCurve: JXG.createCurve,
//     createCurveDifference: JXG.createCurveDifference,
//     createCurveIntersection: JXG.createCurveIntersection,
//     createCurveUnion: JXG.createCurveUnion,
//     createDerivative: JXG.createDerivative,
//     createFunctiongraph: JXG.createFunctiongraph,
//     createMetapostSpline: JXG.createMetapostSpline,
//     createPlot: JXG.createFunctiongraph,
//     createSpline: JXG.createSpline,
//     createRiemannsum: JXG.createRiemannsum,
//     createStepfunction: JXG.createStepfunction,
//     createTracecurve: JXG.createTracecurve
// };

// const Curve = JXG.Curve;
// export { Curve as default, Curve};
