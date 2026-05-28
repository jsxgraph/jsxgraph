/*
    Copyright 2008-2026
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The combined object CoordinateSystem is defined in this file.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";
import Const from "../base/constants.js";
import GeometryElement from "../base/element.js";

/**
 * The CoordinateSystem class is a specific class. It contains two axes and a grid (major and minor grid). It adds references to each other so axes and grid can depend on each other.
 * @class Creates a new coordinate system. Do not use this constructor to create a coordinate system.
 * Use {@link JXG.Board#create} with
 * type {@link CoordinateSystem} instead.
 * @constructor
 * @augments JXG.GeometryElement
 * @param {String|JXG.Board} board The board the new line is drawn on.
 * @param {Point} pointOrigin Origin point of the coordinate system.
 * @param {Point} pointX Point for x direction of the coordinate system.
 * @param {Point} pointY Point for y direction of the coordinate system.
 * @param {Object} attributes Javascript object containing attributes like name and id.
 */
JXG.CoordinateSystem = function (board, pointOrigin, pointX, pointY, attributes) {
    var attr, attr2;

    this.constructor(board, attributes, Const.OBJECT_TYPE_COORDINATE_SYSTEM, Const.OBJECT_CLASS_OTHER);

    this.board.suspendUpdate();

    // create x axis
    ////////////////

    attr = {};
    Type.mergeAttr(attr, {
        ticks: {
            drawZero: function (self) {
                if (!Type.exists(self.coordinateSystem)) {
                    return false;
                }
                return !self.coordinateSystem.y.evalVisProp('visible');
            },
        },
    });
    Type.mergeAttr(attr, attributes.axes);
    if (!Type.exists(pointOrigin.coords)) { // not an existing point
        attr2 = {};
        Type.mergeAttr(attr2, attributes.origin);
        Type.mergeAttr(attr, {
            point1: attr2,
        });
    }
    if (!Type.exists(pointX.coords)) { // not an existing point
        attr2 = {};
        Type.mergeAttr(attr2, attributes.directionx);
        Type.mergeAttr(attr, {
            point2: attr2,
        });
    }
    Type.mergeAttr(attr, attributes.x);

    /**
     * Reference to the x-axis.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Axis
     */
    this.x = board.create('axis', [pointOrigin, pointX], attr);
    this.addChild(this.x);
    this.x.coordinateSystem = this;

    /**
     * Reference to the ticks of the x-axis.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Ticks
     */
    this.xTicks = this.x.defaultTicks;
    this.xTicks.coordinateSystem = this;
    this.xTicks.getDistanceMajorTicks = function () {
        var cs = this.coordinateSystem,
            dists = cs._getOriginalTicksDistances(),
            freq = cs.evalVisProp('ticksFrequency');

        switch (freq) {
            case 'min':
                return Math.min(dists[0], dists[1]);
            case 'max':
                return Math.max(dists[0], dists[1]);
            case 'individual':
            default:
                return dists[0];
        }
    };

    // create y axis
    ////////////////

    attr = {};
    Type.mergeAttr(attr, {
        ticks: {
            drawZero: function (self) {
                if (!Type.exists(self.coordinateSystem)) {
                    return false;
                }
                return !self.coordinateSystem.x.evalVisProp('visible');
            },
        },
    });
    Type.mergeAttr(attr, attributes.axes);
    if (!Type.exists(pointY.coords)) { // not an existing point
        attr2 = {};
        Type.mergeAttr(attr2, attributes.directiony);
        Type.mergeAttr(attr, {
            point2: attr2,
        });
    }
    Type.mergeAttr(attr, attributes.y);

    /**
     * Reference to the y-axis.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Axis
     */
    this.y = board.create('axis', [this.x.point1, pointY], attr);
    this.addChild(this.y);
    this.y.coordinateSystem = this;

    /**
     * Reference to the ticks of the y-axis.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Ticks
     */
    this.yTicks = this.y.defaultTicks;
    this.yTicks.coordinateSystem = this;
    this.yTicks.getDistanceMajorTicks = function () {
        var cs = this.coordinateSystem,
            dists = cs._getOriginalTicksDistances(),
            freq = cs.evalVisProp('ticksFrequency');

        switch (freq) {
            case 'min':
                return Math.min(dists[0], dists[1]);
            case 'max':
                return Math.max(dists[0], dists[1]);
            case 'individual':
            default:
                return dists[1];
        }
    };

    // create grid
    //////////////

    attr = {};
    Type.mergeAttr(attr, {
        drawZero: function (self) {
            if (!Type.exists(self.coordinateSystem)) {
                return false;
            }
            return {
                x: !self.coordinateSystem.y.evalVisProp('visible'),
                y: !self.coordinateSystem.x.evalVisProp('visible'),
                origin: !self.coordinateSystem.x.evalVisProp('visible') && !self.coordinateSystem.y.evalVisProp('visible'),
            };
        },
    });
    Type.mergeAttr(attr, attributes.grid);

    /**
     * Reference to the (major) grid.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Grid
     */
    this.grid = board.create('grid', [this.x, this.y], attr);
    this.addChild(this.grid);
    this.grid.coordinateSystem = this;

    /**
     * Point that will be the origin of the coordinate system.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Point
     */
    this.pointOrigin = this.x.point1;

    /**
     * Point that will be the x direction for the coordinate system.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Point
     */
    this.pointX = this.x.point2;

    /**
     * Point that will be the y direction for the coordinate system.
     * You really should not set this field directly as it may break JSXGraph's
     * update system so your construction won't be updated properly.
     *
     * @type JXG.Point
     */
    this.pointY = this.y.point2;

    this.setParents([this.pointOrigin, this.pointX, this.pointY]);

    this.id = this.board.setId(this, 'CS');
    this.board.finalizeAdding(this);
    this.elType = 'coordinatesystem';

    this.board.unsuspendUpdate();
};

