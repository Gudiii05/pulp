$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH
Set-Location 'C:\pulp'

$keyDir = "$env:USERPROFILE\.tauri"
New-Item -ItemType Directory -Path $keyDir -Force | Out-Null

$privPath = Join-Path $keyDir 'pulp.key'
$pubPath = Join-Path $keyDir 'pulp.key.pub'

if (Test-Path $privPath) {
    Write-Host "Key already exists at $privPath — skipping generation."
} else {
    # Empty password — placeholder. User can regenerate with password later.
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
    npx --yes @tauri-apps/cli signer generate -w $privPath --no-password 2>&1
}

Write-Host "---"
Write-Host "PRIVATE KEY: $privPath"
Write-Host "PUBLIC KEY: $pubPath"
Write-Host "---"
Write-Host "Public key content:"
if (Test-Path $pubPath) {
    Get-Content $pubPath
}
