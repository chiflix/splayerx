'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const childProcess = require('child_process')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const { dependencies, optionalDependencies } = require('../package.json')

let release = '';
try {
  const result = childProcess.spawnSync('git', ['describe', '--tag', '--exact-match', '--abbrev=0']);
  if (result.status === 0) {
    const tag = result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '');
    if (tag) release = `SPlayer${tag}`;
  }
} catch(ex) {
  console.error(ex);
}

function generateHtmlWebpackPluginConfig(name) {
  return {
    chunks: [name],
    filename: `${name}.html`,
    template: path.resolve(__dirname, `../src/index.ejs`),
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
  devtool: '#module-eval-source-map',
  entry: {
    preference: path.join(__dirname, '../src/renderer/preference.js'),
    about: path.join(__dirname, '../src/renderer/about.js'),
    labor: path.join(__dirname, '../src/renderer/labor.ts'),
    index: path.join(__dirname, '../src/renderer/main.ts'),
  },
  externals: [
    ...Object.keys(Object.assign({}, dependencies, optionalDependencies)).filter(d => !whiteListedModules.includes(d))
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
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
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [ /\.vue$/ ]
            }
          }
        ]
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
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('labor')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('about')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('preference')),
    new webpack.HotModuleReplacementPlugin(),
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
    new ForkTsCheckerWebpackPlugin({ eslint: true, vue: true }),
    new webpack.DefinePlugin({
      'process.platform': `"${process.platform}"`,
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.stage.sagittarius.ai:8443'}"`,
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
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.sagittarius.ai:8443'}"`,
      'process.env.SENTRY_RELEASE': `"${release}"`,
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )

  rendererConfig.optimization = {
    minimizer: [new TerserPlugin({
      terserOptions: {
        keep_classnames: true
      }
    })],
  }

  if (process.platform === 'darwin') { // only check on mac, to speed up Windows build
    rendererConfig.plugins.push(
      new ForkTsCheckerWebpackPlugin({ eslint: true, vue: true })
    )
  }

  if (release && process.env.SENTRY_AUTH_TOKEN) {
    rendererConfig.plugins.push(
      new SentryWebpackPlugin({
        release,
        include: './dist',
        urlPrefix: 'app:///dist/',
        ext: ['js', 'map'],
        ignore: ['node_modules']
      }),
      new SentryWebpackPlugin({
        release,
        include: './src',
        urlPrefix: 'webpack:///./src/',
        ext: ['js', 'ts', 'vue'],
        ignore: ['node_modules']
      })
    );
  }
}

module.exports = rendererConfig
