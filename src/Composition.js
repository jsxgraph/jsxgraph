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
 *   <li>{@link Parallel}</li>
 *   <li>{@link Perpendicular}</li>
 *   <li>{@link Perpendicularpoint}</li>
 *   <li>{@link Reflection}</li></ul>
 */

/**
 * @class This is used to construct a perpendicular point.
 * @pseudo
 * @description A perpendicular point is given by a point and a line. It is determined by projecting the given point
 * orthogonal onto the given line.
 * @constructor
 * @name Perpendicularpoint
 * @type JXG.Point
 * @augments JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line_JXG.Point} p,l The constructed point is the orthogonal projection of p onto l.
 * @example
 * var p1 = board.createElement('point', [0.0, 4.0]);
 * var p2 = board.createElement('point', [6.0, 1.0]);
 * var l1 = board.createElement('line', [p1, p2]);
 * var p3 = board.createElement('point', [3.0, 3.0]);
 *
 * var pp1 = board.createElement('perpendicularpoint', [p3, l1]);
 * </pre><div id="ded148c9-3536-44c0-ab81-1bb8fa48f3f4" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ppex1_board = JXG.JSXGraph.initBoard('ded148c9-3536-44c0-ab81-1bb8fa48f3f4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ppex1_p1 = ppex1_board.createElement('point', [0.0, 4.0]);
 *   var ppex1_p2 = ppex1_board.createElement('point', [6.0, 1.0]);
 *   var ppex1_l1 = ppex1_board.createElement('line', [ppex1_p1, ppex1_p2]);
 *   var ppex1_p3 = ppex1_board.createElement('point', [3.0, 3.0]);
 *   var ppex1_pp1 = ppex1_board.createElement('perpendicularpoint', [ppex1_p3, ppex1_l1]);
 * </script><pre>
 */
