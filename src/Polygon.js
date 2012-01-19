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

/**
 * Creates a new instance of JXG.Polygon.
 * @class Polygon stores all style and functional properties that are required
 * to draw and to interactact with a polygon.
 * @param {JXG.Board} board Reference to the board the polygon is to be drawn on.
 * @param {Array} vertices Unique identifiers for the points defining the polygon.
 * Last point must be first point. Otherwise, the first point will be added at the list.
 * @param {Object} attributes An object which contains properties as given in {@link JXG.Options.elements}
 * and {@link JXG.Options.polygon}.
 * @constructor
 * @extends JXG.GeometryElement
 */

JXG.Polygon = function (board, vertices, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_POLYGON, JXG.OBJECT_CLASS_AREA);

    var i, vertex, l,
        attr_line = JXG.copyAttributes(attributes, board.options, 'polygon', 'borders');
    
    this.withLines = attributes.withlines;
    this.attr_line = attr_line;

    /**
     * References to the points defining the polygon. The last vertex is the same as the first vertex.
     * @type Array
     */    
    this.vertices = [];    
    for(i=0; i<vertices.length; i++) {
       vertex = JXG.getRef(this.board, vertices[i]);
       this.vertices[i] = vertex;
    }
    
    if(this.vertices[this.vertices.length-1] != this.vertices[0]) {
        this.vertices.push(this.vertices[0]);
    }
    
    /**
     * References to the border lines of the polygon.
     * @type Array
     */  
    this.borders = [];
    if (this.withLines) {
        for(i = 0; i < this.vertices.length - 1; i++) {
            attr_line.id = attr_line.ids && attr_line.ids[i];
            attr_line.strokecolor = JXG.isArray(attr_line.colors) && attr_line.colors[i % attr_line.colors.length] || attr_line.strokecolor;
            if (attr_line.strokecolor===false) attr_line.strokecolor = 'none';
            l = JXG.createSegment(board, [this.vertices[i], this.vertices[i+1]], attr_line);
            l.dump = false;
            this.borders[i] = l;
            l.parentPolygon = this;
        }
    }
    
    // Add polygon as child to defining points
    for(i=0; i<this.vertices.length-1; i++) { // last vertex is first vertex
        vertex = JXG.getReference(this.board, this.vertices[i]);
        vertex.addChild(this);
    }
    
    // create label
    this.createLabel([0, 0]);
    
    /* Register polygon at board */
    this.id = this.board.setId(this, 'Py');
    this.board.renderer.drawPolygon(this);
    this.board.finalizeAdding(this);


    this.elType = 'polygon';
};
JXG.Polygon.prototype = new JXG.GeometryElement;


