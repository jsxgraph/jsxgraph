JSXGraph server scripts
=======================

JSXGraph is a cross-browser library for interactive geometry, function plotting,
graphs, and data visualization in a web browser. It is implemented completely in
JavaScript and uses SVG and VML.
Using the JSXGraph server scripts it is possible to do computations with software
not running in a browser and use the results in JSXGraph, e.g. it is possible to
compute the polynomial equation of the geometric locus of a point in a construction,
use matplotlib to extract the points of the graph and return a list of points and
plot that points in JSXGraph.

Scripts available:
  * jxggroebner.py

General configuration
=====================

By default server scripts are stored in the server subdirectory of the JavaScript
files. If yout want the scripts in another place you'll have to adjust
        JXG.serverBase
either directly in JSX source (loadjsxgraph[InOneFile].js) or by setting it in a
javascript in your page after loading jsxgraph.

jxggroebner.py
==============

 + Required software
 ===================

   * CoCoA (http://cocoa.dima.unige.it/)
   * Python (http://python.org/)
   * numpy (http://numpy.scipy.org/)
   * matplotlib (http://matplotlib.sourceforge.net/)

 + Setup
 =======

 Install CoCoA so it can be started by just typing cocoa in a terminal or adjust
 the configuration in jsxgroebner.py. Install all of the python packages.

 Your webserver has to be configured to execute python .py scripts as cgi, e.g.
 for Apache you have to configure
         Options +ExecCGI
         AddHandler cgi-script .py
 for the directory JSXGraph server scripts are in.

 It is highly recommended to adjust the os.environ['MPLCONFIGDIR'] variable in
 the script or setting the variable $MPLCONFIGDIR for the webserver environment
 to somewhere more persistent than '/tmp' and writable by the webserver. If you
 don't do this, the matplotlib configuration will be erased at times (e.g. the
 server gets rebooted) and every first plot after matplotlib config erasure
 takes much more time because of matplotlib generating a new default config in
 that place.
