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

/*global JXG: true, define: true, html_sanitize: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview expect.js provides utilities for parameter magic by normalizing multi-type parameters.
 */

import JXG from "../jxg.js";
import Type from "./type.js";
import Const from "../base/constants.js";
import Coords from "../base/coords.js";

/**
 * The JXG.Expect namespace provides method to normalize access on coordinates,
 * i.e. provides utilities for parameter magic by normalizing multi-type parameters.
 * @namespace
 */
JXG.Expect = {
    /**
     * Apply an expect method on every element of an array.
     *
     * @param {Array} a
     * @param {function} format
     * @param {Boolean} [copy=false]
     *
     * @returns {Array}
     */
    each: function (a, format, copy) {
        var i,
            len,
            r = [];

        if (Type.exists(a.length)) {
            len = a.length;
            for (i = 0; i < len; i++) {
                r.push(format.call(this, a[i], copy));
            }
        }

        return r;
    },

    /**
     * Normalize points and coord objects into a coord object.
     *
     * @param {JXG.Point|JXG.Coords} c
     * @param {Boolean} [copy=false] Return a copy, not a reference
     *
     * @returns {JXG.Coords}
     */
    coords: function (c, copy) {
        var coord = c;

        if (c && c.elementClass === Const.OBJECT_CLASS_POINT) {
            coord = c.coords;
        } else if (c.usrCoords && c.scrCoords && c.usr2screen) {
            coord = c;
        }

        if (copy) {
            coord = new Coords(Const.COORDS_BY_USER, coord.usrCoords, coord.board);
        }

        return coord;
    },

    /**
     * Normalize points, coordinate arrays and coord objects into a coordinate array.
     *
     * @param {JXG.Point|JXG.Coords|Array} c
     * @param {Boolean} [copy=false] Return a copy, not a reference
     *
     * @returns {Array} Homogeneous coordinates
     */
    coordsArray: function (c, copy) {
        var coord;

        if (!Type.isArray(c)) {
            coord = this.coords(c).usrCoords;
        } else {
            coord = c;
        }

        if (coord.length < 3) {
            coord.unshift(1);
        }

        if (copy) {
            coord = [coord[0], coord[1], coord[2]];
        }

        return coord;
    }
};

export default JXG.Expect;
