# Script để kiểm tra và chạy User Service
# Run: .\start-and-test.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING USER SERVICE & TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Bước 1: Kiểm tra Docker Desktop
Write-Host "📋 Step 1: Checking Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "`n💡 Instructions:" -ForegroundColor Yellow
    Write-Host "   1. Open Docker Desktop application" -ForegroundColor White
    Write-Host "   2. Wait until it's fully started" -ForegroundColor White
    Write-Host "   3. Run this script again`n" -ForegroundColor White
    exit 1
}
Write-Host "✅ Docker Desktop is running`n" -ForegroundColor Green

# Bước 2: Start services
Write-Host "📋 Step 2: Starting services with docker-compose..." -ForegroundColor Yellow
Set-Location "d:\CongNghePM\DA_SERVICE\Software-Engineering"
docker-compose up -d user-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start user-service!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ User service started`n" -ForegroundColor Green

# Bước 3: Đợi service khởi động
Write-Host "📋 Step 3: Waiting for service to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serviceReady = $false

while ($attempt -lt $maxAttempts -and -not $serviceReady) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serviceReady = $true
            Write-Host "✅ Service is ready!`n" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Attempt $attempt/$maxAttempts - Service not ready yet..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serviceReady) {
    Write-Host "❌ Service failed to start within timeout!" -ForegroundColor Red
    Write-Host "`n📋 Checking logs..." -ForegroundColor Yellow
    docker logs software-engineering-user-service-1 --tail 50
    exit 1
}

# Bước 4: Run tests
Write-Host "📋 Step 4: Running registration tests..." -ForegroundColor Yellow
Set-Location "d:\CongNghePM\DA_SERVICE\Software-Engineering\services\user-service"
node test-registration.js

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ TESTING COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check MongoDB Atlas to see new collections populated" -ForegroundColor White
Write-Host "   2. View logs: docker logs software-engineering-user-service-1" -ForegroundColor White
Write-Host "   3. Stop service: docker-compose down`n" -ForegroundColor White
