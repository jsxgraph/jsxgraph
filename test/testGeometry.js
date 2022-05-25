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
describe("Test geometry functions", function() {
    var board;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-8, 8, 8, -8],
        showCopyright: false,
        showNavigation: false
    });

    it("affineRatio Coords", function() {
        var a = new JXG.Coords(JXG.COORDS_BY_USER, [1, 0, 0], board),
            b = new JXG.Coords(JXG.COORDS_BY_USER, [1, 1, 0], board),
            c = new JXG.Coords(JXG.COORDS_BY_USER, [1, 3, 0], board);

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("affineRatio Array", function() {
        var a = [1, 0, 0],
            b = [1, 1, 0],
            c = [1, 3, 0];

        expect(JXG.Math.Geometry.affineRatio(a, b, c)).toEqual(3);
    });

    it("meetSegmentSegment", function() {
        var res = JXG.Math.Geometry.meetSegmentSegment(
                    [1, -1, -1], [1, -1, 1], 
                    [1, 1, 2], [1, -1, 2]
                );

        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1], [1, -1, 1], 
            [2, 2, 4], [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);

        res = JXG.Math.Geometry.meetSegmentSegment(
            [1, -1, -1], [1, -1, 1], 
            [1, 1, 2], [2, -2, 4]
        );
        expect(res).toEqual([[1, -1, 2], 1.5, 1]);
    });

    it("meetPathPath", function() {
        var pol1, pol2, p;

        pol1 = board.create('polygon', [[1, 1], [2, 0], [1, 2], [-1,1]]);
        pol2 = board.create('polygon', [[1, 1.5], [2, 2], [0, 3], [0,0.5]]);
        p = board.create('intersection', [pol1, pol2, 3]);
        expect([p.X(), p.Y()]).toEqual([0.5, 1]);
    });

    it("meetPolygonLine", function() {
        var pol1, li, p;

        pol1 = board.create('polygon', [[1, 1], [2, 0], [1, 2], [-1,1]]);
        li = board.create('line', [[-2,2], [4,-2]]);
        p = board.create('intersection', [pol1, li, 0]);

        expect(p.X()).toBeCloseTo(-0.7142857142857143, 7);
        expect(p.Y()).toBeCloseTo(1.1428571428571428, 7);
    });

});
