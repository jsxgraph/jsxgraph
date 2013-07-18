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
 base/constants
 utils/type
  elements:
   point
   curve
   circumcentre
   transform
 */

define([
    'jxg', 'math/geometry', 'math/math', 'math/statistics', 'base/coords', 'base/constants', 'utils/type', 'base/point', 'base/curve',
    'base/transformation', 'element/composition'
], function (JXG, Geometry, Mat, Statistics, Coords, Const, Type, Point, Curve, Transform, Compositions) {

    "use strict";

    /**
     * @class A circular sector is a subarea of the area enclosed by a circle. It is enclosed by two radii and an arc.
     * @pseudo
     * @name Sector
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 A sector is defined by three points: The sector's center <tt>p1</tt>,
     * a second point <tt>p2</tt> defining the radius and a third point <tt>p3</tt> defining the angle of the sector. The
     * Sector is always drawn counter clockwise from <tt>p2</tt> to <tt>p3</tt>
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [1.5, 5.0]),
     *     p2 = board.create('point', [1.0, 0.5]),
     *     p3 = board.create('point', [5.0, 3.0]),
     *
     *     a = board.create('sector', [p1, p2, p3]);
     * </pre><div id="49f59123-f013-4681-bfd9-338b89893156" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('49f59123-f013-4681-bfd9-338b89893156', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *     p1 = board.create('point', [1.5, 5.0]),
     *     p2 = board.create('point', [1.0, 0.5]),
     *     p3 = board.create('point', [5.0, 3.0]),
     *
     *     a = board.create('sector', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createSector = function (board, parents, attributes) {
        var el, i, attr,
            points = ['center', 'radiuspoint', 'anglepoint'];

        // Three points?
        if (!(Type.isPoint(parents[0]) && Type.isPoint(parents[1]) && Type.isPoint(parents[2]))) {
            
            if (parents[0].elementClass === Const.OBJECT_CLASS_LINE &&
                parents[1].elementClass === Const.OBJECT_CLASS_LINE &&
                Type.isArray(parents[2]) &&
                Type.isArray(parents[3]) &&
                Type.isNumber(parents[4])) {
                    
                attr = Type.copyAttributes(attributes, board.options, 'sector');
                el = board.create('curve', [[0], [0]], attr);
                el.type = Const.OBJECT_TYPE_SECTOR;

                el.elType = 'sector';
                el.Radius = function () {
                    return parents[4];
                };

                el.line1 = board.select(parents[0]),
                el.line2 = board.select(parents[1]);
                
                /* Intersection point*/
                var s = Geometry.meetLineLine(el.line1.stdform, el.line2.stdform, 0, board);
                
                /* project p1 to l1 */
                var v = [0, el.line1.stdform[1], el.line1.stdform[2]];
                v = Mat.crossProduct(v, parents[2]);
                v = Geometry.meetLineLine(v, el.line1.stdform, 0, board);
                v = Statistics.subtract(v.usrCoords, s.usrCoords);
                el.dir1 = (Mat.innerProduct(v, [0, el.line1.stdform[2], -el.line1.stdform[1]], 3) >= 0) ? +1 : -1;
                
                /* project p1 to l1 */
                v = [0, el.line2.stdform[1], el.line2.stdform[2]];
                v = Mat.crossProduct(v, parents[2]);
                v = Geometry.meetLineLine(v, el.line2.stdform, 0, board);
                v = Statistics.subtract(v.usrCoords, s.usrCoords);
                el.dir2 = (Mat.innerProduct(v, [0, el.line2.stdform[2], -el.line2.stdform[1]], 3) >= 0) ? +1 : -1;
                
                el.updateDataArray = function () {
                    var r, l1, l2, A, B, C, ar;

                    l1 = this.line1;
                    l2 = this.line2;
            
                    // Intersection point of the lines
                    B = Mat.crossProduct(l1.stdform, l2.stdform);
                    B[1] /= B[0];
                    B[2] /= B[0];
                    B[0] /= B[0];

                    // First point
                    r = this.dir1 * this.Radius();
                    A = Statistics.add(B, [0, r * l1.stdform[2], -r * l1.stdform[1]]);
            
                    // Second point
                    r = this.dir2 * this.Radius();
                    C = Statistics.add(B, [0, r * l2.stdform[2], -r * l2.stdform[1]]);
            
                    if (Math.abs(A[0]) < Mat.eps || Math.abs(B[0]) < Mat.eps || Math.abs(C[0]) < Mat.eps) {
                        this.dataX = [NaN];
                        this.dataY = [NaN];
                        return;
                    }
                    
                    ar = Geometry.bezierArc(A, B, C, true, 1);

                    this.dataX = ar[0];
                    this.dataY = ar[1];
                   
                    this.bezierDegree = 3;
                };    
            
                el.prepareUpdate().update();

                return el;
  
            } else {
                try {
                    for (i = 0; i < parents.length; i++) {
                        if (!Type.isPoint(parents[i])) {
                            attr = Type.copyAttributes(attributes, board.options, 'sector', points[i]);
                            parents[i] = board.create('point', parents[i], attr);
                        }
                    }
                } catch (e) {
                    throw new Error("JSXGraph: Can't create Sector with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" +
                        (typeof parents[2]) + "'.");
                }
               }
        }

        attr = Type.copyAttributes(attributes, board.options, 'sector');

        el = board.create('curve', [[0], [0]], attr);

        el.type = Const.OBJECT_TYPE_SECTOR;

        el.elType = 'sector';
        el.parents = [parents[0].id, parents[1].id, parents[2].id];

        /**
         * Midpoint of the sector.
         * @memberOf Sector.prototype
         * @name point1
         * @type JXG.Point
         */
        el.point1 = board.select(parents[0]);
        el.center = el.point1;

        /**
         * This point together with {@link Sector#point1} defines the radius..
         * @memberOf Sector.prototype
         * @name point2
         * @type JXG.Point
         */
        el.point2 = board.select(parents[1]);
        el.radiuspoint = el.point2;

        /**
         * Defines the sector's angle.
         * @memberOf Sector.prototype
         * @name point3
         * @type JXG.Point
         */
        el.point3 = board.select(parents[2]);
        el.anglepoint = el.point3;

        /* Add arc as child to defining points */
        el.point1.addChild(el);
        el.point2.addChild(el);
        el.point3.addChild(el);

        // useDirection is necessary for circumCircleSectors
        el.useDirection = attributes.usedirection;

        el.methodMap = JXG.deepCopy(el.methodMap, {
            center: 'center',
            radiuspoint: 'radiuspoint',
            anglepoint: 'anglepoint',
            radius: 'getRadius',
            getRadius: 'getRadius'
        });

        /**
         * documented in JXG.Curve
         * @ignore
         */
        el.updateDataArray = function () {
            var ar, det, p0c, p1c, p2c,
                A = this.point2,
                B = this.point1,
                C = this.point3;

            if (!A.isReal || !B.isReal || !C.isReal) {
                this.dataX = [NaN];
                this.dataY = [NaN];
                return;
            }

            // This is true for circumCircleArcs. In that case there is
            // a fourth parent element: [midpoint, point1, point3, point2]
            if (this.useDirection) {
                p0c = parents[1].coords.usrCoords;
                p1c = parents[3].coords.usrCoords;
                p2c = parents[2].coords.usrCoords;
                det = (p0c[1] - p2c[1]) * (p0c[2] - p1c[2]) - (p0c[2] - p2c[2]) * (p0c[1] - p1c[1]);

                if (det < 0) {
                    this.point2 = parents[1];
                    this.point3 = parents[2];
                } else {
                    this.point2 = parents[2];
                    this.point3 = parents[1];
                }
            }
            
            A = A.coords.usrCoords;
            B = B.coords.usrCoords;
            C = C.coords.usrCoords;
      
            ar = Geometry.bezierArc(A, B, C, true, 1);
            
            this.dataX = ar[0];
            this.dataY = ar[1];
            this.bezierDegree = 3;
        };

        /**
         * Returns the radius of the sector.
         * @memberOf Sector.prototype
         * @name Radius
         * @function
         * @returns {Number} The distance between {@link Sector#point1} and {@link Sector#point2}.
         */
        el.Radius = function () {
            return this.point2.Dist(this.point1);
        };

        /**
         * deprecated
         * @ignore
         */
        el.getRadius = function () {
            return this.Radius();
        };

        // documented in geometry element
        el.hasPoint = function (x, y) {
            var angle, alpha, beta,
                prec = this.board.options.precision.hasPoint / (this.board.unitX),
                checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
                r = this.Radius(),
                dist = this.center.coords.distance(Const.COORDS_BY_USER, checkPoint),
                has = (Math.abs(dist - r) < prec);

            if (has) {
                angle = Geometry.rad(this.point2, this.center, checkPoint.usrCoords.slice(1));
                alpha = 0;
                beta = Geometry.rad(this.point2, this.center, this.point3);

                if (angle < alpha || angle > beta) {
                    has = false;
                }
            }

            return has;
        };

        /**
         * Checks whether (x,y) is within the area defined by the sector.
         * @memberOf Sector.prototype
         * @name hasPointSector
         * @function
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is within the sector defined by the arc, False otherwise.
         */
        el.hasPointSector = function (x, y) {
            var angle,
                checkPoint = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board),
                r = this.Radius(),
                dist = this.point1.coords.distance(Const.COORDS_BY_USER, checkPoint),
                has = (dist < r);

            if (has) {
                angle = Geometry.rad(this.point2, this.point1, checkPoint.usrCoords.slice(1));

                if (angle > Geometry.rad(this.point2, this.point1, this.point3)) {
                    has = false;
                }
            }
            return has;
        };

        // documented in GeometryElement
        el.getTextAnchor = function () {
            return this.point1.coords;
        };

        // documented in GeometryElement
        // this method is very similar to arc.getLabelAnchor()
        // there are some additions in the arc version though, mainly concerning
        // "major" and "minor" arcs. but maybe these methods can be merged.
        el.getLabelAnchor = function () {
            var coords, vecx, vecy, len,
                angle = Geometry.rad(this.point2, this.point1, this.point3),
                dx = 13 / this.board.unitX,
                dy = 13 / this.board.unitY,
                p2c = this.point2.coords.usrCoords,
                pmc = this.point1.coords.usrCoords,
                bxminusax = p2c[1] - pmc[1],
                byminusay = p2c[2] - pmc[2];

            if (Type.exists(this.label)) {
                this.label.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
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

        el.prepareUpdate().update();

        return el;
    };

    JXG.registerElement('sector', JXG.createSector);


    /**
     * @class A circumcircle sector is different from a {@link Sector} mostly in the way the parent elements are interpreted.
     * At first, the circum centre is determined from the three given points. Then the sector is drawn from <tt>p1</tt> through
     * <tt>p2</tt> to <tt>p3</tt>.
     * @pseudo
     * @name CircumcircleSector
     * @augments Sector
     * @constructor
     * @type Sector
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 A circumcircle sector is defined by the circumcircle which is determined
     * by these three given points. The circumcircle sector is always drawn from <tt>p1</tt> through <tt>p2</tt> to <tt>p3</tt>.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [1.5, 5.0]),
     *     p2 = board.create('point', [1.0, 0.5]),
     *     p3 = board.create('point', [5.0, 3.0]),
     *
     *     a = board.create('circumcirclesector', [p1, p2, p3]);
     * </pre><div id="695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
 *   var board = JXG.JSXGraph.initBoard('695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('circumcirclesector', [p1, p2, p3]);
 * })();
     * </script><pre>
     */
    JXG.createCircumcircleSector = function (board, parents, attributes) {
        var el, mp, attr;

        if ((Type.isPoint(parents[0])) && (Type.isPoint(parents[1])) && (Type.isPoint(parents[2]))) {
            attr = Type.copyAttributes(attributes, board.options, 'circumcirclesector', 'center');
            mp = board.create('circumcenter', [parents[0], parents[1], parents[2]], attr);

            mp.dump = false;

            attr = Type.copyAttributes(attributes, board.options, 'circumcirclesector');
            el = board.create('sector', [mp, parents[0], parents[2], parents[1]], attr);

            el.elType = 'circumcirclesector';
            el.parents = [parents[0].id, parents[1].id, parents[2].id];

            /**
             * Center of the circumcirclesector
             * @memberOf CircumcircleSector.prototype
             * @name center
             * @type Circumcenter
             */
            el.center = mp;
            el.subs = {
                center: mp
            };
        } else {
            throw new Error("JSXGraph: Can't create circumcircle sector with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");
        }

        return el;
    };

    JXG.registerElement('circumcirclesector', JXG.createCircumcircleSector);


    /**
     * @class The angle element is used to denote an angle defined by three points. Visually it is just a {@link Sector}
     * element with a radius not defined by the parent elements but by an attribute <tt>radius</tt>. As opposed to the sector,
     * an angle has two angle points and no radius point.
     * Sector is displayed if type=="sector".
     * If type=="square", instead of a sector a parallelogram is displayed.
     * In case of type=="auto", a square is displayed if the angle is near orthogonal.
     * If no name is provided the angle label is automatically set to a lower greek letter.
     * @pseudo
     * @name Angle
     * @augments Sector
     * @constructor
     * @type Sector
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 An angle is always drawn counterclockwise from <tt>p1</tt> to
     * <tt>p3</tt> around <tt>p2</tt>.
     * @example
     * // Create an arc out of three free points
     * var p1 = board.create('point', [5.0, 3.0]),
     *     p2 = board.create('point', [1.0, 0.5]),
     *     p3 = board.create('point', [1.5, 5.0]),
     *
     *     a = board.create('angle', [p1, p2, p3]);
     * </pre><div id="a34151f9-bb26-480a-8d6e-9b8cbf789ae5" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('a34151f9-bb26-480a-8d6e-9b8cbf789ae5', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
     *     p1 = board.create('point', [5.0, 3.0]),
     *     p2 = board.create('point', [1.0, 0.5]),
     *     p3 = board.create('point', [1.5, 5.0]),
     *
     *     a = board.create('angle', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createAngle = function (board, parents, attributes) {
        var el, p, q, radius, text, attr, attrsub, i, dot;

        // Test if three points are given
        if ((Type.isPoint(parents[0])) && (Type.isPoint(parents[1])) && (Type.isPoint(parents[2]))) {
            
            attr = Type.copyAttributes(attributes, board.options, 'angle');

            //  If empty, create a new name
            text = attr.name;

            if (!Type.exists(text) || text === '') {
                text = board.generateName({type: Const.OBJECT_TYPE_ANGLE});
                attr.name = text;
            }

            if (Type.exists(attr.radius)) {
                radius = attr.radius;
            } else {
                radius = 0;
            }
            
            /**
             * Helper point: radius point
             * We do this by using the closure variable radius.
             * Later, the constraint function is replaced by nearly the same function, only the radius 
             * is taken from el.visProp.radius.
             */
            attrsub = Type.copyAttributes(attributes, board.options, 'angle', 'radiuspoint');
            p = board.create('point', [function() {                
                    var A = parents[0], S = parents[1],
                        r = Type.evaluate(radius),
                        d = S.Dist(A);
                    
                    return [S.X() + (A.X() - S.X()) * r / d, 
                        S.Y() + (A.Y() - S.Y()) * r / d];
                }], attrsub);
                    
            p.dump = false;

            /**
             * Second helper point for square
             * Helper point: radius point
             * We do this by using the closure variable radius.
             * Later, the constraint function is replaced by nearly the same function, only the radius 
             * is taken from el.visProp.radius.
             */
            attrsub = Type.copyAttributes(attributes, board.options, 'angle', 'pointsquare');
            q = board.create('point', [function() { 
                    var A = parents[2], S = parents[1],
                        r = Type.evaluate(radius),
                        d = S.Dist(A);
                    
                    return [S.X() + (A.X() - S.X()) * r / d, 
                            S.Y() + (A.Y() - S.Y()) * r / d];
                }], attrsub);
            q.dump = false;

            // Sector is just a curve with its own updateDataArray method
            el = board.create('sector', [parents[1], p, parents[2]], attr);
            
            el.elType = 'angle';
            el.parents = [parents[0].id, parents[1].id, parents[2].id];

            /**
             * The point defining the radius of the angle element.
             * @type JXG.Point
             * @name radiuspoint
             * @memberOf Angle.prototype
             */
            el.radiuspoint = p;

            /**
             * The point defining the radius of the angle element. Alias for {@link Angle.prototype#radiuspoint}.
             * @type JXG.Point
             * @name point
             * @memberOf Angle.prototype
             */
            el.point = p;

            /**
             * Helper point for angles of type 'square'.
             * @type JXG.Point
             * @name pointsquare
             * @memberOf Angle.prototype
             */
            el.pointsquare = q;

            el.subs = {
                point: p,
                pointsquare: q
            };

            el.updateDataArraySquare = function () {
                var v, l1, l2, r,
                    S = parents[1];

                v = Mat.crossProduct(q.coords.usrCoords, S.coords.usrCoords);
                l1 = [-p.X() * v[1] - p.Y() * v[2], p.Z() * v[1], p.Z() * v[2]];
                v = Mat.crossProduct(p.coords.usrCoords, S.coords.usrCoords);
                l2 = [-q.X() * v[1] - q.Y() * v[2], q.Z() * v[1], q.Z() * v[2]];
                r = Mat.crossProduct(l1, l2);
                r[1] /= r[0];
                r[2] /= r[0];

                this.dataX = [S.X(), p.X(), r[1], q.X(), S.X()];
                this.dataY = [S.Y(), p.Y(), r[2], q.Y(), S.Y()];
                this.bezierDegree = 1;
            };

            el.updateDataArrayNone = function () {
                this.dataX = [NaN];
                this.dataY = [NaN];
                this.bezierDegree = 1;
            };

            el.updateDataArraySector = el.updateDataArray;

            el.updateDataArray = function () {
                var type = this.visProp.type,
                    deg = Geometry.trueAngle(this.point2, this.point1, this.point3);

                if (Math.abs(deg - 90) < this.visProp.orthosensitivity) {
                    type = this.visProp.orthotype;
                }

                if (type === 'none') {
                    this.updateDataArrayNone();
                } else if (type === 'square') {
                    this.updateDataArraySquare();
                } else if (type === 'sector') {
                    this.updateDataArraySector();
                } else if (type === 'sectordot') {
                    this.updateDataArraySector();
                    if (!this.dot.visProp.visible) {
                        this.dot.setAttribute({visible: true});
                    }
                }

                if (!this.visProp.visible || (type !== 'sectordot' && this.dot.visProp.visible)) {
                    this.dot.setAttribute({visible: false});
                }
            };

            /*
             * Supply the helper points with the correct function, which depends
             * on the visProp.radius property of the sector.
             * With this trick, setAttribute({radius:...}) works.
             */
            p.addConstraint([function () {
                var A = parents[0], S = parents[1],
                    r = Type.evaluate(el.visProp.radius),
                    d = S.Dist(A);
                    
                return [S.X() + (A.X() - S.X()) * r / d, 
                        S.Y() + (A.Y() - S.Y()) * r / d];
            }]);
            
            q.addConstraint([function () {
                var A = parents[2], S = parents[1],
                    r = Type.evaluate(el.visProp.radius),
                    d = S.Dist(A);
                    
                return [S.X() + (A.X() - S.X()) * r / d, 
                        S.Y() + (A.Y() - S.Y()) * r / d];
            }]);

            dot = Type.copyAttributes(attributes, board.options, 'angle', 'dot');
            
            /**
             * Indicates a right angle. Invisible by default, use <tt>dot.visible: true</tt> to show.
             * Though this dot indicates a right angle, it can be visible even if the angle is not a right
             * one.
             * @type JXG.Point
             * @name dot
             * @memberOf Angle.prototype
             */
            el.dot = board.create('point', [function () {
                if (Type.exists(el.dot) && !el.dot.visProp.visible) {
                    return [0, 0];
                }

                var c = p.coords.usrCoords,
                    a2 = Geometry.rad(parents[0], parents[1], parents[2]) * 0.5,
                    x = parents[1].X(),
                    y = parents[1].Y(),
                    mat = [
                        [1, 0, 0],
                        [x - 0.5 * x * Math.cos(a2) + 0.5 * y * Math.sin(a2), Math.cos(a2) * 0.5, -Math.sin(a2) * 0.5],
                        [y - 0.5 * x * Math.sin(a2) - 0.5 * y * Math.cos(a2), Math.sin(a2) * 0.5,  Math.cos(a2) * 0.5]
                    ];

                return Mat.matVecMult(mat, c);
            }], dot);

            el.dot.dump = false;
            el.subs.dot = el.dot;

            for (i = 0; i < 3; i++) {
                board.select(parents[i]).addChild(p);
                board.select(parents[i]).addChild(el.dot);
            }

            el.type = Const.OBJECT_TYPE_ANGLE;
            board.select(parents[0]).addChild(el);

            // Determine the midpoint of the angle sector line.
            el.rot = board.create('transform', [
                function () {
                    return 0.5 * Geometry.rad(el.point2, el.point1, el.point3);
                },
                el.point1
            ], {type: 'rotate'});

            // documented in GeometryElement
            el.getLabelAnchor = function () {
                var vecx, vecy, len, vec,
                    dx = 12,
                    dy = 12,
                    pmc = this.point1.coords.usrCoords;

                if (Type.exists(this.label)) {
                    this.label.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
                }

                if (Type.exists(this.label.visProp.fontSize)) {
                    dx = this.label.visProp.fontSize;
                    dy = this.label.visProp.fontSize;
                }
                dx /= this.board.unitX;
                dy /= this.board.unitY;

                this.rot.update();
                vec = Mat.matVecMult(this.rot.matrix, this.point2.coords.usrCoords);
                vecx = vec[1] - pmc[1];
                vecy = vec[2] - pmc[2];
                len = Math.sqrt(vecx * vecx + vecy * vecy);
                vecx = vecx * (len + dx) / len;
                vecy = vecy * (len + dy) / len;
                return new Coords(Const.COORDS_BY_USER, [pmc[1] + vecx, pmc[2] + vecy], this.board);
            };

            el.Value = function () {
                return Geometry.rad(this.point2, this.point1, this.point3);
            };
            
        } else {
            throw new Error("JSXGraph: Can't create angle with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");
        }

        /**
         * Set an angle to a prescribed value given in radians. This is only possible if the third point of the angle, i.e.
         * the anglepoint is a free point.
         * @name setAngle
         * @function
         * @param {Number|Function} val Number or Function which returns the size of the angle in Radians
         * @returns {Object} Pointer to the angle element..
         * @memberOf Angle.prototype
         */
        el.setAngle = function (val) {
            var t,
                p = this.anglepoint,
                q = this.radiuspoint;

            if (p.draggable()) {
                t = this.board.create('transform', [val, this.center], {type: 'rotate'});
                p.addTransform(q, t);
                p.isDraggable = false;
                p.parents = [q];
            }
            return this;
        };

        /**
         * Frees an angle from a prescribed value. This is only relevant if the angle size has been set by
         * setAngle() previously. The anglepoint is set to a free point.
         * @name free
         * @function
         * @returns {Object} Pointer to the angle element..
         * @memberOf Angle.prototype
         */
        el.free = function () {
            var p = this.anglepoint;
            if (p.transformations.length > 0) {
                p.transformations.pop();
                p.isDraggable = true;
                p.parents = [];
            }
            return this;
        };

        el.methodMap = Type.deepCopy(el.methodMap, {
            Value: 'Value',
            setAngle: 'setAngle',
            free: 'free'
        });

        return el;
    };

    JXG.registerElement('angle', JXG.createAngle);

    return {
        createSector: JXG.createSector,
        createCircumcircleSector: JXG.createCircumcircleSector,
        createAngle: JXG.createAngle
    };
});
