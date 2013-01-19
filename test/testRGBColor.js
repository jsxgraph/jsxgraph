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
 *  Js-Test-Driver Test Suite for color conversion functions
 *  http://code.google.com/p/js-test-driver
 */

TestCase("RGBColor", {
    setUp: function () {
    },

    tearDown: function () {
    },

    testRGBParser: function () {
        expectAsserts(9);

        assertEquals('string constants', 191, JXG.rgbParser('deepskyblue')[1]);
        assertEquals('rgb', 191, JXG.rgbParser('rgb(34, 191, 32)')[1]);
        assertEquals('rgba', 191, JXG.rgbParser('rgba(34, 191, 32, 0.5)')[1]);
        assertEquals('6 digits rgb', 0xab, JXG.rgbParser('#f0ab00')[1]);
        assertEquals('3 digits rgb', 153, JXG.rgbParser('#a93')[1]);

        assertEquals('array', [24, 153, 243], JXG.rgbParser([24, 153, 243]));
        assertEquals('three floats', [128, 204, 26], JXG.rgbParser(0.5, 0.8, 0.1));
        assertEquals('three ints', [24, 153, 243], JXG.rgbParser(24, 153, 243));

        assertEquals('float too high', [0.5, 0.3, 2.0], JXG.rgbParser(0.5, 0.3, 2.0));
    }
});