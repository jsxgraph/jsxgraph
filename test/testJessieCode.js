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

    it("Jessiecode arithmetic 1", function() {
        board.jc.parse(
            'a = +1;'+
            'b = 1+1;'+

            'c = [1, 2] + [3, 4];'+
            's = \'hello\';' +
            'r = s + \' world\';' +
            't = s + b;'
        );
        expect(board.jc.scope.locals.a).toEqual(1);
        expect(board.jc.scope.locals.b).toEqual(2);
        expect(board.jc.scope.locals.c.length).toEqual(2);
        expect(board.jc.scope.locals.c[0]).toEqual(4);
        expect(board.jc.scope.locals.c[1]).toEqual(6);
        expect(board.jc.scope.locals.r).toEqual('hello world');
        expect(board.jc.scope.locals.t).toEqual('hello2');
    });

    it("Jessiecode unary minus", function() {
        board.jc.parse('y = -2^4;');
        expect(board.jc.scope.locals.y).toEqual(-16);
    });

    it("Jessiecode snippet with x", function() {
        board.create('point', [1,1], {name: 'x'});
        var f = board.create( 'functiongraph', ['x*x']);
        expect(f.Y(2)).toEqual(4);
    });

    it("Jessiecode snippet with id", function() {
        board.create('point', [1,1], {name: 'x'});
        var f = board.create( 'functiongraph', ['x']);
        expect(f.Y(2)).toEqual(2);
    });

    it("Jessiecode curve", function() {
        board.create('point', [1,1], {name: 'x'});
        var f = board.create('curve', ['x*x', 'x']);
        expect(f.X(2)).toEqual(4);
    });

});
