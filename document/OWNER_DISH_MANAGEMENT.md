# 🍽️ Owner Dish Management - Hướng dẫn quản lý món ăn

## 📋 Tổng quan

Tính năng cho phép Owner thêm, sửa, xóa và quản lý món ăn trong menu nhà hàng. Hệ thống tự động kiểm tra món trùng lặp và lưu trữ trên MongoDB Atlas.

---

## 🎯 Các tính năng chính

### 1. **Thêm món ăn mới**
- Form nhập đầy đủ thông tin món ăn
- Validate tính hợp lệ (tên, giá)
- Kiểm tra món trùng lặp (case-insensitive)
- Preview hình ảnh món ăn

### 2. **Sửa món ăn**
- Cập nhật thông tin món ăn
- Thay đổi giá, mô tả, hình ảnh
- Toggle trạng thái available/unavailable

### 3. **Xóa món ăn**
- Xóa món khỏi database
- Xác nhận trước khi xóa

### 4. **Danh sách món ăn**
- Hiển thị tất cả món ăn của nhà hàng
- Preview hình ảnh thumbnail
- Badge trạng thái có thể click để toggle

---

## 📝 Cấu trúc dữ liệu

### **Dish Schema (MongoDB)**
```javascript
{
  _id: ObjectId,
  restaurant_id: ObjectId,      // ID nhà hàng
  name: String,                  // Tên món (required)
  description: String,           // Mô tả món
  price: Number,                 // Giá (VND, required)
  image_url: String,             // URL hình ảnh
  is_available: Boolean,         // Trạng thái sẵn sàng
  created_at: Date,
  updated_at: Date
}
```

### **Ví dụ dữ liệu**
```json
{
  "_id": "691938c048990eb197f9654c",
  "restaurant_id": "691938ab48990eb197f96549",
  "name": "Bun Bo Hue Dac Biet",
  "description": "Special Bun Bo Hue with all toppings",
  "price": 55000,
  "image_url": "https://example.com/bunbohue.jpg",
  "is_available": true,
  "created_at": "2025-11-16T02:36:48.521Z",
  "updated_at": "2025-11-16T02:36:48.521Z"
}
```

---

## 🔧 Backend API

### **Base URL**
```
http://localhost:3003/api
```

### **Endpoints**

#### 1️⃣ **GET /dishes?restaurant_id={id}**
Lấy danh sách món ăn của nhà hàng

**Query Parameters:**
- `restaurant_id` (required): ID nhà hàng

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "691938c048990eb197f9654c",
      "restaurant_id": "691938ab48990eb197f96549",
      "name": "Bun Bo Hue Dac Biet",
      "description": "Special Bun Bo Hue with all toppings",
      "price": 55000,
      "image_url": null,
      "is_available": true,
      "created_at": "2025-11-16T02:36:48.521Z",
      "updated_at": "2025-11-16T02:36:48.521Z"
    }
  ]
}
```

---

#### 2️⃣ **POST /dishes**
Tạo món ăn mới

**Headers:**
```
Authorization: Bearer <owner_token>
Content-Type: application/json
```

**Body:**
```json
{
  "restaurant_id": "691938ab48990eb197f96549",
  "name": "Phở bò đặc biệt",
  "description": "Phở bò tái nạm gân",
  "price": 60000,
  "image_url": "https://example.com/pho.jpg",
  "is_available": true
}
```

**Validation:**
- `restaurant_id` (required): Phải tồn tại trong database
- `name` (required): Không được trống
- `price` (required): Phải > 0
- `description` (optional): Mô tả món
- `image_url` (optional): URL hợp lệ
- `is_available` (optional): Default = true

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "691938c048990eb197f9654d",
    "restaurant_id": "691938ab48990eb197f96549",
    "name": "Phở bò đặc biệt",
    "description": "Phở bò tái nạm gân",
    "price": 60000,
    "image_url": "https://example.com/pho.jpg",
    "is_available": true,
    "created_at": "2025-11-18T10:00:00.000Z",
    "updated_at": "2025-11-18T10:00:00.000Z"
  }
}
```

**Error Response - Món trùng lặp (409):**
```json
{
  "success": false,
  "message": "Món ăn này đã tồn tại trong nhà hàng",
  "duplicate": true
}
```

**Error Response - Validation (400):**
```json
{
  "success": false,
  "message": "restaurant_id, name and price are required"
}
```

---

#### 3️⃣ **PUT /dishes/:id**
Cập nhật món ăn

**Headers:**
```
Authorization: Bearer <owner_token>
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "name": "Phở bò đặc biệt VIP",
  "description": "Phở bò tái nạm gân với thêm gân bò",
  "price": 65000,
  "image_url": "https://example.com/pho-vip.jpg",
  "is_available": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dish updated",
  "data": { /* updated dish */ }
}
```

