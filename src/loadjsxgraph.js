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


/*global JXG: true, document: true*/
/*jslint nomen: true, plusplus: true, regexp: true*/

/* depends:
 */

/**
 * JSXGraph namespace. Holds all classes, objects, functions and variables belonging to JSXGraph
 * to reduce the risc of interfering with other JavaScript code.
 * @namespace
 */
var JXG = {};

(function () {

    "use strict";

    var i, s, n, arr;

    // Minified mode?
    JXG.useMinify = false;

    JXG.countDrawings = 0;
    JXG.countTime = 0;
    JXG.require = function (libraryName) {
        document.write('<script type="text/javascript" src="' + libraryName + '"><\/script>');
    };

    if (!JXG.useMinify) {
        JXG.baseFiles = 'jxg,base/constants,utils/object,utils/string,utils/number,utils/type,utils/env,utils/array,utils/event,math/math,math/numerics,math/statistics,math/symbolic,math/geometry,math/poly,math/complex,renderer/abstract,renderer/no,reader/file,parser/geonext,base/board,options,jsxgraph,base/element,base/coords,base/point,base/line,base/group,base/circle,element/conic,base/polygon,base/curve,element/arc,element/sector,base/composition,element/composition,base/text,base/image,element/slider,element/measure,base/chart,base/transformation,base/turtle,utils/color,base/ticks,utils/zip,utils/base64,utils/uuid,utils/encoding,server/server,parser/datasource,parser/jessiecode,utils/dump';
    } else {
        JXG.baseFiles = 'jxg';
    }
    JXG.rendererFiles = {};

    if (JXG.useMinify) {
        JXG.rendererFiles.svg = 'SVGRendererMinify';
        JXG.rendererFiles.vml = 'VMLRendererMinify';
    } else {
        JXG.rendererFiles.svg = 'renderer/svg';
        JXG.rendererFiles.vml = 'renderer/vml';
    }

    JXG.rendererFiles.canvas = 'renderer/canvas';
    JXG.requirePath = '';

    for (i = 0; i < document.getElementsByTagName("script").length; i++) {
        s = document.getElementsByTagName("script")[i];
        if (s.src && s.src.match(/loadjsxgraph\.js(\?.*)?$/)) {
            JXG.requirePath = s.src.replace(/loadjsxgraph\.js(\?.*)?$/, '');
            arr = JXG.baseFiles.split(',');
            for (n = 0; n < arr.length; n++) {
                JXG.require(JXG.requirePath + arr[n] + '.js');
            }
        }
    }

    JXG.baseFiles = null;
    JXG.serverBase = JXG.requirePath + 'server/';
}());
