#!/bin/sh
python makeDistrib.py
cd ..
rm -f tools/jsxgraph0.60.zip
zip tools/jsxgraph0.60.zip src/*.js src/COPYING src/COPYING.LESSER distrib/jsxgraphcore.js distrib/jsxgraph.css distrib/prototype.js tools/makeDistrib.py
cd tools
