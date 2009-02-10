ROOT=~/public_html/jsxgraph/jsdoc-toolkit
java -jar $ROOT/jsrun.jar $ROOT/app/run.js -a -t=$ROOT/templates/jsdoc -d=docs ../src/*.js
zip -r docs.zip docs/