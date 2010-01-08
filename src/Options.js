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
 * Options object.
 * @class These are the default options of the board and
 * of all geometry elements.
 * @constructor
 */
JXG.Options = {
    /* Options that are used directly within the board class */
    fontSize : 12,
    showCopyright : true,
    showNavigation : true,
    takeSizeFromFile : false, // If true, the construction - when read from a file or string - the size of the div can be changed.
    renderer: 'svg',

    /* grid options */
    grid : {
        /* grid styles */
        hasGrid : false,
        gridX : 2,
        gridY : 2,
        gridColor : '#C0C0C0',
        gridOpacity : '0.5',
        gridDash : true,
        /* snap to grid options */
        snapToGrid : false,
        snapSizeX : 2,
        snapSizeY : 2
    },
    /* zoom options */
    zoom : {
        factor : 1.25
    },

    /* geometry element options */
    elements : {
        /* color options */
        color : {
            strokeOpacity : 1,
            highlightStrokeOpacity : 1,
            fillOpacity : 1,
            highlightFillOpacity : 1,

            strokeColor : '#0000ff',
            highlightStrokeColor : '#C3D9FF',
            fillColor : 'none',
            highlightFillColor : 'none'
        },
        strokeWidth : '2px',

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
        style : 5, //1;
        fillColor : '#ff0000',
        highlightFillColor : '#EEEEEE',
        strokeColor : '#ff0000', //'#0000ff',
        highlightStrokeColor : '#C3D9FF',
        zoom: false             // Change the point size on zoom
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
        /* line ticks options */
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
        }
    },

    /* special axis options */
    axis : {
        strokeColor : '#666666',
        highlightStrokeColor : '#888888'
    },
    
    /*special circle options */
    circle : {
        fillColor : 'none',
        highlightFillColor : 'none',
        strokeColor : '#0000ff',
        highlightStrokeColor : '#C3D9FF'
    },

    /* special angle options */
    angle : {
        radius : 1.0,
        fillColor : '#FF7F00',
        highlightFillColor : '#FF7F00',
        strokeColor : '#FF7F00',
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
        highlightStrokeColor : '#C3D9FF'
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
        fillColor : '#00FF00',
        highlightFillColor : '#00FF00',
        fillOpacity : 0.3,
        highlightFillOpacity : 0.3
    },

    /* special text options */
    text : {
        strokeColor : '#000000',
        useASCIIMathML : false,
        defaultDisplay : 'html' //'html' or 'internal'
    },

    /* special curve options */
    curve : {
        strokeWidth : '1px',
        strokeColor : '#0000ff',
        RDPsmoothing : false,    // Apply the Ramen-Douglas-Peuker algorithm
        numberPointsHigh : 1600, // Number of points on curves after mouseUp
        numberPointsLow : 400,   // Number of points on curves after mousemove
        doAdvancedPlot : true    // Use the algorithm by Gillam and Hohenwarter
                                 // It is much slower, but the result is better
    },

    /* precision options */
    precision : {
        hasPoint : 4,
        epsilon : 0.0001
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
        angle : 2,
        grid  : 1,
        image : 0 
    }
};

/**
 * Apply the options stored in this object to all objects on the given board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 */
JXG.useStandardOptions = function(board) {
    var o = JXG.Options,
        boardHadGrid = board.hasGrid,
        el, t;

    board.hasGrid = o.grid.hasGrid;
    board.gridX = o.grid.gridX;
    board.gridY = o.grid.gridY;
    board.gridColor = o.grid.gridColor;
    board.gridOpacity = o.grid.gridOpacity;
    board.gridDash = o.grid.gridDash;
    board.snapToGrid = o.grid.snapToGrid;
    board.snapSizeX = o.grid.SnapSizeX;
    board.snapSizeY = o.grid.SnapSizeY;
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
    if(boardHadGrid && board.hasGrid) {
        board.renderer.removeGrid(board);
        board.renderer.drawGrid(board);
    } else if(boardHadGrid && !board.hasGrid) {
        board.renderer.removeGrid(board);
    } else if(!boardHadGrid && board.hasGrid) {
        board.renderer.drawGrid(board);
    }
};

/**
 * Converts all color values to greyscale and calls useStandardOption to put them onto the board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 * @see #useStandardOptions
 */
JXG.useBlackWhiteOptions = function(board) {
    o = JXG.Options;
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
 * Load options from a file using FileReader
 * @param fileurl {String} URL to .json-file containing style information
 * @param apply {bool} <tt>true</tt> when options in file should be applied to board after being loaded.
 * @param board {JXG.Board} The board the options should be applied to.
 */
JXG.loadOptionsFromFile = function(fileurl, applyTo, board) {
   this.cbp = function(t) {
      this.parseString(t, applyTo, board);
   };
   this.cb = JXG.bind(this.cbp,this);

   JXG.FileReader.parseFileContent(fileurl, this.cb, 'raw');
};

/**
 * Apply options given as a string to a board.
 * @param text {String} Options given as a string in .json-Format
 * @param apply {bool} <tt>true</tt> if the options should be applied to all objects on the board.
 * @param board {JXG.Board} The board the options should be applied to.
 */
JXG.parseOptionsString = function(text, applyTo, board) {
   var newOptions = '';

   if(text != '') {
      newOptions = eval("(" + text + ")");
   }
   else
      return;

   var maxDepth = 10;
   var applyOption = function (base, option, depth) {
      if(depth==10)
         return;
      depth++;

      for(var key in option) {
         if((JXG.isNumber(option[key])) || (JXG.isArray(option[key])) || (JXG.isString(option[key])) || (option[key]==true) || (option[key]==false)) {
            base[key] = option[key];
         }
         else {
            applyOption(base[key], option[key], depth);
         }
      }
   };

   applyOption(this, newOptions, 0);

   if(applyTo && typeof board != 'undefined') {
       JXG.useStandardOptions(board);
   }
};
