/* eslint-disable one-var */
import JXG from "./jxg.js";
import Env from "./utils/env.js"; // Needed below

export * from "./jxg";
export * from "./utils/env"; // Needed below
export * from "./base/constants";
export * from "./utils/type";
export * from "./utils/xml";
export * from "./utils/event";
export * from "./utils/expect";
export * from "./math/math";
export * from "./math/probfuncs";
export * from "./math/ia";
export * from "./math/extrapolate";
export * from "./math/qdt";
export * from "./math/numerics";
export * from "./math/nlp";
export * from "./math/plot";
export * from "./math/metapost";
export * from "./math/statistics";
export * from "./math/symbolic";
export * from "./math/geometry";
export * from "./math/clip";
export * from "./math/poly";
export * from "./math/complex";
export * from "./renderer/abstract";
export * from "./reader/file";
export * from "./parser/geonext";
export * from "./base/board";
export * from "./options";
export * from "./jsxgraph";
export * from "./base/element";
export * from "./base/coords";
export * from "./base/coordselement";
export * from "./base/point";
export * from "./base/line";
export * from "./base/group";
export * from "./base/circle";
export * from "./element/conic";
export * from "./base/polygon";
//export { default as Curve } from "./base/curve";
export * from "./base/curve";
export * from "./element/arc";
export * from "./element/sector";
export * from "./base/composition";
export * from "./element/composition";
export * from "./element/locus";
export * from "./base/text";
export * from "./base/image";
export * from "./element/slider";
export * from "./element/measure";
export * from "./base/chart";
export * from "./base/transformation";
export * from "./base/turtle";
export * from "./utils/color";
export * from "./base/ticks";
export * from "./utils/zip";
export * from "./utils/base64";
export * from "./utils/uuid";
export * from "./utils/encoding";
export * from "./server/server";
export * from "./parser/datasource";
export * from "./parser/jessiecode";
export * from "./parser/ca";
export * from "./utils/dump";
export * from "./renderer/svg";
export * from "./renderer/vml";
export * from "./renderer/canvas";
export * from "./renderer/no";
export * from "./element/comb";
export * from "./element/slopetriangle";
export * from "./element/checkbox";
export * from "./element/input";
export * from "./element/button";
export * from "./base/foreignobject";
export * from "./options3d";
export * from "./3d/view3d";
export * from "./3d/element3d";
export * from "./3d/box3d";
export * from "./3d/point3d";
export * from "./3d/curve3d";
export * from "./3d/linspace3d";
import * from "./3d/polygon3d.js";
export * from "./3d/sphere3d";
export * from "./3d/surface3d";

// We're in the browser, export JXG to the global JXG symbol for backwards compatibility
if (Env.isBrowser) {
    window.JXG = JXG;

    // In node there are two cases:
    // 1) jsxgraph is used without requirejs (e.g. as jsxgraphcore.js)
    // 2) jsxgraph is loaded using requirejs (e.g. the dev version)
    //
    // Nodejs compatibility is handled by webpack
    // OLD: in case 2) module is undefined, the export is set in src/jsxgraphnode.js using
    // the return value of this factory function
    // } else if (Env.isNode() && typeof module === "object") {
    //     module.exports = JXG;
} else if (Env.isWebWorker()) {
    self.JXG = JXG;
}

export default JXG;
