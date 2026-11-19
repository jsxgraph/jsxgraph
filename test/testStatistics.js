/*
    Copyright 2008-2026
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
describe("Test JXG.Mat.Statistics", function () {
    it("Percentiles", function () {
        var data = [
            57, 57, 57, 58, 63, 66, 66, 67, 67, 68, 69, 70, 70, 70, 70, 72, 73, 75, 75, 76, 76,
            78, 79, 81
        ];
        expect(JXG.Math.Statistics.min(data)).toEqual(57);
        expect(JXG.Math.Statistics.max(data)).toEqual(81);
        expect(JXG.Math.Statistics.percentile(data, [25, 50, 75])).toEqual([66, 70, 75]);
    });

    it("Percentiles at the ends of the range", function () {
        expect(JXG.Math.Statistics.percentile([1, 2, 3, 4], 100)).toEqual(4);
        expect(JXG.Math.Statistics.percentile([3, 1, 2], 100)).toEqual(3);
        expect(JXG.Math.Statistics.percentile([5, 1, 3, 2], [50, 100])).toEqual([2.5, 5]);
        expect(JXG.Math.Statistics.percentile([4, 2, 3], 0)).toEqual(2);
    });
});
