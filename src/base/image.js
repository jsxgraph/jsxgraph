/*
    Copyright 2008-2013
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
    'jxg', 'base/constants', 'base/coords', 'base/element', 'math/math', 'math/statistics', 'utils/type'
], function (JXG, Const, Coords, GeometryElement, Mat, Statistics, Type) {

    "use strict";

    /**
     * Construct and handle images
     * @class Image:
     * It inherits from @see GeometryElement.
     * @constructor
     */
    JXG.Image = function (board, url, coords, size, attributes) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_IMAGE, Const.OBJECT_CLASS_OTHER);

        this.initialCoords = new Coords(Const.COORDS_BY_USER, coords, this.board);  // Still needed?

        if (!Type.isFunction(coords[0]) && !Type.isFunction(coords[1])) {
            this.isDraggable = true;
        }
        this.X = Type.createFunction(coords[0], this.board, '');
        this.Y = Type.createFunction(coords[1], this.board, '');
        this.Z = Type.createFunction(1, this.board, '');
        this.W = Type.createFunction(size[0], this.board, '');
        this.H = Type.createFunction(size[1], this.board, '');
        this.coords = new Coords(Const.COORDS_BY_USER, [this.X(), this.Y()], this.board);
        this.usrSize = [this.W(), this.H()];
        this.size = [Math.abs(this.usrSize[0] * board.unitX), Math.abs(this.usrSize[1] * board.unitY)];
        this.url = url;

        this.elType = 'image';

        // span contains the anchor point and the two vectors
        // spanning the image rectangle.
        this.span = [
            [this.Z(), this.X(), this.Y()],
            [this.Z(), this.W(), 0],
            [this.Z(), 0, this.H()]
        ];

        this.parent = board.select(attributes.anchor);

        this.id = this.board.setId(this, 'Im');

        this.board.renderer.drawImage(this);
        if (!this.visProp.visible) {
            this.board.renderer.hide(this);
        }

        this.methodMap = JXG.deepCopy(this.methodMap, {
            addTransformation: 'addTransform',
            trans: 'addTransform'
        });
    };

    JXG.Image.prototype = new GeometryElement();

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
        update: function () {
            if (this.needsUpdate) {
                if (!this.visProp.frozen) {
                    this.updateCoords();
                }
                this.usrSize = [this.W(), this.H()];
                this.size = [Math.abs(this.usrSize[0] * this.board.unitX), Math.abs(this.usrSize[1] * this.board.unitY)];
                this.updateTransform();
                this.updateSpan();
            }
            return this;
        },

        /**
         * Send an update request to the renderer.
         */
        updateRenderer: function () {
            if (this.needsUpdate) {
                this.board.renderer.updateImage(this);
                this.needsUpdate = false;
            }

            return this;
        },

        updateTransform: function () {
            var i, len = this.transformations.length;

            if (len > 0) {
                for (i = 0; i < len; i++) {
                    this.transformations[i].update();
                }
            }

            return this;
        },

        /**
         * Updates the coordinates of the top left corner of the image.
         */
        updateCoords: function () {
            this.coords.setCoordinates(Const.COORDS_BY_USER, [this.X(), this.Y()]);
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
        },

        /**
         * Sets x and y coordinate of the image.
         * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units of the mouse/touch position
         * @param {Array} oldcoords coordinates in screen/user units of the previous mouse/touch position
         * @returns {JXG.Image} this element
         */
        setPositionDirectly: function (method, coords, oldcoords) {
            var dc,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board),
                v = [this.Z(), this.X(), this.Y()];

            dc = Statistics.subtract(c.usrCoords, oldc.usrCoords);

            this.X = Type.createFunction(v[1] + dc[1], this.board, '');
            this.Y = Type.createFunction(v[2] + dc[2], this.board, '');

            return this;
        }

    });

    /**
     * @class Displays an image.
     * @pseudo
     * @description Shows an image. The image can be supplied as an URL or an base64 encoded inline image
     * like "data:image/png;base64, /9j/4AAQSkZJRgA..." or a function returning an URL: function(){ return 'xxx.png; }.
     * @constructor
     * @name Image
     * @type JXG.Image
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {String_Array_Array} url,_topleft,_widthheight url defines the location of the image data. Optional topleft and
     * widthheight define the user coordinates of the top left corner and the image's width and height.
     * @example
     * var im = board.create('image', ['http://geonext.uni-bayreuth.de/fileadmin/geonext/design/images/logo.gif', [-3,1],[5,5]]);
     *
     * </pre><div id="9850cda0-7ea0-4750-981c-68bacf9cca57" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *   var image_board = JXG.JSXGraph.initBoard('9850cda0-7ea0-4750-981c-68bacf9cca57', {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false});
     *   var image_im = image_board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg', [-3,1],[5,5]]);
     * </script><pre>
     */
    JXG.createImage = function (board, parents, attributes) {
        var attr, im;

        attr = Type.copyAttributes(attributes, board.options, 'image');
        im = new JXG.Image(board, parents[0], parents[1], parents[2], attr);

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