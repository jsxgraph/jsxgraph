JXG.Options = JXG.deepCopy(JXG.Options, {

    renderer: 'canvas',

	angle: {
//		type: 'sector',
//		radius: 0.6,
		fillColor: '#ddd',
		strokeColor: 'black'
	},

    glider : {
        fillColor: '#ffff00',
        measureColor: 'orange'
    },

    intersection: {
        fillColor: '#ffffff'
    },

    line: {
        strokeColor: '#ff0000'
    },

    point: {
        fillColor:   '#cc0000',
		strokeColor: '#000000'
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