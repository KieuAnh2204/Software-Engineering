# 🎉 POSTMAN TESTING - All Working!

## Để import vào PostMan

## ✅ User Service Status: READY

```
🟢 Service: http://localhost:3001 - Running
🟢 MongoDB: Connected to Atlas
🟢 Health Check: OK
🟢 Register: Working ✓
🟢 Login: Working ✓ (username or email)
🟢 Get Profile: Working ✓
🟢 Update Profile: Ready to test
```

---

## 📋 Postman Collection Import

### Quick Setup (Copy-Paste to Postman):

```json
{
  "info": {
    "name": "FoodFast Delivery - User Service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["health"]
        }
      }
    },
    {
      "name": "2. Register User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"john_doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\",\n  \"fullName\": \"John Doe\",\n  \"phone\": \"+84901234567\"\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "auth", "register"]
        }
      }
    },
    {
      "name": "3. Login (Username)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"postman_test\",\n  \"password\": \"test123456\"\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "4. Login (Email)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"postman@example.com\",\n  \"password\": \"test123456\"\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "5. Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_TOKEN_HERE",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://localhost:3001/api/auth/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "auth", "profile"]
        }
      }
    }
  ]
}
```

---

## 🎯 API Endpoints (All Tested ✓)

### 1. Health Check ✅
```
GET http://localhost:3001/health
```
**Response:**
```json
{
  "status": "OK",
  "service": "user-service",
  "timestamp": "2025-10-16T..."
}
```

---

### 2. Register User ✅
```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+84901234567"
}
```

---

### 3. Login (Username or Email) ✅
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

// Option 1: Username
{
  "username": "postman_test",
  "password": "test123456"
}

