/*
    Copyright 2008-2025
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
    minor = 13,
    patch = 0,
    add = 'dev', // 'dev' 'beta'
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
    licenseText: "JSXGraph v" + version + " \u00A9 jsxgraph.org",

    /**
     * JSXGraph logo: base64 data-URL of img/png/screen/jsxgraph-logo_black-square-solid.png
     *
     * @name JXG.licenseLogo
     * @type String
     */
    licenseLogo: 'data:image/png;base64,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',

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
    OBJECT_TYPE_TEXT3D: 43,
    OBJECT_TYPE_FACE3D: 44,
    OBJECT_TYPE_POLYHEDRON3D: 45,
    OBJECT_TYPE_POLYGON3D: 46,

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
