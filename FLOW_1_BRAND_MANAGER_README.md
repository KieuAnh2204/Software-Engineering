# 🏪 Luồng 1: Chủ Nhà Hàng Đăng Ký và Thêm Món Ăn

## 📋 Mục tiêu
Chủ nhà hàng đăng ký tài khoản và đưa nhà hàng + món ăn lên hệ thống.

**Hỗ trợ tự động:**
- 🏪 **Quán đơn**: Không cần tạo Brand riêng, hệ thống tự động xử lý
- 🏢 **Chuỗi/Franchise**: Tạo Brand trước, sau đó thêm nhiều chi nhánh

## 🎯 Services tham gia
- **SV1 (User Service)**: Quản lý User, Brand, Restaurant
- **SV2 (Product Service)**: Quản lý Category, Dish

---

## 🚀 Luồng đăng ký cơ bản (2 bước)

### **Bước 1: Đăng ký tài khoản** 
**Service:** User Service (SV1)

```bash
POST http://localhost:3001/api/auth/register
```

**Request Body:**
```json
{
  "username": "chutiem",
  "email": "chutiem@example.com",
  "password": "123456",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "role": "BRAND_MANAGER"
}
```

**Response:** Lưu lại `token`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "chutiem", ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **Bước 2: Tạo nhà hàng**
**Service:** User Service (SV1)

⚡ **Đơn giản**: Không cần gửi `brandId`, hệ thống tự tạo

```bash
POST http://localhost:3001/api/restaurants
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Quán Phở Ngon",
  "address": {
    "street": "123 Nguyễn Huệ",
    "ward": "Phường Bến Nghé",
    "district": "Quận 1",
    "city": "Hồ Chí Minh"
  },
  "phone": "0281234567",
  "email": "contact@phonon.com"
}
```
> ⚠️ **Lưu ý**: Không có field `brandId` → Hệ thống tự động tạo Brand

**Response:**
```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "_id": "674e3456789012cdef3456",
    "name": "Quán Phở Ngon",
    "brandId": {
      "_id": "674e9999...",
      "name": "Quán Phở Ngon"  ← Tự động tạo
    },
    "address": { ... },
    "status": "active"
  },
  "note": "Auto-created default brand for small restaurant"
}
```

✅ **XONG!** Lưu lại `_id` của restaurant để dùng ở bước tiếp theo.

---

## 🔄 [Tùy chọn] Mở rộng thành chuỗi

Nếu sau này muốn mở thêm chi nhánh:

### **Bước 2a: Lấy Brand ID hiện có**
```bash
GET http://localhost:3001/api/brands
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "_id": "674e9999...",
      "name": "Quán Phở Ngon"  ← Brand đã tự động tạo
    }
  ]
}
```

### **Bước 2b: Tạo chi nhánh mới**
```bash
POST http://localhost:3001/api/restaurants
Authorization: Bearer <token>
```

```json
{
  "name": "Quán Phở Ngon - Chi nhánh 2",
  "brandId": "674e9999...",  ← Dùng lại Brand
  "address": {
    "district": "Quận 3",
    ...
  }
}
```

---

## 🏢 Hoặc: Tạo Brand từ đầu (Cho chuỗi lớn)

Nếu bạn **đã biết** sẽ có nhiều chi nhánh từ đầu:

### **Bước 1.5: Tạo Brand trước**
```bash
POST http://localhost:3001/api/brands
Authorization: Bearer <token>
```

```json
{
  "name": "Phở A",
  "description": "Chuỗi nhà hàng phở truyền thống",
  "logo": "https://example.com/logo.png"
}
```

**Response:** Lưu lại `_id`
```json
{
  "data": {
    "_id": "674e2345678901bcdef2345",
    "name": "Phở A",
    ...
  }
}
```

### **Bước 2: Tạo chi nhánh với Brand**
```json
{
  "name": "Phở A - Quận 1",
  "brandId": "674e2345678901bcdef2345",  ← Có Brand từ trước
  "address": { ... }
}
```

---

## 📝 Thêm món ăn vào nhà hàng

### **Bước 3: Tạo Danh mục (Category)**
**Service:** Product Service (SV2)

🔒 **SV2 gọi nội bộ sang SV1 để xác thực quyền sở hữu:**
```bash
GET http://localhost:3001/api/restaurants/674e3456789012cdef3456/check-owner?user_id=674e1234567890abcdef1234
```

```bash
POST http://localhost:3003/api/categories
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Phở",
  "description": "Các loại phở truyền thống",
  "restaurantId": "674e3456789012cdef3456",
  "displayOrder": 1
}
```

