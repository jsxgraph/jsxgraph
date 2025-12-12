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
/*
    Some functionalities in this file were developed as part of a software project
    with students. We would like to thank all contributors for their help:

    Winter semester 2023/2024:
        Matti Kirchbach
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The geometry object Line is defined in this file. Line stores all
 * style and functional properties that are required to draw and move a line on
 * a board.
 */

import JXG from "../jxg.js";
import Mat from "../math/math.js";
import Geometry from "../math/geometry.js";
import Numerics from "../math/numerics.js";
import Statistics from "../math/statistics.js";
import Const from "./constants.js";
import Coords from "./coords.js";
import GeometryElement from "./element.js";
import Type from "../utils/type.js";

/**
 * The Line class is a basic class for all kind of line objects, e.g. line, arrow, and axis. It is usually defined by two points and can
 * be intersected with some other geometry elements.
 * @class Creates a new basic line object. Do not use this constructor to create a line.
 * Use {@link JXG.Board#create} with
 * type {@link Line}, {@link Arrow}, or {@link Axis} instead.
 * @constructor
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new line is drawn on.
 * @param {Point} p1 Startpoint of the line.
 * @param {Point} p2 Endpoint of the line.
 * @param {Object} attributes Javascript object containing attributes like name, id and colors.
 */
JXG.Line = function (board, p1, p2, attributes) {
    this.constructor(board, attributes, Const.OBJECT_TYPE_LINE, Const.OBJECT_CLASS_LINE);

    /**
     * Startpoint of the line. You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     * @type JXG.Point
     */
    this.point1 = this.board.select(p1);

    /**
     * Endpoint of the line. Just like {@link JXG.Line.point1} you shouldn't write this field directly.
     * @type JXG.Point
     */
    this.point2 = this.board.select(p2);

    /**
     * Array of ticks storing all the ticks on this line. Do not set this field directly and use
     * {@link JXG.Line#addTicks} and {@link JXG.Line#removeTicks} to add and remove ticks to and from the line.
     * @type Array
     * @see JXG.Ticks
     */
    this.ticks = [];

    /**
     * Reference of the ticks created automatically when constructing an axis.
     * @type JXG.Ticks
     * @see JXG.Ticks
     */
    this.defaultTicks = null;

    /**
     * If the line is the border of a polygon, the polygon object is stored, otherwise null.
     * @type JXG.Polygon
     * @default null
     * @private
     */
    this.parentPolygon = null;

    /* Register line at board */
    this.id = this.board.setId(this, 'L');
    this.board.renderer.drawLine(this);
    this.board.finalizeAdding(this);

    this.elType = 'line';

    /* Add line as child to defining points */
    if (this.point1._is_new) {
        this.addChild(this.point1);
        delete this.point1._is_new;
    } else {
        this.point1.addChild(this);
    }
    if (this.point2._is_new) {
        this.addChild(this.point2);
        delete this.point2._is_new;
    } else {
        this.point2.addChild(this);
    }

    this.inherits.push(this.point1, this.point2);

    this.updateStdform(); // This is needed in the following situation:
    // * the line is defined by three coordinates
    // * and it will have a glider
    // * and board.suspendUpdate() has been called.

    // create Label
    this.createLabel();

    this.methodMap = JXG.deepCopy(this.methodMap, {
        point1: "point1",
        point2: "point2",
        getSlope: "Slope",
        Slope: "Slope",
        Direction: "Direction",
        getRise: "getRise",
        Rise: "getRise",
        getYIntersect: "getRise",
        YIntersect: "getRise",
        getAngle: "getAngle",
        Angle: "getAngle",
        L: "L",
        length: "L",
        setFixedLength: "setFixedLength",
        setStraight: "setStraight"
    });
};

JXG.Line.prototype = new GeometryElement();

