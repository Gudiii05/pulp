param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    throw "Version must be SemVer (e.g. 0.1.6). Got: $Version"
}

Set-Location 'C:\pulp'

# Abort if working tree is dirty
$gitStatus = git status --porcelain
if ($gitStatus) {
    throw "Working tree is not clean. Commit or stash your changes before bumping."
}

# Abort if tag already exists
$existingTag = git tag --list "v$Version"
if ($existingTag) {
    throw "Tag v$Version already exists. Pick a new version."
}

# Helper: write file without BOM
function Write-FileNoBom([string]$Path, [string]$Content) {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

# 1. Bump package.json
$pkgPath = 'C:\pulp\package.json'
$pkgText = [System.IO.File]::ReadAllText($pkgPath)
$pkgText = $pkgText -replace '"version":\s*"\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Write-FileNoBom $pkgPath $pkgText

# 2. Bump tauri.conf.json
$confPath = 'C:\pulp\src-tauri\tauri.conf.json'
$confText = [System.IO.File]::ReadAllText($confPath)
$confText = $confText -replace '"version":\s*"\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Write-FileNoBom $confPath $confText

# 3. Bump Cargo.toml
$cargoPath = 'C:\pulp\src-tauri\Cargo.toml'
$cargoText = [System.IO.File]::ReadAllText($cargoPath)
$cargoText = $cargoText -replace '(?m)^version\s*=\s*"\d+\.\d+\.\d+"', "version = `"$Version`""
Write-FileNoBom $cargoPath $cargoText

Write-Host "==> Bumped version to $Version in package.json, tauri.conf.json, Cargo.toml"

# 4. Commit
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
if ($LASTEXITCODE -ne 0) { throw "git add failed" }

git commit -m "chore: bump to v$Version"
if ($LASTEXITCODE -ne 0) { throw "git commit failed" }

# 5. Tag
git tag -a "v$Version" -m "Pulp v$Version"
if ($LASTEXITCODE -ne 0) { throw "git tag failed" }

# 6. Push commit and tag
Write-Host "==> Pushing commit and tag v$Version ..."
git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push (commit) failed" }

git push origin "v$Version"
if ($LASTEXITCODE -ne 0) { throw "git push (tag) failed" }

Write-Host ""
Write-Host "==> Done. v$Version committed, tagged, and pushed."
Write-Host "    Next: create release-notes-$Version.txt in scripts/, then run 'npm run release -- $Version'"
