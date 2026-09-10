/**
 * A TestLine is given by two points, three coordinates,
 * or a line with a transformation.
 *
 * By setting additional properties a line can be used as an arrow and/or axis.
 *
 * @class
 * @name TestLine
 * @augments JXG.Line
 * @type JXG.Line
 * @throws {Exception} If the element cannot be constructed with the given parent objects.
 * 
 * @xxxsignature new TestLine(point1, point2)
 * Create a line from two points, coordinate arrays or functions.
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point1 First point
 * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point2 Second point
 *
 * @xxxsignature new TestLine(a, b, c)
 * Create a line from homogeneous coordinates.
 * 
 * That is: az+bx+cy = 0 for all points on the line with homogeneous coordinates (z, x, y).
 *
 * @param {number | function():number} a
 * @param {number | function():number} b
 * @param {number | function():number} c
 * 
 * @xxxsignature new TestLine(f)
 * Create a line from a function returning homogeneous coordinates.
 *
 * @param {function():number[]} f
 *
 * @example 
 * // Line from two points
 * const p1 = board.create('point', [4.5, 2.0]);
 * const l1 = board.create('line', [p1, [1.0, 1.0]]);
 *
 * @example <caption>Line from homogeneous coordinates</caption>
 * const l1 = board.create('line', [1.0, -2.0, 3.0]);
 *
 * @example <caption>Reflected line</caption>
 * const mirror = board.create('line', [1, 1, 1], { strokeColor: '#aaaaaa' });
 * const reflect = board.create('transform', [mirror], { type: 'reflect' });
 *
 * const l1 = board.create('line', [1, -5, 1]);
 * const l2 = board.create('line', [l1, reflect]);
 *
 * @example <caption>Scaled line</caption>
 * const t = board.create('transform', [2, 1.5], { type: 'scale' });
 * const l1 = board.create('line', [1, -5, 1]);
 * const l2 = board.create('line', [l1, t]);
 *
 * @example <caption>Finite line segment</caption>
 * const p1 = board.create('point', [0, 0]);
 * const p2 = board.create('point', [2, 2]);
 * const l1 = board.create('line', [p1, p2], {
 *   straightFirst: false,
 *   straightLast: false
 * });
 */
  /**
   * variant 1 
   * @memberof TestLine
   * @instance 
   * @jsxgraphsignature
   * 
   * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point1 First point
   * @param {JXG.Point | number[] | function():JXG.Point | function():number[]} point2 Second point
   * @example
   * // Local example 1 a
   * @example
   * // Local example 1 b
   */
   /**
   * variant 2
   * Create a line from homogeneous coordinates.
   * @memberof TestLine
   * @instance 
   * @jsxgraphsignature
   * 
   * @param {number | function():number} a
   * @param {number | function():number} b
   * @param {number | function():number} c
   * @example
   * // Local example 2 a
   * @example
   * // Local example 2 b
   */
var TestLine = {
  constructor: 1
};
