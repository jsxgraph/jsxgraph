/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, console: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 options
 math/math
 math/geometry
 math/numerics
 base/coords
 base/constants
 base/element
 parser/geonext
 utils/type
  elements:
   transform
 */

/**
 * @fileoverview The geometry object CoordsElement is defined in this file.
 * This object provides the coordinate handling of points, images and texts.
 */

define([
    'jxg', 'options', 'math/math', 'math/geometry', 'math/numerics', 'math/statistics', 'base/coords', 'base/constants', 'base/element',
    'parser/geonext', 'utils/type', 'base/transformation'
], function (JXG, Options, Mat, Geometry, Numerics, Statistics, Coords, Const, GeometryElement, GeonextParser, Type, Transform) {

    "use strict";

    /**
     * An element containing coords is the basic geometric element. Based on points lines and circles can be constructed which can be intersected
     * which in turn are points again which can be used to construct new lines, circles, polygons, etc. This class holds methods for
     * all kind of coordinate elements like points, texts and images.
     * @class Creates a new coords element object. Do not use this constructor to create an element. 
     * 
     * @private
     * @augments JXG.GeometryElement
     * @param {Array} coordinates An array with the affine user coordinates of the point.
     * {@link JXG.Options#elements}, and - optionally - a name and an id.
     */
    JXG.CoordsElement = function (coordinates, isLabel) {
        var i;

        if (!Type.exists(coordinates)) {
            coordinates = [1, 0, 0];
        }

        for (i = 0; i < coordinates.length; ++i) {
            coordinates[i] = parseFloat(coordinates[i]);
        }

        /**
         * Coordinates of the element.
         * @type JXG.Coords
         * @private
         */
        this.coords = new Coords(Const.COORDS_BY_USER, coordinates, this.board);
        this.initialCoords = new Coords(Const.COORDS_BY_USER, coordinates, this.board);

        /**
         * Relative position on a slide element (line, circle, curve) if element is a glider on this element.
         * @type Number
         * @private
         */
        this.position = null;

        /**
         * Determines whether the element slides on a polygon if point is a glider.
         * @type boolean
         * @default false
         * @private
         */
        this.onPolygon = false;

        /**
         * When used as a glider this member stores the object, where to glide on.
         * To set the object to glide on use the method
         * {@link JXG.Point#makeGlider} and DO NOT set this property directly
         * as it will break the dependency tree.
         * @type JXG.GeometryElement
         * @name Glider#slideObject
         */
        this.slideObject = null;

        /**
         * List of elements the element is bound to, i.e. the element glides on.
         * Only the last entry is active.
         * Use {@link JXG.Point#popSlideObject} to remove the currently active slideObject.
         */
        this.slideObjects = [];

        /**
         * A {@link JXG.CoordsElement#updateGlider} call is usually followed
         * by a general {@link JXG.Board#update} which calls
         * {@link JXG.CoordsElement#updateGliderFromParent}.
         * To prevent double updates, {@link JXG.CoordsElement#needsUpdateFromParent}
         * is set to false in updateGlider() and reset to true in the following call to
         * {@link JXG.CoordsElement#updateGliderFromParent}
         * @type {Boolean}
         */
        this.needsUpdateFromParent = true;

        /**
         * Dummy function for unconstrained points or gliders.
         * @private
         */
        this.updateConstraint = function () {
            return this;
        };

        /*
         * Do we need this?
         */
        this.Xjc = null;
        this.Yjc = null;

        // documented in GeometryElement
        this.methodMap = Type.deepCopy(this.methodMap, {
            move: 'moveTo',
            moveTo: 'moveTo',
            moveAlong: 'moveAlong',
            visit: 'visit',
            glide: 'makeGlider',
            makeGlider: 'makeGlider',
            intersect: 'makeIntersection',
            makeIntersection: 'makeIntersection',
            X: 'X',
            Y: 'Y',
            free: 'free',
            setPosition: 'setGliderPosition',
            setGliderPosition: 'setGliderPosition',
            addConstraint: 'addConstraint',
            dist: 'Dist',
            onPolygon: 'onPolygon'
        });

        /**
         * Stores the groups of this element in an array of Group.
         * @type array
         * @see JXG.Group
         * @private
         */
        this.group = [];

        /*
         * this.element may have been set by the object constructor.
         */
        if (Type.exists(this.element)) {
            this.addAnchor(coordinates, isLabel);
        }
        this.isDraggable = true;

    };

    JXG.extend(JXG.CoordsElement.prototype, /** @lends JXG.CoordsElement.prototype */ {
        /**
         * Updates the coordinates of the element.
         * @private
         */
        updateCoords: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }

            if (!Type.exists(fromParent)) {
                fromParent = false;
            }

            /*
             * We need to calculate the new coordinates no matter of the elements visibility because
             * a child could be visible and depend on the coordinates of the element/point (e.g. perpendicular).
             *
             * Check if the element is a glider and calculate new coords in dependency of this.slideObject.
             * This function is called with fromParent==true in case it is a glider element for example if
             * the defining elements of the line or circle have been changed.
             */
            if (this.type === Const.OBJECT_TYPE_GLIDER) {
                if (fromParent) {
                    this.updateGliderFromParent();
                } else {
                    this.updateGlider();
                }
            }

            if (!this.visProp.frozen) {
                this.updateConstraint();
            }
            this.updateTransform();

            return this;
        },

        /**
         * Update of glider in case of dragging the glider or setting the postion of the glider.
         * The relative position of the glider has to be updated.
         *
         * In case of a glider on a line:
         * If the second point is an ideal point, then -1 < this.position < 1,
         * this.position==+/-1 equals point2, this.position==0 equals point1
         *
         * If the first point is an ideal point, then 0 < this.position < 2
         * this.position==0  or 2 equals point1, this.position==1 equals point2
         *
         * @private
         */
        updateGlider: function () {
            var i, p1c, p2c, d, v, poly, cc, pos, sgn,
                alpha, beta,
                delta = 2.0 * Math.PI,
                angle,
                cp, c, invMat, newCoords, newPos,
                doRound = false,
                slide = this.slideObject;

            this.needsUpdateFromParent = false;

            if (slide.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                if (this.visProp.isgeonext) {
                    delta = 1.0;
                }
                //this.coords.setCoordinates(Const.COORDS_BY_USER,
                //    Geometry.projectPointToCircle(this, slide, this.board).usrCoords, false);
                newCoords = Geometry.projectPointToCircle(this, slide, this.board);
                newPos = Geometry.rad([slide.center.X() + 1.0, slide.center.Y()], slide.center, this) / delta;
            } else if (slide.elementClass === Const.OBJECT_CLASS_LINE) {
                /*
                 * onPolygon==true: the point is a slider on a segment and this segment is one of the
                 * "borders" of a polygon.
                 * This is a GEONExT feature.
                 */
                if (this.onPolygon) {
                    p1c = slide.point1.coords.usrCoords;
                    p2c = slide.point2.coords.usrCoords;
                    i = 1;
                    d = p2c[i] - p1c[i];

                    if (Math.abs(d) < Mat.eps) {
                        i = 2;
                        d = p2c[i] - p1c[i];
                    }

                    cc = Geometry.projectPointToLine(this, slide, this.board);
                    pos = (cc.usrCoords[i] - p1c[i]) / d;
                    poly = slide.parentPolygon;

                    if (pos < 0) {
                        for (i = 0; i < poly.borders.length; i++) {
                            if (slide === poly.borders[i]) {
                                slide = poly.borders[(i - 1 + poly.borders.length) % poly.borders.length];
                                break;
                            }
                        }
                    } else if (pos > 1.0) {
                        for (i = 0; i < poly.borders.length; i++) {
                            if (slide === poly.borders[i]) {
                                slide = poly.borders[(i + 1 + poly.borders.length) % poly.borders.length];
                                break;
                            }
                        }
                    }

                    // If the slide object has changed, save the change to the glider.
                    if (slide.id !== this.slideObject.id) {
                        this.slideObject = slide;
                    }
                }

                p1c = slide.point1.coords;
                p2c = slide.point2.coords;

                // Distance between the two defining points
                d = p1c.distance(Const.COORDS_BY_USER, p2c);

                // The defining points are identical
                if (d < Mat.eps) {
                    //this.coords.setCoordinates(Const.COORDS_BY_USER, p1c);
                    newCoords = p1c;
                    doRound = true;
                    newPos = 0.0;
                } else {
                    //this.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToLine(this, slide, this.board).usrCoords, false);
                    newCoords = Geometry.projectPointToLine(this, slide, this.board);
                    p1c = p1c.usrCoords.slice(0);
                    p2c = p2c.usrCoords.slice(0);

                    // The second point is an ideal point
                    if (Math.abs(p2c[0]) < Mat.eps) {
                        i = 1;
                        d = p2c[i];

                        if (Math.abs(d) < Mat.eps) {
                            i = 2;
                            d = p2c[i];
                        }

                        d = (newCoords.usrCoords[i] - p1c[i]) / d;
                        sgn = (d >= 0) ? 1 : -1;
                        d = Math.abs(d);
                        newPos = sgn * d / (d + 1);

                    // The first point is an ideal point
                    } else if (Math.abs(p1c[0]) < Mat.eps) {
                        i = 1;
                        d = p1c[i];

                        if (Math.abs(d) < Mat.eps) {
                            i = 2;
                            d = p1c[i];
                        }

                        d = (newCoords.usrCoords[i] - p2c[i]) / d;

                        // 1.0 - d/(1-d);
                        if (d < 0.0) {
                            newPos = (1 - 2.0 * d) / (1.0 - d);
                        } else {
                            newPos = 1 / (d + 1);
                        }
                    } else {
                        i = 1;
                        d = p2c[i] - p1c[i];

                        if (Math.abs(d) < Mat.eps) {
                            i = 2;
                            d = p2c[i] - p1c[i];
                        }
                        newPos = (newCoords.usrCoords[i] - p1c[i]) / d;
                    }
                }

                // Snap the glider point of the slider into its appropiate position
                // First, recalculate the new value of this.position
                // Second, call update(fromParent==true) to make the positioning snappier.
                if (this.visProp.snapwidth > 0.0 && Math.abs(this._smax - this._smin) >= Mat.eps) {
                    newPos = Math.max(Math.min(newPos, 1), 0);

                    v = newPos * (this._smax - this._smin) + this._smin;
                    v = Math.round(v / this.visProp.snapwidth) * this.visProp.snapwidth;
                    newPos = (v - this._smin) / (this._smax - this._smin);
                    this.update(true);
                }

                p1c = slide.point1.coords;
                if (!slide.visProp.straightfirst && Math.abs(p1c.usrCoords[0]) > Mat.eps && newPos < 0) {
                    //this.coords.setCoordinates(Const.COORDS_BY_USER, p1c);
                    newCoords = p1c;
                    doRound = true;
                    newPos = 0;
                }

                p2c = slide.point2.coords;
                if (!slide.visProp.straightlast && Math.abs(p2c.usrCoords[0]) > Mat.eps && newPos > 1) {
                    //this.coords.setCoordinates(Const.COORDS_BY_USER, p2c);
                    newCoords = p2c;
                    doRound = true;
                    newPos = 1;
                }
            } else if (slide.type === Const.OBJECT_TYPE_TURTLE) {
                // In case, the point is a constrained glider.
                // side-effect: this.position is overwritten
                this.updateConstraint();
                //this.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToTurtle(this, slide, this.board).usrCoords, false);
                newCoords = Geometry.projectPointToTurtle(this, slide, this.board);
                newPos = this.position;     // save position for the overwriting below
            } else if (slide.elementClass === Const.OBJECT_CLASS_CURVE) {
                if ((slide.type === Const.OBJECT_TYPE_ARC ||
                        slide.type === Const.OBJECT_TYPE_SECTOR)) {
                    newCoords = Geometry.projectPointToCircle(this, slide, this.board);

                    angle = Geometry.rad(slide.radiuspoint, slide.center, this);
                    alpha = 0.0;
                    beta = Geometry.rad(slide.radiuspoint, slide.center, slide.anglepoint);
                    newPos = angle;

                    if ((slide.visProp.selection === 'minor' && beta > Math.PI) ||
                            (slide.visProp.selection === 'major' && beta < Math.PI)) {
                        alpha = beta;
                        beta = 2 * Math.PI;
                    }

                    // Correct the position if we are outside of the sector/arc
                    if (angle < alpha || angle > beta) {
                        newPos = beta;

                        if ((angle < alpha && angle > alpha * 0.5) || (angle > beta && angle > beta * 0.5 + Math.PI)) {
                            newPos = alpha;
                        }

                        this.needsUpdateFromParent = true;
                        this.updateGliderFromParent();
                    }

                    delta = beta - alpha;
                    if (this.visProp.isgeonext) {
                        delta = 1.0;
                    }
                    if (Math.abs(delta) > Mat.eps) {
                        newPos /= delta;
                    }
                } else {
                    // In case, the point is a constrained glider.
                    this.updateConstraint();

                    if (slide.transformations.length > 0) {
                        slide.updateTransformMatrix();
                        invMat = Mat.inverse(slide.transformMat);
                        c = Mat.matVecMult(invMat, this.coords.usrCoords);

                        cp = (new Coords(Const.COORDS_BY_USER, c, this.board)).usrCoords;
                        c = Geometry.projectCoordsToCurve(cp[1], cp[2], this.position || 0, slide, this.board);

                        newCoords = c[0];
                        newPos = c[1];
                    } else {
                        // side-effect: this.position is overwritten
                        //this.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToCurve(this, slide, this.board).usrCoords, false);
                        newCoords = Geometry.projectPointToCurve(this, slide, this.board);
                        newPos = this.position; // save position for the overwriting below
                    }
                }
            } else if (Type.isPoint(slide)) {
                //this.coords.setCoordinates(Const.COORDS_BY_USER, Geometry.projectPointToPoint(this, slide, this.board).usrCoords, false);
                newCoords = Geometry.projectPointToPoint(this, slide, this.board);
                newPos = this.position; // save position for the overwriting below
            }

            this.coords.setCoordinates(Const.COORDS_BY_USER, newCoords.usrCoords, doRound);
            this.position = newPos;
        },

        /**
         * Update of a glider in case a parent element has been updated. That means the
         * relative position of the glider stays the same.
         * @private
         */
        updateGliderFromParent: function () {
            var p1c, p2c, r, lbda, c,
                slide = this.slideObject,
                baseangle, alpha, angle, beta,
                delta = 2.0 * Math.PI,
                newPos;

            if (!this.needsUpdateFromParent) {
                this.needsUpdateFromParent = true;
                return;
            }

            if (slide.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                r = slide.Radius();
                if (this.visProp.isgeonext) {
                    delta = 1.0;
                }
                c = [
                    slide.center.X() + r * Math.cos(this.position * delta),
                    slide.center.Y() + r * Math.sin(this.position * delta)
                ];
            } else if (slide.elementClass === Const.OBJECT_CLASS_LINE) {
                p1c = slide.point1.coords.usrCoords;
                p2c = slide.point2.coords.usrCoords;

                // The second point is an ideal point
                if (Math.abs(p2c[0]) < Mat.eps) {
                    lbda = Math.min(Math.abs(this.position), 1 - Mat.eps);
                    lbda /= (1.0 - lbda);

                    if (this.position < 0) {
                        lbda = -lbda;
                    }

                    c = [
                        p1c[0] + lbda * p2c[0],
                        p1c[1] + lbda * p2c[1],
                        p1c[2] + lbda * p2c[2]
                    ];
                // The first point is an ideal point
                } else if (Math.abs(p1c[0]) < Mat.eps) {
                    lbda = Math.max(this.position, Mat.eps);
                    lbda = Math.min(lbda, 2 - Mat.eps);

                    if (lbda > 1) {
                        lbda = (lbda - 1) / (lbda - 2);
                    } else {
                        lbda = (1 - lbda) / lbda;
                    }

                    c = [
                        p2c[0] + lbda * p1c[0],
                        p2c[1] + lbda * p1c[1],
                        p2c[2] + lbda * p1c[2]
                    ];
                } else {
                    lbda = this.position;
                    c = [
                        p1c[0] + lbda * (p2c[0] - p1c[0]),
                        p1c[1] + lbda * (p2c[1] - p1c[1]),
                        p1c[2] + lbda * (p2c[2] - p1c[2])
                    ];
                }
            } else if (slide.type === Const.OBJECT_TYPE_TURTLE) {
                this.coords.setCoordinates(Const.COORDS_BY_USER, [slide.Z(this.position), slide.X(this.position), slide.Y(this.position)]);
                // In case, the point is a constrained glider.
                // side-effect: this.position is overwritten:
                this.updateConstraint();
                c  = Geometry.projectPointToTurtle(this, slide, this.board).usrCoords;
            } else if (slide.elementClass === Const.OBJECT_CLASS_CURVE) {
                this.coords.setCoordinates(Const.COORDS_BY_USER, [slide.Z(this.position), slide.X(this.position), slide.Y(this.position)]);

                if (slide.type === Const.OBJECT_TYPE_ARC || slide.type === Const.OBJECT_TYPE_SECTOR) {
                    baseangle = Geometry.rad([slide.center.X() + 1, slide.center.Y()], slide.center, slide.radiuspoint);

                    alpha = 0.0;
                    beta = Geometry.rad(slide.radiuspoint, slide.center, slide.anglepoint);

                    if ((slide.visProp.selection === 'minor' && beta > Math.PI) ||
                            (slide.visProp.selection === 'major' && beta < Math.PI)) {
                        alpha = beta;
                        beta = 2 * Math.PI;
                    }

                    delta = beta - alpha;
                    if (this.visProp.isgeonext) {
                        delta = 1.0;
                    }
                    angle = this.position * delta;

                    // Correct the position if we are outside of the sector/arc
                    if (angle < alpha || angle > beta) {
                        angle = beta;

                        if ((angle < alpha && angle > alpha * 0.5) ||
                                (angle > beta && angle > beta * 0.5 + Math.PI)) {
                            angle = alpha;
                        }

                        this.position = angle;
                        if (Math.abs(delta) > Mat.eps) {
                            this.position /= delta;
                        }
                    }

                    r = slide.Radius();
                    c = [
                        slide.center.X() + r * Math.cos(this.position * delta + baseangle),
                        slide.center.Y() + r * Math.sin(this.position * delta + baseangle)
                    ];
                } else {
                    // In case, the point is a constrained glider.
                    // side-effect: this.position is overwritten
                    this.updateConstraint();
                    c = Geometry.projectPointToCurve(this, slide, this.board).usrCoords;
                }

            } else if (Type.isPoint(slide)) {
                c = Geometry.projectPointToPoint(this, slide, this.board).usrCoords;
            }

            this.coords.setCoordinates(Const.COORDS_BY_USER, c, false);
        },

        updateRendererGeneric: function (rendererMethod) {
            var wasReal;

            if (!this.needsUpdate) {
                return this;
            }

            /* Call the renderer only if point is visible. */
            if (this.visProp.visible) {
                wasReal = this.isReal;
                this.isReal = (!isNaN(this.coords.usrCoords[1] + this.coords.usrCoords[2]));
                //Homogeneous coords: ideal point
                this.isReal = (Math.abs(this.coords.usrCoords[0]) > Mat.eps) ? this.isReal : false;

                if (this.isReal) {
                    if (wasReal !== this.isReal) {
                        this.board.renderer.show(this);

                        if (this.hasLabel && this.label.visProp.visible) {
                            this.board.renderer.show(this.label);
                        }
                    }
                    this.board.renderer[rendererMethod](this);
                } else {
                    if (wasReal !== this.isReal) {
                        this.board.renderer.hide(this);

                        if (this.hasLabel && this.label.visProp.visible) {
                            this.board.renderer.hide(this.label);
                        }
                    }
                }
            }

            /* Update the label if visible. */
            if (this.hasLabel && this.visProp.visible && this.label && this.label.visProp.visible && this.isReal) {
                this.label.update();
                this.board.renderer.updateText(this.label);
            }

            this.needsUpdate = false;

            return this;
        },

        /**
         * Getter method for x, this is used by for CAS-points to access point coordinates.
         * @returns {Number} User coordinate of point in x direction.
         */
        X: function () {
            return this.coords.usrCoords[1];
        },

        /**
         * Getter method for y, this is used by CAS-points to access point coordinates.
         * @returns {Number} User coordinate of point in y direction.
         */
        Y: function () {
            return this.coords.usrCoords[2];
        },

        /**
         * Getter method for z, this is used by CAS-points to access point coordinates.
         * @returns {Number} User coordinate of point in z direction.
         */
        Z: function () {
            return this.coords.usrCoords[0];
        },

        /**
         * New evaluation of the function term.
         * This is required for CAS-points: Their XTerm() method is overwritten in {@link #addConstraint}
         * @returns {Number} User coordinate of point in x direction.
         * @private
         */
        XEval: function () {
            return this.coords.usrCoords[1];
        },

        /**
         * New evaluation of the function term.
         * This is required for CAS-points: Their YTerm() method is overwritten in {@link #addConstraint}
         * @returns {Number} User coordinate of point in y direction.
         * @private
         */
        YEval: function () {
            return this.coords.usrCoords[2];
        },

        /**
         * New evaluation of the function term.
         * This is required for CAS-points: Their ZTerm() method is overwritten in {@link #addConstraint}
         * @returns {Number} User coordinate of point in z direction.
         * @private
         */
        ZEval: function () {
            return this.coords.usrCoords[0];
        },

        /**
         * Getter method for the distance to a second point, this is required for CAS-elements.
         * Here, function inlining seems to be worthwile  (for plotting).
         * @param {JXG.Point} point2 The point to which the distance shall be calculated.
         * @returns {Number} Distance in user coordinate to the given point
         */
        Dist: function (point2) {
            if (this.isReal && point2.isReal) {
                return this.coords.distance(Const.COORDS_BY_USER, point2.coords);
            }
            return NaN;
        },

        /**
         * Alias for {@link JXG.Element#handleSnapToGrid}
         * @param {Boolean} force force snapping independent from what the snaptogrid attribute says
         * @returns {JXG.Point} Reference to this element
         */
        snapToGrid: function (force) {
            return this.handleSnapToGrid(force);
        },

        /**
         * Let a point snap to the nearest point in distance of
         * {@link JXG.Point#attractorDistance}.
         * The function uses the coords object of the point as
         * its actual position.
         * @param {Boolean} force force snapping independent from what the snaptogrid attribute says
         * @returns {JXG.Point} Reference to this element
         */
        handleSnapToPoints: function (force) {
            var i, pEl, pCoords,
                d = 0,
                dMax = Infinity,
                c = null;

            if (this.visProp.snaptopoints || force) {
                for (i = 0; i < this.board.objectsList.length; i++) {
                    pEl = this.board.objectsList[i];

                    if (Type.isPoint(pEl) && pEl !== this && pEl.visProp.visible) {
                        pCoords = Geometry.projectPointToPoint(this, pEl, this.board);
                        if (this.visProp.attractorunit === 'screen') {
                            d = pCoords.distance(Const.COORDS_BY_SCREEN, this.coords);
                        } else {
                            d = pCoords.distance(Const.COORDS_BY_USER, this.coords);
                        }

                        if (d < this.visProp.attractordistance && d < dMax) {
                            dMax = d;
                            c = pCoords;
                        }
                    }
                }

                if (c !== null) {
                    this.coords.setCoordinates(Const.COORDS_BY_USER, c.usrCoords);
                }
            }

            return this;
        },

        /**
         * Alias for {@link #handleSnapToPoints}.
         * @param {Boolean} force force snapping independent from what the snaptogrid attribute says
         * @returns {JXG.Point} Reference to this element
         */
        snapToPoints: function (force) {
            return this.handleSnapToPoints(force);
        },

        /**
         * A point can change its type from free point to glider
         * and vice versa. If it is given an array of attractor elements
         * (attribute attractors) and the attribute attractorDistance
         * then the pint will be made a glider if it less than attractorDistance
         * apart from one of its attractor elements.
         * If attractorDistance is equal to zero, the point stays in its
         * current form.
         * @returns {JXG.Point} Reference to this element
         */
        handleAttractors: function () {
            var i, el, projCoords,
                d = 0.0,
                len = this.visProp.attractors.length;

            if (this.visProp.attractordistance === 0.0) {
                return;
            }

            for (i = 0; i < len; i++) {
                el = this.board.select(this.visProp.attractors[i]);

                if (Type.exists(el) && el !== this) {
                    if (Type.isPoint(el)) {
                        projCoords = Geometry.projectPointToPoint(this, el, this.board);
                    } else if (el.elementClass === Const.OBJECT_CLASS_LINE) {
                        projCoords = Geometry.projectPointToLine(this, el, this.board);
                    } else if (el.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                        projCoords = Geometry.projectPointToCircle(this, el, this.board);
                    } else if (el.elementClass === Const.OBJECT_CLASS_CURVE) {
                        projCoords = Geometry.projectPointToCurve(this, el, this.board);
                    } else if (el.type === Const.OBJECT_TYPE_TURTLE) {
                        projCoords = Geometry.projectPointToTurtle(this, el, this.board);
                    }

                    if (this.visProp.attractorunit === 'screen') {
                        d = projCoords.distance(Const.COORDS_BY_SCREEN, this.coords);
                    } else {
                        d = projCoords.distance(Const.COORDS_BY_USER, this.coords);
                    }

                    if (d < this.visProp.attractordistance) {
                        if (!(this.type === Const.OBJECT_TYPE_GLIDER && this.slideObject === el)) {
                            this.makeGlider(el);
                        }

                        break;       // bind the point to the first attractor in its list.
                    } else {
                        if (el === this.slideObject && d >= this.visProp.snatchdistance) {
                            this.popSlideObject();
                        }
                    }
                }
            }

            return this;
        },

        /**
         * Sets coordinates and calls the point's update() method.
         * @param {Number} method The type of coordinates used here.
         * Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates <tt>([z], x, y)</tt> in screen/user units
         * @param {Array} lastPosition (optional) coordinates <tt>(x, y)</tt> in screen units of the last position.
         * Usually this is the position where the last drag event had occurred. This is needed to prevent jumps
         * to the lower left corner when dragging an image.
         * @returns {JXG.Point} this element
         */
        setPositionDirectly: function (method, coords, lastPosition) {
            var i, offset, c, dc,
                oldCoords = this.coords,
                newCoords;

            // Correct offset for large objects like images and texts to prevent that the
            // corner of the object jumps to the mouse pointer.
            if (Type.exists(lastPosition) &&
                    !this.visProp.snaptogrid &&
                    !this.visProp.snaptopoints &&
                    this.visProp.attractors.length === 0) {
                offset = Statistics.subtract(this.coords.scrCoords.slice(1), lastPosition);
                coords = Statistics.add(coords, offset);
            }

            if (this.relativeCoords) {
                c = new Coords(method, coords, this.board);
                if (this.visProp.islabel) {
                    dc = Statistics.subtract(c.scrCoords, oldCoords.scrCoords);
                    this.relativeCoords.scrCoords[1] += dc[1];
                    this.relativeCoords.scrCoords[2] += dc[2];
                } else {
                    dc = Statistics.subtract(c.usrCoords, oldCoords.usrCoords);
                    this.relativeCoords.usrCoords[1] += dc[1];
                    this.relativeCoords.usrCoords[2] += dc[2];
                }

                return this;
            }

            this.coords.setCoordinates(method, coords);
            this.handleSnapToGrid();
            this.handleSnapToPoints();
            this.handleAttractors();

            if (this.group.length === 0) {
                // Here used to be the update of the groups. I'm not sure why we don't need to execute
                // the else branch if there are groups defined on this point, hence I'll let the if live.

                // Update the initial coordinates. This is needed for free points
                // that have a transformation bound to it.
                for (i = this.transformations.length - 1; i >= 0; i--) {
                    if (method === Const.COORDS_BY_SCREEN) {
                        newCoords = (new Coords(method, coords, this.board)).usrCoords;
                    } else {
                        if (coords.length === 2) {
                            coords = [1].concat(coords);
                        }
                        newCoords = coords;
                    }
                    this.initialCoords.setCoordinates(Const.COORDS_BY_USER, Mat.matVecMult(Mat.inverse(this.transformations[i].matrix), newCoords));
                }
                this.prepareUpdate().update();
            }

            // If the user suspends the board updates we need to recalculate the relative position of
            // the point on the slide object. this is done in updateGlider() which is NOT called during the
            // update process triggered by unsuspendUpdate.
            if (this.board.isSuspendedUpdate && this.type === Const.OBJECT_TYPE_GLIDER) {
                this.updateGlider();
            }

            return this;
        },

        /**
         * Translates the point by <tt>tv = (x, y)</tt>.
         * @param {Number} method The type of coordinates used here.
         * Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Number} tv (x, y)
         * @returns {JXG.Point}
         */
        setPositionByTransform: function (method, tv) {
            var t;

            tv = new Coords(method, tv, this.board);
            t = this.board.create('transform', tv.usrCoords.slice(1), {type: 'translate'});

            if (this.transformations.length > 0 &&
                    this.transformations[this.transformations.length - 1].isNumericMatrix) {
                this.transformations[this.transformations.length - 1].melt(t);
            } else {
                this.addTransform(this, t);
            }

            this.prepareUpdate().update();

            return this;
        },

        /**
         * Sets coordinates and calls the point's update() method.
         * @param {Number} method The type of coordinates used here.
         * Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} lastPosition (optional) coordinates <tt>(x, y)</tt> in screen units of the last position.
         * Usually this is the position where the last drag event had occurred. This is needed to prevent jumps
         * to the lower left corner when dragging an image.
         * @returns {JXG.Point}
         */
        setPosition: function (method, coords, lastPosition) {
            return this.setPositionDirectly(method, coords, lastPosition);
        },

        /**
         * Sets the position of a glider relative to the defining elements
         * of the {@link JXG.Point#slideObject}.
         * @param {Number} x
         * @returns {JXG.Point} Reference to the point element.
         */
        setGliderPosition: function (x) {
            if (this.type === Const.OBJECT_TYPE_GLIDER) {
                this.position = x;
                this.board.update();
            }

            return this;
        },

        /**
         * Convert the point to glider and update the construction.
         * To move the point visual onto the glider, a call of board update is necessary.
         * @param {String|Object} slide The object the point will be bound to.
         */
        makeGlider: function (slide) {
            var slideobj = this.board.select(slide);

            /* Gliders on Ticks are forbidden */
            if (!Type.exists(slideobj)) {
                throw new Error("JSXGraph: slide object undefined.");
            } else if (slideobj.type === Const.OBJECT_TYPE_TICKS) {
                throw new Error("JSXGraph: gliders on ticks are not possible.");
            }

            this.slideObject = this.board.select(slide);
            this.slideObjects.push(this.slideObject);
            this.addParents(slide);

            this.type = Const.OBJECT_TYPE_GLIDER;
            this.elType = 'glider';
            this.visProp.snapwidth = -1;          // By default, deactivate snapWidth
            this.slideObject.addChild(this);
            this.isDraggable = true;

            this.generatePolynomial = function () {
                return this.slideObject.generatePolynomial(this);
            };

            // Determine the initial value of this.position
            this.updateGlider();
            this.needsUpdateFromParent = true;
            this.updateGliderFromParent();

            return this;
        },

        /**
         * Remove the last slideObject. If there are more than one elements the point is bound to,
         * the second last element is the new active slideObject.
         */
        popSlideObject: function () {
            if (this.slideObjects.length > 0) {
                this.slideObjects.pop();

                // It may not be sufficient to remove the point from
                // the list of childElement. For complex dependencies
                // one may have to go to the list of ancestor and descendants.  A.W.
                // yes indeed, see #51 on github bugtracker
                //delete this.slideObject.childElements[this.id];
                this.slideObject.removeChild(this);

                if (this.slideObjects.length === 0) {
                    this.type = this._org_type;
                    if (this.type === Const.OBJECT_TYPE_POINT) {
                        this.elType = 'point';
                    } else if (this.elementClass === Const.OBJECT_CLASS_TEXT) {
                        this.elType = 'text';
                    } else if (this.type === Const.OBJECT_TYPE_IMAGE) {
                        this.elType = 'image';
                    }

                    this.slideObject = null;
                } else {
                    this.slideObject = this.slideObjects[this.slideObjects.length - 1];
                }
            }
        },

        /**
         * Converts a calculated element into a free element,
         * i.e. it will delete all ancestors and transformations and,
         * if the element is currently a glider, will remove the slideObject reference.
         */
        free: function () {
            var ancestorId, ancestor, child;

            if (this.type !== Const.OBJECT_TYPE_GLIDER) {
                // remove all transformations
                this.transformations.length = 0;

                if (!this.isDraggable) {
                    this.isDraggable = true;

                    if (this.elementClass === Const.OBJECT_CLASS_POINT) {
                        this.type = Const.OBJECT_TYPE_POINT;
                        this.elType = 'point';
                    }

                    this.XEval = function () {
                        return this.coords.usrCoords[1];
                    };

                    this.YEval = function () {
                        return this.coords.usrCoords[2];
                    };

                    this.ZEval = function () {
                        return this.coords.usrCoords[0];
                    };

                    this.Xjc = null;
                    this.Yjc = null;
                } else {
                    return;
                }
            }

            // a free point does not depend on anything. And instead of running through tons of descendants and ancestor
            // structures, where we eventually are going to visit a lot of objects twice or thrice with hard to read and
            // comprehend code, just run once through all objects and delete all references to this point and its label.
            for (ancestorId in this.board.objects) {
                if (this.board.objects.hasOwnProperty(ancestorId)) {
                    ancestor = this.board.objects[ancestorId];

                    if (ancestor.descendants) {
                        delete ancestor.descendants[this.id];
                        delete ancestor.childElements[this.id];

                        if (this.hasLabel) {
                            delete ancestor.descendants[this.label.id];
                            delete ancestor.childElements[this.label.id];
                        }
                    }
                }
            }

            // A free point does not depend on anything. Remove all ancestors.
            this.ancestors = {}; // only remove the reference

            // Completely remove all slideObjects of the element
            this.slideObject = null;
            this.slideObjects = [];
            if (this.elementClass === Const.OBJECT_CLASS_POINT) {
                this.type = Const.OBJECT_TYPE_POINT;
                this.elType = 'point';
            } else if (this.elementClass === Const.OBJECT_CLASS_TEXT) {
                this.type = this._org_type;
                this.elType = 'text';
            } else if (this.elementClass === Const.OBJECT_CLASS_OTHER) {
                this.type = this._org_type;
                this.elType = 'image';
            }
        },

        /**
         * Convert the point to CAS point and call update().
         * @param {Array} terms [[zterm], xterm, yterm] defining terms for the z, x and y coordinate.
         * The z-coordinate is optional and it is used for homogeneous coordinates.
         * The coordinates may be either <ul>
         *   <li>a JavaScript function,</li>
         *   <li>a string containing GEONExT syntax. This string will be converted into a JavaScript
         *     function here,</li>
         *   <li>a Number</li>
         *   <li>a pointer to a slider object. This will be converted into a call of the Value()-method
         *     of this slider.</li>
         *   </ul>
         * @see JXG.GeonextParser#geonext2JS
         */
        addConstraint: function (terms) {
            var fs, i, v, t,
                newfuncs = [],
                what = ['X', 'Y'],

                makeConstFunction = function (z) {
                    return function () {
                        return z;
                    };
                },

                makeSliderFunction = function (a) {
                    return function () {
                        return a.Value();
                    };
                };

            if (this.elementClass === Const.OBJECT_CLASS_POINT) {
                this.type = Const.OBJECT_TYPE_CAS;
            }

            this.isDraggable = false;

            for (i = 0; i < terms.length; i++) {
                v = terms[i];

                if (typeof v === 'string') {
                    // Convert GEONExT syntax into JavaScript syntax
                    //t  = JXG.GeonextParser.geonext2JS(v, this.board);
                    //newfuncs[i] = new Function('','return ' + t + ';');
                    //v = GeonextParser.replaceNameById(v, this.board);
                    newfuncs[i] = this.board.jc.snippet(v, true, null, true);

                    if (terms.length === 2) {
                        this[what[i] + 'jc'] = terms[i];
                    }
                } else if (typeof v === 'function') {
                    newfuncs[i] = v;
                } else if (typeof v === 'number') {
                    newfuncs[i] = makeConstFunction(v);
                // Slider
                } else if (typeof v === 'object' && typeof v.Value === 'function') {
                    newfuncs[i] = makeSliderFunction(v);
                }

                newfuncs[i].origin = v;
            }

            // Intersection function
            if (terms.length === 1) {
                this.updateConstraint = function () {
                    var c = newfuncs[0]();

                    // Array
                    if (Type.isArray(c)) {
                        this.coords.setCoordinates(Const.COORDS_BY_USER, c);
                    // Coords object
                    } else {
                        this.coords = c;
                    }
                };
            // Euclidean coordinates
            } else if (terms.length === 2) {
                this.XEval = newfuncs[0];
                this.YEval = newfuncs[1];

                this.parents = [newfuncs[0].origin, newfuncs[1].origin];

                this.updateConstraint = function () {
                    this.coords.setCoordinates(Const.COORDS_BY_USER, [this.XEval(), this.YEval()]);
                };
            // Homogeneous coordinates
            } else {
                this.ZEval = newfuncs[0];
                this.XEval = newfuncs[1];
                this.YEval = newfuncs[2];

                this.parents = [newfuncs[0].origin, newfuncs[1].origin, newfuncs[2].origin];

                this.updateConstraint = function () {
                    this.coords.setCoordinates(Const.COORDS_BY_USER, [this.ZEval(), this.XEval(), this.YEval()]);
                };
            }

            /**
            * We have to do an update. Otherwise, elements relying on this point will receive NaN.
            */
            this.prepareUpdate().update();

            if (!this.board.isSuspendedUpdate) {
                this.updateRenderer();
            }

            return this;
        },

        /**
         * In case there is an attribute "anchor", the element is bound to
         * this anchor element.
         * This is handled with this.relativeCoords. If the element is a label
         * relativeCoords are given in scrCoords, otherwise in usrCoords.
         * @param{Array} coordinates Offset from th anchor element. These are the values for this.relativeCoords.
         * In case of a label, coordinates are screen coordinates. Otherwise, coordinates are user coordinates.
         * @param{Boolean} isLabel Yes/no
         * @private
         */
        addAnchor: function (coordinates, isLabel) {
            if (isLabel) {
                this.relativeCoords = new Coords(Const.COORDS_BY_SCREEN, coordinates.slice(0, 2), this.board);
            } else {
                this.relativeCoords = new Coords(Const.COORDS_BY_USER, coordinates, this.board);
            }
            this.element.addChild(this);
            this.addParents(this.element);

            this.XEval = function () {
                var sx, coords, anchor;

                if (this.visProp.islabel) {
                    sx =  parseFloat(this.visProp.offset[0]);
                    anchor = this.element.getLabelAnchor();
                    coords = new Coords(Const.COORDS_BY_SCREEN,
                        [sx + this.relativeCoords.scrCoords[1] + anchor.scrCoords[1], 0], this.board);

                    return coords.usrCoords[1];
                }

                anchor = this.element.getTextAnchor();
                return this.relativeCoords.usrCoords[1] + anchor.usrCoords[1];
            };

            this.YEval = function () {
                var sy, coords, anchor;

                if (this.visProp.islabel) {
                    sy = -parseFloat(this.visProp.offset[1]);
                    anchor = this.element.getLabelAnchor();
                    coords = new Coords(Const.COORDS_BY_SCREEN,
                        [0, sy + this.relativeCoords.scrCoords[2] + anchor.scrCoords[2]], this.board);

                    return coords.usrCoords[2];
                }

                anchor = this.element.getTextAnchor();
                return this.relativeCoords.usrCoords[2] + anchor.usrCoords[2];
            };

            this.ZEval = Type.createFunction(1, this.board, '');

            this.updateConstraint = function () {
                this.coords.setCoordinates(Const.COORDS_BY_USER, [this.ZEval(), this.XEval(), this.YEval()]);
            };

            this.coords = new Coords(Const.COORDS_BY_SCREEN, [0, 0], this.board);
        },

        /**
         * Applies the transformations of the element.
         * This method applies to text and images. Point transformations are handled differently.
         * @returns {JXG.CoordsElement} Reference to this object.
         */
        updateTransform: function () {
            var i;

            if (this.transformations.length === 0) {
                return this;
            }

            for (i = 0; i < this.transformations.length; i++) {
                this.transformations[i].update();
            }

            return this;
        },

        /**
         * Add transformations to this point.
         * @param {JXG.GeometryElement} el
         * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation}
         * or an array of {@link JXG.Transformation}s.
         * @returns {JXG.Point} Reference to this point object.
         */
        addTransform: function (el, transform) {
            var i,
                list = Type.isArray(transform) ? transform : [transform],
                len = list.length;

            // There is only one baseElement possible
            if (this.transformations.length === 0) {
                this.baseElement = el;
            }

            for (i = 0; i < len; i++) {
                this.transformations.push(list[i]);
            }

            return this;
        },

        /**
         * Animate the point.
         * @param {Number} direction The direction the glider is animated. Can be +1 or -1.
         * @param {Number} stepCount The number of steps.
         * @name Glider#startAnimation
         * @see Glider#stopAnimation
         * @function
         */
        startAnimation: function (direction, stepCount) {
            var that = this;

            if ((this.type === Const.OBJECT_TYPE_GLIDER) && !Type.exists(this.intervalCode)) {
                this.intervalCode = window.setInterval(function () {
                    that._anim(direction, stepCount);
                }, 250);

                if (!Type.exists(this.intervalCount)) {
                    this.intervalCount = 0;
                }
            }
            return this;
        },

        /**
         * Stop animation.
         * @name Glider#stopAnimation
         * @see Glider#startAnimation
         * @function
         */
        stopAnimation: function () {
            if (Type.exists(this.intervalCode)) {
                window.clearInterval(this.intervalCode);
                delete this.intervalCode;
            }

            return this;
        },

        /**
         * Starts an animation which moves the point along a given path in given time.
         * @param {Array|function} path The path the point is moved on.
         * This can be either an array of arrays containing x and y values of the points of
         * the path, or  function taking the amount of elapsed time since the animation
         * has started and returns an array containing a x and a y value or NaN.
         * In case of NaN the animation stops.
         * @param {Number} time The time in milliseconds in which to finish the animation
         * @param {Object} [options] Optional settings for the animation.
         * @param {function} [options.callback] A function that is called as soon as the animation is finished.
         * @param {Boolean} [options.interpolate=true] If <tt>path</tt> is an array moveAlong()
         * will interpolate the path
         * using {@link JXG.Math.Numerics#Neville}. Set this flag to false if you don't want to use interpolation.
         * @returns {JXG.Point} Reference to the point.
         */
        moveAlong: function (path, time, options) {
            options = options || {};

            var i, neville,
                interpath = [],
                p = [],
                delay = this.board.attr.animationdelay,
                steps = time / delay,

                makeFakeFunction = function (i, j) {
                    return function () {
                        return path[i][j];
                    };
                };

            if (Type.isArray(path)) {
                for (i = 0; i < path.length; i++) {
                    if (Type.isPoint(path[i])) {
                        p[i] = path[i];
                    } else {
                        p[i] = {
                            elementClass: Const.OBJECT_CLASS_POINT,
                            X: makeFakeFunction(i, 0),
                            Y: makeFakeFunction(i, 1)
                        };
                    }
                }

                time = time || 0;
                if (time === 0) {
                    this.setPosition(Const.COORDS_BY_USER, [p[p.length - 1].X(), p[p.length - 1].Y()]);
                    return this.board.update(this);
                }

                if (!Type.exists(options.interpolate) || options.interpolate) {
                    neville = Numerics.Neville(p);
                    for (i = 0; i < steps; i++) {
                        interpath[i] = [];
                        interpath[i][0] = neville[0]((steps - i) / steps * neville[3]());
                        interpath[i][1] = neville[1]((steps - i) / steps * neville[3]());
                    }
                } else {
                    for (i = 0; i < steps; i++) {
                        interpath[i] = [];
                        interpath[i][0] = path[Math.floor((steps - i) / steps * (path.length - 1))][0];
                        interpath[i][1] = path[Math.floor((steps - i) / steps * (path.length - 1))][1];
                    }
                }

                this.animationPath = interpath;
            } else if (Type.isFunction(path)) {
                this.animationPath = path;
                this.animationStart = new Date().getTime();
            }

            this.animationCallback = options.callback;
            this.board.addAnimation(this);

            return this;
        },

        /**
         * Starts an animated point movement towards the given coordinates <tt>where</tt>.
         * The animation is done after <tt>time</tt> milliseconds.
         * If the second parameter is not given or is equal to 0, setPosition() is called, see #setPosition.
         * @param {Array} where Array containing the x and y coordinate of the target location.
         * @param {Number} [time] Number of milliseconds the animation should last.
         * @param {Object} [options] Optional settings for the animation
         * @param {function} [options.callback] A function that is called as soon as the animation is finished.
         * @param {String} [options.effect='<>'] animation effects like speed fade in and out. possible values are
         * '<>' for speed increase on start and slow down at the end (default) and '--' for constant speed during
         * the whole animation.
         * @returns {JXG.Point} Reference to itself.
         * @see #animate
         */
        moveTo: function (where, time, options) {
            options = options || {};
            where = new Coords(Const.COORDS_BY_USER, where, this.board);

            var i,
                delay = this.board.attr.animationdelay,
                steps = Math.ceil(time / delay),
                coords = [],
                X = this.coords.usrCoords[1],
                Y = this.coords.usrCoords[2],
                dX = (where.usrCoords[1] - X),
                dY = (where.usrCoords[2] - Y),

                /** @ignore */
                stepFun = function (i) {
                    if (options.effect && options.effect === '<>') {
                        return Math.pow(Math.sin((i / steps) * Math.PI / 2), 2);
                    }
                    return i / steps;
                };

            if (!Type.exists(time) || time === 0 || (Math.abs(where.usrCoords[0] - this.coords.usrCoords[0]) > Mat.eps)) {
                this.setPosition(Const.COORDS_BY_USER, where.usrCoords);
                return this.board.update(this);
            }

            if (Math.abs(dX) < Mat.eps && Math.abs(dY) < Mat.eps) {
                return this;
            }

            for (i = steps; i >= 0; i--) {
                coords[steps - i] = [where.usrCoords[0], X + dX * stepFun(i), Y + dY * stepFun(i)];
            }

            this.animationPath = coords;
            this.animationCallback = options.callback;
            this.board.addAnimation(this);

            return this;
        },

        /**
         * Starts an animated point movement towards the given coordinates <tt>where</tt>. After arriving at
         * <tt>where</tt> the point moves back to where it started. The animation is done after <tt>time</tt>
         * milliseconds.
         * @param {Array} where Array containing the x and y coordinate of the target location.
         * @param {Number} time Number of milliseconds the animation should last.
         * @param {Object} [options] Optional settings for the animation
         * @param {function} [options.callback] A function that is called as soon as the animation is finished.
         * @param {String} [options.effect='<>'] animation effects like speed fade in and out. possible values are
         * '<>' for speed increase on start and slow down at the end (default) and '--' for constant speed during
         * the whole animation.
         * @param {Number} [options.repeat=1] How often this animation should be repeated.
         * @returns {JXG.Point} Reference to itself.
         * @see #animate
         */
        visit: function (where, time, options) {
            where = new Coords(Const.COORDS_BY_USER, where, this.board);

            var i, j, steps,
                delay = this.board.attr.animationdelay,
                coords = [],
                X = this.coords.usrCoords[1],
                Y = this.coords.usrCoords[2],
                dX = (where.usrCoords[1] - X),
                dY = (where.usrCoords[2] - Y),

                /** @ignore */
                stepFun = function (i) {
                    var x = (i < steps / 2 ? 2 * i / steps : 2 * (steps - i) / steps);

                    if (options.effect && options.effect === '<>') {
                        return Math.pow(Math.sin(x * Math.PI / 2), 2);
                    }

                    return x;
                };

            // support legacy interface where the third parameter was the number of repeats
            if (typeof options === 'number') {
                options = {repeat: options};
            } else {
                options = options || {};
                if (!Type.exists(options.repeat)) {
                    options.repeat = 1;
                }
            }

            steps = Math.ceil(time / (delay * options.repeat));

            for (j = 0; j < options.repeat; j++) {
                for (i = steps; i >= 0; i--) {
                    coords[j * (steps + 1) + steps - i] = [where.usrCoords[0], X + dX * stepFun(i), Y + dY * stepFun(i)];
                }
            }
            this.animationPath = coords;
            this.animationCallback = options.callback;
            this.board.addAnimation(this);

            return this;
        },

        /**
         * Animates a glider. Is called by the browser after startAnimation is called.
         * @param {Number} direction The direction the glider is animated.
         * @param {Number} stepCount The number of steps.
         * @see #startAnimation
         * @see #stopAnimation
         * @private
         */
        _anim: function (direction, stepCount) {
            var distance, slope, dX, dY, alpha, startPoint, newX, radius,
                factor = 1;

            this.intervalCount += 1;
            if (this.intervalCount > stepCount) {
                this.intervalCount = 0;
            }

            if (this.slideObject.elementClass === Const.OBJECT_CLASS_LINE) {
                distance = this.slideObject.point1.coords.distance(Const.COORDS_BY_SCREEN, this.slideObject.point2.coords);
                slope = this.slideObject.getSlope();
                if (slope !== Infinity) {
                    alpha = Math.atan(slope);
                    dX = Math.round((this.intervalCount / stepCount) * distance * Math.cos(alpha));
                    dY = Math.round((this.intervalCount / stepCount) * distance * Math.sin(alpha));
                } else {
                    dX = 0;
                    dY = Math.round((this.intervalCount / stepCount) * distance);
                }

                if (direction < 0) {
                    startPoint = this.slideObject.point2;

                    if (this.slideObject.point2.coords.scrCoords[1] - this.slideObject.point1.coords.scrCoords[1] > 0) {
                        factor = -1;
                    } else if (this.slideObject.point2.coords.scrCoords[1] - this.slideObject.point1.coords.scrCoords[1] === 0) {
                        if (this.slideObject.point2.coords.scrCoords[2] - this.slideObject.point1.coords.scrCoords[2] > 0) {
                            factor = -1;
                        }
                    }
                } else {
                    startPoint = this.slideObject.point1;

                    if (this.slideObject.point1.coords.scrCoords[1] - this.slideObject.point2.coords.scrCoords[1] > 0) {
                        factor = -1;
                    } else if (this.slideObject.point1.coords.scrCoords[1] - this.slideObject.point2.coords.scrCoords[1] === 0) {
                        if (this.slideObject.point1.coords.scrCoords[2] - this.slideObject.point2.coords.scrCoords[2] > 0) {
                            factor = -1;
                        }
                    }
                }

                this.coords.setCoordinates(Const.COORDS_BY_SCREEN, [
                    startPoint.coords.scrCoords[1] + factor * dX,
                    startPoint.coords.scrCoords[2] + factor * dY
                ]);
            } else if (this.slideObject.elementClass === Const.OBJECT_CLASS_CURVE) {
                if (direction > 0) {
                    newX = Math.round(this.intervalCount / stepCount * this.board.canvasWidth);
                } else {
                    newX = Math.round((stepCount - this.intervalCount) / stepCount * this.board.canvasWidth);
                }

                this.coords.setCoordinates(Const.COORDS_BY_SCREEN, [newX, 0]);
                this.coords = Geometry.projectPointToCurve(this, this.slideObject, this.board);
            } else if (this.slideObject.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                if (direction < 0) {
                    alpha = this.intervalCount / stepCount * 2 * Math.PI;
                } else {
                    alpha = (stepCount - this.intervalCount) / stepCount * 2 * Math.PI;
                }

                radius = this.slideObject.Radius();

                this.coords.setCoordinates(Const.COORDS_BY_USER, [
                    this.slideObject.center.coords.usrCoords[1] + radius * Math.cos(alpha),
                    this.slideObject.center.coords.usrCoords[2] + radius * Math.sin(alpha)
                ]);
            }

            this.board.update(this);
            return this;
        },

        // documented in GeometryElement
        getTextAnchor: function () {
            return this.coords;
        },

        // documented in GeometryElement
        getLabelAnchor: function () {
            return this.coords;
        },

        getParents: function () {
            var p = [this.Z(), this.X(), this.Y()];

            if (this.parents) {
                p = this.parents;
            }

            if (this.type === Const.OBJECT_TYPE_GLIDER) {
                p = [this.X(), this.Y(), this.slideObject.id];

            }

            return p;
        }

    });

    /**
     * Generic method to create point, text or image.
     * Determines the type of the construction, i.e. free, or constrained by function,
     * transformation or of glider type.
     * @param{Object} Callback Object type, e.g. JXG.Point, JXG.Text or JXG.Image
     * @param{Object} board Link to the board object
     * @param{Array} coords Array with coordinates. This may be: array of numbers, function
     * returning an array of numbers, array of functions returning a number, object and transformation.
     * If the attribute "slideObject" exists, a glider element is constructed.
     * @param{Object} attr Attributes object
     * @param{Object} arg1 Optional argument 1: in case of text this is the text content,
     * in case of an image this is the url.
     * @param{Array} arg2 Optional argument 2: in case of image this is an array containing the size of
     * the image.
     * @returns{Object} returns the created object or false.
     */
    JXG.CoordsElement.create = function (Callback, board, coords, attr, arg1, arg2) {
        var el, isConstrained = false, i;

        for (i = 0; i < coords.length; i++) {
            if (typeof coords[i] === 'function' || typeof coords[i] === 'string') {
                isConstrained = true;
            }
        }

        if (!isConstrained) {
            if ((Type.isNumber(coords[0])) && (Type.isNumber(coords[1]))) {
                el = new Callback(board, coords, attr, arg1, arg2);

                if (Type.exists(attr.slideobject)) {
                    el.makeGlider(attr.slideobject);
                } else {
                    // Free element
                    el.baseElement = el;
                }
                el.isDraggable = true;
            } else if ((typeof coords[0] === 'object') && (typeof coords[1] === 'object')) {
                // Transformation
                el = new Callback(board, [0, 0], attr, arg1, arg2);
                el.addTransform(coords[0], coords[1]);
                el.isDraggable = false;

                //el.parents = [coords[0].id];
            } else {
                return false;
            }
        } else {
            el = new Callback(board, [0, 0], attr, arg1, arg2);
            el.addConstraint(coords);
        }

        el.handleSnapToGrid();
        el.handleSnapToPoints();
        el.handleAttractors();

        el.addParents(coords);
        return el;
    };

    return JXG.CoordsElement;

});
