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

/*global JXG:true, define: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import Statistics from "../math/statistics.js";
import Geometry from "../math/geometry.js";
import Type from "../utils/type.js";
import GeometryElement from "./element.js";

/**
 * Creates a new instance of JXG.Polygon.
 * @class Polygon stores all style and functional properties that are required
 * to draw and to interactact with a polygon.
 * @constructor
 * @augments JXG.GeometryElement
 * @param {JXG.Board} board Reference to the board the polygon is to be drawn on.
 * @param {Array} vertices Unique identifiers for the points defining the polygon.
 * Last point must be first point. Otherwise, the first point will be added at the list.
 * @param {Object} attributes An object which contains properties as given in {@link JXG.Options.elements}
 * and {@link JXG.Options.polygon}.
 */
JXG.Polygon = function (board, vertices, attributes) {
    this.constructor(board, attributes, Const.OBJECT_TYPE_POLYGON, Const.OBJECT_CLASS_AREA);

    var i, l, len, j, p,
        attr_line = Type.copyAttributes(attributes, board.options, "polygon", 'borders');

    this.withLines = attributes.withlines;
    this.attr_line = attr_line;

    /**
     * References to the points defining the polygon. The last vertex is the same as the first vertex.
     * Compared to the 3D {@link JXG.Polygon3D#vertices}, it contains one point more, i.e. for a quadrangle
     * 'vertices' contains five points, the last one being
     * a copy of the first one. In a 3D quadrangle, 'vertices' will contain four points.
     * @type Array
     */
    this.vertices = [];
    for (i = 0; i < vertices.length; i++) {
        this.vertices[i] = this.board.select(vertices[i]);

        // The _is_new flag is replaced by _is_new_pol.
        // Otherwise, the polygon would disappear if the last border element
        // is removed (and the point has been provided by coordinates)
        if (this.vertices[i]._is_new) {
            delete this.vertices[i]._is_new;
            this.vertices[i]._is_new_pol = true;
        }
    }

    // Close the polygon
    if (
        this.vertices.length > 0 &&
        this.vertices[this.vertices.length - 1].id !== this.vertices[0].id
    ) {
        this.vertices.push(this.vertices[0]);
    }

    /**
     * References to the border lines (edges) of the polygon.
     * @type Array
     */
    this.borders = [];

    if (this.withLines) {
        len = this.vertices.length - 1;
        for (j = 0; j < len; j++) {
            // This sets the "correct" labels for the first triangle of a construction.
            i = (j + 1) % len;
            attr_line.id = attr_line.ids && attr_line.ids[i];
            attr_line.name = attr_line.names && attr_line.names[i];
            attr_line.strokecolor =
                (Type.isArray(attr_line.colors) &&
                    attr_line.colors[i % attr_line.colors.length]) ||
                attr_line.strokecolor;
            attr_line.visible = Type.exists(attributes.borders.visible)
                ? attributes.borders.visible
                : attributes.visible;

            if (attr_line.strokecolor === false) {
                attr_line.strokecolor = 'none';
            }

            l = board.create("segment", [this.vertices[i], this.vertices[i + 1]], attr_line);
            l.dump = false;
            this.borders[i] = l;
            l.parentPolygon = this;
            this.addChild(l);
        }
    }

    this.inherits.push(this.vertices, this.borders);

    // Register polygon at board
    // This needs to be done BEFORE the points get this polygon added in their descendants list
    this.id = this.board.setId(this, 'Py');

    // Add dependencies: either
    // - add polygon as child to an existing point
    // or
    // - add  points (supplied as coordinate arrays by the user and created by Type.providePoints) as children to the polygon
    for (i = 0; i < this.vertices.length - 1; i++) {
        p = this.board.select(this.vertices[i]);
        if (Type.exists(p._is_new_pol)) {
            this.addChild(p);
            delete p._is_new_pol;
        } else {
            p.addChild(this);
        }
    }

    this.board.renderer.drawPolygon(this);
    this.board.finalizeAdding(this);

    this.createGradient();
    this.elType = 'polygon';

    // create label
    this.createLabel();

    this.methodMap = JXG.deepCopy(this.methodMap, {
        borders: "borders",
        vertices: "vertices",
        A: "Area",
        Area: "Area",
        Perimeter: "Perimeter",
        L: "Perimeter",
        boundingBox: "bounds",
        BoundingBox: "bounds",
        addPoints: "addPoints",
        insertPoints: "insertPoints",
        removePoints: "removePoints",
        Intersect: "intersect"
    });
};

JXG.Polygon.prototype = new GeometryElement();

