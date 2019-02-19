'use strict'

require('module-alias/register')

const path = require('path')
const merge = require('webpack-merge')
const webpack = require('webpack')

const baseConfig = require('../../.electron-vue/webpack.renderer.config')
const projectRoot = path.resolve(__dirname, '../../src/renderer')

// Set BABEL_ENV to use proper preset config
process.env.BABEL_ENV = 'test'

let webpackConfig = merge(baseConfig, {
  devtool: '#inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"testing"'
    })
  ]
})

// don't treat dependencies as externals
delete webpackConfig.entry
delete webpackConfig.externals
delete webpackConfig.output.libraryTarget

// apply vue option to apply isparta-loader on js
webpackConfig.module.rules
  .find(rule => rule.use.loader === 'vue-loader').use.options.loaders.js = 'babel-loader'
webpackConfig.module.rules =
  webpackConfig.module.rules.filter(rule => rule.use.loader !== 'eslint-loader')
webpackConfig.module.rules.push({
  test: /node_modules[\/\\](iconv-lite)[\/\\].+/,
  resolve: {
    aliasFields: ['main']
  }
})

module.exports = config => {
  config.set({
    browsers: ['invisibleElectron'],
    client: {
      useIframe: false,
      mocha: {
        timeout: '10000'
      }
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
    customLaunchers: {
      'visibleElectron': {
        base: 'Electron',
        flags: [
          '--show',
          '--disable-web-security',
          '--enable-experimental-web-platform-features',
        ],
      },
      'invisibleElectron': {
        base: 'Electron',
        flags: [
          '--disable-web-security',
          '--enable-experimental-web-platform-features',
        ],
      },
    },
    frameworks: ['mocha', 'chai', 'sinon-chai'],
    files: ['./index.js'],
    preprocessors: {
      './index.js': ['webpack', 'sourcemap']
    },
    reporters: ['spec', 'coverage'],
    singleRun: true,
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    }
  })
}
