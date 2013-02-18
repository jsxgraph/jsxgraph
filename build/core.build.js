{
    "baseUrl": "../src/",
    "name": "almond",
    "include": [
        "../build/core.deps.js"
    ],
    "wrap": {
        "start": "(function () {",
        "end": "window.JXG = require('jxg');}())"
    },
    "out": './bin/core-src.js',
    "optimize": "none"
}