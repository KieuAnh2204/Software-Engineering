# 🚀 Hướng dẫn khởi động Services

## 📋 Tổng quan

Project có 4 microservices:
- 🔐 **User Service** (Port 3001)
- 🍔 **Product Service** (Port 3003)
- 📦 **Order Service** (Port 3002)
- 💰 **Payment Service** (Port 3004)

---

## ⚡ CÁCH NHANH NHẤT (KHUYẾN NGHỊ) ⭐

### Sử dụng Docker Manager Script:

```powershell
.\docker-manager.ps1
```

Sau đó chọn:
- **Lần đầu tiên**: Chọn `1` (Build) → `2` (Start)
- **Các lần sau**: Chọn `2` (Start)

---

## 🐳 CÁCH 1: Docker Compose (Production Mode)

### ✅ Khởi động tất cả services

#### Lần đầu tiên (Build + Start):
```powershell
docker-compose up -d --build
```

#### Các lần sau (chỉ Start):
```powershell
docker-compose up -d
```

### 🔍 Kiểm tra trạng thái:
```powershell
docker-compose ps
```

**Kết quả mong đợi:**
```
NAME              STATUS        PORTS
user-service      Up (healthy)  0.0.0.0:3001->3001/tcp
product-service   Up (healthy)  0.0.0.0:3003->3003/tcp
order-service     Up (healthy)  0.0.0.0:3002->3002/tcp
payment-service   Up (healthy)  0.0.0.0:3004->3004/tcp
```

### 📋 Xem logs:
```powershell
# Tất cả services
docker-compose logs -f

# Chỉ 1 service cụ thể
docker-compose logs -f user-service
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f payment-service
```

### 🛑 Dừng services:
```powershell
# Dừng nhưng giữ containers
docker-compose stop

# Dừng và xóa containers
docker-compose down
```

### 🔄 Restart services:
```powershell
# Restart tất cả
docker-compose restart

# Restart 1 service cụ thể
docker-compose restart user-service
```

---

## 💻 CÁCH 2: Development Mode (Chạy trực tiếp với Node.js)

### Yêu cầu:
- Node.js đã cài đặt
- File `.env` trong mỗi service folder

### Khởi động từng service:

#### 1️⃣ User Service:
```powershell
cd services\user-service
npm install
npm run dev
```
Chạy ở: `http://localhost:3001`

#### 2️⃣ Product Service:
```powershell
# Mở terminal mới
cd services\product-service
npm install
npm run dev
```
Chạy ở: `http://localhost:3003`

#### 3️⃣ Order Service:
```powershell
# Mở terminal mới
cd services\order-service
npm install
npm run dev
```
Chạy ở: `http://localhost:3002`

#### 4️⃣ Payment Service:
```powershell
# Mở terminal mới
cd services\payment-service
npm install
npm run dev
```
Chạy ở: `http://localhost:3004`

### ⚠️ Lưu ý Development Mode:
- Cần mở 4 terminal riêng biệt
- Mỗi terminal chạy 1 service
- Tốn nhiều tài nguyên hơn Docker
- Thích hợp cho debug và development
- Cần file `.env` trong mỗi service folder

---

## 🎯 So sánh các cách

| Cách | Ưu điểm | Nhược điểm | Khi nào dùng |
|------|---------|------------|--------------|
| **Docker Compose** | ✅ Nhanh<br>✅ Dễ quản lý<br>✅ Giống production<br>✅ 1 lệnh chạy tất cả | ❌ Cần Docker installed<br>❌ Khó debug | Production, Testing, Demo |
| **Development Mode** | ✅ Dễ debug<br>✅ Hot reload<br>✅ Xem logs rõ ràng | ❌ Cần 4 terminals<br>❌ Tốn RAM<br>❌ Setup phức tạp | Development, Debugging |
| **Docker Manager Script** | ✅ Rất dễ dùng<br>✅ Menu trực quan<br>✅ Tất cả lệnh trong 1 | ❌ Chỉ cho Windows PowerShell | Quản lý hàng ngày |

---

## 📊 Kiểm tra Services đã chạy

### Test Health Check:

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

**Hoặc dùng PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3001/health
Invoke-RestMethod -Uri http://localhost:3003/health
Invoke-RestMethod -Uri http://localhost:3002/health
Invoke-RestMethod -Uri http://localhost:3004/health
```

**Kết quả mong đợi mỗi service:**
```json
{
  "status": "OK",
  "service": "user-service",
  "timestamp": "2025-10-18T..."
}
```

---

## 🔧 Các lệnh Docker Compose hữu ích

### Build lại services:
```powershell
# Build tất cả
docker-compose build

# Build 1 service cụ thể
docker-compose build user-service

# Build không dùng cache
docker-compose build --no-cache
```

### Start/Stop services:
```powershell
# Start 1 service cụ thể
docker-compose up -d user-service

# Stop 1 service cụ thể
docker-compose stop user-service

# Remove 1 service
docker-compose rm -f user-service
```

### Xem logs:
```powershell
# Logs tất cả services (follow)
docker-compose logs -f

# Logs 1 service (follow)
docker-compose logs -f user-service

# Logs 100 dòng cuối
docker-compose logs --tail=100

# Logs có timestamp
docker-compose logs -t
```

### Kiểm tra resources:
```powershell
# Xem CPU, RAM usage
docker stats

# Xem networks
docker network ls

# Xem images
docker images

