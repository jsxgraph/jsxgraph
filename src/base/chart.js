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

/*global JXG: true, define: true, document: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";
import Numerics from "../math/numerics.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import GeometryElement from "./element.js";
import DataSource from "../parser/datasource.js";
import Color from "../utils/color.js";
import Type from "../utils/type.js";
import Env from "../utils/env.js";
// import Statistics from "../math/statistics.js";
// import Curve from "./curve.js";
// import Point from "./point.js";
// import Text from "./text.js";
// import Polygon from "./polygon.js";
// import Sector from "../element/sector.js";
// import Transform from "./transformation.js";
// import Line from "./line.js";
// import Circle from "./circle.js";

/**
 *
 * The Chart class is a basic class for the chart object.
 * @class Creates a new basic chart object. Do not use this constructor to create a chart.
 * Use {@link JXG.Board#create} with type {@link Chart} instead.
 * @constructor
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new chart is drawn on.
 * @param {Array} parent data arrays for the chart
 * @param {Object} attributes Javascript object containing attributes like name, id and colors.
 *
 */
JXG.Chart = function (board, parents, attributes) {
    this.constructor(board, attributes);

    var x, y, i, c, style, len;

    if (!Type.isArray(parents) || parents.length === 0) {
        throw new Error("JSXGraph: Can't create a chart without data");
    }

    /**
     * Contains pointers to the various subelements of the chart.
     */
    this.elements = [];

    if (Type.isNumber(parents[0])) {
        // parents looks like [a,b,c,..]
        // x has to be filled

        y = parents;
        x = [];
        for (i = 0; i < y.length; i++) {
            x[i] = i + 1;
        }
    } else if (parents.length === 1 && Type.isArray(parents[0])) {
        // parents looks like [[a,b,c,..]]
        // x has to be filled

        y = parents[0];
        x = [];

        len = Type.evaluate(y).length;
        for (i = 0; i < len; i++) {
            x[i] = i + 1;
        }
    } else if (parents.length === 2) {
        // parents looks like [[x0,x1,x2,...],[y1,y2,y3,...]]
        len = Math.min(parents[0].length, parents[1].length);
        x = parents[0].slice(0, len);
        y = parents[1].slice(0, len);
    }

    if (Type.isArray(y) && y.length === 0) {
        throw new Error("JSXGraph: Can't create charts without data.");
    }

    // does this really need to be done here? this should be done in createChart and then
    // there should be an extra chart for each chartstyle
    style = attributes.chartstyle.replace(/ /g, "").split(",");
    for (i = 0; i < style.length; i++) {
        switch (style[i]) {
            case "bar":
                c = this.drawBar(board, x, y, attributes);
                break;
            case "line":
                c = this.drawLine(board, x, y, attributes);
                break;
            case "fit":
                c = this.drawFit(board, x, y, attributes);
                break;
            case "spline":
                c = this.drawSpline(board, x, y, attributes);
                break;
            case "pie":
                c = this.drawPie(board, y, attributes);
                break;
            case "point":
                c = this.drawPoints(board, x, y, attributes);
                break;
            case "radar":
                c = this.drawRadar(board, parents, attributes);
                break;
        }
        this.elements.push(c);
    }
    this.id = this.board.setId(this, 'Chart');

    return this.elements;
};

JXG.Chart.prototype = new GeometryElement();

