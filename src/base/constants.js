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


/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/* depends
 JXG (just the namespace)
 */

(function () {

    "use strict";

    var constants, j;

    constants = {
        // copyright, version, ...

        /**
         * Represents the currently used JSXGraph version.
         * @type {String}
         */
        version: '0.97.1',

        /**
         * The small gray version indicator in the top left corner of every JSXGraph board (if
         * showCopyright is not set to false on board creation).
         * @type String
         */
        licenseText: 'JSXGraph v0.97.1 Copyright (C) see http://jsxgraph.org',

        // coords
        COORDS_BY_USER: 0x0001,
        COORDS_BY_SCREEN: 0x0002,

        // object types
        OBJECT_TYPE_ARC: 1,
        OBJECT_TYPE_ARROW: 2,
        OBJECT_TYPE_AXIS: 3,
        OBJECT_TYPE_AXISPOINT: 4,
        OBJECT_TYPE_TICKS: 5,
        OBJECT_TYPE_CIRCLE: 6,
        OBJECT_TYPE_CONIC: 7,
        OBJECT_TYPE_CURVE: 8,
        OBJECT_TYPE_GLIDER: 9,
        OBJECT_TYPE_IMAGE: 10,
        OBJECT_TYPE_LINE: 11,
        OBJECT_TYPE_POINT: 12,
        OBJECT_TYPE_SLIDER: 13,
        OBJECT_TYPE_CAS: 14,
        OBJECT_TYPE_GXTCAS: 15,
        OBJECT_TYPE_POLYGON: 16,
        OBJECT_TYPE_SECTOR: 17,
        OBJECT_TYPE_TEXT: 18,
        OBJECT_TYPE_ANGLE: 19,
        OBJECT_TYPE_INTERSECTION: 20,
        OBJECT_TYPE_TURTLE: 21,
        OBJECT_TYPE_VECTOR: 22,
        OBJECT_TYPE_OPROJECT: 23,
        OBJECT_TYPE_GRID: 24,

        // object classes
        OBJECT_CLASS_POINT: 1,
        OBJECT_CLASS_LINE: 2,
        OBJECT_CLASS_CIRCLE: 3,
        OBJECT_CLASS_CURVE: 4,
        OBJECT_CLASS_AREA: 5,
        OBJECT_CLASS_OTHER: 6
    };

    // temporary fix until AMD transition is done
    for (j in constants) {
        if (constants.hasOwnProperty(j)) {
            JXG[j] = constants[j];
        }
    }

    return constants;
}());