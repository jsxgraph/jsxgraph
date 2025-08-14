/* eslint-disable one-var */
import JXG from './jxg.js';
import Env from './utils/env.js'; // Needed below
import './base/constants.js';
import './utils/type.js';
import './utils/xml.js';
import './utils/event.js';
import './utils/expect.js';
import './math/math.js';
import './math/probfuncs.js';
import './math/ia.js';
import './math/extrapolate.js';
import './math/qdt.js';
import './math/bqdt.js';
import './math/numerics.js';
import './math/nlp.js';
import './math/plot.js';
import './math/implicitplot.js';
import './math/metapost.js';
import './math/statistics.js';
import './math/geometry.js';
import './math/clip.js';
import './math/poly.js';
import './math/complex.js';
import './renderer/abstract.js';
import './reader/file.js';
import './parser/geonext.js';
import './base/board.js';
import './options.js';
import './jsxgraph.js';
import './base/element.js';
import './base/coords.js';
import './base/coordselement.js';
import './base/point.js';
import './base/line.js';
import './base/group.js';
import './base/circle.js';
import './element/conic.js';
import './base/polygon.js';
import './base/curve.js';
import './element/arc.js';
import './element/sector.js';
import './base/composition.js';
import './element/composition.js';
import './element/grid.js';
import './base/text.js';
import './base/image.js';
import './element/slider.js';
import './element/measure.js';
import './base/chart.js';
import './base/transformation.js';
import './base/turtle.js';
import './utils/color.js';
import './base/ticks.js';
import './utils/zip.js';
import './utils/base64.js';
import './utils/uuid.js';
import './utils/encoding.js';
import './parser/datasource.js';
import './parser/jessiecode.js';
import './parser/prefix.js';
import './parser/ca.js';
import './utils/dump.js';
import './renderer/svg.js';
import './renderer/vml.js';
import './renderer/canvas.js';
import './renderer/no.js';
import './element/comb.js';
import './element/slopetriangle.js';
import './element/checkbox.js';
import './element/input.js';
import './element/button.js';
import './element/vectorfield.js';
import './element/smartlabel.js';
import './base/foreignobject.js';
import './options3d.js';
import './3d/view3d.js';
import './3d/element3d.js';
import './3d/box3d.js';
import './3d/circle3d.js';
import './3d/point3d.js';
import './3d/curve3d.js';
import './3d/linspace3d.js';
import './3d/text3d.js';
import './3d/ticks3d.js';
import './3d/polygon3d.js';
import './3d/face3d.js';
import './3d/polyhedron3d.js';
import './3d/sphere3d.js';
import './3d/surface3d.js';
import './parser/3dmodels.js';
import './themes/mono_thin.js';

// The following exports are used to restore granular objects.
// This is consistent with 1.4.x when a UMD bundle is used with a SystemJS loader.
// Over time, the granular object can be made first-class objects and the JXG object
// will only exist in a UMD bundle. This should improve tree-shaking.

// Values
export const COORDS_BY_SCREEN = JXG.COORDS_BY_SCREEN;
export const COORDS_BY_USER = JXG.COORDS_BY_USER;
export const Dump = JXG.Dump;
export const Expect = JXG.Expect;
export const JSXGraph = JXG.JSXGraph;
export const Mat = JXG.Math;
export const Options = JXG.Options;
export const boards = JXG.boards;
export const elements = JXG.elements;
export const palette = JXG.palette;
export const paletteWong = JXG.paletteWong;

// Classes
export const Board = JXG.Board;
export const Chart = JXG.Chart;
export const Circle = JXG.Circle;
export const Complex = JXG.Complex;
export const Composition = JXG.Composition;
export const Coords = JXG.Coords;
export const CoordsElement = JXG.CoordsElement;
export const Curve = JXG.Curve;
export const GeometryElement = JXG.GeometryElement;
export const Group = JXG.Group;
export const Image = JXG.Image;
export const JessieCode = JXG.JessieCode;
export const Prefix = JXG.PrefixParser;
export const Line = JXG.Line;
export const Point = JXG.Point;
export const Polygon = JXG.Polygon;
export const Text = JXG.Text;
export const Ticks = JXG.Ticks;
export const Transformation = JXG.Transformation;
export const Turtle = JXG.Turtle;
export const View3D = JXG.View3D;

