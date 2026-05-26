# PR 1 — Manual steps required before opening the PR

This branch removes the hardcoded `pulp123` passphrase from local scripts. To complete the security rotation, you must do these steps locally and add a second commit before opening the PR.

## 1. Generate a new signing keypair

```bash
npx --yes @tauri-apps/cli signer generate -w "$HOME/.tauri/pulp-v2.key"
```

Choose a strong passphrase (20+ chars, mixed case + digits + symbols). Store it in your password manager.

## 2. Copy the new pubkey into `tauri.conf.json`

The CLI prints a `pubkey` string after generation. Open `src-tauri/tauri.conf.json` and replace the value at `plugins.updater.pubkey` with the new base64 string.

## 3. Set GitHub Actions secrets

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < "$HOME/.tauri/pulp-v2.key"
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD  # paste the new passphrase when prompted
```

Verify:
```bash
gh secret list
```

## 4. Commit the pubkey change

```bash
git add src-tauri/tauri.conf.json
git commit -m "security: rotate signing key pubkey"
git push
```

## 5. Open the PR

```bash
gh pr create --base main --head security/key-rotation \
  --title "security: rotate signing key, remove hardcoded passphrase" \
  --body "Closes the pulp123 leak. Part of #linux-port (PR 1 of 3)."
```

## 6. Delete this file after PR merges

It's a one-time guide; not for the long run.
