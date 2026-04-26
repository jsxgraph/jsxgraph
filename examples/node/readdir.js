

(function () {

    'use strict';

    var dirs = [],
        files = [],
        fs = require('fs'),
        pa = require('path'),
        
        isDir = function (path) {
            var stat = fs.statSync(path);
            
            return stat.isDirectory();
        };


    module.exports = {
        readDir: function (dir, filter) {
            var i,
                path,
                result = fs.readdirSync(dir),
                len = result.length,
                files = [];
            
            for (i = 0; i < len; i++) {
                path = dir + pa.sep + result[i];
                
                if (isDir(path)) {
                    files = files.concat(this.readDir(path, filter));
                } else if (!filter || filter === pa.extname(path)) {
                    files.push(path);
                }
            }
            
            return files;
        }
    };
    
}());