/*
    Copyright 2008-2023
        Matthias Ehmann,
        Carsten Miller,
        Alfred Wassermann

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
 * @fileoverview Implementation of smart labels..
 */

import JXG from "../jxg";
import Const from "../base/constants";
import Type from "../utils/type";

/**
 * @class Smart label.
 * <p>
 * .
 *
 * @pseudo
 * @name Smartlabel
 * @augments JXG.Text
 * @constructor
 * @type JXG.Text
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * Parameter options:
 * @param {Array|Function|String} F 
 * @param {Array} xData 
 * @param {Array} yData 
 *
 *
 */
JXG.createSmartLabel = function (board, parents, attributes) {
    var el, attr,
        p = parents[0],
        txt = parents[1] || '',
        txt_fun;

    /*
    if (!(parents.length >= 3 &&
        (Type.isArray(parents[0]) || Type.isFunction(parents[0]) || Type.isString(parents[0])) &&
        (Type.isArray(parents[1]) && parents[1].length === 3) &&
        (Type.isArray(parents[2]) && parents[2].length === 3)
    )) {
        throw new Error(
            "JSXGraph: Can't create vector field with parent types " +
                "'" + typeof parents[0] + "', " +
                "'" + typeof parents[1] + "', " +
                "'" + typeof parents[2] + "'."
        );
    }
    */

    attr = Type.copyAttributes(attributes, board.options, 'smartlabel');
    attr.cssClass = 'smart-label-' + attr.class;
    attr.highlightCssClass = 'smart-label-' + attr.class;

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        attr.anchorX = 'middle';
        attr.anchorY = 'top';
        attr.cssClass += ' point';
        attr.highlightCssClass += ' point';

    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
        attr.anchorX = 'middle';
        attr.cssClass += ' line';
        attr.highlightCssClass += ' line';
        attr.rotate = function () { return Math.atan(p.getSlope()) * 180 / Math.PI; };
        attr.visible = function () { return (p.L() < 1.5) ? false : true; };
    }

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        el = board.create('text', [
            function () { return p.X(); },
            function () { return p.Y(); },
            ''
        ], attr);

        txt_fun = function () {
            var str = '',
                digits = Type.evaluate(el.visProp.digits),
                u = Type.evaluate(el.visProp.unit),
                dir = Type.evaluate(el.visProp.dir),
                mj = Type.evaluate(el.visProp.usemathjax),
                x = Type.toFixed(p.X(), digits),
                y = Type.toFixed(p.Y(), digits);

            if (txt === '') {
                if (dir === 'row') {
                    if (mj) {
                        str = ['\\(', x, '\\,', u, ' / ', y, '\\,', u, '\\)'].join('');
                    } else {
                        str = [x, ' ', u, ' / ', y, ' ', u].join('');
                    }
                } else if (dir.indexOf('col') === 0) { // Starts with 'col'
                    if (mj) {
                        str = ['\\(\\left(\\array{', x, '\\,', u, '\\\\ ', y, '\\,', u, '}\\right)\\)'].join('');
                    } else {
                        str = [x, ' ', u, '<br/>', y, ' ', u].join('');
                    }
                }
            } else {
                str = txt;
            }
            return str;
        };
    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
        el = board.create('text', [
            function () { return (p.point1.X() + p.point2.X()) * 0.5; },
            function () { return (p.point1.Y() + p.point2.Y()) * 0.5; },
            ''
        ], attr);

        txt_fun = function () {
            var str = '',
                digits = Type.evaluate(el.visProp.digits),
                u = Type.evaluate(el.visProp.unit),
                mj = Type.evaluate(el.visProp.usemathjax);

            if (txt === '') {
                if (mj) {
                    str = ['\\(',
                        (p.name.length > 0 ? p.name + '=' : ''),
                        Type.toFixed(p.L(), digits),
                        '\\,', u, '\\)'
                    ].join('');
                } else {
                    str = [(p.name.length > 0 ? p.name + '=' : ''),
                    Type.toFixed(p.L(), digits), ' ', u
                    ].join('');
                }
            } else {
                str = txt;
            }
            return str;
        };
    }
    el.setText(txt_fun);

    return el;
};

JXG.registerElement("smartlabel", JXG.createSmartLabel);