---

#### 4️⃣ **DELETE /dishes/:id**
Xóa món ăn

**Headers:**
```
Authorization: Bearer <owner_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dish deleted"
}
```

---

## 🖥️ Frontend Implementation

### **Component: OwnerMenuManagement**
```typescript
// Location: frontend/Users/src/components/owner/OwnerMenuManagement.tsx

interface DishData {
  _id?: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}
```

### **API Client Functions**
```typescript
// Location: frontend/Users/src/api/ownerApi.ts

export const getDishes = (restaurantId: string) =>
  productClient.get(`/dishes?restaurant_id=${restaurantId}`);

export const createDish = (data: DishData) => 
  productClient.post("/dishes", data);

export const updateDish = (dishId: string, data: Partial<DishData>) =>
  productClient.put(`/dishes/${dishId}`, data);

export const deleteDish = (dishId: string) =>
  productClient.delete(`/dishes/${dishId}`);
```

---

## 🎨 UI Form Fields

### **Form Add/Edit Dish**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Name** | Text | ✅ Yes | Tên món ăn (VD: Bún bò Huế) |
| **Description** | Textarea | ❌ No | Mô tả chi tiết món |
| **Price** | Number | ✅ Yes | Giá món (VND, bước nhảy 1000) |
| **Image URL** | URL | ❌ No | Link hình ảnh món ăn |
| **Status** | Select | ❌ No | Available / Unavailable (default: Available) |

### **Form Preview**
```
┌─────────────────────────────────┐
│  Add New Dish                   │
├─────────────────────────────────┤
│  Name *                         │
│  [Bún bò Huế đặc biệt____]      │
│                                 │
│  Description                    │
│  [Special Bun Bo Hue with...    │
│   all toppings_____________]    │
│                                 │
│  Price (VND) *                  │
│  [55000_____________]           │
│                                 │
│  Image URL                      │
│  [https://example.com/...___]   │
│  [Preview Image: 🖼️]            │
│                                 │
│  Status                         │
│  [▼ Available          ]        │
│                                 │
│  [Create Dish          ]        │
└─────────────────────────────────┘
```

---

## ✅ Validation Logic

### **Backend Validation (dishController.js)**

```javascript
// 1. Kiểm tra required fields
if (!restaurant_id || !name || price === undefined) {
  return res.status(400).json({ 
    success: false, 
    message: 'restaurant_id, name and price are required' 
  });
}

// 2. Kiểm tra restaurant tồn tại
const restaurant = await Restaurant.findById(restaurant_id);
if (!restaurant) {
  return res.status(404).json({ 
    success: false, 
    message: 'Restaurant not found' 
  });
}

// 3. Kiểm tra owner permission
if (req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
  return res.status(403).json({ 
    success: false, 
    message: 'Cannot manage dishes for another owner' 
  });
}

// 4. Kiểm tra món trùng lặp (case-insensitive)
const existingDish = await Dish.findOne({ 
  restaurant_id, 
  name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
});

if (existingDish) {
  return res.status(409).json({ 
    success: false, 
    message: 'Món ăn này đã tồn tại trong nhà hàng',
    duplicate: true 
  });
}
```

### **Frontend Validation (OwnerMenuManagement.tsx)**

```typescript
// 1. Check tên món rỗng
if (!formData.name.trim()) {
  toast({ title: "Vui lòng nhập tên món ăn", variant: "destructive" });
  return;
}

// 2. Check giá > 0
if (formData.price <= 0) {
  toast({ title: "Giá món ăn phải lớn hơn 0", variant: "destructive" });
  return;
}

// 3. Handle duplicate error from backend
if (error.response?.status === 409 || error.response?.data?.duplicate) {
  toast({
    title: "Món ăn đã tồn tại",
    description: "Món ăn này đã có trong menu nhà hàng",
    variant: "destructive",
  });
}
```

---

## 🧪 Testing Flow

### **Test Case 1: Thêm món mới thành công**
1. Click "Add Dish" button
2. Nhập thông tin:
   - Name: "Cơm tấm sườn bì chả"
   - Description: "Cơm tấm truyền thống Sài Gòn"
   - Price: 45000
   - Image URL: "https://example.com/comtam.jpg"
   - Status: Available
3. Click "Create Dish"
4. ✅ **Expected**: Toast "Tạo món ăn thành công", món xuất hiện trong bảng

---

### **Test Case 2: Kiểm tra món trùng lặp**
1. Click "Add Dish"
2. Nhập tên món đã tồn tại: "Bun Bo Hue Dac Biet"
3. Click "Create Dish"
4. ✅ **Expected**: Toast "Món ăn đã tồn tại", form không đóng

