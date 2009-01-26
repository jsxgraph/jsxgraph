/*
    Copyright 2008, 
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

JXG.FileReader = new function() {

this.parseFileContent = function(url, board, format) {
    this.request = false;
    var e;
    try {
        this.request = new XMLHttpRequest();
        this.request.overrideMimeType('text/xml; charset=iso-8859-1');
    } catch (e) {
        try {
            this.request = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                this.request = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                this.request = false;
            }
        }
    }
    if (!this.request) {
        alert("AJAX not activated!");
        return;
    }
    this.request.open("GET", url, true);

    this.cb = (function() {
        var request = this.request;
        if (request.readyState == 4) {
            this.parseString(request.responseText, board, format);
        }
        }).bind(this);

    this.request.onreadystatechange = this.cb;

    this.request.send(null);
}; // end: this.parseFileContent

this.cleanWhitespace = function(el) {
    var cur = el.firstChild;
    while ( cur != null ) {
        if ( cur.nodeType == 3 && ! /\S/.test(cur.nodeValue) ) {
            el.removeChild( cur );
        } else if ( cur.nodeType == 1 ) {
            this.cleanWhitespace( cur );
        }
        cur = cur.nextSibling; 
    }
};

this.stringToXMLTree = function(fileStr) {
    // The string "fileStr" is converted into a XML tree.
    if(typeof DOMParser == "undefined") { 
       // IE workaround, since there is no DOMParser
       DOMParser = function () {};
       DOMParser.prototype.parseFromString = function (str, contentType) {
          if (typeof ActiveXObject != "undefined") {
             var d = new ActiveXObject("MSXML.DomDocument");
             d.loadXML(str);
             return d;
          } 
       }
    }
    var parser=new DOMParser();
    
    var tree = parser.parseFromString(fileStr,"text/xml");
    this.cleanWhitespace(tree);
    return tree;
};

this.parseString = function(fileStr, board, format) {
//fertig = false; // debug BV
    // fileStr is a string containing the XML code of the construction
    if (format.toLowerCase()=='geonext') { 
        fileStr = JXG.GeonextReader.prepareString(fileStr);
    }
    board.xmlString = fileStr;
    var tree = this.stringToXMLTree(fileStr);
    // Now, we can walk through the tree
    this.readElements(tree, board, format);
//fertig = true; // debug BV
}; // end this.parse

this.readElements = function(tree, board, format) {
    /**
     * Reading the elements of a geonext or geogebra file
     @param {} tree expects the content of the parsed geonext file returned by function parseFromString
     @param {Object} board board object
    */

    if (format.toLowerCase()=='geonext') { 
        if(tree.getElementsByTagName('GEONEXT').length != 0) {
            JXG.GeonextReader.readGeonext(tree, board);
        }
    }
    else if(tree.getElementsByTagName('geogebra').length != 0) {
        JXG.GeogebraReader.readGeogebra(tree, board);
    }
    else if(format.toLowerCase()=='intergeo') {
         JXG.IntergeoReader.readIntergeo(tree, board);
    }
    board.afterLoad();    
}; // end: this.readElements()

}; // end: FileReader()