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

JXG.createPerpendicular = function(board, parentArr, atts) {
    var els, p, l, t;

    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }    
        els = board.addPerpendicular(parentArr[1], parentArr[0], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);
        l = parentArr[1];
        p = parentArr[0];
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }        
        els = board.addPerpendicular(parentArr[0], parentArr[1], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);
        l = parentArr[0];
        p = parentArr[1];
    }
    else {
        throw ("Can't create perpendicular with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }

    t = els[1];

    t.generatePolynomial = function() {
        /*
         *  Perpendicular takes point P and line L and creates point T and line M:
         *
         *                          | M
         *                          |
         *                          x P (p1,p2)
         *                          |
         *                          |
         *  L                       |
         *  ----------x-------------x------------------------x--------
         *            A (a1,a2)     |T (t1,t2)               B (b1,b2)
         *                          |
         *                          |
         *
         * So we have two conditions:
         *
         *   (a)  AT  || TB          (collinearity condition)
         *   (b)  PT _|_ AB          (orthogonality condition)
         *
         *      a2-t2       t2-b2
         *     -------  =  -------           (1)
         *      a1-t1       t1-b1
         *
         *      p2-t2         a1-b1
         *     -------  =  - -------         (2)
         *      p1-t1         a2-b2
         *
         * Multiplying (1) and (2) with denominators and simplifying gives
         *
         *    a2t1 - a2b1 + t2b1 - a1t2 + a1b2 - t1b2 = 0                  (1')
         *
         *    p2a2 - p2b2 - t2a2 + t2b2 + p1a1 - p1b1 - t1a1 + t1b1 = 0    (2')
         *
         */

        var a1 = l.point1.symbolic.x;
        var a2 = l.point1.symbolic.y;
        var b1 = l.point2.symbolic.x;
        var b2 = l.point2.symbolic.y;
        var p1 = p.symbolic.x;
        var p2 = p.symbolic.y;
        var t1 = t.symbolic.x;
        var t2 = t.symbolic.y;

        var poly1 = ''+a2+'*'+t1+'-'+a2+'*'+b1+'+'+t2+'*'+b1+'-'+a1+'*'+t2+'+'+a1+'*'+b2+'-'+t1+'*'+b2;
        var poly2 = ''+p2+'*'+a2+'-'+p2+'*'+b2+'-'+t2+'*'+a2+'+'+t2+'*'+b2+'+'+p1+'*'+a1+'-'+p1+'*'+b1+'-'+t1+'*'+a1+'+'+t1+'*'+b1;

        return [poly1, poly2];
    }

    return els;
};

JXG.createMidpoint = function(board, parentArr, atts) {
    var a, b, t;
    if(parentArr.length == 2 && JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1])) {
        a = parentArr[0];
        b = parentArr[1];
        t = board.addMidpoint(parentArr[0], parentArr[1], atts['id'], atts['name']);
    }
    else if(parentArr.length == 1 && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {
        a = parentArr[0].point1;
        b = parentArr[0].point2;
        t = board.addMidpoint(parentArr[0].point1, parentArr[0].point2, atts['id'], atts['name']);
    }
    else {
        throw ("Can't create midpoint.");    
    }

    t.generatePolynomial = function() {
        /*
         *  Midpoint takes two point A and B or line L (with points P and Q) and creates point T:
         *
         *  L (not necessarily)
         *  ----------x------------------x------------------x--------
         *            A (a1,a2)          T (t1,t2)          B (b1,b2)
         *
         * So we have two conditions:
         *
         *   (a)   AT  ||  TB           (collinearity condition)
         *   (b)  [AT] == [TB]          (equidistant condition)
         *
         *      a2-t2       t2-b2
         *     -------  =  -------                                         (1)
         *      a1-t1       t1-b1
         *
         *     (a1 - t1)^2 + (a2 - t2)^2 = (b1 - t1)^2 + (b2 - t2)^2       (2)
         *
         *
         * Multiplying (1) with denominators and simplifying (1) and (2) gives
         *
         *    a2t1 - a2b1 + t2b1 - a1t2 + a1b2 - t1b2 = 0                      (1')
         *
         *    a1^2 - 2a1t1 + a2^2 - 2a2t2 - b1^2 + 2b1t1 - b2^2 + 2b2t2 = 0    (2')
         *
         */

        var a1 = a.symbolic.x;
        var a2 = a.symbolic.y;
        var b1 = b.symbolic.x;
        var b2 = b.symbolic.y;
        var t1 = t.symbolic.x;
        var t2 = t.symbolic.y;

        var poly1 = ''+a2+'*'+t1+'-'+a2+'*'+b1+'+'+t2+'*'+b1+'-'+a1+'*'+t2+'+'+a1+'*'+b2+'-'+t1+'*'+b2;
        var poly2 = ''+a1+'^2 - 2*'+a1+'*'+t1+'+'+a2+'^2-2*'+a2+'*'+t2+'-'+b1+'^2+2*'+b1+'*'+t1+'-'+b2+'^2+2*'+b2+'*'+t2;

        return [poly1, poly2];
    }

    return t;
};

