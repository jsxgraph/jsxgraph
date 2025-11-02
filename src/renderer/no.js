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

/*global JXG: true, define: true, AMprocessNode: true, MathJax: true, document: true */
/*jslint nomen: true, plusplus: true, newcap:true, unparam: true*/
/*eslint no-unused-vars: "off"*/

/**
 * @fileoverview JSXGraph can use various technologies to render the contents of a construction, e.g.
 * SVG, VML, and HTML5 Canvas. To accomplish this, The rendering and the logic and control mechanisms
 * are completely separated from each other. Every rendering technology has it's own class, called
 * Renderer, e.g. SVGRenderer for SVG, the same for VML and Canvas. The common base for all available
 * renderers is the class AbstractRenderer.
 */

import JXG from "../jxg.js";
import AbstractRenderer from "./abstract.js";

/**
 * This renderer draws nothing. It is intended to be used in environments where none of our rendering engines
 * are available, e.g. WebWorkers. All methods are empty.
 *
 * @class JXG.NoRenderer
 * @augments JXG.AbstractRenderer
 * @see JXG.AbstractRenderer
 */
JXG.NoRenderer = function () {
    /**
     * If this property is set to <tt>true</tt> the visual properties of the elements are updated
     * on every update. Visual properties means: All the stuff stored in the
     * {@link JXG.GeometryElement#visProp} property won't be set if enhancedRendering is <tt>false</tt>
     * @type Boolean
     * @default true
     */
    this.enhancedRendering = false;

    /**
     * This is used to easily determine which renderer we are using
     * @example if (board.renderer.type === 'vml') {
     *     // do something
     * }
     * @type String
     */
    this.type = 'no';
};

JXG.extend(
    JXG.NoRenderer.prototype,
    /** @lends JXG.NoRenderer.prototype */ {

        // All methods are already documented in JXG.AbstractRenderer

        /* ********* Point related stuff *********** */

        drawPoint: function (el) {},

        updatePoint: function (el) {},

        changePointStyle: function (el) {},

        /* ********* Line related stuff *********** */

        drawLine: function (el) {},

        updateLine: function (el) {},

        drawTicks: function (el) {},

        updateTicks: function (el) {},

        /* ********* Curve related stuff *********** */

        drawCurve: function (el) {},

        updateCurve: function (el) {},

        /* ********* Circle related stuff *********** */

        drawEllipse: function (el) {},

        updateEllipse: function (el) {},

        /* ********* Polygon related stuff *********** */

        drawPolygon: function (el) {},

        updatePolygon: function (el) {},

        /* ********* Text related stuff *********** */

        displayCopyright: function (str, fontsize) {},

        drawInternalText: function (el) {},

        updateInternalText: function (el) {},

        drawText: function (el) {},

        updateText: function (el) {},

        updateTextStyle: function (el, doHighlight) {},

        updateInternalTextStyle: function (el, strokeColor, strokeOpacity) {},

        /* ********* Image related stuff *********** */

        drawImage: function (el) {},

        updateImage: function (el) {},

        updateImageURL: function (el) {},

        /* ********* Render primitive objects *********** */

        appendChildPrim: function (node, level) {},

        appendNodesToElement: function (el, type) {},

        remove: function (node) {},

        makeArrows: function (el) {},

        updateEllipsePrim: function (node, x, y, rx, ry) {},

        updateLinePrim: function (node, p1x, p1y, p2x, p2y, board) {},

        updatePathPrim: function (node, pathString, board) {},

        updatePathStringPoint: function (el, size, type) {},

        updatePathStringPrim: function (el) {},

        updatePathStringBezierPrim: function (el) {},

        updatePolygonPrim: function (node, el) {},

        updateRectPrim: function (node, x, y, w, h) {},

        setPropertyPrim: function (node, key, val) {},

        /* ********* Set attributes *********** */

        show: function (el) {},

        hide: function (el) {},

        setBuffering: function (node, type) {},

        setDashStyle: function (el) {},

        setDraft: function (el) {},

        removeDraft: function (el) {},

        setGradient: function (el) {},

        updateGradient: function (el) {},

        setObjectTransition: function (el, duration) {},

        setObjectFillColor: function (el, color, opacity) {},

        setObjectStrokeColor: function (el, color, opacity) {},

        setObjectStrokeWidth: function (el, width) {},

        setShadow: function (el) {},

        highlight: function (el) {},

        noHighlight: function (el) {},

        /* ********* Renderer control *********** */

        suspendRedraw: function () {},

        unsuspendRedraw: function () {},

        drawNavigationBar: function (board) {},

        getElementById: function (id) { return null; },

        resize: function (w, h) {},

        removeToInsertLater: function () { return function () {}; }
    }
);

/**
 * @ignore
 */
JXG.NoRenderer.prototype = new AbstractRenderer();

export default JXG.NoRenderer;
