# 🔐 Environment Configuration

## 📋 Overview

File `.env` trong folder này chứa **TẤT CẢ** biến môi trường cho cả 4 microservices:
- User Service (Port 3001)
- Product Service (Port 3003)
- Order Service (Port 3002)
- Payment Service (Port 3004)

## 🚀 Quick Setup

### 1. Tạo file `.env` từ template:

```bash
# Copy file example
cp .env.example .env
```

### 2. Cập nhật thông tin MongoDB Atlas:

Mở file `.env` và thay đổi:
```properties
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_CLUSTER=your_cluster_url
```

### 3. Cập nhật JWT Secret (Production):

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy kết quả vào `JWT_SECRET` trong file `.env`

### 4. Cập nhật Stripe Keys (nếu dùng Payment Service):

Lấy keys từ: https://stripe.com/docs/keys
```properties
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📁 Cấu trúc Environment Variables

### **Shared Config** (Dùng chung cho tất cả services)
- `NODE_ENV` - development/production
- `JWT_SECRET` - Secret key cho JWT token
- `JWT_EXPIRE` - Thời gian expire của token (7d)

### **User Service**
- `USER_SERVICE_PORT` - Port 3001
- `USER_SERVICE_MONGODB_URI` - MongoDB connection cho user_service database

### **Product Service**
- `PRODUCT_SERVICE_PORT` - Port 3003
- `PRODUCT_SERVICE_MONGODB_URI` - MongoDB connection cho product_service database

### **Order Service**
- `ORDER_SERVICE_PORT` - Port 3002
- `ORDER_SERVICE_MONGODB_URI` - MongoDB connection cho order_service database
- `USER_SERVICE_URL` - URL của User Service
- `PRODUCT_SERVICE_URL` - URL của Product Service
- `PAYMENT_SERVICE_URL` - URL của Payment Service

### **Payment Service**
- `PAYMENT_SERVICE_PORT` - Port 3004
- `PAYMENT_SERVICE_MONGODB_URI` - MongoDB connection cho payment_service database
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `ORDER_SERVICE_URL` - URL của Order Service

## 🔒 Security Notes

1. **KHÔNG BAO GIỜ** commit file `.env` lên Git
2. File `.env` đã được thêm vào `.gitignore`
3. Chỉ commit file `.env.example` (không chứa sensitive data)
4. Mỗi developer cần tạo file `.env` riêng từ `.env.example`
5. Production cần dùng JWT secret khác với development

## 🔄 Cập nhật Services

Khi thay đổi biến môi trường, cần restart services:

```bash
# Docker mode
docker-compose restart

# Development mode
# Restart từng service thủ công
```

## 📝 Checklist

- [ ] Copy `.env.example` thành `.env`
- [ ] Cập nhật MongoDB credentials
- [ ] Cập nhật JWT secret (production)
- [ ] Cập nhật Stripe keys (nếu cần)
- [ ] Verify file `.env` trong `.gitignore`
- [ ] Test all services

## ⚠️ Troubleshooting

### Services không kết nối được MongoDB
- Kiểm tra `MONGODB_URI` có đúng không
- Kiểm tra MongoDB Atlas network access
- Kiểm tra username/password

### JWT token không hoạt động
- Đảm bảo `JWT_SECRET` giống nhau cho tất cả services
- Kiểm tra `JWT_EXPIRE` format (7d, 24h, etc.)

### Services không giao tiếp được với nhau
- Kiểm tra các `*_SERVICE_URL` variables
- Đảm bảo port không bị conflict

## 📚 Related Documentation

- **MONGODB_ATLAS_QUICK_START.md** - Setup MongoDB Atlas
- **START_SERVICES_GUIDE.md** - Khởi động services
- **ENV_SETUP.md** - Chi tiết về environment variables
