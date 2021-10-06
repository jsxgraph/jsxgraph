/*
    Copyright 2008-2021
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


/*global JXG: true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 base/element
 math/math
 utils/type
 */

/**
 * @fileoverview In this file the ForeignObject element is defined.
 */

 define([
    'jxg', 'base/constants', 'base/coords', 'base/element', 'math/math', 'utils/type', 'base/coordselement'
], function (JXG, Const, Coords, GeometryElement, Mat, Type, CoordsElement) {

    "use strict";

    JXG.ForeignObject = function (board, coords, attributes, content /*, size*/) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_FOREIGNOBJECT, Const.OBJECT_CLASS_OTHER);
        this.element = this.board.select(attributes.anchor);
        this.coordsConstructor(coords);

        // this.W = Type.createFunction(size[0], this.board, '');
        // this.H = Type.createFunction(size[1], this.board, '');

        // this.usrSize = [this.W(), this.H()];
        this.size = [1, 1];

        /**
         * Array of length two containing [width, height] of the foreignObject in pixel.
         * @type {array}
         */
        // this.size = [Math.abs(this.usrSize[0] * board.unitX), Math.abs(this.usrSize[1] * board.unitY)];

        /**
         * 'href' of the foreignObject.
         * @type {string}
         */
        this.content = content;

        this.elType = 'foreignobject';

        // span contains the anchor point and the two vectors
        // spanning the foreignObject rectangle.
        // this.span = [
        //     this.coords.usrCoords.slice(0),
        //     [this.coords.usrCoords[0], this.W(), 0],
        //     [this.coords.usrCoords[0], 0, this.H()]
        // ];

        //this.parent = board.select(attributes.anchor);
        this.id = this.board.setId(this, 'Im');

        this.board.renderer.drawForeignObject(this);
        this.board.finalizeAdding(this);

        this.methodMap = JXG.deepCopy(this.methodMap, {
            addTransformation: 'addTransform',
            trans: 'addTransform'
        });
    };

    JXG.ForeignObject.prototype = new GeometryElement();
    Type.copyPrototypeMethods(JXG.ForeignObject, CoordsElement, 'coordsConstructor');

    JXG.extend(JXG.ForeignObject.prototype, /** @lends JXG.ForeignObject.prototype */ {

        /**
         * Checks whether (x,y) is over or near the image;
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is over the image, False otherwise.
         */
        hasPoint: function (x, y) {
            var dx, dy, r, type, prec,
                c, v, p, dot,
                len = this.transformations.length;

                if (Type.isObject(Type.evaluate(this.visProp.precision))) {
                    type = this.board._inputDevice;
                    prec = Type.evaluate(this.visProp.precision[type]);
                } else {
                    // 'inherit'
                    prec = this.board.options.precision.hasPoint;
                }

            // Easy case: no transformation
            if (len === 0) {
                dx = x - this.coords.scrCoords[1];
                dy = this.coords.scrCoords[2] - y;
                r = prec;

                return dx >= -r && dx - this.size[0] <= r &&
                       dy >= -r && dy - this.size[1] <= r;
            }

            // foreignObject is transformed
            c = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);
            // v is the vector from anchor point to the drag point
            c = c.usrCoords;
            v = [c[0] - this.span[0][0],
                c[1] - this.span[0][1],
                c[2] - this.span[0][2]];
            dot = Mat.innerProduct;   // shortcut

            // Project the drag point to the sides.
            p = dot(v, this.span[1]);
            if (0 <= p && p <= dot(this.span[1], this.span[1])) {
                p = dot(v, this.span[2]);

                if (0 <= p && p <= dot(this.span[2], this.span[2])) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Recalculate the coordinates of lower left corner and the width and height.
         *
         * @returns {JXG.GeometryElement} A reference to the element
         * @private
         */
        update: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }
            this.updateCoords(fromParent);
            this.updateSize();
            // this.updateSpan();
            return this;
        },

        /**
         * Send an update request to the renderer.
         * @private
         */
        updateRenderer: function () {
            return this.updateRendererGeneric('updateForeignObject');
        },

        /**
         * Updates the internal arrays containing size of the foreignObject.
         * @returns {JXG.GeometryElement} A reference to the element
         * @private
         */
        updateSize: function () {
            var bb;
            // this.usrSize = [this.W(), this.H()];
            // this.size = [Math.abs(this.usrSize[0] * this.board.unitX), Math.abs(this.usrSize[1] * this.board.unitY)];

            bb = this.rendNode.childNodes[0].getBoundingClientRect();
            this.size = [bb.width, bb.height];

            return this;
        },

        /**
         * Update the anchor point of the foreignObject, i.e. the lower left corner
         * and the two vectors which span the rectangle.
         * @returns {JXG.GeometryElement} A reference to the element
         * @private
         *
         */
        updateSpan: function () {
            var i, j, len = this.transformations.length, v = [];

            if (len === 0) {
                this.span = [[this.Z(), this.X(), this.Y()],
                    [this.Z(), this.W(), 0],
                    [this.Z(), 0, this.H()]];
            } else {
                // v contains the three defining corners of the rectangle/image
                v[0] = [this.Z(), this.X(), this.Y()];
                v[1] = [this.Z(), this.X() + this.W(), this.Y()];
                v[2] = [this.Z(), this.X(), this.Y() + this.H()];

                // Transform the three corners
                for (i = 0; i < len; i++) {
                    for (j = 0; j < 3; j++) {
                        v[j] = Mat.matVecMult(this.transformations[i].matrix, v[j]);
                    }
                }
                // Normalize the vectors
                for (j = 0; j < 3; j++) {
                    v[j][1] /= v[j][0];
                    v[j][2] /= v[j][0];
                    v[j][0] /= v[j][0];
                }
                // Compute the two vectors spanning the rectangle
                // by subtracting the anchor point.
                for (j = 1; j < 3; j++) {
                    v[j][0] -= v[0][0];
                    v[j][1] -= v[0][1];
                    v[j][2] -= v[0][2];
                }
                this.span = v;
            }

            return this;
        },

        addTransform: function (transform) {
            var i;

            if (Type.isArray(transform)) {
                for (i = 0; i < transform.length; i++) {
                    this.transformations.push(transform[i]);
                }
            } else {
                this.transformations.push(transform);
            }

            return this;
        },

        // Documented in element.js
        getParents: function () {
            var p = [this.url, [this.Z(), this.X(), this.Y()], this.usrSize];

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        },

        // /**
        //  * Set the width and height of the image. After setting a new size,
        //  * board.update() or image.fullUpdate()
        //  * has to be called to make the change visible.
        //  * @param  {number, function, string} width  Number, function or string
        //  *                            that determines the new width of the image
        //  * @param  {number, function, string} height Number, function or string
        //  *                            that determines the new height of the image
        //  * @returns {JXG.GeometryElement} A reference to the element
        //  *
        //  * @example
        //  * var im = board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg',
        //  *                                [-3,-2], [3,3]]);
        //  * im.setSize(4, 4);
        //  * board.update();
        //  *
        //  * </pre><div id="JXG8411e60c-f009-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
        //  * <script type="text/javascript">
        //  *     (function() {
        //  *         var board = JXG.JSXGraph.initBoard('JXG8411e60c-f009-11e5-b1bf-901b0e1b8723',
        //  *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
        //  *     var im = board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg', [-3,-2],    [3,3]]);
        //  *     //im.setSize(4, 4);
        //  *     //board.update();
        //  *
        //  *     })();
        //  *
        //  * </script><pre>
        //  *
        //  * @example
        //  * var p0 = board.create('point', [-3, -2]),
        //  *     im = board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg',
        //  *                     [function(){ return p0.X(); }, function(){ return p0.Y(); }],
        //  *                     [3,3]]),
        //  *     p1 = board.create('point', [1, 2]);
        //  *
        //  * im.setSize(function(){ return p1.X() - p0.X(); }, function(){ return p1.Y() - p0.Y(); });
        //  * board.update();
        //  *
        //  * </pre><div id="JXG4ce706c0-f00a-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
        //  * <script type="text/javascript">
        //  *     (function() {
        //  *         var board = JXG.JSXGraph.initBoard('JXG4ce706c0-f00a-11e5-b1bf-901b0e1b8723',
        //  *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
        //  *     var p0 = board.create('point', [-3, -2]),
        //  *         im = board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg',
        //  *                         [function(){ return p0.X(); }, function(){ return p0.Y(); }],
        //  *                         [3,3]]),
        //  *         p1 = board.create('point', [1, 2]);
        //  *
        //  *     im.setSize(function(){ return p1.X() - p0.X(); }, function(){ return p1.Y() - p0.Y(); });
        //  *     board.update();
        //  *
        //  *     })();
        //  *
        //  * </script><pre>
        //  *
        //  */
        // setSize: function(width, height) {
        //     this.W = Type.createFunction(width, this.board, '');
        //     this.H = Type.createFunction(height, this.board, '');

        //     return this;
        // },

        // /**
        //  * Returns the width of the foreignObject in user coordinates.
        //  * @returns {number} width of the image in user coordinates
        //  */
        // W: function() {},  // Needed for docs, defined in constructor

        // /**
        //  * Returns the height of the foreignObject in user coordinates.
        //  * @returns {number} height of the image in user coordinates
        //  */
        // H: function() {}  // Needed for docs, defined in constructor
    });

    /**
     * @class This element is used to provide a constructor for arbitrary content in
     * an SVG foreignObject container.
     * <p>
     *
     * @pseudo
     * @description
     * @name ForeignObject
     * @augments ForeignObject
     * @constructor
     * @type JXG.ForeignObject
     *
     * @param {number,function_number,function_String_String} x,y,label Parent elements for checkbox elements.
     *                     <p>
     *                     x and y are the coordinates of the lower left corner of the text box.
     *                      The position of the text is fixed,
     *                     x and y are numbers. The position is variable if x or y are functions.
     *                     <p>
     *                     The label of the input element may be given as string.
     *                     <p>
     *                     The value of the checkbox can be controlled with the attribute <tt>checked</tt>
     *                     <p>The HTML node can be accessed with <tt>element.rendNodeCheckbox</tt>
     *
     *
     */
    JXG.createForeignObject = function (board, parents, attributes) {
        var attr, fo,
            content = parents[0],
            coords = parents[1];
            // size = parents[2];

        attr = Type.copyAttributes(attributes, board.options, 'foreignobject');
        fo = CoordsElement.create(JXG.ForeignObject, board, coords, attr, content/*, size*/);
        if (!fo) {
            throw new Error("JSXGraph: Can't create foreignObject with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [x,y], [z,x,y], [element,transformation]");
        }

        return fo;
    };

    JXG.registerElement('foreignobject', JXG.createForeignObject);

    return {
        ForeignObject: JXG.ForeignObject,
        createForeignobject: JXG.createForeignObject
    };
});
