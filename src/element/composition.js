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
 * @fileoverview This file contains our composition elements, i.e. these elements are mostly put together
 * from one or more {@link JXG.GeometryElement} but with a special meaning. E.g. the midpoint element is contained here
 * and this is just a {@link JXG.Point} with coordinates dependent from two other points. Currently in this file the
 * following compositions can be found: <ul>
 *   <li>{@link Arrowparallel} (currently private)</li>
 *   <li>{@link Bisector}</li>
 *   <li>{@link Msector}</li>
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

import JXG from "../jxg.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Numerics from "../math/numerics.js";
import Coords from "../base/coords.js";
import Type from "../utils/type.js";
import Const from "../base/constants.js";
// import Point from "../base/point.js";
// import Line from "../base/line.js";
// import Circle from "../base/circle.js";
// import Transform from "../base/transformation.js";
import Composition from "../base/composition.js";
// import Curve from "../base/curve.js";
// import Polygon from "../base/polygon.js";

/**
 * @class A point that is the orthogonal projection of a point onto a line.
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
 * </pre><div class="jxgbox" id="JXG7708b215-39fa-41b6-b972-19d73d77d791" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ppex1_board = JXG.JSXGraph.initBoard('JXG7708b215-39fa-41b6-b972-19d73d77d791', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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

    if (
        Type.isPointType(board, parents[0]) &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        l = parents[1];
    } else if (
        Type.isPointType(board, parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        l = parents[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create perpendicular point with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [point,line]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'orthogonalprojection');

    /**
     * @type JXG.Element
     * @ignore
     */
    t = board.create(
        "point",
        [
            function () {
                return Geometry.projectPointToLine(p, l, board);
            }
        ],
        attr
    );

    if (Type.exists(p._is_new)) {
        t.addChild(p);
        delete p._is_new;
    } else {
        p.addChild(t);
    }
    l.addChild(t);

    t.elType = 'orthogonalprojection';
    t.setParents([p.id, t.id]);

    t.update();

    /**
     * Used to generate a polynomial for the orthogonal projection
     * @name Orthogonalprojection#generatePolynomial
     * @returns {Array} An array containing the generated polynomial.
     * @private
     * @function
     * @ignore
     */
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
            poly1 = "(" + a2 + ")*(" + t1 + ")-(" + a2 + ")*(" + b1 + ")+(" + t2 + ")*(" + b1 + ")-(" + a1 + ")*(" + t2 + ")+(" + a1 + ")*(" +
                b2 + ")-(" + t1 + ")*(" + b2 + ")",
            poly2 = "(" + p2 + ")*(" + a2 + ")-(" + p2 + ")*(" + b2 + ")-(" + t2 + ")*(" + a2 + ")+(" + t2 + ")*(" + b2 + ")+(" + p1 + ")*(" +
                a1 + ")-(" + p1 + ")*(" + b1 + ")-(" + t1 + ")*(" + a1 + ")+(" + t1 + ")*(" + b1 + ")";

        return [poly1, poly2];
    };

    return t;
};

/**

     * @class A perpendicular is a line orthogonal to a given line, through a given point not on the line,
     * @pseudo
     * @description  A perpendicular is a composition of two elements: a line and a point. The line is orthogonal
     * to a given line and contains a given point.
     * @name Perpendicular
     * @constructor
     * @type JXG.Line
     * @augments Segment
     * @returns A {@link JXG.Line} object through the given point that is orthogonal to the given line.
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
     * </pre><div class="jxgbox" id="JXGd5b78842-7b27-4d37-b608-d02519e6cd03" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var pex1_board = JXG.JSXGraph.initBoard('JXGd5b78842-7b27-4d37-b608-d02519e6cd03', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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

    if (
        Type.isPointType(board, parents[0]) &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        l = parents[1];
        p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
    } else if (
        Type.isPointType(board, parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        l = parents[0];
        p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create perpendicular with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [line,point]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'perpendicular');
    pd = JXG.createLine(
        board,
        [
            function () {
                return l.stdform[2] * p.X() - l.stdform[1] * p.Y();
            },
            function () {
                return -l.stdform[2] * p.Z();
            },
            function () {
                return l.stdform[1] * p.Z();
            }
        ],
        attr
    );

    pd.elType = 'perpendicular';
    pd.setParents([l.id, p.id]);

    if (Type.exists(p._is_new)) {
        pd.addChild(p);
        delete p._is_new;
    } else {
        p.addChild(pd);
    }
    l.addChild(pd);

    return pd;
};

/**
 * @class Orthogonal projection of a point onto a line.
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
 * </pre><div class="jxgbox" id="JXGded148c9-3536-44c0-ab81-1bb8fa48f3f4" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ppex1_board = JXG.JSXGraph.initBoard('JXGded148c9-3536-44c0-ab81-1bb8fa48f3f4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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
    if (
        Type.isPointType(board, parents[0]) &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        l = parents[1];
    } else if (
        Type.isPointType(board, parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        l = parents[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create perpendicular point with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [point,line]"
        );
    }

    /**
     * @class
     * @ignore
     */
    t = board.create(
        "point",
        [
            function () {
                return Geometry.perpendicular(l, p, board)[0];
            }
        ],
        attributes
    );

    if (Type.exists(p._is_new)) {
        t.addChild(p);
        delete p._is_new;
    } else {
        p.addChild(t);
    }
    l.addChild(t);

    t.elType = 'perpendicularpoint';
    t.setParents([p.id, l.id]);

    t.update();

    /**
     * Used to generate a polynomial for the perpendicular point
     * @name PerpendicularPoint#generatePolynomial
     * @returns {Array} An array containing the generated polynomial.
     * @private
     * @function
     * @ignore
     */
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
            poly1 = "(" + a2 + ")*(" + t1 + ")-(" + a2 + ")*(" + b1 + ")+(" + t2 + ")*(" + b1 + ")-(" + a1 + ")*(" + t2 + ")+(" + a1 + ")*(" + b2 + ")-(" + t1 +
                ")*(" + b2 + ")",
            poly2 = "(" + p2 + ")*(" + a2 + ")-(" + p2 + ")*(" + b2 + ")-(" + t2 + ")*(" + a2 + ")+(" + t2 + ")*(" + b2 + ")+(" + p1 + ")*(" + a1 + ")-(" + p1 +
                ")*(" + b1 + ")-(" + t1 + ")*(" + a1 + ")+(" + t1 + ")*(" + b1 + ")";

        return [poly1, poly2];
    };

    return t;
};

/**
 * @class A line segment orthogonal to a given line, through a given point not on the line,
 * @pseudo
 * @description  A perpendicular is a composition of two elements: a line segment and a point. The line segment is orthogonal
 * to a given line and contains a given point and meets the given line in the perpendicular point.
 * @name PerpendicularSegment
 * @constructor
 * @type JXG.Line
 * @augments Segment
 * @returns An array containing two elements: A {@link JXG.Line} object in the first component and a
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
 * </pre><div class="jxgbox" id="JXG037a6eb2-781d-4b71-b286-763619a63f22" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var pex1_board = JXG.JSXGraph.initBoard('JXG037a6eb2-781d-4b71-b286-763619a63f22', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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
    if (
        Type.isPointType(board, parents[0]) &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        l = parents[1];
        p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
    } else if (
        Type.isPointType(board, parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        l = parents[0];
        p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create perpendicular with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [line,point]"
        );
    }
    attr = Type.copyAttributes(attributes, board.options, "perpendicularsegment", 'point');
    t = JXG.createPerpendicularPoint(board, [l, p], attr);
    t.dump = false;

    if (!Type.exists(attributes.layer)) {
        attributes.layer = board.options.layer.line;
    }

    attr = Type.copyAttributes(attributes, board.options, 'perpendicularsegment');
    pd = JXG.createLine(
        board,
        [
            function () {
                return Geometry.perpendicular(l, p, board)[1] ? [t, p] : [p, t];
            }
        ],
        attr
    );

    /**
     * Helper point
     * @memberOf PerpendicularSegment.prototype
     * @type PerpendicularPoint
     * @name point
     */
    pd.point = t;

    if (Type.exists(p._is_new)) {
        pd.addChild(p);
        delete p._is_new;
    } else {
        p.addChild(pd);
    }
    l.addChild(pd);

    pd.elType = 'perpendicularsegment';
    pd.setParents([p.id, l.id]);
    pd.subs = {
        point: t
    };
    pd.inherits.push(t);

    return pd;
};

/**
 * @class Midpoint of two points.
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
 * </pre><div class="jxgbox" id="JXG7927ef86-24ae-40cc-afb0-91ff61dd0de7" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var mpex1_board = JXG.JSXGraph.initBoard('JXG7927ef86-24ae-40cc-afb0-91ff61dd0de7', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var mpex1_p1 = mpex1_board.create('point', [0.0, 2.0]);
 *   var mpex1_p2 = mpex1_board.create('point', [2.0, 1.0]);
 *   var mpex1_l1 = mpex1_board.create('segment', [[0.0, 3.0], [3.0, 3.0]]);
 *   var mpex1_mp1 = mpex1_board.create('midpoint', [mpex1_p1, mpex1_p2]);
 *   var mpex1_mp2 = mpex1_board.create('midpoint', [mpex1_l1]);
 * </script><pre>
 */
