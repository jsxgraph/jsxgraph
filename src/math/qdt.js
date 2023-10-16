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
import Geometry from "./geometry";
import Type from "../utils/type";

/**
 * Instantiate a new quad tree.
 *
 * @name JXG.Math.Quadtree
 * @exports Mat.Quadtree as JXG.Math.Quadtree
 * @param {Array} bbox Bounding box of the new quad (sub)tree.
 * @param {Object} config Configuration object. Default value: to {capacity: 10}
 *
 * @constructor
 */
Mat.Quadtree = function (bbox, config, parent) {
    config = config || {
        capacity: 10,
        pointType: 'coords'
    };

    this.config = {};
    /**
     * The maximum number of points stored in a quad tree node
     * before it is subdivided.
     * @type Number
     * @default 10
     */
    this.config.capacity = config.capacity || 10;

    /**
     * Type of a point object. Possible values are:
     * 'coords', 'object'.
     * @type String
     * @default 'coords'
     */
    this.config.pointType = config.pointType || 'coords';

    /**
     * Point storage.
     * @name JXG.Math.Quadtree#points
     * @type Array
     */
    this.points = [];

    this.xlb = bbox[0];
    this.xub = bbox[2];
    this.ylb = bbox[3];
    this.yub = bbox[1];

    /**
     * Parent quad tree or null if there is not parent.
     *
     * @name JXG.Math.Quadtree#northWest
     * @type JXG.Math.Quadtree
     *
     */
    this.parent = parent || null;

    /**
     * In a subdivided quad tree this represents the top left subtree.
     * @name JXG.Math.Quadtree#northWest
     * @type JXG.Math.Quadtree
     */
    this.northWest = null;

    /**
     * In a subdivided quad tree this represents the top right subtree.
     * @name JXG.Math.Quadtree#northEast
     * @type JXG.Math.Quadtree
     */
    this.northEast = null;

    /**
     * In a subdivided quad tree this represents the bottom right subtree.
     * @name JXG.Math.Quadtree#southEast
     * @type JXG.Math.Quadtree
     */
    this.southEast = null;

    /**
     * In a subdivided quad tree this represents the bottom left subtree.
     * @name JXG.Math.Quadtree#southWest
     * @type JXG.Math.Quadtree
     */
    this.southWest = null;

};

