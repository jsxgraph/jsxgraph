/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, AMprocessNode: true, document: true, Image: true, module: true, require: true */
/*jslint nomen: true, plusplus: true, newcap:true*/

/* depends:
 jxg
 renderer/abstract
 base/constants
 utils/env
 utils/type
 utils/uuid
 utils/color
 base/coords
 math/math
 math/geometry
 math/numerics
*/

define([
    'jxg', 'renderer/abstract', 'base/constants', 'utils/env', 'utils/type', 'utils/uuid', 'utils/color',
    'base/coords', 'math/math', 'math/geometry', 'math/numerics'
], function (JXG, AbstractRenderer, Const, Env, Type, UUID, Color, Coords, Mat, Geometry, Numerics) {

    "use strict";

    /**
     * Uses HTML Canvas to implement the rendering methods defined in {@link JXG.AbstractRenderer}.
     * @class JXG.AbstractRenderer
     * @augments JXG.AbstractRenderer
     * @param {Node} container Reference to a DOM node containing the board.
     * @param {Object} dim The dimensions of the board
     * @param {Number} dim.width
     * @param {Number} dim.height
     * @see JXG.AbstractRenderer
     */
    JXG.CanvasRenderer = function (container, dim) {
        var i;

        this.type = 'canvas';

        this.canvasRoot = null;
        this.suspendHandle = null;
        this.canvasId = UUID.genUUID();

        this.canvasNamespace = null;

        if (Env.isBrowser) {
            this.container = container;
            this.container.style.MozUserSelect = 'none';

            this.container.style.overflow = 'hidden';
            if (this.container.style.position === '') {
                this.container.style.position = 'relative';
            }

            this.container.innerHTML = ['<canvas id="', this.canvasId, '" width="', dim.width, 'px" height="',
                dim.height, 'px"><', '/canvas>'].join('');
            this.canvasRoot = this.container.ownerDocument.getElementById(this.canvasId);
            this.context =  this.canvasRoot.getContext('2d');
        } else if (Env.isNode()) {
            this.canvasId = (typeof module === 'object' ? module.require('canvas') : require('canvas'));
            this.canvasRoot = new this.canvasId(500, 500);
            this.context = this.canvasRoot.getContext('2d');
        }

        this.dashArray = [[2, 2], [5, 5], [10, 10], [20, 20], [20, 10, 10, 10], [20, 5, 10, 5]];
    };

    JXG.CanvasRenderer.prototype = new AbstractRenderer();

    JXG.extend(JXG.CanvasRenderer.prototype, /** @lends JXG.CanvasRenderer.prototype */ {

        /* **************************
         *   private methods only used
         *   in this renderer. Should
         *   not be called from outside.
         * **************************/

        /**
         * Draws a filled polygon.
         * @param {Array} shape A matrix presented by a two dimensional array of numbers.
         * @see JXG.AbstractRenderer#makeArrows
         * @private
         */
        _drawFilledPolygon: function (shape) {
            var i, len = shape.length,
                context = this.context;

            if (len > 0) {
                context.beginPath();
                context.moveTo(shape[0][0], shape[0][1]);
                for (i = 0; i < len; i++) {
                    if (i > 0) {
                        context.lineTo(shape[i][0], shape[i][1]);
                    }
                }
                context.lineTo(shape[0][0], shape[0][1]);
                context.fill();
            }
        },

        /**
         * Sets the fill color and fills an area.
         * @param {JXG.GeometryElement} element An arbitrary JSXGraph element, preferably one with an area.
         * @private
         */
        _fill: function (element) {
            var context = this.context;

            context.save();
            if (this._setColor(element, 'fill')) {
                context.fill();
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
                (x * Math.cos(angle)) - (y * Math.sin(angle)),
                (x * Math.sin(angle)) + (y * Math.cos(angle))
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
            var i, rv = [], len = shape.length;

            if (len <= 0) {
                return shape;
            }

            for (i = 0; i < len; i++) {
                rv.push(this._rotatePoint(angle, shape[i][0], shape[i][1]));
            }

            return rv;
        },

        /**
         * Sets color and opacity for filling and stroking.
         * type is the attribute from visProp and targetType the context[targetTypeStyle].
         * This is necessary, because the fill style of a text is set by the stroke attributes of the text element.
         * @param {JXG.GeometryElement} element Any JSXGraph element.
         * @param {String} [type='stroke'] Either <em>fill</em> or <em>stroke</em>.
         * @param {String} [targetType=type] (optional) Either <em>fill</em> or <em>stroke</em>.
         * @returns {Boolean} If the color could be set, <tt>true</tt> is returned.
         * @private
         */
        _setColor: function (element, type, targetType) {
            var hasColor = true, isTrace = false,
                ev = element.visProp, hl,
                rgba, rgbo, c, o, oo;

            type = type || 'stroke';
            targetType = targetType || type;

            if (!Type.exists(element.board) || !Type.exists(element.board.highlightedObjects)) {
                // This case handles trace elements.
                // To make them work, we simply neglect highlighting.
                isTrace = true;
            }

            if (!isTrace && Type.exists(element.board.highlightedObjects[element.id])) {
                hl = 'highlight';
            } else {
                hl = '';
            }

            // type is equal to 'fill' or 'stroke'
            rgba = Type.evaluate(ev[hl + type + 'color']);
            if (rgba !== 'none' && rgba !== false) {
                o = Type.evaluate(ev[hl + type + 'opacity']);
                o = (o > 0) ? o : 0;

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
                this.context.globalAlpha = oo;

                this.context[targetType + 'Style'] = c;

            } else {
                hasColor = false;
            }
            if (type === 'stroke' && !isNaN(parseFloat(ev.strokewidth))) {
                if (parseFloat(ev.strokewidth) === 0) {
                    this.context.globalAlpha = 0;
                } else {
                    this.context.lineWidth = parseFloat(ev.strokewidth);
                }
            }
            return hasColor;
        },


        /**
         * Sets color and opacity for drawing paths and lines and draws the paths and lines.
         * @param {JXG.GeometryElement} element An JSXGraph element with a stroke.
         * @private
         */
        _stroke: function (element) {
            var context = this.context;

            context.save();

            if (element.visProp.dash > 0) {
                if (context.setLineDash) {
                    context.setLineDash(this.dashArray[element.visProp.dash]);
                }
            } else {
                this.context.lineDashArray = [];
            }

            if (this._setColor(element, 'stroke')) {
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
            var i, rv = [], len = shape.length;

            if (len <= 0) {
                return shape;
            }

            for (i = 0; i < len; i++) {
                rv.push([ shape[i][0] + x, shape[i][1] + y ]);
            }

            return rv;
        },

        /* ******************************** *
         *    Point drawing and updating    *
         * ******************************** */

        // documented in AbstractRenderer
        drawPoint: function (el) {
            var f = el.visProp.face,
                size = el.visProp.size,
                scr = el.coords.scrCoords,
                sqrt32 = size * Math.sqrt(3) * 0.5,
                s05 = size * 0.5,
                stroke05 = parseFloat(el.visProp.strokewidth) / 2.0,
                context = this.context;

            if (!el.visProp.visible) {
                return;
            }

            switch (f) {
            case 'cross':  // x
            case 'x':
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
            case 'circle': // dot
            case 'o':
                context.beginPath();
                context.arc(scr[1], scr[2], size + 1 + stroke05, 0, 2 * Math.PI, false);
                context.closePath();
                this._fill(el);
                this._stroke(el);
                break;
            case 'square':  // rectangle
            case '[]':
                if (size <= 0) {
                    break;
                }

                context.save();
                if (this._setColor(el, 'stroke', 'fill')) {
                    context.fillRect(scr[1] - size - stroke05, scr[2] - size - stroke05, size * 2 + 3 * stroke05, size * 2 + 3 * stroke05);
                }
                context.restore();
                context.save();
                this._setColor(el, 'fill');
                context.fillRect(scr[1] - size + stroke05, scr[2] - size + stroke05, size * 2 - stroke05, size * 2 - stroke05);
                context.restore();
                break;
            case 'plus':  // +
            case '+':
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
            case 'diamond':   // <>
            case '<>':
                context.beginPath();
                context.moveTo(scr[1] - size, scr[2]);
                context.lineTo(scr[1], scr[2] + size);
                context.lineTo(scr[1] + size, scr[2]);
                context.lineTo(scr[1], scr[2] - size);
                context.closePath();
                this._fill(el);
                this._stroke(el);
                break;
            case 'triangleup':
            case 'a':
            case '^':
                context.beginPath();
                context.moveTo(scr[1], scr[2] - size);
                context.lineTo(scr[1] - sqrt32, scr[2] + s05);
                context.lineTo(scr[1] + sqrt32, scr[2] + s05);
                context.closePath();
                this._fill(el);
                this._stroke(el);
                break;
            case 'triangledown':
            case 'v':
                context.beginPath();
                context.moveTo(scr[1], scr[2] + size);
                context.lineTo(scr[1] - sqrt32, scr[2] - s05);
                context.lineTo(scr[1] + sqrt32, scr[2] - s05);
                context.closePath();
                this._fill(el);
                this._stroke(el);
                break;
            case 'triangleleft':
            case '<':
                context.beginPath();
                context.moveTo(scr[1] - size, scr[2]);
                context.lineTo(scr[1] + s05, scr[2] - sqrt32);
                context.lineTo(scr[1] + s05, scr[2] + sqrt32);
                context.closePath();
                this.fill(el);
                this._stroke(el);
                break;
            case 'triangleright':
            case '>':
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

        /* ******************************** *
         *           Lines                  *
         * ******************************** */

        // documented in AbstractRenderer
        drawLine: function (el) {
            var s, d, d1x, d1y, d2x, d2y,
                scr1 = new Coords(Const.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
                scr2 = new Coords(Const.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
                margin = null;

            if (!el.visProp.visible) {
                return;
            }

            if (el.visProp.firstarrow || el.visProp.lastarrow) {
                margin = -4;
            }
            Geometry.calcStraight(el, scr1, scr2, margin);

            d1x = d1y = d2x = d2y = 0.0;
            /*
               Handle arrow heads.

               The arrow head is an equilateral triangle with base length 10 and height 10.
               These 10 units are scaled to strokeWidth*3 pixels or minimum 10 pixels.
            */
            s = Math.max(parseInt(el.visProp.strokewidth, 10) * 3, 10);
            if (el.visProp.lastarrow) {
                d = scr1.distance(Const.COORDS_BY_SCREEN, scr2);
                if (d > Mat.eps) {
                    d2x = (scr2.scrCoords[1] - scr1.scrCoords[1]) * s / d;
                    d2y = (scr2.scrCoords[2] - scr1.scrCoords[2]) * s / d;
                }
            }
            if (el.visProp.firstarrow) {
                d = scr1.distance(Const.COORDS_BY_SCREEN, scr2);
                if (d > Mat.eps) {
                    d1x = (scr2.scrCoords[1] - scr1.scrCoords[1]) * s / d;
                    d1y = (scr2.scrCoords[2] - scr1.scrCoords[2]) * s / d;
                }
            }

            this.context.beginPath();
            this.context.moveTo(scr1.scrCoords[1] + d1x, scr1.scrCoords[2] + d1y);
            this.context.lineTo(scr2.scrCoords[1] - d2x, scr2.scrCoords[2] - d2y);
            this._stroke(el);

            this.makeArrows(el, scr1, scr2);
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
            var i, c, x, y,
                len = ticks.ticks.length,
                context = this.context;

            context.beginPath();
            for (i = 0; i < len; i++) {
                c = ticks.ticks[i];
                x = c[0];
                y = c[1];
                context.moveTo(x[0], y[0]);
                context.lineTo(x[1], y[1]);
            }
            // Labels
            for (i = 0; i < len; i++) {
                c = ticks.ticks[i].scrCoords;
                if (ticks.ticks[i].major &&
                        (ticks.board.needsFullUpdate || ticks.needsRegularUpdate) &&
                        ticks.labels[i] &&
                        ticks.labels[i].visProp.visible) {
                    this.updateText(ticks.labels[i]);
                }
            }
            context.lineCap = 'round';
            this._stroke(ticks);
        },

        /* **************************
         *    Curves
         * **************************/

        // documented in AbstractRenderer
        drawCurve: function (el) {
            if (el.visProp.handdrawing) {
                this.updatePathStringBezierPrim(el);
            } else {
                this.updatePathStringPrim(el);
            }
        },

        // documented in AbstractRenderer
        updateCurve: function (el) {
            this.drawCurve(el);
        },

        /* **************************
         *    Circle related stuff
         * **************************/

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

        /* **************************
         *    Polygon
         * **************************/

        // nothing here, using AbstractRenderer implementations

        /* **************************
         *    Text related stuff
         * **************************/

        // already documented in JXG.AbstractRenderer
        displayCopyright: function (str, fontSize) {
            var context = this.context;

            // this should be called on EVERY update, otherwise it won't be shown after the first update
            context.save();
            context.font = fontSize + 'px Arial';
            context.fillStyle = '#aaa';
            context.lineWidth = 0.5;
            context.fillText(str, 10, 2 + fontSize);
            context.restore();
        },

        // already documented in JXG.AbstractRenderer
        drawInternalText: function (el) {
            var fs, context = this.context;

            context.save();
            // el.rendNode.setAttributeNS(null, "class", el.visProp.cssclass);
            if (this._setColor(el, 'stroke', 'fill') && !isNaN(el.coords.scrCoords[1] + el.coords.scrCoords[2])) {
                if (el.visProp.fontsize) {
                    if (typeof el.visProp.fontsize === 'function') {
                        fs = el.visProp.fontsize();
                        context.font = (fs > 0 ? fs : 0) + 'px Arial';
                    } else {
                        context.font = (el.visProp.fontsize) + 'px Arial';
                    }
                }

                this.transformImage(el, el.transformations);
                if (el.visProp.anchorx === 'left') {
                    context.textAlign = 'left';
                } else if (el.visProp.anchorx === 'right') {
                    context.textAlign = 'right';
                } else if (el.visProp.anchorx === 'middle') {
                    context.textAlign = 'center';
                }
                if (el.visProp.anchory === 'bottom') {
                    context.textBaseline = 'bottom';
                } else if (el.visProp.anchory === 'top') {
                    context.textBaseline = 'top';
                } else if (el.visProp.anchory === 'middle') {
                    context.textBaseline = 'middle';
                }
                context.fillText(el.plaintext, el.coords.scrCoords[1], el.coords.scrCoords[2]);
            }
            context.restore();

            return null;
        },

        // already documented in JXG.AbstractRenderer
        updateInternalText: function (element) {
            this.drawInternalText(element);
        },

        // documented in JXG.AbstractRenderer
        // Only necessary for texts
        setObjectStrokeColor: function (el, color, opacity) {
            var rgba = Type.evaluate(color), c, rgbo,
                o = Type.evaluate(opacity), oo,
                node;

            o = (o > 0) ? o : 0;

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
                if (el.elementClass === Const.OBJECT_CLASS_TEXT && el.visProp.display === 'html') {
                    node.style.color = c;
                    node.style.opacity = oo;
                }
            }

            el.visPropOld.strokecolor = rgba;
            el.visPropOld.strokeopacity = o;
        },

        /* **************************
         *    Image related stuff
         * **************************/

        // already documented in JXG.AbstractRenderer
        drawImage: function (el) {
            el.rendNode = new Image();
            // Store the file name of the image.
            // Before, this was done in el.rendNode.src
            // But there, the file name is expanded to
            // the full url. This may be different from
            // the url computed in updateImageURL().
            el._src = '';
            this.updateImage(el);
        },

        // already documented in JXG.AbstractRenderer
        updateImage: function (el) {
            var context = this.context,
                o = Type.evaluate(el.visProp.fillopacity),
                paintImg = Type.bind(function () {
                    el.imgIsLoaded = true;
                    if (el.size[0] <= 0 || el.size[1] <= 0) {
                        return;
                    }
                    context.save();
                    context.globalAlpha = o;
                    // If det(el.transformations)=0, FireFox 3.6. breaks down.
                    // This is tested in transformImage
                    this.transformImage(el, el.transformations);
                    context.drawImage(el.rendNode,
                        el.coords.scrCoords[1],
                        el.coords.scrCoords[2] - el.size[1],
                        el.size[0],
                        el.size[1]);
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

        // already documented in JXG.AbstractRenderer
        transformImage: function (el, t) {
            var m, len = t.length,
                ctx = this.context;

            if (len > 0) {
                m = this.joinTransforms(el, t);
                if (Math.abs(Numerics.det(m)) >= Mat.eps) {
                    ctx.transform(m[1][1], m[2][1], m[1][2], m[2][2], m[1][0], m[2][0]);
                }
            }
        },

        // already documented in JXG.AbstractRenderer
        updateImageURL: function (el) {
            var url;

            url = Type.evaluate(el.url);
            if (el._src !== url) {
                el.imgIsLoaded = false;
                el.rendNode.src = url;
                el._src = url;
                return true;
            }

            return false;
        },

        /* **************************
         * Render primitive objects
         * **************************/

        // documented in AbstractRenderer
        remove: function (shape) {
            // sounds odd for a pixel based renderer but we need this for html texts
            if (Type.exists(shape) && Type.exists(shape.parentNode)) {
                shape.parentNode.removeChild(shape);
            }
        },

        // documented in AbstractRenderer
        makeArrows: function (el, scr1, scr2) {
            // not done yet for curves and arcs.
            /*
            var x1, y1, x2, y2, ang,
                w = Math.min(el.visProp.strokewidth / 2, 3),
                arrowHead = [
                    [ 2, 0],
                    [ -10, -4 * w],
                    [ -10, 4 * w],
                    [ 2, 0 ]
                ],
                arrowTail = [
                    [ -2, 0],
                    [ 10, -4 * w],
                    [ 10, 4 * w]
                ],
                context = this.context;
            */
            var x1, y1, x2, y2, ang,
                w = Math.max(el.visProp.strokewidth * 3, 10),
                arrowHead = [
                    [ -w, -w * 0.5],
                    [ 0.0,     0.0],
                    [ -w,  w * 0.5]
                ],
                arrowTail = [
                    [ w,   -w * 0.5],
                    [ 0.0,      0.0],
                    [ w,    w * 0.5]
                ],
                context = this.context;

            if (el.visProp.strokecolor !== 'none' && (el.visProp.lastarrow || el.visProp.firstarrow)) {
                if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                    x1 = scr1.scrCoords[1];
                    y1 = scr1.scrCoords[2];
                    x2 = scr2.scrCoords[1];
                    y2 = scr2.scrCoords[2];
                } else {
                    return;
                }

                context.save();
                if (this._setColor(el, 'stroke', 'fill')) {
                    ang = Math.atan2(y2 - y1, x2 - x1);
                    if (el.visProp.lastarrow) {
                        this._drawFilledPolygon(this._translateShape(this._rotateShape(arrowHead, ang), x2, y2));
                    }

                    if (el.visProp.firstarrow) {
                        this._drawFilledPolygon(this._translateShape(this._rotateShape(arrowTail, ang), x1, y1));
                    }
                }
                context.restore();
            }
        },

        // documented in AbstractRenderer
        updatePathStringPrim: function (el) {
            var i, scr, scr1, scr2, len,
                symbm = 'M',
                symbl = 'L',
                symbc = 'C',
                nextSymb = symbm,
                maxSize = 5000.0,
                //isNotPlot = (el.visProp.curvetype !== 'plot'),
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

                    if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
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
                    if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
                        nextSymb = symbm;
                    } else {
                        if (nextSymb === symbm) {
                            context.moveTo(scr[1], scr[2]);
                        } else {
                            i += 1;
                            scr1 = el.points[i].scrCoords;
                            i += 1;
                            scr2 = el.points[i].scrCoords;
                            context.bezierCurveTo(scr[1], scr[2], scr1[1], scr1[2], scr2[1], scr2[2]);
                        }
                        nextSymb = symbc;
                    }
                    i += 1;
                }
            }
            context.lineCap = 'round';
            this._fill(el);
            this._stroke(el);
        },

        // already documented in JXG.AbstractRenderer
        updatePathStringBezierPrim: function (el) {
            var i, j, k, scr, lx, ly, len,
                symbm = 'M',
                symbl = 'C',
                nextSymb = symbm,
                maxSize = 5000.0,
                f = el.visProp.strokewidth,
                isNoPlot = (el.visProp.curvetype !== 'plot'),
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

                    if (isNaN(scr[1]) || isNaN(scr[2])) {  // PenUp
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
                            k = 2 * j;
                            context.bezierCurveTo(
                                (lx + (scr[1] - lx) * 0.333 + f * (k * Math.random() - j)),
                                (ly + (scr[2] - ly) * 0.333 + f * (k * Math.random() - j)),
                                (lx + (scr[1] - lx) * 0.666 + f * (k * Math.random() - j)),
                                (ly + (scr[2] - ly) * 0.666 + f * (k * Math.random() - j)),
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
            this._fill(el);
            this._stroke(el);
        },

        // documented in AbstractRenderer
        updatePolygonPrim: function (node, el) {
            var scrCoords, i, j,
                len = el.vertices.length,
                context = this.context,
                isReal = true;

            if (len <= 0 || !el.visProp.visible) {
                return;
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
                this._fill(el);    // The edges of a polygon are displayed separately (as segments).
            }
        },

        /* **************************
         *  Set Attributes
         * **************************/

        // documented in AbstractRenderer
        show: function (el) {
            if (Type.exists(el.rendNode)) {
                el.rendNode.style.visibility = "inherit";
            }
        },

        // documented in AbstractRenderer
        hide: function (el) {
            if (Type.exists(el.rendNode)) {
                el.rendNode.style.visibility = "hidden";
            }
        },

        // documented in AbstractRenderer
        setGradient: function (el) {
            var col, op;

            op = Type.evaluate(el.visProp.fillopacity);
            op = (op > 0) ? op : 0;

            col = Type.evaluate(el.visProp.fillcolor);
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
            if (obj.elementClass === Const.OBJECT_CLASS_TEXT && obj.visProp.display === 'html') {
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
            if (obj.elementClass === Const.OBJECT_CLASS_TEXT && obj.visProp.display === 'html') {
                this.updateTextStyle(obj, false);
            } else {
                obj.board.prepareUpdate();
                obj.board.renderer.suspendRedraw(obj.board);
                obj.board.updateRenderer();
                obj.board.renderer.unsuspendRedraw();
            }
            return this;
        },

        /* **************************
         * renderer control
         * **************************/

        // documented in AbstractRenderer
        suspendRedraw: function (board) {
            this.context.save();
            this.context.clearRect(0, 0, this.canvasRoot.width, this.canvasRoot.height);

            if (board && board.showCopyright) {
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

                this.canvasRoot.setAttribute('width', parseFloat(w) + 'px');
                this.canvasRoot.setAttribute('height', parseFloat(h) + 'px');
            } else {
                this.canvasRoot.width = parseFloat(w);
                this.canvasRoot.height = parseFloat(h);
            }
        },

        removeToInsertLater: function () {
            return function () {};
        }
    });

    return JXG.CanvasRenderer;
});
