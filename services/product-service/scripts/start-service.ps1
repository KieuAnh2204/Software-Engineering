$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceRoot = Split-Path $serviceDir -Parent
$nodePath = "node"

# Ensure env vars
if (-not $env:PORT) { $env:PORT = '3003' }
if (-not $env:MONGODB_URI) { Write-Host "MONGODB_URI not set. Exiting."; exit 1 }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = 'devsecret' }

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $nodePath
$startInfo.Arguments = "src/index.js"
$startInfo.WorkingDirectory = $serviceRoot
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $startInfo
$null = $proc.Start()

# Save PID so we can stop later
$pidFile = Join-Path $serviceDir 'pid.txt'
$proc.Id | Out-File -FilePath $pidFile -Encoding ascii -Force

Write-Host "Started product-service. PID=$($proc.Id). Logs will follow..."
Start-Sleep -Milliseconds 500
if (-not $proc.HasExited) {
  Write-Host (Get-Date).ToString('s') "- Running"
} else {
  Write-Host (Get-Date).ToString('s') "- Process exited with code $($proc.ExitCode)"
}
