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
 * Heap
 */
Mat.Heap = function () {
    this.pq = [];
    this.N = 0;
};

/**
 * public
 */
Mat.Heap.prototype.empty = function () {
    this.pq = [];
    this.N = 0;
};

Mat.Heap.prototype.insert = function (node) {
    this.pq[this.N] = node;
    this.N++;
    this.fixUp(this.N);
};

Mat.Heap.prototype.delmax = function () {
    this.exchange(0, this.N - 1);
    this.fixDown(0, this.N - 1);
    this.N--;

    return this.pq[this.N];
};

/**
 * private
 */
Mat.Heap.prototype.fixUp = function (k) {
    var i = k - 1;

    while (i > 0 && this.pq[Math.floor(i / 2)].v < this.pq[i].v) {
        this.exchange(Math.floor(i / 2), i);
        i = Math.floor(i / 2);
    }
};

Mat.Heap.prototype.fixDown = function (k, N) {
    var j,
        i = k;
    while (2 * i < N) {
        j = 2 * i;

        if (j < N && this.pq[j].v < this.pq[j + 1].v) {
            j++;
        }

        if (this.pq[i].v >= this.pq[j].v) {
            break;
        }

        this.exchange(i, j);
        i = j;
    }
};

Mat.Heap.prototype.exchange = function (i, j) {
    var t = this.pq[i];
    this.pq[i] = this.pq[j];
    this.pq[j] = t;
};

export default Mat.Heap;