JXG.createMidpoint = function (board, parents, attributes) {
    var a, b, el, i, attr;

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }
    if (
        parents.length === 2 &&
        Type.isPointType(board, parents[0]) &&
        Type.isPointType(board, parents[1])
    ) {
        parents = Type.providePoints(board, parents, attributes, 'point');
        a = parents[0];
        b = parents[1];
    } else if (parents.length === 1 && parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
        a = parents[0].point1;
        b = parents[0].point2;
    } else {
        throw new Error(
            "JSXGraph: Can't create midpoint." +
                "\nPossible parent types: [point,point], [line]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'midpoint');
    /**
     * @type JXG.Element
     * @ignore
     */
    el = board.create(
        "point",
        [
            function () {
                var x = a.coords.usrCoords[1] + b.coords.usrCoords[1];
                if (
                    isNaN(x) ||
                    Math.abs(a.coords.usrCoords[0]) < Mat.eps ||
                    Math.abs(b.coords.usrCoords[0]) < Mat.eps
                ) {
                    return NaN;
                }

                return x * 0.5;
            },
            function () {
                var y = a.coords.usrCoords[2] + b.coords.usrCoords[2];
                if (
                    isNaN(y) ||
                    Math.abs(a.coords.usrCoords[0]) < Mat.eps ||
                    Math.abs(b.coords.usrCoords[0]) < Mat.eps
                ) {
                    return NaN;
                }

                return y * 0.5;
            }
        ],
        attr
    );
    if (Type.exists(a._is_new)) {
        el.addChild(a);
        delete a._is_new;
    } else {
        a.addChild(el);
    }
    if (Type.exists(b._is_new)) {
        el.addChild(b);
        delete b._is_new;
    } else {
        b.addChild(el);
    }

    el.elType = 'midpoint';
    el.setParents([a.id, b.id]);

    el.prepareUpdate().update();

    /**
     * Used to generate a polynomial for the midpoint.
     * @name Midpoint#generatePolynomial
     * @returns {Array} An array containing the generated polynomial.
     * @private
     * @function
     * @ignore
     */
    el.generatePolynomial = function () {
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
            t1 = el.symbolic.x,
            t2 = el.symbolic.y,
            poly1 = "(" + a2 + ")*(" + t1 + ")-(" + a2 + ")*(" + b1 + ")+(" + t2 + ")*(" + b1 + ")-(" + a1 + ")*(" + t2 + ")+(" + a1 + ")*(" + b2 +
                ")-(" + t1 + ")*(" + b2 + ")",
            poly2 = "(" + a1 + ")^2 - 2*(" + a1 + ")*(" + t1 + ")+(" + a2 + ")^2-2*(" + a2 + ")*(" + t2 + ")-(" + b1 + ")^2+2*(" + b1 + ")*(" + t1 +
                ")-(" + b2 + ")^2+2*(" + b2 + ")*(" + t2 + ")";

        return [poly1, poly2];
    };

    return el;
};

/**
 * @class Given three point, a parallel point is the point such that the four points form a parallelogram.
 * @pseudo
 * @description A parallel point is given by three points. Taking the Euclidean vector from the first to the
 * second point, the parallel point is determined by adding that vector to the third point.
 * The line determined by the first two points is parallel to the line determined by the third point and the constructed point.
 * @constructor
 * @name Parallelpoint
 * @type JXG.Point
 * @augments JXG.Point
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 Taking the Euclidean vector <tt>v=p2-p1</tt> the parallel point is determined by
 * <tt>p4 = p3+v</tt>
 * @param {JXG.Line_JXG.Point} l,p The resulting point will together with p specify a line which is parallel to l.
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 * var p3 = board.create('point', [3.0, 3.0]);
 *
 * var pp1 = board.create('parallelpoint', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXG488c4be9-274f-40f0-a469-c5f70abe1f0e" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ppex1_board = JXG.JSXGraph.initBoard('JXG488c4be9-274f-40f0-a469-c5f70abe1f0e', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ppex1_p1 = ppex1_board.create('point', [0.0, 2.0]);
 *   var ppex1_p2 = ppex1_board.create('point', [2.0, 1.0]);
 *   var ppex1_p3 = ppex1_board.create('point', [3.0, 3.0]);
 *   var ppex1_pp1 = ppex1_board.create('parallelpoint', [ppex1_p1, ppex1_p2, ppex1_p3]);
 * </script><pre>
 */
JXG.createParallelPoint = function (board, parents, attributes) {
    var a, b, c, p, i, attr;

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }
    if (
        parents.length === 3 &&
        Type.isPointType(board, parents[0]) &&
        Type.isPointType(board, parents[1]) &&
        Type.isPointType(board, parents[2])
    ) {
        parents = Type.providePoints(board, parents, attributes, 'point');
        a = parents[0];
        b = parents[1];
        c = parents[2];
    } else if (
        Type.isPointType(board, parents[0]) &&
        parents[1].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        c = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        a = parents[1].point1;
        b = parents[1].point2;
    } else if (
        Type.isPointType(board, parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE
    ) {
        c = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        a = parents[0].point1;
        b = parents[0].point2;
    } else {
        throw new Error(
            "JSXGraph: Can't create parallel point with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [line,point], [point,point,point]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'parallelpoint');
    /**
     * @type {JXG.Element}
     * @ignore
     */
    p = board.create(
        "point",
        [
            function () {
                return c.coords.usrCoords[1] + b.coords.usrCoords[1] - a.coords.usrCoords[1];
            },
            function () {
                return c.coords.usrCoords[2] + b.coords.usrCoords[2] - a.coords.usrCoords[2];
            }
        ],
        attr
    );

    // required for algorithms requiring dependencies between elements
    if (Type.exists(a._is_new)) {
        p.addChild(a);
        delete a._is_new;
    } else {
        a.addChild(p);
    }
    if (Type.exists(b._is_new)) {
        p.addChild(b);
        delete b._is_new;
    } else {
        b.addChild(p);
    }
    if (Type.exists(c._is_new)) {
        p.addChild(c);
        delete c._is_new;
    } else {
        c.addChild(p);
    }

    p.elType = 'parallelpoint';
    p.setParents([a.id, b.id, c.id]);

    // required to set the coordinates because functions are considered as constraints. hence, the coordinates get set first after an update.
    // can be removed if the above issue is resolved.
    p.prepareUpdate().update();

    /**
     * @function
     * @ignore
     */
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
            poly1 = "(" + b2 + ")*(" + t1 + ")-(" + b2 + ")*(" + c1 + ")-(" + a2 + ")*(" + t1 + ")+(" + a2 + ")*(" + c1 + ")-(" + t2 + ")*(" + b1 + ")+(" + t2 + ")*(" +
                a1 + ")+(" + c2 + ")*(" + b1 + ")-(" + c2 + ")*(" + a1 + ")",
            poly2 = "(" + t2 + ")*(" + a1 + ")-(" + t2 + ")*(" + c1 + ")-(" + b2 + ")*(" + a1 + ")+(" + b2 + ")*(" + c1 + ")-(" + t1 + ")*(" + a2 + ")+(" + t1 + ")*(" +
                c2 + ")+(" + b1 + ")*(" + a2 + ")-(" + b1 + ")*(" + c2 + ")";

        return [poly1, poly2];
    };

    return p;
};

/**
 * @class A parallel is a line through a given point, parallel to a given line.
 * <p>
 * If original line is given as a JSXGraph line object, the resulting parallel line will be defined by the given point and an
 * infinitely far away point (an ideal point). That means, the line can not be shortened to a segment.
 * <p>
 * If the original line is given as two points, the resulting parallel line can be shortened to a a segment.
 * @pseudo
 * @name Parallel
 * @augments Line
 * @constructor
 * @type JXG.Line
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line_JXG.Point} l,p The constructed line contains p and has the same slope as l. Alternative parameters are p1, p2, p: The
 * constructed line contains p and has the same slope as the line through p1 and p2.
 * @example
 * // Create a parallel
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 * var l1 = board.create('line', [p1, p2]);
 *
 * var p3 = board.create('point', [3.0, 3.0]);
 * var pl1 = board.create('parallel', [l1, p3]);
 * </pre><div class="jxgbox" id="JXG24e54f9e-5c4e-4afb-9228-0ef27a59d627" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var plex1_board = JXG.JSXGraph.initBoard('JXG24e54f9e-5c4e-4afb-9228-0ef27a59d627', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var plex1_p1 = plex1_board.create('point', [0.0, 2.0]);
 *   var plex1_p2 = plex1_board.create('point', [2.0, 1.0]);
 *   var plex1_l1 = plex1_board.create('line', [plex1_p1, plex1_p2]);
 *   var plex1_p3 = plex1_board.create('point', [3.0, 3.0]);
 *   var plex1_pl1 = plex1_board.create('parallel', [plex1_l1, plex1_p3]);
 * </script><pre>
 * @example
 * var p1, p2, p3, l1, pl1;
 *
 * p1 = board.create('point', [0.0, 2.0]);
 * p2 = board.create('point', [2.0, 1.0]);
 * l1 = board.create('line', [p1, p2]);
 *
 * p3 = board.create('point', [1.0, 3.0]);
 * pl1 = board.create('parallel', [p1, p2, p3], {straightFirst: false, straightLast: false});
 *
 * </pre><div id="JXGd643305d-20c3-4a88-91f9-8d0c4448594f" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGd643305d-20c3-4a88-91f9-8d0c4448594f',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1, p2, p3, l1, pl1;
 *
 *     p1 = board.create('point', [0.0, 2.0]);
 *     p2 = board.create('point', [2.0, 1.0]);
 *     l1 = board.create('line', [p1, p2]);
 *
 *     p3 = board.create('point', [1.0, 3.0]);
 *     pl1 = board.create('parallel', [p1, p2, p3], {straightFirst: false, straightLast: false});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createParallel = function (board, parents, attributes) {
    var p,
        pp,
        pl,
        li,
        i,
        attr,
        ty = 1;

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }
    p = null;
    if (parents.length === 3) {
        // Line / segment through point parents[2] which is parallel to line through parents[0] and parents[1]
        parents = Type.providePoints(board, parents, attributes, 'point');
        p = parents[2];
        ty = 0;
    } else if (Type.isPointType(board, parents[0])) {
        // Parallel to line parents[1] through point parents[0]
        p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
        /** @ignore */
        li = function () {
            return parents[1].stdform;
        };
    } else if (Type.isPointType(board, parents[1])) {
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

    attr = Type.copyAttributes(attributes, board.options, "parallel", 'point');
    if (ty === 1) {
        // Line is given by line element. The parallel line is
        // constructed as line through an ideal point.
        pp = board.create(
            "point",
            [
                function () {
                    return Mat.crossProduct([1, 0, 0], li());
                }
            ],
            attr
        );
    } else {
        // Line is given by two points. The parallel line is
        // constructed as line through two finite point.
        pp = board.create("parallelpoint", parents, attr);
    }
    pp.isDraggable = true;

    attr = Type.copyAttributes(attributes, board.options, 'parallel');
    // line creator also calls addChild
    pl = board.create("line", [p, pp], attr);

    pl.elType = 'parallel';
    pl.subs = {
        point: pp
    };

    pl.inherits.push(pp);
    pl.setParents([parents[0].id, parents[1].id]);
    if (parents.length === 3) {
        pl.addParents(parents[2].id);
    }

    // p.addChild(pl);

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
 * @class A segment with an arrow head attached thath is parallel to a given segment.
 * The segment is given by its defining two points, the arrow starts at a given point.
 * <p>
 * @pseudo
 * @constructor
 * @name Arrowparallel
 * @type Parallel
 * @augments Parallel
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed arrow contains p3 and has the same slope as the line through p1 and p2.
 * @example
 * // Create a parallel
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 * var l1 = board.create('segment', [p1, p2]);
 *
 * var p3 = board.create('point', [3.0, 3.0]);
 * var pl1 = board.create('arrowparallel', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXGeeacdf99-036f-4e83-aeb6-f7388423e369" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var plex1_board = JXG.JSXGraph.initBoard('JXGeeacdf99-036f-4e83-aeb6-f7388423e369', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var plex1_p1 = plex1_board.create('point', [0.0, 2.0]);
 *   var plex1_p2 = plex1_board.create('point', [2.0, 1.0]);
 *   var plex1_l1 = plex1_board.create('segment', [plex1_p1, plex1_p2]);
 *   var plex1_p3 = plex1_board.create('point', [3.0, 3.0]);
 *   var plex1_pl1 = plex1_board.create('arrowparallel', [plex1_p1, plex1_p2, plex1_p3]);
 * })();
 * </script><pre>
 */
JXG.createArrowParallel = function (board, parents, attributes) {
    var p, attr;

    /* parallel arrow point polynomials are done in createParallelPoint */
    try {
        attr = Type.copyAttributes(attributes, board.options, 'arrowparallel');

        if (attr.lastArrow === false) {
            // An arrow has to have an arrow head.
            attr.lastArrow = true;
        }
        p = JXG.createParallel(board, parents, attr).setAttribute({
            straightFirst: false,
            straightLast: false
        });
        p.type = Const.OBJECT_TYPE_VECTOR;
        p.elType = 'arrowparallel';

        // parents are set in createParallel

        return p;
    } catch (e) {
        throw new Error(
            "JSXGraph: Can't create arrowparallel with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [line,point], [point,point,point]"
        );
    }
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
 * </pre><div class="jxgbox" id="JXG0d58cea8-b06a-407c-b27c-0908f508f5a4" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG0d58cea8-b06a-407c-b27c-0908f508f5a4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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
        attr = Type.copyAttributes(attributes, board.options, "bisector", 'point');
        attr.snapToGrid = false;

        p = board.create(
            "point",
            [
                function () {
                    return Geometry.angleBisector(parents[0], parents[1], parents[2], board);
                }
            ],
            attr
        );
        p.dump = false;

        for (i = 0; i < 3; i++) {
            // required for algorithm requiring dependencies between elements
            if (Type.exists(parents[i]._is_new)) {
                p.addChild(parents[i]);
                delete parents[i]._is_new;
            } else {
                parents[i].addChild(p);
            }
        }

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.line;
        }

        attr = Type.copyAttributes(attributes, board.options, 'bisector');
        l = JXG.createLine(board, [parents[1], p], attr);

        /**
         * Helper point
         * @memberOf Bisector.prototype
         * @type Point
         * @name point
         */
        l.point = p;

        l.elType = 'bisector';
        l.setParents(parents);
        l.subs = {
            point: p
        };
        l.inherits.push(p);

        return l;
    }

    throw new Error(
        "JSXGraph: Can't create angle bisector with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [point,point,point]"
    );
};

