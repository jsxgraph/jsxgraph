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

JXG.BST.prototype.traverse = function(h, visit) {
    if (h == this.z) {
        return;
    }
    visit(h);
    this.traverse(h.l, visit);
    this.traverse(h.r, visit);
};

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