// Option 2: Email
{
  "email": "postman@example.com",
  "password": "test123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "username": "postman_test",
      "email": "postman@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Get Profile (Requires Token) ✅
```
GET http://localhost:3001/api/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68f06a19e89e0e59a976af02",
    "username": "postman_test",
    "email": "postman@example.com",
    "fullName": "Postman Test User",
    "role": "user",
    "phone": "+84901234567"
  }
}
```

---

## 🔐 How to Use Bearer Token in Postman

### Method 1: Authorization Tab (Recommended)
1. Click on request (e.g., "Get Profile")
2. Go to **"Authorization"** tab
3. Type: Select **"Bearer Token"**
4. Token: Paste JWT token from login response

### Method 2: Headers Tab
1. Go to **"Headers"** tab
2. Add header:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🧪 Test Flow

### Complete Testing Sequence:

```
Step 1: Health Check
  ↓
Step 2: Register new user
  ↓
Step 3: Login (get token)
  ↓
Step 4: Get Profile (use token)
  ↓
Step 5: Update Profile (use token)
```

---

## 📊 Test Data

### Existing Test User (Already Created):
```json
{
  "username": "postman_test",
  "email": "postman@example.com",
  "password": "test123456"
}
```

### Create More Test Users:
```json
// User 1
{
  "username": "alice",
  "email": "alice@foodfast.com",
  "password": "alice123",
  "fullName": "Alice Johnson",
  "phone": "+84901111111"
}

// User 2
{
  "username": "bob_smith",
  "email": "bob@foodfast.com",
  "password": "bob123456",
  "fullName": "Bob Smith",
  "phone": "+84902222222"
}

// Restaurant Owner
{
  "username": "restaurant_owner",
  "email": "owner@restaurant.com",
  "password": "owner123",
  "fullName": "Restaurant Owner",
  "phone": "+84903333333",
  "role": "owner"
}
```

---

## ✅ Verification Results

### PowerShell Test Results:
```
✅ Login Successful
   User: postman_test
   Email: postman@example.com
   Role: user
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Get Profile Successful
   User ID: 68f06a19e89e0e59a976af02
   Username: postman_test
   Email: postman@example.com
   Full Name: Postman Test User
   Role: user
```

---

## 🎯 Import to Postman

### Steps:

1. **Open Postman**
2. Click **"Import"** (top left)
3. Select **"Raw text"** tab
4. Copy the JSON collection above
5. Paste and click **"Import"**
6. Collection "FoodFast Delivery - User Service" will appear in left sidebar

---

## 📝 Notes

### Correct Endpoints:
- ✅ `/api/auth/register` - Register
- ✅ `/api/auth/login` - Login
- ✅ `/api/auth/profile` - Get profile (with token)
- ❌ `/api/users/profile` - NOT USED

### Token Expiration:
- JWT token expires in **7 days**
- After expiration, login again to get new token

### Login Options:
- Can login with `username` OR `email`
- Password is always required

---

## 🚀 Quick Test Commands (PowerShell)

### Test Login:
```powershell
$body = @{
    username = "postman_test"
    password = "test123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.data.token
Write-Host "Token: $token"
```

### Test Get Profile:
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" `
    -Method Get `
    -Headers $headers
```

---

## 📚 Documentation Files

- **POSTMAN_QUICK_START.md** - This file (quick reference)
- **POSTMAN_TESTING_GUIDE.md** - Complete testing guide
- **DOCKER_SUCCESS.md** - Docker setup and all services
- **services/README.md** - Full API documentation

---

## 🎊 Success!

**All User Service endpoints are working and ready for Postman testing!**

Start testing now:
1. Import collection to Postman
2. Test Health Check
3. Login and get token
4. Test protected endpoints with token

Need help? Check `POSTMAN_TESTING_GUIDE.md` for detailed instructions.

# 🍃 Kết nối MongoDB Atlas với VS Code

## ✅ Extension đã cài đặt: MongoDB for VS Code

---

## 🔗 Connection String

### Your MongoDB Atlas Connection String:
```
mongodb+srv://foodfast_delivery:foodfast_delivery@cluster0.r3lhqwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Credentials:
- **Username**: `foodfast_delivery`
- **Password**: `foodfast_delivery`
- **Cluster**: `cluster0.r3lhqwd.mongodb.net`

---

## 📋 Hướng dẫn kết nối từng bước

### Cách 1: Kết nối nhanh (Recommended)

1. **Mở MongoDB Extension**
   - Click icon **MongoDB** ở Activity Bar (thanh bên trái)
   - Hoặc nhấn `Ctrl+Shift+P` → gõ `MongoDB: Open Overview`

2. **Add Connection**
   - Click nút **"Add Connection"** 
   - Hoặc click icon **"+"** ở panel MongoDB

3. **Paste Connection String**
   ```
   mongodb+srv://foodfast_delivery:foodfast_delivery@cluster0.r3lhqwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   - Paste vào ô **"Connection String"**
   - Click **"Connect"**

4. **Thành công!**
   - Bạn sẽ thấy:
     ```
     📁 Cluster0
       📁 admin
       📁 foodfast_order_db
       📁 foodfast_payment_db
       📁 foodfast_product_db
       📁 foodfast_user_db
       📁 local
     ```

---

### Cách 2: Kết nối thủ công (Advanced)

1. **Mở MongoDB Extension**
   - Click icon MongoDB ở Activity Bar

2. **Click "Add Connection"**

3. **Chọn "Advanced Connection Settings"**

4. **Điền thông tin:**
   - **Connection String Scheme**: `mongodb+srv://`
   - **Host**: `cluster0.r3lhqwd.mongodb.net`
   - **Authentication**: Username/Password
   - **Username**: `foodfast_delivery`
   - **Password**: `foodfast_delivery`
   - **Authentication Database**: `admin` (default)
   - **Default Database**: (leave empty or choose one)

5. **Click "Connect"**

---

## 🎯 Sau khi kết nối thành công

### Bạn có thể:

✅ **Xem databases và collections**
   - Expand Cluster0 → Expand database → Xem collections

✅ **Query dữ liệu**
   - Right-click collection → "View Documents"
   - Hoặc tạo file `.mongodb` để viết queries

✅ **Tạo Playground**
   - `Ctrl+Shift+P` → `MongoDB: Create MongoDB Playground`
   - Viết MongoDB queries với IntelliSense

✅ **Export/Import data**
   - Right-click collection → Export/Import

---

## 📊 Databases trong project của bạn

### 1. foodfast_user_db
```
Collections:
- users (Customers, Restaurants & Admin profiles)
  * Customers: role='customer' with customerProfile
  * Restaurants: role='restaurant' with restaurantProfile
  * Admins: role='admin'
```

### 2. foodfast_product_db
```
Collections:
- products (Menu items linked to restaurants)
```

### 3. foodfast_order_db
```
Collections:
- orders (Order information)
```

### 4. foodfast_payment_db
```
Collections:
- payments (Payment transactions)
```

---

## 🧪 Test Query với MongoDB Playground

### Tạo Playground file:
1. `Ctrl+Shift+P` → `MongoDB: Create MongoDB Playground`
2. Chọn database: `foodfast_user_db`

### Example Queries:

```javascript
// Switch to database
use('foodfast_user_db');

// Find all users
db.users.find({});

// Find all customers
db.users.find({ role: 'customer' });

// Find all restaurants
db.users.find({ role: 'restaurant' });

// Find restaurant by name
db.users.findOne({ 
  role: 'restaurant',
  'restaurantProfile.restaurantName': 'Phở 24'
});

// Count users by role
db.users.countDocuments({ role: 'customer' });
db.users.countDocuments({ role: 'restaurant' });

// Find restaurants in specific city
db.users.find({ 
  role: 'restaurant',
  'restaurantProfile.address.city': 'Hồ Chí Minh'
});

// Find restaurants by cuisine type
db.users.find({
  role: 'restaurant',
  'restaurantProfile.cuisineType': 'Vietnamese'
});

// Find restaurants accepting orders
db.users.find({
  role: 'restaurant',
  'restaurantProfile.isAcceptingOrders': true
});
```

### Run Query:
- Click **"Play"** button (▶) ở góc phải trên
- Hoặc nhấn `Ctrl+Alt+R`

---

## 🔍 View Your Test Data

### Query to see a customer:
```javascript
use('foodfast_user_db');

db.users.findOne({ username: 'customer1' });
```

**Expected Result (Customer):**
```json
{
  "_id": ObjectId("..."),
  "username": "customer1",
  "email": "customer1@foodfast.com",
  "fullName": "Nguyễn Văn A",
  "phone": "+84901234567",
  "password": "$2a$10$...",
  "role": "customer",
  "isActive": true,
  "customerProfile": {
    "address": {
      "street": "123 Lê Lợi",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "Hồ Chí Minh"
    },
    "favoriteRestaurants": [],
    "orderHistory": []
  },
  "createdAt": "2025-10-18T...",
  "updatedAt": "2025-10-18T..."
}
```

### Query to see a restaurant:
```javascript
use('foodfast_user_db');

db.users.findOne({ username: 'restaurant_pho24' });
```

**Expected Result (Restaurant):**
```json
{
  "_id": ObjectId("..."),
  "username": "restaurant_pho24",
  "email": "pho24@restaurant.com",
  "fullName": "Phở 24 Manager",
  "phone": "+84902345678",
  "password": "$2a$10$...",
  "role": "restaurant",
  "isActive": true,
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
    "openingHours": {
      "monday": { "open": "06:00", "close": "22:00", "isClosed": false },
      // ... other days
    },
    "rating": {
      "average": 0,
      "count": 0
    },
    "priceRange": "$$",
    "isVerified": false,
    "isAcceptingOrders": true,
    "deliveryFee": 15000,
    "minOrderAmount": 50000,
    "images": [],
    "logo": ""
  },
  "createdAt": "2025-10-18T...",
  "updatedAt": "2025-10-18T..."
}
```

---

## 🎨 Useful MongoDB Queries

### User Service Queries:

```javascript
use('foodfast_user_db');

// 1. Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
]);

// 2. Find recently registered users
db.users.find({}).sort({ createdAt: -1 }).limit(5);

// 3. Find active customers
db.users.find({ 
  role: 'customer',
  isActive: true 
});

// 4. Find restaurants accepting orders
db.users.find({
  role: 'restaurant',
  'restaurantProfile.isAcceptingOrders': true
});

// 5. Update customer address
db.users.updateOne(
  { username: 'customer1' },
  { 
    $set: { 
      'customerProfile.address.street': '789 Hai Bà Trưng',
      'customerProfile.address.city': 'Hồ Chí Minh'
    } 
  }
);

// 6. Update restaurant info
db.users.updateOne(
  { username: 'restaurant_pho24' },
  { 
    $set: { 
      'restaurantProfile.deliveryFee': 20000,
      'restaurantProfile.minOrderAmount': 80000
    } 
  }
);

// 7. Find restaurants by cuisine and city
db.users.find({
  role: 'restaurant',
  'restaurantProfile.cuisineType': 'Vietnamese',
  'restaurantProfile.address.city': 'Hồ Chí Minh'
});

// 8. Find restaurants with rating >= 4.0
db.users.find({
  role: 'restaurant',
  'restaurantProfile.rating.average': { $gte: 4.0 }
});

// 9. Find customers with orders history
db.users.find({
  role: 'customer',
  'customerProfile.orderHistory': { $ne: [] }
});

// 10. Count restaurants by cuisine type
db.users.aggregate([
  { $match: { role: 'restaurant' } },
  { $unwind: '$restaurantProfile.cuisineType' },
  { 
    $group: { 
      _id: '$restaurantProfile.cuisineType', 
      count: { $sum: 1 } 
    } 
  },
  { $sort: { count: -1 } }
]);

// 11. Find restaurants in District 1, Ho Chi Minh City
db.users.find({
  role: 'restaurant',
  'restaurantProfile.address.district': 'Quận 1',
  'restaurantProfile.address.city': 'Hồ Chí Minh'
});

// 12. Update restaurant to stop accepting orders
db.users.updateOne(
  { username: 'restaurant_pho24' },
  { 
    $set: { 
      'restaurantProfile.isAcceptingOrders': false 
    } 
  }
);

// 13. Add favorite restaurant for customer
db.users.updateOne(
  { username: 'customer1' },
  { 
    $push: { 
      'customerProfile.favoriteRestaurants': ObjectId('restaurant_id_here')
    } 
  }
);

// 14. Find all verified restaurants
db.users.find({
  role: 'restaurant',
  'restaurantProfile.isVerified': true
});

// 15. Search restaurants by name (case-insensitive)
db.users.find({
  role: 'restaurant',
  'restaurantProfile.restaurantName': { 
    $regex: 'phở', 
    $options: 'i' 
  }
});
```

### Product Service Queries:

```javascript
use('foodfast_product_db');

// View all products
db.products.find({});

// Find products by restaurant
db.products.find({ restaurantId: 'restaurant_id_here' });

// Find available products
db.products.find({ isAvailable: true });

// Products in price range
db.products.find({ 
  price: { $gte: 50000, $lte: 200000 } 
});
```

### Order Service Queries:

```javascript
use('foodfast_order_db');

// View all orders
db.orders.find({});

// Find orders by user
db.orders.find({ userId: 'user_id_here' });

// Find orders by status
db.orders.find({ status: 'pending' });

// Count orders by status
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

### Payment Service Queries:

```javascript
use('foodfast_payment_db');

// View all payments
db.payments.find({});

// Find successful payments
db.payments.find({ status: 'completed' });

// Total revenue
db.payments.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
]);
```

---

## 🛠️ MongoDB Extension Features

### 1. **IntelliSense**
   - Auto-complete database names
   - Auto-complete collection names
   - Auto-complete field names

### 2. **Syntax Highlighting**
   - MongoDB queries highlighted
   - JSON formatting

### 3. **Export Results**
   - Export to JSON
   - Export to CSV

### 4. **Connection Management**
   - Save multiple connections
   - Switch between connections
   - Connection favorites

### 5. **Debugging**
   - View query execution time
   - View query results
   - Error messages with line numbers

---

## 🔒 Security Notes

### ⚠️ Current Setup:
- IP Whitelist: `0.0.0.0/0` (Allow from anywhere)
- **This is OK for development**
- **NOT recommended for production**

### 🛡️ Production Recommendations:
1. Restrict IP whitelist to specific IPs
2. Use stronger passwords
3. Enable 2FA on MongoDB Atlas
4. Rotate credentials regularly
5. Use separate users for read/write access

---

## 🎯 Quick Commands

### Open MongoDB Panel:
```
Ctrl+Shift+P → MongoDB: Open Overview
```

### Create Playground:
```
Ctrl+Shift+P → MongoDB: Create MongoDB Playground
```

### Run Playground:
```
Ctrl+Alt+R (in .mongodb file)
```

### Refresh Connections:
```
Right-click connection → Refresh
```

### Disconnect:
```
Right-click connection → Disconnect
```

---

## 📚 Useful Resources

- **MongoDB for VS Code Docs**: https://www.mongodb.com/docs/mongodb-vscode/
- **MongoDB Query Language**: https://www.mongodb.com/docs/manual/tutorial/query-documents/
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/

---

## ✅ Connection Test Checklist

- [ ] MongoDB Extension installed
- [ ] Connection string added
- [ ] Successfully connected to Cluster0
- [ ] Can see all 4 databases (user, product, order, payment)
- [ ] Can view users collection in foodfast_user_db
- [ ] Can see customers (role='customer')
- [ ] Can see restaurants (role='restaurant')
- [ ] Created MongoDB Playground
- [ ] Ran test queries successfully
- [ ] Can query customerProfile and restaurantProfile

---

## 🎊 Thành công!

**Bạn đã kết nối MongoDB Atlas với VS Code!**

Bây giờ bạn có thể:
- ✅ View và query dữ liệu trực tiếp từ VS Code
- ✅ Không cần mở MongoDB Compass hay Atlas Web UI
- ✅ Viết queries với IntelliSense
- ✅ Debug và test nhanh hơn

---

## 🆘 Troubleshooting

### ❌ "Authentication failed"
- Check username/password
- Make sure credentials match: `foodfast_delivery` / `foodfast_delivery`

### ❌ "Connection timeout"
- Check internet connection
- Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)

### ❌ "Cannot find database"
- Make sure services have created databases
- Run `docker-compose up -d` to start services
- Wait for services to connect to MongoDB

### ❌ "Extension not working"
- Reload VS Code window: `Ctrl+Shift+P` → `Reload Window`
- Reinstall extension: `Ctrl+Shift+X` → Search "MongoDB" → Reinstall

---

**Need help? Ask me! 🚀**