/**
 * @class Bisector lines are similar to {@link Bisector} but take two lines as parent elements. The resulting element is
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
 * </pre><div class="jxgbox" id="JXG3121ff67-44f0-4dda-bb10-9cda0b80bf18" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG3121ff67-44f0-4dda-bb10-9cda0b80bf18', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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

    var g1,
        g2,
        attr,
        ret,
        l1 = board.select(parents[0]),
        l2 = board.select(parents[1]);

    if (
        l1.elementClass !== Const.OBJECT_CLASS_LINE ||
        l2.elementClass !== Const.OBJECT_CLASS_LINE
    ) {
        throw new Error(
            "JSXGraph: Can't create angle bisectors of two lines with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [line,line]"
        );
    }

    if (!Type.exists(attributes.layer)) {
        attributes.layer = board.options.layer.line;
    }

    attr = Type.copyAttributes(attributes, board.options, "bisectorlines", 'line1');
    g1 = board.create(
        "line",
        [
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[0] / d1 - l2.stdform[0] / d2;
            },
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[1] / d1 - l2.stdform[1] / d2;
            },
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[2] / d1 - l2.stdform[2] / d2;
            }
        ],
        attr
    );

    if (!Type.exists(attributes.layer)) {
        attributes.layer = board.options.layer.line;
    }
    attr = Type.copyAttributes(attributes, board.options, "bisectorlines", 'line2');
    g2 = board.create(
        "line",
        [
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[0] / d1 + l2.stdform[0] / d2;
            },
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[1] / d1 + l2.stdform[1] / d2;
            },
            function () {
                var d1 = Mat.hypot(l1.stdform[1], l1.stdform[2]),
                    d2 = Mat.hypot(l2.stdform[1], l2.stdform[2]);

                return l1.stdform[2] / d1 + l2.stdform[2] / d2;
            }
        ],
        attr
    );

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

    ret = new Composition({ line1: g1, line2: g2 });

    g1.dump = false;
    g2.dump = false;

    ret.elType = 'bisectorlines';
    ret.setParents([l1.id, l2.id]);
    ret.subs = {
        line1: g1,
        line2: g2
    };
    // ret.inherits.push(g1, g2);

    return ret;
};

// /**
//  * @class An m-sector is a line which divides an angle into two angles. It is given by three points A, B, and
//  * C and a real number m, and divides an angle into two angles, an angle with amplitude m and an angle with
//  * amplitude (1-m)
//  * @pseudo
//  * @constructor
//  * @name Msector
//  * @type JXG.Line
//  * @augments JXG.Line
//  * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
//  * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The angle described by <tt>p1</tt>, <tt>p2</tt> and <tt>p3</tt> will
//  * be divided into two angles according to the value of <tt>m</tt>.
//  * @example
//  * var p1 = board.create('point', [6.0, 4.0]);
//  * var p2 = board.create('point', [3.0, 2.0]);
//  * var p3 = board.create('point', [1.0, 7.0]);
//  *
//  * var bi1 = board.create('msector', [p1, p2, p3], 1/5);
//  * </pre><div id="JXG0d58cea8-b06a-407c-b27c-0908f508f5a4" style="width: 400px; height: 400px;"></div>
//  * <script type="text/javascript">
//  * (function () {
//  *   var board = JXG.JSXGraph.initBoard('JXG0d58cea8-b06a-407c-b27c-0908f508f5a4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
//  *   var p1 = board.create('point', [6.0, 4.0]);
//  *   var p2 = board.create('point', [3.0, 2.0]);
//  *   var p3 = board.create('point', [1.0, 7.0]);
//  *   var bi1 = board.create('msector', [p1, p2, p3], 1/5);
//  * })();
//  * </script><pre>
//  */
// JXG.createMsector = function (board, parents, attributes) {
//     var p, l, i, attr;

