# DEV-LOCAL SCRIPT — NOT a production release path.
# Production releases are owned by .github/workflows/release.yml.
# Use this script only to regenerate the local signing keypair.
# The resulting private key MUST NOT be committed to git.

$ErrorActionPreference = 'Stop'
$keyPath = "$env:USERPROFILE\.tauri\pulp.key"

# Read passphrase from environment; fall back to interactive prompt for local dev use.
$keyPwd = $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD
if (-not $keyPwd) {
    $secureString = Read-Host -AsSecureString -Prompt "Signing key passphrase"
    $keyPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    )
}

Set-Location 'C:\pulp'
npx --yes @tauri-apps/cli signer generate -p $keyPwd -w $keyPath --force --ci

Write-Host "---"
Write-Host "New public key:"
Get-Content "$keyPath.pub"
