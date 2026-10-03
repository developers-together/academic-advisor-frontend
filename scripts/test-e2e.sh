#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."
PATH="$(pwd)/node_modules/.bin:$PATH"

SERVER_NAME="server"
APP_ORIGIN="http://127.0.0.1:3100"
MOCK_API_HEALTHCHECK="http://localhost:8080/api/healthcheck"

cleanup() {
  pm2 delete "$SERVER_NAME" >/dev/null 2>&1
  local listener
  listener=$(ss -tlnp 2>/dev/null | grep ':8080' | sed -E 's/.*pid=([0-9]+).*/\1/')
  if [ -n "$listener" ]; then
    kill -9 "$listener" >/dev/null 2>&1
  fi
}
trap cleanup EXIT

cleanup
VITE_APP_APP_URL="$APP_ORIGIN" pm2 start "npm run run-mock-server" --name "$SERVER_NAME" || exit 1

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
