/*
    Copyright 2008-2011
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

/**
 * @class A circular sector is a subarea of the area enclosed by a circle. It is enclosed by two radii and an arc.
 * @pseudo
 * @name Sector
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 A sector is defined by three points: The sector's center <tt>p1</tt>,
 * a second point <tt>p2</tt> defining the radius and a third point <tt>p3</tt> defining the angle of the sector. The
 * Sector is always drawn counter clockwise from <tt>p2</tt> to <tt>p3</tt>
 * @example
 * // Create an arc out of three free points
 * var p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('sector', [p1, p2, p3]);
 * </pre><div id="49f59123-f013-4681-bfd9-338b89893156" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('49f59123-f013-4681-bfd9-338b89893156', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('sector', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createSector = function(board, parents, attributes) {
    var el, attr;
        
    // Alles 3 Punkte?
    if ( !(JXG.isPoint(parents[0]) && JXG.isPoint(parents[1]) && JXG.isPoint(parents[2]))) {
        throw new Error("JSXGraph: Can't create Sector with parent types '" + 
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + 
                        (typeof parents[2]) + "'.");
    }

    attr = JXG.copyAttributes(attributes, board.options, 'sector');

    el = board.create('curve', [[0], [0]], attr);
    el.type = JXG.OBJECT_TYPE_SECTOR;

    el.elType = 'sector';
    el.parents = [parents[0].id, parents[1].id, parents[2].id];

    /**
     * Midpoint of the sector.
     * @memberOf Sector.prototype
     * @name point1
     * @type JXG.Point
     */
    el.point1 = JXG.getReference(board, parents[0]);

    /**
     * This point together with {@link Sector#point1} defines the radius..
     * @memberOf Sector.prototype
     * @name point2
     * @type JXG.Point
     */
    el.point2 = JXG.getReference(board, parents[1]);

    /**
     * Defines the sector's angle.
     * @memberOf Sector.prototype
     * @name point3
     * @type JXG.Point
     */
    el.point3 = JXG.getReference(board, parents[2]);
    
    /* Add arc as child to defining points */
    el.point1.addChild(el);
    el.point2.addChild(el);
    el.point3.addChild(el);
    
    el.useDirection = attributes['usedirection'];      // useDirection is necessary for circumCircleSectors

    /**
     * documented in JXG.Curve
     * @ignore
     */
    el.updateDataArray = function() {
        var A = this.point2,
            B = this.point1,
            C = this.point3,
            beta, co, si, matrix,
            phi = JXG.Math.Geometry.rad(A,B,C),
            i,
            n = Math.ceil(phi/Math.PI*90)+1,
            delta = phi/n,
            x = B.X(),
            y = B.Y(),
            v, 
            det, p0c, p1c, p2c;

        if (this.useDirection) {  // This is true for circumCircleArcs. In that case there is
                                  // a fourth parent element: [midpoint, point1, point3, point2]
            p0c = parents[1].coords.usrCoords,
            p1c = parents[3].coords.usrCoords,
            p2c = parents[2].coords.usrCoords;
            det = (p0c[1]-p2c[1])*(p0c[2]-p1c[2]) - (p0c[2]-p2c[2])*(p0c[1]-p1c[1]);
            if(det < 0) {
                this.point2 = parents[1];
                this.point3 = parents[2];
            }
            else {
                this.point2 = parents[2];
                this.point3 = parents[1];
            }
        }
        this.dataX = [B.X(),A.X()];
        this.dataY = [B.Y(),A.Y()];
        for (beta=delta,i=1; i<=n; i++, beta+=delta) {
            co = Math.cos(beta); 
            si = Math.sin(beta); 
            matrix = [[1,            0,   0],
                      [x*(1-co)+y*si,co,-si],
                      [y*(1-co)-x*si,si, co]];    
            v = JXG.Math.matVecMult(matrix,A.coords.usrCoords);
            this.dataX.push(v[1]/v[0]);
            this.dataY.push(v[2]/v[0]);
        }
        this.dataX.push(B.X());
        this.dataY.push(B.Y());
    };

    /**
     * Returns the radius of the sector.
     * @memberOf Sector.prototype
     * @name Radius
     * @function
     * @returns {Number} The distance between {@link Sector#point1} and {@link Sector#point2}.
     */
    el.Radius = function() {
        return this.point2.Dist(this.point1);
    };

    /**
     * deprecated
     * @ignore
     */
    el.getRadius = function() {
        return this.Radius();
    };

    /**
     * Checks whether (x,y) is within the area defined by the sector.
     * @memberOf Sector.prototype
     * @name hasPointSector
     * @function
     * @param {Number} x Coordinate in x direction, screen coordinates.
     * @param {Number} y Coordinate in y direction, screen coordinates.
     * @returns {Boolean} True if (x,y) is within the sector defined by the arc, False otherwise.
     */
    el.hasPointSector = function (x, y) { 
        var checkPoint = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this.board),
            r = this.Radius(),
            dist = this.point1.coords.distance(JXG.COORDS_BY_USER,checkPoint),
            has = (dist<r),
            angle;
        
        if(has) {
            angle = JXG.Math.Geometry.rad(this.point2,this.point1,checkPoint.usrCoords.slice(1));
            if (angle>JXG.Math.Geometry.rad(this.point2,this.point1,this.point3)) { has = false; }
        }
        return has;    
    };

    /**
     * documented in GeometryElement
     * @ignore
     */
    el.getTextAnchor = function() {
        return this.point1.coords;
    };

    /**
     * documented in GeometryElement
     * @ignore
     */
    el.getLabelAnchor = function() {
        var angle = JXG.Math.Geometry.rad(this.point2, this.point1, this.point3),
            dx = 10/(this.board.unitX),
            dy = 10/(this.board.unitY),
            p2c = this.point2.coords.usrCoords,
            pmc = this.point1.coords.usrCoords,
            bxminusax = p2c[1] - pmc[1],
            byminusay = p2c[2] - pmc[2],
            coords, vecx, vecy, len;

        if(this.label.content != null) {                          
            this.label.content.relativeCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0],this.board);                      
        }  

        coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                        [pmc[1]+ Math.cos(angle*0.5)*bxminusax - Math.sin(angle*0.5)*byminusay, 
                        pmc[2]+ Math.sin(angle*0.5)*bxminusax + Math.cos(angle*0.5)*byminusay], 
                        this.board);

        vecx = coords.usrCoords[1] - pmc[1];
        vecy = coords.usrCoords[2] - pmc[2];
    
        len = Math.sqrt(vecx*vecx+vecy*vecy);
        vecx = vecx*(len+dx)/len;
        vecy = vecy*(len+dy)/len;

        return new JXG.Coords(JXG.COORDS_BY_USER, [pmc[1]+vecx,pmc[2]+vecy],this.board);
    };

    el.prepareUpdate().update();
    
    return el;
};

