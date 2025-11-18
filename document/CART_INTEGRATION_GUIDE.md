# Cart Integration Guide - Frontend

## Tổng quan

Đã tích hợp **CartContext** vào frontend để quản lý giỏ hàng real-time với backend API. Khi customer thêm sản phẩm vào giỏ hàng, số lượng trên icon giỏ hàng (badge) sẽ cập nhật tự động.

---

## 📦 Files đã tạo/cập nhật

### Files mới:
- ✅ `src/contexts/CartContext.tsx` - Context quản lý giỏ hàng
- ✅ `.env.example` - Environment variables template

### Files cập nhật:
- ✅ `src/App.tsx` - Wrap với CartProvider
- ✅ `src/components/Header.tsx` - Hiển thị itemCount từ cart
- ✅ `src/pages/RestaurantDetail.tsx` - Tích hợp addToCart
- ✅ `src/pages/Cart.tsx` - Hiển thị cart từ API, cập nhật số lượng, xóa món

---

## 🎯 Chức năng đã implement

### 1. **CartContext** (`src/contexts/CartContext.tsx`)

Provider quản lý toàn bộ cart operations:

```typescript
const {
  cart,              // Cart object từ API
  itemCount,         // Tổng số món trong giỏ
  isLoading,         // Loading state
  addToCart,         // Thêm món vào giỏ
  updateCartItem,    // Cập nhật số lượng
  removeFromCart,    // Xóa món khỏi giỏ
  clearCart,         // Xóa toàn bộ giỏ
  getCart,           // Lấy giỏ hàng từ API
  refreshCart,       // Refresh giỏ hàng
} = useCart();
```

### 2. **Header Badge** - Hiển thị số lượng real-time

**Before:**
```tsx
<Badge>3</Badge>  // Số cứng
```

**After:**
```tsx
{itemCount > 0 && (
  <Badge>{itemCount}</Badge>  // Số động từ cart
)}
```

### 3. **Add to Cart** - RestaurantDetail

**Before:**
```tsx
const handleAddToCartClick = (itemId, itemName) => {
  console.log(`Added ${itemName} to cart`);
};
```

**After:**
```tsx
const handleAddToCartClick = async (itemId, itemName) => {
  try {
    await addToCart(restaurantId, itemId, 1);
    toast({ title: "Added to cart" });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
};
```

### 4. **Cart Page** - Quản lý giỏ hàng

**Features:**
- ✅ Hiển thị items từ API
- ✅ Tăng/giảm số lượng món
- ✅ Xóa món khỏi giỏ
- ✅ Hiển thị empty state
- ✅ Tính tổng tiền tự động

---

## 🔧 Setup Instructions

### 1. Cấu hình Environment Variables

Tạo file `.env` trong `frontend/Users/`:

```bash
# Copy từ .env.example
cp .env.example .env
```

Nội dung `.env`:
```bash
VITE_USER_API=http://localhost:3001/api/auth
VITE_PRODUCT_API=http://localhost:3003/api
VITE_ORDER_API=http://localhost:3002/api/orders
VITE_PAYMENT_API=http://localhost:3004/api/payments
```

### 2. Install Dependencies (nếu cần)

```bash
cd frontend/Users
npm install axios
```

### 3. Start Frontend

```bash
npm run dev
```

---

## 🧪 Testing Flow

### Test Case 1: Thêm món vào giỏ hàng

**Steps:**
1. Đăng nhập với customer account
2. Vào trang restaurant detail
3. Click "Add to Cart" trên một món ăn
4. **Expected:** 
   - Toast notification "Added to cart"
   - Badge số trên icon giỏ hàng tăng lên
   - Console không có errors

**API Call:**
```
POST http://localhost:3002/api/orders/cart/items
Headers: Authorization: Bearer {token}
Body: {
  "restaurant_id": "restaurant_id",
  "productId": "product_id",
  "quantity": 1
}
```

### Test Case 2: Xem giỏ hàng

**Steps:**
1. Click vào icon giỏ hàng
2. **Expected:**
   - Hiển thị danh sách món đã thêm
   - Hiển thị số lượng, giá, tổng tiền
   - Có buttons tăng/giảm số lượng, xóa món

### Test Case 3: Cập nhật số lượng

**Steps:**
1. Trong Cart page, click nút "+" hoặc "-"
2. **Expected:**
   - Số lượng món thay đổi
   - Tổng tiền cập nhật
   - Badge trên header cập nhật

**API Call:**
```
PATCH http://localhost:3002/api/orders/cart/items/{itemId}
Headers: Authorization: Bearer {token}
Body: {
  "restaurant_id": "restaurant_id",
  "quantity": 3
}
```

### Test Case 4: Xóa món khỏi giỏ

**Steps:**
1. Click icon trash trên một món
2. **Expected:**
   - Món bị xóa khỏi giỏ
   - Toast "Item removed"
   - Badge cập nhật
   - Nếu giỏ rỗng → hiển thị empty state

### Test Case 5: Empty Cart State

**Steps:**
1. Xóa tất cả món khỏi giỏ
2. **Expected:**
   - Hiển thị "Your cart is empty"
   - Button "Browse Restaurants"
   - Badge trên header biến mất

### Test Case 6: Unauthenticated User

**Steps:**
1. Logout hoặc chưa đăng nhập
2. Click "Add to Cart"
3. **Expected:**
   - Hiển thị Login Dialog
   - Sau khi login thành công → món được thêm vào giỏ

---

## 🔄 API Integration Flow

