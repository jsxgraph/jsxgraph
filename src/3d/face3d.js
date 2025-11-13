/*
    Copyright 2008-2025
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
    this.constructor3D(view, 'face3d');

    this.board.finalizeAdding(this);

    /**
     * Link to the defining data of the parent polyhedron3d.
     * @name Face3D#polyhedron
     * @type Object
     * @see Polyhedron3D#def
     */
    this.polyhedron = polyhedron;

    /**
     * Index of the face in the list of faces of the polyhedron
     * @name Face3D#faceNumber
     * @type Number
     */
    this.faceNumber = faceNumber;

    /**
     * Normal vector for the face. Array of length 4.
     * @name Face3D#normal
     * @type array
     */
    this.normal = [0, 0, 0, 0];

    /**
     * Hesse right hand side of the plane that contains the face.
     * @name Face3D#d
     * @type Number
     */
    this.d = 0;

    /**
     * First basis vector of the face. Vector of length 4.
     * @name Face3D#vec1
     * @type Array
     */
    this.vec1 = [0, 0, 0, 0];

    /**
     * Second basis vector of the face. Vector of length 4.
     * @name Face3D#vec2
     * @type Array
     */
    this.vec2 = [0, 0, 0, 0];

    if (this.faceNumber === 0) {
        this.updateCoords();
    }

    this.methodMap = Type.deepCopy(this.methodMap, {
        // TODO
    });
};
JXG.Face3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Face3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Face3D.prototype,
    /** @lends JXG.Face3D.prototype */ {

        /**
         * Update the coordinates of all vertices of the polyhedron
         * @function
         * @name Face3D#updateCoords
         * @returns {Face3D} reference to itself
         */
        updateCoords: function() {
            var i, j, le, p,
                def = this.polyhedron;

            for (i in def.vertices) {
                p = def.vertices[i];
                if (Type.isFunction(p)) {
                    def.coords[i] = Type.evaluate(p);
                } else if (Type.isArray(p)) {
                    def.coords[i] = [];
                    le = p.length;
                    for (j = 0; j < le; j++) {
                        def.coords[i][j] = Type.evaluate(p[j]);
                    }
                } else {
                    p = def.view.select(p);
                    if (Type.isPoint3D(p)) {
                        def.coords[i] = p.coords;
                    } else {
                        throw new Error('Polyhedron3D.updateCoords: unknown vertices type!');
                    }
                }
                if (def.coords[i].length === 3) {
                    def.coords[i].unshift(1);
                }
            }

            return this;
        },

        /**
         * Update the 2D coordinates of the face and determine it's z-index.
         * @function
         * @name Face3D#updateDataArray2D
         * @returns {Object} {X:[], Y:[]}
         */
        updateDataArray2D: function () {
            var j, le,
                c3d, c2d,
                x = [],
                y = [],
                p = this.polyhedron,
                face = p.faces[this.faceNumber];

            if (this.faceNumber === 0) {
                // coords2D equal to [] means, projection is needed down below.
                // Thus, every vertex is projected only once.
                for (j in p.vertices) {
                    p.coords2D[j] = [];
                }
            }

            // Add the projected coordinates of the vertices of this face
            // to the 2D curve.
            // If not done yet, project the 3D vertices of this face to 2D.
            le = face.length;
            this.zIndex = 0.0;
            for (j = 0; j < le; j++) {
                c2d = p.coords2D[face[j]];
                if (c2d.length === 0) {
                    // if coords2D.length > 0, it has already be projected
                    // in another face3d.
                    c3d = p.coords[face[j]];
                    c2d = this.view.project3DTo2D(c3d);
                    p.coords2D[face[j]] = c2d;
                    // p.zIndex[face[j]] = Mat.matVecMult(this.view.matrix3DRotShift, c3d)[3];
                    p.zIndex[face[j]] = Mat.innerProduct(this.view.matrix3DRotShift[3], c3d);
                }
                x.push(c2d[1]);
                y.push(c2d[2]);

                this.zIndex += p.zIndex[face[j]];
            }
            if (le > 0) {
                this.zIndex /= le;
            }
            if (le !== 2) {
                // 2D faces and points are a closed loop
                x.push(x[0]);
                y.push(y[0]);
            }

            return { X: x, Y: y };
        },

        addTransform: function (el, transform) {
            if (this.faceNumber === 0) {
                this.addTransformGeneric(el, transform);
            }
            return this;
        },

        updateTransform: function () {
            var t, c, i, j, b;

            if (this.faceNumber !== 0) {
                return this;
            }

            if (this.transformations.length === 0 || this.baseElement === null) {
                return this;
            }

            t = this.transformations;
            for (i = 0; i < t.length; i++) {
                t[i].update();
            }

            if (this === this.baseElement) {
                b = this.polyhedron;
            } else {
                b = this.baseElement.polyhedron;
            }
            for (i in b.coords) {
                if (b.coords.hasOwnProperty(i)) {
                    c = b.coords[i];
                    for (j = 0; j < t.length; j++) {
                        c = Mat.matVecMult(t[j].matrix, c);
                    }
                    this.polyhedron.coords[i] = c;
                }
            }

            return this;
        },

        update: function () {
            var i, le,
                phdr, nrm,
                p1, p2,
                face;

            if (this.needsUpdate && !this.view.board._change3DView) {
                phdr = this.polyhedron;

                if (this.faceNumber === 0) {
                    // Update coordinates of all vertices
                    this.updateCoords()
                        .updateTransform();
                }

                face = phdr.faces[this.faceNumber];
                le = face.length;
                if (le < 3) {
                    // Get out of here if face is point or segment
                    return this;
                }

                // Update spanning vectors
                p1 = phdr.coords[face[0]];
                p2 = phdr.coords[face[1]];
                this.vec1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2], p2[3] - p1[3]];

                p2 = phdr.coords[face[2]];
                this.vec2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2], p2[3] - p1[3]];

                // Update Hesse form, i.e. normal and d
                this.normal = Mat.crossProduct(this.vec1.slice(1), this.vec2.slice(1));
                nrm = Mat.norm(this.normal);
                this.normal.unshift(0);

                if (Math.abs(nrm) > 1.e-12) {
                    for (i = 1; i < 4; i++) {
                        this.normal[i] /= nrm;
                    }
                }
                this.d = Mat.innerProduct(p1, this.normal, 4);
            }
            return this;
        },

        updateRenderer: function () {
            if (this.needsUpdate) {
                this.needsUpdate = false;
                this.shader();
            }
            return this;
        },

        /**
         * Determines the lightness of the face (in the HSL color scheme).
         * <p>
         * Sets the fillColor of the adjoint 2D curve.
         * @name shader
         * @memberOf Face3D
         * @function
         * @returns {Number} zIndex of the face
         */
        shader: function() {
            var hue, sat, light, angle, hsl,
                // bb = this.view.bbox3D,
                minFace, maxFace,
                minLight, maxLight;


            if (this.evalVisProp('shader.enabled')) {
                hue = this.evalVisProp('shader.hue');
                sat = this.evalVisProp('shader.saturation');
                minLight = this.evalVisProp('shader.minlightness');
                maxLight = this.evalVisProp('shader.maxlightness');

                if (this.evalVisProp('shader.type').toLowerCase() === 'angle') {
                    // Angle normal / eye
                    angle = Mat.innerProduct(this.view.matrix3DRotShift[3], this.normal);
                    angle = Math.abs(angle);
                    light = minLight + (maxLight - minLight) * angle;
                } else {
                    // zIndex
                    maxFace = this.view.zIndexMax;
                    minFace = this.view.zIndexMin;
                    light = minLight + (maxLight - minLight) * ((this.zIndex - minFace) / (maxFace - minFace));
                }

                // hsl = `hsl(${hue}, ${sat}%, ${light}%)`;
                hsl = 'hsl(' + hue + ',' + sat +'%,' + light + '%)';

                this.element2D.visProp.fillcolor = hsl;
                return this.zIndex;
            }
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
  */
JXG.createFace3D = function (board, parents, attributes) {
    var view = parents[0],
        polyhedron = parents[1],
        faceNumber = parents[2],
        attr, el;

    // TODO Throw new Error
    attr = Type.copyAttributes(attributes, board.options, 'face3d');
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

