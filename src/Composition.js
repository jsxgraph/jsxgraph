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
 *   <li>{@link Orthogonalprojection}</li>
 *   <li>{@link Parallel}</li>
 *   <li>{@link Perpendicular}</li>
 *   <li>{@link Perpendicularpoint}</li>
 *   <li>{@link Perpendicularsegment}</li>
 *   <li>{@link Reflection}</li></ul>
 */


/**
 * A composition is a simple container that manages none or more {@link JXG.GeometryElement}s.
 * @param {Object} elements A list of elements with a descriptive name for the element as the key and a reference
 * to the element as the value of every list entry. The name is used to access the element later on.
 * @example
 * var p1 = board.create('point', [1, 2]),
 *     p2 = board.create('point', [2, 3]),
 *     c = new JXG.Composition({
 *         start: p1,
 *         end: p2
 *     });
 *
 * // moves p1 to [3, 3]
 * c.start.moveTo([3, 3]);
 * @class JXG.Composition
 */
JXG.Composition = function (elements) {
    var genericMethods = [
            /**
             * Invokes setProperty for every stored element with a setProperty method and hands over the given arguments.
             * See {@link JXG.GeometryElement#setProperty} for further description, valid parameters and return values.
             * @name setProperty
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'setProperty',

            /**
             * Invokes prepareUpdate for every stored element with a prepareUpdate method and hands over the given arguments.
             * See {@link JXG.GeometryElement#prepareUpdate} for further description, valid parameters and return values.
             * @name prepareUpdate
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'prepareUpdate',

            /**
             * Invokes updateRenderer for every stored element with a updateRenderer method and hands over the given arguments.
             * See {@link JXG.GeometryElement#updateRenderer} for further description, valid parameters and return values.
             * @name updateRenderer
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'updateRenderer',

            /**
             * Invokes update for every stored element with a update method and hands over the given arguments.
             * See {@link JXG.GeometryElement#update} for further description, valid parameters and return values.
             * @name update
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'update',

            /**
             * Invokes highlight for every stored element with a highlight method and hands over the given arguments.
             * See {@link JXG.GeometryElement#highlight} for further description, valid parameters and return values.
             * @name highlight
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'highlight',

            /**
             * Invokes noHighlight for every stored element with a noHighlight method and hands over the given arguments.
             * See {@link JXG.GeometryElement#noHighlight} for further description, valid parameters and return values.
             * @name noHighlight
             * @memberOf JXG.Composition.prototype
             * @function
             */
            'noHighlight'
        ],
        generateMethod = function (what) {
            return function () {
                var i;

                for (i in that.elements) {
                    if (JXG.exists(that.elements[i][what])) {
                        that.elements[i][what].apply(that.elements[i], arguments);
                    }
                }
                return that;
            };
        },
        that = this,
        e;

    for (e = 0; e < genericMethods.length; e++) {
        this[genericMethods[e]] = generateMethod(genericMethods[e]);
    }

    this.elements = {};
    for (e in elements) {
        if (elements.hasOwnProperty(e)) {
            this.add(e, elements[e]);
        }
    }

    this.dump = true;
    this.subs = {};
};

