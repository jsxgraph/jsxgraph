/*
    Copyright 2008-2013
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
 math/math
 utils/type
 */

define(['math/math', 'utils/type'], function (Mat, Type) {

    "use strict";

    var
        /**
         * A simple point class in the 2D plane, possibly faster than using JXG.Coords.
         * @param {Number|JXG.Coords|XY} xp
         * @param {Number} [y]
         * @constructor
         */
        XY = function (xp, y) {
            /**
             * Used to quickly identify XY instances.
             * @type {boolean}
             * @default true
             */
            this.isXY = true;

            if (xp.isXY) {
                return xp;
            }

            if (Type.exists(y)) {
                /**
                 * X coordinate
                 * @type {Number}
                 */
                this.x = xp;

                /**
                 * Y coordinate
                 * @type {Number}
                 */
                this.y = y;
            } else {
                this.x = xp.usrCoords[1];
                this.y = xp.usrCoords[2];
            }
        },

        /**
         * Axis aligned bounding box represented by its center and half dimension.
         * @param {XY} center
         * @param {XY} halfdim
         * @constructor
         */
        AABB = function (center, halfdim) {
            /**
             * Used to quickly identify AABB instances.
             * @type {boolean}
             * @default true
             */
            this.isAABB = true;

            /**
             * Center
             * @type {XY}
             */
            this.c = center;

            /**
             * Half dimension
             * @type {XY}
             */
            this.hd = halfdim;
        },

        /**
         * Instantiate a new quad tree.
         * @param {AABB|Array} bbox Bounding box of the new. Can be either given as an array
         * or an instance of the AABB class.
         * @constructor
         */
        Quadtree = function (bbox) {
            var w, h, aabb;

            if (bbox.isAABB) {
                aabb = bbox;
            } else {
                w = (bbox[2] - bbox[0]) / 2;
                h = (bbox[1] - bbox[3]) / 2;
                aabb = new AABB(
                    new XY(bbox[0] + w, bbox[3] + h),
                    new XY(w, h)
                );
            }

            /**
             * The maximum number of points stored in a quad tree node
             * before it is subdivided.
             * @type {Number}
             * @default 10
             */
            this.capacity = 10;

            /**
             * Point storage.
             * @type {Array}
             */
            this.points = [];

            /**
             * The bounding box the quad tree represents.
             * @type {AABB}
             */
            this.boundary = aabb;

            /**
             * In a subdivided quad tree this represents the top left subtree.
             * @type {JXG.Quadtree}
             */
            this.northWest = null;

            /**
             * In a subdivided quad tree this represents the top right subtree.
             * @type {JXG.Quadtree}
             */
            this.northEast = null;

            /**
             * In a subdivided quad tree this represents the bottom right subtree.
             * @type {JXG.Quadtree}
             */
            this.southEast = null;

            /**
             * In a subdivided quad tree this represents the bottom left subtree.
             * @type {JXG.Quadtree}
             */
            this.southWest = null;
        };

    Type.extend(AABB.prototype, /** @lends AABB.prototype */ {
        /**
         * Check if the given point is inside this AABB.
         * @param {XY} p
         * @returns {Boolean}
         */
        contains: function (p) {
            var w = this.hd.x,
                h = this.hd.y,
                x = this.c.x,
                y = this.c.y;

            return (x - w) < p.x && p.x <= (x + w) && (y - h) <= p.y && p.y < (y + h);
        }
    });

    Type.extend(Quadtree.prototype, /** @lends JXG.Quadtree.prototype */ {
        /**
         * Insert a new point into this quad tree.
         * @param {JXG.Coords} p
         * @returns {Boolean}
         */
        insert: function (p) {
            var _p = new XY(p);

            if (!this.boundary.contains(_p)) {
                return false;
            }

            if (this.points.length < this.capacity) {
                this.points.push(p);
                return true;
            }

            if (this.northWest === null) {
                this.subdivide();
            }

            if (this.northWest.insert(p)) {
                return true;
            }

            if (this.northEast.insert(p)) {
                return true;
            }

            if (this.southEast.insert(p)) {
                return true;
            }

            if (this.southWest.insert(p)) {
                return true;
            }

            return false;
        },

        /**
         * Subdivide the quad tree.
         */
        subdivide: function () {
            var i,
                x = this.boundary.c.x,
                y = this.boundary.c.y,
                w2 = this.boundary.hd.x / 2,
                h2 = this.boundary.hd.y / 2,
                nhd = new XY(w2, h2);

            this.northWest = new Quadtree(new AABB(new XY(x - w2, y - h2), nhd));
            this.northEast = new Quadtree(new AABB(new XY(x + w2, y - h2), nhd));
            this.southEast = new Quadtree(new AABB(new XY(x + w2, y + h2), nhd));
            this.southWest = new Quadtree(new AABB(new XY(x - w2, y + h2), nhd));

            for (i = 0; i < this.points.length; i += 1) {
                this.northWest.insert(this.points[i]);
                this.northEast.insert(this.points[i]);
                this.southEast.insert(this.points[i]);
                this.southWest.insert(this.points[i]);
            }
        },

        /**
         * Internal _query method that lacks adjustment of the parameter.
         * @param {XY} p
         * @returns {Boolean|JXG.Quadtree} The quad tree if the point is found, false
         * if none of the quad trees contains the point (i.e. the point is not inside
         * the root tree's AABB).
         * @private
         */
        _query: function (p) {
            var r;

            if (this.boundary.contains(p)) {
                if (this.northWest === null) {
                    return this;
                }

                r = this.northWest._query(p);
                if (r) {
                    return r;
                }

                r = this.northEast._query(p);
                if (r) {
                    return r;
                }

                r = this.southEast._query(p);
                if (r) {
                    return r;
                }

                r = this.southWest._query(p);
                if (r) {
                    return r;
                }
            }

            return false;
        },

        /**
         * Retrieve the smallest quad tree that contains the given point.
         * @param {XY|JXG.Coords|Number} xp
         * @param {Number} y
         * @returns {Boolean|JXG.Quadtree} The quad tree if the point is found, false
         * if none of the quad trees contains the point (i.e. the point is not inside
         * the root tree's AABB).
         * @private
         */
        query: function (xp, y) {
            var r,
                _p = new XY(xp, y);

            return this._query(_p);
        }
    });

    Mat.Quadtree = Quadtree;

    return Quadtree;
});
