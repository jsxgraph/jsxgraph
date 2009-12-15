#!/bin/sh
python makeDistrib.py
python makeJSXCompressor.py
cd ..
rm -f tools/jsxgraph0.79.zip
zip tools/jsxgraph0.79.zip src/*.js src/COPYING src/COPYING.LESSER distrib/jsxgraphcore.js distrib/jsxgraph.css distrib/prototype.js tools/makeDistrib.py
cd tools
echo "makeDoc"
sh makedoc.sh
