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
    along with JSXGraph. If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview This file contains the Math.Geometry namespace for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */


/**
 * Math.Geometry namespace definition
 */
JXG.Math.Geometry = {};

/****************************************/
/**** GENERAL GEOMETRIC CALCULATIONS ****/
/****************************************/

/**
 * Calculates the angle defined by the points A, B, C.
 * @param {JXG.Point,array} A A point  or [x,y] array.
 * @param {JXG.Point,array} B Another point or [x,y] array.
 * @param {JXG.Point,array} C A circle - no, of course the third point or [x,y] array.
 * @type number
 * @return The angle in radian measure.
 * @deprecated Use {@link JXG.Math.Geometry#rad} instead.
 * @see #rad
 * @see #trueAngle
 */
JXG.Math.Geometry.angle = function(A, B, C) {   
    var a = [],
        b = [],
        c = [],
        u, v, s, t;
        
    if (A.coords == null) {
        a[0] = A[0];
        a[1] = A[1];
    } else {
        a[0] = A.coords.usrCoords[1];
        a[1] = A.coords.usrCoords[2];
    }
    if (B.coords == null) {
        b[0] = B[0];
        b[1] = B[1];
    } else {
        b[0] = B.coords.usrCoords[1];
        b[1] = B.coords.usrCoords[2];
    }
    if (C.coords == null) {
        c[0] = C[0];
        c[1] = C[1];
    } else {
        c[0] = C.coords.usrCoords[1];
        c[1] = C.coords.usrCoords[2];
    }
    u = a[0] - b[0];
    v = a[1] - b[1];
    s = c[0] - b[0];
    t = c[1] - b[1];
    return Math.atan2(u*t-v*s,u*s+v*t);    
};

/**
 * Calculates the angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
 * @param A Point or [x,y] array
 * @param B Point or [x,y] array
 * @param C Point or [x,y] array
 * @return The angle in degrees.
 * @see #rad
 */
JXG.Math.Geometry.trueAngle = function(/** JXG.Point */ A, /** JXG.Point */ B, /** JXG.Point */ C) /** number */ {
    return this.rad(A,B,C)*57.295779513082323; // *180.0/Math.PI;
};

/**
 * Calculates the internal angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
 * @param {JXG.Point} A Point or [x,y] array
 * @param {JXG.Point} B Point or [x,y] array
 * @param {JXG.Point} C Point or [x,y] array
 * @type number
 * @see #trueAngle
 * @return Angle in radians.
 */
JXG.Math.Geometry.rad = function(A,B,C) {
    var ax, ay, bx, by, cx, cy,
        abx, aby, cbx, cby,
        cp, l1, l2, phiacos, phicos, sp, 
        phi = 0;
        
    if (A.coords == null) {
        ax = A[0];
        ay = A[1];
    } else {
        ax = A.coords.usrCoords[1];
        ay = A.coords.usrCoords[2];
    }
    if (B.coords == null) {
        bx = B[0];
        by = B[1];
    } else {
        bx = B.coords.usrCoords[1];
        by = B.coords.usrCoords[2];
    }
    if (C.coords == null) {
        cx = C[0];
        cy = C[1];
    } else {
        cx = C.coords.usrCoords[1];
        cy = C.coords.usrCoords[2];
    }
    cbx = cx - bx;
    cby = cy - by;
    abx = ax - bx;
    aby = ay - by;
    
    //return Math.atan2(cby-aby,cbx-abx);

    sp = cbx*abx + cby*aby;               // scalar product of c-b and a-b
    cp = abx*cby - aby*cbx;               // cross product of a-b c-b
    l1 = Math.sqrt(abx*abx + aby*aby);    // length of a-b
    l2 = Math.sqrt(cbx*cbx + cby*cby);    // length of c-b
    phiacos = sp / (l1 * l2);             // calculate the angle as cosine from scalar product
    if (phiacos > 1) { // these things should not happen, but can happen because of numerical inaccurracy
        phiacos = 1;
    } else if (phiacos < -1) {
        phiacos = -1;
    }
    phicos = Math.acos(phiacos); // calculate the angle
    
        /*
         * The calculated angle may not be the right angle because of the calculation of acos 
        real     | quadrant  | quadrant | algebraic sign 
        quadrant | by cosine | by sine  | of sine 
           1.    |   1.      |   1.     |   +
           2.    |   2.      |   1.     |   +
           3.    |   2.      |   3.     |   -
           4.    |   1.      |   3.     |   - 
         So only for the first quadrant the calculated angle is ok. 
         But we can use the sine, which is connected with the cross product to select the right angle. 
         Calculate the sine of the calculated angle and multiply it with the cross product's value.
         
        real     | quadrant  | algebraic sign | algebraic sign of 
        quadrant | by cosine | of sin(phicos) | cross product
           1.    |   1.      |   +            |   +
           2.    |   2.      |   +            |   +
           3.    |   2.      |   +            |   -
           4.    |   1.      |   +            |   - 
         So always the negative angle of phicos has to be taken if the product is negative.
         */
    if ((Math.sin(phicos) * cp) < 0) {
        phi = 6.2831853071795862 - phicos; // 2 * Math.PI - phicos;
    } else {
        phi = phicos;
    }
    return phi;
};

