# Docker Compose Management Script
# Quick commands to manage microservices

Write-Host "🐳 FoodFast Delivery - Docker Compose Manager" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

function Show-Menu {
    Write-Host "Chọn hành động:" -ForegroundColor Yellow
    Write-Host "1. Build tất cả services"
    Write-Host "2. Start tất cả services"
    Write-Host "3. Stop tất cả services"
    Write-Host "4. Restart tất cả services"
    Write-Host "5. Xem logs"
    Write-Host "6. Kiểm tra status"
    Write-Host "7. Clean up (stop và xóa containers)"
    Write-Host "8. Rebuild và restart"
    Write-Host "9. Exit"
    Write-Host ""
}

while ($true) {
    Show-Menu
    $choice = Read-Host "Nhập số (1-9)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n📦 Building all services..." -ForegroundColor Green
            docker-compose build
        }
        "2" {
            Write-Host "`n🚀 Starting all services..." -ForegroundColor Green
            docker-compose up -d
            Write-Host "`n✅ Services started! Check status with option 6" -ForegroundColor Green
        }
        "3" {
            Write-Host "`n🛑 Stopping all services..." -ForegroundColor Yellow
            docker-compose down
        }
        "4" {
            Write-Host "`n🔄 Restarting all services..." -ForegroundColor Green
            docker-compose restart
        }
        "5" {
            Write-Host "`n📋 Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Cyan
            docker-compose logs -f
        }
        "6" {
            Write-Host "`n📊 Checking services status..." -ForegroundColor Cyan
            docker-compose ps
            Write-Host "`n🔍 Health checks:" -ForegroundColor Cyan
            Write-Host "User Service:" -ForegroundColor Yellow
            try { Invoke-RestMethod -Uri "http://localhost:3001/health" | ConvertTo-Json } catch { Write-Host "❌ Not responding" -ForegroundColor Red }
            Write-Host "`nProduct Service:" -ForegroundColor Yellow
            try { Invoke-RestMethod -Uri "http://localhost:3003/health" | ConvertTo-Json } catch { Write-Host "❌ Not responding" -ForegroundColor Red }
            Write-Host "`nOrder Service:" -ForegroundColor Yellow
            try { Invoke-RestMethod -Uri "http://localhost:3002/health" | ConvertTo-Json } catch { Write-Host "❌ Not responding" -ForegroundColor Red }
            Write-Host "`nPayment Service:" -ForegroundColor Yellow
            try { Invoke-RestMethod -Uri "http://localhost:3004/health" | ConvertTo-Json } catch { Write-Host "❌ Not responding" -ForegroundColor Red }
        }
        "7" {
            Write-Host "`n🗑️ Cleaning up..." -ForegroundColor Red
            docker-compose down -v
            Write-Host "✅ Cleanup complete!" -ForegroundColor Green
        }
        "8" {
            Write-Host "`n🔨 Rebuilding and restarting..." -ForegroundColor Green
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            Write-Host "`n✅ Done! Services restarted" -ForegroundColor Green
        }
        "9" {
            Write-Host "`n👋 Goodbye!" -ForegroundColor Cyan
            exit
        }
        default {
            Write-Host "`n❌ Invalid choice. Please select 1-9" -ForegroundColor Red
        }
    }
    
    Write-Host "`nPress Enter to continue..."
    Read-Host
    Clear-Host
}
