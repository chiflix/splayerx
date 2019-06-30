'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const childProcess = require('child_process')
const { dependencies, _moduleAliases } = require('../package.json')
const webpack = require('webpack')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

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

let mainConfig = {
  mode: 'development',
  devtool: '#source-map',
  entry: {
    main: path.join(__dirname, '../src/main/index.js')
  },
  externals: [
    ...Object.keys(dependencies || {})
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
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico|icns)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 1000000
          }
        }
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron')
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.json', '.node'],
    alias: _moduleAliases || {},
  },
  target: 'electron-main'
}

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.mode = 'production';
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.SENTRY_RELEASE': `"${release}"`,
      'process.env.NODE_ENV': '"production"'
    })
  )
  if (release && process.env.SENTRY_AUTH_TOKEN) {
    mainConfig.plugins.push(
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

module.exports = mainConfig
