Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-logo.png'
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

# Find bounding box of non-white pixels
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Check if not pure white/near white
        if ($c.A -gt 10 -and ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1

Write-Host "Original: $($bmp.Width) x $($bmp.Height)"
Write-Host "Cropped Logo Bounds: X=$minX..$maxX, Y=$minY..$maxY => Width=$w, Height=$h"

# Create tightly cropped transparent bitmap
$cropped = [System.Drawing.Bitmap]::new($w, $h)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $bmp.GetPixel($minX + $x, $minY + $y)
        # If pixel is white or near white, make it transparent
        if ($c.R -gt 245 -and $c.G -gt 245 -and $c.B -gt 245) {
            $cropped.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $cropped.SetPixel($x, $y, $c)
        }
    }
}

$bmp.Dispose()

$outputPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-logo-horizontal.png'
$cropped.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Write-Host "Logo horizontal processada e salva em: $outputPath"
