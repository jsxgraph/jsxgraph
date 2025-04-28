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

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true */
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";
import Const from "./constants.js";
import EventEmitter from "../utils/event.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";

/**
 * @fileoverview In this file the Coords object is defined, a class to manage all
 * properties and methods coordinates usually have.
 */

/**
 * Constructs a new Coordinates object.
 * @class This is the Coordinates class.
 * All members a coordinate has to provide
 * are defined here.
 * @param {Number} method The type of coordinates given by the user. Accepted values are <b>COORDS_BY_SCREEN</b> and <b>COORDS_BY_USER</b>.
 * @param {Array} coordinates An array of affine coordinates.
 * @param {JXG.Board} board A reference to a board.
 * @param {Boolean} [emitter=true]
 * @constructor
 */
JXG.Coords = function (method, coordinates, board, emitter) {
    /**
     * Stores the board the object is used on.
     * @type JXG.Board
     */
    this.board = board;

    /**
     * Stores coordinates for user view as homogeneous coordinates.
     * @type Array
     */
    this.usrCoords = [];
    //this.usrCoords = new Float64Array(3);

    /**
     * Stores coordinates for screen view as homogeneous coordinates.
     * @type Array
     */
    this.scrCoords = [];
    //this.scrCoords = new Float64Array(3);

    /**
     * If true, this coordinates object will emit update events every time
     * the coordinates are set.
     * @type boolean
     * @default true
     */
    this.emitter = !Type.exists(emitter) || emitter;

    if (this.emitter) {
        EventEmitter.eventify(this);
    }
    this.setCoordinates(method, coordinates, false, true);
};

JXG.extend(
    JXG.Coords.prototype,
    /** @lends JXG.Coords.prototype */ {
        /**
         * Normalize homogeneous coordinates
         * @private
         */
        normalizeUsrCoords: function () {
            if (Math.abs(this.usrCoords[0]) > Mat.eps) {
                this.usrCoords[1] /= this.usrCoords[0];
                this.usrCoords[2] /= this.usrCoords[0];
                this.usrCoords[0] = 1.0;
            }
        },

        /**
         * Compute screen coordinates out of given user coordinates.
         * @private
         */
        usr2screen: function (doRound) {
            var mround = Math.round, // Is faster on IE, maybe slower with JIT compilers
                b = this.board,
                uc = this.usrCoords,
                oc = b.origin.scrCoords;

            if (doRound === true) {
                this.scrCoords[0] = mround(uc[0]);
                this.scrCoords[1] = mround(uc[0] * oc[1] + uc[1] * b.unitX);
                this.scrCoords[2] = mround(uc[0] * oc[2] - uc[2] * b.unitY);
            } else {
                this.scrCoords[0] = uc[0];
                this.scrCoords[1] = uc[0] * oc[1] + uc[1] * b.unitX;
                this.scrCoords[2] = uc[0] * oc[2] - uc[2] * b.unitY;
            }
        },

        /**
         * Compute user coordinates out of given screen coordinates.
         * @private
         */
        screen2usr: function () {
            var o = this.board.origin.scrCoords,
                sc = this.scrCoords,
                b = this.board;

            this.usrCoords[0] = 1.0;
            this.usrCoords[1] = (sc[1] - o[1]) / b.unitX;
            this.usrCoords[2] = (o[2] - sc[2]) / b.unitY;
        },

        /**
         * Calculate distance of one point to another.
         * @param {Number} coord_type The type of coordinates used here. Possible values are <b>JXG.COORDS_BY_USER</b> and <b>JXG.COORDS_BY_SCREEN</b>.
         * @param {JXG.Coords} coordinates The Coords object to which the distance is calculated.
         * @returns {Number} The distance
         */
        distance: function (coord_type, coordinates) {
            var sum = 0,
                c,
                ucr = this.usrCoords,
                scr = this.scrCoords,
                f;

            if (coord_type === Const.COORDS_BY_USER) {
                c = coordinates.usrCoords;
                f = ucr[0] - c[0];
                sum = f * f;

                if (sum > Mat.eps * Mat.eps) {
                    return Number.POSITIVE_INFINITY;
                }
                return Mat.hypot(ucr[1] - c[1], ucr[2] - c[2]);
            } else {
                c = coordinates.scrCoords;
                return Mat.hypot(scr[1] - c[1], scr[2] - c[2]);
            }
        },

        /**
         * Set coordinates by either user coordinates or screen coordinates and recalculate the other one.
         * @param {Number} coord_type The type of coordinates used here. Possible values are <b>COORDS_BY_USER</b> and <b>COORDS_BY_SCREEN</b>.
         * @param {Array} coordinates An array of affine coordinates the Coords object is set to.
         * @param {Boolean} [doRound=true] flag If true or null round the coordinates in usr2screen. This is used in smooth curve plotting.
         * The IE needs rounded coordinates. Id doRound==false we have to round in updatePathString.
         * @param {Boolean} [noevent=false]
         * @returns {JXG.Coords} Reference to the coords object.
         */
        setCoordinates: function (coord_type, coordinates, doRound, noevent) {
            var uc = this.usrCoords,
                sc = this.scrCoords,
                // Original values
                ou = [uc[0], uc[1], uc[2]],
                os = [sc[0], sc[1], sc[2]];

            if (coord_type === Const.COORDS_BY_USER) {
                if (coordinates.length === 2) {
                    // Euclidean coordinates
                    uc[0] = 1.0;
                    uc[1] = coordinates[0];
                    uc[2] = coordinates[1];
                } else {
                    // Homogeneous coordinates (normalized)
                    uc[0] = coordinates[0];
                    uc[1] = coordinates[1];
                    uc[2] = coordinates[2];
                    this.normalizeUsrCoords();
                }
                this.usr2screen(doRound);
            } else {
                if (coordinates.length === 2) {
                    // Euclidean coordinates
                    sc[1] = coordinates[0];
                    sc[2] = coordinates[1];
                } else {
                    // Homogeneous coordinates (normalized)
                    sc[1] = coordinates[1];
                    sc[2] = coordinates[2];
                }
                this.screen2usr();
            }

            if (this.emitter && !noevent && (os[1] !== sc[1] || os[2] !== sc[2])) {
                this.triggerEventHandlers(["update"], [ou, os]);
            }

            return this;
        },

        /**
         * Copy array, either scrCoords or usrCoords
         * Uses slice() in case of standard arrays and set() in case of
         * typed arrays.
         * @private
         * @param {String} obj Either 'scrCoords' or 'usrCoords'
         * @param {Number} offset Offset, defaults to 0 if not given
         * @returns {Array} Returns copy of the coords array either as standard array or as
         *   typed array.
         */
        copy: function (obj, offset) {
            if (offset === undefined) {
                offset = 0;
            }

            return this[obj].slice(offset);
        },

        /**
         * Test if one of the usrCoords is NaN or the coordinates are infinite.
         * @returns {Boolean} true if the coordinates are finite, false otherwise.
         */
        isReal: function () {
            return (
                !isNaN(this.usrCoords[1] + this.usrCoords[2]) &&
                Math.abs(this.usrCoords[0]) > Mat.eps
            );
        },

        /**
         * Triggered whenever the coordinates change.
         * @name JXG.Coords#update
         * @param {Array} ou Old user coordinates
         * @param {Array} os Old screen coordinates
         * @event
         */
        __evt__update: function (ou, os) {},

        /**
         * @ignore
         */
        __evt: function () {}
    }
);

export default JXG.Coords;
