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
 * @author graphjs
 * @version 0.1
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
JXG.Text = function (board, contentStr, element, coords, id, name, digits) {
    this.constructor();

    this.type = JXG.OBJECT_TYPE_TEXT;
    this.elementClass = JXG.OBJECT_CLASS_OTHER;                

    this.init(board, id, name);

    this.contentStr = contentStr;
    this.plaintextStr = '';

    // stroke Color = text Color
    this.visProp['strokeColor'] = this.board.options.text.strokeColor;

    this.visProp['visible'] = true;
    //this.show = true; // noch noetig? BV

    if (digits!=null) {
        this.digits = digits;
    } else {
        this.digits = 2;
    }

    /**
     * Coordinates of the text.
     * @type Coords
     */
    if ((this.element = this.board.objects[element])){
        var anchor = this.element.getTextAnchor();
        this.element.addChild(this);
        this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_USER, [parseFloat(coords[0]),parseFloat(coords[1])],this.board);
        this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.relativeCoords.usrCoords[1]+anchor.usrCoords[1],this.relativeCoords.usrCoords[2]+anchor.usrCoords[2]], this.board);
    } else {
        var xterm = coords[0];
        if (typeof xterm=='string') {
            // Convert GEONExT syntax into  JavaScript syntax
            var newxterm = this.board.algebra.geonext2JS(xterm);
            this.X = new Function('','return ' + newxterm + ';');
        } else if (typeof xterm=='function') {
            this.X = xterm;
        } else if (typeof xterm=='number') {
            this.X = function() { return xterm; };
        }
        var yterm = coords[1];
        if (typeof yterm=='string') {
            // Convert GEONExT syntax into  JavaScript syntax
            var newyterm = this.board.algebra.geonext2JS(yterm);
            this.Y = new Function('','return ' + newyterm + ';');
        } else if (typeof yterm=='function') {
            this.Y = yterm;
        } else if (typeof yterm=='number') {
            this.Y = function() { return yterm; };
        }
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
            plaintext = this.generateTerm(this.contentStr);   // Converts GEONExT syntax into JavaScript string
        }
        this.updateText = new Function('this.plaintextStr = ' + plaintext + ';');
    }

    this.updateText();                    // First evaluation of the string
    this.id = this.board.addText(this);
    this.notifyParents(this.contentStr);
};
JXG.Text.prototype = new JXG.GeometryElement();

/**
 * Empty function (for the moment). It is needed for highlighting
 * @param {x} 
 * @param {y} Find closest point on the text to (xy)
 * @return Always returns false
 */
JXG.Text.prototype.hasPoint = function (x,y) {
    return false;
};

/**
 * Evaluates the text.
 * Then, the update function of the renderer
 * is called. 
 */
JXG.Text.prototype.update = function () {
    if (this.needsUpdate) {
        if (this.relativeCoords){
            var anchor = this.element.getTextAnchor();
            this.coords.setCoordinates(JXG.COORDS_BY_USER, [this.relativeCoords.usrCoords[1]+anchor.usrCoords[1],this.relativeCoords.usrCoords[2]+anchor.usrCoords[2]]);
        } else {
            this.updateCoords();
        }
        this.updateText();
    }
};

/**
 * Evaluates the text.
 * Then, the update function of the renderer
 * is called. 
 */
JXG.Text.prototype.updateRenderer = function () {
    if (this.needsUpdate) {
        this.board.renderer.updateText(this);
        this.needsUpdate = false;
    }
};

/**
 * Converts the GEONExT syntax of the <value> terms into JavaScript.
 * Also, all Objects whose name appears in the term are searched and
 * the text is added as child to these objects.
 * @see Algebra
 * @see #geonext2JS.
 */
JXG.Text.prototype.generateTerm = function (contentStr) {
    var res = null;
    var elements = this.board.elementsByName;
    var plaintext = '""';
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
//alert(plaintext);
    return plaintext;
};

/**
 * Finds dependencies in a given term and notifies the parents by adding the
 * dependent object to the found objects child elements.
 * @param {String} term String containing dependencies for the given object.
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
};

/**
 * The text to display has to be the last entrie in parentArr.
 **/
JXG.createText = function(board, parentArr, atts) {
    return new JXG.Text(board, parentArr[parentArr.length-1], null, parentArr, atts['id'], atts['name'], atts['digits']);
};

JXG.JSXGraph.registerElement('text', JXG.createText);
