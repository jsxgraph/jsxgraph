JXG = {};

JXG.BST = function() {
    this.head = null;
    this.z = null;
    this.randomized = true;
};    

/**
 * public
 */
JXG.BST.prototype.newNode = function(it, le, ri, n) {
    return {item:it, l:le, r: ri, N: n};
};

JXG.BST.prototype.init = function(random) {
    this.z =this.newNode(null, 0, 0, 0);
    this.head = this.z;
    if (typeof random != 'undefined') {
        this.randomized = random;
    }
};

JXG.BST.prototype.count = function() {
    return this.head.N;
};

JXG.BST.prototype.search = function(val) {
    return this.searchR(this.head, val);
};

JXG.BST.prototype.insert = function(item) {
    if (this.randomized) {
        this.head = this.insertRandR(this.head, item);
    } else {
        this.head = this.insertR(this.head, item);
    }
};

JXG.BST.prototype.traverse = function(h, visit) {
    if (this.isNil(h)) {
        return;
    }
    visit(h);
    this.traverse(h.l, visit);
    this.traverse(h.r, visit);
};

JXG.BST.prototype.insertHead = function(item) {
    this.head = this.insertT(this.head, item);
};

JXG.BST.prototype.deleteNode = function(v) {
    this.head = this.deleteR(this.head, v);
};

JXG.BST.prototype.join = function(a, b) {
    if (this.isNil(b)) { return a; }
    if (this.isNil(a)) { return b; }
    
    b = this.insertT(b, a.item);
    b.l = this.join(a.l, b.l);
    b.r = this.join(a.r, b.r);
    
    this.fixN(b);
    
    delete (a);
    return b;
};

JXG.BST.prototype.select = function(k) {
    return this.selectR(this.head, k);
};

JXG.BST.prototype.balance = function() {
    this.head = this.balanceR(this.head);
};

JXG.BST.prototype.show = function() {
    this.showR(this.head, 0);
};    

JXG.BST.prototype.joinRand = function(a, b) {
    if (Math.random()/(1.0/(a.N+b.N) + 1) < a.N) {
        return this.joinRandR(a, b);
    } else {
        return this.joinRandR(b, a);
    }
};

/**
 * privat
 */
JXG.BST.prototype.fixN = function(h) {
    h.N = h.l.N + h.r.N + 1;
};

JXG.BST.prototype.isNil = function(h) {
    if (h.l == 0 && h.r == 0) {
        return true;
    } else {
        return false;
    }
};

JXG.BST.prototype.searchR = function(h, val) {
    var t = h.item;         // <-------
    if (this.isNil(h)) {
        return null;
    }
    if (val == t) {         // <-------
        return h.item;
    }
    if (val < t) {          // <-------
        return this.searchR(h.l, val);
    } else {
        return this.searchR(h.r, val);
    }
};

JXG.BST.prototype.insertR = function(h, item) {
    var v = item,
        t = h.item;

    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }
    
    if (v < t) {             // <---------
        h.l = this.insertR(h.l, item);
    } else {
        h.r = this.insertR(h.r, item);
    }
    h.N++;
    return h;
};

JXG.BST.prototype.rotR = function(h) {
    var x = h.l;
    h.l = x.r;
    x.r = h;

    this.fixN(h);
    this.fixN(x);
    return x;
};

JXG.BST.prototype.rotL = function(h) {
    var x = h.r, 
        n = x.N;
    h.r = x.l;
    x.l = h;
    
    this.fixN(h);
    this.fixN(x);
    return x;
};

JXG.BST.prototype.insertT = function(h, item) {
    var v = item;                    // <---------------
    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }

    if (v < h.item)  {                // <---------------
        h.l = this.insertT(h.l, item);
        h = this.rotR(h);
    } else {
        h.r = this.insertT(h.r, item);
        h = this.rotL(h);
    }
    return h;
};

JXG.BST.prototype.selectR = function(h, k) {
    var t;
    
    if (this.isNil(h)) {
        return null;
    }
    t = (this.isNil(h.l)) ? 0 : h.l.N;
    
    
    if (t > k) {
        return this.selectR(h.l, k);
    }
    if (t < k) {
        return this.selectR(h.r, k-t-1);
    }
    return h.item;
};

JXG.BST.prototype.partR = function(h, k) {
    var t = h.l.N;
    
    if (t > k) {
        h.l = this.partR(h.l, k);
        h = this.rotR(h);
        this.head = h;
    }
    if (t < k) {
        h.r = this.partR(h.r, k-t-1);
        h = this.rotL(h);
        this.head = h;
    }
    return h;
};

