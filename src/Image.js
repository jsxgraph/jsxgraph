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
 * @author graphjs
 * @version 0.1
 */

/**
 * Construct and handle images
 * @class Image:
 * It inherits from @see GeometryElement.
 * @constructor
 * @return A new geometry element Image
 */
JXG.Image = function (board, url, coordinates, size, layer, id, name, el) {
    //this.constructor();
    this.type = JXG.OBJECT_TYPE_IMAGE;
    this.elementClass = JXG.OBJECT_CLASS_OTHER;                
    this.transformations = [];

    this.init(board, id, name);
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);
    this.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);
    this.size = [size[0]*board.stretchX,size[1]*board.stretchY];
    //this.imageBase64String = url; //imageBase64String;
    this.url = url;
    /**
     * Set the display layer.
     */
    if (layer == null) layer = board.options.layer['image'];
    this.layer = layer;
    this.parent = el;
    this.visProp['visible'] = true;
    //this.show = true; // noch noetig? BV
    this.id = this.board.addImage(this);
};

JXG.Image.prototype = new JXG.GeometryElement;

/**
 * Empty function (for the moment). It is needed for highlighting, a feature not used for images right now.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @return Always returns false
 */
JXG.Image.prototype.hasPoint = function (x,y) {
    return false;
};

/**
 * Send an update request to the renderer.
 */
JXG.Image.prototype.updateRenderer = function () {
    this.updateTransform();
    this.board.renderer.updateImage(this);
};

JXG.Image.prototype.updateTransform = function () {
    if (this.transformations.length==0) {
        return;
    }
    for (var i=0;i<this.transformations.length;i++) {
        this.transformations[i].update();
    }
};

JXG.Image.prototype.addTransform = function (transform) {
    if (JXG.isArray(transform)) {
        for (var i=0;i<transform.length;i++) {
            this.transformations.push(transform[i]);
        }
    } else {
        this.transformations.push(transform);
    }
};

/**
 * @class Displays an image. 
 * @pseudo
 * @description Shows an imgae. The image can be supplied as an URL or an base64 encoded inline image
 * like "data:image/png;base64, /9j/4AAQSkZJRgA...".
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
 *   var image_im = image_board.create('image', ['http://geonext.uni-bayreuth.de/fileadmin/geonext/design/images/logo.gif', [-3,1],[5,5]]);
 * </script><pre>
 */
JXG.createImage = function(board, parents, atts) {
    var url;
    if (atts==null) {
        atts = {};
    } else if (atts['imageString']!=null) {
        url = atts['imageString'];
    }
    if (typeof atts['layer'] == 'undefined') {
        atts['layer'] = null;
    }
    return new JXG.Image(board, parents[0], parents[1], parents[2], atts['layer'], false, false, undefined);
};

JXG.JSXGraph.registerElement('image', JXG.createImage);
