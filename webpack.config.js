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
const config = function (env) {
  if (env.prod) {
    return {
      entry: {
        mapd3: bundleIndexPath,
      },

      devtool: "sourcemap",

      output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].min.js',
        library: "[name]",
        libraryTarget: "umd",
      },

      externals: {
        "d3/build/d3": "d3/build/d3"
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ["@babel/preset-env"],
                cacheDirectory: false
              }
            }
          },
          {
            test: /\.(sass|scss)$/,
            use: ExtractTextPlugin.extract(["css-loader", "sass-loader"])
          }
        ]
      },
      plugins: [
        new ExtractTextPlugin({
          filename: "[name].css",
          allChunks: true
        }),
        new webpack.optimize.UglifyJsPlugin()
      ]
    }
  }

  if (env.dev) {
    return {
      entry: {
        mapd3: bundleIndexPath,
      },

      devtool: "eval",

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
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ["@babel/preset-env"],
                cacheDirectory: false
              }
            }
          },
          {
            test: /\.(sass|scss)$/,
            use: ExtractTextPlugin.extract(["css-loader", "sass-loader"])
          }
        ]
      },
      plugins: [
        new ExtractTextPlugin({
          filename: "[name].css",
          allChunks: true
        }),
        // new BundleAnalyzerPlugin()
      ]
    }
  }
}

module.exports = config
