# Product Service Implementation Summary

## Tổng Quan
Đã xây dựng hoàn chỉnh **Product Service** cho phép nhà hàng quản lý thực đơn của mình.

## Các File Đã Tạo/Cập Nhật

### 1. Product Service - Authentication Middleware
**File:** `services/product-service/src/middleware/auth.js` ⭐ **MỚI**

**Chức năng:**
- ✅ `protect()`: Xác thực JWT token
- ✅ `restrictTo(...roles)`: Kiểm tra quyền truy cập theo role
- ✅ `checkRestaurantOwnership()`: Kiểm tra quyền sở hữu nhà hàng

**JWT Token Payload:**
```javascript
{
  id: userId,
  role: userRole,
  email: userEmail,
  restaurantId: restaurantId  // Cho restaurant owners
}
```

### 2. Product Controller
**File:** `services/product-service/src/controllers/productController.js` 🔄 **ĐÃ CẬP NHẬT**

**Public Endpoints (Không cần auth):**
- ✅ `getAllProducts()` - Lấy danh sách món ăn với filter/search/pagination
- ✅ `getProduct(id)` - Xem chi tiết món ăn
- ✅ `getProductsByRestaurant(restaurantId)` - Món ăn theo nhà hàng
- ✅ `searchProducts(query)` - Tìm kiếm nâng cao

**Restaurant Owner Endpoints (Cần auth):**
- ✅ `createProduct()` - Tạo món ăn mới
- ✅ `updateProduct(id)` - Cập nhật món ăn (chỉ của mình)
- ✅ `deleteProduct(id)` - Xóa món ăn (chỉ của mình)
- ✅ `getMyProducts()` - Xem danh sách món của mình
- ✅ `toggleAvailability(id)` - Bật/tắt trạng thái có sẵn
- ✅ `updateProductImages(id)` - Cập nhật hình ảnh món ăn

**Tính năng nổi bật:**
- Validate Category và Image tồn tại
- Kiểm tra ownership (chỉ sửa món của nhà hàng mình)
- Auto-populate Category và Image references
- Hỗ trợ filter, search, pagination
- Error handling đầy đủ
- Thông báo tiếng Việt

### 3. Product Routes
**File:** `services/product-service/src/routes/productRoutes.js` 🔄 **ĐÃ CẬP NHẬT**

**Route Structure:**
```javascript
// Public routes
GET    /api/products                      // Danh sách tất cả món
GET    /api/products/search              // Tìm kiếm
GET    /api/products/restaurant/:id      // Món của 1 nhà hàng
GET    /api/products/:id                 // Chi tiết món

// Protected routes (Restaurant only)
POST   /api/products                     // Tạo món mới
GET    /api/products/my-products/list    // Món của tôi
PUT    /api/products/:id                 // Cập nhật món
DELETE /api/products/:id                 // Xóa món
PATCH  /api/products/:id/availability    // Toggle available
PUT    /api/products/:id/images          // Cập nhật hình ảnh
```

**Middleware Chain:**
```javascript
protect → restrictTo('restaurant') → checkRestaurantOwnership
```

### 4. User Service - Enhanced JWT
**File:** `services/user-service/src/controllers/authController.js` 🔄 **ĐÃ CẬP NHẬT**

**Thay đổi `generateToken()`:**
```javascript
// Trước (chỉ có userId):
jwt.sign({ id: userId }, ...)

// Sau (có đầy đủ thông tin):
jwt.sign({ 
  id: user._id,
  role: user.role,
  email: user.email,
  restaurantId: user.restaurantProfile?.restaurantId  // Cho restaurant
}, ...)
```

**Cập nhật Login Response:**
- Thêm `restaurantId` trong response data
- Update `lastLogin` timestamp
- Sử dụng `generateToken(user)` thay vì `generateToken(user._id)`

### 5. Documentation
**File:** `PRODUCT_SERVICE_GUIDE.md` ⭐ **MỚI**

