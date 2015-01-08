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


/*global JXG:true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 math/statistics
 utils/type
 base/element
  elements:
   segment
   transform
 */

define([
    'jxg', 'base/constants', 'base/coords', 'math/statistics', 'utils/type', 'base/element', 'base/line', 'base/transformation'
], function (JXG, Const, Coords, Statistics, Type, GeometryElement, Line, Transform) {

    "use strict";

    /**
     * Creates a new instance of JXG.Polygon.
     * @class Polygon stores all style and functional properties that are required
     * to draw and to interactact with a polygon.
     * @param {JXG.Board} board Reference to the board the polygon is to be drawn on.
     * @param {Array} vertices Unique identifiers for the points defining the polygon.
     * Last point must be first point. Otherwise, the first point will be added at the list.
     * @param {Object} attributes An object which contains properties as given in {@link JXG.Options.elements}
     * and {@link JXG.Options.polygon}.
     * @constructor
     * @extends JXG.GeometryElement
     */

    JXG.Polygon = function (board, vertices, attributes) {
        this.constructor(board, attributes, Const.OBJECT_TYPE_POLYGON, Const.OBJECT_CLASS_AREA);

        var i, vertex, l, len, j,
            attr_line = Type.copyAttributes(attributes, board.options, 'polygon', 'borders');

        this.withLines = attributes.withlines;
        this.attr_line = attr_line;

        /**
         * References to the points defining the polygon. The last vertex is the same as the first vertex.
         * @type Array
         */
        this.vertices = [];
        for (i = 0; i < vertices.length; i++) {
            vertex = this.board.select(vertices[i]);
            this.vertices[i] = vertex;
        }

        if (this.vertices[this.vertices.length - 1] !== this.vertices[0]) {
            this.vertices.push(this.vertices[0]);
        }

        /**
         * References to the border lines of the polygon.
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
                attr_line.strokecolor = (Type.isArray(attr_line.colors) && attr_line.colors[i % attr_line.colors.length]) || attr_line.strokecolor;
                attr_line.visible = Type.exists(attributes.borders.visible) ? attributes.borders.visible : attributes.visible;

                if (attr_line.strokecolor === false) {
                    attr_line.strokecolor = 'none';
                }

                l = board.create('segment', [this.vertices[i], this.vertices[i + 1]], attr_line);
                l.dump = false;
                this.borders[i] = l;
                l.parentPolygon = this;
            }
        }

        // Register polygon at board
        // This needs to be done BEFORE the points get this polygon added in their descendants list
        this.id = this.board.setId(this, 'Py');

        // Add polygon as child to defining points
        for (i = 0; i < this.vertices.length - 1; i++) {
            vertex = this.board.select(this.vertices[i]);
            vertex.addChild(this);
        }

        this.board.renderer.drawPolygon(this);
        this.board.finalizeAdding(this);
        this.elType = 'polygon';

        // create label
        this.createLabel();

        this.methodMap = JXG.deepCopy(this.methodMap, {
            borders: 'borders',
            vertices: 'vertices',
            A: 'Area',
            Area: 'Area',
            boundingBox: 'boundingBox',
            addPoints: 'addPoints',
            insertPoints: 'insertPoints',
            removePoints: 'removePoints'
        });
    };

    JXG.Polygon.prototype = new GeometryElement();

    JXG.extend(JXG.Polygon.prototype, /** @lends JXG.Polygon.prototype */ {
        /**
         * Checks whether (x,y) is near the polygon.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @return {Boolean} Returns true, if (x,y) is inside or at the boundary the polygon, otherwise false.
         */
        hasPoint: function (x, y) {

            var i, j, len, c = false;

            if (this.visProp.hasinnerpoints) {
                // All points of the polygon trigger hasPoint: inner and boundary points
                len = this.vertices.length;
                // See http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html for a reference
                for (i = 0, j = len - 2; i < len - 1; j = i++) {
                    if (((this.vertices[i].coords.scrCoords[2] > y) !== (this.vertices[j].coords.scrCoords[2] > y)) &&
                            (x < (this.vertices[j].coords.scrCoords[1] - this.vertices[i].coords.scrCoords[1]) * (y - this.vertices[i].coords.scrCoords[2]) /
                            (this.vertices[j].coords.scrCoords[2] - this.vertices[i].coords.scrCoords[2]) + this.vertices[i].coords.scrCoords[1])) {
                        c = !c;
                    }
                }
            } else {
                // Only boundary points trigger hasPoint
                len = this.borders.length;
                for (i = 0; i < len; i++) {
                    if (this.borders[i].hasPoint(x, y)) {
                        c = true;
                        break;
                    }
                }
            }

            return c;
        },

        /**
         * Uses the boards renderer to update the polygon.
         */
        updateRenderer: function () {
            if (this.needsUpdate && this.visProp.visible) {
                this.board.renderer.updatePolygon(this);
                this.needsUpdate = false;
            }

            if (this.hasLabel && this.label.visProp.visible) {
                this.label.update();
                this.board.renderer.updateText(this.label);
            }

            return this;
        },

        /**
         * return TextAnchor
         */
        getTextAnchor: function () {
            var a = this.vertices[0].X(),
                b = this.vertices[0].Y(),
                x = a,
                y = b,
                i;

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
            var copy = {}, er;

            copy.id = this.id + 'T' + this.numTraces;
            this.numTraces++;
            copy.vertices = this.vertices;
            copy.visProp = Type.deepCopy(this.visProp, this.visProp.traceattributes, true);
            copy.visProp.layer = this.board.options.layer.trace;
            copy.board = this.board;
            Type.clearVisPropOld(copy);

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

            this.visProp.visible = false;
            this.board.renderer.hide(this);

            if (!borderless) {
                for (i = 0; i < this.borders.length; i++) {
                    this.borders[i].hideElement();
                }
            }

            if (this.hasLabel && Type.exists(this.label)) {
                this.label.hiddenByParent = true;
                if (this.label.visProp.visible) {
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

            this.visProp.visible = true;
            this.board.renderer.show(this);

            if (!borderless) {
                for (i = 0; i < this.borders.length; i++) {
                    this.borders[i].showElement();
                    this.borders[i].updateRenderer();
                }
            }

            if (Type.exists(this.label) && this.hasLabel && this.label.hiddenByParent) {
                this.label.hiddenByParent = false;
                if (!this.label.visProp.visible) {
                    this.label.showElement().updateRenderer();
                }
            }
        },

        /**
         * Area of (not self-intersecting) polygon
         * @returns {Number} Area of (not self-intersecting) polygon
         */
        Area: function () {
            //Surveyor's Formula
            var i,
                area = 0;

            for (i = 0; i < this.vertices.length - 1; i++) {
                area += (this.vertices[i].X() * this.vertices[i + 1].Y() - this.vertices[i + 1].X() * this.vertices[i].Y());
            }
            area /= 2.0;

            return Math.abs(area);
        },

        /**
         * Bounding box of a polygon. The bounding box is an array of four numbers: the first two numbers
         * determine the upper left corner, the last two number determine the lower right corner of the bounding box.
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
            var box = [0, 0, 0, 0], i, v,
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

        /**
         * This method removes the SVG or VML nodes of the lines and the filled area from the renderer, to remove
         * the object completely you should use {@link JXG.Board#removeObject}.
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
         * @param {JXG.Point} p Arbitrary number of points
         * @returns {JXG.Polygon} Reference to the polygon
         */
        addPoints: function (p) {
            var args = Array.prototype.slice.call(arguments);

            return this.insertPoints.apply(this, [this.vertices.length - 2].concat(args));
        },

        /**
         * Adds more points to the vertex list of the polygon, starting with index <tt><i</tt>
         * @param {Number} idx The position where the new vertices are inserted, starting with 0.
         * @param {JXG.Point} p Arbitrary number of points to insert.
         * @returns {JXG.Polygon} Reference to the polygon object
         */
        insertPoints: function (idx, p) {
            var i, npoints = [], tmp;

            if (arguments.length === 0) {
                return this;
            }


            if (idx < 0 || idx > this.vertices.length - 2) {
                return this;
            }

            for (i = 1; i < arguments.length; i++) {
                if (Type.isPoint(arguments[i])) {
                    npoints.push(arguments[i]);
                }
            }

            tmp = this.vertices.slice(0, idx + 1).concat(npoints);
            this.vertices = tmp.concat(this.vertices.slice(idx + 1));

            if (this.withLines) {
                tmp = this.borders.slice(0, idx);
                this.board.removeObject(this.borders[idx]);

                for (i = 0; i < npoints.length; i++) {
                    tmp.push(this.board.create('segment', [this.vertices[idx + i], this.vertices[idx + i + 1]], this.attr_line));
                }

                tmp.push(this.board.create('segment', [this.vertices[idx + npoints.length], this.vertices[idx + npoints.length + 1]], this.attr_line));
                this.borders = tmp.concat(this.borders.slice(idx));
            }

            this.board.update();

            return this;
        },

        /**
         * Removes given set of vertices from the polygon
         * @param {JXG.Point} p Arbitrary number of vertices as {@link JXG.Point} elements or index numbers
         * @returns {JXG.Polygon} Reference to the polygon
         */
        removePoints: function (p) {
            var i, j, idx, nvertices = [], nborders = [],
                nidx = [], partition = [];

            // partition:
            // in order to keep the borders which could be recycled, we have to partition
            // the set of removed points. I.e. if the points 1, 2, 5, 6, 7, 10 are removed,
            // the partitions are
            //       1-2, 5-7, 10-10
            // this gives us the borders, that can be removed and the borders we have to create.


            // remove the last vertex which is identical to the first
            this.vertices = this.vertices.slice(0, this.vertices.length - 1);

            // collect all valid parameters as indices in nidx
            for (i = 0; i < arguments.length; i++) {
                if (Type.isPoint(arguments[i])) {
                    idx = this.findPoint(arguments[i]);
                }

                if (Type.isNumber(idx) && idx > -1 && idx < this.vertices.length && Type.indexOf(nidx, idx) === -1) {
                    nidx.push(idx);
                }
            }

            // sort the elements to be eliminated
            nidx = nidx.sort();
            nvertices = this.vertices.slice();
            nborders = this.borders.slice();

            // initialize the partition
            if (this.withLines) {
                partition.push([nidx[nidx.length - 1]]);
            }

            // run through all existing vertices and copy all remaining ones to nvertices
            // compute the partition
            for (i = nidx.length - 1; i > -1; i--) {
                nvertices[nidx[i]] = -1;

                if (this.withLines && (nidx[i] - 1 > nidx[i - 1])) {
                    partition[partition.length - 1][1] = nidx[i];
                    partition.push([nidx[i - 1]]);
                }
            }

            // finalize the partition computation
            if (this.withLines) {
                partition[partition.length - 1][1] = nidx[0];
            }

            // update vertices
            this.vertices = [];
            for (i = 0; i < nvertices.length; i++) {
                if (Type.isPoint(nvertices[i])) {
                    this.vertices.push(nvertices[i]);
                }
            }
            if (this.vertices[this.vertices.length - 1].id !== this.vertices[0].id) {
                this.vertices.push(this.vertices[0]);
            }

            // delete obsolete and create missing borders
            if (this.withLines) {
                for (i = 0; i < partition.length; i++) {
                    for (j = partition[i][1] - 1; j < partition[i][0] + 1; j++) {
                        // special cases
                        if (j < 0) {
                            // first vertex is removed, so the last border has to be removed, too
                            j = 0;
                            this.board.removeObject(this.borders[nborders.length - 1]);
                            nborders[nborders.length - 1] = -1;
                        } else if (j > nborders.length - 1) {
                            j = nborders.length - 1;
                        }

                        this.board.removeObject(this.borders[j]);
                        nborders[j] = -1;
                    }

                    // only create the new segment if it's not the closing border. the closing border is getting a special treatment at the end
                    // the if clause is newer than the min/max calls inside createSegment; i'm sure this makes the min/max calls obsolete, but
                    // just to be sure...
                    if (partition[i][1] !== 0 && partition[i][0] !== nvertices.length - 1) {
                        nborders[partition[i][0] - 1] = this.board.create('segment', [nvertices[Math.max(partition[i][1] - 1, 0)], nvertices[Math.min(partition[i][0] + 1, this.vertices.length - 1)]], this.attr_line);
                    }
                }

                this.borders = [];
                for (i = 0; i < nborders.length; i++) {
                    if (nborders[i] !== -1) {
                        this.borders.push(nborders[i]);
                    }
                }

                // if the first and/or the last vertex is removed, the closing border is created at the end.
                if (partition[0][1] === 5 || partition[partition.length - 1][1] === 0) {
                    this.borders.push(this.board.create('segment', [this.vertices[0], this.vertices[this.vertices.length - 2]], this.attr_line));
                }
            }

            this.board.update();

            return this;
        },

        getParents: function () {
            var p = [], i;

            for (i = 0; i < this.vertices.length; i++) {
                p.push(this.vertices[i].id);
            }
            return p;
        },

        getAttributes: function () {
            var attr = GeometryElement.prototype.getAttributes.call(this), i;

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
            var i;

            for (i = 0; i < this.vertices.length; i++) {
                this.vertices[i].snapToGrid();
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
            var dc, t, i, len,
                c = new Coords(method, coords, this.board),
                oldc = new Coords(method, oldcoords, this.board);

            len = this.vertices.length - 1;
            for (i = 0; i < len; i++) {
                if (!this.vertices[i].draggable()) {
                    return this;
                }
            }

            dc = Statistics.subtract(c.usrCoords, oldc.usrCoords);
            t = this.board.create('transform', dc.slice(1), {type: 'translate'});
            t.applyOnce(this.vertices.slice(0, -1));

            return this;
        }

    });


    /**
     * @class A polygon is an area enclosed by a set of border lines which are determined by 
     * <ul>
     *    <li> a list of points or 
     *    <li> a list of coordinate arrays or
     *    <li> a function returning a list of coordinate arrays.
     * </ul>
     * Each two consecutive points of the list define a line.
     * @pseudo
     * @constructor
     * @name Polygon
     * @type Polygon
     * @augments JXG.Polygon
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {Array} vertices The polygon's vertices. If the first and the last vertex don't match the first one will be
     * added to the array by the creator.
     * @example
     * var p1 = board.create('point', [0.0, 2.0]);
     * var p2 = board.create('point', [2.0, 1.0]);
     * var p3 = board.create('point', [4.0, 6.0]);
     * var p4 = board.create('point', [1.0, 4.0]);
     *
     * var pol = board.create('polygon', [p1, p2, p3, p4]);
     * </pre><div id="682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *  (function () {
     *   var board = JXG.JSXGraph.initBoard('682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [0.0, 2.0]),
     *       p2 = board.create('point', [2.0, 1.0]),
     *       p3 = board.create('point', [4.0, 6.0]),
     *       p4 = board.create('point', [1.0, 4.0]),
     *       cc1 = board.create('polygon', [p1, p2, p3, p4]);
     *  })();
     * </script><pre>
     *
     * @example
     * var p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [4.0, 6.0], [4.0, 6.0], [1.0, 3.0]];
     *
     * var pol = board.create('polygon', p, {hasInnerPoints: true});
     * </pre><div id="9f9a5946-112a-4768-99ca-f30792bcdefb" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *  (function () {
     *   var board = JXG.JSXGraph.initBoard('9f9a5946-112a-4768-99ca-f30792bcdefb', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
     *       p = [[0.0, 2.0], [2.0, 1.0], [4.0, 6.0], [4.0, 6.0], [4.0, 6.0], [1.0, 4.0]],
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
     *
     * </pre><div id="ceb09915-b783-44db-adff-7877ae3534c8" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *  (function () {
     *   var board = JXG.JSXGraph.initBoard('ceb09915-b783-44db-adff-7877ae3534c8', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
     *       f1 = function() { return [0.0, 2.0]; }, 
     *       f2 = function() { return [2.0, 1.0]; }, 
     *       f3 = function() { return [4.0, 6.0]; }, 
     *       f4 = function() { return [1.0, 4.0]; }, 
     *       cc1 = board.create('polygon', [f1, f2, f3, f4]);
     *  })();
     * </script><pre>
     */
    JXG.createPolygon = function (board, parents, attributes) {
        var el, i, points = [],
            attr, p;

        points = Type.providePoints(board, parents, attributes, 'polygon', ['vertices']);
        if (points === false) {
            throw new Error("JSXGraph: Can't create polygon with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates");
        }

        attr = Type.copyAttributes(attributes, board.options, 'polygon');
        el = new JXG.Polygon(board, points, attr);
        el.isDraggable = true;

        return el;
    };


    /**
     * @class Constructs a regular polygon. It needs two points which define the base line and the number of vertices.
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
     * </pre><div id="682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     *  (function () {
     *   var board = JXG.JSXGraph.initBoard('682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
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
     * </pre><div id="096a78b3-bd50-4bac-b958-3be5e7df17ed" style="width: 400px; height: 400px;"></div>
     * <script type="text/javascript">
     * (function () {
     *   var board = JXG.JSXGraph.initBoard('096a78b3-bd50-4bac-b958-3be5e7df17ed', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
     *       p1 = board.create('point', [0.0, 2.0]),
     *       p2 = board.create('point', [4.0, 4.0]),
     *       p3 = board.create('point', [2.0,0.0]),
     *       cc1 = board.create('regularpolygon', [p1, p2, p3]);
     * })();
     * </script><pre>
     */
    JXG.createRegularPolygon = function (board, parents, attributes) {
        var el, i, n,
            p = [], rot, c, len, pointsExist, attr;

        len = parents.length;
        n = parents[len - 1];

        if (Type.isNumber(n) && (parents.length !== 3 || n < 3)) {
            throw new Error("JSXGraph: A regular polygon needs two point types and a number > 2 as input.");
        }

        if (Type.isNumber(board.select(n))) { // Regular polygon given by 2 points and a number
            len--;
            pointsExist = false;
        } else {                              // Regular polygon given by n points
            n = len;
            pointsExist = true;
        }

        p = Type.providePoints(board, parents.slice(0, len), attributes, 'regularpolygon', ['vertices']);
        if (p === false) {
            throw new Error("JSXGraph: Can't create regular polygon with parent types other than 'point' and 'coordinate arrays' or a function returning an array of coordinates");
        }

        attr = Type.copyAttributes(attributes, board.options, 'regularpolygon', 'vertices');
        for (i = 2; i < n; i++) {
            rot = board.create('transform', [Math.PI * (2 - (n - 2) / n), p[i - 1]], {type: 'rotate'});
            if (pointsExist) {
                p[i].addTransform(p[i - 2], rot);
                p[i].prepareUpdate().update().updateRenderer();
            } else {
                if (Type.isArray(attr.ids) && attr.ids.length >= n - 2) {
                    attr.id = attr.ids[i - 2];
                }
                p[i] = board.create('point', [p[i - 2], rot], attr);
                p[i].type = Const.OBJECT_TYPE_CAS;

                // The next two lines of code are needed to make regular polgonmes draggable
                // The new helper points are set to be draggable.
                p[i].isDraggable = true;
                p[i].visProp.fixed = false;
            }
        }

        attr = Type.copyAttributes(attributes, board.options, 'polygon');
        el = board.create('polygon', p, attr);
        el.elType = 'regularpolygon';

        return el;
    };

    JXG.registerElement('polygon', JXG.createPolygon);
    JXG.registerElement('regularpolygon', JXG.createRegularPolygon);

    return {
        Polygon: JXG.Polygon,
        createPolygon: JXG.createPolygon,
        createRegularPolygon: JXG.createRegularPolygon
    };
});
