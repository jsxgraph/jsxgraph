/*
    Copyright 2008-2026
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
 * board.create('smartlabel', [p1], {digits: 1, baseUnit: 'm', dir: 'col', useMathJax: false});
 *
 * </pre><div id="JXG30cd1f9e-7e78-48f3-91a2-9abd466a754f" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG30cd1f9e-7e78-48f3-91a2-9abd466a754f',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [3, 4], {showInfobox: false, withLabel: false});
 *     board.create('smartlabel', [p1], {digits: 1, baseUnit: 'cm', dir: 'col', useMathJax: false});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var s1 = board.create('line', [[-7, 2], [6, -6]], {point1: {visible:true}, point2: {visible:true}});
 * board.create('smartlabel', [s1], {baseUnit: 'm', measure: 'length', prefix: 'L = ', useMathJax: false});
 * board.create('smartlabel', [s1], {baseUnit: 'm',  measure: 'slope', prefix: '&Delta; = ', useMathJax: false});
 *
 *
 * </pre><div id="JXGfb4423dc-ee3a-4122-a186-82123019a835" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGfb4423dc-ee3a-4122-a186-82123019a835',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var s1 = board.create('line', [[-7, 2], [6, -6]], {point1: {visible:true}, point2: {visible:true}});
 *     board.create('smartlabel', [s1], {baseUnit: 'm', measure: 'length', prefix: 'L = ', useMathJax: false});
 *     board.create('smartlabel', [s1], {baseUnit: 'm',  measure: 'slope', prefix: '&Delta; = ', useMathJax: false});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var c1 = board.create('circle', [[0, 1], [4, 1]], {point2: {visible: true}});
 * board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'perimeter', prefix: 'U = ', useMathJax: false});
 * board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'area', prefix: 'A = ', useMathJax: false});
 * board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'radius', prefix: 'R = ', useMathJax: false});
 *
 *
 * </pre><div id="JXG763c4700-8273-4eb7-9ed9-1dc6c2c52e93" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG763c4700-8273-4eb7-9ed9-1dc6c2c52e93',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var c1 = board.create('circle', [[0, 1], [4, 1]], {point2: {visible: true}});
 *     board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'perimeter', prefix: 'U = ', useMathJax: false});
 *     board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'area', prefix: 'A = ', useMathJax: false});
 *     board.create('smartlabel', [c1], {baseUnit: 'm', measure: 'radius', prefix: 'R = ', useMathJax: false});
 *
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var p2 = board.create('polygon', [[-6, -5], [7, -7], [-4, 3]], {});
 * board.create('smartlabel', [p2], {
 *     baseUnit: 'm',
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
 *         baseUnit: 'm',
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
 * var sma = board.create('smartlabel', [a1], {digits: 1, prefix: a1.name + '=', baseUnit: '°', useMathJax: false});
 *
 * </pre><div id="JXG48d6d1ae-e04a-45f4-a743-273976712c0b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG48d6d1ae-e04a-45f4-a743-273976712c0b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var a1 = board.create('angle', [[1, -1], [1, 2], [1, 5]], {name: '&beta;', withLabel: false});
 *     var sma = board.create('smartlabel', [a1], {digits: 1, prefix: a1.name + '=', baseUnit: '°', useMathJax: false});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createSmartLabel = function (board, parents, attributes) {
    var el, attr,
        p, user_supplied_text;

    if (parents.length === 0 || (
        [Const.OBJECT_CLASS_POINT, Const.OBJECT_CLASS_LINE, Const.OBJECT_CLASS_CIRCLE].indexOf(parents[0].elementClass) < 0 &&
        [Const.OBJECT_TYPE_POLYGON, Const.OBJECT_TYPE_ANGLE].indexOf(parents[0].type) < 0
    )) {
        throw new Error(
            "JSXGraph: Can't create smartlabel with parent types " +
            "'" + typeof parents[0] + "', " +
            "'" + typeof parents[1] + "'."
        );
    }

    p = parents[0];
    user_supplied_text = parents[1] || '';

    attr = Type.copyAttributes(attributes, board.options, 'smartlabel');

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        attr = Type.merge(attr, Type.copyAttributes(attributes, board.options, 'smartlabelpoint'));

    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
        attr = Type.merge(attr, Type.copyAttributes(attributes, board.options, 'smartlabelline'));
        /**
         * @class
         * @ignore
         */
        attr.rotate = function (self) {
            var orientation = self.evalVisProp('orientation'),
                add;
            switch (orientation) {
                case 'none':
                    return 0;
                case 'orthogonal':
                    add = 270;
                    break;
                case 'orthogonal-inverted':
                    add = 90;
                    break;
                case 'parallel-inverted':
                case 'inverted':
                    add = 0;
                    break;
                default:
                    add = 360;
            }
            return (Math.atan(p.getSlope()) * 180 / Math.PI + add) % 360;
        };
        /**
         * @class
         * @ignore
         */
        attr.visible = function (self) {
            var orientation = self.evalVisProp('orientation'),
                sizeLabel = self.getSize(),
                sizeParent,
                c1, c2,
                dx, dy;

            c1 = p.point1.coords.scrCoords;
            c2 = p.point2.coords.scrCoords;
            dx = c2[1] - c1[1];
            dy = c2[2] - c1[2];
            sizeParent = Math.floor(Math.sqrt(dx * dx + dy * dy));

            switch (orientation) {
                case 'parallel':
                case 'parallel-inverted':
                case 'inverted':
                    return sizeLabel[0] < sizeParent * 0.7;

                case 'orthogonal':
                case 'orthogonal-inverted':
                    return sizeLabel[1] < sizeParent * 0.7;

                case 'none':
                default:
                    return p.L() >= 1.5;
            }
        };

    } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        attr = Type.merge(attr, Type.copyAttributes(attributes, board.options, 'smartlabelcircle'));
        /**
         * @class
         * @ignore
         */
        attr.visible = function (self) {
            var sizeLabel = self.getSize(),
                sizeParent,
                c1, c2,
                dx, dy;

            c1 = p.center.coords.scrCoords;
            if (p.point2) {
                c2 = p.point2.coords.scrCoords;
            } else {
                c2 = new JXG.Coords(JXG.COORDS_BY_USER, [p.center.coords.usrCoords[0], p.center.coords.usrCoords[1] + p.Radius()], p.board).scrCoords;
            }
            dx = c2[1] - c1[1];
            dy = c2[2] - c1[2];
            sizeParent = Math.floor(Math.sqrt(dx * dx + dy * dy)) * 2;

            return sizeLabel[0] < sizeParent * 0.6;
        };

    } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
        attr = Type.merge(attr, Type.copyAttributes(attributes, board.options, 'smartlabelpolygon'));
    } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
        attr = Type.merge(attr, Type.copyAttributes(attributes, board.options, 'smartlabelangle'));
        /**
         * @class
         * @ignore
         */
        attr.rotate = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = (Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI + 360) % 360;
            return (v > 90 && v < 270) ? v + 180 : v;
        };
        /**
         * @class
         * @ignore
         */
        attr.anchorX = function () {
            var c1 = p.center.coords.usrCoords,
                c2 = p.getLabelAnchor().usrCoords,
                v = (Math.atan2(c2[2] - c1[2], c2[1] - c1[1]) * 180 / Math.PI + 360) % 360;
            return (v > 90 && v < 270) ? 'right' : 'left';
        };
    }

    if (p.elementClass === Const.OBJECT_CLASS_POINT) {
        el = board.create('text', [
            function () { return p.X(); },
            function () { return p.Y(); },
            ''
        ], attr);

    } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {

        if (attr.measure === 'length') {
            el = board.create('text', [
                function () { return (p.point1.X() + p.point2.X()) * 0.5; },
                function () { return (p.point1.Y() + p.point2.Y()) * 0.5; },
                ''
            ], attr);

        } else if (attr.measure === 'slope') {
            el = board.create('text', [
                function () { return (p.point1.X() * 0.25 + p.point2.X() * 0.75); },
                function () { return (p.point1.Y() * 0.25 + p.point2.Y() * 0.75); },
                ''
            ], attr);
        }

    } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        if (attr.measure === 'radius') {
            el = board.create('text', [
                function () { return p.center.X() + p.Radius() * 0.5; },
                function () { return p.center.Y(); },
                ''
            ], attr);

        } else if (attr.measure === 'area') {
            el = board.create('text', [
                function () { return p.center.X(); },
                function () { return p.center.Y() + p.Radius() * 0.5; },
                ''
            ], attr);

        } else if (attr.measure === 'circumference' || attr.measure === 'perimeter') {
            el = board.create('text', [
                function () { return p.getLabelAnchor(); },
                ''
            ], attr);

        }
    } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
        if (attr.measure === 'area') {
            el = board.create('text', [
                function () { return p.getTextAnchor(); },
                ''
            ], attr);

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
        }

    } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
        el = board.create('text', [
            function () {
                return p.getLabelAnchor();
            },
            ''
        ], attr);
    }

    if (!Type.exists(el)) {
        return el;
    }

    el.Value = function () {
        var mType = this.evalVisProp('measure');

        switch (mType) {
            case 'length':
                return p.L();

            case 'slope':
                return p.Slope();

            case 'area':
                return p.Area();

            case 'radius':
                return p.Radius();

            case 'perimeter':
            case 'circumference':
                return p.Perimeter();

            case 'rad':
                return p.Value();

            case 'deg':
                return p.Value() * 180 / Math.PI;

            case 'coords':
                return [p.X(), p.Y()];

            default:
                return 0.0;
        }
    };

    el.Dimension = function () {
        var mType = this.evalVisProp('measure');

        switch (mType) {
            case 'area':
                return 2;

            case 'length':
            case 'radius':
            case 'perimeter':
            case 'circumference':
                return 1;

            case 'slope':
                return 0;

            case 'rad':
            case 'deg':
                // Angles in various units has dimension 0
                return 0;

            case 'coords':
                return 1;

            default:
                return 0;
        }
    };

    el.Unit = function (dimension) {
        var unit = '',
            units = el.evalVisProp('units'),
            dim = dimension,
            dims = {}, i;

        if (!Type.exists(dim)) {
            dim = el.Dimension();
        }

        if (Type.isArray(dimension)) {
            for (i = 0; i < dimension.length; i++) {
                dims['dim' + dimension[i]] = el.Unit(dimension[i]);
            }
            return dims;
        }

        if (Type.isObject(units) && Type.exists(units[dim]) && units[dim] !== false) {
            unit = el.eval(units[dim]);
        } else if (Type.isObject(units) && Type.exists(units['dim' + dim]) && units['dim' + dim] !== false) {
            // In some cases, object keys must not be numbers. This allows key 'dim1' instead of '1'.
            unit = el.eval(units['dim' + dim]);
        } else {
            unit = el.evalVisProp('baseUnit');

            if (unit === '' && el.evalVisProp('unit') !== '') {
                // Backwards compatibility
                unit = el.evalVisProp('unit');
            }

            if (dim === 0) {
                unit = '';
            } else if (dim > 1 && unit !== '') {
                unit = unit + '^{' + dim + '}';
            }
        }

        return unit;
    };

    el.setText(function () {
        var str = '',
            val,
            txt = Type.evaluate(user_supplied_text),
            digits,
            u,
            pre = '',
            suf = '',
            dir,
            mj,
            i;

        if (txt !== '') {
            return txt;
        }

        val = el.Value();
        digits = el.evalVisProp('digits');
        u = el.Unit();
        pre = '';
        suf = '';
        dir = el.evalVisProp('dir');
        mj = el.evalVisProp('usemathjax') || el.evalVisProp('usekatex');

        if (el.evalVisProp('showPrefix')) {
            pre = el.evalVisProp('prefix');
        }
        if (el.evalVisProp('showSuffix')) {
            suf = el.evalVisProp('suffix');
        }

        if (el.useLocale()) {
            if (Type.isArray(val)) {
                for (i = 0; i < val.length; i++) {
                    val[i] = el.formatNumberLocale(val[i], digits);
                }
            } else {
                val = el.formatNumberLocale(val, digits);
            }
        } else {
            if (Type.isArray(val)) {
                for (i = 0; i < val.length; i++) {
                    val[i] = Type.toFixed(val[i], digits);
                }
            } else {
                val = Type.toFixed(val, digits);
            }
        }
        if (Type.isArray(val)) {
            if (dir === 'row') {
                if (mj) {
                    str = ['\\(', pre, x, '\\,', u, ' / ', y, '\\,', u, suf, '\\)'].join('');
                } else {
                    str = [pre, x, ' ', u, ' / ', y, ' ', u, suf].join('');
                }
            } else if (dir.indexOf('col') === 0) { // Starts with 'col'
                str = [];
                if (mj) {
                    str.push('\\(', pre, '\\left(\\array{');
                    for (i = 0; i < val.length; i++) {
                        str.push(val[i], '\\,', u);
                        if (i < val.length - 1) {
                            str.push('\\\\ ');
                        }
                    }
                    str.push('}\\right)', suf, '\\)');

                } else {
                    str.push(pre);
                    for (i = 0; i < val.length; i++) {
                        str.push(val[i], ' ', u);
                        if (i < val.length - 1) {
                            str.push('<br />');
                        }
                    }
                    str.push(suf);
                }
                str = str.join('');
            }
        } else {
            if (mj) {
                str = ['\\(', pre, val, '\\,', u, suf, '\\)'].join('');
            } else {
                str = [pre, val, u, suf].join('');
            }
        }

        return str;
    });

    p.addChild(el);
    el.setParents([p]);

    el.methodMap = Type.deepCopy(el.methodMap, {
        Value: "Value",
        V: "Value",
        Dimension: "Dimension",
        Unit: "Unit"
    });

    return el;
};

JXG.registerElement("smartlabel", JXG.createSmartLabel);
