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
 * @fileoverview In this file the namespace Math.Symbolic is defined, which holds methods
 * and algorithms for symbolic computations.
 * @author graphjs
 */
 
JXG.Math.Symbolic = new Object();

/**
 * Generates symbolic coordinates for the part of a construction including all the elements from that
 * a specific element depends of. These coordinates will be stored in GeometryElement.symbolic.
 * @param {JXG.Board} board The board that's element get some symbolic coordinates.
 * @param {JXG.GeometryElement} element All ancestor of this element get symbolic coordinates.
 * @param {String} variable Name for the coordinates, e.g. x or u.
 * @param {String} append Method for how to append the number of the coordinates. Possible values are
 *                        'underscore' (e.g. x_2), 'none' (e.g. x2), 'brace' (e.g. x[2]).
 * @type int
 * @return Number of coordinates given.
 */
JXG.Math.Symbolic.generateSymbolicCoordinatesPartial = function(board, element, variable, append) {
    function makeCoords(num) {
        if (append == 'underscore')
            return '' + variable + '_' + num;
        else if (append == 'brace')
            return '' + variable + '[' + num + ']';
        else
            return '' + variable + '' + num;
    }

    var list = element.ancestors;
    var count = 0;
    var t_num;
    for(var t in list) {
        t_num = 0;
        if (JXG.IsPoint(list[t])) {
            for(var k in list[t].ancestors) {
                t_num++;
            }
            if(t_num == 0) {
                list[t].symbolic.x = element.ancestors[t].coords.usrCoords[1];
                list[t].symbolic.y = element.ancestors[t].coords.usrCoords[2];
            } else {
                count++;
                element.ancestors[t].symbolic.x = makeCoords(count);
                count++;
                element.ancestors[t].symbolic.y = makeCoords(count);
            }

        }
    }
};

/**
 * Clears all .symbolic.x and .symbolic.y members on every point of a given board.
 * @param {JXG.Board} board The board that's points get cleared their symbolic coordinates.
 */
JXG.Math.Symbolic.clearSymbolicCoordinates = function(board) {
    for(var t in board.objects) {
        if (JXG.IsPoint(list[t])) {
            board.objects[t].symbolic.x = '';
            board.objects[t].symbolic.y = '';
        }
    }
};