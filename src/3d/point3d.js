/*
    Copyright 2008-2022
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */
/*global JXG:true, define: true*/

define(['jxg', 'base/constants', 'math/math', 'math/geometry', 'utils/type', '3d/view3d'
], function (JXG, Const, Mat, Geometry, Type, ThreeD) {
    "use strict";

    /**
     * @class This element is used to provide a constructor for a 3D Point.
     * @pseudo
     * @description There are two possibilities to create a Line3D object.
     * <p>
     * First: the line in 3D is defined by two points in 3D (Point3D).
     * The points can be either existing points or coordinate arrays of
     * the form [x, y, z].
     * <p>Second: the line in 3D is defined by a point (or coordinate array [x, y, z])
     * a direction given as array [x, y, z] and an optional range
     * given as array [s, e]. The default value for the range is [-Infinity, Infinity].
     * <p>
     * All numbers can also be provided as functions returning a number.
     *
     * @name Point3D
     * @augments JXG.Point
     * @constructor
     * @type JXG.Point
     * @throws {Exception} If the element cannot be constructed with the given parent
     * objects an exception is thrown.
     * @param {JXG.Point_number,JXG.Point,JXG.Line,JXG.Circle} center,radius The center must be given as a {@link JXG.Point}, see {@link JXG.providePoints}, but the radius can be given
     * as a number (which will create a circle with a fixed radius), another {@link JXG.Point}, a {@link JXG.Line} (the distance of start and end point of the
     * line will determine the radius), or another {@link JXG.Circle}.
     *
     */
     ThreeD.createPoint3D = function (board, parents, attributes) {
        var view = parents[0],
            attr, update2D, D3,
            i, c2d,
            el;

        attr = Type.copyAttributes(attributes, board.options, 'point3d');

        D3 = {
            elType: 'point3d',
            coords: [1, 0, 0, 0],
            X: function () { return this.coords[1]; },
            Y: function () { return this.coords[2]; },
            Z: function () { return this.coords[3]; }
        };

        // If the last element of partents is a 3D object, the point is a glider
        // on that element.
        if (parents.length > 2 && Type.exists(parents[parents.length - 1].D3)) {
            D3.slide = parents.pop();
        } else {
            D3.slide = null;
        }

        if (parents.length === 2) {
            D3.F = parents[1]; // (Array [x, y, z] | function) returning [x, y, z]
            D3.coords = [1].concat(Type.evaluate(D3.F));
        } else if (parents.length === 4) {
            D3.F = parents.slice(1); // 3 numbers | functions
            for (i = 0; i < 3; i++) {
                D3.coords[i + 1] = Type.evaluate(D3.F[i]);
            }
        } else {
            // Throw error
        }

        /**
         * Update the 4D coords array
         * @returns Object
         */
        D3.updateCoords = function () {
            var res, i;
            if (Type.isFunction(this.F)) {
                res = Type.evaluate(this.F);
                this.coords = [1, res[0], res[1], res[2]];
            } else {
                this.coords[0] = 1;
                for (i = 0; i < 3; i++) {
                    if (Type.isFunction(this.F[i])) {
                        this.coords[i + 1] = Type.evaluate(this.F[i]);
                    }
                }
            }
            return this;
        };
        D3.updateCoords();

        c2d = view.project3DTo2D(D3.coords);
        el = board.create('point', c2d, attr);
        el.D3 = D3;
        el.D3.c2d = el.coords.usrCoords.slice(); // Copy of the coordinates to detect dragging
        update2D = el.update;

        if (el.D3.slide) {
            el._minFunc = function (n, m, x, con) {
                var surface = el.D3.slide.D3,
                    c3d = [1, surface.X(x[0], x[1]), surface.Y(x[0], x[1]), surface.Z(x[0], x[1])],
                    c2d = view.project3DTo2D(c3d);

                con[0] = el.X() - c2d[1];
                con[1] = el.Y() - c2d[2];

                return con[0] * con[0] + con[1] * con[1];
            };

            el.projectCoords2Surface = function () {
                var n = 2,		// # of variables
                    m = 2, 		// number of constraints
                    x = [0, 0],
                    // Various Cobyla constants, see Cobyla docs in Cobyja.js
                    rhobeg = 5.0,
                    rhoend = 1.0e-6,
                    iprint = 0,
                    maxfun = 200,
                    surface = this.D3.slide.D3,
                    r, c3d, c2d;

                if (Type.exists(this.D3.params)) {
                    x = this.D3.params.slice();
                }
                r = Mat.Nlp.FindMinimum(this._minFunc, n, m, x, rhobeg, rhoend, iprint, maxfun);

                c3d = [1, surface.X(x[0], x[1]), surface.Y(x[0], x[1]), surface.Z(x[0], x[1])];
                c2d = view.project3DTo2D(c3d);
                this.D3.params = x;
                this.D3.coords = c3d;
                this.coords.setCoordinates(Const.COORDS_BY_USER, c2d);
                this.D3.c2d = c2d;
            };
        }

        el.update = function (drag) {
            var c3d, foot;
            if (!this.needsUpdate) {
                return this;
            }

            // Update is called in from two methods:
            // Once in setToPositionDirectly and
            // once in the subsequent board.update
            if (this.draggable() &&
                Geometry.distance(this.D3.c2d, this.coords.usrCoords) !== 0) {

                if (this.D3.slide) {
                    this.projectCoords2Surface();
                } else {
                    // Drag the point in its xy plane
                    foot = [1, 0, 0, this.D3.coords[3]];
                    c3d = view.project2DTo3DPlane(el, [1, 0, 0, 1], foot);
                    if (c3d[0] !== 0) {
                        this.D3.coords = view.project3DToCube(c3d);
                    }
                }
            } else {
                this.D3.updateCoords();
                // Update 2D point from its 3D view
                el.coords.setCoordinates(Const.COORDS_BY_USER,
                    view.project3DTo2D([1, this.D3.X(), this.D3.Y(), this.D3.Z()])
                );
            }
            this.D3.c2d = el.coords.usrCoords.slice();

            update2D.apply(this, [drag]);
            return this;
        };

        el.normalizeCoords3D = function () {
            if (Math.abs(el.D3.coords[0]) > Mat.eps) {
                el.D3.coords[1] /= el.D3.coords[0];
                el.D3.coords[2] /= el.D3.coords[0];
                el.D3.coords[3] /= el.D3.coords[0];
                el.D3.coords[0] = 1.0;
            }
            return this;
        };

        el.setPosition3D = function (coords, noevent) {
            var c = el.D3.coords,
                oc = el.D3.coords.slice(); // Copy of original values

            if (coords.length === 3) { // Euclidean coordinates
                c[0] = 1.0;
                c[1] = coords[0];
                c[2] = coords[1];
                c[3] = coords[2];
            } else { // Homogeneous coordinates (normalized)
                c[0] = coords[0];
                c[1] = coords[1];
                c[2] = coords[2];
                el.normalizeCoords3D();
            }

            // console.log(el.emitter, !noevent, oc[0] !== c[0] || oc[1] !== c[1] || oc[2] !== c[2] || oc[3] !== c[3]);
            // Not yet working
            if (el.emitter && !noevent &&
                (oc[0] !== c[0] || oc[1] !== c[1] || oc[2] !== c[2] || oc[3] !== c[3])) {
                this.triggerEventHandlers(['update3D'], [oc]);
            }
            return this;
        };

        // Not yet working
        el.__evt__update3D = function (oc) { };

        return el;
    };
    JXG.registerElement('point3d', ThreeD.createPoint3D);

});