Type.extend(
    Mat.Quadtree.prototype,
    /** @lends JXG.Math.Quadtree.prototype */ {
        /**
         * Checks if the given coordinates are inside of the boundaries of the quad tree.
         * The quad tree is open to the left and botton and closed to
         * right and top.
         * 
         * @param {Number} x
         * @param {Number} y
         * @returns {Boolean}
         */
        contains: function (x, y) {
            return this.xlb < x && x <= this.xub && this.ylb < y && y <= this.yub;
        },

        /**
         * Insert a new point into this quad tree if it is inside of 
         * the quad tree's boundaries.
         *
         * @param {JXG.Coords} p
         * @returns {Boolean} true if insert succeeded, false otherwise.
         */
        insert: function (p) {
            switch (this.config.pointType) {
                case 'coords':
                    if (!this.contains(p.usrCoords[1], p.usrCoords[2])) {
                        return false;
                    }
                    break;
                case 'object':
                    if (!this.contains(p.x, p.y)) {
                        return false;
                    }
                    break;
            }

            if (this.points.length < this.config.capacity && this.northWest === null) {
                this.points.push(p);
                return true;
            }

            // At this point the point has to be inserted into a subtree.
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

            return !!this.southWest.insert(p);
        },

        /**
         * Subdivide the quad tree.
         */
        subdivide: function () {
            var i,
                le = this.points.length,
                mx = this.xlb + (this.xub - this.xlb) * 0.5,
                my = this.ylb + (this.yub - this.ylb) * 0.5;

            this.northWest = new Mat.Quadtree([this.xlb, this.yub, mx, my], this.config, this);
            this.northEast = new Mat.Quadtree([mx, this.yub, this.xub, my], this.config, this);
            this.southEast = new Mat.Quadtree([this.xlb, my, mx, this.ylb], this.config, this);
            this.southWest = new Mat.Quadtree([mx, my, this.xub, this.ylb], this.config, this);

            // for (i = 0; i < le; i++) {
            //     if (this.northWest.insert(this.points[i])) { continue; }
            //     if (this.northEast.insert(this.points[i])) { continue; }
            //     if (this.southEast.insert(this.points[i])) { continue; }
            //     this.southWest.insert(this.points[i]);
            // }
        },

        /**
         * Internal _query method that lacks adjustment of the parameter.
         * @name JXG.Math.Quadtree#_query
         * @param {Number} x
         * @param {Number} y
         * @returns {Boolean|JXG.Quadtree} The quad tree if the point is found, false
         * if none of the quad trees contains the point (i.e. the point is not inside
         * the root tree's AABB).
         * @private
         */
        _query: function (x, y) {
            var r;

            if (this.contains(x, y)) {
                if (this.northWest === null) {
                    return this;
                }

                r = this.northWest._query(x, y);
                if (r) {
                    return r;
                }

                r = this.northEast._query(x, y);
                if (r) {
                    return r;
                }

                r = this.southEast._query(x, y);
                if (r) {
                    return r;
                }

                r = this.southWest._query(x, y);
                if (r) {
                    return r;
                }
            }

            return false;
        },

        /**
         * Retrieve the smallest quad tree that contains the given coordinate pair.
         * @name JXG.Math.Quadtree#_query
         * @param {JXG.Coords|Number} xp
         * @param {Number} y
         * @returns {Boolean|JXG.Quadtree} The quad tree if the point is found, false
         * if none of the quad trees contains the point (i.e. the point is not inside
         * the root tree's AABB).
         */
        query: function (xp, y) {
            var _x, _y;

            if (Type.exists(y)) {
                _x = xp;
                _y = y;
            } else {
                _x = xp.usrCoords[1];
                _y = xp.usrCoords[2];
            }

            return this._query(_x, _y);
        },

        /**
         * Check if the quad tree has a point which is inside of a sphere of 
         * radius tol around [x, y].
         * @param {Number} x
         * @param {Number} y
         * @param {Number} tol
         * @returns {Boolean}
         */
        hasPoint: function (x, y, tol) {
            var r, i, le;

            if (this.contains(x, y)) {
                le = this.points.length;

                switch (this.config.pointType) {
                    case 'coords':
                        for (i = 0; i < le; i++) {
                            if (Geometry.distance([x, y], this.points[i].usrCoords.slice(1), 2) < tol) {
                                return true;
                            }
                        }
                        break;
                    case 'object':
                        for (i = 0; i < le; i++) {
                            if (Geometry.distance([x, y], [this.points[i].x, this.points[i].y], 2) < tol) {
                                return true;
                            }
                        }
                        break;
               }


                if (this.northWest === null) {
                    return false;
                }

                r = this.northWest.hasPoint(x, y, tol);
                if (r) {
                    return r;
                }

                r = this.northEast.hasPoint(x, y, tol);
                if (r) {
                    return r;
                }

                r = this.southEast.hasPoint(x, y, tol);
                if (r) {
                    return r;
                }

                r = this.southWest.hasPoint(x, y, tol);
                if (r) {
                    return r;
                }
            }

            return false;
        },

        /**
         *
         * @returns {Array}
         */
        getAllPoints: function() {
            var pointsList = [];
            this.getAllPointsRecursive(pointsList);
            return pointsList;
        },

        /**
         *
         * @param {Array} pointsList
         * @private
         */
        getAllPointsRecursive(pointsList) {
            Array.prototype.push.apply(pointsList, this.points.slice());

            if (this.northWest === null) {
                return;
            }

            this.northWest.getAllPointsRecursive(pointsList);
            this.northEast.getAllPointsRecursive(pointsList);
            this.southEast.getAllPointsRecursive(pointsList);
            this.southWest.getAllPointsRecursive(pointsList);
        }

    }
);

export default Mat.Quadtree;
