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
JXG.OBJECT_TYPE_ARC  = 0x4F544143;                 // Hex fuer OTAC = Object Type ArC
JXG.OBJECT_TYPE_ARROW  = 0x4F544157;                 // Hex fuer OTAW = Object Type ArroW
JXG.OBJECT_TYPE_AXIS  = 0x4F544158;                 // Hex fuer OTAW = Object Type AXis
JXG.OBJECT_TYPE_CIRCLE  = 0x4F54434C;                 // Hex fuer OTLN = Object Type CirCle 
JXG.OBJECT_TYPE_CURVE  = 0x4F544750;                 // Hex fuer OTPY = Object Type GraphPlot 
JXG.OBJECT_TYPE_IMAGE  = 0x4F54524D;                 // Hex fuer OTPY = Object Type IMage
JXG.OBJECT_TYPE_LINE  = 0x4F544C4E;                 // Hex fuer OTLN = Object Type LiNe
JXG.OBJECT_TYPE_POINT  = 0x4F545054;                 // Hex fuer OTPT = Object Type PoinT
JXG.OBJECT_TYPE_SLIDER = 0x4F545344;                 // Hex fuer OTSD = Object Type SliDer
JXG.OBJECT_TYPE_CAS    = 0x4F544350;                 // Hex fuer OTCP = Object Type CasPoint
JXG.OBJECT_TYPE_POLYGON  = 0x4F545059;                 // Hex fuer OTPY = Object Type PolYgon
JXG.OBJECT_TYPE_SECTOR  = 0x4F545343;                 // Hex fuer OTSC = Object Type SeCtor
JXG.OBJECT_TYPE_TEXT  = 0x4F545445;                 // Hex fuer OTTE = Object Type TextElement 
JXG.OBJECT_TYPE_ANGLE = 0x4F544147;                 // Hex fuer OTAG = Object Type AnGle
JXG.OBJECT_TYPE_INTERSECTION = 0x4F54524E;          // Hex fuer OTIN = Object Type INtersection 

JXG.OBJECT_CLASS_POINT = 1;                
JXG.OBJECT_CLASS_LINE = 2;                
JXG.OBJECT_CLASS_CIRCLE = 3;                
JXG.OBJECT_CLASS_CURVE = 4;                
JXG.OBJECT_CLASS_AREA = 5;                
JXG.OBJECT_CLASS_OTHER = 6;                
 
/**
 * Constructs a new GeometryElement object.
 * @class This is the basic class for geometry elements like points,
 * circles and lines.  
 * There should be a translation table in each renderer.
 * @constructor
 */
