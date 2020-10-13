/*
    Copyright 2008-2020
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Alfred Wassermann

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 math/math
 math/numerics
 math/geometry
 utils/type
 */

/**
 * @fileoverview This file contains the Math.Clip namespace for clipping and computing boolean operations
 * on polygons and curves
 *
 * // TODO:
 * * Check if input polygons are closed. If not, handle this case.
 */

define([
    'jxg', 'base/constants', 'base/coords', 'math/math', 'math/geometry', 'utils/type'
], function (JXG, Const, Coords, Mat, Geometry, Type) {

    "use strict";

    /**
     * Math.Clip namespace definition. This namespace contains algorithms for Boolean operations on paths, i.e.
     * intersection, union and difference of paths. Base is the Greiner-Hormann algorithm.
     * @name JXG.Math.Clip
     * @exports Mat.Clip as JXG.Math.Clip
     * @namespace
     */
    Mat.Clip = {

        /**
         * Add pointers to an array S such that it is a circular doubly-linked list.
         *
         * @private
         * @param  {Array} S Array
         * @return {Array} return the array S
         */
        doublyLinkedList: function(S) {
            var i,
                le = S.length;

            if (le > 0) {
                for (i = 0; i < le; i++) {
                    S[i]._next = S[(i + 1) % le];
                    S[i]._prev = S[(le + i - 1) % le];
                }
                S[le - 1]._end = true;
            }

            return S;
        },

        /**
         * Determinant of three points in the Euclidean plane.
         * Zero, if the points are collinear. Used to determine of a point q is left or
         * right to a segment defined by points p1 and p2.
         * @private
         * @param  {Array} p1 Coordinates of the first point of the segment. Array of length 3. First coordinate is equal to 1.
         * @param  {Array} p2 Coordinates of the second point of the segment. Array of length 3. First coordinate is equal to 1.
         * @param  {Array} q Coordinates of the point. Array of length 3. First coordinate is equal to 1.
         * @return {Number} Signed area of the triangle formed by these three points.
         */
        det: function(p1, p2, q) {
            return (p1[1] - q[1]) * (p2[2] - q[2]) - (p2[1] - q[1]) * (p1[2] - q[2]);
        },

        _isCollinear: function(li0, li1) {
            if (Math.abs(this.det(li0[0], li0[1], li1[0])) > Mat.eps ||
                Math.abs(this.det(li0[0], li0[1], li1[1])) > Mat.eps ||
                Math.abs(this.det(li0[0], li1[0], li1[1])) > Mat.eps ||
                Math.abs(this.det(li0[1], li1[0], li1[1])) > Mat.eps) {
                return false;
            }
            return true;
        },

        /**
         * Winding number of a point in respect to a polygon path.
         *
         * The point is regarded outside if the winding number is zero,
         * inside otherwise. The algorithm tries to find degenerate cases, i.e.
         * if the point is on the path. This is regarded as "outside".
         * If the point is a vertex of the path, it is regarded as "inside".
         *
         * Implementation of algorithm 7 from "The point in polygon problem for
         * arbitrary polygons" by Kai Hormann and Alexander Agathos, Computational Geometry,
         * Volume 20, Issue 3, November 2001, Pages 131-144.
         *
         * @param  {Array} usrCoords Homogenous coordinates of the point
         * @param  {Array} path      Array of JXG.Coords determining a path, i.e. the vertices of the polygon.
         * @return {Number}          Winding number of the point. The point is
         *                           regarded outside if the winding number is zero,
         *                           inside otherwise.
         */
        windingNumber: function(usrCoords, path) {
            var wn = 0,
                le = path.length,
                x = usrCoords[1],
                y = usrCoords[2],
                p1, p2, d, sign, i;

            if (le === 0) {
                return 0;
            }

            // Infinite points are declared outside
            if (isNaN(x) || isNaN(y)) {
                return 1;
            }

            // Handle the case if the point is a vertex of the path
            if (path[0].coords.usrCoords[1] === x &&
                path[0].coords.usrCoords[2] === y) {

                // console.log('<<<<<<< Vertex 1');
                return 1;
            }

            for (i = 0; i < le; i++) {
                // Consider the edge from p1 = path[i] to p2 = path[i+1]
                p1 = path[i].coords.usrCoords;
                p2 = path[(i + 1) % le].coords.usrCoords;
                if (p1[0] === 0 || p2[0] === 0 ||
                    isNaN(p1[1]) || isNaN(p2[1]) ||
                    isNaN(p1[2]) || isNaN(p2[2])) {

                    continue;
                }

                if (p2[2] === y) {
                    if (p2[1] === x) {
                        // console.log('<<<<<<< Vertex 2');
                        return 1;
                    }
                    if (p1[2] === y && ((p2[1] > x) === (p1[1] < x))) {
                        // console.log('<<<<<<< Edge 1', p1, p2, [x, y]);
                        return 0;
                    }
                }

                if ((p1[2] < y) !== (p2[2] < y)) {
                    sign = 2 * ((p2[2] > p1[2]) ? 1 : 0) - 1;
                    if (p1[1] >= x) {
                        if (p2[1] > x) {
                            wn += sign;
                        } else {
                            d = this.det(p1, p2, usrCoords);
                            if (d === 0) {
                                // console.log('<<<<<<< Edge 2');
                                return 0;
                            }
                            if ((d > 0) === (p2[2] > p1[2])) {
                                wn += sign;
                            }
                        }
                    } else {
                        if (p2[1] > x) {
                            d = this.det(p1, p2, usrCoords);
                            if ((d > 0 + Mat.eps) === (p2[2] > p1[2])) {
                                wn += sign;
                            }
                        }
                    }
                }
            }

            return wn;
        },

        _addToList: function(list, coords, pos) {
            list.push({
                pos: pos,
                intersection: false,
                coords: coords,
                elementClass: Const.OBJECT_CLASS_POINT
            })
        },

        /**
         * JavaScript object containing the intersection of two paths. Every intersection point is on one path, but
         * comes with a neighbour point having the same coordinates and being on the other path.
         *
         * The intersection point is inserted into the doubly linked list of the path.
         *
         * @private
         * @param  {JXG.Coords} coords JSXGraph Coords object conatining the coordinates of the intersection
         * @param  {Number} i        Number of the segment of the subject path (first path) containing the intersection.
         * @param  {Number} alpha    The intersection is a p_1 + alpha*(p_2 - p_1), where p_1 and p_2 are the end points
         *      of the i-th segment.
         * @param  {Array} path      Pointer to the path containing the intersection point
         * @param  {String} pathname Name of the path: 'S' or 'C'.
         */
        Vertex: function(coords, i, alpha, path, pathname, type) {
            this.pos = i;
            this.intersection = true;
            this.coords = coords;
            this.elementClass = Const.OBJECT_CLASS_POINT;

            this.data = {
                alpha: alpha,
                path: path,
                pathname: pathname,
                done: false,
                type: type,
                idx: 0
            };

            // Set after initialisation
            this.neighbour = null;
            this.entry_exit = false;
        },

        /**
         * Sort the intersection points into their path.
         * @private
         * @param  {Array} P_crossings Array of arrays. Each array contains the intersections of the path
         *      with one segment of the other path.
         * @return {Array}  Array of intersection points ordered by first occurrence in the path.
         */
        sortIntersections: function(P_crossings) {
            var i, j, P, Q,
                last,
                next_node,
                P_intersect = [],
                P_le = P_crossings.length;

            for (i = 0; i < P_le; i++) {
                P_crossings[i].sort(function(a, b) { return (a.data.alpha > b.data.alpha) ? 1 : -1; });

                if (P_crossings[i].length > 0) {
// console.log("Crossings", P_crossings[i])
                    last = P_crossings[i].length - 1;
                    P = P_crossings[i][0];
                    Q =  P.data.path[P.pos];
                    next_node = Q._next;  // Store the next "normal" node

                    if (i === P_le - 1) {
                        Q._end = false;
                    }

                    if (P.data.alpha === 0.0 && P.data.type === 'T') {
//console.log("SKIP", P.coords.usrCoords, P.data.type, P.neighbour.data.type);
                        Q.intersection = true;
                        Q.data = P.data;
                        Q.neighbour = P.neighbour;
                        Q.neighbour.neighbour = Q;
                        Q.entry_exit = false;
                        P_crossings[i][0] = Q;
                    } else {
                        // Insert the first intersection point
                        P._prev = Q;
                        P._prev._next = P;
                    }

                    // Insert the other intersection points, but the last
                    for (j = 1; j <= last; j++) {
                        P = P_crossings[i][j];
                        P._prev = P_crossings[i][j - 1];
                        P._prev._next = P;
                    }

                    // Link last intersection point to the next node
                    P = P_crossings[i][last];
                    P._next = next_node;
                    P._next._prev = P;

                    if (i === P_le - 1) {
                        P._end = true;
//console.log("END", P._end, P.coords.usrCoords, P._prev.coords.usrCoords, P._next.coords.usrCoords);
                    }

                    P_intersect = P_intersect.concat(P_crossings[i]);
                }
            }
            return P_intersect;
        },

        _inbetween: function(q, p1, p2) {
            var alpha,
                px = p2[1] - p1[1],
                py = p2[2] - p1[2],
                qx = q[1]  - p1[1],
                qy = q[2]  - p1[2];

            if (px === 0 && py === 0 && qx === 0 && qy === 0) {
                // All three points are equal
                return true;
            }
            if (qx === 0 && px === 0) {
                alpha = qy / py;
            } else {
                alpha = qx / px;
            }
            return alpha;
        },

        _print_array: function(arr) {
            var i;
            for (i = 0; i < arr.length; i++) {
                console.log(i, arr[i].coords.usrCoords,  arr[i].data.type);
            }
        },

        _print_list: function(P) {
            var cnt = 0, alpha;
            while (true && cnt < 100) {
                if (P.data) {
                    alpha = P.data.alpha;
                } else {
                    alpha = '-';
                }
                console.log("\t", P.coords.usrCoords, "\n\t\tis:", P.intersection, "end:", P._end,
                            alpha,
                            "\n\t\t-:", P._prev.coords.usrCoords,
                            "\n\t\t+:", P._next.coords.usrCoords,
                            "\n\t\tn:", (P.intersection) ? P.neighbour.coords.usrCoords : '-'
                            );
                if (P._end) {
                    break;
                }
                P = P._next;
                cnt++;
            } ;
        },

        _noOverlap: function(p1, p2, q1, q2) {
            var k,
                minp, maxp, minq, maxq,
                no_overlap = false;

            for (k = 0; k < 3; k++) {
                minp = Math.min(p1[k], p2[k]);
                maxp = Math.max(p1[k], p2[k]);
                minq = Math.min(q1[k], q2[k]);
                maxq = Math.max(q1[k], q2[k]);
                if (maxp < minq || minp > maxq) {
                    no_overlap = true;
                    break;
                }
            }
            return no_overlap;
        },

        /**
         * Find all intersections between two paths.
         * @private
         * @param  {Array} S     Subject path
         * @param  {Array} C     Clip path
         * @param  {JXG.Board} board JSXGraph board object. It is needed to convert between
         * user coordinates and screen coordinates.
         * @return {Array}  Array containing two arrays. The first array contains the intersection vertices
         * of the subject path and the second array contains the intersection vertices of the clip path.
         * @see JXG.Clip#Vertex
         */
        findIntersections: function(S, C, board) {
            var res = [],
                i, j,
                crds,
                S_le = S.length,
                C_le = C.length,
                Si, Si1, Cj, Cj1,
                alpha,
                // cnt = 0,
                type,
                side1, side2, Qm, Qp, Pm, Pp,
                IS, IC,
                S_intersect = [],
                C_intersect = [],
                S_crossings = [],
                C_crossings = [];

            for (j = 0; j < C_le; j++) {
                C_crossings.push([]);
            }

            // Run through the subject path.
            for (i = 0; i < S_le; i++) {
                S_crossings.push([]);
                Si = S[i].coords.usrCoords;
                Si1 = S[(i + 1) % S_le].coords.usrCoords;

                // Run through the clip path.
                for (j = 0; j < C_le; j++) {
                    // Test if bounding boxes of the two curve segments overlap
                    // If not, the expensive intersection test can be skipped.
                    Cj  = C[j].coords.usrCoords;
                    Cj1 = C[(j + 1) % C_le].coords.usrCoords;

                    if (this._noOverlap(Si, Si1, Cj, Cj1)) {
                        continue;
                    }

                    // Intersection test
                    res = Geometry.meetSegmentSegment(Si, Si1, Cj, Cj1);

                    // Found an intersection point
                    // isCollinear = false;
                    if ((res[1] >= 0.0 && res[1] < 1.0 &&           // "regular" intersection
                        res[2] >= 0.0 && res[2] < 1.0) ||
                        (res[1] === Infinity &&
                         res[2] === Infinity && Mat.norm(res[0], 3) < Mat.eps) // collinear
                        ) {

                        crds = new Coords(Const.COORDS_BY_USER, res[0], board);

                        type = 'X';
                        // Degenerate cases
                        if (Math.abs(res[1]) < Mat.eps || Math.abs(res[2]) < Mat.eps) {
                            // Crossing / bouncing at vertex or
                            // end of delayed crossing / bouncing
                            type  = 'T';
                        } else if (res[1] === Infinity &&
                                   res[2] === Infinity &&
                                   Mat.norm(res[0], 3) < Mat.eps) {
                            // Collinear segments
// console.log("COLLINEAR--", res);
// console.log(Si, Si1)
// console.log(Cj, Cj1)
                            alpha = this._inbetween(Si, Cj, Cj1)
                            if (alpha >= 0 && alpha < 1) {
                                type = 'T';
                                crds = new Coords(Const.COORDS_BY_USER, Si, board);
// console.log("A", crds.usrCoords);
                                res[1] = 0;
                                res[2] = alpha;
                            } else {
                                alpha = this._inbetween(Cj, Si, Si1);
                                if (alpha >= 0 && alpha < 1) {
                                    type = 'T';
                                    crds = new Coords(Const.COORDS_BY_USER, Cj, board);
// console.log("B", crds.usrCoords);
                                    res[1] = alpha;
                                    res[2] = 0;
                                }
                            }
                        }

console.log("intersection", crds.usrCoords, i, j, res[1], res[2], type);
                        IS = new this.Vertex(crds, i, res[1], S, 'S', type);
                        IC = new this.Vertex(crds, j, res[2], C, 'C', type);
                        IS.neighbour = IC;
                        IC.neighbour = IS;

                        S_crossings[i].push(IS);
                        C_crossings[j].push(IC);
                    }
                }
            }

            // For both paths, sort their intersection points
            S_intersect = this.sortIntersections(S_crossings);
// console.log('>>>>>>')
this._print_array(S_intersect);
console.log('----------')
            for (i = 0; i < S_intersect.length; i++) {
                S_intersect[i].data.idx = i;
                S_intersect[i].neighbour.data.idx = i;
            }
            C_intersect = this.sortIntersections(C_crossings);

this._print_array(C_intersect);
// console.log('<<<<<< Phase 1 done')
            return [S_intersect, C_intersect];
        },

        _getPosition: function(q, p1, p2, p3) {
            var s1 = this.det(q, p1, p2),
                s2 = this.det(q, p2, p3),
                s3 = this.det(p1, p2, p3);

            if (s3 >= 0) {   // Left turn or straight
                if (s1 > 0 && s2 > 0) {
                    return 'left';
                }
                return 'right';
            }
            // Right turn
            if (s1 < 0 && s2 < 0) {
                return 'right';
            }
            return 'left';
        },

        /**
         * Mark the intersection vertices of path1 as entry points or as exit points
         * in respect to path2.
         *
         * This is the simple algorithm as in
         * Greiner, Günther; Kai Hormann (1998). "Efficient clipping of arbitrary polygons".
         * ACM Transactions on Graphics. 17 (2): 71–83
         *
         * @private
         * @param  {Array} path1 First path
         * @param  {Array} path2 Second path
         */
        markEntryExit: function(path1, path2) {
            var status,
                Pp, Pm, Qp, Qm,
                side,
                cnt,
                intersection_chain_start = 'Null',
                intersection_chain = false,
                wait_for_exit = false,
                P;

console.log(";;;;;;;;;; Mark entry / exit ;;;;;;;;;;;;;;;;")
            P = path1[0];
            cnt = 0;
            while (true) {
                if (P.intersection === true && P.data.type === 'T') {
                    // Handle the degenerate cases
                    // Decide if they are (delayed) bouncing or crossing intersections
                    Pp = P._next.coords.usrCoords;  // P-
                    Pm = P._prev.coords.usrCoords;  // P+

                    Qm = P.neighbour._prev.coords.usrCoords;  // Q-
                    Qp = P.neighbour._next.coords.usrCoords;  // Q+

console.log(";;", Pm, P.coords.usrCoords, Pp)
console.log(";:", Qm, P.neighbour.coords.usrCoords, Qp)
                    if (P._next.intersection) {
                        // P+ is an intersection

                        if (Geometry.distance(Pp, Qp, 3) < Mat.eps) {
                            // P+ is an intersection linked to Q+
console.log("A")
                            if (Geometry.distance(Pm, Qm, 3) < Mat.eps) {
                                // P- is linked to Q-,
                                // i.e. the pathes share three consecutive points
                                P.delayedStatus = ['on', 'on'];
                            } else {
                                // Otherwise Q- is either left or right from the path (P-, P, P+)
                                side = this._getPosition(Qm,   Pm, P.coords.usrCoords, Pp);
                                if (side === 'right') {
                                    P.delayedStatus = ['left', 'on'];
                                } else {
                                    P.delayedStatus = ['right', 'on'];
                                }
                            }
                        } else if (Geometry.distance(Pp, Qm, 3) < Mat.eps) {
                            // P+ is an intersection linked to Q-
console.log("B")
                            if (Geometry.distance(Pm, Qp, 3) < Mat.eps) {
                                // P- is linked to Q+,
                                // i.e. the pathes share three consecutive points
                                P.delayedStatus = ['on', 'on'];
                            } else {
                                // Otherwise Q+ is either left or right from the path (P-, P, P+)
                                side = this._getPosition(Qp,   Pm, P.coords.usrCoords, Pp);
                                if (side === 'right') {
                                    P.delayedStatus = ['left', 'on'];
                                } else {
                                    P.delayedStatus = ['right', 'on'];
                                }
                            }
                        } /*else {
                            // P- and P+ do not share common intersections with the Q path.
                            // Therefore, P is either bouncing or crossing
console.log("C")
                            side = this._getPosition(Qm,   Pm, P.coords.usrCoords, Pp);
                            if (side !== this._getPosition(Qp,   Pm, P.coords.usrCoords, Pp)) {
                                P.data.type = 'X';
                                // P.neighbour.data.type = 'X';
                            } else{
                                P.data.type = 'B';
                                //P.neighbour.data.type = 'B';
                            }
console.log("OTHER1", P.coords.usrCoords, P.data.type);
                        }*/
                    }
                    if (P._prev.intersection) {
                        // P+ is not an intersection, but P- is

                        if (Geometry.distance(Pm, Qm, 3) < Mat.eps) {
                            // P- is a intersection linked to Q-
                            // Q+ is either left or right from the path (P-, P, P+)
                            side = this._getPosition(Qp,   Pm, P.coords.usrCoords, Pp);
                            if (side === 'right') {
                                P.delayedStatus = ['on', 'left'];
                            } else {
                                P.delayedStatus = ['on', 'right'];
                            }
                        } else if (Geometry.distance(Pm, Qp, 3) < Mat.eps) {
                            // P- is an intersection linked to Q+
                            // Q- is either left or right from the path (P-, P, P+)
                            side = this._getPosition(Qm,   Pm, P.coords.usrCoords, Pp);
                            if (side === 'right') {
                                P.delayedStatus = ['on', 'left'];
                            } else {
                                P.delayedStatus = ['on', 'right'];
                            }
                        } /*else {
                            // P- and P+ do not share common intersections with the Q path.
                            side = this._getPosition(Qm,   Pm, P.coords.usrCoords, Pp);
                            if (side !== this._getPosition(Qp,   Pm, P.coords.usrCoords, Pp)) {
                                P.data.type = 'X';
                                // P.neighbour.data.type = 'X';
                            } else{
                                P.data.type = 'B';
                                // P.neighbour.data.type = 'B';
                            }
console.log("OTHER3", P.coords.usrCoords, P.data.type);
                        }*/
                    }
                    if (!P._prev.intersection && !P._next.intersection) {
                        // Neither P- nor P+ are intersections
                        side = this._getPosition(Qm,   Pm, P.coords.usrCoords, Pp);
                        if (side !== this._getPosition(Qp,   Pm, P.coords.usrCoords, Pp)) {
                            P.data.type = 'X';
                            //P.neighbour.data.type = 'X';
                        } else{
                            P.data.type = 'B';
                            //P.neighbour.data.type = 'B';
                        }
console.log("OTHER4", P.coords.usrCoords, P.data.type);
                    }

console.log("P:", P.coords.usrCoords, P.data.type, P.delayedStatus)

                }
                if (P._end || cnt > 100000) {
                    break;
                }
                P = P._next;
                cnt++;
            }

//console.log(";;;;;;;;;; Mark entry / exit bouncing;;;;;;;;;;;;;;;;")

            P = path1[0];
            cnt = 0;
            while (true) {
                if (P.intersection === true) {
console.log("XXX", P.coords.usrCoords, P.data.type);
                    if (P.data.type === 'T') {
                        if (P.delayedStatus[0] !== 'on' && P.delayedStatus[1] === 'on') {
                            intersection_chain = true;
                            P.data.type = 'B';
                            intersection_chain_start = P.delayedStatus[0];
                        } else if (P.delayedStatus[0] === 'on' && P.delayedStatus[1] === 'on') {
                            P.data.type = 'B';
                        } else if (P.delayedStatus[0] === 'on' && P.delayedStatus[1] !== 'on' && intersection_chain) {
                            intersection_chain = false;
                            if (intersection_chain_start === P.delayedStatus[1]) {
                                P.data.type = 'B';
                            } else {
                                P.data.type = 'X';
                            }
                        }
                    }
                }
                if (P._end) {
                    wait_for_exit = true;
// console.log("wait for exit", intersection_chain)
                }
                if (wait_for_exit && !intersection_chain) {
                    break;
                }
                if (cnt > 100000) {
                    console.log("SAFETY EXIT!!!!")
                    break;
                }
                cnt++;
                P = P._next;
            }

//console.log("---------- Degenerate cases done -----")
            P = path1[0];
            if (this.windingNumber(P.coords.usrCoords, path2) === 0) {
                // Outside
                status = 'entry';
            } else {
                // Inside
                status = 'exit';
            }
console.log("START", P.coords.usrCoords, status);

            P = path1[0];
            while (true) {
                if (P.intersection === true && P.data.type === 'X') {
                    P.entry_exit = status;
                    status = (status === 'entry') ? 'exit' : 'entry';
console.log(">", P.coords.usrCoords, P.entry_exit, P.data.type);
                }
                if (P._end) {
                    break;
                }
                P = P._next;
            }
//console.log(">>>>>>>>>>>>>> Mark entry / exit done >>>>>>>>>>>>>>");
        },

        _isCrossing: function(P) {
            return P.intersection && P.data.type === 'X';
        },

        /**
         * Tracing phase of the Greiner-Hormann algorithm, see
         * Greiner, Günther; Kai Hormann (1998).
         * "Efficient clipping of arbitrary polygons". ACM Transactions on Graphics. 17 (2): 71–83
         *
         * Boolean operations on polygons are distinguished: 'intersection', 'union', 'difference'.
         *
         * @private
         * @param  {Array} S           Subject path
         * @param  {Array} S_intersect Array containing the intersection vertices of the subject path
         * @param  {String} clip_type  contains the Boolean operation: 'intersection', 'union', or 'difference'
         * @return {Array}             Array consisting of two arrays containing the x-coordinates and the y-coordintaes of
         *      the resulting path.
         */
        tracing: function(S, S_intersect, clip_type) {
            var P, current, start,
                cnt = 0,
                maxCnt = 40000,
                S_idx = 0,
                pathX = [],
                pathY = [];

console.log("------ Start Phase 3");
            while (S_idx < S_intersect.length && cnt < maxCnt) {
                current = S_intersect[S_idx];
                if (current.data.done || !this._isCrossing(current)) {
                    S_idx++;
                    continue;
                }

console.log("Start", current.coords.usrCoords, current.data.type, current.entry_exit, S_idx);
                if (pathX.length > 0) {    // Add a new path
                    pathX.push(NaN);
                    pathY.push(NaN);
                }

                start = current.data.idx;
                P = S;
                do {
                    // Add the "current" intersection vertex
                    pathX.push(current.coords.usrCoords[1]);
                    pathY.push(current.coords.usrCoords[2]);
console.log("Add", current.coords.usrCoords);
                    current.data.done = true;

                    // console.log(current.pathname, current.cnt, current.entry_exit, current.usrCoords[1].toFixed(3), current.usrCoords[2].toFixed(3));
                    if ((clip_type === 'intersection' && current.entry_exit === 'entry') ||
                        (clip_type === 'union' && current.entry_exit === 'exit') ||
                        (clip_type === 'difference' && (P === S) === (current.entry_exit === 'exit'))
                        ) {
                        current = current._next;
                        do {
                            cnt++;

                            pathX.push(current.coords.usrCoords[1]);
                            pathY.push(current.coords.usrCoords[2]);
console.log("Add fw", current.coords.usrCoords);

                            if (!this._isCrossing(current)) {  // In case there are two adjacent intersects
                                current = current._next;
                            }
                        } while (!this._isCrossing(current) && cnt < maxCnt);
                    } else {
                        //if (current.entry_exit !== 'ignore' && current.entry_exit !== 'bouncing') {
                        current = current._prev;
                        do {
                            cnt++;

                            pathX.push(current.coords.usrCoords[1]);
                            pathY.push(current.coords.usrCoords[2]);
console.log("Add bw", current.coords.usrCoords);

                            if (!this._isCrossing(current)) {  // In case there are two adjacent intersects
                                current = current._prev;
                            }
                        } while (!this._isCrossing(current) && cnt < maxCnt);
                    }
                    current.data.done = true;

                    if (!current.neighbour) {
                        console.log("BREAK!!!!!!!!!!!!!!!!!", cnt);
                        return [[0], [0]];
                    }

                    console.log("Switch", current.data.pathname, current.cnt, "to", current.neighbour.data.pathname, current.neighbour.cnt);
                    current = current.neighbour;
                    if (current.data.done) {
                        pathX.push(current.coords.usrCoords[1]);
                        pathY.push(current.coords.usrCoords[2]);
                        break;
                    }
                    P = current.data.path;

                } while (!(current.data.pathname === 'S' && current.data.idx === start) && cnt < maxCnt);

                S_idx++;
            }

            return [pathX, pathY];
        },

        /**
         * Handle path clipping if one of the two paths is empty.
         * @private
         * @param  {Array} S        First path, array of JXG.Coords
         * @param  {Array} C        Second path, array of JXG.Coords
         * @param  {String} clip_type Type of Boolean operation: 'intersection', 'union', 'differrence'.
         * @param  {Array} pathX     Array of x-coordinates of the resulting path
         * @param  {Array} pathY    Array of y-coordinates of the resulting path
         * @return {Boolean}        true, if one of the input paths is empty, false otherwise.
         */
        isEmptyCase: function(S, C, clip_type, pathX, pathY) {
            var i;

            if (clip_type === 'intersection' && (S.length === 0 || C.length === 0)) {
                return true; //[pathX, pathY];
            } else if (clip_type === 'union' && (S.length === 0 || C.length === 0)) {
                if (S.length === 0) {
                    for (i = 0; i < C.length; ++i) {
                        pathX.push(C[i].coords.usrCoords[1]);
                        pathY.push(C[i].coords.usrCoords[2]);
                    }
                    if (C.length > 0) {
                        pathX.push(C[0].coords.usrCoords[1]);
                        pathY.push(C[0].coords.usrCoords[2]);
                    }
                } else {
                    for (i = 0; i < S.length; ++i) {
                        pathX.push(S[i].coords.usrCoords[1]);
                        pathY.push(S[i].coords.usrCoords[2]);
                    }
                    if (S.length > 0) {
                        pathX.push(S[0].coords.usrCoords[1]);
                        pathY.push(S[0].coords.usrCoords[2]);
                    }
                }
                return true; //[pathX, pathY];
            } if (clip_type === 'difference' && (S.length === 0 || C.length === 0)) {
                if (C.length === 0) {
                    for (i = 0; i < S.length; ++i) {
                        pathX.push(S[i].coords.usrCoords[1]);
                        pathY.push(S[i].coords.usrCoords[2]);
                    }
                    if (S.length > 0) {
                        pathX.push(S[0].coords.usrCoords[1]);
                        pathY.push(S[0].coords.usrCoords[2]);
                    }
                }
                return true; //[pathX, pathY];
            }

            return false;
        },

        /**
         * Handle cases when there are no intersection points of the two paths. This is the case if the
         * paths are disjoint or one is contained in the other.
         * @private
         * @param  {Array} S        First path, array of JXG.Coords
         * @param  {Array} C        Second path, array of JXG.Coords
         * @param  {String} clip_type Type of Boolean operation: 'intersection', 'union', 'differrence'.
         * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
         *      the resulting path.
         */
        handleEmptyIntersection: function(S, C, clip_type) {
            var i, P,
                pathX = [],
                pathY = [];

            if (clip_type === 'union') {
                for (i = 0; i < S.length; ++i) {
                    pathX.push(S[i].coords.usrCoords[1]);
                    pathY.push(S[i].coords.usrCoords[2]);
                }
                if (S.length > 0) {
                    pathX.push(S[0].coords.usrCoords[1]);
                    pathY.push(S[0].coords.usrCoords[2]);
                }
                pathX.push(NaN);
                pathY.push(NaN);
                for (i = 0; i < C.length; ++i) {
                    pathX.push(C[i].coords.usrCoords[1]);
                    pathY.push(C[i].coords.usrCoords[2]);
                }
                if (C.length > 0) {
                    pathX.push(C[0].coords.usrCoords[1]);
                    pathY.push(C[0].coords.usrCoords[2]);
                }
                return [pathX, pathY];
            }

            // Test if one curve is contained by the other
            if (this.windingNumber(S[0].coords.usrCoords, C) === 0) {     // S is outside of C,
                if (this.windingNumber(C[0].coords.usrCoords, S) !== 0) { // C is inside of S, i.e. C subset of S
                    if (clip_type === 'difference') {

                        if (Geometry.signedPolygon(S) * Geometry.signedPolygon(C) > 0) {
                            // Pathes have same orientation
                            // We have to revert one.
                            if (S.length > 0) {
                                pathX.push(S[0].coords.usrCoords[1]);
                                pathY.push(S[0].coords.usrCoords[2]);
                            }
                            for (i = S.length - 1; i >= 0; --i) {
                                pathX.push(S[i].coords.usrCoords[1]);
                                pathY.push(S[i].coords.usrCoords[2]);
                            }
                        } else {
                            // Pathes have different orientation
                            for (i = 0; i < S.length; ++i) {
                                pathX.push(S[i].coords.usrCoords[1]);
                                pathY.push(S[i].coords.usrCoords[2]);
                            }
                            if (S.length > 0) {
                                pathX.push(S[0].coords.usrCoords[1]);
                                pathY.push(S[0].coords.usrCoords[2]);
                            }
                        }
                        pathX.push(NaN);
                        pathY.push(NaN);
                    }
                    P = C;
                } else {                                           // The curves are disjoint
                    if (clip_type === 'intersection') {
                        P = [];
                    } else if (clip_type === 'difference') {
                        P = S;
                    }
                }
            } else {                                               // S inside of C, i.e. S subset of C
                if (clip_type === 'intersection') {
                    P = S;
                } else if (clip_type === 'difference') {
                    P = [];
                }
            }
            for (i = 0; i < P.length; ++i) {
                pathX.push(P[i].coords.usrCoords[1]);
                pathY.push(P[i].coords.usrCoords[2]);
            }
            // if (clip_type === 'difference') {
            if (P.length > 0) {
                pathX.push(P[0].coords.usrCoords[1]);
                pathY.push(P[0].coords.usrCoords[2]);
            }
            //}

            return [pathX, pathY];
        },

        _crossingIntersections: function(intersections) {
            var i,
                le = intersections.length,
                sum = 0;
            for (i = 0; i  < le; i++) {
                if (intersections[i].data.type === 'X') {
                    sum++;
                }
            }
            return sum;
        },

        /**
         * Determine the intersection, union or difference of two closed paths.
         *
         * This is an implementation of the Greiner-Hormann algorithm, see
         * Greiner, Günther; Kai Hormann (1998).
         * "Efficient clipping of arbitrary polygons". ACM Transactions on Graphics. 17 (2): 71–83.
         *
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} subject   First closed path, usually called 'subject'.
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} clip      Second closed path, usually called 'clip'.
         * @param  {String} clip_type Determines the type of boolean operation on the two paths.
         *  Possible values are 'intersection', 'union', or 'difference'.
         * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
         * user coordinates and screen coordinates.
         * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
         *      the resulting path.
         *
         * @see JXG.Math.Clip#intersection
         * @see JXG.Math.Clip#union
         * @see JXG.Math.Clip#difference
         *
         * @example
         *     var curve1 = board.create('curve', [
         *             [-3, 3, 0, -3],
         *             [3, 3, 0, 3]
         *         ],
         *         {strokeColor: 'black'});
         *
         *     var curve2 = board.create('curve', [
         *             [-4, 4, 0, -4],
         *             [2, 2, 4, 2]
         *         ],
         *         {strokeColor: 'blue'});
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.greinerHormann(curve2, curve1, 'intersection', this.board);
         *
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         * </pre><div id="JXG9d2a6acf-a43b-4035-8f8a-9b1bee580210" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9d2a6acf-a43b-4035-8f8a-9b1bee580210',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *
         *         var curve1 = board.create('curve', [
         *                 [-3, 3, 0, -3],
         *                 [3, 3, 0, 3]
         *             ],
         *             {strokeColor: 'black'});
         *
         *         var curve2 = board.create('curve', [
         *                 [-4, 4, 0, -4],
         *                 [2, 2, 4, 2]
         *             ],
         *             {strokeColor: 'blue'});
         *
         *         var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *         clip_path.updateDataArray = function() {
         *             var a = JXG.Math.Clip.greinerHormann(curve2, curve1, 'intersection', this.board);
         *
         *             this.dataX = a[0];
         *             this.dataY = a[1];
         *         };
         *
         *         board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *     var curve1 = board.create('curve', [
         *             [-3, 3, 0, -3],
         *             [3, 3, 0, 3]
         *         ],
         *         {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *     var curve2 = board.create('polygon', [[3, 4], [-4, 0], [-4, 4]],
         *             {strokeColor: 'blue', fillColor: 'none'});
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.greinerHormann(curve1, curve2, 'union', this.board);
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         * </pre><div id="JXG6075c918-4d57-4b72-b600-6597a6a4f44e" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG6075c918-4d57-4b72-b600-6597a6a4f44e',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var curve1 = board.create('curve', [
         *                 [-3, 3, 0, -3],
         *                 [3, 3, 0, 3]
         *             ],
         *             {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *         var curve2 = board.create('polygon', [[3, 4], [-4, 0], [-4, 4]],
         *                 {strokeColor: 'blue', fillColor: 'none'});
         *
         *
         *         var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *         clip_path.updateDataArray = function() {
         *             var a = JXG.Math.Clip.greinerHormann(curve1, curve2, 'union', this.board);
         *             this.dataX = a[0];
         *             this.dataY = a[1];
         *         };
         *
         *         board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *     var curve1 = board.create('curve', [
         *             [-4, 4, 0, -4],
         *             [4, 4, -2, 4]
         *         ],
         *         {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *     var curve2 = board.create('circle', [[0, 0], [0, -2]],
         *             {strokeColor: 'blue', strokeWidth: 1, fillColor: 'red', fixed: true, fillOpacity: 0.3,
         *             center: {visible: true, size: 5}, point2: {size: 5}});
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.greinerHormann(curve1, curve2, 'difference', this.board);
         *
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         * </pre><div id="JXG46b3316b-5ab9-4928-9473-ccb476ca4185" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG46b3316b-5ab9-4928-9473-ccb476ca4185',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var curve1 = board.create('curve', [
         *                 [-4, 4, 0, -4],
         *                 [4, 4, -2, 4]
         *             ],
         *             {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *         var curve2 = board.create('circle', [[0, 0], [0, -2]],
         *                 {strokeColor: 'blue', strokeWidth: 1, fillColor: 'red', fixed: true, fillOpacity: 0.3,
         *                 center: {visible: true, size: 5}, point2: {size: 5}});
         *
         *
         *         var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.6});
         *         clip_path.updateDataArray = function() {
         *             var a = JXG.Math.Clip.greinerHormann(curve1, curve2, 'difference', this.board);
         *
         *             this.dataX = a[0];
         *             this.dataY = a[1];
         *         };
         *
         *         board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var clip_path = board.create('curve', [[], []], {strokeWidth: 1, fillColor: 'yellow', fillOpacity: 0.6});
         * clip_path.updateDataArray = function() {
         *     var bbox = this.board.getBoundingBox(),
         *         canvas, triangle;
         *
         *     canvas = [[bbox[0], bbox[1]], // ul
         *          [bbox[0], bbox[3]], // ll
         *          [bbox[2], bbox[3]], // lr
         *          [bbox[2], bbox[1]], // ur
         *          [bbox[0], bbox[1]]] // ul
         *     triangle = [[-1,1], [1,1], [0,-1], [-1,1]];
         * 
         *     var a = JXG.Math.Clip.greinerHormann(canvas, triangle, 'difference', this.board);
         *     this.dataX = a[0];
         *     this.dataY = a[1];
         * };
         * 
         * </pre><div id="JXGe94da07a-2a01-4498-ad62-f71a327f8e25" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGe94da07a-2a01-4498-ad62-f71a327f8e25',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 1, fillColor: 'yellow', fillOpacity: 0.6});
         *     clip_path.updateDataArray = function() {
         *         var bbox = this.board.getBoundingBox(),
         *             canvas, triangle;
         *
         *         canvas = [[bbox[0], bbox[1]], // ul
         *              [bbox[0], bbox[3]], // ll
         *              [bbox[2], bbox[3]], // lr
         *              [bbox[2], bbox[1]], // ur
         *              [bbox[0], bbox[1]]] // ul
         *         triangle = [[-1,1], [1,1], [0,-1], [-1,1]];
         *     
         *         var a = JXG.Math.Clip.greinerHormann(canvas, triangle, 'difference', this.board);
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         * 
         *     })();
         * 
         * </script><pre>
         * 
         */
        greinerHormann: function(subject, clip, clip_type, board) { //},
                // subject_first_point_type, clip_first_point_type) {

            var i, r, rad, len,
                steps = 359,
                S = [],
                C = [],
                S_intersect = [],
                // C_intersect = [],
                res = [],
                pathX = [],
                pathY = [];

            // Collect all points into subject array S
            if (subject.elementClass === Const.OBJECT_CLASS_CURVE && Type.exists(subject.points)) {
                len = subject.points.length;
                for (i = 0; i < len; i++) {
                    this._addToList(S, subject.points[i], i);
                }
            } else if (subject.type === Const.OBJECT_TYPE_POLYGON) {
                for (i = 0; i < subject.vertices.length; i++) {
                    this._addToList(S, subject.vertices[i].coords, i);
                }
            } else if (subject.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                r = subject.Radius();
                rad = 2 * Math.PI / steps;
                for (i = 0; i <= steps; i++) {
                    this._addToList(S, new Coords(Const.COORDS_BY_USER, [
                        subject.center.coords.usrCoords[0],
                        subject.center.coords.usrCoords[1] + Math.cos(i * rad) * r,
                        subject.center.coords.usrCoords[2] + Math.sin(i * rad) * r
                    ], board), i);
                }
            } else if (Type.isArray(subject)) {
                len = subject.length;
                for (i = 0; i < len; i++) {
                    if (Type.exists(subject[i].coords)) {
                        // Point type
                        this._addToList(S, subject[i].coords, i);
                    } else if (Type.isArray(subject[i])) {
                        // Coordinate pair
                        this._addToList(S, new Coords(Const.COORDS_BY_USER, subject[i], board), i);
                    } else if (Type.exists(subject[i].usrCoords)) {
                        // JXG.Coordinates
                        this._addToList(S, subject[i], i);
                    }
                }
            }
            len = S.length;
            if (len > 0 && Geometry.distance(S[0].coords.usrCoords, S[len - 1].coords.usrCoords, 3) < Mat.eps) {
                S.pop();
            }

            // Collect all points into clip array C
            if (clip.elementClass === Const.OBJECT_CLASS_CURVE && Type.exists(clip.points)) {
                len = clip.points.length;
                for (i = 0; i < len; i++) {
                    this._addToList(C, clip.points[i], i);
                }
            } else if (clip.type === Const.OBJECT_TYPE_POLYGON) {
                for (i = 0; i < clip.vertices.length; i++) {
                    this._addToList(C, clip.vertices[i].coords, i);
                }
            } else if (clip.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                r = clip.Radius();
                rad = 2 * Math.PI / steps;
                for (i = 0; i <= steps; i++) {
                    this._addToList(C, new Coords(Const.COORDS_BY_USER, [
                        clip.center.coords.usrCoords[0],
                        clip.center.coords.usrCoords[1] + Math.cos(i * rad) * r,
                        clip.center.coords.usrCoords[2] + Math.sin(i * rad) * r
                    ], board), i);
                }
            } else if (Type.isArray(clip)) {
                len = clip.length;
                for (i = 0; i < len; i++) {
                    if (Type.exists(clip[i].coords)) {
                        // Point type
                        this._addToList(C, clip[i].coords, i);
                    } else if (Type.isArray(clip[i])) {
                        // Coordinate pair
                        this._addToList(C, new Coords(Const.COORDS_BY_USER, clip[i], board), i);
                    } else if (Type.exists(clip[i].usrCoords)) {
                        // JXG.Coordinates
                        this._addToList(C, clip[i], i);
                    }
                }
            }

            len = C.length;
            if (len > 0 && Geometry.distance(C[0].coords.usrCoords, C[len - 1].coords.usrCoords, 3) < Mat.eps) {
                C.pop();
            }

            // Handle cases where at least one of the paths is empty
            if (this.isEmptyCase(S, C, clip_type, pathX, pathY)) {
                return [pathX, pathY];
            }

            // Add pointers for doubly linked lists
            this.doublyLinkedList(S);
            this.doublyLinkedList(C);

            res = this.findIntersections(S, C, board);
            S_intersect = res[0];
            // C_intersect = res[1];

            // For non-closed paths
            // if (true && typeof subject_first_point_type === 'string') {
            //     S[0].neighbour = C[C.length - 1];
            //     S[0].first_point_type = subject_first_point_type;
            //     S[S.length - 1].neighbour = C[0];
            //     S[S.length - 1].first_point_type = subject_first_point_type;
            // }
            // if (true && typeof clip_first_point_type === 'string') {
            //     C[0].neighbour = S[S.length - 1];
            //     C[0].first_point_type = clip_first_point_type;
            //     C[C.length - 1].neighbour = S[0];
            //     C[C.length - 1].first_point_type = clip_first_point_type;
            // }

// console.log("S");
// this._print_list(S[0]);
// console.log("C");
// this._print_list(C[0]);
// console.log("S")

            // Phase 2: mark intersection points as entry or exit points
            this.markEntryExit(S, C);
            // if (S[0].coords.distance(Const.COORDS_BY_USER, C[0].coords) === 0) {
            //     // Randomly disturb the first point of the second path
            //     // if both paths start at the same point.
            //     C[0].usrCoords[1] *= 1 + Math.random() * 0.0001 - 0.00005;
            //     C[0].usrCoords[2] *= 1 + Math.random() * 0.0001 - 0.00005;
            // }
//console.log("C")
            this.markEntryExit(C, S);
//return;

            // Handle cases without intersections
            if (this._crossingIntersections(S_intersect) === 0) {
                return this.handleEmptyIntersection(S, C, clip_type);
            }

            // if (false) {
            //     for (i = 0; i < S_intersect.length; i++) {
            //         console.log('S', S_intersect[i].cnt, S_intersect[i].entry_exit, S_intersect[i].usrCoords,
            //                 S_intersect[i].pos, S_intersect[i].alpha);
            //     }
            //     console.log();
            //     for (i = 0; i < C_intersect.length; i++) {
            //         console.log('C', C_intersect[i].cnt, C_intersect[i].entry_exit, C_intersect[i].usrCoords,
            //                 C_intersect[i].pos, C_intersect[i].alpha);
            //     }
            // }
            // Phase 3: tracing
            return this.tracing(S, S_intersect, clip_type);

        },

        /**
         * Union of two closed paths. The paths could be JSXGraph elements circle, curve, or polygon.
         * Computed by the Greiner-Hormann algorithm.
         *
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} subject   First closed path.
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} clip      Second closed path.
         * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
         * user coordinates and screen coordinates.
         * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
         *      the resulting path.
         *
         * @see JXG.Math.Clip#greinerHormann
         * @see JXG.Math.Clip#intersection
         * @see JXG.Math.Clip#difference
         *
         * @example
         *     var curve1 = board.create('curve', [
         *             [-3, 3, 0, -3],
         *             [3, 3, 0, 3]
         *         ],
         *         {strokeColor: 'black'});
         *
         *     var curve2 = board.create('polygon', [[3, 4], [-4, 0], [-4, 4]],
         *             {strokeColor: 'blue', fillColor: 'none'});
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.union(curve1, curve2, this.board);
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         * </pre><div id="JXG7c5204aa-3824-4464-819c-80df7bf1d917" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG7c5204aa-3824-4464-819c-80df7bf1d917',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var curve1 = board.create('curve', [
         *                 [-3, 3, 0, -3],
         *                 [3, 3, 0, 3]
         *             ],
         *             {strokeColor: 'black'});
         *
         *         var curve2 = board.create('polygon', [[3, 4], [-4, 0], [-4, 4]],
         *                 {strokeColor: 'blue', fillColor: 'none'});
         *
         *
         *         var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         *         clip_path.updateDataArray = function() {
         *             var a = JXG.Math.Clip.union(curve1, curve2, this.board);
         *             this.dataX = a[0];
         *             this.dataY = a[1];
         *         };
         *
         *         board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         */
        union: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'union', board);
        },

        /**
         * Intersection of two closed paths. The paths could be JSXGraph elements circle, curve, or polygon.
         * Computed by the Greiner-Hormann algorithm.
         *
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} subject   First closed path.
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} clip      Second closed path.
         * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
         * user coordinates and screen coordinates.
         * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
         *      the resulting path.
         *
         * @see JXG.Math.Clip#greinerHormann
         * @see JXG.Math.Clip#union
         * @see JXG.Math.Clip#difference
         *
         * @example
         * var p = [];
         * p.push(board.create('point', [0, -5]));
         * p.push(board.create('point', [-5, 0]));
         * p.push(board.create('point', [-3, 3]));
         *
         * var curve1 = board.create('ellipse', p,
         *                 {strokeColor: 'black'});
         *
         * var curve2 = board.create('curve', [function(phi){return 4 * Math.cos(2*phi); },
         *                                     [0, 0],
         *                                     0, 2 * Math.PI],
         *                       {curveType:'polar', strokeColor: 'blue', strokewidth:1});
         *
         * var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         * clip_path.updateDataArray = function() {
         *     var a = JXG.Math.Clip.intersection(curve2, curve1, this.board);
         *
         *     this.dataX = a[0];
         *     this.dataY = a[1];
         * };
         *
         * board.update();
         *
         * </pre><div id="JXG7ad547eb-7b6c-4a1a-a4d4-4ed298fc7998" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG7ad547eb-7b6c-4a1a-a4d4-4ed298fc7998',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p = [];
         *     p.push(board.create('point', [0, -5]));
         *     p.push(board.create('point', [-5, 0]));
         *     p.push(board.create('point', [-3, 3]));
         *
         *     var curve1 = board.create('ellipse', p,
         *                     {strokeColor: 'black'});
         *
         *     var curve2 = board.create('curve', [function(phi){return 4 * Math.cos(2*phi); },
         *                                         [0, 0],
         *                                         0, 2 * Math.PI],
         *                           {curveType:'polar', strokeColor: 'blue', strokewidth:1});
         *
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.intersection(curve2, curve1, this.board);
         *
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        intersection: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'intersection', board);
        },

        /**
         * Difference of two closed paths, i.e. path1 minus path2.
         * The paths could be JSXGraph elements circle, curve, or polygon.
         * Computed by the Greiner-Hormann algorithm.
         *
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} subject   First closed path.
         * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} clip      Second closed path.
         * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
         * user coordinates and screen coordinates.
         * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
         *      the resulting path.
         *
         * @see JXG.Math.Clip#greinerHormann
         * @see JXG.Math.Clip#intersection
         * @see JXG.Math.Clip#union
         *
         * @example
         *     var curve1 = board.create('polygon', [[-4, 4], [4, 4], [0, -1]],
         *             {strokeColor: 'blue', fillColor: 'none'});
         *
         *     var curve2 = board.create('curve', [
         *             [-1, 1, 0, -1],
         *             [1, 1, 3, 1]
         *         ],
         *         {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *     var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         *     clip_path.updateDataArray = function() {
         *         var a = JXG.Math.Clip.difference(curve1, curve2, this.board);
         *         this.dataX = a[0];
         *         this.dataY = a[1];
         *     };
         *
         *     board.update();
         *
         * </pre><div id="JXGc5ce6bb3-146c-457f-a48b-6b9081fb68a3" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGc5ce6bb3-146c-457f-a48b-6b9081fb68a3',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var curve1 = board.create('polygon', [[-4, 4], [4, 4], [0, -1]],
         *                 {strokeColor: 'blue', fillColor: 'none'});
         *
         *         var curve2 = board.create('curve', [
         *                 [-1, 1, 0, -1],
         *                 [1, 1, 3, 1]
         *             ],
         *             {strokeColor: 'black', fillColor: 'none', fillOpacity: 0.8});
         *
         *
         *         var clip_path = board.create('curve', [[], []], {strokeWidth: 3, fillColor: 'yellow', fillOpacity: 0.3});
         *         clip_path.updateDataArray = function() {
         *             var a = JXG.Math.Clip.difference(curve1, curve2, this.board);
         *             this.dataX = a[0];
         *             this.dataY = a[1];
         *         };
         *
         *         board.update();
         *
         *     })();
         *
         * </script><pre>
         *
         */
        difference: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'difference', board);
        }
    };

    JXG.extend(Mat.Clip, /** @lends JXG.Math.Clip */ {
    });

    return Mat.Clip;
});
