.PHONY: test docs core core-min prettier release lint eslint readers

# Build tools
WEBPACK=./node_modules/.bin/webpack
MINIFYER=./node_modules/terser/bin/terser

# Code quality
LINT=./node_modules/.bin/jslint
ESLINT=./node_modules/eslint/bin/eslint.js
HINT=./node_modules/.bin/jshint
KARMA=node_modules/karma/bin/karma
PRETTIER=./node_modules/.bin/prettier

# System tools
CP=cp
CAT=cat
MV=mv
MKDIR=mkdir
RM=rm
SED=sed
CD=cd
ZIP=zip
UNZIP=unzip

# Directories
OUTPUT=distrib
BETA=beta
THIRDPARTY=3rdparty
BUILD=build
TMP=tmp
# BUILDBIN=$(BUILD)/bin
BUILDREADERS=tmpreaders

# API docs
#JSDOC2=node ./node_modules/.bin/jsdoc2
JSDOC2=npx jsdoc2
JSDOC2PLG=doc/jsdoc-tk/plugins
JSDOC2PTCH=doc/jsdoc-tk/patches
JSDOC2TPL=doc/jsdoc-tk/template
JSDOC2TPLSTAT=$(JSDOC2TPL)/static
JSDOC2FLAGS=-v -p -t=$(JSDOC2TPL) -d=$(TMP)/docs

# Flags
MKDIRFLAGS=-p
RMFLAGS=-rf
ZIPFLAGS=-r

# Extract version number from package.json
VERSION=$(shell grep -o '"version": "[^"]*' package.json | grep -o '[^"]*$$')

# List of all included JavaScript files - required for docs, linters, and to build the readers
FILELIST=$(shell $(SED) -n "s|^import.*'\.\([^']*\)'.*|src\1|p" src/index.js)

# Lintlist - jessiecode.js is developed externally (github:jsxgraph/jessiecode) and won't be linted in here
LINTLIST=$(filter-out src/parser/jessiecode.js,$(FILELIST))
# LINTLIST=$(shell echo $(FILELIST))
LINTFLAGS=--bitwise true --white true --continue true
ESLINTFLAGS=

PRETTIERFLAGS=-w --print-width 96 --tab-width 4 --trailing-comma none

READERSOUT=tmpreaders/geonext.min.js tmpreaders/geogebra.min.js tmpreaders/intergeo.min.js
# tmpreaders/sketch.min.js

# Rules
all: core readers docs

core:
	# Build uncompressed AND minified files
	#   jsxgraphsrc.js, jsxgraphsrc.mjs, jsxgraphcore.js, jsxgraphcore.mjs and
	# copy them to the distrib directory.
	$(WEBPACK) --config config/webpack.config.js
	# Update version number in line 2 of file COPYRIGHT
	$(SED) '2s/.*/    JSXGraph $(VERSION)/' COPYRIGHT > COPYRIGHT.tmp
	$(MV) COPYRIGHT.tmp COPYRIGHT
	# Update version number in line 2 of file jsxgraph.css
	$(SED) '2s/.*/    JSXGraph $(VERSION)/' $(OUTPUT)/jsxgraph.css > $(OUTPUT)/jsxgraph.css.tmp
	$(MV) $(OUTPUT)/jsxgraph.css.tmp $(OUTPUT)/jsxgraph.css
	# Prepend file to the jsxgraphcore.* files
	cat COPYRIGHT $(OUTPUT)/jsxgraphcore.js >$(OUTPUT)/tmp.file; mv $(OUTPUT)/tmp.file $(OUTPUT)/jsxgraphcore.js
	cat COPYRIGHT $(OUTPUT)/jsxgraphcore.mjs >$(OUTPUT)/tmp.file; mv $(OUTPUT)/tmp.file $(OUTPUT)/jsxgraphcore.mjs

core-min:
	echo "INFO: core-min deactivated. It is covered by core"

