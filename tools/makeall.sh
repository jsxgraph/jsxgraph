#!/bin/sh
#########################################
python makeDistrib.py
python makeJSXCompressor.py
cd ..
cp src/GeonextReader.js src/GeogebraReader.js src/IntergeoReader.js src/CinderellaReader.js distrib
#########################################
cd tools
echo "makeDoc"
sh makedoc.sh
#########################################
cd ..
# Distribute the new version to the
# moodle plugin and the wordpress plugin
cp distrib/jsxgraphcore.js distrib/jsxgraph.css plugins/jsxgraphmoodle
cp distrib/jsxgraphcore.js distrib/jsxgraph.css plugins/wordpress/jsxgraph
#########################################
cd plugins
# Update the moodle plugin
zip jsxgraphmoodle.zip jsxgraphmoodle/*
# Update the wordpress plugin
cd wordpress
zip jsxgraphwp.zip jsxgraph/*
#########################################
#
# Update the reference card
cd ../../doc
tex jsxgraph_refcard.tex
dvips -t landscape jsxgraph_refcard.dvi -o
gs -sDEVICE=pdfwrite -dBATCH -dNOPAUSE -sOutputFile=jsxgraph_refcard.pdf jsxgraph_refcard.ps
cp jsxgraph_refcard.pdf ../distrib
#########################################
cd ..
#
rm -f tools/jsxgraph0.82.zip
zip tools/jsxgraph0.82.zip src/*.js src/COPYING src/COPYING.LESSER distrib/jsxgraphcore.js distrib/jsxgraph.css distrib/prototype.js distrib/*Reader.js tools/makeDistrib.py distrib/jsxgraph_refcard.pdf
