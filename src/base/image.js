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
 * @fileoverview In this file the geometry element Image is defined.
 */

import JXG from "../jxg.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import GeometryElement from "./element.js";
import Mat from "../math/math.js";
import Type from "../utils/type.js";
import CoordsElement from "./coordselement.js";

/**
 * Construct and handle images
 *
 * The image can be supplied as an URL or an base64 encoded inline image
 * like "data:image/png;base64, /9j/4AAQSkZJRgA..." or a function returning
 * an URL: function(){ return 'xxx.png; }.
 *
 * @class Creates a new image object. Do not use this constructor to create a image. Use {@link JXG.Board#create} with
 * type {@link Image} instead.
 * @augments JXG.GeometryElement
 * @augments JXG.CoordsElement
 * @param {string|JXG.Board} board The board the new image is drawn on.
 * @param {Array} coordinates An array with the user coordinates of the image.
 * @param {Object} attributes An object containing visual and - optionally - a name and an id.
 * @param {string|function} url An URL string or a function returning an URL string.
 * @param  {Array} size Array containing width and height of the image in user coordinates.
 *
 */
JXG.Image = function (board, coords, attributes, url, size) {
    this.constructor(board, attributes, Const.OBJECT_TYPE_IMAGE, Const.OBJECT_CLASS_OTHER);
    this.element = this.board.select(attributes.anchor);
    this.coordsConstructor(coords);

    this.W = Type.createFunction(size[0], this.board, "");
    this.H = Type.createFunction(size[1], this.board, "");
    this.addParentsFromJCFunctions([this.W, this.H]);

    this.usrSize = [this.W(), this.H()];

    /**
     * Array of length two containing [width, height] of the image in pixel.
     * @type array
     */
    this.size = [
        Math.abs(this.usrSize[0] * board.unitX),
        Math.abs(this.usrSize[1] * board.unitY)
    ];

    /**
     * 'href' of the image. This might be an URL, but also a data-uri is allowed.
     * @type string
     */
    this.url = url;

    this.elType = 'image';

    // span contains the anchor point and the two vectors
    // spanning the image rectangle.
    this.span = [
        this.coords.usrCoords.slice(0),
        [this.coords.usrCoords[0], this.W(), 0],
        [this.coords.usrCoords[0], 0, this.H()]
    ];

    //this.parent = board.select(attributes.anchor);
    this.id = this.board.setId(this, 'Im');

    this.board.renderer.drawImage(this);
    this.board.finalizeAdding(this);

    this.methodMap = JXG.deepCopy(this.methodMap, {
        addTransformation: "addTransform",
        trans: "addTransform",
        W: "W",
        Width: "W",
        H: "H",
        Height: "H",
        setSize: "setSize"
    });
};

JXG.Image.prototype = new GeometryElement();
Type.copyPrototypeMethods(JXG.Image, CoordsElement, 'coordsConstructor');

