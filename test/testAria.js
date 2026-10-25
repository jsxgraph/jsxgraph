/*
    Copyright 2008-2026
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

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

describe("Test ARIA features", function() {
    var board, container;

    function key(el, code) {
        board.keyDownListener({ target: { id: el.rendNode.id }, keyCode: code, key: '' });
    }

    function regions() {
        return container.querySelectorAll('[aria-live]');
    }

    function regionText(level) {
        var r = container.querySelector('[aria-live="' + level + '"]');
        return r ? r.textContent : null;
    }

    function init(attr) {
        document.getElementsByTagName('body')[0].innerHTML =
            '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
        container = document.getElementById('jxgbox');
        board = JXG.JSXGraph.initBoard('jxgbox', JXG.merge({
            renderer: 'svg',
            axis: false,
            grid: false,
            boundingbox: [-5, 5, 5, -5],
            resize: { enabled: false },
            keyboard: { enabled: true, dx: 20, dy: 20, panShift: true, panCtrl: false },
            showCopyright: false,
            showNavigation: false
        }, attr || {}));
    }

    beforeEach(function() {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
        JXG.JSXGraph.freeBoard(board);
    });

    describe("board role", function() {
        it("defaults to region", function() {
            init();
            expect(container.getAttribute('role')).toBe('region');
        });

        it("can be set to application", function() {
            init({ role: 'application' });
            expect(container.getAttribute('role')).toBe('application');
        });

        it("sets aria-label from title", function() {
            init({ title: 'My board' });
            expect(container.getAttribute('aria-label')).toBe('My board');
        });
    });

    describe("element aria attributes", function() {
        it("writes aria-label to the render node", function() {
            init();
            var p = board.create('point', [0, 0], { aria: { enabled: true, label: 'Point A' } });
            expect(p.rendNode.getAttribute('aria-label')).toBe('Point A');
        });

        it("evaluates function labels and updates them", function() {
            init();
            var p = board.create('point', [1, 2], {
                aria: { enabled: true, label: function(el) { return 'x=' + el.X(); } }
            });
            expect(p.rendNode.getAttribute('aria-label')).toBe('x=1');
            p.setPosition(JXG.COORDS_BY_USER, [3, 2]);
            board.update();
            expect(p.rendNode.getAttribute('aria-label')).toBe('x=3');
        });

        it("writes aria-live to the element without announcer", function() {
            init();
            var p = board.create('point', [0, 0], { aria: { enabled: true, label: 'A', live: 'polite' } });
            expect(p.rendNode.getAttribute('aria-live')).toBe('polite');
        });

        it("does not write aria-live to the element with announcer", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            var p = board.create('point', [0, 0], { aria: { enabled: true, label: 'A', live: 'polite' } });
            expect(p.rendNode.hasAttribute('aria-live')).toBeFalse();
            expect(p.rendNode.hasAttribute('aria-announce')).toBeFalse();
            expect(p.rendNode.getAttribute('aria-label')).toBe('A');
        });

        it("tolerates label functions that fail during construction", function() {
            init();
            expect(function() {
                board.create('slider', [[-3, -3], [3, -3], [0, 1, 2]], {
                    aria: { enabled: true, label: function(el) { return 'v=' + el.Value(); } }
                });
            }).not.toThrow();
        });
    });

    describe("announcer", function() {
        it("is disabled by default and creates no live region", function() {
            init();
            board.announce('a', 'hello');
            jasmine.clock().tick(1000);
            expect(regions().length).toBe(0);
        });

        it("creates polite and assertive regions with the proper roles", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            board.announce('a', 'polite msg');
            board.announce('b', 'assertive msg', 'assertive');
            jasmine.clock().tick(100);

            var pol = container.querySelector('[aria-live="polite"]'),
                ass = container.querySelector('[aria-live="assertive"]');
            expect(pol.getAttribute('role')).toBe('status');
            expect(ass.getAttribute('role')).toBe('alert');
            expect(pol.getAttribute('aria-atomic')).toBe('true');
            expect(pol.textContent).toBe('polite msg');
            expect(ass.textContent).toBe('assertive msg');
        });

        it("waits for the delay before speaking", function() {
            init({ announcer: { enabled: true, delay: 300 } });
            board.announce('a', 'hello');
            jasmine.clock().tick(299);
            expect(regionText('polite')).toBeNull();
            jasmine.clock().tick(1);
            expect(regionText('polite')).toBe('hello');
        });

        it("restarts the delay on every new message", function() {
            init({ announcer: { enabled: true, delay: 300 } });
            board.announce('a', 'one');
            jasmine.clock().tick(200);
            board.announce('b', 'two');
            jasmine.clock().tick(200);
            expect(regionText('polite')).toBeNull();
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('one. two');
        });

        it("replaces pending message with same key and keeps first-queued order", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            board.announce('a', 'first');
            board.announce('b', 'second');
            board.announce('a', 'first updated');
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('first updated. second');
        });

        it("ignores empty messages", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            board.announce('a', '');
            board.announce('a', null);
            jasmine.clock().tick(100);
            expect(regions().length).toBe(0);
        });

        it("announces identical messages again", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            board.announce('a', 'same');
            jasmine.clock().tick(100);
            var node = container.querySelector('[aria-live="polite"]').firstChild;
            board.announce('a', 'same');
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('same');
            expect(container.querySelector('[aria-live="polite"]').firstChild).not.toBe(node);
        });

        it("reuses the region", function() {
            init({ announcer: { enabled: true, delay: 100 } });
            board.announce('a', 'one');
            jasmine.clock().tick(100);
            board.announce('a', 'two');
            jasmine.clock().tick(100);
            expect(container.querySelectorAll('[aria-live="polite"]').length).toBe(1);
        });
    });

    describe("announcing element changes", function() {
        function make(extra) {
            return board.create('point', [0, 0], JXG.merge({
                aria: {
                    enabled: true,
                    label: function(el) { return 'x=' + el.X(); },
                    live: 'polite'
                }
            }, extra || {}));
        }

        function move(p, x) {
            p.setPosition(JXG.COORDS_BY_USER, [x, 0]);
            board.update();
        }

        beforeEach(function() {
            init({ announcer: { enabled: true, delay: 100 } });
        });

        it("does not announce the initial value", function() {
            make();
            jasmine.clock().tick(1000);
            expect(regionText('polite')).toBeNull();
        });

        it("announces changed label", function() {
            var p = make();
            move(p, 2);
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('x=2');
        });

        it("does not announce an unchanged label", function() {
            var p = make();
            move(p, 2);
            jasmine.clock().tick(100);
            container.querySelector('[aria-live="polite"]').innerHTML = '';
            board.update();
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('');
        });

        it("only speaks the last value of a rapid series", function() {
            var p = make();
            move(p, 1);
            move(p, 2);
            move(p, 3);
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('x=3');
        });

        it("uses aria.announce instead of label", function() {
            var p = make({ aria: { announce: function(el) { return 'moved to ' + el.X(); } } });
            move(p, 4);
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('moved to 4');
        });

        it("uses assertive politeness", function() {
            var p = make({ aria: { live: 'assertive' } });
            move(p, 2);
            jasmine.clock().tick(100);
            expect(regionText('assertive')).toBe('x=2');
            expect(regionText('polite')).toBeNull();
        });

        it("is silent with live 'none'", function() {
            var p = make({ aria: { live: 'none' } });
            move(p, 2);
            jasmine.clock().tick(100);
            expect(regions().length).toBe(0);
        });

        it("does not announce the focused element", function() {
            var p = make();
            p.rendNode.setAttribute('tabindex', '0');
            p.rendNode.focus();
            if (document.activeElement !== p.rendNode) {
                pending('focus not available in this environment');
            }
            move(p, 2);
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBeNull();
            expect(p.rendNode.getAttribute('aria-label')).toBe('x=2');
        });

        it("announces text elements' own content when changed", function() {
            var t = board.create('text', [0, 0, 'hello'], { aria: { enabled: true, live: 'polite' } });
            t.setText('<b>bye</b>   now');
            board.update();
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('bye now');
        });

        it("merges changes of several elements into one message in update order", function() {
            var p = make(),
                q = board.create('point', [function() { return p.X(); }, 1], {
                    aria: {
                        enabled: true,
                        label: function(el) { return 'q=' + el.X(); },
                        live: 'polite'
                    }
                });
            move(p, 2);
            jasmine.clock().tick(100);
            expect(regionText('polite')).toBe('x=2. q=2');
        });
    });

    describe("keyboard steps", function() {
        beforeEach(function() {
            // 1 user unit = 50px
            init();
        });

        it("moves points by keyboard.dx/dy (pixels) by default", function() {
            var p = board.create('point', [0, 0]);
            key(p, 39);
            expect(p.X()).toBeCloseTo(20 / 50, 12);
            key(p, 38);
            expect(p.Y()).toBeCloseTo(20 / 50, 12);
        });

        it("uses keyboardStepX / keyboardStepY in user units", function() {
            var p = board.create('point', [0, 0], { keyboardStepX: 0.5, keyboardStepY: 0.25 });
            key(p, 39);
            expect(p.X()).toBeCloseTo(0.5, 12);
            key(p, 37);
            key(p, 37);
            expect(p.X()).toBeCloseTo(-0.5, 12);
            key(p, 38);
            expect(p.Y()).toBeCloseTo(0.25, 12);
            key(p, 40);
            key(p, 40);
            expect(p.Y()).toBeCloseTo(-0.25, 12);
        });

        it("snapToGrid has priority over keyboardStepX", function() {
            var p = board.create('point', [0, 0], {
                keyboardStepX: 0.1, snapToGrid: true, snapSizeX: 1, snapSizeY: 1
            });
            key(p, 39);
            expect(p.X()).toBeCloseTo(1, 12);
        });

        it("moves sliders by keyboardStep in value units", function() {
            var s = board.create('slider', [[-3, -3], [3, -3], [0, 0, 10]], { keyboardStep: 2 });
            key(s, 39);
            expect(s.Value()).toBeCloseTo(2, 10);
            key(s, 38);
            expect(s.Value()).toBeCloseTo(4, 10);
            key(s, 37);
            key(s, 40);
            expect(s.Value()).toBeCloseTo(0, 10);
        });

        it("moves sliders by snapWidth if keyboardStep is not set", function() {
            var s = board.create('slider', [[-3, -3], [3, -3], [0, 0, 10]], { snapWidth: 1 });
            key(s, 39);
            expect(s.Value()).toBeCloseTo(1, 10);
        });

        it("keeps slider values inside the range", function() {
            var s = board.create('slider', [[-3, -3], [3, -3], [0, 9, 10]], { keyboardStep: 5 });
            key(s, 39);
            expect(s.Value()).toBeCloseTo(10, 10);
            key(s, 37);
            key(s, 37);
            key(s, 37);
            expect(s.Value()).toBeCloseTo(0, 10);
        });

        it("moves gliders on a segment by keyboardStep in parameter units", function() {
            var a = board.create('point', [-2, 0], { fixed: true }),
                b = board.create('point', [2, 0], { fixed: true }),
                l = board.create('segment', [a, b]),
                g = board.create('glider', [-2, 0, l], { keyboardStep: 0.25 });
            key(g, 39);
            expect(g.position).toBeCloseTo(0.25, 10);
            expect(g.X()).toBeCloseTo(-1, 8);
            key(g, 38);
            expect(g.position).toBeCloseTo(0.5, 10);
            key(g, 40);
            key(g, 37);
            key(g, 37);
            expect(g.position).toBeCloseTo(0, 10);   // clamped at start of segment
        });

        it("clamps gliders at the end of a segment", function() {
            var a = board.create('point', [-2, 0], { fixed: true }),
                b = board.create('point', [2, 0], { fixed: true }),
                l = board.create('segment', [a, b]),
                g = board.create('glider', [1.9, 0, l], { keyboardStep: 0.5 });
            key(g, 39);
            expect(g.position).toBeCloseTo(1, 10);
        });

        it("moves gliders on a function graph with default step of 1/100 of the range", function() {
            var f = board.create('functiongraph', [function(x) { return x; }, -2, 2]),
                g = board.create('glider', [0, 0, f]),
                x0 = g.position;
            key(g, 39);
            expect(g.position - x0).toBeCloseTo(0.04, 8);
        });

        it("moves gliders on a circle by keyboardStep", function() {
            var c = board.create('circle', [[0, 0], 2]),
                g = board.create('glider', [2, 0, c], { keyboardStep: 0.25 });
            key(g, 39);
            expect(g.X()).toBeCloseTo(0, 6);
            expect(Math.abs(g.Y())).toBeCloseTo(2, 6);
        });

        it("does not move fixed elements", function() {
            var p = board.create('point', [0, 0], { fixed: true, keyboardStepX: 1 });
            key(p, 39);
            expect(p.X()).toBe(0);
        });
    });
});
