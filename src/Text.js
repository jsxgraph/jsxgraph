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
JXG.Text = function (board, content, coords, attributes) {
    this.constructor(board, attributes, JXG.OBJECT_TYPE_TEXT, JXG.OBJECT_CLASS_OTHER);

    this.content = content;
    this.plaintext = '';

    if ((this.element = JXG.getRef(this.board, attributes.anchor))) {
        var anchor;
        if (this.visProp.islabel) {
            anchor = this.element.getLabelAnchor();
            this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [parseFloat(coords[0]), parseFloat(coords[1])], this.board);
        } else {
            anchor = this.element.getTextAnchor();
            this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_USER, [parseFloat(coords[0]), parseFloat(coords[1])], this.board);
        }
        this.element.addChild(this);

        this.coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, 
            [this.relativeCoords.scrCoords[1]+anchor.scrCoords[1],
             this.relativeCoords.scrCoords[2]+anchor.scrCoords[2]], this.board);
    } else {
        this.X = JXG.createFunction(coords[0],this.board,'');
        this.Y = JXG.createFunction(coords[1],this.board,'');
        this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.X(),this.Y()], this.board);
        var fs = 'this.coords.setCoordinates(JXG.COORDS_BY_USER,[this.X(),this.Y()]);';
        this.updateCoords = new Function('',fs);
    }

    if (typeof this.content === 'function') {
        this.updateText = function() { this.plaintext = this.content(); };
    } else {
        if (JXG.isNumber(this.content)) {
            this.content = (this.content).toFixed(this.visProp.digits);
        } else {
            if (this.visProp.useasciimathml) {
                this.content = "'`" + this.content + "`'";              // Convert via ASCIIMathML
            } else {
                this.content = this.generateTerm(this.content);   // Converts GEONExT syntax into JavaScript string
            }
        }
        this.updateText = new Function('this.plaintext = ' + this.content + ';');
    }

    this.updateText();                    // First evaluation of the content.
    
    this.id = this.board.setId(this, 'T');
    this.board.renderer.drawText(this);

    if(!this.visProp.visible) {
        this.board.renderer.hide(this);
    }
    
    if (typeof this.content === 'string') {
        this.notifyParents(this.content);
    }
    this.size = [1.0, 1.0];

    return this;
};
JXG.Text.prototype = new JXG.GeometryElement();

