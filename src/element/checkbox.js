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
    /**
     * @class
     * @ignore
     */
    CheckboxChangeEventHandler: function () {
        this._value = this.rendNodeCheckbox.checked;
        this.board.update();
    }
};

/**
 * @class A text element that contains an HTML checkbox tag.
 * For this element, the attribute "display" has to have the value 'html' (which is the default).
 *
 * <p><b>Setting a CSS class:</b> The attribute <tt>cssClass</tt> affects the HTML div element that contains the checkbox element. To change the CSS properties of the HTML checkbox element a selector of the form
 * <tt>.mycheck > checkbox { ... }</tt> has to be used. See the analog example for buttons:
 * {@link Button}.
 *
 * <p><b>Access the checkbox element with JavaScript:</b>
 * The underlying HTML checkbox element can be accessed through the sub-object 'rendNodeCheck', e.g. to
 * add event listeners.
 *
 * @pseudo
 * @name Checkbox
 * @augments Text
 * @constructor
 * @type JXG.Text
 *
 * @param {number,function_number,function_String,function} x,y,label Parent elements for checkbox elements.
 *   <p>
 *   x and y are the coordinates of the lower left corner of the text box.
 *    The position of the text is fixed,
 *   x and y are numbers. The position is variable if x or y are functions.
 *   <p>
 *   The label of the input element may be given as string or function.
 *   <p>
 *   The value of the checkbox can be controlled with the attribute <tt>checked</tt>
 *   <p>The HTML node can be accessed with <tt>element.rendNodeCheckbox</tt>
 *
 * @example
 *   // Create a checkbox element at position [0,3].
 *   var checkbox = board.create('checkbox', [0, 3, 'Change Y'], {});
 *   var p = board.create('point', [
 *       function(){ return 0.5;}, // X-coordinate
 *       function() {
 *           y = 0.5;
 *           if (checkbox.Value()) {
 *               y += 0.5;
 *           }
 *           return y;
 *       }]);
 * </pre><div class="jxgbox" id="JXG0e835e0b-ed0c-4b85-b682-78158c0e6f5c" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function() {
 *   var t1_board = JXG.JSXGraph.initBoard('JXG0e835e0b-ed0c-4b85-b682-78158c0e6f5c', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var checkbox = t1_board.create('checkbox', [0, 3, 'Change Y'], {});
 *   var p = t1_board.create('point', [
 *       function(){ return 0.5;}, // X-coordinate
 *       function() {
 *           y = 0.5;
 *           if (checkbox.Value()) {
 *               y += 0.5;
 *           }
 *           return y;
 *       }]);
 * })();
 * </script><pre>
 *
 * The checkbox can be supplied with custom-made events by using the property rendNodeCheckbox.
 * @example
 * var checkbox = board.create('checkbox', [0, 4, 'Click me']),
 *     p = board.create('point', [1, 1]);
 *
 * JXG.addEvent(checkbox.rendNodeCheckbox, 'change', function() {
 *     if (this.Value()) {
 *         p.moveTo([4, 1]);
 *     } else {
 *         p.moveTo([1, 1]);
 *     }
 * }, checkbox);
 * </pre><div class="jxgbox" id="JXGb2f2345a-057d-44ce-bd7a-6aaff70bc810" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 * (function() {
 * var board = JXG.JSXGraph.initBoard('JXGb2f2345a-057d-44ce-bd7a-6aaff70bc810', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 * var checkbox = board.create('checkbox', [0, 4, 'Click me']),
 *     p = board.create('point', [1, 1]);
 *
 * JXG.addEvent(checkbox.rendNodeCheckbox, 'change', function() {
 *     if (this.Value()) {
 *         p.moveTo([4, 1]);
 *     } else {
 *         p.moveTo([1, 1]);
 *     }
 * }, checkbox);
 * })();
 * </script><pre>
 * @example
 *     var i1 = board.create('input', [1, 5, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
 *         var c1 = board.create('checkbox', [1, 3, 'label 1'], {});
 *         var b1 = board.create('button', [1, 1, 'Change texts', function () {
 *                 i1.setText('g(x)=');
 *                 i1.set('cos(x)');
 *                 c1.setText('label 2');
 *                 b1.setText('Texts are changed');
 *             }],
 *             {cssStyle: 'width:200px'});
 *
 * </pre><div id="JXG31c6d070-354b-4f09-aab9-9aaa796f730c" class="jxgbox" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG31c6d070-354b-4f09-aab9-9aaa796f730c',
 *             {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *         var i1 = board.create('input', [1, 5, 'sin(x)', 'f(x)='], {cssStyle: 'width:4em', maxlength: 2});
 *             var c1 = board.create('checkbox', [1, 3, 'label 1'], {});
 *             var b1 = board.create('button', [1, 1, 'Change texts', function () {
 *                     i1.setText('g(x)=');
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
 */
JXG.createCheckbox = function (board, parents, attributes) {
    var t,
        par,
        attr = Type.copyAttributes(attributes, board.options, 'checkbox');

    //if (parents.length !== 3) {
    //throw new Error("JSXGraph: Can't create checkbox with parent types '" +
    //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
    //    "\nPossible parents are: [[x,y], label]");
    //}

    par = [
        parents[0],
        parents[1],
        '<span style="display:inline">' +
            '<input type="checkbox" /><label for=""></label>' +
            "</span>"
    ];

    // 1. Create checkbox element with empty label
    t = board.create("text", par, attr);
    t.type = Type.OBJECT_TYPE_CHECKBOX;

    t.rendNodeCheckbox = t.rendNode.childNodes[0].childNodes[0];
    t.rendNodeLabel = t.rendNode.childNodes[0].childNodes[1];

    t.rendNodeTag = t.rendNodeCheckbox; // Needed for unified treatment in setAttribute
    t.rendNodeTag.disabled = !!attr.disabled;

    t.rendNodeCheckbox.id = t.rendNode.id + "_checkbox";
    t.rendNodeLabel.id = t.rendNode.id + "_label";
    t.rendNodeLabel.setAttribute("for", t.rendNodeCheckbox.id);

    // 2. Set parents[2] (string|function) as label of the checkbox element.
    // abstract.js selects the correct DOM element for the update
    t.setText(parents[2]);

    // This sets the font-size of the checkbox itself
    t.visPropOld.fontsize = '0px';
    board.renderer.updateTextStyle(t, false);

    t.rendNodeCheckbox.checked = attr.checked;

    t._value = attr.checked;

    /**
     * Returns the value of the checkbox element
     * @name Value
     * @memberOf Checkbox.prototype
     * @function
     * @returns {String} value of the checkbox.
     */
    t.Value = function () {
        return this._value;
    };

     /**
     * @class
     * @ignore
     */
    t.update = function () {
        if (this.needsUpdate) {
            JXG.Text.prototype.update.call(this);
            this._value = this.rendNodeCheckbox.checked;
        }
        return this;
    };

    Env.addEvent(t.rendNodeCheckbox, "change", priv.CheckboxChangeEventHandler, t);

    return t;
};

JXG.registerElement("checkbox", JXG.createCheckbox);

// export default {
//     createCheckbox: JXG.createCheckbox
// };
