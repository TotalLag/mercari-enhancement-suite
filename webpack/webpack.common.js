const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
  entry: {
    utils: path.join(srcDir, "utils.ts"),
    before: {
      import: path.join(srcDir, "before.ts"),
      dependOn: "utils",
    },
    after: {
      import: path.join(srcDir, "after.ts"),
      dependOn: "utils",
    },
    client: {
      import: path.join(srcDir, "client.tsx"),
    },
    background: {
      import: path.join(srcDir, "background.ts"),
    },
  },
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "js/[name].js",
  },
  optimization: {
    splitChunks: {
      name: "vendor",
      chunks(chunk) {
        return chunk.name !== "background";
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.css?$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2015",
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
    new CopyPlugin({
      patterns: [{ from: ".", to: "./", context: "public" }],
      options: {},
    }),
  ],
};