JXG.GeometryElement = function() {
    /**
     * Reference to board where the element is drawn
     * @type Board
     * @see Board
     */
    this.board = null;
    
    /**
     * Unique identifier for the element. Equivalent to id-attribute of renderer element.
     * @type String
     */
    this.id = '';

    /**
     * Controls if updates are necessary
     * @type bool
     */
    this.needsUpdate = true;
    
    /**
     * Not necessarily unique name for the element
     * @type String
     * @see Board#generateName
     */
    this.name = '';
    
    /**
     * An associative array containing all visual properties.
     * @type Object
     */
    this.visProp = {};

    this.isReal = true;

    /** 
    Determines the elements border-style.
    Possible values are:
    <ul><li>0 for a solid line</li>
    <li>1 for a dotted line</li>
    <li>2 for a line with small dashes</li>
    <li>3 for a line with medium dashes</li>
    <li>4 for a line with big dashes</li>
    <li>5 for a line with alternating medium and big dashes and large gaps</li>
    <li>6 for a line with alternating medium and big dashes and small gaps</li>
    @type int
    */
    this.visProp['dash'] = 0;    
    
    /**
     * Stores all dependent objects to be updated when this point is moved.
     * @type Object
     */
    this.childElements = {};
    
    
    /** 
     * Stores all Intersection Objects which in this moment are not real and
     * so hide this element.
     * @type Object
     */
    this.notExistingParents = {};
    
    /**
     * If element is traceable, this property has to be true, false otherwise.
     * @see #clearTrace
     * @see #traces
     * @see #numTraces
     * @type bool
     */
    this.traced = false;
    
    /**
     * Keeps track of all objects drawn as part of the trace of the element.
     * @see #traced
     * @see #clearTrace
     * @see #numTraces
     * @type Object
     */
    this.traces = {};
    
    /**
     * Counts the number of objects drawn as part of the trace of the element.
     * @see #traced
     * @see #clearTrace
     * @see #traces
     * @type int
     */
    this.numTraces = 0;

 /**
     * Stores the  transformations which are applied during update in an array
     * @type Array
     * @see Transformation
     */
    this.transformations = [];
    this.baseElement = null;
    
    this.descendants = {};
    this.ancestors = {};

/**
  * [c,b0,b1,a,k,r,q0,q1]
  *
  * See 
  * A.E. Middleditch, T.W. Stacey, and S.B. Tor:
  * "Intersection Algorithms for Lines and Circles"
  * ACM Transactions on Graphics, Vol. 8, 1, 1989, pp 25-40.
  *
  * The meaning of the parameters is:
  * Circle: points p=[p0,p1] on the circle fulfill
  *  a<p,p> + <b,p> + c = 0
  * For convenience we also store
  *  r: radius
  *  k: discriminant = sqrt(<b,b>-4ac)
  *  q=[q0,q1] center
  *  
  * Points have radius  = 0
  * Lines have radius = infinity
  * b: normalized vector, representing the direction of the line
  *  
  * Should be put into Coords, when all elements possess Coords
  */
    this.stdform = [1,0,0,0,1, 1,0,0];
    
    this.afterFirstUpdate = false;
    this.needsRegularUpdate = true;
};

/**
 * Initialises board, id and name which cannot be initialised properly in the constructor.
 * @param {String,Board} board The board the new point is drawn on.
 * @param {String} id Unique identifier for the point. If null or an empty string is given,
 *  an unique id will be generated by Board
 * @param {String} name Not necessarily unique name for the point. If null or an
 *  empty string is given, an unique name will be generated
 */
JXG.GeometryElement.prototype.init = function(board, id, name) {
    /*
     * Parameter magic, if board is a string, assume it is an if of an object of
     * type Board an get the boards reference.
     */
    if (typeof(board) == 'string') {
        board = JXG.JSXGraph.boards[board];
    }
    
    this.board = board;

    this.id = id;

    /* If name is not set or null or even undefined, generate an unique name for this object */
    if ( /*(name != '') &&*/ (name != null) && (typeof name != 'undefined') ) {
        name = name;
    } else {
        name = this.board.generateName(this);
    }
    this.board.elementsByName[name] = this;
    this.name = name;
    
    this.visProp['strokeColor'] = this.board.options.elements.color.strokeColor //'#36393D';
    this.visProp['highlightStrokeColor'] = this.board.options.elements.color.highlightStrokeColor;
    this.visProp['fillColor'] = this.board.options.elements.color.fillColor;
    this.visProp['highlightFillColor'] = this.board.options.elements.color.highlightFillColor;
    
    this.visProp['strokeWidth'] = this.board.options.elements.strokeWidth;
    
    this.visProp['strokeOpacity'] = this.board.options.elements.color.strokeOpacity;
    this.visProp['highlightStrokeOpacity'] = this.board.options.elements.color.highlightStrokeOpacity;
    this.visProp['fillOpacity'] = this.board.options.elements.color.fillOpacity;    
    this.visProp['highlightFillOpacity'] = this.board.options.elements.color.highlightFillOpacity;   
    
    this.visProp['draft'] = this.board.options.elements.draft.draft;    
};

/**
 * Add an object as child. 
 * @param {obj} The dependent object
 */
