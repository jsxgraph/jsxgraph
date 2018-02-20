/*
    Copyright 2008-2018
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
            InputInputEventHandler: function (evt) {
                this._value = this.rendNodeInput.value;
                this.board.update();
            }
        };

    /**
     * @class This element is used to provide a constructor for special texts containing a form input element.
     * <p>
     * If the width of element is set with the attribute "cssStyle", the width of the label must be added.
     * @pseudo
     * @description
     * @name Input
     * @augments Text
     * @constructor
     * @type JXG.Text
     *
     * @param {number,function_number,function_String_String} x,y,value,label Parent elements for input elements.
     *                     <p>
     *                     x and y are the coordinates of the lower left corner of the text box. The position of the text is fixed,
     *                     x and y are numbers. The position is variable if x or y are functions.
     *                     <p>
     *                     The default value of the input element may be given as string.
     *                     <p>
     *                     The label of the input element may be given  as string.
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
     *  board.create('text', [1, 3, '<button onclick="updateGraph()">Update graph</button>']);
     *
     *  var updateGraph = function() {
     *      graph.Y = board.jc.snippet(input.Value(), true, 'x', false);
     *      graph.updateCurve();
     *      board.update();
     *  }
     * </pre><div class="jxgbox" id="c70f55f1-21ba-4719-a37d-a93ae2943faa" style="width: 500px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var t1_board = JXG.JSXGraph.initBoard('c70f55f1-21ba-4719-a37d-a93ae2943faa', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
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
     */
    JXG.createInput = function (board, parents, attributes) {
        var t, par,
            attr = Type.copyAttributes(attributes, board.options, 'input');

        par = [parents[0], parents[1],
            '<span style="display:inline; white-space:nowrap; padding:0px;">' +
            '<span></span><input type="text" maxlength="' +
                attr.maxlength +
                '" style="width:100%"/>' +
            '</span>'
            ];

        //t = JXG.createText(board, par, attr);
        t = board.create('text', par, attr);
        t.type = Type.OBJECT_TYPE_INPUT;

        t.rendNodeLabel = t.rendNode.childNodes[0].childNodes[0];
        t.rendNodeInput = t.rendNode.childNodes[0].childNodes[1];
        t.rendNodeLabel.innerHTML = parents[3];
        t.rendNodeInput.value = parents[2];
        t.rendNodeTag = t.rendNodeInput; // Needed for unified treatment in setAttribute
        t.rendNodeTag.disabled = !!attr.disabled;
        t.rendNodeLabel.id = t.rendNode.id + '_label';
        t.rendNodeInput.id = t.rendNode.id + '_input';

        t._value = parents[2];
        t.update = function () {
            if (this.needsUpdate) {
                JXG.Text.prototype.update.call(this);
                this._value = this.rendNodeInput.value;
            }
            return this;
        };
        t.Value = function () {
            return this._value;
        };

        Env.addEvent(t.rendNodeInput, 'input', priv.InputInputEventHandler, t);
        Env.addEvent(t.rendNodeInput, 'mousedown', function(evt) { if (Type.exists(evt.stopPropagation)) evt.stopPropagation(); }, t);
        Env.addEvent(t.rendNodeInput, 'touchstart', function(evt) { if (Type.exists(evt.stopPropagation)) evt.stopPropagation(); }, t);
        Env.addEvent(t.rendNodeInput, 'pointerdown', function(evt) { if (Type.exists(evt.stopPropagation)) evt.stopPropagation(); }, t);

        // This sets the font-size of the input HTML element
        t.visPropOld.fontsize = "0px";
        board.renderer.updateTextStyle(t, false);

        return t;
    };

    JXG.registerElement('input', JXG.createInput);

    return {
        createInput: JXG.createInput
    };
});
