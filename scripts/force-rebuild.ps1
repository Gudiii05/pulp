$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

$root = 'C:\pulp\src-tauri\target\release'

Write-Host "Deleting cached pulp build artifacts..."
Get-ChildItem -Path "$root\build" -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'pulp-*' } |
    ForEach-Object {
        Write-Host "  rm $($_.FullName)"
        Remove-Item -Recurse -Force $_.FullName
    }

Get-ChildItem -Path "$root\deps" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'pulp-*' -or $_.Name -like 'pulp_lib-*' } |
    ForEach-Object {
        Write-Host "  rm $($_.FullName)"
        Remove-Item -Force $_.FullName
    }

Remove-Item -Force "$root\pulp.exe" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$root\bundle" -ErrorAction SilentlyContinue

# Also nuke the build script fingerprint files for pulp
Get-ChildItem -Path "$root\.fingerprint" -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'pulp-*' -or $_.Name -like 'pulp_lib-*' } |
    ForEach-Object {
        Write-Host "  rm fingerprint $($_.FullName)"
        Remove-Item -Recurse -Force $_.FullName
    }

Set-Location 'C:\pulp'

# Load signing key
$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
if (Test-Path $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $keyPath -Raw
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
}

Write-Host "Running tauri build..."
npm run tauri build 2>&1
