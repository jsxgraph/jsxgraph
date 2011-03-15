JXG.extend(JXG.Options, {
    showCopyright : false,
    showNavigation : true,
    takeSizeFromFile : false,
    renderer: 'svg',
    takeFirst : false,

    grid : {
        hasGrid : false,
        gridX : 1,
        gridY : 1,
        gridColor : '#C0C0C0',
        gridOpacity : '0.5',
        gridDash : true,

        snapToGrid : false,
        snapSizeX : 2,
        snapSizeY : 2
    },

    navbar: {
        strokeColor: '#bbb',
        fillColor: 'none',
        padding: '2px',
        position: 'absolute',
        fontSize: '10px',
        cursor: 'pointer',
        zIndex: '100',
        right: '5px',
        bottom: '5px'
    },

    zoom : {
        factor : 1.25
    },

    elements : {
        strokeColor: '#6BBA70',
        highlightStrokeColor: '#84e68a',
        fillColor: 'none',
        highlightFillColor: 'none',

        strokeOpacity: 1,
        highlightStrokeOpacity: 1,
        fillOpacity: 1,
        highlightFillOpacity: 1,
        strokeWidth: 2,
        highlightStrokeWidth: 2,         
        withLabel: false,
        fixed: false,
        frozen: false,
        visible: true,
        layer: 9,
        dash: 0,
        shadow: false,
        trace: false,
        needsRegularUpdate: true,           

        draft : {
            draft : false,
            color : '#565656',
            opacity : 0.8,
            strokeWidth : '1px'
        }
    },

    point : {
    	withLabel: true,
        face : 'o',
        size : 3,
        fillColor : '#B02B2C',
        highlightFillColor : '#db3637',
        strokeWidth: '2px',
        strokeColor : '#B02B2C',
        highlightStrokeColor : '#db3637',
        zoom: false,
        showInfobox: true
    },

    line : {
        firstArrow : false,
        lastArrow : false,
        straightFirst : true,
        straightLast : true,
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#4096EE',
        highlightStrokeColor : '#45a1ff',
        withTicks: false,
        point1 : {                  // Default values for point1 if created by line
            visible: false, 
            withLabel: false, 
            fixed:true,
            name: ''
        },
        point2 : {                  // Default values for point2 if created by line
            visible: false, 
            withLabel: false, 
            fixed: true,
            name: ''
        },

        ticks : {
            drawLabels : true,
            drawZero : false,
            insertTicks : false,
            minTicksDistance : 50,
            maxTicksDistance : 300,
            minorHeight : 4,
            majorHeight : 10,
            minorTicks : 4,
            defaultDistance : 1
        },
        labelOffsets: [10,10]
    },

    axis : {
        needsRegularUpdate : false,         // Axes only updated after zooming and moving of the origin.
        strokeWidth: 1,
        strokeColor : '#aaa',
        highlightStrokeColor : '#aaa',
        withTicks: true,
        straightFirst : true,
        straightLast : true,
        lastArrow: true,
        withLabel: false, 
        /* line ticks options */
        ticks : {
            needsRegularUpdate : false,            
            strokeWidth: 1,
            strokeColor : '#666666',
            highlightStrokeColor : '#888888',
            drawLabels : true,
            drawZero : true,
            insertTicks : false,
            minTicksDistance : 50,
            maxTicksDistance : 300,
            minorHeight : 4,          // if <0: full width and height
            majorHeight : -1,         // if <0: full width and height
            minorTicks : 4,
            defaultDistance : 1,
            strokeOpacity : 0.25
        },
        point1 : {                  // Default values for point1 if created by line
            needsRegularUpdate : false
        },
        point2 : {                  // Default values for point2 if created by line
            needsRegularUpdate : false
        }
    },

    /* special slider options */
    slider : {
        snapWidth: null,
        firstArrow : false,
        lastArrow : false,
        withTicks: true,
        withLabel: true,
        point1: {
            needsRegularUpdate : false,
            showInfobox: false,
            withLabel: false,
            visible: false,
            fixed: true,
            name: ''
        },
        point2: {
            needsRegularUpdate : false,
            showInfobox: false,
            withLabel: false,
            visible: false,
            fixed: true,
            name: ''
        },
        glider: {
            showInfobox: false,
            name : '',
            withLabel: false,
            visible: true,
            strokeColor : '#666666',
            highlightStrokeColor : '#888888',
            fillColor : '#666666',
            highlightFillColor : 'none',
            size: 6,
            name: ''
        },
        segment1: {
            needsRegularUpdate : false,
            name : '',
            strokeWidth: 1,
            strokeColor : '#444444',
            highlightStrokeColor : '#888888'
        },
        segment2: {
            strokeWidth: 3,
            name : '',
            strokeColor : '#444444',
            highlightStrokeColor : '#888888'
        },
        /* line ticks options */
        ticks : {
            needsRegularUpdate : false,
            drawLabels : false,
            drawZero : true,
            insertTicks : true,
            minorHeight : 4,          // if <0: full width and height
            majorHeight : 10,        // if <0: full width and height
            minorTicks : 0,
            defaultDistance : 1,
            opacity : 1,
            strokeWidth: 1,
            strokeColor : '#444444'
        }, 
        text: {
            strokeColor:'gray'
        }
    },

    circle : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        center: {
            visible: false,
            withLabel: false,
            fixed: true,
            name: ''
        }
    },

    conic : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        foci: {
            // points
            fixed: true,
            visible: false,
            withLabel: false,
            name: ''
        }
    },

    angle : {
	    withLabel:true,
        radius : 1.0,
        fillColor : '#FF7F00',
        highlightFillColor : '#FF7F00',
        strokeColor : '#FF7F00',
        textColor : '#0000FF',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3,
        point: {
            withLabel: false,
            visible: false,
            name: ''
        }
    },

    /* special arc options */
    arc : {
        firstArrow : false,
        lastArrow : false,
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        center: {
            visible: false,
            withLabel: false,
            fixed: true,
            name: ''
        }
    },

    /* special polygon options */
    polygon : {
        fillColor : '#6BBA70',
        highlightFillColor : '#6BBA70',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3,
        withLines: true,
        lines: {
            withLabel: false,
            // Polygon layer + 1
            layer: 5
        },
        points : {                    
            withLabel: true,
            strokeColor: '#ff0000',
            fillColor: '#ff0000',
            fixed: true
        }
    },

    /* special sector options */
    sector : {
        fillColor: '#00FF00',
        highlightFillColor: '#00FF00',
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3
    },

    /* special text options */
    text : {
        fontSize : 11,
        digits: 2,
        isLabel: false,
        strokeColor : 'white',
        useASCIIMathML : false,
        useMathJax : false,
        display : 'html', //'html' or 'internal'
        withLabel: false
    },

    /* special curve options */
    curve : {
        strokeWidth : '2px',
        strokeColor : '#6BBA70',
        RDPsmoothing : false,    // Apply the Ramen-Douglas-Peuker algorithm
        numberPointsHigh : 1600, // Number of points on curves after mouseUp
        numberPointsLow : 400,   // Number of points on curves after mousemove
        doAdvancedPlot : true    // Use the algorithm by Gillam and Hohenwarter
                                 // It is much slower, but the result is better
    },

    precision : {
        touch    : 30,
        mouse    : 4,
        epsilon  : 0.0001,
        hasPoint : 4
    },

    // Default ordering of the layers
    layer : {
        numlayers:20, // only important in SVG
        text  : 9,
        point : 9,
        arc   : 8,
        line  : 7,
        circle: 6,
        curve : 5,
        polygon: 4,
        sector: 3,
        angle : 3,
        grid  : 1,
        image : 0
    },

    locus : {
    	translateToOrigin: false,
    	translateTo10: false,
    	stretch: false,
    	toOrigin: null,
    	to10: null
    }
});