JXG.extend(
    JXG.Line.prototype,
    /** @lends JXG.Line.prototype */ {
        /**
         * Checks whether (x,y) is near the line.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the line, False otherwise.
         */
        hasPoint: function (x, y) {
            // Compute the stdform of the line in screen coordinates.
            var c = [],
                v = [1, x, y],
                s, vnew, p1c, p2c, d, pos, i, prec, type,
                sw = this.evalVisProp('strokewidth');

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                prec = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                prec = this.board.options.precision.hasPoint;
            }
            prec += sw * 0.5;

            c[0] =
                this.stdform[0] -
                (this.stdform[1] * this.board.origin.scrCoords[1]) / this.board.unitX +
                (this.stdform[2] * this.board.origin.scrCoords[2]) / this.board.unitY;
            c[1] = this.stdform[1] / this.board.unitX;
            c[2] = this.stdform[2] / -this.board.unitY;

            s = Geometry.distPointLine(v, c);
            if (isNaN(s) || s > prec) {
                return false;
            }

            if (
                this.evalVisProp('straightfirst') &&
                this.evalVisProp('straightlast')
            ) {
                return true;
            }

            // If the line is a ray or segment we have to check if the projected point is between P1 and P2.
            p1c = this.point1.coords;
            p2c = this.point2.coords;

            // Project the point orthogonally onto the line
            vnew = [0, c[1], c[2]];
            // Orthogonal line to c through v
            vnew = Mat.crossProduct(vnew, v);
            // Intersect orthogonal line with line
            vnew = Mat.crossProduct(vnew, c);

            // Normalize the projected point
            vnew[1] /= vnew[0];
            vnew[2] /= vnew[0];
            vnew[0] = 1;

            vnew = new Coords(Const.COORDS_BY_SCREEN, vnew.slice(1), this.board).usrCoords;
            d = p1c.distance(Const.COORDS_BY_USER, p2c);
            p1c = p1c.usrCoords.slice(0);
            p2c = p2c.usrCoords.slice(0);

            // The defining points are identical
            if (d < Mat.eps) {
                pos = 0;
            } else {
                /*
                 * Handle the cases, where one of the defining points is an ideal point.
                 * d is set to something close to infinity, namely 1/eps.
                 * The ideal point is (temporarily) replaced by a finite point which has
                 * distance d from the other point.
                 * This is accomplished by extracting the x- and y-coordinates (x,y)=:v of the ideal point.
                 * v determines the direction of the line. v is normalized, i.e. set to length 1 by dividing through its length.
                 * Finally, the new point is the sum of the other point and v*d.
                 *
                 */

                // At least one point is an ideal point
                if (d === Number.POSITIVE_INFINITY) {
                    d = 1 / Mat.eps;

                    // The second point is an ideal point
                    if (Math.abs(p2c[0]) < Mat.eps) {
                        d /= Geometry.distance([0, 0, 0], p2c);
                        p2c = [1, p1c[1] + p2c[1] * d, p1c[2] + p2c[2] * d];
                        // The first point is an ideal point
                    } else {
                        d /= Geometry.distance([0, 0, 0], p1c);
                        p1c = [1, p2c[1] + p1c[1] * d, p2c[2] + p1c[2] * d];
                    }
                }
                i = 1;
                d = p2c[i] - p1c[i];

                if (Math.abs(d) < Mat.eps) {
                    i = 2;
                    d = p2c[i] - p1c[i];
                }
                pos = (vnew[i] - p1c[i]) / d;
            }

            if (!this.evalVisProp('straightfirst') && pos < 0) {
                return false;
            }

            return !(!this.evalVisProp('straightlast') && pos > 1);
        },

        // documented in base/element
        update: function () {
            var funps;

            if (!this.needsUpdate) {
                return this;
            }

            if (this.constrained) {
                if (Type.isFunction(this.funps)) {
                    funps = this.funps();
                    if (funps && funps.length && funps.length === 2) {
                        this.point1 = funps[0];
                        this.point2 = funps[1];
                    }
                } else {
                    if (Type.isFunction(this.funp1)) {
                        funps = this.funp1();
                        if (Type.isPoint(funps)) {
                            this.point1 = funps;
                        } else if (funps && funps.length && funps.length === 2) {
                            this.point1.setPositionDirectly(Const.COORDS_BY_USER, funps);
                        }
                    }

                    if (Type.isFunction(this.funp2)) {
                        funps = this.funp2();
                        if (Type.isPoint(funps)) {
                            this.point2 = funps;
                        } else if (funps && funps.length && funps.length === 2) {
                            this.point2.setPositionDirectly(Const.COORDS_BY_USER, funps);
                        }
                    }
                }
            }

            this.updateSegmentFixedLength();
            this.updateStdform();

            if (this.evalVisProp('trace')) {
                this.cloneToBackground(true);
            }

            return this;
        },

        /**
         * Update segments with fixed length and at least one movable point.
         * @private
         */
        updateSegmentFixedLength: function () {
            var d, d_new, d1, d2, drag1, drag2, x, y;

            if (!this.hasFixedLength) {
                return this;
            }

            // Compute the actual length of the segment
            d = this.point1.Dist(this.point2);
            // Determine the length the segment ought to have
            d_new = (this.evalVisProp('nonnegativeonly')) ?
                Math.max(0.0, this.fixedLength()) :
                Math.abs(this.fixedLength());

            // Distances between the two points and their respective
            // position before the update
            d1 = this.fixedLengthOldCoords[0].distance(
                Const.COORDS_BY_USER,
                this.point1.coords
            );
            d2 = this.fixedLengthOldCoords[1].distance(
                Const.COORDS_BY_USER,
                this.point2.coords
            );

            // If the position of the points or the fixed length function has been changed we have to work.
            if (d1 > Mat.eps || d2 > Mat.eps || d !== d_new) {
                drag1 =
                    this.point1.isDraggable &&
                    this.point1.type !== Const.OBJECT_TYPE_GLIDER &&
                    !this.point1.evalVisProp('fixed');
                drag2 =
                    this.point2.isDraggable &&
                    this.point2.type !== Const.OBJECT_TYPE_GLIDER &&
                    !this.point2.evalVisProp('fixed');

                // First case: the two points are different
                // Then we try to adapt the point that was not dragged
                // If this point can not be moved (e.g. because it is a glider)
                // we try move the other point
                if (d > Mat.eps) {
                    if ((d1 > d2 && drag2) || (d1 <= d2 && drag2 && !drag1)) {
                        this.point2.setPositionDirectly(Const.COORDS_BY_USER, [
                            this.point1.X() + ((this.point2.X() - this.point1.X()) * d_new) / d,
                            this.point1.Y() + ((this.point2.Y() - this.point1.Y()) * d_new) / d
                        ]);
                        this.point2.fullUpdate();
                    } else if ((d1 <= d2 && drag1) || (d1 > d2 && drag1 && !drag2)) {
                        this.point1.setPositionDirectly(Const.COORDS_BY_USER, [
                            this.point2.X() + ((this.point1.X() - this.point2.X()) * d_new) / d,
                            this.point2.Y() + ((this.point1.Y() - this.point2.Y()) * d_new) / d
                        ]);
                        this.point1.fullUpdate();
                    }
                    // Second case: the two points are identical. In this situation
                    // we choose a random direction.
                } else {
                    x = Math.random() - 0.5;
                    y = Math.random() - 0.5;
                    d = Mat.hypot(x, y);

                    if (drag2) {
                        this.point2.setPositionDirectly(Const.COORDS_BY_USER, [
                            this.point1.X() + (x * d_new) / d,
                            this.point1.Y() + (y * d_new) / d
                        ]);
                        this.point2.fullUpdate();
                    } else if (drag1) {
                        this.point1.setPositionDirectly(Const.COORDS_BY_USER, [
                            this.point2.X() + (x * d_new) / d,
                            this.point2.Y() + (y * d_new) / d
                        ]);
                        this.point1.fullUpdate();
                    }
                }
                // Finally, we save the position of the two points.
                this.fixedLengthOldCoords[0].setCoordinates(
                    Const.COORDS_BY_USER,
                    this.point1.coords.usrCoords
                );
                this.fixedLengthOldCoords[1].setCoordinates(
                    Const.COORDS_BY_USER,
                    this.point2.coords.usrCoords
                );
            }

            return this;
        },

        /**
         * Updates the stdform derived from the parent point positions.
         * @private
         */
        updateStdform: function () {
            var v = Mat.crossProduct(
                this.point1.coords.usrCoords,
                this.point2.coords.usrCoords
            );

            this.stdform[0] = v[0];
            this.stdform[1] = v[1];
            this.stdform[2] = v[2];
            this.stdform[3] = 0;

            this.normalize();
        },

        /**
         * Uses the boards renderer to update the line.
         * @private
         */
        updateRenderer: function () {
            //var wasReal;

            if (!this.needsUpdate) {
                return this;
            }

            if (this.visPropCalc.visible) {
                // wasReal = this.isReal;
                this.isReal =
                    !isNaN(
                        this.point1.coords.usrCoords[1] +
                        this.point1.coords.usrCoords[2] +
                        this.point2.coords.usrCoords[1] +
                        this.point2.coords.usrCoords[2]
                    ) && Mat.innerProduct(this.stdform, this.stdform, 3) >= Mat.eps * Mat.eps;

                if (
                    //wasReal &&
                    !this.isReal
                ) {
                    this.updateVisibility(false);
                }
            }

            if (this.visPropCalc.visible) {
                this.board.renderer.updateLine(this);
            }

            /* Update the label if visible. */
            if (
                this.hasLabel &&
                this.visPropCalc.visible &&
                this.label &&
                this.label.visPropCalc.visible &&
                this.isReal
            ) {
                this.label.update();
                this.board.renderer.updateText(this.label);
            }

            // Update rendNode display
            this.setDisplayRendNode();

            this.needsUpdate = false;
            return this;
        },

        // /**
        //  * Used to generate a polynomial for a point p that lies on this line, i.e. p is collinear to
        //  * {@link JXG.Line#point1} and {@link JXG.Line#point2}.
        //  *
        //  * @param {JXG.Point} p The point for that the polynomial is generated.
        //  * @returns {Array} An array containing the generated polynomial.
        //  * @private
        //  */
        generatePolynomial: function (p) {
            var u1 = this.point1.symbolic.x,
                u2 = this.point1.symbolic.y,
                v1 = this.point2.symbolic.x,
                v2 = this.point2.symbolic.y,
                w1 = p.symbolic.x,
                w2 = p.symbolic.y;

            /*
             * The polynomial in this case is determined by three points being collinear:
             *
             *      U (u1,u2)      W (w1,w2)                V (v1,v2)
             *  ----x--------------x------------------------x----------------
             *
             *  The collinearity condition is
             *
             *      u2-w2       w2-v2
             *     -------  =  -------           (1)
             *      u1-w1       w1-v1
             *
             * Multiplying (1) with denominators and simplifying is
             *
             *    u2w1 - u2v1 + w2v1 - u1w2 + u1v2 - w1v2 = 0
             */

            return [
                [
                    "(", u2, ")*(", w1, ")-(", u2, ")*(", v1, ")+(", w2, ")*(", v1, ")-(", u1, ")*(", w2, ")+(", u1, ")*(", v2, ")-(", w1, ")*(", v2, ")"
                ].join("")
            ];
        },

        /**
         * Calculates the y intersect of the line.
         * @returns {Number} The y intersect.
         */
        getRise: function () {
            if (Math.abs(this.stdform[2]) >= Mat.eps) {
                return -this.stdform[0] / this.stdform[2];
            }

            return Infinity;
        },

        /**
         * Calculates the slope of the line.
         * @returns {Number} The slope of the line or Infinity if the line is parallel to the y-axis.
         */
        Slope: function () {
            if (Math.abs(this.stdform[2]) >= Mat.eps) {
                return -this.stdform[1] / this.stdform[2];
            }

            return Infinity;
        },

        /**
         * Alias for line.Slope
         * @returns {Number} The slope of the line or Infinity if the line is parallel to the y-axis.
         * @deprecated
         * @see Line#Slope
         */
        getSlope: function () {
            return this.Slope();
        },

        /**
         * Determines the angle between the positive x axis and the line.
         * @returns {Number}
         */
        getAngle: function () {
            return Math.atan2(-this.stdform[1], this.stdform[2]);
        },

        /**
         * Returns the direction vector of the line. This is an array of length two
         * containing the direction vector as [x, y]. It is defined as
         *  <li> the difference of the x- and y-coordinate of the second and first point, in case both points are finite or both points are infinite.
         *  <li> [x, y] coordinates of point2, in case only point2 is infinite.
         *  <li> [-x, -y] coordinates of point1, in case only point1 is infinite.
         * @function
         * @returns {Array} of length 2.
         */
        Direction: function () {
            var coords1 = this.point1.coords.usrCoords,
                coords2 = this.point2.coords.usrCoords;

            if (coords2[0] === 0 && coords1[0] !== 0) {
                return coords2.slice(1);
            }

            if (coords1[0] === 0 && coords2[0] !== 0) {
                return [-coords1[1], -coords1[2]];
            }

            return [
                coords2[1] - coords1[1],
                coords2[2] - coords1[2]
            ];
        },

        /**
         * Returns true, if the line is vertical (if the x coordinate of the direction vector is 0).
         * @function
         * @returns {Boolean}
         */
        isVertical: function () {
            var dir = this.Direction();
            return dir[0] === 0 && dir[1] !== 0;
        },

        /**
         * Returns true, if the line is horizontal (if the y coordinate of the direction vector is 0).
         * @function
         * @returns {Boolean}
         */
        isHorizontal: function () {
            var dir = this.Direction();
            return dir[1] === 0 && dir[0] !== 0;
        },

        /**
         * Determines whether the line is drawn beyond {@link JXG.Line#point1} and
         * {@link JXG.Line#point2} and updates the line.
         * @param {Boolean} straightFirst True if the Line shall be drawn beyond
         * {@link JXG.Line#point1}, false otherwise.
         * @param {Boolean} straightLast True if the Line shall be drawn beyond
         * {@link JXG.Line#point2}, false otherwise.
         * @see Line#straightFirst
         * @see Line#straightLast
         * @private
         */
        setStraight: function (straightFirst, straightLast) {
            this.visProp.straightfirst = straightFirst;
            this.visProp.straightlast = straightLast;

            this.board.renderer.updateLine(this);
            return this;
        },

        // documented in geometry element
        getTextAnchor: function () {
            return new Coords(
                Const.COORDS_BY_USER,
                [
                    0.5 * (this.point2.X() + this.point1.X()),
                    0.5 * (this.point2.Y() + this.point1.Y())
                ],
                this.board
            );
        },

        /**
         * Adjusts Label coords relative to Anchor. DESCRIPTION
         * @private
         */
        setLabelRelativeCoords: function (relCoords) {
            if (Type.exists(this.label)) {
                this.label.relativeCoords = new Coords(
                    Const.COORDS_BY_SCREEN,
                    [relCoords[0], -relCoords[1]],
                    this.board
                );
            }
        },

        // documented in geometry element
        getLabelAnchor: function () {
            var x, y, pos,
                xy, lbda, dx, dy, d,
                dist = 1.5,
                fs = 0,
                c1 = new Coords(Const.COORDS_BY_USER, this.point1.coords.usrCoords, this.board),
                c2 = new Coords(Const.COORDS_BY_USER, this.point2.coords.usrCoords, this.board),
                ev_sf = this.evalVisProp('straightfirst'),
                ev_sl = this.evalVisProp('straightlast');

            if (ev_sf || ev_sl) {
                Geometry.calcStraight(this, c1, c2, 0);
            }

            c1 = c1.scrCoords;
            c2 = c2.scrCoords;

            if (!Type.exists(this.label)) {
                return new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], this.board);
            }

            pos = this.label.evalVisProp('position');
            if (!Type.isString(pos)) {
                return new Coords(Const.COORDS_BY_SCREEN, [NaN, NaN], this.board);
            }

            if (pos.indexOf('right') < 0 && pos.indexOf('left') < 0) {
                // Old positioning commands
                switch (pos) {
                    case 'last':
                        x = c2[1];
                        y = c2[2];
                        break;
                    case 'first':
                        x = c1[1];
                        y = c1[2];
                        break;
                    case "lft":
                    case "llft":
                    case "ulft":
                        if (c1[1] < c2[1] + Mat.eps) {
                            x = c1[1];
                            y = c1[2];
                        } else {
                            x = c2[1];
                            y = c2[2];
                        }
                        break;
                    case "rt":
                    case "lrt":
                    case "urt":
                        if (c1[1] > c2[1] + Mat.eps) {
                            x = c1[1];
                            y = c1[2];
                        } else {
                            x = c2[1];
                            y = c2[2];
                        }
                        break;
                    default:
                        x = 0.5 * (c1[1] + c2[1]);
                        y = 0.5 * (c1[2] + c2[2]);
                }
            } else {
                // New positioning
                xy = Type.parsePosition(pos);
                lbda = Type.parseNumber(xy.pos, 1, 1);

                dx = c2[1] - c1[1];
                dy = c2[2] - c1[2];
                d = Mat.hypot(dx, dy);

                if (xy.pos.indexOf('px') >= 0 ||
                    xy.pos.indexOf('fr') >= 0 ||
                    xy.pos.indexOf('%') >= 0) {
                    // lbda is interpreted in screen coords

                    if (xy.pos.indexOf('px') >= 0) {
                        // Pixel values are supported
                        lbda /= d;
                    }

                    // Position along the line
                    x = c1[1] + lbda * dx;
                    y = c1[2] + lbda * dy;
                } else {
                    // lbda is given as number or as a number string
                    // Then, lbda is interpreted in user coords
                    x = c1[1] + lbda * this.board.unitX * dx / d;
                    y = c1[2] + lbda * this.board.unitY * dy / d;
                }

                // Position left or right
                if (xy.side === 'left') {
                    dx *= -1;
                } else {
                    dy *= -1;
                }
                if (Type.exists(this.label)) {
                    dist = 0.5 * this.label.evalVisProp('distance') / d;
                }
                x += dy * this.label.size[0] * dist;
                y += dx * this.label.size[1] * dist;
            }

            // Correct coordinates if the label seems to be outside of canvas.
            if (ev_sf || ev_sl) {
                if (Type.exists(this.label)) {
                    // Does not exist during createLabel
                    fs = this.label.evalVisProp('fontsize');
                }

                if (Math.abs(x) < Mat.eps) {
                    x = fs;
                } else if (
                    this.board.canvasWidth + Mat.eps > x &&
                    x > this.board.canvasWidth - fs - Mat.eps
                ) {
                    x = this.board.canvasWidth - fs;
                }

                if (Mat.eps + fs > y && y > -Mat.eps) {
                    y = fs;
                } else if (
                    this.board.canvasHeight + Mat.eps > y &&
                    y > this.board.canvasHeight - fs - Mat.eps
                ) {
                    y = this.board.canvasHeight - fs;
                }
            }

            return new Coords(Const.COORDS_BY_SCREEN, [x, y], this.board);
        },

        // documented in geometry element
        cloneToBackground: function () {
            var copy = Type.getCloneObject(this),
                r, s,
                er;

            copy.point1 = this.point1;
            copy.point2 = this.point2;
            copy.stdform = this.stdform;

            s = this.getSlope();
            r = this.getRise();
            copy.getSlope = function () {
                return s;
            };
            copy.getRise = function () {
                return r;
            };

            er = this.board.renderer.enhancedRendering;
            this.board.renderer.enhancedRendering = true;
            this.board.renderer.drawLine(copy);
            this.board.renderer.enhancedRendering = er;
            this.traces[copy.id] = copy.rendNode;

            return this;
        },

        /**
         * Add transformations to this line.
         * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation} or an array of
         * {@link JXG.Transformation}s.
         * @returns {JXG.Line} Reference to this line object.
         */
        addTransform: function (transform) {
            var i,
                list = Type.isArray(transform) ? transform : [transform],
                len = list.length;

            for (i = 0; i < len; i++) {
                this.point1.transformations.push(list[i]);
                this.point2.transformations.push(list[i]);
            }

            // Why not like this?
            // The difference is in setting baseElement
            // var list = Type.isArray(transform) ? transform : [transform];
            // this.point1.addTransform(this, list);
            // this.point2.addTransform(this, list);

            return this;
        },

        // see GeometryElement.js
        snapToGrid: function (pos) {
            var c1, c2, dc, t, ticks, x, y, sX, sY;

            if (this.evalVisProp('snaptogrid')) {
                if (this.parents.length < 3) {
                    // Line through two points
                    this.point1.handleSnapToGrid(true, true);
                    this.point2.handleSnapToGrid(true, true);
                } else if (Type.exists(pos)) {
                    // Free line
                    sX = this.evalVisProp('snapsizex');
                    sY = this.evalVisProp('snapsizey');

                    c1 = new Coords(Const.COORDS_BY_SCREEN, [pos.Xprev, pos.Yprev], this.board);

                    x = c1.usrCoords[1];
                    y = c1.usrCoords[2];

                    if (
                        sX <= 0 &&
                        this.board.defaultAxes &&
                        this.board.defaultAxes.x.defaultTicks
                    ) {
                        ticks = this.board.defaultAxes.x.defaultTicks;
                        sX = ticks.ticksDelta * (ticks.evalVisProp('minorticks') + 1);
                    }
                    if (
                        sY <= 0 &&
                        this.board.defaultAxes &&
                        this.board.defaultAxes.y.defaultTicks
                    ) {
                        ticks = this.board.defaultAxes.y.defaultTicks;
                        sY = ticks.ticksDelta * (ticks.evalVisProp('minorticks') + 1);
                    }

                    // if no valid snap sizes are available, don't change the coords.
                    if (sX > 0 && sY > 0) {
                        // projectCoordsToLine
                        /*
                        v = [0, this.stdform[1], this.stdform[2]];
                        v = Mat.crossProduct(v, c1.usrCoords);
                        c2 = Geometry.meetLineLine(v, this.stdform, 0, this.board);
                        */
                        c2 = Geometry.projectPointToLine({ coords: c1 }, this, this.board);

                        dc = Statistics.subtract(
                            [1, Math.round(x / sX) * sX, Math.round(y / sY) * sY],
                            c2.usrCoords
                        );
                        t = this.board.create("transform", dc.slice(1), {
                            type: "translate"
                        });
                        t.applyOnce([this.point1, this.point2]);
                    }
                }
            } else {
                this.point1.handleSnapToGrid(false, true);
                this.point2.handleSnapToGrid(false, true);
            }

            return this;
        },

        // see element.js
        snapToPoints: function () {
            var forceIt = this.evalVisProp('snaptopoints');

            if (this.parents.length < 3) {
                // Line through two points
                this.point1.handleSnapToPoints(forceIt);
                this.point2.handleSnapToPoints(forceIt);
            }

            return this;
        },

        /**
         * Treat the line as parametric curve in homogeneous coordinates, where the parameter t runs from 0 to 1.
         * First we transform the interval [0,1] to [-1,1].
         * If the line has homogeneous coordinates [c, a, b] = stdform[] then the direction of the line is [b, -a].
         * Now, we take one finite point that defines the line, i.e. we take either point1 or point2
         * (in case the line is not the ideal line).
         * Let the coordinates of that point be [z, x, y].
         * Then, the curve runs linearly from
         * [0, b, -a] (t=-1) to [z, x, y] (t=0)
         * and
         * [z, x, y] (t=0) to [0, -b, a] (t=1)
         *
         * @param {Number} t Parameter running from 0 to 1.
         * @returns {Number} X(t) x-coordinate of the line treated as parametric curve.
         * */
        X: function (t) {
            // var x,
            //     c = this.point1.coords.usrCoords,
            //     b = this.stdform[2];

            // x = (Math.abs(c[0]) > Mat.eps) ? c[1] : c[1];
            // t = (t - 0.5) * 2;

            // return (1 - Math.abs(t)) * x - t * b;

            var c1 = this.point1.coords.usrCoords,
                c2 = this.point2.coords.usrCoords,
                b = this.stdform[2];

            if (c1[0] !== 0) {
                if (c2[0] !== 0) {
                    return c1[1] + (c2[1] - c1[1]) * t;
                } else {
                    return c1[1] + b * 1.e5 * t;
                }
            } else {
                if (c1[0] !== 0) {
                    return c2[1] - (c1[1] - c2[1]) * t;
                } else {
                    return c2[1] + b * 1.e5 * t;
                }
            }
        },

        /**
         * Treat the line as parametric curve in homogeneous coordinates.
         * See {@link JXG.Line#X} for a detailed description.
         * @param {Number} t Parameter running from 0 to 1.
         * @returns {Number} Y(t) y-coordinate of the line treated as parametric curve.
         * @see Line#X
         */
        Y: function (t) {
            // var y,
            //     c = this.point1.coords.usrCoords,
            //     a = this.stdform[1];

            // y = (Math.abs(c[0]) > Mat.eps) ? c[2] : c[2];
            // t = (t - 0.5) * 2;

            // return (1 - Math.abs(t)) * y + t * a;

            var c1 = this.point1.coords.usrCoords,
                c2 = this.point2.coords.usrCoords,
                a = this.stdform[1];

            if (c1[0] !== 0) {
                if (c2[0] !== 0) {
                    return c1[2] + (c2[2] - c1[2]) * t;
                } else {
                    return c1[2] - a * 1.e5 * t;
                }
            } else {
                if (c1[0] !== 0) {
                    return c2[2] - (c1[2] - c2[2]) * t;
                } else {
                    return c2[2] - a * 1.e5 * t;
                }
            }
        },

        /**
         * Treat the line as parametric curve in homogeneous coordinates.
         * See {@link JXG.Line#X} for a detailed description.
         *
         * @param {Number} t Parameter running from 0 to 1.
         * @returns {Number} Z(t) z-coordinate of the line treated as parametric curve.
         * @see Line#Z
         */
        Z: function (t) {
            // var z,
            //     c = this.point1.coords.usrCoords;

            // z = (Math.abs(c[0]) > Mat.eps) ? c[0] : c[0];
            // t = (t - 0.5) * 2;

            // return (1 - Math.abs(t)) * z;

            var c1 = this.point1.coords.usrCoords,
                c2 = this.point2.coords.usrCoords;

            if (t === 1 && c1[0] * c2[0] === 0) {
                return 0;
            }
            return 1;
        },

        /**
         * Return the homogeneous coordinates of the line treated as curve at t - including all transformations
         * applied to the curve.
         * @param {Number} t A number
         * @returns {Array} [Z(t), X(t), Y(t)]
         * @see Line#X
         */
        Ft: function(t) {
            var c = [this.Z(t), this.X(t), this.Y(t)];
            c[1] /= c[0];
            c[2] /= c[0];
            c[0] /= c[0];
            // c[0] = 1;
            // c[1] = t;
            // c[2] = 3;

            return c;
        },

        /**
         * The distance between the two points defining the line.
         * @returns {Number}
         */
        L: function () {
            return this.point1.Dist(this.point2);
        },

        /**
         * Set a new fixed length, then update the board.
         * @param {String|Number|function} l A string, function or number describing the new length.
         * @returns {JXG.Line} Reference to this line
         */
        setFixedLength: function (l) {
            if (!this.hasFixedLength) {
                return this;
            }

            this.fixedLength = Type.createFunction(l, this.board);
            this.hasFixedLength = true;
            this.addParentsFromJCFunctions([this.fixedLength]);
            this.board.update();

            return this;
        },

        /**
         * Treat the element  as a parametric curve
         * @private
         */
        minX: function () {
            return 0.0;
        },

        /**
         * Treat the element as parametric curve
         * @private
         */
        maxX: function () {
            return 1.0;
        },

        // documented in geometry element
        bounds: function () {
            var p1c = this.point1.coords.usrCoords,
                p2c = this.point2.coords.usrCoords;

            return [
                Math.min(p1c[1], p2c[1]),
                Math.max(p1c[2], p2c[2]),
                Math.max(p1c[1], p2c[1]),
                Math.min(p1c[2], p2c[2])
            ];
        },

        // documented in GeometryElement.js
        remove: function () {
            this.removeAllTicks();
            GeometryElement.prototype.remove.call(this);
        }

        // hideElement: function () {
        //     var i;
        //
        //     GeometryElement.prototype.hideElement.call(this);
        //
        //     for (i = 0; i < this.ticks.length; i++) {
        //         this.ticks[i].hideElement();
        //     }
        // },
        //
        // showElement: function () {
        //     var i;
        //     GeometryElement.prototype.showElement.call(this);
        //
        //     for (i = 0; i < this.ticks.length; i++) {
        //         this.ticks[i].showElement();
        //     }
        // }

    }
);

