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

    JXG.IntergeoReader = function (board, str) {
        var xmlStr;

        this.board = board;
        xmlStr = this.prepareString(str);
        this.tree = JXG.XML.parse(xmlStr);
    };

    JXG.extend(
        JXG.IntergeoReader.prototype,
        /** @lends JXG.IntergeoReader.prototype */ {
            /**
             * this.objects holds all objects from the XML file.
             * Every object gets an attribute "exists"
             */
            objects: {},

            read: function () {
                this.board.origin = {};
                this.board.origin.usrCoords = [1, 0, 0];
                this.board.origin.scrCoords = [1, 400, 300];
                this.board.unitX = 30;
                this.board.unitY = 30;

                this.readElements(this.tree.getElementsByTagName("elements"));
                this.readConstraints(this.tree.getElementsByTagName("constraints"));
                this.cleanUp();
                this.board.fullUpdate();
                this.readDisplay(this.tree.getElementsByTagName("display"));
                this.board.fullUpdate();
            },

            readElement: function (tree, s) {
                var node;

                node = tree[0].childNodes[s];

                if (node.nodeType > 1) {
                    // not an element node
                    return;
                }

                if (node.nodeName === "point") {
                    this.storePoint(node);
                } else if (
                    node.nodeName === "line" ||
                    node.nodeName === "line_segment" ||
                    node.nodeName === "ray" ||
                    node.nodeName === "vector"
                ) {
                    this.storeLine(node);
                } else if (node.nodeName === "circle") {
                    this.storeConic(node);
                } else if (node.nodeName === "conic") {
                    this.storeConic(node);
                    //} else if (node.nodeName === 'polygon') {
                    // ignore, see this.addPolygonByVertices
                } else {
                    JXG.debug(
                        "Not implemented: " + node.nodeName + " " + node.getAttribute("id")
                    );
                }
            },

            /**
             * Element part
             */
            readElements: function (tree) {
                var s;

                for (s = 0; s < tree[0].childNodes.length; s++) {
                    this.readElement(tree, s);
                }
            },

            /**
             * Points are created instantly via create
             */
            storePoint: function (node) {
                var i = 0,
                    j = 0,
                    l = 0,
                    p = node.childNodes[i],
                    c = [],
                    parents = [];

                // skip non element nodes
                while (p.nodeType > 1) {
                    i += 1;
                    p = node.childNodes[i];
                }

                if (p.nodeName === "homogeneous_coordinates") {
                    for (j = 0; j < p.childNodes.length; j++) {
                        if (p.childNodes[j].nodeType === 1) {
                            if (p.childNodes[j].nodeName === "double") {
                                // content of <double>...</double>
                                c.push(p.childNodes[j].firstChild.data);
                            } else if (p.childNodes[j].nodeName === "complex") {
                                for (l = 0; l < p.childNodes[j].childNodes.length; l++) {
                                    if (p.childNodes[j].childNodes[l].nodeName === "double") {
                                        c.push(p.childNodes[j].childNodes[l].firstChild.data);
                                    }
                                }
                            } else {
                                // <complex>
                                JXG.debug("Not implemented: " + p.childNodes[j].nodeName);
                                return;
                            }
                        }
                    }
                    for (j = 0; j < c.length; j++) {
                        c[j] = parseFloat(c[j]);
                    }

                    // Real
                    if (c.length === 3) {
                        parents = [c[2], c[0], c[1]];
                        // complex, but real
                    } else if (
                        c.length === 6 &&
                        Math.abs(c[1]) < 1e-10 &&
                        Math.abs(c[3]) < 1e-10 &&
                        Math.abs(c[5]) < 1e-10
                    ) {
                        parents = [c[4], c[0], c[2]];
                    } else {
                        // <complex>
                        JXG.debug("type not supported, yet");
                        return;
                    }
                    // the latter one is a workaround for faulty i2g construction exported by DynaGeo
                } else if (
                    p.nodeName === "euclidean_coordinates" ||
                    p.nodeName === "euclidian_coordinates"
                ) {
                    for (j = 0; j < p.childNodes.length; j++) {
                        if (p.childNodes[j].nodeType === 1) {
                            // content of <double>...</double>
                            c.push(p.childNodes[j].firstChild.data);
                        }
                    }
                    for (j = 0; j < c.length; j++) {
                        c[j] = parseFloat(c[j]);
                    }
                    parents = [c[0], c[1]];
                } else if (p.nodeName === "polar_coordinates") {
                    for (j = 0; j < p.childNodes.length; j++) {
                        if (p.childNodes[j].nodeType === 1) {
                            // content of <double>...</double>
                            c.push(p.childNodes[j].firstChild.data);
                        }
                    }
                    for (j = 0; j < c.length; j++) {
                        c[j] = parseFloat(c[j]);
                    }
                    parents = [c[0] * Math.cos(c[1]), c[0] * Math.sin(c[1])];
                } else {
                    JXG.debug("This coordinate type is not yet implemented: " + p.nodeName);
                    return;
                }

                this.objects[node.getAttribute("id")] = {
                    id: node.getAttribute("id"),
                    coords: null
                };
                this.objects[node.getAttribute("id")].coords = parents;
                this.objects[node.getAttribute("id")].id = node.getAttribute("id");
                this.objects[node.getAttribute("id")].exists = false;
                this.objects[node.getAttribute("id")].i2geoType = "point";
            },

            /**
             * Line data is stored in an array
             * for further access during the reading of constraints.
             * There, id and name are needed.
             */
            storeLine: function (node) {
                var i, p, c, j;

                this.objects[node.getAttribute("id")] = {
                    id: node.getAttribute("id"),
                    coords: null
                };
                i = 0;
                p = node.childNodes[i];

                // skip non element nodes
                while (p.nodeType > 1) {
                    i += 1;
                    p = node.childNodes[i];
                }

                if (p.nodeName === "homogeneous_coordinates") {
                    c = [];
                    for (j = 0; j < p.childNodes.length; j++) {
                        if (p.childNodes[j].nodeType === 1) {
                            if (p.childNodes[j].nodeName === "double") {
                                // content of <double>...</double>
                                c.push(parseFloat(p.childNodes[j].firstChild.data));
                            }
                            // else {
                            //    $('debug').innerHTML += 'Not: '+ p.childNodes[j].nodeName + '<br>';  // <complex>
                            //}
                        }
                    }
                    this.objects[node.getAttribute("id")].coords = c;
                    this.objects[node.getAttribute("id")].id = node.getAttribute("id");
                    this.objects[node.getAttribute("id")].exists = false;
                    this.objects[node.getAttribute("id")].i2geoType = "line";
                }
            },

            /**
             * Circle / conic data is stored in an array
             * for further access during the reading of constraints.
             * There, id and name are needed.
             * Concretely, the circle   (x-1)^2 + (y-3)^2 = 4   has matrix
             * (  1  0 -1 )
             * (  0  1 -3 )
             * ( -1 -3  6 )
             *
             * In general
             * Ax^2+Bxy+Cy^2+Dx+Ey+F = 0
             * is stored as
             * (  A   B/2  D/2 )
             * (  B/2  C   E/2 )
             * (  D/2 E/2  F )
             *
             *  Mx = D/A
             *  My = E/C
             *  r = A*Mx^2+B*My^2-F
             */
            storeConic: function (node) {
                var i, j, p, c;

                this.objects[node.getAttribute("id")] = {
                    id: node.getAttribute("id"),
                    coords: null
                };
                i = 0;
                p = node.childNodes[i];

                // skip non element nodes
                while (p.nodeType > 1) {
                    i += 1;
                    p = node.childNodes[i];
                }

                if (p.nodeName === "matrix") {
                    c = [];

                    for (j = 0; j < p.childNodes.length; j++) {
                        if (p.childNodes[j].nodeType === 1) {
                            if (p.childNodes[j].nodeName === "double") {
                                // content of <double>...</double>
                                c.push(parseFloat(p.childNodes[j].firstChild.data));
                            }
                            //else {
                            //    $('debug').innerHTML += 'Not: '+ p.childNodes[j].nodeName + '<br>';  // <complex>
                            //}
                        }
                    }
                    this.objects[node.getAttribute("id")].coords = c;
                    this.objects[node.getAttribute("id")].id = node.getAttribute("id");
                    this.objects[node.getAttribute("id")].exists = false;
                    this.objects[node.getAttribute("id")].i2geoType = "conic";
                }
            },

            /**
             * Constraint part
             */
            readConstraint: function (tree, s) {
                var param, node;

                node = tree[0].childNodes[s];

                // not an element node
                if (node.nodeType > 1) {
                    return;
                }

                if (node.nodeName === "line_through_two_points") {
                    this.addLineThroughTwoPoints(node, false);
                } else if (node.nodeName === "ray_from_point_through_point") {
                    this.addLineThroughTwoPoints(node, true);
                } else if (node.nodeName === "line_through_point") {
                    this.addLineThroughPoint(node);
                } else if (node.nodeName === "line_parallel_to_line_through_point") {
                    this.addLineParallelToLineThroughPoint(node, false);
                } else if (node.nodeName === "ray_from_point_and_vector") {
                    this.addLineParallelToLineThroughPoint(node, true);
                } else if (node.nodeName === "line_perpendicular_to_line_through_point") {
                    this.addLinePerpendicularToLineThroughPoint(node);
                } else if (node.nodeName === "line_segment_by_points") {
                    this.addLineSegmentByTwoPoints(node);
                } else if (node.nodeName === "vector_from_point_to_point") {
                    this.addVectorFromPointToPoint(node);
                } else if (node.nodeName === "endpoints_of_line_segment") {
                    this.addEndpointsOfLineSegment(node);
                } else if (node.nodeName === "free_line") {
                    this.addFreeLine(node);
                } else if (node.nodeName === "point_on_line") {
                    this.addPointOnLine(node);
                } else if (node.nodeName === "point_on_line_segment") {
                    this.addPointOnLine(node);
                } else if (node.nodeName === "point_on_circle") {
                    this.addPointOnCircle(node);
                } else if (node.nodeName === "angular_bisector_of_three_points") {
                    this.addAngularBisectorOfThreePoints(node, false);
                } else if (node.nodeName === "angular_bisectors_of_two_lines") {
                    this.addAngularBisectorsOfTwoLines(node);
                } else if (node.nodeName === "line_angular_bisector_of_three_points") {
                    this.addAngularBisectorOfThreePoints(node, true);
                } else if (node.nodeName === "line_angular_bisectors_of_two_lines") {
                    this.addAngularBisectorsOfTwoLines(node);
                } else if (node.nodeName === "midpoint_of_two_points") {
                    this.addMidpointOfTwoPoints(node);
                } else if (node.nodeName === "midpoint") {
                    this.addMidpointOfTwoPoints(node);
                } else if (
                    node.nodeName === "midpoint_of_line_segment" ||
                    node.nodeName === "midpoint_line_segment"
                ) {
                    this.addMidpointOfLineSegment(node);
                } else if (node.nodeName === "point_intersection_of_two_lines") {
                    this.addPointIntersectionOfTwoLines(node);
                } else if (node.nodeName === "locus_defined_by_point") {
                    this.addLocusDefinedByPoint(node);
                } else if (node.nodeName === "locus_defined_by_point_on_line") {
                    this.addLocusDefinedByPointOnLine(node);
                } else if (node.nodeName === "locus_defined_by_point_on_line_segment") {
                    this.addLocusDefinedByPointOnLine(node);
                } else if (node.nodeName === "locus_defined_by_line_through_point") {
                    this.addLocusDefinedByLineThroughPoint(node);
                } else if (node.nodeName === "locus_defined_by_point_on_circle") {
                    this.addLocusDefinedByPointOnCircle(node);
                } else if (node.nodeName === "circle_by_three_points") {
                    this.addCircleByThreePoints(node);
                } else if (node.nodeName === "circle_by_center_and_point") {
                    this.addCircleByCenterAndPoint(node);
                } else if (node.nodeName === "center_of_circle") {
                    this.addCenterOfCircle(node);
                } else if (node.nodeName === "intersection_points_of_two_circles") {
                    this.addIntersectionPointsOfTwoCircles(node);
                } else if (node.nodeName === "intersection_points_of_circle_and_line") {
                    this.addIntersectionPointsOfCircleAndLine(node);
                } else if (node.nodeName === "other_intersection_point_of_two_circles") {
                    this.addOtherIntersectionPointOfTwoCircles(node);
                } else if (node.nodeName === "other_intersection_point_of_circle_and_line") {
                    this.addOtherIntersectionPointOfCircleAndLine(node);
                } else if (node.nodeName === "circle_tangent_lines_by_point") {
                    this.addCircleTangentLinesByPoint(node);
                } else if (node.nodeName === "polygon_by_vertices") {
                    this.addPolygonByVertices(node);
                    //} else if (node.nodeName === 'free_point') {
                    // do nothing
                } else {
                    param = this.readParams(node);
                    JXG.debug(
                        "readConstraints: not implemented: " + node.nodeName + ": " + param[0]
                    );
                }
            },

            readConstraints: function (tree) {
                var s;

                // Set the default colors of dependent elements
                this.board.options.point.strokeColor = "blue";
                this.board.options.point.fillColor = "blue";

                for (s = 0; s < tree[0].childNodes.length; s++) {
                    this.readConstraint(tree, s);
                }
            },

            setAttributes: function (o) {
                o.setAttribute({
                    strokecolor: this.board.options.point.strokeColor,
                    fillColor: this.board.options.point.fillColor
                });
            },

            readParams: function (node) {
                var j,
                    param = [];

                for (j = 0; j < node.childNodes.length; j++) {
                    if (node.childNodes[j].nodeType === 1) {
                        param.push(node.childNodes[j].firstChild.data);
                    }
                }

                return param;
            },

            addPoint: function (p) {
                if (!p.exists) {
                    p.exists = true;
                    p = this.board.create("point", p.coords, { name: p.id });
                    p.setAttribute({ strokecolor: "red", fillColor: "red" });
                }

                return p;
            },

            /**
             * Direct construction of a line
             * in read elements
             */
            addLine: function (id) {
                var j,
                    c = this.objects[id].coords,
                    el;

                for (j = 0; j < c.length; j++) {
                    c[j] = parseFloat(c[j]);
                }
                el = this.board.create("line", [c[2], c[0], c[1]], {
                    name: id,
                    strokeColor: "black",
                    withLabel: true
                });
                this.objects[id] = el;
            },

            addConic: function (p) {
                var c;

                if (!p.exists) {
                    c = p.coords;
                    // (a_00,a_11,a_22,a_01,a_12,a_22)
                    p = this.board.create("conic", [c[0], c[4], c[8], c[1], c[5], c[2]], {
                        name: p.id
                    });
                    p.exists = true;
                }

                return p;
            },

            cleanUp: function () {
                var p;

                for (p in this.objects) {
                    if (this.objects.hasOwnProperty(p)) {
                        if (this.objects[p].exists === false) {
                            if (this.objects[p].i2geoType === "point") {
                                this.addPoint(this.objects[p]);
                            } else if (this.objects[p].i2geoType === "line") {
                                this.addLine(this.objects[p]);
                            } else if (this.objects[p].i2geoType === "conic") {
                                this.addConic(this.objects[p]);
                            } else {
                                JXG.debug(
                                    "forgotten: " +
                                        this.objects[p].id +
                                        " of type " +
                                        this.objects[p].i2geoType
                                );
                            }
                        }
                    }
                }
            },

            addLineThroughTwoPoints: function (node, isRay) {
                var el1,
                    el2,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el = this.board.create("line", [el1.id, el2.id], {
                    name: param[0],
                    withLabel: true,
                    straightFirst: !isRay,
                    straightLast: true
                });
                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addLineThroughPoint: function (node) {
                var param = this.readParams(node),
                    j,
                    c = this.objects[param[0]].coords,
                    p = this.addPoint(this.objects[param[1]]),
                    el;

                for (j = 0; j < c.length; j++) {
                    c[j] = parseFloat(c[j]);
                }

                el = this.board.create(
                    "line",
                    [
                        function () {
                            return c[2] - c[0] * p.X() - c[1] * p.Y() - c[2] * p.Z();
                        },
                        c[0],
                        c[1]
                    ],
                    { name: param[0], strokeColor: "black", withLabel: true }
                );

                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addLineParallelToLineThroughPoint: function (node, isRay) {
                var el1,
                    el2,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el = this.board.create("parallel", [el1.id, el2.id], {
                    name: param[0],
                    withLabel: true,
                    straightFirst: !isRay,
                    straightLast: true
                });

                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addLinePerpendicularToLineThroughPoint: function (node) {
                var el1,
                    el2,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el = this.board.create("perpendicular", [el1.id, el2.id], {
                    name: param[0],
                    id: param[0],
                    straightFirst: true,
                    straightLast: true,
                    point: {
                        name: param[0] + "foot",
                        id: param[0] + "foot"
                    },
                    withLabel: true
                });
                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addLineSegmentByTwoPoints: function (node) {
                var el1,
                    el2,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el = this.board.create("line", [el1.id, el2.id], {
                    name: param[0],
                    straightFirst: false,
                    straightLast: false,
                    strokeColor: "black",
                    withLabel: true
                });
                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addPointIntersectionOfTwoLines: function (node) {
                var param = this.readParams(node),
                    l1 = this.objects[param[1]],
                    l2 = this.objects[param[2]];

                this.objects[param[0]] = this.board.create("intersection", [l1, l2, 0], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                this.setAttributes(this.objects[param[0]]);
                this.objects[param[0]].exists = true;
            },

            addFreeLine: function (node) {
                var param = this.readParams(node),
                    a = this.objects[param[0]].coords[0],
                    b = this.objects[param[0]].coords[1],
                    c = this.objects[param[0]].coords[2];

                this.objects[param[0]] = this.board.create("line", [c, a, b], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                this.objects[param[0]].exists = true;
            },

            addPointOnLine: function (node) {
                var param = this.readParams(node),
                    l = this.board.select(param[1]);

                this.board.create("glider", [0, 0, l], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                this.objects[param[0]].exists = true;
            },

            addPointOnCircle: function (node) {
                var param = this.readParams(node),
                    c = this.board.select(param[1]);

                c.update();
                this.board.create(
                    "glider",
                    [this.objects[param[0]].coords[1], this.objects[param[0]].coords[2], c],
                    {
                        name: param[0],
                        id: param[0],
                        withLabel: true
                    }
                );

                this.objects[param[0]].exists = true;
            },

            addEndpointsOfLineSegment: function (node) {
                var param = this.readParams(node),
                    line = this.objects[param[2]],
                    p = this.addPoint(this.objects[param[0]]),
                    q = this.addPoint(this.objects[param[1]]);

                p.addConstraint([
                    function () {
                        return line.point1.Z();
                    },
                    function () {
                        return line.point1.X();
                    },
                    function () {
                        return line.point1.Y();
                    }
                ]);

                q.addConstraint([
                    function () {
                        return line.point2.Z();
                    },
                    function () {
                        return line.point2.X();
                    },
                    function () {
                        return line.point2.Y();
                    }
                ]);

                this.setAttributes(p);
                this.setAttributes(q);
            },

            addAngularBisectorOfThreePoints: function (node, isLine) {
                var el1,
                    el2,
                    el3,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el3 = this.addPoint(this.objects[param[3]]);

                el = this.board.create("bisector", [el1.id, el2.id, el3.id], {
                    name: param[0],
                    id: param[0],
                    withLabel: true,
                    straightFirst: isLine,
                    straightLast: true,
                    strokeColor: "#000000"
                });

                this.objects[param[0]] = el;
                this.objects[param[0]].exists = true;
            },

            addMidpointOfTwoPoints: function (node) {
                var el1,
                    el2,
                    el,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);

                el = this.board.create("midpoint", [el1.id, el2.id], {
                    name: param[0]
                });

                this.setAttributes(el);
                this.objects[param[0]].exists = true;
            },

            addMidpointOfLineSegment: function (node) {
                var param = this.readParams(node),
                    l = this.board.select(param[1]),
                    el = this.board.create("midpoint", [l.point1, l.point2], {
                        name: param[0]
                    });

                this.setAttributes(el);
                this.objects[param[0]].exists = true;
            },

            addCircleByThreePoints: function (node) {
                var i,
                    param = this.readParams(node),
                    p = [];

                for (i = 0; i < 3; i++) {
                    p[i] = this.addPoint(this.objects[param[i + 1]]);
                }

                this.board.create("circumcircle", p, {
                    name: param[0],
                    id: param[0],
                    point: {
                        name: param[0] + "c",
                        id: param[0] + "c"
                    },
                    withLabel: true
                });
                this.objects[param[0]].exists = true;
            },

            addCenterOfCircle: function (node) {
                var param = this.readParams(node),
                    c = this.board.select(param[1]),
                    el = this.board.create(
                        "point",
                        [
                            function () {
                                return c.center.X();
                            },
                            function () {
                                return c.center.Y();
                            }
                        ],
                        { name: param[0], id: param[0], withLabel: true }
                    );

                this.setAttributes(el);
                this.objects[param[0]].exists = true;
            },

            addCircleTangentLinesByPoint: function (node) {
                var polar,
                    i1,
                    i2,
                    t1,
                    t2,
                    param = this.readParams(node),
                    c = this.board.select(param[2]),
                    p = this.addPoint(this.objects[param[3]]);

                polar = this.board.create(
                    "line",
                    [
                        function () {
                            return JXG.Math.matVecMult(c.quadraticform, p.coords.usrCoords)[0];
                        },
                        function () {
                            return JXG.Math.matVecMult(c.quadraticform, p.coords.usrCoords)[1];
                        },
                        function () {
                            return JXG.Math.matVecMult(c.quadraticform, p.coords.usrCoords)[2];
                        }
                    ],
                    { visible: false }
                );

                i1 = this.board.create("intersection", [c, polar, 0], {
                    visible: false
                });
                i2 = this.board.create("intersection", [c, polar, 1], {
                    visible: false
                });
                t1 = this.board.create("tangent", [i1, c]);
                t2 = this.board.create("tangent", [i2, c]);

                this.objects[param[0]] = t1;
                this.objects[param[1]] = t2;
                this.objects[param[0]].exists = true;
                this.objects[param[1]].exists = true;
            },

            addIntersectionPointsOfTwoCircles: function (node) {
                var p1,
                    p2,
                    param = this.readParams(node),
                    c1 = this.board.select(param[2]),
                    c2 = this.board.select(param[3]);

                p1 = this.board.create("intersection", [c1, c2, 0], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                p2 = this.board.create("intersection", [c1, c2, 1], {
                    name: param[1],
                    id: param[1],
                    withLabel: true
                });
                this.setAttributes(p1);
                this.setAttributes(p2);
                this.objects[param[0]].exists = true;
                this.objects[param[1]].exists = true;
            },

            addIntersectionPointsOfCircleAndLine: function (node) {
                var p1,
                    p2,
                    param = this.readParams(node),
                    c1 = this.board.select(param[2]),
                    c2 = this.board.select(param[3]);

                p1 = this.board.create("intersection", [c1, c2, 0], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                p2 = this.board.create("intersection", [c1, c2, 1], {
                    name: param[1],
                    id: param[1],
                    withLabel: true
                });
                this.setAttributes(p1);
                this.setAttributes(p2);
                this.objects[param[0]].exists = true;
                this.objects[param[1]].exists = true;
            },

            addCircleByCenterAndPoint: function (node) {
                var param = this.readParams(node),
                    el1 = this.addPoint(this.objects[param[1]]),
                    el2 = this.addPoint(this.objects[param[2]]);

                this.board.create("circle", [el1.id, el2.id], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });

                this.objects[param[0]].exists = true;
            },

            addOtherIntersectionPointOfTwoCircles: function (node) {
                var param = this.readParams(node),
                    c1 = this.board.select(param[2]),
                    c2 = this.board.select(param[3]),
                    p1 = this.board.select(param[1]), // Should exist by now
                    p2;

                p2 = this.board.create("otherintersection", [c1, c2, p1], {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                this.setAttributes(p2);
                this.objects[param[0]].exists = true;
            },

            addOtherIntersectionPointOfCircleAndLine: function (node) {
                this.addOtherIntersectionPointOfTwoCircles(node);
            },

            /**
             * The angular bisectors of two line [c1,a1,b1] and [c2,a2,b2] are determined by the equation:
             * (a1*x+b1*y+c1*z)/sqrt(a1^2+b1^2) = +/- (a2*x+b2*y+c2*z)/sqrt(a2^2+b2^2)
             */
            addAngularBisectorsOfTwoLines: function (node) {
                var param = this.readParams(node),
                    l1 = this.objects[param[2]],
                    l2 = this.objects[param[3]];

                this.board.create("bisectorlines", [l1, l2], {
                    line1: {
                        name: param[0],
                        id: param[0],
                        straightFirst: true,
                        straightLast: true
                    },
                    line2: {
                        name: param[1],
                        id: param[1],
                        straightFirst: true,
                        straightLast: true
                    },
                    withLabel: true
                });

                this.objects[param[0]].exists = true;
                this.objects[param[1]].exists = true;
            },

            addPolygonByVertices: function (node) {
                var j,
                    n,
                    param2 = [],
                    p = [],
                    param = this.readParams(node);

                for (j = 0; j < node.childNodes.length; j++) {
                    if (node.childNodes[j].nodeType === 1) {
                        if (node.childNodes[j].nodeName === "list_of_vertices") {
                            n = node.childNodes[j];
                            param2 = this.readParams(n);
                            break;
                        }
                    }
                }
                for (j = 0; j < param2.length; j++) {
                    p.push(this.addPoint(this.objects[param2[j]]));
                }

                this.board.create("polygon", p, {
                    name: param[0],
                    id: param[0],
                    withLabel: true
                });
                this.objects[param[0]].exists = true;
            },

            addVectorFromPointToPoint: function (node) {
                var el,
                    el1,
                    el2,
                    param = this.readParams(node);

                el1 = this.addPoint(this.objects[param[1]]);
                el2 = this.addPoint(this.objects[param[2]]);
                el = this.board.create("arrow", [el1.id, el2.id], { name: param[0] });
                this.setAttributes(el);
                this.objects[param[0]].exists = true;
            },

            // ----------------------------------------------------------------------------------------------------

            addLocusDefinedByPoint: function (node) {
                var param = this.readParams(node),
                    el = this.board.select(param[1]);

                el.setAttribute({ trace: true });
                this.objects[param[1]] = el;
                this.setAttributes(el);
            },

            addLocusDefinedByPointOnLine: function (node) {
                var param = this.readParams(node),
                    el = this.board.select(param[1]);

                el.setAttribute({ trace: true });
                this.objects[param[1]] = el;
                this.setAttributes(el);
            },

            addLocusDefinedByLineThroughPoint: function (node) {
                var param = this.readParams(node),
                    el = this.board.select(param[1]);

                el.setAttribute({ trace: true });
                this.objects[param[1]] = el;
                this.setAttributes(el);
            },

            addLocusDefinedByPointOnCircle: function (node) {
                var param = this.readParams(node),
                    el = this.board.select(param[1]);

                el.setAttribute({ trace: true });
                this.objects[param[1]] = el;
                this.setAttributes(el);
            },

            /**
             * Extract the xml-code as String from the zipped Intergeo archive.
             * @param {String} fileStr
             * @returns {String} xml code
             */
            prepareString: function (fileStr) {
                var i,
                    bA = [],
                    isZip = false;

                if (
                    fileStr.slice(0, 2) === "PK" ||
                    JXG.Util.UTF8.asciiCharCodeAt(fileStr.slice(0, 1), 0) === 31
                ) {
                    isZip = true;
                }

                // It's not a zip file but it doesn't start with '<' either -> base64!
                if (!isZip && fileStr.indexOf("<") !== 0) {
                    fileStr = JXG.Util.Base64.decode(fileStr);
                }

                if (fileStr.indexOf("<") !== 0) {
                    //binary = false;
                    for (i = 0; i < fileStr.length; i++) {
                        bA[i] = JXG.Util.UTF8.asciiCharCodeAt(fileStr, i);
                    }

                    fileStr = new JXG.Util.Unzip(bA).unzipFile("construction/intergeo.xml");
                    // Extract "construction/intergeo.xml" from
                    // the zip-archive in bA.
                }

                return fileStr;
            },

            /**
             * Displpay part
             */

            readDisplayProperty: function (tree, s) {
                var j,
                    node,
                    el,
                    prop = {},
                    key,
                    val;

                node = tree[0].childNodes[s];

                // not an element node
                if (node.nodeType > 1) {
                    return;
                }

                if (node.nodeName === "background-color") {
                    this.board.containerObj.style.backgroundColor = node.firstChild.data;
                } else if (node.nodeName === "style") {
                    // get the element
                    el = this.board.select(node.getAttribute("ref"));

                    for (j = 0; j < node.childNodes.length; j++) {
                        if (node.childNodes[j].nodeType === 1) {
                            key = node.childNodes[j].nodeName;
                            val = node.childNodes[j].firstChild.data;
                            if (key === "stroke") {
                                key = "strokeColor";
                            } else if (key === "stroke-width" || key === "border-width") {
                                key = "strokeWidth";
                            } else if (key === "fill") {
                                key = "fillColor";
                            } else if (key === "fill-opacity") {
                                key = "fillOpacity";
                            } else if (key === "border-opacity") {
                                key = "strokeOpacity";
                            } else if (key === "point-size") {
                                key = "size";
                            } else if (key === "label") {
                                key = "name";
                            } else if (key === "point-style") {
                                key = "face";
                                if (val === "circle") {
                                    val = "o";
                                } else if (val === "cross") {
                                    val = "+";
                                } else if (val === "x-mark") {
                                    val = "x";
                                } else if (val === "square") {
                                    val = "[]";
                                } else if (val === "triangle") {
                                    val = "triangleup";
                                } else if (val === "point") {
                                    // Setting size to 1 is missing
                                    val = "o";
                                } else {
                                    JXG.debug("Display: not implemented" + node.nodeName);
                                    // Missing:
                                    // circumference, image
                                }
                            }
                            prop[key] = val;
                        }
                    }
                    el.setAttribute(prop);
                } else {
                    JXG.debug("Display: not implemented" + node.nodeName);
                }
            },

            readDisplay: function (tree) {
                var s;

                if (!JXG.exists(tree) || !JXG.isArray(tree)) {
                    return;
                }

                for (s = 0; s < tree[0].childNodes.length; s++) {
                    this.readDisplayProperty(tree, s);
                }
            }
        }
    );

    JXG.registerReader(JXG.IntergeoReader, ["i2g", "xml", "intergeo"]);
})();
