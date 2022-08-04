JSXGraph
========

JavaScript library for interactive math visualizations in the web browser.

About
-----

*JSXGraph* is a cross-browser library for interactive geometry, function plotting,
charting, and data visualization in a web browser. It is implemented completely
in JavaScript, does not rely on any other library, and uses SVG, canvas, or even the venerable VML.
*JSXGraph* is easy to embed and has a small footprint: approx. 160 KByte if
embedded in a web page. No plug-ins are required! Special care has been taken
to optimize the performance.

*JSXGraph* supports multi-touch events and runs on all major browsers, even on very old IEs.

*JSXGraph* is developed at the
Lehrstuhl für Mathematik und ihre Didaktik
University of Bayreuth, Germany

Upcoming event: 3rd JSXGraph conference (online)
--------------

Date: October 4th - 6th, 2022

Conference homepage: <https://jsxgraph.org/conf2022/>

The conference will bring together developers and teachers, instructors and designers who are interested or already experienced in using JSXGraph (https://jsxgraph.org) to enhance digital learning of STEM topics.

The conference will be an entirely online conference. All participants are required to register (https://jsxgraph.org/conf2022/registration/), registration is free.

We invite all participants to contribute a talk or workshop and

- report about their concepts, experience, and workflow,
- present their applications and best practices,
- discuss pedagogical concepts involving JSXGraph.

Deadline for submission of talks / presentations: 31. August 2022

Details about the conference software will be announced at a later stage.

The 3nd International JSXGraph conference 2022 will be organized by the center of Mobile Learning with Digital Technology (https://mobiles-lernen.uni-bayreuth.de/) at the University of Bayreuth, Germany.


Website
-------

* Project web site: https://jsxgraph.org/
* Project wiki with hundreds of examples: https://jsxgraph.org/wiki/
* GitHub project site: https://github.com/jsxgraph/jsxgraph
* Mailing List/Google Group: https://groups.google.com/group/jsxgraph
* JSXGraph questions at https://stackoverflow.com/search?tab=newest&q=jsxgraph
* jsFiddle template: https://jsfiddle.net/8kep9syd/
* Moodle filter: https://github.com/jsxgraph/moodle-filter_jsxgraph
* (outdated: SourceForge project site: https://sf.net/projects/jsxgraph)
* CDNs: Embed JSXGraph via

```
<script type="text/javascript" charset="UTF-8"
 src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
<link rel="stylesheet"
 type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
 ```

or

```
<script type="text/javascript" charset="UTF-8"
 src="//cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.2.3/jsxgraphcore.js"></script>
<link rel="stylesheet"
 type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.2.3/jsxgraph.css" />
```

Please report bugs to our issue tracking system found at
https://github.com/jsxgraph/jsxgraph/issues

Usage
-----

Include 

* `jsxgraphcore.js` and 
* `jsxgraph.css` and, 
* if required, one or more file readers 

from a CDN or a local version in your HTML file. 

For developing content, it is recommended to include `jsxgraphsrc.js` (`jsxgraphcore.js` is the minified version of `jsxgraphsrc.js`).
For further usage instructions please consult our [wiki](https://jsxgraph.org/wiki/)
especially our [tutorials](https://jsxgraph.org/wiki/index.php/Documentation)
or [the API reference docs](https://jsxgraph.org/docs/).

Build and develop JSXGraph
--------------

1) Clone this repository or download the zip file.

2) In order to build and develop *JSXGraph* you need [node.js](https://nodejs.org/) v0.6+. First, install all
dependencies required to build JSXGraph using npm in the JSXGraph root directory: `$ npm install`.
This will create a new subdirectory ```node_modules``` in the JSXGraph root directory which holds
all tools and libraries required to build ```jsxgraphcore.js```. 

3) To build JSXGraph run `$ make core` which will output an unminified version ```jsxgraphsrc.js```  and the minified version ```jsxgraphcore.js``` in ```distrib```.


License
-------

    Copyright 2008-2022
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Emmanuel Ostenne,
        Bianca Valentin,
        Heiko Vogel,
        Alfred Wassermann,
        Peter Wilfahrt


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

[![ITEMS](img/items_logo_blue.png)](https://itemspro.eu)
[![Cofunded by the Erasmus+ programme of the European union](img/eu_flag_co_funded_pos_rgb_left_small.jpg)](https://ec.europa.eu/programmes/erasmus-plus/)
