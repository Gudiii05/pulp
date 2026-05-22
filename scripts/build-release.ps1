$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
if (Test-Path $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $keyPath -Raw
    # Explicitly set empty password — required even when key has no password,
    # otherwise the signer prompts on stdin and the build hangs.
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
    Write-Host "Signing key loaded from $keyPath"
} else {
    Write-Host "WARNING: signing key not found at $keyPath - build will not be signed."
}

Set-Location 'C:\pulp'
# Feed empty input to stdin defensively in case any tool still prompts.
'' | npm run tauri build 2>&1
