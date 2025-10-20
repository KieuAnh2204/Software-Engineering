# 🧪 Customer Register/Login Testing Guide

## 📅 Date: October 21, 2025
## 🎯 Service: User Service - Authentication Flow

---

## 🔐 **Authentication Flow Overview**

```
┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER REGISTRATION                   │
├─────────────────────────────────────────────────────────┤
│  1. POST /api/auth/register                             │
│     ↓                                                    │
│  2. Validate input (express-validator)                  │
│     ↓                                                    │
│  3. Check if user exists (email/username)               │
│     ↓                                                    │
│  4. Create user with bcrypt password hash               │
│     ↓                                                    │
│  5. Generate JWT token (7 days expiry)                  │
│     ↓                                                    │
│  6. Return user info + token                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER LOGIN                        │
├─────────────────────────────────────────────────────────┤
│  1. POST /api/auth/login                                │
│     ↓                                                    │
│  2. Find user by email or username                      │
│     ↓                                                    │
│  3. Check if account is deleted/inactive/locked         │
│     ↓                                                    │
│  4. Compare password with bcrypt                        │
│     ↓                                                    │
│  5. Track failed login attempts (lock after 5)          │
│     ↓                                                    │
│  6. Reset login attempts on success                     │
│     ↓                                                    │
│  7. Update lastLogin timestamp                          │
│     ↓                                                    │
│  8. Generate JWT token                                  │
│     ↓                                                    │
│  9. Return user info + token                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   GET USER PROFILE                       │
├─────────────────────────────────────────────────────────┤
│  1. GET /api/auth/profile                               │
│     ↓                                                    │
│  2. Verify JWT token from Authorization header          │
│     ↓                                                    │
│  3. Check if user exists & active                       │
│     ↓                                                    │
│  4. Return user profile data                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 **API Endpoints**

### Base URL:
```
http://localhost:3001
```

---

## 1️⃣ **REGISTER CUSTOMER**

### Endpoint:
```
POST http://localhost:3001/api/auth/register
```

### Headers:
```
Content-Type: application/json
```

### Request Body:
```json
{
  "username": "customer_test",
  "email": "customer@test.com",
  "password": "password123",
  "fullName": "Test Customer",
  "phone": "0912345678",
  "role": "customer"
}
```

### Required Fields:
- ✅ **username** (3-30 characters, unique)
- ✅ **email** (valid email format, unique)
- ✅ **password** (minimum 6 characters)
- ✅ **phone** (Vietnamese phone number)
- ⚪ **fullName** (optional, max 100 characters)
- ⚪ **role** (optional, defaults to "customer")

### Expected Response (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "67123abc...",
      "username": "customer_test",
      "email": "customer@test.com",
      "role": "customer",
      "fullName": "Test Customer",
      "phone": "0912345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses:

**400 - Validation Error:**
```json
{
  "errors": [
    {
      "msg": "Username must be 3-30 characters",
      "param": "username",
      "location": "body"
    }
  ]
}
```

**400 - User Already Exists:**
```json
{
  "message": "User already exists with this email or username"
}
```

---

## 2️⃣ **LOGIN CUSTOMER (Email)**

### Endpoint:
```
POST http://localhost:3001/api/auth/login
```

### Headers:
```
Content-Type: application/json
```

### Request Body (Login with Email):
```json
{
  "email": "customer@test.com",
  "password": "password123"
}
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "67123abc...",
      "username": "customer_test",
      "email": "customer@test.com",
      "role": "customer",
      "fullName": "Test Customer",
      "phone": "0912345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3️⃣ **LOGIN CUSTOMER (Username)**

