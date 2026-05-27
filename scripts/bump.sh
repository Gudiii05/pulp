#!/usr/bin/env bash
# DEV-LOCAL SCRIPT — Linux / macOS port of bump.ps1.
# Bumps version in package.json + tauri.conf.json + Cargo.toml, then commits,
# tags, and pushes. Pushing the tag triggers .github/workflows/release.yml
# which builds + signs + publishes the release. CI is the exclusive owner of
# latest.json — this script does NOT touch it.

set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.1.6" >&2
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
  echo "Version must be SemVer (e.g. 0.1.6 or 0.1.6-rc1). Got: $VERSION" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash your changes before bumping." >&2
  exit 1
fi

if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "Tag v$VERSION already exists. Pick a new version." >&2
  exit 1
fi

# Cross-platform sed (BSD sed on macOS does not support -i without an arg)
update_file() {
  local file="$1"
  local expr="$2"
  local tmp="$file.tmp"
  sed -E "$expr" "$file" > "$tmp"
  mv "$tmp" "$file"
}

VER_RE='[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?'

update_file "package.json" "s/\"version\":[[:space:]]*\"$VER_RE\"/\"version\": \"$VERSION\"/"
update_file "src-tauri/tauri.conf.json" "s/\"version\":[[:space:]]*\"$VER_RE\"/\"version\": \"$VERSION\"/"
update_file "src-tauri/Cargo.toml" "s/^version[[:space:]]*=[[:space:]]*\"$VER_RE\"/version = \"$VERSION\"/"

echo "==> Bumped version to $VERSION in package.json, tauri.conf.json, Cargo.toml"

git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump to v$VERSION"
git tag -a "v$VERSION" -m "Pulp v$VERSION"

echo "==> Pushing commit and tag v$VERSION ..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "==> Done. v$VERSION committed, tagged, and pushed."
echo "    CI is now building. Watch: gh run watch"
echo "    (Make sure scripts/release-notes-$VERSION.txt was committed before bumping.)"
