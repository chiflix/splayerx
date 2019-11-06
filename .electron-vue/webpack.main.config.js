'use strict';

process.env.BABEL_ENV = 'main';

const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const { dependencies, optionalDependencies, _moduleAliases } = require('../package.json');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

let release = '';
try {
  const result = childProcess.spawnSync('git', [
    'describe',
    '--tag',
    '--exact-match',
    '--abbrev=0',
  ]);
  if (result.status === 0) {
    const tag = result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '');
    if (tag) release = `SPlayer${tag}`;
  }
} catch (ex) {
  console.error(ex);
}

let mainConfig = {
  mode: 'development',
  devtool: '#source-map',
  entry: {
    main: path.join(__dirname, '../src/main/index.js'),
  },
  externals: [...Object.keys(Object.assign({}, dependencies, optionalDependencies))],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter'),
          },
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico|icns)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 1000000,
          },
        },
      },
    ],
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production',
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron'),
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.js', '.json', '.node'],
    alias: {
      electron: '@chiflix/electron',
      grpc: '@grpc/grpc-js',
    },
  },
  target: 'electron-main',
};

const sharedDefinedVariables = {};

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin(Object.assign(sharedDefinedVariables, {
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.stage.sagittarius.ai:8443'}"`,
      'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'http://stage.account.splayer.work'}"`,
      __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
    })),
  );
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.mode = 'production';
  mainConfig.plugins.push(
    new webpack.DefinePlugin(Object.assign(sharedDefinedVariables, {
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.sagittarius.ai:8443'}"`,
      'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'https://account.splayer.work'}"`,
      'process.env.SENTRY_RELEASE': `"${release}"`,
      'process.env.NODE_ENV': '"production"',
    })),
  );
  mainConfig.optimization = {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  };

  if (!process.env.TEST && process.platform === 'darwin') {
    // only check on mac, to speed up Windows build
    mainConfig.plugins.push(new ForkTsCheckerWebpackPlugin({ eslint: true }));
  }
}

module.exports = mainConfig;
