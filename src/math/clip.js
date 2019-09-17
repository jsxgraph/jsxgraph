/*
    Copyright 2008-2019
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
 * * API docs
 * * Allow polygons instead of paths. Can module "Expect" be used?
 * * Check if input polygons are closed. If not, handle this case.
 * * Handle circles
 */

define([
    'jxg', 'base/constants', 'base/coords', 'math/math', 'math/geometry', 'utils/type', 'utils/expect'
], function (JXG, Const, Coords, Mat, Geometry, Type, Expect) {

    "use strict";

    /**
     * Math.Clip namespace definition
     * @name JXG.Math.Clip
     * @namespace
     */
    Mat.Clip = {

        /**
         * Add pointers to an array S such that it is a circular doubly-linked list.
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

        det: function(p1, p2, q) {
            return (p1[1] - q[1]) * (p2[2] - q[2]) - (p2[1] - q[1]) * (p1[2] - q[2]);
        },

        /**
         * Winding number of a point in respect to a polygon path.
         *
         * The point is regarded outside if the winding number is zero,
         * inside otherwise. The algorithm tries to find degenerate cases, i.e.
         * if the point is on the path. This is regarded as "outside".
         *
         * Implementation of algorithm 7 from "The point in polygon problem for
         * arbitrary polygons" by Kai Hormann and Alexander Agathos, Computational Geometry,
         * Volume 20, Issue 3, November 2001, Pages 131-144.
         *
         * @param  {Array} usrCoords Homogenous coordinates of the point
         * @param  {Array} path      JXG.Coords array of the path, i.e. the vertices of the polygon.
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

            if (le == 0) {
                return 0;
            }

            // Infinite points are declared outside
            if (x === NaN || y === NaN) {
                return 1;
            }

            // The point is a vertex of the path
            if (path[0].usrCoords[1] === x &&
                path[0].usrCoords[2] === y) {

                console.log('<<<<<<< Vertex 1');
                return 1;
            }

            for (i = 0; i < le - 1; i++) {
                // Consider the edge from p1 = path[i] to p2 = path[i+1]
                p1 = path[i].usrCoords;
                p2 = path[(i + 1) % le].usrCoords;
                if (p1[0] === 0 || p2[0] === 0 ||
                    isNaN(p1[1]) || isNaN(p2[1]) ||
                    isNaN(p1[2]) || isNaN(p2[2])) {

                    continue;
                }

                if (p2[2] === y) {
                    if (p2[1] === x) {
                        console.log('<<<<<<< Vertex 2');
                        return 1;
                    } else {
                        if (p1[2] === y && ((p2[1] > x) === (p1[1] < x))) {
                            console.log('<<<<<<< Edge 1', p1, p2, [x, y]);
                            return 0;
                        }
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
                                console.log('<<<<<<< Edge 2');
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

        Vertex: function(coords, i, alpha, path, pathname) {
            this.coords = coords;
            this.usrCoords = this.coords.usrCoords;
            this.scrCoords = this.coords.scrCoords;

            this.intersect = true;
            this.alpha = alpha;
            this.pos = i;
            this.path = path;
            this.pathname = pathname;
            this.done = false;

            // Set after initialisation
            this.neighbour = null;
            this.entry_exit = false;
            this.cnt = 0;
        },

        sortIntersections: function(P_crossings) {
            var i, j, P, last,
                P_intersect = [],
                P_le = P_crossings.length;

            for (i = 0; i < P_le; i++) {
                P_crossings[i].sort(function(a, b) { return (a.alpha > b.alpha) ? 1 : -1; });
                if (P_crossings[i].length > 0) {
                    last = P_crossings[i].length - 1;
                    P = P_crossings[i][0];
                    P._prev = P.path[P.pos];
                    P._prev._next = P;
                    for (j = 1; j <= last; j++) {
                        P = P_crossings[i][j];
                        P._prev = P_crossings[i][j - 1];
                        P._prev._next = P;
                    }
                    P = P_crossings[i][last];
                    P._next = P.path[P.pos + 1];
                    P._next._prev = P;

                    P_intersect = P_intersect.concat(P_crossings[i]);
                }
            }
            return P_intersect;
        },

        findIntersections: function(S, C, board) {
            var //pS = S[0],
                //pC = C[0],
                res = [],
                i, j, k, l, ignore, min_S, min_C, max_S, max_C, swap, crds,
                P,
                S_le = S.length - 1,
                C_le = C.length - 1,
                // cnt = 0,
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

                // Run through the clip path.
                for (j = 0; j < C_le; j++) {
                    // Test if bounding boxes of the two curve segments overlap
                    // If not, the expensive intersection test can be skipped.
                    ignore = false;
                    for (k = 0; k < 3; k++) {
                        min_S = S[i].usrCoords[k];
                        max_S = S[i + 1].usrCoords[k];
                        if (min_S > max_S) {
                            swap = max_S;
                            max_S = min_S;
                            min_S = swap;
                        }
                        min_C = C[j].usrCoords[k];
                        max_C = C[j + 1].usrCoords[k];
                        if (min_C > max_C) {
                            swap = max_C;
                            max_C = min_C;
                            min_C = swap;
                        }
                        if (max_S < min_C || min_S > max_C) {
                            ignore = true;
                            break;
                        }
                    }
                    if (ignore) {
                        continue;
                    }

                    // Intersection test
                    res = Geometry.meetSegmentSegment(S[i].usrCoords, S[i + 1].usrCoords,
                                                      C[j].usrCoords, C[j + 1].usrCoords);

                    if (res[1] >= 0.0 && res[1] <= 1.0 &&
                        res[2] >= 0.0 && res[2] <= 1.0) {

                        ignore = false;
                        crds = new Coords(JXG.COORDS_BY_USER, res[0], board);
                        // for (k = 0; k < i && !ignore; k++) {
                        //     for (l = 0; l < S_crossings[k].length && !ignore; l++) {
                        //         if (Math.round(0.5 * (crds.scrCoords[1] - S_crossings[k][l].scrCoords[1])) === 0 &&
                        //             Math.round(0.5 * (crds.scrCoords[2] - S_crossings[k][l].scrCoords[2])) === 0) {
                        //                 ignore = true;
                        //             }
                        //     }
                        // }
                        if (ignore) {
                            continue;
                        }

                        IS = new this.Vertex(crds, i, res[1], S, 'S');
                        IC = new this.Vertex(crds, j, res[2], C, 'C');
                        IS.neighbour = IC;
                        IC.neighbour = IS;

                        // IS.cnt = cnt;
                        // IC.cnt = cnt;
                        // cnt++;

                        S_crossings[i].push(IS);
                        C_crossings[j].push(IC);
                    }
                }
            }

            S_intersect = this.sortIntersections(S_crossings);
            for (i = 0; i < S_intersect.length; i++) {
                S_intersect[i].cnt = i;
                S_intersect[i].neighbour.cnt = i;
            }
            C_intersect = this.sortIntersections(C_crossings);

            return [S_intersect, C_intersect];
        },

        markEntryExit: function(path1, path2) {
            var status, Pprev, Pnext,
                t_prev, t_next,
                P = path1[0];

            if (this.windingNumber(P.usrCoords, path2) === 0) {
                // console.log('OUT');
                status = 'entry';
            } else {
                // console.log('IN');
                status = 'exit';
            }

            while (!P._end) {
                P = P._next;
                if (Type.exists(P.intersect)) {
                    //console.log(P.cnt);

                    //this.windingNumber(P.usrCoords, path2);
                    // Pprev = P._prev;
                    // Pnext = P._next;
                    //
                    // if (Pnext.intersect && Pnext.entry_exit) {
                    //     status = Pnext.entry_exit;
                    // } else if (Pprev.intersect && Pprev.entry_exit) {
                    //     status = Pprev.entry_exit;
                    // } else {
                    //     while (Pnext.intersect) {
                    //         Pnext = Pnext._next;
                    //     }
                    //     while (Pprev.intersect) {
                    //         Pprev = Pprev._prev;
                    //     }
                    //     // Pnext = Pnext._next;
                    //     // Pprev = Pprev._prev;
                    //
                    //     console.log(":::",Pprev.usrCoords, Pnext.usrCoords, P.usrCoords);
                    //     t_prev = (this.windingNumber(Pprev.usrCoords, path2) == 0) ? 'out':'in';
                    //     t_next = (this.windingNumber(Pnext.usrCoords, path2) == 0) ? 'out':'in';
                    //
                    //     if (t_prev === 'out' && t_next === 'in') {
                    //         status = 'entry';
                    //         console.log(status)
                    //     } else if (t_prev === 'in' && t_next === 'out') {
                    //         status = 'exit';
                    //         console.log(status)
                    //     } else {
                    //         console.log("Can not mark", P.cnt, P.coords.usrCoords, t_prev, t_next);
                    //         //console.log( ":",winding_number(Pprev.usrCoords, path2), winding_number(Pnext.usrCoords, path2));
                    //         status = 'bounce';
                    //     }
                    // }

                    // console.log("MARKED", P.name, P.cnt, status);
                    P.entry_exit = status;

                    if (status == 'entry') {
                        status = 'exit';
                    } else {
                        status = 'entry';
                    }
                }
            }
        },

        /**
         * [description]
         * @param  {[type]} subject [description]
         * @param  {[type]} clip    [description]
         * @return {[type]}         [description]
         */
        greinerHormann: function(subject, clip, clip_type, board) {
            var pS, pC, P, i, current, start,
                S = [],
                C = [],
                S_intersect = [],
                C_intersect = [],
                S_intersect_idx, cnt,
                maxCnt = 40000,
                res = [],
                pathX = [],
                pathY = [];

            if (Type.exists(subject.points)) {
                S = subject.points;
            }
            if (Type.exists(clip.points)) {
                C = clip.points;
            }

            // Handle degenerated cases
            if (clip_type === 'intersection' && (S.length === 0 || C.length === 0)) {
                return [pathX, pathY];
            } else if (clip_type === 'union' && (S.length === 0 || C.length === 0)) {
                if (S.length == 0) {
                    for (i = 0; i < C.length; ++i) {
                        pathX.push(C[i].usrCoords[1]);
                        pathY.push(C[i].usrCoords[2]);
                    }
                } else {
                    for (i = 0; i < S.length; ++i) {
                        pathX.push(S[i].usrCoords[1]);
                        pathY.push(S[i].usrCoords[2]);
                    }
                }
                return [pathX, pathY];
            } if (clip_type === 'setminus' && (S.length === 0 || C.length === 0)) {
                if (C.length == 0) {
                    for (i = 0; i < S.length; ++i) {
                        pathX.push(S[i].usrCoords[1]);
                        pathY.push(S[i].usrCoords[2]);
                    }
                }
                return [pathX, pathY];
            }

            // pS, pC are pointers to the first elements the two doubly linked lists
            this.doublyLinkedList(S);
            this.doublyLinkedList(C);

            res = this.findIntersections(S, C, board);
            S_intersect = res[0];
            C_intersect = res[1];

            if (S_intersect.length === 0) {
                if (clip_type === 'union') {
                    for (i = 0; i < S.length; ++i) {
                        pathX.push(S[i].usrCoords[1]);
                        pathY.push(S[i].usrCoords[2]);
                    }
                    pathX.push(NaN);
                    pathY.push(NaN);
                    for (i = 0; i < C.length; ++i) {
                        pathX.push(C[i].usrCoords[1]);
                        pathY.push(C[i].usrCoords[2]);
                    }
                    return [pathX, pathY];
                }

                // Test if one curve is contained by the other
                if (this.windingNumber(S[0].usrCoords, C) === 0) {     // S is outside of C,
                    if (this.windingNumber(C[0].usrCoords, S) !== 0) { // C is inside of S, i.e. C subset of S
                        if (clip_type === 'setminus') {
                            for (i = 0; i < S.length; ++i) {
                                pathX.push(S[i].usrCoords[1]);
                                pathY.push(S[i].usrCoords[2]);
                            }
                            pathX.push(NaN);
                            pathY.push(NaN);
                        }
                        P = C;
                    } else {                                           // The curves are disjoint
                        if (clip_type === 'intersection') {
                            P = [];
                        } else if (clip_type === 'setminus') {
                            P = S;
                        }
                    }
                } else {                                               // S inside of C, i.e. S subset of C
                    if (clip_type === 'intersection') {
                        P = S;
                    } else if (clip_type === 'setminus') {
                        P = [];
                    }
                }
                for (i = 0; i < P.length; ++i) {
                    pathX.push(P[i].usrCoords[1]);
                    pathY.push(P[i].usrCoords[2]);
                }

                return [pathX, pathY];
            }

            // Phase 2
            this.markEntryExit(S, C);
            if (S[0].distance(Const.COORDS_BY_USER, C[0]) === 0) {
                // Randomly disturb the first point of the second path
                // if both paths start at the same point.
                C[0].usrCoords[1] *= 1 + Math.random() * 0.0001 - 0.00005;
                C[0].usrCoords[2] *= 1 + Math.random() * 0.0001 - 0.00005;
            }
            this.markEntryExit(C, S);

            // for (i = 0; i < S_intersect.length; i++) {
            //     console.log('S', S_intersect[i].cnt, S_intersect[i].entry_exit, S_intersect[i].usrCoords);
            // }
            // console.log();
            // for (i = 0; i < C_intersect.length; i++) {
            //     console.log('C', C_intersect[i].cnt, C_intersect[i].entry_exit, C_intersect[i].usrCoords);
            // }

            // console.log(S_intersect);
            // console.log();
            // console.log(C_intersect);

            // Phase 3
            cnt = 0;
            S_intersect_idx = 0;
            // console.time('phase3');
            while (S_intersect_idx < S_intersect.length && cnt < maxCnt) {
                current = S_intersect[S_intersect_idx];
                if (current.done) {
                    S_intersect_idx++;
                    continue;
                }

                //console.log("Start", current.usrCoords, current.entry_exit, S_intersect_idx);
                if (pathX.length > 0) {             // Add a new path
                    pathX.push(NaN);
                    pathY.push(NaN);
                }

                start = current.cnt;
                P = S;
                do {
                    // Add the "current" vertex
                    pathX.push(current.usrCoords[1]);
                    pathY.push(current.usrCoords[2]);
                    current.done = true;

                    // if (cnt < 10000)
                    // console.log(current.pathname, current.cnt, current.entry_exit, current.usrCoords[1].toFixed(3), current.usrCoords[2].toFixed(3));

                    // if (current.entry_exit == 'exit') { // Boolean op: union
                    //if ((P == S && current.entry_exit == 'exit') || (P != S && current.entry_exit == 'entry')) { // Boolean op: S \ C
                    // if ((P == S && current.entry_exit == 'entry') || (P != S && current.entry_exit == 'exit')) { // Boolean op: C \ S

                    if ((clip_type == 'intersection' && current.entry_exit == 'entry') ||
                        (clip_type == 'union' && current.entry_exit == 'exit') ||
                        (clip_type == 'setminus' && (P == S) === (current.entry_exit == 'exit'))
                        ) {

                        current = current._next;
                        do {
                            cnt++;

                            pathX.push(current.usrCoords[1]);
                            pathY.push(current.usrCoords[2]);

                            if (!JXG.exists(current.intersect)) {  // In case there are two adjacent intersects
                                current = current._next;
                            }
                        } while (!JXG.exists(current.intersect)
                                // || (JXG.exists(current.intersect) && current.entry_exit == 'bounce'))
                                && cnt < maxCnt);
                    } else {
                        current = current._prev;
                        do {
                            cnt++;

                            pathX.push(current.usrCoords[1]);
                            pathY.push(current.usrCoords[2]);

                            if (!JXG.exists(current.intersect)) {  // In case there are two adjacent intersects
                                current = current._prev;
                            }
                        } while (!JXG.exists(current.intersect)
                                // || (JXG.exists(current.intersect) && current.entry_exit == 'bounce'))
                                 && cnt < maxCnt);
                    }
                    current.done = true;

                    // if (current._end) {
                    //     break;
                    // }

                    if (!current.neighbour) {
                        console.log("BREAK!!!!!!!!!!!!!!!!!", cnt);
                        return [[0], [0]];
                    }

                    // console.log("Switch", current.pathname, current.cnt, "to", current.neighbour.pathname, current.neighbour.cnt);
                    current = current.neighbour;
                    if (current.done) {
                        pathX.push(current.usrCoords[1]);
                        pathY.push(current.usrCoords[2]);
                        break;
                    }
                    P = current.path;

                } while (!(current.pathname == 'S' && current.cnt == start) && cnt < maxCnt);

                S_intersect_idx++;
            }

            return [pathX, pathY];
        },

        union: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'union', board);
        },

        intersection: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'intersection', board);
        },

        setminus: function(path1, path2, board) {
            return this.greinerHormann(path1, path2, 'setminus', board);
        }

    };

    JXG.extend(Mat.Clip, /** @lends JXG.Math.Clip */ {
    });

    return Mat.Clip;
});
