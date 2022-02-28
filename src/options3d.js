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
            position: 'center',
            xy: { visible: true, layer: 0, grid3d: { layer: 1 } },
            xz: { visible: true, layer: 0, grid3d: { layer: 1 } },
            yz: { visible: true, layer: 0, grid3d: { layer: 1 } },
            xyAxes: {visible: true, strokeColor: '#888888'},
            xzAxes: {visible: true, strokeColor: '#888888'},
            yzAxes: {visible: true, strokeColor: '#888888'}
        },

        axis3d: {
            highlight: false,
            strokecolor: 'black',
            strokeWidth: 1,
            tabindex: null,

            point1: { visible: false, name: '' },
            point2: { visible: false, name: '', label: { visible: true } }
        },

        grid3d: {
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
            highlight: false,
            tabindex: -1,
            strokeWidth: 1,
            stepsU: 30,
            stepsV: 30
        },

        view3d: {
            needsRegularUpdate: true
        }

    });

    return JXG.Options;
});

