/*
    Copyright 2008, 
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
 * @fileoverview In this file the class Algebra is defined, a class for
 * managing algebraic computation like intersections and midpoints etc.
 * @author graphjs
 */
 
/**
 * Creates a new instance of Algebra.
 * @class In this class all algebraic computation is done.
 * @constructor
 */
JXG.Algebra = function (board) {
    /**
     * Reference to board.
     * @type Board
     */
    this.board = board;
    
    /**
     * Defines float precision. Everything with abs(f) < eps is assumed being zero.
     */
    this.eps = 0.00001;
};

/**
 * Calculates the angle between the points A, B, C.
 * @param {Point} A A point  or [x,y] array.
 * @param {Point} B Another point or [x,y] array.
 * @param {Point} C A circle - no, of course the third point or [x,y] array.
 * @type float
 * @return The angle in radian measure
 */
JXG.Algebra.prototype.angle = function(A, B, C) {   
    var a = [];
    var b = [];
    var c = [];
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
    var u = a[0] - b[0];
    var v = a[1] - b[1];
    var s = c[0] - b[0];
    var t = c[1] - b[1];
/*
    var u = A.coords.usrCoords[1] - B.coords.usrCoords[1];
    var v = A.coords.usrCoords[2] - B.coords.usrCoords[2];
    var s = C.coords.usrCoords[1] - B.coords.usrCoords[1];
    var t = C.coords.usrCoords[2] - B.coords.usrCoords[2];
*/
    var theta = Math.atan((u*t - v*s)/(u*s + v*t));    

    return theta;
};

/**
 * Calculates the internal angle between the three points A, B, C
 * @param {Point} A Point or [x,y] array
 * @param {Point} B Point or [x,y] array
 * @param {Point} C Point or [x,y] array
 * @type float
 * @return Angle in degrees.
 */
JXG.Algebra.prototype.trueAngle = function(A, B, C){
    var ax;
    var ay;
    var bx;
    var by;
    var cx;
    var cy;
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
    var sp = (cx - bx) * (ax - bx) + (cy - by) * (ay - by); // scalar product of c-b and a-b
        var cp = (ax - bx) * (cy - by) - (ay - by) * (cx - bx); // cross product of a-b c-b
        var l1 = Math.sqrt((ax - bx)*(ax - bx) + (ay - by)*(ay - by)); // length of a-b
        var l2 = Math.sqrt((cx - bx)*(cx - bx) + (cy - by)*(cy - by)); // length of c-b
        var phiacos = sp / (l1 * l2); // calculate the angle as cosine from scalar product
        if (phiacos > 1) { // these things should not happen, but can happen because of numerical inaccurracy
            phiacos = 1;
        } else if (phiacos < -1) {
            phiacos = -1;
        }
        var phicos = Math.acos(phiacos); // calculate the angle
        var phi = 0;
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
            phi = 2 * Math.PI - phicos;
        } else {
            phi = phicos;
        }
        phi = (phi / Math.PI) * 180;
    return phi;
};

/**
 * Calculates the bisection between the three points A, B, C. The bisection is defined by two points:
 * Parameter B and a point with the coordinates calculated in this function.
 * @param {Point} A Point
 * @param {Point} B Point
 * @param {Point} C Point
 * @type Coords
 * @return Coordinates of the second point defining the bisection.
 */
JXG.Algebra.prototype.angleBisector = function(A, B, C) {
    /* First point */
    var x = A.coords.usrCoords[1]-B.coords.usrCoords[1];
    var y = A.coords.usrCoords[2]-B.coords.usrCoords[2];
    var d = Math.sqrt(x*x+y*y);
    x /= d;
    y /= d;
    var phiA = Math.acos(x);
    if (y<0) { phiA *= -1; }
    if (phiA<0) { phiA += 2*Math.PI; } 
    
    /* Second point */
    x = C.coords.usrCoords[1]-B.coords.usrCoords[1];
    y = C.coords.usrCoords[2]-B.coords.usrCoords[2];
    d = Math.sqrt(x*x+y*y);
    x /= d;
    y /= d;
    var phiC = Math.acos(x);
    if (y<0) {phiC *= -1;}
    if (phiC<0) { phiC += 2*Math.PI; } 
 
    var phi=(phiA+phiC)*0.5;
    if (phiA>phiC) { 
        phi+=Math.PI;
    }

    x = Math.cos(phi)+B.coords.usrCoords[1];
    y = Math.sin(phi)+B.coords.usrCoords[2];
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
};
    
/**
 * Calculates the midpoint between two points A and B.
 * @param {Point} A Point
 * @param {Point} B Point
 * @type Coords
 * @return Coordinates of the point right in the middle of two given points.
 */
JXG.Algebra.prototype.midpoint = function(A, B) {   
    return new JXG.Coords(JXG.COORDS_BY_USER, 
                      [(A.coords.usrCoords[1] + B.coords.usrCoords[1])/2, (A.coords.usrCoords[2] + B.coords.usrCoords[2])/2], 
                      this.board);
};

/**
 * Calculates the coordinates of a point on the parallel through the given point to the given line through point1 and point2.
 * @param {Point1} point
 * @param {Point2} point 
 * @param {Point} point Point
 * @type Coords
 * @return Coordinates of a point defining the parallel together with the given point.
 */
