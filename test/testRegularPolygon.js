describe("Test regular polygons", function () {
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


    it("Test drag reg. polygon", function () {
        var p = [], 
            evt;

        p[0] = board.create('point', [-2, 0]);
        p[1] = board.create('point', [2, 0]);
        p[2] = board.create('point', [2, 4]);
        p[3] = board.create('point', [-2, 3]);
        board.create('regularpolygon', p, {hasInnerPoints: true});

        expect(p[3].coords.scrCoords[1]).toBeCloseTo(200, 12);
        expect(p[3].coords.scrCoords[2]).toBeCloseTo(150, 12);

        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 200,
            clientY: 150
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 200,
            clientY: 100
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(p[3].coords.scrCoords[1]).toBeCloseTo(200, 12);
        expect(p[3].coords.scrCoords[2]).toBeCloseTo(150, 12);

        pointerId++;
        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 300,
            clientY: 250
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 200,
            clientY: 150
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(p[0].coords.scrCoords[1]).toBeCloseTo(200, 12);
        expect(p[0].coords.scrCoords[2]).toBeCloseTo(250, 12);

        expect(p[1].coords.scrCoords[1]).toBeCloseTo(200, 12);
        expect(p[1].coords.scrCoords[2]).toBeCloseTo(150, 12);

        expect(p[2].coords.scrCoords[1]).toBeCloseTo(100, 12);
        expect(p[2].coords.scrCoords[2]).toBeCloseTo(150, 12);

        expect(p[3].coords.scrCoords[1]).toBeCloseTo(100, 12);
        expect(p[3].coords.scrCoords[2]).toBeCloseTo(250, 12);

    });

});
