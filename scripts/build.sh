#!/bin/bash
set -e

node ./scripts/gen-electron-builder-config.js
node .electron-vue/build.js

if [ "$1" == "appx" ]; then
yarn run electron-builder -p never -w appx
else
yarn run electron-builder -p never
fi
