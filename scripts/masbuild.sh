#!/bin/bash

node .electron-vue/build.js

rev=`git rev-list --count HEAD`

electron-builder --p never -m $1 \
    -c.mac.provisioningProfile="build/$1.provisionprofile" \
    -c.mac.bundleVersion="$rev" \
    -c.mac.category="public.app-category.entertainment"
