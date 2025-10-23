/*
    Copyright 2008-2025
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

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";

/**
 * @class Customized text elements for displaying measurements of JSXGraph elements,
 * Examples are length of a
 * segment, perimeter or area of a circle or polygon (including polygonal chain),
 * slope of a line, value of an angle, and coordinates of a point.
 * <p>
 * If additionally a text, or a function is supplied and the content is not the empty string,
 * that text is displayed instead of the measurement.
 * <p>
 * Smartlabels use custom made CSS layouts defined in jsxgraph.css. Therefore, the inclusion of the file jsxgraph.css is mandatory or
 * the CSS classes have to be replaced by other classes.
 * <p>
 * The default attributes for smartlabels are defined for each type of measured element in the following sub-objects.
 * This is a deviation from the usual JSXGraph attribute usage.
 * <ul>
 *  <li> <tt>JXG.Options.smartlabelangle</tt> for smartlabels of angle objects
 *  <li> <tt>JXG.Options.smartlabelcircle</tt> for smartlabels of circle objects
 *  <li> <tt>JXG.Options.smartlabelline</tt> for smartlabels of line objects
 *  <li> <tt>JXG.Options.smartlabelpoint</tt> for smartlabels of point objects.
 *  <li> <tt>JXG.Options.smartlabelpolygon</tt> for smartlabels of polygon objects.
 * </ul>
 *
 *
 * @pseudo
 * @name Smartlabel
 * @augments JXG.Text
 * @constructor
 * @type JXG.Text
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.GeometryElement} Parent parent object: point, line, circle, polygon, angle.
 * @param {String|Function} Txt Optional text. In case, this content is not the empty string,
 *  the measurement is overwritten by this text.
 *
 * @example
 * var p1 = board.create('point', [3, 4], {showInfobox: false, withLabel: false});
 * board.create('smartlabel', [p1], {digits: 1, unit: 'm', dir: 'col', useMathJax: false});
 *
 * </pre><div id="JXG30cd1f9e-7e78-48f3-91a2-9abd466a754f" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG30cd1f9e-7e78-48f3-91a2-9abd466a754f',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [3, 4], {showInfobox: false, withLabel: false});
 *     board.create('smartlabel', [p1], {digits: 1, unit: 'cm', dir: 'col', useMathJax: false});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var s1 = board.create('line', [[-7, 2], [6, -6]], {point1: {visible:true}, point2: {visible:true}});
 * board.create('smartlabel', [s1], {unit: 'm', measure: 'length', prefix: 'L = ', useMathJax: false});
 * board.create('smartlabel', [s1], {unit: 'm',  measure: 'slope', prefix: '&Delta; = ', useMathJax: false});
 *
 *
 * </pre><div id="JXGfb4423dc-ee3a-4122-a186-82123019a835" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGfb4423dc-ee3a-4122-a186-82123019a835',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var s1 = board.create('line', [[-7, 2], [6, -6]], {point1: {visible:true}, point2: {visible:true}});
 *     board.create('smartlabel', [s1], {unit: 'm', measure: 'length', prefix: 'L = ', useMathJax: false});
 *     board.create('smartlabel', [s1], {unit: 'm',  measure: 'slope', prefix: '&Delta; = ', useMathJax: false});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var c1 = board.create('circle', [[0, 1], [4, 1]], {point2: {visible: true}});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'perimeter', prefix: 'U = ', useMathJax: false});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'area', prefix: 'A = ', useMathJax: false});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'radius', prefix: 'R = ', useMathJax: false});
 *
 *
 * </pre><div id="JXG763c4700-8273-4eb7-9ed9-1dc6c2c52e93" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG763c4700-8273-4eb7-9ed9-1dc6c2c52e93',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var c1 = board.create('circle', [[0, 1], [4, 1]], {point2: {visible: true}});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'perimeter', prefix: 'U = ', useMathJax: false});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'area', prefix: 'A = ', useMathJax: false});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'radius', prefix: 'R = ', useMathJax: false});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var p2 = board.create('polygon', [[-6, -5], [7, -7], [-4, 3]], {});
 * board.create('smartlabel', [p2], {
 *     unit: 'm',
 *     measure: 'area',
 *     prefix: 'A = ',
 *     cssClass: 'smart-label-pure smart-label-polygon',
 *     highlightCssClass: 'smart-label-pure smart-label-polygon',
 *     useMathJax: false
 * });
 * board.create('smartlabel', [p2, () => 'X: ' + p2.vertices[0].X().toFixed(1)], {
 *     measure: 'perimeter',
 *     cssClass: 'smart-label-outline smart-label-polygon',
 *     highlightCssClass: 'smart-label-outline smart-label-polygon',
 *     useMathJax: false
 * });
 *
 * </pre><div id="JXG376425ac-b4e5-41f2-979c-6ff32a01e9c8" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG376425ac-b4e5-41f2-979c-6ff32a01e9c8',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p2 = board.create('polygon', [[-6, -5], [7, -7], [-4, 3]], {});
 *     board.create('smartlabel', [p2], {
 *         unit: 'm',
 *         measure: 'area',
 *         prefix: 'A = ',
 *         cssClass: 'smart-label-pure smart-label-polygon',
 *         highlightCssClass: 'smart-label-pure smart-label-polygon',
 *         useMathJax: false
 *     });
 *     board.create('smartlabel', [p2, () => 'X: ' + p2.vertices[0].X().toFixed(1)], {
 *         measure: 'perimeter',
 *         cssClass: 'smart-label-outline smart-label-polygon',
 *         highlightCssClass: 'smart-label-outline smart-label-polygon',
 *         useMathJax: false
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var a1 = board.create('angle', [[1, -1], [1, 2], [1, 5]], {name: '&beta;', withLabel: false});
 * var sma = board.create('smartlabel', [a1], {digits: 1, prefix: a1.name + '=', unit: '°', useMathJax: false});
 *
 * </pre><div id="JXG48d6d1ae-e04a-45f4-a743-273976712c0b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG48d6d1ae-e04a-45f4-a743-273976712c0b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var a1 = board.create('angle', [[1, -1], [1, 2], [1, 5]], {name: '&beta;', withLabel: false});
 *     var sma = board.create('smartlabel', [a1], {digits: 1, prefix: a1.name + '=', unit: '°', useMathJax: false});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createSmartLabel = function (board, parents, attributes) {
    var el, attr,
        p, user_supplied_text,
        getTextFun, txt_fun;

    if (parents.length === 0 || (
        [Const.OBJECT_CLASS_POINT, Const.OBJECT_CLASS_LINE,Const.OBJECT_CLASS_CIRCLE].indexOf(parents[0].elementClass) < 0 &&
        [Const.OBJECT_TYPE_POLYGON, Const.OBJECT_TYPE_ANGLE].indexOf(parents[0].type) < 0
        )
    ) {
        throw new Error(
            "JSXGraph: Can't create smartlabel with parent types " +
                "'" + typeof parents[0] + "', " +
                "'" + typeof parents[1] + "'."
        );
    }

    p = parents[0];
    user_supplied_text = parents[1] || '';

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelpoint');

    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelline');
        /**
         * @class
         * @ignore
         */
        attr.rotate = function () { return Math.atan(p.getSlope()) * 180 / Math.PI; };
        /**
         * @class
         * @ignore
         */
        attr.visible = function () { return (p.L() < 1.5) ? false : true; };

    } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelcircle');
        /**
         * @class
         * @ignore
         */
        attr.visible = function () { return (p.Radius() < 1.5) ? false : true; };

    } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelpolygon');
    } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelangle');
        /**
         * @class
         * @ignore
         */
        attr.rotate = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI;
            return (v > 90 && v < 270) ? v + 180 : v;
        };
        /**
         * @class
         * @ignore
         */
        attr.anchorX = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI;
            return (v > 90 && v < 270) ? 'right' : 'left';
        };
    }

    getTextFun = function (el, p, elType, mType) {
        var measure;
        switch (mType) {
            case 'length':
                /**
                 * @ignore
                 */
                measure = function () { return p.L(); };
                break;
            case 'slope':
                /**
                 * @ignore
                 */
                measure = function () { return p.Slope(); };
                break;
            case 'area':
                /**
                 * @ignore
                 */
                measure = function () { return p.Area(); };
                break;
            case 'radius':
                /**
                 * @ignore
                 */
                measure = function () { return p.Radius(); };
                break;
            case 'perimeter':
                /**
                 * @ignore
                 */
                measure = function () { return p.Perimeter(); };
                break;
            case 'rad':
                /**
                 * @ignore
                 */
                measure = function () { return p.Value(); };
                break;
            case 'deg':
                /**
                 * @ignore
                 */
                measure = function () { return p.Value() * 180 / Math.PI; };
                break;
            default:
                /**
                 * @ignore
                 */
                measure = function () { return 0.0; };
        }

        return function () {
            var str = '',
                val,
                txt = Type.evaluate(user_supplied_text),
                digits = el.evalVisProp('digits'),
                u = el.evalVisProp('unit'),
                pre = el.evalVisProp('prefix'),
                suf = el.evalVisProp('suffix'),
                mj = el.evalVisProp('usemathjax') || el.evalVisProp('usekatex');

            if (txt === '') {
                if (el.useLocale()) {
                    val = el.formatNumberLocale(measure(), digits);
                } else {
                    val = Type.toFixed(measure(), digits);
                }
                if (mj) {
                    str = ['\\(', pre, val, '\\,', u, suf, '\\)'].join('');
                } else {
                    str = [pre, val, u, suf].join('');
                }
            } else {
                str = txt;
            }
            return str;
        };
    };

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        el = board.create('text', [
            function () { return p.X(); },
            function () { return p.Y(); },
            ''
        ], attr);

        txt_fun = function () {
            var str = '',
                txt = Type.evaluate(user_supplied_text),
                digits = el.evalVisProp('digits'),
                u = el.evalVisProp('unit'),
                pre = el.evalVisProp('prefix'),
                suf = el.evalVisProp('suffix'),
                dir = el.evalVisProp('dir'),
                mj = el.evalVisProp('usemathjax') || el.evalVisProp('usekatex'),
                x, y;

            if (el.useLocale()) {
                x = el.formatNumberLocale(p.X(), digits);
                y = el.formatNumberLocale(p.Y(), digits);
            } else {
                x = Type.toFixed(p.X(), digits);
                y = Type.toFixed(p.Y(), digits);
            }

            if (txt === '') {
                if (dir === 'row') {
                    if (mj) {
                        str = ['\\(', pre, x, '\\,', u, ' / ', y, '\\,', u, suf, '\\)'].join('');
                    } else {
                        str = [pre, x, ' ', u, ' / ', y, ' ', u, suf].join('');
                    }
                } else if (dir.indexOf('col') === 0) { // Starts with 'col'
                    if (mj) {
                        str = ['\\(', pre, '\\left(\\array{', x, '\\,', u, '\\\\ ', y, '\\,', u, '}\\right)', suf, '\\)'].join('');
                    } else {
                        str = [pre, x, ' ', u, '<br />', y, ' ', u, suf].join('');
                    }
                }
            } else {
                str = txt;
            }
            return str;
        };

    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {

        if (attr.measure === 'length') {
            el = board.create('text', [
                function () { return (p.point1.X() + p.point2.X()) * 0.5; },
                function () { return (p.point1.Y() + p.point2.Y()) * 0.5; },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'line', 'length');

        } else if (attr.measure === 'slope') {
            el = board.create('text', [
                function () { return (p.point1.X() * 0.25 + p.point2.X() * 0.75); },
                function () { return (p.point1.Y() * 0.25 + p.point2.Y() * 0.75); },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'line', 'slope');
        }

    } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        if (attr.measure === 'radius') {
            el = board.create('text', [
                function () { return p.center.X() + p.Radius() * 0.5; },
                function () { return p.center.Y(); },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'circle', 'radius');

        } else if (attr.measure === 'area') {
            el = board.create('text', [
                function () { return p.center.X(); },
                function () { return p.center.Y() + p.Radius() * 0.5; },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'circle', 'area');

        } else if (attr.measure === 'circumference' || attr.measure === 'perimeter') {
            el = board.create('text', [
                function () { return p.getLabelAnchor(); },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'circle', 'perimeter');

        }
    } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
        if (attr.measure === 'area') {
            el = board.create('text', [
                function () { return p.getTextAnchor(); },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'polygon', 'area');

        } else if (attr.measure === 'perimeter') {
            el = board.create('text', [
                function () {
                    var last = p.borders.length - 1;
                    if (last >= 0) {
                        return [
                            (p.borders[last].point1.X() + p.borders[last].point2.X()) * 0.5,
                            (p.borders[last].point1.Y() + p.borders[last].point2.Y()) * 0.5
                        ];
                    } else {
                        return p.getTextAnchor();
                    }
                },
                ''
            ], attr);
            txt_fun = getTextFun(el, p, 'polygon', 'perimeter');
        }

    } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
        el = board.create('text', [
            function () {
                return p.getLabelAnchor();
            },
            ''
        ], attr);
        txt_fun = getTextFun(el, p, 'angle', attr.measure);
    }

    if (Type.exists(el)) {
        el.setText(txt_fun);
        p.addChild(el);
        el.setParents([p]);
    }

    return el;
};

JXG.registerElement("smartlabel", JXG.createSmartLabel);
