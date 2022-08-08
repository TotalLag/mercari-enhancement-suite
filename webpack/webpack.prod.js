const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { ESBuildMinifyPlugin } = require("esbuild-loader");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new ESBuildMinifyPlugin({
        target: "es2015",
      }),
    ],
  },
});
