/*
 * A very basic node.js example that supports rendering to bitmap graphics.
 * This requires the canvas module for node.js (https://npmjs.org/package/canvas)
 * 
 * Known issues: This doesn't work right now because for unknown reasons the infobox enforces HTML rendering.
 * If initInfobox is changed such that it returns without creating a text element it works.
 */
var JXG = require('../../distrib/jsxgraphcore.js');

JXG.Options.text.display = 'internal';
// dirty hack
JXG.Board.prototype.initInfobox = function () {};
var board = JXG.JSXGraph.initBoard(null, {boundingbox: [-5, 5, 5, -5], showNavigation: false});
board.create('point', [3, 4]);
board.create('point', [-2, 3], {color: 'green'});
board.create('line', [[-2, 2], [4, 2]]);

board.create('circle', [[0, 0], 3]);

// print data url
console.log(board.renderer.canvasRoot.toDataURL());

// save to file rendering.png

var fs = require('fs'),
    out = fs.createWriteStream(__dirname + '/rendering.png'),
    stream = board.renderer.canvasRoot.createPNGStream();

stream.on('data', function(chunk){
  out.write(chunk);
});

stream.on('end', function(){
  console.log('saved png');
});