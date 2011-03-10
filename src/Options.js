/*
    Copyright 2008,2009
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

    /* grid options */
    grid : {
        /* grid styles */
        hasGrid : false,
        gridX : 1,
        gridY : 1,
        strokeColor : '#C0C0C0',
        strokeOpacity : '0.5',
        dash : 2,
        /* snap to grid options */
        snapToGrid : false,
        snapSizeX : 2,
        snapSizeY : 2
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

    /* zoom options */
    zoom : {
        factor : 1.25
    },

    /* geometry element options */
    elements : {
        /* color options */
        strokeColor: '#0000ff',
        highlightStrokeColor: '#C3D9FF',
        fillColor: 'red',
        highlightFillColor: 'none',

        strokeOpacity: 1,
        highlightStrokeOpacity: 1,
        fillOpacity: 1,
        highlightFillOpacity: 1,
        strokeWidth: '2px',
	    withLabel: false,
        visible: true,

        /*draft options */
        draft : {
            draft : false,
            color : '#565656',
            opacity : 0.8,
            strokeWidth : '1px'
        }
    },

    /* special point options */
    point : {
    	withLabel: true,

        /**
         * There are different point styles which differ in appearance and size.
         * Possible values are
         * <table><tr><th>Constant name</th><th>Value</th><th>Meaning</th><th>face</th><th>size</th></tr>
         * <tr><td>JXG.POINT_STYLE_X_SMALL</td><td>0</td><td>small sized x</td><td>cross or x</td><td>2</td></tr>
         * <tr><td>JXG.POINT_STYLE_X</td><td>1</td><td>medium sized x</td><td>cross or x</td><td>3</td></tr>
         * <tr><td>JXG.POINT_STYLE_X_BIG</td><td>2</td><td>big sized x</td><td>cross or x</td><td>4</td></tr>
         * <tr><td>JXG.POINT_STYLE_CIRCLE_TINY</td><td>3</td><td>tiny circle</td><td>circle or o</td><td>1</td></tr>
         * <tr><td>JXG.POINT_STYLE_CIRCLE_SMALL</td><td>4</td><td>small circle</td><td>circle or o</td><td>2</td></tr>
         * <tr><td>JXG.POINT_STYLE_CIRCLE</td><td>5</td><td>medium circle</td><td>circle or o</td><td>3</td></tr>
         * <tr><td>JXG.POINT_STYLE_CIRCLE_BIG</td><td>6</td><td>big circle</td><td>circle or o</td><td>4</td></tr>
         * <tr><td>JXG.POINT_STYLE_SQUARE_SMALL</td><td>7</td><td>small rectangle</td><td>square or []</td><td>2</td></tr>
         * <tr><td>JXG.POINT_STYLE_SQUARE</td><td>8</td><td>medium rectangle</td><td>square or []</td><td>3</td></tr>
         * <tr><td>JXG.POINT_STYLE_SQUARE_BIG</td><td>9</td><td>big rectangle</td><td>square or []</td><td>4</td></tr>
         * <tr><td>JXG.POINT_STYLE_PLUS_SMALL</td><td>10</td><td>small +</td><td>plus or +</td><td>2</td></tr>
         * <tr><td>JXG.POINT_STYLE_PLUS</td><td>11</td><td>medium +</td><td>plus or +</td><td>3</td></tr>
         * <tr><td>JXG.POINT_STYLE_PLUS_BIG</td><td>12</td><td>big +</td><td>plus or +</td><td>4</td></tr></table>
         * <b>Hint:</b> This attribute is internally replaced by face and size, whose opportunities are wider, , as given in the table above.
         * @see JXG.Point#face
         * @see JXG.Point#size
         * @type number
         * @see #setStyle
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

    /* special line options */
    line : {
        firstArrow : false,
        lastArrow : false,
        straightFirst : true,
        straightLast : true,
        fillColor : '#000000',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#888888',
        withTicks: false,
        point1 : {                  // Default values for point1 if created by line
            visible: false, 
            withLabel: false, 
            fixed:true
        },
        point2 : {                  // Default values for point2 if created by line
            visible: false, 
            withLabel: false, 
            fixed: true
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

    /* special axis options */
    axis : {
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
            opacity : 0.25
        },
        point1 : {                  // Default values for point1 if created by line
            needsRegularUpdate : false,
            visible: false, 
            withLabel: false, 
            fixed: true
        },
        point2 : {                  // Default values for point2 if created by line
            needsRegularUpdate : false,
            visible: false, 
            withLabel: false, 
            fixed: true
        }
    },

    /* special slider options */
    slider : {
        snapWidth: null,
        firstArrow : false,
        lastArrow : false,
        straightFirst : false,
        straightLast : false,
        fillColor : '#ffffff',
        highlightFillColor : 'none',
        strokeColor : '#000000',
        highlightStrokeColor : '#888888',
        withTicks: true,
        point1: {
            needsRegularUpdate : false,
            showInfobox: false,
            name : '',
            visible: true,
            fixed: true,
            size: 5
        },
        point2: {
            needsRegularUpdate : false,
            showInfobox: false,
            name : '',
            visible: true,
            fixed: true,
            size: 2
        },
        glider: {
            showInfobox: false,
            name : '',
            visible: true,
            size: 6
        },
        segment: {
            needsRegularUpdate : false,
            name : '',
            strokeWidth: 1
        },
        /* line ticks options */
        ticks : {
            drawLabels : false,
            drawZero : true,
            insertTicks : true,
            //minTicksDistance : 50,
            //maxTicksDistance : 300,
            minorHeight : 4,          // if <0: full width and height 
            majorHeight : 10,        // if <0: full width and height
            minorTicks : 0,
            defaultDistance : 1,
            opacity : 1,
            strokeWidth: 1
        }, 
        segment2: {
            strokeWidth: 3,
            name : ''
        }
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
            fixed: true
        }
    },

    /* special conic options */
    conic : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF'
    },

    /* special angle options */
    angle : {
	    withLabel:true,
        radius : 1.0,
        fillColor : '#FF7F00',
        highlightFillColor : '#FF7F00',
        strokeColor : '#FF7F00',
        textColor : '#0000FF',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3
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
            fixed: true
        }
    },

    /* special polygon options */
    polygon : {
        fillColor : '#00FF00',
        highlightFillColor : '#00FF00',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3
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
        fontSize : 12,
        digits: 2,
        isLabel: false,
        strokeColor : '#000000',
        useASCIIMathML : false,
        useMathJax : false,
        display : 'html',                    //'html' or 'internal'
        withLabel: false
    },

    /* special curve options */
    curve : {
        strokeWidth : '1px',
        strokeColor : '#0000ff',
        RDPsmoothing : false,       // Apply the Ramen-Douglas-Peuker algorithm
        numberPointsHigh : 1600,  // Number of points on curves after mouseUp
        numberPointsLow : 400,    // Number of points on curves after mousemove
        doAdvancedPlot : true       // Use the algorithm by Gillam and Hohenwarter
                                 // It is much slower, but the result is better
    },

    /* precision options */
    precision : {
        touch    : 30,
        mouse    : 4,
        epsilon  : 0.0001,
        hasPoint : 4
    },

    // Default ordering of the layers
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
        validateScreenCoords = function (v) {
            return v.length >= 2 && validateInteger(v[0]) && validateInteger(v[1]);
        },
        validateRenderer = function (v) {
            return (v in {vml: 0, svg: 0, canvas: 0});
        };

    return {
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
        maxTicksDistance : validateInteger,
        minorHeight : validateInteger,
        minorTicks : validateInteger,
        minTicksDistance : validateInteger,
        numberPointsHigh : validateInteger,
        numberPointsLow : validateInteger,
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
        snapSizeY : JXG.isNumger,
        snapToGrid : false,
        straightFirst : false,
        straightLast : false,
        stretch: false,
        strokeColor : validateColor,
        strokeOpacity: JXG.isNumber,
        strokeWidth : validatePixel,
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
})();


