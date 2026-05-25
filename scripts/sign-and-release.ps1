param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [string]$NotesFile = ''
)

$ErrorActionPreference = 'Stop'
$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
if (-not (Test-Path $keyPath)) {
    throw "Signing key not found at $keyPath"
}

$nsis = "C:\pulp\src-tauri\target\release\bundle\nsis\Pulp_${Version}_x64-setup.exe"
$msi  = "C:\pulp\src-tauri\target\release\bundle\msi\Pulp_${Version}_x64_en-US.msi"
if (-not (Test-Path $nsis)) { throw "NSIS bundle not found at $nsis" }
if (-not (Test-Path $msi))  { throw "MSI bundle not found at $msi" }

Set-Location 'C:\pulp'

# Sign with --private-key-path (-f). Password is empty so we set env var.
Write-Host "==> Signing $nsis ..."
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
npx --yes @tauri-apps/cli signer sign -f $keyPath -p '""' $nsis
if ($LASTEXITCODE -ne 0) { throw "signer sign failed" }

$sigPath = "$nsis.sig"
if (-not (Test-Path $sigPath)) { throw "Signature file not produced at $sigPath" }
$signature = (Get-Content $sigPath -Raw).Trim()

Write-Host "==> Generating latest.json ..."
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$downloadUrl = "https://github.com/Gudiii05/pulp/releases/download/v$Version/Pulp_${Version}_x64-setup.exe"

$notes = "New version of Pulp"
if ($NotesFile -and (Test-Path $NotesFile)) {
    $notes = Get-Content $NotesFile -Raw
}

$latestObj = [ordered]@{
    version    = $Version
    notes      = $notes
    pub_date   = $pubDate
    platforms  = [ordered]@{
        'windows-x86_64' = [ordered]@{
            signature = $signature
            url       = $downloadUrl
        }
    }
}

$latestJsonPath = 'C:\pulp\scripts\latest.json'
$latestObj | ConvertTo-Json -Depth 10 | Set-Content -Path $latestJsonPath -Encoding UTF8

Write-Host "==> Creating GitHub release v$Version ..."
$notesArgFile = $latestJsonPath  # placeholder
if ($NotesFile -and (Test-Path $NotesFile)) {
    $notesArg = "--notes-file"
    $notesArgVal = $NotesFile
} else {
    $notesArg = "--notes"
    $notesArgVal = $notes
}

gh release create "v$Version" `
    --title "Pulp v$Version" `
    $notesArg $notesArgVal `
    $nsis $msi $sigPath $latestJsonPath

# Also update the latest.json on v0.1.0 release? No — the updater queries
# /releases/latest/download/latest.json which always resolves to the most
# recent release's latest.json. So this v0.1.1 release's latest.json IS
# what existing v0.1.0 clients will fetch on next check.

Write-Host ""
Write-Host "==> Done. v$Version published. Existing users will see the update banner."
