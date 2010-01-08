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
 * @fileoverview This file contains the class Algebra, a class for calculating algebraic/geometric
 * stuff like intersection points, angles, midpoint, and so on.
 */
 
/**
 * Creates a new instance of Algebra.
 * @class A class for algebraic computations like determining intersection points, angles, midpoints, ...
 * @param board The board the algebra object is associated with.
 * @constructor
 */
JXG.Algebra = function (/** JXG.Board */ board) {
    /**
     * Reference to board.
     * @type JXG.Board
     */
    this.board = board;
    
    /**
     * Defines float precision. Every number <tt>f</tt> with
     * Math.abs(f) < eps is assumed to be zero.
     * @default {@link JXG.Math#eps}
     * @see JXG.Math#eps
     */
    this.eps = JXG.Math.eps;
};

/**
 * Calculates the angle defined by the points A, B, C.
 * @param {JXG.Point,array} A A point  or [x,y] array.
 * @param {JXG.Point,array} B Another point or [x,y] array.
 * @param {JXG.Point,array} C A circle - no, of course the third point or [x,y] array.
 * @type number
 * @return The angle in radian measure.
 * @deprecated Use {@link JXG.Algebra#rad} instead.
 * @see #rad
 * @see #trueAngle
 */
JXG.Algebra.prototype.angle = function(A, B, C) {   
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
    return Math.atan((u*t - v*s)/(u*s + v*t));    
};

/**
 * Calculates the angle defined by the three points A, B, C if you're going from A to C around B counterclockwise.
 * @param A Point or [x,y] array
 * @param B Point or [x,y] array
 * @param C Point or [x,y] array
 * @return The angle in degrees.
 * @see #rad
 */
JXG.Algebra.prototype.trueAngle = function(/** JXG.Point */ A, /** JXG.Point */ B, /** JXG.Point */ C) /** number */ {
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
JXG.Algebra.prototype.rad = function(A,B,C) {
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
 * @return Coordinates of the second point defining the bisection.
 */
JXG.Algebra.prototype.angleBisector = function(/** JXG.Point */ A, /** JXG.Point */ B, /** JXG.Point */ C) /** JXG.Coords */ {
    /* First point */
    var Ac = A.coords.usrCoords,
        Bc = B.coords.usrCoords, 
        Cc = C.coords.usrCoords,
        x = Ac[1]-Bc[1],
        y = Ac[2]-Bc[2],
        d = Math.sqrt(x*x+y*y),
        phiA, phiC, phi;
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
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
};
    
/**
 @private
 @deprecated
 OBSOLETE
 * Calculates the midpoint between two points A and B.
 * @param {JXG.Point} A Point
 * @param {JXG.Point} B Point
 * @type JXG.Coords
 * @return Coordinates of the point right in the middle of two given points.
 */
JXG.Algebra.prototype.midpoint = function(A, B) {   
    return new JXG.Coords(JXG.COORDS_BY_USER, 
                      [(A.coords.usrCoords[0] + B.coords.usrCoords[0])*0.5, 
                       (A.coords.usrCoords[1] + B.coords.usrCoords[1])*0.5, 
                       (A.coords.usrCoords[2] + B.coords.usrCoords[2])*0.5], 
                      this.board);
};

/**
 @private
 @deprecated
 OBSOLETE
 * Calculates the coordinates of a point on the parallel through the given point to the given line through point1 and point2.
 * @param {JXG.Point} point1 First point lying on the given line.
 * @param {JXG.Point} point2 Second point lying on the given line.
 * @param {JXG.Point} point Point through which the parallel is drawn.
 * @type JXG.Coords
 * @return Coordinates of a point defining the parallel together with the given point.
 */
JXG.Algebra.prototype.parallel = function(point1, point2, point) {
    var factor = 1,
        pc = point.coords.usrCoords,
        p1c = point1.coords.usrCoords,
        p2c = point2.coords.usrCoords,
        x = pc[1] + factor*(p2c[1] - p1c[1]),
        y = pc[2] + factor*(p2c[2] - p1c[2]);
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
};

/**
 * Reflects the point along the line.
 * @param {JXG.Line} line Axis of reflection.
 * @param {JXG.Point} point Point to reflect.
 * @type JXG.Coords
 * @return Coordinates of the reflected point.
 */  
JXG.Algebra.prototype.reflection = function(line,point) {
    /* (v,w) defines the slope of the line */    
    var pc = point.coords.usrCoords,
        p1c = line.point1.coords.usrCoords,
        p2c = line.point2.coords.usrCoords,
        x0, y0, x1, y1, v, w, mu;
        
    v = p2c[1]-p1c[1];
    w = p2c[2]-p1c[2];
    
    x0 = pc[1]-p1c[1];
    y0 = pc[2]-p1c[2];
    
    mu = (v*y0-w*x0)/(v*v+w*w);
    
    /* point + mu*(-y,x) waere Lotpunkt */
    x1 = pc[1] + 2*mu*w;
    y1 = pc[2] - 2*mu*v;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], this.board);
};

