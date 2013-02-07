all: ggb.bnf.js

ggb.bnf.js: grammar.txt jscc/jscc/jscc_rhino.js jscc/jscc/driver_unpacked.js_
	rhino jscc/jscc/jscc_rhino.js -v -w -o ggb.bnf.js -t jscc/jscc/driver_unpacked.js_ grammar.txt
