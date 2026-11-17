#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 GL!TCH
# docs/deck/index.html -> docs/GLITCH-deck.pdf (1280 x 720 a page), with headless Chrome. The page uses web fonts
# (Google Fonts) and hub/land.js: it is served from the repository root so its relative paths resolve.
#   docs/deck/build.sh
set -e
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || true)"
[ -x "$CHROME" ] || { echo "deck: no Chrome (set CHROME)"; exit 1; }
PORT=8199
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw \
    --virtual-time-budget=8000 --print-to-pdf="$PWD/docs/GLITCH-deck.pdf" "http://127.0.0.1:$PORT/docs/deck/index.html" 2>/dev/null
echo "deck -> docs/GLITCH-deck.pdf ($(wc -c < docs/GLITCH-deck.pdf | tr -d ' ') B)"
