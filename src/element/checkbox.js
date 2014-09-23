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
            CheckboxChangeEventHandler: function () {
                this._value = this.rendNodeCheckbox.checked;
                this.board.update();
            }
        };

    /**
     * [[x,y], [w px, h px], [range]
     */
    JXG.createCheckbox = function (board, parents, attributes) {
        var t, par,
            attr = Type.copyAttributes(attributes, board.options, 'checkbox');

        if (parents.length !==3) {
            //throw new Error("JSXGraph: Can't create checkbox with parent types '" +
            //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
            //    "\nPossible parents are: [[x,y], start]");
        }

        par = [parents[0], parents[1],
            '<form style="display:inline">' +
            '<input type="checkbox" /><span></span>' +
            '</form>'];

        t = JXG.createText(board, par, attr);
        t.type = Type.OBJECT_TYPE_CHECKBOX;

        t.rendNodeForm = t.rendNode.childNodes[0];
        t.rendNodeForm.id = t.rendNode.id + '_form';

        t.rendNodeCheckbox = t.rendNodeForm.childNodes[0];
        t.rendNodeCheckbox.id = t.rendNode.id + '_checkbox';

        t.rendNodeLabel = t.rendNodeForm.childNodes[1];
        t.rendNodeLabel.id = t.rendNode.id + '_label';
        t.rendNodeLabel.innerHTML = parents[2];

        t._value = false;

        t.Value = function () {
            return this._value;
        };

        t.update = function() {
            if (this.needsUpdate) {
                this._value = this.rendNodeCheckbox.checked;
            }
            return this;
        };

        Env.addEvent(t.rendNodeCheckbox, 'change', priv.CheckboxChangeEventHandler, t);

        return t;
    };

    JXG.registerElement('checkbox', JXG.createCheckbox);

    return {
        createCheckbox: JXG.createCheckbox
    };
});
