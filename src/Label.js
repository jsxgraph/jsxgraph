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
 * @fileoverview In this file the Label object is defined. Label keeps all information
 * and methods necessary to display, hide and alter a label for the geometry objects.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Label object.
 * @class This is the Label class. It stores all properties required
 * to display, hide and alter a label.
 * @constructor
 * @param {String,JXG.Board} board The board the new label is drawn on.
 * @param {String} name Not necessarily unique name for the label. That is the information
 * that will be printed on the drawing.
 * @param {JXG.Coords} coordinates Coordinates for the label in user coordinates.
 * @param {String} id Unique identifier for the label.
 */
JXG.Label = function (board, name, coordinates, id) {
    /*
     * Parameter magic, if board is a string, assume it is an if of an object of
     * type Board an get the boards reference.
     */
    if (typeof(board) == 'string') {
        board = JXG.Geonext.boards[board];
    }
    
    /**
     * Reference to board where the label is drawn.
     * @type JXG.Board
     * @see JXG.Board
     */
    this.board = board;

    /**
     * Unique identifier for the label. Equivalent to id-attribute of renderer element.
     * @type String
     */
    this.id = id;

    /**
     * Not necessarily unique name for the label
     * @type String
     */
    this.name = name+"Label";
    this.nameHTML = this.board.algebra.replaceSup(this.board.algebra.replaceSub(name));

    /**
     * Distance from labeled element in x direction in screen coordinates.
     * @type int
     */
    this.distanceX = 10;

    /**
     * Distance from labeled element in y direction in screen coordinates.
     * @type int
     */
    this.distanceY = 10;

    /**
     * Coordinates of the label.
     * @type JXG.Coords
     */
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER,
                             [coordinates.usrCoords[1]*1+this.distanceX/(this.board.unitX*this.board.zoomX),
                              coordinates.usrCoords[2]*1+this.distanceY/(this.board.unitY*this.board.zoomY)],
                             this.board);

    /**
     * Is this label visible?
     * @type bool
     */
    this.show = true;

    this.color = '#000000';

    /**
     * Is this label visible?
     * @type bool
     */    
    this.hiddenByParent = false;
};

/**
 * Hide the label.
 */
JXG.Label.prototype.hideElement = function() {
    this.show = false;
    this.board.renderer.hide(this);    
};

/**
 * Show the label.
 */
JXG.Label.prototype.showElement = function() {
    this.show = true;
    this.board.renderer.show(this);    
};

/**
 * Set the coordinates of the label. This is required because there is some computation needed to
 * get the label to the rigth place.
 * @param {JXG.Coords} coordinates Coordinates for the label.
 */
JXG.Label.prototype.setCoordinates = function(coordinates) {
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER,
                             [coordinates.usrCoords[1]*1+this.distanceX/(this.board.unitX*this.board.zoomX),
                              coordinates.usrCoords[2]*1+this.distanceY/(this.board.unitY*this.board.zoomY)],
                             this.board);
};
