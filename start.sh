#!/usr/bin/env bash
# CYB!RM - Startup Script
PORT=${1:-8080}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=========================================================="
echo " CYB!RM - Cyberpunk Atmospheric Sound Matrix & Groovebox"
echo " Inspired by GRiMMBIENT/grimm"
echo "=========================================================="
echo "Starting local web server on port $PORT..."
echo "Open in your browser: http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo "=========================================================="

cd "$DIR" && python3 -m http.server "$PORT"
