ROOT=~/public_html/jsxgraph/jsdoc-toolkit
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

