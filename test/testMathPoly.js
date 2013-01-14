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
 *  Js-Test-Driver Test Suite for JXG.Math.Poly
 *  http://code.google.com/p/js-test-driver
 */

TestCase("Math.Poly", {
    r: null,
    m: null,
    p: null,

    setUp: function () {
        this.r = new JXG.Math.Poly.Ring(['x', 'y', 'z']);
        this.m = new JXG.Math.Poly.Monomial(this.r, 4, [1, 2, 3]);
        this.p = new JXG.Math.Poly.Polynomial(this.r);
    },

    tearDown: function () {
        this.r = null;
        this.m = null;
        this.p = null;
    },

    testRing: function () {
        expectAsserts(2);

        assertTrue('ring has property vars', JXG.exists(this.r.vars));
        assertEquals('vars has length 3', 3, this.r.vars.length);
    }


});
