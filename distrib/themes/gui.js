JXG.Options = JXG.deepCopy(JXG.Options, {

    axisScaleX: 1,

    axisScaleY: 1,

    device: 'tablet',

    opacityLevel: 0.5,

    sensitive_area: 20,

    lastRegPolCorners: 3,

    angle: {
		fillColor: '#ddd',
		strokeColor: '#000'
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
	}
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
    JXG.Options.curve.doAdvancedPlot = false;
}