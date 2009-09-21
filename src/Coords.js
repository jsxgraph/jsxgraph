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
 * @param {JXG.AbstractRenderer} renderer A reference to a Renderer.
 * @constructor
 */
JXG.Coords = function (method, coordinates, board) {
    /**
     * Stores the board the object is used on.
     * @type JXG.Board
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
JXG.Coords.prototype.usr2screen = function(doRound) {
    var mround = Math.round,  // Is faster on IE, maybe slower with JIT compilers
        b = this.board,
        uc = this.usrCoords,
        oc = this.board.origin.scrCoords;
        
    if (doRound==null || doRound) {
        this.scrCoords[0] = mround(uc[0]);
        this.scrCoords[1] = mround(uc[0]*oc[1] + uc[1]*b.stretchX);
        this.scrCoords[2] = mround(uc[0]*oc[2] - uc[2]*b.stretchY);
    } else {
        this.scrCoords[0] = uc[0];
        this.scrCoords[1] = uc[0]*oc[1] + uc[1]*b.stretchX;
        this.scrCoords[2] = uc[0]*oc[2] - uc[2]*b.stretchY;
    }
};

/**
 * Compute user coordinates out of given screen coordinates.
 * @private
 */
JXG.Coords.prototype.screen2usr = function() {
    var o = this.board.origin.scrCoords,
        sc = this.scrCoords,
        b = this.board;
    this.usrCoords[0] =  1.0;
    this.usrCoords[1] = (sc[1] - o[1])/b.stretchX;
    this.usrCoords[2] = (o[2] - sc[2])/b.stretchY;
};

/**
 * Calculate distance of one point to another.
 * @param {int} method The type of coordinates used here. Possible values are <b>JXG.COORDS_BY_USER</b> and <b>JXG.COORDS_BY_SCREEN</b>.
 * @param {JXG.Coords} coordinates The Coords object to which the distance is calculated.
 */
JXG.Coords.prototype.distance = function(meth, crd) {
    var sum = 0,
        c,
        ucr = this.usrCoords,
        scr = this.scrCoords,
        f;
        
    if (meth == JXG.COORDS_BY_USER) {
        c = crd.usrCoords;
        f = ucr[0]-c[0];
        sum = f*f;
        f = ucr[1]-c[1];
        sum += f*f;
        f = ucr[2]-c[2];
        sum += f*f;
    } else {
        c = crd.scrCoords;
        f = scr[0]-c[0];
        sum = f*f;
        f = scr[1]-c[1];
        sum += f*f;
        f = scr[2]-c[2];
        sum += f*f;
    }

    /*
    if (meth == JXG.COORDS_BY_USER) {
//        if (Math.abs(this.usrCoords[0]+coordinates.usrCoords[0])>eps) {
//            return Infinity;
//        }
        for (i=0; i<=this.board.dimension; i++) {
            f = this.usrCoords[i] - coordinates.usrCoords[i];
            sum += f*f;
        }
    } else {
//        if (Math.abs(this.scrCoords[0]+coordinates.scrCoords[0])>eps) {
//            return Infinity;
//        }
        for (i=0; i<=this.board.dimension; i++) {
            f = this.scrCoords[i] - coordinates.scrCoords[i];
            sum += f*f;
        }
    }
    */
    
    return Math.sqrt(sum);
};

/**
 * Set coordinates by method
 * @param {int} method The type of coordinates used here. Possible values are <b>COORDS_BY_USER</b> and <b>COORDS_BY_SCREEN</b>.
 * @param {Array} coordinates An array of affine coordinates the Coords object is set to.
 * @param {boolean} optional flag If true or null round the coordinates in usr2screen. This is used in smooth curve plotting.
 * The IE needs rounded coordinates. Id doRound==false we have to round in updatePathString.
 */
JXG.Coords.prototype.setCoordinates = function(method, crd, doRound) {
    var uc = this.usrCoords,
        sc = this.scrCoords;
        
    if (method == JXG.COORDS_BY_USER) {
        if (crd.length==2) { // Euclidean coordinates
            uc[0] = 1.0;
            uc[1] = crd[0];
            uc[2] = crd[1];
        } else { // Homogeneous coordinates (normalized)
            uc[0] = crd[0];
            uc[1] = crd[1];
            uc[2] = crd[2];
            this.normalizeUsrCoords();
        }
        this.usr2screen(doRound);
    } else {
        sc[1] = crd[0];
        sc[2] = crd[1];
        this.screen2usr();
    }
};
