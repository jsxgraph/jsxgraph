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
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

JXG.Math.Numerics.createRoulette = function(c1, c2, start_c1, stepsize, direction, time, pointlist) {
    var Roulette = function() {
        var alpha = 0, Tx = 0, Ty = 0,
            t1 = start_c1,
            t2 = JXG.Math.Numerics.root(
                function(t) { 
                    var c1x = c1.X(t1),
                        c1y = c1.Y(t1),
                        c2x = c2.X(t),
                        c2y = c2.Y(t);
                    return (c1x-c2x)*(c1x-c2x) + (c1y-c2y)*(c1y-c2y);
                },
                0),
            t1_new = 0.0, t2_new = 0.0, 
            c1dist,
            rotation = brd.create('transform',[function(){ return alpha;}], {type:'rotate'}),
            rotationLocal = brd.create('transform',[function(){ return alpha;}, 
                                           function(){ return c1.X(t1);},
                                           function(){ return c1.Y(t1);}], 
                                          {type:'rotate'}),
            translate = brd.create('transform',[function(){ return Tx;}, function(){ return Ty;}], {type:'translate'}),
            
            //
            // arc length via Simpson's rule.
            arclen = function(c,a,b) {
                var cpxa = JXG.Math.Numerics.D(c.X)(a), cpya = JXG.Math.Numerics.D(c.Y)(a),
                    cpxb = JXG.Math.Numerics.D(c.X)(b), cpyb = JXG.Math.Numerics.D(c.Y)(b),
                    cpxab = JXG.Math.Numerics.D(c.X)((a+b)*0.5), cpyab = JXG.Math.Numerics.D(c.Y)((a+b)*0.5),
                    fa = Math.sqrt(cpxa*cpxa+cpya*cpya),
                    fb = Math.sqrt(cpxb*cpxb+cpyb*cpyb),
                    fab = Math.sqrt(cpxab*cpxab+cpyab*cpyab);
                return (fa+4*fab+fb)*(b-a)/6.0;
            },
            exactDist = function(t) {
                return c1dist - arclen(c2,t2,t);
                },   
            beta = Math.PI/18.0,
            beta9 = beta*9,
            interval = null; 
/*
        var hp = new JXG.Complex(JXG.Math.Numerics.D(c1.X)(t1),JXG.Math.Numerics.D(c1.Y)(t1));
        var gp = new JXG.Complex(JXG.Math.Numerics.D(c2.X)(t2),JXG.Math.Numerics.D(c2.Y)(t2));
        var z = JXG.C.div(hp,gp);
        alpha = -direction*Math.atan2(z.imaginary, z.real);
        rotationLocal.applyOnce(pointlist);
        brd.update();
*/        
        
        this.rolling = function(){
            t1_new = t1+direction*stepsize;
            c1dist = arclen(c1,t1,t1_new);             // arc length between c1(t1) and c1(t1_new)
            t2_new = JXG.Math.Numerics.root(exactDist, [t2+direction*stepsize]);
                                                       // find t2_new such that arc length between c2(t2) and c1(t2_new)
                                                       // equals c1dist.
            
            var h = new JXG.Complex(c1.X(t1_new),c1.Y(t1_new));    // c1(t) as complex number
            var g = new JXG.Complex(c2.X(t2_new),c2.Y(t2_new));    // c2(t) as complex number
            var hp = new JXG.Complex(JXG.Math.Numerics.D(c1.X)(t1_new),JXG.Math.Numerics.D(c1.Y)(t1_new));
            var gp = new JXG.Complex(JXG.Math.Numerics.D(c2.X)(t2_new),JXG.Math.Numerics.D(c2.Y)(t2_new));
            var z = JXG.C.div(hp,gp);                  // z is angle between the tangents of  
                                                       // c1 at t1_new, and c2 at t2_new
            alpha = Math.atan2(z.imaginary, z.real);
            z.div(JXG.C.abs(z));                       // Normalizing the quotient
            z.mult(g);
            Tx = h.real-z.real;
            Ty = h.imaginary-z.imaginary;              // T = h(t1_new)-g(t2_new)*h'(t1_new)/g'(t2_new);

            if (alpha <-beta && alpha>-beta9) {        // -(10-90) degrees: make corners roll smoothly
                alpha = -beta;
                rotationLocal.applyOnce(pointlist);
            } else if (alpha>beta && alpha<beta9) {
                alpha = beta;
                rotationLocal.applyOnce(pointlist);
            } else {
                rotation.applyOnce(pointlist);
                translate.applyOnce(pointlist);
                t1 = t1_new;
                t2 = t2_new;
            }
            brd.update();
        };
    
        this.start = function() {
            if (time>0) {
                interval = setInterval(this.rolling, time);
            }
            return this;
        };
    
        this.stop = function() {
            clearInterval(interval);
            return this;
        };
        return this;
    };
    return new Roulette();
};

JXG.Math.Numerics.reuleauxPolygon = function(points, nr) {
    var pi2 = Math.PI*2,
        pi2_n = pi2/nr,
        diag = (nr-1)/2,
        beta, d = 0; 
        makeFct = function(which, trig) {
                return function(t, suspendUpdate) {
                    if (!suspendUpdate) {
                        d = points[0].Dist(points[diag]);
                        beta = JXG.Math.Geometry.rad([points[0].X()+1,points[0].Y()],points[0],points[(diag)%nr]);
                    }
                    var t1 = (t%pi2 + pi2) % pi2;
                    var j = Math.floor(t1 / pi2_n)%nr;
                    if (isNaN(j)) return j;
                    //t1 = (t1-j*pi2_n)*0.5 + beta+j*pi2_n;
                    t1 = t1*0.5+j*pi2_n*0.5 + beta;
                    return points[j][which]()+d*Math[trig](t1);
                };
            };
    return [
            makeFct('X','cos'),
            makeFct('Y','sin'),
            0,
            Math.PI*2
        ];
};        
