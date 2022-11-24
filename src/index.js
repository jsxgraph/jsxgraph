import JXG from "./jxg";
import Env from "./utils/env"; // Needed below
import "./base/constants";
import "./utils/type";
import "./utils/xml";
import "./utils/event";
import "./utils/expect";
import "./math/math";
import "./math/probfuncs";
import "./math/ia";
import "./math/extrapolate";
import "./math/qdt";
import "./math/numerics";
import "./math/nlp";
import "./math/plot";
import "./math/metapost";
import "./math/statistics";
import "./math/symbolic";
import "./math/geometry";
import "./math/clip";
import "./math/poly";
import "./math/complex";
import "./renderer/abstract";
import "./reader/file";
import "./parser/geonext";
import "./base/board";
import "./options";
import "./jsxgraph";
import "./base/element";
import "./base/coords";
import "./base/coordselement";
import "./base/point";
import "./base/line";
import "./base/group";
import "./base/circle";
import "./element/conic";
import "./base/polygon";
import "./base/curve";
import "./element/arc";
import "./element/sector";
import "./base/composition";
import "./element/composition";
import "./element/locus";
import "./base/text";
import "./base/image";
import "./element/slider";
import "./element/measure";
import "./base/chart";
import "./base/transformation";
import "./base/turtle";
import "./utils/color";
import "./base/ticks";
import "./utils/zip";
import "./utils/base64";
import "./utils/uuid";
import "./utils/encoding";
import "./server/server";
import "./parser/datasource";
import "./parser/jessiecode";
import "./parser/ca";
import "./utils/dump";
import "./renderer/svg";
import "./renderer/vml";
import "./renderer/canvas";
import "./renderer/no";
import "./element/comb";
import "./element/slopetriangle";
import "./element/checkbox";
import "./element/input";
import "./element/button";
import "./base/foreignobject";
import "./options3d";
import "./3d/view3d";
import "./3d/element3d";
import "./3d/box3d";
import "./3d/point3d";
import "./3d/curve3d";
import "./3d/linspace3d";
import "./3d/surface3d";

// We're in the browser, export JXG to the global JXG symbol for backwards compatibility
if (Env.isBrowser) {
    window.JXG = JXG;

    // In node there are two cases:
    // 1) jsxgraph is used without requirejs (e.g. as jsxgraphcore.js)
    // 2) jsxgraph is loaded using requirejs (e.g. the dev version)
    //
    // in case 2) module is undefined, the export is set in src/jsxgraphnode.js using
    // the return value of this factory function
} else if (Env.isNode() && typeof module === "object") {
    module.exports = JXG;
} else if (Env.isWebWorker()) {
    self.JXG = JXG;
}

export default JXG;


