Add-Type -AssemblyName System.Drawing
$icoPath = 'C:\pulp\src-tauri\icons\icon.ico'
# Extract the largest available icon variant
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($icoPath)
$bmp = $icon.ToBitmap()
$out = 'C:\pulp\scripts\check-ico-content.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved $icoPath ($($bmp.Width)x$($bmp.Height)) to $out"
$bmp.Dispose()
$icon.Dispose()
