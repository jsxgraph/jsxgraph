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
 *  Js-Test-Driver Test Suite for JXG.Math
 */

TestCase("GeonextParser", {

    setUp: function () {
    },

    tearDown: function () {
    },

    testGeonext2JS: function () {
        expectAsserts(5);

        var ob = {
                    Val: function(){ return 2.0;}
            };

        assertEquals("JXG.GeonextParser.geonext2JS, incorrect result", 'pow(x,2)', JXG.GeonextParser.geonext2JS('x^2',null));
        assertEquals("JXG.GeonextParser.geonext2JS, incorrect result", 'sin(x)', JXG.GeonextParser.geonext2JS('sin(x)',null));
        assertEquals("JXG.GeonextParser.geonext2JS, incorrect result", 'asin(x)', JXG.GeonextParser.geonext2JS('asin(x)',null));
        assertEquals("JXG.GeonextParser.geonext2JS, incorrect result", 'sin(pow(x,2))', JXG.GeonextParser.geonext2JS('sin(x^2)',null));
        assertEquals("JXG.GeonextParser.geonext2JS, incorrect result", 'pow(ob.Val(),x)', JXG.GeonextParser.geonext2JS('ob.Val()^x',null));
    }

});