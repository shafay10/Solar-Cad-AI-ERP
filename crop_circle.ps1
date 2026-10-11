Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\HP\.gemini\antigravity-ide\brain\c7666ed9-c357-49dc-b770-774420f6438f\.user_uploaded\media_1788772456477.png"
$destPathPng1 = "c:\Users\HP\.gemini\antigravity\scratch\solar-erp-platform\frontend\public\assets\greentech-logo.png"
$destPathPng2 = "c:\Users\HP\.gemini\antigravity\scratch\solar-erp-platform\frontend\public\greentech-logo.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# The circle center is approximately (260, 228) and radius is ~175 pixels (diameter ~350)
# Let's find the exact radius by looking at where the background transition happens
$centerX = 260.0
$centerY = 228.0
$radius = 171.0 # 342 diameter / 2

# We will create a high-res 512x512 square transparent bitmap
$destSize = 512
$dest = New-Object System.Drawing.Bitmap($destSize, $destSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Source crop rectangle: from (centerX - radius) to (centerX + radius)
$srcRect = New-Object System.Drawing.RectangleF(($centerX - $radius), ($centerY - $radius), ($radius * 2), ($radius * 2))
$destRect = New-Object System.Drawing.RectangleF(0, 0, $destSize, $destSize)

# Create a circular clipping path so anything outside is 100% transparent
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(2, 2, ($destSize - 4), ($destSize - 4))
$g.SetClip($path)

# Draw the cropped circle filling the 512x512 canvas edge-to-edge
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.ResetClip()

# Draw subtle smooth emerald accent ring around the perimeter
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 16, 185, 129), 6.0)
$g.DrawEllipse($pen, 3, 3, ($destSize - 6), ($destSize - 6))

$g.Dispose()
$src.Dispose()
$pen.Dispose()
$path.Dispose()

$dest.Save($destPathPng1, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save($destPathPng2, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()

Write-Output "Successfully generated perfect circular 512x512 PNG at $destPathPng1 and $destPathPng2"
