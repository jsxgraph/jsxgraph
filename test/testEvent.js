describe("Test board events", function() {
    var board, target;

    // 1 user unit = 100px
    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');
    
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [0, 5, 5, 0],
        showCopyright: false,
        showNavigation: false
    });

    it("Test custom event", function() {
        var spy, event;
        spy = jasmine.createSpy("xyzevent");

        document.addEventListener('xyzevent', function() {
            spy();
        });
        event = new CustomEvent('xyzevent', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.dispatchEvent(event);

        expect(spy).toHaveBeenCalled();
    });

    it("Test board position", function() {
        var board_pos = board.getCoordsTopLeftCorner();
        expect(board_pos).toEqual([0, 0]);
    });

    it("Test pointer handlers", function() {
        expect(JXG.supportsPointerEvents()).toBeTrue();
        expect(board.hasPointerHandlers).toBeTrue();
    });

    it("Test dragging by pointer handlers", function() {
        var p, evt, 
            pointerId = 1;

        p = board.create('point', [0, 0]);

        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 1,
            clientY: 499
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 201,
            clientY: 499
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);

        expect([p.X(), p.Y()]).toEqual([2, 0]);
    });

    it("Test snap to grid", function() {
        var p, evt,
            pointerId = 2;

        p = board.create('point', [0, 0], {snapToGrid: true});

        evt = new PointerEvent('pointerdown', {
            pointerId: pointerId,
            clientX: 1,
            clientY: 499
        });
        board.pointerDownListener(evt);

        evt = new PointerEvent('pointermove', {
            pointerId: pointerId,
            clientX: 131,
            clientY: 499
        });
        board.pointerMoveListener(evt);
        board.pointerUpListener(evt);
        
        console.log([p.X(), p.Y()]);

        expect([p.X(), p.Y()]).toEqual([1, 0]);
    });

});