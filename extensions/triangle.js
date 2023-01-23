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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview Example file for a triangle implemented as a extension to JSXGraph.
 */

import JXG from "../src/jxg";
import Type from "../src/utils/type";
import Line from "../src/base/line";
import Group from "../src/base/group";

/**
 * Creates a new triangle using three points and the given attributes.
 * @param {JXG.Board} board The board the triangle is put on.
 * @param {Array} parents Array of three points defining the triangle.
 * @param {Object} attributes Visual properties that are assigned to the constructed lines.
 * @returns {Object} An object with the following members: <br />
 * <table><tr><th>Type</th><th>Member</th></tr>
 *   <tr><td>JXG.Point</td><td>A</td></tr>
 *   <tr><td>JXG.Point</td><td>B</td></tr>
 *   <tr><td>JXG.Point</td><td>C</td></tr>
 *   <tr><td>JXG.Line</td><td>a</td></tr>
 *   <tr><td>JXG.Line</td><td>b</td></tr>
 *   <tr><td>JXG.Line</td><td>c</td></tr>
 *   <tr><td>JXG.Group</td><td>G</td></tr>
 * </table>
 */
JXG.createTriangle = function (board, parents, attributes) {
    var p1, p2, p3, l1, l2, l3, ret, i, attr;

    if (Type.isPoint(parents[0]) && Type.isPoint(parents[1]) && Type.isPoint(parents[2])) {
        p1 = parents[0];
        p2 = parents[1];
        p3 = parents[2];

        attr = Type.copyAttributes(attributes, board.options, "line");

        l1 = board.create("line", [p1, p2], attr);
        l2 = board.create("line", [p2, p3], attr);
        l3 = board.create("line", [p3, p1], attr);

        var g = board.create("group", [p1, p2, p3]);

        ret = [p1, p2, p3, l1, l2, l3, g];
        ret.points = [p1, p2, p3];
        ret.lines = [l1, l2, l3];
        ret.group = g;

        for (i = 1; i <= 3; i++) {
            ret["point" + i] = ret.points[i - 1];
            ret["line" + i] = ret.lines[i - 1];
        }
        ret.multipleElements = true;

        // special treatment for triangle because of backwards compatibility:
        ret.A = p1;
        ret.B = p2;
        ret.C = p3;

        ret.a = l2;
        ret.b = l3;
        ret.c = l1;

        return ret;
    }

    throw new Error(
        "JSXGraph: Can't create triangle with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'."
    );
};

JXG.registerElement("triangle", JXG.createTriangle);

export default {
    createTriangle: JXG.createTriangle
};
