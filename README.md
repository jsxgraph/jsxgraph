JSXGraph
========

Interactive Math Library for the Web.

    Copyright 2008-2018
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

* Project web site: https://jsxgraph.org/
* Project wiki with hundreds of examples: https://jsxgraph.org/wiki/
* GitHub project site: https://github.com/jsxgraph/jsxgraph
* Mailing List/Google Group: http://groups.google.com/group/jsxgraph
* JSXGraph questions at https://stackoverflow.com/search?tab=newest&q=jsxgraph
* jsFiddle template: https://jsfiddle.net/vcL7aepo/1/
* Moodle plug-in: https://github.com/jsxgraph/moodle-jsxgraph-plugin
* (outdated: SourceForge project site: https://sf.net/projects/jsxgraph)

Please report bugs to our issue tracking system found at
https://github.com/jsxgraph/jsxgraph/issues


Build JSXGraph
--------------

In order to build JSXGraph you need [node.js](http://nodejs.org/) v0.6+. First, install all
dependencies required to build JSXGraph using npm in the JSXGraph root directory:

    $ npm install

This will create a new subdirectory ```node_modules``` in the JSXGraph root directory which holds
all tools and libraries required to build ```jsxgraphcore.js``` and run JSXGraph inside node. To build
JSXGraph run

    $ make core

which will output an unminified version of ```jsxgraphcore.js``` in ```build/bin```. To build a minified
version run

    $ make core-min


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
