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
        var alpha = 0,
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
            mx, my, c1x, c1y, c2x, c2y, c1dist,
            rotation = brd.create('transform',[function(){ return alpha;}, 
                                           function(){ return c1.X(t1);},
                                           function(){ return c1.Y(t1);}], 
                                          {type:'rotate'}),
            linDist = function(t) {
                c2x = mx - c2.X(t);
                c2y = my - c2.Y(t);
                return c1dist - (c2x*c2x+c2y*c2y);
                },   
            beta = Math.PI/18.0,
            beta9 = beta*9,
            interval = null; 

        this.rolling = function(){
            t1_new = t1+direction*stepsize;
            mx = c1.X(t1);
            my = c1.Y(t1);
            c1x = mx - c1.X(t1_new);
            c1y = my - c1.Y(t1_new);
            c1dist = c1x*c1x+c1y*c1y;  // used in linDist
            t2_new = JXG.Math.Numerics.root(linDist, t2+direction*stepsize);
            alpha = -JXG.Math.Geometry.rad(
                    [c1.X(t1_new),c1.Y(t1_new)],
                    [c1.X(t1),c1.Y(t1)],
                    [c2.X(t2_new),c2.Y(t2_new)]);
            if (alpha <-beta && alpha>-beta9) { // -(10-90) degrees
                alpha = -beta;
                rotation.applyOnce(pointlist);
            } else if (alpha>-2*Math.PI+beta && alpha<-2*Math.PI+beta9) {
                alpha = -2*Math.PI+beta;
                rotation.applyOnce(pointlist);
            } else {
                rotation.applyOnce(pointlist);
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
        beta, d = 0,
        makeFct = function(which, trig) {
                return function(t, suspendUpdate) {
                    if (!suspendUpdate) {
                        d = points[0].Dist(points[diag]);
                        beta = JXG.Math.Geometry.rad([points[0].X()+1,points[0].Y()],points[0],points[(diag)%nr]);
                    }
                    var t1 = (t%pi2 + pi2) % pi2;
                    var j = Math.floor(t1 / pi2_n)%nr;
                    if (isNaN(j)) return j;
                    t1 = (t1-j*pi2_n)*0.5 + beta+j*pi2_n;
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
