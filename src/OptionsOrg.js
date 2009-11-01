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
 * Constructs a new Options object.
 * @class These are the default options of the board and
 * of all geometry elements.
 * @constructor
 */
JXG.Options = function() {
    /* Options that are used directly within the board class */
    this.fontSize = 12;
    this.showCopyright = true;
    this.showNavigation = true;
    this.takeSizeFromFile = true; // If true, the construction - when read from a file or string - the size of the div can be changed.

    /* grid options */
    this.grid = new Object();
    /* grid styles */
    this.grid.hasGrid = false;
    this.grid.gridX = 2;
    this.grid.gridY = 2;
    this.grid.gridColor = '#C0C0C0';
    this.grid.gridOpacity = '0.5';
    this.grid.gridDash = true;
    /* snap to grid options */
    this.grid.snapToGrid = false;
    this.grid.snapSizeX = 2;
    this.grid.snapSizeY = 2;

    /* zoom options */
    this.zoom = new Object();
    this.zoom.factor = 1.25;

    /* geometry element options */
    this.elements = new Object();
    /* color options */
    this.elements.color = new Object();
    this.elements.color.strokeOpacity = 1;
    this.elements.color.highlightStrokeOpacity = 1;
    this.elements.color.fillOpacity = 1;
    this.elements.color.highlightFillOpacity = 1;

    this.elements.color.strokeColor = '#0000ff';
    this.elements.color.highlightStrokeColor = '#C3D9FF';
    this.elements.color.fillColor = 'none';
    this.elements.color.highlightFillColor = 'none';

    this.elements.strokeWidth = '2px';

    /*draft options */
    this.elements.draft = new Object();
    this.elements.draft.draft = false;
    this.elements.draft.color = '#565656';
    this.elements.draft.opacity = 0.8;
    this.elements.draft.strokeWidth = '1px';

    /* special point options */
    this.point = new Object();
    this.point.style = 5; //1;
    this.point.fillColor = '#ff0000';
    this.point.highlightFillColor = '#EEEEEE';
    this.point.strokeColor = this.elements.color.strokeColor;
    this.point.highlightStrokeColor = this.elements.color.highlightStrokeColor;

    /* special line options */
    this.line = new Object();
    this.line.firstArrow = false;
    this.line.lastArrow = false;
    this.line.straightFirst = true;
    this.line.straightLast = true;
    this.line.fillColor = this.elements.color.fillColor;
    this.line.highlightFillColor = this.elements.color.highlightFillColor;
    this.line.strokeColor = '#000000';          //this.elements.color.strokeColor;
    this.line.highlightStrokeColor = '#888888'; //this.elements.color.highlightStrokeColor;
    /* line ticks options */
    this.line.ticks = new Object();
    this.line.ticks.drawLabels = true;
    this.line.ticks.drawZero = false;
    this.line.ticks.insertTicks = false;
    this.line.ticks.minTicksDistance = 50; //100; (AW)
    this.line.ticks.maxTicksDistance = 300;
    this.line.ticks.minorHeight = 4;
    this.line.ticks.majorHeight = 10;
    this.line.ticks.minorTicks = 4;
    this.line.ticks.defaultDistance = 1;

    /*special circle options */
    this.circle = new Object();
    this.circle.fillColor = this.elements.color.fillColor;
    this.circle.highlightFillColor = this.elements.color.highlightFillColor;
    this.circle.strokeColor = this.elements.color.strokeColor;
    this.circle.highlightStrokeColor = this.elements.color.highlightStrokeColor;

    /* special angle options */
    this.angle = new Object();
    this.angle.radius = 1.0;
    this.angle.fillColor = '#FF7F00';
    this.angle.highlightFillColor = '#FF7F00';
    this.angle.strokeColor = '#FF7F00';
    this.angle.fillOpacity = 0.3;
    this.angle.highlightFillOpacity = 0.3;

    /* special arc options */
    this.arc = new Object();
    this.arc.firstArrow = false;
    this.arc.lastArrow = false;
    this.arc.fillColor = this.elements.color.fillColor;
    this.arc.highlightFillColor = this.elements.color.highlightFillColor;
    this.arc.strokeColor = this.elements.color.strokeColor;
    this.arc.highlightStrokeColor = this.elements.color.highlightStrokeColor;

    /* special polygon options */
    this.polygon = new Object();
    this.polygon.fillColor = '#00FF00';
    this.polygon.highlightFillColor = '#00FF00';
    this.polygon.fillOpacity = 0.3;
    this.polygon.highlightFillOpacity = 0.3;

    /* special sector options */
    this.sector = new Object();
    this.sector.fillColor = '#00FF00';
    this.sector.highlightFillColor = '#00FF00';
    this.sector.fillOpacity = 0.3;
    this.sector.highlightFillOpacity = 0.3;

    /* special text options */
    this.text = new Object();
    this.text.strokeColor = '#000000';
    this.text.useASCIIMathML = true;
    this.text.defaultType = 'html'; //'html' or 'internal'

    /* special curve options */
    this.curve = new Object();
    this.curve.strokeWidth = '1px';
    this.curve.strokeColor = this.elements.color.strokeColor;
    this.curve.RDPsmoothing = false; // Apply the Ramen-Douglas-Peuker algorithm
    this.curve.numberPointsHigh = 1600; // Number of points on curves after mouseUp
    this.curve.numberPointsLow = 400;   // Number of points on curves after mousemove
    this.curve.doAdvancedPlot = true;   // Use the algorithm by Gillam and Hohenwarter
                                        // It is much slower, but the result is better
    
    /* precision options */
    this.precision = new Object();
    this.precision.hasPoint = 4;
    this.precision.epsilon = 0.0001;

};

