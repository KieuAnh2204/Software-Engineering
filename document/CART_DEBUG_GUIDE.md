# Cart Integration - Checklist & Debug Guide

## ✅ Pre-flight Checklist

### 1. Backend Services Status
Kiểm tra các services đang chạy:

```powershell
# Order Service (Port 3002)
curl http://localhost:3002/health

# Product Service (Port 3003)
curl http://localhost:3003/health

# User Service (Port 3001)
curl http://localhost:3001/health
```

**Expected Output:** `{"status":"OK","service":"order-service"}` cho mỗi service

### 2. Frontend Status
```powershell
# Frontend should be running on http://localhost:5000
# Check browser console for any errors
```

### 3. Environment Variables
Kiểm tra file `.env` trong `frontend/Users/`:

```bash
VITE_ORDER_API=http://localhost:3002/api/orders
VITE_USER_API=http://localhost:3001/api/auth
VITE_PRODUCT_API=http://localhost:3003/api
```

---

## 🐛 Debug Steps

### Step 1: Check Browser Console
1. Mở http://localhost:5000
2. Mở DevTools (F12)
3. Vào tab **Console**
4. Kiểm tra có errors không?

**Common Errors:**
- ❌ `useCart must be used within a CartProvider` → Provider chưa wrap đúng
- ❌ `Network Error` → Backend services chưa chạy
- ❌ `401 Unauthorized` → Chưa login hoặc token expired

### Step 2: Verify CartProvider
Kiểm tra `src/App.tsx`:

```tsx
<AuthProvider>
  <CartProvider>  {/* CartProvider phải trong AuthProvider */}
    <AdminAuthProvider>
      ...
    </AdminAuthProvider>
  </CartProvider>
</AuthProvider>
```

### Step 3: Test Login Flow
1. Mở http://localhost:5000
2. Click **Login**
3. Login với credentials:
   ```
   Email: customer@example.com
   Password: password123
   ```
4. Check localStorage có token không:
   - DevTools → Application → Local Storage → `token`

### Step 4: Test Add to Cart
1. Sau khi login, vào trang Restaurant Detail
2. Click "Add to Cart" trên một món
3. **Check Console:**
   ```
   POST http://localhost:3002/api/orders/cart/items
   Status: 200 OK
   Response: { _id, items, total_amount, ... }
   ```

4. **Check Header Badge:**
   - Badge số phải xuất hiện
   - Số phải = số lượng món trong cart

### Step 5: Test Cart Page
1. Click vào icon giỏ hàng
2. Verify:
   - ✅ Items hiển thị đúng
   - ✅ Buttons +/- hoạt động
   - ✅ Button xóa hoạt động
   - ✅ Total amount đúng

---

## 🔍 Debugging CartContext

### Check if Cart is Loading
Add console.logs trong CartContext:

```typescript
// In CartContext.tsx - addToCart function
console.log('Adding to cart:', { restaurantId, productId, quantity });

// After API call
console.log('Cart updated:', response.data);
console.log('New itemCount:', itemCount);
```

### Check if Badge is Rendering
Add console.log trong Header:

```typescript
// In Header.tsx
const { itemCount } = useCart();
console.log('Header itemCount:', itemCount);
```

### Manual API Test
Test API trực tiếp với PowerShell:

```powershell
# 1. Login to get token
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"customer@example.com","password":"password123"}'
$token = $response.token

# 2. Add item to cart
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    restaurant_id = "restaurant_id_placeholder"
    productId = "product_id_1"
    quantity = 1
} | ConvertTo-Json

$cart = Invoke-RestMethod -Uri "http://localhost:3002/api/orders/cart/items" `
    -Method POST `
    -Headers $headers `
    -Body $body

# 3. Check cart
Write-Host "Cart items count: $($cart.items.Count)"
Write-Host "Total amount: $($cart.total_amount)"
```

---

## 🔧 Common Issues & Fixes

### Issue 1: Badge không hiển thị số

**Symptoms:**
- Badge không xuất hiện
- Console không có errors

**Debug:**
```tsx
// In Header.tsx
const { itemCount } = useCart();
console.log('itemCount:', itemCount); // Should be > 0

// Check render condition
{itemCount > 0 && (  // This should be true
  <Badge>{itemCount}</Badge>
)}
```

**Fix:**
- Verify `addToCart()` được gọi thành công
- Check API response có items không
- Verify `itemCount` calculation trong CartContext

### Issue 2: API calls fail với 401

**Symptoms:**
- Console error: `401 Unauthorized`
- Cart không cập nhật

**Debug:**
```javascript
// Check token
const token = localStorage.getItem('token');
console.log('Token:', token ? 'exists' : 'missing');
```

**Fix:**
- Login lại
- Check token expiration
- Verify backend JWT_SECRET matches

### Issue 3: CORS errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3002/...' from origin 
'http://localhost:5000' has been blocked by CORS policy
```

