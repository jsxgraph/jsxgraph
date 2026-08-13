/*
    Copyright 2008-2026
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

describe("Test board handling", function() {
    var board;

    // jasmine.clock().install();
    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        resize: {enabled: false},
        showCopyright: false,
        showNavigation: false
    });

    it("suspendUpdate interruption", function() {
        var el = board.create('text', [0, 10, 'test']);

        board.suspendUpdate();
        // Unfortunately, this test does not throw an error in test environment
        JXG.JSXGraph.freeBoard(board);
    });

    it("removes print media query listeners with the registered callback", function() {
        var mediaQueries = {}, testBoard,
            container = document.createElement('div');

        container.id = 'print-listener-board';
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        spyOn(window, 'matchMedia').and.callFake(function(query) {
            mediaQueries[query] = {
                addEventListener: jasmine.createSpy('addEventListener'),
                removeEventListener: jasmine.createSpy('removeEventListener')
            };
            return mediaQueries[query];
        });

        testBoard = JXG.JSXGraph.initBoard(container.id, {
            axis: false,
            grid: false,
            boundingbox: [-5, 5, 5, -5],
            showCopyright: false,
            showNavigation: false
        });
        JXG.JSXGraph.freeBoard(testBoard);

        ['print', 'screen'].forEach(function(query) {
            var mediaQuery = mediaQueries[query],
                registeredCallback = mediaQuery.addEventListener.calls.mostRecent().args[1];

            expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
                'change',
                registeredCallback,
                false
            );
        });
        container.remove();
    });


});
