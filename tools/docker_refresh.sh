#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 GL!TCH
# Everything that is made from the firmware, on any computer with Docker (macOS too: the host build needs Linux,
# the browser build needs Emscripten, the hub's demo needs ffmpeg):
#   1. web/build_web.sh        -> web/glitch.wasm, web/dist      (emscripten/emsdk)
#   2. tests/run_host.sh       -> build/host/grimm, the tests   (gcc, Pillow)
#   3. tools/gen_screens.py    -> docs/screens/*.png, docs/card.png
#   4. tools/gen_hub.py        -> hub/ (the data, the emulator, hub/audio/demo.mp3)
#   tools/docker_refresh.sh [VERSION]      (default 2.0)
set -e
cd "$(dirname "$0")/.."
VER="${1:-2.0}"
docker info >/dev/null 2>&1 || { echo "docker_refresh: Docker is not running"; exit 1; }
printf 'FROM python:3.12-slim\nRUN apt-get update -qq && apt-get install -y -qq gcc libc6-dev ffmpeg && rm -rf /var/lib/apt/lists/* && pip install -q Pillow\n' \
    | docker build -q -t glitch-host - >/dev/null
docker run --rm -v "$PWD":/src -w /src -e EMSDK=/emsdk -e APP_VER="$VER" emscripten/emsdk:3.1.74 sh web/build_web.sh
docker run --rm -v "$PWD":/src -w /src -e APP_VER="$VER" glitch-host sh -c \
    "sh tests/run_host.sh > build/host-test.log 2>&1 || { tail -20 build/host-test.log; exit 1; }
     echo \"host tests: \$(grep -cE '^ +ok ' build/host-test.log) ok (build/host-test.log)\"
     python3 tools/gen_screens.py | tail -1
     python3 tools/gen_hub.py --version $VER"
