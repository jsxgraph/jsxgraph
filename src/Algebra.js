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
        
    if(Math.abs(dist) < JXG.Math.eps) {
        dist = JXG.Math.eps;
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
    if(Math.abs(den)<JXG.Math.eps) {
        den = JXG.Math.eps;
    }
    var x = (d0*fmd + d1*emc) / den;
    var y = (d1*fmd - d0*emc) /den;
    return new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);       
*/
    // Homogeneous version
    var v = [0,line.stdform[1],line.stdform[2]];
    v = JXG.Math.crossProduct(v,point.coords.usrCoords);
    return this.meetLineLine(v,line.stdform,0);

    //return new JXG.Coords(JXG.COORDS_BY_USER, v, this.board);       
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
        t = point.position || 0.0, //(curve.minX()+curve.maxX())*0.5,
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
    var newCoords, x0, y0, x1, y1, den, i, mindist, dist, lbda, j,
        infty = 1000000.0, minfunc, tnew, fnew, fold, delta, steps;
        
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
            leftop = '[\\w\\.]+';
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
    var pos = 0, end, elName, el, i,
        funcs = ['X','Y','L','V'];
    
    for (i=0;i<funcs.length;i++) {
        pos = term.indexOf(funcs[i]+'(');
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
            pos = term.indexOf(funcs[i]+'(',end);
        }
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

    funcs = ['Deg','Rad'];
    for (i=0;i<funcs.length;i++) {
        pos = term.indexOf(funcs[i]+'(');
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
            pos = term.indexOf(funcs[i]+'(',end);
        }
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
    
    expr = /(V)\(([\w_]+)\)/g;  // Suche "X(gi23)" oder "Y(gi23A)" und wandle in objects['gi23'].X() um.
    term = term.replace(expr,"this.board.objects[\"$2\"].Value()");

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
        from = ['Abs', 'ACos', 'ASin', 'ATan','Ceil','Cos','Exp','Floor','Log','Max','Min','Random','Round','Sin','Sqrt','Tan','Trunc'], 
        to =   ['Math.abs', 'Math.acos', 'Math.asin', 'Math.atan', 'Math.ceil', 'Math.cos', 'Math.exp', 'Math.floor', 'Math.log', 'Math.max', 'Math.min', 'Math.random', 'this.board.round', 'Math.sin', 'Math.sqrt', 'Math.tan', 'Math.ceil'];
    // removed: 'Pow'  -> Math.pow
    
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
        expr = new RegExp(from[i],"ig");
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
    var eps = JXG.Math.eps; //    var eps = 0.000001;

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
    var s = JXG.Math.crossProduct(l1,l2);
    if (Math.abs(s[0])>JXG.Math.eps) {
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

    if (circ[4]<JXG.Math.eps) { // Radius is zero, return center of circle
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
    if (circ1[4]<JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
        if (this.distance(circ1.slice(1,3),circ2.slice(1,3))==circ2[4]) {
            return new JXG.Coords(JXG.COORDS_BY_USER, circ1.slice(1,3), this.board);
        } else {
            return new JXG.Coords(JXG.COORDS_BY_USER, [NaN,NaN], this.board);
        }
    }
    if (circ2[4]<JXG.Math.eps) { // Radius are zero, return center of circle, if on other circle
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
  * @deprecated Use {@link JXG.Math#normalize} instead.
  */
JXG.Algebra.prototype.normalize = function(stdform) {
    return JXG.Math.normalize(stdform);
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
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c1.X(t1),c1.Y(t1)], this.board));
    } else {
        return (new JXG.Coords(JXG.COORDS_BY_USER, [c2.X(t2),c2.Y(t2)], this.board));
    }
};

/**
* order of input does not matter for el1 and el2.
*/
JXG.Algebra.prototype.meetCurveLine = function(el1,el2,nr) {
    var t, t2, i, cu, li, func, z,
        tnew, steps, delta, tstart, cux, cuy;
    
    for (i=0;i<arguments.length-1;i++) {
        if (arguments[i].elementClass==JXG.OBJECT_CLASS_CURVE) { cu = arguments[i]; }
        else if (arguments[i].elementClass==JXG.OBJECT_CLASS_LINE) { li = arguments[i]; }
        else 
            throw new Error("JSXGraph: Can't call meetCurveLine with parent class '" + (arguments[i].elementClass) + ".");
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

    if (Math.abs(func(t))>JXG.Math.eps) z = 0.0;
    else z = 1.0;
    return (new JXG.Coords(JXG.COORDS_BY_USER, [z, cu.X(t),cu.Y(t)], this.board));
};
