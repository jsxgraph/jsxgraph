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

var priv = {
    ButtonClickEventHandler: function () {
        if (this._handler) {
            this._handler();
        }
        this.board.update();
    }
};

/**
 * @class A text element that contains an HTML button tag.
 * For this element, the attribute "display" has to have the value 'html' (which is the default).
 *
 * <p><b>Setting a CSS class:</b> The attribute <tt>cssClass</tt> affects the HTML div element that contains the button element. To change the CSS properties of the HTML button element a selector of the form
 * <tt>.mybutton > button { ... }</tt> has to be used. See the example below.
 *
 * <p><b>Access the button element with JavaScript:</b>
 * The underlying HTML button element can be accessed through the sub-object 'rendNodeButton', e.g. to
 * add event listeners.
 *
 * @pseudo
 * @name Button
 * @augments Text
 * @constructor
 * @type JXG.Text
 *
 * @param {number,function_number,function_String,function_function} x,y,label,handler Parent elements for button elements.
 *  <p>
 *  x and y are the coordinates of the lower left corner of the text box.
 *   The position of the text is fixed,
 *  x and y are numbers. The position is variable if x or y are functions.
 *  <p>
 *  The label of the input element may be given  as string.
 *  <p>
 *  The (optional) handler function which is called when the button is pressed.
 *
 * @example
 *  var p = board.create('point', [0.5, 0.5], {id: 'p1'});
 *
 *  // Create a button element at position [1,2].
 *  var button1 = board.create('button', [1, 2, 'Change Y with JavaScript', function() {
 *      p.moveTo([p.X(), p.Y() + 0.5], 100);
 *  }], {});
 *
 *  // Create a button element at position [1,4].
 *  var button2 = board.create('button', [1, 4, 'Change Y with JessieCode',
 *      "$('p1').Y = $('p1').Y() - 0.5;"
 *  ], {});
 *
 * </pre><div class="jxgbox" id="JXGf19b1bce-dd00-4e35-be97-ff1817d11514" style="width: 500px; height: 300px;"></div>
 * <script type="text/javascript">
 *  var t1_board = JXG.JSXGraph.initBoard('JXGf19b1bce-dd00-4e35-be97-ff1817d11514', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *  var p = t1_board.create('point', [0, -1], {id: 'p1'});
 *
 *  // Create a button element at position [1,2].
 *  var button1 = t1_board.create('button', [1, 2, 'Change Y with JavaScript', function() {
 *      p.moveTo([p.X(), p.Y() + 0.5], 100);
 *  }], {});
 *
 *  // Create a button element at position [1,4].
 *  var button2 = t1_board.create('button', [1, 4, 'Change Y with JessieCode',
 *      "$('p1').Y = $('p1').Y() - 0.5;"
 *  ], {});
 *
 * </script><pre>
 *
 * @example
 * // A toggle button
 * var butt = board.create('button', [-2, -2, 'Off', function() {
 *   var txt;
 *   butt.value = !butt.value;
 *   if (butt.value) {
 *   	txt = 'On';
 *   } else {
 *   	txt = 'Off';
 *   }
 * 	butt.rendNodeButton.innerHTML = txt;
 * }]);
 *
 * // Set initial value for the button
 * if (!JXG.exists(butt.value)) {
 * 	butt.value = false;
 * }
 *
 * var p = board.create('point', [2, -2], {
 * 	visible: () => butt.value
 * });
 *
 *
 *
 * </pre><div id="JXGa1eaab8f-c73b-4660-96ce-4ca17bcac4d6" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGa1eaab8f-c73b-4660-96ce-4ca17bcac4d6',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var butt = board.create('button', [-2, -2, 'Off', function() {
 *       var txt;
 *       butt.value = !butt.value;
 *       if (butt.value) {
 *       	txt = 'On';
 *       } else {
 *       	txt = 'Off';
 *       }
 *     	butt.rendNodeButton.innerHTML = txt;
 *     }]);
 *
 *     // Set initial value for the button
 *     if (!JXG.exists(butt.value)) {
 *     	butt.value = false;
 *     }
 *
 *     var p = board.create('point', [2, -2], {
 *     	visible: () => butt.value
 *     });
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * var i1 = board.create('input', [-3, 4, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
 * var c1 = board.create('checkbox', [-3, 2, 'label 1'], {});
 * var b1 = board.create('button', [-3, -1, 'Change texts', function () {
 *         i1.setText('g(x)');
 *         i1.set('cos(x)');
 *         c1.setText('label 2');
 *         b1.setText('Texts are changed');
 *     }],
 *     {cssStyle: 'width:200px'});
 *
 * </pre><div id="JXG11cac8ff-2354-47e7-9da4-eb928e53de05" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG11cac8ff-2354-47e7-9da4-eb928e53de05',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *             var i1 = board.create('input', [-3, 4, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
 *             var c1 = board.create('checkbox', [-3, 2, 'label 1'], {});
 *             var b1 = board.create('button', [-3, -1, 'Change texts', function () {
 *                     i1.setText('g(x)');
 *                     i1.set('cos(x)');
 *                     c1.setText('label 2');
 *                     b1.setText('Texts are changed');
 *                 }],
 *                 {cssStyle: 'width:200px'});
 *
 *     })();
 *
 * </script><pre>
 *
 * @example
 * // Set the CSS class of the button
 *
 * // CSS:
 * &lt;style&gt;
 * .mybutton > button {
 *   background-color: #04AA6D;
 *   border: none;
 *   color: white;
 *   padding: 1px 3px;
 *   text-align: center;
 *   text-decoration: none;
 *   display: inline-block;
 *   font-size: 16px;
 * }
 * &lt;/style&gt;
 *
 * // JavaScript:
 * var button = board.create('button',
 *     [1, 4, 'answers', function () {}],
 *     {cssClass:'mybutton', highlightCssClass: 'mybutton'});
 *
 * </pre>
 * <style>
 * .mybutton > button {
 *   background-color: #04AA6D;
 *   border: none;
 *   color: white;
 *   padding: 1px 3px;
 *   text-align: center;
 *   text-decoration: none;
 *   display: inline-block;
 *   font-size: 16px;
 * }
 * </style>
 * <div id="JXG2da6cf73-8c2e-495c-bd31-42de43b71cf8" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG2da6cf73-8c2e-495c-bd31-42de43b71cf8',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *       var button = board.create('button', [1, 4, 'answers', function () {
 *       }], {cssClass:'mybutton', highlightCssClass: 'mybutton'});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createButton = function (board, parents, attributes) {
    var t,
        par,
        attr = Type.copyAttributes(attributes, board.options, 'button');

    //if (parents.length < 3) {
    //throw new Error("JSXGraph: Can't create button with parent types '" +
    //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
    //    "\nPossible parents are: [x, y, label, handler]");
    //}

    // 1. Create empty button
    par = [parents[0], parents[1], '<button type="button" style="width:100%; height:100%;" tabindex="0"></button>'];
    t = board.create("text", par, attr);
    t.type = Type.OBJECT_TYPE_BUTTON;

    t.rendNodeButton = t.rendNode.childNodes[0];
    t.rendNodeButton.id = t.rendNode.id + "_button";

    t.rendNodeTag = t.rendNodeButton; // Needed for unified treatment in setAttribute
    t.rendNodeTag.disabled = !!attr.disabled;

    // 2. Set parents[2] (string|function) as content of the button.
    // abstract.js selects the correct DOM element for the update
    t.setText(parents[2]);

    // This sets the font size of the button text
    t.visPropOld.fontsize = '0px';
    board.renderer.updateTextStyle(t, false);

    if (parents[3]) {
        if (Type.isString(parents[3])) {
            t._jc = new JXG.JessieCode();
            t._jc.use(board);
            t._handler = function () {
                t._jc.parse(parents[3]);
            };
        } else {
            t._handler = parents[3];
        }
    }

    Env.addEvent(t.rendNodeButton, "click", priv.ButtonClickEventHandler, t);
    Env.addEvent(
        t.rendNodeButton,
        "mousedown",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );
    Env.addEvent(
        t.rendNodeButton,
        "touchstart",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );
    Env.addEvent(
        t.rendNodeButton,
        "pointerdown",
        function (evt) {
            if (Type.exists(evt.stopPropagation)) {
                evt.stopPropagation();
            }
        },
        t
    );

    return t;
};

JXG.registerElement("button", JXG.createButton);

// export default {
//     createButton: JXG.createButton
// };
