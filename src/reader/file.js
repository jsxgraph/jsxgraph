/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG:true, define: true, ActiveXObject:true, jxgBinFileReader:true, DOMParser:true, XMLHttpRequest:true, document:true, navigator:true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";
import Env from "../utils/env.js";
import Type from "../utils/type.js";
import Encoding from "../utils/encoding.js";
import Base64 from "../utils/base64.js";

/**
 * The FileReader object bundles the file input capabilities of JSXGraph.
 */
JXG.FileReader = {
    /**
     *
     * @param {String} url
     * @param {JXG.Board} board
     * @param {String} format
     * @param {Boolean} async
     * @param {Function} callback
     *
     * @private
     */
    handleRemoteFile: function (url, board, format, async, encoding, callback) {
        var request = false;

        try {
            request = new XMLHttpRequest();
            if (format.toLowerCase() === 'raw') {
                request.overrideMimeType("text/plain; charset=" + encoding);
            } else {
                request.overrideMimeType("text/xml; charset=" + encoding);
            }
        } catch (e) {
            try {
                request = new ActiveXObject('Msxml2.XMLHTTP');
            } catch (ex) {
                try {
                    request = new ActiveXObject('Microsoft.XMLHTTP');
                } catch (exc) {
                    request = false;
                }
            }
        }
        if (!request) {
            JXG.debug("AJAX not activated!");
            return;
        }

        request.open("GET", url, async);
        if (format.toLowerCase() === 'raw') {
            this.cbp = function () {
                var req = request;
                if (req.readyState === 4) {
                    board(req.responseText);
                }
            };
        } else {
            this.cbp = function () {
                var req = request,
                    text = "";

                if (req.readyState === 4) {
                    // Hack for ancient IEs:
                    // We use the Visual Basic stuff from below.
                    if (
                        Type.exists(req.responseStream) &&
                        // PK: zip, geogebra
                        // 31: gzip, cinderella
                        (req.responseText.slice(0, 2) === "PK" ||
                            Encoding.asciiCharCodeAt(req.responseText.slice(0, 1), 0) === 31)
                    ) {
                        // After this, text contains the binary? zip-compressed string
                        text = Base64.decode(jxgBinFileReader(req));
                    } else {
                        // This is for all browsers except ancient IEs.
                        text = req.responseText;
                        // console.log(text);
                    }
                    this.parseString(text, board, format, callback);
                }
            };
        }

        this.cb = Type.bind(this.cbp, this);
        // Old style
        request.onreadystatechange = this.cb;

        try {
            request.send(null);
        } catch (ex2) {
            throw new Error(
                "JSXGraph: A problem occurred while trying to read remote file '" + url + "'."
            );
        }
    },

    /**
     *
     * @param {Blob} url The Blob or File from which to read
     * @param {JXG.Board} board
     * @param {String} format
     * @param {Boolean} async
     * @param {Function} callback
     *
     * @private
     */
    handleLocalFile: function (url, board, format, async, encoding, callback) {
        if (!Type.exists(async)) {
            async = true;
        }

        if (format.toLowerCase() === 'raw') {
            this.cbp = function (e) {
                board(e.target.result);
            };
        } else {
            this.cbp = function (e) {
                var text = e.target.result;
                //console.log(text);
                this.parseString(text, board, format, callback);
            };
        }

        this.cb = Type.bind(this.cbp, this);

        var reader = new FileReader();
        reader.onload = this.cb;
        if (format.toLowerCase() === 'raw') {
            reader.readAsText(url);
        } else {
            reader.readAsText(url, encoding);
        }
    },

    /**
     * Opens a file using the given URL and passes the contents to {@link JXG.FileReader#parseString}
     * @param {String} url
     * @param {JXG.Board|function} board Either a board or in case <tt>format</tt> equals 'raw' this has to be a callback function.
     * @param {String} format The expected file format. Possible values are <dl>
     * <dt>raw</dt><dd>Raw text file. In this case <tt>board</tt> has to be a callback function.</dd>
     * <dt>geonext</dt><dd>Geonext File <a href="https://www.geonext.de">https://www.geonext.de</a></dd>
     * <dt>intergeo</dt><dd>Intergeo file format <a href="https://www.i2geo.net">https://www.i2geo.net</a></dd>
     * <dt>tracenpoche</dt><dd>Tracenpoche construction <a href="https://tracenpoche.sesamath.net/">https://tracenpoche.sesamath.net/</a></dd>
     * <dt>graph</dt><dd>Graph file</dd>
     * <dt>digraph</dt><dd>DiGraph file</dd>
     * <dt>geogebra</dt><dd>Geogebra File <a href="https://www.geogebra.org">https://www.geogebra.org</a></dd>
     * <dl><dt>cdy or cinderella</dt><dd>Cinderella (<a href="https://www.cinderella.de/">https://www.cinderella.de</a></dd>
     * </dl>
     * @param {Boolean} async Call ajax asynchonously.
     * @param {function} callback A function that is run when the board is ready.
     */
    parseFileContent: function (url, board, format, async, encoding, callback) {
        if (Type.isString(url) || FileReader === undefined) {
            this.handleRemoteFile(url, board, format, async, encoding, callback);
        } else {
            this.handleLocalFile(url, board, format, async, encoding, callback);
        }
    },

    /**
     * Parses a given string according to the file format given in format.
     * @param {String} str Contents of the file.
     * @param {JXG.Board} board The board the construction in the file should be loaded in.
     * @param {String} format Possible values are <dl>
     * <dt>raw</dt><dd>Raw text file. In this case <tt>board</tt> has to be a callback function.</dd>
     * <dt>geonext</dt><dd>Geonext File <a href="https://www.geonext.de">https://www.geonext.de</a></dd>
     * <dt>intergeo</dt><dd>Intergeo file format <a href="https://www.i2geo.net">https://www.i2geo.net</a></dd>
     * <dt>tracenpoche</dt><dd>Tracenpoche construction <a href="https://tracenpoche.sesamath.net/">https://tracenpoche.sesamath.net/</a></dd>
     * <dt>graph</dt><dd>Graph file</dd>
     * <dt>digraph</dt><dd>DiGraph file</dd>
     * <dt>geogebra</dt><dd>Geogebra File <a href="https://www.geogebra.org">https://www.geogebra.org</a></dd>
     * <dl><dt>cdy or cinderella</dt><dd>Cinderella (<a href="https://www.cinderella.de/">https://www.cinderella.de</a></dd>
     * </dl>
     * @param {function} callback
     */
    parseString: function (str, board, format, callback) {
        var Reader, read;

        format = format.toLowerCase();
        Reader = JXG.readers[format];

        if (Type.exists(Reader)) {
            read = new Reader(board, str);
            read.read();
        } else if (format === 'jessiecode') {
        } else {
            throw new Error("JSXGraph: There is no reader available for '" + format + "'.");
        }

        if (Type.isFunction(callback)) {
            callback(board);
        }
    }
};

// The following code is vbscript. This is a workaround to enable binary data downloads via AJAX in
// Microsoft Internet Explorer.

/*jslint evil:true, es5:true, white:true*/
/*jshint multistr:true*/
if (
    !Env.isMetroApp() &&
    Env.isBrowser &&
    typeof navigator === "object" &&
    /msie/i.test(navigator.userAgent) &&
    !/opera/i.test(navigator.userAgent) &&
    document &&
    document.write
) {
    document.write(
        '<script type="text/vbscript">\n\
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
Function jxgBinFileReader(xhr)\n\
    Dim byteString\n\
    Dim b64String\n\
    Dim i\n\
    byteString = xhr.responseBody\n\
    ReDim byteArray(LenB(byteString))\n\
    For i = 1 To LenB(byteString)\n\
        byteArray(i-1) = AscB(MidB(byteString, i, 1))\n\
    Next\n\
    b64String = Base64Encode(byteString)\n\
    jxgBinFileReader = b64String\n\
End Function\n\
</script>\n'
    );
}

export default JXG.FileReader;