JXG.extend(
    JXG.Chart.prototype,
    /** @lends JXG.Chart.prototype */ {
        /**
         * Create line chart defined by two data arrays.
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} x          Array of x-coordinates
         * @param  {Array} y          Array of y-coordinates
         * @param  {Object} attributes  Javascript object containing attributes like colors
         * @returns {JXG.Curve}       JSXGraph curve
         */
        drawLine: function (board, x, y, attributes) {
            // we don't want the line chart to be filled
            attributes.fillcolor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create("curve", [x, y], attributes);
        },

        /**
         * Create line chart that consists of a natural spline curve
         * defined by two data arrays.
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} x          Array of x-coordinates
         * @param  {Array} y          Array of y-coordinates
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {JXG.Curve}       JSXGraph (natural) spline curve
         */
        drawSpline: function (board, x, y, attributes) {
            // we don't want the spline chart to be filled
            attributes.fillColor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create("spline", [x, y], attributes);
        },

        /**
         * Create line chart where the curve is given by a regression polynomial
         * defined by two data arrays. The degree of the polynomial is supplied
         * through the attribute "degree" in attributes.
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} x          Array of x-coordinates
         * @param  {Array} y          Array of y-coordinates
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {JXG.Curve}    JSXGraph function graph object
         */
        drawFit: function (board, x, y, attributes) {
            var deg = attributes.degree;

            deg = Math.max(parseInt(deg, 10), 1) || 1;

            // never fill
            attributes.fillcolor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create(
                "functiongraph",
                [Numerics.regressionPolynomial(deg, x, y)],
                attributes
            );
        },

        /**
         * Create bar chart defined by two data arrays.
         * Attributes to change the layout of the bar chart are:
         * <ul>
         * <li> width (optional)
         * <li> dir: 'horizontal' or 'vertical'
         * <li> colors: array of colors
         * <li> labels: array of labels
         * </ul>
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} x          Array of x-coordinates
         * @param  {Array} y          Array of y-coordinates
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {Array}    Array of JXG polygons defining the bars
         */
        drawBar: function (board, x, y, attributes) {
            var i, text, w,
                xp0, xp1, xp2, yp,
                colors,
                pols = [],
                p = [],
                attr,
                attrSub,
                makeXpFun = function (i, f) {
                    return function () {
                        return x[i]() - f * w;
                    };
                },
                hiddenPoint = {
                    fixed: true,
                    withLabel: false,
                    visible: false,
                    name: ""
                };

            attr = Type.copyAttributes(attributes, board.options, 'chart');

            // Determine the width of the bars
            if (attr && attr.width) {
                // width given
                w = attr.width;
            } else {
                if (x.length <= 1) {
                    w = 1;
                } else {
                    // Find minimum distance between to bars.
                    w = x[1] - x[0];
                    for (i = 1; i < x.length - 1; i++) {
                        w = x[i + 1] - x[i] < w ? x[i + 1] - x[i] : w;
                    }
                }
                w *= 0.8;
            }

            attrSub = Type.copyAttributes(attributes, board.options, "chart", 'label');

            for (i = 0; i < x.length; i++) {
                if (Type.isFunction(x[i])) {
                    xp0 = makeXpFun(i, -0.5);
                    xp1 = makeXpFun(i, 0);
                    xp2 = makeXpFun(i, 0.5);
                } else {
                    xp0 = x[i] - w * 0.5;
                    xp1 = x[i];
                    xp2 = x[i] + w * 0.5;
                }
                if (Type.isFunction(y[i])) {
                    yp = y[i]();
                } else {
                    yp = y[i];
                }
                yp = y[i];

                if (attr.dir === 'horizontal') {
                    // horizontal bars
                    p[0] = board.create("point", [0, xp0], hiddenPoint);
                    p[1] = board.create("point", [yp, xp0], hiddenPoint);
                    p[2] = board.create("point", [yp, xp2], hiddenPoint);
                    p[3] = board.create("point", [0, xp2], hiddenPoint);

                    if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                        attrSub.anchorX = function (self) {
                            return self.X() >= 0 ? "left" : 'right';
                        };
                        attrSub.anchorY = 'middle';
                        text = board.create("text", [yp, xp1, attr.labels[i]], attrSub);
                    }
                } else {
                    // vertical bars
                    p[0] = board.create("point", [xp0, 0], hiddenPoint);
                    p[1] = board.create("point", [xp0, yp], hiddenPoint);
                    p[2] = board.create("point", [xp2, yp], hiddenPoint);
                    p[3] = board.create("point", [xp2, 0], hiddenPoint);

                    if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                        attrSub.anchorX = 'middle';
                        attrSub.anchorY = function (self) {
                            return self.Y() >= 0 ? "bottom" : 'top';
                        };
                        text = board.create("text", [xp1, yp, attr.labels[i]], attrSub);
                    }
                }

                if (Type.isArray(attr.colors)) {
                    colors = attr.colors;
                    attr.fillcolor = colors[i % colors.length];
                }

                pols[i] = board.create("polygon", p, attr);
                if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                    pols[i].text = text;
                    pols[i].addChild(text);
                }
            }

            return pols;
        },

        /**
         * Create chart consisting of JSXGraph points.
         * Attributes to change the layout of the point chart are:
         * <ul>
         * <li> fixed (Boolean)
         * <li> infoboxArray (Array): Texts for the infobox
         * </ul>
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} x          Array of x-coordinates
         * @param  {Array} y          Array of y-coordinates
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {Array} Array of JSXGraph points
         */
        drawPoints: function (board, x, y, attributes) {
            var i,
                points = [],
                infoboxArray = attributes.infoboxarray;

            attributes.fixed = true;
            attributes.name = "";

            for (i = 0; i < x.length; i++) {
                attributes.infoboxtext = infoboxArray
                    ? infoboxArray[i % infoboxArray.length]
                    : false;
                points[i] = board.create("point", [x[i], y[i]], attributes);
            }

            return points;
        },

        /**
         * Create pie chart.
         * Attributes to change the layout of the pie chart are:
         * <ul>
         * <li> labels: array of labels
         * <li> colors: (Array)
         * <li> highlightColors (Array)
         * <li> radius
         * <li> center (coordinate array)
         * <li> highlightOnSector (Boolean)
         * </ul>
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} y          Array of x-coordinates
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {Object}  with keys: "{sectors, points, midpoint}"
         */
        drawPie: function (board, y, attributes) {
            var i,
                center,
                p = [],
                sector = [],
                // s = Statistics.sum(y),
                colorArray = attributes.colors,
                highlightColorArray = attributes.highlightcolors,
                labelArray = attributes.labels,
                r = attributes.radius || 4,
                radius = r,
                cent = attributes.center || [0, 0],
                xc = cent[0],
                yc = cent[1],
                makeRadPointFun = function (j, fun, xc) {
                    return function () {
                        var s,
                            i,
                            rad,
                            t = 0;

                        for (i = 0; i <= j; i++) {
                            t += parseFloat(Type.evaluate(y[i]));
                        }

                        s = t;
                        for (i = j + 1; i < y.length; i++) {
                            s += parseFloat(Type.evaluate(y[i]));
                        }
                        rad = s !== 0 ? (2 * Math.PI * t) / s : 0;

                        return radius() * Math[fun](rad) + xc;
                    };
                },
                highlightHandleLabel = function (f, s) {
                    var dx = -this.point1.coords.usrCoords[1] + this.point2.coords.usrCoords[1],
                        dy = -this.point1.coords.usrCoords[2] + this.point2.coords.usrCoords[2];

                    if (Type.exists(this.label)) {
                        this.label.rendNode.style.fontSize =
                            s * this.label.evalVisProp('fontsize') + 'px';
                        this.label.fullUpdate();
                    }

                    this.point2.coords = new Coords(
                        Const.COORDS_BY_USER,
                        [
                            this.point1.coords.usrCoords[1] + dx * f,
                            this.point1.coords.usrCoords[2] + dy * f
                        ],
                        this.board
                    );
                    this.fullUpdate();
                },
                highlightFun = function () {
                    if (!this.highlighted) {
                        this.highlighted = true;
                        this.board.highlightedObjects[this.id] = this;
                        this.board.renderer.highlight(this);

                        highlightHandleLabel.call(this, 1.1, 2);
                    }
                },
                noHighlightFun = function () {
                    if (this.highlighted) {
                        this.highlighted = false;
                        this.board.renderer.noHighlight(this);

                        highlightHandleLabel.call(this, 0.9090909, 1);
                    }
                },
                hiddenPoint = {
                    fixed: true,
                    withLabel: false,
                    visible: false,
                    name: ""
                };

            if (!Type.isArray(labelArray)) {
                labelArray = [];
                for (i = 0; i < y.length; i++) {
                    labelArray[i] = "";
                }
            }

            if (!Type.isFunction(r)) {
                radius = function () {
                    return r;
                };
            }

            attributes.highlightonsector = attributes.highlightonsector || false;
            attributes.straightfirst = false;
            attributes.straightlast = false;

            center = board.create("point", [xc, yc], hiddenPoint);
            p[0] = board.create(
                "point",
                [
                    function () {
                        return radius() + xc;
                    },
                    function () {
                        return yc;
                    }
                ],
                hiddenPoint
            );

            for (i = 0; i < y.length; i++) {
                p[i + 1] = board.create(
                    "point",
                    [makeRadPointFun(i, "cos", xc), makeRadPointFun(i, "sin", yc)],
                    hiddenPoint
                );

                attributes.name = labelArray[i];
                attributes.withlabel = attributes.name !== "";
                attributes.fillcolor = colorArray && colorArray[i % colorArray.length];
                attributes.labelcolor = colorArray && colorArray[i % colorArray.length];
                attributes.highlightfillcolor =
                    highlightColorArray && highlightColorArray[i % highlightColorArray.length];

                sector[i] = board.create("sector", [center, p[i], p[i + 1]], attributes);

                if (attributes.highlightonsector) {
                    // overwrite hasPoint so that the whole sector is used for highlighting
                    sector[i].hasPoint = sector[i].hasPointSector;
                }
                if (attributes.highlightbysize) {
                    sector[i].highlight = highlightFun;

                    sector[i].noHighlight = noHighlightFun;
                }
            }

            // Not enough! We need points, but this gives an error in setAttribute.
            return { sectors: sector, points: p, midpoint: center };
        },

        /**
         * Create radar chart.
         * Attributes to change the layout of the pie chart are:
         * <ul>
         * <li> paramArray: labels for axes, [ paramx, paramy, paramz ]
         * <li> startShiftRatio: 0 <= offset from chart center <=1
         * <li> endShiftRatio:  0 <= offset from chart radius <=1
         * <li> startShiftArray: Adjust offsets per each axis
         * <li> endShiftArray: Adjust offsets per each axis
         * <li> startArray: Values for inner circle. Default values: minimums
         * <li> start: one value to overwrite all startArray values
         * <li> endArray: Values for outer circle, maximums by default
         * <li> end: one value to overwrite all endArray values
         * <li> labelArray
         * <li> polyStrokeWidth
         * <li> colors
         * <li> highlightcolors
         * <li> labelArray: [ row1, row2, row3 ]
         * <li> radius
         * <li> legendPosition
         * <li> showCircles
         * <li> circleLabelArray
         * <li> circleStrokeWidth
         * </ul>
         *
         * @param  {String|JXG.Board} board      The board the chart is drawn on
         * @param  {Array} parents    Array of coordinates, e.g. [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]]
         * @param  {Object} attributes Javascript object containing attributes like colors
         * @returns {Object} with keys "{circles, lines, points, midpoint, polygons}"
         */
        drawRadar: function (board, parents, attributes) {
            var i,
                j,
                paramArray,
                numofparams,
                maxes,
                mins,
                la,
                pdata,
                ssa,
                esa,
                ssratio,
                esratio,
                sshifts,
                eshifts,
                starts,
                ends,
                labelArray,
                colorArray,
                // highlightColorArray,
                radius,
                myAtts,
                cent,
                xc,
                yc,
                center,
                start_angle,
                rad,
                p,
                line,
                t,
                xcoord,
                ycoord,
                polygons,
                legend_position,
                circles,
                lxoff,
                lyoff,
                cla,
                clabelArray,
                ncircles,
                pcircles,
                angle,
                dr,
                sw,
                data,
                len = parents.length,
                get_anchor = function () {
                    var x1, x2, y1, y2,
                        relCoords = this.evalVisProp('label.offset).slice(0');

                    x1 = this.point1.X();
                    x2 = this.point2.X();
                    y1 = this.point1.Y();
                    y2 = this.point2.Y();
                    if (x2 < x1) {
                        relCoords[0] = -relCoords[0];
                    }

                    if (y2 < y1) {
                        relCoords[1] = -relCoords[1];
                    }

                    this.setLabelRelativeCoords(relCoords);

                    return new Coords(
                        Const.COORDS_BY_USER,
                        [this.point2.X(), this.point2.Y()],
                        this.board
                    );
                },
                get_transform = function (angle, i) {
                    var t, tscale, trot;

                    t = board.create("transform", [-(starts[i] - sshifts[i]), 0], {
                        type: "translate"
                    });
                    tscale = board.create(
                        "transform",
                        [radius / (ends[i] + eshifts[i] - (starts[i] - sshifts[i])), 1],
                        { type: "scale" }
                    );
                    t.melt(tscale);
                    trot = board.create("transform", [angle], { type: "rotate" });
                    t.melt(trot);

                    return t;
                };

            if (len <= 0) {
                throw new Error("JSXGraph radar chart: no data");
            }
            // labels for axes
            paramArray = attributes.paramarray;
            if (!Type.exists(paramArray)) {
                throw new Error("JSXGraph radar chart: need paramArray attribute");
            }
            numofparams = paramArray.length;
            if (numofparams <= 1) {
                throw new Error("JSXGraph radar chart: need more than one param in paramArray");
            }

            for (i = 0; i < len; i++) {
                if (numofparams !== parents[i].length) {
                    throw new Error(
                        "JSXGraph radar chart: use data length equal to number of params (" +
                            parents[i].length +
                            " != " +
                            numofparams +
                            ")"
                    );
                }
            }

            maxes = [];
            mins = [];

            for (j = 0; j < numofparams; j++) {
                maxes[j] = parents[0][j];
                mins[j] = maxes[j];
            }

            for (i = 1; i < len; i++) {
                for (j = 0; j < numofparams; j++) {
                    if (parents[i][j] > maxes[j]) {
                        maxes[j] = parents[i][j];
                    }

                    if (parents[i][j] < mins[j]) {
                        mins[j] = parents[i][j];
                    }
                }
            }

            la = [];
            pdata = [];

            for (i = 0; i < len; i++) {
                la[i] = "";
                pdata[i] = [];
            }

            ssa = [];
            esa = [];

            // 0 <= Offset from chart center <=1
            ssratio = attributes.startshiftratio || 0;
            // 0 <= Offset from chart radius <=1
            esratio = attributes.endshiftratio || 0;

            for (i = 0; i < numofparams; i++) {
                ssa[i] = (maxes[i] - mins[i]) * ssratio;
                esa[i] = (maxes[i] - mins[i]) * esratio;
            }

            // Adjust offsets per each axis
            sshifts = attributes.startshiftarray || ssa;
            eshifts = attributes.endshiftarray || esa;
            // Values for inner circle, minimums by default
            starts = attributes.startarray || mins;

            if (Type.exists(attributes.start)) {
                for (i = 0; i < numofparams; i++) {
                    starts[i] = attributes.start;
                }
            }

            // Values for outer circle, maximums by default
            ends = attributes.endarray || maxes;
            if (Type.exists(attributes.end)) {
                for (i = 0; i < numofparams; i++) {
                    ends[i] = attributes.end;
                }
            }

            if (sshifts.length !== numofparams) {
                throw new Error(
                    "JSXGraph radar chart: start shifts length is not equal to number of parameters"
                );
            }

            if (eshifts.length !== numofparams) {
                throw new Error(
                    "JSXGraph radar chart: end shifts length is not equal to number of parameters"
                );
            }

            if (starts.length !== numofparams) {
                throw new Error(
                    "JSXGraph radar chart: starts length is not equal to number of parameters"
                );
            }

            if (ends.length !== numofparams) {
                throw new Error(
                    "JSXGraph radar chart: snds length is not equal to number of parameters"
                );
            }

            // labels for legend
            labelArray = attributes.labelarray || la;
            colorArray = attributes.colors;
            // highlightColorArray = attributes.highlightcolors;
            radius = attributes.radius || 10;
            sw = attributes.strokewidth || 1;

            if (!Type.exists(attributes.highlightonsector)) {
                attributes.highlightonsector = false;
            }

            myAtts = {
                name: attributes.name,
                id: attributes.id,
                strokewidth: sw,
                polystrokewidth: attributes.polystrokewidth || sw,
                strokecolor: attributes.strokecolor || "black",
                straightfirst: false,
                straightlast: false,
                fillcolor: attributes.fillColor || "#FFFF88",
                fillopacity: attributes.fillOpacity || 0.4,
                highlightfillcolor: attributes.highlightFillColor || "#FF7400",
                highlightstrokecolor: attributes.highlightStrokeColor || "black",
                gradient: attributes.gradient || "none"
            };

            cent = attributes.center || [0, 0];
            xc = cent[0];
            yc = cent[1];
            center = board.create("point", [xc, yc], {
                name: "",
                fixed: true,
                withlabel: false,
                visible: false
            });
            start_angle = Math.PI / 2 - Math.PI / numofparams;
            start_angle = attributes.startangle || 0;
            rad = start_angle;
            p = [];
            line = [];

            for (i = 0; i < numofparams; i++) {
                rad += (2 * Math.PI) / numofparams;
                xcoord = radius * Math.cos(rad) + xc;
                ycoord = radius * Math.sin(rad) + yc;

                p[i] = board.create("point", [xcoord, ycoord], {
                    name: "",
                    fixed: true,
                    withlabel: false,
                    visible: false
                });
                line[i] = board.create("line", [center, p[i]], {
                    name: paramArray[i],
                    strokeColor: myAtts.strokecolor,
                    strokeWidth: myAtts.strokewidth,
                    strokeOpacity: 1.0,
                    straightFirst: false,
                    straightLast: false,
                    withLabel: true,
                    highlightStrokeColor: myAtts.highlightstrokecolor
                });
                line[i].getLabelAnchor = get_anchor;
                t = get_transform(rad, i);

                for (j = 0; j < parents.length; j++) {
                    data = parents[j][i];
                    pdata[j][i] = board.create("point", [data, 0], {
                        name: "",
                        fixed: true,
                        withlabel: false,
                        visible: false
                    });
                    pdata[j][i].addTransform(pdata[j][i], t);
                }
            }

            polygons = [];
            for (i = 0; i < len; i++) {
                myAtts.labelcolor = colorArray && colorArray[i % colorArray.length];
                myAtts.strokecolor = colorArray && colorArray[i % colorArray.length];
                myAtts.fillcolor = colorArray && colorArray[i % colorArray.length];
                polygons[i] = board.create("polygon", pdata[i], {
                    withLines: true,
                    withLabel: false,
                    fillColor: myAtts.fillcolor,
                    fillOpacity: myAtts.fillopacity,
                    highlightFillColor: myAtts.highlightfillcolor
                });

                for (j = 0; j < numofparams; j++) {
                    polygons[i].borders[j].setAttribute(
                        "strokecolor:" + colorArray[i % colorArray.length]
                    );
                    polygons[i].borders[j].setAttribute(
                        "strokewidth:" + myAtts.polystrokewidth
                    );
                }
            }

            legend_position = attributes.legendposition || 'none';
            switch (legend_position) {
                case "right":
                    lxoff = attributes.legendleftoffset || 2;
                    lyoff = attributes.legendtopoffset || 1;

                    this.legend = board.create(
                        "legend",
                        [xc + radius + lxoff, yc + radius - lyoff],
                        {
                            labels: labelArray,
                            colors: colorArray
                        }
                    );
                    break;
                case "none":
                    break;
                default:
                    JXG.debug("Unknown legend position");
            }

            circles = [];
            if (attributes.showcircles) {
                cla = [];
                for (i = 0; i < 6; i++) {
                    cla[i] = 20 * i;
                }
                cla[0] = '0';
                clabelArray = attributes.circlelabelarray || cla;
                ncircles = clabelArray.length;

                if (ncircles < 2) {
                    throw new Error(
                        "JSXGraph radar chart: too less circles in circleLabelArray"
                    );
                }

                pcircles = [];
                angle = start_angle + Math.PI / numofparams;
                t = get_transform(angle, 0);

                myAtts.fillcolor = 'none';
                myAtts.highlightfillcolor = 'none';
                myAtts.strokecolor = attributes.strokecolor || 'black';
                myAtts.strokewidth = attributes.circlestrokewidth || 0.5;
                myAtts.layer = 0;

                // we have ncircles-1 intervals between ncircles circles
                dr = (ends[0] - starts[0]) / (ncircles - 1);

                for (i = 0; i < ncircles; i++) {
                    pcircles[i] = board.create("point", [starts[0] + i * dr, 0], {
                        name: clabelArray[i],
                        size: 0,
                        fixed: true,
                        withLabel: true,
                        visible: true
                    });
                    pcircles[i].addTransform(pcircles[i], t);
                    circles[i] = board.create("circle", [center, pcircles[i]], myAtts);
                }
            }
            this.rendNode = polygons[0].rendNode;
            return {
                circles: circles,
                lines: line,
                points: pdata,
                midpoint: center,
                polygons: polygons
            };
        },

        /**
         * Uses the boards renderer to update the chart.
         * @private
         */
        updateRenderer: function () {
            return this;
        },

        // documented in base/element
        update: function () {
            if (this.needsUpdate) {
                this.updateDataArray();
            }

            return this;
        },

        /**
         * Template for dynamic charts update.
         * This method is used to compute new entries
         * for the arrays this.dataX and
         * this.dataY. It is used in update.
         * Default is an empty method, can be overwritten
         * by the user.
         *
         * @returns {JXG.Chart} Reference to this chart object.
         */
        updateDataArray: function () {
            return this;
        }
    }
);

