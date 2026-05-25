$ErrorActionPreference = 'Stop'
$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
$keyPwd = 'pulp123'

Set-Location 'C:\pulp'
npx --yes @tauri-apps/cli signer generate -p $keyPwd -w $keyPath --force --ci

Write-Host "---"
Write-Host "New public key:"
Get-Content "$keyPath.pub"
