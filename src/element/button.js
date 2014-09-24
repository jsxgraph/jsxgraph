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
            ButtonClickEventHandler: function () {
                if(this._handler) {
                    this._handler();
                }
                this.board.update();
            }
        };

    /**
     * [x, y, label, handler]
     */
    JXG.createButton = function (board, parents, attributes) {
        var t, par,
            attr = Type.copyAttributes(attributes, board.options, 'button');

        if (parents.length < 3) {
            //throw new Error("JSXGraph: Can't create button with parent types '" +
            //    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
            //    "\nPossible parents are: [x, y, label, handler]");
        }

        par = [parents[0], parents[1], '<button type="button"></button>'];

        t = JXG.createText(board, par, attr);
        t.type = Type.OBJECT_TYPE_BUTTON;

        t.rendNodeButton = t.rendNode.childNodes[0];
        t.rendNodeButton.id = t.rendNode.id + '_button';
        t.rendNodeButton.innerHTML = parents[2];

        if(parents[3]) {
            if(typeof parents[3] == 'string') {
                t._jc = new JXG.JessieCode();
                t._jc.use(board);
                t._handler = function() {
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