JXG.extend(JXG.Polygon.prototype, /** @lends JXG.Polygon.prototype */ {
    /**
     * Checks whether (x,y) is near the polygon.
     * @param {Number} x Coordinate in x direction, screen coordinates.
     * @param {Number} y Coordinate in y direction, screen coordinates.
     * @return {Boolean} Returns true, if (x,y) is inside or at the boundary the polygon, otherwise false.
     */
    hasPoint: function (x,y) {

        var i, j, len, c = false;

        if (this.visProp.hasinnerpoints) {
            // All points of the polygon trigger hasPoint: inner and boundary points 
            len = this.vertices.length;
            // See http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html for a reference
            for (i=0, j=len-2; i<len-1; j=i++) { // last vertex is first vertex
                if (((this.vertices[i].coords.scrCoords[2] > y) != (this.vertices[j].coords.scrCoords[2] > y))
                    && (x < (this.vertices[j].coords.scrCoords[1] - this.vertices[i].coords.scrCoords[1]) * (y - this.vertices[i].coords.scrCoords[2])
                        / (this.vertices[j].coords.scrCoords[2] - this.vertices[i].coords.scrCoords[2]) + this.vertices[i].coords.scrCoords[1])) {
                    c = !c;
                }
            }
        } else {
            // Only boundary points trigger hasPoint
            len = this.borders.length;
            for (i=0; i<len; i++) {
                if (this.borders[i].hasPoint(x,y)) {
                    c = true;
                    break;
                }
            }
        }

        return c;
    },

    /**
     * Uses the boards renderer to update the polygon.
     */
    updateRenderer: function () {
        if (this.needsUpdate) {
            this.board.renderer.updatePolygon(this);
            this.needsUpdate = false;
        }
        if(this.hasLabel && this.label.content.visProp.visible) {
            //this.label.setCoordinates(this.coords);
            this.label.content.update();
            //this.board.renderer.updateLabel(this.label);
            this.board.renderer.updateText(this.label.content);
        }    
    },

    /**
     * return TextAnchor
     */
    getTextAnchor: function() {
        var a = this.vertices[0].X(),
            b = this.vertices[0].Y(),
            x = a,
            y = b,
            i;

        for (i = 0; i < this.vertices.length; i++) {
            if (this.vertices[i].X() < a)
                a = this.vertices[i].X();
            if (this.vertices[i].X() > x)
                x = this.vertices[i].X();
            if (this.vertices[i].Y() > b)
                b = this.vertices[i].Y();
            if (this.vertices[i].Y() < y)
                y = this.vertices[i].Y();
        }

        return new JXG.Coords(JXG.COORDS_BY_USER, [(a + x)*0.5, (b + y)*0.5], this.board);
    },

    getLabelAnchor: JXG.shortcut(JXG.Polygon.prototype, 'getTextAnchor'),

    // documented in geometry element
    cloneToBackground: function() {
        var copy = {}, er;

        copy.id = this.id + 'T' + this.numTraces;
        this.numTraces++;
        copy.vertices = this.vertices;
        copy.visProp = JXG.deepCopy(this.visProp, this.visProp.traceattributes, true);
        copy.visProp.layer = this.board.options.layer.trace;
        copy.board = this.board;
        JXG.clearVisPropOld(copy);
        
        er = this.board.renderer.enhancedRendering;
        this.board.renderer.enhancedRendering = true;
        this.board.renderer.drawPolygon(copy);
        this.board.renderer.enhancedRendering = er;
        this.traces[copy.id] = copy.rendNode;

        return this;
    },

    /**
     * Hide the polygon including its border lines. It will still exist but not visible on the board.
     */    
    hideElement: function() {
        var i;

        this.visProp.visible = false;
        this.board.renderer.hide(this);

        for(i = 0; i < this.borders.length; i++) {
            this.borders[i].hideElement();
        }

        if (this.hasLabel && JXG.exists(this.label)) {
            this.label.hiddenByParent = true;
            if(this.label.content.visProp.visible) {
                this.board.renderer.hide(this.label.content);
            }
        }    
    },

    /**
     * Make the element visible.
     */    
    showElement: function() {
        var i;

        this.visProp.visible = true;
        this.board.renderer.show(this);

        for(i = 0; i < this.borders.length; i++) {
            this.borders[i].showElement();
        }

        if (this.hasLabel && JXG.exists(this.label)) {
            if(this.label.content.visProp.visible) {
                this.board.renderer.show(this.label.content);
            }
        }
    },

    /**
     * returns the area of the polygon
     */ 
    Area: function() {
        //Surveyor's Formula
        var area = 0, i;

        for (i = 0; i < this.vertices.length - 1; i++) {
            area += (this.vertices[i].X()*this.vertices[i+1].Y()-this.vertices[i+1].X()*this.vertices[i].Y()); // last vertex is first vertex
        }
        area /= 2.0;
        return Math.abs(area);
    },

    /**
     * This method removes the SVG or VML nodes of the lines and the filled area from the renderer, to remove
     * the object completely you should use {@link JXG.Board#removeObject}.
     */
    remove: function () {
        var i;

        for (i = 0; i < this.borders.length; i++) {
            this.board.removeObject(this.borders[i]);
        }
        this.board.renderer.remove(this.rendNode);
    },

    /**
     * Finds the index to a given point reference.
     * @param {JXG.Point} p Reference to an element of type {@link JXG.Point}
     */
    findPoint: function (p) {
        var i;
        
        if (!JXG.isPoint(p)) {
            return -1;
        }
        
        for (i = 0; i < this.vertices.length; i++) {
            if (this.vertices[i].id === p.id) {
                return i;
            }
        }
        
        return -1;
    },

    /**
     * Add more points to the polygon. The new points will be inserted at the end.
     * @param {%} % Arbitrary number of points
     * @returns {JXG.Polygon} Reference to the polygon
     */
    addPoints: function () {
        var args = Array.prototype.slice.call(arguments);

        return this.insertPoints.apply(this, [this.vertices.length-2].concat(args));
    },

    /**
     * Adds more points to the vertex list of the polygon, starting with index <tt><i</tt>
     * @param {Number} i The position where the new vertices are inserted, starting with 0.
     * @param {%} % Arbitrary number of points to insert.
     * @returns {JXG.Polygon} Reference to the polygon object
     */
    insertPoints: function () {
        var idx, i, npoints = [], tmp;

        if (arguments.length === 0) {
            return this;
        }

        idx = arguments[0];

        if (idx < 0 || idx > this.vertices.length-2) {
            return this;
        }

        for (i = 1; i < arguments.length; i++) {
            if (JXG.isPoint(arguments[i])) {
                npoints.push(arguments[i]);
            }
        }

        tmp = this.vertices.slice(0, idx+1).concat(npoints);
        this.vertices = tmp.concat(this.vertices.slice(idx+1));

        if (this.withLines) {
            tmp = this.borders.slice(0, idx);
            this.board.removeObject(this.borders[idx]);

            for (i = 0; i < npoints.length; i++) {
                tmp.push(JXG.createSegment(this.board, [this.vertices[idx+i], this.vertices[idx+i+1]], this.attr_line));
            }
            tmp.push(JXG.createSegment(this.board, [this.vertices[idx+npoints.length], this.vertices[idx+npoints.length+1]], this.attr_line));

            this.borders = tmp.concat(this.borders.slice(idx));
        }

        this.board.update();

        return this;
    },
    
    /**
     * Removes given set of vertices from the polygon
     * @param {%} % Arbitrary number of vertices as {@link JXG.Point} elements or index numbers
     * @returns {JXG.Polygon} Reference to the polygon
     */
    removePoints: function () {
        var i, j, idx, nvertices = [], nborders = [],
            nidx = [], partition = [];
            
        // partition:
        // in order to keep the borders which could be recycled, we have to partition
        // the set of removed points. I.e. if the points 1, 2, 5, 6, 7, 10 are removed,
        // the partition is
        //       1-2, 5-7, 10-10
        // this gives us the borders, that can be removed and the borders we have to create.
        
        
        // remove the last vertex which is identical to the first        
        this.vertices = this.vertices.slice(0, this.vertices.length-1);
        
        // collect all valid parameters as indices in nidx
        for (i = 0; i < arguments.length; i++) {
            if (JXG.isPoint(arguments[i])) {
                idx = this.findPoint(arguments[i]);
            }
            
            if (JXG.isNumber(idx) && idx > -1 && idx < this.vertices.length && JXG.indexOf(nidx, idx) === -1) {
                nidx.push(idx);
            }
        }
        
        // sort the elements to be eliminated
        nidx = nidx.sort();
        nvertices = this.vertices.slice();
        nborders = this.borders.slice();
        
        // initialize the partition
        if (this.withLines) {
            partition.push([nidx[nidx.length-1]]);
        }
        
        // run through all existing vertices and copy all remaining ones to nvertices
        // compute the partition
        for (i = nidx.length-1; i > -1; i--) {
            nvertices[nidx[i]] = -1;
            
            if (this.withLines && (nidx[i] - 1 > nidx[i-1])) {
                partition[partition.length-1][1] = nidx[i];
                partition.push([nidx[i-1]]);
            }
        }
        
        // finalize the partition computation
        if (this.withLines) {
            partition[partition.length-1][1] = nidx[0];
        }
        
        // update vertices
        this.vertices = [];
        for (i = 0; i < nvertices.length; i++) {
            if (JXG.isPoint(nvertices[i])) {
                this.vertices.push(nvertices[i]);
            }
        }
        if (this.vertices[this.vertices.length-1].id !== this.vertices[0].id) {
            this.vertices.push(this.vertices[0]);
        }

        // delete obsolete and create missing borders
        if (this.withLines) {
            for (i = 0; i < partition.length; i++) {
                for (j = partition[i][1] - 1; j < partition[i][0] + 1; j++) {
                    // special cases
                    if (j < 0) {
                        // first vertex is removed, so the last border has to be removed, too
                        j = 0;
                        this.board.removeObject(this.borders[nborders.length-1]);
                        nborders[nborders.length-1] = -1;
                    } else if (j > nborders.length-1) {
                        j = nborders.length-1;
                    }

                    this.board.removeObject(this.borders[j]);
                    nborders[j] = -1;
                }
                
                // only create the new segment if it's not the closing border. the closing border is getting a special treatment at the end
                // the if clause is newer than the min/max calls inside createSegment; i'm sure this makes the min/max calls obsolete, but
                // just to be sure...
                if (partition[i][1] !== 0 && partition[i][0] !== nvertices.length-1) {
                    nborders[partition[i][0] - 1] = JXG.createSegment(this.board, [nvertices[Math.max(partition[i][1]-1, 0)], nvertices[Math.min(partition[i][0]+1, this.vertices.length-1)]], this.attr_line);
                }
            }
            
            this.borders = [];
            for (i = 0; i < nborders.length; i++) {
                if (nborders[i] !== -1) {
                    this.borders.push(nborders[i]);
                }
            }

            // if the first and/or the last vertex is removed, the closing border is created at the end.
            if (partition[0][1] === 5 || partition[partition.length-1][1] === 0) {
                this.borders.push(JXG.createSegment(this.board, [this.vertices[0], this.vertices[this.vertices.length-2]], this.attr_line));
            }
        }
        
        this.board.update();

        return this;
    },

    getParents: function () {
        var p = [], i;

        for (i = 0; i < this.vertices.length; i++) {
            p.push(this.vertices[i].id);
        }
        return p;
    },

    getAttributes: function () {
        var attr = JXG.GeometryElement.prototype.getAttributes.call(this), i;

        if (this.withLines) {
            attr.lines = attr.lines || {};
            attr.lines.ids = [];
            attr.lines.colors = [];

            for (i = 0; i < this.borders.length; i++) {
                attr.lines.ids.push(this.borders[i].id);
                attr.lines.colors.push(this.borders[i].visProp.strokecolor);
            }
        }

        return attr;
    }
});


