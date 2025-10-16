# FoodFast Delivery - Docker + MongoDB Atlas Setup Guide

## 🗄️ MongoDB Atlas Setup

### Bước 1: Tạo MongoDB Atlas Account (Miễn phí)

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí (Free Tier - 512MB)
3. Tạo một Cluster mới:
   - Chọn **"Create a deployment"**
   - Chọn **"Free"** (M0 Sandbox)
   - Chọn region gần Việt Nam: **Singapore (ap-southeast-1)**
   - Đặt tên cluster: `foodfast-cluster`
   - Click **"Create Deployment"**

### Bước 2: Cấu hình Database Access

1. Vào **"Database Access"** (menu bên trái)
2. Click **"Add New Database User"**
3. Tạo user:
   - Username: `foodfast_admin`
   - Password: Tạo password mạnh (lưu lại để dùng sau)
   - Database User Privileges: **"Read and write to any database"**
4. Click **"Add User"**

### Bước 3: Cấu hình Network Access

1. Vào **"Network Access"** (menu bên trái)
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Hoặc chỉ thêm IP của bạn để bảo mật hơn
4. Click **"Confirm"**

### Bước 4: Lấy Connection String

1. Vào **"Database"** → Click **"Connect"** trên cluster
2. Chọn **"Connect your application"**
3. Chọn **Driver: Node.js**, **Version: 5.5 or later**
4. Copy connection string, format như sau:
   ```
   mongodb+srv://foodfast_admin:<password>@foodfast-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Thay `<password>`** bằng password thật của database user

### Bước 5: Tạo 4 Databases

1. Vào **"Browse Collections"**
2. Click **"Create Database"**
3. Tạo 4 databases:
   - `user_service`
   - `product_service`
   - `order_service`
   - `payment_service`

---

## 🐳 Docker Compose Setup

### Bước 1: Cập nhật `.env.docker`

Mở file `.env.docker` và cập nhật:

```env
# Replace with your MongoDB Atlas connection strings
USER_SERVICE_MONGODB_URI=mongodb+srv://foodfast_admin:YOUR_PASSWORD@foodfast-cluster.xxxxx.mongodb.net/user_service?retryWrites=true&w=majority

PRODUCT_SERVICE_MONGODB_URI=mongodb+srv://foodfast_admin:YOUR_PASSWORD@foodfast-cluster.xxxxx.mongodb.net/product_service?retryWrites=true&w=majority

ORDER_SERVICE_MONGODB_URI=mongodb+srv://foodfast_admin:YOUR_PASSWORD@foodfast-cluster.xxxxx.mongodb.net/order_service?retryWrites=true&w=majority

PAYMENT_SERVICE_MONGODB_URI=mongodb+srv://foodfast_admin:YOUR_PASSWORD@foodfast-cluster.xxxxx.mongodb.net/payment_service?retryWrites=true&w=majority

# Generate strong JWT secret
JWT_SECRET=your_generated_secret_here_minimum_32_characters

# Update CORS if needed
CORS_ORIGIN=http://localhost:5000,http://localhost:3000
```

### Bước 2: Generate JWT Secret

Chạy trong PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output và paste vào `JWT_SECRET` trong `.env.docker`

---

## 🚀 Chạy với Docker Compose

### Cài đặt Docker Desktop

1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Cài đặt và khởi động Docker Desktop
3. Đợi Docker Desktop chạy hoàn toàn

### Build và Run All Services

```powershell
# Copy environment variables
Copy-Item .env.docker .env

# Build images
docker-compose build

# Run all services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Kiểm tra status
docker-compose ps
```

### Các Lệnh Docker Compose Hữu Ích

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs của tất cả services
docker-compose logs -f

# View logs của 1 service cụ thể
docker-compose logs -f user-service

# Restart 1 service
docker-compose restart user-service

# Stop và xóa containers + volumes
docker-compose down -v

# Check service health
docker-compose ps
```

---

## 🔍 Kiểm tra Services đang chạy

### Health Check Endpoints

```powershell
# User Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3003/health

# Order Service
curl http://localhost:3002/health

# Payment Service
curl http://localhost:3004/health
```

### Test API với PowerShell

```powershell
# Test User Registration
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -ContentType "application/json" -Body '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test Get Products
Invoke-RestMethod -Uri "http://localhost:3003/api/products" -Method Get
```

---

## 📊 Monitoring

### Docker Desktop Dashboard

1. Mở Docker Desktop
2. Vào tab **"Containers"**
3. Xem status của từng container
4. Click vào container để xem logs real-time

### MongoDB Atlas Dashboard

1. Vào https://cloud.mongodb.com
2. Vào **"Database"** → **"Browse Collections"**
3. Xem data đã được tạo trong các collections

---

## 🐛 Troubleshooting

### Services không kết nối được MongoDB Atlas

```powershell
# Check environment variables
docker-compose config

# Check logs chi tiết
docker-compose logs user-service

# Verify connection string format
# mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database?options
```

### Container bị crash

```powershell
# Xem logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port đã được sử dụng

```powershell
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

---

## 📦 Project Structure

```
Software-Engineering/
├── docker-compose.yml              # Docker Compose configuration
├── .env.docker                     # Environment variables (DO NOT COMMIT)
├── .dockerignore                   # Files to ignore in Docker build
│
└── services/
    ├── user-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    ├── product-service/
    │   ├── Dockerfile
    │   └── ...
    ├── order-service/
    │   ├── Dockerfile
    │   └── ...
    └── payment-service/
        ├── Dockerfile
        └── ...
```

---

## ✅ Production Checklist

- [ ] MongoDB Atlas cluster đã được tạo
- [ ] Database users đã được cấu hình
- [ ] Network access đã được setup
- [ ] Connection strings đã được cập nhật trong `.env.docker`
- [ ] JWT secret đã được generate
- [ ] Docker Desktop đã được cài đặt và chạy
- [ ] All services build thành công
- [ ] Health checks đều return OK
- [ ] Test API calls thành công

---

## 🔐 Security Notes

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env.docker` lên Git
- Sử dụng strong passwords cho MongoDB Atlas
- Generate unique JWT secrets
- Trong production, hạn chế IP whitelist thay vì "Allow from anywhere"
- Enable MongoDB Atlas encryption at rest
- Regularly rotate JWT secrets and database passwords

---

## 📚 Resources

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- Docker Compose Documentation: https://docs.docker.com/compose/
- Node.js Docker Best Practices: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