//     if (parents[0].elementClass === Const.OBJECT_CLASS_POINT &&
//             parents[1].elementClass === Const.OBJECT_CLASS_POINT &&
//             parents[2].elementClass === Const.OBJECT_CLASS_POINT) {
//         // hidden and fixed helper
//         attr = Type.copyAttributes(attributes, board.options, 'msector', 'point');
//         p = board.create('point', [
//             function () {
//                 return Geometry.angleMsector(parents[0], parents[1], parents[2], parents[3], board);
//             }
//         ], attr);
//         p.dump = false;

//         for (i = 0; i < 3; i++) {
//             // required for algorithm requiring dependencies between elements
//             parents[i].addChild(p);
//         }

//         if (!Type.exists(attributes.layer)) {
//             attributes.layer = board.options.layer.line;
//         }

//         attr = Type.copyAttributes(attributes, board.options, 'msector');
//         l = JXG.createLine(board, [parents[1], p], attr);

//         /**
//          * Helper point
//          * @memberOf Msector.prototype
//          * @type Point
//          * @name point
//          */
//         l.point = p;

//         l.elType = 'msector';
//         l.parents = [parents[0].id, parents[1].id, parents[2].id];
//         l.subs = {
//             point: p
//         };
//         l.inherits.push(p);

//         return l;
//     }

//     throw new Error("JSXGraph: Can't create angle msector with parent types '" +
//         (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
//         "\nPossible parent types: [point,point,point,Number]");
// };

/**
 * @class Constructs the center of a {@link Circumcircle} without creating the circle.
 * Like the circumcircle the circumcenter is constructed by providing three points.
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
 * </pre><div class="jxgbox" id="JXGe8a40f95-bf30-4eb4-88a8-f4d5495261fd" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ccmex1_board = JXG.JSXGraph.initBoard('JXGe8a40f95-bf30-4eb4-88a8-f4d5495261fd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
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

        p = JXG.createPoint(
            board,
            [
                function () {
                    return Geometry.circumcenter(a, b, c, board);
                }
            ],
            attributes
        );

        for (i = 0; i < 3; i++) {
            if (Type.exists(parents[i]._is_new)) {
                p.addChild(parents[i]);
                delete parents[i]._is_new;
            } else {
                parents[i].addChild(p);
            }
        }

        p.elType = 'circumcenter';
        p.setParents(parents);

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
                poly1 = ["((", t1, ")-(", a1, "))^2+((", t2, ")-(", a2, "))^2-((", t1, ")-(", b1, "))^2-((", t2, ")-(", b2, "))^2"].join(""),
                poly2 = ["((", t1, ")-(", a1, "))^2+((", t2, ")-(", a2, "))^2-((", t1, ")-(", c1, "))^2-((", t2, ")-(", c2, "))^2"].join("");

            return [poly1, poly2];
        };

        return p;
    }

    throw new Error(
        "JSXGraph: Can't create circumcircle midpoint with parent types '" +
            typeof parents[0] +
            "', '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'." +
            "\nPossible parent types: [point,point,point]"
    );
};

/**
 * @class The center of the incircle of the triangle described by the three given points (without
 * constructing the circle).
 * {@link https://mathworld.wolfram.com/Incenter.html}
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
 * </pre><div class="jxgbox" id="JXGe8a40f95-bf30-4eb4-88a8-a2d5495261fd" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var icmex1_board = JXG.JSXGraph.initBoard('JXGe8a40f95-bf30-4eb4-88a8-a2d5495261fd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var icmex1_p1 = icmex1_board.create('point', [0.0, 2.0]);
 *   var icmex1_p2 = icmex1_board.create('point', [6.0, 1.0]);
 *   var icmex1_p3 = icmex1_board.create('point', [3.0, 7.0]);
 *   var icmex1_ic1 = icmex1_board.create('incenter', [icmex1_p1, icmex1_p2, icmex1_p3]);
 * </script><pre>
 */
JXG.createIncenter = function (board, parents, attributes) {
    var p, A, B, C, i;

    parents = Type.providePoints(board, parents, attributes, 'point');
    if (
        parents.length >= 3 &&
        Type.isPoint(parents[0]) &&
        Type.isPoint(parents[1]) &&
        Type.isPoint(parents[2])
    ) {
        A = parents[0];
        B = parents[1];
        C = parents[2];

        p = board.create(
            "point",
            [
                function () {
                    var a, b, c;

                    a = Mat.hypot(B.X() - C.X(), B.Y() - C.Y());
                    b = Mat.hypot(A.X() - C.X(), A.Y() - C.Y());
                    c = Mat.hypot(B.X() - A.X(), B.Y() - A.Y());

                    return new Coords(
                        Const.COORDS_BY_USER,
                        [
                            (a * A.X() + b * B.X() + c * C.X()) / (a + b + c),
                            (a * A.Y() + b * B.Y() + c * C.Y()) / (a + b + c)
                        ],
                        board
                    );
                }
            ],
            attributes
        );

        for (i = 0; i < 3; i++) {
            if (Type.exists(parents[i]._is_new)) {
                p.addChild(parents[i]);
                delete parents[i]._is_new;
            } else {
                parents[i].addChild(p);
            }
        }

        p.elType = 'incenter';
        p.setParents(parents);
    } else {
        throw new Error(
            "JSXGraph: Can't create incenter with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [point,point,point]"
        );
    }

    return p;
};

/**
 * @class A circumcircle is the unique circle through three points.
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
 * </pre><div class="jxgbox" id="JXGe65c9861-0bf0-402d-af57-3ab11962f5ac" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ccex1_board = JXG.JSXGraph.initBoard('JXGe65c9861-0bf0-402d-af57-3ab11962f5ac', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ccex1_p1 = ccex1_board.create('point', [0.0, 2.0]);
 *   var ccex1_p2 = ccex1_board.create('point', [6.0, 1.0]);
 *   var ccex1_p3 = ccex1_board.create('point', [3.0, 7.0]);
 *   var ccex1_cc1 = ccex1_board.create('circumcircle', [ccex1_p1, ccex1_p2, ccex1_p3]);
 * </script><pre>
 */
JXG.createCircumcircle = function (board, parents, attributes) {
    var p, c, attr, i;

    parents = Type.providePoints(board, parents, attributes, 'point');
    if (parents === false) {
        throw new Error(
            "JSXGraph: Can't create circumcircle with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [point,point,point]"
        );
    }

    try {
        attr = Type.copyAttributes(attributes, board.options, "circumcircle", 'center');
        p = JXG.createCircumcenter(board, parents, attr);

        p.dump = false;

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.circle;
        }
        attr = Type.copyAttributes(attributes, board.options, 'circumcircle');
        c = JXG.createCircle(board, [p, parents[0]], attr);

        c.elType = 'circumcircle';
        c.setParents(parents);
        c.subs = {
            center: p
        };
        c.inherits.push(c);
        for (i = 0; i < 3; i++) {
            if (Type.exists(parents[i]._is_new)) {
                c.addChild(parents[i]);
                delete parents[i]._is_new;
            } else {
                parents[i].addChild(c);
            }
        }
    } catch (e) {
        throw new Error(
            "JSXGraph: Can't create circumcircle with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [point,point,point]"
        );
    }

    // p is already stored as midpoint in c so there's no need to store it explicitly.

    return c;
};

/**
 * @class The circle which touches the three sides of a triangle given by three points.
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
 * </pre><div class="jxgbox" id="JXGe65c9861-0bf0-402d-af57-2ab12962f8ac" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var icex1_board = JXG.JSXGraph.initBoard('JXGe65c9861-0bf0-402d-af57-2ab12962f8ac', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var icex1_p1 = icex1_board.create('point', [0.0, 2.0]);
 *   var icex1_p2 = icex1_board.create('point', [6.0, 1.0]);
 *   var icex1_p3 = icex1_board.create('point', [3.0, 7.0]);
 *   var icex1_ic1 = icex1_board.create('incircle', [icex1_p1, icex1_p2, icex1_p3]);
 * </script><pre>
 */
