{
    "baseUrl": "../src/",
    "name": "../build/almond",
    "include": [
        "jsxgraph",
        "base/curve"
    ],
    "wrap": {
        "start": "(function () {",
        "end": "window.JXG = require('jxg');}())"
    },
    "out": './bin/plot-src.js',
    "optimize": "none"
}