$candidates = @(
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe",
    "${env:ProgramFiles}\Microsoft Visual Studio\Installer\vswhere.exe"
)
$vswhere = $null
foreach ($c in $candidates) {
    if (Test-Path $c) { $vswhere = $c; break }
}
if ($vswhere) {
    Write-Host "vswhere: $vswhere"
    & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
} else {
    Write-Host "MSVC build tools NOT found via vswhere"
}

# Also check for the build tools directory directly
$btRoots = @(
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019",
    "${env:ProgramFiles}\Microsoft Visual Studio\2019"
)
foreach ($r in $btRoots) {
    if (Test-Path $r) { Write-Host "Found VS dir: $r" }
}
