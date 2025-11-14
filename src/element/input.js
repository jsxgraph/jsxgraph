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

/*global JXG: true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the Text element is defined.
 */

import JXG from "../jxg.js";
import Env from "../utils/env.js";
import Type from "../utils/type.js";

/**
 * @class
 * @ignore
 */
var priv = {
    /**
    * @class
    * @ignore
    */

    InputInputEventHandler: function (evt) {
        this._value = this.rendNodeInput.value;
        this.board.update();
    }
};

/**
 * @class This element is used to provide a constructor for special texts containing a
 * HTML form input element.
 * For this element, the attribute "display" has to have the value 'html' (which is the default).
 *
 * <p><b>Setting a CSS class:</b> The attribute <tt>cssClass</tt> affects the HTML div element that contains the input element. To change the CSS properties of the HTML input element a selector of the form
 * <tt>.myinput > input { ... }</tt> has to be used. See the analog example for buttons:
 * {@link Button}.
 *
 * <p><b>Access the input element with JavaScript:</b>
 * The underlying HTML button element can be accessed through the sub-object 'rendNodeInput', e.g. to
 * add event listeners.
 *
 * @pseudo
 * @name Input
 * @augments Text
 * @constructor
 * @type JXG.Text
 *
 * @param {number,function_number,function_String_String,function} x,y,value,label Parent elements for input elements.
 *   <p>
 *   x and y are the coordinates of the lower left corner of the text box. The position of the text is fixed,
 *   x and y are numbers. The position is variable if x or y are functions.
 *   <p>
 *   The default value of the input element must be given as string.
 *   <p>
 *   The label of the input element may be given as string or function.
 *
 * @example
 *  // Create an input element at position [1,4].
 *  var input = board.create('input', [0, 1, 'sin(x)*x', 'f(x)='], {cssStyle: 'width: 100px'});
 *  var f = board.jc.snippet(input.Value(), true, 'x', false);
 *  var graph = board.create('functiongraph',[f,
 *          function() {
 *            var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[0,0],board);
 *            return c.usrCoords[1];
 *          },
 *          function() {
 *            var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[board.canvasWidth,0],board);
 *            return c.usrCoords[1];
 *          }
 *        ]);
 *
 *  board.create('text', [1, 3, '&lt;button onclick="updateGraph()"&gt;Update graph&lt;/button&gt;']);
 *
 *  var updateGraph = function() {
 *      graph.Y = board.jc.snippet(input.Value(), true, 'x', false);
 *      graph.updateCurve();
 *      board.update();
 *  }
 * </pre><div class="jxgbox" id="JXGc70f55f1-21ba-4719-a37d-a93ae2943faa" style="width: 500px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t1_board = JXG.JSXGraph.initBoard('JXGc70f55f1-21ba-4719-a37d-a93ae2943faa', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var input = t1_board.create('input', [1, 4, 'sin(x)*x', 'f(x)='], {cssStyle: 'width: 100px'});
 *   var f = t1_board.jc.snippet(input.Value(), true, 'x', false);
 *   var graph = t1_board.create('functiongraph',[f,
 *          function() {
 *            var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[0,0],t1_board);
 *            return c.usrCoords[1];
 *          },
 *          function() {
 *            var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[t1_board.canvasWidth,0],t1_board);
 *            return c.usrCoords[1];
 *          }
 *        ]);
 *
 *  t1_board.create('text', [1, 3, '<button onclick="updateGraph()">Update graph</button>']);
 *
 *  var updateGraph = function() {
 *      graph.Y = t1_board.jc.snippet(input.Value(), true, 'x', false);
 *      graph.updateCurve();
 *      t1_board.update();
 *  }
 * </script><pre>
 *
 * @example
 * // Add the `keyup` event to an input field
 * var A = board.create('point', [3, -2]);
 * var i = board.create('input', [-4, -4, "1", "x "]);
 *
 * i.rendNodeInput.addEventListener("keyup", ( function () {
 *    var x = parseFloat(this.value);
 *    if (!isNaN(x)) {
 * 	   A.moveTo([x, 3], 100);
 *    }
 * }));
 *
 * </pre><div id="JXG81c84fa7-3f36-4874-9e0f-d4b9e93e755b" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG81c84fa7-3f36-4874-9e0f-d4b9e93e755b',
 *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
 *     var A = board.create('point', [3, -2]);
 *     var i = board.create('input', [-4, -4, "1", "x "]);
 *
 *     i.rendNodeInput.addEventListener("keyup", ( function () {
 *        var x = parseFloat(this.value);
 *        if (!isNaN(x)) {
 *     	    A.moveTo([x, 3], 100);
 *        }
 *     }));
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Add the `change` event to an input field
 * var A = board.create('point', [3, -2]);
 * var i = board.create('input', [-4, -4, "1", "x "]);
 *
 * i.rendNodeInput.addEventListener("change", ( function () {
 *    var x = parseFloat(i.Value());
 *    A.moveTo([x, 2], 100);
 * }));
 *
 * </pre><div id="JXG51c4d78b-a7ad-4c34-a983-b3ddae6192d7" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG51c4d78b-a7ad-4c34-a983-b3ddae6192d7',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var A = board.create('point', [3, -2]);
 *     var i = board.create('input', [-4, -4, "1", "x "]);
 *
 *     i.rendNodeInput.addEventListener("change", ( function () {
 *        var x = parseFloat(i.Value());
 *        A.moveTo([x, 2], 100);
 *     }));
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // change the width of an input field
 *  let s = board.create('slider', [[-3, 3], [2, 3], [50, 100, 300]]);
 *  let inp = board.create('input', [-6, 1, 'Math.sin(x)*x', 'f(x)='],{cssStyle:()=>'width:'+s.Value()+'px'});
 *
 * </pre><div id="JXG51c4d78b-a7ad-4c34-a983-b3ddae6192d7-1" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG51c4d78b-a7ad-4c34-a983-b3ddae6192d7-1',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *  let s = board.create('slider', [[-3, 3], [2, 3], [50, 100, 300]]);
 *  let inp = board.create('input', [-6, 1, 'Math.sin(x)*x', 'f(x)='],{cssStyle:()=>'width:'+s.Value()+'px'});
 *     })();
 *
 * </script><pre>
 *
 * @example
 *   Apply CSS classes to label and input tag
 *     &lt;style&gt;
 *         div.JXGtext_inp {
 *             font-weight: bold;
 *         }
 *
 *         // Label
 *         div.JXGtext_inp > span > span {
 *             padding: 3px;
 *         }
 *
 *         // Input field
 *         div.JXGtext_inp > span > input {
 *             width: 100px;
 *             border: solid 4px red;
 *             border-radius: 25px;
 *         }
 *     &lt;/style&gt;
 *
 * var inp = board.create('input', [-6, 1, 'x', 'y'], {
 *      CssClass: 'JXGtext_inp', HighlightCssClass: 'JXGtext_inp'
 * });
 *
 * </pre>
 *         <style>
 *             div.JXGtext_inp {
 *                 font-weight: bold;
 *             }
 *
 *             div.JXGtext_inp > span > span {
 *                 padding: 3px;
 *             }
 *
 *             div.JXGtext_inp > span > input {
 *                 width: 100px;
 *                 border: solid 4px red;
 *                 border-radius: 25px;
 *             }
 *         </style>
 * <div id="JXGa3642ebd-a7dc-41ac-beb2-0c9e705ab8b4" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGa3642ebd-a7dc-41ac-beb2-0c9e705ab8b4',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *         var inp = board.create('input', [-6, 1, 'x', 'y'], {CssClass: 'JXGtext_inp', HighlightCssClass: 'JXGtext_inp'});
 *
 *     })();
 * </script><pre>
 *
 */
