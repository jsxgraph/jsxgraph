/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

/* depends (incomplete)
 utils/env
 utils/type
 */

/**
 * The FileReader object bundles the file input capabilities of JSXGraph.
 */
JXG.FileReader = {

    /**
     * Opens a file using the given URL and passes the contents to {@link JXG.FileReader#parseString}
     * @param {String} url
     * @param {JXG.Board|function} board Either a board or in case <tt>format</tt> equals 'raw' this has to be a callback function.
     * @param {String} format The expected file format. Possible values are <dl>
     * <dt>raw</dt><dd>Raw text file. In this case <tt>board</tt> has to be a callback function.</dd>
     * <dt>geonext</dt><dd>Geonext File <a href="http://www.geonext.de">http://www.geonext.de</a></dd>
     * <dt>intergeo</dt><dd>Intergeo file format <a href="http://www.i2geo.net">http://www.i2geo.net</a></dd>
     * <dt>tracenpoche</dt><dd>Tracenpoche construction <a href="http://www.tracenpoche.net">http://www.tracenpoche.net</a></dd>
     * <dt>graph</dt><dd>Graph file</dd>
     * <dt>digraph</dt><dd>DiGraph file</dd>
     * <dt>geogebra</dt><dd>Geogebra File <a href="http://www.geogebra.org">http://www.geogebra.org</a></dd>
     * <dl><dt>cdy or cinderella</dt><dd>Cinderella (<a href="http://www.cinderella.de/">http://www.cinderella.de</a></dd>
     * </dl>
     * @param {Boolean} async Call ajax asynchonously.
     */
    parseFileContent: function (url, board, format, async) {
        var request = false;
        
        if(!JXG.exists(async)) {
            async = true;
        }

        //this.request = false;

        try {
            request = new XMLHttpRequest();
            if(format.toLowerCase()=='raw') {
                request.overrideMimeType('text/plain; charset=iso-8859-1');
            } else {
                request.overrideMimeType('text/xml; charset=iso-8859-1');
            }
        } catch (e) {
            try {
                request = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    request = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    request = false;
                }
            }
        }

        if (!request) {
            alert("AJAX not activated!");
            return;
        }
        
        request.open("GET", url, async);

        if(format.toLowerCase() === 'raw') {
            this.cbp = function() {
                var req = request;
                if (req.readyState == 4) {
                    board(req.responseText);
                }
            };
        } else {
            this.cbp = function() {
                var req = request;
                if (req.readyState == 4) {
                    var text = '';

                    if (typeof req.responseStream!='undefined' &&
                        (req.responseText.slice(0,2) == "PK"                            // ZIP -> Geogebra
                            || JXG.Util.UTF8.asciiCharCodeAt(req.responseText.slice(0,1),0)==31) // gzip -> Cinderella
                        ) {
                        text = JXG.Util.Base64.decode(BinFileReader(req)); // After this, text contains the base64 encoded, zip-compressed string
                    } else {
                        text = req.responseText;
                    }
                    this.parseString(text, board, format, false);
                }
            };
        }

        this.cb = JXG.bind(this.cbp, this);
        request.onreadystatechange = this.cb;

        try {
            request.send(null);
        } catch (e) {
            throw new Error("JSXGraph: A problem occurred while trying to read '" + url + "'.");
        }
    },

    /**
     * Cleans out unneccessary whitespaces in a chunk of xml.
     * @param {XMLElement} el
     */
    cleanWhitespace: function (el) {
        var cur = el.firstChild;

        while (cur != null) {
            if (cur.nodeType == 3 && !/\S/.test(cur.nodeValue)) {
                el.removeChild( cur );
            } else if ( cur.nodeType == 1 ) {
                this.cleanWhitespace( cur );
            }
            cur = cur.nextSibling;
        }
    },

    /**
     * Converts a given string into a XML tree.
     * @param {String} str
     * @returns {XMLElement} The xml tree represented by the root node.
     */
    stringToXMLTree: function (str) {
        // The string "str" is converted into a XML tree.
        if(typeof DOMParser === 'undefined') {
            // IE workaround, since there is no DOMParser
            DOMParser = function () {};
            DOMParser.prototype.parseFromString = function (str, contentType) {
                if (typeof ActiveXObject !== 'undefined') {
                    var d = new ActiveXObject('MSXML.DomDocument');
                    d.loadXML(str);
                    return d;
                }
            };
        }
        var parser = new DOMParser(),
            tree = parser.parseFromString(str, 'text/xml');

        this.cleanWhitespace(tree);
        return tree;
    },

    /**
     * Parses a given string according to the file format given in format.
     * @param {String} str Contents of the file.
     * @param {JXG.Board} board The board the construction in the file should be loaded in.
     * @param {String} format Possible values are <dl>
     * <dt>raw</dt><dd>Raw text file. In this case <tt>board</tt> has to be a callback function.</dd>
     * <dt>geonext</dt><dd>Geonext File <a href="http://www.geonext.de">http://www.geonext.de</a></dd>
     * <dt>intergeo</dt><dd>Intergeo file format <a href="http://www.i2geo.net">http://www.i2geo.net</a></dd>
     * <dt>tracenpoche</dt><dd>Tracenpoche construction <a href="http://www.tracenpoche.net">http://www.tracenpoche.net</a></dd>
     * <dt>graph</dt><dd>Graph file</dd>
     * <dt>digraph</dt><dd>DiGraph file</dd>
     * <dt>geogebra</dt><dd>Geogebra File <a href="http://www.geogebra.org">http://www.geogebra.org</a></dd>
     * <dl><dt>cdy or cinderella</dt><dd>Cinderella (<a href="http://www.cinderella.de/">http://www.cinderella.de</a></dd>
     * </dl>
     * @param {Boolean} isString Some file formats can be given as Base64 encoded strings or as plain xml, in both cases
     * they are given as strings. This flag is used to distinguish those cases: <tt>true</tt> means, it is given as a string,
     * no need to un-Base64 and unzip the file.
     */
    parseString: function (str, board, format, isString) {
        var tree, graph, xml;

        format = format.toLowerCase();

        switch (format) {
            case 'cdy':
            case 'cinderella':
                // if isString is true, str is the base64 encoded zip file, otherwise it's just the zip file
                if(isString) {
                    str = JXG.Util.Base64.decode(str);
                }

                str = JXG.CinderellaReader.read(str, board);
                board.xmlString = str;

                break;
            case 'tracenpoche':
                board.xmlString = JXG.TracenpocheReader.readTracenpoche(str, board);

                break;
            case 'graph':
                str = JXG.GraphReader.readGraph(str, board, false);
                break;
            case 'digraph':
                str = JXG.GraphReader.readGraph(str, board, true);
                break;
            case 'geonext':
                // str is a string containing the XML code of the construction
                str = JXG.GeonextReader.prepareString(str);
                xml = true;
                break;
            case 'geogebra':
                isString = str.slice(0, 2) !== "PK";

                // if isString is true, str is a base64 encoded string, otherwise it's the zipped file
                str = JXG.GeogebraReader.prepareString(str, isString);
                xml = true;
                break;
            case 'intergeo':
                if(isString) {
                    str = JXG.Util.Base64.decode(str);
                }

                str = JXG.IntergeoReader.prepareString(str);
                xml = true;
                break;
            case 'sketch':
                str = JXG.SketchReader.readSketch(str, board);
                break;
        }

        if (xml) {
            board.xmlString = str;
            tree = this.stringToXMLTree(str);
            // Now, we can walk through the tree
            this.readElements(tree, board, format);
        }
    },

    /**
     * Reading the elements of a geonext or geogebra file
     * @param {} tree expects the content of the parsed geonext file returned by function parseFromString
     * @param {Object} board board object
     */
    readElements: function (tree, board, format) {
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
    }
};

// The following code is vbscript. This is a workaround to enable binary data downloads via AJAX in
// Microsoft Internet Explorer.
if(!JXG.isMetroApp() && typeof navigator !== 'undefined' && /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent && document && document.write)) {
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