**Response:** Lưu lại `categoryId`
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "674e4567890123def4567",
    "name": "Phở",
    "restaurantId": "674e3456789012cdef3456",
    "isActive": true
  }
}
```

---

### **Bước 4: Thêm Món ăn (Dish)**
**Service:** Product Service (SV2)

🔒 **SV2 gọi nội bộ sang SV1 để xác thực quyền sở hữu:**
```bash
GET http://localhost:3001/api/restaurants/674e3456789012cdef3456/check-owner?user_id=674e1234567890abcdef1234
```

```bash
POST http://localhost:3003/api/dishes
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Phở Tái",
  "description": "Phở bò tái chín đặc biệt",
  "price": 50000,
  "categoryId": "674e4567890123def4567",
  "restaurantId": "674e3456789012cdef3456",
  "images": ["https://example.com/pho-tai.jpg"],
  "preparationTime": 15,
  "unit": "bowl",
  "tags": ["phở", "bò", "tái"],
  "isAvailable": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dish created successfully",
  "data": {
    "_id": "674e5678901234ef5678",
    "name": "Phở Tái",
    "description": "Phở bò tái chín đặc biệt",
    "price": 50000,
    "categoryId": "674e4567890123def4567",
    "restaurantId": "674e3456789012cdef3456",
    "images": ["https://example.com/pho-tai.jpg"],
    "preparationTime": 15,
    "unit": "bowl",
    "isAvailable": true,
    "rating": {
      "average": 0,
      "count": 0
    },
    "soldCount": 0,
    "createdAt": "2024-12-03T10:15:00.000Z"
  }
}
```

---

## 🔐 Security Flow: Xác thực quyền sở hữu

### API Internal (Server-to-Server)
**Endpoint:** `GET /api/restaurants/:id/check-owner`

**SV2 (Product Service)** gọi sang **SV1 (User Service)** để kiểm tra:
- Restaurant có tồn tại không?
- Restaurant thuộc Brand nào?
- Brand thuộc User nào?
- User này có phải là owner không?

**Logic kiểm tra:**
```
Restaurant (id: 52) 
  → brandId: "674e2345678901bcdef2345"
    → Brand.ownerId: "674e1234567890abcdef1234"
      → So sánh với user_id từ request
        → True ✅ / False ❌
```

---

## 📊 Database Structure

### User Service (MongoDB: `user_service`)
**Collections:**
- `users` - Thông tin user
- `restaurant_brands` - Thương hiệu nhà hàng
- `restaurants` - Chi nhánh nhà hàng

### Product Service (MongoDB: `product_service`)
**Collections:**
- `categories` - Danh mục món ăn
- `dishes` - Món ăn cụ thể

---

## 🧪 Testing với Postman

### 1. Import Collection
File: `FoodFast_Delivery.postman_collection.json`

### 2. Environment Variables
```json
{
  "base_url_user": "http://localhost:3001",
  "base_url_product": "http://localhost:3003",
  "auth_token": "<token_from_login>",
  "brand_id": "<brand_id>",
  "restaurant_id": "<restaurant_id>",
  "category_id": "<category_id>"
}
```

### 3. Test Flow
1. Register BRAND_MANAGER
2. Copy `token` → Set vào environment
3. Create Brand → Copy `_id` → Set `brand_id`
4. Create Restaurant → Copy `_id` → Set `restaurant_id`
5. Create Category → Copy `_id` → Set `category_id`
6. Create Dish

---

## 🛠️ Setup & Run

### Install Dependencies
```bash
# User Service
cd services/user-service
npm install

# Product Service
cd services/product-service
npm install axios  # Thêm axios để gọi API nội bộ
```

### Environment Variables
File: `services/.env`
```env
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3003
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3003
```

### Start Services
```bash
# Terminal 1: User Service
cd services/user-service
npm run dev

# Terminal 2: Product Service
cd services/product-service
npm run dev
```

---

## 📝 Tóm tắt

### ✨ Điểm mạnh của thiết kế:
✅ **Linh hoạt**: Tự động phát hiện quán đơn/chuỗi  
✅ **Đơn giản**: Không cần tạo Brand thủ công  
✅ **Mở rộng**: Dễ thêm chi nhánh sau này  
✅ **Bảo mật**: Xác thực quyền sở hữu qua API nội bộ  
✅ **Scalable**: Mỗi service có database riêng  

### 🎯 Luồng sử dụng:
1. **Quán đơn (Đơn giản)**: 
   - Đăng ký → Tạo Restaurant (không brandId) → Thêm món
   - Brand tự động tạo ngầm

2. **Chuỗi (Mở rộng)**:
   - Đăng ký → Tạo Brand → Tạo nhiều Restaurant → Thêm món
   - Quản lý tập trung

### ⚠️ Lưu ý quan trọng:
- API `/restaurants/:id/check-owner` là internal API (không cần auth token)  
- Product Service PHẢI gọi User Service để xác thực quyền  
- Nếu User Service down → Product Service không tạo được Category/Dish  

---

## 🔗 Related Files
- Models: `RestaurantBrand.js`, `Restaurant.js`, `Category.js`, `Dish.js`
- Controllers: `brandController.js`, `restaurantController.js`, `categoryController.js`, `dishController.js`
- Routes: `brandRoutes.js`, `restaurantBranchRoutes.js`, `categoryRoutes.js`, `dishRoutes.js`

# 🎨 Sơ đồ luồng đăng ký nhà hàng

## 📊 Luồng đơn giản (Tự động)

```
┌─────────────────────────────────────────────────────────────┐
│                    ĐĂNG KÝ NHÀ HÀNG                         │
└─────────────────────────────────────────────────────────────┘

