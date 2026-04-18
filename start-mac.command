#!/bin/bash
# Sarah's Brain — Mac launcher
# Double-click this file in Finder to start the app.
# (If macOS asks, click "Open" in the security dialog the first time.)

# Find the directory this script lives in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "  Starting Sarah's Brain…"
echo ""

# Install server dependencies if needed
if [ ! -d "$DIR/server/node_modules" ]; then
  echo "  Installing server dependencies (first run only)…"
  npm install --prefix "$DIR/server"
fi

# Build client if dist folder is missing
if [ ! -d "$DIR/client/dist" ]; then
  echo "  Installing client dependencies (first run only)…"
  npm install --prefix "$DIR/client"
  echo "  Building the app (first run only, takes ~30 seconds)…"
  "$DIR/client/node_modules/.bin/vite" build \
    --outDir "$DIR/client/dist" \
    2>&1 | grep -E "(built|error|warning)"
fi

# Kill any existing instance on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the server
node "$DIR/server/index.js" &
SERVER_PID=$!

# Wait for it to be ready
sleep 2

# Open browser
open "http://localhost:3001"

echo "  Sarah's Brain is open in your browser."
echo "  Keep this window open while you use the app."
echo ""
echo "  Press Ctrl+C or close this window to stop."
echo ""

# Keep script alive so the terminal stays open and server keeps running
wait $SERVER_PID
