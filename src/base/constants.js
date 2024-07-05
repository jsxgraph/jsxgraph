/*
    Copyright 2008-2024
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";

var major = 1,
    minor = 9,
    patch = 2,
    add = '', // 'dev' 'beta'
    version = major + '.' + minor + '.' + patch + (add ? '-' + add : ''),
    constants;

constants =
    /** @lends JXG */ {
    /**
     * Constant: the currently used JSXGraph version.
     *
     * @name JXG.version
     * @type String
     */
    version: version,

    /**
     * Constant: the small gray version indicator in the top left corner of every JSXGraph board (if
     * showCopyright is not set to false on board creation).
     *
     * @name JXG.licenseText
     * @type String
     */
    licenseText: "JSXGraph v" + version + " Copyright (C) see https://jsxgraph.org",

    /**
     *  Constant: user coordinates relative to the coordinates system defined by the bounding box.
     *  @name JXG.COORDS_BY_USER
     *  @type Number
     */
    COORDS_BY_USER: 0x0001,

    /**
     *  Constant: screen coordinates in pixel relative to the upper left corner of the div element.
     *  @name JXG.COORDS_BY_SCREEN
     *  @type Number
     */
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
    OBJECT_TYPE_SLIDER: 13,// unused
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
    OBJECT_TYPE_TANGENT: 25,
    OBJECT_TYPE_HTMLSLIDER: 26,
    OBJECT_TYPE_CHECKBOX: 27,
    OBJECT_TYPE_INPUT: 28,
    OBJECT_TYPE_BUTTON: 29,
    OBJECT_TYPE_TRANSFORMATION: 30,
    OBJECT_TYPE_FOREIGNOBJECT: 31,

    OBJECT_TYPE_VIEW3D: 32,
    OBJECT_TYPE_POINT3D: 33,
    OBJECT_TYPE_LINE3D: 34,
    OBJECT_TYPE_PLANE3D: 35,
    OBJECT_TYPE_CURVE3D: 36,
    OBJECT_TYPE_SURFACE3D: 37,

    OBJECT_TYPE_MEASUREMENT: 38,

    OBJECT_TYPE_INTERSECTION_LINE3D: 39,
    OBJECT_TYPE_SPHERE3D: 40,
    OBJECT_TYPE_CIRCLE3D: 41,
    OBJECT_TYPE_INTERSECTION_CIRCLE3D: 42,

    // IMPORTANT:
    // ----------
    // For being able to differentiate between the (sketchometry specific) SPECIAL_OBJECT_TYPEs and
    // (core specific) OBJECT_TYPEs, the non-sketchometry types MUST NOT be changed
    // to values > 100.

    // object classes
    OBJECT_CLASS_POINT: 1,
    OBJECT_CLASS_LINE: 2,
    OBJECT_CLASS_CIRCLE: 3,
    OBJECT_CLASS_CURVE: 4,
    OBJECT_CLASS_AREA: 5,
    OBJECT_CLASS_OTHER: 6,
    OBJECT_CLASS_TEXT: 7,
    OBJECT_CLASS_3D: 8
};

JXG.extendConstants(JXG, constants);

export default constants;
// const COORDS_BY_SCREEN = constants.COORDS_BY_SCREEN;
// export {constants as default,
//         COORDS_BY_SCREEN};