/**
 * Apply the options stored in this object to all objects on the given board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 */
JXG.useStandardOptions = function(board) {
    var o = JXG.Options,
        boardHadGrid = board.hasGrid,
        el, t, p;

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

    for(el in board.objects) {
        p = board.objects[el];
        if(p.elementClass == JXG.OBJECT_CLASS_POINT) {
            p.visProp['fillColor'] = o.point.fillColor;
            p.visProp['highlightFillColor'] = o.point.highlightFillColor;
            p.visProp['strokeColor'] = o.point.strokeColor;
            p.visProp['highlightStrokeColor'] = o.point.highlightStrokeColor;
        }
        else if(p.elementClass == JXG.OBJECT_CLASS_LINE) {
            p.visProp['fillColor'] = o.line.fillColor;
            p.visProp['highlightFillColor'] = o.line.highlightFillColor;
            p.visProp['strokeColor'] = o.line.strokeColor;
            p.visProp['highlightStrokeColor'] = o.line.highlightStrokeColor;
            for(t in p.ticks) {
                t.majorTicks = o.line.ticks.majorTicks;
                t.minTicksDistance = o.line.ticks.minTicksDistance;
                t.minorHeight = o.line.ticks.minorHeight;
                t.majorHeight = o.line.ticks.majorHeight;
            }
        }
        else if(p.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
            p.visProp['fillColor'] = o.circle.fillColor;
            p.visProp['highlightFillColor'] = o.circle.highlightFillColor;
            p.visProp['strokeColor'] = o.circle.strokeColor;
            p.visProp['highlightStrokeColor'] = o.circle.highlightStrokeColor;
        }
        else if(p.type == JXG.OBJECT_TYPE_ANGLE) {
            p.visProp['fillColor'] = o.angle.fillColor;
            p.visProp['highlightFillColor'] = o.angle.highlightFillColor;
            p.visProp['strokeColor'] = o.angle.strokeColor;
        }
        else if(p.type == JXG.OBJECT_TYPE_ARC) {
            p.visProp['fillColor'] = o.arc.fillColor;
            p.visProp['highlightFillColor'] = o.arc.highlightFillColor;
            p.visProp['strokeColor'] = o.arc.strokeColor;
            p.visProp['highlightStrokeColor'] = o.arc.highlightStrokeColor;
        }
        else if(p.type == JXG.OBJECT_TYPE_POLYGON) {
            p.visProp['fillColor'] = o.polygon.fillColor;
            p.visProp['highlightFillColor'] = o.polygon.highlightFillColor;
            p.visProp['fillOpacity'] = o.polygon.fillOpacity;
            p.visProp['highlightFillOpacity'] = o.polygon.highlightFillOpacity;
        }
        else if(p.type == JXG.OBJECT_TYPE_CONIC) {
            p.visProp['fillColor'] = o.conic.fillColor;
            p.visProp['highlightFillColor'] = o.conic.highlightFillColor;
            p.visProp['strokeColor'] = o.conic.strokeColor;
            p.visProp['highlightStrokeColor'] = o.conic.highlightStrokeColor;
        }
        else if(p.type == JXG.OBJECT_TYPE_CURVE) {
            p.visProp['strokeColor'] = o.curve.strokeColor;
        }
    }
    for(el in board.objects) {
        p = board.objects[el];
        if(p.type == JXG.OBJECT_TYPE_SECTOR) {
            p.arc.visProp['fillColor'] = o.sector.fillColor;
            p.arc.visProp['highlightFillColor'] = o.sector.highlightFillColor;
            p.arc.visProp['fillOpacity'] = o.sector.fillOpacity;
            p.arc.visProp['highlightFillOpacity'] = o.sector.highlightFillOpacity;
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
    o = JXG.Options;
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
