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
 math/math
 math/geometry
 math/numerics
 math/statistics
 math/symbolic
 base/composition
 base/coords
 base/constants
 utils/type
  elements:
   line
   circle
   transform
   point
   glider
   text
   curve
 */

/**
 * @fileoverview This file contains our composition elements, i.e. these elements are mostly put together
 * from one or more {@link JXG.GeometryElement} but with a special meaning. E.g. the midpoint element is contained here
 * and this is just a {@link JXG.Point} with coordinates dependent from two other points. Currently in this file the
 * following compositions can be found: <ul>
 *   <li>{@link Arrowparallel} (currently private)</li>
 *   <li>{@link Bisector}</li>
 *   <li>{@link Circumcircle}</li>
 *   <li>{@link Circumcirclemidpoint}</li>
 *   <li>{@link Integral}</li>
 *   <li>{@link Midpoint}</li>
 *   <li>{@link Mirrorpoint}</li>
 *   <li>{@link Normal}</li>
 *   <li>{@link Orthogonalprojection}</li>
 *   <li>{@link Parallel}</li>
 *   <li>{@link Perpendicular}</li>
 *   <li>{@link Perpendicularpoint}</li>
 *   <li>{@link Perpendicularsegment}</li>
 *   <li>{@link Reflection}</li></ul>
 */