/**
 * Computes the new position of a point which is rotated 
 * around a second point (called rotpoint) by the angle phi.
 * @param {JXG.Point} rotpoint Center of the rotation
 * @param {JXG.Point} point point to be rotated
 * @param {number} phi rotation angle in arc length
 * @type JXG.Coords
 * @return Coordinates of the new position.
 */
JXG.Algebra.prototype.rotation = function(rotpoint, point, phi) {
    // 180 degrees:
    //var x0 = 2*rotpoint.coords.usrCoords[1]-point.coords.usrCoords[1];
    //var y0 = 2*rotpoint.coords.usrCoords[2]-point.coords.usrCoords[2];
    var pc = point.coords.usrCoords,
        rotpc = rotpoint.coords.usrCoords,
        x0, y0, c, s, x1, y1;
        
    x0 = pc[1]-rotpc[1];
    y0 = pc[2]-rotpc[2];
    
    c = Math.cos(phi);
    s = Math.sin(phi);
    
    x1 = x0*c-y0*s + rotpc[1];
    y1 = x0*s+y0*c + rotpc[2];
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], this.board);
};

/**
 * Calculates the coordinates of a point on the perpendicular to the given line through
 * the given point.
 * @param {JXG.Line} line A line.
 * @param {JXG.Point} point Intersection point of line to perpendicular.
 * @type JXG.Coords
 * @return Coordinates of a point on the perpendicular to the given line through the given point.
 */
JXG.Algebra.prototype.perpendicular = function(line, point) {
    var A = line.point1.coords.usrCoords,
        B = line.point2.coords.usrCoords,
        C = point.coords.usrCoords,
        x, y, change,
        fmd, emc, d0, d1, den;
    
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
    else if( ((Math.abs(A[1] - B[1]) > this.eps) && 
             (Math.abs(C[2] - (A[2] - B[2])*(C[1]-A[1])/(A[1] - B[1])-A[2]) < this.eps)) ||
             ((Math.abs(A[1] - B[1]) <= this.eps) && (Math.abs(A[1] - C[1]) < this.eps)) ) { // Punkt liegt auf der Linie
        x = C[1] + B[2] - C[2];
        y = C[2] - B[1] + C[1]; 
        change = true;
        if(Math.abs(x - C[1]) < this.eps && Math.abs(y - C[2]) < this.eps) {
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
        if(Math.abs(den)<this.eps) {
            den = this.eps;
        }
        x = (d0*fmd + d1*emc) / den;
        y = (d1*fmd - d0*emc) /den;
        change = true;
    }                            
    return [new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board),change];             
};

/**
 * Calculates the midpoint of the circumcircle of the three given points.
 * @param {JXG.Point} point1 Point
 * @param {JXG.Point} point2 Point
 * @param {JXG.Point} point3 Point
 * @type JXG.Coords
 * @return Coordinates of the midpoint of the circumcircle of the given points.
 */
JXG.Algebra.prototype.circumcenterMidpoint = function(point1, point2, point3) {
    var A = point1.coords.usrCoords,
        B = point2.coords.usrCoords,
        C = point3.coords.usrCoords,
        u, v, den, x, y;

    u = ((A[1]-B[1])*(A[1]+B[1]) + (A[2]-B[2])*(A[2]+B[2])) * 0.5;
    v = ((B[1]-C[1])*(B[1]+C[1]) + (B[2]-C[2])*(B[2]+C[2])) * 0.5;
    den = (A[1]-B[1])*(B[2]-C[2]) - (B[1]-C[1])*(A[2]-B[2]);
              
    if (Math.abs(den) < this.eps) {
        den = this.eps;
    }
    
    x = (u * (B[2]-C[2]) - v*(A[2]-B[2])) / den;
    y = (v * (A[1]-B[1]) - u*(B[1]-C[1])) / den;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);
};

/**
 * Calculates the coordinates of the intersection of the given lines.
 * @param {JXG.Line} line1 Line.
 * @param {JXG.Line} line2 Line.
 * @type JXG.Coords
 * @return Coordinates of the intersection point of the given lines.
 */
JXG.Algebra.prototype.intersectLineLine = function(line1, line2) {
    var A = line1.point1.coords.usrCoords,
        B = line1.point2.coords.usrCoords,
        C = line2.point1.coords.usrCoords,
        D = line2.point2.coords.usrCoords,
        d0, d1, den, x, y;
           
    d0 = A[1]*B[2] - A[2]*B[1];
    d1 = C[1]*D[2] - C[2]*D[1];
    den = (B[2]-A[2])*(C[1]-D[1]) - (A[1]-B[1])*(D[2]-C[2]);
                 
    if(Math.abs(den) < this.eps) {
         den = this.eps; 
    }
    x = (d0*(C[1]-D[1]) - d1*(A[1]-B[1])) / den;
    y = (d1*(B[2]-A[2]) - d0*(D[2]-C[2])) / den;

    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);
};

/**
 * Calculates the coordinates of the intersection of the given line and circle.
 * @param {JXG.Circle} circle Circle.
 * @param {JXG.Line} line Line.
 * @type array
 * @return Array of the Coordinates of the intersection points of the given circle with the given line and
 * the amount of intersection points in the first component of the array.
 */
