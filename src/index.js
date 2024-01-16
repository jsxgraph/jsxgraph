/* eslint-disable one-var */
import JXG from './jxg';
import Env from './utils/env'; // Needed below
import './base/constants';
import './utils/type';
import './utils/xml';
import './utils/event';
import './utils/expect';
import './math/math';
import './math/probfuncs';
import './math/ia';
import './math/extrapolate';
import './math/qdt';
import './math/bqdt';
import './math/numerics';
import './math/nlp';
import './math/plot';
import './math/implicitplot';
import './math/metapost';
import './math/statistics';
import './math/symbolic';
import './math/geometry';
import './math/clip';
import './math/poly';
import './math/complex';
import './renderer/abstract';
import './reader/file';
import './parser/geonext';
import './base/board';
import './options';
import './jsxgraph';
import './base/element';
import './base/coords';
import './base/coordselement';
import './base/point';
import './base/line';
import './base/group';
import './base/circle';
import './element/conic';
import './base/polygon';
import './base/curve';
import './element/arc';
import './element/sector';
import './base/composition';
import './element/composition';
import './element/locus';
import './base/text';
import './base/image';
import './element/slider';
import './element/measure';
import './base/chart';
import './base/transformation';
import './base/turtle';
import './utils/color';
import './base/ticks';
import './utils/zip';
import './utils/base64';
import './utils/uuid';
import './utils/encoding';
import './server/server';
import './parser/datasource';
import './parser/jessiecode';
import './parser/prefix';
import './parser/ca';
import './utils/dump';
import './renderer/svg';
import './renderer/vml';
import './renderer/canvas';
import './renderer/no';
import './element/comb';
import './element/slopetriangle';
import './element/checkbox';
import './element/input';
import './element/button';
import './element/vectorfield';
import './element/smartlabel';
import './base/foreignobject';
import './options3d';
import './3d/view3d';
import './3d/element3d';
import './3d/box3d';
import './3d/point3d';
import './3d/curve3d';
import './3d/linspace3d';
import './3d/surface3d';
import './themes/mono_thin';

// The following exports are used to restore granular objects.
// This is consistent with 1.4.x when a UMD bundle is used with a SystemJS loader.
// Over time, the granular object can be made first-class objects and the JXG object
// will only exist in a UMD bundle. This should improve tree-shaking.

// Values
export const COORDS_BY_SCREEN = JXG.COORDS_BY_SCREEN;
export const COORDS_BY_USER = JXG.COORDS_BY_USER;
export const Dump = JXG.Dump;
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
export const isInArray = JXG.isInArray;
export const isInObject = JXG.isInObject;
export const isMetroApp = JXG.isMetroApp;
export const isMozilla = JXG.isMozilla;
export const isBoard = JXG.isBoard;
export const isName = JXG.isName;
export const isNode = JXG.isNode;
export const isNumber = JXG.isNumber;
export const isObject = JXG.isObject;
export const isPointType = JXG.isPointType;
export const isString = JXG.isString;
export const isTouchDevice = JXG.isTouchDevice;
export const isTransformationOrArray = JXG.isTransformationOrArray;
export const isWebWorker = JXG.isWebWorker;
export const isWebkitAndroid = JXG.isWebkitAndroid;
export const isWebkitApple = JXG.isWebkitApple;
export const keys = JXG.keys;
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