JXG.BST.prototype.joinLR = function(a, b) {
    if (this.isNil(b)) {
        return a;
    }
    
    b = this.partR(b, 0);
    b.l = a;
    this.fixN(b);
    return b;
};

JXG.BST.prototype.deleteR = function(h, v) {
    var x,
        t = h.item;               // <----------------
        
    if (this.isNil(h)) {
        return this.z;
    }
    
    if (v<t) { h.l = this.deleteR(h.l, v); }     // <----------------
    if (t<v) { h.r = this.deleteR(h.r, v); }    // <----------------
    if (t == v) {
        x = h;
        if (this.randomized) {
            h = this.joinRandLR(h.l, h.r);
        } else {
            h = this.joinLR(h.l, h.r);
        }
        delete (x);
    }
    if (this.isNil(h)) { 
        this.fixN(h);
    }
    return h;
};

JXG.BST.prototype.balanceR = function(h) {
    if (h.N < 2) {
        return h;
    }

    h = this.partR(h, Math.floor(h.N/2));
    
    h.l = this.balanceR(h.l);
    h.r = this.balanceR(h.r);
    return h;
}

/**
 * Randomized Balnaced Binary Trees
 */
JXG.BST.prototype.insertRandR= function(h, item) {
    var v = item,
        t = h.item;

    if (this.isNil(h)) {
        return this.newNode(item, this.z, this.z, 1);
    }
    
    if (Math.random()<1.0/(h.N+1)) {
        return this.insertT(h, item);
    }
    
    if (v < t) {             // <---------
        h.l = this.insertRandR(h.l, item);
    } else {
        h.r = this.insertRandR(h.r, item);
    }
    h.N++;
    return h;
};

JXG.BST.prototype.joinRandR = function(a, b) {
    if (this.isNil(a)) {
        return b;
    }
    
    b = this.insertRandR(b, a.item);
    b.l  = this.joinRand(a.l, b.l);
    b.r  = this.joinRand(a.r, b.r);
    
    this.fixN(b);
    delete(a);
    return b;
};

JXG.BST.prototype.joinRandLR = function(a, b) {
    if (this.isNil(a)) { return b; }
    if (this.isNil(b)) { return a; }
 
    if (Math.random()/(1.0/(a.N+b.N) + 1) < a.N) {
        a.r = this.joinRandLR(a.r, b);
        return a;
    } else {
        b.l = this.joinRandLR(a, b.l);
        return b;
    }
};

// ------------------------------------

JXG.BST.prototype.printnode = function(node, hgt) {
    var i, t='';
    for (i=0; i<hgt; i++) {
        t += ' ';
    }
    t += '('+node.item + ',' + node.N+')';
    console.log(t);
};

JXG.BST.prototype.showR = function(x, hgt) {
    if (this.isNil(x)) {
        this.printnode(x, hgt);
        return;
    }
    this.showR(x.r, hgt+1);
    this.printnode(x, hgt);
    this.showR(x.l, hgt+1);
};


/**
 * Heap
 */
JXG.Heap = function() {
    this.pq = [];
    this.N = 0;
};    

/**
 * public
 */
JXG.Heap.prototype.empty = function() {
    this.pq = [];
    this.N = 0;
};

JXG.Heap.prototype.insert = function(v) {
    this.pq[this.N] = v;
    this.N++;
    this.fixUp(this.N);
};

JXG.Heap.prototype.delmax = function() {
    this.exchange(0, this.N-1);
    this.fixDown(0, this.N-1);
    this.N--;
    return this.pq[this.N];
};

/**
 * private
 */
JXG.Heap.prototype.fixUp = function(k) {
    var i = k-1;
    while (i>0 && this.pq[Math.floor(i/2)] < this.pq[i]) {      // <----------------
        this.exchange(Math.floor(i/2),i);
        i = Math.floor(i/2);
    };
};
    
JXG.Heap.prototype.fixDown = function(k, N) {
    var j, i = k;
    while (2*i<N) {
        j = 2*i;
        if (j<N && this.pq[j] < this.pq[j+1]) {       // <----------------
            j++;
        }
        if (! (this.pq[i]<this.pq[j]) ) break;
        this.exchange(i, j);
        i = j;
    }
};

JXG.Heap.prototype.exchange = function(i, j) {
    var t = this.pq[i];
    this.pq[i] = this.pq[j];
    this.pq[j] = t;
};


 


