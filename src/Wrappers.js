/*
    Copyright 2008,2009
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

JXG.Board.prototype.angle = function(A, B, C){ return this.algebra.angle(A,B,C); };
JXG.Board.prototype.rad = function(A, B, C){ return this.algebra.rad(A,B,C); };
JXG.Board.prototype.distance = function(arr1, arr2){ return this.algebra.distance(arr1,arr2); };
JXG.Board.prototype.pow = function(a, b){ return this.algebra.pow(a,b); };
JXG.Board.prototype.round = function(x, n){ return (x).toFixed(n); };
JXG.Board.prototype.cosh = function(x){ return JXG.Math.Numerics.cosh(x); };
JXG.Board.prototype.sinh = function(x){ return JXG.Math.Numerics.sinh(x); };
JXG.Board.prototype.sgn = function(x) { return (x==0 ? 0 : x/(Math.abs(x))); };
JXG.Board.prototype.D = function(f,obj){ return JXG.Math.Numerics.D(f,obj); };
JXG.Board.prototype.I = function(interval,f){ return JXG.Math.Numerics.I(interval,f); };
JXG.Board.prototype.root = function(f,x,obj){ return JXG.Math.Numerics.root(f,x,obj); };
JXG.Board.prototype.lagrangePolynomial = function(p){ return JXG.Math.Numerics.lagrangePolynomial(p); };
JXG.Board.prototype.neville = function(p){ return JXG.Math.Numerics.neville(p); };
JXG.Board.prototype.riemannsum = function(f,n,type,start,end){ return JXG.Math.Numerics.riemannsum(f,n,type,start,end); };

JXG.Board.prototype.abs = Math.abs;
JXG.Board.prototype.acos = Math.acos;
JXG.Board.prototype.asin = Math.asin;
JXG.Board.prototype.atan = Math.atan;
JXG.Board.prototype.ceil = Math.ceil;
JXG.Board.prototype.cos = Math.cos;
JXG.Board.prototype.exp = Math.exp;
JXG.Board.prototype.floor = Math.floor;
JXG.Board.prototype.log = Math.log;
JXG.Board.prototype.max = Math.max;
JXG.Board.prototype.min = Math.min;
JXG.Board.prototype.random = Math.random;
JXG.Board.prototype.sin = Math.sin;
JXG.Board.prototype.sqrt = Math.sqrt;
JXG.Board.prototype.tan = Math.tan;
JXG.Board.prototype.trunc = Math.ceil;

JXG.Board.prototype.factorial = function(n){ return JXG.Math.factorial(n); };
JXG.Board.prototype.binomial = function(n,k){ return JXG.Math.binomial(n,k); };

// Some shortcuts 
JXG.Point.prototype.setPositionX = function (method, x) {
    var y = (method==JXG.COORDS_BY_USER)?this.coords.usrCoords[2]:this.coords.scrCoords[2];
    this.setPosition(method,x,y);
};
JXG.Point.prototype.setPositionY = function (method, y) {
    var x = (method==JXG.COORDS_BY_USER)?this.coords.usrCoords[1]:this.coords.scrCoords[1];
    this.setPosition(method,x,y);
};
JXG.Board.prototype.getElement = function (el) {return JXG.getReference(this,el); };

/**
 * GUI interface
 **/
JXG.Board.prototype.intersectionOptions = ['point',[[JXG.OBJECT_CLASS_LINE,JXG.OBJECT_CLASS_LINE],[JXG.OBJECT_CLASS_LINE,JXG.OBJECT_CLASS_CIRCLE],[JXG.OBJECT_CLASS_CIRCLE,JXG.OBJECT_CLASS_CIRCLE]]];
JXG.Board.prototype.intersection = function(el1,el2,i,j){ 
    el1 = JXG.getReference(this,el1);
    el2 = JXG.getReference(this,el2);
    if (el1.elementClass==JXG.OBJECT_CLASS_CURVE || el2.elementClass==JXG.OBJECT_CLASS_CURVE) {
        return function(){return el1.board.algebra.meetCurveCurve(el1,el2,i,j); };
    } else {
        return function(){return el1.board.algebra.meet(el1.stdform,el2.stdform,i); };
    }
}; //returns a single point of intersection
JXG.Board.prototype.intersectionFunc = function(el1,el2,i,j){ return this.intersection(el1,el2,i,j); }; 

