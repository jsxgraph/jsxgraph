/*
    Copyright 2008-2018
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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 */

define(['jxg'], function (JXG) {

    "use strict";

    var major = 0,
        minor = 99,
        patch = 7,
        add = false, // 'dev',
        version = major + '.' + minor + '.' + patch + (add ? '-' + add : ''),
        constants;

    constants = /** @lends JXG */ {
        // copyright, version, ...

        /**
         * Represents the currently used JSXGraph version.
         * @type {String}
         */
        version: version,

        /**
         * The small gray version indicator in the top left corner of every JSXGraph board (if
         * showCopyright is not set to false on board creation).
         * @type String
         */
        licenseText: 'JSXGraph v' + version + ' Copyright (C) see http://jsxgraph.org',

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
        OBJECT_TYPE_TANGENT: 25,
        OBJECT_TYPE_HTMLSLIDER: 26,
        OBJECT_TYPE_CHECKBOX: 27,
        OBJECT_TYPE_INPUT: 28,
        OBJECT_TYPE_BUTTON: 29,
        OBJECT_TYPE_TRANSFORMATION: 30,

        // object classes
        OBJECT_CLASS_POINT: 1,
        OBJECT_CLASS_LINE: 2,
        OBJECT_CLASS_CIRCLE: 3,
        OBJECT_CLASS_CURVE: 4,
        OBJECT_CLASS_AREA: 5,
        OBJECT_CLASS_OTHER: 6,
        OBJECT_CLASS_TEXT: 7,

        // SketchReader constants
        GENTYPE_ABC: 1, // unused
        GENTYPE_AXIS: 2,
        GENTYPE_MID: 3,
        GENTYPE_REFLECTION: 4,
        GENTYPE_MIRRORELEMENT: 5,
        GENTYPE_TANGENT: 6,
        GENTYPE_PARALLEL: 7,
        GENTYPE_BISECTORLINES: 8,
        GENTYPE_BOARDIMG: 9,
        GENTYPE_BISECTOR: 10,
        GENTYPE_NORMAL: 11,
        GENTYPE_POINT: 12,
        GENTYPE_GLIDER: 13,
        GENTYPE_INTERSECTION: 14,
        GENTYPE_CIRCLE: 15,
        GENTYPE_CIRCLE2POINTS: 16,
        GENTYPE_LINE: 17,
        GENTYPE_TRIANGLE: 18,
        GENTYPE_QUADRILATERAL: 19,
        GENTYPE_TEXT: 20,
        GENTYPE_POLYGON: 21,
        GENTYPE_REGULARPOLYGON: 22,
        GENTYPE_SECTOR: 23,
        GENTYPE_ANGLE: 24,
        GENTYPE_PLOT: 25,
        GENTYPE_SLIDER: 26,
        GENTYPE_TRUNCATE: 27,
        GENTYPE_JCODE: 28,
        GENTYPE_MOVEMENT: 29,
        GENTYPE_COMBINED: 30,
        GENTYPE_RULER: 31,
        GENTYPE_SLOPETRIANGLE: 32,
        GENTYPE_PERPSEGMENT: 33,
        GENTYPE_LABELMOVEMENT: 34,
        GENTYPE_VECTOR: 35,
        GENTYPE_NONREFLEXANGLE: 36,
        GENTYPE_REFLEXANGLE: 37,
        GENTYPE_PATH: 38,
        GENTYPE_DERIVATIVE: 39,
        // 40 // unused ...
        GENTYPE_DELETE: 41,
        GENTYPE_COPY: 42,
        GENTYPE_MIRROR: 43,
        GENTYPE_ROTATE: 44,
        GENTYPE_ABLATION: 45,
        GENTYPE_MIGRATE: 46,
        GENTYPE_VECTORCOPY: 47,
//        GENTYPE_TRANSFORM: 48, // unused
        // 49 ... 50 // unused ...

        // IMPORTANT:
        // ----------
        // For being able to differentiate between the (GUI-specific) CTX and
        // (CORE-specific) non-CTX steps, the non-CTX steps MUST NOT be changed
        // to values > 50.

        GENTYPE_CTX_TYPE_G: 51,
        GENTYPE_CTX_TYPE_P: 52,
        GENTYPE_CTX_TRACE: 53,
        GENTYPE_CTX_VISIBILITY: 54,
        GENTYPE_CTX_CCVISIBILITY: 55, // unused
        GENTYPE_CTX_MPVISIBILITY: 56,
        GENTYPE_CTX_WITHLABEL: 57,
        GENTYPE_CTX_LABEL: 58,
        GENTYPE_CTX_FIXED: 59,
        GENTYPE_CTX_STROKEWIDTH: 60,
        GENTYPE_CTX_LABELSIZE: 61,
        GENTYPE_CTX_SIZE: 62,
        GENTYPE_CTX_FACE: 63,
        GENTYPE_CTX_STRAIGHT: 64,
        GENTYPE_CTX_ARROW: 65,
        GENTYPE_CTX_COLOR: 66,
        GENTYPE_CTX_RADIUS: 67,
        GENTYPE_CTX_COORDS: 68,
        GENTYPE_CTX_TEXT: 69,
        GENTYPE_CTX_ANGLERADIUS: 70,
        GENTYPE_CTX_DOTVISIBILITY: 71,
        GENTYPE_CTX_FILLOPACITY: 72,
        GENTYPE_CTX_PLOT: 73,
        GENTYPE_CTX_SCALE: 74,
        GENTYPE_CTX_INTVAL: 75,
        GENTYPE_CTX_POINT1: 76,
        GENTYPE_CTX_POINT2: 77,
        GENTYPE_CTX_LABELSTICKY: 78,
        GENTYPE_CTX_TYPE_I: 79,
        GENTYPE_CTX_HASINNERPOINTS: 80,
        GENTYPE_CTX_SNAPWIDTH: 81,
        GENTYPE_CTX_SNAPTOGRID: 82
    };

    JXG.extend(JXG, constants);

    return constants;
});