/**
 * @class Various types of charts for data visualization.
 * @pseudo
 * @name Chart
 * @augments JXG.Chart
 * @constructor
 * @type JXG.Chart
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array} x Array of x-coordinates (default case, see below for alternatives)
 * @param {Array} y Array of y-coordinates (default case, see below for alternatives)
 * <p>
 * The parent array may be of one of the following forms:
 * <ol>
 * <li> Parents array looks like [number, number, number, ...]. It is interpreted as array of y-coordinates.
 * The x coordinates are automatically set to [1, 2, ...]
 * <li> Parents array looks like [[number, number, number, ...]]. The content is interpreted as array of y-coordinates.
 * The x coordinates are automatically set to [1, 2, ...]x coordinates are automatically set to [1, 2, ...]
 * Default case: [[x0,x1,x2,...],[y1,y2,y3,...]]
 * </ol>
 *
 * The attribute value for the key 'chartStyle' determines the type(s) of the chart. 'chartStyle' is a comma
 * separated list of strings of the possible chart types
 * 'bar', 'fit', 'line',  'pie', 'point', 'radar', 'spline'.
 *
 * @see JXG.Chart#drawBar
 * @see JXG.Chart#drawFit
 * @see JXG.Chart#drawLine
 * @see JXG.Chart#drawPie
 * @see JXG.Chart#drawPoints
 * @see JXG.Chart#drawRadar
 * @see JXG.Chart#drawSpline
 *
 * @example
 *   board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox:[-0.5,8,9,-2],axis:true});
 *
 *   var f = [4, 2, -1, 3, 6, 7, 2];
 *   var chart = board.create('chart', f,
 *                 {chartStyle:'bar',
 *                  width:0.8,
 *                  labels:f,
 *                  colorArray:['#8E1B77','#BE1679','#DC1765','#DA2130','#DB311B','#DF4917','#E36317','#E87F1A',
 *                              '#F1B112','#FCF302','#C1E212'],
 *                  label: {fontSize:30, display:'internal', anchorX:'left', rotate:90}
 *             });
 *
 * </pre><div id="JXG1528c395-9fa4-4210-ada6-7fc5652ed920" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1528c395-9fa4-4210-ada6-7fc5652ed920',
 *             {boundingbox: [-0.5,8,9,-2], axis: true, showcopyright: false, shownavigation: false});
 *                 var f = [4,2,-1,3,6,7,2];
 *                 var chart = board.create('chart', f,
 *                     {chartStyle:'bar',
 *                      width:0.8,
 *                      labels:f,
 *                      colorArray:['#8E1B77','#BE1679','#DC1765','#DA2130','#DB311B','#DF4917','#E36317','#E87F1A',
 *                                  '#F1B112','#FCF302','#C1E212'],
 *                      label: {fontSize:30, display:'internal', anchorX:'left', rotate:90}
 *                 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *   board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-1, 9, 13, -3], axis:true});
 *
 *   var s = board.create('slider', [[4,7],[8,7],[1,1,1.5]], {name:'S', strokeColor:'black', fillColor:'white'});
 *   var f = [function(){return (s.Value()*4.5).toFixed(2);},
 *                      function(){return (s.Value()*(-1)).toFixed(2);},
 *                      function(){return (s.Value()*3).toFixed(2);},
 *                      function(){return (s.Value()*2).toFixed(2);},
 *                      function(){return (s.Value()*(-0.5)).toFixed(2);},
 *                      function(){return (s.Value()*5.5).toFixed(2);},
 *                      function(){return (s.Value()*2.5).toFixed(2);},
 *                      function(){return (s.Value()*(-0.75)).toFixed(2);},
 *                      function(){return (s.Value()*3.5).toFixed(2);},
 *                      function(){return (s.Value()*2).toFixed(2);},
 *                      function(){return (s.Value()*(-1.25)).toFixed(2);}
 *                      ];
 *   var chart = board.create('chart', [f],
 *                                             {chartStyle:'bar',width:0.8,labels:f,
 *                                              colorArray:['#8E1B77','#BE1679','#DC1765','#DA2130','#DB311B','#DF4917','#E36317','#E87F1A',
 *                                                          '#F1B112','#FCF302','#C1E212']});
 *
 *   var dataArr = [4,1,3,2,5,6.5,1.5,2,0.5,1.5,-1];
 *   var chart2 = board.create('chart', dataArr, {chartStyle:'line,point'});
 *   chart2[0].setAttribute('strokeColor:black','strokeWidth:2pt');
 *   for(var i=0; i<11;i++) {
 *            chart2[1][i].setAttribute({strokeColor:'black',fillColor:'white',face:'[]', size:4, strokeWidth:'2pt'});
 *   }
 *   board.unsuspendUpdate();
 *
 * </pre><div id="JXG22deb158-48c6-41c3-8157-b88b4b968a55" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG22deb158-48c6-41c3-8157-b88b4b968a55',
 *             {boundingbox: [-1, 9, 13, -3], axis: true, showcopyright: false, shownavigation: false});
 *                 var s = board.create('slider', [[4,7],[8,7],[1,1,1.5]], {name:'S', strokeColor:'black', fillColor:'white'});
 *                 var f = [function(){return (s.Value()*4.5).toFixed(2);},
 *                          function(){return (s.Value()*(-1)).toFixed(2);},
 *                          function(){return (s.Value()*3).toFixed(2);},
 *                          function(){return (s.Value()*2).toFixed(2);},
 *                          function(){return (s.Value()*(-0.5)).toFixed(2);},
 *                          function(){return (s.Value()*5.5).toFixed(2);},
 *                          function(){return (s.Value()*2.5).toFixed(2);},
 *                          function(){return (s.Value()*(-0.75)).toFixed(2);},
 *                          function(){return (s.Value()*3.5).toFixed(2);},
 *                          function(){return (s.Value()*2).toFixed(2);},
 *                          function(){return (s.Value()*(-1.25)).toFixed(2);}
 *                          ];
 *                 var chart = board.create('chart', [f],
 *                                                 {chartStyle:'bar',width:0.8,labels:f,
 *                                                  colorArray:['#8E1B77','#BE1679','#DC1765','#DA2130','#DB311B','#DF4917','#E36317','#E87F1A',
 *                                                              '#F1B112','#FCF302','#C1E212']});
 *
 *                 var dataArr = [4,1,3,2,5,6.5,1.5,2,0.5,1.5,-1];
 *                 var chart2 = board.create('chart', dataArr, {chartStyle:'line,point'});
 *                 chart2[0].setAttribute('strokeColor:black','strokeWidth:2pt');
 *                 for(var i=0; i<11;i++) {
 *                     chart2[1][i].setAttribute({strokeColor:'black',fillColor:'white',face:'[]', size:4, strokeWidth:'2pt'});
 *                 }
 *                 board.unsuspendUpdate();
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *         var dataArr = [4, 1.2, 3, 7, 5, 4, 1.54, function () { return 2; }];
 *         var a = board.create('chart', dataArr, {
 *                 chartStyle:'pie', colors:['#B02B2C','#3F4C6B','#C79810','#D15600'],
 *                 fillOpacity:0.9,
 *                 center:[5,2],
 *                 strokeColor:'#ffffff',
 *                 strokeWidth:6,
 *                 highlightBySize:true,
 *                 highlightOnSector:true
 *             });
 *
 * </pre><div id="JXG1180b7dd-b048-436a-a5ad-87ffa82d5aff" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1180b7dd-b048-436a-a5ad-87ffa82d5aff',
 *             {boundingbox: [0, 8, 12, -4], axis: true, showcopyright: false, shownavigation: false});
 *             var dataArr = [4, 1.2, 3, 7, 5, 4, 1.54, function () { return 2; }];
 *             var a = board.create('chart', dataArr, {
 *                     chartStyle:'pie', colors:['#B02B2C','#3F4C6B','#C79810','#D15600'],
 *                     fillOpacity:0.9,
 *                     center:[5,2],
 *                     strokeColor:'#ffffff',
 *                     strokeWidth:6,
 *                     highlightBySize:true,
 *                     highlightOnSector:true
 *                 });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *             board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-12, 12, 20, -12], axis: false});
 *             board.suspendUpdate();
 *             // See labelArray and paramArray
 *             var dataArr = [[23, 14, 15.0], [60, 8, 25.0], [0, 11.0, 25.0], [10, 15, 20.0]];
 *
 *             var a = board.create('chart', dataArr, {
 *                 chartStyle:'radar',
 *                 colorArray:['#0F408D','#6F1B75','#CA147A','#DA2228','#E8801B','#FCF302','#8DC922','#15993C','#87CCEE','#0092CE'],
 *                 //fillOpacity:0.5,
 *                 //strokeColor:'black',
 *                 //strokeWidth:1,
 *                 //polyStrokeWidth:1,
 *                 paramArray:['Speed','Flexibility', 'Costs'],
 *                 labelArray:['Ruby','JavaScript', 'PHP', 'Python'],
 *                 //startAngle:Math.PI/4,
 *                 legendPosition:'right',
 *                 //"startShiftRatio": 0.1,
 *                 //endShiftRatio:0.1,
 *                 //startShiftArray:[0,0,0],
 *                 //endShiftArray:[0.5,0.5,0.5],
 *                 start:0
 *                 //end:70,
 *                 //startArray:[0,0,0],
 *                 //endArray:[7,7,7],
 *                 //radius:3,
 *                 //showCircles:true,
 *                 //circleLabelArray:[1,2,3,4,5],
 *                 //highlightColorArray:['#E46F6A','#F9DF82','#F7FA7B','#B0D990','#69BF8E','#BDDDE4','#92C2DF','#637CB0','#AB91BC','#EB8EBF'],
 *             });
 *             board.unsuspendUpdate();
 *
 * </pre><div id="JXG985fbbe6-0488-4073-b73b-cb3ebaea488a" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG985fbbe6-0488-4073-b73b-cb3ebaea488a',
 *             {boundingbox: [-12, 12, 20, -12], axis: false, showcopyright: false, shownavigation: false});
 *                 board.suspendUpdate();
 *                 // See labelArray and paramArray
 *                 var dataArr = [[23, 14, 15.0], [60, 8, 25.0], [0, 11.0, 25.0], [10, 15, 20.0]];
 *
 *                 var a = board.create('chart', dataArr, {
 *                     chartStyle:'radar',
 *                     colorArray:['#0F408D','#6F1B75','#CA147A','#DA2228','#E8801B','#FCF302','#8DC922','#15993C','#87CCEE','#0092CE'],
 *                     //fillOpacity:0.5,
 *                     //strokeColor:'black',
 *                     //strokeWidth:1,
 *                     //polyStrokeWidth:1,
 *                     paramArray:['Speed','Flexibility', 'Costs'],
 *                     labelArray:['Ruby','JavaScript', 'PHP', 'Python'],
 *                     //startAngle:Math.PI/4,
 *                     legendPosition:'right',
 *                     //"startShiftRatio": 0.1,
 *                     //endShiftRatio:0.1,
 *                     //startShiftArray:[0,0,0],
 *                     //endShiftArray:[0.5,0.5,0.5],
 *                     start:0
 *                     //end:70,
 *                     //startArray:[0,0,0],
 *                     //endArray:[7,7,7],
 *                     //radius:3,
 *                     //showCircles:true,
 *                     //circleLabelArray:[1,2,3,4,5],
 *                     //highlightColorArray:['#E46F6A','#F9DF82','#F7FA7B','#B0D990','#69BF8E','#BDDDE4','#92C2DF','#637CB0','#AB91BC','#EB8EBF'],
 *                 });
 *                 board.unsuspendUpdate();
 *
 *     })();
 *
 * </script><pre>
 *
 * For more examples see
 * <ul>
 * <li><a href="https://jsxgraph.org/wiki/index.php/Charts_from_HTML_tables_-_tutorial">JSXgraph wiki: Charts from HTML tables - tutorial</a>
 * <li><a href="https://jsxgraph.org/wiki/index.php/Pie_chart">JSXgraph wiki: Pie chart</a>
 * <li><a href="https://jsxgraph.org/wiki/index.php/Different_chart_styles">JSXgraph wiki: Various chart styles</a>
 * <li><a href="https://jsxgraph.org/wiki/index.php/Dynamic_bar_chart">JSXgraph wiki: Dynamic bar chart</a>
 * </ul>
 */
