#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SDK_DIR="$SCRIPT_DIR/../sdk"
OPENAPI_URL=${OPENAPI_URL:-http://127.0.0.1:8000/openapi.json}

if command -v openapi-generator-cli >/dev/null 2>&1; then
  GENERATOR="openapi-generator-cli"
else
  GENERATOR="npx --yes @openapitools/openapi-generator-cli"
fi

# Intentional word splitting allows GENERATOR to be either the global CLI or npx.
# shellcheck disable=SC2086
$GENERATOR generate \
  -i "$OPENAPI_URL" \
  -g python \
  -o "$SDK_DIR" \
  --additional-properties=packageName=event_sdk,projectName=event-sdk,packageVersion=1.0.0
