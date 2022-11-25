#!/usr/bin/env bash

echo "patch jsxgraphsrc.js"
sed -i "s/\`/'/g" distrib/jsxgraphsrc.js
sed -i "s/str => /function(str)/" distrib/jsxgraphsrc.js
sed -i "s/(self,/(typeof self !== 'undefined' ? self : this,/g" distrib/jsxgraphsrc.js
sed -i "s/\(module.exports = factory.*)\);$/\1.default;/" distrib/jsxgraphsrc.js
# module.exports = factory((function webpackLoadOptionalExternalModule() { try { return require("canvas"); } catch(e) {} }()));

echo "patch jsxgraphcore.js"
sed -i "s/\`/'/g" distrib/jsxgraphcore.js
sed -i "s/t=>/function(t)/" distrib/jsxgraphcore.js
sed -i "s/self,(function(__WEBPACK_EXTERNAL_MODULE/typeof self !== 'undefined' ? self : this,(function(__WEBPACK_EXTERNAL_MODULE/g" distrib/jsxgraphcore.js
# sed -i "s/\(module.exports=e(function(){try{return require("canvas")}catch(t){}}())\):/\1.default:/" distrib/jsxgraphcore.js
sed -i "s/:/.default:/" distrib/jsxgraphcore.js
