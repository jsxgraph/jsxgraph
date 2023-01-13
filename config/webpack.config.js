const path = require("path");
const baseConfig = require("./webpack.config.base");

// Unused: replace-in-file-webpack-plugin
// in package.json: "replace-in-file-webpack-plugin": "^1.0.6",
// const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

// Name of JSXGraph namespace
const libraryName = "JXG";
const PATHS = {
    entryPoint: path.resolve(__dirname, "../src/index.js"),
    bundles: path.resolve(__dirname, "../distrib")
};

const config_es5 = {
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

        // In index.js, JSXGraph is exported via "export default JXG"
        // Without "export: 'default'" below, with
        //    import pgk from "...jsxgraphcore"
        // JXG would be available as "pkg.default"
        // With "export: 'default'" we can do
        //    import JXG from "...jsxgraphcore"
        library: {
            name: libraryName,
            export: "default",
            type: "umd"
        },

        // Unnamed AMD define
        umdNamedDefine: false,

        // Webworker and "normal" use
        globalObject: "typeof self !== 'undefined' ? self : this",

        // Just comments
        auxiliaryComment: {
            root: "Root (browser)",
            commonjs: "CommonJS",
            commonjs2: "CommonJS2 (nodejs)",
            amd: "AMD"
        }
    },
    target: ["web", "es5"],

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /core\.js$/
            })
        ]
    }
};

const module_config = {
    ...baseConfig,
    devtool: "source-map",
    entry: {
        jsxgraphsrc: [PATHS.entryPoint],
        jsxgraphcore: [PATHS.entryPoint]
    },
    experiments: {
        outputModule: true
    },
    output: {
        path: PATHS.bundles,
        filename: "[name].mjs",
        library: { type: "module" }
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /core\.mjs$/
            })
        ]
    }
};

module.exports = [config_es5, module_config];