/**
* Intersectionof  circles and line
*/ 
JXG.Board.prototype.otherIntersection = function(el1,el2,el){ 
    el1 = JXG.getReference(this,el1);
    el2 = JXG.getReference(this,el2);
    return function(){
        var c = el1.board.algebra.meet(el1.stdform,el2.stdform,0);
        if (Math.abs(el.X()-c.usrCoords[1])>JXG.Math.eps ||
            Math.abs(el.Y()-c.usrCoords[2])>JXG.Math.eps ||
            Math.abs(el.Z()-c.usrCoords[0])>JXG.Math.eps) {
            return c;
        } else {
            return el1.board.algebra.meet(el1.stdform,el2.stdform,1);
        }
    };
}; //returns a single point of intersection


JXG.Board.prototype.pointFunc = function(){return [null];};
JXG.Board.prototype.pointOptions = ['point',[[JXG.OBJECT_CLASS_POINT]]];

JXG.Board.prototype.lineFunc = function(){return arguments;};
JXG.Board.prototype.lineOptions = ['line',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];

JXG.Board.prototype.linesegmentFunc = function(){return arguments;};
JXG.Board.prototype.linesegmentOptions = ['line',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.linesegmentAtts = {straightFirst : false, straightLast : false };

JXG.Board.prototype.arrowFunc = function(){return arguments;};
JXG.Board.prototype.arrowOptions = ['arrow',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];

JXG.Board.prototype.circleFunc = function(){return arguments;};
JXG.Board.prototype.circleOptions = ['circle',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT],[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE],[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_CIRCLE]]];

JXG.Board.prototype.arrowparallelOptions = ['arrowparallel',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.arrowparallelFunc = function(){return arguments;};

JXG.Board.prototype.bisectorOptions = ['bisector',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.bisectorFunc = function(){return arguments;};

JXG.Board.prototype.circumcircleOptions = ['circumcircle',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.circumcircleFunc = function(){return arguments;};

JXG.Board.prototype.circumcirclemidpointOptions = ['circumcirclemidpoint',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.circumcirclemidpointFunc = function(){return arguments;};

JXG.Board.prototype.integralOptions = ['integral',[[]]];
JXG.Board.prototype.integralFunc = function(){return arguments;};

JXG.Board.prototype.midpointOptions = ['midpoint',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT],[JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.midpointFunc = function(){return arguments;};

JXG.Board.prototype.mirrorpointOptions = ['mirrorpoint',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.mirrorpointFunc = function(){return arguments;};

JXG.Board.prototype.normalOptions = ['normal',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.normalFunc = function(){return arguments;};

JXG.Board.prototype.parallelOptions = ['parallel',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.parallelFunc = function(){return arguments;};

JXG.Board.prototype.parallelpointOptions = ['parallelpoint',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_POINT]]];
JXG.Board.prototype.parallelpointFunc = function(){return arguments;};

JXG.Board.prototype.perpendicularOptions = ['perpendicular',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.perpendicularFunc = function(){return arguments;};

JXG.Board.prototype.perpendicularpointOptions = ['perpendicularpoint',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.perpendicularpointFunc = function(){return arguments;};

JXG.Board.prototype.reflectionOptions = ['reflection',[[JXG.OBJECT_CLASS_POINT,JXG.OBJECT_CLASS_LINE]]];
JXG.Board.prototype.reflectionFunc = function(){return arguments;};

// Wrapper for not-singleton-pstricks. this could be removed after the next release
// and adjusting examples/pstricks.html and pstricks example in the wiki
// (http://jsxgraph.uni-bayreuth.de/wiki/index.php/PsTricks_export)
JXG.Board.prototype.pstricks = {};
JXG.Board.prototype.pstricks.givePsTricksToDiv = function(divId, board) {
    JXG.PsTricks.givePsTricksToDiv(divId, board);
};
