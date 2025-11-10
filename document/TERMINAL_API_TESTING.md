# 🧪 Hướng Dẫn Test API trên Terminal

## 📋 Tổng Quan

Có 2 scripts PowerShell để test Flow 1: Restaurant Registration & Menu Management

| Script | Mô tả | Kịch bản |
|--------|-------|----------|
| `test-flow1-simple.ps1` | Test quán đơn giản | Tự động tạo Brand |
| `test-flow1-api.ps1` | Test chuỗi nhà hàng | Tạo Brand trước, sau đó thêm chi nhánh |

---

## 🚀 Prerequisites

### 1️⃣ Khởi động Services

```powershell
# Terminal 1: Start User Service
cd services/user-service
npm run dev

# Terminal 2: Start Product Service  
cd services/product-service
npm run dev
```

**Kiểm tra services đang chạy:**
```powershell
# Health check
Invoke-RestMethod http://localhost:3001/health  # User Service
Invoke-RestMethod http://localhost:3003/health  # Product Service
```

---

## 📝 Test Script 1: Simple Restaurant

### Chạy Test

```powershell
cd d:\CongNghePM\DA_SERVICE\Software-Engineering
.\test-flow1-simple.ps1
```

### Các Bước Test

1. ✅ **Register Brand Manager**
   - Tạo tài khoản với role `BRAND_MANAGER`
   - Lưu `authToken` và `userId`

2. ✅ **Create Restaurant (Auto Brand)**
   - Không gửi `brandId` → Tự động tạo Brand
   - Lưu `restaurantId` và `brandId` (auto-created)

3. ✅ **Create Category**
   - Tạo danh mục "Pho" cho restaurant
   - Lưu `categoryId`

4. ✅ **Create Dish**
   - Tạo món "Pho Tai"  
   - Lưu `dishId`

5. ✅ **Get Dishes**
   - Query tất cả món ăn của restaurant

### Expected Output

```
Testing Flow 1: Simple Restaurant (Auto Brand Creation)
=======================================================

Step 1: Register Brand Manager...
[OK] Register
     Token: eyJhbGci...

Step 2: Create Restaurant (Auto Brand)...
[OK] Create Restaurant
     Restaurant ID: 690f84062e700cff1462e3cc
     Brand ID (Auto): 690f84062e700cff1462e3ca

Step 3: Create Category...
[OK] Create Category
     Category ID: 690f84072e700cff1462e3ce

Step 4: Create Dish...
[OK] Create Dish
     Dish ID: 690f84082e700cff1462e3d0

Step 5: Get Dishes...
[OK] Get Dishes
     Total dishes: 1

=======================================================
Test Complete!
=======================================================

Created Resources:
  User ID:        690f84052e700cff1462e3c7
  Brand ID:       690f84062e700cff1462e3ca (Auto-created)
  Restaurant ID:  690f84062e700cff1462e3cc
  Category ID:    690f84072e700cff1462e3ce
  Dish ID:        690f84082e700cff1462e3d0
```

---

## 📝 Test Script 2: Chain Restaurant

### Chạy Test

```powershell
cd d:\CongNghePM\DA_SERVICE\Software-Engineering
.\test-flow1-api.ps1
```

### Các Bước Test

1. ✅ **Register Brand Manager**
2. ✅ **Create Brand** (Chuỗi nhà hàng)
3. ✅ **Create Restaurant Branch 1** (với brandId)
4. ✅ **Create Category**
5. ✅ **Create Dish**
6. ✅ **Get Brands** - Query tất cả brands của user
7. ✅ **Get Restaurants by Brand** - Query chi nhánh theo brand
8. ✅ **Get Categories by Restaurant**
9. ✅ **Get Dishes by Restaurant**
10. ✅ **Search Dishes** - Tìm kiếm món ăn
11. ✅ **Update Dish** - Cập nhật giá món ăn
12. ✅ **Check Restaurant Ownership** - Test Internal API

### Expected Output

```
Testing Flow 1: Restaurant Registration & Menu Management
============================================================

1️⃣  Testing: Register Brand Manager...
✅ Register Brand Manager
   💾 Saved: authToken, userId

2️⃣  Testing: Create Brand (Chain Scenario)...
✅ Create Brand
   💾 Saved: brandId = 690f...

3️⃣  Testing: Create Restaurant - Branch 1 (With brandId)...
✅ Create Restaurant - Branch 1
   💾 Saved: restaurantId = 690f...

... (10 more tests)

============================================================
✅ Flow 1 Testing Complete!
============================================================

📊 Test Summary:
   • User ID:        690f...
   • Brand ID:       690f...
   • Restaurant ID:  690f...
   • Category ID:    690f...
   • Dish ID:        690f...

🎯 All tests completed successfully!
```