/**
 * Calculates the bisection between the three points A, B, C. The bisection is defined by two points:
 * Parameter B and a point with the coordinates calculated in this function.
 * @param A Point
 * @param B Point
 * @param C Point
 * @param [board=A.board] Reference to the board
 * @return Coordinates of the second point defining the bisection.
 */
JXG.Math.Geometry.angleBisector = function(/** JXG.Point */ A, /** JXG.Point */ B, /** JXG.Point */ C, /** JXG.Board */ board) /** JXG.Coords */ {
    /* First point */
    var Ac = A.coords.usrCoords,
        Bc = B.coords.usrCoords, 
        Cc = C.coords.usrCoords,
        x = Ac[1]-Bc[1],
        y = Ac[2]-Bc[2],
        d = Math.sqrt(x*x+y*y),
        phiA, phiC, phi;
    
    if(typeof board == 'undefined')
        board = A.board;
    
    x /= d;
    y /= d;
    
    phiA = Math.acos(x);
    if (y<0) { phiA *= -1; }
    if (phiA<0) { phiA += 2*Math.PI; } 
    
    /* Second point */
    x = Cc[1]-Bc[1];
    y = Cc[2]-Bc[2];
    d = Math.sqrt(x*x+y*y);
    x /= d;
    y /= d;
    
    phiC = Math.acos(x);
    if (y<0) { phiC *= -1; }
    if (phiC<0) { phiC += 2*Math.PI; } 
 
    phi=(phiA+phiC)*0.5;
    if (phiA>phiC) { 
        phi+=Math.PI;
    }

    x = Math.cos(phi)+Bc[1];
    y = Math.sin(phi)+Bc[2];
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
};

/**
 * Reflects the point along the line.
 * @param line Axis of reflection.
 * @param point Point to reflect.
 * @param [board=point.board] Reference to the board
 * @return Coordinates of the reflected point.
 */  
JXG.Math.Geometry.reflection = function(/** JXG.Line */ line, /** JXG.Point */ point, /** JXG.Board */ board) /** JXG.Coords */ {
    /* (v,w) defines the slope of the line */    
    var pc = point.coords.usrCoords,
        p1c = line.point1.coords.usrCoords,
        p2c = line.point2.coords.usrCoords,
        x0, y0, x1, y1, v, w, mu;

    if(typeof board == 'undefined')
        board = point.board;

    v = p2c[1]-p1c[1];
    w = p2c[2]-p1c[2];
    
    x0 = pc[1]-p1c[1];
    y0 = pc[2]-p1c[2];
    
    mu = (v*y0-w*x0)/(v*v+w*w);
    
    /* point + mu*(-y,x) waere Lotpunkt */
    x1 = pc[1] + 2*mu*w;
    y1 = pc[2] - 2*mu*v;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], board);
};

/**
 * Computes the new position of a point which is rotated 
 * around a second point (called rotpoint) by the angle phi.
 * @param {JXG.Point} rotpoint Center of the rotation
 * @param {JXG.Point} point point to be rotated
 * @param {number} phi rotation angle in arc length
 * @param {JXG.Board} [board=point.board] Reference to the board
 * @type JXG.Coords
 * @return Coordinates of the new position.
 */
JXG.Math.Geometry.rotation = function(rotpoint, point, phi, board) {
    var pc = point.coords.usrCoords,
        rotpc = rotpoint.coords.usrCoords,
        x0, y0, c, s, x1, y1;

    if(typeof board == 'undefined')
        board = point.board;

    x0 = pc[1]-rotpc[1];
    y0 = pc[2]-rotpc[2];
    
    c = Math.cos(phi);
    s = Math.sin(phi);
    
    x1 = x0*c-y0*s + rotpc[1];
    y1 = x0*s+y0*c + rotpc[2];
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], board);
};

/**
 * Calculates the coordinates of a point on the perpendicular to the given line through
 * the given point.
 * @param {JXG.Line} line A line.
 * @param {JXG.Point} point Intersection point of line to perpendicular.
 * @param {JXG.Board} [board=point.board] Reference to the board
 * @type JXG.Coords
 * @return Coordinates of a point on the perpendicular to the given line through the given point.
 */
