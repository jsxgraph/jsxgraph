/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


JXG.extend(JXG.Board.prototype, /** @lends JXG.Board.prototype */ {
    intersection: function(el1, el2, i, j, pointObj){ 
        var p;
        
        el1 = JXG.getReference(this,el1);
        el2 = JXG.getReference(this,el2);
        
        // Get access to the intersection point object
        // This is necessary to read the property alwaysIntersect
        // see JXG.createIntersectionPoint() (Point.js)
        if (pointObj!=null) {
            p = pointObj.point;
        }
        
        if (el1.elementClass==JXG.OBJECT_CLASS_CURVE 
            && el2.elementClass==JXG.OBJECT_CLASS_CURVE
            && (el1.type!=JXG.OBJECT_TYPE_ARC 
                || el2.type!=JXG.OBJECT_TYPE_ARC) ) {
                    
            // curve - curve, but not both are arcs 
            // TEMPORARY FIX!!!
            return function(){
                        return JXG.Math.Geometry.meetCurveCurve(el1,el2,i,j,el1.board); 
                    };
            
        } else if ( (el1.type==JXG.OBJECT_TYPE_ARC 
                      && el2.elementClass==JXG.OBJECT_CLASS_LINE) 
                    ||
                     (el2.type==JXG.OBJECT_TYPE_ARC 
                      && el1.elementClass==JXG.OBJECT_CLASS_LINE)) {
                          
            // arc - line   (arcs are of class curve, but are intersected like circles)
            // TEMPORARY FIX!!!
            return function(){
                        return JXG.Math.Geometry.meet(el1.stdform,el2.stdform,i,el1.board); 
                    };
                    
        } else if ( (el1.elementClass==JXG.OBJECT_CLASS_CURVE 
                      && el2.elementClass==JXG.OBJECT_CLASS_LINE)
                    ||
                     (el2.elementClass==JXG.OBJECT_CLASS_CURVE 
                      && el1.elementClass==JXG.OBJECT_CLASS_LINE)) {
                          
            // curve - line (this includes intersections between conic sections and lines
            return function(){
                        return JXG.Math.Geometry.meetCurveLine(el1,el2,i,el1.board, pointObj); 
                    };
                    
        } else if (el1.elementClass==JXG.OBJECT_CLASS_LINE 
                    && el2.elementClass==JXG.OBJECT_CLASS_LINE
                   )  {
                     
            // line - line, lines may also be segments.
            return function(){ 
                var res, c,
                    first1 = el1.visProp.straightfirst;
                    first2 = el2.visProp.straightfirst;
                    last1 = el1.visProp.straightlast;
                    last2 = el2.visProp.straightlast;

                /** 
                 * If one of the lines is a segment or ray and
                 * the the intersection point shpould disappear if outside 
                 * of the segment or ray we call
                 * meetSegmentSegment 
                 */
                if (JXG.exists(p) && !p.visProp.alwaysintersect
                    && (first1==false
                        || last1==false
                        || first2==false
                        || last2==false)
                    ) {

                    res = JXG.Math.Geometry.meetSegmentSegment(
                        el1.point1.coords.usrCoords, el1.point2.coords.usrCoords,
                        el2.point1.coords.usrCoords, el2.point2.coords.usrCoords, 
                        el1.board); 
                        
                    if ( (!first1 && res[1]<0)
                         || (!last1 && res[1]>1)
                         || (!first2 && res[2]<0)
                         || (!last2 && res[2]>1) ) {
                        c = [0,NaN,NaN];  // Non-existent
                    } else {
                        c = res[0];
                    }
                    return (new JXG.Coords(JXG.COORDS_BY_USER, c, el1.board));
                } else {
                    return JXG.Math.Geometry.meet(el1.stdform,el2.stdform,i,el1.board);
                }
            };
        // All other combinations of circles and lines
        } else {
            return function(){return JXG.Math.Geometry.meet(el1.stdform,el2.stdform,i,el1.board); };
        }
    }, //returns a single point of intersection
    intersectionFunc: function(el1,el2,i,j){ return this.intersection(el1,el2,i,j); },

    /**
    * Intersection of circles and line
    */ 
    otherIntersection: function(el1,el2,el){ 
        el1 = JXG.getReference(this,el1);
        el2 = JXG.getReference(this,el2);
        return function(){
            var c = JXG.Math.Geometry.meet(el1.stdform,el2.stdform,0,el1.board);
            if (Math.abs(el.X()-c.usrCoords[1])>JXG.Math.eps ||
                Math.abs(el.Y()-c.usrCoords[2])>JXG.Math.eps ||
                Math.abs(el.Z()-c.usrCoords[0])>JXG.Math.eps) {
                return c;
            } else {
                return JXG.Math.Geometry.meet(el1.stdform,el2.stdform,1,el1.board);
            }
        };
    } //returns a single point of intersection
});
