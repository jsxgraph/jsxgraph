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
JXG.Image = function (board, imageBase64String, coordinates, size, displayLevel, id, name, el) {
    //this.constructor();
    this.type = JXG.OBJECT_TYPE_IMAGE;
    this.elementClass = JXG.OBJECT_CLASS_OTHER;                
    this.transformations = [];

    this.init(board, id, name);
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);
    this.initialCoords = new JXG.Coords(JXG.COORDS_BY_USER, coordinates, this.board);
    this.size = [size[0]*board.stretchX,size[1]*board.stretchY];
    this.imageBase64String = imageBase64String;
    this.displayLevel = displayLevel;
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

JXG.createImage = function(board, parentArr, atts) {
//    return new JXG.Image(board, atts['imageString'], parentArr[0], parentArr[1], 'images', atts['id'], atts['name']);
    return new JXG.Image(board, atts['imageString'], parentArr[0], parentArr[1], 'images', false, false, undefined);
};

JXG.JSXGraph.registerElement('image', JXG.createImage);
