/*
    Copyright 2008-2011
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * Options Namespace
 * @description These are the default options of the board and of all geometry elements.
 */
JXG.Options = {
    /* Options that are used directly within the board class */
    showCopyright : true,
    showNavigation : true,
    takeSizeFromFile : false, // If true, the construction - when read from a file or string - the size of the div can be changed.
    renderer: 'svg',
    takeFirst : false, // if true the first element with hasPoint==true is taken.

    /* zoom options */
    zoom : {
        factor : 1.25
    },

    /* navbar options */
    navbar: {
        strokeColor: '#aaaaaa',
        fillColor: '#f5f5f5',
        padding: '2px',
        position: 'absolute',
        fontSize: '10px',
        cursor: 'pointer',
        zIndex: '100',
        right: '5px',
        bottom: '5px'
    },

    /**
     * Generic options 
     */
    
    /* geometry element options */
    elements : {
        /**
         * The stroke color of the given geometry element.
         * @type string
         * @name JXG.GeometryElement#strokeColor
         * @see #highlightStrokeColor
         * @see #strokeWidth
         * @see #strokeOpacity
         * @see #highlightStrokeOpacity
         * @default {@link JXG.Options.elements.color#strokeColor}
         */
        strokeColor: '#0000ff',

        /**
         * The stroke color of the given geometry element when the user moves the mouse over it.
         * @type string
         * @name JXG.GeometryElement#highlightStrokeColor
         * @see #sstrokeColor
         * @see #strokeWidth
         * @see #strokeOpacity
         * @see #highlightStrokeOpacity
         * @default {@link JXG.Options.elements.color#highlightStrokeColor}
         */
        highlightStrokeColor: '#C3D9FF',

        /**
         * The fill color of this geometry element.
         * @type string
         * @name JXG.GeometryElement#fillColor
         * @see #highlightFillColor
         * @see #fillOpacity
         * @see #highlightFillOpacity
         * @default {@link JXG.Options.elements.color#fillColor}
         */
        fillColor: 'red',

        /**
         * The fill color of the given geometry element when the mouse is pointed over it.
         * @type string
         * @name JXG.GeometryElement#highlightFillColor
         * @see #fillColor
         * @see #fillOpacity
         * @see #highlightFillOpacity
         * @default {@link JXG.Options.elements.color#highlightFillColor}
         */
        highlightFillColor: 'none',

        /**
         * Opacity for element's stroke color.
         * @type number
         * @name JXG.GeometryElement#strokeOpacity
         * @see #strokeColor
         * @see #highlightStrokeColor
         * @see #strokeWidth
         * @see #highlightStrokeOpacity
         * @default {@link JXG.Options.elements#strokeOpacity}
         */
        strokeOpacity: 1,

        /**
         * Opacity for stroke color when the object is highlighted.
         * @type number
         * @name JXG.GeometryElement#highlightStrokeOpacity
         * @see #strokeColor
         * @see #highlightStrokeColor
         * @see #strokeWidth
         * @see #strokeOpacity
         * @default {@link JXG.Options.elements#highlightStrokeOpacity}
         */
        highlightStrokeOpacity: 1,

        /**
         * Opacity for fill color.
         * @type number
         * @name JXG.GeometryElement#fillOpacity
         * @see #fillColor
         * @see #highlightFillColor
         * @see #highlightFillOpacity
         * @default {@link JXG.Options.elements.color#fillOpacity}
         */
        fillOpacity: 1,

        /**
         * Opacity for fill color when the object is highlighted.
         * @type number
         * @name JXG.GeometryElement#highlightFillOpacity
         * @see #fillColor
         * @see #highlightFillColor
         * @see #fillOpacity
         * @default {@link JXG.Options.elements.color#highlightFillOpacity}
         */
        highlightFillOpacity: 1,

        /**
         * Width of the element's stroke.
         * @type number
         * @name JXG.GeometryElement#strokeWidth
         * @see #strokeColor
         * @see #highlightStrokeColor
         * @see #strokeOpacity
         * @see #highlightStrokeOpacity
         * @default {@link JXG.Options.elements#strokeWidth}
         */
        strokeWidth: 2,

        /**
         * Width of the element's stroke when the mouse is pointed over it.
         * @type number
         * @name JXG.GeometryElement#highlightStrokeWidth
         * @see #strokeColor
         * @see #highlightStrokeColor
         * @see #strokeOpacity
         * @see #highlightStrokeOpacity
         * @see #highlightFillColor
         * @default {@link JXG.Options.elements#strokeWidth}
         */
        highlightStrokeWidth: 2,


        /**
         * If true the element is fixed and can not be dragged around. The element
         * will be repositioned on zoom and moveOrigin events.
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#fixed
         */
        fixed: false,

        /**
         * If true the element is fixed and can not be dragged around. The element
         * will even stay at its position on zoom and moveOrigin events.
         * Only free elements like points, texts, curves can be frozen.
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#frozen
         */
        frozen: false,

        withLabel: false,

        /**
         * If false the element won't be visible on the board, otherwise it is shown.
         * @type boolean
         * @name JXG.GeometryElement#visible
         * @see #hideElement
         * @see #showElement
         * @default true
         */
        visible: true,

        /**
         * Display layer which will contain the element.
         * @see JXG.Options#layer
         * @default See {@link JXG.Options#layer}
         */
        layer: 9,

        /**
         * Determines the elements border-style.
         * Possible values are:
         * <ul><li>0 for a solid line</li>
         * <li>1 for a dotted line</li>
         * <li>2 for a line with small dashes</li>
         * <li>3 for a line with medium dashes</li>
         * <li>4 for a line with big dashes</li>
         * <li>5 for a line with alternating medium and big dashes and large gaps</li>
         * <li>6 for a line with alternating medium and big dashes and small gaps</li></ul>
         * @type Number
         * @name JXG.GeometryElement#dash
         * @default 0
         */
        dash: 0,

        /**
         * If true the element will get a shadow.
         * @type boolean
         * @name JXG.GeometryElement#shadow
         * @default false
         */
        shadow: false,

        /**
         * If true the element will be traced, i.e. on every movement the element will be copied
         * to the background. Use {@link JXG.GeometryElement#clearTrace} to delete the trace elements.
         * @see JXG.GeometryElement#clearTrace
         * @see JXG.GeometryElement#traces
         * @see JXG.GeometryElement#numTraces
         * @type Boolean
         * @default false
         * @name JXG.GeometryElement#trace
         */
        trace: false,

        /**
         * If this is set to true, the element is updated in every update
         * call of the board. If set to false, the element is updated only after
         * zoom events or more generally, when the bounding box has been changed.
         * Examples for the latter behaviour should be axes.
         * @type Boolean
         * @default true
         * @see JXG.GeometryElement#needsRegularUpdate
         * @name JXG.GeometryElement#needsRegularUpdate
         */
        needsRegularUpdate: true,
        
        /*draft options */
        draft : {
            /**
             * If true the element will be drawn in grey scale colors to visualize that it's only a draft.
             * @type boolean
             * @name JXG.GeometryElement#draft
             * @default {@link JXG.Options.elements.draft#draft}
             */
            draft : false,
            color : '#565656',
            opacity : 0.8,
            strokeWidth : '1px'
        }
    },

    ticks : {
        /**
         * Draw labels yes/no
         * @type Boolean
         * @name JXG.Ticks#drawLabels
         * @default false
         */
        drawLabels: false,
        
        /**
         * Draw the zero tick, that lies at line.point1?
         * @type Boolean
         * @name JXG.Ticks#drawZero
         * @default false
         */
        drawZero: false,

        /**
         * If the distance between two ticks is too big we could insert new ticks. If insertTicks
         * is <tt>true</tt>, we'll do so, otherwise we leave the distance as is.
         * This option is ignored if equidistant is false.
         * @type Boolean
         * @name JXG.Ticks#insertTicks
         * @see JXG.Ticks#equidistant
         * @see JXG.Ticks#maxTicksDistance
         * @default false
         */
        insertTicks: false,
        minTicksDistance: 50,
        maxTicksDistance: 300,

        /**
         * Total height of a minor tick. If negative the full height of the board is taken.
         * @type Number
         * @name JXG.Ticks#minorHeight
         */
        minorHeight: 4,

        /**
         * Total height of a major tick. If negative the full height of the board is taken.
         * @type Number
         * @name JXG.Ticks#majorHeight
         */
        majorHeight: 10,

        /**
         * The number of minor ticks between two major ticks.
         * @type Number
         * @name JXG.Ticks#minorTicks
         */
        minorTicks: 4,
        defaultDistance: 1,
        opacity: 1,
        strokeWidth: 1,
        strokeColor: 'black',
        highlightStrokeColor: '#888888'
    },

    /* precision options */
    precision : {
        touch    : 30,
        mouse    : 4,
        epsilon  : 0.0001,
        hasPoint : 4
    },

    /* Default ordering of the layers */
    layer : {
        numlayers: 20, // only important in SVG
        text  : 9,
        point : 9,
        arc   : 8,
        line  : 7,
        circle: 6,
        curve : 5,
        polygon: 4,
        sector: 3,
        angle : 3,
        integral : 3,
        grid  : 1,
        image : 0
    },

    /**
     * element type specific options 
     */ 
    /* special angle options */
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
        useDirection: false, 
        center: {
            visible: false,
            withLabel: false,
            fixed: true,
            name: ''
        }
    },

    /* special axis options */
    axis: {
        needsRegularUpdate : false,         // Axes only updated after zooming and moving of the origin.
        strokeWidth: 1,
        strokeColor : '#666666',
        highlightStrokeColor : '#888888',
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
            insertTicks : true,
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
    
    /* special options for bisector of 3 points */
    bisector : {
        strokeColor: '#000000', // Bisector line
        point : {               // Bisector point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },

    /* special options for the 2 bisectors of 2 lines */
    bisectorlines : {
        line1 : {               // 
            strokeColor: 'red'
        },
        line2 : {               // 
            strokeColor: 'black'
        }
    },

    /* special chart options */
    chart: {
        chartStyle: 'line',
        colors: ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00'],
        highlightcolors: null,
        fillcolor: null,
        highlightonsector: false,
        highlightbysize: false
    },

    /*special circle options */
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

    /* special options for circumcircle of 3 points */
    circumcircle : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        point : {               // center point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },

    /* special options for circumcircle sector of 3 points */
    circumcirclesector: {
        useDirection: true,
        fillColor: '#00FF00',
        highlightFillColor: '#00FF00',
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3,
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        //fillOpacity: 0.3,
        //highlightFillOpacity: 0.3,
        point: {
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },
    
    /* special conic options */
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

    /* special curve options */
    curve : {
        strokeWidth : '1px',
        strokeColor : '#0000ff',
        fillColor: 'none',

        /**
         * The curveType is set in @see generateTerm and used in
         * {@link JXG.Curve#updateCurve}
         * Possible values are:
         * 'none'
         * 'plot': Data plot
         * 'parameter': we can not distinguish function graphs and parameter curves
         * 'functiongraph': function graph
         * 'polar'
         * 'implicit' (not yet)
         *
         * Only parameter and plot are set directly.
         * polar is set with setProperties only.
         * @name JXG.Curve#curveType
         */
        curveType: null,
        RDPsmoothing : false,       // Apply the Ramen-Douglas-Peuker algorithm
        numberPointsHigh : 1600,  // Number of points on curves after mouseUp
        numberPointsLow : 400,    // Number of points on curves after mousemove
        doAdvancedPlot : true       // Use the algorithm by Gillam and Hohenwarter
                                 // It is much slower, but the result is better
    },

    /* special grid options */
    grid : {
        /* grid styles */
        needsRegularUpdate : false,
        hasGrid : false,
        gridX : 1,
        gridY : 1,
        strokeColor : '#C0C0C0',
        strokeOpacity : '0.5',
        strokeWidth: 1,
        dash : 2,
        /* snap to grid options */
        snapToGrid : false,
        snapSizeX : 2,
        snapSizeY : 2
    },

    /* special grid options */
    image: {
        imageString : null
    },
    
    /* special options for incircle of 3 points */
    incircle : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF',
        point : {               // center point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },

    /* special options for integral */
    integral: {
        withLabel: true,    // Show integral value as text
        strokeWidth: 0,
        strokeOpacity: 0,
        start: {    // Start point
            visible: true
        },
        startproject: {    // Start point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        },
        end: {      // End point
            visible: true
        },
        endproject: {      // End point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        },
        text: {
            fontSize: 20
        }
    },

    /* special legend options */
    legend: {
        style: 'vertical',
        labels: ['1','2','3','4','5','6','7','8'],
        colors: ['#B02B2C','#3F4C6B','#C79810','#D15600','#FFFF88','#C3D9FF','#4096EE','#008C00']
    },

    /* special line options */
    line : {
        firstArrow : false,
        lastArrow : false,
        straightFirst : true,
        straightLast : true,
        fillColor : 'none',               // Important for VML on IE
        highlightFillColor : 'none',  // Important for VML on IE
        strokeColor : '#0000ff',
        highlightStrokeColor : '#888888',
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
            minorHeight : 4,          // if <0: full width and height
            majorHeight : -1,         // if <0: full width and height
            minorTicks : 4,
            defaultDistance : 1,
            opacity : 0.3
        },
        /* absolute label offset from anchor */
        labelOffsets: [10,10]
    },

    /* special options for locus curves */
    locus : {
        translateToOrigin: false,
        translateTo10: false,
        stretch: false,
        toOrigin: null,
        to10: null
    },
    
    /* special options for parallel lines */
    parallel : {
        strokeColor: '#000000', // Parallel line
        point : {               // Parallel point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },

    /* special perpendicular options */
    perpendicular : {
        strokeColor: '#000000', // Perpendicular segment
        point : {               // Perpendicular point
            visible: false,
            fixed: true,
            withLabel: false,
            name: ''
        }
    },

    /* special point options */
    point : {
    	withLabel: true,

        /**
         * This attribute was used to determined the point layout. It was derived from GEONExT and was
         * replaced by {@link JXG.Point#face} and {@link JXG.Point#size}.
         * @see JXG.Point#face
         * @see JXG.Point#size
         * @type Number
         * @default JXG.Options.point#style
         * @name JXG.Point#style
         * @deprecated
         */
        style : 5,

        /**
         * There are different point styles which differ in appearance.
         * Posssible values are
         * <table><tr><th>Value</th></tr>
         * <tr><td>cross</td></tr>
         * <tr><td>circle</td></tr>
         * <tr><td>square</td></tr>
         * <tr><td>plus</td></tr>
         * <tr><td>diamond</td></tr>
         * <tr><td>triangleUp</td></tr>
         * <tr><td>triangleDown</td></tr>
         * <tr><td>triangleLeft</td></tr>
         * <tr><td>triangleRight</td></tr>
         * </table>
         * @type string
         * @see JXG.Point#setStyle
         * @default circle
         * @name JXG.Point#face
         */
        face : 'o',

        /**
         * Determines the size of a point.
         * Means radius resp. half the width of a point (depending on the face).
         * @see JXG.Point#face
         * @type number
         * @see JXG.Point#setStyle
         * @default 3
         * @name JXG.Point#size
         */
        size : 3,
        fillColor : '#ff0000',
        highlightFillColor : '#EEEEEE',
        strokeWidth: '2px',
        strokeColor : '#ff0000',
        highlightStrokeColor : '#C3D9FF',
        zoom: false,             // Change the point size on zoom

        /**
         * If true, the infobox is shown on mouse over, else not.
         * @type boolean
         * @default true
         */
        showInfobox: true,

        draft: false
    },

    /* special polygon options */
    polygon : {
        fillColor : '#00FF00',
        highlightFillColor : '#00FF00',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3,

        /**
         * Is the polygon bordered by lines?
         * @type Boolean
         * @name JXG.Polygon#withLines
         * @default true
         */
        withLines: true,

        lines: {
            withLabel: false,
            strokeColor: 'none',
            // Polygon layer + 1
            layer: 5
        },
        
        /**
         *  Points for regular polygons
         */ 
        points : {                    
            withLabel: true,
            strokeColor: '#ff0000',
            fillColor: '#ff0000',
            fixed: true
        }
    },

    /* special options for riemann sums */
    riemannsum: {
        withLabel:false,
        fillOpacity:0.3,
        fillColor:'#ffff00'
    },

    /* special sector options */
    sector : {
        fillColor: '#00FF00',
        highlightFillColor: '#00FF00',
        fillOpacity: 0.3,
        highlightFillOpacity: 0.3
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
            strokeColor : '#000000',
            highlightStrokeColor : '#888888',
            fillColor : '#ffffff',
            highlightFillColor : 'none',
            size: 6
        },
        segment1: {
            needsRegularUpdate : false,
            name : '',
            strokeWidth: 1,
            strokeColor : '#000000',
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
            strokeColor : '#000000'
        }, 
        segment2: {
            strokeWidth: 3,
            name : '',
            strokeColor : '#000000',
            highlightStrokeColor : '#888888'
        },
        text: {
            strokeColor: '#000000'
        }
    },
    
    /* special text options */
    text : {
        fontSize : 12,
        digits: 2,
        isLabel: false,
        strokeColor : '#000000',
        useASCIIMathML : false,
        useMathJax : false,
        display : 'html',                    //'html' or 'internal'
        withLabel: false
    }
};

/**
 * Holds all possible properties and the according validators for geometry elements. A validator is either a function
 * which takes one parameter and returns true, if the value is valid for the property, or it is false if no validator
 * is required.
 */
JXG.Validator = (function () {
    var validatePixel = function (v) {
            return /^[0-9]+px$/.test(v);
        },
        validateDisplay = function (v) {
            return (v  in {html: 0, internal: 0});
        },
        validateColor = function (v) {
            // for now this should do it...
            return JXG.isString(v);
        },
        validatePointFace = function (v) {
            return JXG.exists(JXG.Point.prototype.normalizeFace.call(this, v));
        },
        validateInteger = function (v) {
            return (Math.abs(v - Math.round(v)) < JXG.Math.eps);
        },
        validatePositiveInteger = function (v) {
            return validateInteger(v) && v > 0;
        },
        validateScreenCoords = function (v) {
            return v.length >= 2 && validateInteger(v[0]) && validateInteger(v[1]);
        },
        validateRenderer = function (v) {
            return (v in {vml: 0, svg: 0, canvas: 0});
        },
    i, v = {},
    validators = {
        color: validateColor,
        defaultDistance: JXG.isNumber,
        display : validateDisplay,
        doAdvancedPlot: false,
        draft : false,
        drawLabels : false,
        drawZero : false,
        face : validatePointFace,
        factor : JXG.isNumber,
        fillColor: validateColor,
        fillOpacity : JXG.isNumber,
        firstArrow : false,
        fontSize : validateInteger,
        dash : validateInteger,
        gridX : JXG.isNumber,
        gridY : JXG.isNumber,
        hasGrid : false,
        highlightFillColor: validateColor,
        highlightFillOpacity: JXG.isNumber,
        highlightStrokeColor: validateColor,
        highlightStrokeOpacity: JXG.isNumber,
        insertTicks : false,
        labelOffsets: validateScreenCoords,
        lastArrow : false,
        majorHeight : validateInteger,
        maxTicksDistance : validatePositiveInteger,
        minorHeight : validateInteger,
        minorTicks : validatePositiveInteger,
        minTicksDistance : validatePositiveInteger,
        numberPointsHigh : validatePositiveInteger,
        numberPointsLow : validatePositiveInteger,
        opacity : JXG.isNumber,
        radius : JXG.isNumber,
        RDPsmoothing : false,
        renderer: validateRenderer,
        right: validatePixel,
        showCopyright : false,
        showInfobox: false,
        showNavigation : false,
        size : validateInteger,
        snapSizeX : JXG.isNumber,
        snapSizeY : JXG.isNumber,
        snapToGrid : false,
        straightFirst : false,
        straightLast : false,
        stretch: false,
        strokeColor : validateColor,
        strokeOpacity: JXG.isNumber,
        strokeWidth : validateInteger,
        takeFirst : false,
        takeSizeFromFile : false,
        textColor : validateColor,
        to10: false,
        toOrigin: false,
        translateTo10: false,
        translateToOrigin: false,
        useASCIIMathML : false,
        useDirection: false,
        useMathJax : false,
        withLabel: false,
        withTicks: false,
        zoom: false
    };

    // this seems like a redundant step but it makes sure that
    // all properties in the validator object have lower case names
    // and the validator object is easier to read.
    for (i in validators) {
        v[i.toLowerCase()] = validators[i];
    }

    return v;
})();


/**
 * Apply the options stored in this object to all objects on the given board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 */
JXG.useStandardOptions = function(board) {
    var o = JXG.Options,
        boardHadGrid = board.hasGrid,
        el, t, p, copyProps;

    board.options.grid.hasGrid = o.grid.hasGrid;
    board.options.grid.gridX = o.grid.gridX;
    board.options.grid.gridY = o.grid.gridY;
    board.options.grid.gridColor = o.grid.gridColor;
    board.options.grid.gridOpacity = o.grid.gridOpacity;
    board.options.grid.gridDash = o.grid.gridDash;
    board.options.grid.snapToGrid = o.grid.snapToGrid;
    board.options.grid.snapSizeX = o.grid.SnapSizeX;
    board.options.grid.snapSizeY = o.grid.SnapSizeY;
    board.takeSizeFromFile = o.takeSizeFromFile;

    copyProps = function(p, o) {
            p.visProp.fillcolor = o.fillColor;
            p.visProp.highlightfillcolor = o.highlightFillColor;
            p.visProp.strokecolor = o.strokeColor;
            p.visProp.highlightstrokecolor = o.highlightStrokeColor;
    };
    
    for(el in board.objects) {
        p = board.objects[el];
        if(p.elementClass == JXG.OBJECT_CLASS_POINT) {
            copyProps(p, o.point);
        }
        else if(p.elementClass == JXG.OBJECT_CLASS_LINE) {
            copyProps(p, o.line);
            for(t in p.ticks) {
                t.majorTicks = o.line.ticks.majorTicks;
                t.minTicksDistance = o.line.ticks.minTicksDistance;
                t.visProp.minorheight = o.line.ticks.minorHeight;
                t.visProp.majorheight = o.line.ticks.majorHeight;
            }
        }
        else if(p.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
            copyProps(p, o.circle);
        }
        else if(p.type == JXG.OBJECT_TYPE_ANGLE) {
            copyProps(p, o.angle);
        }
        else if(p.type == JXG.OBJECT_TYPE_ARC) {
            copyProps(p, o.arc);
        }
        else if(p.type == JXG.OBJECT_TYPE_POLYGON) {
            copyProps(p, o.polygon);
        }
        else if(p.type == JXG.OBJECT_TYPE_CONIC) {
            copyProps(p, o.conic);
        }
        else if(p.type == JXG.OBJECT_TYPE_CURVE) {
            copyProps(p, o.curve);
        }
        else if(p.type == JXG.OBJECT_TYPE_SECTOR) {
            p.arc.visProp.fillcolor = o.sector.fillColor;
            p.arc.visProp.highlightfillcolor = o.sector.highlightFillColor;
            p.arc.visProp.fillopacity = o.sector.fillOpacity;
            p.arc.visProp.highlightfillopacity = o.sector.highlightFillOpacity;
        }
    }

    board.fullUpdate();
    if(boardHadGrid && !board.hasGrid) {
        board.removeGrids(board);
    } else if(!boardHadGrid && board.hasGrid) {
        board.create('grid', []);
    }
};

/**
 * Converts all color values to greyscale and calls useStandardOption to put them onto the board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 * @see #useStandardOptions
 */
JXG.useBlackWhiteOptions = function(board) {
    var o = JXG.Options;
    o.point.fillColor = JXG.rgb2bw(o.point.fillColor);
    o.point.highlightFillColor = JXG.rgb2bw(o.point.highlightFillColor);
    o.point.strokeColor = JXG.rgb2bw(o.point.strokeColor);
    o.point.highlightStrokeColor = JXG.rgb2bw(o.point.highlightStrokeColor);

    o.line.fillColor = JXG.rgb2bw(o.line.fillColor);
    o.line.highlightFillColor = JXG.rgb2bw(o.line.highlightFillColor);
    o.line.strokeColor = JXG.rgb2bw(o.line.strokeColor);
    o.line.highlightStrokeColor = JXG.rgb2bw(o.line.highlightStrokeColor);

    o.circle.fillColor = JXG.rgb2bw(o.circle.fillColor);
    o.circle.highlightFillColor = JXG.rgb2bw(o.circle.highlightFillColor);
    o.circle.strokeColor = JXG.rgb2bw(o.circle.strokeColor);
    o.circle.highlightStrokeColor = JXG.rgb2bw(o.circle.highlightStrokeColor);

    o.arc.fillColor = JXG.rgb2bw(o.arc.fillColor);
    o.arc.highlightFillColor = JXG.rgb2bw(o.arc.highlightFillColor);
    o.arc.strokeColor = JXG.rgb2bw(o.arc.strokeColor);
    o.arc.highlightStrokeColor = JXG.rgb2bw(o.arc.highlightStrokeColor);

    o.polygon.fillColor = JXG.rgb2bw(o.polygon.fillColor);
    o.polygon.highlightFillColor  = JXG.rgb2bw(o.polygon.highlightFillColor);

    o.sector.fillColor = JXG.rgb2bw(o.sector.fillColor);
    o.sector.highlightFillColor  = JXG.rgb2bw(o.sector.highlightFillColor);

    o.curve.strokeColor = JXG.rgb2bw(o.curve.strokeColor);
    o.grid.gridColor = JXG.rgb2bw(o.grid.gridColor);

    JXG.useStandardOptions(board);
};

/**
 * Decolorizes the given color.
 * @param {String} color HTML string containing the HTML color code.
 * @type String
 * @return Returns a HTML color string
 */
JXG.rgb2bw = function(color) {
    if(color == 'none') {
        return color;
    }
    var x, HexChars="0123456789ABCDEF", tmp, arr;
    arr = JXG.rgbParser(color);
    x = 0.3*arr[0] + 0.59*arr[1] + 0.11*arr[2];
    tmp = HexChars.charAt((x>>4)&0xf)+HexChars.charAt(x&0xf);
    color = "#" + tmp + "" + tmp + "" + tmp;
    return color;
};

/**
 * Converts the colors of the elements to how a color blind person would approximately see it. Possible
 * options are <i>protanopia</i>, <i>deuteranopia</i>, and <i>tritanopia</i>.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 * @param {string} deficiency The type of deficiency which will be simulated.
 * @see #useStandardOptions
 */
JXG.simulateColorBlindness = function(board, deficiency) {
    var o = JXG.Options;
    o.point.fillColor = JXG.rgb2cb(o.point.fillColor, deficiency);
    o.point.highlightFillColor = JXG.rgb2cb(o.point.highlightFillColor, deficiency);
    o.point.strokeColor = JXG.rgb2cb(o.point.strokeColor, deficiency);
    o.point.highlightStrokeColor = JXG.rgb2cb(o.point.highlightStrokeColor, deficiency);

    o.line.fillColor = JXG.rgb2cb(o.line.fillColor, deficiency);
    o.line.highlightFillColor = JXG.rgb2cb(o.line.highlightFillColor, deficiency);
    o.line.strokeColor = JXG.rgb2cb(o.line.strokeColor, deficiency);
    o.line.highlightStrokeColor = JXG.rgb2cb(o.line.highlightStrokeColor, deficiency);

    o.circle.fillColor = JXG.rgb2cb(o.circle.fillColor, deficiency);
    o.circle.highlightFillColor = JXG.rgb2cb(o.circle.highlightFillColor, deficiency);
    o.circle.strokeColor = JXG.rgb2cb(o.circle.strokeColor, deficiency);
    o.circle.highlightStrokeColor = JXG.rgb2cb(o.circle.highlightStrokeColor, deficiency);

    o.arc.fillColor = JXG.rgb2cb(o.arc.fillColor, deficiency);
    o.arc.highlightFillColor = JXG.rgb2cb(o.arc.highlightFillColor, deficiency);
    o.arc.strokeColor = JXG.rgb2cb(o.arc.strokeColor, deficiency);
    o.arc.highlightStrokeColor = JXG.rgb2cb(o.arc.highlightStrokeColor, deficiency);

    o.polygon.fillColor = JXG.rgb2cb(o.polygon.fillColor, deficiency);
    o.polygon.highlightFillColor  = JXG.rgb2cb(o.polygon.highlightFillColor, deficiency);

    o.sector.fillColor = JXG.rgb2cb(o.sector.fillColor, deficiency);
    o.sector.highlightFillColor  = JXG.rgb2cb(o.sector.highlightFillColor, deficiency);

    o.curve.strokeColor = JXG.rgb2cb(o.curve.strokeColor, deficiency);
    o.grid.gridColor = JXG.rgb2cb(o.grid.gridColor, deficiency);

    JXG.useStandardOptions(board);
};

/**
 * Decolorizes the given color.
 * @param {String} color HTML string containing the HTML color code.
 * @param {String} deficiency The type of color blindness. Possible
 * options are <i>protanopia</i>, <i>deuteranopia</i>, and <i>tritanopia</i>.
 * @type String
 * @return Returns a HTML color string
 */
JXG.rgb2cb = function(color, deficiency) {
    if(color == 'none') {
        return color;
    }

    var rgb, l, m, s, lms, tmp,
        a1, b1, c1, a2, b2, c2,
        inflection;

    lms = JXG.rgb2LMS(color);
    l = lms.l; m = lms.m; s = lms.s;

    deficiency = deficiency.toLowerCase();

    switch(deficiency) {
        case "protanopia":
            a1 = -0.06150039994295001;
            b1 = 0.08277001656812001;
            c1 = -0.013200141220000003;
            a2 = 0.05858939668799999;
            b2 = -0.07934519995360001;
            c2 = 0.013289415272000003;
            inflection = 0.6903216543277437;

            tmp = s/m;
            if (tmp < inflection)
                l = -(b1 * m + c1 * s) / a1;
            else
                l = -(b2 * m + c2 * s) / a2;
            break;
        case "tritanopia":
            a1 = -0.00058973116217;
            b1 = 0.007690316482;
            c1 = -0.01011703519052;
            a2 = 0.025495080838999994;
            b2 = -0.0422740347;
            c2 = 0.017005316784;
            inflection = 0.8349489908460004;

            tmp = m / l;
            if (tmp < inflection)
              s = -(a1 * l + b1 * m) / c1;
            else
              s = -(a2 * l + b2 * m) / c2;
            break;
        default:
            a1 = -0.06150039994295001;
            b1 = 0.08277001656812001;
            c1 = -0.013200141220000003;
            a2 = 0.05858939668799999;
            b2 = -0.07934519995360001;
            c2 = 0.013289415272000003;
            inflection = 0.5763833686400911;

            tmp = s/l;
            if(tmp < inflection)
                m = -(a1 * l + c1 * s) / b1;
            else
                m = -(a2 * l + c2 * s) / b2;
            break;
    }

    rgb = JXG.LMS2rgb(l, m, s);

    var HexChars="0123456789ABCDEF";
    tmp = HexChars.charAt((rgb.r>>4)&0xf)+HexChars.charAt(rgb.r&0xf);
    color = "#" + tmp;
    tmp = HexChars.charAt((rgb.g>>4)&0xf)+HexChars.charAt(rgb.g&0xf);
    color += tmp;
    tmp = HexChars.charAt((rgb.b>>4)&0xf)+HexChars.charAt(rgb.b&0xf);
    color += tmp;

    return color;
};

/**
 * Load options from a file using FileReader
 * @param fileurl {String} URL to .json-file containing style information
 * @param apply {bool} <tt>true</tt> when options in file should be applied to board after being loaded.
 * @param board {JXG.Board} The board the options should be applied to.
 */
JXG.loadOptionsFromFile = function(fileurl, applyTo, board) {
   var cbp = function(t) {
      JXG.parseOptionsString(t, applyTo, board);
   };

   JXG.FileReader.parseFileContent(fileurl, cbp, 'raw', false);
};

/**
 * Apply options given as a string to a board.
 * @param text {String} Options given as a string in .json-Format
 * @param apply {bool} <tt>true</tt> if the options should be applied to all objects on the board.
 * @param board {JXG.Board} The board the options should be applied to.
 */
JXG.parseOptionsString = function(text, applyTo, board) {
    var newOptions = '';

    if (text != '') {
        newOptions = eval("(" + text + ")");
    } else {
        return;
    }

    var maxDepth = 10;
    var applyOption = function (base, option, depth) {
        if (depth == 10)
            return;
        depth++;

        for (var key in option) {
            if ((JXG.isNumber(option[key])) || (JXG.isArray(option[key])) || (JXG.isString(option[key])) || (option[key] == true) || (option[key] == false)) {
                base[key] = option[key];
            }
            else {
                applyOption(base[key], option[key], depth);
            }
        }
    };

    if(!applyTo) {
        applyOption(JXG.Options, newOptions, 0);
    } else {
        applyOption(board.options, newOptions, 0);
    }

    if (applyTo && typeof board != 'undefined') {
        JXG.useStandardOptions(board);
    }
};
// vim: et ts=4