/**
 * @class A general line is given by two points or three coordinates.
 * By setting additional properties a line can be used as an arrow and/or axis.
 * @pseudo
 * @name Line
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array,function_JXG.Point,array,function} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
 * @param {Number,function_Number,function_Number,function} a,b,c A line can also be created providing three numbers. The line is then described by
 * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
 * It is possible to provide three functions returning numbers, too.
 * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
 * <p>
 * Additionally, a line can be created by providing a line and a transformation (or an array of transformations).
 * Then, the result is a line which is the transformation of the supplied line.
 * @example
 * // Create a line using point and coordinates/
 * // The second point will be fixed and invisible.
 * var p1 = board.create('point', [4.5, 2.0]);
 * var l1 = board.create('line', [p1, [1.0, 1.0]]);
 * </pre><div class="jxgbox" id="JXGc0ae3461-10c4-4d39-b9be-81d74759d122" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('JXGc0ae3461-10c4-4d39-b9be-81d74759d122', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var glex1_p1 = glex1_board.create('point', [4.5, 2.0]);
 *   var glex1_l1 = glex1_board.create('line', [glex1_p1, [1.0, 1.0]]);
 * </script><pre>
 * @example
 * // Create a line using three coordinates
 * var l1 = board.create('line', [1.0, -2.0, 3.0]);
 * </pre><div class="jxgbox" id="JXGcf45e462-f964-4ba4-be3a-c9db94e2593f" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex2_board = JXG.JSXGraph.initBoard('JXGcf45e462-f964-4ba4-be3a-c9db94e2593f', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var glex2_l1 = glex2_board.create('line', [1.0, -2.0, 3.0]);
 * </script><pre>
 * @example
 *         // Create a line (l2) as reflection of another line (l1)
 *         // reflection line
 *         var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *         var reflect = board.create('transform', [li], {type: 'reflect'});
 *
 *         var l1 = board.create('line', [1,-5,1]);
 *         var l2 = board.create('line', [l1, reflect]);
 *
 * </pre><div id="JXGJXGa00d7dd6-d38c-11e7-93b3-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGJXGa00d7dd6-d38c-11e7-93b3-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             // reflection line
 *             var li = board.create('line', [1,1,1], {strokeColor: '#aaaaaa'});
 *             var reflect = board.create('transform', [li], {type: 'reflect'});
 *
 *             var l1 = board.create('line', [1,-5,1]);
 *             var l2 = board.create('line', [l1, reflect]);
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var t = board.create('transform', [2, 1.5], {type: 'scale'});
 * var l1 = board.create('line', [1, -5, 1]);
 * var l2 = board.create('line', [l1, t]);
 *
 * </pre><div id="d16d5b58-6338-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('d16d5b58-6338-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var t = board.create('transform', [2, 1.5], {type: 'scale'});
 *     var l1 = board.create('line', [1, -5, 1]);
 *     var l2 = board.create('line', [l1, t]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * //create line between two points
 * var p1 = board.create('point', [0,0]);
 * var p2 = board.create('point', [2,2]);
 * var l1 = board.create('line', [p1,p2], {straightFirst:false, straightLast:false});
 * </pre><div id="d21d5b58-6338-11e8-9fb9-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('d21d5b58-6338-11e8-9fb9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var ex5p1 = board.create('point', [0,0]);
 *             var ex5p2 = board.create('point', [2,2]);
 *             var ex5l1 = board.create('line', [ex5p1,ex5p2], {straightFirst:false, straightLast:false});
 *     })();
 *
 * </script><pre>
 */
