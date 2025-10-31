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
MKDIR=mkdir
RM=rm
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

# Extract version number from package.json
VERSION=$(shell grep -o '"version": "[^"]*' package.json | grep -o '[^"]*$$')

# List of all included JavaScript files - required for docs, linters, and to build the readers
# Double quotes:
# FILELIST=$(shell cat src/index.js | awk '/import/ {if (match($$0,/"\.(.+)"/,m)) print "src"m[1]".js" }')
# Single quotes: before endings .js have been added:
# FILELIST=$(shell cat src/index.js | awk '/import/ {if (match($$0,/\x27\.(.+)\x27/,m)) print "src"m[1]".js" }')
# Single quotes: after endings .js have been added:
# Requires gawk!!!
FILELIST=$(shell cat src/index.js | gawk '/import/ {if (match($$0,/\x27\.(.+)\x27/,m)) print "src"m[1] }')

# Lintlist - jessiecode.js is developed externally (github:jsxgraph/jessiecode) and won't be linted in here
LINTLIST=$(shell echo $(FILELIST) | sed 's/src\/parser\/jessiecode\.js//')
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
	sed -i '2s/.*/    JSXGraph $(VERSION)/' COPYRIGHT
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
	sed -i '2s/.*/    JSXGraph $(VERSION)/' COPYRIGHT
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
	sed -i '2s/.*/<h1>JSXGraph $(VERSION) Reference<\/h1>/' doc/jsdoc-tk/template/static/header.html

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
	$(WEBPACK) --config config/webpack.config.plot.js

hint:
	$(HINT) $(LINTLIST)

lint:
	$(LINT) $(LINTFLAGS) $(LINTLIST)

eslint:
	$(ESLINT) $(ESLINTFLAGS) $(LINTLIST)

# test:
test: core
	$(KARMA) start karma/karma.conf.js
