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

# ✅ Docker Compose Setup Complete!

## 🎉 SUCCESS! All microservices are running!

### 📊 Current Status:

```
✅ User Service:    http://localhost:3001 - HEALTHY
✅ Product Service: http://localhost:3003 - HEALTHY  
✅ Order Service:   http://localhost:3002 - HEALTHY
✅ Payment Service: http://localhost:3004 - HEALTHY
```

### 🗄️ MongoDB Atlas:
- Connection: `cluster0.r3lhqwd.mongodb.net`
- Username: `foodfast_delivery`
- 4 Databases created automatically

---

## 🚀 Quick Commands

### Using docker-manager.ps1 Script:

```powershell
# Start all services
.\docker-manager.ps1 start

# Stop all services
.\docker-manager.ps1 stop

# Restart all services
.\docker-manager.ps1 restart

# Check status
.\docker-manager.ps1 status

# View logs
.\docker-manager.ps1 logs

# Rebuild services
.\docker-manager.ps1 build

# Clean everything
.\docker-manager.ps1 clean
```

### Using docker-compose directly:

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart specific service
docker-compose restart user-service
```

---

## 🧪 Test API Endpoints

### Health Checks:
```powershell
Invoke-RestMethod http://localhost:3001/health  # User Service
Invoke-RestMethod http://localhost:3002/health  # Order Service
Invoke-RestMethod http://localhost:3003/health  # Product Service
Invoke-RestMethod http://localhost:3004/health  # Payment Service
```

### User Service - Register:
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -ContentType "application/json" -Body $body
```

### User Service - Login:
```powershell
$body = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body $body
```

### Product Service - Get All Products:
```powershell
Invoke-RestMethod -Uri "http://localhost:3003/api/products"
```

### Create Product:
```powershell
$body = @{
    name = "Pizza Margherita"
    description = "Classic Italian pizza"
    price = 12.99
    category = "main"
    restaurantId = "507f1f77bcf86cd799439011"
    available = $true
    preparationTime = 20
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3003/api/products" -Method Post -ContentType "application/json" -Body $body
```

---

## 📊 MongoDB Atlas Dashboard

1. Visit: https://cloud.mongodb.com
2. Login to your account
3. Go to **Database** → **Browse Collections**
4. You should see 4 databases:
   - `user_service`
   - `product_service`
   - `order_service`
   - `payment_service`

---

## 🐛 Troubleshooting

### Service not responding?
```powershell
# Check logs
docker-compose logs user-service

# Restart specific service
docker-compose restart user-service
```

### MongoDB connection error?
- Check `.env.docker` has correct password
- Verify Network Access in MongoDB Atlas allows your IP (0.0.0.0/0)
- Check Database Access user has correct permissions

### Port already in use?
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Clean start everything:
```powershell
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📦 What's Running?

### Containers:
- `user-service` - Port 3001
- `product-service` - Port 3003
- `order-service` - Port 3002
- `payment-service` - Port 3004

### Network:
- `microservices-network` (bridge)

### Volumes:
- `user-service-data`
- `product-service-data`
- `order-service-data`
- `payment-service-data`

---

## 🔧 Environment Configuration

### MongoDB Atlas Connection:
```env
mongodb+srv://foodfast_delivery:foodfast_delivery@cluster0.r3lhqwd.mongodb.net/
```

### JWT Secret:
```env
2ff1011a2f5e65f72b80d9a0667a942b388bab6dc4637f681118a571b07b00474
```

---

## 📚 Next Steps

1. ✅ Test all API endpoints
2. ✅ Create sample data (products, users)
3. ✅ Test order creation flow
4. ✅ Test payment processing
5. ✅ Monitor logs with `docker-compose logs -f`
6. ✅ Check MongoDB Atlas for data

---

## 🎯 Architecture

```
┌─────────────────┐
│  Frontend       │
│  (Port 5000)    │
└────────┬────────┘
         │
         ├────────┐
         │        │
    ┌────▼─────┐  ├──────────┐
    │  User    │  │ Product  │
    │ Service  │  │ Service  │
    │ (3001)   │  │ (3003)   │
    └────┬─────┘  └────┬─────┘
         │             │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │   Order     │
         │  Service    │
         │   (3002)    │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Payment    │
         │  Service    │
         │   (3004)    │
         └─────────────┘
                │
         ┌──────▼──────┐
         │  MongoDB    │
         │   Atlas     │
         └─────────────┘
```

---

**🎊 Congratulations! Your microservices are now running with Docker Compose!**

For detailed documentation, see:
- `DOCKER_MONGODB_SETUP.md` - Full Docker setup guide
- `MONGODB_ATLAS_QUICK_START.md` - MongoDB Atlas setup
- `services/README.md` - API documentation
