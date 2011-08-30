/*
    Copyright 2011
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/
JXG.TracenpocheReader = new function() {
    this.parseData = function(board) {
        var script, len, i, code;
        
        script = this.data.split('\n');
        len = script.length;
        for (i=0; i<len; i++) {
            // Trim and remove comments
            script[i] = script[i].replace(/^\s+|\s+$/g, '').replace(/\/\/.*$/g, '');
        }
        
        board.setBoundingBox([-10,10,10,-10]);
        board.create('axis', [[0, 0], [1, 0]]);
        board.create('axis', [[0, 0], [0, 1]]);
        for (i=0; i<len; i++) {
            code = script[i];
            
            if (code.match(/@options/)) {
                i = this.parseOptions(board, script, i);
            } else if (code.match(/@figure/)) {
                i = this.parseFigure(board, script, i);
            }
            //console.log(i, code);
        }
    };

    this.parseOptions = function(board, script, start) {
        var code, i, len = script.length;
       
        for (i=start+1; i<len; i++) {
            code = script[i];
            if (code=='') continue;

            if (code.match(/@/)) {   // Reached the end of the options section
                return i-1;
            }
            console.log("OPT>", code);
            // Read options:
        }
    };

    this.parseFigure = function(board, script, start) {
        var code, i, len = script.length,
            ar,
            varname, cmd, opts;
       
        for (i=start+1; i<len; i++) {
            code = script[i];
            if (code=='') continue;

            if (code.match(/@/)) {   // Reached the end of the figure section
                return i-1;
            }
            // Read figure:
            console.log("FIG>", code);
            if (code.match(/^for/)) {                         // for loop
                i = this.parseForLoop(board, script, start);
                console.log(i);
            } else if (code.match(/^end/)) {                  // should be parsed in parseForLoop()
            } else if (code.match(/^var/)) {                  // local variable
            } else {                                          // construction
                ar = code.split(/\s*=\s*/);
                if (ar.length<2) {              // Something went wrong
                    continue;
                }
                varname = ar[0];
                if (ar[1].match(/\{(.*)\}/)) {  // Read options
                    opts = RegExp.$1;
                } else {
                    opts = '';
                }
                if (ar[1].match(/^(.*\))/)) {   // Read command
                    cmd = RegExp.$1;
                }
                console.log(ar, cmd, ":", opts);
                this.doCmd(board, varname, cmd, opts);
            }
        }
    };

    this.parseForLoop = function(board, script, start) {
        var code, i, len = script.length;
        for (i=start+1; i<len; i++) {
            code = script[i];
            if (code=='') continue;
            if (code.match(/^end/)) {
                return i;
            }
        }
        return i;
    }

    this.doCmd = function(board, varname, cmd, opts) {
        var args, str;
        // point
        if (cmd.match(/point\s*\((.*)\)/)) {
            str = RegExp.$1;
            args = str.split(',');
            args[0] *= 1.0;
            args[1] *= 1.0;
            board.create('point', args, {name:varname});
        }
        // segment
        if (cmd.match(/segment\s*\((.*)\)/)) {
            str = RegExp.$1;
            str = str.replace(/\s+/g,'');
            args = str.split(',');
            //console.log([args[0],args[1]]);
            board.create('segment', args, {name:varname});
        }
    };
    
    this.prepareString = function(fileStr) {
        //fileStr = JXG.Util.utf8Decode(fileStr);
        //fileStr = JXG.GeogebraReader.utf8replace(fileStr);
        return fileStr;
    };
    
    this.readTracenpoche = function(fileStr, board){
        this.data = this.prepareString(fileStr);
        board.suspendUpdate();
        this.parseData(board);
        board.unsuspendUpdate();
        return this.data;
    };
};