1️⃣ Đăng ký tài khoản
   ↓
   POST /api/auth/register
   {
     "username": "chutiem",
     "email": "chutiem@example.com",
     "role": "BRAND_MANAGER"
   }
   ↓
   Nhận TOKEN ✅

2️⃣ Tạo nhà hàng (KHÔNG gửi brandId)
   ↓
   POST /api/restaurants
   {
     "name": "Quán Phở Ngon",
     "address": { ... }
     // ⚠️ Không có brandId
   }
   ↓
   🤖 HỆ THỐNG TỰ ĐỘNG:
   - Tạo Brand: "Quán Phở Ngon"
   - Tạo Restaurant gắn với Brand đó
   ↓
   HOÀN THÀNH ✅

3️⃣ Thêm món ăn
   ↓
   POST /api/categories → POST /api/dishes
```

---

## 🔄 Luồng mở rộng (Có chi nhánh)

```
┌─────────────────────────────────────────────────────────────┐
│              CHUỖI NHÀ HÀNG / FRANCHISE                     │
└─────────────────────────────────────────────────────────────┘

1️⃣ Đăng ký tài khoản
   ↓
   (Giống trên)

2️⃣ [Tùy chọn A] Tạo Restaurant đơn → Mở rộng sau
   ↓
   POST /api/restaurants
   { "name": "Phở A - Q1" }  // Không có brandId
   ↓
   Brand tự động tạo: "Phở A - Q1"
   ↓
   Sau này muốn mở chi nhánh:
   GET /api/brands → Lấy brandId
   POST /api/restaurants { brandId: "xxx" }

   [Tùy chọn B] Tạo Brand trước → Thêm chi nhánh
   ↓
   POST /api/brands
   { "name": "Phở A", "description": "Chuỗi phở" }
   ↓
   Nhận brandId: "674e2345..."
   ↓
   POST /api/restaurants
   { "name": "Phở A - Q1", "brandId": "674e2345..." }
   ↓
   POST /api/restaurants
   { "name": "Phở A - Q3", "brandId": "674e2345..." }
   ↓
   Tất cả chi nhánh chung 1 Brand ✅
```

---

## 🔐 Bảo mật: Xác thực quyền sở hữu

```
┌─────────────────────────────────────────────────────────────┐
│     PRODUCT SERVICE KIỂM TRA QUYỀN TẠO CATEGORY/DISH       │
└─────────────────────────────────────────────────────────────┘

Client gửi:
POST /api/categories
{
  "restaurantId": "52",
  "name": "Phở"
}
↓
Product Service nhận request
↓
Kiểm tra: User này có quyền với Restaurant 52?
↓
GỌI NỘI BỘ → User Service:
GET /api/restaurants/52/check-owner?user_id=123
↓
User Service kiểm tra:
Restaurant 52 → Brand X → Owner = User 123?
↓
Trả về: { isOwner: true/false }
↓
Product Service:
- isOwner = true  ✅ → Tạo Category
- isOwner = false ❌ → Return 403 Forbidden
```

---

## 🗄️ Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   USER SERVICE (SV1)                        │
│               MongoDB: user_service                         │
└─────────────────────────────────────────────────────────────┘

Collection: users
{
  _id: "674e1234...",
  username: "chutiem",
  email: "chutiem@example.com",
  role: "BRAND_MANAGER"
}

Collection: restaurant_brands
{
  _id: "674e2345...",
  name: "Quán Phở Ngon",  ← Tự động tạo
  ownerId: "674e1234..."
}

Collection: restaurants
{
  _id: "674e3456...",
  name: "Quán Phở Ngon",
  brandId: "674e2345...",
  address: { ... }
}

┌─────────────────────────────────────────────────────────────┐
│                  PRODUCT SERVICE (SV2)                      │
│              MongoDB: product_service                       │
└─────────────────────────────────────────────────────────────┘

Collection: categories
{
  _id: "674e4567...",
  name: "Phở",
  restaurantId: "674e3456..."  ← Link sang SV1
}

Collection: dishes
{
  _id: "674e5678...",
  name: "Phở Tái",
  categoryId: "674e4567...",
  restaurantId: "674e3456...",  ← Link sang SV1
  price: 50000
}
```

---

## 🎯 Kết luận

### ✅ Ưu điểm:
- **Đơn giản**: 1 API, nhiều cách dùng
- **Tự động**: Hệ thống tự tạo Brand khi cần
- **Linh hoạt**: Mở rộng dễ dàng
- **Bảo mật**: Xác thực quyền chặt chẽ

### 🔑 Nguyên tắc:
```
KHÔNG gửi brandId → Quán đơn (Brand tự động)
CÓ gửi brandId    → Chuỗi (Brand có sẵn)
```

### 📝 Quy trình:
```
Đăng ký → Tạo Restaurant → Thêm Category → Thêm Dish
   ↓           ↓                ↓              ↓
  SV1         SV1              SV2            SV2
              (Auto Brand)  (Check owner)  (Check owner)
```