JXG.createLine = function (board, parents, attributes) {
    var ps, el, p1, p2, i, attr,
        c = [],
        doTransform = false,
        constrained = false,
        isDraggable;

    if (parents.length === 2) {
        // The line is defined by two points or coordinates of two points.
        // In the latter case, the points are created.
        attr = Type.copyAttributes(attributes, board.options, "line", 'point1');
        if (Type.isArray(parents[0]) && parents[0].length > 1) {
            p1 = board.create("point", parents[0], attr);
        } else if (Type.isString(parents[0]) || Type.isPoint(parents[0])) {
            p1 = board.select(parents[0]);
        } else if (Type.isFunction(parents[0]) && Type.isPoint(parents[0]())) {
            p1 = parents[0]();
            constrained = true;
        } else if (
            Type.isFunction(parents[0]) &&
            parents[0]().length &&
            parents[0]().length >= 2
        ) {
            p1 = JXG.createPoint(board, parents[0](), attr);
            constrained = true;
        } else if (Type.isObject(parents[0]) && Type.isTransformationOrArray(parents[1])) {
            doTransform = true;
            p1 = board.create("point", [parents[0].point1, parents[1]], attr);
        } else {
            throw new Error(
                "JSXGraph: Can't create line with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]], [a,b,c]"
            );
        }

        // point 2 given by coordinates
        attr = Type.copyAttributes(attributes, board.options, "line", 'point2');
        if (doTransform) {
            p2 = board.create("point", [parents[0].point2, parents[1]], attr);
        } else if (Type.isArray(parents[1]) && parents[1].length > 1) {
            p2 = board.create("point", parents[1], attr);
        } else if (Type.isString(parents[1]) || Type.isPoint(parents[1])) {
            p2 = board.select(parents[1]);
        } else if (Type.isFunction(parents[1]) && Type.isPoint(parents[1]())) {
            p2 = parents[1]();
            constrained = true;
        } else if (
            Type.isFunction(parents[1]) &&
            parents[1]().length &&
            parents[1]().length >= 2
        ) {
            p2 = JXG.createPoint(board, parents[1](), attr);
            constrained = true;
        } else {
            throw new Error(
                "JSXGraph: Can't create line with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]], [a,b,c]"
            );
        }

        attr = Type.copyAttributes(attributes, board.options, 'line');
        el = new JXG.Line(board, p1, p2, attr);

        if (constrained) {
            el.constrained = true;
            el.funp1 = parents[0];
            el.funp2 = parents[1];
        } else if (!doTransform) {
            el.isDraggable = true;
        }

        //if (!el.constrained) {
        el.setParents([p1.id, p2.id]);
        //}

    } else if (parents.length === 3) {
        // Free line:
        // Line is defined by three homogeneous coordinates.
        // Also in this case points are created.
        isDraggable = true;
        for (i = 0; i < 3; i++) {
            if (Type.isNumber(parents[i])) {
                // createFunction will just wrap a function around our constant number
                // that does nothing else but to return that number.
                c[i] = Type.createFunction(parents[i]);
            } else if (Type.isFunction(parents[i])) {
                c[i] = parents[i];
                isDraggable = false;
            } else {
                throw new Error(
                    "JSXGraph: Can't create line with parent types '" +
                    typeof parents[0] +
                    "' and '" +
                    typeof parents[1] +
                    "' and '" +
                    typeof parents[2] +
                    "'." +
                    "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]], [a,b,c]"
                );
            }
        }

        // point 1 is the midpoint between (0, c, -b) and point 2. => point1 is finite.
        attr = Type.copyAttributes(attributes, board.options, "line", 'point1');
        if (isDraggable) {
            p1 = board.create("point", [
                c[2]() * c[2]() + c[1]() * c[1](),
                c[2]() - c[1]() * c[0]() + c[2](),
                -c[1]() - c[2]() * c[0]() - c[1]()
            ], attr);
        } else {
            p1 = board.create("point", [
                function () {
                    return (c[2]() * c[2]() + c[1]() * c[1]()) * 0.5;
                },
                function () {
                    return (c[2]() - c[1]() * c[0]() + c[2]()) * 0.5;
                },
                function () {
                    return (-c[1]() - c[2]() * c[0]() - c[1]()) * 0.5;
                }
            ], attr);
        }

        // point 2: (b^2+c^2,-ba+c,-ca-b)
        attr = Type.copyAttributes(attributes, board.options, "line", 'point2');
        if (isDraggable) {
            p2 = board.create("point", [
                c[2]() * c[2]() + c[1]() * c[1](),
                -c[1]() * c[0]() + c[2](),
                -c[2]() * c[0]() - c[1]()
            ], attr);
        } else {
            p2 = board.create("point", [
                function () {
                    return c[2]() * c[2]() + c[1]() * c[1]();
                },
                function () {
                    return -c[1]() * c[0]() + c[2]();
                },
                function () {
                    return -c[2]() * c[0]() - c[1]();
                }
            ], attr);
        }

        // If the line will have a glider and board.suspendUpdate() has been called, we
        // need to compute the initial position of the two points p1 and p2.
        p1.prepareUpdate().update();
        p2.prepareUpdate().update();
        attr = Type.copyAttributes(attributes, board.options, 'line');
        el = new JXG.Line(board, p1, p2, attr);
        // Not yet working, because the points are not draggable.
        el.isDraggable = isDraggable;
        el.setParents([p1, p2]);

    } else if (
        // The parent array contains a function which returns two points.
        parents.length === 1 &&
        Type.isFunction(parents[0]) &&
        parents[0]().length === 2 &&
        Type.isPoint(parents[0]()[0]) &&
        Type.isPoint(parents[0]()[1])
    ) {
        ps = parents[0]();
        attr = Type.copyAttributes(attributes, board.options, 'line');
        el = new JXG.Line(board, ps[0], ps[1], attr);
        el.constrained = true;
        el.funps = parents[0];
        el.setParents(ps);
    } else if (
        parents.length === 1 &&
        Type.isFunction(parents[0]) &&
        parents[0]().length === 3 &&
        Type.isNumber(parents[0]()[0]) &&
        Type.isNumber(parents[0]()[1]) &&
        Type.isNumber(parents[0]()[2])
    ) {
        ps = parents[0];

        attr = Type.copyAttributes(attributes, board.options, "line", 'point1');
        p1 = board.create("point", [
            function () {
                var c = ps();

                return [
                    (c[2] * c[2] + c[1] * c[1]) * 0.5,
                    (c[2] - c[1] * c[0] + c[2]) * 0.5,
                    (-c[1] - c[2] * c[0] - c[1]) * 0.5
                ];
            }
        ], attr);

        attr = Type.copyAttributes(attributes, board.options, "line", 'point2');
        p2 = board.create("point", [
            function () {
                var c = ps();

                return [
                    c[2] * c[2] + c[1] * c[1],
                    -c[1] * c[0] + c[2],
                    -c[2] * c[0] - c[1]
                ];
            }
        ], attr);

        attr = Type.copyAttributes(attributes, board.options, 'line');
        el = new JXG.Line(board, p1, p2, attr);

        el.constrained = true;
        el.funps = parents[0];
        el.setParents([p1, p2]);
    } else {
        throw new Error(
            "JSXGraph: Can't create line with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]], [a,b,c]"
        );
    }

    return el;
};

JXG.registerElement("line", JXG.createLine);

/**
 * @class A (line) segment defined by two points.
 * It's strictly spoken just a wrapper for element {@link Line} with {@link Line#straightFirst}
 * and {@link Line#straightLast} properties set to false. If there is a third variable then the
 * segment has a fixed length (which may be a function, too) determined by the absolute value of
 * that number.
 * @pseudo
 * @name Segment
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array} point1,point2 Parent elements can be two elements either of type {@link JXG.Point}
 * or array of numbers describing the
 * coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * @param {number,function} [length] The points are adapted - if possible - such that their distance
 * is equal to the absolute value of this number.
 * @see Line
 * @example
 * // Create a segment providing two points.
 *   var p1 = board.create('point', [4.5, 2.0]);
 *   var p2 = board.create('point', [1.0, 1.0]);
 *   var l1 = board.create('segment', [p1, p2]);
 * </pre><div class="jxgbox" id="JXGd70e6aac-7c93-4525-a94c-a1820fa38e2f" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var slex1_board = JXG.JSXGraph.initBoard('JXGd70e6aac-7c93-4525-a94c-a1820fa38e2f', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var slex1_p1 = slex1_board.create('point', [4.5, 2.0]);
 *   var slex1_p2 = slex1_board.create('point', [1.0, 1.0]);
 *   var slex1_l1 = slex1_board.create('segment', [slex1_p1, slex1_p2]);
 * </script><pre>
 *
 * @example
 * // Create a segment providing two points.
 *   var p1 = board.create('point', [4.0, 1.0]);
 *   var p2 = board.create('point', [1.0, 1.0]);
 *   // AB
 *   var l1 = board.create('segment', [p1, p2]);
 *   var p3 = board.create('point', [4.0, 2.0]);
 *   var p4 = board.create('point', [1.0, 2.0]);
 *   // CD
 *   var l2 = board.create('segment', [p3, p4, 3]); // Fixed length
 *   var p5 = board.create('point', [4.0, 3.0]);
 *   var p6 = board.create('point', [1.0, 4.0]);
 *   // EF
 *   var l3 = board.create('segment', [p5, p6, function(){ return l1.L();} ]); // Fixed, but dependent length
 * </pre><div class="jxgbox" id="JXG617336ba-0705-4b2b-a236-c87c28ef25be" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var slex2_board = JXG.JSXGraph.initBoard('JXG617336ba-0705-4b2b-a236-c87c28ef25be', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var slex2_p1 = slex2_board.create('point', [4.0, 1.0]);
 *   var slex2_p2 = slex2_board.create('point', [1.0, 1.0]);
 *   var slex2_l1 = slex2_board.create('segment', [slex2_p1, slex2_p2]);
 *   var slex2_p3 = slex2_board.create('point', [4.0, 2.0]);
 *   var slex2_p4 = slex2_board.create('point', [1.0, 2.0]);
 *   var slex2_l2 = slex2_board.create('segment', [slex2_p3, slex2_p4, 3]);
 *   var slex2_p5 = slex2_board.create('point', [4.0, 2.0]);
 *   var slex2_p6 = slex2_board.create('point', [1.0, 2.0]);
 *   var slex2_l3 = slex2_board.create('segment', [slex2_p5, slex2_p6, function(){ return slex2_l1.L();}]);
 * </script><pre>
 *
 */
JXG.createSegment = function (board, parents, attributes) {
    var el, attr;

    attributes.straightFirst = false;
    attributes.straightLast = false;
    attr = Type.copyAttributes(attributes, board.options, 'segment');

    el = board.create("line", parents.slice(0, 2), attr);

    if (parents.length === 3) {
        try {
            el.hasFixedLength = true;
            el.fixedLengthOldCoords = [];
            el.fixedLengthOldCoords[0] = new Coords(
                Const.COORDS_BY_USER,
                el.point1.coords.usrCoords.slice(1, 3),
                board
            );
            el.fixedLengthOldCoords[1] = new Coords(
                Const.COORDS_BY_USER,
                el.point2.coords.usrCoords.slice(1, 3),
                board
            );

            el.setFixedLength(parents[2]);
        } catch (err) {
            throw new Error(
                "JSXGraph: Can't create segment with third parent type '" +
                typeof parents[2] +
                "'." +
                "\nPossible third parent types: number or function"
            );
        }
        // if (Type.isNumber(parents[2])) {
        //     el.fixedLength = function () {
        //         return parents[2];
        //     };
        // } else if (Type.isFunction(parents[2])) {
        //     el.fixedLength = Type.createFunction(parents[2], this.board);
        // } else {
        //     throw new Error(
        //         "JSXGraph: Can't create segment with third parent type '" +
        //             typeof parents[2] +
        //             "'." +
        //             "\nPossible third parent types: number or function"
        //     );
        // }

        el.getParents = function () {
            return this.parents.concat(this.fixedLength());
        };

    }

    el.elType = 'segment';

    return el;
};

JXG.registerElement("segment", JXG.createSegment);

