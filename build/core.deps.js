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
    'math/qdt',
    'math/numerics',
    'math/statistics',
    'math/symbolic',
    'math/geometry',
    'math/poly',
    'math/complex',
    'renderer/abstract',
    'renderer/no',
    'reader/file',
    'parser/geonext',
    'base/board',
    'options',
    'jsxgraph',
    'base/element',
    'base/coords',
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
    'utils/dump',
    'renderer/svg',
    'renderer/vml',
    'renderer/canvas',
    'renderer/no',
    'element/slopetriangle',
    'element/checkbox',
    'element/input',
    'element/button'
], function (JXG, Env) {
    "use strict";

    // we're in the browser, export JXG to the global JXG symbol for backwards compatiblity
    if (Env.isBrowser) {
        window.JXG = JXG;

    // in node there are two cases:
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
