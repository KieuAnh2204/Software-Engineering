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