JXG.extend(JXG.Text.prototype, /** @lends JXG.Text.prototype */ {
    /**
     * @private
     * Empty function.
     * @param {Number} x
     * @param {Number} y Find closest point on the text to (xy)
     * @return {Boolean} Always returns false
     */
    hasPoint: function (x, y) {
        return false;
    },

    /**
     * Defines new content.
     * @param {String|function} text
     * @return {JXG.Text} Reference to the text object.
     */
    setText: function(text) {
        if (typeof text === 'function') {
            this.updateText = function() { this.plaintext = text(); };
        } else {
            if (JXG.isNumber(text)) {
                this.content = (text).toFixed(this.visProp.digits);
            } else {
                if (this.visProp.useasciimathml) {
                    this.content = "'`" + text + "`'";              // Convert via ASCIIMathML
                } else {
                    this.content = this.generateTerm(text);   // Converts GEONExT syntax into JavaScript string
                }
            }
            this.updateText = new Function('this.plaintext = ' + this.content + ';');
        }

        this.updateText();                    // First evaluation of the string.
                                              // Needed for display='internal' and Canvas
        this.updateSize();
        return this;
    },

    /**
     * Recompute the width and the height of the text box.
     * Update array this.size with pixel values.
     * The result may differ from browser to browser
     * by some pixels.
     * In IE and canvas we use a very crude estimation of the dimensions of
     * the textbox. 
     * In JSXGraph this.size is necessary for applying rotations in IE and
     * for aligning text.
     */
    updateSize: function () {
        // Here comes a very crude estimation of the dimensions of
        // the textbox. It is only necessary for the IE.
        if (this.display=='html' && this.board.renderer.type!='vml') {
            this.size = [this.rendNode.offsetWidth, this.rendNode.offsetHeight];
        } else if (this.display=='internal' && this.board.renderer.type=='svg') {
            this.size = [this.rendNode.getBBox().width, this.rendNode.getBBox().height];
        } else if (this.board.renderer.type=='vml' || (this.display=='internal' && this.board.renderer.type=='canvas')) { 
            this.size = [parseFloat(this.visProp.fontsize)*this.plaintext.length*0.45,parseFloat(this.visProp.fontsize)*0.9]
        }
    },

    /**
     * Return the width of the text element.
     * @return {Array} [width, height] in pixel
     */
    getSize: function () {
        return this.size;
    },

    /**
     * Set the text to new, fixed coordinates.
     * @param {number} x
     * @param {number} y
     * @return {object} reference to the text object.
     */
    setCoords: function (x,y) {
        this.X = function() { return x; };
        this.Y = function() { return y; };
        this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
        return this;
    },

    /**
     * Evaluates the text.
     * Then, the update function of the renderer
     * is called. 
     */
    update: function () {
        var anchor;

        if (this.needsUpdate) {
            if (this.relativeCoords) {
                if (this.visProp.islabel) {
                    anchor = this.element.getLabelAnchor();
                    this.coords.setCoordinates(JXG.COORDS_BY_SCREEN,
                        [this.relativeCoords.scrCoords[1] + anchor.scrCoords[1],
                         this.relativeCoords.scrCoords[2] + anchor.scrCoords[2]]);
                } else {
                    anchor = this.element.getTextAnchor();
                    this.coords.setCoordinates(JXG.COORDS_BY_USER,
                        [this.relativeCoords.usrCoords[1] + anchor.usrCoords[1],
                         this.relativeCoords.usrCoords[2] + anchor.usrCoords[2]]);
                }
            } else {
                this.updateCoords();
            }
            this.updateText();
            this.updateSize();
            this.updateTransform();
        }
        return this;
    },

    /**
     * The update function of the renderer
     * is called. 
     * @private
     */
    updateRenderer: function () {
        if (this.needsUpdate) {
            this.board.renderer.updateText(this);
            this.needsUpdate = false;
        }
        return this;
    },

    updateTransform: function () {
        if (this.transformations.length==0) {
            return;
        }
        for (var i=0;i<this.transformations.length;i++) {
            this.transformations[i].update();
        }
    },

    /**
     * Converts the GEONExT syntax of the <value> terms into JavaScript.
     * Also, all Objects whose name appears in the term are searched and
     * the text is added as child to these objects.
     * @private
     * @see Algebra
     * @see #geonext2JS.
     */
    generateTerm: function (contentStr) {
        var res,
            plaintext = '""',
            term;

        contentStr = contentStr || '';

        contentStr = contentStr.replace(/\r/g,''); 
        contentStr = contentStr.replace(/\n/g,''); 
        contentStr = contentStr.replace(/\"/g,'\\"'); 
        contentStr = contentStr.replace(/\'/g,"\\'"); 
        contentStr = contentStr.replace(/&amp;arc;/g,'&ang;'); 
        contentStr = contentStr.replace(/<arc\s*\/>/g,'&ang;'); 
        contentStr = contentStr.replace(/<sqrt\s*\/>/g,'&radic;'); 

        // Convert GEONExT syntax into  JavaScript syntax
        var i;

        i = contentStr.indexOf('<value>');
        var j = contentStr.indexOf('</value>');
        if (i>=0) {
            while (i>=0) {
                plaintext += ' + "'+ JXG.GeonextParser.replaceSub(JXG.GeonextParser.replaceSup(contentStr.slice(0,i))) + '"';
                term = contentStr.slice(i+7,j);
                res = JXG.GeonextParser.geonext2JS(term, this.board);
                res = res.replace(/\\"/g,'"');
                res = res.replace(/\\'/g,"'");

                if (res.indexOf('toFixed')<0) {  // GEONExT-Hack: apply rounding once only.  
                    if (JXG.isNumber( (new Function('return '+res+';'))() )) {          // output of a value tag
                                                                                        // may also be a string
                        plaintext += '+('+ res + ').toFixed('+(this.visProp.digits)+')';
                    } else {
                        plaintext += '+('+ res + ')';   
                    }
                } else {
                    plaintext += '+('+ res + ')';
                }
                contentStr = contentStr.slice(j+8);
                i = contentStr.indexOf('<value>');
                j = contentStr.indexOf('</value>');
            }
        } //else {
        plaintext += ' + "' + JXG.GeonextParser.replaceSub(JXG.GeonextParser.replaceSup(contentStr)) + '"';
        //}
        plaintext = plaintext.replace(/<overline>/g,'<span style=text-decoration:overline>');
        plaintext = plaintext.replace(/<\/overline>/g,'</span>');
        plaintext = plaintext.replace(/<arrow>/g,'<span style=text-decoration:overline>');
        plaintext = plaintext.replace(/<\/arrow>/g,'</span>');

        plaintext = plaintext.replace(/&amp;/g,'&'); // This should replace &amp;pi; by &pi;
        return plaintext;
    },

    /**
     * Finds dependencies in a given term and notifies the parents by adding the
     * dependent object to the found objects child elements.
     * @param {String} content String containing dependencies for the given object.
     * @private
     */
    notifyParents: function (content) {
        var res = null;

        do {
            var search = /<value>([\w\s\*\/\^\-\+\(\)\[\],<>=!]+)<\/value>/;
            res = search.exec(content);
            if (res!=null) {
                JXG.GeonextParser.findDependencies(this,res[1],this.board);
                content = content.substr(res.index);
                content = content.replace(search,'');
            }
        } while (res!=null);
        return this;
    },

    bounds: function () {
        var c = this.coords.usrCoords;

        return this.visProp.islabel ? [0, 0, 0, 0] : [c[1], c[2]+this.size[1], c[1]+this.size[0], c[2]];
    }
});

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
 *
 * There is the attribute 'display' which takes the values 'html' or 'internal'. In case of 'html' a HTML division tag is created to display
 * the text. In this case it is also possible to use ASCIIMathML. Incase of 'internal', a SVG or VML text element is used to display the text.
 * @see JXG.Text
 * @example
 * // Create a fixed text at position [0,1].
 *   var t1 = board.create('text',[0,1,"Hello World"]); 
 * </pre><div id="896013aa-f24e-4e83-ad50-7bc7df23f6b7" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t1_board = JXG.JSXGraph.initBoard('896013aa-f24e-4e83-ad50-7bc7df23f6b7', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var t1 = t1_board.create('text',[0,1,"Hello World"]);
 * </script><pre>
 * @example
 * // Create a variable text at a variable position.
 *   var s = board.create('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var graph = board.create('text', 
 *                        [function(x){ return s.Value();}, 1,
 *                         function(){return "The value of s is"+s.Value().toFixed(2);}
 *                        ]
 *                     );
 * </pre><div id="5441da79-a48d-48e8-9e53-75594c384a1c" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t2_board = JXG.JSXGraph.initBoard('5441da79-a48d-48e8-9e53-75594c384a1c', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var s = t2_board.create('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var t2 = t2_board.create('text',[function(x){ return s.Value();}, 1, function(){return "The value of s is "+s.Value().toFixed(2);}]);
 * </script><pre>
 */
JXG.createText = function(board, parents, attributes) {
    var attr;

    attr = JXG.copyAttributes(attributes, board.options, 'text');

    // downwards compatibility
    attr.anchor = attr.parent || attr.anchor;

    return new JXG.Text(board, parents[parents.length-1], parents, attr);
};

JXG.JSXGraph.registerElement('text', JXG.createText);
