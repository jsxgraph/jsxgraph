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






/****************************************/
/****           PROJECTIONS          ****/
/****************************************/