# Xem volumes
docker volume ls
```

---

## 🛠️ Troubleshooting

### ❌ Lỗi: "Port already in use"

**Nguyên nhân:** Port đã được dùng bởi process khác

**Giải pháp:**
```powershell
# Tìm process đang dùng port 3001
netstat -ano | findstr :3001

# Kill process (thay <PID> bằng số từ lệnh trên)
taskkill /PID <PID> /F

# Hoặc dừng tất cả Docker containers
docker-compose down
```

---

### ❌ Lỗi: "Cannot connect to MongoDB"

**Giải pháp:**
```powershell
# 1. Check file .env.docker có MongoDB URI đúng không
cat .env.docker

# 2. Restart service
docker-compose restart user-service

# 3. Xem logs để debug
docker-compose logs user-service
```

---

### ❌ Lỗi: "Docker not found"

**Cài Docker Desktop:**
1. Download: https://www.docker.com/products/docker-desktop
2. Install và khởi động Docker Desktop
3. Verify: `docker --version`

---

### ❌ Services không healthy

**Giải pháp:**
```powershell
# 1. Xem logs
docker-compose logs user-service

# 2. Kiểm tra MongoDB connection
# 3. Restart service
docker-compose restart user-service

# 4. Rebuild nếu cần
docker-compose build user-service
docker-compose up -d user-service
```

---

## 📝 Workflow khuyến nghị

### Lần đầu tiên setup:
```powershell
# Bước 1: Build images
docker-compose build

# Bước 2: Start services
docker-compose up -d

# Bước 3: Kiểm tra status
docker-compose ps

# Bước 4: Xem logs
docker-compose logs -f

# Bước 5: Test health checks
Invoke-RestMethod -Uri http://localhost:3001/health
Invoke-RestMethod -Uri http://localhost:3003/health
Invoke-RestMethod -Uri http://localhost:3002/health
Invoke-RestMethod -Uri http://localhost:3004/health
```

### Hàng ngày:
```powershell
# Start
docker-compose up -d

# ... làm việc ...

# Stop khi xong
docker-compose down
```

### Khi có thay đổi code:
```powershell
# Rebuild service đã thay đổi
docker-compose build user-service

# Restart service
docker-compose up -d user-service

# Xem logs
docker-compose logs -f user-service
```

---

## 🎯 Quick Commands Cheatsheet

```powershell
# ========== START ==========
docker-compose up -d                    # Start tất cả
docker-compose up -d user-service       # Start 1 service

# ========== STOP ==========
docker-compose down                     # Stop và xóa containers
docker-compose stop                     # Stop giữ containers

# ========== RESTART ==========
docker-compose restart                  # Restart tất cả
docker-compose restart user-service     # Restart 1 service

# ========== BUILD ==========
docker-compose build                    # Build tất cả
docker-compose build --no-cache         # Build không cache
docker-compose up -d --build            # Build + Start

# ========== LOGS ==========
docker-compose logs -f                  # Logs tất cả (follow)
docker-compose logs -f user-service     # Logs 1 service
docker-compose logs --tail=100          # 100 dòng cuối

# ========== STATUS ==========
docker-compose ps                       # Status containers
docker stats                            # CPU/RAM usage

# ========== CLEAN ==========
docker-compose down -v                  # Xóa + volumes
docker system prune -a                  # Clean all unused
```

---

## 📚 Tài liệu liên quan

- **DOCKER_SUCCESS.md** - Chi tiết về Docker setup
- **POSTMAN_QUICK_START.md** - Test API endpoints
- **MONGODB_VSCODE_SETUP.md** - Kết nối MongoDB
- **docker-manager.ps1** - Management script

---

## ✅ Checklist khởi động thành công

- [ ] Docker Desktop đang chạy
- [ ] File `.env.docker` có MongoDB URI
- [ ] Chạy `docker-compose up -d`
- [ ] Tất cả 4 containers status "Up (healthy)"
- [ ] Health check trả về "OK" cho 4 services
- [ ] MongoDB Atlas connected (xem logs)
- [ ] Có thể test API với Postman

---

## 🎊 DONE!

**Services đã sẵn sàng khi:**
```
✅ User Service:    http://localhost:3001
✅ Product Service: http://localhost:3003
✅ Order Service:   http://localhost:3002
✅ Payment Service: http://localhost:3004
```

**Bắt đầu test với Postman ngay! 🚀**

Xem: **POSTMAN_QUICK_START.md**

# ⚡ QUICK START - Khởi động Services

## 🎯 CÁCH NHANH NHẤT

### Lần đầu tiên:
```powershell
docker-compose up -d --build
```

### Các lần sau:
```powershell
docker-compose up -d
```

### Kiểm tra:
```powershell
docker-compose ps
```

### Dừng:
```powershell
docker-compose down
```

---

## 📋 Hoặc dùng Docker Manager:

```powershell
.\docker-manager.ps1
```

Chọn số `2` để Start services

---

## ✅ Test Services đã chạy:

```powershell
# PowerShell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod http://localhost:3003/health
Invoke-RestMethod http://localhost:3002/health
Invoke-RestMethod http://localhost:3004/health
```

---

## 🔧 Các lệnh thường dùng:

```powershell
# Xem logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild 1 service
docker-compose build user-service
docker-compose up -d user-service

# Xem status
docker-compose ps
```

---

**Chi tiết đầy đủ: Xem file `START_SERVICES_GUIDE.md`**
