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
        if(format.toLowerCase()=='raw')
            this.request.overrideMimeType('text/plain; charset=iso-8859-1');
        else
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
    if(format.toLowerCase()=='raw') {
        this.cbp = function() {
            var request = this.request;
            if (request.readyState == 4) {
                board(request.responseText);
            }
        }; //).bind(this);        
    } else {
        this.cbp = function() {
            var request = this.request;
            if (request.readyState == 4) {
                this.parseString(request.responseText, board, format, false);
            }
        }; //).bind(this);
    }
    this.cb = JXG.bind(this.cbp,this);
    this.request.onreadystatechange = this.cb;

    try {
        this.request.send(null);
    } catch (e) {
        throw new Error("JSXGraph: problems opening " + url + " !");
    }
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
       };
    }
    var parser=new DOMParser();
    
    var tree = parser.parseFromString(fileStr,"text/xml");
    this.cleanWhitespace(tree);
    return tree;
};

this.parseString = function(fileStr, board, format, isString) {
    // fileStr is a string containing the XML code of the construction
    if (format.toLowerCase()=='geonext') { 
        fileStr = JXG.GeonextReader.prepareString(fileStr);
    }
    if (format.toLowerCase()=='geogebra') {
        // if isString is true, fileStr is a base64 encoded string, otherwise it's the zipped file
    	fileStr = JXG.GeogebraReader.prepareString(fileStr, isString);
    }
    if (format.toLowerCase()=='intergeo') {
    	fileStr = JXG.IntergeoReader.prepareString(fileStr);
    }
    board.xmlString = fileStr;
    var tree = this.stringToXMLTree(fileStr);
    // Now, we can walk through the tree
    this.readElements(tree, board, format);
}; // end this.parse

/**
 * Reading the elements of a geonext or geogebra file
 * @param {} tree expects the content of the parsed geonext file returned by function parseFromString
 * @param {Object} board board object
 */
this.readElements = function(tree, board, format) {
    if (format.toLowerCase()=='geonext') { 
        board.suspendUpdate();
        if(tree.getElementsByTagName('GEONEXT').length != 0) {
            JXG.GeonextReader.readGeonext(tree, board);
        }
        board.unsuspendUpdate();
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