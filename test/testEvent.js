describe("Test board events", function() {
    var board, target;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    target = document.getElementById('jxgbox');
    /*
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'no',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        showCopyright: false,
        showNavigation: false
    });
    */

    it("Test event", function() {
        let spy = jasmine.createSpy("xyzevent");
        document.addEventListener('xyzevent', function() {
            console.log("OUT");
            spy();
        });

        let event = new CustomEvent('xyzevent', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.dispatchEvent(event);

        expect(spy).toHaveBeenCalled();
    });

});