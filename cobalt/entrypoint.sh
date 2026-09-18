#!/bin/sh
set -e

if [ -n "$PORT" ]; then
  export API_PORT="$PORT"
fi

COOKIE_FILE="${COOKIE_PATH:-/tmp/cookies.json}"

if [ -n "$COOKIE_JSON" ]; then
  printf '%s' "$COOKIE_JSON" > "$COOKIE_FILE"
  export COOKIE_PATH="$COOKIE_FILE"
elif [ -n "$COOKIES_B64" ]; then
  printf '%s' "$COOKIES_B64" | base64 -d > "$COOKIE_FILE"
  export COOKIE_PATH="$COOKIE_FILE"
fi

exec node src/cobalt
