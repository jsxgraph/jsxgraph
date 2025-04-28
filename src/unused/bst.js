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
 * Balanced binary search tree
 */
Mat.BST = function () {
    this.head = null;
    this.z = null;
    this.randomized = true;
};

/**
 * public
 */
Mat.BST.prototype.newNode = function (it, le, ri, n) {
    return {
        item: it,
        l: le,
        r: ri,
        N: n
    };
};

Mat.BST.prototype.init = function (random) {
    this.z = this.newNode(null, 0, 0, 0);
    this.head = this.z;

    if (Type.exists(random)) {
        this.randomized = random;
    }
};

Mat.BST.prototype.count = function () {
    return this.head.N;
};

Mat.BST.prototype.search = function (val) {
    return this.searchR(this.head, val);
};

Mat.BST.prototype.insert = function (item) {
    if (this.randomized) {
        this.head = this.insertRandR(this.head, item);
    } else {
        this.head = this.insertR(this.head, item);
    }
};

Mat.BST.prototype.traverse = function (h, visit) {
    if (this.isNil(h)) {
        return;
    }
    visit(h);
    this.traverse(h.l, visit);
    this.traverse(h.r, visit);
};

Mat.BST.prototype.insertHead = function (item) {
    this.head = this.insertT(this.head, item);
};

Mat.BST.prototype.deleteNode = function (v) {
    this.head = this.deleteR(this.head, v);
};

Mat.BST.prototype.join = function (a, b) {
    if (this.isNil(b)) {
        return a;
    }

    if (this.isNil(a)) {
        return b;
    }

    b = this.insertT(b, a.item);
    b.l = this.join(a.l, b.l);
    b.r = this.join(a.r, b.r);

    this.fixN(b);

    return b;
};

Mat.BST.prototype.select = function (k) {
    return this.selectR(this.head, k);
};

Mat.BST.prototype.balance = function () {
    this.head = this.balanceR(this.head);
};

Mat.BST.prototype.show = function () {
    this.showR(this.head, 0);
};

Mat.BST.prototype.joinRand = function (a, b) {
    if (Math.random() / (1 / (a.N + b.N) + 1) < a.N) {
        return this.joinRandR(a, b);
    }

    return this.joinRandR(b, a);
};

Mat.BST.prototype.minimum = function (h) {
    if (this.isNil(h)) {
        return h;
    }

    while (!this.isNil(h.l)) {
        h = h.l;
    }

    return h;
};

Mat.BST.prototype.maximum = function (h) {
    if (this.isNil(h)) {
        return h;
    }

    while (!this.isNil(h.r)) {
        h = h.r;
    }

    return h;
};

Mat.BST.prototype.next = function (node) {
    var nxt,
        h = this.head;

    // Trivial case
    if (this.isNil(h)) {
        return h;
    }

    if (!this.isNil(node.r)) {
        return this.minimum(node.r);
    }

    while (!this.isNil(h)) {
        if (node.item < h.item) {
            nxt = h;
            h = h.l;
        } else if (h.item < node.item) {
            h = h.r;
        } else {
            break;
        }
    }

    return nxt;
};

Mat.BST.prototype.prev = function (node) {
    var nxt,
        h = this.head;

    // Trivial case
    if (this.isNil(h)) {
        return h;
    }

    if (!this.isNil(node.l)) {
        return this.maximum(node.l);
    }

    while (!this.isNil(h)) {
        if (node.item < h.item) {
            h = h.l;
        } else if (h.item < node.item) {
            nxt = h;
            h = h.r;
        } else {
            break;
        }
    }

    return nxt;
};

/**
 * private
 */
Mat.BST.prototype.fixN = function (h) {
    h.N = h.l.N + h.r.N + 1;
};

Mat.BST.prototype.isNil = function (h) {
    return h.l === 0 && h.r === 0;
};

Mat.BST.prototype.searchR = function (h, val) {
    var t = h.item;
    if (this.isNil(h)) {
        return this.z;
    }

    if (val === t) {
        return h;
    }

    if (val < t) {
        return this.searchR(h.l, val);
    }

    return this.searchR(h.r, val);
};

Mat.BST.prototype.insertR = function (h, item) {
    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }

    if (item < h.item) {
        h.l = this.insertR(h.l, item);
    } else {
        h.r = this.insertR(h.r, item);
    }

    h.N++;
    return h;
};