JXG.createIncircle = function (board, parents, attributes) {
    var i, p, c, attr;

    parents = Type.providePoints(board, parents, attributes, 'point');
    if (parents === false) {
        throw new Error(
            "JSXGraph: Can't create circumcircle with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [point,point,point]"
        );
    }
    try {
        attr = Type.copyAttributes(attributes, board.options, "incircle", 'center');
        p = JXG.createIncenter(board, parents, attr);

        p.dump = false;

        if (!Type.exists(attributes.layer)) {
            attributes.layer = board.options.layer.circle;
        }
        attr = Type.copyAttributes(attributes, board.options, 'incircle');
        c = JXG.createCircle(
            board,
            [
                p,
                function () {
                    var a = Mat.hypot(parents[1].X() - parents[2].X(), parents[1].Y() - parents[2].Y()),
                        b = Mat.hypot(parents[0].X() - parents[2].X(), parents[0].Y() - parents[2].Y()),
                        c = Mat.hypot(parents[1].X() - parents[0].X(), parents[1].Y() - parents[0].Y()),
                        s = (a + b + c) / 2;

                    return Math.sqrt(((s - a) * (s - b) * (s - c)) / s);
                }
            ],
            attr
        );

        c.elType = 'incircle';
        c.setParents(parents);
        for (i = 0; i < 3; i++) {
            if (Type.exists(parents[i]._is_new)) {
                c.addChild(parents[i]);
                delete parents[i]._is_new;
            } else {
                parents[i].addChild(c);
            }
        }

        /**
         * The center of the incircle
         * @memberOf Incircle.prototype
         * @type Incenter
         * @name center
         */
        c.center = p;

        c.subs = {
            center: c.center
        };
        c.inherits.push(p);
    } catch (e) {
        throw new Error(
            "JSXGraph: Can't create circumcircle with parent types '" +
                typeof parents[0] +
                "', '" +
                typeof parents[1] +
                "' and '" +
                typeof parents[2] +
                "'." +
                "\nPossible parent types: [point,point,point]"
        );
    }

    // p is already stored as midpoint in c so there's no need to store it explicitly.

    return c;
};

/**
 * @class  Reflect a point, line, circle, curve, polygon across a given line.
 * @pseudo
 * @description A reflected element (point, polygon, line or curve) is given by a given
 * object of the same type and a line of reflection.
 * It is determined by the reflection of the given element
 * across the given line.
 * @constructor
 * @name Reflection
 * @type JXG.GeometryElement
 * @augments JXG.GeometryElement
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point|JXG.Line|JXG.Curve|JXG.Polygon_JXG.Line} p,l The reflection element is the reflection of p across the line l.
 * @example
 * var p1 = board.create('point', [0.0, 4.0]);
 * var p2 = board.create('point', [6.0, 1.0]);
 * var l1 = board.create('line', [p1, p2]);
 * var p3 = board.create('point', [3.0, 3.0]);
 *
 * var rp1 = board.create('reflection', [p3, l1]);
 * </pre><div class="jxgbox" id="JXG087a798e-a36a-4f52-a2b4-29a23a69393b" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var rpex1_board = JXG.JSXGraph.initBoard('JXG087a798e-a36a-4f52-a2b4-29a23a69393b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var rpex1_p1 = rpex1_board.create('point', [0.0, 4.0]);
 *   var rpex1_p2 = rpex1_board.create('point', [6.0, 1.0]);
 *   var rpex1_l1 = rpex1_board.create('line', [rpex1_p1, rpex1_p2]);
 *   var rpex1_p3 = rpex1_board.create('point', [3.0, 3.0]);
 *   var rpex1_rp1 = rpex1_board.create('reflection', [rpex1_p3, rpex1_l1]);
 * </script><pre>
 * @example
 *         // Reflection of more elements
 *         // reflection line
 *         var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *
 *         var p1 = board.create('point', [-3,-1], {name: "A"});
 *         var q1 = board.create('reflection', [p1, li], {name: "A'"});
 *
 *         var l1 = board.create('line', [1,-5,1]);
 *         var l2 = board.create('reflection', [l1, li]);
 *
 *         var cu1 = board.create('curve', [[-3, -3, -2.5, -3, -3, -2.5], [-3, -2, -2, -2, -2.5, -2.5]], {strokeWidth:3});
 *         var cu2 = board.create('reflection', [cu1, li], {strokeColor: 'red', strokeWidth:3});
 *
 *         var pol1 = board.create('polygon', [[-6,-3], [-4,-5], [-5,-1.5]]);
 *         var pol2 = board.create('reflection', [pol1, li]);
 *
 *         var c1 = board.create('circle', [[-2,-2], [-2, -1]]);
 *         var c2 = board.create('reflection', [c1, li]);
 *
 *         var a1 = board.create('arc', [[1, 1], [0, 1], [1, 0]], {strokeColor: 'red'});
 *         var a2 = board.create('reflection', [a1, li], {strokeColor: 'red'});
 *
 *         var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                           anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                           fillColor: 'yellow', strokeColor: 'black'});
 *         var s2 = board.create('reflection', [s1, li], {fillColor: 'yellow', strokeColor: 'black', fillOpacity: 0.5});
 *
 *         var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 *         var an2 = board.create('reflection', [an1, li]);
 *
 * </pre><div id="JXG8f763af4-d449-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG8f763af4-d449-11e7-93b3-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             // reflection line
 *             var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *
 *             var p1 = board.create('point', [-3,-1], {name: "A"});
 *             var q1 = board.create('reflection', [p1, li], {name: "A'"});
 *
 *             var l1 = board.create('line', [1,-5,1]);
 *             var l2 = board.create('reflection', [l1, li]);
 *
 *             var cu1 = board.create('curve', [[-3, -3, -2.5, -3, -3, -2.5], [-3, -2, -2, -2, -2.5, -2.5]], {strokeWidth:3});
 *             var cu2 = board.create('reflection', [cu1, li], {strokeColor: 'red', strokeWidth:3});
 *
 *             var pol1 = board.create('polygon', [[-6,-3], [-4,-5], [-5,-1.5]]);
 *             var pol2 = board.create('reflection', [pol1, li]);
 *
 *             var c1 = board.create('circle', [[-2,-2], [-2, -1]]);
 *             var c2 = board.create('reflection', [c1, li]);
 *
 *         var a1 = board.create('arc', [[1, 1], [0, 1], [1, 0]], {strokeColor: 'red'});
 *         var a2 = board.create('reflection', [a1, li], {strokeColor: 'red'});
 *
 *         var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                           anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                           fillColor: 'yellow', strokeColor: 'black'});
 *         var s2 = board.create('reflection', [s1, li], {fillColor: 'yellow', strokeColor: 'black', fillOpacity: 0.5});
 *
 *         var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 *         var an2 = board.create('reflection', [an1, li]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createReflection = function (board, parents, attributes) {
    var l, org, r, r_c,
        t, i, attr, attr2,
        errStr = "\nPossible parent types: [point|line|curve|polygon|circle|arc|sector, line]";

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }

    attr = Type.copyAttributes(attributes, board.options, 'reflection');

    if (Type.isPoint(parents[0])) {
        org = Type.providePoints(board, [parents[0]], attr2)[0];
    } else if (
        parents[0].elementClass === Const.OBJECT_CLASS_CURVE ||
        parents[0].elementClass === Const.OBJECT_CLASS_LINE ||
        parents[0].type === Const.OBJECT_TYPE_POLYGON ||
        parents[0].elementClass === Const.OBJECT_CLASS_CIRCLE
    ) {
        org = parents[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create reflection element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }

    if (parents[1].elementClass === Const.OBJECT_CLASS_LINE) {
        l = parents[1];
    } else {
        throw new Error(
            "JSXGraph: Can't create reflected element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }
    t = JXG.createTransform(board, [l], { type: "reflect" });

    if (Type.isPoint(org)) {
        r = JXG.createPoint(board, [org, t], attr);

        // Arcs and sectors are treated as curves
    } else if (org.elementClass === Const.OBJECT_CLASS_CURVE) {
        r = JXG.createCurve(board, [org, t], attr);
    } else if (org.elementClass === Const.OBJECT_CLASS_LINE) {
        r = JXG.createLine(board, [org, t], attr);
    } else if (org.type === Const.OBJECT_TYPE_POLYGON) {
        r = JXG.createPolygon(board, [org, t], attr);
    } else if (org.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        if (attr.type.toLowerCase() === 'euclidean') {
            // Create a circle element from a circle and a Euclidean transformation
            attr2 = Type.copyAttributes(attributes, board.options, "reflection", 'center');
            r_c = JXG.createPoint(board, [org.center, t], attr2);
            r_c.prepareUpdate()
                .update()
                .updateVisibility(r_c.evalVisProp('visible'))
                .updateRenderer();
            r = JXG.createCircle(
                board,
                [
                    r_c,
                    function () {
                        return org.Radius();
                    }
                ],
                attr
            );
        } else {
            // Create a conic element from a circle and a projective transformation
            r = JXG.createCircle(board, [org, t], attr);
        }
    } else {
        throw new Error(
            "JSXGraph: Can't create reflected element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }

    if (Type.exists(org._is_new)) {
        r.addChild(org);
        delete org._is_new;
    } else {
        // org.addChild(r);
    }
    l.addChild(r);

    r.elType = 'reflection';
    r.addParents(l);
    r.prepareUpdate().update(); //.updateVisibility(r.evalVisProp('visible')).updateRenderer();

    if (Type.isPoint(r)) {
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
                p1 = org.symbolic.x,
                p2 = org.symbolic.y,
                r1 = r.symbolic.x,
                r2 = r.symbolic.y,
                poly1 = ["((", r2, ")-(", p2, "))*((", a2, ")-(", b2, "))+((", a1, ")-(", b1, "))*((", r1, ")-(", p1, "))"].join(""),
                poly2 = ["((", r1, ")-(", a1, "))^2+((", r2, ")-(", a2, "))^2-((", p1, ")-(", a1, "))^2-((", p2, ")-(", a2, "))^2"].join("");

            return [poly1, poly2];
        };
    }

    return r;
};

/**
 * @class Reflect a point, line, circle, curve, polygon across a given point.
 * @pseudo
 * @description A mirror element is determined by the reflection of a
 * given point, line, circle, curve, polygon across another given point.
 * In contrast to generic transformations, mirror elements of circles are again circles.
 * @constructor
 * @name MirrorElement
 * @type JXG.GeometryElement
 * @augments JXG.GeometryElement
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point|JXG.Line|JXG.Curve|JXG.Ppolygon_JXG.Point} p1,p2 The constructed element is the mirror image of p2 across p1.
 * @example
 *         // point of reflection
 *         var mirr = board.create('point', [-1,-1], {color: '#aaaaaa'});
 *
 *         var p1 = board.create('point', [-3,-1], {name: "A"});
 *         var q1 = board.create('mirrorelement', [p1, mirr], {name: "A'"});
 *
 *         var l1 = board.create('line', [1, -5, 1]);
 *         var l2 = board.create('mirrorelement', [l1, mirr]);
 *
 *         var cu1 = board.create('curve', [[-3, -3, -2.5, -3, -3, -2.5], [-3, -2, -2, -2, -2.5, -2.5]], {strokeWidth:3});
 *         var cu2 = board.create('mirrorelement', [cu1, mirr], {strokeColor: 'red', strokeWidth:3});
 *
 *         var pol1 = board.create('polygon', [[-6,-2], [-4,-4], [-5,-0.5]]);
 *         var pol2 = board.create('mirrorelement', [pol1, mirr]);
 *
 *         var c1 = board.create('circle', [[-6,-6], [-6, -5]]);
 *         var c2 = board.create('mirrorelement', [c1, mirr]);
 *
 *         var a1 = board.create('arc', [[1, 1], [0, 1], [1, 0]], {strokeColor: 'red'});
 *         var a2 = board.create('mirrorelement', [a1, mirr], {strokeColor: 'red'});
 *
 *         var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                           anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                           fillColor: 'yellow', strokeColor: 'black'});
 *         var s2 = board.create('mirrorelement', [s1, mirr], {fillColor: 'yellow', strokeColor: 'black', fillOpacity: 0.5});
 *
 *         var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 *         var an2 = board.create('mirrorelement', [an1, mirr]);
 *
 *
 * </pre><div id="JXG026c779c-d8d9-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG026c779c-d8d9-11e7-93b3-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             // point of reflection
 *             var mirr = board.create('point', [-1,-1], {color: '#aaaaaa'});
 *
 *             var p1 = board.create('point', [-3,-1], {name: "A"});
 *             var q1 = board.create('mirrorelement', [p1, mirr], {name: "A'"});
 *
 *             var l1 = board.create('line', [1,-5, 1]);
 *             var l2 = board.create('mirrorelement', [l1, mirr]);
 *
 *             var cu1 = board.create('curve', [[-3, -3, -2.5, -3, -3, -2.5], [-3, -2, -2, -2, -2.5, -2.5]], {strokeWidth:3});
 *             var cu2 = board.create('mirrorelement', [cu1, mirr], {strokeColor: 'red', strokeWidth:3});
 *
 *             var pol1 = board.create('polygon', [[-6,-2], [-4,-4], [-5,-0.5]]);
 *             var pol2 = board.create('mirrorelement', [pol1, mirr]);
 *
 *             var c1 = board.create('circle', [[-6,-6], [-6, -5]]);
 *             var c2 = board.create('mirrorelement', [c1, mirr]);
 *
 *         var a1 = board.create('arc', [[1, 1], [0, 1], [1, 0]], {strokeColor: 'red'});
 *         var a2 = board.create('mirrorelement', [a1, mirr], {strokeColor: 'red'});
 *
 *         var s1 = board.create('sector', [[-3.5,-3], [-3.5, -2], [-3.5,-4]], {
 *                           anglePoint: {visible:true}, center: {visible: true}, radiusPoint: {visible: true},
 *                           fillColor: 'yellow', strokeColor: 'black'});
 *         var s2 = board.create('mirrorelement', [s1, mirr], {fillColor: 'yellow', strokeColor: 'black', fillOpacity: 0.5});
 *
 *         var an1 = board.create('angle', [[-4,3.9], [-3, 4], [-3, 3]]);
 *         var an2 = board.create('mirrorelement', [an1, mirr]);
 *
 *     })();
 *
 * </script><pre>
 */
