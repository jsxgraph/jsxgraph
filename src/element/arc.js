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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 math/geometry
 math/math
 base/coords
 base/circle
 utils/type
 base/constants
  elements:
   curve
   midpoint
   circumcenter
 */

/**
 * @fileoverview In this file the geometry object Arc is defined. Arc stores all
 * style and functional properties that are required to draw an arc on a board.
 */

define([
    'jxg', 'math/geometry', 'math/math', 'base/coords', 'base/circle', 'utils/type', 'base/constants',
    'base/curve', 'element/composition'
], function (JXG, Geometry, Mat, Coords, Circle, Type, Const, Curve, Compositions) {

    "use strict";

    /**
     * @class An arc is a segment of the circumference of a circle. It is defined by a center, one point that
     * defines the radius, and a third point that defines the angle of the arc.
     * @pseudo
     * @name Arc
     * @augments Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The result will be an arc of a circle around p1 through p2. The arc is drawn
     * counter-clockwise from p2 to p3.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [2.0, 2.0]);
     * var p2 = board.create('point', [1.0, 0.5]);
     * var p3 = board.create('point', [3.5, 1.0]);
     *
     * var a = board.create('arc', [p1, p2, p3]);
     * </pre><div id="114ef584-4a5e-4686-8392-c97501befb5b" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('114ef584-4a5e-4686-8392-c97501befb5b', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [2.0, 2.0]),
     *       p2 = board.create('point', [1.0, 0.5]),
     *       p3 = board.create('point', [3.5, 1.0]),
     *
     *       a = board.create('arc', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createArc = function (board, parents, attributes) {
        var el, attr, i;


        // this method is used to create circumccirclearcs, too. if a circumcirclearc is created we get a fourth
        // point, that's why we need to check that case, too.
        if (parents.length < 3 || parents[0].elementClass !== Const.OBJECT_CLASS_POINT || parents[1].elementClass !== Const.OBJECT_CLASS_POINT ||
                parents[2].elementClass !== Const.OBJECT_CLASS_POINT || (parents[3] && parents[3].elementClass !== Const.OBJECT_CLASS_POINT)) {
            throw new Error("JSXGraph: Can't create Arc with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" +
                (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'arc');
        el = board.create('curve', [[0], [0]], attr);

        el.elType = 'arc';

        el.parents = [];
        for (i = 0; i < parents.length; i++) {
            if (parents[i].id) {
                el.parents.push(parents[i].id);
            }
        }

        /**
         * documented in JXG.GeometryElement
         * @ignore
         */
        el.type = Const.OBJECT_TYPE_ARC;

        /**
         * Center of the arc.
         * @memberOf Arc.prototype
         * @name center
         * @type JXG.Point
         */
        el.center = board.select(parents[0]);

        /**
         * Point defining the arc's radius.
         * @memberOf Arc.prototype
         * @name radiuspoint
         * @type JXG.Point
         */
        el.radiuspoint = board.select(parents[1]);
        el.point2 = el.radiuspoint;

        /**
         * The point defining the arc's angle.
         * @memberOf Arc.prototype
         * @name anglepoint
         * @type JXG.Point
         */
        el.anglepoint = board.select(parents[2]);
        el.point3 = el.anglepoint;

        // Add arc as child to defining points
        el.center.addChild(el);
        el.radiuspoint.addChild(el);
        el.anglepoint.addChild(el);

        // should be documented in options
        el.useDirection = attr.usedirection;

        // documented in JXG.Curve
        el.updateDataArray = function () {
            var ar, phi, v, det, p0c, p1c, p2c,
                sgn = 1,
                A = this.radiuspoint,
                B = this.center,
                C = this.anglepoint;

            phi = Geometry.rad(A, B, C);
            if ((this.visProp.type === 'minor' && phi > Math.PI) ||
                    (this.visProp.type === 'major' && phi < Math.PI)) {
                sgn = -1;
            }

            // This is true for circumCircleArcs. In that case there is
            // a fourth parent element: [center, point1, point3, point2]
            if (this.useDirection) {
                p0c = parents[1].coords.usrCoords;
                p1c = parents[3].coords.usrCoords;
                p2c = parents[2].coords.usrCoords;
                det = (p0c[1] - p2c[1]) * (p0c[2] - p1c[2]) - (p0c[2] - p2c[2]) * (p0c[1] - p1c[1]);

                if (det < 0) {
                    this.radiuspoint = parents[1];
                    this.anglepoint = parents[2];
                } else {
                    this.radiuspoint = parents[2];
                    this.anglepoint = parents[1];
                }
            }

            A = A.coords.usrCoords;
            B = B.coords.usrCoords;
            C = C.coords.usrCoords;

            ar = Geometry.bezierArc(A, B, C, false, sgn);

            this.dataX = ar[0];
            this.dataY = ar[1];

            this.bezierDegree = 3;

            this.updateStdform();
            this.updateQuadraticform();
        };

        /**
         * Determines the arc's current radius. I.e. the distance between {@link Arc#center} and {@link Arc#radiuspoint}.
         * @memberOf Arc.prototype
         * @name Radius
         * @function
         * @returns {Number} The arc's radius
         */
        el.Radius = function () {
            return this.radiuspoint.Dist(this.center);
        };

        /**
         * @deprecated Use {@link Arc#Radius}
         * @memberOf Arc.prototype
         * @name getRadius
         * @function
         * @returns {Number}
         */
        el.getRadius = function () {
            return this.Radius();
        };

        /**
         * Returns the length of the arc.
         * @memberOf Arc.prototype
         * @name Value
         * @function
         * @returns {Number} The arc length
         */
        el.Value = function () {
            return this.Radius() * Geometry.rad(this.radiuspoint, this.center, this.anglepoint);
        };

        // documented in geometry element
        el.hasPoint = function (x, y) {
            var dist, checkPoint,
                has, angle, alpha, beta,
                invMat, c,
                prec = this.board.options.precision.hasPoint / this.board.unitX,
                r = this.Radius();

            checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);

            if (this.transformations.length > 0) {
                // Transform the mouse/touch coordinates
                // back to the original position of the curve.
                this.updateTransformMatrix();
                invMat = Mat.inverse(this.transformMat);
                c = Mat.matVecMult(invMat, checkPoint.usrCoords);
                checkPoint = new Coords(Const.COORDS_BY_USER, c, this.board);
            }

            dist = this.center.coords.distance(Const.COORDS_BY_USER, checkPoint);
            has = (Math.abs(dist - r) < prec);

            /**
             * At that point we know that the user has touched the circle line.
             */
            if (has) {
                angle = Geometry.rad(this.radiuspoint, this.center, checkPoint.usrCoords.slice(1));
                alpha = 0.0;
                beta = Geometry.rad(this.radiuspoint, this.center, this.anglepoint);

                if ((this.visProp.type === 'minor' && beta > Math.PI) ||
                        (this.visProp.type === 'major' && beta < Math.PI)) {
                    alpha = beta;
                    beta = 2 * Math.PI;
                }
                if (angle < alpha || angle > beta) {
                    has = false;
                }
            }

            return has;
        };

        /**
         * Checks whether (x,y) is within the sector defined by the arc.
         * @memberOf Arc.prototype
         * @name hasPointSector
         * @function
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is within the sector defined by the arc, False otherwise.
         */
        el.hasPointSector = function (x, y) {
            var angle, alpha, beta,
                checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
                r = this.Radius(),
                dist = this.center.coords.distance(Const.COORDS_BY_USER, checkPoint),
                has = (dist < r);

            if (has) {
                angle = Geometry.rad(this.radiuspoint, this.center, checkPoint.usrCoords.slice(1));
                alpha = 0;
                beta = Geometry.rad(this.radiuspoint, this.center, this.anglepoint);

                if ((this.visProp.type === 'minor' && beta > Math.PI) ||
                        (this.visProp.type === 'major' && beta < Math.PI)) {
                    alpha = beta;
                    beta = 2 * Math.PI;
                }
                if (angle < alpha || angle > beta) {
                    has = false;
                }
            }

            return has;
        };

        // documented in geometry element
        el.getTextAnchor = function () {
            return this.center.coords;
        };

        // documented in geometry element
        el.getLabelAnchor = function () {
            var coords, vecx, vecy, len,
                angle = Geometry.rad(this.radiuspoint, this.center, this.anglepoint),
                dx = 10 / this.board.unitX,
                dy = 10 / this.board.unitY,
                p2c = this.point2.coords.usrCoords,
                pmc = this.center.coords.usrCoords,
                bxminusax = p2c[1] - pmc[1],
                byminusay = p2c[2] - pmc[2];

            if (Type.exists(this.label)) {
                this.label.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
            }

            if ((this.visProp.type === 'minor' && angle > Math.PI) ||
                    (this.visProp.type === 'major' && angle < Math.PI)) {
                angle = -(2 * Math.PI - angle);
            }

            coords = new Coords(Const.COORDS_BY_USER, [
                pmc[1] + Math.cos(angle * 0.5) * bxminusax - Math.sin(angle * 0.5) * byminusay,
                pmc[2] + Math.sin(angle * 0.5) * bxminusax + Math.cos(angle * 0.5) * byminusay
            ], this.board);

            vecx = coords.usrCoords[1] - pmc[1];
            vecy = coords.usrCoords[2] - pmc[2];

            len = Math.sqrt(vecx * vecx + vecy * vecy);
            vecx = vecx * (len + dx) / len;
            vecy = vecy * (len + dy) / len;

            return new Coords(Const.COORDS_BY_USER, [pmc[1] + vecx, pmc[2] + vecy], this.board);
        };

        // documentation in jxg.circle
        el.updateQuadraticform = Circle.Circle.prototype.updateQuadraticform;

        // documentation in jxg.circle
        el.updateStdform = Circle.Circle.prototype.updateStdform;

        el.methodMap = JXG.deepCopy(el.methodMap, {
            getRadius: 'getRadius',
            radius: 'Radius',
            center: 'center',
            radiuspoint: 'radiuspoint',
            anglepoint: 'anglepoint'
        });

        el.prepareUpdate().update();
        return el;
    };

    JXG.registerElement('arc', JXG.createArc);

    /**
     * @class A semicircle is a special arc defined by two points. The arc hits both points.
     * @pseudo
     * @name Semicircle
     * @augments Arc
     * @constructor
     * @type Arc
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point} p1,p2 The result will be a composition of an arc drawn clockwise from <tt>p1</tt> and
     * <tt>p2</tt> and the midpoint of <tt>p1</tt> and <tt>p2</tt>.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [4.5, 2.0]);
     * var p2 = board.create('point', [1.0, 0.5]);
     *
     * var a = board.create('semicircle', [p1, p2]);
     * </pre><div id="5385d349-75d7-4078-b732-9ae808db1b0e" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('5385d349-75d7-4078-b732-9ae808db1b0e', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [4.5, 2.0]),
     *       p2 = board.create('point', [1.0, 0.5]),
     *
     *       sc = board.create('semicircle', [p1, p2]);
     * })();
     * </script><pre>
     */
    JXG.createSemicircle = function (board, parents, attributes) {
        var el, mp, attr;

        // we need 2 points
        if ((Type.isPoint(parents[0])) && (Type.isPoint(parents[1]))) {
            attr = Type.copyAttributes(attributes, board.options, 'semicircle', 'midpoint');
            mp = board.create('midpoint', [parents[0], parents[1]], attr);

            mp.dump = false;

            attr = Type.copyAttributes(attributes, board.options, 'semicircle');
            el = board.create('arc', [mp, parents[1], parents[0]], attr);

            el.elType = 'semicircle';
            el.parents = [parents[0].id, parents[1].id];
            el.subs = {
                midpoint: mp
            };

            /**
             * The midpoint of the two defining points.
             * @memberOf Semicircle.prototype
             * @name midpoint
             * @type Midpoint
             */
            el.midpoint = el.center = mp;
        } else {
            throw new Error("JSXGraph: Can't create Semicircle with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,point]");
        }

        return el;
    };

    JXG.registerElement('semicircle', JXG.createSemicircle);

    /**
     * @class A circumcircle arc is an {@link Arc} defined by three points. All three points lie on the arc.
     * @pseudo
     * @name CircumcircleArc
     * @augments Arc
     * @constructor
     * @type Arc
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The result will be a composition of an arc of the circumcircle of
     * <tt>p1</tt>, <tt>p2</tt>, and <tt>p3</tt> and the midpoint of the circumcircle of the three points. The arc is drawn
     * counter-clockwise from <tt>p1</tt> over <tt>p2</tt> to <tt>p3</tt>.
     * @example
     * // Create a circum circle arc out of three free points
     * var p1 = board.create('point', [2.0, 2.0]);
     * var p2 = board.create('point', [1.0, 0.5]);
     * var p3 = board.create('point', [3.5, 1.0]);
     *
     * var a = board.create('arc', [p1, p2, p3]);
     * </pre><div id="87125fd4-823a-41c1-88ef-d1a1369504e3" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('87125fd4-823a-41c1-88ef-d1a1369504e3', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [2.0, 2.0]),
     *       p2 = board.create('point', [1.0, 0.5]),
     *       p3 = board.create('point', [3.5, 1.0]),
     *
     *       cca = board.create('circumcirclearc', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createCircumcircleArc = function (board, parents, attributes) {
        var el, mp, attr;

        // We need three points
        if ((Type.isPoint(parents[0])) && (Type.isPoint(parents[1])) && (Type.isPoint(parents[2]))) {
            attr = Type.copyAttributes(attributes, board.options, 'circumcirclearc', 'center');
            mp = board.create('circumcenter', [parents[0], parents[1], parents[2]], attr);

            mp.dump = false;

            attr = Type.copyAttributes(attributes, board.options, 'circumcirclearc');
            attr.usedirection = true;
            el = board.create('arc', [mp, parents[0], parents[2], parents[1]], attr);

            el.elType = 'circumcirclearc';
            el.parents = [parents[0].id, parents[1].id, parents[2].id];
            el.subs = {
                center: mp
            };

            /**
             * The midpoint of the circumcircle of the three points defining the circumcircle arc.
             * @memberOf CircumcircleArc.prototype
             * @name center
             * @type Circumcenter
             */
            el.center = mp;
        } else {
            throw new Error("JSXGraph: create Circumcircle Arc with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        return el;
    };

    JXG.registerElement('circumcirclearc', JXG.createCircumcircleArc);

    /**
     * @class A minor arc is a segment of the circumference of a circle having measure less than or equal to
     * 180 degrees (pi radians). It is defined by a center, one point that
     * defines the radius, and a third point that defines the angle of the arc.
     * @pseudo
     * @name MinorArc
     * @augments Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Minor arc is an arc of a circle around p1 having measure less than or equal to
     * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [2.0, 2.0]);
     * var p2 = board.create('point', [1.0, 0.5]);
     * var p3 = board.create('point', [3.5, 1.0]);
     *
     * var a = board.create('arc', [p1, p2, p3]);
     * </pre><div id="af27ddcc-265f-428f-90dd-d31ace945800" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('af27ddcc-265f-428f-90dd-d31ace945800', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [2.0, 2.0]),
     *       p2 = board.create('point', [1.0, 0.5]),
     *       p3 = board.create('point', [3.5, 1.0]),
     *
     *       a = board.create('minorarc', [p1, p2, p3]);
     * })();
     * </script><pre>
     */

    JXG.createMinorArc = function (board, parents, attributes) {
        attributes.type = 'minor';
        return JXG.createArc(board, parents, attributes);
    };

    JXG.registerElement('minorarc', JXG.createMinorArc);

    /**
     * @class A major arc is a segment of the circumference of a circle having measure greater than or equal to
     * 180 degrees (pi radians). It is defined by a center, one point that
     * defines the radius, and a third point that defines the angle of the arc.
     * @pseudo
     * @name MinorArc
     * @augments Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 . Major arc is an arc of a circle around p1 having measure greater than or equal to
     * 180 degrees (pi radians) and starts at p2. The radius is determined by p2, the angle by p3.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [2.0, 2.0]);
     * var p2 = board.create('point', [1.0, 0.5]);
     * var p3 = board.create('point', [3.5, 1.0]);
     *
     * var a = board.create('arc', [p1, p2, p3]);
     * </pre><div id="83c6561f-7561-4047-b98d-036248a00932" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('83c6561f-7561-4047-b98d-036248a00932', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [2.0, 2.0]),
     *       p2 = board.create('point', [1.0, 0.5]),
     *       p3 = board.create('point', [3.5, 1.0]),
     *
     *       a = board.create('majorarc', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createMajorArc = function (board, parents, attributes) {
        attributes.type = 'major';
        return JXG.createArc(board, parents, attributes);
    };

    JXG.registerElement('majorarc', JXG.createMajorArc);

    return {
        createArc: JXG.createArc,
        createSemicircle: JXG.createSemicircle,
        createCircumcircleArc: JXG.createCircumcircleArc,
        createMinorArc: JXG.createMinorArc,
        createMajorArc: JXG.createMajorArc
    };
});
