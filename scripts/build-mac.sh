#!/bin/bash
set -e

[[ "$1" = mas* ]] && MAS=1 || MAS=0

# Reinstall the electron mas version
ELECTRON_IS_MAS_CMD="echo 'process.mas' | ./node_modules/.bin/electron -i"
ELECTRON_IS_MAS="$(eval "$ELECTRON_IS_MAS_CMD")"
ELECTRON_VERSION=`node -p -e "require('./package.json').devDependencies['@chiflix/electron']"`
ELECTRON_VERSION=${ELECTRON_VERSION/^/''}
if ((MAS)) && [[ $ELECTRON_IS_MAS != *"true"* ]] ; then
    rm -fr ./node_modules/@chiflix/electron
    force_no_cache='true' npm_config_platform=mas npm i @chiflix/electron@$ELECTRON_VERSION -D --exact
elif [[ $MAS = 0 ]] && [[ $ELECTRON_IS_MAS = *"true"* ]] ; then
    rm -fr ./node_modules/@chiflix/electron
    force_no_cache='true' npm i @chiflix/electron@$ELECTRON_VERSION -D --exact
fi

# Check if @chiflix/electron is successfully installed
ELECTRON_IS_SPLAYERX_CMD="echo '!!require(\"electron\").splayerx' | ./node_modules/.bin/electron -i"
ELECTRON_IS_SPLAYERX="$(eval "$ELECTRON_IS_SPLAYERX_CMD")"
if [[ $ELECTRON_IS_SPLAYERX != *"true"* ]]; then
    exit 418
fi

node scripts/gen-electron-builder-config.js
node .electron-vue/build.js

if ((MAS)) ; then
    # rejected by apple if contains "paypal"
    find dist/electron -name '*.js' -exec sed -i '' 's/paypal//g' {} \;
    find dist/electron -name '*.js' -exec sed -i '' 's/Paypal//g' {} \;
    find dist/electron -name '*.js' -exec sed -i '' 's/PayPal//g' {} \;
    yarn run electron-builder -p never -m $1 \
        -c electron-builder.json \
        -c.mac.hardenedRuntime=false \
        -c.mac.provisioningProfile="build/$1.provisionprofile" \
        -c.mac.bundleVersion="$(git rev-list --count HEAD)"
else
    yarn run electron-builder -p never
fi
