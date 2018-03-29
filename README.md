# SPlayer
[![Dependencies Status](https://david-dm.org/chiflix/splayerx/status.svg)](https://david-dm.org/chiflix/splayerx)
[![devDependencies Status](https://david-dm.org/chiflix/splayerx/dev-status.svg)](https://david-dm.org/chiflix/splayerx?type=dev)
[![Build Status](https://travis-ci.org/chiflix/splayerx.svg?branch=master)](https://travis-ci.org/chiflix/splayerx)
[![appveyor](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?svg=true)](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?svg=true)
[![codecov](https://codecov.io/gh/chiflix/splayerx/branch/master/graph/badge.svg)](https://codecov.io/gh/chiflix/splayerx)

> 目前版本的代码主要目的是建立基础架构，
> 功能上仅支持打开文件后通过空格键暂停和播放，

#### 开发指南

目前架构的特点在 Electron 的基础上使用了 [Vue](https://vuejs.org/) 框架。

> - 开发中使用 webpack，运行 `npm run dev` 修改代码后可以同步至表现层，hot reload，不用重新启动。
> - 使用 eslint 控制代码质量，不满足的代码无法通过编译并会报错。
> - 每次版本提交会通过 travis-ci 和 appveyor 自动编译，如果不能通过编译会记录错误，且相应的 badge: [![Build Status](https://travis-ci.org/chiflix/splayerx.svg?branch=master)](https://travis-ci.org/chiflix/splayerx) 或
[![appveyor](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?svg=true)](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?svg=true)
会变红色。
> - 当 tag 一个特定版本时，ci 工具会自动打包发行版本，并放入 [GitHub Releases](https://github.com/chiflix/splayerx/releases)。
> - 使用 Karma 进行单元测试，codecov的badge [![codecov](https://codecov.io/gh/chiflix/splayerx/branch/master/graph/badge.svg)](https://codecov.io/gh/chiflix/splayerx)
 会显示当前代码的测试覆盖率。
> - 使用 [vue-router](https://router.vuejs.org/en/) 和 [vuex](https://vuex.vuejs.org/en/intro.html)。

#### Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build

# run unit test
npm run unit

# lint all JS/Vue component files in `src/`
npm run lint
```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[7c4e3e9](https://github.com/SimulatedGREG/electron-vue/tree/7c4e3e90a772bd4c27d2dd4790f61f09bae0fcef) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
