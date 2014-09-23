/*
    Copyright 2008-2014
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
            InputInputEventHandler: function () {
                this._value = this.rendNodeInput.value;
                this.board.update();
            }
        };

    /**
     * [x, y, value, label]
     */
    JXG.createInput = function (board, parents, attributes) {
        var t, par,
            attr = Type.copyAttributes(attributes, board.options, 'input');

        if (parents.length !==4) {
            //throw new Error("JSXGraph: Can't create input with parent types '" +
            //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
            //    "\nPossible parents are: [x, y, value, label]");
        }

        par = [parents[0], parents[1],
            '<form style="display:inline">' +
            '<span></span><input type="text" />' +
            '</form>'];

        t = JXG.createText(board, par, attr);
        t.type = Type.OBJECT_TYPE_INPUT;

        t.rendNodeForm = t.rendNode.childNodes[0];
        t.rendNodeForm.id = t.rendNode.id + '_form';

        t.rendNodeLabel = t.rendNodeForm.childNodes[0];
        t.rendNodeLabel.id = t.rendNode.id + '_label';
        t.rendNodeLabel.innerHTML = parents[3];

        t.rendNodeInput = t.rendNodeForm.childNodes[1];
        t.rendNodeInput.id = t.rendNode.id + '_input';
        t.rendNodeInput.value = parents[2];

        t._value = parents[2];

        t.Value = function () {
            return this._value;
        };

        t.update = function() {
            if (this.needsUpdate) {
                this._value = this.rendNodeInput.value;
            }
            return this;
        };

        Env.addEvent(t.rendNodeInput, 'input', priv.InputInputEventHandler, t);

        return t;
    };

    JXG.registerElement('input', JXG.createInput);

    return {
        createInput: JXG.createInput
    };
});
