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
describe("Test JessieCode", function () {
    var board, target,
        pointerId = 0;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');

    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-10, 10, 10, -10],
        keyboard: {
            enabled: true,
            dy: 20,
            dx: 20,
            panShift: true,
            panCtrl: false
        },
        showCopyright: false,
        showNavigation: false
    });

    it("JessieCode snippet", function() {
        var fn = board.jc.snippet('x^2', true, 'x', false);
        expect(fn(2)).toEqual(4);
    });

    it("Jessiecode function graph", function() {
        var f = board.create('functiongraph', ['x^2']);
        expect(f.Y(2)).toEqual(4);
    });

});
