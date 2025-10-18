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

/*global JXG: true, define: true, AMprocessNode: true, document: true, Image: true, module: true, require: true */
/*jslint nomen: true, plusplus: true, newcap:true*/

import JXG from "../jxg.js";
import AbstractRenderer from "./abstract.js";
import Const from "../base/constants.js";
import Env from "../utils/env.js";
import Type from "../utils/type.js";
import UUID from "../utils/uuid.js";
import Color from "../utils/color.js";
import Coords from "../base/coords.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Numerics from "../math/numerics.js";
// import $__canvas from 'canvas.js'

/**
 * Uses HTML Canvas to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
 *
 * @class JXG.CanvasRenderer
 * @augments JXG.AbstractRenderer
 * @param {Node} container Reference to a DOM node containing the board.
 * @param {Object} dim The dimensions of the board
 * @param {Number} dim.width
 * @param {Number} dim.height
 * @see JXG.AbstractRenderer
 */
JXG.CanvasRenderer = function (container, dim) {
    this.type = 'canvas';

    this.canvasRoot = null;
    this.suspendHandle = null;
    this.canvasId = UUID.genUUID();

    this.canvasNamespace = null;

    if (Env.isBrowser) {
        this.container = container;
        this.container.style.MozUserSelect = 'none';
        this.container.style.userSelect = 'none';

        this.container.style.overflow = 'hidden';
        if (this.container.style.position === "") {
            this.container.style.position = 'relative';
        }

        this.container.innerHTML = [
            '<canvas id="', this.canvasId, '" width="', dim.width, 'px" height="', dim.height, 'px"></canvas>'
        ].join("");
        this.canvasRoot = this.container.ownerDocument.getElementById(this.canvasId);
        this.canvasRoot.style.display = 'block';
        this.context = this.canvasRoot.getContext('2d');
    } else if (Env.isNode()) {
        try {
            this.canvasRoot = JXG.createCanvas(500, 500);
            this.context = this.canvasRoot.getContext('2d');
        } catch (err) {
            throw new Error('JXG.createCanvas not available.\n' +
                'Install the npm package `canvas`\n' +
                'and call:\n' +
                '    import { createCanvas } from "canvas.js"\n' +
                '    JXG.createCanvas = createCanvas;\n');
        }
    }
};

JXG.CanvasRenderer.prototype = new AbstractRenderer();

