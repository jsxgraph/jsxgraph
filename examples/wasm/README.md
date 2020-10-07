# JSXGraph and WebAssembly

This folder contains some examples on how JSXGraph constructions can use
WebAssembly modules.

## Compile C++ to WASM with emscripten

To build the C++ example you need to [install the emscripten
SDK](https://emscripten.org/docs/getting_started/downloads.html). Then use the
provided `compile.sh` script and pass in the files to compile into the WASM
module, e.g.

```sh
compile.sh board.cpp jxg.cpp
```

### Use JSXGraph from C++

`cpp.html` contains an example that creates a very simple example with C++. To
run it, compile the wasm module with `./compile.sh board.cpp jxg.cpp` and open
`cpp.html` file in your browser. It has to be served via a HTTP server that
has the JSXGraph workspace root as a public folder. See below for an example.

### Use C++ from JSXGraph

`lib.html` shows how you can pass in a function defined in C++ and plot it with
the JSXGraph `functiongraph` element.


## Run HTTP server with the workspace root as a public folder

An easy way to achieve is is to use the
[pushstate-server](https://www.npmjs.com/package/pushstate-server) package.
Assuming you have Nodejs and npm available, go to the JSXGraph workspace root
and run

```sh
npx pushstate-server -d . -p 8080
```

To run the cpp examples above go to

<http://localhost:8080/examples/wasm/cpp.html>

or

<http://localhost:8080/examples/wasm/lib.html>
