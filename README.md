# 🍔 FoodFast Delivery - Microservices Platform

> Hệ thống đặt đồ ăn trực tuyến với kiến trúc Microservices, MongoDB Atlas, Docker và React

## 📋 Mục Lục
- [Tổng Quan](#-tổng-quan)
- [Quick Start](#-quick-start)
- [Kiến Trúc Hệ Thống](#️-kiến-trúc-hệ-thống)
- [Backend Services](#-backend-services)
- [Frontend](#-frontend)
- [Database](#-database)
- [Authentication](#-authentication)
- [Documentation](#-documentation)
- [Testing](#-testing)

---

## 🎯 Tổng Quan

FoodFast Delivery là nền tảng đặt đồ ăn trực tuyến được xây dựng theo kiến trúc Microservices với các tính năng:

### ✨ Tính Năng Chính

**👥 Customer (Khách hàng):**
- Đăng ký/Đăng nhập với JWT authentication
- Tìm kiếm và xem menu nhà hàng
- Thêm món vào giỏ hàng
- Đặt hàng và thanh toán
- Theo dõi đơn hàng

**🏪 Restaurant Owner (Chủ nhà hàng):**
- Dashboard quản lý nhà hàng
- ✅ **CRUD món ăn** (Thêm/Sửa/Xóa món)
- Quản lý đơn hàng
- Cập nhật trạng thái món ăn (available/unavailable)
- Quản lý hình ảnh món ăn

**👨‍💼 Admin (Quản trị viên):**
- Dashboard tổng quan hệ thống
- Quản lý users (activate/deactivate, soft delete)
- Quản lý nhà hàng (verify, approve)
- Quản lý đơn hàng
- Xem activity logs và system logs

---

## 🚀 Quick Start

### 1️⃣ Backend Services (Docker)

```powershell
# Start all microservices
.\docker-manager.ps1 start

# Check status
.\docker-manager.ps1 status

# View logs
.\docker-manager.ps1 logs

# Stop all services
.\docker-manager.ps1 stop
```

**✅ Services Running:**
```bash
User Service:    http://localhost:3001 ✅
Order Service:   http://localhost:3002 ✅
Product Service: http://localhost:3003 ✅
Payment Service: http://localhost:3004 ✅
```

### 2️⃣ Frontend (React + Vite)

```powershell
# Navigate to frontend
cd frontend/Users

# Install dependencies (first time only)
npm install

# Start development server
$env:PORT="5173"
npm run dev
```

**✅ Frontend Running:**
```bash
Frontend:        http://localhost:5173 ✅
Owner Login:     http://localhost:5173/owner/login
Admin Login:     http://localhost:5173/admin/login
```

### 3️⃣ Quick Test

```powershell
# Test backend health
Invoke-RestMethod http://localhost:3001/health

# Test Product Service for restaurants
.\test-product-service.ps1

# Test authentication
# See CUSTOMER_AUTH_TESTING.md
```

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────┐
│         FRONTEND (React + TypeScript)           │
│              http://localhost:5173              │
├─────────────────────────────────────────────────┤
│  Customer UI  │  Restaurant Owner UI  │ Admin UI│
└─────────────────────────────────────────────────┘
                      │
                      │ REST APIs (JWT Auth)
                      ▼
┌─────────────────────────────────────────────────┐
│              MICROSERVICES (Docker)             │
├───────────┬───────────┬───────────┬─────────────┤
│   User    │  Product  │   Order   │   Payment   │
│  Service  │  Service  │  Service  │  Service    │
│  :3001    │  :3003    │  :3002    │   :3004     │
├───────────┼───────────┼───────────┼─────────────┤
│  MongoDB  │  MongoDB  │  MongoDB  │   MongoDB   │
│    DB     │    DB     │    DB     │     DB      │
└───────────┴───────────┴───────────┴─────────────┘
                      │
                      ▼
              MongoDB Atlas Cloud
           cluster0.r3lhqwd.mongodb.net
```

### 🔑 Design Patterns

- **Microservices Architecture**: 4 services độc lập
- **Database per Service**: Mỗi service có database riêng
- **JWT Authentication**: Stateless authentication
- **RESTful APIs**: Chuẩn REST cho tất cả endpoints
- **Docker Containerization**: Đóng gói services

---

## 🔧 Backend Services

### 1. User Service (Port 3001)

**Chức năng:**
- ✅ Authentication (Register/Login) với JWT
- ✅ Customer profile management
- ✅ Restaurant profile management
- ✅ Admin management (CRUD users, soft delete)
- ✅ Account security (login tracking, account locking)

**Endpoints:**
```bash
POST   /api/auth/register          # Đăng ký
POST   /api/auth/login             # Đăng nhập (returns JWT)
GET    /api/auth/profile           # Xem profile (JWT required)

# Admin endpoints (admin only)
GET    /api/admin/dashboard/stats  # Dashboard statistics
GET    /api/admin/users            # List all users
PUT    /api/admin/users/:id/status # Activate/deactivate user
DELETE /api/admin/users/:id        # Soft delete user
GET    /api/admin/restaurants      # List all restaurants
PUT    /api/admin/restaurants/:id/verify  # Verify restaurant
```

**Models:**
- User (with Customer/Restaurant/Admin profiles)

### 2. Product Service (Port 3003) ⭐ NEW

**Chức năng:**
- ✅ **Restaurant owners quản lý món ăn** (CRUD)
- ✅ Category management (Admin)
- ✅ Image management
- ✅ Public search and filtering
- ✅ Ownership validation (chỉ sửa món của mình)

**Endpoints:**

**Public (No Auth):**
```bash
GET    /api/products                    # List all products (filter, search, pagination)
GET    /api/products/search             # Advanced search
GET    /api/products/restaurant/:id     # Products by restaurant
GET    /api/products/:id                # Product detail
```

**Restaurant Only (JWT Required):**
```bash
POST   /api/products                    # Create product
GET    /api/products/my-products/list   # My products
PUT    /api/products/:id                # Update product (own only)
DELETE /api/products/:id                # Delete product (own only)
PATCH  /api/products/:id/availability   # Toggle available/unavailable
PUT    /api/products/:id/images         # Update product images
```

**Models:**
- Product (name, price, categoryId, restaurantId, images[], mainImage)
- Category (name, slug, description, displayOrder)
- Image (url, entityType, entityId, uploadedBy)

### 3. Order Service (Port 3002)

**Chức năng:**
- Cart management
- Order placement
- Order tracking
- Order history

**Endpoints:**
```bash
POST   /api/orders              # Create order
GET    /api/orders              # Get user orders
GET    /api/orders/:id          # Get order detail
PUT    /api/orders/:id/status   # Update order status
```

**Models:**
- Order
- Cart
- OrderItem

### 4. Payment Service (Port 3004)

**Chức năng:**
- Payment processing
- VNPay integration
- Payment verification
- Refund handling

**Endpoints:**
```bash
POST   /api/payments            # Process payment
GET    /api/payments/:id        # Payment status
POST   /api/payments/refund     # Refund payment
```

---

## 💻 Frontend

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Routing**: Wouter
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation

### Pages Structure

```
Frontend (http://localhost:5173)
├── / (Home)                          # Restaurant listing
├── /restaurant/:id                   # Restaurant detail + Menu
├── /cart                             # Shopping cart
├── /checkout                         # Checkout page
├── /login                            # Customer login
├── /profile                          # Customer profile
│
├── /owner/login                      # Restaurant owner login
├── /owner (Dashboard)                # Owner dashboard
│   ├── Overview                      # Stats, revenue
│   ├── Menu Management               # ⭐ CRUD món ăn
│   ├── Order Management              # Pending/Ready orders
│   └── Order History                 # Completed orders
│
└── /admin/login                      # Admin login
    └── /admin (Dashboard)            # Admin dashboard
        ├── Overview                  # System stats
        ├── User Management           # Manage users
        ├── Restaurant Management     # Manage restaurants
        ├── Order Management          # All orders
        └── Logs                      # Activity & system logs
```

### Components

**Shared:**
- Header, Hero, ThemeProvider, ThemeToggle
- MenuItemCard, RestaurantCard
- CartSheet, AddressConfirmationDialog
- OrderStatusStepper

**Owner:**
- OwnerDashboardOverview
- OwnerMenuManagement ⭐ (Add/Edit/Delete dishes)
- OwnerOrderManagement
- OwnerPendingOrders, OwnerReadyOrders

**Admin:**
- DashboardOverview
- UserManagement
- RestaurantManagement
- MenuManagement (all restaurants)
- OrderManagement
- ActivityLogs, SystemLogs

---

## 🗄️ Database

### MongoDB Atlas
- **Cluster**: `cluster0.r3lhqwd.mongodb.net`
- **User**: `foodfast_delivery`
- **Connection**: MongoDB Atlas (Cloud)

### Databases (4 separate DBs)

```javascript
// 1. user_service
{
  users: {
    role: "customer" | "restaurant" | "admin",
    customerProfile: {...},
    restaurantProfile: {...},
    isActive, isDeleted, loginAttempts, lockUntil
  }
}

// 2. product_service ⭐ UPDATED
{
  products: {
    name, description, price,
    categoryId (ref Category),
    restaurantId (ref User),
    images[] (ref Image),
    mainImage (ref Image),
    ingredients[], allergens[],
    spicyLevel, nutritionInfo,
    available, displayOrder
  },
  categories: {
    name, slug, description,
    isActive, displayOrder
  },
  images: {
    url, altText, entityType,
    entityId, uploadedBy
  }
}

// 3. order_service
{
  orders: {...},
  carts: {...}
}

// 4. payment_service
{
  payments: {...}
}
```

**Dashboard**: https://cloud.mongodb.com

---

## 🔐 Authentication

### JWT Token Structure

```javascript
{
  id: userId,
  role: "customer" | "restaurant" | "admin",
  email: userEmail,
  restaurantId: restaurantId  // For restaurant owners only
}
```

### Security Features

✅ **Password Hashing**: bcrypt (10 salt rounds)
✅ **JWT Expiry**: 7 days
✅ **Account Locking**: 5 failed attempts → 2 hours lock
✅ **Login Tracking**: lastLogin, loginAttempts
✅ **Soft Delete**: isDeleted flag instead of hard delete
✅ **Role-Based Access**: protect + restrictTo middleware

### Authentication Flow

```
1. Customer/Restaurant/Admin → POST /api/auth/register or /login
2. Backend validates credentials
3. Generate JWT token with user info (id, role, email, restaurantId)
4. Frontend stores token
5. All protected requests → Header: "Authorization: Bearer TOKEN"
6. Backend middleware verifies JWT → extract user info → allow/deny
```

---

## 📚 Documentation

### Setup Guides
- **[START_SERVICES_GUIDE.md](START_SERVICES_GUIDE.md)** - Hướng dẫn khởi động services
- **[DOCKER_MONGODB_SETUP.md](DOCKER_MONGODB_SETUP.md)** - Setup MongoDB Atlas
- **[MONGODB_ATLAS_QUICK_START.md](MONGODB_ATLAS_QUICK_START.md)** - Quick setup MongoDB

### API Documentation
- **[services/README.md](services/README.md)** - Backend APIs overview
- **[PRODUCT_SERVICE_GUIDE.md](PRODUCT_SERVICE_GUIDE.md)** ⭐ - Product Service chi tiết
- **[PRODUCT_SERVICE_IMPLEMENTATION.md](PRODUCT_SERVICE_IMPLEMENTATION.md)** - Implementation details

### Testing Guides
- **[CUSTOMER_AUTH_TESTING.md](CUSTOMER_AUTH_TESTING.md)** - Test authentication
- **[test-product-service.ps1](test-product-service.ps1)** - Test Product Service
- **[POSTMAN_TESTING_GUIDE.md](POSTMAN_TESTING_GUIDE.md)** - Postman collection
- **[POSTMAN_QUICK_START.md](POSTMAN_QUICK_START.md)** - Quick Postman setup

### Architecture & Design
- **[PRD_VS_SCHEMA_COMPARISON.md](PRD_VS_SCHEMA_COMPARISON.md)** - PRD vs Implementation
- **[AUTH_CHANGES_SUMMARY.md](AUTH_CHANGES_SUMMARY.md)** - Authentication improvements

---

## 🧪 Testing

### 1. Test Backend Services

```powershell
# Health check all services
Invoke-RestMethod http://localhost:3001/health  # User Service
Invoke-RestMethod http://localhost:3002/health  # Order Service
Invoke-RestMethod http://localhost:3003/health  # Product Service
Invoke-RestMethod http://localhost:3004/health  # Payment Service

# Test authentication
.\test-auth.ps1

# Test Product Service (Restaurant CRUD)
.\test-product-service.ps1
```

### 2. Test Frontend

**Open browser:**
```
Customer:         http://localhost:5173
Owner Login:      http://localhost:5173/owner/login
Admin Login:      http://localhost:5173/admin/login
```

**Test Accounts:**
```javascript
// Restaurant Owner
username: "owner1"
password: "password123"

// Admin
username: "admin"
password: "admin123"

// Customer (register new account)
email: "customer@test.com"
password: "password123"
```

### 3. Manual API Testing

**Postman Collection:**
- Import: `FoodFast_Delivery.postman_collection.json`
- See: [POSTMAN_TESTING_GUIDE.md](POSTMAN_TESTING_GUIDE.md)

**PowerShell Scripts:**
```powershell
# Register customer
$body = @{
    email = "test@customer.com"
    password = "password123"
    role = "customer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method Post -ContentType "application/json" -Body $body

# Login and get token
$loginBody = @{
    email = "test@customer.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBody

$token = $response.data.token

# Use token for protected endpoints
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" `
    -Method Get -Headers $headers
```

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Docker Desktop
- MongoDB Atlas account
- PowerShell (for scripts)

### Project Structure

```
Software-Engineering/
├── frontend/
│   └── Users/                    # React frontend
│       ├── src/
│       │   ├── components/       # UI components
│       │   ├── pages/            # Route pages
│       │   ├── contexts/         # Auth contexts
│       │   └── lib/              # Utils
│       └── server/               # Backend proxy
│
├── services/
│   ├── user-service/             # Port 3001
│   │   ├── src/
│   │   │   ├── models/           # User model
│   │   │   ├── controllers/      # Auth, Admin
│   │   │   ├── middleware/       # Auth middleware
│   │   │   └── routes/           # API routes
│   │   └── Dockerfile
│   │
│   ├── product-service/          # Port 3003 ⭐
│   │   ├── src/
│   │   │   ├── models/           # Product, Category, Image
│   │   │   ├── controllers/      # Product CRUD
│   │   │   ├── middleware/       # Auth, Ownership
│   │   │   └── routes/           # Public + Protected routes
│   │   └── Dockerfile
│   │
│   ├── order-service/            # Port 3002
│   └── payment-service/          # Port 3004
│
├── docker-compose.yml            # All services
├── docker-manager.ps1            # Management script
└── *.md                          # Documentation
```

### Environment Variables

**Backend Services (.env):**
```env
PORT=300X
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

**Frontend (.env):**
```env
PORT=5173
VITE_API_URL=http://localhost
```

---

## 🚧 Roadmap

### ✅ Completed
- [x] User Service with JWT authentication
- [x] Admin Dashboard backend (user/restaurant management)
- [x] Product Service with Restaurant CRUD
- [x] Category and Image models
- [x] Account security (locking, tracking)
- [x] Frontend UI (Customer, Owner, Admin)
- [x] Docker containerization

### 🔜 Next Steps
1. **Category Service** (Admin CRUD categories)
2. **Image Upload** (Restaurant upload dish images)
3. **Order Service** (Complete cart & checkout)
4. **Payment Integration** (VNPay)
5. **Real-time Notifications** (WebSocket)
6. **Unit Tests** (Jest + Supertest)

---

## 📞 Support

### Issues?

1. **Services not starting?**
   ```powershell
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

2. **Frontend not loading?**
   ```powershell
   cd frontend/Users
   npm install
   $env:PORT="5173"
   npm run dev
   ```

3. **MongoDB connection error?**
   - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
   - Verify connection string in `.env`

4. **Authentication not working?**
   - Check JWT_SECRET in all `.env` files
   - Ensure same secret across all services

### Documentation
- API Docs: `services/README.md`
- Product Service: `PRODUCT_SERVICE_GUIDE.md`
- Testing: `CUSTOMER_AUTH_TESTING.md`

---

## 👥 Contributors

- **Team**: Software Engineering
- **Project**: FoodFast Delivery
- **Date**: October 2025

---

## 📄 License

MIT License - Feel free to use for learning purposes

---

**🎉 Happy Coding! Enjoy your FoodFast Delivery platform! 🍕🍔🍜**
