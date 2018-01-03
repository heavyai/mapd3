const webpack = require("webpack")
const path = require("path")
const LiveReloadPlugin = require("webpack-livereload-plugin")
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const chartModulesPath = path.resolve("./src/charts")
const fixturesPath = path.resolve("./test/fixtures")
const vendorsPath = path.resolve("./node_modules")
const bundleIndexPath = path.resolve("./src/bundle.js")
const scssIndexPath = path.resolve("./src/styles/mapd3.scss")


const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
const projectName = "mapd3"

const defaultJSLoader = {
  test: /\.js$/,
  include: /src/,
  exclude: /(node_modules)/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ["@babel/preset-env"],
      cacheDirectory: false
    }
  }
}
const plugins = [
      // Uncomment this line to see bundle composition analysis
      // new BundleAnalyzerPlugin()
]
const config = function (env) {
  // Creates a bundle with all mapd3
  // if (env.prod) {
  //   plugins.push(new UglifyJsPlugin({minimize: false}))

  //   return {
  //     entry: {
  //       mapd3: bundleIndexPath
  //     },

  //     devtool: "source-map",

  //     output: {
  //       path: path.resolve(__dirname, "dist"),
  //       filename: "mapd3.min.js",
  //       library: ["mapd3"],
  //       libraryTarget: "umd-module",
  //       libraryExport: "default"
  //     },

  //     externals: {
  //       // "d3/build/d3": "d3/build/d3"
  //     },

  //     module: {
  //       loaders: [defaultJSLoader]
  //     },

  //     plugins
  //   }
  // }

  if (env.dev) {
    return {
      entry: {
        mapd3: bundleIndexPath,
        style: scssIndexPath
      },

      devtool: "hidden-source-map",

      output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].js',
        library: "[name]",
        libraryTarget: "umd",
      },

      externals: {
        // "d3/build/d3": "d3/build/d3"
      },

      module: {
        loaders: [defaultJSLoader],
        rules: [
          { // regular css files
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
              use: "css-loader?importLoaders=1"
            })
          },
          { // sass / scss loader for webpack
            test: /\.(sass|scss)$/,
            use: ExtractTextPlugin.extract(["css-loader", "sass-loader"])
          }
        ]
      },
      plugins: [
        new ExtractTextPlugin({ // define where to save the file
          filename: "[name].css",
          allChunks: true
        })
      ]
    }
  }
}

module.exports = config
