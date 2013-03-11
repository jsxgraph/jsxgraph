/*
 * A very basic node.js example that supports rendering to bitmap graphics.
 * This requires the canvas module for node.js (https://npmjs.org/package/canvas)
 * 
 * Known issues: This doesn't work right now because for unknown reasons the infobox enforces HTML rendering.
 * If initInfobox is changed such that it returns without creating a text element it works.
 */

// use the (minified) core, i.e. jsxgraph in one single file, built with r.js
//var JXG = require('../../build/bin/jsxgraphcore.js');

// use the dev version
var JXG = require('../../src/jsxgraphnode.js');

console.log('version', JXG.version);
console.log('text display', JXG.Options.text.display);
console.log('infobox display', JXG.Options.infobox.display);

var board = JXG.JSXGraph.initBoard(null, {boundingbox: [-5, 5, 5, -5], showNavigation: false});
board.create('point', [3, 4]);
board.create('point', [-2, 3], {color: 'green'});
board.create('line', [[-2, 2], [4, 2]]);

var c = board.create('circle', [[0, 0], 2.5]);

console.log('circle radius', c.Radius(), 'canvas', JXG.supportsCanvas(), board.renderer.type);


if (JXG.supportsCanvas()) {
    // print data url
    console.log(board.renderer.canvasRoot.toDataURL());

    // save to file rendering.png
    var fs = require('fs'),
        out = fs.createWriteStream(__dirname + '/rendering.png'),
        stream = board.renderer.canvasRoot.createPNGStream();

    stream.on('data', function (chunk) {
        out.write(chunk);
    });

    stream.on('end', function () {
        console.log('saved png');
    });
}