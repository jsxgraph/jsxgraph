/*
AM.js (version 2.X.X.3 May 2009
==============
This version of ASCIIMathML has been modified with TeX conversion for 
IMG fallback (c) David Lippman http://www.pierce.ctc.edu/dlippman
If browser supports MathML, it is used. Otherwise, image-
based math rendering is used (set AMTcgiloc for renderer).

Extended to handle output of tinyMCE editor plugins for graphs, including
image-based fallback for the editor-produced graphs.

Fixed some code for matrix rendering, added a lot of new input/output values
for Mathtex fallback ( http://www.forkosh.dreamhost.com/source_mathtex.html )
with Tex Live 2007 (full package http://www.tug.org/texlive/ ) and modified
some code (colors, font size with density etc) - thanks to modifications
by Dr Douglas R. Woodall and Jeff Knisley ( http://math.etsu.edu/LaTeXMathML/ )

Some new plugins for moodle ( http://moodle.org/ ) are also available soon.
To use this script add the next line to your (X)HTML page with this file in the
same folder or in moodle to theme meta.php, header.html or footer.html:

<script type="text/javascript" src="pathtoyourscript/AM.js"></script>

Original version(c) Peter Jipsen http://www.chapman.edu/~jipsen
Latest version at http://www.chapman.edu/~jipsen/mathml/ASCIIMathML.js
This version extends ASCIIMathML.js with improved LaTeXMathML.js and
plugin based ASCIIsvg.js by David Lippman ( ASCIIsvgPI.js ).

Big thanks for Marc Grober, Paulo Soares, "frouze" and other members of AsciiMathML
group for fresh ideas ( http://groups.google.com/group/asciimath )
A demo site and new (cleaner) versions of this extended script with moodle and
experimental tinymce plugins will be found from http://korpelainen.net/plugindemo
and http://korpelainen.net/plugindemo/lib/editor/common/AM.js

Regards,

Mauno Korpelainen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation; either version 2.1 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT 
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS 
FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License 
(at http://www.gnu.org/licences/lgpl.html) for more details.
*/
var AMTcgiloc = "http://korpelainen.net/cgi-bin/mathtex.cgi?\\gammacorrection{1.4}";//path to fallback script - only for temporary testing purposes
var AScgiloc = "http://korpelainen.net/plugindemo/lib/editor/common/php/svgimg.php";//TeX Live and compile Mathtex to use it - see the links above
var dsvglocation = "http://korpelainen.net/"; // path to d.svg (blank if same as ASCIIMathML.js loc)
var alertIfAMnoMathML = false; // show alert box if no MathML capability
var alertIfNoMathML = false; // show alert box if no MathML capability
var AMdelimiter1 = "`", AMescape1 = "\\\\`"; // can use other characters
var AMdocumentId = "wikitext" // PmWiki element containing math (default=body)
var isIE = !(navigator.oscpu && document.getElementsByClassName);
var AMnoMathML = false, AMtranslated = false;
var ASAMdelimiter1 = "`", ASAMescape1 = "\\\\`"; // can use other characters
var ASAMdocumentId = "wikitext" // PmWiki element containing math (default=body)
var ASavoidinnerHTML = true; // this must be true - needed for latexmathml inside asciisvg
var automathrecognize = false; // writing "amath" on page makes this true
var avoidinnerHTML = true;
var checkforprocessasciimathinmoodle = false; // true for systems like Moodle
var decimalsign = "."; // change to "," if you like, beware of `(1,2)`!
var displaystyle = true; // puts limits above and below large operators
var mathcolor = ""; // change it to "" (to inherit) or any other color
var mathfontfamily = 'STIXGeneral,Arial Unicode MS,"Lucida Sans Unicode","Lucida Grande",Garuda,sans-serif'; // change to "" to inherit (works in IE)
var mathfontsize = "1.2em"; // change to e.g. 1.2em for larger math
var noMathML = false;
var notifyIfAMnoMathML = false; // display note if no MathML capability
var notifyIfNoMathML = false; // display note at top if no MathML capability
var showasciiformulaonhover = true; // helps students learn ASCIIMath
var translateASCIIMath = true; // false to preserve `..`
var translateASCIIsvg = true;
var translated = false;
var translateLaTeX = true; // false to preserve $..$, $$..$$
var translateLaTeXformatting = true; // false to preserve \emph,\begin{},\end{}
var translateOnLoad = true; // set to false to do call translators from js 
var ASnoSVG = false;
var defaultwidth = 300;
var defaultheight = 200; // in pixels
var defaultxmin = -5.5;
var defaultxmax = 5.5; // in usercoords
var xunitlength = 20; // pixels
var yunitlength = 20; // pixels
var marker = "none";
var pointerpos = null;
var coordinates = null;
var picture, svgpicture, doc, width, height, a, b, c, d, i, n, p, t, x, y;
var arcsec = function(x) { return arccos(1/x) };
var sinh = function(x) { return (Math.exp(x)-Math.exp(-x))/2 };
var tanh = function(x) { return (Math.exp(x)-Math.exp(-x))/(Math.exp(x)+Math.exp(-x)) };
var sech = function(x) { return 1/cosh(x) };
var coth = function(x) { return 1/tanh(x) };
var arcsinh = function(x) { return ln(x+Math.sqrt(x*x+1)) };
var arcsech = function(x) { return arccosh(1/x) };
var arccsch = function(x) { return arcsinh(1/x) };
var arccoth = function(x) { return arctanh(1/x) };
var sign = function(x) { return (x==0?0:(x<0?-1:1)) };
var logten = function(x) { return (Math.LOG10E*Math.log(x)) };
var checkIfSVGavailable = true;
var defaultborder = 0;
var border = defaultborder; // in pixel
var defaultstrokewidth = "1"; // default line width in pixel
var defaultstroke = "blue"; // default line color
var defaultstrokeopacity = 1; // transparent = 0, solid =1
var defaultstrokedasharray = null; // "10,10" gives 10px long dashes
var defaultfill = "none"; // default fill color
var defaultfillopacity = 1; // transparent = 0, solid =1
var defaultfontstyle = "normal"; // default text shape normal|italic|inherit
var defaultfontfamily = "times"; // default font times|ariel|helvetica|...
var defaultfontsize = "16"; // default size (scaled automatically)
var defaultfontweight = "normal";// normal|bold|bolder|lighter|100|...|900
var defaultfontstroke = "none"; // default font outline color
var defaultfontfill = "none"; // default font color
var defaultmarker = "none"; // "dot" | "arrow" | "+" | "-" | "|"
var defaultendpoints = ""; // "c-d" where c is <|o|* and d is >|o|*
var showcoordinates = true;
var markerstrokewidth = "1";
var markerstroke = "black";
var markerfill = "yellow";
var markersize = 4;
var arrowfill = stroke;
var dotradius = 4;
var ticklength = 4;
var axesstroke = "black";
var gridstroke = "grey";
var backgroundstyle = "fill-opacity:1; fill:white";
var singlelettersitalic = true;
var picturepos = null; // position of picture relative to top of HTML page
var xunitlength; // in pixels, used to convert to user coordinates
var yunitlength; // in pixels
var origin = [0,0]; // in pixels (default is bottom left corner)
var above = "above"; // shorthands (to avoid typing quotes)
var below = "below";
var left = "left";
var right = "right";
var aboveleft = "aboveleft";
var aboveright = "aboveright";
var belowleft = "belowleft";
var belowright = "belowright";
var xmin, xmax, ymin, ymax, xscl, yscl, xgrid, ygrid, xtick, ytick, initialized;
var strokewidth, strokedasharray, stroke, fill, strokeopacity, fillopacity;
var fontstyle, fontfamily, fontsize, fontweight, fontstroke, fontfill;
var marker, endpoints, dynamic = {};
var picture, svgpicture, doc, width, height;
var cpi = "\u03C0", ctheta = "\u03B8"; // character for pi, theta
var log = function(x) { return ln(x)/ln(10) };
var pi = Math.PI, e = Math.E, ln = Math.log, sqrt = Math.sqrt;
var floor = Math.floor, ceil = Math.ceil, abs = Math.abs;
var sin = Math.sin, cos = Math.cos, tan = Math.tan;
var arcsin = Math.asin, arccos = Math.acos, arctan = Math.atan;
var sec = function(x) { return 1/Math.cos(x) };
var csc = function(x) { return 1/Math.sin(x) };
var cot = function(x) { return 1/Math.tan(x) };
var arccsc = function(x) { return arcsin(1/x) };
var arccot = function(x) { return arctan(1/x) };
var cosh = function(x) { return (Math.exp(x)+Math.exp(-x))/2 };
var csch = function(x) { return 1/sinh(x) };
var arccosh = function(x) { return ln(x+Math.sqrt(x*x-1)) };
var arctanh = function(x) { return ln((1+x)/(1-x))/2 };

if (isIE) {
var AMcal = [0xEF35,0x212C,0xEF36,0xEF37,0x2130,0x2131,0xEF38,0x210B,0x2110,0xEF39,0xEF3A,0x2112,0x2133,0xEF3B,0xEF3C,0xEF3D,0xEF3E,0x211B,0xEF3F,0xEF40,0xEF41,0xEF42,0xEF43,0xEF44,0xEF45,0xEF46];
var AMfrk = [0xEF5D,0xEF5E,0x212D,0xEF5F,0xEF60,0xEF61,0xEF62,0x210C,0x2111,0xEF63,0xEF64,0xEF65,0xEF66,0xEF67,0xEF68,0xEF69,0xEF6A,0x211C,0xEF6B,0xEF6C,0xEF6D,0xEF6E,0xEF6F,0xEF70,0xEF71,0x2128];
var AMbbb = [0xEF8C,0xEF8D,0x2102,0xEF8E,0xEF8F,0xEF90,0xEF91,0x210D,0xEF92,0xEF93,0xEF94,0xEF95,0xEF96,0x2115,0xEF97,0x2119,0x211A,0x211D,0xEF98,0xEF99,0xEF9A,0xEF9B,0xEF9C,0xEF9D,0xEF9E,0x2124];
} else {
var AMcal = [0x1D49C,0x212C,0x1D49E,0x1D49F,0x2130,0x2131,0x1D4A2,0x210B,0x2110,0x1D4A5,0x1D4A6,0x2112,0x2133,0x1D4A9,0x1D4AA,0x1D4AB,0x1D4AC,0x211B,0x1D4AE,0x1D4AF,0x1D4B0,0x1D4B1,0x1D4B2,0x1D4B3,0x1D4B4,0x1D4B5];
var AMfrk = [0x1D504,0x1D505,0x212D,0x1D507,0x1D508,0x1D509,0x1D50A,0x210C,0x2111,0x1D50D,0x1D50E,0x1D50F,0x1D510,0x1D511,0x1D512,0x1D513,0x1D514,0x211C,0x1D516,0x1D517,0x1D518,0x1D519,0x1D51A,0x1D51B,0x1D51C,0x2128];
var AMbbb = [0x1D538,0x1D539,0x2102,0x1D53B,0x1D53C,0x1D53D,0x1D53E,0x210D,0x1D540,0x1D541,0x1D542,0x1D543,0x1D544,0x2115,0x1D546,0x2119,0x211A,0x211D,0x1D54A,0x1D54B,0x1D54C,0x1D54D,0x1D54E,0x1D54F,0x1D550,0x2124];
}

var CONST = 0, UNARY = 1, BINARY = 2, INFIX = 3, LEFTBRACKET = 4,
 RIGHTBRACKET = 5, SPACE = 6, UNDEROVER = 7, DEFINITION = 8,
 LEFTRIGHT = 9, TEXT = 10, BIG = 11, LONG = 12, STRETCHY = 13,
 MATRIX = 14; // token types

var AMquote = {input:"\"", tag:"mtext", output:"mbox", tex:null, ttype:TEXT};
var ASAMquote = AMquote;
var AMsymbols = [
{input:"density",tag:"mstyle",atname:"mathvariant", atval:"mathsize", tex:null, ttype:BINARY},
{input:"varkappa", tag:"mi", output:"\u03F0", tex:null, ttype:CONST},
{input:"digamma", tag:"mi", output:"\u03DC", tex:null, ttype:CONST},
{input:"!=", tag:"mo", output:"\u2260", tex:"ne", ttype:CONST},
{input:"!in", tag:"mo", output:"\u2209", tex:"notin", ttype:CONST},
{input:"'", tag:"mo", output:"\u02B9", tex:"hspace{0}{'}", ttype:CONST},
{input:"''", tag:"mo", output:"\u02BA", tex:"hspace{0}{''}", ttype:CONST},
{input:"'''", tag:"mo", output:"\u2034", tex:"hspace{0}{'''}", ttype:CONST},
{input:"''''", tag:"mo", output:"\u2057", tex:"hspace{0}{''''}", ttype:CONST},
{input:"#", tag:"mo", output:"\u0023", tex:null, ttype:CONST},
{input:"%", tag:"mo", output:"\u0025", tex:null, ttype:CONST},
{input:"&", tag:"mo", output:"\u0026", tex:null, ttype:CONST},
{input:"(", tag:"mo", output:"(", tex:null, ttype:LEFTBRACKET},
{input:"(:", tag:"mo", output:"\u2329", tex:"langle", ttype:LEFTBRACKET},
{input:")", tag:"mo", output:")", tex:null, ttype:RIGHTBRACKET},
{input:"*", tag:"mo", output:"\u22C5", tex:"cdot", ttype:CONST},
{input:"**", tag:"mo", output:"\u22C6", tex:"star", ttype:CONST},
{input:"...", tag:"mo", output:"...", tex:"ldots", ttype:CONST},
{input:"/", tag:"mfrac", output:"/", tex:null, ttype:INFIX},
{input:"//", tag:"mo", output:"/", tex:"!/", ttype:CONST},
{input:"/_", tag:"mo", output:"\u2220", tex:"angle", ttype:CONST},
{input:"-:", tag:"mo", output:"\u00F7", tex:"div", ttype:CONST},
{input:":)", tag:"mo", output:"\u232A", tex:"rangle", ttype:RIGHTBRACKET},
{input:":.", tag:"mo", output:"\u2234", tex:"therefore", ttype:CONST},
{input:":}", tag:"mo", output:":}", tex:null, ttype:RIGHTBRACKET, invisible:true},
{input:":=", tag:"mo", output:":=", tex:"text{:=}", ttype:CONST},
{input:"@", tag:"mo", output:"\u2218", tex:"circ", ttype:CONST},
{input:"[", tag:"mo", output:"[", tex:null, ttype:LEFTBRACKET},
{input:"\\ ", tag:"mo", output:"\u00A0", tex:null, ttype:CONST, val:true},
{input:"\\\\", tag:"mo", output:"\\", tex:"backslash", ttype:CONST},
{input:"]", tag:"mo", output:"]", tex:null, ttype:RIGHTBRACKET},
{input:"^", tag:"msup", output:"^", tex:null, ttype:INFIX},
{input:"^", tag:"msup", output:"^", tex:null, ttype:INFIX},
{input:"^^", tag:"mo", output:"\u2227", tex:"wedge", ttype:CONST},
{input:"^^^", tag:"mo", output:"\u22C0", tex:"bigwedge", ttype:UNDEROVER},
{input:"_", tag:"msub", output:"_", tex:null, ttype:INFIX},
{input:"_", tag:"msub", output:"_", tex:null, ttype:INFIX},
{input:"__|", tag:"mo", output:"\u230B", tex:"rfloor", ttype:CONST},
{input:"_|_", tag:"mo", output:"\u22A5", tex:"bot", ttype:CONST},
{input:"{", tag:"mo", output:"{", tex:"lbrace", ttype:LEFTBRACKET},
{input:"{:", tag:"mo", output:"{:", tex:null, ttype:LEFTBRACKET, invisible:true},
{input:"|--", tag:"mo", output:"\u22A2", tex:"vdash", ttype:CONST},
{input:"|", tag:"mo", output:"|", tex:null, ttype:LEFTRIGHT},
{input:"|__", tag:"mo", output:"\u230A", tex:"lfloor", ttype:CONST},
{input:"|~", tag:"mo", output:"\u2308", tex:"lceil", ttype:CONST},
{input:"|==", tag:"mo", output:"\u22A8", tex:"models", ttype:CONST},
{input:"|->", tag:"mo", output:"\u21A6", tex:"mapsto", ttype:CONST},
{input:"}", tag:"mo", output:"}", tex:"rbrace", ttype:RIGHTBRACKET},
{input:"~|", tag:"mo", output:"\u2309", tex:"rceil", ttype:CONST},
{input:"~~", tag:"mo", output:"\u2248", tex:"approx", ttype:CONST},
{input:"~=", tag:"mo", output:"\u2245", tex:"cong", ttype:CONST},
{input:"+-", tag:"mo", output:"\u00B1", tex:"pm", ttype:CONST},
{input:"-<", tag:"mo", output:"\u227A", tex:"prec", ttype:CONST},
{input:"<<", tag:"mo", output:"\u2329", tex:"langle", ttype:LEFTBRACKET},
{input:"-<=", tag:"mo", output:"\u2AAF", tex:"preceq", ttype:CONST},
{input:"<=>", tag:"mo", output:"\u21D4", tex:"Leftrightarrow", ttype:CONST},
{input:"-=", tag:"mo", output:"\u2261", tex:"equiv", ttype:CONST},
{input:"=>", tag:"mo", output:"\u21D2", tex:"Rightarrow", ttype:CONST},
{input:"->", tag:"mo", output:"\u2192", tex:"to", ttype:CONST},
{input:">-", tag:"mo", output:"\u227B", tex:"succ", ttype:CONST},
{input:">=", tag:"mo", output:"\u2265", tex:"ge", ttype:CONST},
{input:">-=", tag:"mo", output:"\u2AB0", tex:"succeq", ttype:CONST},
{input:"->>", tag:"mo", output:"\u21A0", tex:"twoheadrightarrow", ttype:CONST},
{input:">->", tag:"mo", output:"\u21A3", tex:"rightarrowtail", ttype:CONST},
{input:">>", tag:"mo", output:"\u232A", tex:"rangle", ttype:RIGHTBRACKET},
{input:">->>", tag:"mo", output:"\u2916", tex:"twoheadrightarrowtail", ttype:CONST},
{input:"AA", tag:"mo", output:"\u00C5", tex:null, ttype:CONST},
{input:"aa", tag:"mo", output:"\u00E5", tex:null, ttype:CONST},
{input:"AA", tag:"mo", output:"\u2200", tex:"forall", ttype:CONST},
{input:"abs", tag:"mo", output:"abs", tex:null, ttype:UNARY, func:true},
{input:"acute", tag:"mover", output:"\u00B4", tex:null, ttype:UNARY, acc:true},
{input:"AE", tag:"mo", output:"\u00C6", tex:null, ttype:CONST},
{input:"ae", tag:"mo", output:"\u00E6", tex:null, ttype:CONST},
{input:"aleph", tag:"mo", output:"\u2135", tex:null, ttype:CONST},
{input:"alpha", tag:"mi", output:"\u03B1", tex:null, ttype:CONST},
{input:"amalg", tag:"mo", output:"\u2210", tex:null, ttype:CONST},
{input:"and", tag:"mtext", output:"and", tex:null, ttype:SPACE},
{input:"angle", tag:"mo", output:"\u2222", tex:null, ttype:CONST},
{input:"approx", tag:"mo", output:"\u2248", tex:null, ttype:CONST},
{input:"approxeq", tag:"mo", output:"\u224A", tex:null, ttype:CONST},
{input:"arccos", tag:"mo", output:"arccos", tex:null, ttype:UNARY, func:true},
{input:"arcsin", tag:"mo", output:"arcsin", tex:null, ttype:UNARY, func:true},
{input:"arctan", tag:"mo", output:"arctan", tex:null, ttype:UNARY, func:true},
{input:"arg", tag:"mi", output:"arg", tex:null, ttype:UNARY, func:true},
{input:"ast", tag:"mo", output:"\u002A", tex:null, ttype:CONST},
{input:"asymp", tag:"mo", output:"\u224D", tex:null, ttype:CONST},
{input:"atop", tag:"mfrac", output:"", tex:null, ttype:INFIX},
{input:"backprime", tag:"mo", output:"\u2035", tex:null, ttype:CONST},
{input:"backsim", tag:"mo", output:"\u223D", tex:null, ttype:CONST},
{input:"backsimeq", tag:"mo", output:"\u22CD", tex:null, ttype:CONST},
{input:"backslash", tag:"mo", output:"\u2216", atval:"1", tex:null, ttype:STRETCHY},
{input:"bar", tag:"mover", output:"\u00AF", tex:null, ttype:UNARY, acc:true},
{input:"barwedge", tag:"mo", output:"\u22BC", tex:null, ttype:CONST},
{input:"bb", tag:"mstyle", atname:"fontweight", atval:"bold", output:"bb", tex:null, ttype:UNARY},
{input:"bbb", tag:"mstyle", atname:"mathvariant", atval:"double-struck", output:"bbb", tex:null, ttype:UNARY, codes:AMbbb},
{input:"Bbb{A}", tag:"mo", output:"\uD835\uDD38", tex:"Bbb{A}", ttype:CONST},
{input:"because", tag:"mo", output:"\u2235", tex:null, ttype:CONST},
{input:"beta", tag:"mi", output:"\u03B2", tex:null, ttype:CONST},
{input:"beth", tag:"mo", output:"\u2136", tex:null, ttype:CONST},
{input:"between", tag:"mo", output:"\u226C", tex:null, ttype:CONST},
{input:"bigcap", tag:"mo", output:"\u22C2", tex:null, ttype:UNDEROVER},
{input:"bigcirc", tag:"mo", output:"\u25CB", tex:null, ttype:CONST},
{input:"bigcup", tag:"mo", output:"\u22C3", tex:null, ttype:UNDEROVER},
{input:"bigodot", tag:"mo", output:"\u2A00", tex:null, ttype:UNDEROVER},
{input:"bigoplus", tag:"mo", output:"\u2A01", tex:null, ttype:UNDEROVER},
{input:"bigotimes", tag:"mo", output:"\u2A02", tex:null, ttype:UNDEROVER},
{input:"bigsqcap", tag:"mo", output:"\u2A05", tex:null, ttype:UNDEROVER},
{input:"bigsqcup", tag:"mo", output:"\u2A06", tex:null, ttype:UNDEROVER},
{input:"bigstar", tag:"mo", output:"\u2605", tex:null, ttype:CONST},
{input:"bigtriangledown",tag:"mo",output:"\u25BD", tex:null, ttype:CONST},
{input:"bigtriangleup",tag:"mo",output:"\u25B3", tex:null, ttype:CONST},
{input:"biguplus", tag:"mo", output:"\u2A04", tex:null, ttype:UNDEROVER},
{input:"bigwedge", tag:"mo", output:"\u22C0", tex:null, ttype:UNDEROVER},
{input:"bigwedge", tag:"mo", output:"\u22C0", tex:null, ttype:UNDEROVER},
{input:"bigvee", tag:"mo", output:"\u22C1", tex:null, ttype:UNDEROVER},
{input:"blacktriangle", tag:"mo", output:"\u25B4", tex:null, ttype:CONST},
{input:"blacktriangledown", tag:"mo", output:"\u25BE", tex:null, ttype:CONST},
{input:"blacktriangleleft", tag:"mo", output:"\u25C0", tex:null, ttype:CONST},
{input:"blacktriangleright", tag:"mo", output:"\u25B6", tex:null, ttype:CONST},
{input:"bot", tag:"mo", output:"\u22A5", tex:null, ttype:CONST},
{input:"bowtie", tag:"mo", output:"\u22C8", tex:null, ttype:CONST},
{input:"Box", tag:"mo", output:"\u25A1", tex:null, ttype:CONST},
{input:"boxdot", tag:"mo", output:"\u22A1", tex:null, ttype:CONST},
{input:"boxminus", tag:"mo", output:"\u229F", tex:null, ttype:CONST},
{input:"boxplus", tag:"mo", output:"\u229E", tex:null, ttype:CONST},
{input:"boxtimes", tag:"mo", output:"\u22A0", tex:null, ttype:CONST},
{input:"breve", tag:"mover", output:"\u02D8", tex:null, ttype:UNARY, acc:true},
{input:"bullet", tag:"mo", output:"\u2022", tex:null, ttype:CONST},
{input:"Bumpeq", tag:"mo", output:"\u224E", tex:null, ttype:CONST},
{input:"bumpeq", tag:"mo", output:"\u224F", tex:null, ttype:CONST},
{input:"cap", tag:"mo", output:"\u2229", tex:null, ttype:CONST},
{input:"Cap", tag:"mo", output:"\u22D2", tex:null, ttype:CONST},
{input:"CC", tag:"mo", output:"\u2102", tex:"mathbb{C}", ttype:CONST, notexcopy:true},
{input:"cc", tag:"mstyle", atname:"mathvariant", atval:"script", output:"cc", tex:null, ttype:UNARY, codes:AMcal},
{input:"cdot", tag:"mo", output:"\u22C5", tex:null, ttype:CONST},
{input:"cdotp", tag:"mo", output:"\u00B7", tex:null, ttype:CONST},
{input:"cdots", tag:"mo", output:"\u22EF", tex:null, ttype:CONST},
{input:"check", tag:"mover", output:"\u02C7", tex:null, ttype:UNARY, acc:true},
{input:"checkmark", tag:"mo", output:"\u2713", tex:null, ttype:CONST},
{input:"chi", tag:"mi", output:"\u03C7", tex:null, ttype:CONST},
{input:"choose", tag:"mfrac", output:"", tex:null, ttype:INFIX},
{input:"circ", tag:"mo", output:"\u2218", tex:null, ttype:CONST},
{input:"circeq", tag:"mo", output:"\u2257", tex:null, ttype:CONST},
{input:"circledast", tag:"mo", output:"\u229B", tex:null, ttype:CONST},
{input:"circledcirc", tag:"mo", output:"\u229A", tex:null, ttype:CONST},
{input:"circleddash", tag:"mo", output:"\u229D", tex:null, ttype:CONST},
{input:"circledR", tag:"mo", output:"\u24C7", tex:null, ttype:CONST},
{input:"circledS", tag:"mo", output:"\u24C8", tex:null, ttype:CONST},
{input:"clubsuit", tag:"mo", output:"\u2663", tex:null, ttype:CONST},
{input:"colon", tag:"mo", output:"\u003A", tex:null, ttype:CONST},
{input:"complement", tag:"mo", output:"\u2201", tex:null, ttype:CONST},
{input:"cong", tag:"mo", output:"\u2245", tex:null, ttype:CONST},
{input:"coprod", tag:"mo", output:"\u2210", tex:null, ttype:UNDEROVER},
{input:"cos", tag:"mo", output:"cos", tex:null, ttype:UNARY, func:true},
{input:"cosh", tag:"mo", output:"cosh", tex:null, ttype:UNARY, func:true},
{input:"cot", tag:"mo", output:"cot", tex:null, ttype:UNARY, func:true},
{input:"coth", tag:"mo", output:"coth", tex:null, ttype:UNARY, func:true},
{input:"csc", tag:"mo", output:"csc", tex:null, ttype:UNARY, func:true},
{input:"cup", tag:"mo", output:"\u222A", tex:null, ttype:CONST},
{input:"Cup", tag:"mo", output:"\u22D3", tex:null, ttype:CONST},
{input:"curlyeqprec", tag:"mo", output:"\u22DE", tex:null, ttype:CONST},
{input:"curlyeqsucc", tag:"mo", output:"\u22DF", tex:null, ttype:CONST},
{input:"curlywedge", tag:"mo", output:"\u22CF", tex:null, ttype:CONST},
{input:"curlyvee", tag:"mo", output:"\u22CE", tex:null, ttype:CONST},
{input:"curvearrowleft", tag:"mo", output:"\u21B6", tex:null, ttype:CONST},
{input:"curvearrowright", tag:"mo", output:"\u21B7", tex:null, ttype:CONST},
{input:"dag", tag:"mo", output:"\u2020", tex:null, ttype:CONST},
{input:"dagger", tag:"mo", output:"\u2020", tex:null, ttype:CONST},
{input:"daleth", tag:"mo", output:"\u2138", tex:null, ttype:CONST},
{input:"darr", tag:"mo", output:"\u2193", tex:"downarrow", ttype:CONST},
{input:"dashv", tag:"mo", output:"\u22A3", tex:null, ttype:CONST},
{input:"ddag", tag:"mo", output:"\u2021", tex:null, ttype:CONST},
{input:"ddagger", tag:"mo", output:"\u2021", tex:null, ttype:CONST},
{input:"ddot", tag:"mover", output:"..", tex:null, ttype:UNARY, acc:true},
{input:"ddots", tag:"mo", output:"\u22F1", tex:null, ttype:CONST},
{input:"deg", tag:"mi", output:"deg", tex:null, ttype:UNARY, func:true},
{input:"del", tag:"mo", output:"\u2202", tex:"partial", ttype:CONST},
{input:"delta", tag:"mi", output:"\u03B4", tex:null, ttype:CONST},
{input:"Delta", tag:"mo", output:"\u0394", tex:null, ttype:CONST},
{input:"det", tag:"mo", output:"det", tex:null, ttype:UNARY, func:true},
{input:"diamond", tag:"mo", output:"\u22C4", tex:null, ttype:CONST},
{input:"Diamond", tag:"mo", output:"\u2662", tex:null, ttype:CONST},
{input:"diamondsuit", tag:"mo", output:"\u2662", tex:null, ttype:CONST},
{input:"dim", tag:"mo", output:"dim", tex:null, ttype:CONST},
{input:"displaystyle",tag:"mstyle",atname:"displaystyle",atval:"true", tex:null, ttype:UNARY},
{input:"div", tag:"mo", output:"\u00F7", tex:null, ttype:CONST},
{input:"divide", tag:"mo", output:"-:", tex:null, ttype:DEFINITION},
{input:"divideontimes", tag:"mo", output:"\u22C7", tex:null, ttype:CONST},
{input:"dot", tag:"mover", output:".", tex:null, ttype:UNARY, acc:true},
{input:"doteq", tag:"mo", output:"\u2250", tex:null, ttype:CONST},
{input:"Doteq", tag:"mo", output:"\u2251", tex:null, ttype:CONST},
{input:"dotplus", tag:"mo", output:"\u2214", tex:null, ttype:CONST},
{input:"dots", tag:"mo", output:"\u2026", tex:null, ttype:CONST},
{input:"doublebarwedge", tag:"mo", output:"\u2A5E", tex:null, ttype:CONST},
{input:"downarrow", tag:"mo", output:"\u2193", tex:null, ttype:CONST},
{input:"Downarrow", tag:"mo", output:"\u21D3", tex:null, ttype:CONST},
{input:"downdownarrows", tag:"mo", output:"\u21CA", tex:null, ttype:CONST},
{input:"downharpoonleft", tag:"mo", output:"\u21C3", tex:null, ttype:CONST},
{input:"downharpoonright", tag:"mo", output:"\u21C2", tex:null, ttype:CONST},
{input:"dt", tag:"mi", output:"{:d t:}", tex:null, ttype:DEFINITION},
{input:"dx", tag:"mi", output:"{:d x:}", tex:null, ttype:DEFINITION},
{input:"dy", tag:"mi", output:"{:d y:}", tex:null, ttype:DEFINITION},
{input:"dz", tag:"mi", output:"{:d z:}", tex:null, ttype:DEFINITION},
{input:"EE", tag:"mo", output:"\u2203", tex:"exists", ttype:CONST},
{input:"ell", tag:"mo", output:"\u2113", tex:null, ttype:CONST},
{input:"emptyset", tag:"mo", output:"\u2205", tex:null, ttype:CONST},
{input:"epsilon", tag:"mi", output:"\u03B5", tex:null, ttype:CONST},
{input:"eqcirc", tag:"mo", output:"\u2256", tex:null, ttype:CONST},
{input:"eqsim", tag:"mo", output:"\u2242", tex:null, ttype:CONST},
{input:"eqslantgtr", tag:"mo", output:"\u2A96", tex:null, ttype:CONST},
{input:"eqslantless", tag:"mo", output:"\u2A95", tex:null, ttype:CONST},
{input:"equiv", tag:"mo", output:"\u2261", tex:null, ttype:CONST},
{input:"eta", tag:"mi", output:"\u03B7", tex:null, ttype:CONST},
{input:"exists", tag:"mo", output:"\u2203", tex:null, ttype:CONST},
{input:"exp", tag:"mi", output:"exp", tex:null, ttype:UNARY, func:true},
//{input:"f", tag:"mi", output:"f", tex:null, ttype:UNARY, func:true, val:true},
{input:"fallingdotseq", tag:"mo", output:"\u2252", tex:null, ttype:CONST},
{input:"Finv", tag:"mo", output:"\u2132", tex:null, ttype:CONST},
{input:"flat", tag:"mo", output:"\u266D", tex:null, ttype:CONST},
{input:"forall", tag:"mo", output:"\u2200", tex:null, ttype:CONST},
{input:"fr", tag:"mstyle", atname:"mathvariant", atval:"fraktur", output:"fr", tex:null, ttype:UNARY, codes:AMfrk},
{input:"frac", tag:"mfrac", output:"/", tex:null, ttype:BINARY},
{input:"frac", tag:"mfrac", output:"/", tex:null, ttype:BINARY},
{input:"frac12", tag:"mo", output:"\u00BD", tex:null, ttype:CONST},
{input:"frac13", tag:"mo", output:"\u2153", tex:null, ttype:CONST},
{input:"frac14", tag:"mo", output:"\u00BC", tex:null, ttype:CONST},
{input:"frac15", tag:"mo", output:"\u2155", tex:null, ttype:CONST},
{input:"frac16", tag:"mo", output:"\u2159", tex:null, ttype:CONST},
{input:"frac18", tag:"mo", output:"\u215B", tex:null, ttype:CONST},
{input:"frac23", tag:"mo", output:"\u2154", tex:null, ttype:CONST},
{input:"frac25", tag:"mo", output:"\u2156", tex:null, ttype:CONST},
{input:"frac34", tag:"mo", output:"\u00BE", tex:null, ttype:CONST},
{input:"frac35", tag:"mo", output:"\u2157", tex:null, ttype:CONST},
{input:"frac38", tag:"mo", output:"\u215C", tex:null, ttype:CONST},
{input:"frac45", tag:"mo", output:"\u2158", tex:null, ttype:CONST},
{input:"frac56", tag:"mo", output:"\u215A", tex:null, ttype:CONST},
{input:"frac58", tag:"mo", output:"\u215D", tex:null, ttype:CONST},
{input:"frac78", tag:"mo", output:"\u215E", tex:null, ttype:CONST},
{input:"frown", tag:"mo", output:"\u2322", tex:null, ttype:CONST},
//{input:"g", tag:"mi", output:"g", tex:null, ttype:UNARY, func:true, val:true},
{input:"Game", tag:"mo", output:"\u2141", tex:null, ttype:CONST},
{input:"gamma", tag:"mi", output:"\u03B3", tex:null, ttype:CONST},
{input:"Gamma", tag:"mo", output:"\u0393", tex:null, ttype:CONST},
{input:"gcd", tag:"mo", output:"gcd", tex:null, ttype:UNARY, func:true},
{input:"ge", tag:"mo", output:"\u2265", tex:null, ttype:CONST},
{input:"geq", tag:"mo", output:"\u2265", tex:null, ttype:CONST},
{input:"geqq", tag:"mo", output:"\u2267", tex:null, ttype:CONST},
{input:"geqslant", tag:"mo", output:"\u2265", tex:null, ttype:CONST},
{input:"gets", tag:"mo", output:"\u2190", tex:null, ttype:CONST},
{input:"gg", tag:"mo", output:"\u226B", tex:null, ttype:CONST},
{input:"ggg", tag:"mo", output:"\u22D9", tex:null, ttype:CONST},
{input:"gimel", tag:"mo", output:"\u2137", tex:null, ttype:CONST},
{input:"glb", tag:"mo", output:"glb", tex:null, ttype:CONST},
{input:"gnapprox", tag:"mo", output:"\u2A8A", tex:null, ttype:CONST},
{input:"gneq", tag:"mo", output:"\u2A88", tex:null, ttype:CONST},
{input:"gneqq", tag:"mo", output:"\u2269", tex:null, ttype:CONST},
{input:"gnsim", tag:"mo", output:"\u22E7", tex:null, ttype:CONST},
{input:"grad", tag:"mo", output:"\u2207", tex:"nabla", ttype:CONST},
{input:"grave", tag:"mover", output:"\u0060", tex:null, ttype:UNARY, acc:true},
{input:"gt", tag:"mo", output:"\u003E", tex:null, ttype:CONST},
{input:"gt=", tag:"mo", output:"\u2265", tex:"geq", ttype:CONST},
{input:"gtrapprox", tag:"mo", output:"\u2A86", tex:null, ttype:CONST},
{input:"gtrdot", tag:"mo", output:"\u22D7", tex:null, ttype:CONST},
{input:"gtreqless", tag:"mo", output:"\u22DB", tex:null, ttype:CONST},
{input:"gtreqqless", tag:"mo", output:"\u2A8C", tex:null, ttype:CONST},
{input:"gtrless", tag:"mo", output:"\u2277", tex:null, ttype:CONST},
{input:"gtrsim", tag:"mo", output:"\u2273", tex:null, ttype:CONST},
{input:"harr", tag:"mo", output:"\u2194", tex:"leftrightarrow", ttype:CONST},
{input:"hArr", tag:"mo", output:"\u21D4", tex:"Leftrightarrow", ttype:CONST},
{input:"hat", tag:"mover", output:"\u005E", tex:null, ttype:UNARY, acc:true},
{input:"hbar", tag:"mo", output:"\u210F", tex:null, ttype:CONST},
{input:"Heart", tag:"mo", output:"\u2661", tex:"heartsuit", ttype:CONST},
{input:"heartsuit", tag:"mo", output:"\u2661", tex:null, ttype:CONST},
{input:"hom", tag:"mi", output:"hom", tex:null, ttype:UNARY, func:true},
{input:"hookleftarrow", tag:"mo", output:"\u21A9", tex:null, ttype:CONST},
{input:"hookrightarrow", tag:"mo", output:"\u21AA", tex:null, ttype:CONST},
{input:"hslash", tag:"mo", output:"\u210F", tex:null, ttype:CONST},
//{input:"i", tag:"mo", output:"\u0131", tex:null, ttype:CONST},
{input:"if", tag:"mo", output:"if", tex:null, ttype:SPACE},
{input:"iff", tag:"mo", output:"~\\Longleftrightarrow~", tex:null, ttype:DEFINITION},
{input:"iff", tag:"mo", output:"<=>", tex:null, ttype:DEFINITION},
{input:"iiiint", tag:"mo", output:"\u2A0C", tex:null, ttype:CONST},
{input:"iiint", tag:"mo", output:"\u222D", tex:null, ttype:CONST},
{input:"iint", tag:"mo", output:"\u222C", tex:null, ttype:CONST},
{input:"Im", tag:"mo", output:"\u2111", tex:null, ttype:CONST},
{input:"imath", tag:"mo", output:"\uD835\uDEA4", tex:null, ttype:CONST},
{input:"implies", tag:"mo", output:"\u21D2", tex:null, ttype:LONG},
{input:"in", tag:"mo", output:"\u2208", tex:null, ttype:CONST},
{input:"inf", tag:"mo", output:"inf", tex:null, ttype:UNDEROVER},
{input:"infty", tag:"mo", output:"\u221E", tex:null, ttype:CONST},
{input:"int", tag:"mo", output:"\u222B", tex:null, ttype:CONST},
{input:"intercal", tag:"mo", output:"\u22BA", tex:null, ttype:CONST},
{input:"iota", tag:"mi", output:"\u03B9", tex:null, ttype:CONST},
{input:"jmath", tag:"mo", output:"\uD835\uDEA5", tex:null, ttype:CONST},
{input:"Join", tag:"mo", output:"\u22C8", tex:null, ttype:CONST},
{input:"kappa", tag:"mi", output:"\u03BA", tex:null, ttype:CONST},
{input:"ker", tag:"mi", output:"ker", tex:null, ttype:UNARY, func:true},
//{input:"L", tag:"mo", output:"\u0141", tex:null, ttype:CONST},
//{input:"l", tag:"mo", output:"\u0142", tex:null, ttype:CONST},
{input:"lambda", tag:"mi", output:"\u03BB", tex:null, ttype:CONST},
{input:"Lambda", tag:"mo", output:"\u039B", tex:null, ttype:CONST},
{input:"land", tag:"mo", output:"\u2227", tex:null, ttype:CONST},
{input:"langle", tag:"mo", output:"\u2329", atval:"1", tex:null, ttype:STRETCHY},
{input:"larr", tag:"mo", output:"\u2190", tex:"leftarrow", ttype:CONST},
{input:"lArr", tag:"mo", output:"\u21D0", tex:"Leftarrow", ttype:CONST},
{input:"lbrace", tag:"mo", output:"{", atval:"1", tex:null, ttype:STRETCHY},
{input:"lbrack", tag:"mo", output:"[", tex:"[", ttype:LEFTBRACKET},
{input:"lceil", tag:"mo", output:"\u2308", atval:"1", tex:null, ttype:STRETCHY},
{input:"lceiling", tag:"mo", output:"|~", tex:null, ttype:DEFINITION},
{input:"lcm", tag:"mo", output:"lcm", tex:null, ttype:UNARY, func:true},
{input:"ldots", tag:"mo", output:"\u2026", tex:null, ttype:CONST},
{input:"le", tag:"mo", output:"\u2264", tex:null, ttype:CONST},
{input:"left", tag:"mo", output:"\left", tex:null, ttype:LEFTBRACKET},
{input:"leftarrow", tag:"mo", output:"\u2190", tex:null, ttype:CONST},
{input:"Leftarrow", tag:"mo", output:"\u21D0", tex:null, ttype:CONST},
{input:"leftarrowtail", tag:"mo", output:"\u21A2", tex:null, ttype:CONST},
{input:"leftharpoondown", tag:"mo", output:"\u21BD", tex:null, ttype:CONST},
{input:"leftharpoonup", tag:"mo", output:"\u21BC", tex:null, ttype:CONST},
{input:"leftleftarrows", tag:"mo", output:"\u21C7", tex:null, ttype:CONST},
{input:"leftrightarrow", tag:"mo", output:"\u2194", tex:null, ttype:CONST},
{input:"Leftrightarrow", tag:"mo", output:"\u21D4", tex:null, ttype:CONST},
{input:"leftrightarrows", tag:"mo", output:"\u21C6", tex:null, ttype:CONST},
{input:"leftrightharpoons", tag:"mo", output:"\u21CB", tex:null, ttype:CONST},
{input:"leftrightsquigarrow", tag:"mo", output:"\u21AD", tex:null, ttype:CONST},
{input:"leftthreetimes", tag:"mo", output:"\u22CB", tex:null, ttype:CONST},
{input:"leq", tag:"mo", output:"\u2264", tex:null, ttype:CONST},
{input:"leqq", tag:"mo", output:"\u2266", tex:null, ttype:CONST},
{input:"leqslant", tag:"mo", output:"\u2264", tex:null, ttype:CONST},
{input:"lessapprox", tag:"mo", output:"\u2A85", tex:null, ttype:CONST},
{input:"lessdot", tag:"mo", output:"\u22D6", tex:null, ttype:CONST},
{input:"lesseqgtr", tag:"mo", output:"\u22DA", tex:null, ttype:CONST},
{input:"lesseqqgtr", tag:"mo", output:"\u2A8B", tex:null, ttype:CONST},
{input:"lessgtr", tag:"mo", output:"\u2276", tex:null, ttype:CONST},
{input:"lesssim", tag:"mo", output:"\u2272", tex:null, ttype:CONST},
{input:"lfloor", tag:"mo", output:"\u230A", atval:"1", tex:null, ttype:STRETCHY},
{input:"lg", tag:"mi", output:"lg", tex:null, ttype:UNARY, func:true},
{input:"lhd", tag:"mo", output:"\u22B2", tex:null, ttype:CONST},
{input:"lim", tag:"mo", output:"lim", tex:null, ttype:UNDEROVER},
{input:"liminf", tag:"mo", output:"liminf", tex:null, ttype:UNDEROVER},
{input:"limsup", tag:"mo", output:"limsup", tex:null, ttype:UNDEROVER},
{input:"ll", tag:"mo", output:"\u226A", tex:null, ttype:CONST},
{input:"llcorner", tag:"mo", output:"\u231E", tex:null, ttype:CONST},
{input:"Lleftarrow", tag:"mo", output:"\u21DA", tex:null, ttype:CONST},
{input:"lll", tag:"mo", output:"\u22D8", tex:null, ttype:CONST},
{input:"lmoustache", tag:"mo", output:"\u23B0", tex:null, ttype:CONST},
{input:"ln", tag:"mo", output:"ln", tex:null, ttype:UNARY, func:true},
{input:"lnapprox", tag:"mo", output:"\u2A89", tex:null, ttype:CONST},
{input:"lneq", tag:"mo", output:"\u2A87", tex:null, ttype:CONST},
{input:"lneqq", tag:"mo", output:"\u2268", tex:null, ttype:CONST},
{input:"lnot", tag:"mo", output:"\u00AC", tex:null, ttype:CONST},
{input:"lnsim", tag:"mo", output:"\u22E6", tex:null, ttype:CONST},
{input:"log", tag:"mo", output:"log", tex:null, ttype:UNARY, func:true},
{input:"longleftarrow", tag:"mo", output:"\u2190", tex:null, ttype:LONG},
{input:"Longleftarrow", tag:"mo", output:"\u21D0", tex:null, ttype:LONG},
{input:"longleftrightarrow", tag:"mo", output:"\u2194", tex:null, ttype:LONG},
{input:"Longleftrightarrow", tag:"mo", output:"\u21D4", tex:null, ttype:LONG},
{input:"longmapsto", tag:"mo", output:"\u21A6", tex:null, ttype:CONST},
{input:"longrightarrow", tag:"mo", output:"\u2192", tex:null, ttype:LONG},
{input:"Longrightarrow", tag:"mo", output:"\u21D2", tex:null, ttype:LONG},
{input:"looparrowleft", tag:"mo", output:"\u21AB", tex:null, ttype:CONST},
{input:"looparrowright", tag:"mo", output:"\u21AC", tex:null, ttype:CONST},
{input:"lor", tag:"mo", output:"\u2228", tex:null, ttype:CONST},
{input:"lozenge", tag:"mo", output:"\u25CA", tex:null, ttype:CONST},
{input:"lrcorner", tag:"mo", output:"\u231F", tex:null, ttype:CONST},
{input:"Lsh", tag:"mo", output:"\u21B0", tex:null, ttype:CONST},
{input:"-lt", tag:"mo", output:"\u227A", tex:null, ttype:CONST},
{input:"lt", tag:"mo", output:"\u003C", tex:null, ttype:CONST},
{input:"lt=", tag:"mo", output:"\u2264", tex:"leq", ttype:CONST},
{input:"ltimes", tag:"mo", output:"\u22C9", tex:null, ttype:CONST},
{input:"lub", tag:"mo", output:"lub", tex:null, ttype:CONST},
{input:"maltese", tag:"mo", output:"\u2720", tex:null, ttype:CONST},
{input:"mapsto", tag:"mo", output:"\u21A6", tex:null, ttype:CONST},
{input:"mathbb", tag:"mstyle", atname:"mathvariant", atval:"double-struck", output:"mathbb", tex:null, ttype:UNARY, codes:AMbbb},
{input:"mathbf", tag:"mstyle", atname:"fontweight", atval:"bold", output:"mathbf", tex:null, ttype:UNARY},
{input:"mathcal", tag:"mstyle", atname:"mathvariant", atval:"script", output:"mathcal", tex:null, ttype:UNARY, codes:AMcal},
{input:"mathfrak", tag:"mstyle", atname:"mathvariant", atval:"fraktur", output:"mathfrak", tex:null, ttype:UNARY, codes:AMfrk},
{input:"mathit", tag:"mstyle", atname:"mathvariant", atval:"italic", tex:null, ttype:UNARY},
{input:"mathrm", tag:"mtext", output:"text", tex:null, ttype:TEXT},
{input:"mathsf", tag:"mstyle", atname:"fontfamily", atval:"sans-serif", output:"mathsf", tex:null, ttype:UNARY},
{input:"mathtt", tag:"mstyle", atname:"fontfamily", atval:"monospace", output:"mathtt", tex:null, ttype:UNARY},
{input:"max", tag:"mo", output:"max", tex:null, ttype:UNDEROVER},
{input:"mbox", tag:"mtext", output:"mbox", tex:null, ttype:TEXT},
{input:"measuredangle", tag:"mo", output:"\u2221", tex:null, ttype:CONST},
{input:"mho", tag:"mo", output:"\u2127", tex:null, ttype:CONST},
{input:"mid", tag:"mo", output:"\u2223", atval:"1", tex:null, ttype:STRETCHY},
{input:"min", tag:"mo", output:"min", tex:null, ttype:UNDEROVER},
{input:"mod", tag:"mo", output:"mod", tex:null, ttype:CONST},
{input:"models", tag:"mo", output:"\u22A8", tex:null, ttype:CONST},
{input:"mp", tag:"mo", output:"\u2213", tex:null, ttype:CONST},
{input:"mu", tag:"mi", output:"\u03BC", tex:null, ttype:CONST},
{input:"multimap", tag:"mo", output:"\u22B8", tex:null, ttype:CONST},
{input:"nabla", tag:"mo", output:"\u2207", tex:null, ttype:CONST},
{input:"natural", tag:"mo", output:"\u266E", tex:null, ttype:CONST},
{input:"ncong", tag:"mo", output:"\u2247", tex:null, ttype:CONST},
{input:"ne", tag:"mo", output:"\u2260", tex:null, ttype:CONST},
{input:"nearrow", tag:"mo", output:"\u2197", tex:null, ttype:CONST},
{input:"neg", tag:"mo", output:"\u00AC", tex:null, ttype:CONST},
{input:"neq", tag:"mo", output:"\u2260", tex:null, ttype:CONST},
{input:"nexists", tag:"mo", output:"\u2204", tex:null, ttype:CONST},
{input:"ngeq", tag:"mo", output:"\u2271", tex:null, ttype:CONST},
{input:"ngtr", tag:"mo", output:"\u226F", tex:null, ttype:CONST},
{input:"ni", tag:"mo", output:"\u220B", tex:null, ttype:CONST},
{input:"nleftarrow", tag:"mo", output:"\u219A", tex:null, ttype:CONST},
{input:"nLeftarrow", tag:"mo", output:"\u21CD", tex:null, ttype:CONST},
{input:"nleftrightarrow", tag:"mo", output:"\u21AE", tex:null, ttype:CONST},
{input:"nLeftrightarrow", tag:"mo", output:"\u21CE", tex:null, ttype:CONST},
{input:"nleq", tag:"mo", output:"\u2270", tex:null, ttype:CONST},
{input:"nless", tag:"mo", output:"\u226E", tex:null, ttype:CONST},
{input:"nmid", tag:"mo", output:"\u2224", tex:null, ttype:CONST},
{input:"NN", tag:"mo", output:"\u2115", tex:"mathbb{N}", ttype:CONST, notexcopy:true},
{input:"nn", tag:"mo", output:"\u2229", tex:"cap", ttype:CONST},
{input:"nnn", tag:"mo", output:"\u22C2", tex:"bigcap", ttype:UNDEROVER},
{input:"not", tag:"mo", output:"\u00AC", tex:"neg", ttype:CONST},
{input:"not\\leq", tag:"mo", output:"\u2270", tex:null, ttype:CONST},
{input:"not<", tag:"mo", output:"\u226E", tex:"not<", ttype:CONST},
{input:"not=", tag:"mo", output:"\u2260", tex:"not=", ttype:CONST},
{input:"not>", tag:"mo", output:"\u226F", tex:"not>", ttype:CONST},
{input:"notexist", tag:"mo", output:"\u2204", tex:"not\\exists", ttype:CONST},
{input:"notgeq", tag:"mo", output:"\u2271", tex:"not\\geq", ttype:CONST},
{input:"notin", tag:"mo", output:"\u2209", tex:null, ttype:CONST},
{input:"notleq", tag:"mo", output:"\u2270", tex:"not\\leq", ttype:CONST},
{input:"notni", tag:"mo", output:"\u220C", tex:"not\\ni", ttype:CONST},
{input:"notsubset", tag:"mo", output:"\u2284", tex:"not\\subset", ttype:CONST},
{input:"notsubseteq", tag:"mo", output:"\u2288", tex:"not\\subseteq", ttype:CONST},
{input:"notsupset", tag:"mo", output:"\u2285", tex:"not\\supset", ttype:CONST},
{input:"notsupseteq", tag:"mo", output:"\u2289", tex:"not\\supseteq", ttype:CONST},
{input:"nparallel", tag:"mo", output:"\u2226", tex:null, ttype:CONST},
{input:"nprec", tag:"mo", output:"\u2280", tex:null, ttype:CONST},
{input:"nrightarrow", tag:"mo", output:"\u219B", tex:null, ttype:CONST},
{input:"nRightarrow", tag:"mo", output:"\u21CF", tex:null, ttype:CONST},
{input:"nsim", tag:"mo", output:"\u2241", tex:null, ttype:CONST},
{input:"nsubseteq", tag:"mo", output:"\u2288", tex:null, ttype:CONST},
{input:"nsucc", tag:"mo", output:"\u2281", tex:null, ttype:CONST},
{input:"nsupseteq", tag:"mo", output:"\u2289", tex:null, ttype:CONST},
{input:"ntriangleleft", tag:"mo", output:"\u22EA", tex:null, ttype:CONST},
{input:"ntrianglelefteq", tag:"mo", output:"\u22EC", tex:null, ttype:CONST},
{input:"ntriangleright", tag:"mo", output:"\u22EB", tex:null, ttype:CONST},
{input:"ntrianglerighteq", tag:"mo", output:"\u22ED", tex:null, ttype:CONST},
{input:"nu", tag:"mi", output:"\u03BD", tex:null, ttype:CONST},
{input:"nwarrow", tag:"mo", output:"\u2196", tex:null, ttype:CONST},
{input:"nvdash", tag:"mo", output:"\u22AC", tex:null, ttype:CONST},
{input:"nvDash", tag:"mo", output:"\u22AD", tex:null, ttype:CONST},
{input:"nVdash", tag:"mo", output:"\u22AE", tex:null, ttype:CONST},
{input:"nVDash", tag:"mo", output:"\u22AF", tex:null, ttype:CONST},
//{input:"O", tag:"mo", output:"\u00D8", tex:null, ttype:CONST},
//{input:"o", tag:"mo", output:"\u00F8", tex:null, ttype:CONST},
{input:"o.", tag:"mo", output:"\u2299", tex:"odot", ttype:CONST},
{input:"O/", tag:"mo", output:"\u2205", tex:"emptyset", ttype:CONST},
{input:"o+", tag:"mo", output:"\u2295", tex:"oplus", ttype:CONST},
{input:"odot", tag:"mo", output:"\u2299", tex:null, ttype:CONST},
{input:"OE", tag:"mo", output:"\u0152", tex:null, ttype:CONST},
{input:"oe", tag:"mo", output:"\u0153", tex:null, ttype:CONST},
{input:"oint", tag:"mo", output:"\u222E", tex:null, ttype:CONST},
{input:"omega", tag:"mi", output:"\u03C9", tex:null, ttype:CONST},
{input:"Omega", tag:"mo", output:"\u03A9", tex:null, ttype:CONST},
{input:"ominus", tag:"mo", output:"\u2296", tex:null, ttype:CONST},
{input:"oo", tag:"mo", output:"\u221E", tex:"infty", ttype:CONST},
{input:"oplus", tag:"mo", output:"\u2295", tex:null, ttype:CONST},
{input:"or", tag:"mtext", output:"or", tex:null, ttype:SPACE},
{input:"oslash", tag:"mo", output:"\u2298", tex:null, ttype:CONST},
{input:"otimes", tag:"mo", output:"\u2297", tex:null, ttype:CONST},
{input:"overbrace", tag:"mover", output:"\u23B4", tex:null, ttype:UNARY, acc:true},
{input:"overleftarrow",tag:"mover", output:"\u20D6", tex:null, ttype:UNARY, acc:true},
{input:"overleftrightarrow", tag:"mo", output:"\u20E1", tex:null, ttype:CONST},
{input:"overline", tag:"mover", output:"\u00AF", tex:null, ttype:UNARY, acc:true},
{input:"owns", tag:"mo", output:"\u220B", tex:"ni", ttype:CONST},
{input:"ox", tag:"mo", output:"\u2297", tex:"otimes", ttype:CONST},
{input:"parallel", tag:"mo", output:"\u2225", atval:"1", tex:null, ttype:STRETCHY},
{input:"partial", tag:"mo", output:"\u2202", tex:null, ttype:CONST},
{input:"perp", tag:"mo", output:"\u22A5", tex:null, ttype:CONST},
{input:"phi", tag:"mi", output:"\u03C6", tex:null, ttype:CONST},
{input:"Phi", tag:"mo", output:"\u03A6", tex:null, ttype:CONST},
{input:"pi", tag:"mi", output:"\u03C0", tex:null, ttype:CONST},
{input:"Pi", tag:"mo", output:"\u03A0", tex:null, ttype:CONST},
{input:"pitchfork", tag:"mo", output:"\u22D4", tex:null, ttype:CONST},
{input:"pm", tag:"mo", output:"\u00B1", tex:null, ttype:CONST},
{input:"Pr", tag:"mi", output:"Pr", tex:null, ttype:UNARY, func:true},
{input:"prec", tag:"mo", output:"\u227A", tex:null, ttype:CONST},
{input:"precapprox", tag:"mo", output:"\u2AB7", tex:null, ttype:CONST},
{input:"preccurlyeq", tag:"mo", output:"\u227C", tex:null, ttype:CONST},
{input:"preceq", tag:"mo", output:"\u227C", tex:null, ttype:CONST},
{input:"precnapprox", tag:"mo", output:"\u2AB9", tex:null, ttype:CONST},
{input:"precneqq", tag:"mo", output:"\u2AB5", tex:null, ttype:CONST},
{input:"precnsim", tag:"mo", output:"\u22E8", tex:null, ttype:CONST},
{input:"precsim", tag:"mo", output:"\u227E", tex:null, ttype:CONST},
{input:"prime", tag:"mo", output:"\u2032", tex:null, ttype:CONST},
{input:"prod", tag:"mo", output:"\u220F", tex:null, ttype:UNDEROVER},
{input:"prop", tag:"mo", output:"\u221D", tex:"propto", ttype:CONST},
{input:"propto", tag:"mo", output:"\u221D", tex:null, ttype:CONST},
{input:"Psi", tag:"mi", output:"\u03A8", tex:null, ttype:CONST},
{input:"psi", tag:"mi", output:"\u03C8", tex:null, ttype:CONST},
{input:"QQ", tag:"mo", output:"\u211A", tex:"mathbb{Q}", ttype:CONST, notexcopy:true},
{input:"qquad", tag:"mo", output:"\u00A0\u00A0\u00A0\u00A0", tex:null, ttype:CONST},
{input:"quad", tag:"mo", output:"\u00A0\u00A0", tex:null, ttype:CONST},
{input:"quad", tag:"mspace", atname:"width", atval:"1em", tex:null, ttype:SPACE},
{input:"rangle",tag:"mo",output:"\u232A", rtag:"mi",atval:"1", tex:"rangle", ttype:STRETCHY},
{input:"rarr", tag:"mo", output:"\u2192", tex:"rightarrow", ttype:CONST},
{input:"rArr", tag:"mo", output:"\u21D2", tex:"Rightarrow", ttype:CONST},
{input:"rbrace",tag:"mo",output:"}", rtag:"mi",atval:"1", tex:"rbrace", ttype:STRETCHY},
{input:"rbrack",tag:"mo",output:"]", tex:"]", ttype:RIGHTBRACKET},
{input:"rceil", tag:"mo",output:"\u2309", rtag:"mi",atval:"1", tex:"rceil", ttype:STRETCHY},
{input:"rceiling", tag:"mo", output:"~|", tex:null, ttype:DEFINITION},
{input:"Re", tag:"mo", output:"\u211C", tex:null, ttype:CONST},
{input:"rfloor",tag:"mo",output:"\u230B", rtag:"mi",atval:"1", tex:"rfloor", ttype:STRETCHY},
{input:"rhd", tag:"mo", output:"\u22B3", tex:null, ttype:CONST},
{input:"rho", tag:"mi", output:"\u03C1", tex:null, ttype:CONST},
{input:"right", tag:"mo", output:"\right", tex:null, ttype:RIGHTBRACKET},
{input:"rightarrow", tag:"mo", output:"\u2192", tex:null, ttype:CONST},
{input:"Rightarrow", tag:"mo", output:"\u21D2", tex:null, ttype:CONST},
{input:"rightarrowtail", tag:"mo", output:"\u21A3", tex:null, ttype:CONST},
{input:"rightharpoondown", tag:"mo", output:"\u21C1", tex:null, ttype:CONST},
{input:"rightharpoonup", tag:"mo", output:"\u21C0", tex:null, ttype:CONST},
{input:"rightleftarrows", tag:"mo", output:"\u21C4", tex:null, ttype:CONST},
{input:"rightleftharpoons", tag:"mo", output:"\u21CC", tex:null, ttype:CONST},
{input:"rightrightarrows", tag:"mo", output:"\u21C9", tex:null, ttype:CONST},
{input:"rightsquigarrow", tag:"mo", output:"\u21DD", tex:null, ttype:CONST},
{input:"rightthreetimes", tag:"mo", output:"\u22CC", tex:null, ttype:CONST},
{input:"risingdotseq", tag:"mo", output:"\u2253", tex:null, ttype:CONST},
{input:"rmoustache", tag:"mo", output:"\u23B1", tex:null, ttype:CONST},
{input:"root", tag:"mroot", output:"root", tex:null, ttype:BINARY},
{input:"RR", tag:"mo", output:"\u211D", tex:"mathbb{R}", ttype:CONST, notexcopy:true},
{input:"Rrightarrow", tag:"mo", output:"\u21DB", tex:null, ttype:CONST},
{input:"Rsh", tag:"mo", output:"\u21B1", tex:null, ttype:CONST},
{input:"rtimes", tag:"mo", output:"\u22CA", tex:null, ttype:CONST},
//{input:"S", tag:"mo", output:"\u00A7", tex:null, ttype:CONST},
{input:"s0s", tag:"mo", output:"\u200B", tex:"!", ttype:CONST},
{input:"s1s", tag:"mo", output:"\u200A", tex:"hspace{1}", ttype:CONST},
{input:"s2s", tag:"mo", output:"\u2009", tex:"hspace{2}", ttype:CONST},
{input:"s3s", tag:"mo", output:"\u2002", tex:"hspace{5}", ttype:CONST},
{input:"s4s", tag:"mo", output:"\u2003", tex:"hspace{10}", ttype:CONST},
{input:"scriptscriptstyle",tag:"mstyle",atname:"scriptlevel",atval:"2", tex:null, ttype:UNARY},
{input:"scriptstyle",tag:"mstyle",atname:"scriptlevel",atval:"1", tex:null, ttype:UNARY},
{input:"searrow", tag:"mo", output:"\u2198", tex:null, ttype:CONST},
{input:"sec", tag:"mo", output:"sec", tex:null, ttype:UNARY, func:true},
{input:"setminus", tag:"mo", output:"\\", tex:null, ttype:CONST},
{input:"setminus", tag:"mo", output:"\\", tex:null, ttype:CONST},
{input:"sf", tag:"mstyle", atname:"fontfamily", atval:"sans-serif", output:"sf", tex:null, ttype:UNARY},
{input:"sharp", tag:"mo", output:"\u266F", tex:null, ttype:CONST},
{input:"sigma", tag:"mi", output:"\u03C3", tex:null, ttype:CONST},
{input:"Sigma", tag:"mo", output:"\u03A3", tex:null, ttype:CONST},
{input:"sim", tag:"mo", output:"\u223C", tex:null, ttype:CONST},
{input:"simeq", tag:"mo", output:"\u2243", tex:null, ttype:CONST},
{input:"sin", tag:"mo", output:"sin", tex:null, ttype:UNARY, func:true},
{input:"sinh", tag:"mo", output:"sinh", tex:null, ttype:UNARY, func:true},
{input:"slash", tag:"mo", output:"\u2215", tex:null, ttype:CONST},
{input:"smallint", tag:"mo", output:"\u222B", tex:null, ttype:CONST},
{input:"smallsetminus", tag:"mo", output:"\u2216", tex:null, ttype:CONST},
{input:"smile", tag:"mo", output:"\u2323", tex:null, ttype:CONST},
{input:"spadesuit", tag:"mo", output:"\u2660", tex:null, ttype:CONST},
{input:"sphericalangle", tag:"mo", output:"\u2222", tex:null, ttype:CONST},
{input:"sqcap", tag:"mo", output:"\u2293", tex:null, ttype:CONST},
{input:"sqcup", tag:"mo", output:"\u2294", tex:null, ttype:CONST},
{input:"sqrt", tag:"msqrt", output:"sqrt", tex:null, ttype:UNARY},
{input:"sqsubset", tag:"mo", output:"\u228F", tex:null, ttype:CONST},//MimeTex bug
{input:"sqsubseteq", tag:"mo", output:"\u2291", tex:null, ttype:CONST},
{input:"sqsupset", tag:"mo", output:"\u2290", tex:null, ttype:CONST},//MimeTex bug
{input:"sqsupseteq", tag:"mo", output:"\u2292", tex:null, ttype:CONST},
{input:"square", tag:"mo", output:"\u25A1", tex:null, ttype:CONST},
{input:"ss", tag:"mo", output:"\u00DF", tex:null, ttype:CONST},
{input:"stackrel", tag:"mover", output:"stackrel", tex:null, ttype:BINARY},
{input:"stackrel", tag:"mover", output:"stackrel", tex:null, ttype:BINARY},
{input:"star", tag:"mo", output:"\u22C6", tex:null, ttype:CONST},
{input:"subset", tag:"mo", output:"\u2282", tex:null, ttype:CONST},
{input:"Subset", tag:"mo", output:"\u22D0", tex:null, ttype:CONST},
{input:"subseteq", tag:"mo", output:"\u2286", tex:null, ttype:CONST},
{input:"subseteqq", tag:"mo", output:"\u2AC5", tex:null, ttype:CONST},
{input:"subsetneq", tag:"mo", output:"\u228A", tex:null, ttype:CONST},
{input:"subsetneqq", tag:"mo", output:"\u2ACB", tex:null, ttype:CONST},
{input:"succ", tag:"mo", output:"\u227B", tex:null, ttype:CONST},
{input:"succapprox", tag:"mo", output:"\u2AB8", tex:null, ttype:CONST},
{input:"succcurlyeq", tag:"mo", output:"\u227D", tex:null, ttype:CONST},
{input:"succeq", tag:"mo", output:"\u227D", tex:null, ttype:CONST},
{input:"succnapprox", tag:"mo", output:"\u2ABA", tex:null, ttype:CONST},
{input:"succneqq", tag:"mo", output:"\u2AB6", tex:null, ttype:CONST},
{input:"succnsim", tag:"mo", output:"\u22E9", tex:null, ttype:CONST},
{input:"succsim", tag:"mo", output:"\u227F", tex:null, ttype:CONST},
{input:"sum", tag:"mo", output:"\u2211", tex:null, ttype:UNDEROVER},
{input:"sup", tag:"mo", output:"sup", tex:null, ttype:UNDEROVER},
{input:"supset", tag:"mo", output:"\u2283", tex:null, ttype:CONST},
{input:"Supset", tag:"mo", output:"\u22D1", tex:null, ttype:CONST},
{input:"supseteq", tag:"mo", output:"\u2287", tex:null, ttype:CONST},
{input:"supseteqq", tag:"mo", output:"\u2AC6", tex:null, ttype:CONST},
{input:"supsetneq", tag:"mo", output:"\u228B", tex:null, ttype:CONST},
{input:"supsetneqq", tag:"mo", output:"\u2ACC", tex:null, ttype:CONST},
{input:"surd", tag:"mo", output:"sqrt", tex:null, ttype:DEFINITION},
{input:"swarrow", tag:"mo", output:"\u2199", tex:null, ttype:CONST},
{input:"tan", tag:"mo", output:"tan", tex:null, ttype:UNARY, func:true},
{input:"tanh", tag:"mo", output:"tanh", tex:null, ttype:UNARY, func:true},
{input:"tau", tag:"mi", output:"\u03C4", tex:null, ttype:CONST},
{input:"text", tag:"mtext", output:"text", tex:null, ttype:TEXT},
{input:"textasciicircum", tag:"mo", output:"\u005E", tex:null, ttype:CONST},
{input:"textasciitilde", tag:"mo", output:"\u007E", tex:null, ttype:CONST},
{input:"textbf", tag:"mstyle", atname:"mathvariant", atval:"bold", tex:null, ttype:UNARY},
{input:"textcopyright", tag:"mo", output:"\u00A9", tex:null, ttype:CONST},
{input:"textdegree", tag:"mo", output:"\u00B0", tex:null, ttype:CONST},
{input:"textdollar", tag:"mo", output:"\u0024", tex:null, ttype:CONST},
{input:"textit", tag:"mstyle", atname:"mathvariant", atval:"italic", tex:null, ttype:UNARY},
{input:"textonehalf", tag:"mo", output:"\u00BD", tex:null, ttype:CONST},
{input:"textonequarter", tag:"mo", output:"\u00BC", tex:null, ttype:CONST},
{input:"textordfeminine", tag:"mo", output:"\u00AA", tex:null, ttype:CONST},
{input:"textordmasculine", tag:"mo", output:"\u00BA", tex:null, ttype:CONST},
{input:"textregistered", tag:"mo", output:"\u00AE", tex:null, ttype:CONST},
{input:"textrm", tag:"mstyle", output:"\\mathrm", tex:null, ttype: DEFINITION},
{input:"textstyle",tag:"mstyle",atname:"displaystyle",atval:"false", tex:null, ttype:UNARY},
{input:"textthreequarters", tag:"mo", output:"\u00BE", tex:null, ttype:CONST},
{input:"texttrademark", tag:"mo", output:"\u2122", tex:null, ttype:CONST},
{input:"texttt", tag:"mstyle", atname:"mathvariant", atval:"monospace", tex:null, ttype:UNARY},
{input:"therefore", tag:"mo", output:"\u2234", tex:null, ttype:CONST},
{input:"theta", tag:"mi", output:"\u03B8", tex:null, ttype:CONST},
{input:"Theta", tag:"mo", output:"\u0398", tex:null, ttype:CONST},
{input:"thickapprox", tag:"mo", output:"\u2248", tex:null, ttype:CONST},
{input:"thicksim", tag:"mo", output:"\u223C", tex:null, ttype:CONST},
{input:"tilde", tag:"mover", output:"~", tex:null, ttype:UNARY, acc:true},
{input:"times", tag:"mo", output:"\u00D7", tex:null, ttype:CONST},
{input:"to", tag:"mo", output:"\u2192", tex:null, ttype:CONST},
{input:"top", tag:"mo", output:"\u22A4", tex:null, ttype:CONST},
{input:"triangle", tag:"mo", output:"\u25B3", tex:null, ttype:CONST},
{input:"triangledown", tag:"mo", output:"\u25BF", tex:null, ttype:CONST},
{input:"triangleleft",tag:"mo", output:"\u22B2", tex:null, ttype:CONST},
{input:"trianglelefteq", tag:"mo", output:"\u22B4", tex:null, ttype:CONST},
{input:"triangleq", tag:"mo", output:"\u225C", tex:null, ttype:CONST},
{input:"triangleright",tag:"mo",output:"\u22B3", tex:null, ttype:CONST},
{input:"trianglerighteq", tag:"mo", output:"\u22B5", tex:null, ttype:CONST},
{input:"TT", tag:"mo", output:"\u22A4", tex:"top", ttype:CONST},
{input:"tt", tag:"mstyle", atname:"fontfamily", atval:"monospace", output:"tt", tex:null, ttype:UNARY},
{input:"twoheadleftarrow", tag:"mo", output:"\u219E", tex:null, ttype:CONST},
{input:"twoheadrightarrow", tag:"mo", output:"\u21A0", tex:null, ttype:CONST},
{input:"uarr", tag:"mo", output:"\u2191", tex:"uparrow", ttype:CONST},
{input:"ul", tag:"munder", output:"\u0332", tex:"underline", ttype:UNARY, acc:true},
{input:"ulcorner", tag:"mo", output:"\u231C", tex:null, ttype:CONST},
{input:"underbrace", tag:"munder", output:"\u23B5", tex:null, ttype:UNARY, acc:true},
{input:"underleftarrow", tag:"mo", output:"\u20EE", tex:null, ttype:CONST},
{input:"underline", tag:"munder", output:"\u00AF", tex:null, ttype:UNARY, acc:true},
{input:"underrightarrow", tag:"mo", output:"\u20EF", tex:null, ttype:CONST},
{input:"unlhd", tag:"mo", output:"\u22B4", tex:null, ttype:CONST},
{input:"unrhd", tag:"mo", output:"\u22B5", tex:null, ttype:CONST},
{input:"uparrow", tag:"mo", output:"\u2191", tex:null, ttype:CONST},
{input:"Uparrow", tag:"mo", output:"\u21D1", tex:null, ttype:CONST},
{input:"updownarrow", tag:"mo", output:"\u2195", tex:null, ttype:CONST},
{input:"Updownarrow", tag:"mo", output:"\u21D5", tex:null, ttype:CONST},
{input:"upharpoonleft", tag:"mo", output:"\u21BF", tex:null, ttype:CONST},
{input:"upharpoonright", tag:"mo", output:"\u21BE", tex:null, ttype:CONST},
{input:"uplus", tag:"mo", output:"\u228E", tex:null, ttype:CONST},
{input:"upsilon", tag:"mi", output:"\u03C5", tex:null, ttype:CONST},
{input:"Upsilon", tag:"mo", output:"\u03A5", tex:null, ttype:CONST},
{input:"upuparrows", tag:"mo", output:"\u21C8", tex:null, ttype:CONST},
{input:"urcorner", tag:"mo", output:"\u231D", tex:null, ttype:CONST},
{input:"uu", tag:"mo", output:"\u222A", tex:"cup", ttype:CONST},
{input:"uuu", tag:"mo", output:"\u22C3", tex:"bigcup", ttype:UNDEROVER},
{input:"varepsilon", tag:"mi", output:"\u025B", tex:null, ttype:CONST},
{input:"varnothing", tag:"mo", output:"\u2205", tex:null, ttype:CONST},
{input:"varphi", tag:"mi", output:"\u03D5", tex:null, ttype:CONST},
{input:"varpi", tag:"mi", output:"\u03D6", tex:null, ttype:CONST},
{input:"varpropto", tag:"mo", output:"\u221D", tex:null, ttype:CONST},
{input:"varrho", tag:"mi", output:"\u03F1", tex:null, ttype:CONST},
{input:"varsigma", tag:"mi", output:"\u03C2", tex:null, ttype:CONST},
{input:"vartheta", tag:"mi", output:"\u03D1", tex:null, ttype:CONST},
{input:"vartriangle", tag:"mo", output:"\u22B5", tex:null, ttype:CONST},
{input:"vartriangleleft", tag:"mo", output:"\u22B2", tex:null, ttype:CONST},
{input:"vartriangleright", tag:"mo", output:"\u22B3", tex:null, ttype:CONST},
{input:"vdash", tag:"mo", output:"\u22A2", tex:null, ttype:CONST},
{input:"vDash", tag:"mo", output:"\u22A8", tex:null, ttype:CONST},
{input:"Vdash", tag:"mo", output:"\u22A9", tex:null, ttype:CONST},
{input:"vdots", tag:"mo", output:"\u22EE", tex:null, ttype:CONST},
{input:"vec", tag:"mover", output:"\u2192", tex:null, ttype:UNARY, acc:true},
{input:"wedge", tag:"mo", output:"\u2227", tex:null, ttype:CONST},
{input:"vee", tag:"mo", output:"\u2228", tex:null, ttype:CONST},
{input:"veebar", tag:"mo", output:"\u22BB", text:null, ttype:CONST},
{input:"vert", tag:"mo", output:"\u007C", atval:"1", tex:null, ttype:STRETCHY},
{input:"Vert", tag:"mo", output:"\u2016", atval:"1", tex:null, ttype:STRETCHY},
{input:"widehat", tag:"mover", output:"\u0302", tex:null, ttype:UNARY, acc:true},
{input:"widetilde", tag:"mover", output:"\u02DC", tex:null, ttype:UNARY, acc:true},
{input:"wp", tag:"mo", output:"\u2118", tex:null, ttype:CONST},
{input:"wr", tag:"mo", output:"\u2240", tex:null, ttype:CONST},
{input:"vv", tag:"mo", output:"\u2228", tex:"vee", ttype:CONST},
{input:"Vvdash", tag:"mo", output:"\u22AA", tex:null, ttype:CONST},
{input:"vvv", tag:"mo", output:"\u22C1", tex:"bigvee", ttype:UNDEROVER},
{input:"xi", tag:"mi", output:"\u03BE", tex:null, ttype:CONST},
{input:"Xi", tag:"mo", output:"\u039E", tex:null, ttype:CONST},
{input:"xx", tag:"mo", output:"\u00D7", tex:"times", ttype:CONST},
{input:"yen", tag:"mo", output:"\u00A5", tex:null, ttype:CONST},
{input:"zeta", tag:"mi", output:"\u03B6", tex:null, ttype:CONST},
{input:"ZZ", tag:"mo", output:"\u2124", tex:"mathbb{Z}", ttype:CONST, notexcopy:true},
AMquote
];
var ASAMsymbols = AMsymbols;
var AMnames = []; //list of input symbols
var AMnestingDepth,AMpreviousSymbol,AMcurrentSymbol;
var LMcal = AMcal;
var LMfrk = AMfrk;
var LMbbb = AMbbb;
var LMsymbols = [
{input:"\\density",tag:"mstyle",atname:"mathvariant", atval:"mathsize", ttype:BINARY},
{input:"'", tag:"mo", output:"\u02B9", ttype:CONST},
{input:"''", tag:"mo", output:"\u02BA", ttype:CONST},
{input:"'''", tag:"mo", output:"\u2034", ttype:CONST},
{input:"''''", tag:"mo", output:"\u2057", ttype:CONST},
{input:"(", tag:"mo", output:"(", atval:"1", ttype:STRETCHY},
{input:")", tag:"mo",output:")", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"/", tag:"mo", output:"/", atval:"1.01", ttype:STRETCHY},
{input:":=", tag:"mo", output:":=", ttype:CONST},
{input:"[", tag:"mo", output:"[", atval:"1", ttype:STRETCHY},
{input:"\\!", tag:"mspace", atname:"width", atval:"-0.167em", ttype:SPACE},
{input:"\\#", tag:"mo", output:"\u0023", ttype:CONST},
{input:"\\%", tag:"mo", output:"\u0025", ttype:CONST},
{input:"\\&", tag:"mo", output:"\u0026", ttype:CONST},
{input:"\\,", tag:"mspace", atname:"width", atval:"0.167em", ttype:SPACE},
{input:"\\:", tag:"mspace", atname:"width", atval:"0.222em", ttype:SPACE},
{input:"\\;", tag:"mspace", atname:"width", atval:"0.278em", ttype:SPACE},
{input:"\\\\", output:"}&{", ttype:DEFINITION},
{input:"\\{", tag:"mo", output:"{", atval:"1", ttype:STRETCHY},
{input:"\\|", tag:"mo", output:"\u2225", atval:"1", ttype:STRETCHY},
{input:"\\}", tag:"mo",output:"}", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\>", tag:"mspace", atname:"width", atval:"0.222em", ttype:SPACE},
{input:"\\AA", tag:"mo", output:"\u00C5", ttype:CONST},
{input:"\\aa", tag:"mo", output:"\u00E5", ttype:CONST},
{input:"\\acute", tag:"mover", output:"\u00B4", ttype:UNARY, acc:true},
{input:"\\AE", tag:"mo", output:"\u00C6", ttype:CONST},
{input:"\\ae", tag:"mo", output:"\u00E6", ttype:CONST},
{input:"\\aleph", tag:"mo", output:"\u2135", ttype:CONST},
{input:"\\alpha", tag:"mi", output:"\u03B1", ttype:CONST},
{input:"\\amalg", tag:"mo", output:"\u2A3F", ttype:CONST},
{input:"\\angle", tag:"mo", output:"\u2220", ttype:CONST},
{input:"\\approx", tag:"mo", output:"\u2248", ttype:CONST},
{input:"\\approxeq", tag:"mo", output:"\u224A", ttype:CONST},
{input:"\\arccos", tag:"mi", output:"arccos", ttype:UNARY, func:true},
{input:"\\arcsin", tag:"mi", output:"arcsin", ttype:UNARY, func:true},
{input:"\\arctan", tag:"mi", output:"arctan", ttype:UNARY, func:true},
{input:"\\arg", tag:"mi", output:"arg", ttype:UNARY, func:true},
{input:"\\ast", tag:"mo", output:"\u002A", ttype:CONST},
{input:"\\asymp", tag:"mo", output:"\u224D", ttype:CONST},
{input:"\\atop", tag:"mfrac", output:"", ttype:INFIX},
{input:"\\backprime", tag:"mo", output:"\u2035", ttype:CONST},
{input:"\\backsim", tag:"mo", output:"\u223D", ttype:CONST},
{input:"\\backsimeq", tag:"mo", output:"\u22CD", ttype:CONST},
{input:"\\backslash", tag:"mo", output:"\u2216", atval:"1", ttype:STRETCHY},
{input:"\\bar", tag:"mover", output:"\u203E", ttype:UNARY, acc:true},
{input:"\\barwedge", tag:"mo", output:"\u22BC", ttype:CONST},
{input:"\\Bbb{A}", tag:"mo", output:"\uD835\uDD38", ttype:CONST},
{input:"\\because", tag:"mo", output:"\u2235", ttype:CONST},
{input:"\\begin{array}", output:"X", ttype:MATRIX, invisible:true},
{input:"\\begin{eqnarray}", output:"X", ttype:MATRIX, invisible:true},
{input:"\\beta", tag:"mi", output:"\u03B2", ttype:CONST},
{input:"\\beth", tag:"mo", output:"\u2136", ttype:CONST},
{input:"\\between", tag:"mo", output:"\u226C", ttype:CONST},
{input:"\\big", tag:"mo", output:"X", atval:"1.2", ieval:"2.2", ttype:BIG},
{input:"\\Big", tag:"mo", output:"X", atval:"1.6", ieval:"2.6", ttype:BIG},
{input:"\\bigcap", tag:"mo", output:"\u22C2", ttype:UNDEROVER},
{input:"\\bigcirc", tag:"mo", output:"\u25CB", ttype:CONST},
{input:"\\bigcup", tag:"mo", output:"\u22C3", ttype:UNDEROVER},
{input:"\\bigg", tag:"mo", output:"X", atval:"2.2", ieval:"3.2", ttype:BIG},
{input:"\\Bigg", tag:"mo", output:"X", atval:"2.9", ieval:"3.9", ttype:BIG},
{input:"\\bigodot", tag:"mo", output:"\u2A00", ttype:UNDEROVER},
{input:"\\bigoplus", tag:"mo", output:"\u2A01", ttype:UNDEROVER},
{input:"\\bigotimes", tag:"mo", output:"\u2A02", ttype:UNDEROVER},
{input:"\\bigsqcap", tag:"mo", output:"\u2A05", ttype:UNDEROVER},
{input:"\\bigsqcup", tag:"mo", output:"\u2A06", ttype:UNDEROVER},
{input:"\\bigstar", tag:"mo", output:"\u2605", ttype:CONST},
{input:"\\bigtriangledown",tag:"mo",output:"\u25BD", ttype:CONST},
{input:"\\bigtriangleup",tag:"mo",output:"\u25B3", ttype:CONST},
{input:"\\biguplus", tag:"mo", output:"\u2A04", ttype:UNDEROVER},
{input:"\\bigwedge", tag:"mo", output:"\u22C0", ttype:UNDEROVER},
{input:"\\bigvee", tag:"mo", output:"\u22C1", ttype:UNDEROVER},
{input:"\\blacktriangle", tag:"mo", output:"\u25B4", ttype:CONST},
{input:"\\blacktriangledown", tag:"mo", output:"\u25BE", ttype:CONST},
{input:"\\blacktriangleleft", tag:"mo", output:"\u25C0", ttype:CONST},
{input:"\\blacktriangleright", tag:"mo", output:"\u25B6", ttype:CONST},
{input:"\\bot", tag:"mo", output:"\u22A5", ttype:CONST},
{input:"\\bowtie", tag:"mo", output:"\u22C8", ttype:CONST},
{input:"\\Box", tag:"mo", output:"\u25A1", ttype:CONST},
{input:"\\boxdot", tag:"mo", output:"\u22A1", ttype:CONST},
{input:"\\boxminus", tag:"mo", output:"\u229F", ttype:CONST},
{input:"\\boxplus", tag:"mo", output:"\u229E", ttype:CONST},
{input:"\\boxtimes", tag:"mo", output:"\u22A0", ttype:CONST},
{input:"\\breve", tag:"mover", output:"\u02D8", ttype:UNARY, acc:true},
{input:"\\bullet", tag:"mo", output:"\u2022", ttype:CONST},
{input:"\\Bumpeq", tag:"mo", output:"\u224E", ttype:CONST},
{input:"\\bumpeq", tag:"mo", output:"\u224F", ttype:CONST},
{input:"\\cap", tag:"mo", output:"\u2229", ttype:CONST},
{input:"\\Cap", tag:"mo", output:"\u22D2", ttype:CONST},
{input:"\\cdot", tag:"mo", output:"\u22C5", ttype:CONST},
{input:"\\cdotp", tag:"mo", output:"\u00B7", ttype:CONST},
{input:"\\cdots", tag:"mo", output:"\u22EF", ttype:CONST},
{input:"\\check", tag:"mover", output:"\u02C7", ttype:UNARY, acc:true},
{input:"\\checkmark", tag:"mo", output:"\u2713", ttype:CONST},
{input:"\\chi", tag:"mi", output:"\u03C7", ttype:CONST},
{input:"\\choose", tag:"mfrac", output:"", ttype:INFIX},
{input:"\\circ", tag:"mo", output:"\u2218", ttype:CONST},
{input:"\\circeq", tag:"mo", output:"\u2257", ttype:CONST},
{input:"\\circledast", tag:"mo", output:"\u229B", ttype:CONST},
{input:"\\circledcirc", tag:"mo", output:"\u229A", ttype:CONST},
{input:"\\circleddash", tag:"mo", output:"\u229D", ttype:CONST},
{input:"\\circledR", tag:"mo", output:"\u24C7", ttype:CONST},
{input:"\\circledS", tag:"mo", output:"\u24C8", ttype:CONST},
{input:"\\clubsuit", tag:"mo", output:"\u2663", ttype:CONST},
{input:"\\colon", tag:"mo", output:"\u003A", ttype:CONST},
{input:"\\complement", tag:"mo", output:"\u2201", ttype:CONST},
{input:"\\cong", tag:"mo", output:"\u2245", ttype:CONST},
{input:"\\coprod", tag:"mo", output:"\u2210", ttype:UNDEROVER},
{input:"\\cos", tag:"mi", output:"cos", ttype:UNARY, func:true},
{input:"\\cosh", tag:"mi", output:"cosh", ttype:UNARY, func:true},
{input:"\\cot", tag:"mi", output:"cot", ttype:UNARY, func:true},
{input:"\\coth", tag:"mi", output:"coth", ttype:UNARY, func:true},
{input:"\\csc", tag:"mi", output:"csc", ttype:UNARY, func:true},
{input:"\\cup", tag:"mo", output:"\u222A", ttype:CONST},
{input:"\\Cup", tag:"mo", output:"\u22D3", ttype:CONST},
{input:"\\curlyeqprec", tag:"mo", output:"\u22DE", ttype:CONST},
{input:"\\curlyeqsucc", tag:"mo", output:"\u22DF", ttype:CONST},
{input:"\\curlywedge", tag:"mo", output:"\u22CF", ttype:CONST},
{input:"\\curlyvee", tag:"mo", output:"\u22CE", ttype:CONST},
{input:"\\curvearrowleft", tag:"mo", output:"\u21B6", ttype:CONST},
{input:"\\curvearrowright", tag:"mo", output:"\u21B7", ttype:CONST},
{input:"\\dag", tag:"mo", output:"\u2020", ttype:CONST},
{input:"\\dagger", tag:"mo", output:"\u2020", ttype:CONST},
{input:"\\daleth", tag:"mo", output:"\u2138", ttype:CONST},
{input:"\\dashv", tag:"mo", output:"\u22A3", ttype:CONST},
{input:"\\ddag", tag:"mo", output:"\u2021", ttype:CONST},
{input:"\\ddagger", tag:"mo", output:"\u2021", ttype:CONST},
{input:"\\ddot", tag:"mover", output:"..", ttype:UNARY, acc:true},
{input:"\\ddots", tag:"mo", output:"\u22F1", ttype:CONST},
{input:"\\deg", tag:"mi", output:"deg", ttype:UNARY, func:true},
{input:"\\delta", tag:"mi", output:"\u03B4", ttype:CONST},
{input:"\\Delta", tag:"mo", output:"\u0394", ttype:CONST},
{input:"\\det", tag:"mi", output:"det", ttype:UNARY, func:true},
{input:"\\diamond", tag:"mo", output:"\u22C4", ttype:CONST},
{input:"\\Diamond", tag:"mo", output:"\u25C7", ttype:CONST},
{input:"\\diamondsuit", tag:"mo", output:"\u2662", ttype:CONST},
{input:"\\dim", tag:"mi", output:"dim", ttype:UNARY, func:true}, //CONST?
{input:"\\displaystyle",tag:"mstyle",atname:"displaystyle",atval:"true", ttype:UNARY},
{input:"\\div", tag:"mo", output:"\u00F7", ttype:CONST},
{input:"\\divideontimes", tag:"mo", output:"\u22C7", ttype:CONST},
{input:"\\dot", tag:"mover", output:".", ttype:UNARY, acc:true},
{input:"\\doteq", tag:"mo", output:"\u2250", ttype:CONST},
{input:"\\Doteq", tag:"mo", output:"\u2251", ttype:CONST},
{input:"\\dotplus", tag:"mo", output:"\u2214", ttype:CONST},
{input:"\\dots", tag:"mo", output:"\u2026", ttype:CONST},
{input:"\\doublebarwedge", tag:"mo", output:"\u2A5E", ttype:CONST},
{input:"\\downarrow", tag:"mo", output:"\u2193", ttype:CONST},
{input:"\\Downarrow", tag:"mo", output:"\u21D3", ttype:CONST},
{input:"\\downdownarrows", tag:"mo", output:"\u21CA", ttype:CONST},
{input:"\\downharpoonleft", tag:"mo", output:"\u21C3", ttype:CONST},
{input:"\\downharpoonright", tag:"mo", output:"\u21C2", ttype:CONST},
{input:"\\ell", tag:"mo", output:"\u2113", ttype:CONST},
{input:"\\emptyset", tag:"mo", output:"\u2205", ttype:CONST},
{input:"\\end{array}", output:"}}", ttype:DEFINITION},
{input:"\\end{eqnarray}", output:"}}", ttype:DEFINITION},
{input:"\\epsilon", tag:"mi", output:"\u03B5", ttype:CONST},
{input:"\\eqcirc", tag:"mo", output:"\u2256", ttype:CONST},
{input:"\\eqsim", tag:"mo", output:"\u2242", ttype:CONST},
{input:"\\eqslantgtr", tag:"mo", output:"\u2A96", ttype:CONST},
{input:"\\eqslantless", tag:"mo", output:"\u2A95", ttype:CONST},
{input:"\\equiv", tag:"mo", output:"\u2261", ttype:CONST},
{input:"\\eta", tag:"mi", output:"\u03B7", ttype:CONST},
{input:"\\exists", tag:"mo", output:"\u2203", ttype:CONST},
{input:"\\exp", tag:"mi", output:"exp", ttype:UNARY, func:true},
{input:"\\fallingdotseq", tag:"mo", output:"\u2252", ttype:CONST},
{input:"\\Finv", tag:"mo", output:"\u2132", ttype:CONST},
{input:"\\flat", tag:"mo", output:"\u266D", ttype:CONST},
{input:"\\forall", tag:"mo", output:"\u2200", ttype:CONST},
{input:"\\frac", tag:"mfrac", output:"/", ttype:BINARY},
{input:"\\frac12", tag:"mo", output:"\u00BD", ttype:CONST},
{input:"\\frac13", tag:"mo", output:"\u2153", ttype:CONST},
{input:"\\frac14", tag:"mo", output:"\u00BC", ttype:CONST},
{input:"\\frac15", tag:"mo", output:"\u2155", ttype:CONST},
{input:"\\frac16", tag:"mo", output:"\u2159", ttype:CONST},
{input:"\\frac18", tag:"mo", output:"\u215B", ttype:CONST},
{input:"\\frac23", tag:"mo", output:"\u2154", ttype:CONST},
{input:"\\frac25", tag:"mo", output:"\u2156", ttype:CONST},
{input:"\\frac34", tag:"mo", output:"\u00BE", ttype:CONST},
{input:"\\frac35", tag:"mo", output:"\u2157", ttype:CONST},
{input:"\\frac38", tag:"mo", output:"\u215C", ttype:CONST},
{input:"\\frac45", tag:"mo", output:"\u2158", ttype:CONST},
{input:"\\frac56", tag:"mo", output:"\u215A", ttype:CONST},
{input:"\\frac58", tag:"mo", output:"\u215D", ttype:CONST},
{input:"\\frac78", tag:"mo", output:"\u215E", ttype:CONST},
{input:"\\frown", tag:"mo", output:"\u2322", ttype:CONST},
{input:"\\Game", tag:"mo", output:"\u2141", ttype:CONST},
{input:"\\gamma", tag:"mi", output:"\u03B3", ttype:CONST},
{input:"\\Gamma", tag:"mo", output:"\u0393", ttype:CONST},
{input:"\\gcd", tag:"mi", output:"gcd", ttype:UNARY, func:true}, //CONST?
{input:"\\ge", tag:"mo", output:"\u2265", ttype:CONST},
{input:"\\geq", tag:"mo", output:"\u2265", ttype:CONST},
{input:"\\geqq", tag:"mo", output:"\u2267", ttype:CONST},
{input:"\\geqslant", tag:"mo", output:"\u2265", ttype:CONST},
{input:"\\gets", tag:"mo", output:"\u2190", ttype:CONST},
{input:"\\gg", tag:"mo", output:"\u226B", ttype:CONST},
{input:"\\ggg", tag:"mo", output:"\u22D9", ttype:CONST},
{input:"\\gimel", tag:"mo", output:"\u2137", ttype:CONST},
{input:"\\gnapprox", tag:"mo", output:"\u2A8A", ttype:CONST},
{input:"\\gneq", tag:"mo", output:"\u2A88", ttype:CONST},
{input:"\\gneqq", tag:"mo", output:"\u2269", ttype:CONST},
{input:"\\gnsim", tag:"mo", output:"\u22E7", ttype:CONST},
{input:"\\grave", tag:"mover", output:"\u0060", ttype:UNARY, acc:true},
{input:"\\gt", tag:"mo", output:"\u003E", ttype:CONST},
{input:"\\gtrapprox", tag:"mo", output:"\u2A86", ttype:CONST},
{input:"\\gtrdot", tag:"mo", output:"\u22D7", ttype:CONST},
{input:"\\gtreqless", tag:"mo", output:"\u22DB", ttype:CONST},
{input:"\\gtreqqless", tag:"mo", output:"\u2A8C", ttype:CONST},
{input:"\\gtrless", tag:"mo", output:"\u2277", ttype:CONST},
{input:"\\gtrsim", tag:"mo", output:"\u2273", ttype:CONST},
{input:"\\hat", tag:"mover", output:"\u005E", ttype:UNARY, acc:true},
{input:"\\hbar", tag:"mo", output:"\u210F", ttype:CONST},
{input:"\\heartsuit", tag:"mo", output:"\u2661", ttype:CONST},
{input:"\\hom", tag:"mi", output:"hom", ttype:UNARY, func:true},
{input:"\\hookleftarrow", tag:"mo", output:"\u21A9", ttype:CONST},
{input:"\\hookrightarrow", tag:"mo", output:"\u21AA", ttype:CONST},
{input:"\\hslash", tag:"mo", output:"\u210F", ttype:CONST},
//{input:"\\i", tag:"mo", output:"\u0131", ttype:CONST},
{input:"\\iff", tag:"mo", output:"~\\Longleftrightarrow~", ttype:DEFINITION},
{input:"\\iiiint", tag:"mo", output:"\u2A0C", ttype:CONST},
{input:"\\iiint", tag:"mo", output:"\u222D", ttype:CONST},
{input:"\\iint", tag:"mo", output:"\u222C", ttype:CONST},
{input:"\\Im", tag:"mo", output:"\u2111", ttype:CONST},
{input:"\\implies", tag:"mo", output:"\u21D2", ttype:LONG},
{input:"\\in", tag:"mo", output:"\u2208", ttype:CONST},
{input:"\\inf", tag:"mo", output:"inf", ttype:UNDEROVER},
{input:"\\infty", tag:"mo", output:"\u221E", ttype:CONST},
{input:"\\int", tag:"mo", output:"\u222B", ttype:CONST},
{input:"\\intercal", tag:"mo", output:"\u22BA", ttype:CONST},
{input:"\\iota", tag:"mi", output:"\u03B9", ttype:CONST},
{input:"\\itx", tag:"mo", output:"\uD835\uDC65", ttype:CONST},
{input:"\\Join", tag:"mo", output:"\u22C8", ttype:CONST},
{input:"\\kappa", tag:"mi", output:"\u03BA", ttype:CONST},
{input:"\\varkappa", tag:"mi", output:"\u03F0", ttype:CONST},
{input:"\\digamma", tag:"mi", output:"\u03DC", ttype:CONST},
{input:"\\ker", tag:"mi", output:"ker", ttype:UNARY, func:true},
//{input:"\\L", tag:"mo", output:"\u0141", ttype:CONST},
//{input:"\\l", tag:"mo", output:"\u0142", ttype:CONST},
{input:"\\lambda", tag:"mi", output:"\u03BB", ttype:CONST},
{input:"\\Lambda", tag:"mo", output:"\u039B", ttype:CONST},
{input:"\\land", tag:"mo", output:"\u2227", ttype:CONST},
{input:"\\langle", tag:"mo", output:"\u2329", atval:"1", ttype:STRETCHY},
{input:"\\lbrace", tag:"mo", output:"{", atval:"1", ttype:STRETCHY},
{input:"\\lbrack", tag:"mo", output:"[", atval:"1", ttype:STRETCHY},
{input:"\\lceil", tag:"mo", output:"\u2308", atval:"1", ttype:STRETCHY},
{input:"\\ldots", tag:"mo", output:"\u2026", ttype:CONST},
{input:"\\le", tag:"mo", output:"\u2264", ttype:CONST},
{input:"\\left", tag:"mo", output:"X", ttype:LEFTBRACKET},
{input:"\\leftarrow", tag:"mo", output:"\u2190", ttype:CONST},
{input:"\\Leftarrow", tag:"mo", output:"\u21D0", ttype:CONST},
{input:"\\leftarrowtail", tag:"mo", output:"\u21A2", ttype:CONST},
{input:"\\leftharpoondown", tag:"mo", output:"\u21BD", ttype:CONST},
{input:"\\leftharpoonup", tag:"mo", output:"\u21BC", ttype:CONST},
{input:"\\leftleftarrows", tag:"mo", output:"\u21C7", ttype:CONST},
{input:"\\leftrightarrow", tag:"mo", output:"\u2194", ttype:CONST},
{input:"\\Leftrightarrow", tag:"mo", output:"\u21D4", ttype:CONST},
{input:"\\leftrightarrows", tag:"mo", output:"\u21C6", ttype:CONST},
{input:"\\leftrightharpoons", tag:"mo", output:"\u21CB", ttype:CONST},
{input:"\\leftrightsquigarrow", tag:"mo", output:"\u21AD", ttype:CONST},
{input:"\\leftthreetimes", tag:"mo", output:"\u22CB", ttype:CONST},
{input:"\\leq", tag:"mo", output:"\u2264", ttype:CONST},
{input:"\\leqq", tag:"mo", output:"\u2266", ttype:CONST},
{input:"\\leqslant", tag:"mo", output:"\u2264", ttype:CONST},
{input:"\\lessapprox", tag:"mo", output:"\u2A85", ttype:CONST},
{input:"\\lessdot", tag:"mo", output:"\u22D6", ttype:CONST},
{input:"\\lesseqgtr", tag:"mo", output:"\u22DA", ttype:CONST},
{input:"\\lesseqqgtr", tag:"mo", output:"\u2A8B", ttype:CONST},
{input:"\\lessgtr", tag:"mo", output:"\u2276", ttype:CONST},
{input:"\\lesssim", tag:"mo", output:"\u2272", ttype:CONST},
{input:"\\lfloor", tag:"mo", output:"\u230A", atval:"1", ttype:STRETCHY},
{input:"\\lg", tag:"mi", output:"lg", ttype:UNARY, func:true},
{input:"\\lhd", tag:"mo", output:"\u22B2", ttype:CONST},
{input:"\\lim", tag:"mo", output:"lim", ttype:UNDEROVER},
{input:"\\liminf", tag:"mo", output:"liminf", ttype:UNDEROVER},
{input:"\\limsup", tag:"mo", output:"limsup", ttype:UNDEROVER},
{input:"\\ll", tag:"mo", output:"\u226A", ttype:CONST},
{input:"\\llcorner", tag:"mo", output:"\u231E", ttype:CONST},
{input:"\\Lleftarrow", tag:"mo", output:"\u21DA", ttype:CONST},
{input:"\\lll", tag:"mo", output:"\u22D8", ttype:CONST},
{input:"\\lmoustache", tag:"mo", output:"\u23B0", ttype:CONST},
{input:"\\ln", tag:"mi", output:"ln", ttype:UNARY, func:true},
{input:"\\lnapprox", tag:"mo", output:"\u2A89", ttype:CONST},
{input:"\\lneq", tag:"mo", output:"\u2A87", ttype:CONST},
{input:"\\lneqq", tag:"mo", output:"\u2268", ttype:CONST},
{input:"\\lnot", tag:"mo", output:"\u00AC", ttype:CONST},
{input:"\\lnsim", tag:"mo", output:"\u22E6", ttype:CONST},
{input:"\\log", tag:"mi", output:"log", ttype:UNARY, func:true},
{input:"\\longleftarrow", tag:"mo", output:"\u2190", ttype:LONG},
{input:"\\Longleftarrow", tag:"mo", output:"\u21D0", ttype:LONG},
{input:"\\longleftrightarrow", tag:"mo", output:"\u2194", ttype:LONG},
{input:"\\Longleftrightarrow", tag:"mo", output:"\u21D4", ttype:LONG},
{input:"\\longmapsto", tag:"mo", output:"\u21A6", ttype:CONST},
{input:"\\longrightarrow", tag:"mo", output:"\u2192", ttype:LONG},
{input:"\\Longrightarrow", tag:"mo", output:"\u21D2", ttype:LONG},
{input:"\\looparrowleft", tag:"mo", output:"\u21AB", ttype:CONST},
{input:"\\looparrowright", tag:"mo", output:"\u21AC", ttype:CONST},
{input:"\\lor", tag:"mo", output:"\u2228", ttype:CONST},
{input:"\\lozenge", tag:"mo", output:"\u25CA", ttype:CONST},
{input:"\\lrcorner", tag:"mo", output:"\u231F", ttype:CONST},
{input:"\\Lsh", tag:"mo", output:"\u21B0", ttype:CONST},
{input:"\\lt", tag:"mo", output:"\u003C", ttype:CONST},
{input:"\\ltimes", tag:"mo", output:"\u22C9", ttype:CONST},
{input:"\\maltese", tag:"mo", output:"\u2720", ttype:CONST},
{input:"\\mapsto", tag:"mo", output:"\u21A6", ttype:CONST},
{input:"\\mathbb", tag:"mstyle", atname:"mathvariant", atval:"double-struck", ttype:UNARY, codes:LMbbb},
{input:"\\mathbf", tag:"mstyle", atname:"mathvariant", atval:"bold", ttype:UNARY},
{input:"\\mathcal",tag:"mstyle", atname:"mathvariant", atval:"script", ttype:UNARY, codes:LMcal},
{input:"\\mathfrak",tag:"mstyle",atname:"mathvariant", atval:"fraktur",ttype:UNARY, codes:LMfrk},
{input:"\\mathit", tag:"mstyle", atname:"mathvariant", atval:"italic", ttype:UNARY},
{input:"\\mathring", tag:"mover", output:"\u00B0", ttype:UNARY, acc:true},
{input:"\\mathrm", tag:"mtext", output:"text", ttype:TEXT},
{input:"\\mathsf", tag:"mstyle", atname:"mathvariant", atval:"sans-serif", ttype:UNARY},
{input:"\\mathtt", tag:"mstyle", atname:"mathvariant", atval:"monospace", ttype:UNARY},
{input:"\\max", tag:"mo", output:"max", ttype:UNDEROVER},
{input:"\\mbox", tag:"mtext", output:"mbox", ttype:TEXT},
{input:"\\measuredangle", tag:"mo", output:"\u2221", ttype:CONST},
{input:"\\mho", tag:"mo", output:"\u2127", ttype:CONST},
{input:"\\mid", tag:"mo", output:"\u2223", atval:"1", ttype:STRETCHY},
{input:"\\min", tag:"mo", output:"min", ttype:UNDEROVER},
{input:"\\models", tag:"mo", output:"\u22A8", ttype:CONST},
{input:"\\mp", tag:"mo", output:"\u2213", ttype:CONST},
{input:"\\mu", tag:"mi", output:"\u03BC", ttype:CONST},
{input:"\\multimap", tag:"mo", output:"\u22B8", ttype:CONST},
{input:"\\nabla", tag:"mo", output:"\u2207", ttype:CONST},
{input:"\\natural", tag:"mo", output:"\u266E", ttype:CONST},
{input:"\\ncong", tag:"mo", output:"\u2247", ttype:CONST},
{input:"\\ne", tag:"mo", output:"\u2260", ttype:CONST},
{input:"\\nearrow", tag:"mo", output:"\u2197", ttype:CONST},
{input:"\\neg", tag:"mo", output:"\u00AC", ttype:CONST},
{input:"\\neq", tag:"mo", output:"\u2260", ttype:CONST},
{input:"\\nexists", tag:"mo", output:"\u2204", ttype:CONST},
{input:"\\ngeq", tag:"mo", output:"\u2271", ttype:CONST},
{input:"\\ngtr", tag:"mo", output:"\u226F", ttype:CONST},
{input:"\\ni", tag:"mo", output:"\u220B", ttype:CONST},
{input:"\\nleftarrow", tag:"mo", output:"\u219A", ttype:CONST},
{input:"\\nLeftarrow", tag:"mo", output:"\u21CD", ttype:CONST},
{input:"\\nleftrightarrow", tag:"mo", output:"\u21AE", ttype:CONST},
{input:"\\nLeftrightarrow", tag:"mo", output:"\u21CE", ttype:CONST},
{input:"\\nleq", tag:"mo", output:"\u2270", ttype:CONST},
{input:"\\nless", tag:"mo", output:"\u226E", ttype:CONST},
{input:"\\nmid", tag:"mo", output:"\u2224", ttype:CONST},
{input:"\\not\\leq", tag:"mo", output:"\u2270", ttype:CONST},
{input:"\\notin", tag:"mo", output:"\u2209", ttype:CONST},
{input:"\\nparallel", tag:"mo", output:"\u2226", ttype:CONST},
{input:"\\nprec", tag:"mo", output:"\u2280", ttype:CONST},
{input:"\\nrightarrow", tag:"mo", output:"\u219B", ttype:CONST},
{input:"\\nRightarrow", tag:"mo", output:"\u21CF", ttype:CONST},
{input:"\\nsim", tag:"mo", output:"\u2241", ttype:CONST},
{input:"\\nsubseteq", tag:"mo", output:"\u2288", ttype:CONST},
{input:"\\nsucc", tag:"mo", output:"\u2281", ttype:CONST},
{input:"\\nsupseteq", tag:"mo", output:"\u2289", ttype:CONST},
{input:"\\ntriangleleft", tag:"mo", output:"\u22EA", ttype:CONST},
{input:"\\ntrianglelefteq", tag:"mo", output:"\u22EC", ttype:CONST},
{input:"\\ntriangleright", tag:"mo", output:"\u22EB", ttype:CONST},
{input:"\\ntrianglerighteq", tag:"mo", output:"\u22ED", ttype:CONST},
{input:"\\nu", tag:"mi", output:"\u03BD", ttype:CONST},
{input:"\\nwarrow", tag:"mo", output:"\u2196", ttype:CONST},
{input:"\\nvdash", tag:"mo", output:"\u22AC", ttype:CONST},
{input:"\\nvDash", tag:"mo", output:"\u22AD", ttype:CONST},
{input:"\\nVdash", tag:"mo", output:"\u22AE", ttype:CONST},
{input:"\\nVDash", tag:"mo", output:"\u22AF", ttype:CONST},
//{input:"\\O", tag:"mo", output:"\u00D8", ttype:CONST},
//{input:"\\o", tag:"mo", output:"\u00F8", ttype:CONST},
{input:"\\odot", tag:"mo", output:"\u2299", ttype:CONST},
{input:"\\OE", tag:"mo", output:"\u0152", ttype:CONST},
{input:"\\oe", tag:"mo", output:"\u0153", ttype:CONST},
{input:"\\oint", tag:"mo", output:"\u222E", ttype:CONST},
{input:"\\omega", tag:"mi", output:"\u03C9", ttype:CONST},
{input:"\\Omega", tag:"mo", output:"\u03A9", ttype:CONST},
{input:"\\ominus", tag:"mo", output:"\u2296", ttype:CONST},
{input:"\\oplus", tag:"mo", output:"\u2295", ttype:CONST},
{input:"\\oslash", tag:"mo", output:"\u2298", ttype:CONST},
{input:"\\otimes", tag:"mo", output:"\u2297", ttype:CONST},
{input:"\\overbrace", tag:"mover", output:"\uFE37", ttype:UNARY, acc:true}, //Changed unicode overbrace
{input:"\\overbracket", tag:"mover", output:"\u23B4", ttype:UNARY, acc:true}, //old overbrace = overbracket
{input:"\\overleftarrow",tag:"mover", output:"\u20D6", ttype:UNARY, acc:true},
{input:"\\overleftrightarrow", tag:"mo", output:"\u20E1", ttype:CONST},
{input:"\\overline", tag:"mover", output:"\u00AF", ttype:UNARY, acc:true},
{input:"\\overrightarrow",tag:"mover",output:"\u20D7", ttype:UNARY, acc:true},
{input:"\\owns", tag:"mo", output:"\u220B", ttype:CONST},
{input:"\\parallel", tag:"mo", output:"\u2225", atval:"1", ttype:STRETCHY},
{input:"\\partial", tag:"mo", output:"\u2202", ttype:CONST},
{input:"\\perp", tag:"mo", output:"\u22A5", ttype:CONST},
{input:"\\phi", tag:"mi", output:"\u03C6", ttype:CONST},
{input:"\\Phi", tag:"mo", output:"\u03A6", ttype:CONST},
{input:"\\pi", tag:"mi", output:"\u03C0", ttype:CONST},
{input:"\\Pi", tag:"mo", output:"\u03A0", ttype:CONST},
{input:"\\pitchfork", tag:"mo", output:"\u22D4", ttype:CONST},
{input:"\\pm", tag:"mo", output:"\u00B1", ttype:CONST},
{input:"\\Pr", tag:"mi", output:"Pr", ttype:UNARY, func:true},
{input:"\\prec", tag:"mo", output:"\u227A", ttype:CONST},
{input:"\\precapprox", tag:"mo", output:"\u2AB7", ttype:CONST},
{input:"\\preccurlyeq", tag:"mo", output:"\u227C", ttype:CONST},
{input:"\\preceq", tag:"mo", output:"\u227C", ttype:CONST},
{input:"\\precnapprox", tag:"mo", output:"\u2AB9", ttype:CONST},
{input:"\\precneqq", tag:"mo", output:"\u2AB5", ttype:CONST},
{input:"\\precnsim", tag:"mo", output:"\u22E8", ttype:CONST},
{input:"\\precsim", tag:"mo", output:"\u227E", ttype:CONST},
{input:"\\prime", tag:"mo", output:"\u2032", ttype:CONST},
{input:"\\prod", tag:"mo", output:"\u220F", ttype:UNDEROVER},
{input:"\\propto", tag:"mo", output:"\u221D", ttype:CONST},
{input:"\\psi", tag:"mi", output:"\u03C8", ttype:CONST},
{input:"\\Psi", tag:"mo", output:"\u03A8", ttype:CONST},
{input:"\\qquad", tag:"mspace", atname:"width", atval:"2em", ttype:SPACE},
{input:"\\quad", tag:"mspace", atname:"width", atval:"1em", ttype:SPACE},
{input:"\\rangle",tag:"mo",output:"\u232A", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\rbrace",tag:"mo",output:"}", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\rbrack",tag:"mo",output:"]", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\rceil", tag:"mo",output:"\u2309", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\Re", tag:"mo", output:"\u211C", ttype:CONST},
{input:"\\rfloor",tag:"mo",output:"\u230B", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"\\rhd", tag:"mo", output:"\u22B3", ttype:CONST},
{input:"\\rho", tag:"mi", output:"\u03C1", ttype:CONST},
{input:"\\right", tag:"mo", output:"X", ttype:RIGHTBRACKET},
{input:"\\rightarrow", tag:"mo", output:"\u2192", ttype:CONST},
{input:"\\Rightarrow", tag:"mo", output:"\u21D2", ttype:CONST},
{input:"\\rightarrowtail", tag:"mo", output:"\u21A3", ttype:CONST},
{input:"\\rightharpoondown", tag:"mo", output:"\u21C1", ttype:CONST},
{input:"\\rightharpoonup", tag:"mo", output:"\u21C0", ttype:CONST},
{input:"\\rightleftarrows", tag:"mo", output:"\u21C4", ttype:CONST},
{input:"\\rightleftharpoons", tag:"mo", output:"\u21CC", ttype:CONST},
{input:"\\rightrightarrows", tag:"mo", output:"\u21C9", ttype:CONST},
{input:"\\rightsquigarrow", tag:"mo", output:"\u21DD", ttype:CONST},
{input:"\\rightthreetimes", tag:"mo", output:"\u22CC", ttype:CONST},
{input:"\\risingdotseq", tag:"mo", output:"\u2253", ttype:CONST},
{input:"\\rmoustache", tag:"mo", output:"\u23B1", ttype:CONST},
{input:"\\root", tag:"mroot", output:"root", ttype:BINARY},
{input:"\\Rrightarrow", tag:"mo", output:"\u21DB", ttype:CONST},
{input:"\\Rsh", tag:"mo", output:"\u21B1", ttype:CONST},
{input:"\\rtimes", tag:"mo", output:"\u22CA", ttype:CONST},
//{input:"\\S", tag:"mo", output:"\u00A7", ttype:CONST},
{input:"\\scriptscriptstyle",tag:"mstyle",atname:"scriptlevel",atval:"2", ttype:UNARY},
{input:"\\scriptstyle",tag:"mstyle",atname:"scriptlevel",atval:"1", ttype:UNARY},
{input:"\\searrow", tag:"mo", output:"\u2198", ttype:CONST},
{input:"\\sec", tag:"mi", output:"sec", ttype:UNARY, func:true},
{input:"\\setminus", tag:"mo", output:"\\", ttype:CONST},
{input:"\\sharp", tag:"mo", output:"\u266F", ttype:CONST},
{input:"\\sigma", tag:"mi", output:"\u03C3", ttype:CONST},
{input:"\\Sigma", tag:"mo", output:"\u03A3", ttype:CONST},
{input:"\\sim", tag:"mo", output:"\u223C", ttype:CONST},
{input:"\\simeq", tag:"mo", output:"\u2243", ttype:CONST},
{input:"\\sin", tag:"mi", output:"sin", ttype:UNARY, func:true},
{input:"\\sinh", tag:"mi", output:"sinh", ttype:UNARY, func:true},
{input:"\\slash", tag:"mo", output:"\u2215", ttype:CONST},
{input:"\\smallint", tag:"mo", output:"\u222B", ttype:CONST},
{input:"\\smallsetminus", tag:"mo", output:"\u2216", ttype:CONST},
{input:"\\smile", tag:"mo", output:"\u2323", ttype:CONST},
{input:"\\spadesuit", tag:"mo", output:"\u2660", ttype:CONST},
{input:"\\sphericalangle", tag:"mo", output:"\u2222", ttype:CONST},
{input:"\\sqcap", tag:"mo", output:"\u2293", ttype:CONST},
{input:"\\sqcup", tag:"mo", output:"\u2294", ttype:CONST},
{input:"\\sqrt", tag:"msqrt", output:"sqrt", ttype:UNARY},
{input:"\\sqsubset", tag:"mo", output:"\u228F", ttype:CONST},
{input:"\\sqsubseteq", tag:"mo", output:"\u2291", ttype:CONST},
{input:"\\sqsupset", tag:"mo", output:"\u2290", ttype:CONST},
{input:"\\sqsupseteq", tag:"mo", output:"\u2292", ttype:CONST},
{input:"\\square", tag:"mo", output:"\u25AB", ttype:CONST},
{input:"\\ss", tag:"mo", output:"\u00DF", ttype:CONST},
{input:"\\stackrel", tag:"mover", output:"stackrel", ttype:BINARY},
{input:"\\star", tag:"mo", output:"\u22C6", ttype:CONST},
{input:"\\subset", tag:"mo", output:"\u2282", ttype:CONST},
{input:"\\Subset", tag:"mo", output:"\u22D0", ttype:CONST},
{input:"\\subseteq", tag:"mo", output:"\u2286", ttype:CONST},
{input:"\\subseteqq", tag:"mo", output:"\u2AC5", ttype:CONST},
{input:"\\subsetneq", tag:"mo", output:"\u228A", ttype:CONST},
{input:"\\subsetneqq", tag:"mo", output:"\u2ACB", ttype:CONST},
{input:"\\succ", tag:"mo", output:"\u227B", ttype:CONST},
{input:"\\succapprox", tag:"mo", output:"\u2AB8", ttype:CONST},
{input:"\\succcurlyeq", tag:"mo", output:"\u227D", ttype:CONST},
{input:"\\succeq", tag:"mo", output:"\u227D", ttype:CONST},
{input:"\\succnapprox", tag:"mo", output:"\u2ABA", ttype:CONST},
{input:"\\succneqq", tag:"mo", output:"\u2AB6", ttype:CONST},
{input:"\\succnsim", tag:"mo", output:"\u22E9", ttype:CONST},
{input:"\\succsim", tag:"mo", output:"\u227F", ttype:CONST},
{input:"\\sum", tag:"mo", output:"\u2211", ttype:UNDEROVER},
{input:"\\sup", tag:"mo", output:"sup", ttype:UNDEROVER},
{input:"\\supset", tag:"mo", output:"\u2283", ttype:CONST},
{input:"\\Supset", tag:"mo", output:"\u22D1", ttype:CONST},
{input:"\\supseteq", tag:"mo", output:"\u2287", ttype:CONST},
{input:"\\supseteqq", tag:"mo", output:"\u2AC6", ttype:CONST},
{input:"\\supsetneq", tag:"mo", output:"\u228B", ttype:CONST},
{input:"\\supsetneqq", tag:"mo", output:"\u2ACC", ttype:CONST},
{input:"\\surd", tag:"mo", output:"\\sqrt{}", ttype:DEFINITION},
{input:"\\swarrow", tag:"mo", output:"\u2199", ttype:CONST},
{input:"\\tan", tag:"mi", output:"tan", ttype:UNARY, func:true},
{input:"\\tanh", tag:"mi", output:"tanh", ttype:UNARY, func:true},
{input:"\\tau", tag:"mi", output:"\u03C4", ttype:CONST},
{input:"\\textasciicircum", tag:"mo", output:"\u005E", ttype:CONST},
{input:"\\textasciitilde", tag:"mo", output:"\u007E", ttype:CONST},
{input:"\\textbf", tag:"mstyle", atname:"mathvariant", atval:"bold", ttype:UNARY},
{input:"\\textcolor",tag:"mstyle",atname:"mathvariant", atval:"mathcolor", ttype:BINARY},
{input:"\\textcopyright", tag:"mo", output:"\u00A9", ttype:CONST},
{input:"\\textdegree", tag:"mo", output:"\u00B0", ttype:CONST},
{input:"\\textdollar", tag:"mo", output:"\u0024", ttype:CONST},
{input:"\\textit", tag:"mstyle", atname:"mathvariant", atval:"italic", ttype:UNARY},
{input:"\\textonehalf", tag:"mo", output:"\u00BD", ttype:CONST},
{input:"\\textonequarter", tag:"mo", output:"\u00BC", ttype:CONST},
{input:"\\textordfeminine", tag:"mo", output:"\u00AA", ttype:CONST},
{input:"\\textordmasculine", tag:"mo", output:"\u00BA", ttype:CONST},
{input:"\\textregistered", tag:"mo", output:"\u00AE", ttype:CONST},
{input:"\\textrm", tag:"mstyle", output:"\\mathrm", ttype: DEFINITION},
{input:"\\textstyle",tag:"mstyle",atname:"displaystyle",atval:"false", ttype:UNARY},
{input:"\\textthreequarters", tag:"mo", output:"\u00BE", ttype:CONST},
{input:"\\texttrademark", tag:"mo", output:"\u2122", ttype:CONST},
{input:"\\texttt", tag:"mstyle", atname:"mathvariant", atval:"monospace", ttype:UNARY},
{input:"\\therefore", tag:"mo", output:"\u2234", ttype:CONST},
{input:"\\theta", tag:"mi", output:"\u03B8", ttype:CONST},
{input:"\\Theta", tag:"mo", output:"\u0398", ttype:CONST},
{input:"\\thickapprox", tag:"mo", output:"\u2248", ttype:CONST},
{input:"\\thicksim", tag:"mo", output:"\u223C", ttype:CONST},
{input:"\\tilde", tag:"mover", output:"~", ttype:UNARY, acc:true},
{input:"\\times", tag:"mo", output:"\u00D7", ttype:CONST},
{input:"\\to", tag:"mo", output:"\u2192", ttype:CONST},
{input:"\\top", tag:"mo", output:"\u22A4", ttype:CONST},
{input:"\\triangle", tag:"mo", output:"\u25B3", ttype:CONST},
{input:"\\triangledown", tag:"mo", output:"\u25BF", ttype:CONST},
{input:"\\triangleleft",tag:"mo", output:"\u22B2", ttype:CONST},
{input:"\\trianglelefteq", tag:"mo", output:"\u22B4", ttype:CONST},
{input:"\\triangleq", tag:"mo", output:"\u225C", ttype:CONST},
{input:"\\triangleright",tag:"mo",output:"\u22B3", ttype:CONST},
{input:"\\trianglerighteq", tag:"mo", output:"\u22B5", ttype:CONST},
{input:"\\twoheadleftarrow", tag:"mo", output:"\u219E", ttype:CONST},
{input:"\\twoheadrightarrow", tag:"mo", output:"\u21A0", ttype:CONST},
{input:"\\ulcorner", tag:"mo", output:"\u231C", ttype:CONST},
{input:"\\underbrace", tag:"munder", output:"\uFE38", ttype:UNARY, acc:true},
{input:"\\underbracket",tag:"munder", output:"\u23B5", ttype:UNARY, acc:true}, //old underbrace = underbracket
{input:"\\underleftarrow", tag:"mo", output:"\u20EE", ttype:CONST},
{input:"\\underline", tag:"munder", output:"\u00AF", ttype:UNARY, acc:true},
{input:"\\underrightarrow", tag:"mo", output:"\u20EF", ttype:CONST},
{input:"\\unlhd", tag:"mo", output:"\u22B4", ttype:CONST},
{input:"\\unrhd", tag:"mo", output:"\u22B5", ttype:CONST},
{input:"\\uparrow", tag:"mo", output:"\u2191", ttype:CONST},
{input:"\\Uparrow", tag:"mo", output:"\u21D1", ttype:CONST},
{input:"\\updownarrow", tag:"mo", output:"\u2195", ttype:CONST},
{input:"\\Updownarrow", tag:"mo", output:"\u21D5", ttype:CONST},
{input:"\\upharpoonleft", tag:"mo", output:"\u21BF", ttype:CONST},
{input:"\\upharpoonright", tag:"mo", output:"\u21BE", ttype:CONST},
{input:"\\uplus", tag:"mo", output:"\u228E", ttype:CONST},
{input:"\\upsilon", tag:"mi", output:"\u03C5", ttype:CONST},
{input:"\\Upsilon", tag:"mo", output:"\u03A5", ttype:CONST},
{input:"\\upuparrows", tag:"mo", output:"\u21C8", ttype:CONST},
{input:"\\urcorner", tag:"mo", output:"\u231D", ttype:CONST},
{input:"\\varepsilon", tag:"mi", output:"\u025B", ttype:CONST},
{input:"\\varnothing", tag:"mo", output:"\u2205", ttype:CONST},
{input:"\\varphi", tag:"mi", output:"\u03D5", ttype:CONST},
{input:"\\varpi", tag:"mi", output:"\u03D6", ttype:CONST},
{input:"\\varpropto", tag:"mo", output:"\u221D", ttype:CONST},
{input:"\\varrho", tag:"mi", output:"\u03F1", ttype:CONST},
{input:"\\varsigma", tag:"mi", output:"\u03C2", ttype:CONST},
{input:"\\vartheta", tag:"mi", output:"\u03D1", ttype:CONST},
{input:"\\vartriangle", tag:"mo", output:"\u22B5", ttype:CONST},
{input:"\\vartriangleleft", tag:"mo", output:"\u22B2", ttype:CONST},
{input:"\\vartriangleright", tag:"mo", output:"\u22B3", ttype:CONST},
{input:"\\vdash", tag:"mo", output:"\u22A2", ttype:CONST},
{input:"\\vDash", tag:"mo", output:"\u22A8", ttype:CONST},
{input:"\\Vdash", tag:"mo", output:"\u22A9", ttype:CONST},
{input:"\\vdots", tag:"mo", output:"\u22EE", ttype:CONST},
{input:"\\vec", tag:"mover", output:"\u20D7", ttype:UNARY, acc:true},
{input:"\\wedge", tag:"mo", output:"\u2227", ttype:CONST},
{input:"\\vee", tag:"mo", output:"\u2228", ttype:CONST},
{input:"\\veebar", tag:"mo", output:"\u22BB", ttype:CONST},
{input:"\\vert", tag:"mo", output:"\u007C", atval:"1", ttype:STRETCHY},
{input:"\\Vert", tag:"mo", output:"\u2016", atval:"1", ttype:STRETCHY},
{input:"\\widehat", tag:"mover", output:"\u0302", ttype:UNARY, acc:true},
{input:"\\widetilde", tag:"mover", output:"\u02DC", ttype:UNARY, acc:true},
{input:"\\wp", tag:"mo", output:"\u2118", ttype:CONST},
{input:"\\wr", tag:"mo", output:"\u2240", ttype:CONST},
{input:"\\Vvdash", tag:"mo", output:"\u22AA", ttype:CONST},
{input:"\\xi", tag:"mi", output:"\u03BE", ttype:CONST},
{input:"\\Xi", tag:"mo", output:"\u039E", ttype:CONST},
{input:"\\yen", tag:"mo", output:"\u00A5", ttype:CONST},
{input:"\\zeta", tag:"mi", output:"\u03B6", ttype:CONST},
{input:"]", tag:"mo",output:"]", rtag:"mi",atval:"1",ttype:STRETCHY},
{input:"^", tag:"msup", output:"^", ttype:INFIX},
{input:"_", tag:"msub", output:"_", ttype:INFIX},
{input:"{", output:"{", ttype:LEFTBRACKET, invisible:true},
{input:"|", tag:"mo", output:"\u2223", atval:"1", ttype:STRETCHY},
{input:"}", output:"}", ttype:RIGHTBRACKET, invisible:true},
{input:"~", tag:"mspace", atname:"width", atval:"0.333em", ttype:SPACE},
{input:"\\usepackage[usenames]{color}",tag:"mstyle",atname:"mathvariant", output:"X", atval:"false", ttype:UNARY},
{input:"\\colorbox",tag:"mstyle",atname:"mathvariant", atval:"background", ttype:BINARY}
];
var ASLMsymbols = LMsymbols;
var LMnames = []; //list of input symbols
var LMmathml = "http://www.w3.org/1998/Math/MathML";
var LMpreviousSymbol,LMcurrentSymbol;
var LaTeXColor = [];
LaTeXColor["greenyellow"] = "#D9FF4F";
LaTeXColor["yellow"] = "#FFFF00";
LaTeXColor["goldenrod"] = "#FFE529";
LaTeXColor["dandelion"] = "#FFB529";
LaTeXColor["apricot"] = "#FFAD7A";
LaTeXColor["peach"] = "#FF804D";
LaTeXColor["melon"] = "#FF8A80";
LaTeXColor["yelloworange"] = "#FF9400";
LaTeXColor["orange"] = "#FF6321";
LaTeXColor["burntorange"] = "#FF7D00";
LaTeXColor["bittersweet"] = "#C20300";
LaTeXColor["redorange"] = "#FF3B21";
LaTeXColor["mahogany"] = "#A60000";
LaTeXColor["maroon"] = "#AD0000";
LaTeXColor["brickred"] = "#B80000";
LaTeXColor["red"] = "#FF0000";
LaTeXColor["orangered"] = "#FF0080";
LaTeXColor["rubinered"] = "#FF00DE";
LaTeXColor["wildstrawberry"] = "#FF0A9C";
LaTeXColor["salmon"] = "#FF789E";
LaTeXColor["carnationpink"] = "#FF5EFF";
LaTeXColor["magenta"] = "#FF00FF";
LaTeXColor["violetred"] = "#FF30FF";
LaTeXColor["rhodamine"] = "#FF2EFF";
LaTeXColor["mulberry"] = "#A314FA";
LaTeXColor["redviolet"] = "#9600A8";
LaTeXColor["fuchsia"] = "#7303EB";
LaTeXColor["lavender"] = "#FF85FF";
LaTeXColor["thistle"] = "#E069FF";
LaTeXColor["orchid"] = "#AD5CFF";
LaTeXColor["darkorchid"] = "#9933CC";
LaTeXColor["purple"] = "#8C24FF";
LaTeXColor["plum"] = "#8000FF";
LaTeXColor["violet"] = "#361FFF";
LaTeXColor["royalpurple"] = "#401AFF";
LaTeXColor["blueviolet"] = "#1A0DF5";
LaTeXColor["periwinkle"] = "#6E73FF";
LaTeXColor["cadetblue"] = "#616EC4";
LaTeXColor["cornflowerblue"] = "#59DEFF";
LaTeXColor["midnightblue"] = "#007091";
LaTeXColor["navyblue"] = "#0F75FF";
LaTeXColor["royalblue"] = "#0080FF";
LaTeXColor["blue"] = "#0000FF";
LaTeXColor["cerulean"] = "#0FE3FF";
LaTeXColor["cyan"] = "#00FFFF";
LaTeXColor["processblue"] = "#0AFFFF";
LaTeXColor["skyblue"] = "#61FFE0";
LaTeXColor["turquoise"] = "#26FFCC";
LaTeXColor["tealblue"] = "#1FFAA3";
LaTeXColor["aquamarine"] = "#2EFFB2";
LaTeXColor["bluegreen"] = "#26FFAB";
LaTeXColor["emerald"] = "#00FF80";
LaTeXColor["junglegreen"] = "#03FF7A";
LaTeXColor["seagreen"] = "#4FFF80";
LaTeXColor["green"] = "#00FF00";
LaTeXColor["forestgreen"] = "#00E000";
LaTeXColor["pinegreen"] = "#00BF29";
LaTeXColor["limegreen"] = "#80FF00";
LaTeXColor["yellowgreen"] = "#8FFF42";
LaTeXColor["springgreen"] = "#BDFF3D";
LaTeXColor["olivegreen"] = "#009900";
LaTeXColor["rawsienna"] = "#8C0000";
LaTeXColor["sepia"] = "#4D0000";
LaTeXColor["brown"] = "#660000";
LaTeXColor["tan"] = "#DB9470";
LaTeXColor["gray"] = "#808080";
LaTeXColor["grey"] = "#808080";
LaTeXColor["black"] = "#000000";
LaTeXColor["white"] = "#FFFFFF";
var IsColorName = /^(?:greenyellow|yellow|goldenrod|dandelion|apricot|peach|melon|yelloworange|orange|burntorange|bittersweet|redorange|mahogany|maroon|brickred|red|orangered|rubinered|wildstrawberry|salmon|carnationpink|magenta|violetred|rhodamine|mulberry|redviolet|fuchsia|lavender|thistle|orchid|darkorchid|purple|plum|violet|royalpurple|blueviolet|periwinkle|cadetblue|cornflowerblue|midnightblue|navyblue|royalblue|blue|cerulean|cyan|processblue|skyblue|turquoise|tealblue|aquamarine|bluegreen|emerald|junglegreen|seagreen|green|forestgreen|pinegreen|limegreen|yellowgreen|springgreen|olivegreen|rawsienna|sepia|brown|tan|gray|grey|black|white)$/;

var LMbody;
var LMAMnoMathML = false, LMtranslated = false;
var displaystyle = true; // puts limits above and below large operators
var showasciiformulaonhover = true; // helps students learn ASCIIMath
var decimalsign = "."; // change to "," if you like, beware of `(1,2)`!


function AMinit(){
 var msg, warnings = new Array();
 if (document.getElementById==null){
 alert("This webpage requires a recent browser such as Firefox");
 return null;
 }
 initSymbols();
 var i;
 LMsymbols.sort(AMCNames);
 for (i=0; i<LMsymbols.length; i++) LMnames[i] = LMsymbols[i].input;
 return true;
}

function AMtranslate(spanclassAM) {
 if (!AMtranslated) { // run this only once
 AMtranslated = true;
 var body = document.getElementsByTagName("body")[0];
 var processN = document.getElementById(AMdocumentId);
 if (translateLaTeX) LMprocessNode((processN!=null?processN:body));
 if (translateASCIIMath) AMprocessNode((processN!=null?processN:body), false, spanclassAM);
 }
}


function initSymbols() {
 var texsymbols = [], i;
 for (i=0; i<AMsymbols.length; i++)
 if (AMsymbols[i].tex && !(typeof AMsymbols[i].notexcopy == "boolean" && AMsymbols[i].notexcopy)) 
 texsymbols[texsymbols.length] = {input:AMsymbols[i].tex, 
 tag:AMsymbols[i].tag, output:AMsymbols[i].output, ttype:AMsymbols[i].ttype};
 AMsymbols = AMsymbols.concat(texsymbols);
 refreshSymbols();
}

function refreshSymbols(){
 var i;
 AMsymbols.sort(compareNames);
 for (i=0; i<AMsymbols.length; i++) AMnames[i] = AMsymbols[i].input;
 LMsymbols.sort(compareNames);
 for (i=0; i<LMsymbols.length; i++) LMnames[i] = LMsymbols[i].input;
}

function AMremoveCharsAndBlanks(str,n) {
//remove n characters and any following blanks
 var st;
 if (str.charAt(n)=="\\" && str.charAt(n+1)!="\\" && str.charAt(n+1)!=" ") 
 st = str.slice(n+1);
 else st = str.slice(n);
 for (var i=0; i<st.length && st.charCodeAt(i)<=32; i=i+1);
 return st.slice(i);
}

function position(arr, str, n) { 
// return position >=n where str appears or would be inserted
// assumes arr is sorted
 if (n==0) {
 var h,m;
 n = -1;
 h = arr.length;
 while (n+1<h) {
 m = (n+h) >> 1;
 if (arr[m]<str) n = m; else h = m;
 }
 return h;
 } else
 for (var i=n; i<arr.length && arr[i]<str; i++);
 return i; // i=arr.length || arr[i]>=str
}

function AMgetSymbol(str) {
//return maximal initial substring of str that appears in names
//return null if there is none
 var k = 0; //new pos
 var j = 0; //old pos
 var mk; //match pos
 var st;
 var tagst;
 var match = "";
 var more = true;
 for (var i=1; i<=str.length && more; i++) {
 st = str.slice(0,i); //initial substring of length i
 j = k;
 k = position(AMnames, st, j);
 if (k<AMnames.length && str.slice(0,AMnames[k].length)==AMnames[k]){
 match = AMnames[k];
 mk = k;
 i = match.length;
 }
 more = k<AMnames.length && str.slice(0,AMnames[k].length)>=AMnames[k];
 }
 AMpreviousSymbol=AMcurrentSymbol;
 if (match!=""){
 AMcurrentSymbol=AMsymbols[mk].ttype;
 return AMsymbols[mk]; 
 }
// if str[0] is a digit or - return maxsubstring of digits.digits
 AMcurrentSymbol=CONST;
 k = 1;
 st = str.slice(0,1);
 var integ = true;
 while ("0"<=st && st<="9" && k<=str.length) {
 st = str.slice(k,k+1);
 k++;
 }
 if (st == decimalsign) {
 st = str.slice(k,k+1);
 if ("0"<=st && st<="9") {
 integ = false;
 k++;
 while ("0"<=st && st<="9" && k<=str.length) {
 st = str.slice(k,k+1);
 k++;
 }
 }
 }
 if ((integ && k>1) || k>2) {
 st = str.slice(0,k-1);
 tagst = "mn";
 } else {
 k = 2;
 st = str.slice(0,1); //take 1 character
 tagst = (("A">st || st>"Z") && ("a">st || st>"z")?"mo":"mi");
 }
 if (st=="-" && AMpreviousSymbol==INFIX) {
 AMcurrentSymbol = INFIX; //trick "/" into recognizing "-" on second parse
 return {input:st, tag:tagst, output:st, ttype:UNARY, func:true, val:true};
 }
 return {input:st, tag:tagst, output:st, ttype:CONST, val:true};
}

function AMremoveBrackets(node) {
 var st;
 if (node.nodeName=="mrow") {
 st = node.firstChild.firstChild.nodeValue;
 if (st=="(" || st=="[" || st=="{") node.removeChild(node.firstChild);
 }
 if (node.nodeName=="mrow") {
 st = node.lastChild.firstChild.nodeValue;
 if (st==")" || st=="]" || st=="}") node.removeChild(node.lastChild);
 }
}

//TeX conversion version
function AMTremoveBrackets(node) {
 
 var st;
 if (node.charAt(0)=='{' && node.charAt(node.length-1)=='}') {

 st = node.charAt(1);
 if (st=="(" || st=="[") node = '{'+node.substr(2);
 st = node.substr(1,6);
 if (st=="\\left(" || st=="\\left[" || st=="\\left{") node = '{'+node.substr(7);
 st = node.substr(1,12);
 if (st=="\\left\\lbrace" || st=="\\left\\langle") node = '{'+node.substr(13);
 st = node.charAt(node.length-2);
 if (st==")" || st=="]") node = node.substr(0,node.length-8)+'}';
 st = node.substr(node.length-8,7)
 if (st=="\\rbrace" || st=="\\rangle") node = node.substr(0,node.length-14) + '}';
 
 } 
 return node;
}

/*Parsing ASCII math expressions with the following grammar
v ::= [A-Za-z] | greek letters | numbers | other constant symbols
u ::= sqrt | text | bb | other unary symbols for font commands
b ::= frac | root | stackrel binary symbols
l ::= ( | [ | { | (: | {: left brackets
r ::= ) | ] | } | :) | :} right brackets
S ::= v | lEr | uS | bSS Simple expression
I ::= S_S | S^S | S_S^S | S Intermediate expression
E ::= IE | I/I Expression
Each terminal symbol is translated into a corresponding mathml node.*/




function AMTgetTeXsymbol(symb) {
 if (typeof symb.val == "boolean" && symb.val) {
 pre = '';
 } else {
 pre = '\\';
 }
 if (symb.tex==null) {
 return (pre+symb.input);
 } else {
 return (pre+symb.tex);
 }
}
function AMTgetTeXbracket(symb) {
 if (symb.tex==null) {
 return (symb.input);
 } else {
 return ('\\'+symb.tex);
 }
}

function AMTparseSexpr(str) { //parses str and returns [node,tailstr]
 var symbol, node, result, i, st,// rightvert = false,
 newFrag = '';
 str = AMremoveCharsAndBlanks(str,0);
 symbol = AMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET && AMnestingDepth > 0) {
 return [null,str];
 }
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+AMremoveCharsAndBlanks(str,symbol.input.length); 
 symbol = AMgetSymbol(str);
 }
 switch (symbol.ttype) {
 case UNDEROVER:
 case CONST:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 var texsymbol = AMTgetTeXsymbol(symbol);
 if (texsymbol.charAt(0)=="\\" || symbol.tag=="mo") return [texsymbol,str];
 else return ['{'+texsymbol+'}',str];
 
 case LEFTBRACKET: //read (expr+)
 AMnestingDepth++;
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 
 result = AMTparseExpr(str,true);
 AMnestingDepth--;
 if (typeof symbol.invisible == "boolean" && symbol.invisible) 
 node = '{\\left.'+result[0]+'}';
 else {
 node = '{\\left'+AMTgetTeXbracket(symbol) + result[0]+'}';
 }
 return [node,result[1]];
 case TEXT:
 if (symbol!=AMquote) str = AMremoveCharsAndBlanks(str,symbol.input.length);
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else if (str.charAt(0)=="(") i=str.indexOf(")");
 else if (str.charAt(0)=="[") i=str.indexOf("]");
 else if (symbol==AMquote) i=str.slice(1).indexOf("\"")+1;
 else i = 0;
 if (i==-1) i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 newFrag = '\\ ';
 }
 newFrag += '\\text{'+st+'}';
 if (st.charAt(st.length-1) == " ") {
 newFrag += '\\ ';
 }
 str = AMremoveCharsAndBlanks(str,i+1);
 return [newFrag,str];
 case UNARY:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMTparseSexpr(str);
 if (result[0]==null) return ['{'+AMTgetTeXsymbol(symbol)+'}',str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
 if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 return ['{'+AMTgetTeXsymbol(symbol)+'}',str];
 } else {
 node = '{'+AMTgetTeXsymbol(symbol)+'{'+result[0]+'}}';
 return [node,result[1]];
 }
 }
 result[0] = AMTremoveBrackets(result[0]);
 if (symbol.input == "sqrt") { // sqrt
 return ['\\sqrt{'+result[0]+'}',result[1]];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 return ['{'+AMTgetTeXsymbol(symbol)+'{'+result[0]+'}}',result[1]];
 } else { // font change command 
 return ['{'+AMTgetTeXsymbol(symbol)+'{'+result[0]+'}}',result[1]];
 }
 case BINARY:
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 result = AMTparseSexpr(str);
 if (result[0]==null) return ['{'+AMTgetTeXsymbol(symbol)+'}',str];
 result[0] = AMTremoveBrackets(result[0]);
 var result2 = AMTparseSexpr(result[1]);
 if (result2[0]==null) return ['{'+AMTgetTeXsymbol(symbol)+'}',str];
 result2[0] = AMTremoveBrackets(result2[0]);
 if (symbol.input=="density") {
 newFrag = '{\\density{'+result[0]+'}{'+result2[0]+'}}';
 newFrag = newFrag.replace(/{{{/g,"{");
 newFrag = newFrag.replace(/}}}/g,"}");
 }
 if (symbol.input=="root") {
 newFrag = '{\\sqrt['+result[0]+']{'+result2[0]+'}}';
 }
 if (symbol.input=="stackrel") {
 newFrag = '{'+AMTgetTeXsymbol(symbol)+'{'+result[0]+'}{'+result2[0]+'}}';
 }
 if (symbol.input=="frac") {
 newFrag = '{\\frac{'+result[0]+'}{'+result2[0]+'}}';
 }
 return [newFrag,result2[1]];
 case INFIX:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 return [symbol.output,str];
 case SPACE:
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 return ['{\\quad\\text{'+symbol.input+'}\\quad}',str];
 case LEFTRIGHT:
// if (rightvert) return [null,str]; else rightvert = true;
 AMnestingDepth++;
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMTparseExpr(str,false);
 AMnestingDepth--;
 var st = "";
 st = result[0].charAt(result[0].length -1);
//alert(result[0].lastChild+"***"+st);
 if (st == "|") { // its an absolute value subterm
 node = '{\\left|'+result[0]+'}';
 return [node,result[1]];
 } else { // the "|" is a \mid
 node = '{\\mid}';
 return [node,str];
 }
 
 default:
//alert("default");
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 return ['{'+AMTgetTeXsymbol(symbol)+'}',str];
 }
}

function AMTparseIexpr(str) {
 var symbol, sym1, sym2, node, result, underover;
 str = AMremoveCharsAndBlanks(str,0);
 sym1 = AMgetSymbol(str);
 result = AMTparseSexpr(str);
 node = result[0];
 str = result[1];
 symbol = AMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input != "/") {
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 // if (symbol.input == "/") result = AMTparseIexpr(str); else 
 result = AMTparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = '{}';
 else result[0] = AMTremoveBrackets(result[0]);
 str = result[1];
// if (symbol.input == "/") AMTremoveBrackets(node);
 if (symbol.input == "_") {
 sym2 = AMgetSymbol(str);
 underover = (sym1.ttype == UNDEROVER);
 if (sym2.input == "^") {
 str = AMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = AMTparseSexpr(str);
 res2[0] = AMTremoveBrackets(res2[0]);
 str = res2[1];
 node = '{' + node;
 node += '_{'+result[0]+'}';
 node += '^{'+res2[0]+'}';
 node += '}';
 } else {
 node += '_{'+result[0]+'}';
 }
 } else { //must be ^
 node = '{'+node+'}^{'+result[0]+'}';
 }
 } 
 
 return [node,str];
}

function AMTparseExpr(str,rightbracket) {
 var symbol, node, result, i, nodeList = [],
 newFrag = '';
 var addedright = false;
 do {
 str = AMremoveCharsAndBlanks(str,0);
 result = AMTparseIexpr(str);
 node = result[0];
 str = result[1];
 symbol = AMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input == "/") {
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 result = AMTparseIexpr(str);
 
 if (result[0] == null) // show box in place of missing argument
 result[0] = '{}';
 else result[0] = AMTremoveBrackets(result[0]);
 str = result[1];
 node = AMTremoveBrackets(node);
 node = '\\frac' + '{'+ node + '}';
 node += '{'+result[0]+'}';
 newFrag += node;
 symbol = AMgetSymbol(str);
 } else if (node!=undefined) newFrag += node;
 } while ((symbol.ttype != RIGHTBRACKET && 
 (symbol.ttype != LEFTRIGHT || rightbracket)
 || AMnestingDepth == 0) && symbol!=null && symbol.output!="");
 if (symbol.ttype == RIGHTBRACKET || symbol.ttype == LEFTRIGHT) {
// if (AMnestingDepth > 0) AMnestingDepth--;
 var len = newFrag.length;
 if (len>2 && newFrag.charAt(0)=='{' && newFrag.indexOf(',')>0) { //could be matrix (total rewrite from .js)
 var right = newFrag.charAt(len - 2);
 if (right==')' || right==']') {
 var left = newFrag.charAt(6);
 if ((left=='(' && right==')' && symbol.output != '}') || (left=='[' && right==']')) {
 var mxout = '\\begin{array}{cc}{';
 var pos = new Array(); //position of commas
 pos.push(0);
 var matrix = true;
 var mxnestingd = 0;
 for (i=1; i<len-1; i++) {
 if (newFrag.charAt(i)==left) mxnestingd++;
 if (newFrag.charAt(i)==right) {
 mxnestingd--;
 if (mxnestingd==0 && newFrag.charAt(i+2)==',' && newFrag.charAt(i+3)=='{') pos.push(i+2);
 }
 }
 pos.push(len);
 var lastmxsubcnt = -1;
 if (mxnestingd==0 && pos.length>0) {
 for (i=0;i<pos.length-1;i++) {
 if (i>0) mxout += '\\\\';
 if (i==0) {
 var subarr = newFrag.substr(pos[i]+7,pos[i+1]-pos[i]-15).split(',');
 } else {
 var subarr = newFrag.substr(pos[i]+8,pos[i+1]-pos[i]-16).split(',');
 }
 if (lastmxsubcnt>0 && subarr.length!=lastmxsubcnt) {
 matrix = false;
 } else if (lastmxsubcnt==-1) {
 lastmxsubcnt=subarr.length;
 }
 mxout += subarr.join('&');
 }
 }
 mxout += '\\end{array}}';
 if (matrix) { newFrag = mxout;}
 }
 }
 }
 
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = '\\right'+AMTgetTeXbracket(symbol);
 newFrag += node;
 addedright = true;
 } else {
 newFrag += '\\right.';
 addedright = true;
 }
 
 }
 if(AMnestingDepth>0 && !addedright) {
 newFrag += '\\right.'; //adjust for non-matching left brackets
 //todo: adjust for non-matching right brackets
 }
 
 return [newFrag,str];
}

function AMTparseAMtoTeX(str) {
 //DLMOD to remove &nbsp;, which editor adds on multiple spaces
 AMnestingDepth = 0;
 str = str.replace(/&nbsp;/g,"");
 str = str.replace(/&gt;/g,">");
 str = str.replace(/&lt;/g,"<");
 str = str.replace(/ /g," ");
 return AMTparseExpr(str.replace(/^\s+/g,""),false)[0];
}



function AMparseSexpr(str) { //parses str and returns [node,tailstr]
 var symbol, node, result, i, st,// rightvert = false,
 newFrag = document.createDocumentFragment();
 str = AMremoveCharsAndBlanks(str,0);
 symbol = AMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET && AMnestingDepth > 0) {
 return [null,str];
 }
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+AMremoveCharsAndBlanks(str,symbol.input.length); 
 symbol = AMgetSymbol(str);
 }
 switch (symbol.ttype) { case UNDEROVER:
 case CONST:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str];
 case LEFTBRACKET: //read (expr+)
 AMnestingDepth++;
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMparseExpr(str,true);
 AMnestingDepth--;
 if (typeof symbol.invisible == "boolean" && symbol.invisible) 
 node = createMmlNode("mrow",result[0]);
 else {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 }
 return [node,result[1]];
 case TEXT:
 if (symbol!=AMquote) str = AMremoveCharsAndBlanks(str,symbol.input.length);
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else if (str.charAt(0)=="(") i=str.indexOf(")");
 else if (str.charAt(0)=="[") i=str.indexOf("]");
 else if (symbol==AMquote) i=str.slice(1).indexOf("\"")+1;
 else i = 0;
 if (i==-1) i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 }
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(st)));
 if (st.charAt(st.length-1) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 }
 str = AMremoveCharsAndBlanks(str,i+1);
 return [createMmlNode("mrow",newFrag),str];
 case UNARY:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMparseSexpr(str);
 if (result[0]==null) return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
 if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str];
 } else {
 node = createMmlNode("mrow",
 createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node.appendChild(result[0]);
 return [node,result[1]];
 }
 }
 AMremoveBrackets(result[0]);
 if (symbol.input == "sqrt") { // sqrt
 return [createMmlNode(symbol.tag,result[0]),result[1]];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 node = createMmlNode(symbol.tag,result[0]);
 node.appendChild(createMmlNode("mo",document.createTextNode(symbol.output)));
 return [node,result[1]];
 } else { // font change command
 if (!isIE && typeof symbol.codes != "undefined") {
 for (i=0; i<result[0].childNodes.length; i++)
 if (result[0].childNodes[i].nodeName=="mi" || result[0].nodeName=="mi") {
 st = (result[0].nodeName=="mi"?result[0].firstChild.nodeValue:
 result[0].childNodes[i].firstChild.nodeValue);
 var newst = [];
 for (var j=0; j<st.length; j++)
 if (st.charCodeAt(j)>64 && st.charCodeAt(j)<91) {newst = newst + fixedFromCharCode(symbol.codes[st.charCodeAt(j)-65]);} else newst = newst + st.charAt(j);
 if (result[0].nodeName=="mi")
 result[0]=createMmlNode("mo").
 appendChild(document.createTextNode(newst));
 else result[0].replaceChild(createMmlNode("mo").
 appendChild(document.createTextNode(newst)),
 result[0].childNodes[i]);
 }
 }
 node = createMmlNode(symbol.tag,result[0]);
 node.setAttribute(symbol.atname,symbol.atval);
 return [node,result[1]];
 }
 case BINARY:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMparseSexpr(str);
 if (result[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str];
 AMremoveBrackets(result[0]);
 var result2 = AMparseSexpr(result[1]);
 if (result2[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str];
 AMremoveBrackets(result2[0]);
 if (symbol.input=="density") { 
 var tclrf = str.match(/\{\s*([#\w]+)\s*\}/); //get's size from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclrf!=null) {
 if(tclrf[1]>1000) {
 tclrf=1000+'%';
 } else {
 tclrf=tclrf[1]+'%';
 }
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclrf);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
 if (symbol.input=="root" || symbol.input=="stackrel") 
 newFrag.appendChild(result2[0]);
 newFrag.appendChild(result[0]);
 if (symbol.input=="frac") newFrag.appendChild(result2[0]);
 return [createMmlNode(symbol.tag,newFrag),result2[1]];
 case INFIX:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode("mo",document.createTextNode(symbol.output)),str];
 case SPACE:
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 return [createMmlNode("mrow",newFrag),str];
 case LEFTRIGHT:
// if (rightvert) return [null,str]; else rightvert = true;
 AMnestingDepth++;
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 result = AMparseExpr(str,false);
 AMnestingDepth--;
 var st = "";
 if (result[0].lastChild!=null)
 st = result[0].lastChild.firstChild.nodeValue;
 if (st == "|") { // its an absolute value subterm
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 return [node,result[1]];
 } else { // the "|" is a \mid so use unicode 2223 (divides) for spacing
 node = createMmlNode("mo",document.createTextNode("\u2223"));
 node = createMmlNode("mrow",node);
 return [node,str];
 }
 default:
//alert("default");
 str = AMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str];
 }
}

function AMparseIexpr(str) {
 var symbol, sym1, sym2, node, result, underover;
 str = AMremoveCharsAndBlanks(str,0);
 sym1 = AMgetSymbol(str);
 result = AMparseSexpr(str);
 node = result[0];
 str = result[1];
 symbol = AMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input != "/") {
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
// if (symbol.input == "/") result = AMparseIexpr(str); else ...
 result = AMparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 else AMremoveBrackets(result[0]);
 str = result[1];
// if (symbol.input == "/") AMremoveBrackets(node);
 if (symbol.input == "_") {
 sym2 = AMgetSymbol(str);
 underover = (sym1.ttype == UNDEROVER);
 if (sym2.input == "^") {
 str = AMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = AMparseSexpr(str);
 AMremoveBrackets(res2[0]);
 str = res2[1];
 node = createMmlNode((underover?"munderover":"msubsup"),node);
 node.appendChild(result[0]);
 node.appendChild(res2[0]);
 node = createMmlNode("mrow",node); // so sum does not stretch
 } else {
 node = createMmlNode((underover?"munder":"msub"),node);
 node.appendChild(result[0]);
 }
 } else {
 node = createMmlNode(symbol.tag,node);
 node.appendChild(result[0]);
 }
 }
 return [node,str];
}

function AMparseExpr(str,rightbracket) {
 var symbol, node, result, i, nodeList = [],
 newFrag = document.createDocumentFragment();
 do {
 str = AMremoveCharsAndBlanks(str,0);
 result = AMparseIexpr(str);
 node = result[0];
 str = result[1];
 symbol = AMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input == "/") {
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 result = AMparseIexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 else AMremoveBrackets(result[0]);
 str = result[1];
 AMremoveBrackets(node);
 node = createMmlNode(symbol.tag,node);
 node.appendChild(result[0]);
 newFrag.appendChild(node);
 symbol = AMgetSymbol(str);
 } 
 else if (node!=undefined) newFrag.appendChild(node);
 } while ((symbol.ttype != RIGHTBRACKET && 
 (symbol.ttype != LEFTRIGHT || rightbracket)
 || AMnestingDepth == 0) && symbol!=null && symbol.output!="");
 if (symbol.ttype == RIGHTBRACKET || symbol.ttype == LEFTRIGHT) {
// if (AMnestingDepth > 0) AMnestingDepth--;
 var len = newFrag.childNodes.length;
 if (len>0 && newFrag.childNodes[len-1].nodeName == "mrow" && len>1 &&
 newFrag.childNodes[len-2].nodeName == "mo" &&
 newFrag.childNodes[len-2].firstChild.nodeValue == ",") { //matrix
 var right = newFrag.childNodes[len-1].lastChild.firstChild.nodeValue;
 if (right==")" || right=="]") {
 var left = newFrag.childNodes[len-1].firstChild.firstChild.nodeValue;
 if (left=="(" && right==")" && symbol.output != "}" || 
 left=="[" && right=="]") {
 var pos = []; // positions of commas
 var matrix = true;
 var m = newFrag.childNodes.length;
 for (i=0; matrix && i<m; i=i+2) {
 pos[i] = [];
 node = newFrag.childNodes[i];
 if (matrix) matrix = node.nodeName=="mrow" && 
 (i==m-1 || node.nextSibling.nodeName=="mo" && 
 node.nextSibling.firstChild.nodeValue==",")&&
 node.firstChild.firstChild.nodeValue==left &&
 node.lastChild.firstChild.nodeValue==right;
 if (matrix) 
 for (var j=0; j<node.childNodes.length; j++)
 if (node.childNodes[j].firstChild.nodeValue==",")
 pos[i][pos[i].length]=j;
 if (matrix && i>1) matrix = pos[i].length == pos[i-2].length;
 }
 if (matrix) {
 var row, frag, n, k, table = document.createDocumentFragment();
 for (i=0; i<m; i=i+2) {
 row = document.createDocumentFragment();
 frag = document.createDocumentFragment();
 node = newFrag.firstChild; // <mrow>(-,-,...,-,-)</mrow>
 n = node.childNodes.length;
 k = 0;
 node.removeChild(node.firstChild); //remove (
 for (j=1; j<n-1; j++) {
 if (typeof pos[i][k] != "undefined" && j==pos[i][k]){
 node.removeChild(node.firstChild); //remove ,
 row.appendChild(createMmlNode("mtd",frag));
 k++;
 } else frag.appendChild(node.firstChild);
 }
 row.appendChild(createMmlNode("mtd",frag));
 if (newFrag.childNodes.length>2) {
 newFrag.removeChild(newFrag.firstChild); //remove <mrow>)</mrow>
 newFrag.removeChild(newFrag.firstChild); //remove <mo>,</mo>
 }
 table.appendChild(createMmlNode("mtr",row));
 }
 node = createMmlNode("mtable",table);
 if (typeof symbol.invisible == "boolean" && symbol.invisible) node.setAttribute("columnalign","left");
 newFrag.replaceChild(node,newFrag.firstChild);
 }
 }
 }
 }
 str = AMremoveCharsAndBlanks(str,symbol.input.length);
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 newFrag.appendChild(node);
 }
 }
 return [newFrag,str];
}

function AMparseMath(str,latex) {
 var frag, node;
 AMnestingDepth = 0;
 frag = latex ? LMparseExpr(str.replace(/^\s+/g,""),false,false)[0] : AMparseExpr(str.replace(/^\s+/g,""),false)[0];
 node = createMmlNode("mstyle",frag);
 node.setAttribute("mathcolor",mathcolor);
 node.setAttribute("fontfamily",mathfontfamily);
 node.setAttribute("mathsize",mathfontsize);
 if (displaystyle) node.setAttribute("displaystyle","true");
 node = createMmlNode("math",node);
 if (showasciiformulaonhover) //fixed by djhsu so newline
 node.setAttribute("title",str.replace(/\s+/g," "));//does not show in Gecko
 return node;
}

function AMautomathrec(str) {
//formula is a space (or start of str) followed by a maximal sequence of *two* or more tokens, possibly separated by runs of digits and/or space.
//tokens are single letters (except a, A, I) and ASCIIMathML tokens
 var texcommand = "\\\\[a-zA-Z]+|\\\\\\s|";
 var ambigAMtoken = "\\b(?:oo|lim|ln|int|oint|del|grad|aleph|prod|prop|sinh|cosh|tanh|cos|sec|pi|tt|fr|sf|sube|supe|sub|sup|det|mod|gcd|lcm|min|max|vec|ddot|ul|chi|eta|nu|mu)(?![a-z])|";
 var englishAMtoken = "\\b(?:sum|ox|log|sin|tan|dim|hat|bar|dot)(?![a-z])|";
 var secondenglishAMtoken = "|\\bI\\b|\\bin\\b|\\btext\\b"; // took if and or not out
 var simpleAMtoken = "NN|ZZ|QQ|RR|CC|TT|AA|EE|sqrt|dx|dy|dz|dt|xx|vv|uu|nn|bb|cc|csc|cot|alpha|beta|delta|Delta|epsilon|gamma|Gamma|kappa|lambda|Lambda|omega|phi|Phi|Pi|psi|Psi|rho|sigma|Sigma|tau|theta|Theta|xi|Xi|zeta"; // uuu nnn?
 var letter = "[a-zA-HJ-Z](?=(?:[^a-zA-Z]|$|"+ambigAMtoken+englishAMtoken+simpleAMtoken+"))|";
 var token = letter+texcommand+"\\d+|[-()[\\]{}+=*&^_%\\\@/<>,\\|!:;'~]|\\.(?!(?:\x20|$))|"+ambigAMtoken+englishAMtoken+simpleAMtoken;
 var re = new RegExp("(^|\\s)((("+token+")\\s?)(("+token+secondenglishAMtoken+")\\s?)+)([,.?]?(?=\\s|$))","g");
 str = str.replace(re," `$2`$7");
 var arr = str.split(AMdelimiter1);
 var re1 = new RegExp("(^|\\s)([b-zB-HJ-Z+*<>]|"+texcommand+ambigAMtoken+simpleAMtoken+")(\\s|\\n|$)","g");
 var re2 = new RegExp("(^|\\s)([a-z]|"+texcommand+ambigAMtoken+simpleAMtoken+")([,.])","g"); // removed |\d+ for now
 for (i=0; i<arr.length; i++) //single nonenglish tokens
 if (i%2==0) {
 arr[i] = arr[i].replace(re1," `$2`$3");
 arr[i] = arr[i].replace(re2," `$2`$3");
 arr[i] = arr[i].replace(/([{}[\]])/,"`$1`");
 }
 str = arr.join(AMdelimiter1);
 str = str.replace(/((^|\s)\([a-zA-Z]{2,}.*?)\)`/g,"$1`)"); //fix parentheses
 str = str.replace(/`(\((a\s|in\s))(.*?[a-zA-Z]{2,}\))/g,"$1`$3"); //fix parentheses
 str = str.replace(/\sin`/g,"` in");
 str = str.replace(/`(\(\w\)[,.]?(\s|\n|$))/g,"$1`");
 str = str.replace(/`([0-9.]+|e.g|i.e)`(\.?)/gi,"$1$2");
 str = str.replace(/`([0-9.]+:)`/g,"$1");
 return str;
}

function AMprocessNodeR(n, linebreaks,latex) {
 var mtch, str, arr, frg, i;
 if (n.childNodes.length == 0) {
 if ((n.nodeType!=8 || linebreaks) &&
 n.parentNode.nodeName!="form" && n.parentNode.nodeName!="FORM" &&
 n.parentNode.nodeName!="textarea" && n.parentNode.nodeName!="TEXTAREA" /*&&
 n.parentNode.nodeName!="pre" && n.parentNode.nodeName!="PRE"*/) {
 str = n.nodeValue;
 if (!(str == null)) {
 str = str.replace(/\r\n\r\n/g,"\n\n");
 str = str.replace(/\x20+/g," ");
 str = str.replace(/\s*\r\n/g," ");
 if(latex) {
// DELIMITERS:
 mtch = (str.indexOf("\$")==-1 ? false : true);
 str = str.replace(/([^\\])\$/g,"$1 \$");
 str = str.replace(/^\$/," \$"); // in case \$ at start of string
 arr = str.split(" \$");
 for (i=0; i<arr.length; i++)
 arr[i]=arr[i].replace(/\\\$/g,"\$");
 } else {
 mtch = false;
 str = str.replace(new RegExp(AMescape1, "g"),
 function(){mtch = true; return "AMescape1"});
 str = str.replace(/\\?end{?a?math}?/i,
 function(){automathrecognize = false; mtch = true; return ""});
 str = str.replace(/amath\b|\\begin{a?math}/i,
 function(){automathrecognize = true; mtch = true; return ""});
 arr = str.split(AMdelimiter1);
 if (automathrecognize)
 for (i=0; i<arr.length; i++)
 if (i%2==0) arr[i] = AMautomathrec(arr[i]);
 str = arr.join(AMdelimiter1);
 arr = str.split(AMdelimiter1);
 for (i=0; i<arr.length; i++) // this is a problem ************
 arr[i]=arr[i].replace(/AMescape1/g,AMdelimiter1);
 }
 if (arr.length>1 || mtch) {
 //if (!AMnoMathML) {
 frg = strarr2docFrag(arr,n.nodeType==8,latex);
 var len = frg.childNodes.length;
 n.parentNode.replaceChild(frg,n);
 return len-1;
 //} else return 0;
 }
 }
 } else return 0;
 } else if (n.nodeName!="math") {
 for (i=0; i<n.childNodes.length; i++)
 i += AMprocessNodeR(n.childNodes[i], linebreaks,latex);
 }
 return 0;
}

function AMprocessNode(n, linebreaks, spanclassAM) {
 var frag,st;
 if (spanclassAM!=null) {
 frag = document.getElementsByTagName("span")
 for (var i=0;i<frag.length;i++)
 if (frag[i].className == "AM") 
 AMprocessNodeR(frag[i],linebreaks,false);
 } else {
 try {
 st = n.innerHTML; // look for AMdelimiter on page
 } catch(err) {}
//alert(st)
 if (st==null || /amath\b|\\begin{a?math}/i.test(st) ||
 st.indexOf(AMdelimiter1+" ")!=-1 || st.slice(-1)==AMdelimiter1 ||
 st.indexOf(AMdelimiter1+"<")!=-1 || st.indexOf(AMdelimiter1+"\n")!=-1) {
 AMprocessNodeR(n,linebreaks,false);
 }
 }
}

function AMCNames(s1,s2) {
 if (s1.input > s2.input) return 1
 else return -1;
}


function LMinitSymbols() {
 LMsymbols.sort(AMCNames);
 for (i=0; i<LMsymbols.length; i++) LMnames[i] = LMsymbols[i].input;
}



function LMcreateElementMathML(t) {
 if (!isIE) return document.createElementNS(LMmathml,t);
}
function LMremoveCharsAndBlanks(str,n) {
//remove n characters and any following blanks
 var st;
 st = str.slice(n);
 for (var i=0; i<st.length && st.charCodeAt(i)<=32; i=i+1);
 return st.slice(i);
}

function LMgetSymbol(str) {
//return maximal initial substring of str that appears in names
//return null if there is none
 var k = 0; //new pos
 var j = 0; //old pos
 var mk; //match pos
 var st;
 var tagst;
 var match = "";
 var more = true;
 for (var i=1; i<=str.length && more; i++) {
 st = str.slice(0,i); //initial substring of length i
 j = k;
 k = position(LMnames, st, j);
 if (k<LMnames.length && str.slice(0,LMnames[k].length)==LMnames[k]){
 match = LMnames[k];
 mk = k;
 i = match.length;
 }
 more = k<LMnames.length && str.slice(0,LMnames[k].length)>=LMnames[k];
 }
 LMpreviousSymbol=LMcurrentSymbol;
 if (match!=""){
 LMcurrentSymbol=LMsymbols[mk].ttype;
 return LMsymbols[mk];
 }
 LMcurrentSymbol=CONST;
 k = 1;
 st = str.slice(0,1); //take 1 character
 if ("0"<=st && st<="9") tagst = "mn";
 else tagst = (("A">st || st>"Z") && ("a">st || st>"z")?"mo":"mi");
 return {input:st, tag:tagst, output:st, ttype:CONST};
}

function LMparseSexpr(str) { //parses str and returns [node,tailstr,(node)tag]
 var symbol, node, result, result2, i, st,// rightvert = false,
 newFrag = document.createDocumentFragment();
 str = LMremoveCharsAndBlanks(str,0);
 symbol = LMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET)
 return [null,str,null];
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+LMremoveCharsAndBlanks(str,symbol.input.length);
 symbol = LMgetSymbol(str);
 if (symbol == null || symbol.ttype == RIGHTBRACKET)
 return [null,str,null];
 }
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 switch (symbol.ttype) {
 case SPACE:
 node = LMcreateElementMathML(symbol.tag);
 node.setAttribute(symbol.atname,symbol.atval);
 return [node,str,symbol.tag];
 case UNDEROVER:
 if (isIE) {
 if (symbol.input.substr(0,4) == "\\big") { // botch for missing symbols
 str = "\\"+symbol.input.substr(4)+str; // make \bigcup = \cup etc.
 symbol = LMgetSymbol(str);
 symbol.ttype = UNDEROVER;
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 }
 }
 return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str,symbol.tag];
 case CONST:
 var output = symbol.output;
 if (isIE) {
 if (symbol.input == "'")
 output = "\u2032";
 else if (symbol.input == "''")
 output = "\u2033";
 else if (symbol.input == "'''")
 output = "\u2033\u2032";
 else if (symbol.input == "''''")
 output = "\u2033\u2033";
 else if (symbol.input == "\\square")
 output = "\u25A1"; // same as \Box
 else if (symbol.input.substr(0,5) == "\\frac") {
 // botch for missing fractions
 var denom = symbol.input.substr(6,1);
 if (denom == "5" || denom == "6") {
 str = symbol.input.replace(/\\frac/,"\\frac ")+str;
 return [node,str,symbol.tag];
 }
 }
 }
 node = createMmlNode(symbol.tag,document.createTextNode(output));
 return [node,str,symbol.tag];
 case LONG: // added by DRW
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 node.setAttribute("minsize","1.5");
 node.setAttribute("maxsize","1.5");
 node = createMmlNode("mover",node);
 node.appendChild(LMcreateElementMathML("mspace"));
 return [node,str,symbol.tag];
 case STRETCHY: // added by DRW
 if (isIE && symbol.input == "\\backslash")
 symbol.output = "\\"; // doesn't expand, but then nor does "\u2216"
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 if (symbol.input == "|" || symbol.input == "\\vert" ||
 symbol.input == "\\|" || symbol.input == "\\Vert") {
 node.setAttribute("lspace","0em");
 node.setAttribute("rspace","0em");
 }
 node.setAttribute("maxsize",symbol.atval); // don't allow to stretch here
 if (symbol.rtag != null)
 return [node,str,symbol.rtag];
 else
 return [node,str,symbol.tag];
 case BIG: // added by DRW
 var atval = symbol.atval;
 if (isIE)
 atval = symbol.ieval;
 symbol = LMgetSymbol(str);
 if (symbol == null)
 return [null,str,null];
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 if (isIE) { // to get brackets to expand
 var space = LMcreateElementMathML("mspace");
 space.setAttribute("height",atval+"ex");
 node = createMmlNode("mrow",node);
 node.appendChild(space);
 } else { // ignored in IE
 node.setAttribute("minsize",atval);
 node.setAttribute("maxsize",atval);
 }
 return [node,str,symbol.tag];
 case LEFTBRACKET: //read (expr+)
 if (symbol.input == "\\left") { // left what?
 symbol = LMgetSymbol(str);
 if (symbol != null) {
 if (symbol.input == ".")
 symbol.invisible = true;
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 }
 }
 result = LMparseExpr(str,true,false);
 if (symbol==null ||
 (typeof symbol.invisible == "boolean" && symbol.invisible))
 node = createMmlNode("mrow",result[0]);
 else {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 }
 return [node,result[1],result[2]];
 case MATRIX: //read (expr+)
 if (symbol.input == "\\begin{array}") {
 var mask = "";
 symbol = LMgetSymbol(str);
 str = LMremoveCharsAndBlanks(str,0);
 if (symbol == null)
 mask = "l";
 else {
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 if (symbol.input != "{")
 mask = "l";
 else do {
 symbol = LMgetSymbol(str);
 if (symbol != null) {
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 if (symbol.input != "}")
 mask = mask+symbol.input;
 }
 } while (symbol != null && symbol.input != "" && symbol.input != "}");
 }
 result = LMparseExpr("{"+str,true,true);
// if (result[0]==null) return [createMmlNode("mo",
// document.createTextNode(symbol.input)),str];
 node = createMmlNode("mtable",result[0]);
 mask = mask.replace(/l/g,"left ");
 mask = mask.replace(/r/g,"right ");
 mask = mask.replace(/c/g,"center ");
 node.setAttribute("columnalign",mask);
 node.setAttribute("displaystyle","false");
 var lspace = LMcreateElementMathML("mspace");
 lspace.setAttribute("width","0.167em");
 var rspace = LMcreateElementMathML("mspace");
 rspace.setAttribute("width","0.167em");
 var node1 = createMmlNode("mrow",lspace);
 node1.appendChild(node);
 node1.appendChild(rspace);
 return [node1,result[1],null];
 } else { // eqnarray
 result = LMparseExpr("{"+str,true,true);
 node = createMmlNode("mtable",result[0]);
 node.setAttribute("columnspacing","0.167em"); // correct (but ignored?)
 node.setAttribute("columnalign","right center left");
 node.setAttribute("displaystyle","true");
 node = createMmlNode("mrow",node);
 return [node,result[1],null];
 }
 case TEXT:
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else i = 0;
 if (i==-1)
 i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 node = LMcreateElementMathML("mspace");
 node.setAttribute("width","0.33em"); // was 1ex
 newFrag.appendChild(node);
 }
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(st)));
 if (st.charAt(st.length-1) == " ") {
 node = LMcreateElementMathML("mspace");
 node.setAttribute("width","0.33em"); // was 1ex
 newFrag.appendChild(node);
 }
 str = LMremoveCharsAndBlanks(str,i+1);
 return [createMmlNode("mrow",newFrag),str,null];
 case UNARY:
 result = LMparseSexpr(str);
 if (result[0]==null) return [createMmlNode(symbol.tag,document.createTextNode(symbol.output)),str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
// if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 if (st=="^" || st=="_" || st==",") {
 return [createMmlNode(symbol.tag,document.createTextNode(symbol.output)),str,symbol.tag];
 } else {
 node = createMmlNode("mrow",createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node.appendChild(result[0]);
 return [node,result[1],symbol.tag];
 }
 }
 if (symbol.input == "\\sqrt") { // sqrt
 return [createMmlNode(symbol.tag,result[0]),result[1],symbol.tag];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 node = createMmlNode(symbol.tag,result[0]);
 var output = symbol.output;
 if (isIE) {
 if (symbol.input == "\\hat")
 output = "\u0302";
 else if (symbol.input == "\\widehat")
 output = "\u005E";
 else if (symbol.input == "\\bar")
 output = "\u00AF";
 else if (symbol.input == "\\grave")
 output = "\u0300";
 else if (symbol.input == "\\tilde")
 output = "\u0303";
 }
 var node1 = createMmlNode("mo",document.createTextNode(output));
 if (symbol.input == "\\vec" || symbol.input == "\\check")
 // don't allow to stretch
 node1.setAttribute("maxsize","1.2");
 // why doesn't "1" work? \vec nearly disappears in firefox
 if (isIE && symbol.input == "\\bar")
 node1.setAttribute("maxsize","0.5");
 if (symbol.input == "\\underbrace" || symbol.input == "\\underline")
 node1.setAttribute("accentunder","true");
 else
 node1.setAttribute("accent","true");
 node.appendChild(node1);
 if (symbol.input == "\\overbrace" || symbol.input == "\\underbrace")
 node.ttype = UNDEROVER;
 return [node,result[1],symbol.tag];
 } else { // font change or displaystyle command
 if (!isIE && typeof symbol.codes != "undefined") {
 for (i=0; i<result[0].childNodes.length; i++)
 if (result[0].childNodes[i].nodeName=="mi" || result[0].nodeName=="mi") {
 st = (result[0].nodeName=="mi"?result[0].firstChild.nodeValue:
 result[0].childNodes[i].firstChild.nodeValue);
 var newst = [];
 for (var j=0; j<st.length; j++)
 if (st.charCodeAt(j)>64 && st.charCodeAt(j)<91) {newst = newst + fixedFromCharCode(symbol.codes[st.charCodeAt(j)-65]);} else newst = newst + st.charAt(j);
 if (result[0].nodeName=="mi")
 result[0]=LMcreateElementMathML("mo").
 appendChild(document.createTextNode(newst));
 else result[0].replaceChild(LMcreateElementMathML("mo").
 appendChild(document.createTextNode(newst)),result[0].childNodes[i]);
 }
 }
 node = createMmlNode(symbol.tag,result[0]);
 node.setAttribute(symbol.atname,symbol.atval);
 if (symbol.input == "\\scriptstyle" ||
 symbol.input == "\\scriptscriptstyle")
 node.setAttribute("displaystyle","false");
 return [node,result[1],symbol.tag];
 }
 case BINARY:
 result = LMparseSexpr(str);
 if (result[0]==null) return [createMmlNode("mo",document.createTextNode(symbol.input)),str,null];
 result2 = LMparseSexpr(result[1]);
 if (result2[0]==null) return [createMmlNode("mo",document.createTextNode(symbol.input)),str,null];
 if (symbol.input=="\\textcolor" || symbol.input=="\\colorbox") { 
 var tclr = str.match(/\{\s*([#\w]+)\s*\}/); //get's color from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclr!=null) {
 if(IsColorName.test(tclr[1].toLowerCase())) {
 tclr=LaTeXColor[tclr[1].toLowerCase()];
 } else {
 tclr=tclr[1]; // no checking for valid color!!
 } 
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclr);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
if (symbol.input=="\\density") { 
 var tclrf = str.match(/\{\s*([#\w]+)\s*\}/); //get's size from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclrf!=null) {
 if(tclrf[1]>1000) {
 tclrf=1000+'%';
 } else {
 tclrf=tclrf[1]+'%';
 }
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclrf);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
 if (symbol.input=="\\root" || symbol.input=="\\stackrel") newFrag.appendChild(result2[0]);
 newFrag.appendChild(result[0]);
 if (symbol.input=="\\frac") newFrag.appendChild(result2[0]);
 return [createMmlNode(symbol.tag,newFrag),result2[1],symbol.tag];
 case INFIX:
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 return [createMmlNode("mo",document.createTextNode(symbol.output)),
 str,symbol.tag];
 default:
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str,symbol.tag];
 }
}

function LMparseIexpr(str) {
 var symbol, sym1, sym2, node, result, tag, underover;
 str = LMremoveCharsAndBlanks(str,0);
 sym1 = LMgetSymbol(str);
 result = LMparseSexpr(str);
 node = result[0];
 str = result[1];
 tag = result[2];
 symbol = LMgetSymbol(str);
 if (symbol.ttype == INFIX) {
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 result = LMparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 str = result[1];
 tag = result[2];
 if (symbol.input == "_" || symbol.input == "^") {
 sym2 = LMgetSymbol(str);
 tag = null; // no space between x^2 and a following sin, cos, etc.
// This is for \underbrace and \overbrace
 underover = ((sym1.ttype == UNDEROVER) || (node.ttype == UNDEROVER));
// underover = (sym1.ttype == UNDEROVER);
 if (symbol.input == "_" && sym2.input == "^") {
 str = LMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = LMparseSexpr(str);
 str = res2[1];
 tag = res2[2]; // leave space between x_1^2 and a following sin etc.
 node = createMmlNode((underover?"munderover":"msubsup"),node);
 node.appendChild(result[0]);
 node.appendChild(res2[0]);
 } else if (symbol.input == "_") {
 node = createMmlNode((underover?"munder":"msub"),node);
 node.appendChild(result[0]);
 } else {
 node = createMmlNode((underover?"mover":"msup"),node);
 node.appendChild(result[0]);
 }
 node = createMmlNode("mrow",node); // so sum does not stretch
 } else {
 node = createMmlNode(symbol.tag,node);
 if (symbol.input == "\\atop" || symbol.input == "\\choose")
 node.setAttribute("linethickness","0ex");
 node.appendChild(result[0]);
 if (symbol.input == "\\choose")
 node = createMmlNode("mfenced",node);
 }
 }
 return [node,str,tag];
}

function LMparseExpr(str,rightbracket,matrix) {
 var symbol, node, result, i, tag,
 newFrag = document.createDocumentFragment();
 do {
 str = LMremoveCharsAndBlanks(str,0);
 result = LMparseIexpr(str);
 node = result[0];
 str = result[1];
 tag = result[2];
 symbol = LMgetSymbol(str);
 if (node!=undefined) {
 if ((tag == "mn" || tag == "mi") && symbol!=null &&
 typeof symbol.func == "boolean" && symbol.func) {
 // Add space before \sin in 2\sin x or x\sin x
 var space = LMcreateElementMathML("mspace");
 space.setAttribute("width","0.167em");
 node = createMmlNode("mrow",node);
 node.appendChild(space);
 }
 newFrag.appendChild(node);
 }
 } while ((symbol.ttype != RIGHTBRACKET)
 && symbol!=null && symbol.output!="");
 tag = null;
 if (symbol.ttype == RIGHTBRACKET) {
 if (symbol.input == "\\right") { // right what?
 str = LMremoveCharsAndBlanks(str,symbol.input.length);
 symbol = LMgetSymbol(str);
 if (symbol != null && symbol.input == ".")
 symbol.invisible = true;
 if (symbol != null)
 tag = symbol.rtag;
 }
 if (symbol!=null)
 str = LMremoveCharsAndBlanks(str,symbol.input.length); // ready to return
 var len = newFrag.childNodes.length;
 if (matrix &&
 len>0 && newFrag.childNodes[len-1].nodeName == "mrow" && len>1 &&
 newFrag.childNodes[len-2].nodeName == "mo" &&
 newFrag.childNodes[len-2].firstChild.nodeValue == "&") { //matrix
 var pos = []; // positions of ampersands
 var m = newFrag.childNodes.length;
 for (i=0; matrix && i<m; i=i+2) {
 pos[i] = [];
 node = newFrag.childNodes[i];
 for (var j=0; j<node.childNodes.length; j++)
 if (node.childNodes[j].firstChild.nodeValue=="&")
 pos[i][pos[i].length]=j;
 }
 var row, frag, n, k, table = document.createDocumentFragment();
 for (i=0; i<m; i=i+2) {
 row = document.createDocumentFragment();
 frag = document.createDocumentFragment();
 node = newFrag.firstChild; // <mrow> -&-&...&-&- </mrow>
 n = node.childNodes.length;
 k = 0;
 for (j=0; j<n; j++) {
 if (typeof pos[i][k] != "undefined" && j==pos[i][k]){
 node.removeChild(node.firstChild); //remove &
 row.appendChild(createMmlNode("mtd",frag));
 k++;
 } else frag.appendChild(node.firstChild);
 }
 row.appendChild(createMmlNode("mtd",frag));
 if (newFrag.childNodes.length>2) {
 newFrag.removeChild(newFrag.firstChild); //remove <mrow> </mrow>
 newFrag.removeChild(newFrag.firstChild); //remove <mo>&</mo>
 }
 table.appendChild(createMmlNode("mtr",row));
 }
 return [table,str];
 }
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 newFrag.appendChild(node);
 }
 }
 return [newFrag,str,tag];
}
var tcnt = 0, dcnt = 0; //theorem and definition counters
function simpleLaTeXformatting(st) {
 st = st.replace(/\$\$((.|\n)*?)\$\$/g,"$ $1 $");
 st = st.replace(/\\begin{(theorem|lemma|proposition|corollary)}((.|\n)*?)\\end{\1}/g,function(r,s,t){tcnt++; return "<b>"+s.charAt(0).toUpperCase()+s.slice(1)+" "+tcnt+".</b> <i>"+t.replace(/^\s*<\/?\w+\/?>|\s*<\/?\w+\/?>$/g,"")+"</i>"});
 st = st.replace(/\\begin{(definition|example|remark|problem|exercise|conjecture|solution)}((.|\n)*?)\\end{\1}/g,function(r,s,t){dcnt++; return "<b>"+s.charAt(0).toUpperCase()+s.slice(1)+" "+dcnt+".</b> "+t.replace(/^\s*<\/?\w+\/?>|\s*<\/?\w+\/?>$/g,"")});
 st = st.replace(/\\begin{proof}((.|\n)*?)\\end{proof}/g,function(s,t){return "<i>Proof:</i> "+t.replace(/^\s*<\/?\w+\/?>|\s*<\/?\w+\/?>$/g,"")+" &#x25A1;"});
 st = st.replace(/\\emph{(.*?)}/g,"<em>$1</em>");
 st = st.replace(/\\textbf{(.*?)}/g,"<b>$1</b>");
 st = st.replace(/\\cite{(.*?)}/g,"[$1]");
 st = st.replace(/\\chapter{(.*?)}/g,"<h2>$1</h2>");
 st = st.replace(/\\section{(.*?)}(\s*<\/?(br|p)\s?\/?>)?/g,"<h3>$1</h3>");
 st = st.replace(/\\subsection{((.|\n)*?)}/g,"<h4>$1</h4>");
 st = st.replace(/\\begin{itemize}(\s*<\/?(br|p)\s?\/?>)?/g,"<ul>");
 st = st.replace(/\\item\s((.|\n)*?)(?=(\\item|\\end))/g,"<li>$1");
 st = st.replace(/\\end{itemize}(\s*<\/?(br|p)\s?\/?>)?/g,"</li></ul>");
 st = st.replace(/\\begin{enumerate}(\s*<\/?(br|p)\s?\/?>)?/g,"<ol>");
 st = st.replace(/\\end{enumerate}(\s*<\/?(br|p)\s?\/?>)?/g,"</li></ol>");
 st = st.replace(/\\item\[(.*?)]{(.*?)}/g,"<dt>$1</dt><dd>$2</dd>");
 st = st.replace(/\\begin{description}/g,"<dl>");
 st = st.replace(/\\end{description}/g,"</dl>");
 st = st.replace(/\\newline\b/g,"<br/>");
 st = st.replace(/\\newpage\b/g,"<br style=\"page-break-after:always;\">");
 st = st.replace(/\\par\b/g,"<p>&nbsp;</p>");
 st = st.replace(/\\bigskip/g,"<p style=\"margin-bottom:0.5in\">&nbsp;</p>");
 st = st.replace(/\\medskip/g,"<p style=\"margin-bottom:0.3in\">&nbsp;</p>");
 st = st.replace(/\\smallskip/g,"<p style=\"margin-bottom:0.15in\">&nbsp;</p>");
 st = st.replace(/\\begin{center}((.|\n)*?)\\end{center}/g,"<center>$1</center>");
 return st
}

function LMprocessNode(n) {
 var frag,st;
 try {
 st = n.innerHTML;
 } catch(err) {}
 var am = /amath\b|graph/i.test(st);
 if ((st==null || st.indexOf("\$ ")!=-1 || st.indexOf("\$<")!=-1 || 
 st.indexOf("\\begin")!=-1 || am || st.slice(-1)=="$" ||
 st.indexOf("\$\n")!=-1)&& !/edit-content|HTMLArea|wikiedit|wpTextbox1/.test(st)){
 if (!avoidinnerHTML && translateLaTeXformatting) 
 st = simpleLaTeXformatting(st);
 if (st!=null && am && !avoidinnerHTML) {
 st = ASCIIandgraphformatting(st);
 }
 st = st.replace(/%7E/g,"~"); // else PmWiki has url issues
 if (!avoidinnerHTML) n.innerHTML = st;
 AMprocessNodeR(n,false,true);
 }
}

function LMparseMath(str) {
 var result, node = LMcreateElementMathML("mstyle");
 //added by J. Knisley to allow limited implementation of \color 
 var cclr = str.match(/\\color\s*\{\s*([#\w]+)\s*\}/);
 str = str.replace(/\\color\s*\{\s*[#\w]+\s*\}/g,"");
 if(cclr!=null) {
 if(IsColorName.test(cclr[1].toLowerCase())) {
 cclr=LaTeXColor[cclr[1].toLowerCase()];
 } else {
 cclr=cclr[1]; // no checking for valid color!!
 }
 node.setAttribute("mathcolor",cclr);
 } else { 
 if (mathcolor != "") node.setAttribute("mathcolor",mathcolor);
 };
 if (mathfontfamily != "") node.setAttribute("fontfamily",mathfontfamily);
 node.appendChild(LMparseExpr(str.replace(/^\s+/g,""),false,false)[0]);
 node = createMmlNode("math",node);
 if (showasciiformulaonhover) //fixed by djhsu so newline
 node.setAttribute("title",str.replace(/\s+/g," "));//does not show in Gecko
 if (false ) { //&& mathfontfamily != "" && (isIE || mathfontfamily != "serif")) {
 var fnode = createElementXHTML("font");
 fnode.setAttribute("face",mathfontfamily);
 fnode.appendChild(node);
 return fnode;
 }
 return node;
}

function LMstrarr2docFrag(arr, linebreaks) {
 var newFrag=document.createDocumentFragment();
 var expr = false;
 for (var i=0; i<arr.length; i++) {
 if (expr) newFrag.appendChild(LMparseMath(arr[i]));
 else {
 var arri = (linebreaks ? arr[i].split("\n\n") : [arr[i]]);
 newFrag.appendChild(createElementXHTML("span").
 appendChild(document.createTextNode(arri[0])));
 for (var j=1; j<arri.length; j++) {
 newFrag.appendChild(createElementXHTML("p"));
 newFrag.appendChild(createElementXHTML("span").
 appendChild(document.createTextNode(arri[j])));
 }
 }
 expr = !expr;
 }
 return newFrag;
}

function LMAMprocessNodeR(n, linebreaks) {
 var mtch, str, arr, frg, i;
 if (n.childNodes.length == 0) {
 if ((n.nodeType!=8 || linebreaks) &&
 n.parentNode.nodeName!="form" && n.parentNode.nodeName!="FORM" &&
 n.parentNode.nodeName!="textarea" && n.parentNode.nodeName!="TEXTAREA" &&
 n.parentNode.nodeName!="pre" && n.parentNode.nodeName!="PRE") {
 str = n.nodeValue;
 if (!(str == null)) {
 str = str.replace(/\r\n\r\n/g,"\n\n");
 str = str.replace(/\x20+/g," ");
 str = str.replace(/\s*\r\n/g," ");
// DELIMITERS:
 mtch = (str.indexOf("\$")==-1 ? false : true);
 str = str.replace(/([^\\])\$/g,"$1 \$");
 str = str.replace(/^\$/," \$"); // in case \$\$ at start of string
 arr = str.split(" \$");
 for (i=0; i<arr.length; i++)
 arr[i]=arr[i].replace(/\\\$/g,"\$");
 if (arr.length>1 || mtch) {
 if (!LMAMnoMathML) {
 frg = LMstrarr2docFrag(arr,n.nodeType==8);
 var len = frg.childNodes.length;
 n.parentNode.replaceChild(frg,n);
 return len-1;
 } else return 0;
 }
 }
 } else return 0;
 } else if (n.nodeName!="math") {
 for (i=0; i<n.childNodes.length; i++)
 i += LMAMprocessNodeR(n.childNodes[i], linebreaks);
 }
 return 0;
}

function LMAMpNode(nlm) {
 var st;
 try {
 st = nlm.innerHTML;
 } catch(err) {}
 if ((st==null || st.indexOf("\$ ")!=-1 || st.indexOf("\$<")!=-1 || 
 st.indexOf("\\begin")!=-1 || st.slice(-1)=="$" ||
 st.indexOf("\$\n")!=-1)&& !/edit-content|HTMLArea|wikiedit|wpTextbox1/.test(st)){
 AMprocessNodeR(nlm,false,true);
 }
}

function isSVGavailable() {
//Safari 3 can do SVG, but still has issues. 
 if ((ver = navigator.userAgent.toLowerCase().match(/safari\/(\d+)/))!=null) {
 if (ver[1]>524) {
 return null;
 }
 } 
//Opera can do SVG, but not very pretty, so might want to skip it 
 if ((ver = navigator.userAgent.toLowerCase().match(/opera\/([\d\.]+)/))!=null) {
 if (ver[1]>9.1) {
 return null;
 }
 }
 //Mozillas. 
 if (navigator.product && navigator.product=='Gecko') {
 var rv = navigator.userAgent.toLowerCase().match(/rv:\s*([\d\.]+)/);
 if (rv!=null) {
 rv = rv[1].split('.');
 if (rv.length<3) { rv[2] = 0;}
 if (rv.length<2) { rv[1] = 0;}
 }
 if (rv!=null && 10000*rv[0]+100*rv[1]+1*rv[2]>=10800) return null;
 else return 1;
 }
 //IE 
 else return 1;
}

function less(x,y) { return x < y } // used for scripts in XML files
 // since IE does not handle CDATA well

function translateandeval(src) { //modify user input to JavaScript syntax
 // replace plot(f(x),...) with plot("f(x)",...) 
 src = src.replace(/plot\(\x20*([^\"f\[][^\n\r;]+?)\,/g,"plot\(\"$1\",");
 src = src.replace(/plot\(\x20*([^\"f\[][^\n\r;]+)\)/g,"plot(\"$1\")");

 // replace (expr,expr) by [expr,expr] where expr has no (,) in it
 src = src.replace(/([=(,]\x20*)\(([-a-z0-9./+*]+?),([-a-z0-9./+*]+?)\)/g,"$1[$2,$3]");

 // insert * between digit and letter e.g. 2x --> 2*x
 src = src.replace(/([0-9])([a-zA-Z])/g,"$1*$2");
 src = src.replace(/\)([\(0-9a-zA-Z])/g,"\)*$1");
 try {
 with (Math) eval(src); // here the svgpicture object is created
 } catch(err) {alert(err+"\n"+src)}
}

function mousemove_listener(evt) {
 if (svgpicture.getAttribute("xbase")!=null)
 pointerpos.cx.baseVal.value = evt.clientX-svgpicture.getAttribute("xbase");
 if (svgpicture.getAttribute("ybase")!=null)
 pointerpos.cy.baseVal.value = evt.clientY-svgpicture.getAttribute("ybase");
}


function top_listener(evt) {
 svgpicture.setAttribute("ybase",evt.clientY);
}


function bottom_listener(evt) { 
 svgpicture.setAttribute("ybase",evt.clientY-height+1);
}


function left_listener(evt) {
 svgpicture.setAttribute("xbase",evt.clientX);
}


function right_listener(evt) {
 svgpicture.setAttribute("xbase",evt.clientX-width+1);
}

function showHideCode(obj) {
 var node = obj.nextSibling;
 while (node != null && node.nodeName != "BUTTON" && 

 node.nodeName != "button") node = node.nextSibling;
 if (node.style.display == "none") node.style.display = "";
 else node.style.display = "none";
 while (node != null && node.nodeName != "TEXTAREA" && 
 node.nodeName != "textarea") node = node.previousSibling;
 if (node.style.display == "none") node.style.display = "";
 else node.style.display = "none";
// updatePicture(node.getAttribute("id"));
}


function hideCode() { //do nothing
}

function nobutton() { //do nothing
}


function textabs(p,st,pos,angle,id,fontsty) {
 if (angle==null) {
 angle = 0;
 } else {
 angle = (360 - angle)%360;
 }
 var textanchor = "middle";
 var dx=0; var dy=0;
 if (angle==270) {
 var dy = 0; var dx = fontsize/3;
 if (pos!=null) {
 if (pos.match(/left/)) {dx = -fontsize/2;}
 if (pos.match(/right/)) {dx = fontsize-0;}
 if (pos.match(/above/)) {
 textanchor = "start";
 dy = -fontsize/2;
 }
 if (pos.match(/below/)) {
 textanchor = "end";
 dy = fontsize/2;
 }
 }
 } 
 if (angle==90) {
 var dy = 0; var dx = -fontsize/3;
 if (pos!=null) {
 if (pos.match(/left/)) dx = -fontsize-0;
 if (pos.match(/right/)) dx = fontsize/2;
 if (pos.match(/above/)) {
 textanchor = "end";
 dy = -fontsize/2;
 }
 if (pos.match(/below/)) {
 textanchor = "start";
 dy = fontsize/2;
 }
 }
 }
 if (angle==0) {
 var dx = 0; var dy = fontsize/3;
 if (pos!=null) {
 if (pos.match(/above/)) { dy = -fontsize/2; }
 if (pos.match(/below/)) { dy = fontsize-0; }
 if (pos.match(/right/)) {
 textanchor = "start";
 dx = fontsize/2;
 }
 if (pos.match(/left/)) {
 textanchor = "end";
 dx = -fontsize/2;
 }
 }
 }
 
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("text");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 node.appendChild(doc.createTextNode(st));
 }
 node.lastChild.nodeValue = st;
 node.setAttribute("x",p[0]+dx);
 node.setAttribute("y",height-p[1]+dy);
 if (angle != 0) {
 node.setAttribute("transform","rotate("+angle+" "+(p[0]+dx)+" "+(height-p[1]+dy)+")");
 }
 node.setAttribute("font-style",(fontsty!=null?fontsty:fontstyle));
 node.setAttribute("font-family",fontfamily);
 node.setAttribute("font-size",fontsize);
 node.setAttribute("font-weight",fontweight);
 node.setAttribute("text-anchor",textanchor);
 if (fontstroke!="none") node.setAttribute("stroke",fontstroke);
 if (fontfill!="none") node.setAttribute("fill",fontfill);
 node.setAttribute("stroke-width","0px");
 return p;
}

function safepow(base,power) {
 if (base<0 && Math.floor(power)!=power) {
 for (var j=3; j<50; j+=2) {
 if (Math.abs(Math.round(j*power)-(j*power))<.000001) {
 if (Math.round(j*power)%2==0) {
 return Math.pow(Math.abs(base),power);
 } else {
 return -1*Math.pow(Math.abs(base),power);
 }
 }
 }
 return sqrt(-1);
 } else {
 return Math.pow(base,power);
 }
}

function nthroot(n,base) {
 return safepow(base,1/n);
}
function nthlogten(n,v) {
 return ((Math.log(v))/(Math.log(n)));
}
function matchtolower(match) {
 return match.toLowerCase();
}


//ShortScript format:
//xmin,xmax,ymin,ymax,xscl,yscl,labels,xgscl,ygscl,width,height plotcommands(see blow)
//plotcommands: type,eq1,eq2,startmaker,endmarker,xmin,xmax,color,strokewidth,strokedash
function parseShortScript(sscript,gw,gh) {
 if (sscript) { 
 var sa= sscript.split(",");
 
 if (gw && gh) {
 sa[9] = gw;
 sa[10] = gh;
 sscript = sa.join(",");
 picture.setAttribute("sscr", sscript);
 }
 picture.setAttribute("width", sa[9]);
 picture.setAttribute("height", sa[10]);
 picture.style.width = sa[9] + "px";
 picture.style.height = sa[10] + "px";
 
 if (sa.length > 10) {
 commands = 'setBorder(5);';
 commands += 'width=' +sa[9] + '; height=' +sa[10] + ';';
 commands += 'initPicture(' + sa[0] +','+ sa[1] +','+ sa[2] +','+ sa[3] + ');';
 commands += 'axes(' + sa[4] +','+ sa[5] +','+ sa[6] +','+ sa[7] +','+ sa[8]+ ');';
 
 var inx = 11;
 var eqnlist = 'Graphs: ';
 
 while (sa.length > inx+9) {
 commands += 'stroke="' + sa[inx+7] + '";';
 commands += 'strokewidth="' + sa[inx+8] + '";'
 //commands += 'strokedasharray="' + sa[inx+9] + '";' 
 if (sa[inx+9] != "") {
 commands += 'strokedasharray="' + sa[inx+9].replace(/\s+/g,',') + '";';
 }
 if (sa[inx]=="slope") {
 eqnlist += "dy/dx="+sa[inx+1] + "; ";
 commands += 'slopefield("' + sa[inx+1] + '",' + sa[inx+2] + ',' + sa[inx+2] + ');'; 
 } else {
 if (sa[inx]=="func") {
 eqnlist += "y="+sa[inx+1] + "; ";
 eqn = '"' + sa[inx+1] + '"';
 } else if (sa[inx] == "polar") {
 eqnlist += "r="+sa[inx+1] + "; ";
 eqn = '["cos(t)*(' + sa[inx+1] + ')","sin(t)*(' + sa[inx+1] + ')"]';
 } else if (sa[inx] == "param") {
 eqnlist += "[x,y]=["+sa[inx+1] + "," + sa[inx+2] + "]; ";
 eqn = '["' + sa[inx+1] + '","'+ sa[inx+2] + '"]';
 }
 
 
 if (typeof eval(sa[inx+5]) == "number") {
 // if ((sa[inx+5]!='null')&&(sa[inx+5].length>0)) {
 //commands += 'myplot(' + eqn +',"' + sa[inx+3] + '","' + sa[inx+4]+'",' + sa[inx+5] + ',' + sa[inx+6] +');';
 commands += 'plot(' + eqn +',' + sa[inx+5] + ',' + sa[inx+6] +',null,null,' + sa[inx+3] + ',' + sa[inx+4] +');';
 
 } else {
 commands += 'plot(' + eqn +',null,null,null,null,' + sa[inx+3] + ',' + sa[inx+4]+');';
 }
 }
 inx += 10;
 }
 
 try {
 eval(commands);
 } catch (e) {}
 
 picture.setAttribute("alt",eqnlist);
 //picture.setAttribute("width", sa[9]);
 //picture.setAttribute("height", sa[9]);
 
 return commands;
 }
 }
 else {
 initialized = false;
 sscript = picture.sscr;
 }
}




function drawPics() {
 var index, nd;
 var AMbody = document.getElementsByTagName("body")[0];
 pictures = getElementsByClass(AMbody,"embed","ASplugin");
// pictures = document.getElementsByTagName("embed");
 var len = pictures.length;
 
 
 //for (index = 0; index < len; index++) {
 // picture = (isIE ? pictures[index] : pictures[0]);
 for (index = len-1; index >=0; index--) {
 picture = pictures[index];
 
 if ((!ASnoSVG) && (!isIE)) {
 initialized = false;
 var sscr = picture.getAttribute("sscr");
 if ((sscr != null) && (sscr != "")) { //sscr from editor
 try {
 parseShortScript(sscr);
 } catch (e) {}
 } else {
 src = picture.getAttribute("script"); //script from showplot
 if ((src!=null) && (src != "")) {
 try {
 with (Math) eval(src);
 } catch(err) {alert(err+"\n"+src)}
 }
 }
 } else {
 if (picture.getAttribute("sscr")!='') {
 n = document.createElement('img');
 n.setAttribute("style",picture.getAttribute("style"));
 n.setAttribute("src",AScgiloc+'?sscr='+encodeURIComponent(picture.getAttribute("sscr")));
 pn = picture.parentNode;
 pn.replaceChild(n,picture);
 }
 
 }
 
 }
}

function fixedFromCharCode (codePt) {
 if (codePt > 0xFFFF) {
 codePt -= 0x10000;
 return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 +
(codePt & 0x3FF));
 }
 else {
 return String.fromCharCode(codePt);
 }

}

// Add a stylesheet, replacing any previous custom stylesheet (adapted from TW)

function setStylesheet(s) {
 var id = "ASAMMLcustomStyleSheet";
 var n = document.getElementById(id);
 if(document.createStyleSheet) {
 // Test for IE's non-standard createStyleSheet method
 if(n)
 n.parentNode.removeChild(n);
 // This failed without the &nbsp;
 document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeEnd","&nbsp;<style id='" + id + "'>" + s + "</style>");
 } else {
 if(n) {
 n.replaceChild(document.createTextNode(s),n.firstChild);
 } else {
 n = document.createElement("style");
 n.type = "text/css";
 n.id = id;
 n.appendChild(document.createTextNode(s));
 document.getElementsByTagName("head")[0].appendChild(n);
 }
 }
}

setStylesheet("#ASAMMLcloseDiv \{font-size:0.8em; padding-top:1em; color:#014\}\n#ASAMMLwarningBox \{position:absolute; width:100%; top:0; left:0; z-index:200; text-align:center; font-size:1em; font-weight:bold; padding:0.5em 0 0.5em 0; color:#ffc; background:#c30\}");

function init(){
 var msg, warnings = new Array();
 if (document.getElementById==null){
 alert("This webpage requires a recent browser such as Firefox");
 return null;
 }
 initSymbols();
 return true;
}

function hideWarning(){
 var body = document.getElementsByTagName("body")[0];
 body.removeChild(document.getElementById('ASAMMLwarningBox'));
 body.onclick = null;
}

function displayWarnings(warnings) {
 var i, frag, nd = createElementXHTML("div");
 var body = document.getElementsByTagName("body")[0];
 body.onclick=hideWarning;
 nd.id = 'ASAMMLwarningBox';
 for (i=0; i<warnings.length; i++) {
 frag = createElementXHTML("div");
 frag.appendChild(document.createTextNode(warnings[i]));
 frag.style.paddingBottom = "1.0em";
 nd.appendChild(frag);
 }
 nd.appendChild(createElementXHTML("p"));
 nd.appendChild(document.createTextNode("For instructions see the "));
 var an = createElementXHTML("a");
 an.appendChild(document.createTextNode("ASCIIMathML"));
 an.setAttribute("href","http://www.chapman.edu/~jipsen/asciimath.html");
 nd.appendChild(an);
 nd.appendChild(document.createTextNode(" homepage"));
 an = createElementXHTML("div");
 an.id = 'ASAMMLcloseDiv';
 an.appendChild(document.createTextNode('(click anywhere to close this warning)'));
 nd.appendChild(an);
 var body = document.getElementsByTagName("body")[0];
 body.insertBefore(nd,body.childNodes[0]);
}

function translate(spanclassASAM) {
 if (!translated) { // run this only once
 translated = true;
 var body = document.getElementsByTagName("body")[0];
 var processN = document.getElementById(ASAMdocumentId);
 if (translateLaTeX) ASLMprocessNode((processN!=null?processN:body));
 if (translateASCIIMath) ASAMprocessNode((processN!=null?processN:body), false, spanclassASAM);
 }
}

function createElementXHTML(t) {
  if (isIE) return document.createElement(t);
  else return document.createElementNS("http://www.w3.org/1999/xhtml",t);
}

function createMmlNode(t,frag) {
 var node = document.createElementNS("http://www.w3.org/1998/Math/MathML",t);
 if (frag) node.appendChild(frag);
 return node;
}

if (isIE) {
var ASAMcal = [0xEF35,0x212C,0xEF36,0xEF37,0x2130,0x2131,0xEF38,0x210B,0x2110,0xEF39,0xEF3A,0x2112,0x2133,0xEF3B,0xEF3C,0xEF3D,0xEF3E,0x211B,0xEF3F,0xEF40,0xEF41,0xEF42,0xEF43,0xEF44,0xEF45,0xEF46];
var ASAMfrk = [0xEF5D,0xEF5E,0x212D,0xEF5F,0xEF60,0xEF61,0xEF62,0x210C,0x2111,0xEF63,0xEF64,0xEF65,0xEF66,0xEF67,0xEF68,0xEF69,0xEF6A,0x211C,0xEF6B,0xEF6C,0xEF6D,0xEF6E,0xEF6F,0xEF70,0xEF71,0x2128];
var ASAMbbb = [0xEF8C,0xEF8D,0x2102,0xEF8E,0xEF8F,0xEF90,0xEF91,0x210D,0xEF92,0xEF93,0xEF94,0xEF95,0xEF96,0x2115,0xEF97,0x2119,0x211A,0x211D,0xEF98,0xEF99,0xEF9A,0xEF9B,0xEF9C,0xEF9D,0xEF9E,0x2124];
} else {
var ASAMcal = [0x1D49C,0x212C,0x1D49E,0x1D49F,0x2130,0x2131,0x1D4A2,0x210B,0x2110,0x1D4A5,0x1D4A6,0x2112,0x2133,0x1D4A9,0x1D4AA,0x1D4AB,0x1D4AC,0x211B,0x1D4AE,0x1D4AF,0x1D4B0,0x1D4B1,0x1D4B2,0x1D4B3,0x1D4B4,0x1D4B5];
var ASAMfrk = [0x1D504,0x1D505,0x212D,0x1D507,0x1D508,0x1D509,0x1D50A,0x210C,0x2111,0x1D50D,0x1D50E,0x1D50F,0x1D510,0x1D511,0x1D512,0x1D513,0x1D514,0x211C,0x1D516,0x1D517,0x1D518,0x1D519,0x1D51A,0x1D51B,0x1D51C,0x2128];
var ASAMbbb = [0x1D538,0x1D539,0x2102,0x1D53B,0x1D53C,0x1D53D,0x1D53E,0x210D,0x1D540,0x1D541,0x1D542,0x1D543,0x1D544,0x2115,0x1D546,0x2119,0x211A,0x211D,0x1D54A,0x1D54B,0x1D54C,0x1D54D,0x1D54E,0x1D54F,0x1D550,0x2124];
}





function compareNames(s1,s2) {
 if (s1.input > s2.input) return 1
 else return -1;
}

var ASAMnames = []; //list of input symbols

function initSymbols() {
 var texsymbols = [], i;
 for (i=0; i<ASAMsymbols.length; i++)
 if (ASAMsymbols[i].tex && !(typeof ASAMsymbols[i].notexcopy == "boolean" && ASAMsymbols[i].notexcopy)) 
 texsymbols[texsymbols.length] = {input:ASAMsymbols[i].tex, 
 tag:ASAMsymbols[i].tag, output:ASAMsymbols[i].output, ttype:ASAMsymbols[i].ttype};
 ASAMsymbols = ASAMsymbols.concat(texsymbols);
 refreshSymbols();
}

function refreshSymbols(){
 var i;
 ASAMsymbols.sort(compareNames);
 for (i=0; i<ASAMsymbols.length; i++) ASAMnames[i] = ASAMsymbols[i].input;
 ASLMsymbols.sort(compareNames);
 for (i=0; i<ASLMsymbols.length; i++) ASLMnames[i] = ASLMsymbols[i].input;
}

function define(oldstr,newstr) {
 if(oldstr.substr(0,1)=="\\")
 ASLMsymbols = ASLMsymbols.concat([{input:oldstr, tag:"mo", output:newstr,
 ttype:DEFINITION}]);
 else
 ASAMsymbols = ASAMsymbols.concat([{input:oldstr, tag:"mo", output:newstr, 
 tex:null, ttype:DEFINITION}]);
 refreshSymbols(); // this may be a problem if many symbols are defined!
}

function ASAMremoveCharsAndBlanks(str,n) {
//remove n characters and any following blanks
 var st;
 if (str.charAt(n)=="\\" && str.charAt(n+1)!="\\" && str.charAt(n+1)!=" ") 
 st = str.slice(n+1);
 else st = str.slice(n);
 for (var i=0; i<st.length && st.charCodeAt(i)<=32; i=i+1);
 return st.slice(i);
}

function position(arr, str, n) { 
// return position >=n where str appears or would be inserted
// assumes arr is sorted
 if (n==0) {
 var h,m;
 n = -1;
 h = arr.length;
 while (n+1<h) {
 m = (n+h) >> 1;
 if (arr[m]<str) n = m; else h = m;
 }
 return h;
 } else
 for (var i=n; i<arr.length && arr[i]<str; i++);
 return i; // i=arr.length || arr[i]>=str
}

function ASAMgetSymbol(str) {
//return maximal initial substring of str that appears in names
//return null if there is none
 var k = 0; //new pos
 var j = 0; //old pos
 var mk; //match pos
 var st;
 var tagst;
 var match = "";
 var more = true;
 for (var i=1; i<=str.length && more; i++) {
 st = str.slice(0,i); //initial substring of length i
 j = k;
 k = position(ASAMnames, st, j);
 if (k<ASAMnames.length && str.slice(0,ASAMnames[k].length)==ASAMnames[k]){
 match = ASAMnames[k];
 mk = k;
 i = match.length;
 }
 more = k<ASAMnames.length && str.slice(0,ASAMnames[k].length)>=ASAMnames[k];
 }
 ASAMpreviousSymbol=ASAMcurrentSymbol;
 if (match!=""){
 ASAMcurrentSymbol=ASAMsymbols[mk].ttype;
 return ASAMsymbols[mk]; 
 }
// if str[0] is a digit or - return maxsubstring of digits.digits
 ASAMcurrentSymbol=CONST;
 k = 1;
 st = str.slice(0,1);
 var integ = true;
 while ("0"<=st && st<="9" && k<=str.length) {
 st = str.slice(k,k+1);
 k++;
 }
 if (st == decimalsign) {
 st = str.slice(k,k+1);
 if ("0"<=st && st<="9") {
 integ = false;
 k++;
 while ("0"<=st && st<="9" && k<=str.length) {
 st = str.slice(k,k+1);
 k++;
 }
 }
 }
 if ((integ && k>1) || k>2) {
 st = str.slice(0,k-1);
 tagst = "mn";
 } else {
 k = 2;
 st = str.slice(0,1); //take 1 character
 tagst = (("A">st || st>"Z") && ("a">st || st>"z")?"mo":"mi");
 }
 if (st=="-" && ASAMpreviousSymbol==INFIX) {
 ASAMcurrentSymbol = INFIX; //trick "/" into recognizing "-" on second parse
 return {input:st, tag:tagst, output:st, ttype:UNARY, func:true, val:true};
 }
 return {input:st, tag:tagst, output:st, ttype:CONST, val:true};
}

function ASAMremoveBrackets(node) {
 var st;
 if (node.nodeName=="mrow") {
 st = node.firstChild.firstChild.nodeValue;
 if (st=="(" || st=="[" || st=="{") node.removeChild(node.firstChild);
 }
 if (node.nodeName=="mrow") {
 st = node.lastChild.firstChild.nodeValue;
 if (st==")" || st=="]" || st=="}") node.removeChild(node.lastChild);
 }
}

//TeX conversion version
function ASAMTremoveBrackets(node) {
 
 var st;
 if (node.charAt(0)=='{' && node.charAt(node.length-1)=='}') {

 st = node.charAt(1);
 if (st=="(" || st=="[") node = '{'+node.substr(2);
 st = node.substr(1,6);
 if (st=="\\left(" || st=="\\left[" || st=="\\left{") node = '{'+node.substr(7);
 st = node.substr(1,12);
 if (st=="\\left\\lbrace" || st=="\\left\\langle") node = '{'+node.substr(13);
 st = node.charAt(node.length-2);
 if (st==")" || st=="]") node = node.substr(0,node.length-8)+'}';
 st = node.substr(node.length-8,7)
 if (st=="\\rbrace" || st=="\\rangle") node = node.substr(0,node.length-14) + '}';
 
 } 
 return node;
}

/*Parsing ASCII math expressions with the following grammar
v ::= [A-Za-z] | greek letters | numbers | other constant symbols
u ::= sqrt | text | bb | other unary symbols for font commands
b ::= frac | root | stackrel binary symbols
l ::= ( | [ | { | (: | {: left brackets
r ::= ) | ] | } | :) | :} right brackets
S ::= v | lEr | uS | bSS Simple expression
I ::= S_S | S^S | S_S^S | S Intermediate expression
E ::= IE | I/I Expression
Each terminal symbol is translated into a corresponding mathml node.*/

var ASAMnestingDepth,ASAMpreviousSymbol,ASAMcurrentSymbol;


function ASAMTgetTeXsymbol(symb) {
 if (typeof symb.val == "boolean" && symb.val) {
 pre = '';
 } else {
 pre = '\\';
 }
 if (symb.tex==null) {
 return (pre+symb.input);
 } else {
 return (pre+symb.tex);
 }
}
function ASAMTgetTeXbracket(symb) {
 if (symb.tex==null) {
 return (symb.input);
 } else {
 return ('\\'+symb.tex);
 }
}

function ASAMTparseSexpr(str) { //parses str and returns [node,tailstr]
 var symbol, node, result, i, st,// rightvert = false,
 newFrag = '';
 str = ASAMremoveCharsAndBlanks(str,0);
 symbol = ASAMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET && ASAMnestingDepth > 0) {
 return [null,str];
 }
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 symbol = ASAMgetSymbol(str);
 }
 switch (symbol.ttype) {
 case UNDEROVER:
 case CONST:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 var texsymbol = ASAMTgetTeXsymbol(symbol);
 if (texsymbol.charAt(0)=="\\" || symbol.tag=="mo") return [texsymbol,str];
 else return ['{'+texsymbol+'}',str];
 
 case LEFTBRACKET: //read (expr+)
 ASAMnestingDepth++;
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 
 result = ASAMTparseExpr(str,true);
 ASAMnestingDepth--;
 if (typeof symbol.invisible == "boolean" && symbol.invisible) 
 node = '{\\left.'+result[0]+'}';
 else {
 node = '{\\left'+ASAMTgetTeXbracket(symbol) + result[0]+'}';
 }
 return [node,result[1]];
 case TEXT:
 if (symbol!=ASAMquote) str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else if (str.charAt(0)=="(") i=str.indexOf(")");
 else if (str.charAt(0)=="[") i=str.indexOf("]");
 else if (symbol==ASAMquote) i=str.slice(1).indexOf("\"")+1;
 else i = 0;
 if (i==-1) i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 newFrag = '\\ ';
 }
 newFrag += '\\text{'+st+'}';
 if (st.charAt(st.length-1) == " ") {
 newFrag += '\\ ';
 }
 str = ASAMremoveCharsAndBlanks(str,i+1);
 return [newFrag,str];
 case UNARY:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMTparseSexpr(str);
 if (result[0]==null) return ['{'+ASAMTgetTeXsymbol(symbol)+'}',str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
 if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 return ['{'+ASAMTgetTeXsymbol(symbol)+'}',str];
 } else {
 node = '{'+ASAMTgetTeXsymbol(symbol)+'{'+result[0]+'}}';
 return [node,result[1]];
 }
 }
 result[0] = ASAMTremoveBrackets(result[0]);
 if (symbol.input == "sqrt") { // sqrt
 return ['\\sqrt{'+result[0]+'}',result[1]];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 return ['{'+ASAMTgetTeXsymbol(symbol)+'{'+result[0]+'}}',result[1]];
 } else { // font change command 
 return ['{'+ASAMTgetTeXsymbol(symbol)+'{'+result[0]+'}}',result[1]];
 }
 case BINARY:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMTparseSexpr(str);
 if (result[0]==null) return ['{'+ASAMTgetTeXsymbol(symbol)+'}',str];
 result[0] = ASAMTremoveBrackets(result[0]);
 var result2 = ASAMTparseSexpr(result[1]);
 if (result2[0]==null) return ['{'+ASAMTgetTeXsymbol(symbol)+'}',str];
 result2[0] = ASAMTremoveBrackets(result2[0]);
 if (symbol.input=="density") {
 newFrag = '{\\density{'+result[0]+'}{'+result2[0]+'}}';
 newFrag = newFrag.replace(/{{{/g,"{");
 newFrag = newFrag.replace(/}}}/g,"}");
 }
 if (symbol.input=="root") {
 newFrag = '{\\sqrt['+result[0]+']{'+result2[0]+'}}';
 }
 if (symbol.input=="stackrel") {
 newFrag = '{'+ASAMTgetTeXsymbol(symbol)+'{'+result[0]+'}{'+result2[0]+'}}';
 }
 if (symbol.input=="frac") {
 newFrag = '{\\frac{'+result[0]+'}{'+result2[0]+'}}';
 }
 return [newFrag,result2[1]];
 case INFIX:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 return [symbol.output,str];
 case SPACE:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 return ['{\\quad\\text{'+symbol.input+'}\\quad}',str];
 case LEFTRIGHT:
// if (rightvert) return [null,str]; else rightvert = true;
 ASAMnestingDepth++;
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMTparseExpr(str,false);
 ASAMnestingDepth--;
 var st = "";
 st = result[0].charAt(result[0].length -1);
//alert(result[0].lastChild+"***"+st);
 if (st == "|") { // its an absolute value subterm
 node = '{\\left|'+result[0]+'}';
 return [node,result[1]];
 } else { // the "|" is a \mid
 node = '{\\mid}';
 return [node,str];
 }
 
 default:
//alert("default");
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 return ['{'+ASAMTgetTeXsymbol(symbol)+'}',str];
 }
}

function ASAMTparseIexpr(str) {
 var symbol, sym1, sym2, node, result, underover;
 str = ASAMremoveCharsAndBlanks(str,0);
 sym1 = ASAMgetSymbol(str);
 result = ASAMTparseSexpr(str);
 node = result[0];
 str = result[1];
 symbol = ASAMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input != "/") {
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 // if (symbol.input == "/") result = ASAMTparseIexpr(str); else 
 result = ASAMTparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = '{}';
 else result[0] = ASAMTremoveBrackets(result[0]);
 str = result[1];
// if (symbol.input == "/") ASAMTremoveBrackets(node);
 if (symbol.input == "_") {
 sym2 = ASAMgetSymbol(str);
 underover = (sym1.ttype == UNDEROVER);
 if (sym2.input == "^") {
 str = ASAMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = ASAMTparseSexpr(str);
 res2[0] = ASAMTremoveBrackets(res2[0]);
 str = res2[1];
 node = '{' + node;
 node += '_{'+result[0]+'}';
 node += '^{'+res2[0]+'}';
 node += '}';
 } else {
 node += '_{'+result[0]+'}';
 }
 } else { //must be ^
 node = '{'+node+'}^{'+result[0]+'}';
 }
 } 
 
 return [node,str];
}

function ASAMTparseExpr(str,rightbracket) {
 var symbol, node, result, i, nodeList = [],
 newFrag = '';
 var addedright = false;
 do {
 str = ASAMremoveCharsAndBlanks(str,0);
 result = ASAMTparseIexpr(str);
 node = result[0];
 str = result[1];
 symbol = ASAMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input == "/") {
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 result = ASAMTparseIexpr(str);
 
 if (result[0] == null) // show box in place of missing argument
 result[0] = '{}';
 else result[0] = ASAMTremoveBrackets(result[0]);
 str = result[1];
 node = ASAMTremoveBrackets(node);
 node = '\\frac' + '{'+ node + '}';
 node += '{'+result[0]+'}';
 newFrag += node;
 symbol = ASAMgetSymbol(str);
 } else if (node!=undefined) newFrag += node;
 } while ((symbol.ttype != RIGHTBRACKET && 
 (symbol.ttype != LEFTRIGHT || rightbracket)
 || ASAMnestingDepth == 0) && symbol!=null && symbol.output!="");
 if (symbol.ttype == RIGHTBRACKET || symbol.ttype == LEFTRIGHT) {
// if (ASAMnestingDepth > 0) ASAMnestingDepth--;
 var len = newFrag.length;
 if (len>2 && newFrag.charAt(0)=='{' && newFrag.indexOf(',')>0) { //could be matrix (total rewrite from .js)
 var right = newFrag.charAt(len - 2);
 if (right==')' || right==']') {
 var left = newFrag.charAt(6);
 if ((left=='(' && right==')' && symbol.output != '}') || (left=='[' && right==']')) {
 var mxout = '\\begin{array}{cc}{';
 var pos = new Array(); //position of commas
 pos.push(0);
 var matrix = true;
 var mxnestingd = 0;
 for (i=1; i<len-1; i++) {
 if (newFrag.charAt(i)==left) mxnestingd++;
 if (newFrag.charAt(i)==right) {
 mxnestingd--;
 if (mxnestingd==0 && newFrag.charAt(i+2)==',' && newFrag.charAt(i+3)=='{') pos.push(i+2);
 }
 }
 pos.push(len);
 var lastmxsubcnt = -1;
 if (mxnestingd==0 && pos.length>0) {
 for (i=0;i<pos.length-1;i++) {
 if (i>0) mxout += '\\\\';
 if (i==0) {
 var subarr = newFrag.substr(pos[i]+7,pos[i+1]-pos[i]-15).split(',');
 } else {
 var subarr = newFrag.substr(pos[i]+8,pos[i+1]-pos[i]-16).split(',');
 }
 if (lastmxsubcnt>0 && subarr.length!=lastmxsubcnt) {
 matrix = false;
 } else if (lastmxsubcnt==-1) {
 lastmxsubcnt=subarr.length;
 }
 mxout += subarr.join('&');
 }
 }
 mxout += '\\end{array}}';
 if (matrix) { newFrag = mxout;}
 }
 }
 }
 
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = '\\right'+ASAMTgetTeXbracket(symbol); //ASAMcreateMmlNode("mo",document.createTextNode(symbol.output));
 newFrag += node;
 addedright = true;
 } else {
 newFrag += '\\right.';
 addedright = true;
 }
 
 }
 if(ASAMnestingDepth>0 && !addedright) {
 newFrag += '\\right.'; //adjust for non-matching left brackets
 //todo: adjust for non-matching right brackets
 }
 
 return [newFrag,str];
}

function ASAMTparseASAMtoTeX(str) {
 //DLMOD to remove &nbsp;, which editor adds on multiple spaces
 ASAMnestingDepth = 0;
 str = str.replace(/&nbsp;/g,"");
 str = str.replace(/&gt;/g,">");
 str = str.replace(/&lt;/g,"<");
 return ASAMTparseExpr(str.replace(/^\s+/g,""),false)[0];
}

function ASAMTparseMath(str,istex) {
 if (istex) { 
 var texstring = str;
 } else {
 var texstring = ASAMTparseASAMtoTeX(str);
 }
 //alert(texstring);
 if (mathcolor!="") {
 texstring = "\\"+mathcolor + texstring;
 }
 if (displaystyle) {
 texstring = "\\displaystyle" + texstring;
 } else {
 texstring = "\\textstyle" + texstring;
 }
 var node = createElementXHTML("img");
 if (typeof encodeURIComponent == "function") {
 texstring = encodeURIComponent(texstring);
 } else {
 texstring = escape(texstring);
 }
 node.src = AMTcgiloc + texstring;
 node.style.verticalAlign = "middle";
 if (showasciiformulaonhover) //fixed by djhsu so newline
 node.setAttribute("title",str.replace(/\s+/g," "));//does not show in Gecko
 
 return node;
}

function ASAMparseSexpr(str) { //parses str and returns [node,tailstr]
 var symbol, node, result, i, st,// rightvert = false,
 newFrag = document.createDocumentFragment();
 str = ASAMremoveCharsAndBlanks(str,0);
 symbol = ASAMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET && ASAMnestingDepth > 0) {
 return [null,str];
 }
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 symbol = ASAMgetSymbol(str);
 }
 switch (symbol.ttype) { case UNDEROVER:
 case CONST:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str];
 case LEFTBRACKET: //read (expr+)
 ASAMnestingDepth++;
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMparseExpr(str,true);
 ASAMnestingDepth--;
 if (typeof symbol.invisible == "boolean" && symbol.invisible) 
 node = createMmlNode("mrow",result[0]);
 else {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 }
 return [node,result[1]];
 case TEXT:
 if (symbol!=ASAMquote) str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else if (str.charAt(0)=="(") i=str.indexOf(")");
 else if (str.charAt(0)=="[") i=str.indexOf("]");
 else if (symbol==ASAMquote) i=str.slice(1).indexOf("\"")+1;
 else i = 0;
 if (i==-1) i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 }
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(st)));
 if (st.charAt(st.length-1) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 }
 str = ASAMremoveCharsAndBlanks(str,i+1);
 return [createMmlNode("mrow",newFrag),str];
 case UNARY:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMparseSexpr(str);
 if (result[0]==null) return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
 if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str];
 } else {
 node = createMmlNode("mrow",
 createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node.appendChild(result[0]);
 return [node,result[1]];
 }
 }
 ASAMremoveBrackets(result[0]);
 if (symbol.input == "sqrt") { // sqrt
 return [createMmlNode(symbol.tag,result[0]),result[1]];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 node = createMmlNode(symbol.tag,result[0]);
 node.appendChild(createMmlNode("mo",document.createTextNode(symbol.output)));
 return [node,result[1]];
 } else { // font change command
 if (!isIE && typeof symbol.codes != "undefined") {
 for (i=0; i<result[0].childNodes.length; i++)
 if (result[0].childNodes[i].nodeName=="mi" || result[0].nodeName=="mi") {
 st = (result[0].nodeName=="mi"?result[0].firstChild.nodeValue:
 result[0].childNodes[i].firstChild.nodeValue);
 var newst = [];
 for (var j=0; j<st.length; j++)
 if (st.charCodeAt(j)>64 && st.charCodeAt(j)<91) {newst = newst + fixedFromCharCode(symbol.codes[st.charCodeAt(j)-65]);} else newst = newst + st.charAt(j);
 if (result[0].nodeName=="mi")
 result[0]=createMmlNode("mo").
 appendChild(document.createTextNode(newst));
 else result[0].replaceChild(createMmlNode("mo").
 appendChild(document.createTextNode(newst)),
 result[0].childNodes[i]);
 }
 }
 node = createMmlNode(symbol.tag,result[0]);
 node.setAttribute(symbol.atname,symbol.atval);
 return [node,result[1]];
 }
 case BINARY:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMparseSexpr(str);
 if (result[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str];
 ASAMremoveBrackets(result[0]);
 var result2 = ASAMparseSexpr(result[1]);
 if (result2[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str];
 ASAMremoveBrackets(result2[0]);
 if (symbol.input=="density") { 
 var tclrf = str.match(/\{\s*([#\w]+)\s*\}/); //get's size from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclrf!=null) {
 if(tclrf[1]>1000) {
 tclrf=1000+'%';
 } else {
 tclrf=tclrf[1]+'%';
 }
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclrf);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
 if (symbol.input=="root" || symbol.input=="stackrel") 
 newFrag.appendChild(result2[0]);
 newFrag.appendChild(result[0]);
 if (symbol.input=="frac") newFrag.appendChild(result2[0]);
 return [createMmlNode(symbol.tag,newFrag),result2[1]];
 case INFIX:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode("mo",document.createTextNode(symbol.output)),str];
 case SPACE:
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node = createMmlNode("mspace");
 node.setAttribute("width","1ex");
 newFrag.appendChild(node);
 return [createMmlNode("mrow",newFrag),str];
 case LEFTRIGHT:
// if (rightvert) return [null,str]; else rightvert = true;
 ASAMnestingDepth++;
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 result = ASAMparseExpr(str,false);
 ASAMnestingDepth--;
 var st = "";
 if (result[0].lastChild!=null)
 st = result[0].lastChild.firstChild.nodeValue;
 if (st == "|") { // its an absolute value subterm
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 return [node,result[1]];
 } else { // the "|" is a \mid so use unicode 2223 (divides) for spacing
 node = createMmlNode("mo",document.createTextNode("\u2223"));
 node = createMmlNode("mrow",node);
 return [node,str];
 }
 default:
//alert("default");
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length); 
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str];
 }
}

function ASAMparseIexpr(str) {
 var symbol, sym1, sym2, node, result, underover;
 str = ASAMremoveCharsAndBlanks(str,0);
 sym1 = ASAMgetSymbol(str);
 result = ASAMparseSexpr(str);
 node = result[0];
 str = result[1];
 symbol = ASAMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input != "/") {
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
// if (symbol.input == "/") result = ASAMparseIexpr(str); else ...
 result = ASAMparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 else ASAMremoveBrackets(result[0]);
 str = result[1];
// if (symbol.input == "/") ASAMremoveBrackets(node);
 if (symbol.input == "_") {
 sym2 = ASAMgetSymbol(str);
 underover = (sym1.ttype == UNDEROVER);
 if (sym2.input == "^") {
 str = ASAMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = ASAMparseSexpr(str);
 ASAMremoveBrackets(res2[0]);
 str = res2[1];
 node = createMmlNode((underover?"munderover":"msubsup"),node);
 node.appendChild(result[0]);
 node.appendChild(res2[0]);
 node = createMmlNode("mrow",node); // so sum does not stretch
 } else {
 node = createMmlNode((underover?"munder":"msub"),node);
 node.appendChild(result[0]);
 }
 } else {
 node = createMmlNode(symbol.tag,node);
 node.appendChild(result[0]);
 }
 }
 return [node,str];
}

function ASAMparseExpr(str,rightbracket) {
 var symbol, node, result, i, nodeList = [],
 newFrag = document.createDocumentFragment();
 do {
 str = ASAMremoveCharsAndBlanks(str,0);
 result = ASAMparseIexpr(str);
 node = result[0];
 str = result[1];
 symbol = ASAMgetSymbol(str);
 if (symbol.ttype == INFIX && symbol.input == "/") {
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 result = ASAMparseIexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 else ASAMremoveBrackets(result[0]);
 str = result[1];
 ASAMremoveBrackets(node);
 node = createMmlNode(symbol.tag,node);
 node.appendChild(result[0]);
 newFrag.appendChild(node);
 symbol = ASAMgetSymbol(str);
 } 
 else if (node!=undefined) newFrag.appendChild(node);
 } while ((symbol.ttype != RIGHTBRACKET && 
 (symbol.ttype != LEFTRIGHT || rightbracket)
 || ASAMnestingDepth == 0) && symbol!=null && symbol.output!="");
 if (symbol.ttype == RIGHTBRACKET || symbol.ttype == LEFTRIGHT) {
// if (ASAMnestingDepth > 0) ASAMnestingDepth--;
 var len = newFrag.childNodes.length;
 if (len>0 && newFrag.childNodes[len-1].nodeName == "mrow" && len>1 &&
 newFrag.childNodes[len-2].nodeName == "mo" &&
 newFrag.childNodes[len-2].firstChild.nodeValue == ",") { //matrix
 var right = newFrag.childNodes[len-1].lastChild.firstChild.nodeValue;
 if (right==")" || right=="]") {
 var left = newFrag.childNodes[len-1].firstChild.firstChild.nodeValue;
 if (left=="(" && right==")" && symbol.output != "}" || 
 left=="[" && right=="]") {
 var pos = []; // positions of commas
 var matrix = true;
 var m = newFrag.childNodes.length;
 for (i=0; matrix && i<m; i=i+2) {
 pos[i] = [];
 node = newFrag.childNodes[i];
 if (matrix) matrix = node.nodeName=="mrow" && 
 (i==m-1 || node.nextSibling.nodeName=="mo" && 
 node.nextSibling.firstChild.nodeValue==",")&&
 node.firstChild.firstChild.nodeValue==left &&
 node.lastChild.firstChild.nodeValue==right;
 if (matrix) 
 for (var j=0; j<node.childNodes.length; j++)
 if (node.childNodes[j].firstChild.nodeValue==",")
 pos[i][pos[i].length]=j;
 if (matrix && i>1) matrix = pos[i].length == pos[i-2].length;
 }
 if (matrix) {
 var row, frag, n, k, table = document.createDocumentFragment();
 for (i=0; i<m; i=i+2) {
 row = document.createDocumentFragment();
 frag = document.createDocumentFragment();
 node = newFrag.firstChild; // <mrow>(-,-,...,-,-)</mrow>
 n = node.childNodes.length;
 k = 0;
 node.removeChild(node.firstChild); //remove (
 for (j=1; j<n-1; j++) {
 if (typeof pos[i][k] != "undefined" && j==pos[i][k]){
 node.removeChild(node.firstChild); //remove ,
 row.appendChild(createMmlNode("mtd",frag));
 k++;
 } else frag.appendChild(node.firstChild);
 }
 row.appendChild(createMmlNode("mtd",frag));
 if (newFrag.childNodes.length>2) {
 newFrag.removeChild(newFrag.firstChild); //remove <mrow>)</mrow>
 newFrag.removeChild(newFrag.firstChild); //remove <mo>,</mo>
 }
 table.appendChild(createMmlNode("mtr",row));
 }
 node = createMmlNode("mtable",table);
 if (typeof symbol.invisible == "boolean" && symbol.invisible) node.setAttribute("columnalign","left");
 newFrag.replaceChild(node,newFrag.firstChild);
 }
 }
 }
 }
 str = ASAMremoveCharsAndBlanks(str,symbol.input.length);
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 newFrag.appendChild(node);
 }
 }
 return [newFrag,str];
}

function parseMath(str,latex) {
 var frag, node;
 ASAMnestingDepth = 0;
 frag = latex ? ASLMparseExpr(str.replace(/^\s+/g,""),false,false)[0] : ASAMparseExpr(str.replace(/^\s+/g,""),false)[0];
 node = createMmlNode("mstyle",frag);
 node.setAttribute("mathcolor",mathcolor);
 node.setAttribute("fontfamily",mathfontfamily);
 node.setAttribute("mathsize",mathfontsize);
 if (displaystyle) node.setAttribute("displaystyle","true");
 node = createMmlNode("math",node);
 if (showasciiformulaonhover) //fixed by djhsu so newline
 node.setAttribute("title",str.replace(/\s+/g," "));//does not show in Gecko
 return node;
}

function strarr2docFrag(arr, linebreaks, latex) {
 var newFrag=document.createDocumentFragment();
 var expr = false;
 for (var i=0; i<arr.length; i++) {
 if (expr && isIE) newFrag.appendChild(ASAMTparseMath(arr[i],latex));
 else if (expr && !isIE) newFrag.appendChild(parseMath(arr[i],latex));
 else {
 var arri = (linebreaks ? arr[i].split("\n\n") : [arr[i]]);
 newFrag.appendChild(createElementXHTML("span").
 appendChild(document.createTextNode(arri[0])));
 for (var j=1; j<arri.length; j++) {
 newFrag.appendChild(createElementXHTML("p"));
 newFrag.appendChild(createElementXHTML("span").
 appendChild(document.createTextNode(arri[j])));
 }
 }
 expr = !expr;
 }
 return newFrag;
}

function ASAMautomathrec(str) {
//formula is a space (or start of str) followed by a maximal sequence of *two* or more tokens, possibly separated by runs of digits and/or space.
//tokens are single letters (except a, A, I) and ASCIIMathML tokens
 var texcommand = "\\\\[a-zA-Z]+|\\\\\\s|";
 var ambigASAMtoken = "\\b(?:oo|lim|ln|int|oint|del|grad|aleph|prod|prop|sinh|cosh|tanh|cos|sec|pi|tt|fr|sf|sube|supe|det|mod|gcd|lcm|min|max|vec|ddot|ul|chi|eta|nu|mu)(?![a-z])|";
 var englishASAMtoken = "\\b(?:sum|ox|log|sin|tan|dim|hat|bar|dot)(?![a-z])|";
 var secondenglishASAMtoken = "|\\bI\\b|\\bin\\b|\\btext\\b"; // took if and or not out
 var simpleASAMtoken = "NN|ZZ|QQ|RR|CC|TT|AA|EE|sqrt|dx|dy|dz|dt|xx|vv|uu|nn|bb|cc|csc|cot|alpha|beta|delta|Delta|epsilon|gamma|Gamma|kappa|lambda|Lambda|omega|phi|Phi|Pi|psi|Psi|rho|sigma|Sigma|tau|theta|Theta|xi|Xi|zeta"; // uuu nnn?
 var letter = "[a-zA-HJ-Z](?=(?:[^a-zA-Z]|$|"+ambigASAMtoken+englishASAMtoken+simpleASAMtoken+"))|";
 var token = letter+texcommand+"\\d+|[-()[\\]{}+=*&^_%\\\@/<>,\\|!:;'~]|\\.(?!(?:\x20|$))|"+ambigASAMtoken+englishASAMtoken+simpleASAMtoken;
 var re = new RegExp("(^|\\s)((("+token+")\\s?)(("+token+secondenglishASAMtoken+")\\s?)+)([,.?]?(?=\\s|$))","g");
 str = str.replace(re," `$2`$7");
 var arr = str.split(ASAMdelimiter1);
 var re1 = new RegExp("(^|\\s)([b-zB-HJ-Z+*<>]|"+texcommand+ambigASAMtoken+simpleASAMtoken+")(\\s|\\n|$)","g");
 var re2 = new RegExp("(^|\\s)([a-z]|"+texcommand+ambigASAMtoken+simpleASAMtoken+")([,.])","g"); // removed |\d+ for now
 for (i=0; i<arr.length; i++) //single nonenglish tokens
 if (i%2==0) {
 arr[i] = arr[i].replace(re1," `$2`$3");
 arr[i] = arr[i].replace(re2," `$2`$3");
 arr[i] = arr[i].replace(/([{}[\]])/,"`$1`");
 }
 str = arr.join(ASAMdelimiter1);
 str = str.replace(/((^|\s)\([a-zA-Z]{2,}.*?)\)`/g,"$1`)"); //fix parentheses
 str = str.replace(/`(\((a\s|in\s))(.*?[a-zA-Z]{2,}\))/g,"$1`$3"); //fix parentheses
 str = str.replace(/\sin`/g,"` in");
 str = str.replace(/`(\(\w\)[,.]?(\s|\n|$))/g,"$1`");
 str = str.replace(/`([0-9.]+|e.g|i.e)`(\.?)/gi,"$1$2");
 str = str.replace(/`([0-9.]+:)`/g,"$1");
 return str;
}

function processNodeR(n, linebreaks,latex) {
 var mtch, str, arr, frg, i;
 if (n.childNodes.length == 0) {
 if ((n.nodeType!=8 || linebreaks) &&
 n.parentNode.nodeName!="form" && n.parentNode.nodeName!="FORM" &&
 n.parentNode.nodeName!="textarea" && n.parentNode.nodeName!="TEXTAREA" /*&&
 n.parentNode.nodeName!="pre" && n.parentNode.nodeName!="PRE"*/) {
 str = n.nodeValue;
 if (!(str == null)) {
 str = str.replace(/\r\n\r\n/g,"\n\n");
 str = str.replace(/\x20+/g," ");
 str = str.replace(/\s*\r\n/g," ");
 if(latex) {
// DELIMITERS:
 mtch = (str.indexOf("ALO")==-1 ? false : true);
 str = str.replace(/([^\\])ALO/g,"$1 ALO");
 str = str.replace(/^ALO/," ALO"); // in case ALO at start of string
 arr = str.split(" ALO");
 for (i=0; i<arr.length; i++)
 arr[i]=arr[i].replace(/\\ALO/g,"ALO");
 } else {
 mtch = false;
 str = str.replace(new RegExp(ASAMescape1, "g"),
 function(){mtch = true; return "ASAMescape1"});
 str = str.replace(/\\?end{?a?math}?/i,
 function(){automathrecognize = false; mtch = true; return ""});
 str = str.replace(/amath\b|\\begin{a?math}/i,
 function(){automathrecognize = true; mtch = true; return ""});
 arr = str.split(ASAMdelimiter1);
 if (automathrecognize)
 for (i=0; i<arr.length; i++)
 if (i%2==0) arr[i] = ASAMautomathrec(arr[i]);
 str = arr.join(ASAMdelimiter1);
 arr = str.split(ASAMdelimiter1);
 for (i=0; i<arr.length; i++) // this is a problem ************
 arr[i]=arr[i].replace(/ASAMescape1/g,ASAMdelimiter1);
 }
 if (arr.length>1 || mtch) {
 frg = strarr2docFrag(arr,n.nodeType==8,latex);
 var len = frg.childNodes.length;
 n.parentNode.replaceChild(frg,n);
 return len-1;
 }
 }
 } else return 0;
 } else if (n.nodeName!="math") {
 for (i=0; i<n.childNodes.length; i++)
 i += processNodeR(n.childNodes[i], linebreaks,latex);
 }
 return 0;
}

function ASAMprocessNode(n, linebreaks, spanclassASAM) {
 var frag,st;
 if (spanclassASAM!=null) {
 frag = document.getElementsByTagName("span")
 for (var i=0;i<frag.length;i++)
 if (frag[i].className == "ASAM") 
 processNodeR(frag[i],linebreaks,false);
 } else {
 try {
 st = n.innerHTML; // look for ASAMdelimiter on page
 } catch(err) {}
//alert(st)
 if (st==null || /amath\b|\\begin{a?math}/i.test(st) ||
 st.indexOf(ASAMdelimiter1+" ")!=-1 || st.slice(-1)==ASAMdelimiter1 ||
 st.indexOf(ASAMdelimiter1+"<")!=-1 || st.indexOf(ASAMdelimiter1+"\n")!=-1) {
 processNodeR(n,linebreaks,false);
 }
 }
}

var ASLMnames = []; //list of input symbols

function ASLMremoveCharsAndBlanks(str,n) {
//remove n characters and any following blanks
 var st;
 st = str.slice(n);
 for (var i=0; i<st.length && st.charCodeAt(i)<=32; i=i+1);
 return st.slice(i);
}

function ASLMgetSymbol(str) {
//return maximal initial substring of str that appears in names
//return null if there is none
 var k = 0; //new pos
 var j = 0; //old pos
 var mk; //match pos
 var st;
 var tagst;
 var match = "";
 var more = true;
 for (var i=1; i<=str.length && more; i++) {
 st = str.slice(0,i); //initial substring of length i
 j = k;
 k = position(ASLMnames, st, j);
 if (k<ASLMnames.length && str.slice(0,ASLMnames[k].length)==ASLMnames[k]){
 match = ASLMnames[k];
 mk = k;
 i = match.length;
 }
 more = k<ASLMnames.length && str.slice(0,ASLMnames[k].length)>=ASLMnames[k];
 }
 ASLMpreviousSymbol=ASLMcurrentSymbol;
 if (match!=""){
 ASLMcurrentSymbol=ASLMsymbols[mk].ttype;
 return ASLMsymbols[mk];
 }
 ASLMcurrentSymbol=CONST;
 k = 1;
 st = str.slice(0,1); //take 1 character
 if ("0"<=st && st<="9") tagst = "mn";
 else tagst = (("A">st || st>"Z") && ("a">st || st>"z")?"mo":"mi");
/*
// Commented out by DRW (not fully understood, but probably to do with
// use of "/" as an INFIX version of "\\frac", which we don't want):
//}
//if (st=="-" && ASLMpreviousSymbol==INFIX) {
// ASLMcurrentSymbol = INFIX; //trick "/" into recognizing "-" on second parse
// return {input:st, tag:tagst, output:st, ttype:UNARY, func:true};
//}
*/
 return {input:st, tag:tagst, output:st, ttype:CONST};
}


/*Parsing ASCII math expressions with the following grammar
v ::= [A-Za-z] | greek letters | numbers | other constant symbols
u ::= sqrt | text | bb | other unary symbols for font commands
b ::= frac | root | stackrel binary symbols
l ::= { | \left left brackets
r ::= } | \right right brackets
S ::= v | lEr | uS | bSS Simple expression
I ::= S_S | S^S | S_S^S | S Intermediate expression
E ::= IE | I/I Expression
Each terminal symbol is translated into a corresponding mathml node.*/

var ASLMpreviousSymbol,ASLMcurrentSymbol;

function ASLMparseSexpr(str) { //parses str and returns [node,tailstr,(node)tag]
 var symbol, node, result, result2, i, st,// rightvert = false,
 newFrag = document.createDocumentFragment();
 str = ASLMremoveCharsAndBlanks(str,0);
 symbol = ASLMgetSymbol(str); //either a token or a bracket or empty
 if (symbol == null || symbol.ttype == RIGHTBRACKET)
 return [null,str,null];
 if (symbol.ttype == DEFINITION) {
 str = symbol.output+ASLMremoveCharsAndBlanks(str,symbol.input.length);
 symbol = ASLMgetSymbol(str);
 if (symbol == null || symbol.ttype == RIGHTBRACKET)
 return [null,str,null];
 }
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 switch (symbol.ttype) {
 case SPACE:
 node = createMmlNode(symbol.tag);
 node.setAttribute(symbol.atname,symbol.atval);
 return [node,str,symbol.tag];
 case UNDEROVER:
 if (isIE) {
 if (symbol.input.substr(0,4) == "\\big") { // botch for missing symbols
 str = "\\"+symbol.input.substr(4)+str; // make \bigcup = \cup etc.
 symbol = ASLMgetSymbol(str);
 symbol.ttype = UNDEROVER;
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 }
 }
 return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str,symbol.tag];
 case CONST:
 var output = symbol.output;
 if (isIE) {
 if (symbol.input == "'")
 output = "\u2032";
 else if (symbol.input == "''")
 output = "\u2033";
 else if (symbol.input == "'''")
 output = "\u2033\u2032";
 else if (symbol.input == "''''")
 output = "\u2033\u2033";
 else if (symbol.input == "\\square")
 output = "\u25A1"; // same as \Box
 else if (symbol.input.substr(0,5) == "\\frac") {
 // botch for missing fractions
 var denom = symbol.input.substr(6,1);
 if (denom == "5" || denom == "6") {
 str = symbol.input.replace(/\\frac/,"\\frac ")+str;
 return [node,str,symbol.tag];
 }
 }
 }
 node = createMmlNode(symbol.tag,document.createTextNode(output));
 return [node,str,symbol.tag];
 case LONG: // added by DRW
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 node.setAttribute("minsize","1.5");
 node.setAttribute("maxsize","1.5");
 node = createMmlNode("mover",node);
 node.appendChild(createMmlNode("mspace"));
 return [node,str,symbol.tag];
 case STRETCHY: // added by DRW
 if (isIE && symbol.input == "\\backslash")
 symbol.output = "\\"; // doesn't expand, but then nor does "\u2216"
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 if (symbol.input == "|" || symbol.input == "\\vert" ||
 symbol.input == "\\|" || symbol.input == "\\Vert") {
 node.setAttribute("lspace","0em");
 node.setAttribute("rspace","0em");
 }
 node.setAttribute("maxsize",symbol.atval); // don't allow to stretch here
 if (symbol.rtag != null)
 return [node,str,symbol.rtag];
 else
 return [node,str,symbol.tag];
 case BIG: // added by DRW
 var atval = symbol.atval;
 if (isIE)
 atval = symbol.ieval;
 symbol = ASLMgetSymbol(str);
 if (symbol == null)
 return [null,str,null];
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 node = createMmlNode(symbol.tag,document.createTextNode(symbol.output));
 node.setAttribute("minsize",atval);
 node.setAttribute("maxsize",atval);
 return [node,str,symbol.tag];
 case LEFTBRACKET: //read (expr+)
 if (symbol.input == "\\left") { // left what?
 symbol = ASLMgetSymbol(str);
 if (symbol != null) {
 if (symbol.input == ".")
 symbol.invisible = true;
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 }
 }
 result = ASLMparseExpr(str,true,false);
 if (symbol==null ||
 (typeof symbol.invisible == "boolean" && symbol.invisible))
 node = createMmlNode("mrow",result[0]);
 else {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 node = createMmlNode("mrow",node);
 node.appendChild(result[0]);
 }
 return [node,result[1],result[2]];
 case MATRIX: //read (expr+)
 if (symbol.input == "\\begin{array}") {
 var mask = "";
 symbol = ASLMgetSymbol(str);
 str = ASLMremoveCharsAndBlanks(str,0);
 if (symbol == null)
 mask = "l";
 else {
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 if (symbol.input != "{")
 mask = "l";
 else do {
 symbol = ASLMgetSymbol(str);
 if (symbol != null) {
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 if (symbol.input != "}")
 mask = mask+symbol.input;
 }
 } while (symbol != null && symbol.input != "" && symbol.input != "}");
 }
 result = ASLMparseExpr("{"+str,true,true);
// if (result[0]==null) return [createMmlNode("mo",
// document.createTextNode(symbol.input)),str];
 node = createMmlNode("mtable",result[0]);
 mask = mask.replace(/l/g,"left ");
 mask = mask.replace(/r/g,"right ");
 mask = mask.replace(/c/g,"center ");
 node.setAttribute("columnalign",mask);
 node.setAttribute("displaystyle","false");
 var lspace = createMmlNode("mspace");
 lspace.setAttribute("width","0.167em");
 var rspace = createMmlNode("mspace");
 rspace.setAttribute("width","0.167em");
 var node1 = createMmlNode("mrow",lspace);
 node1.appendChild(node);
 node1.appendChild(rspace);
 return [node1,result[1],null];
 } else { // eqnarray
 result = ASLMparseExpr("{"+str,true,true);
 node = createMmlNode("mtable",result[0]);
 node.setAttribute("columnspacing","0.167em"); // correct (but ignored?)
 node.setAttribute("columnalign","right center left");
 node.setAttribute("displaystyle","true");
 node = createMmlNode("mrow",node);
 return [node,result[1],null];
 }
 case TEXT:
 if (str.charAt(0)=="{") i=str.indexOf("}");
 else i = 0;
 if (i==-1)
 i = str.length;
 st = str.slice(1,i);
 if (st.charAt(0) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","0.33em"); // was 1ex
 newFrag.appendChild(node);
 }
 newFrag.appendChild(
 createMmlNode(symbol.tag,document.createTextNode(st)));
 if (st.charAt(st.length-1) == " ") {
 node = createMmlNode("mspace");
 node.setAttribute("width","0.33em"); // was 1ex
 newFrag.appendChild(node);
 }
 str = ASLMremoveCharsAndBlanks(str,i+1);
 return [createMmlNode("mrow",newFrag),str,null];
 case UNARY:
 result = ASLMparseSexpr(str);
 if (result[0]==null) return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str];
 if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
 st = str.charAt(0);
// if (st=="^" || st=="_" || st=="/" || st=="|" || st==",") {
 if (st=="^" || st=="_" || st==",") {
 return [createMmlNode(symbol.tag,
 document.createTextNode(symbol.output)),str,symbol.tag];
 } else {
 node = createMmlNode("mrow",
 createMmlNode(symbol.tag,document.createTextNode(symbol.output)));
 node.appendChild(result[0]);
 return [node,result[1],symbol.tag];
 }
 }
 if (symbol.input == "\\sqrt") { // sqrt
 return [createMmlNode(symbol.tag,result[0]),result[1],symbol.tag];
 } else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
 node = createMmlNode(symbol.tag,result[0]);
 var output = symbol.output;
 if (isIE) {
 if (symbol.input == "\\hat")
 output = "\u0302";
 else if (symbol.input == "\\widehat")
 output = "\u005E";
 else if (symbol.input == "\\bar")
 output = "\u00AF";
 else if (symbol.input == "\\grave")
 output = "\u0300";
 else if (symbol.input == "\\tilde")
 output = "\u0303";
 }
 var node1 = createMmlNode("mo",document.createTextNode(output));
 if (symbol.input == "\\vec" || symbol.input == "\\check")
 // don't allow to stretch
 node1.setAttribute("maxsize","1.2");
 // why doesn't "1" work? \vec nearly disappears in firefox
 if (isIE && symbol.input == "\\bar")
 node1.setAttribute("maxsize","0.5");
 if (symbol.input == "\\underbrace" || symbol.input == "\\underline")
 node1.setAttribute("accentunder","true");
 else
 node1.setAttribute("accent","true");
 node.appendChild(node1);
 if (symbol.input == "\\overbrace" || symbol.input == "\\underbrace")
 node.ttype = UNDEROVER;
 return [node,result[1],symbol.tag];
 } else { // font change or displaystyle command
 if (!isIE && typeof symbol.codes != "undefined") {
 for (i=0; i<result[0].childNodes.length; i++)
 if (result[0].childNodes[i].nodeName=="mi" || result[0].nodeName=="mi") {
 st = (result[0].nodeName=="mi"?result[0].firstChild.nodeValue:
 result[0].childNodes[i].firstChild.nodeValue);
 var newst = [];
 for (var j=0; j<st.length; j++)
 if (st.charCodeAt(j)>64 && st.charCodeAt(j)<91) {newst = newst + fixedFromCharCode(symbol.codes[st.charCodeAt(j)-65]);} else newst = newst + st.charAt(j);
 if (result[0].nodeName=="mi")
 result[0]=createMmlNode("mo").
 appendChild(document.createTextNode(newst));
 else result[0].replaceChild(createMmlNode("mo").
 appendChild(document.createTextNode(newst)),result[0].childNodes[i]);
 }
 }
 node = createMmlNode(symbol.tag,result[0]);
 node.setAttribute(symbol.atname,symbol.atval);
 if (symbol.input == "\\scriptstyle" ||
 symbol.input == "\\scriptscriptstyle")
 node.setAttribute("displaystyle","false");
 return [node,result[1],symbol.tag];
 }
 case BINARY:
 result = ASLMparseSexpr(str);
 if (result[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str,null];
 result2 = ASLMparseSexpr(result[1]);
 if (result2[0]==null) return [createMmlNode("mo",
 document.createTextNode(symbol.input)),str,null];
 if (symbol.input=="\\textcolor" || symbol.input=="\\colorbox") { 
 var tclr = str.match(/\{\s*([#\w]+)\s*\}/); //get's color from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclr!=null) {
 if(IsColorName.test(tclr[1].toLowerCase())) {
 tclr=LaTeXColor[tclr[1].toLowerCase()];
 } else {
 tclr=tclr[1]; // no checking for valid color!!
 } 
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclr);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
if (symbol.input=="\\density") { 
 var tclrf = str.match(/\{\s*([#\w]+)\s*\}/); //get's size from beginning of str
 str = str.replace(/\{\s*[#\w]+\s*\}/,""); 
 if(tclrf!=null) {
 if(tclrf[1]>1000) {
 tclrf=1000+'%';
 } else {
 tclrf=tclrf[1]+'%';
 }
 node = LMcreateElementMathML("mstyle");
 node.setAttribute(symbol.atval,tclrf);
 node.appendChild(result2[0]); 
 return [node,result2[1],symbol.tag]; 
 } 
 }
 if (symbol.input=="\\root" || symbol.input=="\\stackrel")
 newFrag.appendChild(result2[0]);
 newFrag.appendChild(result[0]);
 if (symbol.input=="\\frac") newFrag.appendChild(result2[0]);
 return [createMmlNode(symbol.tag,newFrag),result2[1],symbol.tag];
 case INFIX:
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 return [createMmlNode("mo",document.createTextNode(symbol.output)),
 str,symbol.tag];
 default:
 return [createMmlNode(symbol.tag, //its a constant
 document.createTextNode(symbol.output)),str,symbol.tag];
 }
}

function ASLMparseIexpr(str) {
 var symbol, sym1, sym2, node, result, tag, underover;
 str = ASLMremoveCharsAndBlanks(str,0);
 sym1 = ASLMgetSymbol(str);
 result = ASLMparseSexpr(str);
 node = result[0];
 str = result[1];
 tag = result[2];
 symbol = ASLMgetSymbol(str);
 if (symbol.ttype == INFIX) {
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 result = ASLMparseSexpr(str);
 if (result[0] == null) // show box in place of missing argument
 result[0] = createMmlNode("mo",document.createTextNode("\u25A1"));
 str = result[1];
 tag = result[2];
 if (symbol.input == "_" || symbol.input == "^") {
 sym2 = ASLMgetSymbol(str);
 tag = null; // no space between x^2 and a following sin, cos, etc.
// This is for \underbrace and \overbrace
 underover = ((sym1.ttype == UNDEROVER) || (node.ttype == UNDEROVER));
// underover = (sym1.ttype == UNDEROVER);
 if (symbol.input == "_" && sym2.input == "^") {
 str = ASLMremoveCharsAndBlanks(str,sym2.input.length);
 var res2 = ASLMparseSexpr(str);
 str = res2[1];
 tag = res2[2]; // leave space between x_1^2 and a following sin etc.
 node = createMmlNode((underover?"munderover":"msubsup"),node);
 node.appendChild(result[0]);
 node.appendChild(res2[0]);
 } else if (symbol.input == "_") {
 node = createMmlNode((underover?"munder":"msub"),node);
 node.appendChild(result[0]);
 } else {
 node = createMmlNode((underover?"mover":"msup"),node);
 node.appendChild(result[0]);
 }
 node = createMmlNode("mrow",node); // so sum does not stretch
 } else {
 node = createMmlNode(symbol.tag,node);
 if (symbol.input == "\\atop" || symbol.input == "\\choose")
 node.setAttribute("linethickness","0ex");
 node.appendChild(result[0]);
 if (symbol.input == "\\choose")
 node = createMmlNode("mfenced",node);
 }
 }
 return [node,str,tag];
}

function ASLMparseExpr(str,rightbracket,matrix) {
 var symbol, node, result, i, tag,
 newFrag = document.createDocumentFragment();
 do {
 str = ASLMremoveCharsAndBlanks(str,0);
 result = ASLMparseIexpr(str);
 node = result[0];
 str = result[1];
 tag = result[2];
 symbol = ASLMgetSymbol(str);
 if (node!=undefined) {
 if ((tag == "mn" || tag == "mi") && symbol!=null &&
 typeof symbol.func == "boolean" && symbol.func) {
 // Add space before \sin in 2\sin x or x\sin x
 var space = createMmlNode("mspace");
 space.setAttribute("width","0.167em");
 node = createMmlNode("mrow",node);
 node.appendChild(space);
 }
 newFrag.appendChild(node);
 }
 } while ((symbol.ttype != RIGHTBRACKET)
 && symbol!=null && symbol.output!="");
 tag = null;
 if (symbol.ttype == RIGHTBRACKET) {
 if (symbol.input == "\\right") { // right what?
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length);
 symbol = ASLMgetSymbol(str);
 if (symbol != null && symbol.input == ".")
 symbol.invisible = true;
 if (symbol != null)
 tag = symbol.rtag;
 }
 if (symbol!=null)
 str = ASLMremoveCharsAndBlanks(str,symbol.input.length); // ready to return
 var len = newFrag.childNodes.length;
 if (matrix &&
 len>0 && newFrag.childNodes[len-1].nodeName == "mrow" && len>1 &&
 newFrag.childNodes[len-2].nodeName == "mo" &&
 newFrag.childNodes[len-2].firstChild.nodeValue == "&") { //matrix
 var pos = []; // positions of ampersands
 var m = newFrag.childNodes.length;
 for (i=0; matrix && i<m; i=i+2) {
 pos[i] = [];
 node = newFrag.childNodes[i];
 for (var j=0; j<node.childNodes.length; j++)
 if (node.childNodes[j].firstChild.nodeValue=="&")
 pos[i][pos[i].length]=j;
 }
 var row, frag, n, k, table = document.createDocumentFragment();
 for (i=0; i<m; i=i+2) {
 row = document.createDocumentFragment();
 frag = document.createDocumentFragment();
 node = newFrag.firstChild; // <mrow> -&-&...&-&- </mrow>
 n = node.childNodes.length;
 k = 0;
 for (j=0; j<n; j++) {
 if (typeof pos[i][k] != "undefined" && j==pos[i][k]){
 node.removeChild(node.firstChild); //remove &
 row.appendChild(createMmlNode("mtd",frag));
 k++;
 } else frag.appendChild(node.firstChild);
 }
 row.appendChild(createMmlNode("mtd",frag));
 if (newFrag.childNodes.length>2) {
 newFrag.removeChild(newFrag.firstChild); //remove <mrow> </mrow>
 newFrag.removeChild(newFrag.firstChild); //remove <mo>&</mo>
 }
 table.appendChild(createMmlNode("mtr",row));
 }
 return [table,str];
 }
 if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
 node = createMmlNode("mo",document.createTextNode(symbol.output));
 newFrag.appendChild(node);
 }
 }
 return [newFrag,str,tag];
}



function ASCIIandgraphformatting(st) {
// st = st.replace(/<sup>(.*?)<\/sup>(\s|(\S))/gi,"^{$1} $3");
//st = st.replace(/<\/?font.*?>/gi,""); // do this only in amath...endamath
 st = st.replace(/(Proof:)/g,"<i>$1</i>");
 st = st.replace(/QED/g,"&nbsp; &nbsp; &#x25A1;");
 st = st.replace(/(\\?end{?a?math}?)/ig,"<span></span>$1");
 st = st.replace(/(\bamath\b|\\begin{a?math})/ig,"<span></span>$1");
 st = st.replace(/([>\n])(Theorem|Lemma|Proposition|Corollary|Definition|Example|Remark|Problem|Exercise|Conjecture|Solution)(:|\W\W?(\w|\s|-|\.)*?\W?:)/g,"$1<b>$2$3</b>");
// st = st.replace(/<embed\s+class\s?=\s?"?ASCIIsvg"?/gi,"<embed class=\"ASCIIsvg\" src=\""+dsvglocation+"d.svg\" wmode=\"transparent\"");
 st = st.replace(/(?:\\begin{a?graph}|\bagraph|\(:graph\s)((.|\n)*?)(?:\\end{a?graph}|enda?graph|:\))/g,function(s,t){return "<table><tr><td><div class=\"ASCIIsvg\"><embed class=\"ASCIIsvg\" src=\""+dsvglocation+"d.svg\" wmode=\"transparent\" script=\'"+t.replace(/<\/?(br|p|pre)\s?\/?>/gi,"\n")+"\'/></div></td></tr></table>"});
 st = st.replace(/insertASCIIMathCalculator/g,"<div class=\"ASCIIMathCalculator\"></div>");
//alert(dsvglocation)
 return st
}

function ASLMprocessNode(n) {
 var frag,st;
 try {
 st = n.innerHTML;
 } catch(err) {}
 var am = /amath\b|graph/i.test(st);
 if ((st==null || st.indexOf("ALO ")!=-1 || st.indexOf("ALO<")!=-1 || 
 st.indexOf("\\begin")!=-1 || am || st.slice(-1)==" ALO" ||
 st.indexOf("ALO\n")!=-1)&& !/edit-content|HTMLArea|wikiedit|wpTextbox1/.test(st)){
 if (!ASavoidinnerHTML && translateLaTeXformatting) 
 st = simpleLaTeXformatting(st);
 if (st!=null && am && !ASavoidinnerHTML) {
 st = ASCIIandgraphformatting(st);
 }
 st = st.replace(/%7E/g,"~"); // else PmWiki has url issues
 if (!ASavoidinnerHTML) n.innerHTML = st;
 processNodeR(n,false,true);
 }

}

function factorial(x,n) { // Factorial function
 if (n==null) n=1;
 if (Math.abs(x-Math.round(x*1000000)/1000000)<1e-15)
 x = Math.round(x*1000000)/1000000;
 if (x-Math.floor(x)!=0) return NaN;
 for (var i=x-n; i>0; i-=n) x*=i;
 return (x<0?NaN:(x==0?1:x));
}

function C(x,k) { // Binomial coefficient function
 var res=1;
 for (var i=0; i<k; i++) res*=(x-i)/(k-i);
 return res;
}

function chop(x,n) { // Truncate decimal number to n places after decimal point
 if (n==null) n=0;
 return Math.floor(x*Math.pow(10,n))/Math.pow(10,n);
}

function ran(a,b,n) { // Generate random number in [a,b] with n digits after .
 if (n==null) n=0;
 return chop((b+Math.pow(10,-n)-a)*Math.random()+a,n);
}

function myCreateElementSVG(t) {
return doc.createElementNS("http://www.w3.org/2000/svg",t);
}

function getElementsByClass(container, tagName, clsName){
 var list = new Array(0);
 var collection = container.getElementsByTagName(tagName);
 for(var i = 0; i < collection.length; i++)
 if(collection[i].className.slice(0,clsName.length)==clsName)
 list[list.length] = collection[i];
 return list;
}

function showobj(obj) {
 var st="", i;
 for (i in obj) 
 st += (obj.getAttribute(i)==null?"":" "+i+":"+obj.getAttribute(i));
 return st;
}

function findPos(obj) { // top-left corner of obj on HTML page in pixel
 var curleft = curtop = 0;
 if (obj.offsetParent) {
 curleft = obj.offsetLeft
 curtop = obj.offsetTop
 while (obj = obj.offsetParent) {
 curleft += obj.offsetLeft
 curtop += obj.offsetTop
//alert(showobj(obj)+[curleft,curtop])
 }
 }
 return [curleft,curtop];
}

function setText(st,id) { // add text to an existing node with given id
 var node = document.getElementById(id);
 if (node!=null)
 if (node.childNodes.length!=0) node.childNodes[0].nodeValue = st;
 else node.appendChild(document.createTextNode(st));
}

function getX(evt) { // return mouse x-coord in user coordinate system
 var svgroot = evt.target.parentNode;
 pos = findPos(svgroot.parentNode);
 return (evt.clientX+(isIE?0:window.pageXOffset)-pos[0]-svgroot.getAttribute("ox"))/parseFloat(svgroot.getAttribute("xunitlength"));
}

function getY(evt) { // return mouse y-coord in user coordinate system
 var svgroot = evt.target.parentNode;
 pos = findPos(svgroot.parentNode);
//alert(showobj(svgroot)+svgroot.getAttribute("mytop"))
 return (svgroot.getAttribute("height")-svgroot.getAttribute("oy")-(evt.clientY+(isIE?0:window.pageYOffset)-pos[1]))/parseFloat(svgroot.getAttribute("yunitlength"));
}

function AStranslateandeval(src) { //modify user input to JavaScript syntax
 var errstr;
 // replace plot(f(x),...) with plot("f(x)",...) 
 src = src.replace(/plot\(\x20*([^\"f\[][^\n\r;]+?)\,/g,"plot\(\"$1\",");
 src = src.replace(/plot\(\x20*([^\"f\[][^\n\r;]+)\)/g,"plot(\"$1\")");

 // replace (expr,expr) by [expr,expr] where expr has no (,) in it
 src = src.replace(/([=[(,]\x20*)\(([-a-z0-9./+*]+?),([-a-z0-9./+*]+?)\)/g,"$1[$2,$3]");
//alert(src)
 // insert * between digit and letter e.g. 2x --> 2*x
 src = src.replace(/([0-9])([a-df-zA-Z]|e^)/g,"$1*$2");
 src = src.replace(/\)([\(0-9a-zA-Z])/g,"\)*$1");

 try {
 with (Math) eval(src); // here the svgpicture object is created
 } catch(err) {
 if (err!="wait") {
//alert(dsvglocation)
 if (typeof err=="object") 
 errstr = err.name+" "+err.message+" "+err.number+" "+err.description;
 else errstr = err;
 alert(errstr+"\n"+src)
 }
 }
}
function drawPicsie() {
 var index, nd;
 var AMbody = document.getElementsByTagName("body")[0];
 pictures = getElementsByClass(AMbody,"embed","ASplugin");
// pictures = document.getElementsByTagName("embed");
 var len = pictures.length;
 
 
 //for (index = 0; index < len; index++) {
 // picture = (isIE ? pictures[index] : pictures[0]);
 for (index = len-1; index >=0; index--) {
 picture = pictures[index];
 if (picture.getAttribute("sscr")!='') {
 n = document.createElement('img');
 n.setAttribute("style",picture.getAttribute("style"));
 n.setAttribute("src",AScgiloc+'?sscr='+encodeURIComponent(picture.getAttribute("sscr")));
 pn = picture.parentNode;
 pn.replaceChild(n,picture);
 }
 }
}

function drawPics() {
 var index, nd;
 var AMbody = document.getElementsByTagName("body")[0];
 pictures = getElementsByClass(AMbody,"embed","ASplugin");
// pictures = document.getElementsByTagName("embed");
 var len = pictures.length;
 
 
 //for (index = 0; index < len; index++) {
 // picture = (isIE ? pictures[index] : pictures[0]);
 for (index = len-1; index >=0; index--) {
 picture = pictures[index];
 
 if ((!ASnoSVG) && (!isIE)) {
 initialized = false;
 var sscr = picture.getAttribute("sscr");
 if ((sscr != null) && (sscr != "")) { //sscr from editor
 try {
 parseShortScript(sscr);
 } catch (e) {}
 } else {
 src = picture.getAttribute("script"); //script from showplot
 if ((src!=null) && (src != "")) {
 try {
 with (Math) eval(src);
 } catch(err) {alert(err+"\n"+src)}
 }
 }
 }
 
 }
}
function parseShortScript(sscript,gw,gh) {
 if (sscript) { 
 var sa= sscript.split(",");
 
 if (gw && gh) {
 sa[9] = gw;
 sa[10] = gh;
 sscript = sa.join(",");
 picture.setAttribute("sscr", sscript);
 }
 picture.setAttribute("width", sa[9]);
 picture.setAttribute("height", sa[10]);
 picture.style.width = sa[9] + "px";
 picture.style.height = sa[10] + "px";
 
 if (sa.length > 10) {
 commands = 'setBorder(5);';
 commands += 'width=' +sa[9] + '; height=' +sa[10] + ';';
 commands += 'initPicture(' + sa[0] +','+ sa[1] +','+ sa[2] +','+ sa[3] + ');';
 commands += 'axes(' + sa[4] +','+ sa[5] +','+ sa[6] +','+ sa[7] +','+ sa[8]+ ');';
 
 var inx = 11;
 var eqnlist = 'Graphs: ';
 
 while (sa.length > inx+9) {
 commands += 'stroke="' + sa[inx+7] + '";';
 commands += 'strokewidth="' + sa[inx+8] + '";'
 //commands += 'strokedasharray="' + sa[inx+9] + '";' 
 if (sa[inx+9] != "") {
 commands += 'strokedasharray="' + sa[inx+9].replace(/\s+/g,',') + '";';
 }
 if (sa[inx]=="slope") {
 eqnlist += "dy/dx="+sa[inx+1] + "; ";
 commands += 'slopefield("' + sa[inx+1] + '",' + sa[inx+2] + ',' + sa[inx+2] + ');'; 
 } else {
 if (sa[inx]=="func") {
 eqnlist += "y="+sa[inx+1] + "; ";
 eqn = '"' + sa[inx+1] + '"';
 } else if (sa[inx] == "polar") {
 eqnlist += "r="+sa[inx+1] + "; ";
 eqn = '["cos(t)*(' + sa[inx+1] + ')","sin(t)*(' + sa[inx+1] + ')"]';
 } else if (sa[inx] == "param") {
 eqnlist += "[x,y]=["+sa[inx+1] + "," + sa[inx+2] + "]; ";
 eqn = '["' + sa[inx+1] + '","'+ sa[inx+2] + '"]';
 }
 
 
 if (typeof eval(sa[inx+5]) == "number") {
 // if ((sa[inx+5]!='null')&&(sa[inx+5].length>0)) {
 //commands += 'myplot(' + eqn +',"' + sa[inx+3] + '","' + sa[inx+4]+'",' + sa[inx+5] + ',' + sa[inx+6] +');';
 commands += 'plot(' + eqn +',' + sa[inx+5] + ',' + sa[inx+6] +',null,null,' + sa[inx+3] + ',' + sa[inx+4] +');';
 
 } else {
 commands += 'plot(' + eqn +',null,null,null,null,' + sa[inx+3] + ',' + sa[inx+4]+');';
 }
 }
 inx += 10;
 }
 
 try {
 eval(commands);
 } catch (e) {}
 
 picture.setAttribute("alt",eqnlist);
 //picture.setAttribute("width", sa[9]);
 //picture.setAttribute("height", sa[9]);
 
 return commands;
 }
 }
 else {
 initialized = false;
 sscript = picture.sscr;
 }
}
var lastSlot = 0;

function drawPictures() { // main routine; called after webpage has loaded
if (isIE) {drawPicsie();} else {
drawPics();
 var src, id, dsvg, nd, node, ht, index, cols, arr, i, node2;
 var ASbody = document.getElementsByTagName("body")[0];
 pictures = getElementsByClass(ASbody,"embed","ASCIIsvg");
 var len = pictures.length;
 if(len==0) return;
 for (index = lastSlot; index < len+lastSlot; index++) {
 width = null; height = null; 
 xmin = null; xmax = null; ymin = null; ymax = null;
 xscl = null; xgrid = null; yscl = null; ygrid = null;
 initialized = false;
 picture = pictures[index-lastSlot]; // current picture object
 src = picture.getAttribute("script"); // get the ASCIIsvg code
 if (src==null) src = "";
 // insert "axes()" if not present ******** experimental
 if (!/axes\b|initPicture/.test(src)) {
 var i = 0;
 while (/((yscl|ymax|ymin|xscl|xmax|xmin|\bwidth|\bheight)\s*=\s*-?\d*(\d\.|\.\d|\d)\d*\s*;?)/.test(src.slice(i))) i++;
 src = (i==0?"axes(); "+src: src.slice(0,i)+src.slice(i).replace(/((scl|max|min|idth|eight)\s*=\s*-?\d*(\d\.|\.\d|\d)\d*\s*;?)/,"$1\naxes();"));
 }
 ht = picture.getAttribute("height");
 if (document.getElementById("picture"+(index+1)+"mml")==null) {
 picture.parentNode.style.position = "relative";
 node = createElementXHTML("div");
 node.style.position = "absolute";
 node.style.top = "0px";
 node.style.left = "0px";
 node.setAttribute("id","picture"+(index+1)+"mml");
 picture.parentNode.insertBefore(node,picture.nextSibling);
 }
 if (ht==null) ht ="";
// if (ht!="") defaultborder = 25;
 if (ht=="" || src=="") 
 if (document.getElementById("picture"+(index+1)+"input")==null) {
 node = createElementXHTML("textarea");
 arr = src.split("\n");
 cols = 0;
 for (i=0;i<arr.length;i++) cols = Math.max(cols,arr[i].length);
 node.setAttribute("rows",Math.min(10,arr.length)+1);
 node.setAttribute("cols",Math.max(Math.min(60,cols),20)+5);
// node.setAttribute("style","display:block");
 if (isIE) src = src.replace(/([^\r])\n/g,"$1\r");
 node.appendChild(document.createTextNode(src));
 if (src.indexOf("showcode()")==-1) node.style.display = "none";
 node.setAttribute("id","picture"+(index+1)+"input");
 picture.parentNode.insertBefore(node,picture.nextSibling);
 picture.parentNode.insertBefore(createElementXHTML("br"),node);
 node2 = createElementXHTML("button");
 node2.setAttribute("id","picture"+(index+1)+"button");
 if (isIE) node2.onclick = function() {updatePicture(this)};
 else node2.setAttribute("onclick","updatePicture(this)");
 node2.appendChild(document.createTextNode("Update"));
 if (src.indexOf("showcode()")==-1) node2.style.display = "none";
 picture.parentNode.insertBefore(node2,node);
// picture.parentNode.insertBefore(document.createTextNode("ASCII"),node);
 picture.parentNode.insertBefore(createElementXHTML("br"),node);
 } else src = document.getElementById("picture"+(index+1)+"input").value;
 id = picture.getAttribute("id");
 dsvg = picture.getAttribute("src");
 if (id == null || id == "") {
 id = "picture"+(index+1);
 picture.setAttribute("id",id);
 }
 AStranslateandeval(src);
 }
 lastSlot+=len;
 }
}

function setdefaults() { //called before each graph is evaluated
 strokewidth = defaultstrokewidth;
 stroke = defaultstroke;
 strokeopacity = defaultstrokeopacity;
 strokedasharray = defaultstrokedasharray;
 fill = defaultfill;
 fillopacity = defaultfillopacity;
 fontstyle = defaultfontstyle;
 fontfamily = defaultfontfamily;
 fontsize = defaultfontsize;
 fontweight = defaultfontweight;
 fontstroke = defaultfontstroke;
 fontfill = defaultfontfill;
 marker = defaultmarker;
 endpoints = defaultendpoints;
}

function switchTo(id) { // used by dynamic code to select appropriate graph
 if (id==undefined) return;
 var name = id;
 if (typeof name!="string") name = id.target.parentNode.getAttribute("name");
 picture = document.getElementById(name);
 width = picture.getAttribute("width")-0;
 height = picture.getAttribute("height")-0;
 setdefaults();
 if ((picture.nodeName == "EMBED" || picture.nodeName == "embed") && isIE) {
 svgpicture = picture.getSVGDocument().getElementById("root");
 doc = picture.getSVGDocument();
 } else {
 svgpicture = picture;
 doc = document;
 }
 xunitlength = parseFloat(svgpicture.getAttribute("xunitlength"));
 yunitlength = parseFloat(svgpicture.getAttribute("yunitlength"));
 xmin = parseFloat(svgpicture.getAttribute("xmin"));
 xmax = parseFloat(svgpicture.getAttribute("xmax"));
 ymin = parseFloat(svgpicture.getAttribute("ymin"));
 ymax = parseFloat(svgpicture.getAttribute("ymax"));
 origin = [svgpicture.getAttribute("ox")-0,svgpicture.getAttribute("oy")-0];
}

function updatePicture(obj) { // called by Update button
//alert(typeof obj)
 var src = document.getElementById((typeof obj=="string"?
 obj:"picture"+(obj+1)+"input")).value;
 xmin = null; xmax = null; ymin = null; ymax = null;
 xscl = null; xgrid = null; yscl = null; ygrid = null;
 initialized = false;
 switchTo((typeof obj=="string"?obj.slice(0,8):"picture"+(obj+1)));
 AStranslateandeval(src)
}

function changepicturesize(evt,factor) {
 var obj = evt.target;
 var name = obj.parentNode.getAttribute("name");
 var pic = document.getElementById(name);
 var src = document.getElementById(name+"input").value;
 if (!/height/.test(src)) src = "height=0; "+src;
 if (!/width/.test(src)) src = "width=0; "+src;
 src = src.replace(/width\s*=\s*\d+/,"width="+(factor*(pic.getAttribute("width")-0)));
 src = src.replace(/height\s*=\s*\d+/,"height="+(factor*(pic.getAttribute("height")-0)));
 document.getElementById(name+"input").value = src;
//alert(getKey(evt.keycode))
 updatePicture(name);
}

function zoom(evt,factor) {
 switchTo(evt);
 var obj = evt.target;
 var name = obj.parentNode.getAttribute("name");
 var pic = document.getElementById(name);
 var src = document.getElementById(name+"input").value;
 var xlen = (xmax-xmin)/2;
 var ylen = (ymax-ymin)/2;
 var xcen = getX(evt), ycen = getY(evt);
 if (!/ymax/.test(src)) src = "ymax=0; "+src;
 if (!/ymin/.test(src)) src = "ymin=0; "+src;
 if (!/xmax/.test(src)) src = "xmax=0; "+src;
 if (!/xmin/.test(src)) src = "xmin=0; "+src;
 src = src.replace(/xmin\s*=\s*[-\d.e]+/,"xmin="+(xcen-factor*xlen));
 src = src.replace(/xmax\s*=\s*[-\d.e]+/,"xmax="+(xcen+factor*xlen));
 src = src.replace(/ymin\s*=\s*[-\d.e]+/,"ymin="+(ycen-factor*ylen));
 src = src.replace(/ymax\s*=\s*[-\d.e]+/,"ymax="+(ycen+factor*ylen));
 document.getElementById(name+"input").value = src;
 updatePicture(name);
}

var sinceFirstClick = 0; // ondblclick simulation from 
var dblClkTimer; // http://www.enja.org/david/?cat=13 Thanks!
function timer() {
 if(sinceFirstClick<60) {
 sinceFirstClick++;
 setTimeout("timer()",10);
 } else {
 clearTimeout(dblClkTimer);
 dblClkTimer = "";
 }
}
function mClick(evt) {
 if(sinceFirstClick!=0) {
 if(sinceFirstClick <= 40) {
 if (evt.shiftKey) {
 if (evt.altKey) changepicturesize(evt,2);
 else zoom(evt,.5);
 } else if (evt.altKey) zoom(evt,2);//changepicturesize(evt,.5);
 else showHideCode(evt); // do this on dblclick
 clearTimeout(dblClkTimer);
 dblClkTimer = "";
 } else {
 clearTimeout(dblClkTimer);
 sinceFirstClick = 0;
 dblClkTimer = setTimeout("timer()",10);
 } 
 } else {
 sinceFirstClick = 0;
 dblClkTimer = setTimeout("timer()",10);
 }
}

function showHideCode(evt) { // called by onclick event
// if (evt.getDetail()==2) {//getDetail unfortunately not in Firefox
 var obj=evt.target;
 var name = obj.parentNode.getAttribute("name");
 var node = document.getElementById(name+"input");
 node.style.display = (node.style.display == "none"?"":"none");
 var node = document.getElementById(name+"button");
 node.style.display = (node.style.display == "none"?"":"none");
// }
}

function showcode() {} // do nothing

function setBorder(x) { border = x } //deprecate

function initPicture(x_min,x_max,y_min,y_max) { // set up the graph
// usually called by axes() or noaxes(), but can be used directly
 if (!initialized) {
 setdefaults();
 initialized = true;
 if (x_min!=null) xmin = x_min;
 if (x_max!=null) xmax = x_max;
 if (y_min!=null) ymin = y_min;
 if (y_max!=null) ymax = y_max;
 if (xmin==null) xmin = defaultxmin;
 if (xmax==null) xmax = defaultxmax;
 if (typeof xmin != "number" || typeof xmax != "number" || xmin >= xmax) 
 alert("Picture requires at least two numbers: xmin < xmax");
 else if (y_max != null && (typeof y_min != "number" || 
 typeof y_max != "number" || y_min >= y_max))
 alert("initPicture(xmin,xmax,ymin,ymax) requires numbers ymin < ymax");
 else {
 if (width==null) {
 width = picture.getAttribute("width");
 if (width==null || width=="") width=defaultwidth;
 }
 picture.setAttribute("width",width);
 if (height==null) { 
 height = picture.getAttribute("height");
 if (height==null || height=="") height=defaultheight;
 }
 picture.setAttribute("height",height);
 xunitlength = (width-2*border)/(xmax-xmin);
 yunitlength = xunitlength;
//alert(xmin+" "+xmax+" "+ymin+" "+ymax)
 if (ymin==null) {
 origin = [-xmin*xunitlength+border,height/2];
 ymin = -(height-2*border)/(2*yunitlength);
 ymax = -ymin;
 } else {
 if (ymax!=null) yunitlength = (height-2*border)/(ymax-ymin);
 else ymax = (height-2*border)/yunitlength + ymin;
 origin = [-xmin*xunitlength+border,-ymin*yunitlength+border];
 }
 if (isIE) {
 if (picture.FULLSCREEN==undefined) {
 setTimeout('drawPictures()',50);
 throw "wait";
 }
 svgpicture = picture.getSVGDocument().getElementById("root");
 if (svgpicture==null) {
 setTimeout('drawPictures()',50);
 throw "wait";
 }
 svgpicture = picture.getSVGDocument().getElementById("root");
 while (svgpicture.childNodes.length>0) 
 svgpicture.removeChild(svgpicture.lastChild); 
 svgpicture.setAttribute("width",width);
 svgpicture.setAttribute("height",height);
 svgpicture.setAttribute("name",picture.getAttribute("id"));
 doc = picture.getSVGDocument();
 } else {
 var qnode = document.createElementNS("http://www.w3.org/2000/svg","svg");
 qnode.setAttribute("id",picture.getAttribute("id"));
 qnode.setAttribute("name",picture.getAttribute("id"));
// qnode.setAttribute("style","display:inline");
 qnode.setAttribute("width",picture.getAttribute("width"));
 qnode.setAttribute("height",picture.getAttribute("height"));
 picturepos = findPos(picture);
// qnode.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
 if (picture.parentNode!=null) {
 picture.parentNode.replaceChild(qnode,picture);
 } else {
 svgpicture.parentNode.replaceChild(qnode,svgpicture);
 }
 svgpicture = qnode;
 doc = document;
 }
 var nd = document.getElementById(picture.getAttribute("id")+"mml");
 if (nd!=null) // clear out MathML layer
 while (nd.childNodes.length>0) nd.removeChild(nd.lastChild); 
 svgpicture.setAttribute("xunitlength",xunitlength);
 svgpicture.setAttribute("yunitlength",yunitlength);
 svgpicture.setAttribute("xmin",xmin);
 svgpicture.setAttribute("xmax",xmax);
 svgpicture.setAttribute("ymin",ymin);
 svgpicture.setAttribute("ymax",ymax);
 svgpicture.setAttribute("ox",origin[0]);
 svgpicture.setAttribute("oy",origin[1]);
 var node = myCreateElementSVG("rect");
 node.setAttribute("x","0");
 node.setAttribute("y","0");
 node.setAttribute("width",width);
 node.setAttribute("height",height);
 node.setAttribute("style",backgroundstyle);
 svgpicture.appendChild(node);
 svgpicture.setAttribute("onmousemove","displayCoord(evt)");
 svgpicture.setAttribute("onmouseout","removeCoord(evt)");
 svgpicture.setAttribute("onclick","mClick(evt)");
 node = myCreateElementSVG("text"); // used for displayCoord
 node.appendChild(doc.createTextNode(" "));
 node.setAttribute("id","coords");
 svgpicture.appendChild(node);
 node = myCreateElementSVG("text"); // used for text display
 node.appendChild(doc.createTextNode(" "));
 node.setAttribute("id","coords");
 svgpicture.appendChild(node);
 border = defaultborder;
 }
 }
}

//////////////////////////user graphics commands start/////////////////////////

function line(p,q,id,endpts) { // segment connecting points p,q (coordinates in units)
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("path");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("d","M"+(p[0]*xunitlength+origin[0])+","+
 (height-p[1]*yunitlength-origin[1])+" "+
 (q[0]*xunitlength+origin[0])+","+(height-q[1]*yunitlength-origin[1]));
 node.setAttribute("stroke-width", strokewidth);
 if (strokedasharray!=null) 
 node.setAttribute("stroke-dasharray", strokedasharray);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
 if (marker=="dot" || marker=="arrowdot") {
 ASdot(p,markersize,markerstroke,markerfill);
 if (marker=="arrowdot") arrowhead(p,q);
 ASdot(q,markersize,markerstroke,markerfill);
 } else if (marker=="arrow") arrowhead(p,q);
 if (endpts==null && endpoints!="") endpts = endpoints;
 if (endpts!=null) {
 if (endpts.indexOf("<-") != -1) arrowhead(q,p);
 if (endpts.indexOf("o-") != -1) dot(p, "open");
 if (endpts.indexOf("*-") != -1) dot(p, "closed");
 if (endpts.indexOf("->") != -1) arrowhead(p,q);
 if (endpts.indexOf("-o") != -1) dot(q, "open");
 if (endpts.indexOf("-*") != -1) dot(q, "closed");
 }
}

function path(plist,id,c,endpts) {
 if (c==null) c="";
 var node, st, i;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("path");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 if (typeof plist == "string") st = plist;
 else {
 st = "M";
 st += (plist[0][0]*xunitlength+origin[0])+","+
 (height-plist[0][1]*yunitlength-origin[1])+" "+c;
 for (i=1; i<plist.length; i++)
 st += (plist[i][0]*xunitlength+origin[0])+","+
 (height-plist[i][1]*yunitlength-origin[1])+" ";
 }
 node.setAttribute("d", st);
 node.setAttribute("stroke-width", strokewidth);
 if (strokedasharray!=null) 
 node.setAttribute("stroke-dasharray", strokedasharray);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
 if (marker=="dot" || marker=="arrowdot")
 for (i=0; i<plist.length; i++)
 if (c!="C" && c!="T" || i!=1 && i!=2)
 ASdot(plist[i],markersize,markerstroke,markerfill);
 if (endpts==null && endpoints!="") endpts = endpoints;
 if (endpts!=null) {
 if (endpts.indexOf("<-") != -1) arrowhead(plist[1],plist[0]);
 if (endpts.indexOf("o-") != -1) dot(plist[0], "open");
 if (endpts.indexOf("*-") != -1) dot(plist[0], "closed");
 if (endpts.indexOf("->") != -1) arrowhead(plist[plist.length-2],plist[plist.length-1]);
 if (endpts.indexOf("-o") != -1) dot(plist[plist.length-1], "open");
 if (endpts.indexOf("-*") != -1) dot(plist[plist.length-1], "closed");
 }
}

function curve(plist,id,endpts) {
 path(plist,id,"T",endpts);
}

function vector(p,q,id) {
 line(p,q,id,"","->");
}

function circle(center,radius,id) { // coordinates in units
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("circle");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("cx",center[0]*xunitlength+origin[0]);
 node.setAttribute("cy",height-center[1]*yunitlength-origin[1]);
 node.setAttribute("r",radius*xunitlength);
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
}

function loop(p,d,id) { 
// d is a direction vector e.g. [1,0] means loop starts in that direction
 if (d==null) d=[1,0];
 path([p,[p[0]+d[0],p[1]+d[1]],[p[0]-d[1],p[1]+d[0]],p],id,"C");
 if (marker=="arrow" || marker=="arrowdot") 
 arrowhead([p[0]+Math.cos(1.4)*d[0]-Math.sin(1.4)*d[1],
 p[1]+Math.sin(1.4)*d[0]+Math.cos(1.4)*d[1]],p);
}

function arc(start,end,radius,id,largearc) { // coordinates in units
 var node, v;
//alert([fill, stroke, origin, xunitlength, yunitlength, height])
 if (id!=null) node = doc.getElementById(id);
 if (largearc==null) largearc=0;
 if (radius==null) {
 v=[end[0]-start[0],end[1]-start[1]];
 radius = Math.sqrt(v[0]*v[0]+v[1]*v[1]);
 }
 if (node==null) {
 node = myCreateElementSVG("path");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("d","M"+(start[0]*xunitlength+origin[0])+","+
 (height-start[1]*yunitlength-origin[1])+" A"+radius*xunitlength+","+
 radius*yunitlength+" 0 "+largearc+",0 "+(end[0]*xunitlength+origin[0])+","+
 (height-end[1]*yunitlength-origin[1]));
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
 if (marker=="arrow" || marker=="arrowdot") {
 u = [(end[1]-start[1])/4,(start[0]-end[0])/4];
 v = [(end[0]-start[0])/2,(end[1]-start[1])/2];
//alert([u,v])
 v = [start[0]+v[0]+u[0],start[1]+v[1]+u[1]];
 } else v=[start[0],start[1]];
 if (marker=="dot" || marker=="arrowdot") {
 ASdot(start,markersize,markerstroke,markerfill);
 if (marker=="arrowdot") arrowhead(v,end);
 ASdot(end,markersize,markerstroke,markerfill);
 } else if (marker=="arrow") arrowhead(v,end);
}

function sector(center,start,end,id) { // center,start,end should be isoceles
 var rx = start[0]-center[0], ry = start[1]-center[1];
 arc(start,end,Math.sqrt(rx*rx+ry*ry),id+"arc");
 path([end,center,start],id+"path");
}

function ellipse(center,rx,ry,id) { // coordinates in units
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("ellipse");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("cx",center[0]*xunitlength+origin[0]);
 node.setAttribute("cy",height-center[1]*yunitlength-origin[1]);
 node.setAttribute("rx",rx*xunitlength);
 node.setAttribute("ry",ry*yunitlength);
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
}

function triangle(p,q,r,id) {
 path([p,q,r,p],id)
}

function rect(p,q,id,rx,ry) { // opposite corners in units, rounded by radii
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("rect");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("x",p[0]*xunitlength+origin[0]);
 node.setAttribute("y",height-q[1]*yunitlength-origin[1]);
 node.setAttribute("width",(q[0]-p[0])*xunitlength);
 node.setAttribute("height",(q[1]-p[1])*yunitlength);
 if (rx!=null) node.setAttribute("rx",rx*xunitlength);
 if (ry!=null) node.setAttribute("ry",ry*yunitlength);
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", fill);
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
}

function text(p,st,pos,id,fontsty) {
 var dnode, node, dx = 0, dy = fontsize/3, str = st.toString();
 if (/(`|ALO)/.test(str)) { // layer for ASCIIMathML and LaTeXMathML
 dnode = document.getElementById(svgpicture.getAttribute("name")+"mml");
 if (dnode!=null) {
 if (id!=null) node = document.getElementById(id);
 if (node==null) {
//alert(dnode.childNodes.length)
 node = createElementXHTML("div");
 node.setAttribute("id", id);
 node.style.position = "absolute";
 dnode.appendChild(node);
 }
 while (node.childNodes.length>0) node.removeChild(node.lastChild); 
 node.appendChild(document.createTextNode(str));
 if (/`/.test(str)) ASAMprocessNode(node); else ASLMprocessNode(node);
 dx = -node.offsetWidth/2;
 dy = -node.offsetHeight/2;
 if (pos!=null) {
 if (/above/.test(pos)) dy = -node.offsetHeight;
 if (/below/.test(pos)) dy = 0;
 if (/right/.test(pos)) dx = 0;
 if ( /left/.test(pos)) dx = -node.offsetWidth;
 }
 node.style.left = ""+(p[0]*xunitlength+origin[0]+dx)+"px";
 node.style.top = ""+(height-p[1]*yunitlength-origin[1]+dy)+"px";
 }
 return p;
 }
 var textanchor = "middle"; // regular text goes into SVG
 if (pos!=null) {
 if (/above/.test(pos)) dy = -fontsize/2;
 if (/below/.test(pos)) dy = fontsize-0;
 if (/right/.test(pos)) {textanchor = "start"; dx = fontsize/4;}
 if ( /left/.test(pos)) {textanchor = "end"; dx = -fontsize/4;}
 }
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("text");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 node.appendChild(doc.createTextNode(str));
 }
 while (node.childNodes.length>1) node.removeChild(node.lastChild); 
 node.lastChild.nodeValue = "\xA0"+str+"\xA0";
 node.setAttribute("x",p[0]*xunitlength+origin[0]+dx);
 node.setAttribute("y",height-p[1]*yunitlength-origin[1]+dy);
 node.setAttribute("font-style",(fontsty!=null?fontsty:
 (str.search(/^[a-zA-Z]$/)!=-1?"italic":fontstyle)));
 node.setAttribute("font-family",fontfamily);
 node.setAttribute("font-size",fontsize);
 node.setAttribute("font-weight",fontweight);
 node.setAttribute("text-anchor",textanchor);
 if (fontstroke!="none") node.setAttribute("stroke",fontstroke);
 if (fontfill!="none") node.setAttribute("fill",fontfill);
 return p;
}

function mtext(p,st,pos,fontsty,fontsz) { // method for updating text on an svg
// "this" is the text object or the svgpicture object
 var textanchor = "middle";
 var dx = 0; var dy = fontsize/3;
 if (pos!=null) {
 if (pos.slice(0,5)=="above") dy = -fontsize/2;
 if (pos.slice(0,5)=="below") dy = fontsize-0;
 if (pos.slice(0,5)=="right" || pos.slice(5,10)=="right") {
 textanchor = "start";
 dx = fontsize/2;
 }
 if (pos.slice(0,4)=="left" || pos.slice(5,9)=="left") {
 textanchor = "end";
 dx = -fontsize/2;
 }
 }
 var node = this;
 if (this.nodeName=="svg") {
 node = myCreateElementSVG("text");
 this.appendChild(node);
 node.appendChild(doc.createTextNode(st));
 }
 node.lastChild.nodeValue = st;
 node.setAttribute("x",p[0]+dx);
 node.setAttribute("y",p[1]+dy);
 node.setAttribute("font-style",(fontsty!=null?fontsty:fontstyle));
 node.setAttribute("font-family",fontfamily);
 node.setAttribute("font-size",(fontsz!=null?fontsz:fontsize));
 node.setAttribute("font-weight",fontweight);
 node.setAttribute("text-anchor",textanchor);
 if (fontstroke!="none") node.setAttribute("stroke",fontstroke);
 if (fontfill!="none") node.setAttribute("fill",fontfill);
}

function image(imgurl,p,w,h,id) { // not working yet
 var node;
 if (id!=null) node = doc.getElementById(id);
 if (node==null) {
 node = myCreateElementSVG("image");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("x",p[0]*xunitlength+origin[0]);
 node.setAttribute("y",height-p[1]*yunitlength-origin[1]);
 node.setAttribute("width",w);
 node.setAttribute("height",h);
 node.setAttribute("xlink:href", imgurl);
}

function ASdot(center,radius,s,f) { // coordinates in units, radius in pixel
 if (s==null) s = stroke; if (f==null) f = fill;
 var node = myCreateElementSVG("circle");
 node.setAttribute("cx",center[0]*xunitlength+origin[0]);
 node.setAttribute("cy",height-center[1]*yunitlength-origin[1]);
 node.setAttribute("r",radius);
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", s);
 node.setAttribute("fill", f);
 svgpicture.appendChild(node);
}

function dot(center, typ, label, pos, id) {
 var node;
 var cx = center[0]*xunitlength+origin[0];
 var cy = height-center[1]*yunitlength-origin[1];
 if (id!=null) node = doc.getElementById(id);
 if (typ=="+" || typ=="-" || typ=="|") {
 if (node==null) {
 node = myCreateElementSVG("path");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 if (typ=="+") {
 node.setAttribute("d",
 " M "+(cx-ticklength)+" "+cy+" L "+(cx+ticklength)+" "+cy+
 " M "+cx+" "+(cy-ticklength)+" L "+cx+" "+(cy+ticklength));
 node.setAttribute("stroke-width", .5);
 node.setAttribute("stroke", axesstroke);
 } else {
 if (typ=="-") node.setAttribute("d",
 " M "+(cx-ticklength)+" "+cy+" L "+(cx+ticklength)+" "+cy);
 else node.setAttribute("d",
 " M "+cx+" "+(cy-ticklength)+" L "+cx+" "+(cy+ticklength));
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 }
 } else {
 if (node==null) {
 node = myCreateElementSVG("circle");
 node.setAttribute("id", id);
 svgpicture.appendChild(node);
 }
 node.setAttribute("cx",cx);
 node.setAttribute("cy",cy);
 node.setAttribute("r",dotradius);
 node.setAttribute("stroke-width", strokewidth);
 node.setAttribute("stroke", stroke);
 node.setAttribute("fill", (typ=="open"?"white":
 (typ=="closed"?stroke:markerfill)));
 }
 if (label!=null) 
 text(center,label,(pos==null?"below":pos),(id==null?id:id+"label"))
}

point = dot; //alternative name

function arrowhead(p,q) { // draw arrowhead at q (in units) add size param
 var up;
 var v = [p[0]*xunitlength+origin[0],height-p[1]*yunitlength-origin[1]];
 var w = [q[0]*xunitlength+origin[0],height-q[1]*yunitlength-origin[1]];
 var u = [w[0]-v[0],w[1]-v[1]];
 var d = Math.sqrt(u[0]*u[0]+u[1]*u[1]);
 if (d > 0.00000001) {
 u = [u[0]/d, u[1]/d];
 up = [-u[1],u[0]];
 var node = myCreateElementSVG("path");
 node.setAttribute("d","M "+(w[0]-15*u[0]-4*up[0])+" "+
 (w[1]-15*u[1]-4*up[1])+" L "+(w[0]-3*u[0])+" "+(w[1]-3*u[1])+" L "+
 (w[0]-15*u[0]+4*up[0])+" "+(w[1]-15*u[1]+4*up[1])+" z");
 node.setAttribute("stroke-width", markerstrokewidth);
 node.setAttribute("stroke", stroke); /*was markerstroke*/
 node.setAttribute("fill", stroke); /*was arrowfill*/
 node.setAttribute("stroke-opacity", strokeopacity);
 node.setAttribute("fill-opacity", fillopacity);
 svgpicture.appendChild(node); 
 }
}

function chopZ(st) {
 var k = st.indexOf(".");
 if (k==-1) return st;
 for (var i=st.length-1; i>k && st.charAt(i)=="0"; i--);
 if (i==k) i--;
 return st.slice(0,i+1);
}

function grid(dx,dy) { // for backward compatibility
 axes(dx,dy,null,dx,dy)
}

function noaxes() {
 if (!initialized) initPicture();
}

function axes(dx,dy,labels,gdx,gdy) {
//xscl=x is equivalent to xtick=x; xgrid=x; labels=true;
 var x, y, ldx, ldy, lx, ly, lxp, lyp, pnode, st;
 if (!initialized) initPicture();
 if (typeof dx=="string") { labels = dx; dx = null; }
 if (typeof dy=="string") { gdx = dy; dy = null; }
 if (xscl!=null) {dx = xscl; gdx = xscl; labels = dx}
 if (yscl!=null) {dy = yscl; gdy = yscl}
 if (xtick!=null) {dx = xtick}
 if (ytick!=null) {dy = ytick}
 dx = (dx==null?xunitlength:dx*xunitlength);
 dy = (dy==null?dx:dy*yunitlength);
 fontsize = Math.min(dx/2,dy/2,16); //alert(fontsize)
 ticklength = fontsize/4;
 if (xgrid!=null) gdx = xgrid;
 if (ygrid!=null) gdy = ygrid;
 if (gdx!=null) {
 gdx = (typeof gdx=="string"?dx:gdx*xunitlength);
 gdy = (gdy==null?dy:gdy*yunitlength);
 pnode = myCreateElementSVG("path");
 st="";
 for (x = origin[0]; x<width; x = x+gdx)
 st += " M"+x+",0"+" "+x+","+height;
 for (x = origin[0]-gdx; x>0; x = x-gdx)
 st += " M"+x+",0"+" "+x+","+height;
 for (y = height-origin[1]; y<height; y = y+gdy)
 st += " M0,"+y+" "+width+","+y;
 for (y = height-origin[1]-gdy; y>0; y = y-gdy)
 st += " M0,"+y+" "+width+","+y;
 pnode.setAttribute("d",st);
 pnode.setAttribute("stroke-width", .5);
 pnode.setAttribute("stroke", gridstroke);
 pnode.setAttribute("fill", fill);
 svgpicture.appendChild(pnode);
 }
 pnode = myCreateElementSVG("path");
 st="M0,"+(height-origin[1])+" "+width+","+
 (height-origin[1])+" M"+origin[0]+",0 "+origin[0]+","+height;
 for (x = origin[0]+dx; x<width; x = x+dx)
 st += " M"+x+","+(height-origin[1]+ticklength)+" "+x+","+
 (height-origin[1]-ticklength);
 for (x = origin[0]-dx; x>0; x = x-dx)
 st += " M"+x+","+(height-origin[1]+ticklength)+" "+x+","+
 (height-origin[1]-ticklength);
 for (y = height-origin[1]+dy; y<height; y = y+dy)
 st += " M"+(origin[0]+ticklength)+","+y+" "+(origin[0]-ticklength)+","+y;
 for (y = height-origin[1]-dy; y>0; y = y-dy)
 st += " M"+(origin[0]+ticklength)+","+y+" "+(origin[0]-ticklength)+","+y;
 if (labels!=null) with (Math) {
 ldx = dx/xunitlength;
 ldy = dy/yunitlength;
 lx = (xmin>0 || xmax<0?xmin:0);
 ly = (ymin>0 || ymax<0?ymin:0);
 lxp = (ly==0?"below":"above");
 lyp = (lx==0?"left":"right");
 var ddx = floor(1.1-log(ldx)/log(10))+1;
 var ddy = floor(1.1-log(ldy)/log(10))+1;
 for (x = ldx; x<=xmax; x = x+ldx)
 text([x,ly],chopZ(x.toFixed(ddx)),lxp);
 for (x = -ldx; xmin<=x; x = x-ldx)
 text([x,ly],chopZ(x.toFixed(ddx)),lxp);
 for (y = ldy; y<=ymax; y = y+ldy)
 text([lx,y],chopZ(y.toFixed(ddy)),lyp);
 for (y = -ldy; ymin<=y; y = y-ldy)
 text([lx,y],chopZ(y.toFixed(ddy)),lyp);
 }
 fontsize = defaultfontsize;
 pnode.setAttribute("d",st);
 pnode.setAttribute("stroke-width", .5);
 pnode.setAttribute("stroke", axesstroke);
 pnode.setAttribute("fill", fill);
 pnode.setAttribute("stroke-opacity", strokeopacity);
 pnode.setAttribute("fill-opacity", fillopacity);
 svgpicture.appendChild(pnode);
}

function mathjs(st) {
 //translate a math formula to js function notation
 // a^b --> pow(a,b)
 // na --> n*a
 // (...)d --> (...)*d
 // n! --> factorial(n)
 // sin^-1 --> arcsin etc.
 //while ^ in string, find term on left and right
 //slice and concat new formula string
 st = st.replace(/\s/g,"");
 if (st.indexOf("^-1")!=-1) {
 st = st.replace(/sin\^-1/g,"arcsin");
 st = st.replace(/cos\^-1/g,"arccos");
 st = st.replace(/tan\^-1/g,"arctan");
 st = st.replace(/sec\^-1/g,"arcsec");
 st = st.replace(/csc\^-1/g,"arccsc");
 st = st.replace(/cot\^-1/g,"arccot");
 st = st.replace(/sinh\^-1/g,"arcsinh");
 st = st.replace(/cosh\^-1/g,"arccosh");
 st = st.replace(/tanh\^-1/g,"arctanh");
 st = st.replace(/sech\^-1/g,"arcsech");
 st = st.replace(/csch\^-1/g,"arccsch");
 st = st.replace(/coth\^-1/g,"arccoth");
 }
 st = st.replace(/^e$/g,"(Math.E)");
 st = st.replace(/^e([^a-zA-Z])/g,"(Math.E)$1");
 st = st.replace(/([^a-zA-Z])e/g,"$1(Math.E)");
// st = st.replace(/([^a-zA-Z])e([^a-zA-Z])/g,"$1(Math.E)$2");
 st = st.replace(/([0-9])([\(a-zA-Z])/g,"$1*$2");
 st = st.replace(/\)([\(0-9a-zA-Z])/g,"\)*$1");
 var i,j,k, ch, nested;
 while ((i=st.indexOf("^"))!=-1) {
 //find left argument
 if (i==0) return "Error: missing argument";
 j = i-1;
 ch = st.charAt(j);
 if (ch>="0" && ch<="9") {// look for (decimal) number
 j--;
 while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
 if (ch==".") {
 j--;
 while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
 }
 } else if (ch==")") {// look for matching opening bracket and function name
 nested = 1;
 j--;
 while (j>=0 && nested>0) {
 ch = st.charAt(j);
 if (ch=="(") nested--;
 else if (ch==")") nested++;
 j--;
 }
 while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
 j--;
 } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
 j--;
 while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
 j--;
 } else { 
 return "Error: incorrect syntax in "+st+" at position "+j;
 }
 //find right argument
 if (i==st.length-1) return "Error: missing argument";
 k = i+1;
 ch = st.charAt(k);
 if (ch>="0" && ch<="9" || ch=="-") {// look for signed (decimal) number
 k++;
 while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
 if (ch==".") {
 k++;
 while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
 }
 } else if (ch=="(") {// look for matching closing bracket and function name
 nested = 1;
 k++;
 while (k<st.length && nested>0) {
 ch = st.charAt(k);
 if (ch=="(") nested++;
 else if (ch==")") nested--;
 k++;
 }
 } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
 k++;
 while (k<st.length && (ch=st.charAt(k))>="a" && ch<="z" ||
 ch>="A" && ch<="Z") k++;
 } else { 
 return "Error: incorrect syntax in "+st+" at position "+k;
 }
 st = st.slice(0,j+1)+"Math.pow("+st.slice(j+1,i)+","+st.slice(i+1,k)+")"+
 st.slice(k);
 }
 while ((i=st.indexOf("!"))!=-1) {
 //find left argument
 if (i==0) return "Error: missing argument";
 j = i-1;
 ch = st.charAt(j);
 if (ch>="0" && ch<="9") {// look for (decimal) number
 j--;
 while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
 if (ch==".") {
 j--;
 while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
 }
 } else if (ch==")") {// look for matching opening bracket and function name
 nested = 1;
 j--;
 while (j>=0 && nested>0) {
 ch = st.charAt(j);
 if (ch=="(") nested--;
 else if (ch==")") nested++;
 j--;
 }
 while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
 j--;
 } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
 j--;
 while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
 j--;
 } else { 
 return "Error: incorrect syntax in "+st+" at position "+j;
 }
 st = st.slice(0,j+1)+"factorial("+st.slice(j+1,i)+")"+st.slice(i+1);
 }
 return st;
}

function plot(fun,x_min,x_max,points,id,min_type,max_type) {
 var pth = [];
 var f = function(x) { return x }, g = fun;
 var name = null;
 if (typeof fun=="string") 
 eval("g = function(x){ with(Math) return "+mathjs(fun)+" }");
 else if (typeof fun=="object") {
 eval("f = function(t){ with(Math) return "+mathjs(fun[0])+" }");
 eval("g = function(t){ with(Math) return "+mathjs(fun[1])+" }");
 }
 if (typeof x_min=="string") { name = x_min; x_min = xmin }
 else name = id;
 var min = (x_min==null?xmin:x_min);
 var max = (x_max==null?xmax:x_max);
 if (max <= min) { return null;}
 //else {
 var inc = max-min-0.000001*(max-min);
 inc = (points==null?inc/200:inc/points);
 var gt;
//alert(typeof g(min))
 for (var t = min; t <= max; t += inc) {
 gt = g(t);
 if (!(isNaN(gt)||Math.abs(gt)=="Infinity")) pth[pth.length] = [f(t), gt];
 }
 path(pth,name);
 if (min_type == 1) {
 arrowhead(pth[1],pth[0]);
 } else if (min_type == 2) {
 dot(pth[0], "open");
 } else if (min_type == 3) {
 dot(pth[0], "closed");
 }
 if (max_type == 1) {
 arrowhead(pth[pth.length-2],pth[pth.length-1]);
 } else if (max_type == 2) {
 dot(pth[pth.length-1], "open");
 } else if (max_type == 3) {
 dot(pth[pth.length-1], "closed");
 }

 return pth;
 //}
}

// make polar plot

// make Riemann sums

function slopefield(fun,dx,dy) {
 var g = fun;
 if (typeof fun=="string") 
 eval("g = function(x,y){ with(Math) return "+mathjs(fun)+" }");
 var gxy,x,y,u,v,dz;
 if (dx==null) dx=1;
 if (dy==null) dy=1;
 dz = Math.sqrt(dx*dx+dy*dy)/6;
 var x_min = Math.ceil(xmin/dx);
 var y_min = Math.ceil(ymin/dy);
 for (x = x_min; x <= xmax; x += dx)
 for (y = y_min; y <= ymax; y += dy) {
 gxy = g(x,y);
 if (!isNaN(gxy)) {
 if (Math.abs(gxy)=="Infinity") {u = 0; v = dz;}
 else {u = dz/Math.sqrt(1+gxy*gxy); v = gxy*u;}
 line([x-u,y-v],[x+u,y+v]);
 }
 }
}

///////////////////////user graphics commands end here/////////////////////////

function show_props(obj) {
 var result = "";
 for (var i=0; i< obj.childNodes.length; i++)
 result += obj.childNodes.item(i) + "\n";
 return result;
}

function displayCoord(evt) {
 if (showcoordinates) {
 var svgroot = evt.target.parentNode;
 var nl = svgroot.childNodes;
 for (var i=0; i<nl.length && nl.item(i).nodeName!="text"; i++);
 var cnode = nl.item(i);
 cnode.mtext = mtext;
 cnode.mtext([svgroot.getAttribute("width")-(-7),svgroot.getAttribute("height")-7],"("+getX(evt).toFixed(2)+", "+getY(evt).toFixed(2)+")", "left", "", "11");
 }
}

function removeCoord(evt) {
 var svgroot = evt.target.parentNode;
 var nl = svgroot.childNodes;
 for (var i=0; i<nl.length && nl.item(i).nodeName!="text"; i++);
 var cnode = nl.item(i);
 cnode.mtext = mtext;
 cnode.mtext([svgroot.getAttribute("width")-0,svgroot.getAttribute("height")-0],"", "aboveleft", "");
}
function updateCoords(ind) {
 switchTo("picture"+(ind+1));
 var gx=getX(), gy=getY();
 if ((xmax-gx)*xunitlength > 6*fontsize || (gy-ymin)*yunitlength > 2*fontsize)
 text([xmax,ymin],"("+gx.toFixed(2)+", "+gy.toFixed(2)+")",
 "aboveleft","AScoord"+ind,"");
 else text([xmax,ymin]," ","aboveleft","AScoord"+ind,"");
}

function initASCIIMathCalculators(li) {
 var i;
 for (i=0; i<li.length; i++) {
 li[i].innerHTML = calcstr;
 ASAMprocessNode(li[i]);
 }
 li = document.getElementsByTagName("textarea");
 var st;
 for (i=0; i<li.length; i++) {
 st = li[i].getAttribute("onkeyup");
 if (st!=null) eval(String(st).replace(/function anonymous\(\)/,""));
 }
}

function calculate(inputId,outputId) {
 var str = document.getElementById(inputId).value;
 var err = "";
 var ind = str.lastIndexOf("\n");
 if (ind==str.length-1) str = str.slice(0,ind);
 str = str.slice(str.lastIndexOf("\n")+1);
 try {
 var res = eval(mathjs(str));
 } catch(e) {
 err = "syntax incomplete";
 }
 if (!isNaN(res) && res!="Infinity") 
 str = "`"+str+" =` "+(Math.abs(res-Math.round(res*1000000)/1000000)<1e-15?Math.round(res*1000000)/1000000:res)+err; 
 else if (str!="") str = "`"+str+"` = undefined"; //debug:+mathjs(str);
 var outnode = document.getElementById(outputId);
 var n = outnode.childNodes.length;
 for (var i=0; i<n; i++)
 outnode.removeChild(outnode.firstChild);
 outnode.appendChild(document.createTextNode(str));
 ASAMprocessNode(outnode);
}

function append(st){
 document.getElementById('in').value+=st;
 calculate('in','out');
 document.getElementById('in').scrollTop = 1000;
 document.getElementById('in').focus();
}

function clearTextArea(){
 document.getElementById('in').value="";
 calculate('in','out');
 document.getElementById('in').focus();
}

var calcstr = "<table align=\"center\">\n<tr><th>\nASCIIMath Scientific Calculator\n</th></tr>\n<tr><td>\nClick in the box to use your keyboard or use the buttons\n</td></tr>\n<tr><td align=\"center\">\n<textarea id=\"in\" rows=\"3\" cols=\"40\" onkeyup=\"calculate('in','out')\"></textarea></td></tr>\n<tr align=\"center\"><td height=\"50\"><span id=\"out\"></span></td></tr>\n</table>\n<table class=\"calcbutton\" align=\"center\" cellspacing=\"0\" cellpadding=\"0\">\n<tbody align=\"center\">\n<tr>\n<td colspan=\"5\">\n<button onclick=\"append('sin^-1(')\"> sin<sup>-1</sup> </button><button onclick=\"append('cos^-1(')\"> cos<sup>-1</sup> </button><button onclick=\"append('tan^-1(')\"> tan<sup>-1</sup> </button></td>\n</tr>\n<tr>\n<td><button onclick=\"append('^')\"> x<sup>y</sup> </button></td>\n<td><button onclick=\"append('sin(')\"> sin </button></td>\n<td><button onclick=\"append('cos(')\"> cos </button></td>\n<td><button onclick=\"append('tan(')\"> tan </button></td>\n<td><button onclick=\"clearTextArea()\"> C </button></td></tr>\n<tr>\n<td><button onclick=\"append('!')\"> ! </button></td>\n<td><button onclick=\"append('(')\"> ( </button></td>\n<td><button onclick=\"append(')')\"> ) </button></td>\n<td><button onclick=\"append('sqrt(')\">\u221A<span style='border-top:thin solid'> x&nbsp;</span></button></td>\n<td><button onclick=\"append('/')\"> \u00F7 </button></td>\n</tr>\n<tr>\n<td><button onclick=\"append('log(')\"> log </button></td>\n<td><button onclick=\"append('7')\"> 7 </button></td>\n<td><button onclick=\"append('8')\"> 8 </button></td>\n\n<td><button onclick=\"append('9')\"> 9 </button></td>\n<td><button onclick=\"append('*')\"> \u00D7 </button></td>\n</tr>\n<tr>\n<td><button onclick=\"append('ln(')\"> ln </button></td>\n<td><button onclick=\"append('4')\"> 4 </button></td>\n<td><button onclick=\"append('5')\"> 5 </button></td>\n<td><button onclick=\"append('6')\"> 6 </button></td>\n\n<td><button onclick=\"append('-')\"> \u2212 </button></td>\n</tr>\n<tr>\n<td><button onclick=\"append('e')\"> e </button></td>\n<td><button onclick=\"append('1')\"> 1 </button></td>\n<td><button onclick=\"append('2')\"> 2 </button></td>\n<td><button onclick=\"append('3')\"> 3 </button></td>\n<td><button onclick=\"append('+')\"> + </button></td>\n\n</tr>\n<tr>\n<td><button onclick=\"append('pi')\">\u03C0</button></td>\n<td><button onclick=\"append('0')\"> 0 </button></td>\n<td><button onclick=\"append('.')\"> . </button></td>\n<td> <!--button onclick=\"append('pi')\">`pi` </button--></td>\n<td><button onclick=\"append('\\n')\"> = </button></td>\n</tr>\n</tbody>\n</table>";


function updateCoords0() {updateCoords(0)}
function updateCoords1() {updateCoords(1)}
function updateCoords2() {updateCoords(2)}
function updateCoords3() {updateCoords(3)}
function updateCoords4() {updateCoords(4)}
function updateCoords5() {updateCoords(5)}
function updateCoords6() {updateCoords(6)}
function updateCoords7() {updateCoords(7)}
function updateCoords8() {updateCoords(8)}
function updateCoords9() {updateCoords(9)}
ASfn = [function() {updatePicture(0)},
 function() {updatePicture(1)},
 function() {updatePicture(2)},
 function() {updatePicture(3)},
 function() {updatePicture(4)},
 function() {updatePicture(5)},
 function() {updatePicture(6)},
 function() {updatePicture(7)},

 function() {updatePicture(8)},
 function() {updatePicture(9)}];
ASupdateCoords = [function() {updateCoords(0)},
 function() {updateCoords(1)},
 function() {updateCoords(2)},
 function() {updateCoords(3)},
 function() {updateCoords(4)},
 function() {updateCoords(5)},
 function() {updateCoords(6)},
 function() {updateCoords(7)},
 function() {updateCoords(8)},
 function() {updateCoords(9)}];
//end of asciimathml.js
function generic()
{
 if(!AMinit()) return;
 if (translateOnLoad) {
 var nd = document.getElementById("processasciimathinmoodle");
 if (nd!=null || !checkforprocessasciimathinmoodle) {
 AMtranslate();
 }
 }
 drawPictures();
 if(!init()) return;
 if (translateOnLoad) {
 var nd = document.getElementById("processasciimathinmoodle");
 if (nd!=null) dsvglocation = nd.className;
 if (nd!=null || !checkforprocessasciimathinmoodle) {
 translate();
 if (!isIE && translateASCIIsvg) drawPictures();
 }
 var li = getElementsByClass(document,"div","ASCIIMathCalculator");
 if (li.length>0) initASCIIMathCalculators(li);
 }
};
//setup onload function
if(typeof window.addEventListener != 'undefined')
{
 //.. gecko, safari, konqueror and standard
 window.addEventListener('load', generic, false);
}
else if(typeof document.addEventListener != 'undefined')
{
 //.. opera 7
 document.addEventListener('load', generic, false);
}
else if(typeof window.attachEvent != 'undefined')
{
 //.. win/ie
 window.attachEvent('onload', generic);
}
//** remove this condition to degrade older browsers
else
{
 //.. mac/ie5 and anything else that gets this far
 //if there's an existing onload function
 if(typeof window.onload == 'function')
 {
 //store it
 var existing = onload;
 //add new onload handler
 window.onload = function()
 {
 //call existing onload function
 existing();
 //call generic onload function
 generic();
 };
 }
 else
 {
 //setup onload function
 window.onload = generic;
 }
}
if (checkIfSVGavailable) {
 checkifSVGavailable = false;
 nd = isSVGavailable();
 ASnoSVG = nd!=null;
}
