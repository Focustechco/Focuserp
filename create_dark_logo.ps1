Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-logo-horizontal.png'
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$darkBmp = [System.Drawing.Bitmap]::new($bmp.Width, $bmp.Height)

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        if ($c.A -lt 10) {
            $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            # Check if orange pixel (High R, Red > Green + 40, low Blue)
            $isOrange = ($c.R -gt 150) -and ($c.R -gt ($c.G + 40)) -and ($c.B -lt 120)
            
            if ($isOrange) {
                # Preserve orange color exactly
                $darkBmp.SetPixel($x, $y, $c)
            } else {
                # Convert dark text to white, preserving alpha/anti-aliasing
                # Darker original pixels become bright white, anti-aliased gray pixels become smooth white with alpha
                $brightness = [int](($c.R + $c.G + $c.B) / 3)
                # If pixel is dark text
                if ($brightness -lt 180) {
                    # Make pixel white, opacity inversely proportional to original brightness if needed, or white with original alpha
                    $newAlpha = [math]::Min(255, [math]::Max(0, [int]($c.A * (1 - ($brightness / 255.0)))))
                    $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, 255, 255, 255))
                } else {
                    $darkBmp.SetPixel($x, $y, $c)
                }
            }
        }
    }
}

$bmp.Dispose()

$outputPath = 'C:\Users\adria\Documents\antigravity\calm-hertz\src\assets\focus-logo-horizontal-dark.png'
$darkBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$darkBmp.Dispose()

Write-Host "Logo dark mode gerada com sucesso em: $outputPath"
