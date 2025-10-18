/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview This file contains the Math.Clip namespace for clipping and computing boolean operations
 * on polygons and curves
 *
 * // TODO:
 * * Check if input polygons are closed. If not, handle this case.
 */

// import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Coords from "../base/coords.js";
import Mat from "./math.js";
import Geometry from "./geometry.js";
import Type from "../utils/type.js";

/**
 * Math.Clip namespace definition. This namespace contains algorithms for Boolean operations on paths, i.e.
 * intersection, union and difference of paths. Base is the Greiner-Hormann algorithm.
 * @name JXG.Math.Clip
 * @exports Mat.Clip as JXG.Math.Clip
 * @namespace
 */
Mat.Clip = {
    _isSeparator: function (node) {
        return isNaN(node.coords.usrCoords[1]) && isNaN(node.coords.usrCoords[2]);
    },

    /**
     * Add pointers to an array S such that it is a circular doubly-linked list.
     *
     * @private
     * @param  {Array} S Array
     * @return {Array} return containing the starter indices of each component.
     */
    makeDoublyLinkedList: function (S) {
        var i,
            first = null,
            components = [],
            le = S.length;

        if (le > 0) {
            for (i = 0; i < le; i++) {
                // S[i]._next = S[(i + 1) % le];
                // S[i]._prev = S[(le + i - 1) % le];

                // If S[i] is component separator we proceed with the next node.
                if (this._isSeparator(S[i])) {
                    S[i]._next = S[(i + 1) % le];
                    S[i]._prev = S[(le + i - 1) % le];
                    continue;
                }

                // Now we know that S[i] is a path component
                if (first === null) {
                    // Start the component if it is not yet started.
                    first = i;
                    components.push(first);
                }
                if (this._isSeparator(S[(i + 1) % le]) || i === le - 1) {
                    // If the next node is a component separator or if the node is the last node,
                    // then we close the loop

                    S[i]._next = S[first];
                    S[first]._prev = S[i];
                    S[i]._end = true;
                    first = null;
                } else {
                    // Here, we are not at the end of component
                    S[i]._next = S[(i + 1) % le];
                    S[first]._prev = S[i];
                }
                if (!this._isSeparator(S[(le + i - 1) % le])) {
                    S[i]._prev = S[(le + i - 1) % le];
                }
            }
        }
        return components;
    },

    /**
     * JavaScript object containing the intersection of two paths. Every intersection point is on one path, but
     * comes with a neighbour point having the same coordinates and being on the other path.
     *
     * The intersection point is inserted into the doubly linked list of the path.
     *
     * @private
     * @param  {JXG.Coords} coords JSXGraph Coords object containing the coordinates of the intersection
     * @param  {Number} i        Number of the segment of the subject path (first path) containing the intersection.
     * @param  {Number} alpha    The intersection is a p_1 + alpha*(p_2 - p_1), where p_1 and p_2 are the end points
     *      of the i-th segment.
     * @param  {Array} path      Pointer to the path containing the intersection point
     * @param  {String} pathname Name of the path: 'S' or 'C'.
     */
    Vertex: function (coords, i, alpha, path, pathname, type) {
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

    _addToList: function (list, coords, pos) {
        var len = list.length,
            eps = Mat.eps * Mat.eps;

        if (
            len > 0 &&
            Math.abs(list[len - 1].coords.usrCoords[0] - coords.usrCoords[0]) < eps &&
            Math.abs(list[len - 1].coords.usrCoords[1] - coords.usrCoords[1]) < eps &&
            Math.abs(list[len - 1].coords.usrCoords[2] - coords.usrCoords[2]) < eps
        ) {
            // Skip point
            return;
        }
        list.push({
            pos: pos,
            intersection: false,
            coords: coords,
            elementClass: Const.OBJECT_CLASS_POINT
        });
    },

    /**
     * Sort the intersection points into their path.
     * @private
     * @param  {Array} P_crossings Array of arrays. Each array contains the intersections of the path
     *      with one segment of the other path.
     * @return {Array}  Array of intersection points ordered by first occurrence in the path.
     */
    sortIntersections: function (P_crossings) {
        var i,
            j,
            P,
            Q,
            last,
            next_node,
            P_intersect = [],
            P_le = P_crossings.length;

        for (i = 0; i < P_le; i++) {
            P_crossings[i].sort(function (a, b) {
                return a.data.alpha > b.data.alpha ? 1 : -1;
            });

            if (P_crossings[i].length > 0) {
                // console.log("Crossings", P_crossings[i])
                last = P_crossings[i].length - 1;
                P = P_crossings[i][0];

                //console.log("SORT", P.coords.usrCoords)
                Q = P.data.path[P.pos];
                next_node = Q._next; // Store the next "normal" node

                if (i === P_le - 1) {
                    Q._end = false;
                }

                if (P.data.alpha === 0.0 && P.data.type === 'T') {
                    // console.log("SKIP", P.coords.usrCoords, P.data.type, P.neighbour.data.type);
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

    _inbetween: function (q, p1, p2) {
        var alpha,
            eps = Mat.eps * Mat.eps,
            px = p2[1] - p1[1],
            py = p2[2] - p1[2],
            qx = q[1] - p1[1],
            qy = q[2] - p1[2];

        if (px === 0 && py === 0 && qx === 0 && qy === 0) {
            // All three points are equal
            return true;
        }
        if (Math.abs(qx) < eps && Math.abs(px) < eps) {
            alpha = qy / py;
        } else {
            alpha = qx / px;
        }
        if (Math.abs(alpha) < eps) {
            alpha = 0.0;
        }
        return alpha;
    },

    _print_array: function (arr) {
        var i, end;
        for (i = 0; i < arr.length; i++) {
            //console.log(i, arr[i].coords.usrCoords,  arr[i].data.type);
            try {
                end = "";
                if (arr[i]._end) {
                    end = " end";
                }
                console.log(
                    i,
                    arr[i].coords.usrCoords,
                    arr[i].data.type,
                    "\t",
                    "prev",
                    arr[i]._prev.coords.usrCoords,
                    "next",
                    arr[i]._next.coords.usrCoords + end
                );
            } catch (e) {
                console.log(i, arr[i].coords.usrCoords);
            }
        }
    },

    _print_list: function (P) {
        var cnt = 0,
            alpha;
        while (cnt < 100) {
            if (P.data) {
                alpha = P.data.alpha;
            } else {
                alpha = "-";
            }
            console.log(
                "\t",
                P.coords.usrCoords,
                "\n\t\tis:",
                P.intersection,
                "end:",
                P._end,
                alpha,
                "\n\t\t-:",
                P._prev.coords.usrCoords,
                "\n\t\t+:",
                P._next.coords.usrCoords,
                "\n\t\tn:",
                P.intersection ? P.neighbour.coords.usrCoords : "-"
            );
            if (P._end) {
                break;
            }
            P = P._next;
            cnt++;
        }
    },

    _noOverlap: function (p1, p2, q1, q2) {
        var k,
            eps = Math.sqrt(Mat.eps),
            minp,
            maxp,
            minq,
            maxq,
            no_overlap = false;

        for (k = 0; k < 3; k++) {
            minp = Math.min(p1[k], p2[k]);
            maxp = Math.max(p1[k], p2[k]);
            minq = Math.min(q1[k], q2[k]);
            maxq = Math.max(q1[k], q2[k]);
            if (maxp < minq - eps || minp > maxq + eps) {
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
     * @see JXG.Math.Clip.Vertex
     */
    findIntersections: function (S, C, board) {
        var res = [], eps = Mat.eps * 100,
            i, j, crds,
            S_le = S.length,
            C_le = C.length,
            Si, Si1, Cj, Cj1, d1, d2,
            alpha, type, IS, IC,
            S_intersect = [],
            C_intersect = [],
            S_crossings = [],
            C_crossings = [],
            hasMultCompsS = false,
            hasMultCompsC = false,
            DEBUG = false;

        for (j = 0; j < C_le; j++) {
            C_crossings.push([]);
        }

        // Run through the subject path.
        for (i = 0; i < S_le; i++) {
            S_crossings.push([]);

            // Test if S[i] or its successor is a path separator.
            // If yes, we know that the path consists of multiple components.
            // We immediately jump to the next segment.
            if (this._isSeparator(S[i]) || this._isSeparator(S[(i + 1) % S_le])) {
                hasMultCompsS = true;
                continue;
            }

            // If the path consists of multiple components then there is
            // no path-closing segment between the last node and the first
            // node. In this case we can leave the loop now.
            if (hasMultCompsS && i === S_le - 1) {
                break;
            }

            Si = S[i].coords.usrCoords;
            Si1 = S[(i + 1) % S_le].coords.usrCoords;
            // Run through the clip path.
            for (j = 0; j < C_le; j++) {
                // Test if C[j] or its successor is a path separator.
                // If yes, we know that the path consists of multiple components.
                // We immediately jump to the next segment.
                if (this._isSeparator(C[j]) || this._isSeparator(C[(j + 1) % C_le])) {
                    hasMultCompsC = true;
                    continue;
                }

                // If the path consists of multiple components then there is
                // no path-closing segment between the last node and the first
                // node. In this case we can leave the loop now.
                if (hasMultCompsC && j === C_le - 1) {
                    break;
                }

                // Test if bounding boxes of the two curve segments overlap
                // If not, the expensive intersection test can be skipped.
                Cj = C[j].coords.usrCoords;
                Cj1 = C[(j + 1) % C_le].coords.usrCoords;

                if (this._noOverlap(Si, Si1, Cj, Cj1)) {
                    continue;
                }

                // Intersection test
                res = Geometry.meetSegmentSegment(Si, Si1, Cj, Cj1);

                d1 = Geometry.distance(Si, Si1, 3);
                d2 = Geometry.distance(Cj, Cj1, 3);

                // Found an intersection point
                if (
                    // "Regular" intersection
                    (res[1] * d1 > -eps &&
                        res[1] < 1 - eps / d1 &&
                        res[2] * d2 > -eps &&
                        res[2] < 1 - eps / d2) ||
                    // Collinear segments
                    (res[1] === Infinity && res[2] === Infinity && Mat.norm(res[0], 3) < eps)
                ) {
                    crds = new Coords(Const.COORDS_BY_USER, res[0], board);
                    type = 'X';

                    // Handle degenerated cases
                    if (Math.abs(res[1]) * d1 < eps || Math.abs(res[2]) * d2 < eps) {
                        // Crossing / bouncing at vertex or
                        // end of delayed crossing / bouncing
                        type = 'T';
                        if (Math.abs(res[1]) * d1 < eps) {
                            res[1] = 0;
                        }
                        if (Math.abs(res[2]) * d2 < eps) {
                            res[2] = 0;
                        }
                        if (res[1] === 0) {
                            crds = new Coords(Const.COORDS_BY_USER, Si, board);
                        } else {
                            crds = new Coords(Const.COORDS_BY_USER, Cj, board);
                        }

                        if (DEBUG) {
                            console.log(
                                "Degenerate case I",
                                res[1],
                                res[2],
                                crds.usrCoords,
                                "type",
                                type
                            );
                        }
                    } else if (
                        res[1] === Infinity &&
                        res[2] === Infinity &&
                        Mat.norm(res[0], 3) < eps
                    ) {
                        // console.log(C_intersect);

                        // Collinear segments
                        // Here, there might be two intersection points to be added

                        alpha = this._inbetween(Si, Cj, Cj1);
                        if (DEBUG) {
                            // console.log("alpha Si", alpha, Si);
                            // console.log(j, Cj)
                            // console.log((j + 1) % C_le, Cj1)
                        }
                        if (alpha >= 0 && alpha < 1) {
                            type = 'T';
                            crds = new Coords(Const.COORDS_BY_USER, Si, board);
                            res[1] = 0;
                            res[2] = alpha;
                            IS = new this.Vertex(crds, i, res[1], S, "S", type);
                            IC = new this.Vertex(crds, j, res[2], C, "C", type);
                            IS.neighbour = IC;
                            IC.neighbour = IS;
                            S_crossings[i].push(IS);
                            C_crossings[j].push(IC);
                            if (DEBUG) {
                                console.log(
                                    "Degenerate case II",
                                    res[1],
                                    res[2],
                                    crds.usrCoords,
                                    "type T"
                                );
                            }
                        }
                        alpha = this._inbetween(Cj, Si, Si1);
                        if (DEBUG) {
                            // console.log("alpha Cj", alpha, Si, Geometry.distance(Si, Cj, 3));
                        }
                        if (Geometry.distance(Si, Cj, 3) > eps && alpha >= 0 && alpha < 1) {
                            type = 'T';
                            crds = new Coords(Const.COORDS_BY_USER, Cj, board);
                            res[1] = alpha;
                            res[2] = 0;
                            IS = new this.Vertex(crds, i, res[1], S, "S", type);
                            IC = new this.Vertex(crds, j, res[2], C, "C", type);
                            IS.neighbour = IC;
                            IC.neighbour = IS;
                            S_crossings[i].push(IS);
                            C_crossings[j].push(IC);
                            if (DEBUG) {
                                console.log(
                                    "Degenerate case III",
                                    res[1],
                                    res[2],
                                    crds.usrCoords,
                                    "type T"
                                );
                            }
                        }
                        continue;
                    }
                    if (DEBUG) {
                        console.log("IS", i, j, crds.usrCoords, type);
                    }

                    IS = new this.Vertex(crds, i, res[1], S, "S", type);
                    IC = new this.Vertex(crds, j, res[2], C, "C", type);
                    IS.neighbour = IC;
                    IC.neighbour = IS;

                    S_crossings[i].push(IS);
                    C_crossings[j].push(IC);
                }
            }
        }

        // For both paths, sort their intersection points
        S_intersect = this.sortIntersections(S_crossings);

        if (DEBUG) {
            console.log(">>>>>> Intersections ");
            console.log("S_intersect");
            this._print_array(S_intersect);
            console.log("----------");
        }
        for (i = 0; i < S_intersect.length; i++) {
            S_intersect[i].data.idx = i;
            S_intersect[i].neighbour.data.idx = i;
        }
        C_intersect = this.sortIntersections(C_crossings);

        if (DEBUG) {
            console.log("C_intersect");
            this._print_array(C_intersect);
            console.log("<<<<<< Phase 1 done");
        }
        return [S_intersect, C_intersect];
    },

    /**
     * It is testedd if the point q lies to the left or right
     * of the poylgonal chain [p1, p2, p3].
     * @param {Array} q User coords array
     * @param {Array} p1 User coords array
     * @param {Array} p2 User coords array
     * @param {Array} p3 User coords array
     * @returns string 'left' or 'right'
     * @private
     */
    _getPosition: function (q, p1, p2, p3) {
        var s1 = Geometry.det3p(q, p1, p2),
            s2 = Geometry.det3p(q, p2, p3),
            s3 = Geometry.det3p(p1, p2, p3);

        // Left turn
        if (s3 >= 0) {
            if (s1 >= 0 && s2 >= 0) {
                return 'left';
            }
            return 'right';
        }
        // Right turn
        if (s1 >= 0 || s2 >= 0) {
            return 'left';
        }
        return 'right';
    },

    /**
     * Determine the delayed status of degenerated intersection points.
     * It is of the form
     *   ['on|left|right', 'on|left|right']
     * <p>
     * If all four determinants are zero, we add random noise to the point.
     *
     * @param {JXG.Math.Clip.Vertex} P Start of path
     * @private
     * @see JXG.Math.Clip.markEntryExit
     * @see JXG.Math.Clip._handleIntersectionChains
     */
    _classifyDegenerateIntersections: function (P) {
        var Pp, Pm, Qp, Qm,  Q,
            side, cnt, tmp, det,
            oppositeDir,
            s1, s2, s3, s4,
            endless = true,
            DEBUG = false;

        if (DEBUG) {
            console.log(
                "\n-------------- _classifyDegenerateIntersections()",
                Type.exists(P.data) ? P.data.pathname : " "
            );
        }
        det = Geometry.det3p;
        cnt = 0;
        P._tours = 0;
        while (endless) {
            if (DEBUG) {
                console.log("Inspect P:", P.coords.usrCoords, P.data ? P.data.type : " ");
            }
            if (P.intersection && P.data.type === 'T') {
                // Handle the degenerate cases
                // Decide if they are (delayed) bouncing or crossing intersections
                Pp = P._next.coords.usrCoords; // P+
                Pm = P._prev.coords.usrCoords; // P-

                // If the intersection point is degenerated and
                // equal to the start and end of one component,
                // then there will be two adjacent points with
                // the same coordinate.
                // In that case, we proceed to the next node.
                if (Geometry.distance(P.coords.usrCoords, Pp, 3) < Mat.eps) {
                    Pp = P._next._next.coords.usrCoords;
                }
                if (Geometry.distance(P.coords.usrCoords, Pm, 3) < Mat.eps) {
                    Pm = P._prev._prev.coords.usrCoords;
                }

                Q = P.neighbour;
                Qm = Q._prev.coords.usrCoords; // Q-
                Qp = Q._next.coords.usrCoords; // Q+
                if (Geometry.distance(Q.coords.usrCoords, Qp, 3) < Mat.eps) {
                    Qp = Q._next._next.coords.usrCoords;
                }
                if (Geometry.distance(Q.coords.usrCoords, Qm, 3) < Mat.eps) {
                    Qm = Q._prev._prev.coords.usrCoords;
                }

                if (DEBUG) {
                    console.log("P chain:", Pm, P.coords.usrCoords, Pp);
                    console.log("Q chain:", Qm, P.neighbour.coords.usrCoords, Qp);
                    console.log("Pm", this._getPosition(Pm, Qm, Q.coords.usrCoords, Qp));
                    console.log("Pp", this._getPosition(Pp, Qm, Q.coords.usrCoords, Qp));
                }

                s1 = det(P.coords.usrCoords, Pm, Qm);
                s2 = det(P.coords.usrCoords, Pp, Qp);
                s3 = det(P.coords.usrCoords, Pm, Qp);
                s4 = det(P.coords.usrCoords, Pp, Qm);

                if (s1 === 0 && s2 === 0 && s3 === 0 && s4 === 0) {
                    P.coords.usrCoords[1] *= 1 + Math.random() * Mat.eps;
                    P.coords.usrCoords[2] *= 1 + Math.random() * Mat.eps;
                    Q.coords.usrCoords[1] = P.coords.usrCoords[1];
                    Q.coords.usrCoords[2] = P.coords.usrCoords[2];
                    s1 = det(P.coords.usrCoords, Pm, Qm);
                    s2 = det(P.coords.usrCoords, Pp, Qp);
                    s3 = det(P.coords.usrCoords, Pm, Qp);
                    s4 = det(P.coords.usrCoords, Pp, Qm);
                    if (DEBUG) {
                        console.log("Random shift", P.coords.usrCoords);
                        console.log(s1, s2, s3, s4, s2 === 0);
                        console.log(
                            this._getPosition(Pm, Qm, Q.coords.usrCoords, Qp),
                            this._getPosition(Pp, Qm, Q.coords.usrCoords, Qp)
                        );
                    }
                }
                oppositeDir = false;
                if (s1 === 0) {
                    // Q-, Q=P, P- on straight line
                    if (Geometry.affineRatio(P.coords.usrCoords, Pm, Qm) < 0) {
                        oppositeDir = true;
                    }
                } else if (s2 === 0) {
                    if (Geometry.affineRatio(P.coords.usrCoords, Pp, Qp) < 0) {
                        oppositeDir = true;
                    }
                } else if (s3 === 0) {
                    if (Geometry.affineRatio(P.coords.usrCoords, Pm, Qp) > 0) {
                        oppositeDir = true;
                    }
                } else if (s4 === 0) {
                    if (Geometry.affineRatio(P.coords.usrCoords, Pp, Qm) > 0) {
                        oppositeDir = true;
                    }
                }
                if (oppositeDir) {
                    // Swap Qm and Qp
                    // Then Qm Q Qp has the same direction as Pm P Pp
                    tmp = Qm;
                    Qm = Qp;
                    Qp = tmp;
                    tmp = s1;
                    s1 = s3;
                    s3 = tmp;
                    tmp = s2;
                    s2 = s4;
                    s4 = tmp;
                }

                if (DEBUG) {
                    console.log(s1, s2, s3, s4, oppositeDir);
                }

                if (!Type.exists(P.delayedStatus)) {
                    P.delayedStatus = [];
                }

                if (s1 === 0 && s2 === 0) {
                    // Line [P-,P] equals [Q-,Q] and line [P,P+] equals [Q,Q+]
                    // Interior of delayed crossing / bouncing
                    P.delayedStatus = ["on", "on"];
                } else if (s1 === 0) {
                    // P- on line [Q-,Q], P+ not on line [Q,Q+]
                    // Begin / end of delayed crossing / bouncing
                    side = this._getPosition(Pp, Qm, Q.coords.usrCoords, Qp);
                    P.delayedStatus = ["on", side];
                } else if (s2 === 0) {
                    // P+ on line [Q,Q+], P- not on line [Q-,Q]
                    // Begin / end of delayed crossing / bouncing
                    side = this._getPosition(Pm, Qm, Q.coords.usrCoords, Qp);
                    P.delayedStatus = [side, "on"];
                } else {
                    // Neither P+ on line [Q,Q+], nor P- on line [Q-,Q]
                    // No delayed crossing / bouncing
                    if (P.delayedStatus.length === 0) {
                        if (
                            this._getPosition(Pm, Qm, Q.coords.usrCoords, Qp) !==
                            this._getPosition(Pp, Qm, Q.coords.usrCoords, Qp)
                        ) {
                            P.data.type = 'X';
                        } else {
                            P.data.type = 'B';
                        }
                    }
                }

                if (DEBUG) {
                    console.log(
                        ">>>> P:",
                        P.coords.usrCoords,
                        "delayedStatus:",
                        P.delayedStatus.toString(),
                        P.data ? P.data.type : " ",
                        "\n---"
                    );
                }
            }

            if (Type.exists(P._tours)) {
                P._tours++;
            }

            if (P._tours > 3 || P._end || cnt > 1000) {
                // Jump out if either
                // - we reached the end
                // - there are more than 1000 intersection points
                // - P._tours > 3: We went already 4 times through this path.
                if (cnt > 1000) {
                    console.log("Clipping: _classifyDegenerateIntersections exit");
                }
                if (Type.exists(P._tours)) {
                    delete P._tours;
                }
                break;
            }
            if (P.intersection) {
                cnt++;
            }
            P = P._next;
        }
        if (DEBUG) {
            console.log("------------------------");
        }
    },

    /**
     * At this point the degenerated intersections have been classified.
     * Now we decide if the intersection chains of the given path
     * ultimatively cross the other path or bounce.
     *
     * @param {JXG.Math.Clip.Vertex} P Start of path
     *
     * @see JXG.Math.Clip.markEntryExit
     * @see JXG.Math.Clip._classifyDegenerateIntersections
     * @private
     */
    _handleIntersectionChains: function (P) {
        var cnt = 0,
            start_status = "Null",
            P_start,
            endless = true,
            intersection_chain = false,
            wait_for_exit = false,
            DEBUG = false;

        if (DEBUG) {
            console.log(
                "\n-------------- _handleIntersectionChains()",
                Type.exists(P.data) ? P.data.pathname : " "
            );
        }
        while (endless) {
            if (P.intersection === true) {
                if (DEBUG) {
                    if (P.data.type === 'T') {
                        console.log(
                            "Degenerate point",
                            P.coords.usrCoords,
                            P.data.type,
                            P.data.type === "T" ? P.delayedStatus : " "
                        );
                    } else {
                        console.log("Intersection point", P.coords.usrCoords, P.data.type);
                    }
                }
                if (P.data.type === 'T') {
                    if (P.delayedStatus[0] !== "on" && P.delayedStatus[1] === 'on') {
                        // First point of intersection chain
                        intersection_chain = true;
                        P_start = P;
                        start_status = P.delayedStatus[0];
                    } else if (
                        intersection_chain &&
                        P.delayedStatus[0] === "on" &&
                        P.delayedStatus[1] === "on"
                    ) {
                        // Interior of intersection chain
                        P.data.type = 'B';
                        if (DEBUG) {
                            console.log("Interior", P.coords.usrCoords);
                        }
                    } else if (
                        intersection_chain &&
                        P.delayedStatus[0] === "on" &&
                        P.delayedStatus[1] !== "on"
                    ) {
                        // Last point of intersection chain
                        intersection_chain = false;
                        if (start_status === P.delayedStatus[1]) {
                            // Intersection chain is delayed bouncing
                            P_start.data.type = 'DB';
                            P.data.type = 'DB';
                            if (DEBUG) {
                                console.log(
                                    "Chain: delayed bouncing",
                                    P_start.coords.usrCoords,
                                    "...",
                                    P.coords.usrCoords
                                );
                            }
                        } else {
                            // Intersection chain is delayed crossing
                            P_start.data.type = 'DX';
                            P.data.type = 'DX';
                            if (DEBUG) {
                                console.log(
                                    "Chain: delayed crossing",
                                    P_start.coords.usrCoords,
                                    "...",
                                    P.coords.usrCoords
                                );
                            }
                        }
                    }
                }
                cnt++;
            }
            if (P._end) {
                wait_for_exit = true;
            }
            if (wait_for_exit && !intersection_chain) {
                break;
            }
            if (cnt > 1000) {
                console.log(
                    "Warning: _handleIntersectionChains: intersection chain reached maximum numbers of iterations"
                );
                break;
            }
            P = P._next;
        }
    },

    /**
     * Handle the case that all vertices of one path are contained
     * in the other path. In this case we search for a midpoint of an edge
     * which is not contained in the other path and add it to the path.
     * It will be used as starting point for the entry/exit algorithm.
     *
     * @private
     * @param {Array} S Subject path
     * @param {Array} C Clip path
     * @param {JXG.board} board JSXGraph board object. It is needed to convert between
     * user coordinates and screen coordinates.
     */
    _handleFullyDegenerateCase: function (S, C, board) {
        var P, Q, l, M, crds,
            q1, q2, node, i, j,
            leP, leQ, is_on_Q,
            tmp, is_fully_degenerated,
            arr = [S, C];

        for (l = 0; l < 2; l++) {
            P = arr[l];
            leP = P.length;
            for (i = 0, is_fully_degenerated = true; i < leP; i++) {
                if (!P[i].intersection) {
                    is_fully_degenerated = false;
                    break;
                }
            }

            if (is_fully_degenerated) {
                // All nodes of P are also on the other path.
                Q = arr[(l + 1) % 2];
                leQ = Q.length;

                // We search for a midpoint of one edge of P which is not the other path and
                // we add that midpoint to P.
                for (i = 0; i < leP; i++) {
                    q1 = P[i].coords.usrCoords;
                    q2 = P[i]._next.coords.usrCoords;

                    // M is the midpoint
                    M = [(q1[0] + q2[0]) * 0.5, (q1[1] + q2[1]) * 0.5, (q1[2] + q2[2]) * 0.5];

                    // Test if M is on path Q. If this is not the case,
                    // we take M as additional point of P.
                    for (j = 0, is_on_Q = false; j < leQ; j++) {
                        if (
                            Math.abs(
                                Geometry.det3p(
                                    Q[j].coords.usrCoords,
                                    Q[(j + 1) % leQ].coords.usrCoords,
                                    M
                                )
                            ) < Mat.eps
                        ) {
                            is_on_Q = true;
                            break;
                        }
                    }
                    if (!is_on_Q) {
                        // The midpoint is added to the doubly-linked list.
                        crds = new Coords(Const.COORDS_BY_USER, M, board);
                        node = {
                            pos: i,
                            intersection: false,
                            coords: crds,
                            elementClass: Const.OBJECT_CLASS_POINT
                        };

                        tmp = P[i]._next;
                        P[i]._next = node;
                        node._prev = P[i];
                        node._next = tmp;
                        tmp._prev = node;

                        if (P[i]._end) {
                            P[i]._end = false;
                            node._end = true;
                        }

                        break;
                    }
                }
            }
        }
    },

    _getStatus: function (P, path) {
        var status;
        while (P.intersection) {
            if (P._end) {
                break;
            }
            P = P._next;
        }
        if (Geometry.windingNumber(P.coords.usrCoords, path) === 0) {
            // Outside
            status = 'entry';
            // console.log(P.coords.usrCoords, ' is outside')
        } else {
            // Inside
            status = 'exit';
            // console.log(P.coords.usrCoords, ' is inside')
        }

        return [P, status];
    },

    /**
     * Mark the intersection vertices of path1 as entry points or as exit points
     * in respect to path2.
     * <p>
     * This is the simple algorithm as in
     * Greiner, Günther; Kai Hormann (1998). "Efficient clipping of arbitrary polygons".
     * ACM Transactions on Graphics. 17 (2): 71–83
     * <p>
     * The algorithm handles also "delayed crossings" from
     * Erich, L. Foster, and Kai Hormann, Kai, and Romeo Traaian Popa (2019),
     * "Clipping simple polygons with degenerate intersections", Computers & Graphics:X, 2.
     * and - as an additional improvement -
     * handles self intersections of delayed crossings (A.W. 2021).
     *
     * @private
     * @param  {Array} path1 First path
     * @param  {Array} path2 Second path
     */
    markEntryExit: function (path1, path2, starters) {
        var status, P, cnt, res,
            i, len, start,
            endless = true,
            chain_start = null,
            intersection_chain = 0,
            DEBUG = false;

        len = starters.length;
        for (i = 0; i < len; i++) {
            start = starters[i];
            if (DEBUG) {
                console.log(
                    "\n;;;;;;;;;; Labelling phase",
                    Type.exists(path1[start].data) ? path1[start].data.pathname : " ",
                    path1[start].coords.usrCoords
                );
            }
            this._classifyDegenerateIntersections(path1[start]);
            this._handleIntersectionChains(path1[start]);
            if (DEBUG) {
                console.log("\n---- back to markEntryExit");
            }

            // Decide if the first point of the component is inside or outside
            // of the other path.
            res = this._getStatus(path1[start], path2);
            P = res[0];
            status = res[1];
            if (DEBUG) {
                console.log("Start node:", P.coords.usrCoords, status);
            }

            P._starter = true;

            // Greiner-Hormann entry/exit algorithm
            // with additional handling of delayed crossing / bouncing
            cnt = 0;
            chain_start = null;
            intersection_chain = 0;

            while (endless) {
                if (P.intersection === true) {
                    if (P.data.type === "X" && intersection_chain === 1) {
                        // While we are in an intersection chain, i.e. a delayed crossing,
                        // we stumble on a crossing intersection.
                        // Probably, the other path is self intersecting.
                        // We end the intersection chain here and
                        // mark this event by setting intersection_chain = 2.
                        chain_start.entry_exit = status;
                        if (status === 'exit') {
                            chain_start.data.type = 'X';
                        }
                        intersection_chain = 2;
                    }

                    if (P.data.type === "X" || P.data.type === 'DB') {
                        P.entry_exit = status;
                        status = status === "entry" ? "exit" : 'entry';
                        if (DEBUG) {
                            console.log("mark:", P.coords.usrCoords, P.data.type, P.entry_exit);
                        }
                    }

                    if (P.data.type === 'DX') {
                        if (intersection_chain === 0) {
                            // Start of intersection chain.
                            // No active intersection chain yet,
                            // i.e. we did not pass a the first node of a delayed crossing.
                            chain_start = P;
                            intersection_chain = 1;
                            if (DEBUG) {
                                console.log(
                                    "Start intersection chain:",
                                    P.coords.usrCoords,
                                    P.data.type,
                                    status
                                );
                            }
                        } else if (intersection_chain === 1) {
                            // Active intersection chain (intersection_chain===1)!
                            // End of delayed crossing chain reached
                            P.entry_exit = status;
                            chain_start.entry_exit = status;
                            if (status === 'exit') {
                                chain_start.data.type = 'X';
                            } else {
                                P.data.type = 'X';
                            }
                            status = status === "entry" ? "exit" : 'entry';

                            if (DEBUG) {
                                console.log(
                                    "mark':",
                                    chain_start.coords.usrCoords,
                                    chain_start.data.type,
                                    chain_start.entry_exit
                                );
                                console.log(
                                    "mark:",
                                    P.coords.usrCoords,
                                    P.data.type,
                                    P.entry_exit
                                );
                            }
                            chain_start = null;
                            intersection_chain = 0;
                        } else if (intersection_chain === 2) {
                            // The delayed crossing had been interrupted by a crossing intersection.
                            // Now we treat the end of the delayed crossing as regular crossing.
                            P.entry_exit = status;
                            P.data.type = 'X';
                            status = status === "entry" ? "exit" : 'entry';
                            chain_start = null;
                            intersection_chain = 0;
                        }
                    }
                }

                P = P._next;
                if (Type.exists(P._starter) || cnt > 10000) {
                    break;
                }

                cnt++;
            }
        }
    },

    /**
     *
     * @private
     * @param {Array} P
     * @param {Boolean} isBackward
     * @returns {Boolean} True, if the node is an intersection and is of type 'X'
     */
    _stayOnPath: function (P, status) {
        var stay = true;

        if (P.intersection && P.data.type !== 'B') {
            stay = status === P.entry_exit;
        }
        return stay;
    },

    /**
     * Add a point to the clipping path and returns if the algorithms
     * arrived at an intersection point which has already been visited.
     * In this case, true is returned.
     *
     * @param {Array} path Resulting path
     * @param {JXG.Math.Clip.Vertex} vertex Point to be added
     * @param {Boolean} DEBUG debug output to console.log
     * @returns {Boolean} true: point has been visited before, false otherwise
     * @private
     */
    _addVertex: function (path, vertex, DEBUG) {
        if (!isNaN(vertex.coords.usrCoords[1]) && !isNaN(vertex.coords.usrCoords[2])) {
            path.push(vertex);
        }
        if (vertex.intersection && vertex.data.done) {
            if (DEBUG) {
                console.log(
                    "Add last intersection point",
                    vertex.coords.usrCoords,
                    "on",
                    vertex.data.pathname,
                    vertex.entry_exit,
                    vertex.data.type
                );
            }
            return true;
        }
        if (vertex.intersection) {
            vertex.data.done = true;

            if (DEBUG) {
                console.log(
                    "Add intersection point",
                    vertex.coords.usrCoords,
                    "on",
                    vertex.data.pathname,
                    vertex.entry_exit,
                    vertex.data.type
                );
            }
        }
        return false;
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
    tracing: function (S, S_intersect, clip_type) {
        var P, status, current, start,
            cnt = 0,
            maxCnt = 10000,
            S_idx = 0,
            path = [],
            done = false,
            DEBUG = false;

        if (DEBUG) {
            console.log("\n------ Start Phase 3");
        }

        // reverse = (clip_type === 'difference' || clip_type === 'union') ? true : false;
        while (S_idx < S_intersect.length && cnt < maxCnt) {
            // Take the first intersection node of the subject path
            // which is not yet included as start point.
            current = S_intersect[S_idx];
            if (
                current.data.done ||
                current.data.type !== "X" /*|| !this._isCrossing(current, reverse)*/
            ) {
                S_idx++;
                continue;
            }

            if (DEBUG) {
                console.log(
                    "\nStart",
                    current.data.pathname,
                    current.coords.usrCoords,
                    current.data.type,
                    current.entry_exit,
                    S_idx
                );
            }
            if (path.length > 0) {
                // Add a new path
                path.push([NaN, NaN]);
            }

            // Start now the tracing with that node of the subject path
            start = current.data.idx;
            P = S;

            done = this._addVertex(path, current, DEBUG);
            status = current.entry_exit;
            do {
                if (done) {
                    break;
                }
                //
                // Decide if we follow the current path forward or backward.
                // for example, in case the clipping is of type "intersection"
                // and the current intersection node is of type entry, we go forward.
                //
                if (
                    (clip_type === "intersection" && current.entry_exit === 'entry') ||
                    (clip_type === "union" && current.entry_exit === 'exit') ||
                    (clip_type === "difference" &&
                        (P === S) === (current.entry_exit === 'exit'))
                ) {
                    if (DEBUG) {
                        console.log("Go forward on", current.data.pathname, current.entry_exit);
                    }

                    //
                    // Take the next nodes and add them to the path
                    // as long as they are not intersection nodes of type 'X'.
                    //
                    do {
                        current = current._next;
                        done = this._addVertex(path, current, DEBUG);
                        if (done) {
                            break;
                        }
                    } while (this._stayOnPath(current, status));
                    cnt++;
                } else {
                    if (DEBUG) {
                        console.log("Go backward on", current.data.pathname);
                    }
                    //
                    // Here, we go backward:
                    // Take the previous nodes and add them to the path
                    // as long as they are not intersection nodes of type 'X'.
                    //
                    do {
                        current = current._prev;
                        done = this._addVertex(path, current, DEBUG);
                        if (done) {
                            break;
                        }
                    } while (this._stayOnPath(current, status));
                    cnt++;
                }

                if (done) {
                    break;
                }

                if (!current.neighbour) {
                    console.log(
                        "Tracing: emergency break - no neighbour!!!!!!!!!!!!!!!!!",
                        cnt
                    );
                    return [[0], [0]];
                }
                //
                // We stopped the forward or backward loop, because we've
                // arrived at a crossing intersection node, i.e. we have to
                // switch to the other path now.
                if (DEBUG) {
                    console.log(
                        "Switch from",
                        current.coords.usrCoords,
                        current.data.pathname,
                        "to",
                        current.neighbour.coords.usrCoords,
                        "on",
                        current.neighbour.data.pathname
                    );
                }
                current = current.neighbour;
                if (current.data.done) {
                    break;
                }
                current.data.done = true;
                status = current.entry_exit;

                // if (current.data.done) {
                //     // We arrived at an intersection node which is already
                //     // added to the clipping path.
                //     // We add it again to close the clipping path and jump out of the
                //     // loop.
                //     path.push(current);
                //     if (DEBUG) {
                //         console.log("Push last", current.coords.usrCoords);
                //     }
                //     break;
                // }
                P = current.data.path;

                // Polygon closed:
                // if (DEBUG) {
                //     console.log("End of loop:", "start=", start, "idx=", current.data.idx);
                // }
                // } while (!(current.data.pathname === 'S' && current.data.idx === start) && cnt < maxCnt);
            } while (current.data.idx !== start && cnt < maxCnt);

            if (cnt >= maxCnt) {
                console.log("Tracing: stopping an infinite loop!", cnt);
            }

            S_idx++;
        }
        return this._getCoordsArrays(path, false);
    },

    /**
     * Handle path clipping if one of the two paths is empty.
     * @private
     * @param  {Array} S        First path, array of JXG.Coords
     * @param  {Array} C        Second path, array of JXG.Coords
     * @param  {String} clip_type Type of Boolean operation: 'intersection', 'union', 'differrence'.
     * @return {Boolean}        true, if one of the input paths is empty, false otherwise.
     */
    isEmptyCase: function (S, C, clip_type) {
        if (clip_type === "intersection" && (S.length === 0 || C.length === 0)) {
            return true;
        }
        if (clip_type === "union" && S.length === 0 && C.length === 0) {
            return true;
        }
        if (clip_type === "difference" && S.length === 0) {
            return true;
        }

        return false;
    },

    _getCoordsArrays: function (path, doClose) {
        var pathX = [],
            pathY = [],
            i,
            le = path.length;

        for (i = 0; i < le; i++) {
            if (path[i].coords) {
                pathX.push(path[i].coords.usrCoords[1]);
                pathY.push(path[i].coords.usrCoords[2]);
            } else {
                pathX.push(path[i][0]);
                pathY.push(path[i][1]);
            }
        }
        if (doClose && le > 0) {
            if (path[0].coords) {
                pathX.push(path[0].coords.usrCoords[1]);
                pathY.push(path[0].coords.usrCoords[2]);
            } else {
                pathX.push(path[0][0]);
                pathY.push(path[0][1]);
            }
        }

        return [pathX, pathY];
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
    handleEmptyIntersection: function (S, C, clip_type) {
        var P,
            Q,
            doClose = false,
            path = [];

        // Handle trivial cases
        if (S.length === 0) {
            if (clip_type === 'union') {
                // S cup C = C
                path = C;
            } else {
                // S cap C = S \ C = {}
                path = [];
            }
            return this._getCoordsArrays(path, true);
        }
        if (C.length === 0) {
            if (clip_type === 'intersection') {
                // S cap C = {}
                path = [];
            } else {
                // S cup C = S \ C = S
                path = S;
            }
            return this._getCoordsArrays(path, true);
        }

        // From now on, both paths have non-zero length.
        // The two paths have no crossing intersections,
        // but there might be bouncing intersections.

        // First, we find -- if possible -- on each path a point which is not an intersection point.
        if (S.length > 0) {
            P = S[0];
            while (P.intersection) {
                P = P._next;
                if (P._end) {
                    break;
                }
            }
        }
        if (C.length > 0) {
            Q = C[0];
            while (Q.intersection) {
                Q = Q._next;
                if (Q._end) {
                    break;
                }
            }
        }

        // Test if one curve is contained by the other
        if (Geometry.windingNumber(P.coords.usrCoords, C) === 0) {
            // P is outside of C:
            // Either S is disjoint from C or C is inside of S
            if (Geometry.windingNumber(Q.coords.usrCoords, S) !== 0) {
                // C is inside of S, i.e. C subset of S

                if (clip_type === 'union') {
                    Type.concat(path, S);
                    path.push(S[0]);
                } else if (clip_type === 'difference') {
                    Type.concat(path, S);
                    path.push(S[0]);
                    if (Geometry.signedPolygon(S) * Geometry.signedPolygon(C) > 0) {
                        // Pathes have same orientation, we have to revert one.
                        path.reverse();
                    }
                    path.push([NaN, NaN]);
                }
                if (clip_type === "difference" || clip_type === 'intersection') {
                    Type.concat(path, C);
                    path.push(C[0]);
                    doClose = false;
                }
            } else {
                // The curves are disjoint
                if (clip_type === 'difference') {
                    Type.concat(path, S);
                    doClose = true;
                } else if (clip_type === 'union') {
                    Type.concat(path, S);
                    path.push(S[0]);
                    path.push([NaN, NaN]);
                    Type.concat(path, C);
                    path.push(C[0]);
                }
            }
        } else {
            // S inside of C, i.e. S subset of C
            if (clip_type === 'intersection') {
                Type.concat(path, S);
                doClose = true;
            } else if (clip_type === 'union') {
                Type.concat(path, C);
                path.push(C[0]);
            }

            // 'difference': path is empty
        }

        return this._getCoordsArrays(path, doClose);
    },

    /**
     * Count intersection points of type 'X'.
     * @param {JXG.Mat.Clip.Vertex} intersections
     * @returns Number
     * @private
     */
    _countCrossingIntersections: function (intersections) {
        var i,
            le = intersections.length,
            sum = 0;

        for (i = 0; i < le; i++) {
            if (intersections[i].data.type === 'X') {
                sum++;
            }
        }
        return sum;
    },

    /**
     * Create path from all sorts of input elements and convert it
     * to a suitable input path for greinerHormann().
     *
     * @private
     * @param {Object} obj Maybe curve, arc, sector, circle, polygon, array of points, array of JXG.Coords,
     * array of coordinate pairs.
     * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
     * user coordinates and screen coordinates.
     * @returns {Array} Array of JXG.Coords elements containing a path.
     * @see JXG.Math.Clip.greinerHormann
     */
    _getPath: function (obj, board) {
        var i, len, r,
            rad, angle, alpha, steps,
            S = [];

        // Collect all points into path array S
        if (
            obj.elementClass === Const.OBJECT_CLASS_CURVE &&
            (obj.type === Const.OBJECT_TYPE_ARC || obj.type === Const.OBJECT_TYPE_SECTOR)
        ) {
            angle = Geometry.rad(obj.radiuspoint, obj.center, obj.anglepoint);
            steps = Math.floor((angle * 180) / Math.PI);
            r = obj.Radius();
            rad = angle / steps;
            alpha = Math.atan2(
                obj.radiuspoint.coords.usrCoords[2] - obj.center.coords.usrCoords[2],
                obj.radiuspoint.coords.usrCoords[1] - obj.center.coords.usrCoords[1]
            );

            if (obj.type === Const.OBJECT_TYPE_SECTOR) {
                this._addToList(S, obj.center.coords, 0);
            }
            for (i = 0; i <= steps; i++) {
                this._addToList(
                    S,
                    new Coords(
                        Const.COORDS_BY_USER,
                        [
                            obj.center.coords.usrCoords[0],
                            obj.center.coords.usrCoords[1] + Math.cos(i * rad + alpha) * r,
                            obj.center.coords.usrCoords[2] + Math.sin(i * rad + alpha) * r
                        ],
                        board
                    ),
                    i + 1
                );
            }
            if (obj.type === Const.OBJECT_TYPE_SECTOR) {
                this._addToList(S, obj.center.coords, steps + 2);
            }
        } else if (obj.elementClass === Const.OBJECT_CLASS_CURVE && Type.exists(obj.points)) {
            len = obj.numberPoints;
            for (i = 0; i < len; i++) {
                this._addToList(S, obj.points[i], i);
            }
        } else if (obj.type === Const.OBJECT_TYPE_POLYGON) {
            for (i = 0; i < obj.vertices.length; i++) {
                this._addToList(S, obj.vertices[i].coords, i);
            }
        } else if (obj.elementClass === Const.OBJECT_CLASS_CIRCLE) {
            steps = 359;
            r = obj.Radius();
            rad = (2 * Math.PI) / steps;
            for (i = 0; i <= steps; i++) {
                this._addToList(
                    S,
                    new Coords(
                        Const.COORDS_BY_USER,
                        [
                            obj.center.coords.usrCoords[0],
                            obj.center.coords.usrCoords[1] + Math.cos(i * rad) * r,
                            obj.center.coords.usrCoords[2] + Math.sin(i * rad) * r
                        ],
                        board
                    ),
                    i
                );
            }
        } else if (Type.isArray(obj)) {
            len = obj.length;
            for (i = 0; i < len; i++) {
                if (Type.exists(obj[i].coords)) {
                    // Point type
                    this._addToList(S, obj[i].coords, i);
                } else if (Type.isArray(obj[i])) {
                    // Coordinate pair
                    this._addToList(S, new Coords(Const.COORDS_BY_USER, obj[i], board), i);
                } else if (Type.exists(obj[i].usrCoords)) {
                    // JXG.Coordinates
                    this._addToList(S, obj[i], i);
                }
            }
        }

        return S;
    },

    /**
     * Determine the intersection, union or difference of two closed paths.
     * <p>
     * This is an implementation of the Greiner-Hormann algorithm, see
     * Günther Greiner and Kai Hormann (1998).
     * "Efficient clipping of arbitrary polygons". ACM Transactions on Graphics. 17 (2): 71–83.
     * and
     * Erich, L. Foster, and Kai Hormann, Kai, and Romeo Traaian Popa (2019),
     * "Clipping simple polygons with degenerate intersections", Computers & Graphics:X, 2.
     * <p>
     * It is assumed that the pathes are closed, whereby it does not matter if the last point indeed
     * equals the first point. In contrast to the original Greiner-Hormann algorithm,
     * this algorithm can cope with many degenerate cases. A degenerate case is a vertext of one path
     * which is contained in the other path.
     * <p>
     *
     * <p>Problematic are:
     * <ul>
     *   <li>degenerate cases where one path additionally has self-intersections
     *   <li>differences with one path having self-intersections.
     * </ul>
     *
     * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} subject   First closed path, usually called 'subject'.
     * Maybe curve, arc, sector, circle, polygon, array of points, array of JXG.Coords,
     * array of coordinate pairs.
     * @param  {JXG.Circle|JXG.Curve|JXG.Polygon} clip      Second closed path, usually called 'clip'.
     * Maybe curve, arc, sector, circle, polygon, array of points, array of JXG.Coords,
     * array of coordinate pairs.
     * @param  {String} clip_type Determines the type of boolean operation on the two paths.
     *  Possible values are 'intersection', 'union', or 'difference'.
     * @param  {JXG.Board} board   JSXGraph board object. It is needed to convert between
     * user coordinates and screen coordinates.
     * @return {Array}          Array consisting of two arrays containing the x-coordinates and the y-coordinates of
     *      the resulting path.
     *
     * @see JXG.Math.Clip.intersection
     * @see JXG.Math.Clip.union
     * @see JXG.Math.Clip.difference
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
    greinerHormann: function (subject, clip, clip_type, board) {
        //},
        // subject_first_point_type, clip_first_point_type) {

        var len,
            S = [],
            C = [],
            S_intersect = [],
            // C_intersect = [],
            S_starters,
            C_starters,
            res = [],
            DEBUG = false;

        if (DEBUG) {
            console.log("\n------------ GREINER-HORMANN --------------");
        }
        // Collect all subject points into subject array S
        S = this._getPath(subject, board);
        len = S.length;
        if (
            len > 0 &&
            Geometry.distance(S[0].coords.usrCoords, S[len - 1].coords.usrCoords, 3) < Mat.eps
        ) {
            S.pop();
        }

        // Collect all points into clip array C
        C = this._getPath(clip, board);
        len = C.length;
        if (
            len > 0 &&
            Geometry.distance(C[0].coords.usrCoords, C[len - 1].coords.usrCoords, 3) <
                Mat.eps * Mat.eps
        ) {
            C.pop();
        }

        // Handle cases where at least one of the paths is empty
        if (this.isEmptyCase(S, C, clip_type)) {
            return [[], []];
        }

        // Add pointers for doubly linked lists
        S_starters = this.makeDoublyLinkedList(S);
        C_starters = this.makeDoublyLinkedList(C);

        if (DEBUG) {
            this._print_array(S);
            console.log("Components:", S_starters);
            this._print_array(C);
            console.log("Components:", C_starters);
        }

        res = this.findIntersections(S, C, board);
        S_intersect = res[0];

        this._handleFullyDegenerateCase(S, C, board);

        // Phase 2: mark intersection points as entry or exit points
        this.markEntryExit(S, C, S_starters);

        // if (S[0].coords.distance(Const.COORDS_BY_USER, C[0].coords) === 0) {
        //     // Randomly disturb the first point of the second path
        //     // if both paths start at the same point.
        //     C[0].usrCoords[1] *= 1 + Math.random() * 0.0001 - 0.00005;
        //     C[0].usrCoords[2] *= 1 + Math.random() * 0.0001 - 0.00005;
        // }
        this.markEntryExit(C, S, C_starters);

        // Handle cases without intersections
        if (this._countCrossingIntersections(S_intersect) === 0) {
            return this.handleEmptyIntersection(S, C, clip_type);
        }

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
     * @see JXG.Math.Clip.greinerHormann
     * @see JXG.Math.Clip.intersection
     * @see JXG.Math.Clip.difference
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
    union: function (path1, path2, board) {
        return this.greinerHormann(path1, path2, "union", board);
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
     * @see JXG.Math.Clip.greinerHormann
     * @see JXG.Math.Clip.union
     * @see JXG.Math.Clip.difference
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
    intersection: function (path1, path2, board) {
        return this.greinerHormann(path1, path2, "intersection", board);
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
     * @see JXG.Math.Clip.greinerHormann
     * @see JXG.Math.Clip.intersection
     * @see JXG.Math.Clip.union
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
    difference: function (path1, path2, board) {
        return this.greinerHormann(path1, path2, "difference", board);
    }
};

// JXG.extend(Mat.Clip, /** @lends JXG.Math.Clip */ {});

export default Mat.Clip;