JXG.Math.Geometry.perpendicular = function(line, point, board) {
    var A = line.point1.coords.usrCoords,
        B = line.point2.coords.usrCoords,
        C = point.coords.usrCoords,
        x, y, change,
        fmd, emc, d0, d1, den;

    if(typeof board=='undefined')
        board = point.board;

    if(point == line.point1) { // Punkt ist erster Punkt der Linie
        x = A[1] + B[2] - A[2];
        y = A[2] - B[1] + A[1];
        change = true;
    }
    else if(point == line.point2) {  // Punkt ist zweiter Punkt der Linie    
        x = B[1] + A[2] - B[2];
        y = B[2] - A[1] + B[1];
        change = false;
    }
    else if( ((Math.abs(A[1] - B[1]) > JXG.Math.eps) && 
             (Math.abs(C[2] - (A[2] - B[2])*(C[1]-A[1])/(A[1] - B[1])-A[2]) < JXG.Math.eps)) ||
             ((Math.abs(A[1] - B[1]) <= JXG.Math.eps) && (Math.abs(A[1] - C[1]) < JXG.Math.eps)) ) { // Punkt liegt auf der Linie
        x = C[1] + B[2] - C[2];
        y = C[2] - B[1] + C[1]; 
        change = true;
        if(Math.abs(x - C[1]) < JXG.Math.eps && Math.abs(y - C[2]) < JXG.Math.eps) {
            x = C[1] + A[2] - C[2];
            y = C[2] - A[1] + C[1];
            change = false;
        }
    }
    else { // Punkt liegt nicht auf der Linie -> als zweiter Punkt wird der Lotfusspunkt gewaehlt
        fmd = A[2] - B[2];
        emc = A[1] - B[1];
        d0 = B[1]*fmd - B[2]*emc;
        d1 = C[1]*emc + C[2]*fmd;
        den = fmd*fmd + emc*emc;
        if(Math.abs(den)<JXG.Math.eps) {
            den = JXG.Math.eps;
        }
        x = (d0*fmd + d1*emc) / den;
        y = (d1*fmd - d0*emc) /den;
        change = true;
    }                            
    return [new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board),change];             
};

/**
 * Calculates the midpoint of the circumcircle of the three given points.
 * @param {JXG.Point} point1 Point
 * @param {JXG.Point} point2 Point
 * @param {JXG.Point} point3 Point
 * @param {JXG.Board} [board=point1.board] Reference to the board
 * @type JXG.Coords
 * @return Coordinates of the midpoint of the circumcircle of the given points.
 */
JXG.Math.Geometry.circumcenterMidpoint = function(point1, point2, point3, board) {
    var A = point1.coords.usrCoords,
        B = point2.coords.usrCoords,
        C = point3.coords.usrCoords,
        u, v, den, x, y;

    if(typeof board=='undefined')
        board = point1.board;

    u = ((A[1]-B[1])*(A[1]+B[1]) + (A[2]-B[2])*(A[2]+B[2])) * 0.5;
    v = ((B[1]-C[1])*(B[1]+C[1]) + (B[2]-C[2])*(B[2]+C[2])) * 0.5;
    den = (A[1]-B[1])*(B[2]-C[2]) - (B[1]-C[1])*(A[2]-B[2]);
              
    if (Math.abs(den) < JXG.Math.eps) {
        den = JXG.Math.eps;
    }
    
    x = (u * (B[2]-C[2]) - v*(A[2]-B[2])) / den;
    y = (v * (A[1]-B[1]) - u*(B[1]-C[1])) / den;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
};

/**
 * Calculates euclidean norm for two given arrays of the same length.
 * @param {array} array1 Array of float or integer.
 * @param {array} array2 Array of float or integer.
 * @type number
 * @return Euclidean distance of the given vectors.
 */
JXG.Math.Geometry.distance = function(array1, array2) {
    var sum = 0, 
        i, len;
        
    if(array1.length != array2.length) { return; }
    len = array1.length;
    for(i=0; i<len; i++) {
        sum += (array1[i] - array2[i])*(array1[i] - array2[i]);
    }
    return Math.sqrt(sum);
};

/**
 * Calculates euclidean distance for two given arrays of the same length.
 * If one of the arrays contains a zero in the first coordinate, and the euclidean distance
 * is different from zero it is a point at infinity and we return Infinity.
 * @param {array} array1 Array containing elements of number.
 * @param {array} array2 Array containing elements of type number.
 * @type number
 * @return Euclidean (affine) distance of the given vectors.
 */
JXG.Math.Geometry.affineDistance = function(array1, array2) {
    var d;
    if(array1.length != array2.length) { 
        return; 
    }
    d = this.distance(array1, array2);
    if (d>JXG.Math.eps && (Math.abs(array1[0])<JXG.Math.eps || Math.abs(array2[0])<JXG.Math.eps)) {
        return Infinity;
    } else {
        return d;
    }
};


/****************************************/
/****          INTERSECTIONS         ****/
/****************************************/

/**
 * Calculates the coordinates of the intersection of the given lines.
 * @param {JXG.Line} line1 Line.
 * @param {JXG.Line} line2 Line.
 * @param {JXG.Board} [board=line1.board] Reference to the board
 * @type JXG.Coords
 * @return Coordinates of the intersection point of the given lines.
 */
