{
    "baseUrl": "../src/",
    "name": "../node_modules/almond/almond",
    "include": [
        "../build/core.deps.js"
    ],
    "wrap": {
        "start": "(function () {",
        "end": "window.JXG = require('../build/core.deps.js');}())"
    },
    "out": './bin/jsxgraphcore.js',
    "optimize": "uglify2",
    "preserveLicenseComments": false
}