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

## Use Python for implicit plots

The `python.html` example uses
[Pyodide](https://github.com/iodide-project/pyodide) to run Python scripts
inside the browser. This project comes pre-packaged with a few Python modules
like [numpy](https://numpy.org/) and [matplotlib](https://matplotlib.org/). We
use these packages to implicitly plot a circle through a given point.

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

## Further reading

* [WebAssembly.org](https://webassembly.org), homepage for latest news and
  upcoming features
* [emscripten](https://emscripten.org/), a C/C++ compiler for WebAssembly
* [Rust](https://www.rust-lang.org/what/wasm) is a new programming language
  with excellent tooling support for WebAssembly
* [WebAssembly Studio](https://webassembly.studio/): Create and run WebAssembly
  modules in your browser
* [Awesome WASM](https://github.com/mbasso/awesome-wasm), a curated list of
  everything WebAssembly. Compilers, Examples, Tutorials, Documentation, ...
* More (non-JSXGraph) examples:
  * <https://github.com/migerh/wasm-filter>
  * <https://github.com/migerh/rustwasm-gif>
