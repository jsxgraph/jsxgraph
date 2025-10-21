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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The JSXGraph object Turtle is defined. It acts like
 * "turtle graphics".
 * @author A.W.
 */

import JXG from "../jxg.js";
import Const from "./constants.js";
import Mat from "../math/math.js";
import GeometryElement from "./element.js";
import Type from "../utils/type.js";

/**
 * Constructs a new Turtle object.
 * @class This is the Turtle class.
 * It is derived from {@link JXG.GeometryElement}.
 * It stores all properties required
 * to move a turtle.
 * @constructor
 * @param {JXG.Board} board The board the new turtle is drawn on.
 * @param {Array} parents Start position and start direction of the turtle. Possible values are
 * [x, y, angle]
 * [[x, y], angle]
 * [x, y]
 * [[x, y]]
 * @param {Object} attributes Attributes to change the visual properties of the turtle object
 * All angles are in degrees.
 *
 * @example
 *
 * //creates a figure 8 animation
 * var board = JXG.JSXGraph.initBoard('jxgbox',{boundingbox: [-250, 250, 250, -250]});
 * var t = board.create('turtle',[0, 0], {strokeOpacity:0.5});
 * t.setPenSize(3);
 * t.right(90);
 * var alpha = 0;
 *
 * var run = function() {
 *  t.forward(2);
 *  if (Math.floor(alpha / 360) % 2 === 0) {
 *   t.left(1);        // turn left by 1 degree
 *  } else {
 *   t.right(1);       // turn right by 1 degree
 *  }
 *  alpha += 1;
 *
 *  if (alpha < 1440) {  // stop after two rounds
 *   setTimeout(run, 20);
 *  }
 * }
 *
 *run();
 *
 * </pre><div class="jxgbox" id="JXG14167b1c-2ad3-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var brd = JXG.JSXGraph.initBoard('JXG14167b1c-2ad3-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-250, 250, 250, -250], axis: true, showcopyright: false, shownavigation: false});
 *               var t = brd.create('turtle',[0, 0], {strokeOpacity:0.5});
 *               t.setPenSize(3);
 *               t.right(90);
 *               var alpha = 0;
 *
 *              var run = function() {
 *              t.forward(2);
 *             if (Math.floor(alpha / 360) % 2 === 0) {
 *                t.left(1);        // turn left by 1 degree
 *              } else {
 *                   t.right(1);       // turn right by 1 degree
 *             }
 *             alpha += 1;
 *
 *             if (alpha < 1440) {  // stop after two rounds
 *                 setTimeout(run, 20);
 *               }
 *             }
 *
 *          run();
 *
 *     })();
 *
 * </script><pre>
 */
JXG.Turtle = function (board, parents, attributes) {
    var x, y, dir;

    this.constructor(board, attributes, Const.OBJECT_TYPE_TURTLE, Const.OBJECT_CLASS_OTHER);

    this.turtleIsHidden = false;
    this.board = board;
    this.visProp.curveType = 'plot';

    // Save visProp in this._attributes.
    // this._attributes is overwritten by setPenSize, setPenColor...
    // Setting the color or size affects the turtle from the time of
    // calling the method,
    // whereas Turtle.setAttribute affects all turtle curves.
    this._attributes = Type.copyAttributes(this.visProp, board.options, 'turtle');
    delete this._attributes.id;

    x = 0;
    y = 0;
    dir = 90;

    if (parents.length !== 0) {
        // [x,y,dir]
        if (parents.length === 3) {
            // Only numbers are accepted at the moment
            x = parents[0];
            y = parents[1];
            dir = parents[2];
        } else if (parents.length === 2) {
            // [[x,y],dir]
            if (Type.isArray(parents[0])) {
                x = parents[0][0];
                y = parents[0][1];
                dir = parents[1];
                // [x,y]
            } else {
                x = parents[0];
                y = parents[1];
            }
            // [[x,y]]
        } else {
            x = parents[0][0];
            y = parents[0][1];
        }
    }

    this.init(x, y, dir);

        this.methodMap = Type.deepCopy(this.methodMap, {
            forward: 'forward',
            fd: 'forward',
            back: 'back',
            bk: 'back',
            right: 'right',
            rt: 'right',
            left: 'left',
            lt: 'left',
            penUp: 'penUp',
            pu: 'penUp',
            up: 'penUp',
            penDown: 'penDown',
            pd: 'penDown',
            down: 'penDown',
            clearScreen: 'clearScreen',
            cs: 'clearScreen',
            clean: 'clean',
            setPos: 'setPos',
            home: 'home',
            hideTurtle: 'hideTurtle',
            ht: 'hideTurtle',
            hide: 'hideTurtle',
            showTurtle: 'showTurtle',
            st: 'showTurtle',
            show: 'showTurtle',
            penSize: 'setPenSize',
            setPenSize: 'setPenSize',
            penColor: 'setPenColor',
            setPenColor: 'setPenColor',
            highlightPenColor: 'setHighlightPenColor',
            setHighlightPenColor: 'setHighlightPenColor',
            getPenColor: 'getPenColor',
            Color: 'getPenColor',
            getHighlightPenColor: 'getHighlightPenColor',
            HighlightColor: 'getHighlightPenColor',
            getPenSize: 'getPenSize',
            Size: 'getPenSize',
            pushTurtle: 'pushTurtle',
            push: 'pushTurtle',
            popTurtle: 'popTurtle',
            pop: 'popTurtle',
            lookTo: 'lookTo',
            pos: 'pos',
            Pos: 'pos',
            moveTo: 'moveTo',
            X: 'X',
            Y: 'Y'
        });

    return this;
};

