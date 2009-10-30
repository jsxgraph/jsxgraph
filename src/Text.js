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
 * @fileoverview In this file the Text element is defined.
 */


/**
 * Construct and handle texts.
 * @class Text: On creation the GEONExT syntax
 * of <value>-terms 
 * are converted into JavaScript syntax.
 * The coordinates can be relative to the coordinates of an element "element".
 * @constructor
 * @return A new geometry element Text
 */
JXG.Text = function (board, contentStr, element, coords, id, name, digits, isLabel, type) {
    this.constructor();

    this.type = JXG.OBJECT_TYPE_TEXT;
    this.elementClass = JXG.OBJECT_CLASS_OTHER;                

    this.init(board, id, name);

    this.contentStr = contentStr;
    this.plaintextStr = '';

    /**
     * There is choice between 'html' and 'internal'
     * 'internal' is the text element of SVG and the textpath element 
     * of VML.
     */
    this.type = type || 'html'; 
    
    if((typeof isLabel != 'undefined') && (isLabel != null)) {
        this.isLabel = isLabel;
    }
    else {
        this.isLabel = false;
    }
    
    /**
     * The text color of the given text.
     * @type {string}
     * @name JXG.Text#strokeColor
     */
    this.visProp['strokeColor'] = this.board.options.text.strokeColor;
    /**
     * The text opacity of the given text.
     * @type {string}
     * @name JXG.Text#strokeOpacity
     */
     /**
     * The font size of the given text.
     * @type {string}
     * @name JXG.Text#fontSize
     * @default {@link JXG.Options.fontSize}
     */


    this.visProp['visible'] = true;
    //this.show = true; // noch noetig? BV

    if (digits!=null) {
        this.digits = digits;
    } else {
        this.digits = 2;
    }

    /**
     * Coordinates of the text.
     * @ private
     * @type JXG.Coords
     */
    if ((this.element = this.board.objects[element])){
        var anchor;
        this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_USER, [parseFloat(coords[0]),parseFloat(coords[1])],this.board);     
        if(!this.isLabel) {
            anchor = this.element.getTextAnchor();
        }
        else {
            anchor = this.element.getLabelAnchor();
        }      
        this.element.addChild(this);
        this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.relativeCoords.usrCoords[1]+anchor.usrCoords[1],this.relativeCoords.usrCoords[2]+anchor.usrCoords[2]], this.board);
    } else {
        this.X = JXG.createFunction(coords[0],this.board,'');
        this.Y = JXG.createFunction(coords[1],this.board,'');
        this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.X(),this.Y()], this.board);
        var fs = 'this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.X(),this.Y()]);';
        this.updateCoords = new Function('',fs);
    }

    if (typeof this.contentStr=='function') {
        this.updateText = function() { this.plaintextStr = this.contentStr(); };
    } else {
        var plaintext;
        if (typeof this.contentStr=='number') {
            plaintext = (this.contentStr).toFixed(this.digits);  
        } else {
            if (this.board.options.text.useASCIIMathML) {
                plaintext = "'"+this.contentStr+"'";              // Convert via ASCIIMathML
            } else {
                plaintext = this.generateTerm(this.contentStr);   // Converts GEONExT syntax into JavaScript string
            }
        }
        this.updateText = new Function('this.plaintextStr = ' + plaintext + ';');
    }
    //this.updateText();                    // First evaluation of the string    
    if(!this.isLabel) {
        this.id = this.board.addText(this);
    }
    if (typeof this.contentStr=='string') {
        this.notifyParents(this.contentStr);
    }
};
JXG.Text.prototype = new JXG.GeometryElement();

/**
 * @private
 * Empty function (for the moment). It is needed for highlighting
 * @param {int} x
 * @param {int} y Find closest point on the text to (xy)
 * @return Always returns false
 */
JXG.Text.prototype.hasPoint = function (x,y) {
    return false;
};

/**
 * Overwrite the text.
 * @param {string,function} str
 * @return {object} reference to the text object.
 */