JXG.Math.Geometry.intersectLineLine = function(line1, line2, board) {
    var A = line1.point1.coords.usrCoords,
        B = line1.point2.coords.usrCoords,
        C = line2.point1.coords.usrCoords,
        D = line2.point2.coords.usrCoords,
        d0, d1, den, x, y;

    if(typeof board == 'undefined')
        board = line1.board;

    d0 = A[1]*B[2] - A[2]*B[1];
    d1 = C[1]*D[2] - C[2]*D[1];
    den = (B[2]-A[2])*(C[1]-D[1]) - (A[1]-B[1])*(D[2]-C[2]);
                 
    if(Math.abs(den) < JXG.Math.eps) {
         den = JXG.Math.eps; 
    }
    x = (d0*(C[1]-D[1]) - d1*(A[1]-B[1])) / den;
    y = (d1*(B[2]-A[2]) - d0*(D[2]-C[2])) / den;

    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
};

/**
 * Calculates the coordinates of the intersection of the given line and circle.
 * @param {JXG.Circle} circle Circle.
 * @param {JXG.Line} line Line.
 * @param {JXG.Board} [board=line.board] Reference to the board
 * @type array
 * @return Array of the Coordinates of the intersection points of the given circle with the given line and
 * the amount of intersection points in the first component of the array.
 */
JXG.Math.Geometry.intersectCircleLine = function(circle, line, board) {
    var eA = line.point1.coords.usrCoords,
        eB = line.point2.coords.usrCoords,
        fM = circle.midpoint.coords.usrCoords,
        s, d0, d1, b, w, h, r, n1, dx, dy, firstPointX, firstPointY, l, x, y, n1s, firstPoint, secondPoint, d;

    if(typeof board == 'undefined')
        board = line.board;

    s = line.point1.Dist(line.point2);
    if (s > 0) {
        d0 = circle.midpoint.Dist(line.point1);
        d1 = circle.midpoint.Dist(line.point2);
        b = ((d0 * d0) + (s * s) - (d1 * d1)) / (2 * s);
        w = (d0 * d0) - (b * b);
        w = (w < 0) ? 0 : w;
        h = Math.sqrt(w);
        
        r = circle.Radius();
        n1 = Math.sqrt((r * r) - h*h);
        dx = eB[1] - eA[1];
        dy = eB[2] - eA[2];
        firstPointX = fM[1] + (h / s) * dy;
        firstPointY = fM[2] - (h / s) * dx;
        d0 = (eB[1] * dy) - (eB[2] * dx);
        d1 = (firstPointX * dx) + (firstPointY * dy);
        l = (dy * dy) + (dx * dx);
        if (Math.abs(l) < JXG.Math.eps) { l = JXG.Math.eps; }
        x = ((d0 * dy) + (d1 * dx)) / l;
        y = ((d1 * dy) - (d0 * dx)) / l;
        n1s = n1/s;
        firstPoint =  new JXG.Coords(JXG.COORDS_BY_USER, [x + n1s * dx, y + n1s * dy], board);
        secondPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x - n1s * dx, y - n1s * dy], board);
        d = circle.midpoint.coords.distance(JXG.COORDS_BY_USER, firstPoint);
      
        if ((r < (d - 1)) || isNaN(d)) {
            return [0];
        } else {
            return [2,firstPoint,secondPoint];
        }
    }
    return [0];
};

/**
 * Calculates the coordinates of the intersection of the given circles.
 * @param {JXG.Circle} circle1 Circle.
 * @param {JXG.Circle} circle2 Circle.
 * @param {JXG.Board} [board=circle1.board] Reference to the board
 * @type array
 * @return Array of the Coordinates of the intersection points of the given circles and the
 * amount of intersection points in the first component of the array.
 */
JXG.Math.Geometry.intersectCircleCircle = function(circle1, circle2, board) { 
    var intersection = {},
        r1 = circle1.Radius(),
        r2 = circle2.Radius(),
        M1 = circle1.midpoint.coords.usrCoords,
        M2 = circle2.midpoint.coords.usrCoords,
        rSum, rDiff, s, 
        dx, dy, a, h;

    if(typeof board == 'undefined')
        board = circle1.board;

    rSum = r1 + r2;
    rDiff = Math.abs(r1 - r2);    
    // Abstand der Mittelpunkte der beiden Kreise
    s = circle1.midpoint.coords.distance(JXG.COORDS_BY_USER, circle2.midpoint.coords);
    if (s > rSum) {
        return [0]; // Kreise schneiden sich nicht, liegen nebeneinander
    } 
    else if (s < rDiff) {
        return [0]; // Kreise schneiden sich nicht, liegen ineinander
    } 
    else {
        if (s != 0) {
            intersection[0] = 1; // es gibt einen Schnitt        
            dx = M2[1] - M1[1];
            dy = M2[2] - M1[2];
            a = (s * s - r2 * r2 + r1 * r1) / (2 * s);
            h = Math.sqrt(r1 * r1 - a * a);
            intersection[1] = new JXG.Coords(JXG.COORDS_BY_USER, 
                                             [M1[1] + (a / s) * dx + (h / s) * dy, 
                                              M1[2] + (a / s) * dy - (h / s) * dx], 
                                             board);
            intersection[2] = new JXG.Coords(JXG.COORDS_BY_USER, 
                                             [M1[1] + (a / s) * dx - (h / s) * dy, 
                                              M1[2] + (a / s) * dy + (h / s) * dx], 
                                             board);    
        }
        else {
            return [0]; // vorsichtshalber... 
        }                                     
        return intersection;
    }
};

