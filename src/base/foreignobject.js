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

/*global JXG: true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the ForeignObject element is defined.
 */

import JXG from "../jxg.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import GeometryElement from "./element.js";
import Mat from "../math/math.js";
import Type from "../utils/type.js";
import CoordsElement from "./coordselement.js";

/**
 * Construct and handle SVG foreignObjects.
 *
 * @class Creates a new foreignObject object. Do not use this constructor to create a foreignObject. Use {@link JXG.Board#create} with
 * type {@link foreignobject} instead.
 * @augments JXG.GeometryElement
 * @augments JXG.CoordsElement
 * @param {string|JXG.Board} board The board the new foreignObject is drawn on.
 * @param {Array} coordinates An array with the user coordinates of the foreignObject.
 * @param {Object} attributes An object containing visual and - optionally - a name and an id.
 * @param {string|function} url An URL string or a function returning an URL string.
 * @param  {Array} size Array containing width and height of the foreignObject in user coordinates.
 *
 */
JXG.ForeignObject = function (board, coords, attributes, content, size) {
    this.constructor(
        board,
        attributes,
        Const.OBJECT_TYPE_FOREIGNOBJECT,
        Const.OBJECT_CLASS_OTHER
    );
    this.element = this.board.select(attributes.anchor);
    this.coordsConstructor(coords);

    this._useUserSize = false;

    /**
     * Array of length two containing [width, height] of the foreignObject in pixel.
     * @type Array
     */
    this.size = [1, 1];
    if (Type.exists(size) && size.length > 0) {
        this._useUserSize = true;

        this.W = Type.createFunction(size[0], this.board, "");
        this.H = Type.createFunction(size[1], this.board, "");
        this.addParentsFromJCFunctions([this.W, this.H]);

        this.usrSize = [this.W(), this.H()];
    }

    // this.size = [Math.abs(this.usrSize[0] * board.unitX), Math.abs(this.usrSize[1] * board.unitY)];

    /**
     * 'href' of the foreignObject.
     * @type {string}
     */
    this.content = content;

    this.elType = 'foreignobject';

    // span contains the anchor point and the two vectors
    // spanning the foreignObject rectangle.
    // this.span = [
    //     this.coords.usrCoords.slice(0),
    //     [this.coords.usrCoords[0], this.W(), 0],
    //     [this.coords.usrCoords[0], 0, this.H()]
    // ];
    //this.parent = board.select(attributes.anchor);

    this.id = this.board.setId(this, 'Im');

    this.board.renderer.drawForeignObject(this);
    this.board.finalizeAdding(this);

    this.methodMap = JXG.deepCopy(this.methodMap, {
        addTransformation: "addTransform",
        trans: "addTransform",
        W: "W",
        Width: "W",
        H: "H",
        Height: "H"
    });
};

JXG.ForeignObject.prototype = new GeometryElement();
Type.copyPrototypeMethods(JXG.ForeignObject, CoordsElement, 'coordsConstructor');

