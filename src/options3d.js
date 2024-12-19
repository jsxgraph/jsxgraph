/*global JXG:true, define: true*/

import JXG from "./jxg.js";
import Options from "./options.js";

JXG.extend(Options, {
    // infobox: {
    //     // strokeColor: 'black',
    //     // useKatex: false,
    //     // useMathjax: false
    // },

    axes3d: {
        /**#@+
         * @visprop
         */

        /**
         * Position of the main axes in a View3D element. Possible values are
         * 'center', 'border' or 'none'. This attribute is immutable, i.e.
         * can not be changed during the lifetime of the construction.
         *
         * @type String
         * @name View3D#axesPosition
         * @default 'center'
         */
        axesPosition: "center", // Possible values: 'center', 'border', 'none'

        // Main axes
        /**
         * Attributes of the centered 3D x-axis.
         *
         * @type Line3D
         * @name View3D#xAxis
         * @see View3D#axesPosition
         */
        xAxis: { visible: true, point2: { name: "x" }, strokeColor: JXG.palette.red },

        /**
         * Attributes of the centered 3D y-axis.
         *
         * @type Line3D
         * @name View3D#yAxis
         * @see View3D#axesPosition
         */
        yAxis: { visible: true, point2: { name: "y" }, strokeColor: JXG.palette.green },

        /**
         * Attributes of the centered 3D z-axis.
         *
         * @type Line3D
         * @name View3D#zAxis
         * @see View3D#axesPosition
         */
        zAxis: { visible: true, point2: { name: "z" }, strokeColor: JXG.palette.blue },

        /**
         * Attributes of the 3D x-axis at the border.
         *
         * @type Line3D
         * @name View3D#xAxisBorder
         * @see View3D#axesPosition
         * @default <pre>{
         *   name: 'x',
         *   withLabel: false,
         *   label: {
         *       position: '50% left',
         *       offset: [30, 0],
         *       fontsize: 15
         *   },
         *   strokeWidth: 1,
         *   lastArrow: false,
         *   ticks3d: {
         *       label: {
         *           anchorX: 'middle',
         *           anchorY: 'middle'
         *       }
         *   }
         *}
         *</pre>
         */
        xAxisBorder: {
            name: 'x',
            visible: 'ìnherit',
            withLabel: false,
            label: {
                position: '50% left',
                offset: [30, 0],
                fontsize: 15
            },
            strokeWidth: 1,
            lastArrow: false,
            ticks3d: {
                visible: 'ìnherit',
                label: {
                    anchorX: 'middle',
                    anchorY: 'middle'
                }

            }
        },

        /**
         * Attributes of the 3D y-axis at the border.
         *
         * @type Line3D
         * @name View3D#yAxisBorder
         * @see View3D#axesPosition
         * @default <pre>{
         *   name: 'x',
         *   withLabel: false,
         *   label: {
         *       position: '50% right',
         *       offset: [0, -30],
         *       fontsize: 15
         *   },
         *   strokeWidth: 1,
         *   lastArrow: false,
         *   ticks3d: {
         *       label: {
         *           anchorX: 'middle',
         *       }
         *   }
         *}
         *</pre>
         */
        yAxisBorder: {
            name: 'y',
            visible: 'ìnherit',
            withLabel: false,
            label: {
                position: '50% right',
                offset: [0, -30],
                fontsize: 15
            },
            strokeWidth: 1,
            lastArrow: false,
            ticks3d: {
                visible: 'ìnherit',
                label: {
                    anchorX: 'middle'
                }
            }
        },

        /**
         * Attributes of the 3D z-axis at the border.
         *
         * @type Line3D
         * @name View3D#zAxisBorder
         * @see View3D#axesPosition
         * @default <pre>{
         *   name: 'z',
         *   withLabel: false,
         *   label: {
         *       position: '50% right',
         *       offset: [30, 0],
         *       fontsize: 15
         *   },
         *   strokeWidth: 1,
         *   lastArrow: false,
         *   ticks3d: {
         *       label: {
         *           anchorX: 'middle',
         *           anchorY: 'middle'
         *       }
         *   }
         *}
         *</pre>
         */
        zAxisBorder: {
            name: 'z',
            visible: 'ìnherit',
            withLabel: false,
            label: {
                position: '50% right',
                offset: [30, 0],
                fontsize: 15
            },
            strokeWidth: 1,
            lastArrow: false,
            ticks3d: {
                visible: 'ìnherit',
                label: {
                    anchorX: 'middle',
                    anchorY: 'middle'
                }
            }
        },

        // Planes
        /**
         * Attributes of the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRear
         */
        xPlaneRear: {
            visible: true,
            layer: 0,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            mesh3d: { layer: 1 }
        },

        /**
         * Attributes of the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRear
         */
        yPlaneRear: {
            visible: true,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 }
        },

        /**
         * Attributes of the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRear
         */
        zPlaneRear: {
            visible: true,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 }
        },

        /**
         * Attributes of the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFront
         */
        xPlaneFront: {
            visible: false,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 }
        },
        /**
         * Attributes of the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFront
         */
        yPlaneFront: {
            visible: false,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 }
        },
        /**
         * Attributes of the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFront
         */
        zPlaneFront: {
            visible: false,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 }
        },

        // Axes on the planes
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRearYAxis
         */
        xPlaneRearYAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRearZAxis
         */
        xPlaneRearZAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFrontYAxis
         */
        xPlaneFrontYAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFrontZAxis
         */
        xPlaneFrontZAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },

        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRearXAxis
         */
        yPlaneRearXAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRearZAxis
         */
        yPlaneRearZAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFrontXAxis
         */
        yPlaneFrontXAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFrontZAxis
         */
        yPlaneFrontZAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },

        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRearXAxis
         */
        zPlaneRearXAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRearYAxis
         */
        zPlaneRearYAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFrontXAxis
         */
        zPlaneFrontXAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFrontYAxis
         */
        zPlaneFrontYAxis: {
            visible: "inherit",
            strokeColor: "#888888",
            strokeWidth: 1
        }

        /**#@-*/
    },

    axis3d: {
        highlight: false,
        fixed: true,
        strokeColor: "black",
        strokeWidth: 1,
        tabindex: null,

        point1: { visible: false, name: "", withLabel: false },
        point2: { visible: false, name: "", withLabel: false, label: { visible: true } }
    },

    circle3d: {

        layer: 12,
        point: { visible: false, name: "" },
        needsRegularUpdate: true

    },

    curve3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        highlight: false,
        tabindex: -1,
        strokeWidth: 1,
        numberPointsHigh: 200,
        needsRegularUpdate: true

        /**#@-*/
    },

    face3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        highlight: false,
        tabindex: null,
        strokeWidth: 1,
        fillColor: JXG.palette.yellow,
        fillOpacity: 0.4,
        needsRegularUpdate: true

        /**#@-*/
    },

    intersectionline3d: {
        point1: { visible: false, name: "" }, // Used in point/point
        point2: { visible: false, name: "" }
    },

    line3d: {
        layer: 12,
        strokeWidth: 1,
        strokeColor: "black",
        fixed: true,
        tabindex: null,
        gradient: "linear",
        gradientSecondColor: "#ffffff",
        needsRegularUpdate: true,

        point: { visible: false, name: "" }, // Used in cases of point/direction/range
        point1: { visible: false, name: "" }, // Used in point/point
        point2: { visible: false, name: "" }
    },

    mesh3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        strokeWidth: 1,
        strokeColor: "#9a9a9a",
        strokeOpacity: 0.6,
        highlight: false,
        tabindex: null,
        needsRegularUpdate: true,

        visible: "inherit"

        /**#@-*/
    },

    plane3d: {
        layer: 12,
        strokeWidth: 0,
        strokeColor: "black",
        strokeOpacity: 1,
        highlight: false,
        tabindex: null,
        needsRegularUpdate: true,

        gradient: "linear",
        gradientSecondColor: "#ffffff",
        gradientAngle: Math.PI,
        fillColor: "#a7a7a7",
        fillOpacity: 0.6,

        point: { visible: false, name: "", fixed: true }
    },

    point3d: {
        layer: 13,
        infoboxDigits: "auto",
        strokeWidth: 0,
        gradient: "radial",
        gradientSecondColor: "#555555",
        fillColor: "yellow",
        highlightStrokeColor: "#555555",
        gradientFX: 0.7,
        gradientFY: 0.3,
        needsRegularUpdate: true
    },

    polygon3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        highlight: false,
        tabindex: -1,
        strokeWidth: 1,
        fillColor: 'none',
        needsRegularUpdate: true


        /**#@-*/
    },

    polyhedron3d: {
        /**#@+
         * @visprop
         */

        fillColorArray: ['white', 'black'],
        needsRegularUpdate: true

        /**#@-*/
    },

    sphere3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        highlight: false,

        strokeWidth: 1,
        strokeColor: '#00ff80',
        fillColor: 'white',
        gradient: 'radial',
        gradientSecondColor: '#00ff80',
        gradientFX: 0.7,
        gradientFY: 0.3,
        fillOpacity: 0.4,
        needsRegularUpdate: true

        /**#@-*/
    },

    surface3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        highlight: false,
        tabindex: -1,
        strokeWidth: 1,

        /**
         * Number of intervals the mesh is divided into in direction of parameter u.
         * @type Number
         * @name ParametricSurface3D#stepsU
         */
        stepsU: 30,

        /**
         * Number of intervals the mesh is divided into in direction of parameter v.
         * @type Number
         * @name ParametricSurface3D#stepsV
         */
        stepsV: 30,

        needsRegularUpdate: true

        /**#@-*/
    },

    text3d: {
        /**#@+
         * @visprop
         */

        withLabel: false,
        needsRegularUpdate: true

        /**#@-*/
    },

    ticks3d: {
        /**#@+
         * @visprop
         */

        visible: true,

        ticksDistance: 1,
        majorHeight: 10,
        minorTicks: 0,
        tickEndings: [0, 1],
        drawLabels: true,
        needsRegularUpdate: true,

        label: {
            visible: true,
            withLabel: false
        }

        /**#@-*/
    },

    vectorfield3d: {
        /**#@+
         * @visprop
         */

        /**
         * Scaling factor of the vectors. This in contrast to slope fields, where this attribute sets the vector to the given length.
         * @name scale
         * @memberOf Vectorfield3D.prototype
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
         * @memberOf Vectorfield3D.prototype
         * @type {Object}
         * @default <tt>{enabled: true, size: 5, angle: Math.PI * 0.125}</tt>
         */
        arrowhead: {
            enabled: true,
            size: 5,
            angle: Math.PI * 0.125
        },
        needsRegularUpdate: true

        /**#@-*/
    },

    view3d: {
        /**#@+
         * @visprop
         */

        needsRegularUpdate: true,

        /**
         * When this option is enabled, elements closer to the screen are drawn
         * over elements further from the screen within the 3D layer.
         *
         * @name View3D#depthOrder
         * @default false
         */
        depthOrder: {
            enabled: true,
            layers: [12, 13]
        },

        /**
         * Choose the projection type to be used: `parallel` or `central`.
         * <ul>
         * <li> `parallel` is parallel projection, also called orthographic projection
         * <li> `central` is central projection, also called perspective projection
         * </ul>
         *
         *
         * @name View3D#projection
         * @type String
         * @default 'parallel'
         */
        projection: 'parallel',

        /**
         * Allow vertical dragging of objects, i.e. in direction of the z-axis.
         * Subobjects are
         * <ul>
         *  <li>enabled: true
         *  <li>key: 'shift'
         * </ul>
         * <p>
         * Possible values for attribute <i>key</i>: 'shift' or 'ctrl'.
         *
         * @name View3D#verticalDrag
         * @type Object
         * @default <tt>{enabled: true, key: 'shift'}</tt>
         */
        verticalDrag: {
            enabled: true,
            key: 'shift'
        },

        /**
         * Specify the user handling of the azimuth.
         * <ul>
         *  <li><tt>pointer</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether pointer navigation is allowed by azimuth.
         *          <li><tt>speed</tt>: Number indicating how many passes the range of the az_slider makes when the cursor crosses the entire board once in the horizontal direction.
         *          <li><tt>outside</tt>: Boolean that specifies whether the pointer navigation is continued when the cursor leaves the board.
         *          <li><tt>button</tt>: Which button of the pointer should be used? (<tt>'-1'</tt> (=no button), <tt>'0'</tt> or <tt>'2'</tt>)
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>keyboard</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard (arrow keys) can be used to navigate the board.
         *          <li><tt>step</tt>: Size of the step per keystroke.
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>continuous</tt>: Boolean that specifies whether the az_slider starts again from the beginning when its end is reached.
         *  <li><tt>slider</tt> attributes of the az_slider ({@link Slider}) with additional
         *      <ul>
         *          <li><tt>min</tt>: Minimum value.
         *          <li><tt>max</tt>: Maximum value.
         *          <li><tt>start</tt>: Start value.
         *      </ul>
         * </ul>
         *
         * @name View3D#az
         * @type Object
         * @default <pre>{
         *      pointer: {enabled: true, speed: 1, outside: true, button: -1, key: 'none'},
         *      keyboard: {enabled: true, step: 10, key: 'ctrl'},
         *      continuous: true,
         *      slider: {
         *          visible: true,
         *          style: 6,
         *          point1: {frozen: true},
         *          point2: {frozen: true},
         *          min: 0,
         *          max: 2 * Math.PI,
         *          start: 1.0
         *      },
         * }</pre>
         * @example
         *     var bound = [-4, 6];
         *     var view = board.create('view3d',
         *         [[-4, -3], [8, 8],
         *         [bound, bound, bound]],
         *         {
         *             projection: 'parallel',
         *             az: {
         *                 slider: {visible: true}
         *             }
         *         });
         *
         * </pre><div id="JXG4c381f21-f043-4419-941d-75f384c026d0" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG4c381f21-f043-4419-941d-75f384c026d0',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *         var bound = [-4, 6];
         *         var view = board.create('view3d',
         *             [[-4, -3], [8, 8],
         *             [bound, bound, bound]],
         *             {
         *                 projection: 'parallel',
         *                 az: {
         *                     slider: {visible: true}
         *                 }
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        az: {
            pointer: {
                enabled: true,
                speed: 1,
                outside: true,
                button: -1,
                key: 'none'
            },
            keyboard: {
                enabled: true,
                step: 10,
                key: 'ctrl'
            },
            continuous: true,
            slider: {
                visible: 'inherit',
                style: 6,
                point1: { frozen: true },
                point2: { frozen: true },
                min: 0,
                max: 2 * Math.PI,
                start: 1.0
            }
        },

        /**
         * Specify the user handling of the elevation.
         * <ul>
         *  <li><tt>pointer</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether pointer navigation is allowed by elevation.
         *          <li><tt>speed</tt>: Number indicating how many passes the range of the el_slider makes when the cursor crosses the entire board once in the horizontal direction.
         *          <li><tt>outside</tt>: Boolean that specifies whether the pointer navigation is continued when the cursor leaves the board.
         *          <li><tt>button</tt>: Which button of the pointer should be used? (<tt>'-1'</tt> (=no button), <tt>'0'</tt> or <tt>'2'</tt>)
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>keyboard</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard (arrow keys) can be used to navigate the board.
         *          <li><tt>step</tt>: Size of the step per keystroke.
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>continuous</tt>: Boolean that specifies whether the el_slider starts again from the beginning when its end is reached.
         *  <li><tt>slider</tt> attributes of the el_slider ({@link Slider}) with additional
         *      <ul>
         *          <li><tt>min</tt>: Minimum value.
         *          <li><tt>max</tt>: Maximum value.
         *          <li><tt>start</tt>: Start value.
         *      </ul>
         * </ul>
         *
         * @name View3D#el
         * @type Object
         * @default <pre>{
         *      pointer: {enabled: true, speed: 1, outside: true, button: -1, key: 'none'},
         *      keyboard: {enabled: true, step: 10, key: 'ctrl'},
         *      continuous: true,
         *      slider: {
         *          visible: true,
         *          style: 6,
         *          point1: {frozen: true},
         *          point2: {frozen: true},
         *          min: 0,
         *          max: 2 * Math.PI,
         *          start: 0.3
         *      },
         * }<pre>
         * @example
         *     var bound = [-4, 6];
         *     var view = board.create('view3d',
         *         [[-4, -3], [8, 8],
         *         [bound, bound, bound]],
         *         {
         *             projection: 'parallel',
         *             el: {
         *                 slider: {visible: true}
         *             }
         *         });
         *
         * </pre><div id="JXG8926f733-c42e-466b-853c-74feb795e879" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG8926f733-c42e-466b-853c-74feb795e879',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *         var bound = [-4, 6];
         *         var view = board.create('view3d',
         *             [[-4, -3], [8, 8],
         *             [bound, bound, bound]],
         *             {
         *                 projection: 'parallel',
         *                 el: {
         *                     slider: {visible: true}
         *                 }
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        el: {
            pointer: {
                enabled: true,
                speed: 1,
                outside: true,
                button: -1,
                key: 'none'
            },
            keyboard: {
                enabled: true,
                step: 10,
                key: 'ctrl'
            },
            continuous: true,
            slider: {
                visible: 'inherit',
                style: 6,
                point1: { frozen: true },
                point2: { frozen: true },
                min: 0,
                max: 2 * Math.PI,
                start: 0.3
            }
        },

        /**
         * Specify the user handling of the bank angle.
         * <ul>
         *  <li><tt>pointer</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether pointer navigation is allowed by elevation.
         *          <li><tt>speed</tt>: Number indicating how many passes the range of the el_slider makes when the cursor crosses the entire board once in the horizontal direction.
         *          <li><tt>outside</tt>: Boolean that specifies whether the pointer navigation is continued when the cursor leaves the board.
         *          <li><tt>button</tt>: Which button of the pointer should be used? (<tt>'-1'</tt> (=no button), <tt>'0'</tt> or <tt>'2'</tt>)
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>keyboard</tt> sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard (arrow keys) can be used to navigate the board.
         *          <li><tt>step</tt>: Size of the step per keystroke.
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *  <li><tt>continuous</tt>: Boolean that specifies whether the el_slider starts again from the beginning when its end is reached.
         *  <li><tt>slider</tt> attributes of the el_slider ({@link Slider}) with additional
         *      <ul>
         *          <li><tt>min</tt>: Minimum value.
         *          <li><tt>max</tt>: Maximum value.
         *          <li><tt>start</tt>: Start value.
         *      </ul>
         * </ul>
         *
         * @name View3D#bank
         * @type Object
         * @default <pre>{
         *      pointer: {enabled: true, speed: 1, outside: true, button: -1, key: 'none'},
         *      keyboard: {enabled: true, step: 10, key: 'ctrl'},
         *      continuous: true,
         *      slider: {
         *          visible: true,
         *          style: 6,
         *          point1: {frozen: true},
         *          point2: {frozen: true},
         *          min: 0,
         *          max: 2 * Math.PI,
         *          start: 0.3
         *      },
         * }<pre>
         * @example
         *     var bound = [-4, 6];
         *     var view = board.create('view3d',
         *         [[-4, -3], [8, 8],
         *         [bound, bound, bound]],
         *         {
         *             projection: 'parallel',
         *             bank: {
         *                 slider: {visible: true}
         *             }
         *         });
         *
         * </pre><div id="JXGb67811ea-c1e3-4d1e-b13c-3537b3436f6c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGb67811ea-c1e3-4d1e-b13c-3537b3436f6c',
         *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
         *         var bound = [-4, 6];
         *         var view = board.create('view3d',
         *             [[-4, -3], [8, 8],
         *             [bound, bound, bound]],
         *             {
         *                 projection: 'parallel',
         *                 bank: {
         *                     slider: {visible: true}
         *                 }
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        bank: {
            pointer: {
                enabled: true,
                speed: 0.08,
                outside: true,
                button: -1,
                key: 'none'
            },
            keyboard: {
                enabled: true,
                step: 10,
                key: 'ctrl'
            },
            continuous: true,
            slider: {
                visible: 'inherit',
                style: 6,
                point1: { frozen: true },
                point2: { frozen: true },
                min: -Math.PI,
                max:  Math.PI,
                start: 0.0
            }
        },

        /**
         * Enable user handling by a virtual trackball.
         * Sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: Boolean that specifies whether pointer navigation is allowed by elevation.
         *          <li><tt>outside</tt>: Boolean that specifies whether the pointer navigation is continued when the cursor leaves the board.
         *          <li><tt>button</tt>: Which button of the pointer should be used? (<tt>'-1'</tt> (=no button), <tt>'0'</tt> or <tt>'2'</tt>)
         *          <li><tt>key</tt>: Should an additional key be pressed? (<tt>'none'</tt>, <tt>'shift'</tt> or <tt>'ctrl'</tt>)
         *      </ul>
         *
         * @name View3D#trackball
         * @type Object
         * @default <pre>{
         *   enabled: false,
         *   outside: true,
         *   button: -1,
         *   key: 'none'
         * }
         * </pre>
         */
        trackball: {
            enabled: false,
            outside: true,
            button: -1,
            key: 'none'
        },

        /**
         * Distance of the camera to the center of the view.
         * If set to 'auto', r will be calculated automatically.
         *
         * @type {Number|String}
         * @default 'auto'
         */
        r: 'auto',

        /**
         * Field of View defines the angle of view (in radians) of the camera, determining how much of the scene is captured within the frame.
         *
         * @type Number
         * @default 2/5*Math.PI
         */
        fov: 1 / 5 * 2 * Math.PI,

        /**
         * Fixed values for the view, which can be changed using keyboard keys `picture-up` and `picture-down`.
         * Array of the form: [[el0, az0, r0], [el1, az1, r1, ...[eln, azn, rn]]
         *
         * @name View3D#values
         * @type Array
         * @default <tt>{[[0, 1.57], [0.78, 0.62], [0, 0], [5.49, 0.62], [4.71, 0], [3.93, 0.62], [3.14, 0], [2.36, 0.62], [1.57, 1.57]]}<tt>
         */
        values: [
            [0, 1.57],
            [0.78, 0.62],
            [0, 0],
            [5.49, 0.62],
            [4.71, 0],
            [3.93, 0.62],
            [3.14, 0],
            [2.36, 0.62],
            [1.57, 1.57]
        ],

        infobox: {
            // strokeColor: '#888888',
            strokeColor: '#000000',
            fontSize: 24,
            useKatex: false,
            useMathjax: false
        },

        /**
         * @class
         * @ignore
         */
        _currentView: -1

        /**#@-*/
    }
});

export default JXG.Options;
