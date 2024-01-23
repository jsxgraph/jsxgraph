/*global JXG:true, define: true*/

import JXG from "./jxg";
import Options from "./options";

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
        xAxis: { visible: true, point2: { name: "x" } },

        /**
         * Attributes of the 3D y-axis.
         *
         * @type Line3D
         * @name View3D#yAxis
         */
        yAxis: { visible: true, point2: { name: "y" } },

        /**
         * Attributes of the 3D z-axis.
         *
         * @type Line3D
         * @name View3D#zAxis
         */
        zAxis: { visible: true, point2: { name: "z" } },

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
         * @default {enabled: true, key: 'shift'}
         */
        verticalDrag: {
            enabled: true,
            key: 'shift' // ctrl
        }
        /**#@-*/
    }
});

export default JXG.Options;
