#!/bin/bash

node .electron-vue/build.js

rev=`git rev-list --count HEAD`

electron-builder --p never -w appx