/**
 * @private
 * Computes the intersection of a pair of lines, circles or both.
 * It uses the internal data array stdform of these elements.
 * @param {Array} el1 stdform of the first element (line or circle)
 * @param {Array} el2 stdform of the second element (line or circle)
 * @param {number} i Index of the intersection point that should be returned.
 * @param board Reference to the board.
 * @type JXG.Coords
 * @return Coordinates of one of the possible two or more intersection points. 
 * Which point will be returned is determined by i.
 */
JXG.Math.Geometry.meet = function(el1, el2, /** number */ i, /** JXG.Board */ board) /** JXG.Coords */ {
    var eps = JXG.Math.eps; //    var eps = 0.000001;

    if (Math.abs(el1[3])<eps && Math.abs(el2[3])<eps) { // line line
        return this.meetLineLine(el1,el2,i,board);
    } else if (Math.abs(el1[3])>=eps && Math.abs(el2[3])<eps) { // circle line
        return this.meetLineCircle(el2,el1,i,board);
    } else if (Math.abs(el1[3])<eps && Math.abs(el2[3])>=eps) { // line circle
        return this.meetLineCircle(el1,el2,i,board);
    } else {  // circle circle
        return this.meetCircleCircle(el1,el2,i,board);
    }
};

/**
  * @private
  * Intersection of two lines using the stdform.
  * @param {Array} l1 stdform of the first line
  * @param {Array} l2 stdform of the second line
  * @param {number} i unused
  * @param {JXG.Board} board Reference to the board.
  * @type JXG.Coords
  * @return Coordinates of the intersection point.
  */
JXG.Math.Geometry.meetLineLine = function(l1,l2,i,board) {
    var s = JXG.Math.crossProduct(l1,l2);
    if (Math.abs(s[0])>JXG.Math.eps) {
        s[1] /= s[0];
        s[2] /= s[0];
        s[0] = 1.0;
    }
    return new JXG.Coords(JXG.COORDS_BY_USER, s, board);
};

/**
  * @private
  * 
  * Intersection of line and circle using the stdform.
  * 
  * @param {Array} lin stdform of the line
  * @param {Array} circ stdform of the circle
  * @param {number} i number of the returned intersection point. 
  *   i==0: use the positive square root, 
  *   i==1: use the negative square root.
  * @param {JXG.Board} board Reference to a board.
  * @type JXG.Coords
  * @return Coordinates of the intersection point
  */
 JXG.Math.Geometry.meetLineCircle = function(lin,circ,i,board) {
    var a,b,c,d,n, A,B,C, k,t;

    if (circ[4]<JXG.Math.eps) { // Radius is zero, return center of circle
        return new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(1,3), board);
    }
    c = circ[0];
    b = circ.slice(1,3);
    a = circ[3];
    d = lin[0];
    n = lin.slice(1,3);

    // Line is normalized, therefore nn==1 and we can skip some operations:
    /*
    var nn = n[0]*n[0]+n[1]*n[1];
    A = a*nn;
    B = (b[0]*n[1]-b[1]*n[0])*nn;
    C = a*d*d - (b[0]*n[0]+b[1]*n[1])*d + c*nn;
    */
    A = a;
    B = (b[0]*n[1]-b[1]*n[0]);
    C = a*d*d - (b[0]*n[0]+b[1]*n[1])*d + c;

    k = B*B-4*A*C;
    if (k>=0) {
        k = Math.sqrt(k);
        t = [(-B+k)/(2*A),(-B-k)/(2*A)];
        return ((i==0)
            ? new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0],-t[0]*n[0]-d*n[1]], board)
            : new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0],-t[1]*n[0]-d*n[1]], board)
            );
/*
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0]/nn,-t[0]*n[0]-d*n[1]/nn], this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0]/nn,-t[1]*n[0]-d*n[1]/nn], this.board)
*/
    } else {
        return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], board);
    }
    // Returns do not work with homogeneous coordinates, yet
};

/**
  * @private
  * 
  * Intersection of two circles using the stdform.
  * 
  * @param {Array} circ1 stdform of the first circle
  * @param {Array} circ2 stdform of the second circle
  * @param {number} i number of the returned intersection point. 
  *   i==0: use the positive square root, 
  *   i==1: use the negative square root.
  * @param {JXG.Board} board Reference to the board.
  * @type JXG.Coords
  * @return Coordinates of the intersection point
  */
