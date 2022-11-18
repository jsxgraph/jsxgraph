const path = require("path");
const baseConfig = require("./webpack.config.base");
const TerserPlugin = require("terser-webpack-plugin");

const libraryName = "JSXGraph";
const PATHS = {
    entryPoint: path.resolve(__dirname, "../src/index.js"),
    bundles: path.resolve(__dirname, "../distrib")
};

const config = {
    ...baseConfig,
    // Activate source maps for the bundles in order to preserve the original
    // source when the user debugs the application
    devtool: "source-map",
    entry: {
        jsxgraphsrc: [PATHS.entryPoint],
        jsxgraphcore: [PATHS.entryPoint]
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
    target: ['web', 'es5'],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /core\.js$/
            })
        ]
    }
};

module.exports = config;