JXG.extend(JXG.Composition.prototype, /** @lends JXG.Composition.prototype */ {

    /**
     * Adds an element to the composition container.
     * @param {String} what Descriptive name for the element, e.g. <em>startpoint</em> or <em>area</em>. This is used to
     * access the element later on. There are some reserved names: <em>elements, add, remove, update, prepareUpdate,
     * updateRenderer, highlight, noHighlight</em>, and all names that would form invalid object property names in
     * JavaScript.
     * @param {JXG.GeometryElement|JXG.Composition} element A reference to the element that is to be added. This can be
     * another composition, too.
     * @returns {Boolean} True, if the element was added successfully. Reasons why adding the element failed include
     * using a reserved name and providing an invalid element.
     */
    add: function (what, element) {
        if (!JXG.exists(this[what]) && JXG.exists(element)) {
            if (JXG.exists(element.id)) {
                this.elements[element.id] = element;
            } else {
                this.elements[what] = element;
            }
            this[what] = element;

            return true
        }

        return false;
    },

    /**
     * Remove an element from the composition container.
     * @param {String} what The name used to access the element.
     * @returns {Boolean} True, if the element has been removed successfully.
     */
    remove: function (what) {
        var found = false,
            e;

        for (e in this.elements) {
            if (this.elements[e].id === this[what].id) {
                found = true;
                break;
            }
        }

        if (found) {
            delete this.elements[this[what].id];
            delete this[what];
        }

        return found;
    },

    getParents: function () {
        return this.parents;
    },

    getType: function () {
        return this.elType;
    },

    getAttributes: function () {
        var attr = {},
            e;

        for (e in this.subs) {
            attr[e] = this.subs[e].visProp;
        }
        
        return this.attr;
    }
});

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
JXG.createOrthogonalProjection = function(board, parents, attributes) {
    var l, p, t;

    if(JXG.isPoint(parents[0]) && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[0];
        l = parents[1];
    }
    else if(JXG.isPoint(parents[1]) && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[1];
        l = parents[0];
    }
    else {
        throw new Error("JSXGraph: Can't create perpendicular point with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [point,line]");
    }

    t = board.create('point', [function () { return JXG.Math.Geometry.projectPointToLine(p, l, board); }], attributes);
    t.type = JXG.OBJECT_TYPE_OPROJECT;
    p.addChild(t); 
    l.addChild(t);

    t.elType = 'orthogonalprojection';
    t.parents = [p.id, t.id];

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
JXG.createPerpendicular = function(board, parents, attributes) {
    var p, l, pd, attr;

    parents[0] = JXG.getReference(board, parents[0]);
    parents[1] = JXG.getReference(board, parents[1]);

    if(JXG.isPoint(parents[0]) && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parents[1];
        p = parents[0];
    }
    else if(JXG.isPoint(parents[1]) && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parents[0];
        p = parents[1];
    } else {
        throw new Error("JSXGraph: Can't create perpendicular with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [line,point]");
    }

    attr = JXG.copyAttributes(attributes, board.options, 'perpendicular');
    pd = JXG.createLine(board, [
                    function(){ return  l.stdform[2]*p.X()-l.stdform[1]*p.Y();}, 
                    function(){ return -l.stdform[2]*p.Z();}, 
                    function(){ return  l.stdform[1]*p.Z();}
                ], 
                attr);

    pd.elType = 'perpendicular';
    pd.parents = [l.id, p.id];

    return pd;
};

/**
 * @class This is used to construct a perpendicular point.
 * @pseudo
 * @description A perpendicular point is given by a point and a line. It is determined by projecting the given point
 * orthogonal onto the given line. This used in GEONExTReader only. All other applications should use
 * orthogonal projection.
 * @constructor
 * @name Perpendicularpoint
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
JXG.createPerpendicularPoint = function(board, parents, attributes) {
    var l, p, t;

    if(JXG.isPoint(parents[0]) && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[0];
        l = parents[1];
    }
    else if(JXG.isPoint(parents[1]) && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[1];
        l = parents[0];
    }
    else {
        throw new Error("JSXGraph: Can't create perpendicular point with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [point,line]");
    }

    t = board.create('point', [function () { return JXG.Math.Geometry.perpendicular(l, p, board)[0]; }], attributes);
    p.addChild(t); 
    l.addChild(t);

    t.elType = 'perpendicularpoint';
    t.parents = [p.id, l.id];

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
 * @class This element is used to provide a constructor for a perpendicular segment.
 * @pseudo
 * @description  A perpendicular is a composition of two elements: a line segment and a point. The line segment is orthogonal
 * to a given line and contains a given point and meets the given line in the perpendicular point.
 * @name Perpendicular
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
JXG.createPerpendicularSegment = function(board, parents, attributes) {
    var p, l, pd, t, attr;

    parents[0] = JXG.getReference(board, parents[0]);
    parents[1] = JXG.getReference(board, parents[1]);

    if(JXG.isPoint(parents[0]) && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parents[1];
        p = parents[0];
    }
    else if(JXG.isPoint(parents[1]) && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        l = parents[0];
        p = parents[1];
    } else {
        throw new Error("JSXGraph: Can't create perpendicular with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [line,point]");
    }
    attr = JXG.copyAttributes(attributes, board.options, 'perpendicularsegment', 'point');
    t = JXG.createPerpendicularPoint(board, [l, p], attr);

    t.dump = false;

    if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.line;
    attr = JXG.copyAttributes(attributes, board.options, 'perpendicularsegment');
    pd = JXG.createLine(board, [function () { return (JXG.Math.Geometry.perpendicular(l, p, board)[1] ? [t, p] : [p, t]); }], attr);

    pd.elType = 'perpendicularsegment';
    pd.parents = [p.id, l.id];
    pd.subs = {
        point: t
    };

    /**
     * Helper point created to create the perpendicular segment.
     * @memberOf Perpendicular.prototype
     * @name perpendicularpoint
     * @type Perpendicularpoint
     */
    pd.perpendicularpoint = t;

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
JXG.createMidpoint = function(board, parents, attributes) {
    var a, b, t;

    if(parents.length == 2 && JXG.isPoint(parents[0]) && JXG.isPoint(parents[1])) {
        a = parents[0];
        b = parents[1];
    }
    else if(parents.length == 1 && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        a = parents[0].point1;
        b = parents[0].point2;
    }
    else {
        throw new Error("JSXGraph: Can't create midpoint." +
                        "\nPossible parent types: [point,point], [line]");
    }

    t = board.create('point', [
                               function () {
                                var x = a.coords.usrCoords[1] + b.coords.usrCoords[1]; 
                                if (isNaN(x) || Math.abs(a.coords.usrCoords[0])<JXG.Math.eps || Math.abs(b.coords.usrCoords[0])<JXG.Math.eps) {
                                    return NaN;
                                } else {
                                    return x*0.5; 
                                }
                               },
                               function () { 
                                var y = a.coords.usrCoords[2] + b.coords.usrCoords[2]; 
                                if (isNaN(y) || Math.abs(a.coords.usrCoords[0])<JXG.Math.eps || Math.abs(b.coords.usrCoords[0])<JXG.Math.eps) {
                                    return NaN;
                                } else {
                                    return y*0.5; 
                                }
                              }], attributes);
    a.addChild(t);
    b.addChild(t);

    t.elType = 'midpoint';
    t.parents = [a.id, b.id];

    t.prepareUpdate().update();

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
JXG.createParallelPoint = function(board, parents, attributes) {
    var a, b, c, p;

    if(parents.length == 3 && parents[0].elementClass == JXG.OBJECT_CLASS_POINT && parents[1].elementClass == JXG.OBJECT_CLASS_POINT && parents[2].elementClass == JXG.OBJECT_CLASS_POINT) {
        a = parents[0];
        b = parents[1];
        c = parents[2];
    } else if (parents[0].elementClass == JXG.OBJECT_CLASS_POINT && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        c = parents[0];
        a = parents[1].point1;
        b = parents[1].point2;
    } else if (parents[1].elementClass == JXG.OBJECT_CLASS_POINT && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        c = parents[1];
        a = parents[0].point1;
        b = parents[0].point2;
    }
    else {
        throw new Error("JSXGraph: Can't create parallel point with parent types '" +
                        (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                        "\nPossible parent types: [line,point], [point,point,point]");
    }

    p = board.create('point', [function () { return c.coords.usrCoords[1] + b.coords.usrCoords[1] - a.coords.usrCoords[1]; }, 
                               function () { return c.coords.usrCoords[2] + b.coords.usrCoords[2] - a.coords.usrCoords[2]; }], 
                               attributes);
	// required for algorithms requiring dependencies between elements
	a.addChild(p);
	b.addChild(p);
    c.addChild(p);

    p.elType = 'parallelpoint';
    p.parents = [a.id, b.id, c.id];

    // required to set the coordinates because functions are considered as constraints. hence, the coordinates get set first after an update.
    // can be removed if the above issue is resolved.
    p.prepareUpdate().update();

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
JXG.createParallel = function(board, parents, attributes) {
    var p, pp, pl, li, attr;

    /* parallel point polynomials are done in createParallelPoint */
    /*
    try {
        attr = JXG.copyAttributes(attributes, board.options, 'parallel', 'point');
        pp = JXG.createParallelPoint(board, parents, attr);     // non-visible point
    } catch (e) {
        throw new Error("JSXGraph: Can't create parallel with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [line,point], [point,point,point]");
    }
    */
    
    p = null;
    if(parents.length == 3) {
        // Parallel to line through parents[0] and parents[1]
        p = parents[2];
        li = function() { return JXG.Math.crossProduct(parents[0].coords.usrCoords, parents[1].coords.usrCoords) };

        pp = [parents[0].id, parents[1].id, p.id];
    } else if (parents[0].elementClass == JXG.OBJECT_CLASS_POINT) {
        // Parallel to line parents[1]
        p = parents[0];
        li = function() { return parents[1].stdform; };
        pp = [parents[1].id, p.id];
    } else if (parents[1].elementClass == JXG.OBJECT_CLASS_POINT) {
        // Parallel to line parents[0]
        p = parents[1];
        li = function() { return parents[0].stdform; };
        pp = [parents[0].id, p.id];
    }

    if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.line;
    attr = JXG.copyAttributes(attributes, board.options, 'parallel');
    //pl = board.create('line', [p, pp], attr);
    pl = board.create('line', [function() {
            var l = li();
            return [ -(p.X()*l[1]+p.Y()*l[2]), p.Z()*l[1], p.Z()*l[2]];
        }], attr);

    pl.elType = 'parallel';
    pl.parents = pp;

    /**
     * Helper point used to create the parallel line.
     * @memberOf Parallel.prototype
     * @name parallelpoint
     * @type Parallelpoint
     */
    // pl.parallelpoint = pp;

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
JXG.createArrowParallel = function(board, parents, attributes) {
    var p;

    /* parallel arrow point polynomials are done in createParallelPoint */
    try {
        p = JXG.createParallel(board, parents, attributes).setStraight(false, false).setArrow(false,true);
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
JXG.createNormal = function(board, parents, attributes) {
    /* TODO normal polynomials */
    var p, c, l, i;

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
            throw new Error("JSXGraph: Can't create normal with parent types '" +
                            (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                            "\nPossible parent types: [point,line], [point,circle], [glider]");
        }
    } else {
        throw new Error("JSXGraph: Can't create normal with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [point,line], [point,circle], [glider]");
    }

    if(c.elementClass==JXG.OBJECT_CLASS_LINE) {
        // Homogeneous version:
        // orthogonal(l,p) = (F^\delta\cdot l)\times p
        l = board.create('line', [
                    function(){ return c.stdform[1]*p.Y()-c.stdform[2]*p.X();},
                    function(){ return c.stdform[2]*p.Z();},
                    function(){ return -c.stdform[1]*p.Z();}
                    ], attributes );
    }
    else if(c.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
        l = board.create('line', [c.midpoint,p], attributes);
    } else if (c.elementClass == JXG.OBJECT_CLASS_CURVE) {
        if (c.visProp.curvetype!='plot') {
            var g = c.X;
            var f = c.Y;
            l = board.create('line', [
                    function(){ return -p.X()*board.D(g)(p.position)-p.Y()*board.D(f)(p.position);},
                    function(){ return board.D(g)(p.position);},
                    function(){ return board.D(f)(p.position);}
                    ], attributes );
        } else {                         // curveType 'plot'
            l = board.create('line', [
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
            l = board.create('line', [
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
JXG.createBisector = function(board, parents, attributes) {
    var p, l, i, attr;
    
    /* TODO bisector polynomials */
    if(parents[0].elementClass == JXG.OBJECT_CLASS_POINT && parents[1].elementClass == JXG.OBJECT_CLASS_POINT && parents[2].elementClass == JXG.OBJECT_CLASS_POINT) {
        // hidden and fixed helper
        attr = JXG.copyAttributes(attributes, board.options, 'bisector', 'point');
        p = board.create('point', [function () { return JXG.Math.Geometry.angleBisector(parents[0], parents[1], parents[2], board); }], attr);
        p.dump = false;

        for(i=0; i<3; i++)
            parents[i].addChild(p); // required for algorithm requiring dependencies between elements

        if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.line;
        attr = JXG.copyAttributes(attributes, board.options, 'bisector');
        l = JXG.createLine(board, [parents[1], p], attr);

        l.elType = 'bisector';
        l.parents = [parents[0].id, parents[1].id, parents[2].id];
        l.subs = {
            point: p
        };

        return l;
    }
    else {
        throw new Error("JSXGraph: Can't create angle bisector with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [point,point,point]");
    }
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
JXG.createAngularBisectorsOfTwoLines = function(board, parents, attributes) {
    //
    // The angular bisectors of two line [c1,a1,b1] and [c2,a2,b2] are determined by the equation:
    // (a1*x+b1*y+c1*z)/sqrt(a1^2+b1^2) = +/- (a2*x+b2*y+c2*z)/sqrt(a2^2+b2^2)

    var l1 = JXG.getReference(board,parents[0]),
        l2 = JXG.getReference(board,parents[1]),
        g1, g2, attr,
        ret;

    if(l1.elementClass != JXG.OBJECT_CLASS_LINE || l2.elementClass != JXG.OBJECT_CLASS_LINE) {
        throw new Error("JSXGraph: Can't create angle bisectors of two lines with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [line,line]");
    }

    if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.line;
    attr = JXG.copyAttributes(attributes, board.options, 'bisectorlines', 'line1');
    g1 = board.create('line',[
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
        }
    ], attr);
    
    if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.line;
    attr = JXG.copyAttributes(attributes, board.options, 'bisectorlines', 'line2');
    g2 = board.create('line',[
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

    ret = new JXG.Composition({line1: g1, line2: g2});

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
JXG.createCircumcircleMidpoint = function(board, parents, attributes) {
    var p, i;

    if( parents[0].elementClass == JXG.OBJECT_CLASS_POINT 
       && parents[1].elementClass == JXG.OBJECT_CLASS_POINT 
       && parents[2].elementClass == JXG.OBJECT_CLASS_POINT) {
        p = JXG.createPoint(board, [function () { return JXG.Math.Geometry.circumcenterMidpoint(parents[0], parents[1], parents[2], board); }], attributes);

        for (i = 0; i < 3; i++) {
            parents[i].addChild(p);
        }

        p.elType = 'circumcirclemidpoint';
        p.parents = [parents[0].id, parents[1].id, parents[2].id];

        p.generatePolynomial = function() {
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

            var a1 = a.symbolic.x;
            var a2 = a.symbolic.y;
            var b1 = b.symbolic.x;
            var b2 = b.symbolic.y;
            var c1 = c.symbolic.x;
            var c2 = c.symbolic.y;
            var t1 = p.symbolic.x;
            var t2 = p.symbolic.y;

            var poly1 = ['((',t1,')-(',a1,'))^2+((',t2,')-(',a2,'))^2-((',t1,')-(',b1,'))^2-((',t2,')-(',b2,'))^2'].join('');
            var poly2 = ['((',t1,')-(',a1,'))^2+((',t2,')-(',a2,'))^2-((',t1,')-(',c1,'))^2-((',t2,')-(',c2,'))^2'].join('');

            return [poly1, poly2];
        };

        return p;
    }
    else {
        throw new Error("JSXGraph: Can't create circumcircle midpoint with parent types '" +
                        (typeof parents[0]) + "', '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                        "\nPossible parent types: [point,point,point]");
    }
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
JXG.createIncenter = function(board, parents, attributes) {
    var p, c,
        A, B, C;

    if(parents.length >= 3 && JXG.isPoint(parents[0]) && JXG.isPoint(parents[1]) && JXG.isPoint(parents[2])) {
        A = parents[0];
        B = parents[1];
        C = parents[2];

        p = board.create('point', [function() {
            var a, b, c;

            a = Math.sqrt((B.X() - C.X())*(B.X() - C.X()) + (B.Y() - C.Y())*(B.Y() - C.Y()));
            b = Math.sqrt((A.X() - C.X())*(A.X() - C.X()) + (A.Y() - C.Y())*(A.Y() - C.Y()));
            c = Math.sqrt((B.X() - A.X())*(B.X() - A.X()) + (B.Y() - A.Y())*(B.Y() - A.Y()));

            return new JXG.Coords(JXG.COORDS_BY_USER, [(a*A.X()+b*B.X()+c*C.X())/(a+b+c), (a*A.Y()+b*B.Y()+c*C.Y())/(a+b+c)], board);
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
JXG.createCircumcircle = function(board, parents, attributes) {
    var p, c, attr;

    try {
        attr = JXG.copyAttributes(attributes, board.options, 'circumcircle', 'point');
        p = JXG.createCircumcircleMidpoint(board, parents, attr);

        p.dump = false;
        
        if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.circle;
        attr = JXG.copyAttributes(attributes, board.options, 'circumcircle');
        c = JXG.createCircle(board, [p, parents[0]], attr);

        c.elType = 'circumcircle';
        c.parents = [parents[0].id, parents[1].id, parents[2].id];
        c.subs = {
            point: p
        };
    } catch(e) {
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
JXG.createIncircle = function(board, parents, attributes) {
    var p, c, attr, ret;

    try {
        attr = JXG.copyAttributes(attributes, board.options, 'incircle', 'point');
        p = JXG.createIncenter(board, parents, attr);

        p.dump = false;

        if (!JXG.exists(attributes.layer)) attributes.layer = board.options.layer.circle;
        attr = JXG.copyAttributes(attributes, board.options, 'incircle');
        c = JXG.createCircle(board, [p, function() {
            var a = Math.sqrt((parents[1].X() - parents[2].X())*(parents[1].X() - parents[2].X()) + (parents[1].Y() - parents[2].Y())*(parents[1].Y() - parents[2].Y())),
                b = Math.sqrt((parents[0].X() - parents[2].X())*(parents[0].X() - parents[2].X()) + (parents[0].Y() - parents[2].Y())*(parents[0].Y() - parents[2].Y())),
                c = Math.sqrt((parents[1].X() - parents[0].X())*(parents[1].X() - parents[0].X()) + (parents[1].Y() - parents[0].Y())*(parents[1].Y() - parents[0].Y())),
                s = (a+b+c)/2;

            return Math.sqrt(((s-a)*(s-b)*(s-c))/s);
        }], attr);

        c.elType = 'incircle';
        c.parents = [parents[0].id, parents[1].id, parents[2].id];
        c.subs = {
            point: p
        };
    } catch(e) {
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
JXG.createReflection = function(board, parents, attributes) {
    var l, p, r;

    if(parents[0].elementClass == JXG.OBJECT_CLASS_POINT && parents[1].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[0];
        l = parents[1];
    }
    else if(parents[1].elementClass == JXG.OBJECT_CLASS_POINT && parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
        p = parents[1];
        l = parents[0];
    }
    else {
        throw new Error("JSXGraph: Can't create reflection point with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [line,point]");
    }

    r = JXG.createPoint(board, [function () { return JXG.Math.Geometry.reflection(l, p, board); }], attributes);
    p.addChild(r);
    l.addChild(r);

    r.elType = 'reflection';
    r.parents = [parents[0].id, parents[1].id];

    r.prepareUpdate().update();

    r.generatePolynomial = function() {
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

        var a1 = l.point1.symbolic.x;
        var a2 = l.point1.symbolic.y;
        var b1 = l.point2.symbolic.x;
        var b2 = l.point2.symbolic.y;
        var p1 = p.symbolic.x;
        var p2 = p.symbolic.y;
        var r1 = r.symbolic.x;
        var r2 = r.symbolic.y;

        var poly1 = ['((',r2,')-(',p2,'))*((',a2,')-(',b2,'))+((',a1,')-(',b1,'))*((',r1,')-(',p1,'))'].join('');
        var poly2 = ['((',r1,')-(',a1,'))^2+((',r2,')-(',a2,'))^2-((',p1,')-(',a1,'))^2-((',p2,')-(',a2,'))^2'].join('');

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
JXG.createMirrorPoint = function(board, parents, attributes) {
    var p, i;

    /* TODO mirror polynomials */
    if(JXG.isPoint(parents[0]) && JXG.isPoint(parents[1])) {
        p = JXG.createPoint(board, [function () { return JXG.Math.Geometry.rotation(parents[0], parents[1], Math.PI, board); }], attributes);

        for(i = 0; i < 2; i++) {
            parents[i].addChild(p);
        }

        p.elType = 'mirrorpoint';
        p.parents = [parents[0].id, parents[1].id];
    }
    else {
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
JXG.createIntegral = function(board, parents, attributes) {
    var interval, curve, attr,
        start = 0, end = 0, startx, starty, endx, endy, factor = 1,
        pa_on_curve, pa_on_axis, pb_on_curve, pb_on_axis,
        Int, t, p;

    if(JXG.isArray(parents[0]) && parents[1].elementClass == JXG.OBJECT_CLASS_CURVE) {
        interval = parents[0];
        curve = parents[1];
    } else if(JXG.isArray(parents[1]) && parents[0].elementClass == JXG.OBJECT_CLASS_CURVE) {
        interval = parents[1];
        curve = parents[0];
    } else {
        throw new Error("JSXGraph: Can't create integral with parent types '" +
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                        "\nPossible parent types: [[number|function,number|function],curve]");
    }

    // Correct the interval if necessary - NOT ANYMORE, GGB's fault
    start = interval[0];
    end = interval[1];

    if(JXG.isFunction(start)) {
        startx = start;
        starty = function () { return curve.yterm(startx()); };
        start = startx();
    } else {
        startx = start;
        starty = curve.yterm(start);
    }

    if(JXG.isFunction(start)) {
        endx = end;
        endy = function () { return curve.yterm(endx()); };
        end = endx();
    } else {
        endx = end;
        endy = curve.yterm(end);
    }

    if(end < start) {
        factor = -1;
    }

    attr = JXG.copyAttributes(attributes, board.options, 'integral', 'start');
    pa_on_curve = board.create('glider', [startx, starty, curve], attr);
    if(JXG.isFunction(startx))
        pa_on_curve.hideElement();

    attr = JXG.copyAttributes(attributes, board.options, 'integral', 'startproject');
    pa_on_axis = board.create('point', [function () { return pa_on_curve.X(); }, 0], attr);

    //pa_on_curve.addChild(pa_on_axis);

    attr = JXG.copyAttributes(attributes, board.options, 'integral', 'end');
    pb_on_curve = board.create('glider', [endx, endy, curve], attr);
    if(JXG.isFunction(endx))
        pb_on_curve.hideElement();

    attr = JXG.copyAttributes(attributes, board.options, 'integral', 'endproject');
    pb_on_axis = board.create('point', [function () { return pb_on_curve.X(); }, 0], attr);

    //pb_on_curve.addChild(pb_on_axis);

    attr = JXG.copyAttributes(attributes, board.options, 'integral');
    if(attr.withLabel !== false) {
        attr = JXG.copyAttributes(attributes, board.options, 'integral', 'text');
        Int = JXG.Math.Numerics.I([start, end], curve.yterm);
        t = board.create('text', [
            function () { return pb_on_curve.X() + 0.2; },
            function () { return pb_on_curve.Y() - 0.8; },
            function () {
                    var Int = JXG.Math.Numerics.I([pa_on_axis.X(), pb_on_axis.X()], curve.yterm);
                    return '&int; = ' + (Int).toFixed(4);
                }
            ], attr);

        t.dump = false;

        pa_on_curve.addChild(t);
        pb_on_curve.addChild(t);
    }

    attr = JXG.copyAttributes(attributes, board.options, 'integral');
    p = board.create('curve', [[0],[0]], attr);

    // dump stuff
    pa_on_curve.dump = false;
    pa_on_axis.dump = false;

    pb_on_curve.dump = false;
    pb_on_axis.dump = false;

    p.elType = 'integral';
    p.parents = [curve.id, interval];
    p.subs = {
        start: pa_on_curve,
        startproject: pa_on_axis,
        end: pb_on_curve,
        endproject: pb_on_axis
    };

    if (attr.withLabel) {
        p.subs.text = t;
    }

    /**
     * documented in JXG.Curve
     * @ignore
     */
    p.updateDataArray = function() {
        var x, y,
            i, left, right;

        if(pa_on_axis.X() < pb_on_axis.X()) {
            left = pa_on_axis.X();
            right = pb_on_axis.X();
        } else {
            left = pb_on_axis.X();
            right = pa_on_axis.X();
        }

        x = [left, left];
        y = [0, curve.yterm(left)];

        for(i=0; i < curve.numberPoints; i++) {
            if( (left <= curve.points[i].usrCoords[1]) && (curve.points[i].usrCoords[1] <= right) ) {
                x.push(curve.points[i].usrCoords[1]);
                y.push(curve.points[i].usrCoords[2]);
            }
        }
        x.push(right);
        y.push(curve.yterm(right));
        x.push(right);
        y.push(0);

        x.push(left); // close the curve
        y.push(0);

        this.dataX = x;
        this.dataY = y;
    };
    pa_on_curve.addChild(p);
    pb_on_curve.addChild(p);

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

    /**
     * documented in GeometryElement
     * @ignore
     */
    p.label = {
        content: t
    };

    return p;
};

/**
 * @class This element is used to visualize the locus of a given dependent point.
 * @pseudo
 * @description The locus element is used to visualize the curve a given point describes.
 * @constructor
 * @name Locus
 * @type JXG.Curve
 * @augments JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point} p The constructed curve is the geometric locus of the given point.
 * @example
 *  // This examples needs JXG.Server up and running, otherwise it won't work.
 *  p1 = board.create('point', [0, 0]);
 *  p2 = board.create('point', [6, -1]);
 *  c1 = board.create('circle', [p1, 2]);
 *  c2 = board.create('circle', [p2, 1.5]);
 *  g1 = board.create('glider', [6, 3, c1]);
 *  c3 = board.create('circle', [g1, 4]);
 *  g2 = board.create('intersection', [c2,c3,0]);
 *  m1 = board.create('midpoint', [g1,g2]);
 *  loc = board.create('locus', [m1], {strokeColor: 'red'});
 * </pre><div id="d45d7188-6624-4d6e-bebb-1efa2a305c8a" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  lcex_board = JXG.JSXGraph.initBoard('d45d7188-6624-4d6e-bebb-1efa2a305c8a', {boundingbox:[-4, 6, 10, -6], axis: true, grid: false, keepaspectratio: true});
 *  lcex_p1 = lcex_board.create('point', [0, 0]);
 *  lcex_p2 = lcex_board.create('point', [6, -1]);
 *  lcex_c1 = lcex_board.create('circle', [lcex_p1, 2]);
 *  lcex_c2 = lcex_board.create('circle', [lcex_p2, 1.5]);
 *  lcex_g1 = lcex_board.create('glider', [6, 3, lcex_c1]);
 *  lcex_c3 = lcex_board.create('circle', [lcex_g1, 4]);
 *  lcex_g2 = lcex_board.create('intersection', [lcex_c2,lcex_c3,0]);
 *  lcex_m1 = lcex_board.create('midpoint', [lcex_g1,lcex_g2]);
 *  lcex_loc = board.create('locus', [lcex_m1], {strokeColor: 'red'});
 * </script><pre>
 */
JXG.createLocus = function(board, parents, attributes) {
    var c, p;

    if(JXG.isArray(parents) && parents.length == 1 && parents[0].elementClass == JXG.OBJECT_CLASS_POINT) {
        p = parents[0];
    } else {
        throw new Error("JSXGraph: Can't create locus with parent of type other than point." +
                        "\nPossible parent types: [point]");
    }

    c = board.create('curve', [[null], [null]], attributes);
    c.dontCallServer = false;

    c.elType = 'locus';
    c.parents = [p.id];

    /**
     * should be documented in JXG.Curve
     * @ignore
     */
    c.updateDataArray = function () {
        if(c.board.mode > 0)
            return;

        var spe = JXG.Math.Symbolic.generatePolynomials(board, p, true).join('|');
        if(spe === c.spe)
                return;

        c.spe = spe;

        var cb = function(x, y, eq, t) {
                c.dataX = x;
                c.dataY = y;

                /**
                 * The implicit definition of the locus.
                 * @memberOf Locus.prototype
                 * @name eq
                 * @type String
                 */
                c.eq = eq;

                /**
                 * The time it took to calculate the locus
                 * @memberOf Locus.prototype
                 * @name ctime
                 * @type Number
                 */
                c.ctime = t;

                // convert equation and use it to build a generatePolynomial-method
                c.generatePolynomial = (function(equations) {
                    return function(point) {
                        var x = '(' + point.symbolic.x + ')',
                            y = '(' + point.symbolic.y + ')',
                            res = [], i;

                        for(i=0; i<equations.length; i++)
                            res[i] = equations[i].replace(/\*\*/g, '^').replace(/x/g, x).replace(/y/g, y);

                        return res;
                    }
                })(eq);
            },
            data = JXG.Math.Symbolic.geometricLocusByGroebnerBase(board, p, cb);

        cb(data.datax, data.datay, data.polynomial, data.exectime);
    };
    return c;
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

    attr = JXG.copyAttributes(attributes, board.options, 'grid');
    c = board.create('curve', [[null], [null]], attr);

    c.elType = 'grid';
    c.parents = [];

    // TODO: use user given attributes

    if(board.options.grid.dash) {
        c.setProperty({dash: 2});
    }

    c.updateDataArray = function () {
        var gridX = board.options.grid.gridX,
            gridY = board.options.grid.gridY,
            topLeft = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board),
            bottomRight = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board),
            i;
        //horizontal = [[], []], vertical = [[], []];

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

        topLeft.setCoordinates(JXG.COORDS_BY_USER, [Math.floor(topLeft.usrCoords[1] / gridX) * gridX, Math.ceil(topLeft.usrCoords[2] / gridY) * gridY]);
        bottomRight.setCoordinates(JXG.COORDS_BY_USER, [Math.ceil(bottomRight.usrCoords[1] / gridX) * gridX, Math.floor(bottomRight.usrCoords[2] / gridY) * gridY]);

        c.dataX = [];
        c.dataY = [];

        // start with the horizontal grid:
        for (i = topLeft.usrCoords[2]; i > bottomRight.usrCoords[2] - gridY; i -= gridY) {
            c.dataX.push(topLeft.usrCoords[1], bottomRight.usrCoords[1], NaN);
            c.dataY.push(i, i, NaN);
        }

        // build vertical grid
        for (i = topLeft.usrCoords[1]; i < bottomRight.usrCoords[1] + gridX; i += gridX) {
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


JXG.JSXGraph.registerElement('arrowparallel', JXG.createArrowParallel);
JXG.JSXGraph.registerElement('bisector', JXG.createBisector);
JXG.JSXGraph.registerElement('bisectorlines', JXG.createAngularBisectorsOfTwoLines);
JXG.JSXGraph.registerElement('circumcircle', JXG.createCircumcircle);
JXG.JSXGraph.registerElement('circumcirclemidpoint', JXG.createCircumcircleMidpoint);
JXG.JSXGraph.registerElement('circumcenter', JXG.createCircumcircleMidpoint);
JXG.JSXGraph.registerElement('incenter', JXG.createIncenter);
JXG.JSXGraph.registerElement('incircle', JXG.createIncircle);
JXG.JSXGraph.registerElement('integral', JXG.createIntegral);
JXG.JSXGraph.registerElement('midpoint', JXG.createMidpoint);
JXG.JSXGraph.registerElement('mirrorpoint', JXG.createMirrorPoint);
JXG.JSXGraph.registerElement('normal', JXG.createNormal);
JXG.JSXGraph.registerElement('orthogonalprojection', JXG.createOrthogonalProjection);
JXG.JSXGraph.registerElement('parallel', JXG.createParallel);
JXG.JSXGraph.registerElement('parallelpoint', JXG.createParallelPoint);
JXG.JSXGraph.registerElement('perpendicular', JXG.createPerpendicular);
JXG.JSXGraph.registerElement('perpendicularpoint', JXG.createPerpendicularPoint);
JXG.JSXGraph.registerElement('perpendicularsegment', JXG.createPerpendicularSegment);
JXG.JSXGraph.registerElement('reflection', JXG.createReflection);
JXG.JSXGraph.registerElement('locus', JXG.createLocus);
JXG.JSXGraph.registerElement('grid', JXG.createGrid);
