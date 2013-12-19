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
         *
         * @param xp
         * @param y
         * @constructor
         */
        XY = function (xp, y) {
            if (Type.exists(y)) {
                this.x = xp;
                this.y = y;
            } else {
                this.x = xp.usrCoords[1];
                this.y = xp.usrCoords[2];
            }
        },

        /**
         *
         * @param center
         * @param halfdim
         * @constructor
         */
        AABB = function (center, halfdim) {
            this.center = center;
            this.halfdim = halfdim;
        },

        Quadtree = function (bbox) {
            var w, h, aabb;

            if (bbox.center) {
                aabb = bbox;
            } else {
                w = (bbox[2] - bbox[0]) / 2;
                h = (bbox[1] - bbox[3]) / 2;
                aabb = new AABB(
                    new XY(bbox[0] + w, bbox[3] + h),
                    new XY(w, h)
                );
            }
            this.capacity = 10;
            this.points = [];
            this.boundary = aabb;

            this.northWest = null;
            this.northEast = null;
            this.southEast = null;
            this.southWest = null;
        };

    Type.extend(AABB.prototype, {
        contains: function (p) {
            var _p = new XY(p),
                w = this.halfdim.x,
                h = this.halfdim.y,
                x = this.center.x,
                y = this.center.y;

            return (x - w) < _p.x && _p.x <= (x + w) && (y - h) <= _p.y && _p.y < (y + h);
        }
    });

    Type.extend(Quadtree.prototype, {
        insert: function (p) {
            if (!this.boundary.contains(p)) {
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

        subdivide: function () {
            var i,
                x = this.boundary.center.x,
                y = this.boundary.center.y,
                w2 = this.boundary.halfdim.x / 2,
                h2 = this.boundary.halfdim.y / 2,
                nhalfdim = new XY(w2, h2);

            this.northWest = new Quadtree(new AABB(new XY(x - w2, y - h2), nhalfdim));
            this.northEast = new Quadtree(new AABB(new XY(x + w2, y - h2), nhalfdim));
            this.southEast = new Quadtree(new AABB(new XY(x + w2, y + h2), nhalfdim));
            this.southWest = new Quadtree(new AABB(new XY(x - w2, y + h2), nhalfdim));

            for (i = 0; i < this.points.length; i += 1) {
                this.northWest.insert(this.points[i]);
                this.northEast.insert(this.points[i]);
                this.southEast.insert(this.points[i]);
                this.southWest.insert(this.points[i]);
            }
        },

        query: function (p) {
            var r,
                _p = new XY(p);

            if (this.boundary.contains(p)) {
                if (this.northWest === null) {
                    return this;
                }

                r = this.northWest.query(p);
                if (r) {
                    return r;
                }

                r = this.northEast.query(p);
                if (r) {
                    return r;
                }

                r = this.southEast.query(p);
                if (r) {
                    return r;
                }

                r = this.southWest.query(p);
                if (r) {
                    return r;
                }
            }

            return false;
        }
    });

    Mat.Quadtree = Quadtree;

    return Quadtree;
});