JXG.createMirrorElement = function (board, parents, attributes) {
    var org, i, m, r, r_c, t,
        attr, attr2,
        errStr = "\nPossible parent types: [point|line|curve|polygon|circle|arc|sector, point]";

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }

    attr = Type.copyAttributes(attributes, board.options, 'mirrorelement');
    if (Type.isPoint(parents[0])) {
        // Create point to be mirrored if supplied by coords array.
        org = Type.providePoints(board, [parents[0]], attr)[0];
    } else if (
        parents[0].elementClass === Const.OBJECT_CLASS_CURVE ||
        parents[0].elementClass === Const.OBJECT_CLASS_LINE ||
        parents[0].type === Const.OBJECT_TYPE_POLYGON ||
        parents[0].elementClass === Const.OBJECT_CLASS_CIRCLE
    ) {
        org = parents[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create mirror element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }

    if (Type.isPoint(parents[1])) {
        attr2 = Type.copyAttributes(attributes, board.options, "mirrorelement", 'point');
        // Create mirror point if supplied by coords array.
        m = Type.providePoints(board, [parents[1]], attr2)[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create mirror element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }

    t = JXG.createTransform(board, [Math.PI, m], { type: "rotate" });
    if (Type.isPoint(org)) {
        r = JXG.createPoint(board, [org, t], attr);

        // Arcs and sectors are treated as curves
    } else if (org.elementClass === Const.OBJECT_CLASS_CURVE) {
        r = JXG.createCurve(board, [org, t], attr);
    } else if (org.elementClass === Const.OBJECT_CLASS_LINE) {
        r = JXG.createLine(board, [org, t], attr);
    } else if (org.type === Const.OBJECT_TYPE_POLYGON) {
        r = JXG.createPolygon(board, [org, t], attr);
    } else if (org.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        if (attr.type.toLowerCase() === 'euclidean') {
            // Create a circle element from a circle and a Euclidean transformation
            attr2 = Type.copyAttributes(attributes, board.options, "mirrorelement", 'center');
            r_c = JXG.createPoint(board, [org.center, t], attr2);
            r_c.prepareUpdate()
                .update()
                .updateVisibility(r_c.evalVisProp('visible'))
                .updateRenderer();
            r = JXG.createCircle(
                board,
                [
                    r_c,
                    function () {
                        return org.Radius();
                    }
                ],
                attr
            );
        } else {
            // Create a conic element from a circle and a projective transformation
            r = JXG.createCircle(board, [org, t], attr);
        }
    } else {
        throw new Error(
            "JSXGraph: Can't create mirror element with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                errStr
        );
    }

    if (Type.exists(org._is_new)) {
        r.addChild(org);
        delete org._is_new;
    } else {
        // org.addChild(r);
    }
    m.addChild(r);

    r.elType = 'mirrorelement';
    r.addParents(m);
    r.prepareUpdate().update();

    return r;
};

/**
 * @class A MirrorPoint is a special case of a {@link MirrorElement}.
 * @pseudo
 * @description A mirror point is determined by the reflection of a given point against another given point.
 * @constructor
 * @name MirrorPoint
 * @type JXG.Point
 * @augments JXG.Point
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point} p1,p2 The constructed point is the reflection of p2 against p1.
 *
 * This method is superseeded by the more general {@link JXG.createMirrorElement}.
 * @example
 * var p1 = board.create('point', [3.0, 3.0]);
 * var p2 = board.create('point', [6.0, 1.0]);
 *
 * var mp1 = board.create('mirrorpoint', [p1, p2]);
 * </pre><div class="jxgbox" id="JXG7eb2a814-6c4b-4caa-8cfa-4183a948d25b" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var mpex1_board = JXG.JSXGraph.initBoard('JXG7eb2a814-6c4b-4caa-8cfa-4183a948d25b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var mpex1_p1 = mpex1_board.create('point', [3.0, 3.0]);
 *   var mpex1_p2 = mpex1_board.create('point', [6.0, 1.0]);
 *   var mpex1_mp1 = mpex1_board.create('mirrorpoint', [mpex1_p1, mpex1_p2]);
 * </script><pre>
 */
JXG.createMirrorPoint = function (board, parents, attributes) {
    var el = JXG.createMirrorElement(board, parents, attributes);
    el.elType = 'mirrorpoint';
    return el;
};

/**
 * @class The graph of the integral function of a given function in a given interval.
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
 * var c1 = board.create('functiongraph', [function (t) { return Math.cos(t)*t; }]);
 * var i1 = board.create('integral', [[-2.0, 2.0], c1]);
 * </pre><div class="jxgbox" id="JXGd45d7188-6624-4d6e-bebb-1efa2a305c8a" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var intex1_board = JXG.JSXGraph.initBoard('JXGd45d7188-6624-4d6e-bebb-1efa2a305c8a', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
 *   var intex1_c1 = intex1_board.create('functiongraph', [function (t) { return Math.cos(t)*t; }]);
 *   var intex1_i1 = intex1_board.create('integral', [[-2.0, 2.0], intex1_c1]);
 * </script><pre>
 */
JXG.createIntegral = function (board, parents, attributes) {
    var interval, curve, attr, start, end,
        startx, starty, endx, endy,
        pa_on_curve, pa_on_axis, pb_on_curve, pb_on_axis,
        txt_fun,
        t = null, p;

    if (Type.isArray(parents[0]) && parents[1].elementClass === Const.OBJECT_CLASS_CURVE) {
        interval = parents[0];
        curve = parents[1];
    } else if (
        Type.isArray(parents[1]) &&
        parents[0].elementClass === Const.OBJECT_CLASS_CURVE
    ) {
        interval = parents[1];
        curve = parents[0];
    } else {
        throw new Error(
            "JSXGraph: Can't create integral with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [[number|function,number|function],curve]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'integral');
    attr.withlabel = false; // There is a custom 'label' below.
    p = board.create("curve", [[0], [0]], attr);

    // Dirty hack: the integral curve is removed from board.objectsList
    // and inserted below again after the pa_/pb_on_axis elements.
    // Otherwise, the filled area lags is updated before the
    // update of the bounds.
    board.objectsList.pop();

    // Correct the interval if necessary - NOT ANYMORE, GGB's fault
    start = interval[0];
    end = interval[1];

    if (Type.isFunction(start)) {
        startx = start;
        starty = function () {
            return curve.Y(startx());
        };
        start = startx();
    } else {
        startx = start;
        starty = curve.Y(start);
    }

    if (Type.isFunction(end)) {
        endx = end;
        endy = function () {
            return curve.Y(endx());
        };
        end = endx();
    } else {
        endx = end;
        endy = curve.Y(end);
    }

    attr = Type.copyAttributes(attributes, board.options, "integral", 'curveleft');
    pa_on_curve = board.create("glider", [startx, starty, curve], attr);
    if (Type.isFunction(startx)) {
        pa_on_curve.hideElement();
    }

    attr = Type.copyAttributes(attributes, board.options, 'integral', 'baseleft');
    pa_on_axis = board.create('point', [
            function () {
                if (p.evalVisProp('axis') === 'y') {
                    return 0;
                }
                return pa_on_curve.X();
            },
            function () {
                if (p.evalVisProp('axis') === 'y') {
                    return pa_on_curve.Y();
                }
                return 0;
            }
        ], attr);

    attr = Type.copyAttributes(attributes, board.options, "integral", 'curveright');
    pb_on_curve = board.create("glider", [endx, endy, curve], attr);
    if (Type.isFunction(endx)) {
        pb_on_curve.hideElement();
    }

    attr = Type.copyAttributes(attributes, board.options, "integral", 'baseright');
    pb_on_axis = board.create('point', [
            function () {
                if (p.evalVisProp('axis') === 'y') {
                    return 0;
                }
                return pb_on_curve.X();
            },
            function () {
                if (p.evalVisProp('axis') === 'y') {
                    return pb_on_curve.Y();
                }

                return 0;
            }
        ], attr);

    // Re-insert the filled integral curve element
    p._pos = board.objectsList.length;
    board.objectsList.push(p);

    attr = Type.copyAttributes(attributes, board.options, 'integral');
    if (attr.withlabel !== false && attr.axis !== 'y') {
        attr = Type.copyAttributes(attributes, board.options, "integral", 'label');
        attr = Type.copyAttributes(attr, board.options, 'label');

        t = board.create('text', [
                function () {
                    var off = new Coords(
                            Const.COORDS_BY_SCREEN,
                            [
                                this.evalVisProp('offset.0') +
                                    this.board.origin.scrCoords[1],
                                0
                            ],
                            this.board,
                            false
                        ),
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
                    var off = new Coords(
                            Const.COORDS_BY_SCREEN,
                            [
                                0,
                                this.evalVisProp('offset.1') +
                                    this.board.origin.scrCoords[2]
                            ],
                            this.board,
                            false
                        ),
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
                ''
            ], attr);

        txt_fun = function () {
            var intSymbol = '&int;',
                Int = Numerics.NewtonCotes([pa_on_axis.X(), pb_on_axis.X()], curve.Y),
                digits = t.evalVisProp('digits'),
                val;

            if (t.useLocale()) {
                val = t.formatNumberLocale(Int, digits);
            } else {
                val = Type.toFixed(Int, digits);
            }
            if (t.evalVisProp('usemathjax') || t.evalVisProp('usekatex')) {
                intSymbol = '\\int';
            }
            return intSymbol + ' = ' + val;
        };
        t.setText(txt_fun);
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
    p.setParents([curve.id, interval]);
    p.subs = {
        curveLeft: pa_on_curve,
        baseLeft: pa_on_axis,
        curveRight: pb_on_curve,
        baseRight: pb_on_axis
    };
    p.inherits.push(pa_on_curve, pa_on_axis, pb_on_curve, pb_on_axis);

    if (attr.withlabel) {
        p.subs.label = t;
        p.inherits.push(t);
    }

    /**
     * Returns the current value of the integral.
     * @memberOf Integral
     * @name Value
     * @function
     * @returns {Number}
     */
    p.Value = function () {
        return Numerics.I([pa_on_axis.X(), pb_on_axis.X()], curve.Y);
    };

    /**
     * documented in JXG.Curve
     * @class
     * @ignore
     */
    p.updateDataArray = function () {
        var x, y, i, left, right, lowx, upx, lowy, upy;

        if (this.evalVisProp('axis') === 'y') {
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
                if (
                    lowy <= curve.points[i].usrCoords[2] &&
                    left <= curve.points[i].usrCoords[1] &&
                    curve.points[i].usrCoords[2] <= upy &&
                    curve.points[i].usrCoords[1] <= right
                ) {
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
                if (
                    left <= curve.points[i].usrCoords[1] &&
                    curve.points[i].usrCoords[1] <= right
                ) {
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
     *
     * @name baseLeft
     * @memberOf Integral
     * @type JXG.Point
     */
    p.baseLeft = pa_on_axis;

    /**
     * The point on the axis initially corresponding to the higher value of the interval.
     *
     * @name baseRight
     * @memberOf Integral
     * @type JXG.Point
     */
    p.baseRight = pb_on_axis;

    /**
     * The glider on the curve corresponding to the lower value of the interval.
     *
     * @name curveLeft
     * @memberOf Integral
     * @type Glider
     */
    p.curveLeft = pa_on_curve;

    /**
     * The glider on the axis corresponding to the higher value of the interval.
     *
     * @name curveRight
     * @memberOf Integral
     * @type Glider
     */
    p.curveRight = pb_on_curve;

    p.methodMap = JXG.deepCopy(p.methodMap, {
        curveLeft: "curveLeft",
        baseLeft: "baseLeft",
        curveRight: "curveRight",
        baseRight: "baseRight",
        Value: "Value"
    });

    /**
     * documented in GeometryElement
     * @ignore
     */
    p.label = t;

    return p;
};

/**
 * @class The area which is the set of solutions of a linear inequality or an inequality
 * of a function graph.
 * For example, an inequality of type y <= f(x).
 * @pseudo
 * @description Display the solution set of a linear inequality (less than or equal to).
 * To be precise, the solution set of the inequality <i>y <= b/a * x + c/a</i> is shown.
 * In case <i>a = 0</i>, that is if the equation of the line is <i>bx + c = 0</i>,
 * the area of the inequality <i>bx + c <= 0</i> is shown.
 * <p>
 * For function graphs the area below the function graph is filled, i.e. the
 * area of the inequality y <= f(x).
 * With the attribute inverse:true the area of the inequality y >= f(x) is filled.
 *
 * @param {JXG.Line} l The area drawn will be the area below this line. With the attribute
 * inverse:true, the inequality 'greater than or equal to' is shown.
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
 * </pre><div class="jxgbox" id="JXG2b703006-fd98-11e1-b79e-ef9e591c002e" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *  var board = JXG.JSXGraph.initBoard('JXG2b703006-fd98-11e1-b79e-ef9e591c002e', {boundingbox:[-4, 6, 10, -6], axis: false, grid: false, keepaspectratio: true}),
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
 * </pre><div class="jxgbox" id="JXG1ded3812-2da4-4323-abaf-1db4bad1bfbd" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *  var board = JXG.JSXGraph.initBoard('JXG1ded3812-2da4-4323-abaf-1db4bad1bfbd', {boundingbox:[-4, 6, 10, -6], axis: false, grid: false, keepaspectratio: true}),
 *      l = board.create('line', [1, 2, -3]),
 *      ineq = board.create('inequality', [l], {inverse:true});
 * })();
 * </script><pre>
 *
 * @example
 * var f = board.create('functiongraph', ['sin(x)', -2*Math.PI, 2*Math.PI]);
 *
 * var ineq_lower = board.create('inequality', [f]);
 * var ineq_greater = board.create('inequality', [f], {inverse: true, fillColor: 'yellow'});
 *
 *
 * </pre><div id="JXGdb68c574-414c-11e8-839a-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGdb68c574-414c-11e8-839a-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var f = board.create('functiongraph', ['sin(x)', -2*Math.PI, 2*Math.PI]);
 *
 *     var ineq_lower = board.create('inequality', [f]);
 *     var ineq_greater = board.create('inequality', [f], {inverse: true, fillColor: 'yellow'});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createInequality = function (board, parents, attributes) {
    var f, a, attr;

    attr = Type.copyAttributes(attributes, board.options, 'inequality');
    if (parents[0].elementClass === Const.OBJECT_CLASS_LINE) {
        a = board.create("curve", [[], []], attr);
        a.hasPoint = function () {
            return false;
        };

        /**
         * @class
         * @ignore
         */
        a.updateDataArray = function () {
            var i1,
                i2,
                // This will be the height of the area. We mustn't rely upon the board height because if we pan the view
                // such that the line is not visible anymore, the borders of the area will get visible in some cases.
                h,
                bb = board.getBoundingBox(),
                inverse = this.evalVisProp('inverse'),
                factor = inverse ? -1 : 1,
                expansion = 1.5,
                w = expansion * Math.max(bb[2] - bb[0], bb[1] - bb[3]),
                // Fake a point (for Math.Geometry.perpendicular)
                // contains centroid of the board
                dp = {
                    coords: {
                        usrCoords: [1, (bb[0] + bb[2]) * 0.5, inverse ? bb[1] : bb[3]]
                    }
                },
                slope1 = parents[0].stdform.slice(1),
                slope2 = slope1;

            // Calculate the area height as
            //  expansion times the distance of the line to the
            // point in the middle of the top/bottom border.
            h =
                expansion *
                Math.max(
                    Geometry.perpendicular(parents[0], dp, board)[0].distance(
                        Const.COORDS_BY_USER,
                        dp.coords
                    ),
                    w
                );
            h *= factor;

            // reuse dp
            dp = {
                coords: {
                    usrCoords: [1, (bb[0] + bb[2]) * 0.5, (bb[1] + bb[3]) * 0.5]
                }
            };

            // If dp is on the line, Geometry.perpendicular will return a point not on the line.
            // Since this somewhat odd behavior of Geometry.perpendicular is needed in GEONExT,
            // it is circumvented here.
            if (
                Math.abs(Mat.innerProduct(dp.coords.usrCoords, parents[0].stdform, 3)) >=
                Mat.eps
            ) {
                dp = Geometry.perpendicular(parents[0], dp, board)[0].usrCoords;
            } else {
                dp = dp.coords.usrCoords;
            }
            i1 = [1, dp[1] + slope1[1] * w, dp[2] - slope1[0] * w];
            i2 = [1, dp[1] - slope2[1] * w, dp[2] + slope2[0] * w];

            // One of the vectors based in i1 and orthogonal to the parent line has the direction d1 = (slope1, -1)
            // We will go from i1 to i1 + h*d1, from there to i2 + h*d2 (with d2 calculated equivalent to d1) and
            // end up in i2.
            this.dataX = [i1[1], i1[1] + slope1[0] * h, i2[1] + slope2[0] * h, i2[1], i1[1]];
            this.dataY = [i1[2], i1[2] + slope1[1] * h, i2[2] + slope2[1] * h, i2[2], i1[2]];
        };
    } else if (
        parents[0].elementClass === Const.OBJECT_CLASS_CURVE &&
        parents[0].visProp.curvetype === "functiongraph"
    ) {
        a = board.create("curve", [[], []], attr);
        /**
         * @class
         * @ignore
         */
        a.updateDataArray = function () {
            var bbox = this.board.getBoundingBox(),
                points = [],
                infty,
                first,
                last,
                len,
                i,
                mi = parents[0].minX(),
                ma = parents[0].maxX(),
                curve_mi,
                curve_ma,
                firstx,
                lastx,
                enlarge = (bbox[1] - bbox[3]) * 0.3, // enlarge the bbox vertically by this amount
                inverse = this.evalVisProp('inverse');

            // inverse == true <=> Fill area with y >= f(x)
            infty = inverse ? 1 : 3; // we will use either bbox[1] or bbox[3] below

            this.dataX = [];
            this.dataY = [];
            len = parents[0].points.length;
            if (len === 0) {
                return;
            }

            bbox[1] += enlarge;
            bbox[3] -= enlarge;

            last = -1;
            while (last < len - 1) {
                // Find the first point with real coordinates on this curve segment
                for (i = last + 1, first = len; i < len; i++) {
                    if (parents[0].points[i].isReal()) {
                        first = i;
                        break;
                    }
                }
                // No real points found -> exit
                if (first >= len) {
                    break;
                }

                // Find the last point with real coordinates on this curve segment
                for (i = first, last = len - 1; i < len - 1; i++) {
                    if (!parents[0].points[i + 1].isReal()) {
                        last = i;
                        break;
                    }
                }

                firstx = parents[0].points[first].usrCoords[1];
                lastx = parents[0].points[last].usrCoords[1];

                // Restrict the plot interval if the function ends inside of the board
                curve_mi = bbox[0] < mi ? mi : bbox[0];
                curve_ma = bbox[2] > ma ? ma : bbox[2];

                // Found NaNs
                curve_mi = first === 0 ? curve_mi : Math.max(curve_mi, firstx);
                curve_ma = last === len - 1 ? curve_ma : Math.min(curve_ma, lastx);

                // First and last relevant x-coordinate of the curve
                curve_mi = first === 0 ? mi : firstx;
                curve_ma = last === len - 1 ? ma : lastx;

                // Copy the curve points
                points = [];

                points.push([1, curve_mi, bbox[infty]]);
                points.push([1, curve_mi, parents[0].points[first].usrCoords[2]]);
                for (i = first; i <= last; i++) {
                    points.push(parents[0].points[i].usrCoords);
                }
                points.push([1, curve_ma, parents[0].points[last].usrCoords[2]]);
                points.push([1, curve_ma, bbox[infty]]);
                points.push(points[0]);

                for (i = 0; i < points.length; i++) {
                    this.dataX.push(points[i][1]);
                    this.dataY.push(points[i][2]);
                }

                if (last < len - 1) {
                    this.dataX.push(NaN);
                    this.dataY.push(NaN);
                }
            }
        };

        // Previous code:
        /**
         * @class
         * @ignore
         */
        a.hasPoint = function () {
            return false;
        };
    } else {
        // Not yet practical?
        f = Type.createFunction(parents[0]);
        a.addParentsFromJCFunctions([f]);

        if (!Type.exists(f)) {
            throw new Error(
                "JSXGraph: Can't create area with the given parents." +
                    "\nPossible parent types: [line], [function]"
            );
        }
    }

    a.addParents(parents[0]);
    return a;
};

JXG.registerElement("arrowparallel", JXG.createArrowParallel);
JXG.registerElement("bisector", JXG.createBisector);
JXG.registerElement("bisectorlines", JXG.createAngularBisectorsOfTwoLines);
JXG.registerElement("msector", JXG.createMsector);
JXG.registerElement("circumcircle", JXG.createCircumcircle);
JXG.registerElement("circumcirclemidpoint", JXG.createCircumcenter);
JXG.registerElement("circumcenter", JXG.createCircumcenter);
JXG.registerElement("incenter", JXG.createIncenter);
JXG.registerElement("incircle", JXG.createIncircle);
JXG.registerElement("integral", JXG.createIntegral);
JXG.registerElement("midpoint", JXG.createMidpoint);
JXG.registerElement("mirrorelement", JXG.createMirrorElement);
JXG.registerElement("mirrorpoint", JXG.createMirrorPoint);
JXG.registerElement("orthogonalprojection", JXG.createOrthogonalProjection);
JXG.registerElement("parallel", JXG.createParallel);
JXG.registerElement("parallelpoint", JXG.createParallelPoint);
JXG.registerElement("perpendicular", JXG.createPerpendicular);
JXG.registerElement("perpendicularpoint", JXG.createPerpendicularPoint);
JXG.registerElement("perpendicularsegment", JXG.createPerpendicularSegment);
JXG.registerElement("reflection", JXG.createReflection);
JXG.registerElement("inequality", JXG.createInequality);

// export default {
//     createArrowParallel: JXG.createArrowParallel,
//     createBisector: JXG.createBisector,
//     createAngularBisectorOfTwoLines: JXG.createAngularBisectorsOfTwoLines,
//     createCircumcircle: JXG.createCircumcircle,
//     createCircumcenter: JXG.createCircumcenter,
//     createIncenter: JXG.createIncenter,
//     createIncircle: JXG.createIncircle,
//     createIntegral: JXG.createIntegral,
//     createMidpoint: JXG.createMidpoint,
//     createMirrorElement: JXG.createMirrorElement,
//     createMirrorPoint: JXG.createMirrorPoint,
//     createNormal: JXG.createNormal,
//     createOrthogonalProjection: JXG.createOrthogonalProjection,
//     createParallel: JXG.createParallel,
//     createParallelPoint: JXG.createParallelPoint,
//     createPerpendicular: JXG.createPerpendicular,
//     createPerpendicularPoint: JXG.createPerpendicularPoint,
//     createPerpendicularSegmen: JXG.createPerpendicularSegment,
//     createReflection: JXG.createReflection,
//     createInequality: JXG.createInequality
// };
