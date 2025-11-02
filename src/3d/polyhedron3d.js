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
    this.constructor3D(view, 'polyhedron3d');

    this.board.finalizeAdding(this);

    this.elType = 'polyhedron3d';

    /**
     * List of Face3D objects.
     * @name Polyhedron3D#faces
     * @type Array
     */
    this.faces = faces;

    /**
     * Number of faces
     * @name Polyhedron3D#numberFaces
     * @type Number
     */
    this.numberFaces = faces.length;

    /**
     * Contains the defining data of the polyhedron:
     * Definitions of vertices and a list of vertices for each face. This is pretty much the input given
     * in the construction of the polyhedron plus internal data.
     * @name Polyhedron3D#def
     * @type Object
     * @example
     *  polyhedron = {
     *      view: view,
     *      vertices: {},
     *      coords: {},
     *      coords2D: {},
     *      zIndex: {},
     *      faces: []
     *  };
     */
    this.def = polyhedron;

    // Simultaneous methods for all faces
    genericMethods = [
        "setAttribute",
        "setParents",
        "prepareUpdate",
        "updateRenderer",
        "update",
        "fullUpdate",
        "highlight",
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
        setParents: "setParents",
        addTransform: "addTransform"
    });
};
JXG.Polyhedron3D.prototype = new JXG.GeometryElement();
Type.copyPrototypeMethods(JXG.Polyhedron3D, JXG.GeometryElement3D, 'constructor3D');

