# ✅ User Service - Ready for Postman Testing!

## 🎉 Status: All Working!

```
✅ Service Running: http://localhost:3001
✅ MongoDB Connected: cluster0.r3lhqwd.mongodb.net
✅ Health Check: OK
✅ Registration: Working
✅ Login: Working (username or email)
```

---

## 📋 Postman Collection - Quick Setup

### 1. Import to Postman

Create a new Collection: **"FoodFast - User Service"**

### 2. Add These Requests:

---

## 🧪 Test Endpoints

### 1️⃣ Health Check ✅

```
Method: GET
URL: http://localhost:3001/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "user-service",
  "timestamp": "2025-10-16T03:43:13.149Z"
}
```

---

### 2️⃣ Register User ✅

```
Method: POST
URL: http://localhost:3001/api/auth/register
Headers:
  Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+84901234567"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "67xxxxx",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3️⃣ Login (with username) ✅

```
Method: POST
URL: http://localhost:3001/api/auth/login
Headers:
  Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "postman_test",
  "password": "test123456"
}
```

**Response (200):**
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

### 4️⃣ Login (with email) ✅

```
Method: POST
URL: http://localhost:3001/api/auth/login
Headers:
  Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "postman@example.com",
  "password": "test123456"
}
```

---

### 5️⃣ Get Profile (Requires Token)

```
Method: GET
URL: http://localhost:3001/api/users/profile
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE
```

**How to get token:**
1. Login first (request #3 or #4)
2. Copy the `token` from response
3. In Postman, go to "Authorization" tab
4. Select "Bearer Token"
5. Paste token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "67xxxxx",
    "username": "postman_test",
    "email": "postman@example.com",
    "fullName": "Postman Test User",
    "phone": "+84901234567",
    "role": "user",
    "createdAt": "2025-10-16T..."
  }
}
```

---

### 6️⃣ Update Profile (Requires Token)

```
Method: PUT
URL: http://localhost:3001/api/users/profile
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "fullName": "Updated Name",
  "phone": "+84909876543",
  "address": {
    "street": "123 Main St",
    "city": "Ho Chi Minh",
    "state": "HCM",
    "zipCode": "700000"
  }
}
```

---

## 🎯 Testing Flow

### Complete Test Sequence:

```
1. Health Check          → Verify service is running
2. Register             → Create new user
3. Login (username)     → Get token
4. Get Profile          → Use token from step 3
5. Update Profile       → Use token from step 3
6. Login (email)        → Alternative login method
```

---

## 🔐 Authentication

### Using Bearer Token in Postman:

#### Method 1: Authorization Tab
1. Click on request
2. Go to **"Authorization"** tab
3. Type: Select **"Bearer Token"**
4. Token: Paste your JWT token

#### Method 2: Headers Tab
1. Go to **"Headers"** tab
2. Add new header:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📊 Expected Responses

| Endpoint | Status | Response |
|----------|--------|----------|
| GET /health | 200 | Service status |
| POST /register | 201 | User + Token |
| POST /login | 200 | User + Token |
| GET /profile | 200 | User details |
| PUT /profile | 200 | Updated user |

---

## ❌ Error Responses

### Duplicate Username (400):
```json
{
  "message": "Username already exists"
}
```

### Invalid Credentials (401):
```json
{
  "message": "Invalid credentials"
}
```

### Missing Token (401):
```json
{
  "message": "No token provided"
}
```

### Validation Error (400):
```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Password must be at least 6 characters",
      "path": "password",
      "location": "body"
    }
  ]
}
```

---

## 🧪 Test Data

### Sample Users:

```json
// User 1
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "alice123",
  "fullName": "Alice Johnson",
  "phone": "+84901111111"
}

// User 2
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "bob123456",
  "fullName": "Bob Smith",
  "phone": "+84902222222"
}

// Restaurant Owner
{
  "username": "owner1",
  "email": "owner@restaurant.com",
  "password": "owner123",
  "fullName": "Restaurant Owner",
  "phone": "+84903333333",
  "role": "owner"
}
```

---

## 🔧 Environment Variables (Optional)

Create Postman Environment:

```
base_url: http://localhost:3001
token: (will be set after login)
```

Then use in requests:
```
URL: {{base_url}}/api/auth/login
Authorization: Bearer {{token}}
```

---

## 📸 Postman Screenshots

### Setting Up Collection:
1. Click **"New"** → **"HTTP"**
2. Enter URL: `http://localhost:3001/health`
3. Click **"Send"**
4. Should see `status: "OK"`

### Adding Authorization:
1. After login, copy token from response
2. Click on next request
3. **"Authorization"** tab
4. Type: **"Bearer Token"**
5. Paste token

---

## ✅ Verified Working!

```
✅ Health Check        - TESTED ✓
✅ Register User       - TESTED ✓
✅ Login (username)    - TESTED ✓
✅ Login (email)       - TESTED ✓
✅ Get Profile         - Ready to test
✅ Update Profile      - Ready to test
```

**Test User Created:**
- Username: `postman_test`
- Email: `postman@example.com`
- Password: `test123456`
- Token: Available after login

---

## 🚀 Next Steps

1. ✅ Open Postman
2. ✅ Create new collection
3. ✅ Add all 6 requests
4. ✅ Test health check
5. ✅ Register new user
6. ✅ Login and get token
7. ✅ Test profile endpoints

---

## 📚 Full Documentation

- **POSTMAN_TESTING_GUIDE.md** - Complete guide
- **DOCKER_SUCCESS.md** - Docker setup
- **services/README.md** - All API docs