JXG.Algebra.prototype.intersectCircleLine = function(circle, line) {
    var eA = line.point1.coords.usrCoords,
        eB = line.point2.coords.usrCoords,
        fM = circle.midpoint.coords.usrCoords,
        s, d0, d1, b, w, h, r, n1, dx, dy, firstPointX, firstPointY, l, x, y, n1s, firstPoint, secondPoint, d;

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
        if (Math.abs(l) < this.eps) { l = this.eps; }
        x = ((d0 * dy) + (d1 * dx)) / l;
        y = ((d1 * dy) - (d0 * dx)) / l;
        n1s = n1/s;
        firstPoint =  new JXG.Coords(JXG.COORDS_BY_USER, [x + n1s * dx, y + n1s * dy], this.board);
        secondPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x - n1s * dx, y - n1s * dy], this.board);
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
 * @type array
 * @return Array of the Coordinates of the intersection points of the given circles and the
 * amount of intersection points in the first component of the array.
 */
JXG.Algebra.prototype.intersectCircleCircle = function(circle1, circle2) { 
    var intersection = {},
        r1 = circle1.Radius(),
        r2 = circle2.Radius(),
        M1 = circle1.midpoint.coords.usrCoords,
        M2 = circle2.midpoint.coords.usrCoords,
        rSum, rDiff, s, 
        dx, dy, a, h;
        
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
                                             this.board);
            intersection[2] = new JXG.Coords(JXG.COORDS_BY_USER, 
                                             [M1[1] + (a / s) * dx - (h / s) * dy, 
                                              M1[2] + (a / s) * dy + (h / s) * dx], 
                                             this.board);    
        }
        else {
            return [0]; // vorsichtshalber... 
        }                                     
        return intersection;
    }
};

/**
 * Calculates the coordinates of the projection of a given point on a given circle. I.o.w. the
 * nearest one of the two intersection points of the line through the given point and the circles
 * midpoint.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Circle} circle Circle on that the point is projected.
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given circle.
 */
JXG.Algebra.prototype.projectPointToCircle = function(point,circle) {
    var dist = point.coords.distance(JXG.COORDS_BY_USER, circle.midpoint.coords),
        P = point.coords.usrCoords,
        M = circle.midpoint.coords.usrCoords,
        x, y, factor;
        
    if(Math.abs(dist) < this.eps) {
        dist = this.eps;
    }
    factor = circle.Radius() / dist;
    x = M[1] + factor*(P[1] - M[1]);
    y = M[2] + factor*(P[2] - M[2]);
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);    
};

/**
 * Calculates the coordinates of the projection of a given point on a given line. I.o.w. the
 * intersection point of the given line and its perpendicular through the given point.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Line} line Line on that the point is projected.
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given line.
 */
JXG.Algebra.prototype.projectPointToLine = function(point, line) {
/*
    // Euclidean version
    var fmd = line.point1.coords.usrCoords[2] - line.point2.coords.usrCoords[2];
    var emc = line.point1.coords.usrCoords[1] - line.point2.coords.usrCoords[1];
    var d0 = line.point2.coords.usrCoords[1]*fmd - line.point2.coords.usrCoords[2] *emc;
    var d1 = point.coords.usrCoords[1]*emc + point.coords.usrCoords[2]*fmd;
    var den = fmd*fmd + emc*emc;
    if(Math.abs(den)<this.eps) {
        den = this.eps;
    }
    var x = (d0*fmd + d1*emc) / den;
    var y = (d1*fmd - d0*emc) /den;
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);       
*/
    // Homogeneous version
    var mu = this.innerProduct(point.coords.usrCoords,line.stdform,3)/this.innerProduct(line.stdform,line.stdform,3),
        i, v = [];
    for (i=0;i<3;i++) {
        v[i] = point.coords.usrCoords[i] - mu*line.stdform[i];
    }
    return new JXG.Coords(JXG.COORDS_BY_USER, v, this.board);       
};

/**
 * Calculates the coordinates of the projection of a given point on a given curve. 
 * Uses {@link #projectCoordsToCurve}.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Curve} graph Curve on that the point is projected.
 * @type JXG.Coords
 * @see #projectCoordsToCurve
 * @return The coordinates of the projection of the given point on the given graph.
 */
JXG.Algebra.prototype.projectPointToCurve = function(point,curve) {
    var x = point.X(),
        y = point.Y(),
        t = point.position || 0.0,
        result = this.projectCoordsToCurve(x,y,t,curve);
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
 * @type JXG.Coords
 * @see #projectPointToCurve
 * @return Array containing the coordinates of the projection of the given point on the given graph and 
 * the position on the curve.
 */
JXG.Algebra.prototype.projectCoordsToCurve = function(x,y,t,curve) {
    var newCoords, x0, y0, x1, y1, den, i, mindist, dist, lbda,
        infty = 1000000.0;
        
    if (curve.curveType=='parameter' || curve.curveType=='polar') { 
        t = JXG.Math.Numerics.root(JXG.Math.Numerics.D(function(t){ return (x-curve.X(t))*(x-curve.X(t))+(y-curve.Y(t))*(y-curve.Y(t));}), t);
        //if (t<curve.minX()) { t = curve.minX(); }
        //if (t>curve.maxX()) { t = curve.maxX(); }
        if (t<curve.minX()) { t = curve.maxX()+t-curve.minX(); }
        if (t>curve.maxX()) { t = curve.minX()+t-curve.maxX(); }
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [curve.X(t),curve.Y(t)], this.board);
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
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board); 
    } else {             // functiongraph
        t = x;
        x = t; //curve.X(t);
        y = curve.Y(t);
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board); 
    }
    return [curve.updateTransform(newCoords),t];
};

