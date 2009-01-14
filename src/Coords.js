/* 
    Copyright 2008, 
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
 * @fileoverview In this file the Coords object is defined, a class to manage all
 * properties and methods coordinates usually have.
 * @author graphjs
 * @version 0.1
 */

JXG.COORDS_BY_USER = 0x0001;
JXG.COORDS_BY_SCREEN = 0x0002;

/**
 * Constructs a new Coordinates object.
 * @class This is the Coordinates class.  
 * All members a coordinate has to provide
 * are defined here.
 * @param {int} method The type of coordinates given by the user. Accepted values are <b>COORDS_BY_SCREEN</b> and <b>COORDS_BY_USER</b>.
 * @param {Array} coordinates An array of affine coordinates.
 * @param {AbstractRenderer} renderer A reference to a Renderer.
 * @constructor
 */
JXG.Coords = function (method, coordinates, board) {
    /**
     * Stores the board the object is used on.
     * @type Board
     */
    this.board = board;
    
    /**
     * Stores coordinates for user view as homogeneous coordinates.
     * @type Array
     */
    this.usrCoords = [1,0,0];
    /**
     * Stores coordinates for screen view as homogeneous coordinates.
     * @type Array
     */
    this.scrCoords = [1,0,0];
    
    if(method == JXG.COORDS_BY_USER) {
        if (coordinates.length<=2) {
            this.usrCoords[1] = coordinates[0];
            this.usrCoords[2] = coordinates[1];
        } else {  // homogeneous coordinates
            this.usrCoords[0] = coordinates[0];
            this.usrCoords[1] = coordinates[1];
            this.usrCoords[2] = coordinates[2];
            this.normalizeUsrCoords();
        }
        this.usr2screen();
    } else {
        this.scrCoords[1] = coordinates[0];
        this.scrCoords[2] = coordinates[1];
        this.screen2usr();
    }
};

/**
    * Normalize homogeneous coordinates
    * @private
    */
JXG.Coords.prototype.normalizeUsrCoords = function() {
    var eps = 0.000001;
    if (Math.abs(this.usrCoords[0])>eps) {
        this.usrCoords[1] /= this.usrCoords[0];
        this.usrCoords[2] /= this.usrCoords[0];
        this.usrCoords[0] = 1.0;
    }
};

/**
 * Compute screen coordinates out of given user coordinates.
 * @private
 */
JXG.Coords.prototype.usr2screen = function() {
    this.scrCoords[0] = Math.round(this.usrCoords[0]);
    this.scrCoords[1] = Math.round(this.usrCoords[0]*this.board.origin.scrCoords[1] + this.usrCoords[1]*this.board.unitX*this.board.zoomX);
    this.scrCoords[2] = Math.round(this.usrCoords[0]*this.board.origin.scrCoords[2] - this.usrCoords[2]*this.board.unitY*this.board.zoomY);
};

/**
 * Compute user coordinates out of given screen coordinates.
 * @private
 */
JXG.Coords.prototype.screen2usr = function() {
    this.usrCoords[0] =  1.0;
    this.usrCoords[1] = (this.scrCoords[1] - this.board.origin.scrCoords[1])/(this.board.unitX*this.board.zoomX);
    this.usrCoords[2] = (this.board.origin.scrCoords[2] - this.scrCoords[2])/(this.board.unitY*this.board.zoomY);
};

/**
 * Calculate distance of one point to another.
 * @param {int} method The type of coordinates used here. Possible values are <b>COORDS_BY_USER</b> and <b>COORDS_BY_SCREEN</b>.
 * @param {Coords} coordinates The Coords object to which the distance is calculated.
 */
JXG.Coords.prototype.distance = function(method, coordinates) {
    var sum = 0;
    if(method == JXG.COORDS_BY_USER) {
//        if (Math.abs(this.usrCoords[0]+coordinates.usrCoords[0])>eps) {
//            return Infinity;
//        }
        for(var i=0; i<=this.board.dimension; i++) {
            sum += (this.usrCoords[i] - coordinates.usrCoords[i])*(this.usrCoords[i] - coordinates.usrCoords[i]);
        }
    } else {
//        if (Math.abs(this.scrCoords[0]+coordinates.scrCoords[0])>eps) {
//            return Infinity;
//        }
        for(var i=0; i<=this.board.dimension; i++) {
            sum += (this.scrCoords[i] - coordinates.scrCoords[i])*(this.scrCoords[i] - coordinates.scrCoords[i]);
        }
    }

    return Math.sqrt(sum);
};

/**
 * Set coordinates by method
 * @param {int} method The type of coordinates used here. Possible values are <b>COORDS_BY_USER</b> and <b>COORDS_BY_SCREEN</b>.
 * @param {Array} coordinates An array of affine coordinates the Coords object is set to.
 */
JXG.Coords.prototype.setCoordinates = function(method, coordinates) {
    if(method == JXG.COORDS_BY_USER) {
/*        for(var i=1; i<this.board.dimension+1; i++) {
            this.usrCoords[i] = coordinates[i-1];
        }*/
        this.usrCoords[1] = coordinates[0];
        this.usrCoords[2] = coordinates[1];
        this.usr2screen();
    } else {
/*        for(var i=1; i<this.board.dimension+1; i++) {
            this.scrCoords[i] = coordinates[i-1];
        }*/
        this.scrCoords[1] = coordinates[0];
        this.scrCoords[2] = coordinates[1];
        this.screen2usr();
    }
};