/**
 * @class A segment with an arrow head.
 * This element is just a wrapper for element
 * {@link Line} with {@link Line#straightFirst}
 * and {@link Line#straightLast} properties set to false and {@link Line#lastArrow} set to true.
 * @pseudo
 * @name Arrow
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of numbers describing the
 * coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * @param {Number_Number_Number} a,b,c A line can also be created providing three numbers. The line is then described by the set of solutions
 * of the equation <tt>a*x+b*y+c*z = 0</tt>.
 * @see Line
 * @example
 * // Create an arrow providing two points.
 *   var p1 = board.create('point', [4.5, 2.0]);
 *   var p2 = board.create('point', [1.0, 1.0]);
 *   var l1 = board.create('arrow', [p1, p2]);
 * </pre><div class="jxgbox" id="JXG1d26bd22-7d6d-4018-b164-4c8bc8d22ccf" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var alex1_board = JXG.JSXGraph.initBoard('JXG1d26bd22-7d6d-4018-b164-4c8bc8d22ccf', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var alex1_p1 = alex1_board.create('point', [4.5, 2.0]);
 *   var alex1_p2 = alex1_board.create('point', [1.0, 1.0]);
 *   var alex1_l1 = alex1_board.create('arrow', [alex1_p1, alex1_p2]);
 * </script><pre>
 */
JXG.createArrow = function (board, parents, attributes) {
    var el, attr;

    attributes.straightFirst = false;
    attributes.straightLast = false;
    attr = Type.copyAttributes(attributes, board.options, 'arrow');
    el = board.create("line", parents, attr);
    //el.setArrow(false, true);
    el.type = Const.OBJECT_TYPE_VECTOR;
    el.elType = 'arrow';

    return el;
};

JXG.registerElement("arrow", JXG.createArrow);

/**
 * @class Axis is a line with optional ticks and labels.
 * It's strictly spoken just a wrapper for element {@link Line} with {@link Line#straightFirst}
 * and {@link Line#straightLast} properties set to true. Additionally {@link Line#lastArrow} is set to true and default {@link Ticks} will be created.
 * @pseudo
 * @name Axis
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array_JXG.Point,array} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of numbers describing the
 * coordinates of a point. In the latter case, the point will be constructed automatically as a fixed invisible point.
 * @param {Number_Number_Number} a,b,c A line can also be created providing three numbers. The line is then described by the set of solutions
 * of the equation <tt>a*x+b*y+c*z = 0</tt>.
 * @example
 * // Create an axis providing two coords pairs.
 *   var l1 = board.create('axis', [[0.0, 1.0], [1.0, 1.3]]);
 * </pre><div class="jxgbox" id="JXG4f414733-624c-42e4-855c-11f5530383ae" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var axex1_board = JXG.JSXGraph.initBoard('JXG4f414733-624c-42e4-855c-11f5530383ae', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var axex1_l1 = axex1_board.create('axis', [[0.0, 1.0], [1.0, 1.3]]);
 * </script><pre>
 * @example
 *  // Create ticks labels as fractions
 *  board.create('axis', [[0,1], [1,1]], {
 *      ticks: {
 *          label: {
 *              toFraction: true,
 *              useMathjax: false,
 *              anchorX: 'middle',
 *              offset: [0, -10]
 *          }
 *      }
 *  });
 *
 *
 * </pre><div id="JXG34174cc4-0050-4ab4-af69-e91365d0666f" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG34174cc4-0050-4ab4-af69-e91365d0666f',
 *             {boundingbox: [-1.2, 2.3, 1.2, -2.3], axis: true, showcopyright: false, shownavigation: false});
 *             board.create('axis', [[0,1], [1,1]], {
 *                 ticks: {
 *                     label: {
 *                         toFraction: true,
 *                         useMathjax: false,
 *                         anchorX: 'middle',
 *                         offset: [0, -10]
 *                     }
 *                 }
 *             });
 *
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createAxis = function (board, parents, attributes) {
    var axis, attr,
        ancestor, ticksDist;

    // Create line
    attr = Type.copyAttributes(attributes, board.options, 'axis');
    try {
        axis = board.create("line", parents, attr);
    } catch (err) {
        throw new Error(
            "JSXGraph: Can't create axis with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [point,point], [[x1,y1],[x2,y2]]"
        );
    }

    axis.type = Const.OBJECT_TYPE_AXIS;
    axis.isDraggable = false;
    axis.point1.isDraggable = false;
    axis.point2.isDraggable = false;

    // Save usrCoords of points
    axis._point1UsrCoordsOrg = axis.point1.coords.usrCoords.slice();
    axis._point2UsrCoordsOrg = axis.point2.coords.usrCoords.slice();

    for (ancestor in axis.ancestors) {
        if (axis.ancestors.hasOwnProperty(ancestor)) {
            axis.ancestors[ancestor].type = Const.OBJECT_TYPE_AXISPOINT;
        }
    }

    // Create ticks
    // attrTicks = attr.ticks;
    if (Type.exists(attr.ticks.ticksdistance)) {
        ticksDist = attr.ticks.ticksdistance;
    } else if (Type.isArray(attr.ticks.ticks)) {
        ticksDist = attr.ticks.ticks;
    } else {
        ticksDist = 1.0;
    }

    /**
     * The ticks attached to the axis.
     * @memberOf Axis.prototype
     * @name defaultTicks
     * @type JXG.Ticks
     */
    axis.defaultTicks = board.create("ticks", [axis, ticksDist], attr.ticks);
    axis.defaultTicks.dump = false;
    axis.elType = 'axis';
    axis.subs = {
        ticks: axis.defaultTicks
    };
    axis.inherits.push(axis.defaultTicks);

    axis.update = function () {
        var bbox,
            position, i,
            direction, horizontal, vertical,
            ticksAutoPos, ticksAutoPosThres, dist,
            anchor, left, right,
            distUsr,
            newPosP1, newPosP2,
            locationOrg,
            visLabel, anchr, off;

        if (!this.needsUpdate) {
            return this;
        }

        bbox = this.board.getBoundingBox();
        position = this.evalVisProp('position');
        direction = this.Direction();
        horizontal = this.isHorizontal();
        vertical = this.isVertical();
        ticksAutoPos = this.evalVisProp('ticksautopos');
        ticksAutoPosThres = this.evalVisProp('ticksautoposthreshold');

        if (horizontal) {
            ticksAutoPosThres = Type.parseNumber(ticksAutoPosThres, Math.abs(bbox[1] - bbox[3]), 1 / this.board.unitX) * this.board.unitX;
        } else if (vertical) {
            ticksAutoPosThres = Type.parseNumber(ticksAutoPosThres, Math.abs(bbox[1] - bbox[3]), 1 / this.board.unitY) * this.board.unitY;
        } else {
            ticksAutoPosThres = Type.parseNumber(ticksAutoPosThres, 1, 1);
        }

        anchor = this.evalVisProp('anchor');
        left = anchor.indexOf('left') > -1;
        right = anchor.indexOf('right') > -1;

        distUsr = this.evalVisProp('anchordist');
        if (horizontal) {
            distUsr = Type.parseNumber(distUsr, Math.abs(bbox[1] - bbox[3]), 1 / this.board.unitX);
        } else if (vertical) {
            distUsr = Type.parseNumber(distUsr, Math.abs(bbox[0] - bbox[2]), 1 / this.board.unitY);
        } else {
            distUsr = 0;
        }

        locationOrg = this.board.getPointLoc(this._point1UsrCoordsOrg, distUsr);

        // Set position of axis
        newPosP1 = this.point1.coords.usrCoords.slice();
        newPosP2 = this.point2.coords.usrCoords.slice();

        if (position === 'static' || (!vertical && !horizontal)) {
            // Do nothing

        } else if (position === 'fixed') {
            if (horizontal) { // direction[1] === 0
                if ((direction[0] > 0 && right) || (direction[0] < 0 && left)) {
                    newPosP1[2] = bbox[3] + distUsr;
                    newPosP2[2] = bbox[3] + distUsr;
                } else if ((direction[0] > 0 && left) || (direction[0] < 0 && right)) {
                    newPosP1[2] = bbox[1] - distUsr;
                    newPosP2[2] = bbox[1] - distUsr;

                } else {
                    newPosP1 = this._point1UsrCoordsOrg.slice();
                    newPosP2 = this._point2UsrCoordsOrg.slice();
                }
            }
            if (vertical) { // direction[0] === 0
                if ((direction[1] > 0 && left) || (direction[1] < 0 && right)) {
                    newPosP1[1] = bbox[0] + distUsr;
                    newPosP2[1] = bbox[0] + distUsr;

                } else if ((direction[1] > 0 && right) || (direction[1] < 0 && left)) {
                    newPosP1[1] = bbox[2] - distUsr;
                    newPosP2[1] = bbox[2] - distUsr;

                } else {
                    newPosP1 = this._point1UsrCoordsOrg.slice();
                    newPosP2 = this._point2UsrCoordsOrg.slice();
                }
            }

        } else if (position === 'sticky') {
            if (horizontal) { // direction[1] === 0
                if (locationOrg[1] < 0 && ((direction[0] > 0 && right) || (direction[0] < 0 && left))) {
                    newPosP1[2] = bbox[3] + distUsr;
                    newPosP2[2] = bbox[3] + distUsr;

                } else if (locationOrg[1] > 0 && ((direction[0] > 0 && left) || (direction[0] < 0 && right))) {
                    newPosP1[2] = bbox[1] - distUsr;
                    newPosP2[2] = bbox[1] - distUsr;

                } else {
                    newPosP1 = this._point1UsrCoordsOrg.slice();
                    newPosP2 = this._point2UsrCoordsOrg.slice();
                }
            }
            if (vertical) { // direction[0] === 0
                if (locationOrg[0] < 0 && ((direction[1] > 0 && left) || (direction[1] < 0 && right))) {
                    newPosP1[1] = bbox[0] + distUsr;
                    newPosP2[1] = bbox[0] + distUsr;

                } else if (locationOrg[0] > 0 && ((direction[1] > 0 && right) || (direction[1] < 0 && left))) {
                    newPosP1[1] = bbox[2] - distUsr;
                    newPosP2[1] = bbox[2] - distUsr;

                } else {
                    newPosP1 = this._point1UsrCoordsOrg.slice();
                    newPosP2 = this._point2UsrCoordsOrg.slice();
                }
            }
        }

        this.point1.setPositionDirectly(JXG.COORDS_BY_USER, newPosP1);
        this.point2.setPositionDirectly(JXG.COORDS_BY_USER, newPosP2);

        // Set position of tick labels
        if (Type.exists(this.defaultTicks)) {
            visLabel = this.defaultTicks.visProp.label;
            if (ticksAutoPos && (horizontal || vertical)) {

                if (!Type.exists(visLabel._anchorx_org)) {
                    visLabel._anchorx_org = Type.def(visLabel.anchorx, this.board.options.text.anchorX);
                }
                if (!Type.exists(visLabel._anchory_org)) {
                    visLabel._anchory_org = Type.def(visLabel.anchory, this.board.options.text.anchorY);
                }
                if (!Type.exists(visLabel._offset_org)) {
                    visLabel._offset_org = visLabel.offset.slice();
                }

                off = visLabel.offset;
                if (horizontal) {
                    dist = axis.point1.coords.scrCoords[2] - (this.board.canvasHeight * 0.5);

                    anchr = visLabel.anchory;

                    // The last position of the labels is stored in visLabel._side
                    if (dist < 0 && Math.abs(dist) > ticksAutoPosThres) {
                        // Put labels on top of the line
                        if (visLabel._side === 'bottom') {
                            // Switch position
                            if (visLabel.anchory === 'top') {
                                anchr = 'bottom';
                            }
                            off[1] *= -1;
                            visLabel._side = 'top';
                        }

                    } else if (dist > 0 && Math.abs(dist) > ticksAutoPosThres) {
                        // Put labels below the line
                        if (visLabel._side === 'top') {
                            // Switch position
                            if (visLabel.anchory === 'bottom') {
                                anchr = 'top';
                            }
                            off[1] *= -1;
                            visLabel._side = 'bottom';
                        }

                    } else {
                        // Put to original position
                        anchr = visLabel._anchory_org;
                        off = visLabel._offset_org.slice();

                        if (anchr === 'top') {
                            visLabel._side = 'bottom';
                        } else if (anchr === 'bottom') {
                            visLabel._side = 'top';
                        } else if (off[1] < 0) {
                            visLabel._side = 'bottom';
                        } else {
                            visLabel._side = 'top';
                        }
                    }

                    for (i = 0; i < axis.defaultTicks.labels.length; i++) {
                        this.defaultTicks.labels[i].visProp.anchory = anchr;
                    }
                    visLabel.anchory = anchr;

                } else if (vertical) {
                    dist = axis.point1.coords.scrCoords[1] - (this.board.canvasWidth * 0.5);

                    if (dist < 0 && Math.abs(dist) > ticksAutoPosThres) {
                        // Put labels to the left of the line
                        if (visLabel._side === 'right') {
                            // Switch position
                            if (visLabel.anchorx === 'left') {
                                anchr = 'right';
                            }
                            off[0] *= -1;
                            visLabel._side = 'left';
                        }

                    } else if (dist > 0 && Math.abs(dist) > ticksAutoPosThres) {
                        // Put labels to the right of the line
                        if (visLabel._side === 'left') {
                            // Switch position
                            if (visLabel.anchorx === 'right') {
                                anchr = 'left';
                            }
                            off[0] *= -1;
                            visLabel._side = 'right';
                        }

                    } else {
                        // Put to original position
                        anchr = visLabel._anchorx_org;
                        off = visLabel._offset_org.slice();

                        if (anchr === 'left') {
                            visLabel._side = 'right';
                        } else if (anchr === 'right') {
                            visLabel._side = 'left';
                        } else if (off[0] < 0) {
                            visLabel._side = 'left';
                        } else {
                            visLabel._side = 'right';
                        }
                    }

                    for (i = 0; i < axis.defaultTicks.labels.length; i++) {
                        this.defaultTicks.labels[i].visProp.anchorx = anchr;
                    }
                    visLabel.anchorx = anchr;
                }
                visLabel.offset = off;

            } else {
                delete visLabel._anchorx_org;
                delete visLabel._anchory_org;
                delete visLabel._offset_org;
            }
            this.defaultTicks.needsUpdate = true;
        }

        JXG.Line.prototype.update.call(this);

        return this;
    };

    return axis;
};