### Request Body (Login with Username):
```json
{
  "username": "customer_test",
  "password": "password123"
}
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 4️⃣ **GET USER PROFILE**

### Endpoint:
```
GET http://localhost:3001/api/auth/profile
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67123abc...",
    "username": "customer_test",
    "email": "customer@test.com",
    "role": "customer",
    "fullName": "Test Customer",
    "phone": "0912345678",
    "isActive": true,
    "isDeleted": false,
    "customerProfile": {
      "favoriteRestaurants": [],
      "orderHistory": []
    },
    "createdAt": "2025-10-21T10:00:00.000Z",
    "updatedAt": "2025-10-21T10:00:00.000Z"
  }
}
```

---

## 🚨 **Error Scenarios to Test**

### 1. Invalid Credentials (Wrong Password):
**Request:**
```json
{
  "email": "customer@test.com",
  "password": "wrongpassword"
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Notes:**
- ⚠️ After 5 failed attempts, account will be locked for 2 hours
- Each failed login increments `loginAttempts` counter

---

### 2. Account Locked (After 5 Failed Attempts):
**Response (401):**
```json
{
  "success": false,
  "message": "Account is locked due to too many failed login attempts. Please try again later."
}
```

---

### 3. Account Deactivated:
**Response (401):**
```json
{
  "success": false,
  "message": "Account is deactivated. Please contact support."
}
```

---

### 4. Account Deleted:
**Response (401):**
```json
{
  "success": false,
  "message": "Account has been deleted"
}
```

---

### 5. No Token Provided:
**Request:** GET /api/auth/profile (without Authorization header)

**Response (401):**
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

---

### 6. Invalid Token:
**Request:** GET /api/auth/profile with invalid token

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

### 7. Expired Token:
**Request:** GET /api/auth/profile with expired token

**Response (401):**
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

## 🔧 **Password Hashing Details**

### Bcrypt Configuration:
```javascript
// In User model pre-save hook
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
```

### Password Comparison:
```javascript
// In User model comparePassword method
return await bcrypt.compare(candidatePassword, this.password);
```

### Security Features:
- ✅ Passwords never stored in plain text
- ✅ Salt rounds: 10 (secure for production)
- ✅ Password field excluded from JSON responses
- ✅ Password field excluded from normal queries (use `.select('+password')`)

---

## 🔐 **JWT Token Details**

### Token Generation:
```javascript
jwt.sign(
  { id: userId }, 
  process.env.JWT_SECRET, 
  { expiresIn: '7d' }
)
```

### Token Payload:
```json
{
  "id": "67123abc...",
  "iat": 1697889600,
  "exp": 1698494400
}
```

### Token Verification:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Token Usage:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 **Postman Collection Setup**

### 1. Create Environment Variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3001` | `http://localhost:3001` |
| `token` | (empty) | (will be auto-set) |
| `customer_email` | `customer@test.com` | `customer@test.com` |
| `customer_password` | `password123` | `password123` |

---

### 2. Auto-Save Token After Login:

Go to **Login** request → **Tests** tab → Add this script:

```javascript
// Auto-save token to environment variable
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        console.log("✅ Token saved:", jsonData.data.token);
    }
}
```

---

### 3. Use Token in Profile Request:

Headers:
```
Authorization: Bearer {{token}}
```

---

## 🧪 **Testing Checklist**

### Basic Flow:
- [ ] ✅ Register new customer
- [ ] ✅ Login with email
- [ ] ✅ Login with username
- [ ] ✅ Get profile with token
- [ ] ✅ Token auto-saved to environment

### Validation:
- [ ] ✅ Register with short username (< 3 chars) → Error
- [ ] ✅ Register with invalid email → Error
- [ ] ✅ Register with short password (< 6 chars) → Error
- [ ] ✅ Register with existing email → Error
- [ ] ✅ Register with existing username → Error
- [ ] ✅ Login without password → Error

### Security:
- [ ] ✅ Login with wrong password → Error
- [ ] ✅ Login 5 times with wrong password → Account locked
- [ ] ✅ Get profile without token → Error
- [ ] ✅ Get profile with invalid token → Error
- [ ] ✅ Password is hashed in database (check MongoDB)
- [ ] ✅ Password not returned in responses

### Account States:
- [ ] ✅ Login to deactivated account → Error
- [ ] ✅ Login to deleted account → Error
- [ ] ✅ Get profile of inactive user → Error

---

## 🔍 **How to Verify in MongoDB**

### Connect to MongoDB Atlas:
```javascript
// In MongoDB Playground or Compass
use foodfast_user_db

// Find the test user
db.users.findOne({ email: "customer@test.com" })
```

### Check Password is Hashed:
```javascript
{
  "_id": ObjectId("..."),
  "username": "customer_test",
  "email": "customer@test.com",
  "password": "$2a$10$abcd1234...efgh5678", // ✅ Bcrypt hash
  "role": "customer",
  "isActive": true,
  "loginAttempts": 0,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### Verify Password Format:
- ✅ Starts with `$2a$` or `$2b$` (bcrypt identifier)
- ✅ Contains `$10$` (salt rounds)
- ✅ 60 characters long
- ✅ Never matches plain text password

---

## 🚀 **Quick Test Script (PowerShell)**

### 1. Register Customer:
```powershell
$registerBody = @{
    username = "customer_test"
    email = "customer@test.com"
    password = "password123"
    fullName = "Test Customer"
    phone = "0912345678"
    role = "customer"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $registerBody

Write-Host "✅ Token:" $response.data.token
$token = $response.data.token
```

### 2. Login:
```powershell
$loginBody = @{
    email = "customer@test.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

Write-Host "✅ Login successful"
$token = $response.data.token
```

### 3. Get Profile:
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$profile = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" `
    -Method Get `
    -Headers $headers

Write-Host "✅ Profile:"
$profile.data | ConvertTo-Json
```

---

## 📊 **Performance Metrics**

| Operation | Expected Time |
|-----------|---------------|
| Register | < 500ms |
| Login | < 300ms |
| Get Profile | < 100ms |
| Token Verification | < 50ms |

**Note:** Bcrypt hashing adds ~200-300ms to register/login time (this is normal and secure)

---

## 🔧 **Troubleshooting**

### Issue 1: "User already exists"
**Solution:** Use different email/username or delete existing user

### Issue 2: "Invalid credentials"
**Check:**
- Password is correct
- Account is not locked/deleted/deactivated
- Email/username is correct

### Issue 3: "Not authorized, no token"
**Check:**
- Token is in Authorization header
- Format: `Bearer <token>`
- Token is not expired

### Issue 4: Account locked
**Solution:** Wait 2 hours or use admin endpoint to unlock:
```
PUT /api/admin/users/:id/unlock
```

---

## ✅ **Success Indicators**

1. ✅ Register returns token
2. ✅ Login returns token
3. ✅ Password is hashed in database
4. ✅ Token works for protected routes
5. ✅ Failed logins increment counter
6. ✅ Account locks after 5 failed attempts
7. ✅ lastLogin updates on successful login
8. ✅ Password never appears in responses

---

## 📚 **Related Documentation**

- **POSTMAN_TESTING_GUIDE.md** - Full Postman guide
- **MONGODB_VSCODE_SETUP.md** - How to view data in MongoDB
- **PRD_VS_SCHEMA_COMPARISON.md** - Schema details

---

*Updated: October 21, 2025*
*FoodFast Delivery - User Service Authentication*
