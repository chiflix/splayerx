'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const { dependencies, optionalDependencies } = require('../package.json')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

function generateHtmlWebpackPluginConfig(name) {
  return {
    chunks: [name],
    filename: `${name}.html`,
    template: path.resolve(__dirname, `../src/${name}.ejs`),
    minify: {
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true
    },
    nodeModules: process.env.NODE_ENV !== 'production'
      ? path.resolve(__dirname, '../node_modules')
      : false
  };
}

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue']

let rendererConfig = {
  mode: 'development',
  devtool: '#cheap-module-eval-source-map',
  entry: {
    preference: path.join(__dirname, '../src/renderer/preference.js'),
    about: path.join(__dirname, '../src/renderer/about.js'),
    index: path.join(__dirname, '../src/renderer/main.ts')
  },
  externals: [
    ...Object.keys(Object.assign({}, dependencies, optionalDependencies)).filter(d => !whiteListedModules.includes(d))
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [ /\.vue$/ ]
            }
          }
        ]
      },
      {
        test: /\.(js|vue)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        // 匹配 *.worker.js
        test: /\.worker\.js$/,
        use: {
          loader: 'workerize-loader',
        }
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            extractCSS: process.env.NODE_ENV === 'production',
            loaders: {
              i18n: 'vue-i18n-loader'
            }
          }
        }
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          { loader: 'sass-loader', options: { indentedSyntax: 1 }},
          {
            loader: 'sass-resources-loader',
            options: { resources: path.join(__dirname, '../src/renderer/css/global.scss') },
          },
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader',
          {
            loader: 'sass-resources-loader',
            options: { resources: path.join(__dirname, '../src/renderer/css/global.scss') },
          },
        ]
      },
      {
        test: /\.svg$/,
        include: [path.resolve(__dirname, '../src/renderer/assets/icon')],
        use: {
          loader: 'svg-sprite-loader',
          options: {
            symbolId: '[name]'
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        exclude: [path.resolve(__dirname, '../src/renderer/assets/icon')],
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'media/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|ttc|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        }
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new VueLoaderPlugin(),
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('index')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('about')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('preference')),
    new webpack.HotModuleReplacementPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron'),
    globalObject: 'this',
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../src/renderer'),
      'vue$': 'vue/dist/vue.esm.js',
      "electron"  : "@chiflix/electron",
      "grpc": "@grpc/grpc-js"
    },
    extensions: ['.ts', '.tsx', '.js', '.json', '.node']
  },
  target: 'electron-renderer'
}

/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.platform': `"${process.platform}"`,
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.mode = 'production';
  rendererConfig.devtool = '#source-map'

  rendererConfig.plugins.push(
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, '../static'),
        to: path.join(__dirname, '../dist/electron/static'),
        ignore: ['.*']
      }
    ]),
    new webpack.DefinePlugin({
      'process.platform': `"${process.platform}"`,
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

module.exports = rendererConfig
