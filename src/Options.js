/**
 * Constructs a new Options object.
 * @class These are the standard options of the board and 
 * all of the geometry elements
 * @constructor
 */
JXG.Options = function() {
    /* Options that are used directly within the board class */
    this.fontSize = 12;
    
    /* grid options */
    this.grid = new Object();
    /* grid styles */
    this.grid.hasGrid = false;
    this.grid.gridX = 2;
    this.grid.gridY = 2;
    this.grid.gridColor = '#C0C0C0';
    this.grid.gridOpacity = '1';
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
    this.line.strokeColor = this.elements.color.strokeColor;
    this.line.highlightStrokeColor = this.elements.color.highlightStrokeColor;
    /* line ticks options */
    this.line.ticks = new Object();
    this.line.ticks.withTicks = false;
    this.line.ticks.ticksDelta = 1;
    
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
    
    /* special curve options */
    this.curve = new Object();
    this.curve.strokeWidth = '1px';   
    this.curve.strokeColor = this.elements.color.strokeColor;
    
    /* precision options */
    this.precision = new Object();
    this.precision.hasPoint = 4;
    this.precision.epsilon = 0.0001;
    
}

JXG.Options.prototype.useStandardOptions = function(board) {
    board.hasGrid = this.grid.hasGrid;
    board.gridX = this.grid.gridX;
    board.gridY = this.grid.gridY;
    board.gridColor = this.grid.gridColor;   
    board.gridOpacity = this.grid.gridOpacity;
    board.gridDash = this.grid.gridDash;    
    board.snapToGrid = this.grid.snapToGrid;
    board.snapSizeX = this.grid.SnapSizeX;
    board.snapSizeY = this.grid.SnapSizeY;

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
    
    board.fullUpdate = true;
    board.update();
    board.fullUpdate = false;
    if(board.hasGrid) {
        board.renderer.removeGrid(board);
        board.renderer.drawGrid(board);
    }    
}

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
}

JXG.Options.prototype.changeColorToBlackWhite = function(color,x) {
    if(color == 'blue') {
        color = '#0000FF';
    }
    else if(color == 'red') {
        color = '#FF0000';
    }
    else if(color == 'lime') {
        color = '#00FF00';
    }
    else if(color == 'black') {
        color = '#000000';
    }  
    else if(color == 'white') {
        color = '#FFFFFF';
    }
    else if(color == 'fuchsia') {
        color = '#FF00FF';
    }
    else if(color == 'aqua') {
        color = '#00FFFF';
    }
    else if(color == 'green') {
        color = '#003300';
    }
    else if(color == 'yellow') {
        color = '#FF0000';
    }   
    if(color.charAt(0) == '#') {
        var r = parseInt((color.substr(1,2)).toUpperCase(),16);
        var g = parseInt((color.substr(3,2)).toUpperCase(),16);
        var b = parseInt((color.substr(5,2)).toUpperCase(),16);      
        var x = 0.3*r + 0.59*g + 0.11*b;
        var HexChars="0123456789ABCDEF";              
        var tmp = HexChars.charAt((x>>4)&0xf)+HexChars.charAt(x&0xf);
        color = "#" + tmp + "" + tmp + "" + tmp;        
    }
    return color;
}