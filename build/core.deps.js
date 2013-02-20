/*global define: true*/
define([
    'jxg',
    'utils/env',
    'base/constants',
    'utils/type',
    'utils/xml',
    'utils/event',
    'math/math',
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
    'renderer/no'
], function (JXG, Env) {
    "use strict";

    if (Env.isBrowser) {
        window.JXG = JXG;
    } else if (Env.isNode()) {
        module.exports = JXG;
    }

    return JXG;
});