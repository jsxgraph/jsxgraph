/*
    Copyright 2010
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
    along with JSXGraph. If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview In this file the conic sections defined.
 */

/** 
 * a4d7fb6f-8708-4e45-87f2-2379ae2bd2c0
 */
JXG.createEllipse = function(board, parents, atts) {
    var F1 = parents[0],  // focus 1
        F2 = parents[1],  // focus 2        
        majorAxis,
        rotationMatrix;
    
    if (typeof parents[4]=='undefined') parents[4] = 1.0001*Math.PI;   // to
    if (typeof parents[3]=='undefined') parents[3] = -1.0001*Math.PI;  // from
    
    if (atts==null) { atts = {}; };
    atts['curveType'] = 'parameter';

    if (JXG.isPoint(parents[2])) {
        majorAxis = function(){ return parents[2].Dist(F1)+parents[2].Dist(F2);};
    } else {
        majorAxis = JXG.createFunction(parents[2],board);
    }
        
    var M = board.create('point', [
                function(){return (F1.X()+F2.X())*0.5;},
                function(){return (F1.Y()+F2.Y())*0.5;}
            ],{visible:false, name:'', withLabel:false});
    
    var transformFunc = function() {
            var ax = F1.X(),
                ay = F1.Y(),
                bx = F2.X(),
                by = F2.Y(),
                beta; 
            
            // Rotate by the slope of the line [F1,F2]
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan((by-ay)/(bx-ax))+ ((sgn<0)?Math.PI:0);  
            } else {
                beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
            }
            var m = [
                        [1,    0,             0],
                        [M.X(),Math.cos(beta),-Math.sin(beta)],
                        [M.Y(),Math.sin(beta), Math.cos(beta)]
                    ];
            return m;
        };

    var polarForm = function(phi,suspendUpdate) {
                var a = majorAxis()*0.5,
                    e = F2.Dist(F1)*0.5,
                    b = Math.sqrt(a*a-e*e);
                if (!suspendUpdate) {
                    rotationMatrix = transformFunc();
                }
                return JXG.Math.matVecMult(rotationMatrix,[1,a*Math.cos(phi),b*Math.sin(phi)]);
        };
           
    var curve = board.create('curve', 
                    [function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[1];},
                     function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[2];},parents[3],parents[4]],atts);        
    return curve;
};

/** 
 * cf99049d-a3fe-407f-b936-27d76550f8c4
 */
JXG.createHyperbola = function(board, parents, atts) {
    var F1 = parents[0], // focus 1
        F2 = parents[1], // focus 2
        majorAxis,
        rotationMatrix;
    
    if (typeof parents[4]=='undefined') parents[4] = 1.0001*Math.PI;   // to
    if (typeof parents[3]=='undefined') parents[3] = -1.0001*Math.PI;  // from
    
    if (atts==null) { atts = {}; };
    atts['curveType'] = 'parameter';

    if (JXG.isPoint(parents[2])) {
        majorAxis = function(){ return parents[2].Dist(F1)-parents[2].Dist(F2);};
    } else {
        majorAxis = JXG.createFunction(parents[2],board);
    }
        
    var M = board.create('point', [
                function(){return (F1.X()+F2.X())*0.5;},
                function(){return (F1.Y()+F2.Y())*0.5;}
            ],{visible:false, name:'', withLabel:false});

    var transformFunc = function() {
            var ax = F1.X(),
                ay = F1.Y(),
                bx = F2.X(),
                by = F2.Y(),
                beta;
            // Rotate by the slope of the line [F1,F2]
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan((by-ay)/(bx-ax))+ ((sgn<0)?Math.PI:0);  
            } else {
                beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
            }
            var m = [
                        [1,    0,             0],
                        [M.X(),Math.cos(beta),-Math.sin(beta)],
                        [M.Y(),Math.sin(beta), Math.cos(beta)]
                    ];
            return m;
        };

    /*
          * Hyperbola is defined by (a*sec(t),b*tan(t)) and sec(t) = 1/cos(t)
          */
    var polarForm = function(phi,suspendUpdate) {
                var a = majorAxis()*0.5,
                    e = F2.Dist(F1)*0.5,
                    b = Math.sqrt(-a*a+e*e);
                if (!suspendUpdate) {
                    rotationMatrix = transformFunc();
                }
                return JXG.Math.matVecMult(rotationMatrix,[1,a/Math.cos(phi),b*Math.tan(phi)]);
        };
    var curve = board.create('curve', 
                    [function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[1];},
                     function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[2];},parents[3],parents[4]],atts);        
                     
    return curve;
};

/** 
 * 524d1aae-217d-44d4-ac58-a19c7ab1de36
 */