/**
 * Apply the options stored in this object to all objects on the given board.
 * @param {JXG.Board} board The board to which objects the options will be applied.
 */
JXG.Options.prototype.useStandardOptions = function(board) {
    var boardHadGrid = board.hasGrid;
    board.hasGrid = this.grid.hasGrid;
    board.gridX = this.grid.gridX;
    board.gridY = this.grid.gridY;
    board.gridColor = this.grid.gridColor;
    board.gridOpacity = this.grid.gridOpacity;
    board.gridDash = this.grid.gridDash;
    board.snapToGrid = this.grid.snapToGrid;
    board.snapSizeX = this.grid.SnapSizeX;
    board.snapSizeY = this.grid.SnapSizeY;
    board.takeSizeFromFile = this.takeSizeFromFile;

    for(var el in board.objects) {
        if(board.objects[el].type == JXG.OBJECT_TYPE_POINT) {
            board.objects[el].visProp['fillColor'] = this.point.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.point.highlightFillColor;
            board.objects[el].visProp['strokeColor'] = this.point.strokeColor;
            board.objects[el].visProp['highlightStrokeColor'] = this.point.highlightStrokeColor;
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_LINE) {
            board.objects[el].visProp['fillColor'] = this.line.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.line.highlightFillColor;
            board.objects[el].visProp['strokeColor'] = this.line.strokeColor;
            board.objects[el].visProp['highlightStrokeColor'] = this.line.highlightStrokeColor;
            for(var t in board.objects[el].ticks) {
                t.majorTicks = this.line.ticks.majorTicks;
                t.minTicksDistance = this.line.ticks.minTicksDistance;
                t.minorHeight = this.line.ticks.minorHeight;
                t.majorHeight = this.line.ticks.majorHeight;
            }
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_CIRCLE) {
            board.objects[el].visProp['fillColor'] = this.circle.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.circle.highlightFillColor;
            board.objects[el].visProp['strokeColor'] = this.circle.strokeColor;
            board.objects[el].visProp['highlightStrokeColor'] = this.circle.highlightStrokeColor;
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_ANGLE) {
            board.objects[el].visProp['fillColor'] = this.angle.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.angle.highlightFillColor;
            board.objects[el].visProp['strokeColor'] = this.angle.strokeColor;
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_ARC) {
            board.objects[el].visProp['fillColor'] = this.arc.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.arc.highlightFillColor;
            board.objects[el].visProp['strokeColor'] = this.arc.strokeColor;
            board.objects[el].visProp['highlightStrokeColor'] = this.arc.highlightStrokeColor;
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_POLYGON) {
            board.objects[el].visProp['fillColor'] = this.polygon.fillColor;
            board.objects[el].visProp['highlightFillColor'] = this.polygon.highlightFillColor;
            board.objects[el].visProp['fillOpacity'] = this.polygon.fillOpacity;
            board.objects[el].visProp['highlightFillOpacity'] = this.polygon.highlightFillOpacity;
        }
        else if(board.objects[el].type == JXG.OBJECT_TYPE_CURVE) {
            board.objects[el].visProp['strokeColor'] = this.curve.strokeColor;
        }
    }
    for(var el in board.objects) {
        if(board.objects[el].type == JXG.OBJECT_TYPE_SECTOR) {
            board.objects[el].arc.visProp['fillColor'] = this.sector.fillColor;
            board.objects[el].arc.visProp['highlightFillColor'] = this.sector.highlightFillColor;
            board.objects[el].arc.visProp['fillOpacity'] = this.sector.fillOpacity;
            board.objects[el].arc.visProp['highlightFillOpacity'] = this.sector.highlightFillOpacity;
        }
    }

    board.needsFullUpdate = true;
    board.update();
    board.needsFullUpdate = false;
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
JXG.Options.prototype.useBlackWhiteOptions = function(board) {
    this.point.fillColor = this.changeColorToBlackWhite(this.point.fillColor);
    this.point.highlightFillColor = this.changeColorToBlackWhite(this.point.highlightFillColor);
    this.point.strokeColor = this.changeColorToBlackWhite(this.point.strokeColor);
    this.point.highlightStrokeColor = this.changeColorToBlackWhite(this.point.highlightStrokeColor);

    this.line.fillColor = this.changeColorToBlackWhite(this.line.fillColor);
    this.line.highlightFillColor = this.changeColorToBlackWhite(this.line.highlightFillColor);
    this.line.strokeColor = this.changeColorToBlackWhite(this.line.strokeColor);
    this.line.highlightStrokeColor = this.changeColorToBlackWhite(this.line.highlightStrokeColor);

    this.circle.fillColor = this.changeColorToBlackWhite(this.circle.fillColor);
    this.circle.highlightFillColor = this.changeColorToBlackWhite(this.circle.highlightFillColor);
    this.circle.strokeColor = this.changeColorToBlackWhite(this.circle.strokeColor);
    this.circle.highlightStrokeColor = this.changeColorToBlackWhite(this.circle.highlightStrokeColor);

    this.arc.fillColor = this.changeColorToBlackWhite(this.arc.fillColor);
    this.arc.highlightFillColor = this.changeColorToBlackWhite(this.arc.highlightFillColor);
    this.arc.strokeColor = this.changeColorToBlackWhite(this.arc.strokeColor);
    this.arc.highlightStrokeColor = this.changeColorToBlackWhite(this.arc.highlightStrokeColor);

    this.polygon.fillColor = this.changeColorToBlackWhite(this.polygon.fillColor);
    this.polygon.highlightFillColor  = this.changeColorToBlackWhite(this.polygon.highlightFillColor);

    this.sector.fillColor = this.changeColorToBlackWhite(this.sector.fillColor);
    this.sector.highlightFillColor  = this.changeColorToBlackWhite(this.sector.highlightFillColor);

    this.curve.strokeColor = this.changeColorToBlackWhite(this.curve.strokeColor);

    this.grid.gridColor = this.changeColorToBlackWhite(this.grid.gridColor);

    this.useStandardOptions(board);
};

/**
 * Decolorizes the given color.
 * @param {String} color HTML string containing the HTML color code.
 * @type String
 * @return Returns a HTML color string
 */
JXG.Options.prototype.changeColorToBlackWhite = function(color) {
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
JXG.Options.prototype.loadFromFile = function(fileurl, applyTo, board) {
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
JXG.Options.prototype.parseString = function(text, applyTo, board) {
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
       this.useStandardOptions(board);
   }
};
