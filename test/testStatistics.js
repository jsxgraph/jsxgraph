describe("Test JXG.Mat.Statistics", function() {

    it("Percentiles", function() {
        var data = [57, 57, 57, 58, 63, 66, 66, 67, 67, 68, 69, 70, 70, 70, 70, 72, 73, 75, 75, 76, 76, 78, 79, 81];
        var Q = [];

        Q[0] = JXG.Math.Statistics.min(data);
        expect(JXG.Math.Statistics.min(data)).toEqual(57);
        expect(JXG.Math.Statistics.max(data)).toEqual(81);
        expect(JXG.Math.Statistics.percentile(data, [25, 50, 75])).toEqual([66, 70, 75]);
    });
});