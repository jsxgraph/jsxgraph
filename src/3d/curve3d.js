/*
    Copyright 2008-2022
        Matthias Ehmann,
        Carsten Miller,
        Andreas Walter,
        Alfred Wassermann

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
/*global JXG:true, define: true*/

define(['jxg', 'base/constants', 'utils/type'], function (JXG, Const, Type) {
    "use strict";

    /**
     * Constructor for 3D curves.
     * @class Creates a new 3D curve object. Do not use this constructor to create a 3D curve. Use {@link JXG.Board#create} with type {@link Curve3D} instead.
     *
     * @augments JXG.GeometryElement3D
     * @augments JXG.GeometryElement
     * @param {View3D} view
     * @param {Function} F
     * @param {Function} X
     * @param {Function} Y
     * @param {Function} Z
     * @param {Array} range
     * @param {Object} attributes
     * @see JXG.Board#generateName
     */
     JXG.Curve3D = function (view, F, X, Y, Z, range, attributes) {
        this.constructor(view.board, attributes, Const.OBJECT_TYPE_CURVE3D, Const.OBJECT_CLASS_CURVE);
        this.constructor3D(view, 'surface3d');

        this.id = this.view.board.setId(this, 'S3D');
        this.board.finalizeAdding(this);

        this.F = F;

        /**
         * Function which maps u to x; i.e. it defines the x-coordinate of the curve
         * @function
         * @returns Number
         */
        this.X = X;

        /**
         * Function which maps u to y; i.e. it defines the y-coordinate of the curve
         * @function
         * @returns Number
         */
        this.Y = Y;

        /**
         * Function which maps u to z; i.e. it defines the x-coordinate of the curve
         * @function
         * @returns Number
         */
        this.Z = Z;

        if (this.F !== null) {
            this.X = function(u) { return this.F(u)[0]; };
            this.Y = function(u) { return this.F(u)[1]; };
            this.Z = function(u) { return this.F(u)[2]; };
        }

        this.range = range;

        this.methodMap = Type.deepCopy(this.methodMap, {
            // TODO
        });
    };
    JXG.Curve3D.prototype = new JXG.GeometryElement();
    Type.copyPrototypeMethods(JXG.Curve3D, JXG.GeometryElement3D, 'constructor3D');

    JXG.extend(JXG.Curve3D.prototype, /** @lends JXG.Curve3D.prototype */ {

        updateDataArray: function () {
            var steps = Type.evaluate(this.visProp.numberpointshigh),
                r = Type.evaluate(this.range),
                s = r[0],
                e = r[1],
                delta = (e - s) / (steps - 1),
                c2d, u,
                dataX, dataY,
                p = [0, 0, 0];

            dataX = [];
            dataY = [];

            for (u = s; u <= e; u += delta) {
                if (this.F !== null){
                    p = this.F(u);
                } else {
                    p = [this.X(u), this.Y(u), this.Z(u)];
                }
                c2d = this.view.project3DTo2D(p);
                dataX.push(c2d[1]);
                dataY.push(c2d[2]);
            }
            return {'X': dataX, 'Y': dataY};
        },

        update: function () { return this; },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        }
    });

    /**
     * @class This element creates a 3D parametric curves.
     * @pseudo
     * @description A 3D parametric curve is defined by a function
     *    <i>F: R<sup>1</sup> &rarr; R<sup>3</sup></i>.
     *
     * @name Curve3D
     * @augments Curve
     * @constructor
     * @type Object
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Function_Function_Function_Array,Function} F<sub>X</sub>,F<sub>Y</sub>,F<sub>Z</sub>,range
     * F<sub>X</sub>(u), F<sub>Y</sub>(u), F<sub>Z</sub>(u) are functions returning a number, range is the array containing
     * lower and upper bound for the range of the parameter u. range may also be a function returning an array of length two.
     * @param {Function_Array,Function} F,range Alternatively: F<sub>[X,Y,Z]</sub>(u) a function returning an array [x,y,z] of numbers, range as above.
     */
    JXG.createCurve3D = function (board, parents, attributes) {
        var view = parents[0],
            F, X, Y, Z, range,
            attr, el;

        if (parents.length === 3) {
            F = parents[1];
            range = parents[2];
            X = null;
            Y = null;
            Z = null;
        } else {
            X = parents[1];
            Y = parents[2];
            Z = parents[3];
            range = parents[4];
            F = null;
        }
        attr = Type.copyAttributes(attributes, board.options, 'curve3d');
        el = new JXG.Curve3D(view, F, X, Y, Z, range, attr);

        el.element2D = board.create('curve', [[], []], attr);
        el.element2D.updateDataArray = function() {
            var ret = el.updateDataArray();
            this.dataX = ret['X'];
            this.dataY = ret['Y'];
        };
        el.addChild(el.element2D);
        el.inherits.push(el.element2D);

        el.element2D.prepareUpdate().update();
        if (!board.isSuspendedUpdate) {
            el.element2D.updateVisibility().updateRenderer();
        }

        return el;
    };
    JXG.registerElement('curve3d', JXG.createCurve3D);

});