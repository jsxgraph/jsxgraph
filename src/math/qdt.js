/*
    Copyright 2008-2022
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

import Mat from "math/math";
import Type from "utils/type";

/**
 * Instantiate a new quad tree.
 *
 * @name JXG.Math.Quadtree
 * @exports Mat.Quadtree as JXG.Math.Quadtree
 * @param {Array} bbox Bounding box of the new quad (sub)tree.
 * @constructor
 */
Mat.Quadtree = function (bbox) {
  /**
   * The maximum number of points stored in a quad tree node
   * before it is subdivided.
   * @type Number
   * @default 10
   */
  this.capacity = 10;

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
     * Checks if the given coordinates are inside the quad tree.
     * @param {Number} x
     * @param {Number} y
     * @returns {Boolean}
     */
    contains: function (x, y) {
      return this.xlb < x && x <= this.xub && this.ylb < y && y <= this.yub;
    },

    /**
     * Insert a new point into this quad tree.
     * @param {JXG.Coords} p
     * @returns {Boolean}
     */
    insert: function (p) {
      if (!this.contains(p.usrCoords[1], p.usrCoords[2])) {
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

      return !!this.southWest.insert(p);
    },

    /**
     * Subdivide the quad tree.
     */
    subdivide: function () {
      var i,
        l = this.points.length,
        mx = this.xlb + (this.xub - this.xlb) / 2,
        my = this.ylb + (this.yub - this.ylb) / 2;

      this.northWest = new Mat.Quadtree([this.xlb, this.yub, mx, my]);
      this.northEast = new Mat.Quadtree([mx, this.yub, this.xub, my]);
      this.southEast = new Mat.Quadtree([this.xlb, my, mx, this.ylb]);
      this.southWest = new Mat.Quadtree([mx, my, this.xub, this.ylb]);

      for (i = 0; i < l; i += 1) {
        this.northWest.insert(this.points[i]);
        this.northEast.insert(this.points[i]);
        this.southEast.insert(this.points[i]);
        this.southWest.insert(this.points[i]);
      }
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
     * Retrieve the smallest quad tree that contains the given point.
     * @name JXG.Math.Quadtree#_query
     * @param {JXG.Coords|Number} xp
     * @param {Number} y
     * @returns {Boolean|JXG.Quadtree} The quad tree if the point is found, false
     * if none of the quad trees contains the point (i.e. the point is not inside
     * the root tree's AABB).
     * @private
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
  }
);

export default Mat.Quadtree;
