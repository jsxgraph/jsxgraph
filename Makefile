.PHONY: test test-server

# build tools
REQUIREJS=./node_modules/.bin/r.js
UGLIFYJS=./node_modules/.bin/uglifyjs
JSDOC2=node ./node_modules/.bin/jsdoc2
LINT=./node_modules/.bin/jslint
HINT=./node_modules/.bin/jshint
JSTESTDRIVER=java -jar ./node_modules/jstestdriver/lib/jstestdriver.jar

# general tools
CP=cp
CAT=cat
MKDIR=mkdir
RM=rm
CD=cd
ZIP=zip

# directories
OUTPUT=distrib
BUILD=build
TMP=tmp
BUILDBIN=$(BUILD)/bin
BUILDREADERS=$(BUILDBIN)/readers
JSDOC2PLG=doc/jsdoc-tk/plugins
JSDOC2TPL=doc/jsdoc-tk/template
JSDOC2TPLSTAT=$(JSDOC2TPL)/static

# flags
MKDIRFLAGS=-p
RMFLAGS=-rf
JSDOC2FLAGS=-v -p -t=$(JSDOC2TPL) -d=$(TMP)/docs
ZIPFLAGS=-r
JSTESTPORT=4224
JSTESTSERVER=localhost:4224
JSTESTFLAGS=--reset --captureConsole --tests all

# filelists - required for docs, linters, and to build the readers
FILELIST=$(shell cat src/loadjsxgraph.js | grep "baseFiles\s*=\s*'\(\w*,\)\+" | awk -F \' '{ print $$2 }' | sed 's/,/.js src\//g')
READERSOUT=build/bin/readers/geonext.min.js build/bin/readers/geogebra.min.js build/bin/readers/intergeo.min.js build/bin/readers/sketch.min.js

# rules
all: core core-min readers docs


core:
	$(REQUIREJS) -o $(BUILD)/core.build.json


core-min:
	$(REQUIREJS) -o $(BUILD)/core.build.json optimize=uglify2 out=$(BUILDBIN)/jsxgraphcore-min.js;
	{ $(CAT) COPYRIGHT; $(CAT) $(BUILDBIN)/jsxgraphcore-min.js; } > $(BUILDBIN)/jsxgraphcore.min.js


release: core-min docs
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	$(CP) $(BUILDBIN)/jsxgraphcore-min.js $(TMP)/jsxgraphcore.js
	$(CP) $(BUILDBIN)/jsxgraphcore.js $(TMP)/jsxgraphsrc.js
	$(CP) $(OUTPUT)/docs.zip $(TMP)/docs.zip
	$(CP) distrib/jsxgraph.css $(TMP)/jsxgraph.css
	$(CP) -r src/themes $(TMP)/themes
	$(CP) README.md LICENSE.MIT LICENSE.LGPL $(TMP)/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) jsxgraph.zip jsxgraph* themes/ docs.zip README.md LICENSE.*
	$(CP) $(TMP)/jsxgraph.zip $(OUTPUT)/jsxgraph.zip
	
	$(RM) $(RMFLAGS) tmp


docs: core core-min
	# set up tmp dir
	$(MKDIR) $(MKDIRFLAGS) $(TMP)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	
	# update template related files
	$(CP) distrib/jquery.min.js $(JSDOC2TPLSTAT)/jquery.min.js
	$(CP) $(BUILDBIN)/jsxgraphcore-min.js $(JSDOC2TPLSTAT)/jsxgraphcore.js
	$(CP) distrib/jsxgraph.css $(JSDOC2TPLSTAT)/jsxgraph.css
	
	# update the plugin
	$(CP) $(JSDOC2PLG)/*.js ./node_modules/jsdoc2/app/plugins/
	
	# run node-jsdoc2
	# this is not the best method because all the source methods and properties
	# will be reported "defined in jsxgraphcore.js". But it'll do for now.
	#$(JSDOC2) $(JSDOC2FLAGS) $(BUILDBIN)/jsxgraphcore.js
	$(JSDOC2) $(JSDOC2FLAGS) src/$(FILELIST).js
	
	# zip -r tmp/docs.zip tmp/docs/
	$(CD) $(TMP) && $(ZIP) $(ZIPFLAGS) docs.zip docs/
	$(CP) $(TMP)/docs.zip $(OUTPUT)/docs.zip
	
	$(RM) $(RMFLAGS) tmp


readers: $(READERSOUT)
	$(MKDIR) $(MKDIRFLAGS) $(OUTPUT)
	$(CP) $(BUILDREADERS)/* $(OUTPUT)


build/bin/readers/%.min.js: src/reader/%.js
	$(MKDIR) $(MKDIRFLAGS) $(BUILDREADERS)
	{ $(CAT) COPYRIGHT; $(UGLIFYJS) $^; } > $@


compressor: core
	$(REQUIREJS) -o build/compressor.build.json
	$(CP) build/bin/jsxcompressor.js JSXCompressor/jsxcompressor.js
	$(CP) build/bin/jsxgraphcore.js JSXCompressor/jsxgraphcore.js


plot:
	$(REQUIREJS) -o build/plot.build.json

hint:
	$(HINT) src/$(FILELIST).js

lint:
	$(LINT) src/$(FILELIST).js

test-server:
	$(JSTESTDRIVER) --port $(JSTESTPORT)

test: core
	$(JSTESTDRIVER) $(JSTESTSERVER) $(JSTESTFLAGS) --basePath ./ --config test/jsTestDriver.conf