**Fix:**
Backend phải enable CORS:
```javascript
// In order-service/src/index.js
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
```

### Issue 4: Cart không persist sau refresh

**Expected Behavior:** 
- Cart là server-side, nên sau refresh phải giữ nguyên
- CartContext cần gọi `getCart()` khi component mount

**Fix:**
Add useEffect trong component cần cart:
```typescript
useEffect(() => {
  if (isAuthenticated && restaurantId) {
    getCart(restaurantId);
  }
}, [isAuthenticated, restaurantId]);
```

### Issue 5: itemCount không cập nhật sau add

**Debug:**
```typescript
// In CartContext - after addToCart
console.log('Cart after add:', cart);
console.log('Items:', cart?.items);
console.log('Calculated itemCount:', 
  cart?.items?.reduce((sum, item) => sum + item.quantity, 0)
);
```

**Fix:**
- Verify API response structure
- Check itemCount calculation logic
- Ensure cart state is updating

---

## 📊 Expected Data Flow

### 1. Initial Load (No Cart)
```
Header renders → useCart() → itemCount = 0 → Badge hidden
```

### 2. Add to Cart
```
Click "Add to Cart"
  ↓
addToCart(restaurantId, productId, 1)
  ↓
POST /api/orders/cart/items
  ↓
Backend creates cart { items: [1 item], total_amount: 150000 }
  ↓
setCart(responseData)
  ↓
itemCount recalculates = 1
  ↓
Header re-renders → Badge shows "1"
```

### 3. Add Another Item
```
Click "Add to Cart" again
  ↓
POST /api/orders/cart/items
  ↓
Backend updates cart { items: [2 items] }
  ↓
itemCount = 2
  ↓
Badge updates to "2"
```

---

## 🧪 Testing Checklist

- [ ] Backend services đang chạy (3001, 3002, 3003)
- [ ] Frontend đang chạy (5000)
- [ ] Can login successfully
- [ ] Token saved in localStorage
- [ ] Can add item to cart (no console errors)
- [ ] Badge appears with correct number
- [ ] Badge updates when adding more items
- [ ] Cart page shows items correctly
- [ ] Can increase/decrease quantity
- [ ] Can remove items
- [ ] Empty state shows when cart is empty
- [ ] Badge disappears when cart is empty

---

## 🔄 Force Refresh Steps

Nếu vẫn không work:

1. **Clear Browser Cache:**
   ```
   Ctrl + Shift + Delete → Clear all
   ```

2. **Hard Refresh:**
   ```
   Ctrl + F5 (or Cmd + Shift + R on Mac)
   ```

3. **Clear localStorage:**
   ```javascript
   // In browser console
   localStorage.clear();
   ```

4. **Restart Frontend:**
   ```powershell
   # Stop current server (Ctrl+C)
   cd frontend/Users
   npm run dev
   ```

5. **Check for cached files:**
   ```powershell
   cd frontend/Users
   Remove-Item -Path node_modules/.vite -Recurse -Force
   npm run dev
   ```

---

## 📞 Still Not Working?

### Step-by-step debug:

1. **Open browser console** (F12)
2. **Go to Network tab**
3. **Filter: XHR**
4. **Click "Add to Cart"**
5. **Check:**
   - Request sent? (POST /cart/items)
   - Status code? (should be 200)
   - Response body? (should have cart object)
   - Headers? (Authorization header present?)

### Check React DevTools:

1. Install React DevTools extension
2. Open Components tab
3. Find `CartProvider`
4. Check state:
   ```
   cart: { items: [...], total_amount: ... }
   itemCount: 1 (or more)
   isLoading: false
   ```

### Network trace:

```powershell
# Test full flow
curl -v http://localhost:3002/api/orders/cart/items `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"restaurant_id":"rest1","productId":"prod1","quantity":1}'
```

---

## ✅ Success Criteria

Khi mọi thứ hoạt động đúng:

1. ✅ Badge xuất hiện khi có items
2. ✅ Badge số = tổng quantity của tất cả items
3. ✅ Badge update real-time khi add/remove
4. ✅ Cart page hiển thị items từ API
5. ✅ Có thể tăng/giảm quantity
6. ✅ Có thể xóa items
7. ✅ Toast notifications hoạt động
8. ✅ Không có errors trong console

---

**Last Updated:** November 18, 2025  
**Status:** Debug Guide Ready
