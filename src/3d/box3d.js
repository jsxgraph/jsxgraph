/*
    Copyright 2008-2025
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

/**
 * Create axes and rear and front walls of the
 * view3d bounding box bbox3D.
 */
import JXG from "../jxg.js";
import Type from "../utils/type.js";

/**
 * @class A container element that creates the axes and rear and front planes of a 3D view.
 * @pseudo
 * @description This element "axes3d" is used to create
 *  <ul>
 *   <li> 3D coordinate axes (either "axesPosition:'border'" or "axesPosition:'center'")
 *   <li> A point3d "O" (origin) if "axesPosition:'center'"
 *   <li> Rear and front planes in all three directions of the view3d element.
 *   <li> Coordinate axes on the rear and front planes
 *  </ul>
 *
 * @name Axes3D
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 *
 */
JXG.createAxes3D = function (board, parents, attributes) {
    var view = parents[0],
    directions = ["x", "y", "z"],
    suffixAxis = "Axis",
    sides = ["Rear", "Front"],
    rear = [0, 0, 0],           // x, y, z
    front = [0, 0, 0],          // x, y, z
    i, j, k, i1, i2, attr, pos,
    dir, dir1, len,
    from, to, vec1, vec2,
    range1, range2,
    na, na_parent,
    ticks_attr,
    axes = {};

    if (Type.exists(view.bbox3D)) {
        for (i = 0; i < directions.length; i++) {
            rear[i] = view.bbox3D[i][0];
            front[i] = view.bbox3D[i][1];
        }
    } else {
        for (i = 0; i < directions.length; i++) {
            rear[i] = parents[1][i];
            front[i] = parents[2][1];
        }
    }

    // Main 3D axes
    attr = Type.copyAttributes(attributes, board.options, 'axes3d');
    // Position of the main axes can not be changed during run time
    pos = attr.axesposition;

    for (i = 0; i < directions.length; i++) {
        // Run through ['x', 'y', 'z']
        dir = directions[i];
        na = dir + suffixAxis;

        if (pos === 'center') {
            // Axes centered
            from = [0, 0, 0];
            to = [0, 0, 0];
            to[i] = front[i];
            axes[na] = view.create("axis3d", [from, to], attr[na.toLowerCase()]);
            axes[na].view = view;
        } else if (pos === 'border') {
            // Axes bordered
            na += 'Border';
            from = rear.slice();
            to = front.slice();
            if (dir === 'z') {
                from[1] = front[1];
                to[0] = rear[0];
            } else if (dir === 'x') {
                from = [rear[0], front[1], rear[2]];
                to = [front[0], front[1], rear[2]];
            } else {
                from = [front[0], rear[1], rear[2]];
                to = [front[0], front[1], rear[2]];
            }
            to[i] = front[i];
            // attr[na.toLowerCase()].lastArrow = false;
            axes[na] = view.create("axis3d", [from, to], attr[na.toLowerCase()]);
            axes[na].view = view;

            ticks_attr = attr[na.toLowerCase()].ticks3d;
            ticks_attr.element3d = true;  // Needed to avoid update during change of view
            len = front[i] - rear[i];
            if (dir === 'x') {
                axes[na + "Ticks"] = view.create("ticks3d", [from, [1, 0, 0], len, [0, 1, 0]], ticks_attr);
            } else if (dir === 'y') {
                axes[na + "Ticks"] = view.create("ticks3d", [from, [0, 1, 0], len, [1, 0, 0]], ticks_attr);
            } else {
                axes[na + "Ticks"] = view.create("ticks3d", [from, [0, 0, 1], len, [0, 1, 0]], ticks_attr);
            }
            axes[na + "Ticks"].view = view;
        }
    }

    if (pos === 'center') {
        // Origin (2D point)
        axes.O = view.create(
            "intersection",
            [axes[directions[0] + suffixAxis], axes[directions[1] + suffixAxis]],
            {
                name: "",
                visible: false,
                withLabel: false
            }
        );
        axes.O.view = view;
    } else {
        axes.O = null;
    }

    // Front and rear planes
    for (i = 0; i < directions.length; i++) {
        // Run through ['x', 'y', 'z']
        i1 = (i + 1) % 3;
        i2 = (i + 2) % 3;

        dir = directions[i];
        for (j = 0; j < sides.length; j++) {
            // Run through ['Rear', 'Front']
            // attr = Type.copyAttributes(attributes, board.options, 'axes3d');

            na = dir + "Plane" + sides[j];

            from = [0, 0, 0];
            from[i] = j === 0 ? rear[i] : front[i];
            vec1 = [0, 0, 0];
            vec2 = [0, 0, 0];
            vec1[i1] = 1;
            vec2[i2] = 1;
            range1 = [rear[i1], front[i1]];
            range2 = [rear[i2], front[i2]];

            attr = Type.copyAttributes(attributes, board.options, "axes3d", na);
            axes[na] = view.create("plane3d", [from, vec1, vec2, range1, range2], attr);
            axes[na].elType = 'axisplane3d';
        }
    }

    // Axes on front and rear planes
    for (i = 0; i < directions.length; i++) {
        // Run through ['x', 'y', 'z']
        dir = directions[i];
        for (j = 0; j < sides.length; j++) {
            for (k = 1; k <= 2; k++) {
                i1 = (i + k) % 3;
                dir1 = directions[i1];
                na = dir + "Plane" + sides[j] + dir1.toUpperCase() + 'Axis';
                na_parent = dir + "Plane" + sides[j];

                from = [0, 0, 0];
                to = [0, 0, 0];
                from[i] = to[i] = j === 0 ? rear[i] : front[i];

                from[i1] = rear[i1];
                to[i1] = front[i1];

                attr = Type.copyAttributes(attributes, board.options, "axes3d", na);
                axes[na] = view.create("axis3d", [from, to], attr);
                axes[na].view = view;
                axes[na_parent].addChild(axes[na]);
                axes[na_parent].element2D.inherits.push(axes[na]); // TODO: Access of element2D is not nice
            }
        }
    }

    return axes;
};
JXG.registerElement("axes3d", JXG.createAxes3D);

