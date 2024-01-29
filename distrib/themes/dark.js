JXG.Options = JXG.merge(JXG.Options, {
    board: {
        showCopyright: false,
        showNavigation: false,
        showInfobox: true
    },

    navbar: {
        strokeColor: "#bbb",
        fillColor: "none"
    },

    elements: {
        strokeColor: "#6BBA70",
        highlightStrokeColor: "#84e68a",
        fillColor: "none",
        highlightFillColor: "none",
        strokeOpacity: 0.6,
        highlightStrokeOpacity: 1
    },

    point: {
        face: "o",
        size: 4,
        fillColor: "#eeeeee",
        highlightFillColor: "#eeeeee",
        strokeColor: "white",
        highlightStrokeColor: "white",
        showInfobox: "inherit"
    },

    line: {
        strokeColor: "#eee",
        highlightStrokeColor: "white",

        ticks: {
            drawLabels: true,
            drawZero: false,
            insertTicks: false,
            ticksDistance: 1,
            minTicksDistance: 50,
            minorHeight: 4,
            majorHeight: 10,
            minorTicks: 4
        },
        labelOffsets: [10, 10]
    },

    axis: {
        strokeColor: "#aaa",
        highlightStrokeColor: "#aaa"
    },

    circle: {
        fillColor: "none",
        highlightFillColor: "none",
        strokeColor: "#0000ff",
        highlightStrokeColor: "#C3D9FF"
    },

    conic: {
        fillColor: "none",
        highlightFillColor: "none",
        strokeColor: "#0000ff",
        highlightStrokeColor: "#C3D9FF"
    },

    angle: {
        withLabel: true,
        radius: 1.0,
        fillColor: "#FF7F00",
        highlightFillColor: "#FF7F00",
        strokeColor: "#FF7F00",
        textColor: "#0000FF",
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3
    },

    /* special arc options */
    arc: {
        firstArrow: false,
        lastArrow: false,
        fillColor: "none",
        highlightFillColor: "none",
        strokeColor: "#0000ff",
        highlightStrokeColor: "#C3D9FF"
    },

    /* special polygon options */
    polygon: {
        fillColor: "#6BBA70",
        highlightFillColor: "#6BBA70",
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3,
        borders: {
            withLabel: false,
            highlightStrokeColor: "#eee",
            layer: 5
        }
    },

    text: {
        fontSize: 10,
        strokeColor: "gray",
        useASCIIMathML: false,
        useMathJax: false,
        defaultDisplay: "html"
    },

    curve: {
        strokeWidth: 2,
        strokeColor: "#6BBA70"
    },

    slider: {
        withTicks: false,
        fillColor: "#eeeeee",
        highlightFillColor: "#eeeeee",
        strokeColor: "white",
        highlightStrokeColor: "white",
        size: 6,
        face: "<>",
        baseline: {
            needsRegularUpdate: false,
            name: "",
            strokeWidth: 1,
            strokeColor: "#ddd",
            highlightStrokeColor: "#ddd"
        },
        /* line ticks options */
        ticks: {
            needsRegularUpdate: false,
            drawLabels: false,
            drawZero: true,
            insertTicks: true,
            ticksDistance: 1,
            minorHeight: 4, // if <0: full width and height
            majorHeight: 10, // if <0: full width and height
            minorTicks: 0,
            opacity: 1,
            strokeWidth: 2,
            strokeColor: "#ddd"
        },
        highline: {
            strokeWidth: 5,
            name: "",
            strokeColor: "#eee",
            highlightStrokeColor: "#eee"
        },
        label: {
            strokeColor: "#ccc"
        }
    },

    chart: {
        fillOpacity: 0.6
    },

    trunclen: 2
});
