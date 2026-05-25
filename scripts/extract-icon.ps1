Add-Type -AssemblyName System.Drawing
$exePath = 'C:\pulp\src-tauri\target\release\pulp.exe'
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
$bmp = $icon.ToBitmap()
$out = 'C:\pulp\scripts\extracted-icon.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$icon.Dispose()
Write-Host "Saved icon from $exePath to $out"
