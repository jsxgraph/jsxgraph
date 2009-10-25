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
 * @fileoverview Example file for a centroid implemented as an extension to JSXGraph. 
 */
 
/**
 * Creates a new centroid point using three points and the given attributes.
 * @param {JXG.Board} board The board the triangle is put on.
 * @param {Array} parents Array of three points defining the triangle.
 * @param {Object} attributes Visual properties that are assigned to the constructed lines.
 * @type JXG.Point
 * @return An object of type JXG.Point;
 */
JXG.createCentroid = function(board, parents, attributes) {
    
    if(JXG.isPoint(parents[0]) && JXG.isPoint(parents[1]) && JXG.isPoint(parents[2])) {
        var p1 = parents[0], p2 = parents[1], p3 = parents[2];
        
        if((attributes == null) || (typeof attribues == undefined))
            attributes = new Object();
            
        var cent = board.createElement('point', [function () {return (p1.X() + p2.X() + p3.X())/3;}, function () {return (p1.Y() + p2.Y() + p3.Y())/3;}], attributes);
        p1.addChild(cent);
        p2.addChild(cent);
        p3.addChild(cent);
        cent.p1 = p1;
        cent.p2 = p2;
        cent.p3 = p3;

        cent.generatePolynom = function() {
            /* TODO generate polynom*/
        };
        
        return cent;
    } else {
        throw new Error("JSXGraph: Can't create centroid with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");    
    }
};

JXG.JSXGraph.registerElement('centroid', JXG.createCentroid);
