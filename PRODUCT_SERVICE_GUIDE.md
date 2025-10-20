# Product Service - Hướng Dẫn Sử Dụng Cho Nhà Hàng

## Tổng Quan
Product Service cho phép nhà hàng quản lý thực đơn của mình, bao gồm:
- ✅ Thêm món ăn mới
- ✅ Cập nhật thông tin món ăn
- ✅ Xóa món ăn
- ✅ Quản lý hình ảnh món ăn
- ✅ Bật/tắt trạng thái có sẵn của món ăn
- ✅ Xem danh sách món ăn của nhà hàng

## Cấu Trúc Dữ Liệu

### Product Model
```javascript
{
  name: String,              // Tên món ăn (required)
  description: String,       // Mô tả
  price: Number,             // Giá (VND, required)
  categoryId: ObjectId,      // ID danh mục (required)
  restaurantId: ObjectId,    // ID nhà hàng (auto từ JWT)
  images: [ObjectId],        // Mảng ID hình ảnh
  mainImage: ObjectId,       // Hình ảnh chính
  ingredients: [String],     // Nguyên liệu
  allergens: [String],       // Chất gây dị ứng
  spicyLevel: Number,        // Độ cay (0-5)
  nutritionInfo: {
    calories: Number,        // Calories
    protein: Number,         // Protein (g)
    carbs: Number,          // Carbs (g)
    fat: Number             // Fat (g)
  },
  preparationTime: Number,   // Thời gian chuẩn bị (phút)
  available: Boolean,        // Có sẵn
  displayOrder: Number       // Thứ tự hiển thị
}
```

## API Endpoints

### 1. Tạo Món Ăn Mới
**Endpoint:** `POST http://localhost:3003/api/products`  
**Authentication:** Required (Restaurant Owner)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Phở Bò Đặc Biệt",
  "description": "Phở bò với đầy đủ các loại thịt bò: tái, nạm, gầu, gân",
  "price": 65000,
  "categoryId": "CATEGORY_ID_HERE",
  "images": ["IMAGE_ID_1", "IMAGE_ID_2"],
  "mainImage": "IMAGE_ID_1",
  "ingredients": ["Bánh phở", "Thịt bò", "Hành", "Ngò"],
  "allergens": ["gluten"],
  "spicyLevel": 1,
  "nutritionInfo": {
    "calories": 450,
    "protein": 30,
    "carbs": 60,
    "fat": 12
  },
  "preparationTime": 20,
  "available": true,
  "displayOrder": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Tạo món ăn thành công",
  "data": {
    "_id": "product_id",
    "name": "Phở Bò Đặc Biệt",
    "price": 65000,
    "categoryId": {
      "_id": "category_id",
      "name": "Phở",
      "slug": "pho"
    },
    "restaurantId": "restaurant_id",
    "images": [...],
    "mainImage": {...},
    "available": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Xem Danh Sách Món Ăn Của Tôi
**Endpoint:** `GET http://localhost:3003/api/products/my-products/list`  
**Authentication:** Required (Restaurant Owner)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `categoryId` (optional): Lọc theo danh mục
- `available` (optional): Lọc theo trạng thái (true/false)
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 50)

**Example:**
```
GET http://localhost:3003/api/products/my-products/list?categoryId=xxx&available=true&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 45,
  "page": 1,
  "pages": 3,
  "data": [...]
}
```

### 3. Cập Nhật Món Ăn
**Endpoint:** `PUT http://localhost:3003/api/products/:id`  
**Authentication:** Required (Restaurant Owner - Own products only)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:** (Chỉ gửi các field cần update)
```json
{
  "price": 70000,
  "description": "Phở bò đặc biệt - Đã tăng giá",
  "available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật món ăn thành công",
  "data": {...}
}
```

### 4. Xóa Món Ăn
**Endpoint:** `DELETE http://localhost:3003/api/products/:id`  
**Authentication:** Required (Restaurant Owner - Own products only)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa món ăn thành công"
}
```

### 5. Bật/Tắt Trạng Thái Có Sẵn
**Endpoint:** `PATCH http://localhost:3003/api/products/:id/availability`  
**Authentication:** Required (Restaurant Owner - Own products only)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Món ăn đã có sẵn",
  "data": {
    "available": true
  }
}
```

### 6. Cập Nhật Hình Ảnh Món Ăn
**Endpoint:** `PUT http://localhost:3003/api/products/:id/images`  
**Authentication:** Required (Restaurant Owner - Own products only)  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "images": ["IMAGE_ID_1", "IMAGE_ID_2", "IMAGE_ID_3"],
  "mainImage": "IMAGE_ID_1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật hình ảnh thành công",
  "data": {...}
}
```

## Public Endpoints (Không Cần Authentication)

### 7. Tìm Kiếm Món Ăn
**Endpoint:** `GET http://localhost:3003/api/products`  
**Query Parameters:**
- `categoryId`: Lọc theo danh mục
- `restaurantId`: Lọc theo nhà hàng
- `search`: Tìm kiếm theo tên/mô tả
- `available`: Lọc theo trạng thái
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `spicyLevel`: Độ cay (0-5)
- `page`: Trang
- `limit`: Số lượng/trang
- `sort`: Sắp xếp (-createdAt, price, -price, name)

**Example:**
```
GET http://localhost:3003/api/products?categoryId=xxx&minPrice=50000&maxPrice=100000&available=true&page=1&limit=20
```

### 8. Xem Chi Tiết Món Ăn
**Endpoint:** `GET http://localhost:3003/api/products/:id`

