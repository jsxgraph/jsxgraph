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

        // In index.js JSXgrph is exported via "export default JXG"
        // Without "export: 'default'" below, with
        //    import pgk from "...jsxgraphcore"
        // JXG would be available as "pkg.default"
        // With "export: 'default'" we can do
        //    import JXG from "...jsxgraphcore"
        library: {
            name: libraryName,
            type: 'var',
            export: 'default'
        },

        // Unnamed AMD define
        umdNamedDefine: false,

        // Webworker and "normal" use
        globalObject: "typeof self !== 'undefined' ? self : this",

        // Just comments
        auxiliaryComment: {
            root: 'Root (browser)',
            commonjs: 'CommonJS',
            commonjs2: 'CommonJS2 (nodejs)',
            amd: 'AMD'
        }
    },
    target: ["web", "es5"],

    // Unused for the moment
    // plugins: [
    //     new ReplaceInFileWebpackPlugin([
    //         {
    //             dir: "distrib",
    //             files: ["jsxgraphcore.js", "jsxgraphsrc.js"],
    //             rules: [
    //                 // {
    //                 //     search: /\(self,/,
    //                 //     replace: "(typeof self !== 'undefined' ? self : this,"
    //                 // },
    //                 // AMD and nodejs
    //                 // {
    //                 //     search: /return __webpack_exports__;/,
    //                 //     replace: "return __webpack_exports__.default;"
    //                 // },
    //                 // AMD does not need canvas
    //                 // { search: /\["canvas"\], factory/, replace: "[], factory" },
    //                 // commonjs
    //                 // {
    //                 //     search: /\] = factory\(require\("canvas"\)\);/,
    //                 //     replace: "] = factory();"
    //                 // },
    //                 // { search: /factory\(root\["canvas"\]\)/, replace: "factory()" }
    //                 // browser
    //                 // {
    //                 //     search: /root\["jsxgraphcore"\] = factory\(root\["canvas"\]\);/,
    //                 //     replace: "root['JXG'] = factory();"
    //                 // }
    //             ]
    //         }
    //     ])
    // ],

    // externals: 'canvas',
    externals: {
        // AMD does not need canvas, so would root.
        // commonjs2 needs the canvas plug-in
        canvas: {
            commonjs: 'canvas',
            commonjs2: 'canvas',
            root: 'canvas'
        }
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /core\.js$/
            })
        ]
    }
};

const config_es6 = {
    ...baseConfig,
    devtool: "source-map",
    entry: {
        jsxgraphsrc_es6: [PATHS.entryPoint],
        jsxgraphcore_es6: [PATHS.entryPoint]
    },
    output: {
        path: PATHS.bundles,
        filename: "[name].js",
    },
    target: ["web"],

    externals: 'canvas',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /core_es6\.js$/
            })
        ]
    }
};

module.exports = [config_es5, config_es6];