JXG.extend(
    JXG.Image.prototype,
    /** @lends JXG.Image.prototype */ {
        /**
         * Checks whether (x,y) is over or near the image;
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is over the image, False otherwise.
         */
        hasPoint: function (x, y) {
            var dx,
                dy,
                r,
                type,
                prec,
                c,
                v,
                p,
                dot,
                len = this.transformations.length;

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                prec = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                prec = this.board.options.precision.hasPoint;
            }

            // Easy case: no transformation
            if (len === 0) {
                dx = x - this.coords.scrCoords[1];
                dy = this.coords.scrCoords[2] - y;
                r = prec;

                return dx >= -r && dx - this.size[0] <= r && dy >= -r && dy - this.size[1] <= r;
            }

            // Image is transformed
            c = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);
            // v is the vector from anchor point to the drag point
            c = c.usrCoords;
            v = [c[0] - this.span[0][0], c[1] - this.span[0][1], c[2] - this.span[0][2]];
            dot = Mat.innerProduct; // shortcut

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
            this.updateSpan();

            return this;
        },

        /**
         * Send an update request to the renderer.
         * @private
         */
        updateRenderer: function () {
            return this.updateRendererGeneric('updateImage');
        },

        /**
         * Updates the internal arrays containing size of the image.
         * @returns {JXG.GeometryElement} A reference to the element
         * @private
         */
        updateSize: function () {
            this.usrSize = [this.W(), this.H()];
            this.size = [
                Math.abs(this.usrSize[0] * this.board.unitX),
                Math.abs(this.usrSize[1] * this.board.unitY)
            ];

            return this;
        },

        /**
         * Update the anchor point of the image, i.e. the lower left corner
         * and the two vectors which span the rectangle.
         * @returns {JXG.GeometryElement} A reference to the element
         * @private
         *
         */
        updateSpan: function () {
            var i, j,
                len = this.transformations.length,
                v = [];

            if (len === 0) {
                this.span = [
                    [this.Z(), this.X(), this.Y()],
                    [this.Z(), this.W(), 0],
                    [this.Z(), 0, this.H()]
                ];
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

        /**
         * Set the width and height of the image. After setting a new size,
         * board.update() or image.fullUpdate()
         * has to be called to make the change visible.
         * @param  {number|function|string} width  Number, function or string
         *                            that determines the new width of the image
         * @param  {number|function|string} height Number, function or string
         *                            that determines the new height of the image
         * @returns {JXG.GeometryElement} A reference to the element
         *
         * @example
         * var im = board.create('image', ['https://jsxgraph.org/distrib/images/uccellino.jpg',
         *                                [-3,-2], [3,3]]);
         * im.setSize(4, 4);
         * board.update();
         *
         * </pre><div id="JXG8411e60c-f009-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG8411e60c-f009-11e5-b1bf-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var im = board.create('image', ['https://jsxgraph.org/distrib/images/uccellino.jpg', [-3,-2],    [3,3]]);
         *     //im.setSize(4, 4);
         *     //board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var p0 = board.create('point', [-3, -2]),
         *     im = board.create('image', ['https://jsxgraph.org/distrib/images/uccellino.jpg',
         *                     [function(){ return p0.X(); }, function(){ return p0.Y(); }],
         *                     [3,3]]),
         *     p1 = board.create('point', [1, 2]);
         *
         * im.setSize(function(){ return p1.X() - p0.X(); }, function(){ return p1.Y() - p0.Y(); });
         * board.update();
         *
         * </pre><div id="JXG4ce706c0-f00a-11e5-b1bf-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG4ce706c0-f00a-11e5-b1bf-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p0 = board.create('point', [-3, -2]),
         *         im = board.create('image', ['https://jsxgraph.org/distrib/images/uccellino.jpg',
         *                         [function(){ return p0.X(); }, function(){ return p0.Y(); }],
         *                         [3,3]]),
         *         p1 = board.create('point', [1, 2]);
         *
         *     im.setSize(function(){ return p1.X() - p0.X(); }, function(){ return p1.Y() - p0.Y(); });
         *     board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         */
        setSize: function (width, height) {
            this.W = Type.createFunction(width, this.board, "");
            this.H = Type.createFunction(height, this.board, "");
            this.addParentsFromJCFunctions([this.W, this.H]);
            // this.fullUpdate();

            return this;
        },

        /**
         * Returns the width of the image in user coordinates.
         * @returns {number} width of the image in user coordinates
         */
        W: function () {}, // Needed for docs, defined in constructor

        /**
         * Returns the height of the image in user coordinates.
         * @returns {number} height of the image in user coordinates
         */
        H: function () {} // Needed for docs, defined in constructor
    }
);

/**
 * @class Display of an external image.
 * @pseudo
 * @name Image
 * @type JXG.Image
 * @augments JXG.Image
 * @constructor
 * @constructor
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {string,function_Array_Array} url,coords,size url defines the location of the image data. The array coords contains the user coordinates
 * of the lower left corner of the image.
 *   It can consist of two or three elements of type number, a string containing a GEONE<sub>x</sub>T
 *   constraint, or a function which takes no parameter and returns a number. Every element determines one coordinate. If a coordinate is
 *   given by a number, the number determines the initial position of a free image. If given by a string or a function that coordinate will be constrained
 *   that means the user won't be able to change the image's position directly by mouse because it will be calculated automatically depending on the string
 *   or the function's return value. If two parent elements are given the coordinates will be interpreted as 2D affine Euclidean coordinates, if three such
 *   parent elements are given they will be interpreted as homogeneous coordinates.
 * <p>
 * The array size defines the image's width and height in user coordinates.
 * @example
 * var im = board.create('image', ['https://jsxgraph.org/jsxgraph/distrib/images/uccellino.jpg', [-3,-2], [3,3]]);
 *
 * </pre><div class="jxgbox" id="JXG9850cda0-7ea0-4750-981c-68bacf9cca57" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var image_board = JXG.JSXGraph.initBoard('JXG9850cda0-7ea0-4750-981c-68bacf9cca57', {boundingbox: [-4, 4, 4, -4], axis: true, showcopyright: false, shownavigation: false});
 *   var image_im = image_board.create('image', ['https://jsxgraph.org/distrib/images/uccellino.jpg', [-3,-2],[3,3]]);
 * </script><pre>
 */
JXG.createImage = function (board, parents, attributes) {
    var attr,
        im,
        url = parents[0],
        coords = parents[1],
        size = parents[2];

    attr = Type.copyAttributes(attributes, board.options, 'image');
    im = CoordsElement.create(JXG.Image, board, coords, attr, url, size);
    if (!im) {
        throw new Error(
            "JSXGraph: Can't create image with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [x,y], [z,x,y], [element,transformation]"
        );
    }

    if (attr.rotate !== 0) {
        // This is the default value, i.e. no rotation
        im.addRotation(attr.rotate);
    }

    return im;
};

JXG.registerElement("image", JXG.createImage);

export default JXG.Image;
// export default {
//     Image: JXG.Image,
//     createImage: JXG.createImage
// };