// Functions
export const LMS2rgb = JXG.LMS2rgb;
export const addEvent = JXG.addEvent;
export const autoDigits = JXG.autoDigits;
export const autoHighlight = JXG.autoHighlight;
export const bind = JXG.bind;
export const capitalize = JXG.capitalize;
export const clearVisPropOld = JXG.clearVisPropOld;
export const clone = JXG.clone;
export const cloneAndCopy = JXG.cloneAndCopy;
export const cmpArrays = JXG.cmpArrays;
export const coordsArrayToMatrix = JXG.coordsArrayToMatrix;
export const copyAttributes = JXG.copyAttributes;
export const createEvalFunction = JXG.createEvalFunction;
export const createFunction = JXG.createFunction;
export const createHTMLSlider = JXG.createHTMLSlider;
export const darkenColor = JXG.darkenColor;
export const debug = JXG.debug;
export const debugInt = JXG.debugInt;
export const debugLine = JXG.debugLine;
export const debugWST = JXG.debugWST;
export const deepCopy = JXG.deepCopy
export const def = JXG.def;
export const deprecated = JXG.deprecated;
export const eliminateDuplicates = JXG.eliminateDuplicates;
export const escapeHTML = JXG.escapeHTML;
export const evalSlider = JXG.evalSlider;
export const evaluate = JXG.evaluate;
export const filterElements = JXG.filterElements;
export const getBoardByContainerId = JXG.getBoardByContainerId;
export const getCSSTransformMatrix = JXG.getCSSTransformMatrix;
export const getCSSTransform = JXG.getCSSTransform;
export const getDimensions = JXG.getDimensions;
export const getOffset = JXG.getOffset;
export const getPosition = JXG.getPosition;
export const getProp = JXG.getProp;
export const hex2rgb = JXG.hex2rgb;
export const hsv2rgb = JXG.hsv2rgb;
export const isAndroid = JXG.isAndroid;
export const isApple = JXG.isApple;
export const isArray = JXG.isArray;
export const isDesktop = JXG.isDesktop;
export const isInArray = JXG.isInArray;
export const isInObject = JXG.isInObject;
export const isMetroApp = JXG.isMetroApp;
export const isMobile = JXG.isMobile;
export const isMozilla = JXG.isMozilla;
export const isBoard = JXG.isBoard;
export const isName = JXG.isName;
export const isNode = JXG.isNode;
export const isNumber = JXG.isNumber;
export const isObject = JXG.isObject;
export const isPoint = JXG.isPoint;
export const isPoint3D = JXG.isPoint3D;
export const isPointType = JXG.isPointType;
export const isPointType3D = JXG.isPointType3D;
export const isString = JXG.isString;
export const isTouchDevice = JXG.isTouchDevice;
export const isTransformationOrArray = JXG.isTransformationOrArray;
export const isWebWorker = JXG.isWebWorker;
export const isWebkitAndroid = JXG.isWebkitAndroid;
export const isWebkitApple = JXG.isWebkitApple;
export const keys = JXG.keys;
export const lightenColor = JXG.lightenColor;
export const merge = JXG.merge;
export const normalizePointFace = JXG.normalizePointFace;
export const providePoints = JXG.providePoints;
export const registerElement = JXG.registerElement;
export const registerReader = JXG.registerReader;
export const removeAllEvents = JXG.removeAllEvents;
export const removeElementFromArray = JXG.removeElementFromArray;
export const removeEvent = JXG.removeEvent;
export const rgb2LMS = JXG.rgb2LMS;
export const rgb2bw = JXG.rgb2bw;
export const rgb2cb = JXG.rgb2cb;
export const rgb2css = JXG.rgb2css;
export const rgb2hex = JXG.rgb2hex;
export const rgb2hsv = JXG.rgb2hsv;
export const rgbParser = JXG.rgbParser;
export const rgb2rgbo = JXG.rgba2rgbo;
export const rgb2rgba = JXG.rgbo2rgba;
export const sanitizeHTML = JXG.sanitizeHTML;
export const shortcut = JXG.shortcut;
export const strBool = JXG.str2Bool;
export const supportsCanvas = JXG.supportsCanvas
export const supportsPointerEvents = JXG.supportsPointerEvents;
export const supportsSVG = JXG.supportsSVG;
export const supportsVML = JXG.supportsVML;
export const swap = JXG.swap;
export const timeChunk = JXG.timedChunk;
export const toFixed = JXG.toFixed;
export const toFullscreen = JXG.toFullscreen;
export const toJSON = JXG.toJSON;
export const trim = JXG.trim;
export const trimNumber = JXG.trimNumber;
export const truncate = JXG.truncate;
export const unescapeHTML = JXG.unescapeHTML;
export const uniqueArray = JXG.uniqueArray;
export const useBlackWhiteOptions = JXG.useBlackWhiteOptions;
export const useStandardOptions = JXG.useStandardOptions;
export const warn = JXG.warn;

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
    // } else if (Env.isNode() && typeof module === 'object') {
    //     module.exports = JXG;
} else if (Env.isWebWorker()) {
    self.JXG = JXG;
}

export default JXG;
