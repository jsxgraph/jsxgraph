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
        //this.request = new ActiveXObject("Msxml2.XMLHTTP");
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
                var text = '';

                if (typeof request.responseStream!='undefined' && request.responseText.slice(0,2) == "PK") {
                    text = (new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(BinFileReader(this.request)))).unzip();
                    text = text[0][0];
                } else {
                    text = request.responseText;
                }
                this.parseString(text, board, format, false);
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
    var tree, graph;
    
    if (format.toLowerCase()=='cdy') {
    	// if isString is true, fileStr is the base64 encoded zip file, otherwise it's just the zip file
    	if(isString)
    		fileStr = JXG.Util.Base64.decode(fileStr);
        fileStr = JXG.CinderellaReader.readCinderella(fileStr, board);
        board.xmlString = fileStr;
        board.afterLoad();
        return;
    }
    if (format.toLowerCase()=='graph') {
        //if(isString)
        fileStr = JXG.GraphReader.readGraph(fileStr,board);
        board.afterLoad();
        return;
    }     
    
    // fileStr is a string containing the XML code of the construction
    if (format.toLowerCase()=='geonext') {
        fileStr = JXG.GeonextReader.prepareString(fileStr);
    }
    if (format.toLowerCase()=='geogebra') {
        // if isString is true, fileStr is a base64 encoded string, otherwise it's the zipped file
    	fileStr = JXG.GeogebraReader.prepareString(fileStr, isString);
    }
    if (format.toLowerCase()=='intergeo') {
        if(isString)
            fileStr = JXG.Util.Base64.decode(fileStr);
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
    // cdy is already parsed in parseString()
    board.afterLoad();
}; // end: this.readElements()

}; // end: FileReader()

if(/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
document.write('<script type="text/vbscript">\n\
Function Base64Encode(inData)\n\
  Const Base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"\n\
  Dim cOut, sOut, I\n\
  For I = 1 To LenB(inData) Step 3\n\
    Dim nGroup, pOut, sGroup\n\
    nGroup = &H10000 * AscB(MidB(inData, I, 1)) + _\n\
      &H100 * MyASC(MidB(inData, I + 1, 1)) + MyASC(MidB(inData, I + 2, 1))\n\
    nGroup = Oct(nGroup)\n\
    nGroup = String(8 - Len(nGroup), "0") & nGroup\n\
    pOut = Mid(Base64, CLng("&o" & Mid(nGroup, 1, 2)) + 1, 1) + _\n\
      Mid(Base64, CLng("&o" & Mid(nGroup, 3, 2)) + 1, 1) + _\n\
      Mid(Base64, CLng("&o" & Mid(nGroup, 5, 2)) + 1, 1) + _\n\
      Mid(Base64, CLng("&o" & Mid(nGroup, 7, 2)) + 1, 1)\n\
    sOut = sOut + pOut\n\
  Next\n\
  Select Case LenB(inData) Mod 3\n\
    Case 1: \'8 bit final\n\
      sOut = Left(sOut, Len(sOut) - 2) + "=="\n\
    Case 2: \'16 bit final\n\
      sOut = Left(sOut, Len(sOut) - 1) + "="\n\
  End Select\n\
  Base64Encode = sOut\n\
End Function\n\
\n\
Function MyASC(OneChar)\n\
  If OneChar = "" Then MyASC = 0 Else MyASC = AscB(OneChar)\n\
End Function\n\
\n\
Function BinFileReader(xhr)\n\
    Dim byteString\n\
    Dim b64String\n\
    Dim i\n\
    byteString = xhr.responseBody\n\
    ReDim byteArray(LenB(byteString))\n\
    For i = 1 To LenB(byteString)\n\
        byteArray(i-1) = AscB(MidB(byteString, i, 1))\n\
    Next\n\
    b64String = Base64Encode(byteString)\n\
    BinFileReader = b64String\n\
End Function\n\
</script>\n');
}
