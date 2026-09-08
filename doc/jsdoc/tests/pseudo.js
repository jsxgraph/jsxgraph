/**
 * @class A general line is given by two points or three coordinates.
 * By setting __additional properties__ a line can be used as an arrow and/or axis.
 * @pseudo
 * @name Line
 * @augments JXG.Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @signature board.create('line', [point1, point2])
 * Create a line from two points, coordinate arrays or functions.
 * In the latter two cases the point will be constructed automatically as a fixed invisible point.
 * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point1 First point
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point2 Second point
 * @signature board.create('line', [a, b, c])
 * Create a line from homogeneous coordinates.
 * A line can also be created providing three numbers. The line is then described by
 * the set of solutions of the equation <tt>a*z+b*x+c*y = 0</tt>. For all finite points, z is normalized to the value 1.
 * It is possible to provide three functions returning numbers, too.
 * @param {number | function():number} a
 * @param {number | function():number} b
 * @param {number | function():number} c
 * @signature board.create('line', [f])
 * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
 *
 * Additionally, a line can be created by providing a line and a transformation (or an array of transformations).
 * Then, the result is a line which is the transformation of the supplied line.
 */
JXG.createLine = function (board, parents, attributes) { };

// line = {
//     /**
//      * @visprop
//      */

//     /**
//      * Attributes for first defining point of the line.
//      *
//      * @type Object
//      * @name Line#point1
//      * @attribute
//      */
//     point1: {
//         fillColor: 'red',
//     },

//     /**
//      * Attributes for second defining point of the line.
//      *
//      * @type Object
//      * @name Line#point2
//      * @attribute
//      */
//     point2: {
//         fillColor: 'red',
//     },

//     /**
//      * This number (pixel value) controls where infinite lines end at the canvas border. If zero, the line
//      * ends exactly at the border, if negative there is a margin to the inside, if positive the line
//      * ends outside of the canvas (which is invisible).
//      *
//      * @name Line#margin
//      * @type Number
//      * @default 0
//      * @attribute
//      */
//     margin: 0
// };

/**
 * @summary Some dummy property
 * @description long explanation of a dummy property
 * @name Line#xxx
 * @type number
 * @default 1001
 */

/**
 * @class A (line) segment defined by two points.
 * It's strictly spoken just a wrapper for element {@link Line} with {@link Line#straightFirst}
 * and {@link Line#straightLast} properties set to false. If there is a third variable then the
 * segment has a fixed length (which may be a function, too) determined by the absolute value of
 * that number.
 * @pseudo
 * @name Segment
 * @augments Line
 * @constructor
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * 
 * @signature board.create('segment', [point1, point2])
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point1 First point
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point2 Second point
 
 * @signature board.create('segment', [point1, point2, length])
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point1 First point
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point2 Second point
 * @param {number | function} length The points are adapted - if possible - such that their distance is equal to the absolute value of this number.
 * @see Line
 * @example
 * // Create a segment providing two points.
 *   var p1 = board.create('point', [4.5, 2.0]);
 *   var p2 = board.create('point', [1.0, 1.0]);
 *   var l1 = board.create('segment', [p1, p2]);
 * </pre><div class="jxgbox" id="JXGd70e6aac-7c93-4525-a94c-a1820fa38e2f" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var slex1_board = JXG.JSXGraph.initBoard('JXGd70e6aac-7c93-4525-a94c-a1820fa38e2f', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var slex1_p1 = slex1_board.create('point', [4.5, 2.0]);
 *   var slex1_p2 = slex1_board.create('point', [1.0, 1.0]);
 *   var slex1_l1 = slex1_board.create('segment', [slex1_p1, slex1_p2]);
 * </script><pre>
 *
 * @example
 * // Create a segment providing two points.
 *   var p1 = board.create('point', [4.0, 1.0]);
 *   var p2 = board.create('point', [1.0, 1.0]);
 *   // AB
 *   var l1 = board.create('segment', [p1, p2]);
 *   var p3 = board.create('point', [4.0, 2.0]);
 *   var p4 = board.create('point', [1.0, 2.0]);
 *   // CD
 *   var l2 = board.create('segment', [p3, p4, 3]); // Fixed length
 *   var p5 = board.create('point', [4.0, 3.0]);
 *   var p6 = board.create('point', [1.0, 4.0]);
 *   // EF
 *   var l3 = board.create('segment', [p5, p6, function(){ return l1.L();} ]); // Fixed, but dependent length
 * </pre><div class="jxgbox" id="JXG617336ba-0705-4b2b-a236-c87c28ef25be" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var slex2_board = JXG.JSXGraph.initBoard('JXG617336ba-0705-4b2b-a236-c87c28ef25be', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
 *   var slex2_p1 = slex2_board.create('point', [4.0, 1.0]);
 *   var slex2_p2 = slex2_board.create('point', [1.0, 1.0]);
 *   var slex2_l1 = slex2_board.create('segment', [slex2_p1, slex2_p2]);
 *   var slex2_p3 = slex2_board.create('point', [4.0, 2.0]);
 *   var slex2_p4 = slex2_board.create('point', [1.0, 2.0]);
 *   var slex2_l2 = slex2_board.create('segment', [slex2_p3, slex2_p4, 3]);
 *   var slex2_p5 = slex2_board.create('point', [4.0, 2.0]);
 *   var slex2_p6 = slex2_board.create('point', [1.0, 2.0]);
 *   var slex2_l3 = slex2_board.create('segment', [slex2_p5, slex2_p6, function(){ return slex2_l1.L();}]);
 * </script><pre>
 *
 */
JXG.createSegment = function (board, parents, attributes) {
};