**Nội dung:**
- Hướng dẫn sử dụng đầy đủ
- Cấu trúc dữ liệu Product model
- Tất cả API endpoints với examples
- Request/Response samples
- PowerShell test scripts
- Error handling guide
- Security notes
- Quy trình sử dụng từng bước

**File:** `test-product-service.ps1` ⭐ **MỚI**

**Nội dung:**
- Script test tự động
- 8 bước test đầy đủ:
  1. Đăng ký/Đăng nhập restaurant
  2. Kiểm tra Category
  3. Tạo món ăn
  4. Xem danh sách món
  5. Cập nhật món
  6. Toggle availability
  7. Xem chi tiết
  8. Xóa món (optional)

## Luồng Hoạt Động

### 1. Restaurant Registration/Login
```
User → User Service → Register/Login → JWT Token (có restaurantId)
```

### 2. Create Product
```
Restaurant → Product Service
  ↓
Auth Middleware: Verify JWT
  ↓
Restrict: Check role = 'restaurant'
  ↓
Check Ownership: Extract restaurantId from JWT
  ↓
Controller: Validate Category & Images exist
  ↓
Create Product with restaurantId
  ↓
Response: Product data
```

### 3. Update/Delete Product
```
Restaurant → Product Service
  ↓
Auth Middleware: Verify JWT
  ↓
Controller: Find Product
  ↓
Check: product.restaurantId === user.restaurantId
  ↓
Update/Delete Product
  ↓
Response
```

## Bảo Mật

### Authentication
- ✅ JWT token với thời hạn 7 ngày
- ✅ Token chứa: id, role, email, restaurantId
- ✅ Verify signature với JWT_SECRET

### Authorization
- ✅ Public routes: Không cần auth
- ✅ Restaurant routes: Cần role = 'restaurant'
- ✅ Ownership check: Chỉ sửa món của mình

### Validation
- ✅ Required fields: name, price, categoryId
- ✅ Category existence check
- ✅ Image existence check
- ✅ RestaurantId auto từ JWT (không cho user gửi)

## Database Schema

### Product Document
```javascript
{
  _id: ObjectId,
  name: String (required, 2-100 chars),
  description: String (max 1000 chars),
  price: Number (required, min 0),
  categoryId: ObjectId (required, ref Category),
  restaurantId: ObjectId (required, ref User), // Auto từ JWT
  images: [ObjectId] (ref Image),
  mainImage: ObjectId (ref Image),
  ingredients: [String],
  allergens: [String] (enum),
  spicyLevel: Number (0-5),
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  preparationTime: Number (min 1),
  available: Boolean (default true),
  displayOrder: Number (min 0),
  timestamps: true
}
```

### Indexes
- `restaurantId + categoryId` (compound)
- `categoryId`
- `restaurantId + available`
- `name + description` (text search)

## Testing Checklist

### ✅ Đã Hoàn Thành
- [x] Auth middleware (protect, restrictTo, checkRestaurantOwnership)
- [x] Product Controller (10 endpoints)
- [x] Product Routes (protected + public)
- [x] JWT token enhancement (role, restaurantId)
- [x] Ownership validation
- [x] Error handling
- [x] Vietnamese messages
- [x] Documentation (guide + test script)

### ⏳ Cần Test
- [ ] Rebuild Docker services
- [ ] Create Category in MongoDB
- [ ] Run test script
- [ ] Test with Postman
- [ ] Test ownership check
- [ ] Test unauthorized access
- [ ] Test invalid Category/Image IDs

### 🔜 Các Bước Tiếp Theo

#### 1. Category Service (URGENT - Cần để test Product)
```
✅ Model: Đã có
❌ Controller: Cần tạo
❌ Routes: Cần tạo
```

**Endpoints cần:**
- POST /api/categories (Admin only)
- GET /api/categories (Public)
- PUT /api/categories/:id (Admin only)
- DELETE /api/categories/:id (Admin only)

