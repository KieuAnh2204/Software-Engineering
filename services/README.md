# FoodFast Delivery - Microservices Backend

## 📁 Cấu trúc Microservices

```
services/
├── user-service/         # Port 3001 - Quản lý người dùng & xác thực
├── product-service/      # Port 3003 - Quản lý sản phẩm/món ăn
├── order-service/        # Port 3002 - Quản lý đơn hàng
└── payment-service/      # Port 3004 - Xử lý thanh toán
```

## 🚀 Cài đặt

### Cài đặt tất cả services:

```powershell
# Cài đặt User Service
cd services/user-service
npm install

# Cài đặt Product Service
cd ../product-service
npm install

# Cài đặt Order Service
cd ../order-service
npm install

# Cài đặt Payment Service
cd ../payment-service
npm install
```

### Cấu hình môi trường:

Mỗi service đã có file `.env` với cấu hình mặc định. Cần cài đặt MongoDB trước khi chạy.

## 🗄️ Cài đặt MongoDB

### Windows:

1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Cài đặt và chạy MongoDB
3. Hoặc dùng MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## ▶️ Chạy Services

### Chạy từng service riêng lẻ:

```powershell
# User Service (Port 3001)
cd services/user-service
npm run dev

# Product Service (Port 3003)
cd services/product-service
npm run dev

# Order Service (Port 3002)
cd services/order-service
npm run dev

# Payment Service (Port 3004)
cd services/payment-service
npm run dev
```

## 📡 API Endpoints

### User Service (http://localhost:3001)

- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/login` - Đăng nhập
- `GET /api/users/profile` - Lấy thông tin profile
- `PUT /api/users/profile` - Cập nhật profile

### Product Service (http://localhost:3003)

- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới (Owner)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Owner)
- `DELETE /api/products/:id` - Xóa sản phẩm (Owner)
- `GET /api/products/restaurant/:restaurantId` - Lấy sản phẩm theo nhà hàng

### Order Service (http://localhost:3002)

- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng
- `PUT /api/orders/:id/cancel` - Hủy đơn hàng
- `GET /api/orders/user/:userId` - Lấy đơn hàng của user
- `GET /api/orders/restaurant/:restaurantId` - Lấy đơn hàng của nhà hàng

### Payment Service (http://localhost:3004)

- `POST /api/payments/create-intent` - Tạo payment intent
- `POST /api/payments/:id/confirm` - Xác nhận thanh toán
- `GET /api/payments/:id` - Lấy thông tin thanh toán
- `GET /api/payments/order/:orderId` - Lấy thanh toán theo đơn hàng
- `POST /api/payments/:id/refund` - Hoàn tiền
- `GET /api/payments/user/:userId` - Lấy lịch sử thanh toán

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT
- **Payment**: Stripe
- **Security**: Helmet, CORS
- **Validation**: Joi

## 📝 Ghi chú

- Tất cả services cần MongoDB đang chạy
- Payment Service cần Stripe API keys để xử lý thanh toán thực
- Mỗi service có database riêng trong MongoDB
- Services giao tiếp với nhau qua HTTP REST API