JXG.Math.Geometry.meetCircleCircle = function(circ1,circ2,i,board) {
    var radicalAxis;
    if (circ1[4]<JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ1.slice(1,3),circ2.slice(1,3))==circ2[4]) {
            return new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(1,3), board);
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], board);
        }
    }
    if (circ2[4]<JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ2.slice(1,3),circ1.slice(1,3))==circ1[4]) {
            return new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(1,3), board);
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], board);
        }
    }
    radicalAxis = [circ2[3]*circ1[0]-circ1[3]*circ2[0],
                   circ2[3]*circ1[1]-circ1[3]*circ2[1],
                   circ2[3]*circ1[2]-circ1[3]*circ2[2],
                   0,1,Infinity, Infinity, Infinity];
    radicalAxis = JXG.Math.normalize(radicalAxis);
    return this.meetLineCircle(radicalAxis,circ1,i,board);
    // Returns do not work with homogeneous coordinates, yet
};

/**
 * Compute an intersection of the curves c1 and c2
 * with a generalized Newton method.
 * We want to find values t1, t2 such that
 * c1(t1) = c2(t2), i.e.
 * (c1_x(t1)-c2_x(t2),c1_y(t1)-c2_y(t2)) = (0,0).
 * We set
 * (e,f) := (c1_x(t1)-c2_x(t2),c1_y(t1)-c2_y(t2))
 *
 * The Jacobian J is defined by
 * J = (a, b)
 *     (c, d)
 * where
 * a = c1_x'(t1)
 * b = -c2_x'(t2)
 * c = c1_y'(t1)
 * d = -c2_y'(t2)
 *
 * The inverse J^(-1) of J is equal to
 *  (d, -b)/
 *  (-c, a) / (ad-bc)
 *
 * Then, (t1new, t2new) := (t1,t2) - J^(-1)*(e,f).
 * If the function meetCurveCurve possesses the properties
 * t1memo and t2memo then these are taken as start values
 * for the Newton algorithm.
 * After stopping of the Newton algorithm the values of t1 and t2 are stored in
 * t1memo and t2memo.
 * 
 * @param {JXG.Curve} c1 Curve, Line or Circle
 * @param {JXG.Curve} c2 Curve, Line or Circle
 * @param {float} t1ini start value for t1
 * @param {float} t2ini start value for t2
 * @param {JXG.Board} [board=c1.board] Reference to a board object.
 * @type {JXG.Coords}
 * @return coordinate object for the intersection point
 **/
JXG.Math.Geometry.meetCurveCurve = function(c1,c2,t1ini,t2ini,board) {
    var count = 0,
        t1, t2,
        a, b, c, d, disc,
        e, f, F, 
        D00, D01, 
        D10, D11;
    
    if(typeof board == 'undefined')
        board = c1.board;
        
    if (arguments.callee.t1memo) {
        t1 = arguments.callee.t1memo;
        t2 = arguments.callee.t2memo;
    } else {
        t1 = t1ini;
        t2 = t2ini;
    }
/*
    if (t1>c1.maxX()) { t1 = c1.maxX(); }
    if (t1<c1.minX()) { t1 = c1.minX(); }
    if (t2>c2.maxX()) { t2 = c2.maxX(); }
    if (t2<c2.minX()) { t2 = c2.minX(); }
*/
    e = c1.X(t1)-c2.X(t2);
    f = c1.Y(t1)-c2.Y(t2);
    F = e*e+f*f;
    
    D00 = c1.board.D(c1.X,c1);
    D01 = c2.board.D(c2.X,c2);
    D10 = c1.board.D(c1.Y,c1);
    D11 = c2.board.D(c2.Y,c2);
    
    while (F>JXG.Math.eps && count<10) {
        a =  D00(t1);
        b = -D01(t2);
        c =  D10(t1);
        d = -D11(t2);
        disc = a*d-b*c;
        t1 -= (d*e-b*f)/disc;
        t2 -= (a*f-c*e)/disc;
        e = c1.X(t1)-c2.X(t2);
        f = c1.Y(t1)-c2.Y(t2);
        F = e*e+f*f;
        count++;
    }
//console.log(t1+' '+t2);

    arguments.callee.t1memo = t1;
    arguments.callee.t2memo = t2;

    //return (new JXG.Coords(JXG.COORDS_BY_USER, [2,2], this.board));
    if (Math.abs(t1)<Math.abs(t2)) {
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c1.X(t1),c1.Y(t1)], board));
    } else {
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c2.X(t2),c2.Y(t2)], board));
    }
};

/**
 * order of input does not matter for el1 and el2.
 * @param {JXG.Curve,JXG.Line} el1 Curve or Line
 * @param {JXG.Curve,JXG.Line} el2 Curve or Line
 * @param {?} nr
 * @param {JXG.Board} [board=el1.board] Reference to a board object.
 * @type {JXG.Coords}
 * @return coordinate object for the intersection point
 */
