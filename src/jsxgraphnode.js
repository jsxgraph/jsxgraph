/*jslint nomen: true*/
/*global module: true, __dirname: true, require: true*/

var requirejs = require('requirejs');

requirejs.config({
    //Use node's special variable __dirname to
    //get the directory containing this file.
    //Useful if building a library that will
    //be used in node but does not require the
    //use of node outside
    baseUrl: __dirname,

    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

// export JSXGraph, the ../build/core.deps.js module returns a reference to JXG
module.exports = requirejs(__dirname + '/../build/core.deps.js');
