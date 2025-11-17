# 🚀 Quick Start: Owner Onboarding Flow

## 1️⃣ Start All Services

### Terminal 1: User Service
```powershell
cd services\user-service
npm run dev
# ✅ Running on http://localhost:3001
```

### Terminal 2: Product Service
```powershell
cd services\product-service
npm run dev
# ✅ Running on http://localhost:3003
```

### Terminal 3: Frontend
```powershell
cd frontend\Users
npm run dev
# ✅ Running on http://localhost:5000
```

---

## 2️⃣ Test Flow in Browser

### Step 1: Register Owner
1. Open: `http://localhost:5000/owner/register`
2. Fill form:
   - Email: `myrestaurant@gmail.com`
   - Password: `test123456`
   - Username: `myrestaurant`
   - Name: `My Restaurant Owner`
   - Logo URL: `https://example.com/logo.jpg`
3. Click **"Create Owner Account"**
4. ✅ Redirects to `/owner/create-restaurant`

### Step 2: Create Restaurant
1. Form auto-loads with owner_id from Step 1
2. Fill form:
   - Restaurant Name: `My Awesome Restaurant`
   - Description: `Best food in town`
   - Address: `123 Main Street`
   - Phone: `0909123456`
   - Open Time: `08:00`
   - Close Time: `22:00`
3. Click **"Mở Nhà Hàng"**
4. ✅ Redirects to `/owner/login`

### Step 3: Login
1. Fill form:
   - Email: `myrestaurant@gmail.com`
   - Password: `test123456`
2. Click **"Sign In"**
3. ✅ Redirects to `/owner/home`

---

## 3️⃣ Test Backend APIs (PowerShell)

Run the automated test script:
```powershell
cd d:\CongNghePM\DA_SERVICE\Software-Engineering
.\test-owner-flow.ps1
```

Expected output:
```
========================================
TESTING 3-STEP OWNER ONBOARDING FLOW
========================================

STEP 1: Register Owner Account
✅ SUCCESS!
   Token: eyJhbGciOiJIUzI1NiIs...
   Owner ID: 691a7cc49f02e1a9b906990f

STEP 2: Create Restaurant
✅ SUCCESS!
   Restaurant ID: 691a7cd59f02e1a9b9069910
   Restaurant Name: Pizza House 20251117103045

STEP 3: Owner Login
✅ SUCCESS!
   Token: eyJhbGciOiJIUzI1NiIs...
   Owner: Pizza House Owner

========================================
✅ ALL TESTS PASSED!
========================================
```

---

## 4️⃣ Verify in MongoDB Atlas

1. Open MongoDB Atlas
2. Switch to database: **`user_service`**
3. Check collections:
   - `users` → Should have new owner with `role: "owner"`
   - `restaurantowners` → Should have profile with `display_name`

4. Switch to database: **`product_service`**
5. Check collection:
   - `restaurants` → Should have new restaurant with `owner_id`

---

## 🎯 Expected Results

### ✅ Owner Registration (Step 1)
- Creates User document in `user_service.users`
- Creates RestaurantOwner profile in `user_service.restaurantowners`
- Returns JWT token + owner_id
- Saves to localStorage: `owner_token`, `owner_id`
- Redirects to `/owner/create-restaurant`

### ✅ Restaurant Creation (Step 2)
- Reads owner_id from localStorage
- Creates Restaurant document in `product_service.restaurants`
- Links to owner via `owner_id` field
- Redirects to `/owner/login`

### ✅ Owner Login (Step 3)
- Validates email + password
- Returns JWT token + owner object
- Saves to localStorage: `owner_token`, `owner_id`, `owner`
- Redirects to `/owner/home`

---

## 🐛 Troubleshooting

### Problem: "Unable to connect to the remote server"
**Solution**: Make sure services are running
```powershell
# Check what's running on ports
Get-NetTCPConnection | Where-Object {$_.LocalPort -in 3001,3003,5000} | Select-Object LocalPort, State
```

### Problem: "email already exists"
**Solution**: Use different email or check MongoDB Atlas
```powershell
# Use timestamp in email
$email = "owner$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
```

### Problem: Frontend not loading
**Solution**: Restart frontend dev server
```powershell
cd frontend\Users
npm run dev
```

### Problem: "Owner ID not found"
**Solution**: Complete Step 1 first, localStorage must have `owner_id`
```javascript
// Check in browser console
localStorage.getItem('owner_id')
```

---

## 📋 Routes Summary

| Step | Route | Purpose |
|------|-------|---------|
| 1 | `/owner/register` | Owner account registration |
| 2 | `/owner/create-restaurant` | Restaurant creation |
| 3 | `/owner/login` | Owner login |
| - | `/owner/home` | Owner dashboard (after login) |

---

## 🔑 localStorage Keys

After completing all steps, localStorage should contain:
- `owner_token` → JWT authentication token
- `owner_id` → MongoDB ObjectId of owner
- `owner` → JSON object with owner details

---

**Ready to test?** Open `http://localhost:5000/owner/register` 🎉
