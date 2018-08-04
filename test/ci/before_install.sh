#!/bin/bash -xe
# -*- coding: utf-8 -*-

case "$TRAVIS_OS_NAME" in
  "linux")
    # Not using Trusty containers because it can't install wine1.6(-i386),
    # see: https://github.com/travis-ci/travis-ci/issues/6460
    sudo rm /etc/apt/sources.list.d/google-chrome.list
    sudo apt-key adv --fetch-keys http://dl.yarnpkg.com/debian/pubkey.gpg
    echo "deb http://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo dpkg --add-architecture i386
    sudo apt-get update
    sudo apt-get install -y wine1.6 yarn snapd ubuntu-dev-tools
    sudo snap install snapcraft --classic
    npm install -g electron
    curl --location http://rawgit.com/twolfson/fix-travis-ci/master/lib/install.sh | bash -s
    ;;
  "osx")
    ;;
esac
