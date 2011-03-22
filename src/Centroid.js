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
 * @class The centroid marks the center of three points.
 * @pseudo
 * @name Centroid
 * @augments JXG.Point
 * @constructor
 * @type JXG.Point
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point_JXG.Point_JXG.Point} p1,p2,p3 The result is the center of this three points
 * @example
 * // Create a centroid out of three free points
 * var p1 = board.create('point', [2.0, 2.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [3.5, 1.0]),
 *
 *     c = board.create('centroid', [p1, p2, p3]);
 * </pre><div id="e86dd688-3a75-413f-9173-1776ee92416f" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function () {
 *   var board = JXG.JSXGraph.initBoard('e86dd688-3a75-413f-9173-1776ee92416f', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false}),
 *     p1 = board.create('point', [2.0, 2.0]),
 *     p2 = board.create('point', [1.0, 0.5]),
 *     p3 = board.create('point', [3.5, 1.0]),
 *
 *     c = board.create('centroid', [p1, p2, p3]);
 * })();
 * </script><pre>
 */
JXG.createCentroid = function(board, parents, attributes) {
    
    if(JXG.isPoint(parents[0]) && JXG.isPoint(parents[1]) && JXG.isPoint(parents[2])) {
        var p1 = parents[0],
            p2 = parents[1],
            p3 = parents[2],
            attr = JXG.copyAttributes(attributes, board.options, 'point');
        
        var cent = board.create('point', [function () {return (p1.X() + p2.X() + p3.X())/3;}, function () {return (p1.Y() + p2.Y() + p3.Y())/3;}], attr);
        p1.addChild(cent);
        p2.addChild(cent);
        p3.addChild(cent);

        /**
         * The first one of the points given as parent elements.
         * @name Centroid#p1
         * @type JXG.Point
         */
        cent.p1 = p1;

        /**
         * The second one of the points given as parent elements.
         * @name Centroid#p2
         * @type JXG.Point
         */
        cent.p2 = p2;

        /**
         * The last one of the points given as parent elements.
         * @name Centroid#p3
         * @type JXG.Point
         */
        cent.p3 = p3;

        /**
         * documented in geometry element
         * @ignore
         */
        cent.generatePolynom = function() {
            /* TODO generate polynom*/
        };
        
        return cent;
    } else {
        throw new Error("JSXGraph: Can't create centroid with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'.");    
    }
};

JXG.JSXGraph.registerElement('centroid', JXG.createCentroid);