/**
 * Calculates the coordinates of the projection of a given point on a given turtle. A turtle consists of
 * one or more curves of curveType 'plot'. Uses {@link #projectPointToCurve}.
 * @param {JXG.Point} point Point to project.
 * @param {JXG.Turtle} turtle on that the point is projected.
 * @type JXG.Coords
 * @return The coordinates of the projection of the given point on the given turtle.
 */
JXG.Algebra.prototype.projectPointToTurtle = function(point,turtle) {
    var newCoords, t, x, y, i,
        np = 0, 
        npmin = 0,
        mindist = 1000000.0, 
        dist, el, minEl, 
        len = turtle.objects.length;
    
    for(i=0;i<len;i++) {  // run through all curves of this turtle
        el = turtle.objects[i];
        if (el.type==JXG.OBJECT_TYPE_CURVE) {
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
    newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);    
    point.position = t+npmin;
    return minEl.updateTransform(newCoords);
};

/**
 * Converts expression of the form <i>leftop^rightop</i> into <i>Math.pow(leftop,rightop)</i>.
 * @param {String} te Expression of the form <i>leftop^rightop</i>
 * @type String
 * @return Converted expression.
 */
JXG.Algebra.prototype.replacePow = function(te) {
    var count, pos, c,
        leftop, rightop, pre, p, left, i, right, expr;
    //te = te.replace(/\s+/g,''); // Loesche allen whitespace
                                // Achtung: koennte bei Variablennamen mit Leerzeichen
                                // zu Problemen fuehren.
    i = te.indexOf('^');
    while (i>=0) {
        left = te.slice(0,i);
        if (left.charAt(left.length-1)==')') {
            count = 1;
            pos = left.length-2;
            while (pos>=0 && count>0) {
                c = left.charAt(pos);
                if (c==')') { count++; }
                else if (c=='(') { count--; }
                pos--;
            }   
            if (count==0) {
                leftop = '';
                pre = left.substring(0,pos+1);   // finde evtl. F vor (...)^
                p = pos;
                while (p>=0 && pre.substr(p,1).match(/(\w+)/)) {
                    leftop = RegExp.$1+leftop;
                    p--;
                }
                leftop += left.substring(pos+1,left.length);
                leftop = leftop.replace(/([\(\)\+\*\%\^\-\/\]\[])/g,"\\$1");
            }
        } else {
            leftop = '\\w+';
        }
        right = te.slice(i+1);
        if (right.match(/^([\w\.]*\()/)) {
            count = 1;
            pos = RegExp.$1.length;
            while (pos<right.length && count>0) {
                c = right.charAt(pos);
                if (c==')') { count--; }
                else if (c=='(') { count++; }
                pos++;
            }
            if (count==0) {
                rightop = right.substring(0,pos);
                rightop = rightop.replace(/([\(\)\+\*\%\^\-\/\[\]])/g,"\\$1");
            }
        } else {
            rightop = '[\\w\\.]+';  // ^b 
        }
        expr = new RegExp('(' + leftop + ')\\^(' + rightop + ')');
        te = te.replace(expr,"this.board.algebra.pow($1,$2)");
        i = te.indexOf('^');
    }
    return te;
};

/**
 * Converts expression of the form <i>If(a,b,c)</i> into <i>(a)?(b):(c)/i>.
 * @param {String} te Expression of the form <i>If(a,b,c)</i>
 * @type String
 * @return Converted expression.
 */
JXG.Algebra.prototype.replaceIf = function(te) {
    var s = '',
        left, right,
        first = null,
        second = null,
        third = null,
        i, pos, count, k1, k2, c, meat;
    
    i = te.indexOf('If(');
    if (i<0) { return te; }

    te = te.replace(/""/g,'0'); // "" means not defined. Here, we replace it by 0
    while (i>=0) {
        left = te.slice(0,i);
        right = te.slice(i+3); 
        
        // Search the end of the If() command and take out the meat
        count = 1;
        pos = 0;
        k1 = -1;
        k2 = -1;
        while (pos<right.length && count>0) {
            c = right.charAt(pos);
            if (c==')') { 
                count--;
            } else if (c=='(') {
                count++;
            } else if (c==',' && count==1) {
                if (k1<0) { 
                    k1 = pos; // first komma
                } else {
                    k2 = pos; // second komma
                }
            }
            pos++;
        } 
        meat = right.slice(0,pos-1);
        right = right.slice(pos);
        
        // Test the two kommas
        if (k1<0) { return ''; } // , missing
        if (k2<0) { return ''; } // , missing
        
        first = meat.slice(0,k1);
        second = meat.slice(k1+1,k2);
        third = meat.slice(k2+1);
        first = this.replaceIf(first);    // Recurse
        second = this.replaceIf(second);  // Recurse
        third = this.replaceIf(third);    // Recurse

        s += left + '((' + first + ')?' + '('+second+'):('+third+'))';  
        te = right;
        first = null;
        second = null;
        i = te.indexOf('If(');
    }
    s += right;
    return s;
};

/**
 * Replace _{} by &lt;sub&gt;
 * @param {String} te String containing _{}.
 * @type String
 * @return Given string with _{} replaced by &lt;sub&gt;.
 */
JXG.Algebra.prototype.replaceSub = function(te) {
    if(te['indexOf']) {} else return te;

    var i = te.indexOf('_{'),
        j;
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/_\{/,'<sub>');
        j = te.substr(i).indexOf('}');
        if (j>=0) {
            te = te.substr(0,j)+te.substr(j).replace(/\}/,'</sub>');
        }
        i = te.indexOf('_{');
    }

    i = te.indexOf('_');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/_(.?)/,'<sub>$1</sub>');
        i = te.indexOf('_');
    }
    return te;
};