JXG.createChart = function (board, parents, attributes) {
    var data,
        row,
        i,
        j,
        col,
        charts = [],
        w,
        x,
        showRows,
        attr,
        originalWidth,
        name,
        strokeColor,
        fillColor,
        hStrokeColor,
        hFillColor,
        len,
        table = Env.isBrowser ? board.document.getElementById(parents[0]) : null;

    if (parents.length === 1 && Type.isString(parents[0])) {
        if (Type.exists(table)) {
            // extract the data
            attr = Type.copyAttributes(attributes, board.options, 'chart');

            table = new DataSource().loadFromTable(
                parents[0],
                attr.withheaders,
                attr.withheaders
            );
            data = table.data;
            col = table.columnHeaders;
            row = table.rowHeaders;

            originalWidth = attr.width;
            name = attr.name;
            strokeColor = attr.strokecolor;
            fillColor = attr.fillcolor;
            hStrokeColor = attr.highlightstrokecolor;
            hFillColor = attr.highlightfillcolor;

            board.suspendUpdate();

            len = data.length;
            showRows = [];
            if (attr.rows && Type.isArray(attr.rows)) {
                for (i = 0; i < len; i++) {
                    for (j = 0; j < attr.rows.length; j++) {
                        if (
                            attr.rows[j] === i ||
                            (attr.withheaders && attr.rows[j] === row[i])
                        ) {
                            showRows.push(data[i]);
                            break;
                        }
                    }
                }
            } else {
                showRows = data;
            }

            len = showRows.length;

            for (i = 0; i < len; i++) {
                x = [];
                if (attr.chartstyle && attr.chartstyle.indexOf('bar') !== -1) {
                    if (originalWidth) {
                        w = originalWidth;
                    } else {
                        w = 0.8;
                    }

                    x.push(1 - w / 2 + ((i + 0.5) * w) / len);

                    for (j = 1; j < showRows[i].length; j++) {
                        x.push(x[j - 1] + 1);
                    }

                    attr.width = w / len;
                }

                if (name && name.length === len) {
                    attr.name = name[i];
                } else if (attr.withheaders) {
                    attr.name = col[i];
                }

                if (strokeColor && strokeColor.length === len) {
                    attr.strokecolor = strokeColor[i];
                } else {
                    attr.strokecolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 0.6);
                }

                if (fillColor && fillColor.length === len) {
                    attr.fillcolor = fillColor[i];
                } else {
                    attr.fillcolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 1.0);
                }

                if (hStrokeColor && hStrokeColor.length === len) {
                    attr.highlightstrokecolor = hStrokeColor[i];
                } else {
                    attr.highlightstrokecolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 1.0);
                }

                if (hFillColor && hFillColor.length === len) {
                    attr.highlightfillcolor = hFillColor[i];
                } else {
                    attr.highlightfillcolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 0.6);
                }

                if (attr.chartstyle && attr.chartstyle.indexOf('bar') !== -1) {
                    charts.push(new JXG.Chart(board, [x, showRows[i]], attr));
                } else {
                    charts.push(new JXG.Chart(board, [showRows[i]], attr));
                }
            }

            board.unsuspendUpdate();
        }
        return charts;
    }

    attr = Type.copyAttributes(attributes, board.options, 'chart');
    return new JXG.Chart(board, parents, attr);
};