JXG.GeometryElement.prototype.addChild = function (obj) {
    this.childElements[obj.id] = obj;
    
    this.addDescendants(obj);
    
    obj.ancestors[this.id] = this;
    for(var el in this.descendants) {
        this.descendants[el].ancestors[this.id] = this;
        for(var el2 in this.ancestors) {
            this.descendants[el].ancestors[this.ancestors[el2].id] = this.ancestors[el2];
        }
    }
    for(var el in this.ancestors) {
        for(var el2 in this.descendants) {
            this.ancestors[el].descendants[this.descendants[el2].id] = this.descendants[el2];
        }
    }
};

JXG.GeometryElement.prototype.addDescendants = function (obj) {
    this.descendants[obj.id] = obj;
    for(el in obj.childElements) {
        this.addDescendants(obj.childElements[el]);
    }
};

/**
 * Provide update method
 */
JXG.GeometryElement.prototype.update = function() {
    if(this.traced) {
        this.cloneToBackground(true);
    }
};

/**
 * Provide updateRenderer method
 */
JXG.GeometryElement.prototype.updateRenderer = function() {
};

/**
 * Hide the element.
 */
JXG.GeometryElement.prototype.hideElement = function() {
    this.visProp['visible'] = false;
    this.board.renderer.hide(this);
    if (this.label!=null) {
        this.label.hiddenByParent = true;
        if(this.label.show) {
            this.board.renderer.hide(this.label);
            this.label.show = true;
        }
    }
};

/**
 * Make the element visible.
 */
JXG.GeometryElement.prototype.showElement = function() {
    this.visProp['visible'] = true;
    this.board.renderer.show(this);
    if (this.label!=null && this.label.hiddenByParent) {
        this.label.hiddenByParent = false;
        if(this.label.show) {
            this.board.renderer.show(this.label);
        }
    }
};

/**
 * Sets an arbitrary number of properties 
 * @param Arbitrary number of strings, containing "key:value" pairs
 *<ul>Possible keys:</ul>
 *<li>strokeWidth</li>
 *<li>strokeColor</li>
 *<li>fillColor</li> 
 *<li>highlightFillColor</li>
 *<li>highlightStrokeColor</li> 
  *<li>strokeOpacity</li>
 *<li>fillOpacity</li> 
 *<li>highlightFillOpacity</li>
 *<li>highlightStrokeOpacity</li> 
 *<li>labelColor</li>
 *<li>visible</li>
 *<li>dash</li>
 *<li>trace</li>
 *<li>style <i>(Point)</i></li>
 *<li>fixed</li>
 *<li>draft</li>
 *<li>straightFirst <i>(Line)</i></li>
 *<li>straightLast <i>(Line)</i></li>
 *<li>firstArrow <i>(Line,Arc)</li>
 *<li>lastArrow <i>(Line,Arc)</li>
 *<li>withTicks <i>(Line)</li>
 *</ul>
 */
