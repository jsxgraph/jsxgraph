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
 * @class Smart label. These are customized text elements for displaying measurements, like length of a
 * segment, perimeter or area of a circle or polygon, slope of a line, value of an angle, and coordinates of a point.
 * <p>
 * If additionally a text, or a function is supplied and the content is not the empty string,
 * that text is displayed instead of the measurement.
 * <p>
 * Smartlabels use custom made CSS layouts defined in jsxgraph.css. These CSS classes can be replaced by 
 * other classes.
 *  
 *
 * @pseudo
 * @name Smartlabel
 * @augments JXG.Text
 * @constructor
 * @type JXG.Text
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.GeometryElement} Parent parent object: point, line, circle, polygon, angle.
 * @param {String|Function} Text Optional text. In case, this content is not the empty string, 
 *  the measurement is overwritten by this text.
 *      
 * @example
 * board.options.text.fontSize = 8;
 * board.options.smartlabelangle.useMathJax = false;
 * board.options.smartlabelcircle.useMathJax = false;
 * board.options.smartlabelline.useMathJax = false;
 * board.options.smartlabelpoint.useMathJax = false;
 * board.options.smartlabelpolygon.useMathJax = false;
 * 
 * var p1 = board.create('point', [1, 1], {showInfobox: false});
 * board.create('smartlabel', [p1], {digits: 1, unit: 'm', dir: 'col', useMathJax: true});
 * 
 * var s1 = board.create('segment', [[-7, 2], [-5, 9]], {point1: {visible:true}, point2: {visible:true}});
 * board.create('smartlabel', [s1], {unit: 'm', measure: 'length'});
 * board.create('smartlabel', [s1], {unit: 'm',  measure: 'slope'});
 * 
 * var c1 = board.create('circle', [[0, 5], [5, 5]], {point2: {visible: true}});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'perimeter'});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'area'});
 * board.create('smartlabel', [c1], {unit: 'm', measure: 'radius'});
 * 
 * var p2 = board.create('polygon', [[-6, -8], [8, -8], [-4, -2]], {});
 * board.create('smartlabel', [p2], {unit: 'm', measure: 'area'});
 * board.create('smartlabel', [p2], {unit: 'm', measure: 'perimeter'});
 * 
 * var a1 = board.create('angle', [[8, -1.5], [5, -2], [5, 1]], {name: '&beta;'});
 * board.create('smartlabel', [a1], {digits: 1});
 * 
 * </pre><div id="JXG4e575eaf-990d-42ff-a9d9-77cc5695f196" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG4e575eaf-990d-42ff-a9d9-77cc5695f196',
 *             {boundingbox: [-10, 10, 10,-10], axis: true, showcopyright: false, shownavigation: false});
 * board.options.text.fontSize = 8;
 * board.options.smartlabelangle.useMathJax = false;
 * board.options.smartlabelcircle.useMathJax = false;
 * board.options.smartlabelline.useMathJax = false;
 * board.options.smartlabelpoint.useMathJax = false;
 * board.options.smartlabelpolygon.useMathJax = false;
 *     var p1 = board.create('point', [1, 1], {showInfobox: false});
 *     board.create('smartlabel', [p1], {digits: 1, unit: 'm', dir: 'col'});
 *     
 *     var s1 = board.create('segment', [[-7, 2], [-5, 9]], {point1: {visible:true}, point2: {visible:true}});
 *     board.create('smartlabel', [s1], {unit: 'm', measure: 'length'});
 *     board.create('smartlabel', [s1], {unit: 'm',  measure: 'slope'});
 *     
 *     var c1 = board.create('circle', [[0, 5], [5, 5]], {point2: {visible: true}});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'perimeter'});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'area'});
 *     board.create('smartlabel', [c1], {unit: 'm', measure: 'radius'});
 *     
 *     var p2 = board.create('polygon', [[-6, -8], [8, -8], [-4, -2]], {});
 *     board.create('smartlabel', [p2], {unit: 'm', measure: 'area'});
 *     board.create('smartlabel', [p2], {unit: 'm', measure: 'perimeter'});
 *     
 *     var a1 = board.create('angle', [[8, -1.5], [5, -2], [5, 1]], {name: '&beta;'});
 *     board.create('smartlabel', [a1], {digits: 1});
 * 
 *     })();
 * 
 * </script><pre>
 * 
 * @example
 * var p2 = board.create('polygon', [[-6, -6], [6, 4], [-4, 3]], {});
 * board.create('smartlabel', [p2], {
 *     unit: 'm',
 *     measure: 'area',
 *     useMathJax: false,
 *     cssClass: 'smart-label-pure polygon',
 *     highlightCssClass: 'smart-label-pure polygon'
 * });
 * board.create('smartlabel', [p2, () => 'x = ' + p2.vertices[0].X().toFixed(1)], {
 *     measure: 'perimeter',
 *     useMathJax: false,
 *     cssClass: 'smart-label-outline polygon',
 *     highlightCssClass: 'smart-label-outline polygon'
 * });
 * 
 * </pre><div id="JXG64b5419c-1d9e-4d6b-965d-f43706546c33" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG64b5419c-1d9e-4d6b-965d-f43706546c33',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p2 = board.create('polygon', [[-6, -6], [6, 4], [-4, 3]], {});
 *     board.create('smartlabel', [p2], {
 *         unit: 'm',
 *         measure: 'area',
 *         useMathJax: false,
 *         cssClass: 'smart-label-pure smart-label-polygon',
 *         highlightCssClass: 'smart-label-pure smart-label-polygon'
 *     });
 *     board.create('smartlabel', [p2, () => 'x = ' + p2.vertices[0].X().toFixed(1)], {
 *         measure: 'perimeter',
 *         useMathJax: false,
 *         cssClass: 'smart-label-outline smart-label-polygon',
 *         highlightCssClass: 'smart-label-outline smart-label-polygon'
 *     });
 * 
 *     })();
 * 
 * </script><pre>
 * 
 */