---

### **Test Case 3: Validation giá trị âm**
1. Click "Add Dish"
2. Nhập price: -1000
3. Click "Create Dish"
4. ✅ **Expected**: Toast "Giá món ăn phải lớn hơn 0"

---

### **Test Case 4: Sửa món ăn**
1. Click Edit icon (✏️) trên món bất kỳ
2. Thay đổi price: 70000
3. Click "Update Dish"
4. ✅ **Expected**: Toast "Cập nhật thành công", giá mới hiển thị trong bảng

---

### **Test Case 5: Toggle trạng thái**
1. Click Badge "Available" của món bất kỳ
2. ✅ **Expected**: Badge chuyển thành "Unavailable", toast "Đã cập nhật trạng thái"

---

### **Test Case 6: Xóa món ăn**
1. Click Delete icon (🗑️) trên món bất kỳ
2. Confirm dialog
3. ✅ **Expected**: Toast "Đã xóa món ăn", món biến mất khỏi bảng

---

## 🚀 Cách chạy

### **1. Khởi động Product Service**
```powershell
cd services/product-service
npm install
npm start
# Service chạy tại: http://localhost:3003
```

### **2. Khởi động Frontend**
```powershell
cd frontend/Users
npm install
npm run dev
# Frontend chạy tại: http://localhost:5000
```

### **3. Truy cập Owner Portal**
```
http://localhost:5000/owner/menu
```

---

## 📌 Environment Variables

### **Frontend (.env)**
```env
VITE_PRODUCT_API=http://localhost:3003/api
VITE_USER_API=http://localhost:3001/api/auth
```

### **Backend (.env)**
```env
PORT=3003
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product_service
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

---

## 🔒 Authentication

### **Owner Token**
```
Header: Authorization: Bearer <owner_token>
```

Token được lưu trong `localStorage` với key `owner_token` sau khi login thành công.

---

## 🐛 Troubleshooting

### **Lỗi 1: "Restaurant not found"**
- **Nguyên nhân**: `restaurant_id` không tồn tại trong database
- **Giải pháp**: Kiểm tra `restaurant_id` trong form (hiện tại hardcode: "691938ab48990eb197f96549")

### **Lỗi 2: "Cannot manage dishes for another owner"**
- **Nguyên nhân**: Owner token không khớp với owner của restaurant
- **Giải pháp**: Đảm bảo đăng nhập với owner đúng nhà hàng

### **Lỗi 3: Form không hiển thị món**
- **Nguyên nhân**: Product service chưa chạy hoặc CORS error
- **Giải pháp**: 
  - Check service: `curl http://localhost:3003/api/dishes?restaurant_id=691938ab48990eb197f96549`
  - Check CORS config trong `services/product-service/src/index.js`

### **Lỗi 4: Image không hiển thị**
- **Nguyên nhân**: URL không hợp lệ hoặc CORS policy
- **Giải pháp**: Sử dụng URL hình ảnh public (VD: Imgur, Cloudinary)

---

## 📊 Database Query Examples

### **Tìm tất cả món của nhà hàng**
```javascript
db.dishes.find({ restaurant_id: ObjectId("691938ab48990eb197f96549") })
```

### **Tìm món theo tên (case-insensitive)**
```javascript
db.dishes.findOne({ 
  restaurant_id: ObjectId("691938ab48990eb197f96549"),
  name: { $regex: /^bun bo hue$/i }
})
```

### **Cập nhật trạng thái món**
```javascript
db.dishes.updateOne(
  { _id: ObjectId("691938c048990eb197f9654c") },
  { $set: { is_available: false } }
)
```

---

## 🎯 Next Steps

- [ ] Upload hình ảnh lên Cloudinary thay vì nhập URL
- [ ] Thêm category dropdown (Pizza, Pasta, Burger, ...)
- [ ] Bulk import món ăn từ CSV/Excel
- [ ] Duplicate món ăn (copy with new name)
- [ ] Thống kê món bán chạy nhất
- [ ] Tích hợp search/filter trong danh sách món

---

## 📚 Related Documentation

- [OWNER_ONBOARDING_COMPLETE.md](./OWNER_ONBOARDING_COMPLETE.md) - Quy trình đăng ký owner
- [FLOW_1_BRAND_MANAGER_README.md](./FLOW_1_BRAND_MANAGER_README.md) - Flow quản lý brand
- [ORDER_PROCESSING_API.md](./ORDER_PROCESSING_API.md) - API xử lý đơn hàng

---

✅ **Tính năng đã hoàn thành và sẵn sàng sử dụng!**