Mat.BST.prototype.rotR = function (h) {
    var x = h.l;

    h.l = x.r;
    x.r = h;

    this.fixN(h);
    this.fixN(x);

    return x;
};

Mat.BST.prototype.rotL = function (h) {
    var x = h.r,
        n = x.N;

    h.r = x.l;
    x.l = h;

    this.fixN(h);
    this.fixN(x);

    return x;
};

Mat.BST.prototype.insertT = function (h, item) {
    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }

    if (item < h.item) {
        h.l = this.insertT(h.l, item);
        h = this.rotR(h);
    } else {
        h.r = this.insertT(h.r, item);
        h = this.rotL(h);
    }

    return h;
};

Mat.BST.prototype.selectR = function (h, k) {
    var t;

    if (this.isNil(h)) {
        return null;
    }

    t = this.isNil(h.l) ? 0 : h.l.N;

    if (t > k) {
        return this.selectR(h.l, k);
    }

    if (t < k) {
        return this.selectR(h.r, k - t - 1);
    }

    return h.item;
};

Mat.BST.prototype.partR = function (h, k) {
    var t = h.l.N;

    if (t > k) {
        h.l = this.partR(h.l, k);
        h = this.rotR(h);
        this.head = h;
    }

    if (t < k) {
        h.r = this.partR(h.r, k - t - 1);
        h = this.rotL(h);
        this.head = h;
    }

    return h;
};

Mat.BST.prototype.joinLR = function (a, b) {
    if (this.isNil(b)) {
        return a;
    }

    b = this.partR(b, 0);
    b.l = a;
    this.fixN(b);
    return b;
};

Mat.BST.prototype.deleteR = function (h, v) {
    var x,
        t = h.item;

    if (this.isNil(h)) {
        return this.z;
    }

    if (v < t) {
        h.l = this.deleteR(h.l, v);
    }
    if (t < v) {
        h.r = this.deleteR(h.r, v);
    }

    if (t === v) {
        x = h;

        if (this.randomized) {
            h = this.joinRandLR(h.l, h.r);
        } else {
            h = this.joinLR(h.l, h.r);
        }
    }

    if (this.isNil(h)) {
        this.fixN(h);
    }

    return h;
};

Mat.BST.prototype.balanceR = function (h) {
    if (h.N < 2) {
        return h;
    }

    h = this.partR(h, Math.floor(h.N / 2));

    h.l = this.balanceR(h.l);
    h.r = this.balanceR(h.r);

    return h;
};

/**
 * Randomized Balnaced Binary Trees
 */
Mat.BST.prototype.insertRandR = function (h, item) {
    var t = h.item;

    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }

    if (Math.random() < 1 / (h.N + 1)) {
        return this.insertT(h, item);
    }

    if (item < t) {
        h.l = this.insertRandR(h.l, item);
    } else {
        h.r = this.insertRandR(h.r, item);
    }
    h.N++;

    return h;
};

Mat.BST.prototype.joinRandR = function (a, b) {
    if (this.isNil(a)) {
        return b;
    }

    b = this.insertRandR(b, a.item);
    b.l = this.joinRand(a.l, b.l);
    b.r = this.joinRand(a.r, b.r);

    this.fixN(b);

    return b;
};

Mat.BST.prototype.joinRandLR = function (a, b) {
    if (this.isNil(a)) {
        return b;
    }
    if (this.isNil(b)) {
        return a;
    }

    if (Math.random() / (1 / (a.N + b.N) + 1) < a.N) {
        a.r = this.joinRandLR(a.r, b);
        return a;
    }

    b.l = this.joinRandLR(a, b.l);
    return b;
};

/**
 * Test output
 */
Mat.BST.prototype.printnode = function (node, hgt) {
    var i,
        t = "";

    for (i = 0; i < hgt; i++) {
        t += " ";
    }
    t += "(" + node.item + "," + node.N + ")";
    // console.log(t);
};

Mat.BST.prototype.showR = function (x, hgt) {
    if (this.isNil(x)) {
        this.printnode(x, hgt);
        return;
    }

    this.showR(x.r, hgt + 1);
    this.printnode(x, hgt);
    this.showR(x.l, hgt + 1);
};

export default Mat.BST;
