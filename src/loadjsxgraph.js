/*
    Copyright 2008-2018
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
 * to reduce the risk of interfering with other JavaScript code.
 * @namespace
 */
var JXG = {},
    define;

(function () {

    "use strict";

    // check and table are initialized at the end of the iife
    var i, s, n, arr, table,
        waitlist = [],
        checkwaitlist = true,
        checkJXG = function () {
            return JXG;
        },
        makeCheck = function (s) {
            var a = s.split('.');

            return function () {
                var i, r = JXG;

                if (!r) {
                    return r;
                }

                for (i = 0; i < a.length; i++) {
                    r = r[a[i]];
                    if (!r) {
                        break;
                    }
                }

                return r;
            };
        };

    define = function (deps, factory) {
        var i, oldlength, undef,
            resDeps = [],
            inc = true;

        if (deps === undef) {
            deps = [];
        }

        window.wait = waitlist;

        if (factory === undef) {
            factory = function () {};
        }

        for (i = 0; i < deps.length; i++) {
            resDeps.push(table[deps[i]]());
            if (!resDeps[i]) {
                inc = false;
                break;
            }
        }

        if (inc) {
            factory.apply(this, resDeps);
        } else if (checkwaitlist) {
            waitlist.push([deps, factory]);
        }

        if (checkwaitlist) {
            // don't go through the waitlist while we're going through the waitlist
            checkwaitlist = false;
            oldlength = 0;

            // go through the waitlist until no more modules can be loaded
            while (oldlength !== waitlist.length) {
                oldlength = waitlist.length;

                // go through the waitlist, look if another module can be initialized
                for (i = 0; i < waitlist.length; i++) {
                    if (define.apply(this, waitlist[i])) {
                        waitlist.splice(i, 1);
                    }
                }
            }

            checkwaitlist = true;
        }

        return inc;
    };

    JXG.isMetroApp = function () {
        return typeof window === 'object' && window.clientInformation && window.clientInformation.appVersion && window.clientInformation.appVersion.indexOf('MSAppHost') > -1;
    };

    JXG.require = function (libraryName) {
       if (JXG.isMetroApp()) { // avoid inline code manipulation in Windows apps -- isMetroApp can't be used it is not yet available at this point
            var scriptElement = document.createElement("script");
            var typeAttribute = document.createAttribute("type");
            typeAttribute.nodeValue = "text/javascript";
            var srcAttribute = document.createAttribute("src");
            srcAttribute.nodeValue = libraryName;
            scriptElement.setAttributeNode(typeAttribute);
            scriptElement.setAttributeNode(srcAttribute);
            var headElement = document.getElementsByTagName("head")[0];
            headElement.appendChild(scriptElement);
        } else {
            document.write('<script type="text/javascript" src="' + libraryName + '"><\/script>');
        }
    };

    JXG.baseFiles = 'jxg,base/constants,utils/type,utils/xml,utils/env,utils/event,utils/expect,math/math,math/numerics,math/statistics,math/symbolic,math/geometry,math/poly,math/complex,renderer/abstract,renderer/no,reader/file,parser/geonext,base/board,options,jsxgraph,base/element,base/coordselement,base/coords,base/point,base/line,base/group,base/circle,element/conic,base/polygon,base/curve,element/arc,element/sector,base/composition,element/composition,base/text,base/image,element/slider,element/measure,base/chart,base/transformation,base/turtle,utils/color,base/ticks,utils/zip,utils/base64,utils/uuid,utils/encoding,server/server,element/locus,parser/datasource,parser/ca,parser/jessiecode,utils/dump,renderer/svg,renderer/vml,renderer/canvas,renderer/no,element/comb,element/slopetriangle,math/qdt,element/checkbox,element/input,element/button';
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

    // This is a table with functions which check the availability
    // of certain namespaces, functions and classes. With this structure
    // we are able to get a rough check if a specific dependency is available.
    table = {
        'jsxgraph': checkJXG,
        'jxg': checkJXG,
        'options': makeCheck('Options'),

        'base/board': makeCheck('Board'),
        'base/chart': checkJXG,
        'base/circle': checkJXG,
        'base/composition': makeCheck('Composition'),
        'base/constants': checkJXG,
        'base/coords': makeCheck('Coords'),
        'base/coordselement': makeCheck('CoordsElement'),
        'base/curve': checkJXG,
        'base/element': makeCheck('GeometryElement'),
        'base/group': checkJXG,
        'base/image': checkJXG,
        'base/line': checkJXG,
        'base/point': checkJXG,
        'base/polygon': checkJXG,
        'base/text': checkJXG,
        'base/ticks': checkJXG,
        'base/transformation': checkJXG,
        'base/turtle': checkJXG,

        'element/arc': checkJXG,
        'element/centroid': checkJXG,
        'element/composition': checkJXG,
        'element/conic': checkJXG,
        'element/locus': checkJXG,
        'element/measure': checkJXG,
        'element/sector': checkJXG,
        'element/slider': checkJXG,
        'element/square': checkJXG,
        'element/triangle': checkJXG,
        'element/checkbox': checkJXG,
        'element/input': checkJXG,
        'element/button': checkJXG,

        'math/bst': makeCheck('Math.BST'),
        'math/qdt': makeCheck('Math.Quadtree'),
        'math/complex': makeCheck('Complex'),
        'math/geometry': makeCheck('Math.Geometry'),
        'math/math': makeCheck('Math'),
        'math/numerics': makeCheck('Math.Numerics'),
        'math/poly': makeCheck('Math.Poly'),
        'math/statistics': makeCheck('Math.Statistics'),
        'math/symbolic': makeCheck('Math.Symbolic'),

        'parser/datasource': makeCheck('DataSource'),
        'parser/geonext': makeCheck('GeonextParser'),
        'parser/ca': makeCheck('CA'),
        'parser/jessiecode': makeCheck('JessieCode'),

        'reader/cinderella': makeCheck('CinderellaReader'),
        'reader/file': makeCheck('FileReader'),
        'reader/geogebra': makeCheck('GeogebraReader'),
        'reader/geonext': makeCheck('GeonextReader'),
        'reader/graph': makeCheck('GraphReader'),
        'reader/intergeo': makeCheck('IntergeoReader'),
        'reader/sketch': makeCheck('SketchReader'),
        'reader/tracenpoche': makeCheck('TracenpocheReader'),

        'renderer/abstract': makeCheck('AbstractRenderer'),
        'renderer/canvas': makeCheck('CanvasRenderer'),
        'renderer/no': makeCheck('NoRenderer'),
        'renderer/svg': makeCheck('SVGRenderer'),
        'renderer/vml': makeCheck('VMLRenderer'),

        'server/server': makeCheck('Server'),

        'utils/base64': makeCheck('Util.Base64'),
        'utils/color': checkJXG,
        'utils/dump': makeCheck('Dump'),
        'utils/encoding': makeCheck('Util.UTF8'),
        'utils/env': checkJXG,
        'utils/event': makeCheck('EventEmitter'),
        'utils/expect': makeCheck('Expect'),
        'utils/type': checkJXG,
        'utils/uuid': makeCheck('Util'),
        'utils/xml': makeCheck('XML'),
        'utils/zip': makeCheck('Util')
    };
}());
