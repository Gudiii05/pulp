$ErrorActionPreference = 'Stop'
$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

$Version = '0.1.1'
$keyPath = "$env:USERPROFILE\.tauri\pulp.key"
$keyPassword = 'pulp123'
$notesFile = 'C:\pulp\scripts\release-notes-0.1.1.txt'

Set-Location 'C:\pulp'

# Helper: write file without BOM (Set-Content -Encoding UTF8 adds one on PS5)
function Write-FileNoBom([string]$Path, [string]$Content) {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$confPath = 'C:\pulp\src-tauri\tauri.conf.json'
$confText = [System.IO.File]::ReadAllText($confPath)
$tempConf = $confText -replace '"createUpdaterArtifacts": true', '"createUpdaterArtifacts": false'
Write-FileNoBom $confPath $tempConf

Write-Host "==> Building v$Version (signing disabled during build)..."
try {
    $env:TAURI_SIGNING_PRIVATE_KEY = $null
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $null
    npm run tauri build
    if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }
}
finally {
    Write-FileNoBom $confPath $confText
}

$nsis = "C:\pulp\src-tauri\target\release\bundle\nsis\Pulp_${Version}_x64-setup.exe"
$msi  = "C:\pulp\src-tauri\target\release\bundle\msi\Pulp_${Version}_x64_en-US.msi"

Write-Host "==> Signing $nsis ..."
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $keyPassword
npx --yes @tauri-apps/cli signer sign -f $keyPath $nsis
if ($LASTEXITCODE -ne 0) { throw "signer sign failed" }

$sigPath = "$nsis.sig"
if (-not (Test-Path $sigPath)) { throw "Signature file not produced at $sigPath" }
$signature = ([System.IO.File]::ReadAllText($sigPath)).Trim()

Write-Host "==> Generating latest.json ..."
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$downloadUrl = "https://github.com/Gudiii05/pulp/releases/download/v$Version/Pulp_${Version}_x64-setup.exe"
$notes = [System.IO.File]::ReadAllText($notesFile)

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
$json = $latestObj | ConvertTo-Json -Depth 10
Write-FileNoBom $latestJsonPath $json

Write-Host "==> Creating GitHub release v$Version ..."
gh release create "v$Version" `
    --title "Pulp v$Version" `
    --notes-file $notesFile `
    $nsis $msi $sigPath $latestJsonPath

Write-Host ""
Write-Host "==> Done. v$Version published with signed updater bundle."