JXG.extend(
    JXG.Polygon.prototype,
    /** @lends JXG.Polygon.prototype */ {
        /**
         * Wrapper for JXG.Math.Geometry.pnpoly.
         *
         * @param {Number} x_in x-coordinate (screen or user coordinates)
         * @param {Number} y_in y-coordinate (screen or user coordinates)
         * @param {Number} coord_type (Optional) the type of coordinates used here.
         *   Possible values are <b>JXG.COORDS_BY_USER</b> and <b>JXG.COORDS_BY_SCREEN</b>.
         *   Default value is JXG.COORDS_BY_SCREEN
         *
         * @returns {Boolean} if (x_in, y_in) is inside of the polygon.
         * @see JXG.Math.Geometry#pnpoly
         *
         * @example
         * var pol = board.create('polygon', [[-1,2], [2,2], [-1,4]]);
         * var p = board.create('point', [4, 3]);
         * var txt = board.create('text', [-1, 0.5, function() {
         *   return 'Point A is inside of the polygon = ' +
         *     pol.pnpoly(p.X(), p.Y(), JXG.COORDS_BY_USER);
         * }]);
         *
         * </pre><div id="JXG7f96aec7-4e3d-4ffc-a3f5-d3f967b6691c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG7f96aec7-4e3d-4ffc-a3f5-d3f967b6691c',
         *             {boundingbox: [-2, 5, 5,-2], axis: true, showcopyright: false, shownavigation: false});
         *     var pol = board.create('polygon', [[-1,2], [2,2], [-1,4]]);
         *     var p = board.create('point', [4, 3]);
         *     var txt = board.create('text', [-1, 0.5, function() {
         *     		return 'Point A is inside of the polygon = ' + pol.pnpoly(p.X(), p.Y(), JXG.COORDS_BY_USER);
         *     }]);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        pnpoly: function (x_in, y_in, coord_type) {
            return Geometry.pnpoly(x_in, y_in, this.vertices, coord_type, this.board);
        },

        /**
         * Checks whether (x,y) is near the polygon.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} Returns true, if (x,y) is inside or at the boundary the polygon, otherwise false.
         */
        hasPoint: function (x, y) {
            var i, len;

            if (this.evalVisProp('hasinnerpoints')) {
                // All points of the polygon trigger hasPoint: inner and boundary points
                if (this.pnpoly(x, y)) {
                    return true;
                }
            }

            // Only boundary points trigger hasPoint
            // We additionally test the boundary also in case hasInnerPoints.
            // Since even if the above test has failed, the strokewidth may be large and (x, y) may
            // be inside of hasPoint() of a vertices.
            len = this.borders.length;
            for (i = 0; i < len; i++) {
                if (this.borders[i].hasPoint(x, y)) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Uses the boards renderer to update the polygon.
         */
        updateRenderer: function () {
            var i, len;

            if (!this.needsUpdate) {
                return this;
            }

            if (this.visPropCalc.visible) {
                len = this.vertices.length - ((this.elType === 'polygonalchain') ? 0 : 1);
                this.isReal = true;
                for (i = 0; i < len; ++i) {
                    if (!this.vertices[i].isReal) {
                        this.isReal = false;
                        break;
                    }
                }

                if (!this.isReal) {
                    this.updateVisibility(false);

                    for (i in this.childElements) {
                        if (this.childElements.hasOwnProperty(i)) {
                            // All child elements are hidden.
                            // This may be weakened to all borders and only vertices with with visible:'inherit'
                            this.childElements[i].setDisplayRendNode(false);
                        }
                    }
                }
            }

            if (this.visPropCalc.visible) {
                this.board.renderer.updatePolygon(this);
            }

            /* Update the label if visible. */
            if (this.hasLabel &&
                this.visPropCalc.visible &&
                this.label &&
                this.label.visPropCalc.visible &&
                this.isReal
            ) {
                this.label.update();
                this.board.renderer.updateText(this.label);
            }

            // Update rendNode display
            this.setDisplayRendNode();

            this.needsUpdate = false;
            return this;
        },

        /**
         * return TextAnchor
         */
        getTextAnchor: function () {
            var a, b, x, y, i;

            if (this.vertices.length === 0) {
                return new Coords(Const.COORDS_BY_USER, [1, 0, 0], this.board);
            }

            a = this.vertices[0].X();
            b = this.vertices[0].Y();
            x = a;
            y = b;
            for (i = 0; i < this.vertices.length; i++) {
                if (this.vertices[i].X() < a) {
                    a = this.vertices[i].X();
                }

                if (this.vertices[i].X() > x) {
                    x = this.vertices[i].X();
                }

                if (this.vertices[i].Y() > b) {
                    b = this.vertices[i].Y();
                }

                if (this.vertices[i].Y() < y) {
                    y = this.vertices[i].Y();
                }
            }

            return new Coords(Const.COORDS_BY_USER, [(a + x) * 0.5, (b + y) * 0.5], this.board);
        },

        getLabelAnchor: JXG.shortcut(JXG.Polygon.prototype, 'getTextAnchor'),

        // documented in geometry element
        cloneToBackground: function () {
            var er,
                copy = Type.getCloneObject(this);

            copy.vertices = this.vertices;
            er = this.board.renderer.enhancedRendering;
            this.board.renderer.enhancedRendering = true;
            this.board.renderer.drawPolygon(copy);
            this.board.renderer.enhancedRendering = er;
            this.traces[copy.id] = copy.rendNode;

            return this;
        },

        /**
         * Hide the polygon including its border lines. It will still exist but not visible on the board.
         * @param {Boolean} [borderless=false] If set to true, the polygon is treated as a polygon without
         * borders, i.e. the borders will not be hidden.
         */
        hideElement: function (borderless) {
            var i;

            JXG.deprecated("Element.hideElement()", "Element.setDisplayRendNode()");

            this.visPropCalc.visible = false;
            this.board.renderer.display(this, false);

            if (!borderless) {
                for (i = 0; i < this.borders.length; i++) {
                    this.borders[i].hideElement();
                }
            }

            if (this.hasLabel && Type.exists(this.label)) {
                this.label.hiddenByParent = true;
                if (this.label.visPropCalc.visible) {
                    this.label.hideElement();
                }
            }
        },

        /**
         * Make the element visible.
         * @param {Boolean} [borderless=false] If set to true, the polygon is treated as a polygon without
         * borders, i.e. the borders will not be shown.
         */
        showElement: function (borderless) {
            var i;

            JXG.deprecated("Element.showElement()", "Element.setDisplayRendNode()");

            this.visPropCalc.visible = true;
            this.board.renderer.display(this, true);

            if (!borderless) {
                for (i = 0; i < this.borders.length; i++) {
                    this.borders[i].showElement().updateRenderer();
                }
            }

            if (Type.exists(this.label) && this.hasLabel && this.label.hiddenByParent) {
                this.label.hiddenByParent = false;
                if (!this.label.visPropCalc.visible) {
                    this.label.showElement().updateRenderer();
                }
            }
            return this;
        },

        /**
         * Area of (not self-intersecting) polygon
         * @returns {Number} Area of (not self-intersecting) polygon
         */
        Area: function () {
            return Math.abs(Geometry.signedPolygon(this.vertices, true));
        },

        /**
         * Perimeter of polygon. For a polygonal chain, this method returns its length.
         *
         * @returns {Number} Perimeter of polygon in user units.
         * @see JXG.Polygon#L
         *
         * @example
         * var p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [1.0, 3.0]];
         *
         * var pol = board.create('polygon', p, {hasInnerPoints: true});
         * var t = board.create('text', [5, 5, function() { return pol.Perimeter(); }]);
         * </pre><div class="jxgbox" id="JXGb10b734d-89fc-4b9d-b4a7-e3f0c1c6bf77" style="width: 400px; height: 400px;"></div>
         * <script type="text/javascript">
         *  (function () {
         *   var board = JXG.JSXGraph.initBoard('JXGb10b734d-89fc-4b9d-b4a7-e3f0c1c6bf77', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
         *       p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [1.0, 4.0]],
         *       cc1 = board.create('polygon', p, {hasInnerPoints: true}),
         *       t = board.create('text', [5, 5, function() { return cc1.Perimeter(); }]);
         *  })();
         * </script><pre>
         *
         */
        Perimeter: function () {
            var i,
                len = this.vertices.length,
                val = 0.0;

            for (i = 1; i < len; ++i) {
                val += this.vertices[i].Dist(this.vertices[i - 1]);
            }

            return val;
        },

        /**
         * Alias for Perimeter. For polygons, the perimeter is returned. For polygonal chains the length is returned.
         *
         * @returns Number
         * @see JXG.Polygon#Perimeter
         */
        L: function() {
            return this.Perimeter();
        },

        /**
         * Bounding box of a polygon. The bounding box is an array of four numbers: the first two numbers
         * determine the upper left corner, the last two numbers determine the lower right corner of the bounding box.
         *
         * The width and height of a polygon can then determined like this:
         * @example
         * var box = polygon.boundingBox();
         * var width = box[2] - box[0];
         * var height = box[1] - box[3];
         *
         * @returns {Array} Array containing four numbers: [minX, maxY, maxX, minY]
         */
        boundingBox: function () {
            var box = [0, 0, 0, 0],
                i,
                v,
                le = this.vertices.length - 1;

            if (le === 0) {
                return box;
            }
            box[0] = this.vertices[0].X();
            box[2] = box[0];
            box[1] = this.vertices[0].Y();
            box[3] = box[1];

            for (i = 1; i < le; ++i) {
                v = this.vertices[i].X();
                if (v < box[0]) {
                    box[0] = v;
                } else if (v > box[2]) {
                    box[2] = v;
                }

                v = this.vertices[i].Y();
                if (v > box[1]) {
                    box[1] = v;
                } else if (v < box[3]) {
                    box[3] = v;
                }
            }

            return box;
        },

        // Already documented in GeometryElement
        bounds: function () {
            return this.boundingBox();
        },

        /**
         * This method removes the SVG or VML nodes of the lines and the filled area from the renderer, to remove
         * the object completely you should use {@link JXG.Board#removeObject}.
         *
         * @private
         */
        remove: function () {
            var i;

            for (i = 0; i < this.borders.length; i++) {
                this.board.removeObject(this.borders[i]);
            }

            GeometryElement.prototype.remove.call(this);
        },

        /**
         * Finds the index to a given point reference.
         * @param {JXG.Point} p Reference to an element of type {@link JXG.Point}
         * @returns {Number} Index of the point or -1.
         */
        findPoint: function (p) {
            var i;

            if (!Type.isPoint(p)) {
                return -1;
            }

            for (i = 0; i < this.vertices.length; i++) {
                if (this.vertices[i].id === p.id) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Add more points to the polygon. The new points will be inserted at the end.
         * The attributes of new border segments are set to the same values
         * as those used when the polygon was created.
         * If new vertices are supplied by coordinates, the default attributes of polygon
         * vertices are taken as their attributes. Therefore, the visual attributes of
         * new vertices and borders may have to be adapted afterwards.
         * @param {JXG.Point} p Arbitrary number of points or coordinate arrays
         * @returns {JXG.Polygon} Reference to the polygon
         * @example
         * var pg = board.create('polygon', [[1,2], [3,4], [-3,1]], {hasInnerPoints: true});
         * var newPoint = board.create('point', [-1, -1]);
         * var newPoint2 = board.create('point', [-1, -2]);
         * pg.addPoints(newPoint, newPoint2, [1, -2]);
         *
         * </pre><div id="JXG70eb0fd2-d20f-4ba9-9ab6-0eac92aabfa5" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG70eb0fd2-d20f-4ba9-9ab6-0eac92aabfa5',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var pg = board.create('polygon', [[1,2], [3,4], [-3,1]], {hasInnerPoints: true});
         *     var newPoint = board.create('point', [-1, -1]);
         *     var newPoint2 = board.create('point', [-1, -2]);
         *     pg.addPoints(newPoint, newPoint2, [1, -2]);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        addPoints: function (p) {
            var idx,
                args = Array.prototype.slice.call(arguments);

            if (this.elType === 'polygonalchain') {
                idx = this.vertices.length - 1;
            } else {
                idx = this.vertices.length - 2;
            }
            return this.insertPoints.apply(this, [idx].concat(args));
        },

        /**
         * Insert points to the vertex list of the polygon after index <tt>idx</tt>.
         * The attributes of new border segments are set to the same values
         * as those used when the polygon was created.
         * If new vertices are supplied by coordinates, the default attributes of polygon
         * vertices are taken as their attributes. Therefore, the visual attributes of
         * new vertices and borders may have to be adapted afterwards.
         *
         * @param {Number} idx The position after which the new vertices are inserted.
         * Setting idx to -1 inserts the new points at the front, i.e. at position 0.
         * @param {JXG.Point} p Arbitrary number of points or coordinate arrays to insert.
         * @returns {JXG.Polygon} Reference to the polygon object
         *
         * @example
         * var pg = board.create('polygon', [[1,2], [3,4], [-3,1]], {hasInnerPoints: true});
         * var newPoint = board.create('point', [-1, -1]);
         * pg.insertPoints(0, newPoint, newPoint, [1, -2]);
         *
         * </pre><div id="JXG17b84b2a-a851-4e3f-824f-7f6a60f166ca" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG17b84b2a-a851-4e3f-824f-7f6a60f166ca',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var pg = board.create('polygon', [[1,2], [3,4], [-3,1]], {hasInnerPoints: true});
         *     var newPoint = board.create('point', [-1, -1]);
         *     pg.insertPoints(0, newPoint, newPoint, [1, -2]);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        insertPoints: function (idx, p) {
            var i, le, last, start, q;

            if (arguments.length === 0) {
                return this;
            }

            last = this.vertices.length - 1;
            if (this.elType === 'polygon') {
                last--;
            }

            // Wrong insertion index, get out of here
            if (idx < -1 || idx > last) {
                return this;
            }

            le = arguments.length - 1;
            for (i = 1; i < le + 1; i++) {
                q = Type.providePoints(this.board, [arguments[i]], {}, "polygon", [
                    "vertices"
                ])[0];
                if (q._is_new) {
                    // Add the point as child of the polygon, but not of the borders.
                    this.addChild(q);
                    delete q._is_new;
                }
                this.vertices.splice(idx + i, 0, q);
            }

            if (this.withLines) {
                start = idx + 1;
                if (this.elType === 'polygon') {
                    if (idx < 0) {
                        // Add point(s) in the front
                        this.vertices[this.vertices.length - 1] = this.vertices[0];
                        this.borders[this.borders.length - 1].point2 =
                            this.vertices[this.vertices.length - 1];
                    } else {
                        // Insert point(s) (middle or end)
                        this.borders[idx].point2 = this.vertices[start];
                    }
                } else {
                    // Add point(s) in the front: do nothing
                    // Else:
                    if (idx >= 0) {
                        if (idx < this.borders.length) {
                            // Insert point(s) in the middle
                            this.borders[idx].point2 = this.vertices[start];
                        } else {
                            // Add point at the end
                            start = idx;
                        }
                    }
                }
                for (i = start; i < start + le; i++) {
                    this.borders.splice(
                        i,
                        0,
                        this.board.create(
                            "segment",
                            [this.vertices[i], this.vertices[i + 1]],
                            this.attr_line
                        )
                    );
                }
            }
            this.inherits = [];
            this.inherits.push(this.vertices, this.borders);
            this.board.update();

            return this;
        },

        /**
         * Removes given set of vertices from the polygon
         * @param {JXG.Point} p Arbitrary number of vertices as {@link JXG.Point} elements or index numbers
         * @returns {JXG.Polygon} Reference to the polygon
         */
        removePoints: function (p) {
            var i, j, idx,
                firstPoint,
                nvertices = [],
                nborders = [],
                nidx = [],
                partition = [];

            // Partition:
            // in order to keep the borders which could be recycled, we have to partition
            // the set of removed points. I.e. if the points 1, 2, 5, 6, 7, 10 are removed,
            // the partitions are
            //       1-2, 5-7, 10-10
            // this gives us the borders, that can be removed and the borders we have to create.

            // In case of polygon: remove the last vertex from the list of vertices since
            // it is identical to the first
            if (this.elType === 'polygon') {
                firstPoint = this.vertices.pop();
            }

            // Collect all valid parameters as indices in nidx
            for (i = 0; i < arguments.length; i++) {
                idx = arguments[i];
                if (Type.isPoint(idx)) {
                    idx = this.findPoint(idx);
                }
                if (
                    Type.isNumber(idx) &&
                    idx > -1 &&
                    idx < this.vertices.length &&
                    Type.indexOf(nidx, idx) === -1
                ) {
                    nidx.push(idx);
                }
            }

            if (nidx.length === 0) {
                // Wrong index, get out of here
                if (this.elType === 'polygon') {
                    this.vertices.push(firstPoint);
                }
                return this;
            }

            // Remove the polygon from each removed point's children
            for (i = 0; i < nidx.length; i++) {
                this.vertices[nidx[i]].removeChild(this);
            }

            // Sort the elements to be eliminated
            nidx = nidx.sort();
            nvertices = this.vertices.slice();
            nborders = this.borders.slice();

            // Initialize the partition with an array containing the last point to be removed
            if (this.withLines) {
                partition.push([nidx[nidx.length - 1]]);
            }

            // Run through all existing vertices and copy all remaining ones to nvertices,
            // compute the partition
            for (i = nidx.length - 1; i > -1; i--) {
                nvertices[nidx[i]] = -1;

                // Find gaps between the list of points to be removed.
                // In this case a new partition is added.
                if (this.withLines && nidx.length > 1 && nidx[i] - 1 > nidx[i - 1]) {
                    partition[partition.length - 1][1] = nidx[i];
                    partition.push([nidx[i - 1]]);
                }
            }

            // Finalize the partition computation
            if (this.withLines) {
                partition[partition.length - 1][1] = nidx[0];
            }

            // Update vertices
            this.vertices = [];
            for (i = 0; i < nvertices.length; i++) {
                if (Type.isPoint(nvertices[i])) {
                    this.vertices.push(nvertices[i]);
                }
            }

            // Close the polygon again
            if (
                this.elType === "polygon" &&
                this.vertices.length > 1 &&
                this.vertices[this.vertices.length - 1].id !== this.vertices[0].id
            ) {
                this.vertices.push(this.vertices[0]);
            }

            // Delete obsolete and create missing borders
            if (this.withLines) {
                for (i = 0; i < partition.length; i++) {
                    for (j = partition[i][1] - 1; j < partition[i][0] + 1; j++) {
                        // special cases
                        if (j < 0) {
                            if (this.elType === 'polygon') {
                                // First vertex is removed, so the last border has to be removed, too
                                this.board.removeObject(this.borders[nborders.length - 1]);
                                nborders[nborders.length - 1] = -1;
                            }
                        } else if (j < nborders.length) {
                            this.board.removeObject(this.borders[j]);
                            nborders[j] = -1;
                        }
                    }

                    // Only create the new segment if it's not the closing border.
                    // The closing border is getting a special treatment at the end.
                    if (partition[i][1] !== 0 && partition[i][0] !== nvertices.length - 1) {
                        // nborders[partition[i][0] - 1] = this.board.create('segment', [
                        //             nvertices[Math.max(partition[i][1] - 1, 0)],
                        //             nvertices[Math.min(partition[i][0] + 1, this.vertices.length - 1)]
                        //         ], this.attr_line);
                        nborders[partition[i][0] - 1] = this.board.create(
                            "segment",
                            [nvertices[partition[i][1] - 1], nvertices[partition[i][0] + 1]],
                            this.attr_line
                        );
                    }
                }

                this.borders = [];
                for (i = 0; i < nborders.length; i++) {
                    if (nborders[i] !== -1) {
                        this.borders.push(nborders[i]);
                    }
                }

                // if the first and/or the last vertex is removed, the closing border is created at the end.
                if (
                    this.elType === "polygon" &&
                    this.vertices.length > 2 && // Avoid trivial case of polygon with 1 vertex
                    (partition[0][1] === this.vertices.length - 1 ||
                        partition[partition.length - 1][1] === 0)
                ) {
                    this.borders.push(
                        this.board.create(
                            "segment",
                            [this.vertices[this.vertices.length - 2], this.vertices[0]],
                            this.attr_line
                        )
                    );
                }
            }
            this.inherits = [];
            this.inherits.push(this.vertices, this.borders);

            this.board.update();

            return this;
        },

        // documented in element.js
        getParents: function () {
            this.setParents(this.vertices);
            return this.parents;
        },

        getAttributes: function () {
            var attr = GeometryElement.prototype.getAttributes.call(this),
                i;

            if (this.withLines) {
                attr.lines = attr.lines || {};
                attr.lines.ids = [];
                attr.lines.colors = [];

                for (i = 0; i < this.borders.length; i++) {
                    attr.lines.ids.push(this.borders[i].id);
                    attr.lines.colors.push(this.borders[i].visProp.strokecolor);
                }
            }

            return attr;
        },

        snapToGrid: function () {
            var i, force;

            if (this.evalVisProp('snaptogrid')) {
                force = true;
            } else {
                force = false;
            }

            for (i = 0; i < this.vertices.length; i++) {
                this.vertices[i].handleSnapToGrid(force, true);
            }
        },

        /**
         * Moves the polygon by the difference of two coordinates.
         * @param {Number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} oldcoords previous coordinates in screen/user units
         * @returns {JXG.Polygon} this element
         */
        setPositionDirectly: function (method, coords, oldcoords) {
            var dc,
                t,
                i,
                len,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board);

            len = this.vertices.length - 1;
            for (i = 0; i < len; i++) {
                if (!this.vertices[i].draggable()) {
                    return this;
                }
            }

            dc = Statistics.subtract(c.usrCoords, oldc.usrCoords);
            t = this.board.create("transform", dc.slice(1), { type: "translate" });
            t.applyOnce(this.vertices.slice(0, -1));

            return this;
        },

        /**
         * Algorithm by Sutherland and Hodgman to compute the intersection of two convex polygons.
         * The polygon itself is the clipping polygon, it expects as parameter a polygon to be clipped.
         * See <a href="https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm">wikipedia entry</a>.
         * Called by {@link JXG.Polygon#intersect}.
         *
         * @private
         *
         * @param {JXG.Polygon} polygon Polygon which will be clipped.
         *
         * @returns {Array} of (normalized homogeneous user) coordinates (i.e. [z, x, y], where z==1 in most cases,
         *   representing the vertices of the intersection polygon.
         *
         */
        sutherlandHodgman: function (polygon) {
            // First the two polygons are sorted counter clockwise
            var clip = JXG.Math.Geometry.sortVertices(this.vertices), // "this" is the clipping polygon
                subject = JXG.Math.Geometry.sortVertices(polygon.vertices), // "polygon" is the subject polygon
                lenClip = clip.length - 1,
                lenSubject = subject.length - 1,
                lenIn,
                outputList = [],
                inputList,
                i,
                j,
                S,
                E,
                cross,
                // Determines if the point c3 is right of the line through c1 and c2.
                // Since the polygons are sorted counter clockwise, "right of" and therefore >= is needed here
                isInside = function (c1, c2, c3) {
                    return (
                        (c2[1] - c1[1]) * (c3[2] - c1[2]) - (c2[2] - c1[2]) * (c3[1] - c1[1]) >=
                        0
                    );
                };

            for (i = 0; i < lenSubject; i++) {
                outputList.push(subject[i]);
            }

            for (i = 0; i < lenClip; i++) {
                inputList = outputList.slice(0);
                lenIn = inputList.length;
                outputList = [];

                S = inputList[lenIn - 1];

                for (j = 0; j < lenIn; j++) {
                    E = inputList[j];
                    if (isInside(clip[i], clip[i + 1], E)) {
                        if (!isInside(clip[i], clip[i + 1], S)) {
                            cross = JXG.Math.Geometry.meetSegmentSegment(
                                S,
                                E,
                                clip[i],
                                clip[i + 1]
                            );
                            cross[0][1] /= cross[0][0];
                            cross[0][2] /= cross[0][0];
                            cross[0][0] = 1;
                            outputList.push(cross[0]);
                        }
                        outputList.push(E);
                    } else if (isInside(clip[i], clip[i + 1], S)) {
                        cross = JXG.Math.Geometry.meetSegmentSegment(
                            S,
                            E,
                            clip[i],
                            clip[i + 1]
                        );
                        cross[0][1] /= cross[0][0];
                        cross[0][2] /= cross[0][0];
                        cross[0][0] = 1;
                        outputList.push(cross[0]);
                    }
                    S = E;
                }
            }

            return outputList;
        },

        /**
         * Generic method for the intersection of this polygon with another polygon.
         * The parent object is the clipping polygon, it expects as parameter a polygon to be clipped.
         * Both polygons have to be convex.
         * Calls the algorithm by Sutherland, Hodgman, {@link JXG.Polygon#sutherlandHodgman}.
         * <p>
         * An alternative is to use the methods from {@link JXG.Math.Clip}, where the algorithm by Greiner and Hormann
         * is used.
         *
         * @param {JXG.Polygon} polygon Polygon which will be clipped.
         *
         * @returns {Array} of (normalized homogeneous user) coordinates (i.e. [z, x, y], where z==1 in most cases,
         *   representing the vertices of the intersection polygon.
         *
         * @example
         *  // Static intersection of two polygons pol1 and pol2
         *  var pol1 = board.create('polygon', [[-2, 3], [-4, -3], [2, 0], [4, 4]], {
         *                name:'pol1', withLabel: true,
         *                fillColor: 'yellow'
         *             });
         *  var pol2 = board.create('polygon', [[-2, -3], [-4, 1], [0, 4], [5, 1]], {
         *                name:'pol2', withLabel: true
         *             });
         *
         *  // Static version:
         *  // the intersection polygon does not adapt to changes of pol1 or pol2.
         *  var pol3 = board.create('polygon', pol1.intersect(pol2), {fillColor: 'blue'});
         * </pre><div class="jxgbox" id="JXGd1fe5ea9-309f-494a-af07-ee3d033acb7c" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *   (function() {
         *       var board = JXG.JSXGraph.initBoard('JXGd1fe5ea9-309f-494a-af07-ee3d033acb7c', {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *       // Intersect two polygons pol1 and pol2
         *       var pol1 = board.create('polygon', [[-2, 3], [-4, -3], [2, 0], [4, 4]], {
         *                name:'pol1', withLabel: true,
         *                fillColor: 'yellow'
         *             });
         *       var pol2 = board.create('polygon', [[-2, -3], [-4, 1], [0, 4], [5, 1]], {
         *                name:'pol2', withLabel: true
         *             });
         *
         *       // Static version: the intersection polygon does not adapt to changes of pol1 or pol2.
         *       var pol3 = board.create('polygon', pol1.intersect(pol2), {fillColor: 'blue'});
         *   })();
         * </script><pre>
         *
         * @example
         *  // Dynamic intersection of two polygons pol1 and pol2
         *  var pol1 = board.create('polygon', [[-2, 3], [-4, -3], [2, 0], [4, 4]], {
         *                name:'pol1', withLabel: true,
         *                fillColor: 'yellow'
         *             });
         *  var pol2 = board.create('polygon', [[-2, -3], [-4, 1], [0, 4], [5, 1]], {
         *                name:'pol2', withLabel: true
         *             });
         *
         *  // Dynamic version:
         *  // the intersection polygon does adapt to changes of pol1 or pol2.
         *  // For this a curve element is used.
         *  var curve = board.create('curve', [[],[]], {fillColor: 'blue', fillOpacity: 0.4});
         *  curve.updateDataArray = function() {
         *      var mat = JXG.Math.transpose(pol1.intersect(pol2));
         *
         *      if (mat.length == 3) {
         *          this.dataX = mat[1];
         *          this.dataY = mat[2];
         *      } else {
         *          this.dataX = [];
         *          this.dataY = [];
         *      }
         *  };
         *  board.update();
         * </pre><div class="jxgbox" id="JXGf870d516-ca1a-4140-8fe3-5d64fb42e5f2" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *   (function() {
         *       var board = JXG.JSXGraph.initBoard('JXGf870d516-ca1a-4140-8fe3-5d64fb42e5f2', {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *       // Intersect two polygons pol1 and pol2
         *       var pol1 = board.create('polygon', [[-2, 3], [-4, -3], [2, 0], [4, 4]], {
         *                name:'pol1', withLabel: true,
         *                fillColor: 'yellow'
         *             });
         *       var pol2 = board.create('polygon', [[-2, -3], [-4, 1], [0, 4], [5, 1]], {
         *                name:'pol2', withLabel: true
         *             });
         *
         *  // Dynamic version:
         *  // the intersection polygon does  adapt to changes of pol1 or pol2.
         *  // For this a curve element is used.
         *    var curve = board.create('curve', [[],[]], {fillColor: 'blue', fillOpacity: 0.4});
         *    curve.updateDataArray = function() {
         *        var mat = JXG.Math.transpose(pol1.intersect(pol2));
         *
         *        if (mat.length == 3) {
         *            this.dataX = mat[1];
         *            this.dataY = mat[2];
         *        } else {
         *            this.dataX = [];
         *            this.dataY = [];
         *        }
         *    };
         *    board.update();
         *   })();
         * </script><pre>
         *
         */
        intersect: function (polygon) {
            return this.sutherlandHodgman(polygon);
        }
    }
);

/**
 * @class A polygon is a plane figure made up of line segments (the borders) connected
 * to form a closed polygonal chain.
 * It is determined by
 * <ul>
 *    <li> a list of points or
 *    <li> a list of coordinate arrays or
 *    <li> a function returning a list of coordinate arrays.
 * </ul>
 * Each two consecutive points of the list define a line.
 * @pseudo
 * @constructor
 * @name Polygon
 * @type JXG.Polygon
 * @augments JXG.Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array} vertices The polygon's vertices. If the first and the last vertex don't match the first one will be
 * added to the array by the creator. Here, two points match if they have the same 'id' attribute.
 *
 * Additionally, a polygon can be created by providing a polygon and a transformation (or an array of transformations).
 * The result is a polygon which is the transformation of the supplied polygon.
 *
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 * var p3 = board.create('point', [4.0, 6.0]);
 * var p4 = board.create('point', [1.0, 4.0]);
 *
 * var pol = board.create('polygon', [p1, p2, p3, p4]);
 * </pre><div class="jxgbox" id="JXG682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [2.0, 1.0]),
 *       p3 = board.create('point', [4.0, 6.0]),
 *       p4 = board.create('point', [1.0, 4.0]),
 *       cc1 = board.create('polygon', [p1, p2, p3, p4]);
 *  })();
 * </script><pre>
 *
 * @example
 * var p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [1.0, 3.0]];
 *
 * var pol = board.create('polygon', p, {hasInnerPoints: true});
 * </pre><div class="jxgbox" id="JXG9f9a5946-112a-4768-99ca-f30792bcdefb" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG9f9a5946-112a-4768-99ca-f30792bcdefb', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [1.0, 4.0]],
 *       cc1 = board.create('polygon', p, {hasInnerPoints: true});
 *  })();
 * </script><pre>
 *
 * @example
 *   var f1 = function() { return [0.0, 2.0]; },
 *       f2 = function() { return [2.0, 1.0]; },
 *       f3 = function() { return [4.0, 6.0]; },
 *       f4 = function() { return [1.0, 4.0]; },
 *       cc1 = board.create('polygon', [f1, f2, f3, f4]);
 *       board.update();
 *
 * </pre><div class="jxgbox" id="JXGceb09915-b783-44db-adff-7877ae3534c8" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('JXGceb09915-b783-44db-adff-7877ae3534c8', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       f1 = function() { return [0.0, 2.0]; },
 *       f2 = function() { return [2.0, 1.0]; },
 *       f3 = function() { return [4.0, 6.0]; },
 *       f4 = function() { return [1.0, 4.0]; },
 *       cc1 = board.create('polygon', [f1, f2, f3, f4]);
 *       board.update();
 *  })();
 * </script><pre>
 *
 * @example
 * var t = board.create('transform', [2, 1.5], {type: 'scale'});
 * var a = board.create('point', [-3,-2], {name: 'a'});
 * var b = board.create('point', [-1,-4], {name: 'b'});
 * var c = board.create('point', [-2,-0.5], {name: 'c'});
 * var pol1 = board.create('polygon', [a,b,c], {vertices: {withLabel: false}});
 * var pol2 = board.create('polygon', [pol1, t], {vertices: {withLabel: true}});
 *
 * </pre><div id="JXG6530a69c-6339-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6530a69c-6339-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var t = board.create('transform', [2, 1.5], {type: 'scale'});
 *     var a = board.create('point', [-3,-2], {name: 'a'});
 *     var b = board.create('point', [-1,-4], {name: 'b'});
 *     var c = board.create('point', [-2,-0.5], {name: 'c'});
 *     var pol1 = board.create('polygon', [a,b,c], {vertices: {withLabel: false}});
 *     var pol2 = board.create('polygon', [pol1, t], {vertices: {withLabel: true}});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createPolygon = function (board, parents, attributes) {
    var el, i, le, obj,
        points = [],
        attr,
        attr_points,
        is_transform = false;

    attr = Type.copyAttributes(attributes, board.options, 'polygon');
    obj = board.select(parents[0]);
    if (obj === null) {
        // This is necessary if the original polygon is defined in another board.
        obj = parents[0];
    }
    if (
        Type.isObject(obj) &&
        obj.type === Const.OBJECT_TYPE_POLYGON &&
        Type.isTransformationOrArray(parents[1])
    ) {
        is_transform = true;
        le = obj.vertices.length - 1;
        attr_points = Type.copyAttributes(attributes, board.options, "polygon", 'vertices');
        for (i = 0; i < le; i++) {
            if (attr_points.withlabel) {
                attr_points.name =
                    obj.vertices[i].name === "" ? "" : obj.vertices[i].name + "'";
            }
            points.push(board.create("point", [obj.vertices[i], parents[1]], attr_points));
        }
    } else {
        points = Type.providePoints(board, parents, attributes, "polygon", ["vertices"]);
        if (points === false) {
            throw new Error(
                "JSXGraph: Can't create polygon / polygonalchain with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates. Alternatively, a polygon and a transformation can be supplied"
            );
        }
    }

    attr = Type.copyAttributes(attributes, board.options, 'polygon');
    el = new JXG.Polygon(board, points, attr);
    el.isDraggable = true;

    // Put the points to their position
    if (is_transform) {
        el.prepareUpdate().update().updateVisibility().updateRenderer();
        le = obj.vertices.length - 1;
        for (i = 0; i < le; i++) {
            points[i].prepareUpdate().update().updateVisibility().updateRenderer();
        }
    }

    return el;
};

/**
 * @class A regular polygon is a polygon that is
 * direct equiangular (all angles are equal in measure) and equilateral (all sides have the same length).
 * It needs two points which define the base line and the number of vertices.
 * @pseudo
 * @description Constructs a regular polygon. It needs two points which define the base line and the number of vertices, or a set of points.
 * @constructor
 * @name RegularPolygon
 * @type Polygon
 * @augments Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_Number} p1,p2,n The constructed regular polygon has n vertices and the base line defined by p1 and p2.
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 *
 * var pol = board.create('regularpolygon', [p1, p2, 5]);
 * </pre><div class="jxgbox" id="JXG682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [2.0, 1.0]),
 *       cc1 = board.create('regularpolygon', [p1, p2, 5]);
 *  })();
 * </script><pre>
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [4.0,4.0]);
 * var p3 = board.create('point', [2.0,0.0]);
 *
 * var pol = board.create('regularpolygon', [p1, p2, p3]);
 * </pre><div class="jxgbox" id="JXG096a78b3-bd50-4bac-b958-3be5e7df17ed" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('JXG096a78b3-bd50-4bac-b958-3be5e7df17ed', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [4.0, 4.0]),
 *       p3 = board.create('point', [2.0,0.0]),
 *       cc1 = board.create('regularpolygon', [p1, p2, p3]);
 * })();
 * </script><pre>
 *
 * @example
 *         // Line of reflection
 *         var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *         var reflect = board.create('transform', [li], {type: 'reflect'});
 *         var pol1 = board.create('polygon', [[-3,-2], [-1,-4], [-2,-0.5]]);
 *         var pol2 = board.create('polygon', [pol1, reflect]);
 *
 * </pre><div id="JXG58fc3078-d8d1-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG58fc3078-d8d1-11e7-93b3-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *             var reflect = board.create('transform', [li], {type: 'reflect'});
 *             var pol1 = board.create('polygon', [[-3,-2], [-1,-4], [-2,-0.5]]);
 *             var pol2 = board.create('polygon', [pol1, reflect]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createRegularPolygon = function (board, parents, attributes) {
    var el, i, n,
        p = [],
        rot, len,
        pointsExist,
        attr;

    len = parents.length;
    n = parents[len - 1];

    if (Type.isNumber(n) && (parents.length !== 3 || n < 3)) {
        throw new Error(
            "JSXGraph: A regular polygon needs two point types and a number > 2 as input."
        );
    }

    if (Type.isNumber(board.select(n))) {
        // Regular polygon given by 2 points and a number
        len--;
        pointsExist = false;
    } else {
        // Regular polygon given by n points
        n = len;
        pointsExist = true;
    }

    p = Type.providePoints(board, parents.slice(0, len), attributes, "regularpolygon", [
        "vertices"
    ]);
    if (p === false) {
        throw new Error(
            "JSXGraph: Can't create regular polygon with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, "regularpolygon", 'vertices');
    for (i = 2; i < n; i++) {
        rot = board.create("transform", [Math.PI * (2 - (n - 2) / n), p[i - 1]], {
            type: "rotate"
        });
        if (pointsExist) {
            p[i].addTransform(p[i - 2], rot);
            p[i].fullUpdate();
        } else {
            if (Type.isArray(attr.ids) && attr.ids.length >= n - 2) {
                attr.id = attr.ids[i - 2];
            }
            p[i] = board.create("point", [p[i - 2], rot], attr);
            p[i].type = Const.OBJECT_TYPE_CAS;

            // The next two lines of code are needed to make regular polygons draggable
            // The new helper points are set to be draggable.
            p[i].isDraggable = true;
            p[i].visProp.fixed = false;
        }
    }

    attr = Type.copyAttributes(attributes, board.options, 'regularpolygon');
    el = board.create("polygon", p, attr);
    el.elType = 'regularpolygon';

    return el;
};

/**
 * @class  A polygonal chain is a connected series of line segments (borders).
 * It is determined by
 * <ul>
 *    <li> a list of points or
 *    <li> a list of coordinate arrays or
 *    <li> a function returning a list of coordinate arrays.
 * </ul>
 * Each two consecutive points of the list define a line.
 * In JSXGraph, a polygonal chain is simply realized as polygon without the last - closing - point.
 * This may lead to unexpected results. Polygonal chains can be distinguished from polygons by the attribute 'elType' which
 * is 'polygonalchain' for the first and 'polygon' for the latter.
 * @pseudo
 * @constructor
 * @name PolygonalChain
 * @type Polygon
 * @augments JXG.Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array} vertices The polygon's vertices.
 *
 * Additionally, a polygonal chain can be created by providing a polygonal chain and a transformation (or an array of transformations).
 * The result is a polygonal chain which is the transformation of the supplied polygonal chain.
 *
 * @example
 *     var attr = {
 *             snapToGrid: true
 *         },
 *         p = [];
 *
 * 	p.push(board.create('point', [-4, 0], attr));
 * 	p.push(board.create('point', [-1, -3], attr));
 * 	p.push(board.create('point', [0, 2], attr));
 * 	p.push(board.create('point', [2, 1], attr));
 * 	p.push(board.create('point', [4, -2], attr));
 *
 *  var chain = board.create('polygonalchain', p, {borders: {strokeWidth: 3}});
 *
 * </pre><div id="JXG878f93d8-3e49-46cf-aca2-d3bb7d60c5ae" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG878f93d8-3e49-46cf-aca2-d3bb7d60c5ae',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *         var attr = {
 *                 snapToGrid: true
 *             },
 *             p = [];
 *
 *     	p.push(board.create('point', [-4, 0], attr));
 *     	p.push(board.create('point', [-1, -3], attr));
 *     	p.push(board.create('point', [0, 2], attr));
 *     	p.push(board.create('point', [2, 1], attr));
 *     	p.push(board.create('point', [4, -2], attr));
 *
 *         var chain = board.create('polygonalchain', p, {borders: {strokeWidth: 3}});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createPolygonalChain = function (board, parents, attributes) {
    var attr, el;

    attr = Type.copyAttributes(attributes, board.options, 'polygonalchain');
    el = board.create("polygon", parents, attr);
    el.elType = 'polygonalchain';

    // A polygonal chain is not necessarily closed.
    el.vertices.pop();
    board.removeObject(el.borders[el.borders.length - 1]);
    el.borders.pop();

    return el;
};

/**
 * @class A quadrilateral polygon with parallel opposite sides.
 * @pseudo
 * @description Constructs a parallelogram. As input, three points or coordinate arrays are expected.
 * @constructor
 * @name Parallelogram
 * @type Polygon
 * @augments Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,Array_JXG.Point,Array_JXG.Point,Array} p1,p2,p3 The parallelogram is a polygon through
 * the points [p1, p2, pp, p3], where pp is a parallelpoint, available as sub-object parallelogram.parallelPoint.
 *
 * @example
 * var p1 = board.create('point', [-3, -4]);
 * var p2 = board.create('point', [3, -1]);
 * var p3 = board.create('point', [-2, 0]);
 * var par = board.create('parallelogram', [p1, p2, p3], {
 *     hasInnerPoints: true,
 *     parallelpoint: {
 *         size: 6,
 *         face: '<<>>'
 *     }
 * });
 *
 * </pre><div id="JXG05ff162f-7cee-4fd2-bd90-3d9ee5b489cc" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG05ff162f-7cee-4fd2-bd90-3d9ee5b489cc',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p1 = board.create('point', [-3, -4]);
 *     var p2 = board.create('point', [3, -1]);
 *     var p3 = board.create('point', [-2, 0]);
 *     var par = board.create('parallelogram', [p1, p2, p3], {
 *         hasInnerPoints: true,
 *         parallelpoint: {
 *             size: 6,
 *             face: '<<>>'
 *         }
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 *
 */
JXG.createParallelogram = function (board, parents, attributes) {
    var el, pp,
        points = [],
        attr,
        attr_pp;

    points = Type.providePoints(board, parents, attributes, "polygon", ["vertices"]);
    if (points === false || points.length < 3) {
        throw new Error(
            "JSXGraph: Can't create parallelogram with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates."
        );
    }

    attr_pp = Type.copyAttributes(attributes, board.options, "parallelogram", 'parallelpoint');
    pp = board.create('parallelpoint', points, attr_pp);
    attr = Type.copyAttributes(attributes, board.options, 'parallelogram');
    el = board.create('polygon', [points[0], points[1], pp, points[2]], attr);

    el.elType = 'parallelogram';

    /**
     * Parallel point which makes the quadrilateral a parallelogram. Can also be accessed with
     * parallelogram.vertices[2].
     * @name Parallelogram#parallelPoint
     * @type {JXG.Point}
     */
    el.parallelPoint = pp;

    el.isDraggable = true;
    pp.isDraggable = true;
    pp.visProp.fixed = false;

    return el;
};

JXG.registerElement("polygon", JXG.createPolygon);
JXG.registerElement("regularpolygon", JXG.createRegularPolygon);
JXG.registerElement("polygonalchain", JXG.createPolygonalChain);
JXG.registerElement("parallelogram", JXG.createParallelogram);

export default JXG.Polygon;
// export default {
//     Polygon: JXG.Polygon,
//     createPolygon: JXG.createPolygon,
//     createRegularPolygon: JXG.createRegularPolygon
// };