### 9. Xem Món Ăn Theo Nhà Hàng
**Endpoint:** `GET http://localhost:3003/api/products/restaurant/:restaurantId`  
**Query Parameters:**
- `categoryId`: Lọc theo danh mục
- `available`: Lọc theo trạng thái

### 10. Tìm Kiếm Nâng Cao
**Endpoint:** `GET http://localhost:3003/api/products/search`  
**Query Parameters:**
- `q`: Từ khóa tìm kiếm (required)
- `categoryId`: Lọc theo danh mục
- `restaurantId`: Lọc theo nhà hàng
- `available`: Lọc theo trạng thái

## Quy Trình Sử Dụng

### Bước 1: Đăng Ký/Đăng Nhập Tài Khoản Nhà Hàng

```powershell
# Đăng ký tài khoản nhà hàng
$registerBody = @{
    username = "restaurant_pho"
    email = "pho@restaurant.com"
    password = "password123"
    fullName = "Phở Hà Nội"
    phone = "0987654321"
    role = "restaurant"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method Post -ContentType "application/json" -Body $registerBody

$token = $response.data.token
$restaurantId = $response.data.user.id

Write-Host "Token: $token"
Write-Host "Restaurant ID: $restaurantId"
```

### Bước 2: Tạo Danh Mục (Category) - Admin Only
*(Yêu cầu admin tạo danh mục trước)*

### Bước 3: Upload Hình Ảnh (Image) - Sẽ được implement sau
*(Tạm thời có thể tạo Image document trực tiếp trong MongoDB)*

### Bước 4: Tạo Món Ăn

```powershell
# Sử dụng token từ bước 1
$productBody = @{
    name = "Phở Bò Đặc Biệt"
    description = "Phở bò với đầy đủ các loại thịt"
    price = 65000
    categoryId = "CATEGORY_ID_HERE"
    ingredients = @("Bánh phở", "Thịt bò", "Hành", "Ngò")
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

$product = Invoke-RestMethod -Uri "http://localhost:3003/api/products" `
    -Method Post -Headers $headers -Body $productBody

$productId = $product.data._id
Write-Host "Product created: $productId"
```

### Bước 5: Xem Danh Sách Món Ăn

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$myProducts = Invoke-RestMethod -Uri "http://localhost:3003/api/products/my-products/list" `
    -Method Get -Headers $headers

Write-Host "Total products: $($myProducts.total)"
$myProducts.data | Format-Table name, price, available
```

### Bước 6: Cập Nhật Món Ăn

```powershell
$updateBody = @{
    price = 70000
    description = "Phở bò đặc biệt - Đã tăng giá"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$updated = Invoke-RestMethod -Uri "http://localhost:3003/api/products/$productId" `
    -Method Put -Headers $headers -Body $updateBody

Write-Host "Updated product: $($updated.data.name) - Price: $($updated.data.price)"
```

### Bước 7: Bật/Tắt Món Ăn

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$toggle = Invoke-RestMethod -Uri "http://localhost:3003/api/products/$productId/availability" `
    -Method Patch -Headers $headers

Write-Host $toggle.message
```

## Xử Lý Lỗi

### 1. Không có quyền truy cập
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login first."
}
```
**Giải pháp:** Đảm bảo gửi JWT token trong header Authorization

### 2. Không có quyền chỉnh sửa
```json
{
  "success": false,
  "message": "Bạn không có quyền chỉnh sửa món ăn này"
}
```
**Giải pháp:** Chỉ có thể chỉnh sửa món ăn của nhà hàng mình

### 3. Danh mục không tồn tại
```json
{
  "success": false,
  "message": "Không tìm thấy danh mục"
}
```
**Giải pháp:** Kiểm tra categoryId có tồn tại trong database

### 4. Thiếu thông tin bắt buộc
```json
{
  "success": false,
  "message": "Vui lòng cung cấp tên món, giá và danh mục"
}
```
**Giải pháp:** Cung cấp đầy đủ: name, price, categoryId

## Bảo Mật

### JWT Token
- Token có thời hạn 7 ngày
- Token chứa: id, role, email, restaurantId
- Mỗi request cần gửi token trong header: `Authorization: Bearer TOKEN`

### Quyền Truy Cập
- **Public:** Xem danh sách, tìm kiếm, chi tiết món ăn
- **Restaurant Owner:** CRUD món ăn của nhà hàng mình
- **Admin:** Quản lý tất cả (sẽ implement sau)

### Ownership Check
- Khi tạo món: Tự động gán `restaurantId` từ JWT token
- Khi cập nhật/xóa: Kiểm tra `product.restaurantId === user.restaurantId`

## Lưu Ý

1. **Category phải được tạo trước:** Admin cần tạo danh mục trước khi nhà hàng thêm món
2. **Image Management:** Hiện tại chưa có API upload image, cần implement sau
3. **RestaurantId:** Được tự động lấy từ JWT token, không cần gửi trong request
4. **MainImage:** Nếu không chỉ định, sẽ tự động lấy hình đầu tiên trong mảng images
5. **Validation:** Tất cả input đều được validate trước khi lưu database

## Các Bước Tiếp Theo

### 1. Category Management
- [ ] Create Category Controller
- [ ] Create Category Routes
- [ ] Admin: CRUD categories
- [ ] Public: List active categories

### 2. Image Management
- [ ] Create Image upload endpoint
- [ ] Support multiple file upload
- [ ] Image compression and optimization
- [ ] Delete image endpoint

### 3. Testing
- [ ] Update Postman collection
- [ ] Test all endpoints
- [ ] Test authentication and authorization
- [ ] Test ownership validation

### 4. Deployment
- [ ] Rebuild Docker services
- [ ] Test in Docker environment
- [ ] Update documentation

## Liên Hệ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.
