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
 * @fileoverview In this file some simple element types like
 * numerics, distance etc. are defined.
 * @author graphjs
 * @version 0.1
 */
 
/**
 * Creates a new element of type numeric. The numeric element is a simple element which just stores a (dynamic) numeric value.
 * @param {JXG.Board} board The board the numeric value is assigned to.
 * @param {numeric,function} parents A numeric value or a function returning a numeric value.
 * @param {Object} attributs Object containing properties for the element such as stroke-color and visibility. See @see JXG.GeometryElement#setProperty
 * @type numeric,function
 * @return Reference to the given function or value of the given numeric.
 */
JXG.createNumeric = function(board, parents, attributes) {
	return parents;
};

JXG.JSXGraph.registerElement('numeric', JXG.createNumeric);