JXG.Algebra.prototype.parallel = function(point1, point2, point) {
    var factor = 1;
    var x = point.coords.usrCoords[1] + factor*(point2.coords.usrCoords[1] - point1.coords.usrCoords[1]);
    var y = point.coords.usrCoords[2] + factor*(point2.coords.usrCoords[2] - point1.coords.usrCoords[2]);
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
};

/**
 * Reflects the point along the line.
 * @param {Line} line Axis of reflection.
 * @param {Point} point Point to reflect.
 * @type Coords
 * @return Coordinates of the reflected point.
 */  
JXG.Algebra.prototype.reflection = function(line,point) {
    /* (v,w) defines the slope of the line */    
    var v = line.point2.coords.usrCoords[1]-line.point1.coords.usrCoords[1];
    var w = line.point2.coords.usrCoords[2]-line.point1.coords.usrCoords[2];
    
    var x0 = point.coords.usrCoords[1]-line.point1.coords.usrCoords[1];
    var y0 = point.coords.usrCoords[2]-line.point1.coords.usrCoords[2];
    
    var mu = (v*y0-w*x0)/(v*v+w*w);
    
    /* point + mu*(-y,x) waere Lotpunkt */
    var x1 = point.coords.usrCoords[1] + 2*mu*w;
    var y1 = point.coords.usrCoords[2] - 2*mu*v;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], this.board);
};

/**
 * !!! ToDo
 * @type Coords
 */
JXG.Algebra.prototype.rotation = function(rotpoint, point, phi) {
    // 180 degrees:
    //var x0 = 2*rotpoint.coords.usrCoords[1]-point.coords.usrCoords[1];
    //var y0 = 2*rotpoint.coords.usrCoords[2]-point.coords.usrCoords[2];
    var x0 = point.coords.usrCoords[1]-rotpoint.coords.usrCoords[1];
    var y0 = point.coords.usrCoords[2]-rotpoint.coords.usrCoords[2];
    var x1, y1;
    var c = Math.cos(phi);
    var s = Math.sin(phi);
    
    x1 = x0*c-y0*s + rotpoint.coords.usrCoords[1];
    y1 = x0*s+y0*c + rotpoint.coords.usrCoords[2];
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x1,y1], this.board);
};

/**
 * Calculates the coordinates of a point on the perpendicular to the given line through
 * the given point.
 * @param {Line} line Line.
 * @param {Point} point Intersection point of line to perpendicular.
 * @type Coords
 * @return Coordinates of a point on the perpendicular to the given line through the given point.
 */
