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

/**
 * Create axes and rear and front walls of the
 * view3d bounding box bbox3D.
 */
import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";

JXG.Polyhedron3D = function (view, polyhedron, faces, attributes) {
    var e,
        genericMethods,
        generateMethod,
        that = this;

    this.constructor(view.board, attributes, Const.OBJECT_TYPE_POLYHEDRON3D, Const.OBJECT_CLASS_3D);
    this.constructor3D(view, "polyhedron3d");

    this.board.finalizeAdding(this);

    this.elType = 'polyhedron3d';

    this.faces = faces;

    this.numberFaces = faces.length;

    // this.def contains the defining data of the polyhedron:
    // vertices and a list of vertices for each face.
    this.def = polyhedron;

    // Simultaneous methods for all faces
    genericMethods = [
        /**
         * Invokes setAttribute for every stored element with a setAttribute method and hands over the given arguments.
         * See {@link JXG.GeometryElement#setAttribute} for further description, valid parameters and return values.
         * @name setAttribute
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "setAttribute",

        /**
         * Invokes setParents for every stored element with a setParents method and hands over the given arguments.
         * See {@link JXG.GeometryElement#setParents} for further description, valid parameters and return values.
         * @name setParents
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "setParents",

        /**
         * Invokes prepareUpdate for every stored element with a prepareUpdate method and hands over the given arguments.
         * See {@link JXG.GeometryElement#prepareUpdate} for further description, valid parameters and return values.
         * @name prepareUpdate
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "prepareUpdate",

        /**
         * Invokes updateRenderer for every stored element with a updateRenderer method and hands over the given arguments.
         * See {@link JXG.GeometryElement#updateRenderer} for further description, valid parameters and return values.
         * @name updateRenderer
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "updateRenderer",

        /**
         * Invokes update for every stored element with a update method and hands over the given arguments.
         * See {@link JXG.GeometryElement#update} for further description, valid parameters and return values.
         * @name update
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "update",

        /**
         * Invokes fullUpdate for every stored element with a fullUpdate method and hands over the given arguments.
         * See {@link JXG.GeometryElement#fullUpdate} for further description, valid parameters and return values.
         * @name fullUpdate
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "fullUpdate",

        /**
         * Invokes highlight for every stored element with a highlight method and hands over the given arguments.
         * See {@link JXG.GeometryElement#highlight} for further description, valid parameters and return values.
         * @name highlight
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "highlight",

        /**
         * Invokes noHighlight for every stored element with a noHighlight method and hands over the given arguments.
         * See {@link JXG.GeometryElement#noHighlight} for further description, valid parameters and return values.
         * @name noHighlight
         * @memberOf JXG.Composition.prototype
         * @function
         */
        "noHighlight"
    ];

    generateMethod = function (what) {
        return function () {
            var i;

            for (i in that.faces) {
                if (that.faces.hasOwnProperty(i)) {
                    if (Type.exists(that.faces[i][what])) {
                        that.faces[i][what].apply(that.faces[i], arguments);
                    }
                }
            }
            return that;
        };
    };

    for (e = 0; e < genericMethods.length; e++) {
        this[genericMethods[e]] = generateMethod(genericMethods[e]);
    }

    this.methodMap = Type.deepCopy(this.methodMap, {
        setAttribute: "setAttribute",
        setParents: "setParents"
    });
};
JXG.Polyhedron3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Polyhedron3D, JXG.GeometryElement3D, "constructor3D");

/**
 * @class A polyhedron in a 3D view consists of faces.
 * @pseudo
 * @description Create a polyhedron in a 3D view consisting of faces. Faces can
 * be 0-, 1- or 2-dimensional.
 *
 * @name Polyhedron3D
 * @augments JXG.GeometryElement3D
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {} TODO
 *
 */
JXG.createPolyhedron3D = function (board, parents, attributes) {
    var view = parents[0],
        i, le,
        face, f,
        el,
        attr, attr_polyhedron,
        faceList = [],
        polyhedron = {
            view: view,
            vertices: {},
            coords: {},
            coords2D: {},
            zIndex: {},
            faces: parents[2],
            updateCoords: function() {
                var i, p;
                for (i in this.vertices) {
                    p = this.vertices[i];
                    if (Type.isArray(p) || Type.isFunction(p)) {
                        this.coords[i] = Type.evaluate(p);
                    } else {
                        p = this.view.select(p);
                        if (Type.isPoint3D(p)) {
                            this.coords[i] = p.coords;
                        } else {
                            throw Error('Polyhedron3D.updateCoords: unknown vertices type!');
                        }
                    }
                    if (this.coords[i].length === 3) {
                        this.coords[i].unshift(1);
                    }
                }
            }
        };

    // Copy vertices into a dict
    if (Type.isArray(parents[1])) {
        le = parents[1].length;
        for (i = 0; i < le; i++) {
            polyhedron.vertices[i] = parents[1][i];
        }
    } else if (Type.isObject(parents[1])) {
        for (i in parents[1]) {
            if (parents[1].hasOwnProperty(i)) {
                polyhedron.vertices[i] = parents[1][i];
            }
        }
    }

    attr_polyhedron = Type.copyAttributes(attributes, board.options, "polyhedron3d");

    console.time('polyhedron');

    view.board.suspendUpdate();
    // Create face3d elements
    le = polyhedron.faces.length;
    for (i = 0; i < le; i++) {
        attr = Type.copyAttributes(attributes, board.options, "face3d");
        attr.fillcolor = attr_polyhedron.fillcolorarray[i % attr_polyhedron.fillcolorarray.length];
        f = polyhedron.faces[i];
        if (Type.isArray(f) && f.length === 2 && Type.isObject(f[1]) && Type.isArray(f[0])) {
            // Handle case that face is of type [[points], {attr}]
            Type.mergeAttr(attr, f[1]);
            // Normalize face array, i.e. don't store attributes of that face in polyhedron
            polyhedron.faces[i] = f[0];
        }
        face = view.create('face3d', [polyhedron, i], attr);
        faceList.push(face);
    }
    el = new JXG.Polyhedron3D(view, polyhedron, faceList, attributes);
    el.setParents(el); // Sets el as parent to all faces.
    for (i = 0; i < le; i++) {
        el.inherits.push(el.faces[i]);
        el.addChild(el.faces[i]);
    }
    view.board.unsuspendUpdate();

    console.timeEnd('polyhedron');

    return el;
};

JXG.registerElement("polyhedron3d", JXG.createPolyhedron3D);