JXG.Math.Geometry.meetCurveLine = function(el1,el2,nr,board) {
    var t, t2, i, cu, li, func, z,
        tnew, steps, delta, tstart, cux, cuy;
    
    if(typeof board == 'undefined')
        board = el1.board;
    
    
    //for (i=0;i<arguments.length-1;i++) {
    for (i=0;i<=1;i++) {
        if (arguments[i].elementClass==JXG.OBJECT_CLASS_CURVE) { cu = arguments[i]; }
        else if (arguments[i].elementClass==JXG.OBJECT_CLASS_LINE) { li = arguments[i]; }
        else 
            throw new Error("JSXGraph: Can't call meetCurveLine with parent class " + (arguments[i].elementClass) + ".");
    }
    
    func = function(t) {
        return li.stdform[0]*1.0 + li.stdform[1]*cu.X(t) + li.stdform[2]*cu.Y(t);
    };
    
    if (arguments.callee.t1memo) {
        tstart = arguments.callee.t1memo;
    } else {
        tstart = cu.minX();
    }
    t = JXG.Math.Numerics.root(func, tstart);
    arguments.callee.t1memo = t;
    cux = cu.X(t);
    cuy = cu.Y(t);
    
    if (nr==1) {  
        if (arguments.callee.t2memo) {
            tstart = arguments.callee.t2memo;
            t2 = JXG.Math.Numerics.root(func, tstart);
        } 
        if (!(Math.abs(t2-t)>0.1 && Math.abs(cux-cu.X(t2))>0.1 && Math.abs(cuy-cu.Y(t2))>0.1)) {
            steps = 20;
            delta = (cu.maxX()-cu.minX())/steps;
            tnew = cu.minX();
            for (i=0;i<steps;i++) {
                t2 = JXG.Math.Numerics.root(func, tnew);
                if (Math.abs(t2-t)>0.1 && Math.abs(cux-cu.X(t2))>0.1 && Math.abs(cuy-cu.Y(t2))>0.1) {
                    break;
                }
                tnew += delta;
            }
        }
        t = t2;
        arguments.callee.t2memo = t;
    }

    if (Math.abs(func(t))>JXG.Math.eps)
        z = 0.0;
    else
        z = 1.0;
    
    return (new JXG.Coords(JXG.COORDS_BY_USER, [z, cu.X(t),cu.Y(t)], board));
};



/****************************************/
/****           PROJECTIONS          ****/
/****************************************/

/**
 * Calculates the coordinates of the projection of a given point on a given circle. I.o.w. the
 * nearest one of the two intersection points of the line through the given point and the circles
 * midpoint.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Circle} circle Circle on that the point is projected.
 * @param {JXG.Board} [board=point.board] Reference to the board
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given circle.
 */
JXG.Math.Geometry.projectPointToCircle = function(point,circle,board) {
    var dist = point.coords.distance(JXG.COORDS_BY_USER, circle.midpoint.coords),
        P = point.coords.usrCoords,
        M = circle.midpoint.coords.usrCoords,
        x, y, factor;

    if(typeof board == 'undefined')
        board = point.board;

    if(Math.abs(dist) < JXG.Math.eps) {
        dist = JXG.Math.eps;
    }
    factor = circle.Radius() / dist;
    x = M[1] + factor*(P[1] - M[1]);
    y = M[2] + factor*(P[2] - M[2]);
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], board);
};

/**
 * Calculates the coordinates of the projection of a given point on a given line. I.o.w. the
 * intersection point of the given line and its perpendicular through the given point.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Line} line Line on that the point is projected.
 * @param {JXG.Board} [board=point.board] Reference to a board.
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given line.
 */
JXG.Math.Geometry.projectPointToLine = function(point, line, board) {
/*
    // Euclidean version
    var fmd = line.point1.coords.usrCoords[2] - line.point2.coords.usrCoords[2];
    var emc = line.point1.coords.usrCoords[1] - line.point2.coords.usrCoords[1];
    var d0 = line.point2.coords.usrCoords[1]*fmd - line.point2.coords.usrCoords[2] *emc;
    var d1 = point.coords.usrCoords[1]*emc + point.coords.usrCoords[2]*fmd;
    var den = fmd*fmd + emc*emc;
    if(Math.abs(den)<JXG.Math.eps) {
        den = JXG.Math.eps;
    }
    var x = (d0*fmd + d1*emc) / den;
    var y = (d1*fmd - d0*emc) /den;
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);       
*/
    // Homogeneous version
    var v = [0,line.stdform[1],line.stdform[2]];
    
    if(typeof board=='undefined')
        board=point.board;
    
    v = JXG.Math.crossProduct(v,point.coords.usrCoords);
    return this.meetLineLine(v,line.stdform,0,board);

    //return new JXG.Coords(JXG.COORDS_BY_USER, v, this.board);       
};

/**
 * Calculates the coordinates of the projection of a given point on a given curve. 
 * Uses {@link #projectCoordsToCurve}.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Curve} graph Curve on that the point is projected.
 * @param {JXG.Board} [board=point.board] Reference to a board.
 * @type JXG.Coords
 * @see #projectCoordsToCurve
 * @return The coordinates of the projection of the given point on the given graph.
 */
JXG.Math.Geometry.projectPointToCurve = function(point,curve,board) {
    if(typeof board=='undefined')
        board = point.board;
        
    var x = point.X(),
        y = point.Y(),
        t = point.position || 0.0, //(curve.minX()+curve.maxX())*0.5,
        result = this.projectCoordsToCurve(x,y,t,curve,board);
        
    point.position = result[1];      // side effect !
    return result[0];
};

