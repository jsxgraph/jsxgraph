JXG.Options = JXG.merge(JXG.Options, {

    device: 'tablet',

    opacityLevel: 0.5,

    sensitive_area: 20,

    lastRegPolCorners: 4,

    lastSliderStart: 0,
    lastSliderEnd: 2,
    lastSliderIni: 1,
    
    board: {
        minimizeReflow: 'all'
    },

    angle: {
        fillColor: '#ddd',
        strokeColor: '#000',
        radius: 1.0, 
        orthotype: 'sectordot'
    },

    axis: {
        ticks: {
            strokeColor: '#666666',
            strokeOpacity: 0.4,
            label: {
                fontSize: 14,
                display: 'internal'
            }
        },
        label: {
            position: 'urt',
            offset: [-15, 30],
            display: 'internal'
        }
    },

    glider : {
        fillColor: '#ff0',
        strokeColor: '#000'
    },

    intersection: {
        fillColor: '#fff'
    },

    point: {
        size: 4,
        fillColor:   '#c00',
        strokeColor: '#000',

        // snap on majorTicks

        snapX: -1,
        snapY: -1
    },

    polygon: {
        fillColor: '#ffff00',
        highlightFillColor: '#ffff00',
        hasInnerPoints: false
    },

    precision: {
        touchMax: Infinity
    },

    segment: {
        label: {
            position: 'bot',
            offsets: [0,-12]
        }
    },

    tapemeasure: {
        point1: {
            snapToPoints: true,
            attractorUnit: 'screen',
            attractorDistance: 20
        },
        point2: {
            snapToPoints: true,
            attractorUnit: 'screen',
            attractorDistance: 20
        }
    },

    text: {
        fontSize: 18
    },

    trunclen: 2

/*
    line: {
        strokeColor: '#f00' // can't see red lines anymore for NOW ...
    },

    slider: {
        point1: { needsRegularUpdate: true },
        point2: { needsRegularUpdate: true },
        baseline: { needsRegularUpdate: true },
        highline: { needsRegularUpdate: true },
        ticks: { needsRegularUpdate: true }
    },

    renderer: 'canvas'
*/
});

if (JXG.isAndroid() || JXG.isApple()) {
    JXG.Options.curve.RDPsmoothing = false;
    JXG.Options.curve.numberPointsHigh = 600;
    JXG.Options.curve.numberPointsLow = 100;
    JXG.Options.curve.doAdvancedPlot = true;
}