JXG.registerElement("chart", JXG.createChart);

/**
 * Legend for chart
 *
 * The Legend class is a basic class for legends.
 * @class Creates a new Legend object. Do not use this constructor to create a legend.
 * Use {@link JXG.Board#create} with type {@link Legend} instead.
 * <p>
 * The legend object consists of segements with labels. These lines can be
 * accessed with the property "lines" of the element.
 * @constructor
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new legend is drawn on.
 * @param {Array} coords Coordinates of the left top point of the legend.
 * @param  {Object} attributes Attributes of the legend
 */
JXG.Legend = function (board, coords, attributes) {
    var attr;

    /* Call the constructor of GeometryElement */
    this.constructor();

    attr = Type.copyAttributes(attributes, board.options, 'legend');

    this.board = board;
    this.coords = new Coords(Const.COORDS_BY_USER, coords, this.board);
    this.myAtts = {};
    this.label_array = attr.labelarray || attr.labels;
    this.color_array = attr.colorarray || attr.colors;
    this.opacy_array = attr.strokeopacity || [1];
    this.lines = [];
    this.myAtts.strokewidth = attr.strokewidth || 5;
    this.myAtts.straightfirst = false;
    this.myAtts.straightlast = false;
    this.myAtts.withlabel = true;
    this.myAtts.fixed = true;
    this.myAtts.frozen = attr.frozen || false ;
    this.style = attr.legendstyle || attr.style;

    if (this.style === 'vertical') {
        this.drawVerticalLegend(board, attr);
    } else {
        throw new Error("JSXGraph: Unknown legend style: " + this.style);
    }

    this.id = this.board.setId(this, 'Leg');

};

