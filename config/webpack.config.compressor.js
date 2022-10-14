const path = require("path");
const baseConfig = require("./webpack.config.base");

const libraryName = "JSXCompressor";
const PATHS = {
    entryPoint: path.resolve(__dirname, "../src/compressor.js"),
    bundles: path.resolve(__dirname, "../distrib")
};

const config = {
    ...baseConfig,
    entry: {
        jsxcompressor: [PATHS.entryPoint]
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
        minimizer: [
            new TerserPlugin({
                test: /compressor\.js$/
            })
        ]
    }
};

module.exports = config;