JXG.createParabola = function(board, parents, atts) {
    var F1 = parents[0], // focus
        l = parents[1],  // directrix
        rotationMatrix;
    
    if (typeof parents[3]=='undefined') parents[3] = 10.0;   // to
    if (typeof parents[2]=='undefined') parents[2] = -10.0;  // from
            
    if (atts==null) { atts = {}; };
    atts['curveType'] = 'parameter';

    var M = board.create('point', [  
                function() {
                    var v = [0,l.stdform[1],l.stdform[2]];
                    v = JXG.Math.crossProduct(v,F1.coords.usrCoords);
                    return board.algebra.meetLineLine(v,l.stdform,0).usrCoords;
                }
            ],{visible:false, name:'', withLabel:false});

    var transformFunc = function() {
            var beta = Math.atan(l.getSlope()),
                x = (M.X()+F1.X())*0.5,
                y = (M.Y()+F1.Y())*0.5;
            beta += (F1.Y()-M.Y()<0 || (F1.Y()==M.Y() && F1.X()>M.X()) ) ? Math.PI : 0;

            // Rotate by the slope of the line l (Leitlinie = directrix)
            var m = [
                        [1,    0,             0],
                        [x*(1-Math.cos(beta))+y*Math.sin(beta),Math.cos(beta),-Math.sin(beta)],
                        [y*(1-Math.cos(beta))-x*Math.sin(beta),Math.sin(beta), Math.cos(beta)]
                    ];
            return m;
        };
        
    var polarForm = function(t,suspendUpdate) {
                var e = M.Dist(F1)*0.5;
                if (!suspendUpdate) {
                    rotationMatrix = transformFunc();
                }
                return JXG.Math.matVecMult(rotationMatrix,[1,t+(M.X()+F1.X())*0.5,t*t/(e*4)+(M.Y()+F1.Y())*0.5]);
        };
    var curve = board.create('curve', 
                    [function(t,suspendUpdate) {return polarForm(t,suspendUpdate)[1];},
                     function(t,suspendUpdate) {return polarForm(t,suspendUpdate)[2];},
                     parents[2],parents[3]],atts);        
                     
    return curve;
};

/**
 * Conic through five points
 */
JXG.createConic = function(board, parents, atts) {
    // sym(A) = A + A^t
    // Manipulates A in place.
    var sym = function(A) {
            var i, j;
            for (i=0;i<3;i++) {
                for (j=i;j<3;j++) {
                    A[i][j] += A[j][i];
                }
            }
            for (i=0;i<3;i++) {
                for (j=0;j<i;j++) {
                    A[i][j] = A[j][i];
                }
            }
            return A;
        };
    
    // degconic(v,w) = sym(v*w^t)
    var degconic = function(v,w) {
            var i, j, mat = [[0,0,0],[0,0,0],[0,0,0]];
            for (i=0;i<3;i++) {
                for (j=0;j<3;j++) {
                    mat[i][j] = v[i]*w[j];
                }
            }
            return sym(mat);
        };
    
    // (p^t*B*p)*A-(p^t*A*p)*B
    var fitConic = function(A,B,p)  {
            var pBp, pAp, Mv, M = [[0,0,0],[0,0,0],[0,0,0]], i, j;
            Mv = JXG.Math.matVecMult(B,p);
            pBp = JXG.Math.innerProduct(p,Mv);
            Mv = JXG.Math.matVecMult(A,p);
            pAp = JXG.Math.innerProduct(p,Mv);
            for (i=0;i<3;i++) {
                for (j=0;j<3;j++) {
                    M[i][j] = pBp*A[i][j]-pAp*B[i][j];
                }
            }
            return M;
        };
        
    var p = [], i;
    for (i=0;i<5;i++) {
        p[i] = parents[i].coords.usrCoords;
    }
    
    var c1 = degconic(JXG.Math.crossProduct(p[0],p[1]),JXG.Math.crossProduct(p[2],p[3]));
    var c2 = degconic(JXG.Math.crossProduct(p[0],p[2]),JXG.Math.crossProduct(p[1],p[3]));
    var M = fitConic(c1,c2,p[4]);
    
//document.getElementById('debug').innerHTML += c1.toString()+'<br>';
//document.getElementById('debug').innerHTML += c2.toString()+'<br>';
for (i=0;i<3;i++) {
    for (var j=0;j<3;j++) {
        document.getElementById('debug').innerHTML += M[i][j]+' ';
    }
    document.getElementById('debug').innerHTML += '<br>';
}
document.getElementById('debug').innerHTML += '<p>determinant:'+(M[1][1]*M[2][2]-M[2][1]*M[1][2])+'<br>';
    var r = JXG.Math.Numerics.Jacobi(M);
document.getElementById('debug').innerHTML += '<p>'+r[0].toString(); 
document.getElementById('debug').innerHTML += '<p>'+r[1].toString(); 

    var polarForm = function(phi,suspendUpdate) {
                var a = Math.sqrt(-r[0][1][1]/r[0][0][0]),
                    b = Math.sqrt(-r[0][2][2]/r[0][0][0]);
                if (!suspendUpdate) {
                    rotationMatrix = r[1];//transformFunc();
                }
                return JXG.Math.matVecMult(rotationMatrix,[1,Math.cos(phi)/a,Math.sin(phi)/b]);
        };
           
    var curve = board.create('curve', 
                    [function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[1];},
                     function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[2];}],atts);        



};

JXG.JSXGraph.registerElement('ellipse', JXG.createEllipse);
JXG.JSXGraph.registerElement('hyperbola', JXG.createHyperbola);
JXG.JSXGraph.registerElement('parabola', JXG.createParabola);
JXG.JSXGraph.registerElement('conic', JXG.createConic);

