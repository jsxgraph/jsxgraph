(function () {

    'use strict';

    var fs = require('fs'),
        //JXG = require('../../distrib/jsxgraphcore.js');
        JXG = require('../../src/jsxgraphnode.js');

    module.exports = {
        test: function (file, pic) {
            var board,
                out, ostream,
                content;
            
            try {
                content = fs.readFileSync(file);
                JXG.Options.text.display = 'internal';
                JXG.Options.showCopyright = false;
                JXG.Options.showNavigation = false;

                if (!pic) {
                    JXG.Options.renderer = 'no';
                }

                // dirty hack
                JXG.Board.prototype.initInfobox = function () {};

                board = JXG.JSXGraph.loadBoardFromString(null, content.toString(), 'sketch');

                // save rendering to png
                if (pic) {
                    out = fs.createWriteStream(file + '.png');
                    ostream = board.renderer.canvasRoot.createPNGStream();                

                    ostream.on('data', function(chunk){
                        out.write(chunk);
                    });
                }
            } catch (e) {
                return 'FAILED: ' + file + ' / ' + e.toString() + ';\n' + e.stack;
            }
            
            return 'OK: ' + file + ';';
        }
    };
    
}());
