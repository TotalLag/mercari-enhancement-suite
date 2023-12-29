const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { EsbuildPlugin } = require("esbuild-loader");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: "es2015", 
      }),
    ],
  },
});
