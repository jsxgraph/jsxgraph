JXG.Options = JXG.merge(JXG.Options, {

    device: 'tablet',

    opacityLevel: 0.5,

    sensitive_area: 20,

    lastRegPolCorners: 4,

    lastSliderStart: -10,
    lastSliderEnd: 10,
    lastSliderIni: 1,
    
    board: {
        minimizeReflow: 'all'
    },

    angle: {
        fillColor: '#ddd',
        strokeColor: '#000',
        strokeWidth: 1,
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
    
    circle: {
        strokeOpacity: 0.9,
        strokeWidth: 3
    },

    curve: {
        strokeWidth: 3,
        strokeOpacity: 0.9
    },
    
    glider : {
        fillColor: '#ff0',
        strokeColor: '#000',
        opacity: 1
    },

    intersection: {
        fillColor: '#fff',
        opacity: 1
    },

    line: {
        //highlightStrokeOpacity: 0.3,
        strokeOpacity: 0.9,
        strokeWidth: 3
    },
    
    point: {
        size: 4,
        fillColor:   '#c00',
        strokeColor: '#c00',
        strokeOpacity: 0.9,
        //fillOpacity: 0.7,
        highlightFillColor:   '#c00',
        highlightStrokeColor: '#c00',
        highlightFillOpacity: 0.4,
        highlightStrokeOpacity: 0.4,

        // snap on majorTicks

        snapX: -1,
        snapY: -1
    },

    polygon: {
        fillColor: '#ffff00',
        highlightFillColor: '#ffff00',
        hasInnerPoints: false,
        
        borders: {
            strokeColor: '#444444',
            strokeOpacity: 0.9,
            strokeWidth: 2
        }
    },

    precision: {
        touchMax: Infinity
    },
    
    sector: {
        strokeWidth: 0,
        highlightStrokeWidth: 0,
        arc: {
            visible: true,
            fillColor: 'none'
        }
    },
        
    segment: {
        label: {
            position: 'bot',
            offsets: [0,-12]
        }
    },

    slider: {
        highlightFillColor: '#ffffff',
        strokeOpacity: 0.5,
        strokeColor: '#444444',
        
        face: '[]',
        point1: { needsRegularUpdate: true },
        point2: { needsRegularUpdate: true },
        ticks: { tickEndings: [0, 1],
            minTicksDistance: 15,
            strokeColor: '#444444',
            strokeOpacity: 0.5,
            highlightStrokeColor: '#444444',
            strokeOpacity: 0.5,
            highlightStrokeOpacity: 0.5,
            needsRegularUpdate: true
            },
        baseline: {
            strokeColor: '#444444',
            highlightStrokeColor: '#444444',
            strokeOpacity: 0.5,
            highlightStrokeOpacity: 0.5,
            needsRegularUpdate: true
        },
        highline: {
            strokeColor: '#444444',
            highlightStrokeColor: '#444444',
            strokeOpacity: 0.5,
            highlightStrokeOpacity: 0.5,
            needsRegularUpdate: true
        }

    },

    tapemeasure: {
        strokeColor: '#000000',
        strokeWidth: 2,
        highlightStrokeColor: '#000000',
        strokeOpacity: 0.7,
        
        point1: {
            strokeOpacity: 0.7,
            snapToPoints: true,
            attractorUnit: 'screen',
            attractorDistance: 20
        },
        point2: {
            strokeOpacity: 0.7,
            snapToPoints: true,
            attractorUnit: 'screen',
            attractorDistance: 20
        },
        ticks: {
            strokeOpacity: 0.7
        }
    },

    text: {
        fontSize: 18,
        strokeColor: '#222',
        highlightStrokeColor: '#222',
        strokeOpacity: 1,
        highlightStrokeOpacity: 0.66666
    },

    trunclen: 2

/*
    line: {
        strokeColor: '#f00' // can't see red lines anymore for NOW ...
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
