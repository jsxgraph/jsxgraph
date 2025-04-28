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

import Mat from "./math.js";
import Type from "../utils/type.js";

/**
 * Instantiate a new box quadtree.
 * A box quadtree stores AABBs, i.e. axis-aligned bounding boxes.
 * The box quadtree has four sub-quadtress which maybe null if not needed.
 *
 * @name JXG.Math.BoxQuadtree
 * @exports Mat.BoxQuadtree as JXG.Math.BoxQuadtree
 *
 * @param {Number} depth Maximum recursion depth.
 * @param {Number} capacity Maximum number of items stored in this node.
 * @param {Array} [bbox] Optional bounding box of the box quadtree. If not given, the bounding box is
 * determined by the items in the insert method. This will only work correctly if the first
 * call of insert contains the maximum bounding box.
 *
 * @constructor
 */
Mat.BoxQuadtree = function (depth, capacity, bbox) {
    var l, t, r, b;

    // console.log("---------------------------------------")
    depth--;

    /**
     * Maximum depth of the box quadtree node
     * @name JXG.Math.BoxQuadtree#depth
     * @type Number
     * @private
     */
    this.depth = depth;

    /**
     * Capacity of the box quadtree node
     * @name JXG.Math.BoxQuadtree#capacity
     * @type Number
     * @private
     */
    this.capacity = capacity;

    /**
     * Item storage.
     *
     * @name JXG.Math.BoxQuadtree#items
     * @type Array
     * @private
     */
    this.items = [];

    /**
     * In a subdivided quadtree this represents the top left subtree.
     * @name JXG.Math.BoxQuadtree#northWest
     * @type JXG.Math.BoxQuadtree
     * @private
     */
    this.northWest = null;

    /**
     * In a subdivided quadtree this represents the top right subtree.
     * @name JXG.Math.BoxQuadtree#northEast
     * @type JXG.Math.BoxQuadtree
     * @private
     */
    this.northEast = null;

    /**
     * In a subdivided quadtree this represents the bottom right subtree.
     * @name JXG.Math.BoxQuadtree#southEast
     * @type JXG.Math.BoxQuadtree
     * @private
     */
    this.southEast = null;

    /**
     * In a subdivided quadtree this represents the bottom left subtree.
     * @name JXG.Math.BoxQuadtree#southWest
     * @type JXG.Math.BoxQuadtree
     * @private
     */
    this.southWest = null;

    /**
     * Bounding box [left, top, right, bottom].
     *
     * @name JXG.Math.BoxQuadtree#bbox
     * @type Array
     * @private
     */
    this.bbox = null;

    /**
     * x-coordinate of bounding box center.
     *
     * @name JXG.Math.BoxQuadtree#cx
     * @type Number
     * @private
     */
    this.cx = null;

    /**
     * y-coordinate of bounding box center.
     *
     * @name JXG.Math.BoxQuadtree#cy
     * @type Number
     * @private
     */
    this.cy = null;

    if (bbox) {
        // Take supplied bounding box
        l = bbox[0];
        t = bbox[1];
        r = bbox[2];
        b = bbox[3];
        this.cx = (l + r) * 0.5;
        this.cy = (t + b) * 0.5;
        this.bbox = [l, t, r, b];
    }
};

