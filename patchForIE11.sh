#!/usr/bin/env bash

echo "patch jsxgraphsrc.js"
sed -i "s/\`/'/g" distrib/jsxgraphsrc.js
sed -i "s/str => /function(str)/" distrib/jsxgraphsrc.js
# sed -i "s/(self,/(typeof self !== 'undefined' ? self : this,/g" distrib/jsxgraphsrc.js

echo "patch jsxgraphcore.js"
sed -i "s/\`/'/g" distrib/jsxgraphcore.js
sed -i "s/t=>/function(t)/" distrib/jsxgraphcore.js

