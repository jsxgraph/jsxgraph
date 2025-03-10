/*
    Copyright 2008-2025
        Matthias Ehmann,
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview Implementation of vector fields and slope fields.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * @class  A vector field on a plane can be visualized as a collection of arrows
 * with given magnitudes and directions, each attached to a point on the plane.
 * <p>
 * Plot a vector field either given by two functions f1(x, y) and f2(x,y) or by a function f(x, y) returning an array of size 2.
 *
 * @pseudo
 * @name Vectorfield
 * @augments JXG.Curve
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * Parameter options:
 * @param {Array|Function|String} F Either an array containing two functions f1(x, y) and f2(x, y) or function f(x, y) returning an array of length 2.
 * @param {Array} xData Array of length 3 containing start value for x, number of steps, end value of x. The vector field will contain
 * (number of steps) + 1 vectors in direction of x.
 * @param {Array} yData Array of length 3 containing start value for y, number of steps, end value of y. The vector field will contain
 * (number of steps) + 1 vectors in direction of y.
 *
 * @example
 * // Defining functions
 * var fx = (x, y) => Math.sin(y);
 * var fy = (x, y) => Math.cos(x);
 *
 * var field = board.create('vectorfield', [
 *         [fx, fy],    // Defining function
 *         [-6, 25, 6], // Horizontal mesh
 *         [-5, 20, 5], // Vertical mesh
 *     ]);
 *
 * </pre><div id="JXGa2040e30-48ea-47d4-9840-bd24cd49150b" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGa2040e30-48ea-47d4-9840-bd24cd49150b',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Defining functions
 *     var fx = (x, y) => Math.sin(y);
 *     var fy = (x, y) => Math.cos(x);
 *
 *     var field = board.create('vectorfield', [
 *             [fx, fy],    // Defining function
 *             [-6, 25, 6], // Horizontal mesh
 *             [-5, 20, 5], // Vertical mesh
 *         ]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Slider to control length of vectors
 * var s = board.create('slider', [[-3, 7], [3, 7], [0, 0.33, 1]], {name: 'length'});
 * // Slider to control number of steps
 * var stepsize = board.create('slider', [[-3, 6], [3, 6], [1, 20, 100]], {name: 'steps', snapWidth: 1});
 *
 * // Defining functions
 * var fx = (x, y) => 0.2 * y;
 * var fy = (x, y) => 0.2 * (Math.cos(x) - 2) * Math.sin(x);
 *
 * var field = board.create('vectorfield', [
 *         [fx, fy],        // Defining function
 *         [-6, () => stepsize.Value(), 6], // Horizontal mesh
 *         [-5, () => stepsize.Value(), 5], // Vertical mesh
 *     ], {
 *         highlightStrokeColor: JXG.palette.blue, // Make highlighting invisible
 *
 *         scale: () => s.Value(), // Scaling of vectors
 *
 *         arrowHead: {
 *             enabled: true,
 *             size: 8,  // Pixel length of arrow head
 *             angle: Math.PI / 16
 *         }
 * });
 *
 * </pre><div id="JXG9196337e-66f0-4d09-8065-11d88c4ff140" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG9196337e-66f0-4d09-8065-11d88c4ff140',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Slider to control length of vectors
 *     var s = board.create('slider', [[-3, 7], [3, 7], [0, 0.33, 1]], {name: 'length'});
 *     // Slider to control number of steps
 *     var stepsize = board.create('slider', [[-3, 6], [3, 6], [1, 20, 100]], {name: 'steps', snapWidth: 1});
 *
 *     // Defining functions
 *     var fx = (x, y) => 0.2 * y;
 *     var fy = (x, y) => 0.2 * (Math.cos(x) - 2) * Math.sin(x);
 *
 *     var field = board.create('vectorfield', [
 *             [fx, fy],        // Defining function
 *             [-6, () => stepsize.Value(), 6], // Horizontal mesh
 *             [-5, () => stepsize.Value(), 5], // Vertical mesh
 *         ], {
 *             highlightStrokeColor: JXG.palette.blue, // Make highlighting invisible
 *
 *             scale: () => s.Value(), // Scaling of vectors
 *
 *             arrowHead: {
 *                 enabled: true,
 *                 size: 8,  // Pixel length of arrow head
 *                 angle: Math.PI / 16
 *             }
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createVectorField = function (board, parents, attributes) {
    var el, attr;

    if (!(parents.length >= 3 &&
        (Type.isArray(parents[0]) || Type.isFunction(parents[0]) || Type.isString(parents[0])) &&
        (Type.isArray(parents[1]) && parents[1].length === 3) &&
        (Type.isArray(parents[2]) && parents[2].length === 3)
    )) {
        throw new Error(
            "JSXGraph: Can't create vector field with parent types " +
            "'" + typeof parents[0] + "', " +
            "'" + typeof parents[1] + "', " +
            "'" + typeof parents[2] + "'."
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'vectorfield');

    /**
     * @type {JXG.Curve}
     * @ignore
     */
    el = board.create('curve', [[], []], attr);
    el.elType = 'vectorfield';

    /**
     * Set the defining functions of vector field.
     * @memberOf Vectorfield
     * @name setF
     * @function
     * @param {Array|Function} func Either an array containing two functions f1(x, y) and f2(x, y) or function f(x, y) returning an array of length 2.
     * @returns {Object} Reference to the vector field object.
     *
     * @example
     * field.setF([(x, y) => Math.sin(y), (x, y) => Math.cos(x)]);
     * board.update();
     *
     */
    el.setF = function (func, varnames) {
        var f0, f1;
        if (Type.isArray(func)) {
            f0 = Type.createFunction(func[0], this.board, varnames);
            f1 = Type.createFunction(func[1], this.board, varnames);
            /**
             * @ignore
             */
            this.F = function (x, y) { return [f0(x, y), f1(x, y)]; };
        } else {
            this.F = Type.createFunction(func, el.board, varnames);
        }
        return this;
    };

    el.setF(parents[0], 'x, y');
    el.xData = parents[1];
    el.yData = parents[2];

    el.updateDataArray = function () {
        var x, y, i, j,
            scale = this.evalVisProp('scale'),
            start_x = Type.evaluate(this.xData[0]),
            steps_x = Type.evaluate(this.xData[1]),
            end_x = Type.evaluate(this.xData[2]),
            delta_x = (end_x - start_x) / steps_x,

            start_y = Type.evaluate(this.yData[0]),
            steps_y = Type.evaluate(this.yData[1]),
            end_y = Type.evaluate(this.yData[2]),
            delta_y = (end_y - start_y) / steps_y,
            v, theta, phi1, phi2,

            showArrow = this.evalVisProp('arrowhead.enabled'),
            leg, leg_x, leg_y, alpha;


        if (showArrow) {
            // Arrow head style
            leg = this.evalVisProp('arrowhead.size');
            leg_x = leg / board.unitX;
            leg_y = leg / board.unitY;
            alpha = this.evalVisProp('arrowhead.angle');
        }

        this.dataX = [];
        this.dataY = [];

        for (i = 0, x = start_x; i <= steps_x; x += delta_x, i++) {
            for (j = 0, y = start_y; j <= steps_y; y += delta_y, j++) {
                v = this.F(x, y);
                v[0] *= scale;
                v[1] *= scale;

                Type.concat(this.dataX, [x, x + v[0], NaN]);
                Type.concat(this.dataY, [y, y + v[1], NaN]);

                if (showArrow && Math.abs(v[0]) + Math.abs(v[1]) > 0.0) {
                    // Arrow head
                    theta = Math.atan2(v[1], v[0]);
                    phi1 = theta + alpha;
                    phi2 = theta - alpha;
                    Type.concat(this.dataX, [x + v[0] - Math.cos(phi1) * leg_x, x + v[0], x + v[0] - Math.cos(phi2) * leg_x, NaN]);
                    Type.concat(this.dataY, [y + v[1] - Math.sin(phi1) * leg_y, y + v[1], y + v[1] - Math.sin(phi2) * leg_y, NaN]);
                }
            }
        }
    };

    el.methodMap = Type.deepCopy(el.methodMap, {
        setF: "setF"
    });

    return el;
};

