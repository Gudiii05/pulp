$ErrorActionPreference = 'Continue'

Write-Host "Stopping Windows Explorer..."
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 800

$cachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db"
)

foreach ($pattern in $cachePaths) {
    Get-Item -Path $pattern -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -ErrorAction Stop
            Write-Host "  deleted: $($_.FullName)"
        } catch {
            Write-Host "  locked, skipping: $($_.FullName)"
        }
    }
}

Write-Host "Restarting Windows Explorer..."
Start-Process explorer.exe

Write-Host ""
Write-Host "Done. Icon cache cleared and Explorer restarted."
Write-Host "Windows will rebuild the cache from scratch. The Pulp icon should now show the new dark P."