JXG.extend(
    JXG.CanvasRenderer.prototype,
    /** @lends JXG.CanvasRenderer.prototype */ {
        /* **************************
         *   private methods only used
         *   in this renderer. Should
         *   not be called from outside.
         * **************************/

        /**
         * Draws a filled polygon.
         * @param {Array} shape A matrix presented by a two dimensional array of numbers.
         * @see JXG.AbstractRenderer#drawArrows
         * @private
         */
        _drawPolygon: function (shape, degree, doFill) {
            var i,
                len = shape.length,
                context = this.context;

            if (len > 0) {
                if (doFill) {
                    context.lineWidth = 0;
                }
                context.beginPath();
                context.moveTo(shape[0][0], shape[0][1]);
                if (degree === 1) {
                    for (i = 1; i < len; i++) {
                        context.lineTo(shape[i][0], shape[i][1]);
                    }
                } else {
                    for (i = 1; i < len; i += 3) {
                        context.bezierCurveTo(
                            shape[i][0],
                            shape[i][1],
                            shape[i + 1][0],
                            shape[i + 1][1],
                            shape[i + 2][0],
                            shape[i + 2][1]
                        );
                    }
                }
                if (doFill) {
                    context.lineTo(shape[0][0], shape[0][1]);
                    context.closePath();
                    context.fill('evenodd');
                } else {
                    context.stroke();
                }
            }
        },

        /**
         * Sets the fill color and fills an area.
         * @param {JXG.GeometryElement} el An arbitrary JSXGraph element, preferably one with an area.
         * @private
         */
        _fill: function (el) {
            var context = this.context;

            context.save();
            if (this._setColor(el, 'fill')) {
                context.fill('evenodd');
            }
            context.restore();
        },

        /**
         * Rotates a point around <tt>(0, 0)</tt> by a given angle.
         * @param {Number} angle An angle, given in rad.
         * @param {Number} x X coordinate of the point.
         * @param {Number} y Y coordinate of the point.
         * @returns {Array} An array containing the x and y coordinate of the rotated point.
         * @private
         */
        _rotatePoint: function (angle, x, y) {
            return [
                x * Math.cos(angle) - y * Math.sin(angle),
                x * Math.sin(angle) + y * Math.cos(angle)
            ];
        },

        /**
         * Rotates an array of points around <tt>(0, 0)</tt>.
         * @param {Array} shape An array of array of point coordinates.
         * @param {Number} angle The angle in rad the points are rotated by.
         * @returns {Array} Array of array of two dimensional point coordinates.
         * @private
         */
        _rotateShape: function (shape, angle) {
            var i,
                rv = [],
                len = shape.length;

            if (len <= 0) {
                return shape;
            }

            for (i = 0; i < len; i++) {
                rv.push(this._rotatePoint(angle, shape[i][0], shape[i][1]));
            }

            return rv;
        },

        /**
         * Set the gradient angle for linear color gradients.
         *
         * @private
         * @param {JXG.GeometryElement} node An arbitrary JSXGraph element, preferably one with an area.
         * @param {Number} radians angle value in radians. 0 is horizontal from left to right, Pi/4 is vertical from top to bottom.
         */
        updateGradientAngle: function (el, radians) {
            // Angles:
            // 0: ->
            // 90: down
            // 180: <-
            // 90: up
            var f = 1.0,
                co = Math.cos(-radians),
                si = Math.sin(-radians),
                bb = el.getBoundingBox(),
                c1, c2,
                x1, x2,
                y1, y2,
                x1s, x2s, y1s, y2s,
                dx, dy;

            if (Math.abs(co) > Math.abs(si)) {
                f /= Math.abs(co);
            } else {
                f /= Math.abs(si);
            }
            if (co >= 0) {
                x1 = 0;
                x2 = co * f;
            } else {
                x1 = -co * f;
                x2 = 0;
            }
            if (si >= 0) {
                y1 = 0;
                y2 = si * f;
            } else {
                y1 = -si * f;
                y2 = 0;
            }

            c1 = new Coords(Const.COORDS_BY_USER, [bb[0], bb[1]], el.board);
            c2 = new Coords(Const.COORDS_BY_USER, [bb[2], bb[3]], el.board);
            dx = c2.scrCoords[1] - c1.scrCoords[1];
            dy = c2.scrCoords[2] - c1.scrCoords[2];

            x1s = c1.scrCoords[1] + dx * x1;
            y1s = c1.scrCoords[2] + dy * y1;
            x2s = c1.scrCoords[1] + dx * x2;
            y2s = c1.scrCoords[2] + dy * y2;

            return this.context.createLinearGradient(x1s, y1s, x2s, y2s);
        },

        /**
         * Set circles for radial color gradients.
         *
         * @private
         * @param {SVGnode} node SVG gradient node
         * @param {Number} cx Canvas value x1 (but value between 0 and 1)
         * @param {Number} cy  Canvas value y1 (but value between 0 and 1)
         * @param {Number} r  Canvas value r1 (but value between 0 and 1)
         * @param {Number} fx  Canvas value x0 (but value between 0 and 1)
         * @param {Number} fy  Canvas value x1 (but value between 0 and 1)
         * @param {Number} fr  Canvas value r0 (but value between 0 and 1)
         */
        updateGradientCircle: function (el, cx, cy, r, fx, fy, fr) {
            var bb = el.getBoundingBox(),
                c1, c2,
                cxs, cys, rs,
                fxs, fys, frs,
                dx, dy;

            c1 = new Coords(Const.COORDS_BY_USER, [bb[0], bb[1]], el.board);
            c2 = new Coords(Const.COORDS_BY_USER, [bb[2], bb[3]], el.board);
            dx = c2.scrCoords[1] - c1.scrCoords[1];
            dy = c1.scrCoords[2] - c2.scrCoords[2];

            cxs = c1.scrCoords[1] + dx * cx;
            cys = c2.scrCoords[2] + dy * cy;
            fxs = c1.scrCoords[1] + dx * fx;
            fys = c2.scrCoords[2] + dy * fy;
            rs = r * (dx + dy) * 0.5;
            frs = fr * (dx + dy) * 0.5;

            return this.context.createRadialGradient(fxs, fys, frs, cxs, cys, rs);
        },

        // documented in JXG.AbstractRenderer
        updateGradient: function (el) {
            var col,
                // op,
                ev_g = el.evalVisProp('gradient'),
                gradient;

            // op = el.evalVisProp('fillopacity');
            // op = op > 0 ? op : 0;
            col = el.evalVisProp('fillcolor');

            if (ev_g === 'linear') {
                gradient = this.updateGradientAngle(
                    el,
                    el.evalVisProp('gradientangle')
                );
            } else if (ev_g === 'radial') {
                gradient = this.updateGradientCircle(
                    el,
                    el.evalVisProp('gradientcx'),
                    el.evalVisProp('gradientcy'),
                    el.evalVisProp('gradientr'),
                    el.evalVisProp('gradientfx'),
                    el.evalVisProp('gradientfy'),
                    el.evalVisProp('gradientfr')
                );
            }

            if (col !== "none" && col !== "" && col !== false) {
                gradient.addColorStop(el.evalVisProp('gradientstartoffset'), col);
                gradient.addColorStop(
                    el.evalVisProp('gradientendoffset'),
                    el.evalVisProp('gradientsecondcolor')
                );
            }
            return gradient;
        },

        /**
         * Sets color and opacity for filling and stroking.
         * type is the attribute from visProp and targetType the context[targetTypeStyle].
         * This is necessary, because the fill style of a text is set by the stroke attributes of the text element.
         * @param {JXG.GeometryElement} el Any JSXGraph element.
         * @param {String} [type='stroke'] Either <em>fill</em> or <em>stroke</em>.
         * @param {String} [targetType=type] (optional) Either <em>fill</em> or <em>stroke</em>.
         * @returns {Boolean} If the color could be set, <tt>true</tt> is returned.
         * @private
         */
        _setColor: function (el, type, targetType) {
            var hasColor = true,
                lc, hl, sw,
                rgba, rgbo,
                c, o, oo,
                grad;

            type = type || 'stroke';
            targetType = targetType || type;

            hl = this._getHighlighted(el);

            // type is equal to 'fill' or 'stroke'
            rgba = el.evalVisProp(hl + type + 'color');
            if (rgba !== "none" && rgba !== "" && rgba !== false) {
                o = el.evalVisProp(hl + type + 'opacity');
                o = o > 0 ? o : 0;

                if (rgba.length !== 9) {
                    // RGB
                    c = rgba;
                    oo = o;
                    // True RGBA, not RGB
                } else {
                    // RGBA
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }
                this.context.globalAlpha = oo;

                this.context[targetType + "Style"] = c;
            } else {
                hasColor = false;
            }

            if (type !== 'stroke') {
                // For the time being, gradients are only supported for fills
                grad = el.evalVisProp('gradient');
                if (grad === "linear" || grad === 'radial') {
                    this.context.globalAlpha = oo;
                    this.context[targetType + "Style"] = this.updateGradient(el);
                    return hasColor;
                }
            }

            sw = parseFloat(el.evalVisProp(hl + 'strokewidth'));
            if (type === "stroke" && !isNaN(sw)) {
                if (sw === 0) {
                    this.context.globalAlpha = 0;
                } else {
                    this.context.lineWidth = sw;
                }
            }

            lc = el.evalVisProp('linecap');
            if (type === "stroke" && lc !== undefined && lc !== "") {
                this.context.lineCap = lc;
            }

            return hasColor;
        },

        /**
         * Sets color and opacity for drawing paths and lines and draws the paths and lines.
         * @param {JXG.GeometryElement} el An JSXGraph element with a stroke.
         * @private
         */
        _stroke: function (el) {
            var context = this.context,
                ev_dash = el.evalVisProp('dash'),
                ds = el.evalVisProp('dashscale'),
                sw = ds ? 0.5 * el.evalVisProp('strokewidth') : 1;

            context.save();

            if (ev_dash > 0) {
                if (context.setLineDash) {
                    context.setLineDash(
                        // sw could distinguish highlighting or not.
                        // But it seems to preferable to ignore this.
                        this.dashArray[ev_dash - 1].map(function (x) { return x * sw; })
                    );
                }
            } else {
                this.context.lineDashArray = [];
            }

            if (this._setColor(el, 'stroke')) {
                context.stroke();
            }

            context.restore();
        },

        /**
         * Translates a set of points.
         * @param {Array} shape An array of point coordinates.
         * @param {Number} x Translation in X direction.
         * @param {Number} y Translation in Y direction.
         * @returns {Array} An array of translated point coordinates.
         * @private
         */
        _translateShape: function (shape, x, y) {
            var i,
                rv = [],
                len = shape.length;

            if (len <= 0) {
                return shape;
            }

            for (i = 0; i < len; i++) {
                rv.push([shape[i][0] + x, shape[i][1] + y]);
            }

            return rv;
        },

        /* ********* Point related stuff *********** */

        // documented in AbstractRenderer
        drawPoint: function (el) {
            var f = el.evalVisProp('face'),
                size = el.evalVisProp('size'),
                scr = el.coords.scrCoords,
                sqrt32 = size * Math.sqrt(3) * 0.5,
                s05 = size * 0.5,
                stroke05 = parseFloat(el.evalVisProp('strokewidth')) / 2.0,
                context = this.context;

            if (!el.visPropCalc.visible) {
                return;
            }

            switch (f) {
                case "cross": // x
                case "x":
                    context.beginPath();
                    context.moveTo(scr[1] - size, scr[2] - size);
                    context.lineTo(scr[1] + size, scr[2] + size);
                    context.moveTo(scr[1] + size, scr[2] - size);
                    context.lineTo(scr[1] - size, scr[2] + size);
                    context.lineCap = 'round';
                    context.lineJoin = 'round';
                    context.closePath();
                    this._stroke(el);
                    break;
                case "circle": // dot
                case "o":
                    context.beginPath();
                    context.arc(scr[1], scr[2], size + 1 + stroke05, 0, 2 * Math.PI, false);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
                case "square": // rectangle
                case "[]":
                    if (size <= 0) {
                        break;
                    }

                    context.save();
                    if (this._setColor(el, "stroke", 'fill')) {
                        context.fillRect(
                            scr[1] - size - stroke05,
                            scr[2] - size - stroke05,
                            size * 2 + 3 * stroke05,
                            size * 2 + 3 * stroke05
                        );
                    }
                    context.restore();
                    context.save();
                    this._setColor(el, 'fill');
                    context.fillRect(
                        scr[1] - size + stroke05,
                        scr[2] - size + stroke05,
                        size * 2 - stroke05,
                        size * 2 - stroke05
                    );
                    context.restore();
                    break;
                case "plus": // +
                case "+":
                    context.beginPath();
                    context.moveTo(scr[1] - size, scr[2]);
                    context.lineTo(scr[1] + size, scr[2]);
                    context.moveTo(scr[1], scr[2] - size);
                    context.lineTo(scr[1], scr[2] + size);
                    context.lineCap = 'round';
                    context.lineJoin = 'round';
                    context.closePath();
                    this._stroke(el);
                    break;
                case "divide":
                case "|":
                    context.beginPath();
                    context.moveTo(scr[1], scr[2] - size);
                    context.lineTo(scr[1], scr[2] + size);
                    context.lineCap = 'round';
                    context.lineJoin = 'round';
                    context.closePath();
                    this._stroke(el);
                    break;
                case "minus":
                case "-":
                    context.beginPath();
                    context.moveTo(scr[1] - size, scr[2]);
                    context.lineTo(scr[1] + size, scr[2]);
                    context.lineCap = 'round';
                    context.lineJoin = 'round';
                    context.closePath();
                    this._stroke(el);
                    break;
                /* eslint-disable no-fallthrough */
                case "diamond2":
                case "<<>>":
                    size *= 1.41;
                case "diamond": // <>
                case "<>":
                    context.beginPath();
                    context.moveTo(scr[1] - size, scr[2]);
                    context.lineTo(scr[1], scr[2] + size);
                    context.lineTo(scr[1] + size, scr[2]);
                    context.lineTo(scr[1], scr[2] - size);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
                /* eslint-enable no-fallthrough */
                case "triangleup":
                case "A":
                case "a":
                case "^":
                    context.beginPath();
                    context.moveTo(scr[1], scr[2] - size);
                    context.lineTo(scr[1] - sqrt32, scr[2] + s05);
                    context.lineTo(scr[1] + sqrt32, scr[2] + s05);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
                case "triangledown":
                case "v":
                    context.beginPath();
                    context.moveTo(scr[1], scr[2] + size);
                    context.lineTo(scr[1] - sqrt32, scr[2] - s05);
                    context.lineTo(scr[1] + sqrt32, scr[2] - s05);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
                case "triangleleft":
                case "<":
                    context.beginPath();
                    context.moveTo(scr[1] - size, scr[2]);
                    context.lineTo(scr[1] + s05, scr[2] - sqrt32);
                    context.lineTo(scr[1] + s05, scr[2] + sqrt32);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
                case "triangleright":
                case ">":
                    context.beginPath();
                    context.moveTo(scr[1] + size, scr[2]);
                    context.lineTo(scr[1] - s05, scr[2] - sqrt32);
                    context.lineTo(scr[1] - s05, scr[2] + sqrt32);
                    context.closePath();
                    this._fill(el);
                    this._stroke(el);
                    break;
            }
        },

        // documented in AbstractRenderer
        updatePoint: function (el) {
            this.drawPoint(el);
        },

        /* ********* Line related stuff *********** */

        /**
         * Draws arrows of an element (usually a line) in canvas renderer.
         * @param {JXG.GeometryElement} el Line to be drawn.
         * @param {Array} scr1 Screen coordinates of the start position of the line or curve.
         * @param {Array} scr2 Screen coordinates of the end position of the line or curve.
         * @param {String} hl String which carries information if the element is highlighted. Used for getting the correct attribute.
         * @private
         */
        drawArrows: function (el, scr1, scr2, hl, a) {
            var x1, y1, x2, y2,
                w, w0,
                arrowHead, arrowTail,
                context = this.context,
                size = 6,
                type = 1,
                type_fa,
                type_la,
                degree_fa = 1,
                degree_la = 1,
                doFill,
                i, len,
                d1x, d1y,
                d2x, d2y,
                last,
                ang1, ang2,
                ev_fa = a.evFirst,
                ev_la = a.evLast;

            if (el.evalVisProp('strokecolor') !== "none" && (ev_fa || ev_la)) {
                if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                    x1 = scr1.scrCoords[1];
                    y1 = scr1.scrCoords[2];
                    x2 = scr2.scrCoords[1];
                    y2 = scr2.scrCoords[2];
                    ang1 = ang2 = Math.atan2(y2 - y1, x2 - x1);
                } else {
                    x1 = el.points[0].scrCoords[1];
                    y1 = el.points[0].scrCoords[2];

                    last = el.points.length - 1;
                    if (last < 1) {
                        // No arrows for curves consisting of 1 point
                        return;
                    }
                    x2 = el.points[el.points.length - 1].scrCoords[1];
                    y2 = el.points[el.points.length - 1].scrCoords[2];

                    d1x = el.points[1].scrCoords[1] - el.points[0].scrCoords[1];
                    d1y = el.points[1].scrCoords[2] - el.points[0].scrCoords[2];
                    d2x = el.points[last].scrCoords[1] - el.points[last - 1].scrCoords[1];
                    d2y = el.points[last].scrCoords[2] - el.points[last - 1].scrCoords[2];
                    if (ev_fa) {
                        ang1 = Math.atan2(d1y, d1x);
                    }
                    if (ev_la) {
                        ang2 = Math.atan2(d2y, d2x);
                    }
                }

                w0 = el.evalVisProp(hl + 'strokewidth');

                if (ev_fa) {
                    size = a.sizeFirst;

                    w = w0 * size;

                    type = a.typeFirst;
                    type_fa = type;

                    if (type === 2) {
                        arrowTail = [
                            [w, -w * 0.5],
                            [0.0, 0.0],
                            [w, w * 0.5],
                            [w * 0.5, 0.0]
                        ];
                    } else if (type === 3) {
                        arrowTail = [
                            [w / 3.0, -w * 0.5],
                            [0.0, -w * 0.5],
                            [0.0, w * 0.5],
                            [w / 3.0, w * 0.5]
                        ];
                    } else if (type === 4) {
                        w /= 10;
                        degree_fa = 3;
                        arrowTail = [
                            [10.0, 3.31],
                            [6.47, 3.84],
                            [2.87, 4.5],
                            [0.0, 6.63],
                            [0.67, 5.52],
                            [1.33, 4.42],
                            [2.0, 3.31],
                            [1.33, 2.21],
                            [0.67, 1.1],
                            [0.0, 0.0],
                            [2.87, 2.13],
                            [6.47, 2.79],
                            [10.0, 3.31]
                        ];
                        len = arrowTail.length;
                        for (i = 0; i < len; i++) {
                            arrowTail[i][0] *= -w;
                            arrowTail[i][1] *= w;
                            arrowTail[i][0] += 10 * w;
                            arrowTail[i][1] -= 3.31 * w;
                        }
                    } else if (type === 5) {
                        w /= 10;
                        degree_fa = 3;
                        arrowTail = [
                            [10.0, 3.28],
                            [6.61, 4.19],
                            [3.19, 5.07],
                            [0.0, 6.55],
                            [0.62, 5.56],
                            [1.0, 4.44],
                            [1.0, 3.28],
                            [1.0, 2.11],
                            [0.62, 0.99],
                            [0.0, 0.0],
                            [3.19, 1.49],
                            [6.61, 2.37],
                            [10.0, 3.28]
                        ];
                        len = arrowTail.length;
                        for (i = 0; i < len; i++) {
                            arrowTail[i][0] *= -w;
                            arrowTail[i][1] *= w;
                            arrowTail[i][0] += 10 * w;
                            arrowTail[i][1] -= 3.28 * w;
                        }
                    } else if (type === 6) {
                        w /= 10;
                        degree_fa = 3;
                        arrowTail = [
                            [10.0, 2.84],
                            [6.61, 3.59],
                            [3.21, 4.35],
                            [0.0, 5.68],
                            [0.33, 4.73],
                            [0.67, 3.78],
                            [1.0, 2.84],
                            [0.67, 1.89],
                            [0.33, 0.95],
                            [0.0, 0.0],
                            [3.21, 1.33],
                            [6.61, 2.09],
                            [10.0, 2.84]
                        ];
                        len = arrowTail.length;
                        for (i = 0; i < len; i++) {
                            arrowTail[i][0] *= -w;
                            arrowTail[i][1] *= w;
                            arrowTail[i][0] += 10 * w;
                            arrowTail[i][1] -= 2.84 * w;
                        }
                    } else if (type === 7) {
                        w = w0;
                        degree_fa = 3;
                        arrowTail = [
                            [0.0, 10.39],
                            [2.01, 6.92],
                            [5.96, 5.2],
                            [10.0, 5.2],
                            [5.96, 5.2],
                            [2.01, 3.47],
                            [0.0, 0.0]
                        ];
                        len = arrowTail.length;
                        for (i = 0; i < len; i++) {
                            arrowTail[i][0] *= -w;
                            arrowTail[i][1] *= w;
                            arrowTail[i][0] += 10 * w;
                            arrowTail[i][1] -= 5.2 * w;
                        }
                    } else {
                        arrowTail = [
                            [w, -w * 0.5],
                            [0.0, 0.0],
                            [w, w * 0.5]
                        ];
                    }
                }

                if (ev_la) {
                    size = a.sizeLast;
                    w = w0 * size;

                    type = a.typeLast;
                    type_la = type;
                    if (type === 2) {
                        arrowHead = [
                            [-w, -w * 0.5],
                            [0.0, 0.0],
                            [-w, w * 0.5],
                            [-w * 0.5, 0.0]
                        ];
                    } else if (type === 3) {
                        arrowHead = [
                            [-w / 3.0, -w * 0.5],
                            [0.0, -w * 0.5],
                            [0.0, w * 0.5],
                            [-w / 3.0, w * 0.5]
                        ];
                    } else if (type === 4) {
                        w /= 10;
                        degree_la = 3;
                        arrowHead = [
                            [10.0, 3.31],
                            [6.47, 3.84],
                            [2.87, 4.5],
                            [0.0, 6.63],
                            [0.67, 5.52],
                            [1.33, 4.42],
                            [2.0, 3.31],
                            [1.33, 2.21],
                            [0.67, 1.1],
                            [0.0, 0.0],
                            [2.87, 2.13],
                            [6.47, 2.79],
                            [10.0, 3.31]
                        ];
                        len = arrowHead.length;
                        for (i = 0; i < len; i++) {
                            arrowHead[i][0] *= w;
                            arrowHead[i][1] *= w;
                            arrowHead[i][0] -= 10 * w;
                            arrowHead[i][1] -= 3.31 * w;
                        }
                    } else if (type === 5) {
                        w /= 10;
                        degree_la = 3;
                        arrowHead = [
                            [10.0, 3.28],
                            [6.61, 4.19],
                            [3.19, 5.07],
                            [0.0, 6.55],
                            [0.62, 5.56],
                            [1.0, 4.44],
                            [1.0, 3.28],
                            [1.0, 2.11],
                            [0.62, 0.99],
                            [0.0, 0.0],
                            [3.19, 1.49],
                            [6.61, 2.37],
                            [10.0, 3.28]
                        ];
                        len = arrowHead.length;
                        for (i = 0; i < len; i++) {
                            arrowHead[i][0] *= w;
                            arrowHead[i][1] *= w;
                            arrowHead[i][0] -= 10 * w;
                            arrowHead[i][1] -= 3.28 * w;
                        }
                    } else if (type === 6) {
                        w /= 10;
                        degree_la = 3;
                        arrowHead = [
                            [10.0, 2.84],
                            [6.61, 3.59],
                            [3.21, 4.35],
                            [0.0, 5.68],
                            [0.33, 4.73],
                            [0.67, 3.78],
                            [1.0, 2.84],
                            [0.67, 1.89],
                            [0.33, 0.95],
                            [0.0, 0.0],
                            [3.21, 1.33],
                            [6.61, 2.09],
                            [10.0, 2.84]
                        ];
                        len = arrowHead.length;
                        for (i = 0; i < len; i++) {
                            arrowHead[i][0] *= w;
                            arrowHead[i][1] *= w;
                            arrowHead[i][0] -= 10 * w;
                            arrowHead[i][1] -= 2.84 * w;
                        }
                    } else if (type === 7) {
                        w = w0;
                        degree_la = 3;
                        arrowHead = [
                            [0.0, 10.39],
                            [2.01, 6.92],
                            [5.96, 5.2],
                            [10.0, 5.2],
                            [5.96, 5.2],
                            [2.01, 3.47],
                            [0.0, 0.0]
                        ];
                        len = arrowHead.length;
                        for (i = 0; i < len; i++) {
                            arrowHead[i][0] *= w;
                            arrowHead[i][1] *= w;
                            arrowHead[i][0] -= 10 * w;
                            arrowHead[i][1] -= 5.2 * w;
                        }
                    } else {
                        arrowHead = [
                            [-w, -w * 0.5],
                            [0.0, 0.0],
                            [-w, w * 0.5]
                        ];
                    }
                }

                context.save();
                if (this._setColor(el, "stroke", 'fill')) {
                    this._setColor(el, 'stroke');
                    if (ev_fa) {
                        if (type_fa === 7) {
                            doFill = false;
                        } else {
                            doFill = true;
                        }
                        this._drawPolygon(
                            this._translateShape(this._rotateShape(arrowTail, ang1), x1, y1),
                            degree_fa,
                            doFill
                        );
                    }
                    if (ev_la) {
                        if (type_la === 7) {
                            doFill = false;
                        } else {
                            doFill = true;
                        }
                        this._drawPolygon(
                            this._translateShape(this._rotateShape(arrowHead, ang2), x2, y2),
                            degree_la,
                            doFill
                        );
                    }
                }
                context.restore();
            }
        },

        // documented in AbstractRenderer
        drawLine: function (el) {
            var c1_org,
                c2_org,
                c1 = new Coords(Const.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
                c2 = new Coords(Const.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
                margin = null,
                hl,
                w,
                arrowData;

            if (!el.visPropCalc.visible) {
                return;
            }

            hl = this._getHighlighted(el);
            w = el.evalVisProp(hl + 'strokewidth');
            arrowData = this.getArrowHeadData(el, w, hl);

            if (arrowData.evFirst || arrowData.evLast) {
                margin = -4;
            }
            Geometry.calcStraight(el, c1, c2, margin);
            this.handleTouchpoints(el, c1, c2, arrowData);

            c1_org = new Coords(Const.COORDS_BY_USER, c1.usrCoords, el.board);
            c2_org = new Coords(Const.COORDS_BY_USER, c2.usrCoords, el.board);


            this.getPositionArrowHead(el, c1, c2, arrowData);

            this.context.beginPath();
            this.context.moveTo(c1.scrCoords[1], c1.scrCoords[2]);
            this.context.lineTo(c2.scrCoords[1], c2.scrCoords[2]);
            this._stroke(el);

            if (
                arrowData.evFirst /* && obj.sFirst > 0*/ ||
                arrowData.evLast /* && obj.sLast > 0*/
            ) {
                this.drawArrows(el, c1_org, c2_org, hl, arrowData);
            }
        },

        // documented in AbstractRenderer
        updateLine: function (el) {
            this.drawLine(el);
        },

        // documented in AbstractRenderer
        drawTicks: function () {
            // this function is supposed to initialize the svg/vml nodes in the SVG/VMLRenderer.
            // but in canvas there are no such nodes, hence we just do nothing and wait until
            // updateTicks is called.
        },

        // documented in AbstractRenderer
        updateTicks: function (ticks) {
            var i,
                c,
                x,
                y,
                len = ticks.ticks.length,
                len2,
                j,
                context = this.context;

            context.beginPath();
            for (i = 0; i < len; i++) {
                c = ticks.ticks[i];
                x = c[0];
                y = c[1];

                // context.moveTo(x[0], y[0]);
                // context.lineTo(x[1], y[1]);
                len2 = x.length;
                context.moveTo(x[0], y[0]);
                for (j = 1; j < len2; ++j) {
                    context.lineTo(x[j], y[j]);
                }
            }
            // Labels
            // for (i = 0; i < len; i++) {
            //     c = ticks.ticks[i].scrCoords;
            //     if (ticks.ticks[i].major &&
            //             (ticks.board.needsFullUpdate || ticks.needsRegularUpdate) &&
            //             ticks.labels[i] &&
            //             ticks.labels[i].visPropCalc.visible) {
            //         this.updateText(ticks.labels[i]);
            //     }
            // }
            context.lineCap = 'round';
            this._stroke(ticks);
        },

        /* ********* Curve related stuff *********** */

        // documented in AbstractRenderer
        drawCurve: function (el) {
            var hl, w, arrowData;

            if (el.evalVisProp('handdrawing')) {
                this.updatePathStringBezierPrim(el);
            } else {
                this.updatePathStringPrim(el);
            }
            if (el.numberPoints > 1) {
                hl = this._getHighlighted(el);
                w = el.evalVisProp(hl + 'strokewidth');
                arrowData = this.getArrowHeadData(el, w, hl);
                if (
                    arrowData.evFirst /* && obj.sFirst > 0*/ ||
                    arrowData.evLast /* && obj.sLast > 0*/
                ) {
                    this.drawArrows(el, null, null, hl, arrowData);
                }
            }
        },

        // documented in AbstractRenderer
        updateCurve: function (el) {
            this.drawCurve(el);
        },

        /* ********* Circle related stuff *********** */

        // documented in AbstractRenderer
        drawEllipse: function (el) {
            var m1 = el.center.coords.scrCoords[1],
                m2 = el.center.coords.scrCoords[2],
                sX = el.board.unitX,
                sY = el.board.unitY,
                rX = 2 * el.Radius(),
                rY = 2 * el.Radius(),
                aWidth = rX * sX,
                aHeight = rY * sY,
                aX = m1 - aWidth / 2,
                aY = m2 - aHeight / 2,
                hB = (aWidth / 2) * 0.5522848,
                vB = (aHeight / 2) * 0.5522848,
                eX = aX + aWidth,
                eY = aY + aHeight,
                mX = aX + aWidth / 2,
                mY = aY + aHeight / 2,
                context = this.context;

            if (rX > 0.0 && rY > 0.0 && !isNaN(m1 + m2)) {
                context.beginPath();
                context.moveTo(aX, mY);
                context.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
                context.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
                context.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
                context.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
                context.closePath();
                this._fill(el);
                this._stroke(el);
            }
        },

        // documented in AbstractRenderer
        updateEllipse: function (el) {
            return this.drawEllipse(el);
        },

        /* ********* Polygon related stuff *********** */

        // nothing here, using AbstractRenderer implementations

        /* ********* Text related stuff *********** */

        // Already documented in JXG.AbstractRenderer
        displayCopyright: function (str, fontsize) {
            var context = this.context,
                x = 4 + 1.8 * fontsize,
                y = 6 + fontsize,
                alpha = 0.2;

            // This should be called on EVERY update, otherwise it won't be shown after the first update
            context.save();
            context.font = fontsize + "px Arial";
            context.globalAlpha = alpha;
            context.lineWidth = 0.5;
            context.fillText(str + '.', x, y); // Distinguish svg and canvas by this dot
            context.restore();
        },

        // Already documented in JXG.AbstractRenderer
        displayLogo: function (str, fontsize, board) {
            var context = this.context,
                s = 1.5 * fontsize,
                alpha = 0.2;

            if (!Type.exists(board._logo_image)) {
                board._logo_image = new Image();
                board._logo_image.src = str;
            }
            board._logo_image.onload = function() {
                context.save();
                context.globalAlpha = alpha;
                context.drawImage(board._logo_image, 5, 5, s, s);
                context.restore();
            };
            context.save();
            context.globalAlpha = alpha;
            context.drawImage(board._logo_image, 5, 5, s, s);
            context.restore();
        },

        // Already documented in JXG.AbstractRenderer
        drawInternalText: function (el) {
            var ev_fs = el.evalVisProp('fontsize'),
                fontUnit = el.evalVisProp('fontunit'),
                ev_ax = el.getAnchorX(),
                ev_ay = el.getAnchorY(),
                context = this.context;

            context.save();
            if (
                this._setColor(el, "stroke", 'fill') &&
                !isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])
            ) {
                context.font = (ev_fs > 0 ? ev_fs : 0) + fontUnit + " Arial";

                this.transformRect(el, el.transformations);
                if (ev_ax === 'left') {
                    context.textAlign = 'left';
                } else if (ev_ax === 'right') {
                    context.textAlign = 'right';
                } else if (ev_ax === 'middle') {
                    context.textAlign = 'center';
                }
                if (ev_ay === 'bottom') {
                    context.textBaseline = 'bottom';
                } else if (ev_ay === 'top') {
                    context.textBaseline = 'top';
                } else if (ev_ay === 'middle') {
                    context.textBaseline = 'middle';
                }
                context.fillText(el.plaintext, el.coords.scrCoords[1], el.coords.scrCoords[2]);
            }
            context.restore();
            return null;
        },

        // Already documented in JXG.AbstractRenderer
        updateInternalText: function (el) {
            this.drawInternalText(el);
        },

        // documented in JXG.AbstractRenderer
        // Only necessary for texts
        setObjectStrokeColor: function (el, color, opacity) {
            var rgba = color,
                c,
                rgbo,
                o = opacity,
                oo,
                node;

            o = o > 0 ? o : 0;

            if (el.visPropOld.strokecolor === rgba && el.visPropOld.strokeopacity === o) {
                return;
            }

            // Check if this could be merged with _setColor

            if (Type.exists(rgba) && rgba !== false) {
                // RGB, not RGBA
                if (rgba.length !== 9) {
                    c = rgba;
                    oo = o;
                    // True RGBA, not RGB
                } else {
                    rgbo = Color.rgba2rgbo(rgba);
                    c = rgbo[0];
                    oo = o * rgbo[1];
                }
                node = el.rendNode;
                if (
                    el.elementClass === Const.OBJECT_CLASS_TEXT &&
                    el.evalVisProp('display') === "html"
                ) {
                    node.style.color = c;
                    node.style.opacity = oo;
                }
            }

            el.visPropOld.strokecolor = rgba;
            el.visPropOld.strokeopacity = o;
        },

        /* ********* Image related stuff *********** */

        // Already documented in JXG.AbstractRenderer
        drawImage: function (el) {
            el.rendNode = new Image();
            // Store the file name of the image.
            // Before, this was done in el.rendNode.src
            // But there, the file name is expanded to
            // the full url. This may be different from
            // the url computed in updateImageURL().
            el._src = "";
            this.updateImage(el);
        },

        // Already documented in JXG.AbstractRenderer
        updateImage: function (el) {
            var context = this.context,
                o = el.evalVisProp('fillopacity'),
                paintImg = Type.bind(function () {
                    el.imgIsLoaded = true;
                    if (el.size[0] <= 0 || el.size[1] <= 0) {
                        return;
                    }
                    context.save();
                    context.globalAlpha = o;
                    // If det(el.transformations)=0, FireFox 3.6. breaks down.
                    // This is tested in transformRect
                    this.transformRect(el, el.transformations);
                    context.drawImage(
                        el.rendNode,
                        el.coords.scrCoords[1],
                        el.coords.scrCoords[2] - el.size[1],
                        el.size[0],
                        el.size[1]
                    );
                    context.restore();
                }, this);

            if (this.updateImageURL(el)) {
                el.rendNode.onload = paintImg;
            } else {
                if (el.imgIsLoaded) {
                    paintImg();
                }
            }
        },

        // Already documented in JXG.AbstractRenderer
        transformRect: function (el, t) {
            var m, s, cx, cy, node,
                len = t.length,
                ctx = this.context;

            if (len > 0) {
                m = this.joinTransforms(el, t);
                if (el.elementClass === Const.OBJECT_CLASS_TEXT && el.visProp.display === 'html') {
                    s = " matrix(" + [m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]].join(",") + ") ";
                    if (s.indexOf('NaN') === -1) {
                        node = el.rendNode;
                        node.style.transform = s;
                        cx = -el.coords.scrCoords[1];
                        cy = -el.coords.scrCoords[2];
                        switch (el.evalVisProp('anchorx')) {
                            case 'right': cx += el.size[0]; break;
                            case 'middle': cx += el.size[0] * 0.5; break;
                        }
                        switch (el.evalVisProp('anchory')) {
                            case 'bottom': cy += el.size[1]; break;
                            case 'middle': cy += el.size[1] * 0.5; break;
                        }
                        node.style['transform-origin'] = (cx) + 'px ' + (cy) + 'px';
                    }
                } else {
                    if (Math.abs(Numerics.det(m)) >= Mat.eps) {
                        ctx.transform(m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]);
                    }
                }
            }
        },

        // Already documented in JXG.AbstractRenderer
        updateImageURL: function (el) {
            var url;

            url = el.eval(el.url);
            if (el._src !== url) {
                el.imgIsLoaded = false;
                el.rendNode.src = url;
                el._src = url;
                return true;
            }

            return false;
        },

        /* ********* Render primitive objects *********** */

        // documented in AbstractRenderer
        remove: function (shape) {
            // sounds odd for a pixel based renderer but we need this for html texts
            if (Type.exists(shape) && Type.exists(shape.parentNode)) {
                shape.parentNode.removeChild(shape);
            }
        },

        // documented in AbstractRenderer
        updatePathStringPrim: function (el) {
            var i,
                scr,
                scr1,
                scr2,
                len,
                symbm = "M",
                symbl = "L",
                symbc = "C",
                nextSymb = symbm,
                maxSize = 5000.0,
                context = this.context;

            if (el.numberPoints <= 0) {
                return;
            }

            len = Math.min(el.points.length, el.numberPoints);
            context.beginPath();

            if (el.bezierDegree === 1) {
                /*
                if (isNotPlot && el.board.options.curve.RDPsmoothing) {
                    el.points = Numerics.RamerDouglasPeucker(el.points, 0.5);
                }
                */

                for (i = 0; i < len; i++) {
                    scr = el.points[i].scrCoords;

                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        // Chrome has problems with values  being too far away.
                        if (scr[1] > maxSize) {
                            scr[1] = maxSize;
                        } else if (scr[1] < -maxSize) {
                            scr[1] = -maxSize;
                        }

                        if (scr[2] > maxSize) {
                            scr[2] = maxSize;
                        } else if (scr[2] < -maxSize) {
                            scr[2] = -maxSize;
                        }

                        if (nextSymb === symbm) {
                            context.moveTo(scr[1], scr[2]);
                        } else {
                            context.lineTo(scr[1], scr[2]);
                        }
                        nextSymb = symbl;
                    }
                }
            } else if (el.bezierDegree === 3) {
                i = 0;
                while (i < len) {
                    scr = el.points[i].scrCoords;
                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        if (nextSymb === symbm) {
                            context.moveTo(scr[1], scr[2]);
                        } else {
                            i += 1;
                            scr1 = el.points[i].scrCoords;
                            i += 1;
                            scr2 = el.points[i].scrCoords;
                            context.bezierCurveTo(
                                scr[1],
                                scr[2],
                                scr1[1],
                                scr1[2],
                                scr2[1],
                                scr2[2]
                            );
                        }
                        nextSymb = symbc;
                    }
                    i += 1;
                }
            }
            context.lineCap = 'round';
            context.lineJoin = 'round';
            this._fill(el);
            this._stroke(el);
        },

        // Already documented in JXG.AbstractRenderer
        updatePathStringBezierPrim: function (el) {
            var i, j, k,
                scr, lx, ly, len,
                symbm = "M",
                symbl = "C",
                nextSymb = symbm,
                maxSize = 5000.0,
                f = el.evalVisProp('strokewidth'),
                isNoPlot = el.evalVisProp('curvetype') !== "plot",
                context = this.context;

            if (el.numberPoints <= 0) {
                return;
            }

            if (isNoPlot && el.board.options.curve.RDPsmoothing) {
                el.points = Numerics.RamerDouglasPeucker(el.points, 0.5);
            }

            len = Math.min(el.points.length, el.numberPoints);
            context.beginPath();

            for (j = 1; j < 3; j++) {
                nextSymb = symbm;
                for (i = 0; i < len; i++) {
                    scr = el.points[i].scrCoords;

                    if (isNaN(scr[1]) || isNaN(scr[2])) {
                        // PenUp
                        nextSymb = symbm;
                    } else {
                        // Chrome has problems with values being too far away.
                        if (scr[1] > maxSize) {
                            scr[1] = maxSize;
                        } else if (scr[1] < -maxSize) {
                            scr[1] = -maxSize;
                        }

                        if (scr[2] > maxSize) {
                            scr[2] = maxSize;
                        } else if (scr[2] < -maxSize) {
                            scr[2] = -maxSize;
                        }

                        if (nextSymb === symbm) {
                            context.moveTo(scr[1], scr[2]);
                        } else {
                            k = 2 * j;
                            context.bezierCurveTo(
                                lx + (scr[1] - lx) * 0.333 + f * (k * Math.random() - j),
                                ly + (scr[2] - ly) * 0.333 + f * (k * Math.random() - j),
                                lx + (scr[1] - lx) * 0.666 + f * (k * Math.random() - j),
                                ly + (scr[2] - ly) * 0.666 + f * (k * Math.random() - j),
                                scr[1],
                                scr[2]
                            );
                        }
                        nextSymb = symbl;
                        lx = scr[1];
                        ly = scr[2];
                    }
                }
            }
            context.lineCap = 'round';
            context.lineJoin = 'round';
            this._fill(el);
            this._stroke(el);
        },

        // documented in AbstractRenderer
        updatePolygonPrim: function (node, el) {
            var scrCoords,
                i,
                j,
                len = el.vertices.length,
                context = this.context,
                isReal = true;

            if (len <= 0 || !el.visPropCalc.visible) {
                return;
            }
            if (el.elType === 'polygonalchain') {
                len++;
            }

            context.beginPath();
            i = 0;
            while (!el.vertices[i].isReal && i < len - 1) {
                i++;
                isReal = false;
            }
            scrCoords = el.vertices[i].coords.scrCoords;
            context.moveTo(scrCoords[1], scrCoords[2]);

            for (j = i; j < len - 1; j++) {
                if (!el.vertices[j].isReal) {
                    isReal = false;
                }
                scrCoords = el.vertices[j].coords.scrCoords;
                context.lineTo(scrCoords[1], scrCoords[2]);
            }
            context.closePath();

            if (isReal) {
                this._fill(el); // The edges of a polygon are displayed separately (as segments).
            }
        },

        /* ********* Set attributes *********** */

        // Already documented in JXG.AbstractRenderer
        display: function (el, val) {
            if (el && el.rendNode) {
                el.visPropOld.visible = val;
                if (val) {
                    el.rendNode.style.visibility = 'inherit';
                } else {
                    el.rendNode.style.visibility = 'hidden';
                }
            }
        },

        // documented in AbstractRenderer
        show: function (el) {
            JXG.deprecated("Board.renderer.show()", "Board.renderer.display()");

            if (Type.exists(el.rendNode)) {
                el.rendNode.style.visibility = 'inherit';
            }
        },

        // documented in AbstractRenderer
        hide: function (el) {
            JXG.deprecated("Board.renderer.hide()", "Board.renderer.display()");

            if (Type.exists(el.rendNode)) {
                el.rendNode.style.visibility = 'hidden';
            }
        },

        // documented in AbstractRenderer
        setGradient: function (el) {
            // var // col,
            //     op;

            // op = el.evalVisProp('fillopacity');
            // op = op > 0 ? op : 0;

            // col = el.evalVisProp('fillcolor');
        },

        // documented in AbstractRenderer
        setShadow: function (el) {
            if (el.visPropOld.shadow === el.visProp.shadow) {
                return;
            }

            // not implemented yet
            // we simply have to redraw the element
            // probably the best way to do so would be to call el.updateRenderer(), i think.

            el.visPropOld.shadow = el.visProp.shadow;
        },

        // documented in AbstractRenderer
        highlight: function (obj) {
            if (
                obj.elementClass === Const.OBJECT_CLASS_TEXT &&
                obj.evalVisProp('display') === "html"
            ) {
                this.updateTextStyle(obj, true);
            } else {
                obj.board.prepareUpdate();
                obj.board.renderer.suspendRedraw(obj.board);
                obj.board.updateRenderer();
                obj.board.renderer.unsuspendRedraw();
            }
            return this;
        },

        // documented in AbstractRenderer
        noHighlight: function (obj) {
            if (
                obj.elementClass === Const.OBJECT_CLASS_TEXT &&
                obj.evalVisProp('display') === "html"
            ) {
                this.updateTextStyle(obj, false);
            } else {
                obj.board.prepareUpdate();
                obj.board.renderer.suspendRedraw(obj.board);
                obj.board.updateRenderer();
                obj.board.renderer.unsuspendRedraw();
            }
            return this;
        },

        /* ********* Renderer control *********** */

        // documented in AbstractRenderer
        suspendRedraw: function (board) {
            this.context.save();
            this.context.clearRect(0, 0, this.canvasRoot.width, this.canvasRoot.height);

            if (board && (board.attr.showcopyright || board.attr.showlogo)) {
                this.displayLogo(JXG.licenseLogo, 12, board);
            }

            if (board && board.attr.showcopyright) {
                this.displayCopyright(JXG.licenseText, 12);
            }
        },

        // documented in AbstractRenderer
        unsuspendRedraw: function () {
            this.context.restore();
        },

        // document in AbstractRenderer
        resize: function (w, h) {
            if (this.container) {
                this.canvasRoot.style.width = parseFloat(w) + 'px';
                this.canvasRoot.style.height = parseFloat(h) + 'px';

                this.canvasRoot.setAttribute("width", 2 * parseFloat(w) + 'px');
                this.canvasRoot.setAttribute("height", 2 * parseFloat(h) + 'px');
            } else {
                this.canvasRoot.width = 2 * parseFloat(w);
                this.canvasRoot.height = 2 * parseFloat(h);
            }
            this.context = this.canvasRoot.getContext('2d');
            // The width and height of the canvas is set to twice the CSS values,
            // followed by an appropriate scaling.
            // See https://stackoverflow.com/questions/22416462/canvas-element-with-blurred-lines
            this.context.scale(2, 2);
        },

        removeToInsertLater: function () {
            return function () { };
        }
    }
);

export default JXG.CanvasRenderer;
