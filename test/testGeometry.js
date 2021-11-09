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

});