### Flow khi thêm món vào giỏ:

```
1. User clicks "Add to Cart"
   ↓
2. Frontend: addToCart(restaurantId, productId, quantity)
   ↓
3. POST /api/orders/cart/items
   Headers: { Authorization: Bearer {token} }
   Body: { restaurant_id, productId, quantity }
   ↓
4. Backend (Order Service):
   - Verify authentication
   - Fetch product details from Product Service
   - Create/Update cart order (status='cart')
   - Calculate total_amount
   - Return updated cart
   ↓
5. Frontend: setCart(response.data)
   ↓
6. UI updates:
   - itemCount recalculates
   - Header badge updates
   - Toast notification shows
```

---

## 🎨 UI Components Updated

### Header.tsx
```tsx
// Badge chỉ hiển thị khi có items
{itemCount > 0 && (
  <Badge className="absolute -top-1 -right-1">
    {itemCount}
  </Badge>
)}
```

### Cart.tsx
```tsx
// Empty state
if (!cart || cartItems.length === 0) {
  return <EmptyCartView />;
}

// Cart items
{cartItems.map(item => (
  <CartItem
    item={item}
    onIncrease={() => handleUpdateQuantity(item._id, item.quantity, 1)}
    onDecrease={() => handleUpdateQuantity(item._id, item.quantity, -1)}
    onRemove={() => handleRemoveItem(item._id)}
  />
))}
```

---

## 🔒 Authentication Integration

CartContext tự động lấy token từ localStorage:

```typescript
const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

const createOrderClient = () => {
  const token = getToken();
  return axios.create({
    baseURL: ORDER_API,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
```

Nếu user chưa đăng nhập:
- `getToken()` returns `null`
- API calls sẽ fail với 401
- Frontend hiển thị Login Dialog

---

## 📊 State Management

### Cart State Structure:
```typescript
interface Cart {
  _id: string;                    // Cart ID
  customer_id: string;            // User ID
  restaurant_id: string;          // Restaurant ID
  status: 'cart';                 // Always 'cart'
  items: CartItem[];              // Array of items
  total_amount: number;           // Auto-calculated
}

interface CartItem {
  _id: string;                    // Item ID
  productId: string;              // Product ID
  name: string;                   // Product name
  price: number;                  // Price at snapshot (VND)
  quantity: number;               // Quantity
  image?: string;                 // Image URL
  notes?: string;                 // Special notes
}
```

### itemCount Calculation:
```typescript
const itemCount = cart?.items?.reduce(
  (sum, item) => sum + item.quantity, 
  0
) || 0;
```

---

## 🐛 Error Handling

### 1. API Errors
```typescript
try {
  await addToCart(restaurantId, productId, 1);
} catch (error: any) {
  toast({
    title: "Error",
    description: error.response?.data?.message || "Failed to add to cart",
    variant: "destructive",
  });
}
```

### 2. Authentication Errors (401)
```typescript
if (error.response?.status === 401) {
  // Token expired or invalid
  setShowLoginDialog(true);
}
```

### 3. Network Errors
```typescript
catch (error) {
  console.error("Network error:", error);
  toast({
    title: "Connection Error",
    description: "Please check your internet connection",
    variant: "destructive",
  });
}
```

---

## 🚀 Production Considerations

### 1. Environment Variables
Production `.env`:
```bash
VITE_ORDER_API=https://api.foodfast.com/api/orders
VITE_USER_API=https://api.foodfast.com/api/auth
VITE_PRODUCT_API=https://api.foodfast.com/api
```

### 2. Error Boundaries
Wrap CartProvider with Error Boundary:
```tsx
<ErrorBoundary>
  <CartProvider>
    <App />
  </CartProvider>
</ErrorBoundary>
```

### 3. Loading States
```tsx
{isLoading && <LoadingSpinner />}
<Button disabled={isLoading}>Add to Cart</Button>
```

### 4. Optimistic Updates (Future Enhancement)
```typescript
// Update UI immediately
setCart(optimisticCart);

// Then sync with backend
try {
  const response = await api.updateCart();
  setCart(response.data);
} catch (error) {
  // Rollback on error
  setCart(previousCart);
}
```

---

## 📝 TODO / Future Enhancements

- [ ] Implement cart persistence (save to localStorage)
- [ ] Add cart expiration warning (24h)
- [ ] Implement optimistic UI updates
- [ ] Add cart item notes editing
- [ ] Show restaurant info in cart
- [ ] Add "Recently viewed" items
- [ ] Implement cart sharing (share cart link)
- [ ] Add cart analytics tracking
- [ ] Implement multi-restaurant cart warning
- [ ] Add promotional code support

---

## 🎯 Key Features Implemented

### ✅ Real-time Cart Updates
- Badge updates immediately after add/remove
- Total recalculates automatically
- UI reflects backend state

### ✅ Seamless API Integration
- CartContext handles all API calls
- Error handling với toast notifications
- Loading states cho better UX

### ✅ Authentication Integration
- Auto-attach JWT token
- Handle 401 errors gracefully
- Login dialog for unauthenticated users

### ✅ Responsive UI
- Works on mobile, tablet, desktop
- Loading indicators
- Empty states
- Error messages

---

## 📞 Support

Nếu gặp vấn đề:
1. Check browser console for errors
2. Verify `.env` file exists với correct URLs
3. Check backend services đang chạy
4. Verify token trong localStorage (DevTools → Application → Local Storage)
5. Test API endpoints với Postman

---

**Last Updated**: November 18, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
