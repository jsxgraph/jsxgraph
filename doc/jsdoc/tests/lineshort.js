/**
 * 
 * @class Creates a new basic jxg line object. Do not use this constructor to create a line.
 * The abstract Line class is a basic class for all kind of line objects, e.g. line, arrow, and axis. It is usually defined by two points and can
 * be intersected with some other geometry elements.
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
     * Starting point of the line. You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     * @type JXG.Point
     * @private
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
         * Alias for {@link Line#Slope}
         * 
         * @returns {Number} The slope of the line or Infinity if the line is parallel to the y-axis.
         * 
         * @deprecated
         * @see Line#Slope
         */
        getSlope: function () {
            return this.Slope();
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
        }

    }
);
