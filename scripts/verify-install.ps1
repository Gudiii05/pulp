Add-Type -AssemblyName System.Drawing
$exe = 'C:\Users\thepa\AppData\Local\Pulp\Pulp.exe'

$ver = (Get-Item $exe).VersionInfo
Write-Host "FileVersion:    $($ver.FileVersion)"
Write-Host "ProductVersion: $($ver.ProductVersion)"
Write-Host "Path:           $exe"

$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exe)
$bmp = $icon.ToBitmap()
$out = 'C:\pulp\scripts\installed-icon.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$icon.Dispose()
Write-Host "Icon extracted to $out"