Type.extend(
    Mat.BoxQuadtree.prototype,
    /** @lends JXG.Math.BoxQuadtree.prototype */ {

        /**
         * Insert an array of items into the box quadtree. An item is an object
         * containing at least the properties
         * <ul>
         *  <li> xlb: lower bound on x
         *  <li> xub: upper bound on x
         *  <li> ylb: lower bound on y
         *  <li> yub: upper bound on y
         * </ul>
         * which define the axis-aligned bounding box (AABB) of that item. Additionally,
         * more properties can be given.
         *
         * @param {Array} items to be inserted
         * @returns {Object} reference to the box quadtree
         */
        insert: function(items) {
            var i, le,
                l, t, r, b,
                it,
                nw_it = [],
                ne_it = [],
                sw_it = [],
                se_it = [],
                in_nw, in_ne, in_sw, in_se;


            if (this.bbox === null) {
                // Use bounding box of the supplied items
                le  = items.length;
                l = b = Infinity;
                r = t = -Infinity;
                for (i = 0; i < items.length; i++) {
                    it = items[i];
                    l = (it.xlb < l) ? it.xlb : l;
                    t = (it.yub > t) ? it.yub : t;
                    r = (it.xub > r) ? it.xub : r;
                    b = (it.ylb < b) ? it.ylb : b;
                }
                this.cx = (l + r) * 0.5;
                this.cy = (t + b) * 0.5;
                this.bbox = [l, t, r, b];
            } else {
                l = this.bbox[0];
                t = this.bbox[1];
                r = this.bbox[2];
                b = this.bbox[3];
            }

            if (this.depth === 0 || this.items.length + items.length < this.capacity) {
                // if (items.length + items.length < this.capacity) {
                //     console.log("Capacity sufficient, D=", this.depth, this.items.length, items.length);
                // }
                // if (depth === 0) {console.log("Max depth reached", items.length, this.capacity); }

                this.items = this.items.concat(items);
                return this;
            }

            le  = items.length;
            for (i = 0; i < le; i++) {
                it = items[i];
                in_nw = it.xlb <= this.cx && it.yub > this.cy;
                in_sw = it.xlb <= this.cx && it.ylb <= this.cy;
                in_ne = it.xub > this.cx && it.yub > this.cy;
                in_se = it.xub > this.cx && it.ylb <= this.cy;

                // If it overlaps all 4 quadrants then insert it at the current
                // depth, otherwise append it to a list to be inserted under every
                // quadrant that it overlaps.
                if (in_nw && in_ne && in_se && in_sw) {
                    this.items.push(it);
                } else {
                    if (in_nw) { nw_it.push(it); }
                    if (in_sw) { sw_it.push(it); }
                    if (in_ne) { ne_it.push(it); }
                    if (in_se) { se_it.push(it); }
                }
            }

            // Create the sub-quadrants, recursively.
            this.subdivide(nw_it, sw_it, ne_it, se_it, l, t, r, b);

            return this;
        },

        /**
         * Insert an item into the box quadtree, where an item is an object
         * containing at least the properties
         *
         * <ul>
         *  <li> xlb: lower bound on x
         *  <li> xub: upper bound on x
         *  <li> ylb: lower bound on y
         *  <li> yub: upper bound on y
         * </ul>
         * which define the axis-aligned bounding box (AABB) of that item. Additionally,
         * more properties can be given.
         *
         * @param {Object} it Item to be inserted
         * @returns {Object} reference to the box quadtree
         */
        insertItem: function(it) {
            var l, t, r, b,
                nw_it = [],
                ne_it = [],
                sw_it = [],
                se_it = [],
                in_nw, in_ne, in_sw, in_se;


            if (this.bbox === null) {
                // Use bounding box of the supplied items
                l = b = Infinity;
                r = t = -Infinity;

                l = (it.xlb < l) ? it.xlb : l;
                t = (it.yub > t) ? it.yub : t;
                r = (it.xub > r) ? it.xub : r;
                b = (it.ylb < b) ? it.ylb : b;

                this.cx = (l + r) * 0.5;
                this.cy = (t + b) * 0.5;
                this.bbox = [l, t, r, b];
            } else {
                l = this.bbox[0];
                t = this.bbox[1];
                r = this.bbox[2];
                b = this.bbox[3];
            }

            if (this.depth === 0 || this.items.length + 1 < this.capacity) {
                this.items.push(it);
                return this;
            }

            in_nw = it.xlb <= this.cx && it.yub > this.cy;
            in_sw = it.xlb <= this.cx && it.ylb <= this.cy;
            in_ne = it.xub > this.cx && it.yub > this.cy;
            in_se = it.xub > this.cx && it.ylb <= this.cy;

            // If it overlaps all 4 quadrants then insert it at the current
            // depth, otherwise append it to a list to be inserted under every
            // quadrant that it overlaps.
            if (in_nw && in_ne && in_se && in_sw) {
                this.items.push(it);
            } else {
                if (in_nw) { nw_it.push(it); }
                if (in_sw) { sw_it.push(it); }
                if (in_ne) { ne_it.push(it); }
                if (in_se) { se_it.push(it); }
            }

            // Create the sub-quadrants, recursively.
            this.subdivide(nw_it, sw_it, ne_it, se_it, l, t, r, b);

            return this;
        },

        /**
         * Create the sub-quadrants if necessary, recursively
         * @param {Array} nw_it list of items for northWest subtree
         * @param {Array} sw_it list of items for southWest subtree
         * @param {Array} ne_it list of items for northEast subtree
         * @param {Array} se_it list of items for southEast subtree
         * @param {Number} l bounding box left
         * @param {Number} t bounding box top
         * @param {Number} r bounding box right
         * @param {Number} b bounding box bottom
         * @returns {Object} reference to the box quadtree
         * @private
         */
        subdivide: function(nw_it, sw_it, ne_it, se_it, l, t, r, b) {
            if (nw_it.length > 0) {
                if (this.northWest === null) {
                    this.northWest = new JXG.Math.BoxQuadtree(this.depth, this.capacity, [l, t, this.cx, this.cy]);
                }
                this.northWest.insert(nw_it);
            }
            if (sw_it.length > 0) {
                if (this.southWest === null) {
                    this.southWest = new JXG.Math.BoxQuadtree(this.depth, this.capacity, [l, this.cy, this.cx, b]);
                }
                this.southWest.insert(sw_it);
            }
            if (ne_it.length > 0) {
                if (this.northEast === null) {
                    this.northEast = new JXG.Math.BoxQuadtree(this.depth, this.capacity, [this.cx, t, r, this.cy]);
                }
                this.northEast.insert(ne_it);
            }
            if (se_it.length > 0) {
                if (this.southEast === null) {
                    this.southEast = new JXG.Math.BoxQuadtree(this.depth, this.capacity, [this.cx, this.cy, r, b]);
                }
                this.southEast.insert(se_it);
            }

            return this;
        },

        /**
         * Find all entries of the box quadtree which have an overlap
         * with the given rectangle (AABB). Items may appear multiple times.
         *
         * @param {Array} box AABB of the form [l, t, r, b]
         * @returns {Array} list of items overlapping with box
         */
        find: function(box) {
            var overlaps = function(item) {
                    return box[2] >= item.xlb && box[0] <= item.xub &&
                        box[3] <= item.yub && box[1] >= item.ylb;
                },
                hits = [],
                i, le;

            le = this.items.length;
            for (i = 0; i < le; i++) {
                if (overlaps(this.items[i])) {
                    hits.push(this.items[i]);
                }
            }

            if (this.northWest !== null && box[0] <= this.cx & box[1] >= this.cy) {
                Type.concat(hits, this.northWest.find(box));
            }
            if (this.southWest !== null && box[0] <= this.cx & box[3] <= this.cy) {
                Type.concat(hits, this.southWest.find(box));
            }
            if (this.northEast !== null && box[2] >= this.cx & box[1] >= this.cy) {
                Type.concat(hits, this.northEast.find(box));
            }
            if (this.southEast !== null && box[2] >= this.cx & box[3] <= this.cy) {
                Type.concat(hits, this.southEast.find(box));
            }

            return hits;
        },

        /**
         * Analyze the box quadtree.
         *
         * @returns {Object} data about the box quadtree
         */
        analyzeTree: function() {
            var stats = {
                    number_items: this.items.length,
                    depth: 1
                }, tmp;

            if (this.northWest !== null) {
                tmp = this.northWest.analyzeTree();
                stats.number_items += tmp.number_items;
                stats.depth = Math.max(stats.depth, 1 + tmp.depth);
            }
            if (this.southWest !== null) {
                tmp = this.southWest.analyzeTree();
                stats.number_items += tmp.number_items;
                stats.depth = Math.max(stats.depth, 1 + tmp.depth);
            }
            if (this.northEast !== null) {
                tmp = this.northEast.analyzeTree();
                stats.number_items += tmp.number_items;
                stats.depth = Math.max(stats.depth, 1 + tmp.depth);
            }
            if (this.southEast !== null) {
                tmp = this.southEast.analyzeTree();
                stats.number_items += tmp.number_items;
                stats.depth = Math.max(stats.depth, 1 + tmp.depth);
            }

            return stats;
        },

        /**
         * Generate data to plot the box quadtree as curve using updateDataArray.
         *
         * @returns {Array} containing arrays dataX and dataY
         *
         * @example
         *
         * // qdt contains a BoxQuadtree
         *
         * var qdtcurve = board.create('curve', [[], []], { strokeWidth: 1, strokeColor: '#0000ff', strokeOpacity: 0.3 });
         * qdtcurve.updateDataArray = function () {
         *    var ret = qdt.plot();
         *
         *    this.dataX = ret[0];
         *    this.dataY = ret[1];
         *    console.log(qdt.analyzeTree());
         * };
         * board.update();
         */
        plot: function () {
            var dataX = [],
                dataY = [],
                ret;

            dataX.push(this.bbox[0]); dataY.push(this.bbox[3]);
            dataX.push(this.bbox[2]); dataY.push(this.bbox[3]);
            dataX.push(this.bbox[2]); dataY.push(this.bbox[1]);
            dataX.push(this.bbox[0]); dataY.push(this.bbox[1]);
            dataX.push(this.bbox[0]); dataY.push(this.bbox[3]);
            dataX.push(NaN); dataY.push(NaN);

            if (this.northWest !== null) {
                ret = this.northWest.plot();
                Type.concat(dataX, ret[0]);
                Type.concat(dataY, ret[1]);
            }

            if (this.northEast !== null) {
                ret = this.northEast.plot();
                Type.concat(dataX, ret[0]);
                Type.concat(dataY, ret[1]);
            }

            if (this.southEast !== null) {
                ret = this.southEast.plot();
                Type.concat(dataX, ret[0]);
                Type.concat(dataY, ret[1]);
            }

            if (this.southWest !== null) {
                ret = this.southWest.plot();
                Type.concat(dataX, ret[0]);
                Type.concat(dataY, ret[1]);
            }

            return [dataX, dataY];
        }
    }
);

export default Mat.BoxQuadtree;