JXG.CoordinateSystem.prototype = new GeometryElement();

Type.copyMethodMap(JXG.CoordinateSystem, {
    // ...
});

JXG.extend(
    JXG.CoordinateSystem.prototype,
    /** @lends JXG.CoordinateSystem.prototype */ {

        /**
         * @private
         */
        _getOriginalTicksDistances: function () {
            return [
                JXG.Ticks.prototype.getDistanceMajorTicks.call(this.xTicks),
                JXG.Ticks.prototype.getDistanceMajorTicks.call(this.yTicks),
            ];
        },

        // documented in geometry element
        hasPoint: function () {
            return false;
        },

        // documented in geometry element
        update: function () {
            if (this.needsUpdate) {
                this.x.update();
                this.y.update();
                this.grid.update();
            }

            return this;
        },

        // documented in geometry element
        updateRenderer: function () {
            if (!this.needsUpdate) {
                return this;
            }

            this.x
                .prepareUpdate()
                .updateVisibility(this.visPropCalc.visible)
                .updateRenderer();

            this.y
                .prepareUpdate()
                .updateVisibility(this.visPropCalc.visible)
                .updateRenderer();

            this.grid
                .prepareUpdate()
                .updateVisibility(this.visPropCalc.visible)
                .updateRenderer();

            this.needsUpdate = false;
            return this;
        },

        // documented in geometry element
        getTextAnchor: function () {
            return this.pointOrigin.coords;
        },

        // documented in geometry element
        getLabelAnchor: function () {
            return this.pointOrigin.coords;
        },

        // documented in geometry element
        cloneToBackground: function () {
            return this;
        },

        // documented in geometry element
        addTransform: function (transform) {
            return this;
        },

        // documented in geometry element
        removeTransform: function (transform) {
            return this;
        },

        // documented in geometry element
        clearTransforms: function () {
            return this;
        },

        // documented in geometry element
        bounds: function () {
            return this.grid.bounds();
        },
    },
);

/**
 * @class A coordinate system is defined by an origin point, a point für x direction and a point for y direction.
 * It will be created two axes x and y and a grid.
 * @pseudo
 * @name CoordinateSystem
 * @augments JXG.CoordinateSystem
 * @constructor
 * @type JXG.CoordinateSystem
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {JXG.Point,array,function_JXG.Point,array,function_JXG.Point,array,function} origin,directionX,directionY Parent elements can be three elements either of type {@link JXG.Point} or array of
 * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
 * If nothing is provided the following points we be chosen: [0,0], [1,0] and [0,1].
 *
 * @example
 * var board = JXG.JSXGraph.initBoard('...', {
 *     boundingbox: [-15, 15, 15, -15],
 *     axis: false, grid: false, // disable default axes and grid
 *  });
 *
 * // Create a basic coordinate system.
 * board.create('coordinatesystem', [], {ticksFrequency: 'min'});
 * </pre><div class="jxgbox" id="JXGc0ae3461-10c4-5c59-b9be-454d419e62a1" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var glex1_board = JXG.JSXGraph.initBoard('JXGc0ae3461-10c4-5c59-b9be-454d419e62a1', {boundingbox: [-15, 15, 15, -15], axis: false, grid: false, keepaspectratio: true, showcopyright: false, shownavigation: false});
 *   board.create('coordinatesystem', [], {ticksFrequency: 'min'});
 * </script><pre>
 */
JXG.createCoordinateSystem = function (board, parents, attributes) {
    var attr,
        point_origin, point_direction_x, point_direction_y;

    function getParent(parent) {
        if (Type.isArray(parent) && parent.length > 1) {
            return parent;
        } else if (Type.isString(parent) || Type.isPoint(parent)) {
            return board.select(parent);
        } else if (Type.isFunction(parent) && Type.isPoint(parent())) {
            return parent;
        } else if (
            Type.isFunction(parent) &&
            parent.length &&
            parent.length >= 2
        ) {
            return parent;
        }
    }

    if (parents.length === 0) {
        point_origin = [0, 0];
        point_direction_x = [1, 0];
        point_direction_y = [0, 1];

    } else if (parents.length === 3) {
        // origin, direction point x, direction point y
        point_origin = getParent(parents[0]);
        point_direction_x = getParent(parents[1]);
        point_direction_y = getParent(parents[2]);

        if (!Type.exists(point_origin) || !Type.exists(point_direction_x) || !Type.exists(point_direction_y)) {
            throw new Error(
                'JSXGraph: Can\'t create line with parent types \'' +
                typeof parents[0] +
                '\', \'' +
                typeof parents[1] +
                '\' and \'' +
                typeof parents[2] +
                '\'.' +
                '\nPossible parent types: [point,point,point], [[x1,y1],[x2,y2],[x3,y3]]',
            );
        }

    } else {
        throw new Error(
            'JSXGraph: Can\'t create line.\n' +
            'Possible parent types: [point,point,point], [[x1,y1],[x2,y2],[x3,y3]]',
        );
    }

    attr = Type.copyAttributes(attributes, board.options, 'coordinatesystem');

    return new JXG.CoordinateSystem(board, point_origin, point_direction_x, point_direction_y, attr);
};

JXG.registerElement('coordinatesystem', JXG.createCoordinateSystem);

export default JXG.CoordinateSystem;
