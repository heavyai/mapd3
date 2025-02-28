const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const bundleIndexPath = path.resolve("./src/bundle.js");
const TerserPlugin = require('terser-webpack-plugin');

const config = env => {
  if (env.prod) {
    return {
      entry: {
        d3ComboChart: bundleIndexPath
      },

      devtool: "source-map",

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
            exclude: /(node_modules|doc|dist)/,
            use: {
              loader: "babel-loader"
            }
          },
          {
            test: /\.(sass|scss)$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    config: "postcss.config.js"
                  }
                }
              },
              "sass-loader"
            ]
          }
        ]
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: "[name].css"
        }),
        new TerserPlugin()
      ]
    };
  } else if (env.dev) {
    return {
      entry: {
        d3ComboChart: bundleIndexPath
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
            exclude: /(node_modules|doc|dist)/,
            use: {
              loader: "babel-loader"
            }
          },
          {
            test: /\.(sass|scss)$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    config: "postcss.config.js"
                  }
                }
              },
              "sass-loader"
            ]
          }
        ]
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: "[name].css"
        })
      ]
    };
  } else {
    return;
  }
};

module.exports = config;