JXG.Legend.prototype = new GeometryElement();

/**
 * Draw a vertical legend.
 *
 * @private
 * @param  {String|JXG.Board} board      The board the legend is drawn on
 * @param  {Object} attributes Attributes of the legend
 */
JXG.Legend.prototype.drawVerticalLegend = function (board, attributes) {
    var i,
        line_length = attributes.linelength || 1,
        offy = (attributes.rowheight || 20) / this.board.unitY,
        getLabelAnchor = function () {
            this.setLabelRelativeCoords(this.visProp.label.offset);
            return new Coords(
                Const.COORDS_BY_USER,
                [this.point2.X(), this.point2.Y()],
                this.board
            );
        };

    for (i = 0; i < this.label_array.length; i++) {
        this.myAtts.name = this.label_array[i];
        this.myAtts.strokecolor = this.color_array[i % this.color_array.length];
        this.myAtts.highlightstrokecolor = this.color_array[i % this.color_array.length];
        this.myAtts.strokeopacity = this.opacy_array[i % this.opacy_array.length];
        this.myAtts.highlightstrokeopacity = this.opacy_array[i % this.opacy_array.length];
        this.myAtts.label = {
            offset: [10, 0],
            strokeColor: this.color_array[i % this.color_array.length],
            strokeWidth: this.myAtts.strokewidth
        };

        this.lines[i] = board.create(
            "line",
            [
                [this.coords.usrCoords[1], this.coords.usrCoords[2] - i * offy],
                [this.coords.usrCoords[1] + line_length, this.coords.usrCoords[2] - i * offy]
            ],
            this.myAtts
        );

        if (this.myAtts.frozen){
            this.lines[i].setAttribute({ point1: { frozen: true }, point2: { frozen: true } });
        }

        this.lines[i].getLabelAnchor = getLabelAnchor;
        this.lines[i]
            .prepareUpdate()
            .update()
            .updateVisibility(this.lines[i].evalVisProp('visible'))
            .updateRenderer();

        this.addChild(this.lines[i]);
    }
};

