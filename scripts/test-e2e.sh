#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."
PATH="$(pwd)/node_modules/.bin:$PATH"

SERVER_NAME="server"
APP_ORIGIN="http://127.0.0.1:3100"
MOCK_API_HEALTHCHECK="http://localhost:8080/api/healthcheck"

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null)
  if [ -n "$pids" ]; then
    kill -9 $pids >/dev/null 2>&1
  fi
}

# A leftover pm2 daemon respawns the mock API with its cached origin and
# blocks every journey from the e2e origin; stop it before anything else.
if pgrep -f "PM2 v" >/dev/null 2>&1; then
  pkill -9 -f "PM2 v" >/dev/null 2>&1
  sleep 1
fi

kill_port 3100
kill_port 8080

VITE_APP_APP_URL="$APP_ORIGIN" npm run run-mock-server >/dev/null 2>&1 &
MOCK_PID=$!

cleanup() {
  kill "$MOCK_PID" >/dev/null 2>&1
  kill_port 8080
}
trap cleanup EXIT

for attempt in $(seq 1 60); do
  if curl --silent --fail "$MOCK_API_HEALTHCHECK" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "Mock API server did not come up at $MOCK_API_HEALTHCHECK" >&2
    exit 1
  fi
  sleep 1
done

npx playwright test "$@"
