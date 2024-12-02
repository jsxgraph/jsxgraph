/*
    Copyright 2008-2024
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */
/*global JXG:true, define: true*/

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";

/**
 * 3D faces
 * @class Creates a new 3D face object. Do not use this constructor to create a 3D curve. Use {@link JXG.View3D#create} with type {@link Face3D} instead.
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
JXG.Face3D = function (view, polyhedron, faceNumber, attributes) {
    this.constructor(view.board, attributes, Const.OBJECT_TYPE_FACE3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "face3d");

    this.board.finalizeAdding(this);

    this.polyhedron = polyhedron;
    this.faceNumber = faceNumber;
    this.dataX = [];
    this.dataY = [];
    this.dataZ = [];
    this.normal = [0, 0, 0];
    this.d = 0;
    this.vec1 = [0, 0, 0];
    this.vec2 = [0, 0, 0];


    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Face3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Face3D, JXG.GeometryElement3D, "constructor3D");

JXG.extend(
    JXG.Face3D.prototype,
    /** @lends JXG.Face3D.prototype */ {
        updateDataArray2D: function () {
            var j, le,
                c3d, c2d,
                x = [],
                y = [],
                p = this.polyhedron,
                i = this.faceNumber,
                face = p.faces[i];

            if (i === 0 && !this.view.board._change3DView) {
                // Evaluate each vertex only once.
                // For this, face[0] has to be accessed first.
                // During updates this should be the case automatically.
                p.updateCoords();
            }

            le = face.length;
            for (j = 0; j < le; j++) {
                c3d = p.coords[face[j]];
                this.dataX.push(c3d[0]);
                this.dataY.push(c3d[1]);
                this.dataZ.push(c3d[2]);

                c2d = this.view.project3DTo2D(c3d);
                x.push(c2d[1]);
                y.push(c2d[2]);
            }
            if (le !== 2) {
                // 2D faces and points are a closed loop
                x.push(x[0]);
                y.push(y[0]);
            }

            return { X: x, Y: y };
        },

        updateDataArray: function () { /* stub */ },

        update: function () {
            var i, le,
                phdr, nrm,
                p1, p2,
                face;

            // if (this.needsUpdate) {
                phdr = this.polyhedron;
                face = phdr.faces[this.faceNumber];

                le = face.length;
                if (le < 3) {
                    // Get out of here if face is point or segment
                    return this;
                }
                p1 = phdr.coords[face[0]];
                p2 = phdr.coords[face[1]];
                this.vec1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
                p2 = phdr.coords[face[2]];
                this.vec2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];

                this.normal = Mat.crossProduct(this.vec1, this.vec2);
                nrm = Mat.norm(this.normal);
                if (Math.abs(nrm) > Mat.eps * Mat.eps) {
                    for (i = 0; i < 3; i++) {
                        this.normal[i] /= nrm;
                    }
                }
                this.d = Mat.innerProduct(p1, this.normal, 3);

                // this.updateDataArray();
            // }
            return this;
        },

        updateRenderer: function () {
            this.needsUpdate = false;
            return this;
        },

        getCentroid: function () {
            var i,
                s_x = 0,
                s_y = 0,
                s_z = 0,
                le = this.dataX.length;

            if (le === 0) {
                return [NaN, NaN, NaN];
            }

            for (i = 0; i < le; i++) {
                s_x += this.dataX[i];
                s_y += this.dataY[i];
                s_z += this.dataZ[i];
            }

            return [s_x / le, s_y / le, s_z / le];
        }

    }
);

/**
 * @class This element creates a 3D face.
 * @pseudo
 * @description A 3D faces is TODO
 *
 * @name Face3D
 * @augments Curve
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Function_Function_Function_Array,Function} F<sub>X</sub>,F<sub>Y</sub>,F<sub>Z</sub>,range
 * F<sub>X</sub>(u), F<sub>Y</sub>(u), F<sub>Z</sub>(u) are functions returning a number, range is the array containing
 * lower and upper bound for the range of the parameter u. range may also be a function returning an array of length two.
 * @param {Function_Array,Function} F,range Alternatively: F<sub>[X,Y,Z]</sub>(u) a function returning an array [x,y,z] of
 * numbers, range as above.
 * @param {Array_Array_Array} X,Y,Z Three arrays containing the coordinate vertexs which define the curve.
  */
JXG.createFace3D = function (board, parents, attributes) {
    var view = parents[0],
        polyhedron = parents[1],
        faceNumber = parents[2],
        attr, el;

    // TODO Throw error
    attr = Type.copyAttributes(attributes, board.options, "face3d");
    el = new JXG.Face3D(view, polyhedron, faceNumber, attr);

    attr = el.setAttr2D(attr);
    el.element2D = view.create("curve", [[], []], attr);
    el.element2D.view = view;

    /**
     * @class
     * @ignore
     */
    el.element2D.updateDataArray = function () {
        var ret = el.updateDataArray2D();
        this.dataX = ret.X;
        this.dataY = ret.Y;
    };
    el.addChild(el.element2D);
    el.inherits.push(el.element2D);
    el.element2D.setParents(el);

    el.element2D.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        el.element2D.updateVisibility().updateRenderer();
    }

    return el;
};

JXG.registerElement("face3d", JXG.createFace3D);

