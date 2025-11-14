/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

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

/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

(function () {
    "use strict";

    JXG.GraphReader = function (board, str) {
        this.board = board;
        this.data = str;
    };

    JXG.extend(
        JXG.GraphReader.prototype,
        /** @lends JXG.GraphReader.prototype */ {
            parseData: function (directed) {
                var splitted,
                    n, i, j,
                    tmp, tmp2,
                    nodes = [],
                    adjMatrix = [],
                    nodenumbers = {},
                    weighted = false,
                    boundingBox;

                splitted = this.data.split("\n");
                // remove whitespaces
                for (i = 0; i < splitted.length; i++) {
                    splitted[i] = splitted[i].replace(/^\s+/, "").replace(/\s+$/, "");
                }

                // first line: bounding box
                boundingBox = splitted[0].split(" ");
                for (i = 0; i < boundingBox.length; i++) {
                    boundingBox[i] = parseInt(boundingBox[i], 10);
                }

                this.board.setBoundingBox(boundingBox, true);
                splitted.shift();

                // second  line: graph/digraph?
                if (splitted[0] == 'digraph') {
                    directed = true;
                } else {
                    directed = false;
                }
                splitted.shift();

                // third  line: number of nodes
                n = parseInt(splitted[0], 10);

                // nodes
                for (i = 1; i <= n; i++) {
                    if (splitted[i].search(/ /) > -1) {
                        tmp = splitted[i].split(" ");
                        nodes.push({
                            name: tmp[0],
                            coords: [parseInt(tmp[1], 10), parseInt(tmp[2], 10)]
                        });
                        nodenumbers[tmp[0]] = i - 1;
                        // no pre-defined coordinates
                    } else {
                        tmp = splitted[i];
                        nodes.push({ name: tmp, coords: [null, null] });
                        nodenumbers[tmp] = i - 1;
                    }
                }

                // edges
                // check whether the graph is weighted or not
                for (i = n + 1; i < splitted.length; i++) {
                    tmp = splitted[i].split(" ");
                    // weights
                    if (tmp.length > 2) {
                        weighted = true;
                        break;
                    }
                }

                // initialize entries of the adjacency matrix
                for (i = 0; i < n; i++) {
                    adjMatrix[i] = [];
                    for (j = 0; j < n; j++) {
                        if (!weighted) {
                            adjMatrix[i][j] = 0;
                        } else {
                            adjMatrix[i][j] = Infinity;
                        }
                    }
                }

                // zeros for diagonal - way from node to itself
                if (weighted) {
                    for (i = 0; i < n; i++) {
                        adjMatrix[i][i] = 0;
                    }
                }

                for (i = n + 1; i < splitted.length; i++) {
                    tmp = splitted[i].split(" ");

                    // weights
                    if (tmp.length > 2) {
                        tmp2 = parseInt(tmp[2], 10);
                        // no weight given
                    } else {
                        tmp2 = 1;
                    }

                    adjMatrix[nodenumbers[tmp[0]]][nodenumbers[tmp[1]]] = tmp2;

                    if (!directed) {
                        adjMatrix[nodenumbers[tmp[1]]][nodenumbers[tmp[0]]] = tmp2;
                    }
                }

                this.board.addedGraph = {
                    n: n,
                    nodes: nodes,
                    adjMatrix: adjMatrix,
                    nodenumbers: nodenumbers,
                    weighted: weighted,
                    directed: directed
                };

                return this.board.addedGraph;
            },

            read: function () {
                var graph,
                    // no directed graphs for now
                    directed = false;

                this.board.suspendUpdate();
                graph = this.parseData(directed);
                this.drawGraph(graph);
                this.board.unsuspendUpdate();
            },

            drawGraph: function (graph) {
                var i, j, s, t, p, x, y,
                    n = graph.n,
                    nodes = graph.nodes,
                    adjMatrix = graph.adjMatrix;

                for (i = 0; i < n; i++) {
                    if (!JXG.exists(nodes[i].coords[0])) {
                        x =
                            (Math.random() * this.board.canvasWidth) /
                                (this.board.unitX * 1.1) -
                            this.board.origin.scrCoords[1] / (this.board.unitX * 1.1);
                    } else {
                        x = nodes[i].coords[0];
                    }

                    if (!JXG.exists(nodes[i].coords[1])) {
                        y =
                            (Math.random() * this.board.canvasHeight) /
                                (this.board.unitY * 1.1) -
                            (this.board.canvasHeight - this.board.origin.scrCoords[2]) /
                                (this.board.unitY * 1.1);
                    } else {
                        y = nodes[i].coords[1];
                    }

                    p = this.board.create("point", [x, y], { name: nodes[i].name });
                    nodes[i].reference = p;
                }

                this.board.addedGraph.segments = [];

                for (i = 0; i < n; i++) {
                    this.board.addedGraph.segments[i] = [];

                    for (j = 0; j < i + 1; j++) {
                        if (i === j) {
                            this.board.addedGraph.segments[i].push(null);
                        } else if (
                            adjMatrix[i][j] < Number.MAX_VALUE &&
                            adjMatrix[i][j] !== 0
                        ) {
                            if (graph.directed) {
                                s = this.board.create("segment", [
                                    nodes[i].name,
                                    nodes[j].name
                                ]);
                                s.setAttribute({ lastArrow: true });

                                if (graph.weighted) {
                                    t = this.board.create("text", [0, 0, adjMatrix[i][j]], {
                                        anchor: s
                                    });
                                    this.board.addedGraph.segments[i].push({
                                        edge: s,
                                        weight: t
                                    });
                                } else {
                                    this.board.addedGraph.segments[i].push({
                                        edge: s,
                                        weight: 1
                                    });
                                }
                            } else {
                                this.board.addedGraph.segments[i][j] =
                                    this.board.addedGraph.segments[j][i];
                            }
                        } else {
                            this.board.addedGraph.segments[i].push(null);
                        }
                    }

                    for (j = i + 1; j < n; j++) {
                        if (adjMatrix[i][j] < Number.MAX_VALUE && adjMatrix[i][j] !== 0) {
                            s = this.board.create("segment", [nodes[i].name, nodes[j].name]);
                            if (graph.directed) {
                                s.setAttribute({ lastArrow: true });
                            }

                            if (graph.weighted) {
                                t = this.board.create("text", [0, 0, adjMatrix[i][j]], {
                                    anchor: s
                                });
                                this.board.addedGraph.segments[i].push({ edge: s, weight: t });
                            } else {
                                this.board.addedGraph.segments[i].push({ edge: s, weight: 1 });
                            }
                        } else {
                            this.board.addedGraph.segments[i].push(null);
                        }
                    }
                }
            }
        }
    );

    JXG.registerReader(JXG.GraphReader, ["txt", "graph", "digraph"]);
})();