JXG.Algebra.prototype.perpendicular = function(line, point) {
    var x;
    var y;
    var change;
    
    var A = line.point1.coords;
    var B = line.point2.coords;
    var C = point.coords;
    if(point == line.point1) { // Punkt ist erster Punkt der Linie
        x = A.usrCoords[1] + B.usrCoords[2] - A.usrCoords[2];
        y = A.usrCoords[2] - B.usrCoords[1] + A.usrCoords[1];
        change = true;
    }
    else if(point == line.point2) {  // Punkt ist zweiter Punkt der Linie    
        x = B.usrCoords[1] + A.usrCoords[2] - B.usrCoords[2];
        y = B.usrCoords[2] - A.usrCoords[1] + B.usrCoords[1];
        change = false;
    }
    else if( ((Math.abs(A.usrCoords[1] - B.usrCoords[1]) > this.eps) && 
             (Math.abs(C.usrCoords[2] - (A.usrCoords[2] - B.usrCoords[2])*(C.usrCoords[1]-A.usrCoords[1])/(A.usrCoords[1] - B.usrCoords[1])-A.usrCoords[2]) < this.eps)) ||
             ((Math.abs(A.usrCoords[1] - B.usrCoords[1]) <= this.eps) && (Math.abs(A.usrCoords[1] - C.usrCoords[1]) < this.eps)) ) { // Punkt liegt auf der Linie
        x = C.usrCoords[1] + B.usrCoords[2] - C.usrCoords[2];
        y = C.usrCoords[2] - B.usrCoords[1] + C.usrCoords[1]; 
        change = true;
        if(Math.abs(x - C.usrCoords[1]) < this.eps && Math.abs(y - C.usrCoords[2]) < this.eps) {
            x = C.usrCoords[1] + A.usrCoords[2] - C.usrCoords[2];
            y = C.usrCoords[2] - A.usrCoords[1] + C.usrCoords[1];
            change = false;
        }
    }
    else { // Punkt liegt nicht auf der Linie -> als zweiter Punkt wird der Lotfusspunkt gewaehlt
        var fmd = line.point1.coords.usrCoords[2] - line.point2.coords.usrCoords[2];
        var emc = line.point1.coords.usrCoords[1] - line.point2.coords.usrCoords[1];
        var d0 = line.point2.coords.usrCoords[1]*fmd - line.point2.coords.usrCoords[2] *emc;
        var d1 = point.coords.usrCoords[1]*emc + point.coords.usrCoords[2]*fmd;
        var den = fmd*fmd + emc*emc;
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
 * Calculates the midpoint of the circumcircle of the given points.
 * @param {Point} point1 Point
 * @param {Point} point2 Point
 * @param {Point} point3 Point
 * @type Coords
 * @return Coordinates of the midpoint of the circumcircle of the given points.
 */
JXG.Algebra.prototype.circumcenterMidpoint = function(point1, point2, point3) {
    var u = ((point1.coords.usrCoords[1]-point2.coords.usrCoords[1])*(point1.coords.usrCoords[1]+point2.coords.usrCoords[1]) + 
             (point1.coords.usrCoords[2]-point2.coords.usrCoords[2])*(point1.coords.usrCoords[2]+point2.coords.usrCoords[2])) / 2.0;
    var v = ((point2.coords.usrCoords[1]-point3.coords.usrCoords[1])*(point2.coords.usrCoords[1]+point3.coords.usrCoords[1]) + 
             (point2.coords.usrCoords[2]-point3.coords.usrCoords[2])*(point2.coords.usrCoords[2]+point3.coords.usrCoords[2])) / 2.0;
    var den = (point1.coords.usrCoords[1]-point2.coords.usrCoords[1])*(point2.coords.usrCoords[2]-point3.coords.usrCoords[2]) - 
              (point2.coords.usrCoords[1]-point3.coords.usrCoords[1])*(point1.coords.usrCoords[2]-point2.coords.usrCoords[2]);
              
    if (Math.abs(den) < this.eps) {
        den = this.eps;
    }
    
    var x = (u * (point2.coords.usrCoords[2]-point3.coords.usrCoords[2]) - v*(point1.coords.usrCoords[2]-point2.coords.usrCoords[2])) / den;
    var y = (v * (point1.coords.usrCoords[1]-point2.coords.usrCoords[1]) - u*(point2.coords.usrCoords[1]-point3.coords.usrCoords[1])) / den;
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);
};

/**
 * Calculates the coordinates of the intersection of the given lines.
 * @param {Line} line1 Line.
 * @param {Line} line2 Line.
 * @type Coords
 * @return Coordinates of the intersection point of the given lines.
 */
JXG.Algebra.prototype.intersectLineLine = function(line1, line2) {
    var d0 = line1.point1.coords.usrCoords[1]*line1.point2.coords.usrCoords[2] - line1.point1.coords.usrCoords[2]*line1.point2.coords.usrCoords[1];
    var d1 = line2.point1.coords.usrCoords[1]*line2.point2.coords.usrCoords[2] - line2.point1.coords.usrCoords[2]*line2.point2.coords.usrCoords[1];
    var den = (line1.point2.coords.usrCoords[2]-line1.point1.coords.usrCoords[2])*(line2.point1.coords.usrCoords[1]-line2.point2.coords.usrCoords[1]) 
               - (line1.point1.coords.usrCoords[1]-line1.point2.coords.usrCoords[1])*(line2.point2.coords.usrCoords[2]-line2.point1.coords.usrCoords[2]);
                 
    if(Math.abs(den) < this.eps) {
         den = this.eps; 
    }
    var x = (d0*(line2.point1.coords.usrCoords[1]-line2.point2.coords.usrCoords[1]) - d1*(line1.point1.coords.usrCoords[1]-line1.point2.coords.usrCoords[1])) / den;
    var y = (d1*(line1.point2.coords.usrCoords[2]-line1.point1.coords.usrCoords[2]) - d0*(line2.point2.coords.usrCoords[2]-line2.point1.coords.usrCoords[2])) / den;

    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);
};

/**
 * Calculates the coordinates of the intersection of the given line and circle.
 * @param {Circle} circle Circle.
 * @param {Line} line Line.
 * @type Array
 * @return Array of the Coordinates of the intersection points of the given circle with the given line and
 * the amount of intersection points in the first component of the array.
 */
JXG.Algebra.prototype.intersectCircleLine = function(circle, line) {
    var eA = line.point1;
    var eB = line.point2;
    var fM = circle.midpoint;

    s = eA.Dist(eB);
    if (s > 0) {
        var d0 = fM.Dist(eA);
        var d1 = fM.Dist(eB);
        var b = ((d0 * d0) + (s * s) - (d1 * d1)) / (2 * s);
        var w = (d0 * d0) - (b * b);
        w = (w < 0) ? 0 : w;
        var h = Math.sqrt(w);
        var r = circle.getRadius();
        var n1 = Math.sqrt((r * r) - h*h);
        var dx = eB.coords.usrCoords[1] - eA.coords.usrCoords[1];
        var dy = eB.coords.usrCoords[2] - eA.coords.usrCoords[2];
        var firstPointX = fM.coords.usrCoords[1] + (h / s) * dy;
        var firstPointY = fM.coords.usrCoords[2] - (h / s) * dx;
        d0 = (eB.coords.usrCoords[1] * dy) - (eB.coords.usrCoords[2] * dx);
        d1 = (firstPointX * dx) + (firstPointY * dy);
        var l = (dy * dy) + (dx * dx);
        if (Math.abs(l) < this.eps) { l = this.eps; }
        var x = ((d0 * dy) + (d1 * dx)) / l;
        var y = ((d1 * dy) - (d0 * dx)) / l;
        var n1s = n1/s;
        var firstPoint =  new JXG.Coords(JXG.COORDS_BY_USER, [x + n1s * dx, y + n1s * dy], this.board);
        var secondPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x - n1s * dx, y - n1s * dy], this.board);
        var d = fM.coords.distance(JXG.COORDS_BY_USER, firstPoint);
      
        if ((r < (d - 1)) || isNaN(d)) {
            return [0];
        } else {
            return [2,firstPoint,secondPoint];       
        }
    }
};
  