JXG.registerElement("vectorfield", JXG.createVectorField);

/**
 * @class A slope field is a graphical representation of the solutions
 * to a first-order differential equation of a scalar function.
 * <p>
 * Plot a slope field given by a function f(x, y) returning a number.
 *
 * @pseudo
 * @name Slopefield
 * @augments Vectorfield
 * @constructor
 * @type JXG.Curve
 * @throws {Error} If the element cannot be constructed with the given parent objects an exception is thrown.
 * Parameter options:
 * @param {Function|String} F Function f(x, y) returning a number.
 * @param {Array} xData Array of length 3 containing start value for x, number of steps, end value of x. The slope field will contain
 * (number of steps) + 1 vectors in direction of x.
 * @param {Array} yData Array of length 3 containing start value for y, number of steps, end value of y. The slope field will contain
 * (number of steps) + 1 vectors in direction of y.
 * @example
 * var field = board.create('slopefield', [
 *     (x, y) => x * x - x - 2,
 *     [-6, 25, 6], // Horizontal mesh
 *     [-5, 20, 5]  // Vertical mesh
 * ]);
 *
 * </pre><div id="JXG8a2ee562-eea1-4ce0-91ca-46b71fc7543d" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG8a2ee562-eea1-4ce0-91ca-46b71fc7543d',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var field = board.create('slopefield', [
 *         (x, y) => x * x - x - 2,
 *         [-6, 25, 6], [-5, 20, 5]
 *     ]);
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Slider to control length of vectors
 * var s = board.create('slider', [[-3, 7], [3, 7], [0, 0.33, 1]], {name: 'length'});
 * // Slider to control number of steps
 * var stepsize = board.create('slider', [[-3, 6], [3, 6], [1, 20, 100]], {name: 'steps', snapWidth: 1});
 *
 * var field = board.create('slopefield', [
 *     (x, y) => x * x - y * y,
 *     [-6, () => stepsize.Value(), 6],
 *     [-5, () => stepsize.Value(), 5]],
 *     {
 *         strokeWidth: 1.5,
 *         highlightStrokeWidth: 0.5,
 *         highlightStrokeColor: JXG.palette.blue,
 *
 *         scale: () => s.Value(),
 *
 *         arrowHead: {
 *             enabled: false,
 *             size: 8,
 *             angle: Math.PI / 16
 *         }
 *     });
 *
 * </pre><div id="JXG1ec9e4d7-6094-4d2b-b72f-4efddd514f55" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG1ec9e4d7-6094-4d2b-b72f-4efddd514f55',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     // Slider to control length of vectors
 *     var s = board.create('slider', [[-3, 7], [3, 7], [0, 0.33, 1]], {name: 'length'});
 *     // Slider to control number of steps
 *     var stepsize = board.create('slider', [[-3, 6], [3, 6], [1, 20, 100]], {name: 'steps', snapWidth: 1});
 *
 *     var field = board.create('slopefield', [
 *         (x, y) => x * x - y * y,
 *         [-6, () => stepsize.Value(), 6],
 *         [-5, () => stepsize.Value(), 5]],
 *         {
 *             strokeWidth: 1.5,
 *             highlightStrokeWidth: 0.5,
 *             highlightStrokeColor: JXG.palette.blue,
 *
 *             scale: () => s.Value(),
 *
 *             arrowHead: {
 *                 enabled: false,
 *                 size: 8,
 *                 angle: Math.PI / 16
 *             }
 *         });
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createSlopeField = function (board, parents, attributes) {
    var el, f, attr;

    if (!(parents.length >= 3 &&
        (Type.isFunction(parents[0]) || Type.isString(parents[0])) &&
        (Type.isArray(parents[1]) && parents[1].length === 3) &&
        (Type.isArray(parents[2]) && parents[2].length === 3)
    )) {
        throw new Error(
            "JSXGraph: Can't create slope field with parent types " +
            "'" + typeof parents[0] + "', " +
            "'" + typeof parents[1] + "', " +
            "'" + typeof parents[2] + "'."
        );
    }

    f = Type.createFunction(parents[0], board, 'x, y');
    parents[0] = function (x, y) {
        var z = f(x, y),
            nrm = Math.sqrt(1 + z * z);
        return [1 / nrm, z / nrm];
    };
    attr = Type.copyAttributes(attributes, board.options, 'slopefield');
    /**
     * @type {JXG.Curve}
     * @ignore
     */
    el = board.create('vectorfield', parents, attr);
    el.elType = 'slopefield';

    /**
     * Set the defining functions of slope field.
     * @name Slopefield#setF
     * @function
     * @param {Function} func Function f(x, y) returning a number.
     * @returns {Object} Reference to the slope field object.
     *
     * @example
     * field.setF((x, y) => x * x + y * y);
     * board.update();
     *
     */
    el.setF = function (func, varnames) {
        var f = Type.createFunction(func, el.board, varnames);

        /**
         * @ignore
         */
        this.F = function (x, y) {
            var z = f(x, y),
                nrm = Math.sqrt(1 + z * z);
            return [1 / nrm, z / nrm];
        };
    };

    el.methodMap = Type.deepCopy(el.methodMap, {
        setF: "setF"
    });

    return el;
};

JXG.registerElement("slopefield", JXG.createSlopeField);