JXG.registerElement("axis", JXG.createAxis);

/**
 * @class The tangent line at a point on a line, circle, conic, turtle, or curve.
 * A tangent line is always constructed
 * by a point on a line, circle, or curve and describes the tangent in the point on that line, circle, or curve.
 * <p>
 * If the point is not on the object (line, circle, conic, curve, turtle) the output depends on the type of the object.
 * For conics and circles, the polar line will be constructed. For function graphs,
 * the tangent of the vertical projection of the point to the function graph is constructed. For all other objects, the tangent
 * in the orthogonal projection of the point to the object will be constructed.
 * @pseudo
 * @name Tangent
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Glider} g A glider on a line, circle, or curve.
 * @param {JXG.GeometryElement} [c] Optional element for which the tangent is constructed
 * @example
 * // Create a tangent providing a glider on a function graph
 *   var c1 = board.create('curve', [function(t){return t},function(t){return t*t*t;}]);
 *   var g1 = board.create('glider', [0.6, 1.2, c1]);
 *   var t1 = board.create('tangent', [g1]);
 * </pre><div class="jxgbox" id="JXG7b7233a0-f363-47dd-9df5-4018d0d17a98" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var tlex1_board = JXG.JSXGraph.initBoard('JXG7b7233a0-f363-47dd-9df5-4018d0d17a98', {boundingbox: [-6, 6, 6, -6], axis: true, showcopyright: false, shownavigation: false});
 *   var tlex1_c1 = tlex1_board.create('curve', [function(t){return t},function(t){return t*t*t;}]);
 *   var tlex1_g1 = tlex1_board.create('glider', [0.6, 1.2, tlex1_c1]);
 *   var tlex1_t1 = tlex1_board.create('tangent', [tlex1_g1]);
 * </script><pre>
 */
JXG.createTangent = function (board, parents, attributes) {
    var p, c, j, el, tangent, attr,
        getCurveTangentDir,
        res, isTransformed,
        slides = [];

    if (parents.length === 1) {
        // One argument: glider on line, circle or curve
        p = parents[0];
        c = p.slideObject;

    } else if (parents.length === 2) {
        // Two arguments: (point,line|curve|circle|conic) or (line|curve|circle|conic,point).
        // In fact, for circles and conics it is the polar
        if (Type.isPoint(parents[0])) {
            p = parents[0];
            c = parents[1];
        } else if (Type.isPoint(parents[1])) {
            c = parents[0];
            p = parents[1];
        } else {
            throw new Error(
                "JSXGraph: Can't create tangent with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [glider|point], [point,line|curve|circle|conic]"
            );
        }
    } else {
        throw new Error(
            "JSXGraph: Can't create tangent with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [glider|point], [point,line|curve|circle|conic]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'tangent');
    if (c.elementClass === Const.OBJECT_CLASS_LINE) {
        tangent = board.create("line", [c.point1, c.point2], attr);
        tangent.glider = p;
    } else if (
        c.elementClass === Const.OBJECT_CLASS_CURVE &&
        c.type !== Const.OBJECT_TYPE_CONIC
    ) {
        res = c.getTransformationSource();
        isTransformed = res[0];
        if (isTransformed) {
            // Curve is result of a transformation
            // We recursively collect all curves from which
            // the curve is transformed.
            slides.push(c);
            while (res[0] && Type.exists(res[1]._transformationSource)) {
                slides.push(res[1]);
                res = res[1].getTransformationSource();
            }
        }

        if (c.evalVisProp('curvetype') !== "plot" || isTransformed) {
            // Functiongraph or parametric curve or
            // transformed curve thereof.
            tangent = board.create(
                "line",
                [
                    function () {
                        var g = c.X,
                            f = c.Y,
                            df, dg,
                            li, i, c_org, invMat, po,
                            t;

                        if (p.type === Const.OBJECT_TYPE_GLIDER) {
                            t = p.position;
                        } else if (c.evalVisProp('curvetype') === 'functiongraph') {
                            t = p.X();
                        } else {
                            t = Geometry.projectPointToCurve(p, c, board)[1];
                        }

                        // po are the coordinates of the point
                        // on the "original" curve. That is the curve or
                        // the original curve which is transformed (maybe multiple times)
                        // to this curve.
                        // t is the position of the point on the "original" curve
                        po = p.Coords(true);
                        if (isTransformed) {
                            c_org = slides[slides.length - 1]._transformationSource;
                            g = c_org.X;
                            f = c_org.Y;
                            for (i = 0; i < slides.length; i++) {
                                slides[i].updateTransformMatrix();
                                invMat = Mat.inverse(slides[i].transformMat);
                                po = Mat.matVecMult(invMat, po);
                            }

                            if (p.type !== Const.OBJECT_TYPE_GLIDER) {
                                po[1] /= po[0];
                                po[2] /= po[0];
                                po[0] /= po[0];
                                t = Geometry.projectCoordsToCurve(po[1], po[2], 0, c_org, board)[1];
                            }
                        }

                        // li are the coordinates of the line on the "original" curve
                        df = Numerics.D(f)(t);
                        dg = Numerics.D(g)(t);
                        li = [
                            -po[1] * df + po[2] * dg,
                            po[0] * df,
                            -po[0] * dg
                        ];

                        if (isTransformed) {
                            // Transform the line to the transformed curve
                            for (i = slides.length - 1; i >= 0; i--) {
                                invMat = Mat.transpose(Mat.inverse(slides[i].transformMat));
                                li = Mat.matVecMult(invMat, li);
                            }
                        }

                        return li;
                    }
                ],
                attr
            );

            p.addChild(tangent);
            // this is required for the geogebra reader to display a slope
            tangent.glider = p;
        } else {
            // curveType 'plot': discrete data
            /**
             * @ignore
             *
             * In case of bezierDegree == 1:
             * Find two points p1, p2 enclosing the glider.
             * Then the equation of the line segment is: 0 = y*(x1-x2) + x*(y2-y1) + y1*x2-x1*y2,
             * which is the cross product of p1 and p2.
             *
             * In case of bezierDegree === 3:
             * The slope dy / dx of the tangent is determined. Then the
             * tangent is computed as cross product between
             * the glider p and [1, p.X() + dx, p.Y() + dy]
             *
             */
            getCurveTangentDir = function (position, c, num) {
                var i = Math.floor(position),
                    p1, p2, t, A, B, C, D, dx, dy, d,
                    points, le;

                if (c.bezierDegree === 1) {
                    if (i === c.numberPoints - 1) {
                        i--;
                    }
                } else if (c.bezierDegree === 3) {
                    // i is start of the Bezier segment
                    // t is the position in the Bezier segment
                    if (c.elType === 'sector') {
                        points = c.points.slice(3, c.numberPoints - 3);
                        le = points.length;
                    } else {
                        points = c.points;
                        le = points.length;
                    }
                    i = Math.floor((position * (le - 1)) / 3) * 3;
                    t = (position * (le - 1) - i) / 3;
                    if (i >= le - 1) {
                        i = le - 4;
                        t = 1;
                    }
                } else {
                    return 0;
                }

                if (i < 0) {
                    return 1;
                }

                // The curve points are transformed (if there is a transformation)
                // c.X(i) is not transformed.
                if (c.bezierDegree === 1) {
                    p1 = c.points[i].usrCoords;
                    p2 = c.points[i + 1].usrCoords;
                } else {
                    A = points[i].usrCoords;
                    B = points[i + 1].usrCoords;
                    C = points[i + 2].usrCoords;
                    D = points[i + 3].usrCoords;
                    dx = (1 - t) * (1 - t) * (B[1] - A[1]) +
                        2 * (1 - t) * t * (C[1] - B[1]) +
                        t * t * (D[1] - C[1]);
                    dy = (1 - t) * (1 - t) * (B[2] - A[2]) +
                        2 * (1 - t) * t * (C[2] - B[2]) +
                        t * t * (D[2] - C[2]);
                    d = Mat.hypot(dx, dy);
                    dx /= d;
                    dy /= d;
                    p1 = p.coords.usrCoords;
                    p2 = [1, p1[1] + dx, p1[2] + dy];
                }

                switch (num) {
                    case 0:
                        return p1[2] * p2[1] - p1[1] * p2[2];
                    case 1:
                        return p2[2] - p1[2];
                    case 2:
                        return p1[1] - p2[1];
                    default:
                        return [
                            p1[2] * p2[1] - p1[1] * p2[2],
                            p2[2] - p1[2],
                            p1[1] - p2[1]
                        ];
                }
            };

            tangent = board.create(
                "line",
                [
                    function () {
                        var t;

                        if (p.type === Const.OBJECT_TYPE_GLIDER) {
                            t = p.position;
                        } else {
                            t = Geometry.projectPointToCurve(p, c, board)[1];
                        }

                        return getCurveTangentDir(t, c);
                    }
                ],
                attr
            );

            p.addChild(tangent);
            // this is required for the geogebra reader to display a slope
            tangent.glider = p;
        }
    } else if (c.type === Const.OBJECT_TYPE_TURTLE) {
        tangent = board.create(
            "line",
            [
                function () {
                    var i, t;
                    if (p.type === Const.OBJECT_TYPE_GLIDER) {
                        t = p.position;
                    } else {
                        t = Geometry.projectPointToTurtle(p, c, board)[1];
                    }

                    i = Math.floor(t);

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];

                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i--;
                    }

                    if (i < 0) {
                        return [1, 0, 0];
                    }

                    return [
                        el.Y(i) * el.X(i + 1) - el.X(i) * el.Y(i + 1),
                        el.Y(i + 1) - el.Y(i),
                        el.X(i) - el.X(i + 1)
                    ];
                }
            ],
            attr
        );
        p.addChild(tangent);

        // this is required for the geogebra reader to display a slope
        tangent.glider = p;
    } else if (
        c.elementClass === Const.OBJECT_CLASS_CIRCLE ||
        c.type === Const.OBJECT_TYPE_CONIC
    ) {
        // If p is not on c, the tangent is the polar.
        // This construction should work on conics, too. p has to lie on c.
        tangent = board.create(
            "line",
            [
                function () {
                    return Mat.matVecMult(c.quadraticform, p.coords.usrCoords);
                }
            ],
            attr
        );

        p.addChild(tangent);
        // this is required for the geogebra reader to display a slope
        tangent.glider = p;
    }

    if (!Type.exists(tangent)) {
        throw new Error("JSXGraph: Couldn't create tangent with the given parents.");
    }

    tangent.elType = 'tangent';
    tangent.type = Const.OBJECT_TYPE_TANGENT;
    tangent.setParents(parents);

    return tangent;
};

