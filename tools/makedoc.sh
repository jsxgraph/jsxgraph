ROOT=~/public_html/jsxgraph/jsdoc-toolkit
FILELIST=$(cat ../src/loadjsxgraph.js | grep "baseFiles\s*=\s*'\(\w*,\)\+" | awk -F \' '{ print $2 }' | sed 's/,/.js ..\/src\//g')
java -jar $ROOT/jsrun.jar $ROOT/app/run.js -a -t=$ROOT/templates/jsdoc -d=docs ../src/loadjsxgraph.js ../src/$FILELIST.js
zip -r docs.zip docs/