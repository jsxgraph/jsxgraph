/*
    Copyright 2008-2021
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

describe("Test JXG.Math.Clip", function () {
    var board;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        showCopyright: false,
        showNavigation: false
    });

    check_points = function(curve, correct) {
        var i, len = curve.numberPoints;
        for (i = 0; i < len; i++) {
            console.log(curve.points[i].usrCoords.slice(1));
            expect(curve.points[i].usrCoords.slice(1)).toEqual(correct[i]);
        }
    };

    it("intersection 1", function () {
        var clip_type = 'intersection',
            correct = [[-1,3], [1,3], [1.5,1.5], [1,1], [-1,3]],
                /*[[1.5, 1.5],
                [1, 1],
                [-1, 3],
                [-2.0000008683237622, 2.999999943381888],
                [1, 3],
                [1.5, 1.5]],*/
            
            curve1 = board.create('curve', [
                [-3, 3, 0, -3],
                [3, 3, 0, 3]
            ]),
            curve2 = board.create('polygon', [[-1, 3], [2, 0], [1, 3], [-2, 3]]),
            clip_path = board.create('curve', [[], []]);

        clip_path.updateDataArray = function () {
            var a = JXG.Math.Clip.greinerHormann(curve1, curve2, clip_type, this.board);
            this.dataX = a[0];
            this.dataY = a[1];
        };
        board.update();

        check_points(clip_path, correct);
    });
});

