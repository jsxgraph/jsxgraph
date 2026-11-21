/*
    Copyright 2008-2026
        Matthias Ehmann,
        Carsten Miller,
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

// Some notes: (21.11.2026)
//
// - In Chromium browsers (chrome, brave), point3d does not
//   react to event 'click' if it is in a depthorder layer.
//   However, it reacts on 'up' event...
//
// - Point dragging might be slow because of depth ordering,
//   see line 1082 in view3d.js, updateDepthOrdering.
//   This can be experienced if the console is open on Chromium browsers

import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * @class The ProjectionPoints3D provides for a {@link Point3D} the projected points onto the surrounding planes of the 3D bounding box and helper lines connecting these points.
 * In other words, it is a custom JSXGraph 3D Element that creates interactive orthogonal projection points and connecting lines on the bounding walls of a 3D view.
 *
 * Each {@link Point3D} that is given as parameter or is registered later on, will show
 * the projection points whenever the user clicks on the point.
 * A second click on the same point hides the projection points.
 *
 * @pseudo
 * @name ProjectionPoints3D
 * @elementclass 3D
 * @augments JXG.Point3D
 * @type Object
 * @constructor
 * @see ProjectionPoints3D#register
 */
 // * @throws
/**
 * @jsxgraphsignature ProjectionPoints3D
 * @param {...Point3D} [point] Optional initial 3D point(s) to be registered.
 * @example
 * var bound = [-5, 5];
 * var view = board.create('view3d',
 *     [
 *         [-6, -3], [8, 8],
 *         [bound, bound, bound]
 *     ],
 *     {
 *         projection: 'central',
 *         infobox: {
 *             strokeColor: 'gray',
 *             fontSize: 12
 *         }
 *     });
 *
 *
 * var A = view.create('point3d', [2, 2, -2], { size: 5, name: 'A' });
 * var B = view.create('point3d', [-2, -2, -2], { size: 5, name: 'B' });
 *
 * var projections = view.create('projectionpoints3d', [A], { pointXRear: {color: JXG.palette.blue} });
 * projections.register(B);
 *
 * </pre><div id="JXG8a3d6e8f-5376-4b42-9cda-d5e7b46aa0dd" class="jxgbox" style="width: 500px; height: 500px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXG8a3d6e8f-5376-4b42-9cda-d5e7b46aa0dd',
 *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
 *     var bound = [-5, 5];
 *     var view = board.create('view3d',
 *         [
 *             [-6, -3], [8, 8],
 *             [bound, bound, bound]
 *         ],
 *         {
 *             projection: 'central',
 *             infobox: {
 *                 strokeColor: 'gray',
 *                 fontSize: 12
 *             }
 *         });
 *
 *
 *     var A = view.create('point3d', [2, 2, -2], { size: 5, name: 'A' });
 *     var B = view.create('point3d', [-2, -2, -2], { size: 5, name: 'B' });
 *
 *     var projections = view.create('projectionpoints3d', [A], { pointXRear: {color: JXG.palette.blue} });
 *     projections.register(B);
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createProjectionPoints3D = function (board, parents, attributes) {
    var view = parents[0],
        attr,
        i, j,
        isSyncing = false,              // Lock to protect the application from recursive infinite update loops
        focus = null,                   // Reference to the currently focused and active external 3D point
        handler = null,                 // Reference to the event listener handler attached to the focused point

        center = view.create("point3d", [0, 0, 0], { name: '', visible: false }), // Hidden center anchor for the projection system
        projections = {},               // Public joint object containing all created elements and methods
        optionKey, optKey1, optKey2,    // Property string indentifier used to access configuration objects like 'xRear'

        pointName,                      // Property strings for dynamically naming sub-elements
        lineName,
        projectionName,
        guideLine1Name,
        guideLine2Name,

        pointConfig,                    // Temporary storage for individual configuration blocks retrieved from attributes
        lineConfig,
        guide1Config,
        guide2Config,

        isVisible,                      // Boolean determining the visibility of projections based on attribute values
        isGuide1Visible,
        isGuide2Visible,

        newX, newY, newZ,               // Temporary coordinate stores for recalculating transformations during synchronization


        fixedAxis,                      // Caches the lower-case representation of an axis string ('x', 'y', or 'z') for handlers
        // Temporary reference for event handler closures returned by _projectionsSync
        h, //sprechende Variable vlt übersichtlicher sprechender Code für projectionsSync

        potentialPoint,                // Evaluates external parents passed during the initial constructor execution


        axes = ['X','Y','Z'],          // Specifier arrays for building MemberExpressions
        walls = ['Rear','Front'],
        types = ['point', 'line', 'guideLine1', 'guideLine2'],
        directions = [
            [[0, 1, 0], [0, 0, 1]], // X-Plane
            [[1, 0, 0], [0, 0, 1]], // Y-Plane
            [[1, 0, 0], [0, 1, 0]]  // Z-Plane
        ],

        //Lookup table mapping string keys to structural JSXGraph 3D bounding planes
        planes = { XRear: view.defaultAxes.xPlaneRear,
                   YRear: view.defaultAxes.yPlaneRear,
                   ZRear: view.defaultAxes.zPlaneRear,
                   XFront: view.defaultAxes.xPlaneFront,
                   YFront: view.defaultAxes.yPlaneFront,
                   ZFront: view.defaultAxes.zPlaneFront
                };

    attr = Type.copyAttributes(attributes, board.options, 'projectionpoints3d');

    // Create projection points, add to object projections
    for (i = 0; i < axes.length; i++) {
        for (j = 0; j < walls.length; j++) {
            pointName = 'point' + axes[i] + walls[j];
            optionKey = pointName.toLowerCase();
            pointConfig = attr[optionKey] || {};

            // If visibility isn't defined in options.js, it is set to true by default
            isVisible = (Type.exists(pointConfig.visible)) ? pointConfig.visible : true;

            // Plane glider
            projections[pointName] = view.create('point3d', [
                () => center.X(), () => center.Y(), () => center.Z(),
                planes[axes[i] + walls[j]]
            ], pointConfig);
            projections[pointName]._initiallyVisible = isVisible; // reminder for ._show()
        }
    }

    // Create projection lines that connect the projection points to the center
    // as well as the helper lines (guideLines) at the planes of the bbox3d
    for (i = 0; i < axes.length; i++) {
        for (j = 0; j < walls.length; j++) {
            // Lines to focus point
            lineName  = 'line' + axes[i] + walls[j];
            optionKey = lineName.toLowerCase();
            pointName = 'point' + axes[i] + walls[j];

            lineConfig = attr[optionKey] || {};
            isVisible = (Type.exists(lineConfig.visible)) ? lineConfig.visible : true;

            projections[lineName] = view.create('line3d', [center, projections[pointName]], lineConfig);
            projections[lineName]._initiallyVisible = isVisible;

            // Guide lines
            guideLine1Name = 'guideLine1' + axes[i] + walls[j];
            guideLine2Name = 'guideLine2' + axes[i] + walls[j];

            optKey1= ('guideline1' + axes[i] + walls[j]).toLowerCase();
            optKey2= ('guideline2' + axes[i] + walls[j]).toLowerCase();
            guide1Config = attr[optKey1] || {};
            guide2Config = attr[optKey2] || {};

            isGuide1Visible = (Type.exists(guide1Config.visible)) ? guide1Config.visible : true;
            isGuide2Visible = (Type.exists(guide2Config.visible)) ? guide2Config.visible : true;
            if (j === 0){
                projections[guideLine1Name] = view.create('line3d', [
                    projections[pointName],
                    directions[i][0],
                    [-Infinity, 0]
                ], guide1Config);
                projections[guideLine2Name] = view.create('line3d', [
                    projections[pointName],
                    directions[i][1],
                    [-Infinity, 0]
                ], guide2Config);
            } else {projections[guideLine1Name] = view.create('line3d', [
                    projections[pointName],
                    directions[i][0],
                    [0, Infinity]
                    ], guide1Config);
                projections[guideLine2Name] = view.create('line3d', [
                    projections[pointName],
                    directions[i][1],
                    [0, Infinity]
                ], guide2Config);
            }
            projections[guideLine1Name]._initiallyVisible = isGuide1Visible;
            projections[guideLine2Name]._initiallyVisible = isGuide2Visible;
        }
    }

    /**
     * Update all visible projection points to match the current coordinates of the hidden center anchor.
     * It is called whenever the `focus` point or one of the projection points is dragged.
     *
     * @name ProjectionPoints3D#_sync
     * @function
     * @private
     */
    projections._sync = function () {
        var i, j;

        for (i = 0; i < axes.length; i++){
            for (j = 0; j < walls.length; j++){
                pointName = 'point' + axes[i] + walls[j];
                if (projections[pointName]) {
                    projections[pointName].setPosition([center.X(), center.Y(), center.Z()]);
                }
            }
        }
    };

    /**
     * Returns an event handler for interactions with the projection points.
     * The returned function synchronizes the center and focused point. It is called when
     * a projection point is dragged, but not when the focus point
     * is dragged.
     *
     * The focus point might lag one update behind.
     *
     * @name ProjectionPoints3D#_projectionsSync
     * @function
     * @param wallPoint
     * @param fixedAxis
     * @returns {function}
     * @private
     */
    projections._projectionsSync = function(wallPoint, fixedAxis) {
        return function() {
            if (isSyncing) {
                return;
            }
            isSyncing = true;

            if (!wallPoint) {
                isSyncing = false;
                return;
            }

            if (fixedAxis === 'x') {
                newX = center.X();
                newY = wallPoint.Y();
                newZ = wallPoint.Z();
            }
            else if (fixedAxis === 'y') {
                newX = wallPoint.X();
                newY = center.Y();
                newZ = wallPoint.Z();
            }
            else if (fixedAxis === 'z') {
                newX = wallPoint.X();
                newY = wallPoint.Y();
                newZ = center.Z();
            }

            center.setPosition([newX, newY, newZ]);
            projections._sync();
            if (focus !== null) {
                focus.setPosition([newX, newY, newZ]);
            }

            isSyncing = false;
        };
    };

    // Bind event tracking to generated projection points via dynamic property loops
    for (i = 0; i< axes.length; i++){
        for (j= 0; j< walls.length;j++){
            pointName ='point' + axes[i] + walls[j];
            if (projections[pointName]){
                fixedAxis = axes[i].toLowerCase();
                h = projections._projectionsSync(projections[pointName], fixedAxis);

                projections[pointName].element2D.on('drag', h);
                projections[pointName].element2D.on('up', h);
            }
        }
    }

    /**
     * Iterate through all elements of {@link ProjectionPoints3D} to hide all points and lines.
     *
     * @name ProjectionPoints3D#hide
     * @function
     */
    projections._hide = function() {
        var i, j, k;

        view.board.suspendUpdate();
        for (i = 0; i< types.length; i++){
            for (j = 0; j< axes.length; j++){
                for (k = 0; k < walls.length; k++){
                    projectionName = types[i] + axes [j] + walls [k];
                    if (projections[projectionName]) {
                        projections[projectionName].hide();
                    }
                }
            }
        }
        view.board.unsuspendUpdate();
    };

    /**
     * Iterate through all elements of {@link ProjectionPoints3D} to show all points and lines.
     *
     * @name ProjectionPoints3D#show
     * @function
     */
    projections._show = function() {
        var i, j, k;

        view.board.suspendUpdate();
        for (i = 0; i < types.length; i++){
            for (j = 0; j < axes.length; j++){
                for (k = 0; k < walls.length; k++){
                    projectionName = types[i] + axes [j] + walls [k];
                    if (projections[projectionName]._initiallyVisible) {
                        projections[projectionName].show();
                    } else {
                        projections[projectionName].hide();
                    }
                }
            }
        }
        view.board.unsuspendUpdate();
    };

    /**
     * Switch component focus to an external point, linking its movement frames directly to the projections points.
     * This is triggered automatically if the user clicks on a registered {@link Point3D}, but
     * it can also be triggered programmatically with this method.
     * A Point3D has to be registered to be able to react to this binding.
     *
     * @name ProjectionPoints3D#bindTo
     * @function
     * @param {Point3D} point3d Registered JSXGraph 3D point element
     * @private
     * @see ProjectionPoints3D#register
     * @see ProjectionPoints3D#unbind
     */
    projections.bindTo = function (point) {
        // If the point is already active do nothing
        if (focus !== null && point.id === focus.id){
            return;
        }

        // If a different point is active, detach its listeners first
        if (focus !== null && point.id !== focus.id) {
            projections.unbind();
        }

        focus = point;
        projections.activePoint = point;

        // Synchronizing the projections to the focus.
        // This handler is called when the 3D point is dragged.
        handler = function() {
            if (isSyncing) {
                return;
            }
            isSyncing = true;
            center.setPosition([focus.X(), focus.Y(), focus.Z()]);
            projections._sync();

            isSyncing = false;
        };

        focus.element2D.on('drag', handler);
        focus.element2D.on('up', handler);

        // Reveal of all elements
        handler();
        projections._show();
    };

    /**
     * Wraps a 3D point with custom event namespaces to support clicking to toggle visisibility of the projection points.
     *
     * @name ProjectionPoints3D#register
     * @function
     * @param {Point3D} point3d Point3D element.
     * @see ProjectionPoints3D#unregister
     */
    projections.register = function(point) {
        if (!point || !point.element2D) {
            return;
        }

        if (point._projClickHandler){
            return;
        }

        point._projDownHandler = function() {
            this._click = true;
            return false;
        };

        point._projDragHandler = function() {
            this._click = false;
            return false;
        };

        point._projClickHandler = function() {
            if (this._click) {
                this._click = false;

                // If the projections are already active for a point its projections are turned off after click event
                if (focus !== null && point.id === focus.id) {
                    projections.unbind();
                    return;
                }
            }

            // Otherwise sync and show projections
            projections.bindTo(point);
            return false;
        };

        point.element2D.on('down', point._projDownHandler);
        point.element2D.on('drag', point._projDragHandler);
        point.element2D.on('up', point._projClickHandler);

        point._isRegistered = true;
    };

    /**
     * Unbind listener instances from a target {@link Point3D} and clean up namespaces.
     *
     * @name ProjectionPoints3D#unregister
     * @function
     * @param {Point3D} point3d Registered Point3D element
     * @public
     * @see ProjectionPoints3D#register
     */
    projections.unregister = function(point) {
        if (!point || !point.element2D) {
            return;
        }

        if (point._projDownHandler) {
            point.element2D.off('down', point._projDownHandler);
        }
        if (point._projDragHandler) {
            point.element2D.off('drag', point._projDragHandler);
        }
        if (point._projClickHandler) {
            point.element2D.off('click', point._projClickHandler);
        }

        delete point._projDownHandler;
        delete point._projDragHandler;
        delete point._projClickHandler;
        delete point._isRegistered;

        if (focus !== null && point.id === focus.id) {
            projections.unbind();
        }
    };

    // Initialization check for direct constructor parameter assignments. If no parameter is passed the projections are hidden.
    if (parents.length > 1) {
        for (i = 1; i < parents.length; i++) {
            potentialPoint = parents[i];

            if (potentialPoint && potentialPoint.element2D) {
                projections.register(potentialPoint);

                if (i === 1) {
                    projections.bindTo(potentialPoint);
                }
            }
        }
    } else {
        projections._hide();
    }

    /**
     * Unbind synced projections.
     *
     * @name ProjectionPoints3D#unbind
     * @function
     * @private
     * @see ProjectionPoints3D#bindTo
     */
    projections.unbind = function() {
        if (focus !== null) {
            focus.element2D.off('drag', handler);
            focus.element2D.off('up', handler);
            focus = null;
            handler = null;
            projections.activePoint = null;
            projections._hide();
        }
    };

    // Returns the ProjectionPoints3D object housing all elements and interface methods
    return projections;
};

JXG.registerElement("projectionpoints3d", JXG.createProjectionPoints3D);

