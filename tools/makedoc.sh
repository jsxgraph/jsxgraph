#!/bin/bash

ROOT=~/Downloads/jsdoc_toolkit-2.3.2/jsdoc-toolkit
#
# Update our own jsdoc template
#
cp ../doc/jsdoc-tk/plugins/* $ROOT/app/plugins/
cp -r ../doc/jsdoc-tk/template/* $ROOT/templates/jsdoc
mkdir $ROOT/templates/jsdoc/static
cp ../distrib/jquery.min.js $ROOT/templates/jsdoc/static
cp ../distrib/jsxgraphcore.js $ROOT/templates/jsdoc/static
cp ../distrib/jsxgraph.css $ROOT/templates/jsdoc/static

FILELIST=$(cat ../src/loadjsxgraph.js | grep "baseFiles\s*=\s*'\(\w*,\)\+" | awk -F \' '{ print $2 }' | sed 's/,/.js ..\/src\//g')
#echo $FILELIST
#----------------------
# $FILELIST starts without "../src" and ends without ".js".
# Further, SVGRenderer and VMLRenderer are not in FILELIST
# We therefore have to prepend and append "../src/" and ".js":
#----------------------
java -jar $ROOT/jsrun.jar $ROOT/app/run.js -a -v -t=$ROOT/templates/jsdoc -d=docs ../src/loadjsxgraph.js ../src/$FILELIST.js ../src/SVGRenderer.js ../src/VMLRenderer.js
#java -jar $ROOT/jsrun.jar $ROOT/app/run.js -a -v -t=$ROOT/templates/jsdoc -d=docs ../src/*.js 
zip -r docs.zip docs/

