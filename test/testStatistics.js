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

    it("Percentiles and boxplot ignore NaN entries", function () {
        var data = [10, NaN, 9, 8, 7, 6, 5, 4, 3, 2, 1];

        expect(JXG.Math.Statistics.percentile(data, [25, 50, 75])).toEqual([3, 5.5, 8]);
        expect(JXG.Math.Statistics.percentile([3, NaN, 1, 2, 5, 4], 50)).toEqual(3);
        expect(JXG.Math.Statistics.boxplot(data)).toEqual([1, 3, 5.5, 8, 10, []]);
        expect(JXG.Math.Statistics.boxplot(new Float64Array(data))).toEqual([1, 3, 5.5, 8, 10, []]);
    });

    it("TheilSenRegression", function () {
        var coords = function (x, y) {
            return x.map(function (v, i) {
                return { usrCoords: [1, v, y[i]] };
            });
        };

        expect(
            JXG.Math.Statistics.TheilSenRegression(coords([0, 1, 2, 3], [0, 1, 4, 9]))
        ).toEqual([-2, 3, -1]);
        expect(JXG.Math.Statistics.TheilSenRegression(coords([0, 3, 0], [0, 0, 3]))).toEqual([
            1.5, -0.5, -1
        ]);
    });

    it("divide returns the result of div", function () {
        expect(JXG.Math.Statistics.divide([4, 6], 2)).toEqual([2, 3]);
        expect(JXG.Math.Statistics.divide(6, 3)).toEqual(2);
    });
});
