JXG.Options = JXG.deepCopy(JXG.Options, {
/*
	slider: {
		point1: { needsRegularUpdate: true },
		point2: { needsRegularUpdate: true },
		baseline: { needsRegularUpdate: true },
		highline: { needsRegularUpdate: true },
		ticks: { needsRegularUpdate: true }
	},
*/

	point: {
		size: 4,
		fillColor:   '#c00',
		strokeColor: '#000'
	},

    glider : {
        fillColor: '#ff0',
		strokeColor: '#000'
    },

	angle: {
		fillColor: '#ddd',
		strokeColor: '#000'
	},

    intersection: {
        fillColor: '#fff'
    },

    line: {
        strokeColor: '#f00'
    },

	precision: { touchMax: Infinity },

    segment: {
        label: {
            position: 'bot',
            offsets: [0,-12]
        }
    }

	//, renderer: 'canvas' // the draftcurves look very ugly on windows ...
});