JXG.Turtle.prototype = new GeometryElement();

JXG.extend(
    JXG.Turtle.prototype,
    /** @lends JXG.Turtle.prototype */ {
        /**
         * Initialize a new turtle or reinitialize a turtle after {@link JXG.Turtle#clearScreen}.
         * @private
         */
        init: function (x, y, dir) {
            var hiddenPointAttr = {
                fixed: true,
                name: "",
                visible: false,
                withLabel: false
            };

            this.arrowLen =
                20 / Mat.hypot(this.board.unitX, this.board.unitY);

            this.pos = [x, y];
            this.isPenDown = true;
            this.dir = 90;
            this.stack = [];
            this.objects = [];
            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this._attributes
            );
            this.objects.push(this.curve);

            this.turtle = this.board.create("point", this.pos, hiddenPointAttr);
            this.objects.push(this.turtle);

            this.turtle2 = this.board.create(
                "point",
                [this.pos[0], this.pos[1] + this.arrowLen],
                hiddenPointAttr
            );
            this.objects.push(this.turtle2);

            this.visProp.arrow.lastArrow = true;
            this.visProp.arrow.straightFirst = false;
            this.visProp.arrow.straightLast = false;
            this.arrow = this.board.create(
                "line",
                [this.turtle, this.turtle2],
                this.visProp.arrow
            );
            this.objects.push(this.arrow);

            this.subs = {
                arrow: this.arrow
            };
            this.inherits.push(this.arrow);

            this.right(90 - dir);
            this.board.update();
        },

        /**
         * Move the turtle forward.
         * @param {Number} len of forward move in user coordinates
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        forward: function (len) {
            if (len === 0) {
                return this;
            }

            var t,
                dx = len * Math.cos((this.dir * Math.PI) / 180),
                dy = len * Math.sin((this.dir * Math.PI) / 180);

            if (!this.turtleIsHidden) {
                t = this.board.create("transform", [dx, dy], { type: "translate" });

                t.applyOnce(this.turtle);
                t.applyOnce(this.turtle2);
            }

            if (this.isPenDown) {
                // IE workaround
                if (this.curve.dataX.length >= 8192) {
                    this.curve = this.board.create(
                        "curve",
                        [[this.pos[0]], [this.pos[1]]],
                        this._attributes
                    );
                    this.objects.push(this.curve);
                }
            }

            this.pos[0] += dx;
            this.pos[1] += dy;

            if (this.isPenDown) {
                this.curve.dataX.push(this.pos[0]);
                this.curve.dataY.push(this.pos[1]);
            }

            this.board.update();
            return this;
        },

        /**
         * Move the turtle backwards.
         * @param {Number} len of backwards move in user coordinates
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        back: function (len) {
            return this.forward(-len);
        },

        /**
         * Rotate the turtle direction to the right
         * @param {Number} angle of the rotation in degrees
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        right: function (angle) {
            this.dir -= angle;
            this.dir %= 360;

            if (!this.turtleIsHidden) {
                var t = this.board.create(
                    "transform",
                    [(-angle * Math.PI) / 180, this.turtle],
                    { type: "rotate" }
                );
                t.applyOnce(this.turtle2);
            }

            this.board.update();
            return this;
        },

        /**
         * Rotate the turtle direction to the right.
         * @param {Number} angle of the rotation in degrees
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        left: function (angle) {
            return this.right(-angle);
        },

        /**
         * Pen up, stops visible drawing
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        penUp: function () {
            this.isPenDown = false;
            return this;
        },

        /**
         * Pen down, continues visible drawing
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        penDown: function () {
            this.isPenDown = true;
            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this._attributes
            );
            this.objects.push(this.curve);

            return this;
        },

        /**
         * Removes the turtle curve from the board. The turtle stays in its position.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        clean: function () {
            var i, el;

            for (i = 0; i < this.objects.length; i++) {
                el = this.objects[i];
                if (el.type === Const.OBJECT_TYPE_CURVE) {
                    this.board.removeObject(el);
                    this.objects.splice(i, 1);
                }
            }

            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this._attributes
            );
            this.objects.push(this.curve);
            this.board.update();

            return this;
        },

        /**
         *  Removes the turtle completely and resets it to its initial position and direction.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        clearScreen: function () {
            // var i,
            //     el,
            //     len = this.objects.length;
            // for (i = len - 1; i >= 0; i--) {
            //     el = this.objects[i];
            //     this.board.removeObject(el);
            // }
            // It is much faster to remove the whole array of pathes.
            this.board.removeObject(this.objects);
            this.objects = [];

            this.init(0, 0, 90);
            return this;
        },

        /**
         *  Moves the turtle without drawing to a new position
         * @param {Number} x new x- coordinate
         * @param {Number} y new y- coordinate
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        setPos: function (x, y) {
            var t;

            if (Type.isArray(x)) {
                this.pos = x;
            } else {
                this.pos = [x, y];
            }

            if (!this.turtleIsHidden) {
                this.turtle.setPositionDirectly(Const.COORDS_BY_USER, [x, y]);
                this.turtle2.setPositionDirectly(Const.COORDS_BY_USER, [x, y + this.arrowLen]);
                t = this.board.create(
                    "transform",
                    [(-(this.dir - 90) * Math.PI) / 180, this.turtle],
                    { type: "rotate" }
                );
                t.applyOnce(this.turtle2);
            }

            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this._attributes
            );
            this.objects.push(this.curve);
            this.board.update();

            return this;
        },

        /**
         *  Sets the pen size. Equivalent to setAttribute({strokeWidth:size})
         * but affects only the future turtle.
         * @param {Number} size
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        setPenSize: function (size) {
            //this.visProp.strokewidth = size;
            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this.copyAttr("strokeWidth", size)
            );
            this.objects.push(this.curve);
            return this;
        },

        /**
         *  Sets the pen color. Equivalent to setAttribute({strokeColor:color})
         * but affects only the future turtle.
         * @param {String} color
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        setPenColor: function (color) {
            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this.copyAttr("strokeColor", color)
            );
            this.objects.push(this.curve);

            return this;
        },

        /**
         * Get attribute of the last turtle curve object.
         *
         * @param {String} key
         * @returns attribute value
         * @private
         */
        getPenAttribute: function(key) {
            var pos, le = this.objects.length;
            if (le === 4) {
                // No new turtle objects have been created
                pos = 0;
            } else {
                pos = le - 1;
            }
            return this.objects[pos].evalVisProp(key);
        },

        /**
         * Get most recently set turtle size (in pixel).
         * @returns Number Size of the last turtle segment in pixel.
         */
        getPenSize: function() {
            return this.getPenAttribute('strokewidth');
        },

        /**
         * Get most recently set turtle color.
         * @returns String RGB color value of the last turtle segment.
         */
        getPenColor: function() {
            return this.getPenAttribute('strokecolor');
        },

        /**
         * Get most recently set turtle color.
         * @returns String RGB highlight color value of the last turtle segment.
         */
         getHighlightPenColor: function() {
            return this.getPenAttribute('highlightstrokecolor');
        },

        /**
         *  Sets the highlight pen color. Equivalent to setAttribute({highlightStrokeColor:color})
         * but affects only the future turtle.
         * @param {String} color
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        setHighlightPenColor: function (color) {
            //this.visProp.highlightstrokecolor = colStr;
            this.curve = this.board.create(
                "curve",
                [[this.pos[0]], [this.pos[1]]],
                this.copyAttr("highlightStrokeColor", color)
            );
            this.objects.push(this.curve);
            return this;
        },

        /**
         * Sets properties of the turtle, see also {@link JXG.GeometryElement#setAttribute}.
         * Sets the property for all curves of the turtle in the past and in the future.
         * @param {Object} attributes key:value pairs
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        setAttribute: function (attributes) {
            var i,
                el,
                tmp,
                len = this.objects.length;

            for (i = 0; i < len; i++) {
                el = this.objects[i];
                if (el.type === Const.OBJECT_TYPE_CURVE) {
                    el.setAttribute(attributes);
                }
            }

            // Set visProp of turtle
            tmp = this.visProp.id;
            this.visProp = Type.deepCopy(this.curve.visProp);
            this.visProp.id = tmp;
            this._attributes = Type.deepCopy(this.visProp);
            delete this._attributes.id;

            return this;
        },

        /**
         * Set a future attribute of the turtle.
         * @private
         * @param {String} key
         * @param {Number|String} val
         * @returns {Object} pointer to the attributes object
         */
        copyAttr: function (key, val) {
            this._attributes[key.toLowerCase()] = val;
            return this._attributes;
        },

        /**
         * Sets the visibility of the turtle head to true,
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        showTurtle: function () {
            this.turtleIsHidden = false;
            this.arrow.setAttribute({ visible: true });
            this.visProp.arrow.visible = false;
            this.setPos(this.pos[0], this.pos[1]);
            this.board.update();

            return this;
        },

        /**
         * Sets the visibility of the turtle head to false,
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        hideTurtle: function () {
            this.turtleIsHidden = true;
            this.arrow.setAttribute({ visible: false });
            this.visProp.arrow.visible = false;
            this.board.update();

            return this;
        },

        /**
         * Moves the turtle to position [0,0].
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        home: function () {
            this.pos = [0, 0];
            this.setPos(this.pos[0], this.pos[1]);

            return this;
        },

        /**
         *  Pushes the position of the turtle on the stack.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        pushTurtle: function () {
            this.stack.push([this.pos[0], this.pos[1], this.dir]);

            return this;
        },

        /**
         *  Gets the last position of the turtle on the stack, sets the turtle to this position and removes this
         * position from the stack.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        popTurtle: function () {
            var status = this.stack.pop();
            this.pos[0] = status[0];
            this.pos[1] = status[1];
            this.dir = status[2];
            this.setPos(this.pos[0], this.pos[1]);

            return this;
        },

        /**
         * Rotates the turtle into a new direction.
         * There are two possibilities:
         * @param {Number|Array} target If a number is given, it is interpreted as the new direction to look to; If an array
         * consisting of two Numbers is given targeted is used as a pair coordinates.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        lookTo: function (target) {
            var ax, ay, bx, by, beta;

            if (Type.isArray(target)) {
                ax = this.pos[0];
                ay = this.pos[1];
                bx = target[0];
                by = target[1];

                // Rotate by the slope of the line [this.pos, target]
                beta = Math.atan2(by - ay, bx - ax);
                this.right(this.dir - (beta * 180) / Math.PI);
            } else if (Type.isNumber(target)) {
                this.right(this.dir - target);
            }
            return this;
        },

        /**
         * Moves the turtle to a given coordinate pair.
         * The direction is not changed.
         * @param {Array} target Coordinates of the point where the turtle looks to.
         * @returns {JXG.Turtle} pointer to the turtle object
         */
        moveTo: function (target) {
            var dx, dy, t;

            if (Type.isArray(target)) {
                dx = target[0] - this.pos[0];
                dy = target[1] - this.pos[1];

                if (!this.turtleIsHidden) {
                    t = this.board.create("transform", [dx, dy], { type: "translate" });
                    t.applyOnce(this.turtle);
                    t.applyOnce(this.turtle2);
                }

                if (this.isPenDown) {
                    // IE workaround
                    if (this.curve.dataX.length >= 8192) {
                        this.curve = this.board.create(
                            "curve",
                            [[this.pos[0]], [this.pos[1]]],
                            this._attributes
                        );
                        this.objects.push(this.curve);
                    }
                }

                this.pos[0] = target[0];
                this.pos[1] = target[1];

                if (this.isPenDown) {
                    this.curve.dataX.push(this.pos[0]);
                    this.curve.dataY.push(this.pos[1]);
                }
                this.board.update();
            }

            return this;
        },

        /**
         * Alias for {@link JXG.Turtle#forward}
         */
        fd: function (len) {
            return this.forward(len);
        },
        /**
         * Alias for {@link JXG.Turtle#back}
         */
        bk: function (len) {
            return this.back(len);
        },
        /**
         * Alias for {@link JXG.Turtle#left}
         */
        lt: function (angle) {
            return this.left(angle);
        },
        /**
         * Alias for {@link JXG.Turtle#right}
         */
        rt: function (angle) {
            return this.right(angle);
        },
        /**
         * Alias for {@link JXG.Turtle#penUp}
         */
        pu: function () {
            return this.penUp();
        },
        /**
         * Alias for {@link JXG.Turtle#penDown}
         */
        pd: function () {
            return this.penDown();
        },
        /**
         * Alias for {@link JXG.Turtle#hideTurtle}
         */
        ht: function () {
            return this.hideTurtle();
        },
        /**
         * Alias for {@link JXG.Turtle#showTurtle}
         */
        st: function () {
            return this.showTurtle();
        },
        /**
         * Alias for {@link JXG.Turtle#clearScreen}
         */
        cs: function () {
            return this.clearScreen();
        },
        /**
         * Alias for {@link JXG.Turtle#pushTurtle}
         */
        push: function () {
            return this.pushTurtle();
        },
        /**
         * Alias for {@link JXG.Turtle#popTurtle}
         */
        pop: function () {
            return this.popTurtle();
        },

        /**
         * The "co"-coordinate of the turtle curve at position t is returned.
         *
         * @param {Number} t parameter
         * @param {String} co. Either 'X' or 'Y'.
         * @returns {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
         */
        evalAt: function (t, co) {
            var i,
                j,
                el,
                tc,
                len = this.objects.length;

            for (i = 0, j = 0; i < len; i++) {
                el = this.objects[i];

                if (el.elementClass === Const.OBJECT_CLASS_CURVE) {
                    if (j <= t && t < j + el.numberPoints) {
                        tc = t - j;
                        return el[co](tc);
                    }
                    j += el.numberPoints;
                }
            }

            return this[co]();
        },

        /**
         * if t is not supplied the x-coordinate of the turtle is returned. Otherwise
         * the x-coordinate of the turtle curve at position t is returned.
         * @param {Number} t parameter
         * @returns {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
         */
        X: function (t) {
            if (!Type.exists(t)) {
                return this.pos[0];
            }

            return this.evalAt(t, 'X');
        },

        /**
         * if t is not supplied the y-coordinate of the turtle is returned. Otherwise
         * the y-coordinate of the turtle curve at position t is returned.
         * @param {Number} t parameter
         * @returns {Number} x-coordinate of the turtle position or x-coordinate of turtle at position t
         */
        Y: function (t) {
            if (!Type.exists(t)) {
                return this.pos[1];
            }
            return this.evalAt(t, 'Y');
        },

        /**
         * @returns {Number} z-coordinate of the turtle position
         */
        Z: function (t) {
            return 1.0;
        },

        /**
         * Gives the lower bound of the parameter if the turtle is treated as parametric curve.
         */
        minX: function () {
            return 0;
        },

        /**
         * Gives the upper bound of the parameter if the turtle is treated as parametric curve.
         * May be overwritten in @see generateTerm.
         */
        maxX: function () {
            var i,
                el,
                len = this.objects.length,
                np = 0;

            for (i = 0; i < len; i++) {
                el = this.objects[i];
                if (el.elementClass === Const.OBJECT_CLASS_CURVE) {
                    np += this.objects[i].numberPoints;
                }
            }
            return np;
        },

        /**
         * Checks whether (x,y) is near the curve.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the curve, False otherwise.
         */
        hasPoint: function (x, y) {
            var i, el;

            // run through all curves of this turtle
            for (i = 0; i < this.objects.length; i++) {
                el = this.objects[i];

                if (el.type === Const.OBJECT_TYPE_CURVE) {
                    if (el.hasPoint(x, y)) {
                        // So what??? All other curves have to be notified now (for highlighting)
                        return true;
                        // This has to be done, yet.
                    }
                }
            }
            return false;
        }
    }
);

/**
 * @class A turtle is a graphic paradigm similar to the programming languages Logo or PostScript.
 * @pseudo
 * @description  Creates a new turtle
 * @name Turtle
 * @augments JXG.Turtle
 * @constructor
 * @type JXG.Turtle
 *
 * @param {JXG.Board} board The board the turtle is put on.
 * @param {Array} parents
 * @param {Object} attributes Object containing properties for the element such as stroke-color and visibility. See {@link JXG.GeometryElement#setAttribute}
 * @returns {JXG.Turtle} Reference to the created turtle object.
 */
JXG.createTurtle = function (board, parents, attributes) {
    var attr;
    parents = parents || [];

    attr = Type.copyAttributes(attributes, board.options, 'turtle');
    return new JXG.Turtle(board, parents, attr);
};

JXG.registerElement("turtle", JXG.createTurtle);

export default JXG.Turtle;
// export default {
//     Turtle: JXG.Turtle,
//     createTurtle: JXG.createTurtle
// };
