/*global JXG:true, define: true*/

import JXG from "./jxg.js";
import Options from "./options.js";

JXG.extend(Options, {
    // infobox: {
    //     strokeColor: 'black'
    // },

    axes3d: {
        /**#@+
         * @visprop
         */

        /**
         * Position of the main axes in a View3D element. Possible values are
         * 'center' and 'border'.
         *
         * @type String
         * @name View3D#axesPosition
         * @default 'center'
         */
        axesPosition: "center", // Possible values: 'center', otherwise: border

        // Main axes

        /**
         * Attributes of the 3D x-axis.
         *
         * @type Line3D
         * @name View3D#xAxis
         */
        xAxis: { visible: true, point2: { name: "x" }, strokeColor: JXG.palette.red },

        /**
         * Attributes of the 3D y-axis.
         *
         * @type Line3D
         * @name View3D#yAxis
         */
        yAxis: { visible: true, point2: { name: "y" }, strokeColor: JXG.palette.green },

        /**
         * Attributes of the 3D z-axis.
         *
         * @type Line3D
         * @name View3D#zAxis
         */
        zAxis: { visible: true, point2: { name: "z" }, strokeColor: JXG.palette.blue },

        // Planes
        /**
         * Attributes of the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRear
         */
        xPlaneRear: { visible: true, layer: 0, mesh3d: { layer: 1 } },
        /**
         * Attributes of the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRear
         */
        yPlaneRear: { visible: true, layer: 0, mesh3d: { layer: 1 } },
        /**
         * Attributes of the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRear
         */
        zPlaneRear: { visible: true, layer: 0, mesh3d: { layer: 1 } },

        /**
         * Attributes of the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFront
         */
        xPlaneFront: { visible: false, layer: 0, mesh3d: { layer: 1 } },
        /**
         * Attributes of the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFront
         */
        yPlaneFront: { visible: false, layer: 0, mesh3d: { layer: 1 } },
        /**
         * Attributes of the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFront
         */
        zPlaneFront: { visible: false, layer: 0, mesh3d: { layer: 1 } },

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
        strokecolor: "black",
        strokeWidth: 1,
        tabindex: null,

        point1: { visible: false, name: "" },
        point2: { visible: false, name: "", label: { visible: true } }
    },

    curve3d: {
        /**#@+
         * @visprop
         */

        highlight: false,
        tabindex: -1,
        strokeWidth: 1,
        numberPointsHigh: 200

        /**#@-*/
    },

    intersectionline3d: {
        point1: { visible: false, name: "" }, // Used in point/point
        point2: { visible: false, name: "" }
    },

    line3d: {
        strokeWidth: 1,
        strokeColor: "black",
        fixed: true,
        tabindex: null,
        gradient: "linear",
        gradientSecondColor: "#ffffff",

        point: { visible: false, name: "" }, // Used in cases of point/direction/range
        point1: { visible: false, name: "" }, // Used in point/point
        point2: { visible: false, name: "" }
    },

    mesh3d: {
        /**#@+
         * @visprop
         */

        strokeWidth: 1,
        strokeColor: "#9a9a9a",
        strokeOpacity: 0.6,
        highlight: false,
        fillColor: "#9a9a9a",
        fillOpacity: 0.1,
        tabindex: null,

        visible: "inherit"
        /**#@-*/
    },

    plane3d: {
        strokeWidth: 0,
        strokeColor: "black",
        strokeOpacity: 1,
        highlight: false,
        tabindex: null,

        gradient: "linear",
        gradientSecondColor: "#ffffff",
        gradientAngle: Math.PI,
        fillColor: "#a7a7a7",
        fillOpacity: 0.6,

        point: { visible: false, name: "", fixed: true }
    },

    point3d: {
        infoboxDigits: "auto",
        strokeWidth: 0,
        gradient: "radial",
        gradientSecondColor: "#555555",
        fillColor: "yellow",
        highlightStrokeColor: "#555555"
    },

    polygon3d: {
        /**#@+
         * @visprop
         */

        highlight: false,
        tabindex: -1,
        strokeWidth: 1,
        fillColor: 'none'

        /**#@-*/
    },

    sphere3d: {
        /**#@+
         * @visprop
         */

        highlight: false,

        strokeWidth: 1,
        strokeColor: '#00ff80',
        fillColor: 'white',
        gradient: 'radial',
        gradientSecondColor: '#00ff80',
        gradientFX: 0.7,
        gradientFY: 0.3,
        fillOpacity: 0.4

        /**#@-*/
    },

    surface3d: {
        /**#@+
         * @visprop
         */

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
        stepsV: 30

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
        }

        /**#@-*/
    },

    view3d: {
        /**#@+
         * @visprop
         */

        needsRegularUpdate: true,

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
         * When this option is enabled, points closer to the screen are drawn
         * over points further from the screen within each layer.
         *
         * @name View3D#depthOrderPoints
         * @default false
         */
        depthOrderPoints: false,

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

        /**
         * @class
         * @ignore
         */
        _currentView: -1

        /**#@-*/
    }
});

export default JXG.Options;
