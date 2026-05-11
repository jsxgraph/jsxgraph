const path = require("path");

module.exports = {
    mode: "production",
    resolve: {
        fallback: { path: require.resolve("path-browserify"), fs: false },
        modules: [path.resolve("./src"), path.resolve("./node_modules")],
        extensions: [".js"]
    }
};
