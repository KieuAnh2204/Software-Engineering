# Quick Setup Guide - MongoDB Atlas Connection

## 🎯 Your MongoDB Atlas Connection String:

```
mongodb+srv://foodfast_delivery:<db_password>@cluster0.r3lhqwd.mongodb.net/
```

**Username:** `foodfast_delivery`  
**Cluster:** `cluster0.r3lhqwd.mongodb.net`  
**AppName:** `Cluster0`

---

## ⚡ Quick Start (3 bước):

### 1️⃣ Cập nhật `.env` files với password thật

Thay thế `<db_password>` bằng password thật của MongoDB Atlas user `foodfast_delivery`

#### **User Service** (`services/user-service/.env`):
```env
MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/user_service?retryWrites=true&w=majority&appName=Cluster0
```

#### **Product Service** (`services/product-service/.env`):
```env
MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/product_service?retryWrites=true&w=majority&appName=Cluster0
```

#### **Order Service** (`services/order-service/.env`):
```env
MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/order_service?retryWrites=true&w=majority&appName=Cluster0
```

#### **Payment Service** (`services/payment-service/.env`):
```env
MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/payment_service?retryWrites=true&w=majority&appName=Cluster0
```

---

### 2️⃣ Cập nhật `.env.docker` (cho Docker Compose)

Mở file `.env.docker` và thay `<db_password>` bằng password thật:

```env
USER_SERVICE_MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/user_service?retryWrites=true&w=majority&appName=Cluster0

PRODUCT_SERVICE_MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/product_service?retryWrites=true&w=majority&appName=Cluster0

ORDER_SERVICE_MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/order_service?retryWrites=true&w=majority&appName=Cluster0

PAYMENT_SERVICE_MONGODB_URI=mongodb+srv://foodfast_delivery:YOUR_REAL_PASSWORD@cluster0.r3lhqwd.mongodb.net/payment_service?retryWrites=true&w=majority&appName=Cluster0
```

---

### 3️⃣ Generate JWT Secret

Chạy lệnh này trong PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output và paste vào `JWT_SECRET` trong các file `.env` và `.env.docker`

---

## 🚀 Chạy Services

### Option 1: Chạy từng service riêng (Development)

```powershell
# User Service
cd services/user-service
npm install
npm run dev

# Product Service (terminal mới)
cd services/product-service
npm install
npm run dev

# Order Service (terminal mới)
cd services/order-service
npm install
npm run dev

# Payment Service (terminal mới)
cd services/payment-service
npm install
npm run dev
```

### Option 2: Chạy tất cả với Docker Compose (Recommended)

```powershell
# Copy environment file
Copy-Item .env.docker .env

# Build and run
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## ✅ Verify MongoDB Atlas Connection

### Check trong MongoDB Atlas Dashboard:

1. Truy cập: https://cloud.mongodb.com
2. Login với tài khoản của bạn
3. Vào **Database** → **Browse Collections**
4. Sau khi chạy services, sẽ thấy 4 databases:
   - `user_service`
   - `product_service`
   - `order_service`
   - `payment_service`

### Test API Endpoints:

```powershell
# Test User Service
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Test Product Service
Invoke-RestMethod -Uri "http://localhost:3003/health"

# Test Order Service
Invoke-RestMethod -Uri "http://localhost:3002/health"

# Test Payment Service
Invoke-RestMethod -Uri "http://localhost:3004/health"
```

---

## 🔐 Security Checklist

- [x] Connection string đã được cập nhật
- [ ] Password đã được thay thế (không dùng `<db_password>`)
- [ ] JWT Secret đã được generate
- [ ] File `.env` và `.env.docker` KHÔNG được commit lên Git
- [ ] Network Access trong MongoDB Atlas đã whitelist IP (0.0.0.0/0 cho dev)

---

## 🐛 Troubleshooting

### Lỗi: "MongoServerError: bad auth"
- ✅ Kiểm tra password có đúng không
- ✅ Password có ký tự đặc biệt? Cần URL encode (ví dụ: @ → %40, # → %23)

### Lỗi: "MongoNetworkError: connection timed out"
- ✅ Kiểm tra Network Access trong MongoDB Atlas
- ✅ Thêm IP address hoặc chọn "Allow from anywhere" (0.0.0.0/0)

### Lỗi: "Database name not found"
- ✅ Databases sẽ tự động được tạo khi service ghi data lần đầu
- ✅ Không cần tạo database trước

---

## 📚 Next Steps

1. ✅ Cập nhật password trong `.env` files
2. ✅ Generate JWT secret
3. ✅ Chạy services
4. ✅ Test API endpoints
5. ✅ Kiểm tra data trong MongoDB Atlas Dashboard

**Need help?** Check `DOCKER_MONGODB_SETUP.md` for detailed setup guide.
