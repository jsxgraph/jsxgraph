/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 utils/env
 utils/type
 */

/**
 * @fileoverview In this file the Text element is defined.
 */

define([
    'jxg', 'utils/env', 'utils/type'
], function (JXG, Env, Type) {

    "use strict";

    var priv = {
            ButtonClickEventHandler: function () {
                if (this._handler) {
                    this._handler();
                }
                this.board.update();
            }
        };

    /**
     * @class This element is used to provide a constructor for special texts containing a form button element.
     * 
     * @pseudo
     * @description
     * @name Button
     * @augments Text
     * @constructor
     * @type JXG.Text
     *
     * @param {number,function_number,function_String_function} x,y,label,handler Parent elements for button elements.
     *                     <p>
     *                     x and y are the coordinates of the lower left corner of the text box. 
     *                      The position of the text is fixed,
     *                     x and y are numbers. The position is variable if x or y are functions.
     *                     <p>
     *                     The label of the input element may be given  as string.
     *                     <p>
     *                     The (optional) handler function which is called when the button is pressed.
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
     * </pre><div id="f19b1bce-dd00-4e35-be97-ff1817d11514" style="width: 500px; height: 300px;"></div>
     * <script type="text/javascript">
     *  var t1_board = JXG.JSXGraph.initBoard('f19b1bce-dd00-4e35-be97-ff1817d11514', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
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
     * [x, y, label, handler]
     */
    JXG.createButton = function (board, parents, attributes) {
        var t, par,
            attr = Type.copyAttributes(attributes, board.options, 'button');

        //if (parents.length < 3) {
            //throw new Error("JSXGraph: Can't create button with parent types '" +
            //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
            //    "\nPossible parents are: [x, y, label, handler]");
        //}

        par = [parents[0], parents[1], '<button type="button"></button>'];

        t = JXG.createText(board, par, attr);
        t.type = Type.OBJECT_TYPE_BUTTON;

        t.rendNodeButton = t.rendNode.childNodes[0];
        t.rendNodeButton.id = t.rendNode.id + '_button';
        t.rendNodeButton.innerHTML = parents[2];

        if (parents[3]) {
            if (typeof parents[3] === 'string') {
                t._jc = new JXG.JessieCode();
                t._jc.use(board);
                t._handler = function () {
                    t._jc.parse(parents[3]);
                };
            } else {
                t._handler = parents[3];
            }
        }

        Env.addEvent(t.rendNodeButton, 'click', priv.ButtonClickEventHandler, t);

        return t;
    };

    JXG.registerElement('button', JXG.createButton);

    return {
        createButton: JXG.createButton
    };
});
