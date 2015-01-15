/*
    Copyright 2008-2015
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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 base/element
 math/math
 math/statistics
 utils/type
 */

/**
 * @fileoverview In this file the geometry element Image is defined.
 */

define([
    'jxg', 'base/constants', 'base/coords', 'base/element', 'math/math', 'math/statistics', 'utils/type', 'base/coordselement'
], function (JXG, Const, Coords, GeometryElement, Mat, Statistics, Type, CoordsElement) {

    "use strict";

    /**
     * Construct and handle images
     * The coordinates can be relative to the coordinates of an element 
     * given in {@link JXG.Options#text.anchor}.
     * 
     * The image can be supplied as an URL or an base64 encoded inline image
     * like "data:image/png;base64, /9j/4AAQSkZJRgA..." or a function returning 
     * an URL: function(){ return 'xxx.png; }.
     *      
     * @class Creates a new image object. Do not use this constructor to create a image. Use {@link JXG.Board#create} with
     * type {@link Image} instead.
     * @augments JXG.GeometryElement
     * @augments JXG.CoordsElement
     * @param {string|JXG.Board} board The board the new text is drawn on.
     * @param {Array} coordinates An array with the user coordinates of the text.
     * @param {Object} attributes An object containing visual and - optionally - a name and an id.
     * @param {string|function} url An URL string or a function returning an URL string.
     * @param  {Array} size Array containing width and height of the image in user coordinates.
     *
     */
    JXG.Image = function (board, coords, attributes, url, size) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_IMAGE, Const.OBJECT_CLASS_OTHER);
        this.element = this.board.select(attributes.anchor);
        this.coordsConstructor(coords);

        this.W = Type.createFunction(size[0], this.board, '');
        this.H = Type.createFunction(size[1], this.board, '');
        this.usrSize = [this.W(), this.H()];
        this.size = [Math.abs(this.usrSize[0] * board.unitX), Math.abs(this.usrSize[1] * board.unitY)];
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
            addTransformation: 'addTransform',
            trans: 'addTransform'
        });
    };

    JXG.Image.prototype = new GeometryElement();
    Type.copyPrototypeMethods(JXG.Image, CoordsElement, 'coordsConstructor');

    JXG.extend(JXG.Image.prototype, /** @lends JXG.Image.prototype */ {

        /**
         * Checks whether (x,y) is over or near the image;
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @return {Boolean} True if (x,y) is over the image, False otherwise.
         */
        hasPoint: function (x, y) {
            var dx, dy, r,
                c, v, p, dot,
                len = this.transformations.length;

            // Easy case: no transformation
            if (len === 0) {
                dx = x - this.coords.scrCoords[1];
                dy = this.coords.scrCoords[2] - y;
                r = this.board.options.precision.hasPoint;

                return dx >= -r && dx - this.size[0] <= r &&
                    dy >= -r && dy - this.size[1] <= r;
            }

            // Image is transformed
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
         * Recalculate the coordinates of lower left corner and the width amd the height.
         * @private
         */
        update: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }

            this.updateCoords(fromParent);
            this.usrSize = [this.W(), this.H()];
            this.size = [Math.abs(this.usrSize[0] * this.board.unitX), Math.abs(this.usrSize[1] * this.board.unitY)];
            this.updateSpan();

            return this;
        },

        /**
         * Send an update request to the renderer.
         */
        updateRenderer: function () {
            return this.updateRendererGeneric('updateImage');
        },

        /**
         * Updates the size of the image.
         */
        updateSize: function () {
            this.coords.setCoordinates(Const.COORDS_BY_USER, [this.W(), this.H()]);
        },

        /**
         * Update the anchor point of the image, i.e. the lower left corner
         * and the two vectors which span the rectangle.
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
        }
    });

    /**
     * @class Displays an image.
     * @pseudo
     * @description 
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
     *   given by a number, the number determines the initial position of a free text. If given by a string or a function that coordinate will be constrained
     *   that means the user won't be able to change the texts's position directly by mouse because it will be calculated automatically depending on the string
     *   or the function's return value. If two parent elements are given the coordinates will be interpreted as 2D affine Euclidean coordinates, if three such
     *   parent elements are given they will be interpreted as homogeneous coordinates.
     * <p>
     * The array size defines the image's width and height in user coordinates.
     * @example
     * var im = board.create('image', ['http://jsxgraph.uni-bayreuth.de/jsxgraph/distrib/images/uccellino.jpg', [-3,-2], [3,3]]);
     *
     * </pre><div id="9850cda0-7ea0-4750-981c-68bacf9cca57" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var image_board = JXG.JSXGraph.initBoard('9850cda0-7ea0-4750-981c-68bacf9cca57', {boundingbox: [-4, 4, 4, -4], axis: true, showcopyright: false, shownavigation: false});
     *   var image_im = image_board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg', [-3,-2],[3,3]]);
     * </script><pre>
     */
    JXG.createImage = function (board, parents, attributes) {
        var attr, im,
            url = parents[0],
            coords = parents[1],
            size = parents[2];

        attr = Type.copyAttributes(attributes, board.options, 'image');
        im = CoordsElement.create(JXG.Image, board, coords, attr, url, size);
        if (!im) {
            throw new Error("JSXGraph: Can't create image with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [x,y], [z,x,y], [element,transformation]");
        }

        if (Type.evaluate(attr.rotate) !== 0) {
            im.addRotation(Type.evaluate(attr.rotate));
        }

        return im;
    };

    JXG.registerElement('image', JXG.createImage);

    return {
        Image: JXG.Image,
        createImage: JXG.createImage
    };
});
