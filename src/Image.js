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
 * @fileoverview In this file the geometry element Image is defined.
 */

/**
 * Construct and handle images
 * @class Image:
 * It inherits from @see GeometryElement.
 * @constructor
 */
JXG.Image = function (board, url, coords, size, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_IMAGE, JXG.OBJECT_CLASS_OTHER);

    this.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, coords, this.board);  // Still needed?

    if (!JXG.isFunction(coords[0]) && !JXG.isFunction(coords[1])) {
        this.isDraggable = true;
    }
    this.X = JXG.createFunction(coords[0],this.board,'');
    this.Y = JXG.createFunction(coords[1],this.board,'');
    this.W = JXG.createFunction(size[0],this.board,'');
    this.H = JXG.createFunction(size[1],this.board,'');
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.X(),this.Y()], this.board);
    this.updateCoords = new Function('','this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.X(),this.Y()]);');
    this.updateSize = new Function('','this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.W(),this.H()]);');
    this.usrSize = [this.W(), this.H()];
    this.size = [this.usrSize[0]*board.unitX,this.usrSize[1]*board.unitY];
    this.url = url;

    this.parent = JXG.getRef(attributes.anchor);

    this.id = this.board.setId(this, 'Im');

    this.board.renderer.drawImage(this);
    if(!this.visProp.visible) {
       this.board.renderer.hide(this);
    }
};

JXG.Image.prototype = new JXG.GeometryElement;

JXG.extend(JXG.Image.prototype, /** @lends JXG.Image.prototype */ {

    /**
     * Checks whether (x,y) is over or near the image;
     * @param {int} x Coordinate in x direction, screen coordinates.
     * @param {int} y Coordinate in y direction, screen coordinates.
     * @return Always returns false
     */
    hasPoint: function (x,y) {
        var dx = x-this.coords.scrCoords[1],
            dy = this.coords.scrCoords[2]-y,
            r = this.board.options.precision.hasPoint;

        if (dx>=-r && dx/*-this.size[0]*/<=2*r && 
            dy>=-r && dy/*-this.size[1]*/<=r) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * Recalculate the coordinates of lower left corner and the width amd the height.
     * @private
     */
    update: function () {
        if (this.needsUpdate) {
            this.updateCoords();
            this.usrSize = [this.W(), this.H()];
            this.size = [this.usrSize[0]*this.board.unitX,this.usrSize[1]*this.board.unitY];
            this.updateTransform();
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
        if (this.transformations.length==0) {
            return;
        }
        for (var i=0;i<this.transformations.length;i++) {
            this.transformations[i].update();
        }
    },

    addTransform: function (transform) {
        if (JXG.isArray(transform)) {
            for (var i=0;i<transform.length;i++) {
                this.transformations.push(transform[i]);
            }
        } else {
            this.transformations.push(transform);
        }
    },
    
    /**
     * Sets x and y coordinate of the image.
     * @param {number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
     * @param {Array} coords coordinate in screen/user units
     * @returns {JXG.Image}
     */
    setPositionDirectly: function (method, coords) {
        var coords = new JXG.Coords(method, coords, this.board);
            
        this.X = JXG.createFunction(coords.usrCoords[1], this.board, '');
        this.Y = JXG.createFunction(coords.usrCoords[2], this.board, '');

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
 * @param {String_Array_Array} url, [position of the top left vertice], [width,height] 
 * @example
 * var im = board.create('image', ['http://geonext.uni-bayreuth.de/fileadmin/geonext/design/images/logo.gif', [-3,1],[5,5]]);
 *
 * </pre><div id="9850cda0-7ea0-4750-981c-68bacf9cca57" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var image_board = JXG.JSXGraph.initBoard('9850cda0-7ea0-4750-981c-68bacf9cca57', {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false});
 *   var image_im = image_board.create('image', ['http://jsxgraph.uni-bayreuth.de/distrib/images/uccellino.jpg', [-3,1],[5,5]]);
 * </script><pre>
 */
JXG.createImage = function(board, parents, attributes) {
    var url, attr, im;
    attr = JXG.copyAttributes(attributes, board.options, 'image');
    im = new JXG.Image(board, parents[0], parents[1], parents[2], attr);
    
    if (JXG.evaluate(attr.rotate) != 0) {
        im.addRotation(JXG.evaluate(attr.rotate));
    }
    
    return im;
};

JXG.JSXGraph.registerElement('image', JXG.createImage);
