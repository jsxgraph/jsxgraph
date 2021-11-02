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
 *  Js-Test-Driver Test Suite for JXG.Group
 *  http://code.google.com/p/js-test-driver
 */

TestCase("Group", {
    board: null,
    A: null,
    B: null,
    C: null,

    setUp: function () {
        try {
            document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
            this.board = JXG.JSXGraph.initBoard('jxgbox', {axis: false, grid: false, boundingbox: [-5, 5, 5, -5], showCopyright: false, showNavigation: false});

            this.A = this.board.create('point', [1, 1]);
            this.B = this.board.create('point', [1, 1]);
            this.C = this.board.create('point', [1, 1]);
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

    testCreateGroup: function () {
        expectAsserts(3);

        var g;

        assertNoException('group successfully created', (function (_that) {
            return function () {
                _that.board.create('group', [_that.A, _that.B, _that.C]);
            };
        })(this));

        g = this.board.create('group', [this.A, this.B, this.C]);
        assertObject('group is an object', g);
        assertInstanceOf('group is an instance of JXG.Group', JXG.Group, g);
    }
});

