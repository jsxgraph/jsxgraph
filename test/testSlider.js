/*
    Copyright 2008-2013
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


/*
 *  Js-Test-Driver Test Suite for the slider element
 *  http://code.google.com/p/js-test-driver
 */

TestCase("Slider", {
    board: null,

    setUp: function () {
        try {
            document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
            this.board = JXG.JSXGraph.initBoard('jxgbox', {axis: false, grid: false, boundingbox: [-5, 5, 5, -5], showCopyright: false, showNavigation: false});
        } catch (e) {
            console.log(e, e.stack);
        }
    },

    tearDown: function () {
        try {
            JXG.JSXGraph.freeBoard(this.board);
            this.board = null;
            document.getElementsByTagName('body')[0].innerHTML = '';
        } catch (e) {
            console.log(e, e.stack);
        }
    },

    testCreateSlider: function () {
        expectAsserts(5);

        var s;

        assertNoException('slider successfully created', (function (_that) {
            return function () {
                _that.board.create('slider', [[0, 0], [1, 0], [0, 5, 10]]);
            };
        })(this));

        s = this.board.create('slider', [[0, 0], [1, 0], [0, 5, 10]]);
        assertObject('slider is an object', s);
        assertInstanceOf('slider is an instance of JXG.Point', JXG.Point, s);
        assertEquals('slider.type is JXG.OBJECT_TYPE_GLIDER', JXG.OBJECT_TYPE_GLIDER, s.type);
        assertEquals('slider.elementClass is JXG.OBJECT_CLASS_POINT', JXG.OBJECT_CLASS_POINT, s.elementClass);
    },

    testValue: function () {
        expectAsserts(1);
        var s;

        s = this.board.create('slider', [[0, 0], [1, 0], [0, 5, 10]]);
        assertTrue('initial slider value corresponds to Value()', Math.abs(5 - s.Value()) < JXG.Math.eps);
    },

    testIds: function () {
        expectAsserts(6);
        var s;

        s = this.board.create('slider', [[0, 0], [1, 0], [0, 5, 10]], {
            id: '_glider',
            withLabel: true,
            name: 'S',
            point1: {
                id: '_point1'
            },
            point2: {
                id: '_point2'
            },
            baseline: {
                id: '_baseline'
            },
            highline: {
                id: '_highline'
            },
            label: {
                id: '_label'
            }
        });
        assertEquals('slider id', '_glider', s.id);
        assertEquals('slider point1 id', '_point1', s.point1.id);
        assertEquals('slider point2 id', '_point2', s.point2.id);
        assertEquals('slider baseline id', '_baseline', s.baseline.id);
        assertEquals('slider highline id', '_highline', s.highline.id);
        assertEquals('slider label id', '_label', s.label.id);
    }
});

