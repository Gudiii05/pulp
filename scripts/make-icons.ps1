Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$iconDir = Join-Path $PSScriptRoot '..\src-tauri\icons'
New-Item -ItemType Directory -Path $iconDir -Force | Out-Null

function New-PulpPng {
    param([int]$Size, [string]$OutPath)
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $orange = [System.Drawing.Color]::FromArgb(255, 255, 92, 43)
    $radius = [int]($Size * 0.22)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($Size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($Size - $radius * 2, $Size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $Size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.SolidBrush $orange
    $g.FillPath($brush, $path)

    $fontSize = [single]($Size * 0.6)
    $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, ([single]($Size * 0.02)), ([single]$Size), ([single]$Size)
    $g.DrawString('P', $font, $white, $rect, $sf)

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $font.Dispose()
    $brush.Dispose()
    $white.Dispose()
    $path.Dispose()
}

New-PulpPng -Size 32 -OutPath (Join-Path $iconDir '32x32.png')
New-PulpPng -Size 128 -OutPath (Join-Path $iconDir '128x128.png')
New-PulpPng -Size 256 -OutPath (Join-Path $iconDir '128x128@2x.png')
New-PulpPng -Size 512 -OutPath (Join-Path $iconDir 'icon.png')

# Build a multi-resolution ICO from in-memory PNG bytes
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngStreams = @()
foreach ($s in $sizes) {
    $b = New-Object System.Drawing.Bitmap $s, $s
    $gg = [System.Drawing.Graphics]::FromImage($b)
    $gg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $orange = [System.Drawing.Color]::FromArgb(255, 255, 92, 43)
    $radius = [int]($s * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($s - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($s - $radius * 2, $s - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $s - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()
    $brush = New-Object System.Drawing.SolidBrush $orange
    $gg.FillPath($brush, $path)
    $font = New-Object System.Drawing.Font('Segoe UI', ([single]($s * 0.6)), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, ([single]($s * 0.02)), ([single]$s), ([single]$s)
    $gg.DrawString('P', $font, $white, $rect, $sf)

    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngStreams += , $ms.ToArray()

    $gg.Dispose()
    $b.Dispose()
    $font.Dispose()
    $brush.Dispose()
    $white.Dispose()
    $path.Dispose()
    $ms.Dispose()
}

$icoPath = Join-Path $iconDir 'icon.ico'
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0)        # reserved
$bw.Write([uint16]1)        # type = icon
$bw.Write([uint16]$sizes.Count)

$headerSize = 6 + 16 * $sizes.Count
$offset = $headerSize
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $bytes = $pngStreams[$i]
    $w = if ($s -ge 256) { 0 } else { $s }
    $h = if ($s -ge 256) { 0 } else { $s }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0)      # colors in palette
    $bw.Write([byte]0)      # reserved
    $bw.Write([uint16]1)    # planes
    $bw.Write([uint16]32)   # bits per pixel
    $bw.Write([uint32]$bytes.Length)
    $bw.Write([uint32]$offset)
    $offset += $bytes.Length
}
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngStreams[$i])
}
$bw.Close()
$fs.Close()

Write-Host "Icons generated in $iconDir"
