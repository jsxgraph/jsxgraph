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
            var x,
                b = this.stdform[2];

            x =
                Math.abs(this.point1.coords.usrCoords[0]) > Mat.eps
                    ? this.point1.coords.usrCoords[1]
                    : this.point2.coords.usrCoords[1];

            t = (t - 0.5) * 2;

            return (1 - Math.abs(t)) * x - t * b;
        },

        /**
         * Treat the line as parametric curve in homogeneous coordinates.
         * See {@link JXG.Line#X} for a detailed description.
         * @param {Number} t Parameter running from 0 to 1.
         * @returns {Number} Y(t) y-coordinate of the line treated as parametric curve.
         */
        Y: function (t) {
            var y,
                a = this.stdform[1];

            y =
                Math.abs(this.point1.coords.usrCoords[0]) > Mat.eps
                    ? this.point1.coords.usrCoords[2]
                    : this.point2.coords.usrCoords[2];

            t = (t - 0.5) * 2;

            return (1 - Math.abs(t)) * y + t * a;
        },

        /**
         * Treat the line as parametric curve in homogeneous coordinates.
         * See {@link JXG.Line#X} for a detailed description.
         *
         * @param {Number} t Parameter running from 0 to 1.
         * @returns {Number} Z(t) z-coordinate of the line treated as parametric curve.
         */
        Z: function (t) {
            var z =
                Math.abs(this.point1.coords.usrCoords[0]) > Mat.eps
                    ? this.point1.coords.usrCoords[0]
                    : this.point2.coords.usrCoords[0];

            t = (t - 0.5) * 2;

            return (1 - Math.abs(t)) * z;
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
 * @typedef {(JXG.Point|array|function)} PointLike Point, array, or function returning an array
 */
/**
 * @typedef {(Number|function)} NumberLike Number or function returning a number
 */

//  * @param {PointLike} point1 The first points
//  * @param {JXG.Point,array,function_JXG.Point,array,function} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of
//  * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
//  * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
//  * @param {Number,function_Number,function_Number,function} a,b,c A line can also be created providing three numbers. The line is then described by
//  * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
//  * It is possible to provide three functions returning numbers, too.
//  * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
/**
 * @class JSXGraph Line class: A general line is given by two points or three coordinates.
 * By setting additional properties a line can be used as an arrow and/or axis.
 * @pseudo
 * @name Line
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * 
 * @param {PointLike} point1 Parent elements can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
 * @param {PointLike} point2 Parent elements can be two elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
 * 
 * @param {NumberLike} a A line can also be created providing three numbers. The line is then described by
 * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
 * It is possible to provide three functions returning numbers, too.
 * @param {NumberLike} b A line can also be created providing three numbers. The line is then described by
 * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
 * It is possible to provide three functions returning numbers, too.
 * @param {NumberLike} c A line can also be created providing three numbers. The line is then described by
 * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
 * It is possible to provide three functions returning numbers, too.
 * ---
 * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
 * 
 * 
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

export default JXG.Line;
