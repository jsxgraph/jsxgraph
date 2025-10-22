/*
    Copyright 2008-2025
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

import JXG from "./jxg.js";
import Const from "./base/constants.js";
import Mat from "./math/math.js";
import Color from "./utils/color.js";
import Type from "./utils/type.js";

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
         * Bounding box of the visible area in user coordinates.
         * It is an array consisting of four values:
         * [x<sub>1</sub>, y<sub>1</sub>, x<sub>2</sub>, y<sub>2</sub>]
         *
         * The canvas will be spanned from the upper left corner (x<sub>1</sub>, y<sub>1</sub>)
         * to the lower right corner (x<sub>2</sub>, y<sub>2</sub>).
         *
         * @name JXG.Board#boundingBox
         * @type Array
         * @see JXG.Board#maxBoundingBox
         * @see JXG.Board#keepAspectRatio
         *
         * @default [-5, 5, 5, -5]
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingbox: [-5, 5, 5, -5],
         *         axis: true
         *     });
         */
        boundingBox: [-5, 5, 5, -5],

        /**
         * Enable browser scrolling on touch interfaces if the user double taps into an empty region
         * of the board. In turn, browser scrolling is deactivated as soon as a JSXGraph element is dragged.
         *
         * <ul>
         * <li> Implemented for pointer touch devices - not with mouse, pen or old iOS touch.
         * <li> It only works if browserPan:true
         * <li> One finger action by the settings "pan.enabled:true" and "pan.needTwoFingers:false" has priority.
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
         *
         * Maximum time delay (in msec) between two clicks to be considered
         * as double click. This attribute is used together with {@link JXG.Board#dblClickSuppressClick}.
         * The JavaScript standard is that
         * a click event is preceded by two click events,
         * see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event}.
         * In case of {@link JXG.Board#dblClickSuppressClick} being true, the JavaScript standard is ignored and
         * this time delay is used to suppress the two click events if they are followed by a double click event.
         * <p>
         * In case of {@link JXG.Board#dblClickSuppressClick} being false, this attribute is used
         * to clear the list of clicked elements after the time specified by this attribute.
         * <p>
         * Recommendation: if {@link JXG.Board#dblClickSuppressClick} is true, use a value of approx. 300,
         * otherwise stay with the default 600.
         *
         * @name JXG.Board#clickDelay
         * @type Number
         * @default 600
         * @see JXG.Board#dblClickSuppressClick
         */
        clickDelay: 600,

        /**
         * If false (default), JSXGraph follows the JavaScript standard and fires before a dblclick event two
         * click events.
         * <p>
         * If true, the click events are suppressed if there is a dblclick event.
         * The consequence is that in this case any click event is fired with a delay specified by
         * {@link JXG.Board#clickDelay}.
         *
         * @name JXG.Board#dblClickSuppressClick
         * @type Boolean
         * @default false
         * @see JXG.Board#clickDelay
         *
         */
        dblClickSuppressClick: false,

        /**
         * Attributes for the default axes in case of the attribute
         * axis:true in {@link JXG.JSXGraph#initBoard}.
         *
         * @name JXG.Board#defaultAxes
         * @type Object
         * @default <tt>{x: {name:'x'}, y: {name: 'y'}}</tt>
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
         * @example
         *  // Display ticks labels as fractions
         *  var board = JXG.JSXGraph.initBoard('jxgbox', {
         *      boundingbox: [-1.2, 2.3, 1.2, -2.3],
         *      axis: true,
         *      defaultAxes: {
         *          x: {
         *              ticks: {
         *                  label: {
         *                      useMathJax: true,
         *                      display: 'html',
         *                      toFraction: true
         *                  }
         *              }
         *          },
         *          y: {
         *              ticks: {
         *                  label: {
         *                      useMathJax: true,
         *                      display: 'html',
         *                      toFraction: true
         *                  }
         *              }
         *          }
         *      }
         *  });
         *
         * </pre><div id="JXG484d2f00-c853-4acb-a8bd-46a9e232d13b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG484d2f00-c853-4acb-a8bd-46a9e232d13b',
         *             {boundingbox: [-1.2, 2.3, 1.2, -2.3],
         *              axis: true, showcopyright: false, shownavigation: true,
         *                 defaultAxes: {
         *                     x: {
         *                         ticks: {
         *                             label: {
         *                                 useMathJax: true,
         *                                 display: 'html',
         *                                 toFraction: true
         *                             }
         *                         }
         *                     },
         *                     y: {
         *                         ticks: {
         *                             label: {
         *                                 useMathJax: true,
         *                                 display: 'html',
         *                                 toFraction: true
         *                             }
         *                         }
         *                     }
         *                 }
         *             });
         *     })();
         *
         * </script><pre>
         *
         */
        defaultAxes: {
            x: {
                name: 'x',
                fixed: true,
                needsRegularUpdate: false,
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
                    visible: 'inherit'
                }
            },
            y: {
                name: 'y',
                fixed: true,
                needsRegularUpdate: false,
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
                    visible: 'inherit'
                }
            }
        },

        /**
         * Supply the document object. Defaults to window.document
         *
         * @name JXG.Board#document
         * @type Object
         * @description DOM object
         * @default false (meaning window.document)
         */
        document: false,

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
         * @default <tt>{enabled: true}</tt>
         */
        drag: {
            enabled: true
        },

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
         * @see JXG.AbstractRenderer#drawNavigationBar
         * @type Object
         */
        fullscreen: {
            symbol: '<svg height="1em" width="1em" version="1.1" viewBox="10 10 18 18"><path fill="#666" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path><path fill="#666" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path><path fill="#666" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path><path fill="#666" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path></svg>',
            // symbol: '\u26f6', // '\u26f6' (not supported by MacOS),
            scale: 0.85,
            id: null
        },

        /**
         * If set true and
         * hasPoint() is true for both an element and it's label,
         * the element (and not the label) is taken as drag element.
         * <p>
         * If set false and hasPoint() is true for both an element and it's label,
         * the label is taken (if it is on a higher layer than the element)
         * <p>
         * Meanwhile, this feature might be irrelevant.
         * @name JXG.Board#ignoreLabels
         * @type Booelan
         * @default true
         */
        ignoreLabels: true,

        /**
         * Support for internationalization of number formatting. This affects
         * <ul>
         *  <li> axis labels
         *  <li> infobox
         *  <li> texts consisting of numbers only
         *  <li> smartlabel elements
         *  <li> slider labels
         *  <li> tapemeasure elements
         *  <li> integral element labels
         * </ul>
         * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat">https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat</a>
         * for an overview on the possibilities and the options.
         * <p>
         * User generated texts consisting of texts AND numbers have to be internationalized by the user, see
         * {@link Text#intl}.
         * Language locale and options can be individually controlled for each element by its intl attribute.
         * If no locale is set, the default language of the browser is used.
         *
         * @name JXG.Board#intl
         * @type Object
         * @default <tt>{enabled: false}</tt>
         * @see Integral#label
         * @see Slider#intl
         * @see Text#intl
         * @see Ticks#intl
         * @see JXG.Board.infobox
         *
         * @example
         * // Set the board-wide locale and use individual
         * // options for a text.
         * const board = JXG.JSXGraph.initBoard(BOARDID, {
         *     axis: true,
         *     intl: {
         *         enabled: true,
         *         locale: 'de-DE'
         *     },
         *     boundingbox:[-0.5, 0.5, 0.5, -0.5]
         * });
         *
         * var t = board.create('text', [0.05, 0.2, -Math.PI*100], {
         *         digits: 2,
         *         intl: {
         *                 enabled: true,
         *                 options: {
         *                     style: 'unit',
         *                     unit: 'celsius'
         *                 }
         *             }
         *     });
         *
         * </pre><div id="JXGcbb0305d-92e2-4628-a58a-d0d515c8fec9" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     var board = JXG.JSXGraph.initBoard('JXGcbb0305d-92e2-4628-a58a-d0d515c8fec9', {
         *         axis: true, showcopyright: false, shownavigation: false,
         *         intl: {
         *             enabled: true,
         *             locale: 'de-DE'
         *         },
         *     boundingbox:[-0.5, 0.5, 0.5, -0.5]
         *     });
         *     var t = board.create('text', [0.05, 0.2, -Math.PI*100], {
         *         digits: 2,
         *         intl: {
         *                 enabled: true,
         *                 options: {
         *                     style: 'unit',
         *                     unit: 'celsius'
         *                 }
         *             }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * // Here, locale is disabled in general, but enabled for the horizontal
         * // axis and the infobox.
         * const board = JXG.JSXGraph.initBoard(BOARDID, {
         *     boundingbox: [-0.5, 0.5, 0.5, -0.5],
         *     intl: {
         *         enabled: false,
         *         locale: 'de-DE'
         *     },
         *     keepaspectratio: true,
         *     axis: true,
         *     defaultAxes: {
         *         x: {
         *             ticks: {
         *                 intl: {
         *                         enabled: true,
         *                         options: {
         *                             style: 'unit',
         *                             unit: 'kilometer-per-hour',
         *                             unitDisplay: 'narrow'
         *                         }
         *                 }
         *             }
         *         },
         *         y: {
         *             ticks: {
         *             }
         *         }
         *     },
         *     infobox: {
         *         fontSize: 12,
         *         intl: {
         *             enabled: true,
         *             options: {
         *                 minimumFractionDigits: 4,
         *                 maximumFractionDigits: 5
         *             }
         *         }
         *     }
         * });
         *
         * var p = board.create('point', [0.1, 0.1], {});
         *
         * </pre><div id="JXG07d5d95c-9324-4fc4-aad3-098e433f195f" class="jxgbox" style="width: 600px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     var board = JXG.JSXGraph.initBoard('JXG07d5d95c-9324-4fc4-aad3-098e433f195f', {
         *         boundingbox: [-0.5, 0.5, 0.5, -0.5], showcopyright: false, shownavigation: false,
         *         intl: {
         *             enabled: false,
         *             locale: 'de-DE'
         *         },
         *         keepaspectratio: true,
         *         axis: true,
         *         defaultAxes: {
         *             x: {
         *                 ticks: {
         *                     intl: {
         *                             enabled: true,
         *                             options: {
         *                                 style: 'unit',
         *                                 unit: 'kilometer-per-hour',
         *                                 unitDisplay: 'narrow'
         *                             }
         *                     }
         *                 }
         *             },
         *             y: {
         *                 ticks: {
         *                 }
         *             }
         *         },
         *         infobox: {
         *             fontSize: 12,
         *             intl: {
         *                 enabled: true,
         *                 options: {
         *                     minimumFractionDigits: 4,
         *                     maximumFractionDigits: 5
         *                 }
         *             }
         *         }
         *     });
         *
         *     var p = board.create('point', [0.1, 0.1], {});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        intl: {
            enabled: false
        },

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
         * @see JXG.Board#boundingBox
         * @see JXG.Board#maxBoundingBox
         * @see JXG.Board#setBoundingBox
         * @type Boolean
         * @default false
         */
        keepAspectRatio: false,

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
         * @default <tt>{enabled: true, dx: 10, dy:10, panShift: true, panCtrl: false}</tt>
         */
        keyboard: {
            enabled: true,
            dx: 10,
            dy: 10,
            panShift: true,
            panCtrl: false
        },

        /**
         * If enabled, user activities are logged in array "board.userLog".
         *
         * @name JXG.Board#logging
         * @type Object
         * @default <tt>{enabled: false}</tt>
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
        },

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
         * Maximal bounding box of the visible area in user coordinates.
         * It is an array consisting of four values:
         * [x<sub>1</sub>, y<sub>1</sub>, x<sub>2</sub>, y<sub>2</sub>]
         *
         * The bounding box of the canvas must be inside of this maximal
         * bounding box.
         *
         * @name JXG.Board#maxBoundingBox
         * @type Array
         * @see JXG.Board#boundingBox
         * @default [-Infinity, Infinity, Infinity, -Infinity]
         *
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *         boundingBox: [-5, 5, 5, -5],
         *         maxBoundingBox: [-8, 8, 8, -8],
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
         * Maximum frame rate of the board, i.e. maximum number of updates per second
         * triggered by move events.
         *
         * @name JXG.Board#maxFrameRate
         * @type Number
         * @default 40
         */
        maxFrameRate: 40,

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
         * Element which listens to move events of the pointing device.
         * This allows to drag elements of a JSXGraph construction outside of the board.
         * Especially, on mobile devices this enhances the user experience.
         * However, it is recommended to allow dragging outside of the JSXGraph board only
         * in certain constructions where users may not "loose" points outside of the board.
         * In such a case, points may become unreachable.
         * <p>
         * A situation where dragging outside of the board is uncritical is for example if
         * only sliders are used to interact with the construction.
         * <p>
         * Possible values for this attributes are:
         * <ul>
         * <li> an element specified by document.getElementById('some id');
         * <li> null: to use the JSXGraph container div element
         * <li> document
         * </ul>
         * <p>
         * Since the introduction of this attribute "moveTarget", the value "document" has become sort of
         * default on touch devices like smartphones. However, it is no longer the case that the document listens to
         * move events, but there is the new feature "setPointerCapture", which is also implicitly enabled on certain devices.
         * In future versions, JSXGraph may adopt this new standard and distinguish only two cases:
         * <ul>
         * <li>null: no pointerCapture
         * <li>document: use pointerCapture
         * </ul>
         * <p>
         * This attribute is immutable.
         * It can be changed as follows:
         *
         * @example
         * board.setAttribute({moveTarget: null});
         * board.removeEventHandlers();
         * board.addEventHandlers();
         *
         * @name JXG.Board#moveTarget
         * @type Object
         * @description HTML node or document
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
         * Allow user interaction by registering pointer events (including mouse and
         * touch events), fullscreen, keyboard, resize, and zoom events.
         * The latter events are essentially mouse wheel events.
         * Decide if JSXGraph listens to these events.
         * <p>
         * Using a Boolean value turns on all events (or not), supplying an object of
         * the form
         * <pre>
         *  {
         *     fullscreen: true / false,
         *     keyboard: true / false,
         *     pointer: true / false,
         *     resize: true / false,
         *     wheel: true / false
         *  }
         * </pre>
         * activates individual event handlers. If an event is NOT given,
         * it will be activated.
         * <p>This attribute is immutable. Please use
         * {@link JXG.Board#addEventHandlers()} and
         * {@link JXG.Board#removeEventHandlers()} directly.
         *
         * @name JXG.Board.registerEvents
         * @see JXG.Board#keyboard
         * @see JXG.Board.registerResizeEvent
         * @see JXG.Board.registerFullscreenEvent
         * @type Boolean
         * @default true
         */
        registerEvents: true,

        // /**
        //  * Listen to fullscreen event.
        //  *
        //  * <p>This attribute is immutable. Please use
        //  * {@link JXG.Board#addFullscreenEventHandlers()} and
        //  * {@link JXG.Board#removeEventHandlers()} directly.
        //  *
        //  * @name JXG.Board#registerFullscreenEvent
        //  * @see JXG.Board#registerEvents
        //  * @see JXG.Board#registerResizeEvent
        //  * @type Boolean
        //  * @default true
        //  */
        // registerFullscreenEvent: true,

        // /**
        //  * Listen to resize events, i.e. start "resizeObserver" or handle the resize event with
        //  * "resizeListener". This is independent from the mouse, touch, pointer events.
        //  *
        //  * <p>This attribute is immutable. Please use
        //  * {@link JXG.Board#addResizeEventHandlers()} and
        //  * {@link JXG.Board#removeEventHandlers()} directly.
        //  * <p>
        //  * This attribute just starts a resizeObserver. If the resizeObserver reacts
        //  * to size changed is controlled with {@link JXG.Board#resize}.
        //  *
        //  * @name JXG.Board#registerResizeEvent
        //  * @see JXG.Board#resize
        //  * @see JXG.Board#registerEvents
        //  * @see JXG.Board#registerFullscreenEvent
        //  * @type Boolean
        //  * @default true
        //  */
        // registerResizeEvent: true,

        /**
         * Default rendering engine. Possible values are 'svg', 'canvas', 'vml', 'no', or 'auto'.
         * If the rendering engine is not available JSXGraph tries to detect a different engine.
         *
         * <p>
         * In case of 'canvas' it is advisable to call 'board.update()' after all elements have been
         * constructed. This ensures that all elements are drawn with their intended visual appearance.
         *
         * <p>
         * This attribute is immutable.
         *
         * @name JXG.Board#renderer
         * @type String
         * @default 'auto'
         */
        renderer: 'auto',

        /**
         * Control if JSXGraph reacts to resizing of the JSXGraph container element
         * by the user / browser.
         * The attribute "throttle" determines the minimal time in msec between to
         * resize calls.
         * <p>
         * <b>Attention:</b> if the JSXGraph container has no CSS property like width or height and max-width or max-height set, but
         * has a property like box-sizing:content-box, then the interplay between CSS and the resize attribute may result in an
         * infinite loop with ever increasing JSXGraph container.
         *
         * @see JXG.Board#startResizeObserver
         * @see JXG.Board#resizeListener
         *
         * @name JXG.Board#resize
         * @type Object
         * @default <tt>{enabled: true, throttle: 10}</tt>
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
         * Attributes to control the screenshot function.
         * The following attributes can be set:
         * <ul>
         *  <li>scale: scaling factor (default=1.0)
         *  <li>type: format of the screenshot image. Default: png
         *  <li>symbol: Unicode symbol which is shown in the navigation bar. Default: '\u2318'
         *  <li>css: CSS rules to format the div element containing the screen shot image
         *  <li>cssButton: CSS rules to format the close button of the div element containing the screen shot image
         * </ul>
         * The screenshot will fail if the board contains text elements or foreign objects
         * containing SVG again.
         *
         * @name JXG.Board#screenshot
         * @type Object
         */
        screenshot: {
            scale: 1,
            type: 'png',
            symbol: '\u2318', //'\u22b9', //'\u26f6',
            css: 'background-color:#eeeeee; opacity:1.0; border:2px solid black; border-radius:10px; text-align:center',
            cssButton: 'padding: 4px 10px; border: solid #356AA0 1px; border-radius: 5px; position: absolute; right: 2ex; top: 2ex; background-color: rgba(255, 255, 255, 0.3);'
        },

        /**
         * Control the possibilities for a selection rectangle.
         * Starting a selection event triggers the "startselecting" event.
         * When the mouse pointer is released, the "stopselecting" event is fired.
         * The "stopselecting" event is supplied by the user.
         * <p>
         * So far it works in SVG renderer only.
         * <p>
         * Possible sub-attributes with default values are:
         * <pre>
         * selection: {
         *   enabled: false,
         *   name: 'selectionPolygon',
         *   needShift: false,  // mouse selection needs pressing of the shift key
         *   needCtrl: true,    // mouse selection needs pressing of the shift key
         *   fillColor: '#ffff00'
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
            fillColor: '#ffff00',

            // immutable:
            visible: false,
            withLines: false,
            vertices: {
                visible: false
            }
        },

        /**
         * Show a button which allows to clear all traces of a board.
         * This button can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_cleartraces"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_cleartraces"</tt>.
         *
         * @name JXG.Board#showClearTraces
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showClearTraces: false,

        /**
         * Show copyright string and logo in the top left corner of the board.
         *
         * @name JXG.Board#showCopyright
         * @see JXG.Board#showLogo
         * @type Boolean
         * @default true
         */
        showCopyright: true,

        /**
         * Show a button in the navigation bar to start fullscreen mode.
         * This button can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_fullscreen"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_fullscreen"</tt>.
         *
         * @name JXG.Board#showFullscreen
         * @type Boolean
         * @see JXG.Board#fullscreen
         * @default false
         * @see JXG.AbstractRenderer#drawNavigationBar
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showFullscreen: false,

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
         * Show JSXGraph logo in the top left corner of the board anyhow
         * even if {@link JXG.Board#showCopyright} is false.
         *
         * @name JXG.Board#showLogo
         * @type Boolean
         * @default false
         * @see JXG.Board#showCopyright
         */
        showLogo: false,

        /**
         * Display of navigation arrows and zoom buttons in the navigation bar.
         * <p>
         * The navigation bar has the
         * the ID <tt>"{board_id}_navigation"</tt> and the CSS class
         * <tt>JXG_navigation"</tt>.
         * The individual buttons can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_{type}"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_{type}"</tt>, where <tt>{type}</tt>
         * is one of <tt>left</tt>, <tt>right</tt>, or <tt>up</tt>, <tt>down</tt>,
         * <tt>in</tt>, <tt>100</tt>, or <tt>out</tt>,
         * <tt>fullscreen</tt>, <tt>screenshot</tt>, <tt>cleartraces</tt>, <tt>reload</tt>.
         *
         * @name JXG.Board#showNavigation
         * @type Boolean
         * @default true
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showNavigation: true,

        /**
         * Show a button in the navigation bar to force reload of a construction.
         * Works only with the JessieCode tag.
         * This button can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_reload"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_reload"</tt>.
         *
         * @name JXG.Board#showReload
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showReload: false,

        /**
         * Show a button in the navigation bar to enable screenshots.
         * This button can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_screenshot"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_screenshot"</tt>.
         *
         * @name JXG.Board#showScreenshot
         * @type Boolean
         * @default false
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showScreenshot: false,

        /**
         * Display of zoom buttons in the navigation bar. To show zoom buttons, additionally
         * showNavigation has to be set to true.
         * <p>
         * The individual buttons can be accessed by JavaScript or CSS with
         * the ID <tt>"{board_id}_navigation_button_{type}"</tt> or by the CSS classes
         * <tt>JXG_navigation_button"</tt> or
         * <tt>JXG_navigation_button_{type}"</tt>, where <tt>{type}</tt>
         * is <tt>in</tt>, <tt>100</tt>, or <tt>out</tt>.
         *
         * @name JXG.Board#showZoom
         * @type Boolean
         * @default true
         * @see JXG.AbstractRenderer#drawNavigationBar
         */
        showZoom: true,

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
         * Set a visual theme for a board. At the moment this attribute is immutable.
         * Available themes are
         * <ul>
         * <li> 'default'
         * <li> 'mono_thin': a black / white theme using thin strokes. Restricted to 2D.
         * </ul>
         *
         * @name JXG.Board#theme
         * @type String
         * @default 'default'
         * @example
         *  const board = JXG.JSXGraph.initBoard('jxgbox', {
         *      boundingbox: [-5, 5, 5, -5], axis: true,
         *      theme: 'mono_thin'
         *  });
         *
         *  var a = board.create('slider', [[1, 4], [3, 4], [-10, 1, 10]]);
         *  var p1 = board.create('point', [1, 2]);
         *  var ci1 = board.create('circle', [p1, 0.7]);
         *  var cu = board.create('functiongraph', ['x^2']);
         *  var l1 = board.create('line', [2, 3, -1]);
         *  var l2 = board.create('line', [-5, -3, -1], { dash: 2 });
         *  var i1 = board.create('intersection', [l1, l2]);
         *  var pol = board.create('polygon', [[1, 0], [4, 0], [3.5, 1]]);
         *  var an = board.create('angle', [pol.vertices[1], pol.vertices[0], pol.vertices[2]]);
         *  var se = board.create('sector', [pol.vertices[1], pol.vertices[2], pol.vertices[0]]);
         *  var ci1 = board.create('circle', [[-3, -3], 0.7], { center: { visible: true } });
         *
         * </pre><div id="JXG1c5f7a2a-176b-4410-ac06-8593f1a09879" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG1c5f7a2a-176b-4410-ac06-8593f1a09879',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false,
         *              theme: 'mono_thin' });
         *
         *    var a = board.create('slider', [[1, 4], [3, 4], [-10, 1, 10]]);
         *    var p1 = board.create('point', [1, 2]);
         *    var ci1 = board.create('circle', [p1, 0.7]);
         *    var cu = board.create('functiongraph', ['x^2']);
         *    var l1 = board.create('line', [2, 3, -1]);
         *    var l2 = board.create('line', [-5, -3, -1], { dash: 2 });
         *    var i1 = board.create('intersection', [l1, l2]);
         *    var pol = board.create('polygon', [[1, 0], [4, 0], [3.5, 1]]);
         *    var an = board.create('angle', [pol.vertices[1], pol.vertices[0], pol.vertices[2]]);
         *    var se = board.create('sector', [pol.vertices[1], pol.vertices[2], pol.vertices[0]]);
         *    var ci1 = board.create('circle', [[-3, -3], 0.7], { center: { visible: true } });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        theme: 'default',

        /**
         * Title string for the board.
         * Primarily used in an invisible text element for assistive technologies.
         * The title is implemented with the attribute 'aria-label' in the JSXGraph container.
         *
         * Content should be accessible to all users, not just to those with
         * screen readers.  Consider instead adding a text element with the title and add the attribute
         * <b>aria:{enable:true,label:"Your Title"}</b>
         *
         * @name JXG.Board#title
         * @type String
         * @default ''
         *
         */
        title: '',

        /**
         * Control the possibilities for zoom interaction.
         *
         * Possible sub-attributes with default values are:
         * <pre>
         * zoom: {
         *   enabled: true,  // turns off zooming completely, if set to false.
         *   factorX: 1.25,  // horizontal zoom factor (multiplied to {@link JXG.Board#zoomX})
         *   factorY: 1.25,  // vertical zoom factor (multiplied to {@link JXG.Board#zoomY})
         *   wheel: true,    // allow zooming by mouse wheel
         *   needShift: true,  // mouse wheel zooming needs pressing of the shift key
         *   min: 0.001,       // minimal values of {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}, limits zoomOut
         *   max: 1000.0,      // maximal values of {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}, limits zoomIn
         *   center: 'auto',   // 'auto': the center of zoom is at the position of the mouse or at the midpoint of two fingers
         *                     // 'board': the center of zoom is at the board's center
         *   pinch: true,      // pinch-to-zoom gesture for proportional zoom
         *   pinchHorizontal: true, // Horizontal pinch-to-zoom zooms horizontal axis. Only available if keepaspectratio:false
         *   pinchVertical: true,   // Vertical pinch-to-zoom zooms vertical axis only. Only available if keepaspectratio:false
         *   pinchSensitivity: 7    // Sensitivity (in degrees) for recognizing horizontal or vertical pinch-to-zoom gestures.
         * }
         * </pre>
         *
         * If the zoom buttons are visible, zooming by clicking the buttons is still possible, regardless of zoom.enabled:true/false.
         * If this should be prevented, set showZoom:false.
         *
         * Deprecated: zoom.eps which is superseded by zoom.min
         *
         * @name JXG.Board#zoom
         * @type Object
         * @default See above
         * @see JXG.Board#showZoom
         *
         */
        zoom: {
            enabled: true,
            factorX: 1.25,
            factorY: 1.25,
            wheel: true,
            needShift: true,
            center: 'auto',
            min: 0.0001,
            max: 10000.0,
            pinch: true,
            pinchHorizontal: true,
            pinchVertical: true,
            pinchSensitivity: 7
        },

        // /**
        //  * Additional zoom factor multiplied to {@link JXG.Board#zoomX} and {@link JXG.Board#zoomY}.
        //  *
        //  * @name JXG.Board#zoomFactor
        //  * @type Number
        //  * @default 1.0
        //  */
        // zoomFactor: 1,

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
        zoomY: 1

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
        /**#@+
         * @visprop
         */
        // This is a meta tag: http://code.google.com/p/jsdoc-toolkit/wiki/MetaTags

        /**
         * ARIA settings for JSXGraph elements.
         * Besides 'label' and 'live', all available properties from
         * <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA">https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA</a> may be set.
         * In JSXGraph, the available properties are used without the leading 'aria-'.
         * For example, the value of the JSXGraph attribute 'aria.label' will be set to the
         * HTML attribute 'aria-label' (ignoring 'aria.enabled').
         *
         * @name aria
         * @memberOf JXG.GeometryElement.prototype
         * @type Object
         * @default <pre>{
         *   enabled: false,
         *   label: '',
         *   live: 'assertive'
         *  }</pre>
         */
        aria: {
            enabled: false,
            label: '',
            live: 'assertive' // 'assertive', 'polite', 'none'
        },

        /**
         * Apply CSS classes to an element in non-highlighted view. It is possible to supply one or more
         * CSS classes separated by blanks.
         * <p>
         * For non-text and non-image elements, this feature is available for the SVG renderer, only.
         * <p>
         * For text and image elements the specificity (priority) of JSXGraph attributes is higher than the CSS class properties, see
         * {@link Text#cssDefaultStyle}
         * For other elements, however, the specificity of a CSS class is higher than the corresponding JSXGraph attribute, see the example below.
         * The fill-properties of a CSS class will be set only if the corresponding JSXGraph attributes are set (to a dummy value).
         *
         * @example
         * // CSS class
         * .line {
         *     stroke: blue;
         *     stroke-width: 10px;
         *     fill: yellow;
         * }
         *
         * // JavaScript
         * var line = board.create('line', [[0, 0], [3, 3]], {
         *   cssClass: 'line',
         *   strokeColor: 'black',
         *   strokeWidth: 2,
         *   fillColor: '' // Necessary to enable the yellow fill color of the CSS class
         * });
         *
         * // The line is blue and has stroke-width 10px;
         *
         *
         * @name cssClass
         * @memberOf JXG.GeometryElement.prototype
         * @type String
         * @default ''
         * @see Text#cssClass
         * @see JXG.GeometryElement#highlightCssClass
         */
        cssClass: '',

        /**
         * Apply CSS classes to an element in highlighted view. It is possible to supply one or more
         * CSS classes separated by blanks.
         * <p>
         * For non-text and non-image elements, this feature is available for the SVG renderer, only.
         *
         * @name highlightCssClass
         * @memberOf JXG.GeometryElement.prototype
         * @type String
         * @default ''
         * @see Text#highlightCssClass
         * @see JXG.GeometryElement#cssClass
         */
        highlightCssClass: '',

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
         * If true, the dash pattern is multiplied by strokeWidth / 2.
         * @name JXG.GeometryElement#dashScale
         * @type Boolean
         * @default false
         *
         * @see JXG.GeometryElement#dash
         * @see JXG.AbstractRenderer#dashArray
         */
        dashScale: false,

        /**
         * If draft.draft: true the element will be drawn in grey scale colors (as default)
         * to visualize that it's only a draft.
         *
         * @name JXG.GeometryElement#draft
         * @type Object
         * @default <tt>{@link JXG.Options.elements.draft#draft}</tt>
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
         * Links to the defining 3D element of a 2D element. Otherwise it is null.
         *
         * @name JXG.GeometryElement#element3D
         * @default null
         * @private
         */
        element3D: null,

        /**
         * The fill color of this geometry element.
         * @type String
         * @name JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default JXG.palette.red
         */
        fillColor: Color.palette.red,

        /**
         * Opacity for fill color.
         * @type Number
         * @name JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default 1
         */
        fillOpacity: 1,

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
         * Only free elements like points, texts, images, curves can be frozen.
         *
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#frozen
         *
         * @example
         * var txt = board.create('text', [1, 2, 'Hello'], {frozen: true, fontSize: 24});
         * var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {
         *     name:'a',
         *     frozen: true
         * });
         *
         * </pre><div id="JXG02f88c9d-8c0a-4174-9219-f0ea43749159" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG02f88c9d-8c0a-4174-9219-f0ea43749159',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var txt = board.create('text', [1, 2, 'Hello'], {frozen: true, fontSize: 24});
         *     var sli = board.create('slider', [[-4, 4], [-1.5, 4], [-10, 1, 10]], {
         *         name:'a',
         *         frozen: true
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        frozen: false,

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
         * @type Boolean
         * @default true
         * @name JXG.GeometryElement#highlight
         */
        highlight: true,

        /**
         * The fill color of the given geometry element when the mouse is pointed over it.
         * @type String
         * @name JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#fillOpacity
         * @see JXG.GeometryElement#highlightFillOpacity
         * @default 'none'
         */
        highlightFillColor: 'none',

        /**
         * Opacity for fill color when the object is highlighted.
         * @type Number
         * @name JXG.GeometryElement#highlightFillOpacity
         * @see JXG.GeometryElement#fillColor
         * @see JXG.GeometryElement#highlightFillColor
         * @see JXG.GeometryElement#fillOpacity
         * @default 1
         */
        highlightFillOpacity: 1,

        /**
         * The stroke color of the given geometry element when the user moves the mouse over it.
         * @type String
         * @name JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#strokeWidth
         * @see JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @default '#c3d9ff'
         */
        highlightStrokeColor: '#c3d9ff',

        /**
         * Opacity for stroke color when the object is highlighted.
         * @type Number
         * @name JXG.GeometryElement#highlightStrokeOpacity
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeWidth
         * @see JXG.GeometryElement#strokeOpacity
         * @default 1
         */
        highlightStrokeOpacity: 1,

        /**
         * Width of the element's stroke when the mouse is pointed over it.
         * @type Number
         * @name JXG.GeometryElement#highlightStrokeWidth
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @see JXG.GeometryElement#highlightFillColor
         * @default 2
         */
        highlightStrokeWidth: 2,

        /**
         * @name JXG.GeometryElement#isLabel
         * @default false
         * @private
        */
        // By default, an element is not a label. Do not change this.
        isLabel: false,

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
         * If this is set to true, the element is updated in every update
         * call of the board. If set to false, the element is updated only after
         * zoom events or more generally, when the bounding box has been changed.
         * Examples for the latter behavior should be axes.
         * @type Boolean
         * @default true
         * @see JXG.GeometryElement#needsRegularUpdate
         * @name JXG.GeometryElement#needsRegularUpdate
         */
        needsRegularUpdate: true,

        /**
         * If some size of an element is controlled by a function, like the circle radius
         * or segments of fixed length, this attribute controls what happens if the value
         * is negative. By default, the absolute value is taken. If true, the maximum
         * of 0 and the value is used.
         *
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#nonnegativeOnly
         * @example
         * var slider = board.create('slider', [[4, -3], [4, 3], [-4, 1, 4]], { name: 'a'});
         * var circle = board.create('circle', [[-1, 0], 1], {
         *     nonnegativeOnly: true
         * });
         * circle.setRadius('a');         // Use JessieCode
         * var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
         *     point1: {visible: true},
         *     point2: {visible: true},
         *     nonnegativeOnly: true
         * });
         *
         * </pre><div id="JXG9cb76224-1f78-4488-b20f-800788768bc9" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9cb76224-1f78-4488-b20f-800788768bc9',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var slider = board.create('slider', [[4, -3], [4, 3], [-4, 1, 4]], { name: 'a'});
         *     var circle = board.create('circle', [[-1, 0], 1], {
         *         nonnegativeOnly: true
         *     });
         *     circle.setRadius('a');         // Use JessieCode
         *     var seg = board.create('segment', [[-4, 3], [0, 3], () => slider.Value()], {
         *         point1: {visible: true},
         *         point2: {visible: true},
         *         nonnegativeOnly: true
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        nonnegativeOnly: false,

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
         * A private element will be inaccessible in certain environments, e.g. a graphical user interface.
         *
         * @name JXG.GeometryElement#priv
         * @type Boolean
         * @default false
         */
        priv: false,

        /**
         * Determines whether two-finger manipulation may rotate this object.
         * If set to false, the object can only be scaled and translated.
         * <p>
         * In case the element is a polygon or line and it has the attribute "rotatable:false",
         * moving the element with two fingers results in a rotation or translation.
         * <p>
         * If an element is set to be neither scalable nor rotatable, it can only be translated.
         * <p>
         * In case of a polygon, scaling is only possible if <i>no</i> vertex has snapToGrid or snapToPoints
         * enabled and no vertex is fixed by some other constraint. Also, the polygon itself has to have
         * snapToGrid disabled.
         *
         * @type Boolean
         * @default true
         * @name JXG.GeometryElement#rotatable
         * @see JXG.GeometryElement#scalable
         */
        rotatable: true,

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
         * <p>
         * In case of a polygon, scaling is only possible if <i>no</i> vertex has snapToGrid or snapToPoints
         * enabled and no vertex is fixed by some other constraint. Also, the polygon itself has to have
         * snapToGrid disabled.
         *
         * @type Boolean
         * @default true
         * @name JXG.GeometryElement#scalable
         * @see JXG.Ticks#fixed
         * @see JXG.GeometryElement#rotatable
         */
        scalable: true,

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
         * Snaps the element or its parents to the grid. Currently only relevant for points, circles,
         * and lines. Points are snapped to grid directly, on circles and lines it's only the parent
         * points that are snapped
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#snapToGrid
         */
        snapToGrid: false,

        /**
         * The stroke color of the given geometry element.
         * @type String
         * @name JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeWidth
         * @see JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @default JXG.palette.blue
         */
        strokeColor: Color.palette.blue,

        /**
         * Opacity for element's stroke color.
         * @type Number
         * @name JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeWidth
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @default 1
         */
        strokeOpacity: 1,

        /**
         * Width of the element's stroke.
         * @type Number
         * @name JXG.GeometryElement#strokeWidth
         * @see JXG.GeometryElement#strokeColor
         * @see JXG.GeometryElement#highlightStrokeColor
         * @see JXG.GeometryElement#strokeOpacity
         * @see JXG.GeometryElement#highlightStrokeOpacity
         * @default 2
         */
        strokeWidth: 2,

        /**
         * Controls if an element can get the focus with the tab key.
         * tabindex corresponds to the HTML attribute of the same name.
         * See <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex">description at MDN</a>.
         * The additional value "null" completely disables focus of an element.
         * The value will be ignored if keyboard control of the board is not enabled or
         * if the element is not visible.
         *
         * @name JXG.GeometryElement#tabindex
         * @type Number
         * @default -1
         * @see JXG.Board#keyboard
         * @see JXG.GeometryElement#fixed
         * @see JXG.GeometryElement#visible
         */
        tabindex: -1,

        /**
         * If true the element will be traced, i.e. on every movement the element will be copied
         * to the background. Use {@link JXG.GeometryElement#clearTrace} to delete the trace elements.
         *
         * The calling of element.setAttribute({trace:false}) additionally
         * deletes all traces of this element. By calling
         * element.setAttribute({trace:'pause'})
         * the removal of already existing traces can be prevented.
         *
         * The visual appearance of the trace can be influenced by {@link JXG.GeometryElement#traceAttributes}.
         *
         * @see JXG.GeometryElement#clearTrace
         * @see JXG.GeometryElement#traces
         * @see JXG.GeometryElement#numTraces
         * @see JXG.GeometryElement#traceAttributes
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
         * @default <tt>{}</tt>
         *
         * @example
         * JXG.Options.elements.traceAttributes = {
         *     size: 2
         * };
         *
         * const board = JXG.JSXGraph.initBoard(BOARDID, {
         *     boundingbox: [-4, 4, 4, -4],
         *     keepaspectratio: true
         * });
         *
         * var p = board.create('point', [0.0, 2.0], {
         *     trace: true,
         *     size: 10,
         *     traceAttributes: {
         *         color: 'black',
         *         face: 'x'
         *     }
         * });
         *
         * </pre><div id="JXG504889cb-bb6f-4b65-85db-3ad555c08bcf" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     JXG.Options.elements.traceAttributes = {
         *         size: 2
         *     };
         *         var board = JXG.JSXGraph.initBoard('JXG504889cb-bb6f-4b65-85db-3ad555c08bcf',
         *             {boundingbox: [-4, 4, 4, -4], axis: true, showcopyright: false, shownavigation: true, showClearTraces: true});
         *
         *     var p = board.create('point', [0.0, 2.0], {
         *         trace: true,
         *         size: 10,
         *         traceAttributes: {
         *             color: 'black',
         *             face: 'x'
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        traceAttributes: {},

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
         * If false the element won't be visible on the board, otherwise it is shown.
         * @type Boolean
         * @name JXG.GeometryElement#visible
         * @see JXG.GeometryElement#hideElement
         * @see JXG.GeometryElement#showElement
         * @default true
         */
        visible: true,

        /**
         * If true a label will display the element's name.
         * Using this to suppress labels is more efficient than visible:false.
         *
         * @name JXG.GeometryElement#withLabel
         * @type Boolean
         * @default false
         */
        withLabel: false,

        /**
         * Decides if the element should be ignored when using auto positioning
         * for some label.
         * @name JXG.GeometryElement#ignoreForLabelAutoposition
         * @type boolean
         * @default false
         * @see Label#autoPosition
         */
        ignoreForLabelAutoposition: false

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
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', { boundingBox: [-10, 10, 10, -10], axis: true,
         *     defaultAxes: {
         *         x: {
         *                 margin: -4,
         *                 ticks: {
         *                     minTicksDistance: 0,
         *                     minorTicks:4,
         *                     ticksDistance: 3,
         *                     scale: Math.PI,
         *                     scaleSymbol: 'π',
         *                     insertTicks: true
         *                 }
         *              },
         *         y: {}
         *     }
         * });
         *
         * // Generate a logarithmic labelling of the vertical axis by defining the function generateLabelText directly.
         * board.defaultAxes.y.ticks[0].generateLabelText = function (tick, zero) {
         *     var value = Math.pow(10, Math.round(tick.usrCoords[2] - zero.usrCoords[2]));
         *     return this.formatLabelText(value);
         * };
         *
         * </pre><div id="JXG3d2203ee-a797-416a-a33c-409581fafdd7" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG3d2203ee-a797-416a-a33c-409581fafdd7',
         *             {boundingbox: [-10, 10, 10, -10], axis: true, showcopyright: false, shownavigation: false,
         *         defaultAxes: {
         *             x: {
         *                     margin: -4,
         *                     ticks: {
         *                         minTicksDistance: 0,
         *                         minorTicks:4,
         *                         ticksDistance: 3,
         *                         scale: Math.PI,
         *                         scaleSymbol: 'π',
         *                         insertTicks: true
         *                     }
         *                  },
         *             y: {}
         *         }
         *     });
         *
         *     // Generate a logarithmic labelling of the vertical axis.
         *     board.defaultAxes.y.ticks[0].generateLabelText = function (tick, zero) {
         *         var value = Math.pow(10, Math.round(tick.usrCoords[2] - zero.usrCoords[2]));
         *         return this.formatLabelText(value);
         *     };
         *
         *     })();
         *
         * </script><pre>
         * @example
         * // Generate a logarithmic labelling of the vertical axis by setting the attribute generateLabelText.
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *   boundingBox: [-10, 10, 10, -10], axis: true,
         *   defaultAxes: {
         *     x: {
         *       margin: -4,
         *       ticks: {
         *         minTicksDistance: 0,
         *         minorTicks: 4,
         *         ticksDistance: 3,
         *         scale: Math.PI,
         *         scaleSymbol: 'π',
         *         insertTicks: true
         *       }
         *     },
         *     y: {
         *       ticks: {
         *         // Generate a logarithmic labelling of the vertical axis.
         *         generateLabelText: function (tick, zero) {
         *           var value = Math.pow(10, Math.round(tick.usrCoords[2] - zero.usrCoords[2]));
         *           return this.formatLabelText(value);
         *         }
         *       }
         *     }
         *   }
         * });
         *
         * </pre><div id="JXGa2873c8f-df8d-4a1d-ae15-5f1bdc55a0e9" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGa2873c8f-df8d-4a1d-ae15-5f1bdc55a0e9',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *
         *         const board = JXG.JSXGraph.initBoard('jxgbox', {
         *           boundingBox: [-10, 10, 10, -10], axis: true,
         *           defaultAxes: {
         *             x: {
         *               margin: -4,
         *               ticks: {
         *                 minTicksDistance: 0,
         *                 minorTicks: 4,
         *                 ticksDistance: 3,
         *                 scale: Math.PI,
         *                 scaleSymbol: 'π',
         *                 insertTicks: true
         *               }
         *             },
         *             y: {
         *               ticks: {
         *                 // Generate a logarithmic labelling of the vertical axis.
         *                 generateLabelText: function (tick, zero) {
         *                   var value = Math.pow(10, Math.round(tick.usrCoords[2] - zero.usrCoords[2]));
         *                   return this.formatLabelText(value);
         *                 }
         *               }
         *             }
         *           }
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         *
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
         * Attributes for the ticks labels.
         *
         * @name Ticks#label
         * @type Object
         * @default <pre>{
         *   tabindex: null,
         *   layer: 7, // line
         *   highlight: false
         *   }</pre>
         *
         */
        label: {
            tabindex: null,
            layer: 7, // line
            highlight: false,
            autoPosition: false
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
         *
         * @example
         * var li = board.create('segment', [[-4, -3], [4, 2]]);
         * var t = board.create('ticks', [li], {
         *     // drawZero: true,
         *     anchor: 'left',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         *
         * </pre><div id="JXG3dd23f77-a31d-4649-b0f0-7472722158d8" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG3dd23f77-a31d-4649-b0f0-7472722158d8',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var li = board.create('segment', [[-4, -3], [4, 2]]);
         *     var t = board.create('ticks', [li], {
         *         // drawZero: true,
         *         anchor: 'left',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var li = board.create('segment', [[-4, -3], [4, 2]]);
         * var t = board.create('ticks', [li], {
         *     drawZero: true,
         *     anchor: 'middle',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         * </pre><div id="JXG430914fd-4e12-44de-b510-e3cc2fd473e0" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG430914fd-4e12-44de-b510-e3cc2fd473e0',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var li = board.create('segment', [[-4, -3], [4, 2]]);
         *     var t = board.create('ticks', [li], {
         *         drawZero: true,
         *         anchor: 'middle',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        anchor: 'left',

        /**
         * Draw the zero tick, that lies at line.point1?
         *
         * @type Boolean
         * @name Ticks#drawZero
         * @default false
         *
         * @example
         * var li = board.create('segment', [[-4, 2], [4, 2]]);
         * var t = board.create('ticks', [li], {
         *     drawZero: false,
         *     anchor: 'middle',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         * var li2 = board.create('segment', [[-4, -2], [4, -2]]);
         * var t2 = board.create('ticks', [li2], {
         *     drawZero: true,
         *     anchor: 'middle',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         * </pre><div id="JXG91584dc4-0ca8-4b3e-841c-c877f2ccdcf1" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG91584dc4-0ca8-4b3e-841c-c877f2ccdcf1',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *     var li = board.create('segment', [[-4, 2], [4, 2]]);
         *     var t = board.create('ticks', [li], {
         *         drawZero: false,
         *         anchor: 'middle',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *     var li2 = board.create('segment', [[-4, -2], [4, -2]]);
         *     var t2 = board.create('ticks', [li2], {
         *         drawZero: true,
         *         anchor: 'middle',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        drawZero: false,

        /**
         * Let JSXGraph determine the distance between ticks automatically.
         * If <tt>true</tt>, the attribute <tt>ticksDistance</tt> is ignored.
         * The distance between ticks is affected by the size of the board and
         * the attribute <tt>minTicksDistance</tt> (in pixel).
         *
         * @type Boolean
         * @name Ticks#insertTicks
         * @see Ticks#ticksDistance
         * @see Ticks#minTicksDistance
         * @default false
         * @example
         * // Create an axis providing two coord pairs.
         *   var p1 = board.create('point', [0, 0]);
         *   var p2 = board.create('point', [50, 25]);
         *   var l1 = board.create('line', [p1, p2]);
         *   var t = board.create('ticks', [l1], {
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
         *   var board = JXG.JSXGraph.initBoard('JXG2f6fb842-40bd-4223-aa28-3e9369d2097f', {
         *     boundingbox: [-100, 70, 70, -100], axis: true, showcopyright: false, shownavigation: true});
         *   var p1 = board.create('point', [0, 0]);
         *   var p2 = board.create('point', [50, 25]);
         *   var l1 = board.create('line', [p1, p2]);
         *   var t = board.create('ticks', [l1], {insertTicks: true, majorHeight: -1, label: {offset: [4, -9]}, drawLabels: true});
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
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', { boundingBox: [-10, 10, 10, -10], axis: true,
         *     defaultAxes: {
         *         x : {
         *                 margin: -4,
         *                 ticks: {
         *                     minTicksDistance: 0,
         *                     minorTicks:4,
         *                     ticksDistance: 3,
         *                     scale: Math.PI,
         *                     scaleSymbol: 'π',
         *                     insertTicks: true
         *                 }
         *              },
         *         y : {}
         *     }
         * });
         *
         * </pre><div id="JXG23bfda5d-4a85-4469-a552-aa9b4cf62b4a" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG23bfda5d-4a85-4469-a552-aa9b4cf62b4a',
         *             {boundingbox: [-10, 10, 10, -10], axis: true, showcopyright: false, shownavigation: false,
         *         defaultAxes: {
         *             x : {
         *                     margin: -4,
         *                     ticks: {
         *                         minTicksDistance: 0,
         *                         minorTicks:4,
         *                         ticksDistance: 3,
         *                         scale: Math.PI,
         *                         scaleSymbol: 'π',
         *                         insertTicks: true
         *                     }
         *                  },
         *             y : {
         *                  }
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
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
         * Deprecated! Replaced by the attribute <tt>digits</tt>.
         *
         * @type Number
         * @name Ticks#precision
         * @see Ticks#maxLabelLength
         * @see Ticks#digits
         * @deprecated
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
         * The default distance (in user coordinates, not  pixels) between two ticks. Please be aware that this value is overruled
         * if {@link Ticks#insertTicks} is set to true. In case, {@link Ticks#insertTicks} is false, the maximum number of ticks
         * is hard coded to be less than 2048.
         *
         * @type Number
         * @name Ticks#ticksDistance
         * @see Ticks#insertTicks
         * @default 1
         */
        ticksDistance: 1,

        /**
         * Tick face for major ticks of finite length.  By default (face: '|') this is a straight line.
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
         *   var t = board.create('ticks', [l1], {ticksDistance: 2, face: '>', minorTicks: 0});
         *
         * </pre><div id="JXG950a568a-1264-4e3a-b61d-b6881feecf4b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG950a568a-1264-4e3a-b61d-b6881feecf4b',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *       var p1 = board.create('point', [0, 3]);
         *       var p2 = board.create('point', [1, 3]);
         *       var l1 = board.create('line', [p1, p2]);
         *       var t = board.create('ticks', [l1], {ticksDistance: 2, face: '>', minorTicks: 0});
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
         * Whether line boundaries should be included or not in the lower and upper bounds when
         * creating ticks. In mathematical terms: if a segment considered as interval is open (includeBoundaries:false)
         * or closed (includeBoundaries:true). In case of open interval, the interval is shortened by a small
         * &epsilon;.
         *
         * @type Boolean
         * @name Ticks#includeBoundaries
         * @default false
         *
         * @example
         * var li = board.create('segment', [[-4, 2], [4, 2]]);
         * var t = board.create('ticks', [li], {
         *     includeBoundaries: true,
         *     drawZero: true,
         *     anchor: 'middle',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         * var li2 = board.create('segment', [[-4, -2], [4, -2]]);
         * var t2 = board.create('ticks', [li2], {
         *     includeBoundaries: false,
         *     drawZero: true,
         *     anchor: 'middle',
         *     drawLabels: true,
         *     minorTicks: 0,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'top',
         *         offset: [0, -5]
         *     }
         * });
         *
         * </pre><div id="JXG08e79180-7c9a-4638-bb72-8aa7fd8a8b96" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG08e79180-7c9a-4638-bb72-8aa7fd8a8b96',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *     var li = board.create('segment', [[-4, 2], [4, 2]]);
         *     var t = board.create('ticks', [li], {
         *         includeBoundaries: true,
         *         drawZero: true,
         *         anchor: 'middle',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *     var li2 = board.create('segment', [[-4, -2], [4, -2]]);
         *     var t2 = board.create('ticks', [li2], {
         *         includeBoundaries: false,
         *         drawZero: true,
         *         anchor: 'middle',
         *         drawLabels: true,
         *         minorTicks: 0,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'top',
         *             offset: [0, -5]
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        includeBoundaries: false,

        /**
         * Set the ticks type.
         * Possible values are 'linear' or 'polar'.
         *
         * @type String
         * @name Ticks#type
         * @default 'linear'
         *
         * @example
         * var ax = board.create('axis', [[0,0], [1,0]], {
         *              needsRegularUpdate: false,
         *              ticks: {
         *                      type: 'linear',
         *                      majorHeight: 0
         *                  }
         *              });
         * var ay = board.create('axis', [[0,0], [0,1]], {
         *              ticks: {
         *                      type: 'polar'
         *                  }
         *              });
         *
         * var p = board.create('point', [3, 2]);
         *
         * </pre><div id="JXG9ab0b50c-b486-4f95-9698-c0dd276155ff" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9ab0b50c-b486-4f95-9698-c0dd276155ff',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *     var ax = board.create('axis', [[0,0], [1,0]], { needsRegularUpdate: false, ticks: { type: 'linear', majorHeight: 0}});
         *     var ay = board.create('axis', [[0,0], [0,1]], { ticks: { type: 'polar'}});
         *
         *     var p = board.create('point', [3, 2]);
         *
         *     })();
         *
         * </script><pre>
         *
         */
        type: 'linear',

        /**
         * Internationalization support for ticks labels.
         * @name intl
         * @memberOf Ticks.prototype
         * @default <pre>{
         *    enabled: 'inherit',
         *    options: {}
         * }</pre>
         * @see JXG.Board#intl
         * @see Text#intl
         *
                  * @example
         * // Here, locale is disabled in general, but enabled for the horizontal
         * // axis and the infobox.
         * const board = JXG.JSXGraph.initBoard(BOARDID, {
         *     boundingbox: [-0.5, 0.5, 0.5, -0.5],
         *     intl: {
         *         enabled: false,
         *         locale: 'de-DE'
         *     },
         *     keepaspectratio: true,
         *     axis: true,
         *     defaultAxes: {
         *         x: {
         *             ticks: {
         *                 intl: {
         *                         enabled: true,
         *                         options: {
         *                             style: 'unit',
         *                             unit: 'kilometer-per-hour',
         *                             unitDisplay: 'narrow'
         *                         }
         *                 }
         *             }
         *         },
         *         y: {
         *             ticks: {
         *             }
         *         }
         *     },
         *     infobox: {
         *         fontSize: 12,
         *         intl: {
         *             enabled: true,
         *             options: {
         *                 minimumFractionDigits: 4,
         *                 maximumFractionDigits: 5
         *             }
         *         }
         *     }
         * });
         *
         * var p = board.create('point', [0.1, 0.1], {});
         *
         * </pre><div id="JXG820b60ff-b453-4be9-a9d5-06c0342a9dbe" class="jxgbox" style="width: 600px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *     var board = JXG.JSXGraph.initBoard('JXG820b60ff-b453-4be9-a9d5-06c0342a9dbe', {
         *         boundingbox: [-0.5, 0.5, 0.5, -0.5], showcopyright: false, shownavigation: false,
         *         intl: {
         *             enabled: false,
         *             locale: 'de-DE'
         *         },
         *         keepaspectratio: true,
         *         axis: true,
         *         defaultAxes: {
         *             x: {
         *                 ticks: {
         *                     intl: {
         *                             enabled: true,
         *                             options: {
         *                                 style: 'unit',
         *                                 unit: 'kilometer-per-hour',
         *                                 unitDisplay: 'narrow'
         *                             }
         *                     }
         *                 }
         *             },
         *             y: {
         *                 ticks: {
         *                 }
         *             }
         *         },
         *         infobox: {
         *             fontSize: 12,
         *             intl: {
         *                 enabled: true,
         *                 options: {
         *                     minimumFractionDigits: 4,
         *                     maximumFractionDigits: 5
         *                 }
         *             }
         *         }
         *     });
         *
         *     var p = board.create('point', [0.1, 0.1], {});
         *
         *     })();
         *
         * </script><pre>
         *
         */
        intl: {
            enabled: 'inherit',
            options: {}
        },

        // TODO implementation and documentation
        minorTicksInArrow: false,
        majorTicksInArrow: true,
        labelInArrow: true,
        minorTicksInMargin: false,
        majorTicksInMargin: true,
        labelInMargin: true,

        ignoreForLabelAutoposition: true

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
         * @default <tt>{face: 'o', size: 2}</tt>
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
        }

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

        /**
         * If true, there is a fourth parent point, i.e. the parents are [center, p1, p2, p3].
         * p1 is still the radius point, p2 the angle point. The arc will be that part of the
         * the circle with center 'center' which starts at p1, ends at the ray between center
         * and p2, and passes p3.
         * <p>
         * This attribute is immutable (by purpose).
         * This attribute is necessary for circumCircleArcs
         *
         * @type Boolean
         * @name Arc#useDirection
         * @default false
         * @private
         */
        useDirection: false,

        /**
         * Attributes for center point.
         *
         * @type Point
         * @name Arc#center
         * @default {}
         */
        center: {
        },

        /**
         * Attributes for radius point.
         *
         * @type Point
         * @name Arc#radiusPoint
         * @default {}
         */
        radiusPoint: {
        },

        /**
         * Attributes for angle point.
         *
         * @type Point
         * @name Arc#anglePoint
         * @default {}
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

    /* special arrowparallel options */
    arrowparallel: {
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
         * Is used to define the behavior of the axis.
         * Settings in this attribute only have an effect if the axis is exactly horizontal or vertical.
         * Possible values are:
         * <ul>
         *     <li><tt>'static'</tt>: Standard behavior of the axes as know in JSXGraph.
         *     <li><tt>'fixed'</tt>: The axis is placed in a fixed position. Depending on the attribute <tt>anchor</tt>, it is positioned to the right or left of the edge of the board as seen from the axis with a distance defined in <tt>distanceBoarder</tt>. The axis will stay at the given position, when the user navigates through the board.
         *     <li><tt>'sticky'</tt>: This mixes the two settings <tt>static</tt> and <tt>fixed</tt>. When the user navigates in the board, the axis remains in the visible area (taking into account <tt>anchor</tt> and <tt>anchorDist</tt>). If the axis itself is in the visible area, the axis can be moved by navigation.
         * </ul>
         *
         * @type {String}
         * @name Axis#position
         * @default 'static'
         * @see Axis#anchor
         * @see Axis#anchorDist
         *
         * @example // Use navigation to see effect.
         *  var axis1, axis2, circle;
         *
         *  board.create('axis', [[0,0],[1,0]],{
         *      position: 'fixed',
         *      anchor: 'right',
         *      anchorDist: '0.1fr'
         *  });
         *
         *  board.create('axis', [[0,0],[0,1]], {
         *      position: 'fixed',
         *      anchor: 'left',
         *      anchorDist: 1
         *  });
         *
         * </pre><div id="JXG6dff2f81-65ce-46a3-bea0-8ce25cc1cb4a" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *      var board = JXG.JSXGraph.initBoard('JXG6dff2f81-65ce-46a3-bea0-8ce25cc1cb4a',
         *             {boundingbox: [-1, 10, 10,-1], axis: false, showcopyright: false, shownavigation: true});
         *
         *      board.create('axis', [[0,0],[1,0]],{
         *          position: 'fixed',
         *          anchor: 'right',
         *          anchorDist: '0.1fr'
         *      });
         *
         *      board.create('axis', [[0,0],[0,1]], {
         *          position: 'fixed',
         *          anchor: 'left',
         *          anchorDist: 1
         *      });
         *
         *      board.create('circle', [[5,5], 2.5]);
         *     })();
         *
         * </script><pre>
         *
         * @example // Use navigation to see effect.
         *      board.create('axis', [[0,0],[1,0]],{
         *          position: 'sticky',
         *          anchor: 'right',
         *          anchorDist: '0.2fr'
         *      });
         *
         *      board.create('axis', [[0,0],[0,1]], {
         *          position: 'sticky',
         *          anchor: 'right left',
         *          anchorDist: '75px'
         *      });
         *
         * </pre><div id="JXG42a90935-80aa-4a6b-8adf-279deef84485" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *          var board = JXG.JSXGraph.initBoard('JXG42a90935-80aa-4a6b-8adf-279deef84485',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: true});
         *          board.create('axis', [[0,0],[1,0]],{
         *              position: 'sticky',
         *              anchor: 'right',
         *              anchorDist: '0.2fr'
         *          });
         *
         *          board.create('axis', [[0,0],[0,1]], {
         *              position: 'sticky',
         *              anchor: 'right left',
         *              anchorDist: '75px'
         *          });
         *
         *          board.create('functiongraph', [function(x){ return 1/(x-5) + 2;}]);
         *     })();
         *
         * </script><pre>
         *
         */
        position: 'static',

        /**
         * Position is used in cases: <tt>position=='sticky'</tt> or <tt>position=='fixed'</tt>.
         * Possible values are <tt>'right'</tt>, <tt>'left'</tt>, <tt>'right left'</tt>. Left and right indicate the side as seen from the axis.
         * It is used in combination with the attribute position to decide on which side of the board the axis should stick or be fixed.
         *
         * @type {String}
         * @name Axis#anchor
         * @default ''
         * @example
         *  board.create('axis', [[0,0],[0,1]],{
         *      position: 'fixed',
         *      anchor: 'left',
         *      anchorDist: 2,
         *      strokeColor : 'green',
         *      ticks: {
         *          majorHeight: 7,
         *          drawZero: true,
         *      }
         *  });
         *
         *  board.create('axis', [[0,0],[0,1]], {
         *      position: 'fixed',
         *      anchor: 'right',
         *      anchorDist: 2,
         *      strokeColor : 'blue',
         *      ticks: {
         *          majorHeight: 7,
         *          drawZero: true,
         *      }
         *  });
         *
         *  board.create('axis', [[0,0],[0,-1]], {
         *      position: 'fixed',
         *      anchor: 'left',
         *      anchorDist: 4,
         *      strokeColor : 'red',
         *      ticks:{
         *          majorHeight: 7,
         *          drawZero: true,
         *      }
         *  });
         *
         * </pre><div id="JXG11448b49-02b4-48d4-b0e0-8f06a94e909c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *      var board = JXG.JSXGraph.initBoard('JXG11448b49-02b4-48d4-b0e0-8f06a94e909c',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: true});
         *
         *      board.create('axis', [[0,0],[0,1]],{
         *          position: 'fixed',
         *          anchor: 'left',
         *          anchorDist: 4,
         *          strokeColor : 'green',
         *          ticks: {
         *              majorHeight: 7,
         *              drawZero: true,
         *          }
         *      });
         *
         *      board.create('axis', [[0,0],[0,1]], {
         *          position: 'fixed',
         *          anchor: 'right',
         *          anchorDist: 2,
         *          strokeColor : 'blue',
         *          ticks: {
         *              majorHeight: 7,
         *              drawZero: true,
         *          }
         *      });
         *
         *      board.create('axis', [[0,0],[0,-1]], {
         *          position: 'fixed',
         *          anchor: 'left',
         *          anchorDist: 4,
         *          strokeColor : 'red',
         *          ticks:{
         *              majorHeight: 7,
         *              drawZero: true,
         *          }
         *      });
         *
         *     })();
         *
         * </script><pre>
         */
        anchor: '',

        /**
         * Used to define at which distance to the edge of the board the axis should stick or be fixed.
         * This only has an effect if <tt>position=='sticky'</tt> or <tt>position=='fixed'</tt>.
         * There are the following possibilities:
         * <ul>
         *     <li>Numbers or strings which are numbers (e.g. '10') are interpreted as usrCoords.
         *     <li>Strings with the unit 'px' are interpreted as screen pixels.
         *     <li>Strings with the unit '%' or 'fr' are interpreted as a ratio to the width/height of the board. (e.g. 50% = 0.5fr)
         * </ul>
         *
         * @type {Number|String}
         * @name Axis#anchorDist
         * @default '10%'
         */
        anchorDist: '10%',

        /**
         * If set to true, the tick labels of the axis are automatically positioned in the narrower area between the axis and the side of the board.
         * Settings in this attribute only have an effect if the axis is exactly horizontal or vertical.
         * This option overrides <tt>offset</tt>, <tt>anchorX</tt> and <tt>anchorY</tt> of axis tick labels.
         *
         * @type {Boolean}
         * @name Axis#ticksAutoPos
         * @default false
         * @example
         * // Navigate to see an effect.
         * board.create('axis', [[0, 0], [1, 0]], {
         *     position: 'sticky',
         *     anchor: 'left right',
         *     anchorDist: '0.1',
         *     ticksAutoPos: true,
         * });
         *
         * board.create('axis', [[0, 0], [0, 1]], {
         *     position: 'sticky',
         *     anchor: 'left right',
         *     anchorDist: '0.1',
         *     ticksAutoPos: true,
         * });
         *
         * </pre><div id="JXG557c9b5d-e1bd-4d3b-8362-ff7a863255f3" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG557c9b5d-e1bd-4d3b-8362-ff7a863255f3',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *
         *     board.create('axis', [[0, 0], [1, 0]], {
         *         position: 'sticky',
         *         anchor: 'left right',
         *         anchorDist: '0.1',
         *         ticksAutoPos: true,
         *     });
         *
         *     board.create('axis', [[0, 0], [0, 1]], {
         *         position: 'sticky',
         *         anchor: 'left right',
         *         anchorDist: '0.1',
         *         ticksAutoPos: true,
         *     });
         *
         *     })();
         *
         * </script><pre>
         */
        ticksAutoPos: false,

        /**
         * Defines, when <tt>ticksAutoPos</tt> takes effect.
         * There are the following possibilities:
         * <ul>
         *     <li>Numbers or strings which are numbers (e.g. '10') are interpreted as usrCoords.
         *     <li>Strings with the unit 'px' are interpreted as screen pixels.
         *     <li>Strings with the unit '%' or 'fr' are interpreted as a ratio to the width/height of the board. (e.g. 50% = 0.5fr)
         * </ul>
         *
         * @type {Number|String}
         * @name Axis#ticksAutoPosThreshold
         * @default '5%'
         */
        ticksAutoPosThreshold: '5%',

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
        },

        ignoreForLabelAutoposition: true

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
         * @name Circle#point2
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
        useDirection: true,

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
         * Angle - given in radians - under which comb elements are positioned.
         *
         * @type Number
         * @name Comb#angle
         * @default Math.PI / 3 (i.e. &pi; /3  or 60^° degrees)
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
        /**#@+
         * @visprop
         */

        strokeWidth: 1,
        strokeColor: Color.palette.blue,
        fillColor: 'none',
        fixed: true,

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
         * @deprecated
         */
        doAdvancedPlotOld: false,   // v1

        /**
         * Configure arrow head at the start position for curve.
         * Recommended arrow head type is 7.
         *
         * @name Curve#firstArrow
         * @type Boolean | Object
         * @default false
         * @see Line#firstArrow for options
         */
        firstArrow: false,

        /**
         * The data points of the curve are not connected with straight lines but with bezier curves.
         * @name Curve#handDrawing
         * @type Boolean
         * @default false
         */
        handDrawing: false,

        /**
         * Attributes for curve label.
         *
         * @type Label
         * @name Curve#label
         */
        label: {
            position: 'lft'
        },

        /**
         * Configure arrow head at the end position for curve.
         * Recommended arrow head type is 7.
         *
         * @name Curve#lastArrow
         * @see Line#lastArrow for options
         * @type Boolean | Object
         * @default false
         */
        lastArrow: false,

        /**
         * Line endings (linecap) of a curve stroke.
         * Possible values are:
         * <ul>
         * <li> 'butt',
         * <li> 'round',
         * <li> 'square'.
         * </ul>
         *
         * @name JXG.Curve#lineCap
         * @type String
         * @default 'round'
         */
        lineCap: 'round',

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
         * Configure arrow head at the start position for curve.
         * Recommended arrow head type is 7.
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
        recursionDepthLow: 15

        /**#@-*/
    },

    /* special foreignObject options */
    foreignobject: {
        /**#@+
         * @visprop
         */

        fixed: true,
        visible: true,
        needsRegularUpdate: false,

        /**
         * List of attractor elements. If the distance of the foreignobject is less than
         * attractorDistance the foreignobject is made to glider of this element.
         *
         * @name ForeignObject#attractors
         *
         * @type Array
         * @default empty
         */
        attractors: [],

        /**
         * If set to true, this object is only evaluated once and not re-evaluated on update.
         * This is necessary if you want to have a board within a foreignObject of another board.
         *
         * @name ForeignObject#evaluateOnlyOnce
         *
         * @type Boolean
         * @default false
         */
        evaluateOnlyOnce: false

        /**#@-*/
    },

    /* special functiongraph options */
    functiongraph: {
        /**#@+
         * @visprop
         */


        /**#@-*/
    },

    /* special glider options */
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

        needsRegularUpdate: false,
        hasGrid: false,  // Used in standardoptions
        highlight: false,

        /**
         * Deprecated. Use {@link Grid#majorStep} instead.
         *
         * @deprecated
         * @type {Number|String}
         * @name Grid#gridX
         * @default null
         */
        gridX: null,

        /**
         * Deprecated. Use {@link Grid#majorStep} instead.
         *
         * @deprecated
         * @type {Number|String}
         * @name Grid#gridY
         * @default null
         */
        gridY: null,

        /**
         * Distance of major grid elements. There are three possibilities:
         * <ul>
         *     <li>If it is set to 'auto' the distance of the major grid equals the distance of majorTicks of the corresponding axis.
         *     <li>Numbers or strings which are numbers (e.g. '10') are interpreted as distance in usrCoords.
         *     <li>Strings with the unit 'px' are interpreted as distance in screen pixels.
         *     <li>Strings with the unit '%' or 'fr' are interpreted as a ratio to the width/height of the board. (e.g. 50% = 0.5fr)
         * </ul>
         * Instead of one value you can provide two values as an array <tt>[x, y]</tt> here.
         * These are used as distance in x- and y-direction.
         *
         * @type {Number|String|Array}
         * @name Grid#majorStep
         * @default 'auto'
         * @see JXG.Ticks#getDistanceMajorTicks
         */
        majorStep: 'auto',

        /**
         * Number of elements in minor grid between elements of the major grid. There are three possibilities:
         * <ul>
         *     <li>If set to 'auto', the number minor elements is equal to the number of minorTicks of the corresponding axis.
         *     <li>Numbers or strings which are numbers (e.g. '10') are interpreted as quantity.
         * </ul>
         * Instead of one value you can provide two values as an array <tt>[x, y]</tt> here.
         * These are used as number in x- and y-direction.
         *
         * @type {Number|String|Array}
         * @name Grid#minorElements
         * @default 0
         */
        minorElements: 0,

        /**
         * To print a quadratic grid with same distance of major grid elements in x- and y-direction.
         * <tt>'min'</tt> or <tt>true</tt> will set both distances of major grid elements in x- and y-direction to the primarily lesser value,
         * <tt>'max'</tt> to the primarily greater value.
         *
         * @type {Boolean|String}
         * @name Grid#forceSquare
         * @default false
         */
        forceSquare: false,

        /**
         * To decide whether major or minor grid elements on boundaries of the boundingBox shall be shown, half-ones as well.
         *
         * @type {Boolean}
         * @name Grid#includeBoundaries
         * @default false
         */
        includeBoundaries: false,

        /**
         * Size of grid elements. There are the following possibilities:
         * <ul>
         *     <li>Numbers or strings which are numbers (e.g. '10') are interpreted as size in pixels.
         *     <li>Strings with additional '%' (e.g. '95%') are interpreted as the ratio of used space for one element.
         * </ul>
         * Unused for 'line' which will use the value of strokeWidth.
         * Instead of one value you can provide two values as an array <tt>[x, y]</tt> here.
         * These are used as size in x- and y-direction.
         *
         * <p><b><i>This attribute can be set individually for major and minor grid as a sub-entry of {@link Grid#major} or {@link Grid#minor}</i></b>,
         * e.g. <tt>major: {size: ...}</tt>
         * For default values have a look there.</p>
         *
         * @type {Number|String|Array}
         * @name Grid#size
         */
        // This attribute only exists for documentation purposes. It has no effect and is overwritten with actual values in major and minor.
        size: undefined,

        /**
         * Appearance of grid elements.
         * There are different styles which differ in appearance.
         * Possible values are (comparing to {@link Point#face}):
         * <table>
         * <tr><th>Input</th><th>Output</th><th>Fillable by fillColor,...</th></tr>
         * <tr><td>point, .</td><td>.</td><td>no</td></tr>
         * <tr><td>line</td><td>&minus;</td><td>no</td></tr>
         * <tr><td>cross, x</td><td>x</td><td>no</td></tr>
         * <tr><td>circle, o</td><td>o</td><td>yes</td></tr>
         * <tr><td>square, []</td><td>[]</td><td>yes</td></tr>
         * <tr><td>plus, +</td><td>+</td><td>no</td></tr>
         * <tr><td>minus, -</td><td>-</td><td>no</td></tr>
         * <tr><td>divide, |</td><td>|</td><td>no</td></tr>
         * <tr><td>diamond, &lt;&gt;</td><td>&lt;&gt;</td><td>yes</td></tr>
         * <tr><td>diamond2, &lt;&lt;&gt;&gt;</td><td>&lt;&gt; (bigger)</td><td>yes</td></tr>
         * <tr><td>triangleup, ^, a, A</td><td>^</td><td>no</td></tr>
         * <tr><td>triangledown, v</td><td>v</td><td>no</td></tr>
         * <tr><td>triangleleft, &lt;</td><td> &lt;</td><td>no</td></tr>
         * <tr><td>triangleright, &gt;</td><td>&gt;</td><td>no</td></tr>
         * <tr><td>regularPolygon, regpol</td><td>⬡</td><td>yes</td></tr>
         * </table>
         *
         * <p><b><i>This attribute can be set individually for major and minor grid as a sub-entry of {@link Grid#major} or {@link Grid#minor}</i></b>,
         * e.g. <tt>major: {face: ...}</tt>
         * For default values have a look there.</p>
         *
         * @type {String}
         * @name Grid#face
         */
         // This attribute only exists for documentation purposes. It has no effect and is overwritten with actual values in major and minor.
        face: undefined,

        /**
         * This number (pixel value) controls where grid elements end at the canvas edge. If zero, the line
         * ends exactly at the end, if negative there is a margin to the inside, if positive the line
         * ends outside of the canvas (which is invisible).
         *
         * <p><b><i>This attribute can be set individually for major and minor grid as a sub-entry of {@link Grid#major} or {@link Grid#minor}</i></b>,
         * e.g. <tt>major: {margin: ...}</tt>
         * For default values have a look there.</p>
         *
         * @name Grid#margin
         * @type {Number}
         */
        // This attribute only exists for documentation purposes. It has no effect and is overwritten with actual values in major and minor.
        margin: undefined,

        /**
         * This attribute determines whether the grid elements located at <tt>x=0</tt>, <tt>y=0</tt>
         * and (for major grid only) at <tt>(0, 0)</tt> are displayed.
         * The main reason to set this attribute to "false", might be in combination with axes.
         * <ul>
         *     <li>If <tt>false</tt>, then all these elements are hidden.
         *     <li>If <tt>true</tt>, all these elements are shown.
         *     <li>If an object of the following form is given, the three cases can be distinguished individually:<br>
         *     <tt>{x: true|false, y: true|false, origin: true|false}</tt>
         * </ul>
         *
         * <p><b><i>This attribute can be set individually for major and minor grid as a sub-entry of {@link Grid#major} or {@link Grid#minor}</i></b>,
         * e.g. <tt>major: {drawZero: ...}</tt>
         * For default values have a look there.</p>
         *
         * @type {Boolean|Object}
         * @name Grid#drawZero
         */
        // This attribute only exists for documentation purposes. It has no effect and is overwritten with actual values in major and minor.
        drawZero: undefined,

        /**
         * Number of vertices for face 'polygon'.
         *
         * <p><b><i>This attribute can be set individually for major and minor grid as a sub-entry of {@link Grid#major} or {@link Grid#minor}</i></b>,
         * e.g. <tt>major: {polygonVertices: ...}</tt>
         * For default values have a look there.</p>
         *
         * @type {Number}
         * @name Grid#polygonVertices
         */
        // This attribute only exists for documentation purposes. It has no effect and is overwritten with actual values in major and minor.
        polygonVertices: undefined,

        /**
         * This object contains the attributes for major grid elements.
         * You can override the following grid attributes individually here:
         * <ul>
         *     <li>{@link Grid#size}
         *     <li>{@link Grid#face}
         *     <li>{@link Grid#margin}
         *     <li>{@link Grid#drawZero}
         *     <li>{@link Grid#polygonVertices}
         * </ul>
         * Default values are:
         * <pre>{
         *      size: 5,
         *      face: 'line',
         *      margin: 0,
         *      drawZero: true,
         *      polygonVertices: 6
         *  }</pre>
         *
         * @name Grid#major
         * @type {Object}
         */
        major: {

            /**
             * Documented in Grid#size
             * @class
             * @ignore
             */
            size: 5,

            /**
             * Documented in Grid#face
             * @class
             * @ignore
             */
            face: 'line',

            /**
             * Documented in Grid#margin
             * @class
             * @ignore
             */
            margin: 0,

            /**
             * Documented in Grid#drawZero
             * @class
             * @ignore
             */
            drawZero: true,

            /**
             * Documented in Grid#polygonVertices
             * @class
             * @ignore
             */
            polygonVertices: 6
        },

        /**
         * This object contains the attributes for minor grid elements.
         * You can override the following grid attributes individually here:
         * <ul>
         *     <li>{@link Grid#size}
         *     <li>{@link Grid#face}
         *     <li>{@link Grid#margin}
         *     <li>{@link Grid#drawZero}
         *     <li>{@link Grid#polygonVertices}
         * </ul>
         * Default values are:
         * <pre>{
         *      size: 3,
         *      face: 'point',
         *      margin: 0,
         *      drawZero: true,
         *      polygonVertices: 6
         *  }</pre>
         *
         * @name Grid#minor
         * @type {Object}
         */
        minor: {

            /**
             * @class
             * @ignore
             */
            visible: 'inherit',

            /**
             * Documented in Grid#size
             * @class
             * @ignore
             */
            size: 3,

            /**
             * Documented in Grid#face
             * @class
             * @ignore
             */
            face: 'point',

            /**
             * Documented in Grid#margin
             * @class
             * @ignore
             */
            margin: 0,

            /**
             * Documented in Grid#drawZero
             * @class
             * @ignore
             */
            drawZero: true,

            /**
             * Documented in Grid#polygonVertices
             * @class
             * @ignore
             */
            polygonVertices: 6
        },

        /**
         * @class
         * @ignore
         * @deprecated
         */
        snapToGrid: false,

        strokeColor: '#c0c0c0',
        strokeWidth: 1,
        strokeOpacity: 0.5,
        dash: 0,

        /**
         * Use a predefined theme for grid.
         * Attributes can be overwritten by explicitly set the specific value.
         *
         * @type {Number}
         * @default 0
         * @see Grid#themes
         */
        theme: 0,

        /**
         * Array of theme attributes.
         * The index of the entry is the number of the theme.
         *
         * @type {Array}
         * @name Grid#themes
         * @private
         *
         * @example
         * // Theme 1
         * // quadratic grid appearance with distance of major grid elements set to the primarily greater one
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: true,
         *     defaultAxes: {
         *         x: { ticks: {majorHeight: 10} },
         *         y: { ticks: {majorHeight: 10} }
         *     },
         *     grid: { theme: 1 },
         * });
         * </pre> <div id="JXGb8d606c4-7c67-4dc0-9941-3b3bd0932898" class="jxgbox" style="width: 300px; height: 200px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXGb8d606c4-7c67-4dc0-9941-3b3bd0932898',
         *             {boundingbox: [-4, 4, 4, -4], axis: true, showcopyright: false, shownavigation: false,
         *                 defaultAxes: {
         *                     x: { ticks: {majorHeight: 10} },
         *                     y: { ticks: {majorHeight: 10} }
         *                 },
         *                grid: { theme: 1 },
         *             });
         *     })();
         * </script> <pre>
         *
         * @example
         * // Theme 2
         * // lines and points in between
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: false,
         *     grid: { theme: 2 },
         * });
         * </pre> <div id="JXG4e11e6e3-472a-48e0-b7d0-f80d397c769b" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXG4e11e6e3-472a-48e0-b7d0-f80d397c769b',
         *             {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false,
         *                 grid: { theme: 2 },
         *             })
         *     })();
         * </script> <pre>
         *
         * @example
         * // Theme 3
         * // lines and thinner lines in between
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: false,
         *     grid: { theme: 3 },
         * });
         * </pre> <div id="JXG334814a3-03a7-4231-a5a7-a42d3b8dc2de" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXG334814a3-03a7-4231-a5a7-a42d3b8dc2de',
         *             {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false,
         *                 grid: { theme: 3 }
         *         });
         *     })();
         * </script> <pre>
         *
         * @example
         * // Theme 4
         * // lines with grid of '+'s plotted in between
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: false,
         *     grid: { theme: 4 },
         * });
         * </pre> <div id="JXG9e2bb29c-d998-428c-9432-4a7bf6cd9222" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXG9e2bb29c-d998-428c-9432-4a7bf6cd9222',
         *             {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false,
         *                 grid: { theme: 4 },
         *             });
         *     })();
         * </script> <pre>
         *
         * @example
         * // Theme 5
         * // grid of '+'s and points in between
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: false,
         *     grid: { theme: 5 },
         * });
         * </pre> <div id="JXG6a967d83-4179-4827-9e97-63fbf1e872c8" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXG6a967d83-4179-4827-9e97-63fbf1e872c8',
         *             {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false,
         *                 grid: { theme: 5 },
         *         });
         *     })();
         * </script> <pre>
         *
         * @example
         * // Theme 6
         * // grid of circles with points in between
         *
         * JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-4, 4, 4, -4], axis: false,
         *     grid: { theme: 6 },
         * });
         * </pre> <div id="JXG28bee3da-a7ef-4590-9a18-38d1b99d09ce" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         JXG.JSXGraph.initBoard('JXG28bee3da-a7ef-4590-9a18-38d1b99d09ce',
         *             {boundingbox: [-4, 4, 4, -4], axis: false, showcopyright: false, shownavigation: false,
         *                 grid: { theme: 6 },
         *         });
         *     })();
         * </script> <pre>
         */
        themes: [
            {
                // default values
            },

            {   // Theme 1: quadratic grid appearance with distance of major grid elements in x- and y-direction set to the primarily smaller one
                forceSquare: 'min',
                major: {
                    face: 'line'
                }
            },

            {   // Theme 2: lines and points in between
                major: {
                    face: 'line'
                },
                minor: {
                    size: 3,
                    face: 'point'
                },
                minorElements: 'auto'
            },

            {   // Theme 3: lines and thinner lines in between
                major: {
                    face: 'line'
                },
                minor: {
                    face: 'line',
                    strokeOpacity: 0.25
                },
                minorElements: 'auto'
            },

            {   // Theme 4: lines with grid of '+'s plotted in between
                major: {
                    face: 'line'
                },
                minor: {
                    face: '+',
                    size: '95%'
                },
                minorElements: 'auto'
            },

            {   // Theme 5: grid of '+'s and more points in between
                major: {
                    face: '+',
                    size: 10,
                    strokeOpacity: 1
                },
                minor: {
                    face: 'point',
                    size: 3
                },
                minorElements: 'auto'
            },

            {   // Theme 6: grid of circles with points in between
                major: {
                    face: 'circle',
                    size: 8,
                    fillColor: '#c0c0c0'
                },
                minor: {
                    face: 'point',
                    size: 3
                },
                minorElements: 'auto'
            }
        ]

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
         * @see Image#highlightCssClass
         * @see Text#cssClass
         * @see JXG.GeometryElement#cssClass
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
         * @see Image#cssClass
         * @see Image#highlightCssClass
         * @see JXG.GeometryElement#highlightCssClass
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

    /* special implicitcurve options */
    implicitcurve: {
        /**#@+
         * @visprop
         */

        /**
         * Defines the margin (in user coordinates) around the JSXGraph board in which the
         * implicit curve is plotted.
         *
         * @name ImplicitCurve#margin
         * @type {Number|Function}
         * @default 1
         */
        margin: 1,

        /**
         * Horizontal resolution: distance (in pixel) between vertical lines to search for components of the implicit curve.
         * A small number increases the running time. For large number components may be missed.
         * Minimum value is 0.01.
         *
         * @name ImplicitCurve#resolution_outer
         * @type {Number|Function}
         * @default 5
         */
        resolution_outer: 5,

        /**
         * Vertical resolution (in pixel) to search for components of the implicit curve.
         * A small number increases the running time. For large number components may be missed.
         * Minimum value is 0.01.
         *
         * @name ImplicitCurve#resolution_inner
         * @type {Number|Function}
         * @default 5
         */
        resolution_inner: 5,

        /**
         * Maximum iterations for one component of the implicit curve.
         *
         * @name ImplicitCurve#max_steps
         * @type {Number|Function}
         * @default 1024
         */
        max_steps: 1024,

        /**
         * Angle &alpha;<sub>0</sub> between two successive tangents: determines the smoothness of
         * the curve.
         *
         * @name ImplicitCurve#alpha_0
         * @type {Number|Function}
         * @default 0.05
         */
        alpha_0: 0.05,

        /**
         * Tolerance to find starting points for the tracing phase of a component.
         *
         * @name ImplicitCurve#tol_0
         * @type {Number|Function}
         * @default JXG.Math.eps
         */
        tol_u0: Mat.eps,

        /**
         * Tolerance for the Newton steps.
         *
         * @name ImplicitCurve#tol_newton
         * @type {Number|Function}
         * @default 1.0e-7
         */
        tol_newton: 1.0e-7,

        /**
         * Tolerance for cusp / bifurcation detection.
         *
         * @name ImplicitCurve#tol_cusp
         * @type {Number|Function}
         * @default 0.05
         */
        tol_cusp: 0.05,

        /**
         * If two points are closer than this value, we bail out of the tracing phase for that
         * component.
         *
         * @name ImplicitCurve#tol_progress
         * @type {Number|Function}
         * @default 0.0001
         */
        tol_progress: 0.0001,

        /**
         * Half of the box size (in user units) to search for existing line segments in the quadtree.
         *
         * @name ImplicitCurve#qdt_box
         * @type {Number|Function}
         * @default 0.2
         */
        qdt_box: 0.2,

        /**
         * Inverse of desired number of Newton steps.
         *
         * @name ImplicitCurve#kappa_0
         * @type {Number|Function}
         * @default 0.2
         */
        kappa_0: 0.2,

        /**
         * Allowed distance (in user units) of predictor point to curve.
         *
         * @name ImplicitCurve#delta_0
         * @type {Number|Function}
         * @default 0.05
         */
        delta_0: 0.05,

        /**
         * Initial step width (in user units).
         *
         * @name ImplicitCurve#h_initial
         * @type {Number|Function}
         * @default 0.1
         */
        h_initial: 0.1,

        /**
         * If h is below this threshold (in user units), we bail out
         * of the tracing phase of that component.
         *
         * @name ImplicitCurve#h_critical
         * @type {Number|Function}
         * @default 0.001
         */
        h_critical: 0.001,

        /**
         * Maximum step width (in user units).
         *
         * @name ImplicitCurve#h_max
         * @type {Number|Function}
         * @default 0.5
         */
        h_max: 0.5,

        /**
         * Allowed distance (in user units multiplied by actual step width) to detect loop.
         *
         * @name ImplicitCurve#loop_dist
         * @type {Number|Function}
         * @default 0.09
         */
        loop_dist: 0.09,

        /**
         * Minimum acos of angle to detect loop.
         *
         * @name ImplicitCurve#loop_dir
         * @type {Number|Function}
         * @default 0.99
         */
        loop_dir: 0.99,

        /**
         * Use Gosper's loop detector.
         *
         * @name ImplicitCurve#loop_detection
         * @type {Boolean|Function}
         * @default true
         */
        loop_detection: true

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

        /**
         * Internationalization support for infobox text.
         *
         * @name JXG.Board.infobox#intl
         * @type object
         * @default <pre>{
         *    enabled: 'inherit',
         *    options: {}
         * }</pre>
         * @visprop
         * @see JXG.Board#intl
         * @see Text#intl
         */
        intl: {
            enabled: 'inherit',
            options: {}
        },

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
        tabindex: null,
        viewport: [0, 0, 0, 0],

        ignoreForLabelAutoposition: true
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
         * @default <pre>{
         *      fontSize: 20,
         *      digits: 4,
         *      intl: {
         *          enabled: false,
         *          options: {}
         *      }
         *    }</pre>
         */
        label: {
            fontSize: 20,
            digits: 4,
            intl: {
                enabled: false,
                options: {}
            }
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
        tabindex: null,

        /**
         * Point labels are positioned by setting {@link Point#anchorX}, {@link Point#anchorY}
         * and {@link Label#offset}.
         * For line, circle and curve elements (and their derived objects)
         * there are two possibilities to position labels.
         * <ul>
         * <li> The first (old) possibility uses the <a href="https://www.tug.org/metapost.html">MetaPost</a> system:
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
         * <li> the second (preferred) possibility (since v1.9.0) is:
         * with <tt>position: 'len side'</tt> the label can be positioned exactly along the
         * element's path. Here,
         * <ul>
         * <li> 'len' is an expression of the form
         *   <ul>
         *     <li> xfr, denoting a fraction of the whole. x is expected to be a number between 0 and 1.
         *     <li> x%, a percentage. x is expected to be a number between 0 and 100.
         *     <li> x, a number: only possible for line elements and circles. For lines, the label is positioned x
         *          user units from the starting point. For circles, the number is interpreted as degree, e.g. 45°.
         *          For everything else, 0 is taken instead.
         *     <li> xpx, a pixel value: only possible for line elements.
         *          The label is positioned x pixels from the starting point.
         *          For non-lines, 0% is taken instead.
         *   </ul>
         *   If the domain of a curve is not connected, a position of the label close to the line
         *   between the first and last point of the curve is chosen.
         * <li> 'side' is either 'left' or 'right'. The label is positioned to the left or right of the path, when moving from the
         * first point to the last. For circles, 'left' means inside of the circle, 'right' means outside of the circle.
         * The distance of the label from the path can be controlled by {@link Label#distance}.
         * </ul>
         * Recommended for this second possibility is to use anchorX: 'middle' and 'anchorY: 'middle'.
         * </ul>
         *
         * @example
         * var l1 = board.create('segment', [[-3, 2], [3, 2]], {
         *     name: 'l_1',
         *     withLabel: true,
         *     point1: { visible: true, name: 'A', withLabel: true },
         *     point2: { visible: true, name: 'B', withLabel: true },
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'middle',
         *         offset: [0, 0],
         *         distance: 1.2,
         *         position: '0.2fr left'
         *     }
         * });
         *
         * </pre><div id="JXG66395d34-fd7f-42d9-97dc-14ae8882c11f" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG66395d34-fd7f-42d9-97dc-14ae8882c11f',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
         *     var l1 = board.create('segment', [[-3, 2], [3, 2]], {
         *         name: 'l_1',
         *         withLabel: true,
         *         point1: { visible: true, name: 'A', withLabel: true },
         *         point2: { visible: true, name: 'B', withLabel: true },
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'middle',
         *             offset: [0, 0],
         *             distance: 1.2,
         *             position: '0.2fr left'
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var c1 = board.create('circle', [[0, 0], 3], {
         *     name: 'c_1',
         *     withLabel: true,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'middle',
         *         offset: [0, 0],
         *         fontSize: 32,
         *         distance: 1.5,
         *         position: '50% right'
         *     }
         * });
         *
         * </pre><div id="JXG98ee16ab-fc5f-476c-bf57-0107ac69d91e" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG98ee16ab-fc5f-476c-bf57-0107ac69d91e',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
         *     var c1 = board.create('circle', [[0, 0], 3], {
         *         name: 'c_1',
         *         withLabel: true,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'middle',
         *             offset: [0, 0],
         *             fontSize: 32,
         *             distance: 1.5,
         *             position: '50% right'
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var cu1 = board.create('functiongraph', ['3 * sin(x)', -3, 3], {
         *     name: 'cu_1',
         *     withLabel: true,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'middle',
         *         offset: [0, 0],
         *         distance: 2,
         *         position: '0.8fr right'
         *     }
         * });
         *
         * </pre><div id="JXG65b2edee-12d8-48a1-94b2-d6e79995de8c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG65b2edee-12d8-48a1-94b2-d6e79995de8c',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
         *     var cu1 = board.create('functiongraph', ['3 * sin(x)', -3, 3], {
         *         name: 'cu_1',
         *         withLabel: true,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'middle',
         *             offset: [0, 0],
         *             distance: 2,
         *             position: '0.8fr right'
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         * var A = board.create('point', [-1, 4]);
         * var B = board.create('point', [-1, -4]);
         * var C = board.create('point', [1, 1]);
         * var cu2 = board.create('ellipse', [A, B, C], {
         *     name: 'cu_2',
         *     withLabel: true,
         *     label: {
         *         anchorX: 'middle',
         *         anchorY: 'middle',
         *         offset: [0, 0],
         *         fontSize: 20,
         *         distance: 1.5,
         *         position: '75% right'
         *     }
         * });
         *
         * </pre><div id="JXG9c3b2213-1b5a-4cb8-b547-a8d179b851f2" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9c3b2213-1b5a-4cb8-b547-a8d179b851f2',
         *             {boundingbox: [-5, 5, 5, -5], axis: true, showcopyright: false, shownavigation: false});
         *     var A = board.create('point', [-1, 4]);
         *     var B = board.create('point', [-1, -4]);
         *     var C = board.create('point', [1, 1]);
         *     var cu2 = board.create('ellipse', [A, B, C], {
         *         name: 'cu_2',
         *         withLabel: true,
         *         label: {
         *             anchorX: 'middle',
         *             anchorY: 'middle',
         *             offset: [0, 0],
         *             fontSize: 20,
         *             distance: 1.5,
         *             position: '75% right'
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @name Label#position
         * @type String
         * @default 'urt'
         * @see Label#distance
         * @see Label#offset
         */
        position: 'urt',

        /**
         * Distance of the label from a path element, like line, circle, curve.
         * The true distance is this value multiplied by 0.5 times the size of the bounding box of the label text.
         * That means, with a value of 1 the label will touch the path element.
         * @name Label#distance
         * @type Number
         * @default 1.5
         *
         * @see Label#position
         *
         */
        distance: 1.5,

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
         * @see GeometryElement#ignoreForLabelAutoposition
         * @see Label#autoPositionMinDistance
         * @see Label#autoPositionMaxDistance
         * @see Label#autoPositionWhitelist
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
        autoPosition: false,

        /**
         * The auto position algorithm tries to put a label to a conflict-free
         * position around it's anchor element. For this, the algorithm tests 12 positions
         * around the anchor element starting at a distance from the anchor
         * defined here (in pixel).
         *
         * @name Label#autoPositionMinDistance
         * @see Label#autoPosition
         * @see Label#autoPositionMaxDistance
         * @see Label#autoPositionWhitelist
         * @type Number
         * @default 12
         *
         */
        autoPositionMinDistance: 12,

        /**
         * The auto position algorithm tries to put a label to a conflict-free
         * position around it's anchor element. For this, the algorithm tests 12 positions
         * around the anchor element up to a distance from the anchor
         * defined here (in pixel).
         *
         * @name Label#autoPositionMaxDistance
         * @see Label#autoPosition
         * @see Label#autoPositionMinDistance
         * @see Label#autoPositionWhitelist
         * @type Number
         * @default 28
         *
         */
        autoPositionMaxDistance: 28,

        /**
         * List of object ids which should be ignored on setting automatic position of label text.
         *
         * @name Label#autoPositionWhitelist
         * @see Label#autoPosition
         * @see Label#autoPositionMinDistance
         * @see Label#autoPositionMaxDistance
         * @type Array
         * @default []
         */
        autoPositionWhitelist: []

        /**#@-*/
    },

    /* special legend options */
    legend: {
        /**#@+
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
         * Length of line in one legend entry
         * @name Legend#lineLength
         * @type Number
         * @default 1
         *
         */
        lineLength: 1,

        /**
         * (Circular) array of opacity for legend line stroke color for one legend entry.
         * @name Legend#strokeOpacity
         * @type Array
         * @default [1]
         *
         */
        strokeOpacity: [1],

        /**
         * Height (in px) of one legend entry
         * @name Legend#rowHeight
         * @type Number
         * @default 20
         *
         */
        rowHeight: 20,

        /**
         * Height (in px) of one legend entry
         * @name Legend#strokeWidth
         * @type Number
         * @default 5
         *
         */
        strokeWidth: 5,

        /**
         * The element can be fixed and may not be dragged around. If true, the legend will even stay at its position on zoom and
         * moveOrigin events.
         * @name Legend#frozen
         * @type Boolean
         * @default false
         * @see JXG.GeometryElement#frozen
         *
         */
        frozen: false

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
         * The attribute firstArrow can be a Boolean or an object with the following sub-attributes:
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
         * <p>
         * An arrow head can be turned off with line.setAttribute({firstArrow: false}).
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
         * @type Boolean | Object
         * @default false
         */
        firstArrow: false,

        /**
         * Configure the arrow head at the position of its second point or the corresponding
         * intersection with the canvas border.
         *
         * The attribute lastArrow can be a Boolean or an object with the following sub-attributes:
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
         * <p>
         * An arrow head can be turned off with line.setAttribute({lastArrow: false}).
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
         * @type Boolean | Object
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
            ticksDistance: 1,
            minTicksDistance: 50,
            minorHeight: 4,          // if <0: full width and height
            majorHeight: -1,         // if <0: full width and height
            minorTicks: 4,
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

    /* special measurement options */
    measurement: {
        /**#@+
         * @visprop
         */

        /**
         * This specifies the unit of measurement in dimension 1 (e.g. length).
         * A power is automatically added to the string.
         * If you want to use different units for each dimension, see {@link Measurement#units}.
         *
         * @example
         * var p1 = board.create("point", [0,1]),
         *     p2 = board.create("point", [3,1]),
         *     c = board.create("circle", [p1, p2]);
         *
         * board.create("measurement", [-2, -3, ["Perimeter", c]], {
         *     baseUnit: " m"
         * });
         * board.create("measurement", [1, -3, ["Area", c]], {
         *     baseUnit: " m"
         * });
         *
         * </pre><div id="JXG6cb6a7e7-553b-4f2a-af99-ddd78b7ba118" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG6cb6a7e7-553b-4f2a-af99-ddd78b7ba118',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, grid: false, showcopyright: false, shownavigation: false});
         *
         *     var p1 = board.create("point", [0,1]),
         *         p2 = board.create("point", [3,1]),
         *         c = board.create("circle", [p1, p2]);
         *
         *     board.create("measurement", [-2, -3, ["Perimeter", c]], {
         *         baseUnit: " m"
         *     });
         *     board.create("measurement", [1, -3, ["Area", c]], {
         *         baseUnit: " m"
         *     });
         *
         *     })();
         * </script><pre>
         *
         * @see Measurement#units
         * @name Measurement#baseUnit
         * @type String
         * @default ''
         */
        baseUnit: '',

        /**
         * This attribute expects an object that has the dimension numbers as keys (as integer or in the form of 'dimxx')
         * and assigns a string to each dimension.
         * If a dimension has no specification, {@link Measurement#baseUnit} is used.
         *
         * @example
         * var p1 = board.create("point", [0,1]),
         *     p2 = board.create("point", [3,1]),
         *     c = board.create("circle", [p1, p2]);
         *
         * board.create("measurement", [-3, -3, ["Perimeter", c]], {
         *     baseUnit: " m",
         *     units: {
         *          1: " length unit",
         *       2: " area unit"
         *     },
         * });
         * board.create("measurement", [1, -3, ["Area", c]], {
         *     baseUnit: " m",
         *     units: {
         *          dim1: " length unit",
         *       dim2: " area unit"
         *     },
         * });
         *
         * </pre><div id="JXGe06456d5-255e-459b-8c8e-4d7d2af7efb8" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGe06456d5-255e-459b-8c8e-4d7d2af7efb8',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, grid: false, showcopyright: false, shownavigation: false});
         *     var p1 = board.create("point", [0,1]),
         *         p2 = board.create("point", [3,1]),
         *         c = board.create("circle", [p1, p2]);
         *
         *     board.create("measurement", [-3, -3, ["Perimeter", c]], {
         *         baseUnit: " m",
         *         units: {
         *          1: " length unit",
         *           2: " area unit"
         *         },
         *     });
         *     board.create("measurement", [1, -3, ["Area", c]], {
         *         baseUnit: " m",
         *         units: {
         *          dim1: " length unit",
         *           dim2: " area unit"
         *         },
         *     });
         *
         *     })();
         * </script><pre>
         *
         * @see Measurement#baseUnit
         * @name Measurement#units
         * @type Object
         * @default {}
         */
        units: {},

        /**
         * Determines whether a prefix is displayed before the measurement value and unit.
         *
         * @see Measurement#prefix
         * @name Measurement#showPrefix
         * @type Boolean
         * @default true
         */
        showPrefix: true,

        /**
         * Determines whether a suffix is displayed after the measurement value and unit.
         *
         * @see Measurement#suffix
         * @name Measurement#showSuffix
         * @type Boolean
         * @default true
         */
        showSuffix: true,

        /**
         * String that is displayed before the measurement and its unit.
         *
         * @see Measurement#showPrefix
         * @name Measurement#prefix
         * @type String
         * @default ''
         */
        prefix: '',

        /**
         * String that is displayed after the measurement and its unit.
         *
         * @see Measurement#showSuffix
         * @name Measurement#suffix
         * @type String
         * @default ''
         */
        suffix: '',

        /**
         * Dimension of the measured data. This measurement can only be combined with a measurement of a suitable dimension.
         * Overwrites the dimension returned by the Dimension() method.
         * Normally, the default value null is used here to automatically determine the dimension.
         *
         * However, if the coordinates or a direction vector are measured, the value is usually returned as an array.
         * To tell the measurement that the function {@link Measurement#formatCoords} or {@link Measurement#formatDirection} should be used
         * to display the array properly, 'coords' or 'direction' must be specified here.
         *
         * @see Measurement#formatCoords
         * @see Measurement#formatDirection
         * @name Measurement#dim
         * @type Number|'coords'|'direction'
         * @default null
         */
        dim: null,

        /**
         * Function to format coordinates. Does only have an effect, if {@link Measurement#dim} is set to 'coords'.
         *
         * @example
         * var p = board.create("point", [-2, 0]);
         *
         * board.create("measurement", [0, -3, ["Coords", p]], {
         *     dim: 'coords',
         *     formatCoords: function (_,x,y,z) {
         *         if (parseFloat(z) !== 1)
         *             return 'Infinit coords';
         *         else
         *             return '(' + x + ' | ' + y + ')';
         *     }
         * });
         *
         * </pre><div id="JXGa0606ad6-971b-47d4-9a72-ca7df65890f5" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGa0606ad6-971b-47d4-9a72-ca7df65890f5',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var p = board.create("point", [-2, 0]);
         *
         *     board.create("measurement", [0, -3, ["Coords", p]], {
         *         dim: 'coords',
         *         formatCoords: function (_,x,y,z) {
         *             if (parseFloat(z) !== 1)
         *                 return 'Infinit coords';
         *             else
         *                 return '(' + x + ' | ' + y + ')';
         *         }
         *     });
         *     })();
         * </script><pre>
         *
         * @see Measurement#dim
         * @name Measurement#formatCoords
         * @type Function
         * @param {Measurement} self Pointer to the measurement object itself
         * @param {Number} x c-coordinate
         * @param {Number} y c-coordinate
         * @param {Number} z c-coordinate
         * @returns String
         */
        formatCoords: function (self, x, y, z) {
            if (parseFloat(z) !== 1)
                return 'Infinit coords';
            else
                return '(' + x + ', ' + y + ')';
        },

        /**
         * Function to format direction vector. Does only have an effect, if {@link Measurement#dim} is set to 'direction'.
         *
         * @example
         * var p1 = board.create("point", [0,1]),
         *     p2 = board.create("point", [3,1]),
         *     s = board.create("segment", [p1, p2]);
         *
         * board.create("measurement", [0, -2, ["Direction", s]], {
         *     dim: 'direction',
         *     formatDirection: function (self,x,y) {
         *        return '\\[\\frac{' + x + '}{' + y + '} = ' +
         *            (!isFinite(x/y) ? '\\infty' : JXG.toFixed(x/y, self.visProp.digits)) +
         *            '\\]';
         *     },
         *     useMathJax: true
         * });
         *
         * </pre><div id="JXG57435de0-16f2-42be-94d8-3d2b31caefcd" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG57435de0-16f2-42be-94d8-3d2b31caefcd',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, grid: false, showcopyright: false, shownavigation: false});
         *     var p1 = board.create("point", [0,1]),
         *         p2 = board.create("point", [3,1]),
         *         s = board.create("segment", [p1, p2]);
         *
         *     board.create("measurement", [0, -2, ["Direction", s]], {
         *         dim: 'direction',
         *         formatDirection: function (self,x,y) {
         *            return '\\[\\frac{' + x + '}{' + y + '} = ' +
         *                (!isFinite(x/y) ? '\\infty' : JXG.toFixed(x/y, self.visProp.digits)) +
         *                '\\]';
         *         },
         *         useMathJax: true
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @name Measurement#formatDirection
         * @type Function
         * @param {Measurement} self Pointer to the measurement object itself
         * @param {Number} x c-coordinate
         * @param {Number} y c-coordinate
         * @returns String
         */
        formatDirection: function (self, x, y) {
            return '(' + x + ', ' + y + ')';
        }

        /**#@-*/
    },

    /* special metapost spline options */
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

    /* special nonreflexangle options */
    nonreflexangle: {
        /**#@+
         * @visprop
         */

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

    /* special otherintersection point options */
    otherintersection: {
        /**#@+
         * @visprop
         */

        /**
         * This flag sets the behavior of other intersection points of e.g.
         * a circle and a segment. If true, the intersection is treated as intersection with a line. If false
         * the intersection point exists if the segment intersects setwise.
         *
         * @name Otherintersection.alwaysIntersect
         * @type Boolean
         * @default true
         */
        alwaysIntersect: true,

        /**
         * Minimum distance (in user coordinates) for points to be defined as different.
         * For implicit curves and other non approximate curves this number might have to be
         * increased.
         *
         * @name Otherintersection.precision
         * @type Number
         * @default 0.001
         */
        precision: 0.001

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

    /* special parallelogram options */
    parallelogram: {
        parallelpoint: {
            withLabel: false,
            name: ''
        }
    },

    /* special parallelpoint options */
    parallelpoint: {
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
         * <table>
         * <tr><th>Input</th><th>Output</th></tr>
         * <tr><td>cross</td><td>x</td></tr>
         * <tr><td>circle</td><td>o</td></tr>
         * <tr><td>square, []</td><td>[]</td></tr>
         * <tr><td>plus</td><td>+</td></tr>
         * <tr><td>minus</td><td>-</td></tr>
         * <tr><td>divide</td><td>|</td></tr>
         * <tr><td>diamond</td><td>&lt;&gt;</td></tr>
         * <tr><td>diamond2</td><td>&lt;&gt; (bigger)</td></tr>
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
         * @type Boolean|String
         * @description true | false | 'inherit'
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
         * @type String| Number
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
         * By default, the strokewidths of the borders of a polygon are not changed during highlighting (only strokeColor and strokeOpacity are changed
         * to highlightStrokeColor, and highlightStrokeOpacity).
         * However, strokewidth is changed to highlightStrokewidth if an individual border gets the focus.
         * <p>
         * With this attribute set to true, also the borders change strokeWidth if the polygon itself gets the focus.
         *
         * @type Boolean
         * @name Polygon#highlightByStrokeWidth
         * @default false
         */
        highlightByStrokeWidth: false,

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
         * @name Prescribedangle#anglePoint
         * @ignore
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
         * @type center
         * @name Reflection#center
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

    /* special reflexangle options */
    reflexangle: {
        /**#@+
         * @visprop
         */

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
         * @name RegularPolygon#label
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
         * If true, there is a fourth parent point, i.e. the parents are [center, p1, p2, p3].
         * p1 is still the radius point, p2 the angle point. The sector will be that part of the
         * the circle with center 'center' which starts at p1, ends at the ray between center
         * and p2, and passes p3.
         * <p>
         * This attribute is immutable (by purpose).
         * This attribute is necessary for circumCircleSectors
         *
         * @type Boolean
         * @name Arc#useDirection
         * @default false
         * @private
         */
        useDirection: false,

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
            fillColor: 'none',
            withLabel: false,
            name: '',

            center: {
                visible: false,
                withLabel: false,
                name: ''
            },

            radiusPoint: {
                visible: false,
                withLabel: false,
                name: ''
            },

            anglePoint: {
                visible: false,
                withLabel: false,
                name: ''
            }
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
         * List of values to snap to. If the glider is within snapValueDistance
         * (in user coordinate units) of one of these points,
         * then the glider snaps to that point.
         *
         * @memberOf Slider.prototype
         * @name snapValues
         * @type Array
         * @see Slider#snapValueDistance
         * @default empty
         *
         * @example
         *         var n = board.create('slider', [[-2, 3], [4, 3], [1, 5, 100]], {
         *             name: 'n',
         *             snapWidth: 1,
         *             snapValues: [1, 22, 77, 100],
         *             snapValueDistance: 5
         *         });
         *
         *         var k = board.create('slider', [[-2, -1], [4, -1], [-4, 0, 4]], {
         *             name: 'k',
         *             snapWidth: 0.1,
         *             snapValues: [-3, -1, 1, 3],
         *             snapValueDistance: 0.4
         *         });
         *
         * </pre><div id="JXG9be68014-4e14-479a-82b4-e92d9b8f6eef" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG9be68014-4e14-479a-82b4-e92d9b8f6eef',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *             var n = board.create('slider', [[-2, 3], [4, 3], [1, 5, 100]], {
         *                 name: 'n',
         *                 snapWidth: 1,
         *                 snapValues: [1, 22, 77, 100],
         *                 snapValueDistance: 5
         *             });
         *
         *             var k = board.create('slider', [[-2, -1], [4, -1], [-4, 0, 4]], {
         *                 name: 'k',
         *                 snapWidth: 0.1,
         *                 snapValues: [-3, -1, 1, 3],
         *                 snapValueDistance: 0.4
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        snapValues: [],

        /**
         * If the difference between the slider value and one of the elements of snapValues is less
         * than this number (in user coordinate units), the slider will snap to that value.
         *
         * @memberOf Slider.prototype
         * @name snapValueDistance
         * @type Number
         * @see Slider#snapValues
         * @default 0.0
         */
        snapValueDistance: 0.0,

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

        /**
         * Internationalization support for slider labels.
         *
         * @name intl
         * @memberOf Slider.prototype
         * @type object
         * @default <pre>{
         *    enabled: 'inherit',
         *    options: {}
         * }</pre>
         * @see JXG.Board#intl
         * @see Text#intl
         *
         * @example
         * var s = board.create('slider', [[-2, 3], [2, 3], [0, 1, 360]], {
         *     name: '&alpha;',
         *     snapWidth: 1,
         *     intl: {
         *         enabled: true,
         *         options: {
         *             style: 'unit',
         *             unit: 'degree',
         *         }
         *     }
         * });
         *
         * </pre><div id="JXGb49a9779-c0c8-419d-9173-c67232cfd65c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb49a9779-c0c8-419d-9173-c67232cfd65c',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var s = board.create('slider', [[-2, 3], [2, 3], [0, 1, 360]], {
         *         name: '&alpha;',
         *         snapWidth: 1,
         *         intl: {
         *             enabled: true,
         *             options: {
         *                 style: 'unit',
         *                 unit: 'degree',
         *             }
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        intl: {
            enabled: 'inherit',
            options: {}
        },

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
            frozen: 'inherit',
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
            frozen: 'inherit',
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
            includeBoundaries: true,
            drawZero: true,
            label: {
                offset: [-4, -14],
                display: 'internal'
            },

            minTicksDistance: 30,
            insertTicks: true,
            ticksDistance: 1,      // Not necessary, since insertTicks = true
            minorHeight: 4,        // if <0: full width and height
            majorHeight: 5,        // if <0: full width and height
            minorTicks: 0,
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
            visible: true,
            position: 'first'
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
        measure: 'radius'

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

        /**
         * Supply a unit suffix.
         *
         * @type String
         * @name Smartlabel#unit
         * @default ''
         */
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

    /* special tangent options */
    tangent: {
    },

    /* special tangent options */
    tangentto: {
        /**#@+
         * @visprop
         */

        /**
         * Attributes for the polar line of the tangentto construction.
         *
         * @name polar
         * @memberOf TangentTo.prototype
         * @type JXG.Line
         */
        polar: {
            visible: false,
            strokeWidth: 1,
            dash: 3
        },

        /**
         * Attributes for the intersection point of the conic/circle with the polar line of the tangentto construction.
         *
         * @name point
         * @memberOf TangentTo.prototype
         * @type JXG.Point
         */
        point: {
            visible: false
        }

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
         * @name digits
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
            visible: true,
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
            visible: true,
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
            ticksDistance: 0.1, // Ignored, since insertTicks=true
            minorHeight: 8,
            majorHeight: 16,
            minorTicks: 4,
            tickEndings: [0, 1],
            majorTickEndings: [0, 1],
            strokeOpacity: 1,
            strokeWidth: 1,
            strokeColor: '#000000',
            visible: 'inherit',
            label: {
                anchorY: 'top',
                anchorX: 'middle',
                offset: [0, -10]
            }
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
         * If the text content is solely a number and
         * this attribute is true (default) then the number is either formatted
         * according to the number of digits
         * given by the attribute 'digits' or converted into a fraction if 'toFraction'
         * is true.
         * <p>
         * Otherwise, display the raw number.
         *
         * @name formatNumber
         * @memberOf Text.prototype
         * @default false
         * @type Boolean
         *
         */
        formatNumber: false,

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
         * Internationalization support for texts consisting of a number only.
         * <p>
         * Setting the local overwrites the board-wide locale set in the board attributes.
         * The JSXGraph attribute digits is overruled by the
         * Intl attributes "minimumFractionDigits" and "maximumFractionDigits".
         * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat">https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat</a>
         * for more information about possible options.
         * <p>
         * See below for an example where the text is composed from a string and a locale formatted number.
         *
         * @name intl
         * @memberOf Text.prototype
         * @type object
         * @default <pre>{
         *    enabled: 'inherit',
         *    options: {
         *      minimumFractionDigits: 0,
         *      maximumFractionDigits: 2
         *    }
         * }</pre>
         * @see JXG.Board#intl
         *
         * @example
         * var t = board.create('text', [1, 2, -Math.PI*100], {
         *         digits: 2,
         *         intl: {
         *                 enabled: true,
         *                 options: {
         *                     style: 'unit',
         *                     unit: 'celsius'
         *                 }
         *             }
         *     });
         *
         * </pre><div id="JXGb7162923-1beb-4e56-8817-19aa66e226d1" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb7162923-1beb-4e56-8817-19aa66e226d1',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *     var t = board.create('text', [1, 2, -Math.PI*100], {
         *             digits: 2,
         *             intl: {
         *                     enabled: true,
         *                     options: {
         *                         style: 'unit',
         *                         unit: 'celsius'
         *                     }
         *                 }
         *         });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @example
         * var t = board.create('text', [0.05, -0.2, ''], {
         *     intl: {
         *         enabled: true,
         *         locale: 'it-IT',
         *         options: {
         *             style: 'unit',
         *             unit: 'kilometer-per-hour',
         *             unitDisplay: 'narrow',
         *             maximumFractionDigits: 2
         *         }
         *     }
         * });
         *
         * // Set dynamic text consisting of text and number.
         * t.setText(function() {
         *     var txt = 'Speed: ',
         *         number = t.X();
         *
         *     // Add formatted number to variable txt
         *     // with fallback if locale is not supported.
         *     if (t.useLocale()) {
         *         txt += t.formatNumberLocale(number);
         *     } else {
         *         txt += JXG.toFixed(number, 2);
         *     }
         *     return txt;
         * });
         *
         * </pre><div id="JXG560aeb1c-55fb-45da-8ad5-d3ad26216056" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG560aeb1c-55fb-45da-8ad5-d3ad26216056',
         *             {boundingbox: [-0.5, 0.5, 0.5, -0.5], axis: true, showcopyright: false, shownavigation: false});
         *     var t = board.create('text', [0.3, -0.3, ''], {
         *         intl: {
         *             enabled: true,
         *             locale: 'it-IT',
         *             options: {
         *                 style: 'unit',
         *                 unit: 'kilometer-per-hour',
         *                 unitDisplay: 'narrow',
         *                 maximumFractionDigits: 2
         *             }
         *         }
         *     });
         *
         *     // Set dynamic text consisting of text and number.
         *     t.setText(function() {
         *         var txt = 'Speed: ',
         *             number = t.X();
         *
         *         // Add formatted number to variable txt
         *         if (t.useLocale()) {
         *             txt += t.formatNumberLocale(number);
         *         } else {
         *             txt += JXG.toFixed(number, 2);
         *         }
         *         return txt;
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        intl: {
            enabled: 'inherit',
            options: {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        },

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
         * In summary, the order of priorities (specificity) from high to low is
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
         * of the HTML text element. That means, they have higher property (specificity) han any
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
         * of the HTML text element. That means, they have higher property (specificity) than any
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
         * @default <tt>{}</tt>
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
         * Display number as integer + nominator / denominator. Works together
         * with MathJax, KaTex or as plain text.
         * @name toFraction
         * @memberOf Text.prototype
         * @type Boolean
         * @default false
         * @see JXG#toFraction
         *
         * @example
         *  board.create('text', [2, 2, 2 / 7], { anchorY: 'top', toFraction: true, useMathjax: true });
         *  board.create('text', [2, -2, 2 / 19], { toFraction: true, useMathjax: false });
         *
         * </pre><div id="JXGc10fe0b6-15ac-42b6-890f-2593b427d493" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGc10fe0b6-15ac-42b6-890f-2593b427d493',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *             board.create('text', [2, 2, 2 / 7], { anchorY: 'top', toFraction: true, useMathjax: true });
         *             board.create('text', [2, -2, 2 / 19], { toFraction: true, useMathjax: false });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        toFraction: false,

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
         * The horizontal alignment of the text. Possible values include <tt>'auto'</tt>, <tt>'left'</tt>,
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
         * Apply CSS classes to the text in non-highlighted view. It is possible to supply one or more
         * CSS classes separated by blanks.
         *
         * @name cssClass
         * @memberOf Text.prototype
         * @type String
         * @default 'JXGtext'
         * @see Text#highlightCssClass
         * @see Image#cssClass
         * @see JXG.GeometryElement#cssClass
         */
        cssClass: 'JXGtext',

        /**
         * Apply CSS classes to the text in highlighted view. It is possible to supply one or more
         * CSS classes separated by blanks.
         *
         * @name highlightCssClass
         * @memberOf Text.prototype
         * @type String
         * @default 'JXGtext'
         * @see Text#cssClass
         * @see Image#highlightCssClass
         * @see JXG.GeometryElement#highlightCssClass
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

        /**
         * @name Text#visible
         * @type Boolean
         * @default true
         */
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
            validateNumber = function (v) {
                return Type.isNumber(v, true, false);
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
            // validateScreenCoords = function (v) {
            //     return v.length >= 2 && validateInteger(v[0]) && validateInteger(v[1]);
            // },
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
                // defaultDistance: validateNumber,
                display: validateDisplay,
                doAdvancedPlot: false,
                draft: false,
                drawLabels: false,
                drawZero: false,
                face: validatePointFace,
                factor: validateNumber,
                fillColor: validateColor,
                fillOpacity: validateNumber,
                firstArrow: false,
                fontSize: validateInteger,
                dash: validateInteger,
                gridX: validateNumber,
                gridY: validateNumber,
                // POI: Do we have to add something here?
                hasGrid: false,
                highlightFillColor: validateColor,
                highlightFillOpacity: validateNumber,
                highlightStrokeColor: validateColor,
                highlightStrokeOpacity: validateNumber,
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
                opacity: validateNumber,
                radius: validateNumber,
                RDPsmoothing: false,
                renderer: validateRenderer,
                right: validatePixel,
                showCopyright: false,
                showInfobox: false,
                showNavigation: false,
                size: validateNotNegative, //validateInteger,
                snapSizeX: validatePositive,
                snapSizeY: validatePositive,
                snapWidth: validateNumber,
                snapToGrid: false,
                snatchDistance: validateNotNegative,
                straightFirst: false,
                straightLast: false,
                stretch: false,
                strokeColor: validateColor,
                strokeOpacity: validateNumber,
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
            diamond2: '<<>>',
            '<<>>': '<<>>',
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
        // POI: Do we have to add something here?
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
     * @see JXG.useStandardOptions
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
