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
 * @fileoverview This file contains the class Algebra, a wrapper for all kind of calculations. It's only here for
 * backward compatibility reasons.
 */
 
/**
 * Creates a new instance of Algebra.
 * @class This class is just for backward compatibility and may be removed in future versions of JSXGraph. Hence,
 * please DO NOT USE ANY OF THESE METHODS but the given alternative.
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
 * @deprecated Use {@link JXG.Math.Geometry#rad} instead.
 */
JXG.Algebra.prototype.angle = function(A, B, C) {   
    return JXG.Math.Geometry.angle(A, B, C);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#trueAngle} instead.
 */
JXG.Algebra.prototype.trueAngle = function(A, B, C) {
    return this.rad(A,B,C)*57.295779513082323;
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#rad} instead.
 */
JXG.Algebra.prototype.rad = function(A,B,C) {
    return JXG.Math.Geometry.rad(A, B, C);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#angleBisector} instead.
 */
JXG.Algebra.prototype.angleBisector = function(/** JXG.Point */ A, /** JXG.Point */ B, /** JXG.Point */ C) /** JXG.Coords */ {
    return JXG.Math.Geometry.angleBisector(A, B, C, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#reflection} instead.
 */  
JXG.Algebra.prototype.reflection = function(line,point) {
    return JXG.Math.Geometry.reflection(line, point, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#rotation} instad.
 */
JXG.Algebra.prototype.rotation = function(rotpoint, point, phi) {
    return JXG.Math.Geometry.rotation(rotpoint, point, phi, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#perpendicular} instead.
 */
JXG.Algebra.prototype.perpendicular = function(line, point) {
    return JXG.Math.Geometry.perpendicular(line, point, this.board);           
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#circumcenterMidpoint} instead.
 */
JXG.Algebra.prototype.circumcenterMidpoint = function(point1, point2, point3) {
    return JXG.Math.Geometry.circumcenterMidpoint(point1, point2, point3, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#intersectLineLine} instead.
 */
JXG.Algebra.prototype.intersectLineLine = function(line1, line2) {
    return JXG.Math.Geometry.intersectLineLine(line1, line2, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#intersectCircleLine} instead.
 */
JXG.Algebra.prototype.intersectCircleLine = function(circle, line) {
    return JXG.Math.Geometry.intersectCircleLine(circle, line, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#intersectCircleCircle} instead.
 */
JXG.Algebra.prototype.intersectCircleCircle = function(circle1, circle2) { 
    return JXG.Math.Geometry.intersectCircleCircle(circle1, circle2, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#projectPointToCircle} instead.
 */
JXG.Algebra.prototype.projectPointToCircle = function(point,circle) {
    return JXG.Math.Geometry.projectPointToCircle(point, circle, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#projectPointToLine} instead.
 */
JXG.Algebra.prototype.projectPointToLine = function(point, line) {
    return JXG.Math.Geometry.projectPointToLine(point, line, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#projectPointToCurve} instead.
 */
JXG.Algebra.prototype.projectPointToCurve = function(point,curve) {
    return JXG.Math.Geometry.projectPointToCurve(point,curve,this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#projectCoordsToCurve} instead.
 */
JXG.Algebra.prototype.projectCoordsToCurve = function(x,y,t,curve) {
    return JXG.Math.Geometry.projectCoordsToCurve(x,y,t,curve,this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#projectPointToTurtle} instead.
 */
JXG.Algebra.prototype.projectPointToTurtle = function(point,turtle) {
    return JXG.Math.Geometry.projectPointToTurtle(point,turtle,this.board);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replacePow} instead.
 */
JXG.Algebra.prototype.replacePow = function(te) {
    return JXG.GeonextParser.replacePow(te);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replaceIf} instead;
 */
JXG.Algebra.prototype.replaceIf = function(te) {
    return JXG.GeonextParser.replaceIf(te);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replaceSub} instead.
 */
JXG.Algebra.prototype.replaceSub = function(te) {
    return JXG.GeonextParser.replaceSub(te);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replaceSup} instead.
 */
JXG.Algebra.prototype.replaceSup = function(te) {
    return JXG.GeonextParser.replaceSup(te);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replaceNameById} instead.
 **/
JXG.Algebra.prototype.replaceNameById = function(/** string */ term) /** string */ {
    return JXG.GeonextParser.replaceNameById(term, this.board);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#replaceIdByObj} instead.
 **/
JXG.Algebra.prototype.replaceIdByObj = function(/** string */ term) /** string */ {
    return JXG.GeonextParser.replaceIdByObj(term);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#geonext2JS} instead.
 */
JXG.Algebra.prototype.geonext2JS = function(term) {
    return JXG.GeonextParser.geonext2JS(term);
};

/**
 * @deprecated Use {@link JXG.GeonextParser#findDependencies} instead.
 */
JXG.Algebra.prototype.findDependencies = function(me, term) {
    JXG.GeonextParser.findDependencies(me, term, this.board);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#distance} instead.
 */
JXG.Algebra.prototype.distance = function(array1, array2) {
    return JXG.Math.Geometry.distance(array1, array2);
};

/**
 * @deprecated Use {@link JXG.Math.Geometry#affineDistance} instead.
 */
JXG.Algebra.prototype.affineDistance = function(array1, array2) {
    return JXG.Math.Geometry.affineDistance(array1, array2);
};

/**
 * @deprecated Use {@link JXG.Math#pow} instead.
 */
JXG.Algebra.prototype.pow = function(/** number */ a, /** number */ b) /** number */ {
    return JXG.Math.pow(a, b);
};

/**
 * @private
 * @deprecated Use {@link JXG.Math.Geometry#meet} instead.
 */
JXG.Algebra.prototype.meet = function(el1, el2, /** number */ i) /** JXG.Coords */ {
    return JXG.Math.Geometry.meet(el1, el2, i, this.board);
};

/**
  * @private
  * @deprecated Use {@link JXG.Math.Geometry#meetLineLine} instead.
  */
JXG.Algebra.prototype.meetLineLine = function(l1,l2,i) {
    return JXG.Math.Geometry.meetLineLine(l1,l2,i,this.board);
};

/**
  * @private
  * 
  * @deprecated Use {@link  JXG.Math.Geometry#meetLineCircle} instead.
  */
 JXG.Algebra.prototype.meetLineCircle = function(lin,circ,i) {    
        return  JXG.Math.Geometry.meetLineCircle(lin,circ,i,this.board);
};

/**
  * @private
  * @deprecated Use {@link JXG.Math.Geometry#meetCircleCircle} instead.
  */
JXG.Algebra.prototype.meetCircleCircle = function(circ1,circ2,i) {
    return JXG.Math.Geometry.meetCircleCircle(circ1,circ2,i,this.board);
};

/**
  * @private
  * @deprecated Use {@link JXG.Math#normalize} instead.
  */
JXG.Algebra.prototype.normalize = function(stdform) {
    return JXG.Math.normalize(stdform);
};

/**
 * @private
 * @deprecated Use {@link JXG.Math.Geometry#meetCurveCurve} instead.
 */
JXG.Algebra.prototype.meetCurveCurve = function(c1,c2,t1ini,t2ini) {
    return JXG.Math.Geometry.meetCurveCurve(c1,c2,t1ini,t2ini,this.board);
};

/**
 * @private
 * @deprecated Use {@link JXG.Math.Geometry#meetCurveLine} instead.
 */
JXG.Algebra.prototype.meetCurveLine = function(el1,el2,nr) {
    return JXG.Math.Geometry.meetCurveLine(el1,el2,nr,this.board);
};
