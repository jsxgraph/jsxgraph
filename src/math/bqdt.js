/*
    Copyright 2008-2023
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

import Mat from "./math";
import Type from "../utils/type";

/**
 * Instantiate a new quad tree.
 *
 * @name JXG.Math.BoxQuadtree
 * @exports Mat.BoxQuadtree as JXG.Math.BoxQuadtree
 *
 * @constructor
 */
Mat.BoxQuadtree = function (items, depth, capacity, bbox) {
    var l, t, r, b, i, le,
        nw_it = [],
        ne_it = [],
        sw_it = [],
        se_it = [],
        in_nw, in_ne, in_sw, in_se, it;

    // console.log("---------------------------------------")
    depth--;

    /**
     * Item storage.
     *
     * @nam JXG.Math.BoxQuadtree#items
     * @type Array
     */
    this.items = [];

    /**
     * In a subdivided quad tree this represents the top left subtree.
     * @name JXG.Math.BoxQuadtree#northWest
     * @type JXG.Math.BoxQuadtree
     */
    this.northWest = null;

    /**
     * In a subdivided quad tree this represents the top right subtree.
     * @name JXG.Math.BoxQuadtree#northEast
     * @type JXG.Math.BoxQuadtree
     */
    this.northEast = null;

    /**
     * In a subdivided quad tree this represents the bottom right subtree.
     * @name JXG.Math.BoxQuadtree#southEast
     * @type JXG.Math.BoxQuadtree
     */
    this.southEast = null;

    /**
     * In a subdivided quad tree this represents the bottom left subtree.
     * @name JXG.Math.BoxQuadtree#southWest
     * @type JXG.Math.BoxQuadtree
     */
    this.southWest = null;

    if (bbox) {
        // Take supplied bounding box
        l = bbox[0];
        t = bbox[1];
        r = bbox[2];
        b = bbox[3];
    } else {
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
    }

    /**
     * x-coordinate of bounding box center.
     *
     * @name JXG.Math.BoxQuadtree#cx
     * @type Number
     */
    this.cx = (l + r) * 0.5;
    /**
     * y-coordinate of bounding box center.
     *
     * @name JXG.Math.BoxQuadtree#cy
     * @type Number
     */
    this.cy = (t + b) * 0.5;
    this.bbox = [l, t, r, b];

    // console.log("D", depth, [this.cx, this.cy], this.bbox)

    if (depth === 0 || items.length < capacity) {
        // if (items.length < capacity) {console.log("Capacity sufficient, D=", depth); }
        // if (depth === 0) {console.log("Max depth reached", items.length, capacity); }
        this.items = items;
        return;
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
    // console.log("In IT", this.items)

    // Create the sub-quadrants, recursively.
    if (nw_it.length > 0) {
        // console.log("Put to NW", nw_it)
        this.northWest = new JXG.Math.BoxQuadtree(nw_it, depth, capacity, [l, t, this.cx, this.cy]);
    }
    if (sw_it.length > 0) {
        // console.log("Put to SW", sw_it)
        this.southWest = new JXG.Math.BoxQuadtree(sw_it, depth, capacity, [l, this.cy, this.cx, b]);
    }
    if (ne_it.length > 0) {
        // console.log("Put to NE", ne_it)
        this.northEast = new JXG.Math.BoxQuadtree(ne_it, depth, capacity, [this.cx, t, r, this.cy]);
    }
    if (se_it.length > 0) {
        // console.log("Put to SE", se_it)
        this.southEast = new JXG.Math.BoxQuadtree(se_it, depth, capacity, [this.cx, this.cy, r, b]);
    }

};

Type.extend(
    Mat.BoxQuadtree.prototype,
    /** @lends JXG.Math.BoxQuadtree.prototype */ {

        hit: function(box) {
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
                hits = hits.concat(this.northWest.hit(box));
            }
            if (this.southWest !== null && box[0] <= this.cx & box[3] <= this.cy) {
                hits = hits.concat(this.southWest.hit(box));
            }
            if (this.northEast !== null && box[2] >= this.cx & box[1] >= this.cy) {
                hits = hits.concat(this.northEast.hit(box));
            }
            if (this.southEast !== null && box[2] >= this.cx & box[3] <= this.cy) {
                hits = hits.concat(this.southEast.hit(box));
            }

            return hits;
        }
    }
);

export default Mat.BoxQuadtree;