JXG.Text.prototype.setText = function(text) {
    var plaintext;
    if (typeof text=='number') {
        plaintext = (text).toFixed(this.digits);  
    } else {
        plaintext = this.generateTerm(text);   // Converts GEONExT syntax into JavaScript string
    }
    this.updateText = new Function('this.plaintextStr = ' + plaintext + ';');
    this.updateText();
    return this;
};

/**
 * Set the text to new, fixed coordinates.
 * @param {number} x
 * @param {number} y
 * @return {object} reference to the text object.
 */
JXG.Text.prototype.setCoords = function (x,y) {
    this.X = function() { return x; };
    this.Y = function() { return y; };
    this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
    return this;
};

/**
 * Evaluates the text.
 * Then, the update function of the renderer
 * is called. 
 */
JXG.Text.prototype.update = function () {
    if (this.needsUpdate) {
        if (this.relativeCoords){
            var anchor;
            if(!this.isLabel) {
                anchor = this.element.getTextAnchor();
            }
            else {
                anchor = this.element.getLabelAnchor();
            }
            this.coords.setCoordinates(JXG.COORDS_BY_USER, [this.relativeCoords.usrCoords[1]+anchor.usrCoords[1],this.relativeCoords.usrCoords[2]+anchor.usrCoords[2]]);
        } else {
            this.updateCoords();
        }
        this.updateText();
    }   
    return this;
};

/**
 * The update function of the renderer
 * is called. 
 * @private
 */
JXG.Text.prototype.updateRenderer = function () {
    if (this.needsUpdate) {
        this.board.renderer.updateText(this);
        this.needsUpdate = false;
    }
    return this;
};

/**
 * Converts the GEONExT syntax of the <value> terms into JavaScript.
 * Also, all Objects whose name appears in the term are searched and
 * the text is added as child to these objects.
 * @private
 * @see Algebra
 * @see #geonext2JS.
 */
