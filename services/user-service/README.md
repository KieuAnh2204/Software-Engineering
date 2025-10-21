# User Service - FoodFast Delivery

Microservice quản lý người dùng, authentication và authorization.

## 🚀 Tính năng

- ✅ Đăng ký & Đăng nhập người dùng
- ✅ JWT Authentication
- ✅ Role-based Authorization (user, owner, admin)
- ✅ Quản lý profile người dùng
- ✅ Hash password với bcrypt
- ✅ Validation input

## 📦 Cài đặt

```bash
npm install
```

## ⚙️ Configuration

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Cập nhật các biến môi trường trong `.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/foodfast_users
JWT_SECRET=your_secret_key
```

## 🏃 Chạy Service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (Private)

### Users
- `GET /api/users` - Lấy danh sách users (Admin only)
- `GET /api/users/:id` - Lấy thông tin user theo ID (Private)
- `PUT /api/users/:id` - Cập nhật thông tin user (Private)
- `DELETE /api/users/:id` - Xóa user (Admin only)

### Health Check
- `GET /health` - Kiểm tra trạng thái service

## 🔒 Roles

- **user**: Người dùng thông thường (đặt hàng)
- **owner**: Chủ nhà hàng (quản lý menu, đơn hàng)
- **admin**: Quản trị viên (toàn quyền)

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: user/owner/admin),
  fullName: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  isActive: Boolean,
  restaurantId: ObjectId (ref: Restaurant),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- express-validator

## 📝 Testing

```bash
# Example: Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"123456"}'

# Example: Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```
