JSXGraph
========

Interactive Math Library for the Web.

    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Emmanuel Ostenne,
        Bianca Valentin,
        Heiko Vogel,
        Alfred Wassermann,
        Peter Wilfahrt

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

* Project web site: http://jsxgraph.uni-bayreuth.de/
* Project wiki with hundreds of examples: http://jsxgraph.uni-bayreuth.de/wiki/
* SourceForge project site: http://sf.net/projects/jsxgraph
* GitHub project site: https://github.com/jsxgraph/jsxgraph
* Mailing List/Google Group: http://groups.google.com/group/jsxgraph

Please report bugs to our issue tracking system found at
https://github.com/jsxgraph/jsxgraph/issues


Build JSXGraph
--------------

In order to build JSXGraph you need Python 2 or later, yuglify, and to build the
reference docs you need jsdoc-toolkit 2.3.2 or later.

To build JSXGraph core type

    $ python make.py --yuglify=/path/to/yuglify --output=/output/dir Core

This will concatenate all core files (basically all .js files in src/ except
loadjsxgraph.js and all files in src/reader except file.js), strip all comments
and minify the file into /output/dir/jsxgraphcore.js.


Usage
-----

Include jsxgraphcore.js and, if required, one or more file readers in your HTML
file. For further usage instructions please consult our [wiki](http://jsxgraph.uni-bayreuth.de/wiki/)
especially our [tutorials](http://jsxgraph.uni-bayreuth.de/wiki/index.php/Documentation)
or [the API reference docs](http://jsxgraph.uni-bayreuth.de/docs/).


License
-------

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
