JSXGraph
========

Interactive Math Library for the Web.

Copyright 2008-2011
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

JSXGraph is licensed under GNU Lesser General Public License, Version 3.0
http://www.gnu.org/licenses/lgpl.txt


About
-----

JSXGraph is a cross-browser library for interactive geometry, function plotting,
charting, and data visualization in a web browser. It is implemented completely
in JavaScript, does not rely on any other library, and uses SVG, VML, or canvas.
JSXGraph is easy to embed and has a small footprint: less than 100 KByte if
embedded in a web page. No plug-ins are required! Special care has been taken
to optimize the performance.

Starting with version 0.80, JSXGraph supports multitouch devices like the Apple
iPad. Since version 0.82 the canvas element is supported, too. That means,
JSXGraph also runs on Android devices.

JSXGraph is developed at the
Lehrstuhl für Mathematik und ihre Didaktik
University of Bayreuth, Germany


Website
-------

Project web site: http://jsxgraph.uni-bayreuth.de/
Project wiki with hundreds of examples: http://jsxgraph.uni-bayreuth.de/wiki/
SourceForge Project site: http://sf.net/projects/jsxgraph
Mailing List/Google Group: http://groups.google.com/group/jsxgraph

Please report bugs to our issue tracking system found at
http://www.sf.net/apps/trac/jsxgraph


Build JSXGraph
--------------

In order to build JSXGraph you need Python 2 or later, YUI Compressor 2.x.x or
later, and to build the reference docs you need jsdoc-toolkit 2.3.2 or later.

To build JSXGraph core type

    $ python make.py --yui=/path/to/yui --output=/output/dir Core

This will concatenate all core files (basically all .js files in src/ except
loadjsxgraph.js and {Geonext,GeoGebra,Cinderella,Graph,Intergeo}Reader.js),
strip all comments and minify the file into /output/dir/jsxgraphcore.js.


Usage
-----

Include jsxgraphcore.js and, if required, one or more *Reader.js in your HTML
file. For further usage instructions please consult our wiki

    http://jsxgraph.uni-bayreuth.de/wiki/

especially our tutorials located at

    http://jsxgraph.uni-bayreuth.de/wiki/index.php/Documentation

or our reference docs at

    http://jsxgraph.uni-bayreuth.de/docs/



