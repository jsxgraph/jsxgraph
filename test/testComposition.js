/*
    Copyright 2008-2013
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

describe("Test JXg.Composition", function() {
    var board;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
    board = JXG.JSXGraph.initBoard('jxgbox', {
        renderer: 'svg',
        axis: false,
        grid: false,
        boundingbox: [-5, 5, 5, -5],
        showCopyright: false,
        showNavigation: false
    });

    it("constructor", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({
                    element: p
                }),
            d = new JXG.Composition();

        expect(c).toBeInstanceOf(Object);
        expect(c.element).toBeInstanceOf(Object);
        expect(c.element.id).toEqual('elId');
        expect(d).toBeInstanceOf(Object);
        expect(d.elements).not.toBeNull();
    });

    it("Add", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({});
        expect(c.add('el', p)).toBeTrue();
        expect(c.el).toBeInstanceOf(JXG.Point);
        expect(c.el).toEqual(c.elements.elId);
        expect(c.add('update', null)).toBeFalse();

        // Composition do not overwrite existing properties
        expect(c.update).toBeInstanceOf(Function);
    });

    it("Remove", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});

        expect(c.remove('element')).toBeTrue();
        expect(c.element).toBeUndefined();
        expect(c.remove('update')).toBeFalse();
        expect(c.update).toBeInstanceOf(Function);
    });

    it("Update", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.update = function() {
            this.calledOnce = true;
        }
        c.update();
        expect(c.element.calledOnce).toBeTrue();
    });

    it("setAttribute", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.setAttribute = function() {
            this.calledOnce = true;
        }
        c.setAttribute();
        expect(c.element.calledOnce).toBeTrue();
    });

    it("highlight", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.highlight = function() {
            this.calledOnce = true;
        }
        c.highlight();
        expect(c.element.calledOnce).toBeTrue();
    });

    it("nohighlight", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.noHighlight = function() {
            this.calledOnce = true;
        }
        c.noHighlight();
        expect(c.element.calledOnce).toBeTrue();
    });

    it("prepareUpdate", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.prepareUpdate = function() {
            this.calledOnce = true;
        }
        c.prepareUpdate();
        expect(c.element.calledOnce).toBeTrue();
    });

    it("updateRenderer", function() {
        var p = board.create('point', [0, 0], {id: 'elId'}),
            c = new JXG.Composition({element: p});
        c.element.updateRenderer = function() {
            this.calledOnce = true;
        }
        c.updateRenderer();
        expect(c.element.calledOnce).toBeTrue();
    });
});