JXG.GeometryElement.prototype.setProperty = function () {
    var color;
    var opacity;
    var pair;
    for (var i=0; i<arguments.length; i++) {
        var pairRaw = arguments[i];
        if (typeof pairRaw == 'string') {    // pairRaw is string of the form 'key:value'
            pair = pairRaw.split(':');
        } else if (!Object.isArray(pairRaw)) {    // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
            for (var i=0; i<Object.keys(pairRaw).length;i++) {  // Here, the prototype lib is used (Object.keys, Object.isArray)
                var key = Object.keys(pairRaw)[i];
                this.setProperty([key,pairRaw[key]]);
            }
            return;
        } else {                             // pairRaw consists of array [key,value]
            pair = pairRaw;
        }

        switch(pair[0].replace(/\s+/g).toLowerCase()) {   // Whitespace entfernt und in Kleinbuchstaben umgewandelt.
            case 'strokewidth':
                this.visProp['strokeWidth'] = pair[1];
                this.board.renderer.setObjectStrokeWidth(this, this.visProp['strokeWidth']);
                break;
            case 'strokecolor':
                color = pair[1];                
                if (color.length=='9' && color.substr(0,1)=='#') {
                    opacity = color.substr(7,2);                
                    color = color.substr(0,7);
                }
                else { 
                    opacity = 'FF';
                }
                this.visProp['strokeColor'] = color;
                this.visProp['strokeOpacity'] = parseInt(opacity.toUpperCase(),16)/255;
                this.board.renderer.setObjectStrokeColor(this, this.visProp['strokeColor'], this.visProp['strokeOpacity']);                
                break;
            case 'fillcolor':
                color = pair[1];
                if (color.length=='9' && color.substr(0,1)=='#') {
                    opacity = color.substr(7,2);
                    color = color.substr(0,7);
                }
                else { 
                    opacity = 'FF';
                }                
                this.visProp['fillColor'] = color;
                this.visProp['fillOpacity'] = parseInt(opacity.toUpperCase(),16)/255;    
                this.board.renderer.setObjectFillColor(this, this.visProp['fillColor'], this.visProp['fillOpacity']);    
                break;
            case 'highlightstrokecolor':
                color = pair[1];
                if (color.length=='9' && color.substr(0,1)=='#') {
                    opacity = color.substr(7,2);
                    color = color.substr(0,7);
                }
                else {
                    opacity = 'FF';
                }
                this.visProp['highlightStrokeColor'] = color;
                this.visProp['highlightStrokeOpacity'] = parseInt(opacity.toUpperCase(),16)/255;                
                break;
            case 'highlightfillcolor':
                color = pair[1];
                if (color.length=='9' && color.substr(0,1)=='#') {
                    opacity = color.substr(7,2);
                    color = color.substr(0,7);
                }
                else {
                    opacity = 'FF';
                }
                this.visProp['highlightFillColor'] = color;
                this.visProp['highlightFillOpacity'] = parseInt(opacity.toUpperCase(),16)/255;                
                break;
            case 'fillopacity':
                this.visProp['fillOpacity'] = pair[1];
                this.board.renderer.setObjectFillColor(this, this.visProp['fillColor'], this.visProp['fillOpacity']);                
                break;
            case 'strokeopacity':
                this.visProp['strokeOpacity'] = pair[1];
                this.board.renderer.setObjectStrokeColor(this, this.visProp['strokeColor'], this.visProp['strokeOpacity']);                 
                break;        
            case 'highlightfillopacity':
                this.visProp['highlightFillOpacity'] = pair[1];
                break;
            case 'strokeopacity':
                this.visProp['highlightStrokeOpacity'] = pair[1];
                break;
            case 'labelcolor': // wird derzeit nur umgesetzt, falls opacity = 0 ==> label wird versteckt
                color = pair[1];
                if (color.length=='9' && color.substr(0,1)=='#') {
                    opacity = color.substr(7,2);
                    color = color.substr(0,7);
                }
                else {
                    opacity = 'FF';
                }
                if(opacity == '00') {
                    if (this.label!=null) {
                        this.label.hideElement();
                    }
                } 
                if(this.label!=null) {
                    this.label.color = color;
                    this.board.renderer.setLabelColor(this.label);
                }
                if(this.type == JXG.OBJECT_TYPE_TEXT) {
                    this.visProp['strokeColor'] = color;
                    this.board.renderer.setObjectStrokeColor(this, this.visProp['strokeColor'], 1);    
                }
                break;            
            case 'visible':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.visProp['visible'] = false;
                    this.hideElement();
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['visible'] = true;
                    this.showElement();
                }
                break;
            case 'dash':
                this.setDash(pair[1]);
                break;
            case 'trace':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.traced = false;
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.traced = true;
                }
                break;
            case 'style':
                this.setStyle(1*pair[1]);
                break;
            case 'fixed':          
                this.fixed = (pair[1]=='false') ? false : true;
                break;
            case 'draft': 
                if(pair[1] == 'false' || pair[1] == false) {
                    if(this.visProp['draft'] == true) {
                        this.visProp['draft'] = false;
                        this.board.renderer.removeDraft(this);
                    }
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['draft'] = true;
                    this.board.renderer.setDraft(this);
                }            
                break;
            case 'straightfirst':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.visProp['straightFirst'] = false;
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['straightFirst'] = true;
                }    
                this.setStraight(this.visProp['straightFirst'], this.visProp['straightLast']);
                break;    
            case 'straightlast':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.visProp['straightLast'] = false;
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['straightLast'] = true;
                }            
                this.setStraight(this.visProp['straightFirst'], this.visProp['straightLast']);
                break;    
            case 'firstarrow':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.visProp['firstArrow'] = false;
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['firstArrow'] = true;
                }    
                this.setArrow(this.visProp['firstArrow'], this.visProp['lastArrow']);
                break;    
            case 'lastarrow':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.visProp['lastArrow'] = false;
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.visProp['lastArrow'] = true;
                }            
                this.setArrow(this.visProp['firstArrow'], this.visProp['lastArrow']);
                break;                   
            case 'withticks':
                if(pair[1] == 'false' || pair[1] == false) {
                    this.disableTicks();
                }
                else if(pair[1] == 'true' || pair[1] == true) {
                    this.enableTicks();
                }            
                break;                   
            case 'curvetype':
                this.curveType = pair[1];
                break;
            case 'fontsize':
                this.visProp['fontSize'] = pair[1];
                break;
        }
    }
};

