Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\HP\.gemini\antigravity-ide\brain\c7666ed9-c357-49dc-b770-774420f6438f\.user_uploaded\media_1788772456477.png"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Output ("Source size: " + $img.Width + "x" + $img.Height)

# Find circle bounding box
# Outer background in corners is approximately RGB(22, 23, 26) = #16171a
# The circle border is dark black RGB(0, 0, 0)
# Let's scan horizontally through the middle y = 210 to find circle left and right edges
$midY = [int]($img.Height / 2)
$leftX = -1
$rightX = -1

for ($x = 0; $x -lt $img.Width; $x++) {
    $c = $img.GetPixel($x, $midY)
    # If pixel is very dark (black circle interior) or different from outer grey (R < 15, G < 15, B < 15)
    if ($c.R -lt 15 -and $c.G -lt 15 -and $c.B -lt 15) {
        if ($leftX -eq -1) { $leftX = $x }
        $rightX = $x
    }
}

# Let's scan vertically through middle x = 256 to find top and bottom edges
$midX = [int]($img.Width / 2)
$topY = -1
$bottomY = -1

for ($y = 0; $y -lt $img.Height; $y++) {
    $c = $img.GetPixel($midX, $y)
    if ($c.R -lt 15 -and $c.G -lt 15 -and $c.B -lt 15) {
        if ($topY -eq -1) { $topY = $y }
        $bottomY = $y
    }
}

Write-Output ("Circle bounds: X=[" + $leftX + ", " + $rightX + "], Y=[" + $topY + ", " + $bottomY + "]")
$diameterX = $rightX - $leftX
$diameterY = $bottomY - $topY
Write-Output ("Diameter X: " + $diameterX + ", Diameter Y: " + $diameterY)

$img.Dispose()
