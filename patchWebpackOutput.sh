#!/usr/bin/env bash

echo "Patch jsxgraphsrc.js"

# IE10/11 and other compatibility:
sed -i "s/\`/'/g" distrib/jsxgraphsrc.js
sed -i "s/str => /function(str)/" distrib/jsxgraphsrc.js
sed -i "s/(self,/(typeof self !== 'undefined' ? self : this,/g" distrib/jsxgraphsrc.js

# Handle "export default JXG" in index.js
sed -i "s/\(module.exports = factory.*)\);$/\1.default;/" distrib/jsxgraphsrc.js
sed -i "s/\(return __webpack_exports__\);/\1.default;/" distrib/jsxgraphsrc.js

# Do not require canvas outside of node.
# AMD
sed -i "s/\[\"canvas\"\], factory/[], factory/" distrib/jsxgraphsrc.js
# At this point the nodejs part already ends with ".default;" and should be ignored
sed -i "s/factory(require(\"canvas\"));/factory();/" distrib/jsxgraphsrc.js
# Browser
sed -i "s/factory(root\[\"canvas\"\])/factory()/" distrib/jsxgraphsrc.js

echo "Patch jsxgraphcore.js"
sed -i "s/\`/'/g" distrib/jsxgraphcore.js
sed -i "s/t=>/function(t)/" distrib/jsxgraphcore.js
sed -i "s/self,(function(__WEBPACK_EXTERNAL_MODULE/typeof self !== 'undefined' ? self : this,(function(__WEBPACK_EXTERNAL_MODULE/g" distrib/jsxgraphcore.js
sed -i "s/:/.default:/" distrib/jsxgraphcore.js

# Unused:
# module.exports = factory((function webpackLoadOptionalExternalModule() { try { return require("canvas"); } catch(e) {} }()));
# sed -i "s/\(module.exports=e(function(){try{return require("canvas")}catch(t){}}())\):/\1.default:/" distrib/jsxgraphcore.js
