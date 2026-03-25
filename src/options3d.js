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
            visible: false,
            layer: 0,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
        },

        /**
         * Attributes of the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRear
         */
        yPlaneRear: {
            visible: false,
            strokeWidth: 1,
            strokeColor: '#dddddd',
            fillColor: '#dddddd',
            layer: 0,
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
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
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
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
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
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
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
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
            mesh3d: { layer: 1 },

            stepsU: 10,
            stepsV: 10,
            tiling: 'rectangle',
            polyhedron: {
                visible: true,
                strokeWidth: 1,
                shader: {
                    enabled: true,
                    fixed: true,
                    type: 'zIndex',
                    hue: 0,
                    saturation: 0,
                    minlightness: 45,
                    maxLightness: 95
                }
            }
        },

        // Axes on the planes
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRearYAxis
         */
        xPlaneRearYAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneRearZAxis
         */
        xPlaneRearZAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFrontYAxis
         */
        xPlaneFrontYAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the x-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#xPlaneFrontZAxis
         */
        xPlaneFrontZAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRearXAxis
         */
        yPlaneRearXAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneRearZAxis
         */
        yPlaneRearZAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFrontXAxis
         */
        yPlaneFrontXAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D z-axis on the 3D plane orthogonal to the y-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#yPlaneFrontZAxis
         */
        yPlaneFrontZAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },

        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRearXAxis
         */
        zPlaneRearXAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "rear" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneRearYAxis
         */
        zPlaneRearYAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D x-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFrontXAxis
         */
        zPlaneFrontXAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
        },
        /**
         * Attributes of the 3D y-axis on the 3D plane orthogonal to the z-axis at the "front" of the cube.
         * @type Plane3D
         * @name View3D#zPlaneFrontYAxis
         */
        zPlaneFrontYAxis: {
            visible: 'inherit',
            strokeColor: "#888888",
            strokeWidth: 1.5,
            layer: 12
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

        transitionProperties: [],
        layer: 12,
        highlight: false,
        tabindex: null,
        strokeWidth: 1,
        fillColor: JXG.palette.yellow,
        fillOpacity: 0.4,
        needsRegularUpdate: true,

        /**
         * Shading of faces. For this, the HSL color scheme is used.
         * Two types are possible: either by 'angle' or by 'zIndex'.
         * By default (i.e. type:'angle'), the angle between the camera axis and the normal of the
         * face determines the lightness value of the HSL color. Otherwise, the
         * zIndex of the face determines the lightness value of the HSL color.
         * <p>
         * Note that shading needs a lot of computing resources, in particular for
         * SVG rendering. Setting `renderer:'canvas'` will allow to rotate the viewport
         * much faster.
         *
         * @type Object
         * @name Face3D#shader
         * @see View3D#depthOrder
         * @default <pre>{
         *  enabled: false,
         *  type: 'angle',   // 'angle', otherwise zIndex
         *  hue: 60,         // yellow
         *  saturation: 90,
         *  minLightness: 30,
         *  maxLightness: 90
         * }</pre>
         *
         * @example
         *         var view = board.create(
         *             'view3d',
         *             [[-5, -3], [8, 8],
         *             [[-3, 3], [-3, 3], [-3, 3]]],
         *             {
         *                 projection: 'central',
         *                 trackball: { enabled: true },
         *                 depthOrder: {
         *                     enabled: true
         *                 },
         *                 xPlaneRear: { visible: false },
         *                 yPlaneRear: { visible: false },
         *                 zPlaneRear: { fillOpacity: 0.2, visible: true }
         *             }
         *         );
         *
         *         let rho = 1.6180339887;
         *         let vertexList = [
         *             [0, -1, -rho], [0, +1, -rho], [0, -1, rho], [0, +1, rho],
         *             [1, rho, 0], [-1, rho, 0], [1, -rho, 0], [-1, -rho, 0],
         *             [-rho, 0, 1], [-rho, 0, -1], [rho, 0, 1], [rho, 0, -1]
         *         ];
         *         let faceArray = [
         *             [4, 1, 11],
         *             [11, 1, 0],
         *             [6, 11, 0],
         *             [0, 1, 9],
         *             [11, 10, 4],
         *             [9, 1, 5],
         *             [8, 9, 5],
         *             [5, 3, 8],
         *             [6, 10, 11],
         *             [2, 3, 10],
         *             [2, 10, 6],
         *             [8, 3, 2],
         *             [3, 4, 10],
         *             [7, 8, 2],
         *             [9, 8, 7],
         *             [0, 9, 7],
         *             [4, 3, 5],
         *             [5, 1, 4],
         *             [0, 7, 6],
         *             [7, 2, 6]
         *         ];
         *         var ico = view.create('polyhedron3d', [vertexList, faceArray], {
         *             fillColorArray: [],
         *             fillOpacity: 1,
         *             strokeWidth: 0.1,
         *             layer: 12,
         *             shader: {
         *                 enabled: true,
         *                 type: 'angle',
         *                 hue: 0,
         *                 saturation: 90,
         *                 minlightness: 60,
         *                 maxLightness: 80
         *             }
         *         });
         *
         * </pre><div id="JXGbf32b040-affb-4e03-a05b-abfe953f614d" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGbf32b040-affb-4e03-a05b-abfe953f614d',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false,
         *                pan: {enabled: false}, zoom: {enabled: false}});
         *             var view = board.create(
         *                 'view3d',
         *                 [[-5, -3], [8, 8],
         *                 [[-3, 3], [-3, 3], [-3, 3]]],
         *                 {
         *                     projection: 'central',
         *                     trackball: { enabled: true },
         *                     depthOrder: {
         *                         enabled: true
         *                     },
         *                     xPlaneRear: { visible: false },
         *                     yPlaneRear: { visible: false },
         *                     zPlaneRear: { fillOpacity: 0.2, visible: true }
         *                 }
         *             );
         *
         *             let rho = 1.6180339887;
         *             let vertexList = [
         *                 [0, -1, -rho], [0, +1, -rho], [0, -1, rho], [0, +1, rho],
         *                 [1, rho, 0], [-1, rho, 0], [1, -rho, 0], [-1, -rho, 0],
         *                 [-rho, 0, 1], [-rho, 0, -1], [rho, 0, 1], [rho, 0, -1]
         *             ];
         *             let faceArray = [
         *                 [4, 1, 11],
         *                 [11, 1, 0],
         *                 [6, 11, 0],
         *                 [0, 1, 9],
         *                 [11, 10, 4],
         *                 [9, 1, 5],
         *                 [8, 9, 5],
         *                 [5, 3, 8],
         *                 [6, 10, 11],
         *                 [2, 3, 10],
         *                 [2, 10, 6],
         *                 [8, 3, 2],
         *                 [3, 4, 10],
         *                 [7, 8, 2],
         *                 [9, 8, 7],
         *                 [0, 9, 7],
         *                 [4, 3, 5],
         *                 [5, 1, 4],
         *                 [0, 7, 6],
         *                 [7, 2, 6]
         *             ];
         *             var ico = view.create('polyhedron3d', [vertexList, faceArray], {
         *                 fillColorArray: [],
         *                 fillOpacity: 1,
         *                 strokeWidth: 0.1,
         *                 layer: 12,
         *                 shader: {
         *                     enabled: true,
         *                     type: 'angle',
         *                     hue: 0,
         *                     saturation: 90,
         *                     minlightness: 60,
         *                     maxLightness: 80
         *                 }
         *             });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        shader: {
            enabled: false,
            fixed: false,    // If false, do shading during rotation of viewport
            type: 'angle',   // 'angle', otherwise zIndex
            hue: 60,         // yellow
            saturation: 90,
            minLightness: 30,
            maxLightness: 90,

            light: {
                type: 1,// 1: lighting==camera,
                        // 2: Fixed: angle(light, object),
                        // 3: Fixed: angle(light, camera) (default)
                az: -45, // TODO use radians, ignored for type==1
                el: 20,  // TODO use radians, ignored for type==1
                bank: 0, // TODO use radians, ignored for type==1, type==3
                dir: -1  // -1, 0 (use abs), 1: Default: -1
            }
        }

        /**#@-*/
    },

    intersectionline3d: {
        point1: { visible: false, name: "" }, // Used in point/point
        point2: { visible: false, name: "" }
    },

    line3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        strokeWidth: 1,
        strokeColor: "black",
        fixed: true,
        tabindex: null,
        // gradient: "linear",
        // gradientSecondColor: "#ffffff",
        needsRegularUpdate: true,

        /**
         * Attributes of the defining point in case the line is defined by [point, vector, [range]]
         * @type Point3D
         * @name Line3D#point
         * @default <pre>visible: false, name: ""</pre>
         */
        point: { visible: false, name: "" }, // Used in cases of point/direction/range

        /**
         * Attributes of the first point in case the line is defined by [point, point].
         * @type Point3D
         * @name Line3D#point1
         * @default <pre>visible: false, name: ""</pre>
         */
        point1: { visible: false, name: "" }, // Used in point/point

        /**
         * Attributes of the second point in case the line is defined by [point, point].
         * @type Point3D
         * @name Line3D#point2
         * @default <pre>visible: false, name: ""</pre>
         */
        point2: { visible: false, name: "" },

        /**
         * If the 3D line is defined by two points and if this attribute is true,
         * the 3D line stretches infinitely in direction of its first point.
         * Otherwise it ends at point1.
         *
         * @name Line3D#straightFirst
         * @see Line3D#straightLast
         * @type Boolean
         * @default false
         */
        straightFirst: false,


        /**
         * If the 3D line is defined by two points and if this attribute is true,
         * the 3D line stretches infinitely in direction of its second point.
         * Otherwise it ends at point2.
         *
         * @name Line3D#straightLast
         * @see Line3D#straightFirst
         * @type Boolean
         * @default false
         */
        straightLast: false

        /**#@-*/
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

        /**
         * Step width of the mesh in the direction of the first spanning vector.
         * @type {Number}
         * @name Mesh3D#stepWidthU
         * @default 1
         *
         */
        stepWidthU: 1,

        /**
         * Step width of the mesh in the direction of the second spanning vector.
         *
         * @type {Number}
         * @name Mesh3D#stepWidthV
         * @default 1
         *
         */
        stepWidthV: 1

        /**#@-*/
    },

    plane3d: {
        /**#@+
         * @visprop
         */

        layer: 12,
        strokeWidth: 1,
        strokeColor: "black",
        strokeOpacity: 1,
        highlight: false,
        tabindex: null,
        needsRegularUpdate: true,
        visible: true,

        gradient: "linear",
        gradientSecondColor: "#ffffff",
        gradientAngle: Math.PI,
        fillColor: "#bbbbbb",
        fillOpacity: 0.3,

        /**
         * Optional 3D mesh of a finite plane.
         * It is not available if the plane is infinite (at initialization time) in any direction.
         *
         * @type Mesh3D
         * @name Plane3D#mesh3d
         * @default see {@link Mesh3D}
         */
        mesh3d: {
            visible: 'inherit'
        },

        stepsU: 6,
        stepsV: 6,
        polyhedron: {
            layer: 12,
            visible: 'inherit',
            strokeWidth: 0.4,
            strokeOpacity: 0.7,
            strokeColor: '#cccccc',
            fillOpacity: 0.30,
            // fillColorArray: ['none', '#e7e7e7']
            fillColorArray: ['#e7e7e7']
        },

        /**
         * If the second parameter and the third parameter are given as arrays or functions and threePoints:true
         * then the second and third parameter are interpreted as point coordinates and not as directions, i.e.
         * the plane is defined by three points.
         *
         * @name Plane3D#threePoints
         * @type Boolean
         * @default false
         */
        threePoints: false,

        /**
         * Attributes of the defining point in case the plane is defined by [point, direction1, direction2, [range1, [range2]]].
         * @type Point3D
         * @name Plane3D#point
         * @default <pre>visible: false, name: "", fixed: true</pre>
         */
        point: { visible: false, name: "", fixed: true },

        /**
         * Attributes of the first point in case the plane is defined by [point, point, point].
         * @type Point3D
         * @name Plane3D#point1
         * @default <pre>visible: false, name: ""</pre>
         */
        point1: { visible: false, name: "" }, // Used in point/point/point

        /**
         * Attributes of the second point in case the plane is defined by [point, point, point].
         * @type Point3D
         * @name Plane3D#point2
         * @default <pre>visible: false, name: ""</pre>
         */
        point2: { visible: false, name: "" }, // Used in point/point/point

        /**
         * Attributes of the third point in case the plane is defined by [point, point, point].
         * @type Point3D
         * @name Plane3D#point3
         * @default <pre>visible: false, name: ""</pre>
         */
        point3: { visible: false, name: "" } // Used in point/point/point

        /**#@-*/
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

        /**
         * Color array to define fill colors of faces cyclically.
         * Alternatively, the fill color can be defined for each face individually.
         *
         * @type Array
         * @name Polyhedron3D#fillColorArray
         * @default ['white', 'black']
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
         * Description of how the mesh is visualized. Possible values are 'wireframe', 'rectangle', 'triangle'.
         * In case of `tiling:'wireframe'`, a rectangular mesh is displayed, the number of steps is determined by
         * the attributes `stepsU` and `stepsV`. Further, the attributes `strokeWidth` and `strokeColor`, ...
         * determine the style of the mesh.
         * <p>
         * In case of `tiling:'triangle'` or `tiling:'rectangle'` a polyhedron3d element is displayed, using the
         * attributes `stepsU` and `stepsV`. In case of `triangle`, equilateral triangles are created if stepsV==0.
         * <p>
         * All other attributes of the polyhedron3d have to be set inside of `polyhedron`, including `strokeWidth`
         * and `strokeColor`. The wireframe settings for these attributes are ignored.
         * <p>
         * At the time being (v1.13+), this attribute is immutable.
         *
         * @type String
         * @name ParametricSurface3D#tiling
         * @default 'wireframe'
         * @see ParametricSurface3D#polyhedron
         *
         * @example
         *
         * var view = board.create('view3d',
         *     [
         *         [-6, -3], [8, 8],
         *         [[-5, 5], [-5, 5], [-5, 5]]
         *     ],
         *     {
         *         xPlaneRear: {visible: false},
         *         yPlaneRear: {visible: false},
         *     });
         *
         * // Function F to be plotted
         * var F = (x, y) => Math.cos(x * y / 4);
         *
         * // 3D surface
         * var c = view.create('functiongraph3d', [
         *     F,
         *     [-5, 5],
         *     [-5, 5],
         * ], {
         *     strokeWidth: 0.5,
         *     stepsU: 70,
         *     stepsV: 70,
         *     tiling:'wireframe'
         * });
         *
         * </pre><div id="JXG87646dd4-9fe5-4c21-8734-089abc612515" class="jxgbox" style="width: 500px; height: 500px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG87646dd4-9fe5-4c21-8734-089abc612515',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
         *     var box = [-5, 5];
         *     var view = board.create('view3d',
         *         [
         *             [-6, -3], [8, 8],
         *             [box, box, box]
         *         ],
         *         {
         *             xPlaneRear: {visible: false},
         *             yPlaneRear: {visible: false},
         *         });
         *
         *     // Function F to be plotted
         *     var F = (x, y) => Math.cos(x * y / 4);
         *
         *     // 3D surface
         *     var c = view.create('functiongraph3d', [
         *         F,
         *         box,
         *         box
         *     ], {
         *         strokeWidth: 0.5,
         *         stepsU: 50,
         *         stepsV: 50,
         *         tiling: 'wireframe'
         *     });
         *     })();
         *
         * </script><pre>
         *
         * @example
         *
         * var view = board.create('view3d',
         *     [
         *         [-6, -3], [8, 8],
         *         [[-5, 5], [-5, 5], [-5, 5]]
         *     ],
         *     {
         *         xPlaneRear: {visible: false},
         *         yPlaneRear: {visible: false},
         *     });
         *
         * // Function F to be plotted
         * var F = (x, y) => Math.cos(x * y / 4);
         *
         * // 3D surface
         * var c = view.create('functiongraph3d', [
         *     F,
         *     [-5, 5],
         *     [-5, 5],
         * ], {
         *     stepsU: 15,
         *     stepsV: 15,
         *     tiling:'triangle'
         * });
         *
         * </pre><div id="JXG6591ae99-1319-4cd7-b035-465484ad27d2" class="jxgbox" style="width: 500px; height: 500px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG6591ae99-1319-4cd7-b035-465484ad27d2',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
         *     var box = [-5, 5];
         *     var view = board.create('view3d',
         *         [
         *             [-6, -3], [8, 8],
         *             [box, box, box]
         *         ],
         *         {
         *             xPlaneRear: {visible: false},
         *             yPlaneRear: {visible: false},
         *         });
         *
         *     // Function F to be plotted
         *     var F = (x, y) => Math.cos(x * y / 4);
         *
         *     // 3D surface
         *     var c = view.create('functiongraph3d', [
         *         F,
         *         box,
         *         box
         *     ], {
         *         stepsU: 15,
         *         stepsV: 15,
         *         tiling: 'triangle'
         *     });
         *     })();
         *
         * </script><pre>
         *
         * @example
         *
         * var view = board.create('view3d',
         *     [
         *         [-6, -3], [8, 8],
         *         [[-5, 5], [-5, 5], [-5, 5]]
         *     ],
         *     {
         *         xPlaneRear: {visible: false},
         *         yPlaneRear: {visible: false},
         *     });
         *
         * // Function F to be plotted
         * var F = (x, y) => Math.cos(x * y / 4);
         *
         * // 3D surface
         * var c = view.create('functiongraph3d', [
         *     F,
         *     [-5, 5],
         *     [-5, 5],
         * ], {
         *     stepsU: 15,
         *     stepsV: 15,
         *     tiling: 'rectangle'
         * });
         *
         * </pre><div id="JXG6bebc69d-95fd-4923-9689-29461bb21471" class="jxgbox" style="width: 500px; height: 500px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG6bebc69d-95fd-4923-9689-29461bb21471',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
         *     var box = [-5, 5];
         *     var view = board.create('view3d',
         *         [
         *             [-6, -3], [8, 8],
         *             [box, box, box]
         *         ],
         *         {
         *             xPlaneRear: {visible: false},
         *             yPlaneRear: {visible: false},
         *         });
         *
         *     // Function F to be plotted
         *     var F = (x, y) => Math.cos(x * y / 4);
         *
         *     // 3D surface
         *     var c = view.create('functiongraph3d', [
         *         F,
         *         box,
         *         box
         *     ], {
         *         stepsU: 15,
         *         stepsV: 15,
         *         tiling: 'rectangle'
         *     });
         *     })();
         *
         * </script><pre>
         */
        tiling: 'wireframe',

        /**
         * Attributes for the polyhedron3d in case `style='triangle'` or `style='rectangle'`.
         * Specifications are e.g.
         * <ul>
         *  <li>strokewidth: 0
         *  <li>fillColorArray: ['white', JXG.palette.blue]
         * </ul>
         * @type {object}
         * @name ParametricSurface3D#polyhedron
         * @default <pre>{strokewidth: 0, fillColorArray: ['white', 'black'] }</pre>
         * @see ParametricSurface3D#style
         *
         * @example
         * var F = (x, y) => Math.cos(x * y / 4);
         *
         * var view = board.create('view3d', [
         *    [-6, -3], [8, 8],
         *    [[-5, 5], [-5, 5], [-5, 5]]
         *  ], {
         *    xPlaneRear: {visible: false},
         *    yPlaneRear: {visible: false},
         *    depthOrder: {enabled: true}
         *  });
         *
         * // 3D surface
         * var c = view.create('functiongraph3d', [F, [-5, 5], [-5, 5]], {
         *    strokeWidth: 1, // ignored
         *    stepsU: 10,
         *    stepsV: 10,
         *    tiling: 'triangle',
         *    polyhedron: {
         *        layer: 12,
         *        strokeWidth: 0, // has priority
         *        fillOpacity: 0.9,
         *        shader: {
         *            enabled: true,
         *            hue: 20,
         *            saturation: 90,
         *            minlightness: 50,
         *            maxLightness: 80
         *        }
         *    }
         * });
         *
         * </pre><div id="JXG8123a727-adef-4c10-83e6-d4f5e2203f68" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG8123a727-adef-4c10-83e6-d4f5e2203f68',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
         *
         *     var F = (x, y) => Math.cos(x * y / 4);
         *     var box = [-5, 5];
         *     var view = board.create('view3d',
         *      [
         *      [-6, -3], [8, 8],
         *      [box, box, box]
         *            ],
         *             {
         *               xPlaneRear: {visible: false},
         *               yPlaneRear: {visible: false},
         *               depthOrder: {enabled: true}
         *     });
         *
         *     // 3D surface
         *     var c = view.create('functiongraph3d', [F, box, box], {
         *       strokeWidth: 0.5,
         *       stepsU: 10,
         *       stepsV: 10,
         *       tiling: 'triangle',
         *       polyhedron: {
         *           layer: 12,
         *           strokeWidth: 0,
         *           fillOpacity: 0.9,
         *           shader: {
         *               enabled: true,
         *               hue: 20,
         *               saturation: 90,
         *               minlightness: 50,
         *               maxLightness: 80
         *           }
         *       }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *
         * var view = board.create('view3d',
         *     [
         *         [-6, -3], [8, 8],
         *         [[-5, 5], [-5, 5], [-5, 5]]
         *     ], {
         *         xPlaneRear: {visible: false},
         *         yPlaneRear: {visible: false}
         *     });
         *
         * // Function F to be plotted
         * var F = (x, y) => y - x;
         *
         * // 3D surface
         * var c = view.create('functiongraph3d', [F, [-5, 5], [-5, 5]], {
         *     stepsU: 9,
         *     stepsV: 9,
         *     tiling: 'rectangle'
         * });
         *
         * </pre><div id="JXG87646dd4-9fe5-4c21-8734-089abc612519" class="jxgbox" style="width: 500px; height: 500px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG87646dd4-9fe5-4c21-8734-089abc612519',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, pan: {enabled: false}, showcopyright: false, shownavigation: false});
         *     var box = [-5, 5];
         *     var view = board.create('view3d',
         *         [
         *             [-6, -3], [8, 8],
         *             [box, box, box]
         *         ], {
         *             xPlaneRear: {visible: false},
         *             yPlaneRear: {visible: false}
         *         });
         *
         *     // Function F to be plotted
         *     var F = (x, y) => y - x;
         *
         *     // 3D surface
         *     var c = view.create('functiongraph3d', [F, box, box], {
         *         stepsU: 9,
         *         stepsV: 9,
         *         tiling: 'rectangle'
         *     });
         *     })();
         * </script><pre>
         */
        polyhedron: {
            strokeWidth: 0,
            fillColorArray: ['white', JXG.palette.blue]
        },

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
         * When this attribute is enabled, elements closer to the screen are drawn
         * over elements further from the screen within the 3D layer. This affects
         * all elements which are in one of the layer specified in the sub-attribute 'layers'.
         * <p>
         * For each layer this depth ordering is done independently.
         * Sub-attributes:
         *      <ul>
         *          <li><tt>enabled</tt>: false/true
         *          <li><tt>layers</tt>: [12, 13]
         *      </ul>
         *
         * @name View3D#depthOrder
         * @type Object
         * @default <pre>{
         *   enabled: false,
         *   layers: [12, 13]
         * }
         * </pre>
         */
        depthOrder: {
            enabled: false,
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
         * @example
         *         var bound = [-5, 5];
         *         var view = board.create('view3d',
         *             [[-6, -3], [8, 8],
         *             [bound, bound, bound]],
         *             {
         *                 projection: 'parallel'
         *             });
         *
         * </pre><div id="JXG80d81b13-c604-4841-bdf6-62996440088a" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG80d81b13-c604-4841-bdf6-62996440088a',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *             var bound = [-5, 5];
         *             var view = board.create('view3d',
         *                 [[-6, -3], [8, 8],
         *                 [bound, bound, bound]],
         *                 {
         *                     projection: 'parallel'
         *                 });
         *
         *     })();
         *
         * </script><pre>
         *
         * @example
         *         var bound = [-5, 5];
         *         var view = board.create('view3d',
         *             [[-6, -3], [8, 8],
         *             [bound, bound, bound]],
         *             {
         *                 projection: 'central'
         *             });
         *
         * </pre><div id="JXGdb7b7c99-631c-41d0-99bf-c0a8d0138218" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGdb7b7c99-631c-41d0-99bf-c0a8d0138218',
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
         *             var bound = [-5, 5];
         *             var view = board.create('view3d',
         *                 [[-6, -3], [8, 8],
         *                 [bound, bound, bound]],
         *                 {
         *                     projection: 'central'
         *                 });
         *     })();
         *
         * </script><pre>
         *
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
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard (left/right arrow keys) can be used to navigate the board.
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
         *      'min' and 'max' are used only if trackball is not enabled.
         *     Additionally, the attributes 'slider.point1.pos' and 'slider.point2.pos' control the position of the slider. Possible
         *     values are 'auto' or an array [x, y] of length 2 for the position in user coordinates (or a function returning such an array).
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
         *          point1: {
         *              pos: 'auto',
         *              frozen: false
         *          },
         *          point2: {
         *              pos: 'auto',
         *              frozen: false
         *          },
         *          min: 0,
         *          max: 2 * Math.PI,
         *          start: 1.0
         *      },
         * }</pre>
         *
         * @example
         *     var bound = [-4, 6];
         *     var view = board.create('view3d',
         *         [[-4, -3], [8, 8],
         *         [bound, bound, bound]],
         *         {
         *             projection: 'parallel',
         *             az: {
         *                 slider: {visible: true, start: 0.75 * Math.PI}
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
         *                     slider: {visible: true, start: 0.75 * Math.PI}
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
                point1: {
                    pos: 'auto',
                    frozen: false
                },
                point2: {
                    pos: 'auto',
                    frozen: false
                },
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
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard (up/down arrow keys) can be used to navigate the board.
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
         *     'min' and 'max' are used only if trackball is not enabled.
         *     Additionally, the attributes 'slider.point1.pos' and 'slider.point2.pos' control the position of the slider. Possible
         *     values are 'auto' or an array [x, y] of length 2 for the position in user coordinates (or a function returning such an array).
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
         *          point1: {
         *              pos: 'auto',
         *              frozen: false
         *          },
         *          point2: {
         *              pos: 'auto',
         *              frozen: false
         *          },
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
                point1: {
                    frozen: false,
                    pos: 'auto'
                },
                point2: {
                    frozen: false,
                    pos: 'auto'
                },
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
         *          <li><tt>enabled</tt>: Boolean that specifies whether the keyboard ('<', '>' keys) can be used to navigate the board.
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
         *      'min' and 'max' are used only if trackball is not enabled.
         *     Additionally, the attributes 'slider.point1.pos' and 'slider.point2.pos' control the position of the slider. Possible
         *     values are 'auto' or an array [x, y] of length 2 for the position in user coordinates (or a function returning such an array).
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
         *          point1: {
         *              pos: 'auto',
         *              frozen: false
         *          },
         *          point2: {
         *              pos: 'auto',
         *              frozen: false
         *          },
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
         *             {boundingbox: [-8, 8, 8,-8], axis: false, showcopyright: false, shownavigation: false});
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
                point1: {
                    frozen: false,
                    pos: 'auto'
                },
                point2: {
                    frozen: false,
                    pos: 'auto'
                },
                min: -Math.PI,
                max:  Math.PI,
                start: 0.0
            }
        },

        /**
         * Enable user handling by a virtual trackball that allows to move the 3D scene
         * with 3 degrees of freedom. If not enabled, direct user dragging (i.e. in the JSXGraph board, not manipulating the sliders) will only have
         * two degrees of freedom. This means, the z-axis will always be projected to a vertical 2D line.
         * <p>
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
            fontSize: 16,
            useKatex: false,
            useMathjax: false,
            intl: {
                enabled: true,
                options: {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3
                }
            }
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
