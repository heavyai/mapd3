const webpack = require("webpack");
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const bundleIndexPath = path.resolve("./src/bundle.js");

const config = env => {
  if (env.prod) {
    return {
      entry: {
        mapd3: bundleIndexPath
      },

      devtool: "sourcemap",

      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].min.js",
        library: "[name]",
        libraryTarget: "umd"
      },

      externals: {
        "d3/build/d3": "d3/build/d3"
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|doc|dist|dev)/,
            use: {
              loader: "babel-loader"
            }
          },
          {
            test: /\.(sass|scss)$/,
            use: ExtractTextPlugin.extract({
              use: [
                {
                  loader: "css-loader"
                },
                {
                  loader: "postcss-loader",
                  options: {
                    config: {
                      path: "postcss.config.js"
                    }
                  }
                },
                {
                  loader: "sass-loader"
                }
              ]
            })
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
    };
  } else if (env.dev) {
    return {
      entry: {
        mapd3: bundleIndexPath
      },

      devtool: "eval",

      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        library: "[name]",
        libraryTarget: "umd"
      },

      externals: {
        // "d3/build/d3": "d3/build/d3"
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|doc|dist|dev)/,
            use: {
              loader: "babel-loader"
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
        })
      ]
    };
  } else {
    return;
  }
};

module.exports = config;
