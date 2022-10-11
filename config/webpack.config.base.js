const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  resolve: {
    root: [path.resolve("../src")],
    extensions: [".js"],
  },
  // Activate source maps for the bundles in order to preserve the original
  // source when the user debugs the application
  devtool: "source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.min\.js$/,
      }),
    ],
  },
};