---

## 🔧 Troubleshooting

### ❌ Error: Unable to connect to the remote server

**Nguyên nhân:** Service không chạy

**Giải pháp:**
```powershell
# Kiểm tra services đang chạy
Get-Process -Name node

# Kiểm tra ports
netstat -ano | findstr "3001 3003"

# Restart services
cd services/user-service && npm run dev
cd services/product-service && npm run dev
```

---

### ❌ Error: 400 Bad Request (Invalid role)

**Nguyên nhân:** Role `BRAND_MANAGER` chưa được thêm vào validation

**Giải pháp:** Đã fix trong `services/user-service/src/routes/authRoutes.js`
```javascript
body('role').optional().isIn(['customer', 'restaurant', 'admin', 'BRAND_MANAGER'])
```

---

### ❌ Error: 500 Internal Server Error

**Nguyên nhân:** Có thể do:
- Database không kết nối
- userId không đúng format
- Missing required fields

**Giải pháp:**
```powershell
# Xem logs của services
# User Service logs: Terminal chạy user-service
# Product Service logs: Terminal chạy product-service

# Test từng endpoint riêng:
$headers = @{ "Authorization" = "Bearer YOUR_TOKEN" }
Invoke-RestMethod -Uri "http://localhost:3001/api/brands" -Headers $headers
```

---

### ❌ Error: 401 Unauthorized

**Nguyên nhân:** Token không hợp lệ hoặc hết hạn

**Giải pháp:** Register/Login lại để lấy token mới

---

### ❌ Error: 403 Forbidden

**Nguyên nhân:** Không có quyền truy cập resource

**Giải pháp:**
- Đảm bảo user có role `BRAND_MANAGER`
- Đảm bảo user sở hữu restaurant/brand

---

## 📊 Manual Testing

Nếu muốn test thủ công từng endpoint:

### 1. Register

```powershell
$body = @{
    username = "test_owner"
    email = "test@example.com"
    password = "123456"
    fullName = "Test Owner"
    phone = "0909999999"
    role = "BRAND_MANAGER"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.data.token
Write-Host "Token: $token"
```

### 2. Create Restaurant

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "My Restaurant"
    address = @{
        street = "123 Test St"
        ward = "Ward 1"
        district = "District 1"
        city = "Ho Chi Minh"
    }
    phone = "0281234567"
    email = "restaurant@test.com"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/restaurants" `
    -Method Post `
    -Headers $headers `
    -Body $body

$restaurantId = $response.data._id
Write-Host "Restaurant ID: $restaurantId"
```

### 3. Create Category

```powershell
$body = @{
    name = "Main Dishes"
    description = "Main course dishes"
    restaurantId = $restaurantId
    displayOrder = 1
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3003/api/categories" `
    -Method Post `
    -Headers $headers `
    -Body $body

$categoryId = $response.data._id
```

### 4. Create Dish

```powershell
$body = @{
    name = "Grilled Chicken"
    description = "Delicious grilled chicken"
    price = 75000
    categoryId = $categoryId
    restaurantId = $restaurantId
    images = @("https://example.com/image.jpg")
    preparationTime = 20
    unit = "plate"
    isAvailable = $true
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3003/api/dishes" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

---

## 🎯 Best Practices

1. ✅ **Luôn kiểm tra services trước khi test**
   ```powershell
   Invoke-RestMethod http://localhost:3001/health
   Invoke-RestMethod http://localhost:3003/health
   ```

2. ✅ **Lưu token để test tiếp**
   ```powershell
   $token = $response.data.token
   ```

3. ✅ **Sử dụng error handling**
   ```powershell
   try {
       $response = Invoke-RestMethod...
   } catch {
       Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
   }
   ```

4. ✅ **Test từng bước riêng khi có lỗi**

---

## 📚 Related Documentation

- **[POSTMAN_FLOW1_GUIDE.md](POSTMAN_FLOW1_GUIDE.md)** - Test với Postman
- **[FLOW_1_BRAND_MANAGER_README.md](FLOW_1_BRAND_MANAGER_README.md)** - Tài liệu API đầy đủ
- **[DATABASE_ISOLATION_ANALYSIS.md](DATABASE_ISOLATION_ANALYSIS.md)** - Kiến trúc Database

---

**Last Updated:** November 9, 2025  
**Status:** ✅ Scripts Ready for Testing
