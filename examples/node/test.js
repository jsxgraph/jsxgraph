

(function () {
    'use strict';
    
    var sketch = require('./sketch'),
        rd = require('./readdir'),
        
        i,
        files = rd.readDir('./Sketches', '.sketch'),
        len = files.length;
    
    for (i = 0; i < len; i++) {
        console.log(sketch.test(files[i], false) + '\n\n');
    }
}());


