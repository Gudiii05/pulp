$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH
Set-Location 'C:\pulp\src-tauri'

Write-Host "Cleaning pulp crate build cache..."
cargo clean -p pulp 2>&1

# Also remove the target bundle dir so old installers don't linger
Remove-Item -Recurse -Force 'C:\pulp\src-tauri\target\release\bundle' -ErrorAction SilentlyContinue

Set-Location 'C:\pulp'

# Regenerate icons from the source PNG (idempotent but ensures freshness)
Write-Host "Regenerating icons from public/appicon.png..."
npx --yes @tauri-apps/cli icon "public/appicon.png" 2>&1 | Select-String -Pattern "Creating" -SimpleMatch:$false -NotMatch | Select-Object -First 5

# Load signing key
$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
if (Test-Path $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $keyPath -Raw
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
}

Write-Host "Running tauri build..."
npm run tauri build 2>&1
