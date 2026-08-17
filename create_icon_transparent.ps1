Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-logo-horizontal.png'
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# Find bounding box of the orange spiral icon (the left-most orange cluster in the logo)
$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt ($bmp.Width / 3); $x++) { # Only search the left third where spiral icon is
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 10) {
            $isOrange = ($c.R -gt 150) -and ($c.R -gt ($c.G + 30))
            if ($isOrange) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1

Write-Host "Icon Bounds: X=$minX..$maxX Y=$minY..$maxY Width=$w Height=$h"

# Create a square 1:1 transparent bitmap for icon with slight padding
$size = [math]::Max($w, $h)
$pad = [int]($size * 0.05)
$finalSize = $size + ($pad * 2)

$iconBmp = [System.Drawing.Bitmap]::new($finalSize, $finalSize)

$destX = [int]($pad + ($size - $w) / 2)
$destY = [int]($pad + ($size - $h) / 2)

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $bmp.GetPixel($minX + $x, $minY + $y)
        if ($c.A -gt 10) {
            $iconBmp.SetPixel($destX + $x, $destY + $y, $c)
        }
    }
}

$bmp.Dispose()

$outputPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-symbol-transparent.png'
$iconBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconBmp.Dispose()

Write-Host "Icone transparente gerado com sucesso em: $outputPath"
