#!/usr/bin/env bash
# DEV-LOCAL CONVENIENCE — Linux / macOS port of release.ps1.
# Requires scripts/release-notes-<VERSION>.txt to exist and be committed first.
# Calls bump.sh (which bumps version files + tags + pushes), then watches the
# CI release workflow until it finishes. Does NOT produce latest.json and does
# NOT create the GitHub release directly — both are owned by
# .github/workflows/release.yml.

set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.1.6" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

NOTES_FILE="scripts/release-notes-$VERSION.txt"
if [[ ! -f "$NOTES_FILE" ]]; then
  echo "Release notes not found at $NOTES_FILE" >&2
  echo "Create that file with the release changelog and commit it before releasing." >&2
  exit 1
fi

# Notes file must be committed — bump.sh requires a clean working tree.
if ! git diff --quiet "$NOTES_FILE" 2>/dev/null || \
   git ls-files --others --exclude-standard --error-unmatch "$NOTES_FILE" 2>/dev/null; then
  echo "$NOTES_FILE has uncommitted changes. Commit it before releasing." >&2
  exit 1
fi

bash "$(dirname "$0")/bump.sh" "$VERSION"

echo ""
echo "==> Watching CI release workflow for v$VERSION ..."
if command -v gh >/dev/null 2>&1; then
  # gh run watch picks the most recent run for the current branch by default
  gh run watch || true
  echo ""
  echo "==> Release URL:"
  gh release view "v$VERSION" --json url --jq .url 2>/dev/null || \
    echo "    Release not yet published — check the Actions tab."
else
  echo "    gh CLI not installed — check https://github.com/Gudiii05/pulp/actions"
fi
