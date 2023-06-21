/*
    Copyright 2008-2023
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG:true, define: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "./jxg";
import Const from "./base/constants";
import Mat from "./math/math";
import Color from "./utils/color";
import Type from "./utils/type";

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
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingbox: [-5, 5, 5, -5],
         *         axis: true
         *     });
         */
        boundingBox: [-5, 5, 5, -5],

        /**
         * Maximal bounding box of the visible area in user coordinates.
         * It is an array consisting of four values:
         * [x<sub>1</sub>, y<sub>1</sub>, x<sub>2</sub>, y<sub>2</sub>]
         *
         * The bounding box of the canvas must be inside of this maximal
         * boundings box.
         * @name JXG.Board#maxboundingbox
         * @type Array
         * @see JXG.Board#boundingbox
         * @default [-Infinity, Infinity, Infinity, -Infinity]
         *
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingbox: [-5, 5, 5, -5],
         *         maxboundingbox: [-8, 8, 8, -8],
         *         pan: {enabled: true},
         *         axis: true
         *     });
         *
         * </pre><div id="JXG065e2750-217c-48ed-a52b-7d7df6de7055" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG065e2750-217c-48ed-a52b-7d7df6de7055', {
         *             showcopyright: false, shownavigation: false,
         *             boundingbox: [-5,5,5,-5],
         *             maxboundingbox: [-8,8,8,-8],
         *             pan: {enabled: true},
         *             axis:true
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        maxBoundingBox: [-Infinity, Infinity, Infinity, -Infinity],

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
         * Title string for the board.
         * Primarily used in an invisible text element which is adressed by
         * the attribute 'aria-labelledby' from the JSXGraph container.
         * JSXGraph creates a new div-element with id "{containerid}_ARIAlabel"
         * containing this string.
         *
         * @name JXG.Board#title
         * @see JXG.Board#description
         * @type String
         * @default ''
         *
         */
        title: '',

        /**
         * Description string for the board.
         * Primarily used in an invisible text element which is adressed by
         * the attribute 'aria-describedby' from the JSXGraph container.
         * JSXGraph creates a new div-element with id "{containerid}_ARIAdescription"
         * containing this string.
         *
         * @name JXG.Board#description
         * @see JXG.Board#title
         * @type String
         * @default ''
         *
         */
        description: '',

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
         * If shown, the horizontal axis can be accessed via JXG.Board.defaultAxes.x, the
         * vertical axis can be accessed via JXG.Board.defaultAxes.y.
         * Both axes have a sub-element "defaultTicks".
         *
         * Value can be Boolean or an object containing axis attributes.
         *
         * @name JXG.Board#axis
         * @type Boolean
         * @default false
         */
        axis: false,

        /**
         * Attributes for the default axes in case of the attribute
         * axis:true in {@link JXG.JSXGraph#initBoard}.
         *
         * @name JXG.Board#defaultAxes
         * @type Object
         * @default {x: {name:'x'}, y: {name: 'y'}}
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('id', {
         *     boundingbox: [-5, 5, 5, -5], axis:true,
         *     defaultAxes: {
         *         x: {
         *           name: 'Distance (mi)',
         *           withLabel: true,
         *           label: {
         *             position: 'rt',
         *             offset: [-5, 15],
         *             anchorX: 'right'
         *           }
         *         },
         *         y: {
         *           withLabel: true,
         *           name: 'Y',
         *           label: {
         *             position: 'rt',
         *             offset: [-20, -5],
         *             anchorY: 'top'
         *           }
         *         }
         *     }
         * });
         *
         * </pre><div id="JXGc3af5eb8-7401-4476-80b5-379ecbd068c6" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     var board = JXG.JSXGraph.initBoard('JXGc3af5eb8-7401-4476-80b5-379ecbd068c6', {
         *         showcopyright: false, shownavigation: false,
         *         boundingbox: [-5, 5, 5, -5], axis:true,
         *         defaultAxes: {
         *             x: {
         *               name: 'Distance (mi)',
         *               withLabel: true,
         *               label: {
         *                 position: 'rt',
         *                 offset: [-5, 15],
         *                 anchorX: 'right'
         *               }
         *             },
         *             y: {
         *               withLabel: true,
         *               name: 'Y',
         *               label: {
         *                 position: 'rt',
         *                 offset: [-20, -5],
         *                 anchorY: 'top'
         *               }
         *             }
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        defaultAxes: {
            x: {
                name: 'x',
                fixed: true,
                ticks: {
                    label: {
                        visible: 'inherit',
                        anchorX: 'middle',
                        anchorY: 'top',
                        fontSize: 12,
                        offset: [0, -3]
                    },
                    tickEndings: [0, 1],
                    majorTickEndings: [1, 1],
                    drawZero: false,
                    needsRegularUpdate: false,
                    visible: 'inherit'
                }
            },
            y: {
                name: 'y',
                fixed: true,
                ticks: {
                    label: {
                        visible: 'inherit',
                        anchorX: 'right',
                        anchorY: 'middle',
                        fontSize: 12,
                        offset: [-6, 0]
                    },
                    tickEndings: [1, 0],
                    majorTickEndings: [1, 1],
                    drawZero: false,
                    needsRegularUpdate: false,
                    visible: 'inherit'
                }
            }
        },

        /**
         * Display of navigation arrows and zoom buttons in the navigation bar.
         *
         * @name JXG.Board#showNavigation
         * @type Boolean
         * @default true
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showNavigation: true,

        /**
         * Display of zoom buttons in the navigation bar. To show zoom buttons, additionally
         * showNavigation has to be set to true.
         *
         * @name JXG.Board#showZoom
         * @type Boolean
         * @default true
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showZoom: true,

        /**
         * Show a button in the navigation bar to force reload of a construction.
         * Works only with the JessieCode tag.
         *
         * @name JXG.Board#showReload
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showReload: false,

        /**
         * Show a button in the navigation bar to enable screenshots.
         *
         * @name JXG.Board#showScreenshot
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showScreenshot: false,

        /**
         * Attributes to control the screenshot function.
         * The following attributes can be set:
         * <ul>
         *  <li>scale: scaling factor (default=1.0)
         *  <li>type: format of the screenshot image. Default: png
         *  <li>symbol: Unicode symbol which is shown in the navigation bar. Default: '\u2318'
         *  <li>css: CSS rules to format the div element containing the screen shot image
         *  <li>cssButton: CSS rules to format the close button of the div element containing the screen shot image
         * </ul>
         *
         * @name JXG.Board#screenshot
         * @type Object
         */
        screenshot: {
            scale: 1.0,
            type: 'png',
            symbol: '\u2318', //'\u22b9', //'\u26f6',
            css: 'background-color:#eeeeee; opacity:1.0; border:2px solid black; border-radius:10px; text-align:center',
            cssButton: 'padding: 4px 10px; border: solid #356AA0 1px; border-radius: 5px; position: absolute; right: 2ex; top: 2ex; background-color: rgba(255, 255, 255, 0.3);'
        },

        /**
         * Show a button in the navigation bar to start fullscreen mode.
         *
         * @name JXG.Board#showFullscreen
         * @type Boolean
         * @see JXG.Board#fullscreen
         * @default false
         * @see JXG.AbstractRenderer#drawZoomBar
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showFullscreen: false,

        /**
         * Attribute(s) to control the fullscreen icon. The attribute "showFullscreen"
         * controls if the icon is shown.
         * The following attribute(s) can be set:
         * <ul>
         *  <li> symbol (String): Unicode symbol which is shown in the navigation bar.  Default: svg code for '\u26f6', other
         * possibilities are the unicode symbols '\u26f6' and '\u25a1'. However, '\u26f6' is not supported by MacOS and iOS.
         *  <li> scale (number between 0 and 1): Relative size of the larger side of the JSXGraph board in the fullscreen window. 1.0 gives full width or height.
         * Default value is 0.85.
         *  <li> id (String): Id of the HTML element which is brought to full screen or null if the JSXgraph div is taken.
         * It may be an outer div element, e.g. if the old aspect ratio trick is used. Default: null, i.e. use the JSXGraph div.
         * </ul>
         *
         * @example
         * var board = JXG.JSXGraph.initBoard('35bec5a2-fd4d-11e8-ab14-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true,
         *             showcopyright: false,
         *             showFullscreen: true,
         *             fullscreen: {
         *                  symbol: '\u22c7',
         *                  scale: 0.95
         *              }
         *             });
         * var pol = board.create('polygon', [[0, 1], [3,4], [1,-4]], {fillColor: 'yellow'});
         *
         * </pre><div id="JXGa35bec5a2-fd4d-11e8-ab14-901b0e1b8723" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGa35bec5a2-fd4d-11e8-ab14-901b0e1b8723',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false,
         *              showFullscreen: true,
         *              fullscreen: {
         *                  symbol: '\u22c7',
         *                  scale: 0.95
         *                  }
         *             });
         *     var pol = board.create('polygon', [[0, 1], [3,4], [1,-4]], {fillColor: 'yellow'});
         *     })();
         *
         * </script><pre>
         *
         * @name JXG.Board#fullscreen
         * @default svg code
         * @see JXG.Board#showFullscreen
         * @see JXG.AbstractRenderer#drawZoomBar
         * @type Object
         */
        fullscreen: {
            symbol: '<svg height="1em" width="1em" version="1.1" viewBox="10 10 18 18"><path fill="#666" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path><path fill="#666" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path><path fill="#666" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path><path fill="#666" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path></svg>',
            // '\u25a1', // '\u26f6' (not supported by MacOS),
            scale: 0.85,
            id: null
        },

        /**
         * Show a button which allows to clear all traces of a board.
         *
         * @name JXG.Board#showClearTraces
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawZoomBar
         */
        showClearTraces: false,

        /**
         * If set to true, the ratio between horizontal and vertical unit sizes
         * stays constant - independent of size changes of the hosting HTML div element.
         * <p>
         * If the aspect ration of the hosting div changes, JSXGraphs will change
         * the user supplied bounding box accordingly.
         * This is necessary if circles should look like circles and not
         * like ellipses. It is recommended to set keepAspectRatio = true
         * for geometric applets.
         * <p>
         * For function plotting keepAspectRatio = false
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
         * Maximum number of digits in automatic label generation.
         * For example, if set to 1 automatic point labels end at "Z".
         * If set to 2, point labels end at "ZZ".
         *
         * @name JXG.Board#maxNameLength
         * @see JXG.Board#generateName
         * @type Number
         * @default 1
         */
        maxNameLength: 1,

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
         * Default rendering engine. Possible values are 'svg', 'canvas', 'vml', 'no', or 'auto'.
         * If the rendering engine is not available JSXGraph tries to detect a different engine.
         *
         * <p>
         * In case of 'canvas' it is advisable to call 'board.update()' after all elements have been
         * constructed. This ensures that all elements are drawn with their intended visual appearance.
         *
         * @name JXG.Board#renderer
         * @type String
         * @default 'auto'
         */
        renderer: 'auto',

        /**
         * Time (in msec) between two animation steps. Used in
         * {@link JXG.CoordsElement#moveAlong}, {@link JXG.CoordsElement#moveTo} and
         * {@link JXG.CoordsElement#visit}.
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
         * Maximum frame rate of the board, i.e. maximum number of updates per second
         * triggered by move events.
         *
         * @name JXG.Board#maxFrameRate
         * @type Number
         * @default 40
         */
        maxFrameRate: 40,

        /**
         * Allow user interaction by registering mouse, pointer, keyboard or touch events.
         * Decide if JSXGraph listens to these events. Keyboard events can then turned off
         * separately with the keyboard attribute.
         *
         * @name JXG.Board#registerEvents
         * @see JXG.Board#keyboard
         * @see JXG.Board#registerResizeEvent
         * @see JXG.Board#registerFullscreenEvent
         * @type Boolean
         * @default true
         */
        registerEvents: true,

        /**
         * Listen to resize events, i.e. start "resizeObserver" or handle the resize event with
         * "resizeListener". This is independent from the mouse, touch, pointer events.
         *
         * @name JXG.Board#registerResizeEvent
         * @see JXG.Board#registerEvents
         * @see JXG.Board#registerFullscreenEvent
         * @type Boolean
         * @default true
         */
        registerResizeEvent: true,

        /**
         * Listen to fullscreen event.
         *
         * @name JXG.Board#registerFullscreenEvents
         * @see JXG.Board#registerEvents
         * @see JXG.Board#registerResizeEvent
         * @type Boolean
         * @default true
         */
        registerFullscreenEvent: true,

        /**
         * Change redraw strategy in SVG rendering engine.
         * <p>
         * This optimization seems to be <b>obsolete</b> in newer browsers (from 2021 on, at least)
         * and even slow down the constructions. Therefore, the default is set to 'none' since v1.2.4.
         * <p>
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
         *
         * @name JXG.Board#minimizeReflow
         * @type String
         * @default 'none'
         */
        minimizeReflow: 'none',

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
         *   wheel: true,     // allow zooming by mouse wheel or
         *   				   // by pinch-to-toom gesture on touch devices
         *   needShift: true,   // mouse wheel zooming needs pressing of the shift key
         *   min: 0.001,        // minimal values of {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}, limits zoomOut
         *   max: 1000.0,       // maximal values of {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}, limits zoomIn
         *
         *   pinchHorizontal: true, // Allow pinch-to-zoom to zoom only horizontal axis
         *   pinchVertical: true,   // Allow pinch-to-zoom to zoom only vertical axis
         *   pinchSensitivity: 7    // Sensitivity (in degrees) for recognizing horizontal or vertical pinch-to-zoom gestures.
         * }
         * </pre>
         *
         * Deprecated: zoom.eps which is superseded by zoom.min
         *
         * @name JXG.Board#zoom
         * @type Object
         * @default
         */
        zoom: {
            enabled: true,
            factorX: 1.25,
            factorY: 1.25,
            wheel: true,
            needShift: true,
            min: 0.0001,
            max: 10000.0,
            pinchHorizontal: true,
            pinchVertical: true,
            pinchSensitivity: 7
        },

        /**
         * Control the possibilities for panning interaction (i.e. moving the origin).
         *
         * Possible sub-attributes with default values are:
         * <pre>
         * pan: {
         *   enabled: true   // Allow panning
         *   needTwoFingers: false, // panning is done with two fingers on touch devices
         *   needShift: true, // mouse panning needs pressing of the shift key
         * }
         * </pre>
         *
         * @name JXG.Board#pan
         * @see JXG.Board#browserPan
         *
         * @type Object
         */
        pan: {
            enabled: true,
            needShift: true,
            needTwoFingers: false
        },

        /**
         * Enable browser scrolling on touch interfaces if the user double taps into an empty region
         * of the board.
         *
         * <ul>
         * <li> Implemented for pointer touch devices - not with mouse, pen or old iOS touch.
         * <li> It only works if browserPan:true
         * <li> One finger action by the settings "pan.enabled:true" and "pan.needTwoFingers:false" has priority
         * </ul>
         *
         * @name JXG.Board#browserPan
         * @see JXG.Board#pan
         * @type Boolean
         * @default false
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-5, 5, 5, -5], axis: true,
         *     pan: {
         *         enabled: true,
         *         needTwoFingers: true,
         *     },
         *     browserPan: true,
         *     zoom: {
         *         enabled: false
         *     }
         * });
         *
         * var p1 = board.create('point', [1, -1]);
         * var p2 = board.create('point', [2.5, -2]);
         * var li1 = board.create('line', [p1, p2]);
         *
         * </pre><div id="JXGcd50c814-be81-4280-9458-d73e50cece8d" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGcd50c814-be81-4280-9458-d73e50cece8d',
         *             {showcopyright: false, shownavigation: false,
         *              axis: true,
         *              pan: {
         *                enabled: true,
         *                needTwoFingers: true,
         *             },
         *             browserPan: true,
         *             zoom: {
         *               enabled: false
         *             }
         *          });
         *
         *     var p1 = board.create('point', [1, -1]);
         *     var p2 = board.create('point', [2.5, -2]);
         *     var li1 = board.create('line', [p1, p2]);
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        browserPan: false,

        /**
         * Control the possibilities for dragging objects.
         *
         * Possible sub-attributes with default values are:
         * <pre>
         * drag: {
         *   enabled: true   // Allow dragging
         * }
         * </pre>
         *
         * @name JXG.Board#drag
         * @type Object
         * @default {enabled: true}
         */
        drag: {
            enabled: true
        },

        /**
         * Control using the keyboard to change the construction.
         * <ul>
         * <li> enabled: true / false
         * <li> dx: horizontal shift amount per key press
         * <li> dy: vertical shift amount per key press
         * <li> panShift: zoom if shift key is pressed
         * <li> panCtrl: zoom if ctrl key is pressed
         * </ul>
         *
         * @example
         * var board = JXG.JSXGraph.initBoard("jxgbox", {boundingbox: [-5,5,5,-5],
         *     axis: true,
         *     showCopyright:true,
         *     showNavigation:true,
         *     keyboard: {
         *         enabled: true,
         *         dy: 30,
         *         panShift: true,
         *         panCtrl: false
         *     }
         * });
         *
         * </pre><div id="JXGb1d3aab6-ced2-4fe9-8fa5-b0accc8c7266" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb1d3aab6-ced2-4fe9-8fa5-b0accc8c7266',
         *             {boundingbox: [-5,5,5,-5],
         *         axis: true,
         *         showCopyright:true,
         *         showNavigation:true,
         *         keyboard: {
         *             enabled: true,
         *             dy: 30,
         *             panShift: true,
         *             panCtrl: false
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @see JXG.Board#keyDownListener
         * @see JXG.Board#keyFocusInListener
         * @see JXG.Board#keyFocusOutListener
         *
         * @name JXG.Board#keyboard
         * @type Object
         * @default {enabled: true, dx: 10, dy:10, panShift: true, panCtrl: false}
         */
        keyboard: {
            enabled: true,
            dx: 10,
            dy: 10,
            panShift: true,
            panCtrl: false
        },

        /**
         * Control if JSXGraph reacts to resizing of the JSXGraph container element
         * by the user / browser.
         * The attribute "throttle" determines the minimal time in msec between to
         * resize calls.
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#resizeListener
         *
         * @name JXG.Board#resize
         * @type Object
         * @default {enabled: true, throttle: 10}
         *
         * @example
         *     var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingbox: [-5,5,5,-5],
         *         keepAspectRatio: true,
         *         axis: true,
         *         resize: {enabled: true, throttle: 200}
         *     });
         *
         * </pre><div id="JXGb55d4608-5d71-4bc3-b332-18c15fbda8c3" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb55d4608-5d71-4bc3-b332-18c15fbda8c3', {
         *             boundingbox: [-5,5,5,-5],
         *             keepAspectRatio: true,
         *             axis: true,
         *             resize: {enabled: true, throttle: 200}
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        resize: {
            enabled: true,
            throttle: 10
        },

        /**
         * Element which listens to move events of the pointing device.
         * This allows to drag elements of a JSXGraph construction outside of the board.
         * Especially, on mobile devices this enhances the user experience.
         * However, it is recommended to allow dragging outside of the JSXGraph board only
         * in certain constructions where users may not "loose" points outside of the board.
         * Then points may become unreachable.
         * <p>
         * A situation where dragging outside of the board is uncritical is for example if
         * only sliders are used to interact with the construction.
         * <p>
         * Possible values for this attributes are:
         * <ul>
         * <li> an element specified by document.getElementById('some id');
         * <li> null: to use the JSXgraph container div element
         * <li> document
         * </ul>
         *
         * @name JXG.Board#moveTarget
         * @type HTML node or document
         * @default null
         *
         * @example
         *     var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingbox: [-5,5,5,-5],
         *         axis: true,
         *         moveTarget: document
         *     });
         *
         * </pre><div id="JXG973457e5-c63f-4516-8570-743f2cc560e1" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG973457e5-c63f-4516-8570-743f2cc560e1',
         *             {boundingbox: [-5,5,5,-5],
         *             axis: true,
         *             moveTarget: document
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        moveTarget: null,

        /**
         * Control the possibilities for a selection rectangle.
         * Starting a selection event triggers the "startselecting" event.
         * When the mouse pointer is released, the "stopselecting" event is fired.
         * The "stopselecting" event must be supplied by the user.
         * <p>
         * Possible sub-attributes with default values are:
         * <pre>
         * selection: {
         *   enabled: false,
         *   name: 'selectionPolygon',
         *   needShift: false,  // mouse selection needs pressing of the shift key
         *   needCtrl: true,    // mouse selection needs pressing of the shift key
         *   withLines: false,  // Selection polygon has border lines
         *   vertices: {
         *       visible: false
         *   },
         *   fillColor: '#ffff00',
         *   visible: false      // Initial visibility. Should be set to false always
         * }
         * </pre>
         * <p>
         * Board events triggered by selection manipulation:
         * 'startselecting', 'stopselecting', 'mousestartselecting', 'mousestopselecting',
         * 'pointerstartselecting', 'pointerstopselecting', 'touchstartselecting', 'touchstopselecting'.
         *
         * @example
         * board.on('stopselecting', function(){
         *     var box = board.stopSelectionMode(),
         *     // bbox has the coordinates of the selectionr rectangle.
         *     // Attention: box[i].usrCoords have the form [1, x, y], i.e.
         *     // are homogeneous coordinates.
         *     bbox = box[0].usrCoords.slice(1).concat(box[1].usrCoords.slice(1));
         *     // Set a new bounding box
         *     board.setBoundingBox(bbox, false);
         * });
         *
         * @name JXG.Board#selection
         *
         * @see JXG.Board#startSelectionMode
         * @see JXG.Board#stopSelectionMode
         *
         * @type Object
         * @default
         */
        selection: {
            enabled: false,
            name: 'selectionPolygon',
            needShift: false,
            needCtrl: true,
            withLines: false,
            vertices: {
                visible: false
            },
            fillColor: '#ffff00',
            visible: false
        },

        /**
         * If true, the infobox is shown on mouse/pen over for all points
         * which have set their attribute showInfobox to 'inherit'.
         * If a point has set its attribute showInfobox to false or true,
         * that value will have priority over this value.
         *
         * @name JXG.Board#showInfobox
         * @see Point#showInfobox
         * @type Boolean
         * @default true
         */
        showInfobox: true,

        /**
         * If enabled, user activities are logged in array "board.userLog".
         *
         * @name JXG.Board#logging
         * @type Object
         * @default {enabled: false}
         *
         * @example
         * var board = JXG.JSXGraph.initBoard(BOARDID,
         *          {
         *              boundingbox: [-8, 8, 8,-8],
         *              axis: true,
         *              logging: {enabled: true},
         *              showcopyright: false,
         *              shownavigation: false
         *          });
         * var A = board.create('point', [-4, 0], { name: 'A' });
         * var B = board.create('point', [1, 2], { name: 'B' });
         * var showUserLog = function() {
         *     var txt = '';
         *
         *     for (let i = 0; i < board.userLog.length; i++) {
         *         txt += JSON.stringify(board.userLog[i]) + '\n';
         *     }
         *     alert(txt);
         * };
         * var but = board.create('button', [4, 4, 'Show user log', showUserLog]);
         *
         * </pre><div id="JXGe152375c-f478-41aa-a9e6-e104403fc75d" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGe152375c-f478-41aa-a9e6-e104403fc75d',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, logging: {enabled: true},
         *              showcopyright: false, shownavigation: false});
         *     var A = board.create('point', [-4, 0], { name: 'A' });
         *     var B = board.create('point', [1, 2], { name: 'B' });
         *     var showUserLog = function() {
         *         var txt = '';
         *
         *         for (let i = 0; i < board.userLog.length; i++) {
         *             txt += JSON.stringify(board.userLog[i]) + '\n';
         *         }
         *         alert(txt);
         *     };
         *     var but = board.create('button', [4, 4, 'Show user log', showUserLog]);
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @see JXG.Board#userLog
         */
        logging: {
            enabled: false
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
     * These settings are overruled by the CSS class 'JXG_navigation'.
     * @deprecated
     * @type Object
     * @name JXG.Options#navbar
     *
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
        strokeColor: Color.palette.blue,

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
        highlightStrokeColor: '#c3d9ff',

        /**
         * The fill color of this geometry element.
         * @type String
         * @name JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default {@link JXG.Options.elements.color#fillColor}
         */
        fillColor: Color.palette.red,

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
         * @type Number
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
         * @type Number
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
         * @type Number
         * @name JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default {@link JXG.Options.elements.color#fillOpacity}
         */
        fillOpacity: 1,

        /**
         * Opacity for fill color when the object is highlighted.
         * @type Number
         * @name JXG.GeometryElement#highlightFillOpacity
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillOpacity
         * @default {@link JXG.Options.elements.color#highlightFillOpacity}
         */
        highlightFillOpacity: 1,

        /**
         * Gradient type. Possible values are 'linear'. 'radial' or null.
         *
         * @example
         *     var a = board.create('slider', [[0, -0.2], [3.5, -0.2], [0, 0, 2 * Math.PI]], {name: 'angle'});
         *     var b = board.create('slider', [[0, -0.4], [3.5, -0.4], [0, 0, 1]], {name: 'offset1'});
         *     var c = board.create('slider', [[0, -0.6], [3.5, -0.6], [0, 1, 1]], {name: 'offset2'});
         *
         *     var pol = board.create('polygon', [[0, 0], [4, 0], [4,4], [0,4]], {
         *                 fillOpacity: 1,
         *                 fillColor: 'yellow',
         *                 gradient: 'linear',
         *                 gradientSecondColor: 'blue',
         *                 gradientAngle: function() { return a.Value(); },
         *                 gradientStartOffset: function() { return b.Value(); },
         *                 gradientEndOffset: function() { return c.Value(); },
         *                 hasInnerPoints: true
         *         });
         *
         * </pre><div id="JXG3d04b5fd-0cd4-4f49-8c05-4e9686cd7ff0" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG3d04b5fd-0cd4-4f49-8c05-4e9686cd7ff0',
         *             {boundingbox: [-1.5, 4.5, 5, -1.5], axis: true, showcopyright: false, shownavigation: false});
         *         var a = board.create('slider', [[0, -0.2], [3.5, -0.2], [0, 0, 2 * Math.PI]], {name: 'angle'});
         *         var b = board.create('slider', [[0, -0.4], [3.5, -0.4], [0, 0, 1]], {name: 'offset1'});
         *         var c = board.create('slider', [[0, -0.6], [3.5, -0.6], [0, 1, 1]], {name: 'offset2'});
         *
         *         var pol = board.create('polygon', [[0, 0], [4, 0], [4,4], [0,4]], {
         *                     fillOpacity: 1,
         *                     fillColor: 'yellow',
         *                     gradient: 'linear',
         *                     gradientSecondColor: 'blue',
         *                     gradientAngle: function() { return a.Value(); },
         *                     gradientStartOffset: function() { return b.Value(); },
         *                     gradientEndOffset: function() { return c.Value(); },
         *                     hasInnerPoints: true
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *     var cx = board.create('slider', [[0, -.2], [3.5, -.2], [0, 0.5, 1]], {name: 'cx, cy'});
         *     var fx = board.create('slider', [[0, -.4], [3.5, -.4], [0, 0.5, 1]], {name: 'fx, fy'});
         *     var o1 = board.create('slider', [[0, -.6], [3.5, -.6], [0, 0.0, 1]], {name: 'offset1'});
         *     var o2 = board.create('slider', [[0, -.8], [3.5, -.8], [0, 1, 1]], {name: 'offset2'});
         *     var r = board.create('slider', [[0, -1], [3.5, -1], [0, 0.5, 1]], {name: 'r'});
         *     var fr = board.create('slider', [[0, -1.2], [3.5, -1.2], [0, 0, 1]], {name: 'fr'});
         *
         *     var pol = board.create('polygon', [[0, 0], [4, 0], [4,4], [0,4]], {
         *                 fillOpacity: 1,
         *                 fillColor: 'yellow',
         *                 gradient: 'radial',
         *                 gradientSecondColor: 'blue',
         *                 gradientCX: function() { return cx.Value(); },
         *                 gradientCY: function() { return cx.Value(); },
         *                 gradientR: function() { return r.Value(); },
         *                 gradientFX: function() { return fx.Value(); },
         *                 gradientFY: function() { return fx.Value(); },
         *                 gradientFR: function() { return fr.Value(); },
         *                 gradientStartOffset: function() { return o1.Value(); },
         *                 gradientEndOffset: function() { return o2.Value(); },
         *                 hasInnerPoints: true
         *     });
         *
         * </pre><div id="JXG6081ca7f-0d09-4525-87ac-325a02fe2225" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG6081ca7f-0d09-4525-87ac-325a02fe2225',
         *             {boundingbox: [-1.5, 4.5, 5, -1.5], axis: true, showcopyright: false, shownavigation: false});
         *         var cx = board.create('slider', [[0, -.2], [3.5, -.2], [0, 0.5, 1]], {name: 'cx, cy'});
         *         var fx = board.create('slider', [[0, -.4], [3.5, -.4], [0, 0.5, 1]], {name: 'fx, fy'});
         *         var o1 = board.create('slider', [[0, -.6], [3.5, -.6], [0, 0.0, 1]], {name: 'offset1'});
         *         var o2 = board.create('slider', [[0, -.8], [3.5, -.8], [0, 1, 1]], {name: 'offset2'});
         *         var r = board.create('slider', [[0, -1], [3.5, -1], [0, 0.5, 1]], {name: 'r'});
         *         var fr = board.create('slider', [[0, -1.2], [3.5, -1.2], [0, 0, 1]], {name: 'fr'});
         *
         *         var pol = board.create('polygon', [[0, 0], [4, 0], [4,4], [0,4]], {
         *                     fillOpacity: 1,
         *                     fillColor: 'yellow',
         *                     gradient: 'radial',
         *                     gradientSecondColor: 'blue',
         *                     gradientCX: function() { return cx.Value(); },
         *                     gradientCY: function() { return cx.Value(); },
         *                     gradientR: function() { return r.Value(); },
         *                     gradientFX: function() { return fx.Value(); },
         *                     gradientFY: function() { return fx.Value(); },
         *                     gradientFR: function() { return fr.Value(); },
         *                     gradientStartOffset: function() { return o1.Value(); },
         *                     gradientEndOffset: function() { return o2.Value(); },
         *                     hasInnerPoints: true
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @type String
         * @name JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientSecondColor
         * @see JXG.GeometryElement#gradientSecondOpacity
         * @default null
         */
        gradient: null,

        /**
         * Second color for gradient.
         * @type String
         * @name JXG.GeometryElement#gradientSecondColor
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientSecondOpacity
         * @default '#ffffff'
         */
        gradientSecondColor: '#ffffff',

        /**
         * Opacity of second gradient color. Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientSecondOpacity
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientSecondColor
         * @default 1
         */
        gradientSecondOpacity: 1,

        /**
         * The gradientStartOffset attribute is a number (ranging from 0 to 1) which indicates where the first gradient stop is placed,
         * see the SVG specification for more information.
         * For linear gradients, this attribute represents a location along the gradient vector.
         * For radial gradients, it represents a percentage distance from (fx,fy) to the edge of the outermost/largest circle.
         * @type Number
         * @name JXG.GeometryElement#gradientStartOffset
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientEndOffset
         * @default 0.0
         */
        gradientStartOffset: 0.0,

        /**
         * The gradientEndOffset attribute is a number (ranging from 0 to 1) which indicates where the second gradient stop is placed,
         * see the SVG specification for more information.
         * For linear gradients, this attribute represents a location along the gradient vector.
         * For radial gradients, it represents a percentage distance from (fx,fy) to the edge of the outermost/largest circle.
         * @type Number
         * @name JXG.GeometryElement#gradientEndOffset
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientStartOffset
         * @default 1.0
         */
        gradientEndOffset: 1.0,

        /**
         * Angle (in radians) of the gradiant in case the gradient is of type 'linear'.
         * If the angle is 0, the first color is on the left and the second color is on the right.
         * If the angle is &pi;/2 the first color is on top and the second color at the
         * bottom.
         * @type Number
         * @name JXG.GeometryElement#gradientAngle
         * @see JXG.GeometryElement#gradient
         * @default 0
         */
        gradientAngle: 0,

        /**
         * From the SVG specification: ‘cx’, ‘cy’ and ‘r’ define the largest (i.e., outermost) circle for the radial gradient.
         * The gradient will be drawn such that the 100% gradient stop is mapped to the perimeter of this largest (i.e., outermost) circle.
         * For radial gradients in canvas this is the value 'x1'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientCX
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientCY
         * @see JXG.GeometryElement#gradientR
         * @default 0.5
         */
        gradientCX: 0.5,

        /**
         * From the SVG specification: ‘cx’, ‘cy’ and ‘r’ define the largest (i.e., outermost) circle for the radial gradient.
         * The gradient will be drawn such that the 100% gradient stop is mapped to the perimeter of this largest (i.e., outermost) circle.
         * For radial gradients in canvas this is the value 'y1'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientCY
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientCX
         * @see JXG.GeometryElement#gradientR
         * @default 0.5
         */
        gradientCY: 0.5,

        /**
         * From the SVG specification: ‘cx’, ‘cy’ and ‘r’ define the largest (i.e., outermost) circle for the radial gradient.
         * The gradient will be drawn such that the 100% gradient stop is mapped to the perimeter of this largest (i.e., outermost) circle.
         * For radial gradients in canvas this is the value 'r1'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientR
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientCX
         * @see JXG.GeometryElement#gradientCY
         * @default 0.5
         */
        gradientR: 0.5,

        /**
         * ‘fx’ and ‘fy’ define the focal point for the radial gradient.
         * The gradient will be drawn such that the 0% gradient stop is mapped to (fx, fy).
         * For radial gradients in canvas this is the value 'x0'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientFX
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientFY
         * @see JXG.GeometryElement#gradientFR
         * @default 0.5
         */
        gradientFX: 0.5,

        /**
         * y-coordinate of the circle center for the second color in case of gradient 'radial'. (The attribute fy in SVG)
         * For radial gradients in canvas this is the value 'y0'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientFY
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientFX
         * @see JXG.GeometryElement#gradientFR
         * @default 0.5
         */
        gradientFY: 0.5,

        /**
         * This attribute defines the radius of the start circle of the radial gradient.
         * The gradient will be drawn such that the 0% &lt;stop&gt; is mapped to the perimeter of the start circle.
         * For radial gradients in canvas this is the value 'r0'.
         * Takes a value between 0 and 1.
         * @type Number
         * @name JXG.GeometryElement#gradientFR
         * @see JXG.GeometryElement#gradient
         * @see JXG.GeometryElement#gradientFX
         * @see JXG.GeometryElement#gradientFY
         * @default 0.0
         */
        gradientFR: 0.0,

        /**
         * Transition duration (in milliseconds) for certain cahnges of properties like color and opacity.
         * The properties can be set in the attribute transitionProperties
         * Works in SVG renderer, only.
         * @type Number
         * @name JXG.GeometryElement#transitionDuration
         * @see JXG.GeometryElement#transitionProperties
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default 100 {@link JXG.Options.elements#transitionDuration}
         */
        transitionDuration: 100,

        /**
         * Properties which change smoothly in the time set in transitionDuration.
         * Possible values are
         * ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'width', 'height', 'rx', 'ry']
         * (and maybe more) for geometry elements and
         * ['color', 'opacity', 'all'] for HTML texts.
         *
         * @type Array
         * @name JXG.GeometryElement#transitionProperties
         * @see JXG.GeometryElement#transitionDuration
         *
         *
         * @example
         * var p1 = board.create("point", [0, 2], {
         *     name: "A",
         *     highlightStrokeWidth: 10,
         *     transitionDuration: 1000,
         *     transitionProperties: ['width', 'height', 'stroke-width',
         *         'fill', 'fill-opacity', 'rx', 'ry', 'stroke', 'stroke-opacity'] });
         *
         * </pre><div id="JXGdf5230a1-5870-43db-b6ff-4d5b2f5b786b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGdf5230a1-5870-43db-b6ff-4d5b2f5b786b',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p1 = board.create("point", [0, 2], {
         *         name: "A",
         *         highlightStrokeWidth: 20,
         *         transitionDuration: 1000,
         *         transitionProperties: ['width', 'height', 'stroke-width',
         *             'fill', 'fill-opacity', 'rx', 'ry', 'stroke', 'stroke-opacity'] });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        transitionProperties: ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width'],

        /**
         * Width of the element's stroke.
         * @type Number
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
         * @type Number
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
         * @type Boolean
         * @name JXG.GeometryElement#visible
         * @see JXG.GeometryElement#hideElement
         * @see JXG.GeometryElement#showElement
         * @default true
         */
        visible: true,

        /**
         * A private element will be inaccessible in certain environments, e.g. a graphical user interface.
         *
         * @name JXG.GeometryElement#priv
         * @type Boolean
         * @default false
         */
        priv: false,

        /**
         * Display layer which will contain the element.
         * @name JXG.GeometryElement#layer
         * @see JXG.Options#layer
         * @default See {@link JXG.Options#layer}
         */
        layer: 0,

        /**
         * Line endings (linecap) of a stroke element, i.e. line, circle, curve.
         * Possible values are:
         * <ul>
         * <li> 'butt',
         * <li> 'round',
         * <li> 'square'.
         * </ul>
         * Not available for VML renderer.
         *
         * @name JXG.GeometryElement#lineCap
         * @type String
         * @default 'butt'
         */
        lineCap: 'butt',

        /**
         * Determines the elements border-style.
         * Possible values are:
         * <ul><li>0 for a solid line</li>
         * <li>1 for a dotted line</li>
         * <li>2 for a line with small dashes</li>
         * <li>3 for a line with medium dashes</li>
         * <li>4 for a line with big dashes</li>
         * <li>5 for a line with alternating medium and big dashes and large gaps</li>
         * <li>6 for a line with alternating medium and big dashes and small gaps</li>
         * <li>7 for a dotted line. Needs {@link JXG.GeometryElement#linecap} set to "round" for round dots.</li>
         * </ul>
         * The dash patterns are defined in {@link JXG.AbstractRenderer#dashArray}.
         *
         * @type Number
         * @name JXG.GeometryElement#dash
         * @default 0
         *
         * @see JXG.GeometryElement#lineCap
         * @see JXG.AbstractRenderer#dashArray
         */
        dash: 0,

        /**
         * If enabled:true the (stroke) element will get a customized shadow.
         * <p>
         * Customize <i>color</i> and <i>opacity</i>:
         * If the object's RGB stroke color is <tt>[r,g,b]</tt> and its opacity is <tt>op</i>, and
         * the shadow parameters <i>color</i> is given as <tt>[r', g', b']</tt> and <i>opacity</i> as <tt>op'</tt>
         * the shadow will receive the RGB color
         * <center>
         * <tt>[blend*r + r', blend*g + g', blend*b + b'] </tt>
         * </center>
         * and its opacity will be equal to <tt>op * op'</tt>.
         * Further, the parameters <i>blur</i> and <i>offset</i> can be adjusted.
         * <p>
         * This attribute is only available with SVG, not with canvas.
         *
         * @type Object
         * @name JXG.GeometryElement#shadow
         * @default shadow: {
         *   enabled: false,
         *   color: [0, 0, 0],
         *   opacity: 1,
         *   blur: 3,
         *   blend: 0.1,
         *   offset: [5, 5]
         * }
         *
         * @example
         * board.options.line.strokeWidth = 2
         * // No shadow
         * var li1 = board.create('line', [[-2, 5], [2, 6]], {strokeColor: 'red', shadow: false});
         *
         * // Default shadow
         * var li2 = board.create('line', [[-2, 3], [2, 4]], {strokeColor: 'red', shadow: true});
         *
         * // No shadow
         * var li3 = board.create('line', [[-2, 1], [2, 2]], {strokeColor: 'blue', shadow: {enabled: false}});
         *
         * // Shadow uses same color as line
         * var li4 = board.create('line', [[-2, -1], [2, 0]], {strokeColor: 'blue',
         *             shadow: {enabled: true, color: '#000000', blend: 1}
         *         });
         *
         * // Shadow color as a mixture between black and the line color, additionally set opacity
         * var li5 = board.create('line', [[-2, -3], [2, -2]], {strokeColor: 'blue',
         *             shadow: {enabled: true, color: '#000000', blend: 0.5, opacity: 0.5}
         *         });
         *
         * // Use different value for blur and offset [dx, dy]
         * var li6 = board.create('line', [[-2, -5], [2, -4]], {strokeColor: 'blue',
         *             shadow: {enabled: true, offset:[0, 25], blur: 6}
         *         });
         *
         * </pre><div id="JXG1185a9fa-0fa5-425f-8c15-55b56e1be958" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG1185a9fa-0fa5-425f-8c15-55b56e1be958',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     board.options.line.strokeWidth = 2
         *     // No shadow
         *     var li1 = board.create('line', [[-2, 5], [2, 6]], {strokeColor: 'red', shadow: false});
         *
         *     // Default shadow
         *     var li2 = board.create('line', [[-2, 3], [2, 4]], {strokeColor: 'red', shadow: true});
         *
         *     // No shadow
         *     var li3 = board.create('line', [[-2, 1], [2, 2]], {strokeColor: 'blue', shadow: {enabled: false}});
         *
         *     // Shadow uses same color as line
         *     var li4 = board.create('line', [[-2, -1], [2, 0]], {strokeColor: 'blue',
         *                 shadow: {enabled: true, color: '#000000', blend: 1}
         *             });
         *
         *     // Shadow color as a mixture between black and the line color, additionally set opacity
         *     var li5 = board.create('line', [[-2, -3], [2, -2]], {strokeColor: 'blue',
         *                 shadow: {enabled: true, color: '#000000', blend: 0.5, opacity: 0.5}
         *             });
         *
         *     // Use different value for blur and offset [dx, dy]
         *     var li6 = board.create('line', [[-2, -5], [2, -4]], {strokeColor: 'blue',
         *                 shadow: {enabled: true, offset:[0, 25], blur: 6}
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        shadow: {
            enabled: false,
            color: [0, 0, 0],
            opacity: 1,
            blur: 3,
            blend: 0.1,
            offset: [5, 5]
        },

        /**
         * If true the element will be traced, i.e. on every movement the element will be copied
         * to the background. Use {@link JXG.GeometryElement#clearTrace} to delete the trace elements.
         *
         * The calling of element.setAttribute({trace:false}) additionally
         * deletes all traces of this element. By calling
         * element.setAttribute({trace:'pause'})
         * the removal of already existing traces can be prevented.
         * @see JXG.GeometryElement#clearTrace
         * @see JXG.GeometryElement#traces
         * @see JXG.GeometryElement#numTraces
         * @type Boolean|String
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
         * <p>
         * In case the element is a horizontal or vertical line having ticks, "scalable:true"
         * enables zooming of the board by dragging ticks lines. This feature is enabled,
         * for the ticks element of the line element the attribute "fixed" has to be false
         * and the line element's scalable attribute has to be true.
         * <p>
         * In case the element is a polygon or line and it has the attribute "scalable:false",
         * moving the element with two fingers results in a rotation or translation.
         * <p>
         * If an element is set to be neither scalable nor rotatable, it can only be translated.
         *
         * @type Boolean
         * @default true
         * @name JXG.GeometryElement#scalable
         * @see JXG.Ticks#fixed
         * @see JXG.GeometryElement#rotatable
         */
        scalable: true,

        /**
         * Determines whether two-finger manipulation may rotate this object.
         * If set to false, the object can only be scaled and translated.
         * <p>
         * In case the element is a polygon or line and it has the attribute "rotatable:false",
         * moving the element with two fingers results in a rotation or translation.
         * <p>
         * If an element is set to be neither scalable nor rotatable, it can only be translated.
         *
         * @type Boolean
         * @default true
         * @name JXG.GeometryElement#rotatable
         * @see JXG.GeometryElement#scalable
         */
        rotatable: true,

        /**
         * If the element is dragged it will be moved on mousedown or touchstart to the
         * top of its layer. Works only for SVG renderer and for simple elements
         * consisting of one SVG node.
         * @example
         * var li1 = board.create('line', [1, 1, 1], {strokeWidth: 20, dragToTopOfLayer: true});
         * var li2 = board.create('line', [1, -1, 1], {strokeWidth: 20, strokeColor: 'red'});
         *
         * </pre><div id="JXG38449fee-1ab4-44de-b7d1-43caa1f50f86" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG38449fee-1ab4-44de-b7d1-43caa1f50f86',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var li1 = board.create('line', [1, 1, 1], {strokeWidth: 20, dragToTopOfLayer: true});
         *     var li2 = board.create('line', [1, -1, 1], {strokeWidth: 20, strokeColor: 'red'});
         *
         *     })();
         *
         * </script><pre>
         *
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#dragToTopOfLayer
         */
        dragToTopOfLayer: false,

        /**
         * Precision options for JSXGraph elements.
         * This attributes takes either the value 'inherit' or an object of the form:
         * <pre>
         * precision: {
         *      touch: 30,
         *      mouse: 4,
         *      pen: 4
         * }
         * </pre>
         *
         * In the first case, the global, JSXGraph-wide values of JXGraph.Options.precision
         * are taken.
         *
         * @type {String|Object}
         * @name JXG.GeometryElement#precision
         * @see JXG.Options#precision
         * @default 'inherit'
         */
        precision: 'inherit',

        /**
         * If draft.draft: true the element will be drawn in grey scale colors (as default)
         * to visualize that it's only a draft.
         *
         * @name JXG.GeometryElement#draft
         * @type Object
         * @default {@link JXG.Options.elements.draft#draft}
         */
        draft: {
            draft: false,
            strokeColor: '#565656',
            fillColor: '#565656',
            strokeOpacity: 0.8,
            fillOpacity: 0.8,
            strokeWidth: 1
        },

        /**
         * @name JXG.GeometryElement#isLabel
         * @default false
         * @private
         * By default, an element is not a label. Do not change this.
         */
        isLabel: false,

        /**
         * Controls if an element can get the focus with the tab key.
         * tabindex corresponds to the HTML attribute of the same name.
         * See <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex">descriptiona at MDN</a>.
         * The additional value "null" completely disables focus of an element.
         * The value will be ignored if keyboard control of the board is not enabled or
         * the element is fixed or not visible.
         *
         * @name JXG.GeometryElement#tabindex
         * @type Number
         * @default 0
         * @see JXG.Board#keyboard
         * @see JXG.GeometryElement#fixed
         * @see JXG.GeometryElement#visible
         */
        tabindex: 0,

        /**
         * If true, the dash pattern is multiplied by strokeWidth / 2.
         * @name JXG.GeometryElement#dashScale
         * @type Boolean
         * @default false
         *
         * @see JXG.GeometryElement#dash
         * @see JXG.AbstractRenderer#dashArray
         */
        dashScale: false

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
         * The third parameter is a null, number or a string. In the latter two cases, this value is taken.
         * Returns a string.
         *
         * @type function
         * @name Ticks#generateLabelText
         */
        generateLabelText: null,

        /**
         * A function that expects two {@link JXG.Coords}, the first one representing the coordinates of the
         * tick that is to be labeled, the second one the coordinates of the center (the tick with position 0).
         *
         * @deprecated Use {@link JGX.Options@generateLabelText}
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

        /**
         * Attributes for the ticks labels
         *
         * @name Ticks#label
         * @type Object
         * @default {}
         *
         */
        label: {
        },

        /**
        * Format tick labels that were going to have scientific notation
        * like 5.00e+6 to look like 5•10⁶.
        *
        * @example
        * var board = JXG.JSXGraph.initBoard("jxgbox", {
        *     boundingbox: [-500000, 500000, 500000, -500000],
        *     axis: true,
        *     defaultAxes: {
        *         x: {
        *             scalable: true,
        *             ticks: {
        *                 beautifulScientificTickLabels: true
        *           },
        *         },
        *         y: {
        *             scalable: true,
        *             ticks: {
        *                 beautifulScientificTickLabels: true
        *           },
        *         }
        *     },
        * });
        *
        * </pre><div id="JXGc1e46cd1-e025-4002-80aa-b450869fdaa2" class="jxgbox" style="width: 300px; height: 300px;"></div>
        * <script type="text/javascript">
        *     (function() {
        *     var board = JXG.JSXGraph.initBoard('JXGc1e46cd1-e025-4002-80aa-b450869fdaa2', {
        *         boundingbox: [-500000, 500000, 500000, -500000],
        *         showcopyright: false, shownavigation: false,
        *         axis: true,
        *         defaultAxes: {
        *             x: {
        *                 scalable: true,
        *                 ticks: {
        *                     beautifulScientificTickLabels: true
        *               },
        *             },
        *             y: {
        *                 scalable: true,
        *                 ticks: {
        *                     beautifulScientificTickLabels: true
        *               },
        *             }
        *         },
        *     });
        *
        *     })();
        *
        * </script><pre>
        *
        * @name Ticks#beautifulScientificTickLabels
        * @type Boolean
        * @default false
        */
        beautifulScientificTickLabels: false,

        /**
         * Use the unicode character 0x2212, i.e. the HTML entity &amp;minus; as minus sign.
         * That is &minus;1 instead of -1.
         *
         * @type Boolean
         * @name Ticks#useUnicodeMinus
         * @default true
         */
        useUnicodeMinus: true,

        /**
         * Determine the position of the tick with value 0. 'left' means point1 of the line, 'right' means point2,
         * and 'middle' is equivalent to the midpoint of the defining points. This attribute is ignored if the parent
         * line is of type axis.
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
         * </pre><div class="jxgbox" id="JXG2f6fb842-40bd-4223-aa28-3e9369d2097f" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         * (function () {
         *   var board = JXG.JSXGraph.initBoard('JXG2f6fb842-40bd-4223-aa28-3e9369d2097f', {boundingbox: [-100, 70, 70, -100], showcopyright: false, shownavigation: false});
         *   var p1 = board.create('point', [0, 0]);
         *   var p2 = board.create('point', [50, 25]);
         *   var l1 = board.create('line', [p1, p2]);
         *   var t = board.create('ticks', [l1, 1], {insertTicks: true, majorHeight: -1, label: {offset: [4, -9]}, drawLabels: true});
         * })();
         * </script><pre>
         */
        insertTicks: false,

        /**
         * Minimum distance in pixel of equidistant ticks in case insertTicks==true.
         * @name Ticks#minTicksDistance
         * @type Number
         * @default 10
         * @see Ticks#insertTicks
         */
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
         * Decides in which direction minor ticks are visible. Possible values are either the constants
         * 0=false or 1=true or a function returning 0 or 1.
         *
         * In case of [0,1] the tick is only visible to the right of the line. In case of
         * [1,0] the tick is only visible to the left of the line.
         *
         * @type Array
         * @name Ticks#tickEndings
         * @see Ticks#majorTickEndings
         * @default [1, 1]
         */
        tickEndings: [1, 1],

        /**
         * Decides in which direction major ticks are visible. Possible values are either the constants
         * 0=false or 1=true or a function returning 0 or 1.
         *
         * In case of [0,1] the tick is only visible to the right of the line. In case of
         * [1,0] the tick is only visible to the left of the line.
         *
        * @example
        *         var board = JXG.JSXGraph.initBoard("jxgbox", {
        *             boundingbox: [-5, 5, 5, -5],
        *             axis: true,
        *             defaultAxes: {
        *                 x: {
        *                     ticks: {
        *                         majorTickEndings: [1, 0],
        *                         ignoreInfiniteTickEndings: false
        *                     }
        *                 },
        *                 y: {
        *                     ticks: {
        *                         majorTickEndings: [0, 1],
        *                         ignoreInfiniteTickEndings: false
        *                     }
        *                 }
        *             }
        *         });
        *
        *         var p = board.create('point', [1, 1]);
        *         var l = board.create('line', [1, -1, 1]);
        *
        * </pre><div id="JXGf9ccb731-7a73-44d1-852e-f9c9c405a9d1" class="jxgbox" style="width: 300px; height: 300px;"></div>
        * <script type="text/javascript">
        *     (function() {
        *         var board = JXG.JSXGraph.initBoard('JXGf9ccb731-7a73-44d1-852e-f9c9c405a9d1',
        *             {   showcopyright: false, shownavigation: false,
        *                 boundingbox: [-5, 5, 5, -5],
        *                 axis: true,
        *                 defaultAxes: {
        *                     x: {
        *                         ticks: {
        *                             majorTickEndings: [1, 0],
        *                             ignoreInfiniteTickEndings: false
        *                         }
        *                     },
        *                     y: {
        *                         ticks: {
        *                             majorTickEndings: [0, 1],
        *                             ignoreInfiniteTickEndings: false
        *                         }
        *                     }
        *                 }
        *             });
        *
        *             var p = board.create('point', [1, 1]);
        *             var l = board.create('line', [1, -1, 1]);
        *
        *     })();
        *
        * </script><pre>
        *
        * @type Array
         * @name Ticks#majorTickEndings
         * @see Ticks#tickEndings
         * @see Ticks#ignoreInfiniteTickEndings
         * @default [1, 1]
         */
        majorTickEndings: [1, 1],

        /**
         * If true, ignore the tick endings attribute for infinite (full height) ticks.
         * This affects major and minor ticks.
         *
         * @type Boolean
         * @name Ticks#ignoreInfiniteTickEndings
         * @see Ticks#tickEndings
         * @see Ticks#majorTickEndings
         * @default true
         */
        ignoreInfiniteTickEndings: true,

        /**
         * The number of minor ticks between two major ticks.
         * @type Number
         * @name Ticks#minorTicks
         * @default 4
         */
        minorTicks: 4,

        /**
         * By default, i.e. if ticksPerLabel==false, labels are generated for major ticks, only.
         * If ticksPerLabel is set to a(n integer) number, this denotes the number of minor ticks
         * between two labels.
         *
         * @type {Number|Boolean}
         * @name Ticks#ticksPerLabel
         * @default false
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4],
         *     axis: true,
         *     defaultAxes: {
         *         x: {
         *             ticks: {
         *                 minorTicks: 7,
         *                 ticksPerLabel: 4,
         *                 minorHeight: 20,
         *             }
         *         },
         *         y: {
         *             ticks: {
         *                 minorTicks: 3,
         *                 ticksPerLabel: 2,
         *                 minorHeight: 20
         *             }
         *         }
         *     }
         * });
         *
         * </pre><div id="JXGbc45a421-c867-4b0a-9b8d-2b2576020690" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGbc45a421-c867-4b0a-9b8d-2b2576020690',
         *             {showcopyright: false, shownavigation: false,
         *              boundingbox: [-4, 4, 4, -4],
         *         axis: true,
         *         defaultAxes: {
         *             x: {
         *                 ticks: {
         *                     minorTicks: 7,
         *                     ticksPerLabel: 4,
         *                     minorHeight: 20,
         *                 }
         *             },
         *             y: {
         *                 ticks: {
         *                     minorTicks: 3,
         *                     ticksPerLabel: 2,
         *                     minorHeight: 20
         *                 }
         *             }
         *         }
         *     });
         *     })();
         *
         * </script><pre>
         */
        ticksPerLabel: false,

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
         * factor given in {@link Ticks#scale}.
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
         * @see Ticks#digits
         * @default 5
         */
        maxLabelLength: 5,

        /**
         * If a label exceeds {@link Ticks#maxLabelLength} this determines the precision used to shorten the tick label.
         * Deprecated! Replaced by the digits attribute.
         *
         * @type Number
         * @name Ticks#precision
         * @see Ticks#maxLabelLength
         * @see Ticks#digits
         * @default 3
         */
        precision: 3,

        /**
         * If a label exceeds {@link Ticks#maxLabelLength} this determines the number of digits used to shorten the tick label.
         *
         * @type Number
         * @name Ticks#digits
         * @see Ticks#maxLabelLength
         * @deprecated
         * @default 3
         */
        digits: 3,

        /**
         * The default distance (in user coordinates, not  pixels) between two ticks. Please be aware that this value does not have
         * to be used if {@link Ticks#insertTicks} is set to true.
         *
         * @type Number
         * @name Ticks#ticksDistance
         * @see Ticks#insertTicks
         * @default 1
         */
        ticksDistance: 1,

        /**
         * Tick face for ticks of finite length.  By default (face: '|') this is a straight line.
         * Possible other values are '<' and '>'. These faces are used in
         * {@link JXG.Hatch} for hatch marking parallel lines.
         * @type String
         * @name Ticks#face
         * @see hatch
         * @default '|'
         * @example
         *   var p1 = board.create('point', [0, 3]);
         *   var p2 = board.create('point', [1, 3]);
         *   var l1 = board.create('line', [p1, p2]);
         *   var t = board.create('ticks', [l1], {ticksDistance: 2, face: '>'});
         *
         * </pre><div id="JXG950a568a-1264-4e3a-b61d-b6881feecf4b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG950a568a-1264-4e3a-b61d-b6881feecf4b',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *       var p1 = board.create('point', [0, 3]);
         *       var p2 = board.create('point', [1, 3]);
         *       var l1 = board.create('line', [p1, p2]);
         *       var t = board.create('ticks', [l1], {ticksDistance: 2, face: '>'});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        face: '|',

        strokeOpacity: 1,
        strokeWidth: 1,
        strokeColor: '#000000',
        highlightStrokeColor: '#888888',
        fillColor: 'none',
        highlightFillColor: 'none',
        visible: 'inherit',

        /**
         * Whether line boundaries should be counted or not in the lower and upper bounds when
         * creating ticks.
         *
         * @type Boolean
         * @name Ticks#includeBoundaries
         * @default false
         */
        includeBoundaries: false,

        /**
         * Set the ticks type.
         * Possible values are 'linear' or 'polar'.
         *
         * @type String
         * @name Ticks#type
         * @default 'linear'
         */
        type: 'linear'

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
        face: '|',
        strokeWidth: 2,
        strokeColor: Color.palette.blue,
        /**
         * The default distance (in user coordinates, not  pixels) between two hatch symbols.
         *
         * @type Number
         * @name Hatch#ticksDistance
         * @default 0.2
         */
        ticksDistance: 0.2
    },

    /**
     * Precision options, defining how close a pointer device (mouse, finger, pen) has to be
     * to an object such that the object is highlighted or can be dragged.
     * These values are board-wide and can be overwritten for individual elements by
     * changing their precision attribute.
     *
     * The default values are
     * <pre>
     * JXG.Options.precision: {
     *   touch: 30,
     *   touchMax: 100,
     *   mouse: 4,
     *   pen: 4,
     *   epsilon: 0.0001,
     *   hasPoint: 4
     * }
     * </pre>
     *
     * @type Object
     * @name JXG.Options#precision
     * @see JXG.GeometryElement#precision
     */
    precision: {
        touch: 30,
        touchMax: 100,
        mouse: 4,
        pen: 4,
        epsilon: 0.0001, // Unused
        hasPoint: 4
    },

    /**
     * Default ordering of the layers.
     * The numbering starts from 0 and the highest layer number is numlayers-1.
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
     * @type Object
     * @name JXG.Options#layer
     */
    layer: {
        numlayers: 20, // only important in SVG
        unused9: 19,
        unused8: 18,
        unused7: 17,
        unused6: 16,
        unused5: 15,
        unused4: 14,
        unused3: 13,
        unused2: 12,
        unused1: 11,
        unused0: 10,
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
         * The radius can be given as number (in user coordinates)
         * or as string 'auto'. In the latter case, the angle
         * is set to an value between 20 and 50 px.
         *
         * @type {Number|String}
         * @name Angle#radius
         * @default 'auto'
         * @visprop
         */
        radius: 'auto',

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

        fillColor: Color.palette.orange,
        highlightFillColor: Color.palette.orange,
        strokeColor: Color.palette.orange,
        // fillColor: '#ff7f00',
        // highlightFillColor: '#ff7f00',
        // strokeColor: '#ff7f00',

        fillOpacity: 0.3,
        highlightFillOpacity: 0.3,

        /**
         * @name Angle#radiuspoint
         * @type Object
         * @deprecated
         */
        radiuspoint: {
            withLabel: false,
            visible: false,
            name: ''
        },

        /**
         * @name Angle#pointsquare
         * @type Object
         * @deprecated
         */
        pointsquare: {
            withLabel: false,
            visible: false,
            name: ''
        },

        /**
         * Attributes of the dot point marking right angles.
         * @name Angle#dot
         * @type Object
         * @default {face: 'o', size: 2}
         */
        dot: {
            visible: false,
            strokeColor: 'none',
            fillColor: '#000000',
            size: 2,
            face: 'o',
            withLabel: false,
            name: ''
        },

        label: {
            position: 'top',
            offset: [0, 0],
            strokeColor: Color.palette.blue
        },

        /**
         * Attributes for sub-element arc. In general, the arc will run through the first point and
         * thus will not have the same radius as the angle sector.
         *
         * @type Arc
         * @name Angle#arc
         * @default '{visible:false}'
         */
        arc: {
            visible: false,
            fillColor: 'none'
        },

        /**#@-*/
    },

    /* special arc options */
    arc: {
        /**#@+
         * @visprop
         */

        /**
         * Type of arc. Possible values are 'minor', 'major', and 'auto'.
         *
         * @type String
         * @name Arc#selection
         * @default 'auto'
         */
        selection: 'auto',

        /**
         * If <tt>true</tt>, moving the mouse over inner points triggers hasPoint.
         *
         * @see JXG.GeometryElement#hasPoint
         * @name Arc#hasInnerPoints
         * @type Boolean
         * @default false
         */
        hasInnerPoints: false,

        label: {
            anchorX: 'auto',
            anchorY: 'auto'
        },
        firstArrow: false,
        lastArrow: false,
        fillColor: 'none',
        highlightFillColor: 'none',
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',
        useDirection: false,

        /**
         * Attributes for center point.
         *
         * @type Point
         * @name Arc#center
         */
        center: {
        },

        /**
         * Attributes for radius point.
         *
         * @type Point
         * @name Arc#radiusPoint
         */
        radiusPoint: {
        },

        /**
         * Attributes for angle point.
         *
         * @type Point
         * @name Arc#anglePoint
         */
        anglePoint: {
        }

        /**#@-*/
    },

    /* special arrow options */
    arrow: {
        /**#@+
         * @visprop
         */

        firstArrow: false,

        lastArrow: {
            type: 1,
            highlightSize: 6,
            size: 6
        }

        /**#@-*/
    },

    /* special axis options */
    axis: {
        /**#@+
         * @visprop
         */

        name: '',                            // By default, do not generate names for axes.
        needsRegularUpdate: false,           // Axes only updated after zooming and moving of the origin.
        strokeWidth: 1,
        lastArrow: {
            type: 1,
            highlightSize: 8,
            size: 8
        },
        strokeColor: '#666666',
        highlightStrokeWidth: 1,
        highlightStrokeColor: '#888888',

        /**
         * Show / hide ticks.
         *
         * Deprecated. Suggested alternative is "ticks: {visible: false}"
         *
         * @type Boolean
         * @name Axis#withTicks
         * @default true
         * @deprecated
         */
        withTicks: true,
        straightFirst: true,
        straightLast: true,
        margin: -4,
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
                needsRegularUpdate: false,
                display: 'internal',
                visible: 'inherit',
                layer: 9
            },
            visible: 'inherit',
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
            majorTickEndings: [1, 1],
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
            needsRegularUpdate: false,
            visible: false
        },

        /**
         * Attributes for second point the axis.
         *
         * @type Point
         * @name Axis#point2
         */
        point2: {                  // Default values for point2 if created by line
            needsRegularUpdate: false,
            visible: false
        },

        tabindex: -1,

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
            strokeColor: '#000000'
        },

        /**
         * Attributes for second line.
         *
         * @type Line
         * @name Bisectorlines#line2
         */
        line2: {               //
            strokeColor: '#000000'
        }

        /**#@-*/
    },

    /* special options for boxplot curves */
    boxplot: {
        /**#@+
         * @visprop
         */

        /**
         *  Direction of the box plot: 'vertical' or 'horizontal'
         *
         * @type String
         * @name Boxplot#dir
         * @default 'vertical'
         */
        dir: 'vertical',

        /**
         * Relative width of the maximum and minimum quantile
         *
         * @type Number
         * @name Boxplot#smallWidth
         * @default 0.5
         */
        smallWidth: 0.5,

        strokeWidth: 2,
        strokeColor: Color.palette.blue,
        fillColor: Color.palette.blue,
        fillOpacity: 0.2,
        highlightStrokeWidth: 2,
        highlightStrokeColor: Color.palette.blue,
        highlightFillColor: Color.palette.blue,
        highlightFillOpacity: 0.1

        /**#@-*/
    },

    /* special button options */
    button: {
        /**#@+
         * @visprop
         */

        /**
         * Control the attribute "disabled" of the HTML button.
         *
         * @name disabled
         * @memberOf Button.prototype
         *
         * @type Boolean
         * @default false
         */
        disabled: false,

        display: 'html'

        /**#@-*/
    },

    /* special cardinal spline options */
    cardinalspline: {
        /**#@+
         * @visprop
         */

        /**
         * Controls if the data points of the cardinal spline when given as
         * arrays should be converted into {@link JXG.Points}.
         *
         * @name createPoints
         * @memberOf Cardinalspline.prototype
         *
         * @see Cardinalspline#points
         *
         * @type Boolean
         * @default true
         */
        createPoints: true,

        /**
         * If set to true, the supplied coordinates are interpreted as
         * [[x_0, y_0], [x_1, y_1], p, ...].
         * Otherwise, if the data consists of two arrays of equal length,
         * it is interpreted as
         * [[x_o x_1, ..., x_n], [y_0, y_1, ..., y_n]]
         *
         * @name isArrayOfCoordinates
         * @memberOf Cardinalspline.prototype
         * @type Boolean
         * @default true
         */
        isArrayOfCoordinates: true,

        /**
         * Attributes for the points generated by Cardinalspline in cases
         * {@link createPoints} is set to true
         *
         * @name points
         * @memberOf Cardinalspline.prototype
         *
         * @see Cardinalspline#createPoints
         * @type Object
         */
        points: {
            strokeOpacity: 0.05,
            fillOpacity: 0.05,
            highlightStrokeOpacity: 1.0,
            highlightFillOpacity: 1.0,
            withLabel: false,
            name: '',
            fixed: false
        }

        /**#@-*/
    },

    /* special chart options */
    chart: {
        /**#@+
         * @visprop
         */

        chartStyle: 'line',
        colors: ['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#c3d9ff', '#4096EE', '#008C00'],
        highlightcolors: null,
        fillcolor: null,
        highlightonsector: false,
        highlightbysize: false,

        fillOpacity: 0.6,
        withLines: false,

        label: {
        }
        /**#@-*/
    },

    /* special html slider options */
    checkbox: {
        /**#@+
         * @visprop
         */

        /**
         * Control the attribute "disabled" of the HTML checkbox.
         *
         * @name disabled
         * @memberOf Checkbox.prototype
         *
         * @type Boolean
         * @default false
         */
        disabled: false,

        /**
         * Control the attribute "checked" of the HTML checkbox.
         *
         * @name checked
         * @memberOf Checkbox.prototype
         *
         * @type Boolean
         * @default false
         */
        checked: false,

        display: 'html'

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
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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

            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
            layer: 9,

            name: ''
        },

        /**
         * Attributes for center point.
         *
         * @type Point
         * @name Circle#center
         */
        point2: {
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
            layer: 9,

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
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
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
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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
        fillColor: Color.palette.yellow,
        highlightFillColor: Color.palette.yellow,
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3,
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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

    /* special options for comb */
    comb: {
        /**#@+
         * @visprop
         */

        /**
         * Frequency of comb elements.
         *
         * @type Number
         * @name Comb#frequency
         * @default 0.2
         */
        frequency: 0.2,

        /**
         * Width of the comb.
         *
         * @type Number
         * @name Comb#width
         * @default 0.4
         */
        width: 0.4,

        /**
         * Angle under which comb elements are positioned.
         *
         * @type Number
         * @name Comb#angle
         * @default 60 degrees
         */
        angle: Math.PI / 3,

        /**
         * Should the comb go right to left instead of left to right.
         *
         * @type Boolean
         * @name Comb#reverse
         * @default false
         */
        reverse: false,

        /**
         * Attributes for first defining point of the comb.
         *
         * @type Point
         * @name Comb#point1
         */
        point1: {
            visible: false,
            withLabel: false,
            fixed: false,
            name: ''
        },

        /**
         * Attributes for second defining point of the comb.
         *
         * @type Point
         * @name Comb#point2
         */
        point2: {
            visible: false,
            withLabel: false,
            fixed: false,
            name: ''
        },

        // /**
        //  * Attributes for the curve displaying the comb.
        //  *
        //  * @type Curve
        //  * @name Comb#curve
        //  */
        // curve: {
        //     strokeWidth: 1,
        //     strokeColor: '#0000ff',
        //     fillColor: 'none'
        // },
        strokeWidth: 1,
        strokeColor: '#0000ff',
        fillColor: 'none'
},

    /* special conic options */
    conic: {
        /**#@+
         * @visprop
         */

        fillColor: 'none',
        highlightFillColor: 'none',
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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
        },

        /**
         * Attributes for center point.
         *
         * @type Point
         * @name Conic#center
         */
        center: {
            visible: false,
            withLabel: false,
            name: ''
        },

        /**
         * Attributes for five points defining the conic, if some of them are given as coordinates.
         *
         * @type Point
         * @name Conic#point
         */
        point: {
            withLabel: false,
            name: ''
        },

        /**
         * Attributes for parabola line in case the line is given by two
         * points or coordinate pairs.
         *
         * @type Line
         * @name Conic#line
         */
        line: {
            visible: false
        }

        /**#@-*/
    },

    /* special curve options */
    curve: {
        strokeWidth: 1,
        strokeColor: Color.palette.blue,
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
         * Number of points used for plotting triggered by up events
         * (i.e. high quality plotting) in case
         * {@link Curve#doAdvancedPlot} is false.
         *
         * @name Curve#numberPointsHigh
         * @see Curve#doAdvancedPlot
         * @type Number
         * @default 1600
         */
        numberPointsHigh: 1600,  // Number of points on curves after mouseUp

        /**
         * Number of points used for plotting triggered by move events
         * (i.e. lower quality plotting but fast) in case
         * {@link Curve#doAdvancedPlot} is false.
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
         *
         * Recursion depth used for plotting triggered by up events
         * (i.e. high quality plotting) in case
         * {@link Curve#doAdvancedPlot} is true.
         *
         * @name Curve#recursionDepthHigh
         * @see Curve#doAdvancedPlot
         * @type Number
         * @default 17
         */
        recursionDepthHigh: 17,

        /**
         * Number of points used for plotting triggered by move events in case
         * (i.e. lower quality plotting but fast)
         * {@link Curve#doAdvancedPlot} is true.
         *
         * @name Curve#recursionDepthLow
         * @see Curve#doAdvancedPlot
         * @type Number
         * @default 13
         */
        recursionDepthLow: 15,

        /**
         * If true use the algorithm by Gillam and Hohenwarter, which was default until version 0.98.
         *
         * @name Curve#doAdvancedPlotOld
         * @see Curve#doAdvancedPlot
         * @type Boolean
         * @default false
         * @deprecated
         */
        doAdvancedPlotOld: false,   // v1

        /**
         * Select the version of the plot algorithm.
         * <ul>
         * <li> Version 1 is very outdated
         * <li> Version 2 is the default version in JSXGraph v0.99.*, v1.0, and v1.1, v1.2.0
         * <li> Version 3 is an internal version that was never published in  a stable version.
         * <li> Version 4 is available since JSXGraph v1.2.0
         * </ul>
         * Version 4 plots correctly logarithms if the function term is supplied as string (i.e. as JessieCode)
         *
         * @example
         *   var c = board.create('functiongraph', ["log(x)"]);
         *
         * @name Curve#plotVersion
         * @type Number
         * @default 2
         */
        plotVersion: 2,

        /**
         * Attributes for circle label.
         *
         * @type Label
         * @name Circle#label
         */
        label: {
            position: 'lft'
        },

        /**
         * Configure arrow head at the start position for curve.
         * Recommended arrow head type is 7.
         *
         * @name Curve#firstArrow
         * @type Boolean / Object
         * @default false
         * @see Line#firstArrow for options
         */
        firstArrow: false,

        /**
         * Configure arrow head at the end position for curve.
         * Recommended arrow head type is 7.
         *
         * @name Curve#lastArrow
         * @see Line#lastArrow for options
         * @type Boolean / Object
         * @default false
         */
        lastArrow: false

        /**#@-*/
    },

    /* special foreignObject options */
    foreignobject: {
        /**#@+
         * @visprop
         */

        fixed: true,
        visible: true,
        needsRegularUpdate: false

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
        //strokeColor: '#c0c0c0',
        strokeColor: '#c0c0c0',
        strokeOpacity: 0.5,
        strokeWidth: 1,
        dash: 0,    // dashed grids slow down the iPad considerably
        /* snap to grid options */

        /**
         * @name Grid#snapToGrid
         * @type Boolean
         * @deprecated
         */
        snapToGrid: false,

        /**
         * @name Grid#snapSizeX
         * @type Boolean
         * @deprecated
         */
        snapSizeX: 10,

        /**
         * @name Grid#snapSizeY
         * @type Boolean
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

        // /**
        //  *
        //  * These affect the DOM element input type="range".
        //  * The other attributes affect the DOM element div containing the range element.
        //  */
        widthRange: 100,
        widthOut: 34,
        step: 0.01,

        frozen: true,
        isLabel: false,
        strokeColor: '#000000',
        display: 'html',
        anchorX: 'left',
        anchorY: 'middle',
        withLabel: false

        /**#@-*/
    },

    /* special image options */
    image: {
        /**#@+
         * @visprop
         */

        imageString: null,
        fillOpacity: 1.0,
        highlightFillOpacity: 0.6,


        /**
         * Defines the CSS class used by the image. CSS attributes defined in
         * this class will overwrite the corresponding JSXGraph attributes, e.g.
         * opacity.
         * The default CSS class is defined in jsxgraph.css.
         *
         * @name Image#cssClass
         *
         * @see Image#highlightCssClass
         * @type String
         * @default 'JXGimage'
         */
        cssClass: 'JXGimage',

        /**
         * Defines the CSS class used by the image when highlighted.
         * CSS attributes defined in this class will overwrite the
         * corresponding JSXGraph attributes, e.g. highlightFillOpacity.
         * The default CSS class is defined in jsxgraph.css.
         *
         * @name Image#highlightCssClass
         *
         * @see Image#cssClass
         * @type String
         * @default 'JXGimageHighlight'
         */
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
         * The image will only snap on user coordinates which are
         * integer multiples to snapSizeX in x and snapSizeY in y direction.
         * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
         * of the default ticks of the default x axes of the board.
         *
         * @name Image#snapSizeX
         *
         * @see Point#snapToGrid
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
         * @see Point#snapToGrid
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
         * @type Array
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
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',

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
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
            name: ''
        }
        /**#@-*/
    },

    inequality: {
        /**#@+
         * @visprop
         */

        fillColor: Color.palette.red,
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

        /**
         * Horizontal offset in pixel of the infobox text from its anchor point.
         *
         * @type Number
         * @default -20
         * @name JXG.Board.infobox#distanceX
         * @visprop
         */
        distanceX: -20,

        /**
         * Vertical offset in pixel of the infobox text from its anchor point.
         *
         * @type Number
         * @default 25
         * @name JXG.Board.infobox#distanceY
         * @visprop
         */
        distanceY: 25,

        fontSize: 12,
        isLabel: false,
        strokeColor: '#bbbbbb',
        display: 'html',             // 'html' or 'internal'
        anchorX: 'left',             //  'left', 'middle', or 'right': horizontal alignment
        //  of the text.
        anchorY: 'middle',           //  'top', 'middle', or 'bottom': vertical alignment
        //  of the text.
        cssClass: 'JXGinfobox',
        rotate: 0,                   // works for non-zero values only in combination
        // with display=='internal'
        visible: true,
        parse: false,
        transitionDuration: 0,
        needsRegularUpdate: false,
        tabindex: null

        /**#@-*/
    },

    /* special options for integral */
    integral: {
        /**#@+
         * @visprop
         */

        axis: 'x',        // 'x' or 'y'
        withLabel: true,    // Show integral value as text
        fixed: true,
        strokeWidth: 0,
        strokeOpacity: 0,
        fillColor: Color.palette.red,
        fillOpacity: 0.3,
        highlightFillColor: Color.palette.red,
        highlightFillOpacity: 0.2,

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
            color: Color.palette.red,
            fillOpacity: 0.8,
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
            color: Color.palette.red,
            fillOpacity: 0.8,
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

    /* special input options */
    input: {
        /**#@+
         * @visprop
         */

        /**
         * Control the attribute "disabled" of the HTML input field.
         *
         * @name disabled
         * @memberOf Input.prototype
         *
         * @type Boolean
         * @default false
         */
        disabled: false,

        /**
         * Control the attribute "maxlength" of the HTML input field.
         *
         * @name maxlength
         * @memberOf Input.prototype
         *
         * @type Number
         * @default 524288 (as in HTML)
         */
        maxlength: 524288,

        display: 'html'

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

        visible: 'inherit',
        strokeColor: '#000000',
        strokeOpacity: 1,
        highlightStrokeOpacity: 0.666666,
        highlightStrokeColor: '#000000',

        fixed: true,

        /**
         * Possible string values for the position of a label for
         * label anchor points are:
         * <ul>
         * <li> 'first' (lines only)
         * <li> 'last' (lines only)
         * <li> 'lft'
         * <li> 'rt'
         * <li> 'top'
         * <li> 'bot'
         * <li> 'ulft'
         * <li> 'urt'
         * <li> 'llft'
         * <li> 'lrt'
         * </ul>
         * This is relevant for non-points: line, circle, curve.
         *
         * The names have been borrowed from <a href="https://www.tug.org/metapost.html">MetaPost</a>.
         *
         * @name Label#position
         * @see Label#offset
         * @type String
         * @default 'urt'
         */
        position: 'urt',

        /**
         *  Label offset from label anchor.
         *  The label anchor is determined by {@link Label#position}
         *
         * @name Label#offset
         * @see Label#position
         * @type Array
         * @default [10,10]
         */
        offset: [10, 10],

        /**
         * Automatic position of label text. When called first, the positioning algorithm
         * starts at the position defined by offset.
         * The algorithm tries to find a position with the least number of
         * overlappings with other elements, while retaining the distance
         * to the anchor element.
         *
         * @name Label#autoPosition
         * @see Label#offset
         * @type Boolean
         * @default false
         *
         * @example
         * 	var p1 = board.create('point', [-2, 1], {id: 'A'});
         * 	var p2 = board.create('point', [-0.85, 1], {
         *      name: 'B', id: 'B', label:{autoPosition: true, offset:[10, 10]}
         *  });
         * 	var p3 = board.create('point', [-1, 1.2], {
         *      name: 'C', id: 'C', label:{autoPosition: true, offset:[10, 10]}
         *  });
         *  var c = board.create('circle', [p1, p2]);
         * 	var l = board.create('line', [p1, p2]);
         *
         * </pre><div id="JXG7d4dafe7-1a07-4d3f-95cb-bfed9d96dea2" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG7d4dafe7-1a07-4d3f-95cb-bfed9d96dea2',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     	var p1 = board.create('point', [-2, 1], {id: 'A'});
         *     	var p2 = board.create('point', [-0.85, 1], {name: 'B', id: 'B', label:{autoPosition: true, offset:[10, 10]}});
         *     	var p3 = board.create('point', [-1, 1.2], {name: 'C', id: 'C', label:{autoPosition: true, offset:[10, 10]}});
         *      var c = board.create('circle', [p1, p2]);
         *     	var l = board.create('line', [p1, p2]);
         *
         *     })();
         *
         * </script><pre>
         *
         *
         */
        autoPosition: false

        /**#@-*/
    },

    /* special legend options */
    legend: {
        /**
         * @visprop
         */

        /**
         * Default style of a legend element. The only possible value is 'vertical'.
         * @name Legend#style
         * @type String
         * @default 'vertical'
         */
        style: 'vertical',

        /**
         * Label names of a legend element.
         * @name Legend#labels
         * @type Array
         * @default "['1', '2', '3', '4', '5', '6', '7', '8']"
         */
        labels: ['1', '2', '3', '4', '5', '6', '7', '8'],

        /**
         * (Circular) array of label colors.
         * @name Legend#colors
         * @type Array
         * @default "['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#c3d9ff', '#4096EE', '#008C00']"
         */
        colors: ['#B02B2C', '#3F4C6B', '#C79810', '#D15600', '#FFFF88', '#c3d9ff', '#4096EE', '#008C00'],

        /**
         * Height (in px) of one legend entry
         * @name Legend#rowHeight
         * @type Number
         * @default 20
         *
         */
        rowHeight: 20,

        strokeWidth: 5

        /**#@-*/
    },

    /* special line options */
    line: {
        /**#@+
         * @visprop
         */

        /**
         * Configure the arrow head at the position of its first point or the corresponding
         * intersection with the canvas border
         *
         * In case firstArrow is an object it has the sub-attributes:
         * <pre>
         * {
         *      type: 1, // possible values are 1, 2, ..., 7. Default value is 1.
         *      size: 6, // size of the arrow head. Default value is 6.
         *               // This value is multiplied with the strokeWidth of the line
         *               // Exception: for type=7 size is ignored
         *      highlightSize: 6, // size of the arrow head in case the element is highlighted. Default value
         * }
         * </pre>
         * type=7 is the default for curves if firstArrow: true
         *
         * @example
         *     board.options.line.lastArrow = false;
         *     board.options.line.firstArrow = {size: 10, highlightSize: 10};
         *     board.options.line.point1 = {visible: false, withLabel: true, label: {visible: true, anchorX: 'right'}};
         *     board.options.line.strokeWidth = 4;
         *     board.options.line.highlightStrokeWidth = 4;
         *
         *     board.create('segment', [[-5,4], [3,4]], {firstArrow: {type: 1}, point1: {name: 'type:1'}});
         *     board.create('segment', [[-5,3], [3,3]], {firstArrow: {type: 2}, point1: {name: 'type:2'}});
         *     board.create('segment', [[-5,2], [3,2]], {firstArrow: {type: 3}, point1: {name: 'type:3'}});
         *     board.create('segment', [[-5,1], [3,1]], {firstArrow: {type: 4}, point1: {name: 'type:4'}});
         *     board.create('segment', [[-5,0], [3,0]], {firstArrow: {type: 5}, point1: {name: 'type:5'}});
         *     board.create('segment', [[-5,-1], [3,-1]], {firstArrow: {type: 6}, point1: {name: 'type:6'}});
         *     board.create('segment', [[-5,-2], [3,-2]], {firstArrow: {type: 7}, point1: {name: 'type:7'}});
         *
         * </pre><div id="JXGc94a93da-c942-4204-8bb6-b39726cbb09b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGc94a93da-c942-4204-8bb6-b39726cbb09b',
         *             {boundingbox: [-6, 6, 4,-4], axis: false, showcopyright: false, shownavigation: false});
         *         board.options.line.lastArrow = false;
         *         board.options.line.firstArrow = {size: 10, highlightSize: 10};
         *         board.options.line.point1 = {visible: false, withLabel: true, label: {visible: true, anchorX: 'right'}};
         *         board.options.line.strokeWidth = 4;
         *         board.options.line.highlightStrokeWidth = 4;
         *
         *         board.create('segment', [[-5,4], [3,4]], {firstArrow: {type: 1}, point1: {name: 'type:1'}});
         *         board.create('segment', [[-5,3], [3,3]], {firstArrow: {type: 2}, point1: {name: 'type:2'}});
         *         board.create('segment', [[-5,2], [3,2]], {firstArrow: {type: 3}, point1: {name: 'type:3'}});
         *         board.create('segment', [[-5,1], [3,1]], {firstArrow: {type: 4}, point1: {name: 'type:4'}});
         *         board.create('segment', [[-5,0], [3,0]], {firstArrow: {type: 5}, point1: {name: 'type:5'}});
         *         board.create('segment', [[-5,-1], [3,-1]], {firstArrow: {type: 6}, point1: {name: 'type:6'}});
         *         board.create('segment', [[-5,-2], [3,-2]], {firstArrow: {type: 7}, point1: {name: 'type:7'}});
         *
         *     })();
         *
         * </script><pre>
         *
         * @name Line#firstArrow
         * @see Line#lastArrow
         * @see Line#touchFirstPoint
         * @type Boolean / Object
         * @default false
         */
        firstArrow: false,

        /**
         * Configure the arrow head at the position of its second point or the corresponding
         * intersection with the canvas border.
         *
         * In case lastArrow is an object it has the sub-attributes:
         * <pre>
         * {
         *      type: 1, // possible values are 1, 2, ..., 7. Default value is 1.
         *      size: 6, // size of the arrow head. Default value is 6.
         *               // This value is multiplied with the strokeWidth of the line.
         *               // Exception: for type=7 size is ignored
         *      highlightSize: 6, // size of the arrow head in case the element is highlighted. Default value is 6.
         * }
         * </pre>
         * type=7 is the default for curves if lastArrow: true
         *
         * @example
         *     var p1 = board.create('point', [-5, 2], {size:1});
         *     var p2 = board.create('point', [5, 2], {size:10});
         *     var li = board.create('segment', ['A','B'],
         *         {name:'seg',
         *          strokeColor:'#000000',
         *          strokeWidth:1,
         *          highlightStrokeWidth: 5,
         *          lastArrow: {type: 2, size: 8, highlightSize: 6},
         *          touchLastPoint: true,
         *          firstArrow: {type: 3, size: 8}
         *         });
         *
         * </pre><div id="JXG184e915c-c2ef-11e8-bece-04d3b0c2aad3" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG184e915c-c2ef-11e8-bece-04d3b0c2aad3',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var p1 = board.create('point', [-5, 2], {size:1});
         *         var p2 = board.create('point', [5, 2], {size:10});
         *         var li = board.create('segment', ['A','B'],
         *             {name:'seg',
         *              strokeColor:'#000000',
         *              strokeWidth:1,
         *              highlightStrokeWidth: 5,
         *              lastArrow: {type: 2, size: 8, highlightSize: 6},
         *              touchLastPoint: true,
         *              firstArrow: {type: 3, size: 8}
         *             });
         *     })();
         *
         * </script>
         *
         * @example
         *     board.options.line.strokeWidth = 4;
         *     board.options.line.highlightStrokeWidth = 4;
         *     board.options.line.firstArrow = false;
         *     board.options.line.lastArrow = {size: 10, highlightSize: 10};
         *     board.options.line.point2 = {visible: false, withLabel: true, label: {visible: true}};
         *
         *     board.create('segment', [[-5,4], [3,4]], {lastArrow: {type: 1}, point2: {name: 'type:1'}});
         *     board.create('segment', [[-5,3], [3,3]], {lastArrow: {type: 2}, point2: {name: 'type:2'}});
         *     board.create('segment', [[-5,2], [3,2]], {lastArrow: {type: 3}, point2: {name: 'type:3'}});
         *     board.create('segment', [[-5,1], [3,1]], {lastArrow: {type: 4}, point2: {name: 'type:4'}});
         *     board.create('segment', [[-5,0], [3,0]], {lastArrow: {type: 5}, point2: {name: 'type:5'}});
         *     board.create('segment', [[-5,-1], [3,-1]], {lastArrow: {type: 6}, point2: {name: 'type:6'}});
         *     board.create('segment', [[-5,-2], [3,-2]], {lastArrow: {type: 7}, point2: {name: 'type:7'}});
         *
         * </pre><div id="JXGca206b1c-e319-4899-8b90-778f53fd926d" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGca206b1c-e319-4899-8b90-778f53fd926d',
         *             {boundingbox: [-6, 6, 6,-4], axis: false, showcopyright: false, shownavigation: false});
         *         board.options.line.strokeWidth = 4;
         *         board.options.line.highlightStrokeWidth = 4;
         *         board.options.line.firstArrow = false;
         *         board.options.line.lastArrow = {size: 10, highlightSize: 10};
         *         board.options.line.point2 = {visible: false, withLabel: true, label: {visible: true}};
         *
         *         board.create('segment', [[-5,4], [3,4]], {lastArrow: {type: 1}, point2: {name: 'type:1'}});
         *         board.create('segment', [[-5,3], [3,3]], {lastArrow: {type: 2}, point2: {name: 'type:2'}});
         *         board.create('segment', [[-5,2], [3,2]], {lastArrow: {type: 3}, point2: {name: 'type:3'}});
         *         board.create('segment', [[-5,1], [3,1]], {lastArrow: {type: 4}, point2: {name: 'type:4'}});
         *         board.create('segment', [[-5,0], [3,0]], {lastArrow: {type: 5}, point2: {name: 'type:5'}});
         *         board.create('segment', [[-5,-1], [3,-1]], {lastArrow: {type: 6}, point2: {name: 'type:6'}});
         *         board.create('segment', [[-5,-2], [3,-2]], {lastArrow: {type: 7}, point2: {name: 'type:7'}});
         *     })();
         *
         * </script><pre>
         *
         * @name Line#lastArrow
         * @see Line#firstArrow
         * @see Line#touchLastPoint
         * @type Boolean / Object
         * @default false
         */
        lastArrow: false,

        /**
         * This number (pixel value) controls where infinite lines end at the canvas border. If zero, the line
         * ends exactly at the border, if negative there is a margin to the inside, if positive the line
         * ends outside of the canvas (which is invisible).
         *
         * @name Line#margin
         * @type Number
         * @default 0
         */
        margin: 0,

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

        fillColor: 'none',           // Important for VML on IE
        highlightFillColor: 'none',  // Important for VML on IE
        strokeColor: Color.palette.blue,
        highlightStrokeColor: '#c3d9ff',
        withTicks: false,

        /**
         * Attributes for first defining point of the line.
         *
         * @type Point
         * @name Line#point1
         */
        point1: {                  // Default values for point1 if created by line
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
            layer: 9,

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
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#c3d9ff',
            highlightStrokeColor: '#c3d9ff',
            layer: 9,

            visible: false,
            withLabel: false,
            fixed: false,
            name: ''
        },

        /**
         * Attributes for ticks of the line.
         *
         * @name Line#ticks
         * @type Object
         * @see Ticks
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
            strokeOpacity: 0.3,
            visible: 'inherit'
        },

        /**
         * Attributes for the line label.
         *
         * @type Object
         * @name Line#label
         * @see Label
         */
        label: {
            position: 'llft'
        },

        /**
         * If set to true, the point will snap to a grid defined by
         * {@link Point#snapSizeX} and {@link Point#snapSizeY}.
         *
         * @see Point#snapSizeX
         * @see Point#snapSizeY
         * @type Boolean
         * @name Line#snapToGrid
         * @default false
         */
        snapToGrid: false,

        /**
         * Defines together with {@link Point#snapSizeY} the grid the point snaps on to.
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
         * Defines together with {@link Point#snapSizeX} the grid the point snaps on to.
         * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
         * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
         * of the default ticks of the default y axes of the board.
         *
         * @see Point#snapToGrid
         * @see Point#snapSizeX
         * @see JXG.Board#defaultAxes
         * @type Number
         * @name Line#snapSizeY
         * @default 1
         */
        snapSizeY: 1,

        /**
         * If set to true, {@link Line#firstArrow} is set to true and the point is visible, 
         * the arrow head will just touch the circle line of the start point of the line.
         *
         * @see Line#firstArrow
         * @type Boolean
         * @name Line#touchFirstPoint
         * @default false
         */
        touchFirstPoint: false,

        /**
         * If set to true, {@link Line#lastArrow} is set to true and the point is visible, 
         * the arrow head will just touch the circle line of the start point of the line.
         * @see Line#firstArrow
         * @type Boolean
         * @name Line#touchLastPoint
         * @default false
         */
        touchLastPoint: false,

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

    /* special cardinal spline options */
    metapostspline: {
        /**#@+
         * @visprop
         */

        /**
          * Controls if the data points of the cardinal spline when given as
          * arrays should be converted into {@link JXG.Points}.
          *
          * @name createPoints
          * @memberOf Metapostspline.prototype
          *
          * @see Metapostspline#points
          *
          * @type Boolean
          * @default true
          */
        createPoints: true,

        /**
         * If set to true, the supplied coordinates are interpreted as
         * [[x_0, y_0], [x_1, y_1], p, ...].
         * Otherwise, if the data consists of two arrays of equal length,
         * it is interpreted as
         * [[x_o x_1, ..., x_n], [y_0, y_1, ..., y_n]]
         *
         * @name isArrayOfCoordinates
         * @memberOf Metapostspline.prototype
         * @type Boolean
         * @default true
         */
        isArrayOfCoordinates: true,

        /**
         * Attributes for the points generated by Metapost spline in cases
         * {@link createPoints} is set to true
         *
         * @name points
         * @memberOf Metapostspline.prototype
         *
         * @see Metapostspline#createPoints
         * @type Object
         */
        points: {
            strokeOpacity: 0.5,
            fillOpacity: 0.5,
            highlightStrokeOpacity: 1.0,
            highlightFillOpacity: 1.0,
            withLabel: false,
            name: '',
            fixed: false
        }

        /**#@-*/
    },

    /* special mirrorelement options */
    mirrorelement: {
        /**#@+
         * @visprop
         */

        fixed: true,

        /**
         * Attributes of mirror point, i.e. the point along which the element is mirrored.
         *
         * @type Point
         * @name mirrorelement#point
         */
        point: {},

        /**
         * Attributes of circle center, i.e. the center of the circle,
         * if a circle is the mirror element and the transformation type is 'Euclidean'
         *
         * @type Point
         * @name mirrorelement#center
         */
        center: {},

        /**
         * Type of transformation. Possible values are 'Euclidean', 'projective'.
         *
         * If the value is 'Euclidean', the mirror element of a circle is again a circle,
         * otherwise it is a conic section.
         *
         * @type String
         * @name mirrorelement#type
         * @default 'Euclidean'
         */
        type: 'Euclidean'

        /**#@-*/
    },

    // /* special options for Msector of 3 points */
    // msector: {
    //     strokeColor: '#000000', // Msector line
    //     point: {               // Msector point
    //         visible: false,
    //         fixed: false,
    //         withLabel: false,
    //         name: ''
    //     }
    // },

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

    /* special options for orthogonal projection points */
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
         * <tr><th>Input</th><th>Output</th></tr>
         * <tr><td>cross</td><td>x</td></tr>
         * <tr><td>circle</td><td>o</td></tr>
         * <tr><td>square, []</td><td>[]</td></tr>
         * <tr><td>plus</td><td>+</td></tr>
         * <tr><td>minus</td><td>-</td></tr>
         * <tr><td>divide</td><td>|</td></tr>
         * <tr><td>diamond</td><td>&lt;&gt;</td></tr>
         * <tr><td>triangleup</td><td>^, a, A</td></tr>
         * <tr><td>triangledown</td><td>v</td></tr>
         * <tr><td>triangleleft</td><td>&lt;</td></tr>
         * <tr><td>triangleright</td><td>&gt;</td></tr>
         * </table>
         *
         * @name Point#face
         *
         * @type String
         * @see JXG.Point#setStyle
         * @default circle
         */
        face: 'o',

        /**
         * Size of a point, either in pixel or user coordinates.
         * Means radius resp. half the width of a point (depending on the face).
         *
         * @name Point#size
         *
         * @see Point#face
         * @see JXG.Point#setStyle
         * @see Point#sizeUnit
         * @type Number
         * @default 3
         */
        size: 3,

        /**
         * Unit for size.
         * Possible values are 'screen' and 'user.
         *
         * @name Point#sizeUnit
         *
         * @see Point#size
         * @type String
         * @default 'screen'
         */
        sizeUnit: 'screen',

        strokeWidth: 2,

        transitionProperties: ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'width', 'height', 'rx', 'ry'],
        fillColor: Color.palette.red,
        strokeColor: Color.palette.red,
        highlightFillColor: '#c3d9ff',
        highlightStrokeColor: '#c3d9ff',
        // strokeOpacity: 1.0,
        // fillOpacity: 1.0,
        // highlightFillOpacity: 0.5,
        // highlightStrokeOpacity: 0.5,

        // fillColor: '#ff0000',
        // highlightFillColor: '#eeeeee',
        // strokeWidth: 2,
        // strokeColor: '#ff0000',
        // highlightStrokeColor: '#c3d9ff',

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
         * If true, the infobox is shown on mouse/pen over, if false not.
         * If the value is 'inherit', the value of
         * {@link JXG.Board#showInfobox} is taken.
         *
         * @name Point#showInfobox
         * @see JXG.Board#showInfobox
         * @type {Boolean|String} true | false | 'inherit'
         * @default true
         */
        showInfobox: 'inherit',

        /**
         * Truncating rule for the digits in the infobox.
         * <ul>
         * <li>'auto': done automatically by JXG.autoDigits()
         * <li>'none': no truncation
         * <li>number: truncate after "number digits" with JXG.toFixed()
         * </ul>
         *
         * @name Point#infoboxDigits
         *
         * @type String, Number
         * @default 'auto'
         * @see JXG#autoDigits
         * @see JXG#toFixed
         */
        infoboxDigits: 'auto',

        draft: false,

        /**
         * List of attractor elements. If the distance of the point is less than
         * attractorDistance the point is made to glider of this element.
         *
         * @name Point#attractors
         *
         * @type Array
         * @default empty
         */
        attractors: [],

        /**
         * Unit for attractorDistance and snatchDistance, used for magnetized points and for snapToPoints.
         * Possible values are 'screen' and 'user'.
         *
         * @name Point#attractorUnit
         *
         * @see Point#attractorDistance
         * @see Point#snatchDistance
         * @see Point#snapToPoints
         * @see Point#attractors
         * @type String
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
         * @type Number
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
         * @type Number
         * @default 0.0
         */
        snatchDistance: 0.0,

        /**
         * If set to true, the point will snap to a grid of integer multiples of
         * {@link Point#snapSizeX} and {@link Point#snapSizeY} (in user coordinates).
         * <p>
         * The coordinates of the grid points are either integer multiples of snapSizeX and snapSizeY
         * (given in user coordinates, not pixels) or are the intersection points
         * of the major ticks of the boards default axes in case that snapSizeX, snapSizeY are negative.
         *
         * @name Point#snapToGrid
         *
         * @see Point#snapSizeX
         * @see Point#snapSizeY
         * @type Boolean
         * @default false
         */
        snapToGrid: false,

        /**
         * If set to true, the point will only snap to (possibly invisibly) grid points
         * when within {@link Point#attractorDistance} of such a grid point.
         * <p>
         * The coordinates of the grid points are either integer multiples of snapSizeX and snapSizeY
         * (given in user coordinates, not pixels) or are the intersection points
         * of the major ticks of the boards default axes in case that snapSizeX, snapSizeY are negative.
         *
         * @name Point#attractToGrid
         *
         * @see Point#attractorDistance
         * @see Point#attractorUnit
         * @see Point#snapToGrid
         * @see Point#snapSizeX
         * @see Point#snapSizeY
         * @type Boolean
         * @default false
         *
         * @example
         * board.create('point', [3, 3], { attractToGrid: true, attractorDistance: 10, attractorunit: 'screen' });
         *
         * </pre><div id="JXG397ab787-cd40-449c-a7e7-a3f7bab1d4f6" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG397ab787-cd40-449c-a7e7-a3f7bab1d4f6',
         *             {boundingbox: [-1, 4, 7,-4], axis: true, showcopyright: false, shownavigation: false});
         *     board.create('point', [3, 3], { attractToGrid: true, attractorDistance: 10, attractorunit: 'screen' });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        attractToGrid: false,

        /**
         * Defines together with {@link Point#snapSizeY} the grid the point snaps on to.
         * It is given in user coordinates, not in pixels.
         * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
         * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
         * of the default ticks of the default x axes of the board.
         *
         * @name Point#snapSizeX
         *
         * @see Point#snapToGrid
         * @see Point#snapSizeY
         * @see JXG.Board#defaultAxes
         * @type Number
         * @default 1
         */
        snapSizeX: 1,

        /**
         * Defines together with {@link Point#snapSizeX} the grid the point snaps on to.
         * It is given in user coordinates, not in pixels.
         * The point will only snap on integer multiples to snapSizeX in x and snapSizeY in y direction.
         * If this value is equal to or less than <tt>0</tt>, it will use the grid displayed by the major ticks
         * of the default ticks of the default y axes of the board.
         *
         * @name Point#snapSizeY
         *
         * @see Point#snapToGrid
         * @see Point#snapSizeX
         * @see JXG.Board#defaultAxes
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
        snapToPoints: false,

        /**
         * List of elements which are ignored by snapToPoints.
         * @name Point#ignoredSnapToPoints
         *
         * @type Array
         * @default empty
         */
        ignoredSnapToPoints: []

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

        fillColor: Color.palette.yellow,
        highlightFillColor: Color.palette.yellow,
        // fillColor: '#00ff00',
        // highlightFillColor: '#00ff00',
        fillOpacity: 0.3,
        highlightFillOpacity: 0.2,

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
            },
            visible: 'inherit'
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
            strokeColor: Color.palette.red,
            fillColor: Color.palette.red,
            fixed: false,
            visible: 'inherit'
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

    /* special polygonal chain options
    */
    polygonalchain: {
        /**#@+
         * @visprop
         */

        fillColor: 'none',
        highlightFillColor: 'none'

        /**#@-*/
    },

    /* special prescribed angle options
    * Not yet implemented. But angle.setAngle(val) is implemented.
    */
    prescribedangle: {
        /**#@+
         * @visprop
         */

        /**
         * Attributes for the helper point of the prescribed angle.
         *
         * @type Point
         * @name PrescribedAngle#anglePoint
         */
        anglePoint: {
            size: 2,
            visible: false,
            withLabel: false
        }

        /**#@-*/
    },

    /* special reflection options */
    reflection: {
        /**#@+
         * @visprop
         */

        fixed: true,

        /**
         * Attributes of circle center, i.e. the center of the circle,
         * if a circle is the mirror element and the transformation type is 'Euclidean'
         *
         * @type Point
         * @name Mirrorelement#center
         */
        center: {},

        /**
         * Type of transformation. Possible values are 'Euclidean', 'projective'.
         *
         * If the value is 'Euclidean', the reflected element of a circle is again a circle,
         * otherwise it is a conic section.
         *
         * @type String
         * @name Reflection#type
         * @default 'Euclidean'
         */
        type: 'Euclidean'

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
        fillColor: Color.palette.yellow,
        highlightFillColor: Color.palette.yellow,
        fillOpacity: 0.3,
        highlightFillOpacity: 0.2,

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
            strokeColor: Color.palette.red,
            fillColor: Color.palette.red,
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
        fillColor: Color.palette.yellow

        /**#@-*/
    },

    /* special sector options */
    sector: {
        /**#@+
         * @visprop
         */

        fillColor: Color.palette.yellow,
        highlightFillColor: Color.palette.yellow,
        // fillColor: '#00ff00',
        // highlightFillColor: '#00ff00',

        fillOpacity: 0.3,
        highlightFillOpacity: 0.3,
        highlightOnSector: false,
        highlightStrokeWidth: 0,

        /**
         * Type of sector. Possible values are 'minor', 'major', and 'auto'.
         *
         * @type String
         * @name Sector#selection
         * @default 'auto'
         */
        selection: 'auto',

        /**
         * Attributes for sub-element arc. It is only available, if the sector is defined by three points.
         *
         * @type Arc
         * @name Sector#arc
         * @default '{visible:false}'
         */
        arc: {
            visible: false,
            fillColor: 'none'
        },

        /**
         * Attributes for helper point radiuspoint in case it is provided by coordinates.
         *
         * @type Point
         * @name Sector#radiusPoint
         */
        radiusPoint: {
            visible: false,
            withLabel: false
        },

        /**
         * Attributes for helper point center in case it is provided by coordinates.
         *
         * @type Point
         * @name Sector#center
         */
        center: {
            visible: false,
            withLabel: false
        },

        /**
         * Attributes for helper point anglepoint in case it is provided by coordinates.
         *
         * @type Point
         * @name Sector#anglePoint
         */
        anglePoint: {
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
            offset: [0, 0],
            anchorX: 'auto',
            anchorY: 'auto'
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
         * @name Semicircle#center
         */
        center: {
            visible: false,
            withLabel: false,
            fixed: false,
            fillColor: Color.palette.red,
            strokeColor: Color.palette.red,
            highlightFillColor: '#eeeeee',
            highlightStrokeColor: Color.palette.red,
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
         * Replaced by the attribute "digits".
         *
         * @memberOf Slider.prototype
         * @name precision
         * @type Number
         * @deprecated
         * @see Slider#digits
         * @default 2
         */
        precision: 2,

        /**
         * The number of digits of the slider value displayed in the optional text.
         *
         * @memberOf Slider.prototype
         * @name digits
         * @type Number
         * @default 2
         */
        digits: 2,

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

        /**
         * If not null, this replaces the part "name = " in the slider label.
         * Possible types: string, number or function.
         * @type String
         * @name suffixLabel
         * @memberOf Slider.prototype
         * @default null
         * @see JXG.Slider#unitLabel
         * @see JXG.Slider#postLabel
         */
        suffixLabel: null,

        /**
         * If not null, this is appended to the value in the slider label.
         * Possible types: string, number or function.
         * @type String
         * @name unitLabel
         * @memberOf Slider.prototype
         * @default null
         * @see JXG.Slider#suffixLabel
         * @see JXG.Slider#postLabel
         */
        unitLabel: null,

        /**
         * If not null, this is appended to the value and to unitLabel in the slider label.
         * Possible types: string, number or function.
         * @type String
         * @name postLabel
         * @memberOf Slider.prototype
         * @default null
         * @see JXG.Slider#suffixLabel
         * @see JXG.Slider#unitLabel
         */
        postLabel: null,

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
            visible: 'inherit',
            fixed: true,
            scalable: false,
            tabindex: null,
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

            // Label drawing
            drawLabels: false,
            digits: 2,
            includeBoundaries: 1,
            drawZero: true,
            label: {
                offset: [-4, -14],
                display: 'internal'
            },

            minTicksDistance: 30,
            insertTicks: true,
            minorHeight: 4,         // if <0: full width and height
            majorHeight: 5,        // if <0: full width and height
            minorTicks: 0,
            defaultDistance: 1,
            strokeOpacity: 1,
            strokeWidth: 1,
            tickEndings: [0, 1],
            majortickEndings: [0, 1],
            strokeColor: '#000000',
            visible: 'inherit'
        },

        /**
         * Attributes for the highlighting line of the slider.
         *
         * @type Line
         * @name Slider#highline
         */
        highline: {
            strokeWidth: 3,
            visible: 'inherit',
            fixed: true,
            tabindex: null,
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
            visible: 'inherit',
            strokeColor: '#000000'
        },

        /**
         * If true, 'up' events on the baseline will trigger slider moves.
         *
         * @type Boolean
         * @name Slider#moveOnUp
         * @default true
         */
        moveOnUp: true

        /**#@-*/
    },

    /* special vector field options */
    slopefield: {
        /**#@+
         * @visprop
         */

        strokeWidth: 0.5,
        highlightStrokeWidth: 0.5,
        highlightStrokeColor: Color.palette.blue,
        highlightStrokeOpacity: 0.8,

        /**
         * Set length of the vectors in user coordinates. This in contrast to vector fields, where this attribute just scales the vector.
         * @name scale
         * @memberOf Slopefield.prototype
         * @type {Number|Function}
         * @see Vectorfield.scale
         * @default 1
         */
        scale: 1,

        /**
         * Customize arrow heads of vectors. Be careful! If enabled this will slow down the performance.
         * Fields are:
         * <ul>
         *  <li> enabled: Boolean
         *  <li> size: length of the arrow head legs (in pixel)
         *  <li> angle: angle of the arrow head legs In radians.
         * </ul>
         * @name arrowhead
         * @memberOf Slopefield.prototype
         * @type {Object}
         * @default <tt>{enabled: false, size: 5, angle: Math.PI * 0.125}</tt>
         */
        arrowhead: {
            enabled: false,
            size: 5,
            angle: Math.PI * 0.125
        }

        /**#@-*/
    },

    /* special options for slope triangle */
    slopetriangle: {
        /**#@+
         * @visprop
         */

        fillColor: Color.palette.red,
        fillOpacity: 0.4,
        highlightFillColor: Color.palette.red,
        highlightFillOpacity: 0.3,

        borders: {
            lastArrow: {
                type: 1,
                size: 6
            }
        },

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
         * Attributes for the tangent.
         * The tangent is constructed by slop triangle if the construction
         * is based on a glider, solely.
         *
         * @type Line
         * @name Slopetriangle#tangent
         */
        tangent: {
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

    /* special options for smartlabel of angle */
    smartlabelangle: {
        cssClass: 'smart-label-solid smart-label-angle',
        highlightCssClass:'smart-label-solid smart-label-angle',
        anchorX: 'left',
        anchorY: 'middle',

        unit: '',
        prefix: '',
        suffix: '',

        measure: 'deg',
        useMathJax: true
    },

    /* special options for smartlabel of circle */
    smartlabelcircle: {
        /**#@+
         * @visprop
         */

        /**
         * CSS classes for the smart label. Available classes are:
         * <ul>
         * <li> 'smart-label-solid'
         * <li> 'smart-label-outline'
         * <li> 'smart-label-pure'
         * </ul>
         *
         * By default, an additional class is given specific for the element type.
         * Available classes are 'smart-label-angle', 'smart-label-circle',
         * 'smart-label-line', 'smart-label-point', 'smart-label-polygon'.
         *
         * @example
         *  cssClass: 'smart-label-solid smart-label-point'
         *
         * @type String
         * @name Smartlabel#cssClass
         * @see Smartlabel#highlightCssClass
         * @default <ul>
         *  <li> 'smart-label-solid smart-label-circle' for circles</li>
         *  <li> 'smart-label-solid smart-label-point' for points</li>
         *  <li> ...</li>
         * </ul>
         */
        cssClass: 'smart-label-solid smart-label-circle',

        /**
         * CSS classes for the smart label when highlighted.
         *
         * @type String
         * @name Smartlabel#highlightCssClass
         * @see Smartlabel#cssClass
         * @default <ul>
         *  <li> 'smart-label-solid smart-label-circle' for circles</li>
         *  <li> 'smart-label-solid smart-label-point' for points</li>
         *  <li> ...</li>
         * </ul>
         */
        highlightCssClass:'smart-label-solid smart-label-circle',
        anchorX: 'middle',
        useMathJax: true,

        /**
         * Measurement unit appended to the output text. For areas, the unit is squared automatically.
         * Comes directly after the measurement value.
         *
         * @type {String|Function}
         * @name Smartlabel#unit
         * @default ''
         */
        unit: '',

        /**
         * Prefix text for the smartlabel. Comes before the measurement value.
         *
         * @type {String|Function}
         * @name Smartlabel#prefix
         * @default ''
         */
        prefix: '',

        /**
         * Suffix text for the smartlabel. Comes after unit.
         *
         * @type {String|Function}
         * @name Smartlabel#suffix
         * @default ''
         */
        suffix: '',

        /**
         * Type of measurement.
         * Available values are:
         *  <ul>
         *  <li> 'deg', 'rad' for angles</li>
         *  <li> 'area', 'perimeter', 'radius' for circles</li>
         *  <li> 'length', 'slope' for lines</li>
         *  <li> 'area', 'perimeter' for polygons</li>
         * </ul>
         * Dependent on this value, i.e. the type of measurement, the label is
         * positioned differently on the object.
         *
         * @type String
         * @name Smartlabel#measure
         * @default <ul>
         *   <li> 'radius' for circles</li>
         *   <li> 'length' for lines</li>
         *   <li> 'area' for polygons</li>
         *   <li> 'deg' for angles</li>
         * </ul>
         */
        measure: 'radius',

        /**#@-*/
    },

    /* special options for smartlabel of line */
    smartlabelline: {
        cssClass: 'smart-label-solid smart-label-line',
        highlightCssClass:'smart-label-solid smart-label-line',
        anchorX: 'middle',

        useMathJax: true,

        unit: '',
        measure: 'length'
    },

    /* special options for smartlabel of point */
    smartlabelpoint: {
        /**#@+
         * @visprop
         */

        cssClass: 'smart-label-solid smart-label-point',
        highlightCssClass:'smart-label-solid smart-label-point',
        anchorX: 'middle',
        anchorY: 'top',

        useMathJax: true,

        /**
         * Display of point coordinates either as row vector or column vector.
         * Available values are 'row' or 'column'.
         * @type String
         * @name Smartlabel#dir
         * @default 'row'
         */
        dir: 'row',

        unit: ''
        /**#@-*/
    },

    /* special options for smartlabel of polygon */
    smartlabelpolygon: {
        cssClass: 'smart-label-solid smart-label-polygon',
        highlightCssClass:'smart-label-solid smart-label-polygon',
        anchorX: 'middle',

        useMathJax: true,

        unit: '',
        measure: 'area'
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
         * Text rotation in degrees.
         *
         * @name Tapemeasure#rotate
         * @type Number
         * @default 0
         */
        rotate: 0,

        /**
         * The precision of the tape measure value displayed in the optional text.
         * Replaced by the attribute digits
         *
         * @memberOf Tapemeasure.prototype
         * @name precision
         * @type Number
         * @deprecated
         * @see Tapemeasure#digits
         * @default 2
         */
        precision: 2,

        /**
         * The precision of the tape measure value displayed in the optional text.
         * @memberOf Tapemeasure.prototype
         * @name precision
         * @type Number
         * @default 2
         */
        digits: 2,

        /**
         * Attributes for first helper point defining the tape measure position.
         *
         * @type Point
         * @name Tapemeasure#point1
         */
        point1: {
            visible: 'inherit',
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
            visible: 'inherit',
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
            majorTickEndings: [0, 1],
            defaultDistance: 0.1,
            strokeOpacity: 1,
            strokeWidth: 1,
            strokeColor: '#000000',
            visible: 'inherit'
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
         * @see Text#fontUnit
         */
        fontSize: 12,

        /**
         * CSS unit for the font size of a text element. Usually, this will be the default value 'px' but
         * for responsive application, also 'vw', 'vh', vmax', 'vmin' or 'rem' might be useful.
         *
         * @name fontUnit
         * @memberOf Text.prototype
         * @default 'px'
         * @type String
         * @see Text#fontSize
         *
         * @example
         * var txt = board.create('text', [2, 2, "hello"], {fontSize: 8, fontUnit: 'vmin'});
         *
         * </pre><div id="JXG2da7e972-ac62-416b-a94b-32559c9ec9f9" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG2da7e972-ac62-416b-a94b-32559c9ec9f9',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var txt = board.create('text', [2, 2, "hello"], {fontSize: 8, fontUnit: 'vmin'});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        fontUnit: 'px',

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

        strokeColor: '#000000',
        highlightStrokeColor: '#000000',
        highlightStrokeOpacity: 0.666666,

        /**
         * Default CSS properties of the HTML text element.
         * <p>
         * The CSS properties which are set here, are handed over to the style property
         * of the HTML text element. That means, they have higher property than any
         * CSS class.
         * <p>
         * If a property which is set here should be overruled by a CSS class
         * then this property should be removed here.
         * <p>
         * The reason, why this attribute should be kept to its default value at all,
         * is that screen dumps of SVG boards with <tt>board.renderer.dumpToCanvas()</tt>
         * will ignore the font-family if it is set in a CSS class.
         * It has to be set explicitly as style attribute.
         * <p>
         * In summary, the order of priorities from high to low is
         * <ol>
         *  <li> JXG.Options.text.cssStyle
         *  <li> JXG.Options.text.cssDefaultStyle
         *  <li> JXG.Options.text.cssClass
         * </ol>
         * @example
         * If all texts should get its font-family from the default CSS class
         * before initializing the board
         * <pre>
         *   JXG.Options.text.cssDefaultStyle = '';
         *   JXG.Options.text.highlightCssDefaultStyle = '';
         * </pre>
         * should be called.
         *
         * @name cssDefaultStyle
         * @memberOf Text.prototype
         * @default  'font-family: Arial, Helvetica, Geneva, sans-serif;'
         * @type String
         * @see Text#highlightCssDefaultStyle
         * @see Text#cssStyle
         * @see Text#highlightCssStyle
         */
        cssDefaultStyle: 'font-family: Arial, Helvetica, Geneva, sans-serif;',

        /**
         * Default CSS properties of the HTML text element in case of highlighting.
         * <p>
         * The CSS properties which are set here, are handed over to the style property
         * of the HTML text element. That means, they have higher property than any
         * CSS class.
         * @example
         * If all texts should get its font-family from the default CSS class
         * before initializing the board
         * <pre>
         *   JXG.Options.text.cssDefaultStyle = '';
         *   JXG.Options.text.highlightCssDefaultStyle = '';
         * </pre>
         * should be called.
         *
         * @name highlightCssDefaultStyle
         * @memberOf Text.prototype
         * @default  'font-family: Arial, Helvetica, Geneva, sans-serif;'
         * @type String
         * @see Text#cssDefaultStyle
         * @see Text#cssStyle
         * @see Text#highlightCssStyle
        */
        highlightCssDefaultStyle: 'font-family: Arial, Helvetica, Geneva, sans-serif;',

        /**
         * CSS properties of the HTML text element.
         * <p>
         * The CSS properties which are set here, are handed over to the style property
         * of the HTML text element. That means, they have higher property than any
         * CSS class.
         *
         * @name cssStyle
         * @memberOf Text.prototype
         * @default  ''
         * @type String
         * @see Text#cssDefaultStyle
         * @see Text#highlightCssDefaultStyle
         * @see Text#highlightCssStyle
        */
        cssStyle: '',

        /**
         * CSS properties of the HTML text element in case of highlighting.
         * <p>
         * The CSS properties which are set here, are handed over to the style property
         * of the HTML text element. That means, they have higher property than any
         * CSS class.
         *
         * @name highlightCssStyle
         * @memberOf Text.prototype
         * @default  ''
         * @type String
         * @see Text#cssDefaultStyle
         * @see Text#highlightCssDefaultStyle
         * @see Text#cssStyle
        */
        highlightCssStyle: '',

        transitionProperties: ['color', 'opacity'],

        /**
         * If true, the input will be given to ASCIIMathML before rendering.
         *
         * @name useASCIIMathML
         * @memberOf Text.prototype
         * @default false
         * @type Boolean
         */
        useASCIIMathML: false,

        /**
         * If true, MathJax will be used to render the input string.
         * Supports MathJax 2 as well as Mathjax 3.
         * It is recommended to use this option together with the option
         * "parse: false". Otherwise, 4 backslashes (e.g. \\\\alpha) are needed
         * instead of two (e.g. \\alpha).
         *
         * @name useMathJax
         * @memberOf Text.prototype
         * @default false
         * @type Boolean
         * @see Text#parse
         *
         * @example
         *  // Before loading MathJax, it has to be configured something like this:
         * window.MathJax = {
         *   tex: {
         *     inlineMath: [ ['$','$'], ["\\(","\\)"] ],
         *     displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
         *     packages: ['base', 'ams']
         *   },
         *   options: {
         *     ignoreHtmlClass: 'tex2jax_ignore',
         *     processHtmlClass: 'tex2jax_process'
         *   }
         * };
         *
         * // Display style
         * board.create('text',[ 2,2,  function(){return '$$X=\\frac{2}{x}$$'}], {
         *     fontSize: 15, color:'green', useMathJax: true});
         *
         * // Inline style
         * board.create('text',[-2,2,  function(){return '$X_A=\\frac{2}{x}$'}], {
         *     fontSize: 15, color:'green', useMathJax: true});
         *
         * var A = board.create('point', [-2, 0]);
         * var B = board.create('point', [1, 0]);
         * var C = board.create('point', [0, 1]);
         *
         * var graph = board.create('ellipse', [A, B, C], {
         *         fixed: true,
         *         withLabel: true,
         *         strokeColor: 'black',
         *         strokeWidth: 2,
         *         fillColor: '#cccccc',
         *         fillOpacity: 0.3,
         *         highlightStrokeColor: 'red',
         *         highlightStrokeWidth: 3,
         *         name: '$1=\\frac{(x-h)^2}{a^2}+\\frac{(y-k)^2}{b^2}$',
         *         label: {useMathJax: true}
         *     });
         *
         * var nvect1 = board.create('text', [-4, -3, '\\[\\overrightarrow{V}\\]'],
         * {
         *   fontSize: 24, parse: false
         * });
         * var nvect1 = board.create('text', [-2, -4, function() {return '$\\overrightarrow{G}$';}],
         * {
         *   fontSize: 24, useMathJax: true
         * });
         *
         * </pre>
         * <script>
         * window.MathJax = {
         *   tex: {
         *     inlineMath: [ ['$','$'], ["\\(","\\)"] ],
         *     displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
         *     packages: ['base', 'ams']
         *   },
         *   options: {
         *     ignoreHtmlClass: 'tex2jax_ignore',
         *     processHtmlClass: 'tex2jax_process'
         *   }
         * };
         * </script>
         * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
         * <div id="JXGe2a04876-5813-4db0-b7e8-e48bf4e220b9" class="jxgbox" style="width: 400px; height: 400px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGe2a04876-5813-4db0-b7e8-e48bf4e220b9',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
         *     // Display style
         *     board.create('text',[ 2,2,  function(){return '$$X=\\frac{2}{x}$$'}], {
         *         fontSize: 15, color:'green', useMathJax: true});
         *
         *     // Inline style
         *     board.create('text',[-2,2,  function(){return '$X_A=\\frac{2}{x}$'}], {
         *         fontSize: 15, color:'green', useMathJax: true});
         *
         *     var A = board.create('point', [-2, 0]);
         *     var B = board.create('point', [1, 0]);
         *     var C = board.create('point', [0, 1]);
         *
         *     var graph = board.create('ellipse', [A, B, C], {
         *             fixed: true,
         *             withLabel: true,
         *             strokeColor: 'black',
         *             strokeWidth: 2,
         *             fillColor: '#cccccc',
         *             fillOpacity: 0.3,
         *             highlightStrokeColor: 'red',
         *             highlightStrokeWidth: 3,
         *             name: '$1=\\frac{(x-h)^2}{a^2}+\\frac{(y-k)^2}{b^2}$',
         *             label: {useMathJax: true}
         *         });
         *
         *     var nvect1 = board.create('text', [-4, -3, '\\[\\overrightarrow{V}\\]'],
         *     {
         *       fontSize: 24, parse: false
         *     });
         *     var nvect1 = board.create('text', [-2, -4, function() {return '$\\overrightarrow{G}$';}],
         *     {
         *       fontSize: 24, useMathJax: true
         *     });
         *     })();
         *
         * </script><pre>
         *
         *
         * @example
         * // Load MathJax:
         * // &lt;script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"&lt;&lt;/script&gt;
         *
         * // function and its derivative
         * var f1 = function(x) { return x * x * x; },
         * graph1 = board.create('functiongraph', [f1, -0.1, 1.1]),
         *
         * A = board.create('glider', [0.5, f1(0.5), graph1], {
         *             name: 'f(x)',
         *             color: 'black',
         *             face:'x',
         *             fixed: true,
         *             size: 3,
         *             label: {offset: [-30, 10], fontSize: 15}
         *         }),
         * B = board.create('glider', [0.7, f1(0.7), graph1], {
         *             name: 'f(x+&Delta;x)',
         *             size: 3,
         *             label: {offset: [-60, 10], fontSize: 15}
         *         }),
         *
         * secant_line = board.create('line', [A,B],{dash: 1, color: 'green'}),
         * a_h_segment = board.create('segment', [A, [
         *                     function(){ return B.X() > A.X() ? B.X() : A.X()},
         *                     function(){ return B.X() > A.X() ? A.Y() : B.Y()}
         *                 ]],{ name: '&Delta;x', dash: 1, color: 'black'});
         *
         * b_v_segment = board.create('segment', [B, [
         *                     function(){ return B.X() > A.X() ? B.X() : A.X()},
         *                     function(){ return B.X() > A.X() ? A.Y() : B.Y()}
         *                 ]],{ name: '&Delta;y', dash: 1, color: 'black'}),
         *
         * ma = board.create('midpoint', [a_h_segment.point1, a_h_segment.point2
         *     ], {visible: false});
         *
         * board.create('text', [0, 0, function() {return '\\[\\Delta_x='+(B.X()-A.X()).toFixed(4)+'\\]'}], {
         *     anchor: ma, useMathJax: true, fixed: true, color: 'green', anchorY: 'top'
         * });
         *
         * mb = board.create('midpoint', [b_v_segment.point1, b_v_segment.point2], {visible: false});
         * board.create('text', [0, 0, function() {return '\\[\\Delta_y='+(B.Y()-A.Y()).toFixed(4)+'\\]'}], {
         *     anchor: mb, useMathJax: true, fixed: true, color: 'green'
         * });
         *
         * dval = board.create('text',[0.1, 0.8,
         *     function(){
         *         return '\\[\\frac{\\Delta_y}{\\Delta_x}=\\frac{' + ((B.Y()-A.Y()).toFixed(4)) + '}{' + ((B.X()-A.X()).toFixed(4)) +
         *             '}=' + (((B.Y()-A.Y()).toFixed(4))/((B.X()-A.X()).toFixed(4))).toFixed(4) + '\\]';
         *     }],{fontSize: 15, useMathJax: true});
         *
         * </pre>
         * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
         * <div id="JXG8c2b65e7-4fc4-43f7-b23c-5076a7fa9621" class="jxgbox" style="width: 400px; height: 400px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG8c2b65e7-4fc4-43f7-b23c-5076a7fa9621',
         *             {boundingbox: [-0.1, 1.1, 1.1, -0.1], axis: true, showcopyright: false, shownavigation: false});
         *     // function and its derivative
         *     var f1 = function(x) { return x * x * x; },
         *     graph1 = board.create('functiongraph', [f1, -0.1, 1.1]),
         *
         *     A = board.create('glider', [0.5, f1(0.5), graph1], {
         *                 name: 'f(x)',
         *                 color: 'black',
         *                 face:'x',
         *                 fixed: true,
         *                 size: 3,
         *                 label: {offset: [-30, 10], fontSize: 15}
         *             }),
         *     B = board.create('glider', [0.7, f1(0.7), graph1], {
         *                 name: 'f(x+&Delta;x)',
         *                 size: 3,
         *                 label: {offset: [-60, 10], fontSize: 15}
         *             }),
         *
         *     secant_line = board.create('line', [A,B],{dash: 1, color: 'green'}),
         *     a_h_segment = board.create('segment', [A, [
         *                         function(){ return B.X() > A.X() ? B.X() : A.X()},
         *                         function(){ return B.X() > A.X() ? A.Y() : B.Y()}
         *                     ]],{ name: '&Delta;x', dash: 1, color: 'black'});
         *
         *     b_v_segment = board.create('segment', [B, [
         *                         function(){ return B.X() > A.X() ? B.X() : A.X()},
         *                         function(){ return B.X() > A.X() ? A.Y() : B.Y()}
         *                     ]],{ name: '&Delta;y', dash: 1, color: 'black'}),
         *
         *     ma = board.create('midpoint', [a_h_segment.point1, a_h_segment.point2
         *         ], {visible: false});
         *
         *     board.create('text', [0, 0, function() {return '\\[\\Delta_x='+(B.X()-A.X()).toFixed(4)+'\\]'}], {
         *         anchor: ma, useMathJax: true, fixed: true, color: 'green', anchorY: 'top'
         *     });
         *
         *     mb = board.create('midpoint', [b_v_segment.point1, b_v_segment.point2], {visible: false});
         *     board.create('text', [0, 0, function() {return '\\[\\Delta_y='+(B.Y()-A.Y()).toFixed(4)+'\\]'}], {
         *         anchor: mb, useMathJax: true, fixed: true, color: 'green'
         *     });
         *
         *     dval = board.create('text',[0.1, 0.8,
         *         function(){
         *             return '\\[\\frac{\\Delta_y}{\\Delta_x}=\\frac{' + ((B.Y()-A.Y()).toFixed(4)) + '}{' + ((B.X()-A.X()).toFixed(4)) +
         *                 '}=' + (((B.Y()-A.Y()).toFixed(4))/((B.X()-A.X()).toFixed(4))).toFixed(4) + '\\]';
         *         }],{fontSize: 15, useMathJax: true});
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-1, 10, 11, -2], axis: true});
         * board.options.text.useMathjax = true;
         *
         * a = board.create('slider',[[-0.7,1.5],[5,1.5],[0,0.5,1]], {
         *     suffixlabel:'\\(t_1=\\)',
         *     unitLabel: ' \\(\\text{ ms}\\)',
         *     snapWidth:0.01}),
         *
         * func = board.create('functiongraph',[function(x){return (a.Value()*x*x)}], {strokeColor: "red"});
         * text1 = board.create('text', [5, 1, function(){
         *             return '\\(a(t)= { 1 \\over ' + a.Value().toFixed(3) + '}\\)';
         *         }], {fontSize: 15, fixed:true, strokeColor:'red', anchorY: 'top', parse: false});
         *
         * </pre><div id="JXGf8bd01db-fb6a-4a5c-9e7f-8823f7aa5ac6" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGf8bd01db-fb6a-4a5c-9e7f-8823f7aa5ac6',
         *             {boundingbox: [-1, 10, 11, -2], axis: true, showcopyright: false, shownavigation: false});
         *     board.options.text.useMathjax = true;
         *
         *     a = board.create('slider',[[-0.7,1.5],[5,1.5],[0,0.5,1]], {
         *         suffixlabel:'\\(t_1=\\)',
         *         unitLabel: ' \\(\\text{ ms}\\)',
         *         snapWidth:0.01}),
         *
         *     func = board.create('functiongraph',[function(x){return (a.Value()*x*x)}], {strokeColor: "red"});
         *     text1 = board.create('text', [5, 1, function(){
         *                 return '\\(a(t)= { 1 \\over ' + a.Value().toFixed(3) + '}\\)';
         *             }], {fontSize: 15, fixed:true, strokeColor:'red', anchorY: 'top', parse: false});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        useMathJax: false,

        /**
         *
         * If true, KaTeX will be used to render the input string.
         * For this feature, katex.min.js and katex.min.css have to be included.
         * <p>
         * The example below does not work, because there is a conflict with
         * the MathJax library which is used below.
         * </p>
         *
         * @name useKatex
         * @memberOf Text.prototype
         * @default false
         * @type Boolean
         *
         *
         * @example
         * JXG.Options.text.useKatex = true;
         *
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-2, 5, 8, -5], axis:true
         * });
         *
         * var a = board.create('slider',[[-0.7,1.5],[5,1.5],[0,0.5,1]], {
         *     suffixlabel:'t_1=',
         *     unitLabel: ' \\text{ ms}',
         *     snapWidth:0.01});
         *
         * func = board.create('functiongraph',[function(x){return (a.Value()*x*x)}], {strokeColor: "red"});
         * text1 = board.create('text', [5, 1, function(){
         *             return 'a(t)= { 1 \\over ' + a.Value().toFixed(3) + '}';
         *         }], {fontSize: 15, fixed:true, strokeColor:'red', anchorY: 'top'});
         *
         * </pre>
         * <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.13.10/dist/katex.min.css" integrity="sha384-0cCFrwW/0bAk1Z/6IMgIyNU3kfTcNirlObr4WjrUU7+hZeD6ravdYJ3kPWSeC31M" crossorigin="anonymous">
         * <script src="https://cdn.jsdelivr.net/npm/katex@0.13.10/dist/katex.min.js" integrity="sha384-dtFDxK2tSkECx/6302Z4VN2ZRqt6Gis+b1IwCjJPrn0kMYFQT9rbtyQWg5NFWAF7" crossorigin="anonymous"></script>
         * <div id="JXG497f065c-cfc1-44c3-ba21-5fa581668869" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG497f065c-cfc1-44c3-ba21-5fa581668869',
         *             {boundingbox: [-2, 5, 8, -5], axis: true, showcopyright: false, shownavigation: false});
         *     board.options.useKatex = true;
         *     var a = board.create('slider',[[-0.7,1.5],[5,1.5],[0,0.5,1]], {
         *         suffixlabel:'t_1=',
         *         unitLabel: ' \\text{ ms}',
         *         snapWidth:0.01});
         *
         *     func = board.create('functiongraph',[function(x){return (a.Value()*x*x)}], {strokeColor: "red"});
         *     text1 = board.create('text', [5, 1, function(){
         *                 return 'a(t)= { 1 \\over ' + a.Value().toFixed(3) + '}';
         *             }], {fontSize: 15, fixed:true, strokeColor:'red', anchorY: 'top'});
         *
         *     })();
         *
         * </script><pre>
         */
        useKatex: false,

        /**
         * Object or function returning an object that contains macros for KaTeX.
         *
         * @name katexMacros
         * @memberOf Text.prototype
         * @default {}
         * @type Object
         *
         * @example
         * // to globally apply macros to all text elements use:
         * JXG.Options.text.katexMacros = {'\\jxg': 'JSXGraph is awesome'};
         *
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-2, 5, 8, -5], axis:true
         * });
         *
         * // This macro only get applied to the p ('text') element
         * var p = board.create('text', [1, 0, '\\jsg \\sR '], { katexMacros: {'\\sR':'\\mathbb{R}'} });
         */
        katexMacros: {},

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
         * Anchor element {@link Point}, {@link Text} or {@link Image} of the text.
         * If it exists, the coordinates of the text are relative
         * to this anchor element. In this case, only numbers are possible coordinates,
         * functions are not supported.
         *
         * @name anchor
         * @memberOf Text.prototype
         * @default null
         * @type Object
         */
        anchor: null,

        /**
         * The horizontal alignment of the text. Possible values include <tt>'auto</tt>, <tt>'left'</tt>,
         * <tt>'middle'</tt>, and <tt>'right'</tt>.
         *
         * @name anchorX
         * @memberOf Text.prototype
         * @default 'left'
         * @type String
         */
        anchorX: 'left',

        /**
         * The vertical alignment of the text. Possible values include <tt>'auto</tt>, <tt>'top'</tt>, <tt>'middle'</tt>, and
         * <tt>'bottom'</tt>.
         * For MathJax or KaTeX, 'top' is recommended.
         *
         * @name anchorY
         * @memberOf Text.prototype
         * @default 'middle'
         * @type String
         */
        anchorY: 'middle',

        /**
         * CSS class of the text in non-highlighted view.
         *
         * @name cssClass
         * @memberOf Text.prototype
         * @type String
         * @default 'JXGtext'
         */
        cssClass: 'JXGtext',

        /**
         * CSS class of the text in highlighted view.
         *
         * @name highlightCssClass
         * @memberOf Text.prototype
         * @type String
         * @default 'JXGtext'
         */
        highlightCssClass: 'JXGtext',

        /**
         * Sensitive area for dragging the text.
         * Possible values are 'all', or something else.
         * If set to 'small', a sensitivity margin at the right and left border is taken.
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
         * @see Point#snapToGrid
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
         * @see Point#snapToGrid
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
         * @type Array
         * @default empty
         */
        attractors: [],

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

    /* special turtle options */
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
            strokeColor: Color.palette.red,
            lastArrow: true
        }
        /**#@-*/
    },

    /* special vector field options */
    vectorfield: {
        /**#@+
         * @visprop
         */

        strokeWidth: 0.5,
        highlightStrokeWidth: 0.5,
        highlightStrokeColor: Color.palette.blue,
        highlightStrokeOpacity: 0.8,

        /**
         * Scaling factor of the vectors. This in contrast to slope fields, where this attribute sets the vector to the given length.
         * @name scale
         * @memberOf Vectorfield.prototype
         * @type {Number|Function}
         * @see Slopefield.scale
         * @default 1
         */
        scale: 1,

        /**
         * Customize arrow heads of vectors. Be careful! If enabled this will slow down the performance.
         * Fields are:
         * <ul>
         *  <li> enabled: Boolean
         *  <li> size: length of the arrow head legs (in pixel)
         *  <li> angle: angle of the arrow head legs In radians.
         * </ul>
         * @name arrowhead
         * @memberOf Vectorfield.prototype
         * @type {Object}
         * @default <tt>{enabled: true, size: 5, angle: Math.PI * 0.125}</tt>
         */
        arrowhead: {
            enabled: true,
            size: 5,
            angle: Math.PI * 0.125
        }

        /**#@-*/
    },

    /**
     * Abbreviations of attributes. Setting the shortcut means setting abbreviated properties
     * to the same value.
     * It is used in {@link JXG.GeometryElement#setAttribute} and in
     * the constructor {@link JXG.GeometryElement}.
     * Attention: In Options.js abbreviations are not allowed.
     * @type Object
     * @name JXG.Options#shortcuts
     *
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
     * Holds all possible properties and the according validators for geometry elements.
     * A validator is either a function
     * which takes one parameter and returns true, if the value is valid for the property,
     * or it is false if no validator is required.
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
            validateNotNegativeInteger = function (v) {
                return validateInteger(v) && v >= 0;
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
                layer: validateNotNegativeInteger,
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
                size: validateNotNegative, //validateInteger,
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
                strokeWidth: validateNotNegative, //validateInteger,
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
     * <tr><td>cross</td><td>x</td></tr>
     * <tr><td>circle</td><td>o</td></tr>
     * <tr><td>square, []</td><td>[]</td></tr>
     * <tr><td>plus</td><td>+</td></tr>
     * <tr><td>minus</td><td>-</td></tr>
     * <tr><td>divide</td><td>|</td></tr>
     * <tr><td>diamond</td><td>&lt;&gt;</td></tr>
     * <tr><td>triangleup</td><td>^, a, A</td></tr>
     * <tr><td>triangledown</td><td>v</td></tr>
     * <tr><td>triangleleft</td><td>&lt;</td></tr>
     * <tr><td>triangleright</td><td>&gt;</td></tr>
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
            divide: '|',
            '|': '|',
            minus: '-',
            '-': '-',
            diamond: '<>',
            '<>': '<>',
            triangleup: '^',
            A: '^',
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

export default JXG.Options;