/**
 * Replace ^{} by &lt;sup&gt;
 * @param {String} te String containing ^{}.
 * @type String
 * @return Given string with ^{} replaced by &lt;sup&gt;.
 */
JXG.Algebra.prototype.replaceSup = function(te) {
    if(te['indexOf']) {} else return te;

    var i = te.indexOf('^{'),
        j;
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/\^\{/,'<sup>');
        j = te.substr(i).indexOf('}');
        if (j>=0) {
            te = te.substr(0,j)+te.substr(j).replace(/\}/,'</sup>');
        }
        i = te.indexOf('^{');
    }

    i = te.indexOf('^');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/\^(.?)/,'<sup>$1</sup>');
        i = te.indexOf('^');
    }

    return te;
};

/**
 * Replace an element's name in terms by an element's id.
 * @param term Term containing names of elements.
 * @return The same string with names replaced by ids.
 **/
JXG.Algebra.prototype.replaceNameById = function(/** string */ term) /** string */ {
    var pos = 0, end, elName, el;
    
    pos = term.indexOf('X(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(')',pos+2);
            if (end>=0) {
                elName = term.slice(pos+2,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+2) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(')',pos+2);
        pos = term.indexOf('X(',end);
    }
    pos = term.indexOf('Y(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(')',pos+2);
            if (end>=0) {
                elName = term.slice(pos+2,end);
                elName = elName.replace(/\\(['"])?/g,"$1"); 
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+2) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(')',pos+2);
        pos = term.indexOf('Y(',end);
    }
    pos = term.indexOf('L(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(')',pos+2);
            if (end>=0) {
                elName = term.slice(pos+2,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+2) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(')',pos+2);
        pos = term.indexOf('L(',end);
    }

    pos = term.indexOf('Dist(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(',',pos+5);
            if (end>=0) {
                elName = term.slice(pos+5,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+5) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(',',pos+5);
        pos = term.indexOf(',',end);
        end = term.indexOf(')',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = this.board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(')',pos+1);
        pos = term.indexOf('Dist(',end);
    }

    pos = term.indexOf('Deg(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(',',pos+4);
            if (end>=0) {
                elName = term.slice(pos+4,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+4) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(',',pos+4);
        pos = term.indexOf(',',end);
        end = term.indexOf(',',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = this.board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(',',pos+1);
        pos = term.indexOf(',',end);
        end = term.indexOf(')',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = this.board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(')',pos+1);
        pos = term.indexOf('Deg(',end);
    }

    pos = term.indexOf('Rad(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(',',pos+4);
            if (end>=0) {
                elName = term.slice(pos+4,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = this.board.elementsByName[elName];
                term = term.slice(0,pos+4) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(',',pos+4);
        pos = term.indexOf(',',end);
        end = term.indexOf(',',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = this.board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(',',pos+1);
        pos = term.indexOf(',',end);
        end = term.indexOf(')',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = this.board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(')',pos+1);
        pos = term.indexOf('Rad(',end);
    }

    return term;
};

/**
 * Replaces element ids in terms by element this.board.objects['id'].
 * @param term A GEONE<sub>x</sub>T function string with JSXGraph ids in it.
 * @return The input string with element ids replaced by this.board.objects["id"]. 
 **/
JXG.Algebra.prototype.replaceIdByObj = function(/** string */ term) /** string */ {
    var expr = /(X|Y|L)\(([\w_]+)\)/g;  // Suche "X(gi23)" oder "Y(gi23A)" und wandle in objects['gi23'].X() um.
    term = term.replace(expr,"this.board.objects[\"$2\"].$1()");

    expr = /(Dist)\(([\w_]+),([\w_]+)\)/g;  // 
    term = term.replace(expr,'this.board.objects[\"$2\"].Dist(this.board.objects[\"$3\"])');

    expr = /(Deg)\(([\w_]+),([ \w\[\w_]+),([\w_]+)\)/g;  // 
    term = term.replace(expr,'this.board.algebra.trueAngle(this.board.objects[\"$2\"],this.board.objects[\"$3\"],this.board.objects[\"$4\"])');

    expr = /Rad\(([\w_]+),([\w_]+),([\w_]+)\)/g;  // Suche Rad('gi23','gi24','gi25')
    term = term.replace(expr,'this.board.algebra.rad(this.board.objects[\"$1\"],this.board.objects[\"$2\"],this.board.objects[\"$3\"])');
    return term;
};

/**
 * Converts the given algebraic expression in GEONE<sub>x</sub>T syntax into an equivalent expression in JavaScript syntax.
 * @param {String} term Expression in GEONExT syntax
 * @type String
 * @return Given expression translated to JavaScript.
 */
JXG.Algebra.prototype.geonext2JS = function(term) {
    var expr, newterm, i,
        from = ['Abs','ACos','ASin','ATan','Ceil','Cos','Exp','Floor','Log','Max','Min','Pow','Random','Round','Sin','Sqrt','Tan','Trunc'], 
        to = ['Math.abs', 'Math.acos', 'Math.asin', 'Math.atan', 'Math.ceil', 'Math.cos', 'Math.exp', 'Math.floor', 'Math.log', 'Math.max', 'Math.min', 'Math.pow', 'Math.random', 'this.board.round', 'Math.sin', 'Math.sqrt', 'Math.tan', 'Math.ceil'];
        
    //term = JXG.unescapeHTML(term);  // This replaces &gt; by >, &lt; by < and &amp; by &.ist aber zu allgemein
    term = term.replace(/&lt;/g,'<'); // Hacks, to enable not well formed XML, @see GeonextReader#replaceLessThan
    term = term.replace(/&gt;/g,'>'); 
    term = term.replace(/&amp;/g,'&'); 
    
    // Umwandeln der GEONExT-Syntax in JavaScript-Syntax
    newterm = term;
    newterm = this.replaceNameById(newterm);
    newterm = this.replaceIf(newterm);
    // Exponentiations-Problem x^y -> Math(exp(x,y).
    newterm = this.replacePow(newterm);
    newterm = this.replaceIdByObj(newterm);
    
    for (i=0; i<from.length; i++) {
        expr = new RegExp(from[i],"g");
        newterm = newterm.replace(expr,to[i]);
    }    

    newterm = newterm.replace(/True/g,'true');
    newterm = newterm.replace(/False/g,'false');
    newterm = newterm.replace(/fasle/g,'false');

    newterm = newterm.replace(/Pi/g,'Math.PI');
    return newterm;
};

/**
 * Finds dependencies in a given term and resolves them by adding the
 * dependent object to the found objects child elements.
 * @param {JXG.GeometryElement} me Object depending on objects in given term.
 * @param {String} term String containing dependencies for the given object.
 */
JXG.Algebra.prototype.findDependencies = function(me, term) {
    var elements = this.board.elementsByName,
        el, expr, elmask;
        
    for (el in elements) {
        if (el != me.name) {
            if(elements[el].type == JXG.OBJECT_TYPE_TEXT) {
                if(!elements[el].isLabel) {
                    elmask = el.replace(/\[/g,'\\[');
                    elmask = elmask.replace(/\]/g,'\\]');
                    expr = new RegExp("\\(\(\[\\w\\[\\]'_ \]+,\)*\("+elmask+"\)\(,\[\\w\\[\\]'_ \]+\)*\\)","g");  // Searches (A), (A,B),(A,B,C)
                    if (term.search(expr)>=0) {
                        elements[el].addChild(me);
                    }
                }
            }
            else {
                elmask = el.replace(/\[/g,'\\[');
                elmask = elmask.replace(/\]/g,'\\]');
                expr = new RegExp("\\(\(\[\\w\\[\\]'_ \]+,\)*\("+elmask+"\)\(,\[\\w\\[\\]'_ \]+\)*\\)","g");  // Searches (A), (A,B),(A,B,C)
                if (term.search(expr)>=0) {
                    elements[el].addChild(me);
                }
            }
        }
    }
};

/**
 * Calculates euclidean norm for two given arrays of the same length.
 * @param {array} array1 Array of float or integer.
 * @param {array} array2 Array of float or integer.
 * @type number
 * @return Euclidean distance of the given vectors.
 */
JXG.Algebra.prototype.distance = function(array1, array2) {
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
JXG.Algebra.prototype.affineDistance = function(array1, array2) {
    var d;
    if(array1.length != array2.length) { 
        return; 
    }
    d = this.distance(array1, array2);
    if (d>this.eps && (Math.abs(array1[0])<this.eps || Math.abs(array2[0])<this.eps)) {
        return Infinity;
    } else {
        return d;
    }
};

/**
 * Matrix-vector multiplication.
 * @param mat1 Two dimensional array of numbers
 * @param vec Array of numbers
 * @return Array of numbers containing result
 * @deprecated moved to JXG.Math
 */
/* 
JXG.Algebra.prototype.matVecMult = function(mat1, array vec) array  {
    var m = mat1.length,
        n = vec.length,
        res = [],
        i, s, k;
    for (i=0;i<m;i++) {
        s = 0;
        for (k=0;k<n;k++) {
            s += mat1[i][k]*vec[k];
        }
        res[i] = s;
    }
    return res;
};
*/

/**
 * Matrix-matrix multiplication.
 * @param mat1 Two dimensional array of numbers
 * @param mat2 Two dimensional array of numbers
 * @return Two dimensional Array of numbers containing result
 * @deprecated moved to JXG.Math
 */
/* 
JXG.Algebra.prototype.matMatMult = function(mat1, mat2){
    var m = mat1.length,
        n = mat2[0].length,
        m2 = mat2.length,
        res = [], 
        i, j, s, k;
        
    for (i=0;i<m;i++) {
        res[i] = [];
    }

    for (i=0;i<m;i++) {
        for (j=0;j<n;j++) {
            s = 0;
            for (k=0;k<m2;k++) {
                s += mat1[i][k]*mat2[k][j];
            }
            res[i][j] = s;
        }
    }
    return res;
};
*/


/**
 * Converts a string containing either <strong>true</strong> or <strong>false</strong> into a boolean value.
 * @param s String containing either <strong>true</strong> or <strong>false</strong>.
 * @return String typed boolean value converted to boolean.
 */
JXG.Algebra.prototype.str2Bool = function(/** string */ s) /** boolean */ {
    if (s==undefined || s==null) {
        return true;
    }
    if (typeof s == 'boolean') { 
        return s;
    }
    if (s.toLowerCase()!='true') {
        return false;
    } else {
        return true;
    }
};

/**
 * Compute power a^b
 * @param a Base.
 * @param b Exponent.
 * @return a to the power of b.
 */
JXG.Algebra.prototype.pow = function(/** number */ a, /** number */ b) /** number */ {
    if (a==0 || b==0) { 
        return 1;
    }
    if (Math.floor(b)==b) {// b is integer
        return Math.pow(a,b);
    } else { // b is not integer
        if (a>0) {
            return Math.exp(b*Math.log(Math.abs(a)));
        } else {
            return NaN;
        }
    }
};

/**
  * Calculates the crossproducts of two vectors
  * of length three.
  * In case of homogeneous coordinates this is either
  * - the intersection of two lines
  * - the line through two points.
  * @param {Array} c1 homogeneous coordinates of line (point) 1
  * @param {Array} c2 homogeneous coordinates of line (point) 2
  * @type Array
  * @return vector of length 3:  homogeneous coordinates
  *   of the resulting line / point.
  */
JXG.Algebra.prototype.crossProduct = function(c1,c2) {
    return [c1[1]*c2[2]-c1[2]*c2[1],
            c1[2]*c2[0]-c1[0]*c2[2],
            c1[0]*c2[1]-c1[1]*c2[0]];
};

/**
 * Inner product of two vectors a, b. n is the length of the vectors.
 * @param a Vector
 * @param b Vector
 * @param [n] Length of the Vectors. If not given the length of the first vector is taken.
 * @return The inner product of a and b.
 */JXG.Algebra.prototype.innerProduct = function(a, b, n) {    
    var i, s = 0;
    
    if(typeof n == 'undefined')
    	n = a.length;
    
    for (i=0;i<n;i++) {
        s += a[i]*b[i];
    }
    return s;
};

/**
 * 
 * @private
 * Computes the intersection of a pair of lines, circles or both.
 * It uses the internal data array stdform of these elements.
 * @param {Array} el1 stdform of the first element (line or circle)
 * @param {Array} el2 stdform of the second element (line or circle)
 * @param {number} i Index of the intersection point that should be returned.
 * @type JXG.Coords
 * @return Coordinates of one of the possible two or more intersection points. 
 * Which point will be returned is determined by i.
 */
JXG.Algebra.prototype.meet = function(el1, el2, /** number */ i) /** JXG.Coords */ {
    var eps = this.eps; //    var eps = 0.000001;

    if (Math.abs(el1[3])<eps && Math.abs(el2[3])<eps) { // line line
        return this.meetLineLine(el1,el2,i);
    } else if (Math.abs(el1[3])>=eps && Math.abs(el2[3])<eps) { // circle line
        return this.meetLineCircle(el2,el1,i);
    } else if (Math.abs(el1[3])<eps && Math.abs(el2[3])>=eps) { // line circle
        return this.meetLineCircle(el1,el2,i);
    } else {  // circle circle
        return this.meetCircleCircle(el1,el2,i);
    }
};

/**
  * @private
  * 
  * Intersection of two lines using the stdform.
  * @param {Array} l1 stdform of the first line
  * @param {Array} l2 stdform of the second line
  * @param {number} i unused
  * @type JXG.Coords
  * @return Coordinates of the intersection point.
  */
JXG.Algebra.prototype.meetLineLine = function(l1,l2,i) {
    var s = this.crossProduct(l1,l2);
    if (Math.abs(s[0])>this.eps) {
        s[1] /= s[0];
        s[2] /= s[0];
        s[0] = 1.0;
    }
    return new JXG.Coords(JXG.COORDS_BY_USER, s, this.board);
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
  * @type JXG.Coords
  * @return Coordinates of the intersection point
  */
 JXG.Algebra.prototype.meetLineCircle = function(lin,circ,i) {    
    var a,b,c,d,n, A,B,C, k,t;

    if (circ[4]<this.eps) { // Radius is zero, return center of circle
        return new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(1,3), this.board);
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
            ? new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0],-t[0]*n[0]-d*n[1]], this.board)
            : new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0],-t[1]*n[0]-d*n[1]], this.board)
            );
/*
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0]/nn,-t[0]*n[0]-d*n[1]/nn], this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0]/nn,-t[1]*n[0]-d*n[1]/nn], this.board)
*/
    } else {
        return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board);
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
  * @type JXG.Coords
  * @return Coordinates of the intersection point
  */
JXG.Algebra.prototype.meetCircleCircle = function(circ1,circ2,i) {
    var radicalAxis;
    if (circ1[4]<this.eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ1.slice(1,3),circ2.slice(1,3))==circ2[4]) {
            return new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(1,3), this.board);
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board);
        }
    }
    if (circ2[4]<this.eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ2.slice(1,3),circ1.slice(1,3))==circ1[4]) {
            return new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(1,3), this.board);
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board);
        }
    }
    radicalAxis = [circ2[3]*circ1[0]-circ1[3]*circ2[0],
                   circ2[3]*circ1[1]-circ1[3]*circ2[1],
                   circ2[3]*circ1[2]-circ1[3]*circ2[2],
                   0,1,Infinity, Infinity, Infinity];
    radicalAxis = this.normalize(radicalAxis);
    return this.meetLineCircle(radicalAxis,circ1,i);
    // Returns do not work with homogeneous coordinates, yet
};

