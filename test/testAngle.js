describe("Test angles", function () {
    var board, target,
        pointerId = 0;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');

    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
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


    it("Test bidrectional setAngle", function () {
        var A, B, C, angle, phi,
            evt;


        phi = Math.PI/2;
        A = board.create('point', [3, 0]);
        B = board.create('point', [0, 0]);
        C = board.create('point', [2, 2]);

        angle = board.create('angle', [A, B, C], {radius: 'auto'});
        angle.setAngle(phi);
        expect(C.X()).toBeCloseTo(0, 12);
        expect(C.Y()).toBeCloseTo(3, 12);
        
        // Move A
        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 400,
            clientY: 250
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 250,
            clientY: 100
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(C.X()).toBeCloseTo(-3, 12);
        expect(C.Y()).toBeCloseTo(0, 12);

        // Move C
        pointerId++;
        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 100,
            clientY: 250
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 250,
            clientY: 100
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        expect(A.X()).toBeCloseTo(3, 12);
        expect(A.Y()).toBeCloseTo(0, 12);
    
    });

});
