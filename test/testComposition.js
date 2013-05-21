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


/*
 *  Js-Test-Driver Test Suite for JXG.Composition
 */

TestCase("Composition", {

    setUp: function () {
        this.element = {
            id: 'elid',
            setAttribute: sinon.stub(),
            prepareUpdate: sinon.stub(),
            update: sinon.stub(),
            updateRenderer: sinon.stub(),
            highlight: sinon.stub(),
            noHighlight: sinon.stub(),
            on: sinon.stub()
        };
    },

    tearDown: function () {
    },

    testConstructor: function () {
        expectAsserts(5);

        var c = new JXG.Composition({
                element: this.element
            }),
            d = new JXG.Composition();

        assertObject('construct empty composition', c);
        assertObject('construct empty composition', c.element);
        assertEquals('composition invoke update', 'elid', c.element.id);
        assertObject('construct empty composition', d);
        assertNotUndefined('construct empty composition part 2', d.elements);
    },

    testAdd: function () {
        expectAsserts(6);

        var c = new JXG.Composition({});

        assertTrue(c.add('el', this.element));

        assertObject('composition add check type', c.el);
        assertEquals('composition add check type', c.elements.elid, c.el);
        assertEquals('composition add check id', 'elid', c.el.id);

        assertFalse(c.add('update', null));

        assertFunction('composition do not overwrite existing properties', c.update);
    },

    testRemove: function () {
        expectAsserts(4);

        var c = new JXG.Composition({
            element: this.element
        });

        assertTrue(c.remove('element'));
        assertUndefined('composition remove check deletion', c.element);

        assertFalse(c.remove('update'));
        assertFunction('composition do not remove methods', c.update);
    },

    testUpdate: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.update();
        assertTrue(c.element.update.calledOnce);
    },

    testSetAttribute: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.setAttribute();
        assertTrue(c.element.setAttribute.calledOnce);
    },

    testHighlight: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.highlight();
        assertTrue(c.element.highlight.calledOnce);
    },

    testPrepareUpdate: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.prepareUpdate();
        assertTrue(c.element.prepareUpdate.calledOnce);
    },

    testUpdateRenderer: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.updateRenderer();
        assertTrue(c.element.updateRenderer.calledOnce);
    },

    testNoHighlight: function () {
        expectAsserts(1);

        var c = new JXG.Composition({
            element: this.element
        });

        c.noHighlight();
        assertTrue(c.element.noHighlight.calledOnce);
    }

});