/**
 * @class A polygon is an area enclosed by a set of border lines which are determined by a list of points. Each two
 * consecutive points of the list define a line.
 * @pseudo
 * @constructor
 * @name Polygon
 * @type Polygon
 * @augments JXG.Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array} vertices The polygon's vertices. If the first and the last vertex don't match the first one will be
 * added to the array by the creator.
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 * var p3 = board.create('point', [4.0, 6.0]);
 * var p4 = board.create('point', [1.0, 3.0]);
 *
 * var pol = board.create('polygon', [p1, p2, p3, p4]);
 * </pre><div id="682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [2.0, 1.0]),
 *       p3 = board.create('point', [4.0, 6.0]),
 *       p4 = board.create('point', [1.0, 3.0]),
 *       cc1 = board.create('polygon', [p1, p2, p3, p4]);
 *  })();
 * </script><pre>
 */
JXG.createPolygon = function(board, parents, attributes) {
    var el, i, attr = JXG.copyAttributes(attributes, board.options, 'polygon');

    // Sind alles Punkte?
    for(i = 0; i < parents.length; i++) {
        parents[i] = JXG.getReference(board, parents[i]);
        if(!JXG.isPoint(parents[i]))
            throw new Error("JSXGraph: Can't create polygon with parent types other than 'point'.");
    }
    
    el = new JXG.Polygon(board, parents, attr);

    return el;
};