#### 2. Image Service (HIGH PRIORITY)
```
✅ Model: Đã có
❌ Upload endpoint: Cần tạo
❌ Delete endpoint: Cần tạo
```

**Endpoints cần:**
- POST /api/images/upload (Restaurant/Admin)
- DELETE /api/images/:id (Owner only)
- GET /api/images/:id (Public)

#### 3. Testing & Deployment
- [ ] Create sample Categories in MongoDB
- [ ] Create sample Images in MongoDB
- [ ] Rebuild services: `docker-compose build product-service user-service`
- [ ] Start services: `docker-compose up -d`
- [ ] Run test script: `.\test-product-service.ps1`
- [ ] Update Postman collection

#### 4. Frontend Integration
- [ ] Product management page for restaurants
- [ ] Product listing for customers
- [ ] Category filter
- [ ] Search functionality

## Cách Sử Dụng

### Quick Start

1. **Tạo Category trong MongoDB:**
```javascript
// Database: product_service
// Collection: categories
{
  "name": "Phở",
  "description": "Các loại phở truyền thống",
  "slug": "pho",
  "isActive": true,
  "displayOrder": 1
}
```

2. **Chạy test script:**
```powershell
cd D:\CongNghePM\DA_Microservices\Software-Engineering
.\test-product-service.ps1
```

3. **Hoặc test thủ công:**
```powershell
# 1. Register restaurant
$body = @{
    username = "restaurant_test"
    email = "test@restaurant.com"
    password = "password123"
    role = "restaurant"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method Post -ContentType "application/json" -Body $body

$token = $response.data.token

# 2. Create product
$productBody = @{
    name = "Phở Bò"
    price = 65000
    categoryId = "CATEGORY_ID_HERE"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$product = Invoke-RestMethod -Uri "http://localhost:3003/api/products" `
    -Method Post -Headers $headers -Body $productBody
```

## Dependencies

### Product Service
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2"  // ✅ Đã có
}
```

### Environment Variables
```env
PORT=3003
MONGODB_URI=mongodb+srv://...
JWT_SECRET=2ff1011a2f5e65f72b80d9a0667a942b388bab6dc4637f681118a571b07b00474
```

## Lưu Ý Quan Trọng

1. **Category phải tạo trước:** Không thể tạo Product mà chưa có Category
2. **RestaurantId tự động:** Được lấy từ JWT token, không cần gửi trong request
3. **Ownership strict:** Restaurant chỉ có thể CRUD món của mình
4. **Token expiry:** 7 ngày, cần login lại sau khi hết hạn
5. **MainImage auto:** Nếu không set, lấy hình đầu tiên trong images array

## Performance Optimization (Future)

- [ ] Add Redis caching for popular products
- [ ] Implement pagination cursor-based
- [ ] Add database connection pooling
- [ ] Optimize populate queries
- [ ] Add GraphQL support

## Error Codes

| Code | Message | Reason |
|------|---------|--------|
| 400 | Vui lòng cung cấp tên món, giá và danh mục | Missing required fields |
| 401 | Not authorized to access this route | No JWT token |
| 401 | Invalid token | Token expired/invalid |
| 403 | User role 'customer' is not authorized | Wrong role |
| 403 | Bạn không có quyền chỉnh sửa món ăn này | Not owner |
| 404 | Không tìm thấy món ăn | Product not found |
| 404 | Không tìm thấy danh mục | Category not found |
| 404 | Một số hình ảnh không tồn tại | Invalid image IDs |

## Support

Xem documentation đầy đủ tại:
- `PRODUCT_SERVICE_GUIDE.md` - Hướng dẫn sử dụng
- `test-product-service.ps1` - Test script
- `PRD_VS_SCHEMA_COMPARISON.md` - So sánh PRD vs Schema

---

**Status:** ✅ **HOÀN THÀNH** - Ready for testing (cần tạo Category trước)
**Last Updated:** 2025-01-21
