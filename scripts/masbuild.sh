#!/bin/bash

# Reinstall the electron mas version
ELECTRON_VERSION=`node -p -e "require('./package.json').devDependencies['@chiflix/electron']"`
ELECTRON_VERSION=${ELECTRON_VERSION/^/''}
force_no_cache='true' npm_config_platform=mas npm i @chiflix/electron@$ELECTRON_VERSION

node .electron-vue/build.js

rev=`git rev-list --count HEAD`

electron-builder --p never -m $1 \
    -c.mac.provisioningProfile="build/$1.provisionprofile" \
    -c.mac.bundleVersion="$rev" \
    -c.mac.category="public.app-category.entertainment"
