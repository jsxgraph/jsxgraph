JXG.Options = JXG.deepCopy(JXG.Options, {

    renderer: 'canvas',

	angle: {
//		type: 'sector',
//		radius: 0.6,
		fillColor: '#ddd',
		strokeColor: '#000'
	},

    glider : {
        fillColor: '#ff0',
		strokeColor: '#000',
		fillOpacity: 1
    },

    intersection: {
        fillColor: '#fff'
    },

    line: {
        strokeColor: '#f00'
    },

    point: {
        fillColor:   '#c00',
		strokeColor: '#000'
    },

	slider: {
		point1: { needsRegularUpdate: true },
		point2: { needsRegularUpdate: true },
		baseline: { needsRegularUpdate: true },
		highline: { needsRegularUpdate: true },
		ticks: { needsRegularUpdate: true }
	},

	precision: { touchMax: Infinity }
});