JXG.createParallel = function(board, parentArr, atts) {
    /* TODO parallel polynomials */
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        return board.addParallel(parentArr[1], parentArr[0], atts['id'], atts['name']);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {    
        return board.addParallel(parentArr[0], parentArr[1], atts['id'], atts['name']);    
    }
    else {
        throw ("Can't create parallel with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createNormal = function(board, parents, attributes) {
    /* TODO normal polynomials */
    var p;
    var c;
    if (parents.length==1) { // One arguments: glider on line, circle or curve
        p = parents[0];
        c = p.slideObject;
    } else if (parents.length==2) { // Two arguments: (point,line), (point,circle), (line,point) or (circle,point)
        if (JXG.IsPoint(parents[0])) { 
            p = parents[0];
            c = parents[1];
        } else if (JXG.IsPoint(parents[1])) { 
            c = parents[0];
            p = parents[1];
        } else {
            throw ("Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");    
        }
    } else {
        throw ("Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");    
    }

    if(c.elementClass==JXG.OBJECT_CLASS_LINE) {
        // return board.addNormal(c,p, attributes['id'], attributes['name']); // GEONExT-Style: problems with ideal point
        // If not needed, then board.addNormal and maybe board.algebra.perpendicular can be removed.
        
        // Homogeneous version:
        // orthogonal(l,p) = (F^\delta\cdot l)\times p
        return board.createElement('line', [
                    function(){ return c.stdform[1]*p.Y()-c.stdform[2]*p.X();},
                    function(){ return c.stdform[2]*p.Z();},
                    function(){ return -c.stdform[1]*p.Z();}
                    ], attributes );
    }
    else if(c.elementClass == JXG.OBJECT_CLASS_CIRCLE) {    
        var Dg = function(t){ return -c.getRadius()*Math.sin(t); };
        var Df = function(t){ return c.getRadius()*Math.cos(t); };
        return board.createElement('line', [
                    function(){ return -p.X()*Dg(p.position)-p.Y()*Df(p.position);},
                    function(){ return Dg(p.position);},
                    function(){ return Df(p.position);}
                    ], attributes );
    } else if (c.elementClass == JXG.OBJECT_CLASS_CURVE) {
        if (c.curveType!='plot') {
            var g = c.X;
            var f = c.Y;
            return board.createElement('line', [
                    function(){ return -p.X()*board.D(g)(p.position)-p.Y()*board.D(f)(p.position);},
                    function(){ return board.D(g)(p.position);},
                    function(){ return board.D(f)(p.position);}
                    ], attributes );
        } else {                         // curveType 'plot'
            return board.createElement('line', [
                    function(){ var i=Math.floor(p.position); 
                                var lbda = p.position-i;
                                if (i==c.numberPoints-1) {i--; lbda=1; }
                                if (i<0) return 1.0;
                                return (c.Y(i)+lbda*(c.Y(i+1)-c.Y(i)))*(c.Y(i)-c.Y(i+1))-(c.X(i)+lbda*(c.X(i+1)-c.X(i)))*(c.X(i+1)-c.X(i));},
                    function(){ var i=Math.floor(p.position); 
                                if (i==c.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return c.X(i+1)-c.X(i);},
                    function(){ var i=Math.floor(p.position); 
                                if (i==c.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return c.Y(i+1)-c.Y(i);}
                    ], attributes );
        }
    } else if (c.type == JXG.OBJECT_TYPE_TURTLE) {
            return board.createElement('line', [
                    function(){ var i=Math.floor(p.position);
                                var lbda = p.position-i;
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) { i--; lbda=1.0; }
                                if (i<0) return 1.0;
                                return (el.Y(i)+lbda*(el.Y(i+1)-el.Y(i)))*(el.Y(i)-el.Y(i+1))-(el.X(i)+lbda*(el.X(i+1)-el.X(i)))*(el.X(i+1)-el.X(i));},
                    function(){ var i=Math.floor(p.position); 
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return el.X(i+1)-el.X(i);},
                    function(){ var i=Math.floor(p.position); 
                                var el,j;
                                for(j=0;j<c.objects.length;j++) {  // run through all curves of this turtle
                                    el = c.objects[j];
                                    if (el.type==JXG.OBJECT_TYPE_CURVE) {
                                        if (i<el.numberPoints) break;
                                        i-=el.numberPoints;
                                    }
                                }
                                if (i==el.numberPoints-1) i--;
                                if (i<0) return 0.0;
                                return el.Y(i+1)-el.Y(i);}
                    ], attributes );
    }
    else {
        throw ("Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");    
    }
};

JXG.createBisector = function(board, parentArr, atts) {
    /* TODO bisector polynomials */
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addAngleBisector(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create angle bisector with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createArrowParallel = function(board, parentArr, atts) {
    /* TODO arrowparallel polynomials */
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_ARROW) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }    
        return board.addArrowParallel(parentArr[1], parentArr[0], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_ARROW) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }        
        return board.addArrowParallel(parentArr[0], parentArr[1], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);    
    }
    else {
        throw ("Can't create parallel arrow with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createCircumcircle = function(board, parentArr, atts) {
    /* TODO circumcircle polynomials */
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }    
        return board.addCircumcenter(parentArr[0], parentArr[1], parentArr[2], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);
    }
    else {
        throw ("Can't create circumcircle with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");    
    }
};

JXG.createCircumcircleMidpoint = function(board, parentArr, atts) {
    /* TODO circumcircle polynomials */
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addCircumcenterMidpoint(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create circumcircle midpoint with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");    
    }
};

JXG.createParallelPoint = function(board, parentArr, atts) {
    /* TODO parallel point polynomials */
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addParallelPoint(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create parallel point with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");    
    }
};

JXG.createReflection = function(board, parentArr, atts) {
    /* TODO reflection polynomials */
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        return board.addReflection(parentArr[1], parentArr[0], atts['id'], atts['name']);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {    
        return board.addReflection(parentArr[0], parentArr[1], atts['id'], atts['name']);    
    }
    else {
        throw ("Can't create reflection point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createPerpendicularPoint = function(board, parentArr, atts) {
    var l, p, t;
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        p = parentArr[0];
        l = parentArr[1];
        t = board.addPerpendicularPoint(parentArr[1], parentArr[0], atts['id'], atts['name']);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {    
        p = parentArr[1];
        l = parentArr[0];
        t = board.addPerpendicularPoint(parentArr[0], parentArr[1], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create perpendicular point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }

    t.generatePolynomial = function() {
        /*
         * For explanations see JXG.createPerpendicular() in Composition.js
         */

        var a1 = l.point1.symbolic.x;
        var a2 = l.point1.symbolic.y;
        var b1 = l.point2.symbolic.x;
        var b2 = l.point2.symbolic.y;
        var p1 = p.symbolic.x;
        var p2 = p.symbolic.y;
        var t1 = t.symbolic.x;
        var t2 = t.symbolic.y;

        var poly1 = ''+a2+'*'+t1+'-'+a2+'*'+b1+'+'+t2+'*'+b1+'-'+a1+'*'+t2+'+'+a1+'*'+b2+'-'+t1+'*'+b2;
        var poly2 = ''+p2+'*'+a2+'-'+p2+'*'+b2+'-'+t2+'*'+a2+'+'+t2+'*'+b2+'+'+p1+'*'+a1+'-'+p1+'*'+b1+'-'+t1+'*'+a1+'+'+t1+'*'+b1;

        return [poly1, poly2];
    }

    return t;
};

JXG.createMirrorPoint = function(board, parentArr, atts) {
    /* TODO mirror polynomials */
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1])) {
        return board.addRotation(parentArr[0], parentArr[1], Math.PI, atts['id'], atts['name']);
    }
    else {
        throw ("Can't create mirror point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createIntegral = function(board, parentArr, atts) {
    if(!JXG.IsArray(atts['id']) || (atts['id'].length != 5)) {
        atts['id'] = ['','','','',''];
    }
    if(!JXG.IsArray(atts['name']) || (atts['name'].length != 5)) {
       atts['name'] = ['','','','',''];
    }    

    if(JXG.IsArray(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_CURVE) {
        return board.addIntegral(parentArr[0], parentArr[1], atts['id'], atts['name'], atts);
    } else if(JXG.IsArray(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_CURVE) {
        return board.addIntegral(parentArr[1], parentArr[0], atts['id'], atts['name'], atts);
    } else {
        throw ("Can't create integral with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.JSXGraph.registerElement('arrowparallel', JXG.createArrowParallel);
JXG.JSXGraph.registerElement('bisector', JXG.createBisector);
JXG.JSXGraph.registerElement('circumcircle', JXG.createCircumcircle);
JXG.JSXGraph.registerElement('circumcirclemidpoint', JXG.createCircumcircleMidpoint);
JXG.JSXGraph.registerElement('integral', JXG.createIntegral);
JXG.JSXGraph.registerElement('midpoint', JXG.createMidpoint);
JXG.JSXGraph.registerElement('mirrorpoint', JXG.createMirrorPoint);
JXG.JSXGraph.registerElement('normal', JXG.createNormal);
JXG.JSXGraph.registerElement('parallel', JXG.createParallel);
JXG.JSXGraph.registerElement('parallelpoint', JXG.createParallelPoint);
JXG.JSXGraph.registerElement('perpendicular', JXG.createPerpendicular);
JXG.JSXGraph.registerElement('perpendicularpoint', JXG.createPerpendicularPoint);
JXG.JSXGraph.registerElement('reflection', JXG.createReflection);
