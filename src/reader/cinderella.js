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

/*global JXG:true*/
/*jslint nomen:true, plusplus:true, regexp:true*/

(function () {
    "use strict";

    JXG.CinderellaReader = function (board, str) {
        this.board = board;
        this.data = this.prepareString(str);
    };

    JXG.extend(
        JXG.CinderellaReader.prototype,
        /** @lends JXG.CinderellaReader.prototype */ {
            read: function () {
                var dataLines,
                    i,
                    j,
                    k,
                    pCoords,
                    defName,
                    objName,
                    defPoints,
                    segment,
                    defRadius,
                    circle,
                    erg,
                    poly,
                    point,
                    objName2,
                    erg2,
                    lines,
                    point2,
                    oX,
                    oY,
                    scale,
                    makeRadiusFun = function (el, b) {
                        return function () {
                            return b.select(el[0]).Dist(b.select[1]);
                        };
                    };

                dataLines = this.data.split("\n");

                for (i = 0; i < dataLines.length; i++) {
                    // free point
                    if (dataLines[i].search(/FreePoint.+/) !== -1) {
                        pCoords = dataLines[i].slice(dataLines[i].search(/FreePoint.+/) + 11);
                        pCoords = pCoords.split(",");

                        for (j = 0; j < pCoords.length; j++) {
                            pCoords[j] = pCoords[j].slice(0, pCoords[j].search(/\+i\*/));
                        }

                        objName = dataLines[i].match(/"[A-Za-z]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];

                        this.board.create(
                            "point",
                            [pCoords[0] / pCoords[2], -pCoords[1] / pCoords[2]],
                            {
                                name: objName,
                                size: erg[0][1],
                                fillColor: erg[0][0],
                                strokeColor: erg[2],
                                label: {
                                    strokeColor: erg[3]
                                }
                            }
                        );

                        // line or segment
                    } else if (
                        dataLines[i].search(/Join\(.+/) !== -1 ||
                        dataLines[i].search(/Segment\(.+/) !== -1
                    ) {
                        if (dataLines[i].search(/Join\(.+/) !== -1) {
                            defPoints = dataLines[i].slice(dataLines[i].search(/Join.+/) + 5);
                            segment = false;
                        } else {
                            defPoints = dataLines[i].slice(
                                dataLines[i].search(/Segment.+/) + 8
                            );
                            segment = true;
                        }

                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readLineProperties(dataLines, i);
                        i = erg[2];

                        this.board.create(
                            "line",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                straightFirst: !segment,
                                straightLast: !segment,
                                name: objName,
                                withLabel: true,
                                strokeColor: erg[0][0],
                                strokeWidth: erg[0][2],
                                dash: erg[1]
                            }
                        );

                        // circle, defined by two points
                    } else if (dataLines[i].search(/CircleMP.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/CircleMP.+/) + 9);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        this.board.create(
                            "circle",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // circle, defined by point and fixed radius
                    } else if (
                        dataLines[i].search(/CircleByFixedRadius.+/) !== -1 ||
                        dataLines[i].search(/CircleByRadius.+/) !== -1
                    ) {
                        if (dataLines[i].search(/CircleByFixedRadius.+/) !== -1) {
                            defPoints = dataLines[i].slice(
                                dataLines[i].search(/CircleByFixedRadius.+/) + 20
                            );
                        } else {
                            defPoints = dataLines[i].slice(
                                dataLines[i].search(/CircleByRadius.+/) + 15
                            );
                        }

                        defPoints = defPoints.split(",");
                        defName = defPoints[0].match(/"[A-Za-z0-9]*"/)[0];
                        defName = defName.slice(1, defName.length - 1);
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        defRadius = defPoints[1].slice(0, defPoints[1].search(/\+i\*/));
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        this.board.create(
                            "circle",
                            [this.board.select(defName), Math.sqrt(parseFloat(defRadius))],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // glider on a circle
                    } else if (dataLines[i].search(/PointOnCircle.+/) !== -1) {
                        defPoints = dataLines[i].split(":=");
                        objName = defPoints[0].match(/"[A-Za-z]*"/)[0];
                        objName = objName.slice(1, objName.length - 1);
                        defName = defPoints[1].match(/"[A-Za-z0-9]*"/)[0];
                        defName = defName.slice(1, defName.length - 1);
                        defPoints = defPoints[1].match(/\[.*\]/)[0];
                        defPoints = defPoints.split(",");
                        for (k = 0; k < defPoints.length; k++) {
                            defPoints[k] = defPoints[k].split("+i*");
                        }
                        defPoints[0] = parseFloat(defPoints[0][0].slice(1));
                        defPoints[1] = parseFloat(defPoints[1][0]);

                        if (dataLines[i][1] === "n") {
                            defPoints[0] = -parseFloat(defPoints[0]);
                            defPoints[1] = -parseFloat(defPoints[1]);
                        }

                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];
                        circle = this.board.select(defName);

                        this.board.create(
                            "glider",
                            [
                                circle.center.coords.usrCoords[1] + defPoints[0],
                                circle.center.coords.usrCoords[2] - defPoints[1],
                                circle
                            ],
                            {
                                name: objName,
                                size: erg[0][1],
                                fillColor: erg[0][0],
                                strokeColor: erg[2],
                                label: {
                                    strokeColor: erg[3]
                                }
                            }
                        );

                        // glider on a line
                    } else if (dataLines[i].search(/PointOnLine.+/) !== -1) {
                        defPoints = dataLines[i].split(":=");
                        objName = defPoints[0].match(/"[A-Za-z]*"/)[0];
                        objName = objName.slice(1, objName.length - 1);
                        defName = defPoints[1].match(/"[A-Za-z0-9]*"/)[0];
                        defName = defName.slice(1, defName.length - 1);
                        pCoords = defPoints[1].match(/\[.*\]/)[0];
                        pCoords = pCoords.split(",");
                        pCoords[0] = parseFloat(
                            pCoords[0].slice(1, pCoords[0].search(/\+i\*/))
                        );

                        for (j = 1; j < pCoords.length; j++) {
                            pCoords[j] = parseFloat(
                                pCoords[j].slice(0, pCoords[j].search(/\+i\*/))
                            );
                        }

                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];

                        this.board.create(
                            "glider",
                            [
                                pCoords[0] / pCoords[2],
                                -pCoords[1] / pCoords[2],
                                this.board.select(defName)
                            ],
                            {
                                name: objName,
                                size: erg[0][1],
                                fillColor: erg[0][0],
                                strokeColor: erg[2],
                                label: {
                                    strokeColor: erg[3]
                                }
                            }
                        );

                        // Midpoint
                    } else if (dataLines[i].search(/Mid\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Mid.+/) + 4);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];

                        this.board.create(
                            "midpoint",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                name: objName,
                                size: erg[0][1],
                                fillColor: erg[0][0],
                                strokeColor: erg[2],
                                labelColor: erg[3]
                            }
                        );

                        // Circumcircle
                    } else if (dataLines[i].search(/CircleBy3\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/CircleBy3.+/) + 10);
                        defPoints = defPoints.split(",");
                        defName = [];
                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        circle = this.board.create(
                            "circumcircle",
                            [
                                this.board.select(defName[0]),
                                this.board.select(defName[1]),
                                this.board.select(defName[2])
                            ],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2],
                                center: {
                                    name: "",
                                    visible: false
                                }
                            }
                        );

                        // Parallel
                    } else if (dataLines[i].search(/Parallel\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Parallel.+/) + 9);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readLineProperties(dataLines, i);
                        i = erg[2];

                        this.board.create(
                            "parallel",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                name: objName,
                                withLabel: true,
                                strokeColor: erg[0][0],
                                strokeWidth: erg[0][2],
                                dash: erg[1]
                            }
                        );

                        // normal
                    } else if (dataLines[i].search(/Orthogonal\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Parallel.+/) + 11);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readLineProperties(dataLines, i);
                        i = erg[2];

                        this.board.create(
                            "normal",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                name: objName,
                                withLabel: true,
                                strokeColor: erg[0][0],
                                strokeWidth: erg[0][2],
                                dash: erg[1]
                            }
                        );

                        // conic defined by five points
                    } else if (dataLines[i].search(/ConicBy5\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/ConicBy5.+/) + 9);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        this.board.create(
                            "conic",
                            [
                                this.board.select(defName[0]),
                                this.board.select(defName[1]),
                                this.board.select(defName[2]),
                                this.board.select(defName[3]),
                                this.board.select(defName[4])
                            ],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // ellipse or hyberbola with foci and points on the conic
                    } else if (
                        dataLines[i].search(/ConicFoci\(.+/) !== -1 ||
                        dataLines[i].search(/ConicFociH\(.+/) !== -1
                    ) {
                        defPoints = dataLines[i].split(":=");
                        objName = defPoints[0].match(/"[A-Za-z0-9]*"/)[0];
                        objName = objName.slice(1, objName.length - 1);
                        defName = defPoints[1].match(/"[A-Za-z0-9]*"/g);

                        for (j = 0; j < defName.length; j++) {
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        erg = this.readCircleProperties(dataLines, i);

                        if (dataLines[i].search(/ConicFociH\(.+/) !== -1) {
                            this.board.create(
                                "hyperbola",
                                [
                                    this.board.select(defName[0]),
                                    this.board.select(defName[1]),
                                    this.board.select(defName[2])
                                ],
                                {
                                    name: objName,
                                    strokeColor: erg[0][0],
                                    fillColor: erg[1],
                                    fillOpacity: erg[2],
                                    strokeWidth: erg[0][2]
                                }
                            );
                        } else {
                            this.board.create(
                                "ellipse",
                                [
                                    this.board.select(defName[0]),
                                    this.board.select(defName[1]),
                                    this.board.select(defName[2])
                                ],
                                {
                                    name: objName,
                                    strokeColor: erg[0][0],
                                    fillColor: erg[1],
                                    fillOpacity: erg[2],
                                    strokeWidth: erg[0][2]
                                }
                            );
                        }
                        i = erg[3];

                        // parabola with focus and directrix
                    } else if (dataLines[i].search(/ConicParabolaPL\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(
                            dataLines[i].search(/ConicParabolaPL.+/) + 16
                        );
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        this.board.create(
                            "parabola",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // Polygon
                    } else if (dataLines[i].search(/Poly\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Poly.+/) + 5);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                            defName[j] = this.board.select(defName[j]);
                        }
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        poly = this.board.create("polygon", defName, {
                            name: objName,
                            fillColor: erg[1],
                            fillOpacity: erg[2]
                        });

                        for (j = 0; j < poly.borders.length; j++) {
                            poly.borders[j].setAttribute({
                                strokeColor: erg[0][0],
                                strokeWidth: erg[0][2]
                            });
                        }

                        // Arc
                    } else if (dataLines[i].search(/Arc\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Arc.+/) + 4);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];

                        poly = this.board.create(
                            "circumcirclearc",
                            [
                                this.board.select(defName[0]),
                                this.board.select(defName[1]),
                                this.board.select(defName[2])
                            ],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // line defined by ONE point
                    } else if (dataLines[i].search(/Through\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Through.+/) + 8);
                        defName = defPoints.match(/"[A-Za-z]*"/)[0];
                        defName = defName.slice(1, defName.length - 1);
                        pCoords = defPoints.match(/\[.*\]/)[0];
                        pCoords = pCoords.split(",");
                        pCoords[0] = parseFloat(
                            pCoords[0].slice(1, pCoords[0].search(/\+i\*/))
                        );

                        for (j = 1; j < pCoords.length; j++) {
                            pCoords[j] = parseFloat(
                                pCoords[j].slice(0, pCoords[j].search(/\+i\*/))
                            );
                        }
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);

                        j = this.board.select(defName);
                        point = this.board.create(
                            "point",
                            [
                                j.coords.usrCoords[1] + parseFloat(pCoords[0]),
                                j.coords.usrCoords[2] + parseFloat(pCoords[1])
                            ],
                            { visible: false }
                        );

                        erg = this.readLineProperties(dataLines, i);
                        i = erg[2];

                        this.board.create("line", [j, point], {
                            name: objName,
                            withLabel: true,
                            strokeColor: erg[0][0],
                            strokeWidth: erg[0][2],
                            dash: erg[1]
                        });

                        // circle defined by compass
                    } else if (dataLines[i].search(/:=Compass\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Compass.+/) + 8);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }

                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readCircleProperties(dataLines, i);
                        i = erg[3];
                        defRadius = makeRadiusFun(defName, this.board);

                        this.board.create(
                            "circle",
                            [this.board.select(defName[2]), defRadius],
                            {
                                name: objName,
                                strokeColor: erg[0][0],
                                fillColor: erg[1],
                                fillOpacity: erg[2],
                                strokeWidth: erg[0][2]
                            }
                        );

                        // angular bisector
                    } else if (dataLines[i].search(/AngularBisector\(.+/) !== -1) {
                        defPoints = dataLines[i].split(":=");
                        defPoints[0] = defPoints[0].split(",");

                        if (defPoints[0][0] === "{null") {
                            objName = "";
                        } else {
                            objName = defPoints[0][0].slice(2, defPoints[0][0].length - 1);
                        }

                        if (defPoints[0][1] === "null") {
                            objName2 = "";
                        } else {
                            objName2 = defPoints[0][1].slice(1, defPoints[0][1].length - 1);
                        }

                        defPoints[1] = defPoints[1].match(/"[A-Za-z0-9]*"/g);
                        defName = [];
                        defName[0] = defPoints[1][0].slice(1, defPoints[1][0].length - 1);
                        defName[1] = defPoints[1][1].slice(1, defPoints[1][1].length - 1);
                        erg = this.readLineProperties(dataLines, i);
                        i = erg[2];

                        if (!(objName === "" || objName2 === "")) {
                            erg2 = this.readLineProperties(dataLines, i);
                            i = erg[2];
                        }

                        lines = this.board.create(
                            "bisectorlines",
                            [this.board.select(defName[0]), this.board.select(defName[1])],
                            {
                                line1: {
                                    name: objName2
                                },
                                line2: {
                                    name: objName
                                },
                                withLabel: true
                            }
                        );

                        if (objName === "") {
                            lines.line2.setAttribute({ visible: false });
                            lines.line1.setAttribute({
                                strokeColor: erg[0][0],
                                strokeWidth: erg[0][2],
                                dash: erg[1]
                            });
                        } else {
                            if (objName2 === "") {
                                lines.line1.setAttribute({ visible: false });
                                lines.line2.setAttribute({
                                    strokeColor: erg[0][0],
                                    strokeWidth: erg[0][2],
                                    dash: erg[1]
                                });
                            } else {
                                lines.line1.setAttribute({
                                    strokeColor: erg[0][0],
                                    strokeWidth: erg[0][2],
                                    dash: erg[1]
                                });
                                lines.line2.setAttribute({
                                    strokeColor: erg2[0][0],
                                    strokeWidth: erg2[0][2],
                                    dash: erg2[1]
                                });
                            }
                        }

                        // intersect two lines
                    } else if (dataLines[i].search(/Meet\(.+/) !== -1) {
                        defPoints = dataLines[i].slice(dataLines[i].search(/Meet.+/) + 5);
                        defPoints = defPoints.split(",");
                        defName = [];

                        for (j = 0; j < defPoints.length; j++) {
                            defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                            defName[j] = defName[j].slice(1, defName[j].length - 1);
                        }
                        objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                        objName = objName[0].slice(1, objName[0].length - 1);
                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];

                        this.board.create(
                            "intersection",
                            [this.board.select(defName[0]), this.board.select(defName[1]), 0],
                            {
                                name: objName,
                                size: erg[0][1],
                                fillColor: erg[0][0],
                                strokeColor: erg[2],
                                labelColor: erg[3]
                            }
                        );

                        // intersection circle/line or circle/circle
                    } else if (
                        dataLines[i].search(/IntersectionConicLine\(.+/) !== -1 ||
                        dataLines[i].search(/IntersectionCircleCircle\(.+/) !== -1
                    ) {
                        if (dataLines[i].search(/IntersectionConicLine\(.+/) !== -1) {
                            k = 0;
                            j = 1;
                        } else {
                            k = 1;
                            j = 0;
                        }

                        defPoints = dataLines[i].split(":=");
                        defPoints[0] = defPoints[0].split(",");

                        if (defPoints[0][0] === "{null") {
                            objName = "";
                        } else {
                            objName = defPoints[0][0].slice(2, defPoints[0][0].length - 1);
                        }

                        if (defPoints[0][1] === "null") {
                            objName2 = "";
                        } else {
                            objName2 = defPoints[0][1].slice(1, defPoints[0][1].length - 1);
                        }

                        defPoints[1] = defPoints[1].match(/"[A-Za-z0-9]*"/g);
                        defName = [];
                        defName[0] = defPoints[1][0].slice(1, defPoints[1][0].length - 1);
                        defName[1] = defPoints[1][1].slice(1, defPoints[1][1].length - 1);
                        erg = this.readPointProperties(dataLines, i);
                        i = erg[1];

                        if (!(objName === "" || objName2 === "")) {
                            erg2 = this.readPointProperties(dataLines, i);
                            i = erg[1];
                        }

                        if (objName2 !== "") {
                            point = this.board.create(
                                "intersection",
                                [
                                    this.board.select(defName[0]),
                                    this.board.select(defName[1]),
                                    j
                                ],
                                {
                                    name: objName2,
                                    size: erg[0][1],
                                    fillColor: erg[0][0],
                                    strokeColor: erg[2],
                                    label: {
                                        strokeColor: erg[3]
                                    }
                                }
                            );

                            if (objName !== "") {
                                point2 = this.board.create(
                                    "otherintersection",
                                    [
                                        this.board.select(defName[0]),
                                        this.board.select(defName[1]),
                                        point
                                    ],
                                    {
                                        name: objName,
                                        size: erg2[0][1],
                                        fillColor: erg2[0][0],
                                        strokeColor: erg2[2],
                                        label: {
                                            strokeColor: erg2[3]
                                        }
                                    }
                                );
                            }
                        } else {
                            point = this.board.create(
                                "intersection",
                                [
                                    this.board.select(defName[0]),
                                    this.board.select(defName[1]),
                                    k
                                ],
                                {
                                    name: objName,
                                    size: erg[0][1],
                                    fillColor: erg[0][0],
                                    strokeColor: erg[2],
                                    label: {
                                        strokeColor: erg[3]
                                    }
                                }
                            );
                        }
                    } else if (dataLines[i].search(/setOriginX\(([0-9.]*)\)/) !== -1) {
                        oX = RegExp.$1;
                    } else if (dataLines[i].search(/setOriginY\(([0-9.]*)\)/) !== -1) {
                        oY = RegExp.$1;
                    } else if (dataLines[i].search(/setScale\(([0-9.]*)\)/) !== -1) {
                        scale = parseFloat(RegExp.$1 / 25);
                    }
                }

                this.board.zoomX *= scale / 2.4;
                this.board.zoomY *= scale / 2.4;
                oX = this.board.origin.scrCoords[1] * this.board.attr.zoom.factorx;
                oY = this.board.origin.scrCoords[2] * this.board.attr.zoom.factory;
                this.board.origin = new JXG.Coords(
                    JXG.COORDS_BY_SCREEN,
                    [oX - 150, oY + 50],
                    this.board
                );
                this.board.applyZoom();

                return this.board;
            },

            calculateColor: function (colNr) {
                colNr = parseInt(colNr, 10);

                switch (colNr) {
                    case 0:
                        return "white";
                    case 1:
                        return "black";
                    case 2:
                        return "red";
                    case 3:
                        return "blue";
                    case 4:
                        return "green";
                    case 5:
                        return "yellow";
                    case 6:
                        return "#ffafaf";
                    case 7:
                        return "cyan";
                    case 8:
                        return "#ffc800";
                    case 9:
                        return "#199e4e";
                    case 10:
                        return "#b75500";
                    case 11:
                        return "#7700b7";
                    case 12:
                        return "#ff7f00";
                    case 13:
                        return "#03a7bc";
                    case 14:
                        return "#c10000";
                    case 15:
                        return "#808080";
                    case 16:
                        return "#ff4a4a";
                    case 17:
                        return "#faff9e";
                    case 18:
                        return "#b6ffaa";
                    case 19:
                        return "#82f2ff";
                    case 20:
                        return "#d4a3ff";
                    case 21:
                        return "#ffbd77";
                }

                return "black";
            },

            readPointProperties: function (dataLines, i) {
                var objAppearance, border, labelcolor;

                do {
                    i += 1;
                } while (dataLines[i].search(/setAppearance/) === -1);

                objAppearance = dataLines[i].match(/\([A-Za-z,0-9\.]*\)/)[0];
                objAppearance = objAppearance.slice(1, objAppearance.length - 1).split(",");
                objAppearance[0] = this.calculateColor(objAppearance[0]);

                do {
                    i += 1;
                } while (dataLines[i].search(/pointborder/) === -1);

                if (dataLines[i].search(/false/) !== -1) {
                    border = "none";
                    labelcolor = objAppearance[0];
                } else {
                    border = "black";
                    labelcolor = "black";
                }

                return [objAppearance, i, border, labelcolor];
            },

            readCircleProperties: function (dataLines, i) {
                var objAppearance, filling, fillop;

                do {
                    i += 1;
                } while (dataLines[i].search(/setAppearance/) === -1);

                objAppearance = dataLines[i].match(/\([A-Za-z,0-9\.]*\)/)[0];
                objAppearance = objAppearance.slice(1, objAppearance.length - 1).split(",");
                objAppearance[0] = this.calculateColor(objAppearance[0]);

                do {
                    i += 1;
                } while (dataLines[i].search(/colorfill/) === -1);

                filling = dataLines[i].match(/"[0-9]*"/)[0];
                filling = filling.slice(1, filling.length - 1);
                filling = this.calculateColor(filling);

                do {
                    i += 1;
                } while (dataLines[i].search(/visibilityfill|fillalpha/) === -1);

                fillop = dataLines[i].match(/"[0-9\.]*"/)[0];
                fillop = fillop.slice(1, fillop.length - 1);

                if (dataLines[i].match(/visibilityfill/)) {
                    fillop = parseFloat(fillop) / 10;
                } else {
                    fillop = parseFloat(fillop);
                }

                return [objAppearance, filling, fillop, i];
            },

            readLineProperties: function (dataLines, i) {
                var objAppearance, dashing;

                do {
                    i += 1;
                } while (dataLines[i].search(/setAppearance/) === -1);

                objAppearance = dataLines[i].match(/\([A-Za-z,0-9\.]*\)/)[0];
                objAppearance = objAppearance.slice(1, objAppearance.length - 1).split(",");
                objAppearance[0] = this.calculateColor(objAppearance[0]);

                do {
                    i += 1;
                } while (dataLines[i].search(/linedashing/) === -1);

                if (dataLines[i].search(/false/) !== -1) {
                    dashing = 0;
                } else {
                    dashing = 3;
                }

                return [objAppearance, dashing, i];
            },

            prepareString: function (fileStr, isString) {
                var i,
                    len,
                    bA = [];

                // if isString is true, str is the base64 encoded zip file, otherwise it's just the zip file
                if (isString) {
                    fileStr = JXG.Util.Base64.decode(fileStr);
                }

                if (fileStr.indexOf("<") !== 0) {
                    len = fileStr.length;

                    for (i = 0; i < len; i++) {
                        bA[i] = JXG.Util.UTF8.asciiCharCodeAt(fileStr, i);
                    }

                    // Unzip
                    fileStr = new JXG.Util.Unzip(bA).unzip()[0][0];
                }
                return fileStr;
            }
        }
    );

    JXG.registerReader(JXG.CinderellaReader, ["cdy", "cindy", "cinderella"]);
})();
