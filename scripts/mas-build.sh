#!/bin/bash

# Reinstall the electron mas version
IS_MAS_CMD="echo 'process.mas' | ./node_modules/.bin/electron -i"
IS_MAS="$(eval "$IS_MAS_CMD")"
if [[ $IS_MAS != *"true"* ]]; then
    ELECTRON_VERSION=`node -p -e "require('./package.json').devDependencies['@chiflix/electron']"`
    ELECTRON_VERSION=${ELECTRON_VERSION/^/''}
    rm -fr ./node_modules/@chiflix/electron
    force_no_cache='true' npm_config_platform=mas yarn add @chiflix/electron@$ELECTRON_VERSION --exact
fi

node .electron-vue/build.js

rev=`git rev-list --count HEAD`

electron-builder -p never -m $1 \
    -c electron-builder.json \
    -c.mac.provisioningProfile="build/$1.provisionprofile" \
    -c.mac.bundleVersion="$rev" \
    -c.mac.category="public.app-category.entertainment"