release: core docs
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(CP) $(OUTPUT)/jsxgraphcore.js $(TMP)/jsxgraphcore.js
	$(CP) $(OUTPUT)/jsxgraphsrc.js  $(TMP)/jsxgraphsrc.js
	$(CP) $(OUTPUT)/jsxgraphcore.mjs $(TMP)/jsxgraphcore.mjs
	$(CP) $(OUTPUT)/jsxgraphsrc.mjs  $(TMP)/jsxgraphsrc.mjs
	$(CP) $(OUTPUT)/jsxgraph.css    $(TMP)/jsxgraph.css
	$(CP) $(OUTPUT)/docs.zip        $(TMP)/docs.zip
	$(CP) src/index.d.ts            $(TMP)/index.d.ts
	$(CP) -r src/themes             $(TMP)/themes
	$(CP) README.md LICENSE.MIT LICENSE.LGPL $(TMP)/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) jsxgraph.zip jsxgraph* themes/ index.d.ts docs.zip README.md LICENSE.*
	$(CP) $(TMP)/jsxgraph.zip $(OUTPUT)/jsxgraph.zip
	$(RM) $(RMFLAGS) $(TMP)

beta: docs
	# $(WEBPACK) --config config/webpack.config.js
	mkdir -p $(BETA)
	cp $(OUTPUT)/*.js $(BETA)
	cp $(OUTPUT)/*.mjs $(BETA)
	cp $(OUTPUT)/*.map $(BETA)
	cp $(OUTPUT)/*.css $(BETA)
	rm -fr $(BETA)/docs
	cp -r $(OUTPUT)/docs/ $(BETA)/docs
	# Update version number in line 2 of file COPYRIGHT
	$(SED) '2s/.*/    JSXGraph $(VERSION)/' COPYRIGHT > COPYRIGHT.tmp
	$(MV) COPYRIGHT.tmp COPYRIGHT
	# Prepend file to the jsxgraphcore.* files
	cat COPYRIGHT $(BETA)/jsxgraphcore.js >$(BETA)/tmp.file; mv $(BETA)/tmp.file $(BETA)/jsxgraphcore.js
	cat COPYRIGHT $(BETA)/jsxgraphcore.mjs >$(BETA)/tmp.file; mv $(BETA)/tmp.file $(BETA)/jsxgraphcore.mjs

docs: core docsonly

