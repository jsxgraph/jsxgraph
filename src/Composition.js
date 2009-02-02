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
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }    
        return board.addPerpendicular(parentArr[1], parentArr[0], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {
        if(!JXG.IsArray(atts['id'])) {
            atts['id'] = ['',''];
        }
        if(!JXG.IsArray(atts['name'])) {
            atts['name'] = ['',''];
        }        
        return board.addPerpendicular(parentArr[0], parentArr[1], atts['id'][0], atts['name'][0], atts['id'][1], atts['name'][1]);    
    }
    else {
        throw ("Can't create perpendicular with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createMidpoint = function(board, parentArr, atts) {
    if(parentArr.length == 2 && JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1])) {
        return board.addMidpoint(parentArr[0], parentArr[1], atts['id'], atts['name']);
    }
    else if(parentArr.length == 1 && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {
        return board.addMidpoint(parentArr[0].point1, parentArr[0].point2, atts['id'], atts['name']);
    }
    else {
        throw ("Can't create midpoint.");    
    }
};

JXG.createParallel = function(board, parentArr, atts) {
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
        var Df = function(t){ return c.getRadius()*Math.cos(t); };;
        return board.createElement('line', [
                    function(){ return -p.X()*Dg(p.position)-p.Y()*Df(p.position);},
                    function(){ return Dg(p.position);},
                    function(){ return Df(p.position);}
                    ], attributes );
    } else if (c.elementClass == JXG.OBJECT_CLASS_CURVE) {
        var g = c.X;
        var f = c.Y;
        return board.createElement('line', [
                    function(){ return -p.X()*board.D(g)(p.position)-p.Y()*board.D(f)(p.position);},
                    function(){ return board.D(g)(p.position);},
                    function(){ return board.D(f)(p.position);}
                    ], attributes );
    }
    else {
        throw ("Can't create normal with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");    
    }
};

JXG.createBisector = function(board, parentArr, atts) {
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addAngleBisector(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create angle bisector with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createArrowParallel = function(board, parentArr, atts) {
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
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addCircumcenterMidpoint(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create circumcircle midpoint with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");    
    }
};

JXG.createParallelPoint = function(board, parentArr, atts) {
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1]) && JXG.IsPoint(parentArr[2])) {
        return board.addParallelPoint(parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    }
    else {
        throw ("Can't create parallel point with parent types '" + (typeof parentArr[0]) + "', '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");    
    }
};

JXG.createReflection = function(board, parentArr, atts) {
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
    if(JXG.IsPoint(parentArr[0]) && parentArr[1].type == JXG.OBJECT_TYPE_LINE) {
        return board.addPerpendicularPoint(parentArr[1], parentArr[0], atts['id'], atts['name']);
    }
    else if(JXG.IsPoint(parentArr[1]) && parentArr[0].type == JXG.OBJECT_TYPE_LINE) {    
        return board.addPerpendicularPoint(parentArr[0], parentArr[1], atts['id'], atts['name']);    
    }
    else {
        throw ("Can't create perpendicular point with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.createMirrorPoint = function(board, parentArr, atts) {
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
