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
        library: {
            name: libraryName,
            type: 'var',
            export: 'default'
        },
        umdNamedDefine: false,
        globalObject: "typeof self !== 'undefined' ? self : this",
        auxiliaryComment: {
            root: 'Root',
            commonjs: 'CommonJS',
            commonjs2: 'CommonJS2',
            amd: 'AMD'
        }
    },
    target: ['web', 'es5'],

    // externals: 'canvas',
    externals: {
        canvas: {
            commonjs: 'canvas',
            commonjs2: 'canvas',
            root: 'canvas'
        }
    },
    // ----------------------------------
    plugins: [
        new ReplaceInFileWebpackPlugin([{
            dir: 'distrib',
            files: ['jsxgraphsrc.js'],
            rules: [{
            //     search: /\(self,/,
            //     replace: "(,"
            // },{
            //     search: /return __webpack_exports__;/,
            //     replace: "return __webpack_exports__.default;"
            //},{
            //     search: /\["canvas"\], factory/,
            //     replace: "[], factory"
            // },{
            //     search: /\] = factory\(require\("canvas"\)\);/,
            //     replace: "] = factory();"
            // },{
                search: /factory\(root\["canvas"\]\)/,
                replace: "factory()"
            }]
        },
        {
            dir: 'distrib',
            files: ['jsxgraphcore.js'],
            rules: [{
            //     search: /\(self,/,
            //     replace: "(typeof self!=='undefined'?self:this,"
            // },{
            //     search: /return __webpack_exports__/,
            //     replace: "return __webpack_exports__.default"
            // },{
            //     search: /define\(\["canvas"\]/,
            //     replace: "define([]"
            // },{
            //     search: /exports.jsxgraphcore=e\(require\("canvas"\)\)/,
            //     replace: "exports.jsxgraphcore=e()"
            // },{
                search: /t.jsxgraphcore=e\(t.canvas\)/,
                replace: "t.jsxgraphcore=e()"
            }]
        }])
    ],

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
