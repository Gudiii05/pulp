param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

# DEV-LOCAL CONVENIENCE SCRIPT.
# Requires scripts/release-notes-<Version>.txt to exist and be committed.
# Calls bump.ps1 (which bumps version files + tags + pushes), then watches the
# CI release workflow until it finishes. Does NOT produce latest.json and does
# NOT create the GitHub release directly — both are owned by
# .github/workflows/release.yml. Pushing a vX.Y.Z tag triggers that workflow.

$ErrorActionPreference = 'Stop'

Set-Location 'C:\pulp'

$notesFile = "scripts\release-notes-$Version.txt"
if (-not (Test-Path $notesFile)) {
    throw "Release notes not found at $notesFile. Create that file with the changelog and commit it before releasing."
}

# Notes file must be committed — bump.ps1 requires a clean working tree.
$notesStatus = git status --porcelain $notesFile
if ($notesStatus) {
    throw "$notesFile has uncommitted changes. Commit it before releasing."
}

& "$PSScriptRoot\bump.ps1" -Version $Version

Write-Host ""
Write-Host "==> Watching CI release workflow for v$Version ..."
$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
    # gh run watch picks the most recent run for the current branch by default
    try {
        gh run watch
    } catch {
        Write-Host "    (gh run watch exited: $($_.Exception.Message))"
    }
    Write-Host ""
    Write-Host "==> Release URL:"
    $url = gh release view "v$Version" --json url --jq .url 2>$null
    if ($LASTEXITCODE -eq 0 -and $url) {
        Write-Host "    $url"
    } else {
        Write-Host "    Release not yet published — check the Actions tab."
    }
} else {
    Write-Host "    gh CLI not installed — check https://github.com/Gudiii05/pulp/actions"
}
