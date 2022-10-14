const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    resolve: {
      fallback: { path: require.resolve("path-browserify"), fs: false },
      modules: [path.resolve("./src"), path.resolve("./node_modules")],
      extensions: [".js"]
    },
    // Activate source maps for the bundles in order to preserve the original
    // source when the user debugs the application
    devtool: "source-map"
};