/**
 * @class A normal is the line perpendicular to a line or to a tangent of a circle or curve.
 * @pseudo
 * @description A normal is a line through a given point on an element of type line, circle, curve, or turtle and orthogonal to that object.
 * @constructor
 * @name Normal
 * @type JXG.Line
 * @augments JXG.Line
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Line,JXG.Circle,JXG.Curve,JXG.Turtle_JXG.Point} o,p The constructed line contains p which lies on the object and is orthogonal
 * to the tangent to the object in the given point.
 * @param {Glider} p Works like above, however the object is given by {@link JXG.CoordsElement#slideObject}.
 * @example
 * // Create a normal to a circle.
 * var p1 = board.create('point', [2.0, 2.0]);
 * var p2 = board.create('point', [3.0, 2.0]);
 * var c1 = board.create('circle', [p1, p2]);
 *
 * var norm1 = board.create('normal', [c1, p2]);
 * </pre><div class="jxgbox" id="JXG4154753d-3d29-40fb-a860-0b08aa4f3743" style="width: 400px; height: 400px;"></div>
 * <script type="text/javascript">
 *   var nlex1_board = JXG.JSXGraph.initBoard('JXG4154753d-3d29-40fb-a860-0b08aa4f3743', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var nlex1_p1 = nlex1_board.create('point', [2.0, 2.0]);
 *   var nlex1_p2 = nlex1_board.create('point', [3.0, 2.0]);
 *   var nlex1_c1 = nlex1_board.create('circle', [nlex1_p1, nlex1_p2]);
 *
 *   // var nlex1_p3 = nlex1_board.create('point', [1.0, 2.0]);
 *   var nlex1_norm1 = nlex1_board.create('normal', [nlex1_c1, nlex1_p2]);
 * </script><pre>
 */
JXG.createNormal = function (board, parents, attributes) {
    var p, c, l, i, attr, pp, attrp,
        getCurveNormalDir,
        res, isTransformed,
        slides = [];

    for (i = 0; i < parents.length; ++i) {
        parents[i] = board.select(parents[i]);
    }
    // One arguments: glider on line, circle or curve
    if (parents.length === 1) {
        p = parents[0];
        c = p.slideObject;
        // Two arguments: (point,line), (point,circle), (line,point) or (circle,point)
    } else if (parents.length === 2) {
        if (Type.isPointType(board, parents[0])) {
            p = Type.providePoints(board, [parents[0]], attributes, 'point')[0];
            c = parents[1];
        } else if (Type.isPointType(board, parents[1])) {
            c = parents[0];
            p = Type.providePoints(board, [parents[1]], attributes, 'point')[0];
        } else {
            throw new Error(
                "JSXGraph: Can't create normal with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [point,line], [point,circle], [glider]"
            );
        }
    } else {
        throw new Error(
            "JSXGraph: Can't create normal with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [point,line], [point,circle], [glider]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'normal');
    if (c.elementClass === Const.OBJECT_CLASS_LINE) {
        // Private point
        attrp = Type.copyAttributes(attributes, board.options, "normal", 'point');
        pp = board.create(
            "point",
            [
                function () {
                    var p = Mat.crossProduct([1, 0, 0], c.stdform);
                    return [p[0], -p[2], p[1]];
                }
            ],
            attrp
        );
        pp.isDraggable = true;

        l = board.create("line", [p, pp], attr);

        /**
         * A helper point used to create a normal to a {@link JXG.Line} object. For normals to circles or curves this
         * element is <tt>undefined</tt>.
         * @type JXG.Point
         * @name point
         * @memberOf Normal.prototype
         */
        l.point = pp;
        l.subs = {
            point: pp
        };
        l.inherits.push(pp);
    } else if (c.elementClass === Const.OBJECT_CLASS_CIRCLE) {
        l = board.create("line", [c.midpoint, p], attr);
    } else if (c.elementClass === Const.OBJECT_CLASS_CURVE) {
        res = c.getTransformationSource();
        isTransformed = res[0];
        if (isTransformed) {
            // Curve is result of a transformation
            // We recursively collect all curves from which
            // the curve is transformed.
            slides.push(c);
            while (res[0] && Type.exists(res[1]._transformationSource)) {
                slides.push(res[1]);
                res = res[1].getTransformationSource();
            }
        }

        if (c.evalVisProp('curvetype') !== "plot" || isTransformed) {
            // Functiongraph or parametric curve or
            // transformed curve thereof.
            l = board.create(
                "line",
                [
                    function () {
                        var g = c.X,
                            f = c.Y,
                            df, dg,
                            li, i, c_org, invMat, po,
                            t;

                        if (p.type === Const.OBJECT_TYPE_GLIDER) {
                            t = p.position;
                        } else if (c.evalVisProp('curvetype') === 'functiongraph') {
                            t = p.X();
                        } else {
                            t = Geometry.projectPointToCurve(p, c, board)[1];
                        }

                        // po are the coordinates of the point
                        // on the "original" curve. That is the curve or
                        // the original curve which is transformed (maybe multiple times)
                        // to this curve.
                        // t is the position of the point on the "original" curve
                        po = p.Coords(true);
                        if (isTransformed) {
                            c_org = slides[slides.length - 1]._transformationSource;
                            g = c_org.X;
                            f = c_org.Y;
                            for (i = 0; i < slides.length; i++) {
                                slides[i].updateTransformMatrix();
                                invMat = Mat.inverse(slides[i].transformMat);
                                po = Mat.matVecMult(invMat, po);
                            }

                            if (p.type !== Const.OBJECT_TYPE_GLIDER) {
                                po[1] /= po[0];
                                po[2] /= po[0];
                                po[0] /= po[0];
                                t = Geometry.projectCoordsToCurve(po[1], po[2], 0, c_org, board)[1];
                            }
                        }

                        df = Numerics.D(f)(t);
                        dg = Numerics.D(g)(t);
                        li = [
                            -po[1] * dg - po[2] * df,
                            po[0] * dg,
                            po[0] * df
                        ];

                        if (isTransformed) {
                            // Transform the line to the transformed curve
                            for (i = slides.length - 1; i >= 0; i--) {
                                invMat = Mat.transpose(Mat.inverse(slides[i].transformMat));
                                li = Mat.matVecMult(invMat, li);
                            }
                        }

                        return li;
                    }
                ],
                attr
            );
        } else {
            // curveType 'plot': discrete data
            getCurveNormalDir = function (position, c, num) {
                var i = Math.floor(position),
                    lbda,
                    p1, p2, t, A, B, C, D, dx, dy, d,
                    li, p_org, pp,
                    points, le;


                if (c.bezierDegree === 1) {
                    if (i === c.numberPoints - 1) {
                        i--;
                    }
                    t = position;
                } else if (c.bezierDegree === 3) {
                    // i is start of the Bezier segment
                    // t is the position in the Bezier segment
                    if (c.elType === 'sector') {
                        points = c.points.slice(3, c.numberPoints - 3);
                        le = points.length;
                    } else {
                        points = c.points;
                        le = points.length;
                    }
                    i = Math.floor((position * (le - 1)) / 3) * 3;
                    t = (position * (le - 1) - i) / 3;
                    if (i >= le - 1) {
                        i = le - 4;
                        t = 1;
                    }
                } else {
                    return 0;
                }

                if (i < 0) {
                    return 1;
                }

                lbda = t - i;
                if (c.bezierDegree === 1) {
                    p1 = c.points[i].usrCoords;
                    p2 = c.points[i + 1].usrCoords;
                    p_org = [
                        p1[0] + lbda * (p2[0] - p1[0]),
                        p1[1] + lbda * (p2[1] - p1[1]),
                        p1[2] + lbda * (p2[2] - p1[2])
                    ];
                    li = Mat.crossProduct(p1, p2);
                    pp = Mat.crossProduct([1, 0, 0], li);
                    pp = [pp[0], -pp[2], pp[1]];
                    li = Mat.crossProduct(p_org, pp);

                } else {
                    A = points[i].usrCoords;
                    B = points[i + 1].usrCoords;
                    C = points[i + 2].usrCoords;
                    D = points[i + 3].usrCoords;
                    dx =
                        (1 - t) * (1 - t) * (B[1] - A[1]) +
                        2 * (1 - t) * t * (C[1] - B[1]) +
                        t * t * (D[1] - C[1]);
                    dy =
                        (1 - t) * (1 - t) * (B[2] - A[2]) +
                        2 * (1 - t) * t * (C[2] - B[2]) +
                        t * t * (D[2] - C[2]);
                    d = Mat.hypot(dx, dy);
                    dx /= d;
                    dy /= d;
                    p1 = p.coords.usrCoords;
                    p2 = [1, p1[1] - dy, p1[2] + dx];

                    li = [
                        p1[2] * p2[1] - p1[1] * p2[2],
                        p2[2] - p1[2],
                        p1[1] - p2[1]
                    ];
                }

                switch (num) {
                    case 0:
                        return li[0];
                    case 1:
                        return li[1];
                    case 2:
                        return li[2];
                    default:
                        return li;
                }
            };

            l = board.create(
                "line",
                [
                    function () {
                        var t;

                        if (p.type === Const.OBJECT_TYPE_GLIDER) {
                            t = p.position;
                        } else {
                            t = Geometry.projectPointToCurve(p, c, board)[1];
                        }

                        return getCurveNormalDir(t, c);
                    }
                ],
                attr
            );
            p.addChild(l);
            l.glider = p;
        }
    } else if (c.type === Const.OBJECT_TYPE_TURTLE) {
        l = board.create(
            "line",
            [
                function () {
                    var el,
                        j,
                        i = Math.floor(p.position),
                        lbda = p.position - i;

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];

                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -= 1;
                        lbda = 1;
                    }

                    if (i < 0) {
                        return 1;
                    }

                    return (
                        (el.Y(i) + lbda * (el.Y(i + 1) - el.Y(i))) * (el.Y(i) - el.Y(i + 1)) -
                        (el.X(i) + lbda * (el.X(i + 1) - el.X(i))) * (el.X(i + 1) - el.X(i))
                    );
                },
                function () {
                    var el,
                        j,
                        i = Math.floor(p.position);

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];
                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -= 1;
                    }

                    if (i < 0) {
                        return 0;
                    }

                    return el.X(i + 1) - el.X(i);
                },
                function () {
                    var el,
                        j,
                        i = Math.floor(p.position);

                    // run through all curves of this turtle
                    for (j = 0; j < c.objects.length; j++) {
                        el = c.objects[j];
                        if (el.type === Const.OBJECT_TYPE_CURVE) {
                            if (i < el.numberPoints) {
                                break;
                            }

                            i -= el.numberPoints;
                        }
                    }

                    if (i === el.numberPoints - 1) {
                        i -= 1;
                    }

                    if (i < 0) {
                        return 0;
                    }

                    return el.Y(i + 1) - el.Y(i);
                }
            ],
            attr
        );
    } else {
        throw new Error(
            "JSXGraph: Can't create normal with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent types: [point,line], [point,circle], [glider]"
        );
    }

    l.elType = 'normal';
    l.setParents(parents);

    if (Type.exists(p._is_new)) {
        l.addChild(p);
        delete p._is_new;
    } else {
        p.addChild(l);
    }
    c.addChild(l);

    return l;
};

