/*
    Copyright 2008-2023
        Matthias Ehmann,
        Carsten Miller,
        Andreas Walter,
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
/*global JXG:true, define: true*/

import JXG from "../jxg";

/**
 * Constructs a new GeometryElement3D object.
 * @class This is the basic class for 3D geometry elements like Point3D and Line3D.
 * @constructor
 * @param {string} elType
 * @borrows JXG.EventEmitter#on as this.on
 * @borrows JXG.EventEmitter#off as this.off
 * @borrows JXG.EventEmitter#triggerEventHandlers as this.triggerEventHandlers
 * @borrows JXG.EventEmitter#eventHandlers as this.eventHandlers
 */
JXG.GeometryElement3D = function (view, elType) {
    this.elType = elType;
    this.id = this.board.setId(this, elType);

    /**
     * Pointer to the view3D in which the elemtn is constructed
     * @type JXG.View3D
     * @private
     */
    this.view = view;

    /**
     * Link to the 2D element(s) used to visualize the 3D element
     * in a view. In case, there are several 2D elements, it is an array.
     *
     * @type JXG.GeometryElement,Array
     * @private
     *
     * @example
     *   p.element2D;
     */
    this.element2D = null;

    /**
     * If this property exists (and is true) the element is a 3D element.
     *
     * @type Boolean
     * @private
     */
    this.is3D = true;
    this.view.objects[this.id] = this;
    this.view.objectsList.push(this);

    if (this.name !== "") {
        this.view.elementsByName[this.name] = this;
    }
};

JXG.extend(JXG.GeometryElement3D.prototype, {
  
    setAttr2D: function(attr3D) {
        var attr2D = attr3D;

        attr2D.name = this.name;
        attr2D.visible = 'inherit';
        return attr2D;
    }
});

export default JXG.GeometryElement3D;