JXG.JSXGraph.registerElement('sector', JXG.createSector);


/**
 * @class A circumcircle sector is different from a {@link Sector} mostly in the way the parent elements are interpreted.
 * At first, the circum centre is determined from the three given points. Then the sector is drawn from <tt>p1</tt> through
 * <tt>p2</tt> to <tt>p3</tt>.
 * @pseudo
 * @name Circumcirclesector
 * @augments Sector
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 A circumcircle sector is defined by the circumcircle which is determined
 * by these three given points. The circumcircle sector is always drawn from <tt>p1</tt> through <tt>p2</tt> to <tt>p3</tt>.
 * @example
 * // Create an arc out of three free points
 * var p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('circumcirclesector', [p1, p2, p3]);
 * </pre><div id="695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('695cf0d6-6d7a-4d4d-bfc9-34c6aa28cd04', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [1.5, 5.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [5.0, 3.0]),
 *
 *     a = board.create('circumcirclesector', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
 JXG.createCircumcircleSector = function(board, parents, attributes) {
    var el, mp, attr;
    
    if ( (JXG.isPoint(parents[0])) && (JXG.isPoint(parents[1])) && (JXG.isPoint(parents[2]))) {
        attr = JXG.copyAttributes(attributes, board.options, 'circumcirclesector', 'point');
        mp = board.create('circumcirclemidpoint',[parents[0], parents[1], parents[2]], attr);

        mp.dump = false;

        attr = JXG.copyAttributes(attributes, board.options, 'circumcirclesector');
        el = board.create('sector', [mp,parents[0],parents[2],parents[1]], attr);

        el.elType = 'circumcirclesector';
        el.parents = [parents[0].id, parents[1].id, parents[2].id];
        el.subs = {
            point: mp
        }
    } else {
        throw new Error("JSXGraph: Can't create circumcircle sector with parent types '" + 
                        (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");
    }

    return el;
};

JXG.JSXGraph.registerElement('circumcirclesector', JXG.createCircumcircleSector);


/**
 * @class The angle element is used to denote an angle defined by three points. Visually it is just a {@link Sector}
 * element with a radius not defined by the parent elements but by an attribute <tt>radius</tt>. As opposed to the sector,
 * an angle has two angle points and no radius point.
 * Sector is displayed if type=="sector".
 * If type=="square", instead of a sector a parallelogram is displayed. 
 * In case of type=="auto", a square is displayed if the angle is near orthogonal.
 * @pseudo
 * @name Angle
 * @augments Sector
 * @constructor
 * @type Sector
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p1 An angle is always drawn counterclockwise from <tt>p1</tt> to
 * <tt>p3</tt> around <tt>p2</tt>.
 * @example
 * // Create an arc out of three free points
 * var p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('angle', [p1, p2, p3]);
 * </pre><div id="a34151f9-bb26-480a-8d6e-9b8cbf789ae5" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('a34151f9-bb26-480a-8d6e-9b8cbf789ae5', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [5.0, 3.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [1.5, 5.0]),
 *
 *     a = board.create('angle', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createAngle = function(board, parents, attributes) {
    var el, p, q, text, attr,
        possibleNames = ['&alpha;', '&beta;', '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta', '&theta;',
                                '&iota;', '&kappa;', '&lambda;', '&mu;', '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;', 
                                '&sigmaf;', '&sigma;', '&tau;', '&upsilon;', '&phi;', '&chi;', '&psi;', '&omega;'],
        i = 0,
        j, x, pre, post, found, dot;


    // Test if three points are given
    if ( (JXG.isPoint(parents[0])) && (JXG.isPoint(parents[1])) && (JXG.isPoint(parents[2]))) {
        //  If empty, create a new name
        text = attributes.text;
        if(text == '') {
            while(i < possibleNames.length) {
                j=i;
                x = possibleNames[i];
                for(el in board.objects) {
                    if(board.objects[el].type == JXG.OBJECT_TYPE_ANGLE) {
                        if(board.objects[el].text == x) {
                            i++;
                            break;
                        }
                    }
                }
                if(i==j) {
                    text = x;
                    i = possibleNames.length+1;
                }
            }
            if(i == possibleNames.length) {
                pre = '&alpha;_{';
                post = '}';
                found = false;
                j=0;
                while(!found) {
                    for(el in board.objects) {
                        if(board.objects[el].type == JXG.OBJECT_TYPE_ANGLE) {
                            if(board.objects[el].text == (pre+j+post)) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if(found) {
                        found= false;
                    }
                    else {
                        found = true;
                        text = (pre+j+post);
                    }
                }
            }
        }
        
        attr = JXG.copyAttributes(attributes, board.options, 'angle', 'point');
        p = board.create('point', [
            function(){
                var A = parents[0], S = parents[1],
                    r = JXG.evaluate(attr.radius),
                    d = S.Dist(A);
                return [S.X()+(A.X()-S.X())*r/d, S.Y()+(A.Y()-S.Y())*r/d];
            }], attr);

        p.dump = false;

        attr = JXG.copyAttributes(attributes, board.options, 'angle', 'pointsquare');
        // Second helper point for square
        q = board.create('point', [
            function(){
                var A = parents[2], S = parents[1],
                    r = JXG.evaluate(attr.radius),
                    d = S.Dist(A);
                return [S.X()+(A.X()-S.X())*r/d, S.Y()+(A.Y()-S.Y())*r/d];
            }], attr);

        q.dump = false;

        attr = JXG.copyAttributes(attributes, board.options, 'angle');
        
        // Sector is just a curve with its own updateDataArray method
        el = board.create('sector', [parents[1], p, parents[2]], attr);

        el.elType = 'angle';
        el.parents = [parents[0].id, parents[1].id, parents[2].id];
        el.subs = {
            point: p,
            pointsquare: q
        };

        el.updateDataArraySquare = function() {
            var S = parents[1],
                v, l1, l2, r;
                   
            v = JXG.Math.crossProduct(q.coords.usrCoords, S.coords.usrCoords);
            l1 = [-p.X()*v[1]-p.Y()*v[2], p.Z()*v[1], p.Z()*v[2]];
            v = JXG.Math.crossProduct(p.coords.usrCoords, S.coords.usrCoords);
            l2 = [-q.X()*v[1]-q.Y()*v[2], q.Z()*v[1], q.Z()*v[2]];
            r = JXG.Math.crossProduct(l1,l2);
            r[1] /= r[0];
            r[2] /= r[0];
            
            this.dataX = [S.X(), p.X(), r[1], q.X(), S.X()];
            this.dataY = [S.Y(), p.Y(), r[2], q.Y(), S.Y()];
        };
        
        el.updateDataArraySector = el.updateDataArray;
        el.updateDataArray = function() {
            var rad;
            if (this.visProp.type=='square') {
                this.updateDataArraySquare();
            } else if (this.visProp.type=='sector') {
                this.updateDataArraySector();
            } else {
                rad = JXG.Math.Geometry.rad(parents[0], parents[1], parents[2]);
                if (Math.abs(rad-Math.PI*0.5)<0.005) {
                    this.updateDataArraySquare();
                } else {
                    this.updateDataArraySector();
                }
            }
        };
        
        /**
         * The point defining the radius of the angle element.
         * @type JXG.Point
         * @name radiuspoint
         * @memberOf Angle.prototype
         */
        el.radiuspoint = p;

        /**
         * The point defining the radius of the angle element. Alias for {@link Angle.prototype#radiuspoint}.
         * @type JXG.Point
         * @name point
         * @memberOf Angle.prototype
         */
        el.point = p;

        /**
         * Helper point for angles of type 'square'.
         * @type JXG.Point
         * @name pointsquare
         * @memberOf Angle.prototype
         */
        el.pointsquare = q;

        dot = JXG.copyAttributes(attributes, board.options, 'angle', 'dot');
        /**
         * Indicates a right angle. Invisible by default, use <tt>dot.visible: true</tt> to show.
         * Though this dot indicates a right angle, it can be visible even if the angle is not a right
         * one.
         * @type JXG.Point
         * @name dot
         * @memberOf Angle.prototype
         */
        el.dot = board.create('point', [function () {
            if (JXG.exists(el.dot) && el.dot.visProp.visible === false) {
                return [0, 0];
            }
            
            var c = p.coords.usrCoords,
                transform = board.create('transform', [-parents[1].X(), -parents[1].Y()], {type: 'translate'});
            
            transform.melt(board.create('transform', [0.5, 0.5], {type: 'scale'}));
            transform.melt(board.create('transform', [JXG.Math.Geometry.rad(parents[0], parents[1], parents[2])/2, 0, 0], {type:'rotate'}));
            transform.melt(board.create('transform', [parents[1].X(), parents[1].Y()], {type: 'translate'}));
            transform.update();

            return JXG.Math.matVecMult(transform.matrix, c);
        }], dot);

        el.dot.dump = false;
        el.subs.dot = el.dot;

        for (i = 0; i < 3; i++) {
            JXG.getRef(board,parents[i]).addChild(p);
            JXG.getRef(board,parents[i]).addChild(el.dot);
        }

        el.type = JXG.OBJECT_TYPE_ANGLE;

        if (el.visProp.withlabel) {
            el.label.content.setText(text);
            el.label.content.setProperty({fontSize:el.visProp.fontsize, strokeColor:el.visProp.textcolor});
        }
        JXG.getRef(board,parents[0]).addChild(el);

        // documented in GeometryElement
        el.getLabelAnchor = function() {
            var angle = JXG.Math.Geometry.rad(this.point2, this.point1, this.point3),
                dx = 13/(this.board.unitX),
                dy = 13/(this.board.unitY),
                p2c = this.point2.coords.usrCoords,
                pmc = this.point1.coords.usrCoords,
                bxminusax = p2c[1] - pmc[1],
                byminusay = p2c[2] - pmc[2],
                coords, vecx, vecy, len;

            if(this.label.content != null) {
                this.label.content.relativeCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0,0],this.board);
            }

            coords = new JXG.Coords(JXG.COORDS_BY_USER,
                            [pmc[1]+ Math.cos(angle*0.5*1.125)*bxminusax - Math.sin(angle*0.5*1.125)*byminusay,
                             pmc[2]+ Math.sin(angle*0.5*1.125)*bxminusax + Math.cos(angle*0.5*1.125)*byminusay],
                            this.board);

            vecx = coords.usrCoords[1] - pmc[1];
            vecy = coords.usrCoords[2] - pmc[2];
        
            len = Math.sqrt(vecx*vecx+vecy*vecy);
            vecx = vecx*(len+dx)/len;
            vecy = vecy*(len+dy)/len;

            return new JXG.Coords(JXG.COORDS_BY_USER, [pmc[1]+vecx,pmc[2]+vecy],this.board);
        };

    } else {
        throw new Error("JSXGraph: Can't create angle with parent types '" +
                         (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");
    }

    return el;
};

JXG.JSXGraph.registerElement('angle', JXG.createAngle);

