JXG = {};

JXG.BST = function() {
    this.head = null;
    this.z = null;
    
};    

JXG.BST.prototype.newNode = function(it, le, ri, n) {
    return {item:it, l:le, r: ri, N: n};
};

JXG.BST.prototype.init = function() {
    this.z =this.newNode(null, 0, 0, 0);
    this.head = this.z;
};

JXG.BST.prototype.count = function() {
    return this.head.N;
};

JXG.BST.prototype.searchR = function(h, val) {
    var t = h.item;         // <-------
    if (h == this.z) {
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

JXG.BST.prototype.search = function(val) {
    return this.searchR(this.head, val);
};

JXG.BST.prototype.insertR = function(h, item) {
    var v = item,
        t = h.item;

    if (h == this.z) {
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

JXG.BST.prototype.insert = function(item) {
    this.head = this.insertR(this.head, item);
};


JXG.BST.prototype.insertRR= function(h, item) {
    var v = item,
        t = h.item;

    if (h == this.z) {
        return this.newNode(item, this.z, this.z, 1);
    }
    
    if (Math.random()<1.0/(h.N+1)) {
        return this.insertT(h, item);
    }
    
    if (v < t) {             // <---------
        h.l = this.insertRR(h.l, item);
    } else {
        h.r = this.insertRR(h.r, item);
    }
    h.N++;
    return h;
};

JXG.BST.prototype.insertRand = function(item) {
    this.head = this.insertRR(this.head, item);
};



JXG.BST.prototype.traverse = function(h, visit) {
    if (h == this.z) {
        return;
    }
    visit(h);
    this.traverse(h.l, visit);
    this.traverse(h.r, visit);
};

JXG.BST.prototype.rotR = function(h) {
    var x = h.l;
    h.l = x.r;
    x.r = h;
    return x;
};

JXG.BST.prototype.rotL = function(h) {
    var x = h.r;
    h.r = x.l;
    x.l = h;
    return x;
};

JXG.BST.prototype.insertT = function(h, item) {
    var v = item;                    // <---------------
    if (h == this.z) {
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

JXG.BST.prototype.insertHead = function(item) {
    this.head = this.insertT(this.head, item);
};

JXG.BST.prototype.partR = function(h, k) {
    var t = h.l.N;
    
    //t = (h==0) ? 0 : h.l.N;    
    if (t > k) {
        h.l = this.partR(h.l, k);
        h = this.rotR(h);
    }
    if (t < k) {
        h.r = this.partR(h.r, k-t-1);
        h = this.rotL(h);
    }
    return h;
};

JXG.BST.prototype.joinLR = function(a, b) {
    if (b == this.z) {
        return a;
    }
    
    b = this.partR(b, 0);
    b.l = a;
    return b;
};

JXG.BST.prototype.deleteR = function(h, v) {
    var x,
        t = h.item;               // <----------------
        
    if (h == this.z) {
        return this.z;
    }
    
    if (v<t) { h.l = this.deleteR(h.l, v); }     // <----------------
    if (t<v) { h.r = this.deleteR(h.r, v); }    // <----------------
    if (t == v) {
        x = h;
        h = this.joinLR(h.l, h.r);
        delete (x);
    }
    return h;
};

JXG.BST.prototype.deleteNode = function(v) {
    this.head = this.deleteR(this.head, v);
};

JXG.BST.prototype.join = function(a, b) {
    if (b == this.z) { return a; }
    if (a == this.z) { return b; }
    
    b = this.insertT(b, a.item);
    b.l = this.join(a.l, b.l);
    b.r = this.join(a.r, b.r);
    
    delete (a);
    return b;
};

JXG.BST.prototype.balanceR = function(h) {
    if (h.N < 2) {
        return h;
    }

    h = this.partR(h, h.N/2);
    h.l = this.balanceR(h.l);
    h.r = this.balanceR(h.r);
    return h;
}

// ------------------------------------

JXG.BST.prototype.printnode = function(it, hgt) {
    var i, t='';
    for (i=0; i<hgt; i++) {
        t += ' ';
    }
    t += it;
    console.log(t);
};

JXG.BST.prototype.showR = function(x, hgt) {
    if (x==this.z) {
        this.printnode('*', hgt);
        return;
    }
    this.showR(x.r, hgt+1);
    this.printnode(x.item, hgt);
    this.showR(x.l, hgt+1);
};

JXG.BST.prototype.show = function() {
    this.showR(this.head, 0);
};    