JXG.Algebra.prototype.intersectCircleLineOrg = function(circle, line) {
    var intersection = {};
    var eA = line.point1;
    var eB = line.point2;
    var fM = circle.midpoint;

    s = eA.Dist(eB);
    if (s > 0) {
        var d0 = fM.Dist(eA);
        var d1 = fM.Dist(eB);
        var b = ((d0 * d0) + (s * s) - (d1 * d1)) / (2 * s);
        var w = (d0 * d0) - (b * b);
        w = (w < 0) ? 0 : w;
        var h = Math.sqrt(w);
        var r = circle.getRadius();
        var n1 = Math.sqrt((r * r) - (h * h));
        var dx = eB.X() - eA.X();
        var dy = eB.Y() - eA.Y();
        var firstPoint = new JXG.Coords(JXG.COORDS_BY_USER, [fM.X() + (h / s) * dy, fM.Y() - (h / s) * dx], this.board);
        d0 = (eB.X() * dy) - (eB.Y() * dx);
        d1 = (firstPoint.usrCoords[1] * dx) + (firstPoint.usrCoords[2] * dy);
        var l = (dy * dy) + (dx * dx);
        if (Math.abs(l) < this.eps) { l = this.eps; }
        var x = ((d0 * dy) + (d1 * dx)) / l;
        var y = ((d1 * dy) - (d0 * dx)) / l;
        firstPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x + (n1 / s) * dx, y + (n1 / s) * dy], this.board);
        var secondPoint = new JXG.Coords(JXG.COORDS_BY_USER, [x - (n1 / s) * dx, y - (n1 / s) * dy], this.board);
        var d = fM.coords.distance(JXG.COORDS_BY_USER, firstPoint);
        if ((r < (d - 1)) || isNaN(d)) {
            intersection[0] = 0;
        } else {
            intersection[0] = 2;
        }
        intersection[1] = firstPoint;
        intersection[2] = secondPoint;
        return intersection;
    }
}; 

/**
 * Calculates the coordinates of the intersection of the given circles.
 * @param {Circle} circle1 Circle.
 * @param {Circle} circle2 Circle.
 * @type Array
 * @return Array of the Coordinates of the intersection points of the given circles and the
 * amount of intersection points in the first component of the array.
 */
JXG.Algebra.prototype.intersectCircleCircleOrg = function(circle1, circle2) { 
    var intersection = {};
    var r1 = circle1.getRadius();
    var r2 = circle2.getRadius();

    var rSum = r1 + r2;
    var rDiff = Math.abs(r1 - r2);    
    
    // Abstand der Mittelpunkte der beiden Kreise
    var midpointDist = circle1.midpoint.coords.distance(JXG.COORDS_BY_USER, circle2.midpoint.coords);

    if (midpointDist > rSum) {
        return [0]; // Kreise schneiden sich nicht, liegen nebeneinander
    } 
    else if (midpointDist < rDiff) {
        return [0]; // Kreise schneiden sich nicht, liegen ineinander
    } 
    else {
        intersection[0] = 1; // es gibt einen Schnitt

        var a = (r1*r1 - r2*r2 + midpointDist*midpointDist) / (2*midpointDist);
        var h = Math.sqrt(r1*r1 - a*a);
        var dx = (circle2.midpoint.coords.usrCoords[1] - circle1.midpoint.coords.usrCoords[1]);
        var dy = (circle2.midpoint.coords.usrCoords[2] - circle1.midpoint.coords.usrCoords[2]);
        var p = new JXG.Coords(JXG.COORDS_BY_USER,
                           [circle1.midpoint.coords.usrCoords[1]+dx*a/midpointDist,
                            circle1.midpoint.coords.usrCoords[2]+dy*a/midpointDist],
                           this.board);
        var b = h / midpointDist;
        intersection[1] = new JXG.Coords(JXG.COORDS_BY_USER,[p.usrCoords[1] - b*dy, p.usrCoords[2] + b*dx],this.board);
        intersection[2] = new JXG.Coords(JXG.COORDS_BY_USER,[p.usrCoords[1] + b*dy, p.usrCoords[2] - b*dx],this.board);
                                     
        return intersection;
    }
};

/**
 * Calculates the coordinates of the intersection of the given circles.
 * @param {Circle} circle1 Circle.
 * @param {Circle} circle2 Circle.
 * @type Array
 * @return Array of the Coordinates of the intersection points of the given circles and the
 * amount of intersection points in the first component of the array.
 */