/**
* Set the dash style of an object
 * @param {int} dash Indicates the new dash style
*/
JXG.GeometryElement.prototype.setDash = function(dash) {
    this.visProp['dash'] = dash;
    this.board.renderer.setObjectDash(this);
};

/**
 * Notify all child elements for updates.
 */
JXG.GeometryElement.prototype.prepareUpdate = function() {
    this.needsUpdate = true;
    return; // Im Moment steigen wir nicht rekursiv hinab
    /* End of function  */
    for(var Elements in this.childElements) {
        /* Wurde das Element vielleicht geloescht? */
        if(this.board.objects[Elements] != undefined) {
            /* Nein, wurde es nicht, also updaten */
            this.childElements[Elements].prepareUpdate(); 
        } else { /* es wurde geloescht, also aus dem Array entfernen */
            delete(this.childElements[Elements]);
        }
    }
};

/**
 * Remove the element from the drawing.
 */
JXG.GeometryElement.prototype.remove = function() {    
    this.board.renderer.remove($(this.id));
};

/**
 * 
 */
JXG.GeometryElement.prototype.getTextAnchor = function() {    
    return new JXG.Coords(JXG.COORDS_BY_USER, [0,0], this.board);
};

/**
 * 
 */
JXG.GeometryElement.prototype.setStyle = function(x) {    
};

/**
 * 
 */
JXG.GeometryElement.prototype.setStraight = function(x,y) {    
};


/**
 * Removes all objects generated by the trace function.
 */
JXG.GeometryElement.prototype.clearTrace = function() {
    for(var obj in this.traces) {
        this.board.renderer.remove(this.traces[obj]);
    }
    this.numTraces = 0;
};

/**
 * Copy element to background. Has to be implemented in the element itself.
 */
JXG.GeometryElement.prototype.cloneToBackground = function(addToTrace) {
    return;
};

// [c,b0,b1,a,k]
JXG.GeometryElement.prototype.normalize = function() {
    this.stdform = this.board.algebra.normalize(this.stdform);
};

/**
 * Experimental stuff 
 * Generate JSON of visProp and more
 */
JXG.GeometryElement.prototype.toJSON = function() {
    var json = '{"name":' + Object.toJSON(this.name);
    json += ', ' + '"id":' + Object.toJSON(this.id);

    var vis = [];
    for (var key in this.visProp) {
        if (this.visProp[key]!=null) {
            vis.push('"' + key + '":' + Object.toJSON(this.visProp[key]));
        }
    }
    json += ', "visProp":{'+vis.toString()+'}';
    json +='}';

    return json;
};
