#!/bin/env bash

# Build script for WallWiz

## Fetch the QuickJS source code, then build and install the compiler and interpreter in the system.
   git clone --depth 1 https://github.com/bellard/quickjs.git &&
   cd quickjs &&
   make &&
   sudo make install &&
   cd .. &&

## Fetch the required library.
   curl -L -o out.zip https://github.com/ctn-malone/qjs-ext-lib/archive/refs/tags/0.12.4.zip &&
   unzip out.zip &&
   mv qjs-ext-lib-0.12.4 qjs-ext-lib &&
   rm out.zip &&

## Fetch helper scripts
   git clone --depth 1 https://github.com/5hubham5ingh/justjs.git &&

## Clone the WallWiz project
   git clone --depth 1 https://github.com/5hubham5ingh/WallWiz.git &&

## Build WallWiz then install it.
   cd WallWiz/src &&
   qjsc -flto main.js -o WallWiz &&
   sudo cp WallWiz /usr/bin/ &&
   echo "WallWiz installation completed successfully."