docsonly:
	# Set up tmp dir
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)

	# Update template related files
	$(CP) $(THIRDPARTY)/jquery.min.js $(JSDOC2TPLSTAT)/jquery.min.js
	$(CP) $(OUTPUT)/jsxgraphcore.js   $(JSDOC2TPLSTAT)/jsxgraphcore.js
	$(CP) $(OUTPUT)/jsxgraph.css      $(JSDOC2TPLSTAT)/jsxgraph.css

	# Update version number in line 2 of file doc/jsdoc-tk/template/static/header.html
	$(SED) '2s/.*/<h1>JSXGraph $(VERSION) Reference<\/h1>/' doc/jsdoc-tk/template/static/header.html > doc/jsdoc-tk/template/static/header.html.tmp
	$(MV) doc/jsdoc-tk/template/static/header.html.tmp doc/jsdoc-tk/template/static/header.html

	# Patch run.js
	$(CP) $(JSDOC2PTCH)/*.js ./node_modules/jsdoc2/app

	# Update the plugin
	$(CP) $(JSDOC2PLG)/*.js ./node_modules/jsdoc2/app/plugins/

	# Run node-jsdoc2
	$(JSDOC2) $(JSDOC2FLAGS) $(FILELIST)

	# Compress the result: zip -r tmp/docs.zip tmp/docs/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) docs.zip docs/
	$(CP) $(TMP)/docs.zip $(OUTPUT)/docs.zip
	$(RM) $(RMFLAGS) tmp

	# Test
	$(CD) $(OUTPUT) && $(UNZIP) -o docs.zip

# jsdoc v4
t:
	node_modules/.bin/jsdoc -a all --pedantic -c ./doc/jsdoc/jsdoc.json ./doc/jsdoc/tests/pseudo.js ./doc/jsdoc/tests/test.js

d:
	@#node_modules/.bin/jsdoc -a all  --verbose -c ./doc/jsdoc/jsdoc.json -$(FILELIST)$
	@#node_modules/.bin/jsdoc -a all --pedantic -c ./doc/jsdoc/jsdoc.json src/jxg.js src/base/board.js src/base/element.js src/options.js src/base/line.js src/base/point.js  src/base/circle.js src/base/text.js
	@# ./doc/jsdoc/tests/pseudo.js ./doc/jsdoc/tests/test.js src/options.js
	@# node_modules/.bin/jsdoc -a all --pedantic -c ./doc/jsdoc/jsdoc.json ./doc/jsdoc/tests/test.js 
	@# ./doc/jsdoc/tests/pseudo.js ./doc/jsdoc/tests/lineshort.js
	node_modules/.bin/jsdoc -a all --pedantic -c ./doc/jsdoc/jsdoc.json src/jxg.js src/utils/env.js \
	src/base/constants.js src/utils/type.js src/utils/xml.js src/utils/event.js src/utils/expect.js \
	src/math/math.js src/math/probfuncs.js src/math/ia.js src/math/extrapolate.js src/math/qdt.js \
	src/math/bqdt.js src/math/numerics.js src/math/nlp.js src/math/plot.js src/math/implicitplot.js \
	src/math/metapost.js src/math/statistics.js src/math/geometry.js src/math/clip.js src/math/poly.js \
	src/math/complex.js src/math/tiling.js src/reader/file.js \
	src/renderer/abstract.js src/renderer/svg.js src/renderer/vml.js src/renderer/canvas.js src/renderer/no.js \
	src/parser/geonext.js \
	src/base/board.js src/options.js src/jsxgraph.js \
	src/base/element.js src/base/coords.js src/base/coordselement.js src/base/point.js src/base/line.js \
	src/base/group.js src/base/circle.js src/element/conic.js src/base/polygon.js src/base/curve.js src/element/arc.js \
	src/element/sector.js src/base/composition.js src/element/composition.js src/element/grid.js src/base/text.js src/base/image.js \
	src/element/slider.js src/element/measure.js src/base/transformation.js src/base/turtle.js src/element/vectorfield.js \
	src/utils/color.js src/utils/zip.js src/utils/base64.js src/utils/uuid.js src/utils/encoding.js src/parser/datasource.js \
	src/base/ticks.js src/element/comb.js src/parser/prefix.js src/utils/dump.js src/renderer/svg.js \
	src/element/slopetriangle.js src/element/checkbox.js src/element/input.js src/element/button.js src/element/smartlabel.js src/base/foreignobject.js \
	src/parser/ca.js src/base/chart.js \
	src/options3d.js src/3d/view3d.js src/3d/element3d.js src/3d/box3d.js src/3d/point3d.js src/3d/curve3d.js 
	@# src/3d/circle3d.js src/3d/linspace3d.js src/3d/text3d.js src/3d/ticks3d.js src/3d/polygon3d.js src/3d/face3d.js src/3d/polyhedron3d.js src/3d/sphere3d.js src/3d/surface3d.js src/parser/3dmodels.js src/themes/mono_thin.js

# prettier:
# 	$(PRETTIER) $(PRETTIERFLAGS) src

readers: $(READERSOUT)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	$(CP) $(BUILDREADERS)/* $(OUTPUT)
	$(RM) $(RMFLAGS) $(BUILDREADERS)

tmpreaders/%.min.js: src/reader/%.js
	$(MKDIR) $(MKDIRFLAGS) $(BUILDREADERS)
	{ $(CAT) COPYRIGHT; $(MINIFYER) $^ -c -m ; } > $@

compressor: core
	$(WEBPACK) --config config/webpack.config.compressor.js
	$(CP) $(OUTPUT)/jsxgraph.css    JSXCompressor/jsxgraph.css

plot:
	$(MKDIR) $(MKDIRFLAGS) $(BUILDBIN)
	$(WEBPACK) --verbose --config config/webpack.config.plot.js

hint:
	$(HINT) $(LINTLIST)

lint:
	$(LINT) $(LINTFLAGS) $(LINTLIST)

eslint:
	$(ESLINT) $(ESLINTFLAGS) $(LINTLIST)

test: core
	$(KARMA) start karma/karma.conf.js

testchromium: core
	export CHROME_BIN=/usr/bin/chromium; $(KARMA) start karma/karma.conf.js
