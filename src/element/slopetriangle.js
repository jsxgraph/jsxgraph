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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 see define call
 */

/**
 * @fileoverview Example file for a triangle implemented as a extension to JSXGraph.
 */

define([
    'jxg', 'options', 'utils/type', 'base/constants', 'base/line', 'base/polygon', 'base/point', 'base/element'
], function (JXG, Options, Type, Const, Line, Polygon, Point, GeometryElement) {

    "use strict";

    var priv = {
            removeSlopeTriangle: function () {
                Polygon.Polygon.prototype.remove.call(this);

                this.board.removeObject(this.toppoint);
                this.board.removeObject(this.glider);

                this.board.removeObject(this.baseline);
                this.board.removeObject(this.basepoint);
            },
            Value: function () {
                return this.tangent.getSlope();
            }
        };

    // default attributes
    Options.slopetriangle = {
        fillColor: 'red',
        fillOpacity: 0.4,

        glider: {},
        baseline: {
            visible: false,
            withLabel: false,
            name: ''
        },
        basepoint: {
            visible: false,
            withLabel: false,
            name: ''
        },
        toppoint: {
            visible: false,
            withLabel: false,
            name: ''
        }
    };

    /**
     * Creates a new slope triangle using a tangent on a curve, circle, line or turtle.
     * @param {JXG.Board} board The board the triangle is put on.
     * @param {Array} parents A tangent line.
     * @param {Object} attributes Visual properties that are assigned to the constructed lines.
     * @returns {JXG.Point} A glider
     */
    JXG.createSlopeTriangle = function (board, parents, attributes) {
        var el, tangent, tglide, glider, toppoint, baseline, basepoint, attr;

        if (parents[0].type === Const.OBJECT_TYPE_TANGENT) {
            tangent = parents[0];
            tglide = tangent.glider;

            attr = Type.copyAttributes(attributes, board.options, 'slopetriangle', 'basepoint');
            basepoint = board.create('point', [function () {
                return [tglide.X() + 1,  tglide.Y()];
            }], attr);

            attr = Type.copyAttributes(attributes, board.options, 'slopetriangle', 'baseline');
            baseline = board.create('line', [tglide, basepoint], attr);

            attr = Type.copyAttributes(attributes, board.options, 'slopetriangle', 'glider');
            glider = board.create('glider', [tglide.X() + 1, tglide.Y(), baseline], attr);

            attr = Type.copyAttributes(attributes, board.options, 'slopetriangle', 'toppoint');
            toppoint = board.create('point', [function () {
                return [glider.X(), glider.Y() + (glider.X() - tglide.X()) * tangent.getSlope()];
            }], attr);

            attr = Type.copyAttributes(attributes, board.options, 'slopetriangle');
            el = board.create('polygon', [tglide, glider, toppoint], attr);

            el.Value = priv.Value;

            el.tangent = tangent;
            el.glider = glider;
            el.basepoint = basepoint;
            el.baseline = baseline;
            el.toppoint = toppoint;

            el.methodMap = JXG.deepCopy(el.methodMap, {
                tangent: 'tangent',
                glider: 'glider',
                basepoint: 'basepoint',
                baseline: 'baseline',
                toppoint: 'toppoint',
                Value: 'Value',
                V: 'Value'
            });

            el.remove = priv.removeSlopeTriangle;

            return el;
        }

        throw new Error("JSXGraph: Can't create slope triangle with parent types '" + (typeof parents[0]) + "'.");
    };

    JXG.registerElement('slopetriangle', JXG.createSlopeTriangle);

    return {
        createSlopeTriangle: JXG.createSlopeTriangle
    };
});
