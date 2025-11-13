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
 * @fileoverview The geometry object slider is defined in this file. Slider stores all
 * style and functional properties that are required to draw and use a slider on
 * a board.
 */

import JXG from "../jxg.js";
import Mat from "../math/math.js";
import Const from "../base/constants.js";
import Coords from "../base/coords.js";
import Type from "../utils/type.js";
import Point from "../base/point.js";

/**
 * @class A slider can be used to choose values from a given range of numbers.
 * @pseudo
 * @name Slider
 * @augments Glider
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array_Array} start,end,range The first two arrays give the start and the end where the slider is drawn
 * on the board. The third array gives the start and the end of the range the slider operates as the first resp. the
 * third component of the array. The second component of the third array gives its start value.
 *
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
 * // Create a slider taking integer values between 1 and 5. Initial value is 3.
 * var s = board.create('slider', [[1, 3], [3, 1], [0, 3, 5]], {
 *     snapWidth: 1,
 *     minTicksDistance: 60,
 *     drawLabels: false
 * });
 * </pre><div class="jxgbox" id="JXGe17128e6-a25d-462a-9074-49460b0d66f4" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('JXGe17128e6-a25d-462a-9074-49460b0d66f4', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1, 3], [3, 1], [1, 3, 5]], {
 *       snapWidth: 1,
 *       minTicksDistance: 60,
 *       drawLabels: false
 *     });
 *   })();
 * </script><pre>
 * @example
 *     // Draggable slider
 *     var s1 = board.create('slider', [[-3, 1], [2, 1],[-10, 1, 10]], {
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
 * @example
 * // Create a "frozen" slider
 * var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {
 *     name:'a',
 *     frozen: true
 * });
 *
 * </pre><div id="JXG23afea4f-2e91-4006-a505-2895033cf1fc" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG23afea4f-2e91-4006-a505-2895033cf1fc',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {
 *         name:'a',
 *         frozen: true
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Use MathJax for slider label (don't forget to load MathJax)
 * var s = board.create('slider', [[-3, 2], [2, 2], [-10, 1, 10]], {
 *     name: 'A^{(2)}',
 *     suffixLabel: '\\(A^{(2)} = ',
 *     unitLabel: ' \\;km/h ',
 *     postLabel: '\\)',
 *     label: {useMathJax: true}
 * });
 *
 * </pre><div id="JXG76e78c5f-3598-4d44-b43f-1d78fd15302c" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG76e78c5f-3598-4d44-b43f-1d78fd15302c',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Use MathJax for slider label (don't forget to load MathJax)
 *     var s = board.create('slider', [[-3,2], [2,2],[-10,1,10]], {
 *         name: 'A^{(2)}',
 *         suffixLabel: '\\(A^{(2)} = ',
 *         unitLabel: ' \\;km/h ',
 *         postLabel: '\\)',
 *         label: {useMathJax: true}
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 *
 */
