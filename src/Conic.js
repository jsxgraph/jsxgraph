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
                    v = board.algebra.crossProduct(v,F1.coords.usrCoords);
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

JXG.JSXGraph.registerElement('ellipse', JXG.createEllipse);
JXG.JSXGraph.registerElement('hyperbola', JXG.createHyperbola);
JXG.JSXGraph.registerElement('parabola', JXG.createParabola);

