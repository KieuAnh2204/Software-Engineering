# 🚀 Quick Start Guide - Frontend ↔ Backend Connection

## Bước 1: Khởi động User Service

```powershell
cd services\user-service
npm start
```

**Kiểm tra:** Mở http://localhost:3001/health  
Kết quả mong đợi: `{"status":"OK","service":"user-service"}`

---

## Bước 2: Khởi động Product Service

```powershell
cd services\product-service
npm start
```

**Kiểm tra:** Mở http://localhost:3003/health  
Kết quả mong đợi: `{"status":"OK","service":"product-service"}`

---

## Bước 3: Khởi động Frontend

```powershell
cd frontend\Users
npm run dev
```

**Mở trình duyệt:** http://localhost:5173

---

## Bước 4: Test Đăng Ký (Sign Up)

1. Vào: http://localhost:5173/login
2. Click tab **"Sign Up"**
3. Điền thông tin:
   - **Name:** `Test User`
   - **Email:** `test@example.com`
   - **Password:** `123456`
4. Click **"Sign Up"**

### ✅ Kết quả mong đợi:
- Hiển thị toast: **"Registration successful"**
- Redirect về trang chủ
- Mở **DevTools (F12)** → **Network tab**:
  - Method: `POST`
  - URL: `http://localhost:3001/api/auth/register/customer`
  - Status: `201 Created`
  - Response:
    ```json
    {
      "success": true,
      "message": "Registration successful",
      "user": {
        "_id": "...",
        "email": "test@example.com",
        "username": "test",
        "role": "customer"
      },
      "customer": {
        "_id": "...",
        "full_name": "Test User",
        "phone": "0000000000",
        "address": "N/A"
      },
      "token": "eyJhbGc..."
    }
    ```

### ✅ Kiểm tra MongoDB Atlas:
1. Mở MongoDB Atlas Dashboard
2. **Browse Collections**
3. Database: `user_service`
4. Collection: `users` → Tìm user với email `test@example.com`
5. Collection: `customers` → Tìm customer profile
6. **Lưu ý:** Password phải được hash (bắt đầu bằng `$2b$`)

---

## Bước 5: Test Đăng Nhập (Login)

1. Vào: http://localhost:5173/login
2. Click tab **"Login"**
3. Điền thông tin:
   - **Email:** `test@example.com` (hoặc email đã đăng ký)
   - **Password:** `123456`
4. Click **"Sign In"**

### ✅ Kết quả mong đợi:
- Hiển thị toast: **"Login successful"**
- Redirect về trang chủ
- **DevTools** → **Network tab**:
  - Method: `POST`
  - URL: `http://localhost:3001/api/auth/login/customer`
  - Status: `200 OK`
  - Response:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "user": { ... },
      "customer": { ... },
      "token": "eyJhbGc..."
    }
    ```

### ✅ Kiểm tra Token:
- **DevTools** → **Application** tab → **Local Storage** → `http://localhost:5173`
- Phải có key: `token` với value: `eyJhbGc...`

---

## Bước 6: Test API Test Page

1. Vào: http://localhost:5173/test-api
2. Click **"Test User Service Health"**
   - Kết quả: `{"status":"OK","service":"user-service"}`
3. Click **"Test Login Customer"**
   - Kết quả: User object + token
4. Click **"Test Get Restaurants"**
   - Kết quả: Danh sách nhà hàng

---

## ❌ Các Lỗi Thường Gặp

### 1. CORS Error
```
Access to XMLHttpRequest ... has been blocked by CORS policy
```

**Giải pháp:**
- Restart lại user-service và product-service
- Đảm bảo CORS đã được cấu hình đúng

### 2. Connection Refused
```
ERR_CONNECTION_REFUSED
```

**Giải pháp:**
- Kiểm tra service đã chạy chưa:
  - User service: http://localhost:3001/health
  - Product service: http://localhost:3003/health

### 3. Invalid email or password
```json
{"success": false, "message": "Invalid email or password"}
```

**Giải pháp:**
- Kiểm tra user đã tồn tại trong MongoDB Atlas
- Đảm bảo password đúng (mặc định: `123456`)
- Hoặc đăng ký user mới trước

### 4. MongoDB Connection Error
```
MongooseError: Could not connect to MongoDB
```

**Giải pháp:**
- Kiểm tra file `.env` trong `services/user-service/`
- Đảm bảo `MONGODB_URI` đúng
- Kiểm tra IP whitelist trên MongoDB Atlas (thêm `0.0.0.0/0` để cho phép tất cả IP)

---

## 📝 Checklist Kiểm Tra

### Backend
- [ ] User service chạy trên port 3001
- [ ] Product service chạy trên port 3003
- [ ] Health check endpoints hoạt động
- [ ] MongoDB Atlas kết nối thành công
- [ ] CORS cho phép requests từ localhost:5173

### Frontend
- [ ] Frontend chạy trên port 5173
- [ ] File `.env.local` tồn tại với đúng API URLs
- [ ] Không có CORS errors trong Console
- [ ] axios client gửi requests đúng URL

### Authentication Flow
- [ ] Có thể đăng ký user mới
- [ ] User được lưu vào MongoDB Atlas
- [ ] Password được hash (không phải plain text)
- [ ] Customer profile được tạo
- [ ] Có thể login với credentials đã đăng ký
- [ ] JWT token được lưu trong localStorage
- [ ] Token được gửi trong Authorization header

---

## 🎉 Hoàn Thành!

Nếu tất cả các bước trên đều thành công:
- ✅ Frontend đã kết nối với Backend
- ✅ Sign Up tạo user mới trong MongoDB Atlas
- ✅ Login xác thực và trả về JWT token
- ✅ REST API hoạt động đúng

**Bạn có thể bắt đầu phát triển thêm các tính năng khác!** 🚀
