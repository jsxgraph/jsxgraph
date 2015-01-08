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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/element
 base/constants
 base/coords
 parser/geonext
 math/geometry
 math/statistics
 utils/type
  elements:
   transform
   point
 */

/**
 * @fileoverview The geometry object Circle is defined in this file. Circle stores all
 * style and functional properties that are required to draw and move a circle on
 * a board.
 * @author graphjs
 * @version 0.1
 */

define([
    'jxg', 'base/element', 'base/coords', 'base/constants', 'parser/geonext', 'math/geometry', 'math/statistics',
    'utils/type', 'base/transformation', 'base/point'
], function (JXG, GeometryElement, Coords, Const, GeonextParser, Geometry, Statistics, Type, Transform, Point) {

    "use strict";

    /**
     * A circle consists of all points with a given distance from one point. This point is called center, the distance is called radius.
     * A circle can be constructed by providing a center and a point on the circle or a center and a radius (given as a number, function,
     * line, or circle).
     * @class Creates a new circle object. Do not use this constructor to create a circle. Use {@link JXG.Board#create} with
     * type {@link Circle} instead.
     * @constructor
     * @augments JXG.GeometryElement
     * @param {JXG.Board} board The board the new circle is drawn on.
     * @param {String} method Can be
     * <ul><li> <b>'twoPoints'</b> which means the circle is defined by its center and a point on the circle.</li>
     * <li><b>'pointRadius'</b> which means the circle is defined by its center and its radius in user units</li>
     * <li><b>'pointLine'</b> which means the circle is defined by its center and its radius given by the distance from the startpoint and the endpoint of the line</li>
     * <li><b>'pointCircle'</b> which means the circle is defined by its center and its radius given by the radius of another circle</li></ul>
     * The parameters p1, p2 and radius must be set according to this method parameter.
     * @param {JXG.Point} par1 center of the circle.
     * @param {JXG.Point|JXG.Line|JXG.Circle} par2 Can be
     * <ul><li>a point on the circle if method is 'twoPoints'</li>
     * <li>a line if the method is 'pointLine'</li>
     * <li>a circle if the method is 'pointCircle'</li></ul>
     * @param {Object} attributes
     * @see JXG.Board#generateName
     */
    JXG.Circle = function (board, method, par1, par2, attributes) {
        // Call the constructor of GeometryElement
        this.constructor(board, attributes, Const.OBJECT_TYPE_CIRCLE, Const.OBJECT_CLASS_CIRCLE);

        /**
         * Stores the given method.
         * Can be
         * <ul><li><b>'twoPoints'</b> which means the circle is defined by its center and a point on the circle.</li>
         * <li><b>'pointRadius'</b> which means the circle is defined by its center and its radius given in user units or as term.</li>
         * <li><b>'pointLine'</b> which means the circle is defined by its center and its radius given by the distance from the startpoint and the endpoint of the line.</li>
         * <li><b>'pointCircle'</b> which means the circle is defined by its center and its radius given by the radius of another circle.</li></ul>
         * @type string
         * @see #center
         * @see #point2
         * @see #radius
         * @see #line
         * @see #circle
         */
        this.method = method;

        // this is kept so existing code won't ne broken
        this.midpoint = this.board.select(par1);

        /**
         * The circles center. Do not set this parameter directly as it will break JSXGraph's update system.
         * @type JXG.Point
         */
        this.center = this.board.select(par1);

        /** Point on the circle only set if method equals 'twoPoints'. Do not set this parameter directly as it will break JSXGraph's update system.
         * @type JXG.Point
         * @see #method
         */
        this.point2 = null;

        /** Radius of the circle
         * only set if method equals 'pointRadius'
         * @type Number
         * @default null
         * @see #method
         */
        this.radius = 0;

        /** Line defining the radius of the circle given by the distance from the startpoint and the endpoint of the line
         * only set if method equals 'pointLine'. Do not set this parameter directly as it will break JSXGraph's update system.
         * @type JXG.Line
         * @default null
         * @see #method
         */
        this.line = null;

        /** Circle defining the radius of the circle given by the radius of the other circle
         * only set if method equals 'pointLine'. Do not set this parameter directly as it will break JSXGraph's update system.
         * @type JXG.Circle
         * @default null
         * @see #method
         */
        this.circle = null;

        if (method === 'twoPoints') {
            this.point2 = board.select(par2);
            this.radius = this.Radius();
        } else if (method === 'pointRadius') {
            this.gxtterm = par2;
            // Converts GEONExT syntax into JavaScript syntax and generally ensures that the radius is a function
            this.updateRadius = Type.createFunction(par2, this.board, null, true);
            // First evaluation of the graph
            this.updateRadius();
        } else if (method === 'pointLine') {
            // dann ist p2 die Id eines Objekts vom Typ Line!
            this.line = board.select(par2);
            this.radius = this.line.point1.coords.distance(Const.COORDS_BY_USER, this.line.point2.coords);
        } else if (method === 'pointCircle') {
            // dann ist p2 die Id eines Objekts vom Typ Circle!
            this.circle = board.select(par2);
            this.radius = this.circle.Radius();
        }

        // create Label
        this.id = this.board.setId(this, 'C');
        this.board.renderer.drawEllipse(this);
        this.board.finalizeAdding(this);

        this.createGradient();
        this.elType = 'circle';
        this.createLabel();

        this.center.addChild(this);

        if (method === 'pointRadius') {
            this.notifyParents(par2);
        } else if (method === 'pointLine') {
            this.line.addChild(this);
        } else if (method === 'pointCircle') {
            this.circle.addChild(this);
        } else if (method === 'twoPoints') {
            this.point2.addChild(this);
        }

        this.methodMap = Type.deepCopy(this.methodMap, {
            setRadius: 'setRadius',
            getRadius: 'getRadius',
            Area: 'Area',
            area: 'Area',
            radius: 'Radius',
            center: 'center',
            line: 'line',
            point2: 'point2'
        });
    };

    JXG.Circle.prototype = new GeometryElement();

    JXG.extend(JXG.Circle.prototype, /** @lends JXG.Circle.prototype */ {
        /**
         * Checks whether (x,y) is near the circle line or inside of the ellipse
         * (in case JXG.Options.conic#hasInnerPoints is true).
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the circle, False otherwise.
         * @private
         */
        hasPoint: function (x, y) {
            var prec = this.board.options.precision.hasPoint / (this.board.unitX),
                mp = this.center.coords.usrCoords,
                p = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
                r = this.Radius(),
                dist = Math.sqrt((mp[1] - p.usrCoords[1]) * (mp[1] - p.usrCoords[1]) + (mp[2] - p.usrCoords[2]) * (mp[2] - p.usrCoords[2]));

            if (this.visProp.hasinnerpoints) {
                return (dist < r + prec);
            }

            return (Math.abs(dist - r) < prec);
        },

        /**
         * Used to generate a polynomial for a point p that lies on this circle.
         * @param {JXG.Point} p The point for which the polynomial is generated.
         * @returns {Array} An array containing the generated polynomial.
         * @private
         */
        generatePolynomial: function (p) {
            /*
             * We have four methods to construct a circle:
             *   (a) Two points
             *   (b) center and radius
             *   (c) center and radius given by length of a segment
             *   (d) center and radius given by another circle
             *
             * In case (b) we have to distinguish two cases:
             *  (i)  radius is given as a number
             *  (ii) radius is given as a function
             * In the latter case there's no guarantee the radius depends on other geometry elements
             * in a polynomial way so this case has to be omitted.
             *
             * Another tricky case is case (d):
             * The radius depends on another circle so we have to cycle through the ancestors of each circle
             * until we reach one that's radius does not depend on another circles radius.
             *
             *
             * All cases (a) to (d) vary only in calculation of the radius. So the basic formulae for
             * a glider G (g1,g2) on a circle with center M (m1,m2) and radius r is just:
             *
             *     (g1-m1)^2 + (g2-m2)^2 - r^2 = 0
             *
             * So the easiest case is (b) with a fixed radius given as a number. The other two cases (a)
             * and (c) are quite the same: Euclidean distance between two points A (a1,a2) and B (b1,b2),
             * squared:
             *
             *     r^2 = (a1-b1)^2 + (a2-b2)^2
             *
             * For case (d) we have to cycle recursively through all defining circles and finally return the
             * formulae for calculating r^2. For that we use JXG.Circle.symbolic.generateRadiusSquared().
             */
            var m1 = this.center.symbolic.x,
                m2 = this.center.symbolic.y,
                g1 = p.symbolic.x,
                g2 = p.symbolic.y,
                rsq = this.generateRadiusSquared();

            /* No radius can be calculated (Case b.ii) */
            if (rsq === '') {
                return [];
            }

            return ['((' + g1 + ')-(' + m1 + '))^2 + ((' + g2 + ')-(' + m2 + '))^2 - (' + rsq + ')'];
        },

        /**
         * Generate symbolic radius calculation for loci determination with Groebner-Basis algorithm.
         * @returns {String} String containing symbolic calculation of the circle's radius or an empty string
         * if the radius can't be expressed in a polynomial equation.
         * @private
         */
        generateRadiusSquared: function () {
            /*
             * Four cases:
             *
             *   (a) Two points
             *   (b) center and radius
             *   (c) center and radius given by length of a segment
             *   (d) center and radius given by another circle
             */
            var m1, m2, p1, p2, q1, q2,
                rsq = '';

            if (this.method === "twoPoints") {
                m1 = this.center.symbolic.x;
                m2 = this.center.symbolic.y;
                p1 = this.point2.symbolic.x;
                p2 = this.point2.symbolic.y;

                rsq = '((' + p1 + ')-(' + m1 + '))^2 + ((' + p2 + ')-(' + m2 + '))^2';
            } else if (this.method === "pointRadius") {
                if (typeof this.radius === 'number') {
                    rsq = (this.radius * this.radius).toString();
                }
            } else if (this.method === "pointLine") {
                p1 = this.line.point1.symbolic.x;
                p2 = this.line.point1.symbolic.y;

                q1 = this.line.point2.symbolic.x;
                q2 = this.line.point2.symbolic.y;

                rsq = '((' + p1 + ')-(' + q1 + '))^2 + ((' + p2 + ')-(' + q2 + '))^2';
            } else if (this.method === "pointCircle") {
                rsq = this.circle.Radius();
            }

            return rsq;
        },

        /**
         * Uses the boards renderer to update the circle.
         */
        update: function () {
            if (this.needsUpdate) {
                if (this.visProp.trace) {
                    this.cloneToBackground(true);
                }

                if (this.method === 'pointLine') {
                    this.radius = this.line.point1.coords.distance(Const.COORDS_BY_USER, this.line.point2.coords);
                } else if (this.method === 'pointCircle') {
                    this.radius = this.circle.Radius();
                } else if (this.method === 'pointRadius') {
                    this.radius = this.updateRadius();
                }

                this.updateStdform();
                this.updateQuadraticform();
            }

            return this;
        },

        /**
         * Updates this circle's {@link JXG.Circle#quadraticform}.
         * @private
         */
        updateQuadraticform: function () {
            var m = this.center,
                mX = m.X(),
                mY = m.Y(),
                r = this.Radius();

            this.quadraticform = [
                [mX * mX + mY * mY - r * r, -mX, -mY],
                [-mX, 1, 0],
                [-mY, 0, 1]
            ];
        },

        /**
         * Updates the stdform derived from the position of the center and the circle's radius.
         * @private
         */
        updateStdform: function () {
            this.stdform[3] = 0.5;
            this.stdform[4] = this.Radius();
            this.stdform[1] = -this.center.coords.usrCoords[1];
            this.stdform[2] = -this.center.coords.usrCoords[2];
            if (!isFinite(this.stdform[4])) {
                this.stdform[0] = Type.exists(this.point2) ? -(
                    this.stdform[1] * this.point2.coords.usrCoords[1] +
                    this.stdform[2] * this.point2.coords.usrCoords[2]
                ) : 0;
            }
            this.normalize();
        },

        /**
         * Uses the boards renderer to update the circle.
         * @private
         */
        updateRenderer: function () {
            var wasReal;

            if (this.needsUpdate && this.visProp.visible) {
                wasReal = this.isReal;
                this.isReal = (!isNaN(this.center.coords.usrCoords[1] + this.center.coords.usrCoords[2] + this.Radius())) && this.center.isReal;

                if (this.isReal) {
                    if (wasReal !== this.isReal) {
                        this.board.renderer.show(this);

                        if (this.hasLabel && this.label.visProp.visible) {
                            this.board.renderer.show(this.label);
                        }
                    }
                    this.board.renderer.updateEllipse(this);
                } else {
                    if (wasReal !== this.isReal) {
                        this.board.renderer.hide(this);

                        if (this.hasLabel && this.label.visProp.visible) {
                            this.board.renderer.hide(this.label);
                        }
                    }
                }
                this.needsUpdate = false;
            }

            // Update the label if visible.
            if (this.hasLabel && this.label.visProp.visible && this.isReal) {
                this.label.update();
                this.board.renderer.updateText(this.label);
            }
        },

        /**
         * Finds dependencies in a given term and resolves them by adding the elements referenced in this
         * string to the circle's list of ancestors.
         * @param {String} contentStr
         * @private
         */
        notifyParents: function (contentStr) {
            if (typeof contentStr === 'string') {
                GeonextParser.findDependencies(this, contentStr, this.board);
            }
        },

        /**
         * Set a new radius, then update the board.
         * @param {String|Number|function} r A string, function or number describing the new radius.
         * @returns {JXG.Circle} Reference to this circle
         */
        setRadius: function (r) {
            this.updateRadius = Type.createFunction(r, this.board, null, true);
            this.board.update();

            return this;
        },

        /**
         * Calculates the radius of the circle.
         * @param {String|Number|function} [value] Set new radius
         * @returns {Number} The radius of the circle
         */
        Radius: function (value) {
            if (Type.exists(value)) {
                this.setRadius(value);
                return this.Radius();
            }

            if (this.method === 'twoPoints') {
                if (Type.cmpArrays(this.point2.coords.usrCoords, [0, 0, 0]) ||
                        Type.cmpArrays(this.center.coords.usrCoords, [0, 0, 0])) {

                    return NaN;
                }

                return this.center.Dist(this.point2);
            }

            if (this.method === 'pointLine' || this.method === 'pointCircle') {
                return this.radius;
            }

            if (this.method === 'pointRadius') {
                return this.updateRadius();
            }

            return NaN;
        },

        /**
         * Use {@link JXG.Circle#Radius}.
         * @deprecated
         */
        getRadius: function () {
            return this.Radius();
        },

        // documented in geometry element
        getTextAnchor: function () {
            return this.center.coords;
        },

        // documented in geometry element
        getLabelAnchor: function () {
            var x, y,
                r = this.Radius(),
                c = this.center.coords.usrCoords;

            switch (this.visProp.label.position) {
            case 'lft':
                x = c[1] - r;
                y = c[2];
                break;
            case 'llft':
                x = c[1] - Math.sqrt(0.5) * r;
                y = c[2] - Math.sqrt(0.5) * r;
                break;
            case 'rt':
                x = c[1] + r;
                y = c[2];
                break;
            case 'lrt':
                x = c[1] + Math.sqrt(0.5) * r;
                y = c[2] - Math.sqrt(0.5) * r;
                break;
            case 'urt':
                x = c[1] + Math.sqrt(0.5) * r;
                y = c[2] + Math.sqrt(0.5) * r;
                break;
            case 'top':
                x = c[1];
                y = c[2] + r;
                break;
            case 'bot':
                x = c[1];
                y = c[2] - r;
                break;
            default:
                // includes case 'ulft'
                x = c[1] - Math.sqrt(0.5) * r;
                y = c[2] + Math.sqrt(0.5) * r;
                break;
            }

            return new Coords(Const.COORDS_BY_USER, [x, y], this.board);
        },


        // documented in geometry element
        cloneToBackground: function () {
            var er,
                r = this.Radius(),
                copy = {
                    id: this.id + 'T' + this.numTraces,
                    elementClass: Const.OBJECT_CLASS_CIRCLE,
                    center: {
                        coords: this.center.coords
                    },
                    Radius: function () {
                        return r;
                    },
                    getRadius: function () {
                        return r;
                    },
                    board: this.board,
                    visProp: Type.deepCopy(this.visProp, this.visProp.traceattributes, true)
                };

            copy.visProp.layer = this.board.options.layer.trace;

            this.numTraces++;
            Type.clearVisPropOld(copy);

            er = this.board.renderer.enhancedRendering;
            this.board.renderer.enhancedRendering = true;
            this.board.renderer.drawEllipse(copy);
            this.board.renderer.enhancedRendering = er;
            this.traces[copy.id] = copy.rendNode;

            return this;
        },

        /**
         * Add transformations to this circle.
         * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation} or an array of {@link JXG.Transformation}s.
         * @returns {JXG.Circle} Reference to this circle object.
         */
        addTransform: function (transform) {
            var i,
                list = Type.isArray(transform) ? transform : [transform],
                len = list.length;

            for (i = 0; i < len; i++) {
                this.center.transformations.push(list[i]);

                if (this.method === 'twoPoints') {
                    this.point2.transformations.push(list[i]);
                }
            }

            return this;
        },

        // see element.js
        snapToGrid: function () {
            var forceIt = this.visProp.snaptogrid;

            this.center.snapToGrid(forceIt);
            if (this.method === 'twoPoints') {
                this.point2.snapToGrid(forceIt);
            }

            return this;
        },

        // see element.js
        snapToPoints: function () {
            var forceIt = this.visProp.snaptopoints;

            this.center.handleSnapToPoints(forceIt);
            if (this.method === 'twoPoints') {
                this.point2.handleSnapToPoints(forceIt);
            }

            return this;
        },

        /**
         * Treats the circle as parametric curve and calculates its X coordinate.
         * @param {Number} t Number between 0 and 1.
         * @returns {Number} <tt>X(t)= radius*cos(t)+centerX</tt>.
         */
        X: function (t) {
            return this.Radius() * Math.cos(t * 2 * Math.PI) + this.center.coords.usrCoords[1];
        },

        /**
         * Treats the circle as parametric curve and calculates its Y coordinate.
         * @param {Number} t Number between 0 and 1.
         * @returns {Number} <tt>X(t)= radius*sin(t)+centerY</tt>.
         */
        Y: function (t) {
            return this.Radius() * Math.sin(t * 2 * Math.PI) + this.center.coords.usrCoords[2];
        },

        /**
         * Treat the circle as parametric curve and calculates its Z coordinate.
         * @param {Number} t ignored
         * @return {Number} 1.0
         */
        Z: function (t) {
            return 1.0;
        },

        /**
         * Returns 0.
         * @private
         */
        minX: function () {
            return 0.0;
        },

        /**
         * Returns 1.
         * @private
         */
        maxX: function () {
            return 1.0;
        },

        Area: function () {
            var r = this.Radius();

            return r * r * Math.PI;
        },

        bounds: function () {
            var uc = this.center.coords.usrCoords,
                r = this.Radius();

            return [uc[1] - r, uc[2] + r, uc[1] + r, uc[2] - r];
        }
    });

    /**
     * @class This element is used to provide a constructor for a circle.
     * @pseudo
     * @description  A circle consists of all points with a given distance from one point. This point is called center, the distance is called radius.
     * A circle can be constructed by providing a center and a point on the circle or a center and a radius (given as a number, function,
     * line, or circle).
     * @name Circle
     * @augments JXG.Circle
     * @constructor
     * @type JXG.Circle
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_number,JXG.Point,JXG.Line,JXG.Circle} center,radius The center must be given as a {@link JXG.Point}, see {@link JXG.providePoints}, but the radius can be given
     * as a number (which will create a circle with a fixed radius), another {@link JXG.Point}, a {@link JXG.Line} (the distance of start and end point of the
     * line will determine the radius), or another {@link JXG.Circle}.
     * @example
     * // Create a circle providing two points
     * var p1 = board.create('point', [2.0, 2.0]),
     *     p2 = board.create('point', [2.0, 0.0]),
     *     c1 = board.create('circle', [p1, p2]);
     *
     * // Create another circle using the above circle
     * var p3 = board.create('point', [3.0, 2.0]),
     *     c2 = board.create('circle', [p3, c1]);
     * </pre><div id="5f304d31-ef20-4a8e-9c0e-ea1a2b6c79e0" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function() {
     *   var cex1_board = JXG.JSXGraph.initBoard('5f304d31-ef20-4a8e-9c0e-ea1a2b6c79e0', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *       cex1_p1 = cex1_board.create('point', [2.0, 2.0]),
     *       cex1_p2 = cex1_board.create('point', [2.0, 0.0]),
     *       cex1_c1 = cex1_board.create('circle', [cex1_p1, cex1_p2]),
     *       cex1_p3 = cex1_board.create('point', [3.0, 2.0]),
     *       cex1_c2 = cex1_board.create('circle', [cex1_p3, cex1_c1]);
     * })();
     * </script><pre>
     * @example
     * // Create a circle providing two points
     * var p1 = board.create('point', [2.0, 2.0]),
     *     c1 = board.create('circle', [p1, 3]);
     *
     * // Create another circle using the above circle
     * var c2 = board.create('circle', [function() { return [p1.X(), p1.Y() + 1];}, function() { return c1.Radius(); }]);
     * </pre><div id="54165f60-93b9-441d-8979-ac5d0f193020" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function() {
     * var cex1_board = JXG.JSXGraph.initBoard('54165f60-93b9-441d-8979-ac5d0f193020', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     * var p1 = board.create('point', [2.0, 2.0]);
     * var c1 = board.create('circle', [p1, 3]);
     *
     * // Create another circle using the above circle
     * var c2 = board.create('circle', [function() { return [p1.X(), p1.Y() + 1];}, function() { return c1.Radius(); }]);
     * })();
     * </script><pre>
     */
    JXG.createCircle = function (board, parents, attributes) {
        var el, p, i, attr,
            isDraggable = true;

        p = [];
        for (i = 0; i < parents.length; i++) {
            if (Type.isPointType(parents[i], board)) {
                p = p.concat(Type.providePoints(board, [parents[i]], attributes, 'circle', ['center']));
                if (p[p.length - 1] === false) {
                    throw new Error('JSXGraph: Can\'t create circle from this type. Please provide a point type.');
                }
            } else {
                p.push(parents[i]);
            }
        }

        attr = Type.copyAttributes(attributes, board.options, 'circle');

        if (p.length === 2 && Type.isPoint(p[0]) && Type.isPoint(p[1])) {
            // Point/Point
            el = new JXG.Circle(board, 'twoPoints', p[0], p[1], attr);
        } else if ((Type.isNumber(p[0]) || Type.isFunction(p[0]) || Type.isString(p[0])) && Type.isPoint(p[1])) {
            // Number/Point
            el = new JXG.Circle(board, 'pointRadius', p[1], p[0], attr);
        } else if ((Type.isNumber(p[1]) || Type.isFunction(p[1]) || Type.isString(p[1])) && Type.isPoint(p[0])) {
            // Point/Number
            el = new JXG.Circle(board, 'pointRadius', p[0], p[1], attr);
        } else if ((p[0].elementClass === Const.OBJECT_CLASS_CIRCLE) && Type.isPoint(p[1])) {
            // Circle/Point
            el = new JXG.Circle(board, 'pointCircle', p[1], p[0], attr);
        } else if ((p[1].elementClass === Const.OBJECT_CLASS_CIRCLE) && Type.isPoint(p[0])) {
            // Point/Circle
            el = new JXG.Circle(board, 'pointCircle', p[0], p[1], attr);
        } else if ((p[0].elementClass === Const.OBJECT_CLASS_LINE) && Type.isPoint(p[1])) {
            // Line/Point
            el = new JXG.Circle(board, 'pointLine', p[1], p[0], attr);
        } else if ((p[1].elementClass === Const.OBJECT_CLASS_LINE) && Type.isPoint(p[0])) {
            // Point/Line
            el = new JXG.Circle(board, 'pointLine', p[0], p[1], attr);
        } else if (parents.length === 3 && Type.isPoint(p[0]) && Type.isPoint(p[1]) && Type.isPoint(p[2])) {
            // Circle through three points
            // Check if circumcircle element is available
            if (JXG.elements.circumcircle) {
                el = JXG.elements.circumcircle(board, p, attr);
            } else {
                throw new Error('JSXGraph: Can\'t create circle with three points. Please include the circumcircle element (element/composition).');
            }
        } else {
            throw new Error("JSXGraph: Can't create circle with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,point], [point,number], [point,function], [point,circle], [point,point,point]");
        }

        el.isDraggable = isDraggable;
        el.parents = [];

        for (i = 0; i < parents.length; i++) {
            if (parents[i].id) {
                el.parents.push(parents[i].id);
            }
        }

        el.elType = 'circle';
        return el;
    };

    JXG.registerElement('circle', JXG.createCircle);

    return {
        Circle: JXG.Circle,
        createCircle: JXG.createCircle
    };
});
