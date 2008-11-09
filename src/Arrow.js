/*
    Copyright 2008, 
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
 * Creates a new arrow.
 * @param {JXG.Board} board The board the arrow is put on.
 * @param {Array} parents Array of two points defining the arrow.
 * @param {Object} attributs Object containing properties for the element such as stroke-color and visibility. See @see JXG.GeometryElement#setProperty
 * @type JXG.Line
 * @return Reference to the created arrow object.
 */
JXG.createArrow = function(board, parents, attributes) {
    var el;
    
    if ( (JXG.IsPoint(parents[0])) && (JXG.IsPoint(parents[1])) ) {
        el = new JXG.Line(board, parents[0], parents[1], attributes['id'], attributes['name']);
		el.setStraight(false,false);
		el.setArrow(false,true);
    } // Ansonsten eine fette Exception um die Ohren hauen
    else
        throw ("Can't create arrow with parent types '" + (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'.");

    return el;
};

JXG.JSXGraph.registerElement('arrow', JXG.createArrow);