/**
 * @class The radical axis is the line connecting the two interstion points of two circles with distinct centers.
 * The angular bisector of the polar lines of the circle centers with respect to the other circle is always the radical axis.
 * The radical axis passes through the intersection points when the circles intersect.
 * When a circle about the midpoint of circle centers, passing through the circle centers, intersects the circles, the polar lines pass through those intersection points.
 * @pseudo
 * @name RadicalAxis
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Circle} circle one of the two respective circles.
 * @param {JXG.Circle} circle the other of the two respective circles.
 * @example
 * // Create the radical axis line with respect to two circles
 *   var board = JXG.JSXGraph.initBoard('7b7233a0-f363-47dd-9df5-5018d0d17a98', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var p1 = board.create('point', [2, 3]);
 *   var p2 = board.create('point', [1, 4]);
 *   var c1 = board.create('circle', [p1, p2]);
 *   var p3 = board.create('point', [6, 5]);
 *   var p4 = board.create('point', [8, 6]);
 *   var c2 = board.create('circle', [p3, p4]);
 *   var r1 = board.create('radicalaxis', [c1, c2]);
 * </pre><div class="jxgbox" id="JXG7b7233a0-f363-47dd-9df5-5018d0d17a98" class="jxgbox" style="width:400px; height:400px;"></div>
 * <script type='text/javascript'>
 *   var rlex1_board = JXG.JSXGraph.initBoard('JXG7b7233a0-f363-47dd-9df5-5018d0d17a98', {boundingbox: [-1, 9, 9, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var rlex1_p1 = rlex1_board.create('point', [2, 3]);
 *   var rlex1_p2 = rlex1_board.create('point', [1, 4]);
 *   var rlex1_c1 = rlex1_board.create('circle', [rlex1_p1, rlex1_p2]);
 *   var rlex1_p3 = rlex1_board.create('point', [6, 5]);
 *   var rlex1_p4 = rlex1_board.create('point', [8, 6]);
 *   var rlex1_c2 = rlex1_board.create('circle', [rlex1_p3, rlex1_p4]);
 *   var rlex1_r1 = rlex1_board.create('radicalaxis', [rlex1_c1, rlex1_c2]);
 * </script><pre>
 */
JXG.createRadicalAxis = function (board, parents, attributes) {
    var el, el1, el2;

    if (
        parents.length !== 2 ||
        parents[0].elementClass !== Const.OBJECT_CLASS_CIRCLE ||
        parents[1].elementClass !== Const.OBJECT_CLASS_CIRCLE
    ) {
        // Failure
        throw new Error(
            "JSXGraph: Can't create 'radical axis' with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent type: [circle,circle]"
        );
    }

    el1 = board.select(parents[0]);
    el2 = board.select(parents[1]);

    el = board.create(
        "line",
        [
            function () {
                var a = el1.stdform,
                    b = el2.stdform;

                return Mat.matVecMult(Mat.transpose([a.slice(0, 3), b.slice(0, 3)]), [
                    b[3],
                    -a[3]
                ]);
            }
        ],
        attributes
    );

    el.elType = 'radicalaxis';
    el.setParents([el1.id, el2.id]);

    el1.addChild(el);
    el2.addChild(el);

    return el;
};

/**
 * @class The polar line of a point with respect to a conic or a circle.
 * @pseudo
 * @description The polar line is the unique reciprocal relationship of a point with respect to a conic.
 * The lines through the intersections of a conic and the polar line of a point
 * with respect to that conic and through that point are tangent to the conic.
 * A point on a conic has the polar line of that point with respect to that
 * conic as the tangent line to that conic at that point.
 * See {@link https://en.wikipedia.org/wiki/Pole_and_polar} for more information on pole and polar.
 * @name PolarLine
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Conic,JXG.Circle_JXG.Point} el1,el2 or
 * @param {JXG.Point_JXG.Conic,JXG.Circle} el1,el2 The result will be the polar line of the point with respect to the conic or the circle.
 * @example
 * // Create the polar line of a point with respect to a conic
 * var p1 = board.create('point', [-1, 2]);
 * var p2 = board.create('point', [ 1, 4]);
 * var p3 = board.create('point', [-1,-2]);
 * var p4 = board.create('point', [ 0, 0]);
 * var p5 = board.create('point', [ 4,-2]);
 * var c1 = board.create('conic',[p1,p2,p3,p4,p5]);
 * var p6 = board.create('point', [-1, 1]);
 * var l1 = board.create('polarline', [c1, p6]);
 * </pre><div class="jxgbox" id="JXG7b7233a0-f363-47dd-9df5-6018d0d17a98" class="jxgbox" style="width:400px; height:400px;"></div>
 * <script type='text/javascript'>
 * var plex1_board = JXG.JSXGraph.initBoard('JXG7b7233a0-f363-47dd-9df5-6018d0d17a98', {boundingbox: [-3, 5, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 * var plex1_p1 = plex1_board.create('point', [-1, 2]);
 * var plex1_p2 = plex1_board.create('point', [ 1, 4]);
 * var plex1_p3 = plex1_board.create('point', [-1,-2]);
 * var plex1_p4 = plex1_board.create('point', [ 0, 0]);
 * var plex1_p5 = plex1_board.create('point', [ 4,-2]);
 * var plex1_c1 = plex1_board.create('conic',[plex1_p1,plex1_p2,plex1_p3,plex1_p4,plex1_p5]);
 * var plex1_p6 = plex1_board.create('point', [-1, 1]);
 * var plex1_l1 = plex1_board.create('polarline', [plex1_c1, plex1_p6]);
 * </script><pre>
 * @example
 * // Create the polar line of a point with respect to a circle.
 * var p1 = board.create('point', [ 1, 1]);
 * var p2 = board.create('point', [ 2, 3]);
 * var c1 = board.create('circle',[p1,p2]);
 * var p3 = board.create('point', [ 6, 6]);
 * var l1 = board.create('polarline', [c1, p3]);
 * </pre><div class="jxgbox" id="JXG7b7233a0-f363-47dd-9df5-7018d0d17a98" class="jxgbox" style="width:400px; height:400px;"></div>
 * <script type='text/javascript'>
 * var plex2_board = JXG.JSXGraph.initBoard('JXG7b7233a0-f363-47dd-9df5-7018d0d17a98', {boundingbox: [-3, 7, 7, -3], axis: true, showcopyright: false, shownavigation: false});
 * var plex2_p1 = plex2_board.create('point', [ 1, 1]);
 * var plex2_p2 = plex2_board.create('point', [ 2, 3]);
 * var plex2_c1 = plex2_board.create('circle',[plex2_p1,plex2_p2]);
 * var plex2_p3 = plex2_board.create('point', [ 6, 6]);
 * var plex2_l1 = plex2_board.create('polarline', [plex2_c1, plex2_p3]);
 * </script><pre>
 */
JXG.createPolarLine = function (board, parents, attributes) {
    var el,
        el1,
        el2,
        firstParentIsConic,
        secondParentIsConic,
        firstParentIsPoint,
        secondParentIsPoint;

    if (parents.length > 1) {
        firstParentIsConic =
            parents[0].type === Const.OBJECT_TYPE_CONIC ||
            parents[0].elementClass === Const.OBJECT_CLASS_CIRCLE;
        secondParentIsConic =
            parents[1].type === Const.OBJECT_TYPE_CONIC ||
            parents[1].elementClass === Const.OBJECT_CLASS_CIRCLE;

        firstParentIsPoint = Type.isPoint(parents[0]);
        secondParentIsPoint = Type.isPoint(parents[1]);
    }

    if (
        parents.length !== 2 ||
        !(
            (firstParentIsConic && secondParentIsPoint) ||
            (firstParentIsPoint && secondParentIsConic)
        )
    ) {
        // Failure
        throw new Error(
            "JSXGraph: Can't create 'polar line' with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "'." +
            "\nPossible parent type: [conic|circle,point], [point,conic|circle]"
        );
    }

    if (secondParentIsPoint) {
        el1 = board.select(parents[0]);
        el2 = board.select(parents[1]);
    } else {
        el1 = board.select(parents[1]);
        el2 = board.select(parents[0]);
    }

    // Polar lines have been already provided in the tangent element.
    el = board.create("tangent", [el1, el2], attributes);

    el.elType = 'polarline';
    return el;
};

/**
 *
 * @class One of the two tangent lines to a conic or a circle through an external point.
 * @pseudo
 * @description Construct the tangent line through a point to a conic or a circle. There will be either two, one or no
 * such tangent, depending if the point is outside of the conic, on the conic, or inside of the conic.
 * Similar to the intersection of a line with a circle, the specific tangent can be chosen with a third (optional) parameter
 * <i>number</i>.
 * <p>
 * Attention: from a technical point of view, the point from which the tangent to the conic/circle is constructed is not an element of
 * the tangent line.
 * @name TangentTo
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Conic,JXG.Circle_JXG.Point_Number} conic,point,[number=0] The result will be the tangent line through
 * the point with respect to the conic or circle.
 *
 * @example
 *  var c = board.create('circle', [[3, 0], [3, 4]]);
 *  var p = board.create('point', [0, 6]);
 *  var t0 = board.create('tangentto', [c, p, 0], { color: 'black', polar: {visible: true}, point: {visible: true} });
 *  var t1 = board.create('tangentto', [c, p, 1], { color: 'black' });
 *
 * </pre><div id="JXGd4b359c7-3a29-44c3-a19d-d51b42a00c8b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGd4b359c7-3a29-44c3-a19d-d51b42a00c8b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var c = board.create('circle', [[3, 0], [3, 4]]);
 *             var p = board.create('point', [0, 6]);
 *             var t0 = board.create('tangentto', [c, p, 0], { color: 'black', polar: {visible: true}, point: {visible: true} });
 *             var t1 = board.create('tangentto', [c, p, 1], { color: 'black' });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *  var p = board.create('point', [0, 6]);
 *  var ell = board.create('ellipse', [[-5, 1], [-2, -1], [-3, 2]]);
 *  var t0 = board.create('tangentto', [ell, p, 0]);
 *  var t1 = board.create('tangentto', [ell, p, 1]);
 *
 * </pre><div id="JXG6e625663-1c3e-4e08-a9df-574972a374e8" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG6e625663-1c3e-4e08-a9df-574972a374e8',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var p = board.create('point', [0, 6]);
 *             var ell = board.create('ellipse', [[-5, 1], [-2, -1], [-3, 2]]);
 *             var t0 = board.create('tangentto', [ell, p, 0]);
 *             var t1 = board.create('tangentto', [ell, p, 1]);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createTangentTo = function (board, parents, attributes) {
    var el, attr,
        conic, pointFrom, num,
        intersect, polar;

    conic = board.select(parents[0]);
    pointFrom = Type.providePoints(board, parents[1], attributes, 'point')[0];
    num = Type.def(parents[2], 0);

    if (
        (conic.type !== Const.OBJECT_TYPE_CIRCLE && conic.type !== Const.OBJECT_TYPE_CONIC) ||
        (pointFrom.elementClass !== Const.OBJECT_CLASS_POINT)
    ) {
        throw new Error(
            "JSXGraph: Can't create tangentto with parent types '" +
            typeof parents[0] +
            "' and '" +
            typeof parents[1] +
            "' and '" +
            typeof parents[2] +
            "'." +
            "\nPossible parent types: [circle|conic,point,number]"
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'tangentto');
    // A direct analytic geometry approach would be in
    // Richter-Gebert: Perspectives on projective geometry, 11.3
    polar = board.create('polar', [conic, pointFrom], attr.polar);
    intersect = board.create('intersection', [polar, conic, num], attr.point);

    el = board.create('tangent', [conic, intersect], attr);

    /**
     * The intersection point of the conic/circle with the polar line of the tangentto construction.
     * @memberOf TangentTo.prototype
     * @name point
     * @type JXG.Point
     */
    el.point = intersect;

    /**
     * The polar line of the tangentto construction.
     * @memberOf TangentTo.prototype
     * @name polar
     * @type JXG.Line
     */
    el.polar = polar;

    el.elType = 'tangentto';

    return el;
};

/**
 * Register the element type tangent at JSXGraph
 * @private
 */
JXG.registerElement("tangent", JXG.createTangent);
JXG.registerElement("normal", JXG.createNormal);
JXG.registerElement('tangentto', JXG.createTangentTo);
JXG.registerElement("polar", JXG.createTangent);
JXG.registerElement("radicalaxis", JXG.createRadicalAxis);
JXG.registerElement("polarline", JXG.createPolarLine);

export default JXG.Line;
// export default {
//     Line: JXG.Line,
//     createLine: JXG.createLine,
//     createTangent: JXG.createTangent,
//     createPolar: JXG.createTangent,
//     createSegment: JXG.createSegment,
//     createAxis: JXG.createAxis,
//     createArrow: JXG.createArrow,
//     createRadicalAxis: JXG.createRadicalAxis,
//     createPolarLine: JXG.createPolarLine
// };