/**
 * @class A 3D axis element is a line together with optional ticks and labels.
 * @pseudo
 * @description Simple element 3d axis as used with "axesPosition:center". No ticks and no label (yet).
 * <p>
 * At the time being, the input arrays are NOT dynamic, i.e. can not be given as functions.
 *
 * @name Axis3D
 * @augments Arrow
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array} start,end Two arrays of length 3 for the start point and the end point of the axis.
 *
 */
JXG.createAxis3D = function (board, parents, attributes) {
    var view = parents[0],
        attr,
        start = parents[1],
        end = parents[2],
        el_start,
        el_end,
        el;

    // Use 2D points to create axis
    attr = Type.copyAttributes(attributes.point1, board.options, "axis3d", 'point1');
    attr.element3d = true;  // Needed to avoid update during change of view
    el_start = view.create(
        "point",
        [
            (function (xx, yy, zz) {
                return function () {
                    return view.project3DTo2D(xx, yy, zz)[1];
                };
            })(start[0], start[1], start[2]),
            (function (xx, yy, zz) {
                return function () {
                    return view.project3DTo2D(xx, yy, zz)[2];
                };
            })(start[0], start[1], start[2])
        ],
        attr
    );

    attr = Type.copyAttributes(attributes.point2, board.options, "axis3d", 'point2');
    attr.element3d = true;  // Needed to avoid update during change of view
    el_end = view.create(
        "point",
        [
            (function (xx, yy, zz) {
                return function () {
                    return view.project3DTo2D(xx, yy, zz)[1];
                };
            })(end[0], end[1], end[2]),
            (function (xx, yy, zz) {
                return function () {
                    return view.project3DTo2D(xx, yy, zz)[2];
                };
            })(end[0], end[1], end[2])
        ],
        attr
    );

    attr = Type.copyAttributes(attributes, board.options, 'axis3d');
    attr.element3d = true;  // Needed to avoid update during change of view
    el = view.create("arrow", [el_start, el_end], attr);

    return el;
};
JXG.registerElement("axis3d", JXG.createAxis3D);

