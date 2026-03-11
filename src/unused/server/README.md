# JSXGraph server scripts

__Update 18.10.2024__

Since v1.10.1 this module is retired !

The server module needs a complete rewrite. The installation is error prone,
since python 3.13 the module `cgi` is not longer supported.
A modern implementation would use a different approach with nodejs or
a comparable system for python.

## Description

JSXGraph is a cross-browser library for interactive geometry, function plotting,
graphs, and data visualization in a web browser. It is implemented completely in
JavaScript and uses SVG and VML.
Using the JSXGraph server scripts it is possible to do computations with software
not running in a browser and use the results in JSXGraph, e.g. it is possible to
compute the polynomial equation of the geometric locus of a point in a construction,
use matplotlib to extract the points of the graph and return a list of points and
plot that points in JSXGraph.

Scripts available:

- `jxggroebner.py`

## General configuration

By default server scripts are stored in the subdirectory `server` of the JavaScript
files. If you want the scripts in another place you'll have to adjust
`JXG.serverBase`
either directly in JSX source (loadjsxgraph[InOneFile].js) or by setting it with
javascript in your page after loading JSXGraph.

## jxggroebner.py

- __Required software__

    - CoCoA (https://cocoa.dima.unige.it/)
    - Python (https://python.org/)
    - numpy (https://numpy.scipy.org/)
    - matplotlib (https://matplotlib.sourceforge.net/)

- __Setup__

Install CoCoA so it can be started by just typing cocoa in a terminal or adjust
the configuration in `jsxgroebner.py`. Install all of the python packages.

Your webserver has to be configured to execute python .py scripts as cgi, e.g.
for Apache you have to configure

    Options +ExecCGI
    AddHandler cgi-script .py

for the directory JSXGraph server scripts are in.

It is highly recommended to adjust the `os.environ['MPLCONFIGDIR']` variable in
the script or setting the variable `$MPLCONFIGDIR` for the webserver environment
to somewhere more persistent than '/tmp' and writable by the webserver. If you
don't do this, the matplotlib configuration will be erased at times (e.g. the
server gets rebooted) and every first plot after matplotlib config erasure
takes much more time because of matplotlib generating a new default config in
that place.
