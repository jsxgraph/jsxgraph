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
/**
 * Math.Symbolic
 */
JXG.Math.Symbolic = {};

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
            return '' + variable + '_{' + num + '}';
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
        if (JXG.isPoint(list[t])) {
            for(var k in list[t].ancestors) {
                t_num++;
            }
            if(t_num == 0) {
                list[t].symbolic.x = list[t].coords.usrCoords[1];
                list[t].symbolic.y = list[t].coords.usrCoords[2];
            } else {
                count++;
                list[t].symbolic.x = makeCoords(count);
                count++;
                list[t].symbolic.y = makeCoords(count);
            }

        }
    }

    if(JXG.isPoint(element)) {
        element.symbolic.x = 'x';
        element.symbolic.y = 'y';
    }

    return count;
};

/**
 * Clears all .symbolic.x and .symbolic.y members on every point of a given board.
 * @param {JXG.Board} board The board that's points get cleared their symbolic coordinates.
 */
JXG.Math.Symbolic.clearSymbolicCoordinates = function(board) {
    for(var t in board.objects) {
        if (JXG.isPoint(board.objects[t])) {
            board.objects[t].symbolic.x = '';
            board.objects[t].symbolic.y = '';
        }
    }
};

/**
 * Generates polynomials for the part of a construction including all the points from that
 * a specific element depends of.
 * @param {JXG.Board} board The board that's points polynomials will be generated.
 * @param {JXG.GeometryElement} element All points in the set of ancestors of this element are used to generate the set of polynomials.
 * @type Array
 * @return Array of polynomials as strings.
 */
JXG.Math.Symbolic.generatePolynomials = function(board, element, generateCoords) {
    if(generateCoords)
        this.generateSymbolicCoordinatesPartial(board, element, 'u', 'brace');

    var list = element.ancestors,
        number_of_ancestors,
        pgs = [],
        result = [],
        t, k, i;
    list[element.id] = element;

    for(t in list) {
        number_of_ancestors = 0;
        pgs = [];
        if (JXG.isPoint(list[t])) {
            for(k in list[t].ancestors) {
                number_of_ancestors++;
            }
            if(number_of_ancestors > 0) {
                pgs = list[t].generatePolynomial();
                for(i=0; i<pgs.length; i++)
                    result.push(pgs[i]);
            }
        }
    }

    if(generateCoords)
        this.clearSymbolicCoordinates(board);

    return result;
};

/**
 * Calculate geometric locus of a point given on a board. Invokes python script on server.
 * @param {JXG.Board} board The board on that the point lies.
 * @param {JXG.Point} point The point that will be traced.
 * @param {function} callback A callback function that is called after the server request is finished.
 *    Must take an array of strings as the only parameter.
 * @type Array
 * @return Array of points.
 */
JXG.Math.Symbolic.geometricLocusByGroebnerBase = function(board, point, callback) {
    var numDependent = this.generateSymbolicCoordinatesPartial(board, point, 'u', 'brace'),
        poly = this.generatePolynomials(board, point);
    var polyStr = poly.join(','),
        xsye = new JXG.Coords(JXG.COORDS_BY_USR, [0,0], board),
        xeys = new JXG.Coords(JXG.COORDS_BY_USR, [board.canvasWidth, board.canvasHeight], board),
        fileurl;

    if(typeof JXG.Server.modules.geoloci == 'undefined')
        JXG.Server.loadModule('geoloci')

    if(typeof JXG.Server.modules.geoloci == 'undefined')
        throw new Error("JSXGraph: Unable to load JXG.Server module 'geoloci.py'.");

    this.cbp = function(data) {
        //alert(data.exectime);
        callback(data.datax, data.datay, data.polynomial);
    };

    this.cb = JXG.bind(this.cbp, this);

    JXG.Server.modules.geoloci.lociCoCoA(xsye.usrCoords[1], xeys.usrCoords[1], xeys.usrCoords[2], xsye.usrCoords[2], numDependent, polyStr, this.cb);

    this.clearSymbolicCoordinates(board);
};
