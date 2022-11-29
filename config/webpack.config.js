const path = require("path");
const baseConfig = require("./webpack.config.base");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const libraryName = "jsxgraphcore";
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
    // ----------------------------------
    // Working config for including JSXGraph in web browsers
    output: {
        path: PATHS.bundles,
        filename: "[name].js",
        libraryTarget: "umd",
        library: libraryName,
        umdNamedDefine: false
    },
    target: ["web", "es5"],

    plugins: [
        new ReplaceInFileWebpackPlugin([
            {
                dir: "distrib",
                files: ["jsxgraphcore.js", "jsxgraphsrc.js"],
                rules: [
                    {
                        search: /\(self,/,
                        replace: "(typeof self !== 'undefined' ? self : this,"
                    },

                    // AMD and nodejs
                    {
                        search: /return __webpack_exports__;/,
                        replace: "return __webpack_exports__.default;"
                    },

                    // AMD does not need canvas
                    { search: /\["canvas"\], factory/, replace: "[], factory" },

                    // ?
                    {
                        search: /\] = factory\(require\("canvas"\)\);/,
                        replace: "] = factory();"
                    },
                    { search: /factory\(root\["canvas"\]\)/, replace: "factory()" }
                ]
            }
        ])
    ],

    externals: "canvas",
    // ----------------------------------
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
