/**
 * 
 * @class Creates a new basic jxg line object. Do not use this constructor to create a line.
 * The abstract Line class is a basic class for all kind of line objects, e.g. line, arrow, and axis. It is usually defined by two points and can
 * be intersected with some other geometry elements.
 * Use {@link JXG.Board#create} with
 * type {@link Line}, {@link Arrow}, or {@link Axis} instead.
 * @constructor
 * @private
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new line is drawn on.
 * @param {Point} p1 Startpoint of the line.
 * @param {Point} p2 Endpoint of the line.
 * @param {Object} attributes Javascript object containing attributes like name, id and colors.
 */
JXG.Line = function (board, p1, p2, attributes) {
    this.constructor(board, attributes, Const.OBJECT_TYPE_LINE, Const.OBJECT_CLASS_LINE);

    /**
     * Starting point of the line. You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     * @type JXG.Point
     */
    this.point1 = this.board.select(p1);

    /**
     * End point of the line. Just like {@link JXG.Line.point1} you shouldn't write this field directly.
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
};

JXG.Line.prototype = new GeometryElement();

Type.copyMethodMap(JXG.Line, {
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
         * @param {String} [unit='radians'] Unit of the returned values. Possible units are
         * <ul>
         * <li> 'radians' (default): angle value in radians
         * <li> 'degrees': angle value in degrees
         * <li> 'semicircle': angle value in radians as a multiple of &pi;, e.g. if the angle is 1.5&pi;, 1.5 will be returned.
         * <li> 'circle': angle value in radians as a multiple of 2&pi;
         * </ul>
         * @returns {Number}
         */
        getAngle: function (unit) {
            var val,
                rad = Math.atan2(-this.stdform[1], this.stdform[2]);

            if (Type.isString(unit) && unit !== '') {
                unit = unit.toLocaleLowerCase();
            } else {
                return rad;
            }

            if (unit === '' || unit.indexOf('rad') === 0) {
                val = rad;
            } else if (unit.indexOf('deg') === 0) {
                val = rad * 180 / Math.PI;
            } else if (unit.indexOf('sem') === 0) {
                val = rad / Math.PI;
            } else if (unit.indexOf('cir') === 0) {
                val = rad * 0.5 / Math.PI;
            }

            return val;
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

        removeTransform: function (transform) {
            var i,
                list = Type.isArray(transform) ? transform : [transform],
                len = list.length;

            for (i = 0; i < len; i++) {
                Type.removeElementFromArray(this.point1.transformations, list[i]);
                Type.removeElementFromArray(this.point2.transformations, list[i]);
            }

            return this;
        },

        clearTransforms: function () {
            this.point1.transformations = [];
            this.point2.transformations = [];

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
                        c2 = Geometry.projectPointToLine({coords: c1}, this, this.board);

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
        Ft: function (t) {
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
