/*
    Copyright 2008-2010,
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.

*/

/**
 * JSXGraph namespace. Holds all classes, objects, functions and variables belonging to JSXGraph
 * to reduce the risc of interfering with other JavaScript code.
 * @namespace
 */
var JXG = {};

(function(){ // Hide the initialization in an anonymous function
    var i, s, n, arr;

    // Minified-Modus: ja, nein
    JXG.useMinify = false;

    JXG.countDrawings = 0;
    JXG.countTime = 0;
    JXG.require = function(libraryName) {
        document.write('<script type="text/javascript" src="' + libraryName + '"><\/script>');
    };
/*IntergeoReader,*/
    if (!JXG.useMinify) {
        JXG.baseFiles ='Math,MathNumerics,MathStatistics,MathSymbolic,Complex,AbstractRenderer,FileReader,IntergeoReader,GeonextReader,Board,Options,jsxgraph,GeometryElement,Coords,Point,Line,Group,Circle,Polygon,Curve,Arc,Sector,Angle,Algebra,Intersection,Composition,Text,Image,Slider,Chart,Transformation,Turtle,RGBColor,Wrappers,Ticks,Util,Pstricks,Server,DataSource';
    } else {
        JXG.baseFiles = 'jxg';
    }
    JXG.rendererFiles = [];
    if (JXG.useMinify) {
        JXG.rendererFiles['svg'] = 'SVGRendererMinify';
    } else {
        JXG.rendererFiles['svg'] = 'SVGRenderer';
    }
    if (JXG.useMinify) {
        JXG.rendererFiles['vml'] = 'VMLRendererMinify';
    } else {
        JXG.rendererFiles['vml'] = 'VMLRenderer';
    }
    //JXG.rendererFiles['silverlight'] = 'Silverlight,createSilverlight,SilverlightRenderer';
    JXG.requirePath = '';

    for (i=0;i<document.getElementsByTagName("script").length;i++) {
        s = document.getElementsByTagName("script")[i];
        if (s.src && s.src.match(/loadjsxgraph\.js(\?.*)?$/)) {
            JXG.requirePath = s.src.replace(/loadjsxgraph\.js(\?.*)?$/,'');
            arr = JXG.baseFiles.split(',');
            for (n=0;n<arr.length;n++) {
                (function(include) { JXG.require(JXG.requirePath+include+'.js');})(arr[n]);
            }
        }
    }

    JXG.baseFiles = null;
    JXG.serverBase = JXG.requirePath + 'server/';
})();
