const path = require("path");

module.exports = {
  resolve: {
      fallback: { path: require.resolve("path-browserify"), fs: false },
      modules: [path.resolve("./src"), path.resolve("./node_modules")],
      extensions: [".js"]
    },
};