/**
 * Calculates the coordinates of the projection of a coordinates pair on a given curve. In case of
 * function graphs this is the
 * intersection point of the curve and the parallel to y-axis through the given point.
 * @param {float} x coordinate to project.
 * @param {float} y coordinate to project.
 * @param {float} start value for newtons method
 * @param {JXG.Curve} graph Curve on that the point is projected.
 * @param {JXG.Board} [board=curve.board] Reference to a board.
 * @type JXG.Coords
 * @see #projectPointToCurve
 * @return Array containing the coordinates of the projection of the given point on the given graph and 
 * the position on the curve.
 */
JXG.Math.Geometry.projectCoordsToCurve = function(x,y,t,curve,board) {
    var newCoords, x0, y0, x1, y1, den, i, mindist, dist, lbda, j,
        infty = 1000000.0, minfunc, tnew, fnew, fold, delta, steps;
        
    if(typeof board=='undefined')
        board = curve.board;
        
    if (curve.curveType=='parameter' || curve.curveType=='polar') { 
        // Function to minimize
        minfunc = function(t){ 
                    var dx = x-curve.X(t),
                        dy = y-curve.Y(t);
                    return dx*dx+dy*dy;
                };
        //t = JXG.Math.Numerics.root(JXG.Math.Numerics.D(minfunc),t);
        fold = minfunc(t);
        steps = 20;
        delta = (curve.maxX()-curve.minX())/steps;
        tnew = curve.minX();
        for (j=0;j<steps;j++) {
            fnew = minfunc(tnew);
            if (fnew<fold) {
                t = tnew;
                fold = fnew;
            }
            tnew += delta;
        }
        t = JXG.Math.Numerics.root(JXG.Math.Numerics.D(minfunc),t);

        if (t<curve.minX()) { t = curve.maxX()+t-curve.minX(); } // Cyclically
        if (t>curve.maxX()) { t = curve.minX()+t-curve.maxX(); }
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [curve.X(t),curve.Y(t)], board);
    } else if (curve.curveType == 'plot') {
        mindist = infty;
        for (i=0;i<curve.numberPoints;i++) {
            x0 = x-curve.X(i);
            y0 = y-curve.Y(i);
            dist = Math.sqrt(x0*x0+y0*y0);
            if (dist<mindist) {
                mindist = dist;
                t = i;
            }
            if (i==curve.numberPoints-1) { continue; }

            x1 = curve.X(i+1)-curve.X(i);
            y1 = curve.Y(i+1)-curve.Y(i);
            den = x1*x1+y1*y1;
            if (den>=JXG.Math.eps) {
                lbda = (x0*x1+y0*y1)/den;
                dist = Math.sqrt( x0*x0+y0*y0 - lbda*(x0*x1+y0*y1) );
            } else {
                lbda = 0.0;
                dist = Math.sqrt(x0*x0+y0*y0);
            }
            if (lbda>=0.0 && lbda<=1.0 && dist<mindist) { 
                t = i+lbda;
                mindist = dist;
            } 
        }
        i = Math.floor(t);
        lbda = t-i;
        if (i<curve.numberPoints-1) {
            x = lbda*curve.X(i+1)+(1.0-lbda)*curve.X(i);
            y = lbda*curve.Y(i+1)+(1.0-lbda)*curve.Y(i);
        } else {
            x = curve.X(i);
            y = curve.Y(i);
        }
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board); 
    } else {             // functiongraph
        t = x;
        x = t; //curve.X(t);
        y = curve.Y(t);
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board); 
    }
    return [curve.updateTransform(newCoords),t];
};

/**
 * Calculates the coordinates of the projection of a given point on a given turtle. A turtle consists of
 * one or more curves of curveType 'plot'. Uses {@link #projectPointToCurve}.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Turtle} turtle on that the point is projected.
 * @param {JXG.Board} [board=point.board] Reference to a board.
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given turtle.
 */
JXG.Math.Geometry.projectPointToTurtle = function(point,turtle,board) {
    var newCoords, t, x, y, i,
        np = 0, 
        npmin = 0,
        mindist = 1000000.0, 
        dist, el, minEl, 
        len = turtle.objects.length;
        
    if(typeof board == 'undefined')
        board = point.board;
    
    for(i=0;i<len;i++) {  // run through all curves of this turtle
        el = turtle.objects[i];
        if (el.elementClass==JXG.OBJECT_CLASS_CURVE) {
            newCoords = this.projectPointToCurve(point,el);
            dist = this.distance(newCoords.usrCoords,point.coords.usrCoords);
            if (dist<mindist) {
                x = newCoords.usrCoords[1];
                y = newCoords.usrCoords[2];
                t = point.position;
                mindist = dist;
                minEl = el;
                npmin = np;
            }
            np += el.numberPoints;
        }
    }
    newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], board);
    point.position = t+npmin;
    return minEl.updateTransform(newCoords);
};


