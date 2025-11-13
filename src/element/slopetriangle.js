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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview Example file for a triangle implemented as a extension to JSXGraph.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";
import Const from "../base/constants.js";
import Polygon from "../base/polygon.js";

var priv = {
    removeSlopeTriangle: function () {
        Polygon.prototype.remove.call(this);

        this.board.removeObject(this.toppoint);
        this.board.removeObject(this.glider);

        this.board.removeObject(this.baseline);
        this.board.removeObject(this.basepoint);

        this.board.removeObject(this.label);

        if (this._isPrivateTangent) {
            this.board.removeObject(this.tangent);
        }
    },
    Value: function () {
        return this.tangent.getSlope();
    },
    Direction: function() {
        return this.tangent.Direction();
    }
};

/**
 * @class Slope triangle to visualize the slope of a tangent to a curve, circle or line.
 * @pseudo
 * @name Slopetriangle
 * @augments JXG.Line
 * @constructor
 * @type JXG.Polygon
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * Parameter options:
 * @param {JXG.Line} t A tangent based on a glider on some object, e.g. curve, circle, line or turtle.
 * @param {JXG.Line_JXG.Point} li, p A line and a point on that line.
 *  The user has to take care that the point is a member of the line.
 * @example
 * // Create a slopetriangle on a tangent
 * var f = board.create('plot', ['sin(x)']),
 *     g = board.create('glider', [1, 2, f]),
 *     t = board.create('tangent', [g]),
 *
 *     st = board.create('slopetriangle', [t]);
 *
 * </pre><div class="jxgbox" id="JXG951ccb6a-52bc-4dc2-80e9-43db064f0f1b" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG951ccb6a-52bc-4dc2-80e9-43db064f0f1b', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false}),
 *     f = board.create('plot', ['sin(x)']),
 *     g = board.create('glider', [1, 2, f]),
 *     t = board.create('tangent', [g]),
 *
 *     st = board.create('slopetriangle', [t]);
 * })();
 * </script><pre>
 *
 * @example
 * // Create a on a line and a point on that line
 * var p1 = board.create('point', [-2, 3]),
 *     p2 = board.create('point', [2, -3]),
 *     li = board.create('line', [p1, p2]),
 *     p = board.create('glider', [0, 0, li]),
 *
 *     st = board.create('slopetriangle', [li, p]);
 *
 * </pre><div class="jxgbox" id="JXGb52f451c-22cf-4677-852a-0bb9d764ee95" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGb52f451c-22cf-4677-852a-0bb9d764ee95', {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [-2, 3]),
 *     p2 = board.create('point', [2, -3]),
 *     li = board.create('line', [p1, p2]),
 *     p = board.create('glider', [0, 0, li]),
 *
 *     st = board.create('slopetriangle', [li, p]);
 * })();
 * </script><pre>
 */
JXG.createSlopeTriangle = function (board, parents, attributes) {
    var el, tangent, tglide, glider,
        toppoint, baseline, basepoint,
        label, attr,
        isPrivateTangent = false;

    if (parents.length === 1 && parents[0].type === Const.OBJECT_TYPE_TANGENT) {
        tangent = parents[0];
        tglide = tangent.glider;
    } else if (parents.length === 1 && parents[0].type === Const.OBJECT_TYPE_GLIDER) {
        tglide = parents[0];
        attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'tangent');
        tangent = board.create("tangent", [tglide], attr);
        isPrivateTangent = true;
    } else if (
        parents.length === 2 &&
        parents[0].elementClass === Const.OBJECT_CLASS_LINE &&
        Type.isPoint(parents[1])
    ) {
        tangent = parents[0];
        tglide = parents[1];
    } else {
        throw new Error(
            "JSXGraph: Can't create slope triangle with parent types '" +
                typeof parents[0] +
                "'."
        );
    }

    attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'basepoint');
    basepoint = board.create(
        "point",
        [
            function () {
                return [tglide.X() + 1, tglide.Y()];
            }
        ],
        attr
    );

    attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'baseline');
    baseline = board.create("line", [tglide, basepoint], attr);

    attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'glider');
    glider = board.create("glider", [tglide.X() + 1, tglide.Y(), baseline], attr);

    attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'toppoint');
    toppoint = board.create(
        "point",
        [
            function () {
                return [
                    glider.X(),
                    glider.Y() + (glider.X() - tglide.X()) * tangent.getSlope()
                ];
            }
        ],
        attr
    );

    attr = Type.copyAttributes(attributes, board.options, 'slopetriangle');
    // attr.borders = Type.copyAttributes(attr.borders, board.options, "slopetriangle", 'borders');
    el = board.create("polygon", [tglide, glider, toppoint], attr);

    /**
     * Returns the value of the slope triangle, that is the slope of the tangent.
     * @name Value
     * @memberOf Slopetriangle.prototype
     * @function
     * @returns {Number} slope of the tangent.
     */
    el.Value = priv.Value;

    /**
     * Returns the direction of the slope triangle, that is the direction of the tangent.
     * @name Direction
     * @memberOf Slopetriangle.prototype
     * @see Line#Direction
     * @function
     * @returns {Number} slope of the tangent.
     */
    el.Direction = priv.Direction;
    el.tangent = tangent;
    el._isPrivateTangent = isPrivateTangent;

    //el.borders[0].setArrow(false, {type: 2, size: 10});
    //el.borders[1].setArrow(false, {type: 2, size: 10});
    el.borders[2].setArrow(false, false);

    attr = Type.copyAttributes(attributes, board.options, "slopetriangle", 'label');
    //label = board.create("text", [
    //         function () {
    //             return glider.X() + 0.1;
    //         },
    //         function () {
    //             return (glider.Y() + toppoint.Y()) * 0.5;
    //         },
    //         function () {
    //             return "";
    //         }
    //     ],
    //     attr
    // );

    attr = Type.copyAttributes(attr, board.options, 'label');
    // Add label to vertical polygon edge
    attr.isLabel = true;
    attr.anchor = el.borders[1];
    attr.priv = el.borders[1].visProp.priv;
    attr.id = el.borders[1].id + 'Label';

    label = board.create("text", [0, 0, function () { return ""; }], attr);
    label.needsUpdate = true;
    label.dump = false;
    el.borders[1].label = label;
    el.borders[1].hasLabel = true;
    el.borders[1].visProp.withlabel = true;

    label._setText(function () {
        var digits = label.evalVisProp('digits');

        if (label.useLocale()) {
            return label.formatNumberLocale(el.Value(), digits);
        }
        return Type.toFixed(el.Value(), digits);
    });
    label.fullUpdate();

    el.glider = glider;
    el.basepoint = basepoint;
    el.baseline = baseline;
    el.toppoint = toppoint;
    el.label = label;

    el.subs = {
        glider: glider,
        basePoint: basepoint,
        baseLine: baseline,
        topPoint: toppoint,
        label: label
    };
    el.inherits.push(glider, basepoint, baseline, toppoint, label);

    el.methodMap = JXG.deepCopy(el.methodMap, {
        tangent: "tangent",
        glider: "glider",
        basepoint: "basepoint",
        baseline: "baseline",
        toppoint: "toppoint",
        label: "label",
        Value: "Value",
        V: "Value",
        Direction: "Direction"
    });

    el.remove = priv.removeSlopeTriangle;

    return el;
};

JXG.registerElement("slopetriangle", JXG.createSlopeTriangle);

// export default {
//     createSlopeTriangle: JXG.createSlopeTriangle
// };
