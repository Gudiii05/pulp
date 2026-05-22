# Releasing Pulp

This file describes how to publish a new version that existing installs will
auto-update to.

## One-time setup (already done)

- Signing keys live at `%USERPROFILE%\.tauri\pulp.key` (private) and
  `%USERPROFILE%\.tauri\pulp.key.pub` (public).
- The public key is embedded in `src-tauri/tauri.conf.json` under
  `plugins.updater.pubkey`.
- The endpoint is `https://github.com/Gudiii05/pulp/releases/latest/download/latest.json`
  — change `Gudiii05` to your real GitHub user before the first release.

## Cutting a new release

1. Bump the version in `src-tauri/tauri.conf.json` (`version` field) and
   `package.json`.
2. Set the signing env vars and build:

   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\pulp.key" -Raw
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
   npm run tauri build
   ```

   This produces in `src-tauri/target/release/bundle/`:
   - `nsis/Pulp_X.Y.Z_x64-setup.exe` — installer
   - `nsis/Pulp_X.Y.Z_x64-setup.exe.sig` — minisign signature
   - `msi/Pulp_X.Y.Z_x64_en-US.msi` — alternative installer
   - `msi/Pulp_X.Y.Z_x64_en-US.msi.sig` — its signature

3. Build a `latest.json` describing the release. Save this file with the
   correct signature pulled from the `.sig` file:

   ```json
   {
     "version": "X.Y.Z",
     "notes": "Short release notes here.",
     "pub_date": "2026-05-22T12:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "signature": "<paste contents of Pulp_X.Y.Z_x64-setup.exe.sig here>",
         "url": "https://github.com/Gudiii05/pulp/releases/download/vX.Y.Z/Pulp_X.Y.Z_x64-setup.exe"
       }
     }
   }
   ```

4. Create a GitHub Release tagged `vX.Y.Z` and upload as assets:
   - `Pulp_X.Y.Z_x64-setup.exe`
   - `Pulp_X.Y.Z_x64-setup.exe.sig`
   - `latest.json`

That's it — existing installs check the endpoint on startup, see the new
`version`, verify the `signature` against the embedded public key, and offer
the update to the user.

## Security

- NEVER commit the private key (`%USERPROFILE%\.tauri\pulp.key`) to the repo.
- If you lose the private key, existing installs cannot accept any future
  update (they verify against the embedded public key). You would have to
  ship a fresh installer manually.
