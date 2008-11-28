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
    
    this.elements.draft = false;
    this.elements.strokeWidth = '2px';
    
    /* special point options */
    this.point = new Object();
    this.point.style = 1;
    this.point.fillColor = '#ff0000';
    this.point.highlightFillColor = '#EEEEEE';
    
    /* special line options */
    this.line = new Object();
    this.line.firstArrow = false;
    this.line.lastArrow = false;
    this.line.straightFirst = true;
    this.line.straightLast = true; 
    /* line ticks options */
    this.line.ticks = new Object();
    this.line.ticks.withTicks = false;
    this.line.ticks.ticksDelta = 1;
    
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
    
    /* precision options */
    this.precision = new Object();
    this.precision.hasPoint = 4;
    this.precision.epsilon = 0.0001;
    
}

JXG.GeometryElement.prototype.useBlackWhite = function() {
    
}