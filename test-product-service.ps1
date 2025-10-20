# Product Service Testing Script
# Kiểm tra Product Service - Nhà hàng thêm món ăn

Write-Host "=== PRODUCT SERVICE TESTING ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$userServiceUrl = "http://localhost:3001"
$productServiceUrl = "http://localhost:3003"

# Step 1: Register Restaurant Account
Write-Host "Step 1: Đăng ký tài khoản nhà hàng..." -ForegroundColor Yellow

$registerBody = @{
    username = "restaurant_pho_hanoi"
    email = "phohanoi@restaurant.com"
    password = "password123"
    fullName = "Phở Hà Nội 24"
    phone = "0987654321"
    role = "restaurant"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$userServiceUrl/api/auth/register" `
        -Method Post -ContentType "application/json" -Body $registerBody
    
    $token = $registerResponse.data.token
    $userId = $registerResponse.data.user.id
    
    Write-Host "✓ Đăng ký thành công!" -ForegroundColor Green
    Write-Host "  User ID: $userId" -ForegroundColor Gray
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Lỗi đăng ký: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try login instead
    Write-Host "Thử đăng nhập với tài khoản đã tồn tại..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = "phohanoi@restaurant.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$userServiceUrl/api/auth/login" `
            -Method Post -ContentType "application/json" -Body $loginBody
        
        $token = $loginResponse.data.token
        $userId = $loginResponse.data.user.id
        
        Write-Host "✓ Đăng nhập thành công!" -ForegroundColor Green
        Write-Host "  User ID: $userId" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Lỗi đăng nhập: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

# Step 2: Get/Create Category
Write-Host "Step 2: Kiểm tra danh mục (Category)..." -ForegroundColor Yellow

# For now, we'll need to create a category manually in MongoDB
# Or wait for Category API to be implemented
Write-Host "⚠ Lưu ý: Cần tạo Category trong MongoDB trước!" -ForegroundColor Yellow
Write-Host "  Sử dụng MongoDB Compass hoặc VS Code MongoDB extension" -ForegroundColor Gray
Write-Host "  Database: product_service" -ForegroundColor Gray
Write-Host "  Collection: categories" -ForegroundColor Gray
Write-Host ""

$categoryId = Read-Host "Nhập Category ID (hoặc Enter để bỏ qua)"
if ([string]::IsNullOrWhiteSpace($categoryId)) {
    Write-Host "⚠ Bỏ qua bước tạo Category" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✓ Sử dụng Category ID: $categoryId" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Create Product
Write-Host "Step 3: Tạo món ăn mới..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($categoryId)) {
    Write-Host "⚠ Bỏ qua do chưa có Category ID" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Để test đầy đủ, cần:" -ForegroundColor Cyan
    Write-Host "1. Tạo Category trong MongoDB" -ForegroundColor Gray
    Write-Host "2. Chạy lại script này với Category ID" -ForegroundColor Gray
    Write-Host ""
} else {
    $productBody = @{
        name = "Phở Bò Đặc Biệt"
        description = "Phở bò truyền thống Hà Nội với đầy đủ các loại thịt bò: tái, nạm, gầu, gân. Nước dùng ninh từ xương bò 8 tiếng"
        price = 65000
        categoryId = $categoryId
        ingredients = @("Bánh phở", "Thịt bò", "Hành tây", "Ngò rí", "Hành lá", "Gừng", "Quế", "Hồi")
        allergens = @("gluten")
        spicyLevel = 1
        nutritionInfo = @{
            calories = 450
            protein = 30
            carbs = 60
            fat = 12
        }
        preparationTime = 20
        available = $true
        displayOrder = 1
    } | ConvertTo-Json -Depth 10

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    try {
        $productResponse = Invoke-RestMethod -Uri "$productServiceUrl/api/products" `
            -Method Post -Headers $headers -Body $productBody
        
        $productId = $productResponse.data._id
        
        Write-Host "✓ Tạo món ăn thành công!" -ForegroundColor Green
        Write-Host "  Product ID: $productId" -ForegroundColor Gray
        Write-Host "  Tên món: $($productResponse.data.name)" -ForegroundColor Gray
        Write-Host "  Giá: $($productResponse.data.price) VND" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Lỗi tạo món ăn: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        Write-Host ""
        $productId = $null
    }

    # Step 4: Get My Products
    if ($productId) {
        Write-Host "Step 4: Xem danh sách món ăn của tôi..." -ForegroundColor Yellow

        try {
            $myProducts = Invoke-RestMethod -Uri "$productServiceUrl/api/products/my-products/list" `
                -Method Get -Headers $headers
            
            Write-Host "✓ Lấy danh sách thành công!" -ForegroundColor Green
            Write-Host "  Tổng số món: $($myProducts.total)" -ForegroundColor Gray
            Write-Host "  Món trong trang này: $($myProducts.count)" -ForegroundColor Gray
            Write-Host ""
            
            Write-Host "Danh sách món ăn:" -ForegroundColor Cyan
            foreach ($product in $myProducts.data) {
                Write-Host "  - $($product.name): $($product.price) VND (Available: $($product.available))" -ForegroundColor Gray
            }
            Write-Host ""
        } catch {
            Write-Host "✗ Lỗi lấy danh sách: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }

        # Step 5: Update Product
        Write-Host "Step 5: Cập nhật món ăn..." -ForegroundColor Yellow

        $updateBody = @{
            price = 70000
            description = "Phở bò truyền thống Hà Nội - Đã tăng giá do chi phí nguyên liệu"
            available = $true
        } | ConvertTo-Json

        try {
            $updateResponse = Invoke-RestMethod -Uri "$productServiceUrl/api/products/$productId" `
                -Method Put -Headers $headers -Body $updateBody
            
            Write-Host "✓ Cập nhật thành công!" -ForegroundColor Green
            Write-Host "  Giá mới: $($updateResponse.data.price) VND" -ForegroundColor Gray
            Write-Host "  Mô tả: $($updateResponse.data.description)" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "✗ Lỗi cập nhật: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }

        # Step 6: Toggle Availability
        Write-Host "Step 6: Bật/tắt trạng thái món ăn..." -ForegroundColor Yellow

        try {
            $toggleResponse = Invoke-RestMethod -Uri "$productServiceUrl/api/products/$productId/availability" `
                -Method Patch -Headers $headers
            
            Write-Host "✓ $($toggleResponse.message)" -ForegroundColor Green
            Write-Host "  Available: $($toggleResponse.data.available)" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "✗ Lỗi toggle: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }

        # Step 7: Get Product Detail (Public)
        Write-Host "Step 7: Xem chi tiết món ăn (public)..." -ForegroundColor Yellow

        try {
            $productDetail = Invoke-RestMethod -Uri "$productServiceUrl/api/products/$productId" `
                -Method Get
            
            Write-Host "✓ Lấy chi tiết thành công!" -ForegroundColor Green
            Write-Host "  Tên: $($productDetail.data.name)" -ForegroundColor Gray
            Write-Host "  Giá: $($productDetail.data.price) VND" -ForegroundColor Gray
            Write-Host "  Mô tả: $($productDetail.data.description)" -ForegroundColor Gray
            Write-Host "  Độ cay: $($productDetail.data.spicyLevel)/5" -ForegroundColor Gray
            Write-Host "  Thời gian chuẩn bị: $($productDetail.data.preparationTime) phút" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "✗ Lỗi lấy chi tiết: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }

        # Optional: Delete Product
        $delete = Read-Host "Bạn có muốn xóa món ăn test này không? (y/N)"
        if ($delete -eq "y" -or $delete -eq "Y") {
            Write-Host "Step 8: Xóa món ăn..." -ForegroundColor Yellow

            try {
                $deleteResponse = Invoke-RestMethod -Uri "$productServiceUrl/api/products/$productId" `
                    -Method Delete -Headers $headers
                
                Write-Host "✓ $($deleteResponse.message)" -ForegroundColor Green
                Write-Host ""
            } catch {
                Write-Host "✗ Lỗi xóa: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host ""
            }
        }
    }
}

Write-Host "=== KẾT THÚC TESTING ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lưu ý:" -ForegroundColor Yellow
Write-Host "- Token có hiệu lực 7 ngày" -ForegroundColor Gray
Write-Host "- Nhà hàng chỉ có thể quản lý món ăn của mình" -ForegroundColor Gray
Write-Host "- Cần tạo Category trước khi tạo Product" -ForegroundColor Gray
Write-Host "- Xem hướng dẫn đầy đủ tại PRODUCT_SERVICE_GUIDE.md" -ForegroundColor Gray
Write-Host ""
