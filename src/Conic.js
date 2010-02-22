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
 * @class This element is used to provide a constructor for an ellipse. An ellipse is given by two points (the foci) and a third point on the the ellipse or 
 * the length of the major axis.
 * @pseudo
 * @description
 * @name Ellipse
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array} point1,point2,point3 Parent elements can be three elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * @param {JXG.Point,array_JXG.Point,array_number,function} point1,point2,number Parent elements can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. The third parameter is a number/function which defines the length of the major axis
 * Optional parameters four and five are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
 * @example
 * // Create an Ellipse by three points
 * var A = board.create('point', [-1,4]);
 * var B = board.create('point', [-1,-4);
 * var C = board.create('point', [1,1]);
 * var el = board.create('ellipse',[A,B,C]);
 * </pre><div id="a4d7fb6f-8708-4e45-87f2-2379ae2bd2c0" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('a4d7fb6f-8708-4e45-87f2-2379ae2bd2c0', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
 *   var A = glex1_board.create('point', [-1,4]);
 *   var B = glex1_board.create('point', [-1,-4);
 *   var C = glex1_board.create('point', [1,1]);
 *   var el = glex1_board.create('ellipse',[A,B,C]);
 * </script><pre>
 */
JXG.createEllipse = function(board, parents, atts) {
    var F = [],  // focus 1 and focus 2
        C, 
        majorAxis,
        i,
        rotationMatrix;

    atts = JXG.checkAttributes(atts,{withLabel:JXG.readOption(board.options,'conic','withLabel'), layer:null});
    // The foci and the third point are either points or coordinate arrays.
    for (i=0;i<2;i++) {
        if (parents[i].length>1) { // focus i given by coordinates
            F[i] = board.create('point', parents[i], {visible:false,fixed:true});
        } else if (JXG.isPoint(parents[i])) { // focus i given by point
            F[i] = JXG.getReference(board,parents[i]);
        } else if ((typeof parents[i] == 'function') && (parents[i]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
            F[i] = parents[i]();
        } else if (JXG.isString(parents[i])) { // focus i given by point name
            F[i] = JXG.getReference(board,parents[i]);
        } else
            throw new Error("JSXGraph: Can't create Ellipse with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }
    if (JXG.isNumber(parents[2])) { // length of major axis
        majorAxis = JXG.createFunction(parents[2],board);
    } else {
        if (JXG.isPoint(parents[2])) {                                               // point on ellipse
            C = JXG.getReference(board,parents[2]);
        } else if (parents[2].length>1) {                                            // point on ellipse given by coordinates
            C = board.create('point', parents[2], {visible:false,fixed:true});
        } else if ((typeof parents[2] == 'function') && (parents[2]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
            C = parents[2]();
        } else if (JXG.isString(parents[2])) {                                      // focus i given by point name
            C = JXG.getReference(board,parents[2]);
        } else {
            throw new Error("JSXGraph: Can't create Ellipse with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) +"'.");
        }
        majorAxis = function(){ return C.Dist(F[0])+C.Dist(F[1]);};
    }

    if (typeof parents[4]=='undefined') parents[4] = 1.0001*Math.PI;   // to
    if (typeof parents[3]=='undefined') parents[3] = -1.0001*Math.PI;  // from

    atts = JXG.checkAttributes(atts,{curveType:'parameter'});

    var M = board.create('point', [
                function(){return (F[0].X()+F[1].X())*0.5;},
                function(){return (F[0].Y()+F[1].Y())*0.5;}
            ],{visible:false, name:'', withLabel:false});

    var transformFunc = function() {
            var ax = F[0].X(),
                ay = F[0].Y(),
                bx = F[1].X(),
                by = F[1].Y(),
                beta;

            // Rotate by the slope of the line [F[0],F[1]]
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan2(by-ay,bx-ax)+ ((sgn<0)?Math.PI:0);
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
                    e = F[1].Dist(F[0])*0.5,
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
 * @class This element is used to provide a constructor for an hyperbola. An hyperbola is given by two points (the foci) and a third point on the the hyperbola or 
 * the length of the major axis.
 * @pseudo
 * @description
 * @name Hyperbola
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array} point1,point2,point3 Parent elements can be three elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * @param {JXG.Point,array_JXG.Point,array_number,function} point1,point2,number Parent elements can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. The third parameter is a number/function which defines the length of the major axis
 * Optional parameters four and five are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
 * @example
 * // Create an Hyperbola by three points
 * var A = board.create('point', [-1,4]);
 * var B = board.create('point', [-1,-4);
 * var C = board.create('point', [1,1]);
 * var el = board.create('hyperbola',[A,B,C]);
 * </pre><div id="cf99049d-a3fe-407f-b936-27d76550f8c4" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('cf99049d-a3fe-407f-b936-27d76550f8c4', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
 *   var A = glex1_board.create('point', [-1,4]);
 *   var B = glex1_board.create('point', [-1,-4);
 *   var C = glex1_board.create('point', [1,1]);
 *   var el = glex1_board.create('hyperbola',[A,B,C]);
 * </script><pre>
 */
JXG.createHyperbola = function(board, parents, atts) {
    var F = [],  // focus 1 and focus 2
        C, 
        majorAxis,
        i,
        rotationMatrix;

    atts = JXG.checkAttributes(atts,{withLabel:JXG.readOption(board.options,'conic','withLabel'), layer:null});
    // The foci and the third point are either points or coordinate arrays.
    for (i=0;i<2;i++) {
        if (parents[i].length>1) { // focus i given by coordinates
            F[i] = board.create('point', parents[i], {visible:false,fixed:true});
        } else if (JXG.isPoint(parents[i])) { // focus i given by point
            F[i] = JXG.getReference(board,parents[i]);
        } else if ((typeof parents[i] == 'function') && (parents[i]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
            F[i] = parents[i]();
        } else if (JXG.isString(parents[i])) { // focus i given by point name
            F[i] = JXG.getReference(board,parents[i]);
        } else
            throw new Error("JSXGraph: Can't create Hyperbola with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");
    }
    if (JXG.isNumber(parents[2])) { // length of major axis
        majorAxis = JXG.createFunction(parents[2],board);
    } else {
        if (JXG.isPoint(parents[2])) {                                               // point on ellipse
            C = JXG.getReference(board,parents[2]);
        } else if (parents[2].length>1) {                                            // point on ellipse given by coordinates
            C = board.create('point', parents[2], {visible:false,fixed:true});
        } else if ((typeof parents[2] == 'function') && (parents[2]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
            C = parents[2]();
        } else if (JXG.isString(parents[2])) {                                      // focus i given by point name
            C = JXG.getReference(board,parents[2]);
        } else {
            throw new Error("JSXGraph: Can't create Hyperbola with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) +"'.");
        }
        majorAxis = function(){ return C.Dist(F[0])-C.Dist(F[1]);};
    }

    if (typeof parents[4]=='undefined') parents[4] = 1.0001*Math.PI;   // to
    if (typeof parents[3]=='undefined') parents[3] = -1.0001*Math.PI;  // from

    atts = JXG.checkAttributes(atts,{curveType:'parameter'});

    var M = board.create('point', [
                function(){return (F[0].X()+F[1].X())*0.5;},
                function(){return (F[0].Y()+F[1].Y())*0.5;}
            ],{visible:false, name:'', withLabel:false});

    var transformFunc = function() {
            var ax = F[0].X(),
                ay = F[0].Y(),
                bx = F[1].X(),
                by = F[1].Y(),
                beta;

            // Rotate by the slope of the line [F[0],F[1]]
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan2(by-ay,bx-ax)+ ((sgn<0)?Math.PI:0);
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
                    e = F[1].Dist(F[0])*0.5,
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
 * @class This element is used to provide a constructor for a parabola. A parabola is given by one point (the focus) and a line (the directrix).
 * @pseudo
 * @description
 * @name Parabola
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Line} point,line Parent elements are a point and a line.
 * Optional parameters three and four are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
 * @example
 * // Create a parabola by a point C and a line l.
 * var A = board.create('point', [-1,4]);
 * var B = board.create('point', [-1,-4);
 * var l = board.create('line', [A,B]);
 * var C = board.create('point', [1,1]);
 * var el = board.create('parabola',[C,l]);
 * </pre><div id="524d1aae-217d-44d4-ac58-a19c7ab1de36" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('524d1aae-217d-44d4-ac58-a19c7ab1de36', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
 *   var A = glex1_board.create('point', [-1,4]);
 *   var B = glex1_board.create('point', [-1,-4);
 *   var l = glex1_board.create('line', [A,B]);
 *   var C = glex1_board.create('point', [1,1]);
 *   var el = glex1_board.create('parabola',[C,l]);
 * </script><pre>
 */
JXG.createParabola = function(board, parents, atts) {
    var F1 = parents[0], // focus
        l = parents[1],  // directrix
        rotationMatrix;

    atts = JXG.checkAttributes(atts,{withLabel:JXG.readOption(board.options,'conic','withLabel'), layer:null});
    if (parents[0].length>1) { // focus 1 given by coordinates
        F1 = board.create('point', parents[0], {visible:false,fixed:true});
    } else if (JXG.isPoint(parents[0])) { // focus i given by point
        F1 = JXG.getReference(board,parents[0]);
    } else if ((typeof parents[0] == 'function') && (parents[0]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
        F1 = parents[0]();
    } else if (JXG.isString(parents[0])) { // focus i given by point name
        F1 = JXG.getReference(board,parents[0]);
    } else
        throw new Error("JSXGraph: Can't create Parabola with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");

    if (typeof parents[3]=='undefined') parents[3] = 10.0;   // to
    if (typeof parents[2]=='undefined') parents[2] = -10.0;  // from

    atts = JXG.checkAttributes(atts,{curveType:'parameter'});

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
 * 
 * @class This element is used to provide a constructor for a generic conic section uniquely defined by five points.
 * @pseudo
 * @description
 * @name Conic
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Conic
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array_JXG.Point,array_JXG.Point,array_} point,point,point,point,point Parent elements are five points.
 * @example
 * // Create a conic section through the points A, B, C, D, and E.
 *  var A = board.create('point', [1,5]);
 *  var B = board.create('point', [1,2]);
 *  var C = board.create('point', [2,0]);
 *  var D = board.create('point', [0,0]);
 *  var E = board.create('point', [-1,5]);
 *  var conic = board.create('conic',[A,B,C,D,E]);
 * </pre><div id="2d79bd6a-db9b-423c-9cba-2497f0b06320" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('2d79bd6a-db9b-423c-9cba-2497f0b06320', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
 *   var A = glex1_board.create('point', [1,5]);
 *   var B = glex1_board.create('point', [1,2]);
 *   var C = glex1_board.create('point', [2,0]);
 *   var D = glex1_board.create('point', [0,0]);
 *   var E = glex1_board.create('point', [-1,5]);
 *   var conic = glex1_board.create('conic',[A,B,C,D,E]);
 * </script><pre>
 */
JXG.createConic = function(board, parents, atts) {
    var rotationMatrix, eigen, a, b, c, M, c1, c2, 
        points = [], i,
        p = [];

    atts = JXG.checkAttributes(atts,{withLabel:JXG.readOption(board.options,'conic','withLabel'), layer:null});
    for (i=0;i<5;i++) {
        if (parents[i].length>1) { // point i given by coordinates
            points[i] = board.create('point', parents[i], {visible:false,fixed:true});
        } else if (JXG.isPoint(parents[i])) { // point i given by point
            points[i] = JXG.getReference(board,parents[i]);
        } else if ((typeof parents[i] == 'function') && (parents[i]().elementClass == JXG.OBJECT_CLASS_POINT)) {  // given by function
            points[i] = parents[i]();
        } else if (JXG.isString(parents[i])) { // point i given by point name
            points[i] = JXG.getReference(board,parents[i]);
        } else
            throw new Error("JSXGraph: Can't create Conic section with parent types '" + (typeof parents[i]) + "'.");
    }

    // sym(A) = A + A^t . Manipulates A in place.
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

    var polarForm = function(phi,suspendUpdate) {
        var i, j, len, v;
        if (!suspendUpdate) {
            // Copy the point coordinate vectors
            for (i=0;i<5;i++) { 
                p[i] = points[i].coords.usrCoords; 
            }
            // Compute the quadratic form
            c1 = degconic(JXG.Math.crossProduct(p[0],p[1]),JXG.Math.crossProduct(p[2],p[3]));
            c2 = degconic(JXG.Math.crossProduct(p[0],p[2]),JXG.Math.crossProduct(p[1],p[3]));
            M = fitConic(c1,c2,p[4]);
            // Compute Eigenvalues and Eigenvectors
            eigen = JXG.Math.Numerics.Jacobi(M);
            // Scale the Eigenvalues such that the first Eigenvalue is positive
            if (eigen[0][0][0]<0) {
                eigen[0][0][0] *= (-1);
                eigen[0][1][1] *= (-1);
                eigen[0][2][2] *= (-1);
            }
            // Normalize the Eigenvectors
            for (i=0;i<3;i++) {
                len = 0.0;
                for (j=0;j<3;j++) {
                    len += eigen[1][j][i]*eigen[1][j][i];
                }
                len = Math.sqrt(len);
                for (j=0;j<3;j++) {
                    eigen[1][j][i] /= len;
                }
            }
            rotationMatrix = eigen[1];
            c = Math.sqrt(Math.abs(eigen[0][0][0]));
            a = Math.sqrt(Math.abs(eigen[0][1][1]));
            b = Math.sqrt(Math.abs(eigen[0][2][2]));
        }
        if (eigen[0][1][1]<0.0) {
            v = JXG.Math.matVecMult(rotationMatrix,[1/c,Math.cos(phi)/a,Math.sin(phi)/b]);
        } else if (eigen[0][2][2]<0.0) {
            v = JXG.Math.matVecMult(rotationMatrix,[Math.sin(phi)/c,Math.cos(phi)/a,1/b]);
        } 
        // Normalize
        v[1] /= v[0];
        v[2] /= v[0];
        v[0] = 1.0;
        return v;
    };

    var curve = board.create('curve',
            [function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[1];},
             function(phi,suspendUpdate) {return polarForm(phi,suspendUpdate)[2];},
             -Math.PI,Math.PI],atts);
    return curve;
};

JXG.JSXGraph.registerElement('ellipse', JXG.createEllipse);
JXG.JSXGraph.registerElement('hyperbola', JXG.createHyperbola);
JXG.JSXGraph.registerElement('parabola', JXG.createParabola);
JXG.JSXGraph.registerElement('conic', JXG.createConic);

