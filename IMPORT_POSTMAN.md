# 📮 Import Postman Collection - FoodFast Delivery

## 📥 Cách Import

### Bước 1: Mở Postman
- Khởi động ứng dụng Postman

### Bước 2: Import Collection
1. Click **"Import"** (góc trên bên trái)
2. Click tab **"File"**
3. Chọn file: **`FoodFast_Delivery.postman_collection.json`**
4. Click **"Import"**

### Bước 3: Setup Environment
1. Click **⚙️** → **Environments**
2. Create new environment: **"FoodFast Local"**
3. Add variable:
   - `base_url` = `http://localhost:3001`
   - `token` = (để trống)
4. Select environment "FoodFast Local"

---

## 🎯 Test ngay

### 1. Health Check
```
GET {{base_url}}/health
```

### 2. Register Customer
```
POST {{base_url}}/api/auth/register

Body:
{
  "username": "customer1",
  "email": "customer1@foodfast.com",
  "password": "customer123",
  "fullName": "Nguyễn Văn A",
  "phone": "+84901234567",
  "role": "customer",
  "customerProfile": {
    "address": {
      "street": "123 Lê Lợi",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "Hồ Chí Minh"
    }
  }
}
```

### 3. Register Restaurant
```
POST {{base_url}}/api/auth/register

Body:
{
  "username": "restaurant_pho24",
  "email": "pho24@restaurant.com",
  "password": "restaurant123",
  "fullName": "Phở 24 Manager",
  "phone": "+84902345678",
  "role": "restaurant",
  "restaurantProfile": {
    "restaurantName": "Phở 24",
    "description": "Phở truyền thống Việt Nam",
    "cuisineType": ["Vietnamese"],
    "address": {
      "street": "456 Nguyễn Huệ",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "Hồ Chí Minh"
    },
    "priceRange": "$$",
    "deliveryFee": 15000,
    "minOrderAmount": 50000
  }
}
```

### 4. Login & Get Token
```
POST {{base_url}}/api/auth/login

Body:
{
  "username": "customer1",
  "password": "customer123"
}
```
Copy token từ response!

### 5. Get All Restaurants
```
GET {{base_url}}/api/users/restaurants
```

### 6. Search Restaurants
```
GET {{base_url}}/api/users/restaurants/search?cuisine=Vietnamese
```

---

## ✅ Collection bao gồm:

- **User Service** (11 requests)
  - Health Check
  - Register Customer
  - Register Restaurant  
  - Login Customer/Restaurant
  - Get Profile
  - Update Profile
  - Get All Restaurants
  - Search Restaurants
  
- **Test Data** (3 requests)
  - Create more customers
  - Create more restaurants

---

## 🔐 Authentication

Token tự động lưu sau khi login/register.

Sử dụng: `Authorization: Bearer {{token}}`

---

**Chi tiết đầy đủ: Xem file `POSTMAN_COLLECTION.md`**