/**
  * @private
  *
  * Normalize the stdform [c,b0,b1,a,k,r,q0,q1].
  * @param {Array} stdform to be normalized.
  * @type {Array}
  * @return The normalized stdform.
  */
JXG.Algebra.prototype.normalize = function(stdform) {
    var a2 = 2*stdform[3],
        r = stdform[4]/(a2),  // k/(2a)
        n, signr; 
    stdform[5] = r;
    stdform[6] = -stdform[1]/a2;
    stdform[7] = -stdform[2]/a2;
    if (r==Infinity || isNaN(r)) {
        n = Math.sqrt(stdform[1]*stdform[1]+stdform[2]*stdform[2]);
        stdform[0] /= n;
        stdform[1] /= n;
        stdform[2] /= n;
        stdform[3] = 0;
        stdform[4] = 1;
    } else if (Math.abs(r)>=1) {
        stdform[0] = (stdform[6]*stdform[6]+stdform[7]*stdform[7]-r*r)/(2*r);
        stdform[1] = -stdform[6]/r;
        stdform[2] = -stdform[7]/r;
        stdform[3] = 1/(2*r);
        stdform[4] = 1;
    } else {
        signr = (r<=0)?(-1):(1/*(r==0)?0:1*/);
        stdform[0] = signr*(stdform[6]*stdform[6]+stdform[7]*stdform[7]-r*r)*0.5;
        stdform[1] = -signr*stdform[6];
        stdform[2] = -signr*stdform[7];
        stdform[3] = signr/2;
        stdform[4] = signr*r;
    }
    return stdform;
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
 * d = c2_y'(t2)
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
 * @param {JXG.Curve} c1: Curve, Line or Circle
 * @param {JXG.Curve} c2: Curve, Line or Circle
 * @param {float} t1ini: start value for t1
 * @param {float} t2ini: start value for t2
 * @type {JXG.Coords}
 * @return coordinate object for the intersection point
 **/
JXG.Algebra.prototype.meetCurveCurve = function(c1,c2,t1ini,t2ini) {
    var count = 0,
        t1, t2,
        a, b, c, d, disc,
        e, f, F, 
        D00, D01, 
        D10, D11;
        
    if (arguments.callee.t1memo) {
        t1 = arguments.callee.t1memo;
        t2 = arguments.callee.t2memo;
    } else {
        t1 = t1ini;
        t2 = t2ini;
    }
    if (t1>c1.maxX()) { t1 = c1.maxX(); }
    if (t1<c1.minX()) { t1 = c1.minX(); }
    if (t2>c2.maxX()) { t2 = c2.maxX(); }
    if (t2<c2.minX()) { t2 = c2.minX(); }
    e = c1.X(t1)-c2.X(t2);
    f = c1.Y(t1)-c2.Y(t2);
    F = e*e+f*f;
    
    D00 = c1.board.D(c1.X,c1);
    D01 = c2.board.D(c2.X,c2);
    D10 = c1.board.D(c1.Y,c1);
    D11 = c2.board.D(c2.Y,c2);
//$('debug').innerHTML = t1+' '+t2+'<br>\n';
    
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
//$('debug').innerHTML += [a,b,c,d].join(':')+'['+disc+'], '+t1+' '+t2+ ' '+count+'<br>\n ';
    }

    arguments.callee.t1memo = t1;
    arguments.callee.t2memo = t2;
//    $('debug').innerHTML = arguments.callee.t1memo+' '+arguments.callee.t1memo+ ' '+count;
    //return (new JXG.Coords(JXG.COORDS_BY_USER, [2,2], this.board));
    if (Math.abs(t1)<Math.abs(t2)) {
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c1.X(t1),c1.Y(t1)], this.board));
    } else {
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c2.X(t2),c2.Y(t2)], this.board));
    }
};