---

**🎊 User Service is ready for Postman testing!**

Start with Health Check, then follow the test sequence above.
# Postman Testing Guide - FoodFast Delivery API

## 🎯 User Service API Testing (Port 3001)

### ✅ Status: User Service đang chạy và kết nối MongoDB thành công!

---

## 📋 Setup Postman

### 1. Tạo Collection mới:
- Mở Postman
- Click **"New"** → **"Collection"**
- Đặt tên: `FoodFast Delivery - User Service`

### 2. Set Base URL (Optional):
- Click vào Collection → **"Variables"**
- Tạo variable:
  - Variable: `base_url`
  - Initial Value: `http://localhost:3001`
  - Current Value: `http://localhost:3001`

---

## 🧪 Test Endpoints

### 1️⃣ Health Check (GET)

**Endpoint:** `GET http://localhost:3001/health`

**Expected Response:**
```json
{
  "status": "OK",
  "service": "user-service",
  "timestamp": "2025-10-16T03:43:13.149Z"
}
```

**Status Code:** `200 OK`

---

### 2️⃣ Register User (POST)

**Endpoint:** `POST http://localhost:3001/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+84901234567"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "67xxxxxxxxxxxxx",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "phone": "+84901234567",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Code:** `201 Created`

---

### 3️⃣ Login (POST)

**Endpoint:** `POST http://localhost:3001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "67xxxxxxxxxxxxx",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Code:** `200 OK`

**💡 Tip:** Copy token để dùng cho các requests khác!

---

### 4️⃣ Get User Profile (GET) - Requires Authentication

**Endpoint:** `GET http://localhost:3001/api/users/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67xxxxxxxxxxxxx",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "role": "user",
    "createdAt": "2025-10-16T03:45:00.000Z"
  }
}
```

**Status Code:** `200 OK`

---

### 5️⃣ Update User Profile (PUT) - Requires Authentication

**Endpoint:** `PUT http://localhost:3001/api/users/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "fullName": "John Doe Updated",
  "phone": "+84909999999",
  "address": {
    "street": "123 Main St",
    "city": "Ho Chi Minh",
    "state": "HCM",
    "zipCode": "700000"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "67xxxxxxxxxxxxx",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe Updated",
    "phone": "+84909999999",
    "address": {
      "street": "123 Main St",
      "city": "Ho Chi Minh",
      "state": "HCM",
      "zipCode": "700000"
    },
    "role": "user"
  }
}
```

**Status Code:** `200 OK`

---

## 🔐 Authentication Flow

### Step-by-Step:

1. **Register** new user → Get token
2. **Login** with credentials → Get token
3. Use token in **Authorization header** for protected routes:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 📸 Postman Screenshots Guide

### Setting Authorization Header:

1. Click on request → **"Headers"** tab
2. Add new header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`

### Using Variables:

1. In URL field, use: `{{base_url}}/api/auth/login`
2. Postman will auto-replace with `http://localhost:3001`

---

## 🧪 Test Scenarios

### Scenario 1: Complete User Registration Flow

```
1. POST /health                    → Check service is running
2. POST /api/auth/register         → Create new user
3. POST /api/auth/login            → Login with credentials
4. GET /api/users/profile          → Get user profile
5. PUT /api/users/profile          → Update profile
```

### Scenario 2: Error Handling

**Test duplicate username:**
```json
POST /api/auth/register
{
  "username": "john_doe",  // Same username
  "email": "another@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Username already exists"
}
```

**Status Code:** `400 Bad Request`

---

## 🔍 Validation Tests

### Missing Required Fields:

```json
POST /api/auth/register
{
  "username": "testuser"
  // Missing email, password, fullName
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    "Email is required",
    "Password is required",
    "Full name is required"
  ]
}
```

**Status Code:** `400 Bad Request`

---

## 📊 Expected Status Codes

| Status Code | Meaning | When |
|------------|---------|------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (register) |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | User not found |
| 409 | Conflict | Duplicate username/email |
| 500 | Server Error | Internal server error |

---

## 🎯 Quick Test with PowerShell (Alternative)

### Health Check:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### Register:
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
    phone = "+84901234567"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Login:
```powershell
$body = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

# Save token
$token = $response.data.token
Write-Host "Token: $token"
```

### Get Profile (with token):
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/users/profile" `
    -Method Get `
    -Headers $headers
```

---

## ✅ Checklist

### Before Testing:
- [ ] Docker containers are running (`docker ps`)
- [ ] User Service is healthy (`GET /health`)
- [ ] MongoDB is connected (check logs)

### Test All Endpoints:
- [ ] Health Check
- [ ] Register User
- [ ] Login
- [ ] Get Profile (with token)
- [ ] Update Profile (with token)

### Error Cases:
- [ ] Register with duplicate username
- [ ] Login with wrong password
- [ ] Access profile without token
- [ ] Register with missing fields

---

## 🐛 Common Issues

### "Connection refused"
- Check if service is running: `docker ps`
- Restart service: `docker-compose restart user-service`

### "MongoDB connection error"
- Check MongoDB Atlas whitelist (allow 0.0.0.0/0)
- Verify connection string in `.env`

### "Invalid token"
- Token might be expired (7 days)
- Get new token by logging in again

---

## 📚 Next Steps

After User Service works:
1. Test Product Service (Port 3003)
2. Test Order Service (Port 3002)
3. Test Payment Service (Port 3004)

---

**🎊 Happy Testing with Postman!**

Need help? Check `DOCKER_SUCCESS.md` for full documentation.
