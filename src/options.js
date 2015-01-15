/*
    Copyright 2008-2015
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


/*global JXG:true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 math/math
 utils/color
 utils/type
 */

define([
    'jxg', 'base/constants', 'math/math', 'utils/color', 'utils/type'
], function (JXG, Const, Mat, Color, Type) {

    "use strict";

    /**
     * Options Namespace
     * @description These are the default options of the board and of all geometry elements.
     * @namespace
     * @name JXG.Options
     */
    JXG.Options = {
        jc: {
            enabled: true,
            compile: true
        },

        /*
         * Options that are used directly within the board class
         */
        board: {
            /**#@+
             * @visprop
             */

            //updateType: 'hierarchical', // 'all'

            /**
             * Bounding box of the visible area in user coordinates.
             * It is an array consisting of four values:
             * [x<sub>1</sub>, y<sub>1</sub>, x<sub>2</sub>, y<sub>2</sub>]
             * 
             * The canvas will be spanned from the upper left corner (<sub>1</sub>, y<sub>1</sub>) 
             * to the lower right corner (x<sub>2</sub>, y<sub>2</sub>).
             * 
             * @name JXG.Board#boundingbox
             * @type Array
             * @default [-5, 5, 5, -5]
             */
            boundingBox: [-5, 5, 5, -5],

            /**
             * Additional zoom factor multiplied to {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}.
             * 
             * @name JXG.Board#zoomFactor
             * @type Number
             * @default 1.0
             */
            zoomFactor: 1,

            /**
             * Zoom factor in horizontal direction.
             * 
             * @name JXG.Board#zoomX
             * @see JXG.Board#zoomY
             * @type Number
             * @default 1.0
             */
            zoomX: 1,

            /**
             * Zoom factor in vertical direction.
             * 
             * @name JXG.Board#zoomY
             * @see JXG.Board#zoomX
             * @type Number
             * @default 1.0
             */
            zoomY: 1,

            /**
             * Show copyright string in canvas.
             * 
             * @name JXG.Board#showCopyright
             * @type Boolean
             * @default true
             */
            showCopyright: true,

            /**
             * Show default axis.
             * If shown, the horizontal axis can be accessed via JXG.Board.defaultAxis.x, the
             * vertical axis can be accessed via JXG.Board.defaultAxis.y. Both axes have a sub-element "defaultTicks".
             * 
             * @name JXG.Board#axis
             * @type Boolean
             * @default false
             */
            axis: false,

            /**
             * Display of navigation arrows and zoom buttons
             * 
             * @name JXG.Board#showNavigation
             * @type Boolean
             * @default true
             */
            showNavigation: true,

            /**
             * Show a button to force reload of a construction.
             * Works only with the JessieCode tag
             * 
             * @name JXG.Board#showReload
             * @type Boolean
             * @default false
             */
            showReload: false,

            /**
             * Show a button which allows to clear all traces of a board.
             * 
             * @name JXG.Board#showClearTraces
             * @type Boolean
             * @default false
             */
            showClearTraces: false,

            /**
             * If set to true the bounding box might be changed such that 
             * the ratio of width and height of the hosting HTML div is equal
             * to the ratio of wifth and height of the bounding box.
             * 
             * This is necessary if circles should look like circles and not
             * like ellipses. It is recommended to set keepAspectRatio = true
             * for geometric applets. For function plotting keepAspectRatio = false
             * might be the better choice.
             * 
             * @name JXG.Board#keepAspectRatio
             * @see JXG.Board#boundingbox
             * @see JXG.Board#setBoundingBox
             * @type Boolean
             * @default false
             */
            keepAspectRatio: false,

            /**
             * If set true and 
             * hasPoint() is true for both an element and it's label, 
             * the element (and not the label) is taken as drag element.
             * 
             * If set false and hasPoint() is true for both an element and it's label, 
             * the label is taken (if it is on a higher layer than the element)
             * 
             * @name JXG.Board#ignoreLabels
             * @type Booelan
             * @default true
             */
            ignoreLabels: true,

            /**
             * Supply the document object. Defaults to window.document
             * 
             * @name JXG.Board#document
             * @type DOM object
             * @default false (meaning window.document)
             */
            document: false,

            /**
             * If true the first element of the set JXG.board.objects having hasPoint==true is taken as drag element.
             * 
             * @name JXG.Board#takeFirst
             * @type Boolean
             * @default false
             */
            takeFirst: false,

            /**
            * If true, when read from a file or string - the size of the div can be changed by the construction text.
            * 
            * @name JXG.Board#takeSizeFromFile
            * @type Boolean
            * @default false
            */
            takeSizeFromFile: false,

            /**
             * Default rendering engine. Possible values are 'svg', 'canvas', 'vml', 'no'.
             * If the rendering engine is not available JSXGraph tries to detect a different engine.
             * 
             * @name JXG.Board#renderer
             * @type String
             * @default 'svg'
             */
            renderer: 'svg',

            /**
             * Time (in msec) between two animation steps. Used in 
             * {@link JXG.CoordsElement#moveAlong}, {@link JXG.CoordsElement#moveTo} and {@link JXG.CoordsElement#visit}.
             * 
             * @name JXG.Board#animationDelay
             * @type Number
             * @default 35
             * @see JXG.CoordsElement#moveAlong
             * @see JXG.CoordsElement#moveTo
             * @see JXG.CoordsElement#visit
             */
            animationDelay: 35,

            /**
             * Allow user interaction by registering mouse and touch events.
             * 
             * @name JXG.Board#registerEvents
             * @type Boolean
             * @default true
             */
            registerEvents: true,

            /**
             * Change redraw strategy in SVG rendering engine. 
             *
             * If set to 'svg', before every redrawing of the JSXGraph construction 
             * the SVG sub-tree of the DOM tree is taken out of the DOM.
             *
             * If set to 'all', before every redrawing of the JSXGraph construction the 
             * complete DOM tree is taken out of the DOM.
             * If set to 'none' the redrawing is done in-place. 
             * 
             * Using 'svg' or 'all' speeds up the update process considerably. The risk
             * is that if there is an exception, only a white div or window is left.
             * 
             * @name JXG.Board#name
             * @type String
             * @default 'svg'
             */
            minimizeReflow: 'svg',

            /**
             * A number that will be added to the absolute position of the board used in mouse coordinate
             * calculations in {@link JXG.Board#getCoordsTopLeftCorner}.
             * 
             * @name JXG.Board#offsetX
             * @see JXG.Board#offsetY
             * @type Number
             * @default 0
             */
            offsetX: 0,

            /**
             * A number that will be added to the absolute position of the board used in mouse coordinate
             * calculations in {@link JXG.Board#getCoordsTopLeftCorner}.
             * 
             * @name JXG.Board#offsetY
             * @see JXG.Board#offsetX
             * @type Number
             * @default 0
             */
            offsetY: 0,

            /**
             * Control the possibilities for zoom interaction.
             * 
             * Possible sub-attributes with default values are:
             * <pre>
             * zoom: {
             *   factorX: 1.25,  // horizontal zoom factor (multiplied to {@link JXG.Board#zoomX})
             *   factorY: 1.25,  // vertical zoom factor (multiplied to {@link JXG.Board#zoomY})
             *   wheel: false,   // allow zooming by mouse wheel
             *   needshift: false, // mouse wheel zooming needs pressing of the shift key
             *   eps: 0.1        // minimal values of {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}
             * }
             * </pre>
             * 
             * @name JXG.Board#zoom
             * @type Object
             * @default 
             */
            zoom: {
                factorX: 1.25,
                factorY: 1.25,
                wheel: false,
                needshift: false,
                eps: 0.1
            },

            /**
             * Control the possibilities for panning interaction (i.e. moving the origin).
             * 
             * Possible sub-attributes with default values are:
             * <pre>
             * pan: {
             *   enabled: true   // Allow panning
             *   needTwoFingers: true, // panningis done with two fingers on touch devices
             *   needshift: true, // mouse panning needs pressing of the shift key
             * }
             * </pre>
             * 
             * @name JXG.Board#pan
             * @type Object
             * @default 
             */
            pan: {
                needShift: true,
                needTwoFingers: true,
                enabled: true
            }
            /**#@-*/
        },

        /**
         * Options that are used by the navigation bar. 
         * 
         * Default values are
         * <pre>
         * JXG.Option.navbar: {
         *   strokeColor: '#333333', 
         *   fillColor: 'transparent',
         *   highlightFillColor: '#aaaaaa',
         *   padding: '2px',
         *   position: 'absolute',
         *   fontSize: '14px',
         *   cursor: 'pointer',
         *   zIndex: '100',
         *   right: '5px',
         *   bottom: '5px'
         * },
         * </pre>
         */
        navbar: {
            strokeColor: '#333333', //'#aaaaaa',
            fillColor: 'transparent', //#f5f5f5',
            highlightFillColor: '#aaaaaa',
            padding: '2px',
            position: 'absolute',
            fontSize: '14px',
            cursor: 'pointer',
            zIndex: '100',
            right: '5px',
            bottom: '5px'
            //border: 'none 1px black',
            //borderRadius: '4px'
        },

         /*
          *  Generic options used by {@link JXG.GeometryElement} 
          */
        elements: {
            // the following tag is a meta tag: http://code.google.com/p/jsdoc-toolkit/wiki/MetaTags

            /**#@+
             * @visprop
             */

            /**
             * The stroke color of the given geometry element.
             * @type String
             * @name JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeWidth
             * @see JXG.GeometryElement#strokeOpacity
             * @see JXG.GeometryElement#highlightStrokeOpacity
             * @default {@link JXG.Options.elements.color#strokeColor}
             */
            strokeColor: '#0000ff',

            /**
             * The stroke color of the given geometry element when the user moves the mouse over it.
             * @type String
             * @name JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#strokeWidth
             * @see JXG.GeometryElement#strokeOpacity
             * @see JXG.GeometryElement#highlightStrokeOpacity
             * @default {@link JXG.Options.elements.color#highlightStrokeColor}
             */
            highlightStrokeColor: '#C3D9FF',

            /**
             * The fill color of this geometry element.
             * @type String
             * @name JXG.GeometryElement#fillColor
             * @see JXG.GeometryElement#highlightFillColor
             * @see JXG.GeometryElement#fillOpacity
             * @see JXG.GeometryElement#highlightFillOpacity
             * @default {@link JXG.Options.elements.color#fillColor}
             */
            fillColor: 'red',

            /**
             * The fill color of the given geometry element when the mouse is pointed over it.
             * @type String
             * @name JXG.GeometryElement#highlightFillColor
             * @see JXG.GeometryElement#fillColor
             * @see JXG.GeometryElement#fillOpacity
             * @see JXG.GeometryElement#highlightFillOpacity
             * @default {@link JXG.Options.elements.color#highlightFillColor}
             */
            highlightFillColor: 'none',

            /**
             * Opacity for element's stroke color.
             * @type number
             * @name JXG.GeometryElement#strokeOpacity
             * @see JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeWidth
             * @see JXG.GeometryElement#highlightStrokeOpacity
             * @default {@link JXG.Options.elements#strokeOpacity}
             */
            strokeOpacity: 1,

            /**
             * Opacity for stroke color when the object is highlighted.
             * @type number
             * @name JXG.GeometryElement#highlightStrokeOpacity
             * @see JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeWidth
             * @see JXG.GeometryElement#strokeOpacity
             * @default {@link JXG.Options.elements#highlightStrokeOpacity}
             */
            highlightStrokeOpacity: 1,

            /**
             * Opacity for fill color.
             * @type number
             * @name JXG.GeometryElement#fillOpacity
             * @see JXG.GeometryElement#fillColor
             * @see JXG.GeometryElement#highlightFillColor
             * @see JXG.GeometryElement#highlightFillOpacity
             * @default {@link JXG.Options.elements.color#fillOpacity}
             */
            fillOpacity: 1,

            /**
             * Opacity for fill color when the object is highlighted.
             * @type number
             * @name JXG.GeometryElement#highlightFillOpacity
             * @see JXG.GeometryElement#fillColor
             * @see JXG.GeometryElement#highlightFillColor
             * @see JXG.GeometryElement#fillOpacity
             * @default {@link JXG.Options.elements.color#highlightFillOpacity}
             */
            highlightFillOpacity: 1,

            /**
             * Width of the element's stroke.
             * @type number
             * @name JXG.GeometryElement#strokeWidth
             * @see JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeOpacity
             * @see JXG.GeometryElement#highlightStrokeOpacity
             * @default {@link JXG.Options.elements#strokeWidth}
             */
            strokeWidth: 2,

            /**
             * Width of the element's stroke when the mouse is pointed over it.
             * @type number
             * @name JXG.GeometryElement#highlightStrokeWidth
             * @see JXG.GeometryElement#strokeColor
             * @see JXG.GeometryElement#highlightStrokeColor
             * @see JXG.GeometryElement#strokeOpacity
             * @see JXG.GeometryElement#highlightStrokeOpacity
             * @see JXG.GeometryElement#highlightFillColor
             * @default {@link JXG.Options.elements#strokeWidth}
             */
            highlightStrokeWidth: 2,


            /**
             * If true the element is fixed and can not be dragged around. The element
             * will be repositioned on zoom and moveOrigin events.
             * @type Boolean
             * @default false
             * @name JXG.GeometryElement#fixed
             */
            fixed: false,

            /**
             * If true the element is fixed and can not be dragged around. The element
             * will even stay at its position on zoom and moveOrigin events.
             * Only free elements like points, texts, curves can be frozen.
             * @type Boolean
             * @default false
             * @name JXG.GeometryElement#frozen
             */
            frozen: false,

            /**
             * If true a label will display the element's name.
             * @type Boolean
             * @default false
             * @name JXG.GeometryElement#withLabel
             */
            withLabel: false,

            /**
             * If false the element won't be visible on the board, otherwise it is shown.
             * @type boolean
             * @name JXG.GeometryElement#visible
             * @see JXG.GeometryElement#hideElement
             * @see JXG.GeometryElement#showElement
             * @default true
             */
            visible: true,

            /**
             * A private element will be inaccessible in certain environments, e.g. a graphical user interface.
             * @default false
             */
            priv: false,

            /**
             * Display layer which will contain the element.
             * @see JXG.Options#layer
             * @default See {@link JXG.Options#layer}
             */
            layer: 0,

            /**
             * Determines the elements border-style.
             * Possible values are:
             * <ul><li>0 for a solid line</li>
             * <li>1 for a dotted line</li>
             * <li>2 for a line with small dashes</li>


             * <li>3 for a line with medium dashes</li>
             * <li>4 for a line with big dashes</li>
             * <li>5 for a line with alternating medium and big dashes and large gaps</li>
             * <li>6 for a line with alternating medium and big dashes and small gaps</li></ul>
             * @type Number
             * @name JXG.GeometryElement#dash
             * @default 0
             */
            dash: 0,

            /**
             * If true the element will get a shadow.
             * @type boolean
             * @name JXG.GeometryElement#shadow
             * @default false
             */
            shadow: false,

            /**
             * If true the element will be traced, i.e. on every movement the element will be copied
             * to the background. Use {@link JXG.GeometryElement#clearTrace} to delete the trace elements.
             * @see JXG.GeometryElement#clearTrace
             * @see JXG.GeometryElement#traces
             * @see JXG.GeometryElement#numTraces
             * @type Boolean
             * @default false
             * @name JXG.GeometryElement#trace
             */
            trace: false,

            /**
             * Extra visual properties for traces of an element
             * @type Object
             * @see JXG.GeometryElement#trace
             * @name JXG.GeometryElement#traceAttributes
             */
            traceAttributes: {},

            /**
             *
             * @type Boolean
             * @default true
             * @name JXG.GeometryElement#highlight
             */
            highlight: true,

            /**
             * If this is set to true, the element is updated in every update
             * call of the board. If set to false, the element is updated only after
             * zoom events or more generally, when the bounding box has been changed.
             * Examples for the latter behaviour should be axes.
             * @type Boolean
             * @default true
             * @see JXG.GeometryElement#needsRegularUpdate
             * @name JXG.GeometryElement#needsRegularUpdate
             */
            needsRegularUpdate: true,

            /**
             * Snaps the element or its parents to the grid. Currently only relevant for points, circles,
             * and lines. Points are snapped to grid directly, on circles and lines it's only the parent
             * points that are snapped
             * @type Boolean
             * @default false
             * @name JXG.GeometryElement#snapToGrid
             */
            snapToGrid: false,

            /**
             * Determines whether two-finger manipulation of this object may change its size.
             * If set to false, the object is only rotated and translated.
             * @type Boolean
             * @default true
             * @name JXG.GeometryElement#scalable
             */
            scalable: true,

            /*draft options */
            draft: {
                /**
                 * If true the element will be drawn in grey scale colors to visualize that it's only a draft.
                 * @type boolean
                 * @name JXG.GeometryElement#draft
                 * @default {@link JXG.Options.elements.draft#draft}
                 */
                draft: false,
                strokeColor: '#565656',
                fillColor: '#565656',
                strokeOpacity: 0.8,
                fillOpacity: 0.8,
                strokeWidth: 1
            },

            /**
             * @private
             * By default, an element is not a label. Do not change this.
             */
            isLabel: false
            // close the meta tag
            /**#@-*/
        },

         /*
          *  Generic options used by {@link JXG.Ticks} 
          */
        ticks: {
            /**#@+
             * @visprop
             */

            /**
             * A function that expects two {@link JXG.Coords}, the first one representing the coordinates of the
             * tick that is to be labeled, the second one the coordinates of the center (the tick with position 0).
             * 
             * @type function
             * @name Ticks#generateLabelText
             */
            generateLabelText: null,

            /**
             * A function that expects two {@link JXG.Coords}, the first one representing the coordinates of the
             * tick that is to be labeled, the second one the coordinates of the center (the tick with position 0).
             * 
             * @deprecated Use {@link JGX.Options@generateLabelValue}
             * @type function
             * @name Ticks#generateLabelValue
             */
            generateLabelValue: null,

            /**
             * Draw labels yes/no
             * 
             * @type Boolean
             * @name Ticks#drawLabels
             * @default false
             */
            drawLabels: false,
            label: {
            },

            /**
             * Determine the position of the tick with value 0. 'left' means point1 of the line, 'right' means point2,
             * and 'middle' is equivalent to the midpoint of the defining points. This attribute is ignored if the parent
             * line is of type axis and is parallel to either the x (i.e. y = 0) or the y (i.e. x = 0) axis.
             * 
             * @type String
             * @name Ticks#anchor
             * @default 'left'
             */
            anchor: 'left',

            /**
             * Draw the zero tick, that lies at line.point1?
             * 
             * @type Boolean
             * @name Ticks#drawZero
             * @default false
             */
            drawZero: false,

            /**
             * If the distance between two ticks is too big we could insert new ticks. If insertTicks
             * is <tt>true</tt>, we'll do so, otherwise we leave the distance as is.
             * This option is ignored if equidistant is false. In the example below the distance between
             * two ticks is given as <tt>1</tt> but because insertTicks is set to true many ticks will
             * be omitted in the rendering process to keep the display clear.
             * 
             * @type Boolean
             * @name Ticks#insertTicks
             * @see Ticks#equidistant
             * @see Ticks#minTicksDistance
             * @default false
             * @example
             * // Create an axis providing two coord pairs.
             *   var p1 = board.create('point', [0, 0]);
             *   var p2 = board.create('point', [50, 25]);
             *   var l1 = board.create('line', [p1, p2]);
             *   var t = board.create('ticks', [l1, 1], {
             *      insertTicks: true,
             *      majorHeight: -1,
             *      label: {
             *          offset: [4, -9]
             *      },
             *      drawLabels: true
             *  });
             * </pre><div id="2f6fb842-40bd-4223-aa28-3e9369d2097f" style="width: 300px; height: 300px;"></div>
             * <script type="text/javascript">
             * (function () {
             *   var board = JXG.JSXGraph.initBoard('2f6fb842-40bd-4223-aa28-3e9369d2097f', {boundingbox: [-100, 70, 70, -100], showcopyright: false, shownavigation: false});
             *   var p1 = board.create('point', [0, 0]);
             *   var p2 = board.create('point', [50, 25]);
             *   var l1 = board.create('line', [p1, p2]);
             *   var t = board.create('ticks', [l1, 1], {insertTicks: true, majorHeight: -1, label: {offset: [4, -9]}, drawLabels: true});
             * })();
             * </script><pre>
             */
            insertTicks: false,
            minTicksDistance: 10,

            /**
             * Total height of a minor tick. If negative the full height of the board is taken.
             * 
             * @type Number
             * @name Ticks#minorHeight
             * @default 4
             */
            minorHeight: 4,

            /**
             * Total height of a major tick. If negative the full height of the board is taken.
             * 
             * @type Number
             * @name Ticks#majorHeight
             * @default 10
             */
            majorHeight: 10,

            /**
             * Decides in which direction finite ticks are visible. Possible values are 0=false or 1=true.
             * In case of [0,1] the tick is only visible to the right of the line. In case of
             * [1,0] the tick is only visible to the left of the line.
             * 
             * @type Array
             * @name Ticks#tickEndings
             * @default [1, 1]
             */
            tickEndings: [1, 1],

            /**
             * The number of minor ticks between two major ticks.
             * @type Number
             * @name Ticks#minorTicks
             * @default 4
             */
            minorTicks: 4,

            /**
             * Scale the ticks but not the tick labels.
             * @type Number
             * @default 1
             * @name Ticks#scale
             * @see Ticks#scaleSymbol
             */
            scale: 1,

            /**
             * A string that is appended to every tick, used to represent the scale
             * factor given in {@link JXG.Ticks#scaleSymbol}.
             * 
             * @type String
             * @default ''
             * @name Ticks#scaleSymbol
             * @see Ticks#scale
             */
            scaleSymbol: '',

            /**
             * User defined labels for special ticks. Instead of the i-th tick's position, the i-th string stored in this array
             * is shown. If the number of strings in this array is less than the number of special ticks, the tick's position is
             * shown as a fallback.
             * 
             * @type Array
             * @name Ticks#labels
             * @default []
             */
            labels: [],

            /**
             * The maximum number of characters a tick label can use.
             * 
             * @type Number
             * @name Ticks#maxLabelLength
             * @see Ticks#precision
             * @default 5
             */
            maxLabelLength: 5,

            /**
             * If a label exceeds {@link JXG.Ticks#maxLabelLength} this determines the precision used to shorten the tick label.
             * 
             * @type Number
             * @name Ticks#precision
             * @see Ticks#maxLabelLength
             * @default 3
             */
            precision: 3,

            /**
             * The default distance between two ticks. Please be aware that this value does not have
             * to be used if {@link JXG.Ticks#insertTicks} is set to true.
             * 
             * @type Number
             * @name Ticks#ticksDistance
             * @see Ticks#equidistant
             * @see Ticks#insertTicks
             * @default 1
             */
            ticksDistance: 1,
            strokeOpacity: 1,
            strokeWidth: 1,
            strokeColor: 'black',
            highlightStrokeColor: '#888888',

            /**
             * Whether line boundaries should be counted or not in the lower and upper bounds when
             * creating ticks.
             * 
             * @type Boolean
             * @name Ticks#includeBoundaries
             * @default false
             */
            includeBoundaries: false
            // close the meta tag
            /**#@-*/
        },

         /*
          *  Generic options used by {@link JXG.Hatch} 
          */
        hatch: {
            drawLabels: false,
            drawZero: true,
            majorHeight: 20,
            anchor: 'middle',
            strokeWidth: 2,
            strokeColor: 'blue',
            ticksDistance: 0.2
        },

        /**
         * Precision options.
         * 
         * The default values are
         * <pre>
         * JXG.Options.precision: {
         *   touch: 30,
         *   touchMax: 100,
         *   mouse: 4,
         *   epsilon: 0.0001,
         *   hasPoint: 4
         * }
         * </pre>
         */
        precision: {
            touch: 30,
            touchMax: 100,
            mouse: 4,
            epsilon: 0.0001,
            hasPoint: 4
        },

        /** 
         * Default ordering of the layers.
         * 
         * The default values are
         * <pre>
         * JXG.Options.layer: {
         *   numlayers: 20, // only important in SVG
         *   text: 9,
         *   point: 9,
         *   glider: 9,
         *   arc: 8,
         *   line: 7,
         *   circle: 6,
         *   curve: 5,
         *   turtle: 5,
         *   polygon: 3,
         *   sector: 3,
         *   angle: 3,
         *   integral: 3,
         *   axis: 2,
         *   ticks: 2,
         *   grid: 1,
         *   image: 0,
         *   trace: 0
         * }
         * </pre>
         */
        layer: {
            numlayers: 20, // only important in SVG
            text: 9,
            point: 9,
            glider: 9,
            arc: 8,
            line: 7,
            circle: 6,
            curve: 5,
            turtle: 5,
            polygon: 3,
            sector: 3,
            angle: 3,
            integral: 3,
            axis: 2,
            ticks: 2,
            grid: 1,
            image: 0,
            trace: 0
        },

        /* special angle options */
        angle: {
            /**#@+
             * @visprop
             */

            withLabel: true,

            /**
             * Radius of the sector, displaying the angle.
             * 
             * @type Number
             * @name Angle#radius
             * @default 0.5
             * @visprop
             */
            radius: 0.5,

            /**
             * Display type of the angle field. Possible values are
             * 'sector' or 'sectordot' or 'square' or 'none'.
             * 
             * @type String
             * @default 'sector'
             * @name Angle#type
             * @visprop
             */
            type: 'sector',

            /**
             * Display type of the angle field in case of a right angle. Possible values are
             * 'sector' or 'sectordot' or 'square' or 'none'.
             * 
             * @type String
             * @default square
             * @name Angle#orthoType
             * @see Angle#orthoSensitivity
             * @visprop
             */
            orthoType: 'square',

            /**
             * Sensitivity (in degrees) to declare an angle as right angle.
             * If the angle measure is inside this distance from a rigth angle, the orthoType
             * of the angle is used for display.
             * 
             * @type Number
             * @default 1.0
             * @name Angle#orthoSensitivity
             * @see Angle#orthoType
             * @visprop
             */
            orthoSensitivity: 1.0,

            fillColor: '#FF7F00',
            highlightFillColor: '#FF7F00',
            strokeColor: '#FF7F00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,

            /**
             * @deprecated
             */
            radiuspoint: {
                withLabel: false,
                visible: false,
                name: ''
            },
            /**
             * @deprecated
             */
            pointsquare: {
                withLabel: false,
                visible: false,
                name: ''
            },

            dot: {
                visible: false,
                strokeColor: 'none',
                fillColor: 'black',
                size: 2,
                face: 'o',
                withLabel: false,
                name: ''
            },
            label: {
                position: 'top',
                offset: [0, 0],
                strokeColor: '#0000FF'
            },

            arc: {
                visible: false
            }

            /**#@-*/
        },

        /* special arc options */
        arc: {
            /**#@+
             * @visprop
             */

            label: {},
            firstArrow: false,
            lastArrow: false,
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            useDirection: false

            /**#@-*/
        },

        /* special axis options */
        axis: {
            /**#@+
             * @visprop
             */

            name: '',                            // By default, do not generate names for axes.
            needsRegularUpdate: false,         // Axes only updated after zooming and moving of the origin.
            strokeWidth: 1,
            strokeColor: '#666666',
            highlightStrokeWidth: 1,
            highlightStrokeColor: '#888888',
            withTicks: true,
            straightFirst: true,
            straightLast: true,
            lastArrow: true,
            withLabel: false,
            scalable: false,

            /**
             * Attributes for ticks of the axis.
             * 
             * @type Ticks
             * @name Axis#ticks
             */
            ticks: {
                label: {
                    offset: [4, -12 + 3],     // This seems to be a good offset for 12 point fonts
                    parse: false,
                    needsRegularUpdate: false
                },
                needsRegularUpdate: false,
                strokeWidth: 1,
                strokeColor: '#666666',
                highlightStrokeColor: '#888888',
                drawLabels: true,
                drawZero: false,
                insertTicks: true,
                minTicksDistance: 5,
                minorHeight: 10,          // if <0: full width and height
                majorHeight: -1,          // if <0: full width and height
                tickEndings: [0, 1],
                minorTicks: 4,
                ticksDistance: 1,         // TODO doc
                strokeOpacity: 0.25
            },

            /**
             * Attributes for first point the axis.
             * 
             * @type Point
             * @name Axis#point1
             */
            point1: {                  // Default values for point1 if created by line
                needsRegularUpdate: false
            },

            /**
             * Attributes for second point the axis.
             * 
             * @type Point
             * @name Axis#point2
             */
            point2: {                  // Default values for point2 if created by line
                needsRegularUpdate: false
            },

            /**
             * Attributes for the axis label.
             * 
             * @type Label
             * @name Axis#label
             */
            label: {
                position: 'lft',
                offset: [10, 10]
            }
            /**#@-*/
        },

        /* special options for angle bisector of 3 points */
        bisector: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000', // Bisector line

            /**
             * Attributes for the helper point of the bisector.
             * 
             * @type Point
             * @name Bisector#point
             */
            point: {               // Bisector point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }

            /**#@-*/
        },

        /* special options for the 2 bisectors of 2 lines */
        bisectorlines: {
            /**#@+
             * @visprop
             */

            /**
             * Attributes for first line.
             * 
             * @type Line
             * @name Bisectorlines#line1
             */
            line1: {               //
                strokeColor: 'black'
            },

            /**
             * Attributes for second line.
             * 
             * @type Line
             * @name Bisectorlines#line2
             */
            line2: {               //
                strokeColor: 'black'
            }

            /**#@-*/
        },

        /* special chart options */
        chart: {
            /**#@+
             * @visprop
             */

            chartStyle: 'line',
            colors: ['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#C3D9FF', '#4096EE', '#008C00'],
            highlightcolors: null,
            fillcolor: null,
            highlightonsector: false,
            highlightbysize: false,
            label: {
            }
            /**#@-*/
        },

        /*special circle options */
        circle: {
            /**#@+
             * @visprop
             */

            /**
             * If <tt>true</tt>, moving the mouse over inner points triggers hasPoint.
             * 
             * @see JXG.GeometryElement#hasPoint
             * @name Circle#hasInnerPoints
             * @type Boolean
             * @default false
             */
            hasInnerPoints: false,

            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes for center point.
             * 
             * @type Point
             * @name Circle#center
             */
            center: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },

            /**
             * Attributes for circle label.
             * 
             * @type Label
             * @name Circle#label
             */
            label: {
                position: 'urt'
            }
            /**#@-*/
        },

        /* special options for circumcircle of 3 points */
        circumcircle: {
            /**#@+
             * @visprop
             */

            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes for center point.
             * 
             * @type Point
             * @name Circumcircle#center
             */
            center: {               // center point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        circumcirclearc: {
            /**#@+
             * @visprop
             */

            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes for center point.
             * 
             * @type Point
             * @name CircumcircleArc#center
             */
            center: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            }
            /**#@-*/
        },

        /* special options for circumcircle sector of 3 points */
        circumcirclesector: {
            /**#@+
             * @visprop
             */

            useDirection: true,
            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes for center point.
             * 
             * @type Point
             * @name Circle#point
             */
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        /* special conic options */
        conic: {
            /**#@+
             * @visprop
             */

            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes for foci points.
             * 
             * @type Point
             * @name Conic#foci
             */
            foci: {
                // points
                fixed: false,
                visible: false,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        /* special curve options */
        curve: {
            strokeWidth: 1,
            strokeColor: '#0000ff',
            fillColor: 'none',
            fixed: true,

            useQDT: false,

            /**#@+
             * @visprop
             */

            /**
             * The data points of the curve are not connected with straight lines but with bezier curves.
             * @name Curve#handDrawing
             * @type Boolean
             * @default false
             */
            handDrawing: false,

            /**
             * The curveType is set in {@link JXG.Curve#generateTerm} and used in {@link JXG.Curve#updateCurve}.
             * Possible values are <ul>
             * <li>'none'</li>
             * <li>'plot': Data plot</li>
             * <li>'parameter': we can not distinguish function graphs and parameter curves</li>
             * <li>'functiongraph': function graph</li>
             * <li>'polar'</li>
             * <li>'implicit' (not yet)</li></ul>
             * Only parameter and plot are set directly. Polar is set with {@link JXG.GeometryElement#setAttribute} only.
             * @name Curve#curveType
             * @type String
             * @default null
             */
            curveType: null,

            /**
             * Apply Ramer-Douglas-Peuker smoothing.
             * 
             * @type Boolean
             * @name Curve#RDPsmoothing
             * @default false
             */
            RDPsmoothing: false,     // Apply the Ramer-Douglas-Peuker algorithm

            /**
             * Number of points used for plotting triggered by up events in case {@link Curve#doAdvancedPlot} is false.
             * 
             * @name Curve#numberPointsHigh
             * @see Curve#doAdvancedPlot
             * @type Number
             * @default 1600
             */
            numberPointsHigh: 1600,  // Number of points on curves after mouseUp

            /**
             * Number of points used for plotting triggered by move events in case {@link Curve#doAdvancedPlot} is false.
             * 
             * @name Curve#numberPointsLow
             * @see Curve#doAdvancedPlot
             * @type Number
             * @default 400
             */
            numberPointsLow: 400,    // Number of points on curves after mousemove

            /**
             * If true use a recursive bisection algorithm.
             * It is slower, but usually the result is better. It tries to detect jumps
             * and singularities.
             * 
             * @name Curve#doAdvancedPlot
             * @type Boolean
             * @default true
             */
            doAdvancedPlot: true,   

            /**
             * If true use the algorithm by Gillam and Hohenwarter, which was default until version 0.98.
             * 
             * @name Curve#doAdvancedPlotOld
             * @see Curve#doAdvancedPlot
             * @type Boolean
             * @default false
             */
            doAdvancedPlotOld: false,

            /**
             * Attributes for circle label.
             * 
             * @type Label
             * @name Circle#label
             */
            label: {
                position: 'lft'
            }

            /**#@-*/
        },

        glider: {
            /**#@+
             * @visprop
             */

            label: {}
            /**#@-*/
        },

        /* special grid options */
        grid: {
            /**#@+
             * @visprop
             */

            /* grid styles */
            needsRegularUpdate: false,
            hasGrid: false,
            gridX: 1,
            gridY: 1,
            //strokeColor: '#C0C0C0',
            strokeColor: '#C0C0C0',
            strokeOpacity: 0.5,
            strokeWidth: 1,
            dash: 0,    // dashed grids slow down the iPad considerably
            /* snap to grid options */

            /**
             * @deprecated
             */
            snapToGrid: false,
            /**
             * @deprecated
             */
            snapSizeX: 10,
            /**
             * @deprecated
             */
            snapSizeY: 10

            /**#@-*/
        },

        group: {
            needsRegularUpdate: true
        },

        /* special html slider options */
        htmlslider: {
            /**#@+
             * @visprop
             */

            /**
             *
             * These affect the DOM element input type="range".
             * The other attributes affect the DOM element div containing the range element.
             */
            widthRange: 100,
            widthOut: 34,
            step: 0.01,

            frozen: true,
            isLabel: false,
            strokeColor: 'black',
            display: 'html',
            anchorX: 'left',
            anchorY: 'middle',
            withLabel: false

            /**#@-*/
        },

        /* special grid options */
        image: {
            /**#@+
             * @visprop
             */

            imageString: null,
            fillOpacity: 1.0,
            cssClass: 'JXGimage',
            highlightCssClass: 'JXGimageHighlight',

            /**
             * Image rotation in degrees. 
             * 
             * @name Image#rotate
             * @type Number
             * @default 0
             */
            rotate: 0,

            /**
             * Defines together with {@link Image#snapSizeY} the grid the image snaps on to.
             * The image will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * 
             * @name Image#snapSizeX
             * 
             * @see JXG.Point#snapToGrid
             * @see Image#snapSizeY
             * @see JXG.Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link Image#snapSizeX} the grid the image snaps on to.
             * The image will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * 
             * @name Image#snapSizeY
             * 
             * @see JXG.Point#snapToGrid
             * @see Image#snapSizeX
             * @see JXG.Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeY: 1,

            /**
             * List of attractor elements. If the distance of the image is less than
             * attractorDistance the image is made to glider of this element.
             *
             * @name Image#attractors
             * 
             * @type array
             * @default empty
             */
            attractors: []

            /**#@-*/
        },

        /* special options for incircle of 3 points */
        incircle: {
            /**#@+
             * @visprop
             */

            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',

            /**
             * Attributes of circle center.
             * 
             * @type Point
             * @name Incircle#center
             */
            center: {               // center point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        inequality: {
            /**#@+
             * @visprop
             */

            fillColor: 'red',
            fillOpacity: 0.2,
            strokeColor: 'none',

            /**
             * By default an inequality is less (or equal) than. Set inverse to <tt>true</tt> will consider the inequality
             * greater (or equal) than.
             * 
             * @type Boolean
             * @default false
             * @name Inequality#inverse
             * @visprop
             */
            inverse: false
            /**#@-*/
        },

        infobox: {
            /**#@+
             * @visprop
             */

            fontSize: 12,
            isLabel: false,
            strokeColor: '#bbbbbb',
            display: 'html',                    // 'html' or 'internal'
            anchorX: 'left',                     //  'left', 'middle', or 'right': horizontal alignment of the text.
            anchorY: 'middle',                   //  'top', 'middle', or 'bottom': vertical alignment of the text.
            cssClass: 'JXGinfobox',
            rotate: 0,                           // works for non-zero values only in combination with display=='internal'
            visible: true,
            parse: false,
            needsRegularUpdate: false

            /**#@-*/
        },

        /* special options for integral */
        integral: {
            /**#@+
             * @visprop
             */

            axis: 'x',        // 'x' or 'y'
            withLabel: true,    // Show integral value as text
            strokeWidth: 0,
            strokeOpacity: 0,
            fillOpacity: 0.8,

            /**
             * Attributes of the (left) starting point of the integral.
             * 
             * @type Point
             * @name Integral#curveLeft
             * @see Integral#baseLeft
             */
            curveLeft: {    // Start point
                visible: true,
                withLabel: false,
                layer: 9
            },

            /**
             * Attributes of the (left) base point of the integral.
             * 
             * @type Point
             * @name Integral#baseLeft
             * @see Integral#curveLeft
             */
            baseLeft: {    // Start point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes of the (right) end point of the integral.
             * 
             * @type Point
             * @name Integral#curveRight
             * @see Integral#baseRight
             */
            curveRight: {      // End point
                visible: true,
                withLabel: false,
                layer: 9
            },

            /**
             * Attributes of the (right) base point of the integral.
             * 
             * @type Point
             * @name Integral#baseRight
             * @see Integral#curveRight
             */
            baseRight: {      // End point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for integral label.
             * 
             * @type Label
             * @name Integral#label
             */
            label: {
                fontSize: 20
            }
            /**#@-*/
        },

        /* special intersection point options */
        intersection: {
            /**#@+
             * @visprop
             */

            /**
             * Used in {@link JXG.Intersection}.
             * This flag sets the behaviour of intersection points of e.g.
             * two segments. If true, the intersection is treated as intersection of lines. If false
             * the intersection point exists if the segments intersect setwise.
             * 
             * @name Intersection.alwaysIntersect
             * @type Boolean
             * @default true
             */
            alwaysIntersect: true

            /**#@-*/
        },

        /* special label options */
        label: {
            /**#@+
             * @visprop
             */

            strokeColor: 'black',
            strokeOpacity: 1,
            highlightStrokeOpacity: 0.666666,
            highlightStrokeColor: 'black',

            fixed: true,
            /**
             * Possible string values for the position of a label for
             * label anchor points are:
             * 'lft'|'rt'|'top'|'bot'|'ulft'|'urt'|'llft'|'lrt'
             * This is relevant for non-points: line, circle, curve.
             * 
             * @type String
             * @default 'urt'
             * @name JXG.GeometryElement#label.position
             */
            position: 'urt',

            /**
             *  Label offset from label anchor
             *  The label anchor is determined by JXG.GeometryElement#label.position
             * 
             * @type Array
             * @default [10,10]
             * @name JXG.GeometryElement#label.offset
             **/
            offset: [10, 10]

            /**#@-*/
        },

        /* special legend options */
        legend: {
            /**
             * @visprop
             */
            style: 'vertical',
            labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
            colors: ['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#C3D9FF', '#4096EE', '#008C00']
            /**#@-*/
        },

        /* special line options */
        line: {
            /**#@+
             * @visprop
             */

            /**
             * Line has an arrow head at the position of its first point or the corresponding 
             * intersection with the canvas border.
             * 
             * @name Line#firstArrow
             * @see Line#lastArrow
             * @see Line#touchFirstPoint
             * @type Boolean
             * @default false
             */
            firstArrow: false,

            /**
             * Line has an arrow head at the position of its second point or the corresponding 
             * intersection with the canvas border.
             * 
             * @name Line#lastArrow
             * @see Line#firstArrow
             * @see Line#touchLastPoint
             * @type Boolean
             * @default false
             */
            lastArrow: false,

            /**
             * If true, line stretches infinitely in direction of its first point.
             * Otherwise it ends at point1.
             * 
             * @name Line#straightFirst
             * @see Line#straightLast
             * @type Boolean
             * @default true
             */
            straightFirst: true,

            /**
             * If true, line stretches infinitely in direction of its second point.
             * Otherwise it ends at point2.
             * 
             * @name Line#straightLast
             * @see Line#straightFirst
             * @type Boolean
             * @default true
             */
            straightLast: true,

            fillColor: 'none',               // Important for VML on IE
            highlightFillColor: 'none',  // Important for VML on IE
            strokeColor: '#0000ff',
            highlightStrokeColor: '#888888',
            withTicks: false,

            /**
             * Attributes for first defining point of the line.
             * 
             * @type Point
             * @name Line#point1
             */
            point1: {                  // Default values for point1 if created by line
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },

            /**
             * Attributes for second defining point of the line.
             * 
             * @type Point
             * @name Line#point2
             */
            point2: {                  // Default values for point2 if created by line
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },

            /**
             * Attributes for ticks of the line.
             * 
             * @type Ticks
             * @name Line#ticks
             */
            ticks: {
                drawLabels: true,
                label: {
                    offset: [4, -12 + 3] // This seems to be a good offset for 12 point fonts
                },
                drawZero: false,
                insertTicks: false,
                minTicksDistance: 50,
                minorHeight: 4,          // if <0: full width and height
                majorHeight: -1,         // if <0: full width and height
                minorTicks: 4,
                defaultDistance: 1,
                strokeOpacity: 0.3
            },

            /**
             * Attributes for the line label.
             * 
             * @type Label
             * @name Line#label
             */
            label: {
                position: 'llft'
            },

            /**
             * If set to true, the point will snap to a grid defined by
             * {@link JXG.Point#snapSizeX} and {@link JXG.Point#snapSizeY}.
             * 
             * @see Point#snapSizeX
             * @see Point#snapSizeY
             * @type Boolean
             * @name Line#snapToGrid
             * @default false
             */
            snapToGrid: false,

            /**
             * Defines together with {@link JXG.Point#snapSizeY} the grid the point snaps on to.
             * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * 
             * @see Point#snapToGrid
             * @see Point#snapSizeY
             * @see JXG.Board#defaultAxes
             * @type Number
             * @name Line#snapSizeX
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link JXG.Point#snapSizeX} the grid the point snaps on to.
             * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * 
             * @see Point#snapToGrid
             * @see Point#snapSizeX
             * @see Board#defaultAxes
             * @type Number
             * @name Line#snapSizeY
             * @default 1
             */
            snapSizeY: 1,

            /**
             * If set to true and {@link Line#firstArrow} is set to true, the arrow head will just touch
             * the circle line of the start point of the line.
             * 
             * @see Line#firstArrow
             * @type Boolean
             * @name Line#touchFirstPoint
             * @default false
             */
            touchFirstPoint: false,

            /**
             * If set to true and {@link Line#lastArrow} is set to true, the arrow head will just touch
             * the circle line of the start point of the line.
             * @see Line#firstArrow
             * @type Boolean
             * @name Line#touchLastPoint
             * @default false
             */
            touchLastPoint: false

            /**#@-*/
        },

        /* special options for locus curves */
        locus: {
            /**#@+
             * @visprop
             */

            translateToOrigin: false,
            translateTo10: false,
            stretch: false,
            toOrigin: null,
            to10: null
            /**#@-*/
        },

        /* special options for normal lines */
        normal: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000', //  normal line

            /**
             * Attributes of helper point of normal.
             * 
             * @type Point
             * @name Normal#point
             */
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        /* special options for orthogonal projectionn points */
        orthogonalprojection: {
            /**#@+
             * @visprop
             */


            /**#@-*/
        },

        /* special options for parallel lines */
        parallel: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000', // Parallel line

            /**
             * Attributes of helper point of normal.
             * 
             * @type Point
             * @name Parallel#point
             */
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },

            label: {
                position: 'llft'
            }
            /**#@-*/
        },

        /* special perpendicular options */
        perpendicular: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000', // Perpendicular line
            straightFirst: true,
            straightLast: true
            /**#@-*/
        },

        /* special perpendicular options */
        perpendicularsegment: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000', // Perpendicular segment
            straightFirst: false,
            straightLast: false,
            point: {               // Perpendicular point
                visible: false,
                fixed: true,
                withLabel: false,
                name: ''
            }
            /**#@-*/
        },

        /* special point options */
        point: {
            /**#@+
             * @visprop
             */

            withLabel: true,
            label: {},

            /**
             * This attribute was used to determined the point layout. It was derived from GEONExT and was
             * replaced by {@link Point#face} and {@link Point#size}.
             * 
             * @name Point#style
             * 
             * @see Point#face
             * @see Point#size
             * @type Number
             * @default 5
             * @deprecated
             */
            style: 5,

            /**
             * There are different point styles which differ in appearance.
             * Posssible values are
             * <table><tr><th>Value</th></tr>
             * <tr><td>cross</td></tr>
             * <tr><td>circle</td></tr>
             * <tr><td>square</td></tr>
             * <tr><td>plus</td></tr>
             * <tr><td>diamond</td></tr>
             * <tr><td>triangleUp</td></tr>
             * <tr><td>triangleDown</td></tr>
             * <tr><td>triangleLeft</td></tr>
             * <tr><td>triangleRight</td></tr>
             * </table>
             * 
             * @name Point#face
             * 
             * @type string
             * @see Point#setStyle
             * @default circle
             */
            face: 'o',

            /**
             * Size of a point.
             * Means radius resp. half the width of a point (depending on the face).
             * 
             * @name Point#size
             * 
             * @see Point#face
             * @see Point#setStyle
             * @type number
             * @default 3
             */
            size: 3,

            fillColor: '#ff0000',
            highlightFillColor: '#EEEEEE',
            strokeWidth: 2,
            strokeColor: '#ff0000',
            highlightStrokeColor: '#C3D9FF',

            /**
             * If true, the point size changes on zoom events.
             * 
             * @type Boolean
             * @name Point#zoom
             * @default false
             * 
             */
            zoom: false,             // Change the point size on zoom

            /**
             * If true, the infobox is shown on mouse over, else not.
             * 
             * @name Point#showInfobox
             * 
             * @type Boolean
             * @default true
             */
            showInfobox: true,

            /**
             * Truncating rule for the digits in the infobox.
             * <ul>
             * <li>'auto': done automatically by JXG#autoDigits
             * <li>'none': no truncation
             * <li>number: use String.toFixed();
             * </ul>
             * 
             * @name Point#infoboxDigits
             * 
             * @type String, Number
             * @default 'auto'
             */
            infoboxDigits: 'auto',

            draft: false,

            /**
             * List of attractor elements. If the distance of the point is less than
             * attractorDistance the point is made to glider of this element.
             * 
             * @name Point#attractors
             * 
             * @type array
             * @default empty
             */
            attractors: [],

            /**
             * Unit for attractorDistance and snatchDistance, used for magnetized points and for snapToPoints.
             * Possible values are 'screen' and 'user.
             * 
             * @name Point#attractorUnit
             * 
             * @see Point#attractorDistance
             * @see Point#snatchDistance
             * @see Point#snapToPoints
             * @see Point#attractors
             * @type string
             * @default 'user'
             */
            attractorUnit: 'user',    // 'screen', 'user'

            /**
             * If the distance of the point to one of its attractors is less
             * than this number the point will be a glider on this
             * attracting element.
             * If set to zero nothing happens.
             * 
             * @name Point#attractorDistance
             * 
             * @type number
             * @default 0.0
             */
            attractorDistance: 0.0,

            /**
             * If the distance of the point to one of its attractors is at least
             * this number the point will be released from being a glider on the
             * attracting element.
             * If set to zero nothing happens.
             * 
             * @name Point#snatchDistance
             * 
             * @type number
             * @default 0.0
             */
            snatchDistance: 0.0,

            /**
             * If set to true, the point will snap to a grid defined by
             * {@link Point#snapSizeX} and {@link Point#snapSizeY}.
             * 
             * @name Point#snapToGrid
             * 
             * @see JXG.Point#snapSizeX
             * @see JXG.Point#snapSizeY
             * @type Boolean
             * @default false
             */
            snapToGrid: false,

            /**
             * Defines together with {@link Point#snapSizeY} the grid the point snaps on to.
             * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * 
             * @name Point#snapSizeX
             * 
             * @see Point#snapToGrid
             * @see Point#snapSizeY
             * @see Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link Point#snapSizeX} the grid the point snaps on to.
             * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * 
             * @name Point#snapSizeY
             * 
             * @see Point#snapToGrid
             * @see Point#snapSizeX
             * @see Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeY: 1,

            /**
             * If set to true, the point will snap to the nearest point in distance of
             * {@link Point#attractorDistance}.
             * 
             * @name Point#snapToPoints
             * 
             * @see Point#attractorDistance
             * @type Boolean
             * @default false
             */
            snapToPoints: false

            /**#@-*/
        },

        /* special polygon options */
        polygon: {
            /**#@+
             * @visprop
             */

            /**
             * If <tt>true</tt>, moving the mouse over inner points triggers hasPoint.
             * 
             * @see JXG.GeometryElement#hasPoint
             * @name Polygon#hasInnerPoints
             * @type Boolean
             * @default false
             */
            hasInnerPoints: false,

            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,

            /**
             * Is the polygon bordered by lines?
             * 
             * @type Boolean
             * @name Polygon#withLines
             * @default true
             */
            withLines: true,

            /**
             * Attributes for the polygon border lines.
             * 
             * @type Line
             * @name Polygon#borders
             */
            borders: {
                withLabel: false,
                strokeWidth: 1,
                highlightStrokeWidth: 1,
                // Polygon layer + 1
                layer: 5,
                label: {
                    position: 'top'
                }
            },

            /**
             * Attributes for the polygon vertices.
             * 
             * @type Point
             * @name Polygon#vertices
             */
            vertices: {
                layer: 9,
                withLabel: false,
                name: '',
                strokeColor: '#ff0000',
                fillColor: '#ff0000',
                fixed: false
            },

            /**
             * Attributes for the polygon label.
             * 
             * @type Label
             * @name Polygon#label
             */
            label: {
                offset: [0, 0]
            }

            /**#@-*/
        },

        /* special prescribed angle options */
        prescribedangle: {
            /**#@+
             * @visprop
             */

            /**
             * Attributes for the helper point of the prescribed angle.
             * 
             * @type Point
             * @name PrescribedAngle#anglepoint
             */
            anglepoint: {
                size: 2,
                visible: false,
                withLabel: false
            }

            /**#@-*/
        },

        /* special regular polygon options */
        regularpolygon: {
            /**#@+
             * @visprop
             */

            /**
             * If <tt>true</tt>, moving the mouse over inner points triggers hasPoint.
             * @see JXG.GeometryElement#hasPoint
             * 
             * @name RegularPolygon#hasInnerPoints
             * @type Boolean
             * @default false
             */
            hasInnerPoints: false,
            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,

            /**
             * Is the polygon bordered by lines?
             * 
             * @type Boolean
             * @name RegularPolygon#withLines
             * @default true
             */
            withLines: true,

            /**
             * Attributes for the polygon border lines.
             * 
             * @type Line
             * @name RegularPolygon#borders
             */
            borders: {
                withLabel: false,
                strokeWidth: 1,
                highlightStrokeWidth: 1,
                // Polygon layer + 1
                layer: 5,
                label: {
                    position: 'top'
                }
            },

            /**
             * Attributes for the polygon vertices.
             * 
             * @type Point
             * @name RegularPolygon#vertices
             */
            vertices: {
                layer: 9,
                withLabel: true,
                strokeColor: '#ff0000',
                fillColor: '#ff0000',
                fixed: false
            },

            /**
             * Attributes for the polygon label.
             * 
             * @type Label
             * @name Polygon#label
             */
            label: {
                offset: [0, 0]
            }

            /**#@-*/
        },

        /* special options for riemann sums */
        riemannsum: {
            /**#@+
             * @visprop
             */

            withLabel: false,
            fillOpacity: 0.3,
            fillColor: '#ffff00'

            /**#@-*/
        },

        /* special sector options */
        sector: {
            /**#@+
             * @visprop
             */

            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            highlightOnSector: false,
            highlightStrokeWidth: 0,

            /**
             * Attributes for sub-element arc.
             * 
             * @type Arc
             * @name Sector#arc
             */
            arc: {
                visible: false,
                fillColor: 'none'
            },

            /**
             * Attributes for helper point radiuspoint.
             * 
             * @type Point
             * @name Sector#radiuspoint
             */
            radiuspoint: {
                visible: false,
                withLabel: false
            },

            /**
             * Attributes for helper point center.
             * 
             * @type Point
             * @name Sector#center
             */
            center: {
                visible: false,
                withLabel: false
            },

            /**
             * Attributes for helper point anglepoint.
             * 
             * @type Point
             * @name Sector#anglepoint
             */
            anglepoint: {
                visible: false,
                withLabel: false
            },

            /**
             * Attributes for the sector label.
             * 
             * @type Label
             * @name Sector#label
             */
            label: {
                offset: [0, 0]
            }

            /**#@-*/
        },

        /* special segment options */
        segment: {
            /**#@+
             * @visprop
             */

            label: {
                position: 'top'
            }
            /**#@-*/
        },

        semicircle: {
            /**#@+
             * @visprop
             */

            /**
             * Attributes for center point of the semicircle.
             * 
             * @type Point
             * @name Semicircle#midpoint
             */
            midpoint: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            }

            /**#@-*/
        },

        /* special slider options */
        slider: {
            /**#@+
             * @visprop
             */

            /**
             * The slider only returns integer multiples of this value, e.g. for discrete values set this property to <tt>1</tt>. For
             * continuous results set this to <tt>-1</tt>.
             * 
             * @memberOf Slider.prototype
             * @name snapWidth
             * @type Number
             */
            snapWidth: -1,      // -1 = deactivated

            /**
             * The precision of the slider value displayed in the optional text.
             * @memberOf Slider.prototype
             * @name precision
             * @type Number
             * @default 2
             */
            precision: 2,

            firstArrow: false,
            lastArrow: false,

            /**
             * Show slider ticks.
             * 
             * @type Boolean
             * @name Slider#withTicks
             * @default true
             */
            withTicks: true,

            /**
             * Show slider label.
             * 
             * @type Boolean
             * @name Slider#withLabel
             * @default true
             */
            withLabel: true,

            layer: 9,
            showInfobox: false,
            name: '',
            visible: true,
            strokeColor: '#000000',
            highlightStrokeColor: '#888888',
            fillColor: '#ffffff',
            highlightFillColor: 'none',

            /**
             * Size of slider point.
             * 
             * @type Number
             * @name Slider#size
             * @default 6
             * @see Point#size
             */
            size: 6,

            /**
             * Attributes for first (left) helper point defining the slider position.
             * 
             * @type Point
             * @name Slider#point1
             */
            point1: {
                needsRegularUpdate: false,
                showInfobox: false,
                withLabel: false,
                visible: false,
                fixed: true,
                name: ''
            },

            /**
             * Attributes for second (right) helper point defining the slider position.
             * 
             * @type Point
             * @name Slider#point2
             */
            point2: {
                needsRegularUpdate: false,
                showInfobox: false,
                withLabel: false,
                visible: false,
                fixed: true,
                name: ''
            },

            /**
             * Attributes for the base line of the slider.
             * 
             * @type Line
             * @name Slider#baseline
             */
            baseline: {
                needsRegularUpdate: false,
                fixed: true,
                name: '',
                strokeWidth: 1,
                strokeColor: '#000000',
                highlightStrokeColor: '#888888'
            },

            /**
             * Attributes for the ticks of the base line of the slider.
             * 
             * @type Ticks
             * @name Slider#ticks
             */
            ticks: {
                needsRegularUpdate: false,
                fixed: true,
                drawLabels: false,
                drawZero: true,
                insertTicks: true,
                minorHeight: 4,         // if <0: full width and height
                majorHeight: 5,        // if <0: full width and height
                minorTicks: 0,
                defaultDistance: 1,
                strokeOpacity: 1,
                strokeWidth: 1,
                tickEndings: [0, 1],
                strokeColor: '#000000'
            },

            /**
             * Attributes for the highlighting line of the slider.
             * 
             * @type Line
             * @name Slider#highline
             */
            highline: {
                strokeWidth: 3,
                fixed: true,
                name: '',
                strokeColor: '#000000',
                highlightStrokeColor: '#888888'
            },

            /**
             * Attributes for the slider label.
             * 
             * @type Label
             * @name Slider#label
             */
            label: {
                strokeColor: '#000000'
            }

            /**#@-*/
        },

        /* special options for slope triangle */
        slopetriangle: {
            /**#@+
             * @visprop
             */

            fillColor: 'red',
            fillOpacity: 0.4,
            highlightFillColor: 'red',
            highlightFillOpacity: 0.3,

            /**
             * Attributes for the gliding helper point.
             * 
             * @type Point
             * @name Slopetriangle#glider
             */
            glider: {
                fixed: true,
                visible: false,
                withLabel: false
            },

            /**
             * Attributes for the base line.
             * 
             * @type Line
             * @name Slopetriangle#baseline
             */
            baseline: {
                visible: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for the base point.
             * 
             * @type Point
             * @name Slopetriangle#basepoint
             */
            basepoint: {
                visible: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for the top point.
             * 
             * @type Point
             * @name Slopetriangle#toppoint
             */
            toppoint: {
                visible: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for the slope triangle label.
             * 
             * @type Label
             * @name Slopetriangle#label
             */
            label: {
                visible: true
            }
            /**#@-*/
        },

        /* special options for step functions */
        stepfunction: {
            /**#@+
             * @visprop
             */

            /**#@-*/
        },

        /* special tape measure options */
        tapemeasure: {
            /**#@+
             * @visprop
             */

            strokeColor: '#000000',
            strokeWidth: 2,
            highlightStrokeColor: '#000000',

            /**
             * Show tape measure ticks.
             * 
             * @type Boolean
             * @name Tapemeasure#withTicks
             * @default true
             */
            withTicks: true,

            /**
             * Show tape measure label.
             * 
             * @type Boolean
             * @name Tapemeasure#withLabel
             * @default true
             */
            withLabel: true,

            /**
             * The precision of the tape measure value displayed in the optional text.
             * @memberOf Tapemeasure.prototype
             * @name precision
             * @type Number
             * @default 2
             */
            precision: 2,

            /**
             * Attributes for first helper point defining the tape measure position.
             * 
             * @type Point
             * @name Tapemeasure#point1
             */
            point1: {
                strokeColor: '#000000',
                fillColor: '#ffffff',
                fillOpacity: 0.0,
                highlightFillOpacity: 0.1,
                size: 6,
                snapToPoints: true,
                attractorUnit: 'screen',
                attractorDistance: 20,
                showInfobox: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for second helper point defining the tape measure position.
             * 
             * @type Point
             * @name Tapemeasure#point2
             */
            point2: {
                strokeColor: '#000000',
                fillColor: '#ffffff',
                fillOpacity: 0.0,
                highlightFillOpacity: 0.1,
                size: 6,
                snapToPoints: true,
                attractorUnit: 'screen',
                attractorDistance: 20,
                showInfobox: false,
                withLabel: false,
                name: ''
            },

            /**
             * Attributes for the ticks of the tape measure.
             * 
             * @type Ticks
             * @name Tapemeasure#ticks
             */
            ticks: {
                drawLabels: false,
                drawZero: true,
                insertTicks: true,
                minorHeight: 8,
                majorHeight: 16,
                minorTicks: 4,
                tickEndings: [0, 1],
                defaultDistance: 0.1,
                strokeOpacity: 1,
                strokeWidth: 1,
                strokeColor: '#000000'
            },

            /**
             * Attributes for the tape measure label.
             * 
             * @type Label
             * @name Tapemeasure#label
             */
            label: {
                position: 'top'
            }
            /**#@-*/
        },

        /* special text options */
        text: {
            /**#@+
             * @visprop
             */

            /**
             * The font size in pixels.
             * 
             * @name fontSize
             * @memberOf Text.prototype
             * @default 12
             * @type Number
             */
            fontSize: 12,

            /**
             * Used to round texts given by a number.
             * 
             * @name digits
             * @memberOf Text.prototype
             * @default 2
             * @type Number
             */
            digits: 2,

            /**
             * If set to true, the text is parsed and evaluated.
             * For labels parse==true results in converting names of the form k_a to subscripts.
             * If the text is given by string and parse==true, the string is parsed as
             * JessieCode expression.
             * 
             * @name parse
             * @memberOf Text.prototype
             * @default true
             * @type Boolean
             */
            parse: true,

            /**
             * If set to true and caja's sanitizeHTML function can be found it
             * will be used to sanitize text output.
             * 
             * @name useCaja
             * @memberOf Text.prototype
             * @default false
             * @type Boolean
             */
            useCaja: false,

            /**
             * If enabled, the text will be handled as label. Intended for internal use.
             * 
             * @name isLabel
             * @memberOf Text.prototype
             * @default false
             * @type Boolean
             */
            isLabel: false,

            strokeColor: 'black',
            highlightStrokeColor: 'black',
            highlightStrokeOpacity: 0.666666,

            /**
             * If true the input will be given to ASCIIMathML before rendering.
             * 
             * @name useASCIIMathML
             * @memberOf Text.prototype
             * @default false
             * @type Boolean
             */
            useASCIIMathML: false,

            /**
             * If true MathJax will be used to render the input string.
             * 
             * @name useMathJax
             * @memberOf Text.prototype
             * @default false
             * @type Boolean
             */
            useMathJax: false,

            /**
             * Determines the rendering method of the text. Possible values
             * include <tt>'html'</tt> and <tt>'internal</tt>.
             * 
             * @name display
             * @memberOf Text.prototype
             * @default 'html'
             * @type String
             */
            display: 'html',

            /**
             * Anchor element {@link Point}, {@link Text} or {@link Image} of the text. If it exists, the coordinates of the text are relative
             * to this anchor element.
             * 
             * @name anchor
             * @memberOf Text.prototype
             * @default null
             * @type Object
             */
            anchor: null,

            /**
             * The horizontal alignment of the text. Possible values include <tt>'left'</tt>, <tt>'middle'</tt>, and
             * <tt>'right'</tt>.
             * 
             * @name anchorX
             * @memberOf Text.prototype
             * @default 'left'
             * @type String
             */
            anchorX: 'left',

            /**
             * The vertical alignment of the text. Possible values include <tt>'top'</tt>, <tt>'middle'</tt>, and
             * <tt>'bottom'</tt>.
             * 
             * @name anchorY
             * @memberOf Text.prototype
             * @default 'middle'
             * @type String
             */
            anchorY: 'middle',

            /**
             * The precision of the slider value displayed in the optional text.
             * 
             * @name cssClass
             * @memberOf Text.prototype
             * @type String
             */
            cssClass: 'JXGtext',

            /**
             * The precision of the slider value displayed in the optional text.
             * 
             * @name highlightCssClass
             * @memberOf Text.prototype
             * @type String
             */
            highlightCssClass: 'JXGtext',

            /** 
             * Sensitive area for dragging the text.
             * Possible values are 'all', or something else.
             * This may be extended to left, right, ... in the future.
             * 
             * @name Text#dragArea
             * @type String
             * @default 'all'
             */
            dragArea: 'all',

            withLabel: false,

            /**
             * Text rotation in degrees. 
             * Works for non-zero values only in combination with display=='internal'.
             * 
             * @name Text#rotate
             * @type Number
             * @default 0
             */
            rotate: 0,

            visible: true,

            /**
             * Defines together with {@link Text#snapSizeY} the grid the text snaps on to.
             * The text will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * 
             * @name snapSizeX
             * @memberOf Text.prototype
             * 
             * @see JXG.Point#snapToGrid
             * @see Text#snapSizeY
             * @see JXG.Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link Text#snapSizeX} the grid the text snaps on to.
             * The text will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * 
             * @name snapSizeY
             * @memberOf Text.prototype
             * 
             * @see JXG.Point#snapToGrid
             * @see Text#snapSizeX
             * @see JXG.Board#defaultAxes
             * @type Number
             * @default 1
             */
            snapSizeY: 1,

            /**
             * List of attractor elements. If the distance of the text is less than
             * attractorDistance the text is made to glider of this element.
             * 
             * @name attractors
             * @memberOf Text.prototype
             * @type array
             * @default empty
             */
            attractors: []

            /**#@-*/
        },

        /* special options for trace curves */
        tracecurve: {
            /**#@+
             * @visprop
             */
            strokeColor: '#000000',
            fillColor: 'none',

            /**
             * The number of evaluated data points.
             * @memberOf Tracecurve.prototype
             * @default 100
             * @name numberPoints
             * @type Number
             */
            numberPoints: 100

            /**#@-*/
        },

        /*special turtle options */
        turtle: {
            /**#@+
             * @visprop
             */

            strokeWidth: 1,
            fillColor: 'none',
            strokeColor: '#000000',

            /**
             * Attributes for the turtle arrow.
             * 
             * @type Curve
             * @name Turtle#arrow
             */
            arrow: {
                strokeWidth: 2,
                withLabel: false,
                strokeColor: '#ff0000'
            }
            /**#@-*/
        },

        /* special html slider options */
        checkbox: {
            /**#@+
             * @visprop
             */

            /**#@-*/
        },

        /* special input options */
        input: {
            /**#@+
             * @visprop
             */

            /**#@-*/
        },

        /* special button options */
        button: {
            /**#@+
             * @visprop
             */

            /**#@-*/
        },

        /**
         * Abbreviations of properties. Setting the shortcut means setting abbreviated properties
         * to the same value.
         * It is used in {@link JXG.GeometryElement#setAttribute} and in
         * the constructor {@link JXG.GeometryElement}.
         * Attention: In Options.js abbreviations are not allowed.
         */
        shortcuts: {
            color: ['strokeColor', 'fillColor'],
            opacity: ['strokeOpacity', 'fillOpacity'],
            highlightColor: ['highlightStrokeColor', 'highlightFillColor'],
            highlightOpacity: ['highlightStrokeOpacity', 'highlightFillOpacity'],
            strokeWidth: ['strokeWidth', 'highlightStrokeWidth']
        }

    };

    /**
     * Holds all possible properties and the according validators for geometry elements. A validator is either a function
     * which takes one parameter and returns true, if the value is valid for the property, or it is false if no validator
     * is required.
     */
    JXG.Validator = (function () {
        var i,
            validatePixel = function (v) {
                return (/^[0-9]+px$/).test(v);
            },
            validateDisplay = function (v) {
                return (v  === 'html' || v === 'internal');
            },
            validateColor = function (v) {
                // for now this should do it...
                return Type.isString(v);
            },
            validatePointFace = function (v) {
                return Type.exists(JXG.normalizePointFace(v));
            },
            validateInteger = function (v) {
                return (Math.abs(v - Math.round(v)) < Mat.eps);
            },
            validatePositiveInteger = function (v) {
                return validateInteger(v) && v > 0;
            },
            validateScreenCoords = function (v) {
                return v.length >= 2 && validateInteger(v[0]) && validateInteger(v[1]);
            },
            validateRenderer = function (v) {
                return (v === 'vml' || v === 'svg' || v === 'canvas' || v === 'no');
            },
            validatePositive = function (v) {
                return v > 0;
            },
            validateNotNegative = function (v) {
                return v >= 0;
            },
            v = {},
            validators = {
                attractorDistance: validateNotNegative,
                color: validateColor,
                defaultDistance: Type.isNumber,
                display: validateDisplay,
                doAdvancedPlot: false,
                draft: false,
                drawLabels: false,
                drawZero: false,
                face: validatePointFace,
                factor: Type.isNumber,
                fillColor: validateColor,
                fillOpacity: Type.isNumber,
                firstArrow: false,
                fontSize: validateInteger,
                dash: validateInteger,
                gridX: Type.isNumber,
                gridY: Type.isNumber,
                hasGrid: false,
                highlightFillColor: validateColor,
                highlightFillOpacity: Type.isNumber,
                highlightStrokeColor: validateColor,
                highlightStrokeOpacity: Type.isNumber,
                insertTicks: false,
                //: validateScreenCoords,
                lastArrow: false,
                majorHeight: validateInteger,
                minorHeight: validateInteger,
                minorTicks: validateNotNegative,
                minTicksDistance: validatePositiveInteger,
                numberPointsHigh: validatePositiveInteger,
                numberPointsLow: validatePositiveInteger,
                opacity: Type.isNumber,
                radius: Type.isNumber,
                RDPsmoothing: false,
                renderer: validateRenderer,
                right: validatePixel,
                showCopyright: false,
                showInfobox: false,
                showNavigation: false,
                size: validateInteger,
                snapSizeX: validatePositive,
                snapSizeY: validatePositive,
                snapWidth: Type.isNumber,
                snapToGrid: false,
                snatchDistance: validateNotNegative,
                straightFirst: false,
                straightLast: false,
                stretch: false,
                strokeColor: validateColor,
                strokeOpacity: Type.isNumber,
                strokeWidth: validateInteger,
                takeFirst: false,
                takeSizeFromFile: false,
                to10: false,
                toOrigin: false,
                translateTo10: false,
                translateToOrigin: false,
                useASCIIMathML: false,
                useDirection: false,
                useMathJax: false,
                withLabel: false,
                withTicks: false,
                zoom: false
            };

        // this seems like a redundant step but it makes sure that
        // all properties in the validator object have lower case names
        // and the validator object is easier to read.
        for (i in validators) {
            if (validators.hasOwnProperty(i)) {
                v[i.toLowerCase()] = validators[i];
            }
        }

        return v;
    }());

    /**
     * All point faces can be defined with more than one name, e.g. a cross faced point can be given
     * by face equal to 'cross' or equal to 'x'. This method maps all possible values to fixed ones to
     * simplify if- and switch-clauses regarding point faces. The translation table is as follows:
     * <table>
     * <tr><th>Input</th><th>Output</th></tr>
     * <tr><td>cross, x</td><td>x</td></tr>
     * <tr><td>circle, o</td><td>o</td></tr>
     * <tr><td>square, []</td><td>[]</td></tr>
     * <tr><td>plus, +</td><td>+</td></tr>
     * <tr><td>diamond, &lt;&gt;</td><td>&lt;&gt;</td></tr>
     * <tr><td>triangleup, a, ^</td><td>A</td></tr>
     * <tr><td>triangledown, v</td><td>v</td></tr>
     * <tr><td>triangleleft, &lt;</td><td>&lt;</td></tr>
     * <tr><td>triangleright, &gt;</td><td>&gt;</td></tr>
     * </table>
     * @param {String} s A string which should determine a valid point face.
     * @returns {String} Returns a normalized string or undefined if the given string is not a valid
     * point face.
     */
    JXG.normalizePointFace = function (s) {
        var map = {
            cross: 'x',
            x: 'x',
            circle: 'o',
            o: 'o',
            square: '[]',
            '[]': '[]',
            plus: '+',
            '+': '+',
            diamond: '<>',
            '<>': '<>',
            triangleup: '^',
            a: '^',
            '^': '^',
            triangledown: 'v',
            v: 'v',
            triangleleft: '<',
            '<': '<',
            triangleright: '>',
            '>': '>'
        };

        return map[s];
    };


    /**
     * Apply the options stored in this object to all objects on the given board.
     * @param {JXG.Board} board The board to which objects the options will be applied.
     */
    JXG.useStandardOptions = function (board) {
        var el, t, p, copyProps,
            o = JXG.Options,
            boardHadGrid = board.hasGrid;

        board.options.grid.hasGrid = o.grid.hasGrid;
        board.options.grid.gridX = o.grid.gridX;
        board.options.grid.gridY = o.grid.gridY;
        board.options.grid.gridColor = o.grid.gridColor;
        board.options.grid.gridOpacity = o.grid.gridOpacity;
        board.options.grid.gridDash = o.grid.gridDash;
        board.options.grid.snapToGrid = o.grid.snapToGrid;
        board.options.grid.snapSizeX = o.grid.SnapSizeX;
        board.options.grid.snapSizeY = o.grid.SnapSizeY;
        board.takeSizeFromFile = o.takeSizeFromFile;

        copyProps = function (p, o) {
            p.visProp.fillcolor = o.fillColor;
            p.visProp.highlightfillcolor = o.highlightFillColor;
            p.visProp.strokecolor = o.strokeColor;
            p.visProp.highlightstrokecolor = o.highlightStrokeColor;
        };

        for (el in board.objects) {
            if (board.objects.hasOwnProperty(el)) {
                p = board.objects[el];
                if (p.elementClass === Const.OBJECT_CLASS_POINT) {
                    copyProps(p, o.point);
                } else if (p.elementClass === Const.OBJECT_CLASS_LINE) {
                    copyProps(p, o.line);

                    for (t = 0; t < p.ticks.length; t++) {
                        p.ticks[t].majorTicks = o.line.ticks.majorTicks;
                        p.ticks[t].minTicksDistance = o.line.ticks.minTicksDistance;
                        p.ticks[t].visProp.minorheight = o.line.ticks.minorHeight;
                        p.ticks[t].visProp.majorheight = o.line.ticks.majorHeight;
                    }
                } else if (p.elementClass === Const.OBJECT_CLASS_CIRCLE) {
                    copyProps(p, o.circle);
                } else if (p.type === Const.OBJECT_TYPE_ANGLE) {
                    copyProps(p, o.angle);
                } else if (p.type === Const.OBJECT_TYPE_ARC) {
                    copyProps(p, o.arc);
                } else if (p.type === Const.OBJECT_TYPE_POLYGON) {
                    copyProps(p, o.polygon);
                } else if (p.type === Const.OBJECT_TYPE_CONIC) {
                    copyProps(p, o.conic);
                } else if (p.type === Const.OBJECT_TYPE_CURVE) {
                    copyProps(p, o.curve);
                } else if (p.type === Const.OBJECT_TYPE_SECTOR) {
                    p.arc.visProp.fillcolor = o.sector.fillColor;
                    p.arc.visProp.highlightfillcolor = o.sector.highlightFillColor;
                    p.arc.visProp.fillopacity = o.sector.fillOpacity;
                    p.arc.visProp.highlightfillopacity = o.sector.highlightFillOpacity;
                }
            }
        }

        board.fullUpdate();
        if (boardHadGrid && !board.hasGrid) {
            board.removeGrids(board);
        } else if (!boardHadGrid && board.hasGrid) {
            board.create('grid', []);
        }
    };

    /**
     * Converts all color values to greyscale and calls useStandardOption to put them onto the board.
     * @param {JXG.Board} board The board to which objects the options will be applied.
     * @see #useStandardOptions
     */
    JXG.useBlackWhiteOptions = function (board) {
        var o = JXG.Options;
        o.point.fillColor = Color.rgb2bw(o.point.fillColor);
        o.point.highlightFillColor = Color.rgb2bw(o.point.highlightFillColor);
        o.point.strokeColor = Color.rgb2bw(o.point.strokeColor);
        o.point.highlightStrokeColor = Color.rgb2bw(o.point.highlightStrokeColor);

        o.line.fillColor = Color.rgb2bw(o.line.fillColor);
        o.line.highlightFillColor = Color.rgb2bw(o.line.highlightFillColor);
        o.line.strokeColor = Color.rgb2bw(o.line.strokeColor);
        o.line.highlightStrokeColor = Color.rgb2bw(o.line.highlightStrokeColor);

        o.circle.fillColor = Color.rgb2bw(o.circle.fillColor);
        o.circle.highlightFillColor = Color.rgb2bw(o.circle.highlightFillColor);
        o.circle.strokeColor = Color.rgb2bw(o.circle.strokeColor);
        o.circle.highlightStrokeColor = Color.rgb2bw(o.circle.highlightStrokeColor);

        o.arc.fillColor = Color.rgb2bw(o.arc.fillColor);
        o.arc.highlightFillColor = Color.rgb2bw(o.arc.highlightFillColor);
        o.arc.strokeColor = Color.rgb2bw(o.arc.strokeColor);
        o.arc.highlightStrokeColor = Color.rgb2bw(o.arc.highlightStrokeColor);

        o.polygon.fillColor = Color.rgb2bw(o.polygon.fillColor);
        o.polygon.highlightFillColor  = Color.rgb2bw(o.polygon.highlightFillColor);

        o.sector.fillColor = Color.rgb2bw(o.sector.fillColor);
        o.sector.highlightFillColor  = Color.rgb2bw(o.sector.highlightFillColor);

        o.curve.strokeColor = Color.rgb2bw(o.curve.strokeColor);
        o.grid.gridColor = Color.rgb2bw(o.grid.gridColor);

        JXG.useStandardOptions(board);
    };

    // needs to be exported
    JXG.Options.normalizePointFace = JXG.normalizePointFace;

    return JXG.Options;
});