JXG.createPerpendicularPoint = function(board, parentArr, atts) {
    var l, p, t;

    if(JXG.isPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        p = parentArr[0];
        l = parentArr[1];
    }
    else if(JXG.isPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {
        p = parentArr[1];
        l = parentArr[0];
    }
    else {
        throw new Error("JSXGraph: Can't create perpendicular point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }

    // no need to call createElement, the properties will be set through the createElement('perpendicular') call
    t = JXG.createPoint(board, [function () { return board.algebra.perpendicular(l, p)[0]; }], {fixed: true, name: atts['name'], id: atts['id']});
    p.addChild(t); // notwendig, um auch den Punkt upzudaten
    l.addChild(t);

    t.update();

    t.generatePolynomial = function() {
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

        var a1 = l.point1.symbolic.x;
        var a2 = l.point1.symbolic.y;
        var b1 = l.point2.symbolic.x;
        var b2 = l.point2.symbolic.y;
        var p1 = p.symbolic.x;
        var p2 = p.symbolic.y;
        var t1 = t.symbolic.x;
        var t2 = t.symbolic.y;

        var poly1 = '('+a2+')*('+t1+')-('+a2+')*('+b1+')+('+t2+')*('+b1+')-('+a1+')*('+t2+')+('+a1+')*('+b2+')-('+t1+')*('+b2+')';
        var poly2 = '('+p2+')*('+a2+')-('+p2+')*('+b2+')-('+t2+')*('+a2+')+('+t2+')*('+b2+')+('+p1+')*('+a1+')-('+p1+')*('+b1+')-('+t1+')*('+a1+')+('+t1+')*('+b1+')';

        return [poly1, poly2];
    };

    return t;
};


/**
 * @class This element is used to provide a constructor for a perpendicular.
 * @pseudo
 * @description  A perpendicular is a composition of two elements: a line and a point. The line is orthogonal
 * to a given line and contains a given point and meets the given line in the perpendicular point.
 * @name Perpendicular
 * @constructor
 * @type array
 * @return An array containing two elements: A {@link JXG.Line} object in the first component and a
 * {@link JXG.Point} element in the second component. The line is orthogonal to the given line and meets it
 * in the returned point.
 * @throws {Exception} If the elements cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line_JXG.Point} l,p The perpendicular line will be orthogonal to l and
 * will contain p. The perpendicular point is the intersection point of the two lines.
 * @example
 * // Create a perpendicular
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var l1 = board.createElement('line', [p1, p2]);
 *
 * var p3 = board.createElement('point', [3.0, 3.0]);
 * var perp1 = board.createElement('perpendicular', [l1, p3]);
 * </pre><div id="037a6eb2-781d-4b71-b286-763619a63f22" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var pex1_board = JXG.JSXGraph.initBoard('037a6eb2-781d-4b71-b286-763619a63f22', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var pex1_p1 = pex1_board.createElement('point', [0.0, 2.0]);
 *   var pex1_p2 = pex1_board.createElement('point', [2.0, 1.0]);
 *   var pex1_l1 = pex1_board.createElement('line', [pex1_p1, pex1_p2]);
 *   var pex1_p3 = pex1_board.createElement('point', [3.0, 3.0]);
 *   var pex1_perp1 = pex1_board.createElement('perpendicular', [pex1_l1, pex1_p3]);
 * </script><pre>
 */
JXG.createPerpendicular = function(board, parentArr, atts) {
    var p, l, pd, t;

    parentArr[0] = JXG.getReference(board, parentArr[0]);
    parentArr[1] = JXG.getReference(board, parentArr[1]);

    if(JXG.isPoint(parentArr[0]) && parentArr[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parentArr[1];
        p = parentArr[0];
    }
    else if(JXG.isPoint(parentArr[1]) && parentArr[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parentArr[0];
        p = parentArr[1];
    }
    else {
        throw new Error("JSXGraph: Can't create perpendicular with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }

    if(!JXG.isArray(atts['id'])) {
        atts['id'] = ['',''];
    }
    if(!JXG.isArray(atts['name'])) {
        atts['name'] = ['',''];
    }

    // no need to call createElement, the properties will be set through the createElement('perpendicular') call
    t = JXG.createPerpendicularPoint(board, [l, p], {fixed: true, name: atts['name'][1], id: atts['id'][1], visible: false});
    pd = JXG.createSegment(board, [function () { return (board.algebra.perpendicular(l, p)[1] ? [t, p] : [p, t]); }], {name: atts['name'][0], id: atts['id'][0]});

    return [pd, t];
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
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point} p1,p2 The constructed point will be in the middle of p1 and p2.
 * @param {JXG.Line} l The midpoint will be in the middle of {@link JXG.Line#point1} and {@link JXG.Line#point2} of
 * the given line l.
 * @example
 * // Create base elements: 2 points and 1 line
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var l1 = board.createElement('segment', [[0.0, 3.0], [3.0, 3.0]]);
 *
 * var mp1 = board.createElement('midpoint', [p1, p2]);
 * var mp2 = board.createElement('midpoint', [l1]);
 * </pre><div id="7927ef86-24ae-40cc-afb0-91ff61dd0de7" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var mpex1_board = JXG.JSXGraph.initBoard('7927ef86-24ae-40cc-afb0-91ff61dd0de7', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var mpex1_p1 = mpex1_board.createElement('point', [0.0, 2.0]);
 *   var mpex1_p2 = mpex1_board.createElement('point', [2.0, 1.0]);
 *   var mpex1_l1 = mpex1_board.createElement('segment', [[0.0, 3.0], [3.0, 3.0]]);
 *   var mpex1_mp1 = mpex1_board.createElement('midpoint', [mpex1_p1, mpex1_p2]);
 *   var mpex1_mp2 = mpex1_board.createElement('midpoint', [mpex1_l1]);
 * </script><pre>
 */
JXG.createMidpoint = function(board, parentArr, atts) {
    var a, b, t;
    if(parentArr.length == 2 && JXG.isPoint(parentArr[0]) && JXG.isPoint(parentArr[1])) {
        a = parentArr[0];
        b = parentArr[1];
    }
    else if(parentArr.length == 1 && parentArr[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        a = parentArr[0].point1;
        b = parentArr[0].point2;
    }
    else {
        throw new Error("JSXGraph: Can't create midpoint.");
    }

    if(atts) {
    	atts['fixed'] = true;
    } else {
    	atts = {fixed: true};
    }

    t = board.createElement('point', [function () { return (a.coords.usrCoords[1] + b.coords.usrCoords[1])/2.; },
                                      function () { return (a.coords.usrCoords[2] + b.coords.usrCoords[2])/2.; }], atts);
    a.addChild(t);
    b.addChild(t);

    t.update();

    t.generatePolynomial = function() {
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

        var a1 = a.symbolic.x;
        var a2 = a.symbolic.y;
        var b1 = b.symbolic.x;
        var b2 = b.symbolic.y;
        var t1 = t.symbolic.x;
        var t2 = t.symbolic.y;

        var poly1 = '('+a2+')*('+t1+')-('+a2+')*('+b1+')+('+t2+')*('+b1+')-('+a1+')*('+t2+')+('+a1+')*('+b2+')-('+t1+')*('+b2+')';
        var poly2 = '('+a1+')^2 - 2*('+a1+')*('+t1+')+('+a2+')^2-2*('+a2+')*('+t2+')-('+b1+')^2+2*('+b1+')*('+t1+')-('+b2+')^2+2*('+b2+')*('+t2+')';

        return [poly1, poly2];
    };

    // 2009/10/11, mg:
    // * this is just a test: we're forming three closures in here: One with generatePolynomial and two when we create the
    //   point by using function objects as positions. So a reference to the current Activation object is held in the scope of
    //   those three functions. But we don't need a reference to the atts object in any of them, so we're deleting the
    //   reference to it. Hence, the garbage collector can remove it from memory, if there's no reference to it left.
    // * first test successful: attributes will be set properly. it remains to test, if this helps us to reduce memory usage.
    //   for the test we'll query a JXG attribute "nullAtts" which has to be set to true to null the atts parameter. Then
    //   50,000 midpoints will be created in an example file with resp. without nulling the atts parameter and after that chrome
    //   will be used to compare the memory usage.
    if(JXG.nullAtts)
        atts = null;

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
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 Taking the euclidean vector <tt>v=p2-p1</tt> the parallel point is determined by
 * <tt>p4 = p3+v</tt>
 * @param {JXG.Line_JXG.Point} l,p The resulting point will together with p specify a line which is parallel to l.
 * @example
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var p3 = board.createElement('point', [3.0, 3.0]);
 *
 * var pp1 = board.createElement('parallelpoint', [p1, p2, p3]);
 * </pre><div id="488c4be9-274f-40f0-a469-c5f70abe1f0e" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ppex1_board = JXG.JSXGraph.initBoard('488c4be9-274f-40f0-a469-c5f70abe1f0e', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ppex1_p1 = ppex1_board.createElement('point', [0.0, 2.0]);
 *   var ppex1_p2 = ppex1_board.createElement('point', [2.0, 1.0]);
 *   var ppex1_p3 = ppex1_board.createElement('point', [3.0, 3.0]);
 *   var ppex1_pp1 = ppex1_board.createElement('parallelpoint', [ppex1_p1, ppex1_p2, ppex1_p3]);
 * </script><pre>
 */
JXG.createParallelPoint = function(board, parentArr, atts) {
    var a, b, c, p;

    if(parentArr.length == 3 && parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[2].elementClass == JXG.OBJECT_CLASS_POINT) {
        a = parentArr[0];
        b = parentArr[1];
        c = parentArr[2];
    } else if (parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        c = parentArr[0];
        a = parentArr[1].point1;
        b = parentArr[1].point2;
    } else if (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        c = parentArr[1];
        a = parentArr[0].point1;
        b = parentArr[0].point2;
    }
    else {
        throw new Error("JSXGraph: Can't create parallel point with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");
    }

    p = board.createElement('point', [function () { return c.coords.usrCoords[1] + b.coords.usrCoords[1] - a.coords.usrCoords[1]; }, function () { return c.coords.usrCoords[2] + b.coords.usrCoords[2] - a.coords.usrCoords[2]; }], atts);
//    p1.addChild(p); // required for algorithms requiring dependencies between elements
//    p2.addChild(p);
    c.addChild(p);

    // required to set the coordinates because functions are considered as constraints. hence, the coordinates get set first after an update.
    // can be removed if the above issue is resolved.
    p.update();

    p.generatePolynomial = function() {
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

        var a1 = a.symbolic.x;
        var a2 = a.symbolic.y;
        var b1 = b.symbolic.x;
        var b2 = b.symbolic.y;
        var c1 = c.symbolic.x;
        var c2 = c.symbolic.y;
        var t1 = p.symbolic.x;
        var t2 = p.symbolic.y;

        var poly1 =  '('+b2+')*('+t1+')-('+b2+')*('+c1+')-('+a2+')*('+t1+')+('+a2+')*('+c1+')-('+t2+')*('+b1+')+('+t2+')*('+a1+')+('+c2+')*('+b1+')-('+c2+')*('+a1+')';
        var poly2 =  '('+t2+')*('+a1+')-('+t2+')*('+c1+')-('+b2+')*('+a1+')+('+b2+')*('+c1+')-('+t1+')*('+a2+')+('+t1+')*('+c2+')+('+b1+')*('+a2+')-('+b1+')*('+c2+')';

        return [poly1, poly2];
    };

    return p;
};

/**
 * @class Constructor for a parallel line.
 * @pseudo
 * @description A parallel is a line through a given point with the same slope as a given line.
 * @constructor
 * @name Parallel
 * @type JXG.Line
 * @augments JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line_JXG.Point} l,p The constructed line contains p and has the same slope as l.
 * @example
 * // Create a parallel
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var l1 = board.createElement('line', [p1, p2]);
 *
 * var p3 = board.createElement('point', [3.0, 3.0]);
 * var pl1 = board.createElement('parallel', [l1, p3]);
 * </pre><div id="24e54f9e-5c4e-4afb-9228-0ef27a59d627" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var plex1_board = JXG.JSXGraph.initBoard('24e54f9e-5c4e-4afb-9228-0ef27a59d627', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var plex1_p1 = plex1_board.createElement('point', [0.0, 2.0]);
 *   var plex1_p2 = plex1_board.createElement('point', [2.0, 1.0]);
 *   var plex1_l1 = plex1_board.createElement('line', [plex1_p1, plex1_p2]);
 *   var plex1_p3 = plex1_board.createElement('point', [3.0, 3.0]);
 *   var plex1_pl1 = plex1_board.createElement('parallel', [plex1_l1, plex1_p3]);
 * </script><pre>
 */
JXG.createParallel = function(board, parents, atts) {
    var p, pp, pl, cAtts;

    /* parallel point polynomials are done in createParallelPoint */

    cAtts = {name: null, id: null, fixed: true, visible: false};
    if(JXG.isArray(atts['name']) && atts['name'].length == 2) {
        cAtts['name'] = atts['name'][1];
        atts['name'] = atts['name'][0];
    } else
        cAtts['name'] = atts['name'] + 'p2';
    if(JXG.isArray(atts['id']) && atts['id'].length == 2) {
        cAtts['id'] = atts['id'][1];
        atts['id'] = atts['id'][0];
    } else
        cAtts['id'] = atts['id'] + 'p2';

    if(atts) {
        cAtts = JXG.cloneAndCopy(atts, cAtts);
    }

    try {
        pp = JXG.createParallelPoint(board, parents, cAtts);
    } catch (e) {
        throw new Error("JSXGraph: Can't create parallel with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }

    p = null;
    if(parents.length == 3)
        p = parents[2];
    else if (parents[0].elementClass == JXG.OBJECT_CLASS_POINT)
        p = parents[0];
    else if (parents[1].elementClass == JXG.OBJECT_CLASS_POINT)
        p = parents[1];

    pl = board.createElement('line', [p, pp], atts);

    return pl;
};

/**
 * TODO is this really required? it is the same as 'parallel', except that it doesn't touch the first/lastarrow properties and it returns
 * the parallel point. for now it is set to private. please review the docs-comment before making it public. especially the example section
 * isn't done by now. --michael
 * @private
 * @class Constructs two elements: an arrow and a point.
 * @pseudo
 * @description An arrow parallel is an arrow through a given point with the same slope as another given arrow.
 * @constructor
 * @name Arrowparallel
 * @type JXG.Line
 * @augments JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Arrow_JXG.Point} a,p The constructed arrow contains p and has the same slope as a.
 * @example
 * // Create a parallel
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var l1 = board.createElement('line', [p1, p2]);
 *
 * var p3 = board.createElement('point', [3.0, 3.0]);
 * var pl1 = board.createElement('parallel', [l1, p3]);
 * </pre><div id="qwe" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var plex1_board = JXG.JSXGraph.initBoard('asd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var plex1_p1 = plex1_board.createElement('point', [0.0, 2.0]);
 *   var plex1_p2 = plex1_board.createElement('point', [2.0, 1.0]);
 *   var plex1_l1 = plex1_board.createElement('line', [plex1_p1, plex1_p2]);
 *   var plex1_p3 = plex1_board.createElement('point', [3.0, 3.0]);
 *   var plex1_pl1 = plex1_board.createElement('parallel', [plex1_l1, plex1_p3]);
 * </script><pre>
 */
JXG.createArrowParallel = function(board, parents, atts) {
    var l, cAtts;

    /* parallel arrow point polynomials are done in createParallelPoint */
    try {
        // we don't have to get onto that whole createElement stack here
        // because that'll be run for the line l right after leaving that function.
        l = JXG.createParallel(board, parents, atts);
    } catch (e) {
        throw new Error("JSXGraph: Can't create arrowparallel with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }

    // Select the default behavior. If the user wants something else he would set it in atts.
    // That gets parsed and set right after this function.
    l.setStraight(false, false);
    l.setArrow(false,true);
    return l;
};

/**
 * @class Constructs a normal.
 * @pseudo
 * @description A normal is a line through a given point on a element of type line, circle, curve, or turtle and orthogonal to that object.
 * @constructor
 * @name Normal
 * @type JXG.Line
 * @augments JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line,JXG.Circle,JXG.Curve,JXG.Turtle_JXG.Point} o,p The constructed line contains p which lies on the object and is orthogonal
 * to the tangent to the object in the given point.
 * @param {Glider} p Works like above, however the object is given by {@link Glider#slideObject}.
 * @example
 * // Create a normal to a circle.
 * var p1 = board.createElement('point', [2.0, 2.0]);
 * var p2 = board.createElement('point', [3.0, 2.0]);
 * var c1 = board.createElement('circle', [p1, p2]);
 *
 * var norm1 = board.createElement('normal', [c1, p2]);
 * </pre><div id="4154753d-3d29-40fb-a860-0b08aa4f3743" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var nlex1_board = JXG.JSXGraph.initBoard('4154753d-3d29-40fb-a860-0b08aa4f3743', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var nlex1_p1 = nlex1_board.createElement('point', [2.0, 2.0]);
 *   var nlex1_p2 = nlex1_board.createElement('point', [3.0, 2.0]);
 *   var nlex1_c1 = nlex1_board.createElement('circle', [nlex1_p1, nlex1_p2]);
 *
 *   // var nlex1_p3 = nlex1_board.createElement('point', [1.0, 2.0]);
 *   var nlex1_norm1 = nlex1_board.createElement('normal', [nlex1_c1, nlex1_p2]);
 * </script><pre>
 */
JXG.createNormal = function(board, parents, attributes) {
    /* TODO normal polynomials */
    var p;
    var c;
    if (parents.length==1) { // One arguments: glider on line, circle or curve
        p = parents[0];
        c = p.slideObject;
    } else if (parents.length==2) { // Two arguments: (point,line), (point,circle), (line,point) or (circle,point)
        if (JXG.isPoint(parents[0])) {
            p = parents[0];
            c = parents[1];
        } else if (JXG.isPoint(parents[1])) {
            c = parents[0];
            p = parents[1];
        } else {
            throw new Error("JSXGraph: Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
        }
    } else {
        throw new Error("JSXGraph: Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }

    if(c.elementClass==JXG.OBJECT_CLASS_LINE) {
        // return board.addNormal(c,p, attributes['id'], attributes['name']); // GEONExT-Style: problems with ideal point
        // If not needed, then board.addNormal and maybe board.algebra.perpendicular can be removed.

        // Homogeneous version:
        // orthogonal(l,p) = (F^\delta\cdot l)\times p
        return board.createElement('line', [
                    function(){ return c.stdform[1]*p.Y()-c.stdform[2]*p.X();},
                    function(){ return c.stdform[2]*p.Z();},
                    function(){ return -c.stdform[1]*p.Z();}
                    ], attributes );
    }
    else if(c.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
        /*
        var Dg = function(t){ return -c.getRadius()*Math.sin(t); };
        var Df = function(t){ return c.getRadius()*Math.cos(t); };
        return board.createElement('line', [
                    function(){ return -p.X()*Dg(p.position)-p.Y()*Df(p.position);},
                    function(){ return Dg(p.position);},
                    function(){ return Df(p.position);}
                    ], attributes );
        */
        return board.createElement('line', [c.midpoint,p], attributes);
    } else if (c.elementClass == JXG.OBJECT_CLASS_CURVE) {
        if (c.curveType!='plot') {
            var g = c.X;
            var f = c.Y;
            return board.createElement('line', [
                    function(){ return -p.X()*board.D(g)(p.position)-p.Y()*board.D(f)(p.position);},
                    function(){ return board.D(g)(p.position);},
                    function(){ return board.D(f)(p.position);}
                    ], attributes );
        } else {                         // curveType 'plot'
            return board.createElement('line', [
                    function(){ var i=Math.floor(p.position);
                                var lbda = p.position-i;
                                if (i==c.numberPoints-1) {i--; lbda=1; }
                                if (i<0) return 1.0;
                                return (c.Y(i)+lbda*(c.Y(i+1)-c.Y(i)))*(c.Y(i)-c.Y(i+1))-(c.X(i)+lbda*(c.X(i+1)-c.X(i)))*(c.X(i+1)-c.X(i));},
                    function(){ var i=Math.floor(p.position);
                                if (i==c.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return c.X(i+1)-c.X(i);},
                    function(){ var i=Math.floor(p.position);
                                if (i==c.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return c.Y(i+1)-c.Y(i);}
                    ], attributes );
        }
    } else if (c.type == JXG.OBJECT_TYPE_TURTLE) {
            return board.createElement('line', [
                    function(){ var i=Math.floor(p.position);
                                var lbda = p.position-i;
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) { i--; lbda=1.0; }
                                if (i<0) return 1.0;
                                return (el.Y(i)+lbda*(el.Y(i+1)-el.Y(i)))*(el.Y(i)-el.Y(i+1))-(el.X(i)+lbda*(el.X(i+1)-el.X(i)))*(el.X(i+1)-el.X(i));},
                    function(){ var i=Math.floor(p.position);
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return el.X(i+1)-el.X(i);},
                    function(){ var i=Math.floor(p.position);
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return el.Y(i+1)-el.Y(i);}
                    ], attributes );
    }
    else {
        throw new Error("JSXGraph: Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }
};

/**
 * @class Provides a constructor for an angle bisector.
 * @pseudo
 * @description A bisector is a line which divides an angle into two equal angles. It is given by three points A, B, and C and divides the angle ABC into two
 * equal sized parts.
 * @constructor
 * @name Bisector
 * @type JXG.Line
 * @augments JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The angle described by p3 will be divided into two equal angles.
 * @example
 * // Create a normal to a circle.
 * var p1 = board.createElement('point', [6.0, 4.0]);
 * var p2 = board.createElement('point', [3.0, 2.0]);
 * var p3 = board.createElement('point', [1.0, 7.0]);
 *
 * var bi1 = board.createElement('bisector', [p1, p2, p3]);
 * </pre><div id="0d58cea8-b06a-407c-b27c-0908f508f5a4" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var biex1_board = JXG.JSXGraph.initBoard('0d58cea8-b06a-407c-b27c-0908f508f5a4', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var biex1_p1 = biex1_board.createElement('point', [6.0, 4.0]);
 *   var biex1_p2 = biex1_board.createElement('point', [3.0, 2.0]);
 *   var biex1_p3 = biex1_board.createElement('point', [1.0, 7.0]);
 *   var biex1_bi1 = biex1_board.createElement('bisector', [biex1_p1, biex1_p2, biex1_p3]);
 * </script><pre>
 */
JXG.createBisector = function(board, parentArr, atts) {
    var p, l, cAtts, i;
    /* TODO bisector polynomials */
    if(parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[2].elementClass == JXG.OBJECT_CLASS_POINT) {

        cAtts = {name: null, id: null, fixed: true, visible: false};
        if(atts) {
            cAtts = JXG.cloneAndCopy(atts, cAtts);
        }

        // hidden and fixed helper
        p = board.createElement('point', [function () { return board.algebra.angleBisector(parentArr[0], parentArr[1], parentArr[2]); }], cAtts);

        for(i=0; i<3; i++)
            parentArr[i].addChild(p); // required for algorithm requiring dependencies between elements

        if(typeof atts['straightFirst'] == 'undefined')
            atts['straightFirst'] = false;
        if(typeof atts['straightLast'] == 'undefined')
            atts['straightLast'] = true;
        // no need to fire up the createElement stack because only attributes need to be set and they
        // will be set for l after returning.
        l = JXG.createLine(board, [parentArr[1], p], atts);
        return l;
    }
    else {
        throw new Error("JSXGraph: Can't create angle bisector with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }
};

/**
 * TODO Is it possible to merge this with createBisector? --michael
 * The angular bisectors of two line [c1,a1,b1] and [c2,a2,b2] are determined by the equation:
 * (a1*x+b1*y+c1*z)/sqrt(a1^2+b1^2) = +/- (a2*x+b2*y+c2*z)/sqrt(a2^2+b2^2)
 * @private
 */
JXG.createAngularBisectorsOfTwoLines = function(board, parents, attributes) {
    var l1 = JXG.getReference(board,parents[0]);
    var l2 = JXG.getReference(board,parents[1]);
    var id1 = '';
    var id2 = '';
    var n1 = '';
    var n2 = '';
    if (attributes==null) attributes = {};
    if (attributes['id']!=null) {
        if (JXG.isArray(attributes['id'])) {
            id1 = attributes['id'][0];
            id2 = attributes['id'][1];
        } else {
            id1 = attributes['id'];
            id2 = attributes['id'];
        }
    }
    if (attributes['name']!=null) {
        if (JXG.isArray(attributes['name'])) {
            n1 = attributes['name'][0];
            n2 = attributes['name'][1];
        } else {
            n1 = attributes['name'];
            n2 = attributes['name'];
        }
    }

    attributes['id'] = id1;
    attributes['name'] = n1;
    var g1 = board.createElement('line',[
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[0]/d1-l2.stdform[0]/d2;
        },
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[1]/d1-l2.stdform[1]/d2;
        },
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[2]/d1-l2.stdform[2]/d2;
        },
    ], attributes);
    attributes['id'] = id2;
    attributes['name'] = n2;
    var g2 = board.createElement('line',[
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[0]/d1+l2.stdform[0]/d2;
        },
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[1]/d1+l2.stdform[1]/d2;
        },
        function(){
            var d1 = Math.sqrt(l1.stdform[1]*l1.stdform[1]+l1.stdform[2]*l1.stdform[2]);
            var d2 = Math.sqrt(l2.stdform[1]*l2.stdform[1]+l2.stdform[2]*l2.stdform[2]);
            return l1.stdform[2]/d1+l2.stdform[2]/d2;
        },
    ], attributes);
    return [g1,g2];
};

/**
 * @class Constructs the midpoint of a {@link Circumcircle}. Like the circumcircle the circumcirclemidpoint
 * is constructed by providing three points.
 * @pseudo
 * @description A circumcircle midpoint is given by three points which are all lying on the circle with the
 * constructed circumcircle midpoint as the midpoint.
 * @constructor
 * @name Circumcirclemidpoint
 * @type JXG.Point
 * @augments JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed point is the midpoint of the circle determined
 * by p1, p2, and p3.
 * @example
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var p3 = board.createElement('point', [3.0, 3.0]);
 *
 * var cc1 = board.createElement('circumcirclemidpoint', [p1, p2, p3]);
 * </pre><div id="e8a40f95-bf30-4eb4-88a8-f4d5495261fd" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ccmex1_board = JXG.JSXGraph.initBoard('e8a40f95-bf30-4eb4-88a8-f4d5495261fd', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ccmex1_p1 = ccmex1_board.createElement('point', [0.0, 2.0]);
 *   var ccmex1_p2 = ccmex1_board.createElement('point', [6.0, 1.0]);
 *   var ccmex1_p3 = ccmex1_board.createElement('point', [3.0, 7.0]);
 *   var ccmex1_cc1 = ccmex1_board.createElement('circumcirclemidpoint', [ccmex1_p1, ccmex1_p2, ccmex1_p3]);
 * </script><pre>
 */
JXG.createCircumcircleMidpoint = function(board, parentArr, atts) {
    var p, i;

    /* TODO circumcircle polynomials */

    if(parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[2].elementClass == JXG.OBJECT_CLASS_POINT) {
        atts['fixed'] = atts['fixed'] || true;
        p = JXG.createPoint(board, [function () { return board.algebra.circumcenterMidpoint(parentArr[0], parentArr[1], parentArr[2]); }], atts);

        for(i=0; i<3; i++)
            parentArr[i].addChild(p);

        return p;
    }
    else {
        throw new Error("JSXGraph: Can't create circumcircle midpoint with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");
    }
};

/**
 * @class Constructs two elements: a point and a circle. The circle is given by three points which lie on the circle,
 * the point is the midpoint of the circle.
 * @pseudo
 * @description A circumcircle is given by three points which are all lying on the circle.
 * @constructor
 * @name Circumcircle
 * @type array
 * @returns An array containing the midpoint in the first component and the circumcircle in the second component.
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The constructed point is the midpoint of the circle determined
 * by p1, p2, and p3.
 * @example
 * var p1 = board.createElement('point', [0.0, 2.0]);
 * var p2 = board.createElement('point', [2.0, 1.0]);
 * var p3 = board.createElement('point', [3.0, 3.0]);
 *
 * var cc1 = board.createElement('circumcircle', [p1, p2, p3]);
 * </pre><div id="e65c9861-0bf0-402d-af57-3ab11962f5ac" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var ccex1_board = JXG.JSXGraph.initBoard('e65c9861-0bf0-402d-af57-3ab11962f5ac', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var ccex1_p1 = ccex1_board.createElement('point', [0.0, 2.0]);
 *   var ccex1_p2 = ccex1_board.createElement('point', [6.0, 1.0]);
 *   var ccex1_p3 = ccex1_board.createElement('point', [3.0, 7.0]);
 *   var ccex1_cc1 = ccex1_board.createElement('circumcircle', [ccex1_p1, ccex1_p2, ccex1_p3]);
 * </script><pre>
 */
JXG.createCircumcircle = function(board, parentArr, atts) {
    var p, c, cAtts;

    cAtts = JXG.clone(atts);
    if(atts['name'] && JXG.isArray(atts['name'])) {
        cAtts['name'] = atts['name'][0];
        atts['name'] = atts['name'][1];
    }
    if(atts['id'] && JXG.isArray(atts['id'])) {
        cAtts['id'] = atts['id'][0];
        atts['id'] = atts['id'][1];
    }

    try {
        p = JXG.createCircumcircleMidpoint(board, parentArr, cAtts);
        c = JXG.createCircle(board, [p, parentArr[0]], atts);
    } catch(e) {
        throw new Error("JSXGraph: Can't create circumcircle with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");
    }

    return [p, c];
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
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Line} p,l The reflection point is the reflection of p against l.
 * @example
 * var p1 = board.createElement('point', [0.0, 4.0]);
 * var p2 = board.createElement('point', [6.0, 1.0]);
 * var l1 = board.createElement('line', [p1, p2]);
 * var p3 = board.createElement('point', [3.0, 3.0]);
 *
 * var rp1 = board.createElement('reflection', [p3, l1]);
 * </pre><div id="087a798e-a36a-4f52-a2b4-29a23a69393b" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var rpex1_board = JXG.JSXGraph.initBoard('087a798e-a36a-4f52-a2b4-29a23a69393b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var rpex1_p1 = rpex1_board.createElement('point', [0.0, 4.0]);
 *   var rpex1_p2 = rpex1_board.createElement('point', [6.0, 1.0]);
 *   var rpex1_l1 = rpex1_board.createElement('line', [rpex1_p1, rpex1_p2]);
 *   var rpex1_p3 = rpex1_board.createElement('point', [3.0, 3.0]);
 *   var rpex1_rp1 = rpex1_board.createElement('reflection', [rpex1_p3, rpex1_l1]);
 * </script><pre>
 */
JXG.createReflection = function(board, parentArr, atts) {
    var l, p, r;

    /* TODO reflection polynomials */
    if(parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parentArr[0];
        l = parentArr[1];
    }
    else if(parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT && parentArr[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parentArr[1];
        l = parentArr[0];
    }
    else {
        throw new Error("JSXGraph: Can't create reflection point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }

    // force a fixed point
    atts['fixed'] = true;
    r = JXG.createPoint(board, [function () { return board.algebra.reflection(l, p); }], atts);
    p.addChild(r);
    l.addChild(r);

    r.update();

    return r;
};

// here we have to continue with replacing board.add* stuff

/**
 * @class A mirror point will be constructed.
 * @pseudo
 * @description A mirror point is determined by the reflection of a given point against another given point.
 * @constructor
 * @name Mirrorpoint
 * @type JXG.Point
 * @augments JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point} p1,p2 The constructed point is the reflection of p2 against p1.
 * @example
 * var p1 = board.createElement('point', [3.0, 3.0]);
 * var p2 = board.createElement('point', [6.0, 1.0]);
 *
 * var mp1 = board.createElement('mirrorpoint', [p1, p2]);
 * </pre><div id="7eb2a814-6c4b-4caa-8cfa-4183a948d25b" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var mpex1_board = JXG.JSXGraph.initBoard('7eb2a814-6c4b-4caa-8cfa-4183a948d25b', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var mpex1_p1 = mpex1_board.createElement('point', [3.0, 3.0]);
 *   var mpex1_p2 = mpex1_board.createElement('point', [6.0, 1.0]);
 *   var mpex1_mp1 = mpex1_board.createElement('mirrorpoint', [mpex1_p1, mpex1_p2]);
 * </script><pre>
 */
JXG.createMirrorPoint = function(board, parentArr, atts) {
    var p;

    /* TODO mirror polynomials */
    if(JXG.isPoint(parentArr[0]) && JXG.isPoint(parentArr[1])) {
        atts['fixed'] = atts['fixed'] || true;
        p = JXG.createPoint(board, [function () { return board.algebra.rotation(parentArr[0], parentArr[1], Math.PI); }], atts);

        for(i=0; i<2; i++)
            parentArr[i].addChild(p);
    }
    else {
        throw new Error("JSXGraph: Can't create mirror point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }

    p.update();

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
 * @type JXG.Polygon
 * @augments JXG.Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {array_JXG.Curve} p,l The constructed point is the orthogonal projection of p onto l.
 * @example
 * var c1 = board.createElement('functiongraph', [function (t) { return t*t*t; }]);
 * var i1 = board.createElement('integral', [[-1.0, 4.0], c1]);
 * </pre><div id="d45d7188-6624-4d6e-bebb-1efa2a305c8a" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var intex1_board = JXG.JSXGraph.initBoard('d45d7188-6624-4d6e-bebb-1efa2a305c8a', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
 *   var intex1_c1 = intex1_board.createElement('functiongraph', [function (t) { return t*t*t; }]);
 *   var intex1_i1 = intex1_board.createElement('integral', [[-2.0, 2.0], intex1_c1]);
 * </script><pre>
 */
JXG.createIntegral = function(board, parentArr, atts) {
    if(!JXG.isArray(atts['id']) || (atts['id'].length != 5)) {
        atts['id'] = ['','','','',''];
    }
    if(!JXG.isArray(atts['name']) || (atts['name'].length != 5)) {
       atts['name'] = ['','','','',''];
    }

    if(JXG.isArray(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_CURVE) {
        return board.addIntegral(parentArr[0], parentArr[1], atts['id'], atts['name'], atts);
    } else if(JXG.isArray(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_CURVE) {
        return board.addIntegral(parentArr[1], parentArr[0], atts['id'], atts['name'], atts);
    } else {
        throw new Error("JSXGraph: Can't create integral with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    }
};

/**
 * @class This element is used to visualize the locus of a given dependent point.
 * @pseudo
 * @description The locus element is used to visualize the curve a given point describes.
 * @constructor
 * @name Locus
 * @type JXG.Curve
 * @augments JXG.Curve
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point} p The constructed curve is the geometric locus of the given point.
 * @example
 *  // This examples needs JXG.Server up and running, otherwise it won't work.
 *  p1 = board.createElement('point', [0, 0]);
 *  p2 = board.createElement('point', [6, -1]);
 *  c1 = board.createElement('circle', [p1, 2]);
 *  c2 = board.createElement('circle', [p2, 1.5]);
 *  g1 = board.createElement('glider', [6, 3, c1]);
 *  c3 = board.createElement('circle', [g1, 4]);
 *  g2 = board.createElement('intersection', [c2,c3,0]);
 *  m1 = board.createElement('midpoint', [g1,g2]);
 *  loc = board.createElement('locus', [m1], {strokeColor: 'red'});
 * </pre><div id="d45d7188-6624-4d6e-bebb-1efa2a305c8a" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  lcex_board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox:[-4, 6, 10, -6], axis: true, grid: false, keepaspectratio: true});
 *  lcex_p1 = lcex_board.createElement('point', [0, 0]);
 *  lcex_p2 = lcex_board.createElement('point', [6, -1]);
 *  lcex_c1 = lcex_board.createElement('circle', [lcex_p1, 2]);
 *  lcex_c2 = lcex_board.createElement('circle', [lcex_p2, 1.5]);
 *  lcex_g1 = lcex_board.createElement('glider', [6, 3, lcex_c1]);
 *  lcex_c3 = lcex_board.createElement('circle', [lcex_g1, 4]);
 *  lcex_g2 = lcex_board.createElement('intersection', [lcex_c2,lcex_c3,0]);
 *  lcex_m1 = lcex_board.createElement('midpoint', [lcex_g1,lcex_g2]);
 *  lcex_loc = board.createElement('locus', [lcex_m1], {strokeColor: 'red'});
 * </script><pre>
 */
JXG.createLocus = function(board, parents, attributes) {
    var c, p;

    if(JXG.isArray(parents) && parents.length == 1 && parents[0].elementClass == JXG.OBJECT_CLASS_POINT) {
        p = parents[0];
    } else {
        throw new Error("JSXGraph: Can't create locus with parent of type other than point.");
    }

    c = board.createElement('curve', [[null], [null]], attributes);
    c.dontCallServer = false;

    c.updateDataArray = function () {
        cb = function(x, y, eq) {
            c.dataX = x;
            c.dataY = y;
            board.update();
        };

        if(board.mode == board.BOARD_MODE_NONE && !this.dontCallServer) {
            JXG.Math.Symbolic.geometricLocusByGroebnerBase(board, p, cb);
            // don't bother the server on the next update, because it's fired
            // to plot the datapoints received by the server.
            this.dontCallServer = true;
        } else {
            this.dontCallServer = false;
        }
    };
    return c;
};

JXG.JSXGraph.registerElement('arrowparallel', JXG.createArrowParallel);
JXG.JSXGraph.registerElement('bisector', JXG.createBisector);
JXG.JSXGraph.registerElement('bisectorlines', JXG.createAngularBisectorsOfTwoLines);
JXG.JSXGraph.registerElement('circumcircle', JXG.createCircumcircle);
JXG.JSXGraph.registerElement('circumcirclemidpoint', JXG.createCircumcircleMidpoint);
JXG.JSXGraph.registerElement('integral', JXG.createIntegral);
JXG.JSXGraph.registerElement('midpoint', JXG.createMidpoint);
JXG.JSXGraph.registerElement('mirrorpoint', JXG.createMirrorPoint);
JXG.JSXGraph.registerElement('normal', JXG.createNormal);
JXG.JSXGraph.registerElement('parallel', JXG.createParallel);
JXG.JSXGraph.registerElement('parallelpoint', JXG.createParallelPoint);
JXG.JSXGraph.registerElement('perpendicular', JXG.createPerpendicular);
JXG.JSXGraph.registerElement('perpendicularpoint', JXG.createPerpendicularPoint);
JXG.JSXGraph.registerElement('reflection', JXG.createReflection);
JXG.JSXGraph.registerElement('locus', JXG.createLocus);
