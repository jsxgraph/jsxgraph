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


/**
 * JSXGraph namespace. Holds all classes, objects, functions and variables belonging to JSXGraph
 * to reduce the risc of interfering with other JavaScript code.
 * @namespace
 */
var JXG = {};

(function () {
    'use strict';

    var i, s;
    //JXG.useMinify = true;
    JXG.countDrawings = 0;
    JXG.countTime = 0;
    JXG.require = function (libraryName) {};
    JXG.rendererFiles = {
        svg: 'SVGRenderer',
        vml: 'VMLRenderer',
        canvas: 'CanvasRenderer'
    };
    JXG.baseFiles = null;
    // this maybe required by additional software/extensions and/or future renderers
    JXG.requirePath = '';

    if (typeof document === 'object' && document.getElementsByTagName) {
        for (i = 0; i < document.getElementsByTagName("script").length; i++) {
            s = document.getElementsByTagName("script")[i];

            if (s.src && s.src.match(/loadjsxgraphInOneFile\.js(\?.*)?$/)) {
                JXG.requirePath = s.src.replace(/loadjsxgraphInOneFile\.js(\?.*)?$/, '');
            }
        }
    }
    JXG.serverBase = JXG.requirePath + 'server/';

    if (typeof module === 'object') {
        module.exports = JXG;
    }

}());
