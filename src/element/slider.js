/*
    Copyright 2008-2022
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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The geometry object slider is defined in this file. Slider stores all
 * style and functional properties that are required to draw and use a slider on
 * a board.
 */

import JXG from "../jxg";
import Mat from "../math/math";
import Const from "../base/constants";
import Coords from "../base/coords";
import Type from "../utils/type";
import Point from "../base/point";

/**
 * @class A slider can be used to choose values from a given range of numbers.
 * @pseudo
 * @description
 * @name Slider
 * @augments Glider
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array_Array} start,end,data The first two arrays give the start and the end where the slider is drawn
 * on the board. The third array gives the start and the end of the range the slider operates as the first resp. the
 * third component of the array. The second component of the third array gives its start value.
 * @example
 * // Create a slider with values between 1 and 10, initial position is 5.
 * var s = board.create('slider', [[1, 2], [3, 2], [1, 5, 10]]);
 * </pre><div class="jxgbox" id="JXGcfb51cde-2603-4f18-9cc4-1afb452b374d" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('JXGcfb51cde-2603-4f18-9cc4-1afb452b374d', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1, 2], [3, 2], [1, 5, 10]]);
 *   })();
 * </script><pre>
 * @example
 * // Create a slider taking integer values between 1 and 50. Initial value is 50.
 * var s = board.create('slider', [[1, 3], [3, 1], [0, 10, 50]], {snapWidth: 1, ticks: { drawLabels: true }});
 * </pre><div class="jxgbox" id="JXGe17128e6-a25d-462a-9074-49460b0d66f4" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('JXGe17128e6-a25d-462a-9074-49460b0d66f4', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1, 3], [3, 1], [1, 10, 50]], {snapWidth: 1, ticks: { drawLabels: true }});
 *   })();
 * </script><pre>
 * @example
 *     // Draggable slider
 *     var s1 = board.create('slider', [[-3,1], [2,1],[-10,1,10]], {
 *         visible: true,
 *         snapWidth: 2,
 *         point1: {fixed: false},
 *         point2: {fixed: false},
 *         baseline: {fixed: false, needsRegularUpdate: true}
 *     });
 *
 * </pre><div id="JXGbfc67817-2827-44a1-bc22-40bf312e76f8" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGbfc67817-2827-44a1-bc22-40bf312e76f8',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *         var s1 = board.create('slider', [[-3,1], [2,1],[-10,1,10]], {
 *             visible: true,
 *             snapWidth: 2,
 *             point1: {fixed: false},
 *             point2: {fixed: false},
 *             baseline: {fixed: false, needsRegularUpdate: true}
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 *     // Set the slider by clicking on the base line: attribute 'moveOnUp'
 *     var s1 = board.create('slider', [[-3,1], [2,1],[-10,1,10]], {
 *         snapWidth: 2,
 *         moveOnUp: true // default value
 *     });
 *
 * </pre><div id="JXGc0477c8a-b1a7-4111-992e-4ceb366fbccc" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGc0477c8a-b1a7-4111-992e-4ceb366fbccc',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *         var s1 = board.create('slider', [[-3,1], [2,1],[-10,1,10]], {
 *             snapWidth: 2,
 *             moveOnUp: true // default value
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Set colors
 * var sl = board.create('slider', [[-3, 1], [1, 1], [-10, 1, 10]], {
 *
 *   baseline: { strokeColor: 'blue'},
 *   highline: { strokeColor: 'red'},
 *   fillColor: 'yellow',
 *   label: {fontSize: 24, strokeColor: 'orange'},
 *   name: 'xyz', // Not shown, if suffixLabel is set
 *   suffixLabel: 'x = ',
 *   postLabel: ' u'
 *
 * });
 *
 * </pre><div id="JXGd96c9e2c-2c25-4131-b6cf-9dbb80819401" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGd96c9e2c-2c25-4131-b6cf-9dbb80819401',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var sl = board.create('slider', [[-3, 1], [1, 1], [-10, 1, 10]], {
 *
 *       baseline: { strokeColor: 'blue'},
 *       highline: { strokeColor: 'red'},
 *       fillColor: 'yellow',
 *       label: {fontSize: 24, strokeColor: 'orange'},
 *       name: 'xyz', // Not shown, if suffixLabel is set
 *       suffixLabel: 'x = ',
 *       postLabel: ' u'
 *
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createSlider = function (board, parents, attributes) {
    var pos0,
        pos1,
        smin,
        start,
        smax,
        sdiff,
        p1,
        p2,
        l1,
        ticks,
        ti,
        startx,
        starty,
        p3,
        l2,
        t,
        withText,
        withTicks,
        snapWidth,
        sw,
        s,
        attr,
        digits;

    attr = Type.copyAttributes(attributes, board.options, "slider");
    withTicks = attr.withticks;
    withText = attr.withlabel;
    snapWidth = attr.snapwidth;

    // start point
    attr = Type.copyAttributes(attributes, board.options, "slider", "point1");
    p1 = board.create("point", parents[0], attr);

    // end point
    attr = Type.copyAttributes(attributes, board.options, "slider", "point2");
    p2 = board.create("point", parents[1], attr);
    //g = board.create('group', [p1, p2]);

    // Base line
    attr = Type.copyAttributes(attributes, board.options, "slider", "baseline");
    l1 = board.create("segment", [p1, p2], attr);

    // This is required for a correct projection of the glider onto the segment below
    l1.updateStdform();

    pos0 = p1.coords.usrCoords.slice(1);
    pos1 = p2.coords.usrCoords.slice(1);
    smin = parents[2][0];
    start = parents[2][1];
    smax = parents[2][2];
    sdiff = smax - smin;

    sw = Type.evaluate(snapWidth);
    s = sw === -1 ? start : Math.round(start / sw) * sw;
    startx = pos0[0] + ((pos1[0] - pos0[0]) * (s - smin)) / (smax - smin);
    starty = pos0[1] + ((pos1[1] - pos0[1]) * (s - smin)) / (smax - smin);

    // glider point
    attr = Type.copyAttributes(attributes, board.options, "slider");
    // overwrite this in any case; the sliders label is a special text element, not the gliders label.
    // this will be set back to true after the text was created (and only if withlabel was true initially).
    attr.withLabel = false;
    // gliders set snapwidth=-1 by default (i.e. deactivate them)
    p3 = board.create("glider", [startx, starty, l1], attr);
    p3.setAttribute({ snapwidth: snapWidth });

    // Segment from start point to glider point: highline
    attr = Type.copyAttributes(attributes, board.options, "slider", "highline");
    l2 = board.create("segment", [p1, p3], attr);

    /**
     * Returns the current slider value.
     * @memberOf Slider.prototype
     * @name Value
     * @function
     * @returns {Number}
     */
    p3.Value = function () {
        var sdiff = this._smax - this._smin,
            ev_sw = Type.evaluate(this.visProp.snapwidth);

        return ev_sw === -1
            ? this.position * sdiff + this._smin
            : Math.round((this.position * sdiff + this._smin) / ev_sw) * ev_sw;
    };

    p3.methodMap = Type.deepCopy(p3.methodMap, {
        Value: "Value",
        setValue: "setValue",
        smax: "_smax",
        smin: "_smin",
        setMax: "setMax",
        setMin: "setMin",
    });

    /**
     * End value of the slider range.
     * @memberOf Slider.prototype
     * @name _smax
     * @type Number
     */
    p3._smax = smax;

    /**
     * Start value of the slider range.
     * @memberOf Slider.prototype
     * @name _smin
     * @type Number
     */
    p3._smin = smin;

    /**
     * Sets the maximum value of the slider.
     * @memberOf Slider.prototype
     * @name setMax
     * @param {Number} val New maximum value
     * @returns {Object} this object
     */
    p3.setMax = function (val) {
        this._smax = val;
        return this;
    };

    /**
     * Sets the value of the slider. This call must be followed
     * by a board update call.
     * @memberOf Slider.prototype
     * @name setValue
     * @param {Number} val New value
     * @returns {Object} this object
     */
    p3.setValue = function (val) {
        var sdiff = this._smax - this._smin;

        if (Math.abs(sdiff) > Mat.eps) {
            this.position = (val - this._smin) / sdiff;
        } else {
            this.position = 0.0; //this._smin;
        }
        this.position = Math.max(0.0, Math.min(1.0, this.position));
        return this;
    };

    /**
     * Sets the minimum value of the slider.
     * @memberOf Slider.prototype
     * @name setMin
     * @param {Number} val New minimum value
     * @returns {Object} this object
     */
    p3.setMin = function (val) {
        this._smin = val;
        return this;
    };

    if (withText) {
        attr = Type.copyAttributes(attributes, board.options, "slider", "label");
        t = board.create(
            "text",
            [
                function () {
                    return (p2.X() - p1.X()) * 0.05 + p2.X();
                },
                function () {
                    return (p2.Y() - p1.Y()) * 0.05 + p2.Y();
                },
                function () {
                    var n,
                        d = Type.evaluate(p3.visProp.digits),
                        sl = Type.evaluate(p3.visProp.suffixlabel),
                        ul = Type.evaluate(p3.visProp.unitlabel),
                        pl = Type.evaluate(p3.visProp.postlabel);

                    if (d === 2 && Type.evaluate(p3.visProp.precision) !== 2) {
                        // Backwards compatibility
                        d = Type.evaluate(p3.visProp.precision);
                    }

                    if (sl !== null) {
                        n = sl;
                    } else if (p3.name && p3.name !== "") {
                        n = p3.name + " = ";
                    } else {
                        n = "";
                    }

                    n += Type.toFixed(p3.Value(), d);

                    if (ul !== null) {
                        n += ul;
                    }
                    if (pl !== null) {
                        n += pl;
                    }

                    return n;
                },
            ],
            attr
        );

        /**
         * The text element to the right of the slider, indicating its current value.
         * @memberOf Slider.prototype
         * @name label
         * @type JXG.Text
         */
        p3.label = t;

        // reset the withlabel attribute
        p3.visProp.withlabel = true;
        p3.hasLabel = true;
    }

    /**
     * Start point of the base line.
     * @memberOf Slider.prototype
     * @name point1
     * @type JXG.Point
     */
    p3.point1 = p1;

    /**
     * End point of the base line.
     * @memberOf Slider.prototype
     * @name point2
     * @type JXG.Point
     */
    p3.point2 = p2;

    /**
     * The baseline the glider is bound to.
     * @memberOf Slider.prototype
     * @name baseline
     * @type JXG.Line
     */
    p3.baseline = l1;

    /**
     * A line on top of the baseline, indicating the slider's progress.
     * @memberOf Slider.prototype
     * @name highline
     * @type JXG.Line
     */
    p3.highline = l2;

    if (withTicks) {
        // Function to generate correct label texts

        attr = Type.copyAttributes(attributes, board.options, "slider", "ticks");
        if (!Type.exists(attr.generatelabeltext)) {
            attr.generateLabelText = function (tick, zero, value) {
                var labelText,
                    dFull = p3.point1.Dist(p3.point2),
                    smin = p3._smin,
                    smax = p3._smax,
                    val = (this.getDistanceFromZero(zero, tick) * (smax - smin)) / dFull + smin;

                if (dFull < Mat.eps || Math.abs(val) < Mat.eps) {
                    // Point is zero
                    labelText = "0";
                } else {
                    labelText = this.formatLabelText(val);
                }
                return labelText;
            };
        }
        ticks = 2;
        ti = board.create(
            "ticks",
            [
                p3.baseline,
                p3.point1.Dist(p1) / ticks,

                function (tick) {
                    var dFull = p3.point1.Dist(p3.point2),
                        d = p3.point1.coords.distance(Const.COORDS_BY_USER, tick);

                    if (dFull < Mat.eps) {
                        return 0;
                    }

                    return (d / dFull) * sdiff + smin;
                },
            ],
            attr
        );

        /**
         * Ticks give a rough indication about the slider's current value.
         * @memberOf Slider.prototype
         * @name ticks
         * @type JXG.Ticks
         */
        p3.ticks = ti;
    }

    // override the point's remove method to ensure the removal of all elements
    p3.remove = function () {
        if (withText) {
            board.removeObject(t);
        }

        board.removeObject(l2);
        board.removeObject(l1);
        board.removeObject(p2);
        board.removeObject(p1);

        Point.Point.prototype.remove.call(p3);
    };

    p1.dump = false;
    p2.dump = false;
    l1.dump = false;
    l2.dump = false;
    if (withText) {
        t.dump = false;
    }

    p3.elType = "slider";
    p3.parents = parents;
    p3.subs = {
        point1: p1,
        point2: p2,
        baseLine: l1,
        highLine: l2,
    };
    p3.inherits.push(p1, p2, l1, l2);

    if (withTicks) {
        ti.dump = false;
        p3.subs.ticks = ti;
        p3.inherits.push(ti);
    }

    p3.getParents = function () {
        return [
            this.point1.coords.usrCoords.slice(1),
            this.point2.coords.usrCoords.slice(1),
            [this._smin, this.position * (this._smax - this._smin) + this._smin, this._smax],
        ];
    };

    p3.baseline.on("up", function (evt) {
        var pos, c;

        if (Type.evaluate(p3.visProp.moveonup) && !Type.evaluate(p3.visProp.fixed)) {
            pos = l1.board.getMousePosition(evt, 0);
            c = new Coords(Const.COORDS_BY_SCREEN, pos, this.board);
            p3.moveTo([c.usrCoords[1], c.usrCoords[2]]);
        }
    });

    // Save the visibility attribute of the sub-elements
    // for (el in p3.subs) {
    //     p3.subs[el].status = {
    //         visible: p3.subs[el].visProp.visible
    //     };
    // }

    // p3.hideElement = function () {
    //     var el;
    //     GeometryElement.prototype.hideElement.call(this);
    //
    //     for (el in this.subs) {
    //         // this.subs[el].status.visible = this.subs[el].visProp.visible;
    //         this.subs[el].hideElement();
    //     }
    // };

    //         p3.showElement = function () {
    //             var el;
    //             GeometryElement.prototype.showElement.call(this);
    //
    //             for (el in this.subs) {
    // //                if (this.subs[el].status.visible) {
    //                 this.subs[el].showElement();
    // //                }
    //             }
    //         };

    // This is necessary to show baseline, highline and ticks
    // when opening the board in case the visible attributes are set
    // to 'inherit'.
    p3.prepareUpdate().update();
    if (!board.isSuspendedUpdate) {
        p3.updateVisibility().updateRenderer();
        p3.baseline.updateVisibility().updateRenderer();
        p3.highline.updateVisibility().updateRenderer();
        if (withTicks) {
            p3.ticks.updateVisibility().updateRenderer();
        }
    }

    return p3;
};

JXG.registerElement("slider", JXG.createSlider);

export default {
    createSlider: JXG.createSlider,
};