define([
    'jxg', 'math/math', 'math/geometry', 'math/numerics', 'math/statistics', 'base/coords', 'utils/type', 'base/constants',
    'base/point', 'base/line', 'base/circle', 'base/transformation', 'base/composition', 'base/curve', 'base/text'
], function (JXG, Mat, Geometry, Numerics, Statistics, Coords, Type, Const, Point, Line, Circle, Transform, Composition, Curve, Text) {

    "use strict";

    /**
     * @class This is used to construct a point that is the orthogonal projection of a point to a line.
     * @pseudo
     * @description An orthogonal projection is given by a point and a line. It is determined by projecting the given point
     * orthogonal onto the given line.
     * @constructor
     * @name Orthogonalprojection
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} p,l The constructed point is the orthogonal projection of p onto l.
     * @example
     * var p1 = board.create('point', [0.0, 4.0]);
     * var p2 = board.create('point', [6.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var pp1 = board.create('orthogonalprojection', [p3, l1]);
     * </pre><div id="7708b215-39fa-41b6-b972-19d73d77d791" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var ppex1_board = JXG.JSXGraph.initBoard('7708b215-39fa-41b6-b972-19d73d77d791', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ppex1_p1 = ppex1_board.create('point', [0.0, 4.0]);
     *   var ppex1_p2 = ppex1_board.create('point', [6.0, 1.0]);
     *   var ppex1_l1 = ppex1_board.create('line', [ppex1_p1, ppex1_p2]);
     *   var ppex1_p3 = ppex1_board.create('point', [3.0, 3.0]);
     *   var ppex1_pp1 = ppex1_board.create('orthogonalprojection', [ppex1_p3, ppex1_l1]);
     * </script><pre>
     */
    JXG.createOrthogonalProjection = function (board, parents, attributes) {
        var l, p, t, attr;

        parents[0] = board.select(parents[0]);
        parents[1] = board.select(parents[1]);

        if (Type.isPointType(parents[0], board) && parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            l = parents[1];
        } else if (Type.isPointType(parents[1], board) && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            l = parents[0];
        } else {
            throw new Error("JSXGraph: Can't create perpendicular point with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,line]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'orthogonalprojection');

        t = board.create('point', [
            function () {
                return Geometry.projectPointToLine(p, l, board);
            }
        ], attr);

        p.addChild(t);
        l.addChild(t);

        t.elType = 'orthogonalprojection';
        t.parents = [p.id, t.id];

        t.update();

        t.generatePolynomial = function () {
            /*
             *  Perpendicular takes point P and line L and creates point T and line M:
             *
             *                          | M
             *                          |
             *                          x P (p1,p2)
             *                          |
             *                          |
             *  L                       |
             *  ----------x-------------x------------------------x--------
             *            A (a1,a2)     |T (t1,t2)               B (b1,b2)
             *                          |
             *                          |
             *
             * So we have two conditions:
             *
             *   (a)  AT  || TB          (collinearity condition)
             *   (b)  PT _|_ AB          (orthogonality condition)
             *
             *      a2-t2       t2-b2
             *     -------  =  -------           (1)
             *      a1-t1       t1-b1
             *
             *      p2-t2         a1-b1
             *     -------  =  - -------         (2)
             *      p1-t1         a2-b2
             *
             * Multiplying (1) and (2) with denominators and simplifying gives
             *
             *    a2t1 - a2b1 + t2b1 - a1t2 + a1b2 - t1b2 = 0                  (1')
             *
             *    p2a2 - p2b2 - t2a2 + t2b2 + p1a1 - p1b1 - t1a1 + t1b1 = 0    (2')
             *
             */

            var a1 = l.point1.symbolic.x,
                a2 = l.point1.symbolic.y,
                b1 = l.point2.symbolic.x,
                b2 = l.point2.symbolic.y,

                p1 = p.symbolic.x,
                p2 = p.symbolic.y,
                t1 = t.symbolic.x,
                t2 = t.symbolic.y,

                poly1 = '(' + a2 + ')*(' + t1 + ')-(' + a2 + ')*(' + b1 + ')+(' + t2 + ')*(' + b1 + ')-(' +
                    a1 + ')*(' + t2 + ')+(' + a1 + ')*(' + b2 + ')-(' + t1 + ')*(' + b2 + ')',
                poly2 = '(' + p2 + ')*(' + a2 + ')-(' + p2 + ')*(' + b2 + ')-(' + t2 + ')*(' + a2 + ')+(' +
                    t2 + ')*(' + b2 + ')+(' + p1 + ')*(' + a1 + ')-(' + p1 + ')*(' + b1 + ')-(' + t1 + ')*(' +
                    a1 + ')+(' + t1 + ')*(' + b1 + ')';

            return [poly1, poly2];
        };

        return t;
    };

    /**

     * @class This element is used to provide a constructor for a perpendicular.
     * @pseudo
     * @description  A perpendicular is a composition of two elements: a line and a point. The line is orthogonal
     * to a given line and contains a given point.
     * @name Perpendicular
     * @constructor
     * @type JXG.Line
     * @augments Segment
     * @return A {@link JXG.Line} object through the given point that is orthogonal to the given line.
     * @throws {Error} If the elements cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} l,p The perpendicular line will be orthogonal to l and
     * will contain p.
     * @example
     * // Create a perpendicular
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     *
     * var p3 = board.create('point', [3.0, 3.0]);
     * var perp1 = board.create('perpendicular', [l1, p3]);
     * </pre><div id="d5b78842-7b27-4d37-b608-d02519e6cd03" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var pex1_board = JXG.JSXGraph.initBoard('d5b78842-7b27-4d37-b608-d02519e6cd03', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var pex1_p1 = pex1_board.create('point', [0.0, 2.0]);
     *   var pex1_p2 = pex1_board.create('point', [2.0, 1.0]);
     *   var pex1_l1 = pex1_board.create('line', [pex1_p1, pex1_p2]);
     *   var pex1_p3 = pex1_board.create('point', [3.0, 3.0]);
     *   var pex1_perp1 = pex1_board.create('perpendicular', [pex1_l1, pex1_p3]);
     * </script><pre>
     */
    JXG.createPerpendicular = function (board, parents, attributes) {
        var p, l, pd, attr;

        parents[0] = board.select(parents[0]);
        parents[1] = board.select(parents[1]);

        if (Type.isPointType(parents[0], board) && parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            l = parents[1];
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        } else if (Type.isPointType(parents[1], board) && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            l = parents[0];
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        } else {
            throw new Error("JSXGraph: Can't create perpendicular with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [line,point]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'perpendicular');
        pd = Line.createLine(board, [
            function () {
                return l.stdform[2] * p.X() - l.stdform[1] * p.Y();
            },
            function () {
                return -l.stdform[2] * p.Z();
            },
            function () {
                return l.stdform[1] * p.Z();
            }
        ], attr);

        pd.elType = 'perpendicular';
        pd.parents = [l.id, p.id];

        return pd;
    };

    /**
     * @class This is used to construct a perpendicular point.
     * @pseudo
     * @description A perpendicular point is given by a point and a line. It is determined by projecting the given point
     * orthogonal onto the given line. This element should be used in GEONExTReader only. All other applications should
     * use orthogonal projection {@link Orthogonalprojection}.
     * @constructor
     * @name PerpendicularPoint
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} p,l The constructed point is the orthogonal projection of p onto l.
     * @example
     * var p1 = board.create('point', [0.0, 4.0]);
     * var p2 = board.create('point', [6.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var pp1 = board.create('perpendicularpoint', [p3, l1]);
     * </pre><div id="ded148c9-3536-44c0-ab81-1bb8fa48f3f4" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var ppex1_board = JXG.JSXGraph.initBoard('ded148c9-3536-44c0-ab81-1bb8fa48f3f4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ppex1_p1 = ppex1_board.create('point', [0.0, 4.0]);
     *   var ppex1_p2 = ppex1_board.create('point', [6.0, 1.0]);
     *   var ppex1_l1 = ppex1_board.create('line', [ppex1_p1, ppex1_p2]);
     *   var ppex1_p3 = ppex1_board.create('point', [3.0, 3.0]);
     *   var ppex1_pp1 = ppex1_board.create('perpendicularpoint', [ppex1_p3, ppex1_l1]);
     * </script><pre>
     */
    JXG.createPerpendicularPoint = function (board, parents, attributes) {
        var l, p, t;

        parents[0] = board.select(parents[0]);
        parents[1] = board.select(parents[1]);
        if (Type.isPointType(parents[0], board) && parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            l = parents[1];
        } else if (Type.isPointType(parents[1], board) && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            l = parents[0];
        } else {
            throw new Error("JSXGraph: Can't create perpendicular point with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,line]");
        }

        t = board.create('point', [
            function () {
                return Geometry.perpendicular(l, p, board)[0];
            }
        ], attributes);

        p.addChild(t);
        l.addChild(t);

        t.elType = 'perpendicularpoint';
        t.parents = [p.id, l.id];

        t.update();

        t.generatePolynomial = function () {
            /*
             *  Perpendicular takes point P and line L and creates point T and line M:
             *
             *                          | M
             *                          |
             *                          x P (p1,p2)
             *                          |
             *                          |
             *  L                       |
             *  ----------x-------------x------------------------x--------
             *            A (a1,a2)     |T (t1,t2)               B (b1,b2)
             *                          |
             *                          |
             *
             * So we have two conditions:
             *
             *   (a)  AT  || TB          (collinearity condition)
             *   (b)  PT _|_ AB          (orthogonality condition)
             *
             *      a2-t2       t2-b2
             *     -------  =  -------           (1)
             *      a1-t1       t1-b1
             *
             *      p2-t2         a1-b1
             *     -------  =  - -------         (2)
             *      p1-t1         a2-b2
             *
             * Multiplying (1) and (2) with denominators and simplifying gives
             *
             *    a2t1 - a2b1 + t2b1 - a1t2 + a1b2 - t1b2 = 0                  (1')
             *
             *    p2a2 - p2b2 - t2a2 + t2b2 + p1a1 - p1b1 - t1a1 + t1b1 = 0    (2')
             *
             */
            var a1 = l.point1.symbolic.x,
                a2 = l.point1.symbolic.y,
                b1 = l.point2.symbolic.x,
                b2 = l.point2.symbolic.y,
                p1 = p.symbolic.x,
                p2 = p.symbolic.y,
                t1 = t.symbolic.x,
                t2 = t.symbolic.y,

                poly1 = '(' + a2 + ')*(' + t1 + ')-(' + a2 + ')*(' + b1 + ')+(' + t2 + ')*(' + b1 + ')-(' +
                    a1 + ')*(' + t2 + ')+(' + a1 + ')*(' + b2 + ')-(' + t1 + ')*(' + b2 + ')',
                poly2 = '(' + p2 + ')*(' + a2 + ')-(' + p2 + ')*(' + b2 + ')-(' + t2 + ')*(' + a2 + ')+(' +
                    t2 + ')*(' + b2 + ')+(' + p1 + ')*(' + a1 + ')-(' + p1 + ')*(' + b1 + ')-(' + t1 + ')*(' +
                    a1 + ')+(' + t1 + ')*(' + b1 + ')';

            return [poly1, poly2];
        };

        return t;
    };


    /**
     * @class This element is used to provide a constructor for a perpendicular segment.
     * @pseudo
     * @description  A perpendicular is a composition of two elements: a line segment and a point. The line segment is orthogonal
     * to a given line and contains a given point and meets the given line in the perpendicular point.
     * @name PerpendicularSegment
     * @constructor
     * @type JXG.Line
     * @augments Segment
     * @return An array containing two elements: A {@link JXG.Line} object in the first component and a
     * {@link JXG.Point} element in the second component. The line segment is orthogonal to the given line and meets it
     * in the returned point.
     * @throws {Error} If the elements cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} l,p The perpendicular line will be orthogonal to l and
     * will contain p. The perpendicular point is the intersection point of the two lines.
     * @example
     * // Create a perpendicular
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     *
     * var p3 = board.create('point', [3.0, 3.0]);
     * var perp1 = board.create('perpendicularsegment', [l1, p3]);
     * </pre><div id="037a6eb2-781d-4b71-b286-763619a63f22" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var pex1_board = JXG.JSXGraph.initBoard('037a6eb2-781d-4b71-b286-763619a63f22', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var pex1_p1 = pex1_board.create('point', [0.0, 2.0]);
     *   var pex1_p2 = pex1_board.create('point', [2.0, 1.0]);
     *   var pex1_l1 = pex1_board.create('line', [pex1_p1, pex1_p2]);
     *   var pex1_p3 = pex1_board.create('point', [3.0, 3.0]);
     *   var pex1_perp1 = pex1_board.create('perpendicularsegment', [pex1_l1, pex1_p3]);
     * </script><pre>
     */
    JXG.createPerpendicularSegment = function (board, parents, attributes) {
        var p, l, pd, t, attr;

        parents[0] = board.select(parents[0]);
        parents[1] = board.select(parents[1]);
        if (Type.isPointType(parents[0], board) && parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            l = parents[1];
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        } else if (Type.isPointType(parents[1], board) && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            l = parents[0];
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        } else {
            throw new Error("JSXGraph: Can't create perpendicular with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [line,point]");
        }
        attr = Type.copyAttributes(attributes, board.options, 'perpendicularsegment', 'point');
        t = JXG.createPerpendicularPoint(board, [l, p], attr);

        t.dump = false;

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.line;
        }

        attr = Type.copyAttributes(attributes, board.options, 'perpendicularsegment');
        pd = Line.createLine(board, [
            function () {
                return (Geometry.perpendicular(l, p, board)[1] ? [t, p] : [p, t]);
            }
        ], attr);

        /**
         * Helper point
         * @memberOf PerpendicularSegment.prototype
         * @type PerpendicularPoint
         * @name point
         */
        pd.point = t;

        pd.elType = 'perpendicularsegment';
        pd.parents = [p.id, l.id];
        pd.subs = {
            point: t
        };

        return pd;
    };

    /**
     * @class The midpoint element constructs a point in the middle of two given points.
     * @pseudo
     * @description A midpoint is given by two points. It is collinear to the given points and the distance
     * is the same to each of the given points, i.e. it is in the middle of the given points.
     * @constructor
     * @name Midpoint
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point} p1,p2 The constructed point will be in the middle of p1 and p2.
     * @param {JXG.Line} l The midpoint will be in the middle of {@link JXG.Line#point1} and {@link JXG.Line#point2} of
     * the given line l.
     * @example
     * // Create base elements: 2 points and 1 line
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var l1 = board.create('segment', [[0.0, 3.0], [3.0, 3.0]]);
     *
     * var mp1 = board.create('midpoint', [p1, p2]);
     * var mp2 = board.create('midpoint', [l1]);
     * </pre><div id="7927ef86-24ae-40cc-afb0-91ff61dd0de7" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var mpex1_board = JXG.JSXGraph.initBoard('7927ef86-24ae-40cc-afb0-91ff61dd0de7', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var mpex1_p1 = mpex1_board.create('point', [0.0, 2.0]);
     *   var mpex1_p2 = mpex1_board.create('point', [2.0, 1.0]);
     *   var mpex1_l1 = mpex1_board.create('segment', [[0.0, 3.0], [3.0, 3.0]]);
     *   var mpex1_mp1 = mpex1_board.create('midpoint', [mpex1_p1, mpex1_p2]);
     *   var mpex1_mp2 = mpex1_board.create('midpoint', [mpex1_l1]);
     * </script><pre>
     */
    JXG.createMidpoint = function (board, parents, attributes) {
        var a, b, t, i;

        for (i = 0; i < parents.length; ++i) {
            parents[i] = board.select(parents[i]);
        }
        if (parents.length === 2 && Type.isPointType(parents[0], board) && Type.isPointType(parents[1], board)) {
            parents = Type.providePoints(board, parents, attributes, 'point');
            a = parents[0];
            b = parents[1];
        } else if (parents.length === 1 && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            a = parents[0].point1;
            b = parents[0].point2;
        } else {
            throw new Error("JSXGraph: Can't create midpoint." +
                "\nPossible parent types: [point,point], [line]");
        }

        t = board.create('point', [
            function () {
                var x = a.coords.usrCoords[1] + b.coords.usrCoords[1];
                if (isNaN(x) || Math.abs(a.coords.usrCoords[0]) < Mat.eps || Math.abs(b.coords.usrCoords[0]) < Mat.eps) {
                    return NaN;
                }

                return x * 0.5;
            },
            function () {
                var y = a.coords.usrCoords[2] + b.coords.usrCoords[2];
                if (isNaN(y) || Math.abs(a.coords.usrCoords[0]) < Mat.eps || Math.abs(b.coords.usrCoords[0]) < Mat.eps) {
                    return NaN;
                }

                return y * 0.5;
            }], attributes);
        a.addChild(t);
        b.addChild(t);

        t.elType = 'midpoint';
        t.parents = [a.id, b.id];

        t.prepareUpdate().update();

        t.generatePolynomial = function () {
            /*
             *  Midpoint takes two point A and B or line L (with points P and Q) and creates point T:
             *
             *  L (not necessarily)
             *  ----------x------------------x------------------x--------
             *            A (a1,a2)          T (t1,t2)          B (b1,b2)
             *
             * So we have two conditions:
             *
             *   (a)   AT  ||  TB           (collinearity condition)
             *   (b)  [AT] == [TB]          (equidistant condition)
             *
             *      a2-t2       t2-b2
             *     -------  =  -------                                         (1)
             *      a1-t1       t1-b1
             *
             *     (a1 - t1)^2 + (a2 - t2)^2 = (b1 - t1)^2 + (b2 - t2)^2       (2)
             *
             *
             * Multiplying (1) with denominators and simplifying (1) and (2) gives
             *
             *    a2t1 - a2b1 + t2b1 - a1t2 + a1b2 - t1b2 = 0                      (1')
             *
             *    a1^2 - 2a1t1 + a2^2 - 2a2t2 - b1^2 + 2b1t1 - b2^2 + 2b2t2 = 0    (2')
             *
             */
            var a1 = a.symbolic.x,
                a2 = a.symbolic.y,
                b1 = b.symbolic.x,
                b2 = b.symbolic.y,
                t1 = t.symbolic.x,
                t2 = t.symbolic.y,

                poly1 = '(' + a2 + ')*(' + t1 + ')-(' + a2 + ')*(' + b1 + ')+(' + t2 + ')*(' + b1 + ')-(' +
                    a1 + ')*(' + t2 + ')+(' + a1 + ')*(' + b2 + ')-(' + t1 + ')*(' + b2 + ')',
                poly2 = '(' + a1 + ')^2 - 2*(' + a1 + ')*(' + t1 + ')+(' + a2 + ')^2-2*(' + a2 + ')*(' +
                    t2 + ')-(' + b1 + ')^2+2*(' + b1 + ')*(' + t1 + ')-(' + b2 + ')^2+2*(' + b2 + ')*(' + t2 + ')';

            return [poly1, poly2];
        };

        return t;
    };

    /**
     * @class This element is used to construct a parallel point.
     * @pseudo
     * @description A parallel point is given by three points. Taking the euclidean vector from the first to the
     * second point, the parallel point is determined by adding that vector to the third point.
     * The line determined by the first two points is parallel to the line determined by the third point and the constructed point.
     * @constructor
     * @name Parallelpoint
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 Taking the euclidean vector <tt>v=p2-p1</tt> the parallel point is determined by
     * <tt>p4 = p3+v</tt>
     * @param {JXG.Line_JXG.Point} l,p The resulting point will together with p specify a line which is parallel to l.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var pp1 = board.create('parallelpoint', [p1, p2, p3]);
     * </pre><div id="488c4be9-274f-40f0-a469-c5f70abe1f0e" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var ppex1_board = JXG.JSXGraph.initBoard('488c4be9-274f-40f0-a469-c5f70abe1f0e', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ppex1_p1 = ppex1_board.create('point', [0.0, 2.0]);
     *   var ppex1_p2 = ppex1_board.create('point', [2.0, 1.0]);
     *   var ppex1_p3 = ppex1_board.create('point', [3.0, 3.0]);
     *   var ppex1_pp1 = ppex1_board.create('parallelpoint', [ppex1_p1, ppex1_p2, ppex1_p3]);
     * </script><pre>
     */
    JXG.createParallelPoint = function (board, parents, attributes) {
        var a, b, c, p, i;

        for (i = 0; i < parents.length; ++i) {
            parents[i] = board.select(parents[i]);
        }
        if (parents.length === 3 &&
                Type.isPointType(parents[0], board) &&
                Type.isPointType(parents[1], board) &&
                Type.isPointType(parents[2], board)) {
            parents = Type.providePoints(board, parents, attributes, 'point');
            a = parents[0];
            b = parents[1];
            c = parents[2];
        } else if (Type.isPointType(parents[0], board) &&
                parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            c = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            a = parents[1].point1;
            b = parents[1].point2;
        } else if (Type.isPointType(parents[1], board) &&
                parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            c = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            a = parents[0].point1;
            b = parents[0].point2;
        } else {
            throw new Error("JSXGraph: Can't create parallel point with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [line,point], [point,point,point]");
        }

        p = board.create('point', [
            function () {
                return c.coords.usrCoords[1] + b.coords.usrCoords[1] - a.coords.usrCoords[1];
            },
            function () {
                return c.coords.usrCoords[2] + b.coords.usrCoords[2] - a.coords.usrCoords[2];
            }
        ], attributes);

        // required for algorithms requiring dependencies between elements
        a.addChild(p);
        b.addChild(p);
        c.addChild(p);

        p.elType = 'parallelpoint';
        p.parents = [a.id, b.id, c.id];

        // required to set the coordinates because functions are considered as constraints. hence, the coordinates get set first after an update.
        // can be removed if the above issue is resolved.
        p.prepareUpdate().update();

        p.generatePolynomial = function () {
            /*
             *  Parallelpoint takes three points A, B and C or line L (with points B and C) and creates point T:
             *
             *
             *                     C (c1,c2)                             T (t1,t2)
             *                      x                                     x
             *                     /                                     /
             *                    /                                     /
             *                   /                                     /
             *                  /                                     /
             *                 /                                     /
             *                /                                     /
             *               /                                     /
             *              /                                     /
             *  L (opt)    /                                     /
             *  ----------x-------------------------------------x--------
             *            A (a1,a2)                             B (b1,b2)
             *
             * So we have two conditions:
             *
             *   (a)   CT  ||  AB           (collinearity condition I)
             *   (b)   BT  ||  AC           (collinearity condition II)
             *
             * The corresponding equations are
             *
             *    (b2 - a2)(t1 - c1) - (t2 - c2)(b1 - a1) = 0         (1)
             *    (t2 - b2)(a1 - c1) - (t1 - b1)(a2 - c2) = 0         (2)
             *
             * Simplifying (1) and (2) gives
             *
             *    b2t1 - b2c1 - a2t1 + a2c1 - t2b1 + t2a1 + c2b1 - c2a1 = 0      (1')
             *    t2a1 - t2c1 - b2a1 + b2c1 - t1a2 + t1c2 + b1a2 - b1c2 = 0      (2')
             *
             */
            var a1 = a.symbolic.x,
                a2 = a.symbolic.y,
                b1 = b.symbolic.x,
                b2 = b.symbolic.y,
                c1 = c.symbolic.x,
                c2 = c.symbolic.y,
                t1 = p.symbolic.x,
                t2 = p.symbolic.y,

                poly1 =  '(' + b2 + ')*(' + t1 + ')-(' + b2 + ')*(' + c1 + ')-(' + a2 + ')*(' + t1 + ')+(' +
                    a2 + ')*(' + c1 + ')-(' + t2 + ')*(' + b1 + ')+(' + t2 + ')*(' + a1 + ')+(' + c2 + ')*(' +
                    b1 + ')-(' + c2 + ')*(' + a1 + ')',
                poly2 =  '(' + t2 + ')*(' + a1 + ')-(' + t2 + ')*(' + c1 + ')-(' + b2 + ')*(' + a1 + ')+(' +
                    b2 + ')*(' + c1 + ')-(' + t1 + ')*(' + a2 + ')+(' + t1 + ')*(' + c2 + ')+(' + b1 + ')*(' +
                    a2 + ')-(' + b1 + ')*(' + c2 + ')';

            return [poly1, poly2];
        };

        return p;
    };


    /**
     * @class A parallel is a line through a given point with the same slope as a given line.
     * @pseudo
     * @name Parallel
     * @augments Line
     * @constructor
     * @type JXG.Line
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} l,p The constructed line contains p and has the same slope as l.
     * @example
     * // Create a parallel
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     *
     * var p3 = board.create('point', [3.0, 3.0]);
     * var pl1 = board.create('parallel', [l1, p3]);
     * </pre><div id="24e54f9e-5c4e-4afb-9228-0ef27a59d627" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var plex1_board = JXG.JSXGraph.initBoard('24e54f9e-5c4e-4afb-9228-0ef27a59d627', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var plex1_p1 = plex1_board.create('point', [0.0, 2.0]);
     *   var plex1_p2 = plex1_board.create('point', [2.0, 1.0]);
     *   var plex1_l1 = plex1_board.create('line', [plex1_p1, plex1_p2]);
     *   var plex1_p3 = plex1_board.create('point', [3.0, 3.0]);
     *   var plex1_pl1 = plex1_board.create('parallel', [plex1_l1, plex1_p3]);
     * </script><pre>
     */
    JXG.createParallel = function (board, parents, attributes) {
        var p, pp, pl, li, i, attr;

        for (i = 0; i < parents.length; ++i) {
            parents[i] = board.select(parents[i]);
        }
        p = null;
        if (parents.length === 3) {
            parents = Type.providePoints(board, parents, attributes, 'point');
            // line through point parents[2] which is parallel to line through parents[0] and parents[1]
            p = parents[2];
            /** @ignore */
            li = function () {
                return Mat.crossProduct(parents[0].coords.usrCoords, parents[1].coords.usrCoords);
            };
        } else if (Type.isPointType(parents[0], board)) {
            // Parallel to line parents[1] through point parents[0]
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            /** @ignore */
            li = function () {
                return parents[1].stdform;
            };
        } else if (Type.isPointType(parents[1], board)) {
            // Parallel to line parents[0] through point parents[1]
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            /** @ignore */
            li = function () {
                return parents[0].stdform;
            };
        }

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.line;
        }

        attr = Type.copyAttributes(attributes, board.options, 'parallel', 'point');
        pp = board.create('point', [
            function () {
                return Mat.crossProduct([1, 0, 0], li());
            }
        ], attr);

        pp.isDraggable = true;

        attr = Type.copyAttributes(attributes, board.options, 'parallel');
        pl = board.create('line', [p, pp], attr);

        pl.elType = 'parallel';
        pl.parents = [parents[0].id, parents[1].id];
        if (parents.length === 3) {
            pl.parents.push(parents[2].id);
        }

        /**
         * Helper point used to create the parallel line. This point lies on the line at infinity, hence it's not visible,
         * not even with visible set to <tt>true</tt>. Creating another line through this point would make that other line
         * parallel to the create parallel.
         * @memberOf Parallel.prototype
         * @name point
         * @type JXG.Point
         */
        pl.point = pp;

        return pl;
    };

    /**
     * @class An arrow parallel is a parallel segment with an arrow attached.
     * @pseudo
     * @constructor
     * @name Arrowparallel
     * @type Parallel
     * @augments Parallel
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Point} l,p The constructed arrow contains p and has the same slope as l.
     * @example
     * // Create a parallel
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     *
     * var p3 = board.create('point', [3.0, 3.0]);
     * var pl1 = board.create('arrowparallel', [l1, p3]);
     * </pre><div id="eeacdf99-036f-4e83-aeb6-f7388423e369" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var plex1_board = JXG.JSXGraph.initBoard('eeacdf99-036f-4e83-aeb6-f7388423e369', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var plex1_p1 = plex1_board.create('point', [0.0, 2.0]);
     *   var plex1_p2 = plex1_board.create('point', [2.0, 1.0]);
     *   var plex1_l1 = plex1_board.create('line', [plex1_p1, plex1_p2]);
     *   var plex1_p3 = plex1_board.create('point', [3.0, 3.0]);
     *   var plex1_pl1 = plex1_board.create('arrowparallel', [plex1_l1, plex1_p3]);
     * })();
     * </script><pre>
     */
    JXG.createArrowParallel = function (board, parents, attributes) {
        var p;

        /* parallel arrow point polynomials are done in createParallelPoint */
        try {
            attributes.firstArrow = false;
            attributes.lastArrow = true;
            p = JXG.createParallel(board, parents, attributes).setAttribute({straightFirst: false, straightLast: false});
            p.elType = 'arrowparallel';

            // parents are set in createParallel

            return p;
        } catch (e) {
            throw new Error("JSXGraph: Can't create arrowparallel with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [line,point], [point,point,point]");
        }
    };

    /**
     * @class Constructs a normal.
     * @pseudo
     * @description A normal is a line through a given point on a element of type line, circle, curve, or turtle and orthogonal to that object.
     * @constructor
     * @name Normal
     * @type JXG.Line
     * @augments JXG.Line
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line,JXG.Circle,JXG.Curve,JXG.Turtle_JXG.Point} o,p The constructed line contains p which lies on the object and is orthogonal
     * to the tangent to the object in the given point.
     * @param {Glider} p Works like above, however the object is given by {@link Glider#slideObject}.
     * @example
     * // Create a normal to a circle.
     * var p1 = board.create('point', [2.0, 2.0]);
     * var p2 = board.create('point', [3.0, 2.0]);
     * var c1 = board.create('circle', [p1, p2]);
     *
     * var norm1 = board.create('normal', [c1, p2]);
     * </pre><div id="4154753d-3d29-40fb-a860-0b08aa4f3743" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var nlex1_board = JXG.JSXGraph.initBoard('4154753d-3d29-40fb-a860-0b08aa4f3743', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var nlex1_p1 = nlex1_board.create('point', [2.0, 2.0]);
     *   var nlex1_p2 = nlex1_board.create('point', [3.0, 2.0]);
     *   var nlex1_c1 = nlex1_board.create('circle', [nlex1_p1, nlex1_p2]);
     *
     *   // var nlex1_p3 = nlex1_board.create('point', [1.0, 2.0]);
     *   var nlex1_norm1 = nlex1_board.create('normal', [nlex1_c1, nlex1_p2]);
     * </script><pre>
     */
    JXG.createNormal = function (board, parents, attributes) {
        var p, c, l, i, g, f, attr, pp, attrp;

        for (i = 0; i < parents.length; ++i) {
            parents[i] = board.select(parents[i]);
        }
        // One arguments: glider on line, circle or curve
        if (parents.length === 1) {
            p = parents[0];
            c = p.slideObject;
        // Two arguments: (point,line), (point,circle), (line,point) or (circle,point)
        } else if (parents.length === 2) {
            if (Type.isPointType(parents[0], board)) {
                p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
                c = parents[1];
            } else if (Type.isPointType(parents[1], board)) {
                c = parents[0];
                p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            } else {
                throw new Error("JSXGraph: Can't create normal with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [point,line], [point,circle], [glider]");
            }
        } else {
            throw new Error("JSXGraph: Can't create normal with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,line], [point,circle], [glider]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'normal');
        if (c.elementClass === Const.OBJECT_CLASS_LINE) {
            // Private point
            attrp = Type.copyAttributes(attributes, board.options, 'normal', 'point');
            pp = board.create('point', [
                function () {
                    var p = Mat.crossProduct([1, 0, 0], c.stdform);
                    return [p[0], -p[2], p[1]];
                }
            ], attrp);
            pp.isDraggable = true;

            l = board.create('line', [p, pp], attr);

            /**
             * A helper point used to create a normal to a {@link JXG.Line} object. For normals to circles or curves this
             * element is <tt>undefined</tt>.
             * @type JXG.Point
             * @name point
             * @memberOf Normal.prototype
             */
            l.point = pp;
        } else if (c.elementClass === Const.OBJECT_CLASS_CIRCLE) {
            l = board.create('line', [c.midpoint, p], attr);
        } else if (c.elementClass === Const.OBJECT_CLASS_CURVE) {
            if (c.visProp.curvetype !== 'plot') {
                g = c.X;
                f = c.Y;
                l = board.create('line', [
                    function () {
                        return -p.X() * Numerics.D(g)(p.position) - p.Y() * Numerics.D(f)(p.position);
                    },
                    function () {
                        return Numerics.D(g)(p.position);
                    },
                    function () {
                        return Numerics.D(f)(p.position);
                    }
                ], attr);
            } else {                         // curveType 'plot'
                l = board.create('line', [
                    function () {
                        var i = Math.floor(p.position),
                            lbda = p.position - i;

                        if (i === c.numberPoints - 1) {
                            i -= 1;
                            lbda = 1;
                        }

                        if (i < 0) {
                            return 1;
                        }

                        return (c.Y(i) + lbda * (c.Y(i + 1) - c.Y(i))) * (c.Y(i) - c.Y(i + 1)) - (c.X(i) + lbda * (c.X(i + 1) - c.X(i))) * (c.X(i + 1) - c.X(i));
                    },
                    function () {
                        var i = Math.floor(p.position);

                        if (i === c.numberPoints - 1) {
                            i -= 1;
                        }

                        if (i < 0) {
                            return 0;
                        }

                        return c.X(i + 1) - c.X(i);
                    },
                    function () {
                        var i = Math.floor(p.position);

                        if (i === c.numberPoints - 1) {
                            i -= 1;
                        }

                        if (i < 0) {
                            return 0;
                        }

                        return c.Y(i + 1) - c.Y(i);
                    }
                ], attr);
            }
        } else if (c.type === Const.OBJECT_TYPE_TURTLE) {
            l = board.create('line', [
                function () {
                    var el, j,
                        i = Math.floor(p.position),
                        lbda = p.position - i;

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];

                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -= 1;
                        lbda = 1;
                    }

                    if (i < 0) {
                        return 1;
                    }

                    return (el.Y(i) + lbda * (el.Y(i + 1) - el.Y(i))) * (el.Y(i) - el.Y(i + 1)) - (el.X(i) + lbda * (el.X(i + 1) - el.X(i))) * (el.X(i + 1) - el.X(i));
                },
                function () {
                    var el, j,
                        i = Math.floor(p.position);

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];
                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -=  1;
                    }

                    if (i < 0) {
                        return 0;
                    }

                    return el.X(i + 1) - el.X(i);
                },
                function () {
                    var el, j,
                        i = Math.floor(p.position);

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];
                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -= 1;
                    }

                    if (i < 0) {
                        return 0;
                    }

                    return el.Y(i + 1) - el.Y(i);
                }
            ], attr);
        } else {
            throw new Error("JSXGraph: Can't create normal with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,line], [point,circle], [glider]");
        }

        l.parents = [];
        for (i = 0; i < parents.length; i++) {
            l.parents.push(parents[i].id);
        }
        l.elType = 'normal';

        return l;
    };

    /**
     * @class A bisector is a line which divides an angle into two equal angles. It is given by three points A, B, and
     * C and divides the angle ABC into two equal sized parts.
     * @pseudo
     * @constructor
     * @name Bisector
     * @type JXG.Line
     * @augments JXG.Line
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The angle described by <tt>p1</tt>, <tt>p2</tt> and <tt>p3</tt> will
     * be divided into two equal angles.
     * @example
     * var p1 = board.create('point', [6.0, 4.0]);
     * var p2 = board.create('point', [3.0, 2.0]);
     * var p3 = board.create('point', [1.0, 7.0]);
     *
     * var bi1 = board.create('bisector', [p1, p2, p3]);
     * </pre><div id="0d58cea8-b06a-407c-b27c-0908f508f5a4" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('0d58cea8-b06a-407c-b27c-0908f508f5a4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [6.0, 4.0]);
     *   var p2 = board.create('point', [3.0, 2.0]);
     *   var p3 = board.create('point', [1.0, 7.0]);
     *   var bi1 = board.create('bisector', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createBisector = function (board, parents, attributes) {
        var p, l, i, attr;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (Type.isPoint(parents[0]) && Type.isPoint(parents[1]) && Type.isPoint(parents[2])) {
            // hidden and fixed helper
            attr = Type.copyAttributes(attributes, board.options, 'bisector', 'point');
            attr.snapToGrid = false;

            p = board.create('point', [
                function () {
                    return Geometry.angleBisector(parents[0], parents[1], parents[2], board);
                }
            ], attr);
            p.dump = false;

            for (i = 0; i < 3; i++) {
                // required for algorithm requiring dependencies between elements
                parents[i].addChild(p);
            }

            if (!Type.exists(attributes.layer)) {
                attributes.layer = board.options.layer.line;
            }

            attr = Type.copyAttributes(attributes, board.options, 'bisector');
            l = Line.createLine(board, [parents[1], p], attr);

            /**
             * Helper point
             * @memberOf Bisector.prototype
             * @type Point
             * @name point
             */
            l.point = p;

            l.elType = 'bisector';
            l.parents = [parents[0].id, parents[1].id, parents[2].id];
            l.subs = {
                point: p
            };

            return l;
        }

        throw new Error("JSXGraph: Can't create angle bisector with parent types '" +
            (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
            "\nPossible parent types: [point,point,point]");
    };

    /**
     * @class Bisector lines are similar to {@link Bisector} but takes two lines as parent elements. The resulting element is
     * a composition of two lines.
     * @pseudo
     * @constructor
     * @name Bisectorlines
     * @type JXG.Composition
     * @augments JXG.Composition
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Line_JXG.Line} l1,l2 The four angles described by the lines <tt>l1</tt> and <tt>l2</tt> will each
     * be divided into two equal angles.
     * @example
     * var p1 = board.create('point', [6.0, 4.0]);
     * var p2 = board.create('point', [3.0, 2.0]);
     * var p3 = board.create('point', [1.0, 7.0]);
     * var p4 = board.create('point', [3.0, 0.0]);
     * var l1 = board.create('line', [p1, p2]);
     * var l2 = board.create('line', [p3, p4]);
     *
     * var bi1 = board.create('bisectorlines', [l1, l2]);
     * </pre><div id="3121ff67-44f0-4dda-bb10-9cda0b80bf18" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('3121ff67-44f0-4dda-bb10-9cda0b80bf18', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var p1 = board.create('point', [6.0, 4.0]);
     *   var p2 = board.create('point', [3.0, 2.0]);
     *   var p3 = board.create('point', [1.0, 7.0]);
     *   var p4 = board.create('point', [3.0, 0.0]);
     *   var l1 = board.create('line', [p1, p2]);
     *   var l2 = board.create('line', [p3, p4]);
     *   var bi1 = board.create('bisectorlines', [l1, l2]);
     * })();
     * </script><pre>
     */
    JXG.createAngularBisectorsOfTwoLines = function (board, parents, attributes) {
        // The angular bisectors of two line [c1,a1,b1] and [c2,a2,b2] are determined by the equation:
        // (a1*x+b1*y+c1*z)/sqrt(a1^2+b1^2) = +/- (a2*x+b2*y+c2*z)/sqrt(a2^2+b2^2)

        var g1, g2, attr, ret,
            l1 = board.select(parents[0]),
            l2 = board.select(parents[1]);

        if (l1.elementClass !== Const.OBJECT_CLASS_LINE || l2.elementClass !== Const.OBJECT_CLASS_LINE) {
            throw new Error("JSXGraph: Can't create angle bisectors of two lines with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [line,line]");
        }

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.line;
        }

        attr = Type.copyAttributes(attributes, board.options, 'bisectorlines', 'line1');
        g1 = board.create('line', [
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[0] / d1 - l2.stdform[0] / d2;
            },
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[1] / d1 - l2.stdform[1] / d2;
            },
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[2] / d1 - l2.stdform[2] / d2;
            }
        ], attr);

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.line;
        }
        attr = Type.copyAttributes(attributes, board.options, 'bisectorlines', 'line2');
        g2 = board.create('line', [
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[0] / d1 + l2.stdform[0] / d2;
            },
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[1] / d1 + l2.stdform[1] / d2;
            },
            function () {
                var d1 = Math.sqrt(l1.stdform[1] * l1.stdform[1] + l1.stdform[2] * l1.stdform[2]),
                    d2 = Math.sqrt(l2.stdform[1] * l2.stdform[1] + l2.stdform[2] * l2.stdform[2]);

                return l1.stdform[2] / d1 + l2.stdform[2] / d2;
            }
        ], attr);

        // documentation
        /**
         * First line.
         * @memberOf Bisectorlines.prototype
         * @name line1
         * @type Line
         */

        /**
         * Second line.
         * @memberOf Bisectorlines.prototype
         * @name line2
         * @type Line
         */

        ret = new Composition({line1: g1, line2: g2});

        g1.dump = false;
        g2.dump = false;

        ret.elType = 'bisectorlines';
        ret.parents = [l1.id, l2.id];
        ret.subs = {
            line1: g1,
            line2: g2
        };

        return ret;
    };

    /**
     * @class Constructs the midpoint of a {@link Circumcircle}. Like the circumcircle the circumcenter
     * is constructed by providing three points.
     * @pseudo
     * @description A circumcenter is given by three points which are all lying on the circle with the
     * constructed circumcenter as the midpoint.
     * @constructor
     * @name Circumcenter
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed point is the midpoint of the circle determined
     * by p1, p2, and p3.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var cc1 = board.create('circumcenter', [p1, p2, p3]);
     * </pre><div id="e8a40f95-bf30-4eb4-88a8-f4d5495261fd" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var ccmex1_board = JXG.JSXGraph.initBoard('e8a40f95-bf30-4eb4-88a8-f4d5495261fd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ccmex1_p1 = ccmex1_board.create('point', [0.0, 2.0]);
     *   var ccmex1_p2 = ccmex1_board.create('point', [6.0, 1.0]);
     *   var ccmex1_p3 = ccmex1_board.create('point', [3.0, 7.0]);
     *   var ccmex1_cc1 = ccmex1_board.create('circumcenter', [ccmex1_p1, ccmex1_p2, ccmex1_p3]);
     * </script><pre>
     */
    JXG.createCircumcenter = function (board, parents, attributes) {
        var p, i, a, b, c;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (Type.isPoint(parents[0]) && Type.isPoint(parents[1]) && Type.isPoint(parents[2])) {

            a = parents[0];
            b = parents[1];
            c = parents[2];

            p = Point.createPoint(board, [
                function () {
                    return Geometry.circumcenter(a, b, c, board);
                }
            ], attributes);

            for (i = 0; i < 3; i++) {
                parents[i].addChild(p);
            }

            p.elType = 'circumcenter';
            p.parents = [a.id, b.id, c.id];

            p.generatePolynomial = function () {
                /*
                 *  CircumcircleMidpoint takes three points A, B and C  and creates point M, which is the circumcenter of A, B, and C.
                 *
                 *
                 * So we have two conditions:
                 *
                 *   (a)   CT  ==  AT           (distance condition I)
                 *   (b)   BT  ==  AT           (distance condition II)
                 *
                 */
                var a1 = a.symbolic.x,
                    a2 = a.symbolic.y,
                    b1 = b.symbolic.x,
                    b2 = b.symbolic.y,
                    c1 = c.symbolic.x,
                    c2 = c.symbolic.y,
                    t1 = p.symbolic.x,
                    t2 = p.symbolic.y,

                    poly1 = ['((', t1, ')-(', a1, '))^2+((', t2, ')-(', a2, '))^2-((', t1, ')-(', b1, '))^2-((', t2, ')-(', b2, '))^2'].join(''),
                    poly2 = ['((', t1, ')-(', a1, '))^2+((', t2, ')-(', a2, '))^2-((', t1, ')-(', c1, '))^2-((', t2, ')-(', c2, '))^2'].join('');

                return [poly1, poly2];
            };

            return p;
        }

        throw new Error("JSXGraph: Can't create circumcircle midpoint with parent types '" +
            (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
            "\nPossible parent types: [point,point,point]");
    };

    /**
     * @class Constructs the incenter of the triangle described by the three given points.{@link http://mathworld.wolfram.com/Incenter.html}
     * @pseudo
     * @constructor
     * @name Incenter
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed point is the incenter of the triangle described
     * by p1, p2, and p3.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var ic1 = board.create('incenter', [p1, p2, p3]);
     * </pre><div id="e8a40f95-bf30-4eb4-88a8-a2d5495261fd" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var icmex1_board = JXG.JSXGraph.initBoard('e8a40f95-bf30-4eb4-88a8-a2d5495261fd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var icmex1_p1 = icmex1_board.create('point', [0.0, 2.0]);
     *   var icmex1_p2 = icmex1_board.create('point', [6.0, 1.0]);
     *   var icmex1_p3 = icmex1_board.create('point', [3.0, 7.0]);
     *   var icmex1_ic1 = icmex1_board.create('incenter', [icmex1_p1, icmex1_p2, icmex1_p3]);
     * </script><pre>
     */
    JXG.createIncenter = function (board, parents, attributes) {
        var p, A, B, C;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (parents.length >= 3 && Type.isPoint(parents[0]) && Type.isPoint(parents[1]) && Type.isPoint(parents[2])) {
            A = parents[0];
            B = parents[1];
            C = parents[2];

            p = board.create('point', [function () {
                var a, b, c;

                a = Math.sqrt((B.X() - C.X()) * (B.X() - C.X()) + (B.Y() - C.Y()) * (B.Y() - C.Y()));
                b = Math.sqrt((A.X() - C.X()) * (A.X() - C.X()) + (A.Y() - C.Y()) * (A.Y() - C.Y()));
                c = Math.sqrt((B.X() - A.X()) * (B.X() - A.X()) + (B.Y() - A.Y()) * (B.Y() - A.Y()));

                return new Coords(Const.COORDS_BY_USER, [(a * A.X() + b * B.X() + c * C.X()) / (a + b + c), (a * A.Y() + b * B.Y() + c * C.Y()) / (a + b + c)], board);
            }], attributes);

            p.elType = 'incenter';
            p.parents = [parents[0].id, parents[1].id, parents[2].id];

        } else {
            throw new Error("JSXGraph: Can't create incenter with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        return p;
    };

    /**
     * @class A circumcircle is given by three points which are all lying on the circle.
     * @pseudo
     * @constructor
     * @name Circumcircle
     * @type JXG.Circle
     * @augments JXG.Circle
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed element is the circle determined by <tt>p1</tt>, <tt>p2</tt>, and <tt>p3</tt>.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var cc1 = board.create('circumcircle', [p1, p2, p3]);
     * </pre><div id="e65c9861-0bf0-402d-af57-3ab11962f5ac" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var ccex1_board = JXG.JSXGraph.initBoard('e65c9861-0bf0-402d-af57-3ab11962f5ac', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var ccex1_p1 = ccex1_board.create('point', [0.0, 2.0]);
     *   var ccex1_p2 = ccex1_board.create('point', [6.0, 1.0]);
     *   var ccex1_p3 = ccex1_board.create('point', [3.0, 7.0]);
     *   var ccex1_cc1 = ccex1_board.create('circumcircle', [ccex1_p1, ccex1_p2, ccex1_p3]);
     * </script><pre>
     */
    JXG.createCircumcircle = function (board, parents, attributes) {
        var p, c, attr;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (parents === false) {
            throw new Error("JSXGraph: Can't create circumcircle with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        try {
            attr = Type.copyAttributes(attributes, board.options, 'circumcircle', 'center');
            p = JXG.createCircumcenter(board, parents, attr);

            p.dump = false;

            if (!Type.exists(attributes.layer)) {
                attributes.layer = board.options.layer.circle;
            }
            attr = Type.copyAttributes(attributes, board.options, 'circumcircle');
            c = Circle.createCircle(board, [p, parents[0]], attr);

            c.elType = 'circumcircle';
            c.parents = [parents[0].id, parents[1].id, parents[2].id];
            c.subs = {
                center: p
            };
        } catch (e) {
            throw new Error("JSXGraph: Can't create circumcircle with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        // p is already stored as midpoint in c so there's no need to store it explicitly.

        return c;
    };

    /**
     * @class An incircle is given by three points.
     * @pseudo
     * @constructor
     * @name Incircle
     * @type JXG.Circle
     * @augments JXG.Circle
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed point is the midpoint of the incircle of
     * <tt>p1</tt>, <tt>p2</tt>, and <tt>p3</tt>.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var ic1 = board.create('incircle', [p1, p2, p3]);
     * </pre><div id="e65c9861-0bf0-402d-af57-2ab12962f8ac" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var icex1_board = JXG.JSXGraph.initBoard('e65c9861-0bf0-402d-af57-2ab12962f8ac', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var icex1_p1 = icex1_board.create('point', [0.0, 2.0]);
     *   var icex1_p2 = icex1_board.create('point', [6.0, 1.0]);
     *   var icex1_p3 = icex1_board.create('point', [3.0, 7.0]);
     *   var icex1_ic1 = icex1_board.create('incircle', [icex1_p1, icex1_p2, icex1_p3]);
     * </script><pre>
     */
    JXG.createIncircle = function (board, parents, attributes) {
        var p, c, attr;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (parents === false) {
            throw new Error("JSXGraph: Can't create circumcircle with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }
        try {
            attr = Type.copyAttributes(attributes, board.options, 'incircle', 'center');
            p = JXG.createIncenter(board, parents, attr);

            p.dump = false;

            if (!Type.exists(attributes.layer)) {
                attributes.layer = board.options.layer.circle;
            }
            attr = Type.copyAttributes(attributes, board.options, 'incircle');
            c = Circle.createCircle(board, [p, function () {
                var a = Math.sqrt((parents[1].X() - parents[2].X()) * (parents[1].X() - parents[2].X()) + (parents[1].Y() - parents[2].Y()) * (parents[1].Y() - parents[2].Y())),
                    b = Math.sqrt((parents[0].X() - parents[2].X()) * (parents[0].X() - parents[2].X()) + (parents[0].Y() - parents[2].Y()) * (parents[0].Y() - parents[2].Y())),
                    c = Math.sqrt((parents[1].X() - parents[0].X()) * (parents[1].X() - parents[0].X()) + (parents[1].Y() - parents[0].Y()) * (parents[1].Y() - parents[0].Y())),
                    s = (a + b + c) / 2;

                return Math.sqrt(((s - a) * (s - b) * (s - c)) / s);
            }], attr);

            c.elType = 'incircle';
            c.parents = [parents[0].id, parents[1].id, parents[2].id];

            /**
             * The center of the incircle
             * @memberOf Incircle.prototype
             * @type Incenter
             * @name center
             */
            c.center = p;

            c.subs = {
                center: p
            };
        } catch (e) {
            throw new Error("JSXGraph: Can't create circumcircle with parent types '" +
                (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                "\nPossible parent types: [point,point,point]");
        }

        // p is already stored as midpoint in c so there's no need to store it explicitly.

        return c;
    };

    /**
     * @class This element is used to construct a reflected point.
     * @pseudo
     * @description A reflected point is given by a point and a line. It is determined by the reflection of the given point
     * against the given line.
     * @constructor
     * @name Reflection
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Line} p,l The reflection point is the reflection of p against l.
     * @example
     * var p1 = board.create('point', [0.0, 4.0]);
     * var p2 = board.create('point', [6.0, 1.0]);
     * var l1 = board.create('line', [p1, p2]);
     * var p3 = board.create('point', [3.0, 3.0]);
     *
     * var rp1 = board.create('reflection', [p3, l1]);
     * </pre><div id="087a798e-a36a-4f52-a2b4-29a23a69393b" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var rpex1_board = JXG.JSXGraph.initBoard('087a798e-a36a-4f52-a2b4-29a23a69393b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var rpex1_p1 = rpex1_board.create('point', [0.0, 4.0]);
     *   var rpex1_p2 = rpex1_board.create('point', [6.0, 1.0]);
     *   var rpex1_l1 = rpex1_board.create('line', [rpex1_p1, rpex1_p2]);
     *   var rpex1_p3 = rpex1_board.create('point', [3.0, 3.0]);
     *   var rpex1_rp1 = rpex1_board.create('reflection', [rpex1_p3, rpex1_l1]);
     * </script><pre>
     */
    JXG.createReflection = function (board, parents, attributes) {
        var l, p, r, t, i;

        for (i = 0; i < parents.length; ++i) {
            parents[i] = board.select(parents[i]);
        }
        if (Type.isPoint(parents[0]) && parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            l = parents[1];
        } else if (Type.isPoint(parents[1]) && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
            l = parents[0];
        } else {
            throw new Error("JSXGraph: Can't create reflection point with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [line,point]");
        }

        t = Transform.createTransform(board, [l], {type: 'reflect'});
        r = Point.createPoint(board, [p, t], attributes);
        p.addChild(r);
        l.addChild(r);

        r.elType = 'reflection';
        r.parents = [parents[0].id, parents[1].id];

        r.prepareUpdate().update();

        r.generatePolynomial = function () {
            /*
             *  Reflection takes a point R and a line L and creates point P, which is the reflection of R on L.
             *  L is defined by two points A and B.
             *
             * So we have two conditions:
             *
             *   (a)   RP  _|_  AB            (orthogonality condition)
             *   (b)   AR  ==   AP            (distance condition)
             *
             */
            var a1 = l.point1.symbolic.x,
                a2 = l.point1.symbolic.y,
                b1 = l.point2.symbolic.x,
                b2 = l.point2.symbolic.y,
                p1 = p.symbolic.x,
                p2 = p.symbolic.y,
                r1 = r.symbolic.x,
                r2 = r.symbolic.y,

                poly1 = ['((', r2, ')-(', p2, '))*((', a2, ')-(', b2, '))+((', a1, ')-(', b1, '))*((', r1, ')-(', p1, '))'].join(''),
                poly2 = ['((', r1, ')-(', a1, '))^2+((', r2, ')-(', a2, '))^2-((', p1, ')-(', a1, '))^2-((', p2, ')-(', a2, '))^2'].join('');

            return [poly1, poly2];
        };

        return r;
    };

    /**
     * @class A mirror point will be constructed.
     * @pseudo
     * @description A mirror point is determined by the reflection of a given point against another given point.
     * @constructor
     * @name Mirrorpoint
     * @type JXG.Point
     * @augments JXG.Point
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point_JXG.Point} p1,p2 The constructed point is the reflection of p2 against p1.
     * @example
     * var p1 = board.create('point', [3.0, 3.0]);
     * var p2 = board.create('point', [6.0, 1.0]);
     *
     * var mp1 = board.create('mirrorpoint', [p1, p2]);
     * </pre><div id="7eb2a814-6c4b-4caa-8cfa-4183a948d25b" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var mpex1_board = JXG.JSXGraph.initBoard('7eb2a814-6c4b-4caa-8cfa-4183a948d25b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var mpex1_p1 = mpex1_board.create('point', [3.0, 3.0]);
     *   var mpex1_p2 = mpex1_board.create('point', [6.0, 1.0]);
     *   var mpex1_mp1 = mpex1_board.create('mirrorpoint', [mpex1_p1, mpex1_p2]);
     * </script><pre>
     */
    JXG.createMirrorPoint = function (board, parents, attributes) {
        var p, i;

        parents = Type.providePoints(board, parents, attributes, 'point');
        if (Type.isPoint(parents[0]) && Type.isPoint(parents[1])) {
            p = Point.createPoint(board, [
                function () {
                    return Geometry.rotation(parents[0], parents[1], Math.PI, board);
                }
            ], attributes);

            for (i = 0; i < 2; i++) {
                parents[i].addChild(p);
            }

            p.elType = 'mirrorpoint';
            p.parents = [parents[0].id, parents[1].id];
        } else {
            throw new Error("JSXGraph: Can't create mirror point with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,point]");
        }

        p.prepareUpdate().update();

        return p;
    };

    /**
     * @class This element is used to visualize the integral of a given curve over a given interval.
     * @pseudo
     * @description The Integral element is used to visualize the area under a given curve over a given interval
     * and to calculate the area's value. For that a polygon and gliders are used. The polygon displays the area,
     * the gliders are used to change the interval dynamically.
     * @constructor
     * @name Integral
     * @type JXG.Curve
     * @augments JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Array_JXG.Curve} i,c The constructed element covers the area between the curve <tt>c</tt> and the x-axis
     * within the interval <tt>i</tt>.
     * @example
     * var c1 = board.create('functiongraph', [function (t) { return t*t*t; }]);
     * var i1 = board.create('integral', [[-1.0, 4.0], c1]);
     * </pre><div id="d45d7188-6624-4d6e-bebb-1efa2a305c8a" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var intex1_board = JXG.JSXGraph.initBoard('d45d7188-6624-4d6e-bebb-1efa2a305c8a', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
     *   var intex1_c1 = intex1_board.create('functiongraph', [function (t) { return Math.cos(t)*t; }]);
     *   var intex1_i1 = intex1_board.create('integral', [[-2.0, 2.0], intex1_c1]);
     * </script><pre>
     */
    JXG.createIntegral = function (board, parents, attributes) {
        var interval, curve, attr,
            start, end, startx, starty, endx, endy,
            pa_on_curve, pa_on_axis, pb_on_curve, pb_on_axis,
            t = null, p;

        if (Type.isArray(parents[0]) && parents[1].elementClass === Const.OBJECT_CLASS_CURVE) {
            interval = parents[0];
            curve = parents[1];
        } else if (Type.isArray(parents[1]) && parents[0].elementClass === Const.OBJECT_CLASS_CURVE) {
            interval = parents[1];
            curve = parents[0];
        } else {
            throw new Error("JSXGraph: Can't create integral with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [[number|function,number|function],curve]");
        }

        attr = Type.copyAttributes(attributes, board.options, 'integral');
        attr.withLabel = false;  // There is a custom 'label' below.
        p = board.create('curve', [[0], [0]], attr);

        // Correct the interval if necessary - NOT ANYMORE, GGB's fault
        start = interval[0];
        end = interval[1];

        if (Type.isFunction(start)) {
            startx = start;
            starty = function () { return curve.Y(startx()); };
            start = startx();
        } else {
            startx = start;
            starty = curve.Y(start);
        }

        if (Type.isFunction(end)) {
            endx = end;
            endy = function () { return curve.Y(endx()); };
            end = endx();
        } else {
            endx = end;
            endy = curve.Y(end);
        }

        attr = Type.copyAttributes(attributes, board.options, 'integral', 'curveLeft');
        pa_on_curve = board.create('glider', [startx, starty, curve], attr);
        if (Type.isFunction(startx)) {
            pa_on_curve.hideElement();
        }

        attr = Type.copyAttributes(attributes, board.options, 'integral', 'baseLeft');
        pa_on_axis = board.create('point', [
            function () {
                if (p.visProp.axis === 'y') {
                    return 0;
                }

                return pa_on_curve.X();
            },
            function () {
                if (p.visProp.axis === 'y') {
                    return pa_on_curve.Y();
                }

                return 0;
            }
        ], attr);

        attr = Type.copyAttributes(attributes, board.options, 'integral', 'curveRight');
        pb_on_curve = board.create('glider', [endx, endy, curve], attr);
        if (Type.isFunction(endx)) {
            pb_on_curve.hideElement();
        }

        attr = Type.copyAttributes(attributes, board.options, 'integral', 'baseRight');
        pb_on_axis = board.create('point', [
            function () {
                if (p.visProp.axis === 'y') {
                    return 0;
                }
                return pb_on_curve.X();
            },
            function () {
                if (p.visProp.axis === 'y') {
                    return pb_on_curve.Y();
                }

                return 0;
            }
        ], attr);

        attr = Type.copyAttributes(attributes, board.options, 'integral');
        if (attr.withlabel !== false && attr.axis !== 'y') {
            attr = Type.copyAttributes(attributes, board.options, 'integral', 'label');
            attr = Type.copyAttributes(attr, board.options, 'label');

            t = board.create('text', [
                function () {
                    var off = new Coords(Const.COORDS_BY_SCREEN, [
                            this.visProp.offset[0] + this.board.origin.scrCoords[1],
                            0
                        ], this.board, false),
                        bb = this.board.getBoundingBox(),
                        dx = (bb[2] - bb[0]) * 0.1,
                        x = pb_on_curve.X();
                        
                    if (x < bb[0]) {
                        x = bb[0] + dx;
                    } else if (x > bb[2]) {
                        x = bb[2] - dx;
                    }

                    return x + off.usrCoords[1];
                },
                function () {
                    var off = new Coords(Const.COORDS_BY_SCREEN, [
                            0,
                            this.visProp.offset[1] + this.board.origin.scrCoords[2]
                        ], this.board, false),
                        bb = this.board.getBoundingBox(),
                        dy = (bb[1] - bb[3]) * 0.1,
                        y = pb_on_curve.Y();
                        
                    if (y > bb[1]) {
                        y = bb[1] - dy;
                    } else if (y < bb[3]) {
                        y = bb[3] + dy;
                    }

                    return y + off.usrCoords[2];
                },
                function () {
                    var Int = Numerics.NewtonCotes([pa_on_axis.X(), pb_on_axis.X()], curve.Y);
                    return '&int; = ' + Int.toFixed(4);
                }
            ], attr);

            t.dump = false;

            pa_on_curve.addChild(t);
            pb_on_curve.addChild(t);
        }

        // dump stuff
        pa_on_curve.dump = false;
        pa_on_axis.dump = false;

        pb_on_curve.dump = false;
        pb_on_axis.dump = false;

        p.elType = 'integral';
        p.parents = [curve.id, interval];
        p.subs = {
            curveLeft: pa_on_curve,
            baseLeft: pa_on_axis,
            curveRight: pb_on_curve,
            baseRight: pb_on_axis
        };

        if (attr.withLabel) {
            p.subs.label = t;
        }

        /** @ignore */
        p.Value = function () {
            return Numerics.I([pa_on_axis.X(), pb_on_axis.X()], curve.Y);
        };

        /**
         * documented in JXG.Curve
         * @ignore
         */
        p.updateDataArray = function () {
            var x, y,
                i, left, right,
                lowx, upx,
                lowy, upy;

            if (this.visProp.axis === 'y') {
                if (pa_on_curve.Y() < pb_on_curve.Y()) {
                    lowx = pa_on_curve.X();
                    lowy = pa_on_curve.Y();
                    upx = pb_on_curve.X();
                    upy = pb_on_curve.Y();
                } else {
                    lowx = pb_on_curve.X();
                    lowy = pb_on_curve.Y();
                    upx = pa_on_curve.X();
                    upy = pa_on_curve.Y();
                }
                left = Math.min(lowx, upx);
                right = Math.max(lowx, upx);

                x = [0, lowx];
                y = [lowy, lowy];

                for (i = 0; i < curve.numberPoints; i++) {
                    if (lowy <= curve.points[i].usrCoords[2] &&
                            left <= curve.points[i].usrCoords[1] &&
                            curve.points[i].usrCoords[2] <= upy  &&
                            curve.points[i].usrCoords[1] <= right) {
                        x.push(curve.points[i].usrCoords[1]);
                        y.push(curve.points[i].usrCoords[2]);
                    }
                }
                x.push(upx);
                y.push(upy);
                x.push(0);
                y.push(upy);

                // close the curve
                x.push(0);
                y.push(lowy);
            } else {
                if (pa_on_axis.X() < pb_on_axis.X()) {
                    left = pa_on_axis.X();
                    right = pb_on_axis.X();
                } else {
                    left = pb_on_axis.X();
                    right = pa_on_axis.X();
                }

                x = [left, left];
                y = [0, curve.Y(left)];

                for (i = 0; i < curve.numberPoints; i++) {
                    if ((left <= curve.points[i].usrCoords[1]) && (curve.points[i].usrCoords[1] <= right)) {
                        x.push(curve.points[i].usrCoords[1]);
                        y.push(curve.points[i].usrCoords[2]);
                    }
                }
                x.push(right);
                y.push(curve.Y(right));
                x.push(right);
                y.push(0);

                // close the curve
                x.push(left);
                y.push(0);
            }

            this.dataX = x;
            this.dataY = y;
        };

        pa_on_curve.addChild(p);
        pb_on_curve.addChild(p);
        pa_on_axis.addChild(p);
        pb_on_axis.addChild(p);

        /**
         * The point on the axis initially corresponding to the lower value of the interval.
         * @memberOf Integral.prototype
         * @name baseLeft
         * @type JXG.Point
         */
        p.baseLeft = pa_on_axis;

        /**
         * The point on the axis initially corresponding to the higher value of the interval.
         * @memberOf Integral.prototype
         * @name baseRight
         * @type JXG.Point
         */
        p.baseRight = pb_on_axis;

        /**
         * The glider on the curve corresponding to the lower value of the interval.
         * @memberOf Integral.prototype
         * @name curveLeft
         * @type Glider
         */
        p.curveLeft = pa_on_curve;

        /**
         * The glider on the axis corresponding to the higher value of the interval.
         * @memberOf Integral.prototype
         * @name curveRight
         * @type Glider
         */
        p.curveRight = pb_on_curve;

        p.methodMap = JXG.deepCopy(p.methodMap, {
            curveLeft: 'curveLeft',
            baseLeft: 'baseLeft',
            curveRight: 'curveRight',
            baseRight: 'baseRight',
            Value: 'Value'
        });

        /**
         * documented in GeometryElement
         * @ignore
         */
        p.label = t;

        return p;
    };

    /**
     * @class Creates a grid to support the user with element placement.
     * @pseudo
     * @description A grid is a set of vertical and horizontal lines to support the user with element placement. This method
     * draws such a grid on the given board. It uses options given in {@link JXG.Options#grid}. This method does not
     * take any parent elements. It is usually instantiated on the board's creation via the attribute <tt>grid</tt> set
     * to true.
     * @parameter None.
     * @constructor
     * @name Grid
     * @type JXG.Curve
     * @augments JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @example
     * grid = board.create('grid', []);
     * </pre><div id="a9a0671f-7a51-4fa2-8697-241142c00940" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *  board = JXG.JSXGraph.initBoard('a9a0671f-7a51-4fa2-8697-241142c00940', {boundingbox:[-4, 6, 10, -6], axis: false, grid: false, keepaspectratio: true});
     *  grid = board.create('grid', []);
     * })();
     * </script><pre>
     */
    JXG.createGrid = function (board, parents, attributes) {
        var c, attr;

        attr = Type.copyAttributes(attributes, board.options, 'grid');
        c = board.create('curve', [[null], [null]], attr);

        c.elType = 'grid';
        c.parents = [];
        c.type = Const.OBJECT_TYPE_GRID;

        c.updateDataArray = function () {
            var start, end, i, topLeft, bottomRight,
                gridX = this.visProp.gridx,
                gridY = this.visProp.gridy;

            if (Type.isArray(this.visProp.topleft)) {
                topLeft = new Coords(this.visProp.tltype || Const.COORDS_BY_USER, this.visProp.topleft, board);
            } else {
                topLeft = new Coords(Const.COORDS_BY_SCREEN, [0, 0], board);
            }

            if (Type.isArray(this.visProp.bottomright)) {
                bottomRight = new Coords(this.visProp.brtype || Const.COORDS_BY_USER, this.visProp.bottomright, board);
            } else {
                bottomRight = new Coords(Const.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);
            }


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

            topLeft.setCoordinates(Const.COORDS_BY_USER, [Math.floor(topLeft.usrCoords[1] / gridX) * gridX, Math.ceil(topLeft.usrCoords[2] / gridY) * gridY]);
            bottomRight.setCoordinates(Const.COORDS_BY_USER, [Math.ceil(bottomRight.usrCoords[1] / gridX) * gridX, Math.floor(bottomRight.usrCoords[2] / gridY) * gridY]);

            c.dataX = [];
            c.dataY = [];

            // Sometimes the bounding box is used to invert the axis. We have to take this into account here.
            start = topLeft.usrCoords[2];
            end = bottomRight.usrCoords[2];

            if (topLeft.usrCoords[2] < bottomRight.usrCoords[2]) {
                start = bottomRight.usrCoords[2];
                end = topLeft.usrCoords[2];
            }

            // start with the horizontal grid:
            for (i = start; i > end - gridY; i -= gridY) {
                c.dataX.push(topLeft.usrCoords[1], bottomRight.usrCoords[1], NaN);
                c.dataY.push(i, i, NaN);
            }

            start = topLeft.usrCoords[1];
            end = bottomRight.usrCoords[1];

            if (topLeft.usrCoords[1] > bottomRight.usrCoords[1]) {
                start = bottomRight.usrCoords[1];
                end = topLeft.usrCoords[1];
            }

            // build vertical grid
            for (i = start; i < end + gridX; i += gridX) {
                c.dataX.push(i, i, NaN);
                c.dataY.push(topLeft.usrCoords[2], bottomRight.usrCoords[2], NaN);
            }

        };

        // we don't care about highlighting so we turn it off completely to save a lot of
        // time on every mouse move
        c.hasPoint = function () {
            return false;
        };

        board.grids.push(c);

        return c;
    };

    /**
     * @class Creates an area indicating the solution of a linear inequality.
     * @pseudo
     * @description Display the solution set of a linear inequality (less than or equal to).
     * @param {JXG.Line} l The area drawn will be the area below this line. With the attribute
     * inverse:true, the inequlity 'greater than or equal to' is shown.
     * @constructor
     * @name Inequality
     * @type JXG.Curve
     * @augments JXG.Curve
     * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @example
     * var p = board.create('point', [1, 3]),
     *     q = board.create('point', [-2, -4]),
     *     l = board.create('line', [p, q]),
     *     ineq = board.create('inequality', [l]);
     * ineq = board.create('inequality', [l]);
     * </pre><div id="2b703006-fd98-11e1-b79e-ef9e591c002e" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *  var board = JXG.JSXGraph.initBoard('2b703006-fd98-11e1-b79e-ef9e591c002e', {boundingbox:[-4, 6, 10, -6], axis: false, grid: false, keepaspectratio: true}),
     *      p = board.create('point', [1, 3]),
     *      q = board.create('point', [-2, -4]),
     *      l = board.create('line', [p, q]),
     *      ineq = board.create('inequality', [l]);
     * })();
     * </script><pre>
     *
     * @example
     * // Plot the inequality 
     * //     y >= 2/3 x + 1 
     * // or 
     * //     0 >= -3y + 2x +1
     * var l = board.create('line', [1, 2, -3]),
     *     ineq = board.create('inequality', [l], {inverse:true});
     * </pre><div id="1ded3812-2da4-4323-abaf-1db4bad1bfbd" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *  var board = JXG.JSXGraph.initBoard('1ded3812-2da4-4323-abaf-1db4bad1bfbd', {boundingbox:[-4, 6, 10, -6], axis: false, grid: false, keepaspectratio: true}),
     *      l = board.create('line', [1, 2, -3]),
     *      ineq = board.create('inequality', [l], {inverse:true});
     * })();
     * </script><pre>
     */
    JXG.createInequality = function (board, parents, attributes) {
        var f, a, attr;

        attr = Type.copyAttributes(attributes, board.options, 'inequality');
        if (parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
            a = board.create('curve', [[], []], attr);
            a.hasPoint = function () {
                return false;
            };
            a.updateDataArray = function () {
                var i1, i2,
                    // this will be the height of the area. We mustn't rely upon the board height because if we pan the view
                    // such that the line is not visible anymore, the borders of the area will get visible in some cases.
                    h,
                    bb = board.getBoundingBox(),
                    factor = attr.inverse ? -1 : 1,
                    expansion = 1.5,
                    w = expansion * Math.max(bb[2] - bb[0], bb[1] - bb[3]),
                    // fake a point (for Math.Geometry.perpendicular)
                    dp = {
                        coords: {
                            usrCoords: [1, (bb[0] + bb[2]) / 2, attr.inverse ? bb[1] : bb[3]]
                        }
                    },

                    slope1 = parents[0].stdform.slice(1),
                    slope2 = slope1;

                if (slope1[1] > 0) {
                    slope1 = Statistics.multiply(slope1, -1);
                    slope2 = slope1;
                }

                // calculate the area height = 2* the distance of the line to the point in the middle of the top/bottom border.
                h = expansion * Math.max(Geometry.perpendicular(parents[0], dp, board)[0].distance(Const.COORDS_BY_USER, dp.coords), w);
                h *= factor;

                // reuse dp
                dp = {
                    coords: {
                        usrCoords: [1, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2]
                    }
                };

                // If dp is on the line, Geometry.perpendicular will return a point not on the line.
                // Since this somewhat odd behavior of Geometry.perpendicular is needed in GEONExT,
                // it is circumvented here.
                if (Math.abs(Mat.innerProduct(dp.coords.usrCoords, parents[0].stdform, 3)) >= Mat.eps) {
                    dp = Geometry.perpendicular(parents[0], dp, board)[0].usrCoords;
                } else {
                    dp = dp.coords.usrCoords;
                }
                i1 = [1, dp[1] + slope1[1] * w, dp[2] - slope1[0] * w];
                i2 = [1, dp[1] - slope2[1] * w, dp[2] + slope2[0] * w];

                // One of the vectors based in i1 and orthogonal to the parent line has the direction d1 = (slope1, -1)
                // We will go from i1 to to i1 + h*d1, from there to i2 + h*d2 (with d2 calculated equivalent to d1) and
                // end up in i2.
                this.dataX = [i1[1], i1[1] + slope1[0] * h, i2[1] + slope2[0] * h, i2[1], i1[1]];
                this.dataY = [i1[2], i1[2] + slope1[1] * h, i2[2] + slope2[1] * h, i2[2], i1[2]];
            };
        } else {
            f = Type.createFunction(parents[0]);
            if (!Type.exists(f)) {
                throw new Error("JSXGraph: Can't create area with the given parents." +
                    "\nPossible parent types: [line], [function]");
            }
        }

        return a;
    };


    JXG.registerElement('arrowparallel', JXG.createArrowParallel);
    JXG.registerElement('bisector', JXG.createBisector);
    JXG.registerElement('bisectorlines', JXG.createAngularBisectorsOfTwoLines);
    JXG.registerElement('circumcircle', JXG.createCircumcircle);
    JXG.registerElement('circumcirclemidpoint', JXG.createCircumcenter);
    JXG.registerElement('circumcenter', JXG.createCircumcenter);
    JXG.registerElement('incenter', JXG.createIncenter);
    JXG.registerElement('incircle', JXG.createIncircle);
    JXG.registerElement('integral', JXG.createIntegral);
    JXG.registerElement('midpoint', JXG.createMidpoint);
    JXG.registerElement('mirrorpoint', JXG.createMirrorPoint);
    JXG.registerElement('normal', JXG.createNormal);
    JXG.registerElement('orthogonalprojection', JXG.createOrthogonalProjection);
    JXG.registerElement('parallel', JXG.createParallel);
    JXG.registerElement('parallelpoint', JXG.createParallelPoint);
    JXG.registerElement('perpendicular', JXG.createPerpendicular);
    JXG.registerElement('perpendicularpoint', JXG.createPerpendicularPoint);
    JXG.registerElement('perpendicularsegment', JXG.createPerpendicularSegment);
    JXG.registerElement('reflection', JXG.createReflection);
    JXG.registerElement('grid', JXG.createGrid);
    JXG.registerElement('inequality', JXG.createInequality);

    return {
        createArrowParallel: JXG.createArrowParallel,
        createBisector: JXG.createBisector,
        createAngularBisectorOfTwoLines: JXG.createAngularBisectorsOfTwoLines,
        createCircumcircle: JXG.createCircumcircle,
        createCircumcenter: JXG.createCircumcenter,
        createIncenter: JXG.createIncenter,
        createIncircle: JXG.createIncircle,
        createIntegral: JXG.createIntegral,
        createMidpoint: JXG.createMidpoint,
        createMirrorPoint: JXG.createMirrorPoint,
        createNormal: JXG.createNormal,
        createOrthogonalProjection: JXG.createOrthogonalProjection,
        createParallel: JXG.createParallel,
        createParallelPoint: JXG.createParallelPoint,
        createPerpendicular: JXG.createPerpendicular,
        createPerpendicularPoint: JXG.createPerpendicularPoint,
        createPerpendicularSegmen: JXG.createPerpendicularSegment,
        createReflection: JXG.createReflection,
        createGrid: JXG.createGrid,
        createInequality: JXG.createInequality
    };
});