JXG.extend(
    JXG.ForeignObject.prototype,
    /** @lends JXG.ForeignObject.prototype */ {
        /**
         * Checks whether (x,y) is over or near the image;
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is over the image, False otherwise.
         */
        hasPoint: function (x, y) {
            var dx, dy, r, type, prec, c, v, p, dot,
                len = this.transformations.length;

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                prec = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                prec = this.board.options.precision.hasPoint;
            }

            // Easy case: no transformation
            if (len === 0) {
                dx = x - this.coords.scrCoords[1];
                dy = this.coords.scrCoords[2] - y;
                r = prec;

                return dx >= -r && dx - this.size[0] <= r && dy >= -r && dy - this.size[1] <= r;
            }

            // foreignObject is transformed
            c = new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);
            // v is the vector from anchor point to the drag point
            c = c.usrCoords;
            v = [c[0] - this.span[0][0], c[1] - this.span[0][1], c[2] - this.span[0][2]];
            dot = Mat.innerProduct; // shortcut

            // Project the drag point to the sides.
            p = dot(v, this.span[1]);
            if (0 <= p && p <= dot(this.span[1], this.span[1])) {
                p = dot(v, this.span[2]);

                if (0 <= p && p <= dot(this.span[2], this.span[2])) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Recalculate the coordinates of lower left corner and the width and height.
         *
         * @returns {JXG.ForeignObject} A reference to the element
         * @private
         */
        update: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }
            this.updateCoords(fromParent);
            this.updateSize();
            // this.updateSpan();
            return this;
        },

        /**
         * Send an update request to the renderer.
         * @private
         */
        updateRenderer: function () {
            return this.updateRendererGeneric('updateForeignObject');
        },

        /**
         * Updates the internal arrays containing size of the foreignObject.
         * @returns {JXG.ForeignObject} A reference to the element
         * @private
         */
        updateSize: function () {
            var bb = [0, 0];

            if (this._useUserSize) {
                this.usrSize = [this.W(), this.H()];
                this.size = [
                    Math.abs(this.usrSize[0] * this.board.unitX),
                    Math.abs(this.usrSize[1] * this.board.unitY)
                ];
            } else {
                if (this.rendNode.hasChildNodes()) {
                    bb = this.rendNode.childNodes[0].getBoundingClientRect();
                    this.size = [bb.width, bb.height];
                }
            }

            return this;
        },

        /**
         * Update the anchor point of the foreignObject, i.e. the lower left corner
         * and the two vectors which span the rectangle.
         * @returns {JXG.ForeignObject} A reference to the element
         * @private
         *
         */
        updateSpan: function () {
            var i,
                j,
                len = this.transformations.length,
                v = [];

            if (len === 0) {
                this.span = [
                    [this.Z(), this.X(), this.Y()],
                    [this.Z(), this.W(), 0],
                    [this.Z(), 0, this.H()]
                ];
            } else {
                // v contains the three defining corners of the rectangle/image
                v[0] = [this.Z(), this.X(), this.Y()];
                v[1] = [this.Z(), this.X() + this.W(), this.Y()];
                v[2] = [this.Z(), this.X(), this.Y() + this.H()];

                // Transform the three corners
                for (i = 0; i < len; i++) {
                    for (j = 0; j < 3; j++) {
                        v[j] = Mat.matVecMult(this.transformations[i].matrix, v[j]);
                    }
                }
                // Normalize the vectors
                for (j = 0; j < 3; j++) {
                    v[j][1] /= v[j][0];
                    v[j][2] /= v[j][0];
                    v[j][0] /= v[j][0];
                }
                // Compute the two vectors spanning the rectangle
                // by subtracting the anchor point.
                for (j = 1; j < 3; j++) {
                    v[j][0] -= v[0][0];
                    v[j][1] -= v[0][1];
                    v[j][2] -= v[0][2];
                }
                this.span = v;
            }

            return this;
        },

        addTransform: function (transform) {
            var i;

            if (Type.isArray(transform)) {
                for (i = 0; i < transform.length; i++) {
                    this.transformations.push(transform[i]);
                }
            } else {
                this.transformations.push(transform);
            }

            return this;
        },

        // Documented in element.js
        getParents: function () {
            var p = [this.url, [this.Z(), this.X(), this.Y()], this.usrSize];

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        },

        /**
         * Set the width and height of the foreignObject. After setting a new size,
         * board.update() or foreignobject.fullUpdate()
         * has to be called to make the change visible.
         * @param  {numbe|function|string} width  Number, function or string
         *                            that determines the new width of the foreignObject
         * @param  {number|function|string} height Number, function or string
         *                            that determines the new height of the foreignObject
         * @returns {JXG.ForeignObject} A reference to the element
         *
         */
        setSize: function (width, height) {
            this.W = Type.createFunction(width, this.board, "");
            this.H = Type.createFunction(height, this.board, "");
            this._useUserSize = true;
            this.addParentsFromJCFunctions([this.W, this.H]);

            return this;
        },

        /**
         * Returns the width of the foreignObject in user coordinates.
         * @returns {number} width of the image in user coordinates
         */
        W: function () {}, // Needed for docs, defined in constructor

        /**
         * Returns the height of the foreignObject in user coordinates.
         * @returns {number} height of the image in user coordinates
         */
        H: function () {} // Needed for docs, defined in constructor
    }
);

