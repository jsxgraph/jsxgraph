#!/bin/bash

EMCC=/usr/lib/emscripten/emcc

$EMCC $@ \
    --bind \
    -s WASM=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall'] \
    -s INVOKE_RUN=0 \
    -o cpp.js