JXG.extend(
    JXG.Polyhedron3D.prototype,
    /** @lends JXG.Polyhedron3D.prototype */ {

        // Already documented in element3d.js
        addTransform: function (el, transform) {
            if (this.faces.length > 0 && el.faces.length > 0) {
                this.faces[0].addTransform(el.faces[0], transform);
            } else {
                throw new Error("Adding transformation failed. At least one of the two polyhedra has no faces.");
            }
            return this;
        },

        /**
         * Output polyhedron in ASCII STL format.
         * Normals are ignored and output as 0 0 0.
         *
         * @param {String} name Set name of the model, overwrites property name
         * @returns String
         */
        toSTL: function(name) {
            var i, j, v, f, c, le,
                txt = 'solid ';

            if (name === undefined) {
                name = this.name;
            }

            txt += name + '\n';

            for (i = 0; i < this.def.faces.length; i++) {
                txt += ' facet normal 0 0 0\n  outer loop\n';
                f = this.def.faces[i];
                le = f.length;
                v = this.def.coords;
                for (j = 0; j < le; j++) {
                    c = v[f[j]];
                    txt += '   vertex ' + c[1] + ' ' + c[2] + ' ' + c[3] + '\n';
                }
                txt += '  endloop\n endfacet\n';
            }
            txt += 'endsolid ' + name + '\n';

            return txt;
        }
    }
);

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
 * @example
 * var box = [-4, 4];
 * var view = board.create(
 *     'view3d',
 *     [[-5, -3], [8, 8],
 *     [box, box, box]],
 *     {
 *         projection: 'parallel',
 *         trackball: { enabled: false },
 *         depthOrder: {
 *             enabled: true
 *         },
 *         xPlaneRear: { visible: false },
 *         yPlaneRear: { visible: false },
 *         zPlaneRear: { fillOpacity: 0.2 }
 *     }
 * );
 * var cube = view.create('polyhedron3d', [
 * [
 *     [-3, -3, -3],
 *     [3, -3, -3],
 *     [3, 3, -3],
 *     [-3, 3, -3],
 *
 *     [-3, -3, 3],
 *     [3, -3, 3],
 *     [3, 3, 3],
 *     [-3, 3, 3]
 * ],
 * [
 *     [0, 1, 2, 3],
 *     [0, 1, 5, 4],
 *     [[1, 2, 6, 5], { fillColor: 'black', fillOpacity: 0.5, strokeWidth: 5 }],
 *     [2, 3, 7, 6],
 *     [3, 0, 4, 7],
 *     [4, 5, 6, 7]
 * ]
 * ], {
 * fillColorArray: ['blue', 'red', 'yellow']
 * });
 *
 * </pre><div id="JXG2ab3325b-4171-4a00-9896-a1b886969e18" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG2ab3325b-4171-4a00-9896-a1b886969e18',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *     var box = [-4, 4];
 *     var view = board.create(
 *         'view3d',
 *         [[-5, -3], [8, 8],
 *         [box, box, box]],
 *         {
 *             projection: 'parallel',
 *             trackball: { enabled: false },
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             xPlaneRear: { visible: false },
 *             yPlaneRear: { visible: false },
 *             zPlaneRear: { fillOpacity: 0.2 }
 *         }
 *     );
 *     var cube = view.create('polyhedron3d', [
 *     [
 *         [-3, -3, -3],
 *         [3, -3, -3],
 *         [3, 3, -3],
 *         [-3, 3, -3],
 *
 *         [-3, -3, 3],
 *         [3, -3, 3],
 *         [3, 3, 3],
 *         [-3, 3, 3]
 *     ],
 *     [
 *         [0, 1, 2, 3],
 *         [0, 1, 5, 4],
 *         [[1, 2, 6, 5], { fillColor: 'black', fillOpacity: 0.5, strokeWidth: 5 }],
 *         [2, 3, 7, 6],
 *         [3, 0, 4, 7],
 *         [4, 5, 6, 7]
 *     ]
 *     ], {
 *     fillColorArray: ['blue', 'red', 'yellow']
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var box = [-4, 4];
 * var view = board.create(
 *     'view3d',
 *     [[-5, -3], [8, 8],
 *     [box, box, box]],
 *     {
 *         projection: 'parallel',
 *         trackball: { enabled: false },
 *         depthOrder: {
 *             enabled: true
 *         },
 *         xPlaneRear: { visible: false },
 *         yPlaneRear: { visible: false },
 *         zPlaneRear: { fillOpacity: 0.2 }
 *     }
 * );
 * var aa = view.create('point3d', [-3, -3, -3], { name: 'A', layer: 12});
 * var bb = view.create('point3d', [() => aa.X(), () => aa.Y(), 3], { name: 'B', fixed: true, layer: 12});
 * var cube = view.create('polyhedron3d', [
 *     {
 *         a: 'A',
 *         b: [3, -3, -3],
 *         c: [3, 3, -3],
 *         d: [-3, 3, -3],
 *
 *         e: bb,
 *         f: [3, -3, 3],
 *         g: [3, 3, 3],
 *         h: [-3, 3, 3]
 *     },
 *     [
 *         ['a', 'b', 'c', 'd'],
 *         ['a', 'b', 'f', 'e'],
 *         ['b', 'c', 'g', 'f'],
 *         ['c', 'd', 'h', 'g'],
 *         ['d', 'a', 'e', 'h'],
 *         ['e', 'f', 'g', 'h'],
 *
 *         ['a', 'g'], // Edge
 *         ['f']       // Vertex
 *     ]
 * ], {
 *     fillColorArray: ['blue', 'red', 'yellow'],
 *     fillOpacity: 0.4,
 *     layer: 12
 * });
 * cube.faces[6].setAttribute({ strokeWidth: 5 });
 * cube.faces[7].setAttribute({ strokeWidth: 10 });
 *
 * </pre><div id="JXG1e862f44-3e38-424b-98d5-f972338a8b7f" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1e862f44-3e38-424b-98d5-f972338a8b7f',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *     var box = [-4, 4];
 *     var view = board.create(
 *         'view3d',
 *         [[-5, -3], [8, 8],
 *         [box, box, box]],
 *         {
 *             projection: 'parallel',
 *             trackball: { enabled: false },
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             xPlaneRear: { visible: false },
 *             yPlaneRear: { visible: false },
 *             zPlaneRear: { fillOpacity: 0.2 }
 *         }
 *     );
 *     var aa = view.create('point3d', [-3, -3, -3], { name: 'A', layer: 12});
 *     var bb = view.create('point3d', [() => aa.X(), () => aa.Y(), 3], { name: 'B', fixed: true, layer: 12});
 *     var cube = view.create('polyhedron3d', [
 *         {
 *             a: 'A',
 *             b: [3, -3, -3],
 *             c: [3, 3, -3],
 *             d: [-3, 3, -3],
 *
 *             e: bb,
 *             f: [3, -3, 3],
 *             g: [3, 3, 3],
 *             h: [-3, 3, 3]
 *         },
 *         [
 *             ['a', 'b', 'c', 'd'],
 *             ['a', 'b', 'f', 'e'],
 *             ['b', 'c', 'g', 'f'],
 *             ['c', 'd', 'h', 'g'],
 *             ['d', 'a', 'e', 'h'],
 *             ['e', 'f', 'g', 'h'],
 *
 *             ['a', 'g'], // Edge
 *             ['f']       // Vertex
 *         ]
 *     ], {
 *         fillColorArray: ['blue', 'red', 'yellow'],
 *         fillOpacity: 0.4,
 *         layer: 12
 *     });
 *     cube.faces[6].setAttribute({ strokeWidth: 5 });
 *     cube.faces[7].setAttribute({ strokeWidth: 10 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var box = [-4, 4];
 * var view = board.create(
 *     'view3d',
 *     [[-5, -3], [8, 8],
 *     [box, box, box]],
 *     {
 *         projection: 'parallel',
 *         trackball: { enabled: false },
 *         depthOrder: {
 *             enabled: true
 *         },
 *         xPlaneRear: { visible: false },
 *         yPlaneRear: { visible: false },
 *         zPlaneRear: { fillOpacity: 0.2 }
 *     }
 * );
 * var s = board.create('slider', [[-4, -6], [4, -6], [0, 2, 4]], { name: 's' });
 * var cube = view.create('polyhedron3d', [
 *     [
 *         () => { let f = s.Value(); return [-f, -f, -f]; },
 *         () => { let f = s.Value(); return [f, -f, -f]; },
 *         () => { let f = s.Value(); return [f, f, -f]; },
 *         () => { let f = s.Value(); return [-f, f, -f]; },
 *
 *         () => { let f = s.Value(); return [-f, -f, f]; },
 *         () => { let f = s.Value(); return [f, -f, f]; },
 *         () => { let f = s.Value(); return [f, f, f]; },
 *         // () => { let f = s.Value(); return [-f, f, f]; }
 *         [ () => -s.Value(),  () => s.Value(), () => s.Value() ]
 *     ],
 *     [
 *         [0, 1, 2, 3],
 *         [0, 1, 5, 4],
 *         [1, 2, 6, 5],
 *         [2, 3, 7, 6],
 *         [3, 0, 4, 7],
 *         [4, 5, 6, 7],
 *     ]
 * ], {
 *     strokeWidth: 3,
 *     fillOpacity: 0.6,
 *     fillColorArray: ['blue', 'red', 'yellow'],
 *     shader: {
 *         enabled:false
 *     }
 * });
 *
 * </pre><div id="JXG6f27584b-b648-4743-a864-a6c559ead00e" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6f27584b-b648-4743-a864-a6c559ead00e',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *     var box = [-4, 4];
 *     var view = board.create(
 *         'view3d',
 *         [[-5, -3], [8, 8],
 *         [box, box, box]],
 *         {
 *             projection: 'parallel',
 *             trackball: { enabled: false },
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             xPlaneRear: { visible: false },
 *             yPlaneRear: { visible: false },
 *             zPlaneRear: { fillOpacity: 0.2 }
 *         }
 *     );
 *     var s = board.create('slider', [[-4, -6], [4, -6], [0, 2, 4]], { name: 's' });
 *     var cube = view.create('polyhedron3d', [
 *         [
 *             () => { let f = s.Value(); return [-f, -f, -f]; },
 *             () => { let f = s.Value(); return [f, -f, -f]; },
 *             () => { let f = s.Value(); return [f, f, -f]; },
 *             () => { let f = s.Value(); return [-f, f, -f]; },
 *
 *             () => { let f = s.Value(); return [-f, -f, f]; },
 *             () => { let f = s.Value(); return [f, -f, f]; },
 *             () => { let f = s.Value(); return [f, f, f]; },
 *             // () => { let f = s.Value(); return [-f, f, f]; }
 *             [ () => -s.Value(),  () => s.Value(), () => s.Value() ]
 *         ],
 *         [
 *             [0, 1, 2, 3],
 *             [0, 1, 5, 4],
 *             [1, 2, 6, 5],
 *             [2, 3, 7, 6],
 *             [3, 0, 4, 7],
 *             [4, 5, 6, 7],
 *         ]
 *     ], {
 *         strokeWidth: 3,
 *         fillOpacity: 0.6,
 *         fillColorArray: ['blue', 'red', 'yellow'],
 *         shader: {
 *             enabled:false
 *         }
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var box = [-4, 4];
 * var view = board.create(
 *     'view3d',
 *     [[-5, -3], [8, 8],
 *     [box, box, box]],
 *     {
 *         projection: 'parallel',
 *         trackball: { enabled: false },
 *         depthOrder: {
 *             enabled: true
 *         },
 *         xPlaneRear: { visible: false },
 *         yPlaneRear: { visible: false },
 *         zPlaneRear: { fillOpacity: 0.2 }
 *     }
 * );
 * let rho = 1.6180339887;
 * let vertexList = [
 *     [0, -1, -rho], [0, +1, -rho], [0, -1, rho], [0, +1, rho],
 *     [1, rho, 0], [-1, rho, 0], [1, -rho, 0], [-1, -rho, 0],
 *     [-rho, 0, 1], [-rho, 0, -1], [rho, 0, 1], [rho, 0, -1]
 * ];
 * let faceArray = [
 *     [4, 1, 11],
 *     [11, 1, 0],
 *     [6, 11, 0],
 *     [0, 1, 9],
 *     [11, 10, 4],
 *     [9, 1, 5],
 *     [8, 9, 5],
 *     [5, 3, 8],
 *     [6, 10, 11],
 *     [2, 3, 10],
 *     [2, 10, 6],
 *     [8, 3, 2],
 *     [3, 4, 10],
 *     [7, 8, 2],
 *     [9, 8, 7],
 *     [0, 9, 7],
 *     [4, 3, 5],
 *     [5, 1, 4],
 *     [0, 7, 6],
 *     [7, 2, 6]
 * ];
 * var ico = view.create('polyhedron3d', [vertexList, faceArray], {
 * fillColorArray: [],
 * fillOpacity: 1,
 * strokeWidth: 0.1,
 * layer: 12,
 * shader: {
 *     enabled: true,
 *     type: 'angle',
 *     hue: 60,
 *     saturation: 90,
 *     minlightness: 60,
 *     maxLightness: 80
 * }
 * });
 *
 * </pre><div id="JXGfea93484-96e9-4eb5-9e45-bb53d612aead" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGfea93484-96e9-4eb5-9e45-bb53d612aead',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *     var box = [-4, 4];
 *     var view = board.create(
 *         'view3d',
 *         [[-5, -3], [8, 8],
 *         [box, box, box]],
 *         {
 *             projection: 'parallel',
 *             trackball: { enabled: false },
 *             depthOrder: {
 *                 enabled: true
 *             },
 *             xPlaneRear: { visible: false },
 *             yPlaneRear: { visible: false },
 *             zPlaneRear: { fillOpacity: 0.2 }
 *         }
 *     );
 *     let rho = 1.6180339887;
 *     let vertexList = [
 *     [0, -1, -rho], [0, +1, -rho], [0, -1, rho], [0, +1, rho],
 *     [1, rho, 0], [-1, rho, 0], [1, -rho, 0], [-1, -rho, 0],
 *     [-rho, 0, 1], [-rho, 0, -1], [rho, 0, 1], [rho, 0, -1]
 *     ];
 *     let faceArray = [
 *     [4, 1, 11],
 *     [11, 1, 0],
 *     [6, 11, 0],
 *     [0, 1, 9],
 *     [11, 10, 4],
 *     [9, 1, 5],
 *     [8, 9, 5],
 *     [5, 3, 8],
 *     [6, 10, 11],
 *     [2, 3, 10],
 *     [2, 10, 6],
 *     [8, 3, 2],
 *     [3, 4, 10],
 *     [7, 8, 2],
 *     [9, 8, 7],
 *     [0, 9, 7],
 *     [4, 3, 5],
 *     [5, 1, 4],
 *     [0, 7, 6],
 *     [7, 2, 6]
 *     ];
 *     var ico = view.create('polyhedron3d', [vertexList, faceArray], {
 *     fillColorArray: [],
 *     fillOpacity: 1,
 *     strokeWidth: 0.1,
 *     layer: 12,
 *     shader: {
 *         enabled: true,
 *         type: 'angle',
 *         hue: 60,
 *         saturation: 90,
 *         minlightness: 60,
 *         maxLightness: 80
 *     }
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createPolyhedron3D = function (board, parents, attributes) {
    var view = parents[0],
        i, le,
        face, f,
        el,
        attr, attr_polyhedron,
        faceList = [],
        base = null,
        transform = null,

        polyhedron = {
            view: view,
            vertices: {},
            coords: {},
            coords2D: {},
            zIndex: {},
            faces: []
        };

    if (Type.exists(parents[1].type) && parents[1].type === Const.OBJECT_TYPE_POLYHEDRON3D) {
        // Polyhedron from baseElement and transformations
        base = parents[1];
        transform = parents[2];
        polyhedron.vertices = base.def.vertices;
        polyhedron.faces = base.def.faces;
    } else {
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
        polyhedron.faces = parents[2];
    }

    attr_polyhedron = Type.copyAttributes(attributes, board.options, 'polyhedron3d');

    console.time('polyhedron');

    view.board.suspendUpdate();
    // Create face3d elements
    le = polyhedron.faces.length;
    for (i = 0; i < le; i++) {
        attr = Type.copyAttributes(attributes, board.options, 'face3d');
        if (attr_polyhedron.fillcolorarray.length > 0) {
            attr.fillcolor = attr_polyhedron.fillcolorarray[i % attr_polyhedron.fillcolorarray.length];
        }
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
    el = new JXG.Polyhedron3D(view, polyhedron, faceList, attr_polyhedron);
    el.setParents(el); // Sets el as parent to all faces.
    for (i = 0; i < le; i++) {
        el.inherits.push(el.faces[i]);
        el.addChild(el.faces[i]);
    }
    if (base !== null) {
        el.addTransform(base, transform);
        el.addParents(base);
    }
    view.board.unsuspendUpdate();

    console.timeEnd('polyhedron');

    return el;
};

JXG.registerElement("polyhedron3d", JXG.createPolyhedron3D);