JXG.createSlider = function (board, parents, attributes) {
    var pos0, pos1,
        smin, start, smax, diff,
        p1, p2, p3, l1, l2,
        ticks, ti, t,
        startx, starty,
        withText, withTicks,
        snapValues, snapValueDistance,
        snapWidth, sw, s,
        attr;

    attr = Type.copyAttributes(attributes, board.options, 'slider');
    withTicks = attr.withticks;
    withText = attr.withlabel;
    snapWidth = attr.snapwidth;
    snapValues = attr.snapvalues;
    snapValueDistance = attr.snapvaluedistance;

    // Start point
    p1 = board.create("point", parents[0], attr.point1);

    // End point
    p2 = board.create("point", parents[1], attr.point2);
    //g = board.create('group', [p1, p2]);

    // Base line
    l1 = board.create("segment", [p1, p2], attr.baseline);

    // This is required for a correct projection of the glider onto the segment below
    l1.updateStdform();

    pos0 = p1.coords.usrCoords.slice(1);
    pos1 = p2.coords.usrCoords.slice(1);
    smin = parents[2][0];
    start = parents[2][1];
    smax = parents[2][2];
    diff = smax - smin;

    sw = Type.evaluate(snapWidth);
    s = sw === -1 ?
        start :
        Math.round((start - smin)/ sw) * sw + smin;
        // Math.round(start / sw) * sw;
    startx = pos0[0] + ((pos1[0] - pos0[0]) * (s - smin)) / (smax - smin);
    starty = pos0[1] + ((pos1[1] - pos0[1]) * (s - smin)) / (smax - smin);

    // glider point
    // attr = Type.copyAttributes(attributes, board.options, 'slider');
    // overwrite this in any case; the sliders label is a special text element, not the gliders label.
    // this will be set back to true after the text was created (and only if withlabel was true initially).
    attr.withlabel = false;
    // gliders set snapwidth=-1 by default (i.e. deactivate them)
    p3 = board.create("glider", [startx, starty, l1], attr);
    p3.setAttribute({ snapwidth: snapWidth, snapvalues: snapValues, snapvaluedistance: snapValueDistance });

    // Segment from start point to glider point: highline
    // attr = Type.copyAttributes(attributes, board.options, "slider", 'highline');
    l2 = board.create("segment", [p1, p3], attr.highline);

    /**
     * Returns the current slider value.
     * @memberOf Slider.prototype
     * @name Value
     * @function
     * @returns {Number}
     */
    p3.Value = function () {
        var d = this._smax - this._smin,
            ev_sw = this.evalVisProp('snapwidth');

        return ev_sw === -1
            ? this.position * d + this._smin
            : Math.round((this.position * d) / ev_sw) * ev_sw  + this._smin;
    };

    p3.methodMap = Type.deepCopy(p3.methodMap, {
        Value: "Value",
        setValue: "setValue",
        smax: "_smax",
        // Max: "_smax",
        smin: "_smin",
        // Min: "_smin",
        setMax: "setMax",
        setMin: "setMin",
        point1: "point1",
        point2: "point2",
        baseline: "baseline",
        highline: "highline",
        ticks: "ticks",
        label: "label"
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
     * @function
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
     * @function
     * @param {Number} val New value
     * @returns {Object} this object
     */
    p3.setValue = function (val) {
        var d = this._smax - this._smin;

        if (Math.abs(d) > Mat.eps) {
            this.position = (val - this._smin) / d;
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
     * @function
     * @param {Number} val New minimum value
     * @returns {Object} this object
     */
    p3.setMin = function (val) {
        this._smin = val;
        return this;
    };

    if (withText) {
        // attr = Type.copyAttributes(attributes, board.options, 'slider', 'label');
        t = board.create('text', [
            function () {
                return (p2.X() - p1.X()) * 0.05 + p2.X();
            },
            function () {
                return (p2.Y() - p1.Y()) * 0.05 + p2.Y();
            },
            function () {
                var n,
                    d = p3.evalVisProp('digits'),
                    sl = p3.evalVisProp('suffixlabel'),
                    ul = p3.evalVisProp('unitlabel'),
                    pl = p3.evalVisProp('postlabel');

                if (d === 2 && p3.evalVisProp('precision') !== 2) {
                    // Backwards compatibility
                    d = p3.evalVisProp('precision');
                }

                if (sl !== null) {
                    n = sl;
                } else if (p3.name && p3.name !== "") {
                    n = p3.name + " = ";
                } else {
                    n = "";
                }

                if (p3.useLocale()) {
                    n += p3.formatNumberLocale(p3.Value(), d);
                } else {
                    n += Type.toFixed(p3.Value(), d);
                }

                if (ul !== null) {
                    n += ul;
                }
                if (pl !== null) {
                    n += pl;
                }

                return n;
            }
        ],
            attr.label
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

        // attr = Type.copyAttributes(attributes, board.options, "slider", 'ticks');
        if (!Type.exists(attr.generatelabeltext)) {
            attr.ticks.generateLabelText = function (tick, zero, value) {
                var labelText,
                    dFull = p3.point1.Dist(p3.point2),
                    smin = p3._smin,
                    smax = p3._smax,
                    val = (this.getDistanceFromZero(zero, tick) * (smax - smin)) / dFull + smin;

                if (dFull < Mat.eps || Math.abs(val) < Mat.eps) {
                    // Point is zero
                    labelText = '0';
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

                    return (d / dFull) * diff + smin;
                }
            ],
            attr.ticks
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

        Point.prototype.remove.call(p3);
    };

    p1.dump = false;
    p2.dump = false;
    l1.dump = false;
    l2.dump = false;
    if (withText) {
        t.dump = false;
    }

    // p3.type = Const.OBJECT_TYPE_SLIDER; // No! type has to be Const.OBJECT_TYPE_GLIDER
    p3.elType = 'slider';
    p3.parents = parents;
    p3.subs = {
        point1: p1,
        point2: p2,
        baseLine: l1,
        highLine: l2
    };
    p3.inherits.push(p1, p2, l1, l2);
    // Remove inherits to avoid circular inherits.
    l1.inherits = [];
    l2.inherits = [];

    if (withTicks) {
        ti.dump = false;
        p3.subs.ticks = ti;
        p3.inherits.push(ti);
    }

    p3.getParents = function () {
        return [
            this.point1.coords.usrCoords.slice(1),
            this.point2.coords.usrCoords.slice(1),
            [this._smin, this.position * (this._smax - this._smin) + this._smin, this._smax]
        ];
    };

    p3.baseline.on("up", function (evt) {
        var pos, c;

        if (p3.evalVisProp('moveonup') && !p3.evalVisProp('fixed')) {
            pos = l1.board.getMousePosition(evt, 0);
            c = new Coords(Const.COORDS_BY_SCREEN, pos, this.board);
            p3.moveTo([c.usrCoords[1], c.usrCoords[2]]);
            p3.triggerEventHandlers(['drag'], [evt]);
        }
    });

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

// export default {
//     createSlider: JXG.createSlider
// };