JXG.Algebra.prototype.intersectCircleCircle = function(circle1, circle2) { 
    var intersection = {};
    var r1 = circle1.getRadius();
    var r2 = circle2.getRadius();
    
    var rSum = r1 + r2;
    var rDiff = Math.abs(r1 - r2);    
    
    // Abstand der Mittelpunkte der beiden Kreise
    var midpointDist = circle1.midpoint.coords.distance(JXG.COORDS_BY_USER, circle2.midpoint.coords);

    if (midpointDist > rSum) {
        return [0]; // Kreise schneiden sich nicht, liegen nebeneinander
    } 
    else if (midpointDist < rDiff) {
        return [0]; // Kreise schneiden sich nicht, liegen ineinander
    } 
    else {
        s = midpointDist;
        if (s != 0) {
            intersection[0] = 1; // es gibt einen Schnitt        
            var dx = circle2.midpoint.coords.usrCoords[1] - circle1.midpoint.coords.usrCoords[1];
            var dy = circle2.midpoint.coords.usrCoords[2] - circle1.midpoint.coords.usrCoords[2];
            var a = (s * s - r2 * r2 + r1 * r1) / (2 * s);
            var h = Math.sqrt(r1 * r1 - a * a);
            intersection[1] = new JXG.Coords(JXG.COORDS_BY_USER, 
                                             [circle1.midpoint.coords.usrCoords[1] + (a / s) * dx + (h / s) * dy, 
                                              circle1.midpoint.coords.usrCoords[2] + (a / s) * dy - (h / s) * dx], 
                                             this.board);
            intersection[2] = new JXG.Coords(JXG.COORDS_BY_USER, 
                                             [circle1.midpoint.coords.usrCoords[1] + (a / s) * dx - (h / s) * dy, 
                                              circle1.midpoint.coords.usrCoords[2] + (a / s) * dy + (h / s) * dx], 
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
 * @param {Point} point Point to project.
 * @param {Circle} circle Circle on that the point is projected.
 * @type Coords
 * @return The coordinates of the projection of the given point on the given circle.
 */
JXG.Algebra.prototype.projectPointToCircle = function(point,circle) {
    var dist = point.coords.distance(JXG.COORDS_BY_USER, circle.midpoint.coords);
    if(Math.abs(dist) < this.eps) {
        dist = this.eps;
    }
    var factor = circle.getRadius() / dist;
    var x = circle.midpoint.coords.usrCoords[1] + factor*(point.coords.usrCoords[1] - circle.midpoint.coords.usrCoords[1]);
    var y = circle.midpoint.coords.usrCoords[2] + factor*(point.coords.usrCoords[2] - circle.midpoint.coords.usrCoords[2]);
    
    return new JXG.Coords(JXG.COORDS_BY_USER, [x, y], this.board);    
};

/**
 * Calculates the coordinates of the projection of a given point on a given line. I.o.w. the
 * intersection point of the given line and its perpendicular through the given point.
 * @param {Point} point Point to project.
 * @param {Line} line Line on that the point is projected.
 * @type Coords
 * @return The coordinates of the projection of the given point on the given line.
 */
JXG.Algebra.prototype.projectPointToLine = function(point, line) {
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
};

/**
 * Calculates the coordinates of the projection of a given point on a given graph. I.o.w. the
 * intersection point of the graph and the parallel to y-axis through the given point.
 * @param {Point} point Point to project.
 * @param {Curve} graph Curve on that the point is projected.
 * @type Coords
 * @return The coordinates of the projection of the given point on the given graph.
 */
JXG.Algebra.prototype.projectPointToCurve = function(point,curve) {
    var newCoords,x,y,t;
    if (curve.curveType=='parameter') { 
        x = point.X();
        y = point.Y();
        t = point.position || 0.0;
        t = this.root(this.D(function(t){ return (x-curve.X(t))*(x-curve.X(t))+(y-curve.Y(t))*(y-curve.Y(t));}), t);
        if (t<curve.minX()) { t = curve.minX(); }
        if (t>curve.maxX()) { t = curve.maxX(); }
        point.position = t;
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [curve.X(t),curve.Y(t)], this.board);
    } else if (curve.curveType=='polar') {
        x = point.X();
        y = point.Y();
        t = point.position || 0.0;
        var offs = (curve.dataY!=null)?curve.dataY:[0,0];
        t = this.root(this.D(function(t){ 
            var r = curve.X(t);
            return (x-r*Math.cos(t)-offs[0])*(x-r*Math.cos(t)-offs[0])+(y-r*Math.sin(t)-offs[1])*(y-r*Math.sin(t)-offs[1]);
            }), 
        t);         
        //if (t<curve.minX()) { t = curve.minX(); }
        //if (t>curve.maxX()) { t = curve.maxX(); }
        point.position = t;
        var r = curve.X(t);
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [r*Math.cos(t)+offs[0],r*Math.sin(t)+offs[1]], this.board);
    } else {
        t = point.X();
        x = t; //graph.X(t);
        y = curve.Y(t);
        newCoords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board); 
    }
    return curve.updateTransform(newCoords);
};

/**
 * Converts expression of the form <i>leftop^rightop</i> into <i>Math.pow(leftop,rightop)</i>.
 * @param {String} te Expression of the form <i>leftop^rightop</i>
 * @type String
 * @return Converted expression.
 */
JXG.Algebra.prototype.replacePow = function(te) {
    var count, pos, c;
    var s = '';
    var leftop, rightop;
    //te = te.replace(/\s+/g,''); // Loesche allen whitespace
                                // Achtung: koennte bei Variablennamen mit Leerzeichen
                                // zu Problemen fuehren.
    var i = te.indexOf('^');
    while (i>=0) {
        var left = te.slice(0,i);
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
                var pre = left.substring(0,pos+1);   // finde evtl. F vor (...)^
                var p = pos;
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
        var right = te.slice(i+1);
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
        var expr = new RegExp('(' + leftop + ')\\^(' + rightop + ')');
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
    var s = '';
    var left, right;
    var first = null;
    var second = null;
    var third = null;
    
    var i = te.indexOf('If(');
    if (i<0) { return te; }

    te = te.replace(/""/g,'0'); // "" means not defined. Here, we replace it by 0
    while (i>=0) {
        left = te.slice(0,i);
        right = te.slice(i+3); 
        
        // Search the end of the If() command and take out the meat
        var count = 1;
        var pos = 0;
        var k1 = -1;
        var k2 = -1;
        while (pos<right.length && count>0) {
            var c = right.charAt(pos);
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
        var meat = right.slice(0,pos-1);
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
    var i = te.indexOf('_{');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/_\{/,'<sub>');
        var j = te.substr(i).indexOf('}');
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
    var i = te.indexOf('^{');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/\^\{/,'<sup>');
        var j = te.substr(i).indexOf('}');
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
 * Replace element names in terms by element ids
 **/
JXG.Algebra.prototype.replaceNameById = function(term) {
    var pos = 0;
    var end;
    var elName;
    var elID;
    var el;
    
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
 * Replace element ids in terms by element this.board.objects['id']
 **/
JXG.Algebra.prototype.replaceIdByObj = function(term) {
    expr = /(X|Y|L)\(([\w_]+)\)/g;  // Suche "X(gi23)" oder "Y(gi23A)" und wandle in objects['gi23'].X() um.
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
 * Converts algebraic expression in GEONExT syntax into expressions in JavaScript syntax.
 * @param {String} term Expression in GEONExT syntax
 * @type String
 * @return Given expression in JavaScript syntax
 */
JXG.Algebra.prototype.geonext2JS = function(term) {
    //term = term.unescapeHTML();  // This replaces &gt; by >, &lt; by < and &amp; by &.ist aber zu allgemein
    term = term.replace(/&lt;/g,'<'); // Hacks, to enable not well formed XML, @see GeonextReader#replaceLessThan
    term = term.replace(/&gt;/g,'>'); 
    term = term.replace(/&amp;/g,'&'); 

    var elements = this.board.elementsByName;
    
    // Umwandeln der GEONExT-Syntax in JavaScript-Syntax
    var expr;
    var newterm = term;

    newterm = this.replaceNameById(newterm);
    newterm = this.replaceIf(newterm);
    // Exponentiations-Problem x^y -> Math(exp(x,y).
    newterm = this.replacePow(newterm);
    newterm = this.replaceIdByObj(newterm);
    
    
    var from = ['Abs','ACos','ASin','ATan','Ceil','Cos','Exp','Floor','Log','Max','Min','Pow','Random','Round','Sin','Sqrt','Tan','Trunc'];
    var to = ['Math.abs','Math.acos','Math.asin','Math.atan','Math.ceil','Math.cos','Math.exp','Math.floor','Math.log','Math.max','Math.min','Math.pow','Math.random','this.board.algebra.round','Math.sin','Math.sqrt','Math.tan', 'Math.ceil'];
    for (var i=0; i<from.length; i++) {
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
 * @param {GeometryElement} me Object depending on objects in given term.
 * @param {String} term String containing dependencies for the given object.
 */
JXG.Algebra.prototype.findDependencies = function(me,term) {
    var el;
    var expr;
    var elements = this.board.elementsByName;
    for (el in elements) {
        if (el != me.name) {
            var elmask = el.replace(/\[/g,'\\[');
            elmask = elmask.replace(/\]/g,'\\]');
            expr = new RegExp("\\(\(\[\\w\\[\\]'_ \]+,\)*\("+elmask+"\)\(,\[\\w\\[\\]'_ \]+\)*\\)","g");  // Searches (A), (A,B),(A,B,C)
            if (term.search(expr)>=0) {
//alert(el);
                elements[el].addChild(me);
            }
        }
    }
};

/**
 * Calculates euclidean distance for two given arrays of the same length.
 * @param {Array} array1 Array of float or integer.
 * @param {Array} array2 Array of float or integer.
 * @type float
 * @return Euclidean distance of the given vectors.
 */
JXG.Algebra.prototype.distance = function(array1, array2) {
    var sum = 0;
    if(array1.length != array2.length) { return; }
    for(var i=0; i<array1.length; i++) {
        sum += (array1[i] - array2[i])*(array1[i] - array2[i]);
    }
    return Math.sqrt(sum);
};

/**
 * Calculates euclidean distance for two given arrays of the same length.
 * If one of the arrays contains a zero in coordinate 0, and the euclidean distance
 * is different from zero it is
 * a point at infinity and we return Infinity.
 * @param {Array} array1 Array of float or integer.
 * @param {Array} array2 Array of float or integer.
 * @type float
 * @return Euclidean (affine) distance of the given vectors.
 */
JXG.Algebra.prototype.affineDistance = function(array1, array2) {
    var eps = 0.000001;
    if(array1.length != array2.length) { 
        return; 
    }
    var d = this.distance(array1, array2);
    if (d>eps && (Math.abs(array1[0])<eps || Math.abs(array2[0])<eps)) {
        return Infinity;
    } else {
        return d;
    }
};

/**
 * Calculates the internal angle between the three points A, B, C
 * @param {Point} A Point or [x,y] array
 * @param {Point} B Point or [x,y] array
 * @param {Point} C Point or [x,y] array
 * @type float
 * @return Angle in radians.
 */
JXG.Algebra.prototype.rad = function(A,B,C) {
    var phi = this.trueAngle(A,B,C);
    return phi*Math.PI/180.0;
};

/**
 * Matrix-vector-multiplication.
 * @param {Array} mat1 In - Two dimensional array of numbers
 * @param {Array} vec In - Array of numbers
 * res: Output - Array of numbers containing result
 */
JXG.Algebra.prototype.matVecMult = function(mat1,vec) {
    var m = mat1.length;
    var n = vec.length;
    var res = [];
    for (var i=0;i<m;i++) {
        var s = 0;
        for (var k=0;k<n;k++) {
            s += mat1[i][k]*vec[k];
        }
        res[i] = s;
    }
    return res;
};

/**
 * Matrix-matrix-multiplication.
 * @param {Array} mat1 In - Two dimensional array of numbers
 * @param {Array} mat2 In - Two dimensional array of numbers
 * Output res Out - Two dimensional array of numbers
 */
JXG.Algebra.prototype.matMatMult = function(mat1,mat2) {
    var m = mat1.length;
    var n = mat2[0].length;
    var m2 = mat2.length;
    var res = [];
    for (var i=0;i<mat1.length;i++) {
        res[i] = [];
    }

    for (i=0;i<m;i++) {
        for (var j=0;j<n;j++) {
            var s = 0;
            for (var k=0;k<m2;k++) {
                s += mat1[i][k]*mat2[k][j];
            }
            res[i][j] = s;
        }
    }
    return res;
};

JXG.Algebra.prototype.str2Bool = function(s) {
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
 * @param {number} a
 * @param {number} b
 */
JXG.Algebra.prototype.pow = function(a,b) {
    if (a==null || b==null) { 
        return 1;
    }
    if (Math.floor(b)==b) {// b is integer
        return Math.pow(a,b);
    } else { // b is not integer
        if (a>0) {
            return Math.exp(b*Math.log(Math.abs(a)));
        } else {
            return null;
        }
    }
};

/**
 * Round a number
 * @param {number} number to round
 * @param {number} number of digits after point
 * Output is a string 
 */
JXG.Algebra.prototype.round = function(a,n) {
        if (typeof a == 'string') return a;
        if (n==0 || n==null) {
            return Math.round(a).toString();
        }
        if (n < 1 || n > 14) { return false; }
        var e = Math.pow(10, n);
        var k = (Math.round(a * e) / e).toString();
        if (k.indexOf('.') == -1) { k += '.'; }
        k += e.toString().substring(1);
        return k.substring(0, k.indexOf('.') + n+1);
};

/**
 * Derivative
 * @param {function} 
 * @param {variable}  derivative for this value
 */
JXG.Algebra.prototype.D = function(f) {
    var h = 0.00001;
    return function(x){ return (f(x+h)-f(x-h))/(2.0*h); };
};

/**
 * Cosine hyperbolicus
 * @param {number} 
 */
JXG.Algebra.prototype.cosh = function(x) {
    return (Math.exp(x)+Math.exp(-x))*0.5;
};

/**
 * Sine hyperbolicus
 * @param {number} 
 */
JXG.Algebra.prototype.sinh = function(x) {
    return (Math.exp(x)-Math.exp(-x))*0.5;
};

/**
 * Integral of function f over interval. Warning: Just for backward compatibility, may be removed in futures releases.
 * @param {Array} interval e.g. [a, b] 
 * @param {function} f 
 */
JXG.Algebra.prototype.I = function(interval, f) {
    return JXG.Math.Numerics.NewtonCotes(interval, f);
};

/**
 * Newton method to find roots
 * @param {function} 
 * @param {variable}  
 */
JXG.Algebra.prototype.newton = function(f,x) {
    var i = 0;
    var h = 0.0000001;
    var newf = f(x);
    while (i<50 && Math.abs(newf)>h) {
        var df = this.D(f)(x);
        if (Math.abs(df)>h) {
            x -= newf/df;
        } else {
            x += (Math.random()*0.2-1.0);
        }
        newf = f(x);
        i++;
    }
    return x;
};

/**
 * abstract method to find roots
 * @param {function} 
 * @param {variable}  
 */
JXG.Algebra.prototype.root = function(f,x) {
    return this.newton(f,x);
};

/**
  * Calculates the crossproducts of two vectors
  * of length three.
  * In case of homogeneous coordinates this is either
  * - the intersection of two lines
  * - the line through two points.
  * @param homogeneous coordinates of line (point) 1
  * @param homogeneous coordinates of line (point) 2
  * @return vector of length 3:  homogeneous coordinates
  *   of the resulting line / point.
  */
JXG.Algebra.prototype.crossProduct = function(c1,c2) {
    var z = c1[1]*c2[2]-c1[2]*c2[1];
    var x = c1[2]*c2[0]-c1[0]*c2[2];
    var y = c1[0]*c2[1]-c1[1]*c2[0];
    return [z,x,y];
};

JXG.Algebra.prototype.meet = function(el1,el2) {
    var eps = 0.000001;
    if (Math.abs(el1[3])<eps && Math.abs(el2[3])<eps) { // line line
        return this.meetLineLine(el1,el2);
    } else if (Math.abs(el1[3])>=eps && Math.abs(el2[3])<eps) { // circle line
        return this.meetLineCircle(el2,el1);
    } else if (Math.abs(el1[3])<eps && Math.abs(el2[3])>=eps) { // line circle
        return this.meetLineCircle(el1,el2);
    } else {  // circle circle
        return this.meetCircleCircle(el1,el2);
    }
};

/**
  * Intersection of two lines.
  * To be consistent we always return two intersection points.
  * @return Array containing two Coords objects
  */
JXG.Algebra.prototype.meetLineLine = function(l1,l2) {
    var s = this.crossProduct(l1,l2);
    if (Math.abs(s[0])>0.000001) {
        s[1] /= s[0];
        s[2] /= s[0];
    }
    /*
    var s1 = l1;
    var s2 = l2;
    var z = s1[1]*s2[2]-s1[2]*s2[1];
    var x = (s1[2]*s2[0]-s1[0]*s2[2])/z;
    var y = (s1[0]*s2[1]-s1[1]*s2[0])/z;
    */
    return [new JXG.Coords(JXG.COORDS_BY_USER, s.slice(1), this.board),
        new JXG.Coords(JXG.COORDS_BY_USER, s.slice(1), this.board)];

};

JXG.Algebra.prototype.meetLineCircle = function(lin,circ) {    
    var eps = 0.000001;
    if (circ[4]<eps) { // Radius is zero, return center of circle
        return [
            new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(1,3), this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, circ.slice(1,3), this.board)
            ];
    }
        
    var c = circ[0];
    var b = circ.slice(1,3);
    var a = circ[3];
    var d = lin[0];
    var n = lin.slice(1,3);

    // Line is normalized, therefore nn==1 and we can skip some operations:
    /*
    var nn = n[0]*n[0]+n[1]*n[1];
    var A = a*nn;
    var B = (b[0]*n[1]-b[1]*n[0])*nn;
    var C = a*d*d - (b[0]*n[0]+b[1]*n[1])*d + c*nn;
    */
    var A = a;
    var B = (b[0]*n[1]-b[1]*n[0]);
    var C = a*d*d - (b[0]*n[0]+b[1]*n[1])*d + c;

    var k = B*B-4*A*C;
    if (k>=0) {
        k = Math.sqrt(k);
        var t = [(-B+k)/(2*A),(-B-k)/(2*A)];
        return [
/*
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0]/nn,-t[0]*n[0]-d*n[1]/nn], this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0]/nn,-t[1]*n[0]-d*n[1]/nn], this.board)
*/
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[0]*(-n[1])-d*n[0],-t[0]*n[0]-d*n[1]], this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, [-t[1]*(-n[1])-d*n[0],-t[1]*n[0]-d*n[1]], this.board)
            ];
    } else {
        return [
            new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board),
            new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board)
            ];
    }
};

JXG.Algebra.prototype.meetCircleCircle = function(circ1,circ2) {
    var eps = 0.000001;
    if (circ1[4]<eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ1.slice(1,3),circ2.slice(1,3))==circ2[4]) {
            return [
                new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(1,3), this.board),
                new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(1,3), this.board)
                ];
        } else {
            return [
                new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board),
                new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board)
                ];
        }
    }
    if (circ2[4]<eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ2.slice(1,3),circ1.slice(1,3))==circ1[4]) {
            return [
                new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(1,3), this.board),
                new JXG.Coords(JXG.COORDS_BY_USER, circ2.slice(1,3), this.board)
                ];
        } else {
            return [
                new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board),
                new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board)
                ];
        }
    }
    var radicalAxis = [circ2[3]*circ1[0]-circ1[3]*circ2[0],
        circ2[3]*circ1[1]-circ1[3]*circ2[1],
        circ2[3]*circ1[2]-circ1[3]*circ2[2],
        0,1,Infinity, Infinity, Infinity];
    radicalAxis = this.normalize(radicalAxis);
    return this.meetLineCircle(radicalAxis,circ1);
};

// [c,b0,b1,a,k,r,q0,q1]
JXG.Algebra.prototype.normalize = function(stdform) {
    var a2 = 2*stdform[3];
    var r = stdform[4]/(a2);  // k/(2a)
    stdform[5] = r;
    stdform[6] = -stdform[1]/a2;
    stdform[7] = -stdform[2]/a2;
    if (r==Infinity || isNaN(r)) {
        var n = Math.sqrt(stdform[1]*stdform[1]+stdform[2]*stdform[2]);
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
        var signr = (r<=0)?(-1):(1/*(r==0)?0:1*/);
        stdform[0] = signr*(stdform[6]*stdform[6]+stdform[7]*stdform[7]-r*r)*0.5;
        stdform[1] = -signr*stdform[6];
        stdform[2] = -signr*stdform[7];
        stdform[3] = signr/2;
        stdform[4] = signr*r;
    }
    return stdform;
};