/**
 * @class Display any HTML content in an SVG foreignObject container - even below other elements.
 * <p>
 * Instead of board.create('foreignobject') the shortcut board.create('fo') may be used.
 *
 * <p style="background-color:#dddddd; padding:10px"><b>NOTE:</b> In Safari up to version 15, a foreignObject does not obey the layer structure
 * if it contains &lt;video&gt; or &lt;iframe&gt; tags, as well as elements which are
 * positioned with <tt>position:absolute|relative|fixed</tt>. In this  case, the foreignobject will be
 * "above" the JSXGraph construction.
 * </p>
 *
 * @pseudo
 * @name ForeignObject
 * @augments JXG.ForeignObject
 * @constructor
 * @type JXG.ForeignObject
 *
 * @param {String} content HTML content of the foreignObject. May also be &lt;video&gt; or &lt;iframe&gt;
 * @param {Array} position Position of the foreignObject given by [x, y] in user coordinates. Same as for images.
 * @param {Array} [size] (Optional) argument size of the foreignObject in user coordinates. If not given, size is specified by the HTML attributes
 * or CSS properties of the content.
 *
 * @see Image
 *
 * @example
 * var p = board.create('point', [1, 7], {size: 16});
 * var fo = board.create('foreignobject', [
 *     '&lt;video width="300" height="200" src="https://eucbeniki.sio.si/vega2/278/Video_metanje_oge_.mp4" type="html5video" controls&gt;',
 *     [0, -3], [9, 6]],
 *     {layer: 8, fixed: true}
 *  );
 *
 * </pre><div id="JXG0c122f2c-3671-4a28-80a9-f4c523eeda89" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG0c122f2c-3671-4a28-80a9-f4c523eeda89',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p = board.create('point', [1, 7], {size: 16});
 *     var fo = board.create('foreignobject', [
 *         '<video width="300" height="200" src="https://eucbeniki.sio.si/vega2/278/Video_metanje_oge_.mp4" type="html5video" controls>',
 *         [0, -3], [9, 6]],
 *         {layer: 8, fixed: true}
 *      );
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var p = board.create('point', [1, 7], {size: 16});
 * var fo = board.create('fo', [
 *     '&lt;div style="background-color:blue; color: yellow; padding:20px; width:200px; height:50px; "&gt;Hello&lt;/div&gt;',
 *     [-7, -6]],
 *     {layer: 1, fixed: false}
 *  );
 *
 * </pre><div id="JXG1759c868-1a4a-4767-802c-91f84902e3ec" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1759c868-1a4a-4767-802c-91f84902e3ec',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p = board.create('point', [1, 7], {size: 16});
 *     var fo = board.create('foreignobject', [
 *         '<div style="background-color:blue; color: yellow; padding:20px; width:200px; height:50px; ">Hello</div>',
 *         [-7, -6]],
 *         {layer: 1, fixed: false}
 *      );
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * board.renderer.container.style.backgroundColor = 'lightblue';
 * var points = [];
 * points.push( board.create('point', [-2, 3.5], {fixed:false,color: 'yellow', size: 6,name:'6 am'}) );
 * points.push( board.create('point', [0, 3.5],  {fixed:false,color: 'yellow', size: 6,name:'12 pm'}) );
 * points.push( board.create('point', [2, 3.5],  {fixed:false,color: 'yellow', size: 6,name:'6 pm'}) );
 *
 * var fo = board.create('fo', [
 *     '&lt;video width="100%" height="100%" src="https://benedu.net/moodle/aaimg/ajx_img/astro/tr/1vd.mp4" type="html5video" controls&gt;',
 *     [-6, -4], [12, 8]],
 *     {layer: 0, fixed: true}
 *  );
 *
 * var f = JXG.Math.Numerics.lagrangePolynomial(points);
 * var graph = board.create('functiongraph', [f, -10, 10], {fixed:true,strokeWidth:3, layer: 8});
 *
 * </pre><div id="JXGc3fc5520-13aa-4f66-abaa-42e9dc3fbf3f" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc3fc5520-13aa-4f66-abaa-42e9dc3fbf3f',
 *             {boundingbox: [-6,4,6,-4], axis: true, showcopyright: false, shownavigation: false});
 *     board.renderer.container.style.backgroundColor = 'lightblue';
 *     var points = [];
 *     points.push( board.create('point', [-2, 3.5], {fixed:false,color: 'yellow', size: 6,name:'6 am'}) );
 *     points.push( board.create('point', [0, 3.5],  {fixed:false,color: 'yellow', size: 6,name:'12 pm'}) );
 *     points.push( board.create('point', [2, 3.5],  {fixed:false,color: 'yellow', size: 6,name:'6 pm'}) );
 *
 *     var fo = board.create('fo', [
 *         '<video width="100%" height="100%" src="https://benedu.net/moodle/aaimg/ajx_img/astro/tr/1vd.mp4" type="html5video" controls>',
 *         [-6, -4], [12, 8]],
 *         {layer: 0, fixed: true}
 *      );
 *
 *     var f = JXG.Math.Numerics.lagrangePolynomial(points);
 *     var graph = board.create('functiongraph', [f, -10, 10], {fixed:true,strokeWidth:3, layer: 8});
 *
 *     })();
 *
 * </script><pre>
 *
 * Video "24-hour time-lapse in Cascais, Portugal. Produced by Nuno Miguel Duarte" adapted from
 * <a href="https://www.pbslearningmedia.org/resource/buac18-k2-sci-ess-sunposition/changing-position-of-the-sun-in-the-sky/">https://www.pbslearningmedia.org/resource/buac18-k2-sci-ess-sunposition/changing-position-of-the-sun-in-the-sky/</a>,
 * ©2016 Nuno Miguel Duarte.
 *
 */
JXG.createForeignObject = function (board, parents, attributes) {
    var attr,
        fo,
        content = parents[0],
        coords = parents[1],
        size = [];

    if (parents.length >= 2) {
        size = parents[2];
    }

    attr = Type.copyAttributes(attributes, board.options, 'foreignobject');
    fo = CoordsElement.create(JXG.ForeignObject, board, coords, attr, content, size);
    if (!fo) {
        throw new Error(
            "JSXGraph: Can't create foreignObject with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [string, [x, y], [w, h]], [string, [x, y]], [element,transformation]"
        );
    }

    return fo;
};

JXG.registerElement("foreignobject", JXG.createForeignObject);
JXG.registerElement("fo", JXG.createForeignObject);

export default JXG.ForeignObject;
// export default {
//     ForeignObject: JXG.ForeignObject,
//     createForeignobject: JXG.createForeignObject
// };
