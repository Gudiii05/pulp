$paths = @(
    "$env:USERPROFILE\.cargo\bin\cargo.exe",
    "$env:USERPROFILE\.rustup\toolchains",
    "C:\Users\thepa\.cargo\bin\cargo.exe"
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "FOUND: $p"
    } else {
        Write-Host "MISSING: $p"
    }
}
Write-Host "---"
Get-ChildItem "$env:USERPROFILE" -Filter '.cargo' -Force -ErrorAction SilentlyContinue | Select-Object FullName
Get-ChildItem "$env:USERPROFILE" -Filter '.rustup' -Force -ErrorAction SilentlyContinue | Select-Object FullName