/**
 * @class Creates a legend for a chart element.
 * Parameter is a pair of coordinates. The label names and  the label colors are
 * supplied in the attributes:
 * <ul>
 * <li> labels (Array): array of strings containing label names
 * <li> labelArray (Array): alternative array for label names (has precedence over 'labels')
 * <li> colors (Array): array of color values
 * <li> colorArray (Array): alternative array for color values (has precedence over 'colors')
 * <li> opacities (Array): opacity of a line in the legend
 * <li> legendStyle or style: at the time being only 'vertical' is supported.
 * <li> rowHeight: height of an entry in the legend (in px)
 * <li> linelenght: length of a line in the legend (measured in the coordinate system)
 * <li> frozen (Boolean, false):
 * </ul>
 *
 * @pseudo
 * @name Legend
 * @augments JXG.Legend
 * @constructor
 * @type JXG.Legend
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Number} x Horizontal coordinate of the left top point of the legend
 * @param {Number} y Vertical coordinate of the left top point of the legend
 *
 * @example
 * var board = JXG.JSXGraph.initBoard('jxgbox', {axis:true,boundingbox:[-4,48.3,12.0,-2.3]});
 * var x       = [-3,-2,-1,0,1,2,3,4,5,6,7,8];
 * var dataArr = [4,7,7,27,33,37,46,22,11,4,1,0];
 *
 * colors = ['green', 'yellow', 'red', 'blue'];
 * board.create('chart', [x,dataArr], {chartStyle:'bar', width:1.0, labels:dataArr, colors: colors} );
 * board.create('legend', [8, 45], {labels:dataArr, colors: colors, strokeWidth:5} );
 *
 * </pre><div id="JXGeeb588d9-a4fd-41bf-93f4-cd6f7a016682" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGeeb588d9-a4fd-41bf-93f4-cd6f7a016682',
 *             {boundingbox: [-4,48.3,12.0,-2.3], axis: true, showcopyright: false, shownavigation: false});
 *     var x       = [-3,-2,-1,0,1,2,3,4,5,6,7,8];
 *     var dataArr = [4,7,7,27,33,37,46,22,11,4,1,0];
 *
 *     colors = ['green', 'yellow', 'red', 'blue'];
 *     board.create('chart', [x,dataArr], {chartStyle:'bar', width:1.0, labels:dataArr, colors: colors} );
 *     board.create('legend', [8, 45], {labels:dataArr, colors: colors, strokeWidth:5} );
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *   var inputFun, cf = [], cf2 = [], niveaunum,
 *     niveauline = [], niveauopac = [],legend;
 *
 *   inputFun = "x^2/2-2*x*y+y^2/2";
 *   niveauline = [-3,-2,-1,-0.5, 0, 1,2,3];
 *   niveaunum = niveauline.length;
 *   for (let i = 0; JXG.Math.lt(i, niveaunum); i++) {
 *     let niveaui = niveauline[i];
 *     niveauopac.push(((i + 1) / (niveaunum + 1)));
 *     cf.push(board.create("implicitcurve", [
 *       inputFun + "-(" + niveaui.toFixed(2) + ")", [-2, 2], [-2, 2]], {
 *       strokeWidth: 2,
 *       strokeColor: JXG.palette.red,
 *       strokeOpacity: niveauopac[i],
 *       needsRegularUpdate: false,
 *       name: "niveau"+i,
 *       visible: true
 *     }));
 *   }
 *   legend = board.create('legend', [-1.75, 1.75], {
 *     labels: niveauline,
 *     colors: [cf[0].visProp.strokecolor],
 *     strokeOpacity: niveauopac,
 *     linelength: 0.2,
 *     frozen:true
 *   }
 *   );
 *
 *
 * </pre><div id="JXG079fce93-07b9-426f-a267-ab9c1253e435" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG079fce93-07b9-426f-a267-ab9c1253e435',
 *             {boundingbox: [-2, 2, 2, -2], axis: true, showcopyright: false, shownavigation: false});
 *       var board, inputFun, cf = [], cf2 = [], niveaunum,
 *         niveauline = [], niveauopac = [],legend;
 *
 *       inputFun = "x^2/2-2*x*y+y^2/2";
 *       niveauline = [-3,-2,-1,-0.5, 0, 1,2,3];
 *       niveaunum = niveauline.length;
 *       for (let i = 0; JXG.Math.lt(i, niveaunum); i++) {
 *         let niveaui = niveauline[i];
 *         niveauopac.push(((i + 1) / (niveaunum + 1)));
 *         cf.push(board.create("implicitcurve", [
 *           inputFun + "-(" + niveaui.toFixed(2) + ")", [-2, 2], [-2, 2]], {
 *           strokeWidth: 2,
 *           strokeColor: JXG.palette.red,
 *           strokeOpacity: niveauopac[i],
 *           needsRegularUpdate: false,
 *           name: "niveau"+i,
 *           visible: true
 *         }));
 *       }
 *       legend = board.create('legend', [-1.75, 1.75], {
 *         labels: niveauline,
 *         colors: [cf[0].visProp.strokecolor],
 *         strokeOpacity: niveauopac,
 *         linelength: 0.2,
 *         frozen:true
 *       }
 *       );
 *
 *
 *     })();
 *
 * </script>
 *
 *
 */
JXG.createLegend = function (board, parents, attributes) {
    //parents are coords of left top point of the legend
    var start_from = [0, 0];

    if (Type.exists(parents) && parents.length === 2) {
        start_from = parents;
    } else {
        throw new Error("JSXGraph: Legend element needs two numbers as parameters");
    }

    return new JXG.Legend(board, start_from, attributes);
};

JXG.registerElement("legend", JXG.createLegend);

export default {
    Chart: JXG.Chart,
    Legend: JXG.Legend
    // createChart: JXG.createChart,
    // createLegend: JXG.createLegend
};
