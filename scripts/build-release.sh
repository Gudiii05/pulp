#!/usr/bin/env bash
# DEV-LOCAL SCRIPT — Linux / macOS port of build-release.ps1.
# Local production build with optional updater signing. For dev testing only.
# Production releases come from .github/workflows/release.yml.

set -euo pipefail

KEY_PATH="${TAURI_SIGNING_KEY_PATH:-$HOME/.tauri/pulp-v2.key}"

if [[ -f "$KEY_PATH" ]]; then
  export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")"
  if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
    read -rsp "Signing key passphrase: " TAURI_SIGNING_PRIVATE_KEY_PASSWORD
    echo
    export TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  fi
  echo "==> Signing key loaded from $KEY_PATH"
else
  echo "WARNING: signing key not found at $KEY_PATH — build will not be signed." >&2
fi

cd "$(dirname "$0")/.."
npm run tauri build
