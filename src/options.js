/*
    Copyright 2008-2014
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
     */
    JXG.Options = {
        jc: {
            enabled: true,
            compile: true
        },

        /* Options that are used directly within the board class */
        board: {
            boundingBox: [-5, 5, 5, -5],
            zoomFactor: 1,
            zoomX: 1,
            zoomY: 1,
            showCopyright: true,
            axis: false,
            
            /**
             * Display of navigation arrors and zoom buttons
             */
            showNavigation: false,
            
            /**
             * Show a button to force reload of a construction.
             * Works only with the JessieCode tag
             */
            showReload: true,
            
            /**
             * Show a buttons which allows to clear all traces of a board.
             */
            showClearTraces: true,
            
            keepAspectRatio: false,
            // if true the first element with hasPoint==true is taken.
            takeFirst: false,
            // If true, the construction - when read from a file or string - the size of the div can be changed.
            takeSizeFromFile: false,
            renderer: 'svg',
            animationDelay: 35,
            registerEvents: true,
            minimizeReflow: 'svg',
            /**
             * A number that will be added to the absolute position of the board used in mouse coordinate
             * calculations in {@link #getCoordsTopLeftCorner}.
             * @type {number}
             */
            offsetX: 0,
            /**
             * A number that will be added to the absolute position of the board used in mouse coordinate
             * calculations in {@link #getCoordsTopLeftCorner}.
             * @type {number}
             */
            offsetY: 0,
            zoom: {
                factorX: 1.25,
                factorY: 1.25,
                wheel: false,
                needshift: false,
                eps: 0.1
            },
            pan: {
                needShift: true,
                needTwoFingers: true,
                enabled: true
            }
        },

        /* navbar options */
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

        /**
         * Generic options
         */

        /* geometry element options */
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

        ticks: {
            /**#@+
             * @visprop
             */

            /**
             * A function that expects two {@link JXG.Coords}, the first one representing the coordinates of the
             * tick that is to be labeled, the second one the coordinates of the center (the tick with position 0).
             * @type function
             * @name JXG.Ticks#generateLabelValue
             */
            generateLabelValue: null,

            /**
             * Draw labels yes/no
             * @type Boolean
             * @name JXG.Ticks#drawLabels
             * @default false
             */
            drawLabels: false,
            label: {},

            /**
             * Determine the position of the tick with value 0. 'left' means point1 of the line, 'right' means point2,
             * and 'middle' is equivalent to the midpoint of the defining points. This attribute is ignored if the parent
             * line is of type axis and is parallel to either the x (i.e. y = 0) or the y (i.e. x = 0) axis.
             * @type String
             * @name JXG.Ticks#anchor
             * @default 'left'
             */
            anchor: 'left',

            /**
             * Draw the zero tick, that lies at line.point1?
             * @type Boolean
             * @name JXG.Ticks#drawZero
             * @default false
             */
            drawZero: false,

            /**
             * If the distance between two ticks is too big we could insert new ticks. If insertTicks
             * is <tt>true</tt>, we'll do so, otherwise we leave the distance as is.
             * This option is ignored if equidistant is false. In the example below the distance between
             * two ticks is given as <tt>1</tt> but because insertTicks is set to true many ticks will
             * be omitted in the rendering process to keep the display clear.
             * @type Boolean
             * @name JXG.Ticks#insertTicks
             * @see JXG.Ticks#equidistant
             * @see JXG.Ticks#minTicksDistance
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
             * @type Number
             * @name JXG.Ticks#minorHeight
             */
            minorHeight: 4,

            /**
             * Total height of a major tick. If negative the full height of the board is taken.
             * @type Number
             * @name JXG.Ticks#majorHeight
             */
            majorHeight: 10,

            /**
             * Decides in which direction finite ticks are visible. Possible values are 0=false or 1=true.
             * In case of [0,1] the tick is only visible to the right of the line. In case of
             * [1,0] the tick is only visible to the left of the line.
             * @type Array
             * @name JXG.Ticks#tickEndings
             */
            tickEndings: [1, 1],

            /**
             * The number of minor ticks between two major ticks.
             * @type Number
             * @name JXG.Ticks#minorTicks
             */
            minorTicks: 4,

            /**
             * Scale the ticks but not the tick labels.
             * @type Number
             * @default 1
             * @name JXG.Ticks#scale
             * @see JXG.Ticks#scaleSymbol
             */
            scale: 1,

            /**
             * A string that is appended to every tick, used to represent the scale
             * factor given in {@link JXG.Ticks#scaleSymbol}.
             * @type String
             * @default ''
             * @name JXG.Ticks#scaleSymbol
             * @see JXG.Ticks#scale
             */
            scaleSymbol: '',

            /**
             * User defined labels for special ticks. Instead of the i-th tick's position, the i-th string stored in this array
             * is shown. If the number of strings in this array is less than the number of special ticks, the tick's position is
             * shown as a fallback.
             * @type Array
             * @name JXG.Ticks#labels
             * @default []
             */
            labels: [],

            /**
             * The maximum number of characters a tick label can use.
             * @type Number
             * @name JXG.Ticks#maxLabelLength
             * @see JXG.Ticks#precision
             * @default 3
             */
            maxLabelLength: 5,

            /**
             * If a label exceeds {@link JXG.Ticks#maxLabelLength} this determines the precision used to shorten the tick label.
             * @type Number
             * @name JXG.Ticks#precision
             * @see JXG.Ticks#maxLabelLength
             * @default 3
             */
            precision: 3,

            /**
             * The default distance between two ticks. Please be aware that this value does not have
             * to be used if {@link JXG.Ticks#insertTicks} is set to true.
             * @type Number
             * @name JXG.Ticks#ticksDistance
             * @see JXG.Ticks#equidistant
             * @see JXG.Ticks#insertTicks
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
             * @type Boolean
             * @name JXG.Ticks#includeBoundaries
             * @default  false
             */
            includeBoundaries: false
            // close the meta tag
            /**#@-*/
        },

        hatch: {
            drawLabels: false,
            drawZero: true,
            majorHeight: 20,
            anchor: 'middle',
            strokeWidth: 2,
            strokeColor: 'blue',
            ticksDistance: 0.2
        },

        /* precision options */
        precision: {
            touch: 30,
            touchMax: 100,
            mouse: 4,
            epsilon: 0.0001,
            hasPoint: 4
        },

        /* Default ordering of the layers */
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
            grid: 1,
            image: 0,
            trace: 0
        },

        /**
         * element type specific options
         */
        /* special angle options */
        angle: {
            withLabel: true,

            /**
             * Radius of the sector, displaying the angle.
             * @type Number
             * @default 0.5
             * @name Angle#radius
             * @visprop
             */
            radius: 0.5,

            /**
             * Display type of the angle field. Possible values are
             * 'sector' or 'sectordot' or 'square' or 'none'.
             * @type String
             * @default sector
             * @name Angle#type
             * @visprop
             */
            type: 'sector',

            /**
             * Display type of the angle field in case of a right angle. Possible values are
             * 'sector' or 'sectordot' or 'square' or 'none'.
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
            }
        },

        /* special arc options */
        arc: {
            label: {},
            firstArrow: false,
            lastArrow: false,
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            useDirection: false
        },

        /* special axis options */
        axis: {
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
            /* line ticks options */
            ticks: {
                label: {
                    offset: [4, -12 + 3],     // This seems to be a good offset for 12 point fonts
                    parse: false
                },
                needsRegularUpdate: false,
                strokeWidth: 1,
                strokeColor: '#666666',
                highlightStrokeColor: '#888888',
                drawLabels: true,
                drawZero: false,
                insertTicks: true,
                minTicksDistance: 10,
                minorHeight: 10,          // if <0: full width and height
                majorHeight: -1,          // if <0: full width and height
                tickEndings: [0, 1],
                minorTicks: 4,
                ticksDistance: 1,         // TODO doc
                strokeOpacity: 0.25
            },
            point1: {                  // Default values for point1 if created by line
                needsRegularUpdate: false
            },
            point2: {                  // Default values for point2 if created by line
                needsRegularUpdate: false
            },
            label: {
                position: 'lft',
                offset: [10, -20]
            }
        },

        /* special options for bisector of 3 points */
        bisector: {
            strokeColor: '#000000', // Bisector line
            point: {               // Bisector point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
        },

        /* special options for the 2 bisectors of 2 lines */
        bisectorlines: {
            line1: {               //
                strokeColor: 'black'
            },
            line2: {               //
                strokeColor: 'black'
            }
        },

        /* special chart options */
        chart: {
            chartStyle: 'line',
            colors: ['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#C3D9FF', '#4096EE', '#008C00'],
            highlightcolors: null,
            fillcolor: null,
            highlightonsector: false,
            highlightbysize: false,
            label: {
            }
        },

        /*special circle options */
        circle: {
            hasInnerPoints: false,
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            center: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },
            label: {
                position: 'urt'
            }
        },

        /* special options for circumcircle of 3 points */
        circumcircle: {
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            center: {               // center point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
        },

        circumcirclearc: {
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            center: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            }
        },

        /* special options for circumcircle sector of 3 points */
        circumcirclesector: {
            useDirection: true,
            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
        },

        /* special conic options */
        conic: {
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            foci: {
                // points
                fixed: false,
                visible: false,
                withLabel: false,
                name: ''
            }
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
             * @name JXG.Curve#handDrawing
             * @type Boolean
             * @default false
             */
            handDrawing: false,

            /**
             * The curveType is set in @see generateTerm and used in {@link JXG.Curve#updateCurve}.
             * Possible values are <ul>
             * <li>'none'</li>
             * <li>'plot': Data plot</li>
             * <li>'parameter': we can not distinguish function graphs and parameter curves</li>
             * <li>'functiongraph': function graph</li>
             * <li>'polar'</li>
             * <li>'implicit' (not yet)</li></ul>
             * Only parameter and plot are set directly. Polar is set with {@link JXG.GeometryElement#setAttribute} only.
             * @name JXG.Curve#curveType
             */
            curveType: null,
            RDPsmoothing: false,     // Apply the Ramer-Douglas-Peuker algorithm
            numberPointsHigh: 1600,  // Number of points on curves after mouseUp
            numberPointsLow: 400,    // Number of points on curves after mousemove
            doAdvancedPlot: true,    // Use the algorithm by Gillam and Hohenwarter
                                     // It is much slower, but the result is better

            label: {
                position: 'lft'
            }

            /**#@-*/
        },

        glider: {
            label: {}
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
            imageString: null,
            fillOpacity: 1.0,
            cssClass: 'JXGimage',
            highlightCssClass: 'JXGimageHighlight',
            rotate: 0
        },

        /* special options for incircle of 3 points */
        incircle: {
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeColor: '#0000ff',
            highlightStrokeColor: '#C3D9FF',
            center: {               // center point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
        },

        inequality: {
            fillColor: 'red',
            fillOpacity: 0.2,
            strokeColor: 'none',

            /**
             * By default an inequality is less (or equal) than. Set inverse to <tt>true</tt> will consider the inequality
             * greater (or equal) than.
             * @type Boolean
             * @default false
             * @name Inequality#inverse
             * @visprop
             */
            inverse: false
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
            parse: false

            /**#@-*/
        },


        /* special options for integral */
        integral: {
            axis: 'x',        // 'x' or 'y'
            withLabel: true,    // Show integral value as text
            strokeWidth: 0,
            strokeOpacity: 0,
            fillOpacity: 0.8,
            curveLeft: {    // Start point
                visible: true,
                withLabel: false,
                layer: 9
            },
            baseLeft: {    // Start point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },
            curveRight: {      // End point
                visible: true,
                withLabel: false,
                layer: 9
            },
            baseRight: {      // End point
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },
            label: {
                fontSize: 20
            }
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
             * @name JXG.Intersection.alwaysIntersect
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
            highlightStrokeOpacity: 1,
            highlightStrokeColor: '#C3D9FF',

            fixed: true,
            /**
             * Possible string values for the position of a label for
             * label anchor points are:
             * 'lft'|'rt'|'top'|'bot'|'ulft'|'urt'|'llft'|'lrt'
             * This is relevant for non-points: line, circle, curve.
             * @type String
             * @default 'urt'
             * @name JXG.GeometryElement#label.position
             */
            position: 'urt',

            /**
             *  Label offset from label anchor
             *  The label anchor is determined by JXG.GeometryElement#label.position
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
        },

        /* special line options */
        line: {
            /**#@+
             * @visprop
             */

            firstArrow: false,
            lastArrow: false,
            straightFirst: true,
            straightLast: true,
            fillColor: 'none',               // Important for VML on IE
            highlightFillColor: 'none',  // Important for VML on IE
            strokeColor: '#0000ff',
            highlightStrokeColor: '#888888',
            withTicks: false,

            /**#@-*/

            point1: {                  // Default values for point1 if created by line
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },
            point2: {                  // Default values for point2 if created by line
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            },
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

            label: {
                position: 'llft'
            },

            /**
             * If set to true, the point will snap to a grid defined by
             * {@link JXG.Point#snapSizeX} and {@link JXG.Point#snapSizeY}.
             * @see JXG.Point#snapSizeX
             * @see JXG.Point#snapSizeY
             * @type Boolean
             * @name JXG.Point#snapToGrid
             * @default false
             */
            snapToGrid: false,

            /**
             * Defines together with {@link JXG.Point#snapSizeY} the grid the point snaps on to.
             * The point will only snap on values multiple to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * @see JXG.Point#snapToGrid
             * @see JXG.Point#snapSizeY
             * @see JXG.Board#defaultAxes
             * @type Number
             * @name JXG.Point#snapSizeX
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link JXG.Point#snapSizeX} the grid the point snaps on to.
             * The point will only snap on values multiple to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * @see JXG.Point#snapToGrid
             * @see JXG.Point#snapSizeX
             * @see JXG.Board#defaultAxes
             * @type Number
             * @name JXG.Point#snapSizeY
             * @default 1
             */
            snapSizeY: 1
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
            strokeColor: '#000000', //  normal line
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            }
        },

        /* special options for orthogonal projectionn points */
        orthogonalprojection: {
        },

        /* special options for parallel lines */
        parallel: {
            strokeColor: '#000000', // Parallel line
            point: {
                visible: false,
                fixed: false,
                withLabel: false,
                name: ''
            },
            label: {
                position: 'llft'
            }
        },

        /* special perpendicular options */
        perpendicular: {
            strokeColor: '#000000', // Perpendicular line
            straightFirst: true,
            straightLast: true
        },

        /* special perpendicular options */
        perpendicularsegment: {
            strokeColor: '#000000', // Perpendicular segment
            straightFirst: false,
            straightLast: false,
            point: {               // Perpendicular point
                visible: false,
                fixed: true,
                withLabel: false,
                name: ''
            }
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
             * replaced by {@link JXG.Point#face} and {@link JXG.Point#size}.
             * @see JXG.Point#face
             * @see JXG.Point#size
             * @type Number
             * @default JXG.Options.point#style
             * @name JXG.Point#style
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
             * @type string
             * @see JXG.Point#setStyle
             * @default circle
             * @name JXG.Point#face
             */
            face: 'o',

            /**
             * Size of a point.
             * Means radius resp. half the width of a point (depending on the face).
             * @see JXG.Point#face
             * @type number
             * @see JXG.Point#setStyle
             * @default 3
             * @name JXG.Point#size
             */
            size: 3,
            fillColor: '#ff0000',
            highlightFillColor: '#EEEEEE',
            strokeWidth: 2,
            strokeColor: '#ff0000',
            highlightStrokeColor: '#C3D9FF',
            zoom: false,             // Change the point size on zoom

            /**
             * If true, the infobox is shown on mouse over, else not.
             * @name JXG.Point#showInfobox
             * @type Boolean
             * @default true
             */
            showInfobox: true,

            /**
             * Truncating rule for the digits in the infobox.
             * 'auto': done automatically by JXG#autoDigits
             * 'none': no truncation
             * number: use String.toFixed();
             * @name JXG.Point#showInfobox
             * @type String, Number
             * @default true
             */
            infoboxDigits: 'auto',

            draft: false,

            /**
             * List of attractor elements. If the distance of the point is less than
             * attractorDistance the point is made to glider of this element.
             * @type array
             * @name JXG.Point#attractors
             * @default empty
             */
            attractors: [],

            /**
             * Unit for attractorDistance and snatchDistance, used for magnetized points and for snapToPoints.
             * Possible values are 'screen' and 'user.
             * @see JXG.Point#attractorDistance
             * @see JXG.Point#snatchDistance
             * @see JXG.Point#snapToPoints
             * @see JXG.Point#attractors
             * @type string
             * @name JXG.Point#attractorDistance
             * @default 'user'
             */
            attractorUnit: 'user',    // 'screen', 'user'

            /**
             * If the distance of the point to one of its attractors is less
             * than this number the point will be a glider on this
             * attracting element.
             * If set to zero nothing happens.
             * @type number
             * @name JXG.Point#attractorDistance
             * @default 0
             */
            attractorDistance: 0.0,

            /**
             * If the distance of the point to one of its attractors is at least
             * this number the point will be released from being a glider on the
             * attracting element.
             * If set to zero nothing happens.
             * @type number
             * @name JXG.Point#snatchDistance
             * @default 0
             */
            snatchDistance: 0.0,

            /**
             * If set to true, the point will snap to a grid defined by
             * {@link JXG.Point#snapSizeX} and {@link JXG.Point#snapSizeY}.
             * @see JXG.Point#snapSizeX
             * @see JXG.Point#snapSizeY
             * @type Boolean
             * @name JXG.Point#snapToGrid
             * @default false
             */
            snapToGrid: false,

            /**
             * Defines together with {@link JXG.Point#snapSizeY} the grid the point snaps on to.
             * The point will only snap on values multiple to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default x axes of the board.
             * @see JXG.Point#snapToGrid
             * @see JXG.Point#snapSizeY
             * @see JXG.Board#defaultAxes
             * @type Number
             * @name JXG.Point#snapSizeX
             * @default 1
             */
            snapSizeX: 1,

            /**
             * Defines together with {@link JXG.Point#snapSizeX} the grid the point snaps on to.
             * The point will only snap on values multiple to snapSizeX in x and snapSizeY in y direction.
             * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
             * of the default ticks of the default y axes of the board.
             * @see JXG.Point#snapToGrid
             * @see JXG.Point#snapSizeX
             * @see JXG.Board#defaultAxes
             * @type Number
             * @name JXG.Point#snapSizeY
             * @default 1
             */
            snapSizeY: 1,

            /**
             * If set to true, the point will snap to the nearest point in distance of
             * {@link JXG.Point#attractorDistance}.
             * @see JXG.Point#attractorDistance
             * @type Boolean
             * @name JXG.Point#snapToPoints
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
             * @see JXG.GeometryElement#hasPoint
             * @name JXG.Polygon#hasInnerPoints
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
             * @type Boolean
             * @name JXG.Polygon#withLines
             * @default true
             */
            withLines: true,

            /**#@-*/

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
             *  Points for regular polygons
             */
            vertices: {
                withLabel: true,
                strokeColor: '#ff0000',
                fillColor: '#ff0000',
                fixed: true
            },

            label: {
                offset: [0, 0]
            }
        },

        /* special prescribed angle options */
        prescribedangle: {
            anglepoint: {
                size: 2,
                visible: false,
                withLabel: false
            }
        },

        /* special options for riemann sums */
        riemannsum: {
            withLabel: false,
            fillOpacity: 0.3,
            fillColor: '#ffff00'
        },

        /* special sector options */
        sector: {
            fillColor: '#00FF00',
            highlightFillColor: '#00FF00',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            highlightOnSector: false,
            radiuspoint: {
                visible: false,
                withLabel: false
            },
            center: {
                visible: false,
                withLabel: false
            },
            anglepoint: {
                visible: false,
                withLabel: false
            },
            label: {
                offset: [0, 0]
            }
        },

        /* special segment options */
        segment: {
            label: {
                position: 'top'
            }
        },

        semicircle: {
            midpoint: {
                visible: false,
                withLabel: false,
                fixed: false,
                name: ''
            }
        },

        /* special slider options */
        slider: {
            /**#@+
             * @visprop
             */

            /**
             * The slider only returns multiples of this value, e.g. for discrete values set this property to <tt>1</tt>. For
             * continuous results set this to <tt>-1</tt>.
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
             */
            precision: 2,
            firstArrow: false,
            lastArrow: false,
            withTicks: true,
            withLabel: true,

            layer: 9,
            showInfobox: false,
            name: '',
            visible: true,
            strokeColor: '#000000',
            highlightStrokeColor: '#888888',
            fillColor: '#ffffff',
            highlightFillColor: 'none',
            size: 6,

            /**#@-*/

            point1: {
                needsRegularUpdate: false,
                showInfobox: false,
                withLabel: false,
                visible: false,
                fixed: true,
                name: ''
            },
            point2: {
                needsRegularUpdate: false,
                showInfobox: false,
                withLabel: false,
                visible: false,
                fixed: true,
                name: ''
            },
            baseline: {
                needsRegularUpdate: false,
                fixed: true,
                name: '',
                strokeWidth: 1,
                strokeColor: '#000000',
                highlightStrokeColor: '#888888'
            },
            /* line ticks options */
            ticks: {
                needsRegularUpdate: false,
                fixed: true,
                drawLabels: false,
                drawZero: true,
                insertTicks: true,
                minorHeight: 4,          // if <0: full width and height
                majorHeight: 10,        // if <0: full width and height
                minorTicks: 0,
                defaultDistance: 1,
                strokeOpacity: 1,
                strokeWidth: 1,
                strokeColor: '#000000'
            },
            highline: {
                strokeWidth: 3,
                fixed: true,
                name: '',
                strokeColor: '#000000',
                highlightStrokeColor: '#888888'
            },
            label: {
                strokeColor: '#000000'
            }
        },
        
        /* special options for step functions */
        stepfunction: {
        },

        /* special tape measure options */
        tapemeasure: {
            strokeColor: '#000000',
            strokeWidth: 2,
            highlightStrokeColor: '#000000',
            withTicks: true,
            withLabel: true,
            precision: 2,

            //layer: 9,
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

            label: {
                position: 'top'
            }
        },

        /* special text options */
        text: {
            /**#@+
             * @visprop
             */

            /**
             * The font size in pixels.
             * @memberOf Text.prototype
             * @default 12
             * @name fontSize
             * @type Number
             */
            fontSize: 12,

            /**
             * Used to round texts given by a number.
             * @memberOf Text.prototype
             * @default 2
             * @name digits
             * @type Number
             */
            digits: 2,

            /**
             * If set to
             * @memberOf Text.prototype
             * @default true
             * @name parse
             * @type Boolean
             */
            parse: true,

            /**
             * If set to true and caja's sanitizeHTML function can be found it
             * will be used to sanitize text output.
             * @memberOf Text.prototype
             * @default false
             * @name useCaja
             * @type Boolean
             */
            useCaja: false,

            /**
             * If enabled, the text will be handled as label. Intended for internal use.
             * @memberOf Text.prototype
             * @default false
             * @name isLabel
             * @type Boolean
             */
            isLabel: false,

            strokeColor: 'black',

            /**
             * If true the input will be given to ASCIIMathML before rendering.
             * @memberOf Text.prototype
             * @default false
             * @name useASCIIMathML
             * @type Boolean
             */
            useASCIIMathML: false,

            /**
             * If true MathJax will be used to render the input string.
             * @memberOf Text.prototype
             * @default false
             * @name useMathJax
             * @type Boolean
             */
            useMathJax: false,

            /**
             * Determines the rendering method of the text. Possible values
             * include <tt>'html'</tt> and <tt>'internal</tt>.
             * @memberOf Text.prototype
             * @default 'html'
             * @name display
             * @type String
             */
            display: 'html',

            /**
             * The horizontal alignment of the text. Possible values include <tt>'left'</tt>, <tt>'middle'</tt>, and
             * <tt>'right'</tt>.
             * @memberOf Text.prototype
             * @default 'left'
             * @name anchorX
             * @type String
             */
            anchorX: 'left',

            /**
             * The vertical alignment of the text. Possible values include <tt>'top'</tt>, <tt>'middle'</tt>, and
             * <tt>'bottom'</tt>.
             * @memberOf Text.prototype
             * @default 'middle'
             * @name anchorY
             * @type String
             */
            anchorY: 'middle',
            /**
             * The precision of the slider value displayed in the optional text.
             * @memberOf Text.prototype
             * @name cssClass
             * @type String
             */
            cssClass: 'JXGtext',

            /**
             * The precision of the slider value displayed in the optional text.
             * @memberOf Text.prototype
             * @name highlightCssClass
             * @type String
             */
            highlightCssClass: 'JXGtext',
            dragArea: 'all',                  // 'all', or something else (may be extended to left, right, ...)
            withLabel: false,
            rotate: 0,                        // works for non-zero values only in combination with display=='internal'
            visible: true

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
            strokeWidth: 1,
            fillColor: 'none',
            strokeColor: '#000000',
            arrow: {
                strokeWidth: 2,
                withLabel: false,
                strokeColor: '#ff0000'
            }
        },


        /**
         * Abbreviations of properties. Setting the shortcut means setting abbreviated properties
         * to the same value.
         * It is used in JXG.GeometryElement#setAttribute and in
         * the constructor JXG.GeometryElement.
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
                minorTicks: validatePositiveInteger,
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