JXG.Text.prototype.generateTerm = function (contentStr) {
    var res = null;
    var elements = this.board.elementsByName;
    var plaintext = '""';
    contentStr = contentStr.replace(/\r/g,''); 
    contentStr = contentStr.replace(/\n/g,''); 
    contentStr = contentStr.replace(/\"/g,'\\"'); 
    contentStr = contentStr.replace(/\'/g,"\\'"); 
    contentStr = contentStr.replace(/&amp;arc;/g,'&ang;'); 
    contentStr = contentStr.replace(/<arc\s*\/>/g,'&ang;'); 
    contentStr = contentStr.replace(/<sqrt\s*\/>/g,'&radic;'); 

    // Convert GEONExT syntax into  JavaScript syntax
    var i;
    //var i = contentStr.indexOf('<mp>');
    //contentStr = contentStr.slice(i+4);
    //i = contentStr.indexOf('</mp>');
    //contentStr = contentStr.slice(0,i);

    i = contentStr.indexOf('<value>');
    var j = contentStr.indexOf('</value>');
    if (i>=0) {
        while (i>=0) {
            plaintext += ' + "'+ this.board.algebra.replaceSub(this.board.algebra.replaceSup(contentStr.slice(0,i))) + '"';
            var term = contentStr.slice(i+7,j);
            var res = this.board.algebra.geonext2JS(term); 
            res = res.replace(/\\"/g,'"');
            res = res.replace(/\\'/g,"'");
            if (res.indexOf('toFixed')<0) {  // GEONExT-Hack: apply rounding once only.  
                plaintext += '+('+ res + ').toFixed('+(this.digits)+')';
            } else {
                plaintext += '+('+ res + ')';
            }
            contentStr = contentStr.slice(j+8);
            i = contentStr.indexOf('<value>');
            j = contentStr.indexOf('</value>');
        }
    } //else {
    plaintext += ' + "' + this.board.algebra.replaceSub(this.board.algebra.replaceSup(contentStr)) + '"';
    //}
    plaintext = plaintext.replace(/<overline>/g,'<span style=text-decoration:overline>');
    plaintext = plaintext.replace(/<\/overline>/g,'</span>');
    plaintext = plaintext.replace(/<arrow>/g,'<span style=text-decoration:overline>');
    plaintext = plaintext.replace(/<\/arrow>/g,'</span>');

/*    i = plaintext.indexOf('<name>');
    j = plaintext.indexOf('</name>');
    while (i>=0) {
        var head = plaintext.slice(0,i+6);
        var mid = plaintext.slice(i+6,j);
        var tail = plaintext.slice(j);
        mid = this.board.algebra.replaceSub(this.board.algebra.replaceSup(mid));
        plaintext = head + mid + tail;
        i = plaintext.indexOf('<name>',i+7);
        j = plaintext.indexOf('</name>',i+7);
    }
*/
    plaintext = plaintext.replace(/&amp;/g,'&'); // This should replace &amp;pi; by &pi;
    return plaintext;
};

/**
 * Finds dependencies in a given term and notifies the parents by adding the
 * dependent object to the found objects child elements.
 * @param {String} term String containing dependencies for the given object.
 * @private
 */
JXG.Text.prototype.notifyParents = function (contentStr) {
    var res = null;
    var elements = this.board.elementsByName;

    do {
        var search = /<value>([\w\s\*\/\^\-\+\(\)\[\],<>=!]+)<\/value>/;
        res = search.exec(contentStr);
        if (res!=null) {
            this.board.algebra.findDependencies(this,res[1]);
            contentStr = contentStr.substr(res.index);
            contentStr = contentStr.replace(search,'');
        }
    } while (res!=null);
    return this;
};

/**
 * @class This element is used to provide a constructor for text, which is just a wrapper for element {@link Text}. 
 * @pseudo
 * @description
 * @name Text
 * @augments JXG.GeometryElement
 * @constructor
 * @type JXG.Text
 *
 * @param {number,function_number,function_String,function} x,y,str Parent elements for text elements.
 *                     <p>
 *                     x and y are the coordinates of the lower left corner of the text box. The position of the text is fixed, 
 *                     x and y are numbers. The position is variable if x or y are functions.
 *                     <p>
 *                     The text to display may be given as string or as function returning a string.
 * @see JXG.Text
 * @example
 * // Create a fixed text at position [0,1].
 *   var t1 = board.createElement('text',[0,1,"Hello World"]); 
 * </pre><div id="896013aa-f24e-4e83-ad50-7bc7df23f6b7" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t1_board = JXG.JSXGraph.initBoard('896013aa-f24e-4e83-ad50-7bc7df23f6b7', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var t1 = t1_board.createElement('text',[0,1,"Hello World"]);
 * </script><pre>
 * @example
 * // Create a variable text at a variable position.
 *   var s = board.createElement('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var graph = board.createElement('text', 
 *                        [function(x){ return s.Value();}, 1,
 *                         function(){return "The value of s is"+s.Value().toFixed(2);}
 *                        ]
 *                     );
 * </pre><div id="5441da79-a48d-48e8-9e53-75594c384a1c" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t2_board = JXG.JSXGraph.initBoard('5441da79-a48d-48e8-9e53-75594c384a1c', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var s = t2_board.createElement('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var t2 = t2_board.createElement('text',[function(x){ return s.Value();}, 1, function(){return "The value of s is "+s.Value().toFixed(2);}]);
 * </script><pre>
 */
JXG.createText = function(board, parentArr, atts) {
    if (atts==null) {
        atts = {};
    }
    if (typeof atts['type']=='undefined') {
        atts['type'] = board.options.text.defaultType;  // 'html' or 'internal'
    }
    return new JXG.Text(board, parentArr[parentArr.length-1], null, parentArr, atts['id'], atts['name'], atts['digits'], false, atts['type']);
};

JXG.JSXGraph.registerElement('text', JXG.createText);
