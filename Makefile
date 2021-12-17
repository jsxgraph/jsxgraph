.PHONY: tests test test-server

# Build tools
REQUIREJS=./node_modules/.bin/r.js
MINIFYER=./node_modules/terser/bin/terser

# Code quality
LINT=./node_modules/.bin/jslint
ESLINT=./node_modules/eslint/bin/eslint.js
HINT=./node_modules/.bin/jshint
KARMA=node_modules/karma/bin/karma

# System tools
CP=cp
CAT=cat
MKDIR=mkdir
RM=rm
CD=cd
ZIP=zip
UNZIP=unzip

# Directories
OUTPUT=distrib
THIRDPARTY=3rdparty
BUILD=build
TMP=tmp
BUILDBIN=$(BUILD)/bin
BUILDREADERS=$(BUILDBIN)/readers

# API docs
JSDOC2=node ./node_modules/.bin/jsdoc2
JSDOC2PLG=doc/jsdoc-tk/plugins
JSDOC2PTCH=doc/jsdoc-tk/patches
JSDOC2TPL=doc/jsdoc-tk/template
JSDOC2TPLSTAT=$(JSDOC2TPL)/static
JSDOC2FLAGS=-v -p -t=$(JSDOC2TPL) -d=$(TMP)/docs

# Flags
MKDIRFLAGS=-p
RMFLAGS=-rf
ZIPFLAGS=-r

# Filelists - required for docs, linters, and to build the readers
FILELIST=$(shell cat src/loadjsxgraph.js | grep "baseFiles\s*=\s*'\(\w*,\)\+" | awk -F \' '{ print $$2 }' | sed 's/,/.js src\//g')

# Lintlist - jessiecode.js is developed externally (github:jsxgraph/jessiecode) and won't be linted in here
LINTLIST=$(shell echo $(FILELIST) | sed 's/src\/parser\/jessiecode\.js//')
LINTFLAGS=--bitwise true --white true --continue true
ESLINTFLAGS=

READERSOUT=build/bin/readers/geonext.min.js build/bin/readers/geogebra.min.js build/bin/readers/intergeo.min.js build/bin/readers/sketch.min.js

# Rules
all: core readers docs

core:
	$(MKDIR) $(MKDIRFLAGS) $(BUILDBIN)
	# Build uncompressed file jsxgraphcore.js and copy it to jsxgraphsrc.js
	$(REQUIREJS) -o $(BUILD)/core.build.json
	$(CP) $(BUILDBIN)/jsxgraphcore.js $(OUTPUT)/jsxgraphsrc.js

	# Build compressed file jsxgraphcore-min.js and copy it to jsxgraphcore.js
	$(MINIFYER) $(BUILDBIN)/jsxgraphcore.js -c -m -o $(BUILDBIN)/jsxgraphcore-min.js
	{ $(CAT) COPYRIGHT; $(CAT) $(BUILDBIN)/jsxgraphcore-min.js; } > $(BUILDBIN)/jsxgraphcore.min.js
	$(CP) $(BUILDBIN)/jsxgraphcore.min.js $(OUTPUT)/jsxgraphcore.js

release: core docs
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	$(CP) $(BUILDBIN)/jsxgraphcore.min.js $(TMP)/jsxgraphcore.js
	$(CP) $(BUILDBIN)/jsxgraphcore.js $(TMP)/jsxgraphsrc.js
	$(CP) $(OUTPUT)/docs.zip $(TMP)/docs.zip
	$(CP) $(OUTPUT)/jsxgraph.css $(TMP)/jsxgraph.css
	$(CP) $(OUTPUT)/index.d.ts $(TMP)/index.d.ts
	$(CP) -r src/themes $(TMP)/themes
	$(CP) README.md LICENSE.MIT LICENSE.LGPL $(TMP)/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) jsxgraph.zip jsxgraph* themes/ index.d.ts docs.zip README.md LICENSE.*
	$(CP) $(TMP)/jsxgraph.zip $(OUTPUT)/jsxgraph.zip

	$(RM) $(RMFLAGS) tmp

docs: core
	# Set up tmp dir
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)

	# Update template related files
	$(CP) $(THIRDPARTY)/jquery.min.js $(JSDOC2TPLSTAT)/jquery.min.js
	$(CP) $(BUILDBIN)/jsxgraphcore.min.js $(JSDOC2TPLSTAT)/jsxgraphcore.js
	$(CP) $(OUTPUT)/jsxgraph.css $(JSDOC2TPLSTAT)/jsxgraph.css

	# Patch run.js
	$(CP) $(JSDOC2PTCH)/*.js ./node_modules/jsdoc2/app

	# Update the plugin
	$(CP) $(JSDOC2PLG)/*.js ./node_modules/jsdoc2/app/plugins/

	# Run node-jsdoc2
	$(JSDOC2) $(JSDOC2FLAGS) src/loadjsxgraph.js src/$(FILELIST).js

	# Compress the result: zip -r tmp/docs.zip tmp/docs/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) docs.zip docs/
	$(CP) $(TMP)/docs.zip $(OUTPUT)/docs.zip

	$(RM) $(RMFLAGS) tmp

	# Test
	$(CD) $(OUTPUT) && $(UNZIP) -o docs.zip

readers: $(READERSOUT)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	$(CP) $(BUILDREADERS)/* $(OUTPUT)

build/bin/readers/%.min.js: src/reader/%.js
	$(MKDIR) $(MKDIRFLAGS) $(BUILDREADERS)
	{ $(CAT) COPYRIGHT; $(MINIFYER) $^ -c -m ; } > $@

compressor: core
	$(REQUIREJS) -o build/compressor.build.json
	{ $(CAT) JSXCompressor/COPYING; $(CAT) $(BUILDBIN)/jsxcompressor.js; } > JSXCompressor/jsxcompressor.min.js
	$(CP) $(BUILDBIN)/jsxgraphcore.js JSXCompressor/jsxgraphcore.js
	$(CP) $(OUTPUT)/jsxgraph.css JSXCompressor/jsxgraph.css

plot:
	$(MKDIR) $(MKDIRFLAGS) $(BUILDBIN)
	$(REQUIREJS) -o build/plot.build.json

hint:
	$(HINT) src/$(LINTLIST).js

lint:
	$(LINT) $(LINTFLAGS) src/$(LINTLIST).js

eslint:
	$(ESLINT) $(ESLINTFLAGS) src/$(LINTLIST).js

test: core
	$(KARMA) start karma/karma.conf.js
