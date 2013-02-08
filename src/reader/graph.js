/*
    Copyright 2008-2013
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 JXG
 utils/type
  elements:
   point
   segment
   text
 */

(function () {

    "use strict";

    JXG.GraphReader = {
        parseData: function (board, directed) {
            var splitted, n, nodes = [], adjMatrix = [], i, j, tmp, nodenumbers = {}, tmp2, weighted = false,
                boundingBox;

            splitted = this.data.split('\n');
            // remove whitespaces
            for (i = 0; i < splitted.length; i++) {
                splitted[i] = splitted[i].replace(/^\s+/, '').replace(/\s+$/, '');
            }

            // first line: bounding box
            boundingBox = splitted[0].split(' ');
            for (i = 0; i < boundingBox.length; i++) {
                boundingBox[i] = parseInt(boundingBox[i], 10);
            }

            board.setBoundingBox(boundingBox, true);
            splitted.shift();

            // second line: number of nodes
            n = parseInt(splitted[0], 10);

            // nodes
            for (i = 1; i <= n; i++) {
                if (splitted[i].search(/ /) > -1) {
                    tmp = splitted[i].split(' ');
                    nodes.push({name: tmp[0], coords: [parseInt(tmp[1], 10), parseInt(tmp[2], 10)]});
                    nodenumbers[tmp[0]] = i - 1;
                    // no pre-defined coordinates
                } else {
                    tmp = splitted[i];
                    nodes.push({name: tmp, coords: [null, null]});
                    nodenumbers[tmp] = i - 1;
                }
            }

            // edges
            // check whether the graph is weighted or not
            for (i = n + 1; i < splitted.length; i++) {
                tmp = splitted[i].split(' ');
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
                tmp = splitted[i].split(' ');

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

            board.addedGraph = {
                n: n,
                nodes: nodes,
                adjMatrix: adjMatrix,
                nodenumbers: nodenumbers,
                weighted: weighted,
                directed: directed
            };

            return board.addedGraph;
        },

        prepareString: function (str) {
            return str;
        },

        read: function (fileStr, board, directed) {
            var graph;
            this.data = fileStr;
            board.suspendUpdate();
            graph = this.parseData(board, directed);
            this.drawGraph(graph, board);
            board.unsuspendUpdate();
        },

        readGraph: JXG.shortcut(JXG.GraphReader, 'read'),

        drawGraph: function (graph, board) {
            var i, j, s, t, p, x, y,
                n = graph.n,
                nodes = graph.nodes,
                adjMatrix = graph.adjMatrix;

            for (i = 0; i < n; i++) {
                if (!JXG.exists(nodes[i].coords[0])) {
                    x = Math.random() * board.canvasWidth / (board.unitX * 1.1) - board.origin.scrCoords[1] / (board.unitX * 1.1);
                } else {
                    x = nodes[i].coords[0];
                }

                if (!JXG.exists(nodes[i].coords[1])) {
                    y = Math.random() * board.canvasHeight / (board.unitY * 1.1) - (board.canvasHeight - board.origin.scrCoords[2]) / (board.unitY * 1.1);
                } else {
                    y = nodes[i].coords[1];
                }

                p = board.create('point', [x, y], {name: nodes[i].name});
                nodes[i].reference = p;
            }

            board.addedGraph.segments = [];

            for (i = 0; i < n; i++) {
                board.addedGraph.segments[i] = [];

                for (j = 0; j < i + 1; j++) {
                    if (i === j) {
                        board.addedGraph.segments[i].push(null);
                    } else if (adjMatrix[i][j] < Number.MAX_VALUE && adjMatrix[i][j] !== 0) {
                        if (graph.directed) {
                            s = board.create('segment', [nodes[i].name, nodes[j].name]);
                            s.setProperty({lastArrow: true});

                            if (graph.weighted) {
                                t = board.create('text', [0, 0, adjMatrix[i][j]], {anchor: s});
                                board.addedGraph.segments[i].push({edge: s, weight: t});
                            } else {
                                board.addedGraph.segments[i].push({edge: s, weight: 1});
                            }
                        } else {
                            board.addedGraph.segments[i][j] = board.addedGraph.segments[j][i];
                        }
                    } else {
                        board.addedGraph.segments[i].push(null);
                    }
                }

                for (j = i + 1; j < n; j++) {
                    if (adjMatrix[i][j] < Number.MAX_VALUE && adjMatrix[i][j] !== 0) {
                        s = board.create('segment', [nodes[i].name, nodes[j].name]);
                        if (graph.directed) {
                            s.setProperty({lastArrow: true});
                        }

                        if (graph.weighted) {
                            t = board.create('text', [0, 0, adjMatrix[i][j]], {anchor: s});
                            board.addedGraph.segments[i].push({edge: s, weight: t});
                        } else {
                            board.addedGraph.segments[i].push({edge: s, weight: 1});
                        }
                    } else {
                        board.addedGraph.segments[i].push(null);
                    }
                }
            }
        }
    };

    JXG.registerReader(JXG.GraphReader, ['txt', 'graph']);
}());