const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: {
            module: true,
          },
          compress: {
            module: true,
            drop_console: true,
            passes: 2,
          },
        },
      }),
    ],
  },
});