/**
 * @class Constructs a regular polygon. It needs two points which define the base line and the number of vertices.
 * @pseudo
 * @description Constructs a regular polygon. It needs two points which define the base line and the number of vertices, or a set of points.
 * @constructor
 * @name RegularPolygon
 * @type Polygon
 * @augments Polygon
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_Number} p1,p2,n The constructed regular polygon has n vertices and the base line defined by p1 and p2.
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [2.0, 1.0]);
 *
 * var pol = board.create('regularpolygon', [p1, p2, 5]);
 * </pre><div id="682069e9-9e2c-4f63-9b73-e26f8a2b2bb1" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *  (function () {
 *   var board = JXG.JSXGraph.initBoard('682069e9-9e2c-4f63-9b73-e26f8a2b2bb1', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [2.0, 1.0]),
 *       cc1 = board.create('regularpolygon', [p1, p2, 5]);
 *  })();
 * </script><pre>
 * @example
 * var p1 = board.create('point', [0.0, 2.0]);
 * var p2 = board.create('point', [4.0,4.0]);
 * var p3 = board.create('point', [2.0,0.0]);
 *
 * var pol = board.create('regularpolygon', [p1, p2, p3]);
 * </pre><div id="096a78b3-bd50-4bac-b958-3be5e7df17ed" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('096a78b3-bd50-4bac-b958-3be5e7df17ed', {boundingbox: [-1, 9, 9, -1], axis: false, showcopyright: false, shownavigation: false}),
 *       p1 = board.create('point', [0.0, 2.0]),
 *       p2 = board.create('point', [4.0, 4.0]),
 *       p3 = board.create('point', [2.0,0.0]),
 *       cc1 = board.create('regularpolygon', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createRegularPolygon = function(board, parents, attributes) {
    var el, i, n, p = [], rot, c, len, pointsExist, attr;

    if (JXG.isNumber(parents[parents.length-1]) && parents.length!=3) {
        throw new Error("JSXGraph: A regular polygon needs two points and a number as input.");
    }

    len = parents.length;
    n = parents[len-1];
    if ((!JXG.isNumber(n) && !JXG.isPoint(JXG.getReference(board, n))) || n<3) {
        throw new Error("JSXGraph: The third parameter has to be number greater than 2 or a point.");
    }
    
    if (JXG.isPoint(JXG.getReference(board, n))) {  // Regular polygon given by n points
        n = len;
        pointsExist = true;
    } else {
        len--;
        pointsExist = false;
    }
    
    // The first two parent elements have to be points
    for(i=0; i<len; i++) {
        parents[i] = JXG.getReference(board, parents[i]);
        if(!JXG.isPoint(parents[i]))
            throw new Error("JSXGraph: Can't create regular polygon if the first two parameters aren't points.");
    }

    p[0] = parents[0];
    p[1] = parents[1];
    attr = JXG.copyAttributes(attributes, board.options, 'polygon', 'vertices');
    for (i=2;i<n;i++) {
        rot = board.create('transform', [Math.PI*(2.0-(n-2)/n),p[i-1]], {type:'rotate'});
        if (pointsExist) {
            p[i] = parents[i];
            p[i].addTransform(parents[i-2],rot);
        } else {
            if (JXG.isArray(attr.ids) && attr.ids.length >= n-2) {
                attr.id = attr.ids[i-2];
            }
            p[i] = board.create('point',[p[i-2],rot], attr);
        }
    }
    attr = JXG.copyAttributes(attributes, board.options, 'polygon');
    el = board.create('polygon', p, attr);

    el.elType = 'regularpolygon';

    return el;
};

JXG.JSXGraph.registerElement('polygon', JXG.createPolygon);
JXG.JSXGraph.registerElement('regularpolygon', JXG.createRegularPolygon);
