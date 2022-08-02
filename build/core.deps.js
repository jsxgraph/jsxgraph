/*global define: true*/
define([
    'jxg',
    'utils/env',
    'base/constants',
    'utils/type',
    'utils/xml',
    'utils/event',
    'utils/expect',
    'math/math',
    'math/probfuncs',
    'math/ia',
    'math/extrapolate',
    'math/qdt',
    'math/numerics',
    'math/nlp',
    'math/plot',
    'math/metapost',
    'math/statistics',
    'math/symbolic',
    'math/geometry',
    'math/clip',
    'math/poly',
    'math/complex',
    'renderer/abstract',
    'reader/file',
    'parser/geonext',
    'base/board',
    'options',
    'jsxgraph',
    'base/element',
    'base/coords',
    'base/coordselement',
    'base/point',
    'base/line',
    'base/group',
    'base/circle',
    'element/conic',
    'base/polygon',
    'base/curve',
    'element/arc',
    'element/sector',
    'base/composition',
    'element/composition',
    'element/locus',
    'base/text',
    'base/image',
    'element/slider',
    'element/measure',
    'base/chart',
    'base/transformation',
    'base/turtle',
    'utils/color',
    'base/ticks',
    'utils/zip',
    'utils/base64',
    'utils/uuid',
    'utils/encoding',
    'server/server',
    'parser/datasource',
    'parser/jessiecode',
    'parser/ca',
    'utils/dump',
    'renderer/svg',
    'renderer/vml',
    'renderer/canvas',
    'renderer/no',
    'element/comb',
    'element/slopetriangle',
    'element/checkbox',
    'element/input',
    'element/button',
    'base/foreignobject',
    'options3d',
    '3d/view3d',
    '3d/element3d',
    '3d/box3d',
    '3d/point3d',
    '3d/curve3d',
    '3d/linspace3d',
    '3d/surface3d'
], function (JXG, Env) {
    "use strict";

    // We're in the browser, export JXG to the global JXG symbol for backwards compatibility
    if (Env.isBrowser) {
        window.JXG = JXG;

    // In node there are two cases:
    // 1) jsxgraph is used without requirejs (e.g. as jsxgraphcore.js)
    // 2) jsxgraph is loaded using requirejs (e.g. the dev version)
    //
    // in case 2) module is undefined, the export is set in src/jsxgraphnode.js using
    // the return value of this factory function
    } else if (Env.isNode() && typeof module === 'object') {
        module.exports = JXG;
    } else if (Env.isWebWorker()) {
        self.JXG = JXG;
    }

    return JXG;
});
