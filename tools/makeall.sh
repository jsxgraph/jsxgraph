#!/bin/sh
python makeDistrib.py
cd ..
rm -f tools/jsxgraph0.72.zip
#cp  src/jsxturtle.js distrib
zip tools/jsxgraph0.72.zip src/*.js src/COPYING src/COPYING.LESSER distrib/jsxgraphcore.js distrib/jsxgraph.css distrib/prototype.js tools/makeDistrib.py
cd tools
echo "makeDoc"
sh makedoc.sh
