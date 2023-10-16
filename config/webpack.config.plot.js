const path = require("path");
const baseConfig = require("./webpack.config.base");
const TerserPlugin = require("terser-webpack-plugin");

const libraryName = "JSXPlot";
const PATHS = {
    entryPoint: path.resolve(__dirname, "../src/plot.js"),
    bundles: path.resolve(__dirname, "../build/bin")
};

const config = {
    ...baseConfig,
    entry: {
        jsxplot: [PATHS.entryPoint]
    },
    // The output defines how and where we want the bundles. The special value
    // `[name]` in `filename` tell Webpack to use the name we defined above. We
    // target a UMD and name it MyLib. When including the bundle in the browser it
    // will be accessible at `window.MyLib`
    output: {
        path: PATHS.bundles,
        filename: "[name].js",
        libraryTarget: "umd",
        library: libraryName,
        umdNamedDefine: true
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({})]
    }
};

module.exports = config;
