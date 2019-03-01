#!/bin/bash

rev=`git rev-list --count HEAD`

electron-builder --p never -w appx