JXG.createSmartLabel = function (board, parents, attributes) {
    var el, attr,
        p = parents[0],
        user_supplied_text = parents[1] || '',
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

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelpoint');
    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelline');
        attr.rotate = function () { return Math.atan(p.getSlope()) * 180 / Math.PI; };
        attr.visible = function () { return (p.L() < 1.5) ? false : true; };

    } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelcircle');
        attr.visible = function () { return (p.Radius() < 1.5) ? false : true; };

    } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelpolygon');
    } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
        attr = Type.copyAttributes(attributes, board.options, 'smartlabelangle');
        attr.rotate = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI;
            return (v > 90 && v < 270) ? v + 180 : v;
        };
        attr.anchorX = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI;
            return (v > 90 && v < 270) ? 'right' : 'left';
        };
    }

    var getTextFun = function (el, p, elType, mType) {
        var measure;
        switch (mType) {
            case 'length':
                measure = function () { return p.L(); };
                break;
            case 'slope':
                measure = function () { return p.getSlope(); };
                break;
            case 'area':
                measure = function () { return p.Area(); };
                break;
            case 'radius':
                measure = function () { return p.Radius(); };
                break;
            case 'perimeter':
                measure = function () { return p.Perimeter(); };
                break;
            case 'angle':
                measure = function () { return p.Value(); };
                break;
            default:
                measure = function () { return 0.0; };
        }

        return function () {
            var str = '',
                txt = Type.evaluate(user_supplied_text),
                digits = Type.evaluate(el.visProp.digits),
                u = Type.evaluate(el.visProp.unit),
                pre = Type.evaluate(el.visProp.prefix),
                suf = Type.evaluate(el.visProp.suffix),
                mj = Type.evaluate(el.visProp.usemathjax) || Type.evaluate(el.visProp.usekatex),
                dir, x, y;

            if (elType === 'point') {
                dir = Type.evaluate(el.visProp.dir),
                    x = Type.toFixed(p.X(), digits),
                    y = Type.toFixed(p.Y(), digits);
            }

            if (txt === '') {
                if (mj) {
                    str = ['\\(', pre, Type.toFixed(measure(), digits), '\\,', u, suf, '\\)'].join('');
                } else {
                    str = [pre, Type.toFixed(measure(), digits), u, suf].join('');
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
                digits = Type.evaluate(el.visProp.digits),
                u = Type.evaluate(el.visProp.unit),
                pre = Type.evaluate(el.visProp.prefix),
                suf = Type.evaluate(el.visProp.suffix),
                dir = Type.evaluate(el.visProp.dir),
                mj = Type.evaluate(el.visProp.usemathjax) || Type.evaluate(el.visProp.usekatex),
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
        txt_fun = getTextFun(el, p, 'angle', 'angle');
    }

    if (Type.exists(el)) {
        el.setText(txt_fun);
        p.addChild(el);
        el.setParents([p]);
    }

    return el;
};

JXG.registerElement("smartlabel", JXG.createSmartLabel);
