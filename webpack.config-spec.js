const path = require("path")
const nodeExternals = require("webpack-node-externals")
const bundleIndexPath = path.resolve("./src/bundle.js")

module.exports = {
  entry: {
    mapd3: bundleIndexPath
  },
  output: {
    // use absolute paths in sourcemaps (important for debugging via IDE)
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
  },
  target: "node", // webpack should compile node compatible code
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  devtool: "inline-cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|doc|dist|dev)/,
        use: {
          loader: "babel-loader"
        }
      },
      {test: /\.scss$/, loader: "null-loader"},
      {test: /\.css$/, loader: "null-loader"}
    ]
  }
}