/**
 * @class Display a rectangular mesh on a 3D plane element.
 * @pseudo
 * @description Create a (rectangular) mesh - i.e. grid lines - on a plane3D element.
 * <p>
 * At the time being, the mesh is not connected to the plane. The connecting element is simply the
 * parameter point.
 *
 * @name Mesh3D
 * @augments Curve
 * @constructor
 * @type Object
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array_Array_Array_Array} point,direction1,direction2,range1,range2 point is an array of length 3
 * determining the starting point of the grid. direction1 and direction2 are arrays of length 3 for the directions of the grid.
 * range1 and range2 (arrays of length 2) give the respective ranges.
 * All parameters can be supplied as functions returning an appropriate data type.
 *
 */
JXG.createMesh3D = function (board, parents, attributes) {
    var view = parents[0],
        attr, el;

    attr = Type.copyAttributes(attributes, board.options, 'mesh3d');
    attr.element3d = true;  // Needed to avoid update during change of view
    el = view.create("curve", [[], []], attr);

    el.point = parents[1];
    el.direction1 = parents[2];
    el.direction2 = parents[3];
    el.range1 = parents[4];
    el.range2 = parents[5];

    /**
     * @ignore
     */
    el.updateDataArray = function () {
        var range1 = Type.evaluate(this.range1),
            range2 = Type.evaluate(this.range2),
            s1 = range1[0],
            e1 = range1[1],
            s2 = range2[0],
            e2 = range2[1],
            l1, l2, res, i,
            v1 = [0, 0, 0],
            v2 = [0, 0, 0],
            step_u = this.evalVisProp('stepwidthu'),
            step_v = this.evalVisProp('stepwidthv'),
            q = [0, 0, 0];

        this.dataX = [];
        this.dataY = [];

        if (Type.isFunction(this.point)) {
            q = this.point();
        } else {
            if (Type.isPoint3D(this.point)) {
                q = this.point.coords;
            } else {
                for (i = 0; i < this.point.length; i++) {
                    q[i] = Type.evaluate(this.point[i]);
                }
            }
        }
        if (Type.isFunction(this.direction1)) {
            v1 = Type.evaluate(this.direction1);
        } else {
            for (i = 0; i < this.direction1.length; i++) {
                v1[i] = Type.evaluate(this.direction1[i]);
            }
        }
        if (Type.isFunction(this.direction2)) {
            v2 = Type.evaluate(this.direction2);
        } else {
            for (i = 0; i < this.direction2.length; i++) {
                v2[i] = Type.evaluate(this.direction2[i]);
            }
        }
        if (q.length === 4) {
            q = q.slice(1);
        }
        if (v1.length === 4) {
            v1 = v1.slice(1);
        }
        if (v2.length === 4) {
            v2 = v2.slice(1);
        }

        l1 = JXG.Math.norm(v1, 3);
        l2 = JXG.Math.norm(v2, 3);
        for (i = 0; i < 3; i++) {
            v1[i] /= l1;
            v2[i] /= l2;
        }

        // sol = Mat.Geometry.getPlaneBounds(v1, v2, q, s1, e1);
        // if (sol !== null) {
        //     s1 = sol[0];
        //     e1 = sol[1];
        //     s2 = sol[2];
        //     e2 = sol[3];
        // }

        res = view.getMesh(
            [
                function (u, v) {
                    return q[0] + u * v1[0] + v * v2[0];
                },
                function (u, v) {
                    return q[1] + u * v1[1] + v * v2[1];
                },
                function (u, v) {
                    return q[2] + u * v1[2] + v * v2[2];
                }
            ],
            [Math.ceil(s1), Math.floor(e1), (Math.ceil(e1) - Math.floor(s1)) / step_u],
            [Math.ceil(s2), Math.floor(e2), (Math.ceil(e2) - Math.floor(s2)) / step_v]
        );
        this.dataX = res[0];
        this.dataY = res[1];
    };

    return el;
};

JXG.registerElement("mesh3d", JXG.createMesh3D);
