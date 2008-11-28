/*
    Copyright 2008, 
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
 @namespace Holds all JSXGraph objects, variables and functions.
*/
var JXG = {};

// Minified-Modus: ja, nein
JXG.useMinify = false;

JXG.countDrawings = 0;
JXG.countTime = 0;
JXG.require = function(libraryName) {
    document.write('<script type="text/javascript" src="' + libraryName + '"><\/script>');
}
JXG.baseFiles;

if (!JXG.useMinify) {
    JXG.baseFiles ='AbstractRenderer,FileReader,GeonextReader,IntergeoReader,jsxgraph,GeometryElement,Board,Coords,Point,Line,Group,Circle,Polygon,Curve,Arc,Sector,Angle,Label,Algebra,Intersection,Composition,Text,Image,Slider,Math,MathNumerics,MathStatistics,Chart,Base64,Gunzip,Transformation,Wrappers,Options';
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

$A(document.getElementsByTagName("script")).findAll( function(s) {
    return (s.src && s.src.match(/loadjsxgraph\.js(\?.*)?$/))
}).each( function(s) {
    JXG.requirePath = s.src.replace(/loadjsxgraph\.js(\?.*)?$/,'');
    JXG.baseFiles.split(',').each( function(include) { JXG.require(JXG.requirePath+include+'.js') } );
});

JXG.baseFiles = null;