JXG.createInput = function (board, parents, attributes) {
    var t,
        par,
        attr = Type.copyAttributes(attributes, board.options, 'input');

    par = [
        parents[0],
        parents[1],
        '<span style="display:inline; white-space:nowrap; padding:0px;">' +
        '<label></label><input type="text" maxlength="' +
        attr.maxlength +
        '" style="width:100%" />' +
        "</span>"
    ];

    // 1. Create input element with empty label
    t = board.create("text", par, attr);
    t.type = Type.OBJECT_TYPE_INPUT;

    t.rendNodeLabel = t.rendNode.childNodes[0].childNodes[0];
    t.rendNodeInput = t.rendNode.childNodes[0].childNodes[1];
    t.rendNodeInput.value = parents[2];
    t.rendNodeTag = t.rendNodeInput; // Needed for unified treatment in setAttribute
    t.rendNodeTag.disabled = !!attr.disabled;
    t.rendNodeLabel.id = t.rendNode.id + "_label";
    t.rendNodeInput.id = t.rendNode.id + "_input";
    t.rendNodeInput.setAttribute("aria-labelledby", t.rendNodeLabel.id);

    // 2. Set parents[3] (string|function) as label of the input element.
    // abstract.js selects the correct DOM element for the update
    t.setText(parents[3]);

    t._value = parents[2];

    // 3.  capture keydown events on the input, and do not let them propagate.  The problem is that
    // elevation controls on view3D use left and right, so editing the input triggers 3D pan.
    t.rendNodeInput.addEventListener("keydown", (event) => {
        // only trap left-and-right in case user wants input editing events
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.stopPropagation();
        }
    });




    /**
    * @class
    * @ignore
    */
    t.update = function () {
        if (this.needsUpdate) {
            JXG.Text.prototype.update.call(this);
            this._value = this.rendNodeInput.value;
        }
        return this;
    };

    /**
     * Returns the value (content) of the input element
     * @name Value
     * @memberOf Input.prototype
     * @function
     * @returns {String} content of the input field.
     */
    t.Value = function () {
        return this._value;
    };

    /**
     * Sets value of the input element.
     * @name set
     * @memberOf Input.prototype
     * @function
     *
     * @param {String} val
     * @returns {JXG.GeometryElement} Reference to the element.
     *
     * @example
     *         var i1 = board.create('input', [-3, 4, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
     *         var c1 = board.create('checkbox', [-3, 2, 'label 1'], {});
     *         var b1 = board.create('button', [-3, -1, 'Change texts', function () {
     *                 i1.setText('g(x)');
     *                 i1.set('cos(x)');
     *                 c1.setText('label 2');
     *                 b1.setText('Texts are changed');
     *             }],
     *             {cssStyle: 'width:400px'});
     *
     * </pre><div id="JXG11cac8ff-2354-47e7-9da4-eb298e53de05" class="jxgbox" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *     (function() {
     *         var board = JXG.JSXGraph.initBoard('JXG11cac8ff-2354-47e7-9da4-eb298e53de05',
     *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
     *             var i1 = board.create('input', [-3, 4, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
     *             var c1 = board.create('checkbox', [-3, 2, 'label 1'], {});
     *             var b1 = board.create('button', [-3, -1, 'Change texts', function () {
     *                     i1.setText('g(x)');
     *                     i1.set('cos(x)');
     *                     c1.setText('label 2');
     *                     b1.setText('Texts are changed');
     *                 }],
     *                 {cssStyle: 'width:400px'});
     *
     *     })();
     *
     * </script><pre>
     *
     */

    /**
    * @class
    * @ignore
    */

    t.set = function (val) {
        this._value = val;
        this.rendNodeInput.value = val;
        return this;
    };

    Env.addEvent(t.rendNodeInput, "input", priv.InputInputEventHandler, t);
    Env.addEvent(
        t.rendNodeInput,
        "mousedown",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );
    Env.addEvent(
        t.rendNodeInput,
        "touchstart",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );
    Env.addEvent(
        t.rendNodeInput,
        "pointerdown",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );

    // This sets the font-size of the input HTML element
    t.visPropOld.fontsize = '0px';
    board.renderer.updateTextStyle(t, false);

    return t;
};

JXG.registerElement("input", JXG.createInput);

// export default {
//     createInput: JXG.createInput
// };
