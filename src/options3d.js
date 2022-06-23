/*global JXG:true, define: true*/

define([
    'jxg', 'options'
], function (JXG, Options) {

    "use strict";

    JXG.extend(Options, {

        infobox: {
            strokeColor: 'black'
        },

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
            axesPosition: 'center',  // Possible values: 'center', otherwise: border

            // Main axes

            /**
             * Attributes of the 3D x-axis.
             *
             * @type Line3D
             * @name View3D#xAxis
             */
            xAxis: { visible: true, point2: {name: 'x'}},

            /**
             * Attributes of the 3D y-axis.
             *
             * @type Line3D
             * @name View3D#yAxis
             */
            yAxis: { visible: true, point2: {name: 'y'}},

            /**
             * Attributes of the 3D z-axis.
             *
             * @type Line3D
             * @name View3D#zAxis
             */
            zAxis: { visible: true, point2: {name: 'z'}},

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
            xPlaneRearYAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "rear" of the cube.
             * @type Plane3D
             * @name View3D#xPlaneRearZAxis
             */
            xPlaneRearZAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D y-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#xPlaneFrontYAxis
             */
            xPlaneFrontYAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#xPlaneFrontZAxis
             */
            xPlaneFrontZAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},

            /**
             * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
             * @type Plane3D
             * @name View3D#yPlaneRearXAxis
             */
            yPlaneRearXAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
             * @type Plane3D
             * @name View3D#yPlaneRearZAxis
             */
            yPlaneRearZAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#yPlaneFrontXAxis
             */
            yPlaneFrontXAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#yPlaneFrontZAxis
             */
            yPlaneFrontZAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},

            /**
             * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
             * @type Plane3D
             * @name View3D#zPlaneRearXAxis
             */
            zPlaneRearXAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
             * @type Plane3D
             * @name View3D#zPlaneRearYAxis
             */
            zPlaneRearYAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#zPlaneFrontXAxis
             */
            zPlaneFrontXAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1},
            /**
             * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
             * @type Plane3D
             * @name View3D#zPlaneFrontYAxis
             */
            zPlaneFrontYAxis: {visible: 'inherit', strokeColor: '#888888', strokeWidth: 1}

            /**#@-*/
        },

        axis3d: {
            highlight: false,
            strokecolor: 'black',
            strokeWidth: 1,
            tabindex: null,

            point1: { visible: false, name: '' },
            point2: { visible: false, name: '', label: { visible: true } }
        },

        mesh3d: {
            strokeWidth: 1,
            strokeColor: '#9a9a9a',
            strokeOpacity: 0.6,
            highlight: false,
            fillColor: '#9a9a9a',
            fillOpacity: 0.1,
            tabindex: null,

            visible: 'inherit'
        },

        line3d: {
            strokeWidth: 1,
            strokeColor: 'black',
            fixed: true,
            tabindex: null,

            gradient: 'linear',
            gradientSecondColor: '#ffffff',

            point1: {visible: false, name: ''},
            point2: {visible: false, name: ''}
        },

        plane3d: {
            strokeWidth: 0,
            strokeColor: 'black',
            strokeOpacity: 1,
            highlight: false,
            tabindex: null,

            gradient: 'linear',
            gradientSecondColor: '#ffffff',
            gradientAngle: Math.PI,
            fillColor: '#a7a7a7',
            fillOpacity: 0.6
        },

        point3d: {
            strokeWidth: 0,
            gradient: 'radial',
            gradientSecondColor: '#555555',
            fillColor: 'yellow',
            highlightStrokeColor: '#555555'
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
             * @name Surface3D#stepsU
             */
            stepsU: 30,

            /**
             * Number of intervals the mesh is divided into in direction of parameter v.
             * @type Number
             * @name Surface3D#stepsV
             */
             stepsV: 30

            /**#@-*/
        },

        view3d: {
            needsRegularUpdate: true
        }

    });

    return JXG.Options;
});

